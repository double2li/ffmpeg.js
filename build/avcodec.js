var Module = void 0 !== Module ? Module : {}, lib = null;

Module.onRuntimeInitialized = setTimeout.bind(self, function() {
  var transcode = avcodec.prototype.transcode, AVCodec = function() {
    avcodec.call(this);
  };
  AVCodec.prototype = Object.create(avcodec.prototype);
  (AVCodec.prototype.constructor = AVCodec).prototype.transcode = function(a0, a1) {
    var res = -12;
    a0 instanceof ArrayBuffer && (a0 = new Uint8Array(a0));
    var ptr = Module._malloc(0 | a0.byteLength);
    if (ptr) {
      Module.HEAPU8.set(a0, ptr);
      res = transcode.call(this, {
        ptr: ptr
      }, a1);
      Module._free(ptr);
    }
    return res;
  };
  Object.defineProperty(AVCodec.prototype, "buf", {
    get: function() {
      var ptr = this.getBuffer(), len = this.getBufferLength();
      return Module.HEAPU8.slice(ptr, ptr + len);
    }
  });
  var res = (lib = new AVCodec()).init();
  if (res) throw new Error("Failed to initialize avcodec (" + res + ")");
  self.postMessage("ready");
  Module.onRuntimeInitialized = Module.run = !1;
});

self.onmessage = function(ev) {
  console.info(ev);
  console.time("transcode");
  var res = lib.transcode(ev.data, ev.data.byteLength);
  console.timeEnd("transcode");
  if (res < 0) throw new Error("Trascoding failed (" + res + ")");
  var buffer = lib.buf.buffer;
  self.postMessage(buffer, [ buffer ]);
};

var key, moduleOverrides = {};

for (key in Module) Module.hasOwnProperty(key) && (moduleOverrides[key] = Module[key]);

var read_, readAsync, readBinary, setWindowTitle, arguments_ = [], thisProgram = "./this.program", quit_ = function(status, toThrow) {
  throw toThrow;
}, scriptDirectory = "";

function locateFile(path) {
  return Module.locateFile ? Module.locateFile(path, scriptDirectory) : scriptDirectory + path;
}

scriptDirectory = 0 !== (scriptDirectory = self.location.href).indexOf("blob:") ? scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1) : "";

read_ = function(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, !1);
  xhr.send(null);
  return xhr.responseText;
};

readBinary = function(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, !1);
  xhr.responseType = "arraybuffer";
  xhr.send(null);
  return new Uint8Array(xhr.response);
};

readAsync = function(url, onload, onerror) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, !0);
  xhr.responseType = "arraybuffer";
  xhr.onload = function() {
    200 == xhr.status || 0 == xhr.status && xhr.response ? onload(xhr.response) : onerror();
  };
  xhr.onerror = onerror;
  xhr.send(null);
};

setWindowTitle = function(title) {
  document.title = title;
};

var noExitRuntime, wasmMemory, out = Module.print || console.log.bind(console), err = Module.printErr || console.warn.bind(console);

for (key in moduleOverrides) moduleOverrides.hasOwnProperty(key) && (Module[key] = moduleOverrides[key]);

moduleOverrides = null;

Module.arguments && (arguments_ = Module.arguments);

Module.thisProgram && (thisProgram = Module.thisProgram);

Module.quit && (quit_ = Module.quit);

Module.noExitRuntime && (noExitRuntime = Module.noExitRuntime);

var wasmTable = new WebAssembly.Table({
  initial: 2304,
  maximum: 2304,
  element: "anyfunc"
}), ABORT = !1, EXITSTATUS = 0;

function assert(condition, text) {
  condition || abort("Assertion failed: " + text);
}

var UTF8Decoder = new TextDecoder("utf8");

