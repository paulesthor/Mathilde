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
async function loadDashboard() {
    const isAdmin = await checkAdminAccess();
    if (!isAdmin) return;

    await Promise.all([
        loadStatistics(),
        loadCustomers(),
        loadActivityFeed()
    ]);
}

// Load statistics
async function loadStatistics() {
    try {
        // Total customers
        const { count: totalCustomers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        document.getElementById('total-customers').textContent = totalCustomers || 0;

        // New this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: newThisMonth } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('created_at', startOfMonth.toISOString());

        document.getElementById('new-this-month').textContent = newThisMonth || 0;

    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load customers
let allCustomers = [];

async function loadCustomers() {
    try {
        let { data: customers, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, phone, city, created_at, customer_notes')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });

        if (error) {
            if (error.message && error.message.includes('full_name does not exist')) {
                console.warn('Column full_name missing, retrying without it.');
                const retry = await supabase
                    .from('profiles')
                    .select('id, email, created_at')
                    .eq('role', 'customer')
                    .order('created_at', { ascending: false });

                if (retry.error) throw retry.error;
                customers = retry.data.map(c => ({
                    ...c,
                    full_name: 'Non défini',
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
            <tr><td colspan="5" style="text-align: center; color: #c62828;">
                Error: ${error.message}
            </td></tr>
        `;
    }
}

function displayCustomers(customers) {
    const tbody = document.getElementById('customer-table-body');

    if (!customers || customers.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" style="text-align: center; padding: 2rem; color: #999;">
                No users found
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>${customer.full_name || 'N/A'}</strong></td>
            <td>${customer.email}</td>
            <td>${customer.role || 'customer'}</td>
            <td>${formatDate(customer.created_at)}</td>
            <td>
                <button class="btn-small" onclick="viewCustomerDetails('${customer.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

// Load activity feed
async function loadActivityFeed() {
    const feed = document.getElementById('activity-feed');

    try {
        const { data: recentCustomers, error } = await supabase
            .from('profiles')
            .select('full_name, email, created_at')
            .eq('role', 'customer')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        if (!recentCustomers || recentCustomers.length === 0) {
            feed.innerHTML = '<p style="text-align: center; color: #999;">No recent activity</p>';
            return;
        }

        feed.innerHTML = recentCustomers.map(customer => `
            <div class="activity-item">
                <div class="activity-content">
                    <p><strong>${customer.full_name || customer.email || 'New User'}</strong> signed up</p>
                    <small>${formatRelativeTime(customer.created_at)}</small>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity:', error);
        feed.innerHTML = `<p style="text-align: center; color: #c62828;">Error: ${error.message}</p>`;
    }
}

// Helpers
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
}

function formatRelativeTime(dateString) {
    return formatDate(dateString); // Simplified
}

window.viewCustomerDetails = (customerId) => {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;
    alert(`Details:\n\nName: ${customer.full_name}\nEmail: ${customer.email}\nPhone: ${customer.phone}`);
};

// Initialize
loadDashboard();
