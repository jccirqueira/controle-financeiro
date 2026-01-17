/**
 * Simple Hash Router
 */
import { getSupabase } from './supabase.js';

const routes = {
    'login': { title: 'Login', view: () => import('./views/login.js') },
    'dashboard': { title: 'Dashboard', view: () => import(`./views/dashboard.js?t=${Date.now()}`) },
    'receitas': { title: 'Receitas', view: () => import('./views/transactions.js') },
    'despesas': { title: 'Despesas', view: () => import('./views/transactions.js') },
    'energia': { title: 'Energia', view: () => import('./views/energy.js') },
    'configuracoes': { title: 'Configurações', view: () => import('./views/settings.js') },
    '404': { title: 'Não Encontrado', view: () => Promise.resolve({ default: () => `<h1>404</h1><p>Página não encontrada</p>` }) }
};

export async function navigateTo(hash) {
    const routeName = hash.replace('#', '') || 'login';
    const route = routes[routeName] || routes['404'];

    // Auth Check
    const supabase = getSupabase();
    if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && routeName !== 'login') {
            window.location.hash = 'login';
            return;
        }
        if (session && routeName === 'login') {
            window.location.hash = 'dashboard';
            return;
        }
    }

    // Load View
    try {
        const viewModule = await route.view();
        const app = document.getElementById('app');

        // Render
        app.innerHTML = viewModule.default();
        document.title = `Cacir - ${route.title}`;

        // Initialize View Logic
        if (viewModule.init) {
            await viewModule.init();
        }

    } catch (error) {
        console.error('Error loading view:', error);
        document.getElementById('app').innerHTML = `<div class="glass-card text-center"><h1>Erro</h1><p>Não foi possível carregar a tela.</p></div>`;
    }
}

export function initRouter() {
    window.addEventListener('hashchange', () => navigateTo(window.location.hash));
    navigateTo(window.location.hash);
}
