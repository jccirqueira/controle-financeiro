import { getSupabase } from '../supabase.js';

export default function TransactionsView() {
    const type = window.location.hash === '#receitas' ? 'Receitas' : 'Despesas';
    const isExpense = type === 'Despesas';
    const colorClass = isExpense ? 'text-danger' : 'text-success';

    return `
        <div class="dashboard-layout fade-in">
            <header class="glass-card flex-center" style="justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem;">
                <div class="flex-center" style="gap: 1rem;">
                    <button class="btn btn-ghost" onclick="window.location.hash = 'dashboard'"><i class="ri-arrow-left-line"></i></button>
                    <h2 class="text-lg">${type}</h2>
                </div>
                <button class="btn btn-primary" id="addBtn"><i class="ri-add-line"></i> Nova ${type.slice(0, -1)}</button>
            </header>

            <main>
                <!-- Filter Bar -->
                <div class="glass-card mb-4 flex-center" style="justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                    <div class="flex-center" style="gap: 1rem;">
                        <input type="month" id="monthFilter" class="form-input" style="width: auto;">
                    </div>
                    <div class="flex-center" style="gap: 1rem;">
                       <span class="text-muted">Total: <strong class="${colorClass}" id="totalDisplay">R$ 0,00</strong></span>
                    </div>
                </div>

                <!-- Table -->
                <div class="glass-card" style="padding: 0; overflow: hidden;">
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                                    <th style="padding: 1rem;">Data</th>
                                    <th style="padding: 1rem;">Descrição</th>
                                    <th style="padding: 1rem;">Categoria</th>
                                    ${isExpense ? '<th style="padding: 1rem;">Pagamento</th>' : ''}
                                    <th style="padding: 1rem;">Valor</th>
                                    <th style="padding: 1rem; text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody">
                                <tr><td colspan="6" class="text-center" style="padding: 2rem;">Carregando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- Pagination (Simple) -->
                    <div class="flex-center" style="padding: 1rem; justify-content: flex-end; gap: 0.5rem;">
                        <button class="btn btn-ghost" id="prevPage" disabled><i class="ri-arrow-left-s-line"></i></button>
                        <span id="pageInfo" class="text-muted">Página 1</span>
                        <button class="btn btn-ghost" id="nextPage" disabled><i class="ri-arrow-right-s-line"></i></button>
                    </div>
                </div>
            </main>
        </div>

        <!-- Modal -->
        <div id="modal" class="modal-overlay" style="display: none;">
            <div class="glass-card modal-content">
                <h3 class="mb-4" id="modalTitle">Nova Transação</h3>
                <form id="transactionForm">
                    <input type="hidden" id="transId">
                    
                    <div class="form-group">
                        <label class="form-label">Valor</label>
                        <input type="number" step="0.01" id="amount" class="form-input" required>
                    </div>
                    
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Data</label>
                            <input type="date" id="date" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Categoria</label>
                            <select id="category" class="form-input" required>
                                <option value="">Selecione...</option>
                                <!-- Categories injected here -->
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <input type="text" id="description" class="form-input" required>
                    </div>

                    ${isExpense ? `
                    <div class="form-group">
                        <label class="form-label">Forma de Pagamento</label>
                        <select id="paymentMethod" class="form-input" required>
                            <option value="pix">Pix</option>
                            <option value="card">Cartão de Crédito</option>
                            <option value="debit">Débito</option>
                            <option value="cash">Dinheiro</option>
                            <option value="boleto">Boleto</option>
                        </select>
                    </div>
                    ` : ''}

                    <div class="form-group">
                        <label class="form-label">Observação</label>
                        <textarea id="observation" class="form-input" rows="2"></textarea>
                    </div>

                    <div class="flex-center" style="justify-content: flex-end; gap: 1rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-ghost" id="cancelBtn">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>

        <style>
            .text-danger { color: var(--danger-color); }
            .text-success { color: var(--success-color); }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
            
            .modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.5);
                display: flex; align-items: center; justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(5px);
            }
            .modal-content { width: 100%; max-width: 500px; animation: scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            
            @keyframes scaleIn {
                from { opacity: 0; transform: scale(0.9); }
                to { opacity: 1; transform: scale(1); }
            }
        </style>
    `;
}

