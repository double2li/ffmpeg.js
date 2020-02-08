var Module = {};

function out(text) {
  console.log(text);
}

function err(text) {
  console.debug(text);
}

function ready() {
  run();
}

var lib = null, _main = setTimeout.bind(self, function() {
  var transcode = avcodec.prototype.transcode, AVCodec = function() {
    avcodec.call(this);
  };
  AVCodec.prototype = Object.create(avcodec.prototype);
  (AVCodec.prototype.constructor = AVCodec).prototype.transcode = function(a0, a1) {
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
});

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

var tempRet0 = 0, setTempRet0 = function(value) {
  tempRet0 = value;
}, UTF8Decoder = new TextDecoder("utf8");

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  for (var endIdx = idx + maxBytesToRead, endPtr = idx; u8Array[endPtr] && !(endIdx <= endPtr); ) ++endPtr;
  return UTF8Decoder.decode(u8Array.subarray ? u8Array.subarray(idx, endPtr) : new Uint8Array(u8Array.slice(idx, endPtr)));
}

function UTF8ToString(ptr, maxBytesToRead) {
  if (!ptr) return "";
  for (var maxPtr = ptr + maxBytesToRead, end = ptr; !(maxPtr <= end) && HEAPU8[end]; ) ++end;
  return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
}

var DYNAMICTOP_PTR = 3428432, wasmMaximumMemory = 268435456, wasmMemory = new WebAssembly.Memory({
  initial: 4096,
  maximum: wasmMaximumMemory >> 16
}), wasmTable = new WebAssembly.Table({
  initial: 2304,
  maximum: 2304,
  element: "anyfunc"
}), buffer = wasmMemory.buffer, HEAP8 = new Int8Array(buffer), HEAP16 = new Int16Array(buffer), HEAP32 = new Int32Array(buffer), HEAPU8 = new Uint8Array(buffer), HEAPU16 = new Uint16Array(buffer), HEAPU32 = new Uint32Array(buffer), HEAPF32 = new Float32Array(buffer), HEAPF64 = new Float64Array(buffer);

HEAP32[DYNAMICTOP_PTR >> 2] = 7622896;

var Math_ceil = Math.ceil, Math_floor = Math.floor;

function ___powisf2() {
  err("missing function: __powisf2");
  abort(-1);
}

function _emscripten_resize_heap(requestedSize) {
  return !1;
}

var SYSCALLS = {
  buffers: [ null, [], [] ],
  printChar: function(stream, curr) {
    var buffer = SYSCALLS.buffers[stream];
    if (0 === curr || 10 === curr) {
      (1 === stream ? out : err)(UTF8ArrayToString(buffer, 0));
      buffer.length = 0;
    } else buffer.push(curr);
  },
  varargs: 0,
  get: function(varargs) {
    SYSCALLS.varargs += 4;
    return HEAP32[SYSCALLS.varargs - 4 >> 2];
  },
  getStr: function() {
    return UTF8ToString(SYSCALLS.get());
  },
  get64: function() {
    var low = SYSCALLS.get();
    SYSCALLS.get();
    return low;
  },
  getZero: function() {
    SYSCALLS.get();
  }
};

function _fd_close(fd) {
  try {
    return 0;
  } catch (e) {
    abort(e);
    return e.errno;
  }
}

function _fd_fdstat_get(fd, pbuf) {
  try {
    HEAP8[pbuf >> 0] = 2;
    return 0;
  } catch (e) {
    abort(e);
    return e.errno;
  }
}

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  try {
    return 0;
  } catch (e) {
    abort(e);
    return e.errno;
  }
}

function _fd_write(fd, iov, iovcnt, pnum) {
  try {
    for (var num = 0, i = 0; i < iovcnt; i++) {
      for (var ptr = HEAP32[iov + 8 * i >> 2], len = HEAP32[iov + (8 * i + 4) >> 2], j = 0; j < len; j++) SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
      num += len;
    }
    HEAP32[pnum >> 2] = num;
    return 0;
  } catch (e) {
    abort(e);
    return e.errno;
  }
}

function _round(d) {
  return 0 <= (d = +d) ? +Math_floor(d + .5) : +Math_ceil(d - .5);
}

function _setTempRet0($i) {
  setTempRet0(0 | $i);
}

function _time(ptr) {
  var ret = Date.now() / 1e3 | 0;
  ptr && (HEAP32[ptr >> 2] = ret);
  return ret;
}

var asmLibraryArg = {
  b: ___powisf2,
  a: abort,
  f: function(a, b, c) {
    HEAPU8.copyWithin(a, b, b + c);
  },
  g: _emscripten_resize_heap,
  j: _fd_close,
  h: _fd_fdstat_get,
  k: _fd_seek,
  i: _fd_write,
  memory: wasmMemory,
  e: _round,
  d: _setTempRet0,
  table: wasmTable,
  c: _time
};

