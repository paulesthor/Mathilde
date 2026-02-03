import { supabase } from './config.js';

// Check admin access
async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'login.html';
        return false;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        alert('Accès refusé: Admin uniquement');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Load dashboard data
// Load logic for Messaging and Appointments

// Make functions available globally for HTML buttons
window.loadMessages = loadMessages;
window.loadAppointments = loadAppointments;
window.loadReviews = loadReviews;
window.markMessageRead = markMessageRead;
window.toggleReviewStatus = toggleReviewStatus;
window.deleteReview = deleteReview;
window.openAppModal = openAppModal; // Added

// MAIN LOAD FUNCTION UPDATE
async function loadDashboard() {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    await Promise.all([
        loadStatistics(),
        loadCustomers(),
        loadActivityFeed(),
        loadMessages(),
        loadAppointments(),
        loadReviews()
    ]);
}

// ... existing Statistics, Messages, Appointments code ... (keep unchanged, only add Reviews below)

// REVIEWS LOGIC
async function loadReviews() {
    const container = document.getElementById('reviews-mod-list');
    container.innerHTML = '<p style="text-align:center;">Chargement...</p>';

    try {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 2rem; color: #999;">Aucun avis reçu.</p>';
            return;
        }

        container.innerHTML = data.map(review => `
            <div class="review-card ${!review.is_approved ? 'pending' : ''}" style="border: 1px solid #eee; padding: 1rem; border-radius: 8px; background: ${!review.is_approved ? '#fffaf5' : 'white'}; border-left: ${!review.is_approved ? '4px solid #b7791f' : '1px solid #eee'};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div>
                        <strong>${review.author_name}</strong>
                        <span style="color: #fbbf24;">${'★'.repeat(review.rating)}</span>
                        <div style="font-size: 0.85rem; color: #999;">${new Date(review.created_at).toLocaleDateString()} - <span style="font-weight:600; color:${review.is_approved ? 'green' : 'orange'}">${review.is_approved ? 'PUBLIC' : 'EN ATTENTE'}</span></div>
                    </div>
                    <div>
                        ${!review.is_approved ?
                `<button onclick="toggleReviewStatus(${review.id}, true)" class="btn-small" style="background:green; color:white;">Approuver</button>` :
                `<button onclick="toggleReviewStatus(${review.id}, false)" class="btn-small" style="background:orange; color:white;">Masquer</button>`
            }
                        <button onclick="deleteReview(${review.id})" class="btn-small" style="background:#c53030; color:white; margin-left: 0.5rem;">Supprimer</button>
                    </div>
                </div>
                <div style="color: #444; white-space: pre-wrap;">${review.comment}</div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erreur: ${error.message}</p>`;
    }
}

async function toggleReviewStatus(id, newStatus) {
    await supabase.from('reviews').update({ is_approved: newStatus }).eq('id', id);
    loadReviews();
}

async function deleteReview(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;
    await supabase.from('reviews').delete().eq('id', id);
    loadReviews();
}