function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  for (var endIdx = idx + maxBytesToRead, endPtr = idx; u8Array[endPtr] && !(endIdx <= endPtr); ) ++endPtr;
  return UTF8Decoder.decode(u8Array.subarray ? u8Array.subarray(idx, endPtr) : new Uint8Array(u8Array.slice(idx, endPtr)));
}

function UTF8ToString(ptr, maxBytesToRead) {
  if (!ptr) return "";
  for (var maxPtr = ptr + maxBytesToRead, end = ptr; !(maxPtr <= end) && HEAPU8[end]; ) ++end;
  return UTF8Decoder.decode(HEAPU8.subarray(ptr, end));
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64, UTF16Decoder = new TextDecoder("utf-16le"), WASM_PAGE_SIZE = 65536;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module.HEAP8 = HEAP8 = new Int8Array(buf);
  Module.HEAP16 = HEAP16 = new Int16Array(buf);
  Module.HEAP32 = HEAP32 = new Int32Array(buf);
  Module.HEAPU8 = HEAPU8 = new Uint8Array(buf);
  Module.HEAPU16 = HEAPU16 = new Uint16Array(buf);
  Module.HEAPU32 = HEAPU32 = new Uint32Array(buf);
  Module.HEAPF32 = HEAPF32 = new Float32Array(buf);
  Module.HEAPF64 = HEAPF64 = new Float64Array(buf);
}

var DYNAMIC_BASE = 7622896, DYNAMICTOP_PTR = 3428432, INITIAL_TOTAL_MEMORY = Module.TOTAL_MEMORY || 268435456;

(wasmMemory = Module.wasmMemory ? Module.wasmMemory : new WebAssembly.Memory({
  initial: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
  maximum: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
})) && (buffer = wasmMemory.buffer);

INITIAL_TOTAL_MEMORY = buffer.byteLength;

updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

function callRuntimeCallbacks(callbacks) {
  for (;0 < callbacks.length; ) {
    var callback = callbacks.shift();
    if ("function" != typeof callback) {
      var func = callback.func;
      "number" == typeof func ? void 0 === callback.arg ? Module.dynCall_v(func) : Module.dynCall_vi(func, callback.arg) : func(void 0 === callback.arg ? null : callback.arg);
    } else callback();
  }
}

var __ATPRERUN__ = [], __ATINIT__ = [], __ATMAIN__ = [], __ATPOSTRUN__ = [], runtimeInitialized = !1;

