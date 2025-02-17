import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest) {
    return new Promise((resolve, reject) => {
        const form = new IncomingForm({
            uploadDir: path.join(process.cwd(), 'public/uploads'),
            keepExtensions: true,
            multiples: true,
        });

        form.parse(req, (err, fields, files) => {
            if (err) {
                reject(NextResponse.json({ error: 'Upload failed' }, { status: 500 }));
            }

            resolve(NextResponse.json({ message: 'Files uploaded', files }));
        });
    });
}
