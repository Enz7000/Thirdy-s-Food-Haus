/**
 * auth.js - Authentication logic for Thirdy's Food Haus
 * 
 * SECURITY NOTE: This is a front-end-only demo. The authentication guard 
 * (js/guard.js) and password hashing are NOT real security since localStorage
 * can be edited by the user. In production, this must be replaced with
 * a proper backend with server-side authentication and authorization.
 */

const ADMIN_EMAIL = 'Admin@gmail.com';
const ADMIN_PASSWORD = 'AdminPass';

/**
 * Hash password using Web Crypto API (SHA-256)
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

/**
 * Seed admin account if not exists
 */
async function seedAdminAccount() {
  const users = Store.getUsers();
  const adminExists = users.some(u => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
  
  if (!adminExists) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    Store.createUser({
      name: 'Administrator',
      mobile: '09000000000',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin'
    });
    console.log('Admin account seeded');
  }
}

/**
 * Customer Sign Up
 */
async function signUpCustomer({ name, mobile, email, password, confirmPassword }) {
  // Validation
  const errors = {};
  
  if (!name.trim()) errors.name = 'Full name is required';
  if (!mobile.trim()) errors.mobile = 'Mobile number is required';
  else if (!/^09\d{9}$/.test(mobile)) errors.mobile = 'Enter valid PH mobile (09XXXXXXXXX)';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
  if (!password) errors.password = 'Password is required';
  else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  // Check duplicate email
  if (Store.findUserByEmail(email)) {
    return { success: false, errors: { email: 'Email already registered' } };
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = Store.createUser({
    name: name.trim(),
    mobile: mobile.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'customer'
  });
  
  // Auto-login after signup
  const session = {
    userId: user.id,
    role: 'customer',
    name: user.name,
    email: user.email
  };
  Store.setSession(session);
  
  return { success: true, user };
}

/**
 * Customer Login
 */
async function loginCustomer(email, password) {
  const errors = {};
  
  if (!email.trim()) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  const user = Store.findUserByEmail(email.trim().toLowerCase());
  
  if (!user || user.role !== 'customer') {
    return { success: false, errors: { email: 'Invalid email or password' } };
  }
  
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { success: false, errors: { password: 'Invalid email or password' } };
  }
  
  const session = {
    userId: user.id,
    role: 'customer',
    name: user.name,
    email: user.email
  };
  Store.setSession(session);
  
  return { success: true, user };
}

/**
 * Admin Login
 */
async function loginAdmin(email, password) {
  const errors = {};
  
  if (!email.trim()) errors.email = 'Email is required';
  if (!password) errors.password = 'Password is required';
  
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }
  
  // Check against hardcoded admin credentials
  if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
    return { success: false, errors: { email: 'Invalid admin credentials' } };
  }
  
  // Find or create admin user in localStorage
  let user = Store.findUserByEmail(ADMIN_EMAIL);
  if (!user) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    user = Store.createUser({
      name: 'Administrator',
      mobile: '09000000000',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin'
    });
  }
  
  const session = {
    userId: user.id,
    role: 'admin',
    name: user.name,
    email: user.email
  };
  Store.setSession(session);
  
  return { success: true, user };
}

/**
 * Logout
 */
function logout() {
  Store.clearSession();
  window.location.href = '../auth.html';
}

/**
 * Check if user is logged in as customer
 */
function isCustomerLoggedIn() {
  const session = Store.getSession();
  return session && session.role === 'customer';
}

/**
 * Check if user is logged in as admin
 */
function isAdminLoggedIn() {
  const session = Store.getSession();
  return session && session.role === 'admin';
}

/**
 * Get current user info
 */
function getCurrentUser() {
  return Store.getCurrentUser();
}

window.Auth = {
  signUpCustomer,
  loginCustomer,
  loginAdmin,
  logout,
  isCustomerLoggedIn,
  isAdminLoggedIn,
  getCurrentUser,
  seedAdminAccount,
  ADMIN_EMAIL,
  ADMIN_PASSWORD
};