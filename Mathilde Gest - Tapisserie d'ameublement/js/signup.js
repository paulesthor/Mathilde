import { supabase } from './config.js';

const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

signupForm.addEventListener('submit', handleSignup);

async function handleSignup(e) {
    e.preventDefault();

    // Clear previous messages
    errorMessage.textContent = '';
    successMessage.textContent = '';

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Création en cours...';

    try {
        // Get form data
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        const fullName = formData.get('full_name');
        const phone = formData.get('phone');
        const address = formData.get('address');
        const postalCode = formData.get('postal_code');
        const city = formData.get('city');

        // Validate passwords match
        if (password !== confirmPassword) {
            throw new Error('Les mots de passe ne correspondent pas');
        }

        // Validate password strength
        if (password.length < 8) {
            throw new Error('Le mot de passe doit contenir au moins 8 caractères');
        }

        // 1. Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName
                }
            }
        });

        if (authError) throw authError;

        if (!authData.user) {
            throw new Error('Erreur lors de la création du compte');
        }

        // 2. Update profile with additional information
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                phone: phone || null,
                address: address || null,
                postal_code: postalCode || null,
                city: city || null
            })
            .eq('id', authData.user.id);

        if (profileError) {
            console.error('Error updating profile:', profileError);
            // Don't throw - account is created, profile update is secondary
        }

        // Success!
        successMessage.textContent = 'Compte créé avec succès! Redirection...';

        // Redirect to login after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);

        // User-friendly error messages
        let message = error.message;
        if (message.includes('already registered')) {
            message = 'Cet email est déjà utilisé';
        } else if (message.includes('Invalid email')) {
            message = 'Adresse email invalide';
        } else if (message.includes('Password')) {
            message = 'Le mot de passe doit contenir au moins 8 caractères';
        }

        errorMessage.textContent = message;

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer mon Compte';
    }
}

// Real-time password validation
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');

confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
    } else {
        confirmPasswordInput.setCustomValidity('');
    }
});
