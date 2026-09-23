import type { LayerRef } from "circuit-json"
import type { SimpleRouteJson } from "lib/index"
export const wire = (x: number, y: number, layer: LayerRef = "top") => ({
  route_type: "wire" as const,
  x,
  y,
  layer,
  width: 0.2,
})
export function makeSrj(
  route: NonNullable<SimpleRouteJson["traces"]>[number]["route"],
): SimpleRouteJson {
  return {
    layerCount: 2,
    minTraceWidth: 0.2,
    bounds: { minX: -5, maxX: 5, minY: -5, maxY: 5 },
    obstacles: [],
    connections: [],
    traces: [
      {
        type: "pcb_trace",
        pcb_trace_id: "t1",
        connection_name: "signal",
        route,
      },
    ],
  }
}
