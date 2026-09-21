# Dino — Evolução Local de Aprendizagem Policial

## Decisão desta etapa

Esta evolução mantém o Dino como um aplicativo local, sem conta, sincronização, busca web ativa ou processamento real por inteligência artificial. O objetivo é entregar uma experiência convincente e operacional para o candidato: ele encontra ou seleciona um concurso policial, confirma dados importantes, envia PDFs de até 50 MB e acompanha o material em uma fila visual enquanto conclui a configuração e estuda.

Os dados e os estados da interface serão estruturados para receber, em uma próxima etapa, uma fonte de busca externa, armazenamento em nuvem e um serviço de IA. Nesta versão, nenhuma tela deverá afirmar que o PDF foi lido, que uma questão foi gerada por IA ou que informações vieram da internet.

## Jornada de descoberta do concurso

| Momento | Ação do candidato | Resposta do Dino |
|---|---|---|
| Busca | Digita o nome, órgão ou cargo desejado. | Apresenta resultados locais correspondentes e concursos sugeridos. |
| Confirmação | Seleciona um resultado. | Mostra órgão, cargo, situação, última atualização exibida e disciplinas previstas para conferência. |
| Ajuste | Confirma ou edita as disciplinas. | Monta a trilha inicial, sem bloquear a continuidade quando dados específicos ainda não estão disponíveis. |
| Nivelamento | Responde questões de cada disciplina. | Registra acerto, erro, chute e “não sei” para determinar temas prioritários. |

O catálogo inicial abrange Polícia Federal para Agente e Administrativo, Polícia Civil do Distrito Federal, Polícia Militar do Distrito Federal e Polícia Militar do Estado de São Paulo para Soldado.

## Jornada de materiais

| Estado local | O que o usuário vê | Significado nesta etapa |
|---|---|---|
| Adicionado | Arquivo validado e salvo no aparelho. | O PDF foi incluído na biblioteca local. |
| Na fila | Posição e indicador de preparação. | Estado de experiência local, pronto para ser conectado a uma fila real. |
| Organizando | Progresso visual por etapas: leitura, tópicos e plano de estudo. | Simulação transparente de preparação; não representa interpretação real do arquivo. |
| Pronto para conectar | Resumo de como o material poderá ser transformado na etapa de IA. | O arquivo e seus metadados estão prontos para envio futuro. |

Os PDFs serão limitados a **50 MB** antes de entrarem na biblioteca. A configuração do concurso e o nivelamento podem continuar enquanto o usuário acompanha os materiais em preparação.

## Motor local de aprendizagem

Cada resposta deve produzir um sinal de confiança. O motor local separa as respostas em quatro situações: acerto seguro, acerto por chute, erro por dúvida e erro mesmo com segurança. O diagnóstico reduz a nota de domínio em respostas chutadas e prioriza temas com erros, dúvidas ou pouca evidência.

| Sinal de resposta | Tratamento no diagnóstico | Próxima recomendação |
|---|---|---|
| Acertou e sabia | Reforça domínio. | Avançar ou revisar mais tarde. |
| Acertou por chute | Mantém alerta de confiança. | Reapresentar o tema com microlição. |
| Errou e não sabia | Marca lacuna explícita. | Iniciar pelo conceito-base. |
| Errou e achava que sabia | Marca possível erro conceitual. | Mostrar explicação e uma questão de contraste. |

## Conteúdo e gestão editorial

Será criada uma área gerencial local, separada da experiência do aluno. Nela, o editor poderá registrar materiais, criar questões detalhadas, escolher disciplina e tema, atribuir dificuldade, marcar o conteúdo como publicado ou rascunho e priorizar o que ficará disponível na trilha local.

Essa área organiza o catálogo demonstrativo e estabelece o mesmo vocabulário que será utilizado posteriormente por uma base em nuvem. Nesta etapa, ela não identifica um administrador nem publica alterações para outros dispositivos.

## Feedback sonoro

O Dino terá retorno sonoro discreto em questões. Acertos usam um sinal curto inspirado em uma sirene de viatura, sem volume excessivo. Erros usam um impacto sonoro breve, não realista e sem simular violência gráfica. O aluno poderá desativar os sons em configurações.

## Contratos para a próxima etapa

As interfaces locais serão definidas para receber estes adaptadores futuros:

| Contrato | Entrada | Saída esperada |
|---|---|---|
| Busca de concursos | termo, carreira e estado | resultados, órgão, cargo, datas, status e disciplinas. |
| Ingestão de material | PDF validado e metadados | identificador de trabalho e status de processamento. |
| Estruturação por IA | texto extraído e regras editoriais | tópicos, microlições, questões e referências de origem. |
| Publicação editorial | material ou questão revisada | item publicado para a trilha adequada. |

## Política futura de fontes e qualidade

Quando a integração de IA for ativada, cada tópico e questão deverá manter a origem do material que o sustenta. PDFs enviados pelo candidato serão tratados como material privado do próprio candidato; o produto não deve afirmar que pode redistribuir esse conteúdo. Complementos encontrados na web deverão priorizar fontes oficiais, legislação, bancas e materiais explicitamente disponibilizados para acesso público, com URL e data de consulta registradas.

O fluxo futuro não poderá apresentar conteúdo como fato sem uma referência de origem ou sem sinalizar que se trata de explicação geral. Pesquisas por materiais públicos em PDF devem usar consultas direcionadas e passar por revisão editorial antes de publicação ampla. A IA deverá organizar e sugerir conteúdo, mas a publicação de itens para todos os candidatos continuará sujeita à revisão da área gerencial.
