import type { Metadata } from "next"

import { SchoolDetail } from "@/components/super-admin/school-detail"

type PageProps = {
  params: Promise<{ schoolId: string }>
}

export const metadata: Metadata = {
  title: "School Students | RecordIT Super Admin",
}

export default async function SuperAdminSchoolStudentsPage({
  params,
}: PageProps) {
  const { schoolId } = await params

  return <SchoolDetail schoolId={schoolId} initialTab="Students" />
}
