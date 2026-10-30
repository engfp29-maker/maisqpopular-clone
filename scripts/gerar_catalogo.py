# -*- coding: utf-8 -*-
"""
Gera produtos.js a partir de Estoque_por_Categoria.xlsx.

Abas usadas: REFERÊNCIA (= éticos), GENÉRICO, SIMILAR, PERFUMARIA.
Colunas: Código | Produto | Qtde | Valor Unit. | Valor Total

Regras aplicadas:
- Descarta a linha SUBTOTAL de cada aba.
- Normaliza nomes (caixa alta, abreviações de embalagem).
- Agrupa nomes duplicados (mesmo produto em códigos diferentes).
- Preço de venda = Valor Unit. + margem, com centavos psicológicos (x,90).
"""
import json
import re
import unicodedata
from collections import OrderedDict

import openpyxl

SRC = r"D:\Nova pasta\clone\Estoque_por_Categoria.xlsx"
OUT = r"D:\Nova pasta\app e site\maisqpopular-clone\produtos.js"

MARGIN = 0.35  # margem aplicada sobre o valor unitário da planilha

SHEETS = OrderedDict([
    ("REFERÊNCIA", dict(slug="medicamentos-e-saude", kind="Referência", ico="💊", group="referencia")),
    ("GENÉRICO",   dict(slug="medicamentos-e-saude", kind="Genérico",   ico="💊", group="generico")),
    ("SIMILAR",    dict(slug="medicamentos-e-saude", kind="Similar",    ico="💊", group="similar")),
    ("PERFUMARIA", dict(slug="dermo-e-beleza",      kind="Perfumaria",  ico="🧴", group="perfumaria")),
])

# Abreviações de embalagem -> texto legível
ABBREV = [
    (r"\bCX\b", "caixa"), (r"\bCPR\b", "comprimidos"), (r"\bCOMP\b", "comprimidos"),
    (r"\bCAPS?\b", "cápsulas"), (r"\bCPS\b", "cápsulas"), (r"\bCP\b", "comprimidos"),
    (r"\bFR\b", "frasco"), (r"\bXPE\b", "xarope"), (r"\bBG\b", "bisnaga"),
    (r"\bSPRAY\b", "spray"), (r"\bSOL\b", "solução"), (r"\bCREM\b", "creme"),
    (r"\bCR\b", "creme"), (r"\bLOC\b", "loção"), (r"\bPOM\b", "pomada"),
    (r"\bAMP\b", "ampola"), (r"\bINJ\b", "injetável"), (r"\bREV\b", "revestido"),
    (r"\bLV\b", "",), (r"\bPG\b", ""), (r"\bTSD\b", ""), (r"\bC/\b", "com "),
    (r"\bS/\b", "sem "), (r"\bEX\b", ""), (r"\bCL\b", ""), (r"\bSACHES\b", "sachês"),
]

# A planilha exporta descrições cortadas em ~40 caracteres. Quando sobram
# fragmentos como "(60" ou "... Frasco 100", completamos ou removemos.
TRUNC_FIX = {
    "PROTETOR SOLAR (60": "Protetor Solar FPS 60",
    "PROT DIARIO CAREFREE TODO DIA SEM PERFUME C": "Protetor Diário Carefree Todo Dia Sem Perfume com 15 unidades",
}
# Fim de nome truncado pela planilha: "... Frasco 100", "... com 30", "... Sus 117"
# (só quando o número final ficou sem unidade de medida)
TRUNC_TAIL = re.compile(
    r"\s+(?:com\s+\d+|(?:Frasco|Caixa|Bisnaga|Ampola|Sachês?|Aplic|Refis?)\s+\d+)$", re.I
)


def clean_tail(name):
    """Remove complementos de embalagem que ficaram sem unidade."""
    fixed = TRUNC_TAIL.sub("", name).strip()
    return fixed if len(fixed) >= 4 else name


