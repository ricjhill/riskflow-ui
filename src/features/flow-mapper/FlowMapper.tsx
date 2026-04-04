import { SessionProvider } from './SessionContext'

function FlowMapper() {
  return (
    <SessionProvider>
      <div className="flow-mapper">
        <h1>Flow Mapper</h1>
      </div>
    </SessionProvider>
  )
}

export default FlowMapper