function preRun() {
  if (Module.preRun) {
    "function" == typeof Module.preRun && (Module.preRun = [ Module.preRun ]);
    for (;Module.preRun.length; ) addOnPreRun(Module.preRun.shift());
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  runtimeInitialized = !0;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
  if (Module.postRun) {
    "function" == typeof Module.postRun && (Module.postRun = [ Module.postRun ]);
    for (;Module.postRun.length; ) addOnPostRun(Module.postRun.shift());
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

var Math_ceil = Math.ceil, Math_floor = Math.floor, runDependencies = 0, runDependencyWatcher = null, dependenciesFulfilled = null;

function addRunDependency(id) {
  runDependencies++;
  Module.monitorRunDependencies && Module.monitorRunDependencies(runDependencies);
}

function removeRunDependency(id) {
  runDependencies--;
  Module.monitorRunDependencies && Module.monitorRunDependencies(runDependencies);
  if (0 == runDependencies) {
    if (null !== runDependencyWatcher) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

Module.preloadedImages = {};

Module.preloadedAudios = {};

function abort(what) {
  Module.onAbort && Module.onAbort(what);
  out(what += "");
  err(what);
  ABORT = !0;
  EXITSTATUS = 1;
  what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
  throw new WebAssembly.RuntimeError(what);
}

var WasmBinaryFile = "avcodec.wasm";

WasmBinaryFile = locateFile(WasmBinaryFile);

function createWasm() {
  var info = {
    a: asmLibraryArg
  };
  function receiveInstance(instance, module) {
    Module.asm = instance.exports;
    removeRunDependency("wasm-instantiate");
  }
  addRunDependency("wasm-instantiate");
  function receiveInstantiatedSource(output) {
    receiveInstance(output.instance);
  }
  function instantiateAsync() {
    fetch(WasmBinaryFile, {
      credentials: "same-origin"
    }).then(function(response) {
      return WebAssembly.instantiateStreaming(response, info).then(receiveInstantiatedSource, abort || 0);
    });
  }
  instantiateAsync();
  return {};
}

__ATINIT__.push({
  func: function() {
    ___wasm_call_ctors();
  }
});

function ___powisf2() {
  err("missing function: __powisf2");
  abort(-1);
}

function _abort() {
  abort();
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

function _time(ptr) {
  var ret = Date.now() / 1e3 | 0;
  ptr && (HEAP32[ptr >> 2] = ret);
  return ret;
}

var asmLibraryArg = {
  b: ___powisf2,
  a: _abort,
  e: function(a, b, c) {
    HEAPU8.copyWithin(a, b, b + c);
  },
  f: _emscripten_resize_heap,
  i: _fd_close,
  g: _fd_fdstat_get,
  j: _fd_seek,
  h: _fd_write,
  memory: wasmMemory,
  d: _round,
  table: wasmTable,
  c: _time
}, asm = createWasm();

Module.asm = asm;

var calledRun, ___wasm_call_ctors = Module.___wasm_call_ctors = function() {
  return (___wasm_call_ctors = Module.___wasm_call_ctors = Module.asm.k).apply(null, arguments);
}, _emscripten_bind_avcodec_avcodec_0 = Module._emscripten_bind_avcodec_avcodec_0 = function() {
  return (_emscripten_bind_avcodec_avcodec_0 = Module._emscripten_bind_avcodec_avcodec_0 = Module.asm.l).apply(null, arguments);
}, _emscripten_bind_avcodec_init_0 = Module._emscripten_bind_avcodec_init_0 = function() {
  return (_emscripten_bind_avcodec_init_0 = Module._emscripten_bind_avcodec_init_0 = Module.asm.m).apply(null, arguments);
}, _emscripten_bind_avcodec_transcode_2 = Module._emscripten_bind_avcodec_transcode_2 = function() {
  return (_emscripten_bind_avcodec_transcode_2 = Module._emscripten_bind_avcodec_transcode_2 = Module.asm.n).apply(null, arguments);
}, _emscripten_bind_avcodec_getBuffer_0 = Module._emscripten_bind_avcodec_getBuffer_0 = function() {
  return (_emscripten_bind_avcodec_getBuffer_0 = Module._emscripten_bind_avcodec_getBuffer_0 = Module.asm.o).apply(null, arguments);
}, _emscripten_bind_avcodec_getBufferLength_0 = Module._emscripten_bind_avcodec_getBufferLength_0 = function() {
  return (_emscripten_bind_avcodec_getBufferLength_0 = Module._emscripten_bind_avcodec_getBufferLength_0 = Module.asm.p).apply(null, arguments);
}, _emscripten_bind_avcodec_status_0 = Module._emscripten_bind_avcodec_status_0 = function() {
  return (_emscripten_bind_avcodec_status_0 = Module._emscripten_bind_avcodec_status_0 = Module.asm.q).apply(null, arguments);
}, _emscripten_bind_avcodec_kill_0 = Module._emscripten_bind_avcodec_kill_0 = function() {
  return (_emscripten_bind_avcodec_kill_0 = Module._emscripten_bind_avcodec_kill_0 = Module.asm.r).apply(null, arguments);
}, _emscripten_bind_avcodec___destroy___0 = Module._emscripten_bind_avcodec___destroy___0 = function() {
  return (_emscripten_bind_avcodec___destroy___0 = Module._emscripten_bind_avcodec___destroy___0 = Module.asm.s).apply(null, arguments);
}, _emscripten_bind_VoidPtr___destroy___0 = Module._emscripten_bind_VoidPtr___destroy___0 = function() {
  return (_emscripten_bind_VoidPtr___destroy___0 = Module._emscripten_bind_VoidPtr___destroy___0 = Module.asm.t).apply(null, arguments);
}, _malloc = Module._malloc = function() {
  return (_malloc = Module._malloc = Module.asm.u).apply(null, arguments);
}, _free = Module._free = function() {
  return (_free = Module._free = Module.asm.v).apply(null, arguments);
}, dynCall_vi = Module.dynCall_vi = function() {
  return (dynCall_vi = Module.dynCall_vi = Module.asm.w).apply(null, arguments);
}, dynCall_v = Module.dynCall_v = function() {
  return (dynCall_v = Module.dynCall_v = Module.asm.x).apply(null, arguments);
};

Module.asm = asm;

dependenciesFulfilled = function runCaller() {
  calledRun || run();
  calledRun || (dependenciesFulfilled = runCaller);
};

function run(args) {
  if (!(0 < runDependencies)) {
    preRun();
    if (!(0 < runDependencies)) if (Module.setStatus) {
      Module.setStatus("Running...");
      setTimeout(function() {
        setTimeout(function() {
          Module.setStatus("");
        }, 1);
        doRun();
      }, 1);
    } else doRun();
  }
  function doRun() {
    if (!calledRun) {
      calledRun = !0;
      if (!ABORT) {
        initRuntime();
        preMain();
        Module.onRuntimeInitialized && Module.onRuntimeInitialized();
        postRun();
      }
    }
  }
}

Module.run = run;

if (Module.preInit) {
  "function" == typeof Module.preInit && (Module.preInit = [ Module.preInit ]);
  for (;0 < Module.preInit.length; ) Module.preInit.pop()();
}

noExitRuntime = !0;

run();

function WrapperObject() {}

WrapperObject.prototype = Object.create(WrapperObject.prototype);

((WrapperObject.prototype.constructor = WrapperObject).prototype.__class__ = WrapperObject).__cache__ = {};

Module.WrapperObject = WrapperObject;

function getCache(__class__) {
  return (__class__ || WrapperObject).__cache__;
}

Module.getCache = getCache;

function wrapPointer(ptr, __class__) {
  var cache = getCache(__class__), ret = cache[ptr];
  return ret || (cache[(ret = Object.create((__class__ || WrapperObject).prototype)).ptr = ptr] = ret);
}

Module.wrapPointer = wrapPointer;

function castObject(obj, __class__) {
  return wrapPointer(obj.ptr, __class__);
}

Module.castObject = castObject;

Module.NULL = wrapPointer(0);

function destroy(obj) {
  if (!obj.__destroy__) throw "Error: Cannot destroy object. (Did you create it yourself?)";
  obj.__destroy__();
  delete getCache(obj.__class__)[obj.ptr];
}

Module.destroy = destroy;

function compare(obj1, obj2) {
  return obj1.ptr === obj2.ptr;
}

Module.compare = compare;

function getPointer(obj) {
  return obj.ptr;
}

Module.getPointer = getPointer;

function getClass(obj) {
  return obj.__class__;
}

Module.getClass = getClass;

function avcodec() {
  this.ptr = _emscripten_bind_avcodec_avcodec_0();
  getCache(avcodec)[this.ptr] = this;
}

avcodec.prototype = Object.create(WrapperObject.prototype);

((avcodec.prototype.constructor = avcodec).prototype.__class__ = avcodec).__cache__ = {};

(Module.avcodec = avcodec).prototype.init = avcodec.prototype.init = function() {
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

(Module.VoidPtr = VoidPtr).prototype.__destroy__ = VoidPtr.prototype.__destroy__ = function() {
  _emscripten_bind_VoidPtr___destroy___0(this.ptr);
};

!function() {
  function setupEnums() {}
  runtimeInitialized ? setupEnums() : addOnPreMain(setupEnums);
}();