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
| `carrinho.html` | Sacola com quantidades, frete grátis acima de R$ 150 e checkout via WhatsApp |
| `checkout.html` | Checkout em 3 etapas (entrega → endereço → pagamento) com resumo ao vivo |
| `pedido.html` | Confirmação do pedido com resumo e envio no WhatsApp |
| `meus-pedidos.html` | Histórico de pedidos com status simulado e "comprar novamente" |
| `ofertas.html` | Vitrine de ofertas ordenadas por maior desconto |
| `entrar.html` | Login/cadastro simulado (localStorage) |

## Arquivos de apoio
- `data.js` — catálogo de dados (loja, categorias, produtos, preços, helpers)
- `app.js` — header compartilhado, busca, sacola persistente (localStorage) e cards
- `styles.css` — estilos (tokens de cor, grid, responsivo)

## Como rodar
```powershell
cd "D:\Nova pasta\maisqpopular-clone"
python -m http.server 5500
# abra http://localhost:5500/index.html
```

## Personalização rápida
- **Produtos/preços:** edite o array `PRODUCTS` em `data.js`.
- **Dados da loja** (WhatsApp, endereço, horário, CNPJ): objeto `STORE` em `data.js`.
- **Cores:** variáveis em `:root` no topo de `styles.css`.

## Status da validação
Verificado via navegador (Playwright): 12 rotas retornando **200**, **0 erros de JS** no console,
fluxo completo Home → sacola → checkout (3 etapas) → confirmação → histórico funcionando,
filtros de categoria, busca e login simulado operacionais.
