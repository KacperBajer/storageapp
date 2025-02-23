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
        WITH RECURSIVE folder_tree AS (
          -- Pobieramy wszystkie foldery zaczynające się od root
          SELECT id, parent_id 
          FROM folders 
          WHERE parent_id IS NULL
          
          UNION ALL
          
          -- Rekurencyjnie dodajemy dzieci folderów
          SELECT f.id, f.parent_id
          FROM folders f
          INNER JOIN folder_tree ft ON f.parent_id = ft.id
        ),
        accessible_files AS (
          -- Pobieramy foldery, które zawierają pliki dostępne dla użytkownika
          SELECT DISTINCT fi.folder_id 
          FROM files fi 
          JOIN permissions p ON p.file_id = fi.id 
          WHERE p.user_id = $1 AND p.can_read = TRUE
        ),
        accessible_folders AS (
          -- Pobieramy wszystkie foldery, które zawierają dostępne pliki
          SELECT id, parent_id
          FROM folders 
          WHERE id IN (SELECT folder_id FROM accessible_files)
          
          UNION ALL
          
          -- Rekurencyjnie dodajemy wszystkie foldery nadrzędne
          SELECT f.id, f.parent_id
          FROM folders f
          INNER JOIN accessible_folders af ON f.id = af.parent_id
        )
  
        SELECT DISTINCT f.*
        FROM folders f
        WHERE f.parent_id IS NULL 
          AND (
            -- Foldery, do których użytkownik ma bezpośredni dostęp
            EXISTS (
              SELECT 1 FROM permissions WHERE user_id = $1 AND can_read = TRUE AND f.id = folder_id
            )
            -- Lub foldery, które są w drzewie nadrzędnym folderów zawierających pliki dostępne dla użytkownika
            OR EXISTS (
              SELECT 1 FROM accessible_folders af WHERE af.id = f.id
            )
          );
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
  