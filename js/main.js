import { supabase } from './config.js';
// import { initInteractions } from './interactions.js'; // DISABLED - old design elements don't exist

// Load content on page load
document.addEventListener('DOMContentLoaded', async () => {
    // initInteractions(); // DISABLED - causes errors with new sidebar layout
    await loadStaticContent();
    await loadProducts();
});

async function loadStaticContent() {
    const { data, error } = await supabase
        .from('static_content')
        .select('key, content');

    if (error) {
        console.error('Error loading content:', error);
        return;
    }

    data.forEach(item => {
        // Handle text content elements
        const textEl = document.querySelector(`[data-content-key="${item.key}"]`);
        if (textEl) {
            textEl.innerText = item.content;
        }

        // Handle image elements
        const imgEl = document.querySelector(`img[data-image-key="${item.key}"]`);
        if (imgEl && item.content) {
            // Only update src if content looks like a URL
            if (item.content.startsWith('http')) {
                // CRITICAL: Preserve inline styles before changing src
                const existingStyle = imgEl.getAttribute('style');
                imgEl.src = item.content;
                // Restore styles after changing src
                if (existingStyle) {
                    imgEl.setAttribute('style', existingStyle);
                }
            }
        }
    });
}

async function loadProducts() {
    // Skip if we're on products.html (it has its own filtering logic)
    if (window.location.pathname.includes('products.html')) {
        return;
    }

    // Only run on pages that list products
    const productGrid = document.querySelector('.product-grid');
    if (!productGrid) return;

    const { data: products, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        console.error('Error loading products:', error);
        return;
    }

    productGrid.innerHTML = products.map(product => `
        <article class="product-card">
            <img src="${product.image_url || 'assets/placeholder.svg'}" 
                 alt="${product.title}" 
                 data-product-id="${product.id}" 
                 class="product-image"
                 onerror="this.style.backgroundColor='#eaeaea'; this.style.minHeight='300px'; this.alt='Image non disponible'">
            <h3 data-product-id="${product.id}" data-product-field="title">${product.title}</h3>
            <p data-product-id="${product.id}" data-product-field="description">${product.description}</p>
            <span class="price" data-product-id="${product.id}" data-product-field="price">${product.price} €</span>
        </article>
    `).join('');

    // Re-dispatch event to re-attach admin listeners to new DOM elements if admin
    // In a real app, we'd use a MutationObserver or a framework, but for vanilla:
    if (document.body.classList.contains('is-admin')) {
        window.dispatchEvent(new CustomEvent('admin-mode-enabled'));
    }
}
