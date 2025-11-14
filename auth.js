// Sistema de Autenticação Unificado
// Usa localStorage para persistir login entre páginas

(function() {
    'use strict';

    // Função para verificar se usuário está logado
    window.isLoggedIn = function() {
        const token = localStorage.getItem('authToken');
        const email = localStorage.getItem('authEmail');
        return !!(token && email);
    };

    // Função para obter dados do usuário
    window.getUserData = function() {
        return {
            token: localStorage.getItem('authToken'),
            email: localStorage.getItem('authEmail'),
            name: localStorage.getItem('authName') || ''
        };
    };

    // Função para fazer login
    window.doLogin = function(token, email, name) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('authEmail', email);
        if (name) localStorage.setItem('authName', name);
        updateHeaderAuth();
    };

    // Função para fazer logout
    window.doLogout = function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authEmail');
        localStorage.removeItem('authName');
        updateHeaderAuth();
        window.location.href = 'index.html';
    };

    // Atualizar header com base no estado de autenticação
    function updateHeaderAuth() {
        const navCadastro = document.getElementById('nav-cadastro');
        const navLogin = document.getElementById('nav-login');
        const navAccount = document.getElementById('nav-account');
        const navUser = document.getElementById('nav-user');
        const navLogout = document.getElementById('nav-logout');
        const userEmailSpan = document.getElementById('user-email');

        if (isLoggedIn()) {
            const userData = getUserData();
            if (userEmailSpan) {
                const displayName = userData.name || userData.email.split('@')[0];
                userEmailSpan.textContent = displayName;
            }
            if (navCadastro) navCadastro.style.display = 'none';
            if (navLogin) navLogin.style.display = 'none';
            if (navAccount) navAccount.style.display = 'list-item';
            if (navUser) navUser.style.display = 'list-item';
            if (navLogout) navLogout.style.display = 'list-item';
        } else {
            if (userEmailSpan) userEmailSpan.textContent = '';
            if (navCadastro) navCadastro.style.display = 'list-item';
            if (navLogin) navLogin.style.display = 'list-item';
            if (navAccount) navAccount.style.display = 'none';
            if (navUser) navUser.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
        }
    }

    // Configurar botão de logout
    function setupLogoutButton() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            // Remove listeners anteriores clonando o elemento
            const newLogoutButton = logoutButton.cloneNode(true);
            logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
            
            newLogoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Deseja realmente sair?')) {
                    doLogout();
                }
            });
        }
    }

    // Inicializar autenticação quando o DOM estiver pronto
    function initAuth() {
        updateHeaderAuth();
        setupLogoutButton();
    }

    // Executar quando o DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }

    // Atualizar quando houver mudanças no storage (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key === 'authToken' || e.key === 'authEmail' || e.key === 'authName') {
            updateHeaderAuth();
        }
    });

})();