function run() {
  _main();
}

function initRuntime(asm) {
  asm.l();
}

var _emscripten_bind_avcodec_avcodec_0, _emscripten_bind_avcodec_init_0, _emscripten_bind_avcodec_transcode_2, _emscripten_bind_avcodec_getBuffer_0, _emscripten_bind_avcodec_getBufferLength_0, _emscripten_bind_avcodec_status_0, _emscripten_bind_avcodec_kill_0, _emscripten_bind_avcodec___destroy___0, _emscripten_bind_VoidPtr___destroy___0, _malloc, _free, _memalign, _emscripten_builtin_free, _emscripten_builtin_memalign, stackSave, stackAlloc, stackRestore, __growWasmMemory, imports = {
  a: asmLibraryArg
};

WebAssembly.instantiateStreaming(fetch(("https:" == self.location.protocol ? "/" : "") + "avcodec.wasm"), imports).then(function(output) {
  var asm = output.instance ? output.instance.exports : output.exports;
  _emscripten_bind_avcodec_avcodec_0 = asm.m;
  _emscripten_bind_avcodec_init_0 = asm.n;
  _emscripten_bind_avcodec_transcode_2 = asm.o;
  _emscripten_bind_avcodec_getBuffer_0 = asm.p;
  _emscripten_bind_avcodec_getBufferLength_0 = asm.q;
  _emscripten_bind_avcodec_status_0 = asm.r;
  _emscripten_bind_avcodec_kill_0 = asm.s;
  _emscripten_bind_avcodec___destroy___0 = asm.t;
  _emscripten_bind_VoidPtr___destroy___0 = asm.u;
  _malloc = asm.v;
  _free = asm.w;
  _memalign = asm.x;
  _emscripten_builtin_free = asm.y;
  _emscripten_builtin_memalign = asm.z;
  stackSave = asm.A;
  stackAlloc = asm.B;
  stackRestore = asm.C;
  __growWasmMemory = asm.D;
  initRuntime(asm);
  ready();
});

function WrapperObject() {}

WrapperObject.prototype = Object.create(WrapperObject.prototype);

((WrapperObject.prototype.constructor = WrapperObject).prototype.__class__ = WrapperObject).__cache__ = {};

function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}

function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__), ret = cache[ptr];
  return ret || (cache[(ret = Object.create((__class__ || WrapperObject).prototype)).ptr = ptr] = ret);
}

function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}

wrapPointer(0);

function destroy(obj) {
  if (!obj.__destroy__) throw "Error: Cannot destroy object. (Did you create it yourself?)";
  obj.__destroy__();
  delete getCache(obj.__class__)[obj.ptr];
}

function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}

function getPointer(obj) {
  return obj.ptr;
}

function getClass(obj) {
  return obj.__class__;
}

function avcodec() {
  this.ptr = _emscripten_bind_avcodec_avcodec_0();
  getCache(avcodec)[this.ptr] = this;
}

avcodec.prototype = Object.create(WrapperObject.prototype);

((avcodec.prototype.constructor = avcodec).prototype.__class__ = avcodec).__cache__ = {};

avcodec.prototype.init = avcodec.prototype.init = function() {
  return _emscripten_bind_avcodec_init_0(this.ptr);
};

avcodec.prototype.transcode = avcodec.prototype.transcode = function(data, size) {
  data && "object" == typeof data && (data = data.ptr);
  size && "object" == typeof size && (size = size.ptr);
  return _emscripten_bind_avcodec_transcode_2(this.ptr, data, size);
};

avcodec.prototype.getBuffer = avcodec.prototype.getBuffer = function() {
  return _emscripten_bind_avcodec_getBuffer_0(this.ptr);
};

avcodec.prototype.getBufferLength = avcodec.prototype.getBufferLength = function() {
  return _emscripten_bind_avcodec_getBufferLength_0(this.ptr);
};

avcodec.prototype.status = avcodec.prototype.status = function() {
  return UTF8ToString(_emscripten_bind_avcodec_status_0(this.ptr));
};

avcodec.prototype.kill = avcodec.prototype.kill = function() {
  _emscripten_bind_avcodec_kill_0(this.ptr);
};

avcodec.prototype.__destroy__ = avcodec.prototype.__destroy__ = function() {
  _emscripten_bind_avcodec___destroy___0(this.ptr);
};

function VoidPtr() {
  throw "cannot construct a VoidPtr, no constructor in IDL";
}

VoidPtr.prototype = Object.create(WrapperObject.prototype);

((VoidPtr.prototype.constructor = VoidPtr).prototype.__class__ = VoidPtr).__cache__ = {};

VoidPtr.prototype.__destroy__ = VoidPtr.prototype.__destroy__ = function() {
  _emscripten_bind_VoidPtr___destroy___0(this.ptr);
};