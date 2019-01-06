import { Server } from '../src'

const server = new Server({
  adapterUrl: './adapter.html',
})
;(window as any).server = server
