(function(ext) {
    // Cleanup function when the extension is unloaded
    ext._shutdown = function() {};

    // Status reporting code
    // Use this to report missing hardware, plugin or unsupported browser
    ext._getStatus = function() {
        return {status: 2, msg: 'Ready'};
    };

    ext.hello_world = function() {
        alert('hello world')
    };

    // Block and block menu descriptions
    var descriptor = {
        blocks: [
            // Block type, block name, function name
            [' ', 'hello world', 'hello_world'],
        ]
    };

    // Register the extension
    ScratchExtensions.register('Hello world extension', descriptor, ext);
})({});
