-- The cutoff starts the next statement period (inclusive).
-- The statement closing in a month is paid in the following calendar month.
-- Keep the existing signature and column name for deployment compatibility.
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
  occurrence_month timestamp;
  cutoff_date timestamp;
BEGIN
  IF space_type IS DISTINCT FROM 'credit_card'
    OR payment_due_day IS NULL
    OR period_end_day IS NULL
  THEN
    RETURN date_trunc('month', occurrence_date);
  END IF;

  occurrence_month := date_trunc('month', occurrence_date);
  cutoff_date := occurrence_month + make_interval(days => LEAST(
    period_end_day,
    EXTRACT(DAY FROM occurrence_month + interval '1 month - 1 day')::integer
  ) - 1);

  IF occurrence_date >= cutoff_date THEN
    RETURN occurrence_month + interval '2 months';
  END IF;

  RETURN occurrence_month + interval '1 month';
END;
$$;
