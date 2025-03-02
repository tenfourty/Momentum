"use client"

import React, { useEffect } from "react"
import {
  interpolateInferno,
  interpolatePiYG,
  interpolateRainbow,
} from "d3-scale-chromatic"
import { pipe } from "@screenpipe/browser"
import { Button } from "./ui/button"
import { DateTimePicker } from "./datetime-picker"
import { toast } from "sonner"
import { AppTimePieChart } from "./app-time-pie-chart"
import { interpolateColors } from "@/lib/utils/color-generator"
import { RefreshCwIcon } from "lucide-react"
import { TopThreeApps } from "./top-three-apps"
import { ScreenTimeBarChart } from "./screen-time-bar-chart"
import Summary from "./summary"

type Props = {}

const Dashboard = (props: Props) => {
  const [appTimeData, setAppTimeData] = React.useState<any[]>([])
  const [dailyScreenTimeData, setDailyScreenTimeData] = React.useState<any[]>(
    []
  )
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pageSize, setPageSize] = React.useState(9)
  const [pageIndex, setPageIndex] = React.useState(0)
  const [totalRows, setTotalRows] = React.useState(0)
  const [appFilter, setAppFilter] = React.useState("")

  const getCurrentDayRange = () => {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0) // Set to 00:00:00.000
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999) // Set to 23:59:59.999
    return { startOfDay, endOfDay }
  }

  const [startDate, setStartDate] = React.useState<Date>(
    getCurrentDayRange().startOfDay
  )
  const [endDate, setEndDate] = React.useState<Date>(
    getCurrentDayRange().endOfDay
  )
  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filterClauses = [
        appFilter
          ? `LOWER(app_name) LIKE '%${appFilter
              .toLowerCase()
              .replace(/'/g, "''")}%'`
          : null,
        startDate ? `timestamp >= '${startDate.toISOString()}'` : null,
        endDate ? `timestamp <= '${endDate.toISOString()}'` : null,
      ]
        .filter(Boolean)
        .join(" AND ")

      const countResponse = await fetch("http://localhost:3030/raw_sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            SELECT COUNT(*) as total
            FROM frames
            WHERE ${filterClauses}
          `,
        }),
      })

      if (!countResponse.ok) {
        throw new Error("failed to fetch count")
      }

      const countResult = await countResponse.json()
      console.log("@countResult", countResult)
      setTotalRows(countResult[0].total)

      const response = await fetch("http://localhost:3030/raw_sql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            SELECT 
              id,
              timestamp,
              browser_url,
              app_name,
              window_name,
              focused
            FROM frames
            WHERE ${filterClauses}
          `,
        }),
      })
      if (!response.ok) {
        throw new Error("failed to fetch data")
      }
      const result: Array<any> = await response.json()

      console.log(
        "@result",
        result.slice(result.length - 11, result.length - 1)
      )

      const appColorMapping = generateAppColorMapping(result)

      const genAppTimeData = generateAppTimeData(result, appColorMapping)

      const genScreenTimeData = generateDailyScreenTimeData(
        result,
        appColorMapping
      )

      console.log("@appTimeData", genAppTimeData)

      console.log("@dailyScreenTimeData", genScreenTimeData)

      setAppTimeData(genAppTimeData)

      setDailyScreenTimeData(genScreenTimeData)
    } catch (error) {
      console.error("error fetching data:", error)
      setError(
        `failed to load ocr data: ${
          error instanceof Error ? error.message : "unknown error"
        }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [startDate, endDate])

  // Function to generate a color mapping for all unique apps
  const generateAppColorMapping = (
    data: Array<any>
  ): Record<string, string> => {
    const uniqueApps = [...new Set(data.map((entry) => entry.app_name))] // Get unique app names
    const COLORS = interpolateColors(uniqueApps.length, interpolateRainbow, {
      colorStart: 0,
      colorEnd: 1,
      useEndAsStart: false,
    })

    // Create a mapping of app names to colors
    const appColorMapping: Record<string, string> = {}
    uniqueApps.forEach((app, index) => {
      appColorMapping[app] = COLORS[index]
    })

    return appColorMapping
  }

  const generateAppTimeData = (
    data: Array<any>,
    appColorMapping: Record<string, string>
  ) => {
    if (!data.length) return []

    const timeSpent: Record<string, number> = {}

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i]
      const next = data[i + 1]

      if (current.app_name === next.app_name) {
        const timeDiff =
          new Date(next.timestamp).getTime() -
          new Date(current.timestamp).getTime()

        timeSpent[current.app_name] =
          (timeSpent[current.app_name] || 0) + timeDiff
      }
    }

    return Object.keys(timeSpent)
      .map((app) => ({
        appName: app,
        time: timeSpent[app],
        fill: appColorMapping[app], // Use the global color mapping
      }))
      .sort((a, b) => b.time - a.time)
  }

  type DailyScreenTime = {
    date: string // Date in YYYY-MM-DD format
    totalTime: number // Total screen time in milliseconds
    appDistribution: Record<string, { time: number; fill: string }> // Time spent per app in milliseconds with color
  }

  const generateDailyScreenTimeData = (
    data: Array<{ app_name: string; timestamp: string }>,
    appColorMapping: Record<string, string>
  ): DailyScreenTime[] => {
    if (!data.length) return []

    const dailyUsage: Record<string, DailyScreenTime> = {}

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i]
      const next = data[i + 1]

      // Skip if the current or next entry has an invalid timestamp
      if (!current.timestamp || !next.timestamp) continue

      // Calculate the time difference in milliseconds
      const timeDiff =
        new Date(next.timestamp).getTime() -
        new Date(current.timestamp).getTime()

      // Skip if the time difference is negative (invalid data)
      if (timeDiff < 0) continue

      // Extract the date in YYYY-MM-DD format
      const date = current.timestamp.split("T")[0]

      // Initialize the dailyUsage entry if it doesn't exist
      if (!dailyUsage[date]) {
        dailyUsage[date] = {
          date,
          totalTime: 0,
          appDistribution: {}, // Initialize as an empty object
        }
      }

      // Add the time difference to the total time for the day
      dailyUsage[date].totalTime += timeDiff

      // Add the time difference to the app's time for the day
      if (!dailyUsage[date].appDistribution[current.app_name]) {
        dailyUsage[date].appDistribution[current.app_name] = {
          time: 0,
          fill: appColorMapping[current.app_name], // Use the global color mapping
        }
      }
      dailyUsage[date].appDistribution[current.app_name].time += timeDiff
    }

    // Convert dailyUsage object into an array and sort appDistribution
    return Object.values(dailyUsage).map((day) => {
      // Convert appDistribution to an array, sort it, and then convert it back to an object
      const sortedAppDistribution = Object.fromEntries(
        Object.entries(day.appDistribution).sort(
          ([kA, a], [kB, b]) => b.time - a.time
        )
      )

      return { ...day, appDistribution: sortedAppDistribution }
    })
  }

  const handleStartDateChange = (newDate: Date) => {
    if (endDate && newDate > endDate) {
      toast.error("Start date cannot be after the end date")

      // alert("Start date cannot be after the end date")
      return
    }
    setStartDate(newDate)
  }

  const handleEndDateChange = (newDate: Date) => {
    if (startDate && newDate < startDate) {
      toast.error("End date cannot be before the start date")
      // alert("End date cannot be before the start date")
      return
    }
    setEndDate(newDate)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 items-center">
        <span>From</span>
        <DateTimePicker date={startDate} setDate={handleStartDateChange} />
        <span>To</span>
        <DateTimePicker date={endDate} setDate={handleEndDateChange} />
        <Button onClick={fetchData} variant={"secondary"}>
          <RefreshCwIcon />
        </Button>
      </div>

      {/* <div>
        <p>Start Date - {startDate?.toISOString()}</p>
        <p>End Date - {endDate?.toISOString()}</p>
      </div> */}

      <div className="flex gap-4 w-full">
        {appTimeData && (
          <>
            <TopThreeApps chartData={appTimeData} />
            <AppTimePieChart chartData={appTimeData} />
          </>
        )}
      </div>

      <div>
        {dailyScreenTimeData && (
          <ScreenTimeBarChart dailyScreenTimeData={dailyScreenTimeData} />
        )}
      </div>

      <div>
        {appTimeData && dailyScreenTimeData && (
          <Summary
            appTimeData={appTimeData}
            dailyScreenTimeData={dailyScreenTimeData}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard
