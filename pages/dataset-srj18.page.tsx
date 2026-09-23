import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { normalizeInput, PcbTraceLinter } from "lib/index"
import sample from "tests/fixtures/dataset-srj18-sample003.routed.json"
export default (
  <GenericSolverDebugger
    createSolver={() => new PcbTraceLinter({ input: normalizeInput(sample) })}
  />
)
