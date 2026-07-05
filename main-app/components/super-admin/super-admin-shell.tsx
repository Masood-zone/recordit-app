"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

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

const navItems = [
  { href: "/super-admin/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/super-admin/schools", icon: "school", label: "Schools" },
]

export function SuperAdminShell({
  children,
  userName,
}: {
  children: React.ReactNode
  userName: string
}) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link
            href="/super-admin/dashboard"
            className="flex h-14 min-w-0 items-center gap-3 rounded-lg px-2 text-sidebar-foreground hover:bg-white/10"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <MaterialSymbol icon="fingerprint" />
            </span>
            <span className="min-w-0 group-data-[collapsible=icon]/sidebar:sr-only">
              <span className="block truncate text-lg font-bold">RecordIT</span>
              <span className="block truncate text-xs text-white/65">
                Super Admin
              </span>
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const active =
                    item.href === "/super-admin/dashboard"
                      ? pathname === item.href
                      : pathname.startsWith(item.href)

                  return (
                    <SidebarMenuItem key={item.label}>
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
          <SidebarGroupLabel>User</SidebarGroupLabel>
          <div className="flex min-w-0 items-center gap-3 rounded-lg bg-white/10 p-3 group-data-[collapsible=icon]/sidebar:justify-center group-data-[collapsible=icon]/sidebar:p-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
              <MaterialSymbol icon="person" />
            </span>
            <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
              <p className="truncate font-semibold">{userName}</p>
              <p className="text-xs text-white/65">Platform control</p>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-20 border-b border-outline-variant bg-surface-container-lowest/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-on-surface-variant">
                  RecordIT Operations
                </p>
                <p className="truncate text-lg font-bold text-primary">
                  Super Admin
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/super-admin/schools"
                className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Search schools"
              >
                <MaterialSymbol icon="search" />
              </Link>
              <span className="grid size-10 place-items-center rounded-lg text-on-surface-variant">
                <MaterialSymbol icon="notifications" />
              </span>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
