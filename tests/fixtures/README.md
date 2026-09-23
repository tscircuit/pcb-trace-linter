# Pipeline9 fixture provenance

- Dataset: [tscircuit/dataset-srj18](https://github.com/tscircuit/dataset-srj18), commit `100e8957ce789b5b288e14c476dc83f4efc5214b` (the revision referenced by the autorouter).
- Input: [`samples/sample003.json`](https://github.com/tscircuit/dataset-srj18/blob/100e8957ce789b5b288e14c476dc83f4efc5214b/samples/sample003.json), copied verbatim to `dataset-srj18-sample003.input.json`.
- Board: Arduino Micro, from [sabogalc/KiCad-Arduino-Boards](https://github.com/sabogalc/KiCad-Arduino-Boards/blob/main/KiCad%20Projects/Arduino%20Micro/Arduino%20Micro.kicad_pcb), as recorded in dataset `source-files.json`.
- Autorouter reference inspected: `tscircuit/tscircuit-autorouter@eb7e607ee793985a65994a768e5f1edb84d97d5b`, `fixtures/benchmarks/dataset-srj18.fixture.tsx`.
- Executed solver: `AutoroutingPipelineSolver9_PreloadedTraceGraph`, published `@tscircuit/capacity-autorouter@0.0.928`, default options.
- Run: 2026-09-23; `solved: true`; 209701 iterations; 145 output traces. Input contains 103 connections and 211 obstacles.
- Output: `getOutputSimpleRouteJson()`, saved without route modification to `dataset-srj18-sample003.routed.json`.
- Linter result: 320 issues with `angleToleranceDegrees: 0.1` and `minSegmentLength: 1e-9`.

Run `bun run generate:fixture` from the repository root to reproduce routing from the copied input, then `BUN_UPDATE_SNAPSHOTS=1 bun test -u` to regenerate snapshots. Normal tests use the committed routed output and do not rerun routing.
