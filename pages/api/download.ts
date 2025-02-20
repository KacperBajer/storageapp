import { getFile, getFolderContents } from "@/lib/files";
import fs from "fs";
import path from "path";
import archiver from "archiver";
import { NextApiRequest, NextApiResponse } from "next";

const fsPromises = require("fs").promises;

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id, type } = req.query;
  if (!type) {
    return res.status(400).json({ error: "Type is required" });
  }

  const cookies = req.headers.cookie || "";
  const token = cookies
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  try {
    if (type === "file") {
      if (!id) return res.status(400).json({ error: "ID is required" });

      const file = await getFile(id as string, token as string);
      if (!file || file.length === 0) {
        return res.status(404).json({ error: "File not found" });
      }

      const stats = await fsPromises.stat(file[0].path);
      res.writeHead(200, {
        "Content-Disposition": `attachment; filename="${file[0].name}"`,
        "Content-Type": "application/octet-stream",
        "Content-Length": stats.size,
      });

      const readStream = fs.createReadStream(file[0].path);
      readStream.pipe(res);
    } 
    
    else if (type === "folder") {
      if (!id) return res.status(400).json({ error: "ID is required" });

      const folderContents = await getFolderContents(id as string, token as string);
      if (!folderContents || folderContents.length === 0) {
        return res.status(404).json({ error: "Folder is empty or not found" });
      }

      const zipPath = path.join("/tmp", `folder_${id}.zip`);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver("zip", { zlib: { level: 9 } });

      archive.pipe(output);

      for (const file of folderContents) {
        archive.file(file.path, { name: file.zipPath });
      }

      await archive.finalize();
      output.on("close", () => {
        res.writeHead(200, {
          "Content-Disposition": `attachment; filename="folder_${id}.zip"`,
          "Content-Type": "application/zip",
          "Content-Length": fs.statSync(zipPath).size,
        });

        const readStream = fs.createReadStream(zipPath);
        readStream.pipe(res);
      });
    } 
    else {
      return res.status(400).json({ error: "Invalid type parameter" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
