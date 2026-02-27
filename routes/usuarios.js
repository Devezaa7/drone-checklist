const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../supabase');
const { autenticar, apenasCCO } = require('../middleware/auth');
// CCO lista todos os pilotos
router.get('/', autenticar, apenasCCO, async (req, res) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nome, email, perfil, base, ativo, criado_em')
    .order('base')
    .order('nome');
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});
// CCO cadastra novo usuário
router.post('/', autenticar, apenasCCO, async (req, res) => {
  const { nome, email, senha, perfil, base } = req.body;
  if (!nome || !email || !senha || !perfil) {
    return res.status(400).json({ erro: 'Campos obrigatórios: nome, email, senha, perfil' });
  }
  if (perfil === 'piloto' && !base) {
    return res.status(400).json({ erro: 'Piloto precisa de uma base' });
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nome, email: email.toLowerCase(), senha: senhaHash, perfil, base: perfil === 'piloto' ? base : null }])
    .select('id, nome, email, perfil, base, ativo');
  if (error) {
    if (error.code === '23505') return res.status(400).json({ erro: 'Email já cadastrado' });
    return res.status(500).json({ erro: error.message });
  }
  res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuario: data[0] });
});
// CCO atualiza usuário
router.put('/:id', autenticar, apenasCCO, async (req, res) => {
  const { nome, email, senha, perfil, base, ativo } = req.body;
  const updates = {};
  if (nome) updates.nome = nome;
  if (email) updates.email = email.toLowerCase();
  if (perfil) updates.perfil = perfil;
  if (base !== undefined) updates.base = base;
  if (ativo !== undefined) updates.ativo = ativo;
  if (senha) updates.senha = await bcrypt.hash(senha, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', req.params.id)
    .select('id, nome, email, perfil, base, ativo');
  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Usuário atualizado!', usuario: data[0] });
});
// CCO deleta usuário
router.delete('/:id', autenticar, apenasCCO, async (req, res) => {
  const { error } = await supabase
    .from('usuarios')
    .update({ ativo: false })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ erro: error.message });
  res.json({ mensagem: 'Usuário desativado com sucesso' });
});
module.exports = routerx