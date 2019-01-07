import { ConnectedClient } from '../ConnectedClient'
import { Handler } from '../../Handler'
import { Server } from './Server'

export class ServerHandler implements Handler {
  constructor(private server: Server, private client: ConnectedClient) {}

  public pingServers() {
    this.server.emit('serverPing', {
      id: this.server.id,
      url: location.href
    })
  }

  public disposeClient() {
    this.client.dispose()
  }

  public dispose() {}
}
