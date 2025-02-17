// app/api/upload/route.js
import { NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join("/public", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

export async function POST(req) {
    return new Promise((resolve) => {
        upload(req, null, (err) => {
            if (err) {
                return resolve(NextResponse.json({ error: err.message }, { status: 500 }));
            }
            if (!req.files || req.files.length === 0) {
                return resolve(NextResponse.json({ error: "No files uploaded" }, { status: 400 }));
            }
            const uploadedFiles = req.files.map((file) => ({
                filename: file.originalname,
                savedPath: `F:/uploads/${file.filename}`,
            }));
            resolve(NextResponse.json({ message: "Files uploaded successfully", files: uploadedFiles }));
        });
    });
}
