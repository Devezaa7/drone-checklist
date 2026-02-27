const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const xl = require('excel4node');
const supabase = require('../supabase');
const { autenticar, apenasCCO } = require('../middleware/auth');
// Buscar dados com filtros
async function buscarDados(query) {
  const { base, piloto_id, data_inicio, data_fim } = query;
  let q = supabase.from('checklists').select('*').order('data_missao', { ascending: false });
  if (base) q = q.eq('base', base);
  if (piloto_id) q = q.eq('piloto_id', piloto_id);
  if (data_inicio) q = q.gte('data_missao', data_inicio);
  if (data_fim) q = q.lte('data_missao', data_fim);
  const { data, error } = await q;
  return { data, error };
}
function formatarData(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
function formatarHora(timeStr) {
  if (!timeStr) return '-';
  return timeStr.substring(0, 5);
}
// EXPORTAR PDF
router.get('/pdf', autenticar, apenasCCO, async (req, res) => {
  const { data, error } = await buscarDados(req.query);
  if (error) return res.status(500).json({ erro: error.message });
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-checklists.pdf"');
  doc.pipe(res);
  // Cores
  const VERDE = '#2D6A4F';
  const VERDE_CLARO = '#52B788';
  const CINZA = '#666666';
  // Cabeçalho
  doc.rect(0, 0, doc.page.width, 80).fill(VERDE);
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
    .text('RELATÓRIO DE CHECKLISTS DE VOO', 40, 25);
  doc.fontSize(10).font('Helvetica')
    .text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 40, 52);
  doc.moveDown(3);
  if (data.length === 0) {
    doc.fillColor(CINZA).fontSize(12).text('Nenhum registro encontrado.', 40, 100);
    doc.end();
    return;
  }
  let y = 100;
  data.forEach((c, i) => {
    if (y > 700) {
      doc.addPage();
      y = 40;
    }
    // Card de fundo
    doc.rect(40, y, doc.page.width - 80, c.voo_realizado ? 160 : 120)
      .fillAndStroke('#F0FAF4', '#C7E8D5');
    // Cabeçalho do card
    doc.rect(40, y, doc.page.width - 80, 24).fill(VERDE_CLARO);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
      .text(`#${i + 1}  ${c.piloto_nome}  —  ${c.base}  —  ${formatarData(c.data_missao)}`, 48, y + 7);
    // Status do voo
    const statusX = doc.page.width - 150;
    const statusColor = c.voo_realizado ? '#1B4332' : '#9B2226';
    const statusText = c.voo_realizado ? '✓ VOO REALIZADO' : '✗ NÃO REALIZADO';
    doc.fillColor(statusColor).fontSize(8).font('Helvetica-Bold')
      .text(statusText, statusX, y + 7);
    y += 30;
    // Detalhes
    doc.fillColor('#333333').fontSize(8).font('Helvetica');
    const col1 = 48, col2 = 220, col3 = 390;
    doc.font('Helvetica-Bold').text('Local:', col1, y).font('Helvetica').text(c.local_missao, col1 + 35, y);
    doc.font('Helvetica-Bold').text('Decolagem:', col2, y).font('Helvetica').text(c.ponto_decolagem, col2 + 60, y);
    y += 14;
    if (c.voo_realizado) {
      doc.font('Helvetica-Bold').text('Decolagem:', col1, y).font('Helvetica').text(formatarHora(c.horario_decolagem), col1 + 58, y);
      doc.font('Helvetica-Bold').text('Retorno:', col2, y).font('Helvetica').text(formatarHora(c.horario_retorno), col2 + 48, y);
      y += 14;
      doc.font('Helvetica-Bold').text('Bateria Drone:', col1, y);
      doc.font('Helvetica').text(
        `Decolagem: ${c.bateria_drone_decolagem ?? '-'}%  |  Retorno: ${c.bateria_drone_retorno ?? '-'}%  |  Utilizado: ${c.bateria_drone_utilizada ?? '-'}%`,
        col1 + 80, y
      );
      y += 14;
      doc.font('Helvetica-Bold').text('Bateria Controle:', col1, y);
      doc.font('Helvetica').text(
        `Decolagem: ${c.bateria_controle_decolagem ?? '-'}%  |  Retorno: ${c.bateria_controle_retorno ?? '-'}%  |  Utilizado: ${c.bateria_controle_utilizada ?? '-'}%`,
        col1 + 95, y
      );
      y += 14;
    } else {
      doc.font('Helvetica-Bold').fillColor('#9B2226').text('Motivo:', col1, y);
      doc.font('Helvetica').fillColor('#333333').text(c.motivo_nao_realizacao || '-', col1 + 42, y, { width: 450 });
      y += 14;
    }
    y += 20; // espaço entre cards
  });
  doc.end();
});
// EXPORTAR EXCEL
router.get('/excel', autenticar, apenasCCO, async (req, res) => {
  const { data, error } = await buscarDados(req.query);
  if (error) return res.status(500).json({ erro: error.message });
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Checklists');
  // Estilos
  const headerStyle = wb.createStyle({
    font: { bold: true, color: '#FFFFFF', size: 11 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#2D6A4F' },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } }
  });
  const cellStyle = wb.createStyle({
    font: { size: 10 },
    alignment: { vertical: 'center', wrapText: true },
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' }, top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  });
  const cellAlt = wb.createStyle({
    font: { size: 10 },
    fill: { type: 'pattern', patternType: 'solid', fgColor: '#F0FAF4' },
    alignment: { vertical: 'center', wrapText: true },
    border: { left: { style: 'thin', color: '#CCCCCC' }, right: { style: 'thin', color: '#CCCCCC' }, top: { style: 'thin', color: '#CCCCCC' }, bottom: { style: 'thin', color: '#CCCCCC' } }
  });
  const headers = [
    'Data da Missão', 'Piloto', 'Base', 'Local da Missão', 'Ponto de Decolagem',
    'Horário Decolagem', 'Horário Retorno',
    'Bateria Drone Decolagem (%)', 'Bateria Drone Retorno (%)', 'Bateria Drone Utilizada (%)',
    'Bateria Controle Decolagem (%)', 'Bateria Controle Retorno (%)', 'Bateria Controle Utilizada (%)',
    'Voo Realizado', 'Motivo Não Realização'
  ];
  const colWidths = [15, 20, 12, 25, 25, 15, 15, 18, 18, 18, 18, 18, 18, 14, 35];
  headers.forEach((h, i) => {
    ws.cell(1, i + 1).string(h).style(headerStyle);
    ws.column(i + 1).setWidth(colWidths[i]);
  });
  ws.row(1).setHeight(35);
  data.forEach((c, i) => {
    const row = i + 2;
    const style = i % 2 === 0 ? cellStyle : cellAlt;
    ws.cell(row, 1).string(formatarData(c.data_missao)).style(style);
    ws.cell(row, 2).string(c.piloto_nome || '-').style(style);
    ws.cell(row, 3).string(c.base || '-').style(style);
    ws.cell(row, 4).string(c.local_missao || '-').style(style);
    ws.cell(row, 5).string(c.ponto_decolagem || '-').style(style);
    ws.cell(row, 6).string(formatarHora(c.horario_decolagem)).style(style);
    ws.cell(row, 7).string(formatarHora(c.horario_retorno)).style(style);
    ws.cell(row, 8).string(c.bateria_drone_decolagem != null ? `${c.bateria_drone_decolagem}%` : '-').style(style);
    ws.cell(row, 9).string(c.bateria_drone_retorno != null ? `${c.bateria_drone_retorno}%` : '-').style(style);
    ws.cell(row, 10).string(c.bateria_drone_utilizada != null ? `${c.bateria_drone_utilizada}%` : '-').style(style);
    ws.cell(row, 11).string(c.bateria_controle_decolagem != null ? `${c.bateria_controle_decolagem}%` : '-').style(style);
    ws.cell(row, 12).string(c.bateria_controle_retorno != null ? `${c.bateria_controle_retorno}%` : '-').style(style);
    ws.cell(row, 13).string(c.bateria_controle_utilizada != null ? `${c.bateria_controle_utilizada}%` : '-').style(style);
    ws.cell(row, 14).string(c.voo_realizado ? 'Sim' : 'Não').style(style);
    ws.cell(row, 15).string(c.motivo_nao_realizacao || '-').style(style);
    ws.row(row).setHeight(20);
  });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="relatorio-checklists.xlsx"');
  wb.write('relatorio.xlsx', res);
});
module.exports = router;