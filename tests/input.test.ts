import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { normalizeInput, PcbTraceLinter } from "lib/index"
import { makeSrj, wire } from "./fixtures/make-srj"

export const circuit: AnyCircuitElement[] = [
  {
    type: "pcb_board",
    pcb_board_id: "board",
    center: { x: 0, y: 0 },
    width: 10,
    height: 10,
    thickness: 1.6,
    num_layers: 2,
    material: "fr4",
  },
  {
    type: "pcb_trace",
    pcb_trace_id: "standalone",
    route: [wire(0, 0), wire(2, 1)],
  },
]
test("converts Circuit JSON using core and preserves standalone traces", () => {
  const original = structuredClone(circuit)
  const normalized = normalizeInput(circuit)
  expect(normalized.bounds).toEqual(makeSrj([]).bounds)
  expect(normalized.traces?.[0]?.pcb_trace_id).toBe("standalone")
  const solver = new PcbTraceLinter({ input: circuit })
  solver.solve()
  expect(solver.getOutput()).toHaveLength(1)
  expect(solver.getOutput()[0]?.start).toEqual({ x: 0, y: 0 })
  expect(circuit).toEqual(original)
})
test("Circuit JSON conversion retains via layer transitions", () => {
  const input: AnyCircuitElement[] = [
    circuit[0]!,
    {
      type: "pcb_trace",
      pcb_trace_id: "via-trace",
      route: [
        wire(0, 0),
        {
          route_type: "via",
          x: 2,
          y: 1,
          from_layer: "top",
          to_layer: "bottom",
        },
        wire(4, 2, "bottom"),
      ],
    },
  ]
  const solver = new PcbTraceLinter({ input })
  solver.solve()
  expect(solver.getOutput().map((i) => i.layer)).toEqual(["top", "bottom"])
})
test("rejects malformed upload shapes and nonfinite geometry", () => {
  for (const input of [
    null,
    {},
    "{}",
    [null],
    { ...makeSrj([]), traces: {} },
    { ...makeSrj([]), bounds: { minX: Infinity, maxX: 1, minY: 0, maxY: 1 } },
  ])
    expect(() => normalizeInput(input)).toThrow()
})

test("maps Circuit JSON through-pad transitions without inventing wire segments", () => {
  const input: AnyCircuitElement[] = [
    circuit[0]!,
    {
      type: "pcb_trace",
      pcb_trace_id: "through-pad",
      route: [
        wire(0, 0),
        {
          route_type: "through_pad",
          start: { x: 0, y: 0 },
          end: { x: 1, y: 2 },
          start_layer: "top",
          end_layer: "bottom",
          width: 0.2,
          pcb_plated_hole_id: "hole",
        },
        wire(1, 2, "bottom"),
        wire(3, 3, "bottom"),
      ],
    },
  ]
  const solver = new PcbTraceLinter({ input })
  solver.solve()
  expect(solver.getOutput().map((i) => i.segmentIndex)).toEqual([2])
})
