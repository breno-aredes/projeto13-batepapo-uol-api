import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

//cria porta para servidor
const PORT = process.env.PORT;

//cria o servidor
const server = express();
//libera acesso ao servidor
server.use(cors());
//utiliza json
server.use(express.json());
//para usar mongoclient, conectado ao endereço
const mongoClient = new MongoClient(process.env.DATABASE_URL);
//conecta db ao banco de dados fornecido pela connection string
let db = mongoClient.db();

//connect é uma função do mongo que retorna uma promisse que conecta o servidor ao banco de dados, podendo assim usar then e catch
mongoClient
  .connect()
  .then(() => {
    console.log("servidor conectado ao banco de dados mongodb");
  })
  .catch(() => {
    console.log("caminho não encontrado");
  });

server.get("/participants", (req, res) => {
  db.collection("participants")
    .find()
    .toArray()
    .then((dados) => {
      return res.send(dados);
    })
    .catch(() => console.log("algum erro"));
});

//roda server na porta 5000
server.listen(PORT);
