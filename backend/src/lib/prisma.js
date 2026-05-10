require("dotenv/config");

const { Pool } = require("pg");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const connectionString =
  process.env.DATABASE_APP_URL ||
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "Defina DIRECT_URL o DATABASE_URL en backend/.env para conectar Prisma."
  );
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 60_000,
  max: 10,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
