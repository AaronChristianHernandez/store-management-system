// 🔥 Firebase Integration - Data storage with auto-save
let products = JSON.parse(localStorage.getItem('products')) || [];
let sales = JSON.parse(localStorage.getItem('sales')) || [];
let priceHistory = JSON.parse(localStorage.getItem('priceHistory')) || [];
let restockHistory = JSON.parse(localStorage.getItem('restockHistory')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    lowStockThreshold: 5,
    reorderSuggestions: true,
    businessName: 'My Mini Store',
    taxRate: 0
};

// Auto-save to Firebase after data changes
function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    // Firebase auto-save will be triggered by the localStorage override in auth.js
    console.log(`💾 Saved ${key} to localStorage:`, data.length || 'N/A', 'items');
}

// Manual save to Firebase (for immediate saving)
async function manualSaveToFirebase() {
    if (typeof forceSaveUserData === 'function') {
        await forceSaveUserData();
    } else {
        console.warn('Firebase save function not available');
    }
}

// Refresh functions for Firebase data loading
function refreshProducts() {
    products = JSON.parse(localStorage.getItem('products')) || [];
    loadProducts();
    console.log('🔄 Refreshed products:', products.length);
}

function refreshSales() {
    sales = JSON.parse(localStorage.getItem('sales')) || [];
    loadSales();
    updateSummary();
    console.log('🔄 Refreshed sales:', sales.length);
}

function refreshSummary() {
    updateSummary();
    console.log('🔄 Refreshed summary');
}

function refreshInventory() {
    initializeInventoryOverview();
    console.log('🔄 Refreshed inventory');
}

// Currency formatting function
function formatPeso(amount) {
    return `₱${amount.toFixed(2)}`;
}

// DOM elements
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const productForm = document.getElementById('product-form');
const salesForm = document.getElementById('sales-form');
const productSelect = document.getElementById('product-select');
const saleQuantityInput = document.getElementById('sale-quantity');
const totalPriceInput = document.getElementById('total-price');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application initializing...');
    console.log('🌍 Environment:', window.location.hostname);
    console.log('📍 Current URL:', window.location.href);
    
    setupTabs();
    loadProducts();
    loadSales();
    updateSummary();
    setupEventListeners();
    initializeMonthSelector();
    initializeAutomation();
    initializeRestocking();
    initializeInventoryOverview();
    loadSettings();
    
    console.log('✅ Application initialization complete');
});

// Tab functionality
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all tabs and buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Update summary when summary tab is opened
            if (targetTab === 'summary') {
                updateSummary();
            }
            
            // Update inventory when inventory tab is opened
            if (targetTab === 'inventory') {
                updateInventoryOverview();
            }
            
            // Update restocking dropdowns when restocking tab is opened
            if (targetTab === 'restocking') {
                loadRestockProductDropdowns();
            }
            
            // Update monthly progress when monthly tab is opened  
            if (targetTab === 'monthly') {
                initializeMonthSelector();
            }
        });
    });
}

// Setup event listeners
function setupEventListeners() {
    // Product form submission
    productForm.addEventListener('submit', handleProductSubmit);
    
    // Sales form submission
    salesForm.addEventListener('submit', handleSalesSubmit);
    
    // Product selection change
    productSelect.addEventListener('change', updateTotalPrice);
    
    // Quantity change
    saleQuantityInput.addEventListener('input', updateTotalPrice);
    
    // Search and filter event listeners
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('input', filterProducts);
    }
    
    const productCategoryFilter = document.getElementById('product-category-filter');
    if (productCategoryFilter) {
        productCategoryFilter.addEventListener('change', filterProducts);
    }
    
    const productStockFilter = document.getElementById('product-stock-filter');
    if (productStockFilter) {
        productStockFilter.addEventListener('change', filterProducts);
    }
}

// Product management
function handleProductSubmit(e) {
    e.preventDefault();
    
    const productName = document.getElementById('product-name').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const originalPrice = parseFloat(document.getElementById('original-price').value);
    const sellingPrice = parseFloat(document.getElementById('selling-price').value);
    
    if (!productName || quantity < 0 || originalPrice < 0 || sellingPrice < 0) {
        alert('Please fill in all fields with valid values.');
        return;
    }
    
    // Check if product already exists
    const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (existingProductIndex !== -1) {
        // Update existing product
        products[existingProductIndex].quantity += quantity;
        products[existingProductIndex].originalPrice = originalPrice;
        products[existingProductIndex].sellingPrice = sellingPrice;
    } else {
        // Add new product
        const product = {
            id: Date.now(),
            name: productName,
            quantity: quantity,
            originalPrice: originalPrice,
            sellingPrice: sellingPrice,
            totalSold: 0
        };
        products.push(product);
    }
    
    saveProducts();
    loadProducts();
    productForm.reset();
}

function loadProducts() {
    const tbody = document.querySelector('#products-table tbody');
    tbody.innerHTML = '';
    
    // Clear and populate product select
    productSelect.innerHTML = '<option value="">-- Select a Product --</option>';
    
    products.forEach(product => {
        // Add to product table
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category || 'Other'}</td>
            <td>${product.quantity}</td>
            <td>${formatPeso(product.originalPrice)}</td>
            <td>${formatPeso(product.sellingPrice)}</td>
            <td>
                <button class="delete-btn" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
        
        // Add to product select dropdown (only if in stock)
        if (product.quantity > 0) {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (Stock: ${product.quantity})`;
            productSelect.appendChild(option);
        }
    });
    
    // Also update restocking dropdowns if restocking elements exist
    const restockSelect = document.getElementById('restock-product-select');
    if (restockSelect) {
        loadRestockProductDropdowns();
    }
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(product => product.id !== productId);
        saveProducts();
        loadProducts();
        updateSummary();
        // Auto-refresh inventory overview
        updateInventoryOverview();
        updateInventoryStats();
    }
}

// Sales management
function handleSalesSubmit(e) {
    e.preventDefault();
    
    const selectedProductId = parseInt(productSelect.value);
    const quantityToSell = parseInt(saleQuantityInput.value);
    
    if (!selectedProductId || !quantityToSell || quantityToSell <= 0) {
        alert('Please select a product and enter a valid quantity.');
        return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    
    if (!product) {
        alert('Selected product not found.');
        return;
    }
    
    if (quantityToSell > product.quantity) {
        alert(`Insufficient stock. Available quantity: ${product.quantity}`);
        return;
    }
    
    // Record the sale
    const sale = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        productId: selectedProductId,
        productName: product.name,
        quantity: quantityToSell,
        unitPrice: product.sellingPrice,
        originalPrice: product.originalPrice,
        totalAmount: quantityToSell * product.sellingPrice
    };
    
    sales.push(sale);
    
    // Update product quantity and total sold
    product.quantity -= quantityToSell;
    product.totalSold = (product.totalSold || 0) + quantityToSell;
    
    saveSales();
    saveProducts();
    loadProducts();
    loadSales();
    salesForm.reset();
    
    alert('Sale recorded successfully!');
}

function updateTotalPrice() {
    const selectedProductId = parseInt(productSelect.value);
    const quantity = parseInt(saleQuantityInput.value) || 0;
    
    if (selectedProductId && quantity > 0) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            const total = quantity * product.sellingPrice;
            totalPriceInput.value = formatPeso(total);
        }
    } else {
        totalPriceInput.value = '';
    }
}

function loadSales() {
    const tbody = document.querySelector('#sales-table tbody');
    tbody.innerHTML = '';
    
    sales.slice().reverse().forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.productName}</td>
            <td>${sale.quantity}</td>
            <td>${formatPeso(sale.unitPrice)}</td>
            <td>${formatPeso(sale.totalAmount)}</td>
            <td>
                <button class="delete-btn" onclick="deleteSale(${sale.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteSale(saleId) {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) {
        alert('Sale not found.');
        return;
    }
    
    if (confirm(`Are you sure you want to delete this sale?\n\nProduct: ${sale.productName}\nQuantity: ${sale.quantity}\nAmount: ${formatPeso(sale.totalAmount)}\n\nWarning: This will restore the stock quantity but cannot be undone.`)) {
        // Find the product and restore stock
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            product.quantity += sale.quantity;
            product.totalSold = Math.max(0, (product.totalSold || 0) - sale.quantity);
        }
        
        // Remove the sale
        sales = sales.filter(s => s.id !== saleId);
        
        // Save data
        saveSales();
        saveProducts();
        
        // Update displays
        loadSales();
        loadProducts();
        updateSummary();
        
        alert('Sale deleted and stock restored successfully!');
    }
}

// Summary management
function updateSummary() {
    // Calculate total revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    document.getElementById('total-revenue').textContent = formatPeso(totalRevenue);
    
    // Calculate total profit
    const totalProfit = sales.reduce((sum, sale) => {
        const profit = (sale.unitPrice - sale.originalPrice) * sale.quantity;
        return sum + profit;
    }, 0);
    document.getElementById('total-profit').textContent = formatPeso(totalProfit);
    
    // Count products in stock
    const productsInStock = products.filter(product => product.quantity > 0).length;
    document.getElementById('products-in-stock').textContent = productsInStock;
    
    // Count total sales transactions
    document.getElementById('total-sales').textContent = sales.length;
    
    // Update low stock alert
    updateLowStockAlert();
    
    // Update top products
    updateTopProducts();
}

function updateLowStockAlert() {
    const lowStockList = document.getElementById('low-stock-list');
    const lowStockProducts = products.filter(product => product.quantity > 0 && product.quantity <= 5);
    
    if (lowStockProducts.length === 0) {
        lowStockList.innerHTML = '<li>No products with low stock</li>';
    } else {
        lowStockList.innerHTML = lowStockProducts
            .map(product => `<li>${product.name} - Only ${product.quantity} left in stock</li>`)
            .join('');
    }
}

function updateTopProducts() {
    const tbody = document.querySelector('#top-products-table tbody');
    tbody.innerHTML = '';
    
    // Calculate revenue for each product
    const productStats = products
        .filter(product => product.totalSold > 0)
        .map(product => {
            const productSales = sales.filter(sale => sale.productId === product.id);
            const revenue = productSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
            return {
                name: product.name,
                totalSold: product.totalSold,
                revenue: revenue
            };
        })
        .sort((a, b) => b.totalSold - a.totalSold)
        .slice(0, 5); // Top 5 products
    
    if (productStats.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3">No sales data available</td>';
        tbody.appendChild(row);
    } else {
        productStats.forEach(stat => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${stat.name}</td>
                <td>${stat.totalSold}</td>
                <td>${formatPeso(stat.revenue)}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

// Data persistence
function saveProducts() {
    saveToStorage('products', products);
}

function saveSales() {
    saveToStorage('sales', sales);
}

// Utility functions
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        localStorage.clear();
        products = [];
        sales = [];
        loadProducts();
        loadSales();
        updateSummary();
        alert('All data has been cleared.');
    }
}

// Monthly Progress Functions
function initializeMonthSelector() {
    const monthSelect = document.getElementById('month-year-select');
    const generateBtn = document.getElementById('generate-report');
    
    // Populate month options based on sales data
    populateMonthOptions();
    
    generateBtn.addEventListener('click', function() {
        const selectedMonth = monthSelect.value;
        if (selectedMonth) {
            generateMonthlyReport(selectedMonth);
        } else {
            alert('Please select a month first.');
        }
    });
}

function populateMonthOptions() {
    const monthSelect = document.getElementById('month-year-select');
    const months = new Set();
    
    // Get unique months from sales data
    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const monthYear = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthYear);
    });
    
    // Add current month if no sales exist
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    months.add(currentMonth);
    
    // Sort months in descending order
    const sortedMonths = Array.from(months).sort().reverse();
    
    monthSelect.innerHTML = '<option value="">-- Select Month --</option>';
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
        const option = document.createElement('option');
        option.value = month;
        option.textContent = monthName;
        monthSelect.appendChild(option);
    });
}

function generateMonthlyReport(selectedMonth) {
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Filter sales for the selected month
    const monthlySales = sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });
    
    // Calculate monthly metrics
    const monthlyRevenue = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const monthlyProfit = monthlySales.reduce((sum, sale) => {
        const profit = (sale.unitPrice - sale.originalPrice) * sale.quantity;
        return sum + profit;
    }, 0);
    const monthlyItemsSold = monthlySales.reduce((sum, sale) => sum + sale.quantity, 0);
    const monthlyTransactions = monthlySales.length;
    
    // Update monthly summary cards
    document.getElementById('monthly-revenue').textContent = formatPeso(monthlyRevenue);
    document.getElementById('monthly-profit').textContent = formatPeso(monthlyProfit);
    document.getElementById('monthly-items-sold').textContent = monthlyItemsSold;
    document.getElementById('monthly-transactions').textContent = monthlyTransactions;
    
    // Generate daily sales chart
    generateDailySalesChart(monthlySales, startDate, endDate);
    
    // Generate monthly top products
    generateMonthlyTopProducts(monthlySales);
    
    // Calculate month-over-month growth
    calculateMonthOverMonthGrowth(selectedMonth);
}

function generateDailySalesChart(monthlySales, startDate, endDate) {
    const chartContainer = document.getElementById('daily-sales-chart');
    chartContainer.innerHTML = '';
    
    // Group sales by day
    const dailySales = {};
    const totalDays = endDate.getDate();
    
    // Initialize all days with 0
    for (let day = 1; day <= totalDays; day++) {
        dailySales[day] = 0;
    }
    
    // Populate actual sales data
    monthlySales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const day = saleDate.getDate();
        dailySales[day] += sale.totalAmount;
    });
    
    // Find max value for scaling
    const maxSales = Math.max(...Object.values(dailySales));
    const maxHeight = 150; // Maximum height in pixels
    
    // Create bars
    Object.entries(dailySales).forEach(([day, amount]) => {
        const bar = document.createElement('div');
        bar.className = 'daily-bar';
        const height = maxSales > 0 ? (amount / maxSales) * maxHeight : 0;
        bar.style.height = `${height}px`;
        bar.style.width = `${Math.max(800 / totalDays - 4, 15)}px`;
        bar.setAttribute('data-tooltip', `Day ${day}: ${formatPeso(amount)}`);
        bar.title = `Day ${day}: ${formatPeso(amount)}`;
        chartContainer.appendChild(bar);
    });
}

function generateMonthlyTopProducts(monthlySales) {
    const tbody = document.querySelector('#monthly-top-products-table tbody');
    tbody.innerHTML = '';
    
    // Group sales by product
    const productStats = {};
    monthlySales.forEach(sale => {
        if (!productStats[sale.productId]) {
            productStats[sale.productId] = {
                name: sale.productName,
                quantity: 0,
                revenue: 0,
                profit: 0
            };
        }
        productStats[sale.productId].quantity += sale.quantity;
        productStats[sale.productId].revenue += sale.totalAmount;
        productStats[sale.productId].profit += (sale.unitPrice - sale.originalPrice) * sale.quantity;
    });
    
    // Sort by quantity sold
    const sortedProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);
    
    if (sortedProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4">No sales data for this month</td>';
        tbody.appendChild(row);
    } else {
        sortedProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${formatPeso(product.revenue)}</td>
                <td>${formatPeso(product.profit)}</td>
            `;
            tbody.appendChild(row);
        });
    }
}

