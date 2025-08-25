# Mini Store Management System

A complete web-based inventory and sales management system for small stores with advanced automation features and **admin dashboard for user management**. Built with HTML, CSS, and JavaScript. **All prices displayed in Philippine Peso (₱)**.

## 🆕 Admin Dashboard
- **User Management**: Monitor and manage all system users
- **Store Analytics**: Cross-store performance metrics and insights  
- **System Monitoring**: Real-time system health and activity tracking
- **Advanced Reports**: Generate comprehensive business intelligence reports
- **User Support**: Access user data for customer support purposes

## Features

### 📦 Products Tab
- Add new products with name, quantity, original price, and selling price
- View all products in an organized table
- Update existing product quantities automatically
- Delete products with confirmation
- Input validation for all fields

### � Restocking Tab (NEW!)
- **Smart Restocking:**
  - Select any product to restock with additional quantity
  - Update original and selling prices during restock
  - View current product details before restocking
  - Add restock notes for tracking

- **Price History Tracking:**
  - Complete price change history for every product
  - Visual price trend charts with interactive canvas
  - Track margin changes over time
  - Reason tracking for all price changes

- **Bulk Operations:**
  - Bulk restock all low stock items automatically
  - Bulk price updates with preview functionality
  - CSV import for supplier data
  - Multiple adjustment types (percentage, fixed amount, target margin)

- **Supplier Management:**
  - Add and manage supplier information
  - Track supplier performance and ratings
  - Lead time tracking
  - Supplier contact management

### �💰 Sales Tab
- Select products from dropdown (shows only in-stock items)
- Enter quantity to sell with stock validation
- Automatic price calculation based on selling price
- Complete sales history with date, product, quantity, and totals
- Prevent overselling with stock checks

### 📊 Summary Tab
- **Business Metrics:**
  - Total Revenue (sum of all sales)
  - Total Profit (revenue minus cost of goods sold)
  - Products in Stock count
  - Total Sales transactions
  
- **Low Stock Alert:**
  - Automatically identifies products with customizable threshold
  - Critical stock notifications
  - Quick restock buttons for immediate action
  
- **Top Selling Products:**
  - Shows top 5 products by quantity sold
  - Displays revenue generated per product

### 📈 Monthly Progress Tab
- **Month Selection:** View detailed reports for any month with sales data
- **Monthly Metrics:**
  - Monthly revenue and profit tracking
  - Items sold and transaction count
  - Visual daily sales chart with hover details
  - Top products for the selected month

- **Growth Analysis:**
  - Month-over-month growth percentages
  - Revenue, profit, and sales volume comparisons
  - Color-coded growth indicators (green for positive, red for negative)

### 🤖 Automation Hub Tab
- **Smart Alerts:**
  - Customizable low stock threshold
  - Auto reorder suggestions based on sales velocity
  - Critical stock notifications

- **Auto Reports:**
  - Export monthly sales reports (CSV)
  - Export inventory reports (CSV)
  - Complete data backup (JSON)

- **Reorder Suggestions:**
  - AI-powered inventory recommendations
  - Based on 30-day sales velocity
  - Suggests optimal reorder quantities

- **Profit Optimization:**
  - Identifies high-demand, low-margin products
  - Suggests price adjustments
  - Analyzes sales patterns for optimization

- **Performance Insights:**
  - Best selling day of the week
  - Average daily revenue calculation
  - Most profitable product identification
  - Inventory turnover ratio

## New Automation Features

### 🎯 Smart Inventory Management
- **Auto Reorder Alerts:** Get notified when products need restocking
- **Sales Velocity Tracking:** Understand how fast products sell
- **Predictive Restocking:** Suggestions based on historical data

### 📊 Advanced Analytics
- **Daily Sales Visualization:** Interactive bar chart showing daily performance
- **Month-over-Month Comparisons:** Track business growth trends
- **Profit Margin Analysis:** Optimize pricing for maximum profitability

### 🔔 Intelligent Notifications
- **Critical Stock Alerts:** Immediate warnings for products running out
- **Performance Insights:** Automated business intelligence
- **Growth Tracking:** Automatic calculation of business metrics

