'use server'

import { Pool } from "pg"
import conn from "./db"
import { addUserToShare } from "./permissions";
import { getUser } from "./users";

export const generateShareLink = async (
    fileType: "folder" | "file",
    fileId: string,
    userId: string
) => {
    try {
        if (fileType === "file") {
            const query = `INSERT INTO links (function, file_id, user_id) VALUES ($1, $2, $3) RETURNING id`;
            const result = await (conn as Pool).query(query, ['share', fileId, userId]);
            if (result.rows.length === 0)
                return { status: "error", error: "Something went wrong" };
            const link = `http://78.31.151.253:2999/sharelink/${result.rows[0].id}`;
            return { status: "success", link: link };
        }
        if (fileType === "folder") {
            const query = `INSERT INTO links (function, folder_id, user_id) VALUES ($1, $2, $3) RETURNING id`;
            const result = await (conn as Pool).query(query, ['share', fileId, userId]);
            if (result.rows.length === 0)
                return { status: "error", error: "Something went wrong" };
            const link = `http://78.31.151.253:2999/sharelink/${result.rows[0].id}`;
            return { status: "success", link: link };
        }
        return { status: "error", error: "Invalid type" };
    } catch (error) {
        return { status: "error", error: "Something went wrong" };
    }
};


const linkFunctions: Record<string, (data: any) => any> = {
    share: async (data) => {
        const user = await getUser()
        if(!user) return { status: "error", error: "You must be logged in" };
        const res = await addUserToShare(data.file_id ? 'file' : 'folder', data.file_id || data.folder_id, user.email)
        return res
    },
    downlaod: async (data) => {
        console.log("Executing anotherFunction with:", data);
        return { message: "Function executed", data };
    }
};


export const executeLink = async (id: string) => {
    try {
        const user = await getUser()
        if(!user) return { status: "error", error: "You must be logged in" };
        const query = `SELECT * FROM links WHERE id = $1 AND expires_at > NOW()`
        const result = await (conn as Pool).query(query, [id])
        if (result.rows.length === 0) return { status: "error", error: "Link not found" };
        
        if (result.rows[0].function in linkFunctions) {
            const response = await linkFunctions[result.rows[0].function](result.rows[0]);
            if(response.status === 'error') {
                return {status: 'error', error: response.error}
            }
            return { status: 'success', data: result.rows[0] }
        } else {
            return { status: "error", error: `Function '${result.rows[0].function}' not found` };
        }
    } catch (error) {
        console.log(error)
        return { status: "error", error: "Something went wrong" };
    }
}