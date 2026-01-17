import { logout, getUser } from '../auth.js';
import { getSupabase } from '../supabase.js';

export default function DashboardView() {
    return `
        <div class="dashboard-layout fade-in">
            <header class="glass-card flex-center" style="justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div class="flex-center" style="gap: 1rem;">
                    <i class="ri-donut-chart-fill" style="font-size: 1.5rem; color: var(--accent-color);"></i>
                    <h2 class="text-lg">Cacir</h2>
                </div>
                
                <nav class="flex-center" style="gap: 0.5rem;">
                    <button class="btn btn-ghost" onclick="window.location.hash='receitas'" title="Receitas"><i class="ri-arrow-up-circle-line" style="color: var(--success-color)"></i> <span class="hide-mobile">Receitas</span></button>
                    <button class="btn btn-ghost" onclick="window.location.hash='despesas'" title="Despesas"><i class="ri-arrow-down-circle-line" style="color: var(--danger-color)"></i> <span class="hide-mobile">Despesas</span></button>
                    <button class="btn btn-ghost" onclick="window.location.hash='energia'" title="Energia"><i class="ri-flashlight-line" style="color: var(--warning-color)"></i> <span class="hide-mobile">Energia</span></button>
                    <button class="btn btn-ghost" onclick="window.location.hash='configuracoes'" title="Configurações"><i class="ri-settings-3-line"></i> <span class="hide-mobile">Config.</span></button>
                </nav>

                <div class="flex-center" style="gap: 1rem;">
                    <button class="btn btn-ghost" id="refreshBtn" title="Atualizar Dados"><i class="ri-refresh-line"></i></button>
                    <button class="btn btn-ghost" id="themeToggle"><i class="ri-moon-line"></i></button>
                    <button class="btn btn-ghost" id="logoutBtn"><i class="ri-logout-box-r-line"></i> Sair</button>
                </div>
            </header>

            <main class="dashboard-grid">
                <!-- Summary Cards -->
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Receitas (Mês)</h3>
                    <p class="text-xl" id="summaryIncome" style="color: var(--success-color);">R$ 0,00</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Despesas (Mês)</h3>
                    <p class="text-xl" id="summaryExpense" style="color: var(--danger-color);">R$ 0,00</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Saldo (Mês)</h3>
                    <p class="text-xl" id="summaryBalance" style="color: var(--text-color);">R$ 0,00</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Economia Energia</h3>
                    <p class="text-xl" id="summaryEnergy" style="color: var(--warning-color);">0%</p>
                </div>

                <!-- Charts Area -->
                 <div class="glass-card col-span-2">
                    <h3 class="mb-2">Meta de Gastos Mensal</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span class="text-muted">Gasto: <strong class="text-danger" id="goalSpent">R$ 0,00</strong></span>
                        <span class="text-muted">Meta: <strong>R$ 2.000,00</strong></span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" id="goalProgress" style="width: 0%;"></div>
                    </div>
                    <p class="text-center text-muted" id="goalText" style="margin-top: 0.5rem; font-size: 0.8rem;">0% da meta consumida</p>
                </div>

                <div class="glass-card col-span-2" style="height: 400px; padding: 1rem; display: flex; flex-direction: column;">
                    <h3 class="mb-4">Fluxo de Caixa (Mês Atual)</h3>
                    <div style="flex: 1; position: relative; width: 100%; min-height: 0;">
                        <canvas id="cashFlowChart"></canvas>
                    </div>
                </div>
                <div class="glass-card col-span-2" style="height: 400px; padding: 1rem; display: flex; flex-direction: column;">
                    <h3 class="mb-4">Despesas por Categoria (Mês Atual)</h3>
                     <div style="flex: 1; position: relative; width: 100%; min-height: 0;">
                        <canvas id="expensesChart"></canvas>
                    </div>
                </div>
            </main>
        </div>

        <style>
            .fade-in { animation: fadeIn 0.5s ease; }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 1.5rem;
            }
            
            .col-span-2 { grid-column: span 2; }

            @media (max-width: 1024px) {
                .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
            }
            
            @media (max-width: 768px) {
                .dashboard-grid { grid-template-columns: 1fr; }
                .col-span-2 { grid-column: span 1; }
            }
        </style>
    `;
}

export async function init() {
    console.log('Dashboard Init');

    const user = await getUser();
    if (!user) console.warn('No user found');

    document.getElementById('refreshBtn')?.addEventListener('click', () => {
        loadDashboardData();
    });

    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await logout();
    });

    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        themeBtn.innerHTML = next === 'dark' ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
    });

    await loadDashboardData();
}

