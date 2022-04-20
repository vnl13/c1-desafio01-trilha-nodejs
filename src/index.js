const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found." });
  }

  request.user = user;
  return next();
}

function checkTaskExists(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  const taskExists = user.todos.find((task) => task.id === id);
  if (!taskExists) {
    return response
      .status(404)
      .json({ error: "Task with provided ID not found." });
  }

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const user = users.find((user) => user.username === username);

  if (user) {
    return response.status(400).json({ error: "Username already exists." });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const todos = user.todos;
  return response.status(201).json(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTask = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTask);

  return response.status(201).json(newTask);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checkTaskExists,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;
    const { title, deadline } = request.body;

    user.todos = user.todos.map((task) =>
      task.id === id ? { ...task, title, deadline: new Date(deadline) } : task
    );

    const task = user.todos.find((task) => task.id === id);

    return response.status(201).send(task);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checkTaskExists,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;

    user.todos = user.todos.map((task) =>
      task.id === id ? { ...task, done: true } : task
    );

    const task = user.todos.find((task) => task.id === id);

    return response.status(201).send(task);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checkTaskExists,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;

    user.todos = user.todos.filter((task) => task.id !== id);

    return response.status(204).send();
  }
);

module.exports = app;
