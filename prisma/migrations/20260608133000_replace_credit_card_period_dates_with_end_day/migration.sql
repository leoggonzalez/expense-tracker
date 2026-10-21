ALTER TABLE "Space"
ADD COLUMN "periodEndDay" INTEGER;

UPDATE "Space"
SET "periodEndDay" = EXTRACT(DAY FROM "periodEndDate")::integer
WHERE "periodEndDate" IS NOT NULL;

ALTER TABLE "Space"
DROP COLUMN "periodStartDate",
DROP COLUMN "periodEndDate";

DROP FUNCTION IF EXISTS "getSpaceProjectionMonthStart"(
  text,
  integer,
  timestamp,
  timestamp,
  timestamp
);

CREATE OR REPLACE FUNCTION "getSpaceProjectionMonthStart"(
  space_type text,
  payment_due_day integer,
  period_end_day integer,
  occurrence_date timestamp
)
RETURNS timestamp
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  period_month_start timestamp;
  period_end timestamp;
  due_month_start timestamp;
  due_date timestamp;
BEGIN
  IF
    space_type IS DISTINCT FROM 'credit_card'
    OR payment_due_day IS NULL
    OR period_end_day IS NULL
  THEN
    RETURN date_trunc('month', occurrence_date);
  END IF;

  period_month_start := date_trunc('month', occurrence_date);
  period_end :=
    period_month_start
    + make_interval(
        days => LEAST(
          period_end_day,
          EXTRACT(DAY FROM period_month_start + interval '1 month - 1 day')::integer
        ) - 1
      );

  IF occurrence_date > period_end THEN
    period_month_start := period_month_start + interval '1 month';
    period_end :=
      period_month_start
      + make_interval(
          days => LEAST(
            period_end_day,
            EXTRACT(DAY FROM period_month_start + interval '1 month - 1 day')::integer
          ) - 1
        );
  END IF;

  due_month_start := date_trunc('month', period_end);
  due_date :=
    due_month_start
    + make_interval(
        days => LEAST(
          payment_due_day,
          EXTRACT(DAY FROM due_month_start + interval '1 month - 1 day')::integer
        ) - 1
      );

  IF due_date <= period_end THEN
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
END;
$$;
