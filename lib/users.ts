'use server'
import { cookies } from "next/headers";
import { User } from "./types";
import conn from "./db";
import { Pool } from "pg";
import { createSession, getSession } from "./sessions";
import bcrypt from "bcryptjs";


export const getUser = async () => {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('token')

        if (!token) return null

        const session = await getSession()

        if(!session) return null

        const query = `SELECT users.email, users.avatar, users.username, users.id, users.created_at FROM users WHERE id = $1`;
        const result = await (conn as Pool).query(query, [session.user_id]);

        if (result.rows.length === 0) return null

        return result.rows[0] as User
    } catch (error) {
        console.log(error)
        return null
    }
}
type AuthUserResponse = | {status: 'success'} | {status: 'error'; error: string}

export const loginUser = async (email: string, password: string) => {
    try {
        
        if(!email || !password) return {status: 'error', error: 'Email and password are required'} as AuthUserResponse

        const query = 'SELECT * FROM users WHERE email = $1'
        const result = await (conn as Pool).query(query, [email])

        if(result.rows.length < 1) return {status: 'error', error: 'Incorrect email or password'} as AuthUserResponse

        const passMatch = await bcrypt.compare(password, result.rows[0].password_hash); 
        if(!passMatch) return {status: 'error', error: 'Incorrect email or password'} as AuthUserResponse

        const session = await createSession(result.rows[0].id)
        if(!session) return {status: 'error', error: 'Something went wrong'} as AuthUserResponse

        await (conn as Pool).query("DELETE FROM sessions WHERE expires_at < NOW()")

        return {status: 'success'} as AuthUserResponse
    } catch (error) {
        console.log(error)
        return {status: 'error', error: 'Something went wrong'} as AuthUserResponse
    }
}
export const createUser = async (email: string, username: string, password: string) => {
    try {
        if(!email || !username || !password) return {status: 'error', error: 'Email, password and username are required'} as AuthUserResponse
        
        const query = 'SELECT * FROM users WHERE email = $1'
        const result = await (conn as Pool).query(query, [email])

        if(result.rows.length > 0) return {status: 'error', error: 'Email is already taken'} as AuthUserResponse
       
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        
        const createUserQuery = `INSERT INTO users (email, password_hash, username, avatar) VALUES ($1, $2, $3, '/avatar.png') RETURNING *`
        const createUserResult = await (conn as Pool).query(createUserQuery, [email, hash, username])

        const createFolderQuery = `INSERT INTO folders (name, user_id) VALUES ($1, $2)`;
        await (conn as Pool).query(createFolderQuery, [username, createUserResult.rows[0].id]);

        const session = await createSession(createUserResult.rows[0].id)
        if(!session) return {status: 'error', error: 'Something went wrong'} as AuthUserResponse

        return {status: 'success'} as AuthUserResponse
    } catch (error) {
        console.log(error)
        return {status: 'error', error: 'Something went wrong'} as AuthUserResponse
    }
}
export const checkPassword = async (password: string) => {
    try {
        if(!password) return false
        const user = await getUser()
        if(!user) return false
        const query = `SELECT * FROM users WHERE id = $1`
        const result = await (conn as Pool).query(query, [user.id])
        if(result.rows.length === 0) return false
        const passMatch = await bcrypt.compare(password, result.rows[0].password_hash); 
        if(!passMatch) return false
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}