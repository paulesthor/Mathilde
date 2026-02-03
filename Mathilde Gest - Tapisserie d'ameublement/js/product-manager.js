import { supabase } from './config.js';
import { compressImage } from './image-utils.js';

// Product Manager - Handles CRUD operations for products
let currentCategory = null; // Track current category for filtered views

export function initProductManager() {
    // Get category from URL if on products page
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');

    // Setup event listeners
    setupAddProductButton();
    setupModalEvents();
}

function setupAddProductButton() {
    const addButton = document.getElementById('add-product-btn');
    if (!addButton) return;

    addButton.addEventListener('click', showAddProductModal);
}

function setupModalEvents() {
    const modal = document.getElementById('product-modal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancel-product');
    const form = document.getElementById('product-form');
    const imageDropZone = document.getElementById('image-dropzone');

    if (!modal) return;

    // Close modal
    if (closeBtn) closeBtn.addEventListener('click', hideAddProductModal);
    if (cancelBtn) cancelBtn.addEventListener('click', hideAddProductModal);

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) hideAddProductModal();
    });

    // Form submission
    if (form) {
        form.addEventListener('submit', handleProductCreation);
    }

    // Image drag and drop
    if (imageDropZone) {
        setupImageDropZone(imageDropZone);
    }
}

function showAddProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        // Pre-fill category if we're on a filtered page
        if (currentCategory) {
            const categorySelect = document.getElementById('product-category');
            if (categorySelect) {
                categorySelect.value = currentCategory;
            }
        }
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function hideAddProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling

        // Reset form
        const form = document.getElementById('product-form');
        if (form) form.reset();

        // Clear image preview
        const preview = document.getElementById('image-preview');
        if (preview) preview.innerHTML = '';
    }
}

let uploadedImageFile = null;

function setupImageDropZone(dropZone) {
    const preview = document.getElementById('image-preview');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            uploadedImageFile = file;
            showImagePreview(file, preview);
        }
    });

    // Also allow click to upload
    dropZone.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                uploadedImageFile = file;
                showImagePreview(file, preview);
            }
        };
        input.click();
    });
}

function showImagePreview(file, previewContainer) {
    const reader = new FileReader();
    reader.onload = (e) => {
        previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
            <p style="margin-top: 0.5rem; font-size: 0.9rem; color: #666;">${file.name}</p>
        `;
    };
    reader.readAsDataURL(file);
}

async function handleProductCreation(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Création...';

    try {
        // Get form data
        const formData = new FormData(e.target);
        const productData = {
            title: formData.get('title'),
            description: formData.get('description'),
            price: parseFloat(formData.get('price')),
            category: formData.get('category'),
            image_url: null
        };

        // Upload image if provided
        if (uploadedImageFile) {
            const compressedBlob = await compressImage(uploadedImageFile);
            const fileName = `product_${Date.now()}.webp`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, compressedBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(fileName);

            productData.image_url = publicUrl;
        }

        // Insert product into database
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();

        if (error) throw error;

        console.log('Product created:', data);

        // Close modal
        hideAddProductModal();
        uploadedImageFile = null;

        // Reload products on current page
        window.location.reload();

    } catch (error) {
        console.error('Error creating product:', error);
        alert('Erreur lors de la création: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer le Produit';
    }
}

export async function handleProductDeletion(productId, productElement) {
    if (!confirm('Voulez-vous vraiment supprimer ce produit?')) {
        return;
    }

    try {
        // Get product data to find image URL
        const { data: product, error: fetchError } = await supabase
            .from('products')
            .select('image_url')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        // Delete image from storage if exists
        if (product.image_url) {
            // Extract filename from URL
            const urlParts = product.image_url.split('/');
            const fileName = urlParts[urlParts.length - 1];

            await supabase.storage
                .from('images')
                .remove([fileName]);
        }

        // Delete product from database
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);

        if (deleteError) throw deleteError;

        // Animate removal
        productElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        productElement.style.opacity = '0';
        productElement.style.transform = 'scale(0.9)';

        setTimeout(() => {
            productElement.remove();
        }, 300);

        console.log('Product deleted:', productId);

    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Erreur lors de la suppression: ' + error.message);
    }
}

export function enableProductDeletion() {
    // Add delete buttons to all product cards
    const productCards = document.querySelectorAll('.product-card');

    productCards.forEach(card => {
        // Check if delete button already exists
        if (card.querySelector('.delete-product-btn')) return;

        // Get product ID from any child element
        const productIdElement = card.querySelector('[data-product-id]');
        if (!productIdElement) return;

        const productId = productIdElement.getAttribute('data-product-id');

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-product-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Supprimer ce produit';
        deleteBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleProductDeletion(productId, card);
        };

        card.appendChild(deleteBtn);
    });
}
