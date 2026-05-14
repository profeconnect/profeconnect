const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/v1", routes);

app.get("/", (req, res, next) => {
  res.json({
    message: "API AmigojoLive funcionando correctamente",
  });
  next();
});

app.use(errorMiddleware);

module.exports = app;