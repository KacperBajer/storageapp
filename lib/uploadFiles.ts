"use server";

import { Pool } from "pg";
import { UploadedFile } from "./types";
import conn from "./db";
import { getUser } from "./users";

export const uploadFiles = async (files: UploadedFile[], folderId: string, token: string) => {
    try {

        if(!token) return 'error'

        const query = 'SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()'
    
        const result = await (conn as Pool).query(query, [token]);
        if (result.rows.length === 0) return 'error'
        let user = result.rows[0].user_id

        let createdFirstFolders = []

        for (const file of files) {
            const { savedPath, uniqueName, name, path } = file;
            let parentFolder = folderId;

            const pathParts = path.split("/").filter((part: string) => part !== ""); 
            const fileFolderPath = pathParts.slice(0, -1); 
            
            if(fileFolderPath[0] === '.') {
                const query = 'INSERT INTO files (name, path, folder_id, user_id) VALUES ($1, $2, $3, $4)'
                const result = await (conn as Pool).query(query, [file.name, file.savedPath, folderId, user])
                continue
            }


            let firstFolder = createdFirstFolders.find(f => f.name === fileFolderPath[0]);

            if(firstFolder) {
                parentFolder = firstFolder.id
            } else {
                const queryFirstFolder = 'INSERT INTO folders (name, parent_id, user_id) VALUES ($1, $2, $3) RETURNING *'
                const firstFolderResult = await (conn as Pool).query(queryFirstFolder, [fileFolderPath[0], parentFolder, user])
                parentFolder = firstFolderResult.rows[0].id
                createdFirstFolders.push({name: fileFolderPath[0], id: firstFolderResult.rows[0].id})
            }

            const fileFolderPathWithoutFirst = fileFolderPath.slice(1);

            for (const folder of fileFolderPathWithoutFirst) {
            
                const checkQuery = 'SELECT id FROM folders WHERE name = $1 AND parent_id = $2'
                const checkResult = await (conn as Pool).query(checkQuery, [folder, parentFolder])
            
                if (checkResult.rows.length > 0) {
                    parentFolder = checkResult.rows[0].id
                } else {
                    const insertQuery = 'INSERT INTO folders (name, parent_id, user_id) VALUES ($1, $2, $3) RETURNING id'
                    const insertResult = await (conn as Pool).query(insertQuery, [folder, parentFolder, user])
                    parentFolder = insertResult.rows[0].id
                }
            }

            const query = 'INSERT INTO files (name, path, folder_id, user_id) VALUES ($1, $2, $3, $4)'
            const result = await (conn as Pool).query(query, [file.name, file.savedPath, parentFolder, user])
        }

        return 'success'

    } catch (error) {
        console.log(error)
        return 'error'
    }
}