function calculateAxelBounds(bounds, segments, overlap) {
  const boundStart = bounds[0] + overlap
  const boundEnd = bounds[1] - overlap
  const segmentWidth = (boundEnd - boundStart) / segments
  return [...Array(segments)].map((_, i) => [
    segmentWidth * i + boundStart - overlap,
    segmentWidth * (i + 1) + boundStart + overlap,
  ])
}

const xSegments = calculateAxelBounds([50000, 780000], 3, 50000)
console.log('∞∞: xSegments', xSegments)
const ySegments = calculateAxelBounds([6450000,7700000], 4, 50000)
console.log('∞∞: ySegments', ySegments)

const allSegments = ySegments.flatMap(y => xSegments.map(x => `${x[0]}, ${y[0]}, ${x[1]}, ${y[1]}`))
console.log('∞∞: allSegments', allSegments)

const xSegmentsWithoutOverlap = calculateAxelBounds([50000, 780000], 3, 0)
const ySegmentsWithoutOverlap = calculateAxelBounds([6450000,7700000], 4, 0)
const allSegmentsWithoutOverlap = ySegmentsWithoutOverlap.flatMap(y => xSegmentsWithoutOverlap.map(x => `${x[0]}, ${y[0]}, ${x[1]}, ${y[1]}`))
console.log('∞∞: allSegmentsWithoutOverlap', allSegmentsWithoutOverlap)


// Y
// const bounds = [6450000,7700000]
// const segments = 4
// const overlap = 100000

// X
// const bounds = [50000, 800000]
// const segments = 3
// const overlap = 100000

// const getX = (i) => {
//   const segmentWidth = (bounds[1] - bounds[0]) / segments
//   return [
//     segmentWidth * i + bounds[0] - (i === 0 ? 0 : overlap),
//     segmentWidth * (i + 1) + bounds[0] + (i === segments - 1 ? 0 : overlap),
//   ]
// }
// console.log(getX(0))
// console.log(getX(1))
// console.log(getX(2))
// console.log(getX(3))

// zoomed out:
// x1:  50 000
// x2: 780 000
// y1: 6 450 000
// y2: 7 362 500



module.exports = {
  WFS_FEATURE_URL: `https://opendata.fmi.fi/wfs`,
  WMS_HOST: 'openwms.fmi.fi',
  // EPSG_3067_BOUNDS: '20000, 6450000, 770000, 7000000',
  EPSG_3067_BOUNDS: [
    '50000, 6450000, 360000, 6837500',
    '260000, 6450000, 570000, 6837500',
    '470000, 6450000, 780000, 6837500',
    '50000, 6737500, 360000, 7125000',
    '260000, 6737500, 570000, 7125000',
    '470000, 6737500, 780000, 7125000',
    '50000, 7025000, 360000, 7412500',
    '260000, 7025000, 570000, 7412500',
    '470000, 7025000, 780000, 7412500',
    '50000, 7312500, 360000, 7700000',
    '260000, 7312500, 570000, 7700000',
    '470000, 7312500, 780000, 7700000',
    '50000, 6450000, 780000, 7362500' //zoomedOut
  ],
  EPSG_3067_SRS: 'EPSG:3067',
  WIDTH: 600,
  HEIGHT: 750,
}

// P 7 700 000
// E 6 450 000
// L    50 000
// I   800 000

// WIDTH oldd
// 3 segments: segmentwidth = 750 000 / 3 = 250 000 (+ overlap)

// HEIGHT oldd
// 3 segments: segmentHeight = 1 250 000 / 3 = 416 667 (+ overlap)
// 4 segments: segmentHeight = 1 250 000 / 4 = 312 500 (+ overlap)
// 5 segments: segmentHeight = 1 250 000 / 5 = 250 000 (+ overlap)

// X old
// [  50000, 350000 ]
// [ 250000, 600000 ]
// [ 500000, 800000 ]

// Y old
  // [ 6450000, 6812500 ],
  // [ 6712500, 7125000 ],
  // [ 7025000, 7437500 ],
  // [ 7337500, 7700000 ]

// [ 9, 10, 11]
// [ 6,  7,  8]
// [ 3,  4,  5]
// [ 0,  1,  2]

  // '50000, 6450000, 350000, 6812500',
  // '250000, 6450000, 600000, 6812500',
  // '500000, 6450000, 800000, 6812500',
  // '50000, 6712500, 350000, 7125000',
  // '250000, 6712500, 600000, 7125000',
  // '500000, 6712500, 800000, 7125000',
  // '50000, 7025000, 350000, 7437500',
  // '250000, 7025000, 600000, 7437500',
  // '500000, 7025000, 800000, 7437500',
  // '50000, 7337500, 350000, 7700000',
  // '250000, 7337500, 600000, 7700000',
  // '500000, 7337500, 800000, 7700000'


// segments withoutBounds
  // [
  //   { x1: 50000,  x2: 293333, y1: 6450000, y2: 6762500 },
  //   { x1: 293333, x2: 536667, y1: 6450000, y2: 6762500 },
  //   { x1: 536667, x2: 780000, y1: 6450000, y2: 6762500 },
  //   { x1: 50000,  x2: 293333, y1: 6762500, y2: 7075000 },
  //   { x1: 293333, x2: 536667, y1: 6762500, y2: 7075000 },
  //   { x1: 536667, x2: 780000, y1: 6762500, y2: 7075000 },
  //   { x1: 50000,  x2: 293333, y1: 7075000, y2: 7387500 },
  //   { x1: 293333, x2: 536667, y1: 7075000, y2: 7387500 },
  //   { x1: 536667, x2: 780000, y1: 7075000, y2: 7387500 },
  //   { x1: 50000,  x2: 293333, y1: 7387500, y2: 7700000 },
  //   { x1: 293333, x2: 536667, y1: 7387500, y2: 7700000 },
  //   { x1: 536667, x2: 780000, y1: 7387500, y2: 7700000 }
  // ]
