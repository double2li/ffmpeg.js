var lib = null;

Module.onRuntimeInitialized = setTimeout.bind(self, function() {
    var transcode = avcodec.prototype.transcode;
    var AVCodec = function AVCodec() {
        avcodec.call(this);
    };
    AVCodec.prototype = Object.create(avcodec.prototype);
    AVCodec.prototype.constructor = AVCodec;

    AVCodec.prototype.transcode = function(a0, a1) {
        var res = -12;
        if (a0 instanceof ArrayBuffer) {
            a0 = new Uint8Array(a0);
        }

        var ptr = Module._malloc(a0.byteLength | 0);
        if (ptr) {
            Module.HEAPU8.set(a0, ptr);
            res = transcode.call(this, {ptr: ptr}, a1);
            Module._free(ptr);
        }

        return res;
    };

    Object.defineProperty(AVCodec.prototype, 'buf', {
        get: function() {
            var ptr = this.getBuffer();
            var len = this.getBufferLength();
            return Module.HEAPU8.slice(ptr, ptr + len);
        }
    });

    lib = new AVCodec();
    var res = lib.init();
    if (res) {
        throw new Error('Failed to initialize avcodec ('+res+')');
    }
    self.postMessage('ready');
    Module.onRuntimeInitialized = Module.run = false;
});

self.onmessage = function (ev) {
    console.info(ev);
    console.time('transcode');
    var res = lib.transcode(ev.data, ev.data.byteLength);
    console.timeEnd('transcode');
    if (res < 0) {
        throw new Error('Trascoding failed ('+res+')');
    }
    var buffer = lib.buf.buffer;
    self.postMessage(buffer, [buffer]);
};
