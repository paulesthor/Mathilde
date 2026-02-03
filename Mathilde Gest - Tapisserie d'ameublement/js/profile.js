import { supabase } from './config.js';

async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Load User Name
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

    if (profile?.full_name) {
        document.getElementById('welcome-msg').textContent = `Bienvenue, ${profile.full_name}.`;
    }

    // Load Data
    await Promise.all([
        loadMyAppointments(user.email),
        loadMyMessages(user.email)
    ]);
}

async function loadMyAppointments(email) {
    const tbody = document.getElementById('my-appointments');

    try {
        const { data, error } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_email', email)
            .order('requested_date', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Aucun rendez-vous.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(app => `
            <tr>
                <td>${new Date(app.requested_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                <td>${app.message || '-'}</td>
                <td>
                    <span class="status-badge status-${app.status}">
                        ${app.status === 'confirmed' ? 'Confirmé' : (app.status === 'cancelled' ? 'Annulé' : 'En attente')}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading appointments:', error);
        tbody.innerHTML = `<tr><td colspan="3" style="color: red;">Erreur chargement.</td></tr>`;
    }
}

async function loadMyMessages(email) {
    const tbody = document.getElementById('my-messages');

    try {
        // NOTE: This assumes RLS allows reading own messages by sender_email
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('sender_email', email)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Aucun message envoyé.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(msg => `
            <tr>
                <td>${new Date(msg.created_at).toLocaleDateString()}</td>
                <td>${msg.subject}</td>
                <td>
                    <span class="status-badge status-${msg.status}">
                        ${msg.status === 'replied' ? 'Répondu' : (msg.status === 'read' ? 'Lu' : 'Envoyé')}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading messages:', error);
        // If error is permission denied, it confirms RLS update is needed
        tbody.innerHTML = `<tr><td colspan="3" style="color: red;">Erreur: ${error.message} (RLS check needed)</td></tr>`;
    }
}

loadProfile();
