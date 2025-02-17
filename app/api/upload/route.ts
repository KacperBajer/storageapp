import { NextRequest, NextResponse } from "next/server";
import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
    // Tworzymy katalog, jeśli nie istnieje
    const uploadDir = path.join(process.cwd(), "public/uploads");
    await mkdir(uploadDir, { recursive: true });

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
        return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedFiles = [];

    for (const file of files) {
        const filePath = path.join(uploadDir, file.name);
        const stream = createWriteStream(filePath);
        const reader = file.stream().getReader();

        // Strumieniowe zapisywanie pliku
        async function write() {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                stream.write(value);
            }
            stream.end();
        }

        await write();

        uploadedFiles.push({
            filename: file.name,
            savedPath: `/uploads/${file.name}`,
        });
    }

    return NextResponse.json({ files: uploadedFiles });
}
