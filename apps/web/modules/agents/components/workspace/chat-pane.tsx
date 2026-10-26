"use client"

import * as React from "react"
import type { ParsedArtifact } from "@/modules/artifacts/parser"
import type { ReplyTarget } from "@/modules/conversations/types"
import { useWorkspaceChat } from "./use-workspace-chat"
import { WorkspaceChatPanel } from "./workspace-chat-panel"

interface ChatPaneProps {
  agentId: string
  agentName: string
  onOpenArtifact: (artifact: ParsedArtifact) => void
  headerProps?: {
    selectedAgent: any
    onOpenConfigure: () => void
    onOpenHistory: () => void
    onOpenConnections?: () => void
    onOpenSchedules?: () => void
    onOpenMemory?: () => void
  }
}

export const ChatPane = React.memo(function ChatPane({
  agentId,
  agentName,
  onOpenArtifact,
  headerProps,
}: ChatPaneProps) {
  const [replyTarget, setReplyTarget] = React.useState<ReplyTarget | null>(null)

  const {
    execution,
    messages,
    isLoadingOlder,
    hasOlderMessages,
    fetchNextPage,
    handleToggleReaction,
    isChatLoading,
  } = useWorkspaceChat({ agentId })

  const placeholder = `Message ${agentName}...`

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <WorkspaceChatPanel
        headerProps={headerProps}
        messages={messages}
        activeRun={execution.activeRun}
        activeRunSteps={execution.activeRunSteps}
        cancelActiveRun={execution.cancelActiveRun}
        isCancelling={execution.isCancelling}
        agentName={agentName}
        isOptimisticRunning={execution.isOptimisticRunning}
        isChatLoading={isChatLoading}
        onOpenArtifact={onOpenArtifact}
        hasOlderMessages={!!hasOlderMessages}
        isLoadingOlder={isLoadingOlder}
        fetchNextPage={fetchNextPage}
        executionError={execution.executionError}
        clearExecutionError={execution.clearExecutionError}
        replyTarget={replyTarget}
        setReplyTarget={setReplyTarget}
        handleToggleReaction={handleToggleReaction}
        streamingText={execution.streamingText}
        sendPrompt={execution.sendPrompt}
        isSubmitting={execution.isSubmitting}
        isActiveRun={execution.isActiveRun}
        placeholder={placeholder}
      />
    </div>
  )
})
