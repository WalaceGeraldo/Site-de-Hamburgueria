(async ()=>{
  const base = 'http://localhost:3000';
  const email = `ordertest+${Date.now()}@example.com`;
  const password = 'Order123!';
  const name = 'Order Tester';
  // register
  let res = await fetch(base + '/api/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password}) });
  let j = await res.json();
  console.log('/api/register ->', res.status, j);
  // login
  res = await fetch(base + '/api/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) });
  j = await res.json();
  console.log('/api/login ->', res.status, j);
  if (!res.ok) return console.error('login failed');
  const token = j.token;
  // create order
  const cart = [ { name:'Classic Burger', price:25.00, qty:2 }, { name:'Batatas Fritas', price:15.00, qty:1 } ];
  const total = cart.reduce((s,i)=>s + i.price*i.qty, 0);
  res = await fetch(base + '/api/orders', { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+token}, body:JSON.stringify({items:cart,total}) });
  j = await res.json();
  console.log('/api/orders (create) ->', res.status, j);
  // get orders
  res = await fetch(base + '/api/orders', { method:'GET', headers:{'Authorization':'Bearer '+token} });
  j = await res.json();
  console.log('/api/orders (list) ->', res.status, j);
})();
