import { supabase } from './config.js';

// Authentication Logic
async function initAuth() {
    if (!supabase) return;

    // Check current session
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        checkUserRole(session.user);
    } else {
        // No session? Ensure admin mode is OFF
        document.body.classList.remove('is-admin');
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
            checkUserRole(session.user);
        } else {
            document.body.classList.remove('is-admin');
            // Do NOT reload here - it causes infinite loop
            removeUserMenu();
        }
    });
}

async function checkUserRole(user) {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();

        if (error) console.warn('Profile fetch warning:', error.message);

        if (!data) {
            console.log('No profile found for this user. You might need to add a row to the "profiles" table.');
            return;
        }

        if (data.role === 'admin') {
            document.body.classList.add('is-admin');
            console.log('Admin mode enabled');
            // Dispatch event for other scripts to react
            window.dispatchEvent(new CustomEvent('admin-mode-enabled'));
        } else {
            document.body.classList.remove('is-admin');
        }

        // Create user menu after role check
        createUserMenu(user);

    } catch (error) {
        console.error('Error checking user role:', error.message);
    }
}

function createUserMenu(user) {
    // Remove existing menu to prevent duplicates on re-render
    removeUserMenu();

    // NEW SIDEBAR STRUCTURE: Target .auth-links in sidebar (Priority!)
    const authLinks = document.querySelector('.sidebar .auth-links');

    // Fallback for old header structure (backwards compatibility)
    const actionContainer = document.querySelector('.header-actions');

    const isAdmin = document.body.classList.contains('is-admin');

    // 1. PRIORITY: NEW Sidebar Structure (.auth-links exists)
    if (authLinks) {
        authLinks.innerHTML = ''; // Clear signup/login buttons

        const userDiv = document.createElement('div');
        userDiv.className = 'user-menu-container';
        userDiv.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem;';

        userDiv.innerHTML = `
            <div class="user-info" style="padding: 1rem; background: rgba(27, 58, 54, 0.05); border-radius: var(--radius-std); margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.2rem;">👤</span>
                    <span style="font-weight: 600; color: var(--color-primary);">${user.email?.split('@')[0] || 'User'}</span>
                </div>
                ${isAdmin ? '<span class="admin-badge" style="font-size: 0.75rem; background: var(--color-accent); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; display: inline-block;">Mode Admin</span>' : ''}
            </div>
            
            ${isAdmin ? '<a href="dashboard.html" class="btn btn-primary" style="display: block; text-align: center; padding: 0.8rem; margin-bottom: 0.5rem; text-decoration: none;">📊 Dashboard</a>' : ''}
            
            ${!isAdmin ? '<a href="profile.html" class="btn btn-outline" style="display: block; text-align: center; padding: 0.8rem; margin-bottom: 0.5rem; text-decoration: none; border-color: var(--color-primary); color: var(--color-primary);">🏠 Mon Espace</a>' : ''}
            
            ${isAdmin ? '<button id="toggle-edit-btn" class="btn btn-outline" style="width: 100%; padding: 0.8rem; margin-bottom: 0.5rem;">✏️ Mode Édition: OFF</button>' : ''}
            
            <button id="logout-btn" class="btn btn-outline" style="width: 100%; padding: 0.8rem; color: var(--color-accent); border-color: var(--color-accent);">Se Déconnecter</button>
        `;

        authLinks.appendChild(userDiv);
        setupEventListeners(userDiv, isAdmin);
    }
    // 2. OLD Header Structure (Fallback for pages not yet updated)
    else if (actionContainer) {
        actionContainer.innerHTML = '';

        const userDiv = document.createElement('div');
        userDiv.className = 'user-menu-container';

        userDiv.innerHTML = `
            <div class="user-dropdown">
                <button class="user-btn" style="display: flex; align-items: center; gap: 0.5rem; background: transparent; border: 1px solid var(--color-primary); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">
                    <span class="user-icon">👤</span>
                    <span class="user-name" style="font-weight: 600; color: var(--color-primary);">${user.email?.split('@')[0] || 'User'}</span>
                </button>
                <div class="dropdown-content" style="text-align: left; min-width: 180px; right: 0; left: auto;">
                    ${isAdmin ? '<span class="admin-badge">Admin Mode</span>' : ''}
                    ${isAdmin ? '<a href="dashboard.html" class="btn-dashboard" style="display: block; width: 100%; padding: 0.6rem; text-decoration: none; color: inherit; font-weight: 500;">📊 Dashboard</a>' : ''}
                    ${!isAdmin ? '<a href="profile.html" class="btn-dashboard" style="display: block; width: 100%; padding: 0.6rem; text-decoration: none; color: inherit; font-weight: 500;">🏠 Mon Espace</a>' : ''}
                    ${isAdmin ? '<button id="toggle-edit-btn" class="btn-toggle-edit" style="width: 100%; text-align: left; background: none; border: none; padding: 0.6rem; cursor: pointer; color: inherit;">✏️ Mode Édition: OFF</button>' : ''}
                    <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid #eee;">
                    <button id="logout-btn" class="btn-logout" style="width: 100%; text-align: left; background: none; border: none; padding: 0.6rem; cursor: pointer; color: var(--color-accent);">Se Déconnecter</button>
                </div>
            </div>
        `;

        actionContainer.appendChild(userDiv);
        setupEventListeners(userDiv, isAdmin);
    }
}

function setupEventListeners(container, isAdmin) {
    // Logout
    const logoutBtn = container.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) console.error('Error signing out:', error);
            window.location.reload();
        });
    }

    // Toggle Edit
    if (isAdmin) {
        const toggleBtn = container.querySelector('#toggle-edit-btn');
        if (toggleBtn) {
            let editModeActive = false;
            toggleBtn.addEventListener('click', () => {
                editModeActive = !editModeActive;
                toggleBtn.textContent = editModeActive ? '✏️ Mode Édition: ON' : '✏️ Mode Édition: OFF';
                if (editModeActive) {
                    document.body.classList.add('edit-mode');
                    window.dispatchEvent(new CustomEvent('edit-mode-toggled', { detail: { active: true } }));
                } else {
                    document.body.classList.remove('edit-mode');
                    window.dispatchEvent(new CustomEvent('edit-mode-toggled', { detail: { active: false } }));
                }
            });
        }
    }
}

function removeUserMenu() {
    const existingMenu = document.querySelector('.user-menu-container');
    if (existingMenu) {
        existingMenu.remove();
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initAuth);

// Export for use in other modules
export { initAuth, checkUserRole };
