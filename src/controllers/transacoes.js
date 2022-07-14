const conexao = require('../conexao');

const listarTransacoes = async (req, res) => {

    const usuario = req.usuario;

    const { filtro } = req.query;

    if (!usuario) return res.status(401).json({ "mensagem": "Para acessar este recurso um token de autenticação válido deve ser enviado." })

    try {

        const sql = `SELECT t.*, c.descricao AS categoria_nome FROM transacoes t LEFT JOIN categorias c ON (t.categoria_id = c.id) WHERE t.usuario_id = $1`;
        const rs = await conexao.query(sql, [usuario.id]);

        if (rs.rowCount === 0) {
            return res.status(204).json([]);
        }
        const transacao = rs.rows;

        let resultFitro = [];

        if (filtro) {
            filtro.forEach(categoria => {
                transacao.forEach(item => {
                    if (item.categoria_nome.toLowerCase() === categoria.toLowerCase()) {
                        resultFitro.push(item);
                    }
                })
            });
            return res.status(200).json(resultFitro);
        }

        return res.status(200).json(transacao);

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const listarTransacao = async (req, res) => {

    const { id } = req.params;

    const usuario = req.usuario;

    if (!usuario) return res.status(401).json({ "mensagem": "Para acessar este recurso um token de autenticação válido deve ser enviado." })

    if (id === '') {
        return res.status(400).json({ "mensagem": "Informe um ID da transação válido!" });
    }

    try {
        const sql = `SELECT t.*, c.descricao AS categoria_nome FROM transacoes t JOIN categorias c ON (t.categoria_id = c.id) WHERE ${id && 't.id = $1'} AND t.usuario_id = $2`;

        const rs = await conexao.query(sql, [parseInt(id, 10), usuario.id]);

        if (rs.rowCount === 0) {
            return res.status(404).json({ "mensagem": "Transação não encontrada!" });
        }
        const transacao = rs.rows[0];
        return res.status(200).json(transacao);
    } catch (error) {
        return res.status(500).json(error);
    }
}

const cadastrarTransacao = async (req, res) => {

    const { tipo, descricao, valor, data, categoria_id } = req.body;
    const usuario = req.usuario;
    let categoria = null;

    if (!tipo || !descricao || !valor || !data || !categoria_id) {
        return res.status(400).json({
            "mensagem": "Todos os campos obrigatórios devem ser informados."
        });
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
        return res.status(400).json({ "mensagem": "Tipo não permitido!" })
    }

    try {
        const rs = await conexao.query('SELECT * FROM categorias WHERE id = $1', [numberConverter(categoria_id)]);
        if (rs.rowCount === 0) return res.status(404).json({ "mensagem": "Categoria não encontrada." })
        categoria = rs.rows[0].descricao;
    } catch (error) {
        res.status(500).json({ "mensagem": error });
    }

    try {
        const params = [
            tipo,
            descricao, numberConverter(valor),
            dateConverter(data),
            numberConverter(usuario.id),
            numberConverter(categoria_id)];

        const sqlQuery = 'INSERT INTO transacoes (tipo, descricao, valor, data, usuario_id, categoria_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';

        const rs = await conexao.query(sqlQuery, params);

        const obj = {
            id: rs.rows[0].id,
            tipo,
            descricao,
            valor,
            usuario_id: usuario.id,
            categoria_id,
            nome_categoria: categoria
        }
        return res.status(201).json(obj);
    } catch (error) {
        return res.status(500).json({ "mensagem": error })
    }
}

const atualizarTransacao = async (req, res) => {

    const { id } = req.params;
    const { tipo, descricao, valor, data, categoria_id } = req.body;

    const { id: idUsuario } = req.usuario;

    if (!idUsuario) {
        return res.status(401).json({ "mensagem": "O usuário não está autenticado (logado)" });
    }

    if (!id || !Number(id)) {
        return res.status(400).json({ "mensagem": "Todos os campos obrigatórios devem ser informados." });
    }

    if (!tipo || !descricao || !valor || !data || !categoria_id) {
        return res.status(400).json({ "mensagem": "" })
    }

    if (tipo !== 'entrada' && tipo !== 'saida') {
        return res.status(400).json({ "mensagem": "Tipo não permitido!" })
    }

    try {

        const rs = await conexao.query('SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2',
            [numberConverter(id), numberConverter(idUsuario)]);

        if (rs.rowCount === 0) {
            return res.status(404).json({ "mensagem": "Não transação não encontrada!" })
        }

        const sql = 'UPDATE transacoes SET tipo = $1, descricao = $2, valor = $3, data = $4, categoria_id=$5 WHERE id = $6 AND usuario_id = $7';
        const { rowCount } = await conexao.query(sql,
            [
                tipo,
                descricao,
                numberConverter(valor),
                dateConverter(data),
                numberConverter(categoria_id),
                numberConverter(id),
                numberConverter(idUsuario)
            ]);

        if (rowCount === 0) {
            return res.status(500).json({ "mensagem": "Não foi possível atualizar a transação!" })
        }

        return res.status(204).json();

    } catch (error) {
        return res.status(500).json(error.message);
    }
}

const deleteTransacao = async (req, res) => {

    const { id: idUsuario } = req.usuario;
    const { id: idTransacao } = req.params;

    try {
        const params = [numberConverter(idTransacao), numberConverter(idUsuario)];

        const rs = await conexao.query('SELECT * FROM transacoes WHERE id = $1 AND usuario_id = $2', params);

        if (rs.rowCount === 0) {
            return res.status(404).json({ "mensagem": "Transação não enocntrada" });
        }

        const taction = await conexao.query('DELETE FROM transacoes WHERE id = $1 AND usuario_id = $2', params);

        if (taction.rowCount === 0) return res.status(400).json({ "mensagem": "Não foi possível excluir transação" });

        res.status(204).json();

    } catch (error) {
        return res.status(500).json(error);
    }

}

const extratoTransacao = async (req, res) => {

    const { id } = req.usuario;
    try {
        let extrato = {};
        const sql1 = 'SELECT SUM(valor) AS entrada FROM transacoes WHERE usuario_id = $1 AND tipo = $2';
        const sql2 = 'SELECT SUM(valor) AS saida FROM transacoes WHERE usuario_id = $1 AND tipo = $2';

        const e = await conexao.query(sql1, [id, 'entrada']);
        const s = await conexao.query(sql2, [id, 'saida']);

        if (e.rowCount === 0 && s.rowCount === 0) {
            extrato = {
                entrada: 0,
                saida: 0
            }
        }

        if (e.rowCount !== 0 && s.rowCount === 0) {
            extrato = {
                entrada: e.rows[0].entrada,
                saida: 0
            }
        }

        if (e.rowCount === 0 && s.rowCount !== 0) {
            extrato = {
                entrada: 0,
                saida: s.rows[0].saida
            }
        }

        extrato = {
            entrada: e.rows[0].entrada,
            saida: s.rows[0].saida
        }

        return res.status(200).json(extrato);

    } catch (error) {
        return res.status(500).json({ "mensagem": error.message });
    }
}

function numberConverter(valor) {
    return Number(valor);
}

function dateConverter(date) {
    return new Date(date);
}

module.exports = {
    atualizarTransacao,
    cadastrarTransacao,
    deleteTransacao,
    extratoTransacao,
    listarTransacao,
    listarTransacoes
}



