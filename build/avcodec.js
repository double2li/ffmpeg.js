function out(text) {
  console.log(text);
}

function err(text) {
  console.debug(text);
}

var lib = null, _main = setTimeout.bind(self, function() {
  function AVCodec() {
    avcodec.call(this);
  }
  var transcode = avcodec.prototype.transcode;
  ((AVCodec.prototype = Object.create(avcodec.prototype)).constructor = AVCodec).prototype.transcode = function(a0, a1) {
    var res = -12;
    a0 instanceof ArrayBuffer && (a0 = new Uint8Array(a0));
    var ptr = _malloc(0 | a0.byteLength);
    if (ptr) {
      HEAPU8.set(a0, ptr);
      res = transcode.call(this, {
        ptr: ptr
      }, a1);
      _free(ptr);
    }
    return res;
  };
  Object.defineProperty(AVCodec.prototype, "buf", {
    get: function() {
      var ptr = this.getBuffer(), len = this.getBufferLength();
      return HEAPU8.slice(ptr, ptr + len);
    }
  });
  var res = (lib = new AVCodec()).init();
  res && abort("Failed to initialize avcodec (" + res + ")");
  self.postMessage("ready");
}), db = [ null, "", "" ];

function dump(fd, ptr, len) {
  db[fd] += String.fromCharCode.apply(null, HEAPU8.subarray(ptr, ptr + len));
  if (0 <= db[fd].indexOf("\n")) {
    for (var s = db[fd].split("\n"), i = 0; i < s.length - 1; i++) (1 == fd ? out : err)(s[i]);
    db[fd] = s[s.length - 1];
  }
}

self.onmessage = function(ev) {
  console.info(ev);
  console.time("transcode");
  var res = lib.transcode(ev.data, ev.data.byteLength);
  console.timeEnd("transcode");
  res < 0 && abort("Trascoding failed (" + res + ")");
  var buffer = lib.buf.buffer;
  self.postMessage(buffer, [ buffer ]);
};

function abort(what) {
  throw new WebAssembly.RuntimeError(what);
}

var UTF8Decoder = new TextDecoder("utf8"), wasmMemory = new WebAssembly.Memory({
  initial: 4096,
  maximum: 4096
}), wasmTable = new WebAssembly.Table({
  initial: 2304,
  maximum: 2304,
  element: "anyfunc"
}), buffer = wasmMemory.buffer, HEAP32 = new Int32Array(buffer), HEAPU8 = new Uint8Array(buffer);

HEAP32[856864] = 7621920;

var _avcodec_0, _init_0, _transcode_2, _getBuffer_0, _getBufferLength_0, _status_0, _kill_0, ___destroy___0, _emscripten_bind_VoidPtr___destroy___0, _malloc, _free, Math_ceil = Math.ceil, Math_floor = Math.floor, imports = {
  a: {
    b: function ___powisf2() {
      err("missing function: __powisf2");
      abort(-1);
    },
    a: abort,
    h: function(a, b, c) {
      HEAPU8.copyWithin(a, b, b + c);
    },
    i: function _emscripten_resize_heap() {
      return !1;
    },
    j: function _fd_close() {
      try {
        return 0;
      } catch (e) {
        abort(e);
        return e.errno;
      }
    },
    e: function _fd_seek() {
      try {
        return 0;
      } catch (e) {
        abort(e);
        return e.errno;
      }
    },
    c: function _fd_write(fd, iov, iovcnt, pnum) {
      try {
        for (var num = 0, i = 0; i < iovcnt; i++) {
          var len = HEAP32[iov + (8 * i + 4) >> 2];
          dump(fd, HEAP32[iov + 8 * i >> 2], len);
          num += len;
        }
        HEAP32[pnum >> 2] = num;
        return 0;
      } catch (e) {
        abort(e);
        return e.errno;
      }
    },
    memory: wasmMemory,
    g: function _round(d) {
      return 0 <= (d = +d) ? +Math_floor(d + .5) : +Math_ceil(d - .5);
    },
    f: function _setTempRet0() {},
    table: wasmTable,
    d: function _time(ptr) {
      var ret = Date.now() / 1e3 | 0;
      ptr && (HEAP32[ptr >> 2] = ret);
      return ret;
    }
  }
};

WebAssembly.instantiateStreaming(fetch(("https:" == self.location.protocol ? "/" : "") + "avcodec.wasm"), imports).then(function(output) {
  var asm = output.instance ? output.instance.exports : output.exports;
  _avcodec_0 = asm.l;
  _init_0 = asm.m;
  _transcode_2 = asm.n;
  _getBuffer_0 = asm.o;
  _getBufferLength_0 = asm.p;
  _status_0 = asm.q;
  _kill_0 = asm.r;
  ___destroy___0 = asm.s;
  _emscripten_bind_VoidPtr___destroy___0 = asm.t;
  _malloc = asm.u;
  _free = asm.v;
  !function initRuntime(asm) {
    asm.k();
  }(asm);
  _main();
});

function WrapperObject() {}

(((WrapperObject.prototype = Object.create(WrapperObject.prototype)).constructor = WrapperObject).prototype.__class__ = WrapperObject).__cache__ = {};

function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}

!function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__), ret = cache[ptr];
  ret || (cache[(ret = Object.create((__class__ || WrapperObject).prototype)).ptr = ptr] = ret);
}(0);

function avcodec() {
  this.ptr = _avcodec_0();
  getCache(avcodec)[this.ptr] = this;
}

(((avcodec.prototype = Object.create(WrapperObject.prototype)).constructor = avcodec).prototype.__class__ = avcodec).__cache__ = {};

avcodec.prototype.init = avcodec.prototype.init = function() {
  return _init_0(this.ptr);
};

avcodec.prototype.transcode = avcodec.prototype.transcode = function(data, size) {
  data && "object" == typeof data && (data = data.ptr);
  size && "object" == typeof size && (size = size.ptr);
  return _transcode_2(this.ptr, data, size);
};

avcodec.prototype.getBuffer = avcodec.prototype.getBuffer = function() {
  return _getBuffer_0(this.ptr);
};

avcodec.prototype.getBufferLength = avcodec.prototype.getBufferLength = function() {
  return _getBufferLength_0(this.ptr);
};

avcodec.prototype.status = avcodec.prototype.status = function() {
  return function UTF8ToString(ptr, maxBytesToRead) {
    if (!ptr) return "";
    for (var maxPtr = ptr + maxBytesToRead, end = ptr; !(maxPtr <= end) && HEAPU8[end]; ) ++end;
    return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
  }(_status_0(this.ptr));
};

avcodec.prototype.kill = avcodec.prototype.kill = function() {
  _kill_0(this.ptr);
};

avcodec.prototype.__destroy__ = avcodec.prototype.__destroy__ = function() {
  ___destroy___0(this.ptr);
};

function VoidPtr() {
  throw "cannot construct a VoidPtr, no constructor in IDL";
}

(((VoidPtr.prototype = Object.create(WrapperObject.prototype)).constructor = VoidPtr).prototype.__class__ = VoidPtr).__cache__ = {};

VoidPtr.prototype.__destroy__ = VoidPtr.prototype.__destroy__ = function() {
  _emscripten_bind_VoidPtr___destroy___0(this.ptr);
};