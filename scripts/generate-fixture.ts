import { AutoroutingPipelineSolver9_PreloadedTraceGraph } from "@tscircuit/capacity-autorouter"
import type { SimpleRouteJson } from "@tscircuit/capacity-autorouter"
import input from "../tests/fixtures/dataset-srj18-sample003.input.json"

const solver = new AutoroutingPipelineSolver9_PreloadedTraceGraph(
  structuredClone(input) as SimpleRouteJson,
)
const started = performance.now()
while (!solver.solved && !solver.failed) {
  solver.step()
  if (solver.iterations % 10000 === 0)
    console.log(solver.iterations, solver.getCurrentPhase())
}
if (solver.failed) throw new Error(solver.error ?? "Pipeline9 failed")
const output = solver.getOutputSimpleRouteJson()
if (!output.traces?.length) throw new Error("Pipeline9 produced no traces")
await Bun.write(
  new URL(
    "../tests/fixtures/dataset-srj18-sample003.routed.json",
    import.meta.url,
  ),
  `${JSON.stringify(output, null, 2)}\n`,
)
console.log(
  JSON.stringify({
    solved: solver.solved,
    iterations: solver.iterations,
    traces: output.traces.length,
    elapsedMs: performance.now() - started,
  }),
)
