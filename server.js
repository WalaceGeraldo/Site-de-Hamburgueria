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

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database (SQLite)
const dbFile = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
});

// Serve arquivos estáticos do projeto (opcional)
app.use('/', express.static(path.join(__dirname)));

// Register
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const stmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
  stmt.run(name || '', email, hash, function (err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return res.status(409).json({ success: false, message: 'Email já cadastrado.' });
      }
      return res.status(500).json({ success: false, message: 'Erro interno no servidor.' });
    }
    const userId = this.lastID;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, message: 'Usuário criado com sucesso.', token, email });
  });
  stmt.finalize();
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios.' });
  db.get('SELECT id, email, password, name FROM users WHERE email = ?', [email], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Erro interno.' });
    if (!row) return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    const valid = bcrypt.compareSync(password, row.password);
    if (!valid) return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    const token = jwt.sign({ id: row.id, email: row.email }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, message: 'Login realizado.', token, email: row.email, name: row.name });
  });
});

// Simple protected endpoint example
app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ success: false, message: 'Sem token.' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ success: false, message: 'Token inválido.' });
  const token = parts[1];
  try {
    const data = jwt.verify(token, JWT_SECRET);
    db.get('SELECT id, email, name, created_at FROM users WHERE id = ?', [data.id], (err, row) => {
      if (err || !row) return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
      return res.json({ success: true, user: row });
    });
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
