const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

const PUBLIC_DIR = path.resolve(__dirname, "../public");
const FRONTEND_DIST = path.resolve(__dirname, "../../frontend/dist");

const allowedOrigins = [
  'https://amigojolive.onrender.com',
  'http://localhost:5173',
  'http://localhost:4173',
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(
  "/public",
  express.static(PUBLIC_DIR, {
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}documents${path.sep}`) || filePath.includes('/documents/') || filePath.includes('\\documents\\')) {
        const filename = path.basename(filePath);
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      }
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

app.use("/api/v1", routes);

const frontendExists = fs.existsSync(FRONTEND_DIST);

if (frontendExists) {
  app.use(express.static(FRONTEND_DIST));
  app.get("*", (req, res) => {
    res.sendFile(path.join(FRONTEND_DIST, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "API AmigojoLive funcionando correctamente" });
  });
}

app.use(errorMiddleware);

module.exports = app;