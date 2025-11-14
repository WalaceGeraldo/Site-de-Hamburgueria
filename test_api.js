(async () => {
  const base = 'http://localhost:3000';
  const email = `test+${Date.now()}@example.com`;
  const password = 'Test1234!';
  const name = 'Teste Automático';

  console.log('Tentando registrar:', email);
  try {
    const regRes = await fetch(`${base}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const regJson = await regRes.json();
    console.log('/api/register ->', regRes.status, JSON.stringify(regJson));

    if (regRes.ok) {
      console.log('Registro bem-sucedido. Token recebido? ', Boolean(regJson.token));
    } else if (regRes.status === 409) {
      console.log('Email já cadastrado, tentarei logar com as credenciais.' );
    } else {
      console.error('Falha no registro:', regJson);
    }

    console.log('Tentando login com o mesmo usuário...');
    const loginRes = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginJson = await loginRes.json();
    console.log('/api/login ->', loginRes.status, JSON.stringify(loginJson));

    if (loginRes.ok) {
      console.log('Login OK. Token:', loginJson.token ? loginJson.token.slice(0,20) + '...' : 'nenhum');
    } else {
      console.error('Falha no login:', loginJson);
    }
  } catch (e) {
    console.error('Erro de conexão ou execução:', e.message || e);
  }
})();
