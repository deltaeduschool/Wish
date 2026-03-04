import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("memories.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed default data if empty
const count = db.prepare("SELECT count(*) as count FROM memories").get() as { count: number };
if (count.count === 0) {
  const insert = db.prepare("INSERT INTO memories (url, title) VALUES (?, ?)");
  const defaults = [
    { url: 'https://picsum.photos/seed/love1/600/600', title: 'Our First Date' },
    { url: 'https://picsum.photos/seed/love2/600/600', title: 'Summer Trip' },
    { url: 'https://picsum.photos/seed/love3/600/600', title: 'Beautiful Moments' },
    { url: 'https://picsum.photos/seed/love4/600/600', title: 'Together Forever' },
    { url: 'https://picsum.photos/seed/love5/600/600', title: 'Laughs & Joy' },
    { url: 'https://picsum.photos/seed/love6/600/600', title: 'My Everything' },
  ];
  defaults.forEach(m => insert.run(m.url, m.title));
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/memories", (req, res) => {
    const memories = db.prepare("SELECT * FROM memories ORDER BY id ASC").all();
    res.json(memories);
  });

  app.post("/api/memories", (req, res) => {
    const { url, title } = req.body;
    const result = db.prepare("INSERT INTO memories (url, title) VALUES (?, ?)").run(url, title);
    const newMemory = { id: result.lastInsertRowid, url, title };
    io.emit("memory:added", newMemory);
    res.json(newMemory);
  });

  app.put("/api/memories/:id", (req, res) => {
    const { id } = req.params;
    const { url, title } = req.body;
    db.prepare("UPDATE memories SET url = ?, title = ? WHERE id = ?").run(url, title, id);
    const updatedMemory = { id: Number(id), url, title };
    io.emit("memory:updated", updatedMemory);
    res.json(updatedMemory);
  });

  app.delete("/api/memories/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM memories WHERE id = ?").run(id);
    io.emit("memory:deleted", Number(id));
    res.sendStatus(200);
  });

  app.post("/api/memories/reset", (req, res) => {
    db.prepare("DELETE FROM memories").run();
    const insert = db.prepare("INSERT INTO memories (url, title) VALUES (?, ?)");
    const defaults = [
      { url: 'https://picsum.photos/seed/love1/600/600', title: 'Our First Date' },
      { url: 'https://picsum.photos/seed/love2/600/600', title: 'Summer Trip' },
      { url: 'https://picsum.photos/seed/love3/600/600', title: 'Beautiful Moments' },
      { url: 'https://picsum.photos/seed/love4/600/600', title: 'Together Forever' },
      { url: 'https://picsum.photos/seed/love5/600/600', title: 'Laughs & Joy' },
      { url: 'https://picsum.photos/seed/love6/600/600', title: 'My Everything' },
    ];
    defaults.forEach(m => insert.run(m.url, m.title));
    const memories = db.prepare("SELECT * FROM memories ORDER BY id ASC").all();
    io.emit("memories:reset", memories);
    res.json(memories);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
