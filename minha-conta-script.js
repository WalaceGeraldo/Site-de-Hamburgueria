// minha-conta-script.js
(function() {
    'use strict';

    // Verifica token e carrega dados do usuário
    async function initAccount() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        try {
            // Carregar dados do usuário
            const res = await fetch('/api/me', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            
            const j = await res.json();
            
            if (!res.ok || !j.success) {
                window.doLogout(); 
                return;
            }

            const user = j.user;
            document.getElementById('welcome').textContent = 'Olá, ' + (user.name || user.email) + '!';
            document.getElementById('account-email').textContent = user.email;
            document.getElementById('userName').textContent = user.name || '-';
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('userCreated').textContent = new Date(user.created_at).toLocaleDateString('pt-BR');
            document.getElementById('userInfo').style.display = 'block';
            var avatarImg = document.getElementById('account-avatar-img');
            function makeInitialsAvatar(name, email) {
                var txt = (name || email || 'User').trim();
                var parts = txt.split(/\s+/);
                var initials = (parts[0] ? parts[0][0] : 'U') + (parts[1] ? parts[1][0] : '');
                initials = initials.toUpperCase();
                var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">' +
                    '<rect width="80" height="80" rx="40" fill="#d9a040"/>' +
                    '<text x="50%" y="55%" text-anchor="middle" fill="#000" font-family="Oswald, Arial, sans-serif" font-size="30" font-weight="700">' + initials + '</text>' +
                    '</svg>';
                return 'data:image/svg+xml;base64,' + btoa(svg);
            }
            if (avatarImg) {
                var localAvatar = null;
                try { localAvatar = localStorage.getItem('accountAvatar') || null; } catch(_) {}
                var url = user.avatar || localAvatar || makeInitialsAvatar(user.name, user.email);
                avatarImg.onerror = function() { avatarImg.src = makeInitialsAvatar(user.name, user.email); };
                avatarImg.src = url;
            }
            
        } catch (e) {
            console.error('Erro ao verificar token:', e);
            window.doLogout();
        }
    }

    // Carregar pedidos
    async function loadOrders() {
        const token = localStorage.getItem('authToken');
        const target = document.getElementById('orders-list');
        
        if (!token) { 
            target.innerHTML = '<em>Faça login para ver seus pedidos.</em>'; 
            return; 
        }
        
        try {
            const res = await fetch('/api/orders', { 
                headers: { 'Authorization': 'Bearer ' + token } 
            });
            
            const j = await res.json();
            
            if (!res.ok || !j.success) { 
                target.innerHTML = '<em>Não foi possível carregar pedidos.</em>'; 
                return; 
            }
            
            if (!j.orders || !j.orders.length) { 
                target.innerHTML = '<div class="no-orders-message" style="display:flex; flex-direction: column; align-items: center; padding: 40px 0;">' +
                    '<span class="no-orders-icon" style="font-size: 64px; opacity: 0.5;">📋</span>' +
                    '<span>Você ainda não fez nenhum pedido.</span>' +
                    '</div>'; 
                return; 
            }

            target.innerHTML = '';
            window.__orders = j.orders;
            
            j.orders.forEach(function(order, idx) {
                const card = document.createElement('div');
                card.className = 'order-card';

                const itemsHTML = order.items.map(function(it) {
                    return '<div class="order-item-info" style="display:flex; justify-content: space-between; font-size: 15px; color: #333; padding: 4px 0;">' +
                        '<span class="order-item-name">' + it.qty + 'x ' + it.name + '</span>' +
                        '<span>R$ ' + (it.price * it.qty).toFixed(2) + '</span>' +
                        '</div>';
                }).join('');

                const address = order.address || {};
                const addressHTML = '<p class="order-payment" style="font-size: 14px; color: #555; margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">' +
                    '<strong>Endereço:</strong> ' + (address.street || 'N/A') + ', ' + (address.number || 'N/A') + ' - ' + (address.neighborhood || 'N/A') +
                    '</p>';
                    
                const paymentMap = {'pix': 'PIX', 'card': 'Cartão', 'cash': 'Dinheiro'};
                const paymentText = paymentMap[order.paymentMethod] || order.paymentMethod;

                var displayNum = (j.orders.length - idx);
                card.innerHTML = '<div class="order-header">' +
                    '<div>' +
                    '<h3>Pedido #' + displayNum + '</h3>' +
                    '<p class="order-date">' + new Date(order.created_at).toLocaleString('pt-BR') + '</p>' +
                    '</div>' +
                    '<span class="status-badge delivered">Concluído</span>' +
                    '</div>' +
                    '<div class="order-items" style="margin-bottom: 15px; padding-top: 15px; border-top: 1px solid #eee;">' +
                    itemsHTML +
                    '</div>' +
                    addressHTML +
                    '<div class="order-footer">' +
                    '<p class="order-payment"><strong>Pagamento:</strong> ' + paymentText + '</p>' +
                    '<p class="order-total" style="text-align: right;">Total: <strong>R$ ' + Number(order.total).toFixed(2) + '</strong></p>' +
                    '<div style="display:flex; justify-content:flex-end; margin-top:10px;">' +
                    '<button class="btn-print-order" data-order-id="' + order.id + '">Imprimir</button>' +
                    '</div>' +
                    '</div>';
                    
                target.appendChild(card);
            });

            const btnAll = document.getElementById('print-all-orders');
            if (btnAll) {
                btnAll.onclick = function() {
                    const arr = window.__orders || [];
                    if (!arr.length) return;
                    printOrders(arr);
                };
            }

        } catch(e) { 
            console.error('Erro ao carregar pedidos:', e);
            target.innerHTML = '<em>Erro ao carregar pedidos.</em>'; 
        }
    }

    function formatBRL(n) {
        return 'R$ ' + Number(n || 0).toFixed(2);
    }

    function buildReceiptHTML(order) {
        var address = order.address || {};
        var pm = {'pix': 'PIX', 'card': 'Cartão', 'cash': 'Dinheiro'};
        var payment = pm[order.paymentMethod] || order.paymentMethod || '-';
        var items = (order.items || []).map(function(it){
            return '<tr><td style="padding:6px 0;">' + it.qty + 'x ' + it.name + '</td><td style="text-align:right;">' + formatBRL((it.price || 0) * (it.qty || 0)) + '</td></tr>';
        }).join('');
        var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pedido #' + order.id + '</title>' +
        '<style>body{font-family:Montserrat,Arial,sans-serif;color:#000;margin:0;padding:14px;width:360px}h1{font-size:18px;margin:0 0 8px 0}h2{font-size:16px;margin:14px 0 6px 0}table{width:100%;border-collapse:collapse}hr{border:none;border-top:1px solid #ddd;margin:10px 0}small{color:#666} .total{font-weight:700} @media print{@page{margin:10mm} body{width:auto}} .header{display:flex;justify-content:space-between;align-items:center} .logo{font-family:Oswald,Arial,sans-serif;font-size:18px;text-transform:uppercase}</style></head><body>' +
        '<div class="header"><div class="logo">The Burguer co.</div><div><small>Pedido #' + order.id + '</small><br><small>' + new Date(order.created_at).toLocaleString('pt-BR') + '</small></div></div>' +
        '<hr>' +
        '<h2>Itens</h2><table>' + items + '</table>' +
        '<hr>' +
        '<h2>Resumo</h2><table>' +
        '<tr><td>Subtotal</td><td style="text-align:right;">' + formatBRL(order.subtotal) + '</td></tr>' +
        '<tr><td>Entrega</td><td style="text-align:right;">' + formatBRL(order.deliveryFee) + '</td></tr>' +
        '<tr><td class="total">Total</td><td style="text-align:right;" class="total">' + formatBRL(order.total) + '</td></tr>' +
        '</table>' +
        '<hr>' +
        '<h2>Pagamento</h2><div>' + payment + '</div>' +
        '<h2>Endereço</h2><div>' +
        (address.street || '-') + ', ' + (address.number || '-') + (address.complement ? (' - ' + address.complement) : '') + '<br>' +
        (address.neighborhood || '-') + ' - ' + (address.city || '-') + '/' + (address.state || '-') + '<br>' +
        (address.zip || '-') +
        '</div>' +
        '<hr>' +
        '<small>Obrigado pela preferência!</small>' +
        '</body></html>';
        return html;
    }

    function printOrder(order) {
        var html = buildReceiptHTML(order);
        var w = window.open('', 'PRINT', 'height=650,width=480');
        if (!w) return;
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    }

    function printOrders(orders) {
        var parts = orders.map(buildReceiptHTML);
        var html = parts.join('<div style="page-break-after:always"></div>');
        var w = window.open('', 'PRINT', 'height=800,width=600');
        if (!w) return;
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    }

    // Atualizar contador do carrinho
    function updateCart() {
        try { 
            const cart = JSON.parse(localStorage.getItem('site_cart_v1') || '[]'); 
            const count = cart.reduce(function(s, i) { 
                return s + (i.qty || 0); 
            }, 0); 
            const el = document.getElementById('cart-count'); 
            if (el) el.textContent = count; 
        } catch(e) {}
    }

    // Menu Mobile
    function initMobileMenu() {
        const navToggle = document.getElementById('nav-toggle');
        const primaryNav = document.getElementById('primary-navigation');
        
        if (navToggle && primaryNav) {
            navToggle.addEventListener('click', function() {
                const expanded = navToggle.getAttribute('aria-expanded') === 'true' || false;
                navToggle.setAttribute('aria-expanded', !expanded);
                primaryNav.classList.toggle('open');
            });
        }
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', function() {
        initAccount();
        loadOrders();
        updateCart();
        initMobileMenu();
        
        window.addEventListener('storage', updateCart);
        var btnChange = document.getElementById('avatar-change-btn');
        var inputFile = document.getElementById('avatar-input');
        if (btnChange && inputFile) {
            btnChange.addEventListener('click', function(){ inputFile.click(); });
            inputFile.addEventListener('change', async function(){
                var file = inputFile.files && inputFile.files[0];
                if (!file) return;
                var token = localStorage.getItem('authToken');
                if (!token) return;
                function resize(f){
                    return new Promise(function(resolve){
                        var r = new FileReader();
                        r.onload = function(){
                            var img = new Image();
                            img.onload = function(){
                                var max = 512;
                                var w = img.width, h = img.height;
                                if (w > h) { if (w > max) { h = Math.round(h * (max / w)); w = max; } }
                                else { if (h > max) { w = Math.round(w * (max / h)); h = max; } }
                                var c = document.createElement('canvas');
                                c.width = w; c.height = h;
                                var ctx = c.getContext('2d');
                                ctx.drawImage(img, 0, 0, w, h);
                                try { resolve(c.toDataURL('image/jpeg', 0.85)); }
                                catch(_) { resolve(r.result); }
                            };
                            img.src = r.result;
                        };
                        r.readAsDataURL(f);
                    });
                }
                try {
                    var dataUrl = await resize(file);
                    var res = await fetch('/api/me/avatar', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ avatar: dataUrl })
                    });
                    var j = await res.json();
                    if (res.ok && j.success) {
                        var img = document.getElementById('account-avatar-img');
                        if (img) img.src = dataUrl;
                        try { localStorage.setItem('accountAvatar', dataUrl); } catch(_) {}
                        alert('Foto atualizada.');
                    } else {
                        try { localStorage.setItem('accountAvatar', dataUrl); } catch(_) {}
                        var img = document.getElementById('account-avatar-img');
                        if (img) img.src = dataUrl;
                        alert('Foto atualizada localmente. O servidor não aceitou a atualização.');
                    }
                } catch(e) {
                    try { localStorage.setItem('accountAvatar', dataUrl); } catch(_) {}
                    var img = document.getElementById('account-avatar-img');
                    if (img) img.src = dataUrl;
                    alert('Foto atualizada localmente. Não foi possível enviar ao servidor.');
                }
            });
        }
        document.addEventListener('click', function(e){
            var btn = e.target.closest('.btn-print-order');
            if (btn) {
                var id = parseInt(btn.getAttribute('data-order-id'));
                var arr = window.__orders || [];
                var ord = arr.find(function(o){ return o.id === id; });
                if (ord) printOrder(ord);
            }
        });
    });
})();