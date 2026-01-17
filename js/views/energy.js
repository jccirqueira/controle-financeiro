import { getSupabase } from '../supabase.js';

export default function EnergyView() {
    return `
        <div class="dashboard-layout fade-in">
            <header class="glass-card flex-center" style="justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem;">
                <div class="flex-center" style="gap: 1rem;">
                    <button class="btn btn-ghost" onclick="window.location.hash = 'dashboard'"><i class="ri-arrow-left-line"></i></button>
                    <h2 class="text-lg">Controle de Energia</h2>
                </div>
            </header>

            <main>
                <div class="glass-card mb-4">
                    <h3 class="mb-4">Registro Mensal</h3>
                    <form id="energyForm">
                        <input type="hidden" id="energyId">
                        <div class="grid-3">
                            <div class="form-group">
                                <label class="form-label">Mês/Ano Reference</label>
                                <input type="month" id="monthRef" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fatura CPFL (R$)</label>
                                <input type="number" step="0.01" id="cpfl" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Fatura Serena (R$)</label>
                                <input type="number" step="0.01" id="serena" class="form-input" required>
                            </div>
                        </div>
                        
                        <!-- Real-time Preview -->
                        <div class="flex-center mb-4" style="justify-content: flex-start; gap: 2rem;">
                            <div>
                                <span class="text-muted">Economia Estimada:</span>
                                <strong class="text-success text-lg" id="savingPreview">R$ 0,00</strong>
                            </div>
                            <div>
                                <span class="text-muted">Desconto:</span>
                                <strong class="text-success text-lg" id="percentPreview">0%</strong>
                            </div>
                        </div>

                        <div class="flex-center" style="justify-content: flex-end;">
                            <button type="submit" class="btn btn-primary">Salvar Registro</button>
                        </div>
                    </form>
                </div>

                <!-- History Table -->
                <div class="glass-card">
                    <h3 class="mb-4">Histórico de Economia</h3>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="border-bottom: 1px solid var(--glass-border); text-align: left;">
                                    <th style="padding: 1rem;">Mês/Ano</th>
                                    <th style="padding: 1rem;">CPFL</th>
                                    <th style="padding: 1rem;">Serena</th>
                                    <th style="padding: 1rem;">Economia (R$)</th>
                                    <th style="padding: 1rem;">Economia (%)</th>
                                    <th style="padding: 1rem; text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="energyTableBody">
                                <tr><td colspan="6" class="text-center" style="padding: 2rem;">Carregando...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>

        <style>
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
            @media (max-width: 768px) {
                .grid-3 { grid-template-columns: 1fr; }
            }
        </style>
    `;
}

export async function init() {
    const supabase = getSupabase();
    if (!supabase) return;

    // Elements
    const form = document.getElementById('energyForm');
    const tableBody = document.getElementById('energyTableBody');
    const cpflInput = document.getElementById('cpfl');
    const serenaInput = document.getElementById('serena');
    const savingPreview = document.getElementById('savingPreview');
    const percentPreview = document.getElementById('percentPreview');

    // Init
    loadHistory();

    // Calc Preview
    const updatePreview = () => {
        const cpfl = parseFloat(cpflInput.value) || 0;
        const serena = parseFloat(serenaInput.value) || 0;
        const saving = cpfl - serena;
        const percent = cpfl > 0 ? (saving / cpfl) * 100 : 0;

        savingPreview.textContent = saving.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        percentPreview.textContent = percent.toFixed(2) + '%';

        savingPreview.style.color = saving >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
    };

    cpflInput.addEventListener('input', updatePreview);
    serenaInput.addEventListener('input', updatePreview);

    // Save
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const monthRef = document.getElementById('monthRef').value; // YYYY-MM
        const [year, month] = monthRef.split('-').map(Number);

        const dataPayload = {
            user_id: (await supabase.auth.getUser()).data.user.id,
            month,
            year,
            cpfl_amount: document.getElementById('cpfl').value,
            serena_amount: document.getElementById('serena').value
        };

        const id = document.getElementById('energyId').value;
        let error;

        if (id) {
            ({ error } = await supabase.from('energy_logs').update(dataPayload).eq('id', id));
        } else {
            ({ error } = await supabase.from('energy_logs').insert(dataPayload));
        }

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            form.reset();
            updatePreview();
            loadHistory();
        }
    });

    async function loadHistory() {
        const { data, error } = await supabase
            .from('energy_logs')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro</td></tr>';
            return;
        }

        if (data.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum registro.</td></tr>';
            return;
        }

        tableBody.innerHTML = data.map(item => `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 1rem;">${item.month}/${item.year}</td>
                <td style="padding: 1rem;">R$ ${Number(item.cpfl_amount).toFixed(2)}</td>
                <td style="padding: 1rem;">R$ ${Number(item.serena_amount).toFixed(2)}</td>
                <td style="padding: 1rem; color: var(--success-color); font-weight: bold;">R$ ${Number(item.savings_amount || (item.cpfl_amount - item.serena_amount)).toFixed(2)}</td>
                <td style="padding: 1rem;">${Number(item.savings_percent || ((item.cpfl_amount - item.serena_amount) / item.cpfl_amount * 100)).toFixed(2)}%</td>
                <td style="padding: 1rem; text-align: right;">
                    <button class="btn btn-ghost" onclick="window.editEnergy('${item.id}')"><i class="ri-pencil-line"></i></button>
                    <button class="btn btn-ghost" style="color: var(--danger-color);" onclick="window.deleteEnergy('${item.id}')"><i class="ri-delete-bin-line"></i></button>
                </td>
            </tr>
        `).join('');

        window.editEnergy = (id) => {
            const item = data.find(x => x.id === id);
            if (!item) return;
            document.getElementById('energyId').value = item.id;
            // Format YYYY-MM for input month
            const m = item.month < 10 ? `0${item.month}` : item.month;
            document.getElementById('monthRef').value = `${item.year}-${m}`;
            document.getElementById('cpfl').value = item.cpfl_amount;
            document.getElementById('serena').value = item.serena_amount;

            // Trigger preview update
            const event = new Event('input');
            document.getElementById('cpfl').dispatchEvent(event);

            // Scroll to form
            document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
        };

        window.deleteEnergy = async (id) => {
            if (confirm('Excluir?')) {
                await supabase.from('energy_logs').delete().eq('id', id);
                loadHistory();
            }
        };
    }
}
