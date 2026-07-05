import type { Metadata } from "next"

import { SchoolDetail } from "@/components/super-admin/school-detail"

type PageProps = {
  params: Promise<{ schoolId: string }>
}

export const metadata: Metadata = {
  title: "School Reports | RecordIT Super Admin",
}

export default async function SuperAdminSchoolReportsPage({
  params,
}: PageProps) {
  const { schoolId } = await params

  return <SchoolDetail schoolId={schoolId} initialTab="Reports" />
}
