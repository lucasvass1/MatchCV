-- Habilita Row Level Security em todas as tabelas do schema public.
--
-- O Supabase expõe automaticamente qualquer tabela do schema `public` via
-- API REST (PostgREST), usando as roles `anon`/`authenticated`. Esta
-- aplicação acessa o banco apenas via Prisma (DATABASE_URL), nunca via essa
-- API REST, então não há necessidade de políticas de acesso: o objetivo aqui
-- é apenas bloquear completamente o acesso público, já que a role usada pelo
-- Prisma é a dona das tabelas e, por padrão, roles donas de tabela ignoram
-- RLS automaticamente (não precisa de FORCE ROW LEVEL SECURITY).

ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PendingAnalysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."JobApplication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."InterviewSession" ENABLE ROW LEVEL SECURITY;
