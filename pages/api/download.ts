import { getFile } from "@/lib/files";
import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

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

    if (!fs.existsSync(file[0].path)) {
      return res.status(404).json({ error: "File not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename=${file[0].name}`);
    res.setHeader("Content-Type", "application/octet-stream");

    const fileStream = fs.createReadStream(file[0].path);
    fileStream.pipe(res);
  } catch (error) {
    console.log(error)
  }
}
