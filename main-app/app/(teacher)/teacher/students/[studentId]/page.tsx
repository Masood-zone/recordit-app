import type { Metadata } from "next"

import { TeacherStudentProfilePage } from "@/components/teacher/teacher-pages"

export const metadata: Metadata = {
  title: "Update Student",
  description: "Update a student assigned to the current teacher.",
}

export default function Page() {
  return <TeacherStudentProfilePage />
}
