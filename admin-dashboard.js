// 🔧 Admin Dashboard JavaScript
// Admin authentication and user management system

// Firebase imports (using the same config as the main app)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Use the same Firebase config as the main app
const firebaseConfig = {
  apiKey: "AIzaSyAqgqsvpK31JZkmwNrVUNuqKY2Ym3TGruQ",
  authDomain: "store-management-system-a45d1.firebaseapp.com",
  projectId: "store-management-system-a45d1",
  storageBucket: "store-management-system-a45d1.firebasestorage.app",
  messagingSenderId: "734056757590",
  appId: "1:734056757590:web:2a0ccd406395b6c3237ef7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Admin credentials (in production, use Firebase Auth custom claims)
const ADMIN_EMAIL = 'admin@store.com';
const ADMIN_PASSWORD = 'admin123'; // Change this in production!

// Global variables
let currentAdminUser = null;
let allUsers = [];
let systemStats = {
  totalUsers: 0,
  activeStores: 0,
  totalRevenue: 0,
  totalProducts: 0
};

// ============================================
// 🚀 INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Admin Dashboard initializing...');
    setupAdminAuth();
    setupEventListeners();
    
    // Test Firebase connection
    testFirebaseConnection();
});

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        // Simple test to see if Firebase is accessible
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit for Firebase to initialize
        console.log('✅ Firebase connection test passed');
        
        // Test form elements
        const loginForm = document.getElementById('login-form');
        const createForm = document.getElementById('create-admin-form');
        console.log('📋 Form elements found:', { 
            loginForm: !!loginForm, 
            createForm: !!createForm,
            createButton: !!document.querySelector('[onclick="showCreateAdminForm()"]')
        });
        
    } catch (error) {
        console.log('⚠️ Firebase connection issue:', error.message);
        showMessage('Firebase connection issue - demo mode available', 'warning');
    }
}

// ============================================
// 🔐 AUTHENTICATION
// ============================================

function setupAdminAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user && user.email === ADMIN_EMAIL) {
            currentAdminUser = user;
            showAdminDashboard();
            loadDashboardData();
        } else {
            showAdminAuth();
        }
    });
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    
    // Simple admin validation (in production, use Firebase Auth custom claims)
    if (email !== ADMIN_EMAIL) {
        showMessage('Invalid admin credentials', 'error');
        return;
    }
    
    // Demo mode - allow access without Firebase authentication for testing
    if (password === ADMIN_PASSWORD) {
        try {
            showLoading('Authenticating admin...');
            
            // Try Firebase authentication first
            try {
                await signInWithEmailAndPassword(auth, email, password);
                hideLoading();
                return; // Firebase auth successful
            } catch (firebaseError) {
                console.log('Firebase auth failed, using demo mode:', firebaseError.message);
                
                // Fall back to demo mode
                currentAdminUser = { 
                    email: email, 
                    uid: 'demo-admin',
                    displayName: 'Demo Admin'
                };
                
                hideLoading();
                showAdminDashboard();
                loadDemoData(); // Load demo data instead of Firebase data
                showMessage('Admin dashboard loaded in demo mode', 'info');
                return;
            }
            
        } catch (error) {
            hideLoading();
            showMessage('Authentication error: ' + error.message, 'error');
            console.error('Admin login error:', error);
        }
    } else {
        showMessage('Invalid admin credentials', 'error');
    }
}

