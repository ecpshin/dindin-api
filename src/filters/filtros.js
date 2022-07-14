const conexao = require('../conexao');
const securePassword = require('secure-password');

const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

const verificaLogin = async (req, res, next) => {

    const { authorization } = req.headers;

    if (!authorization) return res.status(401).json({ "mensagem": "Não autorizado!" });

    const token = authorization.replace('Bearer', '').trim();

    if (!token) return res.status(404).json({ "mensagem": "o Token não foi informado!" });

    try {

        const { id } = jwt.verify(token, jwtSecret);

        const query = 'SELECT * FROM usuarios WHERE id = $1';

        const search = await conexao.query(query, [id]);

        if (search.rowCount === 0) return res.status(400).json({ "mensagem": "Usuário não foi encontrado." });

        const { senha, ...usuario } = search.rows[0];

        req.usuario = usuario;

        next();

    } catch (error) {
        return res.status(500).json({ "mensagem": "Para acessar este recurso um token de autenticação válido deve ser enviado." });
    }
}

const isEmailExists = async (req, res, next) => {

    const { email } = req.body;
    const { id } = req.usuario;

    try {
        const sqlQuery = 'SELECT * FROM usuarios WHERE email = $1 AND id <> $2';

        const { rowCount: registro } = await conexao.query(sqlQuery, [email, parseInt(id)]);

        if (registro > 0) {
            return res.status(400).json({ "mensagem": "Já existe usuário cadastrado com esse e-mail." });
        }
        next();
    } catch (err) {
        return res.status(500).json({ "mensagem": err.message });
    }
}

const isNewUserEmailExists = async (req, res, next) => {

    const { email } = req.body;

    try {

        const sqlQuery = 'SELECT * FROM usuarios WHERE email = $1';

        const { rowCount: registro } = await conexao.query(sqlQuery, [email]);

        if (registro > 0) {
            return res.status(400).json({ "mensagem": "já existe usuário cadastrado com esse e-mail" });
        }

        next();

    } catch (err) {
        return res.status(500).json({ "mensagem": err.message });
    }
}

module.exports = { verificaLogin, isEmailExists, isNewUserEmailExists }