// Interactions "Pro Max" - Animations & UX Premium

export function initInteractions() {
    console.log("🎨 Init 'Pro Max' Interactions");

    // 1. Header Transition on Scroll
    const header = document.querySelector('.modern-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 2. Parallax Effect for Hero
    const heroBg = document.querySelector('.hero-background');
    const heroContent = document.querySelector('.hero-content');

    if (heroBg && heroContent) {
        window.addEventListener('scroll', () => {
            const scroll = window.scrollY;
            // Parallax léger sur le fond
            heroBg.style.transform = `scale(1.1) translateY(${scroll * 0.4}px)`;
            // Parallax plus rapide sur le texte pour effet de profondeur
            heroContent.style.transform = `translateY(${scroll * 0.2}px)`;
            heroContent.style.opacity = 1 - (scroll / 500);
        });

        // Apparition initiale Hero
        setTimeout(() => {
            heroContent.style.opacity = '1';
            heroContent.style.transform = 'translateY(0)';
            heroContent.style.transition = 'opacity 1s ease, transform 1s ease';
        }, 100);
    }

    // 3. Scroll Reveal (Intersection Observer)
    const observerOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Cible les éléments à révéler
    const revealElements = document.querySelectorAll('.reveal-left, .reveal-right, .service-card-pro, .about-text');
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1)'; // Ease-out smooth
        revealObserver.observe(el);
    });

    // Classe CSS pour l'animation (ajoutée dynamiquement)
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}
