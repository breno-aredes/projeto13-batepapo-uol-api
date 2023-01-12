import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

//cria porta para servidor
const PORT = 5000;

//cria o servidor
const server = express();
//libera acesso ao servidor
server.use(cors());
//utiliza json
server.use(express.json());
//para usar mongoclient, conectado ao endereço
const mongoClient = new MongoClient("mongodb://127.0.0.1:27017");
let db;

//connect é uma função do mongo que retorna uma promisse que conecta o servidor ao banco de dados, podendo assim usar then e catch
mongoClient
  .connect()
  .then(() => {
    db = mongoClient.db("DATABASE_URL");
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
