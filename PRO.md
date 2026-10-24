## Atualização 0.2.1 — botão de atualização

Botão pequeno de seta circular no canto inferior direito, usando AppIntent em segundo plano, sem solicitar abertura do app. O botão força nova consulta às fontes disponíveis, mantendo a periodicidade real dos indicadores. Os dados mantêm suas datas de observação; consultar não cria uma nova cotação.

Os widgets solicitam atualização após 1 minuto por padrão. O campo Parâmetro não altera a frequência. Codex/Popular permitem selecionar 1, 5 ou 15 minutos nas preferências do projeto. O iOS decide quando executar; a solicitação de 1 minuto não garante execução nesse intervalo. O botão pede dados atuais disponíveis e recarrega mesmo em falhas, preservando caches. Não altera o código instalado.

Testes locais de intenções, consulta forçada, sucesso/falha e geometria aprovados. Toque, renderização e execução nativa desta versão no iPhone/iPad ainda precisam de confirmação. Atualize o mesmo projeto pelo Git, preservando dados, permissões e pareamento.

# Popular Scripting 0.2.0

Atualize o mesmo projeto pelo vínculo `main/scripts/Popular Scripting`.
Preserva motor, ativos, cores e geometria. Não exclua o projeto para atualizar.

## Consulta e toques

Solicita atualização após 1 minuto, configurável em 1/5/15, e pede recarregar os
widgets de usuário nas ações. Consultas tentam renovar o cache conforme esse
intervalo, com orçamento de rede limitado. O iOS decide quando executar; APIs,
mercados e séries semanais/mensais mantêm sua própria periodicidade.
O workflow público consulta referências a cada hora útil, 11h17–23h17 UTC;
agendamento do GitHub pode atrasar. Dados não recebem observações artificiais.

Cada linha usa link HTTPS direto para a fonte. No pequeno, o iOS pode limitar os
destinos; o destino geral é a fonte do primeiro indicador. Não depende de Atalhos.
Configuração “Ao interagir” do host e os links independentes precisam de conferência
no aparelho. Para detalhes, abra o projeto no Scripting.

## Recursos

- Escolha dos quatro indicadores do pequeno; médio/grande preservam os oito.
- Detalhe por indicador, curva maior, período/unidade/fonte e link de origem.
- Exportação do histórico disponível em CSV, sem interpolar ou inventar dados.
- Alertas por cruzamento de valor: primeira observação vira base, dados velhos,
  futuros, inválidos ou regressivos não rearmam alertas; sem repetição contínua.
- Assistente recebe indicadores com datas/unidades/fontes após aprovação/toque.
  A explicação não inventa causas nem recomenda investimentos.
- Controle **Consultar indicadores**, painel Início compartilhando só contagens,
  importação/exportação JSON e pasta externa autorizada para exportações.

Alertas precisam ser configurados no app para habilitar notificações; depois são
avaliados quando o script executa, inclusive no widget. Não há serviço iOS contínuo
nem promessa de aviso imediato. IPCA/CUB e demais fontes conservam bases distintas.
IA usa modelo local quando disponível ou prepara conversa sem envio automático.

## Verificação e recuperação

Testes: regras/cruzamentos/rearme/deduplicação, datas, CSV, seleção de indicadores,
sintaxe e imports de todos os módulos, quatro séries reais validadas e 16 testes
Python de ingestão/recuperação. Fixture EIA tornou-se independente do snapshot vivo.
Não confirmados: rede, links, desenho, Home, permissões e recebimento no iPhone.
Home depende da versão instalada; documentação consultada no canal TestFlight.

Rollback: tag `v0.1.3`, preservando cache/preferências. Não altera código Scriptable.
Código e dados têm atualizações separadas. Git é fonte; Drive é backup privado.
