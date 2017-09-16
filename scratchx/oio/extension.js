(function (ext) {
  ext.name = 'Message I/O'

  var startExtension = function () {
    // Cleanup function when the extension is unloaded
    ext._shutdown = function () {
      ext.socket.diconnect()
      console.log(ext.channels)
      ext.channels = {}
    }

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function () {
      return { status: 2, msg: 'Ready' }
    }

    // Converts a string to another string a string with only alphanumeric
    // characters and underscores. It replaces all non alphanumeric chars
    // with an alphanumeric string surounding by underscores.
    // Example: "a a" is converted into "a_w_a".
    var createHash = function (string) {
      var hash = ''
      for (var i = 0; i < string.length; i++) {
        var char = string.charAt(i)
        var newString = char
        if (char.match(/^[a-z0-9]+$/i) === null) {
          // Not an alphanumeric char
          var code = string.charCodeAt(i)
          newString = '_' + code.toString(36) + '_'
        }
        hash += newString
      }
      return hash;
    }

    var getPath = function (url) {
      var parser = document.createElement('a')
      parser.href = url
      return parser.pathname
    }

    ext.channels = {}
    ext.connect = function (url, key) {
      var path = getPath(url)
      var key = createHash(key)
      var fullUrl = url + '/' + key + '?namespace=' + path + '/' + key
      if (fullUrl !== ext.currentConnectionFullUrl) {
        if (ext.socket) {
          ext.socket.disconnect()
          ext.channels = {}
          // Even if we disconnect and clear ext.channels in some case there
          // is some problem. If:
          // * one has a project that is running,
          // * that has been connected to an URL,
          // * that has a waiting "get" block (i.e. there is a callback
          //   waiting in a callback queue for one channel)
          // * if one changes the fullUrl (either with URL or key)
          // * when one restarts the project (green flag)
          // * the "get" block are stuck and never returns, because it is
          //   waiting from the all callback in the queue.
          // Apparently, when one stop a project, Scratch doesn't "stop" the
          // waiting callbacks.
          // One solution is to call all callbacks before reconnection, but it
          // has the side effect to actually send the chosen content (null?,
          // undefined?, some value?, but which one?) to the project.
          //
          // So don't clean the callbacks. We assume that one doesn't change
          // url or key very often, and a save/reload fix the problem. We keep
          // that and document it.
        }
        ext.socket = io(fullUrl, { forceNew: true, path: path })
        ext.currentConnectionFullUrl = fullUrl
        // console.log(`new connection to "${fullUrl}"`)
      } else {
        // console.log('keep existing connection')
      }
    }

    ext.send_message = function (message, channel) {
      // console.log(`send "${message}" to channel "${channel}"`)
      ext.socket.emit(channel, message)
    }

    ext.get_next_message = function (channel, callback) {
      // console.log(`get message from channel "${channel}"`)
      if (ext.channels[channel] === undefined) {
        // console.log(`channel doesn't exist, create it`)
        ext.channels[channel] = { messages: [], callbacks: [] }
        ext.socket.on(channel, function (message) {
          // console.log(`server has send message "${message}" on channel "${channel}"`)
          if (ext.channels[channel].callbacks.length !== 0) {
            // console.log(`a block is waiting for a message, send it to it. (1)`)
            var callback = ext.channels[channel].callbacks.shift()
            callback(message)
          } else {
            // console.log('no waiting block for a message, queue the message. (1)')
            ext.channels[channel].messages.push(message)
          }
        })
      }
      if (ext.channels[channel].messages.length === 0) {
        // console.log('no waiting message, queue the block.')
        ext.channels[channel].callbacks.push(callback)
      } else {
        // console.log(`a message is waiting for a block, send it to it.`)
        var message = ext.channels[channel].messages.shift()
        callback(message)
      }
    }

    // Create pseudo random key (source: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript)
    var randomKey = Math.random().toString(36).substring(2)
    // Block and block menu descriptions
    var descriptor = {
      blocks: [
        ['', 'connect to message server at URL %s with key %s', 'connect', 'https://ogadaki.now.sh/oio', randomKey],
        ['', 'send %s to channel %s', 'send_message', 'message', 'channel'],
        ['R', 'next message from channel %s', 'get_next_message', 'channel'],
      ],
      url: 'https://ogadaki.github.io/scratchx/oio'
    }

    ScratchExtensions.register(ext.name, descriptor, ext)
    window.ext = ext
  }

  var loadScript = function (url, callback) {
    var head = document.getElementsByTagName('head')[0]
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = url

    script.onreadystatechange = callback
    script.onload = callback

    head.appendChild(script)
  }

  var socketioUrl = 'https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js'
  loadScript(socketioUrl, startExtension)
  window.myext = ext
})({})
