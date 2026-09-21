# Arena Tática — Especificação de Interface

## Intenção visual

A Arena deve concentrar a rotina diária do candidato em uma superfície clara sobre verde tático. A tela privilegia o painel de missão sobre cartões genéricos: cabeçalho compacto, resumo operacional, mapa vertical de progresso e plano tático no fim da página. Os dados devem permanecer vinculados ao concurso, ao nivelamento e ao histórico local do candidato.

## Estrutura da tela

| Bloco | Conteúdo | Comportamento |
|---|---|---|
| Cabeçalho | Mascote Dino, saudação, avatar tático e concurso selecionado | A saudação usa o primeiro nome e o concurso ativo. |
| Resumo operacional | Dias estimados, arco de edital e selo do concurso | O percentual deriva das lições concluídas dentro das disciplinas selecionadas. |
| Indicadores | Ofensiva, patente e brevês | Patente e brevês derivam de XP, lições, ofensiva e acertos. |
| Mapa de missões | Trajeto vertical com nós de tema | Nós concluídos ficam verdes; a próxima missão fica ativa; as seguintes ficam bloqueadas. |
| Plano tático de hoje | Revisão do assunto mais frágil e a próxima lição recomendada | Cada item abre uma lição ou sessão de questão relacionada. |
| Navegação | Arena, Diagnóstico, Simulados e Perfil | Rodapé nativo fixo das abas, acessível nas telas principais. |

## Regras de progressão

O mapa será derivado das lições do concurso selecionado. A primeira lição não concluída será a missão ativa. Assuntos anteriores ficam concluídos quando suas lições forem finalizadas, e os posteriores permanecem bloqueados. O plano diário prioriza, nesta ordem, tópico frágil identificado por erros, chute ou resposta “não sei”; revisão de disciplina com pior desempenho; e a próxima lição disponível.

| Faixa de brevês | Patente exibida |
|---:|---|
| 0–2 | Soldado |
| 3–5 | Cabo |
| 6–9 | Sargento |
| 10–14 | Tenente |
| 15–19 | Capitão |
| 20 ou mais | Comandante |

## Responsividade

Em telas estreitas, o conteúdo usa margens de 16 px, texto de missão em duas linhas e mapa de uma coluna. Em telas amplas, a Arena limita a largura de leitura, sem converter os painéis em um layout de desktop que descaracterize a experiência móvel vertical.
