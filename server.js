const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false  // ← MUDANÇA AQUI
}));
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Database (SQLite)
const dbFile = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  // Tabela de usuários
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  
  // Tabela de pedidos
  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      items TEXT,
      total REAL,
      subtotal REAL,
      delivery_fee REAL,
      address TEXT,
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`
  );

  // Migração defensiva: garantir colunas novas em bases antigas
  db.all('PRAGMA table_info(orders)', (err, columns) => {
    if (err) {
      console.error('Erro ao verificar esquema de orders:', err);
      return;
    }
    const names = (columns || []).map(c => c.name);
    const ensureColumn = (name, ddl) => {
      if (!names.includes(name)) {
        db.run(`ALTER TABLE orders ADD COLUMN ${ddl}`, (e) => {
          if (e) {
            console.error(`Falha ao adicionar coluna ${name}:`, e);
          } else {
            console.log(`Coluna adicionada: ${name}`);
          }
        });
      }
    };
    ensureColumn('subtotal', 'subtotal REAL');
    ensureColumn('delivery_fee', 'delivery_fee REAL');
    ensureColumn('address', 'address TEXT');
    ensureColumn('payment_method', 'payment_method TEXT');
  });
});

// Serve arquivos estáticos
app.use('/', express.static(path.join(__dirname)));

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/api/register', (req, res) => {
  console.log('POST /api/register');
  const { name, email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios.' 
    });
  }
  
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
  stmt.run(name || '', email, hash, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ 
          success: false, 
          message: 'Email já cadastrado.' 
        });
      }
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno no servidor.' 
      });
    }
    
    const userId = this.lastID;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '8h' });
    
    return res.json({ 
      success: true, 
      message: 'Usuário criado com sucesso.', 
      token, 
      email, 
      name 
    });
  });
  stmt.finalize();
});

app.post('/api/login', (req, res) => {
  console.log('POST /api/login');
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email e senha são obrigatórios.' 
    });
  }
  
  db.get('SELECT id, email, password, name FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Erro interno.' 
      });
    }
    
    if (!row) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas.' 
      });
    }
    
    const valid = bcrypt.compareSync(password, row.password);
    
    if (!valid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas.' 
      });
    }
    
    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '8h' });
    
    return res.json({ 
      success: true, 
      message: 'Login realizado.', 
      token, 
      email: row.email, 
      name: row.name 
    });
  });
});

app.get('/api/me', requireAuth, (req, res) => {
  db.get('SELECT id, email, name, avatar, created_at FROM users WHERE id = ?', [req.user.id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado.' 
      });
    }
    return res.json({ success: true, user: row });
  });
});

// Middleware de autenticação
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  
  if (!auth) {
    return res.status(401).json({ 
      success: false, 
      message: 'Sem token.' 
    });
  }
  
  const parts = auth.split(' ');
  
  if (parts.length !== 2) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido.' 
    });
  }
  
  const token = parts[1];
  
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data; // { id, email }
    next();
  } catch (e) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido ou expirado.' 
    });
  }
}

// --- ROTA DE CRIAR PEDIDO ---
app.post('/api/orders', requireAuth, (req, res) => {
  const userId = req.user.id;
  const { items, total, subtotal, deliveryFee, address, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Carrinho vazio.' 
    });
  }
  
  const itemsJson = JSON.stringify(items);
  const addressJson = JSON.stringify(address || {}); 

  const stmt = db.prepare(
    `INSERT INTO orders (user_id, items, total, subtotal, delivery_fee, address, payment_method) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  
  stmt.run(userId, itemsJson, total, subtotal, deliveryFee, addressJson, paymentMethod, function (err) {
    if (err) {
      console.error('Erro ao salvar pedido:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Erro ao salvar pedido.' 
      });
    }
    const orderId = this.lastID;
    return res.json({ 
      success: true, 
      message: 'Pedido criado.', 
      orderId 
    });
  });
  stmt.finalize();
});

// --- ROTA DE BUSCAR PEDIDOS ---
app.get('/api/orders', requireAuth, (req, res) => {
  const userId = req.user.id;
  
  db.all(
    `SELECT id, items, total, subtotal, delivery_fee, address, payment_method, created_at 
     FROM orders WHERE user_id = ? ORDER BY created_at DESC`, 
    [userId], 
    (err, rows) => {
      if (err) {
        console.error('Erro ao obter pedidos:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao obter pedidos.' 
        });
      }

      const safeParse = (value, fallback) => {
        try {
          if (value == null || value === '') return fallback;
          return JSON.parse(value);
        } catch (_) {
          return fallback;
        }
      };

      const list = Array.isArray(rows) ? rows : [];
      const parsed = list.map(r => ({ 
        id: r.id, 
        items: safeParse(r.items, []), 
        total: r.total,
        subtotal: r.subtotal,
        deliveryFee: r.delivery_fee,
        address: safeParse(r.address, {}),
        paymentMethod: r.payment_method,
        created_at: r.created_at 
      }));
      
      return res.json({ success: true, orders: parsed });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});
  db.all('PRAGMA table_info(users)', (err, columns) => {
    if (err) return;
    const names = (columns || []).map(c => c.name);
    if (!names.includes('avatar')) {
      db.run('ALTER TABLE users ADD COLUMN avatar TEXT');
    }
  });
app.put('/api/me/avatar', requireAuth, (req, res) => {
  const { avatar } = req.body;
  if (typeof avatar !== 'string' || avatar.length === 0) {
    return res.status(400).json({ success: false, message: 'Avatar inválido.' });
  }
  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatar, req.user.id], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Erro ao atualizar avatar.' });
    }
    return res.json({ success: true });
  });
});