// Force image size constraints after page load
// This ensures images loaded from DB respect max-height limits

function enforceImageSizeConstraints() {
    // Hero image - Portrait format for client photo
    const heroImg = document.querySelector('img[data-image-key="home_hero_image"]');
    if (heroImg) {
        heroImg.style.maxHeight = '500px';
        heroImg.style.maxWidth = '350px';
        heroImg.style.width = 'auto';
        heroImg.style.height = 'auto';
        heroImg.style.objectFit = 'contain';
        console.log('✅ Hero image constraints applied (portrait):', heroImg.style.maxHeight);
    }

    // Service card images - max 400px
    const serviceImages = document.querySelectorAll('img[data-image-key*="home_service"]');
    serviceImages.forEach(img => {
        img.style.maxHeight = '400px';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
    });

    // Category images - max 400px
    const categoryImages = document.querySelectorAll('img[data-image-key*="cat_"]');
    categoryImages.forEach(img => {
        img.style.maxHeight = '400px';
        img.style.width = '100%';
        img.style.objectFit = 'cover';
    });

    console.log('✅ All image size constraints enforced');
}

// Run immediately
enforceImageSizeConstraints();

// Run after DOM loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', enforceImageSizeConstraints);
} else {
    enforceImageSizeConstraints();
}

// Run after a delay to catch images loaded from DB
setTimeout(enforceImageSizeConstraints, 500);
setTimeout(enforceImageSizeConstraints, 1000);
setTimeout(enforceImageSizeConstraints, 2000);

console.log('📏 Image size enforcer loaded');
