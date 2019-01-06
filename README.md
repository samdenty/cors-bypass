# bypass-cors

Bypass the browsers CORS restrictions, without needing to setup a server-side proxy. [Initial idea](https://stackoverflow.com/a/44943661/5269570)

This module works by:

- Allows you to make HTTP requests from a HTTPS page
- Includes full support for the [`WebSocket` API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

## How does this module work?

It uses [`postMessage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) to send cross-domain events, which is used to create "fake" HTTP APIs (`fetch`, `WebSocket`, `XMLHTTPRequest` etc.)

## How do I use it

Theres three components to this module: the `Server`, `Adapter` and `Client`.

### Server

Serve a HTML file on a domain from which you want to **make requests from** (HTTP domain for example), with the following (you should use a bundler like [Webpack](https://webpack.js.org), [Parcel](https://parceljs.org) etc):

```typescript
import { Server } from 'bypass-cors'

const server = new Server()
```

### Adapter

Next you need a HTML file from the domain that **will make requests** (your web app's domain). The adapter is in control of forwarding requests from a client located on _any page of your site_, to the server (using a [`BroadcastChannel`](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)).

```typescript
import { Adapter } from 'bypass-cors'
const adapter = new Adapter()
```

### Client

As long as the Adapter is running in a different tab (on the same domain as the client), you will be able to make requests.

```typescript
// Located somewhere on https://your-site.com
import * as BypassCors from 'bypass-cors'

const client = new BypassCors.Client()

await client.getServer() // null - no server connected yet
await client.openServerInNewTab({
  serverUrl: 'http://random-domain.com/server.html',
  adapterUrl: 'https://your-site.com/adapter.html'
})
await client.getServer() // { id: 123, url: 'http://random-domain.com/server.html' }

// Create a WebSocket (websocket is loaded in the server tab, but it's API is available on this page)
const ws = new BypassCors.WebSocket('ws://echo.websocket.org')
ws.onopen = () => ws.send('hello')
ws.onmessage = ({ data }) => console.log('received', data)
```

## Use cases

### HTTP requests for Offline PWAs

As using a Service Worker require HTTPS, it's impossible to connect to local devices which only support HTTP.
On local devices, even if you had the ability to use HTTPS, it uses a self-signed certificate.

Using this module does requires the user to open an extra window, but it lets you bypass cors.
