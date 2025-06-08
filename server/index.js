import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

const app = express();
const port = process.env.PORT || 5000;
const targetDb = "tododb";

// Step 1: Connect to default "postgres" DB
const initPool = new Pool({
  connectionString: process.env.PG_URI.replace(targetDb, "postgres"),
  ssl: {
    rejectUnauthorized: false, 
  },
});

// Create the database if it doesn't exist
async function createDatabase() {
  try {
    console.log("Original PG_URI:", process.env.PG_URI);
    console.log(
      "Modified URI:",
      process.env.PG_URI.replace(targetDb, "postgres")
    );

    const result = await initPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    console.log("Database Connected");

    if (result.rowCount === 0) {
      await initPool.query(`CREATE DATABASE ${targetDb}`);
      console.log(`✅ Database "${targetDb}" created.`);
    } else {
      console.log(`ℹ️ Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error("❌ Failed to create database:", err);
    throw err;
  }
}

// Create the todos table if it doesn't exist
async function createTodosTable(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL
      );
    `);
    console.log('✅ Table "todos" is ready.');
  } catch (err) {
    console.error("❌ Failed to create todos table:", err);
    throw err;
  }
}

// Main DB setup + server start
async function startServer() {
  try {
    await createDatabase();

    const pool = new Pool({
      connectionString: process.env.PG_URI,
      ssl: {
        rejectUnauthorized: false, // Allow self-signed certs (Render default)
      },
    });

    await createTodosTable(pool);

    app.use(cors());
    app.use(express.json());

    // Routes
    app.get("/todos", async (req, res) => {
      try {
        const result = await pool.query("SELECT * FROM todos ORDER BY id");
        res.json(result.rows);
      } catch (err) {
        console.error("GET /todos error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.post("/todos", async (req, res) => {
      try {
        const { title } = req.body;
        const result = await pool.query(
          "INSERT INTO todos (title) VALUES ($1) RETURNING *",
          [title]
        );
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error("POST /todos error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.delete("/todos/:id", async (req, res) => {
      try {
        const { id } = req.params;
        await pool.query("DELETE FROM todos WHERE id = $1", [id]);
        res.sendStatus(204);
      } catch (err) {
        console.error("DELETE /todos/:id error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err);
  }
}

startServer();
