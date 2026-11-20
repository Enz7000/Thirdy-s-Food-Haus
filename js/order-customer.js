/**
 * order-customer.js - Customer checkout logic
 * Handles cart display, pickup time slots, downpayment, and order submission
 */

function initCustomerCheckout() {
  const user = Store.getCurrentUser();
  if (!user) return;
  
  renderCartSummary();
  setupPickupScheduler();
  setupPaymentProofPreview();
  setupCheckoutForm();
  
  // Listen for cart changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'thirdys_cart') {
      renderCartSummary();
    }
  });
}

function renderCartSummary() {
  const cart = Store.getCart();
  const cartItems = document.getElementById('cartItems');
  const emptyCart = document.getElementById('emptyCart');
  const cartSummary = document.getElementById('cartSummary');
  const checkoutSection = document.getElementById('checkoutSection');
  
  if (!cartItems) return;
  
  if (cart.length === 0) {
    cartItems.innerHTML = '';
    if (emptyCart) emptyCart.hidden = false;
    if (cartSummary) cartSummary.hidden = true;
    if (checkoutSection) checkoutSection.hidden = true;
    return;
  }
  
  if (emptyCart) emptyCart.hidden = true;
  if (cartSummary) cartSummary.hidden = false;
  if (checkoutSection) checkoutSection.hidden = false;
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${Guard.escapeHtml(item.name)}</div>
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
    btn.addEventListener('click', () => {
      removeFromCart(parseInt(btn.dataset.id));
      renderCartSummary();
    });
  });
  document.querySelectorAll('.cart-item-qty button[data-delta]').forEach(btn => {
    btn.addEventListener('click', () => {
      updateCartQty(parseInt(btn.dataset.id), parseInt(btn.dataset.delta));
      renderCartSummary();
    });
  });
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const config = Store.getPickupConfigWithDefaults();
  const downpaymentPercent = config.downpaymentPercent || 50;
  const downpayment = Math.round(subtotal * downpaymentPercent / 100 * 100) / 100;
  const balance = Math.round((subtotal - downpayment) * 100) / 100;
  
  document.getElementById('cartSubtotal').textContent = Guard.formatCurrency(subtotal);
  document.getElementById('downpaymentDue').textContent = Guard.formatCurrency(downpayment);
  document.getElementById('balanceDue').textContent = Guard.formatCurrency(balance);
  document.getElementById('cartTotal').textContent = Guard.formatCurrency(subtotal);
  
  // Prefill customer details
  document.getElementById('checkoutName').value = user.name || '';
  document.getElementById('checkoutMobile').value = user.mobile || '';
  
  // Load payment accounts
  document.getElementById('gcashNumber').textContent = config.gcashNumber;
  document.getElementById('gcashName').textContent = config.gcashName;
  document.getElementById('mayaNumber').textContent = config.mayaNumber;
  document.getElementById('mayaName').textContent = config.mayaName;
  document.getElementById('policyText').textContent = config.policyText;
}

function setupPickupScheduler() {
  const dateInput = document.getElementById('pickupDate');
  const timeSelect = document.getElementById('pickupTime');
  
  if (!dateInput || !timeSelect) return;
  
  // Set min date to today
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  dateInput.min = todayStr;
  dateInput.value = todayStr;
  
  function populateTimeSlots() {
    const selectedDate = dateInput.value;
    const isToday = selectedDate === todayStr;
    
    timeSelect.innerHTML = '<option value="">Select Time</option>';
    timeSelect.disabled = false;
    
    let startHour = 10;
    let startMinute = 0;
    
    if (isToday) {
      const currentHour = today.getHours();
      const currentMinute = today.getMinutes();
      
      // Need at least 30 minutes lead time
      const leadTimeMinutes = 30;
      let targetMinutes = currentHour * 60 + currentMinute + leadTimeMinutes;
      startHour = Math.floor(targetMinutes / 60);
      startMinute = targetMinutes % 60;
      
      // Round up to next 30-minute slot
      if (startMinute > 0 && startMinute <= 30) startMinute = 30;
      else if (startMinute > 30) { startHour++; startMinute = 0; }
      
      if (startHour < 10) { startHour = 10; startMinute = 0; }
      if (startHour >= 20) {
        timeSelect.innerHTML = '<option value="">No slots available today</option>';
        timeSelect.disabled = true;
        return;
      }
    }
    
    for (let h = startHour; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 20 && m > 0) break;
        if (isToday && h === startHour && m < startMinute) continue;
        
        const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
        const availability = Store.getSlotAvailability(selectedDate, timeStr);
        
        const opt = document.createElement('option');
        opt.value = timeStr;
        if (availability.isFull) {
          opt.textContent = `${timeStr} - Full`;
          opt.disabled = true;
        } else {
          opt.textContent = `${timeStr} (${availability.available} slots left)`;
        }
        timeSelect.appendChild(opt);
      }
    }
  }
  
  dateInput.addEventListener('change', populateTimeSlots);
  populateTimeSlots();
}

