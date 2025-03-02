"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTime } from "@/lib/utils/time"

type AppTimeData = {
  appName: string
  time: number
  fill: string
}

type Props = {
  chartData: AppTimeData[]
}

export function TopThreeApps({ chartData }: Props) {
  // Sort the chartData to get the top three apps by time (descending order)
  const topThreeApps = React.useMemo(() => {
    return chartData.slice(0, 3) // Get the top three apps
  }, [chartData])

  return (
    <div className="grid gap-4 md:grid-cols-3 flex-grow">
      {topThreeApps.map((app, index) => (
        <Card key={app.appName}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-sans tracking-tighter font-semibold">
              #{index + 1} {app.appName}
            </CardTitle>
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: app.fill }}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">{formatTime(app.time)}</div>
            <p className="text-xs text-muted-foreground">Time Spent</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
