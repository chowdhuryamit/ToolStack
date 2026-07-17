export type RestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export type RestHeader = {
  key: string
  value: string
  enabled: boolean
}

export type RestRequest = {
  method: RestMethod
  url: string
  headers: RestHeader[]
  body: string
}

export type RestResponse = {
  status: number
  durationMs: number
  body: string
}
