"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"

const nav = [
  { href: "/teacher/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/teacher/students", icon: "groups", label: "Students" },
  {
    href: "/teacher/attendance-sessions",
    icon: "fingerprint",
    label: "Attendance Sessions",
  },
  // { href: "/teacher/pending-attendance", icon: "pending_actions", label: "Pending Attendance" },
  { href: "/teacher/reports", icon: "analytics", label: "Reports" },
]

export function TeacherShell({
  children,
  schoolName,
  userName,
}: {
  children: React.ReactNode
  schoolName: string
  userName: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await authClient.signOut()
      router.push("/login")
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link
            href="/teacher/dashboard"
            className="flex h-16 min-w-0 items-center gap-3 rounded-lg px-2 text-sidebar-foreground hover:bg-white/10"
          >
            <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <Image
                src="/logo.png"
                alt="RecordIT"
                width={48}
                height={48}
                className="size-full object-contain"
                priority
              />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]/sidebar:sr-only">
              <span className="block truncate text-lg font-bold">RecordIT</span>
              <span className="block truncate text-[11px] tracking-[0.14em] text-white/65 uppercase">
                Faculty Portal
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{schoolName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.href)}
                    >
                      <Link href={item.href}>
                        <MaterialSymbol icon={item.icon} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith("/teacher/attendance-sessions")}
              >
                <Link href="/teacher/attendance-sessions">
                  <MaterialSymbol icon="sensors" />
                  <span>Start Biometric Session</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={signOut}
                disabled={signingOut}
                className="text-red-200 hover:text-white"
              >
                <MaterialSymbol
                  icon={signingOut ? "progress_activity" : "logout"}
                  className={signingOut ? "animate-spin" : ""}
                />
                <span>{signingOut ? "Logging out..." : "Logout"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="mt-3 flex min-w-0 items-center gap-3 rounded-lg bg-white/10 p-3 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <MaterialSymbol icon="person" />
            </span>
            <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
              <p className="truncate font-semibold">{userName}</p>
              <p className="text-xs text-white/65">Teacher</p>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <div className="hidden min-w-0 rounded-full bg-surface-container px-4 py-2 text-on-surface-variant md:flex md:w-[420px] md:items-center md:gap-3">
                <MaterialSymbol icon="search" />
                <span className="truncate text-sm">
                  Search students or class records...
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <MaterialSymbol icon="fingerprint" />
              </span>
              <span className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <MaterialSymbol icon="notifications" />
              </span>
              <div className="ml-2 hidden border-l border-outline-variant pl-4 text-right sm:block">
                <p className="text-sm font-bold text-on-surface">{userName}</p>
                <p className="text-xs text-on-surface-variant">{schoolName}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-[calc(100svh-65px)] w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
