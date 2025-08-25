// Quick test for restocking functionality
setTimeout(() => {
    console.log('=== RESTOCKING TAB DEBUG ===');

    // Test if elements exist
    const elements = [
        'restock-form',
        'restock-product-select', 
        'restock-quantity',
        'current-product-info',
        'bulk-restock-low-stock',
        'price-history-product'
    ];

    console.log('Checking elements:');
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`  ${id}: ${element ? '✅ Found' : '❌ Missing'}`);
        if (element && id === 'restock-product-select') {
            console.log(`    Options: ${element.options.length}`);
            for(let i = 0; i < element.options.length; i++) {
                console.log(`      ${i}: ${element.options[i].text}`);
            }
        }
    });

    // Test if products array is populated
    console.log(`Products array: ${typeof products !== 'undefined' ? products.length + ' items' : 'Not found'}`);
    if (typeof products !== 'undefined' && products.length > 0) {
        console.log('First product:', products[0]);
    }

    // Test if functions exist
    const functions = ['initializeRestocking', 'loadRestockProductDropdowns', 'setupRestockingEventListeners'];
    console.log('Checking functions:');
    functions.forEach(name => {
        console.log(`  ${name}: ${typeof window[name] === 'function' ? '✅ Exists' : '❌ Missing'}`);
    });

    // Test manual initialization
    console.log('Testing manual restocking initialization...');
    if (typeof initializeRestocking === 'function') {
        try {
            initializeRestocking();
            console.log('✅ Manual initialization successful');
        } catch (error) {
            console.error('❌ Manual initialization failed:', error);
        }
    }

    console.log('=== END DEBUG ===');
}, 2000);
