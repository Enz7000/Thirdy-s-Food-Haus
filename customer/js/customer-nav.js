/**
 * customer-nav.js - Shared customer area navbar and utilities
 */

function renderCustomerNavbar() {
  const user = Store.getCurrentUser();
  if (!user) return;
  
  const cart = Store.getCart();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const navbar = document.getElementById('customerNavbar');
  if (!navbar) return;
  
  navbar.innerHTML = `
    <header class="navbar customer-navbar">
      <a class="brand" href="menu.html"><img src="../images/logo.svg" alt="" onerror="this.style.display='none'"><span>Thirdy's Restaurant</span></a>
      <button class="menu-toggle" id="menuToggle">☰</button>
      <nav id="nav">
        <a href="menu.html" data-page="menu">Menu</a>
        <a href="cart.html" data-page="cart" class="cart-nav-link">
          Cart
          <span id="navCartCount" class="cart-badge">${cartCount}</span>
        </a>
        <a href="orders.html" data-page="orders">My Orders</a>
        <a href="pickup.html" data-page="pickup">Pickup Info</a>
        <div class="user-menu">
          <span class="user-name">${Guard.escapeHtml(user.name)}</span>
          <button type="button" class="btn secondary btn-sm" id="btnLogout">Logout</button>
        </div>
      </nav>
    </header>
  `;
  
  // Set active page
  const currentPage = document.body.dataset.page || 'menu';
  const activeLink = navbar.querySelector(`[data-page="${currentPage}"]`);
  if (activeLink) activeLink.classList.add('active');
  
  // Mobile menu toggle
  const toggle = navbar.querySelector('#menuToggle');
  const nav = navbar.querySelector('#nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }
  
  // Logout
  const logoutBtn = navbar.querySelector('#btnLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
    });
  }
}

function updateCartBadge() {
  const cart = Store.getCart();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById('navCartCount');
  if (badge) badge.textContent = cartCount;
}

// Listen for cart updates from other tabs
window.addEventListener('storage', (e) => {
  if (e.key === 'thirdys_cart') {
    updateCartBadge();
  }
});

// Also update periodically
setInterval(updateCartBadge, 2000);

window.CustomerNav = {
  renderCustomerNavbar,
  updateCartBadge
};