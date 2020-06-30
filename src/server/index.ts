import { YoutubeDownloader } from './YTDownloader'
import express from 'express'
import * as socketio from 'socket.io'
import * as path from 'path'
import { createApplicationWithIO } from './helpers/createApp'

const temp = express()
temp.set('port', process.env.PORT || 3000)

const http = require('http').Server(temp)

const io = socketio.default(http)
const app = createApplicationWithIO(temp, io)

app.get('/', (req, res) => {
  res.sendFile(path.resolve('./src/server/browser/index.html'))
  req.app.io.emit('data', Buffer.from('hello'))
  // req.socket.write('lol')
})

app.get('/download/:id', function (req, res) {
  const yt = new YoutubeDownloader(req.params.id)
  res.contentType('json')

  yt.onProgressChange = (progress) => {
    res.socket.emit('data', progress.progress)
    res.write(JSON.stringify(progress.progress))
    // console.log()
  }

  yt.onError = (err) => {
    console.error(err)
  }

  yt.onFinish = (d) => {
    res.send(JSON.stringify(d))
    res.end()
  }

  yt.download()
})

io.on('connection', function (socket: SocketIO.Socket) {
  console.log('a user connected')
  socket.send('hello')
  socket.on('message', data => {
    console.log(data)
  })
})

http.listen(3000, function () {
  console.log('listening on http://localhost:3000')
})
