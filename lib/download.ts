"use server";
import fs from "fs";
import path from "path";
import { getUser } from "./users";
import { getFile } from "./files";

export async function downloadFile(id: string) {
  try {
    const user = await getUser();
    if (!user) return;
    const file = await getFile(id);
    if (!file) return;

    if (!fs.existsSync(file[0].path)) {
      return;
    }

    const fileStream = fs.createReadStream(file[0].path);
    return new Response(fileStream, {
      headers: {
          'Content-Disposition': `attachment; filename=${file[0].name}`,
          'Content-Type': 'application/octet-stream',
      },
  });
  } catch (error) {
    console.log(error);
    return
  }
}
