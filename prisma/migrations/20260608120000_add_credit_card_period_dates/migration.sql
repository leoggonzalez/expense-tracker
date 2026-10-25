ALTER TABLE "Space"
ADD COLUMN "periodStartDate" TIMESTAMP(3),
ADD COLUMN "periodEndDate" TIMESTAMP(3);

CREATE OR REPLACE FUNCTION "getSpaceProjectionMonthStart"(
  space_type text,
  payment_due_day integer,
  period_start timestamp,
  period_end timestamp,
  occurrence_date timestamp
)
RETURNS timestamp
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  anchor_offset integer;
  cycle_offset integer;
  cycle_start timestamp;
  cycle_end timestamp;
  due_date timestamp;
  due_month_start timestamp;
BEGIN
  IF
    space_type IS DISTINCT FROM 'credit_card'
    OR payment_due_day IS NULL
    OR period_start IS NULL
    OR period_end IS NULL
    OR period_end < period_start
  THEN
    RETURN date_trunc('month', occurrence_date);
  END IF;

  anchor_offset :=
    (EXTRACT(YEAR FROM occurrence_date)::integer - EXTRACT(YEAR FROM period_start)::integer) * 12
    + (EXTRACT(MONTH FROM occurrence_date)::integer - EXTRACT(MONTH FROM period_start)::integer);

  FOR cycle_offset IN (anchor_offset - 2)..(anchor_offset + 2) LOOP
    cycle_start := period_start + make_interval(months => cycle_offset);
    cycle_end := period_end + make_interval(months => cycle_offset);

    IF occurrence_date >= cycle_start AND occurrence_date <= cycle_end THEN
      due_month_start := date_trunc('month', cycle_end);
      due_date :=
        due_month_start
        + make_interval(
            days => LEAST(
              payment_due_day,
              EXTRACT(DAY FROM due_month_start + interval '1 month - 1 day')::integer
            ) - 1
          );

      IF due_date <= cycle_end THEN
        due_month_start := due_month_start + interval '1 month';
        due_date :=
          due_month_start
          + make_interval(
              days => LEAST(
                payment_due_day,
                EXTRACT(DAY FROM due_month_start + interval '1 month - 1 day')::integer
              ) - 1
            );
      END IF;

      RETURN date_trunc('month', due_date);
    END IF;
  END LOOP;

  RETURN date_trunc('month', occurrence_date);
END;
$$;
