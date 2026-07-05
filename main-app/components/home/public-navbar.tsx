"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { MaterialSymbol } from "@/components/common/MaterialSymbol"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSession } from "@/lib/auth-client"
import { getDashboardHref, getDashboardLabel } from "@/lib/role-dashboard"
import { cn } from "@/lib/utils"
import { publicNavItems } from "./constants"

type SessionUser = NonNullable<
  ReturnType<typeof useSession>["data"]
>["user"] & {
  role?: string | null
  status?: string | null
}

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.split("@")[0] || "User"
  const initials = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return initials || "U"
}

export function PublicNavbar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user as SessionUser | undefined
  const dashboardHref = getDashboardHref(user?.role)
  const dashboardLabel = getDashboardLabel(user?.role)

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-[#c5c6d2] bg-[#f7f9ff] shadow-sm">
      <nav className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="text-2xl font-bold tracking-normal text-[#00113a]"
          >
            RecordIT
          </Link>
          <div className="hidden gap-6 md:flex">
            {publicNavItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href.split("#")[0]

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "text-base transition-colors hover:text-[#2552ca]",
                    isActive
                      ? "border-b-2 border-[#2552ca] font-semibold text-[#2552ca]"
                      : "text-[#444650]"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden h-9 items-center gap-2 rounded-full bg-[#e2efff] px-4 md:flex">
            <MaterialSymbol
              icon="search"
              className="text-base text-[#757682]"
            />
            <input
              aria-label="Search resources"
              className="w-48 border-none bg-transparent font-mono text-xs text-[#0d1d2a] outline-none placeholder:text-[#757682]"
              placeholder="Search resources..."
            />
          </div>

          {user ? (
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden min-w-0 text-right sm:block">
                <div className="max-w-36 truncate text-sm font-semibold text-[#00113a]">
                  {user.name || "Signed in"}
                </div>
                <div className="max-w-36 truncate text-xs text-[#444650]">
                  {user.email}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open user menu"
                    className="rounded-full transition-transform outline-none focus-visible:ring-2 focus-visible:ring-[#2552ca]/40 active:scale-95"
                  >
                    <Avatar className="size-9 border border-[#c5c6d2] bg-[#e2efff]">
                      <AvatarImage
                        src={user.image ?? undefined}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-[#00113a] text-xs text-white">
                        {getInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="border-[#c5c6d2]">
                  <DropdownMenuLabel>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#00113a]">
                        {user.name || "Signed in"}
                      </div>
                      <div className="truncate text-xs font-normal text-[#444650]">
                        {user.email}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={dashboardHref}>
                      <MaterialSymbol icon="dashboard" className="text-base" />
                      {dashboardLabel}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/">
                      <MaterialSymbol icon="home" className="text-base" />
                      Home
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              asChild
              className="h-10 rounded-xl bg-[#2552ca] px-5 text-sm font-semibold text-white hover:bg-[#003baf]"
            >
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
