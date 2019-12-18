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

Module.arguments = [];

Module.thisProgram = "./this.program";

Module.quit = function(status, toThrow) {
  throw toThrow;
};

Module.preRun = [];

var ENVIRONMENT_IS_WEB = !(Module.postRun = []), ENVIRONMENT_IS_WORKER = !0, scriptDirectory = "";

function locateFile(path) {
  return Module.locateFile ? Module.locateFile(path, scriptDirectory) : scriptDirectory + path;
}

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  ENVIRONMENT_IS_WORKER ? scriptDirectory = self.location.href : document.currentScript && (scriptDirectory = document.currentScript.src);
  scriptDirectory = 0 !== scriptDirectory.indexOf("blob:") ? scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1) : "";
  Module.read = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, !1);
    xhr.send(null);
    return xhr.responseText;
  };
  ENVIRONMENT_IS_WORKER && (Module.readBinary = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, !1);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
  });
  Module.readAsync = function(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, !0);
    xhr.responseType = "arraybuffer";
    xhr.onload = function() {
      200 == xhr.status || 0 == xhr.status && xhr.response ? onload(xhr.response) : onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };
  Module.setWindowTitle = function(title) {
    document.title = title;
  };
}

var out = Module.print || ("undefined" != typeof console ? console.log.bind(console) : "undefined" != typeof print ? print : null), err = Module.printErr || ("undefined" != typeof printErr ? printErr : "undefined" != typeof console && console.warn.bind(console) || out);

for (key in moduleOverrides) moduleOverrides.hasOwnProperty(key) && (Module[key] = moduleOverrides[key]);

moduleOverrides = void 0;

var wasmMemory, wasmTable, asm2wasmImports = {
  "f64-rem": function(x, y) {
    return x % y;
  },
  debugger: function() {}
}, functionPointers = new Array(0);

"object" != typeof WebAssembly && err("no native wasm support detected");

var ABORT = !1, EXITSTATUS = 0;

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

function updateGlobalBufferViews() {
  Module.HEAP8 = HEAP8 = new Int8Array(buffer);
  Module.HEAP16 = HEAP16 = new Int16Array(buffer);
  Module.HEAP32 = HEAP32 = new Int32Array(buffer);
  Module.HEAPU8 = HEAPU8 = new Uint8Array(buffer);
  Module.HEAPU16 = HEAPU16 = new Uint16Array(buffer);
  Module.HEAPU32 = HEAPU32 = new Uint32Array(buffer);
  Module.HEAPF32 = HEAPF32 = new Float32Array(buffer);
  Module.HEAPF64 = HEAPF64 = new Float64Array(buffer);
}

var DYNAMIC_BASE = 7608784, DYNAMICTOP_PTR = 3414448, TOTAL_STACK = 4194304, INITIAL_TOTAL_MEMORY = Module.TOTAL_MEMORY || 268435456;

INITIAL_TOTAL_MEMORY < TOTAL_STACK && err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

if (Module.buffer) buffer = Module.buffer; else if ("object" == typeof WebAssembly && "function" == typeof WebAssembly.Memory) {
  wasmMemory = new WebAssembly.Memory({
    initial: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE,
    maximum: INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
  });
  buffer = wasmMemory.buffer;
} else buffer = new ArrayBuffer(INITIAL_TOTAL_MEMORY);

updateGlobalBufferViews();

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

function ensureInitRuntime() {
  if (!runtimeInitialized) {
    runtimeInitialized = !0;
    callRuntimeCallbacks(__ATINIT__);
  }
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

var Math_abs = Math.abs, Math_trunc = Math.trunc, runDependencies = 0, runDependencyWatcher = null, dependenciesFulfilled = null;

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

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
  return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : 0 === filename.indexOf(dataURIPrefix);
}

var wasmBinaryFile = "avcodec.wasm";

isDataURI(wasmBinaryFile) || (wasmBinaryFile = locateFile(wasmBinaryFile));

