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

    const query = `SELECT z.id, z.created_at, z.folder_id, z.user_id, z.path, z.name FROM zips z JOIN permissions p ON p.folder_id = z.folder_id WHERE p.folder_id = $1 AND p.user_id = $2 AND p.can_read = TRUE ORDER BY z.created_at DESC`;
    const result = await (conn as Pool).query(query, [folderId, user.id]);

    return result.rows as Zip[];
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const getZip = async (id: string, token: string) => {
  try {
    if (!token) return "error";

    const queryUser =
      "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()";

    const resultUser = await (conn as Pool).query(queryUser, [token]);
    if (resultUser.rows.length === 0) return "error";
    const user = resultUser.rows[0].user_id;

    const query = `SELECT z.id, z.created_at, z.folder_id, z.user_id, z.path, z.name FROM zips z JOIN permissions p ON p.folder_id = z.folder_id WHERE z.id = $1 AND p.user_id = $2 AND p.can_read = TRUE`;
    const result = await (conn as Pool).query(query, [id, user]);

    return result.rows[0] as Zip;
  } catch (error) {
    console.log(error);
    return "error";
  }
};

type ZipResponse = { status: "error"; error?: string } | { status: "success" };
export const createZip = async (folderId: string) => {
  try {
    const user = await getUser();
    if (!user)
      return {
        status: "error",
        error: "You must be logged in",
      } as ZipResponse;

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
      } as ZipResponse;

    const folderContents = await getFolderContents(folderId);
    if (!folderContents || folderContents.length === 0)
      return {
        status: "error",
        error: "Cannot find folder",
      } as ZipResponse;

    const id = uuidv4();

    const zipPath = path.join("/mnt/hhdstorage/zips", `${id}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);

    for (const file of folderContents) {
      archive.file(file.path, { name: file.zipPath });
    }

    await archive.finalize();

    const query = `INSERT INTO zips (path, user_id, folder_id, name) VALUES ($1, $2, $3, $4)`;
    const result = await (conn as Pool).query(query, [
      zipPath,
      user.id,
      folderId,
      `${id}.zip`,
    ]);

    return { status: "success" } as ZipResponse;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: "Something went wrong",
    } as ZipResponse;
  }
};

export const deleteZip = async (zipId: string) => {
  try {
    const user = await getUser();
    if (!user)
      return {
        status: "error",
        error: "You must be logged in",
      } as ZipResponse;

    const queryFetch = `SELECT path FROM zips z JOIN permissions p ON p.folder_id = z.folder_id WHERE z.id = $1 AND p.user_id = $2 AND p.can_delete = TRUE`;
    const resultFetch = await (conn as Pool).query(queryFetch, [
      zipId,
      user.id,
    ]);

    if (resultFetch.rows.length === 0)
      return {
        status: "error",
        error: "Zip file not found or you do not have permission to delete it",
      } as ZipResponse;

    const zipPath = resultFetch.rows[0].path;

    fs.unlink(zipPath, (err) => {
      if (err) console.error("Error deleting file:", err);
    });

    const queryDelete = `DELETE FROM zips WHERE id = $1`;
    await (conn as Pool).query(queryDelete, [zipId]);

    return { status: "success" } as ZipResponse;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: "Something went wrong",
    } as ZipResponse;
  }
};

type DeleteResponse =
  | { status: "error"; error?: string }
  | { status: "success" };
export const deleteFile = async (id: string, type: "folder" | "file") => {
  try {
    const user = await getUser();
    if (!user)
      return {
        status: "error",
        error: "You must be logged in",
      } as DeleteResponse;

    if (type === "file") {
      const queryFetch = `SELECT f.path FROM files f JOIN permissions p ON p.file_id = f.id WHERE f.id = $1 AND p.user_id = $2 AND p.can_delete = TRUE`;
      const resultFetch = await (conn as Pool).query(queryFetch, [id, user.id]);

      if (resultFetch.rows.length === 0)
        return {
          status: "error",
          error: "File not found or you do not have permission to delete it",
        } as DeleteResponse;
      const path = resultFetch.rows[0].path;

      fs.unlink(path, (err) => {
        if (err) console.error("Error deleting file:", err);
      });

      const queryDelete = `DELETE FROM files WHERE id = $1`;
      await (conn as Pool).query(queryDelete, [id]);

      return { status: "success" } as DeleteResponse;
    }

    if (type === "folder") {
      const filesQuery = `SELECT f.id, f.path FROM files f JOIN permissions p ON p.file_id = f.id WHERE f.folder_id = $1 AND p.user_id = $2 AND p.can_delete = TRUE`;
      const filesResult = await (conn as Pool).query(filesQuery, [id, user.id]);

      for (const file of filesResult.rows) {
        fs.unlink(file.path, (err) => {
          if (err) console.error("Error deleting file:", err);
        });
      }

      const deleteFilesQuery = `DELETE FROM files 
WHERE id IN (
    SELECT f.id 
    FROM files f
    JOIN permissions p ON p.file_id = f.id
    WHERE f.folder_id = $1 AND p.user_id = $2 AND p.can_delete = TRUE
);
`;
      await (conn as Pool).query(deleteFilesQuery, [id, user.id]);

      const subfoldersQuery = `SELECT f.id FROM folders f JOIN permissions p ON p.folder_id = f.id WHERE f.parent_id = $1 AND p.user_id = $2 AND p.can_delete = TRUE`;
      const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [
        id,
        user.id,
      ]);

      for (const subfolder of subfoldersResult.rows) {
        await deleteFile(subfolder.id, "folder");
      }

      const deleteFolderQuery = `DELETE FROM folders 
WHERE id IN (
    SELECT f.id 
    FROM folders f
    JOIN permissions p ON p.folder_id = f.id
    WHERE f.id = $1 AND p.user_id = $2 AND p.can_delete = TRUE
);`;
      await (conn as Pool).query(deleteFolderQuery, [id, user.id]);

      return { status: "success" } as DeleteResponse;
    }
    return {
      status: "error",
      error: "Invalid type of file",
    } as DeleteResponse;
  } catch (error) {
    console.log(error);
    return {
      status: "error",
      error: "Something went wrong",
    } as DeleteResponse;
  }
};
