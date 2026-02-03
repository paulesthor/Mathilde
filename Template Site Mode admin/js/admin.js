import { supabase } from './config.js';
// Removed specific utils dependency for simplicity in template, or include them if needed. 
// Assuming image-utils.js and product-manager.js logic is merged or kept simple here.

// Simplified version for template - if you need full image upload, ensure image-utils.js is also copied.
// For now, I will include a basic placeholder for missing dependencies or ensure they are optional.

// Export for auth.js
window.disableInlineEditing = null;

// Wait for Admin Mode
window.addEventListener('admin-mode-enabled', () => {
    if (document.body.classList.contains('edit-mode')) {
        enableInlineEditing();
    }
});

// Listen for edit mode toggle
window.addEventListener('edit-mode-toggled', (e) => {
    if (e.detail.active) {
        enableInlineEditing();
    } else {
        disableInlineEditing();
    }
});

function enableInlineEditing() {
    // Select all elements that are editable (static content)
    const editableElements = document.querySelectorAll('[data-content-key]');

    editableElements.forEach(el => {
        el.setAttribute('contenteditable', 'true');
        el.classList.add('editable');

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
}

function disableInlineEditing() {
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    editableElements.forEach(el => {
        el.removeAttribute('contenteditable');
        el.classList.remove('editable');
    });
}

// Expose globally
window.disableInlineEditing = disableInlineEditing;
