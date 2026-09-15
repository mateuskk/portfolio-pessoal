/**
 * The mark, in Yellowtail — the brush script supplied for it.
 *
 * Two kinds of geometry live here and they do different jobs.
 *
 * MB_GLYPH is the real letterform: a filled outline, taken from Yellowtail 400
 * set at a 200px em with the baseline at y = 0. It is what the reader sees, and
 * it is never itself animated.
 *
 * MB_PEN is the hand that writes it: centrelines following the order the
 * strokes are actually made — the M in one movement (up, down, up, down, and a
 * flick out), then B's stem, then its two bowls. These are never drawn. Each is
 * stroked fat and used as a mask, so sweeping one uncovers the glyph beneath it
 * along the direction of writing.
 *
 * The split is the whole trick. An outline cannot be drawn on, only filled in,
 * so animating the letterform's own path would trace its perimeter and read as
 * a shape being outlined rather than a word being written.
 *
 * `width` is per stroke, and was measured rather than chosen: each is the
 * smallest that still covers its part of the glyph (99.95% of the ink by the
 * end, the rest being edge antialiasing). The B's bowls are far heavier than
 * the M's diagonals and need a much fatter pen, while the M has to stay lean —
 * widen it and the mask spills across the narrow gap into the neighbouring
 * diagonal and reveals it before the pen gets there.
 *
 * `len` is each centreline's own measured length, used to hold one constant
 * pen speed across strokes of very different sizes.
 */
export const MB_VIEWBOX = "-22 -150 343 177";

export const MB_GLYPH =
  "M155.47-36.04L156.25-32.32Q156.25-29.98 153.81-26.76Q147.36-18.36 133.15-7.47Q118.95 3.42 112.21 3.42Q105.47 3.42 101.66-0.54Q97.85-4.49 97.85-9.57Q97.85-15.62 110.55-36.33Q129.59-67.09 159.18-108.20Q152.93-101.76 125.98-73.44Q66.31-10.94 56.25-2.64Q54.59-1.27 51.42-1.27Q48.24-1.27 44.73-3.86Q41.21-6.45 41.21-9.67L41.21-10.16Q41.60-14.26 60.06-50.29Q78.52-86.33 91.02-107.62Q72.56-87.30 53.71-62.30Q17.87-14.84 1.27 18.55Q-0.20 21.68-2.34 21.68Q-4.49 21.68-8.59 20.61Q-17.19 18.26-17.19 12.40Q-17.19 8.89-2.83-12.74Q11.52-34.37 30.47-60.01Q49.41-85.64 69.73-109.37Q97.75-142.19 105.76-142.19Q107.03-142.19 108.20-141.55Q109.38-140.92 109.67-140.92Q109.96-140.92 110.25-141.21Q111.52-142.77 115.28-142.77Q119.04-142.77 122.61-141.31Q126.17-139.84 126.17-137.99Q126.17-136.82 116.41-119.34Q83.69-61.33 72.46-39.65Q83.20-52.64 103.17-74.12Q123.14-95.61 145.12-116.99Q173.73-144.73 179.30-144.73Q181.54-144.73 184.96-143.75Q191.02-141.99 196.58-141.99Q198.14-141.70 199.27-140.67Q200.39-139.65 200.39-138.57Q200.39-137.50 199.80-136.82Q168.07-94.63 146.29-62.40Q124.51-30.18 119.43-18.85Q129.69-21 150-43.36Q150.88-44.53 151.27-44.92Q151.66-45.31 151.95-45.70Q153.61-47.66 154.49-43.26Q154.88-40.72 155.03-39.70Q155.18-38.67 155.32-37.55Q155.47-36.43 155.47-36.04M209.57-100L212.40-100.68Q212.99-100.68 212.99-99.56Q212.99-98.44 209.62-95.90Q206.25-93.36 201.51-93.36Q196.78-93.36 194.09-96.09Q191.41-98.83 191.41-103.22Q191.41-112.50 203.52-121.63Q215.63-130.76 233.30-136.28Q250.98-141.80 267.19-141.80Q290.92-141.80 302.49-134.08Q314.06-126.37 314.06-113.38Q314.06-96.78 291.02-81.25Q278.91-73.05 264.84-68.16Q280.27-66.50 289.45-58.20Q296.39-51.95 296.39-42.29Q296.39-32.62 287.16-22.61Q277.93-12.60 262.60-6.01Q247.27 0.59 231.25 0.59Q212.79 0.59 204.10-7.52Q200.20-11.23 200.20-14.11Q200.20-16.99 201.66-20.21Q194.53-7.32 191.21-0.78Q189.75 2.15 185.30 2.15Q180.86 2.15 178.42-0.20Q175.98-2.54 175.98-5.47Q175.98-8.40 176.86-10.64Q181.25-22.17 207.86-64.60Q234.47-107.03 240.43-113.77Q243.55-117.58 254.59-117.58Q258.98-117.58 258.98-115.62Q258.98-114.16 246-93.65Q233.01-73.14 232.42-72.17Q246-76.07 260.21-82.86Q274.41-89.65 285.01-98.24Q295.61-106.84 295.61-113.77Q295.61-125.20 270.80-125.20Q244.82-125.20 220.80-111.43Q214.84-108.01 211.72-105.18Q208.59-102.34 208.59-101.17Q208.59-100 209.57-100M227.15-53.32Q225.39-53.32 223.24-57.42Q213.96-42.58 203.81-24.41Q208.40-30.76 217.19-30.76Q223.05-30.76 223.05-29.30Q223.05-28.71 221.78-28.22Q217.87-26.76 217.87-23.83Q217.87-16.80 232.81-16.80Q253.03-16.80 269.43-30.86Q278.22-38.28 278.22-43.85Q278.22-47.27 271.09-51.37Q262.79-55.96 245.80-55.96Q233.98-55.96 230.66-54.64Q227.34-53.32 227.15-53.32";

export const MB_PEN = [
  {
    d: "M-14 12C20 -30 80 -100 122 -137C100 -100 68 -40 50 3C90 -55 160 -120 197 -140C170 -100 130 -35 112 12C130 -5 148 -18 157 -30",
    len: 802,
    width: 44,
  },
  {
    d: "M200 -140C195 -95 188 -45 183 2",
    len: 143,
    width: 64,
  },
  {
    d: "M200 -138C235 -148 285 -140 300 -118C308 -98 280 -84 240 -78C228 -76 218 -74 212 -72C255 -70 300 -58 302 -32C304 -10 255 0 222 -3C205 -6 198 -16 203 -27",
    len: 451,
    width: 78,
  },
];
