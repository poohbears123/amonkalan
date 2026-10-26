/* =========================
   AMON KALAN — APP LOGIC
========================= */

// Menu data.
// Photos currently use local placeholder images in /photos.
// To use real photos later: simply replace each SVG file with a real photo
// (e.g. "photos/sisig-burrito.jpg") and update the `img` path on the dish.
const DISHES = [
  {
    id: "sisig-burrito",
    tag: "Fusion favorite",
    name: "Sisig Burrito",
    desc: "Pork sisig wrapped in a burrito with garlic rice or stuffed inside tacos.",
    price: 80,
    emoji: "🌯",
    img: "photos/sisig-burrito.svg",
    bg: "linear-gradient(135deg, #b0413e, #e07a3f)",
  },
  {
    id: "sinigang-wings",
    tag: "Fusion favorite",
    name: "Crispy Sinigang Wings",
    desc: "Crispy sinigang wings combine classic fried chicken with the sour, savory kick of Filipino tamarind soup mix.",
    price: 80,
    emoji: "🍗",
    img: "photos/crispy-sinigang-wings.svg",
    bg: "linear-gradient(135deg, #c97a2b, #e8b356)",
  },
  {
    id: "pad-kra-pao",
    tag: "Fusion favorite",
    name: "Adobo Pad Kra Pao",
    desc: "Minced pork or chicken cooked with traditional adobo ingredients and stir-fried with hot basil and chilies over rice.",
    price: 80,
    emoji: "🍜",
    img: "photos/adobo-pad-kra-pao.svg",
    bg: "linear-gradient(135deg, #2f5d46, #7a9b6d)",
  },
  {
    id: "chicken-pastil",
    tag: "Fusion favorite",
    name: "Chicken Pastil Masala",
    desc: "A flavorful dish that combines Mindanao-style shredded chicken pastil with rich, aromatic Indian masala spices.",
    price: 95,
    emoji: "🍛",
    img: "photos/chicken-pastil-masala.svg",
    bg: "linear-gradient(135deg, #8a4b16, #c8813a)",
  },
  {
    id: "lumpiang-sushi",
    tag: "Fusion favorite",
    name: "Lumpiang Sushi",
    desc: "A fusion roll featuring Filipino lumpia fillings wrapped in nori and sushi rice.",
    price: 95,
    emoji: "🍣",
    img: "photos/lumpiang-sushi.svg",
    bg: "linear-gradient(135deg, #14424a, #3f7d7a)",
  },
];

const ADD_ONS = [
  { id: "extra-rice", name: "Extra Rice", price: 15 },
];

const CURRENCY = "₱";
const PESO = (n) => `${CURRENCY}${n.toLocaleString("en-PH")}`;

// ---- State ----
const cart = new Map(); // id -> { name, price, qty }
let orders = [];
let pendingOrderNumber = null; // generated when review opens, reused on submit
try {
  orders = JSON.parse(localStorage.getItem("ak_orders") || "[]");
} catch (_) {
  orders = [];
}
const saveOrders = () => localStorage.setItem("ak_orders", JSON.stringify(orders));

const $ = (id) => document.getElementById(id);

/* =========================
   MENU RENDERING
========================= */

function dishPhoto(dish) {
  return `
    <div class="dish-photo" style="background:${dish.bg}">
      ${
        dish.img
          ? `<img src="${dish.img}" alt="${dish.name}" onerror="this.closest('.dish-photo').innerHTML='${dish.emoji}'" />`
          : `<span aria-hidden="true">${dish.emoji}</span>`
      }
    </div>`;
}

function renderMenu() {
  $("menuGrid").innerHTML = DISHES.map(
    (d) => `
    <article class="dish-card">
      ${dishPhoto(d)}
      <div class="dish-info">
        <p class="eyebrow">${d.tag}</p>
        <h3 class="dish-title">${d.name}</h3>
        <p class="dish-desc">${d.desc}</p>
        <div class="dish-footer">
          <span class="price">${PESO(d.price)}</span>
          <div class="dish-actions">
            <button class="btn small primary add-to-cart" data-id="${d.id}">Add to cart</button>
            <button class="btn small ghost view-details" data-id="${d.id}">View details</button>
          </div>
        </div>
      </div>
    </article>`
  ).join("");

  document.querySelectorAll(".view-details").forEach((btn) => {
    btn.addEventListener("click", () => openDishModal(btn.dataset.id));
  });

  document.querySelectorAll(".add-to-cart").forEach((btn) => {
    btn.addEventListener("click", () => addToCart(btn.dataset.id));
  });
}

