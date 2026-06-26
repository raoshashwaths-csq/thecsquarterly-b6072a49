CREATE POLICY "Admins read review packages"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'review-packages' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage review packages"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'review-packages' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'review-packages' AND public.has_role(auth.uid(), 'admin'));