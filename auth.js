// 🔥 Firebase Configuration and Authentication System
// Replace this config with your actual Firebase project config

const firebaseConfig = {
  apiKey: "AIzaSyAqgqsvpK31JZkmwNrVUNuqKY2Ym3TGruQ",
  authDomain: "store-management-system-a45d1.firebaseapp.com",
  projectId: "store-management-system-a45d1",
  storageBucket: "store-management-system-a45d1.firebasestorage.app",
  messagingSenderId: "734056757590",
  appId: "1:734056757590:web:2a0ccd406395b6c3237ef7"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let isUserDataLoaded = false;

// ============================================
// 🚀 AUTHENTICATION FUNCTIONS
// ============================================

// Initialize authentication state listener
function initAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      showMainApp();
      loadUserData();
      updateUserInterface();
    } else {
      currentUser = null;
      showAuthInterface();
      clearUserData();
    }
  });
}

// Register new user
async function registerUser(email, password, displayName) {
  try {
    showLoading('Creating account...');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update user profile
    await updateProfile(user, {
      displayName: displayName
    });
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: email,
      displayName: displayName,
      createdAt: new Date(),
      products: [],
      sales: [],
      restockHistory: [],
      priceHistory: []
    });
    
    hideLoading();
    showMessage('Account created successfully!', 'success');
    
  } catch (error) {
    hideLoading();
    showMessage(getErrorMessage(error), 'error');
  }
}

// Sign in existing user
async function signInUser(email, password) {
  try {
    showLoading('Signing in...');
    
    await signInWithEmailAndPassword(auth, email, password);
    
    hideLoading();
    showMessage('Welcome back!', 'success');
    
  } catch (error) {
    hideLoading();
    showMessage(getErrorMessage(error), 'error');
  }
}

// Sign out user
async function signOutUser() {
  try {
    await signOut(auth);
    showMessage('Signed out successfully', 'success');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  }
}

// Reset password
async function resetPassword(email) {
  try {
    showLoading('Sending reset email...');
    
    await sendPasswordResetEmail(auth, email);
    
    hideLoading();
    showMessage('Password reset email sent! Check your inbox.', 'success');
    
  } catch (error) {
    hideLoading();
    showMessage(getErrorMessage(error), 'error');
  }
}

// ============================================
// 💾 DATA MANAGEMENT FUNCTIONS
// ============================================

// Load user data from Firestore
async function loadUserData() {
  if (!currentUser || isUserDataLoaded) return;
  
  try {
    showLoading('Loading your data...');
    
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // Load data into localStorage for compatibility with existing code
      localStorage.setItem('products', JSON.stringify(userData.products || []));
      localStorage.setItem('sales', JSON.stringify(userData.sales || []));
      localStorage.setItem('restockHistory', JSON.stringify(userData.restockHistory || []));
      localStorage.setItem('priceHistory', JSON.stringify(userData.priceHistory || []));
      localStorage.setItem('settings', JSON.stringify(userData.settings || {
        lowStockThreshold: 5,
        reorderSuggestions: true,
        businessName: 'My Mini Store',
        taxRate: 0
      }));
      
      console.log('✅ Data loaded from Firebase:', {
        products: userData.products?.length || 0,
        sales: userData.sales?.length || 0,
        restockHistory: userData.restockHistory?.length || 0,
        priceHistory: userData.priceHistory?.length || 0
      });
      
      isUserDataLoaded = true;
      
      // Refresh all tabs for first-time user
        if (typeof refreshProducts === 'function') refreshProducts();
        if (typeof refreshSales === 'function') refreshSales();
        if (typeof refreshSummary === 'function') refreshSummary();
        if (typeof refreshInventory === 'function') refreshInventory();
        if (typeof refreshRestockingTab === 'function') refreshRestockingTab();
      
      showMessage('Data loaded successfully!', 'success');
    } else {
      // First time user - create initial document
      console.log('📝 Creating initial user document');
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          email: currentUser.email,
          displayName: currentUser.displayName,
          createdAt: new Date(),
          products: [],
          sales: [],
          restockHistory: [],
          priceHistory: [],
          settings: {
            lowStockThreshold: 5,
            reorderSuggestions: true,
            businessName: 'My Mini Store',
            taxRate: 0
          },
          lastUpdated: new Date()
        });
        
        // Set default data in localStorage
        localStorage.setItem('products', '[]');
        localStorage.setItem('sales', '[]');
        localStorage.setItem('restockHistory', '[]');
        localStorage.setItem('priceHistory', '[]');
        localStorage.setItem('settings', JSON.stringify({
          lowStockThreshold: 5,
          reorderSuggestions: true,
          businessName: 'My Mini Store',
          taxRate: 0
        }));
        
        isUserDataLoaded = true;
        
        // Refresh all tabs for first-time user
        if (typeof refreshProducts === 'function') refreshProducts();
        if (typeof refreshSales === 'function') refreshSales();
        if (typeof refreshSummary === 'function') refreshSummary();
        if (typeof refreshInventory === 'function') refreshInventory();
        if (typeof refreshRestockingTab === 'function') refreshRestockingTab();
        
        showMessage('Welcome! Your account is ready to use.', 'success');
      } catch (createError) {
        console.error('❌ Error creating user document:', createError);
        showMessage('Error creating your account data. Please check Firestore permissions.', 'error');
        
        // Fallback: use localStorage only
        isUserDataLoaded = true;
        
        // Refresh all tabs in fallback mode
        if (typeof refreshProducts === 'function') refreshProducts();
        if (typeof refreshSales === 'function') refreshSales();
        if (typeof refreshSummary === 'function') refreshSummary();
        if (typeof refreshInventory === 'function') refreshInventory();
        if (typeof refreshRestockingTab === 'function') refreshRestockingTab();
        
        showMessage('Working in offline mode. Data will not sync.', 'info');
      }
    }
    
    hideLoading();
    
  } catch (error) {
    hideLoading();
    console.error('❌ Error loading data:', error);
    
    if (error.code === 'permission-denied') {
      showMessage('Permission denied. Please check Firestore security rules.', 'error');
    } else if (error.code === 'unavailable') {
      showMessage('Firebase is unavailable. Working in offline mode.', 'info');
    } else {
      showMessage('Error loading data from cloud: ' + error.message, 'error');
    }
    
    // Fallback: mark as loaded to continue with localStorage
    isUserDataLoaded = true;
    
    // Refresh all tabs in fallback mode
    if (typeof refreshProducts === 'function') refreshProducts();
    if (typeof refreshSales === 'function') refreshSales();
    if (typeof refreshSummary === 'function') refreshSummary();
    if (typeof refreshInventory === 'function') refreshInventory();
    if (typeof refreshRestockingTab === 'function') refreshRestockingTab();
  }
}

// Save user data to Firestore
async function saveUserData() {
  if (!currentUser) return;
  
  try {
    const products = JSON.parse(localStorage.getItem('products') || '[]');
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const restockHistory = JSON.parse(localStorage.getItem('restockHistory') || '[]');
    const priceHistory = JSON.parse(localStorage.getItem('priceHistory') || '[]');
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    
    await updateDoc(doc(db, 'users', currentUser.uid), {
      products: products,
      sales: sales,
      restockHistory: restockHistory,
      priceHistory: priceHistory,
      settings: settings,
      lastUpdated: new Date()
    });
    
    console.log('✅ Data saved to Firebase successfully');
    
  } catch (error) {
    console.error('❌ Error saving data to Firebase:', error);
    
    if (error.code === 'permission-denied') {
      showMessage('Permission denied. Please check Firestore security rules.', 'error');
    } else if (error.code === 'unavailable') {
      showMessage('Firebase is unavailable. Data saved locally only.', 'info');
    } else {
      showMessage('Error saving data to cloud: ' + error.message, 'error');
    }
  }
}

// Force save data immediately (for manual calls)
async function forceSaveUserData() {
  if (!currentUser) {
    showMessage('Please log in to save data', 'error');
    return;
  }
  
  showLoading('Saving to cloud...');
  await saveUserData();
  hideLoading();
  showMessage('Data saved to cloud successfully!', 'success');
}

// Clear user data from localStorage
function clearUserData() {
  localStorage.clear();
  isUserDataLoaded = false;
}

// Auto-save data whenever localStorage changes
function setupAutoSave() {
  // Override localStorage methods to trigger auto-save
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    // Immediately save to Firebase for important data
    if (currentUser && ['products', 'sales', 'restockHistory', 'priceHistory'].includes(key)) {
      // Debounced save to avoid too many calls
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(saveUserData, 500); // Reduced delay
    }
  };
}

// ============================================
// 🎨 UI MANAGEMENT FUNCTIONS
// ============================================

// Show main application
function showMainApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('main-app').style.display = 'block';
}

// Show authentication interface
function showAuthInterface() {
  document.getElementById('auth-container').style.display = 'flex';
  document.getElementById('main-app').style.display = 'none';
}

// Update user interface with user info
function updateUserInterface() {
  if (currentUser) {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
      userInfoElement.innerHTML = `
        <div class="user-welcome">
          <div class="user-details">
            <span>Welcome, ${currentUser.displayName || currentUser.email}!</span>
            <small>Data syncs automatically to the cloud</small>
          </div>
          <div class="user-actions">
            <button onclick="forceSaveUserData()" class="save-btn" title="Manually save to cloud">💾 Save to Cloud</button>
            <button onclick="signOutUser()" class="sign-out-btn">Sign Out</button>
          </div>
        </div>
      `;
    }
  }
}

