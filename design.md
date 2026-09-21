# Dino — Plano de Interface do MVP

## Direção do produto

O **Dino** é um treinador de estudo para concursos policiais. Nesta primeira versão, a experiência deve levar o candidato da escolha do concurso à prática orientada: o usuário informa seu objetivo, confirma as disciplinas, realiza um nivelamento rápido e passa a estudar em sessões curtas que misturam explicação e questões. O aplicativo será desenvolvido para orientação vertical **9:16**, uso com uma mão e sensação de progresso imediato.

O MVP trabalha com uma curadoria local de concursos e questões demonstrativas para que o fluxo completo seja utilizável desde o primeiro acesso. O envio de PDF será tratado como uma biblioteca local de materiais, com o processamento inteligente de conteúdo claramente reservado para a etapa avançada; não haverá alegação de que um arquivo foi convertido automaticamente em questões nesta versão.

## Princípios de experiência

| Princípio | Aplicação no Duoduo |
|---|---|
| Progresso visível | O cabeçalho mostra ofensiva, XP e avanço da sessão sem competir com a pergunta principal. |
| Decisão simples | Cada tela apresenta uma ação principal, posicionada ao alcance do polegar na parte inferior. |
| Aprendizado ativo | A teoria é curta, acionável e seguida de uma pergunta; a resposta explica o raciocínio, não apenas informa o gabarito. |
| Diagnóstico honesto | O painel indica domínio e pontos de atenção com base nas respostas registradas, sem previsões falsas de aprovação. |
| Acessibilidade | Texto legível, alto contraste, áreas de toque amplas e informação não dependente somente de cor. |

## Arquitetura de navegação

Após a configuração inicial, a navegação principal terá quatro abas: **Hoje**, **Trilha**, **Diagnóstico** e **Perfil**. O fluxo de nivelamento e a sessão de questões são apresentados em tela cheia, removendo a barra de abas para reduzir distrações.

| Tela | Conteúdo e função principal |
|---|---|
| Boas-vindas | Apresenta o periquito mascote, a proposta de estudo ativo e inicia a configuração do perfil local. |
| Perfil de estudo | Coleta o primeiro nome e apresenta a continuidade do estudo no próprio dispositivo. |
| Escolha de concurso | Mostra concursos policiais iniciais, como PF, PRF e PM, com disciplinas estimadas. |
| Confirmação de disciplinas | Permite revisar as matérias que compõem a trilha inicial antes do nivelamento. |
| Nivelamento | Exibe de duas a três questões por disciplina, com alternativas, opção **“Chutei”** e opção **“Não sei”**. |
| Resultado do nivelamento | Resume os pontos de partida e direciona para a primeira sessão recomendada. |
| Hoje | Central diária com saudação, ofensiva, XP, plano recomendado e botão para continuar a sessão. |
| Microlição | Explicação breve de um conceito com exemplo e ação para responder à questão de fixação. |
| Questão | Apresenta uma questão de múltipla escolha, resposta, feedback e explicação em contexto. |
| Trilha | Lista disciplinas e módulos disponíveis, distinguindo conteúdo concluído, em andamento e recomendado. |
| Diagnóstico | Mostra domínio por disciplina, assuntos que merecem revisão e sugestões de estudo. |
| Materiais | Lista materiais adicionados localmente e permite selecionar um novo PDF; informa de forma transparente que a geração por IA será ativada na próxima etapa. |
| Perfil | Exibe objetivo de concurso, progresso, XP acumulado, ofensiva e acesso aos materiais. |

## Fluxos prioritários

| Fluxo | Etapas |
|---|---|
| Primeiro acesso | Boas-vindas → Perfil de estudo → Escolha de concurso → Confirmação de disciplinas → Nivelamento → Resultado → Hoje. |
| Estudo diário | Hoje → Iniciar sessão → Microlição → Questão → Feedback → Próxima etapa → Resumo de sessão. |
| Nivelamento | Disciplina atual → Escolher alternativa ou marcar “Chutei” / “Não sei” → Feedback → Próxima questão → Resultado consolidado. |
| Diagnóstico | Aba Diagnóstico → Selecionar disciplina → Ver temas fortes e temas a reforçar → Iniciar revisão recomendada. |
| Inclusão de material | Perfil → Materiais → Adicionar PDF → Conferir arquivo na biblioteca local. |

## Estrutura de dados do MVP

O estado será salvo localmente para permitir continuidade sem exigir autenticação remota nesta fase. As entidades principais são `Perfil`, `Concurso`, `Disciplina`, `Questão`, `Resposta`, `ProgressoDaLição`, `MaterialLocal` e `Estatísticas`. O diagnóstico agregará acertos, respostas marcadas como chute e respostas marcadas como não sei por assunto.

| Entidade | Campos essenciais |
|---|---|
| Perfil | nome, concursoSelecionado, disciplinasSelecionadas, ofensiva, XP, dataDaÚltimaSessão |
| Questão | id, disciplina, assunto, enunciado, alternativas, correta, explicação, nível |
| Resposta | questãoId, alternativa, acertou, foiChute, nãoSabia, data |
| ProgressoDaLição | liçãoId, concluída, etapasConcluídas, últimaAtualização |
| MaterialLocal | id, nome, URI local, tamanho, dataDeInclusão |

## Linguagem visual

A marca combina o verde energético do mascote com azul profundo de confiança e superfícies quentes, evitando a aparência infantil. O periquito verde musculoso será usado como companhia visual em momentos de incentivo, começo de sessão e conclusão, sem bloquear a leitura das questões.

| Elemento | Cor | Uso |
|---|---|---|
| Verde Duoduo | `#39B54A` | Ações primárias, progresso e mensagens de incentivo. |
| Azul Tático | `#102A43` | Títulos, cabeçalhos e base institucional. |
| Creme Claro | `#F7F8F3` | Fundo principal, reduzindo fadiga visual. |
| Branco | `#FFFFFF` | Cartões de conteúdo e superfícies elevadas. |
| Amarelo de XP | `#F5B700` | Pontos, ofensiva e conquistas. |
| Coral de atenção | `#E76F51` | Assuntos que exigem reforço e estados de erro. |
| Cinza de apoio | `#667085` | Metadados e textos secundários. |

## Padrões de interação

Os botões principais terão no mínimo 48 pontos de altura, bordas arredondadas de 16 pontos e retorno tátil discreto. As alternativas de questões serão cartões inteiros tocáveis; após a resposta, a alternativa correta e a explicação permanecem visíveis antes de avançar. O botão de continuidade fica ancorado na zona inferior segura, e as transições serão curtas e funcionais.

## Limites da primeira versão

Nesta entrega, o aplicativo prioriza o ciclo funcional de nivelamento, estudo e diagnóstico para uma seleção inicial de concursos policiais. Login real com recuperação de conta, sincronização em nuvem, rankings, simulados adaptativos, notificações, leitura de links da web e geração de conteúdo a partir de PDF permanecerão no backlog de evolução. A interface de materiais será deixada pronta para receber esse motor em uma próxima fase, sem simular processamento que ainda não foi implementado.
