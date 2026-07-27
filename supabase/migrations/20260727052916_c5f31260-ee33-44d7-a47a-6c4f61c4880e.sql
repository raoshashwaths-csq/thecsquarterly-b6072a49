
CREATE OR REPLACE FUNCTION public.admin_scheduled_job_health()
RETURNS TABLE(
  jobname text,
  schedule text,
  active boolean,
  last_start timestamptz,
  last_end timestamptz,
  last_status text,
  last_message text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, cron
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    j.jobname::text,
    j.schedule::text,
    j.active,
    d.start_time,
    d.end_time,
    d.status::text,
    LEFT(COALESCE(d.return_message, ''), 500) AS last_message
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT start_time, end_time, status, return_message
    FROM cron.job_run_details r
    WHERE r.jobid = j.jobid
    ORDER BY r.start_time DESC NULLS LAST
    LIMIT 1
  ) d ON true
  ORDER BY j.jobname;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_scheduled_job_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_scheduled_job_health() TO authenticated;
