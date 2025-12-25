-- Create check-ins table for storing user check-in responses
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reflection_prompt TEXT,
  reflection_response TEXT,
  orientation_choice TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create check-in preferences table for cadence and snooze settings
CREATE TABLE public.check_in_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cadence TEXT NOT NULL DEFAULT 'monthly',
  snoozed_until TIMESTAMP WITH TIME ZONE,
  last_check_in_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on check_ins
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Enable RLS on check_in_preferences
ALTER TABLE public.check_in_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for check_ins
CREATE POLICY "Users can view their own check-ins"
  ON public.check_ins
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins"
  ON public.check_ins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
  ON public.check_ins
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for check_in_preferences
CREATE POLICY "Users can view their own check-in preferences"
  ON public.check_in_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-in preferences"
  ON public.check_in_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-in preferences"
  ON public.check_in_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_check_in_preferences_updated_at
  BEFORE UPDATE ON public.check_in_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();