import { OrderBookSync } from 'rt-orderbook-utils'
import WebsocketClient from '../src/WebsocketClient'

const f = parseFloat
const symbol = 'BTCUSD'
const mapBookSide = ({ price, size }) => [f(price), f(size)]
const mapSide = (side, amount = 25) => side.slice(0, amount).map(s => [s.price, s.size])

const client = new WebsocketClient({
  symbols: [symbol],
})

const orderBookSync = new OrderBookSync({
  snapshotFromSocket: true,
  allowNonStrictSeq: true,
  ccxtSymbols: [symbol],
})

client.on('error', err => {
  console.log(new Date(), 'ERROR:', err)
})

client.on('close', () => {
  console.log(new Date(), 'CLOSE:')
})

const parseBook = rawBook => {
  const { symbol: s, ask, bid, sequence } = rawBook
  return {
    asks: ask.map(mapBookSide),
    bids: bid.map(mapBookSide),
    symbol: s,
    sequence,
  }
}

const handleMessage = data => {
  const { method, params } = data
  switch (method) {
    case `snapshotOrderbook`: {
      const book = parseBook(params)
      orderBookSync.loadOrderBook(params.symbol, book)
      break
    }
    case `updateOrderbook`: {
      const book = parseBook(params)
      orderBookSync.processMessage(book)
      break
    }
    default: {
      console.log(data)
      break
    }
  }
}

client.on(`message`, handleMessage)

orderBookSync.on('sync', () => console.log(new Date(), 'syncing'))
orderBookSync.on('synced', () => console.log(new Date(), 'synced'))

orderBookSync.on('updated', book => {
  console.clear()
  console.log('bids')
  console.log(mapSide(book.bids))
  console.log('asks')
  console.log(mapSide(book.asks))
})
