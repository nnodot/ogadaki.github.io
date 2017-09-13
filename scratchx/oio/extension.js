(function (ext) {
  ext.name = 'Message server'

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

    ext.connect = function (url, key) {
      if (ext.socket) {
        ext.socket.disconnect()
      }
      var path = getPath(url)
      var key = createHash(key)
      var fullUrl = url + '/' + key + '?namespace=' + path + '/' + key
      ext.socket = io(fullUrl, { forceNew: true, path: path })
    }

    ext.send_message = function (message, channel) {
      ext.socket.emit(channel, message)
    }

    ext.channels = {}
    ext.get_next_message = function (channel, callback) {
      if (ext.channels[channel] === undefined) {
        ext.channels[channel] = { messages: [], callbacks: [] }
        ext.socket.on(channel, function (message) {
          if (ext.channels[channel].callbacks.length !== 0) {
            var callback = ext.channels[channel].callbacks.shift()
            callback(message)
          } else {
            ext.channels[channel].messages.push(message)
          }
        })
      }
      if (ext.channels[channel].messages.length === 0) {
        ext.channels[channel].callbacks.push(callback)
      } else {
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