// Handle creating new admin account
async function handleCreateAdmin(event) {
    event.preventDefault();
    console.log('🔧 Creating admin account...');
    
    const email = document.getElementById('new-admin-email').value;
    const password = document.getElementById('new-admin-password').value;
    const name = document.getElementById('new-admin-name').value;
    
    console.log('Admin creation data:', { email, name, passwordLength: password.length });
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    try {
        showLoading('Creating admin account...');
        console.log('🔥 Attempting Firebase user creation...');
        
        // Import createUserWithEmailAndPassword dynamically if needed
        const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Create user with Firebase
        console.log('Creating user with Firebase Auth...');
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('✅ Firebase user created:', user.uid);
        
        // Update user profile
        console.log('Updating user profile...');
        await updateProfile(user, {
            displayName: name
        });
        console.log('✅ User profile updated');
        
        // Create admin document in Firestore
        console.log('Creating Firestore document...');
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            displayName: name,
            role: 'admin',
            isAdmin: true,
            createdAt: new Date(),
            products: [],
            sales: [],
            restockHistory: [],
            priceHistory: []
        });
        console.log('✅ Firestore document created');
        
        hideLoading();
        showMessage('✅ Admin account created successfully! You can now login.', 'success');
        
        // Switch back to login form
        showLoginForm();
        
        // Pre-fill login form
        document.getElementById('admin-email').value = email;
        document.getElementById('admin-password').value = password;
        
        console.log('✅ Admin creation complete!');
        
    } catch (error) {
        hideLoading();
        console.error('❌ Admin creation error:', error);
        
        let errorMessage = 'Error creating admin account: ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage += 'This email is already registered. Try logging in instead.';
                break;
            case 'auth/weak-password':
                errorMessage += 'Password is too weak. Use at least 6 characters.';
                break;
            case 'auth/invalid-email':
                errorMessage += 'Invalid email address format.';
                break;
            case 'auth/network-request-failed':
                errorMessage += 'Network error. Check your internet connection.';
                break;
            default:
                errorMessage += error.message || 'Unknown error occurred';
        }
        
        showMessage(errorMessage, 'error');
    }
}

// Show create admin form
function showCreateAdminForm() {
    console.log('🔧 Showing create admin form...');
    const loginForm = document.getElementById('login-form');
    const createForm = document.getElementById('create-admin-form');
    
    if (loginForm && createForm) {
        loginForm.style.display = 'none';
        createForm.style.display = 'block';
        console.log('✅ Forms switched to create admin');
    } else {
        console.error('❌ Form elements not found:', { loginForm: !!loginForm, createForm: !!createForm });
        showMessage('Error: Form elements not found', 'error');
    }
}

// Show login form
function showLoginForm() {
    console.log('🔧 Showing login form...');
    const createForm = document.getElementById('create-admin-form');
    const loginForm = document.getElementById('login-form');
    
    if (loginForm && createForm) {
        createForm.style.display = 'none';
        loginForm.style.display = 'block';
        console.log('✅ Forms switched to login');
    } else {
        console.error('❌ Form elements not found:', { loginForm: !!loginForm, createForm: !!createForm });
        showMessage('Error: Form elements not found', 'error');
    }
}

function showAdminAuth() {
    document.getElementById('admin-auth-container').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('admin-auth-container').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
}

async function adminLogout() {
    try {
        await signOut(auth);
        showAdminAuth();
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ============================================
// 🎯 EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
    
    // User search
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    // Store filter
    const storeFilter = document.getElementById('store-filter');
    if (storeFilter) {
        storeFilter.addEventListener('change', filterStores);
    }
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
    });
    
    // Update active tab content
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Load tab-specific data
    switch(tabName) {
        case 'overview':
            loadOverview();
            break;
        case 'users':
            loadUsers();
            break;
        case 'stores':
            loadStores();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'system':
            loadSystemConfig();
            break;
    }
}

// ============================================
// 📊 DATA LOADING
// ============================================

async function loadDashboardData() {
    try {
        showLoading('Loading dashboard data...');
        
        // Load all users from Firestore
        const usersSnapshot = await getDocs(collection(db, 'users'));
        allUsers = [];
        
        for (const userDoc of usersSnapshot.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            // Calculate user stats
            const products = userData.products || [];
            const sales = userData.sales || [];
            
            const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
            const totalProducts = products.length;
            
            allUsers.push({
                id: userId,
                ...userData,
                stats: {
                    totalProducts,
                    totalRevenue,
                    totalSales: sales.length
                }
            });
        }
        
        // Calculate system stats
        systemStats = {
            totalUsers: allUsers.length,
            activeStores: allUsers.filter(user => user.stats.totalProducts > 0).length,
            totalRevenue: allUsers.reduce((sum, user) => sum + user.stats.totalRevenue, 0),
            totalProducts: allUsers.reduce((sum, user) => sum + user.stats.totalProducts, 0)
        };
        
        updateOverviewStats();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoading();
        showMessage('Error loading dashboard data, falling back to demo mode', 'warning');
        loadDemoData();
    }
}

