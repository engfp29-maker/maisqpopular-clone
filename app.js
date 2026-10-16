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
function cartCount() { return Object.values(getCart()).reduce((a, b) => a + b, 0); }
function cartTotal() {
  const c = getCart();
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
  const nav = CATEGORIES.map((c) => {
    const href = c.slug === "ofertas" ? "ofertas.html" : `categoria.html?cat=${c.slug}`;
    return `<li><a href="${href}">${c.name}</a></li>`;
  }).join("");
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
function productCard(p) {
  const off = discountPct(p);
  return `
    <article class="card" data-id="${p.id}">
      ${off ? `<span class="card-off">-${off}%</span>` : ""}
      ${p.rx ? `<span class="card-rx">Receita</span>` : ""}
      <a class="card-thumb" href="produto.html?id=${p.id}" aria-label="${p.name}">
        <span aria-hidden="true">${p.ico}</span>
      </a>
      <a class="card-name" href="produto.html?id=${p.id}">${p.name}</a>
      <span class="card-tag">${p.tag}</span>
      <div class="card-rating">★★★★★ <small>(${p.reviews})</small></div>
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

/* ---------- Delegação global de "Adicionar" ---------- */
document.addEventListener("click", (e) => {
  const add = e.target.closest(".add-btn");
  if (add) { e.preventDefault(); addToCart(add.dataset.id); }
});

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderBenefits();
  initSearch();
  updateCartBadge();
});
