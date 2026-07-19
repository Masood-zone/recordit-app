"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Button } from "@/components/ui/button"
import api from "@/lib/axios"

type NotificationItem = {
  channel?: string
  createdAt?: string
  id: string
  message?: string
  readAt?: string | null
  status?: string
  title?: string
  user?: { name?: string | null } | null
}

export function NotificationInbox({
  audienceLabel,
  basePath,
  canMarkRead = true,
}: {
  audienceLabel: string
  basePath: string
  canMarkRead?: boolean
}) {
  const queryClient = useQueryClient()
  const queryKey = [basePath, "notifications"]
  const inbox = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.get(`${basePath}/notifications`)
      if (!response.data.success) throw new Error(response.data.message || "Notifications could not be loaded")
      return response.data.data as { notifications: NotificationItem[]; unreadCount?: number }
    },
  })
  const markAll = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`${basePath}/notifications/read-all`, {})
      if (!response.data.success) throw new Error(response.data.message || "Notifications could not be updated")
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
      toast.success("All notifications marked as read")
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  })
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`${basePath}/notifications/${id}/read`, {})
      if (!response.data.success) throw new Error(response.data.message || "Notification could not be updated")
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Update failed"),
  })
  const items = inbox.data?.notifications || []

  return (
    <section className="rounded-xl border border-outline-variant bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-5">
        <div>
          <h2 className="text-xl font-bold">{audienceLabel} Notifications</h2>
          <p className="text-sm text-on-surface-variant">{inbox.data?.unreadCount || 0} unread notifications</p>
        </div>
        {canMarkRead ? <Button variant="outline" disabled={markAll.isPending || !items.length} onClick={() => markAll.mutate()}><MaterialSymbol icon="done_all" />Mark all read</Button> : null}
      </div>
      {inbox.isLoading ? <p className="p-5 text-on-surface-variant">Loading notifications...</p> : null}
      {!inbox.isLoading && !items.length ? <p className="p-5 text-on-surface-variant">No notifications yet.</p> : null}
      <div className="divide-y divide-outline-variant">
        {items.map((item) => <article key={item.id} className={`p-5 ${item.readAt ? "" : "bg-surface-container-low"}`}>
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><MaterialSymbol icon="notifications" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-bold">{item.title || "Notification"}</h3><time className="text-xs text-on-surface-variant">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</time></div>
              {item.user?.name ? <p className="mt-1 text-xs font-semibold text-on-surface-variant">Recipient: {item.user.name}</p> : null}
              <p className="mt-2 text-sm text-on-surface-variant">{item.message}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-on-surface-variant"><span>{item.channel || "IN_APP"}</span><span>{item.status || "SENT"}</span>{canMarkRead && !item.readAt ? <button type="button" className="font-semibold text-primary hover:underline" disabled={markRead.isPending} onClick={() => markRead.mutate(item.id)}>Mark as read</button> : null}</div>
            </div>
          </div>
        </article>)}
      </div>
    </section>
  )
}
