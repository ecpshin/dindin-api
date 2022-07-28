const express = require('express');
const app = express();
const cors = require('cors');
const rotas = require('./rotas');

app.use(cors());
app.use(express.json());
app.use(rotas);

app.listen(proccess.env.PORT || 3334);