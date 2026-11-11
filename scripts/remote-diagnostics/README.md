# Diagnóstico remoto: preparação, ainda sem envio

## Objetivo e estado

Pedido de 11/11/2026: registrar processamento do widget e permitir leitura remota sem depender de fotos. Estes arquivos são preparação isolada, fora da distribuição. Não alteram o motor, layout, dados, manifesto, Keychain ou Worker. Não existe envio ativo nem endpoint de diagnóstico implantado/verificado.

Implementados:
- `schema.ts`: contrato fechado, apenas versão/motor, etapa, ativo de lista fixa, código técnico, cache, HTTP, contagem e timestamps. Campos arbitrários, preços, mensagens, corpos, URLs, cabeçalhos, IDs e tokens são descartados.
- `client.ts`: cliente desativado por padrão, fila máxima de 32 eventos, retenção local de 24h, uma tentativa por cinco minutos, concorrência controlada e fila preservada em falha. Storage e transporte são injetados, nenhum acesso nativo neste preparo.
- `server.ts`: handler HTTPS `/v1/diagnostics`, POST autenticado para escrita, GET com autorização independente de leitura, máximo 16 KiB por requisição, contrato validado novamente no servidor, 64 lotes/7 dias por armazenamento privado e erros sem detalhes. Autenticação e armazenamento ainda são adaptadores obrigatórios, não mocks de segurança a serem publicados.
- Testes verificam sanitização e fluxo cliente/servidor sintético, incluindo 401 sem tocar armazenamento, escrita que não concede leitura, limites, fila em falha, concorrência, retenção e leitura privada.

## Destino existente e bloqueio atual

`PRIVATE-MARKET-LOCAL.md` e `scripts/Popular Scripting/private-market.ts` identificam Worker `popular-private-market-prep.mrpires72.workers.dev`, com token autorizado exclusivamente no caminho `/v1/market`. O cliente atual não oferece rota de logs. Não estender a allowlist desse token e não o extrair do iPhone.

Implantação histórica usa Wrangler no computador Sagittaryuz e Durable Object MarketCache/SQLite no Cloudflare Workers Free. O executor da investigação informou os computadores offline. Não existe plugin Cloudflare disponível nesta investigação. Não foi executado novo login, consulta autenticada, implantação, criação de segredo ou mudança de acesso. O funcionamento e configuração atuais do Worker ainda precisam ser conferidos na sessão autorizada.

## Ativação proposta, em ordem

1. Quando o computador autorizado estiver disponível, conferir fonte/configuração do Worker e sessão Wrangler existentes sem ler ou exibir credenciais. Não recriar serviço, conta ou grants apenas porque a sessão está indisponível.
2. Escolher identidade de escrita de diagnóstico e identidade de leitura, restritas ao projeto. A sessão Cloudflare existente pode servir para dot consultar registros via ferramenta/consulta autorizada no servidor, sem exportar a credencial. Se uma credencial dedicada de leitura/escrita for necessária, confirmar criação, custódia e destinatário antes de configurá-la. Não reutilizar silenciosamente o bearer de mercado noutra rota.
3. Ligar o handler ao Worker existente e a armazenamento isolado do cache de mercado. Implementar `appendAndPrune` atomicamente no Durable Object: gravar somente objeto já sanitizado, remover vencidos e manter os 64 mais novos. Aplicar limite de uma escrita por cinco minutos por identidade autorizada no servidor. GET deve retornar apenas o projeto autorizado. Não registrar requisições/cabeçalhos/corpos na observabilidade genérica. Não usar GitHub público para eventos.
4. Garantir limpeza física dos registros vencidos, incluindo períodos sem escrita, por alarme existente ou mecanismo autorizado; filtragem de leitura sozinha não garante exclusão física após sete dias. Qualquer novo recurso/alarme/custo deve ser avaliado antes da implantação.
5. Configurar transporte do aplicativo somente para origem/caminho aprovados, sem redirecionamentos, token em URL ou retries imediatos, com timeout cancelável de no máximo três segundos e sem bloquear renderização. Adaptadores devem mapear erros a enums, nunca copiar mensagens de exceções. Integração de Storage deve usar chave nova isolada, sem tocar cache econômico nem Keychain atual.
6. Testar sem credencial (401), identidade write-only (GET 401), payload malformado/grande, limite/TTL e envio/leitura de evento sintético, verificando ausência de conteúdo proibido. Só então integrar chamadas de registro no motor, habilitar cliente e testar envio real do iPhone e leitura pela dot. Confirmação do servidor não comprova entrega nativa.

## Próximo passo mínimo

Retomar o executor existente com Sagittaryuz online para inspecionar e implantar no Worker autorizado. Não é necessária reinstalação por suposição. Se a única rota viável exigir nova credencial ou grant, apresentar exatamente destino, escopo e custódia para autorização. Até então, a entrega deve ser descrita como preparação técnica, e não logs remotamente acessíveis funcionando.

## Verificação local

- `node scripts/remote-diagnostics/test.cjs`: passou.
- `node scripts/remote-diagnostics/test-flow.cjs`: passou.
- Nenhum teste de rede, Worker real ou iPhone. Não foi feito commit/push por esta subetapa.
