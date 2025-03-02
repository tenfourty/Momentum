type ColorRangeInfoType = {
  colorStart: number
  colorEnd: number
  useEndAsStart: boolean
}

const rgbStringToHex = (rgbString: string) => {
  // Extract the numbers from the RGB string using a regular expression
  const matches = rgbString.match(/\d+/g)

  // Check if the input is valid
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid RGB string")
  }

  // Convert the extracted strings to numbers
  const [r, g, b] = matches.map(Number)

  // Convert each component to a two-digit hexadecimal string
  const toHex = (value: number): string => {
    const hex = value.toString(16)
    return hex.length === 1 ? `0${hex}` : hex // Pad with leading zero if necessary
  }

  // Combine the components into a hex color string
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function calculatePoint(
  i: number,
  intervalSize: number,
  colorRangeInfo: ColorRangeInfoType
) {
  let { colorStart, colorEnd, useEndAsStart } = colorRangeInfo
  return useEndAsStart
    ? colorEnd - i * intervalSize
    : colorStart + i * intervalSize
}

/* Must use an interpolated color scale, which has a range of [0, 1] */
export function interpolateColors(
  dataLength: number,
  colorScale: any,
  colorRangeInfo: ColorRangeInfoType
) {
  let { colorStart, colorEnd } = colorRangeInfo
  let colorRange = colorEnd - colorStart
  let intervalSize = colorRange / dataLength
  let colorPoint
  let colorArray = []

  for (let i = 0; i < dataLength; i++) {
    colorPoint = calculatePoint(i, intervalSize, colorRangeInfo)
    colorArray.push(rgbStringToHex(colorScale(colorPoint)))
  }

  return colorArray
}