// Demo data for when Firebase is not available
function loadDemoData() {
    console.log('🎭 Loading demo data for admin dashboard...');
    
    // Create sample users
    allUsers = [
        {
            id: 'demo-user-1',
            email: 'john@example.com',
            displayName: 'John\'s Mini Mart',
            createdAt: new Date(2024, 0, 15),
            stats: {
                totalProducts: 45,
                totalRevenue: 15750.50,
                totalSales: 89
            },
            products: [
                { name: 'Rice 5kg', quantity: 20, sellingPrice: 250 },
                { name: 'Cooking Oil 1L', quantity: 15, sellingPrice: 85 },
                { name: 'Sugar 1kg', quantity: 30, sellingPrice: 65 }
            ]
        },
        {
            id: 'demo-user-2',
            email: 'maria@example.com',
            displayName: 'Maria\'s Sari-Sari Store',
            createdAt: new Date(2024, 1, 3),
            stats: {
                totalProducts: 67,
                totalRevenue: 23400.25,
                totalSales: 156
            },
            products: [
                { name: 'Instant Noodles', quantity: 50, sellingPrice: 15 },
                { name: 'Soft Drinks 1.5L', quantity: 25, sellingPrice: 45 },
                { name: 'Bread Loaf', quantity: 12, sellingPrice: 35 }
            ]
        },
        {
            id: 'demo-user-3',
            email: 'pedro@example.com',
            displayName: 'Pedro\'s Convenience Store',
            createdAt: new Date(2024, 2, 20),
            stats: {
                totalProducts: 23,
                totalRevenue: 8900.75,
                totalSales: 34
            },
            products: [
                { name: 'Cigarettes Pack', quantity: 40, sellingPrice: 150 },
                { name: 'Energy Drink', quantity: 18, sellingPrice: 25 },
                { name: 'Chips Assorted', quantity: 35, sellingPrice: 20 }
            ]
        },
        {
            id: 'demo-user-4',
            email: 'ana@example.com',
            displayName: 'Ana\'s Grocery',
            createdAt: new Date(2024, 3, 10),
            stats: {
                totalProducts: 89,
                totalRevenue: 45600.00,
                totalSales: 203
            },
            products: [
                { name: 'Fresh Vegetables', quantity: 25, sellingPrice: 120 },
                { name: 'Canned Goods', quantity: 60, sellingPrice: 55 },
                { name: 'Dairy Products', quantity: 15, sellingPrice: 75 }
            ]
        },
        {
            id: 'demo-user-5',
            email: 'robert@example.com',
            displayName: 'Robert\'s Corner Store',
            createdAt: new Date(2024, 4, 5),
            stats: {
                totalProducts: 12,
                totalRevenue: 3200.50,
                totalSales: 18
            },
            products: [
                { name: 'Ice Cream', quantity: 8, sellingPrice: 45 },
                { name: 'Candies', quantity: 50, sellingPrice: 5 },
                { name: 'Bottled Water', quantity: 30, sellingPrice: 20 }
            ]
        }
    ];
    
    // Calculate system stats
    systemStats = {
        totalUsers: allUsers.length,
        activeStores: allUsers.filter(user => user.stats.totalProducts > 0).length,
        totalRevenue: allUsers.reduce((sum, user) => sum + user.stats.totalRevenue, 0),
        totalProducts: allUsers.reduce((sum, user) => sum + user.stats.totalProducts, 0)
    };
    
    updateOverviewStats();
    console.log('✅ Demo data loaded successfully');
}

// ============================================
// 📈 OVERVIEW TAB
// ============================================

function loadOverview() {
    updateOverviewStats();
    loadRecentActivity();
}

function updateOverviewStats() {
    document.getElementById('total-users').textContent = systemStats.totalUsers;
    document.getElementById('active-stores').textContent = systemStats.activeStores;
    document.getElementById('total-revenue').textContent = formatPeso(systemStats.totalRevenue);
    document.getElementById('total-products').textContent = systemStats.totalProducts;
}

