CREATE POLICY "Recruiters can update applications on their jobs"
ON public.applications
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id
    AND jobs.recruiter_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = applications.job_id
    AND jobs.recruiter_id = auth.uid()
  )
);