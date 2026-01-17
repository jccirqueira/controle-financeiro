/**
 * App Entry Point
 * Handles initialization and global state
 */

import { initRouter } from './router.js';

const App = {
    init() {
        console.log('App Initializing...');
        initRouter();

        // Remove loader
        const loader = document.getElementById('loading');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }
    },
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
