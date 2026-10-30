/* ============================================================
   Farmácia Mais Que Popular — regras de preço compartilhadas
   Usado pelo browser (app.js) e pela API (api/*.js).
   ============================================================ */

const FREE_SHIP_MIN = 15000; // R$ 150,00
const SHIP_FEE = 1290;       // R$ 12,90
const PIX_DISCOUNT = 0.05;   // 5% no Pix

const PAY_METHODS = ["pix", "credit", "debit", "money"];
const DELIVERY_METHODS = ["delivery", "pickup"];

/** Só os dígitos do telefone (ex.: "(91) 98408-7045" -> "91984087045"). */
function onlyDigits(v) {
  return String(v ?? "").replace(/\D/g, "");
}

/**
 * Valida e normaliza o cliente do pedido (obrigatório: nome + WhatsApp).
 * Usado pelo checkout e pela API para a mesma regra valer nos dois lados.
 * @returns {{ ok: true, customer: { name: string, phone: string } } | { ok: false, error: string }}
 */
function cleanCustomer(c) {
  const name = String(c?.name ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (name.length < 3) return { ok: false, error: "Informe o nome de quem vai receber o pedido." };

  const phone = onlyDigits(c?.phone);
  // Celular brasileiro com DDD: 11 dígitos (9 atendendo) ou 10 (fixo antigo).
  if (phone.length < 10 || phone.length > 13) {
    return { ok: false, error: "Informe um WhatsApp válido com DDD. Ex.: (91) 98408-7045." };
  }
  return { ok: true, customer: { name, phone } };
}

/**
 * Recalcula um pedido a partir dos itens enviados pelo cliente.
 * NUNCA confia em preços vindos do cliente: busca o preço em PRODUCTS.
 *
 * @param {{ items: {id: string, qty: number}[], delivery: string, pay: string,
 *           coupon?: string, hasPreviousOrder?: boolean }} input
 * @param {{ products: any[], coupons: any[] }} catalog
 */
function priceOrder(input, catalog) {
  const { products, coupons } = catalog;
  const items = Array.isArray(input?.items) ? input.items : [];
  const delivery = DELIVERY_METHODS.includes(input?.delivery) ? input.delivery : "delivery";
  const pay = PAY_METHODS.includes(input?.pay) ? input.pay : "pix";

  if (!items.length) return { ok: false, error: "Sacola vazia." };

  // Normaliza e valida itens contra o catálogo
  const lines = [];
  for (const it of items) {
    const product = products.find((p) => p.id === it?.id);
    if (!product) return { ok: false, error: `Produto não encontrado: ${it?.id}` };
    const qty = Math.floor(Number(it.qty));
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      return { ok: false, error: `Quantidade inválida para ${product.name}.` };
    }
    if (product.rx) {
      return { ok: false, error: `${product.name} exige receita médica. Envie a receita pelo WhatsApp.` };
    }
    lines.push({ id: product.id, name: product.name, price: product.price, qty, total: product.price * qty });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.total, 0);

  // Cupom
  let couponCode = "";
  let couponPercent = 0;
  let couponDesc = 0;
  const code = String(input?.coupon || "").trim().toUpperCase();
  if (code) {
    const coupon = coupons.find((c) => c.code === code);
    if (!coupon) return { ok: false, error: "Cupom inválido ou expirado." };
    if (subtotal < coupon.min) return { ok: false, error: "Cupom não aplicável a este valor." };
    if (coupon.firstOrder && input?.hasPreviousOrder) {
      return { ok: false, error: "Este cupom vale apenas no primeiro pedido." };
    }
    couponCode = coupon.code;
    couponPercent = coupon.percent;
    couponDesc = Math.round((subtotal * coupon.percent) / 100);
  }

  // Frete
  const frete = delivery === "pickup" ? 0 : subtotal >= FREE_SHIP_MIN ? 0 : SHIP_FEE;

  // Descontos (cupom primeiro, depois Pix sobre o total em dinheiro)
  const afterCoupon = subtotal - couponDesc;
  const pixDesc = pay === "pix" ? Math.round(afterCoupon * PIX_DISCOUNT) : 0;
  const total = Math.max(0, afterCoupon + frete - pixDesc);

  return {
    ok: true,
    items: lines,
    delivery,
    pay,
    subtotal,
    frete,
    coupon: couponCode,
    couponPercent,
    couponDesc,
    pixDesc,
    total,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    priceOrder,
    cleanCustomer,
    FREE_SHIP_MIN,
    SHIP_FEE,
    PIX_DISCOUNT,
    PAY_METHODS,
    DELIVERY_METHODS,
  };
}
