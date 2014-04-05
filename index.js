// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  Module['arguments'] = process['argv'].slice(2);

  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  this['Module'] = Module;

  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Auto-generated preamble library stuff ===

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?\{ ?[^}]* ?\}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_ && type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    code = Pointer_stringify(code);
    if (code[0] === '"') {
      // tolerate EM_ASM("..code..") even though EM_ASM(..code..) is correct
      if (code.indexOf('"', 1) === code.length-1) {
        code = code.substr(1, code.length-2);
      } else {
        // something invalid happened, e.g. EM_ASM("..code($0)..", input)
        abort('invalid EM_ASM input |' + code + '|. Please use EM_ASM(..code..) (no quotes) or EM_ASM({ ..code($0).. }, input) (to input values)');
      }
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + code + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;

      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }

      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }

      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}


Module['Runtime'] = Runtime;









//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}

// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;

// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;

// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module['allocate'] = allocate;

function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }

  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;

// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;

function demangle(func) {
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    return rawList ? list : ret + flushList();
  }
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    return parse();
  } catch(e) {
    return func;
  }
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}

// Memory management

var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk

function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}

var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;

var totalMemory = 4096;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be more reasonable');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;

function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;

// Tools

// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;

// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}

// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


var memoryInitializer = null;

// === Body ===



STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 14392;



var _stdout;
var _stdout=_stdout=allocate(1, "i32*", ALLOC_STATIC);
var _stdin;
var _stdin=_stdin=allocate(1, "i32*", ALLOC_STATIC);
var _stderr;
var _stderr=_stderr=allocate(1, "i32*", ALLOC_STATIC);



/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } },{ func: function() { __GLOBAL__I_a() } });







































































































































































































































var ___dso_handle;
var ___dso_handle=___dso_handle=allocate(1, "i32*", ALLOC_STATIC);








































































































































var __ZTVN10__cxxabiv120__si_class_type_infoE;
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,224,38,0,0,240,0,0,0,130,0,0,0,68,0,0,0,150,0,0,0,8,0,0,0,10,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
var __ZTVN10__cxxabiv117__class_type_infoE;
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,240,38,0,0,240,0,0,0,236,0,0,0,68,0,0,0,150,0,0,0,8,0,0,0,26,0,0,0,4,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);;
































































































































































var __ZTISt9exception;
var __ZTISt9exception=__ZTISt9exception=allocate([allocate([1,0,0,0,0,0,0], "i8", ALLOC_STATIC)+8, 0], "i32", ALLOC_STATIC);









































































































































































































































































































var __ZNSt13runtime_errorC1EPKc;
var __ZNSt13runtime_errorD1Ev;
var __ZNSt12length_errorD1Ev;
var __ZNSt3__16localeC1Ev;
var __ZNSt3__16localeC1ERKS0_;
var __ZNSt3__16localeD1Ev;
var __ZNSt8bad_castC1Ev;
var __ZNSt8bad_castD1Ev;
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,95,112,137,0,255,9,47,15,10,0,0,0,100,0,0,0,232,3,0,0,16,39,0,0,160,134,1,0,64,66,15,0,128,150,152,0,0,225,245,5,2,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,68,101,99,0,0,0,0,0,78,111,118,0,0,0,0,0,79,99,116,0,0,0,0,0,83,101,112,0,0,0,0,0,67,0,0,0,0,0,0,0,65,117,103,0,0,0,0,0,74,117,108,0,0,0,0,0,74,117,110,0,0,0,0,0,117,110,115,117,112,112,111,114,116,101,100,32,108,111,99,97,108,101,32,102,111,114,32,115,116,97,110,100,97,114,100,32,105,110,112,117,116,0,0,0,65,112,114,0,0,0,0,0,77,97,114,0,0,0,0,0,70,101,98,0,0,0,0,0,74,97,110,0,0,0,0,0,68,101,99,101,109,98,101,114,0,0,0,0,0,0,0,0,78,111,118,101,109,98,101,114,0,0,0,0,0,0,0,0,79,99,116,111,98,101,114,0,118,101,99,116,111,114,0,0,83,101,112,116,101,109,98,101,114,0,0,0,0,0,0,0,65,117,103,117,115,116,0,0,98,97,115,105,99,95,115,116,114,105,110,103,0,0,0,0,74,117,108,121,0,0,0,0,74,117,110,101,0,0,0,0,77,97,121,0,0,0,0,0,65,112,114,105,108,0,0,0,77,97,114,99,104,0,0,0,70,101,98,114,117,97,114,121,0,0,0,0,0,0,0,0,74,97,110,117,97,114,121,0,37,46,48,76,102,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,105,110,102,105,110,105,116,121,0,0,0,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,0,0,0,0,109,111,110,101,121,95,103,101,116,32,101,114,114,111,114,0,70,0,0,0,101,0,0,0,98,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,0,0,0,0,68,0,0,0,101,0,0,0,99,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,78,0,0,0,111,0,0,0,118,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,0,0,0,0,79,0,0,0,99,0,0,0,116,0,0,0,111,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,83,0,0,0,101,0,0,0,112,0,0,0,116,0,0,0,101,0,0,0,109,0,0,0,98,0,0,0,101,0,0,0,114,0,0,0,0,0,0,0,65,0,0,0,117,0,0,0,103,0,0,0,117,0,0,0,115,0,0,0,116,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,108,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,117,0,0,0,110,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,37,76,102,0,0,0,0,0,65,0,0,0,112,0,0,0,114,0,0,0,105,0,0,0,108,0,0,0,0,0,0,0,77,0,0,0,97,0,0,0,114,0,0,0,99,0,0,0,104,0,0,0,0,0,0,0,70,0,0,0,101,0,0,0,98,0,0,0,114,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,74,0,0,0,97,0,0,0,110,0,0,0,117,0,0,0,97,0,0,0,114,0,0,0,121,0,0,0,0,0,0,0,80,77,0,0,0,0,0,0,65,77,0,0,0,0,0,0,80,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,65,0,0,0,77,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,97,108,108,111,99,0,0,108,111,99,97,108,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,123,32,105,102,40,100,111,99,117,109,101,110,116,46,103,101,116,69,108,101,109,101,110,116,66,121,73,100,40,39,99,105,114,99,108,101,39,41,46,99,104,101,99,107,101,100,41,32,114,101,116,117,114,110,32,49,59,32,101,108,115,101,32,105,102,40,100,111,99,117,109,101,110,116,46,103,101,116,69,108,101,109,101,110,116,66,121,73,100,40,39,116,114,105,97,110,103,108,101,39,41,46,99,104,101,99,107,101,100,41,32,114,101,116,117,114,110,32,50,59,32,101,108,115,101,32,114,101,116,117,114,110,32,48,59,32,125,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,112,0,0,0,0,0,0,37,0,0,0,97,0,0,0,32,0,0,0,37,0,0,0,98,0,0,0,32,0,0,0,37,0,0,0,100,0,0,0,32,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,89,0,0,0,0,0,0,0,0,0,0,0,37,97,32,37,98,32,37,100,32,37,72,58,37,77,58,37,83,32,37,89,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,0,0,0,0,0,0,0,0,115,116,100,58,58,98,97,100,95,99,97,115,116,0,0,0,37,72,58,37,77,58,37,83,0,0,0,0,0,0,0,0,58,32,0,0,0,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,37,109,47,37,100,47,37,121,0,0,0,0,0,0,0,0,105,111,115,95,98,97,115,101,58,58,99,108,101,97,114,0,102,0,0,0,97,0,0,0,108,0,0,0,115,0,0,0,101,0,0,0,0,0,0,0,123,114,101,116,117,114,110,32,100,111,99,117,109,101,110,116,46,103,101,116,69,108,101,109,101,110,116,66,121,73,100,40,39,115,105,122,101,39,41,46,118,97,108,117,101,125,0,0,102,97,108,115,101,0,0,0,116,0,0,0,114,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,0,0,0,0,110,97,110,0,0,0,0,0,116,114,117,101,0,0,0,0,105,111,115,116,114,101,97,109,0,0,0,0,0,0,0,0,83,97,116,0,0,0,0,0,70,114,105,0,0,0,0,0,84,104,117,0,0,0,0,0,87,101,100,0,0,0,0,0,84,117,101,0,0,0,0,0,77,111,110,0,0,0,0,0,83,117,110,0,0,0,0,0,83,97,116,117,114,100,97,121,0,0,0,0,0,0,0,0,70,114,105,100,97,121,0,0,84,104,117,114,115,100,97,121,0,0,0,0,0,0,0,0,87,101,100,110,101,115,100,97,121,0,0,0,0,0,0,0,84,117,101,115,100,97,121,0,77,111,110,100,97,121,0,0,117,110,115,112,101,99,105,102,105,101,100,32,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,32,101,114,114,111,114,0,0,0,0,0,83,117,110,100,97,121,0,0,83,0,0,0,97,0,0,0,116,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,0,0,0,0,77,0,0,0,111,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,117,0,0,0,110,0,0,0,0,0,0,0,83,0,0,0,97,0,0,0,116,0,0,0,117,0,0,0,114,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,70,0,0,0,114,0,0,0,105,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,84,0,0,0,104,0,0,0,117,0,0,0,114,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,0,0,0,0,87,0,0,0,101,0,0,0,100,0,0,0,110,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,84,0,0,0,117,0,0,0,101,0,0,0,115,0,0,0,100,0,0,0,97,0,0,0,121,0,0,0,0,0,0,0,123,32,114,101,116,117,114,110,32,99,104,101,99,107,101,100,59,32,125,0,0,0,0,0,123,32,114,101,116,117,114,110,32,98,117,116,116,111,110,59,32,125,0,0,0,0,0,0,2,0,0,192,3,0,0,192,4,0,0,192,5,0,0,192,6,0,0,192,7,0,0,192,8,0,0,192,9,0,0,192,10,0,0,192,11,0,0,192,12,0,0,192,13,0,0,192,14,0,0,192,15,0,0,192,16,0,0,192,17,0,0,192,18,0,0,192,19,0,0,192,20,0,0,192,21,0,0,192,22,0,0,192,23,0,0,192,24,0,0,192,25,0,0,192,26,0,0,192,27,0,0,192,28,0,0,192,29,0,0,192,30,0,0,192,31,0,0,192,0,0,0,179,1,0,0,195,2,0,0,195,3,0,0,195,4,0,0,195,5,0,0,195,6,0,0,195,7,0,0,195,8,0,0,195,9,0,0,195,10,0,0,195,11,0,0,195,12,0,0,195,13,0,0,211,14,0,0,195,15,0,0,195,0,0,12,187,1,0,12,195,2,0,12,195,3,0,12,195,4,0,12,211,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,0,0,0,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,0,0,0,0,37,0,0,0,73,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,32,0,0,0,37,0,0,0,112,0,0,0,0,0,0,0,37,0,0,0,89,0,0,0,45,0,0,0,37,0,0,0,109,0,0,0,45,0,0,0,37,0,0,0,100,0,0,0,37,0,0,0,109,0,0,0,47,0,0,0,37,0,0,0,100,0,0,0,47,0,0,0,37,0,0,0,121,0,0,0,37,0,0,0,72,0,0,0,58,0,0,0,37,0,0,0,77,0,0,0,58,0,0,0,37,0,0,0,83,0,0,0,37,72,58,37,77,58,37,83,37,72,58,37,77,0,0,0,37,73,58,37,77,58,37,83,32,37,112,0,0,0,0,0,37,89,45,37,109,45,37,100,37,109,47,37,100,47,37,121,37,72,58,37,77,58,37,83,37,0,0,0,0,0,0,0,37,112,0,0,0,0,0,0,0,0,0,0,248,32,0,0,34,0,0,0,122,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,33,0,0,188,0,0,0,158,0,0,0,34,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,33,0,0,72,0,0,0,252,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,33,0,0,98,0,0,0,8,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,33,0,0,98,0,0,0,22,0,0,0,104,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,33,0,0,162,0,0,0,86,0,0,0,52,0,0,0,2,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,33,0,0,244,0,0,0,180,0,0,0,52,0,0,0,4,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,33,0,0,156,0,0,0,182,0,0,0,52,0,0,0,8,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,33,0,0,246,0,0,0,140,0,0,0,52,0,0,0,6,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,80,34,0,0,242,0,0,0,96,0,0,0,52,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,34,0,0,154,0,0,0,114,0,0,0,52,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,34,0,0,42,0,0,0,116,0,0,0,52,0,0,0,118,0,0,0,4,0,0,0,32,0,0,0,6,0,0,0,20,0,0,0,56,0,0,0,2,0,0,0,248,255,255,255,144,34,0,0,20,0,0,0,10,0,0,0,32,0,0,0,14,0,0,0,2,0,0,0,30,0,0,0,122,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,34,0,0,234,0,0,0,216,0,0,0,52,0,0,0,18,0,0,0,16,0,0,0,60,0,0,0,26,0,0,0,18,0,0,0,2,0,0,0,4,0,0,0,248,255,255,255,184,34,0,0,62,0,0,0,100,0,0,0,112,0,0,0,120,0,0,0,88,0,0,0,42,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,34,0,0,80,0,0,0,184,0,0,0,52,0,0,0,44,0,0,0,38,0,0,0,8,0,0,0,40,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,34,0,0,66,0,0,0,70,0,0,0,52,0,0,0,40,0,0,0,76,0,0,0,12,0,0,0,54,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,35,0,0,238,0,0,0,2,0,0,0,52,0,0,0,24,0,0,0,30,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,35,0,0,50,0,0,0,202,0,0,0,52,0,0,0,38,0,0,0,14,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,35,0,0,204,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,72,35,0,0,32,0,0,0,138,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,35,0,0,6,0,0,0,166,0,0,0,52,0,0,0,8,0,0,0,6,0,0,0,12,0,0,0,4,0,0,0,10,0,0,0,4,0,0,0,2,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,35,0,0,102,0,0,0,20,0,0,0,52,0,0,0,20,0,0,0,24,0,0,0,34,0,0,0,22,0,0,0,22,0,0,0,8,0,0,0,6,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,35,0,0,44,0,0,0,28,0,0,0,52,0,0,0,48,0,0,0,46,0,0,0,38,0,0,0,40,0,0,0,30,0,0,0,44,0,0,0,36,0,0,0,54,0,0,0,52,0,0,0,50,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,35,0,0,56,0,0,0,4,0,0,0,52,0,0,0,76,0,0,0,70,0,0,0,64,0,0,0,66,0,0,0,58,0,0,0,68,0,0,0,62,0,0,0,28,0,0,0,74,0,0,0,72,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,35,0,0,76,0,0,0,94,0,0,0,52,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,35,0,0,30,0,0,0,168,0,0,0,52,0,0,0,16,0,0,0,14,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,35,0,0,14,0,0,0,178,0,0,0,52,0,0,0,2,0,0,0,10,0,0,0,14,0,0,0,116,0,0,0,94,0,0,0,24,0,0,0,108,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,36,0,0,172,0,0,0,132,0,0,0,52,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,48,0,0,0,8,0,0,0,20,0,0,0,84,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,36,0,0,172,0,0,0,24,0,0,0,52,0,0,0,6,0,0,0,4,0,0,0,4,0,0,0,92,0,0,0,58,0,0,0,12,0,0,0,124,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,36,0,0,172,0,0,0,106,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,10,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,36,0,0,172,0,0,0,38,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,36,0,0,64,0,0,0,152,0,0,0,52,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,36,0,0,172,0,0,0,82,0,0,0,52,0,0,0,20,0,0,0,6,0,0,0,12,0,0,0,28,0,0,0,16,0,0,0,28,0,0,0,24,0,0,0,6,0,0,0,4,0,0,0,24,0,0,0,10,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,36,0,0,250,0,0,0,40,0,0,0,52,0,0,0,10,0,0,0,4,0,0,0,18,0,0,0,36,0,0,0,8,0,0,0,14,0,0,0,26,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,36,0,0,104,0,0,0,212,0,0,0,70,0,0,0,2,0,0,0,14,0,0,0,32,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,36,0,0,172,0,0,0,88,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,10,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,37,0,0,172,0,0,0,230,0,0,0,52,0,0,0,12,0,0,0,8,0,0,0,22,0,0,0,28,0,0,0,66,0,0,0,10,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,37,0,0,128,0,0,0,226,0,0,0,20,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,37,0,0,10,0,0,0,124,0,0,0,60,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,80,37,0,0,48,0,0,0,200,0,0,0,252,255,255,255,252,255,255,255,80,37,0,0,146,0,0,0,126,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,104,37,0,0,206,0,0,0,228,0,0,0,252,255,255,255,252,255,255,255,104,37,0,0,112,0,0,0,192,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,128,37,0,0,90,0,0,0,254,0,0,0,248,255,255,255,248,255,255,255,128,37,0,0,174,0,0,0,224,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,152,37,0,0,110,0,0,0,196,0,0,0,248,255,255,255,248,255,255,255,152,37,0,0,136,0,0,0,54,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,37,0,0,194,0,0,0,176,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,37,0,0,198,0,0,0,220,0,0,0,16,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,54,0,0,0,96,0,0,0,34,0,0,0,26,0,0,0,24,0,0,0,6,0,0,0,30,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,37,0,0,92,0,0,0,170,0,0,0,36,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,82,0,0,0,78,0,0,0,18,0,0,0,6,0,0,0,12,0,0,0,26,0,0,0,42,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,38,0,0,214,0,0,0,144,0,0,0,52,0,0,0,60,0,0,0,114,0,0,0,46,0,0,0,78,0,0,0,4,0,0,0,32,0,0,0,50,0,0,0,24,0,0,0,38,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,38,0,0,108,0,0,0,60,0,0,0,52,0,0,0,106,0,0,0,4,0,0,0,66,0,0,0,74,0,0,0,76,0,0,0,26,0,0,0,110,0,0,0,50,0,0,0,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,38,0,0,218,0,0,0,120,0,0,0,52,0,0,0,16,0,0,0,56,0,0,0,6,0,0,0,42,0,0,0,80,0,0,0,52,0,0,0,86,0,0,0,56,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,38,0,0,78,0,0,0,164,0,0,0,52,0,0,0,98,0,0,0,102,0,0,0,30,0,0,0,72,0,0,0,28,0,0,0,22,0,0,0,72,0,0,0,70,0,0,0,68,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,38,0,0,198,0,0,0,18,0,0,0,58,0,0,0,22,0,0,0,16,0,0,0,12,0,0,0,80,0,0,0,96,0,0,0,34,0,0,0,64,0,0,0,74,0,0,0,12,0,0,0,44,0,0,0,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,38,0,0,92,0,0,0,208,0,0,0,62,0,0,0,40,0,0,0,28,0,0,0,8,0,0,0,46,0,0,0,78,0,0,0,18,0,0,0,90,0,0,0,22,0,0,0,2,0,0,0,16,0,0,0,20,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,38,0,0,240,0,0,0,190,0,0,0,68,0,0,0,150,0,0,0,8,0,0,0,2,0,0,0,6,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,83,116,57,116,121,112,101,95,105,110,102,111,0,0,0,0,83,116,57,98,97,100,95,97,108,108,111,99,0,0,0,0,83,116,56,98,97,100,95,99,97,115,116,0,0,0,0,0,83,116,49,51,114,117,110,116,105,109,101,95,101,114,114,111,114,0,0,0,0,0,0,0,83,116,49,50,108,101,110,103,116,104,95,101,114,114,111,114,0,0,0,0,0,0,0,0,83,116,49,49,108,111,103,105,99,95,101,114,114,111,114,0,78,83,116,51,95,95,49,57,116,105,109,101,95,98,97,115,101,69,0,0,0,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,109,111,110,101,121,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,98,97,115,105,99,95,105,111,115,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,112,117,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,119,69,69,0,0,0,78,83,116,51,95,95,49,57,95,95,110,117,109,95,103,101,116,73,99,69,69,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,116,105,109,101,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,110,117,109,112,117,110,99,116,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,119,69,69,0,0,0,0,78,83,116,51,95,95,49,56,109,101,115,115,97,103,101,115,73,99,69,69,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,56,105,111,115,95,98,97,115,101,55,102,97,105,108,117,114,101,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,119,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,112,117,116,73,99,78,83,95,49,57,111,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,119,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,110,117,109,95,103,101,116,73,99,78,83,95,49,57,105,115,116,114,101,97,109,98,117,102,95,105,116,101,114,97,116,111,114,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,119,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,108,108,97,116,101,73,99,69,69,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,119,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,99,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,115,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,55,99,111,100,101,99,118,116,73,68,105,99,49,49,95,95,109,98,115,116,97,116,101,95,116,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,102,97,99,101,116,69,0,0,0,78,83,116,51,95,95,49,54,108,111,99,97,108,101,53,95,95,105,109,112,69,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,53,99,116,121,112,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,119,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,50,48,95,95,116,105,109,101,95,103,101,116,95,99,95,115,116,111,114,97,103,101,73,99,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,57,95,95,105,111,115,116,114,101,97,109,95,99,97,116,101,103,111,114,121,69,0,0,0,78,83,116,51,95,95,49,49,55,95,95,119,105,100,101,110,95,102,114,111,109,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,78,83,116,51,95,95,49,49,54,95,95,110,97,114,114,111,119,95,116,111,95,117,116,102,56,73,76,106,51,50,69,69,69,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,53,98,97,115,105,99,95,115,116,114,101,97,109,98,117,102,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,101,114,114,111,114,95,99,97,116,101,103,111,114,121,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,115,104,97,114,101,100,95,99,111,117,110,116,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,112,117,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,52,95,95,110,117,109,95,103,101,116,95,98,97,115,101,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,51,109,101,115,115,97,103,101,115,95,98,97,115,101,69,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,111,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,119,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,119,69,69,69,69,0,0,78,83,116,51,95,95,49,49,51,98,97,115,105,99,95,105,115,116,114,101,97,109,73,99,78,83,95,49,49,99,104,97,114,95,116,114,97,105,116,115,73,99,69,69,69,69,0,0,78,83,116,51,95,95,49,49,50,115,121,115,116,101,109,95,101,114,114,111,114,69,0,0,78,83,116,51,95,95,49,49,50,99,111,100,101,99,118,116,95,98,97,115,101,69,0,0,78,83,116,51,95,95,49,49,50,95,95,100,111,95,109,101,115,115,97,103,101,69,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,115,116,100,111,117,116,98,117,102,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,112,117,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,119,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,49,95,95,109,111,110,101,121,95,103,101,116,73,99,69,69,0,0,0,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,119,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,49,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,112,117,110,99,116,73,99,76,98,48,69,69,69,0,0,0,0,0,78,83,116,51,95,95,49,49,48,109,111,110,101,121,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,99,116,121,112,101,95,98,97,115,101,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,116,105,109,101,95,112,117,116,69,0,0,0,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,119,69,69,0,78,83,116,51,95,95,49,49,48,95,95,115,116,100,105,110,98,117,102,73,99,69,69,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,49,95,95,118,109,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0,0,0,0,0,0,0,0,0,0,0,0,88,21,0,0,0,0,0,0,104,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,136,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,21,0,0,56,33,0,0,0,0,0,0,0,0,0,0,184,21,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,21,0,0,48,21,0,0,224,21,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,248,37,0,0,0,0,0,0,48,21,0,0,40,22,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,0,38,0,0,0,0,0,0,48,21,0,0,112,22,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,8,38,0,0,0,0,0,0,48,21,0,0,184,22,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,16,38,0,0,0,0,0,0,0,0,0,0,0,23,0,0,64,35,0,0,0,0,0,0,0,0,0,0,48,23,0,0,64,35,0,0,0,0,0,0,48,21,0,0,96,23,0,0,0,0,0,0,1,0,0,0,56,37,0,0,0,0,0,0,48,21,0,0,120,23,0,0,0,0,0,0,1,0,0,0,56,37,0,0,0,0,0,0,48,21,0,0,144,23,0,0,0,0,0,0,1,0,0,0,64,37,0,0,0,0,0,0,48,21,0,0,168,23,0,0,0,0,0,0,1,0,0,0,64,37,0,0,0,0,0,0,48,21,0,0,192,23,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,168,38,0,0,0,8,0,0,48,21,0,0,8,24,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,168,38,0,0,0,8,0,0,48,21,0,0,80,24,0,0,0,0,0,0,3,0,0,0,120,36,0,0,2,0,0,0,72,33,0,0,2,0,0,0,216,36,0,0,0,8,0,0,48,21,0,0,152,24,0,0,0,0,0,0,3,0,0,0,120,36,0,0,2,0,0,0,72,33,0,0,2,0,0,0,224,36,0,0,0,8,0,0,0,0,0,0,224,24,0,0,120,36,0,0,0,0,0,0,0,0,0,0,248,24,0,0,120,36,0,0,0,0,0,0,48,21,0,0,16,25,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,72,37,0,0,2,0,0,0,48,21,0,0,40,25,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,72,37,0,0,2,0,0,0,0,0,0,0,64,25,0,0,0,0,0,0,88,25,0,0,176,37,0,0,0,0,0,0,48,21,0,0,120,25,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,240,33,0,0,0,0,0,0,48,21,0,0,192,25,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,8,34,0,0,0,0,0,0,48,21,0,0,8,26,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,32,34,0,0,0,0,0,0,48,21,0,0,80,26,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,56,34,0,0,0,0,0,0,0,0,0,0,152,26,0,0,120,36,0,0,0,0,0,0,0,0,0,0,176,26,0,0,120,36,0,0,0,0,0,0,48,21,0,0,200,26,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,192,37,0,0,2,0,0,0,48,21,0,0,240,26,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,192,37,0,0,2,0,0,0,48,21,0,0,24,27,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,192,37,0,0,2,0,0,0,48,21,0,0,64,27,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,192,37,0,0,2,0,0,0,0,0,0,0,104,27,0,0,48,37,0,0,0,0,0,0,0,0,0,0,128,27,0,0,120,36,0,0,0,0,0,0,48,21,0,0,152,27,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,160,38,0,0,2,0,0,0,48,21,0,0,176,27,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,160,38,0,0,2,0,0,0,0,0,0,0,200,27,0,0,0,0,0,0,240,27,0,0,0,0,0,0,24,28,0,0,200,37,0,0,0,0,0,0,0,0,0,0,56,28,0,0,88,36,0,0,0,0,0,0,0,0,0,0,96,28,0,0,88,36,0,0,0,0,0,0,0,0,0,0,136,28,0,0,0,0,0,0,192,28,0,0,0,0,0,0,248,28,0,0,0,0,0,0,24,29,0,0,0,0,0,0,56,29,0,0,0,0,0,0,88,29,0,0,0,0,0,0,120,29,0,0,48,21,0,0,144,29,0,0,0,0,0,0,1,0,0,0,208,33,0,0,3,244,255,255,48,21,0,0,192,29,0,0,0,0,0,0,1,0,0,0,224,33,0,0,3,244,255,255,48,21,0,0,240,29,0,0,0,0,0,0,1,0,0,0,208,33,0,0,3,244,255,255,48,21,0,0,32,30,0,0,0,0,0,0,1,0,0,0,224,33,0,0,3,244,255,255,0,0,0,0,80,30,0,0,24,33,0,0,0,0,0,0,0,0,0,0,104,30,0,0,0,0,0,0,128,30,0,0,40,37,0,0,0,0,0,0,0,0,0,0,152,30,0,0,24,37,0,0,0,0,0,0,0,0,0,0,184,30,0,0,32,37,0,0,0,0,0,0,0,0,0,0,216,30,0,0,0,0,0,0,248,30,0,0,0,0,0,0,24,31,0,0,0,0,0,0,56,31,0,0,48,21,0,0,88,31,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,152,38,0,0,2,0,0,0,48,21,0,0,120,31,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,152,38,0,0,2,0,0,0,48,21,0,0,152,31,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,152,38,0,0,2,0,0,0,48,21,0,0,184,31,0,0,0,0,0,0,2,0,0,0,120,36,0,0,2,0,0,0,152,38,0,0,2,0,0,0,0,0,0,0,216,31,0,0,0,0,0,0,240,31,0,0,0,0,0,0,8,32,0,0,0,0,0,0,32,32,0,0,24,37,0,0,0,0,0,0,0,0,0,0,56,32,0,0,32,37,0,0,0,0,0,0,0,0,0,0,80,32,0,0,240,38,0,0,0,0,0,0,0,0,0,0,120,32,0,0,240,38,0,0,0,0,0,0,0,0,0,0,160,32,0,0,0,39,0,0,0,0,0,0,0,0,0,0,200,32,0,0,240,32,0,0,0,0,0,0,48,49,50,51,52,53,54,55,56,57,97,98,99,100,101,102,65,66,67,68,69,70,120,88,43,45,112,80,105,73,110,78,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);



var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}


  
   
  Module["_rand_r"] = _rand_r;
  
  var ___rand_seed=allocate([0x0273459b, 0, 0, 0], "i32", ALLOC_STATIC); 
  Module["_rand"] = _rand;

  
  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;

  
  
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value;
      return value;
    }
  
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          fileStore.createIndex('timestamp', 'timestamp', { unique: false });
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function() {
          callback(this.error);
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function() { callback(this.error); };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function() { callback(this.error); };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function() { callback(this.error); };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function() { done(this.error); };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          stream.position = position;
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },getStreamFromPtr:function (ptr) {
        return FS.streams[ptr - 1];
      },getPtrForStream:function (stream) {
        return stream ? stream.fd + 1 : 0;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=FS.getPtrForStream(stdin);
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=FS.getPtrForStream(stdout);
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=FS.getPtrForStream(stderr);
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
  
              if (!hasByteServing) chunkSize = datalength;
  
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
  
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
  
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
  
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  
  var Browser={mainLoop:{scheduler:null,method:"",shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
  
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
  
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        var errorInfo = '?';
        function onContextCreationError(event) {
          errorInfo = event.statusMessage || errorInfo;
        }
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
  
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
  
  
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
  
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          GLctx = Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
  
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        return Math.max(-1, Math.min(1, event.type === 'DOMMouseScroll' ? event.detail : -event.wheelDelta));
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (scrollX + rect.left);
              y = t.pageY - (scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (scrollX + rect.left);
            y = event.pageY - (scrollY + rect.top);
          }
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};var SDL={defaults:{width:320,height:200,copyOnLock:true},version:null,surfaces:{},canvasPool:[],events:[],fonts:[null],audios:[null],rwops:[null],music:{audio:null,volume:1},mixerFrequency:22050,mixerFormat:32784,mixerNumChannels:2,mixerChunkSize:1024,channelMinimumNumber:0,GL:false,glAttributes:{0:3,1:3,2:2,3:0,4:0,5:1,6:16,7:0,8:0,9:0,10:0,11:0,12:0,13:0,14:0,15:1,16:0,17:0,18:0},keyboardState:null,keyboardMap:{},canRequestFullscreen:false,isRequestingFullscreen:false,textInput:false,startTime:null,initFlags:0,buttonState:0,modState:0,DOMButtons:[0,0,0],DOMEventToSDLEvent:{},keyCodes:{16:1249,17:1248,18:1250,33:1099,34:1102,37:1104,38:1106,39:1103,40:1105,46:127,96:1112,97:1113,98:1114,99:1115,100:1116,101:1117,102:1118,103:1119,104:1120,105:1121,112:1082,113:1083,114:1084,115:1085,116:1086,117:1087,118:1088,119:1089,120:1090,121:1091,122:1092,123:1093,173:45,188:44,190:46,191:47,192:96},scanCodes:{8:42,9:43,13:40,27:41,32:44,44:54,46:55,47:56,48:39,49:30,50:31,51:32,52:33,53:34,54:35,55:36,56:37,57:38,59:51,61:46,91:47,92:49,93:48,96:52,97:4,98:5,99:6,100:7,101:8,102:9,103:10,104:11,105:12,106:13,107:14,108:15,109:16,110:17,111:18,112:19,113:20,114:21,115:22,116:23,117:24,118:25,119:26,120:27,121:28,122:29,305:224,308:226},loadRect:function (rect) {
        return {
          x: HEAP32[((rect + 0)>>2)],
          y: HEAP32[((rect + 4)>>2)],
          w: HEAP32[((rect + 8)>>2)],
          h: HEAP32[((rect + 12)>>2)]
        };
      },loadColorToCSSRGB:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgb(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ')';
      },loadColorToCSSRGBA:function (color) {
        var rgba = HEAP32[((color)>>2)];
        return 'rgba(' + (rgba&255) + ',' + ((rgba >> 8)&255) + ',' + ((rgba >> 16)&255) + ',' + (((rgba >> 24)&255)/255) + ')';
      },translateColorToCSSRGBA:function (rgba) {
        return 'rgba(' + (rgba&0xff) + ',' + (rgba>>8 & 0xff) + ',' + (rgba>>16 & 0xff) + ',' + (rgba>>>24)/0xff + ')';
      },translateRGBAToCSSRGBA:function (r, g, b, a) {
        return 'rgba(' + (r&0xff) + ',' + (g&0xff) + ',' + (b&0xff) + ',' + (a&0xff)/255 + ')';
      },translateRGBAToColor:function (r, g, b, a) {
        return r | g << 8 | b << 16 | a << 24;
      },makeSurface:function (width, height, flags, usePageCanvas, source, rmask, gmask, bmask, amask) {
        flags = flags || 0;
        var is_SDL_HWSURFACE = flags & 0x00000001;
        var is_SDL_HWPALETTE = flags & 0x00200000;
        var is_SDL_OPENGL = flags & 0x04000000;
  
        var surf = _malloc(60);
        var pixelFormat = _malloc(44);
        //surface with SDL_HWPALETTE flag is 8bpp surface (1 byte)
        var bpp = is_SDL_HWPALETTE ? 1 : 4;
        var buffer = 0;
  
        // preemptively initialize this for software surfaces,
        // otherwise it will be lazily initialized inside of SDL_LockSurface
        if (!is_SDL_HWSURFACE && !is_SDL_OPENGL) {
          buffer = _malloc(width * height * 4);
        }
  
        HEAP32[((surf)>>2)]=flags;
        HEAP32[(((surf)+(4))>>2)]=pixelFormat;
        HEAP32[(((surf)+(8))>>2)]=width;
        HEAP32[(((surf)+(12))>>2)]=height;
        HEAP32[(((surf)+(16))>>2)]=width * bpp;  // assuming RGBA or indexed for now,
                                                                                          // since that is what ImageData gives us in browsers
        HEAP32[(((surf)+(20))>>2)]=buffer;
        HEAP32[(((surf)+(36))>>2)]=0;
        HEAP32[(((surf)+(56))>>2)]=1;
  
        HEAP32[((pixelFormat)>>2)]=0 /* XXX missing C define SDL_PIXELFORMAT_RGBA8888 */;
        HEAP32[(((pixelFormat)+(4))>>2)]=0;// TODO
        HEAP8[(((pixelFormat)+(8))|0)]=bpp * 8;
        HEAP8[(((pixelFormat)+(9))|0)]=bpp;
  
        HEAP32[(((pixelFormat)+(12))>>2)]=rmask || 0x000000ff;
        HEAP32[(((pixelFormat)+(16))>>2)]=gmask || 0x0000ff00;
        HEAP32[(((pixelFormat)+(20))>>2)]=bmask || 0x00ff0000;
        HEAP32[(((pixelFormat)+(24))>>2)]=amask || 0xff000000;
  
        // Decide if we want to use WebGL or not
        SDL.GL = SDL.GL || is_SDL_OPENGL;
        var canvas;
        if (!usePageCanvas) {
          if (SDL.canvasPool.length > 0) {
            canvas = SDL.canvasPool.pop();
          } else {
            canvas = document.createElement('canvas');
          }
          canvas.width = width;
          canvas.height = height;
        } else {
          canvas = Module['canvas'];
        }
  
        var webGLContextAttributes = {
          antialias: ((SDL.glAttributes[13 /*SDL_GL_MULTISAMPLEBUFFERS*/] != 0) && (SDL.glAttributes[14 /*SDL_GL_MULTISAMPLESAMPLES*/] > 1)),
          depth: (SDL.glAttributes[6 /*SDL_GL_DEPTH_SIZE*/] > 0),
          stencil: (SDL.glAttributes[7 /*SDL_GL_STENCIL_SIZE*/] > 0)
        };
        
        var ctx = Browser.createContext(canvas, is_SDL_OPENGL, usePageCanvas, webGLContextAttributes);
              
        SDL.surfaces[surf] = {
          width: width,
          height: height,
          canvas: canvas,
          ctx: ctx,
          surf: surf,
          buffer: buffer,
          pixelFormat: pixelFormat,
          alpha: 255,
          flags: flags,
          locked: 0,
          usePageCanvas: usePageCanvas,
          source: source,
  
          isFlagSet: function(flag) {
            return flags & flag;
          }
        };
  
        return surf;
      },copyIndexedColorData:function (surfData, rX, rY, rW, rH) {
        // HWPALETTE works with palette
        // setted by SDL_SetColors
        if (!surfData.colors) {
          return;
        }
        
        var fullWidth  = Module['canvas'].width;
        var fullHeight = Module['canvas'].height;
  
        var startX  = rX || 0;
        var startY  = rY || 0;
        var endX    = (rW || (fullWidth - startX)) + startX;
        var endY    = (rH || (fullHeight - startY)) + startY;
        
        var buffer  = surfData.buffer;
        var data    = surfData.image.data;
        var colors  = surfData.colors;
  
        for (var y = startY; y < endY; ++y) {
          var indexBase = y * fullWidth;
          var colorBase = indexBase * 4;
          for (var x = startX; x < endX; ++x) {
            // HWPALETTE have only 256 colors (not rgba)
            var index = HEAPU8[((buffer + indexBase + x)|0)] * 3;
            var colorOffset = colorBase + x * 4;
  
            data[colorOffset   ] = colors[index   ];
            data[colorOffset +1] = colors[index +1];
            data[colorOffset +2] = colors[index +2];
            //unused: data[colorOffset +3] = color[index +3];
          }
        }
      },freeSurface:function (surf) {
        var refcountPointer = surf + 56;
        var refcount = HEAP32[((refcountPointer)>>2)];
        if (refcount > 1) {
          HEAP32[((refcountPointer)>>2)]=refcount - 1;
          return;
        }
  
        var info = SDL.surfaces[surf];
        if (!info.usePageCanvas && info.canvas) SDL.canvasPool.push(info.canvas);
        if (info.buffer) _free(info.buffer);
        _free(info.pixelFormat);
        _free(surf);
        SDL.surfaces[surf] = null;
      },touchX:0,touchY:0,savedKeydown:null,receiveEvent:function (event) {
        switch(event.type) {
          case 'touchstart':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            var event = {
              type: 'mousedown',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 1;
            SDL.events.push(event);
            break;
          case 'touchmove':
            event.preventDefault();
            var touch = event.touches[0];
            touchX = touch.pageX;
            touchY = touch.pageY;
            event = {
              type: 'mousemove',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.events.push(event);
            break;
          case 'touchend':
            event.preventDefault();
            event = {
              type: 'mouseup',
              button: 0,
              pageX: touchX,
              pageY: touchY
            };
            SDL.DOMButtons[0] = 0;
            SDL.events.push(event);
            break;
          case 'mousemove':
            if (Browser.pointerLock) {
              // workaround for firefox bug 750111
              if ('mozMovementX' in event) {
                event['movementX'] = event['mozMovementX'];
                event['movementY'] = event['mozMovementY'];
              }
              // workaround for Firefox bug 782777
              if (event['movementX'] == 0 && event['movementY'] == 0) {
                // ignore a mousemove event if it doesn't contain any movement info
                // (without pointer lock, we infer movement from pageX/pageY, so this check is unnecessary)
                event.preventDefault();
                return;
              }
            }
            // fall through
          case 'keydown': case 'keyup': case 'keypress': case 'mousedown': case 'mouseup': case 'DOMMouseScroll': case 'mousewheel':
            // If we preventDefault on keydown events, the subsequent keypress events
            // won't fire. However, it's fine (and in some cases necessary) to
            // preventDefault for keys that don't generate a character. Otherwise,
            // preventDefault is the right thing to do in general.
            if (event.type !== 'keydown' || (!SDL.unicode && !SDL.textInput) || (event.keyCode === 8 /* backspace */ || event.keyCode === 9 /* tab */)) {
              event.preventDefault();
            }
  
            if (event.type == 'DOMMouseScroll' || event.type == 'mousewheel') {
              var button = Browser.getMouseWheelDelta(event) > 0 ? 4 : 3;
              var event2 = {
                type: 'mousedown',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
              SDL.events.push(event2);
              event = {
                type: 'mouseup',
                button: button,
                pageX: event.pageX,
                pageY: event.pageY
              };
            } else if (event.type == 'mousedown') {
              SDL.DOMButtons[event.button] = 1;
            } else if (event.type == 'mouseup') {
              // ignore extra ups, can happen if we leave the canvas while pressing down, then return,
              // since we add a mouseup in that case
              if (!SDL.DOMButtons[event.button]) {
                return;
              }
  
              SDL.DOMButtons[event.button] = 0;
            }
  
            // We can only request fullscreen as the result of user input.
            // Due to this limitation, we toggle a boolean on keydown which
            // SDL_WM_ToggleFullScreen will check and subsequently set another
            // flag indicating for us to request fullscreen on the following
            // keyup. This isn't perfect, but it enables SDL_WM_ToggleFullScreen
            // to work as the result of a keypress (which is an extremely
            // common use case).
            if (event.type === 'keydown') {
              SDL.canRequestFullscreen = true;
            } else if (event.type === 'keyup') {
              if (SDL.isRequestingFullscreen) {
                Module['requestFullScreen'](true, true);
                SDL.isRequestingFullscreen = false;
              }
              SDL.canRequestFullscreen = false;
            }
  
            // SDL expects a unicode character to be passed to its keydown events.
            // Unfortunately, the browser APIs only provide a charCode property on
            // keypress events, so we must backfill in keydown events with their
            // subsequent keypress event's charCode.
            if (event.type === 'keypress' && SDL.savedKeydown) {
              // charCode is read-only
              SDL.savedKeydown.keypressCharCode = event.charCode;
              SDL.savedKeydown = null;
            } else if (event.type === 'keydown') {
              SDL.savedKeydown = event;
            }
  
            // Don't push keypress events unless SDL_StartTextInput has been called.
            if (event.type !== 'keypress' || SDL.textInput) {
              SDL.events.push(event);
            }
            break;
          case 'mouseout':
            // Un-press all pressed mouse buttons, because we might miss the release outside of the canvas
            for (var i = 0; i < 3; i++) {
              if (SDL.DOMButtons[i]) {
                SDL.events.push({
                  type: 'mouseup',
                  button: i,
                  pageX: event.pageX,
                  pageY: event.pageY
                });
                SDL.DOMButtons[i] = 0;
              }
            }
            event.preventDefault();
            break;
          case 'blur':
          case 'visibilitychange': {
            // Un-press all pressed keys: TODO
            for (var code in SDL.keyboardMap) {
              SDL.events.push({
                type: 'keyup',
                keyCode: SDL.keyboardMap[code]
              });
            }
            event.preventDefault();
            break;
          }
          case 'unload':
            if (Browser.mainLoop.runner) {
              SDL.events.push(event);
              // Force-run a main event loop, since otherwise this event will never be caught!
              Browser.mainLoop.runner();
            }
            return;
          case 'resize':
            SDL.events.push(event);
            // manually triggered resize event doesn't have a preventDefault member
            if (event.preventDefault) {
              event.preventDefault();
            }
            break;
        }
        if (SDL.events.length >= 10000) {
          Module.printErr('SDL event queue full, dropping events');
          SDL.events = SDL.events.slice(0, 10000);
        }
        return;
      },handleEvent:function (event) {
        if (event.handled) return;
        event.handled = true;
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            var code = event.keyCode;
            if (code >= 65 && code <= 90) {
              code += 32; // make lowercase for SDL
            } else {
              code = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
  
            HEAP8[(((SDL.keyboardState)+(code))|0)]=down;
            // TODO: lmeta, rmeta, numlock, capslock, KMOD_MODE, KMOD_RESERVED
            SDL.modState = (HEAP8[(((SDL.keyboardState)+(1248))|0)] ? 0x0040 | 0x0080 : 0) | // KMOD_LCTRL & KMOD_RCTRL
              (HEAP8[(((SDL.keyboardState)+(1249))|0)] ? 0x0001 | 0x0002 : 0) | // KMOD_LSHIFT & KMOD_RSHIFT
              (HEAP8[(((SDL.keyboardState)+(1250))|0)] ? 0x0100 | 0x0200 : 0); // KMOD_LALT & KMOD_RALT
  
            if (down) {
              SDL.keyboardMap[code] = event.keyCode; // save the DOM input, which we can use to unpress it during blur
            } else {
              delete SDL.keyboardMap[code];
            }
  
            break;
          }
          case 'mousedown': case 'mouseup':
            if (event.type == 'mousedown') {
              // SDL_BUTTON(x) is defined as (1 << ((x)-1)).  SDL buttons are 1-3,
              // and DOM buttons are 0-2, so this means that the below formula is
              // correct.
              SDL.buttonState |= 1 << event.button;
            } else if (event.type == 'mouseup') {
              SDL.buttonState &= ~(1 << event.button);
            }
            // fall through
          case 'mousemove': {
            Browser.calculateMouseEvent(event);
            break;
          }
        }
      },makeCEvent:function (event, ptr) {
        if (typeof event === 'number') {
          // This is a pointer to a native C event that was SDL_PushEvent'ed
          _memcpy(ptr, event, 28); // XXX
          return;
        }
  
        SDL.handleEvent(event);
  
        switch (event.type) {
          case 'keydown': case 'keyup': {
            var down = event.type === 'keydown';
            //Module.print('Received key event: ' + event.keyCode);
            var key = event.keyCode;
            if (key >= 65 && key <= 90) {
              key += 32; // make lowercase for SDL
            } else {
              key = SDL.keyCodes[event.keyCode] || event.keyCode;
            }
            var scan;
            if (key >= 1024) {
              scan = key - 1024;
            } else {
              scan = SDL.scanCodes[key] || key;
            }
  
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(8))|0)]=down ? 1 : 0;
            HEAP8[(((ptr)+(9))|0)]=0; // TODO
            HEAP32[(((ptr)+(12))>>2)]=scan;
            HEAP32[(((ptr)+(16))>>2)]=key;
            HEAP16[(((ptr)+(20))>>1)]=SDL.modState;
            // some non-character keys (e.g. backspace and tab) won't have keypressCharCode set, fill in with the keyCode.
            HEAP32[(((ptr)+(24))>>2)]=event.keypressCharCode || key;
  
            break;
          }
          case 'keypress': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            // Not filling in windowID for now
            var cStr = intArrayFromString(String.fromCharCode(event.charCode));
            for (var i = 0; i < cStr.length; ++i) {
              HEAP8[(((ptr)+(8 + i))|0)]=cStr[i];
            }
            break;
          }
          case 'mousedown': case 'mouseup': case 'mousemove': {
            if (event.type != 'mousemove') {
              var down = event.type === 'mousedown';
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=event.button+1; // DOM buttons are 0-2, SDL 1-3
              HEAP8[(((ptr)+(9))|0)]=down ? 1 : 0;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
            } else {
              HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
              HEAP8[(((ptr)+(8))|0)]=SDL.buttonState;
              HEAP32[(((ptr)+(12))>>2)]=Browser.mouseX;
              HEAP32[(((ptr)+(16))>>2)]=Browser.mouseY;
              HEAP32[(((ptr)+(20))>>2)]=Browser.mouseMovementX;
              HEAP32[(((ptr)+(24))>>2)]=Browser.mouseMovementY;
            }
            break;
          }
          case 'unload': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            break;
          }
          case 'resize': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP32[(((ptr)+(4))>>2)]=event.w;
            HEAP32[(((ptr)+(8))>>2)]=event.h;
            break;
          }
          case 'joystick_button_up': case 'joystick_button_down': {
            var state = event.type === 'joystick_button_up' ? 0 : 1;
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.button;
            HEAP8[(((ptr)+(6))|0)]=state;
            break;
          }
          case 'joystick_axis_motion': {
            HEAP32[((ptr)>>2)]=SDL.DOMEventToSDLEvent[event.type];
            HEAP8[(((ptr)+(4))|0)]=event.index;
            HEAP8[(((ptr)+(5))|0)]=event.axis;
            HEAP32[(((ptr)+(8))>>2)]=SDL.joystickAxisValueConversion(event.value);
            break;
          }
          default: throw 'Unhandled SDL event: ' + event.type;
        }
      },estimateTextWidth:function (fontData, text) {
        var h = fontData.size;
        var fontString = h + 'px ' + fontData.name;
        var tempCtx = SDL.ttfContext;
        tempCtx.save();
        tempCtx.font = fontString;
        var ret = tempCtx.measureText(text).width | 0;
        tempCtx.restore();
        return ret;
      },allocateChannels:function (num) { // called from Mix_AllocateChannels and init
        if (SDL.numChannels && SDL.numChannels >= num && num != 0) return;
        SDL.numChannels = num;
        SDL.channels = [];
        for (var i = 0; i < num; i++) {
          SDL.channels[i] = {
            audio: null,
            volume: 1.0
          };
        }
      },setGetVolume:function (info, volume) {
        if (!info) return 0;
        var ret = info.volume * 128; // MIX_MAX_VOLUME
        if (volume != -1) {
          info.volume = volume / 128;
          if (info.audio) info.audio.volume = info.volume;
        }
        return ret;
      },fillWebAudioBufferFromHeap:function (heapPtr, sizeSamplesPerChannel, dstAudioBuffer) {
        // The input audio data is interleaved across the channels, i.e. [L, R, L, R, L, R, ...] and is either 8-bit or 16-bit as
        // supported by the SDL API. The output audio wave data for Web Audio API must be in planar buffers of [-1,1]-normalized Float32 data,
        // so perform a buffer conversion for the data.
        var numChannels = SDL.audio.channels;
        for(var c = 0; c < numChannels; ++c) {
          var channelData = dstAudioBuffer['getChannelData'](c);
          if (channelData.length != sizeSamplesPerChannel) {
            throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + sizeSamplesPerChannel + ' samples!';
          }
          if (SDL.audio.format == 0x8010 /*AUDIO_S16LSB*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              channelData[j] = (HEAP16[(((heapPtr)+((j*numChannels + c)*2))>>1)]) / 0x8000;
            }
          } else if (SDL.audio.format == 0x0008 /*AUDIO_U8*/) {
            for(var j = 0; j < sizeSamplesPerChannel; ++j) {
              var v = (HEAP8[(((heapPtr)+(j*numChannels + c))|0)]);
              channelData[j] = ((v >= 0) ? v-128 : v+128) /128;
            }
          }
        }
      },debugSurface:function (surfData) {
        console.log('dumping surface ' + [surfData.surf, surfData.source, surfData.width, surfData.height]);
        var image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
        var data = image.data;
        var num = Math.min(surfData.width, surfData.height);
        for (var i = 0; i < num; i++) {
          console.log('   diagonal ' + i + ':' + [data[i*surfData.width*4 + i*4 + 0], data[i*surfData.width*4 + i*4 + 1], data[i*surfData.width*4 + i*4 + 2], data[i*surfData.width*4 + i*4 + 3]]);
        }
      },joystickEventState:1,lastJoystickState:{},joystickNamePool:{},recordJoystickState:function (joystick, state) {
        // Standardize button state.
        var buttons = new Array(state.buttons.length);
        for (var i = 0; i < state.buttons.length; i++) {
          buttons[i] = SDL.getJoystickButtonState(state.buttons[i]);
        }
  
        SDL.lastJoystickState[joystick] = {
          buttons: buttons,
          axes: state.axes.slice(0),
          timestamp: state.timestamp,
          index: state.index,
          id: state.id
        };
      },getJoystickButtonState:function (button) {
        if (typeof button === 'object') {
          // Current gamepad API editor's draft (Firefox Nightly)
          // https://dvcs.w3.org/hg/gamepad/raw-file/default/gamepad.html#idl-def-GamepadButton
          return button.pressed;
        } else {
          // Current gamepad API working draft (Firefox / Chrome Stable)
          // http://www.w3.org/TR/2012/WD-gamepad-20120529/#gamepad-interface
          return button > 0;
        }
      },queryJoysticks:function () {
        for (var joystick in SDL.lastJoystickState) {
          var state = SDL.getGamepad(joystick - 1);
          var prevState = SDL.lastJoystickState[joystick];
          // Check only if the timestamp has differed.
          // NOTE: Timestamp is not available in Firefox.
          if (typeof state.timestamp !== 'number' || state.timestamp !== prevState.timestamp) {
            var i;
            for (i = 0; i < state.buttons.length; i++) {
              var buttonState = SDL.getJoystickButtonState(state.buttons[i]);
              // NOTE: The previous state already has a boolean representation of
              //       its button, so no need to standardize its button state here.
              if (buttonState !== prevState.buttons[i]) {
                // Insert button-press event.
                SDL.events.push({
                  type: buttonState ? 'joystick_button_down' : 'joystick_button_up',
                  joystick: joystick,
                  index: joystick - 1,
                  button: i
                });
              }
            }
            for (i = 0; i < state.axes.length; i++) {
              if (state.axes[i] !== prevState.axes[i]) {
                // Insert axes-change event.
                SDL.events.push({
                  type: 'joystick_axis_motion',
                  joystick: joystick,
                  index: joystick - 1,
                  axis: i,
                  value: state.axes[i]
                });
              }
            }
  
            SDL.recordJoystickState(joystick, state);
          }
        }
      },joystickAxisValueConversion:function (value) {
        // Ensures that 0 is 0, 1 is 32767, and -1 is 32768.
        return Math.ceil(((value+1) * 32767.5) - 32768);
      },getGamepads:function () {
        var fcn = navigator.getGamepads || navigator.webkitGamepads || navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
        if (fcn !== undefined) {
          // The function must be applied on the navigator object.
          return fcn.apply(navigator);
        } else {
          return [];
        }
      },getGamepad:function (deviceIndex) {
        var gamepads = SDL.getGamepads();
        if (gamepads.length > deviceIndex && deviceIndex >= 0) {
          return gamepads[deviceIndex];
        }
        return null;
      }};function _SDL_MapRGBA(fmt, r, g, b, a) {
      // Canvas screens are always RGBA. We assume the machine is little-endian.
      return r&0xff|(g&0xff)<<8|(b&0xff)<<16|(a&0xff)<<24;
    }

  function _SDL_PumpEvents(){
      SDL.events.forEach(function(event) {
        SDL.handleEvent(event);
      });
    }

  function _SDL_LockSurface(surf) {
      var surfData = SDL.surfaces[surf];
  
      surfData.locked++;
      if (surfData.locked > 1) return 0;
  
      if (!surfData.buffer) {
        surfData.buffer = _malloc(surfData.width * surfData.height * 4);
        HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
      }
  
      // Mark in C/C++-accessible SDL structure
      // SDL_Surface has the following fields: Uint32 flags, SDL_PixelFormat *format; int w, h; Uint16 pitch; void *pixels; ...
      // So we have fields all of the same size, and 5 of them before us.
      // TODO: Use macros like in library.js
      HEAP32[(((surf)+(20))>>2)]=surfData.buffer;
  
      if (surf == SDL.screen && Module.screenIsReadOnly && surfData.image) return 0;
  
      surfData.image = surfData.ctx.getImageData(0, 0, surfData.width, surfData.height);
      if (surf == SDL.screen) {
        var data = surfData.image.data;
        var num = data.length;
        for (var i = 0; i < num/4; i++) {
          data[i*4+3] = 255; // opacity, as canvases blend alpha
        }
      }
  
      if (SDL.defaults.copyOnLock) {
        // Copy pixel data to somewhere accessible to 'C/C++'
        if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
          // If this is neaded then
          // we should compact the data from 32bpp to 8bpp index.
          // I think best way to implement this is use
          // additional colorMap hash (color->index).
          // Something like this:
          //
          // var size = surfData.width * surfData.height;
          // var data = '';
          // for (var i = 0; i<size; i++) {
          //   var color = SDL.translateRGBAToColor(
          //     surfData.image.data[i*4   ], 
          //     surfData.image.data[i*4 +1], 
          //     surfData.image.data[i*4 +2], 
          //     255);
          //   var index = surfData.colorMap[color];
          //   HEAP8[(((surfData.buffer)+(i))|0)]=index;
          // }
          throw 'CopyOnLock is not supported for SDL_LockSurface with SDL_HWPALETTE flag set' + new Error().stack;
        } else {
        HEAPU8.set(surfData.image.data, surfData.buffer);
        }
      }
  
      return 0;
    }

  function _emscripten_asm_const_int(code) {
      var args = Array.prototype.slice.call(arguments, 1);
      return Runtime.getAsmConst(code, args.length).apply(null, args) | 0;
    }

  function _SDL_GetMouseState(x, y) {
      if (x) HEAP32[((x)>>2)]=Browser.mouseX;
      if (y) HEAP32[((y)>>2)]=Browser.mouseY;
      return SDL.buttonState;
    }

  function _llvm_lifetime_start() {}

  function _SDL_PollEvent(ptr) {
      if (SDL.initFlags & 0x200 && SDL.joystickEventState) {
        // If SDL_INIT_JOYSTICK was supplied AND the joystick system is configured
        // to automatically query for events, query for joystick events.
        SDL.queryJoysticks();
      }
      if (SDL.events.length === 0) return 0;
      if (ptr) {
        SDL.makeCEvent(SDL.events.shift(), ptr);
      }
      return 1;
    }

  function _SDL_UnlockSurface(surf) {
      assert(!SDL.GL); // in GL mode we do not keep around 2D canvases and contexts
  
      var surfData = SDL.surfaces[surf];
  
      if (!surfData.locked || --surfData.locked > 0) {
        return;
      }
  
      // Copy pixel data to image
      if (surfData.isFlagSet(0x00200000 /* SDL_HWPALETTE */)) {
        SDL.copyIndexedColorData(surfData);
      } else if (!surfData.colors) {
        var data = surfData.image.data;
        var buffer = surfData.buffer;
        assert(buffer % 4 == 0, 'Invalid buffer offset: ' + buffer);
        var src = buffer >> 2;
        var dst = 0;
        var isScreen = surf == SDL.screen;
        var num;
        if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) {
          // IE10/IE11: ImageData objects are backed by the deprecated CanvasPixelArray,
          // not UInt8ClampedArray. These don't have buffers, so we need to revert
          // to copying a byte at a time. We do the undefined check because modern
          // browsers do not define CanvasPixelArray anymore.
          num = data.length;
          while (dst < num) {
            var val = HEAP32[src]; // This is optimized. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
            data[dst  ] = val & 0xff;
            data[dst+1] = (val >> 8) & 0xff;
            data[dst+2] = (val >> 16) & 0xff;
            data[dst+3] = isScreen ? 0xff : ((val >> 24) & 0xff);
            src++;
            dst += 4;
          }
        } else {
          var data32 = new Uint32Array(data.buffer);
          num = data32.length;
          if (isScreen) {
            while (dst < num) {
              // HEAP32[src++] is an optimization. Instead, we could do HEAP32[(((buffer)+(dst))>>2)];
              data32[dst++] = HEAP32[src++] | 0xff000000;
            }
          } else {
            while (dst < num) {
              data32[dst++] = HEAP32[src++];
            }
          }
        }
      } else {
        var width = Module['canvas'].width;
        var height = Module['canvas'].height;
        var s = surfData.buffer;
        var data = surfData.image.data;
        var colors = surfData.colors;
        for (var y = 0; y < height; y++) {
          var base = y*width*4;
          for (var x = 0; x < width; x++) {
            // See comment above about signs
            var val = HEAPU8[((s++)|0)] * 3;
            var start = base + x*4;
            data[start]   = colors[val];
            data[start+1] = colors[val+1];
            data[start+2] = colors[val+2];
          }
          s += width*3;
        }
      }
      // Copy to canvas
      surfData.ctx.putImageData(surfData.image, 0, 0);
      // Note that we save the image, so future writes are fast. But, memory is not yet released
    }

  function _SDL_Flip(surf) {
      // We actually do this in Unlock, since the screen surface has as its canvas
      // backing the page canvas element
    }

  function _llvm_lifetime_end() {}

  function _srand(seed) {
      HEAP32[((___rand_seed)>>2)]=seed
    }

  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _SDL_Init(initFlags) {
      SDL.startTime = Date.now();
      SDL.initFlags = initFlags;
  
      // capture all key events. we just keep down and up, but also capture press to prevent default actions
      if (!Module['doNotCaptureKeyboard']) {
        document.addEventListener("keydown", SDL.receiveEvent);
        document.addEventListener("keyup", SDL.receiveEvent);
        document.addEventListener("keypress", SDL.receiveEvent);
        window.addEventListener("blur", SDL.receiveEvent);
        document.addEventListener("visibilitychange", SDL.receiveEvent);
      }
  
      if (initFlags & 0x200) {
        // SDL_INIT_JOYSTICK
        // Firefox will not give us Joystick data unless we register this NOP
        // callback.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
        addEventListener("gamepadconnected", function() {});
      }
  
      window.addEventListener("unload", SDL.receiveEvent);
      SDL.keyboardState = _malloc(0x10000); // Our SDL needs 512, but 64K is safe for older SDLs
      _memset(SDL.keyboardState, 0, 0x10000);
      // Initialize this structure carefully for closure
      SDL.DOMEventToSDLEvent['keydown'] = 0x300 /* SDL_KEYDOWN */;
      SDL.DOMEventToSDLEvent['keyup'] = 0x301 /* SDL_KEYUP */;
      SDL.DOMEventToSDLEvent['keypress'] = 0x303 /* SDL_TEXTINPUT */;
      SDL.DOMEventToSDLEvent['mousedown'] = 0x401 /* SDL_MOUSEBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['mouseup'] = 0x402 /* SDL_MOUSEBUTTONUP */;
      SDL.DOMEventToSDLEvent['mousemove'] = 0x400 /* SDL_MOUSEMOTION */;
      SDL.DOMEventToSDLEvent['unload'] = 0x100 /* SDL_QUIT */;
      SDL.DOMEventToSDLEvent['resize'] = 0x7001 /* SDL_VIDEORESIZE/SDL_EVENT_COMPAT2 */;
      // These are not technically DOM events; the HTML gamepad API is poll-based.
      // However, we define them here, as the rest of the SDL code assumes that
      // all SDL events originate as DOM events.
      SDL.DOMEventToSDLEvent['joystick_axis_motion'] = 0x600 /* SDL_JOYAXISMOTION */;
      SDL.DOMEventToSDLEvent['joystick_button_down'] = 0x603 /* SDL_JOYBUTTONDOWN */;
      SDL.DOMEventToSDLEvent['joystick_button_up'] = 0x604 /* SDL_JOYBUTTONUP */;
      return 0; // success
    }

  function _SDL_SetVideoMode(width, height, depth, flags) {
      ['mousedown', 'mouseup', 'mousemove', 'DOMMouseScroll', 'mousewheel', 'mouseout'].forEach(function(event) {
        Module['canvas'].addEventListener(event, SDL.receiveEvent, true);
      });
  
      // (0,0) means 'use fullscreen' in native; in Emscripten, use the current canvas size.
      if (width == 0 && height == 0) {
        var canvas = Module['canvas'];
        width = canvas.width;
        height = canvas.height;
      }
  
      Browser.setCanvasSize(width, height, true);
      // Free the old surface first.
      if (SDL.screen) {
        SDL.freeSurface(SDL.screen);
        SDL.screen = null;
      }
      SDL.screen = SDL.makeSurface(width, height, flags, true, 'screen');
      if (!SDL.addedResizeListener) {
        SDL.addedResizeListener = true;
        Browser.resizeListeners.push(function(w, h) {
          SDL.receiveEvent({
            type: 'resize',
            w: w,
            h: h
          });
        });
      }
      return SDL.screen;
    }

  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg) {
      Module['noExitRuntime'] = true;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from non-main loop sources
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        if (Module['preMainLoop']) {
          Module['preMainLoop']();
        }
  
        try {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        } catch (e) {
          if (e instanceof ExitStatus) {
            return;
          } else {
            if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
            throw e;
          }
        }
  
        if (Module['postMainLoop']) {
          Module['postMainLoop']();
        }
  
        if (Browser.mainLoop.shouldPause) {
          // catch pauses from the main loop itself
          Browser.mainLoop.paused = true;
          Browser.mainLoop.shouldPause = false;
          return;
        }
        Browser.mainLoop.scheduler();
      }
      if (fps && fps > 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, 1000/fps); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      Browser.mainLoop.scheduler();
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }

  
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  
  
  
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }
  
  
  
  var ___cxa_last_thrown_exception=0;function ___resumeException(ptr) {
      if (!___cxa_last_thrown_exception) { ___cxa_last_thrown_exception = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }
  
  var ___cxa_exception_header_size=8;function ___cxa_find_matching_catch(thrown, throwntype) {
      if (thrown == -1) thrown = ___cxa_last_thrown_exception;
      header = thrown - ___cxa_exception_header_size;
      if (throwntype == -1) throwntype = HEAP32[((header)>>2)];
      var typeArray = Array.prototype.slice.call(arguments, 2);
  
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return ((asm["setTempRet0"](typeArray[i]),thrown)|0);
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return ((asm["setTempRet0"](throwntype),thrown)|0);
    }function ___gxx_personality_v0() {
    }

  function ___cxa_allocate_exception(size) {
      var ptr = _malloc(size + ___cxa_exception_header_size);
      return ptr + ___cxa_exception_header_size;
    }

  function ___cxa_free_exception(ptr) {
      try {
        return _free(ptr - ___cxa_exception_header_size);
      } catch(e) { // XXX FIXME
      }
    }

  function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      var header = ptr - ___cxa_exception_header_size;
      HEAP32[((header)>>2)]=type;
      HEAP32[(((header)+(4))>>2)]=destructor;
      ___cxa_last_thrown_exception = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  
   
  Module["_memmove"] = _memmove;var _llvm_memmove_p0i8_p0i8_i32=_memmove;

  
   
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;

  function _pthread_mutex_lock() {}

  function _pthread_mutex_unlock() {}

  
  var ___cxa_caught_exceptions=[];function ___cxa_begin_catch(ptr) {
      __ZSt18uncaught_exceptionv.uncaught_exception--;
      ___cxa_caught_exceptions.push(___cxa_last_thrown_exception);
      return ptr;
    }

  
  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }function __ZSt9terminatev() {
      _exit(-1234);
    }

  function ___cxa_guard_acquire(variable) {
      if (!HEAP8[(variable)]) { // ignore SAFE_HEAP stuff because llvm mixes i64 and i8 here
        HEAP8[(variable)]=1;
        return 1;
      }
      return 0;
    }

  function ___cxa_guard_release() {}

  function _pthread_cond_broadcast() {
      return 0;
    }

  function _pthread_cond_wait() {
      return 0;
    }

  
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }var ___cxa_atexit=_atexit;

  function ___cxa_end_catch() {
      if (___cxa_end_catch.rethrown) {
        ___cxa_end_catch.rethrown = false;
        return;
      }
      // Clear state flag.
      asm['setThrew'](0);
      // Call destructor if one is registered then clear it.
      var ptr = ___cxa_caught_exceptions.pop();
      if (ptr) {
        header = ptr - ___cxa_exception_header_size;
        var destructor = HEAP32[(((header)+(4))>>2)];
        if (destructor) {
          Runtime.dynCall('vi', destructor, [ptr]);
          HEAP32[(((header)+(4))>>2)]=0;
        }
        ___cxa_free_exception(ptr);
        ___cxa_last_thrown_exception = 0;
      }
    }

  var _llvm_memset_p0i8_i64=_memset;


  
  
  
  
  function _mkport() { throw 'TODO' }var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
  
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
  
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
  
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
  
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
  
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
  
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
  
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
  
  
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
  
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
  
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
  
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
  
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
  
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
  
  
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
  
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
  
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
  
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
  
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
  
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
  
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
  
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
  
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
  
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
  
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
  
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
  
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
  
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
  
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
  
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
  
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
  
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
  
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
  
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
  
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
  
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
  
  
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
  
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }
  
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      return FS.getStreamFromPtr(stream).fd;
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var fd = _fileno(stream);
      var bytesWritten = _write(fd, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStreamFromPtr(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }


  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      stream = FS.getStreamFromPtr(stream);
      if (!stream) {
        return -1;
      }
      if (c === -1) {
        // do nothing for EOF character
        return c;
      }
      c = unSign(c & 0xFF);
      stream.ungotten.push(c);
      stream.eof = false;
      return c;
    }

  
  
  
  
  function _recv(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _read(fd, buf, len);
    }
  
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
  
  
      try {
        var slab = HEAP8;
        return FS.read(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) {
        return 0;
      }
      var bytesRead = 0;
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      while (streamObj.ungotten.length && bytesToRead > 0) {
        HEAP8[((ptr++)|0)]=streamObj.ungotten.pop();
        bytesToRead--;
        bytesRead++;
      }
      var err = _read(streamObj.fd, ptr, bytesToRead);
      if (err == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      }
      bytesRead += err;
      if (bytesRead < bytesToRead) streamObj.eof = true;
      return Math.floor(bytesRead / size);
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      var streamObj = FS.getStreamFromPtr(stream);
      if (!streamObj) return -1;
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _fread(_fgetc.ret, 1, 1, stream);
      if (ret == 0) {
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }var _getc=_fgetc;

  function __ZNSt9exceptionD2Ev() {}

  function ___errno_location() {
      return ___errno_state;
    }

   
  Module["_strlen"] = _strlen;

  
  function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          writeAsciiToMemory(msg, strerrbuf);
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }

  function _abort() {
      Module['abort']();
    }

  function ___cxa_rethrow() {
      ___cxa_end_catch.rethrown = true;
      var ptr = ___cxa_caught_exceptions.pop();
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }

  
  
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
  
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
  
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
  
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
  
          // Handle precision.
          var precisionSet = false, precision = -1;
          if (next == 46) {
            precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          }
          if (precision < 0) {
            precision = 6; // Standard default.
            precisionSet = false;
          }
  
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
  
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
  
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
  
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
  
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
  
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
  
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
  
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
  
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
  
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
  
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
  
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
  
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
  
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length;
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }

  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

  function ___cxa_guard_abort() {}

  
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }function _isxdigit_l(chr) {
      return _isxdigit(chr); // no locale support yet
    }

  
  function _isdigit(chr) {
      return chr >= 48 && chr <= 57;
    }function _isdigit_l(chr) {
      return _isdigit(chr); // no locale support yet
    }

  
  
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
  
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
  
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
                if (next === 0) return i > 0 ? fields : fields-1; // we failed to read the full length of this field
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
  
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
  
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
  
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
  
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
  
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
  
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
  
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16);
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text);
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text);
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j];
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }

  function _catopen(name, oflag) {
      // nl_catd catopen (const char *name, int oflag)
      return -1;
    }

  function _catgets(catd, set_id, msg_id, s) {
      // char *catgets (nl_catd catd, int set_id, int msg_id, const char *s)
      return s;
    }

  function _catclose(catd) {
      // int catclose (nl_catd catd)
      return 0;
    }

  function _newlocale(mask, locale, base) {
      return _malloc(4);
    }

  function _freelocale(locale) {
      _free(locale);
    }

  function ___ctype_b_loc() {
      // http://refspecs.freestandards.org/LSB_3.0.0/LSB-Core-generic/LSB-Core-generic/baselib---ctype-b-loc.html
      var me = ___ctype_b_loc;
      if (!me.ret) {
        var values = [
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,8195,8194,8194,8194,8194,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,24577,49156,49156,49156,
          49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,49156,55304,55304,55304,55304,55304,55304,55304,55304,
          55304,55304,49156,49156,49156,49156,49156,49156,49156,54536,54536,54536,54536,54536,54536,50440,50440,50440,50440,50440,
          50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,50440,49156,49156,49156,49156,49156,
          49156,54792,54792,54792,54792,54792,54792,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,50696,
          50696,50696,50696,50696,50696,50696,50696,49156,49156,49156,49156,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,
          0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ];
        var i16size = 2;
        var arr = _malloc(values.length * i16size);
        for (var i = 0; i < values.length; i++) {
          HEAP16[(((arr)+(i * i16size))>>1)]=values[i];
        }
        me.ret = allocate([arr + 128 * i16size], 'i16*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function ___ctype_tolower_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-tolower-loc.html
      var me = ___ctype_tolower_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,91,92,93,94,95,96,97,98,99,100,101,102,103,
          104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,
          134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,
          164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,
          194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,
          224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,
          254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  function ___ctype_toupper_loc() {
      // http://refspecs.freestandards.org/LSB_3.1.1/LSB-Core-generic/LSB-Core-generic/libutil---ctype-toupper-loc.html
      var me = ___ctype_toupper_loc;
      if (!me.ret) {
        var values = [
          128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,
          158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,
          188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,
          218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,
          248,249,250,251,252,253,254,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,
          33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,
          73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,
          81,82,83,84,85,86,87,88,89,90,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,
          145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,
          175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,
          205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,
          235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255
        ];
        var i32size = 4;
        var arr = _malloc(values.length * i32size);
        for (var i = 0; i < values.length; i++) {
          HEAP32[(((arr)+(i * i32size))>>2)]=values[i];
        }
        me.ret = allocate([arr + 128 * i32size], 'i32*', ALLOC_NORMAL);
      }
      return me.ret;
    }

  
  
  function __isLeapYear(year) {
        return year%4 === 0 && (year%100 !== 0 || year%400 === 0);
    }
  
  function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }
  
  
  var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];
  
  var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while(days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
  
        if (days > daysInCurrentMonth-newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth-newDate.getDate()+1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth+1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear()+1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate()+days);
          return newDate;
        }
      }
  
      return newDate;
    }function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html
      
      var date = {
        tm_sec: HEAP32[((tm)>>2)],
        tm_min: HEAP32[(((tm)+(4))>>2)],
        tm_hour: HEAP32[(((tm)+(8))>>2)],
        tm_mday: HEAP32[(((tm)+(12))>>2)],
        tm_mon: HEAP32[(((tm)+(16))>>2)],
        tm_year: HEAP32[(((tm)+(20))>>2)],
        tm_wday: HEAP32[(((tm)+(24))>>2)],
        tm_yday: HEAP32[(((tm)+(28))>>2)],
        tm_isdst: HEAP32[(((tm)+(32))>>2)]
      };
  
      var pattern = Pointer_stringify(format);
  
      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S',                 // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }
  
      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0]+str;
        }
        return str;
      };
  
      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };
  
      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };
  
        var compare;
        if ((compare = sgn(date1.getFullYear()-date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth()-date2.getMonth())) === 0) {
            compare = sgn(date1.getDate()-date2.getDate());
          }
        }
        return compare;
      };
  
      function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0: // Sunday
              return new Date(janFourth.getFullYear()-1, 11, 29);
            case 1: // Monday
              return janFourth;
            case 2: // Tuesday
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3: // Wednesday
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4: // Thursday
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5: // Friday
              return new Date(janFourth.getFullYear()-1, 11, 31);
            case 6: // Saturday
              return new Date(janFourth.getFullYear()-1, 11, 30);
          }
      };
  
      function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear()+1, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            // this date is after the start of the first week of this year
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear()+1;
            } else {
              return thisDate.getFullYear();
            }
          } else { 
            return thisDate.getFullYear()-1;
          }
      };
  
      var EXPANSION_RULES_2 = {
        '%a': function(date) {
          return WEEKDAYS[date.tm_wday].substring(0,3);
        },
        '%A': function(date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function(date) {
          return MONTHS[date.tm_mon].substring(0,3);
        },
        '%B': function(date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function(date) {
          var year = date.tm_year+1900;
          return leadingNulls(Math.floor(year/100),2);
        },
        '%d': function(date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function(date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function(date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.
          
          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function(date) {
          return getWeekBasedYear(date);
        },
        '%H': function(date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function(date) {
          return leadingNulls(date.tm_hour < 13 ? date.tm_hour : date.tm_hour-12, 2);
        },
        '%j': function(date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon-1), 3);
        },
        '%m': function(date) {
          return leadingNulls(date.tm_mon+1, 2);
        },
        '%M': function(date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function() {
          return '\n';
        },
        '%p': function(date) {
          if (date.tm_hour > 0 && date.tm_hour < 13) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function(date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function() {
          return '\t';
        },
        '%u': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year+1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7-janFirst.getDay());
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
          
          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstSundayUntilEndJanuary = 31-firstSunday.getDate();
            var days = firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
  
          return compareByDay(firstSunday, janFirst) === 0 ? '01': '00';
        },
        '%V': function(date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year+1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year+1901, 0, 4);
  
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
  
          var endDate = __addDays(new Date(date.tm_year+1900, 0, 1), date.tm_yday);
  
          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          } 
  
          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }
  
          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year+1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday+32-firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday+1-firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference/7), 2);
        },
        '%w': function(date) {
          var day = new Date(date.tm_year+1900, date.tm_mon+1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function(date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7-janFirst.getDay()+1);
          var endDate = new Date(date.tm_year+1900, date.tm_mon, date.tm_mday);
  
          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth()-1)-31;
            var firstMondayUntilEndJanuary = 31-firstMonday.getDate();
            var days = firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();
            return leadingNulls(Math.ceil(days/7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01': '00';
        },
        '%y': function(date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year+1900).toString().substring(2);
        },
        '%Y': function(date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year+1900;
        },
        '%z': function(date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ),
          // or by no characters if no timezone is determinable. 
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich). 
          // If tm_isdst is zero, the standard time offset is used. 
          // If tm_isdst is greater than zero, the daylight savings time offset is used. 
          // If tm_isdst is negative, no characters are returned. 
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%Z': function(date) {
          // Replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. [ tm_isdst]
          // FIXME: we cannot determine time zone (or can we?)
          return '';
        },
        '%%': function() {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }
  
      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      } 
  
      writeArrayToMemory(bytes, s);
      return bytes.length-1;
    }function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }

  
  
  
  function _isspace(chr) {
      return (chr == 32) || (chr >= 9 && chr <= 13);
    }
  function __parseInt64(str, endptr, base, min, max, unsign) {
      var isNegative = false;
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
  
      // Check for a plus/minus sign.
      if (HEAP8[(str)] == 45) {
        str++;
        isNegative = true;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
  
      // Find base.
      var ok = false;
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            ok = true; // we saw an initial zero, perhaps the entire thing is just "0"
          }
        }
      } else if (finalBase==16) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            str += 2;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      var start = str;
  
      // Get digits.
      var chr;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          str++;
          ok = true;
        }
      }
  
      if (!ok) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return ((asm["setTempRet0"](0),0)|0);
      }
  
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str;
      }
  
      try {
        var numberString = isNegative ? '-'+Pointer_stringify(start, str - start) : Pointer_stringify(start, str - start);
        i64Math.fromString(numberString, finalBase, min, max, unsign);
      } catch(e) {
        ___setErrNo(ERRNO_CODES.ERANGE); // not quite correct
      }
  
      return ((asm["setTempRet0"](((HEAP32[(((tempDoublePtr)+(4))>>2)])|0)),((HEAP32[((tempDoublePtr)>>2)])|0))|0);
    }function _strtoull(str, endptr, base) {
      return __parseInt64(str, endptr, base, 0, '18446744073709551615', true);  // ULONG_MAX.
    }function _strtoull_l(str, endptr, base) {
      return _strtoull(str, endptr, base); // no locale support yet
    }

  
  function _strtoll(str, endptr, base) {
      return __parseInt64(str, endptr, base, '-9223372036854775808', '9223372036854775807');  // LLONG_MIN, LLONG_MAX.
    }function _strtoll_l(str, endptr, base) {
      return _strtoll(str, endptr, base); // no locale support yet
    }

  function _uselocale(locale) {
      return 0;
    }

  var _llvm_va_start=undefined;

  
  
  function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }function _asprintf(s, format, varargs) {
      return _sprintf(-s, format, varargs);
    }function _vasprintf(s, format, va_arg) {
      return _asprintf(s, format, HEAP32[((va_arg)>>2)]);
    }

  function _llvm_va_end() {}

  function _vsnprintf(s, n, format, va_arg) {
      return _snprintf(s, n, format, HEAP32[((va_arg)>>2)]);
    }

  function _vsscanf(s, format, va_arg) {
      return _sscanf(s, format, HEAP32[((va_arg)>>2)]);
    }


  var _fabs=Math_abs;

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }

  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }

  
  function _copysign(a, b) {
      return __reallyNegative(a) === __reallyNegative(b) ? a : -a;
    }var _copysignl=_copysign;

  
  function _fmod(x, y) {
      return x % y;
    }var _fmodl=_fmod;






FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + 5242880;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);

var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiid(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiid"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiid(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiid"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    return Module["dynCall_iiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  try {
    Module["dynCall_viiiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8) {
  try {
    Module["dynCall_viiiiiiii"](index,a1,a2,a3,a4,a5,a6,a7,a8);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    Module["dynCall_viiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=env.___rand_seed|0;var p=env._stdin|0;var q=env.__ZTVN10__cxxabiv117__class_type_infoE|0;var r=env.__ZTVN10__cxxabiv120__si_class_type_infoE|0;var s=env._stderr|0;var t=env._stdout|0;var u=env.__ZTISt9exception|0;var v=env.___dso_handle|0;var w=+env.NaN;var x=+env.Infinity;var y=0;var z=0;var A=0;var B=0;var C=0,D=0,E=0,F=0,G=0.0,H=0,I=0,J=0,K=0.0;var L=0;var M=0;var N=0;var O=0;var P=0;var Q=0;var R=0;var S=0;var T=0;var U=0;var V=global.Math.floor;var W=global.Math.abs;var X=global.Math.sqrt;var Y=global.Math.pow;var Z=global.Math.cos;var _=global.Math.sin;var $=global.Math.tan;var aa=global.Math.acos;var ba=global.Math.asin;var ca=global.Math.atan;var da=global.Math.atan2;var ea=global.Math.exp;var fa=global.Math.log;var ga=global.Math.ceil;var ha=global.Math.imul;var ia=env.abort;var ja=env.assert;var ka=env.asmPrintInt;var la=env.asmPrintFloat;var ma=env.min;var na=env.invoke_viiiii;var oa=env.invoke_viiiiiii;var pa=env.invoke_vi;var qa=env.invoke_vii;var ra=env.invoke_iiiii;var sa=env.invoke_viiiiiid;var ta=env.invoke_ii;var ua=env.invoke_iiii;var va=env.invoke_viii;var wa=env.invoke_viiiiid;var xa=env.invoke_v;var ya=env.invoke_iiiiiiiii;var za=env.invoke_viiiiiiiii;var Aa=env.invoke_viiiiiiii;var Ba=env.invoke_viiiiii;var Ca=env.invoke_iii;var Da=env.invoke_iiiiii;var Ea=env.invoke_viiii;var Fa=env._llvm_lifetime_end;var Ga=env.__scanString;var Ha=env._pthread_mutex_lock;var Ia=env.___cxa_end_catch;var Ja=env._strtoull;var Ka=env._fflush;var La=env._SDL_GetMouseState;var Ma=env._emscripten_asm_const_int;var Na=env._fwrite;var Oa=env._send;var Pa=env._isspace;var Qa=env._read;var Ra=env._isxdigit_l;var Sa=env._SDL_PumpEvents;var Ta=env._fileno;var Ua=env.___cxa_guard_abort;var Va=env._newlocale;var Wa=env.___gxx_personality_v0;var Xa=env._pthread_cond_wait;var Ya=env.___cxa_rethrow;var Za=env._fmod;var _a=env.___resumeException;var $a=env._llvm_va_end;var ab=env._vsscanf;var bb=env._snprintf;var cb=env._fgetc;var db=env.__getFloat;var eb=env._atexit;var fb=env.___cxa_free_exception;var gb=env._isdigit_l;var hb=env.___setErrNo;var ib=env._isxdigit;var jb=env._exit;var kb=env._sprintf;var lb=env.___ctype_b_loc;var mb=env._freelocale;var nb=env._catgets;var ob=env.__isLeapYear;var pb=env._asprintf;var qb=env.___cxa_is_number_type;var rb=env.___cxa_does_inherit;var sb=env.___cxa_guard_acquire;var tb=env.___cxa_begin_catch;var ub=env._emscripten_memcpy_big;var vb=env._recv;var wb=env.__parseInt64;var xb=env.__ZSt18uncaught_exceptionv;var yb=env._SDL_PollEvent;var zb=env.__ZNSt9exceptionD2Ev;var Ab=env._SDL_Init;var Bb=env._mkport;var Cb=env._copysign;var Db=env.__exit;var Eb=env._strftime;var Fb=env.___cxa_throw;var Gb=env._pread;var Hb=env._SDL_SetVideoMode;var Ib=env._SDL_LockSurface;var Jb=env._strtoull_l;var Kb=env.__arraySum;var Lb=env._SDL_UnlockSurface;var Mb=env._strtoll_l;var Nb=env._SDL_Flip;var Ob=env.___cxa_find_matching_catch;var Pb=env._fread;var Qb=env.__formatString;var Rb=env._pthread_cond_broadcast;var Sb=env.__ZSt9terminatev;var Tb=env._pthread_mutex_unlock;var Ub=env.___cxa_call_unexpected;var Vb=env._sbrk;var Wb=env.___errno_location;var Xb=env._strerror;var Yb=env._catclose;var Zb=env._llvm_lifetime_start;var _b=env.___cxa_guard_release;var $b=env._ungetc;var ac=env._uselocale;var bc=env._vsnprintf;var cc=env._sscanf;var dc=env._sysconf;var ec=env._srand;var fc=env._strftime_l;var gc=env._abort;var hc=env._isdigit;var ic=env._strtoll;var jc=env.__addDays;var kc=env._fabs;var lc=env.__reallyNegative;var mc=env._SDL_MapRGBA;var nc=env._write;var oc=env.___cxa_allocate_exception;var pc=env._vasprintf;var qc=env._emscripten_set_main_loop;var rc=env._catopen;var sc=env.___ctype_toupper_loc;var tc=env.___ctype_tolower_loc;var uc=env._pwrite;var vc=env._strerror_r;var wc=env._time;var xc=0.0;
// EMSCRIPTEN_START_FUNCS
function Qc(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function Rc(){return i|0}function Sc(a){a=a|0;i=a}function Tc(a,b){a=a|0;b=b|0;if((y|0)==0){y=a;z=b}}function Uc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function Vc(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function Wc(a){a=a|0;L=a}function Xc(a){a=a|0;M=a}function Yc(a){a=a|0;N=a}function Zc(a){a=a|0;O=a}function _c(a){a=a|0;P=a}function $c(a){a=a|0;Q=a}function ad(a){a=a|0;R=a}function bd(a){a=a|0;S=a}function cd(a){a=a|0;T=a}function dd(a){a=a|0;U=a}function ed(){c[2108]=q+8;c[2110]=r+8;c[2112]=u;c[2114]=r+8;c[2116]=u;c[2118]=r+8;c[2120]=u;c[2122]=r+8;c[2126]=r+8;c[2128]=u;c[2130]=q+8;c[2164]=r+8;c[2168]=r+8;c[2232]=r+8;c[2236]=r+8;c[2256]=q+8;c[2258]=r+8;c[2294]=r+8;c[2298]=r+8;c[2334]=r+8;c[2338]=r+8;c[2358]=q+8;c[2360]=q+8;c[2362]=r+8;c[2366]=r+8;c[2370]=r+8;c[2374]=q+8;c[2376]=q+8;c[2378]=q+8;c[2380]=q+8;c[2382]=q+8;c[2384]=q+8;c[2386]=q+8;c[2412]=r+8;c[2416]=q+8;c[2418]=r+8;c[2422]=r+8;c[2426]=r+8;c[2430]=q+8;c[2432]=q+8;c[2434]=q+8;c[2436]=q+8;c[2470]=q+8;c[2472]=q+8;c[2474]=q+8;c[2476]=r+8;c[2480]=r+8;c[2484]=r+8;c[2488]=r+8;c[2492]=r+8;c[2496]=r+8}function fd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+112|0;k=b;j=i;i=i+12|0;i=i+7&-8;c[j>>2]=c[k>>2];c[j+4>>2]=c[k+4>>2];c[j+8>>2]=c[k+8>>2];j=f|0;b=f+32|0;k=f+48|0;l=f+64|0;g=f+80|0;h=f+96|0;u=((wn()|0)%20|0|0)==0;m=wn()|0;if(u){a=Ad(a,d,e)|0;c[a>>2]=(m&3|0)==0?20:0;u=1;i=f;return u|0}c[(Ad(a,d,e)|0)+8>>2]=m;u=d-1|0;p=Ad(a,u,e-1|0)|0;c[j>>2]=p;p=(p|0)!=0|0;t=Ad(a,u,e)|0;c[j+(p<<2)>>2]=t;p=((t|0)!=0)+p|0;u=Ad(a,u,e+1|0)|0;c[j+(p<<2)>>2]=u;p=((u|0)!=0)+p|0;u=Ad(a,d,e-1|0)|0;c[j+(p<<2)>>2]=u;p=((u|0)!=0)+p|0;u=Ad(a,d,e+1|0)|0;c[j+(p<<2)>>2]=u;p=((u|0)!=0)+p|0;u=d+1|0;t=Ad(a,u,e-1|0)|0;c[j+(p<<2)>>2]=t;p=((t|0)!=0)+p|0;t=Ad(a,u,e)|0;c[j+(p<<2)>>2]=t;p=((t|0)!=0)+p|0;u=Ad(a,u,e+1|0)|0;c[j+(p<<2)>>2]=u;p=((u|0)!=0)+p|0;a:do{if((p|0)>0){q=b;r=a+16|0;s=k;t=l;u=h;o=0;b:while(1){m=c[j+(o<<2)>>2]|0;c:do{switch(c[m>>2]|0){case 12:case 13:{yd(b,19);n=m;c[n>>2]=c[q>>2];c[n+4>>2]=c[q+4>>2];c[n+8>>2]=c[q+8>>2];c[m+4>>2]=c[r>>2];break};case 10:{n=(wn()|0)%50|0;if((n|0)==0){yd(k,21);n=m;c[n>>2]=c[s>>2];c[n+4>>2]=c[s+4>>2];c[n+8>>2]=c[s+8>>2];c[m+4>>2]=c[r>>2];break c}if((n|0)>=10){break c}yd(l,19);n=m;c[n>>2]=c[t>>2];c[n+4>>2]=c[t+4>>2];c[n+8>>2]=c[t+8>>2];c[m+4>>2]=c[r>>2];break};case 1:{break b};case 15:{yd(h,19);n=m;c[n>>2]=c[u>>2];c[n+4>>2]=c[u+4>>2];c[n+8>>2]=c[u+8>>2];c[m+4>>2]=c[r>>2];break};default:{}}}while(0);o=o+1|0;if((o|0)>=(p|0)){break a}}yd(g,3);u=m;t=g;c[u>>2]=c[t>>2];c[u+4>>2]=c[t+4>>2];c[u+8>>2]=c[t+8>>2];c[(Ad(a,d,e)|0)>>2]=20;c[m+4>>2]=c[r>>2];u=1;i=f;return u|0}}while(0);u=(wn()|0)&1^1;i=f;return u|0}function gd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+16|0;g=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];b=f|0;if(((wn()|0)%100|0|0)!=0){g=0;i=f;return g|0}g=Ad(a,d,e)|0;yd(b,14);c[g>>2]=c[b>>2];c[g+4>>2]=c[b+4>>2];c[g+8>>2]=c[b+8>>2];g=1;i=f;return g|0}function hd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+32|0;k=b;g=i;i=i+12|0;i=i+7&-8;c[g>>2]=c[k>>2];c[g+4>>2]=c[k+4>>2];c[g+8>>2]=c[k+8>>2];g=f|0;b=f+16|0;a:do{if(((wn()|0)&63|0)==0){h=e-1|0;j=g|0;k=0;do{zd(g,a,d,h-k|0);k=k+1|0;if((c[j>>2]|0)==0){break a}}while((k|0)<10);k=Ad(a,d,e)|0;yd(b,18);j=b;c[k>>2]=c[j>>2];c[k+4>>2]=c[j+4>>2];c[k+8>>2]=c[j+8>>2]}}while(0);k=(wn()|0)&1^1;i=f;return k|0}function id(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+16|0;h=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[h>>2];c[b+4>>2]=c[h+4>>2];c[b+8>>2]=c[h+8>>2];b=f|0;h=-1;a:while(1){j=h+d|0;if((h|0)==0){k=-1;while(1){if((k|0)==0){k=k+1|0;continue}l=k+e|0;m=Ad(a,j,l)|0;if((m|0)!=0){m=m|0;do{if((k|0)==-1){if((c[m>>2]|0)!=0){break}if(((wn()|0)%5|0|0)!=0){break}yd(b,19);Bd(a,b,j,l)}}while(0);if((c[m>>2]|0)!=2){break a}}k=k+1|0;if((k|0)>=2){break}}}else{k=-1;do{do{if((k|h|0)!=0){l=Ad(a,j,k+e|0)|0;if((l|0)==0){break}if((c[l>>2]|0)!=2){break a}}}while(0);k=k+1|0;}while((k|0)<2)}h=h+1|0;if((h|0)>=2){e=1;g=18;break}}if((g|0)==18){i=f;return e|0}m=((wn()|0)%3|0|0)!=0|0;i=f;return m|0}function jd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+48|0;g=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];b=f|0;g=f+16|0;h=f+32|0;if(((wn()|0)&1|0)!=0){yd(b,0);Bd(a,b,d,e);h=1;i=f;return h|0}if(((wn()|0)&1|0)!=0){yd(g,20);Bd(a,g,d,e);h=1;i=f;return h|0}if(((wn()|0)&1|0)==0){h=0;i=f;return h|0}yd(h,19);Bd(a,h,d,e);h=1;i=f;return h|0}function kd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;j=b;h=i;i=i+12|0;i=i+7&-8;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];h=g|0;b=g+16|0;j=-1;a:while(1){k=j+d|0;l=-1;do{m=l+e|0;n=Ad(a,k,m)|0;if(!((l|j|0)==0|(n|0)==0)){if((c[n>>2]|0)==30){break a}}l=l+1|0;}while((l|0)<2);j=j+1|0;if((j|0)>=2){e=0;f=8;break}}if((f|0)==8){i=g;return e|0}yd(h,19);Bd(a,h,k,m);yd(b,19);Bd(a,b,d,e);n=1;i=g;return n|0}function ld(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+32|0;j=b;h=i;i=i+12|0;i=i+7&-8;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];h=g|0;b=g+16|0;j=-1;a:while(1){k=j+d|0;l=-1;do{m=l+e|0;n=Ad(a,k,m)|0;if(!((l|j|0)==0|(n|0)==0)){if((c[n>>2]|0)==29){break a}}l=l+1|0;}while((l|0)<2);j=j+1|0;if((j|0)>=2){e=0;f=8;break}}if((f|0)==8){i=g;return e|0}yd(h,32);Bd(a,h,k,m);yd(b,32);Bd(a,b,d,e);n=1;i=g;return n|0}function md(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+32|0;g=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[g>>2];c[b+4>>2]=c[g+4>>2];c[b+8>>2]=c[g+8>>2];b=f|0;g=f+16|0;l=-1;a:while(1){j=l+d|0;k=-1;do{h=k+e|0;m=Ad(a,j,h)|0;if(!((k|l|0)==0|(m|0)==0)){m=c[m>>2]|0;if((m|0)==1){a=1;k=11;break a}else if((m|0)==30){k=5;break a}}k=k+1|0;}while((k|0)<2);l=l+1|0;if((l|0)>=2){a=0;k=11;break}}if((k|0)==5){yd(b,0);Bd(a,b,j,h);if(((wn()|0)&3|0)==0){yd(g,33)}else{yd(g,0)}Bd(a,g,d,e);m=1;i=f;return m|0}else if((k|0)==11){i=f;return a|0}return 0}function nd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+16|0;h=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[h>>2];c[b+4>>2]=c[h+4>>2];c[b+8>>2]=c[h+8>>2];b=g|0;h=-1;a:while(1){j=h+d|0;k=-1;do{l=Ad(a,j,k+e|0)|0;if(!((k|h|0)==0|(l|0)==0)){if((c[l>>2]|0)==1){break a}}k=k+1|0;}while((k|0)<2);h=h+1|0;if((h|0)>=2){a=0;f=8;break}}if((f|0)==8){i=g;return a|0}yd(b,0);Bd(a,b,d,e);l=1;i=g;return l|0}function od(){var a=0,b=0,d=0,e=0,f=0,g=0;a=i;i=i+32|0;b=a|0;d=a+16|0;g=c[2514]|0;if((g|0)<=0){i=a;return}e=0;f=c[2515]|0;do{if((f|0)>0){g=0;do{if((g|0)<(((f|0)/6|0)*3|0|0)){yd(d,0);Bd(10056,d,e,g)}else{yd(b,(((g|0)/3|0)&1|0)!=0?4:9);Bd(10056,b,e,g)}g=g+1|0;f=c[2515]|0;}while((g|0)<(f|0));g=c[2514]|0}e=e+1|0;}while((e|0)<(g|0));i=a;return}function pd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;i=i+528|0;K=b|0;J=b+16|0;I=b+32|0;H=b+48|0;G=b+64|0;F=b+80|0;E=b+96|0;D=b+112|0;C=b+128|0;B=b+144|0;A=b+160|0;z=b+176|0;y=b+192|0;x=b+208|0;w=b+224|0;v=b+240|0;u=b+256|0;t=b+272|0;s=b+288|0;r=b+304|0;q=b+320|0;p=b+336|0;o=b+352|0;n=b+368|0;m=b+384|0;l=b+400|0;k=b+416|0;j=b+432|0;h=b+448|0;g=b+464|0;f=b+480|0;e=b+496|0;d=b+512|0;Cd(10056,a,a);od();Dd(10056,34,1,5,0);Fd(K,2,99);Ed(10056,5,K);Fd(J,2,99);Ed(10056,6,J);Fd(I,1,30);Ed(10056,9,I);Fd(H,2,99);Ed(10056,7,H);Fd(G,1,30);Ed(10056,8,G);Fd(F,2,99);Ed(10056,25,F);Fd(E,1,30);Ed(10056,26,E);Fd(D,1,30);Ed(10056,4,D);Fd(C,0,10);Ed(10056,1,C);Fd(B,3,1);Ed(10056,3,B);Fd(A,2,99);Ed(10056,24,A);Gd(z,0,30,4);Ed(10056,2,z);Fd(y,2,99);Ed(10056,10,y);Fd(x,2,99);Ed(10056,12,x);Fd(w,2,99);Ed(10056,13,w);Gd(v,1,30,22);Ed(10056,16,v);Fd(u,1,30);Ed(10056,11,u);Fd(t,4,30);Ed(10056,14,t);Fd(s,4,30);Ed(10056,15,s);Fd(r,2,99);Ed(10056,18,r);Gd(q,1,30,16);Ed(10056,17,q);Gd(p,3,1,2);Ed(10056,19,p);Fd(o,3,1);Ed(10056,20,o);Fd(n,1,30);Ed(10056,21,n);Fd(m,1,30);Ed(10056,27,m);Gd(l,0,10,10);Ed(10056,29,l);Fd(k,0,10);Ed(10056,30,k);Gd(j,0,10,18);Ed(10056,31,j);Gd(h,0,10,20);Ed(10056,32,h);Gd(g,0,10,26);Ed(10056,33,g);Gd(f,0,10,8);Ed(10056,28,f);Fd(e,2,99);Ed(10056,22,e);Fd(d,1,30);Ed(10056,23,d);c[2522]=5;c[2521]=0;i=b;return}function qd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0.0,n=0;g=i;i=i+80|0;f=g|0;n=g+16|0;j=g+32|0;k=g+48|0;l=g+64|0;zd(f,10056,a,b);zd(n,10056,a+1|0,b);zd(j,10056,a-1|0,b);zd(k,10056,a,b+1|0);zd(l,10056,a,b-1|0);a=c[n>>2]|0;b=c[f>>2]|0;do{if((a|0)==(b|0)){if((c[j>>2]|0)!=(a|0)){h=5;break}if((c[k>>2]|0)!=(a|0)){h=5;break}if((c[l>>2]|0)==(a|0)){j=0}else{h=5}}else{h=5}}while(0);if((h|0)==5){j=1}c[e>>2]=j;m=(j|0)!=0?.8999999761581421:1.0;if((b|0)==4){n=~~(m*255.0);c[d>>2]=mc(c[(c[2512]|0)+4>>2]|0,n|0,n|0,0,0)|0;i=g;return}else if((b|0)==9){n=~~(m*(+(c[f+8>>2]|0)/16777215.0/10.0+204.0));c[d>>2]=mc(c[(c[2512]|0)+4>>2]|0,n|0,n|0,n|0,0)|0;i=g;return}else if((b|0)==1){c[d>>2]=mc(c[(c[2512]|0)+4>>2]|0,0,0,~~(m*255.0)|0,0)|0;i=g;return}else{c[d>>2]=mc(c[(c[2512]|0)+4>>2]|0,127,-52|0,-1|0,0)|0;i=g;return}}function rd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;g=i;i=i+112|0;h=g|0;m=g+16|0;j=g+32|0;k=g+48|0;r=g+64|0;n=g+80|0;o=g+96|0;zd(h,b,d,e);h=c[h>>2]|0;if((Hd(b,h,2)|0)!=0){i=g;return}if((h|0)==0|(d|0)<0|(e|0)<0){i=g;return}t=b|0;if((c[t>>2]|0)<=(d|0)){i=g;return}s=b+4|0;if((c[s>>2]|0)<=(e|0)){i=g;return}h=(f+1|0)>>>0<3>>>0;if((f&1|0)!=0){u=r|0;v=0;q=(h&1^1)+e|0;p=(h&1)+d|0;a:while(1){while(1){if(h){if((p|0)>=(c[t>>2]|0)){r=44;break a}}else{if((q|0)>=(c[s>>2]|0)){r=44;break a}}zd(r,b,p,q);w=v+1|0;if((v|0)>=(a|0)){r=44;break a}if((Hd(b,c[u>>2]|0,2)|0)!=0){r=44;break a}if((c[u>>2]|0)==0){r=36;break a}if(h){break}else{v=w;q=q+1|0}}v=w;p=p+1|0}if((r|0)==36){j=h&1;k=(f&-2|0)==2|0;m=q+((h^1)<<31>>31)|0;a=p+(h<<31>>31)|0;b:while(1){l=(a|0)<(d|0);f=a+j|0;while(1){if(h){if(l){break b}}else{if((m|0)<(e|0)){break b}}zd(n,b,a,m);Bd(b,n,f,m+k|0);if(h){break}else{m=m-1|0}}a=a-1|0}yd(o,0);Bd(b,o,f,m+k|0);i=g;return}else if((r|0)==44){i=g;return}}o=m|0;r=0;p=((h^1)<<31>>31)+e|0;n=(h<<31>>31)+d|0;c:while(1){q=(n|0)>-1;while(1){if(h){if(!q){r=44;break c}}else{if(!((p|0)>-1)){r=44;break c}}zd(m,b,n,p);s=r+1|0;if((r|0)>=(a|0)){r=44;break c}if((Hd(b,c[o>>2]|0,2)|0)!=0){r=44;break c}if((c[o>>2]|0)==0){r=16;break c}if(h){break}else{r=s;p=p-1|0}}r=s;n=n-1|0}if((r|0)==16){m=p+(h&1^1)|0;o=h&1;f=(f&-2|0)==2|0;a=n+(h&1)|0;while(1){p=(a|0)>(d|0);n=a-o|0;if(!h){r=18;break}if(p){l=m;break}zd(j,b,a,m);Bd(b,j,n,m-f|0);a=a+1|0}d:do{if((r|0)==18){if(p){l=m;while(1){if((l|0)>(e|0)){break d}zd(j,b,a,l);Bd(b,j,n,l-f|0);l=l+1|0}}else{l=m;while(1){if((l|0)>(e|0)){break d}zd(j,b,a,l);Bd(b,j,n,l-f|0);l=l+1|0}}}}while(0);yd(k,0);Bd(b,k,n,l-f|0);i=g;return}else if((r|0)==44){i=g;return}}function sd(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;m=i;i=i+32|0;l=m|0;h=m+8|0;j=m+16|0;k=m+24|0;c[j>>2]=b;c[k>>2]=d;if(!((d|0)!=(f|0)|(b|0)!=(e|0))){i=m;return}n=0;do{o=f-d|0;do{if((o|0)<0){n=2}else{if((o|0)>0){n=3;break}o=e-b|0;if((o|0)<0){n=0;break}n=(o|0)>0?1:n}}while(0);r=c[4]|0;q=-r|0;s=n+1|0;if((r|0)>=(q|0)){t=s>>>0>2>>>0;p=t?l:h;o=(n&1|0)!=0;u=t?h:l;t=q;while(1){v=q;while(1){c[p>>2]=t;c[u>>2]=o?-v|0:v;x=c[l>>2]|0;w=c[h>>2]|0;xd(g,r,x,w+1|0)|0;xd(g,r,x,w-1|0)|0;xd(g,r,x+1|0,w)|0;xd(g,r,x-1|0,w)|0;if(xd(g,r,x,w)|0){rd(8,a,b+x|0,d+w|0,n)}if((v|0)<(r|0)){v=v+1|0}else{break}}if((t|0)<(r|0)){t=t+1|0}else{break}}}d=s>>>0<3>>>0?j:k;c[d>>2]=(n<<1&2)-1+(c[d>>2]|0);d=c[k>>2]|0;b=c[j>>2]|0;}while((d|0)!=(f|0)|(b|0)!=(e|0));i=m;return}function td(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=i;i=i+32|0;h=f|0;g=f+16|0;d=(d&1)!=0;if(d&(e|0)==3){sd(10056,c[2542]|0,c[2540]|0,a,b,c[16]|0);g=c[16]|0;m=c[4]|0;k=-m|0;if((m|0)<(k|0)){c[2542]=a;c[2540]=b;i=f;return}else{j=k}while(1){h=j+1|0;l=j-1|0;d=j+b|0;n=k;while(1){xd(g,m,n,h)|0;xd(g,m,n,l)|0;e=n+1|0;xd(g,m,e,j)|0;xd(g,m,n-1|0,j)|0;if(xd(g,m,n,j)|0){Id(10056,n+a|0,d)}if((n|0)<(m|0)){n=e}else{break}}if((j|0)<(m|0)){j=h}else{break}}c[2542]=a;c[2540]=b;i=f;return}if(!d){c[2542]=a;c[2540]=b;i=f;return}if((e|0)==1){m=9}else if((e|0)==2){m=0}else if((e|0)==6){m=1}else if((e|0)==0){m=4}else{m=1}k=c[16]|0;l=c[4]|0;j=-l|0;if((l|0)<(j|0)){c[2542]=a;c[2540]=b;i=f;return}d=h|0;n=(e|0)==2;e=j;while(1){s=e+1|0;r=e-1|0;t=e+b|0;q=j;while(1){xd(k,l,q,s)|0;xd(k,l,q,r)|0;o=q+1|0;xd(k,l,o,e)|0;xd(k,l,q-1|0,e)|0;do{if(xd(k,l,q,e)|0){p=q+a|0;zd(h,10056,p,t);if(!((c[d>>2]|0)==0|(c[2524]|0)!=0|n)){break}yd(g,m);Bd(10056,g,p,t)}}while(0);if((q|0)<(l|0)){q=o}else{break}}if((e|0)<(l|0)){e=s}else{break}}c[2542]=a;c[2540]=b;i=f;return}function ud(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0.0;n=c[16]|0;e=c[4]|0;f=-e|0;if((e|0)<(f|0)){return}else{g=f}while(1){d=g+1|0;o=g-1|0;l=g+b|0;m=(l|0)<64;k=l<<10;h=k|256;i=k|512;j=k|768;p=f;while(1){v=xd(n,e,p,d)|0;u=xd(n,e,p,o)|0;q=p+1|0;s=xd(n,e,q,g)|0;t=xd(n,e,p-1|0,g)|0;do{if(xd(n,e,p,g)|0){r=p+a|0;if(v&u&t){s=s&1^1}else{s=1}if(!((r|l|0)>-1&(r|0)<64&m)){break}u=r<<2;r=c[2512]|0;t=u+k|0;w=(s|0)!=0?.800000011920929:.8999999761581421;s=~~(w*0.0);v=~~(w*+(c[(c[r+20>>2]|0)+(t<<2)>>2]&255|0));r=mc(c[r+4>>2]|0,s|0,v|0,v|0,s|0)|0;s=c[(c[2512]|0)+20>>2]|0;c[s+(t<<2)>>2]=r;c[s+(u+h<<2)>>2]=r;c[s+(u+i<<2)>>2]=r;c[s+(u+j<<2)>>2]=r;v=u|1;c[s+(v+k<<2)>>2]=r;c[s+(v+h<<2)>>2]=r;c[s+(v+i<<2)>>2]=r;c[s+(v+j<<2)>>2]=r;v=u|2;c[s+(v+k<<2)>>2]=r;c[s+(v+h<<2)>>2]=r;c[s+(v+i<<2)>>2]=r;c[s+(v+j<<2)>>2]=r;v=u|3;c[s+(v+k<<2)>>2]=r;c[s+(v+h<<2)>>2]=r;c[s+(v+i<<2)>>2]=r;c[s+(v+j<<2)>>2]=r}}while(0);if((p|0)<(e|0)){p=q}else{break}}if((g|0)<(e|0)){g=d}else{break}}return}function vd(){var a=0,b=0,d=0,e=0,f=0,h=0,j=0,k=0,l=0,m=0,n=0.0,o=0,p=0,q=0,r=0,s=0;a=i;i=i+64|0;f=a|0;d=a+48|0;b=a+56|0;Sa();Ib(c[2512]|0)|0;m=Ma(2216,0)|0;c[2524]=Ma(2192,0)|0;c[4]=Ma(1608,0)|0;c[16]=Ma(1104,0)|0;l=La(10136,10128)|0;td((c[2534]|0)/4|0,(c[2532]|0)/4|0,l,m);Kd(10056,0,0,c[2514]|0,c[2515]|0);l=La(10136,10128)|0;td((c[2534]|0)/4|0,(c[2532]|0)/4|0,l,m);Kd(10056,0,0,c[2514]|0,c[2515]|0);if((yb(f|0)|0)!=0){h=f|0;e=f+16|0;do{do{if((c[h>>2]|0)==768){if((c[e>>2]|0)!=99){break}od()}}while(0);}while((yb(f|0)|0)!=0)}h=c[2514]|0;if((h|0)<=0){l=c[2534]|0;l=(l|0)/4|0;m=c[2532]|0;m=(m|0)/4|0;ud(l,m);m=c[2512]|0;Lb(m|0);m=c[2512]|0;Nb(m|0)|0;n=+g[2];n=n+.1;g[2]=n;i=a;return}e=0;f=c[2515]|0;do{if((f|0)>0){m=e<<2;l=m|1;j=m|2;k=m|3;h=0;do{qd(e,h,b,d);p=c[b>>2]|0;s=h<<10;o=c[(c[2512]|0)+20>>2]|0;c[o+(s+m<<2)>>2]=p;r=s|256;c[o+(r+m<<2)>>2]=p;q=s|512;c[o+(q+m<<2)>>2]=p;f=s|768;c[o+(f+m<<2)>>2]=p;c[o+(s+l<<2)>>2]=p;c[o+(r+l<<2)>>2]=p;c[o+(q+l<<2)>>2]=p;c[o+(f+l<<2)>>2]=p;c[o+(s+j<<2)>>2]=p;c[o+(r+j<<2)>>2]=p;c[o+(q+j<<2)>>2]=p;c[o+(f+j<<2)>>2]=p;c[o+(s+k<<2)>>2]=p;c[o+(r+k<<2)>>2]=p;c[o+(q+k<<2)>>2]=p;c[o+(f+k<<2)>>2]=p;h=h+1|0;f=c[2515]|0;}while((h|0)<(f|0));h=c[2514]|0}e=e+1|0;}while((e|0)<(h|0));r=c[2534]|0;r=(r|0)/4|0;s=c[2532]|0;s=(s|0)/4|0;ud(r,s);s=c[2512]|0;Lb(s|0);s=c[2512]|0;Nb(s|0)|0;n=+g[2];n=n+.1;g[2]=n;i=a;return}function wd(a,b){a=a|0;b=b|0;ec(wc(0)|0);Ab(32)|0;c[2512]=Hb(256,256,32,0)|0;pd(64,0);qc(2,30,1);return 0}function xd(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=-b|0;if((c|0)<(e|0)|(d|0)<(e|0)|(c|0)>(b|0)|(d|0)>(b|0)){e=0;return e|0}do{if((a|0)==1){if(((ha(d,d)|0)+(ha(c,c)|0)|0)>(ha(b,b)|0)){break}else{d=1}return d|0}else if((a|0)==2){if(+(((c|0)>-1?c:-c|0)|0)<+(b|0)*.5+ +(d|0)*.5){d=1}else{break}return d|0}else if((a|0)==0){e=1;return e|0}}while(0);e=0;return e|0}function yd(a,b){a=a|0;b=b|0;var d=0;c[a>>2]=b;d=c[2510]|0;b=(d^61^d>>>16)*9|0;b=ha(b>>>4^b,668265261)|0;c[2510]=d+1;c[a+8>>2]=b>>>15^b;c[a+4>>2]=0;return}function zd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;if((c[b+28>>2]|0)!=0){f=c[b>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((e|0)<0){c[a>>2]=0;f=c[2510]|0;d=(f^61^f>>>16)*9|0;d=ha(d>>>4^d,668265261)|0;c[2510]=f+1;c[a+8>>2]=d>>>15^d;c[a+4>>2]=0;return}do{if((d|e|0)>=0){f=c[b>>2]|0;if((d|0)>=(f|0)){break}if((c[b+4>>2]|0)<=(e|0)){break}f=(ha(f,e)|0)+d|0;d=a;f=(c[b+8>>2]|0)+(f*12|0)|0;c[d>>2]=c[f>>2];c[d+4>>2]=c[f+4>>2];c[d+8>>2]=c[f+8>>2];return}}while(0);c[a>>2]=c[b+32>>2];f=c[2510]|0;d=(f^61^f>>>16)*9|0;d=ha(d>>>4^d,668265261)|0;c[2510]=f+1;c[a+8>>2]=d>>>15^d;c[a+4>>2]=0;return}function Ad(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[a+28>>2]|0)!=0){e=c[a>>2]|0;if((b|0)<0){do{b=b+e|0;}while((b|0)<0)}while(1){if((b|0)<(e|0)){break}else{b=b-e|0}}}if((b|d|0)<0){b=0;return b|0}e=c[a>>2]|0;if((b|0)>=(e|0)){b=0;return b|0}if((c[a+4>>2]|0)<=(d|0)){b=0;return b|0}b=(ha(e,d)|0)+b|0;b=(c[a+8>>2]|0)+(b*12|0)|0;return b|0}function Bd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;h=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[h>>2];c[b+4>>2]=c[h+4>>2];c[b+8>>2]=c[h+8>>2];if((c[a+28>>2]|0)==0){g=d}else{g=c[a>>2]|0;if((d|0)<0){do{d=d+g|0;}while((d|0)<0)}while(1){if((d|0)<(g|0)){g=d;break}else{d=d-g|0}}}if((g|e|0)<0){i=f;return}h=a|0;d=c[h>>2]|0;if((g|0)>=(d|0)){i=f;return}if((c[a+4>>2]|0)<=(e|0)){i=f;return}j=(ha(d,e)|0)+g|0;d=a+8|0;j=(c[d>>2]|0)+(j*12|0)|0;c[j>>2]=c[b>>2];c[j+4>>2]=c[b+4>>2];c[j+8>>2]=c[b+8>>2];h=(ha(c[h>>2]|0,e)|0)+g|0;c[(c[d>>2]|0)+(h*12|0)+4>>2]=c[a+16>>2];i=f;return}function Cd(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;c[a>>2]=b;c[a+4>>2]=d;d=ha(d,b)|0;e=d*12|0;f=_m(e)|0;c[a+8>>2]=f;d=d<<3;b=_m(d)|0;c[a+12>>2]=b;zn(f|0,0,e|0)|0;zn(b|0,0,d|0)|0;c[a+16>>2]=0;return}function Dd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0;c[a+20>>2]=b;b=b*12|0;g=_m(b)|0;c[a+24>>2]=g;zn(g|0,0,b|0)|0;c[a+28>>2]=d;c[a+32>>2]=e;c[a+36>>2]=f;return}function Ed(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;g=d;f=i;i=i+12|0;i=i+7&-8;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];d=(c[a+24>>2]|0)+(b*12|0)|0;a=f;c[d>>2]=c[a>>2];c[d+4>>2]=c[a+4>>2];c[d+8>>2]=c[a+8>>2];i=e;return}function Fd(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=b;c[a+4>>2]=d;c[a+8>>2]=0;return}function Gd(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;c[a>>2]=b;c[a+4>>2]=d;c[a+8>>2]=e;return}function Hd(a,b,d){a=a|0;b=b|0;d=d|0;return(c[(c[a+24>>2]|0)+(b*12|0)>>2]|0)==(d|0)|0}function Id(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((c[a+28>>2]|0)==0){e=b}else{e=c[a>>2]|0;if((b|0)<0){do{b=b+e|0;}while((b|0)<0)}while(1){if((b|0)<(e|0)){e=b;break}else{b=b-e|0}}}if((e|d|0)<0){return}b=c[a>>2]|0;if((e|0)>=(b|0)){return}if((c[a+4>>2]|0)<=(d|0)){return}e=(ha(b,d)|0)+e|0;d=c[a+8>>2]|0;if((d+(e*12|0)|0)==0){return}c[d+(e*12|0)+4>>2]=(c[a+16>>2]|0)+1;return}function Jd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;g=i;i=i+208|0;y=b;b=i;i=i+12|0;i=i+7&-8;c[b>>2]=c[y>>2];c[b+4>>2]=c[y+4>>2];c[b+8>>2]=c[y+8>>2];y=g|0;o=g+16|0;x=g+32|0;p=g+48|0;z=g+64|0;r=g+80|0;B=g+96|0;q=g+112|0;n=g+128|0;k=g+144|0;u=g+160|0;l=g+176|0;m=g+192|0;F=f|0;h=c[F>>2]|0;s=(h|0)==3?-1:1;if((h|0)==2){i=g;return}f=c[b>>2]|0;D=a+24|0;w=c[(c[D>>2]|0)+(f*12|0)+4>>2]|0;H=c[2510]|0;v=(H^61^H>>>16)*9|0;v=ha(v>>>4^v,668265261)|0;A=H+1|0;v=(v>>>15^v)&1;A=(A^61^A>>>16)*9|0;A=ha(A>>>4^A,668265261)|0;c[2510]=H+2;A=(A>>>15^A)&1;do{if((h|0)==1|(h|0)==0|(h|0)==3|(h|0)==4){j=s+e|0;zd(n,a,d,j);h=c[n>>2]|0;if((c[(c[D>>2]|0)+(h*12|0)+4>>2]|0)>=(w|0)){h=c[F>>2]|0;break}m=c[b+4>>2]|0;o=c[b+8>>2]|0;k=c[n+4>>2]|0;l=c[n+8>>2]|0;p=a+28|0;n=c[p>>2]|0;if((n|0)==0){r=d}else{q=c[a>>2]|0;if((d|0)<0){r=d;do{r=r+q|0;}while((r|0)<0)}else{r=d}while(1){if((r|0)<(q|0)){break}else{r=r-q|0}}}do{if((r|j|0)>=0){q=a|0;b=c[q>>2]|0;if((r|0)>=(b|0)){break}if((c[a+4>>2]|0)<=(j|0)){break}n=(ha(b,j)|0)+r|0;H=a+8|0;G=c[H>>2]|0;c[G+(n*12|0)>>2]=f;c[G+(n*12|0)+4>>2]=m;c[G+(n*12|0)+8>>2]=o;n=(ha(c[q>>2]|0,j)|0)+r|0;c[(c[H>>2]|0)+(n*12|0)+4>>2]=c[a+16>>2];n=c[p>>2]|0}}while(0);if((n|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}f=a|0;j=c[f>>2]|0;if((d|0)>=(j|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(j,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=h;c[F+(H*12|0)+4>>2]=k;c[F+(H*12|0)+8>>2]=l;H=(ha(c[f>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}}while(0);do{if((h|0)==1|(h|0)==0|(h|0)==3){C=d-1|0;n=s+e|0;zd(k,a,C,n);h=c[k>>2]|0;j=c[k+4>>2]|0;k=c[k+8>>2]|0;E=d+1|0;zd(u,a,E,n);s=c[u>>2]|0;t=c[u+4>>2]|0;u=c[u+8>>2]|0;H=c[D>>2]|0;G=(c[H+(h*12|0)+4>>2]|0)<(w|0);H=(c[H+(s*12|0)+4>>2]|0)<(w|0);if(G&H){l=c[b+4>>2]|0;m=c[b+8>>2]|0;p=a+28|0;o=c[p>>2]|0;q=(o|0)==0;if((v|0)==0){if(!q){q=c[a>>2]|0;if((d|0)<1){do{C=C+q|0;}while((C|0)<0)}while(1){if((C|0)<(q|0)){break}else{C=C-q|0}}}do{if((C|n|0)>=0){q=a|0;r=c[q>>2]|0;if((C|0)>=(r|0)){break}if((c[a+4>>2]|0)<=(n|0)){break}o=(ha(r,n)|0)+C|0;H=a+8|0;G=c[H>>2]|0;c[G+(o*12|0)>>2]=f;c[G+(o*12|0)+4>>2]=l;c[G+(o*12|0)+8>>2]=m;o=(ha(c[q>>2]|0,n)|0)+C|0;c[(c[H>>2]|0)+(o*12|0)+4>>2]=c[a+16>>2];o=c[p>>2]|0}}while(0);if((o|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}f=a|0;l=c[f>>2]|0;if((d|0)>=(l|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(l,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=h;c[F+(H*12|0)+4>>2]=j;c[F+(H*12|0)+8>>2]=k;H=(ha(c[f>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}else{if(!q){q=c[a>>2]|0;if((E|0)<0){do{E=E+q|0;}while((E|0)<0)}while(1){if((E|0)<(q|0)){break}else{E=E-q|0}}}do{if((E|n|0)>=0){q=a|0;r=c[q>>2]|0;if((E|0)>=(r|0)){break}if((c[a+4>>2]|0)<=(n|0)){break}o=(ha(r,n)|0)+E|0;H=a+8|0;G=c[H>>2]|0;c[G+(o*12|0)>>2]=f;c[G+(o*12|0)+4>>2]=l;c[G+(o*12|0)+8>>2]=m;o=(ha(c[q>>2]|0,n)|0)+E|0;c[(c[H>>2]|0)+(o*12|0)+4>>2]=c[a+16>>2];o=c[p>>2]|0}}while(0);if((o|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}l=a|0;f=c[l>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=h;c[F+(H*12|0)+4>>2]=j;c[F+(H*12|0)+8>>2]=k;H=(ha(c[l>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}}if(G){l=c[b+4>>2]|0;o=c[b+8>>2]|0;m=a+28|0;p=c[m>>2]|0;if((p|0)!=0){q=c[a>>2]|0;if((d|0)<1){do{C=C+q|0;}while((C|0)<0)}while(1){if((C|0)<(q|0)){break}else{C=C-q|0}}}do{if((C|n|0)>=0){q=a|0;r=c[q>>2]|0;if((C|0)>=(r|0)){break}if((c[a+4>>2]|0)<=(n|0)){break}p=(ha(r,n)|0)+C|0;H=a+8|0;G=c[H>>2]|0;c[G+(p*12|0)>>2]=f;c[G+(p*12|0)+4>>2]=l;c[G+(p*12|0)+8>>2]=o;p=(ha(c[q>>2]|0,n)|0)+C|0;c[(c[H>>2]|0)+(p*12|0)+4>>2]=c[a+16>>2];p=c[m>>2]|0}}while(0);if((p|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}l=a|0;f=c[l>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=h;c[F+(H*12|0)+4>>2]=j;c[F+(H*12|0)+8>>2]=k;H=(ha(c[l>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}if(!H){h=c[F>>2]|0;break}h=c[b+4>>2]|0;l=c[b+8>>2]|0;k=a+28|0;j=c[k>>2]|0;if((j|0)!=0){m=c[a>>2]|0;if((E|0)<0){do{E=E+m|0;}while((E|0)<0)}while(1){if((E|0)<(m|0)){break}else{E=E-m|0}}}do{if((E|n|0)>=0){m=a|0;o=c[m>>2]|0;if((E|0)>=(o|0)){break}if((c[a+4>>2]|0)<=(n|0)){break}j=(ha(o,n)|0)+E|0;H=a+8|0;G=c[H>>2]|0;c[G+(j*12|0)>>2]=f;c[G+(j*12|0)+4>>2]=h;c[G+(j*12|0)+8>>2]=l;j=(ha(c[m>>2]|0,n)|0)+E|0;c[(c[H>>2]|0)+(j*12|0)+4>>2]=c[a+16>>2];j=c[k>>2]|0}}while(0);if((j|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}h=a|0;f=c[h>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=s;c[F+(H*12|0)+4>>2]=t;c[F+(H*12|0)+8>>2]=u;H=(ha(c[h>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}}while(0);if(!((h|0)==0|(h|0)==3)){i=g;return}k=d-1|0;zd(l,a,k,e);j=d+1|0;zd(m,a,j,e);h=c[l>>2]|0;s=c[D>>2]|0;n=c[s+(h*12|0)+4>>2]|0;do{if((v|0)==0){t=(c[s+((c[m>>2]|0)*12|0)+4>>2]|0)<(w|0);if((n|0)>=(w|0)){if(!t){break}h=b;f=B;c[f>>2]=c[h>>2];c[f+4>>2]=c[h+4>>2];c[f+8>>2]=c[h+8>>2];f=a+28|0;h=c[f>>2]|0;if((h|0)!=0){k=c[a>>2]|0;if((j|0)<0){do{j=j+k|0;}while((j|0)<0)}while(1){if((j|0)<(k|0)){break}else{j=j-k|0}}}do{if((j|e|0)>=0){k=a|0;l=c[k>>2]|0;if((j|0)>=(l|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}h=(ha(l,e)|0)+j|0;H=a+8|0;h=(c[H>>2]|0)+(h*12|0)|0;c[h>>2]=c[B>>2];c[h+4>>2]=c[B+4>>2];c[h+8>>2]=c[B+8>>2];h=(ha(c[k>>2]|0,e)|0)+j|0;c[(c[H>>2]|0)+(h*12|0)+4>>2]=c[a+16>>2];h=c[f>>2]|0}}while(0);G=m;H=q;c[H>>2]=c[G>>2];c[H+4>>2]=c[G+4>>2];c[H+8>>2]=c[G+8>>2];if((h|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}h=a|0;f=c[h>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;H=(c[G>>2]|0)+(H*12|0)|0;c[H>>2]=c[q>>2];c[H+4>>2]=c[q+4>>2];c[H+8>>2]=c[q+8>>2];H=(ha(c[h>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}if(!t){f=b;h=z;c[h>>2]=c[f>>2];c[h+4>>2]=c[f+4>>2];c[h+8>>2]=c[f+8>>2];h=a+28|0;f=c[h>>2]|0;if((f|0)!=0){j=c[a>>2]|0;if((d|0)<1){do{k=k+j|0;}while((k|0)<0)}while(1){if((k|0)<(j|0)){break}else{k=k-j|0}}}do{if((k|e|0)>=0){j=a|0;m=c[j>>2]|0;if((k|0)>=(m|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}f=(ha(m,e)|0)+k|0;H=a+8|0;f=(c[H>>2]|0)+(f*12|0)|0;c[f>>2]=c[z>>2];c[f+4>>2]=c[z+4>>2];c[f+8>>2]=c[z+8>>2];f=(ha(c[j>>2]|0,e)|0)+k|0;c[(c[H>>2]|0)+(f*12|0)+4>>2]=c[a+16>>2];f=c[h>>2]|0}}while(0);G=l;H=r;c[H>>2]=c[G>>2];c[H+4>>2]=c[G+4>>2];c[H+8>>2]=c[G+8>>2];if((f|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}f=a|0;h=c[f>>2]|0;if((d|0)>=(h|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(h,e)|0)+d|0;G=a+8|0;H=(c[G>>2]|0)+(H*12|0)|0;c[H>>2]=c[r>>2];c[H+4>>2]=c[r+4>>2];c[H+8>>2]=c[r+8>>2];H=(ha(c[f>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}if((A|0)==0){h=y;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];h=a+28|0;f=c[h>>2]|0;if((f|0)!=0){j=c[a>>2]|0;if((d|0)<1){do{k=k+j|0;}while((k|0)<0)}while(1){if((k|0)<(j|0)){break}else{k=k-j|0}}}do{if((k|e|0)>=0){m=a|0;j=c[m>>2]|0;if((k|0)>=(j|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}f=(ha(j,e)|0)+k|0;H=a+8|0;f=(c[H>>2]|0)+(f*12|0)|0;c[f>>2]=c[y>>2];c[f+4>>2]=c[y+4>>2];c[f+8>>2]=c[y+8>>2];f=(ha(c[m>>2]|0,e)|0)+k|0;c[(c[H>>2]|0)+(f*12|0)+4>>2]=c[a+16>>2];f=c[h>>2]|0}}while(0);G=l;H=o;c[H>>2]=c[G>>2];c[H+4>>2]=c[G+4>>2];c[H+8>>2]=c[G+8>>2];if((f|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}h=a|0;f=c[h>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;H=(c[G>>2]|0)+(H*12|0)|0;c[H>>2]=c[o>>2];c[H+4>>2]=c[o+4>>2];c[H+8>>2]=c[o+8>>2];H=(ha(c[h>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}else{h=x;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];h=a+28|0;f=c[h>>2]|0;if((f|0)!=0){k=c[a>>2]|0;if((j|0)<0){do{j=j+k|0;}while((j|0)<0)}while(1){if((j|0)<(k|0)){break}else{j=j-k|0}}}do{if((j|e|0)>=0){k=a|0;l=c[k>>2]|0;if((j|0)>=(l|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}f=(ha(l,e)|0)+j|0;H=a+8|0;f=(c[H>>2]|0)+(f*12|0)|0;c[f>>2]=c[x>>2];c[f+4>>2]=c[x+4>>2];c[f+8>>2]=c[x+8>>2];f=(ha(c[k>>2]|0,e)|0)+j|0;c[(c[H>>2]|0)+(f*12|0)+4>>2]=c[a+16>>2];f=c[h>>2]|0}}while(0);G=m;H=p;c[H>>2]=c[G>>2];c[H+4>>2]=c[G+4>>2];c[H+8>>2]=c[G+8>>2];if((f|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}h=a|0;f=c[h>>2]|0;if((d|0)>=(f|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(f,e)|0)+d|0;G=a+8|0;H=(c[G>>2]|0)+(H*12|0)|0;c[H>>2]=c[p>>2];c[H+4>>2]=c[p+4>>2];c[H+8>>2]=c[p+8>>2];H=(ha(c[h>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}}}while(0);o=(n|0)<(w|0);n=c[m>>2]|0;p=c[s+(n*12|0)+4>>2]|0;if(!((p|0)<(w|0)|o^1)){m=c[b+4>>2]|0;n=c[b+8>>2]|0;j=c[l+4>>2]|0;l=c[l+8>>2]|0;p=a+28|0;o=c[p>>2]|0;if((o|0)!=0){q=c[a>>2]|0;if((d|0)<1){do{k=k+q|0;}while((k|0)<0)}while(1){if((k|0)<(q|0)){break}else{k=k-q|0}}}do{if((k|e|0)>=0){q=a|0;r=c[q>>2]|0;if((k|0)>=(r|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}o=(ha(r,e)|0)+k|0;H=a+8|0;G=c[H>>2]|0;c[G+(o*12|0)>>2]=f;c[G+(o*12|0)+4>>2]=m;c[G+(o*12|0)+8>>2]=n;o=(ha(c[q>>2]|0,e)|0)+k|0;c[(c[H>>2]|0)+(o*12|0)+4>>2]=c[a+16>>2];o=c[p>>2]|0}}while(0);if((o|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}f=a|0;k=c[f>>2]|0;if((d|0)>=(k|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(k,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=h;c[F+(H*12|0)+4>>2]=j;c[F+(H*12|0)+8>>2]=l;H=(ha(c[f>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}if((p|0)>=(w|0)|o){i=g;return}l=c[b+4>>2]|0;o=c[b+8>>2]|0;h=c[m+4>>2]|0;k=c[m+8>>2]|0;p=a+28|0;m=c[p>>2]|0;if((m|0)!=0){q=c[a>>2]|0;if((j|0)<0){do{j=j+q|0;}while((j|0)<0)}while(1){if((j|0)<(q|0)){break}else{j=j-q|0}}}do{if((j|e|0)>=0){r=a|0;q=c[r>>2]|0;if((j|0)>=(q|0)){break}if((c[a+4>>2]|0)<=(e|0)){break}m=(ha(q,e)|0)+j|0;H=a+8|0;G=c[H>>2]|0;c[G+(m*12|0)>>2]=f;c[G+(m*12|0)+4>>2]=l;c[G+(m*12|0)+8>>2]=o;m=(ha(c[r>>2]|0,e)|0)+j|0;c[(c[H>>2]|0)+(m*12|0)+4>>2]=c[a+16>>2];m=c[p>>2]|0}}while(0);if((m|0)!=0){f=c[a>>2]|0;if((d|0)<0){do{d=d+f|0;}while((d|0)<0)}while(1){if((d|0)<(f|0)){break}else{d=d-f|0}}}if((d|e|0)<0){i=g;return}f=a|0;j=c[f>>2]|0;if((d|0)>=(j|0)){i=g;return}if((c[a+4>>2]|0)<=(e|0)){i=g;return}H=(ha(j,e)|0)+d|0;G=a+8|0;F=c[G>>2]|0;c[F+(H*12|0)>>2]=n;c[F+(H*12|0)+4>>2]=h;c[F+(H*12|0)+8>>2]=k;H=(ha(c[f>>2]|0,e)|0)+d|0;c[(c[G>>2]|0)+(H*12|0)+4>>2]=c[a+16>>2];i=g;return}function Kd(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;g=i;i=i+48|0;k=g|0;h=g+16|0;l=g+32|0;j=a+16|0;c[j>>2]=(c[j>>2]|0)+1;z=c[2510]|0;m=(z^61^z>>>16)*9|0;m=ha(m>>>4^m,668265261)|0;c[2510]=z+1;m=((m>>>15^m)&1|0)!=0;if(m){v=d}else{v=d-1+f|0}f=f+d|0;n=b-1+e|0;r=e+b|0;q=k|0;p=k+4|0;o=a+24|0;e=l;s=k;t=h;while(1){if(m){if((v|0)>=(f|0)){a=24;break}}else{if((v|0)<(d|0)){a=24;break}}z=c[2510]|0;u=(z^61^z>>>16)*9|0;u=ha(u>>>4^u,668265261)|0;c[2510]=z+1;u=((u>>>15^u)&1|0)!=0;x=u?b:n;while(1){if(u){if((x|0)>=(r|0)){break}}else{if((x|0)<(b|0)){break}}zd(k,a,x,v);w=c[q>>2]|0;do{if((w|0)!=0){if((c[p>>2]|0)==(c[j>>2]|0)){break}z=c[o>>2]|0;y=c[z+(w*12|0)+8>>2]|0;if((y|0)!=0){c[t>>2]=c[s>>2];c[t+4>>2]=c[s+4>>2];c[t+8>>2]=c[s+8>>2];if((Cc[y&31](a,h,x,v)|0)!=0){break}z=c[o>>2]|0}if((c[z+(w*12|0)>>2]|0)==5){break}c[e>>2]=c[s>>2];c[e+4>>2]=c[s+4>>2];c[e+8>>2]=c[s+8>>2];Jd(a,l,x,v,z+(w*12|0)|0)}}while(0);if(u){x=x+1|0;continue}else{x=x-1|0;continue}}if(m){v=v+1|0;continue}else{v=v-1|0;continue}}if((a|0)==24){i=g;return}}function Ld(a){a=a|0;var b=0,d=0,e=0;d=c[p>>2]|0;ol(13080,d,13208);c[3518]=4804;c[3520]=4824;c[3519]=0;He(14080,13080);c[3538]=0;c[3539]=-1;b=c[t>>2]|0;pl(12984,b,13216);c[3452]=4708;c[3453]=4728;He(13812,12984);c[3471]=0;c[3472]=-1;a=c[s>>2]|0;pl(13032,a,13224);c[3496]=4708;c[3497]=4728;He(13988,13032);c[3515]=0;c[3516]=-1;e=c[(c[(c[3496]|0)-12>>2]|0)+14008>>2]|0;c[3474]=4708;c[3475]=4728;He(13900,e);c[3493]=0;c[3494]=-1;c[(c[(c[3518]|0)-12>>2]|0)+14144>>2]=13808;e=(c[(c[3496]|0)-12>>2]|0)+13988|0;c[e>>2]=c[e>>2]|8192;c[(c[(c[3496]|0)-12>>2]|0)+14056>>2]=13808;ql(12928,d,13232);c[3430]=4756;c[3432]=4776;c[3431]=0;He(13728,12928);c[3450]=0;c[3451]=-1;rl(12832,b,13240);c[3360]=4660;c[3361]=4680;He(13444,12832);c[3379]=0;c[3380]=-1;rl(12880,a,13248);c[3404]=4660;c[3405]=4680;He(13620,12880);c[3423]=0;c[3424]=-1;a=c[(c[(c[3404]|0)-12>>2]|0)+13640>>2]|0;c[3382]=4660;c[3383]=4680;He(13532,a);c[3401]=0;c[3402]=-1;c[(c[(c[3430]|0)-12>>2]|0)+13792>>2]=13440;a=(c[(c[3404]|0)-12>>2]|0)+13620|0;c[a>>2]=c[a>>2]|8192;c[(c[(c[3404]|0)-12>>2]|0)+13688>>2]=13440;return}function Md(a){a=a|0;pf(13808)|0;pf(13896)|0;uf(13440)|0;uf(13528)|0;return}function Nd(a){a=a|0;return}function Od(a){a=a|0;a=a+4|0;J=c[a>>2]|0,c[a>>2]=J+1,J;return}function Pd(a){a=a|0;var b=0;b=a+4|0;if(((J=c[b>>2]|0,c[b>>2]=J+ -1,J)|0)!=0){b=0;return b|0}Ac[c[(c[a>>2]|0)+8>>2]&255](a);b=1;return b|0}function Qd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2888;d=An(b|0)|0;f=cn(d+13|0)|0;c[f+4>>2]=d;c[f>>2]=d;e=f+12|0;c[a+4>>2]=e;c[f+8>>2]=0;xn(e|0,b|0,d+1|0)|0;return}function Rd(a){a=a|0;var b=0,d=0;c[a>>2]=2888;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((J=c[d>>2]|0,c[d>>2]=J+ -1,J)-1|0)>=0){d=a;dn(d);return}en((c[b>>2]|0)-12|0);d=a;dn(d);return}function Sd(a){a=a|0;var b=0;c[a>>2]=2888;a=a+4|0;b=(c[a>>2]|0)-4|0;if(((J=c[b>>2]|0,c[b>>2]=J+ -1,J)-1|0)>=0){return}en((c[a>>2]|0)-12|0);return}function Td(a){a=a|0;return c[a+4>>2]|0}function Ud(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;c[b>>2]=2824;if((a[d]&1)==0){d=d+1|0}else{d=c[d+8>>2]|0}e=An(d|0)|0;g=cn(e+13|0)|0;c[g+4>>2]=e;c[g>>2]=e;f=g+12|0;c[b+4>>2]=f;c[g+8>>2]=0;xn(f|0,d|0,e+1|0)|0;return}function Vd(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a>>2]=2824;d=An(b|0)|0;f=cn(d+13|0)|0;c[f+4>>2]=d;c[f>>2]=d;e=f+12|0;c[a+4>>2]=e;c[f+8>>2]=0;xn(e|0,b|0,d+1|0)|0;return}function Wd(a){a=a|0;var b=0,d=0;c[a>>2]=2824;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((J=c[d>>2]|0,c[d>>2]=J+ -1,J)-1|0)>=0){d=a;dn(d);return}en((c[b>>2]|0)-12|0);d=a;dn(d);return}function Xd(a){a=a|0;var b=0;c[a>>2]=2824;a=a+4|0;b=(c[a>>2]|0)-4|0;if(((J=c[b>>2]|0,c[b>>2]=J+ -1,J)-1|0)>=0){return}en((c[a>>2]|0)-12|0);return}function Yd(a){a=a|0;return c[a+4>>2]|0}function Zd(a){a=a|0;var b=0,d=0;c[a>>2]=2888;b=a+4|0;d=(c[b>>2]|0)-4|0;if(((J=c[d>>2]|0,c[d>>2]=J+ -1,J)-1|0)>=0){d=a;dn(d);return}en((c[b>>2]|0)-12|0);d=a;dn(d);return}function _d(a,b,d){a=a|0;b=b|0;d=d|0;c[a>>2]=d;c[a+4>>2]=b;return}function $d(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+8|0;f=e|0;Gc[c[(c[a>>2]|0)+12>>2]&7](f,a,b);if((c[f+4>>2]|0)!=(c[d+4>>2]|0)){a=0;i=e;return a|0}a=(c[f>>2]|0)==(c[d>>2]|0);i=e;return a|0}function ae(a,b,d){a=a|0;b=b|0;d=d|0;if((c[b+4>>2]|0)!=(a|0)){a=0;return a|0}a=(c[b>>2]|0)==(d|0);return a|0}function be(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;d=Xb(e|0)|0;e=An(d|0)|0;if(e>>>0>4294967279>>>0){ie(b)}if(e>>>0<11>>>0){a[b]=e<<1;b=b+1|0;xn(b|0,d|0,e)|0;d=b+e|0;a[d]=0;return}else{g=e+16&-16;f=bn(g)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=e;b=f;xn(b|0,d|0,e)|0;d=b+e|0;a[d]=0;return}}function ce(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;f=i;i=i+16|0;g=f|0;j=d|0;k=c[j>>2]|0;h=e;do{if((k|0)!=0){l=a[h]|0;if((l&1)==0){l=(l&255)>>>1}else{l=c[e+4>>2]|0}if((l|0)!=0){se(e,1504)|0;k=c[j>>2]|0}d=c[d+4>>2]|0;Gc[c[(c[d>>2]|0)+24>>2]&7](g,d,k);d=g;j=a[d]|0;if((j&1)==0){k=(j&255)>>>1;j=g+1|0}else{k=c[g+4>>2]|0;j=c[g+8>>2]|0}m=a[h]|0;if((m&1)==0){l=10}else{m=c[e>>2]|0;l=(m&-2)-1|0;m=m&255}n=(m&1)==0;if(n){m=(m&255)>>>1}else{m=c[e+4>>2]|0}do{if((l-m|0)>>>0<k>>>0){ue(e,l,k-l+m|0,m,m,0,k,j)}else{if((k|0)==0){break}if(n){l=e+1|0}else{l=c[e+8>>2]|0}xn(l+m|0,j|0,k)|0;j=m+k|0;if((a[h]&1)==0){a[h]=j<<1}else{c[e+4>>2]=j}a[l+j|0]=0}}while(0);if((a[d]&1)==0){break}dn(c[g+8>>2]|0)}}while(0);n=b;c[n>>2]=c[h>>2];c[n+4>>2]=c[h+4>>2];c[n+8>>2]=c[h+8>>2];zn(h|0,0,12)|0;i=f;return}function de(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;f=i;i=i+32|0;h=d;d=i;i=i+8|0;c[d>>2]=c[h>>2];c[d+4>>2]=c[h+4>>2];h=f|0;g=f+16|0;j=An(e|0)|0;if(j>>>0>4294967279>>>0){ie(g)}if(j>>>0<11>>>0){a[g]=j<<1;k=g+1|0}else{l=j+16&-16;k=bn(l)|0;c[g+8>>2]=k;c[g>>2]=l|1;c[g+4>>2]=j}xn(k|0,e|0,j)|0;a[k+j|0]=0;ce(h,d,g);Ud(b|0,h);if(!((a[h]&1)==0)){dn(c[h+8>>2]|0)}if(!((a[g]&1)==0)){dn(c[g+8>>2]|0)}c[b>>2]=4848;l=b+8|0;k=c[d+4>>2]|0;c[l>>2]=c[d>>2];c[l+4>>2]=k;i=f;return}function ee(a){a=a|0;Xd(a|0);dn(a);return}function fe(a){a=a|0;Xd(a|0);return}function ge(a){a=a|0;return}function he(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;i;if((c[a>>2]|0)==1){do{Xa(13160,13136)|0;}while((c[a>>2]|0)==1)}if((c[a>>2]|0)!=0){e;return}c[a>>2]=1;f;Ac[d&255](b);g;c[a>>2]=-1;h;Rb(13160)|0;return}function ie(a){a=a|0;a=oc(8)|0;Qd(a,344);c[a>>2]=2856;Fb(a|0,8488,36)}function je(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=d;if((a[e]&1)==0){d=b;c[d>>2]=c[e>>2];c[d+4>>2]=c[e+4>>2];c[d+8>>2]=c[e+8>>2];return}e=c[d+8>>2]|0;d=c[d+4>>2]|0;if(d>>>0>4294967279>>>0){ie(b)}if(d>>>0<11>>>0){a[b]=d<<1;b=b+1|0}else{g=d+16&-16;f=bn(g)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=d;b=f}xn(b|0,e|0,d)|0;a[b+d|0]=0;return}function ke(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;if(e>>>0>4294967279>>>0){ie(b)}if(e>>>0<11>>>0){a[b]=e<<1;b=b+1|0;xn(b|0,d|0,e)|0;d=b+e|0;a[d]=0;return}else{g=e+16&-16;f=bn(g)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=e;b=f;xn(b|0,d|0,e)|0;d=b+e|0;a[d]=0;return}}function le(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;if(d>>>0>4294967279>>>0){ie(b)}if(d>>>0<11>>>0){a[b]=d<<1;b=b+1|0}else{g=d+16&-16;f=bn(g)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=d;b=f}zn(b|0,e|0,d|0)|0;a[b+d|0]=0;return}function me(b){b=b|0;if((a[b]&1)==0){return}dn(c[b+8>>2]|0);return}function ne(a,b){a=a|0;b=b|0;return oe(a,b,An(b|0)|0)|0}function oe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;g=b;h=a[g]|0;if((h&1)==0){f=10}else{h=c[b>>2]|0;f=(h&-2)-1|0;h=h&255}if(!(f>>>0<e>>>0)){if((h&1)==0){f=b+1|0}else{f=c[b+8>>2]|0}yn(f|0,d|0,e|0)|0;a[f+e|0]=0;if((a[g]&1)==0){a[g]=e<<1;return b|0}else{c[b+4>>2]=e;return b|0}}if((-18-f|0)>>>0<(e-f|0)>>>0){ie(b);return 0}if((h&1)==0){g=b+1|0}else{g=c[b+8>>2]|0}do{if(f>>>0<2147483623>>>0){h=f<<1;h=h>>>0>e>>>0?h:e;if(h>>>0<11>>>0){i=11;break}i=h+16&-16}else{i=-17}}while(0);h=bn(i)|0;if((e|0)!=0){xn(h|0,d|0,e)|0}if((f|0)!=10){dn(g)}c[b+8>>2]=h;c[b>>2]=i|1;c[b+4>>2]=e;a[h+e|0]=0;return b|0}function pe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b;h=a[f]|0;g=(h&1)==0;if(g){h=(h&255)>>>1}else{h=c[b+4>>2]|0}if(h>>>0<d>>>0){qe(b,d-h|0,e)|0;return}if(g){a[b+1+d|0]=0;a[f]=d<<1;return}else{a[(c[b+8>>2]|0)+d|0]=0;c[b+4>>2]=d;return}}function qe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;if((d|0)==0){return b|0}f=b;i=a[f]|0;if((i&1)==0){h=10}else{i=c[b>>2]|0;h=(i&-2)-1|0;i=i&255}if((i&1)==0){g=(i&255)>>>1}else{g=c[b+4>>2]|0}if((h-g|0)>>>0<d>>>0){j=g+d|0;if((-17-h|0)>>>0<(j-h|0)>>>0){ie(b);return 0}if((i&1)==0){i=b+1|0}else{i=c[b+8>>2]|0}do{if(h>>>0<2147483623>>>0){k=h<<1;j=j>>>0<k>>>0?k:j;if(j>>>0<11>>>0){k=11;break}k=j+16&-16}else{k=-17}}while(0);j=bn(k)|0;if((g|0)!=0){xn(j|0,i|0,g)|0}if((h|0)!=10){dn(i)}c[b+8>>2]=j;i=k|1;c[b>>2]=i;i=i&255}if((i&1)==0){h=b+1|0}else{h=c[b+8>>2]|0}zn(h+g|0,e|0,d|0)|0;e=g+d|0;if((a[f]&1)==0){a[f]=e<<1}else{c[b+4>>2]=e}a[h+e|0]=0;return b|0}function re(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if(d>>>0>4294967279>>>0){ie(b)}e=b;j=a[e]|0;if((j&1)==0){g=10}else{j=c[b>>2]|0;g=(j&-2)-1|0;j=j&255}if((j&1)==0){f=(j&255)>>>1}else{f=c[b+4>>2]|0}d=f>>>0>d>>>0?f:d;if(d>>>0<11>>>0){d=10}else{d=(d+16&-16)-1|0}if((d|0)==(g|0)){return}do{if((d|0)==10){h=b+1|0;i=c[b+8>>2]|0;k=1;g=0}else{h=d+1|0;if(d>>>0>g>>>0){h=bn(h)|0}else{h=bn(h)|0}j=a[e]|0;if((j&1)==0){i=b+1|0;k=0;g=1;break}else{i=c[b+8>>2]|0;k=1;g=1;break}}}while(0);if((j&1)==0){j=(j&255)>>>1}else{j=c[b+4>>2]|0}xn(h|0,i|0,j+1|0)|0;if(k){dn(i)}if(g){c[b>>2]=d+1|1;c[b+4>>2]=f;c[b+8>>2]=h;return}else{a[e]=f<<1;return}}function se(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;f=An(d|0)|0;e=b;i=a[e]|0;if((i&1)==0){g=10}else{i=c[b>>2]|0;g=(i&-2)-1|0;i=i&255}h=(i&1)==0;if(h){i=(i&255)>>>1}else{i=c[b+4>>2]|0}if((g-i|0)>>>0<f>>>0){ue(b,g,f-g+i|0,i,i,0,f,d);return b|0}if((f|0)==0){return b|0}if(h){g=b+1|0}else{g=c[b+8>>2]|0}xn(g+i|0,d|0,f)|0;f=i+f|0;if((a[e]&1)==0){a[e]=f<<1}else{c[b+4>>2]=f}a[g+f|0]=0;return b|0}function te(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;h=b;i=a[h]|0;g=(i&1)!=0;if(g){i=c[b>>2]|0;e=c[b+4>>2]|0;f=(i&-2)-1|0;i=i&255}else{e=(i&255)>>>1;f=10}do{if((e|0)==(f|0)){if((f|0)==-17){ie(b)}if((i&1)==0){g=b+1|0}else{g=c[b+8>>2]|0}do{if(f>>>0<2147483623>>>0){h=f+1|0;i=f<<1;h=h>>>0<i>>>0?i:h;if(h>>>0<11>>>0){i=11;break}i=h+16&-16}else{i=-17}}while(0);h=bn(i)|0;xn(h|0,g|0,f)|0;if((f|0)!=10){dn(g)}c[b+8>>2]=h;c[b>>2]=i|1}else{if(g){h=c[b+8>>2]|0;break}a[h]=(e<<1)+2;h=b+1|0;i=e+1|0;g=h+e|0;a[g]=d;i=h+i|0;a[i]=0;return}}while(0);i=e+1|0;c[b+4>>2]=i;g=h+e|0;a[g]=d;i=h+i|0;a[i]=0;return}function ue(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0;if((-18-d|0)>>>0<e>>>0){ie(b)}if((a[b]&1)==0){k=b+1|0}else{k=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){l=e+d|0;e=d<<1;e=l>>>0<e>>>0?e:l;if(e>>>0<11>>>0){l=11;break}l=e+16&-16}else{l=-17}}while(0);e=bn(l)|0;if((g|0)!=0){xn(e|0,k|0,g)|0}if((i|0)!=0){xn(e+g|0,j|0,i)|0}f=f-h|0;if((f|0)!=(g|0)){xn(e+(i+g)|0,k+(h+g)|0,f-g|0)|0}if((d|0)==10){j=b+8|0;c[j>>2]=e;j=l|1;l=b|0;c[l>>2]=j;l=f+i|0;j=b+4|0;c[j>>2]=l;l=e+l|0;a[l]=0;return}dn(k);j=b+8|0;c[j>>2]=e;j=l|1;l=b|0;c[l>>2]=j;l=f+i|0;j=b+4|0;c[j>>2]=l;l=e+l|0;a[l]=0;return}function ve(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0;if((-17-d|0)>>>0<e>>>0){ie(b)}if((a[b]&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}do{if(d>>>0<2147483623>>>0){k=e+d|0;e=d<<1;e=k>>>0<e>>>0?e:k;if(e>>>0<11>>>0){k=11;break}k=e+16&-16}else{k=-17}}while(0);e=bn(k)|0;if((g|0)!=0){xn(e|0,j|0,g)|0}f=f-h|0;if((f|0)!=(g|0)){xn(e+(i+g)|0,j+(h+g)|0,f-g|0)|0}if((d|0)==10){f=b+8|0;c[f>>2]=e;e=k|1;k=b|0;c[k>>2]=e;return}dn(j);f=b+8|0;c[f>>2]=e;e=k|1;k=b|0;c[k>>2]=e;return}function we(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;if(e>>>0>1073741807>>>0){ie(b)}if(e>>>0<2>>>0){a[b]=e<<1;b=b+4|0;Bm(b,d,e)|0;d=b+(e<<2)|0;c[d>>2]=0;return}else{g=e+4&-4;f=bn(g<<2)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=e;b=f;Bm(b,d,e)|0;d=b+(e<<2)|0;c[d>>2]=0;return}}function xe(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;if(d>>>0>1073741807>>>0){ie(b)}if(d>>>0<2>>>0){a[b]=d<<1;b=b+4|0;Dm(b,e,d)|0;e=b+(d<<2)|0;c[e>>2]=0;return}else{g=d+4&-4;f=bn(g<<2)|0;c[b+8>>2]=f;c[b>>2]=g|1;c[b+4>>2]=d;b=f;Dm(b,e,d)|0;e=b+(d<<2)|0;c[e>>2]=0;return}}function ye(b){b=b|0;if((a[b]&1)==0){return}dn(c[b+8>>2]|0);return}function ze(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=Am(d)|0;f=b;h=a[f]|0;if((h&1)==0){g=1}else{h=c[b>>2]|0;g=(h&-2)-1|0;h=h&255}i=(h&1)==0;if(e>>>0>g>>>0){if(i){f=(h&255)>>>1}else{f=c[b+4>>2]|0}Ce(b,g,e-g|0,f,0,f,e,d);return b|0}if(i){g=b+4|0}else{g=c[b+8>>2]|0}Cm(g,d,e)|0;c[g+(e<<2)>>2]=0;if((a[f]&1)==0){a[f]=e<<1;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function Ae(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;if(d>>>0>1073741807>>>0){ie(b)}e=b;j=a[e]|0;if((j&1)==0){g=1}else{j=c[b>>2]|0;g=(j&-2)-1|0;j=j&255}if((j&1)==0){f=(j&255)>>>1}else{f=c[b+4>>2]|0}d=f>>>0>d>>>0?f:d;if(d>>>0<2>>>0){d=1}else{d=(d+4&-4)-1|0}if((d|0)==(g|0)){return}do{if((d|0)==1){h=b+4|0;i=c[b+8>>2]|0;k=1;g=0}else{h=(d<<2)+4|0;if(d>>>0>g>>>0){h=bn(h)|0}else{h=bn(h)|0}j=a[e]|0;if((j&1)==0){i=b+4|0;k=0;g=1;break}else{i=c[b+8>>2]|0;k=1;g=1;break}}}while(0);if((j&1)==0){j=(j&255)>>>1}else{j=c[b+4>>2]|0}Bm(h,i,j+1|0)|0;if(k){dn(i)}if(g){c[b>>2]=d+1|1;c[b+4>>2]=f;c[b+8>>2]=h;return}else{a[e]=f<<1;return}}function Be(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;g=a[e]|0;f=(g&1)!=0;if(f){g=c[b+4>>2]|0;h=(c[b>>2]&-2)-1|0}else{g=(g&255)>>>1;h=1}if((g|0)==(h|0)){De(b,h,1,h,h,0,0);if((a[e]&1)==0){f=7}else{f=8}}else{if(f){f=8}else{f=7}}if((f|0)==7){a[e]=(g<<1)+2;f=b+4|0;h=g+1|0;g=f+(g<<2)|0;c[g>>2]=d;h=f+(h<<2)|0;c[h>>2]=0;return}else if((f|0)==8){f=c[b+8>>2]|0;h=g+1|0;c[b+4>>2]=h;g=f+(g<<2)|0;c[g>>2]=d;h=f+(h<<2)|0;c[h>>2]=0;return}}function Ce(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;var k=0,l=0;if((1073741806-d|0)>>>0<e>>>0){ie(b)}if((a[b]&1)==0){k=b+4|0}else{k=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){l=e+d|0;e=d<<1;e=l>>>0<e>>>0?e:l;if(e>>>0<2>>>0){l=2;break}l=e+4&-4}else{l=1073741807}}while(0);e=bn(l<<2)|0;if((g|0)!=0){Bm(e,k,g)|0}if((i|0)!=0){Bm(e+(g<<2)|0,j,i)|0}f=f-h|0;if((f|0)!=(g|0)){Bm(e+(i+g<<2)|0,k+(h+g<<2)|0,f-g|0)|0}if((d|0)==1){j=b+8|0;c[j>>2]=e;j=l|1;l=b|0;c[l>>2]=j;l=f+i|0;j=b+4|0;c[j>>2]=l;l=e+(l<<2)|0;c[l>>2]=0;return}dn(k);j=b+8|0;c[j>>2]=e;j=l|1;l=b|0;c[l>>2]=j;l=f+i|0;j=b+4|0;c[j>>2]=l;l=e+(l<<2)|0;c[l>>2]=0;return}function De(b,d,e,f,g,h,i){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0;if((1073741807-d|0)>>>0<e>>>0){ie(b)}if((a[b]&1)==0){j=b+4|0}else{j=c[b+8>>2]|0}do{if(d>>>0<536870887>>>0){k=e+d|0;e=d<<1;e=k>>>0<e>>>0?e:k;if(e>>>0<2>>>0){k=2;break}k=e+4&-4}else{k=1073741807}}while(0);e=bn(k<<2)|0;if((g|0)!=0){Bm(e,j,g)|0}f=f-h|0;if((f|0)!=(g|0)){Bm(e+(i+g<<2)|0,j+(h+g<<2)|0,f-g|0)|0}if((d|0)==1){f=b+8|0;c[f>>2]=e;e=k|1;k=b|0;c[k>>2]=e;return}dn(j);f=b+8|0;c[f>>2]=e;e=k|1;k=b|0;c[k>>2]=e;return}function Ee(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;f=i;i=i+8|0;e=f|0;g=(c[b+24>>2]|0)==0;if(g){c[b+16>>2]=d|1}else{c[b+16>>2]=d}if(((g&1|d)&c[b+20>>2]|0)==0){i=f;return}d=oc(16)|0;do{if((a[14280]|0)==0){if((sb(14280)|0)==0){break}c[3044]=4352;eb(104,12176,v|0)|0}}while(0);b=Dn(12176,0,32)|0;c[e>>2]=b|1;c[e+4>>2]=L;de(d,e,1568);c[d>>2]=3536;Fb(d|0,9032,32)}function Fe(a){a=a|0;var b=0,d=0,e=0;c[a>>2]=3512;e=c[a+40>>2]|0;b=a+32|0;d=a+36|0;if((e|0)!=0){do{e=e-1|0;Gc[c[(c[b>>2]|0)+(e<<2)>>2]&7](0,a,c[(c[d>>2]|0)+(e<<2)>>2]|0);}while((e|0)!=0)}ij(a+28|0);$m(c[b>>2]|0);$m(c[d>>2]|0);$m(c[a+48>>2]|0);$m(c[a+60>>2]|0);return}function Ge(a,b){a=a|0;b=b|0;hj(a,b+28|0);return}function He(a,b){a=a|0;b=b|0;c[a+24>>2]=b;c[a+16>>2]=(b|0)==0;c[a+20>>2]=0;c[a+4>>2]=4098;c[a+12>>2]=0;c[a+8>>2]=6;zn(a+32|0,0,40)|0;gj(a+28|0);return}function Ie(a){a=a|0;c[a>>2]=4584;ij(a+4|0);dn(a);return}function Je(a){a=a|0;c[a>>2]=4584;ij(a+4|0);return}function Ke(a){a=a|0;c[a>>2]=4584;ij(a+4|0);return}function Le(a,b){a=a|0;b=b|0;return}function Me(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function Ne(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function Oe(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;e=i;f=d;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function Pe(a){a=a|0;return 0}function Qe(a){a=a|0;return 0}function Re(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=b;if((e|0)<=0){j=0;return j|0}g=b+12|0;h=b+16|0;i=0;while(1){j=c[g>>2]|0;if(j>>>0<(c[h>>2]|0)>>>0){c[g>>2]=j+1;j=a[j]|0}else{j=Ec[c[(c[f>>2]|0)+40>>2]&127](b)|0;if((j|0)==-1){e=8;break}j=j&255}a[d]=j;i=i+1|0;if((i|0)<(e|0)){d=d+1|0}else{e=8;break}}if((e|0)==8){return i|0}return 0}function Se(a){a=a|0;return-1|0}function Te(a){a=a|0;var b=0;if((Ec[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){a=-1;return a|0}b=a+12|0;a=c[b>>2]|0;c[b>>2]=a+1;a=d[a]|0;return a|0}function Ue(a,b){a=a|0;b=b|0;return-1|0}function Ve(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;i=b;if((f|0)<=0){k=0;return k|0}g=b+24|0;h=b+28|0;j=0;while(1){k=c[g>>2]|0;if(k>>>0<(c[h>>2]|0)>>>0){l=a[e]|0;c[g>>2]=k+1;a[k]=l}else{if((Nc[c[(c[i>>2]|0)+52>>2]&31](b,d[e]|0)|0)==-1){f=7;break}}j=j+1|0;if((j|0)<(f|0)){e=e+1|0}else{f=7;break}}if((f|0)==7){return j|0}return 0}function We(a,b){a=a|0;b=b|0;return-1|0}function Xe(a){a=a|0;c[a>>2]=4512;ij(a+4|0);dn(a);return}function Ye(a){a=a|0;c[a>>2]=4512;ij(a+4|0);return}function Ze(a){a=a|0;c[a>>2]=4512;ij(a+4|0);return}function _e(a,b){a=a|0;b=b|0;return}function $e(a,b,c){a=a|0;b=b|0;c=c|0;return a|0}function af(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;g=a;c[g>>2]=0;c[g+4>>2]=0;g=a+8|0;c[g>>2]=-1;c[g+4>>2]=-1;return}function bf(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;e=i;f=d;b=i;i=i+16|0;c[b>>2]=c[f>>2];c[b+4>>2]=c[f+4>>2];c[b+8>>2]=c[f+8>>2];c[b+12>>2]=c[f+12>>2];b=a;c[b>>2]=0;c[b+4>>2]=0;b=a+8|0;c[b>>2]=-1;c[b+4>>2]=-1;i=e;return}function cf(a){a=a|0;return 0}function df(a){a=a|0;return 0}function ef(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=a;if((d|0)<=0){i=0;return i|0}f=a+12|0;g=a+16|0;h=0;while(1){i=c[f>>2]|0;if(i>>>0<(c[g>>2]|0)>>>0){c[f>>2]=i+4;i=c[i>>2]|0}else{i=Ec[c[(c[e>>2]|0)+40>>2]&127](a)|0;if((i|0)==-1){d=7;break}}c[b>>2]=i;h=h+1|0;if((h|0)<(d|0)){b=b+4|0}else{d=7;break}}if((d|0)==7){return h|0}return 0}function ff(a){a=a|0;return-1|0}function gf(a){a=a|0;var b=0;if((Ec[c[(c[a>>2]|0)+36>>2]&127](a)|0)==-1){a=-1;return a|0}b=a+12|0;a=c[b>>2]|0;c[b>>2]=a+4;a=c[a>>2]|0;return a|0}function hf(a,b){a=a|0;b=b|0;return-1|0}function jf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;g=a;if((d|0)<=0){i=0;return i|0}e=a+24|0;f=a+28|0;h=0;while(1){i=c[e>>2]|0;if(i>>>0<(c[f>>2]|0)>>>0){j=c[b>>2]|0;c[e>>2]=i+4;c[i>>2]=j}else{if((Nc[c[(c[g>>2]|0)+52>>2]&31](a,c[b>>2]|0)|0)==-1){d=7;break}}h=h+1|0;if((h|0)<(d|0)){b=b+4|0}else{d=7;break}}if((d|0)==7){return h|0}return 0}function kf(a,b){a=a|0;b=b|0;return-1|0}function lf(a){a=a|0;Fe(a+8|0);dn(a);return}function mf(a){a=a|0;Fe(a+8|0);return}function nf(a){a=a|0;var b=0;b=a;a=c[(c[a>>2]|0)-12>>2]|0;Fe(b+(a+8)|0);dn(b+a|0);return}function of(a){a=a|0;Fe(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function pf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;g=d|0;f=b;j=c[(c[f>>2]|0)-12>>2]|0;e=b;if((c[e+(j+24)>>2]|0)==0){i=d;return b|0}h=g|0;a[h]=0;c[g+4>>2]=b;do{if((c[e+(j+16)>>2]|0)==0){k=c[e+(j+72)>>2]|0;if((k|0)!=0){pf(k)|0;j=c[(c[f>>2]|0)-12>>2]|0}a[h]=1;k=c[e+(j+24)>>2]|0;if(!((Ec[c[(c[k>>2]|0)+24>>2]&127](k)|0)==-1)){break}k=c[(c[f>>2]|0)-12>>2]|0;Ee(e+k|0,c[e+(k+16)>>2]|1)}}while(0);zf(g);i=d;return b|0}function qf(a){a=a|0;Fe(a+8|0);dn(a);return}function rf(a){a=a|0;Fe(a+8|0);return}function sf(a){a=a|0;var b=0;b=a;a=c[(c[a>>2]|0)-12>>2]|0;Fe(b+(a+8)|0);dn(b+a|0);return}function tf(a){a=a|0;Fe(a+((c[(c[a>>2]|0)-12>>2]|0)+8)|0);return}function uf(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0;d=i;i=i+8|0;g=d|0;f=b;j=c[(c[f>>2]|0)-12>>2]|0;e=b;if((c[e+(j+24)>>2]|0)==0){i=d;return b|0}h=g|0;a[h]=0;c[g+4>>2]=b;do{if((c[e+(j+16)>>2]|0)==0){k=c[e+(j+72)>>2]|0;if((k|0)!=0){uf(k)|0;j=c[(c[f>>2]|0)-12>>2]|0}a[h]=1;k=c[e+(j+24)>>2]|0;if(!((Ec[c[(c[k>>2]|0)+24>>2]&127](k)|0)==-1)){break}k=c[(c[f>>2]|0)-12>>2]|0;Ee(e+k|0,c[e+(k+16)>>2]|1)}}while(0);Ef(g);i=d;return b|0}function vf(a){a=a|0;Fe(a+4|0);dn(a);return}function wf(a){a=a|0;Fe(a+4|0);return}function xf(a){a=a|0;var b=0;b=a;a=c[(c[a>>2]|0)-12>>2]|0;Fe(b+(a+4)|0);dn(b+a|0);return}function yf(a){a=a|0;Fe(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function zf(a){a=a|0;var b=0,d=0;a=a+4|0;b=c[a>>2]|0;d=c[(c[b>>2]|0)-12>>2]|0;if((c[b+(d+24)>>2]|0)==0){return}if((c[b+(d+16)>>2]|0)!=0){return}if((c[b+(d+4)>>2]&8192|0)==0){return}if(xb()|0){return}d=c[a>>2]|0;d=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if(!((Ec[c[(c[d>>2]|0)+24>>2]&127](d)|0)==-1)){return}b=c[a>>2]|0;d=c[(c[b>>2]|0)-12>>2]|0;Ee(b+d|0,c[b+(d+16)>>2]|1);return}function Af(a){a=a|0;Fe(a+4|0);dn(a);return}function Bf(a){a=a|0;Fe(a+4|0);return}function Cf(a){a=a|0;var b=0;b=a;a=c[(c[a>>2]|0)-12>>2]|0;Fe(b+(a+4)|0);dn(b+a|0);return}function Df(a){a=a|0;Fe(a+((c[(c[a>>2]|0)-12>>2]|0)+4)|0);return}function Ef(a){a=a|0;var b=0,d=0;a=a+4|0;b=c[a>>2]|0;d=c[(c[b>>2]|0)-12>>2]|0;if((c[b+(d+24)>>2]|0)==0){return}if((c[b+(d+16)>>2]|0)!=0){return}if((c[b+(d+4)>>2]&8192|0)==0){return}if(xb()|0){return}d=c[a>>2]|0;d=c[d+((c[(c[d>>2]|0)-12>>2]|0)+24)>>2]|0;if(!((Ec[c[(c[d>>2]|0)+24>>2]&127](d)|0)==-1)){return}b=c[a>>2]|0;d=c[(c[b>>2]|0)-12>>2]|0;Ee(b+d|0,c[b+(d+16)>>2]|1);return}function Ff(a){a=a|0;return 1704}function Gf(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)==1){ke(a,1848,35);return}else{be(a,b|0,c);return}}function Hf(a){a=a|0;fe(a|0);dn(a);return}function If(a){a=a|0;fe(a|0);return}function Jf(a){a=a|0;Fe(a);dn(a);return}function Kf(a){a=a|0;Nd(a|0);dn(a);return}function Lf(a){a=a|0;Nd(a|0);return}function Mf(a){a=a|0;Nd(a|0);return}function Nf(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;var g=0;a:do{if((e|0)!=(f|0)){while(1){if((c|0)==(d|0)){d=-1;f=7;break}g=a[c]|0;b=a[e]|0;if(g<<24>>24<b<<24>>24){d=-1;f=7;break}if(b<<24>>24<g<<24>>24){d=1;f=7;break}c=c+1|0;e=e+1|0;if((e|0)==(f|0)){break a}}if((f|0)==7){return d|0}}}while(0);g=(c|0)!=(d|0)|0;return g|0}function Of(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;d=f-e|0;if(d>>>0>4294967279>>>0){ie(b)}if(d>>>0<11>>>0){a[b]=d<<1;b=b+1|0}else{h=d+16&-16;g=bn(h)|0;c[b+8>>2]=g;c[b>>2]=h|1;c[b+4>>2]=d;b=g}if((e|0)==(f|0)){h=b;a[h]=0;return}else{g=b}while(1){a[g]=a[e]|0;e=e+1|0;if((e|0)==(f|0)){break}else{g=g+1|0}}h=b+d|0;a[h]=0;return}function Pf(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)==(d|0)){b=0;return b|0}else{b=0}do{b=(a[c]|0)+(b<<4)|0;e=b&-268435456;b=(e>>>24|e)^b;c=c+1|0;}while((c|0)!=(d|0));return b|0}function Qf(a){a=a|0;Nd(a|0);dn(a);return}function Rf(a){a=a|0;Nd(a|0);return}function Sf(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0;a:do{if((e|0)==(f|0)){g=6}else{while(1){if((b|0)==(d|0)){d=-1;break a}h=c[b>>2]|0;a=c[e>>2]|0;if((h|0)<(a|0)){d=-1;break a}if((a|0)<(h|0)){d=1;break a}b=b+4|0;e=e+4|0;if((e|0)==(f|0)){g=6;break}}}}while(0);if((g|0)==6){d=(b|0)!=(d|0)|0}return d|0}function Tf(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0;d=e;g=f-d|0;h=g>>2;if(h>>>0>1073741807>>>0){ie(b)}if(h>>>0<2>>>0){a[b]=g>>>1;b=b+4|0}else{i=h+4&-4;g=bn(i<<2)|0;c[b+8>>2]=g;c[b>>2]=i|1;c[b+4>>2]=h;b=g}if((e|0)==(f|0)){i=b;c[i>>2]=0;return}d=f-4-d|0;g=b;while(1){c[g>>2]=c[e>>2];e=e+4|0;if((e|0)==(f|0)){break}else{g=g+4|0}}i=b+((d>>>2)+1<<2)|0;c[i>>2]=0;return}function Uf(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((b|0)==(d|0)){a=0;return a|0}else{a=0}do{a=(c[b>>2]|0)+(a<<4)|0;e=a&-268435456;a=(e>>>24|e)^a;b=b+4|0;}while((b|0)!=(d|0));return a|0}function Vf(a){a=a|0;Nd(a|0);dn(a);return}function Wf(a){a=a|0;Nd(a|0);return}function Xf(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+112|0;n=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[n>>2];n=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[n>>2];n=k|0;p=k+16|0;q=k+32|0;u=k+40|0;s=k+48|0;t=k+56|0;r=k+64|0;o=k+72|0;l=k+80|0;m=k+104|0;if((c[g+4>>2]&1|0)==0){c[q>>2]=-1;p=c[(c[d>>2]|0)+16>>2]|0;r=e|0;c[s>>2]=c[r>>2];c[t>>2]=c[f>>2];zc[p&127](u,d,s,t,g,h,q);e=c[u>>2]|0;c[r>>2]=e;f=c[q>>2]|0;if((f|0)==0){a[j]=0}else if((f|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=e;i=k;return}Ge(r,g);q=r|0;r=c[q>>2]|0;if(!((c[3428]|0)==-1)){c[p>>2]=13712;c[p+4>>2]=16;c[p+8>>2]=0;he(13712,p,100)}p=(c[3429]|0)-1|0;s=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-s>>2>>>0>p>>>0){p=c[s+(p<<2)>>2]|0;if((p|0)==0){break}Pd(c[q>>2]|0)|0;Ge(o,g);o=o|0;g=c[o>>2]|0;if(!((c[3332]|0)==-1)){c[n>>2]=13328;c[n+4>>2]=16;c[n+8>>2]=0;he(13328,n,100)}n=(c[3333]|0)-1|0;q=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-q>>2>>>0>n>>>0){n=c[q+(n<<2)>>2]|0;if((n|0)==0){break}t=n;Pd(c[o>>2]|0)|0;u=l|0;d=n;Bc[c[(c[d>>2]|0)+24>>2]&127](u,t);Bc[c[(c[d>>2]|0)+28>>2]&127](l+12|0,t);c[m>>2]=c[f>>2];a[j]=(tl(e,m,u,l+24|0,p,h,1)|0)==(u|0)|0;c[b>>2]=c[e>>2];me(l+12|0);me(l|0);i=k;return}}while(0);u=oc(4)|0;Fm(u);Fb(u|0,8456,134)}}while(0);u=oc(4)|0;Fm(u);Fb(u|0,8456,134)}function Yf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];ul(a,b,e,d,f,g,h);i=j;return}function Zf(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];vl(a,b,e,d,f,g,h);i=j;return}function _f(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];wl(a,b,e,d,f,g,h);i=j;return}function $f(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];xl(a,b,e,d,f,g,h);i=j;return}function ag(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];yl(a,b,e,d,f,g,h);i=j;return}function bg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];zl(a,b,e,d,f,g,h);i=j;return}function cg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Al(a,b,e,d,f,g,h);i=j;return}function dg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Bl(a,b,e,d,f,g,h);i=j;return}function eg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Cl(a,b,e,d,f,g,h);i=j;return}function fg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;m=i;i=i+248|0;p=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[p>>2];p=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[p>>2];p=m|0;x=m+16|0;l=m+48|0;o=m+64|0;d=m+72|0;A=m+88|0;n=l;zn(n|0,0,12)|0;Ge(o,g);o=o|0;g=c[o>>2]|0;if(!((c[3428]|0)==-1)){c[p>>2]=13712;c[p+4>>2]=16;c[p+8>>2]=0;he(13712,p,100)}q=(c[3429]|0)-1|0;p=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-p>>2>>>0>q>>>0){p=c[p+(q<<2)>>2]|0;if((p|0)==0){break}g=x|0;Cc[c[(c[p>>2]|0)+32>>2]&31](p,1e4,10026,g)|0;Pd(c[o>>2]|0)|0;q=d;zn(q|0,0,12)|0;pe(d,10,0);if((a[q]&1)==0){p=d+1|0;C=p;o=d+8|0}else{o=d+8|0;C=c[o>>2]|0;p=d+1|0}e=e|0;f=f|0;u=d|0;t=d+4|0;w=x+24|0;r=x+25|0;v=A;s=x+26|0;y=l+4|0;B=C;z=0;A=A|0;D=c[e>>2]|0;a:while(1){do{if((D|0)==0){D=0}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){break}if(!((Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){break}c[e>>2]=0;D=0}}while(0);F=(D|0)==0;E=c[f>>2]|0;do{if((E|0)==0){k=25}else{if((c[E+12>>2]|0)!=(c[E+16>>2]|0)){if(F){break}else{break a}}if((Ec[c[(c[E>>2]|0)+36>>2]&127](E)|0)==-1){c[f>>2]=0;k=25;break}else{if(F){break}else{break a}}}}while(0);if((k|0)==25){k=0;if(F){break}}E=a[q]|0;G=(E&1)==0;if(G){F=(E&255)>>>1}else{F=c[t>>2]|0}if((C-B|0)==(F|0)){if(G){B=(E&255)>>>1;C=(E&255)>>>1}else{C=c[t>>2]|0;B=C}pe(d,B<<1,0);if((a[q]&1)==0){B=10}else{B=(c[u>>2]&-2)-1|0}pe(d,B,0);if((a[q]&1)==0){E=p}else{E=c[o>>2]|0}B=E;C=E+C|0}E=c[D+12>>2]|0;if((E|0)==(c[D+16>>2]|0)){E=(Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)&255}else{E=a[E]|0}D=(C|0)==(B|0);do{if(D){F=(a[w]|0)==E<<24>>24;if(!(F|(a[r]|0)==E<<24>>24)){k=53;break}a[C]=F?43:45;z=0;C=C+1|0}else{k=53}}while(0);do{if((k|0)==53){k=0;F=a[n]|0;if((F&1)==0){F=(F&255)>>>1}else{F=c[y>>2]|0}if((F|0)!=0&E<<24>>24==0){if((A-v|0)>=160){break}c[A>>2]=z;z=0;A=A+4|0;break}else{G=g}while(1){F=G+1|0;if((a[G]|0)==E<<24>>24){break}if((F|0)==(s|0)){G=s;break}else{G=F}}E=G-x|0;if((E|0)>23){break a}if((E|0)<22){a[C]=a[1e4+E|0]|0;z=z+1|0;C=C+1|0;break}if(D){B=C;break a}if((C-B|0)>=3){break a}if((a[C-1|0]|0)!=48){break a}a[C]=a[1e4+E|0]|0;z=0;C=C+1|0}}while(0);D=c[e>>2]|0;F=D+12|0;E=c[F>>2]|0;if((E|0)==(c[D+16>>2]|0)){Ec[c[(c[D>>2]|0)+40>>2]&127](D)|0;continue}else{c[F>>2]=E+1;continue}}a[B+3|0]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);G=Dl(B,c[3042]|0,1312,(F=i,i=i+8|0,c[F>>2]=j,F)|0)|0;i=F;if((G|0)!=1){c[h>>2]=4}g=c[e>>2]|0;do{if((g|0)==0){g=0}else{if((c[g+12>>2]|0)!=(c[g+16>>2]|0)){break}if(!((Ec[c[(c[g>>2]|0)+36>>2]&127](g)|0)==-1)){break}c[e>>2]=0;g=0}}while(0);j=(g|0)==0;n=c[f>>2]|0;do{if((n|0)==0){k=90}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){if(!j){break}G=b|0;c[G>>2]=g;me(d);me(l);i=m;return}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[f>>2]=0;k=90;break}if(!(j^(n|0)==0)){break}G=b|0;c[G>>2]=g;me(d);me(l);i=m;return}}while(0);do{if((k|0)==90){if(j){break}G=b|0;c[G>>2]=g;me(d);me(l);i=m;return}}while(0);c[h>>2]=c[h>>2]|2;G=b|0;c[G>>2]=g;me(d);me(l);i=m;return}}while(0);G=oc(4)|0;Fm(G);Fb(G|0,8456,134)}function gg(a){a=a|0;Nd(a|0);dn(a);return}function hg(a){a=a|0;Nd(a|0);return}function ig(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;k=i;i=i+112|0;n=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[n>>2];n=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[n>>2];n=k|0;p=k+16|0;q=k+32|0;u=k+40|0;s=k+48|0;t=k+56|0;r=k+64|0;o=k+72|0;l=k+80|0;m=k+104|0;if((c[g+4>>2]&1|0)==0){c[q>>2]=-1;p=c[(c[d>>2]|0)+16>>2]|0;r=e|0;c[s>>2]=c[r>>2];c[t>>2]=c[f>>2];zc[p&127](u,d,s,t,g,h,q);e=c[u>>2]|0;c[r>>2]=e;f=c[q>>2]|0;if((f|0)==0){a[j]=0}else if((f|0)==1){a[j]=1}else{a[j]=1;c[h>>2]=4}c[b>>2]=e;i=k;return}Ge(r,g);q=r|0;r=c[q>>2]|0;if(!((c[3426]|0)==-1)){c[p>>2]=13704;c[p+4>>2]=16;c[p+8>>2]=0;he(13704,p,100)}p=(c[3427]|0)-1|0;s=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-s>>2>>>0>p>>>0){p=c[s+(p<<2)>>2]|0;if((p|0)==0){break}Pd(c[q>>2]|0)|0;Ge(o,g);o=o|0;g=c[o>>2]|0;if(!((c[3330]|0)==-1)){c[n>>2]=13320;c[n+4>>2]=16;c[n+8>>2]=0;he(13320,n,100)}n=(c[3331]|0)-1|0;q=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-q>>2>>>0>n>>>0){n=c[q+(n<<2)>>2]|0;if((n|0)==0){break}t=n;Pd(c[o>>2]|0)|0;u=l|0;d=n;Bc[c[(c[d>>2]|0)+24>>2]&127](u,t);Bc[c[(c[d>>2]|0)+28>>2]&127](l+12|0,t);c[m>>2]=c[f>>2];a[j]=(El(e,m,u,l+24|0,p,h,1)|0)==(u|0)|0;c[b>>2]=c[e>>2];ye(l+12|0);ye(l|0);i=k;return}}while(0);u=oc(4)|0;Fm(u);Fb(u|0,8456,134)}}while(0);u=oc(4)|0;Fm(u);Fb(u|0,8456,134)}function jg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Fl(a,b,e,d,f,g,h);i=j;return}function kg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Gl(a,b,e,d,f,g,h);i=j;return}function lg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Hl(a,b,e,d,f,g,h);i=j;return}function mg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Il(a,b,e,d,f,g,h);i=j;return}function ng(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Jl(a,b,e,d,f,g,h);i=j;return}function og(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Kl(a,b,e,d,f,g,h);i=j;return}function pg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Ll(a,b,e,d,f,g,h);i=j;return}function qg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Ml(a,b,e,d,f,g,h);i=j;return}function rg(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Nl(a,b,e,d,f,g,h);i=j;return}function sg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;m=i;i=i+320|0;p=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[p>>2];p=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[p>>2];p=m|0;y=m+16|0;l=m+120|0;o=m+136|0;d=m+144|0;A=m+160|0;n=l;zn(n|0,0,12)|0;Ge(o,g);o=o|0;g=c[o>>2]|0;if(!((c[3426]|0)==-1)){c[p>>2]=13704;c[p+4>>2]=16;c[p+8>>2]=0;he(13704,p,100)}q=(c[3427]|0)-1|0;p=c[g+8>>2]|0;do{if((c[g+12>>2]|0)-p>>2>>>0>q>>>0){p=c[p+(q<<2)>>2]|0;if((p|0)==0){break}g=y|0;Cc[c[(c[p>>2]|0)+48>>2]&31](p,1e4,10026,g)|0;Pd(c[o>>2]|0)|0;q=d;zn(q|0,0,12)|0;pe(d,10,0);if((a[q]&1)==0){o=d+1|0;C=o;p=d+8|0}else{p=d+8|0;C=c[p>>2]|0;o=d+1|0}e=e|0;f=f|0;u=d|0;s=d+4|0;v=y+96|0;r=y+100|0;t=A;w=y+104|0;x=l+4|0;B=C;z=0;A=A|0;D=C;C=c[e>>2]|0;a:while(1){do{if((C|0)==0){E=1;C=0}else{E=c[C+12>>2]|0;if((E|0)==(c[C+16>>2]|0)){E=Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{E=c[E>>2]|0}if(!((E|0)==-1)){E=0;break}c[e>>2]=0;E=1;C=0}}while(0);G=c[f>>2]|0;do{if((G|0)==0){k=26}else{F=c[G+12>>2]|0;if((F|0)==(c[G+16>>2]|0)){F=Ec[c[(c[G>>2]|0)+36>>2]&127](G)|0}else{F=c[F>>2]|0}if((F|0)==-1){c[f>>2]=0;k=26;break}else{if(E){break}else{break a}}}}while(0);if((k|0)==26){k=0;if(E){break}}E=a[q]|0;G=(E&1)==0;if(G){F=(E&255)>>>1}else{F=c[s>>2]|0}if((D-B|0)==(F|0)){if(G){B=(E&255)>>>1;D=(E&255)>>>1}else{D=c[s>>2]|0;B=D}pe(d,B<<1,0);if((a[q]&1)==0){B=10}else{B=(c[u>>2]&-2)-1|0}pe(d,B,0);if((a[q]&1)==0){E=o}else{E=c[p>>2]|0}B=E;D=E+D|0}E=c[C+12>>2]|0;if((E|0)==(c[C+16>>2]|0)){E=Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0}else{E=c[E>>2]|0}C=(D|0)==(B|0);do{if(C){F=(c[v>>2]|0)==(E|0);if(!(F|(c[r>>2]|0)==(E|0))){k=53;break}a[D]=F?43:45;z=0;D=D+1|0}else{k=53}}while(0);do{if((k|0)==53){k=0;F=a[n]|0;if((F&1)==0){F=(F&255)>>>1}else{F=c[x>>2]|0}if((F|0)!=0&(E|0)==0){if((A-t|0)>=160){break}c[A>>2]=z;z=0;A=A+4|0;break}else{G=g}while(1){F=G+4|0;if((c[G>>2]|0)==(E|0)){break}if((F|0)==(w|0)){G=w;break}else{G=F}}E=G-y|0;F=E>>2;if((E|0)>92){break a}if((E|0)<88){a[D]=a[1e4+F|0]|0;z=z+1|0;D=D+1|0;break}if(C){B=D;break a}if((D-B|0)>=3){break a}if((a[D-1|0]|0)!=48){break a}a[D]=a[1e4+F|0]|0;z=0;D=D+1|0}}while(0);C=c[e>>2]|0;E=C+12|0;F=c[E>>2]|0;if((F|0)==(c[C+16>>2]|0)){Ec[c[(c[C>>2]|0)+40>>2]&127](C)|0;continue}else{c[E>>2]=F+4;continue}}a[B+3|0]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);G=Dl(B,c[3042]|0,1312,(F=i,i=i+8|0,c[F>>2]=j,F)|0)|0;i=F;if((G|0)!=1){c[h>>2]=4}n=c[e>>2]|0;do{if((n|0)==0){j=1;n=0}else{j=c[n+12>>2]|0;if((j|0)==(c[n+16>>2]|0)){j=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{j=c[j>>2]|0}if(!((j|0)==-1)){j=0;break}c[e>>2]=0;j=1;n=0}}while(0);e=c[f>>2]|0;do{if((e|0)==0){k=91}else{g=c[e+12>>2]|0;if((g|0)==(c[e+16>>2]|0)){e=Ec[c[(c[e>>2]|0)+36>>2]&127](e)|0}else{e=c[g>>2]|0}if((e|0)==-1){c[f>>2]=0;k=91;break}if(!j){break}G=b|0;c[G>>2]=n;me(d);me(l);i=m;return}}while(0);do{if((k|0)==91){if(j){break}G=b|0;c[G>>2]=n;me(d);me(l);i=m;return}}while(0);c[h>>2]=c[h>>2]|2;G=b|0;c[G>>2]=n;me(d);me(l);i=m;return}}while(0);G=oc(4)|0;Fm(G);Fb(G|0,8456,134)}function tg(b,d,e,f,g,h,i,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0;n=c[f>>2]|0;m=(n|0)==(e|0);do{if(m){o=(c[l+96>>2]|0)==(b|0);if(!o){if((c[l+100>>2]|0)!=(b|0)){break}}c[f>>2]=e+1;a[e]=o?43:45;c[g>>2]=0;o=0;return o|0}}while(0);o=a[i]|0;if((o&1)==0){i=(o&255)>>>1}else{i=c[i+4>>2]|0}if((i|0)!=0&(b|0)==(h|0)){e=c[k>>2]|0;if((e-j|0)>=160){o=0;return o|0}o=c[g>>2]|0;c[k>>2]=e+4;c[e>>2]=o;c[g>>2]=0;o=0;return o|0}k=l+104|0;j=l;while(1){h=j+4|0;if((c[j>>2]|0)==(b|0)){break}if((h|0)==(k|0)){j=k;break}else{j=h}}b=j-l|0;l=b>>2;if((b|0)>92){o=-1;return o|0}do{if((d|0)==8|(d|0)==10){if((l|0)<(d|0)){break}else{g=-1}return g|0}else if((d|0)==16){if((b|0)<88){break}if(m){o=-1;return o|0}if((n-e|0)>=3){o=-1;return o|0}if((a[n-1|0]|0)!=48){o=-1;return o|0}c[g>>2]=0;o=a[1e4+l|0]|0;c[f>>2]=n+1;a[n]=o;o=0;return o|0}}while(0);o=a[1e4+l|0]|0;c[f>>2]=n+1;a[n]=o;c[g>>2]=(c[g>>2]|0)+1;o=0;return o|0}function ug(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+40|0;h=g|0;k=g+16|0;j=g+32|0;Ge(j,d);d=j|0;j=c[d>>2]|0;if(!((c[3428]|0)==-1)){c[k>>2]=13712;c[k+4>>2]=16;c[k+8>>2]=0;he(13712,k,100)}k=(c[3429]|0)-1|0;l=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-l>>2>>>0>k>>>0){j=c[l+(k<<2)>>2]|0;if((j|0)==0){break}Cc[c[(c[j>>2]|0)+32>>2]&31](j,1e4,10026,e)|0;e=c[d>>2]|0;if(!((c[3332]|0)==-1)){c[h>>2]=13328;c[h+4>>2]=16;c[h+8>>2]=0;he(13328,h,100)}h=(c[3333]|0)-1|0;j=c[e+8>>2]|0;do{if((c[e+12>>2]|0)-j>>2>>>0>h>>>0){h=c[j+(h<<2)>>2]|0;if((h|0)==0){break}l=h;a[f]=Ec[c[(c[h>>2]|0)+16>>2]&127](l)|0;Bc[c[(c[h>>2]|0)+20>>2]&127](b,l);Pd(c[d>>2]|0)|0;i=g;return}}while(0);l=oc(4)|0;Fm(l);Fb(l|0,8456,134)}}while(0);l=oc(4)|0;Fm(l);Fb(l|0,8456,134)}function vg(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0;h=i;i=i+40|0;j=h|0;l=h+16|0;k=h+32|0;Ge(k,d);d=k|0;k=c[d>>2]|0;if(!((c[3428]|0)==-1)){c[l>>2]=13712;c[l+4>>2]=16;c[l+8>>2]=0;he(13712,l,100)}l=(c[3429]|0)-1|0;m=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-m>>2>>>0>l>>>0){k=c[m+(l<<2)>>2]|0;if((k|0)==0){break}Cc[c[(c[k>>2]|0)+32>>2]&31](k,1e4,10032,e)|0;e=c[d>>2]|0;if(!((c[3332]|0)==-1)){c[j>>2]=13328;c[j+4>>2]=16;c[j+8>>2]=0;he(13328,j,100)}j=(c[3333]|0)-1|0;k=c[e+8>>2]|0;do{if((c[e+12>>2]|0)-k>>2>>>0>j>>>0){j=c[k+(j<<2)>>2]|0;if((j|0)==0){break}m=j;l=j;a[f]=Ec[c[(c[l>>2]|0)+12>>2]&127](m)|0;a[g]=Ec[c[(c[l>>2]|0)+16>>2]&127](m)|0;Bc[c[(c[j>>2]|0)+20>>2]&127](b,m);Pd(c[d>>2]|0)|0;i=h;return}}while(0);m=oc(4)|0;Fm(m);Fb(m|0,8456,134)}}while(0);m=oc(4)|0;Fm(m);Fb(m|0,8456,134)}function wg(b,d,e,f,g,h,i,j,k,l,m,n){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0;if(b<<24>>24==h<<24>>24){if((a[d]|0)==0){o=-1;return o|0}a[d]=0;o=c[g>>2]|0;c[g>>2]=o+1;a[o]=46;g=a[j]|0;if((g&1)==0){g=(g&255)>>>1}else{g=c[j+4>>2]|0}if((g|0)==0){o=0;return o|0}g=c[l>>2]|0;if((g-k|0)>=160){o=0;return o|0}o=c[m>>2]|0;c[l>>2]=g+4;c[g>>2]=o;o=0;return o|0}do{if(b<<24>>24==i<<24>>24){h=a[j]|0;if((h&1)==0){h=(h&255)>>>1}else{h=c[j+4>>2]|0}if((h|0)==0){break}if((a[d]|0)==0){o=-1;return o|0}g=c[l>>2]|0;if((g-k|0)>=160){o=0;return o|0}o=c[m>>2]|0;c[l>>2]=g+4;c[g>>2]=o;c[m>>2]=0;o=0;return o|0}}while(0);i=n+32|0;o=n;while(1){h=o+1|0;if((a[o]|0)==b<<24>>24){i=o;break}if((h|0)==(i|0)){break}else{o=h}}b=i-n|0;if((b|0)>31){o=-1;return o|0}n=a[1e4+b|0]|0;if((b|0)==22|(b|0)==23){a[e]=80;o=c[g>>2]|0;c[g>>2]=o+1;a[o]=n;o=0;return o|0}else if((b|0)==25|(b|0)==24){m=c[g>>2]|0;do{if((m|0)!=(f|0)){if((a[m-1|0]&95|0)==(a[e]&127|0)){break}else{m=-1}return m|0}}while(0);c[g>>2]=m+1;a[m]=n;o=0;return o|0}else{f=a[e]|0;do{if((n&95|0)==(f<<24>>24|0)){a[e]=f|-128;if((a[d]|0)==0){break}a[d]=0;e=a[j]|0;if((e&1)==0){j=(e&255)>>>1}else{j=c[j+4>>2]|0}if((j|0)==0){break}j=c[l>>2]|0;if((j-k|0)>=160){break}o=c[m>>2]|0;c[l>>2]=j+4;c[j>>2]=o}}while(0);o=c[g>>2]|0;c[g>>2]=o+1;a[o]=n;if((b|0)>21){o=0;return o|0}c[m>>2]=(c[m>>2]|0)+1;o=0;return o|0}return 0}function xg(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0;f=i;i=i+40|0;g=f|0;j=f+16|0;h=f+32|0;Ge(h,b);b=h|0;h=c[b>>2]|0;if(!((c[3426]|0)==-1)){c[j>>2]=13704;c[j+4>>2]=16;c[j+8>>2]=0;he(13704,j,100)}j=(c[3427]|0)-1|0;k=c[h+8>>2]|0;do{if((c[h+12>>2]|0)-k>>2>>>0>j>>>0){h=c[k+(j<<2)>>2]|0;if((h|0)==0){break}Cc[c[(c[h>>2]|0)+48>>2]&31](h,1e4,10026,d)|0;d=c[b>>2]|0;if(!((c[3330]|0)==-1)){c[g>>2]=13320;c[g+4>>2]=16;c[g+8>>2]=0;he(13320,g,100)}g=(c[3331]|0)-1|0;h=c[d+8>>2]|0;do{if((c[d+12>>2]|0)-h>>2>>>0>g>>>0){g=c[h+(g<<2)>>2]|0;if((g|0)==0){break}k=g;c[e>>2]=Ec[c[(c[g>>2]|0)+16>>2]&127](k)|0;Bc[c[(c[g>>2]|0)+20>>2]&127](a,k);Pd(c[b>>2]|0)|0;i=f;return}}while(0);k=oc(4)|0;Fm(k);Fb(k|0,8456,134)}}while(0);k=oc(4)|0;Fm(k);Fb(k|0,8456,134)}function yg(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+40|0;h=g|0;k=g+16|0;j=g+32|0;Ge(j,b);b=j|0;j=c[b>>2]|0;if(!((c[3426]|0)==-1)){c[k>>2]=13704;c[k+4>>2]=16;c[k+8>>2]=0;he(13704,k,100)}k=(c[3427]|0)-1|0;l=c[j+8>>2]|0;do{if((c[j+12>>2]|0)-l>>2>>>0>k>>>0){j=c[l+(k<<2)>>2]|0;if((j|0)==0){break}Cc[c[(c[j>>2]|0)+48>>2]&31](j,1e4,10032,d)|0;d=c[b>>2]|0;if(!((c[3330]|0)==-1)){c[h>>2]=13320;c[h+4>>2]=16;c[h+8>>2]=0;he(13320,h,100)}h=(c[3331]|0)-1|0;j=c[d+8>>2]|0;do{if((c[d+12>>2]|0)-j>>2>>>0>h>>>0){h=c[j+(h<<2)>>2]|0;if((h|0)==0){break}l=h;k=h;c[e>>2]=Ec[c[(c[k>>2]|0)+12>>2]&127](l)|0;c[f>>2]=Ec[c[(c[k>>2]|0)+16>>2]&127](l)|0;Bc[c[(c[h>>2]|0)+20>>2]&127](a,l);Pd(c[b>>2]|0)|0;i=g;return}}while(0);l=oc(4)|0;Fm(l);Fb(l|0,8456,134)}}while(0);l=oc(4)|0;Fm(l);Fb(l|0,8456,134)}function zg(b,d,e,f,g,h,i,j,k,l,m,n){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;var o=0;if((b|0)==(h|0)){if((a[d]|0)==0){o=-1;return o|0}a[d]=0;o=c[g>>2]|0;c[g>>2]=o+1;a[o]=46;g=a[j]|0;if((g&1)==0){g=(g&255)>>>1}else{g=c[j+4>>2]|0}if((g|0)==0){o=0;return o|0}g=c[l>>2]|0;if((g-k|0)>=160){o=0;return o|0}o=c[m>>2]|0;c[l>>2]=g+4;c[g>>2]=o;o=0;return o|0}do{if((b|0)==(i|0)){h=a[j]|0;if((h&1)==0){h=(h&255)>>>1}else{h=c[j+4>>2]|0}if((h|0)==0){break}if((a[d]|0)==0){o=-1;return o|0}g=c[l>>2]|0;if((g-k|0)>=160){o=0;return o|0}o=c[m>>2]|0;c[l>>2]=g+4;c[g>>2]=o;c[m>>2]=0;o=0;return o|0}}while(0);i=n+128|0;o=n;while(1){h=o+4|0;if((c[o>>2]|0)==(b|0)){i=o;break}if((h|0)==(i|0)){break}else{o=h}}b=i-n|0;h=b>>2;if((b|0)>124){o=-1;return o|0}n=a[1e4+h|0]|0;do{if((h|0)==22|(h|0)==23){a[e]=80}else if((h|0)==25|(h|0)==24){m=c[g>>2]|0;do{if((m|0)!=(f|0)){if((a[m-1|0]&95|0)==(a[e]&127|0)){break}else{m=-1}return m|0}}while(0);c[g>>2]=m+1;a[m]=n;o=0;return o|0}else{f=a[e]|0;if((n&95|0)!=(f<<24>>24|0)){break}a[e]=f|-128;if((a[d]|0)==0){break}a[d]=0;e=a[j]|0;if((e&1)==0){j=(e&255)>>>1}else{j=c[j+4>>2]|0}if((j|0)==0){break}j=c[l>>2]|0;if((j-k|0)>=160){break}o=c[m>>2]|0;c[l>>2]=j+4;c[j>>2]=o}}while(0);o=c[g>>2]|0;c[g>>2]=o+1;a[o]=n;if((b|0)>84){o=0;return o|0}c[m>>2]=(c[m>>2]|0)+1;o=0;return o|0}function Ag(a){a=a|0;Nd(a|0);dn(a);return}function Bg(a){a=a|0;Nd(a|0);return}function Cg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0;j=i;i=i+48|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=j|0;m=j+16|0;n=j+24|0;k=j+32|0;if((c[f+4>>2]&1|0)==0){p=c[(c[d>>2]|0)+24>>2]|0;c[m>>2]=c[e>>2];Mc[p&31](b,d,m,f,g,h&1);i=j;return}Ge(n,f);f=n|0;d=c[f>>2]|0;if(!((c[3332]|0)==-1)){c[l>>2]=13328;c[l+4>>2]=16;c[l+8>>2]=0;he(13328,l,100)}l=(c[3333]|0)-1|0;m=c[d+8>>2]|0;do{if((c[d+12>>2]|0)-m>>2>>>0>l>>>0){d=c[m+(l<<2)>>2]|0;if((d|0)==0){break}l=d;Pd(c[f>>2]|0)|0;f=c[d>>2]|0;if(h){Bc[c[f+24>>2]&127](k,l)}else{Bc[c[f+28>>2]&127](k,l)}f=k;g=a[f]|0;if((g&1)==0){l=k+1|0;m=l;h=k+8|0}else{h=k+8|0;m=c[h>>2]|0;l=k+1|0}d=e|0;e=k+4|0;while(1){if((g&1)==0){n=(g&255)>>>1;g=l}else{n=c[e>>2]|0;g=c[h>>2]|0}if((m|0)==(g+n|0)){break}g=a[m]|0;p=c[d>>2]|0;do{if((p|0)!=0){o=p+24|0;n=c[o>>2]|0;if((n|0)!=(c[p+28>>2]|0)){c[o>>2]=n+1;a[n]=g;break}if(!((Nc[c[(c[p>>2]|0)+52>>2]&31](p,g&255)|0)==-1)){break}c[d>>2]=0}}while(0);m=m+1|0;g=a[f]|0}c[b>>2]=c[d>>2];me(k);i=j;return}}while(0);p=oc(4)|0;Fm(p);Fb(p|0,8456,134)}function Dg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+80|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=m|0;p=m+8|0;n=m+24|0;o=m+48|0;k=m+56|0;d=m+64|0;l=m+72|0;r=u|0;a[r]=a[2736]|0;a[r+1|0]=a[2737]|0;a[r+2|0]=a[2738]|0;a[r+3|0]=a[2739]|0;a[r+4|0]=a[2740]|0;a[r+5|0]=a[2741]|0;t=u+1|0;q=f+4|0;s=c[q>>2]|0;if((s&2048|0)!=0){a[t]=43;t=u+2|0}if((s&512|0)!=0){a[t]=35;t=t+1|0}a[t]=108;t=t+1|0;u=s&74;do{if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else if((u|0)==64){a[t]=111}else{a[t]=100}}while(0);s=p|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);r=Ol(s,12,c[3042]|0,r,(u=i,i=i+8|0,c[u>>2]=h,u)|0)|0;i=u;h=p+r|0;q=c[q>>2]&176;do{if((q|0)==16){q=a[s]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=p+1|0;break}if(!((r|0)>1&q<<24>>24==48)){j=22;break}u=a[p+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){j=22;break}p=p+2|0}else if((q|0)==32){p=h}else{j=22}}while(0);if((j|0)==22){p=s}u=n|0;Ge(d,f);Eg(s,p,h,u,o,k,d);Pd(c[d>>2]|0)|0;c[l>>2]=c[e>>2];Pl(b,l,u,c[o>>2]|0,c[k>>2]|0,f,g);i=m;return}function Eg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;l=i;i=i+48|0;m=l|0;o=l+16|0;k=l+32|0;n=j|0;j=c[n>>2]|0;if(!((c[3428]|0)==-1)){c[o>>2]=13712;c[o+4>>2]=16;c[o+8>>2]=0;he(13712,o,100)}p=(c[3429]|0)-1|0;o=c[j+8>>2]|0;if(!((c[j+12>>2]|0)-o>>2>>>0>p>>>0)){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}o=c[o+(p<<2)>>2]|0;if((o|0)==0){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}j=o;n=c[n>>2]|0;if(!((c[3332]|0)==-1)){c[m>>2]=13328;c[m+4>>2]=16;c[m+8>>2]=0;he(13328,m,100)}m=(c[3333]|0)-1|0;p=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-p>>2>>>0>m>>>0)){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}q=c[p+(m<<2)>>2]|0;if((q|0)==0){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}p=q;Bc[c[(c[q>>2]|0)+20>>2]&127](k,p);m=k;n=a[m]|0;if((n&1)==0){n=(n&255)>>>1}else{n=c[k+4>>2]|0}do{if((n|0)==0){Cc[c[(c[o>>2]|0)+32>>2]&31](j,b,e,f)|0;c[h>>2]=f+(e-b)}else{c[h>>2]=f;n=a[b]|0;if((n<<24>>24|0)==45|(n<<24>>24|0)==43){w=Nc[c[(c[o>>2]|0)+28>>2]&31](j,n)|0;n=c[h>>2]|0;c[h>>2]=n+1;a[n]=w;n=b+1|0}else{n=b}do{if((e-n|0)>1){if((a[n]|0)!=48){break}r=n+1|0;w=a[r]|0;if(!((w<<24>>24|0)==120|(w<<24>>24|0)==88)){break}v=o;u=Nc[c[(c[v>>2]|0)+28>>2]&31](j,48)|0;w=c[h>>2]|0;c[h>>2]=w+1;a[w]=u;v=Nc[c[(c[v>>2]|0)+28>>2]&31](j,a[r]|0)|0;w=c[h>>2]|0;c[h>>2]=w+1;a[w]=v;n=n+2|0}}while(0);do{if((n|0)!=(e|0)){s=e-1|0;if(s>>>0>n>>>0){r=n}else{break}do{w=a[r]|0;a[r]=a[s]|0;a[s]=w;r=r+1|0;s=s-1|0;}while(r>>>0<s>>>0)}}while(0);q=Ec[c[(c[q>>2]|0)+16>>2]&127](p)|0;if(n>>>0<e>>>0){p=k+1|0;r=k+4|0;s=k+8|0;v=0;u=0;t=n;while(1){w=(a[m]&1)==0;do{if((a[(w?p:c[s>>2]|0)+u|0]|0)!=0){if((v|0)!=(a[(w?p:c[s>>2]|0)+u|0]|0)){break}v=c[h>>2]|0;c[h>>2]=v+1;a[v]=q;v=a[m]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[r>>2]|0}u=(u>>>0<(v-1|0)>>>0)+u|0;v=0}}while(0);x=Nc[c[(c[o>>2]|0)+28>>2]&31](j,a[t]|0)|0;w=c[h>>2]|0;c[h>>2]=w+1;a[w]=x;t=t+1|0;if(t>>>0<e>>>0){v=v+1|0}else{break}}}j=f+(n-b)|0;m=c[h>>2]|0;if((j|0)==(m|0)){break}m=m-1|0;if(!(m>>>0>j>>>0)){break}do{x=a[j]|0;a[j]=a[m]|0;a[m]=x;j=j+1|0;m=m-1|0;}while(j>>>0<m>>>0)}}while(0);if((d|0)==(e|0)){x=c[h>>2]|0;c[g>>2]=x;me(k);i=l;return}else{x=f+(d-b)|0;c[g>>2]=x;me(k);i=l;return}}function Fg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;n=i;i=i+112|0;s=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[s>>2];s=n|0;q=n+8|0;o=n+32|0;p=n+80|0;l=n+88|0;d=n+96|0;m=n+104|0;c[s>>2]=37;c[s+4>>2]=0;u=s+1|0;r=f+4|0;t=c[r>>2]|0;if((t&2048|0)!=0){a[u]=43;u=s+2|0}if((t&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;a[u+1|0]=108;v=u+2|0;u=t&74;do{if((u|0)==8){if((t&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((u|0)==64){a[v]=111}else{a[v]=100}}while(0);t=q|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);j=Ol(t,22,c[3042]|0,s,(v=i,i=i+16|0,c[v>>2]=h,c[v+8>>2]=j,v)|0)|0;i=v;h=q+j|0;r=c[r>>2]&176;do{if((r|0)==32){q=h}else if((r|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){q=q+1|0;break}if(!((j|0)>1&r<<24>>24==48)){k=22;break}v=a[q+1|0]|0;if(!((v<<24>>24|0)==120|(v<<24>>24|0)==88)){k=22;break}q=q+2|0}else{k=22}}while(0);if((k|0)==22){q=t}v=o|0;Ge(d,f);Eg(t,q,h,v,p,l,d);Pd(c[d>>2]|0)|0;c[m>>2]=c[e>>2];Pl(b,m,v,c[p>>2]|0,c[l>>2]|0,f,g);i=n;return}function Gg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+80|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=m|0;p=m+8|0;o=m+24|0;n=m+48|0;k=m+56|0;d=m+64|0;l=m+72|0;r=t|0;a[r]=a[2736]|0;a[r+1|0]=a[2737]|0;a[r+2|0]=a[2738]|0;a[r+3|0]=a[2739]|0;a[r+4|0]=a[2740]|0;a[r+5|0]=a[2741]|0;u=t+1|0;q=f+4|0;s=c[q>>2]|0;if((s&2048|0)!=0){a[u]=43;u=t+2|0}if((s&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;u=u+1|0;t=s&74;do{if((t|0)==64){a[u]=111}else if((t|0)==8){if((s&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);s=p|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);r=Ol(s,12,c[3042]|0,r,(u=i,i=i+8|0,c[u>>2]=h,u)|0)|0;i=u;h=p+r|0;q=c[q>>2]&176;do{if((q|0)==16){q=a[s]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=p+1|0;break}if(!((r|0)>1&q<<24>>24==48)){j=22;break}u=a[p+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){j=22;break}p=p+2|0}else if((q|0)==32){p=h}else{j=22}}while(0);if((j|0)==22){p=s}u=o|0;Ge(d,f);Eg(s,p,h,u,n,k,d);Pd(c[d>>2]|0)|0;c[l>>2]=c[e>>2];Pl(b,l,u,c[n>>2]|0,c[k>>2]|0,f,g);i=m;return}function Hg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;n=i;i=i+112|0;s=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[s>>2];s=n|0;q=n+8|0;o=n+32|0;p=n+80|0;l=n+88|0;d=n+96|0;m=n+104|0;c[s>>2]=37;c[s+4>>2]=0;u=s+1|0;r=f+4|0;t=c[r>>2]|0;if((t&2048|0)!=0){a[u]=43;u=s+2|0}if((t&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;a[u+1|0]=108;v=u+2|0;u=t&74;do{if((u|0)==8){if((t&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((u|0)==64){a[v]=111}else{a[v]=117}}while(0);t=q|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);j=Ol(t,23,c[3042]|0,s,(v=i,i=i+16|0,c[v>>2]=h,c[v+8>>2]=j,v)|0)|0;i=v;h=q+j|0;r=c[r>>2]&176;do{if((r|0)==32){q=h}else if((r|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){q=q+1|0;break}if(!((j|0)>1&r<<24>>24==48)){k=22;break}v=a[q+1|0]|0;if(!((v<<24>>24|0)==120|(v<<24>>24|0)==88)){k=22;break}q=q+2|0}else{k=22}}while(0);if((k|0)==22){q=t}v=o|0;Ge(d,f);Eg(t,q,h,v,p,l,d);Pd(c[d>>2]|0)|0;c[m>>2]=c[e>>2];Pl(b,m,v,c[p>>2]|0,c[l>>2]|0,f,g);i=n;return}function Ig(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+152|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=k|0;t=k+8|0;p=k+40|0;r=k+48|0;n=k+112|0;d=k+120|0;m=k+128|0;l=k+136|0;o=k+144|0;c[u>>2]=37;c[u+4>>2]=0;w=u+1|0;s=f+4|0;x=c[s>>2]|0;if((x&2048|0)!=0){a[w]=43;w=u+2|0}if((x&1024|0)!=0){a[w]=35;w=w+1|0}v=x&260;y=x>>>14;do{if((v|0)==260){if((y&1|0)==0){a[w]=97;v=0;break}else{a[w]=65;v=0;break}}else{a[w]=46;x=w+2|0;a[w+1|0]=42;if((v|0)==256){if((y&1|0)==0){a[x]=101;v=1;break}else{a[x]=69;v=1;break}}else if((v|0)==4){if((y&1|0)==0){a[x]=102;v=1;break}else{a[x]=70;v=1;break}}else{if((y&1|0)==0){a[x]=103;v=1;break}else{a[x]=71;v=1;break}}}}while(0);t=t|0;c[p>>2]=t;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);w=c[3042]|0;if(v){x=Ol(t,30,w,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}else{x=Ol(t,30,w,u,(y=i,i=i+8|0,h[y>>3]=j,y)|0)|0;i=y}do{if((x|0)>29){w=(a[14272]|0)==0;if(v){do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}else{do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}v=c[p>>2]|0;if((v|0)!=0){u=v;w=v;break}jn();w=c[p>>2]|0;u=w}else{u=0;w=c[p>>2]|0}}while(0);v=w+x|0;s=c[s>>2]&176;do{if((s|0)==32){s=v}else if((s|0)==16){s=a[w]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){s=w+1|0;break}if(!((x|0)>1&s<<24>>24==48)){q=53;break}y=a[w+1|0]|0;if(!((y<<24>>24|0)==120|(y<<24>>24|0)==88)){q=53;break}s=w+2|0}else{q=53}}while(0);if((q|0)==53){s=w}do{if((w|0)==(t|0)){q=r|0;r=0}else{r=_m(x<<1)|0;if((r|0)!=0){q=r;t=w;break}jn();q=0;r=0;t=c[p>>2]|0}}while(0);Ge(m,f);Jg(t,s,v,q,n,d,m);Pd(c[m>>2]|0)|0;x=e|0;c[o>>2]=c[x>>2];Pl(l,o,q,c[n>>2]|0,c[d>>2]|0,f,g);y=c[l>>2]|0;c[x>>2]=y;c[b>>2]=y;if((r|0)!=0){$m(r)}if((u|0)==0){i=k;return}$m(u);i=k;return}function Jg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;l=i;i=i+48|0;n=l|0;m=l+16|0;k=l+32|0;o=j|0;j=c[o>>2]|0;if(!((c[3428]|0)==-1)){c[m>>2]=13712;c[m+4>>2]=16;c[m+8>>2]=0;he(13712,m,100)}p=(c[3429]|0)-1|0;m=c[j+8>>2]|0;if(!((c[j+12>>2]|0)-m>>2>>>0>p>>>0)){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}m=c[m+(p<<2)>>2]|0;if((m|0)==0){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}j=m;o=c[o>>2]|0;if(!((c[3332]|0)==-1)){c[n>>2]=13328;c[n+4>>2]=16;c[n+8>>2]=0;he(13328,n,100)}n=(c[3333]|0)-1|0;p=c[o+8>>2]|0;if(!((c[o+12>>2]|0)-p>>2>>>0>n>>>0)){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}p=c[p+(n<<2)>>2]|0;if((p|0)==0){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}o=p;Bc[c[(c[p>>2]|0)+20>>2]&127](k,o);c[h>>2]=f;n=a[b]|0;if((n<<24>>24|0)==45|(n<<24>>24|0)==43){B=Nc[c[(c[m>>2]|0)+28>>2]&31](j,n)|0;t=c[h>>2]|0;c[h>>2]=t+1;a[t]=B;t=b+1|0}else{t=b}n=e;a:do{if((n-t|0)>1){if((a[t]|0)!=48){s=21;break}q=t+1|0;B=a[q]|0;if(!((B<<24>>24|0)==120|(B<<24>>24|0)==88)){s=21;break}A=m;z=Nc[c[(c[A>>2]|0)+28>>2]&31](j,48)|0;B=c[h>>2]|0;c[h>>2]=B+1;a[B]=z;t=t+2|0;A=Nc[c[(c[A>>2]|0)+28>>2]&31](j,a[q]|0)|0;B=c[h>>2]|0;c[h>>2]=B+1;a[B]=A;if(t>>>0<e>>>0){q=t}else{r=t;q=t;break}while(1){r=a[q]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);u=q+1|0;if((Ra(r<<24>>24|0,c[3042]|0)|0)==0){r=t;break a}if(u>>>0<e>>>0){q=u}else{r=t;q=u;break}}}else{s=21}}while(0);b:do{if((s|0)==21){if(t>>>0<e>>>0){q=t}else{r=t;q=t;break}while(1){r=a[q]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);s=q+1|0;if((gb(r<<24>>24|0,c[3042]|0)|0)==0){r=t;break b}if(s>>>0<e>>>0){q=s}else{r=t;q=s;break}}}}while(0);s=k;t=a[s]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[k+4>>2]|0}do{if((t|0)==0){Cc[c[(c[m>>2]|0)+32>>2]&31](j,r,q,c[h>>2]|0)|0;c[h>>2]=(c[h>>2]|0)+(q-r)}else{do{if((r|0)!=(q|0)){u=q-1|0;if(u>>>0>r>>>0){t=r}else{break}do{B=a[t]|0;a[t]=a[u]|0;a[u]=B;t=t+1|0;u=u-1|0;}while(t>>>0<u>>>0)}}while(0);t=Ec[c[(c[p>>2]|0)+16>>2]&127](o)|0;if(r>>>0<q>>>0){w=k+1|0;v=k+4|0;x=k+8|0;u=m;A=0;z=0;y=r;while(1){B=(a[s]&1)==0;do{if((a[(B?w:c[x>>2]|0)+z|0]|0)>0){if((A|0)!=(a[(B?w:c[x>>2]|0)+z|0]|0)){break}A=c[h>>2]|0;c[h>>2]=A+1;a[A]=t;A=a[s]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[v>>2]|0}z=(z>>>0<(A-1|0)>>>0)+z|0;A=0}}while(0);C=Nc[c[(c[u>>2]|0)+28>>2]&31](j,a[y]|0)|0;B=c[h>>2]|0;c[h>>2]=B+1;a[B]=C;y=y+1|0;if(y>>>0<q>>>0){A=A+1|0}else{break}}}s=f+(r-b)|0;r=c[h>>2]|0;if((s|0)==(r|0)){break}r=r-1|0;if(!(r>>>0>s>>>0)){break}do{C=a[s]|0;a[s]=a[r]|0;a[r]=C;s=s+1|0;r=r-1|0;}while(s>>>0<r>>>0)}}while(0);c:do{if(q>>>0<e>>>0){r=m;while(1){s=a[q]|0;if(s<<24>>24==46){break}B=Nc[c[(c[r>>2]|0)+28>>2]&31](j,s)|0;C=c[h>>2]|0;c[h>>2]=C+1;a[C]=B;q=q+1|0;if(!(q>>>0<e>>>0)){break c}}B=Ec[c[(c[p>>2]|0)+12>>2]&127](o)|0;C=c[h>>2]|0;c[h>>2]=C+1;a[C]=B;q=q+1|0}}while(0);Cc[c[(c[m>>2]|0)+32>>2]&31](j,q,e,c[h>>2]|0)|0;j=(c[h>>2]|0)+(n-q)|0;c[h>>2]=j;if((d|0)==(e|0)){C=j;c[g>>2]=C;me(k);i=l;return}C=f+(d-b)|0;c[g>>2]=C;me(k);i=l;return}function Kg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;m=i;i=i+152|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=m|0;t=m+8|0;p=m+40|0;r=m+48|0;o=m+112|0;d=m+120|0;n=m+128|0;l=m+136|0;k=m+144|0;c[u>>2]=37;c[u+4>>2]=0;x=u+1|0;s=f+4|0;w=c[s>>2]|0;if((w&2048|0)!=0){a[x]=43;x=u+2|0}if((w&1024|0)!=0){a[x]=35;x=x+1|0}v=w&260;w=w>>>14;do{if((v|0)==260){a[x]=76;v=x+1|0;if((w&1|0)==0){a[v]=97;v=0;break}else{a[v]=65;v=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;x=x+3|0;if((v|0)==256){if((w&1|0)==0){a[x]=101;v=1;break}else{a[x]=69;v=1;break}}else if((v|0)==4){if((w&1|0)==0){a[x]=102;v=1;break}else{a[x]=70;v=1;break}}else{if((w&1|0)==0){a[x]=103;v=1;break}else{a[x]=71;v=1;break}}}}while(0);t=t|0;c[p>>2]=t;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);w=c[3042]|0;if(v){x=Ol(t,30,w,u,(w=i,i=i+16|0,c[w>>2]=c[f+8>>2],h[w+8>>3]=j,w)|0)|0;i=w}else{x=Ol(t,30,w,u,(w=i,i=i+8|0,h[w>>3]=j,w)|0)|0;i=w}do{if((x|0)>29){w=(a[14272]|0)==0;if(v){do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(w=i,i=i+16|0,c[w>>2]=c[f+8>>2],h[w+8>>3]=j,w)|0)|0;i=w}else{do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(w=i,i=i+8|0,h[w>>3]=j,w)|0)|0;i=w}v=c[p>>2]|0;if((v|0)!=0){u=v;w=v;break}jn();w=c[p>>2]|0;u=w}else{u=0;w=c[p>>2]|0}}while(0);v=w+x|0;s=c[s>>2]&176;do{if((s|0)==16){s=a[w]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){s=w+1|0;break}if(!((x|0)>1&s<<24>>24==48)){q=53;break}s=a[w+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){q=53;break}s=w+2|0}else if((s|0)==32){s=v}else{q=53}}while(0);if((q|0)==53){s=w}do{if((w|0)==(t|0)){q=r|0;r=0}else{r=_m(x<<1)|0;if((r|0)!=0){q=r;t=w;break}jn();q=0;r=0;t=c[p>>2]|0}}while(0);Ge(n,f);Jg(t,s,v,q,o,d,n);Pd(c[n>>2]|0)|0;w=e|0;c[k>>2]=c[w>>2];Pl(l,k,q,c[o>>2]|0,c[d>>2]|0,f,g);x=c[l>>2]|0;c[w>>2]=x;c[b>>2]=x;if((r|0)!=0){$m(r)}if((u|0)==0){i=m;return}$m(u);i=m;return}function Lg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;j=i;i=i+104|0;p=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[p>>2];p=j|0;l=j+24|0;k=j+48|0;r=j+88|0;d=j+96|0;n=j+16|0;a[n]=a[2744]|0;a[n+1|0]=a[2745]|0;a[n+2|0]=a[2746]|0;a[n+3|0]=a[2747]|0;a[n+4|0]=a[2748]|0;a[n+5|0]=a[2749]|0;m=l|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);n=Ol(m,20,c[3042]|0,n,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;h=l+n|0;o=c[f+4>>2]&176;do{if((o|0)==16){o=a[m]|0;if((o<<24>>24|0)==45|(o<<24>>24|0)==43){o=l+1|0;break}if(!((n|0)>1&o<<24>>24==48)){q=12;break}t=a[l+1|0]|0;if(!((t<<24>>24|0)==120|(t<<24>>24|0)==88)){q=12;break}o=l+2|0}else if((o|0)==32){o=h}else{q=12}}while(0);if((q|0)==12){o=m}q=k|0;Ge(r,f);r=r|0;s=c[r>>2]|0;if(!((c[3428]|0)==-1)){c[p>>2]=13712;c[p+4>>2]=16;c[p+8>>2]=0;he(13712,p,100)}p=(c[3429]|0)-1|0;t=c[s+8>>2]|0;do{if((c[s+12>>2]|0)-t>>2>>>0>p>>>0){p=c[t+(p<<2)>>2]|0;if((p|0)==0){break}Pd(c[r>>2]|0)|0;Cc[c[(c[p>>2]|0)+32>>2]&31](p,m,h,q)|0;m=k+n|0;if((o|0)==(h|0)){t=m;r=e|0;r=c[r>>2]|0;s=d|0;c[s>>2]=r;Pl(b,d,q,t,m,f,g);i=j;return}t=k+(o-l)|0;r=e|0;r=c[r>>2]|0;s=d|0;c[s>>2]=r;Pl(b,d,q,t,m,f,g);i=j;return}}while(0);t=oc(4)|0;Fm(t);Fb(t|0,8456,134)}function Mg(a){a=a|0;Nd(a|0);dn(a);return}function Ng(a){a=a|0;Nd(a|0);return}function Og(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;j=i;i=i+48|0;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=j|0;m=j+16|0;n=j+24|0;k=j+32|0;if((c[f+4>>2]&1|0)==0){o=c[(c[d>>2]|0)+24>>2]|0;c[m>>2]=c[e>>2];Mc[o&31](b,d,m,f,g,h&1);i=j;return}Ge(n,f);m=n|0;n=c[m>>2]|0;if(!((c[3330]|0)==-1)){c[l>>2]=13320;c[l+4>>2]=16;c[l+8>>2]=0;he(13320,l,100)}l=(c[3331]|0)-1|0;d=c[n+8>>2]|0;do{if((c[n+12>>2]|0)-d>>2>>>0>l>>>0){n=c[d+(l<<2)>>2]|0;if((n|0)==0){break}l=n;Pd(c[m>>2]|0)|0;m=c[n>>2]|0;if(h){Bc[c[m+24>>2]&127](k,l)}else{Bc[c[m+28>>2]&127](k,l)}m=k;d=a[m]|0;if((d&1)==0){l=k+4|0;n=l;h=k+8|0}else{h=k+8|0;n=c[h>>2]|0;l=k+4|0}e=e|0;while(1){if((d&1)==0){d=(d&255)>>>1;f=l}else{d=c[l>>2]|0;f=c[h>>2]|0}if((n|0)==(f+(d<<2)|0)){break}d=c[n>>2]|0;f=c[e>>2]|0;do{if((f|0)!=0){g=f+24|0;o=c[g>>2]|0;if((o|0)==(c[f+28>>2]|0)){d=Nc[c[(c[f>>2]|0)+52>>2]&31](f,d)|0}else{c[g>>2]=o+4;c[o>>2]=d}if(!((d|0)==-1)){break}c[e>>2]=0}}while(0);n=n+4|0;d=a[m]|0}c[b>>2]=c[e>>2];ye(k);i=j;return}}while(0);o=oc(4)|0;Fm(o);Fb(o|0,8456,134)}function Pg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+144|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=m|0;p=m+8|0;o=m+24|0;n=m+112|0;k=m+120|0;d=m+128|0;l=m+136|0;r=u|0;a[r]=a[2736]|0;a[r+1|0]=a[2737]|0;a[r+2|0]=a[2738]|0;a[r+3|0]=a[2739]|0;a[r+4|0]=a[2740]|0;a[r+5|0]=a[2741]|0;t=u+1|0;q=f+4|0;s=c[q>>2]|0;if((s&2048|0)!=0){a[t]=43;t=u+2|0}if((s&512|0)!=0){a[t]=35;t=t+1|0}a[t]=108;t=t+1|0;u=s&74;do{if((u|0)==64){a[t]=111}else if((u|0)==8){if((s&16384|0)==0){a[t]=120;break}else{a[t]=88;break}}else{a[t]=100}}while(0);s=p|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);r=Ol(s,12,c[3042]|0,r,(u=i,i=i+8|0,c[u>>2]=h,u)|0)|0;i=u;h=p+r|0;q=c[q>>2]&176;do{if((q|0)==32){p=h}else if((q|0)==16){q=a[s]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=p+1|0;break}if(!((r|0)>1&q<<24>>24==48)){j=22;break}u=a[p+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){j=22;break}p=p+2|0}else{j=22}}while(0);if((j|0)==22){p=s}u=o|0;Ge(d,f);Qg(s,p,h,u,n,k,d);Pd(c[d>>2]|0)|0;c[l>>2]=c[e>>2];Rl(b,l,u,c[n>>2]|0,c[k>>2]|0,f,g);i=m;return}function Qg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;l=i;i=i+48|0;m=l|0;o=l+16|0;k=l+32|0;n=j|0;j=c[n>>2]|0;if(!((c[3426]|0)==-1)){c[o>>2]=13704;c[o+4>>2]=16;c[o+8>>2]=0;he(13704,o,100)}p=(c[3427]|0)-1|0;o=c[j+8>>2]|0;if(!((c[j+12>>2]|0)-o>>2>>>0>p>>>0)){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}o=c[o+(p<<2)>>2]|0;if((o|0)==0){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}j=o;n=c[n>>2]|0;if(!((c[3330]|0)==-1)){c[m>>2]=13320;c[m+4>>2]=16;c[m+8>>2]=0;he(13320,m,100)}p=(c[3331]|0)-1|0;m=c[n+8>>2]|0;if(!((c[n+12>>2]|0)-m>>2>>>0>p>>>0)){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}p=c[m+(p<<2)>>2]|0;if((p|0)==0){w=oc(4)|0;v=w;Fm(v);Fb(w|0,8456,134)}q=p;Bc[c[(c[p>>2]|0)+20>>2]&127](k,q);m=k;n=a[m]|0;if((n&1)==0){n=(n&255)>>>1}else{n=c[k+4>>2]|0}do{if((n|0)==0){Cc[c[(c[o>>2]|0)+48>>2]&31](j,b,e,f)|0;w=f+(e-b<<2)|0;c[h>>2]=w}else{c[h>>2]=f;n=a[b]|0;if((n<<24>>24|0)==45|(n<<24>>24|0)==43){w=Nc[c[(c[o>>2]|0)+44>>2]&31](j,n)|0;n=c[h>>2]|0;c[h>>2]=n+4;c[n>>2]=w;n=b+1|0}else{n=b}do{if((e-n|0)>1){if((a[n]|0)!=48){break}r=n+1|0;w=a[r]|0;if(!((w<<24>>24|0)==120|(w<<24>>24|0)==88)){break}v=o;u=Nc[c[(c[v>>2]|0)+44>>2]&31](j,48)|0;w=c[h>>2]|0;c[h>>2]=w+4;c[w>>2]=u;v=Nc[c[(c[v>>2]|0)+44>>2]&31](j,a[r]|0)|0;w=c[h>>2]|0;c[h>>2]=w+4;c[w>>2]=v;n=n+2|0}}while(0);do{if((n|0)!=(e|0)){s=e-1|0;if(s>>>0>n>>>0){r=n}else{break}do{w=a[r]|0;a[r]=a[s]|0;a[s]=w;r=r+1|0;s=s-1|0;}while(r>>>0<s>>>0)}}while(0);p=Ec[c[(c[p>>2]|0)+16>>2]&127](q)|0;if(n>>>0<e>>>0){q=k+1|0;s=k+4|0;r=k+8|0;v=0;u=0;t=n;while(1){w=(a[m]&1)==0;do{if((a[(w?q:c[r>>2]|0)+u|0]|0)!=0){if((v|0)!=(a[(w?q:c[r>>2]|0)+u|0]|0)){break}v=c[h>>2]|0;c[h>>2]=v+4;c[v>>2]=p;v=a[m]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[s>>2]|0}u=(u>>>0<(v-1|0)>>>0)+u|0;v=0}}while(0);y=Nc[c[(c[o>>2]|0)+44>>2]&31](j,a[t]|0)|0;x=c[h>>2]|0;w=x+4|0;c[h>>2]=w;c[x>>2]=y;t=t+1|0;if(t>>>0<e>>>0){v=v+1|0}else{break}}}else{w=c[h>>2]|0}h=f+(n-b<<2)|0;if((h|0)==(w|0)){break}j=w-4|0;if(!(j>>>0>h>>>0)){break}do{y=c[h>>2]|0;c[h>>2]=c[j>>2];c[j>>2]=y;h=h+4|0;j=j-4|0;}while(h>>>0<j>>>0)}}while(0);if((d|0)==(e|0)){y=w;c[g>>2]=y;me(k);i=l;return}y=f+(d-b<<2)|0;c[g>>2]=y;me(k);i=l;return}function Rg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;n=i;i=i+232|0;s=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[s>>2];s=n|0;q=n+8|0;o=n+32|0;p=n+200|0;l=n+208|0;d=n+216|0;m=n+224|0;c[s>>2]=37;c[s+4>>2]=0;u=s+1|0;r=f+4|0;t=c[r>>2]|0;if((t&2048|0)!=0){a[u]=43;u=s+2|0}if((t&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;a[u+1|0]=108;v=u+2|0;u=t&74;do{if((u|0)==8){if((t&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((u|0)==64){a[v]=111}else{a[v]=100}}while(0);t=q|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);j=Ol(t,22,c[3042]|0,s,(v=i,i=i+16|0,c[v>>2]=h,c[v+8>>2]=j,v)|0)|0;i=v;h=q+j|0;r=c[r>>2]&176;do{if((r|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){q=q+1|0;break}if(!((j|0)>1&r<<24>>24==48)){k=22;break}v=a[q+1|0]|0;if(!((v<<24>>24|0)==120|(v<<24>>24|0)==88)){k=22;break}q=q+2|0}else if((r|0)==32){q=h}else{k=22}}while(0);if((k|0)==22){q=t}v=o|0;Ge(d,f);Qg(t,q,h,v,p,l,d);Pd(c[d>>2]|0)|0;c[m>>2]=c[e>>2];Rl(b,m,v,c[p>>2]|0,c[l>>2]|0,f,g);i=n;return}function Sg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;m=i;i=i+144|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=m|0;p=m+8|0;o=m+24|0;n=m+112|0;k=m+120|0;d=m+128|0;l=m+136|0;r=t|0;a[r]=a[2736]|0;a[r+1|0]=a[2737]|0;a[r+2|0]=a[2738]|0;a[r+3|0]=a[2739]|0;a[r+4|0]=a[2740]|0;a[r+5|0]=a[2741]|0;u=t+1|0;q=f+4|0;s=c[q>>2]|0;if((s&2048|0)!=0){a[u]=43;u=t+2|0}if((s&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;u=u+1|0;t=s&74;do{if((t|0)==64){a[u]=111}else if((t|0)==8){if((s&16384|0)==0){a[u]=120;break}else{a[u]=88;break}}else{a[u]=117}}while(0);s=p|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);r=Ol(s,12,c[3042]|0,r,(u=i,i=i+8|0,c[u>>2]=h,u)|0)|0;i=u;h=p+r|0;q=c[q>>2]&176;do{if((q|0)==16){q=a[s]|0;if((q<<24>>24|0)==45|(q<<24>>24|0)==43){p=p+1|0;break}if(!((r|0)>1&q<<24>>24==48)){j=22;break}u=a[p+1|0]|0;if(!((u<<24>>24|0)==120|(u<<24>>24|0)==88)){j=22;break}p=p+2|0}else if((q|0)==32){p=h}else{j=22}}while(0);if((j|0)==22){p=s}u=o|0;Ge(d,f);Qg(s,p,h,u,n,k,d);Pd(c[d>>2]|0)|0;c[l>>2]=c[e>>2];Rl(b,l,u,c[n>>2]|0,c[k>>2]|0,f,g);i=m;return}function Tg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;n=i;i=i+240|0;s=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[s>>2];s=n|0;q=n+8|0;o=n+32|0;p=n+208|0;l=n+216|0;d=n+224|0;m=n+232|0;c[s>>2]=37;c[s+4>>2]=0;u=s+1|0;r=f+4|0;t=c[r>>2]|0;if((t&2048|0)!=0){a[u]=43;u=s+2|0}if((t&512|0)!=0){a[u]=35;u=u+1|0}a[u]=108;a[u+1|0]=108;v=u+2|0;u=t&74;do{if((u|0)==8){if((t&16384|0)==0){a[v]=120;break}else{a[v]=88;break}}else if((u|0)==64){a[v]=111}else{a[v]=117}}while(0);t=q|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);j=Ol(t,23,c[3042]|0,s,(v=i,i=i+16|0,c[v>>2]=h,c[v+8>>2]=j,v)|0)|0;i=v;h=q+j|0;r=c[r>>2]&176;do{if((r|0)==16){r=a[t]|0;if((r<<24>>24|0)==45|(r<<24>>24|0)==43){q=q+1|0;break}if(!((j|0)>1&r<<24>>24==48)){k=22;break}v=a[q+1|0]|0;if(!((v<<24>>24|0)==120|(v<<24>>24|0)==88)){k=22;break}q=q+2|0}else if((r|0)==32){q=h}else{k=22}}while(0);if((k|0)==22){q=t}v=o|0;Ge(d,f);Qg(t,q,h,v,p,l,d);Pd(c[d>>2]|0)|0;c[m>>2]=c[e>>2];Rl(b,m,v,c[p>>2]|0,c[l>>2]|0,f,g);i=n;return}function Ug(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;k=i;i=i+320|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=k|0;t=k+8|0;p=k+40|0;r=k+48|0;n=k+280|0;d=k+288|0;m=k+296|0;l=k+304|0;o=k+312|0;c[u>>2]=37;c[u+4>>2]=0;w=u+1|0;s=f+4|0;x=c[s>>2]|0;if((x&2048|0)!=0){a[w]=43;w=u+2|0}if((x&1024|0)!=0){a[w]=35;w=w+1|0}v=x&260;y=x>>>14;do{if((v|0)==260){if((y&1|0)==0){a[w]=97;v=0;break}else{a[w]=65;v=0;break}}else{a[w]=46;x=w+2|0;a[w+1|0]=42;if((v|0)==256){if((y&1|0)==0){a[x]=101;v=1;break}else{a[x]=69;v=1;break}}else if((v|0)==4){if((y&1|0)==0){a[x]=102;v=1;break}else{a[x]=70;v=1;break}}else{if((y&1|0)==0){a[x]=103;v=1;break}else{a[x]=71;v=1;break}}}}while(0);t=t|0;c[p>>2]=t;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);w=c[3042]|0;if(v){x=Ol(t,30,w,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}else{x=Ol(t,30,w,u,(y=i,i=i+8|0,h[y>>3]=j,y)|0)|0;i=y}do{if((x|0)>29){w=(a[14272]|0)==0;if(v){do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}else{do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(y=i,i=i+16|0,c[y>>2]=c[f+8>>2],h[y+8>>3]=j,y)|0)|0;i=y}v=c[p>>2]|0;if((v|0)!=0){u=v;w=v;break}jn();w=c[p>>2]|0;u=w}else{u=0;w=c[p>>2]|0}}while(0);v=w+x|0;s=c[s>>2]&176;do{if((s|0)==32){s=v}else if((s|0)==16){s=a[w]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){s=w+1|0;break}if(!((x|0)>1&s<<24>>24==48)){q=53;break}y=a[w+1|0]|0;if(!((y<<24>>24|0)==120|(y<<24>>24|0)==88)){q=53;break}s=w+2|0}else{q=53}}while(0);if((q|0)==53){s=w}do{if((w|0)==(t|0)){q=r|0;r=0}else{y=_m(x<<3)|0;r=y;if((y|0)!=0){q=r;t=w;break}jn();q=r;t=c[p>>2]|0}}while(0);Ge(m,f);Vg(t,s,v,q,n,d,m);Pd(c[m>>2]|0)|0;x=e|0;c[o>>2]=c[x>>2];Rl(l,o,q,c[n>>2]|0,c[d>>2]|0,f,g);y=c[l>>2]|0;c[x>>2]=y;c[b>>2]=y;if((r|0)!=0){$m(r)}if((u|0)==0){i=k;return}$m(u);i=k;return}function Vg(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0;l=i;i=i+48|0;n=l|0;m=l+16|0;k=l+32|0;o=j|0;j=c[o>>2]|0;if(!((c[3426]|0)==-1)){c[m>>2]=13704;c[m+4>>2]=16;c[m+8>>2]=0;he(13704,m,100)}p=(c[3427]|0)-1|0;m=c[j+8>>2]|0;if(!((c[j+12>>2]|0)-m>>2>>>0>p>>>0)){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}m=c[m+(p<<2)>>2]|0;if((m|0)==0){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}j=m;o=c[o>>2]|0;if(!((c[3330]|0)==-1)){c[n>>2]=13320;c[n+4>>2]=16;c[n+8>>2]=0;he(13320,n,100)}p=(c[3331]|0)-1|0;n=c[o+8>>2]|0;if(!((c[o+12>>2]|0)-n>>2>>>0>p>>>0)){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}o=c[n+(p<<2)>>2]|0;if((o|0)==0){B=oc(4)|0;A=B;Fm(A);Fb(B|0,8456,134)}p=o;Bc[c[(c[o>>2]|0)+20>>2]&127](k,p);c[h>>2]=f;n=a[b]|0;if((n<<24>>24|0)==45|(n<<24>>24|0)==43){B=Nc[c[(c[m>>2]|0)+44>>2]&31](j,n)|0;t=c[h>>2]|0;c[h>>2]=t+4;c[t>>2]=B;t=b+1|0}else{t=b}n=e;a:do{if((n-t|0)>1){if((a[t]|0)!=48){s=21;break}q=t+1|0;B=a[q]|0;if(!((B<<24>>24|0)==120|(B<<24>>24|0)==88)){s=21;break}A=m;z=Nc[c[(c[A>>2]|0)+44>>2]&31](j,48)|0;B=c[h>>2]|0;c[h>>2]=B+4;c[B>>2]=z;t=t+2|0;A=Nc[c[(c[A>>2]|0)+44>>2]&31](j,a[q]|0)|0;B=c[h>>2]|0;c[h>>2]=B+4;c[B>>2]=A;if(t>>>0<e>>>0){q=t}else{r=t;q=t;break}while(1){r=a[q]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);u=q+1|0;if((Ra(r<<24>>24|0,c[3042]|0)|0)==0){r=t;break a}if(u>>>0<e>>>0){q=u}else{r=t;q=u;break}}}else{s=21}}while(0);b:do{if((s|0)==21){if(t>>>0<e>>>0){q=t}else{r=t;q=t;break}while(1){r=a[q]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);s=q+1|0;if((gb(r<<24>>24|0,c[3042]|0)|0)==0){r=t;break b}if(s>>>0<e>>>0){q=s}else{r=t;q=s;break}}}}while(0);s=k;t=a[s]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[k+4>>2]|0}do{if((t|0)==0){Cc[c[(c[m>>2]|0)+48>>2]&31](j,r,q,c[h>>2]|0)|0;B=(c[h>>2]|0)+(q-r<<2)|0;c[h>>2]=B}else{do{if((r|0)!=(q|0)){u=q-1|0;if(u>>>0>r>>>0){t=r}else{break}do{B=a[t]|0;a[t]=a[u]|0;a[u]=B;t=t+1|0;u=u-1|0;}while(t>>>0<u>>>0)}}while(0);w=Ec[c[(c[o>>2]|0)+16>>2]&127](p)|0;if(r>>>0<q>>>0){t=k+1|0;x=k+4|0;u=k+8|0;v=m;A=0;z=0;y=r;while(1){B=(a[s]&1)==0;do{if((a[(B?t:c[u>>2]|0)+z|0]|0)>0){if((A|0)!=(a[(B?t:c[u>>2]|0)+z|0]|0)){break}A=c[h>>2]|0;c[h>>2]=A+4;c[A>>2]=w;A=a[s]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[x>>2]|0}z=(z>>>0<(A-1|0)>>>0)+z|0;A=0}}while(0);D=Nc[c[(c[v>>2]|0)+44>>2]&31](j,a[y]|0)|0;C=c[h>>2]|0;B=C+4|0;c[h>>2]=B;c[C>>2]=D;y=y+1|0;if(y>>>0<q>>>0){A=A+1|0}else{break}}}else{B=c[h>>2]|0}r=f+(r-b<<2)|0;if((r|0)==(B|0)){break}s=B-4|0;if(!(s>>>0>r>>>0)){break}do{D=c[r>>2]|0;c[r>>2]=c[s>>2];c[s>>2]=D;r=r+4|0;s=s-4|0;}while(r>>>0<s>>>0)}}while(0);c:do{if(q>>>0<e>>>0){r=m;while(1){s=a[q]|0;if(s<<24>>24==46){break}C=Nc[c[(c[r>>2]|0)+44>>2]&31](j,s)|0;D=c[h>>2]|0;B=D+4|0;c[h>>2]=B;c[D>>2]=C;q=q+1|0;if(!(q>>>0<e>>>0)){break c}}C=Ec[c[(c[o>>2]|0)+12>>2]&127](p)|0;D=c[h>>2]|0;B=D+4|0;c[h>>2]=B;c[D>>2]=C;q=q+1|0}}while(0);Cc[c[(c[m>>2]|0)+48>>2]&31](j,q,e,B)|0;j=(c[h>>2]|0)+(n-q<<2)|0;c[h>>2]=j;if((d|0)==(e|0)){D=j;c[g>>2]=D;me(k);i=l;return}D=f+(d-b<<2)|0;c[g>>2]=D;me(k);i=l;return}function Wg(b,d,e,f,g,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=+j;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;m=i;i=i+320|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=m|0;t=m+8|0;p=m+40|0;r=m+48|0;o=m+280|0;d=m+288|0;n=m+296|0;l=m+304|0;k=m+312|0;c[u>>2]=37;c[u+4>>2]=0;x=u+1|0;s=f+4|0;w=c[s>>2]|0;if((w&2048|0)!=0){a[x]=43;x=u+2|0}if((w&1024|0)!=0){a[x]=35;x=x+1|0}v=w&260;w=w>>>14;do{if((v|0)==260){a[x]=76;v=x+1|0;if((w&1|0)==0){a[v]=97;v=0;break}else{a[v]=65;v=0;break}}else{a[x]=46;a[x+1|0]=42;a[x+2|0]=76;x=x+3|0;if((v|0)==4){if((w&1|0)==0){a[x]=102;v=1;break}else{a[x]=70;v=1;break}}else if((v|0)==256){if((w&1|0)==0){a[x]=101;v=1;break}else{a[x]=69;v=1;break}}else{if((w&1|0)==0){a[x]=103;v=1;break}else{a[x]=71;v=1;break}}}}while(0);t=t|0;c[p>>2]=t;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);w=c[3042]|0;if(v){x=Ol(t,30,w,u,(w=i,i=i+16|0,c[w>>2]=c[f+8>>2],h[w+8>>3]=j,w)|0)|0;i=w}else{x=Ol(t,30,w,u,(w=i,i=i+8|0,h[w>>3]=j,w)|0)|0;i=w}do{if((x|0)>29){w=(a[14272]|0)==0;if(v){do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(w=i,i=i+16|0,c[w>>2]=c[f+8>>2],h[w+8>>3]=j,w)|0)|0;i=w}else{do{if(w){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);x=Ql(p,c[3042]|0,u,(w=i,i=i+8|0,h[w>>3]=j,w)|0)|0;i=w}v=c[p>>2]|0;if((v|0)!=0){u=v;w=v;break}jn();w=c[p>>2]|0;u=w}else{u=0;w=c[p>>2]|0}}while(0);v=w+x|0;s=c[s>>2]&176;do{if((s|0)==16){s=a[w]|0;if((s<<24>>24|0)==45|(s<<24>>24|0)==43){s=w+1|0;break}if(!((x|0)>1&s<<24>>24==48)){q=53;break}s=a[w+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){q=53;break}s=w+2|0}else if((s|0)==32){s=v}else{q=53}}while(0);if((q|0)==53){s=w}do{if((w|0)==(t|0)){q=r|0;r=0}else{x=_m(x<<3)|0;r=x;if((x|0)!=0){q=r;t=w;break}jn();q=r;t=c[p>>2]|0}}while(0);Ge(n,f);Vg(t,s,v,q,o,d,n);Pd(c[n>>2]|0)|0;w=e|0;c[k>>2]=c[w>>2];Rl(l,k,q,c[o>>2]|0,c[d>>2]|0,f,g);x=c[l>>2]|0;c[w>>2]=x;c[b>>2]=x;if((r|0)!=0){$m(r)}if((u|0)==0){i=m;return}$m(u);i=m;return}function Xg(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;j=i;i=i+216|0;p=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[p>>2];p=j|0;l=j+24|0;k=j+48|0;r=j+200|0;d=j+208|0;n=j+16|0;a[n]=a[2744]|0;a[n+1|0]=a[2745]|0;a[n+2|0]=a[2746]|0;a[n+3|0]=a[2747]|0;a[n+4|0]=a[2748]|0;a[n+5|0]=a[2749]|0;m=l|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);n=Ol(m,20,c[3042]|0,n,(o=i,i=i+8|0,c[o>>2]=h,o)|0)|0;i=o;h=l+n|0;o=c[f+4>>2]&176;do{if((o|0)==16){o=a[m]|0;if((o<<24>>24|0)==45|(o<<24>>24|0)==43){o=l+1|0;break}if(!((n|0)>1&o<<24>>24==48)){q=12;break}s=a[l+1|0]|0;if(!((s<<24>>24|0)==120|(s<<24>>24|0)==88)){q=12;break}o=l+2|0}else if((o|0)==32){o=h}else{q=12}}while(0);if((q|0)==12){o=m}Ge(r,f);q=r|0;r=c[q>>2]|0;if(!((c[3426]|0)==-1)){c[p>>2]=13704;c[p+4>>2]=16;c[p+8>>2]=0;he(13704,p,100)}p=(c[3427]|0)-1|0;s=c[r+8>>2]|0;do{if((c[r+12>>2]|0)-s>>2>>>0>p>>>0){r=c[s+(p<<2)>>2]|0;if((r|0)==0){break}Pd(c[q>>2]|0)|0;p=k|0;Cc[c[(c[r>>2]|0)+48>>2]&31](r,m,h,p)|0;m=k+(n<<2)|0;if((o|0)==(h|0)){s=m;q=e|0;q=c[q>>2]|0;r=d|0;c[r>>2]=q;Rl(b,d,p,s,m,f,g);i=j;return}s=k+(o-l<<2)|0;q=e|0;q=c[q>>2]|0;r=d|0;c[r>>2]=q;Rl(b,d,p,s,m,f,g);i=j;return}}while(0);s=oc(4)|0;Fm(s);Fb(s|0,8456,134)}function Yg(d,e,f,g,h,j,k,l,m){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+48|0;u=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[u>>2];u=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[u>>2];u=n|0;t=n+16|0;q=n+24|0;p=n+32|0;r=n+40|0;Ge(t,h);t=t|0;s=c[t>>2]|0;if(!((c[3428]|0)==-1)){c[u>>2]=13712;c[u+4>>2]=16;c[u+8>>2]=0;he(13712,u,100)}v=(c[3429]|0)-1|0;u=c[s+8>>2]|0;do{if((c[s+12>>2]|0)-u>>2>>>0>v>>>0){x=c[u+(v<<2)>>2]|0;if((x|0)==0){break}s=x;Pd(c[t>>2]|0)|0;c[j>>2]=0;v=f|0;a:do{if((l|0)==(m|0)){o=67}else{t=g|0;u=x;w=x+8|0;B=x;z=e;A=p|0;y=r|0;x=q|0;C=0;b:while(1){while(1){if((C|0)!=0){o=67;break a}C=c[v>>2]|0;do{if((C|0)==0){C=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){break}if(!((Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){break}c[v>>2]=0;C=0}}while(0);E=(C|0)==0;D=c[t>>2]|0;c:do{if((D|0)==0){o=20}else{do{if((c[D+12>>2]|0)==(c[D+16>>2]|0)){if(!((Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1)){break}c[t>>2]=0;o=20;break c}}while(0);if(!E){o=21;break b}}}while(0);if((o|0)==20){o=0;if(E){o=21;break b}else{D=0}}if((Fc[c[(c[u>>2]|0)+36>>2]&63](s,a[l]|0,0)|0)<<24>>24==37){o=24;break}F=a[l]|0;if(F<<24>>24>-1){E=c[w>>2]|0;if(!((b[E+(F<<24>>24<<1)>>1]&8192)==0)){o=35;break}}D=C+12|0;F=c[D>>2]|0;E=C+16|0;if((F|0)==(c[E>>2]|0)){F=(Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0)&255}else{F=a[F]|0}H=Nc[c[(c[B>>2]|0)+12>>2]&31](s,F)|0;if(H<<24>>24==(Nc[c[(c[B>>2]|0)+12>>2]&31](s,a[l]|0)|0)<<24>>24){o=62;break}c[j>>2]=4;C=4}d:do{if((o|0)==24){o=0;F=l+1|0;if((F|0)==(m|0)){o=25;break b}E=Fc[c[(c[u>>2]|0)+36>>2]&63](s,a[F]|0,0)|0;if((E<<24>>24|0)==69|(E<<24>>24|0)==48){F=l+2|0;if((F|0)==(m|0)){o=28;break b}l=E;E=Fc[c[(c[u>>2]|0)+36>>2]&63](s,a[F]|0,0)|0}else{l=0}H=c[(c[z>>2]|0)+36>>2]|0;c[A>>2]=C;c[y>>2]=D;Kc[H&7](q,e,p,r,h,j,k,E,l);c[v>>2]=c[x>>2];l=F+1|0}else if((o|0)==35){while(1){o=0;l=l+1|0;if((l|0)==(m|0)){l=m;break}F=a[l]|0;if(!(F<<24>>24>-1)){break}if((b[E+(F<<24>>24<<1)>>1]&8192)==0){break}else{o=35}}F=D;E=D;while(1){do{if((C|0)==0){C=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){break}if(!((Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){break}c[v>>2]=0;C=0}}while(0);D=(C|0)==0;do{if((F|0)==0){o=48}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(D){D=F;break}else{break d}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[t>>2]=0;E=0;o=48;break}else{if(D^(E|0)==0){D=E;break}else{break d}}}}while(0);if((o|0)==48){o=0;if(D){break d}else{D=0}}F=C+12|0;H=c[F>>2]|0;G=C+16|0;if((H|0)==(c[G>>2]|0)){H=(Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0)&255}else{H=a[H]|0}if(!(H<<24>>24>-1)){break d}if((b[(c[w>>2]|0)+(H<<24>>24<<1)>>1]&8192)==0){break d}H=c[F>>2]|0;if((H|0)==(c[G>>2]|0)){Ec[c[(c[C>>2]|0)+40>>2]&127](C)|0;F=D;continue}else{c[F>>2]=H+1;F=D;continue}}}else if((o|0)==62){o=0;F=c[D>>2]|0;if((F|0)==(c[E>>2]|0)){Ec[c[(c[C>>2]|0)+40>>2]&127](C)|0}else{c[D>>2]=F+1}l=l+1|0}}while(0);if((l|0)==(m|0)){o=67;break a}C=c[j>>2]|0}if((o|0)==21){c[j>>2]=4;break}else if((o|0)==25){c[j>>2]=4;break}else if((o|0)==28){c[j>>2]=4;break}}}while(0);if((o|0)==67){C=c[v>>2]|0}f=f|0;do{if((C|0)==0){C=0}else{if((c[C+12>>2]|0)!=(c[C+16>>2]|0)){break}if(!((Ec[c[(c[C>>2]|0)+36>>2]&127](C)|0)==-1)){break}c[f>>2]=0;C=0}}while(0);f=(C|0)==0;g=g|0;m=c[g>>2]|0;e:do{if((m|0)==0){o=77}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if(!((Ec[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1)){break}c[g>>2]=0;o=77;break e}}while(0);if(!f){break}H=d|0;c[H>>2]=C;i=n;return}}while(0);do{if((o|0)==77){if(f){break}H=d|0;c[H>>2]=C;i=n;return}}while(0);c[j>>2]=c[j>>2]|2;H=d|0;c[H>>2]=C;i=n;return}}while(0);H=oc(4)|0;Fm(H);Fb(H|0,8456,134)}function Zg(a){a=a|0;Nd(a|0);dn(a);return}function _g(a){a=a|0;Nd(a|0);return}function $g(a){a=a|0;return 2}function ah(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];Yg(a,b,e,d,f,g,h,2728,2736);i=j;return}function bh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;i=i+16|0;l=e;n=i;i=i+4|0;i=i+7&-8;c[n>>2]=c[l>>2];l=f;m=i;i=i+4|0;i=i+7&-8;c[m>>2]=c[l>>2];f=k|0;e=k+8|0;l=d+8|0;l=Ec[c[(c[l>>2]|0)+20>>2]&127](l)|0;c[f>>2]=c[n>>2];c[e>>2]=c[m>>2];m=a[l]|0;if((m&1)==0){m=(m&255)>>>1;n=l+1|0;l=l+1|0}else{o=c[l+8>>2]|0;m=c[l+4>>2]|0;n=o;l=o}Yg(b,d,f,e,g,h,j,n,l+m|0);i=k;return}function ch(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;m=j+8|0;l=j+24|0;Ge(l,f);f=l|0;l=c[f>>2]|0;if(!((c[3428]|0)==-1)){c[m>>2]=13712;c[m+4>>2]=16;c[m+8>>2]=0;he(13712,m,100)}m=(c[3429]|0)-1|0;n=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-n>>2>>>0>m>>>0){l=c[n+(m<<2)>>2]|0;if((l|0)==0){break}Pd(c[f>>2]|0)|0;n=c[e>>2]|0;e=b+8|0;e=Ec[c[c[e>>2]>>2]&127](e)|0;c[k>>2]=n;e=(tl(d,k,e,e+168|0,l,g,0)|0)-e|0;if((e|0)>=168){m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}c[h+24>>2]=((e|0)/12|0|0)%7|0;m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}}while(0);n=oc(4)|0;Fm(n);Fb(n|0,8456,134)}function dh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;m=j+8|0;l=j+24|0;Ge(l,f);f=l|0;l=c[f>>2]|0;if(!((c[3428]|0)==-1)){c[m>>2]=13712;c[m+4>>2]=16;c[m+8>>2]=0;he(13712,m,100)}m=(c[3429]|0)-1|0;n=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-n>>2>>>0>m>>>0){l=c[n+(m<<2)>>2]|0;if((l|0)==0){break}Pd(c[f>>2]|0)|0;n=c[e>>2]|0;e=b+8|0;e=Ec[c[(c[e>>2]|0)+4>>2]&127](e)|0;c[k>>2]=n;e=(tl(d,k,e,e+288|0,l,g,0)|0)-e|0;if((e|0)>=288){m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}c[h+16>>2]=((e|0)/12|0|0)%12|0;m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}}while(0);n=oc(4)|0;Fm(n);Fb(n|0,8456,134)}function eh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;l=b+8|0;k=b+24|0;Ge(k,f);f=k|0;k=c[f>>2]|0;if(!((c[3428]|0)==-1)){c[l>>2]=13712;c[l+4>>2]=16;c[l+8>>2]=0;he(13712,l,100)}m=(c[3429]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>m>>>0){k=c[l+(m<<2)>>2]|0;if((k|0)==0){break}Pd(c[f>>2]|0)|0;c[j>>2]=c[e>>2];e=Sl(d,j,g,k,4)|0;if((c[g>>2]&4|0)!=0){l=d|0;l=c[l>>2]|0;m=a|0;c[m>>2]=l;i=b;return}if((e|0)<69){g=e+2e3|0}else{g=(e-69|0)>>>0<31>>>0?e+1900|0:e}c[h+20>>2]=g-1900;l=d|0;l=c[l>>2]|0;m=a|0;c[m>>2]=l;i=b;return}}while(0);m=oc(4)|0;Fm(m);Fb(m|0,8456,134)}function fh(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;l=i;i=i+328|0;O=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[O>>2];O=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[O>>2];O=l|0;N=l+8|0;H=l+16|0;D=l+24|0;m=l+32|0;X=l+40|0;R=l+48|0;u=l+56|0;S=l+64|0;w=l+72|0;W=l+80|0;Y=l+88|0;Z=l+96|0;_=l+104|0;Q=l+120|0;n=l+128|0;o=l+136|0;p=l+144|0;T=l+152|0;V=l+160|0;U=l+168|0;K=l+176|0;M=l+184|0;L=l+192|0;v=l+200|0;z=l+208|0;x=l+216|0;y=l+224|0;C=l+232|0;A=l+240|0;B=l+248|0;G=l+256|0;E=l+264|0;F=l+272|0;I=l+280|0;J=l+288|0;s=l+296|0;r=l+304|0;q=l+312|0;P=l+320|0;c[h>>2]=0;Ge(Q,g);Q=Q|0;t=c[Q>>2]|0;if(!((c[3428]|0)==-1)){c[_>>2]=13712;c[_+4>>2]=16;c[_+8>>2]=0;he(13712,_,100)}$=(c[3429]|0)-1|0;_=c[t+8>>2]|0;do{if((c[t+12>>2]|0)-_>>2>>>0>$>>>0){t=c[_+($<<2)>>2]|0;if((t|0)==0){break}Pd(c[Q>>2]|0)|0;a:do{switch(k<<24>>24|0){case 97:case 65:{_=c[f>>2]|0;$=d+8|0;$=Ec[c[c[$>>2]>>2]&127]($)|0;c[Z>>2]=_;h=(tl(e,Z,$,$+168|0,t,h,0)|0)-$|0;if((h|0)>=168){break a}c[j+24>>2]=((h|0)/12|0|0)%7|0;break};case 98:case 66:case 104:{_=c[f>>2]|0;$=d+8|0;$=Ec[c[(c[$>>2]|0)+4>>2]&127]($)|0;c[Y>>2]=_;h=(tl(e,Y,$,$+288|0,t,h,0)|0)-$|0;if((h|0)>=288){break a}c[j+16>>2]=((h|0)/12|0|0)%12|0;break};case 99:{q=d+8|0;q=Ec[c[(c[q>>2]|0)+12>>2]&127](q)|0;m=e|0;c[o>>2]=c[m>>2];c[p>>2]=c[f>>2];r=a[q]|0;if((r&1)==0){s=(r&255)>>>1;r=q+1|0;q=q+1|0}else{$=c[q+8>>2]|0;s=c[q+4>>2]|0;r=$;q=$}Yg(n,d,o,p,g,h,j,r,q+s|0);c[m>>2]=c[n>>2];break};case 100:case 101:{c[W>>2]=c[f>>2];d=Sl(e,W,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)>0&(d|0)<32){c[j+12>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 68:{$=e|0;c[V>>2]=c[$>>2];c[U>>2]=c[f>>2];Yg(T,d,V,U,g,h,j,2720,2728);c[$>>2]=c[T>>2];break};case 70:{$=e|0;c[M>>2]=c[$>>2];c[L>>2]=c[f>>2];Yg(K,d,M,L,g,h,j,2712,2720);c[$>>2]=c[K>>2];break};case 72:{c[w>>2]=c[f>>2];g=Sl(e,w,h,t,2)|0;d=c[h>>2]|0;if((d&4|0)==0&(g|0)<24){c[j+8>>2]=g;break a}else{c[h>>2]=d|4;break a}};case 73:{c[S>>2]=c[f>>2];g=Sl(e,S,h,t,2)|0;d=c[h>>2]|0;if((d&4|0)==0&(g|0)>0&(g|0)<13){c[j+8>>2]=g;break a}else{c[h>>2]=d|4;break a}};case 106:{c[u>>2]=c[f>>2];d=Sl(e,u,h,t,3)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<366){c[j+28>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 109:{c[R>>2]=c[f>>2];d=Sl(e,R,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<13){c[j+16>>2]=d-1;break a}else{c[h>>2]=g|4;break a}};case 77:{c[X>>2]=c[f>>2];d=Sl(e,X,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<60){c[j+4>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 110:case 116:{c[v>>2]=c[f>>2];gh(d,e,v,h,t);break};case 112:{j=j+8|0;g=c[f>>2]|0;d=d+8|0;d=Ec[c[(c[d>>2]|0)+8>>2]&127](d)|0;n=a[d]|0;if((n&1)==0){n=(n&255)>>>1}else{n=c[d+4>>2]|0}o=a[d+12|0]|0;if((o&1)==0){o=(o&255)>>>1}else{o=c[d+16>>2]|0}if((n|0)==(-o|0)){c[h>>2]=c[h>>2]|4;break a}c[m>>2]=g;$=tl(e,m,d,d+24|0,t,h,0)|0;h=$-d|0;do{if(($|0)==(d|0)){if((c[j>>2]|0)!=12){break}c[j>>2]=0;break a}}while(0);if((h|0)!=12){break a}h=c[j>>2]|0;if((h|0)>=12){break a}c[j>>2]=h+12;break};case 114:{$=e|0;c[x>>2]=c[$>>2];c[y>>2]=c[f>>2];Yg(z,d,x,y,g,h,j,2696,2707);c[$>>2]=c[z>>2];break};case 82:{$=e|0;c[A>>2]=c[$>>2];c[B>>2]=c[f>>2];Yg(C,d,A,B,g,h,j,2688,2693);c[$>>2]=c[C>>2];break};case 83:{c[D>>2]=c[f>>2];d=Sl(e,D,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<61){c[j>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 84:{$=e|0;c[E>>2]=c[$>>2];c[F>>2]=c[f>>2];Yg(G,d,E,F,g,h,j,2680,2688);c[$>>2]=c[G>>2];break};case 119:{c[H>>2]=c[f>>2];d=Sl(e,H,h,t,1)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<7){c[j+24>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 120:{$=c[(c[d>>2]|0)+20>>2]|0;c[I>>2]=c[e>>2];c[J>>2]=c[f>>2];zc[$&127](b,d,I,J,g,h,j);i=l;return};case 88:{n=d+8|0;n=Ec[c[(c[n>>2]|0)+24>>2]&127](n)|0;m=e|0;c[r>>2]=c[m>>2];c[q>>2]=c[f>>2];o=a[n]|0;if((o&1)==0){p=(o&255)>>>1;o=n+1|0;n=n+1|0}else{$=c[n+8>>2]|0;p=c[n+4>>2]|0;o=$;n=$}Yg(s,d,r,q,g,h,j,o,n+p|0);c[m>>2]=c[s>>2];break};case 121:{c[N>>2]=c[f>>2];d=Sl(e,N,h,t,4)|0;if((c[h>>2]&4|0)!=0){break a}if((d|0)<69){h=d+2e3|0}else{h=(d-69|0)>>>0<31>>>0?d+1900|0:d}c[j+20>>2]=h-1900;break};case 89:{c[O>>2]=c[f>>2];d=Sl(e,O,h,t,4)|0;if((c[h>>2]&4|0)!=0){break a}c[j+20>>2]=d-1900;break};case 37:{c[P>>2]=c[f>>2];hh(d,e,P,h,t);break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);$=oc(4)|0;Fm($);Fb($|0,8456,134)}function gh(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;d=i;m=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[m>>2];e=e|0;f=f|0;h=h+8|0;a:while(1){k=c[e>>2]|0;do{if((k|0)==0){k=0}else{if((c[k+12>>2]|0)!=(c[k+16>>2]|0)){break}if((Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1){c[e>>2]=0;k=0;break}else{k=c[e>>2]|0;break}}}while(0);l=(k|0)==0;k=c[f>>2]|0;do{if((k|0)==0){j=12}else{if((c[k+12>>2]|0)!=(c[k+16>>2]|0)){if(l){break}else{break a}}if((Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1){c[f>>2]=0;j=12;break}else{if(l){break}else{break a}}}}while(0);if((j|0)==12){j=0;if(l){k=0;break}else{k=0}}m=c[e>>2]|0;l=c[m+12>>2]|0;if((l|0)==(c[m+16>>2]|0)){l=(Ec[c[(c[m>>2]|0)+36>>2]&127](m)|0)&255}else{l=a[l]|0}if(!(l<<24>>24>-1)){break}if((b[(c[h>>2]|0)+(l<<24>>24<<1)>>1]&8192)==0){break}m=c[e>>2]|0;l=m+12|0;k=c[l>>2]|0;if((k|0)==(c[m+16>>2]|0)){Ec[c[(c[m>>2]|0)+40>>2]&127](m)|0;continue}else{c[l>>2]=k+1;continue}}h=c[e>>2]|0;do{if((h|0)==0){h=0}else{if((c[h+12>>2]|0)!=(c[h+16>>2]|0)){break}if((Ec[c[(c[h>>2]|0)+36>>2]&127](h)|0)==-1){c[e>>2]=0;h=0;break}else{h=c[e>>2]|0;break}}}while(0);e=(h|0)==0;b:do{if((k|0)==0){j=32}else{do{if((c[k+12>>2]|0)==(c[k+16>>2]|0)){if(!((Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1)){break}c[f>>2]=0;j=32;break b}}while(0);if(!e){break}i=d;return}}while(0);do{if((j|0)==32){if(e){break}i=d;return}}while(0);c[g>>2]=c[g>>2]|2;i=d;return}function hh(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0;b=i;j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];d=d|0;j=c[d>>2]|0;do{if((j|0)==0){j=0}else{if((c[j+12>>2]|0)!=(c[j+16>>2]|0)){break}if((Ec[c[(c[j>>2]|0)+36>>2]&127](j)|0)==-1){c[d>>2]=0;j=0;break}else{j=c[d>>2]|0;break}}}while(0);k=(j|0)==0;e=e|0;j=c[e>>2]|0;a:do{if((j|0)==0){h=11}else{do{if((c[j+12>>2]|0)==(c[j+16>>2]|0)){if(!((Ec[c[(c[j>>2]|0)+36>>2]&127](j)|0)==-1)){break}c[e>>2]=0;h=11;break a}}while(0);if(!k){h=12}}}while(0);if((h|0)==11){if(k){h=12}else{j=0}}if((h|0)==12){c[f>>2]=c[f>>2]|6;i=b;return}l=c[d>>2]|0;k=c[l+12>>2]|0;if((k|0)==(c[l+16>>2]|0)){k=(Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0)&255}else{k=a[k]|0}if(!((Fc[c[(c[g>>2]|0)+36>>2]&63](g,k,0)|0)<<24>>24==37)){c[f>>2]=c[f>>2]|4;i=b;return}l=c[d>>2]|0;g=l+12|0;k=c[g>>2]|0;if((k|0)==(c[l+16>>2]|0)){Ec[c[(c[l>>2]|0)+40>>2]&127](l)|0;l=c[d>>2]|0}else{c[g>>2]=k+1}do{if((l|0)==0){l=0}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){break}if((Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1){c[d>>2]=0;l=0;break}else{l=c[d>>2]|0;break}}}while(0);d=(l|0)==0;b:do{if((j|0)==0){h=31}else{do{if((c[j+12>>2]|0)==(c[j+16>>2]|0)){if(!((Ec[c[(c[j>>2]|0)+36>>2]&127](j)|0)==-1)){break}c[e>>2]=0;h=31;break b}}while(0);if(!d){break}i=b;return}}while(0);do{if((h|0)==31){if(d){break}i=b;return}}while(0);c[f>>2]=c[f>>2]|2;i=b;return}



function ih(a,b,d,e,f,g,h,j,k){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;m=i;i=i+48|0;s=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[s>>2];s=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[s>>2];s=m|0;r=m+16|0;p=m+24|0;n=m+32|0;o=m+40|0;Ge(r,f);r=r|0;q=c[r>>2]|0;if(!((c[3426]|0)==-1)){c[s>>2]=13704;c[s+4>>2]=16;c[s+8>>2]=0;he(13704,s,100)}s=(c[3427]|0)-1|0;t=c[q+8>>2]|0;do{if((c[q+12>>2]|0)-t>>2>>>0>s>>>0){v=c[t+(s<<2)>>2]|0;if((v|0)==0){break}q=v;Pd(c[r>>2]|0)|0;c[g>>2]=0;s=d|0;a:do{if((j|0)==(k|0)){l=71}else{u=e|0;r=v;t=v;z=v;y=b;w=n|0;x=o|0;v=p|0;A=0;b:while(1){while(1){if((A|0)!=0){l=71;break a}A=c[s>>2]|0;do{if((A|0)==0){C=1;A=0}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){B=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){C=0;break}c[s>>2]=0;C=1;A=0}}while(0);B=c[u>>2]|0;do{if((B|0)==0){l=23}else{D=c[B+12>>2]|0;if((D|0)==(c[B+16>>2]|0)){D=Ec[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[u>>2]=0;l=23;break}else{if(C){break}else{l=25;break b}}}}while(0);if((l|0)==23){l=0;if(C){l=25;break b}else{B=0}}if((Fc[c[(c[r>>2]|0)+52>>2]&63](q,c[j>>2]|0,0)|0)<<24>>24==37){l=28;break}if(Fc[c[(c[t>>2]|0)+12>>2]&63](q,8192,c[j>>2]|0)|0){l=38;break}C=A+12|0;D=c[C>>2]|0;B=A+16|0;if((D|0)==(c[B>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}F=Nc[c[(c[z>>2]|0)+28>>2]&31](q,D)|0;if((F|0)==(Nc[c[(c[z>>2]|0)+28>>2]&31](q,c[j>>2]|0)|0)){l=66;break}c[g>>2]=4;A=4}c:do{if((l|0)==28){l=0;C=j+4|0;if((C|0)==(k|0)){l=29;break b}D=Fc[c[(c[r>>2]|0)+52>>2]&63](q,c[C>>2]|0,0)|0;if((D<<24>>24|0)==69|(D<<24>>24|0)==48){C=j+8|0;if((C|0)==(k|0)){l=32;break b}j=D;D=Fc[c[(c[r>>2]|0)+52>>2]&63](q,c[C>>2]|0,0)|0}else{j=0}F=c[(c[y>>2]|0)+36>>2]|0;c[w>>2]=A;c[x>>2]=B;Kc[F&7](p,b,n,o,f,g,h,D,j);c[s>>2]=c[v>>2];j=C+4|0}else if((l|0)==38){while(1){l=0;j=j+4|0;if((j|0)==(k|0)){j=k;break}if(Fc[c[(c[t>>2]|0)+12>>2]&63](q,8192,c[j>>2]|0)|0){l=38}else{break}}D=B;C=B;while(1){do{if((A|0)==0){B=1;A=0}else{B=c[A+12>>2]|0;if((B|0)==(c[A+16>>2]|0)){B=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){B=0;break}c[s>>2]=0;B=1;A=0}}while(0);do{if((D|0)==0){l=53}else{E=c[D+12>>2]|0;if((E|0)==(c[D+16>>2]|0)){D=Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{D=c[E>>2]|0}if((D|0)==-1){c[u>>2]=0;C=0;l=53;break}else{if(B^(C|0)==0){B=C;break}else{break c}}}}while(0);if((l|0)==53){l=0;if(B){break c}else{B=0}}E=A+12|0;F=c[E>>2]|0;D=A+16|0;if((F|0)==(c[D>>2]|0)){F=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{F=c[F>>2]|0}if(!(Fc[c[(c[t>>2]|0)+12>>2]&63](q,8192,F)|0)){break c}F=c[E>>2]|0;if((F|0)==(c[D>>2]|0)){Ec[c[(c[A>>2]|0)+40>>2]&127](A)|0;D=B;continue}else{c[E>>2]=F+4;D=B;continue}}}else if((l|0)==66){l=0;D=c[C>>2]|0;if((D|0)==(c[B>>2]|0)){Ec[c[(c[A>>2]|0)+40>>2]&127](A)|0}else{c[C>>2]=D+4}j=j+4|0}}while(0);if((j|0)==(k|0)){l=71;break a}A=c[g>>2]|0}if((l|0)==25){c[g>>2]=4;break}else if((l|0)==29){c[g>>2]=4;break}else if((l|0)==32){c[g>>2]=4;break}}}while(0);if((l|0)==71){A=c[s>>2]|0}d=d|0;do{if((A|0)==0){d=1;A=0}else{b=c[A+12>>2]|0;if((b|0)==(c[A+16>>2]|0)){b=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{b=c[b>>2]|0}if(!((b|0)==-1)){d=0;break}c[d>>2]=0;d=1;A=0}}while(0);e=e|0;b=c[e>>2]|0;do{if((b|0)==0){l=84}else{f=c[b+12>>2]|0;if((f|0)==(c[b+16>>2]|0)){b=Ec[c[(c[b>>2]|0)+36>>2]&127](b)|0}else{b=c[f>>2]|0}if((b|0)==-1){c[e>>2]=0;l=84;break}if(!d){break}F=a|0;c[F>>2]=A;i=m;return}}while(0);do{if((l|0)==84){if(d){break}F=a|0;c[F>>2]=A;i=m;return}}while(0);c[g>>2]=c[g>>2]|2;F=a|0;c[F>>2]=A;i=m;return}}while(0);F=oc(4)|0;Fm(F);Fb(F|0,8456,134)}function jh(a){a=a|0;Nd(a|0);dn(a);return}function kh(a){a=a|0;Nd(a|0);return}function lh(a){a=a|0;return 2}function mh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;j=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=e;k=i;i=i+4|0;i=i+7&-8;c[k>>2]=c[m>>2];e=j|0;d=j+8|0;c[e>>2]=c[l>>2];c[d>>2]=c[k>>2];ih(a,b,e,d,f,g,h,2648,2680);i=j;return}function nh(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0;k=i;i=i+16|0;l=e;n=i;i=i+4|0;i=i+7&-8;c[n>>2]=c[l>>2];l=f;m=i;i=i+4|0;i=i+7&-8;c[m>>2]=c[l>>2];f=k|0;e=k+8|0;l=d+8|0;l=Ec[c[(c[l>>2]|0)+20>>2]&127](l)|0;c[f>>2]=c[n>>2];c[e>>2]=c[m>>2];m=a[l]|0;if((m&1)==0){m=(m&255)>>>1;n=l+4|0;l=l+4|0}else{o=c[l+8>>2]|0;m=c[l+4>>2]|0;n=o;l=o}ih(b,d,f,e,g,h,j,n,l+(m<<2)|0);i=k;return}function oh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;m=j+8|0;l=j+24|0;Ge(l,f);f=l|0;l=c[f>>2]|0;if(!((c[3426]|0)==-1)){c[m>>2]=13704;c[m+4>>2]=16;c[m+8>>2]=0;he(13704,m,100)}m=(c[3427]|0)-1|0;n=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-n>>2>>>0>m>>>0){l=c[n+(m<<2)>>2]|0;if((l|0)==0){break}Pd(c[f>>2]|0)|0;n=c[e>>2]|0;e=b+8|0;e=Ec[c[c[e>>2]>>2]&127](e)|0;c[k>>2]=n;e=(El(d,k,e,e+168|0,l,g,0)|0)-e|0;if((e|0)>=168){m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}c[h+24>>2]=((e|0)/12|0|0)%7|0;m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}}while(0);n=oc(4)|0;Fm(n);Fb(n|0,8456,134)}function ph(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0;j=i;i=i+32|0;k=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[k>>2];k=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[k>>2];k=j|0;m=j+8|0;l=j+24|0;Ge(l,f);f=l|0;l=c[f>>2]|0;if(!((c[3426]|0)==-1)){c[m>>2]=13704;c[m+4>>2]=16;c[m+8>>2]=0;he(13704,m,100)}m=(c[3427]|0)-1|0;n=c[l+8>>2]|0;do{if((c[l+12>>2]|0)-n>>2>>>0>m>>>0){l=c[n+(m<<2)>>2]|0;if((l|0)==0){break}Pd(c[f>>2]|0)|0;n=c[e>>2]|0;e=b+8|0;e=Ec[c[(c[e>>2]|0)+4>>2]&127](e)|0;c[k>>2]=n;e=(El(d,k,e,e+288|0,l,g,0)|0)-e|0;if((e|0)>=288){m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}c[h+16>>2]=((e|0)/12|0|0)%12|0;m=d|0;m=c[m>>2]|0;n=a|0;c[n>>2]=m;i=j;return}}while(0);n=oc(4)|0;Fm(n);Fb(n|0,8456,134)}function qh(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0;b=i;i=i+32|0;j=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[j>>2];j=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[j>>2];j=b|0;l=b+8|0;k=b+24|0;Ge(k,f);f=k|0;k=c[f>>2]|0;if(!((c[3426]|0)==-1)){c[l>>2]=13704;c[l+4>>2]=16;c[l+8>>2]=0;he(13704,l,100)}m=(c[3427]|0)-1|0;l=c[k+8>>2]|0;do{if((c[k+12>>2]|0)-l>>2>>>0>m>>>0){k=c[l+(m<<2)>>2]|0;if((k|0)==0){break}Pd(c[f>>2]|0)|0;c[j>>2]=c[e>>2];e=Tl(d,j,g,k,4)|0;if((c[g>>2]&4|0)!=0){l=d|0;l=c[l>>2]|0;m=a|0;c[m>>2]=l;i=b;return}if((e|0)<69){g=e+2e3|0}else{g=(e-69|0)>>>0<31>>>0?e+1900|0:e}c[h+20>>2]=g-1900;l=d|0;l=c[l>>2]|0;m=a|0;c[m>>2]=l;i=b;return}}while(0);m=oc(4)|0;Fm(m);Fb(m|0,8456,134)}function rh(b,d,e,f,g,h,j,k,l){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0;l=i;i=i+328|0;u=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[u>>2];u=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[u>>2];u=l|0;K=l+8|0;H=l+16|0;D=l+24|0;m=l+32|0;X=l+40|0;O=l+48|0;R=l+56|0;S=l+64|0;w=l+72|0;W=l+80|0;Y=l+88|0;Z=l+96|0;_=l+104|0;Q=l+120|0;n=l+128|0;o=l+136|0;p=l+144|0;T=l+152|0;V=l+160|0;U=l+168|0;L=l+176|0;N=l+184|0;M=l+192|0;v=l+200|0;z=l+208|0;x=l+216|0;y=l+224|0;C=l+232|0;A=l+240|0;B=l+248|0;G=l+256|0;E=l+264|0;F=l+272|0;I=l+280|0;J=l+288|0;s=l+296|0;r=l+304|0;q=l+312|0;P=l+320|0;c[h>>2]=0;Ge(Q,g);Q=Q|0;t=c[Q>>2]|0;if(!((c[3426]|0)==-1)){c[_>>2]=13704;c[_+4>>2]=16;c[_+8>>2]=0;he(13704,_,100)}_=(c[3427]|0)-1|0;$=c[t+8>>2]|0;do{if((c[t+12>>2]|0)-$>>2>>>0>_>>>0){t=c[$+(_<<2)>>2]|0;if((t|0)==0){break}Pd(c[Q>>2]|0)|0;a:do{switch(k<<24>>24|0){case 97:case 65:{_=c[f>>2]|0;$=d+8|0;$=Ec[c[c[$>>2]>>2]&127]($)|0;c[Z>>2]=_;h=(El(e,Z,$,$+168|0,t,h,0)|0)-$|0;if((h|0)>=168){break a}c[j+24>>2]=((h|0)/12|0|0)%7|0;break};case 98:case 66:case 104:{_=c[f>>2]|0;$=d+8|0;$=Ec[c[(c[$>>2]|0)+4>>2]&127]($)|0;c[Y>>2]=_;h=(El(e,Y,$,$+288|0,t,h,0)|0)-$|0;if((h|0)>=288){break a}c[j+16>>2]=((h|0)/12|0|0)%12|0;break};case 99:{q=d+8|0;q=Ec[c[(c[q>>2]|0)+12>>2]&127](q)|0;m=e|0;c[o>>2]=c[m>>2];c[p>>2]=c[f>>2];r=a[q]|0;if((r&1)==0){r=(r&255)>>>1;s=q+4|0;q=q+4|0}else{$=c[q+8>>2]|0;r=c[q+4>>2]|0;s=$;q=$}ih(n,d,o,p,g,h,j,s,q+(r<<2)|0);c[m>>2]=c[n>>2];break};case 100:case 101:{c[W>>2]=c[f>>2];g=Tl(e,W,h,t,2)|0;d=c[h>>2]|0;if((d&4|0)==0&(g|0)>0&(g|0)<32){c[j+12>>2]=g;break a}else{c[h>>2]=d|4;break a}};case 68:{$=e|0;c[V>>2]=c[$>>2];c[U>>2]=c[f>>2];ih(T,d,V,U,g,h,j,2616,2648);c[$>>2]=c[T>>2];break};case 70:{$=e|0;c[N>>2]=c[$>>2];c[M>>2]=c[f>>2];ih(L,d,N,M,g,h,j,2584,2616);c[$>>2]=c[L>>2];break};case 72:{c[w>>2]=c[f>>2];d=Tl(e,w,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<24){c[j+8>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 73:{c[S>>2]=c[f>>2];g=Tl(e,S,h,t,2)|0;d=c[h>>2]|0;if((d&4|0)==0&(g|0)>0&(g|0)<13){c[j+8>>2]=g;break a}else{c[h>>2]=d|4;break a}};case 106:{c[R>>2]=c[f>>2];g=Tl(e,R,h,t,3)|0;d=c[h>>2]|0;if((d&4|0)==0&(g|0)<366){c[j+28>>2]=g;break a}else{c[h>>2]=d|4;break a}};case 109:{c[O>>2]=c[f>>2];d=Tl(e,O,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<13){c[j+16>>2]=d-1;break a}else{c[h>>2]=g|4;break a}};case 77:{c[X>>2]=c[f>>2];d=Tl(e,X,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<60){c[j+4>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 110:case 116:{c[v>>2]=c[f>>2];sh(d,e,v,h,t);break};case 112:{j=j+8|0;g=c[f>>2]|0;d=d+8|0;d=Ec[c[(c[d>>2]|0)+8>>2]&127](d)|0;n=a[d]|0;if((n&1)==0){n=(n&255)>>>1}else{n=c[d+4>>2]|0}o=a[d+12|0]|0;if((o&1)==0){o=(o&255)>>>1}else{o=c[d+16>>2]|0}if((n|0)==(-o|0)){c[h>>2]=c[h>>2]|4;break a}c[m>>2]=g;$=El(e,m,d,d+24|0,t,h,0)|0;h=$-d|0;do{if(($|0)==(d|0)){if((c[j>>2]|0)!=12){break}c[j>>2]=0;break a}}while(0);if((h|0)!=12){break a}h=c[j>>2]|0;if((h|0)>=12){break a}c[j>>2]=h+12;break};case 114:{$=e|0;c[x>>2]=c[$>>2];c[y>>2]=c[f>>2];ih(z,d,x,y,g,h,j,2536,2580);c[$>>2]=c[z>>2];break};case 82:{$=e|0;c[A>>2]=c[$>>2];c[B>>2]=c[f>>2];ih(C,d,A,B,g,h,j,2512,2532);c[$>>2]=c[C>>2];break};case 83:{c[D>>2]=c[f>>2];d=Tl(e,D,h,t,2)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<61){c[j>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 84:{$=e|0;c[E>>2]=c[$>>2];c[F>>2]=c[f>>2];ih(G,d,E,F,g,h,j,2480,2512);c[$>>2]=c[G>>2];break};case 119:{c[H>>2]=c[f>>2];d=Tl(e,H,h,t,1)|0;g=c[h>>2]|0;if((g&4|0)==0&(d|0)<7){c[j+24>>2]=d;break a}else{c[h>>2]=g|4;break a}};case 120:{$=c[(c[d>>2]|0)+20>>2]|0;c[I>>2]=c[e>>2];c[J>>2]=c[f>>2];zc[$&127](b,d,I,J,g,h,j);i=l;return};case 121:{c[K>>2]=c[f>>2];d=Tl(e,K,h,t,4)|0;if((c[h>>2]&4|0)!=0){break a}if((d|0)<69){h=d+2e3|0}else{h=(d-69|0)>>>0<31>>>0?d+1900|0:d}c[j+20>>2]=h-1900;break};case 88:{n=d+8|0;n=Ec[c[(c[n>>2]|0)+24>>2]&127](n)|0;m=e|0;c[r>>2]=c[m>>2];c[q>>2]=c[f>>2];o=a[n]|0;if((o&1)==0){p=(o&255)>>>1;o=n+4|0;n=n+4|0}else{$=c[n+8>>2]|0;p=c[n+4>>2]|0;o=$;n=$}ih(s,d,r,q,g,h,j,o,n+(p<<2)|0);c[m>>2]=c[s>>2];break};case 89:{c[u>>2]=c[f>>2];d=Tl(e,u,h,t,4)|0;if((c[h>>2]&4|0)!=0){break a}c[j+20>>2]=d-1900;break};case 37:{c[P>>2]=c[f>>2];th(d,e,P,h,t);break};default:{c[h>>2]=c[h>>2]|4}}}while(0);c[b>>2]=c[e>>2];i=l;return}}while(0);$=oc(4)|0;Fm($);Fb($|0,8456,134)}function sh(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;a=i;h=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[h>>2];b=b|0;d=d|0;h=f;a:while(1){k=c[b>>2]|0;do{if((k|0)==0){j=1}else{j=c[k+12>>2]|0;if((j|0)==(c[k+16>>2]|0)){j=Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[b>>2]=0;j=1;break}else{j=(c[b>>2]|0)==0;break}}}while(0);k=c[d>>2]|0;do{if((k|0)==0){g=15}else{l=c[k+12>>2]|0;if((l|0)==(c[k+16>>2]|0)){l=Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{l=c[l>>2]|0}if((l|0)==-1){c[d>>2]=0;g=15;break}else{if(j){j=k;break}else{f=k;break a}}}}while(0);if((g|0)==15){g=0;if(j){f=0;break}else{j=0}}l=c[b>>2]|0;k=c[l+12>>2]|0;if((k|0)==(c[l+16>>2]|0)){k=Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{k=c[k>>2]|0}if(!(Fc[c[(c[h>>2]|0)+12>>2]&63](f,8192,k)|0)){f=j;break}j=c[b>>2]|0;k=j+12|0;l=c[k>>2]|0;if((l|0)==(c[j+16>>2]|0)){Ec[c[(c[j>>2]|0)+40>>2]&127](j)|0;continue}else{c[k>>2]=l+4;continue}}h=c[b>>2]|0;do{if((h|0)==0){b=1}else{j=c[h+12>>2]|0;if((j|0)==(c[h+16>>2]|0)){h=Ec[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{h=c[j>>2]|0}if((h|0)==-1){c[b>>2]=0;b=1;break}else{b=(c[b>>2]|0)==0;break}}}while(0);do{if((f|0)==0){g=37}else{h=c[f+12>>2]|0;if((h|0)==(c[f+16>>2]|0)){f=Ec[c[(c[f>>2]|0)+36>>2]&127](f)|0}else{f=c[h>>2]|0}if((f|0)==-1){c[d>>2]=0;g=37;break}if(!b){break}i=a;return}}while(0);do{if((g|0)==37){if(b){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function th(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;a=i;h=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[h>>2];b=b|0;h=c[b>>2]|0;do{if((h|0)==0){j=1}else{j=c[h+12>>2]|0;if((j|0)==(c[h+16>>2]|0)){h=Ec[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{h=c[j>>2]|0}if((h|0)==-1){c[b>>2]=0;j=1;break}else{j=(c[b>>2]|0)==0;break}}}while(0);d=d|0;h=c[d>>2]|0;do{if((h|0)==0){g=14}else{k=c[h+12>>2]|0;if((k|0)==(c[h+16>>2]|0)){k=Ec[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{k=c[k>>2]|0}if((k|0)==-1){c[d>>2]=0;g=14;break}else{if(j){break}else{g=16;break}}}}while(0);if((g|0)==14){if(j){g=16}else{h=0}}if((g|0)==16){c[e>>2]=c[e>>2]|6;i=a;return}k=c[b>>2]|0;j=c[k+12>>2]|0;if((j|0)==(c[k+16>>2]|0)){j=Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{j=c[j>>2]|0}if(!((Fc[c[(c[f>>2]|0)+52>>2]&63](f,j,0)|0)<<24>>24==37)){c[e>>2]=c[e>>2]|4;i=a;return}k=c[b>>2]|0;j=k+12|0;f=c[j>>2]|0;if((f|0)==(c[k+16>>2]|0)){Ec[c[(c[k>>2]|0)+40>>2]&127](k)|0;k=c[b>>2]|0}else{c[j>>2]=f+4}do{if((k|0)==0){b=1}else{f=c[k+12>>2]|0;if((f|0)==(c[k+16>>2]|0)){f=Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0}else{f=c[f>>2]|0}if((f|0)==-1){c[b>>2]=0;b=1;break}else{b=(c[b>>2]|0)==0;break}}}while(0);do{if((h|0)==0){g=38}else{f=c[h+12>>2]|0;if((f|0)==(c[h+16>>2]|0)){f=Ec[c[(c[h>>2]|0)+36>>2]&127](h)|0}else{f=c[f>>2]|0}if((f|0)==-1){c[d>>2]=0;g=38;break}if(!b){break}i=a;return}}while(0);do{if((g|0)==38){if(b){break}i=a;return}}while(0);c[e>>2]=c[e>>2]|2;i=a;return}function uh(a){a=a|0;wh(a+8|0);Nd(a|0);dn(a);return}function vh(a){a=a|0;wh(a+8|0);Nd(a|0);return}function wh(b){b=b|0;var d=0;b=b|0;d=c[b>>2]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);if((d|0)==(c[3042]|0)){return}mb(c[b>>2]|0);return}function xh(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0;g=i;i=i+112|0;p=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[p>>2];p=g|0;n=g+8|0;f=n|0;o=p|0;a[o]=37;l=p+1|0;a[l]=j;m=p+2|0;a[m]=k;a[p+3|0]=0;if(!(k<<24>>24==0)){a[l]=k;a[m]=j}p=fc(f|0,100,o|0,h|0,c[d+8>>2]|0)|0;d=n+p|0;k=c[e>>2]|0;if((p|0)==0){o=k;p=b|0;c[p>>2]=o;i=g;return}do{h=a[f]|0;do{if((k|0)==0){k=0}else{j=k+24|0;e=c[j>>2]|0;if((e|0)==(c[k+28>>2]|0)){p=(Nc[c[(c[k>>2]|0)+52>>2]&31](k,h&255)|0)==-1;k=p?0:k;break}else{c[j>>2]=e+1;a[e]=h;break}}}while(0);f=f+1|0;}while((f|0)!=(d|0));p=b|0;c[p>>2]=k;i=g;return}function yh(a){a=a|0;wh(a+8|0);Nd(a|0);dn(a);return}function zh(a){a=a|0;wh(a+8|0);Nd(a|0);return}function Ah(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;f=i;i=i+408|0;l=d;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];l=f|0;k=f+400|0;d=l|0;c[k>>2]=l+400;Bh(b+8|0,d,k,g,h,j);h=c[k>>2]|0;g=c[e>>2]|0;if((d|0)==(h|0)){k=g;l=a|0;c[l>>2]=k;i=f;return}do{j=c[d>>2]|0;if((g|0)==0){g=0}else{b=g+24|0;e=c[b>>2]|0;if((e|0)==(c[g+28>>2]|0)){j=Nc[c[(c[g>>2]|0)+52>>2]&31](g,j)|0}else{c[b>>2]=e+4;c[e>>2]=j}g=(j|0)==-1?0:g}d=d+4|0;}while((d|0)!=(h|0));l=a|0;c[l>>2]=g;i=f;return}function Bh(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;j=i;i=i+120|0;q=j|0;k=j+112|0;l=i;i=i+4|0;i=i+7&-8;m=j+8|0;o=q|0;a[o]=37;p=q+1|0;a[p]=g;n=q+2|0;a[n]=h;a[q+3|0]=0;if(!(h<<24>>24==0)){a[p]=h;a[n]=g}g=b|0;fc(m|0,100,o|0,f|0,c[g>>2]|0)|0;c[k>>2]=0;c[k+4>>2]=0;c[l>>2]=m;q=(c[e>>2]|0)-d>>2;m=ac(c[g>>2]|0)|0;k=vm(d,l,q,k)|0;if((m|0)!=0){ac(m|0)|0}if((k|0)==-1){xi(1080)}else{c[e>>2]=d+(k<<2);i=j;return}}function Ch(a){a=a|0;Nd(a|0);dn(a);return}function Dh(a){a=a|0;Nd(a|0);return}function Eh(a){a=a|0;return 127}function Fh(a){a=a|0;return 127}function Gh(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Hh(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Ih(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Jh(a,b){a=a|0;b=b|0;le(a,1,45);return}function Kh(a){a=a|0;return 0}function Lh(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function Mh(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function Nh(a){a=a|0;Nd(a|0);dn(a);return}function Oh(a){a=a|0;Nd(a|0);return}function Ph(a){a=a|0;return 127}function Qh(a){a=a|0;return 127}function Rh(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Sh(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Th(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function Uh(a,b){a=a|0;b=b|0;le(a,1,45);return}function Vh(a){a=a|0;return 0}function Wh(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function Xh(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function Yh(a){a=a|0;Nd(a|0);dn(a);return}function Zh(a){a=a|0;Nd(a|0);return}function _h(a){a=a|0;return 2147483647}function $h(a){a=a|0;return 2147483647}function ai(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function bi(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function ci(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function di(a,b){a=a|0;b=b|0;xe(a,1,45);return}function ei(a){a=a|0;return 0}function fi(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function gi(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function hi(a){a=a|0;Nd(a|0);dn(a);return}function ii(a){a=a|0;Nd(a|0);return}function ji(a){a=a|0;return 2147483647}function ki(a){a=a|0;return 2147483647}function li(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function mi(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function ni(a,b){a=a|0;b=b|0;zn(a|0,0,12)|0;return}function oi(a,b){a=a|0;b=b|0;xe(a,1,45);return}function pi(a){a=a|0;return 0}function qi(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function ri(b,c){b=b|0;c=c|0;c=b;D=67109634;a[c]=D;D=D>>8;a[c+1|0]=D;D=D>>8;a[c+2|0]=D;D=D>>8;a[c+3|0]=D;return}function si(a){a=a|0;Nd(a|0);dn(a);return}function ti(a){a=a|0;Nd(a|0);return}function ui(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;l=i;i=i+280|0;y=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[y>>2];y=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[y>>2];y=l|0;v=l+16|0;t=l+120|0;p=l+128|0;w=l+136|0;r=l+144|0;u=l+152|0;q=l+160|0;s=l+176|0;d=t|0;c[d>>2]=v;m=t+4|0;c[m>>2]=160;v=v+100|0;Ge(w,h);o=w|0;x=c[o>>2]|0;if(!((c[3428]|0)==-1)){c[y>>2]=13712;c[y+4>>2]=16;c[y+8>>2]=0;he(13712,y,100)}z=(c[3429]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>z>>>0){y=c[y+(z<<2)>>2]|0;if((y|0)==0){break}x=y;a[r]=0;f=f|0;c[u>>2]=c[f>>2];do{if(wi(e,u,g,w,c[h+4>>2]|0,j,r,x,t,p,v)|0){h=q|0;Cc[c[(c[y>>2]|0)+32>>2]&31](x,2464,2474,h)|0;s=s|0;v=c[p>>2]|0;t=c[d>>2]|0;g=v-t|0;do{if((g|0)>98){g=_m(g+2|0)|0;if((g|0)!=0){u=g;break}jn();u=0;g=0}else{u=s;g=0}}while(0);if((a[r]|0)!=0){a[u]=45;u=u+1|0}if(t>>>0<v>>>0){r=q+10|0;do{w=a[t]|0;v=h;while(1){x=v+1|0;if((a[v]|0)==w<<24>>24){break}if((x|0)==(r|0)){v=r;break}else{v=x}}a[u]=a[2464+(v-q)|0]|0;t=t+1|0;u=u+1|0;}while(t>>>0<(c[p>>2]|0)>>>0)}a[u]=0;z=cc(s|0,888,(y=i,i=i+8|0,c[y>>2]=k,y)|0)|0;i=y;if((z|0)==1){if((g|0)==0){break}$m(g);break}z=oc(8)|0;Vd(z,608);Fb(z|0,8472,26)}}while(0);e=e|0;k=c[e>>2]|0;do{if((k|0)==0){k=0}else{if((c[k+12>>2]|0)!=(c[k+16>>2]|0)){break}if((Ec[c[(c[k>>2]|0)+36>>2]&127](k)|0)==-1){c[e>>2]=0;k=0;break}else{k=c[e>>2]|0;break}}}while(0);k=(k|0)==0;p=c[f>>2]|0;do{if((p|0)==0){n=46}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(k){break}else{n=48;break}}if((Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[f>>2]=0;n=46;break}else{if(k){break}else{n=48;break}}}}while(0);if((n|0)==46){if(k){n=48}}if((n|0)==48){c[j>>2]=c[j>>2]|2}c[b>>2]=c[e>>2];Pd(c[o>>2]|0)|0;b=c[d>>2]|0;c[d>>2]=0;if((b|0)==0){i=l;return}Ac[c[m>>2]&255](b);i=l;return}}while(0);z=oc(4)|0;Fm(z);Fb(z|0,8456,134)}function vi(a){a=a|0;return}function wi(e,f,g,h,j,k,l,m,n,o,p){e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;var q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0,ca=0,da=0,ea=0,fa=0,ga=0;q=i;i=i+408|0;Z=f;J=i;i=i+4|0;i=i+7&-8;c[J>>2]=c[Z>>2];Z=q|0;E=q+400|0;C=i;i=i+1|0;i=i+7&-8;B=i;i=i+1|0;i=i+7&-8;u=i;i=i+12|0;i=i+7&-8;t=i;i=i+12|0;i=i+7&-8;s=i;i=i+12|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;f=i;i=i+12|0;i=i+7&-8;D=i;i=i+4|0;i=i+7&-8;Y=Z|0;c[E>>2]=0;w=u;zn(w|0,0,12)|0;z=t;zn(z|0,0,12)|0;y=s;zn(y|0,0,12)|0;A=r;zn(A|0,0,12)|0;x=f;zn(x|0,0,12)|0;zi(g,h,E,C,B,u,t,s,r,D);g=n|0;c[o>>2]=c[g>>2];e=e|0;h=J|0;J=m+8|0;K=r+1|0;I=r+4|0;m=r+8|0;F=s+1|0;H=s+4|0;G=s+8|0;L=(j&512|0)!=0;M=t+1|0;S=t+8|0;Q=t+4|0;O=f;P=O+1|0;N=f+8|0;R=f+4|0;j=E+3|0;T=n+4|0;n=u+4|0;W=160;X=Y;Z=Z+400|0;U=0;V=0;a:while(1){_=c[e>>2]|0;do{if((_|0)==0){_=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){break}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;_=0;break}else{_=c[e>>2]|0;break}}}while(0);$=(_|0)==0;_=c[h>>2]|0;do{if((_|0)==0){v=15}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){if($){break}else{v=309;break a}}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[h>>2]=0;v=15;break}else{if($){break}else{v=309;break a}}}}while(0);if((v|0)==15){v=0;if($){v=309;break}else{_=0}}b:do{switch(a[E+U|0]|0){case 2:{if(!((V|0)!=0|U>>>0<2>>>0)){if((U|0)==2){$=(a[j]|0)!=0}else{$=0}if(!(L|$)){V=0;break b}}aa=a[z]|0;ba=(aa&1)==0;$=ba?M:c[S>>2]|0;c:do{if((U|0)==0){ba=_;ca=_}else{if(!((d[E+(U-1)|0]|0)>>>0<2>>>0)){ba=_;ca=_;break}ba=$+(ba?(aa&255)>>>1:c[Q>>2]|0)|0;ca=$;while(1){if((ca|0)==(ba|0)){break}da=a[ca]|0;if(!(da<<24>>24>-1)){ba=ca;break}if((b[(c[J>>2]|0)+(da<<24>>24<<1)>>1]&8192)==0){ba=ca;break}else{ca=ca+1|0}}ca=ba-$|0;da=a[x]|0;fa=(da&1)==0;if(fa){ea=(da&255)>>>1}else{ea=c[R>>2]|0}if(ca>>>0>ea>>>0){ba=_;ca=_;break}if(fa){fa=(da&255)>>>1;ea=fa;da=P;fa=fa-ca+(O+1)|0}else{ga=c[N>>2]|0;fa=c[R>>2]|0;ea=fa;da=ga;fa=ga+(fa-ca)|0}ca=da+ea|0;if((fa|0)==(ca|0)){$=ba;ba=_;ca=_;break}else{da=$}while(1){if((a[fa]|0)!=(a[da]|0)){ba=_;ca=_;break c}fa=fa+1|0;if((fa|0)==(ca|0)){$=ba;ba=_;ca=_;break}else{da=da+1|0}}}}while(0);d:while(1){if((aa&1)==0){aa=(aa&255)>>>1;_=M}else{aa=c[Q>>2]|0;_=c[S>>2]|0}if(($|0)==(_+aa|0)){break}_=c[e>>2]|0;do{if((_|0)==0){_=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){break}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;_=0;break}else{_=c[e>>2]|0;break}}}while(0);_=(_|0)==0;do{if((ba|0)==0){v=173}else{if((c[ba+12>>2]|0)!=(c[ba+16>>2]|0)){if(_){_=ba;break}else{break d}}if((Ec[c[(c[ba>>2]|0)+36>>2]&127](ba)|0)==-1){c[h>>2]=0;ca=0;v=173;break}else{if(_^(ca|0)==0){_=ca;break}else{break d}}}}while(0);if((v|0)==173){v=0;if(_){break}else{_=0}}aa=c[e>>2]|0;ba=c[aa+12>>2]|0;if((ba|0)==(c[aa+16>>2]|0)){aa=(Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)&255}else{aa=a[ba]|0}if(!(aa<<24>>24==(a[$]|0))){break}da=c[e>>2]|0;ba=da+12|0;aa=c[ba>>2]|0;if((aa|0)==(c[da+16>>2]|0)){Ec[c[(c[da>>2]|0)+40>>2]&127](da)|0}else{c[ba>>2]=aa+1}$=$+1|0;aa=a[z]|0;ba=_}if(!L){break b}_=a[z]|0;if((_&1)==0){_=(_&255)>>>1;aa=M}else{_=c[Q>>2]|0;aa=c[S>>2]|0}if(($|0)!=(aa+_|0)){v=189;break a}break};case 3:{_=a[y]|0;aa=(_&1)==0;if(aa){da=(_&255)>>>1}else{da=c[H>>2]|0}$=a[A]|0;ba=($&1)==0;if(ba){ca=($&255)>>>1}else{ca=c[I>>2]|0}if((da|0)==(-ca|0)){break b}if(aa){ca=(_&255)>>>1}else{ca=c[H>>2]|0}do{if((ca|0)!=0){if(ba){ba=($&255)>>>1}else{ba=c[I>>2]|0}if((ba|0)==0){break}aa=c[e>>2]|0;ba=c[aa+12>>2]|0;ca=c[aa+16>>2]|0;if((ba|0)==(ca|0)){$=(Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)&255;ca=c[e>>2]|0;_=a[y]|0;aa=ca;ba=c[ca+12>>2]|0;ca=c[ca+16>>2]|0}else{$=a[ba]|0}da=aa+12|0;ca=(ba|0)==(ca|0);if($<<24>>24==(a[(_&1)==0?F:c[G>>2]|0]|0)){if(ca){Ec[c[(c[aa>>2]|0)+40>>2]&127](aa)|0}else{c[da>>2]=ba+1}_=a[y]|0;if((_&1)==0){_=(_&255)>>>1}else{_=c[H>>2]|0}V=_>>>0>1>>>0?s:V;break b}if(ca){_=(Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)&255}else{_=a[ba]|0}if(!(_<<24>>24==(a[(a[A]&1)==0?K:c[m>>2]|0]|0))){v=136;break a}_=c[e>>2]|0;$=_+12|0;aa=c[$>>2]|0;if((aa|0)==(c[_+16>>2]|0)){Ec[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[$>>2]=aa+1}a[l]=1;_=a[A]|0;if((_&1)==0){_=(_&255)>>>1}else{_=c[I>>2]|0}V=_>>>0>1>>>0?r:V;break b}}while(0);if(aa){aa=(_&255)>>>1}else{aa=c[H>>2]|0}ba=c[e>>2]|0;ca=c[ba+12>>2]|0;da=(ca|0)==(c[ba+16>>2]|0);if((aa|0)==0){if(da){_=(Ec[c[(c[ba>>2]|0)+36>>2]&127](ba)|0)&255;$=a[A]|0}else{_=a[ca]|0}if(!(_<<24>>24==(a[($&1)==0?K:c[m>>2]|0]|0))){break b}_=c[e>>2]|0;$=_+12|0;aa=c[$>>2]|0;if((aa|0)==(c[_+16>>2]|0)){Ec[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[$>>2]=aa+1}a[l]=1;_=a[A]|0;if((_&1)==0){_=(_&255)>>>1}else{_=c[I>>2]|0}V=_>>>0>1>>>0?r:V;break b}if(da){$=(Ec[c[(c[ba>>2]|0)+36>>2]&127](ba)|0)&255;_=a[y]|0}else{$=a[ca]|0}if(!($<<24>>24==(a[(_&1)==0?F:c[G>>2]|0]|0))){a[l]=1;break b}aa=c[e>>2]|0;_=aa+12|0;$=c[_>>2]|0;if(($|0)==(c[aa+16>>2]|0)){Ec[c[(c[aa>>2]|0)+40>>2]&127](aa)|0}else{c[_>>2]=$+1}_=a[y]|0;if((_&1)==0){_=(_&255)>>>1}else{_=c[H>>2]|0}V=_>>>0>1>>>0?s:V;break};case 0:{v=42;break};case 1:{if((U|0)==3){v=309;break a}$=c[e>>2]|0;v=c[$+12>>2]|0;if((v|0)==(c[$+16>>2]|0)){v=(Ec[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{v=a[v]|0}if(!(v<<24>>24>-1)){v=41;break a}if((b[(c[J>>2]|0)+(v<<24>>24<<1)>>1]&8192)==0){v=41;break a}v=c[e>>2]|0;aa=v+12|0;$=c[aa>>2]|0;if(($|0)==(c[v+16>>2]|0)){v=(Ec[c[(c[v>>2]|0)+40>>2]&127](v)|0)&255}else{c[aa>>2]=$+1;v=a[$]|0}te(f,v);v=42;break};case 4:{_=0;e:while(1){$=c[e>>2]|0;do{if(($|0)==0){$=0}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){break}if((Ec[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[e>>2]=0;$=0;break}else{$=c[e>>2]|0;break}}}while(0);$=($|0)==0;aa=c[h>>2]|0;do{if((aa|0)==0){v=202}else{if((c[aa+12>>2]|0)!=(c[aa+16>>2]|0)){if($){break}else{break e}}if((Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)==-1){c[h>>2]=0;v=202;break}else{if($){break}else{break e}}}}while(0);if((v|0)==202){v=0;if($){break}}$=c[e>>2]|0;aa=c[$+12>>2]|0;if((aa|0)==(c[$+16>>2]|0)){$=(Ec[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{$=a[aa]|0}do{if($<<24>>24>-1){if((b[(c[J>>2]|0)+($<<24>>24<<1)>>1]&2048)==0){v=221;break}aa=c[o>>2]|0;if((aa|0)==(p|0)){ba=(c[T>>2]|0)!=160;ca=c[g>>2]|0;p=p-ca|0;aa=p>>>0<2147483647>>>0?p<<1:-1;ca=an(ba?ca:0,aa)|0;if((ca|0)==0){jn()}do{if(ba){c[g>>2]=ca}else{ba=c[g>>2]|0;c[g>>2]=ca;if((ba|0)==0){break}Ac[c[T>>2]&255](ba);ca=c[g>>2]|0}}while(0);c[T>>2]=84;ga=ca+p|0;c[o>>2]=ga;p=(c[g>>2]|0)+aa|0;aa=ga}c[o>>2]=aa+1;a[aa]=$;_=_+1|0}else{v=221}}while(0);if((v|0)==221){v=0;aa=a[w]|0;if((aa&1)==0){aa=(aa&255)>>>1}else{aa=c[n>>2]|0}if(!((aa|0)!=0&(_|0)!=0&$<<24>>24==(a[B]|0))){break}if((Y|0)==(Z|0)){Y=Y-X|0;Z=Y>>>0<2147483647>>>0?Y<<1:-1;if((W|0)==160){X=0}else{}ga=an(X,Z)|0;X=ga;if((ga|0)==0){jn()}Z=X+(Z>>>2<<2)|0;Y=X+(Y>>2<<2)|0;W=84}c[Y>>2]=_;_=0;Y=Y+4|0}ba=c[e>>2]|0;$=ba+12|0;aa=c[$>>2]|0;if((aa|0)==(c[ba+16>>2]|0)){Ec[c[(c[ba>>2]|0)+40>>2]&127](ba)|0;continue}else{c[$>>2]=aa+1;continue}}if((X|0)!=(Y|0)&(_|0)!=0){if((Y|0)==(Z|0)){Y=Y-X|0;Z=Y>>>0<2147483647>>>0?Y<<1:-1;if((W|0)==160){X=0}else{}ga=an(X,Z)|0;X=ga;if((ga|0)==0){jn()}Z=X+(Z>>>2<<2)|0;Y=X+(Y>>2<<2)|0;W=84}c[Y>>2]=_;Y=Y+4|0}if((c[D>>2]|0)>0){_=c[e>>2]|0;do{if((_|0)==0){_=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){break}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;_=0;break}else{_=c[e>>2]|0;break}}}while(0);$=(_|0)==0;_=c[h>>2]|0;do{if((_|0)==0){v=256}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){if($){break}else{v=263;break a}}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[h>>2]=0;v=256;break}else{if($){break}else{v=263;break a}}}}while(0);if((v|0)==256){v=0;if($){v=263;break a}else{_=0}}$=c[e>>2]|0;aa=c[$+12>>2]|0;if((aa|0)==(c[$+16>>2]|0)){$=(Ec[c[(c[$>>2]|0)+36>>2]&127]($)|0)&255}else{$=a[aa]|0}if(!($<<24>>24==(a[C]|0))){v=263;break a}aa=c[e>>2]|0;ba=aa+12|0;$=c[ba>>2]|0;if(($|0)==(c[aa+16>>2]|0)){Ec[c[(c[aa>>2]|0)+40>>2]&127](aa)|0;$=_;aa=_}else{c[ba>>2]=$+1;$=_;aa=_}while(1){_=c[e>>2]|0;do{if((_|0)==0){_=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){break}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;_=0;break}else{_=c[e>>2]|0;break}}}while(0);ba=(_|0)==0;do{if(($|0)==0){_=aa;v=279}else{if((c[$+12>>2]|0)!=(c[$+16>>2]|0)){if(ba){_=aa;break}else{v=287;break a}}if((Ec[c[(c[$>>2]|0)+36>>2]&127]($)|0)==-1){c[h>>2]=0;_=0;v=279;break}else{if(ba^(aa|0)==0){_=aa;$=aa;break}else{v=287;break a}}}}while(0);if((v|0)==279){v=0;if(ba){v=287;break a}else{$=0}}aa=c[e>>2]|0;ba=c[aa+12>>2]|0;if((ba|0)==(c[aa+16>>2]|0)){aa=(Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)&255}else{aa=a[ba]|0}if(!(aa<<24>>24>-1)){v=287;break a}if((b[(c[J>>2]|0)+(aa<<24>>24<<1)>>1]&2048)==0){v=287;break a}aa=c[o>>2]|0;if((aa|0)==(p|0)){ba=(c[T>>2]|0)!=160;ca=c[g>>2]|0;p=p-ca|0;aa=p>>>0<2147483647>>>0?p<<1:-1;ca=an(ba?ca:0,aa)|0;if((ca|0)==0){jn()}do{if(ba){c[g>>2]=ca}else{ba=c[g>>2]|0;c[g>>2]=ca;if((ba|0)==0){break}Ac[c[T>>2]&255](ba);ca=c[g>>2]|0}}while(0);c[T>>2]=84;ga=ca+p|0;c[o>>2]=ga;p=(c[g>>2]|0)+aa|0;aa=ga}ca=c[e>>2]|0;ba=c[ca+12>>2]|0;if((ba|0)==(c[ca+16>>2]|0)){ba=(Ec[c[(c[ca>>2]|0)+36>>2]&127](ca)|0)&255;aa=c[o>>2]|0}else{ba=a[ba]|0}c[o>>2]=aa+1;a[aa]=ba;aa=(c[D>>2]|0)-1|0;c[D>>2]=aa;da=c[e>>2]|0;ca=da+12|0;ba=c[ca>>2]|0;if((ba|0)==(c[da+16>>2]|0)){Ec[c[(c[da>>2]|0)+40>>2]&127](da)|0}else{c[ca>>2]=ba+1}if((aa|0)>0){aa=_}else{break}}}if((c[o>>2]|0)==(c[g>>2]|0)){v=307;break a}break};default:{}}}while(0);f:do{if((v|0)==42){v=0;if((U|0)==3){v=309;break a}else{aa=_;$=_}while(1){_=c[e>>2]|0;do{if((_|0)==0){_=0}else{if((c[_+12>>2]|0)!=(c[_+16>>2]|0)){break}if((Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0)==-1){c[e>>2]=0;_=0;break}else{_=c[e>>2]|0;break}}}while(0);_=(_|0)==0;do{if((aa|0)==0){v=55}else{if((c[aa+12>>2]|0)!=(c[aa+16>>2]|0)){if(_){_=aa;break}else{break f}}if((Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)==-1){c[h>>2]=0;$=0;v=55;break}else{if(_^($|0)==0){_=$;break}else{break f}}}}while(0);if((v|0)==55){v=0;if(_){break f}else{_=0}}aa=c[e>>2]|0;ba=c[aa+12>>2]|0;if((ba|0)==(c[aa+16>>2]|0)){aa=(Ec[c[(c[aa>>2]|0)+36>>2]&127](aa)|0)&255}else{aa=a[ba]|0}if(!(aa<<24>>24>-1)){break f}if((b[(c[J>>2]|0)+(aa<<24>>24<<1)>>1]&8192)==0){break f}aa=c[e>>2]|0;ca=aa+12|0;ba=c[ca>>2]|0;if((ba|0)==(c[aa+16>>2]|0)){aa=(Ec[c[(c[aa>>2]|0)+40>>2]&127](aa)|0)&255}else{c[ca>>2]=ba+1;aa=a[ba]|0}te(f,aa);aa=_}}}while(0);U=U+1|0;if(!(U>>>0<4>>>0)){v=309;break}}g:do{if((v|0)==41){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==136){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==189){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==263){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==287){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==307){c[k>>2]=c[k>>2]|4;k=0}else if((v|0)==309){h:do{if((V|0)!=0){x=V;o=V+1|0;l=V+8|0;y=V+4|0;z=1;i:while(1){A=a[x]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[y>>2]|0}if(!(z>>>0<A>>>0)){break h}A=c[e>>2]|0;do{if((A|0)==0){A=0}else{if((c[A+12>>2]|0)!=(c[A+16>>2]|0)){break}if((Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0)==-1){c[e>>2]=0;A=0;break}else{A=c[e>>2]|0;break}}}while(0);A=(A|0)==0;B=c[h>>2]|0;do{if((B|0)==0){v=327}else{if((c[B+12>>2]|0)!=(c[B+16>>2]|0)){if(A){break}else{break i}}if((Ec[c[(c[B>>2]|0)+36>>2]&127](B)|0)==-1){c[h>>2]=0;v=327;break}else{if(A){break}else{break i}}}}while(0);if((v|0)==327){v=0;if(A){break}}B=c[e>>2]|0;A=c[B+12>>2]|0;if((A|0)==(c[B+16>>2]|0)){A=(Ec[c[(c[B>>2]|0)+36>>2]&127](B)|0)&255}else{A=a[A]|0}if((a[x]&1)==0){B=o}else{B=c[l>>2]|0}if(!(A<<24>>24==(a[B+z|0]|0))){break}z=z+1|0;B=c[e>>2]|0;C=B+12|0;A=c[C>>2]|0;if((A|0)==(c[B+16>>2]|0)){Ec[c[(c[B>>2]|0)+40>>2]&127](B)|0;continue}else{c[C>>2]=A+1;continue}}c[k>>2]=c[k>>2]|4;k=0;break g}}while(0);if((X|0)==(Y|0)){k=1;X=Y;break}o=a[w]|0;if((o&1)==0){e=(o&255)>>>1}else{e=c[n>>2]|0}if((e|0)==0){k=1;break}e=Y-4|0;h=e>>>0>X>>>0;if(h){o=X;l=e;do{ga=c[o>>2]|0;c[o>>2]=c[l>>2];c[l>>2]=ga;o=o+4|0;l=l-4|0;}while(o>>>0<l>>>0);o=a[w]|0}if((o&1)==0){w=(o&255)>>>1;n=u+1|0}else{w=c[n>>2]|0;n=c[u+8>>2]|0}l=a[n]|0;o=l<<24>>24<1|l<<24>>24==127;j:do{if(h){w=n+w|0;h=X;while(1){if(!o){if((l<<24>>24|0)!=(c[h>>2]|0)){break j}}n=(w-n|0)>1?n+1|0:n;h=h+4|0;l=a[n]|0;o=l<<24>>24<1|l<<24>>24==127;if(!(h>>>0<e>>>0)){v=356;break}}}else{v=356}}while(0);if((v|0)==356){if(o){k=1;break}if(((c[e>>2]|0)-1|0)>>>0<l<<24>>24>>>0){k=1;break}}c[k>>2]=c[k>>2]|4;k=0}}while(0);me(f);me(r);me(s);me(t);me(u);if((X|0)==0){i=q;return k|0}Ac[W&255](X);i=q;return k|0}function xi(a){a=a|0;var b=0;b=oc(8)|0;Vd(b,a);Fb(b|0,8472,26)}function yi(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+160|0;w=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[w>>2];w=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[w>>2];w=d|0;u=d+16|0;s=d+120|0;q=d+128|0;v=d+136|0;r=d+144|0;t=d+152|0;m=s|0;c[m>>2]=u;n=s+4|0;c[n>>2]=160;u=u+100|0;Ge(v,h);o=v|0;p=c[o>>2]|0;if(!((c[3428]|0)==-1)){c[w>>2]=13712;c[w+4>>2]=16;c[w+8>>2]=0;he(13712,w,100)}x=(c[3429]|0)-1|0;w=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-w>>2>>>0>x>>>0){x=c[w+(x<<2)>>2]|0;if((x|0)==0){break}w=x;a[r]=0;f=f|0;p=c[f>>2]|0;c[t>>2]=p;if(wi(e,t,g,v,c[h+4>>2]|0,j,r,w,s,q,u)|0){g=k;if((a[g]&1)==0){a[k+1|0]=0;a[g]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}if((a[r]|0)!=0){te(k,Nc[c[(c[x>>2]|0)+28>>2]&31](w,45)|0)}r=Nc[c[(c[x>>2]|0)+28>>2]&31](w,48)|0;h=c[m>>2]|0;q=c[q>>2]|0;g=q-1|0;a:do{if(h>>>0<g>>>0){while(1){s=h+1|0;if(!((a[h]|0)==r<<24>>24)){break a}if(s>>>0<g>>>0){h=s}else{h=s;break}}}}while(0);Ul(k,h,q)|0}k=e|0;e=c[k>>2]|0;do{if((e|0)==0){e=0}else{if((c[e+12>>2]|0)!=(c[e+16>>2]|0)){break}if((Ec[c[(c[e>>2]|0)+36>>2]&127](e)|0)==-1){c[k>>2]=0;e=0;break}else{e=c[k>>2]|0;break}}}while(0);e=(e|0)==0;do{if((p|0)==0){l=34}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){if(e){break}else{l=36;break}}if((Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[f>>2]=0;l=34;break}else{if(e^(p|0)==0){break}else{l=36;break}}}}while(0);if((l|0)==34){if(e){l=36}}if((l|0)==36){c[j>>2]=c[j>>2]|2}c[b>>2]=c[k>>2];Pd(c[o>>2]|0)|0;l=c[m>>2]|0;c[m>>2]=0;if((l|0)==0){i=d;return}Ac[c[n>>2]&255](l);i=d;return}}while(0);x=oc(4)|0;Fm(x);Fb(x|0,8456,134)}function zi(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;n=i;i=i+176|0;y=n|0;z=n+16|0;x=n+32|0;u=n+40|0;t=n+56|0;r=n+72|0;o=n+88|0;w=n+104|0;v=n+112|0;s=n+128|0;q=n+144|0;p=n+160|0;if(b){p=c[d>>2]|0;if(!((c[3546]|0)==-1)){c[z>>2]=14184;c[z+4>>2]=16;c[z+8>>2]=0;he(14184,z,100)}s=(c[3547]|0)-1|0;q=c[p+8>>2]|0;if(!((c[p+12>>2]|0)-q>>2>>>0>s>>>0)){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}p=c[q+(s<<2)>>2]|0;if((p|0)==0){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}q=p;Bc[c[(c[p>>2]|0)+44>>2]&127](x,q);D=c[x>>2]|0;a[e]=D;D=D>>8;a[e+1|0]=D;D=D>>8;a[e+2|0]=D;D=D>>8;a[e+3|0]=D;e=p;Bc[c[(c[e>>2]|0)+32>>2]&127](u,q);s=l;if((a[s]&1)==0){a[l+1|0]=0;a[s]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);l=u;c[s>>2]=c[l>>2];c[s+4>>2]=c[l+4>>2];c[s+8>>2]=c[l+8>>2];zn(l|0,0,12)|0;me(u);Bc[c[(c[e>>2]|0)+28>>2]&127](t,q);l=k;if((a[l]&1)==0){a[k+1|0]=0;a[l]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}re(k,0);b=t;c[l>>2]=c[b>>2];c[l+4>>2]=c[b+4>>2];c[l+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;me(t);b=p;a[f]=Ec[c[(c[b>>2]|0)+12>>2]&127](q)|0;a[g]=Ec[c[(c[b>>2]|0)+16>>2]&127](q)|0;Bc[c[(c[e>>2]|0)+20>>2]&127](r,q);g=h;if((a[g]&1)==0){a[h+1|0]=0;a[g]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}re(h,0);h=r;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];zn(h|0,0,12)|0;me(r);Bc[c[(c[e>>2]|0)+24>>2]&127](o,q);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);b=o;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;me(o);b=Ec[c[(c[p>>2]|0)+36>>2]&127](q)|0;c[m>>2]=b;i=n;return}else{o=c[d>>2]|0;if(!((c[3548]|0)==-1)){c[y>>2]=14192;c[y+4>>2]=16;c[y+8>>2]=0;he(14192,y,100)}t=(c[3549]|0)-1|0;r=c[o+8>>2]|0;if(!((c[o+12>>2]|0)-r>>2>>>0>t>>>0)){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}r=c[r+(t<<2)>>2]|0;if((r|0)==0){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}o=r;Bc[c[(c[r>>2]|0)+44>>2]&127](w,o);D=c[w>>2]|0;a[e]=D;D=D>>8;a[e+1|0]=D;D=D>>8;a[e+2|0]=D;D=D>>8;a[e+3|0]=D;e=r;Bc[c[(c[e>>2]|0)+32>>2]&127](v,o);t=l;if((a[t]&1)==0){a[l+1|0]=0;a[t]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);l=v;c[t>>2]=c[l>>2];c[t+4>>2]=c[l+4>>2];c[t+8>>2]=c[l+8>>2];zn(l|0,0,12)|0;me(v);Bc[c[(c[e>>2]|0)+28>>2]&127](s,o);l=k;if((a[l]&1)==0){a[k+1|0]=0;a[l]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}re(k,0);b=s;c[l>>2]=c[b>>2];c[l+4>>2]=c[b+4>>2];c[l+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;me(s);b=r;a[f]=Ec[c[(c[b>>2]|0)+12>>2]&127](o)|0;a[g]=Ec[c[(c[b>>2]|0)+16>>2]&127](o)|0;Bc[c[(c[e>>2]|0)+20>>2]&127](q,o);g=h;if((a[g]&1)==0){a[h+1|0]=0;a[g]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}re(h,0);h=q;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];zn(h|0,0,12)|0;me(q);Bc[c[(c[e>>2]|0)+24>>2]&127](p,o);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);b=p;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;me(p);b=Ec[c[(c[r>>2]|0)+36>>2]&127](o)|0;c[m>>2]=b;i=n;return}}function Ai(a){a=a|0;Nd(a|0);dn(a);return}function Bi(a){a=a|0;Nd(a|0);return}function Ci(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;l=i;i=i+600|0;y=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[y>>2];y=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[y>>2];y=l|0;v=l+16|0;u=l+416|0;p=l+424|0;t=l+432|0;r=l+440|0;w=l+448|0;q=l+456|0;s=l+496|0;d=u|0;c[d>>2]=v;n=u+4|0;c[n>>2]=160;v=v+400|0;Ge(t,h);o=t|0;x=c[o>>2]|0;if(!((c[3426]|0)==-1)){c[y>>2]=13704;c[y+4>>2]=16;c[y+8>>2]=0;he(13704,y,100)}z=(c[3427]|0)-1|0;y=c[x+8>>2]|0;do{if((c[x+12>>2]|0)-y>>2>>>0>z>>>0){y=c[y+(z<<2)>>2]|0;if((y|0)==0){break}x=y;a[r]=0;f=f|0;c[w>>2]=c[f>>2];do{if(Di(e,w,g,t,c[h+4>>2]|0,j,r,x,u,p,v)|0){h=q|0;Cc[c[(c[y>>2]|0)+48>>2]&31](x,2448,2458,h)|0;g=s|0;v=c[p>>2]|0;t=c[d>>2]|0;s=v-t|0;do{if((s|0)>392){s=_m((s>>2)+2|0)|0;if((s|0)!=0){u=s;break}jn();u=0;s=0}else{u=g;s=0}}while(0);if((a[r]|0)!=0){a[u]=45;u=u+1|0}if(t>>>0<v>>>0){r=q+40|0;do{w=c[t>>2]|0;x=h;while(1){v=x+4|0;if((c[x>>2]|0)==(w|0)){break}if((v|0)==(r|0)){x=r;break}else{x=v}}a[u]=a[2448+(x-q>>2)|0]|0;t=t+4|0;u=u+1|0;}while(t>>>0<(c[p>>2]|0)>>>0)}a[u]=0;z=cc(g|0,888,(y=i,i=i+8|0,c[y>>2]=k,y)|0)|0;i=y;if((z|0)==1){if((s|0)==0){break}$m(s);break}z=oc(8)|0;Vd(z,608);Fb(z|0,8472,26)}}while(0);k=e|0;e=c[k>>2]|0;do{if((e|0)==0){e=1}else{p=c[e+12>>2]|0;if((p|0)==(c[e+16>>2]|0)){e=Ec[c[(c[e>>2]|0)+36>>2]&127](e)|0}else{e=c[p>>2]|0}if((e|0)==-1){c[k>>2]=0;e=1;break}else{e=(c[k>>2]|0)==0;break}}}while(0);p=c[f>>2]|0;do{if((p|0)==0){m=47}else{q=c[p+12>>2]|0;if((q|0)==(c[p+16>>2]|0)){p=Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{p=c[q>>2]|0}if((p|0)==-1){c[f>>2]=0;m=47;break}else{if(e){break}else{m=49;break}}}}while(0);if((m|0)==47){if(e){m=49}}if((m|0)==49){c[j>>2]=c[j>>2]|2}c[b>>2]=c[k>>2];Pd(c[o>>2]|0)|0;b=c[d>>2]|0;c[d>>2]=0;if((b|0)==0){i=l;return}Ac[c[n>>2]&255](b);i=l;return}}while(0);z=oc(4)|0;Fm(z);Fb(z|0,8456,134)}function Di(b,e,f,g,h,j,k,l,m,n,o){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;var p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ba=0;p=i;i=i+408|0;U=e;E=i;i=i+4|0;i=i+7&-8;c[E>>2]=c[U>>2];U=p|0;G=p+400|0;y=i;i=i+4|0;i=i+7&-8;x=i;i=i+4|0;i=i+7&-8;t=i;i=i+12|0;i=i+7&-8;e=i;i=i+12|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;s=i;i=i+12|0;i=i+7&-8;C=i;i=i+4|0;i=i+7&-8;T=U|0;c[G>>2]=0;v=t;zn(v|0,0,12)|0;A=e;zn(A|0,0,12)|0;w=q;zn(w|0,0,12)|0;z=r;zn(z|0,0,12)|0;B=s;zn(B|0,0,12)|0;Fi(f,g,G,y,x,t,e,q,r,C);g=m|0;c[n>>2]=c[g>>2];f=b|0;b=E|0;E=l;I=r+4|0;F=r+8|0;H=q+4|0;D=q+8|0;K=(h&512|0)!=0;L=e+4|0;N=e+8|0;M=s+4|0;J=s+8|0;h=G+3|0;O=m+4|0;m=t+4|0;R=160;S=T;U=U+400|0;P=0;Q=0;a:while(1){W=c[f>>2]|0;do{if((W|0)==0){W=1}else{V=c[W+12>>2]|0;if((V|0)==(c[W+16>>2]|0)){V=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{V=c[V>>2]|0}if((V|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);V=c[b>>2]|0;do{if((V|0)==0){u=16}else{X=c[V+12>>2]|0;if((X|0)==(c[V+16>>2]|0)){X=Ec[c[(c[V>>2]|0)+36>>2]&127](V)|0}else{X=c[X>>2]|0}if((X|0)==-1){c[b>>2]=0;u=16;break}else{if(W){break}else{u=320;break a}}}}while(0);if((u|0)==16){u=0;if(W){u=320;break}else{V=0}}b:do{switch(a[G+P|0]|0){case 4:{V=0;c:while(1){X=c[f>>2]|0;do{if((X|0)==0){W=1}else{W=c[X+12>>2]|0;if((W|0)==(c[X+16>>2]|0)){W=Ec[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{W=c[W>>2]|0}if((W|0)==-1){c[f>>2]=0;W=1;break}else{W=(c[f>>2]|0)==0;break}}}while(0);Y=c[b>>2]|0;do{if((Y|0)==0){u=206}else{X=c[Y+12>>2]|0;if((X|0)==(c[Y+16>>2]|0)){X=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{X=c[X>>2]|0}if((X|0)==-1){c[b>>2]=0;u=206;break}else{if(W){break}else{break c}}}}while(0);if((u|0)==206){u=0;if(W){break}}W=c[f>>2]|0;X=c[W+12>>2]|0;if((X|0)==(c[W+16>>2]|0)){W=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{W=c[X>>2]|0}if(Fc[c[(c[E>>2]|0)+12>>2]&63](l,2048,W)|0){X=c[n>>2]|0;if((X|0)==(o|0)){X=(c[O>>2]|0)!=160;Z=c[g>>2]|0;Y=o-Z|0;o=Y>>>0<2147483647>>>0?Y<<1:-1;Y=Y>>2;if(X){}else{Z=0}aa=an(Z,o)|0;Z=aa;if((aa|0)==0){jn()}do{if(X){c[g>>2]=Z}else{X=c[g>>2]|0;c[g>>2]=Z;if((X|0)==0){break}Ac[c[O>>2]&255](X);Z=c[g>>2]|0}}while(0);c[O>>2]=84;X=Z+(Y<<2)|0;c[n>>2]=X;o=(c[g>>2]|0)+(o>>>2<<2)|0}c[n>>2]=X+4;c[X>>2]=W;V=V+1|0}else{X=a[v]|0;if((X&1)==0){X=(X&255)>>>1}else{X=c[m>>2]|0}if(!((X|0)!=0&(V|0)!=0&(W|0)==(c[x>>2]|0))){break}if((T|0)==(U|0)){R=(R|0)!=160;T=T-S|0;U=T>>>0<2147483647>>>0?T<<1:-1;if(R){W=S}else{W=0}aa=an(W,U)|0;W=aa;if((aa|0)==0){jn()}U=W+(U>>>2<<2)|0;T=W+(T>>2<<2)|0;S=W;R=84}c[T>>2]=V;V=0;T=T+4|0}Y=c[f>>2]|0;X=Y+12|0;W=c[X>>2]|0;if((W|0)==(c[Y+16>>2]|0)){Ec[c[(c[Y>>2]|0)+40>>2]&127](Y)|0;continue}else{c[X>>2]=W+4;continue}}if((S|0)!=(T|0)&(V|0)!=0){if((T|0)==(U|0)){U=(R|0)!=160;R=T-S|0;T=R>>>0<2147483647>>>0?R<<1:-1;if(U){W=S}else{W=0}aa=an(W,T)|0;W=aa;if((aa|0)==0){jn()}U=W+(T>>>2<<2)|0;T=W+(R>>2<<2)|0;S=W;R=84}c[T>>2]=V;T=T+4|0}V=c[C>>2]|0;if((V|0)>0){W=c[f>>2]|0;do{if((W|0)==0){X=1}else{X=c[W+12>>2]|0;if((X|0)==(c[W+16>>2]|0)){W=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{W=c[X>>2]|0}if((W|0)==-1){c[f>>2]=0;X=1;break}else{X=(c[f>>2]|0)==0;break}}}while(0);W=c[b>>2]|0;do{if((W|0)==0){u=266}else{Y=c[W+12>>2]|0;if((Y|0)==(c[W+16>>2]|0)){Y=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{Y=c[Y>>2]|0}if((Y|0)==-1){c[b>>2]=0;u=266;break}else{if(X){break}else{u=272;break a}}}}while(0);if((u|0)==266){u=0;if(X){u=272;break a}else{W=0}}X=c[f>>2]|0;Y=c[X+12>>2]|0;if((Y|0)==(c[X+16>>2]|0)){X=Ec[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{X=c[Y>>2]|0}if((X|0)!=(c[y>>2]|0)){u=272;break a}X=c[f>>2]|0;Z=X+12|0;Y=c[Z>>2]|0;if((Y|0)==(c[X+16>>2]|0)){Ec[c[(c[X>>2]|0)+40>>2]&127](X)|0;X=W;Y=W}else{c[Z>>2]=Y+4;X=W;Y=W}while(1){W=c[f>>2]|0;do{if((W|0)==0){Z=1}else{Z=c[W+12>>2]|0;if((Z|0)==(c[W+16>>2]|0)){W=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{W=c[Z>>2]|0}if((W|0)==-1){c[f>>2]=0;Z=1;break}else{Z=(c[f>>2]|0)==0;break}}}while(0);do{if((X|0)==0){W=Y;u=289}else{W=c[X+12>>2]|0;if((W|0)==(c[X+16>>2]|0)){W=Ec[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{W=c[W>>2]|0}if((W|0)==-1){c[b>>2]=0;W=0;u=289;break}else{if(Z^(Y|0)==0){W=Y;X=Y;break}else{u=296;break a}}}}while(0);if((u|0)==289){u=0;if(Z){u=296;break a}else{X=0}}Y=c[f>>2]|0;Z=c[Y+12>>2]|0;if((Z|0)==(c[Y+16>>2]|0)){Y=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{Y=c[Z>>2]|0}if(!(Fc[c[(c[E>>2]|0)+12>>2]&63](l,2048,Y)|0)){u=296;break a}Y=c[n>>2]|0;if((Y|0)==(o|0)){Z=(c[O>>2]|0)!=160;_=c[g>>2]|0;Y=o-_|0;o=Y>>>0<2147483647>>>0?Y<<1:-1;Y=Y>>2;if(Z){}else{_=0}aa=an(_,o)|0;_=aa;if((aa|0)==0){jn()}do{if(Z){c[g>>2]=_}else{Z=c[g>>2]|0;c[g>>2]=_;if((Z|0)==0){break}Ac[c[O>>2]&255](Z);_=c[g>>2]|0}}while(0);c[O>>2]=84;Y=_+(Y<<2)|0;c[n>>2]=Y;o=(c[g>>2]|0)+(o>>>2<<2)|0}_=c[f>>2]|0;Z=c[_+12>>2]|0;if((Z|0)==(c[_+16>>2]|0)){Z=Ec[c[(c[_>>2]|0)+36>>2]&127](_)|0;Y=c[n>>2]|0}else{Z=c[Z>>2]|0}c[n>>2]=Y+4;c[Y>>2]=Z;V=V-1|0;c[C>>2]=V;_=c[f>>2]|0;Z=_+12|0;Y=c[Z>>2]|0;if((Y|0)==(c[_+16>>2]|0)){Ec[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[Z>>2]=Y+4}if((V|0)>0){Y=W}else{break}}}if((c[n>>2]|0)==(c[g>>2]|0)){u=318;break a}break};case 1:{if((P|0)==3){u=320;break a}W=c[f>>2]|0;u=c[W+12>>2]|0;if((u|0)==(c[W+16>>2]|0)){u=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0}else{u=c[u>>2]|0}if(!(Fc[c[(c[E>>2]|0)+12>>2]&63](l,8192,u)|0)){u=41;break a}u=c[f>>2]|0;X=u+12|0;W=c[X>>2]|0;if((W|0)==(c[u+16>>2]|0)){u=Ec[c[(c[u>>2]|0)+40>>2]&127](u)|0}else{c[X>>2]=W+4;u=c[W>>2]|0}Be(s,u);u=42;break};case 0:{u=42;break};case 3:{V=a[w]|0;X=(V&1)==0;if(X){_=(V&255)>>>1}else{_=c[H>>2]|0}W=a[z]|0;Y=(W&1)==0;if(Y){Z=(W&255)>>>1}else{Z=c[I>>2]|0}if((_|0)==(-Z|0)){break b}if(X){Z=(V&255)>>>1}else{Z=c[H>>2]|0}do{if((Z|0)!=0){if(Y){Y=(W&255)>>>1}else{Y=c[I>>2]|0}if((Y|0)==0){break}W=c[f>>2]|0;X=c[W+12>>2]|0;if((X|0)==(c[W+16>>2]|0)){W=Ec[c[(c[W>>2]|0)+36>>2]&127](W)|0;V=a[w]|0}else{W=c[X>>2]|0}Y=c[f>>2]|0;_=Y+12|0;X=c[_>>2]|0;Z=(X|0)==(c[Y+16>>2]|0);if((W|0)==(c[((V&1)==0?H:c[D>>2]|0)>>2]|0)){if(Z){Ec[c[(c[Y>>2]|0)+40>>2]&127](Y)|0}else{c[_>>2]=X+4}V=a[w]|0;if((V&1)==0){V=(V&255)>>>1}else{V=c[H>>2]|0}Q=V>>>0>1>>>0?q:Q;break b}if(Z){V=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{V=c[X>>2]|0}if((V|0)!=(c[((a[z]&1)==0?I:c[F>>2]|0)>>2]|0)){u=134;break a}V=c[f>>2]|0;W=V+12|0;X=c[W>>2]|0;if((X|0)==(c[V+16>>2]|0)){Ec[c[(c[V>>2]|0)+40>>2]&127](V)|0}else{c[W>>2]=X+4}a[k]=1;V=a[z]|0;if((V&1)==0){V=(V&255)>>>1}else{V=c[I>>2]|0}Q=V>>>0>1>>>0?r:Q;break b}}while(0);if(X){_=(V&255)>>>1}else{_=c[H>>2]|0}Z=c[f>>2]|0;Y=c[Z+12>>2]|0;X=(Y|0)==(c[Z+16>>2]|0);if((_|0)==0){if(X){V=Ec[c[(c[Z>>2]|0)+36>>2]&127](Z)|0;W=a[z]|0}else{V=c[Y>>2]|0}if((V|0)!=(c[((W&1)==0?I:c[F>>2]|0)>>2]|0)){break b}V=c[f>>2]|0;W=V+12|0;X=c[W>>2]|0;if((X|0)==(c[V+16>>2]|0)){Ec[c[(c[V>>2]|0)+40>>2]&127](V)|0}else{c[W>>2]=X+4}a[k]=1;V=a[z]|0;if((V&1)==0){V=(V&255)>>>1}else{V=c[I>>2]|0}Q=V>>>0>1>>>0?r:Q;break b}if(X){W=Ec[c[(c[Z>>2]|0)+36>>2]&127](Z)|0;V=a[w]|0}else{W=c[Y>>2]|0}if((W|0)!=(c[((V&1)==0?H:c[D>>2]|0)>>2]|0)){a[k]=1;break b}V=c[f>>2]|0;W=V+12|0;X=c[W>>2]|0;if((X|0)==(c[V+16>>2]|0)){Ec[c[(c[V>>2]|0)+40>>2]&127](V)|0}else{c[W>>2]=X+4}V=a[w]|0;if((V&1)==0){V=(V&255)>>>1}else{V=c[H>>2]|0}Q=V>>>0>1>>>0?q:Q;break};case 2:{if(!((Q|0)!=0|P>>>0<2>>>0)){if((P|0)==2){W=(a[h]|0)!=0}else{W=0}if(!(K|W)){Q=0;break b}}X=a[A]|0;W=(X&1)==0?L:c[N>>2]|0;d:do{if((P|0)==0){Y=V}else{if(!((d[G+(P-1)|0]|0)>>>0<2>>>0)){Y=V;break}while(1){if((X&1)==0){Y=(X&255)>>>1;Z=L}else{Y=c[L>>2]|0;Z=c[N>>2]|0}if((W|0)==(Z+(Y<<2)|0)){break}if(!(Fc[c[(c[E>>2]|0)+12>>2]&63](l,8192,c[W>>2]|0)|0)){u=147;break}W=W+4|0;X=a[A]|0}if((u|0)==147){u=0;X=a[A]|0}Y=(X&1)==0;Z=W-(Y?L:c[N>>2]|0)>>2;_=a[B]|0;aa=(_&1)==0;if(aa){$=(_&255)>>>1}else{$=c[M>>2]|0}e:do{if(!(Z>>>0>$>>>0)){if(aa){aa=(_&255)>>>1;$=M;_=M+(((_&255)>>>1)-Z<<2)|0}else{ba=c[J>>2]|0;_=c[M>>2]|0;aa=_;$=ba;_=ba+(_-Z<<2)|0}Z=$+(aa<<2)|0;if((_|0)==(Z|0)){Y=V;break d}else{$=_;_=Y?L:c[N>>2]|0}while(1){if((c[$>>2]|0)!=(c[_>>2]|0)){break e}$=$+4|0;if(($|0)==(Z|0)){Y=V;break d}else{_=_+4|0}}}}while(0);W=Y?L:c[N>>2]|0;Y=V}}while(0);f:while(1){if((X&1)==0){Z=(X&255)>>>1;X=L}else{Z=c[L>>2]|0;X=c[N>>2]|0}if((W|0)==(X+(Z<<2)|0)){break}Z=c[f>>2]|0;do{if((Z|0)==0){X=1}else{X=c[Z+12>>2]|0;if((X|0)==(c[Z+16>>2]|0)){X=Ec[c[(c[Z>>2]|0)+36>>2]&127](Z)|0}else{X=c[X>>2]|0}if((X|0)==-1){c[f>>2]=0;X=1;break}else{X=(c[f>>2]|0)==0;break}}}while(0);do{if((Y|0)==0){u=177}else{Z=c[Y+12>>2]|0;if((Z|0)==(c[Y+16>>2]|0)){Y=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{Y=c[Z>>2]|0}if((Y|0)==-1){c[b>>2]=0;V=0;u=177;break}else{if(X^(V|0)==0){Y=V;break}else{break f}}}}while(0);if((u|0)==177){u=0;if(X){break}else{Y=0}}Z=c[f>>2]|0;X=c[Z+12>>2]|0;if((X|0)==(c[Z+16>>2]|0)){X=Ec[c[(c[Z>>2]|0)+36>>2]&127](Z)|0}else{X=c[X>>2]|0}if((X|0)!=(c[W>>2]|0)){break}_=c[f>>2]|0;Z=_+12|0;X=c[Z>>2]|0;if((X|0)==(c[_+16>>2]|0)){Ec[c[(c[_>>2]|0)+40>>2]&127](_)|0}else{c[Z>>2]=X+4}W=W+4|0;X=a[A]|0}if(!K){break b}V=a[A]|0;if((V&1)==0){X=(V&255)>>>1;V=L}else{X=c[L>>2]|0;V=c[N>>2]|0}if((W|0)!=(V+(X<<2)|0)){u=192;break a}break};default:{}}}while(0);g:do{if((u|0)==42){u=0;if((P|0)==3){u=320;break a}else{X=V;W=V}while(1){Y=c[f>>2]|0;do{if((Y|0)==0){V=1}else{V=c[Y+12>>2]|0;if((V|0)==(c[Y+16>>2]|0)){V=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{V=c[V>>2]|0}if((V|0)==-1){c[f>>2]=0;V=1;break}else{V=(c[f>>2]|0)==0;break}}}while(0);do{if((X|0)==0){u=56}else{Y=c[X+12>>2]|0;if((Y|0)==(c[X+16>>2]|0)){X=Ec[c[(c[X>>2]|0)+36>>2]&127](X)|0}else{X=c[Y>>2]|0}if((X|0)==-1){c[b>>2]=0;W=0;u=56;break}else{if(V^(W|0)==0){V=W;break}else{break g}}}}while(0);if((u|0)==56){u=0;if(V){break g}else{V=0}}Y=c[f>>2]|0;X=c[Y+12>>2]|0;if((X|0)==(c[Y+16>>2]|0)){X=Ec[c[(c[Y>>2]|0)+36>>2]&127](Y)|0}else{X=c[X>>2]|0}if(!(Fc[c[(c[E>>2]|0)+12>>2]&63](l,8192,X)|0)){break g}Z=c[f>>2]|0;X=Z+12|0;Y=c[X>>2]|0;if((Y|0)==(c[Z+16>>2]|0)){X=Ec[c[(c[Z>>2]|0)+40>>2]&127](Z)|0}else{c[X>>2]=Y+4;X=c[Y>>2]|0}Be(s,X);X=V}}}while(0);P=P+1|0;if(!(P>>>0<4>>>0)){u=320;break}}h:do{if((u|0)==41){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==134){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==192){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==272){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==296){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==318){c[j>>2]=c[j>>2]|4;j=0}else if((u|0)==320){i:do{if((Q|0)!=0){l=Q;n=Q+4|0;k=Q+8|0;w=1;j:while(1){x=a[l]|0;if((x&1)==0){x=(x&255)>>>1}else{x=c[n>>2]|0}if(!(w>>>0<x>>>0)){break i}x=c[f>>2]|0;do{if((x|0)==0){x=1}else{y=c[x+12>>2]|0;if((y|0)==(c[x+16>>2]|0)){x=Ec[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{x=c[y>>2]|0}if((x|0)==-1){c[f>>2]=0;x=1;break}else{x=(c[f>>2]|0)==0;break}}}while(0);y=c[b>>2]|0;do{if((y|0)==0){u=339}else{z=c[y+12>>2]|0;if((z|0)==(c[y+16>>2]|0)){y=Ec[c[(c[y>>2]|0)+36>>2]&127](y)|0}else{y=c[z>>2]|0}if((y|0)==-1){c[b>>2]=0;u=339;break}else{if(x){break}else{break j}}}}while(0);if((u|0)==339){u=0;if(x){break}}x=c[f>>2]|0;y=c[x+12>>2]|0;if((y|0)==(c[x+16>>2]|0)){y=Ec[c[(c[x>>2]|0)+36>>2]&127](x)|0}else{y=c[y>>2]|0}if((a[l]&1)==0){x=n}else{x=c[k>>2]|0}if((y|0)!=(c[x+(w<<2)>>2]|0)){break}w=w+1|0;y=c[f>>2]|0;z=y+12|0;x=c[z>>2]|0;if((x|0)==(c[y+16>>2]|0)){Ec[c[(c[y>>2]|0)+40>>2]&127](y)|0;continue}else{c[z>>2]=x+4;continue}}c[j>>2]=c[j>>2]|4;j=0;break h}}while(0);if((S|0)==(T|0)){j=1;S=T;break}b=a[v]|0;if((b&1)==0){f=(b&255)>>>1}else{f=c[m>>2]|0}if((f|0)==0){j=1;break}f=T-4|0;if(f>>>0>S>>>0){b=S;do{ba=c[b>>2]|0;c[b>>2]=c[f>>2];c[f>>2]=ba;b=b+4|0;f=f-4|0;}while(b>>>0<f>>>0);b=a[v]|0}if((b&1)==0){m=(b&255)>>>1;b=t+1|0}else{m=c[m>>2]|0;b=c[t+8>>2]|0}v=T-4|0;n=a[b]|0;l=n<<24>>24<1|n<<24>>24==127;k:do{if(v>>>0>S>>>0){m=b+m|0;f=S;while(1){if(!l){if((n<<24>>24|0)!=(c[f>>2]|0)){break k}}b=(m-b|0)>1?b+1|0:b;f=f+4|0;n=a[b]|0;l=n<<24>>24<1|n<<24>>24==127;if(!(f>>>0<v>>>0)){u=367;break}}}else{u=367}}while(0);if((u|0)==367){if(l){j=1;break}if(((c[v>>2]|0)-1|0)>>>0<n<<24>>24>>>0){j=1;break}}c[j>>2]=c[j>>2]|4;j=0}}while(0);ye(s);ye(r);ye(q);ye(e);me(t);if((S|0)==0){i=p;return j|0}Ac[R&255](S);i=p;return j|0}function Ei(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;d=i;i=i+456|0;w=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[w>>2];w=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[w>>2];w=d|0;s=d+16|0;u=d+416|0;q=d+424|0;v=d+432|0;r=d+440|0;t=d+448|0;n=u|0;c[n>>2]=s;l=u+4|0;c[l>>2]=160;s=s+400|0;Ge(v,h);o=v|0;p=c[o>>2]|0;if(!((c[3426]|0)==-1)){c[w>>2]=13704;c[w+4>>2]=16;c[w+8>>2]=0;he(13704,w,100)}w=(c[3427]|0)-1|0;x=c[p+8>>2]|0;do{if((c[p+12>>2]|0)-x>>2>>>0>w>>>0){x=c[x+(w<<2)>>2]|0;if((x|0)==0){break}w=x;a[r]=0;f=f|0;p=c[f>>2]|0;c[t>>2]=p;if(Di(e,t,g,v,c[h+4>>2]|0,j,r,w,u,q,s)|0){h=k;if((a[h]&1)==0){c[k+4>>2]=0;a[h]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}if((a[r]|0)!=0){Be(k,Nc[c[(c[x>>2]|0)+44>>2]&31](w,45)|0)}r=Nc[c[(c[x>>2]|0)+44>>2]&31](w,48)|0;g=c[n>>2]|0;q=c[q>>2]|0;h=q-4|0;a:do{if(g>>>0<h>>>0){while(1){s=g+4|0;if((c[g>>2]|0)!=(r|0)){break a}if(s>>>0<h>>>0){g=s}else{g=s;break}}}}while(0);Vl(k,g,q)|0}k=e|0;e=c[k>>2]|0;do{if((e|0)==0){e=1}else{q=c[e+12>>2]|0;if((q|0)==(c[e+16>>2]|0)){e=Ec[c[(c[e>>2]|0)+36>>2]&127](e)|0}else{e=c[q>>2]|0}if((e|0)==-1){c[k>>2]=0;e=1;break}else{e=(c[k>>2]|0)==0;break}}}while(0);do{if((p|0)==0){m=35}else{q=c[p+12>>2]|0;if((q|0)==(c[p+16>>2]|0)){p=Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{p=c[q>>2]|0}if((p|0)==-1){c[f>>2]=0;m=35;break}else{if(e){break}else{m=37;break}}}}while(0);if((m|0)==35){if(e){m=37}}if((m|0)==37){c[j>>2]=c[j>>2]|2}c[b>>2]=c[k>>2];Pd(c[o>>2]|0)|0;b=c[n>>2]|0;c[n>>2]=0;if((b|0)==0){i=d;return}Ac[c[l>>2]&255](b);i=d;return}}while(0);x=oc(4)|0;Fm(x);Fb(x|0,8456,134)}function Fi(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;n=i;i=i+176|0;z=n|0;y=n+16|0;x=n+32|0;v=n+40|0;t=n+56|0;r=n+72|0;o=n+88|0;w=n+104|0;u=n+112|0;s=n+128|0;q=n+144|0;p=n+160|0;if(b){p=c[d>>2]|0;if(!((c[3542]|0)==-1)){c[y>>2]=14168;c[y+4>>2]=16;c[y+8>>2]=0;he(14168,y,100)}s=(c[3543]|0)-1|0;q=c[p+8>>2]|0;if(!((c[p+12>>2]|0)-q>>2>>>0>s>>>0)){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}q=c[q+(s<<2)>>2]|0;if((q|0)==0){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}p=q;Bc[c[(c[q>>2]|0)+44>>2]&127](x,p);D=c[x>>2]|0;a[e]=D;D=D>>8;a[e+1|0]=D;D=D>>8;a[e+2|0]=D;D=D>>8;a[e+3|0]=D;e=q;Bc[c[(c[e>>2]|0)+32>>2]&127](v,p);s=l;if((a[s]&1)==0){c[l+4>>2]=0;a[s]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);l=v;c[s>>2]=c[l>>2];c[s+4>>2]=c[l+4>>2];c[s+8>>2]=c[l+8>>2];zn(l|0,0,12)|0;ye(v);Bc[c[(c[e>>2]|0)+28>>2]&127](t,p);l=k;if((a[l]&1)==0){c[k+4>>2]=0;a[l]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Ae(k,0);k=t;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];c[l+8>>2]=c[k+8>>2];zn(k|0,0,12)|0;ye(t);k=q;c[f>>2]=Ec[c[(c[k>>2]|0)+12>>2]&127](p)|0;c[g>>2]=Ec[c[(c[k>>2]|0)+16>>2]&127](p)|0;Bc[c[(c[q>>2]|0)+20>>2]&127](r,p);g=h;if((a[g]&1)==0){a[h+1|0]=0;a[g]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}re(h,0);h=r;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];zn(h|0,0,12)|0;me(r);Bc[c[(c[e>>2]|0)+24>>2]&127](o,p);h=j;if((a[h]&1)==0){c[j+4>>2]=0;a[h]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}Ae(j,0);b=o;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;ye(o);b=Ec[c[(c[k>>2]|0)+36>>2]&127](p)|0;c[m>>2]=b;i=n;return}else{o=c[d>>2]|0;if(!((c[3544]|0)==-1)){c[z>>2]=14176;c[z+4>>2]=16;c[z+8>>2]=0;he(14176,z,100)}t=(c[3545]|0)-1|0;r=c[o+8>>2]|0;if(!((c[o+12>>2]|0)-r>>2>>>0>t>>>0)){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}r=c[r+(t<<2)>>2]|0;if((r|0)==0){b=oc(4)|0;d=b;Fm(d);Fb(b|0,8456,134)}o=r;Bc[c[(c[r>>2]|0)+44>>2]&127](w,o);D=c[w>>2]|0;a[e]=D;D=D>>8;a[e+1|0]=D;D=D>>8;a[e+2|0]=D;D=D>>8;a[e+3|0]=D;e=r;Bc[c[(c[e>>2]|0)+32>>2]&127](u,o);t=l;if((a[t]&1)==0){c[l+4>>2]=0;a[t]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);l=u;c[t>>2]=c[l>>2];c[t+4>>2]=c[l+4>>2];c[t+8>>2]=c[l+8>>2];zn(l|0,0,12)|0;ye(u);Bc[c[(c[e>>2]|0)+28>>2]&127](s,o);l=k;if((a[l]&1)==0){c[k+4>>2]=0;a[l]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Ae(k,0);k=s;c[l>>2]=c[k>>2];c[l+4>>2]=c[k+4>>2];c[l+8>>2]=c[k+8>>2];zn(k|0,0,12)|0;ye(s);k=r;c[f>>2]=Ec[c[(c[k>>2]|0)+12>>2]&127](o)|0;c[g>>2]=Ec[c[(c[k>>2]|0)+16>>2]&127](o)|0;Bc[c[(c[r>>2]|0)+20>>2]&127](q,o);g=h;if((a[g]&1)==0){a[h+1|0]=0;a[g]=0}else{a[c[h+8>>2]|0]=0;c[h+4>>2]=0}re(h,0);h=q;c[g>>2]=c[h>>2];c[g+4>>2]=c[h+4>>2];c[g+8>>2]=c[h+8>>2];zn(h|0,0,12)|0;me(q);Bc[c[(c[e>>2]|0)+24>>2]&127](p,o);h=j;if((a[h]&1)==0){c[j+4>>2]=0;a[h]=0}else{c[c[j+8>>2]>>2]=0;c[j+4>>2]=0}Ae(j,0);b=p;c[h>>2]=c[b>>2];c[h+4>>2]=c[b+4>>2];c[h+8>>2]=c[b+8>>2];zn(b|0,0,12)|0;ye(p);b=Ec[c[(c[k>>2]|0)+36>>2]&127](o)|0;c[m>>2]=b;i=n;return}}function Gi(a){a=a|0;Nd(a|0);dn(a);return}function Hi(a){a=a|0;Nd(a|0);return}function Ii(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=+k;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;p=i;i=i+248|0;z=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[z>>2];z=p|0;A=p+120|0;C=p+232|0;E=p+240|0;l=E;m=i;i=i+1|0;i=i+7&-8;t=i;i=i+1|0;i=i+7&-8;s=i;i=i+12|0;i=i+7&-8;n=i;i=i+12|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;D=i;i=i+100|0;i=i+7&-8;r=i;i=i+4|0;i=i+7&-8;d=i;i=i+4|0;i=i+7&-8;o=i;i=i+4|0;i=i+7&-8;G=p+16|0;c[A>>2]=G;u=p+128|0;v=bb(G|0,100,424,(G=i,i=i+8|0,h[G>>3]=k,G)|0)|0;i=G;do{if(v>>>0>99>>>0){do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);v=Ql(A,c[3042]|0,424,(y=i,i=i+8|0,h[y>>3]=k,y)|0)|0;i=y;y=c[A>>2]|0;if((y|0)==0){jn();y=c[A>>2]|0}w=_m(v)|0;if((w|0)!=0){u=w;break}jn();u=0;w=0}else{w=0;y=0}}while(0);Ge(C,g);x=C|0;F=c[x>>2]|0;if(!((c[3428]|0)==-1)){c[z>>2]=13712;c[z+4>>2]=16;c[z+8>>2]=0;he(13712,z,100)}G=(c[3429]|0)-1|0;z=c[F+8>>2]|0;do{if((c[F+12>>2]|0)-z>>2>>>0>G>>>0){F=c[z+(G<<2)>>2]|0;if((F|0)==0){break}z=F;G=c[A>>2]|0;Cc[c[(c[F>>2]|0)+32>>2]&31](z,G,G+v|0,u)|0;if((v|0)==0){A=0}else{A=(a[c[A>>2]|0]|0)==45}c[E>>2]=0;zn(s|0,0,12)|0;E=n;zn(E|0,0,12)|0;F=q;zn(F|0,0,12)|0;Ji(f,A,C,l,m,t,s,n,q,B);C=D|0;f=c[B>>2]|0;if((v|0)>(f|0)){B=a[F]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[q+4>>2]|0}D=a[E]|0;if((D&1)==0){D=(D&255)>>>1}else{D=c[n+4>>2]|0}B=B+(v-f<<1|1)+D|0}else{B=a[F]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[q+4>>2]|0}D=a[E]|0;if((D&1)==0){D=(D&255)>>>1}else{D=c[n+4>>2]|0}B=B+2+D|0}B=B+f|0;do{if(B>>>0>100>>>0){B=_m(B)|0;if((B|0)!=0){C=B;break}jn();C=0;B=0}else{B=0}}while(0);Ki(C,r,d,c[g+4>>2]|0,u,u+v|0,z,A,l,a[m]|0,a[t]|0,s,n,q,f);c[o>>2]=c[e>>2];Pl(b,o,C,c[r>>2]|0,c[d>>2]|0,g,j);if((B|0)!=0){$m(B)}me(q);me(n);me(s);Pd(c[x>>2]|0)|0;if((w|0)!=0){$m(w)}if((y|0)==0){i=p;return}$m(y);i=p;return}}while(0);G=oc(4)|0;Fm(G);Fb(G|0,8456,134)}function Ji(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0;n=i;i=i+40|0;G=n|0;F=n+16|0;z=n+32|0;B=z;s=i;i=i+12|0;i=i+7&-8;E=i;i=i+4|0;i=i+7&-8;y=E;t=i;i=i+12|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;o=i;i=i+12|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;C=A;v=i;i=i+12|0;i=i+7&-8;w=i;i=i+4|0;i=i+7&-8;x=w;u=i;i=i+12|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;e=c[e>>2]|0;if(b){if(!((c[3546]|0)==-1)){c[F>>2]=14184;c[F+4>>2]=16;c[F+8>>2]=0;he(14184,F,100)}q=(c[3547]|0)-1|0;p=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-p>>2>>>0>q>>>0)){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}p=c[p+(q<<2)>>2]|0;if((p|0)==0){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}q=p;u=c[p>>2]|0;if(d){Bc[c[u+44>>2]&127](B,q);D=c[z>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[p>>2]|0)+32>>2]&127](s,q);f=l;if((a[f]&1)==0){a[l+1|0]=0;a[f]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);G=s;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(s)}else{Bc[c[u+40>>2]&127](y,q);D=c[E>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[p>>2]|0)+28>>2]&127](t,q);f=l;if((a[f]&1)==0){a[l+1|0]=0;a[f]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);G=t;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(t)}l=p;a[g]=Ec[c[(c[l>>2]|0)+12>>2]&127](q)|0;a[h]=Ec[c[(c[l>>2]|0)+16>>2]&127](q)|0;l=p;Bc[c[(c[l>>2]|0)+20>>2]&127](r,q);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);j=r;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];zn(j|0,0,12)|0;me(r);Bc[c[(c[l>>2]|0)+24>>2]&127](o,q);j=k;if((a[j]&1)==0){a[k+1|0]=0;a[j]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}re(k,0);G=o;c[j>>2]=c[G>>2];c[j+4>>2]=c[G+4>>2];c[j+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(o);G=Ec[c[(c[p>>2]|0)+36>>2]&127](q)|0;c[m>>2]=G;i=n;return}else{if(!((c[3548]|0)==-1)){c[G>>2]=14192;c[G+4>>2]=16;c[G+8>>2]=0;he(14192,G,100)}o=(c[3549]|0)-1|0;r=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-r>>2>>>0>o>>>0)){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}r=c[r+(o<<2)>>2]|0;if((r|0)==0){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}o=r;s=c[r>>2]|0;if(d){Bc[c[s+44>>2]&127](C,o);D=c[A>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[r>>2]|0)+32>>2]&127](v,o);f=l;if((a[f]&1)==0){a[l+1|0]=0;a[f]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);G=v;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(v)}else{Bc[c[s+40>>2]&127](x,o);D=c[w>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[r>>2]|0)+28>>2]&127](u,o);f=l;if((a[f]&1)==0){a[l+1|0]=0;a[f]=0}else{a[c[l+8>>2]|0]=0;c[l+4>>2]=0}re(l,0);G=u;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(u)}l=r;a[g]=Ec[c[(c[l>>2]|0)+12>>2]&127](o)|0;a[h]=Ec[c[(c[l>>2]|0)+16>>2]&127](o)|0;h=r;Bc[c[(c[h>>2]|0)+20>>2]&127](q,o);l=j;if((a[l]&1)==0){a[j+1|0]=0;a[l]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);j=q;c[l>>2]=c[j>>2];c[l+4>>2]=c[j+4>>2];c[l+8>>2]=c[j+8>>2];zn(j|0,0,12)|0;me(q);Bc[c[(c[h>>2]|0)+24>>2]&127](p,o);j=k;if((a[j]&1)==0){a[k+1|0]=0;a[j]=0}else{a[c[k+8>>2]|0]=0;c[k+4>>2]=0}re(k,0);G=p;c[j>>2]=c[G>>2];c[j+4>>2]=c[G+4>>2];c[j+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;me(p);G=Ec[c[(c[r>>2]|0)+36>>2]&127](o)|0;c[m>>2]=G;i=n;return}}function Ki(d,e,f,g,h,i,j,k,l,m,n,o,p,q,r){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;r=r|0;var s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0;c[f>>2]=d;v=j;u=q;s=q+1|0;t=q+8|0;q=q+4|0;x=p;y=(g&512|0)==0;A=p+1|0;z=p+8|0;E=p+4|0;D=(r|0)>0;C=o;B=o+1|0;p=o+8|0;G=o+4|0;o=j+8|0;F=-r|0;H=0;do{a:do{switch(a[l+H|0]|0){case 0:{c[e>>2]=c[f>>2];break};case 1:{c[e>>2]=c[f>>2];N=Nc[c[(c[v>>2]|0)+28>>2]&31](j,32)|0;O=c[f>>2]|0;c[f>>2]=O+1;a[O]=N;break};case 3:{J=a[u]|0;I=(J&1)==0;if(I){J=(J&255)>>>1}else{J=c[q>>2]|0}if((J|0)==0){break a}if(I){I=s}else{I=c[t>>2]|0}N=a[I]|0;O=c[f>>2]|0;c[f>>2]=O+1;a[O]=N;break};case 2:{I=a[x]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[E>>2]|0}if((J|0)==0|y){break a}if(K){K=(I&255)>>>1;I=A;J=A}else{J=c[z>>2]|0;K=c[E>>2]|0;I=J}I=I+K|0;K=c[f>>2]|0;if((J|0)!=(I|0)){do{a[K]=a[J]|0;J=J+1|0;K=K+1|0;}while((J|0)!=(I|0))}c[f>>2]=K;break};case 4:{I=c[f>>2]|0;h=k?h+1|0:h;b:do{if(h>>>0<i>>>0){J=h;while(1){K=a[J]|0;if(!(K<<24>>24>-1)){break b}L=J+1|0;if((b[(c[o>>2]|0)+(K<<24>>24<<1)>>1]&2048)==0){break b}if(L>>>0<i>>>0){J=L}else{J=L;break}}}else{J=h}}while(0);K=J;if(D){if(J>>>0>h>>>0){K=h-K|0;K=K>>>0<F>>>0?F:K;L=K+r|0;M=J;O=r;N=I;while(1){M=M-1|0;P=a[M]|0;c[f>>2]=N+1;a[N]=P;N=O-1|0;O=(N|0)>0;if(!(M>>>0>h>>>0&O)){break}O=N;N=c[f>>2]|0}J=J+K|0;if(O){w=32}else{K=0}}else{L=r;w=32}if((w|0)==32){w=0;K=Nc[c[(c[v>>2]|0)+28>>2]&31](j,48)|0}M=c[f>>2]|0;c[f>>2]=M+1;if((L|0)>0){do{a[M]=K;L=L-1|0;M=c[f>>2]|0;c[f>>2]=M+1}while((L|0)>0)}a[M]=m}if((J|0)==(h|0)){O=Nc[c[(c[v>>2]|0)+28>>2]&31](j,48)|0;P=c[f>>2]|0;c[f>>2]=P+1;a[P]=O}else{L=a[C]|0;K=(L&1)==0;if(K){L=(L&255)>>>1}else{L=c[G>>2]|0}if((L|0)==0){M=0;K=0;L=-1}else{if(K){L=B}else{L=c[p>>2]|0}M=0;K=0;L=a[L]|0}while(1){do{if((M|0)==(L|0)){N=c[f>>2]|0;c[f>>2]=N+1;a[N]=n;K=K+1|0;N=a[C]|0;M=(N&1)==0;if(M){N=(N&255)>>>1}else{N=c[G>>2]|0}if(!(K>>>0<N>>>0)){M=0;break}if(M){L=B}else{L=c[p>>2]|0}if((a[L+K|0]|0)==127){L=-1;M=0;break}if(M){L=B}else{L=c[p>>2]|0}L=a[L+K|0]|0;M=0}}while(0);J=J-1|0;O=a[J]|0;P=c[f>>2]|0;c[f>>2]=P+1;a[P]=O;if((J|0)==(h|0)){break}else{M=M+1|0}}}J=c[f>>2]|0;if((I|0)==(J|0)){break a}J=J-1|0;if(!(J>>>0>I>>>0)){break a}do{P=a[I]|0;a[I]=a[J]|0;a[J]=P;I=I+1|0;J=J-1|0;}while(I>>>0<J>>>0);break};default:{}}}while(0);H=H+1|0;}while(H>>>0<4>>>0);u=a[u]|0;v=(u&1)==0;if(v){l=(u&255)>>>1}else{l=c[q>>2]|0}if(l>>>0>1>>>0){if(v){q=(u&255)>>>1;u=s}else{s=c[t>>2]|0;q=c[q>>2]|0;u=s}t=s+1|0;s=u+q|0;q=c[f>>2]|0;if((t|0)!=(s|0)){do{a[q]=a[t]|0;t=t+1|0;q=q+1|0;}while((t|0)!=(s|0))}c[f>>2]=q}g=g&176;if((g|0)==32){c[e>>2]=c[f>>2];return}else if((g|0)==16){return}else{c[e>>2]=d;return}}function Li(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;p=i;i=i+32|0;v=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[v>>2];v=p|0;z=p+16|0;A=p+24|0;r=A;s=i;i=i+1|0;i=i+7&-8;d=i;i=i+1|0;i=i+7&-8;k=i;i=i+12|0;i=i+7&-8;l=i;i=i+12|0;i=i+7&-8;m=i;i=i+12|0;i=i+7&-8;x=i;i=i+4|0;i=i+7&-8;y=i;i=i+100|0;i=i+7&-8;q=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;n=i;i=i+4|0;i=i+7&-8;Ge(z,g);o=z|0;u=c[o>>2]|0;if(!((c[3428]|0)==-1)){c[v>>2]=13712;c[v+4>>2]=16;c[v+8>>2]=0;he(13712,v,100)}v=(c[3429]|0)-1|0;w=c[u+8>>2]|0;do{if((c[u+12>>2]|0)-w>>2>>>0>v>>>0){w=c[w+(v<<2)>>2]|0;if((w|0)==0){break}u=w;v=j;C=a[v]|0;B=(C&1)==0;if(B){C=(C&255)>>>1}else{C=c[j+4>>2]|0}if((C|0)==0){w=0}else{if(B){B=j+1|0}else{B=c[j+8>>2]|0}C=a[B]|0;w=C<<24>>24==(Nc[c[(c[w>>2]|0)+28>>2]&31](u,45)|0)<<24>>24}c[A>>2]=0;zn(k|0,0,12)|0;A=l;zn(A|0,0,12)|0;B=m;zn(B|0,0,12)|0;Ji(f,w,z,r,s,d,k,l,m,x);y=y|0;f=a[v]|0;C=(f&1)==0;if(C){z=(f&255)>>>1}else{z=c[j+4>>2]|0}x=c[x>>2]|0;if((z|0)>(x|0)){if(C){z=(f&255)>>>1}else{z=c[j+4>>2]|0}B=a[B]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[m+4>>2]|0}A=a[A]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[l+4>>2]|0}z=B+(z-x<<1|1)+A|0}else{z=a[B]|0;if((z&1)==0){z=(z&255)>>>1}else{z=c[m+4>>2]|0}A=a[A]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[l+4>>2]|0}z=z+2+A|0}z=z+x|0;do{if(z>>>0>100>>>0){z=_m(z)|0;if((z|0)!=0){y=z;break}jn();y=0;z=0;f=a[v]|0}else{z=0}}while(0);if((f&1)==0){v=(f&255)>>>1;j=j+1|0}else{v=c[j+4>>2]|0;j=c[j+8>>2]|0}Ki(y,q,t,c[g+4>>2]|0,j,j+v|0,u,w,r,a[s]|0,a[d]|0,k,l,m,x);c[n>>2]=c[e>>2];Pl(b,n,y,c[q>>2]|0,c[t>>2]|0,g,h);if((z|0)==0){me(m);me(l);me(k);C=c[o>>2]|0;C=C|0;Pd(C)|0;i=p;return}$m(z);me(m);me(l);me(k);C=c[o>>2]|0;C=C|0;Pd(C)|0;i=p;return}}while(0);C=oc(4)|0;Fm(C);Fb(C|0,8456,134)}function Mi(a){a=a|0;Nd(a|0);dn(a);return}function Ni(a){a=a|0;Nd(a|0);return}function Oi(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=+k;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0;p=i;i=i+544|0;z=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[z>>2];z=p|0;A=p+120|0;C=p+528|0;E=p+536|0;l=E;m=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;s=i;i=i+12|0;i=i+7&-8;n=i;i=i+12|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;B=i;i=i+4|0;i=i+7&-8;D=i;i=i+400|0;r=i;i=i+4|0;i=i+7&-8;d=i;i=i+4|0;i=i+7&-8;o=i;i=i+4|0;i=i+7&-8;G=p+16|0;c[A>>2]=G;u=p+128|0;v=bb(G|0,100,424,(G=i,i=i+8|0,h[G>>3]=k,G)|0)|0;i=G;do{if(v>>>0>99>>>0){do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);v=Ql(A,c[3042]|0,424,(y=i,i=i+8|0,h[y>>3]=k,y)|0)|0;i=y;y=c[A>>2]|0;if((y|0)==0){jn();y=c[A>>2]|0}G=_m(v<<2)|0;w=G;if((G|0)!=0){u=w;break}jn();u=0;w=0}else{w=0;y=0}}while(0);Ge(C,g);x=C|0;F=c[x>>2]|0;if(!((c[3426]|0)==-1)){c[z>>2]=13704;c[z+4>>2]=16;c[z+8>>2]=0;he(13704,z,100)}G=(c[3427]|0)-1|0;z=c[F+8>>2]|0;do{if((c[F+12>>2]|0)-z>>2>>>0>G>>>0){F=c[z+(G<<2)>>2]|0;if((F|0)==0){break}z=F;G=c[A>>2]|0;Cc[c[(c[F>>2]|0)+48>>2]&31](z,G,G+v|0,u)|0;if((v|0)==0){A=0}else{A=(a[c[A>>2]|0]|0)==45}c[E>>2]=0;zn(s|0,0,12)|0;E=n;zn(E|0,0,12)|0;F=q;zn(F|0,0,12)|0;Pi(f,A,C,l,m,t,s,n,q,B);C=D|0;f=c[B>>2]|0;if((v|0)>(f|0)){B=a[F]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[q+4>>2]|0}D=a[E]|0;if((D&1)==0){D=(D&255)>>>1}else{D=c[n+4>>2]|0}B=B+(v-f<<1|1)+D|0}else{B=a[F]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[q+4>>2]|0}D=a[E]|0;if((D&1)==0){D=(D&255)>>>1}else{D=c[n+4>>2]|0}B=B+2+D|0}B=B+f|0;do{if(B>>>0>100>>>0){G=_m(B<<2)|0;B=G;if((G|0)!=0){C=B;break}jn();C=0;B=0}else{B=0}}while(0);Qi(C,r,d,c[g+4>>2]|0,u,u+(v<<2)|0,z,A,l,c[m>>2]|0,c[t>>2]|0,s,n,q,f);c[o>>2]=c[e>>2];Rl(b,o,C,c[r>>2]|0,c[d>>2]|0,g,j);if((B|0)!=0){$m(B)}ye(q);ye(n);me(s);Pd(c[x>>2]|0)|0;if((w|0)!=0){$m(w)}if((y|0)==0){i=p;return}$m(y);i=p;return}}while(0);G=oc(4)|0;Fm(G);Fb(G|0,8456,134)}function Pi(b,d,e,f,g,h,j,k,l,m){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;l=l|0;m=m|0;var n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0;n=i;i=i+40|0;G=n|0;F=n+16|0;z=n+32|0;B=z;s=i;i=i+12|0;i=i+7&-8;E=i;i=i+4|0;i=i+7&-8;y=E;t=i;i=i+12|0;i=i+7&-8;r=i;i=i+12|0;i=i+7&-8;o=i;i=i+12|0;i=i+7&-8;A=i;i=i+4|0;i=i+7&-8;C=A;v=i;i=i+12|0;i=i+7&-8;w=i;i=i+4|0;i=i+7&-8;x=w;u=i;i=i+12|0;i=i+7&-8;q=i;i=i+12|0;i=i+7&-8;p=i;i=i+12|0;i=i+7&-8;e=c[e>>2]|0;if(b){if(!((c[3542]|0)==-1)){c[F>>2]=14168;c[F+4>>2]=16;c[F+8>>2]=0;he(14168,F,100)}q=(c[3543]|0)-1|0;p=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-p>>2>>>0>q>>>0)){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}q=c[p+(q<<2)>>2]|0;if((q|0)==0){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}p=q;u=c[q>>2]|0;if(d){Bc[c[u+44>>2]&127](B,p);D=c[z>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[q>>2]|0)+32>>2]&127](s,p);f=l;if((a[f]&1)==0){c[l+4>>2]=0;a[f]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);G=s;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(s)}else{Bc[c[u+40>>2]&127](y,p);D=c[E>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[q>>2]|0)+28>>2]&127](t,p);f=l;if((a[f]&1)==0){c[l+4>>2]=0;a[f]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);G=t;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(t)}l=q;c[g>>2]=Ec[c[(c[l>>2]|0)+12>>2]&127](p)|0;c[h>>2]=Ec[c[(c[l>>2]|0)+16>>2]&127](p)|0;Bc[c[(c[q>>2]|0)+20>>2]&127](r,p);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);j=r;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];zn(j|0,0,12)|0;me(r);Bc[c[(c[q>>2]|0)+24>>2]&127](o,p);j=k;if((a[j]&1)==0){c[k+4>>2]=0;a[j]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Ae(k,0);G=o;c[j>>2]=c[G>>2];c[j+4>>2]=c[G+4>>2];c[j+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(o);G=Ec[c[(c[l>>2]|0)+36>>2]&127](p)|0;c[m>>2]=G;i=n;return}else{if(!((c[3544]|0)==-1)){c[G>>2]=14176;c[G+4>>2]=16;c[G+8>>2]=0;he(14176,G,100)}o=(c[3545]|0)-1|0;r=c[e+8>>2]|0;if(!((c[e+12>>2]|0)-r>>2>>>0>o>>>0)){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}r=c[r+(o<<2)>>2]|0;if((r|0)==0){G=oc(4)|0;b=G;Fm(b);Fb(G|0,8456,134)}o=r;s=c[r>>2]|0;if(d){Bc[c[s+44>>2]&127](C,o);D=c[A>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[r>>2]|0)+32>>2]&127](v,o);f=l;if((a[f]&1)==0){c[l+4>>2]=0;a[f]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);G=v;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(v)}else{Bc[c[s+40>>2]&127](x,o);D=c[w>>2]|0;a[f]=D;D=D>>8;a[f+1|0]=D;D=D>>8;a[f+2|0]=D;D=D>>8;a[f+3|0]=D;Bc[c[(c[r>>2]|0)+28>>2]&127](u,o);f=l;if((a[f]&1)==0){c[l+4>>2]=0;a[f]=0}else{c[c[l+8>>2]>>2]=0;c[l+4>>2]=0}Ae(l,0);G=u;c[f>>2]=c[G>>2];c[f+4>>2]=c[G+4>>2];c[f+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(u)}l=r;c[g>>2]=Ec[c[(c[l>>2]|0)+12>>2]&127](o)|0;c[h>>2]=Ec[c[(c[l>>2]|0)+16>>2]&127](o)|0;Bc[c[(c[r>>2]|0)+20>>2]&127](q,o);h=j;if((a[h]&1)==0){a[j+1|0]=0;a[h]=0}else{a[c[j+8>>2]|0]=0;c[j+4>>2]=0}re(j,0);j=q;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];zn(j|0,0,12)|0;me(q);Bc[c[(c[r>>2]|0)+24>>2]&127](p,o);j=k;if((a[j]&1)==0){c[k+4>>2]=0;a[j]=0}else{c[c[k+8>>2]>>2]=0;c[k+4>>2]=0}Ae(k,0);G=p;c[j>>2]=c[G>>2];c[j+4>>2]=c[G+4>>2];c[j+8>>2]=c[G+8>>2];zn(G|0,0,12)|0;ye(p);G=Ec[c[(c[l>>2]|0)+36>>2]&127](o)|0;c[m>>2]=G;i=n;return}}function Qi(b,d,e,f,g,h,i,j,k,l,m,n,o,p,q){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;m=m|0;n=n|0;o=o|0;p=p|0;q=q|0;var r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;c[e>>2]=b;s=i;t=p;r=p+4|0;p=p+8|0;v=o;x=(f&512|0)==0;w=o+4|0;B=o+8|0;o=(q|0)>0;y=n;A=n+1|0;z=n+8|0;n=n+4|0;C=i;D=0;do{a:do{switch(a[k+D|0]|0){case 3:{F=a[t]|0;E=(F&1)==0;if(E){F=(F&255)>>>1}else{F=c[r>>2]|0}if((F|0)==0){break a}if(E){E=r}else{E=c[p>>2]|0}K=c[E>>2]|0;L=c[e>>2]|0;c[e>>2]=L+4;c[L>>2]=K;break};case 2:{F=a[v]|0;G=(F&1)==0;if(G){E=(F&255)>>>1}else{E=c[w>>2]|0}if((E|0)==0|x){break a}if(G){G=(F&255)>>>1;I=w;H=w}else{H=c[B>>2]|0;G=c[w>>2]|0;I=H}F=I+(G<<2)|0;E=c[e>>2]|0;if((H|0)!=(F|0)){I=(I+(G-1<<2)-H|0)>>>2;G=E;while(1){c[G>>2]=c[H>>2];H=H+4|0;if((H|0)==(F|0)){break}else{G=G+4|0}}E=E+(I+1<<2)|0}c[e>>2]=E;break};case 4:{E=c[e>>2]|0;g=j?g+4|0:g;b:do{if(g>>>0<h>>>0){F=g;while(1){G=F+4|0;if(!(Fc[c[(c[C>>2]|0)+12>>2]&63](i,2048,c[F>>2]|0)|0)){break b}if(G>>>0<h>>>0){F=G}else{F=G;break}}}else{F=g}}while(0);if(o){do{if(F>>>0>g>>>0){G=q;I=c[e>>2]|0;while(1){F=F-4|0;H=I+4|0;c[I>>2]=c[F>>2];G=G-1|0;I=(G|0)>0;if(F>>>0>g>>>0&I){I=H}else{break}}c[e>>2]=H;if(I){u=33;break}I=c[e>>2]|0;c[e>>2]=I+4}else{G=q;u=33}}while(0);do{if((u|0)==33){u=0;H=Nc[c[(c[s>>2]|0)+44>>2]&31](i,48)|0;I=c[e>>2]|0;L=I+4|0;c[e>>2]=L;if((G|0)>0){J=G;K=I}else{break}while(1){c[K>>2]=H;J=J-1|0;if((J|0)>0){K=L;L=L+4|0}else{break}}c[e>>2]=I+(G+1<<2);I=I+(G<<2)|0}}while(0);c[I>>2]=l}if((F|0)==(g|0)){J=Nc[c[(c[s>>2]|0)+44>>2]&31](i,48)|0;L=c[e>>2]|0;K=L+4|0;c[e>>2]=K;c[L>>2]=J}else{H=a[y]|0;G=(H&1)==0;if(G){H=(H&255)>>>1}else{H=c[n>>2]|0}if((H|0)==0){J=0;I=0;H=-1}else{if(G){G=A}else{G=c[z>>2]|0}J=0;I=0;H=a[G]|0}while(1){K=c[e>>2]|0;do{if((J|0)==(H|0)){G=K+4|0;c[e>>2]=G;c[K>>2]=m;I=I+1|0;K=a[y]|0;J=(K&1)==0;if(J){K=(K&255)>>>1}else{K=c[n>>2]|0}if(!(I>>>0<K>>>0)){J=0;break}if(J){H=A}else{H=c[z>>2]|0}if((a[H+I|0]|0)==127){H=-1;J=0;break}if(J){H=A}else{H=c[z>>2]|0}H=a[H+I|0]|0;J=0}else{G=K}}while(0);F=F-4|0;L=c[F>>2]|0;K=G+4|0;c[e>>2]=K;c[G>>2]=L;if((F|0)==(g|0)){break}else{J=J+1|0}}}if((E|0)==(K|0)){break a}F=K-4|0;if(!(F>>>0>E>>>0)){break a}do{L=c[E>>2]|0;c[E>>2]=c[F>>2];c[F>>2]=L;E=E+4|0;F=F-4|0;}while(E>>>0<F>>>0);break};case 0:{c[d>>2]=c[e>>2];break};case 1:{c[d>>2]=c[e>>2];K=Nc[c[(c[s>>2]|0)+44>>2]&31](i,32)|0;L=c[e>>2]|0;c[e>>2]=L+4;c[L>>2]=K;break};default:{}}}while(0);D=D+1|0;}while(D>>>0<4>>>0);k=a[t]|0;h=(k&1)==0;if(h){s=(k&255)>>>1}else{s=c[r>>2]|0}if(s>>>0>1>>>0){if(h){s=(k&255)>>>1;h=r}else{L=c[p>>2]|0;s=c[r>>2]|0;h=L;r=L}k=r+4|0;p=h+(s<<2)|0;r=c[e>>2]|0;if((k|0)!=(p|0)){s=(h+(s-1<<2)-k|0)>>>2;h=r;while(1){c[h>>2]=c[k>>2];k=k+4|0;if((k|0)==(p|0)){break}else{h=h+4|0}}r=r+(s+1<<2)|0}c[e>>2]=r}f=f&176;if((f|0)==32){c[d>>2]=c[e>>2];return}else if((f|0)==16){return}else{c[d>>2]=b;return}}function Ri(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;p=i;i=i+32|0;v=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[v>>2];v=p|0;z=p+16|0;A=p+24|0;r=A;s=i;i=i+4|0;i=i+7&-8;d=i;i=i+4|0;i=i+7&-8;k=i;i=i+12|0;i=i+7&-8;l=i;i=i+12|0;i=i+7&-8;m=i;i=i+12|0;i=i+7&-8;x=i;i=i+4|0;i=i+7&-8;y=i;i=i+400|0;q=i;i=i+4|0;i=i+7&-8;t=i;i=i+4|0;i=i+7&-8;n=i;i=i+4|0;i=i+7&-8;Ge(z,g);o=z|0;u=c[o>>2]|0;if(!((c[3426]|0)==-1)){c[v>>2]=13704;c[v+4>>2]=16;c[v+8>>2]=0;he(13704,v,100)}v=(c[3427]|0)-1|0;w=c[u+8>>2]|0;do{if((c[u+12>>2]|0)-w>>2>>>0>v>>>0){w=c[w+(v<<2)>>2]|0;if((w|0)==0){break}u=w;v=j;C=a[v]|0;B=(C&1)==0;if(B){C=(C&255)>>>1}else{C=c[j+4>>2]|0}if((C|0)==0){w=0}else{if(B){B=j+4|0}else{B=c[j+8>>2]|0}C=c[B>>2]|0;w=(C|0)==(Nc[c[(c[w>>2]|0)+44>>2]&31](u,45)|0)}c[A>>2]=0;zn(k|0,0,12)|0;A=l;zn(A|0,0,12)|0;B=m;zn(B|0,0,12)|0;Pi(f,w,z,r,s,d,k,l,m,x);y=y|0;f=a[v]|0;C=(f&1)==0;if(C){z=(f&255)>>>1}else{z=c[j+4>>2]|0}x=c[x>>2]|0;if((z|0)>(x|0)){if(C){z=(f&255)>>>1}else{z=c[j+4>>2]|0}B=a[B]|0;if((B&1)==0){B=(B&255)>>>1}else{B=c[m+4>>2]|0}A=a[A]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[l+4>>2]|0}z=B+(z-x<<1|1)+A|0}else{z=a[B]|0;if((z&1)==0){z=(z&255)>>>1}else{z=c[m+4>>2]|0}A=a[A]|0;if((A&1)==0){A=(A&255)>>>1}else{A=c[l+4>>2]|0}z=z+2+A|0}z=z+x|0;do{if(z>>>0>100>>>0){C=_m(z<<2)|0;z=C;if((C|0)!=0){y=z;break}jn();y=0;z=0;f=a[v]|0}else{z=0}}while(0);if((f&1)==0){v=(f&255)>>>1;j=j+4|0}else{v=c[j+4>>2]|0;j=c[j+8>>2]|0}Qi(y,q,t,c[g+4>>2]|0,j,j+(v<<2)|0,u,w,r,c[s>>2]|0,c[d>>2]|0,k,l,m,x);c[n>>2]=c[e>>2];Rl(b,n,y,c[q>>2]|0,c[t>>2]|0,g,h);if((z|0)==0){ye(m);ye(l);me(k);C=c[o>>2]|0;C=C|0;Pd(C)|0;i=p;return}$m(z);ye(m);ye(l);me(k);C=c[o>>2]|0;C=C|0;Pd(C)|0;i=p;return}}while(0);C=oc(4)|0;Fm(C);Fb(C|0,8456,134)}function Si(a){a=a|0;Nd(a|0);dn(a);return}function Ti(a){a=a|0;Nd(a|0);return}function Ui(b,d,e){b=b|0;d=d|0;e=e|0;if((a[d]&1)==0){d=d+1|0}else{d=c[d+8>>2]|0}e=rc(d|0,1)|0;return e>>>(((e|0)!=-1|0)>>>0)|0}function Vi(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0;d=i;i=i+16|0;j=d|0;l=j;zn(l|0,0,12)|0;m=a[h]|0;if((m&1)==0){n=(m&255)>>>1;m=h+1|0;h=h+1|0}else{o=c[h+8>>2]|0;n=c[h+4>>2]|0;m=o;h=o}h=h+n|0;do{if(m>>>0<h>>>0){do{te(j,a[m]|0);m=m+1|0;}while(m>>>0<h>>>0);e=(e|0)==-1?-1:e<<1;if((a[l]&1)==0){k=10;break}l=c[j+8>>2]|0}else{e=(e|0)==-1?-1:e<<1;k=10}}while(0);if((k|0)==10){l=j+1|0}g=nb(e|0,f|0,g|0,l|0)|0;zn(b|0,0,12)|0;o=An(g|0)|0;f=g+o|0;if((o|0)<=0){me(j);i=d;return}do{te(b,a[g]|0);g=g+1|0;}while(g>>>0<f>>>0);me(j);i=d;return}function Wi(a,b){a=a|0;b=b|0;Yb(((b|0)==-1?-1:b<<1)|0)|0;return}function Xi(a){a=a|0;Nd(a|0);dn(a);return}function Yi(a){a=a|0;Nd(a|0);return}function Zi(b,d,e){b=b|0;d=d|0;e=e|0;if((a[d]&1)==0){d=d+1|0}else{d=c[d+8>>2]|0}e=rc(d|0,1)|0;return e>>>(((e|0)!=-1|0)>>>0)|0}function _i(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0;d=i;i=i+240|0;w=d|0;z=d+8|0;q=d+40|0;r=d+48|0;p=d+56|0;o=d+64|0;l=d+192|0;k=d+200|0;m=d+208|0;s=d+224|0;n=d+232|0;t=m;zn(t|0,0,12)|0;c[s+4>>2]=0;c[s>>2]=4456;u=a[h]|0;if((u&1)==0){u=(u&255)>>>1;y=h+4|0;h=h+4|0}else{A=c[h+8>>2]|0;u=c[h+4>>2]|0;y=A;h=A}u=h+(u<<2)|0;h=z|0;v=w;c[w>>2]=0;c[w+4>>2]=0;a:do{if(y>>>0<u>>>0){w=s|0;x=s;z=z+32|0;A=4456;while(1){c[r>>2]=y;B=(Jc[c[A+12>>2]&31](w,v,y,u,r,h,z,q)|0)==2;A=c[r>>2]|0;if(B|(A|0)==(y|0)){break}if(h>>>0<(c[q>>2]|0)>>>0){y=h;do{te(m,a[y]|0);y=y+1|0;}while(y>>>0<(c[q>>2]|0)>>>0);y=c[r>>2]|0}else{y=A}if(!(y>>>0<u>>>0)){break a}A=c[x>>2]|0}xi(1080)}}while(0);Nd(s|0);if((a[t]&1)==0){q=m+1|0}else{q=c[m+8>>2]|0}s=nb(((e|0)==-1?-1:e<<1)|0,f|0,g|0,q|0)|0;zn(b|0,0,12)|0;c[n+4>>2]=0;c[n>>2]=4400;B=An(s|0)|0;e=s+B|0;g=p;c[p>>2]=0;c[p+4>>2]=0;if((B|0)<=0){B=n|0;Nd(B);me(m);i=d;return}q=n|0;p=n;f=e;r=o|0;o=o+128|0;t=4400;while(1){c[k>>2]=s;B=(Jc[c[t+16>>2]&31](q,g,s,(f-s|0)>32?s+32|0:e,k,r,o,l)|0)==2;t=c[k>>2]|0;if(B|(t|0)==(s|0)){break}if(r>>>0<(c[l>>2]|0)>>>0){s=r;do{Be(b,c[s>>2]|0);s=s+4|0;}while(s>>>0<(c[l>>2]|0)>>>0);s=c[k>>2]|0}else{s=t}if(!(s>>>0<e>>>0)){j=37;break}t=c[p>>2]|0}if((j|0)==37){B=n|0;Nd(B);me(m);i=d;return}xi(1080)}function $i(a,b){a=a|0;b=b|0;Yb(((b|0)==-1?-1:b<<1)|0)|0;return}function aj(a){a=a|0;a=oc(8)|0;Qd(a,312);c[a>>2]=2856;Fb(a|0,8488,36)}function bj(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;C=i;i=i+448|0;f=C|0;x=C+16|0;g=C+32|0;j=C+48|0;k=C+64|0;l=C+80|0;m=C+96|0;n=C+112|0;o=C+128|0;p=C+144|0;q=C+160|0;r=C+176|0;s=C+192|0;t=C+208|0;u=C+224|0;v=C+240|0;w=C+256|0;e=C+272|0;y=C+288|0;z=C+304|0;A=C+320|0;B=C+336|0;D=C+352|0;E=C+368|0;F=C+384|0;G=C+400|0;H=C+416|0;h=C+432|0;c[b+4>>2]=d-1;c[b>>2]=4176;I=b+8|0;d=b+12|0;J=b+136|0;a[J]=1;K=b+24|0;c[d>>2]=K;c[I>>2]=K;c[b+16>>2]=J;J=28;do{if((K|0)==0){K=0}else{c[K>>2]=0;K=c[d>>2]|0}K=K+4|0;c[d>>2]=K;J=J-1|0;}while((J|0)!=0);ke(b+144|0,168,1);I=c[I>>2]|0;J=c[d>>2]|0;if((J|0)!=(I|0)){c[d>>2]=J+(~((J-4-I|0)>>>2)<<2)}c[3099]=0;c[3098]=3880;if(!((c[3348]|0)==-1)){c[H>>2]=13392;c[H+4>>2]=16;c[H+8>>2]=0;he(13392,H,100)}cj(b,12392,(c[3349]|0)-1|0);c[3097]=0;c[3096]=3840;if(!((c[3346]|0)==-1)){c[G>>2]=13384;c[G+4>>2]=16;c[G+8>>2]=0;he(13384,G,100)}cj(b,12384,(c[3347]|0)-1|0);c[3153]=0;c[3152]=4288;c[3154]=0;a[12620]=0;c[3154]=c[(lb()|0)>>2];if(!((c[3428]|0)==-1)){c[F>>2]=13712;c[F+4>>2]=16;c[F+8>>2]=0;he(13712,F,100)}cj(b,12608,(c[3429]|0)-1|0);c[3151]=0;c[3150]=4208;if(!((c[3426]|0)==-1)){c[E>>2]=13704;c[E+4>>2]=16;c[E+8>>2]=0;he(13704,E,100)}cj(b,12600,(c[3427]|0)-1|0);c[3105]=0;c[3104]=3976;if(!((c[3352]|0)==-1)){c[D>>2]=13408;c[D+4>>2]=16;c[D+8>>2]=0;he(13408,D,100)}cj(b,12416,(c[3353]|0)-1|0);c[3101]=0;c[3100]=3920;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);c[3102]=c[3042];if(!((c[3350]|0)==-1)){c[B>>2]=13400;c[B+4>>2]=16;c[B+8>>2]=0;he(13400,B,100)}cj(b,12400,(c[3351]|0)-1|0);c[3107]=0;c[3106]=4032;if(!((c[3354]|0)==-1)){c[A>>2]=13416;c[A+4>>2]=16;c[A+8>>2]=0;he(13416,A,100)}cj(b,12424,(c[3355]|0)-1|0);c[3109]=0;c[3108]=4088;if(!((c[3356]|0)==-1)){c[z>>2]=13424;c[z+4>>2]=16;c[z+8>>2]=0;he(13424,z,100)}cj(b,12432,(c[3357]|0)-1|0);c[3079]=0;c[3078]=3384;a[12320]=46;a[12321]=44;zn(12324,0,12)|0;if(!((c[3332]|0)==-1)){c[y>>2]=13328;c[y+4>>2]=16;c[y+8>>2]=0;he(13328,y,100)}cj(b,12312,(c[3333]|0)-1|0);c[3071]=0;c[3070]=3336;c[3072]=46;c[3073]=44;zn(12296,0,12)|0;if(!((c[3330]|0)==-1)){c[e>>2]=13320;c[e+4>>2]=16;c[e+8>>2]=0;he(13320,e,100)}cj(b,12280,(c[3331]|0)-1|0);c[3095]=0;c[3094]=3768;if(!((c[3344]|0)==-1)){c[w>>2]=13376;c[w+4>>2]=16;c[w+8>>2]=0;he(13376,w,100)}cj(b,12376,(c[3345]|0)-1|0);c[3093]=0;c[3092]=3696;if(!((c[3342]|0)==-1)){c[v>>2]=13368;c[v+4>>2]=16;c[v+8>>2]=0;he(13368,v,100)}cj(b,12368,(c[3343]|0)-1|0);c[3091]=0;c[3090]=3632;if(!((c[3340]|0)==-1)){c[u>>2]=13360;c[u+4>>2]=16;c[u+8>>2]=0;he(13360,u,100)}cj(b,12360,(c[3341]|0)-1|0);c[3089]=0;c[3088]=3568;if(!((c[3338]|0)==-1)){c[t>>2]=13352;c[t+4>>2]=16;c[t+8>>2]=0;he(13352,t,100)}cj(b,12352,(c[3339]|0)-1|0);c[3163]=0;c[3162]=5216;if(!((c[3548]|0)==-1)){c[s>>2]=14192;c[s+4>>2]=16;c[s+8>>2]=0;he(14192,s,100)}cj(b,12648,(c[3549]|0)-1|0);c[3161]=0;c[3160]=5152;if(!((c[3546]|0)==-1)){c[r>>2]=14184;c[r+4>>2]=16;c[r+8>>2]=0;he(14184,r,100)}cj(b,12640,(c[3547]|0)-1|0);c[3159]=0;c[3158]=5088;if(!((c[3544]|0)==-1)){c[q>>2]=14176;c[q+4>>2]=16;c[q+8>>2]=0;he(14176,q,100)}cj(b,12632,(c[3545]|0)-1|0);c[3157]=0;c[3156]=5024;if(!((c[3542]|0)==-1)){c[p>>2]=14168;c[p+4>>2]=16;c[p+8>>2]=0;he(14168,p,100)}cj(b,12624,(c[3543]|0)-1|0);c[3053]=0;c[3052]=3040;if(!((c[3320]|0)==-1)){c[o>>2]=13280;c[o+4>>2]=16;c[o+8>>2]=0;he(13280,o,100)}cj(b,12208,(c[3321]|0)-1|0);c[3051]=0;c[3050]=3e3;if(!((c[3318]|0)==-1)){c[n>>2]=13272;c[n+4>>2]=16;c[n+8>>2]=0;he(13272,n,100)}cj(b,12200,(c[3319]|0)-1|0);c[3049]=0;c[3048]=2960;if(!((c[3316]|0)==-1)){c[m>>2]=13264;c[m+4>>2]=16;c[m+8>>2]=0;he(13264,m,100)}cj(b,12192,(c[3317]|0)-1|0);c[3047]=0;c[3046]=2920;if(!((c[3314]|0)==-1)){c[l>>2]=13256;c[l+4>>2]=16;c[l+8>>2]=0;he(13256,l,100)}cj(b,12184,(c[3315]|0)-1|0);c[3067]=0;c[3066]=3240;c[3068]=3288;if(!((c[3328]|0)==-1)){c[k>>2]=13312;c[k+4>>2]=16;c[k+8>>2]=0;he(13312,k,100)}cj(b,12264,(c[3329]|0)-1|0);c[3063]=0;c[3062]=3144;c[3064]=3192;if(!((c[3326]|0)==-1)){c[j>>2]=13304;c[j+4>>2]=16;c[j+8>>2]=0;he(13304,j,100)}cj(b,12248,(c[3327]|0)-1|0);c[3059]=0;c[3058]=4144;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);c[3060]=c[3042];c[3058]=3112;if(!((c[3324]|0)==-1)){c[g>>2]=13296;c[g+4>>2]=16;c[g+8>>2]=0;he(13296,g,100)}cj(b,12232,(c[3325]|0)-1|0);c[3055]=0;c[3054]=4144;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);c[3056]=c[3042];c[3054]=3080;if(!((c[3322]|0)==-1)){c[x>>2]=13288;c[x+4>>2]=16;c[x+8>>2]=0;he(13288,x,100)}cj(b,12216,(c[3323]|0)-1|0);c[3087]=0;c[3086]=3472;if(!((c[3336]|0)==-1)){c[f>>2]=13344;c[f+4>>2]=16;c[f+8>>2]=0;he(13344,f,100)}cj(b,12344,(c[3337]|0)-1|0);c[3085]=0;c[3084]=3432;if(!((c[3334]|0)==-1)){c[h>>2]=13336;c[h+4>>2]=16;c[h+8>>2]=0;he(13336,h,100)}cj(b,12336,(c[3335]|0)-1|0);i=C;return}function cj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0;Od(b|0);f=a+8|0;e=a+12|0;g=c[e>>2]|0;a=f|0;h=c[a>>2]|0;i=g-h>>2;do{if(!(i>>>0>d>>>0)){j=d+1|0;if(j>>>0>i>>>0){Wl(f,j-i|0);h=c[a>>2]|0;break}if(!(j>>>0<i>>>0)){break}f=h+(j<<2)|0;if((g|0)==(f|0)){break}c[e>>2]=g+(~((g-4-f|0)>>>2)<<2)}}while(0);e=c[h+(d<<2)>>2]|0;if((e|0)==0){j=h;j=j+(d<<2)|0;c[j>>2]=b;return}Pd(e|0)|0;j=c[a>>2]|0;j=j+(d<<2)|0;c[j>>2]=b;return}function dj(a){a=a|0;ej(a);dn(a);return}function ej(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;c[b>>2]=4176;d=b+12|0;h=c[d>>2]|0;e=b+8|0;g=c[e>>2]|0;if((h|0)!=(g|0)){f=0;do{i=c[g+(f<<2)>>2]|0;if((i|0)!=0){Pd(i|0)|0;h=c[d>>2]|0;g=c[e>>2]|0}f=f+1|0;}while(f>>>0<h-g>>2>>>0)}me(b+144|0);e=c[e>>2]|0;if((e|0)==0){i=b|0;Nd(i);return}f=c[d>>2]|0;if((f|0)!=(e|0)){c[d>>2]=f+(~((f-4-e|0)>>>2)<<2)}if((b+24|0)==(e|0)){a[b+136|0]=0;i=b|0;Nd(i);return}else{dn(e);i=b|0;Nd(i);return}}function fj(){var b=0;if((a[14256]|0)!=0){b=c[3034]|0;return b|0}if((sb(14256)|0)==0){b=c[3034]|0;return b|0}do{if((a[14264]|0)==0){if((sb(14264)|0)==0){break}bj(12440,1);c[3038]=12440;c[3036]=12152}}while(0);b=c[c[3036]>>2]|0;c[3040]=b;Od(b|0);c[3034]=12160;b=c[3034]|0;return b|0}function gj(a){a=a|0;var b=0;b=c[(fj()|0)>>2]|0;c[a>>2]=b;Od(b|0);return}function hj(a,b){a=a|0;b=b|0;b=c[b>>2]|0;c[a>>2]=b;Od(b|0);return}function ij(a){a=a|0;Pd(c[a>>2]|0)|0;return}function jj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=i;i=i+16|0;e=d|0;a=c[a>>2]|0;f=b|0;if(!((c[f>>2]|0)==-1)){c[e>>2]=b;c[e+4>>2]=16;c[e+8>>2]=0;he(f,e,100)}e=(c[b+4>>2]|0)-1|0;b=c[a+8>>2]|0;if(!((c[a+12>>2]|0)-b>>2>>>0>e>>>0)){f=oc(4)|0;e=f;Fm(e);Fb(f|0,8456,134)}a=c[b+(e<<2)>>2]|0;if((a|0)==0){f=oc(4)|0;e=f;Fm(e);Fb(f|0,8456,134)}else{i=d;return a|0}return 0}function kj(a){a=a|0;Nd(a|0);dn(a);return}function lj(a){a=a|0;if((a|0)==0){return}Ac[c[(c[a>>2]|0)+4>>2]&255](a);return}function mj(a){a=a|0;c[a+4>>2]=(J=c[3358]|0,c[3358]=J+1,J)+1;return}function nj(a){a=a|0;Nd(a|0);dn(a);return}function oj(a,d,e){a=a|0;d=d|0;e=e|0;if(!(e>>>0<128>>>0)){a=0;return a|0}a=(b[(c[(lb()|0)>>2]|0)+(e<<1)>>1]&d)<<16>>16!=0;return a|0}function pj(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;if((d|0)==(e|0)){a=d;return a|0}while(1){a=c[d>>2]|0;if(a>>>0<128>>>0){a=b[(c[(lb()|0)>>2]|0)+(a<<1)>>1]|0}else{a=0}b[f>>1]=a;d=d+4|0;if((d|0)==(e|0)){break}else{f=f+2|0}}return e|0}function qj(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;if((e|0)==(f|0)){a=e;return a|0}while(1){a=c[e>>2]|0;if(a>>>0<128>>>0){if(!((b[(c[(lb()|0)>>2]|0)+(a<<1)>>1]&d)<<16>>16==0)){f=e;d=7;break}}e=e+4|0;if((e|0)==(f|0)){d=7;break}}if((d|0)==7){return f|0}return 0}function rj(a,d,e,f){a=a|0;d=d|0;e=e|0;f=f|0;var g=0;a:do{if((e|0)==(f|0)){f=e}else{while(1){a=c[e>>2]|0;if(!(a>>>0<128>>>0)){f=e;break a}g=e+4|0;if((b[(c[(lb()|0)>>2]|0)+(a<<1)>>1]&d)<<16>>16==0){f=e;break a}if((g|0)==(f|0)){break}else{e=g}}}}while(0);return f|0}function sj(a,b){a=a|0;b=b|0;if(!(b>>>0<128>>>0)){a=b;return a|0}a=c[(c[(sc()|0)>>2]|0)+(b<<2)>>2]|0;return a|0}function tj(a,b,d){a=a|0;b=b|0;d=d|0;if((b|0)==(d|0)){a=b;return a|0}do{a=c[b>>2]|0;if(a>>>0<128>>>0){a=c[(c[(sc()|0)>>2]|0)+(a<<2)>>2]|0}c[b>>2]=a;b=b+4|0;}while((b|0)!=(d|0));return d|0}function uj(a,b){a=a|0;b=b|0;if(!(b>>>0<128>>>0)){a=b;return a|0}a=c[(c[(tc()|0)>>2]|0)+(b<<2)>>2]|0;return a|0}function vj(a,b,d){a=a|0;b=b|0;d=d|0;if((b|0)==(d|0)){a=b;return a|0}do{a=c[b>>2]|0;if(a>>>0<128>>>0){a=c[(c[(tc()|0)>>2]|0)+(a<<2)>>2]|0}c[b>>2]=a;b=b+4|0;}while((b|0)!=(d|0));return d|0}function wj(a,b){a=a|0;b=b|0;return b<<24>>24|0}function xj(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;if((d|0)==(e|0)){b=d;return b|0}while(1){c[f>>2]=a[d]|0;d=d+1|0;if((d|0)==(e|0)){break}else{f=f+4|0}}return e|0}function yj(a,b,c){a=a|0;b=b|0;c=c|0;return(b>>>0<128>>>0?b&255:c)|0}function zj(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;if((d|0)==(e|0)){i=d;return i|0}b=((e-4-d|0)>>>2)+1|0;h=d;while(1){i=c[h>>2]|0;a[g]=i>>>0<128>>>0?i&255:f;h=h+4|0;if((h|0)==(e|0)){break}else{g=g+1|0}}i=d+(b<<2)|0;return i|0}function Aj(b){b=b|0;var d=0;c[b>>2]=4288;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]|0)==0){break}en(d)}}while(0);Nd(b|0);dn(b);return}function Bj(b){b=b|0;var d=0;c[b>>2]=4288;d=c[b+8>>2]|0;do{if((d|0)!=0){if((a[b+12|0]|0)==0){break}en(d)}}while(0);Nd(b|0);return}function Cj(a,b){a=a|0;b=b|0;if(!(b<<24>>24>-1)){a=b;return a|0}a=c[(c[(sc()|0)>>2]|0)+((b&255)<<2)>>2]&255;return a|0}function Dj(b,d,e){b=b|0;d=d|0;e=e|0;if((d|0)==(e|0)){b=d;return b|0}do{b=a[d]|0;if(b<<24>>24>-1){b=c[(c[(sc()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255}a[d]=b;d=d+1|0;}while((d|0)!=(e|0));return e|0}function Ej(a,b){a=a|0;b=b|0;if(!(b<<24>>24>-1)){a=b;return a|0}a=c[(c[(tc()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255;return a|0}function Fj(b,d,e){b=b|0;d=d|0;e=e|0;if((d|0)==(e|0)){b=d;return b|0}do{b=a[d]|0;if(b<<24>>24>-1){b=c[(c[(tc()|0)>>2]|0)+(b<<24>>24<<2)>>2]&255}a[d]=b;d=d+1|0;}while((d|0)!=(e|0));return e|0}function Gj(a,b){a=a|0;b=b|0;return b|0}function Hj(b,c,d,e){b=b|0;c=c|0;d=d|0;e=e|0;if((c|0)==(d|0)){b=c;return b|0}while(1){a[e]=a[c]|0;c=c+1|0;if((c|0)==(d|0)){break}else{e=e+1|0}}return d|0}function Ij(a,b,c){a=a|0;b=b|0;c=c|0;return(b<<24>>24>-1?b:c)|0}function Jj(b,c,d,e,f){b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;if((c|0)==(d|0)){b=c;return b|0}while(1){b=a[c]|0;a[f]=b<<24>>24>-1?b:e;c=c+1|0;if((c|0)==(d|0)){break}else{f=f+1|0}}return d|0}function Kj(a){a=a|0;Nd(a|0);dn(a);return}function Lj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function Mj(a,b,d,e,f,g,h,i){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;c[f>>2]=d;c[i>>2]=g;return 3}function Nj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function Oj(a){a=a|0;return 1}function Pj(a){a=a|0;return 1}function Qj(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;c=d-c|0;return(c>>>0<e>>>0?c:e)|0}function Rj(a){a=a|0;return 1}function Sj(a){a=a|0;Sk(a);dn(a);return}function Tj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;l=i;i=i+8|0;n=l|0;m=n;q=i;i=i+4|0;i=i+7&-8;o=(e|0)==(f|0);a:do{if(o){c[k>>2]=h;c[g>>2]=e}else{r=e;while(1){p=r+4|0;if((c[r>>2]|0)==0){break}if((p|0)==(f|0)){r=f;break}else{r=p}}c[k>>2]=h;c[g>>2]=e;if(o|(h|0)==(j|0)){break}o=d;p=j;b=b+8|0;q=q|0;while(1){t=c[o+4>>2]|0;c[n>>2]=c[o>>2];c[n+4>>2]=t;t=ac(c[b>>2]|0)|0;s=ym(h,g,r-e>>2,p-h|0,d)|0;if((t|0)!=0){ac(t|0)|0}if((s|0)==(-1|0)){j=16;break}else if((s|0)==0){g=1;j=51;break}h=(c[k>>2]|0)+s|0;c[k>>2]=h;if((h|0)==(j|0)){j=49;break}if((r|0)==(f|0)){r=f;e=c[g>>2]|0}else{h=ac(c[b>>2]|0)|0;r=xm(q,0,d)|0;if((h|0)!=0){ac(h|0)|0}if((r|0)==-1){g=2;j=51;break}e=c[k>>2]|0;if(r>>>0>(p-e|0)>>>0){g=1;j=51;break}b:do{if((r|0)!=0){h=q;while(1){t=a[h]|0;c[k>>2]=e+1;a[e]=t;r=r-1|0;if((r|0)==0){break b}h=h+1|0;e=c[k>>2]|0}}}while(0);e=(c[g>>2]|0)+4|0;c[g>>2]=e;c:do{if((e|0)==(f|0)){r=f}else{r=e;while(1){h=r+4|0;if((c[r>>2]|0)==0){break c}if((h|0)==(f|0)){r=f;break}else{r=h}}}}while(0);h=c[k>>2]|0}if((e|0)==(f|0)|(h|0)==(j|0)){break a}}if((j|0)==16){c[k>>2]=h;d:do{if((e|0)!=(c[g>>2]|0)){do{j=c[e>>2]|0;f=ac(c[b>>2]|0)|0;j=xm(h,j,m)|0;if((f|0)!=0){ac(f|0)|0}if((j|0)==-1){break d}h=(c[k>>2]|0)+j|0;c[k>>2]=h;e=e+4|0;}while((e|0)!=(c[g>>2]|0))}}while(0);c[g>>2]=e;t=2;i=l;return t|0}else if((j|0)==49){e=c[g>>2]|0;break}else if((j|0)==51){i=l;return g|0}}}while(0);t=(e|0)!=(f|0)|0;i=l;return t|0}function Uj(b,d,e,f,g,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;l=i;i=i+8|0;n=l|0;m=n;o=(e|0)==(f|0);a:do{if(o){c[k>>2]=h;c[g>>2]=e}else{r=e;while(1){p=r+1|0;if((a[r]|0)==0){break}if((p|0)==(f|0)){r=f;break}else{r=p}}c[k>>2]=h;c[g>>2]=e;if(o|(h|0)==(j|0)){break}p=d;o=j;b=b+8|0;while(1){q=c[p+4>>2]|0;c[n>>2]=c[p>>2];c[n+4>>2]=q;q=r;t=ac(c[b>>2]|0)|0;s=um(h,g,q-e|0,o-h>>2,d)|0;if((t|0)!=0){ac(t|0)|0}if((s|0)==0){f=2;n=50;break}else if((s|0)==(-1|0)){n=16;break}h=(c[k>>2]|0)+(s<<2)|0;c[k>>2]=h;if((h|0)==(j|0)){n=48;break}e=c[g>>2]|0;if((r|0)==(f|0)){r=f}else{q=ac(c[b>>2]|0)|0;h=tm(h,e,1,d)|0;if((q|0)!=0){ac(q|0)|0}if((h|0)!=0){f=2;n=50;break}c[k>>2]=(c[k>>2]|0)+4;e=(c[g>>2]|0)+1|0;c[g>>2]=e;b:do{if((e|0)==(f|0)){r=f}else{r=e;while(1){q=r+1|0;if((a[r]|0)==0){break b}if((q|0)==(f|0)){r=f;break}else{r=q}}}}while(0);h=c[k>>2]|0}if((e|0)==(f|0)|(h|0)==(j|0)){break a}}if((n|0)==16){c[k>>2]=h;c:do{if((e|0)!=(c[g>>2]|0)){while(1){n=ac(c[b>>2]|0)|0;j=tm(h,e,q-e|0,m)|0;if((n|0)!=0){ac(n|0)|0}if((j|0)==0){e=e+1|0}else if((j|0)==(-1|0)){n=27;break}else if((j|0)==(-2|0)){n=28;break}else{e=e+j|0}h=(c[k>>2]|0)+4|0;c[k>>2]=h;if((e|0)==(c[g>>2]|0)){break c}}if((n|0)==27){c[g>>2]=e;t=2;i=l;return t|0}else if((n|0)==28){c[g>>2]=e;t=1;i=l;return t|0}}}while(0);c[g>>2]=e;t=(e|0)!=(f|0)|0;i=l;return t|0}else if((n|0)==48){e=c[g>>2]|0;break}else if((n|0)==50){i=l;return f|0}}}while(0);t=(e|0)!=(f|0)|0;i=l;return t|0}function Vj(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=i;i=i+8|0;c[g>>2]=e;e=h|0;b=ac(c[b+8>>2]|0)|0;d=xm(e,0,d)|0;if((b|0)!=0){ac(b|0)|0}if((d|0)==(-1|0)|(d|0)==0){b=2;i=h;return b|0}b=d-1|0;d=c[g>>2]|0;if(b>>>0>(f-d|0)>>>0){b=1;i=h;return b|0}if((b|0)==0){b=0;i=h;return b|0}else{f=b}while(1){b=a[e]|0;c[g>>2]=d+1;a[d]=b;f=f-1|0;if((f|0)==0){g=0;break}e=e+1|0;d=c[g>>2]|0}i=h;return g|0}function Wj(a){a=a|0;var b=0,d=0;a=a+8|0;d=ac(c[a>>2]|0)|0;b=wm(0,0,4)|0;if((d|0)!=0){ac(d|0)|0}if((b|0)!=0){d=-1;return d|0}a=c[a>>2]|0;if((a|0)==0){d=1;return d|0}a=ac(a|0)|0;if((a|0)==0){d=0;return d|0}ac(a|0)|0;d=0;return d|0}function Xj(a){a=a|0;return 0}function Yj(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;if((f|0)==0|(d|0)==(e|0)){k=0;return k|0}g=e;a=a+8|0;h=0;i=0;while(1){k=ac(c[a>>2]|0)|0;j=sm(d,g-d|0,b)|0;if((k|0)!=0){ac(k|0)|0}if((j|0)==(-1|0)|(j|0)==(-2|0)){f=15;break}else if((j|0)==0){k=1;d=d+1|0}else{k=j;d=d+j|0}h=k+h|0;i=i+1|0;if(i>>>0>=f>>>0|(d|0)==(e|0)){f=15;break}}if((f|0)==15){return h|0}return 0}function Zj(a){a=a|0;a=c[a+8>>2]|0;do{if((a|0)==0){a=1}else{a=ac(a|0)|0;if((a|0)==0){a=4;break}ac(a|0)|0;a=4}}while(0);return a|0}function _j(a){a=a|0;Nd(a|0);dn(a);return}function $j(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;a=i;i=i+16|0;l=a|0;k=a+8|0;c[l>>2]=d;c[k>>2]=g;b=Xl(d,e,l,g,h,k,1114111,0)|0;c[f>>2]=d+((c[l>>2]|0)-d>>1<<1);c[j>>2]=g+((c[k>>2]|0)-g);i=a;return b|0}function ak(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;a=i;i=i+16|0;l=a|0;k=a+8|0;c[l>>2]=d;c[k>>2]=g;b=Yl(d,e,l,g,h,k,1114111,0)|0;c[f>>2]=d+((c[l>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>1<<1);i=a;return b|0}function bk(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function ck(a){a=a|0;return 0}function dk(a){a=a|0;return 0}function ek(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Zl(c,d,e,1114111,0)|0}function fk(a){a=a|0;return 4}function gk(a){a=a|0;Nd(a|0);dn(a);return}function hk(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;a=i;i=i+16|0;l=a|0;k=a+8|0;c[l>>2]=d;c[k>>2]=g;b=_l(d,e,l,g,h,k,1114111,0)|0;c[f>>2]=d+((c[l>>2]|0)-d>>2<<2);c[j>>2]=g+((c[k>>2]|0)-g);i=a;return b|0}function ik(a,b,d,e,f,g,h,j){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0;a=i;i=i+16|0;l=a|0;k=a+8|0;c[l>>2]=d;c[k>>2]=g;b=$l(d,e,l,g,h,k,1114111,0)|0;c[f>>2]=d+((c[l>>2]|0)-d);c[j>>2]=g+((c[k>>2]|0)-g>>2<<2);i=a;return b|0}function jk(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;c[f>>2]=d;return 3}function kk(a){a=a|0;return 0}function lk(a){a=a|0;return 0}function mk(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return am(c,d,e,1114111,0)|0}function nk(a){a=a|0;return 4}function ok(a){a=a|0;Nd(a|0);dn(a);return}function pk(a){a=a|0;Nd(a|0);dn(a);return}function qk(a){a=a|0;c[a>>2]=3384;me(a+12|0);Nd(a|0);dn(a);return}function rk(a){a=a|0;c[a>>2]=3384;me(a+12|0);Nd(a|0);return}function sk(a){a=a|0;c[a>>2]=3336;me(a+16|0);Nd(a|0);dn(a);return}function tk(a){a=a|0;c[a>>2]=3336;me(a+16|0);Nd(a|0);return}function uk(b){b=b|0;return a[b+8|0]|0}function vk(a){a=a|0;return c[a+8>>2]|0}function wk(b){b=b|0;return a[b+9|0]|0}function xk(a){a=a|0;return c[a+12>>2]|0}function yk(a,b){a=a|0;b=b|0;je(a,b+12|0);return}function zk(a,b){a=a|0;b=b|0;je(a,b+16|0);return}function Ak(a,b){a=a|0;b=b|0;ke(a,1696,4);return}function Bk(a,b){a=a|0;b=b|0;we(a,1664,Am(1664)|0);return}function Ck(a,b){a=a|0;b=b|0;ke(a,1656,5);return}function Dk(a,b){a=a|0;b=b|0;we(a,1584,Am(1584)|0);return}function Ek(b){b=b|0;if((a[14352]|0)!=0){b=c[3188]|0;return b|0}if((sb(14352)|0)==0){b=c[3188]|0;return b|0}do{if((a[14240]|0)==0){if((sb(14240)|0)==0){break}zn(11680,0,168)|0;eb(74,0,v|0)|0}}while(0);ne(11680,1888)|0;ne(11692,1840)|0;ne(11704,1832)|0;ne(11716,1816)|0;ne(11728,1800)|0;ne(11740,1792)|0;ne(11752,1776)|0;ne(11764,1768)|0;ne(11776,1760)|0;ne(11788,1752)|0;ne(11800,1744)|0;ne(11812,1736)|0;ne(11824,1728)|0;ne(11836,1720)|0;c[3188]=11680;b=c[3188]|0;return b|0}function Fk(b){b=b|0;if((a[14296]|0)!=0){b=c[3166]|0;return b|0}if((sb(14296)|0)==0){b=c[3166]|0;return b|0}do{if((a[14216]|0)==0){if((sb(14216)|0)==0){break}zn(10936,0,168)|0;eb(222,0,v|0)|0}}while(0);ze(10936,104)|0;ze(10948,72)|0;ze(10960,2160)|0;ze(10972,2120)|0;ze(10984,2080)|0;ze(10996,2048)|0;ze(11008,2008)|0;ze(11020,1992)|0;ze(11032,1976)|0;ze(11044,1960)|0;ze(11056,1944)|0;ze(11068,1928)|0;ze(11080,1912)|0;ze(11092,1896)|0;c[3166]=10936;b=c[3166]|0;return b|0}function Gk(b){b=b|0;if((a[14344]|0)!=0){b=c[3186]|0;return b|0}if((sb(14344)|0)==0){b=c[3186]|0;return b|0}do{if((a[14232]|0)==0){if((sb(14232)|0)==0){break}zn(11392,0,288)|0;eb(12,0,v|0)|0}}while(0);ne(11392,416)|0;ne(11404,400)|0;ne(11416,392)|0;ne(11428,384)|0;ne(11440,376)|0;ne(11452,368)|0;ne(11464,360)|0;ne(11476,336)|0;ne(11488,320)|0;ne(11500,304)|0;ne(11512,288)|0;ne(11524,272)|0;ne(11536,264)|0;ne(11548,256)|0;ne(11560,248)|0;ne(11572,240)|0;ne(11584,376)|0;ne(11596,192)|0;ne(11608,184)|0;ne(11620,176)|0;ne(11632,160)|0;ne(11644,152)|0;ne(11656,144)|0;ne(11668,136)|0;c[3186]=11392;b=c[3186]|0;return b|0}function Hk(b){b=b|0;if((a[14288]|0)!=0){b=c[3164]|0;return b|0}if((sb(14288)|0)==0){b=c[3164]|0;return b|0}do{if((a[14208]|0)==0){if((sb(14208)|0)==0){break}zn(10648,0,288)|0;eb(58,0,v|0)|0}}while(0);ze(10648,984)|0;ze(10660,944)|0;ze(10672,920)|0;ze(10684,896)|0;ze(10696,544)|0;ze(10708,864)|0;ze(10720,840)|0;ze(10732,808)|0;ze(10744,768)|0;ze(10756,736)|0;ze(10768,696)|0;ze(10780,656)|0;ze(10792,640)|0;ze(10804,624)|0;ze(10816,592)|0;ze(10828,576)|0;ze(10840,544)|0;ze(10852,528)|0;ze(10864,512)|0;ze(10876,496)|0;ze(10888,480)|0;ze(10900,464)|0;ze(10912,448)|0;ze(10924,432)|0;c[3164]=10648;b=c[3164]|0;return b|0}function Ik(b){b=b|0;if((a[14360]|0)!=0){b=c[3190]|0;return b|0}if((sb(14360)|0)==0){b=c[3190]|0;return b|0}do{if((a[14248]|0)==0){if((sb(14248)|0)==0){break}zn(11848,0,288)|0;eb(62,0,v|0)|0}}while(0);ne(11848,1024)|0;ne(11860,1016)|0;c[3190]=11848;b=c[3190]|0;return b|0}function Jk(b){b=b|0;if((a[14304]|0)!=0){b=c[3168]|0;return b|0}if((sb(14304)|0)==0){b=c[3168]|0;return b|0}do{if((a[14224]|0)==0){if((sb(14224)|0)==0){break}zn(11104,0,288)|0;eb(232,0,v|0)|0}}while(0);ze(11104,1048)|0;ze(11116,1032)|0;c[3168]=11104;b=c[3168]|0;return b|0}function Kk(b){b=b|0;if((a[14368]|0)!=0){return 12768}if((sb(14368)|0)==0){return 12768}ke(12768,1552,8);eb(248,12768,v|0)|0;return 12768}function Lk(b){b=b|0;if((a[14312]|0)!=0){return 12680}if((sb(14312)|0)==0){return 12680}we(12680,1512,Am(1512)|0);eb(186,12680,v|0)|0;return 12680}function Mk(b){b=b|0;if((a[14392]|0)!=0){return 12816}if((sb(14392)|0)==0){return 12816}ke(12816,1488,8);eb(248,12816,v|0)|0;return 12816}function Nk(b){b=b|0;if((a[14336]|0)!=0){return 12728}if((sb(14336)|0)==0){return 12728}we(12728,1432,Am(1432)|0);eb(186,12728,v|0)|0;return 12728}function Ok(b){b=b|0;if((a[14384]|0)!=0){return 12800}if((sb(14384)|0)==0){return 12800}ke(12800,1408,20);eb(248,12800,v|0)|0;return 12800}function Pk(b){b=b|0;if((a[14328]|0)!=0){return 12712}if((sb(14328)|0)==0){return 12712}we(12712,1320,Am(1320)|0);eb(186,12712,v|0)|0;return 12712}function Qk(b){b=b|0;if((a[14376]|0)!=0){return 12784}if((sb(14376)|0)==0){return 12784}ke(12784,1296,11);eb(248,12784,v|0)|0;return 12784}function Rk(b){b=b|0;if((a[14320]|0)!=0){return 12696}if((sb(14320)|0)==0){return 12696}we(12696,1248,Am(1248)|0);eb(186,12696,v|0)|0;return 12696}function Sk(b){b=b|0;var d=0,e=0;c[b>>2]=3920;d=b+8|0;e=c[d>>2]|0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);if((e|0)==(c[3042]|0)){e=b|0;Nd(e);return}mb(c[d>>2]|0);e=b|0;Nd(e);return}function Tk(a){a=a|0;c[a>>2]=4512;ij(a+4|0);dn(a);return}function Uk(b,d){b=b|0;d=d|0;var e=0;Ec[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=jj(d,13400)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function Vk(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+16|0;j=b|0;d=b+8|0;e=a+36|0;f=a+40|0;g=j|0;h=j+8|0;a=a+32|0;while(1){k=c[e>>2]|0;k=Oc[c[(c[k>>2]|0)+20>>2]&31](k,c[f>>2]|0,g,h,d)|0;l=(c[d>>2]|0)-j|0;if((Na(g|0,1,l|0,c[a>>2]|0)|0)!=(l|0)){e=-1;d=5;break}if((k|0)==2){e=-1;d=5;break}else if((k|0)!=1){d=4;break}}if((d|0)==4){l=((Ka(c[a>>2]|0)|0)!=0)<<31>>31;i=b;return l|0}else if((d|0)==5){i=b;return e|0}return 0}function Wk(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0;if((a[b+44|0]|0)!=0){g=Na(d|0,4,e|0,c[b+32>>2]|0)|0;return g|0}f=b;if((e|0)>0){g=0}else{g=0;return g|0}while(1){if((Nc[c[(c[f>>2]|0)+52>>2]&31](b,c[d>>2]|0)|0)==-1){b=6;break}g=g+1|0;if((g|0)<(e|0)){d=d+4|0}else{b=6;break}}if((b|0)==6){return g|0}return 0}function Xk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;o=e|0;p=e+8|0;h=e+16|0;j=e+24|0;f=(d|0)==-1;a:do{if(!f){c[p>>2]=d;if((a[b+44|0]|0)!=0){if((Na(p|0,4,1,c[b+32>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}m=o|0;c[h>>2]=m;k=p+4|0;n=b+36|0;l=b+40|0;g=o+8|0;b=b+32|0;while(1){q=c[n>>2]|0;q=Jc[c[(c[q>>2]|0)+12>>2]&31](q,c[l>>2]|0,p,k,j,m,g,h)|0;if((c[j>>2]|0)==(p|0)){d=-1;g=12;break}if((q|0)==3){g=7;break}r=(q|0)==1;if(!(q>>>0<2>>>0)){d=-1;g=12;break}q=(c[h>>2]|0)-o|0;if((Na(m|0,1,q|0,c[b>>2]|0)|0)!=(q|0)){d=-1;g=12;break}if(r){p=r?c[j>>2]|0:p}else{break a}}if((g|0)==7){if((Na(p|0,1,1,c[b>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}else if((g|0)==12){i=e;return d|0}}}while(0);r=f?0:d;i=e;return r|0}function Yk(a){a=a|0;c[a>>2]=4512;ij(a+4|0);dn(a);return}function Zk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;g=jj(d,13400)|0;f=g;e=b+36|0;c[e>>2]=f;d=b+44|0;c[d>>2]=Ec[c[(c[g>>2]|0)+24>>2]&127](f)|0;e=c[e>>2]|0;a[b+53|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)<=8){return}xi(200);return}function _k(a){a=a|0;return hm(a,0)|0}function $k(a){a=a|0;return hm(a,1)|0}function al(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+32|0;k=e|0;f=e+8|0;m=e+16|0;l=e+24|0;g=b+52|0;j=(a[g]|0)!=0;if((d|0)==-1){if(j){m=-1;i=e;return m|0}m=c[b+48>>2]|0;a[g]=(m|0)!=-1|0;i=e;return m|0}h=b+48|0;a:do{if(j){c[m>>2]=c[h>>2];n=c[b+36>>2]|0;j=k|0;l=Jc[c[(c[n>>2]|0)+12>>2]&31](n,c[b+40>>2]|0,m,m+4|0,l,j,k+8|0,f)|0;if((l|0)==3){a[j]=c[h>>2];c[f>>2]=k+1}else if((l|0)==2|(l|0)==1){n=-1;i=e;return n|0}b=b+32|0;while(1){k=c[f>>2]|0;if(!(k>>>0>j>>>0)){break a}n=k-1|0;c[f>>2]=n;if(($b(a[n]|0,c[b>>2]|0)|0)==-1){f=-1;break}}i=e;return f|0}}while(0);c[h>>2]=d;a[g]=1;n=d;i=e;return n|0}function bl(a){a=a|0;c[a>>2]=4584;ij(a+4|0);dn(a);return}function cl(b,d){b=b|0;d=d|0;var e=0;Ec[c[(c[b>>2]|0)+24>>2]&127](b)|0;e=jj(d,13408)|0;d=e;c[b+36>>2]=d;a[b+44|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](d)|0)&1;return}function dl(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0;b=i;i=i+16|0;j=b|0;d=b+8|0;e=a+36|0;f=a+40|0;g=j|0;h=j+8|0;a=a+32|0;while(1){k=c[e>>2]|0;k=Oc[c[(c[k>>2]|0)+20>>2]&31](k,c[f>>2]|0,g,h,d)|0;l=(c[d>>2]|0)-j|0;if((Na(g|0,1,l|0,c[a>>2]|0)|0)!=(l|0)){e=-1;d=5;break}if((k|0)==2){e=-1;d=5;break}else if((k|0)!=1){d=4;break}}if((d|0)==4){l=((Ka(c[a>>2]|0)|0)!=0)<<31>>31;i=b;return l|0}else if((d|0)==5){i=b;return e|0}return 0}function el(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0;if((a[b+44|0]|0)!=0){h=Na(e|0,1,f|0,c[b+32>>2]|0)|0;return h|0}g=b;if((f|0)>0){h=0}else{h=0;return h|0}while(1){if((Nc[c[(c[g>>2]|0)+52>>2]&31](b,d[e]|0)|0)==-1){b=6;break}h=h+1|0;if((h|0)<(f|0)){e=e+1|0}else{b=6;break}}if((b|0)==6){return h|0}return 0}function fl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;e=i;i=i+32|0;o=e|0;p=e+8|0;h=e+16|0;j=e+24|0;f=(d|0)==-1;a:do{if(!f){a[p]=d;if((a[b+44|0]|0)!=0){if((Na(p|0,1,1,c[b+32>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}m=o|0;c[h>>2]=m;k=p+1|0;n=b+36|0;l=b+40|0;g=o+8|0;b=b+32|0;while(1){q=c[n>>2]|0;q=Jc[c[(c[q>>2]|0)+12>>2]&31](q,c[l>>2]|0,p,k,j,m,g,h)|0;if((c[j>>2]|0)==(p|0)){d=-1;g=12;break}if((q|0)==3){g=7;break}r=(q|0)==1;if(!(q>>>0<2>>>0)){d=-1;g=12;break}q=(c[h>>2]|0)-o|0;if((Na(m|0,1,q|0,c[b>>2]|0)|0)!=(q|0)){d=-1;g=12;break}if(r){p=r?c[j>>2]|0:p}else{break a}}if((g|0)==7){if((Na(p|0,1,1,c[b>>2]|0)|0)==1){break}else{d=-1}i=e;return d|0}else if((g|0)==12){i=e;return d|0}}}while(0);r=f?0:d;i=e;return r|0}function gl(a){a=a|0;c[a>>2]=4584;ij(a+4|0);dn(a);return}function hl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;g=jj(d,13408)|0;f=g;e=b+36|0;c[e>>2]=f;d=b+44|0;c[d>>2]=Ec[c[(c[g>>2]|0)+24>>2]&127](f)|0;e=c[e>>2]|0;a[b+53|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)<=8){return}xi(200);return}function il(a){a=a|0;return im(a,0)|0}function jl(a){a=a|0;return im(a,1)|0}function kl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+32|0;k=e|0;f=e+8|0;m=e+16|0;l=e+24|0;g=b+52|0;j=(a[g]|0)!=0;if((d|0)==-1){if(j){m=-1;i=e;return m|0}m=c[b+48>>2]|0;a[g]=(m|0)!=-1|0;i=e;return m|0}h=b+48|0;a:do{if(j){a[m]=c[h>>2];n=c[b+36>>2]|0;j=k|0;l=Jc[c[(c[n>>2]|0)+12>>2]&31](n,c[b+40>>2]|0,m,m+1|0,l,j,k+8|0,f)|0;if((l|0)==2|(l|0)==1){n=-1;i=e;return n|0}else if((l|0)==3){a[j]=c[h>>2];c[f>>2]=k+1}b=b+32|0;while(1){k=c[f>>2]|0;if(!(k>>>0>j>>>0)){break a}n=k-1|0;c[f>>2]=n;if(($b(a[n]|0,c[b>>2]|0)|0)==-1){f=-1;break}}i=e;return f|0}}while(0);c[h>>2]=d;a[g]=1;n=d;i=e;return n|0}function ll(){Ld(0);eb(142,14160,v|0)|0;return}function ml(a){a=a|0;ge(a|0);dn(a);return}function nl(a){a=a|0;tb(a|0)|0;Sb()}function ol(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4584;j=b+4|0;gj(j);zn(b+8|0,0,24)|0;c[h>>2]=5352;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;hj(g,j);j=jj(g,13408)|0;h=j;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=Ec[c[(c[j>>2]|0)+24>>2]&127](h)|0;e=c[e>>2]|0;a[b+53|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)<=8){ij(g);i=f;return}xi(200);ij(g);i=f;return}function pl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;h=f|0;j=b|0;c[j>>2]=4584;g=b+4|0;gj(g);zn(b+8|0,0,24)|0;c[j>>2]=4952;c[b+32>>2]=d;hj(h,g);g=jj(h,13408)|0;d=g;ij(h);c[b+36>>2]=d;c[b+40>>2]=e;a[b+44|0]=(Ec[c[(c[g>>2]|0)+28>>2]&127](d)|0)&1;i=f;return}function ql(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;g=f|0;h=b|0;c[h>>2]=4512;j=b+4|0;gj(j);zn(b+8|0,0,24)|0;c[h>>2]=5280;c[b+32>>2]=d;c[b+40>>2]=e;c[b+48>>2]=-1;a[b+52|0]=0;hj(g,j);j=jj(g,13400)|0;h=j;e=b+36|0;c[e>>2]=h;d=b+44|0;c[d>>2]=Ec[c[(c[j>>2]|0)+24>>2]&127](h)|0;e=c[e>>2]|0;a[b+53|0]=(Ec[c[(c[e>>2]|0)+28>>2]&127](e)|0)&1;if((c[d>>2]|0)<=8){ij(g);i=f;return}xi(200);ij(g);i=f;return}function rl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0;f=i;i=i+8|0;h=f|0;j=b|0;c[j>>2]=4512;g=b+4|0;gj(g);zn(b+8|0,0,24)|0;c[j>>2]=4880;c[b+32>>2]=d;hj(h,g);g=jj(h,13400)|0;d=g;ij(h);c[b+36>>2]=d;c[b+40>>2]=e;a[b+44|0]=(Ec[c[(c[g>>2]|0)+28>>2]&127](d)|0)&1;i=f;return}function sl(a){a=a|0;var b=0,d=0,e=0;b=a+4|0;e=c[b+4>>2]|0;d=(c[a>>2]|0)+(e>>1)|0;a=d;b=c[b>>2]|0;if((e&1|0)==0){e=b;Ac[e&255](a);return}else{e=c[(c[d>>2]|0)+b>>2]|0;Ac[e&255](a);return}}function tl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+104|0;u=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[u>>2];u=(f-e|0)/12|0;n=k|0;do{if(u>>>0>100>>>0){m=_m(u)|0;if((m|0)!=0){n=m;break}jn();n=0;m=0}else{m=0}}while(0);o=(e|0)==(f|0);if(o){t=0}else{t=0;p=n;q=e;while(1){r=a[q]|0;if((r&1)==0){r=(r&255)>>>1}else{r=c[q+4>>2]|0}if((r|0)==0){a[p]=2;t=t+1|0;u=u-1|0}else{a[p]=1}q=q+12|0;if((q|0)==(f|0)){break}else{p=p+1|0}}}b=b|0;d=d|0;p=g;q=0;a:while(1){r=c[b>>2]|0;do{if((r|0)==0){r=0}else{if((c[r+12>>2]|0)!=(c[r+16>>2]|0)){break}if((Ec[c[(c[r>>2]|0)+36>>2]&127](r)|0)==-1){c[b>>2]=0;r=0;break}else{r=c[b>>2]|0;break}}}while(0);w=(r|0)==0;s=c[d>>2]|0;do{if((s|0)==0){s=0}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){break}if(!((Ec[c[(c[s>>2]|0)+36>>2]&127](s)|0)==-1)){break}c[d>>2]=0;s=0}}while(0);r=(s|0)==0;v=c[b>>2]|0;if(!((w^r)&(u|0)!=0)){break}r=c[v+12>>2]|0;if((r|0)==(c[v+16>>2]|0)){s=(Ec[c[(c[v>>2]|0)+36>>2]&127](v)|0)&255}else{s=a[r]|0}if(!j){s=Nc[c[(c[p>>2]|0)+12>>2]&31](g,s)|0}r=q+1|0;if(o){q=r;continue}if(j){v=n;x=0;w=e;while(1){do{if((a[v]|0)==1){y=a[w]|0;z=(y&1)==0;if(z){A=w+1|0}else{A=c[w+8>>2]|0}if(!(s<<24>>24==(a[A+q|0]|0))){a[v]=0;u=u-1|0;break}if(z){x=(y&255)>>>1}else{x=c[w+4>>2]|0}if((x|0)!=(r|0)){x=1;break}a[v]=2;x=1;t=t+1|0;u=u-1|0}}while(0);w=w+12|0;if((w|0)==(f|0)){s=u;break}else{v=v+1|0}}}else{v=n;x=0;w=e;while(1){do{if((a[v]|0)==1){y=w;if((a[y]&1)==0){z=w+1|0}else{z=c[w+8>>2]|0}if(!(s<<24>>24==(Nc[c[(c[p>>2]|0)+12>>2]&31](g,a[z+q|0]|0)|0)<<24>>24)){a[v]=0;u=u-1|0;break}x=a[y]|0;if((x&1)==0){x=(x&255)>>>1}else{x=c[w+4>>2]|0}if((x|0)!=(r|0)){x=1;break}a[v]=2;x=1;t=t+1|0;u=u-1|0}}while(0);w=w+12|0;if((w|0)==(f|0)){s=u;break}else{v=v+1|0}}}if(!x){q=r;u=s;continue}v=c[b>>2]|0;u=v+12|0;q=c[u>>2]|0;if((q|0)==(c[v+16>>2]|0)){Ec[c[(c[v>>2]|0)+40>>2]&127](v)|0}else{c[u>>2]=q+1}if((s+t|0)>>>0<2>>>0){q=r;u=s;continue}else{q=n;u=e}while(1){do{if((a[q]|0)==2){v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[u+4>>2]|0}if((v|0)==(r|0)){break}a[q]=0;t=t-1|0}}while(0);u=u+12|0;if((u|0)==(f|0)){q=r;u=s;continue a}else{q=q+1|0}}}do{if((v|0)==0){v=0}else{if((c[v+12>>2]|0)!=(c[v+16>>2]|0)){break}if((Ec[c[(c[v>>2]|0)+36>>2]&127](v)|0)==-1){c[b>>2]=0;v=0;break}else{v=c[b>>2]|0;break}}}while(0);j=(v|0)==0;do{if(r){l=90}else{if((c[s+12>>2]|0)!=(c[s+16>>2]|0)){if(j){break}else{l=92;break}}if((Ec[c[(c[s>>2]|0)+36>>2]&127](s)|0)==-1){c[d>>2]=0;l=90;break}else{if(j){break}else{l=92;break}}}}while(0);if((l|0)==90){if(j){l=92}}if((l|0)==92){c[h>>2]=c[h>>2]|2}b:do{if(o){l=96}else{while(1){if((a[n]|0)==2){f=e;break b}e=e+12|0;if((e|0)==(f|0)){l=96;break}else{n=n+1|0}}}}while(0);if((l|0)==96){c[h>>2]=c[h>>2]|4}if((m|0)==0){i=k;return f|0}$m(m);i=k;return f|0}



function ul(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+232|0;E=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[E>>2];E=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[E>>2];E=l|0;s=l+32|0;m=l+40|0;d=l+56|0;r=l+72|0;n=c[g+4>>2]&74;if((n|0)==64){q=8}else if((n|0)==8){q=16}else if((n|0)==0){q=0}else{q=10}t=E|0;ug(m,g,t,s);w=d;zn(w|0,0,12)|0;pe(d,10,0);if((a[w]&1)==0){u=d+1|0;n=u;v=d+8|0}else{v=d+8|0;n=c[v>>2]|0;u=d+1|0}g=r|0;e=e|0;f=f|0;x=d|0;B=d+4|0;y=E+24|0;z=E+25|0;o=m;D=E+26|0;p=m+4|0;G=n;A=0;C=g;H=n;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if(!((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1)){break}c[e>>2]=0;n=0}}while(0);I=(n|0)==0;F=c[f>>2]|0;do{if((F|0)==0){k=21}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(I){break}else{break a}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=21;break}else{if(I){break}else{break a}}}}while(0);if((k|0)==21){k=0;if(I){F=0;break}else{F=0}}I=a[w]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[B>>2]|0}if((H-G|0)==(J|0)){if(K){G=(I&255)>>>1;H=(I&255)>>>1}else{H=c[B>>2]|0;G=H}pe(d,G<<1,0);if((a[w]&1)==0){G=10}else{G=(c[x>>2]&-2)-1|0}pe(d,G,0);if((a[w]&1)==0){I=u}else{I=c[v>>2]|0}G=I;H=I+H|0}I=c[n+12>>2]|0;if((I|0)==(c[n+16>>2]|0)){J=(Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)&255}else{J=a[I]|0}K=a[s]|0;I=(H|0)==(G|0);do{if(I){L=(a[y]|0)==J<<24>>24;if(!(L|(a[z]|0)==J<<24>>24)){k=47;break}a[H]=L?43:45;A=0;H=H+1|0}else{k=47}}while(0);b:do{if((k|0)==47){k=0;L=a[o]|0;if((L&1)==0){L=(L&255)>>>1}else{L=c[p>>2]|0}if((L|0)!=0&J<<24>>24==K<<24>>24){if((C-r|0)>=160){break}c[C>>2]=A;A=0;C=C+4|0;break}else{L=t}while(1){K=L+1|0;if((a[L]|0)==J<<24>>24){break}if((K|0)==(D|0)){L=D;break}else{L=K}}J=L-E|0;if((J|0)>23){break a}do{if((q|0)==8|(q|0)==10){if((J|0)>=(q|0)){break a}}else if((q|0)==16){if((J|0)<22){break}if(I){G=H;break a}if((H-G|0)>=3){break a}if((a[H-1|0]|0)!=48){break a}a[H]=a[1e4+J|0]|0;A=0;H=H+1|0;break b}}while(0);a[H]=a[1e4+J|0]|0;A=A+1|0;H=H+1|0}}while(0);n=c[e>>2]|0;F=n+12|0;I=c[F>>2]|0;if((I|0)==(c[n+16>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[F>>2]=I+1;continue}}s=a[o]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[p>>2]|0}do{if((s|0)!=0){if((C-r|0)>=160){break}c[C>>2]=A;C=C+4|0}}while(0);c[j>>2]=jm(G,H,h,q)|0;j=a[o]|0;if((j&1)==0){q=(j&255)>>>1}else{q=c[p>>2]|0}c:do{if((q|0)!=0){do{if((g|0)!=(C|0)){q=C-4|0;if(q>>>0>g>>>0){j=g}else{break}do{L=c[j>>2]|0;c[j>>2]=c[q>>2];c[q>>2]=L;j=j+4|0;q=q-4|0;}while(j>>>0<q>>>0);j=a[o]|0}}while(0);if((j&1)==0){j=(j&255)>>>1;p=m+1|0}else{j=c[p>>2]|0;p=c[m+8>>2]|0}o=C-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;d:do{if(o>>>0>g>>>0){j=p+j|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(j-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<o>>>0)){break d}}c[h>>2]=4;break c}}while(0);if(q){break}if(((c[o>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[e>>2]=0;n=0;break}else{n=c[e>>2]|0;break}}}while(0);g=(n|0)==0;do{if((F|0)==0){k=106}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=106;break}if(!(g^(F|0)==0)){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);do{if((k|0)==106){if(g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);c[h>>2]=c[h>>2]|2;K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}function vl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0;l=i;i=i+232|0;E=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[E>>2];E=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[E>>2];E=l|0;s=l+32|0;m=l+40|0;d=l+56|0;r=l+72|0;n=c[g+4>>2]&74;if((n|0)==8){q=16}else if((n|0)==0){q=0}else if((n|0)==64){q=8}else{q=10}t=E|0;ug(m,g,t,s);w=d;zn(w|0,0,12)|0;pe(d,10,0);if((a[w]&1)==0){u=d+1|0;n=u;v=d+8|0}else{v=d+8|0;n=c[v>>2]|0;u=d+1|0}g=r|0;e=e|0;f=f|0;x=d|0;B=d+4|0;y=E+24|0;z=E+25|0;o=m;D=E+26|0;p=m+4|0;G=n;A=0;C=g;H=n;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if(!((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1)){break}c[e>>2]=0;n=0}}while(0);I=(n|0)==0;F=c[f>>2]|0;do{if((F|0)==0){k=21}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(I){break}else{break a}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=21;break}else{if(I){break}else{break a}}}}while(0);if((k|0)==21){k=0;if(I){F=0;break}else{F=0}}I=a[w]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[B>>2]|0}if((H-G|0)==(J|0)){if(K){G=(I&255)>>>1;H=(I&255)>>>1}else{H=c[B>>2]|0;G=H}pe(d,G<<1,0);if((a[w]&1)==0){G=10}else{G=(c[x>>2]&-2)-1|0}pe(d,G,0);if((a[w]&1)==0){I=u}else{I=c[v>>2]|0}G=I;H=I+H|0}I=c[n+12>>2]|0;if((I|0)==(c[n+16>>2]|0)){J=(Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)&255}else{J=a[I]|0}K=a[s]|0;I=(H|0)==(G|0);do{if(I){M=(a[y]|0)==J<<24>>24;if(!(M|(a[z]|0)==J<<24>>24)){k=47;break}a[H]=M?43:45;A=0;H=H+1|0}else{k=47}}while(0);b:do{if((k|0)==47){k=0;M=a[o]|0;if((M&1)==0){M=(M&255)>>>1}else{M=c[p>>2]|0}if((M|0)!=0&J<<24>>24==K<<24>>24){if((C-r|0)>=160){break}c[C>>2]=A;A=0;C=C+4|0;break}else{M=t}while(1){K=M+1|0;if((a[M]|0)==J<<24>>24){break}if((K|0)==(D|0)){M=D;break}else{M=K}}J=M-E|0;if((J|0)>23){break a}do{if((q|0)==8|(q|0)==10){if((J|0)>=(q|0)){break a}}else if((q|0)==16){if((J|0)<22){break}if(I){G=H;break a}if((H-G|0)>=3){break a}if((a[H-1|0]|0)!=48){break a}a[H]=a[1e4+J|0]|0;A=0;H=H+1|0;break b}}while(0);a[H]=a[1e4+J|0]|0;A=A+1|0;H=H+1|0}}while(0);n=c[e>>2]|0;F=n+12|0;I=c[F>>2]|0;if((I|0)==(c[n+16>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[F>>2]=I+1;continue}}s=a[o]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[p>>2]|0}do{if((s|0)!=0){if((C-r|0)>=160){break}c[C>>2]=A;C=C+4|0}}while(0);M=km(G,H,h,q)|0;c[j>>2]=M;c[j+4>>2]=L;j=a[o]|0;if((j&1)==0){q=(j&255)>>>1}else{q=c[p>>2]|0}c:do{if((q|0)!=0){do{if((g|0)!=(C|0)){q=C-4|0;if(q>>>0>g>>>0){j=g}else{break}do{M=c[j>>2]|0;c[j>>2]=c[q>>2];c[q>>2]=M;j=j+4|0;q=q-4|0;}while(j>>>0<q>>>0);j=a[o]|0}}while(0);if((j&1)==0){j=(j&255)>>>1;p=m+1|0}else{j=c[p>>2]|0;p=c[m+8>>2]|0}o=C-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;d:do{if(o>>>0>g>>>0){j=p+j|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(j-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<o>>>0)){break d}}c[h>>2]=4;break c}}while(0);if(q){break}if(((c[o>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[e>>2]=0;n=0;break}else{n=c[e>>2]|0;break}}}while(0);g=(n|0)==0;do{if((F|0)==0){k=106}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!g){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=106;break}if(!(g^(F|0)==0)){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}}while(0);do{if((k|0)==106){if(g){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}}while(0);c[h>>2]=c[h>>2]|2;K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}function wl(d,e,f,g,h,j,k){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;m=i;i=i+232|0;F=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[F>>2];F=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[F>>2];F=m|0;t=m+32|0;n=m+40|0;e=m+56|0;s=m+72|0;o=c[h+4>>2]&74;if((o|0)==8){r=16}else if((o|0)==0){r=0}else if((o|0)==64){r=8}else{r=10}u=F|0;ug(n,h,u,t);x=e;zn(x|0,0,12)|0;pe(e,10,0);if((a[x]&1)==0){v=e+1|0;o=v;w=e+8|0}else{w=e+8|0;o=c[w>>2]|0;v=e+1|0}h=s|0;f=f|0;g=g|0;y=e|0;C=e+4|0;z=F+24|0;A=F+25|0;p=n;E=F+26|0;q=n+4|0;H=o;B=0;D=h;I=o;o=c[f>>2]|0;a:while(1){do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if(!((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1)){break}c[f>>2]=0;o=0}}while(0);J=(o|0)==0;G=c[g>>2]|0;do{if((G|0)==0){l=21}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(J){break}else{break a}}if((Ec[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[g>>2]=0;l=21;break}else{if(J){break}else{break a}}}}while(0);if((l|0)==21){l=0;if(J){G=0;break}else{G=0}}J=a[x]|0;L=(J&1)==0;if(L){K=(J&255)>>>1}else{K=c[C>>2]|0}if((I-H|0)==(K|0)){if(L){H=(J&255)>>>1;I=(J&255)>>>1}else{I=c[C>>2]|0;H=I}pe(e,H<<1,0);if((a[x]&1)==0){H=10}else{H=(c[y>>2]&-2)-1|0}pe(e,H,0);if((a[x]&1)==0){J=v}else{J=c[w>>2]|0}H=J;I=J+I|0}J=c[o+12>>2]|0;if((J|0)==(c[o+16>>2]|0)){K=(Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)&255}else{K=a[J]|0}L=a[t]|0;J=(I|0)==(H|0);do{if(J){M=(a[z]|0)==K<<24>>24;if(!(M|(a[A]|0)==K<<24>>24)){l=47;break}a[I]=M?43:45;B=0;I=I+1|0}else{l=47}}while(0);b:do{if((l|0)==47){l=0;M=a[p]|0;if((M&1)==0){M=(M&255)>>>1}else{M=c[q>>2]|0}if((M|0)!=0&K<<24>>24==L<<24>>24){if((D-s|0)>=160){break}c[D>>2]=B;B=0;D=D+4|0;break}else{M=u}while(1){L=M+1|0;if((a[M]|0)==K<<24>>24){break}if((L|0)==(E|0)){M=E;break}else{M=L}}K=M-F|0;if((K|0)>23){break a}do{if((r|0)==8|(r|0)==10){if((K|0)>=(r|0)){break a}}else if((r|0)==16){if((K|0)<22){break}if(J){H=I;break a}if((I-H|0)>=3){break a}if((a[I-1|0]|0)!=48){break a}a[I]=a[1e4+K|0]|0;B=0;I=I+1|0;break b}}while(0);a[I]=a[1e4+K|0]|0;B=B+1|0;I=I+1|0}}while(0);o=c[f>>2]|0;G=o+12|0;J=c[G>>2]|0;if((J|0)==(c[o+16>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[G>>2]=J+1;continue}}t=a[p]|0;if((t&1)==0){t=(t&255)>>>1}else{t=c[q>>2]|0}do{if((t|0)!=0){if((D-s|0)>=160){break}c[D>>2]=B;D=D+4|0}}while(0);b[k>>1]=lm(H,I,j,r)|0;k=a[p]|0;if((k&1)==0){r=(k&255)>>>1}else{r=c[q>>2]|0}c:do{if((r|0)!=0){do{if((h|0)!=(D|0)){r=D-4|0;if(r>>>0>h>>>0){k=h}else{break}do{M=c[k>>2]|0;c[k>>2]=c[r>>2];c[r>>2]=M;k=k+4|0;r=r-4|0;}while(k>>>0<r>>>0);k=a[p]|0}}while(0);if((k&1)==0){k=(k&255)>>>1;q=n+1|0}else{k=c[q>>2]|0;q=c[n+8>>2]|0}p=D-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;d:do{if(p>>>0>h>>>0){k=q+k|0;while(1){if(!r){if((s<<24>>24|0)!=(c[h>>2]|0)){break}}q=(k-q|0)>1?q+1|0:q;h=h+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(h>>>0<p>>>0)){break d}}c[j>>2]=4;break c}}while(0);if(r){break}if(((c[p>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[f>>2]=0;o=0;break}else{o=c[f>>2]|0;break}}}while(0);h=(o|0)==0;do{if((G|0)==0){l=106}else{if((c[G+12>>2]|0)!=(c[G+16>>2]|0)){if(!h){break}L=c[f>>2]|0;M=d|0;c[M>>2]=L;me(e);me(n);i=m;return}if((Ec[c[(c[G>>2]|0)+36>>2]&127](G)|0)==-1){c[g>>2]=0;l=106;break}if(!(h^(G|0)==0)){break}L=c[f>>2]|0;M=d|0;c[M>>2]=L;me(e);me(n);i=m;return}}while(0);do{if((l|0)==106){if(h){break}L=c[f>>2]|0;M=d|0;c[M>>2]=L;me(e);me(n);i=m;return}}while(0);c[j>>2]=c[j>>2]|2;L=c[f>>2]|0;M=d|0;c[M>>2]=L;me(e);me(n);i=m;return}function xl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+232|0;E=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[E>>2];E=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[E>>2];E=l|0;s=l+32|0;m=l+40|0;d=l+56|0;r=l+72|0;n=c[g+4>>2]&74;if((n|0)==8){q=16}else if((n|0)==0){q=0}else if((n|0)==64){q=8}else{q=10}t=E|0;ug(m,g,t,s);w=d;zn(w|0,0,12)|0;pe(d,10,0);if((a[w]&1)==0){u=d+1|0;n=u;v=d+8|0}else{v=d+8|0;n=c[v>>2]|0;u=d+1|0}g=r|0;e=e|0;f=f|0;x=d|0;B=d+4|0;y=E+24|0;z=E+25|0;o=m;D=E+26|0;p=m+4|0;G=n;A=0;C=g;H=n;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if(!((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1)){break}c[e>>2]=0;n=0}}while(0);I=(n|0)==0;F=c[f>>2]|0;do{if((F|0)==0){k=21}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(I){break}else{break a}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=21;break}else{if(I){break}else{break a}}}}while(0);if((k|0)==21){k=0;if(I){F=0;break}else{F=0}}I=a[w]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[B>>2]|0}if((H-G|0)==(J|0)){if(K){G=(I&255)>>>1;H=(I&255)>>>1}else{H=c[B>>2]|0;G=H}pe(d,G<<1,0);if((a[w]&1)==0){G=10}else{G=(c[x>>2]&-2)-1|0}pe(d,G,0);if((a[w]&1)==0){I=u}else{I=c[v>>2]|0}G=I;H=I+H|0}I=c[n+12>>2]|0;if((I|0)==(c[n+16>>2]|0)){J=(Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)&255}else{J=a[I]|0}K=a[s]|0;I=(H|0)==(G|0);do{if(I){L=(a[y]|0)==J<<24>>24;if(!(L|(a[z]|0)==J<<24>>24)){k=47;break}a[H]=L?43:45;A=0;H=H+1|0}else{k=47}}while(0);b:do{if((k|0)==47){k=0;L=a[o]|0;if((L&1)==0){L=(L&255)>>>1}else{L=c[p>>2]|0}if((L|0)!=0&J<<24>>24==K<<24>>24){if((C-r|0)>=160){break}c[C>>2]=A;A=0;C=C+4|0;break}else{L=t}while(1){K=L+1|0;if((a[L]|0)==J<<24>>24){break}if((K|0)==(D|0)){L=D;break}else{L=K}}J=L-E|0;if((J|0)>23){break a}do{if((q|0)==8|(q|0)==10){if((J|0)>=(q|0)){break a}}else if((q|0)==16){if((J|0)<22){break}if(I){G=H;break a}if((H-G|0)>=3){break a}if((a[H-1|0]|0)!=48){break a}a[H]=a[1e4+J|0]|0;A=0;H=H+1|0;break b}}while(0);a[H]=a[1e4+J|0]|0;A=A+1|0;H=H+1|0}}while(0);n=c[e>>2]|0;F=n+12|0;I=c[F>>2]|0;if((I|0)==(c[n+16>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[F>>2]=I+1;continue}}s=a[o]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[p>>2]|0}do{if((s|0)!=0){if((C-r|0)>=160){break}c[C>>2]=A;C=C+4|0}}while(0);c[j>>2]=mm(G,H,h,q)|0;j=a[o]|0;if((j&1)==0){q=(j&255)>>>1}else{q=c[p>>2]|0}c:do{if((q|0)!=0){do{if((g|0)!=(C|0)){q=C-4|0;if(q>>>0>g>>>0){j=g}else{break}do{L=c[j>>2]|0;c[j>>2]=c[q>>2];c[q>>2]=L;j=j+4|0;q=q-4|0;}while(j>>>0<q>>>0);j=a[o]|0}}while(0);if((j&1)==0){j=(j&255)>>>1;p=m+1|0}else{j=c[p>>2]|0;p=c[m+8>>2]|0}o=C-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;d:do{if(o>>>0>g>>>0){j=p+j|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(j-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<o>>>0)){break d}}c[h>>2]=4;break c}}while(0);if(q){break}if(((c[o>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[e>>2]=0;n=0;break}else{n=c[e>>2]|0;break}}}while(0);g=(n|0)==0;do{if((F|0)==0){k=106}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=106;break}if(!(g^(F|0)==0)){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);do{if((k|0)==106){if(g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);c[h>>2]=c[h>>2]|2;K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}function yl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;l=i;i=i+232|0;E=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[E>>2];E=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[E>>2];E=l|0;s=l+32|0;m=l+40|0;d=l+56|0;r=l+72|0;n=c[g+4>>2]&74;if((n|0)==64){q=8}else if((n|0)==8){q=16}else if((n|0)==0){q=0}else{q=10}t=E|0;ug(m,g,t,s);w=d;zn(w|0,0,12)|0;pe(d,10,0);if((a[w]&1)==0){u=d+1|0;n=u;v=d+8|0}else{v=d+8|0;n=c[v>>2]|0;u=d+1|0}g=r|0;e=e|0;f=f|0;x=d|0;B=d+4|0;y=E+24|0;z=E+25|0;o=m;D=E+26|0;p=m+4|0;G=n;A=0;C=g;H=n;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if(!((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1)){break}c[e>>2]=0;n=0}}while(0);I=(n|0)==0;F=c[f>>2]|0;do{if((F|0)==0){k=21}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(I){break}else{break a}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=21;break}else{if(I){break}else{break a}}}}while(0);if((k|0)==21){k=0;if(I){F=0;break}else{F=0}}I=a[w]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[B>>2]|0}if((H-G|0)==(J|0)){if(K){G=(I&255)>>>1;H=(I&255)>>>1}else{H=c[B>>2]|0;G=H}pe(d,G<<1,0);if((a[w]&1)==0){G=10}else{G=(c[x>>2]&-2)-1|0}pe(d,G,0);if((a[w]&1)==0){I=u}else{I=c[v>>2]|0}G=I;H=I+H|0}I=c[n+12>>2]|0;if((I|0)==(c[n+16>>2]|0)){J=(Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)&255}else{J=a[I]|0}K=a[s]|0;I=(H|0)==(G|0);do{if(I){L=(a[y]|0)==J<<24>>24;if(!(L|(a[z]|0)==J<<24>>24)){k=47;break}a[H]=L?43:45;A=0;H=H+1|0}else{k=47}}while(0);b:do{if((k|0)==47){k=0;L=a[o]|0;if((L&1)==0){L=(L&255)>>>1}else{L=c[p>>2]|0}if((L|0)!=0&J<<24>>24==K<<24>>24){if((C-r|0)>=160){break}c[C>>2]=A;A=0;C=C+4|0;break}else{L=t}while(1){K=L+1|0;if((a[L]|0)==J<<24>>24){break}if((K|0)==(D|0)){L=D;break}else{L=K}}J=L-E|0;if((J|0)>23){break a}do{if((q|0)==8|(q|0)==10){if((J|0)>=(q|0)){break a}}else if((q|0)==16){if((J|0)<22){break}if(I){G=H;break a}if((H-G|0)>=3){break a}if((a[H-1|0]|0)!=48){break a}a[H]=a[1e4+J|0]|0;A=0;H=H+1|0;break b}}while(0);a[H]=a[1e4+J|0]|0;A=A+1|0;H=H+1|0}}while(0);n=c[e>>2]|0;F=n+12|0;I=c[F>>2]|0;if((I|0)==(c[n+16>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[F>>2]=I+1;continue}}s=a[o]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[p>>2]|0}do{if((s|0)!=0){if((C-r|0)>=160){break}c[C>>2]=A;C=C+4|0}}while(0);c[j>>2]=nm(G,H,h,q)|0;j=a[o]|0;if((j&1)==0){q=(j&255)>>>1}else{q=c[p>>2]|0}c:do{if((q|0)!=0){do{if((g|0)!=(C|0)){q=C-4|0;if(q>>>0>g>>>0){j=g}else{break}do{L=c[j>>2]|0;c[j>>2]=c[q>>2];c[q>>2]=L;j=j+4|0;q=q-4|0;}while(j>>>0<q>>>0);j=a[o]|0}}while(0);if((j&1)==0){j=(j&255)>>>1;p=m+1|0}else{j=c[p>>2]|0;p=c[m+8>>2]|0}o=C-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;d:do{if(o>>>0>g>>>0){j=p+j|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(j-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<o>>>0)){break d}}c[h>>2]=4;break c}}while(0);if(q){break}if(((c[o>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[e>>2]=0;n=0;break}else{n=c[e>>2]|0;break}}}while(0);g=(n|0)==0;do{if((F|0)==0){k=106}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=106;break}if(!(g^(F|0)==0)){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);do{if((k|0)==106){if(g){break}K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}}while(0);c[h>>2]=c[h>>2]|2;K=c[e>>2]|0;L=b|0;c[L>>2]=K;me(d);me(m);i=l;return}function zl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,M=0;l=i;i=i+232|0;E=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[E>>2];E=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[E>>2];E=l|0;s=l+32|0;m=l+40|0;d=l+56|0;r=l+72|0;n=c[g+4>>2]&74;if((n|0)==8){q=16}else if((n|0)==0){q=0}else if((n|0)==64){q=8}else{q=10}t=E|0;ug(m,g,t,s);w=d;zn(w|0,0,12)|0;pe(d,10,0);if((a[w]&1)==0){u=d+1|0;n=u;v=d+8|0}else{v=d+8|0;n=c[v>>2]|0;u=d+1|0}g=r|0;e=e|0;f=f|0;x=d|0;B=d+4|0;y=E+24|0;z=E+25|0;o=m;D=E+26|0;p=m+4|0;G=n;A=0;C=g;H=n;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if(!((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1)){break}c[e>>2]=0;n=0}}while(0);I=(n|0)==0;F=c[f>>2]|0;do{if((F|0)==0){k=21}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(I){break}else{break a}}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=21;break}else{if(I){break}else{break a}}}}while(0);if((k|0)==21){k=0;if(I){F=0;break}else{F=0}}I=a[w]|0;K=(I&1)==0;if(K){J=(I&255)>>>1}else{J=c[B>>2]|0}if((H-G|0)==(J|0)){if(K){G=(I&255)>>>1;H=(I&255)>>>1}else{H=c[B>>2]|0;G=H}pe(d,G<<1,0);if((a[w]&1)==0){G=10}else{G=(c[x>>2]&-2)-1|0}pe(d,G,0);if((a[w]&1)==0){I=u}else{I=c[v>>2]|0}G=I;H=I+H|0}I=c[n+12>>2]|0;if((I|0)==(c[n+16>>2]|0)){J=(Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)&255}else{J=a[I]|0}K=a[s]|0;I=(H|0)==(G|0);do{if(I){M=(a[y]|0)==J<<24>>24;if(!(M|(a[z]|0)==J<<24>>24)){k=47;break}a[H]=M?43:45;A=0;H=H+1|0}else{k=47}}while(0);b:do{if((k|0)==47){k=0;M=a[o]|0;if((M&1)==0){M=(M&255)>>>1}else{M=c[p>>2]|0}if((M|0)!=0&J<<24>>24==K<<24>>24){if((C-r|0)>=160){break}c[C>>2]=A;A=0;C=C+4|0;break}else{M=t}while(1){K=M+1|0;if((a[M]|0)==J<<24>>24){break}if((K|0)==(D|0)){M=D;break}else{M=K}}J=M-E|0;if((J|0)>23){break a}do{if((q|0)==8|(q|0)==10){if((J|0)>=(q|0)){break a}}else if((q|0)==16){if((J|0)<22){break}if(I){G=H;break a}if((H-G|0)>=3){break a}if((a[H-1|0]|0)!=48){break a}a[H]=a[1e4+J|0]|0;A=0;H=H+1|0;break b}}while(0);a[H]=a[1e4+J|0]|0;A=A+1|0;H=H+1|0}}while(0);n=c[e>>2]|0;F=n+12|0;I=c[F>>2]|0;if((I|0)==(c[n+16>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[F>>2]=I+1;continue}}s=a[o]|0;if((s&1)==0){s=(s&255)>>>1}else{s=c[p>>2]|0}do{if((s|0)!=0){if((C-r|0)>=160){break}c[C>>2]=A;C=C+4|0}}while(0);M=om(G,H,h,q)|0;c[j>>2]=M;c[j+4>>2]=L;j=a[o]|0;if((j&1)==0){q=(j&255)>>>1}else{q=c[p>>2]|0}c:do{if((q|0)!=0){do{if((g|0)!=(C|0)){q=C-4|0;if(q>>>0>g>>>0){j=g}else{break}do{M=c[j>>2]|0;c[j>>2]=c[q>>2];c[q>>2]=M;j=j+4|0;q=q-4|0;}while(j>>>0<q>>>0);j=a[o]|0}}while(0);if((j&1)==0){j=(j&255)>>>1;p=m+1|0}else{j=c[p>>2]|0;p=c[m+8>>2]|0}o=C-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;d:do{if(o>>>0>g>>>0){j=p+j|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(j-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<o>>>0)){break d}}c[h>>2]=4;break c}}while(0);if(q){break}if(((c[o>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=0}else{if((c[n+12>>2]|0)!=(c[n+16>>2]|0)){break}if((Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0)==-1){c[e>>2]=0;n=0;break}else{n=c[e>>2]|0;break}}}while(0);g=(n|0)==0;do{if((F|0)==0){k=106}else{if((c[F+12>>2]|0)!=(c[F+16>>2]|0)){if(!g){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}if((Ec[c[(c[F>>2]|0)+36>>2]&127](F)|0)==-1){c[f>>2]=0;k=106;break}if(!(g^(F|0)==0)){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}}while(0);do{if((k|0)==106){if(g){break}K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}}while(0);c[h>>2]=c[h>>2]|2;K=c[e>>2]|0;M=b|0;c[M>>2]=K;me(d);me(m);i=l;return}function Al(b,d,e,f,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+280|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+32|0;o=n+40|0;d=n+48|0;m=n+64|0;s=n+80|0;r=n+88|0;p=n+248|0;q=n+256|0;t=n+264|0;v=n+272|0;u=n|0;vg(d,h,u,B,o);w=m;zn(w|0,0,12)|0;pe(m,10,0);if((a[w]&1)==0){y=m+1|0;E=y;x=m+8|0}else{x=m+8|0;E=c[x>>2]|0;y=m+1|0}c[s>>2]=E;h=r|0;c[p>>2]=h;c[q>>2]=0;a[t]=1;a[v]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=a[B]|0;C=a[o]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if(!((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1)){break}c[e>>2]=0;o=0}}while(0);F=(o|0)==0;D=c[f>>2]|0;do{if((D|0)==0){l=17}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(F){break}else{u=D;break a}}if((Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;l=17;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==17){l=0;if(F){u=0;break}else{D=0}}F=a[w]|0;G=(F&1)==0;if(G){H=(F&255)>>>1}else{H=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(H|0)){if(G){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[w]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[w]&1)==0){E=y}else{E=c[x>>2]|0}c[s>>2]=E+F}F=o+12|0;H=c[F>>2]|0;G=o+16|0;if((H|0)==(c[G>>2]|0)){H=(Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)&255}else{H=a[H]|0}if((wg(H,t,v,E,s,B,C,d,h,p,q,u)|0)!=0){u=D;break}D=c[F>>2]|0;if((D|0)==(c[G>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[F>>2]=D+1;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[p>>2]|0;if((t-r|0)>=160){break}H=c[q>>2]|0;c[p>>2]=t+4;c[t>>2]=H}}while(0);g[k>>2]=+pm(E,c[s>>2]|0,j);k=c[p>>2]|0;q=a[v]|0;if((q&1)==0){p=(q&255)>>>1}else{p=c[d+4>>2]|0}b:do{if((p|0)!=0){do{if((h|0)!=(k|0)){p=k-4|0;if(p>>>0>h>>>0){q=h}else{break}do{H=c[q>>2]|0;c[q>>2]=c[p>>2];c[p>>2]=H;q=q+4|0;p=p-4|0;}while(q>>>0<p>>>0);q=a[v]|0}}while(0);if((q&1)==0){p=(q&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>h>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[h>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;h=h+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(h>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[e>>2]=0;o=0;break}else{o=c[e>>2]|0;break}}}while(0);o=(o|0)==0;do{if((u|0)==0){l=83}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}if((Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0)==-1){c[f>>2]=0;l=83;break}if(!(o^(u|0)==0)){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==83){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Bl(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+280|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+32|0;o=n+40|0;d=n+48|0;m=n+64|0;s=n+80|0;r=n+88|0;p=n+248|0;q=n+256|0;t=n+264|0;v=n+272|0;u=n|0;vg(d,g,u,B,o);w=m;zn(w|0,0,12)|0;pe(m,10,0);if((a[w]&1)==0){y=m+1|0;E=y;x=m+8|0}else{x=m+8|0;E=c[x>>2]|0;y=m+1|0}c[s>>2]=E;g=r|0;c[p>>2]=g;c[q>>2]=0;a[t]=1;a[v]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=a[B]|0;C=a[o]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if(!((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1)){break}c[e>>2]=0;o=0}}while(0);F=(o|0)==0;D=c[f>>2]|0;do{if((D|0)==0){l=17}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(F){break}else{u=D;break a}}if((Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;l=17;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==17){l=0;if(F){u=0;break}else{D=0}}F=a[w]|0;G=(F&1)==0;if(G){H=(F&255)>>>1}else{H=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(H|0)){if(G){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[w]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[w]&1)==0){E=y}else{E=c[x>>2]|0}c[s>>2]=E+F}F=o+12|0;H=c[F>>2]|0;G=o+16|0;if((H|0)==(c[G>>2]|0)){H=(Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)&255}else{H=a[H]|0}if((wg(H,t,v,E,s,B,C,d,g,p,q,u)|0)!=0){u=D;break}D=c[F>>2]|0;if((D|0)==(c[G>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[F>>2]=D+1;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[p>>2]|0;if((t-r|0)>=160){break}H=c[q>>2]|0;c[p>>2]=t+4;c[t>>2]=H}}while(0);h[k>>3]=+qm(E,c[s>>2]|0,j);k=c[p>>2]|0;q=a[v]|0;if((q&1)==0){p=(q&255)>>>1}else{p=c[d+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(k|0)){p=k-4|0;if(p>>>0>g>>>0){q=g}else{break}do{H=c[q>>2]|0;c[q>>2]=c[p>>2];c[p>>2]=H;q=q+4|0;p=p-4|0;}while(q>>>0<p>>>0);q=a[v]|0}}while(0);if((q&1)==0){p=(q&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>g>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[g>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;g=g+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(g>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[e>>2]=0;o=0;break}else{o=c[e>>2]|0;break}}}while(0);o=(o|0)==0;do{if((u|0)==0){l=83}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}if((Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0)==-1){c[f>>2]=0;l=83;break}if(!(o^(u|0)==0)){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==83){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Cl(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+280|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+32|0;o=n+40|0;d=n+48|0;m=n+64|0;s=n+80|0;r=n+88|0;p=n+248|0;q=n+256|0;t=n+264|0;v=n+272|0;u=n|0;vg(d,g,u,B,o);w=m;zn(w|0,0,12)|0;pe(m,10,0);if((a[w]&1)==0){y=m+1|0;E=y;x=m+8|0}else{x=m+8|0;E=c[x>>2]|0;y=m+1|0}c[s>>2]=E;g=r|0;c[p>>2]=g;c[q>>2]=0;a[t]=1;a[v]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=a[B]|0;C=a[o]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if(!((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1)){break}c[e>>2]=0;o=0}}while(0);F=(o|0)==0;D=c[f>>2]|0;do{if((D|0)==0){l=17}else{if((c[D+12>>2]|0)!=(c[D+16>>2]|0)){if(F){break}else{u=D;break a}}if((Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0)==-1){c[f>>2]=0;l=17;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==17){l=0;if(F){u=0;break}else{D=0}}F=a[w]|0;G=(F&1)==0;if(G){H=(F&255)>>>1}else{H=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(H|0)){if(G){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[w]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[w]&1)==0){E=y}else{E=c[x>>2]|0}c[s>>2]=E+F}F=o+12|0;H=c[F>>2]|0;G=o+16|0;if((H|0)==(c[G>>2]|0)){H=(Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)&255}else{H=a[H]|0}if((wg(H,t,v,E,s,B,C,d,g,p,q,u)|0)!=0){u=D;break}D=c[F>>2]|0;if((D|0)==(c[G>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[F>>2]=D+1;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[p>>2]|0;if((t-r|0)>=160){break}H=c[q>>2]|0;c[p>>2]=t+4;c[t>>2]=H}}while(0);h[k>>3]=+rm(E,c[s>>2]|0,j);k=c[p>>2]|0;q=a[v]|0;if((q&1)==0){p=(q&255)>>>1}else{p=c[d+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(k|0)){p=k-4|0;if(p>>>0>g>>>0){q=g}else{break}do{H=c[q>>2]|0;c[q>>2]=c[p>>2];c[p>>2]=H;q=q+4|0;p=p-4|0;}while(q>>>0<p>>>0);q=a[v]|0}}while(0);if((q&1)==0){p=(q&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>g>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[g>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;g=g+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(g>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1){c[e>>2]=0;o=0;break}else{o=c[e>>2]|0;break}}}while(0);o=(o|0)==0;do{if((u|0)==0){l=83}else{if((c[u+12>>2]|0)!=(c[u+16>>2]|0)){if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}if((Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0)==-1){c[f>>2]=0;l=83;break}if(!(o^(u|0)==0)){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==83){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Dl(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;b=ac(b|0)|0;d=ab(a|0,d|0,g|0)|0;if((b|0)==0){i=f;return d|0}ac(b|0)|0;i=f;return d|0}function El(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;k=i;i=i+104|0;u=d;d=i;i=i+4|0;i=i+7&-8;c[d>>2]=c[u>>2];u=(f-e|0)/12|0;n=k|0;do{if(u>>>0>100>>>0){m=_m(u)|0;if((m|0)!=0){n=m;break}jn();n=0;m=0}else{m=0}}while(0);o=(e|0)==(f|0);if(o){t=0}else{t=0;p=n;q=e;while(1){r=a[q]|0;if((r&1)==0){r=(r&255)>>>1}else{r=c[q+4>>2]|0}if((r|0)==0){a[p]=2;t=t+1|0;u=u-1|0}else{a[p]=1}q=q+12|0;if((q|0)==(f|0)){break}else{p=p+1|0}}}b=b|0;d=d|0;p=g;q=0;a:while(1){r=c[b>>2]|0;do{if((r|0)==0){s=1}else{s=c[r+12>>2]|0;if((s|0)==(c[r+16>>2]|0)){r=Ec[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{r=c[s>>2]|0}if((r|0)==-1){c[b>>2]=0;s=1;break}else{s=(c[b>>2]|0)==0;break}}}while(0);r=c[d>>2]|0;do{if((r|0)==0){w=1;r=0}else{v=c[r+12>>2]|0;if((v|0)==(c[r+16>>2]|0)){v=Ec[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{v=c[v>>2]|0}if(!((v|0)==-1)){w=0;break}c[d>>2]=0;w=1;r=0}}while(0);v=c[b>>2]|0;if(!((s^w)&(u|0)!=0)){break}r=c[v+12>>2]|0;if((r|0)==(c[v+16>>2]|0)){s=Ec[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{s=c[r>>2]|0}if(!j){s=Nc[c[(c[p>>2]|0)+28>>2]&31](g,s)|0}r=q+1|0;if(o){q=r;continue}if(j){v=n;x=0;w=e;while(1){do{if((a[v]|0)==1){y=a[w]|0;A=(y&1)==0;if(A){z=w+4|0}else{z=c[w+8>>2]|0}if((s|0)!=(c[z+(q<<2)>>2]|0)){a[v]=0;u=u-1|0;break}if(A){x=(y&255)>>>1}else{x=c[w+4>>2]|0}if((x|0)!=(r|0)){x=1;break}a[v]=2;x=1;t=t+1|0;u=u-1|0}}while(0);w=w+12|0;if((w|0)==(f|0)){s=u;break}else{v=v+1|0}}}else{v=n;x=0;w=e;while(1){do{if((a[v]|0)==1){y=w;if((a[y]&1)==0){z=w+4|0}else{z=c[w+8>>2]|0}if((s|0)!=(Nc[c[(c[p>>2]|0)+28>>2]&31](g,c[z+(q<<2)>>2]|0)|0)){a[v]=0;u=u-1|0;break}x=a[y]|0;if((x&1)==0){x=(x&255)>>>1}else{x=c[w+4>>2]|0}if((x|0)!=(r|0)){x=1;break}a[v]=2;x=1;t=t+1|0;u=u-1|0}}while(0);w=w+12|0;if((w|0)==(f|0)){s=u;break}else{v=v+1|0}}}if(!x){q=r;u=s;continue}v=c[b>>2]|0;u=v+12|0;q=c[u>>2]|0;if((q|0)==(c[v+16>>2]|0)){Ec[c[(c[v>>2]|0)+40>>2]&127](v)|0}else{c[u>>2]=q+4}if((s+t|0)>>>0<2>>>0){q=r;u=s;continue}else{q=n;u=e}while(1){do{if((a[q]|0)==2){v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[u+4>>2]|0}if((v|0)==(r|0)){break}a[q]=0;t=t-1|0}}while(0);u=u+12|0;if((u|0)==(f|0)){q=r;u=s;continue a}else{q=q+1|0}}}do{if((v|0)==0){j=1}else{j=c[v+12>>2]|0;if((j|0)==(c[v+16>>2]|0)){j=Ec[c[(c[v>>2]|0)+36>>2]&127](v)|0}else{j=c[j>>2]|0}if((j|0)==-1){c[b>>2]=0;j=1;break}else{j=(c[b>>2]|0)==0;break}}}while(0);do{if((r|0)==0){l=92}else{g=c[r+12>>2]|0;if((g|0)==(c[r+16>>2]|0)){g=Ec[c[(c[r>>2]|0)+36>>2]&127](r)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[d>>2]=0;l=92;break}else{if(j){break}else{l=94;break}}}}while(0);if((l|0)==92){if(j){l=94}}if((l|0)==94){c[h>>2]=c[h>>2]|2}b:do{if(o){l=98}else{while(1){if((a[n]|0)==2){f=e;break b}e=e+12|0;if((e|0)==(f|0)){l=98;break}else{n=n+1|0}}}}while(0);if((l|0)==98){c[h>>2]=c[h>>2]|4}if((m|0)==0){i=k;return f|0}$m(m);i=k;return f|0}function Fl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+328|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[t>>2];t=d|0;n=d+104|0;m=d+112|0;l=d+128|0;o=d+144|0;p=d+152|0;q=d+312|0;r=d+320|0;s=c[g+4>>2]&74;if((s|0)==0){s=0}else if((s|0)==8){s=16}else if((s|0)==64){s=8}else{s=10}t=t|0;xg(m,g,t,n);w=l;zn(w|0,0,12)|0;pe(l,10,0);if((a[w]&1)==0){u=l+1|0;B=u;v=l+8|0}else{v=l+8|0;B=c[v>>2]|0;u=l+1|0}c[o>>2]=B;g=p|0;c[q>>2]=g;c[r>>2]=0;e=e|0;f=f|0;y=l|0;x=l+4|0;z=c[n>>2]|0;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){C=1;n=0}else{A=c[n+12>>2]|0;if((A|0)==(c[n+16>>2]|0)){A=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{A=c[A>>2]|0}if(!((A|0)==-1)){C=0;break}c[e>>2]=0;C=1;n=0}}while(0);A=c[f>>2]|0;do{if((A|0)==0){k=22}else{D=c[A+12>>2]|0;if((D|0)==(c[A+16>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[f>>2]=0;k=22;break}else{if(C){break}else{t=A;break a}}}}while(0);if((k|0)==22){k=0;if(C){t=0;break}else{A=0}}C=a[w]|0;E=(C&1)==0;if(E){D=(C&255)>>>1}else{D=c[x>>2]|0}if(((c[o>>2]|0)-B|0)==(D|0)){if(E){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[x>>2]|0;B=C}pe(l,B<<1,0);if((a[w]&1)==0){B=10}else{B=(c[y>>2]&-2)-1|0}pe(l,B,0);if((a[w]&1)==0){B=u}else{B=c[v>>2]|0}c[o>>2]=B+C}D=n+12|0;E=c[D>>2]|0;C=n+16|0;if((E|0)==(c[C>>2]|0)){E=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{E=c[E>>2]|0}if((tg(E,s,B,o,r,z,m,g,q,t)|0)!=0){t=A;break}A=c[D>>2]|0;if((A|0)==(c[C>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[D>>2]=A+4;continue}}u=m;v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[m+4>>2]|0}do{if((v|0)!=0){v=c[q>>2]|0;if((v-p|0)>=160){break}E=c[r>>2]|0;c[q>>2]=v+4;c[v>>2]=E}}while(0);c[j>>2]=jm(B,c[o>>2]|0,h,s)|0;j=c[q>>2]|0;o=a[u]|0;if((o&1)==0){p=(o&255)>>>1}else{p=c[m+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(j|0)){p=j-4|0;if(p>>>0>g>>>0){o=g}else{break}do{E=c[o>>2]|0;c[o>>2]=c[p>>2];c[p>>2]=E;o=o+4|0;p=p-4|0;}while(o>>>0<p>>>0);o=a[u]|0}}while(0);if((o&1)==0){o=(o&255)>>>1;p=m+1|0}else{o=c[m+4>>2]|0;p=c[m+8>>2]|0}j=j-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;c:do{if(j>>>0>g>>>0){o=p+o|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(o-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<j>>>0)){break c}}c[h>>2]=4;break b}}while(0);if(q){break}if(((c[j>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=1}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[g>>2]|0}if((n|0)==-1){c[e>>2]=0;n=1;break}else{n=(c[e>>2]|0)==0;break}}}while(0);do{if((t|0)==0){k=88}else{g=c[t+12>>2]|0;if((g|0)==(c[t+16>>2]|0)){g=Ec[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;k=88;break}if(!n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);do{if((k|0)==88){if(n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);c[h>>2]=c[h>>2]|2;D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}function Gl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+328|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[t>>2];t=d|0;n=d+104|0;m=d+112|0;l=d+128|0;o=d+144|0;p=d+152|0;q=d+312|0;r=d+320|0;s=c[g+4>>2]&74;if((s|0)==64){s=8}else if((s|0)==0){s=0}else if((s|0)==8){s=16}else{s=10}t=t|0;xg(m,g,t,n);w=l;zn(w|0,0,12)|0;pe(l,10,0);if((a[w]&1)==0){u=l+1|0;B=u;v=l+8|0}else{v=l+8|0;B=c[v>>2]|0;u=l+1|0}c[o>>2]=B;g=p|0;c[q>>2]=g;c[r>>2]=0;e=e|0;f=f|0;y=l|0;x=l+4|0;z=c[n>>2]|0;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){C=1;n=0}else{A=c[n+12>>2]|0;if((A|0)==(c[n+16>>2]|0)){A=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{A=c[A>>2]|0}if(!((A|0)==-1)){C=0;break}c[e>>2]=0;C=1;n=0}}while(0);A=c[f>>2]|0;do{if((A|0)==0){k=22}else{D=c[A+12>>2]|0;if((D|0)==(c[A+16>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[f>>2]=0;k=22;break}else{if(C){break}else{t=A;break a}}}}while(0);if((k|0)==22){k=0;if(C){t=0;break}else{A=0}}C=a[w]|0;E=(C&1)==0;if(E){D=(C&255)>>>1}else{D=c[x>>2]|0}if(((c[o>>2]|0)-B|0)==(D|0)){if(E){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[x>>2]|0;B=C}pe(l,B<<1,0);if((a[w]&1)==0){B=10}else{B=(c[y>>2]&-2)-1|0}pe(l,B,0);if((a[w]&1)==0){B=u}else{B=c[v>>2]|0}c[o>>2]=B+C}D=n+12|0;E=c[D>>2]|0;C=n+16|0;if((E|0)==(c[C>>2]|0)){E=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{E=c[E>>2]|0}if((tg(E,s,B,o,r,z,m,g,q,t)|0)!=0){t=A;break}A=c[D>>2]|0;if((A|0)==(c[C>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[D>>2]=A+4;continue}}u=m;v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[m+4>>2]|0}do{if((v|0)!=0){v=c[q>>2]|0;if((v-p|0)>=160){break}E=c[r>>2]|0;c[q>>2]=v+4;c[v>>2]=E}}while(0);o=km(B,c[o>>2]|0,h,s)|0;c[j>>2]=o;c[j+4>>2]=L;j=c[q>>2]|0;o=a[u]|0;if((o&1)==0){p=(o&255)>>>1}else{p=c[m+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(j|0)){p=j-4|0;if(p>>>0>g>>>0){o=g}else{break}do{E=c[o>>2]|0;c[o>>2]=c[p>>2];c[p>>2]=E;o=o+4|0;p=p-4|0;}while(o>>>0<p>>>0);o=a[u]|0}}while(0);if((o&1)==0){o=(o&255)>>>1;p=m+1|0}else{o=c[m+4>>2]|0;p=c[m+8>>2]|0}j=j-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;c:do{if(j>>>0>g>>>0){o=p+o|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(o-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<j>>>0)){break c}}c[h>>2]=4;break b}}while(0);if(q){break}if(((c[j>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=1}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[g>>2]|0}if((n|0)==-1){c[e>>2]=0;n=1;break}else{n=(c[e>>2]|0)==0;break}}}while(0);do{if((t|0)==0){k=88}else{g=c[t+12>>2]|0;if((g|0)==(c[t+16>>2]|0)){g=Ec[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;k=88;break}if(!n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);do{if((k|0)==88){if(n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);c[h>>2]=c[h>>2]|2;D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}function Hl(d,e,f,g,h,j,k){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=i;i=i+328|0;u=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[u>>2];u=g;g=i;i=i+4|0;i=i+7&-8;c[g>>2]=c[u>>2];u=e|0;o=e+104|0;n=e+112|0;m=e+128|0;p=e+144|0;q=e+152|0;r=e+312|0;s=e+320|0;t=c[h+4>>2]&74;if((t|0)==0){t=0}else if((t|0)==8){t=16}else if((t|0)==64){t=8}else{t=10}u=u|0;xg(n,h,u,o);x=m;zn(x|0,0,12)|0;pe(m,10,0);if((a[x]&1)==0){v=m+1|0;C=v;w=m+8|0}else{w=m+8|0;C=c[w>>2]|0;v=m+1|0}c[p>>2]=C;h=q|0;c[r>>2]=h;c[s>>2]=0;f=f|0;g=g|0;z=m|0;y=m+4|0;A=c[o>>2]|0;o=c[f>>2]|0;a:while(1){do{if((o|0)==0){D=1;o=0}else{B=c[o+12>>2]|0;if((B|0)==(c[o+16>>2]|0)){B=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{B=c[B>>2]|0}if(!((B|0)==-1)){D=0;break}c[f>>2]=0;D=1;o=0}}while(0);B=c[g>>2]|0;do{if((B|0)==0){l=22}else{E=c[B+12>>2]|0;if((E|0)==(c[B+16>>2]|0)){E=Ec[c[(c[B>>2]|0)+36>>2]&127](B)|0}else{E=c[E>>2]|0}if((E|0)==-1){c[g>>2]=0;l=22;break}else{if(D){break}else{u=B;break a}}}}while(0);if((l|0)==22){l=0;if(D){u=0;break}else{B=0}}D=a[x]|0;F=(D&1)==0;if(F){E=(D&255)>>>1}else{E=c[y>>2]|0}if(((c[p>>2]|0)-C|0)==(E|0)){if(F){C=(D&255)>>>1;D=(D&255)>>>1}else{D=c[y>>2]|0;C=D}pe(m,C<<1,0);if((a[x]&1)==0){C=10}else{C=(c[z>>2]&-2)-1|0}pe(m,C,0);if((a[x]&1)==0){C=v}else{C=c[w>>2]|0}c[p>>2]=C+D}E=o+12|0;F=c[E>>2]|0;D=o+16|0;if((F|0)==(c[D>>2]|0)){F=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{F=c[F>>2]|0}if((tg(F,t,C,p,s,A,n,h,r,u)|0)!=0){u=B;break}B=c[E>>2]|0;if((B|0)==(c[D>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[E>>2]=B+4;continue}}v=n;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[n+4>>2]|0}do{if((w|0)!=0){w=c[r>>2]|0;if((w-q|0)>=160){break}F=c[s>>2]|0;c[r>>2]=w+4;c[w>>2]=F}}while(0);b[k>>1]=lm(C,c[p>>2]|0,j,t)|0;k=c[r>>2]|0;p=a[v]|0;if((p&1)==0){q=(p&255)>>>1}else{q=c[n+4>>2]|0}b:do{if((q|0)!=0){do{if((h|0)!=(k|0)){q=k-4|0;if(q>>>0>h>>>0){p=h}else{break}do{F=c[p>>2]|0;c[p>>2]=c[q>>2];c[q>>2]=F;p=p+4|0;q=q-4|0;}while(p>>>0<q>>>0);p=a[v]|0}}while(0);if((p&1)==0){p=(p&255)>>>1;q=n+1|0}else{p=c[n+4>>2]|0;q=c[n+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>h>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[h>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;h=h+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(h>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=1}else{h=c[o+12>>2]|0;if((h|0)==(c[o+16>>2]|0)){o=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{o=c[h>>2]|0}if((o|0)==-1){c[f>>2]=0;o=1;break}else{o=(c[f>>2]|0)==0;break}}}while(0);do{if((u|0)==0){l=88}else{h=c[u+12>>2]|0;if((h|0)==(c[u+16>>2]|0)){h=Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{h=c[h>>2]|0}if((h|0)==-1){c[g>>2]=0;l=88;break}if(!o){break}E=c[f>>2]|0;F=d|0;c[F>>2]=E;me(m);me(n);i=e;return}}while(0);do{if((l|0)==88){if(o){break}E=c[f>>2]|0;F=d|0;c[F>>2]=E;me(m);me(n);i=e;return}}while(0);c[j>>2]=c[j>>2]|2;E=c[f>>2]|0;F=d|0;c[F>>2]=E;me(m);me(n);i=e;return}function Il(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+328|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[t>>2];t=d|0;n=d+104|0;m=d+112|0;l=d+128|0;o=d+144|0;p=d+152|0;q=d+312|0;r=d+320|0;s=c[g+4>>2]&74;if((s|0)==64){s=8}else if((s|0)==0){s=0}else if((s|0)==8){s=16}else{s=10}t=t|0;xg(m,g,t,n);w=l;zn(w|0,0,12)|0;pe(l,10,0);if((a[w]&1)==0){u=l+1|0;B=u;v=l+8|0}else{v=l+8|0;B=c[v>>2]|0;u=l+1|0}c[o>>2]=B;g=p|0;c[q>>2]=g;c[r>>2]=0;e=e|0;f=f|0;y=l|0;x=l+4|0;z=c[n>>2]|0;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){C=1;n=0}else{A=c[n+12>>2]|0;if((A|0)==(c[n+16>>2]|0)){A=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{A=c[A>>2]|0}if(!((A|0)==-1)){C=0;break}c[e>>2]=0;C=1;n=0}}while(0);A=c[f>>2]|0;do{if((A|0)==0){k=22}else{D=c[A+12>>2]|0;if((D|0)==(c[A+16>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[f>>2]=0;k=22;break}else{if(C){break}else{t=A;break a}}}}while(0);if((k|0)==22){k=0;if(C){t=0;break}else{A=0}}C=a[w]|0;E=(C&1)==0;if(E){D=(C&255)>>>1}else{D=c[x>>2]|0}if(((c[o>>2]|0)-B|0)==(D|0)){if(E){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[x>>2]|0;B=C}pe(l,B<<1,0);if((a[w]&1)==0){B=10}else{B=(c[y>>2]&-2)-1|0}pe(l,B,0);if((a[w]&1)==0){B=u}else{B=c[v>>2]|0}c[o>>2]=B+C}D=n+12|0;E=c[D>>2]|0;C=n+16|0;if((E|0)==(c[C>>2]|0)){E=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{E=c[E>>2]|0}if((tg(E,s,B,o,r,z,m,g,q,t)|0)!=0){t=A;break}A=c[D>>2]|0;if((A|0)==(c[C>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[D>>2]=A+4;continue}}u=m;v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[m+4>>2]|0}do{if((v|0)!=0){v=c[q>>2]|0;if((v-p|0)>=160){break}E=c[r>>2]|0;c[q>>2]=v+4;c[v>>2]=E}}while(0);c[j>>2]=mm(B,c[o>>2]|0,h,s)|0;j=c[q>>2]|0;o=a[u]|0;if((o&1)==0){p=(o&255)>>>1}else{p=c[m+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(j|0)){p=j-4|0;if(p>>>0>g>>>0){o=g}else{break}do{E=c[o>>2]|0;c[o>>2]=c[p>>2];c[p>>2]=E;o=o+4|0;p=p-4|0;}while(o>>>0<p>>>0);o=a[u]|0}}while(0);if((o&1)==0){o=(o&255)>>>1;p=m+1|0}else{o=c[m+4>>2]|0;p=c[m+8>>2]|0}j=j-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;c:do{if(j>>>0>g>>>0){o=p+o|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(o-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<j>>>0)){break c}}c[h>>2]=4;break b}}while(0);if(q){break}if(((c[j>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=1}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[g>>2]|0}if((n|0)==-1){c[e>>2]=0;n=1;break}else{n=(c[e>>2]|0)==0;break}}}while(0);do{if((t|0)==0){k=88}else{g=c[t+12>>2]|0;if((g|0)==(c[t+16>>2]|0)){g=Ec[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;k=88;break}if(!n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);do{if((k|0)==88){if(n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);c[h>>2]=c[h>>2]|2;D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}function Jl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+328|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[t>>2];t=d|0;n=d+104|0;m=d+112|0;l=d+128|0;o=d+144|0;p=d+152|0;q=d+312|0;r=d+320|0;s=c[g+4>>2]&74;if((s|0)==0){s=0}else if((s|0)==8){s=16}else if((s|0)==64){s=8}else{s=10}t=t|0;xg(m,g,t,n);w=l;zn(w|0,0,12)|0;pe(l,10,0);if((a[w]&1)==0){u=l+1|0;B=u;v=l+8|0}else{v=l+8|0;B=c[v>>2]|0;u=l+1|0}c[o>>2]=B;g=p|0;c[q>>2]=g;c[r>>2]=0;e=e|0;f=f|0;y=l|0;x=l+4|0;z=c[n>>2]|0;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){C=1;n=0}else{A=c[n+12>>2]|0;if((A|0)==(c[n+16>>2]|0)){A=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{A=c[A>>2]|0}if(!((A|0)==-1)){C=0;break}c[e>>2]=0;C=1;n=0}}while(0);A=c[f>>2]|0;do{if((A|0)==0){k=22}else{D=c[A+12>>2]|0;if((D|0)==(c[A+16>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[f>>2]=0;k=22;break}else{if(C){break}else{t=A;break a}}}}while(0);if((k|0)==22){k=0;if(C){t=0;break}else{A=0}}C=a[w]|0;E=(C&1)==0;if(E){D=(C&255)>>>1}else{D=c[x>>2]|0}if(((c[o>>2]|0)-B|0)==(D|0)){if(E){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[x>>2]|0;B=C}pe(l,B<<1,0);if((a[w]&1)==0){B=10}else{B=(c[y>>2]&-2)-1|0}pe(l,B,0);if((a[w]&1)==0){B=u}else{B=c[v>>2]|0}c[o>>2]=B+C}D=n+12|0;E=c[D>>2]|0;C=n+16|0;if((E|0)==(c[C>>2]|0)){E=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{E=c[E>>2]|0}if((tg(E,s,B,o,r,z,m,g,q,t)|0)!=0){t=A;break}A=c[D>>2]|0;if((A|0)==(c[C>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[D>>2]=A+4;continue}}u=m;v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[m+4>>2]|0}do{if((v|0)!=0){v=c[q>>2]|0;if((v-p|0)>=160){break}E=c[r>>2]|0;c[q>>2]=v+4;c[v>>2]=E}}while(0);c[j>>2]=nm(B,c[o>>2]|0,h,s)|0;j=c[q>>2]|0;o=a[u]|0;if((o&1)==0){p=(o&255)>>>1}else{p=c[m+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(j|0)){p=j-4|0;if(p>>>0>g>>>0){o=g}else{break}do{E=c[o>>2]|0;c[o>>2]=c[p>>2];c[p>>2]=E;o=o+4|0;p=p-4|0;}while(o>>>0<p>>>0);o=a[u]|0}}while(0);if((o&1)==0){o=(o&255)>>>1;p=m+1|0}else{o=c[m+4>>2]|0;p=c[m+8>>2]|0}j=j-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;c:do{if(j>>>0>g>>>0){o=p+o|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(o-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<j>>>0)){break c}}c[h>>2]=4;break b}}while(0);if(q){break}if(((c[j>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=1}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[g>>2]|0}if((n|0)==-1){c[e>>2]=0;n=1;break}else{n=(c[e>>2]|0)==0;break}}}while(0);do{if((t|0)==0){k=88}else{g=c[t+12>>2]|0;if((g|0)==(c[t+16>>2]|0)){g=Ec[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;k=88;break}if(!n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);do{if((k|0)==88){if(n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);c[h>>2]=c[h>>2]|2;D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}function Kl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0;d=i;i=i+328|0;t=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[t>>2];t=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[t>>2];t=d|0;n=d+104|0;m=d+112|0;l=d+128|0;o=d+144|0;p=d+152|0;q=d+312|0;r=d+320|0;s=c[g+4>>2]&74;if((s|0)==64){s=8}else if((s|0)==0){s=0}else if((s|0)==8){s=16}else{s=10}t=t|0;xg(m,g,t,n);w=l;zn(w|0,0,12)|0;pe(l,10,0);if((a[w]&1)==0){u=l+1|0;B=u;v=l+8|0}else{v=l+8|0;B=c[v>>2]|0;u=l+1|0}c[o>>2]=B;g=p|0;c[q>>2]=g;c[r>>2]=0;e=e|0;f=f|0;y=l|0;x=l+4|0;z=c[n>>2]|0;n=c[e>>2]|0;a:while(1){do{if((n|0)==0){C=1;n=0}else{A=c[n+12>>2]|0;if((A|0)==(c[n+16>>2]|0)){A=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{A=c[A>>2]|0}if(!((A|0)==-1)){C=0;break}c[e>>2]=0;C=1;n=0}}while(0);A=c[f>>2]|0;do{if((A|0)==0){k=22}else{D=c[A+12>>2]|0;if((D|0)==(c[A+16>>2]|0)){D=Ec[c[(c[A>>2]|0)+36>>2]&127](A)|0}else{D=c[D>>2]|0}if((D|0)==-1){c[f>>2]=0;k=22;break}else{if(C){break}else{t=A;break a}}}}while(0);if((k|0)==22){k=0;if(C){t=0;break}else{A=0}}C=a[w]|0;E=(C&1)==0;if(E){D=(C&255)>>>1}else{D=c[x>>2]|0}if(((c[o>>2]|0)-B|0)==(D|0)){if(E){B=(C&255)>>>1;C=(C&255)>>>1}else{C=c[x>>2]|0;B=C}pe(l,B<<1,0);if((a[w]&1)==0){B=10}else{B=(c[y>>2]&-2)-1|0}pe(l,B,0);if((a[w]&1)==0){B=u}else{B=c[v>>2]|0}c[o>>2]=B+C}D=n+12|0;E=c[D>>2]|0;C=n+16|0;if((E|0)==(c[C>>2]|0)){E=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{E=c[E>>2]|0}if((tg(E,s,B,o,r,z,m,g,q,t)|0)!=0){t=A;break}A=c[D>>2]|0;if((A|0)==(c[C>>2]|0)){Ec[c[(c[n>>2]|0)+40>>2]&127](n)|0;continue}else{c[D>>2]=A+4;continue}}u=m;v=a[u]|0;if((v&1)==0){v=(v&255)>>>1}else{v=c[m+4>>2]|0}do{if((v|0)!=0){v=c[q>>2]|0;if((v-p|0)>=160){break}E=c[r>>2]|0;c[q>>2]=v+4;c[v>>2]=E}}while(0);o=om(B,c[o>>2]|0,h,s)|0;c[j>>2]=o;c[j+4>>2]=L;j=c[q>>2]|0;o=a[u]|0;if((o&1)==0){p=(o&255)>>>1}else{p=c[m+4>>2]|0}b:do{if((p|0)!=0){do{if((g|0)!=(j|0)){p=j-4|0;if(p>>>0>g>>>0){o=g}else{break}do{E=c[o>>2]|0;c[o>>2]=c[p>>2];c[p>>2]=E;o=o+4|0;p=p-4|0;}while(o>>>0<p>>>0);o=a[u]|0}}while(0);if((o&1)==0){o=(o&255)>>>1;p=m+1|0}else{o=c[m+4>>2]|0;p=c[m+8>>2]|0}j=j-4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;c:do{if(j>>>0>g>>>0){o=p+o|0;while(1){if(!q){if((r<<24>>24|0)!=(c[g>>2]|0)){break}}p=(o-p|0)>1?p+1|0:p;g=g+4|0;r=a[p]|0;q=r<<24>>24<1|r<<24>>24==127;if(!(g>>>0<j>>>0)){break c}}c[h>>2]=4;break b}}while(0);if(q){break}if(((c[j>>2]|0)-1|0)>>>0<r<<24>>24>>>0){break}c[h>>2]=4}}while(0);do{if((n|0)==0){n=1}else{g=c[n+12>>2]|0;if((g|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[g>>2]|0}if((n|0)==-1){c[e>>2]=0;n=1;break}else{n=(c[e>>2]|0)==0;break}}}while(0);do{if((t|0)==0){k=88}else{g=c[t+12>>2]|0;if((g|0)==(c[t+16>>2]|0)){g=Ec[c[(c[t>>2]|0)+36>>2]&127](t)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;k=88;break}if(!n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);do{if((k|0)==88){if(n){break}D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}}while(0);c[h>>2]=c[h>>2]|2;D=c[e>>2]|0;E=b|0;c[E>>2]=D;me(l);me(m);i=d;return}function Ll(b,d,e,f,h,j,k){b=b|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+376|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+128|0;o=n+136|0;d=n+144|0;m=n+160|0;s=n+176|0;q=n+184|0;r=n+344|0;p=n+352|0;t=n+360|0;u=n+368|0;v=n|0;yg(d,h,v,B,o);x=m;zn(x|0,0,12)|0;pe(m,10,0);if((a[x]&1)==0){y=m+1|0;E=y;w=m+8|0}else{w=m+8|0;E=c[w>>2]|0;y=m+1|0}c[s>>2]=E;h=q|0;c[r>>2]=h;c[p>>2]=0;a[t]=1;a[u]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=c[B>>2]|0;C=c[o>>2]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){F=1;o=0}else{D=c[o+12>>2]|0;if((D|0)==(c[o+16>>2]|0)){D=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{D=c[D>>2]|0}if(!((D|0)==-1)){F=0;break}c[e>>2]=0;F=1;o=0}}while(0);D=c[f>>2]|0;do{if((D|0)==0){l=18}else{G=c[D+12>>2]|0;if((G|0)==(c[D+16>>2]|0)){G=Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{G=c[G>>2]|0}if((G|0)==-1){c[f>>2]=0;l=18;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==18){l=0;if(F){u=0;break}else{D=0}}F=a[x]|0;H=(F&1)==0;if(H){G=(F&255)>>>1}else{G=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(G|0)){if(H){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[x]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[x]&1)==0){E=y}else{E=c[w>>2]|0}c[s>>2]=E+F}G=o+12|0;H=c[G>>2]|0;F=o+16|0;if((H|0)==(c[F>>2]|0)){H=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{H=c[H>>2]|0}if((zg(H,t,u,E,s,B,C,d,h,r,p,v)|0)!=0){u=D;break}D=c[G>>2]|0;if((D|0)==(c[F>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[G>>2]=D+4;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[r>>2]|0;if((t-q|0)>=160){break}H=c[p>>2]|0;c[r>>2]=t+4;c[t>>2]=H}}while(0);g[k>>2]=+pm(E,c[s>>2]|0,j);k=c[r>>2]|0;p=a[v]|0;if((p&1)==0){q=(p&255)>>>1}else{q=c[d+4>>2]|0}b:do{if((q|0)!=0){do{if((h|0)!=(k|0)){q=k-4|0;if(q>>>0>h>>>0){p=h}else{break}do{H=c[p>>2]|0;c[p>>2]=c[q>>2];c[q>>2]=H;p=p+4|0;q=q-4|0;}while(p>>>0<q>>>0);p=a[v]|0}}while(0);if((p&1)==0){p=(p&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>h>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[h>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;h=h+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(h>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=1}else{h=c[o+12>>2]|0;if((h|0)==(c[o+16>>2]|0)){o=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{o=c[h>>2]|0}if((o|0)==-1){c[e>>2]=0;o=1;break}else{o=(c[e>>2]|0)==0;break}}}while(0);do{if((u|0)==0){l=84}else{h=c[u+12>>2]|0;if((h|0)==(c[u+16>>2]|0)){h=Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{h=c[h>>2]|0}if((h|0)==-1){c[f>>2]=0;l=84;break}if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==84){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Ml(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+376|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+128|0;o=n+136|0;d=n+144|0;m=n+160|0;s=n+176|0;q=n+184|0;r=n+344|0;p=n+352|0;t=n+360|0;u=n+368|0;v=n|0;yg(d,g,v,B,o);x=m;zn(x|0,0,12)|0;pe(m,10,0);if((a[x]&1)==0){y=m+1|0;E=y;w=m+8|0}else{w=m+8|0;E=c[w>>2]|0;y=m+1|0}c[s>>2]=E;g=q|0;c[r>>2]=g;c[p>>2]=0;a[t]=1;a[u]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=c[B>>2]|0;C=c[o>>2]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){F=1;o=0}else{D=c[o+12>>2]|0;if((D|0)==(c[o+16>>2]|0)){D=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{D=c[D>>2]|0}if(!((D|0)==-1)){F=0;break}c[e>>2]=0;F=1;o=0}}while(0);D=c[f>>2]|0;do{if((D|0)==0){l=18}else{G=c[D+12>>2]|0;if((G|0)==(c[D+16>>2]|0)){G=Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{G=c[G>>2]|0}if((G|0)==-1){c[f>>2]=0;l=18;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==18){l=0;if(F){u=0;break}else{D=0}}F=a[x]|0;H=(F&1)==0;if(H){G=(F&255)>>>1}else{G=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(G|0)){if(H){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[x]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[x]&1)==0){E=y}else{E=c[w>>2]|0}c[s>>2]=E+F}G=o+12|0;H=c[G>>2]|0;F=o+16|0;if((H|0)==(c[F>>2]|0)){H=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{H=c[H>>2]|0}if((zg(H,t,u,E,s,B,C,d,g,r,p,v)|0)!=0){u=D;break}D=c[G>>2]|0;if((D|0)==(c[F>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[G>>2]=D+4;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[r>>2]|0;if((t-q|0)>=160){break}H=c[p>>2]|0;c[r>>2]=t+4;c[t>>2]=H}}while(0);h[k>>3]=+qm(E,c[s>>2]|0,j);k=c[r>>2]|0;p=a[v]|0;if((p&1)==0){q=(p&255)>>>1}else{q=c[d+4>>2]|0}b:do{if((q|0)!=0){do{if((g|0)!=(k|0)){q=k-4|0;if(q>>>0>g>>>0){p=g}else{break}do{H=c[p>>2]|0;c[p>>2]=c[q>>2];c[q>>2]=H;p=p+4|0;q=q-4|0;}while(p>>>0<q>>>0);p=a[v]|0}}while(0);if((p&1)==0){p=(p&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>g>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[g>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;g=g+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(g>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=1}else{g=c[o+12>>2]|0;if((g|0)==(c[o+16>>2]|0)){o=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{o=c[g>>2]|0}if((o|0)==-1){c[e>>2]=0;o=1;break}else{o=(c[e>>2]|0)==0;break}}}while(0);do{if((u|0)==0){l=84}else{g=c[u+12>>2]|0;if((g|0)==(c[u+16>>2]|0)){g=Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;l=84;break}if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==84){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Nl(b,d,e,f,g,j,k){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0;n=i;i=i+376|0;B=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[B>>2];B=f;f=i;i=i+4|0;i=i+7&-8;c[f>>2]=c[B>>2];B=n+128|0;o=n+136|0;d=n+144|0;m=n+160|0;s=n+176|0;q=n+184|0;r=n+344|0;p=n+352|0;t=n+360|0;u=n+368|0;v=n|0;yg(d,g,v,B,o);x=m;zn(x|0,0,12)|0;pe(m,10,0);if((a[x]&1)==0){y=m+1|0;E=y;w=m+8|0}else{w=m+8|0;E=c[w>>2]|0;y=m+1|0}c[s>>2]=E;g=q|0;c[r>>2]=g;c[p>>2]=0;a[t]=1;a[u]=69;e=e|0;f=f|0;z=m|0;A=m+4|0;B=c[B>>2]|0;C=c[o>>2]|0;o=c[e>>2]|0;a:while(1){do{if((o|0)==0){F=1;o=0}else{D=c[o+12>>2]|0;if((D|0)==(c[o+16>>2]|0)){D=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{D=c[D>>2]|0}if(!((D|0)==-1)){F=0;break}c[e>>2]=0;F=1;o=0}}while(0);D=c[f>>2]|0;do{if((D|0)==0){l=18}else{G=c[D+12>>2]|0;if((G|0)==(c[D+16>>2]|0)){G=Ec[c[(c[D>>2]|0)+36>>2]&127](D)|0}else{G=c[G>>2]|0}if((G|0)==-1){c[f>>2]=0;l=18;break}else{if(F){break}else{u=D;break a}}}}while(0);if((l|0)==18){l=0;if(F){u=0;break}else{D=0}}F=a[x]|0;H=(F&1)==0;if(H){G=(F&255)>>>1}else{G=c[A>>2]|0}if(((c[s>>2]|0)-E|0)==(G|0)){if(H){E=(F&255)>>>1;F=(F&255)>>>1}else{F=c[A>>2]|0;E=F}pe(m,E<<1,0);if((a[x]&1)==0){E=10}else{E=(c[z>>2]&-2)-1|0}pe(m,E,0);if((a[x]&1)==0){E=y}else{E=c[w>>2]|0}c[s>>2]=E+F}G=o+12|0;H=c[G>>2]|0;F=o+16|0;if((H|0)==(c[F>>2]|0)){H=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{H=c[H>>2]|0}if((zg(H,t,u,E,s,B,C,d,g,r,p,v)|0)!=0){u=D;break}D=c[G>>2]|0;if((D|0)==(c[F>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;continue}else{c[G>>2]=D+4;continue}}v=d;w=a[v]|0;if((w&1)==0){w=(w&255)>>>1}else{w=c[d+4>>2]|0}do{if(!((w|0)==0|(a[t]|0)==0)){t=c[r>>2]|0;if((t-q|0)>=160){break}H=c[p>>2]|0;c[r>>2]=t+4;c[t>>2]=H}}while(0);h[k>>3]=+rm(E,c[s>>2]|0,j);k=c[r>>2]|0;p=a[v]|0;if((p&1)==0){q=(p&255)>>>1}else{q=c[d+4>>2]|0}b:do{if((q|0)!=0){do{if((g|0)!=(k|0)){q=k-4|0;if(q>>>0>g>>>0){p=g}else{break}do{H=c[p>>2]|0;c[p>>2]=c[q>>2];c[q>>2]=H;p=p+4|0;q=q-4|0;}while(p>>>0<q>>>0);p=a[v]|0}}while(0);if((p&1)==0){p=(p&255)>>>1;q=d+1|0}else{p=c[d+4>>2]|0;q=c[d+8>>2]|0}k=k-4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;c:do{if(k>>>0>g>>>0){p=q+p|0;while(1){if(!r){if((s<<24>>24|0)!=(c[g>>2]|0)){break}}q=(p-q|0)>1?q+1|0:q;g=g+4|0;s=a[q]|0;r=s<<24>>24<1|s<<24>>24==127;if(!(g>>>0<k>>>0)){break c}}c[j>>2]=4;break b}}while(0);if(r){break}if(((c[k>>2]|0)-1|0)>>>0<s<<24>>24>>>0){break}c[j>>2]=4}}while(0);do{if((o|0)==0){o=1}else{g=c[o+12>>2]|0;if((g|0)==(c[o+16>>2]|0)){o=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{o=c[g>>2]|0}if((o|0)==-1){c[e>>2]=0;o=1;break}else{o=(c[e>>2]|0)==0;break}}}while(0);do{if((u|0)==0){l=84}else{g=c[u+12>>2]|0;if((g|0)==(c[u+16>>2]|0)){g=Ec[c[(c[u>>2]|0)+36>>2]&127](u)|0}else{g=c[g>>2]|0}if((g|0)==-1){c[f>>2]=0;l=84;break}if(!o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);do{if((l|0)==84){if(o){break}G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}}while(0);c[j>>2]=c[j>>2]|2;G=c[e>>2]|0;H=b|0;c[H>>2]=G;me(m);me(d);i=n;return}function Ol(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+16|0;h=g|0;j=h;c[j>>2]=f;c[j+4>>2]=0;d=ac(d|0)|0;e=bc(a|0,b|0,e|0,h|0)|0;if((d|0)==0){i=g;return e|0}ac(d|0)|0;i=g;return e|0}function Pl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0;k=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=k|0;l=l|0;d=c[l>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=e;o=g-n|0;h=h+12|0;p=c[h>>2]|0;p=(p|0)>(o|0)?p-o|0:0;o=f;n=o-n|0;do{if((n|0)>0){if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,e,n)|0)==(n|0)){break}c[l>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((p|0)>0){le(m,p,j);if((a[m]&1)==0){j=m+1|0}else{j=c[m+8>>2]|0}if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,j,p)|0)==(p|0)){me(m);break}c[l>>2]=0;c[b>>2]=0;me(m);i=k;return}}while(0);j=g-o|0;do{if((j|0)>0){if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,f,j)|0)==(j|0)){break}c[l>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[h>>2]=0;c[b>>2]=d;i=k;return}function Ql(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=i;i=i+16|0;g=f|0;h=g;c[h>>2]=e;c[h+4>>2]=0;b=ac(b|0)|0;d=pc(a|0,d|0,g|0)|0;if((b|0)==0){i=f;return d|0}ac(b|0)|0;i=f;return d|0}function Rl(b,d,e,f,g,h,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;k=i;i=i+16|0;m=d;l=i;i=i+4|0;i=i+7&-8;c[l>>2]=c[m>>2];m=k|0;l=l|0;d=c[l>>2]|0;if((d|0)==0){c[b>>2]=0;i=k;return}n=e;o=g-n>>2;h=h+12|0;p=c[h>>2]|0;p=(p|0)>(o|0)?p-o|0:0;o=f;q=o-n|0;n=q>>2;do{if((q|0)>0){if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,e,n)|0)==(n|0)){break}c[l>>2]=0;c[b>>2]=0;i=k;return}}while(0);do{if((p|0)>0){xe(m,p,j);if((a[m]&1)==0){j=m+4|0}else{j=c[m+8>>2]|0}if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,j,p)|0)==(p|0)){ye(m);break}c[l>>2]=0;c[b>>2]=0;ye(m);i=k;return}}while(0);q=g-o|0;j=q>>2;do{if((q|0)>0){if((Fc[c[(c[d>>2]|0)+48>>2]&63](d,f,j)|0)==(j|0)){break}c[l>>2]=0;c[b>>2]=0;i=k;return}}while(0);c[h>>2]=0;c[b>>2]=d;i=k;return}function Sl(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;j=i;l=e;e=i;i=i+4|0;i=i+7&-8;c[e>>2]=c[l>>2];d=d|0;l=c[d>>2]|0;do{if((l|0)==0){l=0}else{if((c[l+12>>2]|0)!=(c[l+16>>2]|0)){break}if((Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0)==-1){c[d>>2]=0;l=0;break}else{l=c[d>>2]|0;break}}}while(0);l=(l|0)==0;e=e|0;m=c[e>>2]|0;a:do{if((m|0)==0){k=11}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if(!((Ec[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1)){break}c[e>>2]=0;k=11;break a}}while(0);if(!l){k=12}}}while(0);if((k|0)==11){if(l){k=12}else{m=0}}if((k|0)==12){c[f>>2]=c[f>>2]|6;r=0;i=j;return r|0}l=c[d>>2]|0;k=c[l+12>>2]|0;if((k|0)==(c[l+16>>2]|0)){n=(Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0)&255}else{n=a[k]|0}do{if(n<<24>>24>-1){l=g+8|0;if((b[(c[l>>2]|0)+(n<<24>>24<<1)>>1]&2048)==0){break}k=g;n=(Fc[c[(c[k>>2]|0)+36>>2]&63](g,n,0)|0)<<24>>24;o=c[d>>2]|0;p=o+12|0;q=c[p>>2]|0;if((q|0)==(c[o+16>>2]|0)){Ec[c[(c[o>>2]|0)+40>>2]&127](o)|0;o=m}else{c[p>>2]=q+1;o=m}while(1){n=n-48|0;h=h-1|0;p=c[d>>2]|0;do{if((p|0)==0){p=0}else{if((c[p+12>>2]|0)!=(c[p+16>>2]|0)){break}if((Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0)==-1){c[d>>2]=0;p=0;break}else{p=c[d>>2]|0;break}}}while(0);p=(p|0)==0;do{if((o|0)==0){o=0}else{if((c[o+12>>2]|0)!=(c[o+16>>2]|0)){break}if(!((Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0)==-1)){o=m;break}c[e>>2]=0;o=0;m=0}}while(0);q=c[d>>2]|0;if(!((p^(o|0)==0)&(h|0)>0)){k=40;break}p=c[q+12>>2]|0;if((p|0)==(c[q+16>>2]|0)){p=(Ec[c[(c[q>>2]|0)+36>>2]&127](q)|0)&255}else{p=a[p]|0}if(!(p<<24>>24>-1)){k=52;break}if((b[(c[l>>2]|0)+(p<<24>>24<<1)>>1]&2048)==0){k=52;break}n=((Fc[c[(c[k>>2]|0)+36>>2]&63](g,p,0)|0)<<24>>24)+(n*10|0)|0;r=c[d>>2]|0;q=r+12|0;p=c[q>>2]|0;if((p|0)==(c[r+16>>2]|0)){Ec[c[(c[r>>2]|0)+40>>2]&127](r)|0;continue}else{c[q>>2]=p+1;continue}}if((k|0)==40){do{if((q|0)==0){q=0}else{if((c[q+12>>2]|0)!=(c[q+16>>2]|0)){break}if((Ec[c[(c[q>>2]|0)+36>>2]&127](q)|0)==-1){c[d>>2]=0;q=0;break}else{q=c[d>>2]|0;break}}}while(0);g=(q|0)==0;b:do{if((m|0)==0){k=50}else{do{if((c[m+12>>2]|0)==(c[m+16>>2]|0)){if(!((Ec[c[(c[m>>2]|0)+36>>2]&127](m)|0)==-1)){break}c[e>>2]=0;k=50;break b}}while(0);if(!g){break}i=j;return n|0}}while(0);do{if((k|0)==50){if(g){break}i=j;return n|0}}while(0);c[f>>2]=c[f>>2]|2;r=n;i=j;return r|0}else if((k|0)==52){i=j;return n|0}}}while(0);c[f>>2]=c[f>>2]|4;r=0;i=j;return r|0}function Tl(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;g=i;j=b;b=i;i=i+4|0;i=i+7&-8;c[b>>2]=c[j>>2];a=a|0;j=c[a>>2]|0;do{if((j|0)==0){j=1}else{k=c[j+12>>2]|0;if((k|0)==(c[j+16>>2]|0)){j=Ec[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{j=c[k>>2]|0}if((j|0)==-1){c[a>>2]=0;j=1;break}else{j=(c[a>>2]|0)==0;break}}}while(0);b=b|0;l=c[b>>2]|0;do{if((l|0)==0){h=14}else{k=c[l+12>>2]|0;if((k|0)==(c[l+16>>2]|0)){k=Ec[c[(c[l>>2]|0)+36>>2]&127](l)|0}else{k=c[k>>2]|0}if((k|0)==-1){c[b>>2]=0;h=14;break}else{if(j){break}else{h=16;break}}}}while(0);if((h|0)==14){if(j){h=16}else{l=0}}if((h|0)==16){c[d>>2]=c[d>>2]|6;q=0;i=g;return q|0}j=c[a>>2]|0;k=c[j+12>>2]|0;if((k|0)==(c[j+16>>2]|0)){m=Ec[c[(c[j>>2]|0)+36>>2]&127](j)|0}else{m=c[k>>2]|0}k=e;if(!(Fc[c[(c[k>>2]|0)+12>>2]&63](e,2048,m)|0)){c[d>>2]=c[d>>2]|4;q=0;i=g;return q|0}j=e;o=(Fc[c[(c[j>>2]|0)+52>>2]&63](e,m,0)|0)<<24>>24;p=c[a>>2]|0;n=p+12|0;m=c[n>>2]|0;if((m|0)==(c[p+16>>2]|0)){Ec[c[(c[p>>2]|0)+40>>2]&127](p)|0;n=l;m=l}else{c[n>>2]=m+4;n=l;m=l}while(1){l=o-48|0;f=f-1|0;o=c[a>>2]|0;do{if((o|0)==0){o=1}else{p=c[o+12>>2]|0;if((p|0)==(c[o+16>>2]|0)){o=Ec[c[(c[o>>2]|0)+36>>2]&127](o)|0}else{o=c[p>>2]|0}if((o|0)==-1){c[a>>2]=0;o=1;break}else{o=(c[a>>2]|0)==0;break}}}while(0);do{if((n|0)==0){q=1;n=0}else{p=c[n+12>>2]|0;if((p|0)==(c[n+16>>2]|0)){n=Ec[c[(c[n>>2]|0)+36>>2]&127](n)|0}else{n=c[p>>2]|0}if((n|0)==-1){c[b>>2]=0;q=1;n=0;m=0;break}else{q=(m|0)==0;n=m;break}}}while(0);p=c[a>>2]|0;if(!((o^q)&(f|0)>0)){break}o=c[p+12>>2]|0;if((o|0)==(c[p+16>>2]|0)){o=Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{o=c[o>>2]|0}if(!(Fc[c[(c[k>>2]|0)+12>>2]&63](e,2048,o)|0)){h=63;break}o=((Fc[c[(c[j>>2]|0)+52>>2]&63](e,o,0)|0)<<24>>24)+(l*10|0)|0;p=c[a>>2]|0;l=p+12|0;q=c[l>>2]|0;if((q|0)==(c[p+16>>2]|0)){Ec[c[(c[p>>2]|0)+40>>2]&127](p)|0;continue}else{c[l>>2]=q+4;continue}}if((h|0)==63){i=g;return l|0}do{if((p|0)==0){a=1}else{e=c[p+12>>2]|0;if((e|0)==(c[p+16>>2]|0)){e=Ec[c[(c[p>>2]|0)+36>>2]&127](p)|0}else{e=c[e>>2]|0}if((e|0)==-1){c[a>>2]=0;a=1;break}else{a=(c[a>>2]|0)==0;break}}}while(0);do{if((m|0)==0){h=60}else{e=c[m+12>>2]|0;if((e|0)==(c[m+16>>2]|0)){e=Ec[c[(c[m>>2]|0)+36>>2]&127](m)|0}else{e=c[e>>2]|0}if((e|0)==-1){c[b>>2]=0;h=60;break}if(!a){break}i=g;return l|0}}while(0);do{if((h|0)==60){if(a){break}i=g;return l|0}}while(0);c[d>>2]=c[d>>2]|2;q=l;i=g;return q|0}function Ul(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;i=d;g=a[f]|0;if((g&1)==0){k=10;j=g;g=(g&255)>>>1}else{j=c[b>>2]|0;k=(j&-2)-1|0;j=j&255;g=c[b+4>>2]|0}h=e-i|0;if((e|0)==(d|0)){return b|0}if((k-g|0)>>>0<h>>>0){ve(b,k,g+h-k|0,g,g,0,0);j=a[f]|0}if((j&1)==0){j=b+1|0}else{j=c[b+8>>2]|0}i=e+(g-i)|0;k=j+g|0;while(1){a[k]=a[d]|0;d=d+1|0;if((d|0)==(e|0)){break}else{k=k+1|0}}a[j+i|0]=0;e=g+h|0;if((a[f]&1)==0){a[f]=e<<1;return b|0}else{c[b+4>>2]=e;return b|0}return 0}function Vl(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;j=d;g=a[f]|0;if((g&1)==0){k=1;i=g;h=(g&255)>>>1}else{i=c[b>>2]|0;k=(i&-2)-1|0;i=i&255;h=c[b+4>>2]|0}g=e-j>>2;if((g|0)==0){return b|0}if((k-h|0)>>>0<g>>>0){De(b,k,h+g-k|0,h,h,0,0);i=a[f]|0}if((i&1)==0){i=b+4|0}else{i=c[b+8>>2]|0}k=i+(h<<2)|0;if((d|0)!=(e|0)){j=h+((e-4-j|0)>>>2)+1|0;while(1){c[k>>2]=c[d>>2];d=d+4|0;if((d|0)==(e|0)){break}else{k=k+4|0}}k=i+(j<<2)|0}c[k>>2]=0;g=h+g|0;if((a[f]&1)==0){a[f]=g<<1;return b|0}else{c[b+4>>2]=g;return b|0}return 0}function Wl(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=b+8|0;e=b+4|0;g=c[e>>2]|0;k=c[f>>2]|0;i=g;if(!(k-i>>2>>>0<d>>>0)){do{if((g|0)==0){b=0}else{c[g>>2]=0;b=c[e>>2]|0}g=b+4|0;c[e>>2]=g;d=d-1|0;}while((d|0)!=0);return}g=b+16|0;h=b|0;m=c[h>>2]|0;i=i-m>>2;l=i+d|0;if(l>>>0>1073741823>>>0){aj(b)}k=k-m|0;do{if(k>>2>>>0<536870911>>>0){k=k>>1;l=k>>>0<l>>>0?l:k;if((l|0)==0){k=0;l=0;break}k=b+128|0;if(!((a[k]|0)==0&l>>>0<29>>>0)){j=11;break}a[k]=1;k=g}else{l=1073741823;j=11}}while(0);if((j|0)==11){k=bn(l<<2)|0}j=k+(i<<2)|0;do{if((j|0)==0){j=0}else{c[j>>2]=0}j=j+4|0;d=d-1|0;}while((d|0)!=0);d=c[h>>2]|0;n=(c[e>>2]|0)-d|0;m=k+(i-(n>>2)<<2)|0;i=d;xn(m|0,i|0,n)|0;c[h>>2]=m;c[e>>2]=j;c[f>>2]=k+(l<<2);if((d|0)==0){return}if((g|0)==(d|0)){a[b+128|0]=0;return}else{dn(i);return}}function Xl(d,f,g,h,i,j,k,l){d=d|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0;c[g>>2]=d;c[j>>2]=h;do{if((l&2|0)!=0){if((i-h|0)<3){n=1;return n|0}else{c[j>>2]=h+1;a[h]=-17;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=-69;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=-65;break}}}while(0);h=f;m=c[g>>2]|0;if(!(m>>>0<f>>>0)){n=0;return n|0}a:while(1){d=b[m>>1]|0;l=d&65535;if(l>>>0>k>>>0){f=2;k=26;break}do{if((d&65535)>>>0<128>>>0){l=c[j>>2]|0;if((i-l|0)<1){f=1;k=26;break a}c[j>>2]=l+1;a[l]=d}else{if((d&65535)>>>0<2048>>>0){d=c[j>>2]|0;if((i-d|0)<2){f=1;k=26;break a}c[j>>2]=d+1;a[d]=l>>>6|192;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=l&63|128;break}if((d&65535)>>>0<55296>>>0){d=c[j>>2]|0;if((i-d|0)<3){f=1;k=26;break a}c[j>>2]=d+1;a[d]=l>>>12|224;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=l>>>6&63|128;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=l&63|128;break}if(!((d&65535)>>>0<56320>>>0)){if((d&65535)>>>0<57344>>>0){f=2;k=26;break a}d=c[j>>2]|0;if((i-d|0)<3){f=1;k=26;break a}c[j>>2]=d+1;a[d]=l>>>12|224;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=l>>>6&63|128;n=c[j>>2]|0;c[j>>2]=n+1;a[n]=l&63|128;break}if((h-m|0)<4){f=1;k=26;break a}d=m+2|0;n=e[d>>1]|0;if((n&64512|0)!=56320){f=2;k=26;break a}if((i-(c[j>>2]|0)|0)<4){f=1;k=26;break a}m=l&960;if(((m<<10)+65536|l<<10&64512|n&1023)>>>0>k>>>0){f=2;k=26;break a}c[g>>2]=d;d=(m>>>6)+1|0;m=c[j>>2]|0;c[j>>2]=m+1;a[m]=d>>>2|240;m=c[j>>2]|0;c[j>>2]=m+1;a[m]=l>>>2&15|d<<4&48|128;m=c[j>>2]|0;c[j>>2]=m+1;a[m]=l<<4&48|n>>>6&15|128;m=c[j>>2]|0;c[j>>2]=m+1;a[m]=n&63|128}}while(0);m=(c[g>>2]|0)+2|0;c[g>>2]=m;if(!(m>>>0<f>>>0)){f=0;k=26;break}}if((k|0)==26){return f|0}return 0}function Yl(e,f,g,h,i,j,k,l){e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;l=l|0;var m=0,n=0,o=0,p=0,q=0;c[g>>2]=e;c[j>>2]=h;m=c[g>>2]|0;do{if((l&4|0)!=0){if((f-m|0)<=2){break}if(!((a[m]|0)==-17)){break}if(!((a[m+1|0]|0)==-69)){break}if(!((a[m+2|0]|0)==-65)){break}m=m+3|0;c[g>>2]=m}}while(0);a:do{if(m>>>0<f>>>0){e=f;l=i;h=c[j>>2]|0;b:while(1){if(!(h>>>0<i>>>0)){break a}o=a[m]|0;n=o&255;if(n>>>0>k>>>0){f=2;k=41;break}do{if(o<<24>>24>-1){b[h>>1]=o&255;c[g>>2]=m+1}else{if((o&255)>>>0<194>>>0){f=2;k=41;break b}if((o&255)>>>0<224>>>0){if((e-m|0)<2){f=1;k=41;break b}o=d[m+1|0]|0;if((o&192|0)!=128){f=2;k=41;break b}n=o&63|n<<6&1984;if(n>>>0>k>>>0){f=2;k=41;break b}b[h>>1]=n;c[g>>2]=m+2;break}if((o&255)>>>0<240>>>0){if((e-m|0)<3){f=1;k=41;break b}o=a[m+1|0]|0;p=a[m+2|0]|0;if((n|0)==224){if(!((o&-32)<<24>>24==-96)){f=2;k=41;break b}}else if((n|0)==237){if(!((o&-32)<<24>>24==-128)){f=2;k=41;break b}}else{if(!((o&-64)<<24>>24==-128)){f=2;k=41;break b}}p=p&255;if((p&192|0)!=128){f=2;k=41;break b}n=(o&255)<<6&4032|n<<12|p&63;if((n&65535)>>>0>k>>>0){f=2;k=41;break b}b[h>>1]=n;c[g>>2]=m+3;break}if(!((o&255)>>>0<245>>>0)){f=2;k=41;break b}if((e-m|0)<4){f=1;k=41;break b}o=a[m+1|0]|0;p=a[m+2|0]|0;q=a[m+3|0]|0;if((n|0)==240){if(!((o+112&255)>>>0<48>>>0)){f=2;k=41;break b}}else if((n|0)==244){if(!((o&-16)<<24>>24==-128)){f=2;k=41;break b}}else{if(!((o&-64)<<24>>24==-128)){f=2;k=41;break b}}m=p&255;if((m&192|0)!=128){f=2;k=41;break b}p=q&255;if((p&192|0)!=128){f=2;k=41;break b}if((l-h|0)<4){f=1;k=41;break b}n=n&7;q=o&255;o=m<<6;p=p&63;if((q<<12&258048|n<<18|o&4032|p)>>>0>k>>>0){f=2;k=41;break b}b[h>>1]=q<<2&60|m>>>4&3|((q>>>4&3|n<<2)<<6)+16320|55296;q=h+2|0;c[j>>2]=q;b[q>>1]=p|o&960|56320;c[g>>2]=(c[g>>2]|0)+4}}while(0);h=(c[j>>2]|0)+2|0;c[j>>2]=h;m=c[g>>2]|0;if(!(m>>>0<f>>>0)){break a}}if((k|0)==41){return f|0}}}while(0);q=m>>>0<f>>>0|0;return q|0}function Zl(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;do{if((g&4|0)==0){i=b}else{if((c-b|0)<=2){i=b;break}if(!((a[b]|0)==-17)){i=b;break}if(!((a[b+1|0]|0)==-69)){i=b;break}i=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);a:do{if(i>>>0<c>>>0&(e|0)!=0){g=c;h=0;b:while(1){k=a[i]|0;j=k&255;if(j>>>0>f>>>0){break a}do{if(k<<24>>24>-1){i=i+1|0}else{if((k&255)>>>0<194>>>0){break a}if((k&255)>>>0<224>>>0){if((g-i|0)<2){break a}k=d[i+1|0]|0;if((k&192|0)!=128){break a}if((k&63|j<<6&1984)>>>0>f>>>0){break a}i=i+2|0;break}if((k&255)>>>0<240>>>0){l=i;if((g-l|0)<3){break a}k=a[i+1|0]|0;m=a[i+2|0]|0;if((j|0)==224){if(!((k&-32)<<24>>24==-96)){f=21;break b}}else if((j|0)==237){if(!((k&-32)<<24>>24==-128)){f=23;break b}}else{if(!((k&-64)<<24>>24==-128)){f=25;break b}}l=m&255;if((l&192|0)!=128){break a}if(((k&255)<<6&4032|j<<12&61440|l&63)>>>0>f>>>0){break a}i=i+3|0;break}if(!((k&255)>>>0<245>>>0)){break a}m=i;if((g-m|0)<4|(e-h|0)>>>0<2>>>0){break a}k=a[i+1|0]|0;n=a[i+2|0]|0;l=a[i+3|0]|0;if((j|0)==244){if(!((k&-16)<<24>>24==-128)){f=35;break b}}else if((j|0)==240){if(!((k+112&255)>>>0<48>>>0)){f=33;break b}}else{if(!((k&-64)<<24>>24==-128)){f=37;break b}}m=n&255;if((m&192|0)!=128){break a}l=l&255;if((l&192|0)!=128){break a}if(((k&255)<<12&258048|j<<18&1835008|m<<6&4032|l&63)>>>0>f>>>0){break a}i=i+4|0;h=h+1|0}}while(0);h=h+1|0;if(!(i>>>0<c>>>0&h>>>0<e>>>0)){break a}}if((f|0)==21){n=l-b|0;return n|0}else if((f|0)==23){n=l-b|0;return n|0}else if((f|0)==25){n=l-b|0;return n|0}else if((f|0)==33){n=m-b|0;return n|0}else if((f|0)==35){n=m-b|0;return n|0}else if((f|0)==37){n=m-b|0;return n|0}}}while(0);n=i-b|0;return n|0}function _l(b,d,e,f,g,h,i,j){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;c[e>>2]=b;c[h>>2]=f;do{if((j&2|0)!=0){if((g-f|0)<3){b=1;return b|0}else{c[h>>2]=f+1;a[f]=-17;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-69;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=-65;break}}}while(0);j=c[e>>2]|0;if(!(j>>>0<d>>>0)){b=0;return b|0}a:while(1){j=c[j>>2]|0;if((j&-2048|0)==55296|j>>>0>i>>>0){i=2;e=19;break}do{if(j>>>0<128>>>0){f=c[h>>2]|0;if((g-f|0)<1){i=1;e=19;break a}c[h>>2]=f+1;a[f]=j}else{if(j>>>0<2048>>>0){f=c[h>>2]|0;if((g-f|0)<2){i=1;e=19;break a}c[h>>2]=f+1;a[f]=j>>>6|192;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j&63|128;break}f=c[h>>2]|0;b=g-f|0;if(j>>>0<65536>>>0){if((b|0)<3){i=1;e=19;break a}c[h>>2]=f+1;a[f]=j>>>12|224;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j>>>6&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j&63|128;break}else{if((b|0)<4){i=1;e=19;break a}c[h>>2]=f+1;a[f]=j>>>18|240;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j>>>12&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j>>>6&63|128;b=c[h>>2]|0;c[h>>2]=b+1;a[b]=j&63|128;break}}}while(0);j=(c[e>>2]|0)+4|0;c[e>>2]=j;if(!(j>>>0<d>>>0)){i=0;e=19;break}}if((e|0)==19){return i|0}return 0}function $l(b,e,f,g,h,i,j,k){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0;c[f>>2]=b;c[i>>2]=g;b=c[f>>2]|0;do{if((k&4|0)!=0){if((e-b|0)<=2){break}if(!((a[b]|0)==-17)){break}if(!((a[b+1|0]|0)==-69)){break}if(!((a[b+2|0]|0)==-65)){break}b=b+3|0;c[f>>2]=b}}while(0);a:do{if(b>>>0<e>>>0){k=e;g=c[i>>2]|0;b:while(1){if(!(g>>>0<h>>>0)){break a}m=a[b]|0;l=m&255;do{if(m<<24>>24>-1){if(l>>>0>j>>>0){e=2;f=40;break b}c[g>>2]=l;c[f>>2]=b+1}else{if((m&255)>>>0<194>>>0){e=2;f=40;break b}if((m&255)>>>0<224>>>0){if((k-b|0)<2){e=1;f=40;break b}m=d[b+1|0]|0;if((m&192|0)!=128){e=2;f=40;break b}l=m&63|l<<6&1984;if(l>>>0>j>>>0){e=2;f=40;break b}c[g>>2]=l;c[f>>2]=b+2;break}if((m&255)>>>0<240>>>0){if((k-b|0)<3){e=1;f=40;break b}m=a[b+1|0]|0;n=a[b+2|0]|0;if((l|0)==224){if(!((m&-32)<<24>>24==-96)){e=2;f=40;break b}}else if((l|0)==237){if(!((m&-32)<<24>>24==-128)){e=2;f=40;break b}}else{if(!((m&-64)<<24>>24==-128)){e=2;f=40;break b}}n=n&255;if((n&192|0)!=128){e=2;f=40;break b}l=(m&255)<<6&4032|l<<12&61440|n&63;if(l>>>0>j>>>0){e=2;f=40;break b}c[g>>2]=l;c[f>>2]=b+3;break}if(!((m&255)>>>0<245>>>0)){e=2;f=40;break b}if((k-b|0)<4){e=1;f=40;break b}m=a[b+1|0]|0;n=a[b+2|0]|0;o=a[b+3|0]|0;if((l|0)==240){if(!((m+112&255)>>>0<48>>>0)){e=2;f=40;break b}}else if((l|0)==244){if(!((m&-16)<<24>>24==-128)){e=2;f=40;break b}}else{if(!((m&-64)<<24>>24==-128)){e=2;f=40;break b}}n=n&255;if((n&192|0)!=128){e=2;f=40;break b}o=o&255;if((o&192|0)!=128){e=2;f=40;break b}l=(m&255)<<12&258048|l<<18&1835008|n<<6&4032|o&63;if(l>>>0>j>>>0){e=2;f=40;break b}c[g>>2]=l;c[f>>2]=b+4}}while(0);g=(c[i>>2]|0)+4|0;c[i>>2]=g;b=c[f>>2]|0;if(!(b>>>0<e>>>0)){break a}}if((f|0)==40){return e|0}}}while(0);o=b>>>0<e>>>0|0;return o|0}function am(b,c,e,f,g){b=b|0;c=c|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0;do{if((g&4|0)==0){i=b}else{if((c-b|0)<=2){i=b;break}if(!((a[b]|0)==-17)){i=b;break}if(!((a[b+1|0]|0)==-69)){i=b;break}i=(a[b+2|0]|0)==-65?b+3|0:b}}while(0);a:do{if(i>>>0<c>>>0&(e|0)!=0){g=c;h=0;b:while(1){k=a[i]|0;j=k&255;do{if(k<<24>>24>-1){if(j>>>0>f>>>0){break a}i=i+1|0}else{if((k&255)>>>0<194>>>0){break a}if((k&255)>>>0<224>>>0){if((g-i|0)<2){break a}k=d[i+1|0]|0;if((k&192|0)!=128){break a}if((k&63|j<<6&1984)>>>0>f>>>0){break a}i=i+2|0;break}if((k&255)>>>0<240>>>0){l=i;if((g-l|0)<3){break a}k=a[i+1|0]|0;m=a[i+2|0]|0;if((j|0)==237){if(!((k&-32)<<24>>24==-128)){f=23;break b}}else if((j|0)==224){if(!((k&-32)<<24>>24==-96)){f=21;break b}}else{if(!((k&-64)<<24>>24==-128)){f=25;break b}}l=m&255;if((l&192|0)!=128){break a}if(((k&255)<<6&4032|j<<12&61440|l&63)>>>0>f>>>0){break a}i=i+3|0;break}if(!((k&255)>>>0<245>>>0)){break a}m=i;if((g-m|0)<4){break a}k=a[i+1|0]|0;n=a[i+2|0]|0;l=a[i+3|0]|0;if((j|0)==244){if(!((k&-16)<<24>>24==-128)){f=35;break b}}else if((j|0)==240){if(!((k+112&255)>>>0<48>>>0)){f=33;break b}}else{if(!((k&-64)<<24>>24==-128)){f=37;break b}}m=n&255;if((m&192|0)!=128){break a}l=l&255;if((l&192|0)!=128){break a}if(((k&255)<<12&258048|j<<18&1835008|m<<6&4032|l&63)>>>0>f>>>0){break a}i=i+4|0}}while(0);h=h+1|0;if(!(i>>>0<c>>>0&h>>>0<e>>>0)){break a}}if((f|0)==21){n=l-b|0;return n|0}else if((f|0)==23){n=l-b|0;return n|0}else if((f|0)==25){n=l-b|0;return n|0}else if((f|0)==33){n=m-b|0;return n|0}else if((f|0)==35){n=m-b|0;return n|0}else if((f|0)==37){n=m-b|0;return n|0}}}while(0);n=i-b|0;return n|0}function bm(a){a=a|0;me(11836);me(11824);me(11812);me(11800);me(11788);me(11776);me(11764);me(11752);me(11740);me(11728);me(11716);me(11704);me(11692);me(11680);return}function cm(a){a=a|0;ye(11092);ye(11080);ye(11068);ye(11056);ye(11044);ye(11032);ye(11020);ye(11008);ye(10996);ye(10984);ye(10972);ye(10960);ye(10948);ye(10936);return}function dm(a){a=a|0;me(11668);me(11656);me(11644);me(11632);me(11620);me(11608);me(11596);me(11584);me(11572);me(11560);me(11548);me(11536);me(11524);me(11512);me(11500);me(11488);me(11476);me(11464);me(11452);me(11440);me(11428);me(11416);me(11404);me(11392);return}function em(a){a=a|0;ye(10924);ye(10912);ye(10900);ye(10888);ye(10876);ye(10864);ye(10852);ye(10840);ye(10828);ye(10816);ye(10804);ye(10792);ye(10780);ye(10768);ye(10756);ye(10744);ye(10732);ye(10720);ye(10708);ye(10696);ye(10684);ye(10672);ye(10660);ye(10648);return}function fm(a){a=a|0;me(12124);me(12112);me(12100);me(12088);me(12076);me(12064);me(12052);me(12040);me(12028);me(12016);me(12004);me(11992);me(11980);me(11968);me(11956);me(11944);me(11932);me(11920);me(11908);me(11896);me(11884);me(11872);me(11860);me(11848);return}function gm(a){a=a|0;ye(11380);ye(11368);ye(11356);ye(11344);ye(11332);ye(11320);ye(11308);ye(11296);ye(11284);ye(11272);ye(11260);ye(11248);ye(11236);ye(11224);ye(11212);ye(11200);ye(11188);ye(11176);ye(11164);ye(11152);ye(11140);ye(11128);ye(11116);ye(11104);return}function hm(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=i;i=i+32|0;g=e|0;h=e+8|0;m=e+16|0;l=e+24|0;n=b+52|0;if((a[n]|0)!=0){f=b+48|0;g=c[f>>2]|0;if(!d){w=g;i=e;return w|0}c[f>>2]=-1;a[n]=0;w=g;i=e;return w|0}n=c[b+44>>2]|0;t=(n|0)>1?n:1;a:do{if((t|0)>0){p=b+32|0;n=0;while(1){o=cb(c[p>>2]|0)|0;if((o|0)==-1){f=-1;break}a[g+n|0]=o;n=n+1|0;if((n|0)>=(t|0)){break a}}i=e;return f|0}}while(0);b:do{if((a[b+53|0]|0)==0){o=b+40|0;n=b+36|0;r=g|0;q=h+4|0;p=b+32|0;while(1){v=c[o>>2]|0;w=v;u=c[w>>2]|0;w=c[w+4>>2]|0;x=c[n>>2]|0;s=g+t|0;v=Jc[c[(c[x>>2]|0)+16>>2]&31](x,v,r,s,m,h,q,l)|0;if((v|0)==2){f=-1;j=22;break}else if((v|0)==3){j=14;break}else if((v|0)!=1){k=t;break b}x=c[o>>2]|0;c[x>>2]=u;c[x+4>>2]=w;if((t|0)==8){f=-1;j=22;break}u=cb(c[p>>2]|0)|0;if((u|0)==-1){f=-1;j=22;break}a[s]=u;t=t+1|0}if((j|0)==14){c[h>>2]=a[r]|0;k=t;break}else if((j|0)==22){i=e;return f|0}}else{c[h>>2]=a[g|0]|0;k=t}}while(0);if(d){x=c[h>>2]|0;c[b+48>>2]=x;i=e;return x|0}d=b+32|0;while(1){if((k|0)<=0){break}k=k-1|0;if(($b(a[g+k|0]|0,c[d>>2]|0)|0)==-1){f=-1;j=22;break}}if((j|0)==22){i=e;return f|0}x=c[h>>2]|0;i=e;return x|0}function im(b,e){b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+32|0;h=f|0;j=f+8|0;n=f+16|0;m=f+24|0;o=b+52|0;if((a[o]|0)!=0){g=b+48|0;h=c[g>>2]|0;if(!e){x=h;i=f;return x|0}c[g>>2]=-1;a[o]=0;x=h;i=f;return x|0}o=c[b+44>>2]|0;t=(o|0)>1?o:1;a:do{if((t|0)>0){q=b+32|0;o=0;while(1){p=cb(c[q>>2]|0)|0;if((p|0)==-1){k=-1;break}a[h+o|0]=p;o=o+1|0;if((o|0)>=(t|0)){break a}}i=f;return k|0}}while(0);b:do{if((a[b+53|0]|0)==0){r=b+40|0;q=b+36|0;o=h|0;p=j+1|0;s=b+32|0;while(1){w=c[r>>2]|0;x=w;v=c[x>>2]|0;x=c[x+4>>2]|0;y=c[q>>2]|0;u=h+t|0;w=Jc[c[(c[y>>2]|0)+16>>2]&31](y,w,o,u,n,j,p,m)|0;if((w|0)==3){m=14;break}else if((w|0)==2){k=-1;m=23;break}else if((w|0)!=1){l=t;break b}y=c[r>>2]|0;c[y>>2]=v;c[y+4>>2]=x;if((t|0)==8){k=-1;m=23;break}v=cb(c[s>>2]|0)|0;if((v|0)==-1){k=-1;m=23;break}a[u]=v;t=t+1|0}if((m|0)==14){a[j]=a[o]|0;l=t;break}else if((m|0)==23){i=f;return k|0}}else{a[j]=a[h|0]|0;l=t}}while(0);do{if(e){g=a[j]|0;c[b+48>>2]=g&255}else{e=b+32|0;while(1){if((l|0)<=0){m=21;break}l=l-1|0;if(($b(d[h+l|0]|0,c[e>>2]|0)|0)==-1){k=-1;m=23;break}}if((m|0)==21){g=a[j]|0;break}else if((m|0)==23){i=f;return k|0}}}while(0);y=g&255;i=f;return y|0}function jm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;j=g|0;if((b|0)==(d|0)){c[e>>2]=4;l=0;i=g;return l|0}k=Wb()|0;h=c[k>>2]|0;c[k>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);b=Mb(b|0,j|0,f|0,c[3042]|0)|0;f=L;l=c[k>>2]|0;if((l|0)==0){c[k>>2]=h}if((c[j>>2]|0)!=(d|0)){c[e>>2]=4;l=0;i=g;return l|0}do{if((l|0)==34){c[e>>2]=4;l=0;if((f|0)>(l|0)|(f|0)==(l|0)&b>>>0>0>>>0){h=2147483647}else{break}i=g;return h|0}else{l=-1;if((f|0)<(l|0)|(f|0)==(l|0)&b>>>0<-2147483648>>>0){c[e>>2]=4;break}l=0;if((f|0)>(l|0)|(f|0)==(l|0)&b>>>0>2147483647>>>0){c[e>>2]=4;l=2147483647;i=g;return l|0}else{l=b;i=g;return l|0}}}while(0);l=-2147483648;i=g;return l|0}function km(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;j=g|0;if((b|0)==(d|0)){c[e>>2]=4;b=0;l=0;i=g;return(L=b,l)|0}k=Wb()|0;h=c[k>>2]|0;c[k>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);b=Mb(b|0,j|0,f|0,c[3042]|0)|0;f=L;l=c[k>>2]|0;if((l|0)==0){c[k>>2]=h}if((c[j>>2]|0)!=(d|0)){c[e>>2]=4;b=0;l=0;i=g;return(L=b,l)|0}if((l|0)==34){c[e>>2]=4;h=0;h=(f|0)>(h|0)|(f|0)==(h|0)&b>>>0>0>>>0;i=g;return(L=h?2147483647:-2147483648,h?-1:0)|0}else{l=b;i=g;return(L=f,l)|0}return 0}function lm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;k=i;i=i+8|0;g=k|0;if((b|0)==(d|0)){c[e>>2]=4;l=0;i=k;return l|0}if((a[b]|0)==45){c[e>>2]=4;l=0;i=k;return l|0}h=Wb()|0;j=c[h>>2]|0;c[h>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);l=Jb(b|0,g|0,f|0,c[3042]|0)|0;b=L;f=c[h>>2]|0;if((f|0)==0){c[h>>2]=j}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;l=0;i=k;return l|0}j=0;if((f|0)==34|(b>>>0>j>>>0|b>>>0==j>>>0&l>>>0>65535>>>0)){c[e>>2]=4;l=-1;i=k;return l|0}else{l=l&65535;i=k;return l|0}return 0}function mm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;k=i;i=i+8|0;g=k|0;if((b|0)==(d|0)){c[e>>2]=4;l=0;i=k;return l|0}if((a[b]|0)==45){c[e>>2]=4;l=0;i=k;return l|0}h=Wb()|0;j=c[h>>2]|0;c[h>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);l=Jb(b|0,g|0,f|0,c[3042]|0)|0;b=L;f=c[h>>2]|0;if((f|0)==0){c[h>>2]=j}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;l=0;i=k;return l|0}j=0;if((f|0)==34|(b>>>0>j>>>0|b>>>0==j>>>0&l>>>0>-1>>>0)){c[e>>2]=4;l=-1;i=k;return l|0}else{i=k;return l|0}return 0}function nm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;k=i;i=i+8|0;g=k|0;if((b|0)==(d|0)){c[e>>2]=4;l=0;i=k;return l|0}if((a[b]|0)==45){c[e>>2]=4;l=0;i=k;return l|0}h=Wb()|0;j=c[h>>2]|0;c[h>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);l=Jb(b|0,g|0,f|0,c[3042]|0)|0;b=L;f=c[h>>2]|0;if((f|0)==0){c[h>>2]=j}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;l=0;i=k;return l|0}j=0;if((f|0)==34|(b>>>0>j>>>0|b>>>0==j>>>0&l>>>0>-1>>>0)){c[e>>2]=4;l=-1;i=k;return l|0}else{i=k;return l|0}return 0}function om(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0;g=i;i=i+8|0;h=g|0;do{if((b|0)==(d|0)){c[e>>2]=4;e=0;f=0}else{if((a[b]|0)==45){c[e>>2]=4;e=0;f=0;break}k=Wb()|0;j=c[k>>2]|0;c[k>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);f=Jb(b|0,h|0,f|0,c[3042]|0)|0;b=c[k>>2]|0;if((b|0)==0){c[k>>2]=j}if((c[h>>2]|0)!=(d|0)){c[e>>2]=4;e=0;f=0;break}if((b|0)!=34){e=L;break}c[e>>2]=4;e=-1;f=-1}}while(0);i=g;return(L=e,f)|0}function pm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}j=Wb()|0;h=c[j>>2]|0;c[j>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);k=+rn(b,g,c[3042]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=h}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}if((b|0)==34){c[e>>2]=4}i=f;return+k}function qm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}j=Wb()|0;h=c[j>>2]|0;c[j>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);k=+rn(b,g,c[3042]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=h}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}if((b|0)!=34){i=f;return+k}c[e>>2]=4;i=f;return+k}function rm(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0.0;f=i;i=i+8|0;g=f|0;if((b|0)==(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}j=Wb()|0;h=c[j>>2]|0;c[j>>2]=0;do{if((a[14272]|0)==0){if((sb(14272)|0)==0){break}c[3042]=Va(2147483647,168,0)|0}}while(0);k=+rn(b,g,c[3042]|0);b=c[j>>2]|0;if((b|0)==0){c[j>>2]=h}if((c[g>>2]|0)!=(d|0)){c[e>>2]=4;k=0.0;i=f;return+k}if((b|0)!=34){i=f;return+k}c[e>>2]=4;i=f;return+k}function sm(a,b,c){a=a|0;b=b|0;c=c|0;return tm(0,a,b,(c|0)!=0?c:10152)|0}function tm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;f=((f|0)==0?10144:f)|0;k=c[f>>2]|0;a:do{if((d|0)==0){if((k|0)==0){e=0}else{break}i=g;return e|0}else{if((b|0)==0){j=h;c[h>>2]=j;h=j}else{h=b}if((e|0)==0){k=-2;i=g;return k|0}do{if((k|0)==0){b=a[d]|0;j=b&255;if(b<<24>>24>-1){c[h>>2]=j;k=b<<24>>24!=0|0;i=g;return k|0}else{b=j-194|0;if(b>>>0>50>>>0){break a}d=d+1|0;k=c[2240+(b<<2)>>2]|0;j=e-1|0;break}}else{j=e}}while(0);b:do{if((j|0)!=0){b=a[d]|0;l=(b&255)>>>3;if((l-16|l+(k>>26))>>>0>7>>>0){break a}while(1){d=d+1|0;k=(b&255)-128|k<<6;j=j-1|0;if((k|0)>=0){break}if((j|0)==0){break b}b=a[d]|0;if(!((b&-64)<<24>>24==-128)){break a}}c[f>>2]=0;c[h>>2]=k;l=e-j|0;i=g;return l|0}}while(0);c[f>>2]=k;l=-2;i=g;return l|0}}while(0);c[f>>2]=0;c[(Wb()|0)>>2]=84;l=-1;i=g;return l|0}function um(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+1032|0;j=g+1024|0;n=c[b>>2]|0;c[j>>2]=n;h=(a|0)!=0;l=g|0;e=h?e:256;m=h?a:l;a:do{if((n|0)!=0&(e|0)!=0){a=0;while(1){o=d>>>2;p=o>>>0>=e>>>0;if(!(p|d>>>0>131>>>0)){l=e;k=7;break a}n=p?e:o;d=d-n|0;n=vm(m,j,n,f)|0;if((n|0)==-1){a=-1;break a}if((m|0)==(l|0)){m=l}else{m=m+(n<<2)|0;e=e-n|0}a=n+a|0;n=c[j>>2]|0;if(!((n|0)!=0&(e|0)!=0)){l=e;k=7;break}}}else{l=e;a=0;k=7}}while(0);b:do{if((k|0)==7){if(!((n|0)!=0&(l|0)!=0&(d|0)!=0)){break}while(1){k=tm(m,n,d,f)|0;if((k+2|0)>>>0<3>>>0){break}n=(c[j>>2]|0)+k|0;c[j>>2]=n;l=l-1|0;a=a+1|0;if((l|0)!=0&(d|0)!=(k|0)){d=d-k|0;m=m+4|0}else{break b}}if((k|0)==(-1|0)){a=-1;break}else if((k|0)==0){c[j>>2]=0;break}else{c[f>>2]=0;break}}}while(0);if(!h){i=g;return a|0}c[b>>2]=c[j>>2];i=g;return a|0}function vm(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;i=c[e>>2]|0;do{if((g|0)==0){g=5}else{g=g|0;j=c[g>>2]|0;if((j|0)==0){g=5;break}if((b|0)==0){h=f;g=16;break}c[g>>2]=0;h=f;g=35}}while(0);if((g|0)==5){if((b|0)==0){h=f;g=7}else{h=f;g=6}}a:while(1){if((g|0)==6){if((h|0)==0){g=52;break}else{g=i}while(1){i=a[g]|0;b:do{if(((i&255)-1|0)>>>0<127>>>0){if(!((g&3|0)==0&h>>>0>3>>>0)){break}while(1){i=c[g>>2]|0;if(((i-16843009|i)&-2139062144|0)!=0){i=i&255;break b}c[b>>2]=i&255;c[b+4>>2]=d[g+1|0]|0;c[b+8>>2]=d[g+2|0]|0;i=g+4|0;j=b+16|0;c[b+12>>2]=d[g+3|0]|0;h=h-4|0;if(h>>>0>3>>>0){g=i;b=j}else{break}}g=i;b=j;i=a[i]|0}}while(0);i=i&255;if(!((i-1|0)>>>0<127>>>0)){break}c[b>>2]=i;h=h-1|0;if((h|0)==0){g=52;break a}else{b=b+4|0;g=g+1|0}}i=i-194|0;if(i>>>0>50>>>0){i=g;g=46;break}j=c[2240+(i<<2)>>2]|0;i=g+1|0;g=35;continue}else if((g|0)==7){g=a[i]|0;do{if(((g&255)-1|0)>>>0<127>>>0){if((i&3|0)!=0){break}g=c[i>>2]|0;if(((g-16843009|g)&-2139062144|0)!=0){g=g&255;break}do{i=i+4|0;h=h-4|0;g=c[i>>2]|0;}while(((g-16843009|g)&-2139062144|0)==0);g=g&255}}while(0);g=g&255;if((g-1|0)>>>0<127>>>0){i=i+1|0;h=h-1|0;g=7;continue}g=g-194|0;if(g>>>0>50>>>0){g=46;break}j=c[2240+(g<<2)>>2]|0;i=i+1|0;g=16;continue}else if((g|0)==16){k=(d[i]|0)>>>3;if((k-16|k+(j>>26))>>>0>7>>>0){g=17;break}g=i+1|0;do{if((j&33554432|0)==0){i=g}else{if(!((a[g]&-64)<<24>>24==-128)){g=20;break a}g=i+2|0;if((j&524288|0)==0){i=g;break}if(!((a[g]&-64)<<24>>24==-128)){g=23;break a}i=i+3|0}}while(0);h=h-1|0;g=7;continue}else if((g|0)==35){k=d[i]|0;g=k>>>3;if((g-16|g+(j>>26))>>>0>7>>>0){g=36;break}g=i+1|0;j=k-128|j<<6;do{if((j|0)<0){k=d[g]|0;if((k&192|0)!=128){g=39;break a}g=i+2|0;j=k-128|j<<6;if((j|0)>=0){i=g;break}g=d[g]|0;if((g&192|0)!=128){g=42;break a}j=g-128|j<<6;i=i+3|0}else{i=g}}while(0);c[b>>2]=j;b=b+4|0;h=h-1|0;g=6;continue}}if((g|0)==17){i=i-1|0;g=45}else if((g|0)==20){i=i-1|0;g=45}else if((g|0)==23){i=i-1|0;g=45}else if((g|0)==36){i=i-1|0;g=45}else if((g|0)==39){i=i-1|0;g=45}else if((g|0)==42){i=i-1|0;g=45}else if((g|0)==52){return f|0}if((g|0)==45){if((j|0)==0){g=46}}do{if((g|0)==46){if((a[i]|0)!=0){break}if((b|0)!=0){c[b>>2]=0;c[e>>2]=0}k=f-h|0;return k|0}}while(0);c[(Wb()|0)>>2]=84;if((b|0)==0){k=-1;return k|0}c[e>>2]=i;k=-1;return k|0}function wm(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0;g=i;i=i+8|0;h=g|0;c[h>>2]=b;if((e|0)==0){j=0;i=g;return j|0}do{if((f|0)!=0){if((b|0)==0){j=h;c[h>>2]=j;h=j}else{h=b}b=a[e]|0;j=b&255;if(b<<24>>24>-1){c[h>>2]=j;j=b<<24>>24!=0|0;i=g;return j|0}j=j-194|0;if(j>>>0>50>>>0){break}b=e+1|0;j=c[2240+(j<<2)>>2]|0;if(f>>>0<4>>>0){if((j&-2147483648>>>(((f*6|0)-6|0)>>>0)|0)!=0){break}}f=d[b]|0;b=f>>>3;if((b-16|b+(j>>26))>>>0>7>>>0){break}f=f-128|j<<6;if((f|0)>=0){c[h>>2]=f;j=2;i=g;return j|0}b=d[e+2|0]|0;if((b&192|0)!=128){break}f=b-128|f<<6;if((f|0)>=0){c[h>>2]=f;j=3;i=g;return j|0}e=d[e+3|0]|0;if((e&192|0)!=128){break}c[h>>2]=e-128|f<<6;j=4;i=g;return j|0}}while(0);c[(Wb()|0)>>2]=84;j=-1;i=g;return j|0}function xm(b,d,e){b=b|0;d=d|0;e=e|0;if((b|0)==0){e=1;return e|0}if(d>>>0<128>>>0){a[b]=d;e=1;return e|0}if(d>>>0<2048>>>0){a[b]=d>>>6|192;a[b+1|0]=d&63|128;e=2;return e|0}if(d>>>0<55296>>>0|(d&-8192|0)==57344){a[b]=d>>>12|224;a[b+1|0]=d>>>6&63|128;a[b+2|0]=d&63|128;e=3;return e|0}if((d-65536|0)>>>0<1048576>>>0){a[b]=d>>>18|240;a[b+1|0]=d>>>12&63|128;a[b+2|0]=d>>>6&63|128;a[b+3|0]=d&63|128;e=4;return e|0}else{c[(Wb()|0)>>2]=84;e=-1;return e|0}return 0}function ym(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0;g=i;i=i+264|0;f=g+256|0;k=g|0;l=c[b>>2]|0;c[f>>2]=l;h=(a|0)!=0;e=h?e:256;m=h?a:k;a:do{if((l|0)!=0&(e|0)!=0){a=0;while(1){n=d>>>0>=e>>>0;if(!(n|d>>>0>32>>>0)){j=7;break a}l=n?e:d;d=d-l|0;l=zm(m,f,l,0)|0;if((l|0)==-1){a=-1;break a}if((m|0)==(k|0)){m=k}else{m=m+l|0;e=e-l|0}a=l+a|0;l=c[f>>2]|0;if(!((l|0)!=0&(e|0)!=0)){j=7;break}}}else{a=0;j=7}}while(0);b:do{if((j|0)==7){if(!((l|0)!=0&(e|0)!=0&(d|0)!=0)){break}while(1){j=xm(m,c[l>>2]|0,0)|0;if((j+1|0)>>>0<2>>>0){break}l=(c[f>>2]|0)+4|0;c[f>>2]=l;d=d-1|0;a=a+1|0;if((e|0)!=(j|0)&(d|0)!=0){m=m+j|0;e=e-j|0}else{break b}}if((j|0)!=0){a=-1;break}c[f>>2]=0}}while(0);if(!h){i=g;return a|0}c[b>>2]=c[f>>2];i=g;return a|0}function zm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;j=f|0;if((b|0)==0){l=c[d>>2]|0;k=j|0;m=c[l>>2]|0;if((m|0)==0){m=0;i=f;return m|0}else{h=0}while(1){if(m>>>0>127>>>0){m=xm(k,m,0)|0;if((m|0)==-1){h=-1;l=26;break}}else{m=1}h=m+h|0;l=l+4|0;m=c[l>>2]|0;if((m|0)==0){l=26;break}}if((l|0)==26){i=f;return h|0}}a:do{if(e>>>0>3>>>0){k=e;l=c[d>>2]|0;while(1){m=c[l>>2]|0;if((m|0)==0){break a}if(m>>>0>127>>>0){m=xm(b,m,0)|0;if((m|0)==-1){h=-1;break}b=b+m|0;k=k-m|0}else{a[b]=m;b=b+1|0;k=k-1|0;l=c[d>>2]|0}l=l+4|0;c[d>>2]=l;if(!(k>>>0>3>>>0)){break a}}i=f;return h|0}else{k=e}}while(0);b:do{if((k|0)==0){g=0}else{j=j|0;l=c[d>>2]|0;while(1){m=c[l>>2]|0;if((m|0)==0){l=24;break}if(m>>>0>127>>>0){m=xm(j,m,0)|0;if((m|0)==-1){h=-1;l=26;break}if(k>>>0<m>>>0){l=20;break}xm(b,c[l>>2]|0,0)|0;b=b+m|0;k=k-m|0}else{a[b]=m;b=b+1|0;k=k-1|0;l=c[d>>2]|0}l=l+4|0;c[d>>2]=l;if((k|0)==0){g=0;break b}}if((l|0)==20){m=e-k|0;i=f;return m|0}else if((l|0)==24){a[b]=0;g=k;break}else if((l|0)==26){i=f;return h|0}}}while(0);c[d>>2]=0;m=e-g|0;i=f;return m|0}function Am(a){a=a|0;var b=0;b=a;while(1){if((c[b>>2]|0)==0){break}else{b=b+4|0}}return b-a>>2|0}function Bm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((d|0)==0){return a|0}else{e=d;d=a}while(1){e=e-1|0;c[d>>2]=c[b>>2];if((e|0)==0){break}else{b=b+4|0;d=d+4|0}}return a|0}function Cm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=(d|0)==0;if(a-b>>2>>>0<d>>>0){if(e){return a|0}do{d=d-1|0;c[a+(d<<2)>>2]=c[b+(d<<2)>>2];}while((d|0)!=0);return a|0}else{if(e){return a|0}else{e=a}while(1){d=d-1|0;c[e>>2]=c[b>>2];if((d|0)==0){break}else{b=b+4|0;e=e+4|0}}return a|0}return 0}function Dm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;if((d|0)==0){return a|0}else{e=a}while(1){d=d-1|0;c[e>>2]=b;if((d|0)==0){break}else{e=e+4|0}}return a|0}function Em(a){a=a|0;return}function Fm(a){a=a|0;c[a>>2]=2792;return}function Gm(a){a=a|0;dn(a);return}function Hm(a){a=a|0;return}function Im(a){a=a|0;return 1472}function Jm(a){a=a|0;Em(a|0);return}function Km(a){a=a|0;return}function Lm(a){a=a|0;return}function Mm(a){a=a|0;Em(a|0);dn(a);return}function Nm(a){a=a|0;Em(a|0);dn(a);return}function Om(a){a=a|0;Em(a|0);dn(a);return}function Pm(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=i;i=i+56|0;f=e|0;if((a|0)==(b|0)){g=1;i=e;return g|0}if((b|0)==0){g=0;i=e;return g|0}g=Tm(b,9984,9968,0)|0;b=g;if((g|0)==0){g=0;i=e;return g|0}zn(f|0,0,56)|0;c[f>>2]=b;c[f+8>>2]=a;c[f+12>>2]=-1;c[f+48>>2]=1;Pc[c[(c[g>>2]|0)+28>>2]&15](b,f,c[d>>2]|0,1);if((c[f+24>>2]|0)!=1){g=0;i=e;return g|0}c[d>>2]=c[f+16>>2];g=1;i=e;return g|0}function Qm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((c[d+8>>2]|0)!=(b|0)){return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){g=d+36|0;c[g>>2]=(c[g>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function Rm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0;if((b|0)!=(c[d+8>>2]|0)){g=c[b+8>>2]|0;Pc[c[(c[g>>2]|0)+28>>2]&15](g,d,e,f);return}b=d+16|0;g=c[b>>2]|0;if((g|0)==0){c[b>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){g=d+36|0;c[g>>2]=(c[g>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}function Sm(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;if((b|0)==(c[d+8>>2]|0)){h=d+16|0;g=c[h>>2]|0;if((g|0)==0){c[h>>2]=e;c[d+24>>2]=f;c[d+36>>2]=1;return}if((g|0)!=(e|0)){k=d+36|0;c[k>>2]=(c[k>>2]|0)+1;c[d+24>>2]=2;a[d+54|0]=1;return}e=d+24|0;if((c[e>>2]|0)!=2){return}c[e>>2]=f;return}h=c[b+12>>2]|0;g=b+16+(h<<3)|0;i=c[b+20>>2]|0;j=i>>8;if((i&1|0)!=0){j=c[(c[e>>2]|0)+j>>2]|0}k=c[b+16>>2]|0;Pc[c[(c[k>>2]|0)+28>>2]&15](k,d,e+j|0,(i&2|0)!=0?f:2);if((h|0)<=1){return}i=d+54|0;h=e;b=b+24|0;while(1){j=c[b+4>>2]|0;k=j>>8;if((j&1|0)!=0){k=c[(c[h>>2]|0)+k>>2]|0}l=c[b>>2]|0;Pc[c[(c[l>>2]|0)+28>>2]&15](l,d,e+k|0,(j&2|0)!=0?f:2);if((a[i]|0)!=0){f=16;break}b=b+8|0;if(!(b>>>0<g>>>0)){f=16;break}}if((f|0)==16){return}}function Tm(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+56|0;g=f|0;k=c[a>>2]|0;h=a+(c[k-8>>2]|0)|0;k=c[k-4>>2]|0;j=k;c[g>>2]=d;c[g+4>>2]=a;c[g+8>>2]=b;c[g+12>>2]=e;m=g+16|0;a=g+24|0;e=g+28|0;l=g+32|0;b=g+40|0;zn(m|0,0,39)|0;if((k|0)==(d|0)){c[g+48>>2]=1;Mc[c[(c[k>>2]|0)+20>>2]&31](j,g,h,h,1,0);m=(c[a>>2]|0)==1?h:0;i=f;return m|0}yc[c[(c[k>>2]|0)+24>>2]&7](j,g,h,1,0);d=c[g+36>>2]|0;if((d|0)==0){m=(c[b>>2]|0)==1&(c[e>>2]|0)==1&(c[l>>2]|0)==1?c[g+20>>2]|0:0;i=f;return m|0}else if((d|0)==1){do{if((c[a>>2]|0)!=1){if((c[b>>2]|0)==0&(c[e>>2]|0)==1&(c[l>>2]|0)==1){break}else{g=0}i=f;return g|0}}while(0);m=c[m>>2]|0;i=f;return m|0}else{m=0;i=f;return m|0}return 0}function Um(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;j=b|0;if((j|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}e=d+28|0;if((c[e>>2]|0)==1){return}c[e>>2]=f;return}if((j|0)==(c[d>>2]|0)){do{if((c[d+16>>2]|0)!=(e|0)){j=d+20|0;if((c[j>>2]|0)==(e|0)){break}c[d+32>>2]=f;k=d+44|0;if((c[k>>2]|0)==4){return}v=c[b+12>>2]|0;m=b+16+(v<<3)|0;a:do{if((v|0)>0){q=d+52|0;r=d+53|0;s=d+54|0;p=b+8|0;l=d+24|0;n=e;o=0;b=b+16|0;t=0;b:do{a[q]=0;a[r]=0;u=c[b+4>>2]|0;v=u>>8;if((u&1|0)!=0){v=c[(c[n>>2]|0)+v>>2]|0}w=c[b>>2]|0;Mc[c[(c[w>>2]|0)+20>>2]&31](w,d,e,e+v|0,2-(u>>>1&1)|0,g);if((a[s]|0)!=0){break}do{if((a[r]|0)!=0){if((a[q]|0)==0){if((c[p>>2]&1|0)==0){t=1;break b}else{t=1;break}}if((c[l>>2]|0)==1){l=27;break a}if((c[p>>2]&2|0)==0){l=27;break a}else{t=1;o=1}}}while(0);b=b+8|0;}while(b>>>0<m>>>0);if(o){i=t;l=26}else{h=t;l=23}}else{h=0;l=23}}while(0);do{if((l|0)==23){c[j>>2]=e;w=d+40|0;c[w>>2]=(c[w>>2]|0)+1;if((c[d+36>>2]|0)!=1){i=h;l=26;break}if((c[d+24>>2]|0)!=2){i=h;l=26;break}a[d+54|0]=1;if(h){l=27}else{l=28}}}while(0);if((l|0)==26){if(i){l=27}else{l=28}}if((l|0)==27){c[k>>2]=3;return}else if((l|0)==28){c[k>>2]=4;return}}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}j=c[b+12>>2]|0;h=b+16+(j<<3)|0;i=c[b+20>>2]|0;k=i>>8;if((i&1|0)!=0){k=c[(c[e>>2]|0)+k>>2]|0}w=c[b+16>>2]|0;yc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+k|0,(i&2|0)!=0?f:2,g);i=b+24|0;if((j|0)<=1){return}k=c[b+8>>2]|0;do{if((k&2|0)==0){j=d+36|0;if((c[j>>2]|0)==1){break}if((k&1|0)==0){l=d+54|0;k=e;n=i;while(1){if((a[l]|0)!=0){l=53;break}if((c[j>>2]|0)==1){l=53;break}m=c[n+4>>2]|0;o=m>>8;if((m&1|0)!=0){o=c[(c[k>>2]|0)+o>>2]|0}w=c[n>>2]|0;yc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+o|0,(m&2|0)!=0?f:2,g);n=n+8|0;if(!(n>>>0<h>>>0)){l=53;break}}if((l|0)==53){return}}m=d+24|0;l=d+54|0;k=e;o=i;while(1){if((a[l]|0)!=0){l=53;break}if((c[j>>2]|0)==1){if((c[m>>2]|0)==1){l=53;break}}n=c[o+4>>2]|0;p=n>>8;if((n&1|0)!=0){p=c[(c[k>>2]|0)+p>>2]|0}w=c[o>>2]|0;yc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+p|0,(n&2|0)!=0?f:2,g);o=o+8|0;if(!(o>>>0<h>>>0)){l=53;break}}if((l|0)==53){return}}}while(0);j=d+54|0;k=e;while(1){if((a[j]|0)!=0){l=53;break}l=c[i+4>>2]|0;m=l>>8;if((l&1|0)!=0){m=c[(c[k>>2]|0)+m>>2]|0}w=c[i>>2]|0;yc[c[(c[w>>2]|0)+24>>2]&7](w,d,e+m|0,(l&2|0)!=0?f:2,g);i=i+8|0;if(!(i>>>0<h>>>0)){l=53;break}}if((l|0)==53){return}}function Vm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;i=b|0;if((i|0)==(c[d+8>>2]|0)){if((c[d+4>>2]|0)!=(e|0)){return}h=d+28|0;if((c[h>>2]|0)==1){return}c[h>>2]=f;return}if((i|0)!=(c[d>>2]|0)){j=c[b+8>>2]|0;yc[c[(c[j>>2]|0)+24>>2]&7](j,d,e,f,g);return}do{if((c[d+16>>2]|0)!=(e|0)){i=d+20|0;if((c[i>>2]|0)==(e|0)){break}c[d+32>>2]=f;f=d+44|0;if((c[f>>2]|0)==4){return}j=d+52|0;a[j]=0;k=d+53|0;a[k]=0;b=c[b+8>>2]|0;Mc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,e,1,g);if((a[k]|0)==0){b=0;h=13}else{if((a[j]|0)==0){b=1;h=13}}a:do{if((h|0)==13){c[i>>2]=e;k=d+40|0;c[k>>2]=(c[k>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){h=16;break}a[d+54|0]=1;if(b){break a}}else{h=16}}while(0);if((h|0)==16){if(b){break}}c[f>>2]=4;return}}while(0);c[f>>2]=3;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function Wm(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;if((c[d+8>>2]|0)==(b|0)){if((c[d+4>>2]|0)!=(e|0)){return}d=d+28|0;if((c[d>>2]|0)==1){return}c[d>>2]=f;return}if((c[d>>2]|0)!=(b|0)){return}do{if((c[d+16>>2]|0)!=(e|0)){b=d+20|0;if((c[b>>2]|0)==(e|0)){break}c[d+32>>2]=f;c[b>>2]=e;g=d+40|0;c[g>>2]=(c[g>>2]|0)+1;do{if((c[d+36>>2]|0)==1){if((c[d+24>>2]|0)!=2){break}a[d+54|0]=1}}while(0);c[d+44>>2]=4;return}}while(0);if((f|0)!=1){return}c[d+32>>2]=1;return}function Xm(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;if((b|0)!=(c[d+8>>2]|0)){k=d+52|0;j=a[k]|0;m=d+53|0;l=a[m]|0;o=c[b+12>>2]|0;i=b+16+(o<<3)|0;a[k]=0;a[m]=0;n=c[b+20>>2]|0;p=n>>8;if((n&1|0)!=0){p=c[(c[f>>2]|0)+p>>2]|0}s=c[b+16>>2]|0;Mc[c[(c[s>>2]|0)+20>>2]&31](s,d,e,f+p|0,(n&2|0)!=0?g:2,h);a:do{if((o|0)>1){p=d+24|0;o=b+8|0;q=d+54|0;n=f;b=b+24|0;do{if((a[q]|0)!=0){break a}do{if((a[k]|0)==0){if((a[m]|0)==0){break}if((c[o>>2]&1|0)==0){break a}}else{if((c[p>>2]|0)==1){break a}if((c[o>>2]&2|0)==0){break a}}}while(0);a[k]=0;a[m]=0;r=c[b+4>>2]|0;s=r>>8;if((r&1|0)!=0){s=c[(c[n>>2]|0)+s>>2]|0}t=c[b>>2]|0;Mc[c[(c[t>>2]|0)+20>>2]&31](t,d,e,f+s|0,(r&2|0)!=0?g:2,h);b=b+8|0;}while(b>>>0<i>>>0)}}while(0);a[k]=j;a[m]=l;return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;i=d+16|0;j=c[i>>2]|0;if((j|0)==0){c[i>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((j|0)!=(e|0)){t=d+36|0;c[t>>2]=(c[t>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;i=c[e>>2]|0;if((i|0)==2){c[e>>2]=g}else{g=i}if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}function Ym(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;if((b|0)!=(c[d+8>>2]|0)){b=c[b+8>>2]|0;Mc[c[(c[b>>2]|0)+20>>2]&31](b,d,e,f,g,h);return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;b=d+16|0;f=c[b>>2]|0;if((f|0)==0){c[b>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((f|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;b=c[e>>2]|0;if((b|0)==2){c[e>>2]=g}else{g=b}if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}function Zm(b,d,e,f,g,h){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;if((c[d+8>>2]|0)!=(b|0)){return}a[d+53|0]=1;if((c[d+4>>2]|0)!=(f|0)){return}a[d+52|0]=1;f=d+16|0;b=c[f>>2]|0;if((b|0)==0){c[f>>2]=e;c[d+24>>2]=g;c[d+36>>2]=1;if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}if((b|0)!=(e|0)){h=d+36|0;c[h>>2]=(c[h>>2]|0)+1;a[d+54|0]=1;return}e=d+24|0;f=c[e>>2]|0;if((f|0)==2){c[e>>2]=g}else{g=f}if(!((c[d+48>>2]|0)==1&(g|0)==1)){return}a[d+54|0]=1;return}



function _m(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){a=16}else{a=a+11&-8}b=a>>>3;e=c[2544]|0;g=e>>>(b>>>0);if((g&3|0)!=0){h=(g&1^1)+b|0;g=h<<1;d=10216+(g<<2)|0;g=10216+(g+2<<2)|0;a=c[g>>2]|0;b=a+8|0;f=c[b>>2]|0;do{if((d|0)==(f|0)){c[2544]=e&~(1<<h)}else{if(f>>>0<(c[2548]|0)>>>0){gc();return 0}e=f+12|0;if((c[e>>2]|0)==(a|0)){c[e>>2]=d;c[g>>2]=f;break}else{gc();return 0}}}while(0);r=h<<3;c[a+4>>2]=r|3;r=a+(r|4)|0;c[r>>2]=c[r>>2]|1;r=b;return r|0}f=c[2546]|0;if(!(a>>>0>f>>>0)){break}if((g|0)!=0){h=2<<b;h=g<<b&(h|-h);h=(h&-h)-1|0;b=h>>>12&16;h=h>>>(b>>>0);i=h>>>5&8;h=h>>>(i>>>0);g=h>>>2&4;h=h>>>(g>>>0);j=h>>>1&2;h=h>>>(j>>>0);d=h>>>1&1;d=(i|b|g|j|d)+(h>>>(d>>>0))|0;h=d<<1;j=10216+(h<<2)|0;h=10216+(h+2<<2)|0;g=c[h>>2]|0;b=g+8|0;i=c[b>>2]|0;do{if((j|0)==(i|0)){c[2544]=e&~(1<<d)}else{if(i>>>0<(c[2548]|0)>>>0){gc();return 0}e=i+12|0;if((c[e>>2]|0)==(g|0)){c[e>>2]=j;c[h>>2]=i;f=c[2546]|0;break}else{gc();return 0}}}while(0);r=d<<3;d=r-a|0;c[g+4>>2]=a|3;q=g;e=q+a|0;c[q+(a|4)>>2]=d|1;c[q+r>>2]=d;if((f|0)!=0){a=c[2549]|0;i=f>>>3;h=i<<1;f=10216+(h<<2)|0;g=c[2544]|0;i=1<<i;do{if((g&i|0)==0){c[2544]=g|i;g=f;h=10216+(h+2<<2)|0}else{h=10216+(h+2<<2)|0;g=c[h>>2]|0;if(!(g>>>0<(c[2548]|0)>>>0)){break}gc();return 0}}while(0);c[h>>2]=a;c[g+12>>2]=a;c[a+8>>2]=g;c[a+12>>2]=f}c[2546]=d;c[2549]=e;r=b;return r|0}b=c[2545]|0;if((b|0)==0){break}e=(b&-b)-1|0;q=e>>>12&16;e=e>>>(q>>>0);p=e>>>5&8;e=e>>>(p>>>0);r=e>>>2&4;e=e>>>(r>>>0);d=e>>>1&2;e=e>>>(d>>>0);b=e>>>1&1;b=c[10480+((p|q|r|d|b)+(e>>>(b>>>0))<<2)>>2]|0;e=b;d=b;b=(c[b+4>>2]&-8)-a|0;while(1){f=c[e+16>>2]|0;if((f|0)==0){f=c[e+20>>2]|0;if((f|0)==0){break}}g=(c[f+4>>2]&-8)-a|0;h=g>>>0<b>>>0;e=f;d=h?f:d;b=h?g:b}f=d;h=c[2548]|0;if(f>>>0<h>>>0){gc();return 0}r=f+a|0;e=r;if(!(f>>>0<r>>>0)){gc();return 0}g=c[d+24>>2]|0;i=c[d+12>>2]|0;do{if((i|0)==(d|0)){j=d+20|0;i=c[j>>2]|0;if((i|0)==0){j=d+16|0;i=c[j>>2]|0;if((i|0)==0){i=0;break}}while(1){k=i+20|0;l=c[k>>2]|0;if((l|0)!=0){i=l;j=k;continue}k=i+16|0;l=c[k>>2]|0;if((l|0)==0){break}else{i=l;j=k}}if(j>>>0<h>>>0){gc();return 0}else{c[j>>2]=0;break}}else{j=c[d+8>>2]|0;if(j>>>0<h>>>0){gc();return 0}k=j+12|0;if((c[k>>2]|0)!=(d|0)){gc();return 0}h=i+8|0;if((c[h>>2]|0)==(d|0)){c[k>>2]=i;c[h>>2]=j;break}else{gc();return 0}}}while(0);a:do{if((g|0)!=0){j=c[d+28>>2]|0;h=10480+(j<<2)|0;do{if((d|0)==(c[h>>2]|0)){c[h>>2]=i;if((i|0)!=0){break}c[2545]=c[2545]&~(1<<j);break a}else{if(g>>>0<(c[2548]|0)>>>0){gc();return 0}h=g+16|0;if((c[h>>2]|0)==(d|0)){c[h>>2]=i}else{c[g+20>>2]=i}if((i|0)==0){break a}}}while(0);h=c[2548]|0;if(i>>>0<h>>>0){gc();return 0}c[i+24>>2]=g;g=c[d+16>>2]|0;do{if((g|0)!=0){if(g>>>0<h>>>0){gc();return 0}else{c[i+16>>2]=g;c[g+24>>2]=i;break}}}while(0);g=c[d+20>>2]|0;if((g|0)==0){break}if(g>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[i+20>>2]=g;c[g+24>>2]=i;break}}}while(0);if(b>>>0<16>>>0){r=b+a|0;c[d+4>>2]=r|3;r=f+(r+4)|0;c[r>>2]=c[r>>2]|1}else{c[d+4>>2]=a|3;c[f+(a|4)>>2]=b|1;c[f+(b+a)>>2]=b;f=c[2546]|0;if((f|0)!=0){a=c[2549]|0;i=f>>>3;g=i<<1;f=10216+(g<<2)|0;h=c[2544]|0;i=1<<i;do{if((h&i|0)==0){c[2544]=h|i;h=f;g=10216+(g+2<<2)|0}else{g=10216+(g+2<<2)|0;h=c[g>>2]|0;if(!(h>>>0<(c[2548]|0)>>>0)){break}gc();return 0}}while(0);c[g>>2]=a;c[h+12>>2]=a;c[a+8>>2]=h;c[a+12>>2]=f}c[2546]=b;c[2549]=e}r=d+8|0;return r|0}else{if(a>>>0>4294967231>>>0){a=-1;break}b=a+11|0;a=b&-8;f=c[2545]|0;if((f|0)==0){break}e=-a|0;b=b>>>8;do{if((b|0)==0){g=0}else{if(a>>>0>16777215>>>0){g=31;break}q=(b+1048320|0)>>>16&8;r=b<<q;p=(r+520192|0)>>>16&4;r=r<<p;g=(r+245760|0)>>>16&2;g=14-(p|q|g)+(r<<g>>>15)|0;g=a>>>((g+7|0)>>>0)&1|g<<1}}while(0);h=c[10480+(g<<2)>>2]|0;b:do{if((h|0)==0){b=0;j=0}else{if((g|0)==31){i=0}else{i=25-(g>>>1)|0}b=0;i=a<<i;j=0;while(1){l=c[h+4>>2]&-8;k=l-a|0;if(k>>>0<e>>>0){if((l|0)==(a|0)){b=h;e=k;j=h;break b}else{b=h;e=k}}k=c[h+20>>2]|0;h=c[h+16+(i>>>31<<2)>>2]|0;j=(k|0)==0|(k|0)==(h|0)?j:k;if((h|0)==0){break}else{i=i<<1}}}}while(0);if((j|0)==0&(b|0)==0){r=2<<g;f=f&(r|-r);if((f|0)==0){break}r=(f&-f)-1|0;o=r>>>12&16;r=r>>>(o>>>0);n=r>>>5&8;r=r>>>(n>>>0);p=r>>>2&4;r=r>>>(p>>>0);q=r>>>1&2;r=r>>>(q>>>0);j=r>>>1&1;j=c[10480+((n|o|p|q|j)+(r>>>(j>>>0))<<2)>>2]|0}if((j|0)!=0){while(1){g=(c[j+4>>2]&-8)-a|0;f=g>>>0<e>>>0;e=f?g:e;b=f?j:b;f=c[j+16>>2]|0;if((f|0)!=0){j=f;continue}j=c[j+20>>2]|0;if((j|0)==0){break}}}if((b|0)==0){break}if(!(e>>>0<((c[2546]|0)-a|0)>>>0)){break}d=b;i=c[2548]|0;if(d>>>0<i>>>0){gc();return 0}g=d+a|0;f=g;if(!(d>>>0<g>>>0)){gc();return 0}h=c[b+24>>2]|0;j=c[b+12>>2]|0;do{if((j|0)==(b|0)){k=b+20|0;j=c[k>>2]|0;if((j|0)==0){k=b+16|0;j=c[k>>2]|0;if((j|0)==0){j=0;break}}while(1){l=j+20|0;m=c[l>>2]|0;if((m|0)!=0){j=m;k=l;continue}l=j+16|0;m=c[l>>2]|0;if((m|0)==0){break}else{j=m;k=l}}if(k>>>0<i>>>0){gc();return 0}else{c[k>>2]=0;break}}else{k=c[b+8>>2]|0;if(k>>>0<i>>>0){gc();return 0}i=k+12|0;if((c[i>>2]|0)!=(b|0)){gc();return 0}l=j+8|0;if((c[l>>2]|0)==(b|0)){c[i>>2]=j;c[l>>2]=k;break}else{gc();return 0}}}while(0);c:do{if((h|0)!=0){i=c[b+28>>2]|0;k=10480+(i<<2)|0;do{if((b|0)==(c[k>>2]|0)){c[k>>2]=j;if((j|0)!=0){break}c[2545]=c[2545]&~(1<<i);break c}else{if(h>>>0<(c[2548]|0)>>>0){gc();return 0}i=h+16|0;if((c[i>>2]|0)==(b|0)){c[i>>2]=j}else{c[h+20>>2]=j}if((j|0)==0){break c}}}while(0);i=c[2548]|0;if(j>>>0<i>>>0){gc();return 0}c[j+24>>2]=h;h=c[b+16>>2]|0;do{if((h|0)!=0){if(h>>>0<i>>>0){gc();return 0}else{c[j+16>>2]=h;c[h+24>>2]=j;break}}}while(0);h=c[b+20>>2]|0;if((h|0)==0){break}if(h>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[j+20>>2]=h;c[h+24>>2]=j;break}}}while(0);d:do{if(e>>>0<16>>>0){r=e+a|0;c[b+4>>2]=r|3;r=d+(r+4)|0;c[r>>2]=c[r>>2]|1}else{c[b+4>>2]=a|3;c[d+(a|4)>>2]=e|1;c[d+(e+a)>>2]=e;h=e>>>3;if(e>>>0<256>>>0){g=h<<1;e=10216+(g<<2)|0;i=c[2544]|0;h=1<<h;do{if((i&h|0)==0){c[2544]=i|h;h=e;g=10216+(g+2<<2)|0}else{g=10216+(g+2<<2)|0;h=c[g>>2]|0;if(!(h>>>0<(c[2548]|0)>>>0)){break}gc();return 0}}while(0);c[g>>2]=f;c[h+12>>2]=f;c[d+(a+8)>>2]=h;c[d+(a+12)>>2]=e;break}f=e>>>8;do{if((f|0)==0){h=0}else{if(e>>>0>16777215>>>0){h=31;break}q=(f+1048320|0)>>>16&8;r=f<<q;p=(r+520192|0)>>>16&4;r=r<<p;h=(r+245760|0)>>>16&2;h=14-(p|q|h)+(r<<h>>>15)|0;h=e>>>((h+7|0)>>>0)&1|h<<1}}while(0);f=10480+(h<<2)|0;c[d+(a+28)>>2]=h;c[d+(a+20)>>2]=0;c[d+(a+16)>>2]=0;j=c[2545]|0;i=1<<h;if((j&i|0)==0){c[2545]=j|i;c[f>>2]=g;c[d+(a+24)>>2]=f;c[d+(a+12)>>2]=g;c[d+(a+8)>>2]=g;break}f=c[f>>2]|0;if((h|0)==31){h=0}else{h=25-(h>>>1)|0}e:do{if((c[f+4>>2]&-8|0)!=(e|0)){h=e<<h;while(1){j=f+16+(h>>>31<<2)|0;i=c[j>>2]|0;if((i|0)==0){break}if((c[i+4>>2]&-8|0)==(e|0)){f=i;break e}else{f=i;h=h<<1}}if(j>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[j>>2]=g;c[d+(a+24)>>2]=f;c[d+(a+12)>>2]=g;c[d+(a+8)>>2]=g;break d}}}while(0);h=f+8|0;e=c[h>>2]|0;r=c[2548]|0;if(f>>>0>=r>>>0&e>>>0>=r>>>0){c[e+12>>2]=g;c[h>>2]=g;c[d+(a+8)>>2]=e;c[d+(a+12)>>2]=f;c[d+(a+24)>>2]=0;break}else{gc();return 0}}}while(0);r=b+8|0;return r|0}}while(0);b=c[2546]|0;if(!(b>>>0<a>>>0)){d=b-a|0;e=c[2549]|0;if(d>>>0>15>>>0){r=e;c[2549]=r+a;c[2546]=d;c[r+(a+4)>>2]=d|1;c[r+b>>2]=d;c[e+4>>2]=a|3}else{c[2546]=0;c[2549]=0;c[e+4>>2]=b|3;r=e+(b+4)|0;c[r>>2]=c[r>>2]|1}r=e+8|0;return r|0}b=c[2547]|0;if(b>>>0>a>>>0){p=b-a|0;c[2547]=p;r=c[2550]|0;q=r;c[2550]=q+a;c[q+(a+4)>>2]=p|1;c[r+4>>2]=a|3;r=r+8|0;return r|0}do{if((c[2526]|0)==0){b=dc(30)|0;if((b-1&b|0)==0){c[2528]=b;c[2527]=b;c[2529]=-1;c[2530]=-1;c[2531]=0;c[2655]=0;c[2526]=(wc(0)|0)&-16^1431655768;break}else{gc();return 0}}}while(0);g=a+48|0;e=c[2528]|0;h=a+47|0;b=e+h|0;e=-e|0;f=b&e;if(!(f>>>0>a>>>0)){r=0;return r|0}i=c[2654]|0;do{if((i|0)!=0){q=c[2652]|0;r=q+f|0;if(r>>>0<=q>>>0|r>>>0>i>>>0){a=0}else{break}return a|0}}while(0);f:do{if((c[2655]&4|0)==0){k=c[2550]|0;g:do{if((k|0)==0){d=181}else{l=10624;while(1){j=l|0;m=c[j>>2]|0;if(!(m>>>0>k>>>0)){i=l+4|0;if((m+(c[i>>2]|0)|0)>>>0>k>>>0){break}}l=c[l+8>>2]|0;if((l|0)==0){d=181;break g}}if((l|0)==0){d=181;break}e=b-(c[2547]|0)&e;if(!(e>>>0<2147483647>>>0)){e=0;break}b=Vb(e|0)|0;if((b|0)==((c[j>>2]|0)+(c[i>>2]|0)|0)){d=190}else{d=191}}}while(0);do{if((d|0)==181){i=Vb(0)|0;if((i|0)==-1){e=0;break}b=i;e=c[2527]|0;j=e-1|0;if((j&b|0)==0){e=f}else{e=f-b+(j+b&-e)|0}j=c[2652]|0;k=j+e|0;if(!(e>>>0>a>>>0&e>>>0<2147483647>>>0)){e=0;break}b=c[2654]|0;if((b|0)!=0){if(k>>>0<=j>>>0|k>>>0>b>>>0){e=0;break}}b=Vb(e|0)|0;if((b|0)==(i|0)){b=i;d=190}else{d=191}}}while(0);h:do{if((d|0)==190){if(!((b|0)==-1)){d=201;break f}}else if((d|0)==191){d=-e|0;do{if((b|0)!=-1&e>>>0<2147483647>>>0&g>>>0>e>>>0){g=c[2528]|0;g=h-e+g&-g;if(!(g>>>0<2147483647>>>0)){break}if((Vb(g|0)|0)==-1){Vb(d|0)|0;e=0;break h}else{e=g+e|0;break}}}while(0);if((b|0)==-1){e=0}else{d=201;break f}}}while(0);c[2655]=c[2655]|4;d=198}else{e=0;d=198}}while(0);do{if((d|0)==198){if(!(f>>>0<2147483647>>>0)){break}b=Vb(f|0)|0;f=Vb(0)|0;if(!((b|0)!=-1&(f|0)!=-1&b>>>0<f>>>0)){break}f=f-b|0;g=f>>>0>(a+40|0)>>>0;if(g){e=g?f:e;d=201}}}while(0);do{if((d|0)==201){f=(c[2652]|0)+e|0;c[2652]=f;if(f>>>0>(c[2653]|0)>>>0){c[2653]=f}g=c[2550]|0;i:do{if((g|0)==0){r=c[2548]|0;if((r|0)==0|b>>>0<r>>>0){c[2548]=b}c[2656]=b;c[2657]=e;c[2659]=0;c[2553]=c[2526];c[2552]=-1;d=0;do{r=d<<1;q=10216+(r<<2)|0;c[10216+(r+3<<2)>>2]=q;c[10216+(r+2<<2)>>2]=q;d=d+1|0;}while(d>>>0<32>>>0);d=b+8|0;if((d&7|0)==0){d=0}else{d=-d&7}r=e-40-d|0;c[2550]=b+d;c[2547]=r;c[b+(d+4)>>2]=r|1;c[b+(e-36)>>2]=40;c[2551]=c[2530]}else{f=10624;do{h=c[f>>2]|0;i=f+4|0;j=c[i>>2]|0;if((b|0)==(h+j|0)){d=213;break}f=c[f+8>>2]|0;}while((f|0)!=0);do{if((d|0)==213){if((c[f+12>>2]&8|0)!=0){break}f=g;if(!(f>>>0>=h>>>0&f>>>0<b>>>0)){break}c[i>>2]=j+e;b=(c[2547]|0)+e|0;d=g+8|0;if((d&7|0)==0){d=0}else{d=-d&7}r=b-d|0;c[2550]=f+d;c[2547]=r;c[f+(d+4)>>2]=r|1;c[f+(b+4)>>2]=40;c[2551]=c[2530];break i}}while(0);l=c[2548]|0;if(b>>>0<l>>>0){c[2548]=b;l=b}f=b+e|0;i=10624;do{h=i|0;if((c[h>>2]|0)==(f|0)){d=223;break}i=c[i+8>>2]|0;}while((i|0)!=0);do{if((d|0)==223){if((c[i+12>>2]&8|0)!=0){break}c[h>>2]=b;d=i+4|0;c[d>>2]=(c[d>>2]|0)+e;d=b+8|0;if((d&7|0)==0){d=0}else{d=-d&7}f=b+(e+8)|0;if((f&7|0)==0){k=0}else{k=-f&7}n=b+(k+e)|0;m=n;f=d+a|0;i=b+f|0;h=i;j=n-(b+d)-a|0;c[b+(d+4)>>2]=a|3;j:do{if((m|0)==(g|0)){r=(c[2547]|0)+j|0;c[2547]=r;c[2550]=h;c[b+(f+4)>>2]=r|1}else{if((m|0)==(c[2549]|0)){r=(c[2546]|0)+j|0;c[2546]=r;c[2549]=h;c[b+(f+4)>>2]=r|1;c[b+(r+f)>>2]=r;break}g=e+4|0;p=c[b+(g+k)>>2]|0;if((p&3|0)==1){a=p&-8;o=p>>>3;k:do{if(p>>>0<256>>>0){n=c[b+((k|8)+e)>>2]|0;g=c[b+(e+12+k)>>2]|0;p=10216+(o<<1<<2)|0;do{if((n|0)!=(p|0)){if(n>>>0<l>>>0){gc();return 0}if((c[n+12>>2]|0)==(m|0)){break}gc();return 0}}while(0);if((g|0)==(n|0)){c[2544]=c[2544]&~(1<<o);break}do{if((g|0)==(p|0)){l=g+8|0}else{if(g>>>0<l>>>0){gc();return 0}l=g+8|0;if((c[l>>2]|0)==(m|0)){break}gc();return 0}}while(0);c[n+12>>2]=g;c[l>>2]=n}else{m=c[b+((k|24)+e)>>2]|0;o=c[b+(e+12+k)>>2]|0;do{if((o|0)==(n|0)){q=k|16;p=b+(g+q)|0;o=c[p>>2]|0;if((o|0)==0){p=b+(q+e)|0;o=c[p>>2]|0;if((o|0)==0){o=0;break}}while(1){q=o+20|0;r=c[q>>2]|0;if((r|0)!=0){o=r;p=q;continue}r=o+16|0;q=c[r>>2]|0;if((q|0)==0){break}else{o=q;p=r}}if(p>>>0<l>>>0){gc();return 0}else{c[p>>2]=0;break}}else{p=c[b+((k|8)+e)>>2]|0;if(p>>>0<l>>>0){gc();return 0}q=p+12|0;if((c[q>>2]|0)!=(n|0)){gc();return 0}l=o+8|0;if((c[l>>2]|0)==(n|0)){c[q>>2]=o;c[l>>2]=p;break}else{gc();return 0}}}while(0);if((m|0)==0){break}p=c[b+(e+28+k)>>2]|0;l=10480+(p<<2)|0;do{if((n|0)==(c[l>>2]|0)){c[l>>2]=o;if((o|0)!=0){break}c[2545]=c[2545]&~(1<<p);break k}else{if(m>>>0<(c[2548]|0)>>>0){gc();return 0}l=m+16|0;if((c[l>>2]|0)==(n|0)){c[l>>2]=o}else{c[m+20>>2]=o}if((o|0)==0){break k}}}while(0);l=c[2548]|0;if(o>>>0<l>>>0){gc();return 0}c[o+24>>2]=m;m=k|16;n=c[b+(m+e)>>2]|0;do{if((n|0)!=0){if(n>>>0<l>>>0){gc();return 0}else{c[o+16>>2]=n;c[n+24>>2]=o;break}}}while(0);g=c[b+(g+m)>>2]|0;if((g|0)==0){break}if(g>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[o+20>>2]=g;c[g+24>>2]=o;break}}}while(0);m=b+((a|k)+e)|0;j=a+j|0}e=m+4|0;c[e>>2]=c[e>>2]&-2;c[b+(f+4)>>2]=j|1;c[b+(j+f)>>2]=j;e=j>>>3;if(j>>>0<256>>>0){g=e<<1;a=10216+(g<<2)|0;i=c[2544]|0;e=1<<e;do{if((i&e|0)==0){c[2544]=i|e;e=a;g=10216+(g+2<<2)|0}else{g=10216+(g+2<<2)|0;e=c[g>>2]|0;if(!(e>>>0<(c[2548]|0)>>>0)){break}gc();return 0}}while(0);c[g>>2]=h;c[e+12>>2]=h;c[b+(f+8)>>2]=e;c[b+(f+12)>>2]=a;break}a=j>>>8;do{if((a|0)==0){e=0}else{if(j>>>0>16777215>>>0){e=31;break}q=(a+1048320|0)>>>16&8;r=a<<q;p=(r+520192|0)>>>16&4;r=r<<p;e=(r+245760|0)>>>16&2;e=14-(p|q|e)+(r<<e>>>15)|0;e=j>>>((e+7|0)>>>0)&1|e<<1}}while(0);g=10480+(e<<2)|0;c[b+(f+28)>>2]=e;c[b+(f+20)>>2]=0;c[b+(f+16)>>2]=0;h=c[2545]|0;a=1<<e;if((h&a|0)==0){c[2545]=h|a;c[g>>2]=i;c[b+(f+24)>>2]=g;c[b+(f+12)>>2]=i;c[b+(f+8)>>2]=i;break}a=c[g>>2]|0;if((e|0)==31){e=0}else{e=25-(e>>>1)|0}l:do{if((c[a+4>>2]&-8|0)!=(j|0)){e=j<<e;while(1){g=a+16+(e>>>31<<2)|0;h=c[g>>2]|0;if((h|0)==0){break}if((c[h+4>>2]&-8|0)==(j|0)){a=h;break l}else{a=h;e=e<<1}}if(g>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[g>>2]=i;c[b+(f+24)>>2]=a;c[b+(f+12)>>2]=i;c[b+(f+8)>>2]=i;break j}}}while(0);e=a+8|0;g=c[e>>2]|0;r=c[2548]|0;if(a>>>0>=r>>>0&g>>>0>=r>>>0){c[g+12>>2]=i;c[e>>2]=i;c[b+(f+8)>>2]=g;c[b+(f+12)>>2]=a;c[b+(f+24)>>2]=0;break}else{gc();return 0}}}while(0);r=b+(d|8)|0;return r|0}}while(0);d=g;j=10624;while(1){i=c[j>>2]|0;if(!(i>>>0>d>>>0)){h=c[j+4>>2]|0;f=i+h|0;if(f>>>0>d>>>0){break}}j=c[j+8>>2]|0}j=i+(h-39)|0;if((j&7|0)==0){j=0}else{j=-j&7}h=i+(h-47+j)|0;h=h>>>0<(g+16|0)>>>0?d:h;i=h+8|0;j=b+8|0;if((j&7|0)==0){j=0}else{j=-j&7}r=e-40-j|0;c[2550]=b+j;c[2547]=r;c[b+(j+4)>>2]=r|1;c[b+(e-36)>>2]=40;c[2551]=c[2530];c[h+4>>2]=27;c[i>>2]=c[2656];c[i+4>>2]=c[2657];c[i+8>>2]=c[2658];c[i+12>>2]=c[2659];c[2656]=b;c[2657]=e;c[2659]=0;c[2658]=i;e=h+28|0;c[e>>2]=7;if((h+32|0)>>>0<f>>>0){while(1){b=e+4|0;c[b>>2]=7;if((e+8|0)>>>0<f>>>0){e=b}else{break}}}if((h|0)==(d|0)){break}e=h-g|0;f=d+(e+4)|0;c[f>>2]=c[f>>2]&-2;c[g+4>>2]=e|1;c[d+e>>2]=e;f=e>>>3;if(e>>>0<256>>>0){d=f<<1;b=10216+(d<<2)|0;e=c[2544]|0;f=1<<f;do{if((e&f|0)==0){c[2544]=e|f;e=b;d=10216+(d+2<<2)|0}else{d=10216+(d+2<<2)|0;e=c[d>>2]|0;if(!(e>>>0<(c[2548]|0)>>>0)){break}gc();return 0}}while(0);c[d>>2]=g;c[e+12>>2]=g;c[g+8>>2]=e;c[g+12>>2]=b;break}b=g;d=e>>>8;do{if((d|0)==0){d=0}else{if(e>>>0>16777215>>>0){d=31;break}q=(d+1048320|0)>>>16&8;r=d<<q;p=(r+520192|0)>>>16&4;r=r<<p;d=(r+245760|0)>>>16&2;d=14-(p|q|d)+(r<<d>>>15)|0;d=e>>>((d+7|0)>>>0)&1|d<<1}}while(0);h=10480+(d<<2)|0;c[g+28>>2]=d;c[g+20>>2]=0;c[g+16>>2]=0;i=c[2545]|0;f=1<<d;if((i&f|0)==0){c[2545]=i|f;c[h>>2]=b;c[g+24>>2]=h;c[g+12>>2]=g;c[g+8>>2]=g;break}i=c[h>>2]|0;if((d|0)==31){f=0}else{f=25-(d>>>1)|0}m:do{if((c[i+4>>2]&-8|0)!=(e|0)){d=i;f=e<<f;while(1){h=d+16+(f>>>31<<2)|0;i=c[h>>2]|0;if((i|0)==0){break}if((c[i+4>>2]&-8|0)==(e|0)){break m}else{d=i;f=f<<1}}if(h>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[h>>2]=b;c[g+24>>2]=d;c[g+12>>2]=g;c[g+8>>2]=g;break i}}}while(0);d=i+8|0;e=c[d>>2]|0;r=c[2548]|0;if(i>>>0>=r>>>0&e>>>0>=r>>>0){c[e+12>>2]=b;c[d>>2]=b;c[g+8>>2]=e;c[g+12>>2]=i;c[g+24>>2]=0;break}else{gc();return 0}}}while(0);b=c[2547]|0;if(!(b>>>0>a>>>0)){break}p=b-a|0;c[2547]=p;r=c[2550]|0;q=r;c[2550]=q+a;c[q+(a+4)>>2]=p|1;c[r+4>>2]=a|3;r=r+8|0;return r|0}}while(0);c[(Wb()|0)>>2]=12;r=0;return r|0}function $m(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;if((a|0)==0){return}p=a-8|0;s=p;q=c[2548]|0;if(p>>>0<q>>>0){gc()}n=c[a-4>>2]|0;m=n&3;if((m|0)==1){gc()}g=n&-8;k=a+(g-8)|0;i=k;a:do{if((n&1|0)==0){u=c[p>>2]|0;if((m|0)==0){return}p=-8-u|0;s=a+p|0;n=s;m=u+g|0;if(s>>>0<q>>>0){gc()}if((n|0)==(c[2549]|0)){l=a+(g-4)|0;b=c[l>>2]|0;if((b&3|0)!=3){b=n;l=m;break}c[2546]=m;c[l>>2]=b&-2;c[a+(p+4)>>2]=m|1;c[k>>2]=m;return}t=u>>>3;if(u>>>0<256>>>0){b=c[a+(p+8)>>2]|0;l=c[a+(p+12)>>2]|0;o=10216+(t<<1<<2)|0;do{if((b|0)!=(o|0)){if(b>>>0<q>>>0){gc()}if((c[b+12>>2]|0)==(n|0)){break}gc()}}while(0);if((l|0)==(b|0)){c[2544]=c[2544]&~(1<<t);b=n;l=m;break}do{if((l|0)==(o|0)){r=l+8|0}else{if(l>>>0<q>>>0){gc()}o=l+8|0;if((c[o>>2]|0)==(n|0)){r=o;break}gc()}}while(0);c[b+12>>2]=l;c[r>>2]=b;b=n;l=m;break}r=c[a+(p+24)>>2]|0;t=c[a+(p+12)>>2]|0;do{if((t|0)==(s|0)){u=a+(p+20)|0;t=c[u>>2]|0;if((t|0)==0){u=a+(p+16)|0;t=c[u>>2]|0;if((t|0)==0){o=0;break}}while(1){w=t+20|0;v=c[w>>2]|0;if((v|0)!=0){t=v;u=w;continue}v=t+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{t=w;u=v}}if(u>>>0<q>>>0){gc()}else{c[u>>2]=0;o=t;break}}else{u=c[a+(p+8)>>2]|0;if(u>>>0<q>>>0){gc()}q=u+12|0;if((c[q>>2]|0)!=(s|0)){gc()}v=t+8|0;if((c[v>>2]|0)==(s|0)){c[q>>2]=t;c[v>>2]=u;o=t;break}else{gc()}}}while(0);if((r|0)==0){b=n;l=m;break}q=c[a+(p+28)>>2]|0;t=10480+(q<<2)|0;do{if((s|0)==(c[t>>2]|0)){c[t>>2]=o;if((o|0)!=0){break}c[2545]=c[2545]&~(1<<q);b=n;l=m;break a}else{if(r>>>0<(c[2548]|0)>>>0){gc()}q=r+16|0;if((c[q>>2]|0)==(s|0)){c[q>>2]=o}else{c[r+20>>2]=o}if((o|0)==0){b=n;l=m;break a}}}while(0);q=c[2548]|0;if(o>>>0<q>>>0){gc()}c[o+24>>2]=r;r=c[a+(p+16)>>2]|0;do{if((r|0)!=0){if(r>>>0<q>>>0){gc()}else{c[o+16>>2]=r;c[r+24>>2]=o;break}}}while(0);p=c[a+(p+20)>>2]|0;if((p|0)==0){b=n;l=m;break}if(p>>>0<(c[2548]|0)>>>0){gc()}else{c[o+20>>2]=p;c[p+24>>2]=o;b=n;l=m;break}}else{b=s;l=g}}while(0);m=b;if(!(m>>>0<k>>>0)){gc()}n=a+(g-4)|0;o=c[n>>2]|0;if((o&1|0)==0){gc()}do{if((o&2|0)==0){if((i|0)==(c[2550]|0)){w=(c[2547]|0)+l|0;c[2547]=w;c[2550]=b;c[b+4>>2]=w|1;if((b|0)!=(c[2549]|0)){return}c[2549]=0;c[2546]=0;return}if((i|0)==(c[2549]|0)){w=(c[2546]|0)+l|0;c[2546]=w;c[2549]=b;c[b+4>>2]=w|1;c[m+w>>2]=w;return}l=(o&-8)+l|0;n=o>>>3;b:do{if(o>>>0<256>>>0){h=c[a+g>>2]|0;a=c[a+(g|4)>>2]|0;g=10216+(n<<1<<2)|0;do{if((h|0)!=(g|0)){if(h>>>0<(c[2548]|0)>>>0){gc()}if((c[h+12>>2]|0)==(i|0)){break}gc()}}while(0);if((a|0)==(h|0)){c[2544]=c[2544]&~(1<<n);break}do{if((a|0)==(g|0)){j=a+8|0}else{if(a>>>0<(c[2548]|0)>>>0){gc()}g=a+8|0;if((c[g>>2]|0)==(i|0)){j=g;break}gc()}}while(0);c[h+12>>2]=a;c[j>>2]=h}else{i=c[a+(g+16)>>2]|0;n=c[a+(g|4)>>2]|0;do{if((n|0)==(k|0)){n=a+(g+12)|0;j=c[n>>2]|0;if((j|0)==0){n=a+(g+8)|0;j=c[n>>2]|0;if((j|0)==0){h=0;break}}while(1){p=j+20|0;o=c[p>>2]|0;if((o|0)!=0){j=o;n=p;continue}p=j+16|0;o=c[p>>2]|0;if((o|0)==0){break}else{j=o;n=p}}if(n>>>0<(c[2548]|0)>>>0){gc()}else{c[n>>2]=0;h=j;break}}else{j=c[a+g>>2]|0;if(j>>>0<(c[2548]|0)>>>0){gc()}o=j+12|0;if((c[o>>2]|0)!=(k|0)){gc()}p=n+8|0;if((c[p>>2]|0)==(k|0)){c[o>>2]=n;c[p>>2]=j;h=n;break}else{gc()}}}while(0);if((i|0)==0){break}n=c[a+(g+20)>>2]|0;j=10480+(n<<2)|0;do{if((k|0)==(c[j>>2]|0)){c[j>>2]=h;if((h|0)!=0){break}c[2545]=c[2545]&~(1<<n);break b}else{if(i>>>0<(c[2548]|0)>>>0){gc()}j=i+16|0;if((c[j>>2]|0)==(k|0)){c[j>>2]=h}else{c[i+20>>2]=h}if((h|0)==0){break b}}}while(0);j=c[2548]|0;if(h>>>0<j>>>0){gc()}c[h+24>>2]=i;i=c[a+(g+8)>>2]|0;do{if((i|0)!=0){if(i>>>0<j>>>0){gc()}else{c[h+16>>2]=i;c[i+24>>2]=h;break}}}while(0);a=c[a+(g+12)>>2]|0;if((a|0)==0){break}if(a>>>0<(c[2548]|0)>>>0){gc()}else{c[h+20>>2]=a;c[a+24>>2]=h;break}}}while(0);c[b+4>>2]=l|1;c[m+l>>2]=l;if((b|0)!=(c[2549]|0)){break}c[2546]=l;return}else{c[n>>2]=o&-2;c[b+4>>2]=l|1;c[m+l>>2]=l}}while(0);a=l>>>3;if(l>>>0<256>>>0){h=a<<1;d=10216+(h<<2)|0;g=c[2544]|0;a=1<<a;do{if((g&a|0)==0){c[2544]=g|a;f=d;e=10216+(h+2<<2)|0}else{g=10216+(h+2<<2)|0;a=c[g>>2]|0;if(!(a>>>0<(c[2548]|0)>>>0)){f=a;e=g;break}gc()}}while(0);c[e>>2]=b;c[f+12>>2]=b;c[b+8>>2]=f;c[b+12>>2]=d;return}e=b;f=l>>>8;do{if((f|0)==0){f=0}else{if(l>>>0>16777215>>>0){f=31;break}v=(f+1048320|0)>>>16&8;w=f<<v;u=(w+520192|0)>>>16&4;w=w<<u;f=(w+245760|0)>>>16&2;f=14-(u|v|f)+(w<<f>>>15)|0;f=l>>>((f+7|0)>>>0)&1|f<<1}}while(0);a=10480+(f<<2)|0;c[b+28>>2]=f;c[b+20>>2]=0;c[b+16>>2]=0;h=c[2545]|0;g=1<<f;c:do{if((h&g|0)==0){c[2545]=h|g;c[a>>2]=e;c[b+24>>2]=a;c[b+12>>2]=b;c[b+8>>2]=b}else{g=c[a>>2]|0;if((f|0)==31){a=0}else{a=25-(f>>>1)|0}d:do{if((c[g+4>>2]&-8|0)==(l|0)){d=g}else{f=g;h=l<<a;while(1){g=f+16+(h>>>31<<2)|0;a=c[g>>2]|0;if((a|0)==0){break}if((c[a+4>>2]&-8|0)==(l|0)){d=a;break d}else{f=a;h=h<<1}}if(g>>>0<(c[2548]|0)>>>0){gc()}else{c[g>>2]=e;c[b+24>>2]=f;c[b+12>>2]=b;c[b+8>>2]=b;break c}}}while(0);f=d+8|0;a=c[f>>2]|0;w=c[2548]|0;if(d>>>0>=w>>>0&a>>>0>=w>>>0){c[a+12>>2]=e;c[f>>2]=e;c[b+8>>2]=a;c[b+12>>2]=d;c[b+24>>2]=0;break}else{gc()}}}while(0);w=(c[2552]|0)-1|0;c[2552]=w;if((w|0)==0){b=10632}else{return}while(1){b=c[b>>2]|0;if((b|0)==0){break}else{b=b+8|0}}c[2552]=-1;return}function an(a,b){a=a|0;b=b|0;var d=0,e=0;if((a|0)==0){e=_m(b)|0;return e|0}if(b>>>0>4294967231>>>0){c[(Wb()|0)>>2]=12;e=0;return e|0}if(b>>>0<11>>>0){d=16}else{d=b+11&-8}d=sn(a-8|0,d)|0;if((d|0)!=0){e=d+8|0;return e|0}d=_m(b)|0;if((d|0)==0){e=0;return e|0}e=c[a-4>>2]|0;e=(e&-8)-((e&3|0)==0?8:4)|0;xn(d|0,a|0,e>>>0<b>>>0?e:b)|0;$m(a);e=d;return e|0}function bn(a){a=a|0;var b=0,d=0;a=(a|0)==0?1:a;while(1){d=_m(a)|0;if((d|0)!=0){b=10;break}d=(J=c[3550]|0,c[3550]=J+0,J);if((d|0)==0){break}Ic[d&3]()}if((b|0)==10){return d|0}d=oc(4)|0;c[d>>2]=2760;Fb(d|0,8440,34);return 0}function cn(a){a=a|0;return bn(a)|0}function dn(a){a=a|0;if((a|0)==0){return}$m(a);return}function en(a){a=a|0;dn(a);return}function fn(a){a=a|0;dn(a);return}function gn(a){a=a|0;return}function hn(a){a=a|0;return 1064}function jn(){var a=0;a=oc(4)|0;c[a>>2]=2760;Fb(a|0,8440,34)}function kn(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0.0,s=0,t=0,u=0,v=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0.0,J=0.0,K=0.0,M=0.0,N=0.0;g=i;i=i+512|0;k=g|0;if((e|0)==0){j=-149;h=24}else if((e|0)==2){j=-1074;h=53}else if((e|0)==1){j=-1074;h=53}else{K=0.0;i=g;return+K}n=b+4|0;o=b+100|0;do{e=c[n>>2]|0;if(e>>>0<(c[o>>2]|0)>>>0){c[n>>2]=e+1;C=d[e]|0}else{C=mn(b)|0}}while((Pa(C|0)|0)!=0);do{if((C|0)==45|(C|0)==43){e=1-(((C|0)==45)<<1)|0;l=c[n>>2]|0;if(l>>>0<(c[o>>2]|0)>>>0){c[n>>2]=l+1;C=d[l]|0;break}else{C=mn(b)|0;break}}else{e=1}}while(0);m=0;do{if((C|32|0)!=(a[560+m|0]|0)){break}do{if(m>>>0<7>>>0){l=c[n>>2]|0;if(l>>>0<(c[o>>2]|0)>>>0){c[n>>2]=l+1;C=d[l]|0;break}else{C=mn(b)|0;break}}}while(0);m=m+1|0;}while(m>>>0<8>>>0);do{if((m|0)==3){p=23}else if((m|0)!=8){l=(f|0)!=0;if(m>>>0>3>>>0&l){if((m|0)==8){break}else{p=23;break}}a:do{if((m|0)==0){m=0;do{if((C|32|0)!=(a[1688+m|0]|0)){break a}do{if(m>>>0<2>>>0){q=c[n>>2]|0;if(q>>>0<(c[o>>2]|0)>>>0){c[n>>2]=q+1;C=d[q]|0;break}else{C=mn(b)|0;break}}}while(0);m=m+1|0;}while(m>>>0<3>>>0)}}while(0);if((m|0)==3){e=c[n>>2]|0;if(e>>>0<(c[o>>2]|0)>>>0){c[n>>2]=e+1;e=d[e]|0}else{e=mn(b)|0}if((e|0)==40){e=1}else{if((c[o>>2]|0)==0){K=+w;i=g;return+K}c[n>>2]=(c[n>>2]|0)-1;K=+w;i=g;return+K}while(1){h=c[n>>2]|0;if(h>>>0<(c[o>>2]|0)>>>0){c[n>>2]=h+1;h=d[h]|0}else{h=mn(b)|0}if(!((h-48|0)>>>0<10>>>0|(h-65|0)>>>0<26>>>0)){if(!((h-97|0)>>>0<26>>>0|(h|0)==95)){break}}e=e+1|0}if((h|0)==41){K=+w;i=g;return+K}h=(c[o>>2]|0)==0;if(!h){c[n>>2]=(c[n>>2]|0)-1}if(!l){c[(Wb()|0)>>2]=22;ln(b,0);K=0.0;i=g;return+K}if((e|0)==0|h){K=+w;i=g;return+K}while(1){e=e-1|0;c[n>>2]=(c[n>>2]|0)-1;if((e|0)==0){r=+w;break}}i=g;return+r}else if((m|0)==0){do{if((C|0)==48){l=c[n>>2]|0;if(l>>>0<(c[o>>2]|0)>>>0){c[n>>2]=l+1;l=d[l]|0}else{l=mn(b)|0}if((l|32|0)!=120){if((c[o>>2]|0)==0){C=48;break}c[n>>2]=(c[n>>2]|0)-1;C=48;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;u=d[k]|0;z=0}else{u=mn(b)|0;z=0}while(1){if((u|0)==46){p=70;break}else if((u|0)!=48){l=0;k=0;m=0;t=0;q=0;A=0;I=1.0;r=0.0;s=0;break}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;u=d[k]|0;z=1;continue}else{u=mn(b)|0;z=1;continue}}do{if((p|0)==70){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;u=d[k]|0}else{u=mn(b)|0}if((u|0)==48){m=0;t=0}else{l=0;k=0;m=0;t=0;q=1;A=0;I=1.0;r=0.0;s=0;break}while(1){k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;u=d[k]|0}else{u=mn(b)|0}t=Bn(t,m,-1,-1)|0;m=L;if((u|0)!=48){l=0;k=0;z=1;q=1;A=0;I=1.0;r=0.0;s=0;break}}}}while(0);b:while(1){y=u-48|0;do{if(y>>>0<10>>>0){p=83}else{B=u|32;v=(u|0)==46;if(!((B-97|0)>>>0<6>>>0|v)){break b}if(v){if((q|0)==0){v=l;y=k;m=l;t=k;q=1;break}else{u=46;break b}}else{y=(u|0)>57?B-87|0:y;p=83;break}}}while(0);if((p|0)==83){p=0;H=0;do{if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<8>>>0){J=I;s=y+(s<<4)|0}else{H=0;if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<14>>>0){K=I*.0625;J=K;r=r+K*+(y|0);break}if((y|0)==0|(A|0)!=0){J=I;break}A=1;J=I;r=r+I*.5}}while(0);y=Bn(k,l,1,0)|0;v=L;z=1;I=J}k=c[n>>2]|0;if(k>>>0<(c[o>>2]|0)>>>0){c[n>>2]=k+1;u=d[k]|0;l=v;k=y;continue}else{u=mn(b)|0;l=v;k=y;continue}}if((z|0)==0){h=(c[o>>2]|0)==0;if(!h){c[n>>2]=(c[n>>2]|0)-1}do{if((f|0)==0){ln(b,0)}else{if(h){break}h=c[n>>2]|0;c[n>>2]=h-1;if((q|0)==0){break}c[n>>2]=h-2}}while(0);K=+(e|0)*0.0;i=g;return+K}q=(q|0)==0;p=q?k:t;m=q?l:m;H=0;if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<8>>>0){do{s=s<<4;k=Bn(k,l,1,0)|0;l=L;H=0;}while((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<8>>>0)}do{if((u|32|0)==112){k=un(b,f)|0;l=L;if(!((k|0)==0&(l|0)==(-2147483648|0))){break}if((f|0)==0){ln(b,0);K=0.0;i=g;return+K}else{if((c[o>>2]|0)==0){l=0;k=0;break}c[n>>2]=(c[n>>2]|0)-1;l=0;k=0;break}}else{if((c[o>>2]|0)==0){l=0;k=0;break}c[n>>2]=(c[n>>2]|0)-1;l=0;k=0}}while(0);H=Bn(p<<2|0>>>30,m<<2|p>>>30,-32,-1)|0;k=Bn(H,L,k,l)|0;l=L;if((s|0)==0){K=+(e|0)*0.0;i=g;return+K}H=0;if((l|0)>(H|0)|(l|0)==(H|0)&k>>>0>(-j|0)>>>0){c[(Wb()|0)>>2]=34;K=+(e|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+K}m=j-106|0;H=(m|0)<0|0?-1:0;if((l|0)<(H|0)|(l|0)==(H|0)&k>>>0<m>>>0){c[(Wb()|0)>>2]=34;K=+(e|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+K}if((s|0)>-1){do{s=s<<1;if(r<.5){I=r}else{I=r+-1.0;s=s|1}r=r+I;k=Bn(k,l,-1,-1)|0;l=L;}while((s|0)>-1)}m=0;j=Cn(32,0,j,(j|0)<0|0?-1:0)|0;j=Bn(k,l,j,L)|0;H=L;if((m|0)>(H|0)|(m|0)==(H|0)&h>>>0>j>>>0){h=j;if((h|0)<0){h=0;p=126}else{p=124}}else{p=124}do{if((p|0)==124){if((h|0)<53){p=126;break}I=0.0;J=+(e|0)}}while(0);if((p|0)==126){J=+(e|0);I=+Cb(+(+nn(1.0,84-h|0)),+J)}e=(h|0)<32&r!=0.0&(s&1|0)==0;r=J*(e?0.0:r)+(I+J*+(((e&1)+s|0)>>>0>>>0))-I;if(!(r!=0.0)){c[(Wb()|0)>>2]=34}K=+on(r,k);i=g;return+K}}while(0);m=j+h|0;l=-m|0;F=0;while(1){if((C|0)==46){p=137;break}else if((C|0)!=48){E=0;y=0;z=0;break}q=c[n>>2]|0;if(q>>>0<(c[o>>2]|0)>>>0){c[n>>2]=q+1;C=d[q]|0;F=1;continue}else{C=mn(b)|0;F=1;continue}}do{if((p|0)==137){p=c[n>>2]|0;if(p>>>0<(c[o>>2]|0)>>>0){c[n>>2]=p+1;C=d[p]|0}else{C=mn(b)|0}if((C|0)==48){y=0;z=0}else{E=1;y=0;z=0;break}while(1){z=Bn(z,y,-1,-1)|0;y=L;p=c[n>>2]|0;if(p>>>0<(c[o>>2]|0)>>>0){c[n>>2]=p+1;C=d[p]|0}else{C=mn(b)|0}if((C|0)!=48){E=1;F=1;break}}}}while(0);q=k|0;c[q>>2]=0;H=C-48|0;G=(C|0)==46;c:do{if(H>>>0<10>>>0|G){p=k+496|0;D=0;B=0;s=0;v=0;t=0;d:while(1){do{if(G){if((E|0)==0){E=1;A=D;u=B;y=D;z=B}else{break d}}else{u=Bn(B,D,1,0)|0;A=L;B=(C|0)!=48;if((v|0)>=125){if(!B){break}c[p>>2]=c[p>>2]|1;break}D=k+(v<<2)|0;if((t|0)!=0){H=C-48+((c[D>>2]|0)*10|0)|0}c[D>>2]=H;t=t+1|0;C=(t|0)==9;t=C?0:t;v=(C&1)+v|0;F=1;s=B?u:s}}while(0);B=c[n>>2]|0;if(B>>>0<(c[o>>2]|0)>>>0){c[n>>2]=B+1;C=d[B]|0}else{C=mn(b)|0}H=C-48|0;G=(C|0)==46;if(H>>>0<10>>>0|G){D=A;B=u}else{p=160;break c}}f=(F|0)!=0;A=D;u=B;p=168}else{A=0;u=0;s=0;v=0;t=0;p=160}}while(0);do{if((p|0)==160){B=(E|0)==0;z=B?u:z;y=B?A:y;B=(F|0)!=0;if(!(B&(C|32|0)==101)){if((C|0)>-1){f=B;p=168;break}else{f=B;p=170;break}}B=un(b,f)|0;C=L;do{if((B|0)==0&(C|0)==(-2147483648|0)){if((f|0)==0){ln(b,0);K=0.0;i=g;return+K}else{if((c[o>>2]|0)==0){C=0;B=0;break}c[n>>2]=(c[n>>2]|0)-1;C=0;B=0;break}}}while(0);z=Bn(B,C,z,y)|0;y=L}}while(0);do{if((p|0)==168){if((c[o>>2]|0)==0){p=170;break}c[n>>2]=(c[n>>2]|0)-1;if(!f){p=171}}}while(0);if((p|0)==170){if(!f){p=171}}if((p|0)==171){c[(Wb()|0)>>2]=22;ln(b,0);K=0.0;i=g;return+K}b=c[q>>2]|0;if((b|0)==0){K=+(e|0)*0.0;i=g;return+K}H=0;do{if((z|0)==(u|0)&(y|0)==(A|0)&((A|0)<(H|0)|(A|0)==(H|0)&u>>>0<10>>>0)){if(!(h>>>0>30>>>0|(b>>>(h>>>0)|0)==0)){break}K=+(e|0)*+(b>>>0>>>0);i=g;return+K}}while(0);b=(j|0)/-2|0;H=(b|0)<0|0?-1:0;if((y|0)>(H|0)|(y|0)==(H|0)&z>>>0>b>>>0){c[(Wb()|0)>>2]=34;K=+(e|0)*1.7976931348623157e+308*1.7976931348623157e+308;i=g;return+K}b=j-106|0;H=(b|0)<0|0?-1:0;if((y|0)<(H|0)|(y|0)==(H|0)&z>>>0<b>>>0){c[(Wb()|0)>>2]=34;K=+(e|0)*2.2250738585072014e-308*2.2250738585072014e-308;i=g;return+K}if((t|0)!=0){if((t|0)<9){b=k+(v<<2)|0;n=c[b>>2]|0;do{n=n*10|0;t=t+1|0;}while((t|0)<9);c[b>>2]=n}v=v+1|0}do{if((s|0)<9){if(!((s|0)<=(z|0)&(z|0)<18)){break}if((z|0)==9){K=+(e|0)*+((c[q>>2]|0)>>>0>>>0);i=g;return+K}if((z|0)<9){K=+(e|0)*+((c[q>>2]|0)>>>0>>>0)/+(c[32+(8-z<<2)>>2]|0);i=g;return+K}H=h+27+(z*-3|0)|0;b=c[q>>2]|0;if(!((H|0)>30|(b>>>(H>>>0)|0)==0)){break}K=+(e|0)*+(b>>>0>>>0)*+(c[32+(z-10<<2)>>2]|0);i=g;return+K}}while(0);b=(z|0)%9|0;if((b|0)==0){b=0;n=0}else{o=(z|0)>-1?b:b+9|0;f=c[32+(8-o<<2)>>2]|0;do{if((v|0)==0){v=0;b=0}else{n=1e9/(f|0)|0;b=0;s=0;q=0;while(1){G=k+(s<<2)|0;p=c[G>>2]|0;H=((p>>>0)/(f>>>0)|0)+q|0;c[G>>2]=H;q=ha((p>>>0)%(f>>>0)|0,n)|0;p=s+1|0;if((s|0)==(b|0)&(H|0)==0){b=p&127;z=z-9|0}if((p|0)==(v|0)){break}else{s=p}}if((q|0)==0){break}c[k+(v<<2)>>2]=q;v=v+1|0}}while(0);n=0;z=9-o+z|0}e:while(1){o=k+(b<<2)|0;if((z|0)<18){do{f=0;o=v+127|0;while(1){o=o&127;p=k+(o<<2)|0;q=c[p>>2]|0;q=Bn(q<<29|0>>>3,0<<29|q>>>3,f,0)|0;f=L;H=0;if(f>>>0>H>>>0|f>>>0==H>>>0&q>>>0>1e9>>>0){H=Mn(q,f,1e9,0)|0;q=Nn(q,f,1e9,0)|0;f=H}else{f=0}c[p>>2]=q;p=(o|0)==(b|0);if(!((o|0)!=(v+127&127|0)|p)){v=(q|0)==0?o:v}if(p){break}else{o=o-1|0}}n=n-29|0;}while((f|0)==0)}else{if((z|0)!=18){break}do{if(!((c[o>>2]|0)>>>0<9007199>>>0)){z=18;break e}f=0;p=v+127|0;while(1){p=p&127;q=k+(p<<2)|0;s=c[q>>2]|0;s=Bn(s<<29|0>>>3,0<<29|s>>>3,f,0)|0;f=L;H=0;if(f>>>0>H>>>0|f>>>0==H>>>0&s>>>0>1e9>>>0){H=Mn(s,f,1e9,0)|0;s=Nn(s,f,1e9,0)|0;f=H}else{f=0}c[q>>2]=s;q=(p|0)==(b|0);if(!((p|0)!=(v+127&127|0)|q)){v=(s|0)==0?p:v}if(q){break}else{p=p-1|0}}n=n-29|0;}while((f|0)==0)}b=b+127&127;if((b|0)==(v|0)){H=v+127&127;v=k+((v+126&127)<<2)|0;c[v>>2]=c[v>>2]|c[k+(H<<2)>>2];v=H}c[k+(b<<2)>>2]=f;z=z+9|0}f:while(1){o=v+1&127;f=k+((v+127&127)<<2)|0;while(1){q=(z|0)==18;p=(z|0)>27?9:1;while(1){s=0;while(1){t=s+b&127;if((t|0)==(v|0)){s=2;break}y=c[k+(t<<2)>>2]|0;t=c[24+(s<<2)>>2]|0;if(y>>>0<t>>>0){s=2;break}u=s+1|0;if(y>>>0>t>>>0){break}if((u|0)<2){s=u}else{s=u;break}}if((s|0)==2&q){break f}n=p+n|0;if((b|0)==(v|0)){b=v}else{break}}q=(1<<p)-1|0;s=1e9>>>(p>>>0);t=b;y=b;b=0;do{G=k+(y<<2)|0;H=c[G>>2]|0;u=(H>>>(p>>>0))+b|0;c[G>>2]=u;b=ha(H&q,s)|0;u=(y|0)==(t|0)&(u|0)==0;y=y+1&127;z=u?z-9|0:z;t=u?y:t;}while((y|0)!=(v|0));if((b|0)==0){b=t;continue}if((o|0)!=(t|0)){break}c[f>>2]=c[f>>2]|1;b=t}c[k+(v<<2)>>2]=b;b=t;v=o}f=b&127;if((f|0)==(v|0)){c[k+(o-1<<2)>>2]=0;v=o}I=+((c[k+(f<<2)>>2]|0)>>>0>>>0);o=b+1&127;if((o|0)==(v|0)){v=v+1&127;c[k+(v-1<<2)>>2]=0}r=+(e|0);J=r*(I*1.0e9+ +((c[k+(o<<2)>>2]|0)>>>0>>>0));e=n+53|0;j=e-j|0;if((j|0)<(h|0)){if((j|0)<0){o=1;h=0;p=244}else{h=j;o=1;p=243}}else{o=0;p=243}if((p|0)==243){if((h|0)<53){p=244}else{I=0.0;K=0.0}}if((p|0)==244){N=+Cb(+(+nn(1.0,105-h|0)),+J);M=+Za(+J,+(+nn(1.0,53-h|0)));I=N;K=M;J=N+(J-M)}f=b+2&127;do{if((f|0)!=(v|0)){k=c[k+(f<<2)>>2]|0;do{if(k>>>0<5e8>>>0){if((k|0)==0){if((b+3&127|0)==(v|0)){break}}K=r*.25+K}else{if(k>>>0>5e8>>>0){K=r*.75+K;break}if((b+3&127|0)==(v|0)){K=r*.5+K;break}else{K=r*.75+K;break}}}while(0);if((53-h|0)<=1){break}if(+Za(+K,+1.0)!=0.0){break}K=K+1.0}}while(0);r=J+K-I;do{if((e&2147483647|0)>(-2-m|0)){if(!(+W(+r)<9007199254740992.0)){r=r*.5;o=(o|0)!=0&(h|0)==(j|0)?0:o;n=n+1|0}if((n+50|0)<=(l|0)){if(!((o|0)!=0&K!=0.0)){break}}c[(Wb()|0)>>2]=34}}while(0);N=+on(r,n);i=g;return+N}else{if((c[o>>2]|0)!=0){c[n>>2]=(c[n>>2]|0)-1}c[(Wb()|0)>>2]=22;ln(b,0);N=0.0;i=g;return+N}}}while(0);do{if((p|0)==23){h=(c[o>>2]|0)==0;if(!h){c[n>>2]=(c[n>>2]|0)-1}if(m>>>0<4>>>0|(f|0)==0|h){break}do{c[n>>2]=(c[n>>2]|0)-1;m=m-1|0;}while(m>>>0>3>>>0)}}while(0);N=+(e|0)*x;i=g;return+N}function ln(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;c[a+104>>2]=b;e=c[a+8>>2]|0;d=c[a+4>>2]|0;f=e-d|0;c[a+108>>2]=f;if((b|0)!=0&(f|0)>(b|0)){c[a+100>>2]=d+b;return}else{c[a+100>>2]=e;return}}function mn(b){b=b|0;var e=0,f=0,g=0,h=0,i=0;g=b+104|0;e=c[g>>2]|0;if((e|0)==0){f=3}else{if((c[b+108>>2]|0)<(e|0)){f=3}}do{if((f|0)==3){e=qn(b)|0;if((e|0)<0){break}i=c[g>>2]|0;g=c[b+8>>2]|0;do{if((i|0)==0){f=8}else{h=c[b+4>>2]|0;i=i-(c[b+108>>2]|0)-1|0;if((g-h|0)<=(i|0)){f=8;break}c[b+100>>2]=h+i}}while(0);if((f|0)==8){c[b+100>>2]=g}f=c[b+4>>2]|0;if((g|0)!=0){i=b+108|0;c[i>>2]=g+1-f+(c[i>>2]|0)}b=f-1|0;if((d[b]|0|0)==(e|0)){i=e;return i|0}a[b]=e;i=e;return i|0}}while(0);c[b+100>>2]=0;i=-1;return i|0}function nn(a,b){a=+a;b=b|0;var d=0;do{if((b|0)>1023){a=a*8.98846567431158e+307;d=b-1023|0;if((d|0)<=1023){b=d;break}b=b-2046|0;a=a*8.98846567431158e+307;b=(b|0)>1023?1023:b}else{if(!((b|0)<-1022)){break}a=a*2.2250738585072014e-308;d=b+1022|0;if(!((d|0)<-1022)){b=d;break}b=b+2044|0;a=a*2.2250738585072014e-308;b=(b|0)<-1022?-1022:b}}while(0);return+(a*(c[k>>2]=0<<20|0>>>12,c[k+4>>2]=b+1023<<20|0>>>12,+h[k>>3]))}function on(a,b){a=+a;b=b|0;return+(+nn(a,b))}function pn(b){b=b|0;var d=0,e=0,f=0;e=b+74|0;d=a[e]|0;a[e]=d-1&255|d;e=b+20|0;d=b+44|0;if((c[e>>2]|0)>>>0>(c[d>>2]|0)>>>0){Fc[c[b+36>>2]&63](b,0,0)|0}c[b+16>>2]=0;c[b+28>>2]=0;c[e>>2]=0;f=b|0;e=c[f>>2]|0;if((e&20|0)==0){f=c[d>>2]|0;c[b+8>>2]=f;c[b+4>>2]=f;f=0;return f|0}if((e&4|0)==0){f=-1;return f|0}c[f>>2]=e|32;f=-1;return f|0}function qn(a){a=a|0;var b=0,e=0,f=0;b=i;i=i+8|0;f=b|0;if((c[a+8>>2]|0)==0){if((pn(a)|0)==0){e=3}else{a=-1}}else{e=3}do{if((e|0)==3){if((Fc[c[a+32>>2]&63](a,f,1)|0)!=1){a=-1;break}a=d[f]|0}}while(0);i=b;return a|0}function rn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0.0,f=0,g=0,h=0;d=i;i=i+112|0;f=d|0;zn(f|0,0,112)|0;h=f+4|0;c[h>>2]=a;g=f+8|0;c[g>>2]=-1;c[f+44>>2]=a;c[f+76>>2]=-1;ln(f,0);e=+kn(f,2,1);f=(c[h>>2]|0)-(c[g>>2]|0)+(c[f+108>>2]|0)|0;if((b|0)==0){i=d;return+e}if((f|0)!=0){a=a+f|0}c[b>>2]=a;i=d;return+e}function sn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=a+4|0;d=c[e>>2]|0;i=d&-8;f=a;l=f+i|0;k=l;j=c[2548]|0;h=d&3;if(!((h|0)!=1&f>>>0>=j>>>0&f>>>0<l>>>0)){gc();return 0}g=f+(i|4)|0;n=c[g>>2]|0;if((n&1|0)==0){gc();return 0}if((h|0)==0){if(b>>>0<256>>>0){p=0;return p|0}do{if(!(i>>>0<(b+4|0)>>>0)){if((i-b|0)>>>0>c[2528]<<1>>>0){break}return a|0}}while(0);p=0;return p|0}if(!(i>>>0<b>>>0)){h=i-b|0;if(!(h>>>0>15>>>0)){p=a;return p|0}c[e>>2]=d&1|b|2;c[f+(b+4)>>2]=h|3;c[g>>2]=c[g>>2]|1;tn(f+b|0,h);p=a;return p|0}if((k|0)==(c[2550]|0)){g=(c[2547]|0)+i|0;if(!(g>>>0>b>>>0)){p=0;return p|0}p=g-b|0;c[e>>2]=d&1|b|2;c[f+(b+4)>>2]=p|1;c[2550]=f+b;c[2547]=p;p=a;return p|0}if((k|0)==(c[2549]|0)){h=(c[2546]|0)+i|0;if(h>>>0<b>>>0){p=0;return p|0}g=h-b|0;if(g>>>0>15>>>0){c[e>>2]=d&1|b|2;c[f+(b+4)>>2]=g|1;c[f+h>>2]=g;d=f+(h+4)|0;c[d>>2]=c[d>>2]&-2;d=f+b|0}else{c[e>>2]=d&1|h|2;d=f+(h+4)|0;c[d>>2]=c[d>>2]|1;d=0;g=0}c[2546]=g;c[2549]=d;p=a;return p|0}if((n&2|0)!=0){p=0;return p|0}h=(n&-8)+i|0;if(h>>>0<b>>>0){p=0;return p|0}g=h-b|0;m=n>>>3;a:do{if(n>>>0<256>>>0){l=c[f+(i+8)>>2]|0;i=c[f+(i+12)>>2]|0;n=10216+(m<<1<<2)|0;do{if((l|0)!=(n|0)){if(l>>>0<j>>>0){gc();return 0}if((c[l+12>>2]|0)==(k|0)){break}gc();return 0}}while(0);if((i|0)==(l|0)){c[2544]=c[2544]&~(1<<m);break}do{if((i|0)==(n|0)){j=i+8|0}else{if(i>>>0<j>>>0){gc();return 0}j=i+8|0;if((c[j>>2]|0)==(k|0)){break}gc();return 0}}while(0);c[l+12>>2]=i;c[j>>2]=l}else{k=c[f+(i+24)>>2]|0;m=c[f+(i+12)>>2]|0;do{if((m|0)==(l|0)){n=f+(i+20)|0;m=c[n>>2]|0;if((m|0)==0){n=f+(i+16)|0;m=c[n>>2]|0;if((m|0)==0){m=0;break}}while(1){o=m+20|0;p=c[o>>2]|0;if((p|0)!=0){m=p;n=o;continue}o=m+16|0;p=c[o>>2]|0;if((p|0)==0){break}else{m=p;n=o}}if(n>>>0<j>>>0){gc();return 0}else{c[n>>2]=0;break}}else{n=c[f+(i+8)>>2]|0;if(n>>>0<j>>>0){gc();return 0}j=n+12|0;if((c[j>>2]|0)!=(l|0)){gc();return 0}o=m+8|0;if((c[o>>2]|0)==(l|0)){c[j>>2]=m;c[o>>2]=n;break}else{gc();return 0}}}while(0);if((k|0)==0){break}j=c[f+(i+28)>>2]|0;n=10480+(j<<2)|0;do{if((l|0)==(c[n>>2]|0)){c[n>>2]=m;if((m|0)!=0){break}c[2545]=c[2545]&~(1<<j);break a}else{if(k>>>0<(c[2548]|0)>>>0){gc();return 0}j=k+16|0;if((c[j>>2]|0)==(l|0)){c[j>>2]=m}else{c[k+20>>2]=m}if((m|0)==0){break a}}}while(0);j=c[2548]|0;if(m>>>0<j>>>0){gc();return 0}c[m+24>>2]=k;k=c[f+(i+16)>>2]|0;do{if((k|0)!=0){if(k>>>0<j>>>0){gc();return 0}else{c[m+16>>2]=k;c[k+24>>2]=m;break}}}while(0);i=c[f+(i+20)>>2]|0;if((i|0)==0){break}if(i>>>0<(c[2548]|0)>>>0){gc();return 0}else{c[m+20>>2]=i;c[i+24>>2]=m;break}}}while(0);if(g>>>0<16>>>0){c[e>>2]=h|d&1|2;p=f+(h|4)|0;c[p>>2]=c[p>>2]|1;p=a;return p|0}else{c[e>>2]=d&1|b|2;c[f+(b+4)>>2]=g|3;p=f+(h|4)|0;c[p>>2]=c[p>>2]|1;tn(f+b|0,g);p=a;return p|0}return 0}function tn(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;g=a;k=g+b|0;i=k;l=c[a+4>>2]|0;a:do{if((l&1|0)==0){o=c[a>>2]|0;if((l&3|0)==0){return}r=g+(-o|0)|0;a=r;l=o+b|0;p=c[2548]|0;if(r>>>0<p>>>0){gc()}if((a|0)==(c[2549]|0)){d=g+(b+4)|0;m=c[d>>2]|0;if((m&3|0)!=3){d=a;m=l;break}c[2546]=l;c[d>>2]=m&-2;c[g+(4-o)>>2]=l|1;c[k>>2]=l;return}s=o>>>3;if(o>>>0<256>>>0){d=c[g+(8-o)>>2]|0;m=c[g+(12-o)>>2]|0;n=10216+(s<<1<<2)|0;do{if((d|0)!=(n|0)){if(d>>>0<p>>>0){gc()}if((c[d+12>>2]|0)==(a|0)){break}gc()}}while(0);if((m|0)==(d|0)){c[2544]=c[2544]&~(1<<s);d=a;m=l;break}do{if((m|0)==(n|0)){q=m+8|0}else{if(m>>>0<p>>>0){gc()}n=m+8|0;if((c[n>>2]|0)==(a|0)){q=n;break}gc()}}while(0);c[d+12>>2]=m;c[q>>2]=d;d=a;m=l;break}q=c[g+(24-o)>>2]|0;s=c[g+(12-o)>>2]|0;do{if((s|0)==(r|0)){u=16-o|0;t=g+(u+4)|0;s=c[t>>2]|0;if((s|0)==0){t=g+u|0;s=c[t>>2]|0;if((s|0)==0){n=0;break}}while(1){u=s+20|0;v=c[u>>2]|0;if((v|0)!=0){s=v;t=u;continue}v=s+16|0;u=c[v>>2]|0;if((u|0)==0){break}else{s=u;t=v}}if(t>>>0<p>>>0){gc()}else{c[t>>2]=0;n=s;break}}else{t=c[g+(8-o)>>2]|0;if(t>>>0<p>>>0){gc()}p=t+12|0;if((c[p>>2]|0)!=(r|0)){gc()}u=s+8|0;if((c[u>>2]|0)==(r|0)){c[p>>2]=s;c[u>>2]=t;n=s;break}else{gc()}}}while(0);if((q|0)==0){d=a;m=l;break}p=c[g+(28-o)>>2]|0;s=10480+(p<<2)|0;do{if((r|0)==(c[s>>2]|0)){c[s>>2]=n;if((n|0)!=0){break}c[2545]=c[2545]&~(1<<p);d=a;m=l;break a}else{if(q>>>0<(c[2548]|0)>>>0){gc()}p=q+16|0;if((c[p>>2]|0)==(r|0)){c[p>>2]=n}else{c[q+20>>2]=n}if((n|0)==0){d=a;m=l;break a}}}while(0);p=c[2548]|0;if(n>>>0<p>>>0){gc()}c[n+24>>2]=q;q=16-o|0;o=c[g+q>>2]|0;do{if((o|0)!=0){if(o>>>0<p>>>0){gc()}else{c[n+16>>2]=o;c[o+24>>2]=n;break}}}while(0);o=c[g+(q+4)>>2]|0;if((o|0)==0){d=a;m=l;break}if(o>>>0<(c[2548]|0)>>>0){gc()}else{c[n+20>>2]=o;c[o+24>>2]=n;d=a;m=l;break}}else{d=a;m=b}}while(0);l=c[2548]|0;if(k>>>0<l>>>0){gc()}a=g+(b+4)|0;n=c[a>>2]|0;do{if((n&2|0)==0){if((i|0)==(c[2550]|0)){v=(c[2547]|0)+m|0;c[2547]=v;c[2550]=d;c[d+4>>2]=v|1;if((d|0)!=(c[2549]|0)){return}c[2549]=0;c[2546]=0;return}if((i|0)==(c[2549]|0)){v=(c[2546]|0)+m|0;c[2546]=v;c[2549]=d;c[d+4>>2]=v|1;c[d+v>>2]=v;return}m=(n&-8)+m|0;a=n>>>3;b:do{if(n>>>0<256>>>0){h=c[g+(b+8)>>2]|0;g=c[g+(b+12)>>2]|0;b=10216+(a<<1<<2)|0;do{if((h|0)!=(b|0)){if(h>>>0<l>>>0){gc()}if((c[h+12>>2]|0)==(i|0)){break}gc()}}while(0);if((g|0)==(h|0)){c[2544]=c[2544]&~(1<<a);break}do{if((g|0)==(b|0)){j=g+8|0}else{if(g>>>0<l>>>0){gc()}b=g+8|0;if((c[b>>2]|0)==(i|0)){j=b;break}gc()}}while(0);c[h+12>>2]=g;c[j>>2]=h}else{i=c[g+(b+24)>>2]|0;j=c[g+(b+12)>>2]|0;do{if((j|0)==(k|0)){a=g+(b+20)|0;j=c[a>>2]|0;if((j|0)==0){a=g+(b+16)|0;j=c[a>>2]|0;if((j|0)==0){h=0;break}}while(1){o=j+20|0;n=c[o>>2]|0;if((n|0)!=0){j=n;a=o;continue}o=j+16|0;n=c[o>>2]|0;if((n|0)==0){break}else{j=n;a=o}}if(a>>>0<l>>>0){gc()}else{c[a>>2]=0;h=j;break}}else{a=c[g+(b+8)>>2]|0;if(a>>>0<l>>>0){gc()}l=a+12|0;if((c[l>>2]|0)!=(k|0)){gc()}n=j+8|0;if((c[n>>2]|0)==(k|0)){c[l>>2]=j;c[n>>2]=a;h=j;break}else{gc()}}}while(0);if((i|0)==0){break}j=c[g+(b+28)>>2]|0;l=10480+(j<<2)|0;do{if((k|0)==(c[l>>2]|0)){c[l>>2]=h;if((h|0)!=0){break}c[2545]=c[2545]&~(1<<j);break b}else{if(i>>>0<(c[2548]|0)>>>0){gc()}j=i+16|0;if((c[j>>2]|0)==(k|0)){c[j>>2]=h}else{c[i+20>>2]=h}if((h|0)==0){break b}}}while(0);j=c[2548]|0;if(h>>>0<j>>>0){gc()}c[h+24>>2]=i;i=c[g+(b+16)>>2]|0;do{if((i|0)!=0){if(i>>>0<j>>>0){gc()}else{c[h+16>>2]=i;c[i+24>>2]=h;break}}}while(0);g=c[g+(b+20)>>2]|0;if((g|0)==0){break}if(g>>>0<(c[2548]|0)>>>0){gc()}else{c[h+20>>2]=g;c[g+24>>2]=h;break}}}while(0);c[d+4>>2]=m|1;c[d+m>>2]=m;if((d|0)!=(c[2549]|0)){break}c[2546]=m;return}else{c[a>>2]=n&-2;c[d+4>>2]=m|1;c[d+m>>2]=m}}while(0);h=m>>>3;if(m>>>0<256>>>0){i=h<<1;g=10216+(i<<2)|0;b=c[2544]|0;h=1<<h;do{if((b&h|0)==0){c[2544]=b|h;e=g;f=10216+(i+2<<2)|0}else{h=10216+(i+2<<2)|0;b=c[h>>2]|0;if(!(b>>>0<(c[2548]|0)>>>0)){e=b;f=h;break}gc()}}while(0);c[f>>2]=d;c[e+12>>2]=d;c[d+8>>2]=e;c[d+12>>2]=g;return}e=d;f=m>>>8;do{if((f|0)==0){g=0}else{if(m>>>0>16777215>>>0){g=31;break}u=(f+1048320|0)>>>16&8;v=f<<u;t=(v+520192|0)>>>16&4;v=v<<t;g=(v+245760|0)>>>16&2;g=14-(t|u|g)+(v<<g>>>15)|0;g=m>>>((g+7|0)>>>0)&1|g<<1}}while(0);f=10480+(g<<2)|0;c[d+28>>2]=g;c[d+20>>2]=0;c[d+16>>2]=0;h=c[2545]|0;b=1<<g;if((h&b|0)==0){c[2545]=h|b;c[f>>2]=e;c[d+24>>2]=f;c[d+12>>2]=d;c[d+8>>2]=d;return}f=c[f>>2]|0;if((g|0)==31){g=0}else{g=25-(g>>>1)|0}c:do{if((c[f+4>>2]&-8|0)!=(m|0)){g=m<<g;while(1){h=f+16+(g>>>31<<2)|0;b=c[h>>2]|0;if((b|0)==0){break}if((c[b+4>>2]&-8|0)==(m|0)){f=b;break c}else{f=b;g=g<<1}}if(h>>>0<(c[2548]|0)>>>0){gc()}c[h>>2]=e;c[d+24>>2]=f;c[d+12>>2]=d;c[d+8>>2]=d;return}}while(0);b=f+8|0;g=c[b>>2]|0;v=c[2548]|0;if(!(f>>>0>=v>>>0&g>>>0>=v>>>0)){gc()}c[g+12>>2]=e;c[b>>2]=e;c[d+8>>2]=g;c[d+12>>2]=f;c[d+24>>2]=0;return}function un(a,b){a=a|0;b=b|0;var e=0,f=0,g=0,h=0,i=0,j=0;e=a+4|0;g=c[e>>2]|0;f=a+100|0;if(g>>>0<(c[f>>2]|0)>>>0){c[e>>2]=g+1;h=d[g]|0}else{h=mn(a)|0}do{if((h|0)==45|(h|0)==43){i=c[e>>2]|0;g=(h|0)==45|0;if(i>>>0<(c[f>>2]|0)>>>0){c[e>>2]=i+1;h=d[i]|0}else{h=mn(a)|0}if(!((h-48|0)>>>0>9>>>0&(b|0)!=0)){break}if((c[f>>2]|0)==0){break}c[e>>2]=(c[e>>2]|0)-1}else{g=0}}while(0);if((h-48|0)>>>0>9>>>0){if((c[f>>2]|0)==0){h=-2147483648;i=0;return(L=h,i)|0}c[e>>2]=(c[e>>2]|0)-1;h=-2147483648;i=0;return(L=h,i)|0}else{b=0}do{b=h-48+(b*10|0)|0;h=c[e>>2]|0;if(h>>>0<(c[f>>2]|0)>>>0){c[e>>2]=h+1;h=d[h]|0}else{h=mn(a)|0}}while((h-48|0)>>>0<10>>>0&(b|0)<214748364);i=b;b=(b|0)<0|0?-1:0;if((h-48|0)>>>0<10>>>0){do{b=Ln(i,b,10,0)|0;i=L;h=Bn(h,(h|0)<0|0?-1:0,-48,-1)|0;i=Bn(h,L,b,i)|0;b=L;h=c[e>>2]|0;if(h>>>0<(c[f>>2]|0)>>>0){c[e>>2]=h+1;h=d[h]|0}else{h=mn(a)|0}j=21474836;}while((h-48|0)>>>0<10>>>0&((b|0)<(j|0)|(b|0)==(j|0)&i>>>0<2061584302>>>0))}if((h-48|0)>>>0<10>>>0){do{h=c[e>>2]|0;if(h>>>0<(c[f>>2]|0)>>>0){c[e>>2]=h+1;h=d[h]|0}else{h=mn(a)|0}}while((h-48|0)>>>0<10>>>0)}if((c[f>>2]|0)!=0){c[e>>2]=(c[e>>2]|0)-1}e=(g|0)!=0;a=Cn(0,0,i,b)|0;f=e?L:b;j=e?a:i;return(L=f,j)|0}function vn(a){a=a|0;var b=0;b=(ha(c[a>>2]|0,31010991)|0)+1735287159&2147483647;c[a>>2]=b;return b|0}function wn(){return vn(o)|0}function xn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;if((e|0)>=4096)return ub(b|0,d|0,e|0)|0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function yn(b,c,d){b=b|0;c=c|0;d=d|0;var e=0;if((c|0)<(b|0)&(b|0)<(c+d|0)){e=b;c=c+d|0;b=b+d|0;while((d|0)>0){b=b-1|0;c=c-1|0;d=d-1|0;a[b]=a[c]|0}b=e}else{xn(b,c,d)|0}return b|0}function zn(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;i=b&3;h=d|d<<8|d<<16|d<<24;g=f&~3;if(i){i=b+4-i|0;while((b|0)<(i|0)){a[b]=d;b=b+1|0}}while((b|0)<(g|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function An(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function Bn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;c=a+c>>>0;return(L=b+d+(c>>>0<a>>>0|0)>>>0,c|0)|0}function Cn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;b=b-d-(c>>>0>a>>>0|0)>>>0;return(L=b,a-c>>>0|0)|0}function Dn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}L=a<<c-32;return 0}function En(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}L=0;return b>>>c-32|0}function Fn(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){L=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}L=(b|0)<0?-1:0;return b>>c-32|0}function Gn(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function Hn(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function In(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;f=a&65535;d=b&65535;c=ha(d,f)|0;e=a>>>16;d=(c>>>16)+(ha(d,e)|0)|0;b=b>>>16;a=ha(b,f)|0;return(L=(d>>>16)+(ha(b,e)|0)+(((d&65535)+a|0)>>>16)|0,d+a<<16|c&65535|0)|0}function Jn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;a=Cn(e^a,f^b,e,f)|0;b=L;e=g^e;f=h^f;g=Cn((On(a,b,Cn(g^c,h^d,g,h)|0,L,0)|0)^e,L^f,e,f)|0;return(L=L,g)|0}function Kn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0;g=i;i=i+8|0;f=g|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;a=Cn(h^a,j^b,h,j)|0;b=L;On(a,b,Cn(k^d,l^e,k,l)|0,L,f)|0;k=Cn(c[f>>2]^h,c[f+4>>2]^j,h,j)|0;j=L;i=g;return(L=j,k)|0}function Ln(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;f=c;a=In(e,f)|0;c=L;return(L=(ha(b,f)|0)+(ha(d,e)|0)+c|c&0,a|0|0)|0}function Mn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;a=On(a,b,c,d,0)|0;return(L=L,a)|0}function Nn(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;g=i;i=i+8|0;f=g|0;On(a,b,d,e,f)|0;i=g;return(L=c[f+4>>2]|0,c[f>>2]|0)|0}function On(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;h=a;j=b;i=j;k=d;g=e;l=g;if((i|0)==0){d=(f|0)!=0;if((l|0)==0){if(d){c[f>>2]=(h>>>0)%(k>>>0);c[f+4>>2]=0}l=0;m=(h>>>0)/(k>>>0)>>>0;return(L=l,m)|0}else{if(!d){l=0;m=0;return(L=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;l=0;m=0;return(L=l,m)|0}}m=(l|0)==0;do{if((k|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(k>>>0);c[f+4>>2]=0}l=0;m=(i>>>0)/(k>>>0)>>>0;return(L=l,m)|0}if((h|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}k=0;m=(i>>>0)/(l>>>0)>>>0;return(L=k,m)|0}k=l-1|0;if((k&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=k&i|b&0}k=0;m=i>>>((Hn(l|0)|0)>>>0);return(L=k,m)|0}k=(Gn(l|0)|0)-(Gn(i|0)|0)|0;if(k>>>0<=30){b=k+1|0;m=31-k|0;j=b;a=i<<m|h>>>(b>>>0);b=i>>>(b>>>0);l=0;i=h<<m;break}if((f|0)==0){l=0;m=0;return(L=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;l=0;m=0;return(L=l,m)|0}else{if(!m){k=(Gn(l|0)|0)-(Gn(i|0)|0)|0;if(k>>>0<=31){l=k+1|0;m=31-k|0;b=k-31>>31;j=l;a=h>>>(l>>>0)&b|i<<m;b=i>>>(l>>>0)&b;l=0;i=h<<m;break}if((f|0)==0){l=0;m=0;return(L=l,m)|0}c[f>>2]=a|0;c[f+4>>2]=j|b&0;l=0;m=0;return(L=l,m)|0}l=k-1|0;if((l&k|0)!=0){m=(Gn(k|0)|0)+33-(Gn(i|0)|0)|0;p=64-m|0;k=32-m|0;n=k>>31;o=m-32|0;b=o>>31;j=m;a=k-1>>31&i>>>(o>>>0)|(i<<k|h>>>(m>>>0))&b;b=b&i>>>(m>>>0);l=h<<p&n;i=(i<<p|h>>>(o>>>0))&n|h<<k&m-33>>31;break}if((f|0)!=0){c[f>>2]=l&h;c[f+4>>2]=0}if((k|0)==1){o=j|b&0;p=a|0|0;return(L=o,p)|0}else{p=Hn(k|0)|0;o=i>>>(p>>>0)|0;p=i<<32-p|h>>>(p>>>0)|0;return(L=o,p)|0}}}while(0);if((j|0)==0){m=a;d=0;a=0}else{d=d|0|0;g=g|e&0;e=Bn(d,g,-1,-1)|0;h=L;k=b;m=a;a=0;while(1){b=l>>>31|i<<1;l=a|l<<1;i=m<<1|i>>>31|0;k=m>>>31|k<<1|0;Cn(e,h,i,k)|0;m=L;p=m>>31|((m|0)<0?-1:0)<<1;a=p&1;m=Cn(i,k,p&d,(((m|0)<0?-1:0)>>31|((m|0)<0?-1:0)<<1)&g)|0;k=L;j=j-1|0;if((j|0)==0){break}else{i=b}}i=b;b=k;d=0}g=0;if((f|0)!=0){c[f>>2]=m;c[f+4>>2]=b}o=(l|0)>>>31|(i|g)<<1|(g<<1|l>>>31)&0|d;p=(l<<1|0>>>31)&-2|a;return(L=o,p)|0}function Pn(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;yc[a&7](b|0,c|0,d|0,e|0,f|0)}function Qn(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;zc[a&127](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function Rn(a,b){a=a|0;b=b|0;Ac[a&255](b|0)}function Sn(a,b,c){a=a|0;b=b|0;c=c|0;Bc[a&127](b|0,c|0)}function Tn(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return Cc[a&31](b|0,c|0,d|0,e|0)|0}function Un(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=+h;Dc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,+h)}function Vn(a,b){a=a|0;b=b|0;return Ec[a&127](b|0)|0}function Wn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return Fc[a&63](b|0,c|0,d|0)|0}function Xn(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;Gc[a&7](b|0,c|0,d|0)}function Yn(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;Hc[a&15](b|0,c|0,d|0,e|0,f|0,+g)}function Zn(a){a=a|0;Ic[a&3]()}function _n(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;return Jc[a&31](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)|0}function $n(a,b,c,d,e,f,g,h,i,j){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;j=j|0;Kc[a&7](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0,j|0)}function ao(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;Lc[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0,i|0)}function bo(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;Mc[a&31](b|0,c|0,d|0,e|0,f|0,g|0)}function co(a,b,c){a=a|0;b=b|0;c=c|0;return Nc[a&31](b|0,c|0)|0}function eo(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return Oc[a&31](b|0,c|0,d|0,e|0,f|0)|0}function fo(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;Pc[a&15](b|0,c|0,d|0,e|0)}function go(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ia(0)}function ho(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;ia(1)}function io(a){a=a|0;ia(2)}function jo(a,b){a=a|0;b=b|0;ia(3)}function ko(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ia(4);return 0}function lo(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=+g;ia(5)}function mo(a){a=a|0;ia(6);return 0}function no(a,b,c){a=a|0;b=b|0;c=c|0;ia(7);return 0}function oo(a,b,c){a=a|0;b=b|0;c=c|0;ia(8)}function po(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=+f;ia(9)}function qo(){ia(10)}function ro(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ia(11);return 0}function so(a,b,c,d,e,f,g,h,i){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;ia(12)}function to(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;ia(13)}function uo(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;ia(14)}function vo(a,b){a=a|0;b=b|0;ia(15);return 0}function wo(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;ia(16);return 0}function xo(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;ia(17)}




// EMSCRIPTEN_END_FUNCS
var yc=[go,go,Vm,go,Wm,go,Um,go];var zc=[ho,ho,eh,ho,mh,ho,oh,ho,Ri,ho,Tg,ho,Rg,ho,Li,ho,ah,ho,dh,ho,ph,ho,Hg,ho,sg,ho,ch,ho,cg,ho,mg,ho,nh,ho,Fg,ho,og,ho,kg,ho,lg,ho,fg,ho,ng,ho,jg,ho,ig,ho,rg,ho,qg,ho,pg,ho,qh,ho,$f,ho,bh,ho,bg,ho,Zf,ho,_f,ho,ag,ho,Yf,ho,eg,ho,dg,ho,Xf,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho,ho];var Ac=[io,io,Xi,io,Vf,io,Ng,io,Zd,io,Je,io,dm,io,Sk,io,mj,io,Yk,io,Ag,io,Rd,io,_j,io,Xd,io,gg,io,Lf,io,If,io,gn,io,Sd,io,kj,io,Aj,io,kh,io,hg,io,Fm,io,Bf,io,Ti,io,lj,io,nf,io,Wf,io,em,io,Yh,io,fm,io,ej,io,rk,io,Km,io,qk,io,Xd,io,bm,io,Rf,io,Dh,io,tk,io,nj,io,$m,io,Mi,io,pk,io,rf,io,Ke,io,Qf,io,yh,io,Sd,io,sl,io,Bg,io,ge,io,gk,io,Zh,io,mf,io,yf,io,uh,io,jh,io,Jf,io,Nh,io,fn,io,Ie,io,Cf,io,Ye,io,Nm,io,Kj,io,Hm,io,of,io,Hf,io,si,io,Md,io,hi,io,Df,io,ij,io,Lm,io,dj,io,vh,io,Bi,io,Gm,io,vi,io,Ni,io,Ch,io,Mg,io,Kf,io,bl,io,Mf,io,tf,io,ee,io,Sj,io,Gi,io,Ai,io,sk,io,ye,io,Hm,io,Om,io,xf,io,fe,io,lf,io,Ze,io,Af,io,Si,io,Fe,io,wf,io,gl,io,gj,io,ml,io,ii,io,Zg,io,Oh,io,Tk,io,cm,io,sf,io,Xe,io,vf,io,ok,io,gm,io,_g,io,Mm,io,Yi,io,Jm,io,zh,io,Hi,io,ti,io,me,io,Bj,io,Wd,io,qf,io];var Bc=[jo,jo,Ck,jo,ni,jo,Rh,jo,zk,jo,gi,jo,yk,jo,Xh,jo,Uk,jo,Wi,jo,_e,jo,Jh,jo,qi,jo,di,jo,Ih,jo,Gh,jo,oi,jo,hj,jo,cl,jo,ri,jo,Bk,jo,Sh,jo,Vd,jo,li,jo,Dk,jo,fi,jo,Uh,jo,Ak,jo,Wh,jo,Zk,jo,Le,jo,hl,jo,$i,jo,ai,jo,Mh,jo,Lh,jo,Hh,jo,bi,jo,ci,jo,mi,jo,Th,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo,jo];var Cc=[ko,ko,fd,ko,id,ko,pj,ko,jd,ko,kd,ko,qj,ko,Hj,ko,hd,ko,ld,ko,md,ko,gd,ko,xj,ko,nd,ko,rj,ko,ko,ko];var Dc=[lo,lo,Oi,lo,Ii,lo,lo,lo];var Ec=[mo,mo,Rk,mo,$h,mo,Se,mo,Pj,mo,Hk,mo,Te,mo,Pk,mo,Ph,mo,$g,mo,Fk,mo,jl,mo,gf,mo,ff,mo,kk,mo,Lk,mo,Jk,mo,Im,mo,Yd,mo,xk,mo,uk,mo,Kk,mo,vk,mo,Pe,mo,Oj,mo,pi,mo,Mk,mo,Vk,mo,Qh,mo,dk,mo,ji,mo,Ek,mo,_k,mo,lk,mo,hn,mo,Ff,mo,Kh,mo,$k,mo,wk,mo,Qe,mo,cf,mo,dl,mo,Rj,mo,Vh,mo,Qk,mo,il,mo,ck,mo,Xj,mo,df,mo,Eh,mo,Gk,mo,Fh,mo,Td,mo,_h,mo,Zj,mo,ei,mo,Ik,mo,ki,mo,Wj,mo,lh,mo,Ok,mo,Nk,mo,fk,mo,nk,mo];var Fc=[no,no,Pf,no,Dj,no,vj,no,Pm,no,yj,no,Uf,no,$d,no,Ve,no,Re,no,oj,no,$e,no,Zi,no,Ij,no,tj,no,Wk,no,ae,no,ef,no,Fj,no,Ui,no,Me,no,el,no,jf,no,no,no,no,no,no,no,no,no,no,no,no,no,no,no,no,no,no,no];var Gc=[oo,oo,_d,oo,Gf,oo,oo,oo];var Hc=[po,po,Wg,po,Ug,po,Kg,po,Ig,po,po,po,po,po,po,po];var Ic=[qo,qo,vd,qo];var Jc=[ro,ro,Tj,ro,ak,ro,$j,ro,ik,ro,Uj,ro,hk,ro,Lj,ro,Mj,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro,ro];var Kc=[so,so,rh,so,fh,so,so,so];var Lc=[to,to,Ah,to,xh,to,ui,to,Ci,to,yi,to,Ei,to,to,to];var Mc=[uo,uo,Xm,uo,Sg,uo,Pg,uo,Og,uo,Ym,uo,Xg,uo,Vi,uo,af,uo,Lg,uo,Cg,uo,Gg,uo,Dg,uo,Zm,uo,Ne,uo,_i,uo];var Nc=[vo,vo,kl,vo,wj,vo,hf,vo,Gj,vo,Cj,vo,al,vo,fl,vo,sj,vo,Ej,vo,We,vo,kf,vo,uj,vo,Ue,vo,Xk,vo,vo,vo];var Oc=[wo,wo,zj,wo,bk,wo,Jj,wo,Sf,wo,mk,wo,ek,wo,Vj,wo,Nf,wo,Nj,wo,Qj,wo,jk,wo,Yj,wo,wo,wo,wo,wo,wo,wo];var Pc=[xo,xo,Rm,xo,Sm,xo,Qm,xo,Oe,xo,Tf,xo,bf,xo,Of,xo];return{_strlen:An,_free:$m,_main:wd,_rand_r:vn,_realloc:an,_memmove:yn,__GLOBAL__I_a:ll,_memset:zn,_malloc:_m,_memcpy:xn,_rand:wn,runPostSets:ed,stackAlloc:Qc,stackSave:Rc,stackRestore:Sc,setThrew:Tc,setTempRet0:Wc,setTempRet1:Xc,setTempRet2:Yc,setTempRet3:Zc,setTempRet4:_c,setTempRet5:$c,setTempRet6:ad,setTempRet7:bd,setTempRet8:cd,setTempRet9:dd,dynCall_viiiii:Pn,dynCall_viiiiiii:Qn,dynCall_vi:Rn,dynCall_vii:Sn,dynCall_iiiii:Tn,dynCall_viiiiiid:Un,dynCall_ii:Vn,dynCall_iiii:Wn,dynCall_viii:Xn,dynCall_viiiiid:Yn,dynCall_v:Zn,dynCall_iiiiiiiii:_n,dynCall_viiiiiiiii:$n,dynCall_viiiiiiii:ao,dynCall_viiiiii:bo,dynCall_iii:co,dynCall_iiiiii:eo,dynCall_viiii:fo}})


// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiii": invoke_iiiii, "invoke_viiiiiid": invoke_viiiiiid, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_viii": invoke_viii, "invoke_viiiiid": invoke_viiiiid, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_viiiiiiiii": invoke_viiiiiiiii, "invoke_viiiiiiii": invoke_viiiiiiii, "invoke_viiiiii": invoke_viiiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_llvm_lifetime_end": _llvm_lifetime_end, "__scanString": __scanString, "_pthread_mutex_lock": _pthread_mutex_lock, "___cxa_end_catch": ___cxa_end_catch, "_strtoull": _strtoull, "_fflush": _fflush, "_SDL_GetMouseState": _SDL_GetMouseState, "_emscripten_asm_const_int": _emscripten_asm_const_int, "_fwrite": _fwrite, "_send": _send, "_isspace": _isspace, "_read": _read, "_isxdigit_l": _isxdigit_l, "_SDL_PumpEvents": _SDL_PumpEvents, "_fileno": _fileno, "___cxa_guard_abort": ___cxa_guard_abort, "_newlocale": _newlocale, "___gxx_personality_v0": ___gxx_personality_v0, "_pthread_cond_wait": _pthread_cond_wait, "___cxa_rethrow": ___cxa_rethrow, "_fmod": _fmod, "___resumeException": ___resumeException, "_llvm_va_end": _llvm_va_end, "_vsscanf": _vsscanf, "_snprintf": _snprintf, "_fgetc": _fgetc, "__getFloat": __getFloat, "_atexit": _atexit, "___cxa_free_exception": ___cxa_free_exception, "_isdigit_l": _isdigit_l, "___setErrNo": ___setErrNo, "_isxdigit": _isxdigit, "_exit": _exit, "_sprintf": _sprintf, "___ctype_b_loc": ___ctype_b_loc, "_freelocale": _freelocale, "_catgets": _catgets, "__isLeapYear": __isLeapYear, "_asprintf": _asprintf, "___cxa_is_number_type": ___cxa_is_number_type, "___cxa_does_inherit": ___cxa_does_inherit, "___cxa_guard_acquire": ___cxa_guard_acquire, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_recv": _recv, "__parseInt64": __parseInt64, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "_SDL_PollEvent": _SDL_PollEvent, "__ZNSt9exceptionD2Ev": __ZNSt9exceptionD2Ev, "_SDL_Init": _SDL_Init, "_mkport": _mkport, "_copysign": _copysign, "__exit": __exit, "_strftime": _strftime, "___cxa_throw": ___cxa_throw, "_pread": _pread, "_SDL_SetVideoMode": _SDL_SetVideoMode, "_SDL_LockSurface": _SDL_LockSurface, "_strtoull_l": _strtoull_l, "__arraySum": __arraySum, "_SDL_UnlockSurface": _SDL_UnlockSurface, "_strtoll_l": _strtoll_l, "_SDL_Flip": _SDL_Flip, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "_fread": _fread, "__formatString": __formatString, "_pthread_cond_broadcast": _pthread_cond_broadcast, "__ZSt9terminatev": __ZSt9terminatev, "_pthread_mutex_unlock": _pthread_mutex_unlock, "___cxa_call_unexpected": ___cxa_call_unexpected, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_strerror": _strerror, "_catclose": _catclose, "_llvm_lifetime_start": _llvm_lifetime_start, "___cxa_guard_release": ___cxa_guard_release, "_ungetc": _ungetc, "_uselocale": _uselocale, "_vsnprintf": _vsnprintf, "_sscanf": _sscanf, "_sysconf": _sysconf, "_srand": _srand, "_strftime_l": _strftime_l, "_abort": _abort, "_isdigit": _isdigit, "_strtoll": _strtoll, "__addDays": __addDays, "_fabs": _fabs, "__reallyNegative": __reallyNegative, "_SDL_MapRGBA": _SDL_MapRGBA, "_write": _write, "___cxa_allocate_exception": ___cxa_allocate_exception, "_vasprintf": _vasprintf, "_emscripten_set_main_loop": _emscripten_set_main_loop, "_catopen": _catopen, "___ctype_toupper_loc": ___ctype_toupper_loc, "___ctype_tolower_loc": ___ctype_tolower_loc, "_pwrite": _pwrite, "_strerror_r": _strerror_r, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "___rand_seed": ___rand_seed, "NaN": NaN, "Infinity": Infinity, "_stdin": _stdin, "__ZTVN10__cxxabiv117__class_type_infoE": __ZTVN10__cxxabiv117__class_type_infoE, "__ZTVN10__cxxabiv120__si_class_type_infoE": __ZTVN10__cxxabiv120__si_class_type_infoE, "_stderr": _stderr, "_stdout": _stdout, "__ZTISt9exception": __ZTISt9exception, "___dso_handle": ___dso_handle }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _main = Module["_main"] = asm["_main"];
var _rand_r = Module["_rand_r"] = asm["_rand_r"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var __GLOBAL__I_a = Module["__GLOBAL__I_a"] = asm["__GLOBAL__I_a"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _rand = Module["_rand"] = asm["_rand"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiiiiid = Module["dynCall_viiiiiid"] = asm["dynCall_viiiiiid"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_viiiiid = Module["dynCall_viiiiid"] = asm["dynCall_viiiiid"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = asm["dynCall_iiiiiiiii"];
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = asm["dynCall_viiiiiiiii"];
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = asm["dynCall_viiiiiiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];

Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };

// TODO: strip out parts of this we do not need

//======= begin closure i64 code =======

// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */

var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };


  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.

    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };


  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.


  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};


  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }

    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };


  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };


  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };


  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }

    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }

    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));

    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };


  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.


  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;


  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;


  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);


  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);


  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);


  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);


  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);


  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);


  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };


  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };


  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }

    if (this.isZero()) {
      return '0';
    }

    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }

    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));

    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);

      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };


  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };


  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };


  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };


  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };


  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };


  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };


  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };


  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };


  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }

    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }

    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };


  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };


  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };


  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }

    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }

    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.

    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;

    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;

    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };


  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }

    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }

    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }

    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));

      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);

      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }

      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }

      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };


  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };


  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };


  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };


  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };


  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };


  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };


  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };

  //======= begin jsbn =======

  var navigator = { appName: 'Modern Browser' }; // polyfill a little

  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/

  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */

  // Basic JavaScript BN library - subset useful for RSA encryption.

  // Bits per digit
  var dbits;

  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);

  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }

  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }

  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.

  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }

  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);

  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;

  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }

  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }

  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }

  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }

  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }

  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }

  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }

  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }

  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }

  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }

  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }

  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }

  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }

  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }

  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }

  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }

  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }

  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }

  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;

  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }

  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }

  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }

  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }

  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }

  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;

  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }

  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }

  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }

  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;

  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;

  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);

  // jsbn2 stuff

  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }

  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }

  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }

  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }

  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }

  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }

  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }

  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;

  //======= end jsbn =======

  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();

//======= end closure i64 code =======



// === Auto-generated postamble setup entry stuff ===

if (memoryInitializer) {
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    var data = Module['readBinary'](memoryInitializer);
    HEAPU8.set(data, STATIC_BASE);
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      HEAPU8.set(data, STATIC_BASE);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}

function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = STACKTOP;

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    ensureInitRuntime();

    preMain();

    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;

  // exit the runtime
  exitRuntime();

  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371

  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }

  ABORT = true;
  EXITSTATUS = 1;

  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}






