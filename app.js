/* ============================================================
   Farmácia Mais Que Popular — lógica compartilhada
   Header, busca, sacola persistente e cards de produto.
   ============================================================ */

/* ---------- Carrinho (localStorage) ---------- */
const CART_KEY = "mq_cart_v1";
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch { return {}; }
}
function setCart(c) { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); }
// Itens cujo produto saiu do catálogo eram mantidos no carrinho: quebravam
// a renderização e inflavam o total. Descarta-os na leitura.
function pruneCart() {
  const c = getCart();
  const valid = Object.fromEntries(
    Object.entries(c).filter(([id, q]) => byId(id) && Number(q) > 0)
  );
  if (Object.keys(valid).length !== Object.keys(c).length) setCart(valid);
  return valid;
}
function cartCount() { return Object.values(getCart()).reduce((a, b) => a + b, 0); }
function cartTotal() {
  const c = pruneCart();
  return Object.entries(c).reduce((sum, [id, q]) => sum + (byId(id)?.price || 0) * q, 0);
}
function addToCart(id, qty = 1) {
  const c = getCart();
  c[id] = (c[id] || 0) + qty;
  setCart(c);
  toast("Adicionado à sacola");
}
function removeFromCart(id) { const c = getCart(); delete c[id]; setCart(c); }
function setQty(id, qty) {
  const c = getCart();
  if (qty <= 0) delete c[id]; else c[id] = qty;
  setCart(c);
}
function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = n;
    el.classList.toggle("is-on", n > 0);
  });
  const totalEl = document.querySelector("[data-cart-total]");
  if (totalEl) totalEl.textContent = brl(cartTotal());
}

/* ---------- Cupom de desconto ---------- */
const COUPON_KEY = "mq_coupon_v1";

function getCouponCode() {
  return (localStorage.getItem(COUPON_KEY) || "").trim().toUpperCase();
}
function setCouponCode(code) {
  if (code) localStorage.setItem(COUPON_KEY, code.trim().toUpperCase());
  else localStorage.removeItem(COUPON_KEY);
}
/**
 * Valida um código de cupom contra o subtotal atual.
 * @returns {{ ok: boolean, code?: string, percent?: number, desc?: number, descText?: string, error?: string }}
 */
function validateCoupon(code, subtotal = cartTotal()) {
  const clean = (code || "").trim().toUpperCase();
  if (!clean) return { ok: false, error: "Informe um código de cupom." };

  const coupon = (window.COUPONS || []).find((c) => c.code === clean);
  if (!coupon) return { ok: false, error: "Cupom inválido ou expirado." };

  if (subtotal < coupon.min) {
    return { ok: false, error: `Cupom válido a partir de ${brl(coupon.min)}.` };
  }
  if (coupon.firstOrder && hasPreviousOrder()) {
    return { ok: false, error: "Este cupom vale apenas no primeiro pedido." };
  }

  return {
    ok: true,
    code: coupon.code,
    percent: coupon.percent,
    desc: Math.round(subtotal * coupon.percent / 100),
    descText: coupon.desc,
  };
}

/** Aplica o cupom salvo no localStorage; devolve o desconto em centavos (0 se inválido). */
function couponDiscount(subtotal = cartTotal()) {
  const code = getCouponCode();
  if (!code) return { code: "", desc: 0, valid: false };
  const res = validateCoupon(code, subtotal);
  return { code, desc: res.ok ? res.desc : 0, valid: !!res.ok };
}

/* ---------- API (Vercel) ----------
   O site funciona 100% offline/estático: se a API não responder
   (ex.: abrindo o HTML direto, file://), cai no cálculo local. */
const API = {
  base: "",
  timeout: 6000,
};

