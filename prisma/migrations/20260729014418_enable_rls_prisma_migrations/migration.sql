-- A tabela _prisma_migrations (controle interno de migrations do Prisma)
-- também fica no schema public e por isso é exposta pelo PostgREST do
-- Supabase, assim como as demais tabelas tratadas na migration
-- 20260728222349_enable_rls. Mesmo racional: a role usada pelo Prisma é
-- dona da tabela e ignora RLS automaticamente, então isso só bloqueia o
-- acesso público via API REST, sem afetar `prisma migrate`.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
