import { login } from '../auth.js';

export default function LoginView() {
    return `
        <div class="flex-center" style="min-height: 100vh;">
            <div class="glass-card" style="width: 100%; max-width: 400px; animation: fadeIn 0.5s ease;">
                <h2 class="text-xl text-center mb-4">Bem-vindo</h2>
                <p class="text-center text-muted form-group">Entre para gerenciar suas finanças</p>
                
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" id="email" class="form-input" placeholder="seu@email.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Senha</label>
                        <input type="password" id="password" class="form-input" placeholder="••••••••" required>
                    </div>

                    <button type="submit" class="btn btn-primary w-full flex-center" id="submitBtn">
                        <span id="btnText">Entrar</span>
                        <i class="ri-arrow-right-line" id="btnIcon"></i>
                        <div class="spinner" id="btnSpinner" style="width: 20px; height: 20px; border-width: 2px; display: none; margin: 0;"></div>
                    </button>
                    
                    <div id="loginError" class="text-center mt-4" style="color: var(--danger-color); display: none;"></div>
                </form>

            </div>
        </div>
    `;
}

export function init() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDisplay = document.getElementById('loginError');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const btnSpinner = document.getElementById('btnSpinner');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Loading State
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnIcon.style.display = 'none';
        btnSpinner.style.display = 'block';
        errorDisplay.style.display = 'none';

        const { data, error } = await login(emailInput.value, passwordInput.value);

        if (error) {
            errorDisplay.textContent = error.message || 'Erro ao entrar. Verifique suas credenciais.';
            errorDisplay.style.display = 'block';

            // Reset State
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnIcon.style.display = 'block';
            btnSpinner.style.display = 'none';
        } else {
            // Success
            window.location.hash = 'dashboard';
        }
    });
}
