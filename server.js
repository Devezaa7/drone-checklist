require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/exportar', require('./routes/exportar'));
// Todas as outras rotas servem o frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Servidor rodando na porta ${PORT}`);
});