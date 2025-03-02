"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { formatTime } from "@/lib/utils/time"

type DailyScreenTime = {
  date: string // Date in YYYY-MM-DD format
  totalTime: number // Total screen time in milliseconds
  appDistribution: Record<string, { time: number; fill: string }> // Time spent per app in milliseconds with color
}

type Props = {
  dailyScreenTimeData: DailyScreenTime[]
}

export function ScreenTimeBarChart({ dailyScreenTimeData }: Props) {
  // Transform data for the chart
  const chartData = dailyScreenTimeData.map((day) => {
    const appData: Record<string, number> = {}
    Object.entries(day.appDistribution).forEach(([app, { time }]) => {
      appData[app] = time
    })

    return {
      date: new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      ...appData,
    }
  })

  // Create dynamic chart configuration
  const chartConfig = dailyScreenTimeData.reduce((acc, day) => {
    Object.entries(day.appDistribution).forEach(([app, { fill }]) => {
      if (!acc[app]) {
        acc[app] = {
          label: app,
          color: fill,
        }
      }
    })
    return acc
  }, {} as ChartConfig)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-sans tracking-tighter">
          Daily Screen Time
        </CardTitle>
        <CardDescription>
          Time spent on apps per day (in hours & minutes).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            layout="vertical" // Makes the bars horizontal
            accessibilityLayer
            data={chartData}
          >
            <YAxis
              type="category"
              dataKey="date"
              tickLine={false}
              tickMargin={4}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
            />
            <XAxis
              type="number"
              tickFormatter={(value) => {
                const hours = Math.floor(value / (1000 * 60 * 60))
                const minutes = Math.floor(
                  (value % (1000 * 60 * 60)) / (1000 * 60)
                )
                return `${hours}h ${minutes}m`
              }}
            />
            {Object.keys(chartConfig).map((app) => (
              <Bar
                key={app}
                dataKey={app}
                stackId="a"
                fill={chartConfig[app].color}
                // barSize={50}
              />
            ))}
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  className=""
                  formatter={(value, name, item) => {
                    // Calculate the total time for this day
                    const total = Object.keys(item.payload)
                      .filter((key) => key !== "date")
                      .reduce((acc, key) => acc + (item.payload[key] || 0), 0)

                    return (
                      <>
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[--color-bg]"
                          style={
                            {
                              "--color-bg": chartConfig[name]?.color,
                            } as React.CSSProperties
                          }
                        />
                        {chartConfig[name]?.label || name}
                        <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                          {formatTime(value as number)}
                        </div>

                        {/* Ensure "Total Time" only appears once per tooltip */}
                        {/* {Object.keys(item.payload).slice(-1)[0] === name && (
                          <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium text-foreground">
                            Total Time
                            <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                              {formatTime(total)}
                            </div>
                          </div>
                        )} */}
                      </>
                    )
                  }}
                />
              }
              cursor={false}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
