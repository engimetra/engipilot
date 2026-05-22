import { describe, it, expect } from "vitest"
import { formatMAD, getSPIStyle } from "@/lib/utils"

describe("formatMAD", () => {
  it("formate un grand montant en MAD", () => {
    const r = formatMAD(48_500_000)
    expect(r).toContain("48")
    expect(r).toContain("MAD")
  })

  it("format compact avec M", () => {
    const r = formatMAD(48_500_000, true)
    expect(r).toContain("48,5")
  })

  it("formate zéro correctement", () => {
    const r = formatMAD(0)
    expect(r).toContain("0")
  })
})

describe("getSPIStyle", () => {
  it.each([
    [1.1, "En avance",        "text-success"],
    [1.0, "Dans les délais",  "text-primary"],
    [0.85, "Retard modéré",    "text-warning"],
    [0.65, "Retard critique",  "text-danger"],
  ])("SPI=%f → label='%s', class='%s'", (spi, label, color) => {
    const s = getSPIStyle(spi)
    expect(s.label).toBe(label)
    expect(s.colorClass).toBe(color)
  })
})