function calculateMonthOverMonthGrowth(currentMonth) {
    const [year, month] = currentMonth.split('-');
    const prevMonth = month === '01' ? 
        `${year - 1}-12` : 
        `${year}-${String(month - 1).padStart(2, '0')}`;
    
    const currentSales = getMonthSales(currentMonth);
    const previousSales = getMonthSales(prevMonth);
    
    const currentRevenue = currentSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const previousRevenue = previousSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    const currentProfit = currentSales.reduce((sum, sale) => {
        return sum + (sale.unitPrice - sale.originalPrice) * sale.quantity;
    }, 0);
    const previousProfit = previousSales.reduce((sum, sale) => {
        return sum + (sale.unitPrice - sale.originalPrice) * sale.quantity;
    }, 0);
    
    const currentVolume = currentSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const previousVolume = previousSales.reduce((sum, sale) => sum + sale.quantity, 0);
    
    // Calculate growth percentages
    const revenueGrowth = calculateGrowthPercentage(previousRevenue, currentRevenue);
    const profitGrowth = calculateGrowthPercentage(previousProfit, currentProfit);
    const volumeGrowth = calculateGrowthPercentage(previousVolume, currentVolume);
    
    // Update display
    updateGrowthDisplay('revenue-growth', revenueGrowth);
    updateGrowthDisplay('profit-growth', profitGrowth);
    updateGrowthDisplay('volume-growth', volumeGrowth);
}

function getMonthSales(monthYear) {
    const [year, month] = monthYear.split('-');
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });
}

function calculateGrowthPercentage(previous, current) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
}

function updateGrowthDisplay(elementId, growth) {
    const element = document.getElementById(elementId);
    if (growth > 0) {
        element.textContent = `+${growth.toFixed(1)}%`;
        element.className = 'metric-value positive';
    } else if (growth < 0) {
        element.textContent = `${growth.toFixed(1)}%`;
        element.className = 'metric-value negative';
    } else {
        element.textContent = '0.0%';
        element.className = 'metric-value';
    }
}

// Automation Hub Functions
function initializeAutomation() {
    setupAutomationEventListeners();
    updateReorderSuggestions();
    updateProfitOptimization();
    updatePerformanceInsights();
}

function setupAutomationEventListeners() {
    // Settings
    document.getElementById('low-stock-threshold').addEventListener('change', function() {
        settings.lowStockThreshold = parseInt(this.value);
        saveSettings();
        updateSummary();
    });
    
    document.getElementById('reorder-suggestions').addEventListener('change', function() {
        settings.reorderSuggestions = this.checked;
        saveSettings();
        updateReorderSuggestions();
    });
    
    // Export buttons
    document.getElementById('export-monthly-report').addEventListener('click', exportMonthlyReport);
    document.getElementById('export-inventory-report').addEventListener('click', exportInventoryReport);
    document.getElementById('backup-data').addEventListener('click', backupAllData);
}

function updateReorderSuggestions() {
    const container = document.getElementById('reorder-suggestions-list');
    
    if (!settings.reorderSuggestions) {
        container.innerHTML = '<p>Auto reorder suggestions are disabled</p>';
        return;
    }
    
    const suggestions = generateReorderSuggestions();
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p>No reorder suggestions at this time</p>';
        return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item">
            <h4>${suggestion.product.name}</h4>
            <p>Current Stock: ${suggestion.product.quantity} | 
               Suggested Reorder: ${suggestion.suggestedQuantity} units | 
               Based on ${suggestion.salesVelocity.toFixed(1)} units/week average</p>
        </div>
    `).join('');
}

function generateReorderSuggestions() {
    const suggestions = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    products.forEach(product => {
        if (product.quantity <= settings.lowStockThreshold) {
            // Calculate sales velocity (units per week)
            const recentSales = sales.filter(sale => 
                sale.productId === product.id && new Date(sale.date) >= thirtyDaysAgo
            );
            
            const totalSold = recentSales.reduce((sum, sale) => sum + sale.quantity, 0);
            const salesVelocity = (totalSold / 4) || 1; // per week, default to 1 if no sales
            
            // Suggest 4 weeks of inventory plus safety stock
            const suggestedQuantity = Math.ceil(salesVelocity * 4) + settings.lowStockThreshold;
            
            suggestions.push({
                product,
                salesVelocity,
                suggestedQuantity
            });
        }
    });
    
    return suggestions.sort((a, b) => b.salesVelocity - a.salesVelocity);
}

function updateProfitOptimization() {
    const container = document.getElementById('profit-optimization');
    const optimizations = generateProfitOptimizations();
    
    if (optimizations.length === 0) {
        container.innerHTML = '<p>No profit optimization suggestions available</p>';
        return;
    }
    
    container.innerHTML = optimizations.map(opt => `
        <div class="suggestion-item">
            <h4>${opt.product.name}</h4>
            <p>${opt.suggestion}</p>
        </div>
    `).join('');
}

function generateProfitOptimizations() {
    const optimizations = [];
    
    products.forEach(product => {
        const productSales = sales.filter(sale => sale.productId === product.id);
        if (productSales.length === 0) return;
        
        const avgSalesPerWeek = productSales.length / 4; // Rough estimate
        const currentMargin = ((product.sellingPrice - product.originalPrice) / product.sellingPrice) * 100;
        
        if (avgSalesPerWeek > 5 && currentMargin < 20) {
            optimizations.push({
                product,
                suggestion: `High demand, low margin (${currentMargin.toFixed(1)}%). Consider increasing price by ₱${(product.sellingPrice * 0.1).toFixed(2)}`
            });
        } else if (avgSalesPerWeek < 1 && currentMargin > 50) {
            optimizations.push({
                product,
                suggestion: `Low demand, high margin (${currentMargin.toFixed(1)}%). Consider reducing price to ₱${(product.sellingPrice * 0.9).toFixed(2)} to boost sales`
            });
        }
    });
    
    return optimizations;
}

function updatePerformanceInsights() {
    // Best selling day
    const dailySalesMap = {};
    sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dayName = saleDate.toLocaleDateString('en-US', { weekday: 'long' });
        dailySalesMap[dayName] = (dailySalesMap[dayName] || 0) + sale.totalAmount;
    });
    
    const bestDay = Object.entries(dailySalesMap).sort(([,a], [,b]) => b - a)[0];
    document.getElementById('best-selling-day').textContent = bestDay ? `${bestDay[0]} (${formatPeso(bestDay[1])})` : '--';
    
    // Average daily revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const uniqueDays = new Set(sales.map(sale => new Date(sale.date).toDateString())).size;
    const avgDailyRevenue = uniqueDays > 0 ? totalRevenue / uniqueDays : 0;
    document.getElementById('avg-daily-revenue').textContent = formatPeso(avgDailyRevenue);
    
    // Most profitable product
    const productProfits = {};
    sales.forEach(sale => {
        const profit = (sale.unitPrice - sale.originalPrice) * sale.quantity;
        productProfits[sale.productName] = (productProfits[sale.productName] || 0) + profit;
    });
    
    const mostProfitable = Object.entries(productProfits).sort(([,a], [,b]) => b - a)[0];
    document.getElementById('most-profitable-product').textContent = 
        mostProfitable ? `${mostProfitable[0]} (${formatPeso(mostProfitable[1])})` : '--';
    
    // Inventory turnover (rough calculation)
    const totalInventoryValue = products.reduce((sum, product) => sum + (product.originalPrice * product.quantity), 0);
    const totalCOGS = sales.reduce((sum, sale) => sum + (sale.originalPrice * sale.quantity), 0);
    const inventoryTurnover = totalInventoryValue > 0 ? (totalCOGS / totalInventoryValue).toFixed(2) : '--';
    document.getElementById('inventory-turnover').textContent = inventoryTurnover + 'x';
}

// Enhanced Export Functions with Complete Details
function exportMonthlyReport() {
    const monthSelect = document.getElementById('month-year-select');
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        alert('Please select a month first');
        return;
    }
    
    const monthlySales = getMonthSales(selectedMonth);
    const monthlyStats = calculateMonthlyStats(monthlySales);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "MONTHLY BUSINESS REPORT\n";
    csvContent += `Report Date: ${new Date().toLocaleDateString()}\n`;
    csvContent += `Period: ${selectedMonth}\n\n`;
    
    // Summary Statistics
    csvContent += "MONTHLY SUMMARY\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Revenue,₱${monthlyStats.totalRevenue.toLocaleString()}\n`;
    csvContent += `Total Profit,₱${monthlyStats.totalProfit.toLocaleString()}\n`;
    csvContent += `Total Items Sold,${monthlyStats.totalItemsSold.toLocaleString()}\n`;
    csvContent += `Total Transactions,${monthlyStats.totalTransactions.toLocaleString()}\n`;
    csvContent += `Average Transaction Value,₱${monthlyStats.avgTransactionValue.toFixed(2)}\n`;
    csvContent += `Profit Margin,%${monthlyStats.profitMargin.toFixed(2)}\n\n`;
    
    // Daily Sales Breakdown
    csvContent += "DAILY SALES BREAKDOWN\n";
    csvContent += "Date,Revenue,Profit,Items Sold,Transactions\n";
    monthlyStats.dailyBreakdown.forEach(day => {
        csvContent += `${day.date},₱${day.revenue.toFixed(2)},₱${day.profit.toFixed(2)},${day.itemsSold},${day.transactions}\n`;
    });
    
    csvContent += "\nTOP SELLING PRODUCTS\n";
    csvContent += "Product,Quantity Sold,Revenue,Profit,Profit Margin %\n";
    monthlyStats.topProducts.forEach(product => {
        csvContent += `"${product.name}",${product.quantitySold},₱${product.revenue.toFixed(2)},₱${product.profit.toFixed(2)},${product.profitMargin.toFixed(2)}%\n`;
    });
    
    csvContent += "\nDETAILED SALES TRANSACTIONS\n";
    csvContent += "Date,Time,Product,Quantity,Unit Price,Total Amount,Profit\n";
    monthlySales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const profit = (sale.unitPrice - sale.originalPrice) * sale.quantity;
        csvContent += `${saleDate.toLocaleDateString()},${saleDate.toLocaleTimeString()},"${sale.productName}",${sale.quantity},₱${sale.unitPrice.toFixed(2)},₱${sale.totalAmount.toFixed(2)},₱${profit.toFixed(2)}\n`;
    });
    
    downloadCSV(csvContent, `complete-monthly-report-${selectedMonth}.csv`);
}

