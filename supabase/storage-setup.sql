-- Supabase Storage bucket for resume PDFs
-- Run in Supabase SQL Editor after creating the bucket via Dashboard > Storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-pdfs', 'resume-pdfs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resume-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resume-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resume-pdfs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
