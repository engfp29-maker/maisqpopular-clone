/* ============================================================
   GET /api/pedido?id=MQ-XXXXXX — consulta um pedido registrado
   Protege dados pessoais: só devolve o pedido se o telefone
   informado bater com o do cadastro.
   Query: id (obrigatório), phone (obrigatório)
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ORDER_DIR = process.env.ORDER_DIR || path.join("/tmp", "maisqpopular-orders");
const ORDER_FILE = path.join(ORDER_DIR, "orders.ndjson");

function onlyDigits(v) {
  return String(v ?? "").replace(/\D/g, "");
}

function findOrder(id) {
  let raw;
  try {
    raw = fs.readFileSync(ORDER_FILE, "utf8");
  } catch {
    return null;
  }
  const target = String(id ?? "").trim().toUpperCase();
  // Lê de trás para frente: pedidos recentes primeiro.
  const lines = raw.split("\n");
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) continue;
    let order;
    try { order = JSON.parse(line); } catch { continue; }
    if (String(order.id).toUpperCase() === target) return order;
  }
  return null;
}

module.exports = function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Método não permitido." });
  }

  const { id, phone } = req.query || {};
  if (!id || !phone) {
    return res.status(422).json({ ok: false, error: "Informe o ID e o telefone do pedido." });
  }

  const order = findOrder(id);
  // Mesma resposta para "não existe" e "telefone errado": não vaza quais IDs são válidos.
  if (!order || onlyDigits(order.customer?.phone) !== onlyDigits(phone)) {
    return res.status(404).json({ ok: false, error: "Pedido não encontrado." });
  }

  return res.status(200).json({ ok: true, order });
};
