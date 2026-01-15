import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string
  actions?: ReactNode
  children?: ReactNode
}

export function PageHeader({ title, actions, children }: PageHeaderProps) {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <Separator className="w-full" />
      {children}
    </div>
  )
}

