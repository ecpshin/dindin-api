DROP DATABASE dindin;

CREATE DATABASE dindin;

DROP TABLE IF EXISTS usuarios;

CREATE TABLE IF NOT EXISTS usuarios(
	id SERIAL,
	nome TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	senha TEXT NOT NULL,
  PRIMARY KEY (id)
);

DROP TABLE IF EXISTS categorias;

CREATE TABLE IF NOT EXISTS categorias(
  id SERIAL NOT NULL,
  descricao TEXT NOT NULL,
  PRIMARY KEY(id)
);

DROP TABLE IF EXISTS transacoes;

CREATE TABLE IF NOT EXISTS transacoes (
  id SERIAL NOT NULL,
  tipo CHAR(7) NOT NULL,
  descricao TEXT NOT NULL,
  valor INTEGER NOT NULL DEFAULT 0,
  "data" TIMESTAMPTZ NOT NULL,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,  
  PRIMARY KEY(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

INSERT INTO 
	categorias (descricao) 
VALUES ('Alimentação'), ('Assinaturas e Serviços'), ('Roupas'), ('Casa'), 
('Mercado'), ('Salário'), ('Cuidados Pessoais'), ('Educação'), ('Família'), 
('Lazer'), ('Pets'), ('Presentes'), ('Saúde'), ('Transporte'), ('Vendas'),
('Outras receitas'), ('Outras despesas');