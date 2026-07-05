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
import { cn } from "@/lib/utils"

const nav = [
  { href: "/parent/dashboard", icon: "dashboard", label: "Home" },
  { href: "/parent/children", icon: "family_restroom", label: "Children" },
  { href: "/parent/notifications", icon: "notifications", label: "Alerts" },
  { href: "/parent/profile", icon: "person", label: "Profile" },
]

const secondaryNav = [
  { href: "/parent/notification-preferences", icon: "tune", label: "Preferences" },
  { href: "/parent/contact-school", icon: "contact_mail", label: "Contact School" },
]

export function ParentShell({
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

  function isActive(href: string) {
    return href === "/parent/dashboard" ? pathname === href : pathname.startsWith(href)
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border">
          <Link
            href="/parent/dashboard"
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
              <span className="block truncate text-[11px] uppercase text-white/65">
                Parent Portal
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
                    <SidebarMenuButton asChild isActive={isActive(item.href)}>
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
            {secondaryNav.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={isActive(item.href)}>
                  <Link href={item.href}>
                    <MaterialSymbol icon={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
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
              <p className="text-xs text-white/65">Parent/Guardian</p>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 border-b border-outline-variant bg-surface/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase text-on-surface-variant">
                  RecordIT Parent
                </p>
                <p className="truncate text-base font-bold text-primary">{schoolName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/parent/contact-school"
                className="grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="Contact school"
              >
                <MaterialSymbol icon="call" />
              </Link>
              <Link
                href="/parent/notifications"
                className="relative grid size-10 place-items-center rounded-lg text-on-surface-variant hover:bg-surface-container"
                aria-label="View notifications"
              >
                <MaterialSymbol icon="notifications_active" />
                <span className="absolute top-2 right-2 size-2 rounded-full bg-destructive" />
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto min-h-[calc(100svh-65px)] w-full max-w-[1180px] px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-8">
          {children}
        </main>

        <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-outline-variant bg-surface/95 shadow-[0px_-4px_12px_rgb(0_35_102/0.05)] backdrop-blur lg:hidden">
          <div className="mx-auto flex h-20 max-w-[768px] items-center justify-around px-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-14 flex-col items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-on-surface-variant active:scale-95",
                  isActive(item.href) && "bg-secondary-container text-on-secondary-container"
                )}
              >
                <MaterialSymbol icon={item.icon} filled={isActive(item.href)} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </SidebarInset>
    </SidebarProvider>
  )
}