/* Shared cart-add used by dish cards and the details modal */
function addToCart(id) {
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) return;
  if (!cart.has(dish.id)) cart.set(dish.id, { id: dish.id, name: dish.name, price: dish.price, qty: 0 });
  cart.get(dish.id).qty += 1;
  renderCart();
  toast(`${dish.name} added to your cart`);
}

/* =========================
   CART
========================= */

function cartTotals() {
  let count = 0;
  let subtotal = 0;
  cart.forEach((item) => {
    count += item.qty;
    subtotal += item.qty * item.price;
  });
  return { count, subtotal };
}

function renderCart() {
  const { count, subtotal } = cartTotals();
  $("cartBadge").textContent = count;
  $("cartCount").textContent = `${count} item${count === 1 ? "" : "s"}`;
  $("cartSubtotal").textContent = PESO(subtotal);

  const area = $("cartItems");
  if (cart.size === 0) {
    area.innerHTML = `<p class="cart-empty">Your cart is waiting for something delicious.</p>`;
  } else {
    area.innerHTML =
      [...cart.values()]
        .map(
          (item) => `
        <div class="cart-item">
          <span class="name">${item.name}</span>
          <span class="qty-controls" data-id="${item.id}">
            <button class="step-btn minus" aria-label="Remove one">&minus;</button>
            <span class="step-count">${item.qty}</span>
            <button class="step-btn plus" aria-label="Add one">+</button>
          </span>
          <span class="cart-line-price">${PESO(item.qty * item.price)}</span>
        </div>`
        )
        .join("");

    area.querySelectorAll(".qty-controls").forEach((ctrl) => {
      ctrl.querySelector(".minus").addEventListener("click", () => changeQty(ctrl.dataset.id, -1));
      ctrl.querySelector(".plus").addEventListener("click", () => changeQty(ctrl.dataset.id, 1));
    });
  }

  const addonsStepper = document.querySelector(".stepper");
  const riceQty = cart.get("extra-rice")?.qty || 0;
  addonsStepper.querySelector(".step-count").textContent = riceQty;
  addonsStepper.querySelector(".minus").disabled = riceQty === 0;
}

function changeQty(id, delta) {
  const item = cart.get(id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart.delete(id);
  renderCart();
}

// Add-on stepper (Extra Rice)
document.querySelector(".stepper").addEventListener("click", (e) => {
  const btn = e.target.closest(".step-btn");
  if (!btn) return;
  const pill = btn.closest(".stepper");
  const id = "extra-rice";
  const addOn = ADD_ONS.find((a) => a.id === id);
  if (!cart.has(id)) cart.set(id, { id, name: addOn.name, price: addOn.price, qty: 0 });
  cart.get(id).qty += btn.classList.contains("plus") ? 1 : -1;
  if (cart.get(id).qty <= 0) cart.delete(id);
  renderCart();
});

/* =========================
   DISH MODAL
========================= */

let modalDishId = null;

function openDishModal(id) {
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) return;
  modalDishId = id;
  $("dishModalThumb").style.background = dish.bg;
  $("dishModalThumb").innerHTML = dish.img
    ? `<img src="${dish.img}" alt="${dish.name}" onerror="this.parentElement.textContent='${dish.emoji}'" />`
    : dish.emoji;
  $("dishModalTag").textContent = dish.tag;
  $("dishModalName").textContent = dish.name;
  $("dishModalDesc").textContent = dish.desc;
  $("dishModalPrice").textContent = PESO(dish.price);
  $("dishModal").hidden = false;
}

$("dishModalAdd").addEventListener("click", () => {
  if (!modalDishId) return;
  addToCart(modalDishId);
  $("dishModal").hidden = true;
});

/* =========================
   MODAL HELPERS
========================= */

