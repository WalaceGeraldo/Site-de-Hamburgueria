# 🍔 The Burguer Co. — Website

Um site moderno e responsivo para hamburgueria com autenticação Firebase, cardápio dinâmico e design otimizado.

---

## 📋 Recursos

- ✅ **Design Responsivo** — Mobile-first, funciona em todos os dispositivos
- ✅ **Autenticação Firebase** — Login e cadastro integrados
- ✅ **Cardápio Completo** — Hambúrgueres, acompanhamentos, bebidas e sobremesas
- ✅ **Otimizado para Performance** — Lazy-loading, compressão de imagens
- ✅ **Acessibilidade** — ARIA labels, link skip-to-content, contraste adequado
- ✅ **SEO-friendly** — Meta tags, estrutura semântica

---

## 🚀 Começar Localmente

### Pré-requisitos
- **Python 3.6+** (para servidor local)
- **Git** (para versionamento)
- Navegador moderno (Chrome, Firefox, Edge)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/WalaceGeraldo/Site-de-Hamburgueria.git
cd Site-de-Hamburgueria
```

2. **Rode um servidor local**

**Opção 1: Python (Windows/Mac/Linux)**
```bash
python -m http.server 8000
```

**Opção 2: Node.js (se tiver instalado)**
```bash
npx http-server -p 8000
```

**Opção 3: VS Code com Live Server**
- Instale a extensão "Live Server"
- Clique com botão direito em `index.html` → "Open with Live Server"

3. **Abra no navegador**
```
http://localhost:8000
```

### Servidor local de autenticação (opcional)

Este repositório inclui um pequeno servidor Node.js (Express + SQLite) para testes locais de registro/login. Ele escuta por padrão na porta `3000` e expõe os endpoints:

- `POST /api/register` — registrar usuário (body: `name`, `email`, `password`)
- `POST /api/login` — autenticar usuário (body: `email`, `password`)
- `GET /api/me` — obter dados do usuário a partir do token (Authorization: `Bearer <token>`)

Para rodar o servidor local (necessita Node.js >= 14):

```powershell
cd Site-de-Hamburgueria
npm install
npm start

# O servidor ficará disponível em http://localhost:3000
```

As páginas do site já tentam usar esse servidor automaticamente (primeiro tentam `/api/*`, e caso o servidor não esteja disponível, há um fallback para Firebase). Os tokens retornados pelo servidor são salvos em `localStorage`.

---

## 📁 Estrutura do Projeto

```
.
├── index.html           # Página inicial
├── cardapio.html        # Página de cardápio
├── cadastro.html        # Página de cadastro
├── login.html           # Página de login
├── style.css            # Estilos globais
├── imagens/             # Pasta com todas as imagens
│   ├── banner.png
│   ├── galeria-*.png
│   ├── menu-*.png
│   ├── historia.png
│   └── icon-*.png
└── README.md            # Este arquivo
```

---

## 🔧 Configuração Firebase

O site já vem configurado com Firebase (autenticação). Para usar em produção:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Atualize as credenciais no arquivo `index.html` e `cardapio.html`:
```javascript
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-mensager-id",
  appId: "seu-app-id"
};
```

---

## 🌐 Fazer Deploy

### GitHub Pages (Gratuito)

1. **Push para GitHub** (se ainda não tiver)
```bash
git add .
git commit -m "Deploy para GitHub Pages"
git push origin main
```

2. **Ativar GitHub Pages**
   - Vá para repositório → **Settings** → **Pages**
   - Escolha branch: `main` e pasta `/root`
   - Site será publicado em: `https://WalaceGeraldo.github.io/Site-de-Hamburgueria/`

### Vercel (Recomendado para produção)

1. Acesse [vercel.com](https://vercel.com)
2. Conecte seu repositório GitHub
3. Clique em "Deploy"
4. URL automática: `seu-projeto.vercel.app`

### Netlify

1. Acesse [netlify.com](https://netlify.com)
2. Conecte seu repositório
3. Deploy automático ativado
4. URL automática: `seu-site.netlify.app`

---

## 📊 Otimizações Aplicadas

### Performance
- ✅ **Lazy-loading** em todas as imagens → reduz tamanho inicial
- ✅ **Atributo `decoding="async"`** → renderização não-bloqueante
- ✅ **Picture element** para suporte a múltiplos formatos de imagem
- ✅ **Defer** nos scripts Firebase → não bloqueia render inicial
- ✅ **CSS minificado** parcialmente (variáveis CSS)

### Acessibilidade
- ✅ **Alt text descritivo** em todas as imagens
- ✅ **Link "Pular para conteúdo"** (.skip-link)
- ✅ **ARIA labels** em componentes interativos
- ✅ **Contraste de cores** WCAG AA
- ✅ **Menu toggle** com `aria-expanded`

### SEO
- ✅ **Meta descriptions** em todas as páginas
- ✅ **Titles descritivos**
- ✅ **Estrutura semântica** (`<header>`, `<main>`, `<footer>`, `<section>`)
- ✅ **Open Graph tags** (pronto para compartilhamento em redes)

---

## 🎨 Personalização

### Cores
Edite as variáveis CSS em `style.css`:
```css
:root {
  --accent: #d9a040;           /* Cor principal (ouro)*/
  --accent-dark: #b88a03;      /* Cor mais escura */
  --bg: #f6f6f6;               /* Fundo */
  --surface: #ffffff;          /* Superfícies */
  --muted: #777;               /* Texto secundário */
  --text: #222;                /* Texto principal */
}
```

### Fonts
Edite em `index.html` (no `<head>`):
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Oswald:wght@400;700&display=swap" rel="stylesheet">
```

---

## 🐛 Troubleshooting

**Problema:** "Sem internet, Firebase não funciona"
- Solução: Use a versão local offline. A autenticação não funcionará sem internet.

**Problema:** "Imagens não carregam"
- Verifique se a pasta `imagens/` existe e tem os arquivos PNG.
- Caminho deve ser relativo: `imagens/banner.png`

**Problema:** "Menu mobile não abre"
- Verifique console (F12) para erros de JavaScript
- Certifique-se de que `#nav-toggle` e `#primary-navigation` existem no HTML

---

## 📈 Próximas Melhorias Sugeridas

- 🖼️ **Converter para WebP/AVIF** — melhor compressão (reduz ~30% tamanho)
- 🔍 **Implementar busca no cardápio** — filtrar por tipo
- 📱 **App PWA** — funcionalidade offline
- 🎬 **Animações** — scroll triggers, parallax
- 💬 **Chatbot** — atendimento automático
- 📊 **Analytics** — rastrear comportamento de usuários
- 🔐 **Certificado SSL** — para HTTPS em produção

---

## 📝 Licença

Projeto pessoal. Sinta-se livre para adaptar conforme necessário.

---

## 👤 Autor

**Walace Geraldo**  
🔗 GitHub: [@WalaceGeraldo](https://github.com/WalaceGeraldo)

---

## 📞 Suporte

Encontrou um bug? Abra uma **Issue** no GitHub ou entre em contato.

---

**Última atualização:** 13 de novembro de 2025
