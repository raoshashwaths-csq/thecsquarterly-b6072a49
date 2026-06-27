DROP POLICY IF EXISTS "Anyone can submit listing" ON public.job_listings;
CREATE POLICY "Authenticated users can submit listing" ON public.job_listings FOR INSERT TO authenticated WITH CHECK (status = 'pending');

CREATE POLICY "Admins can read app settings" ON public.app_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));