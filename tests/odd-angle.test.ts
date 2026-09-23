import { expect, test } from "bun:test"
import { OddAngleFinder, PcbTraceLinter } from "lib/index"
import { makeSrj, wire } from "./fixtures/make-srj"

test("all eight 45-degree directions, duplicate points, and reversed routes are allowed", () => {
  for (let angle = 0; angle < 360; angle += 45) {
    const a = (angle * Math.PI) / 180
    const solver = new PcbTraceLinter({
      input: makeSrj([
        wire(0, 0),
        wire(0, 0),
        wire(Math.cos(a), Math.sin(a)),
        wire(0, 0),
      ]),
    })
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.getOutput()).toEqual([])
  }
})
test("reports each bad segment with exact original indices and coordinates", () => {
  const input = makeSrj([wire(0, 0), wire(2, 1), wire(2, 3), wire(0, 2)])
  const original = structuredClone(input)
  const solver = new PcbTraceLinter({ input })
  solver.step()
  expect(solver.oddAngleFinder).toBeInstanceOf(OddAngleFinder)
  solver.step()
  expect(solver.getOutput()).toHaveLength(1)
  solver.solve()
  expect(solver.getOutput().map((i) => i.segmentIndex)).toEqual([0, 2])
  expect(solver.getOutput()[0]).toMatchObject({
    type: "odd_angle",
    pcb_trace_id: "t1",
    traceIndex: 0,
    endRouteIndex: 1,
    layer: "top",
    start: { x: 0, y: 0 },
    end: { x: 2, y: 1 },
    location: { x: 1, y: 0.5 },
  })
  expect(solver.getOutput()[0]!.angleDegrees).toBeCloseTo(26.565051)
  expect(solver.getOutput()[1]!.angleDegrees).toBeCloseTo(206.565051)
  expect(input).toEqual(original)
  expect(solver.pipelineOutputs.oddAngleFinder).toEqual(solver.getOutput())
})
test("tolerance works around 0°, 45°, and 360°", () => {
  for (const angle of [-0.05, 0.05, 44.95, 45.05, 359.95]) {
    const a = (angle * Math.PI) / 180
    const input = makeSrj([wire(0, 0), wire(Math.cos(a), Math.sin(a))])
    const relaxed = new PcbTraceLinter({ input })
    relaxed.solve()
    expect(relaxed.getOutput()).toEqual([])
    const strict = new PcbTraceLinter({ input, angleToleranceDegrees: 0.01 })
    strict.solve()
    expect(strict.getOutput()).toHaveLength(1)
  }
})
test("checks wires to/from vias, skipping vertical and cross-layer transitions", () => {
  const via = {
    route_type: "via" as const,
    x: 2,
    y: 1,
    from_layer: "top",
    to_layer: "bottom",
  }
  const solver = new PcbTraceLinter({
    input: makeSrj([wire(0, 0), via, wire(4, 2, "bottom"), wire(5, 4, "top")]),
  })
  solver.solve()
  expect(solver.getOutput().map((i) => [i.segmentIndex, i.layer])).toEqual([
    [0, "top"],
    [1, "bottom"],
  ])
  const coincident = new PcbTraceLinter({
    input: makeSrj([wire(2, 1), via, wire(2, 1, "bottom")]),
  })
  coincident.solve()
  expect(coincident.getOutput()).toEqual([])
})
test("does not bridge through-obstacle routes or jumper bodies", () => {
  const solver = new PcbTraceLinter({
    input: makeSrj([
      wire(0, 0),
      {
        route_type: "through_obstacle",
        start: { x: 0, y: 0 },
        end: { x: 2, y: 1 },
        from_layer: "top",
        to_layer: "top",
        width: 0.2,
      },
      wire(2, 1),
      {
        route_type: "jumper",
        start: { x: 2, y: 1 },
        end: { x: 4, y: 2 },
        layer: "top",
        footprint: "0603",
      },
      wire(4, 2),
    ]),
  })
  solver.solve()
  expect(solver.getOutput()).toEqual([])
})
test("empty and single-point traces finish successfully", () => {
  for (const route of [[], [wire(0, 0)]]) {
    const solver = new PcbTraceLinter({ input: makeSrj(route) })
    solver.solve()
    expect(solver.solved).toBe(true)
    expect(solver.getOutput()).toEqual([])
  }
})
test("rejects invalid tolerances and coordinates", () => {
  for (const angleToleranceDegrees of [-1, 22.5, NaN, Infinity])
    expect(
      () => new OddAngleFinder({ srj: makeSrj([]), angleToleranceDegrees }),
    ).toThrow()
  for (const minSegmentLength of [-1, NaN, Infinity])
    expect(
      () => new OddAngleFinder({ srj: makeSrj([]), minSegmentLength }),
    ).toThrow()
  expect(() => new PcbTraceLinter({ input: makeSrj([wire(NaN, 0)]) })).toThrow(
    "Invalid route point",
  )
})
