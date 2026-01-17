import { logout, getUser } from '../auth.js';

export default function DashboardView() {
    return `
        <div class="dashboard-layout fade-in">
            <header class="glass-card flex-center" style="justify-content: space-between; padding: 1rem 2rem; margin-bottom: 2rem;">
                <div class="flex-center" style="gap: 1rem;">
                    <i class="ri-donut-chart-fill" style="font-size: 1.5rem; color: var(--accent-color);"></i>
                    <h2 class="text-lg">Cacir</h2>
                </div>
                <div class="flex-center" style="gap: 1rem;">
                    <button class="btn btn-ghost" id="themeToggle"><i class="ri-moon-line"></i></button>
                    <button class="btn btn-ghost" id="logoutBtn"><i class="ri-logout-box-r-line"></i> Sair</button>
                </div>
            </header>

            <main class="dashboard-grid">
                <!-- Summary Cards -->
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Receitas</h3>
                    <p class="text-xl" style="color: var(--success-color);">R$ 4.500,00</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Despesas</h3>
                    <p class="text-xl" style="color: var(--danger-color);">R$ 1.200,50</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Saldo</h3>
                    <p class="text-xl" style="color: var(--text-color);">R$ 3.299,50</p>
                </div>
                <div class="glass-card">
                    <h3 class="text-muted" style="font-size: 0.9rem;">Economia Energia</h3>
                    <p class="text-xl" style="color: var(--warning-color);">12%</p>
                </div>

                <!-- Charts Area -->
                 <div class="glass-card" style="grid-column: span 2;">
                    <h3 class="mb-2">Meta de Gastos Mensal</h3>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span class="text-muted">Gasto: <strong class="text-danger">R$ 1.200,50</strong></span>
                        <span class="text-muted">Meta: <strong>R$ 2.000,00</strong></span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: 60%;"></div>
                    </div>
                    <p class="text-center text-muted" style="margin-top: 0.5rem; font-size: 0.8rem;">60% da meta consumida</p>
                </div>

                <div class="glass-card" style="min-height: 400px; padding: 1rem;">
                    <h3 class="mb-4">Fluxo de Caixa</h3>
                    <canvas id="cashFlowChart"></canvas>
                </div>
                <div class="glass-card" style="min-height: 400px; padding: 1rem;">
                    <h3 class="mb-4">Despesas por Categoria</h3>
                    <canvas id="expensesChart"></canvas>
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
            .dashboard-grid > .glass-card:nth-last-child(-n+2) { /* Charts */
                grid-column: span 2; 
            }
            @media (max-width: 1024px) {
                .dashboard-grid { grid-template-columns: repeat(2, 1fr); }
                .dashboard-grid > .glass-card:nth-last-child(1) { grid-column: span 2; }
                .dashboard-grid > .glass-card:nth-last-child(2) { grid-column: span 2; }
            }
            @media (max-width: 768px) {
                .dashboard-grid { grid-template-columns: 1fr; }
                .dashboard-grid > .glass-card:nth-last-child(-n+2) { grid-column: span 1; }
            }
        </style>
    `;
}

export async function init() {
    console.log('Dashboard Init');

    // Auth Check (Optional double check or user info fetch)
    const user = await getUser();
    if (!user) console.warn('No user found');

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await logout();
    });

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        themeBtn.innerHTML = next === 'dark' ? '<i class="ri-moon-line"></i>' : '<i class="ri-sun-line"></i>';
    });

    // Initialize Charts
    renderCharts();
}

function renderCharts() {
    const ctxFlow = document.getElementById('cashFlowChart').getContext('2d');
    const ctxExp = document.getElementById('expensesChart').getContext('2d');

    // Cash Flow (Area Chart)
    new Chart(ctxFlow, {
        type: 'line',
        data: {
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
            datasets: [
                {
                    label: 'Receitas',
                    data: [4000, 4200, 4500, 4100, 4600, 4800],
                    borderColor: '#10b981', // Emerald 500
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Despesas',
                    data: [2000, 1800, 2500, 2100, 1900, 2200],
                    borderColor: '#ef4444', // Red 500
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    // Expenses (Doughnut)
    new Chart(ctxExp, {
        type: 'doughnut',
        data: {
            labels: ['Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Outros'],
            datasets: [{
                data: [30, 40, 15, 10, 5],
                backgroundColor: [
                    '#f59e0b', // Amber
                    '#6366f1', // Indigo
                    '#10b981', // Emerald
                    '#ec4899', // Pink
                    '#64748b'  // Slate
                ],
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
