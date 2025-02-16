'use server'

import { Pool } from "pg"
import conn from "./db"
import { getUser } from "./users"
import { File } from "./types"

export const getAllDisks = async () => {
    try {

        const user = await getUser()
        if(!user) return []

        const query = `SELECT * FROM folders WHERE parent_id IS NULL AND user_id = $1`
        const result = await (conn as Pool).query(query, [user.id])
        const rowsWithType = result.rows.map(row => ({
            ...row,
            type: 'folder',
        }));

        return rowsWithType as File[];
    } catch (error) {
        console.log(error)
        return []
    }
}