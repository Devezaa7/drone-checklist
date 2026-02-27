const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');
// Login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  }
  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('ativo', true)
    .single();
  if (error || !usuario) {
    return res.status(401).json({ erro: 'Email ou senha incorretos' });
  }
  const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
  if (!senhaCorreta) {
    return res.status(401).json({ erro: 'Email ou senha incorretos' });
  }
  const token = jwt.sign(
    {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      base: usuario.base
    },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );
  res.json({
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      perfil: usuario.perfil,
      base: usuario.base
    }
  });
});
module.exports = router;