export async function init() {
    const supabase = getSupabase();
    if (!supabase) return;

    const hash = window.location.hash;
    const type = hash === '#receitas' ? 'income' : 'expense';

    // State
    let currentPage = 1;
    let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // Elements
    const tableBody = document.getElementById('tableBody');
    const monthFilter = document.getElementById('monthFilter');
    const addBtn = document.getElementById('addBtn');
    const modal = document.getElementById('modal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('transactionForm');
    const categorySelect = document.getElementById('category');

    // Init Logic
    monthFilter.value = currentMonth;
    await loadCategories();
    await loadTransactions();

    // Listeners
    monthFilter.addEventListener('change', (e) => {
        currentMonth = e.target.value;
        loadTransactions();
    });

    addBtn.addEventListener('click', () => {
        form.reset();
        document.getElementById('transId').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        document.getElementById('modalTitle').textContent = type === 'income' ? 'Nova Receita' : 'Nova Despesa';
        modal.style.display = 'flex';
    });

    cancelBtn.addEventListener('click', () => modal.style.display = 'none');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('transId').value;
        const formData = {
            amount: document.getElementById('amount').value,
            date: document.getElementById('date').value,
            description: document.getElementById('description').value,
            category_id: categorySelect.value,
            // category_name: categorySelect.options[categorySelect.selectedIndex].text,
            type: type,
            observation: document.getElementById('observation').value,
            user_id: (await supabase.auth.getUser()).data.user.id
        };

        if (type === 'expense') {
            formData.payment_method = document.getElementById('paymentMethod').value;
        }

        let error;
        if (id) {
            ({ error } = await supabase.from('transactions').update(formData).eq('id', id));
        } else {
            ({ error } = await supabase.from('transactions').insert(formData));
        }

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            modal.style.display = 'none';
            loadTransactions();
        }
    });

    // Load Functions
    async function loadCategories() {
        // Fetch categories from DB or use defaults
        const { data } = await supabase.from('categories').select('*').or(`type.eq.${type},type.is.null`);
        if (data) {
            categorySelect.innerHTML = '<option value="">Selecione...</option>' +
                data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    }

    async function loadTransactions() {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem;">Carregando...</td></tr>';

        // Date Range
        const start = `${currentMonth}-01`;
        const end = `${currentMonth}-31`; // Loose end date

        const { data, error } = await supabase
            .from('transactions')
            .select(`*, categories(name)`)
            .eq('type', type)
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: false });

        if (error) {
            console.error(error);
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar</td></tr>';
            return;
        }

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 2rem;">Nenhum registro encontrado</td></tr>';
            document.getElementById('totalDisplay').textContent = 'R$ 0,00';
            return;
        }

        // Calculate Total
        const total = data.reduce((acc, curr) => acc + Number(curr.amount), 0);
        document.getElementById('totalDisplay').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Render Rows
        tableBody.innerHTML = data.map(t => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 1rem;">${new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td style="padding: 1rem;">${t.description}</td>
                <td style="padding: 1rem;"><span class="badge">${t.categories?.name || '-'}</span></td>
                ${type === 'expense' ? `<td style="padding: 1rem;">${t.payment_method || '-'}</td>` : ''}
                <td style="padding: 1rem; color: var(--${type === 'income' ? 'success' : 'danger'}-color); font-weight: bold;">
                    R$ ${Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-ghost" style="padding: 0.5rem;" onclick="window.editTransaction('${t.id}')"><i class="ri-pencil-line"></i></button>
                    <button class="btn btn-ghost" style="padding: 0.5rem; color: var(--danger-color);" onclick="window.deleteTransaction('${t.id}')"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `).join('');

        // Attach Global Helpers for inline buttons (Hack for Vanilla JS simple onclicks)
        window.editTransaction = (id) => {
            const t = data.find(x => x.id === id);
            if (!t) return;
            document.getElementById('transId').value = t.id;
            document.getElementById('amount').value = t.amount;
            document.getElementById('date').value = t.date;
            document.getElementById('description').value = t.description;
            document.getElementById('category').value = t.category_id;
            document.getElementById('observation').value = t.observation || '';
            if (type === 'expense') document.getElementById('paymentMethod').value = t.payment_method;

            document.getElementById('modalTitle').textContent = 'Editar Transação';
            modal.style.display = 'flex';
        };

        window.deleteTransaction = async (id) => {
            if (confirm('Tem certeza que deseja excluir?')) {
                await supabase.from('transactions').delete().eq('id', id);
                loadTransactions();
            }
        };
    }
}
