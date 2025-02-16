'use server'
import { cookies } from "next/headers"
import conn from "./db"
import { Pool } from "pg"
import { Session } from "./types"
import { v4 as uuidv4 } from 'uuid';

export const getSession = async () => {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')
    
        if(!token) return null
    
        const query = 'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()'
    
        const result = await (conn as Pool).query(query, [token.value]);
        if (result.rows.length === 0) return null
    
    
        return result.rows[0] as Session
    } catch (error) {
        console.log(error)
        return null
    }
}
export const deleteSession = async () => {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')
    
        if(!token) return null

        const query = `DELETE FROM sessions WHERE token = $1`
        const result = await (conn as Pool).query(query, [token.value]);

        cookieStore.delete('token')

        return 'success'

    } catch (error) {
        return null
    }
}
export const createSession = async (userid: number) => {
    try {
        const cookieStore = await cookies()
        const token = uuidv4()
        const query = `INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '7 days')`
        const result = await (conn as Pool).query(query, [userid, token]);
        cookieStore.set('token', token)
        return token
    } catch (error) {
        return null
    }
}