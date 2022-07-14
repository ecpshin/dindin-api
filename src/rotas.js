const express = require('express');
const login = require('./controllers/login');
const usuarios = require('./controllers/usuarios');
const categorias = require('./controllers/categorias');
const transacoes = require('./controllers/transacoes');
const filtros = require('./filters/filtros');
const rotas = express();

rotas.post('/login', login.userLogin);
rotas.post('/usuario', filtros.isNewUserEmailExists, usuarios.cadastrarUsuario);

rotas.use(filtros.verificaLogin);

rotas.get('/categorias', categorias.listarCategorias);
rotas.get('/usuario', usuarios.detalhamentoUsuario);
rotas.put('/usuario', filtros.isEmailExists, usuarios.atualizarUsuario);

rotas.get('/transacao', transacoes.listarTransacoes);
rotas.get('/transacao/extrato', transacoes.extratoTransacao);
rotas.get('/transacao/:id', transacoes.listarTransacao);
rotas.post('/transacao', transacoes.cadastrarTransacao);
rotas.put('/transacao/:id', transacoes.atualizarTransacao);
rotas.delete('/transacao/:id', transacoes.deleteTransacao);

module.exports = rotas;