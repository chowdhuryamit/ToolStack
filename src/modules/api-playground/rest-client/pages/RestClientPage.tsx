import { useState } from 'react'
import { HeaderEditor } from '../components/HeaderEditor'
import { RequestActions } from '../components/RequestActions'
import { RequestEditor } from '../components/RequestEditor'
import { ResponsePanel } from '../components/ResponsePanel'
import { REST_CLIENT_TITLE } from '../constants'
import { useRestClient } from '../hooks/useRestClient'

export function RestClientPage() {
  const client = useRestClient()
  const [activeTab, setActiveTab] = useState<'headers' | 'body' | 'query'>('headers')

  return (
    <section className="page-stack tool-workspace">
      <div className="section-heading">
        <p className="eyebrow">API playground</p>
        <h1>{REST_CLIENT_TITLE}</h1>
        <p className="muted">Compose requests with a focused address bar and inspect formatted responses.</p>
      </div>
      <section className="tool-panel api-lab">
        <div className="api-address-bar">
          <RequestEditor request={client.request} onChange={client.setRequest} />
          <RequestActions onSend={client.send} />
        </div>
        <div className="tab-list">
          {(['headers', 'body', 'query'] as const).map((tab) => (
            <button className={`tab-button ${activeTab === tab ? 'tab-button-active' : ''}`} type="button" key={tab} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          {activeTab === 'headers' && <HeaderEditor headers={client.request.headers} />}
          {activeTab === 'body' && <pre>{client.request.body || '{\n  \n}'}</pre>}
          {activeTab === 'query' && <pre>{'// Query params'}</pre>}
        </div>
      </section>
      <section className="tool-panel response-panel">
        <div className="panel-header">
          <h2>Response</h2>
          <span className="status-pill status-online"><span />JSON</span>
        </div>
        <ResponsePanel response={client.response} />
      </section>
    </section>
  )
}
