import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

dotenv.config();

//cria porta para servidor
const PORT = 5000;

//cria o servidor
const server = express();
//libera acesso ao servidor
server.use(cors());
//para utilizar json
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
    name: joi.string().required(),
  });

  const validation = userSchema.validate(user, { abortEarly: false });

  if (validation.error) {
    const err = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(err);
  }

  try {
    const nameAlreadyListed = await db
      .collection("participants")
      .findOne({ name: user.name });

    if (nameAlreadyListed) {
      return res.status(409).send("Nome ja cadastrado");
    }

    await db
      .collection("participants")
      .insertOne({ name: user.name, lastStatus: Date.now() });

    const currentTime = dayjs(Date.now()).format("HH:mm:ss");

    await db.collection("messages").insertOne({
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      from: user.name,
      time: currentTime,
    });

    res.status(201).send("ok");
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro no servidor");
  }
});

server.get("/messages", async (req, res) => {
  const { limit } = req.query;
  const user = req.headers.user;

  try {
    const messages = await db
      .collection("messages")
      .find({ $or: [{ from: user }, { to: { $in: ["Todos", user] } }] })
      .toArray();

    if (limit) {
      if (limit <= 0 || isNaN(limit) === true) {
        return res.sendStatus(422);
      }
      const lastMessages = messages.slice(limit * -1).reverse();
      return res.send(lastMessages);
    }

    return res.send(messages);
  } catch (err) {
    res.status(500).send("Erro no servidor");
  }
});

server.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;

  const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message").valid("private_message").required(),
    from: joi.string().required(),
  });

  const validate = messageSchema.validate(
    { to, text, type, from: user },
    { abortEarly: false }
  );

  if (validate.error) {
    const err = validate.error.details.map((detail) => detail.message);
    return res.status(422).send(err);
  }

  const nameAlreadyListed = await db
    .collection("participants")
    .findOne({ name: user });

  if (!nameAlreadyListed) return res.sendStatus(422);

  try {
    const currentTime = dayjs(Date.now()).format("HH:mm:ss");

    await db.collection("messages").insertOne({
      to,
      text,
      type,
      from: user,
      time: currentTime,
    });

    res.sendStatus(201);
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro no servidor");
  }
});

server.delete("/messages/:id", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  const { id } = req.params;

  const nameAlreadyListed = await db
    .collection("participants")
    .findOne({ name: user });

  if (!nameAlreadyListed) return res.sendStatus(422);

  const deleteSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message").valid("private_message").required(),
    from: joi.string().valid().required(),
  });

  const validate = deleteSchema.validate(
    { to, text, type, from: user },
    { abortEarly: false }
  );

  if (validate.error) {
    const err = validate.error.details.map((detail) => detail.message);
    return res.status(422).send(err);
  }

  try {
    const findMessage = await db
      .collection("messages")
      .findOne({ _id: ObjectId(id) });

    if (!findMessage) {
      return res.sendStatus(404);
    }

    if (findMessage.from != user) {
      return res.sendStatus(401);
    }

    await db.collection("messages").deleteOne({ _id: ObjectId(id) });
    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.status(500).send("Erro no servidor");
  }
});

server.post("/Status", async (req, res) => {
  const user = req.headers.user;

  try {
    const registeredUser = await db
      .collection("participants")
      .findOne({ name: user });

    if (!registeredUser) return res.sendStatus(404);

    db.collection("participants").updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );

    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

setInterval(async () => {
  const millisecondsUser = await db.collection("participants").find().toArray();
  const currentTime = dayjs(Date.now()).format("HH:mm:ss");
  try {
    millisecondsUser.filter(async (item) => {
      if (item.lastStatus + 10000 <= Date.now()) {
        await db.collection("messages").insertOne({
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          from: item.name,
          time: currentTime,
        });
        db.collection("participants").deleteOne(item);
      }
    });
  } catch {
    res.sendStatus(500);
  }
}, 150000000);

//roda server na porta 5000
server.listen(PORT);
