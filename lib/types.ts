export type User = {
    id: string
    email: string
    created_at: Date
    username: string
    avatar: string
}
export type Session = {
    id: string
    user_id: number
    token: string
    expires_at: Date
    created_at: Date
}
export type UploadedFile = {
    lastModifiedDate: number
    name: string
    path: string
    savedPath: string
    uniqueName: string
}
export type File = {
    id: string
    name: string
    parent_id?: string
    created_at: Date
    type: 'folder' | 'file'
}
export type Permissions = {
    can_read: boolean
    can_write: boolean
    can_delete: boolean
    can_manage: boolean
    inherit: boolean
}
export type Zip = {
    id: string
    path: string
    created_at: Date
    user_id: string
    folder_id: string
}