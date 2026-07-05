import type { Metadata } from "next"

import { SchoolsManagement } from "@/components/super-admin/schools-management"

export const metadata: Metadata = {
  title: "Schools | RecordIT Super Admin",
}

export default function SuperAdminSchoolsPage() {
  return <SchoolsManagement />
}
