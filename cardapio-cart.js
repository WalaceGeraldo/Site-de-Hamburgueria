// cardapio-cart.js
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
    
    function saveCart(c) { 
        localStorage.setItem(CART_KEY, JSON.stringify(c)); 
    }

    function ensureToastContainer() { 
        let c = document.querySelector('.site-toast-container'); 
        if (!c) { 
            c = document.createElement('div'); 
            c.className = 'site-toast-container'; 
            document.body.appendChild(c); 
        } 
        return c; 
    }
    
    function showToast(text, opts) {
        opts = opts || {};
        const container = ensureToastContainer();
        const toast = document.createElement('div');
        toast.className = 'site-toast small' + (opts.type ? ' ' + opts.type : '');
        toast.textContent = text;
        container.appendChild(toast);
        requestAnimationFrame(function() { 
            toast.classList.add('show'); 
        });
        setTimeout(function() { 
            toast.classList.remove('show'); 
            setTimeout(function() { 
                toast.remove(); 
            }, 300); 
        }, opts.duration || 2200);
    }

    function addItem(item) {
        const c = loadCart();
        const existing = c.find(function(i) { 
            return i.name === item.name; 
        });
        if (existing) { 
            existing.qty = (existing.qty || 0) + 1; 
        } else { 
            item.qty = 1; 
            c.push(item); 
        }
        saveCart(c);
        
        try { 
            localStorage.setItem('site_cart_updated_at', Date.now().toString()); 
        } catch(e) {}
        
        if (window.updateCartCount) {
            try { 
                window.updateCartCount(); 
            } catch(e) {}
        }
        
        showToast(item.name + ' adicionado ao carrinho', { type: 'success', duration: 2200 });
    }

    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.add-to-cart, .btn-add-plus');
        if (!btn) return;
        
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price) || 0;

        btn.setAttribute('aria-pressed', 'true');
        btn.style.transform = 'translateY(-2px)';
        setTimeout(function() { 
            btn.removeAttribute('aria-pressed'); 
            btn.style.transform = ''; 
        }, 220);

        const menuItem = btn.closest('.menu-item');
        const srcImg = menuItem ? menuItem.querySelector('img') : null;
        const cartAnchor = document.querySelector('#nav-cart a');

        function doAdd() { 
            addItem({ name: name, price: price }); 
        }

        if (srcImg && cartAnchor) {
            const rect = srcImg.getBoundingClientRect();
            const clone = srcImg.cloneNode(true);
            clone.className = 'fly-img';
            clone.style.left = rect.left + 'px';
            clone.style.top = rect.top + 'px';
            clone.style.width = rect.width + 'px';
            clone.style.height = rect.height + 'px';
            clone.style.transform = 'translate(0,0) scale(1)';
            document.body.appendChild(clone);

            const targetRect = cartAnchor.getBoundingClientRect();
            const targetX = targetRect.left + targetRect.width / 2 - rect.left - rect.width / 2;
            const targetY = targetRect.top + targetRect.height / 2 - rect.top - rect.height / 2;

            requestAnimationFrame(function() {
                clone.style.transform = 'translate(' + targetX + 'px, ' + targetY + 'px) scale(0.25)';
                clone.style.opacity = '0.35';
            });

            clone.addEventListener('transitionend', function() { 
                try { 
                    clone.remove(); 
                } catch(e) {} 
                doAdd(); 
            }, { once: true });

            setTimeout(function() { 
                if (document.body.contains(clone)) { 
                    clone.remove(); 
                    doAdd(); 
                } 
            }, 1200);
        } else {
            doAdd();
        }
    });
})();