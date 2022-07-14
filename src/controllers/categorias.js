const conexao = require('../conexao');


const listarCategorias = async (req, res) => {
    try {
        const { rows: categorias, rowCount: registros } = await conexao.query('SELECT * FROM categorias');

        if (registros === 0) {
            return res.status(404).json([]);
        }

        return res.status(200).json(categorias);

    } catch (error) {
        return res.status(500).json({ "mensagem": error.message });
    }
}

module.exports = {
    listarCategorias
}