async function loadDashboardData() {
    try {
        const supabase = getSupabase();
        const user = await getUser();
        if (!supabase || !user) return;

        // 1. Transactions (Current Month)
        const date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');

        // Construct simplified date strings for Postgres DATE column comparison
        const startOfMonth = `${y}-${m}-01`;
        const endOfMonth = `${y}-${m}-31`; // Works for basic filtering

        console.log('Fetching dashboard data for:', startOfMonth, 'to', endOfMonth);

        // Fetch Transactions with Category Name
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*, categories(name)') // Simplified single line query
            .gte('date', startOfMonth)
            .lte('date', endOfMonth);

        if (error) {
            console.error('Error fetching transactions:', error);
            // Don't throw, just log so partial data can render
        }

        // Fetch User Goal
        let goal = 2000; // Default
        try {
            const { data: profile, error: profileError } = await supabase.from('profiles').select('monthly_goal').eq('id', user.id).single();
            if (profileError) console.warn('Goal fetch warning:', profileError.message);
            if (profile && profile.monthly_goal) {
                goal = Number(profile.monthly_goal);
            }
        } catch (err) {
            console.warn('Could not fetch goal, using default:', err);
        }

        // Calc Totals
        const safeTransactions = transactions || [];
        const income = safeTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const expense = safeTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const balance = income - expense;

        // Update Cards
        const elIncome = document.getElementById('summaryIncome');
        const elExpense = document.getElementById('summaryExpense');
        const elBalance = document.getElementById('summaryBalance');

        if (elIncome) elIncome.textContent = income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (elExpense) elExpense.textContent = expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        if (elBalance) elBalance.textContent = balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Update Goal
        const percent = Math.min((expense / goal) * 100, 100);
        const elGoalSpent = document.getElementById('goalSpent');
        if (elGoalSpent) elGoalSpent.textContent = expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const elGoalTarget = document.querySelector('.glass-card.col-span-2 strong:nth-child(2)');
        if (elGoalTarget) elGoalTarget.textContent = goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const elGoalProgress = document.getElementById('goalProgress');
        if (elGoalProgress) elGoalProgress.style.width = `${percent}%`;

        const elGoalText = document.getElementById('goalText');
        if (elGoalText) elGoalText.textContent = `${percent.toFixed(0)}% da meta consumida`;

        // 2. Energy
        const { data: energy } = await supabase
            .from('energy_logs')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false })
            .limit(1);
        const lastEnergy = energy && energy.length ? energy[0] : null;
        const savings = lastEnergy ? Number(lastEnergy.savings_percent).toFixed(0) + '%' : '0%';
        const savingsAmount = lastEnergy ? lastEnergy.savings_amount : 0;

        const energyEl = document.getElementById('summaryEnergy');
        if (energyEl) {
            energyEl.textContent = savings;
            energyEl.style.color = savingsAmount >= 0 ? 'var(--success-color)' : 'var(--danger-color)';
        }

        // 3. Charts
        renderCharts(safeTransactions);
    } catch (e) {
        console.error('Critical Error in loadDashboardData:', e);
        // Alert user friendlier message if needed, or rely on console
    }
}

function renderCharts(transactions) {
    // If chart instances exist, destroy them to avoid overlap/memory leaks (simple implementation)
    // For this simple usage, we can check if the canvas has an instance or just clear logic. 
    // Chart.js 3+ helps, but let's be safe.

    const ctxFlow = document.getElementById('cashFlowChart');
    const ctxExp = document.getElementById('expensesChart');

    if (window.myFlowChart) window.myFlowChart.destroy();
    if (window.myExpChart) window.myExpChart.destroy();

    // Prepare Data
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);

    const expenses = transactions.filter(t => t.type === 'expense');
    const catMap = {};
    expenses.forEach(t => {
        // Use joined category name OR fallback to description OR 'Sem categoria'
        const catName = t.categories?.name || 'Outros';
        catMap[catName] = (catMap[catName] || 0) + Number(t.amount);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);

    // Cash Flow (Bar Chart)
    window.myFlowChart = new Chart(ctxFlow, {
        type: 'bar',
        data: {
            labels: ['Mês Atual'],
            datasets: [
                { label: 'Receitas', data: [income], backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Despesas', data: [expense], backgroundColor: '#ef4444', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8' } } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Pie Chart
    window.myExpChart = new Chart(ctxExp, {
        type: 'doughnut',
        data: {
            labels: labels.length ? labels : ['Sem dados'],
            datasets: [{
                data: data.length ? data : [1],
                backgroundColor: ['#f59e0b', '#6366f1', '#10b981', '#ec4899', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8' } }
            }
        }
    });
}
