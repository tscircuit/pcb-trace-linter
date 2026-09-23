import { useRef, useState } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { normalizeInput, PcbTraceLinter, type TraceIssue } from "lib/index"
import sample from "tests/fixtures/dataset-srj18-sample003.routed.json"

function LintSession({ solver }: { solver: PcbTraceLinter }) {
  const [issues, setIssues] = useState<TraceIssue[] | null>(null)
  return (
    <>
      <GenericSolverDebugger
        solver={solver}
        onSolverStarted={() => setIssues(null)}
        onSolverCompleted={(completed) =>
          setIssues((completed as PcbTraceLinter).getOutput())
        }
      />
      {issues && (
        <section aria-label="Lint results">
          <h2>
            {issues.length} odd-angle{" "}
            {issues.length === 1 ? "segment" : "segments"}
          </h2>
          {!solver.srj.traces?.length && (
            <p>
              No routed traces were found. Upload an already routed board to
              analyze its traces.
            </p>
          )}
          <p>
            Violating segments are highlighted in red. Marker numbers match the
            rows below.
          </p>
          <button
            type="button"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(issues, null, 2)], {
                  type: "application/json",
                }),
              )
              const a = document.createElement("a")
              a.href = url
              a.download = "pcb-trace-issues.json"
              a.click()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Download issues JSON
          </button>
          <div style={{ overflowX: "auto", maxHeight: 360, marginTop: 12 }}>
            <table
              style={{
                width: "100%",
                textAlign: "left",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr>
                  {[
                    "#",
                    "Trace",
                    "Segment",
                    "Layer",
                    "Start (mm)",
                    "End (mm)",
                    "Angle",
                    "Deviation",
                  ].map((h) => (
                    <th key={h} style={{ padding: 8 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, i) => (
                  <tr
                    key={issue.issueId}
                    style={{ borderTop: "1px solid #e2e8f0" }}
                  >
                    <td>{i + 1}</td>
                    <td>{issue.pcb_trace_id}</td>
                    <td>
                      {issue.segmentIndex} → {issue.endRouteIndex}
                    </td>
                    <td>{issue.layer}</td>
                    <td>
                      {issue.start.x.toFixed(3)}, {issue.start.y.toFixed(3)}
                    </td>
                    <td>
                      {issue.end.x.toFixed(3)}, {issue.end.y.toFixed(3)}
                    </td>
                    <td>{issue.angleDegrees.toFixed(2)}°</td>
                    <td>{issue.deviationDegrees.toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
export default function Welcome() {
  const [session, setSession] = useState(() => ({
    id: 0,
    name: "dataset-srj18 · sample003 · Pipeline9",
    solver: new PcbTraceLinter({ input: normalizeInput(sample) }),
  }))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)
  return (
    <main>
      <h1>PCB trace linter</h1>
      <p>
        Find trace segments that depart from horizontal, vertical, or 45°
        diagonal directions. Default tolerance: 0.1°.
      </p>
      <label>
        Upload Circuit JSON or SimpleRouteJson{" "}
        <input
          type="file"
          accept=".json,application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0]
            if (!file) return
            const id = ++requestId.current
            setLoading(true)
            setError(null)
            try {
              const input = normalizeInput(JSON.parse(await file.text()))
              const solver = new PcbTraceLinter({ input })
              if (id === requestId.current)
                setSession((s) => ({ id: s.id + 1, name: file.name, solver }))
            } catch (err) {
              if (id === requestId.current)
                setError(err instanceof Error ? err.message : String(err))
            } finally {
              if (id === requestId.current) setLoading(false)
              event.target.value = ""
            }
          }}
        />
      </label>
      <button
        type="button"
        style={{ marginLeft: 12 }}
        onClick={() => {
          requestId.current++
          setLoading(false)
          setError(null)
          setSession((s) => ({
            id: s.id + 1,
            name: "dataset-srj18 · sample003 · Pipeline9",
            solver: new PcbTraceLinter({ input: normalizeInput(sample) }),
          }))
        }}
      >
        Load routed example
      </button>
      {loading && <p role="status">Reading board…</p>}
      {error && (
        <p role="alert" style={{ color: "#be123c" }}>
          {error}
        </p>
      )}
      <h2>{session.name}</h2>
      <p>
        Use Solve to list all issues, or Step / Animate to inspect the
        OddAngleFinder stage.
      </p>
      <LintSession key={session.id} solver={session.solver} />
    </main>
  )
}
