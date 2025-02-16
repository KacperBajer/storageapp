'use server'

import { Pool } from "pg"
import conn from "./db"
import { Permissions } from "./types"
import { getUser } from "./users"

export const getFolderPermissions = async (id: string) => {
    try {
        const user = await getUser()
        if(!user) return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
            inherit: false
        } as Permissions

        const query = 'SELECT * FROM permissions WHERE folder_id = $1 AND user_id = $2'
        const result = await (conn as Pool).query(query, [id, user.id])
        
        if(result.rows.length < 1) return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
            inherit: false
        } as Permissions
        
        return {
            can_manage: result.rows[0].can_manage,
            can_delete: result.rows[0].can_delete,
            can_read: result.rows[0].can_read,
            can_write: result.rows[0].can_write,
            inherit: result.rows[0].inherit
        } as Permissions
    } catch (error) {
        console.log(error)
        return {
            can_manage: false,
            can_delete: false,
            can_read: false,
            can_write: false,
            inherit: false
        } as Permissions
    }
}