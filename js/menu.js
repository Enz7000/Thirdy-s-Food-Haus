const menuItems = [
  { id: 1, name: "Sizzling Signature Platter", desc: "Our signature sizzling platter with mixed meats and vegetables", price: 299, img: "images/Sizzling Signature Platter.jpg", category: "Sizzling" },
  { id: 2, name: "Sizzling Crispy Sisig Bagnet", desc: "Crispy sisig with bagnet on a sizzling plate", price: 279, img: "images/Sizzling crispy sisig bagnet.jpg", category: "Sizzling" },
  { id: 3, name: "Pork Sisig", desc: "Classic Filipino sisig made with pork", price: 199, img: "images/PorkSisig.jpg", category: "Sizzling" },
  { id: 4, name: "Pork Sisig with Grilled Pork Chop", desc: "Sisig topped with juicy grilled pork chop", price: 249, img: "images/Pork Sisig with Grilled pork chop.jpg", category: "Sizzling" },
  { id: 5, name: "Pork Sisig with Chicken", desc: "Sisig served with grilled chicken", price: 229, img: "images/Pork Sisig with Chicken.jpg", category: "Sizzling" },
  { id: 6, name: "Pork Sisig with Chicharon Bulaklak", desc: "Sisig with crispy chicharon bulaklak", price: 239, img: "images/Pork Sisig with Chicharon Bulaklak.jpg", category: "Sizzling" },
  { id: 7, name: "Palabok Overload", desc: "Rich noodles with shrimp, pork, and toppings", price: 189, img: "images/PalabokOverload.jpg", category: "Noodles" },
  { id: 8, name: "Beef Mami Overload", desc: "Hearty beef noodle soup with generous toppings", price: 219, img: "images/BEEF MAMI OVERLOAD.jpg", category: "Noodles" },
  { id: 9, name: "Chicharon Bulaklak", desc: "Crispy fried pork intestines, a Filipino favorite", price: 179, img: "images/Chicharon Bulaklak.jpg", category: "Appetizers" },
  { id: 10, name: "Fluffy Mango Float", desc: "Layered graham crackers, cream, and sweet mangoes", price: 99, img: "images/Fluffy Mango Float.jpg", category: "Desserts" },
  { id: 11, name: "Deep Fried Whole Bangus", desc: "Crispy whole milkfish, golden and delicious", price: 259, img: "images/Deep fried whole Bangus.jpg", category: "Mains" },
  { id: 12, name: "Giant Special Tapioca", desc: "Refreshing tapioca pearls with sweet syrup", price: 79, img: "images/Giant Special Tapioca.jpg", category: "Drinks" },
  { id: 13, name: "Grilled BBQ Pork Chop", desc: "Tender pork chop marinated in BBQ sauce", price: 229, img: "images/Grilled BBQ Pork Chop.jpg", category: "Mains" },
  { id: 14, name: "Grilled Pork Belly Liempo", desc: "Juicy grilled pork belly, Filipino style", price: 249, img: "images/Grilled pork belly liempo.jpg", category: "Mains" }
];

const IMG_BASE = /\/(customer|admin)\//.test(window.location.pathname) ? '../' : '';

function imgSrc(path) {
  return IMG_BASE + path;
}

function getCategories() {
  const cats = [...new Set(menuItems.map(m => m.category))];
  return cats.sort();
}

function renderMenuGrid(items, containerId) {
  const grid = document.getElementById(containerId);
  if (!grid) return;
  grid.innerHTML = '';
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${imgSrc(item.img)}" alt="${item.name}" onerror="this.onerror=null;this.src='${imgSrc('images/placeholder.svg')}'">
      <div class="card-body">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="price">₱${item.price.toFixed(2)}</div>
        <button class="btn primary add-to-cart" data-id="${item.id}" style="width:100%;margin-top:0.75rem;">Add to Cart</button>
      </div>
    `;
    grid.appendChild(card);
  });
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => addToCart(parseInt(btn.dataset.id)));
  });
}

function populateCategoryFilter(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  getCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function setupMenuFilters() {
  const search = document.getElementById('search');
  const category = document.getElementById('category');
  if (!search || !category) return;

  function filter() {
    const term = search.value.toLowerCase();
    const cat = category.value;
    const filtered = menuItems.filter(item => {
      const matchTerm = item.name.toLowerCase().includes(term) || item.desc.toLowerCase().includes(term);
      const matchCat = !cat || item.category === cat;
      return matchTerm && matchCat;
    });
    renderMenuGrid(filtered, 'menuGrid');
  }

  search.addEventListener('input', filter);
  category.addEventListener('change', filter);
}

function addToCart(itemId) {
  const item = menuItems.find(m => m.id === itemId);
  if (!item) return;
  let cart = Store.getCart();
  const existing = cart.find(i => i.id === itemId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  Store.saveCart(cart);
  updateCartCount();
  if (typeof CustomerNav !== 'undefined') CustomerNav.updateCartBadge();
  Guard.showToast(`${item.name} added to cart!`);
}

function removeFromCart(itemId) {
  let cart = Store.getCart();
  cart = cart.filter(i => i.id !== itemId);
  Store.saveCart(cart);
  updateCartCount();
  if (typeof CustomerNav !== 'undefined') CustomerNav.updateCartBadge();
  renderCart();
}

function updateCartQty(itemId, delta) {
  let cart = Store.getCart();
  const item = cart.find(i => i.id === itemId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== itemId);
    }
    Store.saveCart(cart);
    updateCartCount();
    if (typeof CustomerNav !== 'undefined') CustomerNav.updateCartBadge();
    renderCart();
  }
}

function getCart() {
  return Store.getCart();
}

function updateCartCount() {
  const cart = getCart();
  const total = cart.reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = total);
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const emptyCart = document.getElementById('emptyCart');
  const cartTotal = document.getElementById('cartTotal');
  if (!cartItems) return;

  const cart = getCart();
  if (cart.length === 0) {
    cartItems.innerHTML = '';
    if (emptyCart) emptyCart.style.display = 'block';
    if (cartTotal) cartTotal.textContent = '0.00';
    return;
  }
  if (emptyCart) emptyCart.style.display = 'none';

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₱${item.price.toFixed(2)} each</div>
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" data-id="${item.id}" data-delta="-1">−</button>
        <span>${item.qty}</span>
        <button class="qty-btn" data-id="${item.id}" data-delta="1">+</button>
        <button class="qty-btn" data-id="${item.id}" data-remove="1" style="margin-left:0.5rem;color:#e74c3c;">×</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.cart-item-qty button[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(parseInt(btn.dataset.id)));
  });
  document.querySelectorAll('.cart-item-qty button[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => updateCartQty(parseInt(btn.dataset.id), parseInt(btn.dataset.delta)));
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  if (cartTotal) cartTotal.textContent = total.toFixed(2);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  initMobileMenu();
  populateCategoryFilter('category');
  setupMenuFilters();
  renderMenuGrid(menuItems, 'menuGrid');
  renderCart();
});