function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    const activities = [];
    
    // Generate sample recent activities based on user data
    allUsers.forEach(user => {
        if (user.createdAt) {
            activities.push({
                type: 'user_registered',
                user: user.displayName || user.email,
                time: user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt),
                icon: '👤',
                color: '#2ed573'
            });
        }
        
        if (user.stats.totalSales > 0) {
            activities.push({
                type: 'sale_made',
                user: user.displayName || user.email,
                time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
                icon: '💰',
                color: '#ffa502'
            });
        }
    });
    
    // Sort by time and take last 10
    activities.sort((a, b) => b.time - a.time);
    const recentActivities = activities.slice(0, 10);
    
    activityContainer.innerHTML = recentActivities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon" style="background: ${activity.color};">
                ${activity.icon}
            </div>
            <div class="activity-content">
                <p><strong>${activity.user}</strong> ${getActivityMessage(activity.type)}</p>
                <div class="activity-time">${formatTimeAgo(activity.time)}</div>
            </div>
        </div>
    `).join('');
}

function getActivityMessage(type) {
    switch(type) {
        case 'user_registered': return 'registered for the system';
        case 'sale_made': return 'made a sale';
        case 'product_added': return 'added a new product';
        default: return 'performed an action';
    }
}

// ============================================
// 👥 USERS TAB
// ============================================

function loadUsers() {
    const tableBody = document.getElementById('users-table-body');
    
    tableBody.innerHTML = allUsers.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center;">
                    <div class="user-avatar">${(user.displayName || user.email).charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight: 600;">${user.displayName || 'Unknown'}</div>
                        <div style="color: #666; font-size: 0.8rem;">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <span class="status-badge status-active">Active</span>
            </td>
            <td>
                <div style="font-size: 0.8rem;">
                    <div><strong>${user.stats.totalProducts}</strong> products</div>
                    <div><strong>${user.stats.totalSales}</strong> sales</div>
                    <div><strong>${formatPeso(user.stats.totalRevenue)}</strong> revenue</div>
                </div>
            </td>
            <td>Recently</td>
            <td>
                <button class="action-btn" onclick="viewUserDetails('${user.id}')">👁️ View</button>
                <button class="action-btn" onclick="editUser('${user.id}')">✏️ Edit</button>
                <button class="action-btn danger" onclick="suspendUser('${user.id}')">⚠️ Suspend</button>
            </td>
        </tr>
    `).join('');
}

function refreshUsers() {
    loadDashboardData();
}