async function apiPost(path, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API.timeout);
  try {
    const res = await fetch(`${API.base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch {
    return { ok: false, status: 0, offline: true, data: {} };
  } finally {
    clearTimeout(timer);
  }
}

/** Itens da sacola no formato esperado pela API. */
function cartItemsPayload() {
  const c = getCart();
  return Object.entries(c).map(([id, qty]) => ({ id, qty }));
}

/**
 * Valida o cupom no servidor; em caso de falha de rede usa a regra local.
 * Resolve sempre, nunca rejeita.
 */
async function validateCouponRemote(code, subtotal = cartTotal()) {
  const res = await apiPost("/api/coupon", {
    code,
    items: cartItemsPayload(),
    subtotal,
    hasPreviousOrder: hasPreviousOrder(),
  });
  if (res.offline) return validateCoupon(code, subtotal);
  if (res.ok) return { ok: true, ...res.data };
  return { ok: false, error: res.data.error || "Cupom inválido ou expirado." };
}

/**
 * Envia o pedido para a API e devolve o pedido oficial (com id e totais
 * recalculados no servidor). Se a API estiver indisponível, devolve
 * null para o chamador seguir com o fluxo local (WhatsApp).
 */
/* Resultado possíveis:
   { ok:true, order }            -> pedido aceito pelo servidor
   { ok:false, reject:true }     -> regra de negócio recusou (mostrar erro)
   { ok:false, offline:true }    -> servidor inacessível (modo de contingência) */
async function submitOrderRemote(payload) {
  const res = await apiPost("/api/order", payload);
  if (res.ok) return { ok: true, order: res.data.order };
  if (res.offline) return { ok: false, offline: true };
  return { ok: false, reject: true, error: res.data.error || "" };
}

/* ---------- Reenvio de pedidos pendentes ----------
   Pedido salvo como `pending` aconteceu quando o servidor estava fora.
   A cada carregamento de página tentamos enviá-lo de novo. Se o servidor
   recusar por regra de negócio, o pedido deixa de ser reenviado (não adianta
   insistir) e continua visível como "não enviado". */
const SYNC_KEY = "mq_last_sync";

function getPendingOrders() {
  try {
    const hist = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    return Array.isArray(hist) ? hist.filter((o) => o && o.pending === true) : [];
  } catch { return []; }
}

let syncing = false;
async function syncPendingOrders() {
  if (syncing) return;
  if (!navigator.onLine) return;
  const pendentes = getPendingOrders();
  if (!pendentes.length) return;
  // Evita tentar de novo a cada navegação seguida (mínimo 60s entre rodadas).
  const last = Number(sessionStorage.getItem(SYNC_KEY) || 0);
  if (Date.now() - last < 60000) return;
  sessionStorage.setItem(SYNC_KEY, String(Date.now()));

  syncing = true;
  let enviados = 0;
  try {
    for (const ordem of pendentes) {
      const res = await submitOrderRemote({
        items: ordem.items.map((i) => ({ id: i.id, qty: i.qty })),
        delivery: ordem.delivery,
        pay: ordem.pay,
        customer: ordem.customer,
        coupon: ordem.coupon,
        address: ordem.address,
        obs: ordem.obs,
        // Reenvio: o pedido já existia antes, então não vale promoção de 1ª compra.
        hasPreviousOrder: true,
      });
      if (res.offline) break; // rede caiu de novo: tenta na próxima navegação
      try {
        const hist = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
        const idx = hist.findIndex((o) => o && o.id === ordem.id);
        if (idx === -1) continue;
        if (res.ok && res.order) {
          hist[idx] = { ...ordem, ...res.order, server: true, pending: false,
            desc: (res.order.couponDesc || 0) + (res.order.pixDesc || 0), syncError: undefined };
          enviados++;
        } else if (res.reject) {
          // Recusa definitiva: para de tentar, registra o motivo.
          hist[idx] = { ...ordem, pending: false, server: false,
            syncError: res.error || "Pedido recusado pela farmácia." };
        }
        localStorage.setItem(ORDERS_KEY, JSON.stringify(hist.slice(0, 30)));
      } catch {}
    }
  } finally {
    syncing = false;
  }
  if (enviados) {
    document.dispatchEvent(new CustomEvent("mq:orders-synced", { detail: { enviados } }));
  }
}

/* ---------- Fidelidade +Q ---------- */
const POINTS_KEY = "mq_points_v1";
const ORDERS_KEY = "mq_orders";

function getPoints() {
  return Number(localStorage.getItem(POINTS_KEY)) || 0;
}
function addPoints(amount) {
  const total = getPoints() + Math.max(0, Math.round(amount));
  localStorage.setItem(POINTS_KEY, String(total));
  return total;
}
function pointsToReais(points = getPoints()) {
  const cfg = window.LOYALTY || { pointsPerBlock: 100, blockValue: 1000 };
  const blocks = Math.floor(points / cfg.pointsPerBlock);
  return blocks * cfg.blockValue;
}
function hasPreviousOrder() {
  try {
    const hist = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    return hist.length > 0;
  } catch { return false; }
}

/* ---------- Toast ---------- */
function toast(msg) {
  let t = document.getElementById("toast");
  if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("is-on");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("is-on"), 1800);
}

/* ---------- Header (renderizado em todas as páginas) ---------- */
function renderHeader() {
  const host = document.getElementById("site-header");
  if (!host) return;
  // Aba "Categorias" abre a página com filtro lateral. "Ofertas" não fica no menu,
  // mas o slug continua em CATEGORIES para a página ofertas.html e os filtros.
  const nav = [
    `<li><a href="categorias.html">Categorias</a></li>`,
    ...CATEGORIES.filter((c) => c.slug !== "ofertas").map(
      (c) => `<li><a href="categoria.html?cat=${c.slug}">${c.name}</a></li>`
    ),
  ].join("");
  host.innerHTML = `
    <div class="topbar">
      <p class="topbar-tagline">+Q preço, +Q cuidado, +Q perto de você.</p>
    </div>
    <div class="header-main">
      <a class="logo" href="index.html" aria-label="${STORE.name}">
        <img class="logo-img" src="logo.webp" alt="Logo da ${STORE.short}" width="52" height="52" />
        <span class="logo-text"><strong>${STORE.short}</strong><small>${STORE.tag}</small></span>
      </a>
      <form class="search" id="search-form" role="search">
        <input type="search" id="search-input" placeholder="Busque por produto, marca ou categoria" aria-label="Buscar" autocomplete="off" />
        <button type="submit" class="btn btn-primary">Buscar</button>
      </form>
      <div class="header-actions">
        <a class="ha-user" href="entrar.html">
          <span class="ha-ico">👤</span>
          <span class="ha-txt"><small>Bem-vindo!</small><strong>Entre ou cadastre-se</strong></span>
        </a>
        <a class="ha-orders" href="meus-pedidos.html" aria-label="Meus pedidos" title="Meus pedidos">
          <span class="ha-ico">📦</span>
        </a>
        <a class="ha-cart" href="carrinho.html" aria-label="Minha sacola">
          <span class="ha-ico">🛒<span class="cart-badge" data-cart-badge>0</span></span>
          <span class="ha-txt"><small>Minha sacola</small><strong data-cart-total>R$ 0,00</strong></span>
        </a>
      </div>
    </div>
    <nav class="catnav" aria-label="Categorias"><ul>${nav}</ul></nav>
  `;
}

/* ---------- Benefícios (faixa icônica) ---------- */
function renderBenefits() {
  const host = document.getElementById("benefits");
  if (!host) return;
  const items = [
    { ico: "🚚", t: "Entrega no seu bairro", s: "Tapanã, Pratinha, Parque Verde e Icoaraci" },
    { ico: "🏬", t: "Clique e Retire", s: "Retire já separado com o seu nome" },
    { ico: "💊", t: "Entrega de medicamentos", s: "Todos, onde você estiver" },
    { ico: "🕗", t: "Aberto todos os dias", s: STORE.hoursShort },
  ];
  host.innerHTML = items.map((i) => `
    <div class="benefit"><span class="b-ico">${i.ico}</span><div><strong>${i.t}</strong><small>${i.s}</small></div></div>
  `).join("");
}

/* ---------- Card de produto ---------- */
// Escapa texto vindo da planilha: nomes podem conter & ("Head&should"), < ou ".
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function productCard(p) {
  const off = discountPct(p);
  const name = esc(p.name);
  // Avaliações reais ainda não existem para o catálogo importado (reviews: 0)
  const rating = p.reviews
    ? `<div class="card-rating">★★★★★ <small>(${p.reviews})</small></div>`
    : "";
  return `
    <article class="card" data-id="${p.id}">
      ${off ? `<span class="card-off">-${off}%</span>` : ""}
      ${p.rx ? `<span class="card-rx">Receita</span>` : ""}
      <a class="card-thumb" href="produto.html?id=${p.id}" aria-label="${name}">
        <span aria-hidden="true">${p.ico}</span>
      </a>
      <a class="card-name" href="produto.html?id=${p.id}">${name}</a>
      <span class="card-tag">${esc(p.tag)}</span>
      ${rating}
      <div class="card-price">
        ${p.oldPrice ? `<small class="price-old">${brl(p.oldPrice)}</small>` : ""}
        ${p.service && p.price === 0 ? `<strong class="price-free">Grátis</strong>` : `<strong>${brl(p.price)}</strong>`}
      </div>
      <button class="btn btn-primary btn-block add-btn" data-id="${p.id}" type="button">Adicionar</button>
    </article>`;
}

function renderProducts(hostId, list) {
  const host = document.getElementById(hostId);
  if (host) host.innerHTML = list.map(productCard).join("");
}

/* ---------- Busca ---------- */
function initSearch() {
  const form = document.getElementById("search-form");
  if (!form) return;
  const input = document.getElementById("search-input");
  const params = new URLSearchParams(location.search);
  if (input && params.get("q")) input.value = params.get("q");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    location.href = q ? `categoria.html?q=${encodeURIComponent(q)}` : "index.html";
  });
}

/* ---------- Nav de categorias: pista de rolagem ---------- */
// O gradiente em .catnav::after só faz sentido enquanto houver itens
// escondidos à direita; some ao chegar no fim da lista.
function initCatnavHint() {
  const nav = document.querySelector(".catnav");
  const list = nav && nav.querySelector("ul");
  if (!list) return;
  const sync = () => {
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 2;
    nav.classList.toggle("at-end", atEnd);
  };
  list.addEventListener("scroll", sync, { passive: true });
  window.addEventListener("resize", sync);
  sync();
}

/* ---------- Delegação global de "Adicionar" ---------- */
document.addEventListener("click", (e) => {
  const add = e.target.closest(".add-btn");
  if (add) { e.preventDefault(); addToCart(add.dataset.id); }
});

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  pruneCart();
  renderHeader();
  renderBenefits();
  initSearch();
  initCatnavHint();
  updateCartBadge();

  // Pedidos que ficaram pendentes por queda de conexão: reenvia em segundo plano.
  syncPendingOrders();
  window.addEventListener("online", () => {
    sessionStorage.removeItem(SYNC_KEY);
    syncPendingOrders();
  });
});
