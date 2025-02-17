import { NextResponse } from "next/server";
import multer from "multer";
import path from "path";
import { writeFile } from "fs/promises";

// 📌 Ścieżka zapisu plików
const uploadDir = "/mnt/hddstorage/uploads/";

// 📌 Obsługa uploadu (bez Multer)
export async function POST(req) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files.length) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
        }

        let uploadedFiles = [];

        for (const file of files) {
            if (!(file instanceof Blob)) continue;

            const buffer = Buffer.from(await file.arrayBuffer());
            const fileName = `${Date.now()}-${file.name}`;
            const filePath = path.join(uploadDir, fileName);

            await writeFile(filePath, buffer); // Zapisz plik na serwerze

            uploadedFiles.push({
                filename: file.name,
                savedPath: filePath,
            });
        }

        return NextResponse.json({ message: "Files uploaded successfully", files: uploadedFiles });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
