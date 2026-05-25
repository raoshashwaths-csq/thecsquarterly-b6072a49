
-- Subscribers: explicit admin-only SELECT
CREATE POLICY "admins select subscribers"
ON public.subscribers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Survey responses: explicit admin-only SELECT
CREATE POLICY "admins select survey_responses"
ON public.survey_responses
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
