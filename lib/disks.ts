'use server'

import { Pool } from "pg"
import conn from "./db"
import { getUser } from "./users"
import { File } from "./types"

export const getAllDisks = async () => {
  try {
    const user = await getUser();
    if (!user) return [];

    const query = `
      WITH RECURSIVE shared_folders AS (
        -- Pobierz foldery, które są udostępnione użytkownikowi
        SELECT f.id, f.parent_id, f.user_id
        FROM folders f
        JOIN share s ON f.id = s.folder_id
        WHERE s.user_id = $1
        UNION
        -- Idź w górę drzewa folderów, aby znaleźć folder główny
        SELECT parent_folders.id, parent_folders.parent_id, parent_folders.user_id
        FROM folders parent_folders
        JOIN shared_folders sf ON sf.parent_id = parent_folders.id
      )
      SELECT DISTINCT f.*
      FROM folders f
      WHERE f.parent_id IS NULL
      AND (
        f.user_id = $1  -- Pobierz foldery użytkownika
        OR f.id IN (SELECT id FROM shared_folders) -- Pobierz foldery główne, jeśli mają udostępnione podfoldery
      )
    `;

    const result = await (conn as Pool).query(query, [user.id]);

    const rowsWithType = result.rows.map(row => ({
      ...row,
      type: 'folder',
    }));

    return rowsWithType as File[];
  } catch (error) {
    console.log(error);
    return [];
  }
};




  