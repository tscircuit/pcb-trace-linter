import { expect, test } from "bun:test"
import { normalizeInput, PcbTraceLinter } from "lib/index"
import routed from "./fixtures/dataset-srj18-sample003.routed.json"

const srj = normalizeInput(routed)
const solver = new PcbTraceLinter({ input: srj })
solver.solve()

test("Pipeline9 sample003: board overview highlights every reported segment", async () => {
  expect(solver.solved).toBe(true)
  expect(solver.getOutput().length).toBeGreaterThan(0)
  expect(solver.getOutput()).toMatchSnapshot()
  const graphics = solver.finalVisualize()
  expect(graphics.points).toHaveLength(solver.getOutput().length)
  expect(
    graphics.lines?.filter((l) => l.strokeColor === "#e11d48"),
  ).toHaveLength(solver.getOutput().length)
  await expect(graphics).toMatchGraphicsSvg(import.meta.path, {
    svgName: "pipeline9-sample003-overview",
  })
})

for (const [i, issue] of solver.getOutput().entries()) {
  test(`Pipeline9 sample003: issue ${i + 1} (${issue.pcb_trace_id}:${issue.segmentIndex})`, async () => {
    const dx = issue.end.x - issue.start.x
    const dy = issue.end.y - issue.start.y
    const scale = 7 / Math.max(Math.abs(dx), Math.abs(dy))
    const start = { x: 5 - (dx * scale) / 2, y: 5 - (dy * scale) / 2 }
    const end = { x: 5 + (dx * scale) / 2, y: 5 + (dy * scale) / 2 }
    await expect({
      coordinateSystem: "cartesian",
      rects: [
        {
          center: { x: 5, y: 5 },
          width: 10,
          height: 12,
          fill: "none",
          stroke: "#cbd5e1",
        },
      ],
      lines: [
        { points: [start, end], strokeColor: "#e11d48", strokeWidth: 0.05 },
      ],
      points: [
        { ...start, label: "start" },
        { ...end, label: "end" },
      ],
      texts: [
        {
          x: 0.4,
          y: 10.5,
          text: `#${i + 1} | segment ${issue.segmentIndex} | ${issue.layer} | ${issue.angleDegrees.toFixed(2)} deg`,
          fontSize: 0.25,
        },
        { x: 0.4, y: 10, text: issue.pcb_trace_id, fontSize: 0.23 },
        {
          x: 0.4,
          y: 0,
          text: `start: (${issue.start.x.toFixed(4)}, ${issue.start.y.toFixed(4)}) mm`,
          fontSize: 0.25,
        },
        {
          x: 0.4,
          y: -0.5,
          text: `end: (${issue.end.x.toFixed(4)}, ${issue.end.y.toFixed(4)}) mm`,
          fontSize: 0.25,
        },
      ],
    }).toMatchGraphicsSvg(import.meta.path, {
      svgName: `pipeline9-sample003-issue-${String(i + 1).padStart(3, "0")}`,
    })
  })
}
