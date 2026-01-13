const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// ⚠️ Weak secret on purpose
const JWT_SECRET = "ctfsecret";

app.use(bodyParser.json());
app.use(express.static("public"));

// Database
const db = new sqlite3.Database("./db.sqlite");

// Setup DB
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS secrets (
      flag TEXT
    )
  `);

  db.run(`DELETE FROM secrets`);
  db.run(`INSERT INTO secrets VALUES ('CTF{second_order_sqli_master}')`);
});

// Login route
app.post("/login", (req, res) => {
  const { username } = req.body;

  // Everyone logs in as normal user
  const token = jwt.sign(
    { user: username, role: "user" },
    JWT_SECRET
  );

  res.json({ token });
});

// Middleware (⚠️ trusts JWT blindly)
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).send("No token");

  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
}

// Search route
app.post("/api/search", auth, (req, res) => {
  const { query } = req.body;

  // Store input safely
  db.run(
    "INSERT INTO searches (query) VALUES (?)",
    [query],
    () => {
      res.json({ message: "Search saved" });
    }
  );
});

// Export route (⚠️ second-order SQLi)
app.get("/api/export", auth, (req, res) => {
  if (req.user.role !== "supervisor") {
    return res.status(403).send("Not allowed");
  }

  db.get("SELECT query FROM searches ORDER BY id DESC LIMIT 1", (err, row) => {
    if (!row) return res.send("No searches");

    const unsafeQuery = `
      SELECT flag FROM secrets WHERE flag LIKE '%${row.query}%'
    `;

    db.all(unsafeQuery, (err, rows) => {
      if (err) return res.send("Error generating report");
      res.json(rows);
    });
  });
});

app.listen(PORT, () => {
  console.log(`CTF server running at http://localhost:${PORT}`);
});
