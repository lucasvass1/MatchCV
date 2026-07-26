# MatchCV — Especificação Técnica do Projeto

## 1. Visão Geral

**MatchCV** é uma plataforma web que analisa a compatibilidade entre um currículo (PDF/DOC) e uma vaga de emprego (texto colado pelo usuário), usando IA (Google Gemini) para gerar:

- Score de compatibilidade explicado (não apenas um número)
- Sugestões de melhoria no currículo
- Dicas de entrevista e de teste técnico
- Uma versão do currículo adaptada para a vaga
- Um painel de acompanhamento de candidaturas (CRM pessoal de vagas)

Este documento reorganiza o rascunho original em **fases de desenvolvimento incrementais**, cada uma com escopo fechado, entregável claro e stack recomendada — para permitir implementação isolada (uma fase por vez, um contexto de IA por vez).

---

## 2. Stack Tecnológica Geral (recomendação)

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | **Next.js 14+ (App Router) + React + TypeScript** | SSR/SSG, rotas de API integradas, deploy fácil na Vercel |
| Estilo/UI | **Tailwind CSS + shadcn/ui** | Componentes prontos, elegantes, fáceis de customizar |
| Backend | **API Routes do próprio Next.js** (ou Node/Express separado se o projeto crescer muito) | Evita manter dois serviços no início |
| Autenticação | **Auth.js (NextAuth) com provider Google** | Login com Gmail nativo, fácil de expandir para outros provedores depois |
| Banco de dados | **PostgreSQL via Supabase ou Neon** | Plano gratuito generoso, Postgres é robusto para dados relacionais (usuários, vagas, versões de CV) |
| ORM | **Prisma** | Tipagem forte, migrations simples, ótimo com TypeScript |
| Armazenamento de arquivos (PDFs de CV) | **Supabase Storage** (ou S3 se preferir AWS) | Integra fácil com o mesmo provedor do banco |
| Extração de texto de CV | **`pdf-parse`** (PDF) e **`mammoth`** (DOCX) | Bibliotecas Node maduras e gratuitas |
| IA / Análise | **Google Gemini API** (`gemini-2.0-flash` ou similar) | Camada gratuita generosa, boa para texto longo e structured output (JSON) |
| Chat de simulação de entrevista | **Gemini com streaming + histórico de mensagens** | Mesma API, mantendo contexto da conversa |
| Hospedagem | **Vercel** (frontend + API routes) | Deploy contínuo integrado ao Next.js |
| Emails transacionais (opcional, fase avançada) | **Resend** | Para notificar retorno de processos seletivos, se desejar no futuro |

> Dica: comece **sem** separar backend/frontend em serviços diferentes. Next.js full-stack resolve tudo até a Fase 6-7. Só considere microserviços se a análise de IA virar gargalo de performance.

---

## 3. Fases do Projeto

Cada fase abaixo pode ser passada isoladamente para uma IA de código (ex: Claude Code) como um "ticket" fechado.

### **Fase 0 — Setup e Arquitetura**
**Objetivo:** preparar o esqueleto do projeto.
- Criar projeto Next.js + TypeScript + Tailwind + shadcn/ui
- Configurar Prisma + Postgres (Supabase/Neon)
- Configurar variáveis de ambiente (`GEMINI_API_KEY`, `DATABASE_URL`, `GOOGLE_CLIENT_ID/SECRET`)
- Estrutura de pastas (`/app`, `/lib`, `/components`, `/prisma`)
- Deploy inicial "hello world" na Vercel

**Entregável:** projeto rodando em produção, vazio, mas com CI/CD funcional.

---

### **Fase 1 — MVP de Análise (sem login)**
**Objetivo:** validar o core do produto: upload de CV + colar vaga + análise via Gemini.
- Landing page com campo de upload de CV (PDF/DOC) e textarea para colar a vaga
- Extração de texto do arquivo (`pdf-parse` / `mammoth`)
- Chamada à API do Gemini com prompt estruturado pedindo **JSON de saída** (score, palavras-chave presentes/ausentes, pontos fortes, pontos fracos)
- Exibição de um resultado **parcial/borrado** (preview) → funcionalidade #1 do rascunho: mostrar que é preciso logar para ver o resultado completo