function setupPaymentProofPreview() {
  const input = document.getElementById('paymentProof');
  const preview = document.getElementById('paymentProofPreview');
  const error = document.getElementById('errPaymentProof');
  
  if (!input) return;
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    error.textContent = '';
    preview.hidden = true;
    preview.innerHTML = '';
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.textContent = 'Please select an image file';
      input.value = '';
      return;
    }
    
    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      error.textContent = 'File size must be less than 1MB';
      input.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target.result;
      img.alt = 'Payment proof preview';
      preview.appendChild(img);
      preview.hidden = false;
    };
    reader.readAsDataURL(file);
  });
}

function setupCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!validateCheckoutForm()) return;
    
    await submitOrder();
  });
}

function validateCheckoutForm() {
  let ok = true;
  
  const date = document.getElementById('pickupDate').value;
  const time = document.getElementById('pickupTime').value;
  const paymentRef = document.getElementById('paymentRef').value.trim();
  
  document.getElementById('errPickupDate').textContent = date ? '' : 'Required';
  document.getElementById('errPickupTime').textContent = time ? '' : 'Required';
  document.getElementById('errPaymentRef').textContent = paymentRef ? '' : 'Payment reference number is required';
  
  if (!date || !time || !paymentRef) ok = false;
  
  // Check if slot is still available
  if (date && time && Store.isSlotFull(date, time)) {
    document.getElementById('errPickupTime').textContent = 'This slot is now full. Please select another time.';
    ok = false;
  }
  
  return ok;
}

async function submitOrder() {
  const user = Store.getCurrentUser();
  const cart = Store.getCart();
  
  if (cart.length === 0) {
    Guard.showToast('Your cart is empty!', 'error');
    return;
  }
  
  const date = document.getElementById('pickupDate').value;
  const time = document.getElementById('pickupTime').value;
  const paymentRef = document.getElementById('paymentRef').value.trim();
  const instructions = document.getElementById('checkoutInstr').value.trim();
  const paymentProofFile = document.getElementById('paymentProof').files[0];
  
  // Convert payment proof to base64 if provided
  let paymentProof = null;
  if (paymentProofFile) {
    paymentProof = await fileToBase64(paymentProofFile);
  }
  
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const config = Store.getPickupConfigWithDefaults();
  const downpaymentPercent = config.downpaymentPercent || 50;
  const downpayment = Math.round(subtotal * downpaymentPercent / 100 * 100) / 100;
  const balance = Math.round((subtotal - downpayment) * 100) / 100;
  
  const orderData = {
    userId: user.id,
    customerName: user.name,
    mobile: user.mobile,
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      qty: item.qty
    })),
    total: subtotal,
    downpayment,
    balance,
    paymentMethod: 'Cash on Pickup',
    paymentRef,
    paymentProof,
    pickupDate: date,
    pickupTime: time,
    instructions
  };
  
  const order = Store.createOrder(orderData);
  
  // Clear cart
  Store.clearCart();
  CustomerNav.updateCartBadge();
  renderCartSummary();
  
  // Show confirmation
  showOrderConfirmation(order);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function showOrderConfirmation(order) {
  const cartSection = document.querySelector('.cart-checkout-layout');
  const confirmation = document.getElementById('orderConfirmation');
  
  if (cartSection) cartSection.hidden = true;
  if (confirmation) confirmation.hidden = false;
  
  document.getElementById('confirmOrderId').textContent = order.id;
  document.getElementById('confirmPickupCode').textContent = order.pickupCode;
  document.getElementById('confirmPickupDateTime').textContent = Store.formatDateTime(order.pickupDate, order.pickupTime);
  document.getElementById('confirmTotal').textContent = Guard.formatCurrency(order.total);
  document.getElementById('confirmDownpayment').textContent = Guard.formatCurrency(order.downpayment);
  document.getElementById('confirmBalance').textContent = Guard.formatCurrency(order.balance);
}

window.CustomerCheckout = {
  initCustomerCheckout,
  renderCartSummary
};