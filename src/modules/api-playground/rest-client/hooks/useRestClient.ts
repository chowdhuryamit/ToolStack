import { useState } from 'react'
import { DEFAULT_REST_REQUEST } from '../constants'
import { createRestResponse } from '../utilities/createRestResponse'
import type { RestRequest, RestResponse } from '../types'

export function useRestClient() {
  const [request, setRequest] = useState<RestRequest>(DEFAULT_REST_REQUEST)
  const [response, setResponse] = useState<RestResponse>()

  function send() {
    setResponse(createRestResponse(request))
  }

  return { request, response, setRequest, send }
}
