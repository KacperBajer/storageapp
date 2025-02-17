import { NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import fs from "fs-extra";

// Ścieżka do zapisu plików (zmień na własną, jeśli potrzebujesz)
const uploadDir = path.join("/public/", "uploads");

// Tworzymy folder "uploads", jeśli nie istnieje
fs.ensureDirSync(uploadDir);

// Konfiguracja Multer (przechowywanie plików)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 * 100 }, // 100GB
}).array("files", 100000);

// Obsługa przesyłania plików w Next.js
export async function POST(req) {
  return new Promise((resolve) => {
    upload(req, {}, (err) => {
      if (err) {
        resolve(NextResponse.json({ error: err.message }, { status: 500 }));
        return;
      }

      if (!req.files || req.files.length === 0) {
        resolve(NextResponse.json({ error: "No files uploaded" }, { status: 400 }));
        return;
      }

      const uploadedFiles = req.files.map((file) => ({
        filename: file.originalname,
        savedPath: path.join(uploadDir, file.filename),
      }));

      resolve(NextResponse.json({ message: "Files uploaded successfully", files: uploadedFiles }));
    });
  });
}
