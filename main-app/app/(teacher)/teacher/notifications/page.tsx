import { NotificationInbox } from "@/components/common/notification-inbox"
import { PageHeader } from "@/components/school-admin/school-admin-ui"

export default function TeacherNotificationsPage() {
  return <div><PageHeader title="Notifications" description="Review account and school notifications." /><NotificationInbox audienceLabel="Your" basePath="/teacher" /></div>
}
