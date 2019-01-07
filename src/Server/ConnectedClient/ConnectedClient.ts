import { handlers, Handler } from '../../Handler'
import { ClientID, IServerTopics } from '../../types'
import { Server } from '../Server'

export class ConnectedClient {
  private handlers: Handler[] = handlers.map(
    (Handler: any) => new Handler(this.server, this)
  )

  constructor(private server: Server, public id: ClientID) {}

  public handleEvent<Topic extends keyof IServerTopics>(
    topic: Topic,
    payload: IServerTopics[Topic]
  ) {
    if (/constructor|dispose|prototype/.test(String(topic))) return false

    for (const handler of this.handlers) {
      if (topic in handler) {
        const method = handler[topic as string]

        if (typeof method === 'function') {
          method.bind(handler)(payload)
          return true
        }
      }
    }

    return false
  }

  public dispose() {
    this.handlers.forEach(handler => handler.dispose && handler.dispose())
    this.server.clients.delete(this.id)
  }
}
