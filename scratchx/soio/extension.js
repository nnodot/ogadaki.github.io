(function (ext) {
  ext.name = 'Simple message server'

  var startExtension = function () {
    // Cleanup function when the extension is unloaded
    ext._shutdown = function () {
      ext.socket.diconnect()
    }

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function () {
      return { status: 2, msg: 'Ready' }
    }

    // Cache all incomming messages in queue the will be consumed by
    // "get message" block.
    ext.messages = []
    // List callbacks waiting for messages when message queue is empty.
    ext.callbacks = []

    ext.connect = function (url) {
      if (ext.socket) {
        ext.socket.disconnect()
      }
      ext.socket = io(url, { forceNew: true })
      ext.socket.on('message', function (message) {
        if (ext.callbacks.length !== 0) {
          var callback = ext.callbacks.shift()
          callback(message)
        } else {
          ext.messages.push(message)
        }
      })
    }

    ext.send_message = function (message) {
      ext.socket.emit('message', message)
    }

    ext.get_next_message = function (callback) {
      if (ext.messages.length === 0) {
        ext.callbacks.push(callback)
      } else {
        var message = ext.messages.shift()
        callback(message)
      }
    }

    // Block and block menu descriptions
    var descriptor = {
      blocks: [
        ['', 'connect to message server at URL %s', 'connect', 'https://soio-ogadaki.now.sh'],
        ['', 'send %s to server', 'send_message', 'message'],
        ['R', 'next message from server', 'get_next_message'],
      ],
      url: 'https://ogadaki.github.io/scratchx/soio'
    }

    ScratchExtensions.register(ext.name, descriptor, ext)
    window.ext = ext
  }

  var loadScript = function (url, callback) {
    log('load script ' + url)
    var head = document.getElementsByTagName('head')[0]
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = url

    script.onreadystatechange = callback
    script.onload = callback

    head.appendChild(script)
  }

  if (io === undefined) {
    var socketioUrl = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js'
    log('load socket.io library')
    loadScript(socketioUrl, startExtension)
  } else {
    startExtension()
  }
})({})
