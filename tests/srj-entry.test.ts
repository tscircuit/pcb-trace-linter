import { expect, test } from "bun:test"
import { PcbTraceLinter } from "../lib/srj"
import { makeSrj, wire } from "./fixtures/make-srj"

test("SRJ entry excludes the Circuit JSON renderer from its runtime dependency graph", async () => {
  const solver = new PcbTraceLinter({
    input: makeSrj([wire(0, 0), wire(2, 1)]),
  })
  solver.solve()
  expect(solver.getOutput()).toHaveLength(1)
  const bundle = await Bun.build({
    entrypoints: [new URL("../lib/srj.ts", import.meta.url).pathname],
    target: "browser",
    packages: "external",
  })
  expect(bundle.success).toBe(true)
  const source = await bundle.outputs[0]!.text()
  expect(source).not.toContain("@tscircuit/core")
  expect(source).not.toContain("normalizeInput")
})
