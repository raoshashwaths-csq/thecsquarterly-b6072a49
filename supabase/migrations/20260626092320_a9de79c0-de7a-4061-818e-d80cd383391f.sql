
ALTER VIEW public.benchmark_drops_latest SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.match_lumi_knowledge(vector, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_lumi_knowledge(vector, integer, text, text) TO service_role;
