import { supabase } from './config.js';
import { compressImage } from './image-utils.js';
import { initProductManager, enableProductDeletion } from './product-manager.js';

// Export for auth.js
window.disableInlineEditing = null; // Will be set below

// Wait for Admin Mode to be enabled AND edit mode toggle
window.addEventListener('admin-mode-enabled', () => {
    // Only enable if edit mode is active
    if (document.body.classList.contains('edit-mode')) {
        enableInlineEditing();
        enableImageDragAndDrop();
        enableGenericImageDragAndDrop(); // For all other images
        enableProductDeletion(); // Add delete buttons
    }
});

// Listen for edit mode toggle
window.addEventListener('edit-mode-toggled', (e) => {
    if (e.detail.active) {
        enableInlineEditing();
        enableImageDragAndDrop();
        enableGenericImageDragAndDrop();
        enableProductDeletion();
    } else {
        disableInlineEditing();
        // Additional cleanup if needed
    }
});

function enableInlineEditing() {
    // Select all elements that are editable (static content)
    const editableElements = document.querySelectorAll('[data-content-key]');

    editableElements.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.classList.add('editable'); // For CSS styling

        // Save on blur
        el.addEventListener('blur', async () => {
            const key = el.getAttribute('data-content-key');
            const newContent = el.innerText;

            // Save to Supabase
            const { error } = await supabase
                .from('static_content')
                .upsert({ key, content: newContent });

            if (error) {
                console.error('Error saving content:', error);
                alert('Failed to save changes!');
            } else {
                console.log('Content saved:', key);
                el.style.outline = '2px solid green';
                setTimeout(() => el.style.outline = '', 1000);
            }
        });
    });

    // Handle product fields (title, description, price)
    const productFields = document.querySelectorAll('[data-product-field]');

    productFields.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.classList.add('editable');

        el.addEventListener('blur', async () => {
            const productId = el.getAttribute('data-product-id');
            const fieldName = el.getAttribute('data-product-field');
            let newValue = el.innerText;

            // Parse price as number
            if (fieldName === 'price') {
                newValue = parseFloat(newValue.replace('€', '').trim());
            }

            const updateData = { [fieldName]: newValue };

            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', productId);

            if (error) {
                console.error('Error updating product:', error);
                alert('Failed to update product!');
            } else {
                console.log(`Product ${productId} updated:`, fieldName);
                el.style.outline = '2px solid green';
                setTimeout(() => el.style.outline = '', 1000);
            }
        });
    });
}

function disableInlineEditing() {
    // Remove contenteditable from all elements
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.removeAttribute('contenteditable');
        el.classList.remove('editable');
    });
}

// Expose globally for auth.js
window.disableInlineEditing = disableInlineEditing;

function enableImageDragAndDrop() {
    // Use setTimeout to ensure DOM has updated
    setTimeout(() => {
        const productImages = document.querySelectorAll('img[data-product-id]');

        console.log(`Found ${productImages.length} product images for drag-and-drop`);

        productImages.forEach(imgElement => {
            const productCard = imgElement.closest('.product-card');
            if (productCard) {
                productCard.classList.add('droppable');
            }

            // Remove existing listeners to avoid duplicates
            imgElement.ondragover = null;
            imgElement.ondragleave = null;
            imgElement.ondrop = null;

            imgElement.addEventListener('dragover', (e) => {
                e.preventDefault();
                imgElement.classList.add('drag-over');
                console.log('Drag over image');
            });

            imgElement.addEventListener('dragleave', () => {
                imgElement.classList.remove('drag-over');
            });

            imgElement.addEventListener('drop', async (e) => {
                e.preventDefault();
                imgElement.classList.remove('drag-over');

                const file = e.dataTransfer.files[0];
                if (!file || !file.type.startsWith('image/')) {
                    alert('Please drop an image file');
                    return;
                }

                const productId = imgElement.getAttribute('data-product-id');
                console.log(`Dropped image on product ${productId}`);
                await handleImageUpload(file, productId, imgElement);
            });
        });
    }, 500); // Small delay to ensure products are rendered
}

