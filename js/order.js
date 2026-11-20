function populateTimeSlots() {
  const timeSelect = document.getElementById('time');
  const dateInput = document.getElementById('date');
  if (!timeSelect || !dateInput) return;

  const today = new Date();
  const selectedDate = new Date(dateInput.value);
  const isToday = selectedDate.toDateString() === today.toDateString();

  timeSelect.innerHTML = '<option value="">Select Time</option>';

  const now = new Date();
  let startHour = 10;
  let startMinute = 0;

  if (isToday) {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour >= 20) {
      timeSelect.innerHTML = '<option value="">No slots available today</option>';
      return;
    }
    startHour = currentHour + 1;
    startMinute = 0;
    if (startHour < 10) startHour = 10;
  }

  for (let h = startHour; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 0) break;
      if (isToday && h === startHour && m < startMinute) continue;
      const display = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      const opt = document.createElement('option');
      opt.value = display;
      opt.textContent = display;
      timeSelect.appendChild(opt);
    }
  }
}

function validateForm() {
  const name = document.getElementById('name').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  let ok = true;

  document.getElementById('errName').textContent = name ? '' : 'Required';
  document.getElementById('errMobile').textContent = /^09\d{9}$/.test(mobile) ? '' : 'Enter valid PH mobile (09XXXXXXXXX)';
  document.getElementById('errDate').textContent = date ? '' : 'Required';
  document.getElementById('errTime').textContent = time ? '' : 'Required';

  if (!name || !/^09\d{9}$/.test(mobile) || !date || !time) ok = false;
  return ok;
}

function generateOrderId() {
  return 'ORD-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function submitOrder(e) {
  e.preventDefault();
  if (!validateForm()) return;

  const cart = JSON.parse(localStorage.getItem('thirdys_cart') || '[]');
  if (cart.length === 0) {
    showToast('Your cart is empty!');
    return;
  }

  const name = document.getElementById('name').value.trim();
  const mobile = document.getElementById('mobile').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const instr = document.getElementById('instr').value.trim();

  const orderId = generateOrderId();
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const order = {
    id: orderId,
    name, mobile, date, time, instr,
    items: cart,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  const orders = JSON.parse(localStorage.getItem('thirdys_orders') || '[]');
  orders.push(order);
  localStorage.setItem('thirdys_orders', JSON.stringify(orders));

  localStorage.removeItem('thirdys_cart');

  document.getElementById('orderForm').reset();
  document.getElementById('confirm').innerHTML = `
    <div class="success">
      <h4>Order Confirmed!</h4>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <p><strong>Pickup:</strong> ${date} at ${time}</p>
      <p><strong>Total:</strong> ₱${total.toFixed(2)}</p>
      <p>Please bring your Order ID when picking up.</p>
    </div>
  `;

  updateCartCount();
  renderCart();
  populateTimeSlots();
}

function setMinDate() {
  const dateInput = document.getElementById('date');
  if (!dateInput) return;
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;
  dateInput.value = today;
}

document.addEventListener('DOMContentLoaded', () => {
  setMinDate();
  populateTimeSlots();

  const dateInput = document.getElementById('date');
  if (dateInput) dateInput.addEventListener('change', populateTimeSlots);

  const form = document.getElementById('orderForm');
  if (form) form.addEventListener('submit', submitOrder);
});