const express = require('express');
const router = express.Router();
const supabase = require('../supabase');
const { autenticar, apenasCCO } = require('../middleware/auth');
// Piloto cria checklist
router.post('/', autenticar, async (req, res) => {
  const {
    data_missao,
    local_missao,
    ponto_decolagem,
    horario_decolagem,
    horario_retorno,
    bateria_drone_decolagem,
    bateria_drone_retorno,
    bateria_controle_decolagem,
    bateria_controle_retorno,
    voo_realizado,
    motivo_nao_realizacao
  } = req.body;
  // Calcular baterias utilizadas
  const bateria_drone_utilizada = voo_realizado
    ? bateria_drone_decolagem - bateria_drone_retorno
    : null;
  const bateria_controle_utilizada = voo_realizado
    ? bateria_controle_decolagem - bateria_controle_retorno
    : null;
  const { data, error } = await supabase.from('checklists').insert([{
    piloto_id: req.usuario.id,
    piloto_nome: req.usuario.nome,
    base: req.usuario.base,
    data_missao,
    local_missao,
    ponto_decolagem,
    horario_decolagem: voo_realizado ? horario_decolagem : null,
    horario_retorno: voo_realizado ? horario_retorno : null,
    bateria_drone_decolagem: voo_realizado ? bateria_drone_decolagem : null,
    bateria_drone_retorno: voo_realizado ? bateria_drone_retorno : null,
    bateria_drone_utilizada,
    bateria_controle_decolagem: voo_realizado ? bateria_controle_decolagem : null,
    bateria_controle_retorno: voo_realizado ? bateria_controle_retorno : null,
    bateria_controle_utilizada,
    voo_realizado: voo_realizado ?? true,
    motivo_nao_realizacao: !voo_realizado ? motivo_nao_realizacao : null
  }]).select();
  if (error) {
    return res.status(500).json({ erro: 'Erro ao salvar checklist', detalhe: error.message });
  }
  res.status(201).json({ mensagem: 'Checklist salvo com sucesso!', data: data[0] });
});
// Piloto vê seus próprios checklists
router.get('/meus', autenticar, async (req, res) => {
  const { data, error } = await supabase
    .from('checklists')
    .select('*')
    .eq('piloto_id', req.usuario.id)
    .order('data_missao', { ascending: false });
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});
// CCO vê todos os checklists com filtros
router.get('/', autenticar, apenasCCO, async (req, res) => {
  const { base, piloto_id, data_inicio, data_fim } = req.query;
  let query = supabase
    .from('checklists')
    .select('*')
    .order('data_missao', { ascending: false })
    .order('criado_em', { ascending: false });
  if (base) query = query.eq('base', base);
  if (piloto_id) query = query.eq('piloto_id', piloto_id);
  if (data_inicio) query = query.gte('data_missao', data_inicio);
  if (data_fim) query = query.lte('data_missao', data_fim);
  const { data, error } = await query;
  if (error) return res.status(500).json({ erro: error.message });
  res.json(data);
});
module.exports = router;