# -*- coding: utf-8 -*-
"""
Gera produtos.js a partir de Estoque_por_Categoria.xlsx.

Abas usadas: REFERÊNCIA (= éticos), GENÉRICO, SIMILAR, PERFUMARIA.
"""
import json
import sys

sys.path.insert(0, r"D:\Nova pasta\app e site\maisqpopular-clone\scripts")
from gerar_catalogo import main

OUT = r"D:\Nova pasta\app e site\maisqpopular-clone\produtos.js"


def render(products):
    lines = []
    for p in products:
        lines.append(
            "  { id: %s, cat: %s, name: %s, tag: %s, ico: %s, price: %d, rating: 0, reviews: 0, rx: false }"
            % (
                json.dumps(p["id"]),
                json.dumps(p["cat"]),
                json.dumps(p["name"], ensure_ascii=False),
                json.dumps(p["tag"], ensure_ascii=False),
                json.dumps(p["ico"], ensure_ascii=False),
                p["price"],
            )
        )
    return ",\n".join(lines)


products, stats = main()
body = render(products)

content = (
    "/* ============================================================\n"
    "   Farmácia Mais Que Popular — catálogo completo\n"
    "   GERADO AUTOMATICAMENTE por scripts/gerar_catalogo.py\n"
    "   Fonte: Estoque_por_Categoria.xlsx (abas REFERÊNCIA, GENÉRICO,\n"
    "   SIMILAR e PERFUMARIA). NÃO EDITE À MÃO — ajuste a planilha\n"
    "   (ou a margem no script) e rode o gerador novamente.\n"
    "\n"
    "   Preço de venda = Valor Unit. da planilha + margem de 35%,\n"
    "   arredondado para terminar em ,90.\n"
    "   ============================================================ */\n"
    "const PRODUCTS_EXCEL = [\n"
    + body
    + "\n];\n"
    "\n"
    "/* data.js é script clássico: `const` de TOPO não vira propriedade de\n"
    "   window, então o catálogo precisa ser anexado explicitamente. */\n"
    "if (typeof window !== \"undefined\") window.PRODUCTS_EXCEL = PRODUCTS_EXCEL;\n"
    "if (typeof module !== \"undefined\" && module.exports) module.exports = PRODUCTS_EXCEL;\n"
)

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(content)

print("linhas lidas por aba:", stats)
print("produtos gerados:", len(products))
print("escrito em:", OUT)
