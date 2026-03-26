const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Database
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

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: true
}));

// Trang chính
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// Gửi góp ý
app.post("/submit", (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.send("Thiếu thông tin!");
    }

    db.run(
        "INSERT INTO feedback (name,email,phone,subject,message) VALUES (?,?,?,?,?)",
        [name, email, phone, subject, message],
        (err) => {
            if (err) return res.send("Lỗi!");
            res.redirect("/?success=true");
        }
    );
});

// Login
app.post("/login", (req, res) => {
    if (req.body.username === "admin" && req.body.password === "123456") {
        req.session.auth = true;
        return res.redirect("/admin.html");
    }
    res.send("Sai tài khoản!");
});

// Lấy dữ liệu
app.get("/api/feedback", (req, res) => {
    if (!req.session.auth) return res.status(403).send("Forbidden");

    db.all("SELECT * FROM feedback ORDER BY created_at DESC", [], (err, rows) => {
        res.json(rows);
    });
});

// Xoá
app.get("/delete/:id", (req, res) => {
    if (!req.session.auth) return res.redirect("/login.html");

    db.run("DELETE FROM feedback WHERE id=?", [req.params.id], () => {
        res.redirect("/admin.html");
    });
});

// Tìm kiếm
app.get("/search", (req, res) => {
    if (!req.session.auth) return res.status(403).send("Forbidden");

    const keyword = "%" + req.query.q + "%";

    db.all(
        "SELECT * FROM feedback WHERE name LIKE ? OR subject LIKE ?",
        [keyword, keyword],
        (err, rows) => {
            res.json(rows);
        }
    );
});

// Start
app.listen(PORT, () => {
    console.log("Server chạy tại port " + PORT);
});