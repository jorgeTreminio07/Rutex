export interface RoleDto {
  id: string
  name: string
  description: string | null
  statusId: number
  permissions: string[]
}

export interface RoleForUser {
  id: string
  name: string
  description: string | null
}

export interface UserDto {
  id: string
  username: string
  firstName: string | null
  lastName: string | null
  email: string | null
  imageUrl: string | null
  signatureUrl: string | null
  role: RoleForUser | null
  statusId: number
}
