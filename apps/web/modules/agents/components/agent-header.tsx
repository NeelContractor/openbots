"use client"

import { Button } from "@openbots/ui/components/button"
import { ButtonGroup } from "@openbots/ui/components/button-group"
import { SidebarTrigger } from "@openbots/ui/components/sidebar"
import { useIsMobile } from "@openbots/ui/hooks/use-mobile"
import * as React from "react"
import { Calendar2Newicons, History2 } from "reicon-react"
import { cn } from "@/lib/utils"
import type { Agent } from "../types"
import { AgentHeaderMenu } from "./agent-header-menu"

interface AgentHeaderProps {
  selectedAgent: Agent | null
  onOpenConfigure: () => void
  onOpenHistory: () => void
  onOpenConnections?: () => void
  onOpenSchedules?: () => void
  onOpenMemory?: () => void
  onAgentRenamed?: (updatedAgent: Agent) => void
  onAgentDeleted?: (deletedId: string) => void
  className?: string
}

export function AgentHeader({
  selectedAgent,
  onOpenConfigure,
  onOpenHistory,
  onOpenConnections,
  onOpenSchedules,
  onOpenMemory,
  onAgentRenamed,
  onAgentDeleted,
  className,
}: AgentHeaderProps) {
  const isMobile = useIsMobile()

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex w-full shrink-0 items-center justify-between bg-transparent px-3 pt-2 pb-0",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        {isMobile && (
          <SidebarTrigger className="flex cursor-pointer items-center gap-1.5 rounded-full border-0! bg-secondary text-xs font-medium text-foreground backdrop-blur-sm transition-colors" />
        )}
        {selectedAgent && (
          <AgentHeaderMenu
            selectedAgent={selectedAgent}
            onOpenConfigure={onOpenConfigure}
            onOpenConnections={onOpenConnections}
            onOpenMemory={onOpenMemory}
            onAgentRenamed={onAgentRenamed}
            onAgentDeleted={onAgentDeleted}
          />
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {selectedAgent && (
          <ButtonGroup className="rounded-full">
            {onOpenSchedules && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenSchedules}
                className="cursor-pointer gap-1.5 bg-secondary text-xs font-medium text-foreground backdrop-blur-sm"
                title="Scheduled Autonomous Tasks"
              >
                <Calendar2Newicons className="size-4" />
                <span>Schedules</span>
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenHistory}
              className="cursor-pointer gap-1.5 bg-secondary text-xs font-medium text-foreground backdrop-blur-sm"
              title="Execution History"
            >
              <History2 className="size-4" />
            </Button>
          </ButtonGroup>
        )}
      </div>
    </header>
  )
}
