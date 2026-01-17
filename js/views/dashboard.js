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
                <!-- Charts Area -->
                 <div class="glass-card col-span-2">
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

                <div class="glass-card col-span-2" style="height: 400px; padding: 1rem; display: flex; flex-direction: column;">
                    <h3 class="mb-4">Fluxo de Caixa</h3>
                    <div style="flex: 1; position: relative; width: 100%; min-height: 0;">
                        <canvas id="cashFlowChart"></canvas>
                    </div>
                </div>
                <div class="glass-card col-span-2" style="height: 400px; padding: 1rem; display: flex; flex-direction: column;">
                    <h3 class="mb-4">Despesas por Categoria</h3>
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

    // Data Fetching
    await loadDashboardData();
}

async function loadDashboardData() {
    const supabase = getSupabase(); // Assumes getSupabase is imported (it wasn't in original init, need to fix imports or use window if expose). Wait, dashboard uses imports.
    // Need to import getSupabase at top? Yes line 1 calls getUser.
    // But getSupabase is not imported. It is imported in line 1 "import { logout, getUser } from '../auth.js';".
    // Wait, auth.js does not export getSupabase.
    // I need to import getSupabase from '../supabase.js'.
}
// Wait, I need to check imports first.
// Original file line 1: import { logout, getUser } from '../auth.js';
// So I need to update imports first.

