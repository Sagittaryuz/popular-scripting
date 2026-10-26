# Popular Scripting — Pro 0.2.0

## 0.2.10 — toque Mercado no Meu Painel

O toque na área de ativos agora usa `Script.createRunURLScheme("Meu Painel", { section: "market" })`, equivalente a `scripting://run/Meu%20Painel?section=market`, para abrir a Home independente com Mercado em foco. A ação implícita anterior `NextPopularPage` não é mais chamada pelo widget; o botão explícito `RefreshPopular` continua consultando dados. Não há tentativa de instalar, detectar ou repetir a abertura quando o painel não existe, pois a API não oferece essa detecção. O motor, dados, seleção, paginação compatível, correção CUB 0.2.9 e arquivos de `scripting-home` permanecem fora do escopo.

## 0.2.9 — variação CUB sem reticências

O retorno do usuário isolou truncagem por espaço, não ausência de dado: o CUB-GO conserva três casas na variação publicada (`+0,025%`) e usa uma reserva nativa de 34 pt. A vista reduz somente o piso desse rótulo longo para 6,5 pt, preservando a geometria, alinhamento, curvas, fontes, paginação, atualização, Pro e os demais ajustes posteriores. IPCA, Diesel e Brent mantêm sinais, unidades e textos completos. Nenhum dado econômico ou arquivo da interface Scriptable foi alterado. O iPhone nativo não foi testado.

Fonte: `Sagittaryuz/popular-scripting`, `main`, `scripts/Popular Scripting`.
Preservar motor gerado, fontes, unidades, datas, geometria e versões anteriores.
TSX nativo, cache local, fontes públicas e GitHub Actions para referências.

Camada Pro independente do motor: seleção de quatro entre oito, detalhes,
CSV, alertas por cruzamento, ferramentas do assistente, controles e painel Home.
Pequeno coleta oito para que a escolha de quaisquer quatro tenha dados reais.
APIs e código no iPhone não recebem dependências npm; as novas dependências são
somente para validação no desktop. Não há backend/credencial/serviço pago novo.
Critérios e limites em `PLANS.md` e `PRO.md`.

Padrão: `Sagittaryuz/development-standards`, commit
`722279eb8ec4bac318f8fa2ad50ac34b128e90dc`, GIT-FIRST 1.0.1, WEBAPP-WORKFLOW 1.2.3.
Git é origem; Drive recebe backup privado com histórico recuperável.