def norm_name(raw):
    """Title-case com correção de capitalização para nomes de medicamento."""
    s = re.sub(r"\s+", " ", str(raw)).strip()
    s = s.upper()
    s = s.replace("\\/", "/").replace("\\", "")
    for pat, rep in ABBREV:
        s = re.sub(pat, rep, s)
    s = re.sub(r"\s+", " ", s).strip()
    s = s.rstrip(" ,-/")
    s = s.replace("MCG", "mcg")
    # Title case preservando dosagens (500MG, FPS 60, 10ML)
    out = []
    for word in s.split(" "):
        if not word:
            continue
        w = word.lower()
        if re.fullmatch(r"\d+([,.]\d+)?(mg|g|ml|l|mcg|ui|%)?", w, re.I) or re.search(r"\d", w):
            out.append(word.upper() if re.fullmatch(r"[a-z0-9,/%.]+", w, re.I) else word)
        elif w in ("de", "da", "do", "das", "dos", "e", "com", "sem", "para", "em"):
            out.append(w)
        else:
            out.append(w[:1].upper() + w[1:])
    name = " ".join(out)
    name = name[:1].upper() + name[1:]
    # "1G" -> "1g", "550MG" -> "550mg" (padrão de bula/vitrine);
    # não mexe em medidas por extenso ("60g Farmax") nem em FPS
    name = re.sub(r"(\d)\s*(MG|MCG|ML|G|UI)(?![A-Za-z])", lambda m: m.group(1) + m.group(2).lower(), name)
    # parênteses de marca: "(novalgina)" -> "(Novalgina)", "(p&g)" sai
    name = re.sub(r"\((\w)", lambda m: "(" + m.group(1).upper(), name)
    name = re.sub(r"\s*\((?:P&G|AL|GM2-G|A3|DEMAIS[^)]*)\)\s*", " ", name, flags=re.I)
    name = re.sub(r"\s+", " ", name).strip()
    return name


def price_from_cost(unit):
    """Converte custo unitário em preço de venda com centavos psicológicos."""
    if unit is None:
        return 0
    sale = unit * (1 + MARGIN)
    cents = int(round(sale * 100))
    # arredonda para terminar em ,90 quando o valor permitir
    base = cents - (cents % 100)
    cand = base + 90
    if cand < 100:
        cand = 99
    return cand


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-z0-9]+", "-", s.lower())
    return s.strip("-")[:60]


def main():
    wb = openpyxl.load_workbook(SRC, data_only=True, read_only=True)
    products = []
    stats = {}

    for sheet, cfg in SHEETS.items():
        ws = wb[sheet]
        seen = {}
        rows = 0
        for row in ws.iter_rows(min_row=4, values_only=True):
            vals = (list(row) + [None] * 5)[:5]
            code, prod, qty, unit, _total = vals
            if prod is None or str(prod).strip() == "":
                continue
            if str(prod).strip().upper() in ("SUBTOTAL", "TOTAL"):
                continue
            if not isinstance(unit, (int, float)) or unit <= 0:
                continue
            if not isinstance(qty, (int, float)) or qty <= 0:
                continue
            rows += 1
            key = re.sub(r"\s+", " ", str(prod).strip().upper())
            if key in seen:
                # mesmo produto: soma quantidade, mantém menor preço de venda
                seen[key]["_qty"] += int(qty)
                continue
            name = TRUNC_FIX.get(str(prod).strip().upper()) or norm_name(prod)
            name = clean_tail(name)
            price = price_from_cost(float(unit))
            item = {
                "id": f"{cfg['group'][:3]}-{len(products) + 1:04d}",
                "cat": cfg["slug"],
                "name": name,
                "tag": cfg["kind"],
                "ico": cfg["ico"],
                "price": price,
                "rating": 0,
                "reviews": 0,
                "rx": False,
                "_code": str(code).strip() if code is not None else "",
                "_qty": int(qty),
                "_cost": float(unit),
            }
            seen[key] = item
            products.append(item)
        stats[sheet] = rows
    return products, stats


if __name__ == "__main__":
    products, stats = main()
    print("linhas lidas por aba:", stats)
    print("produtos gerados:", len(products))
