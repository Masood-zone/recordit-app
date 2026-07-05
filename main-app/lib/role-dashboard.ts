export type DashboardRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "PARENT"
  | "PARENT_GUARDIAN"

export function getDashboardHref(role?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
      return "/super-admin/dashboard"
    case "ADMIN":
    case "SCHOOL_ADMIN":
      return "/admin/dashboard"
    case "TEACHER":
      return "/teacher/dashboard"
    case "PARENT":
    case "PARENT_GUARDIAN":
      return "/parent/dashboard"
    default:
      return "/"
  }
}

export function getDashboardLabel(role?: string | null) {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin Dashboard"
    case "ADMIN":
    case "SCHOOL_ADMIN":
      return "Admin Dashboard"
    case "TEACHER":
      return "Teacher Dashboard"
    case "PARENT":
    case "PARENT_GUARDIAN":
      return "Parent Dashboard"
    default:
      return "Dashboard"
  }
}