function openReviewModal() {
  const { count, subtotal } = cartTotals();
  if (count === 0) {
    toast("Your cart is empty — add a dish first 🙂");
    return;
  }
  // Generate once, keep stable if the customer goes back & edits.
  pendingOrderNumber ||= `AK-${randomHex(12).toUpperCase()}`;
  const items = [...cart.values()].map((i) => `${i.name} × ${i.qty} — ${PESO(i.qty * i.price)}`);
  const data = collectForm();
  $("reviewList").innerHTML = `
    <div><dt>Order number</dt><dd>${pendingOrderNumber}</dd></div>
    <div><dt>Items</dt><dd class="items-line">${items.join("<br />")}</dd></div>
    <div><dt>Food subtotal</dt><dd>${PESO(subtotal)} · ${count} item${count === 1 ? "" : "s"}</dd></div>
    <div><dt>Name</dt><dd>${escapeHtml(data.name)}</dd></div>
    <div><dt>Contact number</dt><dd>${escapeHtml(data.number)}</dd></div>
    <div><dt>Fulfillment</dt><dd>${data.fulfillment === "Pickup" ? `${data.fulfillment} · ${data.location}` : data.fulfillment}</dd></div>
    <div><dt>Payment</dt><dd>${data.payment}</dd></div>
    <div><dt>Cutlery</dt><dd>${data.cutlery}</dd></div>
    <div><dt>Notes</dt><dd>${data.notes ? escapeHtml(data.notes) : "—"}</dd></div>`;
  renderPaymentQr(data, subtotal);
  $("reviewModal").hidden = false;
}

/* =========================
   PAYMENT QR (GCash / Bank)
   ========================= */

const QR_FALLBACK = "photos/payment-qr-placeholder.svg";

function renderPaymentQr(data, subtotal) {
  const box = $("paymentQrBox");
  const isQrPayment = data.payment.includes("GCash") || data.payment.includes("Bank");
  if (!isQrPayment) {
    box.hidden = true;
    return;
  }
  const text = `Amon Kalan ${data.payment} payment · Order ${pendingOrderNumber} · ${PESO(subtotal)} · for ${data.name}`;
  const img = $("paymentQrImg");
  img.onerror = () => {
    img.onerror = null;
    img.src = QR_FALLBACK;
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  $("paymentQrCaption").innerHTML =
    `Scan to pay via <strong>${escapeHtml(data.payment)}</strong> — ${PESO(subtotal)} · Order <strong>${pendingOrderNumber}</strong>`;
  box.hidden = false;
}

const escapeHtml = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* =========================
   ORDER FORM FLOW
========================= */

function collectForm() {
  return {
    name: $("custName").value.trim(),
    number: $("custNumber").value.trim(),
    fulfillment: document.querySelector('input[name="fulfillment"]:checked').value,
    location: $("pickupLocation").value,
    payment: $("paymentMethod").value,
    cutlery: document.querySelector('input[name="cutlery"]:checked').value,
    notes: $("orderNotes").value.trim(),
  };
}

/* =========================
   FULFILLMENT → PAYMENT SYNC
   ========================= */

// Available payment methods depend on how the order is fulfilled.
const PAYMENT_OPTIONS = {
  Pickup: ["Cash on pickup", "GCash", "Bank transfer"],
  Delivery: ["Cash on delivery", "GCash", "Bank transfer"],
};

function updatePaymentOptions() {
  const fulfillment = document.querySelector('input[name="fulfillment"]:checked').value;
  const options = PAYMENT_OPTIONS[fulfillment];
  const select = $("paymentMethod");
  const previous = select.value;
  select.innerHTML = options.map((label) => `<option>${label}</option>`).join("");
  // Keep the customer's choice if it is still valid (e.g. GCash).
  if (options.includes(previous)) select.value = previous;
}

document.querySelectorAll('input[name="fulfillment"]').forEach((radio) => {
  radio.addEventListener("change", updatePaymentOptions);
});
updatePaymentOptions();

/* =========================
   CONTACT NUMBER INPUT
   Digits only, max 11
   ========================= */

$("custNumber").addEventListener("input", () => {
  const field = $("custNumber");
  field.value = field.value.replace(/\D/g, "").slice(0, 11);
});

$("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const data = collectForm();

  if (!data.name || !data.number) {
    toast("Please fill in your name and contact number.");
    if (!data.name) $("custName").focus();
    else $("custNumber").focus();
    return;
  }
  if (!/^\d{11}$/.test(data.number)) {
    toast("Contact number must be exactly 11 digits (e.g. 09XXXXXXXXX).");
    $("custNumber").focus();
    return;
  }
  openReviewModal();
});

