"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "./ui/badge"
import { toast } from "./ui/use-toast"

import { useHealthCheck } from "@/lib/hooks/use-health-check"
import { Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-provider"
import { useStatusDialog } from "@/lib/hooks/use-status-dialog"

const ScreenpipeStatus = ({ className }: { className?: string }) => {
  const { health } = useHealthCheck()
  const { isOpen, open, close } = useStatusDialog()
  const { settings } = useSettings()

  const getStatusColor = (
    status: string,
    frameStatus: string,
    audioStatus: string,
    uiStatus: string,
    audioDisabled: boolean | undefined,
    uiMonitoringEnabled: boolean | undefined
  ) => {
    if (status === "loading") return "bg-yellow-500"
    const isVisionOk = frameStatus === "ok" || frameStatus === "disabled"
    const isAudioOk =
      audioStatus === "ok" || audioStatus === "disabled" || audioDisabled
    const isUiOk =
      uiStatus === "ok" || uiStatus === "disabled" || !uiMonitoringEnabled
    return isVisionOk && isAudioOk && isUiOk ? "bg-green-500" : "bg-red-500"
  }

  const getStatusMessage = (
    status: string,
    frameStatus: string,
    audioStatus: string,
    uiStatus: string,
    audioDisabled: boolean | undefined,
    uiMonitoringEnabled: boolean | undefined
  ) => {
    if (status === "loading")
      return "Screenpipe is starting up. This may take a few minutes..."

    let issues = []
    if (frameStatus !== "ok" && frameStatus !== "disabled")
      issues.push("Screen Recording")
    if (!audioDisabled && audioStatus !== "ok" && audioStatus !== "disabled")
      issues.push("Audio Recording")
    if (uiMonitoringEnabled && uiStatus !== "ok" && uiStatus !== "disabled")
      issues.push("UI Monitoring")

    if (issues.length === 0) return "Screenpipe is running smoothly"
    return `There might be an issue with ${issues.join(" and ")}`
  }

  const formatTimestamp = (timestamp: string | null) => {
    return timestamp ? new Date(timestamp).toLocaleString() : "n/a"
  }

  const statusColor = getStatusColor(
    health?.status ?? "",
    health?.frame_status ?? "",
    health?.audio_status ?? "",
    health?.ui_status ?? "",
    settings?.screenpipeAppSettings?.disableAudio,
    settings?.screenpipeAppSettings?.enableUiMonitoring
  )
  const statusMessage = getStatusMessage(
    health?.status ?? "",
    health?.frame_status ?? "",
    health?.audio_status ?? "",
    health?.ui_status ?? "",
    settings?.screenpipeAppSettings?.disableAudio,
    settings?.screenpipeAppSettings?.enableUiMonitoring
  )

  const handleOpenStatusDialog = async () => {
    try {
      open()
    } catch (error) {
      console.error("Failed to open status dialog:", error)
      toast({
        title: "Error",
        description: "Failed to open status dialog. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <>
      <Badge
        variant="secondary"
        className={cn(
          "cursor-pointer hover:bg-accent hover:text-accent-foreground"
        )}
        onClick={handleOpenStatusDialog}
      >
        <Activity className="mr-1 h-4 w-4" />
        <span
          className={`ml-1 w-2 h-2 rounded-full ${statusColor} inline-block ${
            statusColor === "bg-red-500" ? "animate-pulse" : ""
          }`}
        />
      </Badge>
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] flex flex-col p-8 sm:rounded-2xl"
          aria-describedby="status-dialog-description"
        >
          <DialogHeader className="flex flex-row items-center justify-between font-sans">
            <DialogTitle>Screenpipe Status</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto">
            <p className="text-sm mb-4 font-medium">{statusMessage}</p>
            <div className="space-y-2 text-sm">
              {/* Screen Recording Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      health?.frame_status === "ok"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">Screen Recording</span>
                  <span className="text-sm text-muted-foreground">
                    Status: {health ? health.frame_status : "error"}, Last
                    update:{" "}
                    {formatTimestamp(health?.last_frame_timestamp ?? null)}
                  </span>
                </div>
              </div>

              {/* Audio Recording Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      settings?.screenpipeAppSettings?.disableAudio
                        ? "bg-gray-400"
                        : health?.audio_status === "ok"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm">Audio Recording</span>
                  <span className="text-sm text-muted-foreground">
                    Status:{" "}
                    {settings?.screenpipeAppSettings?.disableAudio
                      ? "Turned Off"
                      : health
                      ? health.audio_status
                      : "Error"}
                    , Last update:{" "}
                    {settings?.screenpipeAppSettings?.disableAudio
                      ? "N/A"
                      : formatTimestamp(health?.last_audio_timestamp ?? null)}
                  </span>
                </div>
              </div>

              {/* UI Monitoring Status */}
              {settings?.screenpipeAppSettings?.enableUiMonitoring && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        health?.ui_status === "ok"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm">UI Monitoring</span>
                    <span className="text-sm text-muted-foreground">
                      Status: {health?.ui_status}, Last update:{" "}
                      {formatTimestamp(
                        health ? health.last_ui_timestamp : "error"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ScreenpipeStatus
