"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BookOpen,
  User,
  Database,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { BarbedWireLine } from "@/components/barbed-wire"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Jobs", href: "/jobs", icon: Briefcase },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Prep Kit", href: "/ready-queue", icon: BookOpen },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Data Sources", href: "/logs", icon: Database },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-sidebar-border relative">
      {/* Barbed wire accent on right edge */}
      <BarbedWireLine variant="vertical" intensity="light" className="z-10" />
      
      <SidebarHeader className="px-4 py-5">
        <Link href="/" className="flex items-center justify-center">
          <Image
            src="/images/hirewire-logo.png"
            alt="HireWire"
            width={130}
            height={46}
            className="object-contain"
            style={{ width: 'auto', height: 'auto' }}
            priority
            loading="eager"
          />
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== "/" && pathname.startsWith(item.href))
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className={cn(
                        "h-10 px-3 rounded-lg transition-all relative",
                        isActive && "bg-primary/10 text-primary font-medium"
                      )}
                    >
                      <Link href={item.href}>
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r" />
                        )}
                        <item.icon className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="px-4 pb-4">
        <div className="text-[10px] text-muted-foreground text-center">
          HireWire v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
