import { supabase } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {

    // Auto-fill forms if logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
        // Message Form
        const emailInput = document.querySelector('input[name="email"]');
        if (emailInput) {
            emailInput.value = user.email;
            emailInput.readOnly = true;
            emailInput.style.background = '#f9f9f9';
        }

        // Appointment Form
        const clientEmailInput = document.querySelector('input[name="client_email"]');
        if (clientEmailInput) {
            clientEmailInput.value = user.email;
            clientEmailInput.readOnly = true;
            clientEmailInput.style.background = '#f9f9f9';
        }

        // Also try to fill name from Profile
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
        if (profile?.full_name) {
            const nameInput = document.querySelector('input[name="name"]');
            if (nameInput) nameInput.value = profile.full_name;

            const clientNameInput = document.querySelector('input[name="client_name"]');
            if (clientNameInput) clientNameInput.value = profile.full_name;
        }
    }

    // --- Message Form Handling ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const feedback = document.getElementById('contact-feedback');

            btn.disabled = true;
            btn.textContent = 'Envoi en cours...';
            feedback.innerHTML = '';

            const formData = new FormData(contactForm);

            try {
                const { error } = await supabase
                    .from('messages')
                    .insert({
                        sender_name: formData.get('name'),
                        sender_email: formData.get('email'),
                        subject: formData.get('subject'),
                        content: formData.get('content'),
                        type: 'contact',
                        status: 'unread'
                    });

                if (error) throw error;

                feedback.innerHTML = '<span style="color: green;">✅ Message envoyé avec succès! Nous vous répondrons sous 24h.</span>';
                contactForm.reset();
            } catch (error) {
                console.error('Error sending message:', error);
                feedback.innerHTML = '<span style="color: #c62828;">❌ Erreur lors de l\'envoi. Veuillez réessayer.</span>';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Envoyer';
            }
        });
    }

    // --- Appointment Form Handling ---
    const rdvForm = document.getElementById('appointment-form');
    if (rdvForm) {
        rdvForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = rdvForm.querySelector('button');
            const feedback = document.getElementById('rdv-feedback');

            btn.disabled = true;
            btn.textContent = 'Envoi en cours...';
            feedback.innerHTML = '';

            const formData = new FormData(rdvForm);

            try {
                const { error } = await supabase
                    .from('appointments')
                    .insert({
                        client_name: formData.get('client_name'),
                        client_email: formData.get('client_email'),
                        client_phone: formData.get('client_phone'),
                        requested_date: new Date(formData.get('requested_date')).toISOString(),
                        message: formData.get('message'),
                        status: 'pending'
                    });

                if (error) throw error;

                feedback.innerHTML = '<span style="color: green;">✅ Demande de rendez-vous envoyée! Vous recevrez une confirmation par email.</span>';
                rdvForm.reset();
            } catch (error) {
                console.error('Error requesting appointment:', error);
                feedback.innerHTML = '<span style="color: #c62828;">❌ Erreur. Vérifiez les champs et réessayez.</span>';
            } finally {
                btn.disabled = false;
                btn.textContent = 'Demander le Rendez-vous';
            }
        });
    }
});
