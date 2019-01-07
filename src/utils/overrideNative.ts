import { WebSocket as ShimmedWebSocket } from '../Client'

export const overrideNativeWebsocket = (checker?: (wsUrl: URL) => boolean) => {
  const NativeWebSocket = WebSocket
  ;(window as any).WebSocket = function(uri: string, ...rest: any[]) {
    const url = new URL(uri)

    const override = checker ? checker(url) : true

    return override
      ? new ShimmedWebSocket(uri, ...rest)
      : new NativeWebSocket(uri, ...rest)
  }

  return () => {
    ;(window as any).WebSocket = NativeWebSocket
  }
}
