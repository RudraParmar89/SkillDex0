
-- User roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'recruiter', 'candidate');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text DEFAULT '',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Jobs table
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  company text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Remote',
  type text NOT NULL DEFAULT 'Full-time',
  salary text DEFAULT '',
  description text DEFAULT '',
  requirements text[] DEFAULT '{}',
  screening_questions jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active jobs" ON public.jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Recruiters can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = recruiter_id);
CREATE POLICY "Recruiters can delete own jobs" ON public.jobs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'recruiter') AND auth.uid() = recruiter_id);

-- Applications table
CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  answers jsonb DEFAULT '{}',
  resume_text text,
  resume_score integer,
  status text DEFAULT 'pending',
  applicant_name text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON public.applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert applications" ON public.applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recruiters can view job applications" ON public.applications FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
);
