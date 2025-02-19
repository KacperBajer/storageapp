'use server'

import { revalidatePath } from "next/cache"

export const reloadPath = async (path: string) => {
  revalidatePath(path)
}