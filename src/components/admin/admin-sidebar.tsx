'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { UserProfile } from "@/types/db"
import NextImage from "next/image"

// Type definitions for menu items
interface MenuItem {
  title: string
  url?: string
  icon: React.ComponentType<{ className?: string }>
  items?: SubMenuItem[]
}

interface SubMenuItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

import {
  AudioWaveform,
  BookOpen,
  Bot,
  ChevronRight,
  ChevronsUpDown,
  Command,
  Frame,
  Home,
  LogOut,
  Mail,
  Map,
  PieChart,
  Settings,
  Settings2,
  SquareTerminal,
  Store,
  Tag,
  User,
  Users,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// Menu data structure
const data: { navMain: MenuItem[] } = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: Home,
    },
    {
      title: "Management",
      icon: Settings2,
      items: [
        {
          title: "Clients",
          url: "/admin/clients",
          icon: Users,
        },
        {
          title: "Vendors",
          url: "/admin/vendors",
          icon: Store,
        },
        {
          title: "Categories",
          url: "/admin/entities",
          icon: Tag,
        },
      ],
    },
    {
      title: "Settings",
      icon: Settings,
      items: [
        {
          title: "Email Templates",
          url: "/admin/email-templates",
          icon: Mail,
        },
      ],
    },
  ],
}

export function AdminSidebar({ ...props }: React.ComponentPropsWithoutRef<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const supabase = createClient()

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setProfile(data)
      }
    }
    
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return `${first}${last}` || 'A'
  }


  return (
    <Sidebar collapsible="icon" {...props} className="bg-primary border-r-0">
      <SidebarHeader className="bg-primary border-b-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-primary/90">
              <a href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10">
                  <NextImage 
                    src="/images/burpp_icon_white.svg" 
                    alt="Burpp" 
                    width={20} 
                    height={20}
                    className="size-5"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-white">Burpp Admin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="bg-primary">
        <SidebarGroup className="bg-primary">
          <SidebarGroupLabel className="text-white/70">Platform</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => {
              const isActive = item.url ? pathname === item.url : 
                             item.items?.some((subItem: SubMenuItem) => pathname === subItem.url)
              
              if (!item.items) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="!text-white font-semibold hover:!bg-white/10 data-[active=true]:!bg-white/20 data-[active=true]:!text-white">
                      <Link href={item.url!} className="!text-white">
                        <item.icon className="size-4 !text-white" />
                        <span className="!text-white">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} className="!text-white font-semibold hover:!bg-white/10">
                        {item.icon && <item.icon className="size-4 !text-white" />}
                        <span className="!text-white">{item.title}</span>
                        <ChevronRight className="ml-auto size-4 !text-white transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => {
                          const isSubActive = pathname === subItem.url
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive} className="!text-white/90 font-semibold hover:!bg-white/10 data-[active=true]:!bg-white/20 data-[active=true]:!text-white">
                                <Link href={subItem.url} className="!text-white">
                                  {subItem.icon && <subItem.icon className="size-3 !text-white" />}
                                  <span className="!text-white">{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="bg-primary border-t-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="text-white hover:bg-white/10 data-[state=open]:bg-white/20"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage 
                      src={user?.user_metadata?.avatar_url} 
                      alt={profile?.first_name || 'Admin'} 
                    />
                    <AvatarFallback className="rounded-lg bg-white/20 text-white">
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-white">
                      {profile?.first_name} {profile?.last_name}
                    </span>
                    <span className="truncate text-xs text-white font-semibold">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-white" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-[240px] rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage 
                        src={user?.user_metadata?.avatar_url} 
                        alt={profile?.first_name || 'Admin'} 
                      />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(profile?.first_name, profile?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {profile?.first_name} {profile?.last_name}
                      </span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}