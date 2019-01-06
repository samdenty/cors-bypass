import { Client, WebSocket } from '../src'

const launchServer = document.createElement('button')
const testSocket = document.createElement('button')
launchServer.innerText = 'Launch server'
testSocket.innerText = 'Create websocket'
document.body.appendChild(launchServer)
document.body.appendChild(testSocket)

launchServer.onclick = () => {
  client.openServerInNewTab({
    adapterUrl: './adapter.html',
    serverUrl: './server.html'
  })
}
testSocket.onclick = () => test()

const client = new Client()

function testMqtt() {
  const mqtt = require('mqtt')

  var client = mqtt.connect('ws://test.mosquitto.org:8080')
  client.on('connect', function() {
    client.subscribe('presence', function(err) {
      if (!err) {
        client.publish('presence', 'Hello mqtt')
      }
    })
  })

  client.on('message', function(topic, message) {
    // message is Buffer
    console.log({ topic, message: message.toString() })
  })
}

function test() {
  var wsUri = 'wss://echo.websocket.org/'
  var output = document.getElementById('output')
  var websocket = new WebSocket(wsUri)

  websocket.onopen = function(evt) {
    onOpen(evt)
  }
  websocket.onclose = function(evt) {
    onClose(evt)
  }
  websocket.onmessage = function(evt) {
    onMessage(evt)
  }
  websocket.onerror = function(evt) {
    onError(evt)
  }

  function onOpen(evt) {
    writeToScreen('CONNECTED')
    doSend('WebSocket rocks')
  }

  function onClose(evt) {
    writeToScreen('DISCONNECTED')
  }

  function onMessage(evt) {
    writeToScreen(
      '<span style="color: blue;">RESPONSE: ' + evt.data + '</span>'
    )
    websocket.close()
  }

  function onError(evt) {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data)
  }

  function doSend(message) {
    writeToScreen('SENT: ' + message)
    websocket.send(message)
  }

  function writeToScreen(message) {
    var pre = document.createElement('p')
    pre.style.wordWrap = 'break-word'
    pre.innerHTML = message
    output.appendChild(pre)
  }
}
