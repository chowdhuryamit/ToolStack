import type { RestRequest, RestResponse } from '../types'

export function createRestResponse(request: RestRequest): RestResponse {
  return {
    status: 200,
    durationMs: 0,
    body: JSON.stringify({ method: request.method, url: request.url }, null, 2),
  }
}