function enableGenericImageDragAndDrop() {
    // Handle ANY image with data-image-key attribute
    const editableImages = document.querySelectorAll('img[data-image-key]');

    console.log(`Found ${editableImages.length} editable images with data-image-key`);

    editableImages.forEach(imgElement => {
        imgElement.style.cursor = 'copy';

        // Prevent default link behavior when dragging over images
        const parentLink = imgElement.closest('a');
        if (parentLink) {
            imgElement.addEventListener('click', (e) => {
                if (document.body.classList.contains('edit-mode')) {
                    e.preventDefault();
                }
            });
            parentLink.addEventListener('dragover', (e) => {
                if (document.body.classList.contains('edit-mode')) {
                    e.preventDefault();
                }
            });
        }

        imgElement.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            imgElement.classList.add('drag-over');
        });

        imgElement.addEventListener('dragleave', () => {
            imgElement.classList.remove('drag-over');
        });

        imgElement.addEventListener('drop', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            imgElement.classList.remove('drag-over');

            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) {
                alert('Veuillez déposer un fichier image');
                return;
            }

            const imageKey = imgElement.getAttribute('data-image-key');
            console.log(`Dropped image for key: ${imageKey}`);
            await handleGenericImageUpload(file, imageKey, imgElement);
        });
    });
}

async function handleGenericImageUpload(file, imageKey, imgElement) {
    try {
        // 1. IMMEDIATE VISUAL FEEDBACK - Show placeholder while uploading
        const originalSrc = imgElement.src;
        imgElement.style.opacity = '0.3';
        imgElement.style.filter = 'blur(4px)';

        // Create preview from file immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
            imgElement.style.opacity = '0.5';
            imgElement.style.filter = 'blur(2px)';
        };
        reader.readAsDataURL(file);

        // 2. GET OLD IMAGE URL from database to delete it later
        const { data: oldContent } = await supabase
            .from('static_content')
            .select('content')
            .eq('key', imageKey)
            .single();

        // 3. Compress Image
        const compressedBlob = await compressImage(file);
        const fileName = `${imageKey}_${Date.now()}.webp`;

        // 4. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, compressedBlob);

        if (uploadError) throw uploadError;

        // 5. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        // 6. Save URL in static_content table
        const { error: dbError } = await supabase
            .from('static_content')
            .upsert({ key: imageKey, content: publicUrl });

        if (dbError) throw dbError;

        // 7. DELETE OLD IMAGE from storage to save space
        if (oldContent?.content && oldContent.content.includes('/images/')) {
            try {
                const oldFileName = oldContent.content.split('/images/').pop();
                if (oldFileName && oldFileName !== fileName) {
                    await supabase.storage.from('images').remove([oldFileName]);
                    console.log(`Deleted old image: ${oldFileName}`);
                }
            } catch (deleteError) {
                console.warn('Could not delete old image:', deleteError);
                // Don't fail the upload if deletion fails
            }
        }

        // 8. Update Image with smooth transition
        imgElement.src = publicUrl;
        imgElement.style.opacity = '1';
        imgElement.style.filter = 'none';
        imgElement.style.transition = 'all 0.3s ease';

        console.log(`✅ Image uploaded and old image deleted: ${imageKey}`);

    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Erreur lors de l\'upload de l\'image: ' + error.message);
        // Restore original on error
        imgElement.style.opacity = '1';
        imgElement.style.filter = 'none';
    }
}

async function handleImageUpload(file, productId, imgElement) {
    try {
        // Show loading state
        imgElement.style.opacity = '0.5';

        // 1. Compress Image
        const compressedBlob = await compressImage(file);
        const fileName = `product_${productId}_${Date.now()}.webp`;

        // 2. Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('images')
            .upload(fileName, compressedBlob);

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(fileName);

        // 4. Update Product Record
        const { error: dbError } = await supabase
            .from('products')
            .update({ image_url: publicUrl })
            .eq('id', productId);

        if (dbError) throw dbError;

        // 5. Update DOM
        imgElement.src = publicUrl;
        console.log('Image updated successfully');

    } catch (error) {
        console.error('Error uploading image:', error);
        alert('Image upload failed: ' + error.message + '\n\nCheck Supabase Storage Policies!');
    } finally {
        imgElement.style.opacity = '1';
    }
}

// Initialize product manager if on product pages
if (document.querySelector('.product-grid')) {
    initProductManager();
}
