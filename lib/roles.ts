import type { UserRole } from '@prisma/client'

export function isManagerRole(role: UserRole | string): boolean {
  return role === 'Manager'
}

export function isEditorRole(role: UserRole | string): boolean {
  return role === 'Editor'
}

export function canApprove(role: UserRole | string): boolean {
  return isManagerRole(role)
}

export function canEditApproved(role: UserRole | string): boolean {
  return isManagerRole(role)
}

export function canAccessSettings(role: UserRole | string): boolean {
  return isManagerRole(role)
}

export function canAccessAdmin(role: UserRole | string): boolean {
  return isManagerRole(role)
}

export function canAccessBank(role: UserRole | string): boolean {
  return isManagerRole(role)
}
