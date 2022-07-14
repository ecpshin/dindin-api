const conexao = require('../conexao');
const securePassword = require('secure-password');
const pwd = securePassword();
const jwt = require('jsonwebtoken');
const jwtSecret = require('../jwt_secret');

const userLogin = async (req, res) => {

    const { email, senha } = req.body;

    if (!email) return res.status(400).json('E-mail é obrigatório');

    if (!senha) return res.status(400).json('Senha é obrigatória!');

    try {

        const search = await conexao.query('SELECT * FROM usuarios WHERE email = $1', [email]);

        const user = search.rows[0];

        if (!user) {
            return res.status(400).json({ "mensagem": "Usuário e/ou senha inválido(s)." });
        }

        const result = await pwd.verify(Buffer.from(senha), Buffer.from(user.senha, "hex"));

        switch (result) {
            case securePassword.INVALID_UNRECOGNIZED_HASH:
            case securePassword.INVALID:
                return res.status(400).json({ "mensagem": "E-mail ou senha inválidos!" });
            case securePassword.VALID:
                break;
            case securePassword.VALID_NEEDS_REHASH:
                try {
                    const hash = (await pwd.hash(Buffer.from(senha)).toString("hex"));
                    const update = await conexao.query('UPDATE usuarios SET senha = $1 WHERE email = $2', [hash, email]);
                } catch { }
                break;
        }

        delete user.senha;

        const token = jwt.sign(user, jwtSecret, { expiresIn: '2h' });

        const session = {
            "usuario": user,
            "token": token
        };

        return res.status(200).json(session);

    } catch (error) {
        return res.status(500).json({ "mensagem": error.message });
    }
}

module.exports = { userLogin }