### 💾 Data Management
- **Automated Backups:** One-click complete data export
- **Report Generation:** Professional CSV reports for accounting
- **Data Persistence:** Everything saved automatically in browser storage

## Getting Started

1. **Open the Application:**
   - The local server is running at: http://localhost:8000
   - Open this URL in your web browser

2. **Add Products:**
   - Navigate to the "Products" tab
   - Fill in product details and click "Add Product"
   - Products will appear in the inventory table

3. **Record Sales:**
   - Go to the "Sales" tab
   - Select a product from the dropdown
   - Enter quantity and click "Record Sale"
   - Stock will automatically update

4. **View Analytics:**
   - Check the "Summary" tab for business insights
   - Monitor low stock alerts
   - Review top-performing products

5. **Track Monthly Progress:**
   - Use the "Monthly Progress" tab
   - Select any month to view detailed reports
   - Analyze growth trends and daily performance

6. **Configure Automation:**
   - Visit the "Automation Hub" tab
   - Set your preferred stock thresholds
   - Enable/disable auto suggestions
   - Export reports and backup data

## Automation Benefits

- **Save Time:** Automated alerts and suggestions reduce manual monitoring
- **Increase Profits:** Smart pricing and inventory optimization recommendations
- **Prevent Stockouts:** Predictive reordering based on sales patterns
- **Track Growth:** Automated monthly progress and growth calculations
- **Data-Driven Decisions:** Performance insights help optimize operations

## Data Persistence

The application automatically saves all data to your browser's local storage:
- Products and their current stock levels
- Complete sales history with timestamps
- User preferences and settings
- All automation configurations

## Project Structure

```
store-management-system/
├── index.html              # Main application with user interface
├── admin-dashboard.html    # Admin dashboard for user management
├── styles.css              # Main application styling
├── admin-styles.css        # Admin dashboard specific styles
├── script.js              # Main application logic
├── admin-dashboard.js      # Admin dashboard functionality
├── auth.js                # Firebase authentication system
├── debug-restocking.js     # Debugging utilities
├── test-restocking.html    # Testing interface
├── FIREBASE_SETUP.md       # Firebase configuration guide
├── ADMIN_GUIDE.md          # Admin dashboard documentation
├── .gitignore             # Git ignore rules
└── README.md              # This comprehensive documentation
```

## Admin Dashboard Access

### For System Administrators:
1. Navigate to `admin-dashboard.html`
2. Login with admin credentials:
   - Email: `admin@store.com` 
   - Password: `admin123` (change in production!)
3. Access comprehensive user management features

### Admin Features:
- **📈 Overview**: System statistics and recent activity
- **👥 Users**: Manage all user accounts and permissions
- **🏪 Stores**: Monitor individual store performance  
- **📊 Analytics**: Generate system-wide reports and charts
- **⚙️ System**: Database maintenance and configuration

**⚠️ Security Note**: Admin dashboard requires proper Firebase Security Rules configuration. See `ADMIN_GUIDE.md` for complete setup instructions.

## Technical Features

- **Frontend:** Pure HTML5, CSS3, and JavaScript (ES6+)
- **Backend:** Firebase Authentication and Firestore Database
- **Storage:** Cloud-based user data with local backup
- **Responsive:** Mobile-friendly design with optimized layouts
- **Security:** Role-based access control and data encryption
- **Performance:** Optimized for handling large datasets
- **Automation:** Built-in AI-like business intelligence
- **Admin Panel:** Comprehensive user and system management

## Advanced Usage

### Monthly Reporting
1. Sales data is automatically organized by month
2. Generate visual reports with daily breakdowns
3. Compare performance month-over-month
4. Export professional reports for tax purposes

### Inventory Optimization
1. Set custom stock thresholds for each business
2. Receive intelligent reorder suggestions
3. Track inventory turnover ratios
4. Optimize carrying costs

### Profit Analysis
1. Automatic profit margin calculations
2. Identify high-performing products
3. Receive pricing optimization suggestions
4. Track profitability trends over time

---

**Version:** 2.0 (Now with Advanced Automation)  
**Last Updated:** August 24, 2025
