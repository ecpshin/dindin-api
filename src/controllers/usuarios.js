const conexao = require('../conexao');
const securePassword = require('secure-password');
const pwd = securePassword();


const detalhamentoUsuario = async (req, res) => {

    const { id } = req.usuario;

    try {
        const sql = 'SELECT * FROM usuarios WHERE id = $1';
        const { rows, rowCount: isExists } = await conexao.query(sql, [id]);

        delete rows[0].senha;

        let userInfo = rows[0];

        if (isExists === 0) {
            return res.status(404).json({ "mensagem": "Para acessar este recurso um token de autenticação válido deve ser enviado." });
        }
        return res.status(200).json(userInfo);
    } catch (error) {
        return res.status(500).json({ "mensagem": error })
    }

}

const cadastrarUsuario = async (req, res) => {

    const { nome, email, senha } = req.body;

    if (!nome) {
        return res.status(400).json({ "mensagem": "O campos nome é obrigatório!" });
    }
    if (!email) {
        return res.status(400).json({ "mensagem": "O campos email é obrigatório!" });
    }
    if (!senha) {
        return res.status(400).json({ "mensagem": "O campo senha é obrigatório!" });
    }

    try {

        const userHash = (await pwd.hash(Buffer.from(senha))).toString("hex");

        const sqlQuery = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id';

        const user = await conexao.query(sqlQuery, [nome, email, userHash]);

        const { id } = user.rows[0];

        if (user.rowCount === 0) {
            return res.status(400).json({ "mensagem": "Não foi possível cadastrar usuário." });
        }

        return res.status(201).json({
            "id": id,
            "nome": nome,
            "email": email
        });

    } catch (error) {
        return res.status(500).json(error);
    }
}

const atualizarUsuario = async (req, res) => {

    const { nome, email, senha } = req.body;
    const { id: userId } = req.usuario;

    let sqlQuery = '';

    if (!nome) {
        return res.status(400).json({ "mensagem": "O campos nome é obrigatório!" });
    }

    if (!email) {
        return res.status(400).json({ "mensagem": "O campos email é obrigatório!" });
    }

    if (!senha) {
        return res.status(400).json({ "mensagem": "O campo senha é obrigatório!" });
    }

    try {

        const userHash = (await pwd.hash(Buffer.from(senha))).toString("hex");

        sqlQuery = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4';

        const user = await conexao.query(sqlQuery, [nome, email, userHash, parseInt(userId)]);

        if (user.rowCount === 0) {
            return res.status(400).json({ "mensagem": "Não foi possível realizar atualização de usuário." });
        }

        return res.status(204).json();

    } catch (error) {
        return res.status(500).json(error.message);
    }
}


module.exports = {
    detalhamentoUsuario,
    cadastrarUsuario,
    atualizarUsuario
}