function exportInventoryReport() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "COMPLETE INVENTORY REPORT\n";
    csvContent += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    
    // Inventory Summary
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.originalPrice), 0);
    const totalSellingValue = products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0);
    const lowStockItems = products.filter(p => p.quantity <= settings.lowStockThreshold).length;
    const outOfStockItems = products.filter(p => p.quantity === 0).length;
    
    csvContent += "INVENTORY SUMMARY\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Products,${totalProducts}\n`;
    csvContent += `Total Inventory Cost,₱${totalValue.toLocaleString()}\n`;
    csvContent += `Total Inventory Value,₱${totalSellingValue.toLocaleString()}\n`;
    csvContent += `Potential Profit,₱${(totalSellingValue - totalValue).toLocaleString()}\n`;
    csvContent += `Low Stock Items,${lowStockItems}\n`;
    csvContent += `Out of Stock Items,${outOfStockItems}\n`;
    csvContent += `Stock Coverage,%${((totalProducts - outOfStockItems) / totalProducts * 100).toFixed(2)}\n\n`;
    
    // Category Breakdown
    csvContent += "CATEGORY BREAKDOWN\n";
    csvContent += "Category,Products,Total Stock,Cost Value,Selling Value,Profit Potential\n";
    const categoryStats = {};
    products.forEach(product => {
        const category = product.category || 'Other';
        if (!categoryStats[category]) {
            categoryStats[category] = { count: 0, stock: 0, cost: 0, selling: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].stock += product.quantity;
        categoryStats[category].cost += product.quantity * product.originalPrice;
        categoryStats[category].selling += product.quantity * product.sellingPrice;
    });
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
        const profit = stats.selling - stats.cost;
        csvContent += `"${category}",${stats.count},${stats.stock},₱${stats.cost.toFixed(2)},₱${stats.selling.toFixed(2)},₱${profit.toFixed(2)}\n`;
    });
    
    csvContent += "\nDETAILED PRODUCT INVENTORY\n";
    csvContent += "Product Name,Category,Barcode,Current Stock,Original Price,Selling Price,Stock Value,Profit Per Unit,Total Potential Profit,Total Sold,Revenue Generated,Stock Status,Days Since Created\n";
    
    products.forEach(product => {
        const stockValue = product.quantity * product.sellingPrice;
        const profitPerUnit = product.sellingPrice - product.originalPrice;
        const totalPotentialProfit = product.quantity * profitPerUnit;
        const totalSold = product.totalSold || 0;
        const revenueGenerated = totalSold * product.sellingPrice;
        const stockStatus = product.quantity === 0 ? 'Out of Stock' : 
                          product.quantity <= settings.lowStockThreshold ? 'Low Stock' : 'In Stock';
        const daysCreated = product.createdDate ? 
            Math.floor((Date.now() - new Date(product.createdDate)) / (1000 * 60 * 60 * 24)) : 'N/A';
        
        csvContent += `"${product.name}","${product.category || 'Other'}","${product.barcode || 'N/A'}",${product.quantity},₱${product.originalPrice.toFixed(2)},₱${product.sellingPrice.toFixed(2)},₱${stockValue.toFixed(2)},₱${profitPerUnit.toFixed(2)},₱${totalPotentialProfit.toFixed(2)},${totalSold},₱${revenueGenerated.toFixed(2)},"${stockStatus}",${daysCreated}\n`;
    });
    
    // Stock Alerts
    csvContent += "\nSTOCK ALERTS\n";
    csvContent += "Alert Type,Product Name,Current Stock,Recommended Action\n";
    products.forEach(product => {
        if (product.quantity === 0) {
            csvContent += `"Out of Stock","${product.name}",${product.quantity},"Immediate Restocking Required"\n`;
        } else if (product.quantity <= 2) {
            csvContent += `"Critical Stock","${product.name}",${product.quantity},"Urgent Restocking Needed"\n`;
        } else if (product.quantity <= settings.lowStockThreshold) {
            csvContent += `"Low Stock","${product.name}",${product.quantity},"Schedule Restocking"\n`;
        }
    });
    
    downloadCSV(csvContent, `complete-inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportAllData() {
    const backup = {
        products,
        sales,
        priceHistory,
        restockHistory,
        settings,
        exportDate: new Date().toISOString(),
        totalProducts: products.length,
        totalSales: sales.length,
        systemVersion: "Mini Store Management v2.0"
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `complete-store-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    
    alert(`✅ Complete backup exported successfully!\n\n📊 Backup includes:\n• ${backup.totalProducts} products\n• ${backup.totalSales} sales records\n• Price history\n• Restock history\n• System settings`);
}

// Helper function for monthly calculations
function calculateMonthlyStats(monthlySales) {
    const totalRevenue = monthlySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = monthlySales.reduce((sum, sale) => {
        return sum + ((sale.unitPrice - sale.originalPrice) * sale.quantity);
    }, 0);
    const totalItemsSold = monthlySales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalTransactions = monthlySales.length;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Daily breakdown
    const dailyBreakdown = {};
    monthlySales.forEach(sale => {
        const date = new Date(sale.date).toLocaleDateString();
        if (!dailyBreakdown[date]) {
            dailyBreakdown[date] = { revenue: 0, profit: 0, itemsSold: 0, transactions: 0 };
        }
        dailyBreakdown[date].revenue += sale.totalAmount;
        dailyBreakdown[date].profit += (sale.unitPrice - sale.originalPrice) * sale.quantity;
        dailyBreakdown[date].itemsSold += sale.quantity;
        dailyBreakdown[date].transactions += 1;
    });
    
    // Top products
    const productStats = {};
    monthlySales.forEach(sale => {
        if (!productStats[sale.productName]) {
            productStats[sale.productName] = { quantitySold: 0, revenue: 0, profit: 0 };
        }
        productStats[sale.productName].quantitySold += sale.quantity;
        productStats[sale.productName].revenue += sale.totalAmount;
        productStats[sale.productName].profit += (sale.unitPrice - sale.originalPrice) * sale.quantity;
    });
    
    const topProducts = Object.entries(productStats)
        .map(([name, stats]) => ({
            name,
            ...stats,
            profitMargin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    return {
        totalRevenue,
        totalProfit,
        totalItemsSold,
        totalTransactions,
        avgTransactionValue,
        profitMargin,
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, stats]) => ({ date, ...stats })),
        topProducts
    };
}

function generateMonthlyReportCSV(monthlySales, month) {
    let csv = `Monthly Sales Report - ${month}\n\n`;
    csv += 'Date,Product,Quantity,Unit Price,Total Amount,Profit\n';
    
    monthlySales.forEach(sale => {
        const profit = (sale.unitPrice - sale.originalPrice) * sale.quantity;
        csv += `"${sale.date}","${sale.productName}",${sale.quantity},${sale.unitPrice},${sale.totalAmount},${profit.toFixed(2)}\n`;
    });
    
    return csv;
}

