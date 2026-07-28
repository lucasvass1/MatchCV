# MatchCV

**MatchCV** é uma plataforma web que analisa a compatibilidade entre um currículo e uma vaga de emprego usando inteligência artificial (Google Gemini), indo além de um score genérico: explica o porquê da nota, aponta palavras-chave ausentes, sugere melhorias reais no currículo, gera uma versão adaptada para a vaga e ajuda o candidato a acompanhar cada processo seletivo do início ao fim.

O objetivo do projeto é resolver um problema comum de quem está buscando emprego: candidatar-se "no escuro", sem saber se o currículo realmente conversa com a vaga, e sem organização sobre o andamento de cada candidatura. O MatchCV entrega uma análise honesta — a IA é instruída a nunca inflar a compatibilidade ou inventar experiência que o candidato não tem.

🔗 **Aplicação em produção:** [match-cv-two.vercel.app](https://match-cv-two.vercel.app/)

---

## Funcionalidades

- **Análise de compatibilidade** — upload de currículo (PDF/DOCX) + texto da vaga, com score explicado, palavras-chave presentes/ausentes, pontos fortes e lacunas
- **Recomendação honesta** — a IA avalia se vale a pena se candidatar antes de qualquer coisa, sem inflar artificialmente a nota
- **Currículo adaptado** — geração automática de uma versão do currículo otimizada para a vaga, com download em `.docx`
- **Login social e por e-mail** — autenticação via Google, GitHub ou e-mail/senha
- **Painel de candidaturas** — acompanhamento de status de cada vaga aplicada (CRM pessoal)
- **Comparação entre análises** — evolução do currículo entre versões, com resumo gerado por IA
- **Simulador de entrevista** — chat com IA que faz perguntas da vaga e dá feedback
- **Biblioteca de currículos** — histórico de todas as versões adaptadas geradas
- **Checklist pré-candidatura** — itens a revisar antes de enviar (GitHub, LinkedIn, portfólio, palavras-chave)
- **Meu progresso** — dashboard com evolução de compatibilidade e tecnologias mais recorrentes ao longo do tempo

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + [React](https://react.dev) 19 + TypeScript |
| Estilo/UI | [Tailwind CSS](https://tailwindcss.com) 4 + [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) |
| Autenticação | [Auth.js (NextAuth v5)](https://authjs.dev) — providers Google, GitHub e credenciais (e-mail/senha com `bcryptjs`) |
| Banco de dados | PostgreSQL ([Supabase](https://supabase.com)) |
| ORM | [Prisma](https://www.prisma.io) |
| IA | [Google Gemini](https://ai.google.dev) via `@google/genai` — análise de compatibilidade, geração de currículo adaptado e simulação de entrevista |
| Extração de texto | `pdf-parse` (PDF) e `mammoth` (DOCX) |
| Geração de documentos | `docx` (exportação do currículo adaptado) |
| Hospedagem | [Vercel](https://vercel.com) |

## Modelo de dados

O schema (Prisma) é organizado em torno de: `User`, `Analysis` (uma análise = currículo + vaga), `JobApplication` (candidaturas acompanhadas) e `InterviewSession` (simulações de entrevista), além das tabelas de autenticação (`Account`, `Session`, `VerificationToken`).

## Rodando localmente

```bash
npm install
npx prisma migrate dev
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Variáveis de ambiente

Crie um arquivo `.env` na raiz com:

```bash
DATABASE_URL=            # connection string do Postgres (pooler)
DIRECT_URL=               # connection string direta (usada nas migrations)
GEMINI_API_KEY=           # chave da API do Google Gemini
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
AUTH_SECRET=              # chave usada pelo Auth.js para assinar sessões/tokens
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia o servidor de produção (após o build) |
| `npm run lint` | Roda o ESLint |
