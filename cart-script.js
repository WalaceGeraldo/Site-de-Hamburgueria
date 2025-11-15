// cart-script.js
(function() {
    'use strict';
    
    const CART_KEY = 'site_cart_v1';

    function loadCart() {
        try { 
            return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); 
        } catch(e) { 
            return []; 
        }
    }
    
    function saveCart(cart) { 
        localStorage.setItem(CART_KEY, JSON.stringify(cart)); 
        try { 
            localStorage.setItem('site_cart_updated_at', Date.now().toString()); 
        } catch(e) {}
    }
    
    function getItemImage(itemName) {
        const imageMap = {
            'Classic Burger': 'imagens/burger-classic.png',
            'Cheddar Burger': 'imagens/burger-cheddar.png',
            'Bacon Supreme': 'imagens/burger-bacon.png',
            'Gorgon Burger': 'imagens/burger-gorgonzola.png',
            'Veggie Burger': 'imagens/burger-veggie.png',
            'Shimeji Burger (Vegano)': 'imagens/burger-cogumelo.png',
            'Brownie com Sorvete': 'imagens/sobremesa-brownie.png'
        };
        return imageMap[itemName] || 'imagens/burger-classic.png';
    }
    
    function renderCart() {
        const cart = loadCart();
        const container = document.getElementById('cart-items-container');
        const empty = document.getElementById('cart-empty');
        const content = document.getElementById('cart-content');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');
        
        container.innerHTML = '';
        
        if (!cart.length) {
            empty.style.display = 'flex';
            content.style.display = 'none';
            return;
        }
        
        empty.style.display = 'none';
        content.style.display = 'grid';
        
        let subtotal = 0;
        cart.forEach(function(item, idx) {
            const itemSubtotal = item.price * item.qty;
            subtotal += itemSubtotal;
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = '<img src="' + getItemImage(item.name) + '" alt="' + item.name + '" class="cart-item-img">' +
                '<div class="cart-item-details">' +
                '<h3 class="cart-item-name">' + item.name + '</h3>' +
                '<p class="cart-item-price">R$ ' + item.price.toFixed(2) + '</p>' +
                '</div>' +
                '<div class="cart-item-controls">' +
                '<div class="qty-controls">' +
                '<button class="qty-btn" data-idx="' + idx + '" data-action="decrease">-</button>' +
                '<span class="qty-value">' + item.qty + '</span>' +
                '<button class="qty-btn" data-idx="' + idx + '" data-action="increase">+</button>' +
                '</div>' +
                '<p class="cart-item-subtotal">R$ ' + itemSubtotal.toFixed(2) + '</p>' +
                '<button class="btn-remove" data-idx="' + idx + '">🗑️</button>' +
                '</div>';
            container.appendChild(itemDiv);
        });
        
        const deliveryFee = subtotal * 0.10;
        const total = subtotal + deliveryFee;
        subtotalEl.textContent = subtotal.toFixed(2);
        document.getElementById('delivery-fee').textContent = deliveryFee.toFixed(2);
        totalEl.textContent = total.toFixed(2);
    }
    
    function updateCartCount() {
        try {
            const cart = loadCart();
            const count = cart.reduce(function(s, i) { 
                return s + (i.qty || 0); 
            }, 0);
            const el = document.getElementById('cart-count');
            if (el) el.textContent = count;
        } catch (e) {}
    }

    document.addEventListener('click', function(e) {
        if (e.target.matches('.btn-remove') || e.target.closest('.btn-remove')) {
            const btn = e.target.matches('.btn-remove') ? e.target : e.target.closest('.btn-remove');
            const idx = parseInt(btn.dataset.idx);
            const cart = loadCart();
            cart.splice(idx, 1);
            saveCart(cart);
            renderCart();
            updateCartCount();
        }
        
        if (e.target.matches('.qty-btn')) {
            const idx = parseInt(e.target.dataset.idx);
            const action = e.target.dataset.action;
            const cart = loadCart();
            if (action === 'increase') {
                cart[idx].qty++;
            } else if (action === 'decrease' && cart[idx].qty > 1) {
                cart[idx].qty--;
            }
            saveCart(cart);
            renderCart();
            updateCartCount();
        }
        
        if (e.target.id === 'clearCartBtn') {
            if (confirm('Tem certeza que deseja limpar o carrinho?')) {
                localStorage.removeItem(CART_KEY);
                renderCart();
                updateCartCount();
            }
        }
    });

    document.getElementById('checkoutBtn').addEventListener('click', async function() {
        const cart = loadCart();
        if (!cart.length) {
            alert('Seu carrinho está vazio.');
            return;
        }

        if (!window.isLoggedIn()) {
            alert('Você precisa estar logado para finalizar a compra.');
            window.location.href = 'login.html';
            return;
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Token não encontrado. Faça login novamente.');
            window.location.href = 'login.html';
            return;
        }

        const street = document.getElementById('street').value.trim();
        const number = document.getElementById('number').value.trim();
        const neighborhood = document.getElementById('neighborhood').value.trim();
        const city = document.getElementById('city').value.trim();
        const state = document.getElementById('state').value.trim();
        const zip = document.getElementById('zip').value.trim();
        
        if (!street || !number || !neighborhood || !city || !state || !zip) {
            alert('Por favor, preencha todos os campos de endereço obrigatórios.');
            return;
        }
        
        const complement = document.getElementById('complement').value.trim();
        
        const address = {
            street: street,
            number: number,
            complement: complement,
            neighborhood: neighborhood,
            city: city,
            state: state,
            zip: zip
        };

        const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
        const subtotal = cart.reduce(function(s, i) { 
            return s + (i.price * i.qty); 
        }, 0);
        const deliveryFee = subtotal * 0.10;
        const total = subtotal + deliveryFee;

        const orderPayload = {
            items: cart,
            address: address,
            total: total,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            paymentMethod: paymentMethod
        };

        try {
            const response = await fetch('http://localhost:3000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(orderPayload)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Erro no servidor. Tente novamente.');
            }

            localStorage.removeItem(CART_KEY);
            updateCartCount();

            document.getElementById('cart-content').style.display = 'none';
            document.getElementById('checkout-success').style.display = 'flex';
            document.getElementById('order-number').textContent = 'Pedido #' + data.orderId;
            
        } catch (e) {
            console.error('Erro ao finalizar pedido:', e);
            alert('Erro ao finalizar pedido: ' + e.message);
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        renderCart();
        updateCartCount();

        window.addEventListener('storage', function(e) {
            if (e.key === CART_KEY || e.key === 'site_cart_updated_at') {
                renderCart();
                updateCartCount();
            }
        });
        
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
})();