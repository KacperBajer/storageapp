"use server";

import { Pool } from "pg";
import conn from "./db";
import { Permissions } from "./types";
import { getUser } from "./users";

export const getFolderPermissions = async (id: string) => {
  try {
    const user = await getUser();
    if (!user) {
      return {
        can_manage: false,
        can_delete: false,
        can_read: false,
        can_write: false,
      } as Permissions;
    }

    const folderQuery = "SELECT user_id, parent_id FROM folders WHERE id = $1";
    const folderResult = await (conn as Pool).query(folderQuery, [id]);

    if (folderResult.rows.length === 0) {
      return {
        can_manage: false,
        can_delete: false,
        can_read: false,
        can_write: false,
      } as Permissions;
    }

    const folderOwnerId = folderResult.rows[0].user_id;
    const isRootFolder = folderResult.rows[0].parent_id === null;
    const isUserOwner = folderOwnerId === user.id;

    const query =
      "SELECT * FROM permissions WHERE folder_id = $1 AND user_id = $2";
    const result = await (conn as Pool).query(query, [id, user.id]);

    if (result.rows.length > 0) {
      return {
        can_manage: result.rows[0].can_manage,
        can_delete: result.rows[0].can_delete,
        can_read: result.rows[0].can_read,
        can_write: result.rows[0].can_write,
      } as Permissions;
    }

    if (isRootFolder && !isUserOwner) {
      const filesQuery = `
        WITH RECURSIVE folder_tree AS (
            SELECT id FROM folders WHERE id = $1
            UNION ALL
            SELECT f.id FROM folders f
            INNER JOIN folder_tree ft ON f.parent_id = ft.id
        )
        SELECT 1 
        FROM files fi
        JOIN permissions p ON p.file_id = fi.id
        WHERE fi.folder_id IN (SELECT id FROM folder_tree)
        AND p.user_id = $2
        AND p.can_read = TRUE
        LIMIT 1;
      `;

      const filesResult = await (conn as Pool).query(filesQuery, [id, user.id]);

      if (filesResult.rows.length > 0) {
        return {
          can_manage: false,
          can_delete: false,
          can_read: true,
          can_write: false,
        } as Permissions;
      }
    }

    return {
      can_manage: false,
      can_delete: false,
      can_read: false,
      can_write: false,
    } as Permissions;
  } catch (error) {
    console.log(error);
    return {
      can_manage: false,
      can_delete: false,
      can_read: false,
      can_write: false,
    } as Permissions;
  }
};

