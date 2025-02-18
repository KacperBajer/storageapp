import { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { uploadFiles } from "@/lib/uploadFiles";
import { UploadedFile } from "@/lib/types";

// Konfiguracja Next.js, aby wyłączyć domyślną obsługę body parsera
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  
  const cookies = req.headers.cookie || ""
  const token = cookies
    .split("; ")
    .find((row) => row.startsWith("token=")) 
    ?.split("=")[1]; 
  console.log('token', token)

  try {
    const uploadDir = path.join("/mnt/hhdstorage", "/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      multiples: true,
      maxFileSize: 100 * 1024 * 1024 * 1024, // 100GB
      uploadDir,
      filename: (name, ext, part) => `${Date.now()}-${part.originalFilename}`,
    });

    const [fields, files] = await form.parse(req);
    const folderId = fields.folderId?.[0] || ''
    const filesWithPath = fields.filesWithPath
      ? JSON.parse(fields.filesWithPath[0])
      : [];

    const uploadedFiles = Object.values(files)
      .flat()
      .map((file) => ({
        filename: (file as formidable.File).newFilename,
        savedPath: `/mnt/hhdstorage/uploads/${(file as formidable.File).newFilename}`,
        originalName: (file as formidable.File).originalFilename,
      }));

    const mergedFiles: UploadedFile[] = uploadedFiles.map((file: any) => {
      const matchingFile = filesWithPath.find(
        (f: any) => f.uniqueName === file.originalName
      );

      return {
        savedPath: file.savedPath,
        ...(matchingFile ? matchingFile : {}),
      };
    });

    const addToDB = await uploadFiles(mergedFiles, folderId, (token as string));
    if(addToDB === 'error') {
      return res.status(500).json({ error: "File upload failed" });
    }

    return res.status(200).json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "File upload failed" });
  }
}
