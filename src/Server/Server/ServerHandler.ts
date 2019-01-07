import { ConnectedClient } from '../ConnectedClient'
import { Handler } from '../../Handler'
import { Server } from './Server'

export const PONG_INTERVAL = 1000

export class ServerHandler implements Handler {
  private pongTimer = setInterval(() => this.pong(), 1000)

  constructor(private server: Server, private client: ConnectedClient) {
    this.pingAllServers()
  }

  private pong() {
    this.server.emit('pong', {
      url: location.href
    })
  }

  public pingAllServers() {
    this.pong()
  }

  public disposeClient() {
    this.client.dispose()
  }

  public dispose() {
    clearInterval(this.pongTimer)
  }
}
