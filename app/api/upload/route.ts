import { NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Wyłączamy bodyParser, bo Formidable obsłuży strumień
  },
};

export async function POST(req) {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024 * 1024, // 50GB limit
    });

    form.on('fileBegin', (name, file) => {
      file.filepath = path.join(uploadDir, file.uniqueFileName);
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(NextResponse.json({ error: 'File upload failed', details: err }, { status: 500 }));
      }
      resolve(NextResponse.json({ message: 'File uploaded successfully', files }));
    });
  });
}
