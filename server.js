const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Armazenamento simples em arquivo JSON ----
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ equipamentos: [], ordens: [] }, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function uid(prefix) {
  return prefix + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ---- Equipamentos ----
app.get('/api/equipamentos', (req, res) => {
  res.json(readData().equipamentos);
});

app.post('/api/equipamentos', (req, res) => {
  const { tag, nome, local, criticidade } = req.body || {};
  if (!tag || !nome) {
    return res.status(400).json({ error: 'Tag e nome são obrigatórios.' });
  }
  const data = readData();
  const novo = { id: uid('EQ'), tag, nome, local: local || '', criticidade: criticidade || 'baixa' };
  data.equipamentos.push(novo);
  writeData(data);
  res.status(201).json(novo);
});

app.delete('/api/equipamentos/:id', (req, res) => {
  const data = readData();
  data.equipamentos = data.equipamentos.filter(e => e.id !== req.params.id);
  writeData(data);
  res.status(204).end();
});

// ---- Ordens de serviço ----
app.get('/api/ordens', (req, res) => {
  res.json(readData().ordens);
});

app.post('/api/ordens', (req, res) => {
  const { equipamentoId, tipo, prioridade, responsavel, dataPrevista, status, descricao } = req.body || {};
  if (!equipamentoId || !descricao) {
    return res.status(400).json({ error: 'Equipamento e descrição são obrigatórios.' });
  }
  const data = readData();
  const nova = {
    id: uid('OS'),
    equipamentoId,
    tipo: tipo || 'corretiva',
    prioridade: prioridade || 'media',
    responsavel: responsavel || '',
    dataPrevista: dataPrevista || '',
    status: status || 'aberta',
    descricao,
    dataAbertura: new Date().toISOString().slice(0, 10)
  };
  data.ordens.push(nova);
  writeData(data);
  res.status(201).json(nova);
});

app.patch('/api/ordens/:id', (req, res) => {
  const data = readData();
  const ordem = data.ordens.find(o => o.id === req.params.id);
  if (!ordem) return res.status(404).json({ error: 'Ordem não encontrada.' });
  Object.assign(ordem, req.body || {});
  writeData(data);
  res.json(ordem);
});

app.delete('/api/ordens/:id', (req, res) => {
  const data = readData();
  data.ordens = data.ordens.filter(o => o.id !== req.params.id);
  writeData(data);
  res.status(204).end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
});
