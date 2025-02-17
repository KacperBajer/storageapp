import nextConnect from "next-connect";
import multer from "multer";
import { NextResponse } from "next/server";

// Konfiguracja Multer
const upload = multer({ dest: "/mnt/hddstorage/uploads/" });

const apiRoute = nextConnect();

apiRoute.use(upload.array("files"));

apiRoute.post((req, res) => {
    console.log("Received files:", req.files); // 🔍 Debugowanie

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    res.json({ message: "Files uploaded", files: req.files });
});

// Eksport jako Edge API (Next.js 15)
export const config = {
    api: {
        bodyParser: false, // ❌ Wyłącz defaultowy bodyParser
    },
};

export default apiRoute;
