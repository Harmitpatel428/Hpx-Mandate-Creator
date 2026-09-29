import * as React from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col overflow-hidden">{children}</div>
    </TooltipProvider>
  )
}
