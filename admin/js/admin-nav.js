/**
 * admin-nav.js - Shared admin area navbar
 */

function renderAdminNavbar() {
  const user = Store.getCurrentUser();
  if (!user) return;
  
  const navbar = document.getElementById('adminNavbar');
  if (!navbar) return;
  
  navbar.innerHTML = `
    <header class="navbar admin-navbar">
      <a class="brand" href="orders.html"><img src="../images/logo.svg" alt="" onerror="this.style.display='none'"><span>Thirdy's Admin</span></a>
      <button class="menu-toggle" id="menuToggle">☰</button>
      <nav id="nav">
        <a href="orders.html" data-page="orders" class="active">Orders</a>
        <div class="user-menu">
          <span class="user-name">${Guard.escapeHtml(user.name)} (Admin)</span>
          <button type="button" class="btn secondary btn-sm" id="btnLogout">Logout</button>
        </div>
      </nav>
    </header>
  `;
  
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

window.AdminNav = {
  renderAdminNavbar
};