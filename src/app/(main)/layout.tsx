'use client'

import { usePathname } from 'next/navigation'
import { TopNav } from "@/components/top-nav"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLandingPage = pathname?.startsWith('/landing')

  return (
    <>
      {!isLandingPage && <TopNav />}
      {children}
    </>
  )
}

