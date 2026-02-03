import { supabase } from './config.js';

const signupForm = document.getElementById('signup-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
}

async function handleSignup(e) {
    e.preventDefault();

    errorMessage.textContent = '';
    successMessage.textContent = '';

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm_password');
        const fullName = formData.get('full_name');

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        if (password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

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
            throw new Error('Error creating account');
        }

        // Update profile
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                full_name: fullName
            })
            .eq('id', authData.user.id);

        if (profileError) console.error('Error updating profile:', profileError);

        successMessage.textContent = 'Account created! Redirecting...';

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);

    } catch (error) {
        console.error('Signup error:', error);
        errorMessage.textContent = error.message;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
    }
}
