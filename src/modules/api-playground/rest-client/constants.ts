import type { RestRequest } from './types'

export const REST_CLIENT_TITLE = 'REST Client'
export const REST_CLIENT_ROUTE = '/tools/rest-client'

export const DEFAULT_REST_REQUEST: RestRequest = {
  method: 'GET',
  url: '',
  headers: [],
  body: '',
}
