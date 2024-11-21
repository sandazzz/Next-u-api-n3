const express = require("express");
const etag = require("etag");
const mongoose = require("mongoose");
const Todo = require("./todo");
const User = require("./models/user");
const authcontroller = require("./controller/authcontroller");
const authJwt = require("./middlewares/authJwt");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect("mongodb://localhost:27017/api-todos?retryWrites=true&w=majority")
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.get(
  "/api/todos",
  [authJwt.verifyToken, authJwt.isExist],
  async (req, res) => {
    try {
      const todos = await Todo.find();
      const todoJson = JSON.stringify(todos);
      res.json(todos);
    } catch (err) {
      res.status(500).send("Erreur lors de la récupération des tâches");
    }
  }
);
app.post(
  "/api/todos",
  [authJwt.verifyToken, authJwt.isExist, authJwt.isAdmin],
  async (req, res) => {
    try {
      const newTodo = new Todo({
        title: req.body.title,
        completed: req.body.completed || false,
      });

      const savedTodo = await newTodo.save();
      res.status(201).json(savedTodo);
    } catch (err) {
      res.status(500).send("Erreur lors de la création de la tâche");
    }
  }
);
app.get(
  "/api/todos/:id",
  [authJwt.verifyToken, authJwt.isExist],
  async (req, res) => {
    try {
      const todo = await Todo.findById(req.params.id);
      if (!todo) {
        return res.status(404).send("Tâche non trouvée");
      }
      const todoJson = JSON.stringify(todo);
      const hash = etag(todoJson);
      if (req.headers["if-none-match"] === hash) {
        return res.status(304).send(); // Pas de modifications, renvoyer 304 Not Modified
      }
      res.setHeader("ETag", hash);
      res.status(200).json(todo);
    } catch (err) {
      res.status(500).send("Erreur lors de la création de la tâche");
    }
  }
);
app.put(
  "/api/todos/:id",
  [authJwt.verifyToken, authJwt.isExist,authJwt.isAdmin],
  async (req, res) => {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).send("Tâche non trouvée");
    }
    const clientETag = req.headers["if-match"];
    const currentETag = etag(JSON.stringify(todo));
    console.log(clientETag);
    console.log(currentETag);
    if (clientETag !== currentETag) {
      return res.status(412).send("Precondition Failed: ETag mismatch"); // 412 Precondition Failed
    }
    todo.title = req.body.title || todo.title;
    todo.completed = req.body.completed || todo.completed;
    const updatedTodo = await todo.save();
    res.status(200).json(updatedTodo);
  }
);
app.get("/api/unsecured", (req, res) => {
  res.send("unsecured");
});
app.post("/api/auth/signup", authcontroller.signup);
app.post("/api/auth/signin", authcontroller.signin);

app.post("/user", async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }
    const newUser = new User({
      username,
      password,
      name,
      role,
    });

    const savedUser = await newUser.save();

    res.status(201).json(savedUser);
  } catch (err) {
    console.error("Erreur lors de la création de l'utilisateur :", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

app.get("/user/:username", async (req, res) => {
  console.log(req.params.username);
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).send("User non trouvée");
    }
    const userJson = JSON.stringify(user);
    const hash = etag(userJson);
    if (req.headers["if-none-match"] === hash) {
      return res.status(304).send();
    }
    res.setHeader("ETag", hash);
    res.status(200).json(user);
  } catch (err) {
    res.status(500).send("Erreur lors de la création de la tâche");
  }
});

app.put("/user/:username", async (req, res) => {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res.status(404).send("Utilisateur non trouvée");
  }
  const clientETag = req.headers["if-match"];
  const currentETag = etag(JSON.stringify(user));
  console.log(clientETag);
  console.log(currentETag);
  if (clientETag !== currentETag) {
    return res.status(412).send("Precondition Failed: ETag mismatch");
  }
  user.name = req.body.name;
  const updatedUser = await user.save();
  res.status(200).json(updatedUser);
});
module.exports = app;
