"use server";

import { Pool } from "pg";
import conn from "./db";
import { getUser } from "./users";
import { getFolderPermissions } from "./permissions";
import { revalidatePath } from "next/cache";
import path from "path";
import { Zip } from "./types";
import fs from "fs";
import archiver from "archiver";
import { v4 as uuidv4 } from "uuid";

export const getFiles = async (folderId: string) => {
  try {
    const user = await getUser();
    if (!user) return;

    const query = `
            SELECT 
                f.id, 
                f.name, 
                f.created_at,
                'file' AS type,
                p.can_read, 
                p.can_write, 
                p.can_delete,
                p.inherit
            FROM files f
            JOIN permissions p ON p.file_id = f.id
            WHERE f.folder_id = $1
            AND p.user_id = $2
            AND p.can_read = TRUE
            
            UNION
            
            SELECT 
                d.id, 
                d.name,
                d.created_at,
                'folder' AS type,
                p.can_read, 
                p.can_write, 
                p.can_delete,
                p.inherit
            FROM folders d
            JOIN permissions p ON p.folder_id = d.id
            WHERE d.parent_id = $1
            AND p.user_id = $2
            AND p.can_read = TRUE;
        `;

    const result = await (conn as Pool).query(query, [folderId, user.id]);
    return result.rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

type Path = {
  name: string;
  id: string;
};

export const getFolderPath = async (folderId: string) => {
  try {
    let pathParts: Path[] = [];
    let currentId: string | null = folderId;
    const query = `SELECT name, parent_id, id FROM folders WHERE id = $1`;
    while (currentId !== null) {
      const result = (await (conn as Pool).query(query, [currentId])) as any;

      if (result.rows.length === 0) break;

      const { name, parent_id, id } = result.rows[0];

      pathParts.unshift({ name: name, id: id });
      currentId = parent_id;
    }

    return pathParts;
  } catch (error) {
    return [];
  }
};

export const getFile = async (id: string, token: string) => {
  try {
    if (!token) return "error";

    const queryUser =
      "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()";

    const resultUser = await (conn as Pool).query(queryUser, [token]);
    if (resultUser.rows.length === 0) return "error";
    let user = resultUser.rows[0].user_id;

    const query = ` SELECT 
                f.id, 
                f.name, 
                f.created_at,
                f.path,
                'file' AS type,
                p.can_read, 
                p.can_write, 
                p.can_delete,
                p.inherit
            FROM files f
            JOIN permissions p ON p.file_id = f.id
            WHERE f.id = $1
            AND p.user_id = $2
            AND p.can_read = TRUE`;
    const result = await (conn as Pool).query(query, [id, user]);
    return result.rows;
  } catch (error) {
    console.log(error);
    return [];
  }
};

type CreateDirectoryResponse =
  | { status: "error"; error?: string }
  | { status: "success" };
export const createDirectory = async (folderId: string, name: string) => {
  try {
    const user = await getUser();
    if (!user)
      return {
        status: "error",
        error: "You have to sign in!",
      } as CreateDirectoryResponse;
    const permissions = await getFolderPermissions(folderId);
    if (!permissions.can_write)
      return {
        status: "error",
        error: "You do not have permissions!",
      } as CreateDirectoryResponse;

    const query = `INSERT INTO folders (name, parent_id, user_id) VALUES ($1, $2, $3)`;
    const result = await (conn as Pool).query(query, [name, folderId, user.id]);
    revalidatePath(`/folder/${folderId}`);
    return { status: "success" } as CreateDirectoryResponse;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: "Something went wrong!",
    } as CreateDirectoryResponse;
  }
};

export const getFolderContents = async (folderId: string, basePath = "") => {
  try {
    const user = await getUser();
    if (!user) return "error";

    const queryFolderName = `SELECT name FROM folders WHERE id = $1`;
    const resultFolderName = await (conn as Pool).query(queryFolderName, [
      folderId,
    ]);

    if (resultFolderName.rows.length === 0) return [];
    const folderName = resultFolderName.rows[0].name;
    const folderPath = path.join(basePath, folderName);

    const queryFiles = `
            SELECT 
                f.id, 
                f.name, 
                f.path,
                'file' AS type
            FROM files f
            JOIN permissions p ON p.file_id = f.id
            WHERE f.folder_id = $1
            AND p.user_id = $2
            AND p.can_read = TRUE
        `;
    const resultFiles = await (conn as Pool).query(queryFiles, [
      folderId,
      user.id,
    ]);

    let files = resultFiles.rows.map((file) => ({
      ...file,
      zipPath: path.join(folderPath, file.name),
    }));

    const queryFolders = `
            SELECT id FROM folders 
            WHERE parent_id = $1
            AND user_id = $2
        `;
    const resultFolders = await (conn as Pool).query(queryFolders, [
      folderId,
      user.id,
    ]);

    for (const subfolder of resultFolders.rows) {
      const subfolderFiles = await getFolderContents(subfolder.id, folderPath);
      files.push(...subfolderFiles);
    }

    return files;
  } catch (error) {
    console.log(error);
    return [];
  }
};
export const getZips = async (folderId: string) => {
  try {
    const user = await getUser();
    if (!user) return [];

    const query = `SELECT z.id, z.created_at, z.folder_id, z.user_id, z.path FROM zips z JOIN permissions p ON p.folder_id = z.folder_id WHERE p.folder_id = $1 AND p.user_id = $2 AND p.can_read = TRUE`;
    const result = await (conn as Pool).query(query, [folderId, user.id]);

    return result.rows as Zip[];
  } catch (error) {
    console.log(error);
    return [];
  }
};
type CreateZipResponse =
  | { status: "error"; error?: string }
  | { status: "success" };
export const createZip = async (folderId: string) => {
  try {
    const user = await getUser();
    if (!user)
      return {
        status: "error",
        error: "You must be logged in",
      } as CreateZipResponse;

    const queryPermissions = `SELECT *
            FROM folders f
            JOIN permissions p ON p.folder_id = f.id
            WHERE f.id = $1
            AND p.user_id = $2
            AND p.can_read = TRUE`;
    const resultPermissions = await (conn as Pool).query(queryPermissions, [
      folderId,
      user.id,
    ]);
    if (resultPermissions.rows.length === 0)
      return {
        status: "error",
        error: "You do not have permissions for this",
      } as CreateZipResponse;

    const folderContents = await getFolderContents(folderId);
    if (!folderContents || folderContents.length === 0) return  {
        status: "error",
        error: "Cannot find folder",
      } as CreateZipResponse;

    const id = uuidv4();

    const zipPath = path.join("/mnt/hhdstorage/zips", `${id}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    for (const file of folderContents) {
      archive.file(file.path, { name: file.zipPath });
    }

    await archive.finalize();

    const query = `INSERT INTO zips (path, user_id, folder_id) VALUES ($1, $2, $3)`;
    const result = await (conn as Pool).query(query, [
      zipPath,
      user.id,
      folderId,
    ]);

    return { status: "success" } as CreateZipResponse;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: "Something went wrong",
    } as CreateZipResponse;
  }
};