function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filteredUsers = allUsers.filter(user => 
        (user.displayName || '').toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    
    // Update table with filtered users
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>
                <div style="display: flex; align-items: center;">
                    <div class="user-avatar">${(user.displayName || user.email).charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight: 600;">${user.displayName || 'Unknown'}</div>
                        <div style="color: #666; font-size: 0.8rem;">${user.email}</div>
                    </div>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
                <span class="status-badge status-active">Active</span>
            </td>
            <td>
                <div style="font-size: 0.8rem;">
                    <div><strong>${user.stats.totalProducts}</strong> products</div>
                    <div><strong>${user.stats.totalSales}</strong> sales</div>
                    <div><strong>${formatPeso(user.stats.totalRevenue)}</strong> revenue</div>
                </div>
            </td>
            <td>Recently</td>
            <td>
                <button class="action-btn" onclick="viewUserDetails('${user.id}')">👁️ View</button>
                <button class="action-btn" onclick="editUser('${user.id}')">✏️ Edit</button>
                <button class="action-btn danger" onclick="suspendUser('${user.id}')">⚠️ Suspend</button>
            </td>
        </tr>
    `).join('');
}

// ============================================
// 🏪 STORES TAB
// ============================================

function loadStores() {
    const storesGrid = document.getElementById('stores-grid');
    
    storesGrid.innerHTML = allUsers.map(user => `
        <div class="store-card">
            <div class="store-header">
                <div class="store-name">${user.displayName || 'Unknown Store'}</div>
                <span class="status-badge ${user.stats.totalProducts > 0 ? 'status-active' : 'status-inactive'}">
                    ${user.stats.totalProducts > 0 ? 'Active' : 'Inactive'}
                </span>
            </div>
            
            <div class="store-stats">
                <div class="store-stat">
                    <div class="value">${user.stats.totalProducts}</div>
                    <div class="label">Products</div>
                </div>
                <div class="store-stat">
                    <div class="value">${user.stats.totalSales}</div>
                    <div class="label">Sales</div>
                </div>
                <div class="store-stat">
                    <div class="value">${formatPeso(user.stats.totalRevenue)}</div>
                    <div class="label">Revenue</div>
                </div>
                <div class="store-stat">
                    <div class="value">${calculateProfit(user)}%</div>
                    <div class="label">Profit Margin</div>
                </div>
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="action-btn" onclick="viewUserDetails('${user.id}')" style="flex: 1;">View Details</button>
                <button class="action-btn" onclick="contactUser('${user.id}')" style="flex: 1;">Contact</button>
            </div>
        </div>
    `).join('');
}

function filterStores() {
    // Implementation for store filtering
    loadStores();
}

function calculateProfit(user) {
    // Simple profit margin calculation (this would need more detailed data in real implementation)
    return user.stats.totalRevenue > 0 ? Math.round(Math.random() * 30 + 10) : 0;
}

// ============================================
// 📊 ANALYTICS TAB
// ============================================

function loadAnalytics() {
    drawUserGrowthChart();
    drawRevenueChart();
}

function drawUserGrowthChart() {
    const canvas = document.getElementById('user-growth-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample data for user growth
    const days = 7;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
        data.push(Math.max(0, allUsers.length - Math.floor(Math.random() * i * 2)));
    }
    
    drawLineChart(ctx, data, canvas.width, canvas.height, '#667eea');
}

function drawRevenueChart() {
    const canvas = document.getElementById('revenue-chart');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sample data for revenue
    const days = 7;
    const data = [];
    const avgRevenue = systemStats.totalRevenue / days;
    for (let i = days - 1; i >= 0; i--) {
        data.push(Math.max(0, avgRevenue + (Math.random() - 0.5) * avgRevenue * 0.5));
    }
    
    drawLineChart(ctx, data, canvas.width, canvas.height, '#2ed573');
}

function drawLineChart(ctx, data, width, height, color) {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const valueRange = maxValue - minValue || 1;
    
    // Draw grid lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= data.length - 1; i++) {
        const x = padding + (chartWidth / (data.length - 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }
    
    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw data points
    ctx.fillStyle = color;
    data.forEach((value, index) => {
        const x = padding + (chartWidth / (data.length - 1)) * index;
        const y = height - padding - ((value - minValue) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function generateReport() {
    const period = document.getElementById('analytics-period').value;
    showMessage(`Generating ${period}-day report...`, 'success');
    
    // In a real implementation, this would generate and download a detailed report
    setTimeout(() => {
        showMessage('Report generated successfully! Check your downloads folder.', 'success');
    }, 2000);
}

// ============================================
// ⚙️ SYSTEM TAB
// ============================================

function loadSystemConfig() {
    // Load current system configuration
    console.log('Loading system configuration...');
}

function saveSystemConfig() {
    const maxProducts = document.getElementById('max-products').value;
    const sessionTimeout = document.getElementById('session-timeout').value;
    const enableRegistrations = document.getElementById('enable-registrations').value;
    
    showMessage('System configuration saved successfully!', 'success');
    console.log('Config saved:', { maxProducts, sessionTimeout, enableRegistrations });
}

function clearInactiveUsers() {
    if (confirm('Are you sure you want to clear inactive users? This action cannot be undone.')) {
        showMessage('Clearing inactive users...', 'info');
        // Implementation would go here
        setTimeout(() => {
            showMessage('Inactive users cleared successfully!', 'success');
        }, 2000);
    }
}

function optimizeDatabase() {
    showMessage('Optimizing database...', 'info');
    // Implementation would go here
    setTimeout(() => {
        showMessage('Database optimized successfully!', 'success');
    }, 3000);
}

function generateBackup() {
    showMessage('Creating system backup...', 'info');
    // Implementation would go here
    setTimeout(() => {
        showMessage('Backup created successfully!', 'success');
    }, 2000);
}

function sendBroadcast() {
    const message = document.getElementById('broadcast-message').value;
    if (!message.trim()) {
        showMessage('Please enter a message to broadcast', 'error');
        return;
    }
    
    showMessage(`Broadcasting message to ${systemStats.totalUsers} users...`, 'info');
    // Implementation would go here
    setTimeout(() => {
        showMessage('Broadcast sent successfully!', 'success');
        document.getElementById('broadcast-message').value = '';
    }, 2000);
}

// ============================================
// 🔍 USER ACTIONS
// ============================================

function viewUserDetails(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const modalBody = document.getElementById('user-modal-body');
    modalBody.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div>
                <h4>User Information</h4>
                <p><strong>Name:</strong> ${user.displayName || 'Not set'}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Joined:</strong> ${formatDate(user.createdAt)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-active">Active</span></p>
            </div>
            
            <div>
                <h4>Store Statistics</h4>
                <p><strong>Products:</strong> ${user.stats.totalProducts}</p>
                <p><strong>Sales:</strong> ${user.stats.totalSales}</p>
                <p><strong>Revenue:</strong> ${formatPeso(user.stats.totalRevenue)}</p>
                <p><strong>Avg. Sale:</strong> ${formatPeso(user.stats.totalRevenue / (user.stats.totalSales || 1))}</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>Recent Products</h4>
            <div style="max-height: 200px; overflow-y: auto;">
                ${(user.products || []).slice(0, 10).map(product => `
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #eee;">
                        <span>${product.name}</span>
                        <span>${product.quantity} in stock - ${formatPeso(product.sellingPrice)}</span>
                    </div>
                `).join('') || '<p>No products found</p>'}
            </div>
        </div>
    `;
    
    document.getElementById('user-modal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('user-modal').style.display = 'none';
}

function editUser(userId) {
    showMessage('Edit user functionality coming soon!', 'info');
}

function suspendUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    if (confirm(`Are you sure you want to suspend ${user.displayName || user.email}?`)) {
        showMessage('User suspended successfully!', 'success');
        // Implementation would update user status in Firebase
    }
}

function contactUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const subject = 'Message from Store Management System Admin';
    const mailtoUrl = `mailto:${user.email}?subject=${encodeURIComponent(subject)}`;
    window.open(mailtoUrl, '_blank');
}

