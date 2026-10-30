/* Testes das regras de preço e das rotas /api.
   Rode com:  npm run test:pricing
   Não usa dependências externas. */
const assert = require("assert");
const { priceOrder } = require("../pricing.js");
const { PRODUCTS, COUPONS } = require("../data.js");

const cat = { products: PRODUCTS, coupons: COUPONS };
let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FALHOU  ${name}\n        ${err.message}`);
    process.exitCode = 1;
  }
};

const base = { items: [{ id: "med-03", qty: 2 }], delivery: "delivery", pay: "pix" };

test("recalcula preços pelo catálogo, ignorando valores do cliente", () => {
  const r = priceOrder({ ...base, items: [{ id: "med-03", qty: 2, price: 1 }] }, cat);
  assert.ok(r.ok);
  assert.strictEqual(r.subtotal, 2980);
});

test("frete grátis acima de R$ 150", () => {
  const r = priceOrder({ items: [{ id: "med-07", qty: 1 }], delivery: "delivery", pay: "money" }, cat);
  assert.strictEqual(r.subtotal, 18990);
  assert.strictEqual(r.frete, 0);
});

test("frete cobrado abaixo de R$ 150", () => {
  const r = priceOrder({ ...base, pay: "money" }, cat);
  assert.strictEqual(r.frete, 1290);
});

test("retirada na loja não cobra frete", () => {
  const r = priceOrder({ ...base, delivery: "pickup" }, cat);
  assert.strictEqual(r.frete, 0);
});

test("Pix aplica 5% sobre o valor pós-cupom", () => {
  const r = priceOrder({ ...base, pay: "money" }, cat);
  const pix = priceOrder(base, cat);
  assert.strictEqual(r.pixDesc, 0);
  assert.strictEqual(pix.pixDesc, Math.round(r.subtotal * 0.05));
});

test("cupom percentual aplicado no subtotal", () => {
  const r = priceOrder({ ...base, coupon: "qpopular5" }, cat);
  assert.ok(r.ok);
  assert.strictEqual(r.coupon, "QPOPULAR5");
  assert.strictEqual(r.couponDesc, Math.round(2980 * 0.05));
});

test("cupom inexistente é rejeitado", () => {
  const r = priceOrder({ ...base, coupon: "NAOEXISTE" }, cat);
  assert.strictEqual(r.ok, false);
});

test("cupom com mínimo não aplicável é rejeitado", () => {
  const r = priceOrder({ ...base, coupon: "TAPANA15" }, cat);
  assert.strictEqual(r.ok, false);
});

test("cupom de primeiro pedido falha com histórico", () => {
  const r = priceOrder({ ...base, coupon: "BEMVINDO10", hasPreviousOrder: true }, cat);
  assert.strictEqual(r.ok, false);
});

test("produto controlado exige receita", () => {
  const r = priceOrder({ items: [{ id: "med-05", qty: 1 }] }, cat);
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /receita/i);
});

test("quantidade inválida é rejeitada", () => {
  assert.strictEqual(priceOrder({ items: [{ id: "med-03", qty: 0 }] }, cat).ok, false);
  assert.strictEqual(priceOrder({ items: [{ id: "med-03", qty: 500 }] }, cat).ok, false);
  assert.strictEqual(priceOrder({ items: [{ id: "med-03", qty: "abc" }] }, cat).ok, false);
  assert.strictEqual(priceOrder({ items: [{ id: "med-03", qty: Infinity }] }, cat).ok, false);
  // 1.7 é arredondado para baixo (1), como o input type=number do navegador
  assert.strictEqual(priceOrder({ items: [{ id: "med-03", qty: 1.7 }] }, cat).items[0].qty, 1);
});

test("sacola vazia é rejeitada", () => {
  assert.strictEqual(priceOrder({ items: [] }, cat).ok, false);
});

test("total nunca fica negativo", () => {
  const r = priceOrder({ items: [{ id: "con-04", qty: 1 }], pay: "pix", coupon: "QPOPULAR5" }, cat);
  assert.ok(r.total >= 0);
});

console.log(`\n${passed} testes passaram.`);
