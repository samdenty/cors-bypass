import { ConnectedClient } from '../ConnectedClient'
import { Handler } from '../../Handler'
import { Server } from '../Server'

export class ConnectedClientHandler implements Handler {
  private disposeTimer: any

  constructor(private server: Server, private client: ConnectedClient) {
    this.addDisposeTimer()
  }

  private addDisposeTimer() {
    this.clearDisposeTimer()
    this.disposeTimer = setTimeout(() => this.client.dispose(), 2500)
  }

  private clearDisposeTimer() {
    clearTimeout(this.disposeTimer)
  }

  public ping() {
    this.addDisposeTimer()
  }

  public dispose() {
    this.clearDisposeTimer()
  }
}
