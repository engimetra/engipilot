export const COLORS = {
  primary:   "#635BFF",
  success:   "#00C875",
  danger:    "#E2445C",
  warning:   "#FDAB3D",
  purple:    "#8b5cf6",
  teal:      "#14b8a6",
  bg:        "#F8F9FC",
  white:     "#FFFFFF",
  border:    "#E5E7EB",
  muted:     "#F3F4F6",
  mutedFg:   "#9CA3AF",
  fg:        "#1F2937",
  fgLight:   "#374151",
} as const

export const FONT = {
  regular:    "System",
  semibold:   "System",
  bold:       "System",
  black:      "System",
} as const

export const RADIUS = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
} as const

export const SHADOW = {
  card: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   "#000",
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  8,
    elevation:     4,
  },
} as const
