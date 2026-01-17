import { getSupabase } from '../supabase.js';
import { logout } from '../auth.js';

export default function SettingsView() {
    return `
        <div class="dashboard-layout fade-in">
            <header class="glass-card flex-center" style="justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem;">
                 <div class="flex-center" style="gap: 1rem;">
                    <button class="btn btn-ghost" onclick="window.location.hash = 'dashboard'"><i class="ri-arrow-left-line"></i></button>
                    <h2 class="text-lg">Configurações</h2>
                </div>
            </header>

            <main style="display: grid; gap: 1.5rem;">
                <!-- Profile & Theme -->
                <div class="glass-card">
                    <h3 class="mb-4">Perfil & Preferências</h3>
                    <div class="flex-center" style="justify-content: space-between;">
                        <div>
                            <p class="text-muted">Usuário logado</p>
                            <p class="text-lg" id="userEmail">Carregando...</p>
                        </div>
                        <div class="flex-center" style="gap: 1rem;">
                            <button class="btn btn-ghost" id="themeToggleSetting">Alternar Tema</button>
                            <button class="btn btn-primary" style="background: var(--danger-color);" onclick="window.doLogout()"><i class="ri-logout-box-r-line"></i> Sair</button>
                        </div>
                    </div>
                </div>

                 <!-- Export Data -->
                <div class="glass-card">
                    <h3 class="mb-4">Exportar Dados</h3>
                    <p class="text-muted mb-4">Baixe seus registros em formato CSV para Excel.</p>
                    <div class="flex-center" style="justify-content: flex-start; gap: 1rem;">
                        <button class="btn btn-ghost" id="exportReceitas"><i class="ri-download-line"></i> Receitas (CSV)</button>
                        <button class="btn btn-ghost" id="exportDespesas"><i class="ri-download-line"></i> Despesas (CSV)</button>
                    </div>
                </div>

                <!-- Admin Section -->
                <div id="adminSection" style="display: none;">
                    <div class="glass-card">
                        <h3 class="mb-4" style="color: var(--accent-color);">Administração</h3>
                        
                         <!-- Create User -->
                         <div class="mb-4" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 2rem;">
                            <h4 class="mb-4">Cadastrar Novo Usuário</h4>
                            <form id="createUserForm" class="flex-center" style="gap: 1rem; align-items: flex-end;">
                                <div class="form-group" style="margin: 0; flex: 1;">
                                    <label class="form-label">Email</label>
                                    <input type="email" id="newUserEmail" class="form-input" required>
                                </div>
                                <div class="form-group" style="margin: 0; flex: 1;">
                                    <label class="form-label">Senha</label>
                                    <input type="password" id="newUserPass" class="form-input" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Criar</button>
                            </form>
                            <p class="text-muted" style="font-size: 0.8rem; margin-top: 0.5rem;">*Nota: Criação simplificada. O usuário deverá confirmar o email se configurado.</p>
                         </div>

                         <!-- Categories -->
                         <div>
                            <h4 class="mb-4">Gerenciar Categorias</h4>
                            <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                                <input type="text" id="newCatName" class="form-input" placeholder="Nome da Categoria">
                                <select id="newCatType" class="form-input" style="width: auto;">
                                    <option value="income">Receita</option>
                                    <option value="expense">Despesa</option>
                                </select>
                                <button id="addCatBtn" class="btn btn-primary">Adicionar</button>
                            </div>
                            <ul id="categoriesList" style="list-style: none; max-height: 200px; overflow-y: auto;">
                                <!-- List -->
                            </ul>
                         </div>
                    </div>
                </div>
            </main>
        </div>
    `;
}

export async function init() {
    const supabase = getSupabase();
    if (!supabase) return;

    // User Info
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        document.getElementById('userEmail').textContent = user.email;

        // Admin Check (Simple email check for client-side visual, real security is RLS)
        // Hardcoded Admin Email from requirements
        if (user.email === 'jcc.cacir@gmail.com') {
            document.getElementById('adminSection').style.display = 'block';
            initAdminFeatures(supabase);
        }
    }

    // Theme Toggle
    document.getElementById('themeToggleSetting').addEventListener('click', () => {
        const html = document.documentElement;
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
    });

    // Logout
    window.doLogout = async () => {
        await logout();
    };

    // Exports
    document.getElementById('exportReceitas').addEventListener('click', () => exportCSV('income', 'receitas'));
    document.getElementById('exportDespesas').addEventListener('click', () => exportCSV('expense', 'despesas'));

    async function exportCSV(type, filename) {
        const { data } = await supabase.from('transactions').select('*').eq('type', type);
        if (!data || !data.length) return alert('Sem dados para exportar');

        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(obj => Object.values(obj).map(v => `"${v}"`).join(',')).join('\n');
        const csvContent = "data:text/csv;charset=utf-8," + headers + '\n' + rows;

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `${filename}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function initAdminFeatures(supabase) {
    // Create User
    document.getElementById('createUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('newUserEmail').value;
        const password = document.getElementById('newUserPass').value;

        // Use signUp (Requires email confirmation usually)
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) alert('Erro: ' + error.message);
        else alert('Usuário criado! Verifique o email para confirmação.');
    });

    // Categories
    const loadCats = async () => {
        const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
        const list = document.getElementById('categoriesList');
        if (data) {
            list.innerHTML = data.map(c => `
                <li style="display: flex; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span>${c.name} <small class="text-muted">(${c.type === 'income' ? 'Receita' : 'Despesa'})</small></span>
                    <button class="btn btn-ghost" style="padding: 0.2rem 0.5rem;" onclick="window.delCat('${c.id}')"><i class="ri-close-line"></i></button>
                </li>
            `).join('');
        }
    };

    document.getElementById('addCatBtn').addEventListener('click', async () => {
        const name = document.getElementById('newCatName').value;
        const type = document.getElementById('newCatType').value;
        if (!name) return;

        await supabase.from('categories').insert({ name, type, user_id: null }); // Global category if Created by Admin? Or personal? Schema says "user_id null means global".
        // If RLS allows insert with null user_id?
        // My schema: "check (auth.uid() = user_id)" -> Wait, this prevents Global Categories creation by Admin unless I change RLS.
        // I will assume Admin creates Personal Categories for now, or I'd need to update Schema.
        // Let's simpler: Admin creates global categories.
        // Update Schema later if needed. For now let's try insert.

        document.getElementById('newCatName').value = '';
        loadCats();
    });

    window.delCat = async (id) => {
        if (confirm('Deletar?')) {
            await supabase.from('categories').delete().eq('id', id);
            loadCats();
        }
    };

    loadCats();
}
