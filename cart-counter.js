// cart-counter.js
(function() {
    'use strict';
    
    function updateCart() {
        try { 
            const cart = JSON.parse(localStorage.getItem('site_cart_v1') || '[]'); 
            const count = cart.reduce((s, i) => s + (i.qty || 0), 0); 
            const el = document.getElementById('cart-count'); 
            if (el) {
                el.textContent = count;
            }
        } catch(e) {
            console.error('Erro ao atualizar contador do carrinho:', e);
        }
    }
    
    // Atualiza ao carregar
    updateCart();
    
    // Atualiza quando houver mudanças no storage (outras abas)
    window.addEventListener('storage', updateCart);
    
    // Atualiza quando o DOM carregar completamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateCart);
    } else {
        updateCart();
    }
})();