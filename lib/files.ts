'use server'

import { Pool } from "pg"
import conn from "./db"
import { getUser } from "./users"

export const getFiles = async (folderId: string) => {
    try {
        const user = await getUser()
        if (!user) return

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
        `

        const result = await (conn as Pool).query(query, [folderId, user.id])
        return result.rows
    } catch (error) {
        console.log(error)
    }
}

type Path = {
    name: string,
    id: string
}

export const getFolderPath = async (folderId: string) => {
    try {
        let pathParts: Path[] = [];
        let currentId: string | null = folderId;
        const query = `SELECT name, parent_id, id FROM folders WHERE id = $1`
        while (currentId !== null) {
            
            const result = await (conn as Pool).query(query, [currentId]);
    
            if (result.rows.length === 0) break;
    
            const { name, parent_id, id } = result.rows[0];
    
            pathParts.unshift({name: name, id: id}); 
            currentId = parent_id; 
        }
        

        return pathParts
    } catch (error) {
        return []
    }
}