/* ============================================================
   POST /api/order — recalcula e registra um pedido
   Body: { items:[{id,qty}], delivery, pay, customer:{name,phone},
           coupon?, address?, obs? }
   O preço é sempre recalculado no servidor (nunca confia no cliente).
   ============================================================ */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { PRODUCTS, COUPONS, LOYALTY } = require("../data.js");
const { priceOrder, cleanCustomer } = require("../pricing.js");

const ORDER_DIR = process.env.ORDER_DIR || path.join("/tmp", "maisqpopular-orders");
const ORDER_FILE = path.join(ORDER_DIR, "orders.ndjson");

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return {};
}

/** ID curto e legível, ex.: MQ-7F3K9Q */
function orderId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `MQ-${out}`;
}

/** Remove qualquer dado sensível/desnecessário do endereço. */
function cleanAddress(a) {
  if (!a || typeof a !== "object") return null;
  const pick = (v, max = 120) => String(v ?? "").trim().slice(0, max);
  const address = {
    cep: pick(a.cep, 9),
    rua: pick(a.rua),
    num: pick(a.num, 10),
    bairro: pick(a.bairro, 60),
    compl: pick(a.compl, 80),
  };
  return address.rua ? address : null;
}

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  const body = readBody(req);

  const priced = priceOrder(
    {
      items: body.items,
      delivery: body.delivery,
      pay: body.pay,
      coupon: body.coupon,
      hasPreviousOrder: Boolean(body.hasPreviousOrder),
    },
    { products: PRODUCTS, coupons: COUPONS }
  );

  if (!priced.ok) return res.status(422).json({ ok: false, error: priced.error });

  // Sem nome e telefone não há como entregar nem avisar o cliente.
  const customer = cleanCustomer(body.customer);
  if (!customer.ok) return res.status(422).json({ ok: false, error: customer.error });

  const address = priced.delivery === "delivery" ? cleanAddress(body.address) : null;
  if (priced.delivery === "delivery" && !address) {
    return res.status(422).json({ ok: false, error: "Informe o endereço de entrega." });
  }

  const points = Math.round(priced.total / 100) * (LOYALTY?.pointsPerReal ?? 1);

  const order = {
    id: orderId(),
    date: new Date().toISOString(),
    status: "confirmed",
    items: priced.items.map((l) => ({ id: l.id, name: l.name, price: l.price, qty: l.qty })),
    delivery: priced.delivery,
    pay: priced.pay,
    customer: customer.customer,
    address,
    obs: String(body.obs ?? "").trim().slice(0, 300),
    coupon: priced.coupon,
    couponDesc: priced.couponDesc,
    pixDesc: priced.pixDesc,
    subtotal: priced.subtotal,
    frete: priced.frete,
    total: priced.total,
    points,
  };

  // Persistência: grava o pedido em disco (NDJSON, append-only).
  // ATENÇÃO: na Vercel o /tmp é efêmero e não é compartilhado entre
  // instâncias. Serve como registro imediato/log, não como banco.
  // Para produção com histórico confiável, troque por um banco (ver README).
  let persisted = false;
  try {
    fs.mkdirSync(ORDER_DIR, { recursive: true });
    fs.appendFileSync(ORDER_FILE, JSON.stringify(order) + "\n", "utf8");
    persisted = true;
  } catch (err) {
    console.error(`[order] falha ao persistir ${order.id}:`, err.message);
  }

  console.log(
    `[order] ${order.id} total=${order.total} itens=${order.items.length} persistido=${persisted}`
  );

  return res.status(201).json({ ok: true, order: { ...order, persisted } });
};
