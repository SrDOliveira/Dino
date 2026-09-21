# API de Upload de Conteúdo (Python / Streamlit)

O app **não precisa de novo APK** quando você sobe questões ou teorias.
O servidor recebe o conteúdo; o app sincroniza em tempo real (ou no próximo acesso).

Base URL de produção:
`https://3000-ij27trutydcpjuhvqkcn3-feb2e227.us2.manus.computer`

Todos os endpoints abaixo são tRPC HTTP:
`POST {BASE}/api/trpc/{procedure}`

---

## 1. Teorias — `theory.upsertBatch`

Sobe um ou vários artigos de estudo (conteúdo completo).

**Input:**
```json
{
  "articles": [
    {
      "externalId": "constitucional-art5-direitos-fundamentais",
      "subjectId": "constitucional",
      "topic": "Direitos fundamentais",
      "title": "Direitos fundamentais: leitura tática do art. 5º",
      "tacticalFocus": "Diferenciar garantias, vedações e hipóteses de relativização.",
      "sections": [
        { "heading": "Como ler a lei seca", "body": "Texto completo do módulo..." },
        { "heading": "Pegadinhas frequentes", "body": "..." }
      ],
      "keyTakeaways": [
        "A literalidade da norma é o ponto de partida.",
        "Exceções dependem do texto constitucional."
      ],
      "references": [
        {
          "title": "Constituição Federal — art. 5º",
          "url": "https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
          "sourceTier": "primaria",
          "accessedAt": "2026-09-20"
        }
      ],
      "reviewStatus": "revisado_editorialmente",
      "readingMinutes": 12
    }
  ]
}
```

**Fluxo híbrido no app:**
1. Biblioteca local do aparelho
2. `theory.get` (base que você subiu via Python)
3. `theory.generate` (IA + fontes) → salva no aparelho

---

## 2. Questões — `questions.upsertBatch`

```json
{
  "bankSlug": "pmsp-2024",
  "bankTitle": "Banco PMSP",
  "questions": [
    {
      "externalId": "pmsp-const-001",
      "subjectId": "constitucional",
      "topic": "Direitos fundamentais",
      "stem": "Enunciado completo da questão...",
      "alternatives": ["A...", "B...", "C...", "D..."],
      "correctIndex": 2,
      "explanation": "Explicação completa...",
      "difficulty": "medium",
      "source": "Banca X",
      "examiner": "VUNESP",
      "year": 2024
    }
  ]
}
```

**App consome via:**
- `questions.syncMeta` → detecta versão nova
- `questions.list` → baixa questões com filtros

---

## Ordem recomendada no Python

1. Tratar e validar o conteúdo localmente
2. Chamar `theory.upsertBatch` e/ou `questions.upsertBatch`
3. Opcional: conferir `syncMeta`

Quando o MySQL estiver ligado no servidor, a persistência real é ativada.
O contrato da API já está estável para você montar o Streamlit.
