import type { Metadata } from "next"

import { TeacherStudentsPage } from "@/components/teacher/teacher-pages"

export const metadata: Metadata = {
  title: "Teacher Students",
  description: "Students assigned to the current teacher.",
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>
}) {
  const params = await searchParams
  return <TeacherStudentsPage initialClassId={params.classId || "ALL"} />
}
