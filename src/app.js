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

//connect é uma função do mongo que retorna uma promisse, podendo assim usar then e catch
mongoClient.connect().then().catch();

//roda server na porta 5000
server.listen(PORT);
