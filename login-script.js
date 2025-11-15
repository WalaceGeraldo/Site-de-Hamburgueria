// login-script.js
(function() {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const email = document.getElementById('email-login').value;
      const senha = document.getElementById('senha-login').value;
      
      if (!email || !senha) { 
        alert('Por favor, preencha o email e a senha.'); 
        return; 
      }

      try {
        const resp = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: senha })
        });
        
        const data = await resp.json();

        if (resp.ok && data.success) {
          window.doLogin(data.token, data.email, data.name);
          alert('Login realizado com sucesso!');
          window.location.href = 'minha-conta.html'; 
          return;
        } else {
          alert('Erro no login: ' + (data.message || 'Credenciais inválidas'));
        }
      } catch (e) {
        console.error('Servidor local não disponível:', e);
        alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
      }
    });
  }
})();