function generateInventoryCSV() {
    let csv = 'Product Inventory Report\n\n';
    csv += 'Product Name,Current Stock,Original Price,Selling Price,Total Value,Stock Status\n';
    
    products.forEach(product => {
        const totalValue = product.quantity * product.sellingPrice;
        const stockStatus = product.quantity <= settings.lowStockThreshold ? 'Low Stock' : 
                           product.quantity === 0 ? 'Out of Stock' : 'In Stock';
        csv += `"${product.name}",${product.quantity},${product.originalPrice},${product.sellingPrice},${totalValue.toFixed(2)},${stockStatus}\n`;
    });
    
    return csv;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// Settings management
function loadSettings() {
    document.getElementById('low-stock-threshold').value = settings.lowStockThreshold;
    document.getElementById('reorder-suggestions').checked = settings.reorderSuggestions;
}

function saveSettings() {
    saveToStorage('settings', settings);
}

// Restocking Functions
function initializeRestocking() {
    console.log('🔄 Initializing Restocking...');
    setupRestockingEventListeners();
    loadRestockProductDropdowns();
    loadRestockHistory();
    updateRestockHistory();
    console.log('✅ Restocking initialized successfully!');
}

function setupRestockingEventListeners() {
    // Restock form
    const restockForm = document.getElementById('restock-form');
    if (restockForm) {
        restockForm.addEventListener('submit', handleRestockSubmit);
    }
    
    // Product selection for restocking
    const restockSelect = document.getElementById('restock-product-select');
    if (restockSelect) {
        restockSelect.addEventListener('change', updateCurrentProductInfo);
    }
    
    // Price history product selection
    const priceHistorySelect = document.getElementById('price-history-product');
    if (priceHistorySelect) {
        priceHistorySelect.addEventListener('change', displayPriceHistory);
    }
    
    // Bulk operations
    const bulkRestockBtn = document.getElementById('bulk-restock-low-stock');
    if (bulkRestockBtn) {
        bulkRestockBtn.addEventListener('click', bulkRestockLowStock);
    }
}

function loadRestockProductDropdowns() {
    console.log('📦 Loading restock product dropdowns...');
    console.log('📋 Current products array:', products);
    
    const restockSelect = document.getElementById('restock-product-select');
    const priceHistorySelect = document.getElementById('price-history-product');
    
    if (!restockSelect) {
        console.error('❌ restock-product-select element not found');
        return;
    }
    
    if (!priceHistorySelect) {
        console.error('❌ price-history-product element not found');
        return;
    }
    
    console.log('✅ Both dropdown elements found');
    console.log('📋 Products available:', products.length);
    
    // Clear existing options
    restockSelect.innerHTML = '<option value="">-- Select Product to Restock --</option>';
    priceHistorySelect.innerHTML = '<option value="">-- Select Product --</option>';
    
    if (products.length === 0) {
        console.log('⚠️ No products available to populate dropdowns');
        return;
    }
    
    products.forEach(product => {
        console.log('Adding product to dropdown:', product.name);
        
        // Restock dropdown
        const restockOption = document.createElement('option');
        restockOption.value = product.id;
        restockOption.textContent = `${product.name} (Current: ${product.quantity})`;
        restockSelect.appendChild(restockOption);
        
        // Price history dropdown
        const priceOption = document.createElement('option');
        priceOption.value = product.id;
        priceOption.textContent = product.name;
        priceHistorySelect.appendChild(priceOption);
    });
    
    console.log('✅ Dropdowns populated with', products.length, 'products');
    console.log('Restock dropdown now has', restockSelect.options.length, 'options');
}

function updateCurrentProductInfo() {
    const selectedProductId = parseInt(document.getElementById('restock-product-select').value);
    const infoDiv = document.getElementById('current-product-info');
    
    if (!selectedProductId) {
        infoDiv.style.display = 'none';
        return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (product) {
        document.getElementById('current-stock').textContent = product.quantity;
        document.getElementById('current-selling-price').textContent = product.sellingPrice.toFixed(2);
        document.getElementById('current-original-price').textContent = product.originalPrice.toFixed(2);
        infoDiv.style.display = 'block';
        
        // Pre-fill current prices
        document.getElementById('new-original-price').placeholder = `Current: ₱${product.originalPrice.toFixed(2)}`;
        document.getElementById('new-selling-price').placeholder = `Current: ₱${product.sellingPrice.toFixed(2)}`;
    }
}

function handleRestockSubmit(e) {
    e.preventDefault();
    
    const selectedProductId = parseInt(document.getElementById('restock-product-select').value);
    const quantity = parseInt(document.getElementById('restock-quantity').value);
    const newOriginalPrice = parseFloat(document.getElementById('new-original-price').value);
    const newSellingPrice = parseFloat(document.getElementById('new-selling-price').value);
    const notes = document.getElementById('restock-notes').value.trim();
    
    if (!selectedProductId || !quantity || quantity <= 0) {
        alert('Please select a product and enter a valid quantity.');
        return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
        alert('Selected product not found.');
        return;
    }
    
    // Store original values for history
    const originalStock = product.quantity;
    const originalOriginalPrice = product.originalPrice;
    const originalSellingPrice = product.sellingPrice;
    
    // Update product
    product.quantity += quantity;
    
    let priceChanges = [];
    
    // Update prices if provided
    if (!isNaN(newOriginalPrice) && newOriginalPrice > 0) {
        // Record price history
        recordPriceChange(product.id, product.name, originalOriginalPrice, originalSellingPrice, 
                         newOriginalPrice, product.sellingPrice, 'Restock - Original Price Update', originalStock);
        
        product.originalPrice = newOriginalPrice;
        priceChanges.push(`Original: ₱${originalOriginalPrice.toFixed(2)} → ₱${newOriginalPrice.toFixed(2)}`);
    }
    
    if (!isNaN(newSellingPrice) && newSellingPrice > 0) {
        // Record price history
        recordPriceChange(product.id, product.name, product.originalPrice, originalSellingPrice, 
                         product.originalPrice, newSellingPrice, 'Restock - Selling Price Update', originalStock);
        
        product.sellingPrice = newSellingPrice;
        priceChanges.push(`Selling: ₱${originalSellingPrice.toFixed(2)} → ₱${newSellingPrice.toFixed(2)}`);
    }
    
    // Record restock history
    const restockRecord = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        productId: product.id,
        productName: product.name,
        quantityAdded: quantity,
        priceChanges: priceChanges.length > 0 ? priceChanges.join(', ') : 'No price changes',
        notes: notes || 'No notes',
        stockAfter: product.quantity,
        originalPrice: product.originalPrice,
        sellingPrice: product.sellingPrice
    };
    
    restockHistory.push(restockRecord);
    
    // Save data
    saveProducts();
    saveRestockHistory();
    savePriceHistory();
    
    // Update displays
    loadProducts();
    loadRestockProductDropdowns();
    loadRestockHistory();
    updateCurrentProductInfo();
    
    // Reset form
    document.getElementById('restock-form').reset();
    document.getElementById('current-product-info').style.display = 'none';
    
    alert(`Successfully restocked ${product.name}!\nAdded: ${quantity} units\nNew stock: ${product.quantity}\n${priceChanges.length > 0 ? 'Price changes: ' + priceChanges.join(', ') : ''}`);
}

function recordPriceChange(productId, productName, oldOriginalPrice, oldSellingPrice, newOriginalPrice, newSellingPrice, reason, stockAtTime) {
    const priceRecord = {
        id: Date.now() + Math.random(), // Ensure unique ID
        date: new Date().toLocaleString(),
        productId: productId,
        productName: productName,
        oldOriginalPrice: oldOriginalPrice,
        oldSellingPrice: oldSellingPrice,
        newOriginalPrice: newOriginalPrice,
        newSellingPrice: newSellingPrice,
        oldMargin: ((oldSellingPrice - oldOriginalPrice) / oldSellingPrice) * 100,
        newMargin: ((newSellingPrice - newOriginalPrice) / newSellingPrice) * 100,
        reason: reason,
        stockAtTime: stockAtTime
    };
    
    priceHistory.push(priceRecord);
}

function displayPriceHistory() {
    const selectedProductId = parseInt(document.getElementById('price-history-product').value);
    const contentDiv = document.getElementById('price-history-content');
    
    if (!selectedProductId) {
        contentDiv.style.display = 'none';
        return;
    }
    
    const product = products.find(p => p.id === selectedProductId);
    const productPriceHistory = priceHistory.filter(ph => ph.productId === selectedProductId);
    
    if (!product) return;
    
    contentDiv.style.display = 'block';
    
    // Update price history table
    const tbody = document.querySelector('#price-history-table tbody');
    tbody.innerHTML = '';
    
    if (productPriceHistory.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No price history available for this product</td>';
        tbody.appendChild(row);
    } else {
        productPriceHistory.slice().reverse().forEach(history => {
            const row = document.createElement('tr');
            
            const marginChange = history.newMargin - history.oldMargin;
            let marginClass = '';
            let marginText = `${history.newMargin.toFixed(1)}%`;
            
            if (marginChange > 0) {
                marginClass = 'price-increase';
                marginText += ` (+${marginChange.toFixed(1)}%)`;
            } else if (marginChange < 0) {
                marginClass = 'price-decrease';
                marginText += ` (${marginChange.toFixed(1)}%)`;
            }
            
            row.innerHTML = `
                <td>${history.date}</td>
                <td>₱${history.oldOriginalPrice.toFixed(2)} → ₱${history.newOriginalPrice.toFixed(2)}</td>
                <td>₱${history.oldSellingPrice.toFixed(2)} → ₱${history.newSellingPrice.toFixed(2)}</td>
                <td class="${marginClass}">${marginText}</td>
                <td>${history.reason}</td>
                <td>${history.stockAtTime}</td>
            `;
            tbody.appendChild(row);
        });
    }
    
    // Draw price chart
    drawPriceChart(product, productPriceHistory);
}

function drawPriceChart(product, priceHistory) {
    const canvas = document.getElementById('price-chart-canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    if (priceHistory.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No price history to display', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Prepare data
    const dataPoints = priceHistory.map(h => ({
        date: new Date(h.date),
        sellingPrice: h.newSellingPrice,
        originalPrice: h.newOriginalPrice
    }));
    
    // Add current price as the latest point
    dataPoints.push({
        date: new Date(),
        sellingPrice: product.sellingPrice,
        originalPrice: product.originalPrice
    });
    
    // Sort by date
    dataPoints.sort((a, b) => a.date - b.date);
    
    // Chart dimensions
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    
    // Find min and max values
    const allPrices = [...dataPoints.map(d => d.sellingPrice), ...dataPoints.map(d => d.originalPrice)];
    const minPrice = Math.min(...allPrices) * 0.9;
    const maxPrice = Math.max(...allPrices) * 1.1;
    
    const minDate = dataPoints[0].date;
    const maxDate = dataPoints[dataPoints.length - 1].date;
    const dateRange = maxDate - minDate || 1;
    
    // Helper function to get coordinates
    function getCoordinates(date, price) {
        const x = padding + ((date - minDate) / dateRange) * chartWidth;
        const y = padding + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;
        return { x, y };
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
    }
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
        const x = padding + (i / 5) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
    
    // Draw price lines
    if (dataPoints.length > 1) {
        // Selling price line
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        dataPoints.forEach((point, index) => {
            const coords = getCoordinates(point.date, point.sellingPrice);
            if (index === 0) {
                ctx.moveTo(coords.x, coords.y);
            } else {
                ctx.lineTo(coords.x, coords.y);
            }
        });
        ctx.stroke();
        
        // Original price line
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        dataPoints.forEach((point, index) => {
            const coords = getCoordinates(point.date, point.originalPrice);
            if (index === 0) {
                ctx.moveTo(coords.x, coords.y);
            } else {
                ctx.lineTo(coords.x, coords.y);
            }
        });
        ctx.stroke();
    }
    
    // Draw points
    dataPoints.forEach(point => {
        // Selling price point
        const sellingCoords = getCoordinates(point.date, point.sellingPrice);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(sellingCoords.x, sellingCoords.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        // Original price point
        const originalCoords = getCoordinates(point.date, point.originalPrice);
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(originalCoords.x, originalCoords.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Add labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    
    // Y-axis labels (prices)
    for (let i = 0; i <= 5; i++) {
        const price = maxPrice - (i / 5) * (maxPrice - minPrice);
        const y = padding + (i / 5) * chartHeight;
        ctx.textAlign = 'right';
        ctx.fillText(`₱${price.toFixed(2)}`, padding - 10, y + 3);
    }
    
    // Legend
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3498db';
    ctx.fillRect(padding + 10, 15, 15, 3);
    ctx.fillStyle = '#666';
    ctx.fillText('Selling Price', padding + 30, 20);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(padding + 120, 15, 15, 3);
    ctx.fillStyle = '#666';
    ctx.fillText('Original Price', padding + 140, 20);
}

function loadRestockHistory() {
    const tbody = document.querySelector('#restock-history-table tbody');
    tbody.innerHTML = '';
    
    if (restockHistory.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No restocking history available</td>';
        tbody.appendChild(row);
        return;
    }
    
    restockHistory.slice().reverse().forEach(restock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${restock.date}</td>
            <td>${restock.productName}</td>
            <td>+${restock.quantityAdded}</td>
            <td>${restock.priceChanges}</td>
            <td>${restock.notes}</td>
            <td>${restock.stockAfter}</td>
        `;
        tbody.appendChild(row);
    });
}

// Bulk operations
function bulkRestockLowStock() {
    const lowStockProducts = products.filter(p => p.quantity <= settings.lowStockThreshold);
    
    if (lowStockProducts.length === 0) {
        alert('No products currently have low stock.');
        return;
    }
    
    const suggestions = generateReorderSuggestions();
    let restockList = 'The following products will be restocked:\n\n';
    
    suggestions.forEach(suggestion => {
        restockList += `${suggestion.product.name}: +${suggestion.suggestedQuantity} units\n`;
    });
    
    if (confirm(restockList + '\nProceed with bulk restock?')) {
        let restockedCount = 0;
        
        suggestions.forEach(suggestion => {
            const product = suggestion.product;
            const originalStock = product.quantity;
            
            product.quantity += suggestion.suggestedQuantity;
            
            // Record restock history
            const restockRecord = {
                id: Date.now() + restockedCount,
                date: new Date().toLocaleString(),
                productId: product.id,
                productName: product.name,
                quantityAdded: suggestion.suggestedQuantity,
                priceChanges: 'No price changes',
                notes: 'Bulk restock - Auto suggestion',
                stockAfter: product.quantity,
                originalPrice: product.originalPrice,
                sellingPrice: product.sellingPrice
            };
            
            restockHistory.push(restockRecord);
            restockedCount++;
        });
        
        saveProducts();
        saveRestockHistory();
        loadProducts();
        loadRestockProductDropdowns();
        loadRestockHistory();
        
        alert(`Successfully restocked ${restockedCount} products!`);
    }
}

function showBulkPriceUpdateModal() {
    // Create modal for bulk price updates
    const modal = createModal('Bulk Price Update', `
        <form id="bulk-price-form">
            <div class="form-group">
                <label for="price-adjustment-type">Adjustment Type:</label>
                <select id="price-adjustment-type" required>
                    <option value="">-- Select Adjustment Type --</option>
                    <option value="percentage">Percentage Increase/Decrease</option>
                    <option value="fixed">Fixed Amount Increase/Decrease</option>
                    <option value="margin">Target Margin Percentage</option>
                </select>
            </div>
            <div class="form-group">
                <label for="adjustment-value">Value:</label>
                <input type="number" id="adjustment-value" step="0.01" required>
                <small id="adjustment-help">Select adjustment type for help</small>
            </div>
            <div class="form-group">
                <label for="apply-to">Apply To:</label>
                <select id="apply-to" required>
                    <option value="all">All Products</option>
                    <option value="low-stock">Low Stock Products Only</option>
                    <option value="high-stock">High Stock Products Only</option>
                </select>
            </div>
            <button type="submit">Preview Changes</button>
        </form>
        <div id="bulk-preview" style="display: none; margin-top: 20px;">
            <h4>Preview Changes:</h4>
            <table id="bulk-preview-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Current Price</th>
                        <th>New Price</th>
                        <th>Change</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
            <button id="apply-bulk-changes" style="margin-top: 15px;">Apply Changes</button>
        </div>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // Handle form submission for preview
    document.getElementById('bulk-price-form').addEventListener('submit', function(e) {
        e.preventDefault();
        previewBulkPriceChanges();
    });
    
    // Help text updates
    document.getElementById('price-adjustment-type').addEventListener('change', function() {
        const helpText = document.getElementById('adjustment-help');
        const value = this.value;
        
        switch(value) {
            case 'percentage':
                helpText.textContent = 'Enter percentage (e.g., 10 for 10% increase, -5 for 5% decrease)';
                break;
            case 'fixed':
                helpText.textContent = 'Enter fixed amount (e.g., 2.50 to add $2.50, -1.00 to subtract $1.00)';
                break;
            case 'margin':
                helpText.textContent = 'Enter target margin percentage (e.g., 25 for 25% profit margin)';
                break;
            default:
                helpText.textContent = 'Select adjustment type for help';
        }
    });
}

function previewBulkPriceChanges() {
    const adjustmentType = document.getElementById('price-adjustment-type').value;
    const adjustmentValue = parseFloat(document.getElementById('adjustment-value').value);
    const applyTo = document.getElementById('apply-to').value;
    
    let targetProducts = [];
    
    switch(applyTo) {
        case 'all':
            targetProducts = [...products];
            break;
        case 'low-stock':
            targetProducts = products.filter(p => p.quantity <= settings.lowStockThreshold);
            break;
        case 'high-stock':
            targetProducts = products.filter(p => p.quantity > settings.lowStockThreshold * 3);
            break;
    }
    
    const changes = [];
    
    targetProducts.forEach(product => {
        let newPrice = product.sellingPrice;
        
        switch(adjustmentType) {
            case 'percentage':
                newPrice = product.sellingPrice * (1 + adjustmentValue / 100);
                break;
            case 'fixed':
                newPrice = product.sellingPrice + adjustmentValue;
                break;
            case 'margin':
                newPrice = product.originalPrice / (1 - adjustmentValue / 100);
                break;
        }
        
        if (newPrice > 0) {
            changes.push({
                product: product,
                oldPrice: product.sellingPrice,
                newPrice: newPrice,
                change: newPrice - product.sellingPrice
            });
        }
    });
    
    // Display preview
    const previewDiv = document.getElementById('bulk-preview');
    const tbody = document.querySelector('#bulk-preview-table tbody');
    tbody.innerHTML = '';
    
    changes.forEach(change => {
        const row = document.createElement('tr');
        const changeClass = change.change > 0 ? 'price-increase' : change.change < 0 ? 'price-decrease' : 'price-stable';
        const changeText = change.change > 0 ? `+₱${change.change.toFixed(2)}` : `₱${change.change.toFixed(2)}`;
        
        row.innerHTML = `
            <td>${change.product.name}</td>
            <td>${formatPeso(change.oldPrice)}</td>
            <td>${formatPeso(change.newPrice)}</td>
            <td class="${changeClass}">${changeText}</td>
        `;
        tbody.appendChild(row);
    });
    
    previewDiv.style.display = 'block';
    
    // Handle apply changes
    document.getElementById('apply-bulk-changes').onclick = function() {
        applyBulkPriceChanges(changes);
    };
}

function applyBulkPriceChanges(changes) {
    if (confirm(`Apply price changes to ${changes.length} products?`)) {
        changes.forEach(change => {
            // Record price history
            recordPriceChange(
                change.product.id,
                change.product.name,
                change.product.originalPrice,
                change.oldPrice,
                change.product.originalPrice,
                change.newPrice,
                'Bulk Price Update',
                change.product.quantity
            );
            
            // Update product price
            change.product.sellingPrice = change.newPrice;
        });
        
        // Save data
        saveProducts();
        savePriceHistory();
        
        // Update displays
        loadProducts();
        
        // Close modal
        document.querySelector('.modal').remove();
        
        alert(`Successfully updated prices for ${changes.length} products!`);
    }
}

// Simplified supplier management - removed for cleaner restocking
function loadSuppliers() {
    // Supplier functionality removed - no longer needed
    console.log('Supplier functionality disabled');
}

function showAddSupplierModal() {
    const modal = createModal('Add New Supplier', `
        <form id="add-supplier-form">
            <div class="form-group">
                <label for="supplier-name">Supplier Name:</label>
                <input type="text" id="supplier-name" required>
            </div>
            <div class="form-group">
                <label for="supplier-contact">Contact Information:</label>
                <textarea id="supplier-contact" placeholder="Phone, email, address..."></textarea>
            </div>
            <div class="form-group">
                <label for="supplier-products">Products Supplied:</label>
                <input type="number" id="supplier-products" value="0" min="0">
            </div>
            <div class="form-group">
                <label for="supplier-lead-time">Average Lead Time (days):</label>
                <input type="number" id="supplier-lead-time" value="7" min="1">
            </div>
            <div class="form-group">
                <label for="supplier-rating">Rating (1-5 stars):</label>
                <select id="supplier-rating">
                    <option value="5">5 Stars - Excellent</option>
                    <option value="4">4 Stars - Good</option>
                    <option value="3" selected>3 Stars - Average</option>
                    <option value="2">2 Stars - Below Average</option>
                    <option value="1">1 Star - Poor</option>
                </select>
            </div>
            <button type="submit">Add Supplier</button>
        </form>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('add-supplier-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const supplier = {
            id: Date.now(),
            name: document.getElementById('supplier-name').value.trim(),
            contact: document.getElementById('supplier-contact').value.trim(),
            productsSupplied: parseInt(document.getElementById('supplier-products').value),
            leadTime: parseInt(document.getElementById('supplier-lead-time').value),
            rating: parseInt(document.getElementById('supplier-rating').value),
            lastRestock: null,
            dateAdded: new Date().toLocaleString()
        };
        
        suppliers.push(supplier);
        saveSuppliers();
        loadSuppliers();
        
        modal.remove();
        alert('Supplier added successfully!');
    });
}

// Utility functions for modals
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h3>${title}</h3>
            ${content}
        </div>
    `;
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close');
    closeBtn.onclick = function() {
        modal.remove();
    };
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.remove();
        }
    };
    
    return modal;
}

// Data persistence functions for new features
function savePriceHistory() {
    localStorage.setItem('priceHistory', JSON.stringify(priceHistory));
}

function saveRestockHistory() {
    localStorage.setItem('restockHistory', JSON.stringify(restockHistory));
}

function saveSuppliers() {
    localStorage.setItem('suppliers', JSON.stringify(suppliers));
}

// Enhanced low stock function
function updateLowStockAlert() {
    const lowStockList = document.getElementById('low-stock-list');
    const lowStockProducts = products.filter(product => 
        product.quantity > 0 && product.quantity <= settings.lowStockThreshold
    );
    
    if (lowStockProducts.length === 0) {
        lowStockList.innerHTML = '<li>No products with low stock</li>';
    } else {
        lowStockList.innerHTML = lowStockProducts
            .map(product => `<li>${product.name} - Only ${product.quantity} left in stock 
                <button onclick="quickRestock(${product.id})" class="quick-restock-btn">Quick Restock</button></li>`)
            .join('');
        
        // Show notification for critically low stock
        const criticallyLow = lowStockProducts.filter(p => p.quantity <= 2);
        if (criticallyLow.length > 0) {
            setTimeout(() => {
                alert(`⚠️ Critical Stock Alert!\n${criticallyLow.map(p => p.name).join(', ')} need immediate restocking.`);
            }, 1000);
        }
    }
}

function quickRestock(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const quantity = prompt(`Quick restock for ${product.name}\nCurrent stock: ${product.quantity}\n\nEnter quantity to add:`);
    
    if (quantity && !isNaN(quantity) && parseInt(quantity) > 0) {
        const addQuantity = parseInt(quantity);
        const originalStock = product.quantity;
        
        product.quantity += addQuantity;
        
        // Record restock history
        const restockRecord = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            productId: product.id,
            productName: product.name,
            quantityAdded: addQuantity,
            priceChanges: 'No price changes',
            notes: 'Quick restock from low stock alert',
            stockAfter: product.quantity,
            originalPrice: product.originalPrice,
            sellingPrice: product.sellingPrice
        };
        
        restockHistory.push(restockRecord);
        
        // Save and update
        saveProducts();
        saveRestockHistory();
        loadProducts();
        loadRestockProductDropdowns();
        updateSummary();
        
        alert(`${product.name} restocked successfully!\nAdded: ${addQuantity} units\nNew stock: ${product.quantity}`);
    }
}

function showSupplierImportModal() {
    const modal = createModal('Import Supplier Data', `
        <div class="import-section">
            <h4>Import from CSV</h4>
            <input type="file" id="csv-file-input" accept=".csv">
            <p><small>CSV should have columns: Product Name, Quantity, Original Price, Selling Price, Supplier</small></p>
            <button id="import-csv" style="margin-top: 10px;">Import CSV</button>
        </div>
        <div class="import-section" style="margin-top: 20px;">
            <h4>Sample CSV Format</h4>
            <pre style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 12px;">
Product Name,Quantity,Original Price,Selling Price,Supplier
Widget A,50,5.00,8.50,Supplier ABC
Widget B,25,10.00,15.99,Supplier XYZ</pre>
        </div>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('import-csv').addEventListener('click', function() {
        const fileInput = document.getElementById('csv-file-input');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('Please select a CSV file first.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                
                let imported = 0;
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                    
                    if (values.length >= 4) {
                        const productName = values[0];
                        const quantity = parseInt(values[1]) || 0;
                        const originalPrice = parseFloat(values[2]) || 0;
                        const sellingPrice = parseFloat(values[3]) || 0;
                        const supplierName = values[4] || 'Unknown Supplier';
                        
                        if (productName && quantity > 0 && originalPrice > 0 && sellingPrice > 0) {
                            // Check if product exists
                            let existingProduct = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
                            
                            if (existingProduct) {
                                // Update existing product
                                existingProduct.quantity += quantity;
                                if (existingProduct.originalPrice !== originalPrice || existingProduct.sellingPrice !== sellingPrice) {
                                    recordPriceChange(
                                        existingProduct.id,
                                        existingProduct.name,
                                        existingProduct.originalPrice,
                                        existingProduct.sellingPrice,
                                        originalPrice,
                                        sellingPrice,
                                        'CSV Import Price Update',
                                        existingProduct.quantity - quantity
                                    );
                                    existingProduct.originalPrice = originalPrice;
                                    existingProduct.sellingPrice = sellingPrice;
                                }
                            } else {
                                // Add new product
                                const newProduct = {
                                    id: Date.now() + i,
                                    name: productName,
                                    quantity: quantity,
                                    originalPrice: originalPrice,
                                    sellingPrice: sellingPrice,
                                    totalSold: 0
                                };
                                products.push(newProduct);
                            }
                            
                            // Record restock
                            const restockRecord = {
                                id: Date.now() + i * 1000,
                                date: new Date().toLocaleString(),
                                productId: existingProduct?.id || (Date.now() + i),
                                productName: productName,
                                quantityAdded: quantity,
                                priceChanges: 'Imported from CSV',
                                notes: `Imported from CSV - Supplier: ${supplierName}`,
                                stockAfter: existingProduct ? existingProduct.quantity : quantity,
                                originalPrice: originalPrice,
                                sellingPrice: sellingPrice
                            };
                            
                            restockHistory.push(restockRecord);
                            imported++;
                        }
                    }
                }
                
                // Save data
                saveProducts();
                saveRestockHistory();
                savePriceHistory();
                
                // Update displays
                loadProducts();
                loadRestockProductDropdowns();
                loadRestockHistory();
                
                modal.remove();
                alert(`Successfully imported ${imported} products!`);
                
            } catch (error) {
                alert('Error parsing CSV file. Please check the format and try again.');
                console.error('CSV Import Error:', error);
            }
        };
        
        reader.readAsText(file);
    });
}

function showManageSuppliersModal() {
    const suppliersHtml = suppliers.map(supplier => `
        <div class="supplier-item" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px;">
            <h4>${supplier.name}</h4>
            <p><strong>Products Supplied:</strong> ${supplier.productsSupplied}</p>
            <p><strong>Lead Time:</strong> ${supplier.leadTime} days</p>
            <p><strong>Rating:</strong> ${'★'.repeat(supplier.rating)}${'☆'.repeat(5 - supplier.rating)}</p>
            <p><strong>Contact:</strong> ${supplier.contact || 'No contact info'}</p>
            <button onclick="editSupplier(${supplier.id})" class="action-button" style="margin-right: 10px;">Edit</button>
            <button onclick="deleteSupplier(${supplier.id})" class="delete-btn">Delete</button>
        </div>
    `).join('');
    
    const modal = createModal('Manage Suppliers', `
        <div class="suppliers-list">
            ${suppliers.length > 0 ? suppliersHtml : '<p>No suppliers added yet.</p>'}
        </div>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function editSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    const modal = createModal('Edit Supplier', `
        <form id="edit-supplier-form">
            <div class="form-group">
                <label for="edit-supplier-name">Supplier Name:</label>
                <input type="text" id="edit-supplier-name" value="${supplier.name}" required>
            </div>
            <div class="form-group">
                <label for="edit-supplier-contact">Contact Information:</label>
                <textarea id="edit-supplier-contact">${supplier.contact || ''}</textarea>
            </div>
            <div class="form-group">
                <label for="edit-supplier-products">Products Supplied:</label>
                <input type="number" id="edit-supplier-products" value="${supplier.productsSupplied}" min="0">
            </div>
            <div class="form-group">
                <label for="edit-supplier-lead-time">Average Lead Time (days):</label>
                <input type="number" id="edit-supplier-lead-time" value="${supplier.leadTime}" min="1">
            </div>
            <div class="form-group">
                <label for="edit-supplier-rating">Rating (1-5 stars):</label>
                <select id="edit-supplier-rating">
                    <option value="5" ${supplier.rating === 5 ? 'selected' : ''}>5 Stars - Excellent</option>
                    <option value="4" ${supplier.rating === 4 ? 'selected' : ''}>4 Stars - Good</option>
                    <option value="3" ${supplier.rating === 3 ? 'selected' : ''}>3 Stars - Average</option>
                    <option value="2" ${supplier.rating === 2 ? 'selected' : ''}>2 Stars - Below Average</option>
                    <option value="1" ${supplier.rating === 1 ? 'selected' : ''}>1 Star - Poor</option>
                </select>
            </div>
            <button type="submit">Update Supplier</button>
        </form>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    document.getElementById('edit-supplier-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        supplier.name = document.getElementById('edit-supplier-name').value.trim();
        supplier.contact = document.getElementById('edit-supplier-contact').value.trim();
        supplier.productsSupplied = parseInt(document.getElementById('edit-supplier-products').value);
        supplier.leadTime = parseInt(document.getElementById('edit-supplier-lead-time').value);
        supplier.rating = parseInt(document.getElementById('edit-supplier-rating').value);
        
        saveSuppliers();
        loadSuppliers();
        
        modal.remove();
        alert('Supplier updated successfully!');
    });
}

function deleteSupplier(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;
    
    if (confirm(`Are you sure you want to delete supplier "${supplier.name}"?`)) {
        suppliers = suppliers.filter(s => s.id !== supplierId);
        saveSuppliers();
        loadSuppliers();
        alert('Supplier deleted successfully!');
    }
}

// Inventory Overview Functions
function initializeInventoryOverview() {
    setupInventoryEventListeners();
    updateInventoryOverview();
}

function setupInventoryEventListeners() {
    // Filter and sort controls
    document.getElementById('stock-filter').addEventListener('change', updateInventoryOverview);
    document.getElementById('sort-by').addEventListener('change', updateInventoryOverview);
    document.getElementById('search-products').addEventListener('input', updateInventoryOverview);
    document.getElementById('refresh-inventory').addEventListener('click', updateInventoryOverview);
    
    // Quick actions
    document.getElementById('restock-all-low').addEventListener('click', bulkRestockLowStock);
    document.getElementById('export-inventory').addEventListener('click', exportInventoryReport);
    document.getElementById('print-inventory').addEventListener('click', printInventory);
    document.getElementById('archive-products').addEventListener('click', archiveOldProducts);
}

function updateInventoryOverview() {
    updateInventoryStats();
    updateDetailedInventoryTable();
    updateStockAlerts();
    drawProductPerformanceChart();
}

function updateInventoryStats() {
    const totalProducts = products.length;
    const totalInventoryValue = products.reduce((sum, product) => {
        return sum + (product.quantity * product.sellingPrice);
    }, 0);
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= settings.lowStockThreshold).length;
    const outOfStockCount = products.filter(p => p.quantity === 0).length;
    
    document.getElementById('total-products-count').textContent = totalProducts;
    document.getElementById('total-inventory-value').textContent = formatPeso(totalInventoryValue);
    document.getElementById('low-stock-count').textContent = lowStockCount;
    document.getElementById('out-of-stock-count').textContent = outOfStockCount;
}

function updateDetailedInventoryTable() {
    const tbody = document.querySelector('#detailed-inventory-table tbody');
    tbody.innerHTML = '';
    
    // Get filter values
    const stockFilter = document.getElementById('stock-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    
    // Filter products
    let filteredProducts = products.filter(product => {
        // Search filter
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Stock status filter
        switch (stockFilter) {
            case 'in-stock':
                return product.quantity > settings.lowStockThreshold;
            case 'low-stock':
                return product.quantity > 0 && product.quantity <= settings.lowStockThreshold;
            case 'out-of-stock':
                return product.quantity === 0;
            default:
                return true;
        }
    });
    
    // Sort products
    filteredProducts.sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'stock-asc':
                return a.quantity - b.quantity;
            case 'stock-desc':
                return b.quantity - a.quantity;
            case 'value-desc':
                return (b.quantity * b.sellingPrice) - (a.quantity * a.sellingPrice);
            case 'margin-desc':
                const marginA = ((a.sellingPrice - a.originalPrice) / a.sellingPrice) * 100;
                const marginB = ((b.sellingPrice - b.originalPrice) / b.sellingPrice) * 100;
                return marginB - marginA;
            default:
                return 0;
        }
    });
    
    if (filteredProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="10">No products match the current filters</td>';
        tbody.appendChild(row);
        return;
    }
    
    filteredProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Calculate values
        const profitMargin = ((product.sellingPrice - product.originalPrice) / product.sellingPrice) * 100;
        const totalValue = product.quantity * product.sellingPrice;
        const totalSold = product.totalSold || 0;
        const revenueGenerated = sales
            .filter(sale => sale.productId === product.id)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);
        
        // Determine stock status
        let stockStatus = 'in-stock';
        let stockStatusText = 'In Stock';
        
        if (product.quantity === 0) {
            stockStatus = 'out-of-stock';
            stockStatusText = 'Out of Stock';
        } else if (product.quantity <= 2) {
            stockStatus = 'critical';
            stockStatusText = 'Critical';
        } else if (product.quantity <= settings.lowStockThreshold) {
            stockStatus = 'low-stock';
            stockStatusText = 'Low Stock';
        }
        
        row.innerHTML = `
            <td><strong>${product.name}</strong></td>
            <td>${product.quantity}</td>
            <td>${formatPeso(product.originalPrice)}</td>
            <td>${formatPeso(product.sellingPrice)}</td>
            <td>${profitMargin.toFixed(1)}%</td>
            <td>${formatPeso(totalValue)}</td>
            <td>${totalSold}</td>
            <td>${formatPeso(revenueGenerated)}</td>
            <td><span class="stock-status ${stockStatus}">${stockStatusText}</span></td>
            <td>
                <div class="edit-actions">
                    <button class="action-button" onclick="editProductInline(${product.id})" style="font-size: 11px; padding: 4px 8px;">Edit</button>
                    <button class="delete-btn" onclick="deleteProduct(${product.id})" style="font-size: 11px; padding: 4px 8px;">Delete</button>
                    <button class="quick-restock-btn" onclick="quickRestock(${product.id})" style="font-size: 11px; padding: 4px 8px;">Restock</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function editProductInline(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const row = event.target.closest('tr');
    const cells = row.querySelectorAll('td');
    
    // Replace cells with input fields
    cells[1].innerHTML = `<input type="number" value="${product.quantity}" id="edit-quantity-${productId}" min="0">`;
    cells[2].innerHTML = `<input type="number" value="${product.originalPrice}" id="edit-original-${productId}" step="0.01" min="0">`;
    cells[3].innerHTML = `<input type="number" value="${product.sellingPrice}" id="edit-selling-${productId}" step="0.01" min="0">`;
    
    // Replace action buttons
    cells[9].innerHTML = `
        <div class="edit-actions">
            <button class="save-btn" onclick="saveProductInline(${productId})">Save</button>
            <button class="cancel-btn" onclick="cancelEditInline()">Cancel</button>
        </div>
    `;
}

function saveProductInline(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newQuantity = parseInt(document.getElementById(`edit-quantity-${productId}`).value);
    const newOriginalPrice = parseFloat(document.getElementById(`edit-original-${productId}`).value);
    const newSellingPrice = parseFloat(document.getElementById(`edit-selling-${productId}`).value);
    
    if (isNaN(newQuantity) || isNaN(newOriginalPrice) || isNaN(newSellingPrice) ||
        newQuantity < 0 || newOriginalPrice < 0 || newSellingPrice < 0) {
        alert('Please enter valid values.');
        return;
    }
    
    // Track price changes
    if (product.originalPrice !== newOriginalPrice || product.sellingPrice !== newSellingPrice) {
        recordPriceChange(
            product.id,
            product.name,
            product.originalPrice,
            product.sellingPrice,
            newOriginalPrice,
            newSellingPrice,
            'Inline Edit from Inventory',
            product.quantity
        );
    }
    
    // Update product
    product.quantity = newQuantity;
    product.originalPrice = newOriginalPrice;
    product.sellingPrice = newSellingPrice;
    
    // Save and refresh
    saveProducts();
    savePriceHistory();
    loadProducts();
    updateInventoryOverview();
    
    alert('Product updated successfully!');
}

function cancelEditInline() {
    updateInventoryOverview();
}

function updateStockAlerts() {
    const criticalList = document.getElementById('critical-stock-list');
    const warningList = document.getElementById('warning-stock-list');
    const outOfStockList = document.getElementById('out-of-stock-list');
    
    const criticalStock = products.filter(p => p.quantity > 0 && p.quantity <= 2);
    const warningStock = products.filter(p => p.quantity > 2 && p.quantity <= settings.lowStockThreshold);
    const outOfStock = products.filter(p => p.quantity === 0);
    
    // Update critical stock
    if (criticalStock.length === 0) {
        criticalList.innerHTML = '<li>No critical stock items</li>';
        document.querySelector('.alert-section:first-child').classList.remove('critical-alert');
    } else {
        criticalList.innerHTML = criticalStock.map(p => 
            `<li>${p.name} - Only ${p.quantity} left! <button class="quick-restock-btn" onclick="quickRestock(${p.id})">Quick Restock</button></li>`
        ).join('');
        document.querySelector('.alert-section:first-child').classList.add('critical-alert');
    }
    
    // Update warning stock
    if (warningStock.length === 0) {
        warningList.innerHTML = '<li>No low stock warnings</li>';
    } else {
        warningList.innerHTML = warningStock.map(p => 
            `<li>${p.name} - ${p.quantity} remaining <button class="quick-restock-btn" onclick="quickRestock(${p.id})">Quick Restock</button></li>`
        ).join('');
    }
    
    // Update out of stock
    if (outOfStock.length === 0) {
        outOfStockList.innerHTML = '<li>No out of stock items</li>';
    } else {
        outOfStockList.innerHTML = outOfStock.map(p => 
            `<li>${p.name} - Out of Stock <button class="quick-restock-btn" onclick="quickRestock(${p.id})">Restock Now</button></li>`
        ).join('');
    }
}

function drawProductPerformanceChart() {
    const canvas = document.getElementById('performance-chart-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get top 10 products by total value
    const topProducts = products
        .map(product => ({
            name: product.name,
            value: product.quantity * product.sellingPrice,
            quantity: product.quantity,
            revenue: sales.filter(s => s.productId === product.id).reduce((sum, sale) => sum + sale.totalAmount, 0)
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
    
    if (topProducts.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('No products to display', canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Chart settings
    const padding = 60;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;
    const barWidth = chartWidth / topProducts.length;
    const maxValue = Math.max(...topProducts.map(p => p.value));
    
    // Draw bars
    topProducts.forEach((product, index) => {
        const barHeight = (product.value / maxValue) * chartHeight;
        const x = padding + index * barWidth;
        const y = padding + chartHeight - barHeight;
        
        // Draw bar
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
        
        // Draw value on top of bar
        ctx.fillStyle = '#2c3e50';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(formatPeso(product.value), x + barWidth/2, y - 5);
        
        // Draw product name at bottom (rotated)
        ctx.save();
        ctx.translate(x + barWidth/2, padding + chartHeight + 15);
        ctx.rotate(-Math.PI/4);
        ctx.textAlign = 'right';
        ctx.fillText(product.name.length > 15 ? product.name.substring(0, 12) + '...' : product.name, 0, 0);
        ctx.restore();
    });
    
    // Draw title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Top Products by Inventory Value', canvas.width / 2, 30);
    
    // Draw y-axis labels
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = padding + chartHeight - (chartHeight / 5) * i;
        ctx.fillText(formatPeso(value), padding - 10, y + 3);
        
        // Draw grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
    }
}

function printInventory() {
    const printWindow = window.open('', '_blank');
    const inventoryData = generateInventoryPrintData();
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inventory Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .header { text-align: center; margin-bottom: 30px; }
                .summary { margin: 20px 0; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Inventory Report</h1>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <h3>Summary</h3>
                <p>Total Products: ${products.length}</p>
                <p>Total Inventory Value: ${formatPeso(products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0))}</p>
                <p>Low Stock Items: ${products.filter(p => p.quantity > 0 && p.quantity <= settings.lowStockThreshold).length}</p>
            </div>
            
            ${inventoryData}
            
            <button class="no-print" onclick="window.print()">Print</button>
            <button class="no-print" onclick="window.close()">Close</button>
        </body>
        </html>
    `);
}

function generateInventoryPrintData() {
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Stock</th>
                    <th>Original Price</th>
                    <th>Selling Price</th>
                    <th>Margin %</th>
                    <th>Total Value</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach(product => {
        const margin = ((product.sellingPrice - product.originalPrice) / product.sellingPrice) * 100;
        const totalValue = product.quantity * product.sellingPrice;
        
        let status = 'In Stock';
        if (product.quantity === 0) status = 'Out of Stock';
        else if (product.quantity <= 2) status = 'Critical';
        else if (product.quantity <= settings.lowStockThreshold) status = 'Low Stock';
        
        html += `
            <tr>
                <td>${product.name}</td>
                <td>${product.quantity}</td>
                <td>${formatPeso(product.originalPrice)}</td>
                <td>${formatPeso(product.sellingPrice)}</td>
                <td>${margin.toFixed(1)}%</td>
                <td>${formatPeso(totalValue)}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    return html;
}

function archiveOldProducts() {
    const oldProducts = products.filter(product => {
        const lastSale = sales
            .filter(sale => sale.productId === product.id)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (!lastSale) return true; // No sales ever
        
        const daysSinceLastSale = (new Date() - new Date(lastSale.date)) / (1000 * 60 * 60 * 24);
        return daysSinceLastSale > 90; // No sales in 90 days
    });
    
    if (oldProducts.length === 0) {
        alert('No products found that qualify for archiving (no sales in 90+ days).');
        return;
    }
    
    const archiveList = oldProducts.map(p => `• ${p.name} (Stock: ${p.quantity})`).join('\n');
    
    if (confirm(`Archive ${oldProducts.length} old products?\n\n${archiveList}\n\nThese products have had no sales in 90+ days. This action can be undone.`)) {
        // Move to archived products (could be localStorage or just remove)
        const archivedProducts = JSON.parse(localStorage.getItem('archivedProducts')) || [];
        archivedProducts.push(...oldProducts.map(p => ({ ...p, archivedDate: new Date().toISOString() })));
        localStorage.setItem('archivedProducts', JSON.stringify(archivedProducts));
        
        // Remove from active products
        oldProducts.forEach(product => {
            products = products.filter(p => p.id !== product.id);
        });
        
        saveProducts();
        loadProducts();
        updateInventoryOverview();
        
        alert(`Successfully archived ${oldProducts.length} products. They can be restored from the archived products section if needed.`);
    }
}

function bulkRestockLowStock() {
    const lowStockProducts = products.filter(p => 
        p.quantity <= settings.lowStockThreshold && p.quantity >= 0
    );
    
    if (lowStockProducts.length === 0) {
        alert('No low stock products found.');
        return;
    }
    
    const restockAmount = prompt(`Restock quantity for each of the ${lowStockProducts.length} low stock items:`, '10');
    if (!restockAmount || isNaN(restockAmount) || parseInt(restockAmount) <= 0) {
        return;
    }
    
    const amount = parseInt(restockAmount);
    
    lowStockProducts.forEach(product => {
        const oldQuantity = product.quantity;
        product.quantity += amount;
        
        // Record restock
        restockHistory.push({
            id: Date.now() + Math.random(),
            productId: product.id,
            productName: product.name,
            date: new Date().toISOString(),
            quantityAdded: amount,
            previousQuantity: oldQuantity,
            newQuantity: product.quantity,
            totalCost: amount * product.originalPrice,
            unitCost: product.originalPrice,
            reason: 'Bulk Restock - Low Stock',
            supplier: 'Various'
        });
    });
    
    saveProducts();
    saveRestockHistory();
    loadProducts();
    updateInventoryOverview();
    
    alert(`Successfully restocked ${lowStockProducts.length} products with ${amount} units each.`);
}

function quickRestock(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const currentStock = product.quantity;
    const suggestedAmount = currentStock === 0 ? 20 : Math.max(10, settings.lowStockThreshold + 10);
    
    const restockAmount = prompt(
        `Restock ${product.name}\nCurrent Stock: ${currentStock}\nSuggested Restock: ${suggestedAmount}`,
        suggestedAmount
    );
    
    if (!restockAmount || isNaN(restockAmount) || parseInt(restockAmount) <= 0) {
        return;
    }
    
    const amount = parseInt(restockAmount);
    const oldQuantity = product.quantity;
    product.quantity += amount;
    
    // Record restock
    restockHistory.push({
        id: Date.now() + Math.random(),
        productId: product.id,
        productName: product.name,
        date: new Date().toISOString(),
        quantityAdded: amount,
        previousQuantity: oldQuantity,
        newQuantity: product.quantity,
        totalCost: amount * product.originalPrice,
        unitCost: product.originalPrice,
        reason: 'Quick Restock',
        supplier: 'Default'
    });
    
    saveProducts();
    saveRestockHistory();
    loadProducts();
    updateInventoryOverview();
    
    alert(`Successfully restocked ${product.name}. Added ${amount} units.`);
}

function exportInventoryReport() {
    const reportData = generateInventoryReportData();
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Product Name,Stock Quantity,Original Price,Selling Price,Profit Margin %,Total Value,Total Sold,Revenue Generated,Stock Status\n";
    
    products.forEach(product => {
        const margin = ((product.sellingPrice - product.originalPrice) / product.sellingPrice) * 100;
        const totalValue = product.quantity * product.sellingPrice;
        const totalSold = product.totalSold || 0;
        const revenue = sales
            .filter(sale => sale.productId === product.id)
            .reduce((sum, sale) => sum + sale.totalAmount, 0);
        
        let status = 'In Stock';
        if (product.quantity === 0) status = 'Out of Stock';
        else if (product.quantity <= 2) status = 'Critical';
        else if (product.quantity <= settings.lowStockThreshold) status = 'Low Stock';
        
        csvContent += `"${product.name}",${product.quantity},"₱${product.originalPrice}","₱${product.sellingPrice}","${margin.toFixed(1)}%","₱${totalValue}",${totalSold},"₱${revenue}","${status}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    alert('Inventory report exported successfully!');
}

function generateInventoryReportData() {
    return {
        generated: new Date().toISOString(),
        summary: {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.quantity * p.sellingPrice), 0),
            lowStockCount: products.filter(p => p.quantity > 0 && p.quantity <= settings.lowStockThreshold).length,
            outOfStockCount: products.filter(p => p.quantity === 0).length
        },
        products: products.map(product => ({
            ...product,
            margin: ((product.sellingPrice - product.originalPrice) / product.sellingPrice) * 100,
            totalValue: product.quantity * product.sellingPrice,
            totalSold: product.totalSold || 0,
            revenue: sales.filter(s => s.productId === product.id).reduce((sum, sale) => sum + sale.totalAmount, 0)
        }))
    };
}

// Enhanced low stock function
function updateLowStockAlert() {
    const lowStockList = document.getElementById('low-stock-list');
    const lowStockProducts = products.filter(product => 
        product.quantity > 0 && product.quantity <= settings.lowStockThreshold
    );
    
    if (lowStockProducts.length === 0) {
        lowStockList.innerHTML = '<li>No products with low stock</li>';
    } else {
        lowStockList.innerHTML = lowStockProducts
            .map(product => `<li>${product.name} - Only ${product.quantity} left in stock</li>`)
            .join('');
        
        // Show notification for critically low stock
        const criticallyLow = lowStockProducts.filter(p => p.quantity <= 2);
        if (criticallyLow.length > 0) {
            setTimeout(() => {
                alert(`⚠️ Critical Stock Alert!\n${criticallyLow.map(p => p.name).join(', ')} need immediate restocking.`);
            }, 1000);
        }
    }
}

// Refresh Functions for All Tabs
function refreshProductsTab() {
    console.log('Refreshing Products Tab...');
    loadProducts();
    alert('✅ Products tab refreshed successfully!');
}

function refreshSalesTab() {
    console.log('Refreshing Sales Tab...');
    loadProducts(); // Refresh product dropdown
    loadSales();
    alert('✅ Sales tab refreshed successfully!');
}

function refreshRestockingTab() {
    console.log('Refreshing Restocking Tab...');
    
    // Load products first, then update dropdowns
    loadProducts();
    
    // Small delay to ensure products are loaded before updating dropdowns
    setTimeout(() => {
        loadRestockProductDropdowns();
        loadPriceHistory();
        updateRestockHistory();
        console.log('✅ Restocking tab refreshed successfully!');
    }, 100);
}

function testRestockingDebug() {
    console.log('=== MANUAL RESTOCKING DEBUG ===');
    console.log('Products array:', products);
    console.log('Products length:', products.length);
    
    const restockSelect = document.getElementById('restock-product-select');
    console.log('Restock select element:', restockSelect);
    console.log('Current options in dropdown:', restockSelect ? restockSelect.options.length : 'Element not found');
    
    if (restockSelect) {
        for (let i = 0; i < restockSelect.options.length; i++) {
            console.log(`Option ${i}: ${restockSelect.options[i].text} (value: ${restockSelect.options[i].value})`);
        }
    }
    
    // Try to manually populate
    console.log('Attempting manual population...');
    loadRestockProductDropdowns();
    
    console.log('=== END MANUAL DEBUG ===');
    alert('Debug complete - check browser console');
}

function refreshInventoryTab() {
    console.log('Refreshing Inventory Tab...');
    loadProducts();
    updateInventoryOverview();
    alert('✅ Inventory overview refreshed successfully!');
}

function refreshSummaryTab() {
    console.log('Refreshing Summary Tab...');
    loadProducts();
    loadSales();
    updateSummary();
    alert('✅ Summary tab refreshed successfully!');
}

function refreshMonthlyTab() {
    console.log('Refreshing Monthly Progress Tab...');
    loadProducts();
    loadSales();
    initializeMonthSelector();
    updateMonthlyProgress();
    alert('✅ Monthly progress refreshed successfully!');
}

function refreshAutomationTab() {
    console.log('Refreshing Automation Hub Tab...');
    loadProducts();
    loadSales();
    loadSettings();
    updateLowStockAlerts();
    updateAutomationInsights();
    alert('✅ Automation hub refreshed successfully!');
}

function generateBusinessSummary() {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalProfit = sales.reduce((sum, sale) => {
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            return sum + ((sale.unitPrice - product.originalPrice) * sale.quantity);
        }
        return sum;
    }, 0);
    
    return {
        totalProducts: products.length,
        totalRevenue: totalRevenue,
        totalProfit: totalProfit,
        totalSales: sales.length,
        lowStockCount: products.filter(p => p.quantity <= settings.lowStockThreshold && p.quantity > 0).length,
        outOfStockCount: products.filter(p => p.quantity === 0).length,
        avgProfitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) : 0
    };
}

// Customer Management Functions
function saveCustomers() {
    localStorage.setItem('customers', JSON.stringify(customers));
}

function initializeCustomerManagement() {
    setupCustomerEventListeners();
    loadCustomers();
    loadCustomerDropdowns();
}

function setupCustomerEventListeners() {
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', handleCustomerSubmit);
    }
    
    const customerSearch = document.getElementById('customer-search');
    if (customerSearch) {
        customerSearch.addEventListener('input', filterCustomers);
    }
    
    const customerTypeFilter = document.getElementById('customer-type-filter');
    if (customerTypeFilter) {
        customerTypeFilter.addEventListener('change', filterCustomers);
    }
}

function handleCustomerSubmit(e) {
    e.preventDefault();
    
    const customerName = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const email = document.getElementById('customer-email').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const type = document.getElementById('customer-type').value;
    const discount = parseFloat(document.getElementById('customer-discount').value) || 0;
    
    if (!customerName || !phone) {
        alert('Please enter customer name and phone number.');
        return;
    }
    
    // Check if customer already exists
    if (customers.find(c => c.phone === phone)) {
        alert('Customer with this phone number already exists.');
        return;
    }
    
    const customer = {
        id: Date.now(),
        name: customerName,
        phone: phone,
        email: email,
        address: address,
        type: type,
        discount: discount,
        joinDate: new Date().toISOString(),
        totalPurchases: 0,
        totalSpent: 0,
        lastPurchase: null
    };
    
    customers.push(customer);
    saveCustomers();
    loadCustomers();
    loadCustomerDropdowns();
    document.getElementById('customer-form').reset();
    
    alert(`✅ Customer "${customerName}" added successfully!`);
}

function loadCustomers() {
    const tbody = document.querySelector('#customers-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${customer.name}</strong></td>
            <td>${customer.phone}</td>
            <td><span class="customer-type ${customer.type}">${customer.type.toUpperCase()}</span></td>
            <td>${customer.discount}%</td>
            <td>${customer.totalPurchases}</td>
            <td>${formatPeso(customer.totalSpent)}</td>
            <td>${customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'Never'}</td>
            <td>
                <button onclick="editCustomer(${customer.id})" class="action-button">Edit</button>
                <button onclick="deleteCustomer(${customer.id})" class="delete-btn">Delete</button>
                <button onclick="viewCustomerHistory(${customer.id})" class="action-button">History</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateCustomerStats();
}

function loadCustomerDropdowns() {
    const customerSelect = document.getElementById('customer-select');
    const analyticsCustomer = document.getElementById('analytics-customer');
    
    if (customerSelect) {
        customerSelect.innerHTML = '<option value="">-- Walk-in Customer --</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.name} (${customer.phone})`;
            customerSelect.appendChild(option);
        });
    }
    
    if (analyticsCustomer) {
        analyticsCustomer.innerHTML = '<option value="">-- Select Customer --</option>';
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = customer.name;
            analyticsCustomer.appendChild(option);
        });
    }
}

function updateCustomerStats() {
    const totalCustomersEl = document.getElementById('total-customers');
    const vipCustomersEl = document.getElementById('vip-customers');
    const activeCustomersEl = document.getElementById('active-customers');
    const avgCustomerValueEl = document.getElementById('avg-customer-value');
    
    if (totalCustomersEl) totalCustomersEl.textContent = customers.length;
    if (vipCustomersEl) vipCustomersEl.textContent = customers.filter(c => c.type === 'vip').length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const activeThisMonth = customers.filter(customer => {
        if (!customer.lastPurchase) return false;
        const lastPurchase = new Date(customer.lastPurchase);
        return lastPurchase.getMonth() === currentMonth && lastPurchase.getFullYear() === currentYear;
    }).length;
    
    if (activeCustomersEl) activeCustomersEl.textContent = activeThisMonth;
    
    const avgValue = customers.length > 0 ? 
        customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length : 0;
    if (avgCustomerValueEl) avgCustomerValueEl.textContent = formatPeso(avgValue);
}

function deleteCustomer(customerId) {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
        customers = customers.filter(customer => customer.id !== customerId);
        saveCustomers();
        loadCustomers();
        loadCustomerDropdowns();
        alert('Customer deleted successfully.');
    }
}

// Enhanced Product Management
function handleProductSubmit(e) {
    e.preventDefault();
    
    const productName = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const barcode = document.getElementById('product-barcode').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const originalPrice = parseFloat(document.getElementById('original-price').value);
    const sellingPrice = parseFloat(document.getElementById('selling-price').value);
    
    if (!productName || !category || quantity < 0 || originalPrice < 0 || sellingPrice < 0) {
        alert('Please fill in all required fields with valid values.');
        return;
    }
    
    // Check if barcode already exists
    if (barcode && products.find(p => p.barcode === barcode)) {
        alert('A product with this barcode already exists.');
        return;
    }
    
    const existingProductIndex = products.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (existingProductIndex !== -1) {
        // Update existing product
        products[existingProductIndex].quantity += quantity;
        products[existingProductIndex].originalPrice = originalPrice;
        products[existingProductIndex].sellingPrice = sellingPrice;
        products[existingProductIndex].category = category;
        if (barcode) products[existingProductIndex].barcode = barcode;
    } else {
        // Add new product
        const product = {
            id: Date.now(),
            name: productName,
            category: category,
            barcode: barcode || '',
            quantity: quantity,
            originalPrice: originalPrice,
            sellingPrice: sellingPrice,
            totalSold: 0,
            createdDate: new Date().toISOString()
        };
        products.push(product);
    }
    
    saveProducts();
    loadProducts();
    document.getElementById('product-form').reset();
}

// Advanced Search and Filter Functions
function filterCustomers() {
    const searchTerm = document.getElementById('customer-search').value.toLowerCase();
    const typeFilter = document.getElementById('customer-type-filter').value;
    
    const tbody = document.querySelector('#customers-table tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const customerName = row.cells[0].textContent.toLowerCase();
        const customerType = row.cells[2].textContent.toLowerCase();
        
        const matchesSearch = customerName.includes(searchTerm);
        const matchesType = typeFilter === 'all' || customerType.includes(typeFilter);
        
        row.style.display = matchesSearch && matchesType ? '' : 'none';
    });
}

function clearProductFilters() {
    document.getElementById('product-search').value = '';
    document.getElementById('product-category-filter').value = 'all';
    document.getElementById('product-stock-filter').value = 'all';
    filterProducts();
}

function filterProducts() {
    const searchTerm = document.getElementById('product-search').value.toLowerCase();
    const categoryFilter = document.getElementById('product-category-filter').value;
    const stockFilter = document.getElementById('product-stock-filter').value;
    
    const tbody = document.querySelector('#products-table tbody');
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const productName = row.cells[0].textContent.toLowerCase();
        const productCategory = row.cells[1].textContent.toLowerCase();
        const quantity = parseInt(row.cells[2].textContent);
        
        const matchesSearch = productName.includes(searchTerm);
        const matchesCategory = categoryFilter === 'all' || productCategory === categoryFilter || 
                               (categoryFilter === 'other' && (productCategory === '' || productCategory === 'other'));
        
        let matchesStock = true;
        if (stockFilter === 'in-stock') matchesStock = quantity > settings.lowStockThreshold;
        else if (stockFilter === 'low-stock') matchesStock = quantity > 0 && quantity <= settings.lowStockThreshold;
        else if (stockFilter === 'out-of-stock') matchesStock = quantity === 0;
        
        row.style.display = matchesSearch && matchesCategory && matchesStock ? '' : 'none';
    });
}

// Export/Import Functions
function exportProductsCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Product Name,Category,Barcode,Quantity,Original Price,Selling Price,Total Sold,Created Date\n";
    
    products.forEach(product => {
        csvContent += `"${product.name}","${product.category || ''}","${product.barcode || ''}",${product.quantity},"₱${product.originalPrice}","₱${product.sellingPrice}",${product.totalSold || 0},"${product.createdDate || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function exportCustomersCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Customer Name,Phone,Email,Address,Type,Discount %,Total Purchases,Total Spent,Join Date,Last Purchase\n";
    
    customers.forEach(customer => {
        csvContent += `"${customer.name}","${customer.phone}","${customer.email || ''}","${customer.address || ''}","${customer.type}",${customer.discount},${customer.totalPurchases},"₱${customer.totalSpent}","${customer.joinDate}","${customer.lastPurchase || ''}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function generateAdvancedReport() {
    const report = {
        generatedDate: new Date().toISOString(),
        period: 'All Time',
        businessSummary: generateBusinessSummary(),
        topProducts: getTopProducts(10),
        topCustomers: getTopCustomers(10),
        salesByPaymentMethod: getSalesByPaymentMethod(),
        monthlyTrends: getMonthlyTrends(),
        lowStockAlerts: getLowStockProducts(),
        profitAnalysis: getProfitAnalysis()
    };
    
    const reportStr = JSON.stringify(report, null, 2);
    const reportBlob = new Blob([reportStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(reportBlob);
    link.download = `business_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('📊 Advanced Business Report generated successfully!');
}

function refreshCustomersTab() {
    console.log('Refreshing Customers Tab...');
    loadCustomers();
    loadCustomerDropdowns();
    updateCustomerStats();
    alert('✅ Customers tab refreshed successfully!');
}

// Helper Functions
function getTopProducts(limit = 5) {
    return products
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, limit)
        .map(p => ({
            name: p.name,
            totalSold: p.totalSold || 0,
            revenue: (p.totalSold || 0) * p.sellingPrice
        }));
}

function getTopCustomers(limit = 5) {
    return customers
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, limit)
        .map(c => ({
            name: c.name,
            totalPurchases: c.totalPurchases,
            totalSpent: c.totalSpent
        }));
}

function getSalesByPaymentMethod() {
    const methods = {};
    sales.forEach(sale => {
        const method = sale.paymentMethod || 'cash';
        methods[method] = (methods[method] || 0) + sale.totalAmount;
    });
    return methods;
}

function getMonthlyTrends() {
    const trends = {};
    sales.forEach(sale => {
        const month = new Date(sale.date).toISOString().substring(0, 7); // YYYY-MM
        trends[month] = (trends[month] || 0) + sale.totalAmount;
    });
    return trends;
}

function getLowStockProducts() {
    return products
        .filter(p => p.quantity <= settings.lowStockThreshold)
        .map(p => ({
            name: p.name,
            currentStock: p.quantity,
            category: p.category
        }));
}

function getProfitAnalysis() {
    let totalRevenue = 0;
    let totalCost = 0;
    
    sales.forEach(sale => {
        const product = products.find(p => p.id === sale.productId);
        if (product) {
            totalRevenue += sale.totalAmount;
            totalCost += product.originalPrice * sale.quantity;
        }
    });
    
    return {
        totalRevenue,
        totalCost,
        totalProfit: totalRevenue - totalCost,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : 0
    };
}

// Additional Helper Functions
function applyCustomerDiscount() {
    const customerSelect = document.getElementById('customer-select');
    const discountInput = document.getElementById('discount-percent');
    
    if (customerSelect && discountInput) {
        const customerId = customerSelect.value;
        if (customerId) {
            const customer = customers.find(c => c.id === parseInt(customerId));
            if (customer && customer.discount > 0) {
                discountInput.value = customer.discount;
                updateTotalPrice();
            }
        } else {
            discountInput.value = 0;
            updateTotalPrice();
        }
    }
}

function editCustomer(customerId) {
    // Future implementation for customer editing
    alert(`Edit Customer functionality - Coming Soon! (Customer ID: ${customerId})`);
}

function viewCustomerHistory(customerId) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return;
    
    const customerSales = sales.filter(s => s.customerId === customerId);
    
    let historyText = `Customer: ${customer.name}\nPhone: ${customer.phone}\n\n`;
    historyText += `Total Purchases: ${customer.totalPurchases}\n`;
    historyText += `Total Spent: ${formatPeso(customer.totalSpent)}\n\n`;
    historyText += `Purchase History:\n`;
    
    if (customerSales.length === 0) {
        historyText += 'No purchases yet.';
    } else {
        customerSales.forEach(sale => {
            historyText += `• ${new Date(sale.date).toLocaleDateString()}: ${sale.productName} (${sale.quantity}x) - ${formatPeso(sale.totalAmount)}\n`;
        });
    }
    
    alert(historyText);
}

function generateCustomerReport() {
    const analyticsCustomer = document.getElementById('analytics-customer');
    const contentDiv = document.getElementById('customer-analytics-content');
    
    if (!analyticsCustomer || !contentDiv) return;
    
    const customerId = parseInt(analyticsCustomer.value);
    if (!customerId) {
        contentDiv.style.display = 'none';
        return;
    }
    
    const customer = customers.find(c => c.id === customerId);
    const customerSales = sales.filter(s => s.customerId === customerId);
    
    if (!customer) return;
    
    // Calculate analytics
    const totalPurchases = customerSales.length;
    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const avgPurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    
    // Get favorite products
    const productCounts = {};
    customerSales.forEach(sale => {
        productCounts[sale.productName] = (productCounts[sale.productName] || 0) + sale.quantity;
    });
    
    const favoriteProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([product, count]) => `${product} (${count}x)`)
        .join(', ');
    
    // Update display
    document.getElementById('customer-total-purchases').textContent = totalPurchases;
    document.getElementById('customer-total-spent').textContent = formatPeso(totalSpent);
    document.getElementById('customer-avg-purchase').textContent = formatPeso(avgPurchase);
    document.getElementById('customer-favorite-products').textContent = favoriteProducts || 'None';
    
    contentDiv.style.display = 'block';
}

// Updated updateTotalPrice function (no discount handling)
function updateTotalPrice() {
    const productSelect = document.getElementById('product-select');
    const quantityInput = document.getElementById('sale-quantity');
    const totalPriceInput = document.getElementById('total-price');
    
    if (!productSelect || !quantityInput || !totalPriceInput) return;
    
    const productId = parseInt(productSelect.value);
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (productId && quantity > 0) {
        const product = products.find(p => p.id === productId);
        if (product) {
            const total = product.sellingPrice * quantity;
            totalPriceInput.value = formatPeso(total);
        }
    } else {
        totalPriceInput.value = '';
    }
}

// Override handleProductSubmit for new enhanced version
const originalHandleProductSubmit = handleProductSubmit;