// Load statistics
async function loadStatistics() {
    try {
        // Customers
        const { count: totalCustomers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');
        document.getElementById('total-customers').textContent = totalCustomers || 0;

        // Unread Messages
        const { count: unreadMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'unread');
        document.getElementById('unread-messages').textContent = unreadMessages || 0;

        // Badge Messages
        const badgeMsg = document.getElementById('badge-messages');
        if (badgeMsg) badgeMsg.style.display = (unreadMessages > 0) ? 'block' : 'none';

        // Pending Appointments
        const { count: pendingApps } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        document.getElementById('pending-appointments').textContent = pendingApps || 0;

        // Badge Appointments
        const badgeApp = document.getElementById('badge-appointments');
        if (badgeApp) badgeApp.style.display = (pendingApps > 0) ? 'block' : 'none';

        // Pending Reviews (Reviews not approved yet)
        const { count: pendingReviews } = await supabase
            .from('reviews')
            .select('*', { count: 'exact', head: true })
            .eq('is_approved', false);

        // Badge Reviews
        const badgeRev = document.getElementById('badge-reviews');
        if (badgeRev) badgeRev.style.display = (pendingReviews > 0) ? 'block' : 'none';

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// MESSAGES LOGIC
async function loadMessages() {
    const container = document.getElementById('messages-list');
    container.innerHTML = '<p style="text-align:center;">Chargement...</p>';

    try {
        // Fetch only ROOT messages (not replies) or all? 
        // For simplicity, fetch all messages addressed to Admin (recipient is null OR matches admin email - handled by RLS)
        // Ideally: Fetch message where type='contact' OR type='quote' AND parent_id is null?
        // Let's stick to simple list for now.
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .is('parent_id', null) // Only show main threads
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 2rem; color: #999;">Aucun message reçu.</p>';
            return;
        }

        container.innerHTML = data.map(msg => `
            <div class="message-card ${msg.status === 'unread' ? 'unread' : ''}" style="border: 1px solid #eee; padding: 1rem; border-radius: 8px; background: ${msg.status === 'unread' ? '#fffaf5' : 'white'}; border-left: ${msg.status === 'unread' ? '4px solid var(--color-primary)' : '1px solid #eee'};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <div>
                        <strong>${msg.sender_name}</strong> <span style="color: #666; font-size: 0.9rem;">(${msg.sender_email})</span>
                        <div style="font-size: 0.85rem; color: #999;">${formatDate(msg.created_at)}</div>
                    </div>
                    <div>
                        ${msg.status === 'unread' ? `<button onclick="markMessageRead('${msg.id}')" class="btn-small" style="background: white; border: 1px solid #ddd;">Marquer lu</button>` : '<span style="color:green; font-size:0.8rem;">✓ Lu</span>'}
                    </div>
                </div>
                <div style="font-weight: 600; margin-bottom: 0.25rem;">${msg.subject}</div>
                <div style="color: #444; white-space: pre-wrap; margin-bottom: 1rem;">${msg.content}</div>
                
                <div style="margin-top: 0.5rem; text-align: right;">
                     <button onclick="openReplyModal('${msg.id}', '${msg.sender_email}', '${msg.subject.replace(/'/g, "\\'")}')" class="btn-small btn-primary">Répondre</button>
                     <a href="mailto:${msg.sender_email}?subject=Re: ${msg.subject}" class="btn-small btn-outline" style="text-decoration: none; margin-left:0.5rem;">Email externe</a>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Erreur: ${error.message}</p>`;
    }
}

async function markMessageRead(id) {
    await supabase.from('messages').update({ status: 'read' }).eq('id', id);
    loadMessages();
    loadStatistics();
}

// Reply Functions
window.openReplyModal = (id, email, subject) => {
    document.getElementById('reply-parent-id').value = id;
    document.getElementById('reply-recipient').value = email;
    document.getElementById('reply-subject-orig').value = subject;
    document.getElementById('reply-modal').style.display = 'flex';
};

document.getElementById('reply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const parentId = document.getElementById('reply-parent-id').value;
    const recipient = document.getElementById('reply-recipient').value;
    const subject = document.getElementById('reply-subject-orig').value;
    const content = document.getElementById('reply-content').value;

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Send Reply
    const { error } = await supabase.from('messages').insert({
        sender_name: 'Mathilde Gest (Admin)',
        sender_email: user.email,
        recipient_email: recipient,
        parent_id: parentId, // Linked to original message
        subject: `Re: ${subject}`,
        content: content,
        type: 'contact',
        status: 'unread'
    });

    if (error) {
        alert('Erreur: ' + error.message);
        return;
    }

    // 2. Mark original as replied
    await supabase.from('messages').update({ status: 'replied' }).eq('id', parentId);

    alert('Réponse envoyée !');
    document.getElementById('reply-modal').style.display = 'none';
    document.getElementById('reply-form').reset();
    loadMessages();
});


// APPOINTMENTS LOGIC
async function loadAppointments() {
    const tbody = document.getElementById('appointments-body');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Chargement...</td></tr>';

    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .order('requested_date', { ascending: true })
            .limit(20);

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #999;">Aucun rendez-vous.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(app => `
            <tr>
                <td>
                    <strong>${app.client_name}</strong><br>
                    <small>${app.client_email}</small>
                </td>
                <td>
                    ${new Date(app.requested_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    ${app.reschedule_status === 'proposed' ? '<br><span style="color:#b7791f; font-size:0.8rem;">📅 Nouv. prop.: ' + new Date(app.proposed_date).toLocaleString('fr-FR') + '</span>' : ''}
                </td>
                <td><small>${app.message || '-'}</small></td>
                <td>
                    <span class="status-badge ${app.status}" style="padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; background: ${app.status === 'confirmed' ? '#e6fffa' : (app.status === 'cancelled' ? '#fff5f5' : '#fffaf0')}; color: ${app.status === 'confirmed' ? '#047857' : (app.status === 'cancelled' ? '#c53030' : '#b7791f')}">
                        ${app.status === 'confirmed' ? 'Confirmé' : (app.status === 'cancelled' ? 'Annulé' : 'En attente')}
                    </span>
                </td>
                <td>
                    <button onclick="openAppModal('${app.id}', '${app.client_email}')" class="btn-small" style="background:var(--color-primary); color:white;">Gérer</button>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="5" style="color: red;">Erreur: ${error.message}</td></tr>`;
    }
}

// Manage Appointment Modal
window.openAppModal = (id, email) => {
    document.getElementById('app-id').value = id;
    document.getElementById('app-client-email').value = email;
    document.getElementById('appointment-modal').style.display = 'flex';
};

document.getElementById('appointment-manage-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('app-id').value;
    const clientEmail = document.getElementById('app-client-email').value;
    const action = document.getElementById('app-action').value;
    const message = document.getElementById('app-message').value;
    const newDate = document.getElementById('app-new-date').value;

    const { data: { user } } = await supabase.auth.getUser();

    const updateData = {};

    // Logic based on action
    if (action === 'confirmed') updateData.status = 'confirmed';
    if (action === 'cancelled') updateData.status = 'cancelled';
    if (action === 'proposed') {
        if (!newDate) { alert('Veuillez choisir une date.'); return; }
        updateData.reschedule_status = 'proposed';
        updateData.proposed_date = new Date(newDate).toISOString();
    }

    if (message) {
        updateData.admin_response = message;
    }

    // 1. Update Appointment
    const { error } = await supabase.from('appointments').update(updateData).eq('id', id);

    if (error) {
        alert('Erreur update: ' + error.message);
        return;
    }

    // 2. (Optional) Send Notification Message
    if (message) {
        await supabase.from('messages').insert({
            sender_name: 'Mathilde Gest (Admin)',
            sender_email: user.email,
            recipient_email: clientEmail,
            subject: `Mise à jour RDV: ${action === 'confirmed' ? 'Confirmé' : (action === 'cancelled' ? 'Annulé' : 'Nouvelle date')}`,
            content: `Bonjour,\n\nVotre demande de rendez-vous a été mise à jour.\nStatut: ${action}\nMessage: ${message}\n\nCordialement,`,
            type: 'contact',
            status: 'unread'
        });
    }

    alert('Mise à jour effectuée !');
    document.getElementById('appointment-modal').style.display = 'none';
    document.getElementById('appointment-manage-form').reset();
    loadAppointments();
    loadStatistics();
});

// Load customers
let allCustomers = [];

async function loadCustomers() {
    try {
        // Try to fetch with full_name
        let { data: customers, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, city, created_at, customer_notes')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });

        if (error) {
            // If column does not exist, retry without full_name
            if (error.message && error.message.includes('full_name does not exist')) {
                console.warn('Column full_name missing, retrying without it. Please run migration-customer-profiles.sql');
                const retry = await supabase
                    .from('profiles')
                    .select('id, email, created_at') // Fallback minimal fields
                    .eq('role', 'customer')
                    .order('created_at', { ascending: false });

                if (retry.error) throw retry.error;

                // Map results to include placeholders
                customers = retry.data.map(c => ({
                    ...c,
                    full_name: 'Non défini (Schema outdated)',
                    phone: '-',
                    city: '-',
                    customer_notes: ''
                }));
            } else {
                throw error;
            }
        }

        allCustomers = customers || [];
        displayCustomers(allCustomers);

    } catch (error) {
        console.error('Error loading customers:', error);
        document.getElementById('customer-table-body').innerHTML = `
            <tr><td colspan="6" style="text-align: center; color: #c62828;">
                Erreur de chargement: ${error.message}
            </td></tr>
        `;
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customer-table-body');

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align: center; padding: 2rem; color: #999;">
                Aucun client trouvé
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.full_name || 'Non renseigné'}</strong></td>
            <td>${customer.email}</td>
            <td>${customer.phone || '-'}</td>
            <td>${customer.city || '-'}</td>
            <td>${formatDate(customer.created_at)}</td>
            <td>
                <button class="btn-small" onclick="viewCustomerDetails('${customer.id}')">👁️ Voir</button>
                <button class="btn-small btn-email" onclick="emailCustomer('${customer.email}')">✉️</button>
            </td>
        </tr>
    `).join('');
}

// Search customers
document.getElementById('search-customers')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    if (!searchTerm) {
        displayCustomers(allCustomers);
        return;
    }

    const filtered = allCustomers.filter(customer =>
        (customer.full_name?.toLowerCase().includes(searchTerm)) ||
        (customer.email?.toLowerCase().includes(searchTerm)) ||
        (customer.phone?.includes(searchTerm)) ||
        (customer.city?.toLowerCase().includes(searchTerm))
    );

    displayCustomers(filtered);
});

// Export to CSV
document.getElementById('export-csv')?.addEventListener('click', () => {
    if (allCustomers.length === 0) {
        alert('Aucun client à exporter');
        return;
    }

    const csvContent = convertToCSV(allCustomers);
    downloadCSV(csvContent, 'clients-mathilde-gest.csv');
});

function convertToCSV(customers) {
    const headers = ['Nom', 'Email', 'Téléphone', 'Adresse', 'Code Postal', 'Ville', 'Date Inscription', 'Notes'];
    const rows = customers.map(c => [
        c.full_name || '',
        c.email || '',
        c.phone || '',
        c.address || '',
        c.postal_code || '',
        c.city || '',
        formatDate(c.created_at),
        c.customer_notes || ''
    ]);

    const csvRows = [headers, ...rows].map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    );

    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Load activity feed
// Load activity feed
async function loadActivityFeed() {
    const feed = document.getElementById('activity-feed');

    try {
        // Get recent customers - fetch email too for fallback
        const { data: recentCustomers, error } = await supabase
            .from('profiles')
            .select('full_name, email, created_at')
            .eq('role', 'customer')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!recentCustomers || recentCustomers.length === 0) {
            feed.innerHTML = '<p style="text-align: center; color: #999;">Aucune activité récente</p>';
            return;
        }

        feed.innerHTML = recentCustomers.map(customer => `
            <div class="activity-item">
                <div class="activity-icon">✨</div>
                <div class="activity-content">
                    <p><strong>${customer.full_name || customer.email || 'Nouveau client'}</strong> s'est inscrit</p>
                    <small>${formatRelativeTime(customer.created_at)}</small>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        feed.innerHTML = `<p style="text-align: center; color: #c62828;">Erreur: ${error.message}</p>`;
    }
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return formatDate(dateString);
}

// Global functions for inline buttons
window.viewCustomerDetails = (customerId) => {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;

    alert(`Détails du client:\n\nNom: ${customer.full_name}\nEmail: ${customer.email}\nTéléphone: ${customer.phone || 'Non renseigné'}\nAdresse: ${customer.address || 'Non renseignée'}\nVille: ${customer.city || 'Non renseignée'}\nCode Postal: ${customer.postal_code || 'Non renseigné'}\nNotes: ${customer.customer_notes || 'Aucune note'}`);
};

window.emailCustomer = (email) => {
    window.location.href = `mailto:${email}`;
};

// Initialize on load
loadDashboard();
