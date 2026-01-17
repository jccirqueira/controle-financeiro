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
                    <div class="flex-center" style="justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <p class="text-muted">Usuário logado</p>
                            <p class="text-lg" id="userEmail">Carregando...</p>
                        </div>
                        
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Meta de Gastos Mensal (R$)</label>
                            <div class="flex-center" style="gap: 0.5rem;">
                                <input type="number" id="monthlyGoalInput" class="form-input" style="width: 150px;">
                                <button class="btn btn-primary" id="saveGoalBtn">Salvar</button>
                            </div>
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
                    <p class="text-muted mb-4">Baixe seus registros em formato XLS para Excel.</p>
                    <div class="flex-center" style="justify-content: flex-start; gap: 1rem;">
                        <button class="btn btn-ghost" id="exportReceitas"><i class="ri-download-line"></i> Receitas (XLS)</button>
                        <button class="btn btn-ghost" id="exportDespesas"><i class="ri-download-line"></i> Despesas (XLS)</button>
                    </div>
                </div>

                <!-- Reset Data -->
                <div class="glass-card">
                    <h3 class="mb-4" style="color: var(--danger-color);">Zona de Perigo</h3>
                    <p class="text-muted mb-4">Atenção: Esta ação apagará TODOS os seus lançamentos (Receitas, Despesas, Energia e Metas) e é irreversível.</p>
                    <button class="btn btn-primary" style="background: var(--danger-color); width: 100%;" id="resetDataBtn"><i class="ri-alert-line"></i> ZERAR DADOS DO APLICATIVO</button>
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

        // Load Goal
        const { data: profile } = await supabase.from('profiles').select('monthly_goal').eq('id', user.id).single();
        if (profile) {
            document.getElementById('monthlyGoalInput').value = profile.monthly_goal || 2000;
        }

        // Save Goal
        document.getElementById('saveGoalBtn').addEventListener('click', async () => {
            const newGoal = Number(document.getElementById('monthlyGoalInput').value); // Ensure number

            // Use upsert to handle cases where profile row might not exist yet
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                monthly_goal: newGoal,
                email: user.email // Ensure email is present if creating
            });

            if (error) {
                console.error('Save goal error:', error);
                alert('Erro ao salvar meta: ' + error.message);
            } else {
                alert('Meta atualizada com sucesso!');
            }
        });

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
    document.getElementById('exportReceitas').addEventListener('click', () => exportData('income', 'receitas'));
    document.getElementById('exportDespesas').addEventListener('click', () => exportData('expense', 'despesas'));

    // Reset Data Logic
    document.getElementById('resetDataBtn').addEventListener('click', async () => {
        if (!confirm('TEM CERTEZA ABSOLUTA? Isso apagará todas as suas receitas, despesas e registros de energia. Não há como desfazer.')) return;

        const userId = user.id;

        // Delete from all user tables (RLS policies will ensure only own data is deleted, but explicit eq is safer)
        const p1 = supabase.from('transactions').delete().eq('user_id', userId);
        const p2 = supabase.from('energy_logs').delete().eq('user_id', userId);
        const p3 = supabase.from('goals').delete().eq('user_id', userId);

        await Promise.all([p1, p2, p3]);

        alert('Todos os dados foram apagados com sucesso.');
        window.location.hash = 'dashboard';
    });

    async function exportData(type, filename) {
        const { data } = await supabase.from('transactions')
            .select('date, amount, description') // Select only required columns
            .eq('type', type)
            .order('date', { ascending: false }); // Sort by date

        if (!data || !data.length) return alert('Sem dados para exportar');

        // Headers Map
        const headers = ['Data', 'Valor (R$)', 'Descrição'];

        // Create HTML Table for Excel
        let table = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="UTF-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>${filename}</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
            </head>
            <body>
            <table border="1">
                <thead>
                    <tr>${headers.map(h => `<th style="background-color: #f0f0f0; font-weight: bold;">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => {
            // Format Date (YYYY-MM-DD -> DD/MM/YYYY)
            const [y, m, d] = row.date.split('-');
            const dateBr = `${d}/${m}/${y}`;

            // Format Currency (Raw number for Excel is better, let Excel handle format via style if needed, 
            // but simple text is safer for simple XLS)
            const amountBr = Number(row.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

            return `<tr>
                            <td>${dateBr}</td>
                            <td>${amountBr}</td>
                            <td>${row.description || ''}</td>
                        </tr>`;
        }).join('')}
                </tbody>
            </table>
            </body></html>
        `;

        const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename}_export.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

        const { error } = await supabase.from('categories').insert({ name, type, user_id: null });

        if (error) {
            alert('Erro ao adicionar categoria: ' + error.message);
        } else {
            document.getElementById('newCatName').value = '';
            loadCats();
        }
    });

    window.delCat = async (id) => {
        if (confirm('Deletar?')) {
            await supabase.from('categories').delete().eq('id', id);
            loadCats();
        }
    };

    loadCats();
}
