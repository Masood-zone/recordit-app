import { AppStateScreen } from "@/components/app-state/app-state-screen"

export default function Loading() {
  return (
    <AppStateScreen
      eyebrow="Loading"
      title="Preparing RecordIT"
      description="Fetching the latest attendance workspace and security context."
      icon="progress_activity"
      isLoading
    />
  )
}