function getBinary() {
  try {
    if (Module.wasmBinary) return new Uint8Array(Module.wasmBinary);
    if (Module.readBinary) return Module.readBinary(wasmBinaryFile);
    throw "both async and sync fetching of the wasm failed";
  } catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  return Module.wasmBinary || !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER || "function" != typeof fetch ? new Promise(function(resolve, reject) {
    resolve(getBinary());
  }) : fetch(wasmBinaryFile, {
    credentials: "same-origin"
  }).then(function(response) {
    if (!response.ok) throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    return response.arrayBuffer();
  }).catch(function() {
    return getBinary();
  });
}

function createWasm(env) {
  var info = {
    env: env,
    global: {
      NaN: NaN,
      Infinity: 1 / 0
    },
    "global.Math": Math,
    asm2wasm: asm2wasmImports
  };
  function receiveInstance(instance, module) {
    Module.asm = instance.exports;
    removeRunDependency("wasm-instantiate");
  }
  addRunDependency("wasm-instantiate");
  if (Module.instantiateWasm) try {
    return Module.instantiateWasm(info, receiveInstance);
  } catch (e) {
    err("Module.instantiateWasm callback failed with error: " + e);
    return !1;
  }
  function receiveInstantiatedSource(output) {
    receiveInstance(output.instance);
  }
  function instantiateArrayBuffer(receiver) {
    getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err("failed to asynchronously prepare wasm: " + reason);
      abort(reason);
    });
  }
  Module.wasmBinary || "function" != typeof WebAssembly.instantiateStreaming || isDataURI(wasmBinaryFile) || "function" != typeof fetch ? instantiateArrayBuffer(receiveInstantiatedSource) : WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, {
    credentials: "same-origin"
  }), info).then(receiveInstantiatedSource, function(reason) {
    err("wasm streaming compile failed: " + reason);
    err("falling back to ArrayBuffer instantiation");
    instantiateArrayBuffer(receiveInstantiatedSource);
  });
  return {};
}

Module.asm = function(global, env, providedBuffer) {
  env.memory = wasmMemory;
  env.table = wasmTable = new WebAssembly.Table({
    initial: 2771,
    maximum: 2771,
    element: "anyfunc"
  });
  env.__memory_base = 1024;
  env.__table_base = 0;
  return createWasm(env);
};

var PATH = {
  splitPath: function(filename) {
    return /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(filename).slice(1);
  },
  normalizeArray: function(parts, allowAboveRoot) {
    for (var up = 0, i = parts.length - 1; 0 <= i; i--) {
      var last = parts[i];
      if ("." === last) parts.splice(i, 1); else if (".." === last) {
        parts.splice(i, 1);
        up++;
      } else if (up) {
        parts.splice(i, 1);
        up--;
      }
    }
    if (allowAboveRoot) for (;up; up--) parts.unshift("..");
    return parts;
  },
  normalize: function(path) {
    var isAbsolute = "/" === path.charAt(0), trailingSlash = "/" === path.substr(-1);
    (path = PATH.normalizeArray(path.split("/").filter(function(p) {
      return !!p;
    }), !isAbsolute).join("/")) || isAbsolute || (path = ".");
    path && trailingSlash && (path += "/");
    return (isAbsolute ? "/" : "") + path;
  },
  dirname: function(path) {
    var result = PATH.splitPath(path), root = result[0], dir = result[1];
    return root || dir ? root + (dir = dir && dir.substr(0, dir.length - 1)) : ".";
  },
  basename: function(path) {
    if ("/" === path) return "/";
    var lastSlash = path.lastIndexOf("/");
    return -1 === lastSlash ? path : path.substr(lastSlash + 1);
  },
  extname: function(path) {
    return PATH.splitPath(path)[3];
  },
  join: function() {
    var paths = Array.prototype.slice.call(arguments, 0);
    return PATH.normalize(paths.join("/"));
  },
  join2: function(l, r) {
    return PATH.normalize(l + "/" + r);
  }
}, SYSCALLS = {
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

function ___syscall140(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    SYSCALLS.getStreamFromFD(), SYSCALLS.get(), SYSCALLS.get(), SYSCALLS.get(), SYSCALLS.get();
    return 0;
  } catch (e) {
    "undefined" != typeof FS && e instanceof FS.ErrnoError || abort(e);
    return -e.errno;
  }
}

