
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL,
  job_id uuid,
  application_id uuid,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
