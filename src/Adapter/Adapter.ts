import { CHANNEL_RX, CHANNEL_TX } from '../constants'
import { isValidEvent, makeValidEvent } from '../utils'
import { IServerEvent, IClientEvent } from '../types'

export class Adapter {
  public rx = new BroadcastChannel(CHANNEL_RX)
  public tx = new BroadcastChannel(CHANNEL_TX)

  constructor() {
    window.addEventListener('message', this.onMessage)
    this.tx.addEventListener('message', this.postMessage)
  }

  public dispose() {
    window.removeEventListener('message', this.onMessage)

    this.tx.close()
  }

  private onMessage = ({ data }: MessageEvent) => {
    if (!isValidEvent(data)) return
    const event: IClientEvent = data

    this.rx.postMessage(event)
  }

  private postMessage = ({ data }: MessageEvent) => {
    const event = makeValidEvent<IServerEvent>(data)

    window.parent && window.parent.postMessage(event, '*')
  }
}
