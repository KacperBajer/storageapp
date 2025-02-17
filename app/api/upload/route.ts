import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

// Wyłącz domyślną obsługę body w Next.js (ważne!)
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const uploadDir = '/mnt/storageapp/uploads';

    // Obsługa multipart/form-data
    const form = new IncomingForm({
      uploadDir,
      multiples: false,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB
    });

    return new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(NextResponse.json({ error: 'Błąd przesyłania' }, { status: 500 }));
          return;
        }

        const file = files.file[0]; // Pobranie pliku
        const filePath = path.join(uploadDir, file.originalFilename);

        // Przenoszenie pliku na docelową ścieżkę
        fs.renameSync(file.filepath, filePath);

        resolve(NextResponse.json({ success: true, path: filePath }, { status: 200 }));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Wystąpił błąd' }, { status: 500 });
  }
}
