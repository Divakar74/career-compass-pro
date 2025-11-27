-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create careers table
CREATE TABLE public.careers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  required_skills TEXT[] DEFAULT '{}',
  education_level TEXT,
  average_salary TEXT,
  growth_outlook TEXT,
  work_environment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.careers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view careers"
  ON public.careers FOR SELECT
  USING (true);

-- Create questions table for assessment
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  category TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  USING (true);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments"
  ON public.assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON public.assessments FOR UPDATE
  USING (auth.uid() = user_id);

-- Create assessment_answers table
CREATE TABLE public.assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessment answers"
  ON public.assessment_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_answers.assessment_id
      AND assessments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own assessment answers"
  ON public.assessment_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = assessment_answers.assessment_id
      AND assessments.user_id = auth.uid()
    )
  );

-- Create career_matches table
CREATE TABLE public.career_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
  career_id UUID REFERENCES public.careers(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL,
  reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.career_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own career matches"
  ON public.career_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments
      WHERE assessments.id = career_matches.assessment_id
      AND assessments.user_id = auth.uid()
    )
  );

-- Create trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample questions
INSERT INTO public.questions (question_text, category, question_order) VALUES
('What type of work environment do you prefer?', 'work_style', 1),
('How do you approach problem-solving?', 'thinking_style', 2),
('What motivates you most in your career?', 'motivation', 3),
('How do you prefer to work with others?', 'collaboration', 4),
('What are your strongest skills?', 'skills', 5),
('What level of education have you completed?', 'education', 6),
('What industries interest you most?', 'interests', 7),
('How do you handle stress and deadlines?', 'work_style', 8),
('What role do you see yourself in a team?', 'collaboration', 9),
('What are your long-term career goals?', 'goals', 10);

-- Insert sample careers
INSERT INTO public.careers (title, description, required_skills, education_level, average_salary, growth_outlook, work_environment) VALUES
('Software Developer', 'Design, develop, and maintain software applications and systems', ARRAY['Programming', 'Problem-solving', 'Teamwork', 'Communication'], 'Bachelor''s Degree', '$85,000 - $130,000', 'Excellent (22% growth)', 'Office or Remote'),
('Data Scientist', 'Analyze complex data to help organizations make better decisions', ARRAY['Statistics', 'Programming', 'Machine Learning', 'Data Visualization'], 'Master''s Degree', '$95,000 - $150,000', 'Excellent (36% growth)', 'Office or Remote'),
('UX Designer', 'Create user-friendly digital experiences and interfaces', ARRAY['Design', 'User Research', 'Prototyping', 'Communication'], 'Bachelor''s Degree', '$70,000 - $120,000', 'Very Good (16% growth)', 'Office or Remote'),
('Marketing Manager', 'Develop and execute marketing strategies to promote products or services', ARRAY['Marketing Strategy', 'Communication', 'Analytics', 'Creativity'], 'Bachelor''s Degree', '$75,000 - $125,000', 'Good (10% growth)', 'Office'),
('Financial Analyst', 'Evaluate financial data and trends to guide business decisions', ARRAY['Financial Modeling', 'Analysis', 'Excel', 'Communication'], 'Bachelor''s Degree', '$65,000 - $95,000', 'Good (9% growth)', 'Office'),
('Product Manager', 'Lead product development and strategy from conception to launch', ARRAY['Product Strategy', 'Leadership', 'Communication', 'Analysis'], 'Bachelor''s Degree', '$90,000 - $140,000', 'Very Good (14% growth)', 'Office or Hybrid'),
('Nurse Practitioner', 'Provide advanced healthcare services and patient care', ARRAY['Clinical Skills', 'Diagnosis', 'Patient Care', 'Communication'], 'Master''s Degree', '$100,000 - $125,000', 'Excellent (46% growth)', 'Hospital or Clinic'),
('Civil Engineer', 'Design and oversee construction of infrastructure projects', ARRAY['Engineering', 'CAD', 'Project Management', 'Problem-solving'], 'Bachelor''s Degree', '$70,000 - $100,000', 'Good (8% growth)', 'Office and Field'),
('Teacher', 'Educate and inspire students in various subjects', ARRAY['Teaching', 'Communication', 'Patience', 'Subject Expertise'], 'Bachelor''s Degree', '$45,000 - $75,000', 'Average (4% growth)', 'School'),
('Graphic Designer', 'Create visual concepts to communicate ideas that inspire and inform', ARRAY['Adobe Creative Suite', 'Creativity', 'Typography', 'Communication'], 'Bachelor''s Degree', '$45,000 - $70,000', 'Average (3% growth)', 'Office or Remote');