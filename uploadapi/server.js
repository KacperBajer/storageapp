const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Tworzymy folder "uploads" jeśli nie istnieje
const uploadDir = path.join("F:", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfiguracja Multer (przechowywanie plików)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Middleware do obsługi przesyłania plików
const upload = multer({
    storage,
    limits: { fileSize: 1024 * 1024 * 1024 * 100 }, // Maksymalny rozmiar pliku: 100GB
});

// Middleware CORS, aby zezwolić na żądania z frontendu
app.use(cors());
app.use(express.json({ limit: "10gb" }));
app.use(express.urlencoded({ limit: "10gb", extended: true }));
// Endpoint do uploadu plików
app.post("/upload", upload.array("files", 100000), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(req.files)

    const uploadedFiles = req.files.map((file) => ({
        filename: file.originalname,
        savedPath: `F:/uploads/${file.filename}`,
    }));

    res.json({ message: "Files uploaded successfully", files: uploadedFiles });
});

// Serwer startuje
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
});
