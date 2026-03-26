const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();
const PORT = 3000;

const db = new sqlite3.Database("./database.db");

db.run(`
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    phone TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

const ADMIN = { username: "admin", password: "123456" };

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "secret-key", resave: false, saveUninitialized: true }));

app.post("/submit", (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    db.run(
        "INSERT INTO feedback (name,email,phone,subject,message) VALUES (?,?,?,?,?)",
        [name, email, phone, subject, message],
        (err) => {
            if (err) return res.send("Lỗi!");
            res.send("Gửi góp ý thành công!");
        }
    );
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN.username && password === ADMIN.password) {
        req.session.auth = true;
        res.redirect("/admin.html");
    } else {
        res.send("Sai tài khoản!");
    }
});

app.get("/api/feedback", (req, res) => {
    if (!req.session.auth) return res.status(403).send("Forbidden");
    db.all("SELECT * FROM feedback ORDER BY created_at DESC", [], (err, rows) => {
        res.json(rows);
    });
});

app.listen(PORT, () => console.log("Server chạy tại http://localhost:" + PORT));