function ___syscall146(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    for (var stream = SYSCALLS.get(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get(), ret = 0, i = 0; i < iovcnt; i++) {
      for (var ptr = HEAP32[iov + 8 * i >> 2], len = HEAP32[iov + (8 * i + 4) >> 2], j = 0; j < len; j++) SYSCALLS.printChar(stream, HEAPU8[ptr + j]);
      ret += len;
    }
    return ret;
  } catch (e) {
    "undefined" != typeof FS && e instanceof FS.ErrnoError || abort(e);
    return -e.errno;
  }
}

function ___syscall54(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    return 0;
  } catch (e) {
    "undefined" != typeof FS && e instanceof FS.ErrnoError || abort(e);
    return -e.errno;
  }
}

function ___syscall6(which, varargs) {
  SYSCALLS.varargs = varargs;
  try {
    SYSCALLS.getStreamFromFD();
    return 0;
  } catch (e) {
    "undefined" != typeof FS && e instanceof FS.ErrnoError || abort(e);
    return -e.errno;
  }
}

function _abort() {
  Module.abort();
}

function _emscripten_get_heap_size() {
  return HEAP8.length;
}

function _emscripten_resize_heap(requestedSize) {
  return !1;
}

var _fabs = Math_abs;

function _llvm_exp2_f32(x) {
  return Math.pow(2, x);
}

function _llvm_exp2_f64(a0) {
  return _llvm_exp2_f32(a0);
}

function _llvm_log10_f32(x) {
  return Math.log(x) / Math.LN10;
}

function _llvm_log10_f64(a0) {
  return _llvm_log10_f32(a0);
}

function _llvm_log2_f32(x) {
  return Math.log(x) / Math.LN2;
}

function _llvm_stackrestore(p) {
  var ret = _llvm_stacksave.LLVM_SAVEDSTACKS[p];
  _llvm_stacksave.LLVM_SAVEDSTACKS.splice(p, 1);
  stackRestore(ret);
}

function _llvm_stacksave() {
  var self = _llvm_stacksave;
  self.LLVM_SAVEDSTACKS || (self.LLVM_SAVEDSTACKS = []);
  self.LLVM_SAVEDSTACKS.push(stackSave());
  return self.LLVM_SAVEDSTACKS.length - 1;
}

var _llvm_trunc_f64 = Math_trunc;

function ___setErrNo(value) {
  Module.___errno_location && (HEAP32[Module.___errno_location() >> 2] = value);
  return value;
}

function _time(ptr) {
  var ret = Date.now() / 1e3 | 0;
  ptr && (HEAP32[ptr >> 2] = ret);
  return ret;
}

var asmGlobalArg = {}, asmLibraryArg = {
  b: abort,
  m: ___setErrNo,
  r: ___syscall140,
  k: ___syscall146,
  j: ___syscall54,
  q: ___syscall6,
  e: _abort,
  p: _emscripten_get_heap_size,
  o: function(a, b, c) {
    HEAPU8.copyWithin(a, b, b + c);
  },
  n: _emscripten_resize_heap,
  t: _fabs,
  h: _llvm_exp2_f32,
  g: _llvm_exp2_f64,
  f: _llvm_log10_f64,
  i: _llvm_log2_f32,
  c: _llvm_stackrestore,
  d: _llvm_stacksave,
  s: _llvm_trunc_f64,
  l: _time,
  a: DYNAMICTOP_PTR
}, asm = Module.asm(asmGlobalArg, asmLibraryArg, buffer);

