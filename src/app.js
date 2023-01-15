import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from 'joi'

dotenv.config();

//cria porta para servidor
const PORT = 5000;

//cria o servidor
const server = express();
//libera acesso ao servidor
server.use(cors());
//utiliza json
server.use(express.json());
//para usar mongoclient, conectado ao endereço
const mongoClient = new MongoClient(process.env.DATABASE_URL);

//connect para ter uma promisse, tenta conectar e o banco de dados
try {
  await mongoClient.connect();

  console.log("servidor conectado ao banco de dados mongodb");
} catch (err) {
  res.status(500).send("Erro no servidor");
}

//conecta db ao banco de dados fornecido pela connection string
const db = mongoClient.db();

server.get("/participants", async (req, res) => {
  try {
    const particiapants = await db.collection("participants").find().toArray();
    return res.send(particiapants);
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
});

server.post("/participants", async (req, res) => {
  const user = req.body;

  const userSchema = joi.object({
    name: joi.string().required()
  })

  const validation = userSchema.validate(user, { abortEarly: false })

  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const nameAlreadyListed = await db
      .collection("participants")
      .findOne({ name: user.name });

    if (nameAlreadyListed) {
      return res.status(409).send("Nome ja cadastrado");
    } //else if (name === "") return res.status(422).send("nome invalido");

    await db
      .collection("participants")
      .insertOne({ name: user.name , lastStatus: Date.now() });

    //nota* seria mais simpels ter usado dayjs(Date.now()).Format("HH.MM.SS")
    const currentTime =
      dayjs().get("hour", "HH") +
      ":" +
      dayjs().get("minute", "MM") +
      ":" +
      dayjs().get("second", "SS");

    await db.collection("messages").insertOne({
      from: user.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: currentTime,
    });

    res.status(201).send("ok");
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro no servidor");
  }
});

server.get("/messages", async (req, res) => {
  try {
    const particiapants = await db.collection("messages").find().toArray();
    return res.send(particiapants);
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
});

server.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const validType = ["message", "private_message"];
  const nameAlreadyListed = await db
    .collection("participants")
    .findOne({ name: user });
  console.log(nameAlreadyListed);

  try {
    if (
      to === "" ||
      text === "" ||
      !validType.includes(type) ||
      !nameAlreadyListed
    ) {
      return res.status(422).send("Erro encontrado");
    }

    const currentTime =
      dayjs().get("hour", "HH") +
      ":" +
      dayjs().get("minute", "MM") +
      ":" +
      dayjs().get("second", "SS");

    await db.collection("messages").insertOne({
      from: user,
      to,
      text,
      type,
      time: currentTime,
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro no servidor");
  }
});

//roda server na porta 5000
server.listen(PORT);
