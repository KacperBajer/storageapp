import { getFile } from "@/lib/files";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
const fsPromises = require('fs').promises;

export const config = {
  api: {
    responseLimit: false,
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "ID is required" });
  }

  const cookies = req.headers.cookie || "";
  const token = cookies
    .split("; ")
    .find((row) => row.startsWith("token="))
    ?.split("=")[1];

  try {
    const file = await getFile(id as string, token as string);

    const stats = await fsPromises.stat(file[0].path);
    res.writeHead(200, {
      "Content-Disposition": `attachment; filename="${file[0].name}"`,
      "Content-Type": "application/octet-stream",
      "Content-Length": stats.size,
    });

    const readStream = fs.createReadStream(file[0].path);
    readStream.pipe(res);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
