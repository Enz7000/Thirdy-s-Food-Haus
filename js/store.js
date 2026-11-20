/**
 * store.js - Central localStorage interface for Thirdy's Food Haus
 * All reads/writes to localStorage go through this module.
 * This makes it easy to swap for a real backend later.
 */

const STORE_KEYS = {
  USERS: 'thirdys_users',
  SESSION: 'thirdys_session',
  CART: 'thirdys_cart',
  ORDERS: 'thirdys_orders',
  PICKUP_CONFIG: 'thirdys_pickup_config'
};

/**
 * Generate a unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Generate a 4-character pickup code
 */
function generatePickupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ===== USERS =====
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEYS.USERS) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(STORE_KEYS.USERS, JSON.stringify(users));
}

function findUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id);
}

function createUser(userData) {
  const users = getUsers();
  const newUser = {
    id: generateId(),
    ...userData,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

function updateUser(userId, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
    return users[idx];
  }
  return null;
}

// ===== SESSION =====
function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEYS.SESSION) || 'null');
  } catch {
    return null;
  }
}

function setSession(session) {
  localStorage.setItem(STORE_KEYS.SESSION, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORE_KEYS.SESSION);
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return findUserById(session.userId);
}

// ===== CART =====
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEYS.CART) || '[]');
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORE_KEYS.CART, JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem(STORE_KEYS.CART);
}

// ===== ORDERS =====
function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEYS.ORDERS) || '[]');
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(STORE_KEYS.ORDERS, JSON.stringify(orders));
}

function getOrderById(id) {
  const orders = getOrders();
  return orders.find(o => o.id === id);
}

function getOrdersByUserId(userId) {
  const orders = getOrders();
  return orders.filter(o => o.userId === userId);
}

function createOrder(orderData) {
  const orders = getOrders();
  const newOrder = {
    id: generateId(),
    pickupCode: generatePickupCode(),
    ...orderData,
    status: 'Awaiting Downpayment Verification',
    createdAt: new Date().toISOString(),
    history: [{ status: 'Awaiting Downpayment Verification', at: new Date().toISOString() }]
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

function updateOrderStatus(orderId, newStatus) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].status = newStatus;
    orders[idx].history.push({ status: newStatus, at: new Date().toISOString() });
    saveOrders(orders);
    return orders[idx];
  }
  return null;
}

function updateOrder(orderId, updates) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx] = { ...orders[idx], ...updates };
    saveOrders(orders);
    return orders[idx];
  }
  return null;
}

// ===== PICKUP CONFIG =====
function getPickupConfig() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEYS.PICKUP_CONFIG) || '{}');
  } catch {
    return {};
  }
}

function getPickupConfigWithDefaults() {
  const config = getPickupConfig();
  return {
    address: config.address || '[Pickup address - editable in admin]',
    hours: config.hours || '[Pickup hours - editable in admin]',
    gcashNumber: config.gcashNumber || '[GCash number - editable in admin]',
    gcashName: config.gcashName || '[GCash account name - editable in admin]',
    mayaNumber: config.mayaNumber || '[Maya number - editable in admin]',
    mayaName: config.mayaName || '[Maya account name - editable in admin]',
    slotCapacity: config.slotCapacity || 5,
    downpaymentPercent: config.downpaymentPercent || 50,
    policyText: config.policyText || 'Orders without a verified downpayment will not be prepared. Downpayment is non-refundable for no-shows.'
  };
}

function savePickupConfig(config) {
  localStorage.setItem(STORE_KEYS.PICKUP_CONFIG, JSON.stringify(config));
}

// ===== SLOT HELPERS =====
function getOrdersForSlot(date, time) {
  const orders = getOrders();
  return orders.filter(o => 
    o.pickupDate === date && 
    o.pickupTime === time && 
    o.status !== 'Cancelled'
  );
}

function isSlotFull(date, time) {
  const config = getPickupConfigWithDefaults();
  const ordersInSlot = getOrdersForSlot(date, time);
  return ordersInSlot.length >= config.slotCapacity;
}

function getSlotAvailability(date, time) {
  const config = getPickupConfigWithDefaults();
  const ordersInSlot = getOrdersForSlot(date, time);
  return {
    used: ordersInSlot.length,
    capacity: config.slotCapacity,
    available: config.slotCapacity - ordersInSlot.length,
    isFull: ordersInSlot.length >= config.slotCapacity
  };
}

// ===== UTILITY =====
function formatCurrency(amount) {
  return '₱' + Number(amount).toFixed(2);
}

function formatDateTime(dateStr, timeStr) {
  const date = new Date(dateStr + 'T' + timeStr);
  return date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + timeStr;
}

// Export for use in other scripts
window.Store = {
  // Users
  getUsers,
  saveUsers,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  // Session
  getSession,
  setSession,
  clearSession,
  getCurrentUser,
  // Cart
  getCart,
  saveCart,
  clearCart,
  // Orders
  getOrders,
  saveOrders,
  getOrderById,
  getOrdersByUserId,
  createOrder,
  updateOrderStatus,
  updateOrder,
  // Pickup Config
  getPickupConfig,
  getPickupConfigWithDefaults,
  savePickupConfig,
  // Slots
  getOrdersForSlot,
  isSlotFull,
  getSlotAvailability,
  // Utils
  formatCurrency,
  formatDateTime,
  generateId,
  generatePickupCode
};