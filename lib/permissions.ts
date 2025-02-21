'use server'

import { Pool } from "pg"
import conn from "./db"
import { Permissions } from "./types"
import { getUser } from "./users"
import { v4 as uuidv4 } from 'uuid';

export const getFolderPermissions = async (id: string) => {
    try {
        const user = await getUser()
        if (!user) return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
        } as Permissions

        const query = 'SELECT * FROM permissions WHERE folder_id = $1 AND user_id = $2'
        const result = await (conn as Pool).query(query, [id, user.id])

        if (result.rows.length < 1) return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
        } as Permissions

        return {
            can_manage: result.rows[0].can_manage,
            can_delete: result.rows[0].can_delete,
            can_read: result.rows[0].can_read,
            can_write: result.rows[0].can_write,
        } as Permissions
    } catch (error) {
        console.log(error)
        return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
        } as Permissions
    }
}
export const getShares = async (id: string, type: 'folder' | 'file') => {
    try {
        const user = await getUser()
        if (!user) return []
        if (type === 'file') {
            const checkUserPermissions = `SELECT * FROM files f JOIN permissions p ON p.file_id = f.id WHERE f.id = $1 AND p.user_id = $2 AND can_manage = TRUE`
            const resultCheckUserPermissions = await (conn as Pool).query(checkUserPermissions, [id, user.id])
            if (resultCheckUserPermissions.rows.length === 0) return []
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
WHERE p.file_id = $1;`
            const result = await (conn as Pool).query(query, [id])
            return result.rows
        }
        if (type === 'folder') {
            const checkUserPermissions = `SELECT * FROM folders f JOIN permissions p ON p.folder_id = f.id WHERE f.id = $1 AND p.user_id = $2 AND can_manage = TRUE`
            const resultCheckUserPermissions = await (conn as Pool).query(checkUserPermissions, [id, user.id])
            if (resultCheckUserPermissions.rows.length === 0) return []
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
WHERE p.folder_id = $1;`
            const result = await (conn as Pool).query(query, [id])
            return result.rows
        }
        return []
    } catch (error) {
        console.log(error)
        return []
    }
}

export const generateLink = async (type: 'download' | 'share', fileType: 'folder' | 'file', fileId: string, userId: string) => {
    try {
        if(fileType === 'file') {
            const query = `INSERT INTO links (type, file_id, user_id) VALUES ($1, $2, $3) RETURNING id`
            const result = await (conn as Pool).query(query, [type, fileId, userId])
            if(result.rows.length === 0) return {status: 'error', error: 'Something went wrong'}
            const link = `http://78.31.151.253:2999/sharelink/${result.rows[0].id}`
            return {status: 'success', link: link}
        }
        if(fileType === 'folder') {
            const query = `INSERT INTO links (type, folder_id, user_id) VALUES ($1, $2, $3) RETURNING id`
            const result = await (conn as Pool).query(query, [type, fileId, userId])
            if(result.rows.length === 0) return {status: 'error', error: 'Something went wrong'}
            const link = `http://78.31.151.253:2999/sharelink/${result.rows[0].id}`
            return {status: 'success', link: link}
        }
        return {status: 'error', error: 'Invalid type'}
    } catch (error) {
        return {status: 'error', error: 'Something went wrong'}
    }
}

export const addUserToShare = async (type: 'file' | 'folder', id: string, email: string) => {
    try {
      const user = await getUser();
      if (!user) {
        return { status: "error", error: "You must be logged in" };
      }
  
      const sharingUserQuery = `SELECT * FROM USERS WHERE email = $1`
      const sharingUserResult = await (conn as Pool).query(sharingUserQuery, [email])

      if(sharingUserResult.rows.length === 0) return {status: 'error', error: "Cannot find user"}

      const userId = sharingUserResult.rows[0].id

      if (type === "file") {
        const query = `INSERT INTO permissions (user_id, file_id, can_read, can_write, can_delete, can_manage) VALUES ($1, $2, TRUE, FALSE, FALSE, FALSE)`;
        await (conn as Pool).query(query, [userId, id]);
        return { status: "success" };
      }
  
      if (type === "folder") {
        const insertPermissions = async (folderId: string) => {
          const query = `INSERT INTO permissions (user_id, folder_id, can_read, can_write, can_delete, can_manage) VALUES ($1, $2, TRUE, FALSE, FALSE, FALSE)`;
          await (conn as Pool).query(query, [userId, folderId]);
  
          const filesQuery = `SELECT id FROM files WHERE folder_id = $1`;
          const filesResult = await (conn as Pool).query(filesQuery, [folderId]);
  
          for (const file of filesResult.rows) {
            const fileQuery = `INSERT INTO permissions (user_id, file_id, can_read, can_write, can_delete, can_manage) VALUES ($1, $2, TRUE, FALSE, FALSE, FALSE)`;
            await (conn as Pool).query(fileQuery, [userId, file.id]);
          }
  
          const subfoldersQuery = `SELECT id FROM folders WHERE parent_id = $1`;
          const subfoldersResult = await (conn as Pool).query(subfoldersQuery, [folderId]);
  
          for (const subfolder of subfoldersResult.rows) {
            await insertPermissions(subfolder.id);
          }
        };
  
        await insertPermissions(id);
        return { status: "success" };
      }
      return {status: 'error', error: 'Invalid type'}
    } catch (error) {
      console.log(error);
      return { status: "error", error: "Something went wrong" };
    }
  };
  