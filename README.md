# Farmácia Mais Que Popular — Clone de estudo

**🔗 Demo ao vivo:** https://maisqpopular-clone.vercel.app

Clone de estudo inspirado no **layout e-commerce do Pague Menos** (https://www.paguemenos.com.br/),
adaptado à identidade, aos produtos e ao contexto da **Farmácia Mais Que Popular** (Tapanã, Belém-PA).

> ⚠️ **Projeto demonstrativo.** Não é afiliado ao Pague Menos nem representa a loja real.
> Produtos, preços, avaliações e imagens são ilustrativos.

## O que foi replicado do Pague Menos
- Topbar com atalhos (Nossas lojas / Baixe o APP / Precisa de ajuda)
- Header com logo, **busca**, bloco "Entre ou cadastre-se" e **Minha sacola** com total
- Menu horizontal de **categorias** (Ofertas, Medicamentos e Saúde, Dermo e Beleza, Mamães e bebês, Higiene pessoal, Vida Saudável, Conveniência, Serviços de Saúde, Marcas Exclusivas)
- Faixa de **benefícios** (frete, clique e retire, entrega de medicamentos, avaliação)
- **Hero/banners** + grade "Navegue por Categoria"
- **Vitrines de produtos** com selo de desconto, preço "de/por", avaliação e botão Adicionar
- Rodapé institucional

## Páginas
| Arquivo | Descrição |
|---|---|
| `index.html` | Home com hero, departamentos e vitrines |
| `categoria.html` | Listagem por categoria (`?cat=slug`) ou busca (`?q=termo`) |
| `produto.html` | Detalhe do produto (`?id=id`) com quantidade, relacionados e aviso de receita |
| `carrinho.html` | Sacola com quantidades, **cupom de desconto**, frete grátis acima de R$ 150 e checkout via WhatsApp |
| `checkout.html` | Checkout em 3 etapas (entrega → endereço → pagamento) com resumo ao vivo, cupom e desconto Pix |
| `pedido.html` | Confirmação do pedido com resumo, pontos **+Q** e envio no WhatsApp |
| `meus-pedidos.html` | Histórico de pedidos com status simulado e "comprar novamente" |
| `ofertas.html` | Vitrine de ofertas ordenadas por maior desconto |
| `entrar.html` | Login/cadastro simulado (localStorage) |

## Funcionalidades
- **Sacola persistente** em `localStorage` com badge de quantidade e total no header.
- **Busca** por nome, marca/tag ou categoria (compartilhada entre todas as páginas).
- **Filtros de catálogo**: ordenação (relevância, preço, desconto, A-Z), faixa de preço e "só ofertas".
- **Cupons de desconto** (revalidados no servidor via API, com fallback local):

  | Código | Regra |
  |---|---|
  | `BEMVINDO10` | 10% no primeiro pedido (mín. R$ 50) |
  | `QPOPULAR5` | 5% em qualquer compra |
  | `TAPANA15` | 15% acima de R$ 200 |

- **Cupom aplicável no carrinho e no checkout**: campo com botão "Aplicar" (ou Enter), validação em `/api/coupon` com fallback local, mensagens por estado (aplicado / inválido / mínimo não atingido / só primeiro pedido), desconto refletido no resumo antes de concluir e salvo no pedido (`coupon`, `couponDesc`), aparecendo na confirmação e no histórico.
- **Checkout** em etapas com validação de endereço, Pix com 5% de desconto, retirada no balcão e pedido enviado ao WhatsApp.
- **API de pedido:** o checkout envia itens, entrega, pagamento e cupom para `/api/order`, que **recalcula tudo no servidor** (preço do catálogo, frete, cupom, Pix), gera o ID oficial e devolve os totais. Se a API estiver fora do ar, o site segue funcionando com cálculo local.
- **SEO:** metadados, Open Graph/Twitter Card, dados estruturados `Pharmacy`, `robots.txt` e `sitemap.xml`.

## API (Vercel Functions)

| Rota | Método | Descrição |
|---|---|---|
| `/api/coupon` | POST | Valida cupom: `{ code, items?, subtotal?, hasPreviousOrder? }` → `{ ok, code, percent, desc }` |
| `/api/order` | POST | Cria pedido: `{ items:[{id,qty}], delivery, pay, coupon?, address?, obs? }` → `{ ok, order }` |

Regras de negócio compartilhadas entre browser e servidor ficam em **`pricing.js`**
(frete grátis, taxa de entrega, desconto Pix, validação de itens, cupom e receita médica).
O servidor **nunca** confia em preços enviados pelo cliente.

## Arquivos de apoio
- `data.js` — loja, categorias, produtos, **cupons** (`COUPONS`) e regras de fidelidade (`LOYALTY`); exporta para `window` (browser) e `module.exports` (Node)
- `pricing.js` — cálculo oficial do pedido (usado pelo site e pela API)
- `app.js` — header compartilhado, busca, sacola, cupom, pontos, cards e cliente da API
- `api/coupon.js`, `api/order.js` — funções serverless da Vercel
- `server.js` — servidor local que roda os estáticos **e** as funções de `/api`
- `vercel.json` — clean urls, cache e cabeçalhos de segurança
- `styles.css` — estilos (tokens de cor, grid, responsivo)
- `sitemap.xml` / `robots.txt` — indexação
- `logo.webp` — logo e favicon

## Como rodar
```powershell
cd "D:\Nova pasta\app e site\maisqpopular-clone"
npm run dev          # http://localhost:5500 (site + /api)
npm run test:pricing # testa as regras de preço e cupom
```

> O `python -m http.server` continua servindo as páginas, mas **não** executa `/api/*` —
> nesse caso o site cai automaticamente no cálculo local do pedido.

## Personalização rápida
- **Produtos/preços:** edite o array `PRODUCTS` em `data.js`.
- **Cupons:** edite o array `COUPONS` em `data.js` (percentual, mínimo e regra de primeiro pedido).
- **Fidelidade:** ajuste `LOYALTY` em `data.js` (pontos por real e valor do bloco).
- **Dados da loja** (WhatsApp, endereço, horário, CNPJ): objeto `STORE` em `data.js`.
- **Cores:** variáveis em `:root` no topo de `styles.css`.
- **Domínio:** atualize a URL em `sitemap.xml`, `robots.txt` e nas tags `canonical`/`og:url` se publicar em outro endereço.

## Status da validação
Verificado via navegador (Playwright): todas as rotas retornando **200**, **0 erros de JS** no console,
fluxo completo Home → sacola → cupom → checkout (3 etapas) → confirmação → histórico funcionando,
com o pedido criado pela API (ID `MQ-XXXXXX`) e totais conferidos.
Cupom coberto nos dois pontos de entrada: aplicado no carrinho persiste no checkout e no pedido;
aplicado direto no checkout (`QPOPULAR5` → − R$ 5,23); código inválido e cupom de primeira compra
são recusados com a API respondendo 4xx (e o site segue mostrando o detalhe no resumo).
Regras de preço cobertas por **13 testes automatizados** (`npm run test:pricing`).

### Limitações conhecidas
- Os pedidos ficam no `localStorage` do cliente; a API ainda **não persiste** em banco
  (ponto de extensão marcado em `api/order.js`).
- Diagnóstico completo do pedido no WhatsApp já funciona; acompanhamento de status é simulado.