$("reviewEdit").addEventListener("click", () => {
  $("reviewModal").hidden = true;
});

$("reviewSubmit").addEventListener("click", () => {
  const orderNumber = pendingOrderNumber || `AK-${randomHex(12).toUpperCase()}`;
  pendingOrderNumber = null;
  const data = collectForm();
  const { count, subtotal } = cartTotals();

  orders.push({
    orderNumber,
    name: data.name,
    contact: data.number,
    fulfillment: data.fulfillment,
    location: data.location,
    payment: data.payment,
    cutlery: data.cutlery,
    notes: data.notes,
    items: [...cart.values()].map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    subtotal,
    count,
    status: "Pending confirmation",
    placedAt: new Date().toLocaleString("en-PH"),
  });
  saveOrders();
  renderVisitedOrders();

  cart.clear();
  renderCart();
  $("reviewModal").hidden = true;
  $("orderForm").reset();
  updatePaymentOptions();
  document.querySelector('input[name="fulfillment"][value="Pickup"]').checked = true;
  document.querySelector('input[name="cutlery"][value="Yes"]').checked = true;
  toast(`Order submitted! Keep your number safe: ${orderNumber}`);
});

const randomHex = (len) =>
  Array.from({ length: len }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join("");

/* =========================
   CHECK AN ORDER
========================= */

function checkStatus(input) {
  const order = orders.find((o) => o.orderNumber.toLowerCase() === input.toLowerCase());
  const box = $("statusResult");
  box.hidden = false;
  if (!order) {
    box.className = "status-result err";
    box.innerHTML = `<strong>No order found with that number.</strong> Check the spelling and try again, or ask the kitchen for help.`;
  } else {
    box.className = "status-result ok";
    box.innerHTML = `
      <strong>${order.orderNumber} — ${order.status}</strong>
      ${order.count} item${order.count === 1 ? "" : "s"} · ${PESO(order.subtotal)} · ${escapeHtml(order.name)} · ${escapeHtml(order.placedAt)}`;
  }
}

$("checkStatusBtn").addEventListener("click", () => {
  const input = $("orderNumber").value.trim();
  if (!input) {
    toast("Enter your order number first.");
    $("orderNumber").focus();
    return;
  }
  checkStatus(input);
});

function renderVisitedOrders() {
  const list = $("visitedList");
  if (orders.length === 0) {
    list.innerHTML = `<li class="empty">No orders submitted during this visit.</li>`;
    return;
  }
  list.innerHTML = orders
    .map(
      (o) => `
      <li>
        <span><strong>${o.orderNumber}</strong> <span class="muted">· ${o.count} item${o.count === 1 ? "" : "s"} · ${PESO(o.subtotal)}</span></span>
        <span class="pill pending">${o.status}</span>
      </li>`
    )
    .join("");
}

/* =========================
   SMALL UI HELPERS
========================= */

let toastTimer;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2800);
}

// Close modals on backdrop click or Esc
[["dishModal", "dishModalClose"], ["reviewModal", "reviewModalClose"]].forEach(([backdrop, closeBtn]) => {
  $(backdrop).addEventListener("click", (e) => {
    if (e.target === $(backdrop)) $(backdrop).hidden = true;
  });
  $(closeBtn).addEventListener("click", () => {
    $(backdrop).hidden = true;
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    $("dishModal").hidden = true;
    $("reviewModal").hidden = true;
  }
});

// Cart pill scrolls to sidebar / focuses review form
$("cartPill").addEventListener("click", () => {
  document.querySelector(".cart-card").scrollIntoView({ behavior: "smooth", block: "center" });
});

/* =========================
   INIT
========================= */

renderMenu();
renderCart();
renderVisitedOrders();
