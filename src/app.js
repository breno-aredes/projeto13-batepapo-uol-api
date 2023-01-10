import express from "express";
import cors from "cors";

//cria porta para servidor
const PORT = 5000;
//cria o servidor
const server = express();
//libera acesso ao servidor
server.use(cors());
//utiliza json
server.use(express.json());

//roda server na porta 5000
server.listen(PORT);
