/* ============================================================
   POST /api/coupon — valida um cupom no servidor
   Body: { code: string, subtotal?: number, hasPreviousOrder?: boolean }
   ============================================================ */

const { COUPONS, PRODUCTS } = require("../data.js");
const { priceOrder } = require("../pricing.js");

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  const body = readBody(req);
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return res.status(400).json({ ok: false, error: "Informe um código de cupom." });

  const coupon = COUPONS.find((c) => c.code === code);
  if (!coupon) return res.status(404).json({ ok: false, error: "Cupom inválido ou expirado." });

  // Calcula o subtotal oficial no servidor a partir dos itens, se enviados.
  let subtotal = Number(body.subtotal) || 0;
  if (Array.isArray(body.items) && body.items.length) {
    const priced = priceOrder({ items: body.items, delivery: "pickup", pay: "money" }, { products: PRODUCTS, coupons: [] });
    if (!priced.ok) return res.status(400).json({ ok: false, error: priced.error });
    subtotal = priced.subtotal;
  }

  if (subtotal < coupon.min) {
    return res.status(422).json({
      ok: false,
      error: `Cupom válido a partir de R$ ${(coupon.min / 100).toFixed(2).replace(".", ",")}.`,
    });
  }
  if (coupon.firstOrder && body.hasPreviousOrder) {
    return res.status(422).json({ ok: false, error: "Este cupom vale apenas no primeiro pedido." });
  }

  return res.status(200).json({
    ok: true,
    code: coupon.code,
    percent: coupon.percent,
    desc: Math.round((subtotal * coupon.percent) / 100),
    descText: coupon.desc,
  });
};