Module.asm = asm;

var _emscripten_bind_VoidPtr___destroy___0 = Module._emscripten_bind_VoidPtr___destroy___0 = function() {
  return Module.asm.u.apply(null, arguments);
}, _emscripten_bind_avcodec___destroy___0 = Module._emscripten_bind_avcodec___destroy___0 = function() {
  return Module.asm.v.apply(null, arguments);
}, _emscripten_bind_avcodec_avcodec_0 = Module._emscripten_bind_avcodec_avcodec_0 = function() {
  return Module.asm.w.apply(null, arguments);
}, _emscripten_bind_avcodec_getBufferLength_0 = Module._emscripten_bind_avcodec_getBufferLength_0 = function() {
  return Module.asm.x.apply(null, arguments);
}, _emscripten_bind_avcodec_getBuffer_0 = Module._emscripten_bind_avcodec_getBuffer_0 = function() {
  return Module.asm.y.apply(null, arguments);
}, _emscripten_bind_avcodec_init_0 = Module._emscripten_bind_avcodec_init_0 = function() {
  return Module.asm.z.apply(null, arguments);
}, _emscripten_bind_avcodec_kill_0 = Module._emscripten_bind_avcodec_kill_0 = function() {
  return Module.asm.A.apply(null, arguments);
}, _emscripten_bind_avcodec_status_0 = Module._emscripten_bind_avcodec_status_0 = function() {
  return Module.asm.B.apply(null, arguments);
}, _emscripten_bind_avcodec_transcode_2 = Module._emscripten_bind_avcodec_transcode_2 = function() {
  return Module.asm.C.apply(null, arguments);
}, _free = Module._free = function() {
  return Module.asm.D.apply(null, arguments);
}, _malloc = Module._malloc = function() {
  return Module.asm.E.apply(null, arguments);
}, stackRestore = Module.stackRestore = function() {
  return Module.asm.H.apply(null, arguments);
}, stackSave = Module.stackSave = function() {
  return Module.asm.I.apply(null, arguments);
}, dynCall_v = Module.dynCall_v = function() {
  return Module.asm.F.apply(null, arguments);
}, dynCall_vi = Module.dynCall_vi = function() {
  return Module.asm.G.apply(null, arguments);
};

Module.asm = asm;

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

ExitStatus.prototype = new Error();

ExitStatus.prototype.constructor = ExitStatus;

dependenciesFulfilled = function runCaller() {
  Module.calledRun || run();
  Module.calledRun || (dependenciesFulfilled = runCaller);
};

function run(args) {
  if (!(0 < runDependencies)) {
    preRun();
    if (!(0 < runDependencies || Module.calledRun)) if (Module.setStatus) {
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
    if (!Module.calledRun) {
      Module.calledRun = !0;
      if (!ABORT) {
        ensureInitRuntime();
        preMain();
        Module.onRuntimeInitialized && Module.onRuntimeInitialized();
        postRun();
      }
    }
  }
}

Module.run = run;

function abort(what) {
  Module.onAbort && Module.onAbort(what);
  if (void 0 !== what) {
    out(what);
    err(what);
    what = JSON.stringify(what);
  } else what = "";
  ABORT = !0;
  EXITSTATUS = 1;
  throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
}

Module.abort = abort;

if (Module.preInit) {
  "function" == typeof Module.preInit && (Module.preInit = [ Module.preInit ]);
  for (;0 < Module.preInit.length; ) Module.preInit.pop()();
}

Module.noExitRuntime = !0;

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

avcodec.prototype.transcode = avcodec.prototype.transcode = function(arg0, arg1) {
  arg0 && "object" == typeof arg0 && (arg0 = arg0.ptr);
  arg1 && "object" == typeof arg1 && (arg1 = arg1.ptr);
  return _emscripten_bind_avcodec_transcode_2(this.ptr, arg0, arg1);
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