**Entregável:** usuário anônimo consegue rodar uma análise e ver uma prévia do resultado.

---

### **Fase 2 — Autenticação**
**Objetivo:** habilitar cadastro/login, priorizando login com Google.
- Auth.js configurado com provider Google (login com 1 clique)
- Opção de cadastro por e-mail/senha (opcional, pode ficar para depois)
- Modelo `User` no Prisma
- Middleware de proteção de rotas (resultado completo só após login)
- Vincular a análise feita anonimamente (Fase 1) à conta recém-criada, se possível (evita o usuário perder a análise que acabou de fazer)

**Entregável:** fluxo completo de "analisar → pedir login → ver resultado completo".

---

### **Fase 3 — Resultado Detalhado e Explicado**
**Objetivo:** entregar a análise completa e explicada (funcionalidades #3 e #6 do rascunho).
- Prompt do Gemini estruturado para retornar:
  - Score de compatibilidade
  - Lista de palavras-chave da vaga × presentes no CV × ausentes
  - Explicação textual do score (ex: *"Seu currículo possui 18 das 25 palavras-chave da vaga. A ausência de AWS, CI/CD e Kubernetes reduziu sua compatibilidade."*)
  - Dicas de melhoria do currículo
  - Dicas de comportamento para entrevista
  - Possíveis perguntas técnicas e de comportamento
  - O que estudar para a vaga
- UI com gráficos simples (ex: barra de progresso, badges de palavras-chave ausentes) — pode usar `recharts`

**Entregável:** tela de resultado rica, não apenas um percentual solto.

---

### **Fase 4 — Currículo Adaptado**
**Objetivo:** gerar automaticamente uma versão do currículo otimizada para a vaga.
- Prompt adicional ao Gemini: reescrever o CV extraído incorporando as palavras-chave ausentes (quando fizer sentido, sem inventar experiência)
- Gerar arquivo para download (PDF ou DOCX) — bibliotecas: `docx` (Node) para gerar `.docx`, ou `puppeteer`/`react-pdf` para gerar `.pdf`
- Salvar essa versão vinculada ao usuário e à vaga (prepara terreno para a Fase 9 — biblioteca de currículos)

**Entregável:** botão "baixar currículo adaptado" funcional.

---

### **Fase 5 — Painel de Vagas e Processos Seletivos**
**Objetivo:** CRM pessoal de candidaturas (funcionalidades #4 e #5).
- Modelo `JobApplication` no Prisma: vaga, empresa, data, status (ex: `aplicado`, `em processo`, `entrevista`, `retorno positivo`, `recusado`), CV usado (link com Fase 4)
- CRUD completo: criar, editar status, listar, filtrar
- Painel visual (Kanban ou lista com filtros) mostrando a evolução de cada candidatura
- Sugestão de lib para Kanban: `@dnd-kit` (drag and drop leve)

**Entregável:** usuário loga e vê todas as vagas que está acompanhando, com status atualizável.

---

### **Fase 6 — Comparação entre Versões de Currículo**
**Objetivo:** mostrar evolução entre duas análises (funcionalidade #7).
- Tela de comparação lado a lado (versão anterior × atual)
- Diff visual de compatibilidade (ex: 71% → 89%)
- Resumo gerado pelo Gemini das mudanças que mais contribuíram para a melhoria

**Entregável:** tela "Comparar versões" acessível a partir da biblioteca de currículos.

---

### **Fase 7 — Simulador de Entrevista (Chat)**
**Objetivo:** entrevistador virtual interativo (funcionalidade #8).
- Interface de chat (pode reaproveitar componentes do shadcn/ui)
- Gemini com histórico de conversa mantendo contexto (vaga + CV como system prompt)
- Fluxo: IA faz perguntas → usuário responde → IA avalia e dá feedback ao final (ou incrementalmente)
- Opcional: streaming de resposta para UX mais fluida

**Entregável:** o usuário consegue treinar uma entrevista completa para a vaga analisada.

---

### **Fase 8 — Biblioteca de Currículos**
**Objetivo:** guardar automaticamente todas as versões adaptadas (funcionalidade #9).
- Tela de listagem de todas as versões de CV geradas, filtráveis por vaga/área
- Opção de reutilizar uma versão como ponto de partida para nova análise

**Entregável:** histórico completo de versões acessível e reutilizável.

---

### **Fase 9 — Checklist Antes de Aplicar**
**Objetivo:** checklist simples pré-envio (funcionalidade #10).
- Componente de checklist dinâmico baseado no resultado da análise:
  - ✓ Currículo adaptado para a vaga
  - ✓ GitHub informado
  - ✓ LinkedIn atualizado
  - ✓ Portfólio informado
  - ⚠ Alerta de palavras-chave importantes ainda ausentes
- Pode ser derivado automaticamente do JSON já retornado pelo Gemini nas fases anteriores (baixo esforço de implementação)

**Entregável:** checklist exibido junto ao resultado final de cada análise.

---

### **Fase 10 — Histórico de Desempenho / Analytics**
**Objetivo:** métricas de evolução do usuário ao longo do tempo (funcionalidade #11).
- Dashboard com:
  - Total de análises feitas
  - Média de compatibilidade ao longo do tempo (gráfico de linha)
  - Áreas/tecnologias com maior aderência
  - Tecnologias mais recorrentes nas vagas analisadas
- Lib sugerida: `recharts` (já usada na Fase 3, reaproveitar)

**Entregável:** tela "Meu progresso" com gráficos.

---

## 4. Ordem Recomendada de Implementação

```
Fase 0 (setup)
  → Fase 1 (MVP análise anônima)
    → Fase 2 (login)
      → Fase 3 (resultado detalhado)
        → Fase 4 (CV adaptado)
          → Fase 5 (painel de vagas)
            → Fase 9 (checklist) [rápida, pode entrar aqui]
              → Fase 8 (biblioteca de currículos)
                → Fase 6 (comparação de versões)
                  → Fase 10 (histórico/analytics)
                    → Fase 7 (simulador de entrevista) [mais complexa, deixar por último]
```

**Racional da ordem:** as fases 1–5 formam o núcleo do produto (o "loop" de valor: analisar → logar → entender o resultado → melhorar o CV → acompanhar candidaturas). As fases 6, 8, 9 e 10 são incrementos relativamente baratos sobre essa base. A fase 7 (simulador de entrevista via chat) é a mais cara em tokens/latência e pode ficar como diferencial final.

---

## 5. Observações sobre o uso do Gemini

- Use **structured output / JSON mode** do Gemini para todas as análises (score, palavras-chave, dicas) — evita parsing frágil de texto livre.
- Separe prompts por responsabilidade: um prompt para "analisar compatibilidade", outro para "gerar CV adaptado", outro para "modo entrevistador". Prompts menores e focados são mais baratos e mais confiáveis do que um prompt único gigante.
- Cacheie o texto extraído do CV (não precisa reprocessar o PDF a cada nova vaga colada).
- Monitore o uso da camada gratuita do Gemini — defina um limite de análises por usuário/dia caso o produto cresça, para não estourar quota.

---

## 6. Modelo de Dados (rascunho inicial)

```
User
 ├─ id, email, name, image, createdAt

Resume (versão de currículo)
 ├─ id, userId, originalFileUrl, extractedText, createdAt

Analysis (uma análise = CV + vaga)
 ├─ id, userId, resumeId, jobDescriptionText, score,
 │  keywordsMatched[], keywordsMissing[], improvementTips[],
 │  interviewTips[], studySuggestions[], adaptedResumeUrl, createdAt

JobApplication (painel de candidaturas)
 ├─ id, userId, analysisId, company, role, status, appliedAt, updatedAt

InterviewSession (simulador de entrevista)
 ├─ id, userId, analysisId, messages[], feedbackSummary, createdAt
```

Isso já cobre todas as fases sem precisar redesenhar o schema no meio do caminho.
