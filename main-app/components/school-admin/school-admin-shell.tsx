"use client"

import Link from "next/link"
import Image from "next/image"
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
  { href: "/admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/academic-setup", icon: "school", label: "Academic Setup" },
  { href: "/admin/students", icon: "groups", label: "Students" },
  { href: "/admin/teachers", icon: "person", label: "Teachers" },
  { href: "/admin/parents", icon: "family_restroom", label: "Parents/Guardians" },
  { href: "/admin/classes", icon: "class", label: "Classes" },
  { href: "/admin/attendance", icon: "fingerprint", label: "Attendance" },
  { href: "/admin/reports", icon: "analytics", label: "Reports" },
]

const secondaryNav = [
  { href: "/admin/device-settings", icon: "phonelink_setup", label: "Device Settings" },
  { href: "/admin/notifications", icon: "notifications", label: "Notifications" },
  { href: "/admin/settings", icon: "settings", label: "Settings" },
]

export function SchoolAdminShell({
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
            href="/admin/dashboard"
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
                Admin Terminal
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{schoolName}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((item) => {
                  const active =
                    item.href === "/admin/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href.replace("/new", ""))

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link href={item.href}>
                          <MaterialSymbol icon={item.icon} />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          <SidebarMenu>
            {secondaryNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={pathname.startsWith(item.href)}>
                  <Link href={item.href}>
                    <MaterialSymbol icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/forgot-password"><MaterialSymbol icon="password" /><span>Reset Password</span></Link>
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
              <p className="text-xs text-white/65">School Administrator</p>
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
                <span className="truncate text-sm">Search records, students, or staff...</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <MaterialSymbol icon="fingerprint" />
              </span>
              <Link href="/admin/notifications" className="relative grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container" aria-label="View notifications">
                <MaterialSymbol icon="notifications" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
              </Link>
              <span className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container">
                <MaterialSymbol icon="help_outline" />
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
