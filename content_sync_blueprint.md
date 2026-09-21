# Integração Editorial Futura — Dino

O modo local do Dino permanece operacional com PDFs enviados pelo candidato e materiais já aprovados no app. Esta especificação prepara a conexão posterior com uma base editorial externa, sem exigir uma nova publicação nas lojas a cada lote de questões.

## Fluxo editorial proposto

| Etapa | Responsável | Estado e dado principal |
|---|---|---|
| Extração | Script Python / Streamlit | PDF bruto gera itens em `questoes_staging` com `revisao_pendente`. |
| Revisão | Painel editorial | Enunciado, alternativas, gabarito, disciplina, tema e fonte são ajustados. |
| Publicação | Editor responsável | Item recebe `publicado` e a versão do conteúdo do concurso é incrementada. |
| Sincronização delta | App Dino | Ao abrir, o app consulta a versão e baixa somente os itens alterados. |

## Contrato previsto

```text
GET /conteudo/versao?concurso=pmesp-soldado
→ { contestId, contentVersion, updatedAt }

GET /conteudo/delta?concurso=pmesp-soldado&desde=1.0.4
→ { contestId, contentVersion, questions, deletedQuestionIds, updatedAt }
```

Uma questão só deve chegar ao aluno quando estiver com `status = publicado`, quatro ou mais alternativas, gabarito válido, explicação e fonte identificada. O cliente deve conservar a versão local até uma resposta delta completa ser validada. Em uma fase com autenticação, a sincronização poderá rodar após abrir o app e avisar: **“Novas missões táticas disponíveis. Toque para atualizar seu plano de estudo.”**

## Limites desta versão

Esta versão não inclui servidor Python, Streamlit, PostgreSQL externo ou processo contínuo. Os tipos em `lib/content-sync-contracts.ts` foram criados para permitir que essa conexão seja implementada depois, preservando o fluxo atual de PDFs e revisão local.
