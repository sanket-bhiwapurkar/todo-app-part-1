const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");
const filePath = path.join(__dirname, "todoApplication.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: filePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//Get todos API 1
app.get("/todos/", async (request, response) => {
  const requestQuery = request.query;

  const { search_q = "", priority, status } = request.query;
  let getTodosQuery = "";
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }
  const todos = await db.all(getTodosQuery);
  response.send(todos);
});

//Get todo API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//Add todo API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO todo 
    (id, todo, priority, status) VALUES 
    (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Update todo API 4
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateTodoQuery = "";
  if ("status" in requestBody) {
    updateTodoQuery = `
    UPDATE todo SET
    status = '${requestBody.status}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Status Updated");
  } else if ("priority" in requestBody) {
    updateTodoQuery = `
    UPDATE todo SET
    priority = '${requestBody.priority}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Priority Updated");
  } else {
    updateTodoQuery = `
    UPDATE todo SET
    todo = '${requestBody.todo}' WHERE id = ${todoId};`;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  }
});
//Delete todo API 5
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
