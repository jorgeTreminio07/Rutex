export interface RoleRow {
  id: string
  name: string
  description: string | null
  status_id: number
  permissions: unknown
  created_at?: string
}