// Show loading spinner
function showLoading(message = 'Loading...') {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>${message}</p>
      </div>
    `;
    loadingElement.style.display = 'flex';
  }
}

// Hide loading spinner
function hideLoading() {
  const loadingElement = document.getElementById('loading');
  if (loadingElement) {
    loadingElement.style.display = 'none';
  }
}

// Show message (success/error)
function showMessage(message, type = 'info') {
  const messageContainer = document.getElementById('message-container') || createMessageContainer();
  
  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()">×</button>
  `;
  
  messageContainer.appendChild(messageElement);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (messageElement.parentNode) {
      messageElement.remove();
    }
  }, 5000);
}

// Create message container if it doesn't exist
function createMessageContainer() {
  const container = document.createElement('div');
  container.id = 'message-container';
  container.className = 'message-container';
  document.body.appendChild(container);
  return container;
}

// Get user-friendly error messages
function getErrorMessage(error) {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in instead.',
    'auth/weak-password': 'Password should be at least 6 characters long.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with this email. Please register first.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/invalid-credential': 'Invalid email or password. Please try again.'
  };
  
  return errorMessages[error.code] || error.message;
}

// ============================================
// 📱 FORM HANDLERS
// ============================================

// Handle registration form
function handleRegister(event) {
  event.preventDefault();
  
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  const displayName = document.getElementById('register-name').value;
  
  // Validation
  if (!email || !password || !confirmPassword || !displayName) {
    showMessage('Please fill in all fields', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showMessage('Passwords do not match', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error');
    return;
  }
  
  registerUser(email, password, displayName);
}

// Handle login form
function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showMessage('Please enter both email and password', 'error');
    return;
  }
  
  signInUser(email, password);
}

// Handle password reset form
function handlePasswordReset(event) {
  event.preventDefault();
  
  const email = document.getElementById('reset-email').value;
  
  if (!email) {
    showMessage('Please enter your email address', 'error');
    return;
  }
  
  resetPassword(email);
}

// Toggle between login and register forms
function toggleAuthForm(formType) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const resetForm = document.getElementById('reset-form');
  
  // Hide all forms
  loginForm.style.display = 'none';
  registerForm.style.display = 'none';
  resetForm.style.display = 'none';
  
  // Show requested form
  if (formType === 'register') {
    registerForm.style.display = 'block';
  } else if (formType === 'reset') {
    resetForm.style.display = 'block';
  } else {
    loginForm.style.display = 'block';
  }
}

// Switch between auth tabs (new functionality)
function switchAuthTab(tabType) {
  // Update tab buttons
  const tabButtons = document.querySelectorAll('.auth-tab-btn');
  tabButtons.forEach(btn => btn.classList.remove('active'));
  
  // Update forms
  const forms = document.querySelectorAll('.auth-form');
  forms.forEach(form => {
    form.classList.remove('active');
    form.style.display = 'none';
  });
  
  // Show selected tab and form
  if (tabType === 'login') {
    document.querySelector('.auth-tab-btn[onclick*="login"]').classList.add('active');
    const loginForm = document.getElementById('login-form');
    loginForm.style.display = 'block';
    loginForm.classList.add('active');
  } else if (tabType === 'pricing') {
    document.querySelector('.auth-tab-btn[onclick*="pricing"]').classList.add('active');
    const pricingForm = document.getElementById('pricing-form');
    pricingForm.style.display = 'block';
    pricingForm.classList.add('active');
  } else if (tabType === 'reset') {
    document.querySelector('.auth-tab-btn[onclick*="reset"]').classList.add('active');
    const resetForm = document.getElementById('reset-form');
    resetForm.style.display = 'block';
    resetForm.classList.add('active');
  }
}

// Show demo information
function showDemoInfo() {
  alert(`🎯 Live Demo Request
  
To schedule a live demo of the Store Management System:

📧 Email: aaron.hernandez.dev@gmail.com
📱 Subject: "Store Management Demo Request"

Include in your message:
• Your business type/size
• Preferred demo time
• Specific features you're interested in

We'll schedule a personalized 15-minute walkthrough showing:
✅ Real-time inventory management
✅ Sales processing & reporting  
✅ Business analytics dashboard
✅ Mobile interface demonstration

Demo sessions available:
Monday-Friday: 9 AM - 5 PM (PHT)
Saturday: 10 AM - 2 PM (PHT)`);
}

// ============================================
// 🚀 INITIALIZATION
// ============================================

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupAutoSave();
});

// Export functions for global use
window.registerUser = registerUser;
window.signInUser = signInUser;
window.signOutUser = signOutUser;
window.resetPassword = resetPassword;
window.handleRegister = handleRegister;
window.handleLogin = handleLogin;
window.handlePasswordReset = handlePasswordReset;
window.toggleAuthForm = toggleAuthForm;
window.switchAuthTab = switchAuthTab;
window.showDemoInfo = showDemoInfo;
window.saveUserData = saveUserData;
window.forceSaveUserData = forceSaveUserData;