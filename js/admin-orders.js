/**
 * admin-orders.js - Admin order queue management
 * Handles displaying, filtering, and updating orders
 */

let currentFilter = 'active';
let ordersCache = [];

function initAdminOrders() {
  setupFilterTabs();
  renderOrders();
  setupAutoRefresh();
}

function setupFilterTabs() {
  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.dataset.filter;
      renderOrders();
    });
  });
}

function renderOrders() {
  const orders = Store.getOrders();
  ordersCache = orders;
  
  // Update summary counts
  updateSummaryCounts(orders);
  
  // Filter orders
  let filtered = filterOrders(orders);
  
  // Sort: active orders by createdAt ASC (first come, first served)
  // Completed/cancelled at the bottom
  filtered.sort((a, b) => {
    const activeStatuses = ['Awaiting Downpayment Verification', 'Confirmed', 'Preparing', 'Ready for Pickup'];
    const aActive = activeStatuses.includes(a.status);
    const bActive = activeStatuses.includes(b.status);
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (aActive && bActive) return new Date(a.createdAt) - new Date(b.createdAt);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  const queue = document.getElementById('ordersQueue');
  const empty = document.getElementById('emptyOrders');
  
  if (filtered.length === 0) {
    queue.innerHTML = '';
    empty.hidden = false;
    return;
  }
  
  empty.hidden = true;
  
  queue.innerHTML = filtered.map((order, index) => {
    const isActive = ['Awaiting Downpayment Verification', 'Confirmed', 'Preparing', 'Ready for Pickup'].includes(order.status);
    const queueNumber = isActive ? index + 1 : null;
    
    return `
      <article class="admin-order-card ${order.status.toLowerCase().replace(' ', '-')}" data-order-id="${order.id}">
        <header class="admin-order-header">
          ${queueNumber ? `<span class="queue-number">#${queueNumber}</span>` : ''}
          <div class="admin-order-id">
            <strong>Order ID:</strong> ${Guard.escapeHtml(order.id)}
            <span class="pickup-code">Pickup Code: ${Guard.escapeHtml(order.pickupCode)}</span>
          </div>
          <div class="admin-order-status">
            <span class="order-status status-${order.status.toLowerCase().replace(' ', '-')}">${Guard.escapeHtml(order.status)}</span>
            <select class="status-select" data-order-id="${order.id}" ${!isActive ? 'disabled' : ''}>
              <option value="Awaiting Downpayment Verification" ${order.status === 'Awaiting Downpayment Verification' ? 'selected' : ''}>Awaiting Verification</option>
              <option value="Confirmed" ${order.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Preparing" ${order.status === 'Preparing' ? 'selected' : ''}>Preparing</option>
              <option value="Ready for Pickup" ${order.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
              <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancel Order</option>
            </select>
          </div>
        </header>
        
        <div class="admin-order-body">
          <div class="admin-order-customer">
            <div><strong>Customer:</strong> ${Guard.escapeHtml(order.customerName)}</div>
            <div><strong>Mobile:</strong> ${Guard.escapeHtml(order.mobile)}</div>
            <div><strong>Pickup:</strong> ${Guard.formatDateTime(order.pickupDate, order.pickupTime)}</div>
            <div><strong>Ordered:</strong> ${new Date(order.createdAt).toLocaleString()}</div>
          </div>
          
          <div class="admin-order-items">
            ${order.items.map(item => `
              <div class="admin-order-item">
                <span>${Guard.escapeHtml(item.name)} × ${item.qty}</span>
                <span>${Guard.formatCurrency(item.price * item.qty)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="admin-order-totals">
            <div><span>Subtotal</span><span>${Guard.formatCurrency(order.total)}</span></div>
            <div><span>Downpayment</span><span class="highlight">${Guard.formatCurrency(order.downpayment)}</span></div>
            <div><span>Balance Due</span><span class="highlight">${Guard.formatCurrency(order.balance)}</span></div>
            ${order.paymentRef ? `<div><span>Payment Ref</span><span>${Guard.escapeHtml(order.paymentRef)}</span></div>` : ''}
          </div>
          
          ${order.paymentProof ? `
            <div class="payment-proof">
              <strong>Payment Proof:</strong>
              <img src="${order.paymentProof}" alt="Payment receipt" onclick="openPaymentProof('${order.paymentProof}')">
            </div>
          ` : ''}
          
          ${order.instructions ? `
            <div class="instructions" style="margin-top: 1rem; padding: 1rem; background: #fafafa; border-radius: var(--radius);">
              <strong>Special Instructions:</strong> ${Guard.escapeHtml(order.instructions)}
            </div>
          ` : ''}
          
          <div class="admin-order-actions">
            ${order.status === 'Awaiting Downpayment Verification' ? `
              <button class="btn primary" onclick="verifyDownpayment('${order.id}')">Verify Downpayment</button>
            ` : ''}
            ${order.status !== 'Completed' && order.status !== 'Cancelled' ? `
              <button class="btn secondary" onclick="cancelOrder('${order.id}')">Cancel Order</button>
            ` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  // Add event listeners for status selects
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const orderId = e.target.dataset.orderId;
      const newStatus = e.target.value;
      handleStatusChange(orderId, newStatus);
    });
  });
}

function filterOrders(orders) {
  switch (currentFilter) {
    case 'active':
      return orders.filter(o => ['Awaiting Downpayment Verification', 'Confirmed', 'Preparing', 'Ready for Pickup'].includes(o.status));
    case 'awaiting':
      return orders.filter(o => o.status === 'Awaiting Downpayment Verification');
    case 'confirmed':
      return orders.filter(o => o.status === 'Confirmed');
    case 'preparing':
      return orders.filter(o => o.status === 'Preparing');
    case 'ready':
      return orders.filter(o => o.status === 'Ready for Pickup');
    case 'completed':
      return orders.filter(o => o.status === 'Completed');
    case 'cancelled':
      return orders.filter(o => o.status === 'Cancelled');
    default:
      return orders;
  }
}

function updateSummaryCounts(orders) {
  document.getElementById('countActive').textContent = orders.filter(o => ['Awaiting Downpayment Verification', 'Confirmed', 'Preparing', 'Ready for Pickup'].includes(o.status)).length;
  document.getElementById('countAwaiting').textContent = orders.filter(o => o.status === 'Awaiting Downpayment Verification').length;
  document.getElementById('countReady').textContent = orders.filter(o => o.status === 'Ready for Pickup').length;
}

function handleStatusChange(orderId, newStatus) {
  if (newStatus === 'Cancelled') {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      Store.updateOrderStatus(orderId, 'Cancelled');
      Guard.showToast('Order cancelled');
      renderOrders();
    } else {
      // Revert select
      renderOrders();
    }
    return;
  }
  
  Store.updateOrderStatus(orderId, newStatus);
  Guard.showToast(`Order status updated to ${newStatus}`);
  renderOrders();
}

function verifyDownpayment(orderId) {
  if (confirm('Verify downpayment for this order? This will change status to Confirmed.')) {
    Store.updateOrderStatus(orderId, 'Confirmed');
    Guard.showToast('Downpayment verified. Order confirmed.');
    renderOrders();
  }
}

function cancelOrder(orderId) {
  if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
    Store.updateOrderStatus(orderId, 'Cancelled');
    Guard.showToast('Order cancelled');
    renderOrders();
  }
}

function openPaymentProof(src) {
  const modal = document.createElement('div');
  modal.className = 'payment-proof-modal';
  modal.innerHTML = `<img src="${src}" alt="Payment proof">`;
  modal.onclick = () => modal.remove();
  document.body.appendChild(modal);
}

function setupAutoRefresh() {
  window.addEventListener('storage', (e) => {
    if (e.key === 'thirdys_orders') {
      renderOrders();
    }
  });
  
  setInterval(renderOrders, 5000);
}

window.AdminOrders = {
  initAdminOrders,
  renderOrders,
  handleStatusChange,
  verifyDownpayment,
  cancelOrder,
  openPaymentProof
};