export const getShares = async (id: string, type: "folder" | "file") => {
  try {
    const user = await getUser();
    if (!user) return [];
    if (type === "file") {
      const checkUserPermissions = `SELECT * FROM files f JOIN permissions p ON p.file_id = f.id WHERE f.id = $1 AND p.user_id = $2 AND can_manage = TRUE`;
      const resultCheckUserPermissions = await (conn as Pool).query(
        checkUserPermissions,
        [id, user.id]
      );
      if (resultCheckUserPermissions.rows.length === 0) return [];
      const query = `SELECT 
  u.id, 
  u.email, 
  u.created_at, 
  u.username, 
  u.avatar,
  json_build_object(
    'id', p.id,
    'can_read', p.can_read,
    'can_write', p.can_write,
    'can_delete', p.can_delete,
    'can_manage', p.can_manage
  ) AS permissions
FROM permissions p 
JOIN users u ON u.id = p.user_id 
WHERE p.file_id = $1;`;
      const result = await (conn as Pool).query(query, [id]);
      return result.rows;
    }
    if (type === "folder") {
      const checkUserPermissions = `SELECT * FROM folders f JOIN permissions p ON p.folder_id = f.id WHERE f.id = $1 AND p.user_id = $2 AND can_manage = TRUE`;
      const resultCheckUserPermissions = await (conn as Pool).query(
        checkUserPermissions,
        [id, user.id]
      );
      if (resultCheckUserPermissions.rows.length === 0) return [];
      const query = `SELECT 
  u.id, 
  u.email, 
  u.created_at, 
  u.username, 
  u.avatar,
  json_build_object(
    'id', p.id,
    'can_read', p.can_read,
    'can_write', p.can_write,
    'can_delete', p.can_delete,
    'can_manage', p.can_manage
  ) AS permissions
FROM permissions p 
JOIN users u ON u.id = p.user_id 
WHERE p.folder_id = $1;`;
      const result = await (conn as Pool).query(query, [id]);
      return result.rows;
    }
    return [];
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const addUserToShare = async (
  type: "file" | "folder",
  id: string,
  email: string,
) => {
  try {
    const user = await getUser();
    if (!user) {
      return { status: "error", error: "You must be logged in" };
    }

    const sharingUserQuery = `SELECT * FROM users WHERE email = $1`;
    const sharingUserResult = await (conn as Pool).query(sharingUserQuery, [
      email,
    ]);

    if (sharingUserResult.rows.length === 0)
      return { status: "error", error: "Cannot find user" };

    if(sharingUserResult.rows[0].id === user.id) return { status: "error", error: "Cannot share for himself" };

    const userId = sharingUserResult.rows[0].id;

    if (type === "file") {
      const checkPermissions = `SELECT * FROM permissions WHERE file_id = $1 AND user_id = $2 AND can_manage = TRUE`;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [id, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

        const query = `SELECT * FROM files WHERE id = $1`
        const result = await (conn as Pool).query(query, [id])

      const parentFolderQuery = `
  WITH RECURSIVE parent_folders AS (
    SELECT id, parent_id FROM folders WHERE id = $1
    UNION ALL
    SELECT f.id, f.parent_id FROM folders f
    INNER JOIN parent_folders pf ON f.id = pf.parent_id
) 
SELECT 1 FROM parent_folders pf 
WHERE EXISTS (SELECT 1 FROM share WHERE folder_id = pf.id AND user_id = $2);
`;
      const parentFolderResult = await (conn as Pool).query(parentFolderQuery, [
        result.rows[0].folder_id,
        userId,
      ]);

      if (parentFolderResult.rows.length === 0) {
        const query = `SELECT * FROM files WHERE id = $1`;
        const result = await (conn as Pool).query(query, [id]);
        await (conn as Pool).query(
          `INSERT INTO share (user_id, file_id, owner_id) VALUES ($1, $2, $3)`,
          [userId, id, result.rows[0].user_id]
        );
      }

      const insertPermissions = async (fileId: string) => {
        const insertQuery = `
            INSERT INTO permissions (user_id, file_id, folder_id, can_read, can_write, can_delete, can_manage)
            VALUES ($1, CASE WHEN EXISTS (SELECT 1 FROM files WHERE id = $2) THEN $2 ELSE NULL END, 
                        CASE WHEN EXISTS (SELECT 1 FROM folders WHERE id = $2) THEN $2 ELSE NULL END, 
                        TRUE, FALSE, FALSE, FALSE)
        `;
        await (conn as Pool).query(insertQuery, [userId, fileId]);
      };

      await insertPermissions(id);
      return { status: "success" };
    }

    if (type === "folder") {
      const checkPermissions = `SELECT * FROM permissions WHERE folder_id = $1 AND user_id = $2 AND can_manage = TRUE`;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [id, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

      const deleteSubShares = async (folderId: string) => {
        await (conn as Pool).query(
          `DELETE FROM share WHERE folder_id = $1 AND user_id = $2`,
          [folderId, userId]
        );

        const subfoldersQuery = `SELECT id FROM folders WHERE parent_id = $1`;
        const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [
          folderId,
        ]);

        for (const subfolder of subfoldersResult.rows) {
          await deleteSubShares(subfolder.id);
        }

        const filesQuery = `SELECT id FROM files WHERE folder_id = $1`;
        const filesResult = await (conn as Pool).query(filesQuery, [folderId]);

        for (const file of filesResult.rows) {
          await (conn as Pool).query(
            `DELETE FROM share WHERE file_id = $1 AND user_id = $2`,
            [file.id, userId]
          );
        }
      };

      await deleteSubShares(id);

      const parentFolderQuery = `
        WITH RECURSIVE parent_folders AS (
    SELECT id, parent_id FROM folders WHERE id = $1
    UNION ALL
    SELECT f.id, f.parent_id FROM folders f
    INNER JOIN parent_folders pf ON f.id = pf.parent_id
) 
SELECT 1 FROM parent_folders pf 
WHERE EXISTS (SELECT 1 FROM share WHERE folder_id = pf.id AND user_id = $2);
`;

      const parentFolderResult = await (conn as Pool).query(parentFolderQuery, [
        id,
        userId,
      ]);

      if (parentFolderResult.rows.length === 0) {
        const query = `SELECT * FROM folders WHERE id = $1`;
        const result = await (conn as Pool).query(query, [id]);
        await (conn as Pool).query(
          `INSERT INTO share (user_id, folder_id, owner_id) VALUES ($1, $2, $3)`,
          [userId, id, result.rows[0].user_id]
        );
      }

      const insertPermissions = async (folderId: string) => {
        const insertQuery = `
            INSERT INTO permissions (user_id, file_id, folder_id, can_read, can_write, can_delete, can_manage)
            VALUES ($1, CASE WHEN EXISTS (SELECT 1 FROM files WHERE id = $2) THEN $2 ELSE NULL END, 
                        CASE WHEN EXISTS (SELECT 1 FROM folders WHERE id = $2) THEN $2 ELSE NULL END, 
                        TRUE, FALSE, FALSE, FALSE)
        `;
        await (conn as Pool).query(insertQuery, [userId, folderId]);

        const filesQuery = `SELECT id FROM files WHERE folder_id = $1`;
        const filesResult = await (conn as Pool).query(filesQuery, [folderId]);

        for (const file of filesResult.rows) {
          await insertPermissions(file.id);
        }

        const subfoldersQuery = `SELECT id FROM folders WHERE parent_id = $1`;
        const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [
          folderId,
        ]);

        for (const subfolder of subfoldersResult.rows) {
          await insertPermissions(subfolder.id);
        }
      };

      await insertPermissions(id);
      return { status: "success" };
    }

    return { status: "error", error: "Invalid type" };
  } catch (error) {
    console.log(error);
    return { status: "error", error: "Something went wrong" };
  }
};

export const changePermissions = async (
  userId: string,
  fileType: "file" | "folder",
  fileId: string,
  can_read: boolean,
  can_write: boolean,
  can_delete: boolean,
  can_manage: boolean
) => {
  try {
    const user = await getUser();
    if (!user) {
      return { status: "error", error: "You must be logged in" };
    }

    if (fileType === "file") {
      const checkPermissions = `SELECT * FROM permissions WHERE file_id = $1 AND user_id = $2 AND can_manage = TRUE`;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [fileId, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

      const query = `
        UPDATE permissions 
        SET can_read = $1, can_write = $2, can_delete = $3, can_manage = $4
        WHERE user_id = $5 AND file_id = $6`;
      await (conn as Pool).query(query, [
        can_read,
        can_write,
        can_delete,
        can_manage,
        userId,
        fileId,
      ]);
      return { status: "success" };
    }

    if (fileType === "folder") {
      const checkPermissions = `SELECT * FROM permissions WHERE folder_id = $1 AND user_id = $2 AND can_manage = TRUE`;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [fileId, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

      const updatePermissions = async (folderId: string) => {
        const query = `
          UPDATE permissions 
          SET can_read = $1, can_write = $2, can_delete = $3, can_manage = $4
          WHERE user_id = $5 AND folder_id = $6`;
        await (conn as Pool).query(query, [
          can_read,
          can_write,
          can_delete,
          can_manage,
          userId,
          folderId,
        ]);

        const filesQuery = `SELECT id FROM files WHERE folder_id = $1`;
        const filesResult = await (conn as Pool).query(filesQuery, [folderId]);

        for (const file of filesResult.rows) {
          const fileQuery = `
            UPDATE permissions 
            SET can_read = $1, can_write = $2, can_delete = $3, can_manage = $4
            WHERE user_id = $5 AND file_id = $6`;
          await (conn as Pool).query(fileQuery, [
            can_read,
            can_write,
            can_delete,
            can_manage,
            userId,
            file.id,
          ]);
        }

        const subfoldersQuery = `SELECT id FROM folders WHERE parent_id = $1`;
        const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [
          folderId,
        ]);

        for (const subfolder of subfoldersResult.rows) {
          await updatePermissions(subfolder.id);
        }
      };

      await updatePermissions(fileId);
      return { status: "success" };
    }

    return { status: "error", error: "Invalid type" };
  } catch (error) {
    console.log(error);
    return { status: "error", error: "Something went wrong" };
  }
};
export const removePermissions = async (
  userId: string,
  fileType: "file" | "folder",
  fileId: string
) => {
  try {
    const user = await getUser();
    if (!user) {
      return { status: "error", error: "You must be logged in" };
    }

    if (fileType === "file") {
      const checkPermissions = `
        SELECT * FROM permissions 
        WHERE file_id = $1 AND user_id = $2 AND can_manage = TRUE
      `;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [fileId, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

      // Usuwamy permissions
      await (conn as Pool).query(
        `DELETE FROM permissions WHERE user_id = $1 AND file_id = $2`,
        [userId, fileId]
      );

      // Sprawdzamy, czy plik jest w share i usuwamy go
      await (conn as Pool).query(
        `DELETE FROM share WHERE user_id = $1 AND file_id = $2`,
        [userId, fileId]
      );

      return { status: "success" };
    }

    if (fileType === "folder") {
      const checkPermissions = `
        SELECT * FROM permissions 
        WHERE folder_id = $1 AND user_id = $2 AND can_manage = TRUE
      `;
      const checkPermissionsResult = await (conn as Pool).query(
        checkPermissions,
        [fileId, user.id]
      );
      if (checkPermissionsResult.rows.length === 0)
        return { status: "error", error: "You do not have permissions" };

      const deletePermissions = async (folderId: string) => {
        // Usuwamy permissions dla folderu
        await (conn as Pool).query(
          `DELETE FROM permissions WHERE user_id = $1 AND folder_id = $2`,
          [userId, folderId]
        );

        // Usuwamy share dla folderu
        await (conn as Pool).query(
          `DELETE FROM share WHERE user_id = $1 AND folder_id = $2`,
          [userId, folderId]
        );

        // Pobieramy wszystkie pliki w folderze i usuwamy permissions + share
        const filesQuery = `SELECT id FROM files WHERE folder_id = $1`;
        const filesResult = await (conn as Pool).query(filesQuery, [folderId]);

        for (const file of filesResult.rows) {
          await (conn as Pool).query(
            `DELETE FROM permissions WHERE user_id = $1 AND file_id = $2`,
            [userId, file.id]
          );
          await (conn as Pool).query(
            `DELETE FROM share WHERE user_id = $1 AND file_id = $2`,
            [userId, file.id]
          );
        }

        // Pobieramy subfoldery i usuwamy ich permissions + share
        const subfoldersQuery = `SELECT id FROM folders WHERE parent_id = $1`;
        const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [
          folderId,
        ]);

        for (const subfolder of subfoldersResult.rows) {
          await deletePermissions(subfolder.id);
        }
      };

      await deletePermissions(fileId);
      return { status: "success" };
    }

    return { status: "error", error: "Invalid type" };
  } catch (error) {
    console.log(error);
    return { status: "error", error: "Something went wrong" };
  }
};