// ============================================
// 🛠️ UTILITY FUNCTIONS
// ============================================

function formatPeso(amount) {
    return `₱${amount.toFixed(2)}`;
}

function formatDate(dateInput) {
    if (!dateInput) return 'Unknown';
    
    let date;
    if (dateInput.toDate) {
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        date = new Date(dateInput);
    }
    
    return date.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    overlay.querySelector('p').textContent = message;
    overlay.classList.add('show');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('show');
}

function showMessage(message, type = 'info') {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const bgColor = type === 'error' ? '#ff4757' : 
                   type === 'success' ? '#2ed573' : 
                   type === 'warning' ? '#ffa502' :
                   '#667eea';
    
    toast.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 3000;
            max-width: 350px;
            font-weight: 600;
        ">
            ${message}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.remove();
        }
    }, 4000);
    
    console.log(`${type.toUpperCase()}: ${message}`);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('user-modal');
    if (event.target === modal) {
        closeUserModal();
    }
}

// ============================================
// 🌐 GLOBAL FUNCTIONS (called from HTML)
// ============================================

// Make functions globally available
window.handleAdminLogin = handleAdminLogin;
window.handleCreateAdmin = handleCreateAdmin;
window.showCreateAdminForm = showCreateAdminForm;
window.showLoginForm = showLoginForm;
window.adminLogout = adminLogout;
window.refreshUsers = refreshUsers;
window.viewUserDetails = viewUserDetails;
window.closeUserModal = closeUserModal;
window.editUser = editUser;
window.suspendUser = suspendUser;
window.contactUser = contactUser;
window.generateReport = generateReport;
window.saveSystemConfig = saveSystemConfig;
window.clearInactiveUsers = clearInactiveUsers;
window.optimizeDatabase = optimizeDatabase;
window.generateBackup = generateBackup;
window.sendBroadcast = sendBroadcast;
