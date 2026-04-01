-- Supabase exposes the public schema through PostgREST.
-- Enabling RLS on these tables prevents anon/authenticated API roles from
-- reading or mutating rows unless explicit policies are added later.
ALTER TABLE "UserAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Space" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoginCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
