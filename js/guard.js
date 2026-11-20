/**
 * guard.js - Route guards for customer and admin pages
 * Include this script at the top of protected pages.
 */

function requireCustomerAuth() {
  const session = Store.getSession();
  
  if (!session) {
    window.location.href = '../auth.html';
    return false;
  }
  
  if (session.role !== 'customer') {
    // Admin trying to access customer page - redirect to admin
    window.location.href = '../admin/orders.html';
    return false;
  }
  
  return true;
}

function requireAdminAuth() {
  const session = Store.getSession();
  
  if (!session) {
    window.location.href = '../auth.html';
    return false;
  }
  
  if (session.role !== 'admin') {
    // Customer trying to access admin page - redirect to customer
    window.location.href = '../customer/menu.html';
    return false;
  }
  
  return true;
}

function redirectIfLoggedIn() {
  const session = Store.getSession();
  
  if (session) {
    if (session.role === 'customer') {
      window.location.href = 'customer/menu.html';
    } else if (session.role === 'admin') {
      window.location.href = 'admin/orders.html';
    }
    return true;
  }
  
  return false;
}

function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
  document.querySelectorAll('#nav a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  const bgColor = type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : 'var(--primary)';
  toast.style.cssText = `position:fixed;bottom:2rem;right:2rem;background:${bgColor};color:#fff;padding:1rem 1.5rem;border-radius:var(--radius);box-shadow:var(--shadow-hover);z-index:1000;animation:slideIn 0.3s ease`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(amount) {
  return '₱' + Number(amount).toFixed(2);
}

window.Guard = {
  requireCustomerAuth,
  requireAdminAuth,
  redirectIfLoggedIn,
  initMobileMenu,
  showToast,
  escapeHtml,
  formatCurrency
};