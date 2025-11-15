// cadastro-script.js
(function() {
  const cadastroForm = document.getElementById('cadastroForm');
  
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const name = document.getElementById('nome-completo').value;
      const email = document.getElementById('email-cadastro').value;
      const senha = document.getElementById('senha-cadastro').value;
      const confirmarSenha = document.getElementById('confirmar-senha').value;

      if (senha !== confirmarSenha) { 
        alert("As senhas não coincidem!"); 
        return; 
      }
      
      if (senha.length < 6) { 
        alert("A senha deve ter pelo menos 6 caracteres."); 
        return; 
      }

      try {
        const resp = await fetch('http://localhost:3000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: senha })
        });
        
        const data = await resp.json();
        
        if (resp.ok && data.success) {
          window.doLogin(data.token, data.email, data.name);
          alert('Cadastro realizado com sucesso!');
          window.location.href = 'minha-conta.html'; 
          return;
        } else {
          alert('Erro no registro: ' + (data.message || 'Não foi possível cadastrar'));
        }
      } catch (e) {
        console.error('Servidor local não disponível:', e);
        alert('Não foi possível conectar ao servidor. Tente novamente mais tarde.');
      }
    });
  }
})();