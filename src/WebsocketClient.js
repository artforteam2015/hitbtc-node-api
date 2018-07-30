import WebSocket from 'ws'
import { EventEmitter } from 'events'

class WebSocketClient extends EventEmitter {
  constructor({
    symbols = [],
    channels = ['book'],
  } = {}) {
    super()
    this.symbols = symbols
    this.channels = channels
    this.socketUrl = 'wss://api.hitbtc.com/api/2/ws'

    this.connect()
  }

  connect() {
    if (this.socket) {
      this.socket.close()
    }

    this.socket = new WebSocket(this.socketUrl)

    this.socket.on('open', this.onOpen)
    this.socket.on('error', this.onError)
    this.socket.on('close', this.onClose)
    this.socket.on('message', this.onMessage)
  }

  disconnect() {
    if (!this.socket) {
      throw new Error('Could not disconnect (not connected)')
    }

    this.socket.close()
    this.socket = null
  }

  subscribe(options) {
    this.socket.send(JSON.stringify({
      ...options,
      id: 123,
    }))
  }

  subscribeTicker = symbol => {
    this.subscribe({
      method: 'subscribeTicker',
      params: {
        symbol,
      },
    })
  }

  subscribeOrderBook = symbol => {
    this.subscribe({
      method: 'subscribeOrderbook',
      params: {
        symbol,
      },
    })
  }

  onOpen = () => {
    this.emit('open')

    if (this.channels.includes('book')) {
      this.symbols.forEach(this.subscribeOrderBook)
    }
  }

  onClose = () => {
    this.socket = null
    this.emit('close')
  }

  onMessage = data => {
    const message = JSON.parse(data)

    if (message.error) {
      this.onError(message)
    } else {
      this.emit('message', message)
    }
  }

  onError = err => {
    if (!err) {
      return
    }

    this.emit('error', err)
  }
}

export default WebSocketClient
