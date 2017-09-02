(function(ext) {
    ext.name = 'Simple message server'

    // Customed log function for the extension
    var log = function (string) {
        console.log('[' + ext.name + '] ' + string)
    }

    var startExtension = function () {
        log('start extension')

        // Cleanup function when the extension is unloaded
        ext._shutdown = function() {
            ext.socket.diconnect()
        }

        // Status reporting code
        // Use this to report missing hardware, plugin or unsupported browser
        ext._getStatus = function() {
            return {status: 2, msg: 'Ready'}
        }

        // Cache all incomming messages in queue the will be consumed by
        // "get message" block.
        ext.messages = []

        ext.connect = function (url) {
            log('connect to message server at URL ' + url)
            if (ext.socket) {
                log('already connected -> close old connection before')
                ext.socket.disconnect()
            }
            ext.socket = io(url, {forceNew: true})
            ext.socket.on('message', function(message) {
                log('server has send a new message "' + message + '" , add it to the queue')
                ext.messages.push(message)
            })
        }

        ext.send_message = function (message) {
            log('send message "' + message + '"')
            ext.socket.emit('message', message)
        }

        ext.queue_is_not_empty = function () {
            return ext.messages.length !== 0
        }

        ext.get_message = function () {
            if (ext.messages.length === 0) {
                log('get message ERROR: message queue is empty')
                return
            } else {
                var message = ext.messages.shift()
                log('get message "' + message + '"')
                return message
            }
        }

        ext.get_number_of_messages = function () {
            return ext.messages.length
        }

        // Block and block menu descriptions
        var descriptor = {
            blocks: [
                ['', 'connect to message server at URL %s', 'connect', 'https://simio-ogadaki.now.sh'],
                ['', 'send message %s', 'send_message', 'Hi!'],
                ['b', 'some message is available', 'queue_is_not_empty'],
                ['r', 'get message', 'get_message'],
                ['r', 'number of messages', 'get_number_of_messages'],
            ],
            url: 'http://ogadaki.github.io/scratchx/simio'
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
