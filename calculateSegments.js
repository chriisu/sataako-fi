function calculateAxelBounds(bounds, segments, overlap) {
  const boundStart = bounds[0] + overlap
  const boundEnd = bounds[1] - overlap
  const segmentWidth = (boundEnd - boundStart) / segments
  return [...Array(segments)].map((_, i) => [
    segmentWidth * i + boundStart - overlap,
    segmentWidth * (i + 1) + boundStart + overlap,
  ])
}

const bounds = [
  [50000, 770000],
  [6450000, 7700000],
]
const xSegments = calculateAxelBounds(bounds[0], 3, 75000)
console.log('∞∞: xSegments', xSegments)
const ySegments = calculateAxelBounds(bounds[1], 4, 75000)
console.log('∞∞: ySegments', ySegments)

const allSegments = ySegments.flatMap((y) =>
  xSegments.map((x) => `${x[0]}, ${y[0]}, ${x[1]}, ${y[1]}`)
)

const xSegmentsWithoutOverlap = calculateAxelBounds(bounds[0], 3, 0)
console.log('∞∞: xSegmentsWithoutOverlap', xSegmentsWithoutOverlap)
const ySegmentsWithoutOverlap = calculateAxelBounds(bounds[1], 4, 0)
console.log('∞∞: ySegmentsWithoutOverlap', ySegmentsWithoutOverlap)
const allSegmentsWithoutOverlap = ySegmentsWithoutOverlap.flatMap((y) =>
  xSegmentsWithoutOverlap.map((x) => ({
    x1: x[0],
    x2: x[1],
    y1: y[0],
    y2: y[1],
  }))
)
console.log(
  (xSegments[0][1] - xSegments[0][0]) / (ySegments[0][1] - ySegments[0][0])
)
