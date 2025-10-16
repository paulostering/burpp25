-- Add approved column to reviews table
ALTER TABLE public.reviews
ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Add approved_at column to track when review was approved
ALTER TABLE public.reviews
ADD COLUMN approved_at timestamp with time zone;

-- Add approved_by column to track who approved the review
ALTER TABLE public.reviews
ADD COLUMN approved_by uuid REFERENCES auth.users(id);

-- Add index for faster queries on approved reviews
CREATE INDEX idx_reviews_approved ON public.reviews(approved);

-- Add index for approved_at
CREATE INDEX idx_reviews_approved_at ON public.reviews(approved_at);

-- Comment on columns
COMMENT ON COLUMN public.reviews.approved IS 'Whether the review has been approved by an admin';
COMMENT ON COLUMN public.reviews.approved_at IS 'When the review was approved';
COMMENT ON COLUMN public.reviews.approved_by IS 'Admin user who approved the review';

