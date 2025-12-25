-- Create table to store admin-defined article order
CREATE TABLE public.library_article_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id text NOT NULL UNIQUE,
  position integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.library_article_order ENABLE ROW LEVEL SECURITY;

-- Anyone can read the order
CREATE POLICY "Anyone can view article order"
ON public.library_article_order
FOR SELECT
USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert article order"
ON public.library_article_order
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "Admins can update article order"
ON public.library_article_order
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "Admins can delete article order"
ON public.library_article_order
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster lookups
CREATE INDEX idx_library_article_order_position ON public.library_article_order(position);