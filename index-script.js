// index-script.js
(function() {
    'use strict';

    // Toggle do menu mobile
    document.addEventListener('DOMContentLoaded', function() {
        const navToggle = document.getElementById('nav-toggle');
        const primaryNav = document.getElementById('primary-navigation');
        
        if (navToggle && primaryNav) {
            navToggle.addEventListener('click', function() {
                const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
                navToggle.setAttribute('aria-expanded', !expanded);
                primaryNav.classList.toggle('open');
            });
        }
    });

    // Atualiza contador do carrinho no header
    function updateCart() {
        try { 
            const cart = JSON.parse(localStorage.getItem('site_cart_v1') || '[]'); 
            const count = cart.reduce(function(s, i) { 
                return s + (i.qty || 0); 
            }, 0); 
            const el = document.getElementById('cart-count'); 
            if (el) {
                el.textContent = count;
            }
        } catch(e) {}
    }
    
    updateCart();
    window.addEventListener('storage', updateCart);
    document.addEventListener('DOMContentLoaded', updateCart);
})();