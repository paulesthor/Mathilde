// SIDEBAR TEMPLATE - Injecté dynamiquement
export function injectSidebar(activePage = '') {
    const sidebarHTML = `
        <!-- HEADER MOBILE (Visible seulement < 1024px) -->
        <div class="mobile-header">
            <a href="index.html" class="mobile-logo">MATHILDE GEST</a>
            <button class="burger-btn" id="burger-toggle">
                <span class="burger-line"></span>
                <span class="burger-line"></span>
                <span class="burger-line"></span>
            </button>
        </div>

        <!-- SIDEBAR NAVIGATION (Gauche) -->
        <aside class="sidebar" id="sidebar">
            <a href="index.html" class="sidebar-logo">
                <div class="logo-text">Mat.<br>Gest</div>
                <span class="logo-sub">Atelier Paris</span>
            </a>

            <nav class="sidebar-nav">
                <ul>
                    <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Accueil</a></li>
                    <li><a href="categories.html" class="${activePage === 'categories' ? 'active' : ''}">Créations</a></li>
                    <li><a href="piece-of-the-month.html" class="${activePage === 'piece' ? 'active' : ''}">Le Mois</a></li>
                    <li><a href="contact.html" class="${activePage === 'contact' ? 'active' : ''}">Atelier</a></li>
                </ul>
            </nav>

            <div class="sidebar-footer">
                <div class="auth-links" id="auth-placeholder" style="margin-bottom: 2rem;">
                    <a href="login.html" style="font-size: 0.9rem; font-weight: 500;">Espace Client</a>
                </div>
                <p>12 Rue de la Tapisserie<br>75000 Paris</p>
            </div>
        </aside>
    `;

    // Insérer au début du body
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sidebarHTML;

    while (tempDiv.firstChild) {
        document.body.insertBefore(tempDiv.firstChild, document.body.firstChild);
    }

    // Activer le toggle burger
    const burger = document.getElementById('burger-toggle');
    const sidebar = document.getElementById('sidebar');

    if (burger && sidebar) {
        burger.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}
