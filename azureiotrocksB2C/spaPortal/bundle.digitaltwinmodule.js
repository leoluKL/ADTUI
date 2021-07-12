(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel");
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");

function digitaltwinmoduleUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()

    this.broadcastMessage() //initialize all ui components to have the broadcast capability

    //try if it already B2C signed in, if not going back to the start page
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);


    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    this.initData()
}


digitaltwinmoduleUI.prototype.initData=async function(){
    try{
        await msalHelper.reloadUserAccountData()
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return
    }

    startSelectionDialog.popup()
}

digitaltwinmoduleUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,startSelectionDialog,modelManagerDialog,modelEditorDialog,editLayoutDialog,
         mainToolbar,this.topologyInstance,infoPanel,newTwinDialog]

    if(source==null){
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            this.assignBroadcastMessage(theComponent)
        }
    }else{
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            if(theComponent.rxMessage && theComponent!=source) theComponent.rxMessage(msgPayload)
        }
    }
}

digitaltwinmoduleUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

digitaltwinmoduleUI.prototype.initUILayout = function () {
    var myLayout = $('body').layout({
        //	reference only - these options are NOT required because 'true' is the default
        closable: true	// pane can open & close
        , resizable: true	// when open, pane can be resized 
        , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
        , livePaneResizing: true

        //	some resizing/toggling settings
        , north__slidable: false	// OVERRIDE the pane-default of 'slidable=true'
        //, north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
        , north__spacing_closed: 6		// big resizer-bar when open (zero height)
        , north__spacing_open:0
        , north__resizable: false	// OVERRIDE the pane-default of 'resizable=true'
        , north__closable: false
        , west__closable: false
        , east__closable: false
        

        //	some pane-size settings
        , west__minSize: 100
        , east__size: 300
        , east__minSize: 200
        , east__maxSize: .5 // 50% of layout width
        , center__minWidth: 100
        ,east__closable: false
        ,west__closable: false
        ,east__initClosed:	true
    });


    /*
     *	DISABLE TEXT-SELECTION WHEN DRAGGING (or even _trying_ to drag!)
     *	this functionality will be included in RC30.80
     */
    $.layout.disableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled'
            , x = 'textSelectionInitialized'
            ;
        if ($.fn.disableSelection) {
            if (!$d.data(x)) // document hasn't been initialized yet
                $d.on('mouseup', $.layout.enableTextSelection).data(x, true);
            if (!$d.data(s))
                $d.disableSelection().data(s, true);
        }
        //console.log('$.layout.disableTextSelection');
    };
    $.layout.enableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled';
        if ($.fn.enableSelection && $d.data(s))
            $d.enableSelection().data(s, false);
        //console.log('$.layout.enableTextSelection');
    };
    $(".ui-layout-resizer-north").hide()
    $(".ui-layout-west").css("border-right","solid 1px lightGray")
    $(".ui-layout-west").addClass("w3-card")
}


module.exports = new digitaltwinmoduleUI();
},{"../globalAppSettings.js":11,"../msalHelper":12,"../sharedSourceFiles/modelEditorDialog":16,"../sharedSourceFiles/modelManagerDialog":17,"../sharedSourceFiles/newTwinDialog":19,"./editLayoutDialog":5,"./infoPanel":6,"./mainToolbar":7,"./startSelectionDialog":8,"./topologyDOM.js":9,"./twinsTree":10}],5:[function(require,module,exports){
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.clearOptions()
    
    for(var ind in globalCache.layoutJSON){
        this.switchLayoutSelector.addOption(ind)
    }
}

editLayoutDialog.prototype.popup = function () {
    this.DOM.show()
    this.DOM.empty()

    this.DOM.css({"width":"320px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Layout</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var nameInput=$('<input type="text" style="outline:none; width:180px; display:inline;margin-left:2px;margin-right:2px"  placeholder="Fill in a new layout name..."/>').addClass("w3-input w3-border");   
    this.DOM.append(nameInput)
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save New Layout</button>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})


    if(!jQuery.isEmptyObject(globalCache.layoutJSON)){
        var lbl=$('<div class="w3-bar w3-padding-16" style="text-align:center;">- OR -</div>')
        this.DOM.append(lbl) 
        var switchLayoutSelector=new simpleSelectMenu("",{fontSize:"1em",colorClass:"w3-light-gray",width:"120px"})
        this.switchLayoutSelector=switchLayoutSelector
        this.refillOptions()
        this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
            if(optionText==null) this.switchLayoutSelector.changeName(" ")
            else this.switchLayoutSelector.changeName(optionText)
        }
            
        var saveAsBtn=$('<button class="w3-button w3-green w3-hover-light-green" style="margin-left:2px;margin-right:5px">Save As</button>')
        var deleteBtn=$('<button class="w3-button w3-red w3-hover-pink" style="margin-left:5px">Delete Layout</button>')
        this.DOM.append(saveAsBtn,switchLayoutSelector.DOM,deleteBtn)
        saveAsBtn.on("click",()=>{this.saveIntoLayout(switchLayoutSelector.curSelectVal)})
        deleteBtn.on("click",()=>{this.deleteLayout(switchLayoutSelector.curSelectVal)})

        if(globalCache.currentLayoutName!=null){
            switchLayoutSelector.triggerOptionValue(globalCache.currentLayoutName)
        }else{
            switchLayoutSelector.triggerOptionIndex(0)
        }
    }
}

editLayoutDialog.prototype.saveIntoLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return
    }
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName})
    this.DOM.hide()
}


editLayoutDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }

    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        confirmDialogDiv.close()
                        this.broadcastMessage({ "message": "layoutsUpdated"})
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName })
                        }catch(e){
                            console.log(e)
                            if(e.responseText) alert(e.responseText)
                        }
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )

}

module.exports = new editLayoutDialog();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/simpleConfirmDialog":20,"../sharedSourceFiles/simpleSelectMenu":21}],6:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")

function infoPanel() {
    this.continerDOM=$('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
    this.continerDOM.hide()
    this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

    this.closeButton1=$('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
    this.closeButton2=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
    this.continerDOM.children(':first').append(this.closeButton1,this.closeButton2) 

    this.isMinimized=false;
    var buttonAnim=()=>{
        if(!this.isMinimized){
            this.continerDOM.animate({
                right: "-250px",
                height:"50px"
            })
            this.isMinimized=true;
        }else{
            this.continerDOM.animate({
                right: "0px",
                height: "70%"
            })
            this.isMinimized=false;
        }
    }
    this.closeButton1.on("click",buttonAnim)
    this.closeButton2.on("click",buttonAnim)

    this.DOM=$('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
    this.continerDOM.css("background-color","rgba(255, 255, 255, 0.8)")
    this.continerDOM.hover(() => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
    }, () => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
    });
    this.continerDOM.append(this.DOM)
    $('body').append(this.continerDOM)

    this.drawButtons(null)
    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelectionDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="showInfoSelectedNodes"){
        this.DOM.empty()
        var arr=msgPayload.info;
        
        if(arr==null || arr.length==0){
            this.drawButtons(null)
            this.selectedObjects=[];
            return;
        }
        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                
                //instead of draw the $dtId, draw display name instead
                //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                this.drawStaticInfo(this.DOM,{"name":singleElementInfo["displayName"]},"1em","13px")


                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                //instead of drawing the original infomration, draw more meaningful one
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
                this.drawStaticInfo(this.DOM,{"Model":singleElementInfo["$metadata"]["$model"]},"1em","10px")
                for(var ind in singleElementInfo["$metadata"]){
                    if(ind == "$model") continue;
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
            }else if(singleElementInfo["$sourceId"]){
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "From":globalCache.twinIDMapToDisplayName[singleElementInfo["$sourceId"]],
                    "To":globalCache.twinIDMapToDisplayName[singleElementInfo["$targetId"]],
                    "Relationship Type":singleElementInfo["$relationshipName"]
                    //,"$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","13px")
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                for(var ind in singleElementInfo["$metadata"]){
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        }else if(arr.length>1){
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }
}

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fa fa-arrow-circle-o-down"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fa fa-refresh"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fa fa-arrow-circle-o-up"></i></button>')    
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    }else{
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl or shift key to select multiple in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:5px'>Import twins data by clicking button below</a>")
        this.DOM.append(impBtn,actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        var connectToBtn =$('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
        var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
        var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
        var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')
        
        this.DOM.append(delBtn, connectToBtn,connectFromBtn , showInboundBtn, showOutBoundBtn)
    
        showOutBoundBtn.on("click",()=>{this.showOutBound()})
        showInboundBtn.on("click",()=>{this.showInBound()})  
        connectToBtn.on("click",()=>{this.broadcastMessage({ "message": "connectTo"}) })
        connectFromBtn.on("click",()=>{this.broadcastMessage({ "message": "connectFrom"}) })

        delBtn.on("click",()=>{this.deleteSelected()})
    }
    
    var numOfNode = 0;
    var arr=this.selectedObjects;
    arr.forEach(element => {
        if (element['$dtId']) numOfNode++
    });
    if(numOfNode>0){
        var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
        var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
        var coseLayoutBtn= $('<button class="w3-button w3-border">COSE View</button>')
        var hideBtn= $('<button class="w3-button w3-border">Hide</button>')
        this.DOM.append(selectInboundBtn, selectOutBoundBtn,coseLayoutBtn,hideBtn)

        selectInboundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectInbound"})})
        selectOutBoundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectOutbound"})})
        coseLayoutBtn.on("click",()=>{this.broadcastMessage({"message": "COSESelectedNodes"})})
        hideBtn.on("click",()=>{this.broadcastMessage({"message": "hideSelectedNodes"})})
    }
}

infoPanel.prototype.exportSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var twinIDArr=[]
    var twinToBeStored=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) return
        twinIDArr.push(element['$dtId'])
        var anExpTwin={}
        anExpTwin["$metadata"]={"$model":element["$metadata"]["$model"]}
        for(var ind in element){
            if(ind=="$metadata" || ind=="$etag") continue 
            else anExpTwin[ind]=element[ind]
        }
        twinToBeStored.push(anExpTwin)
        twinIDs[element['$dtId']]=1
    });
    var relationsToBeStored=[]
    twinIDArr.forEach(oneID=>{
        var relations=globalCache.storedOutboundRelationships[oneID]
        if(!relations) return;
        relations.forEach(oneRelation=>{
            var targetID=oneRelation["$targetId"]
            if(twinIDs[targetID]) {
                var obj={}
                for(var ind in oneRelation){
                    if(ind =="$etag"||ind =="$relationshipId"||ind =="$sourceId"||ind =="sourceModel") continue
                    obj[ind]=oneRelation[ind]
                }
                var oneAction={"$srcId":oneID,
                                "$relationshipId":oneRelation["$relationshipId"],
                                "obj":obj}
                relationsToBeStored.push(oneAction)
            }
        })
    })
    var finalJSON={"twins":twinToBeStored,"relations":relationsToBeStored}
    var pom = $("<a></a>")
    pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
    pom.attr('download', "exportTwinsData.json");
    pom[0].click()
}

infoPanel.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.readTwinsFilesContentAndImport=async function(files){
    var importTwins=[]
    var importRelations=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(obj.twins) importTwins=importTwins.concat(obj.twins)
            if(obj.relations) importRelations=importRelations.concat(obj.relations)
        }catch(err){
            alert(err)
        }
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    var oldTwinID2NewID={}
    importTwins.forEach(oneTwin=>{
        var oldID= oneTwin["$dtId"]
        var newID=uuidv4();
        oldTwinID2NewID[oldID]=newID
        oneTwin["$dtId"]=newID
    })

    for(var i=importRelations.length-1;i>=0;i--){
        var oneRel=importRelations[i]
        if(oldTwinID2NewID[oneRel["$srcId"]]==null || oldTwinID2NewID[oneRel["obj"]["$targetId"]]==null){
            importRelations.splice(i,1)
        } else{
            oneRel["$srcId"]=oldTwinID2NewID[oneRel["$srcId"]]
            oneRel["obj"]["$targetId"]=oldTwinID2NewID[oneRel["obj"]["$targetId"]]
            oneRel["$relationshipId"]=uuidv4();
        }
    }


    try{
        var re = await msalHelper.callAPI("digitaltwin/batchImportTwins", "POST", {"twins":JSON.stringify(importTwins)},"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return;
    }

    re.DBTwins=JSON.parse(re.DBTwins)
    re.ADTTwins=JSON.parse(re.ADTTwins)
    re.DBTwins.forEach(DBTwin=>{ globalCache.storeSingleDBTwin(DBTwin) })
    var adtTwins=[]
    re.ADTTwins.forEach(ADTTwin=>{
        globalCache.storeSingleADTTwin(ADTTwin)
        adtTwins.push(ADTTwin)
    })

    this.broadcastMessage({ "message": "addNewTwins", "twinsInfo": adtTwins })

    //continue to import relations
    try{
        var relationsImported = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(importRelations)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(relationsImported)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImported})

    var numOfTwins=adtTwins.length
    var numOfRelations=relationsImported.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+` (from ${importTwins.length})`
    str+=" and "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")+` (from ${importRelations.length})`
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "400px" },
        {
            title: "Import Result"
            , content:str
            , buttons: [
                {
                    colorClass: "w3-gray", text: "Ok", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    
}

infoPanel.prototype.refreshInfomation=async function(){
    var twinIDs=[]
    this.selectedObjects.forEach(oneItem=>{  if(oneItem['$dtId']) twinIDs.push(oneItem['$dtId'])  })
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        twinsdata.forEach(oneRe=>{
            var twinID= oneRe['$dtId']
            if(globalCache.storedTwins[twinID]!=null){
                for(var ind in oneRe)  globalCache.storeSingleADTTwin(oneRe[ind])
            }
        })
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    while(twinIDs.length>0){
        var smallArr= twinIDs.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
    //redraw infopanel if needed
    if(this.selectedObjects.length==1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })

}


infoPanel.prototype.deleteSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var relationsArr=[]
    var twinIDArr=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) relationsArr.push(element);
        else{
            twinIDArr.push(element['$dtId'])
            twinIDs[element['$dtId']]=1
        }
    });
    for(var i=relationsArr.length-1;i>=0;i--){ //clear those relationships that are going to be deleted after twins deleting
        var srcId=  relationsArr[i]['$sourceId']
        var targetId = relationsArr[i]['$targetId']
        if(twinIDs[srcId]!=null || twinIDs[targetId]!=null){
            relationsArr.splice(i,1)
        }
    }
    var confirmDialogDiv = new simpleConfirmDialog()
    var dialogStr=""
    var twinNumber=twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if(twinNumber>0) dialogStr =  twinNumber+" twin"+((twinNumber>1)?"s":"") + " (with connected relations)"
    if(twinNumber>0 && relationsNumber>0) dialogStr+=" and additional "
    if(relationsNumber>0) dialogStr +=  relationsNumber+" relation"+((relationsNumber>1)?"s":"" )
    dialogStr+=" will be deleted. Please confirm"
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Confirm"
            , content:dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        confirmDialogDiv.close()
                        this.DOM.empty()
                        this.drawButtons(null)
                        if (relationsArr.length > 0) await this.deleteRelations(relationsArr)
                        if (twinIDArr.length > 0) await this.deleteTwins(twinIDArr)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
}

infoPanel.prototype.deleteTwins=async function(twinIDArr){
    var ioTDevices=[]
    twinIDArr.forEach(oneTwinID=>{
        var dbTwinInfo=globalCache.getSingleDBTwinByID(oneTwinID)
        if(dbTwinInfo.IoTDeviceID!=null && dbTwinInfo.IoTDeviceID!=""){
            ioTDevices.push(dbTwinInfo.IoTDeviceID)
        }
    })
    if(ioTDevices.length>0){
        msalHelper.callAPI("devicemanagement/unregisterIoTDevices", "POST", {arr:ioTDevices})
    }
    

    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        
        try{
            var result = await msalHelper.callAPI("digitaltwin/deleteTwins", "POST", {arr:smallArr},"withProjectID")
            result.forEach((oneID)=>{
                delete globalCache.storedTwins[oneID]
                delete globalCache.storedOutboundRelationships[oneID]
            });
            this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.deleteRelations=async function(relationsArr){
    var arr=[]
    relationsArr.forEach(oneRelation=>{
        arr.push({srcID:oneRelation['$sourceId'],relID:oneRelation['$relationshipId']})
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", {"relations":arr})
        globalCache.storeTwinRelationships_remove(data)
        this.broadcastMessage({ "message": "relationsDeleted","relations":data})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

infoPanel.prototype.showOutBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr = twinIDArr.splice(0, 100);

        var knownTargetTwins = {}
        smallArr.forEach(oneID => {
            knownTargetTwins[oneID] = 1 //itself also is known
            var outBoundRelation = globalCache.storedOutboundRelationships[oneID]
            if (outBoundRelation) {
                outBoundRelation.forEach(oneRelation => {
                    var targetID = oneRelation["$targetId"]
                    if (globalCache.storedTwins[targetID] != null) knownTargetTwins[targetID] = 1
                })
            }
        })

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryOutBound", "POST",  { arr: smallArr, "knownTargets": knownTargetTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.showInBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var knownSourceTwins = {}
        var IDDict = {}
        smallArr.forEach(oneID => {
            IDDict[oneID] = 1
            knownSourceTwins[oneID] = 1 //itself also is known
        })
        for (var twinID in globalCache.storedOutboundRelationships) {
            var relations = globalCache.storedOutboundRelationships[twinID]
            relations.forEach(oneRelation => {
                var targetID = oneRelation['$targetId']
                var srcID = oneRelation['$sourceId']
                if (IDDict[targetID] != null) {
                    if (globalCache.storedTwins[srcID] != null) knownSourceTwins[srcID] = 1
                }
            })
        }

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryInBound", "POST",  { arr: smallArr, "knownSources": knownSourceTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.drawMultipleObj=function(){
    var numOfEdge = 0;
    var numOfNode = 0;
    var arr=this.selectedObjects;
    if(arr==null) return;
    arr.forEach(element => {
        if (element['$sourceId']) numOfEdge++
        else numOfNode++
    });
    var textDiv=$("<label style='display:block;margin-top:10px'></label>")
    textDiv.text(numOfNode+ " node"+((numOfNode<=1)?"":"s")+", "+numOfEdge+" relationship"+((numOfEdge<=1)?"":"s"))
    this.DOM.append(textDiv)
}

infoPanel.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        keyDiv.css({"fontSize":fontSize,"color":"darkGray"})
        parent.append(keyDiv)
        keyDiv.css("padding-top",paddingTop)

        var contentDOM=$("<label></label>")
        if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawStaticInfo(contentDOM,jsonInfo[ind],".5em",fontSize)
        }else {
            contentDOM.css("padding-top",".2em")
            contentDOM.text(jsonInfo[ind])
        }
        contentDOM.css({"fontSize":fontSize,"color":"black"})
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            var aInput=$('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            contentDOM.append(aInput)
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null) aInput.val(val)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.editDTProperty(originElementInfo,$(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"))
            })
        }
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawDropdownOption=function(contentDOM,newPath,valueArr,originElementInfo){
    var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
    contentDOM.append(aSelectMenu.DOM)
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption)=>{
        var str =oneOption["displayName"]  || oneOption["enumValue"] 
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        aSelectMenu.changeName(optionText)
        if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string")
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=async function(originElementInfo,path,newVal,dataType){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)

    //{ "op": "add", "path": "/x", "value": 30 }
    if(path.length==1){
        var str=""
        path.forEach(segment=>{str+="/"+segment})
        var jsonPatch=[ { "op": "add", "path": str, "value": newVal} ]
    }else{
        //it is a property inside a object type of root property,update the whole root property
        var rootProperty=path[0]
        var patchValue= originElementInfo[rootProperty]
        if(patchValue==null) patchValue={}
        else patchValue=JSON.parse(JSON.stringify(patchValue)) //make a copy
        this.updateOriginObjectValue(patchValue,path.slice(1),newVal)
        
        var jsonPatch=[ { "op": "add", "path": "/"+rootProperty, "value": patchValue} ]
    }

    if(originElementInfo["$dtId"]){ //edit a node property
        var twinID = originElementInfo["$dtId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID}
    }else if(originElementInfo["$relationshipId"]){ //edit a relationship property
        var twinID = originElementInfo["$sourceId"]
        var relationshipID = originElementInfo["$relationshipId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID,"relationshipID":relationshipID}
    }
    
    
    try{
        await msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
        this.updateOriginObjectValue(originElementInfo,path,newVal)
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    
}

infoPanel.prototype.updateOriginObjectValue=function(nodeInfo,pathArr,newVal){
    if(pathArr.length==0) return;
    var theJson=nodeInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
    return
}

infoPanel.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}

module.exports = new infoPanel();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/modelAnalyzer":15,"../sharedSourceFiles/simpleConfirmDialog":20,"../sharedSourceFiles/simpleSelectMenu":21}],7:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const globalCache = require("../sharedSourceFiles/globalCache")
const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")

function mainToolbar() {
}

mainToolbar.prototype.render = function () {
    $("#mainToolBar").addClass("w3-bar w3-red")
    $("#mainToolBar").css({"z-index":100,"overflow":"visible"})

    this.switchProjectBtn=$('<a class="w3-bar-item w3-button" href="#">Project</a>')
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit"></i></a>')

    this.testSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">Test SignalR</a>')
    this.testSendSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">send SignalR message</a>')


    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(moduleSwitchDialog.modulesSidebar)
    $("#mainToolBar").append(moduleSwitchDialog.modulesSwitchButton, this.switchProjectBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn)
        //,this.testSignalRBtn,this.testSendSignalRBtn

    this.switchProjectBtn.on("click",()=>{ startSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


    this.testSendSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var re = await msalHelper.callAzureFunctionsService("messages","POST",{
            recipient: "5eb81f5f-fd9e-481d-996b-4d0b9536f477",
            text: "how do you do"
          })
    })
    this.testSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var signalRInfo = await msalHelper.callAzureFunctionsService("negotiate?name=ff","GET")
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRInfo.url, {accessTokenFactory: () => signalRInfo.accessToken})
        //.configureLogging(signalR.LogLevel.Information)
        .configureLogging(signalR.LogLevel.Warning)
        .build();
        console.log(signalRInfo.accessToken)

        connection.on('newMessage', (message)=>{
            console.log(message)
        });
        connection.onclose(() => console.log('disconnected'));
        console.log('connecting...');
        connection.start()
          .then(() => console.log('connected!'))
          .catch(console.error);
    })


    this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
        globalCache.currentLayoutName=optionValue
        this.broadcastMessage({ "message": "layoutChange"})
        if(optionValue=="[NA]") this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",optionText)
    }
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var curSelect=this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in globalCache.layoutJSON) {
        this.switchLayoutSelector.addOption(ind)
    }

    if(curSelect!=null && this.switchLayoutSelector.findOption(curSelect)==null) this.switchLayoutSelector.changeName("Layout","")
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector()
    }
}

module.exports = new mainToolbar();
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/modelManagerDialog":17,"../sharedSourceFiles/moduleSwitchDialog":18,"../sharedSourceFiles/simpleSelectMenu":21,"./editLayoutDialog":5,"./startSelectionDialog":8}],8:[function(require,module,exports){
const globalCache = require("../sharedSourceFiles/globalCache")
const simpleSelectMenu=require("../sharedSourceFiles/simpleSelectMenu")
const msalHelper=require("../msalHelper")
const editProjectDialog=require("../sharedSourceFiles/editProjectDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer")

function startSelectionDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

startSelectionDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:680px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Select Twins</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)

    this.buttonHolder = $("<div style='height:100%'></div>")
    this.contentDOM.children(':first').append(this.buttonHolder)
    closeButton.on("click", () => {
        this.useStartSelection("append")
        this.closeDialog() 
    })

    var row1=$('<div class="w3-bar" style="padding:2px"></div>')
    this.contentDOM.append(row1)
    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;">Project </div>')
    row1.append(lable)
    var switchProjectSelector=new simpleSelectMenu(" ",{withBorder:1,colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"}})
    this.switchProjectSelector=switchProjectSelector
    row1.append(switchProjectSelector.DOM)
    var joinedProjects=globalCache.accountInfo.joinedProjects
    joinedProjects.forEach(aProject=>{
        var str = aProject.name
        if(aProject.owner!=globalCache.accountInfo.accountID) str+=" (from "+aProject.owner+")"
        switchProjectSelector.addOption(str,aProject.id)
    })
    switchProjectSelector.callBack_clickOption=(optionText,optionValue)=>{
        switchProjectSelector.changeName(optionText)
        this.chooseProject(optionValue)
    }

    this.editProjectBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit fa-lg"></i></a>')
    this.deleteProjectBtn=$('<a class="w3-button" href="#"><i class="fa fa-trash fa-lg"></i></a>')
    this.newProjectBtn=$('<a class="w3-button" href="#"><i class="fa fa-plus fa-lg"></i></a>')
    row1.append(this.editProjectBtn,this.deleteProjectBtn,this.newProjectBtn)

    var panelHeight=400
    var row2=$('<div class="w3-cell-row"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div style="padding:5px;width:260px;padding-right:5px;overflow:hidden"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell" style="padding-top:10px;"></div>')
    row2.append(rightSpan) 
    rightSpan.append($('<div class="w3-container w3-card" style="color:gray;height:'+(panelHeight-10)+'px;overflow:auto;width:390px;"></div>'))
    var selectedTwinsDOM=$("<table style='width:100%'></table>")
    selectedTwinsDOM.css({"border-collapse":"collapse"})
    rightSpan.children(':first').append(selectedTwinsDOM)
    this.selectedTwinsDOM=selectedTwinsDOM 

    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="padding-left:2px;font-weight:bold;color:gray">Choose twins...<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:140px" class="w3-text w3-tag w3-tiny">choose twins of one or more models</p></div></div>'))

    this.modelsCheckBoxes=$('<form class="w3-container w3-border" style="height:'+(panelHeight-40)+'px;overflow:auto"></form>')
    leftSpan.append(this.modelsCheckBoxes)
    
    if(this.previousSelectedProject!=null){
        switchProjectSelector.triggerOptionValue(this.previousSelectedProject)
    }else{
        switchProjectSelector.triggerOptionIndex(0)
    }
}

startSelectionDialog.prototype.getProjectInfo = function (projectID) {
    var joinedProjects=globalCache.accountInfo.joinedProjects
    for(var i=0;i<joinedProjects.length;i++){
        var aProject=joinedProjects[i]
        if(aProject.id==projectID) return aProject
    }
}

startSelectionDialog.prototype.chooseProject = async function (selectedProjectID) {
    this.buttonHolder.empty()

    var projectInfo=this.getProjectInfo(selectedProjectID)
    if(projectInfo.owner==globalCache.accountInfo.accountID){
        this.editProjectBtn.show()
        this.deleteProjectBtn.show()
        this.editProjectBtn.on("click", () => { editProjectDialog.popup(projectInfo) })
        this.deleteProjectBtn.on("click",async ()=>{
            try {
                await msalHelper.callAPI("accountManagement/deleteProjectTo", "POST", {"projectID":selectedProjectID})
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
                return
            }
        })
    }else{
        this.editProjectBtn.hide()
        this.deleteProjectBtn.hide()
    }
    this.newProjectBtn.on("click",async ()=>{
        var tsStr=(new Date().toLocaleString()) 
        try {
            var newProjectInfo = await msalHelper.callAPI("accountManagement/newProjectTo", "POST", { "projectName": "New Project " + tsStr })
            globalCache.accountInfo.joinedProjects.unshift(newProjectInfo)
            this.switchProjectSelector.clearOptions()
            var joinedProjects = globalCache.accountInfo.joinedProjects
            joinedProjects.forEach(aProject => {
                var str = aProject.name
                if(aProject.owner!=globalCache.accountInfo.accountID) str+=" (from "+aProject.owner+")"
                this.switchProjectSelector.addOption(str, aProject.id)
            })
            //NOTE: must query the new joined projects JWT token again
            await msalHelper.reloadUserAccountData()
            this.switchProjectSelector.triggerOptionIndex(0)
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
            return
        }
    })
    

    if(this.previousSelectedProject==null){
        var replaceButton = $('<button class="w3-button w3-card w3-hover-deep-orange w3-green" style="height:100%; margin-right:8px">Start</button>')
        replaceButton.on("click", () => { this.useStartSelection("replace") })
        this.buttonHolder.append(replaceButton)
    }else if(this.previousSelectedProject == selectedProjectID){
        var replaceButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
        var appendButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%">Append Data</button>')
    
        replaceButton.on("click", () => { this.useStartSelection("replace") })
        appendButton.on("click", () => { this.useStartSelection("append") })
        this.buttonHolder.append(replaceButton, appendButton)
    }else{
        var replaceButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
        replaceButton.on("click", () => { this.useStartSelection("replace") })
        this.buttonHolder.append(replaceButton)
    }
    globalCache.currentProjectID = selectedProjectID
    
    try {
        var res = await msalHelper.callAPI("digitaltwin/fetchProjectModelsData", "POST", null, "withProjectID")
        globalCache.storeProjectModelsData(res.DBModels, res.adtModels)
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(res.adtModels)
        modelAnalyzer.analyze();
        var res = await msalHelper.callAPI("digitaltwin/fetchProjectTwinsAndVisualData", "POST", null, "withProjectID")
        globalCache.storeProjectTwinsAndVisualData(res)
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
        return
    }
    this.fillAvailableModels()
    this.listTwins()
}



startSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "startSelectionDialog_closed"})
}

startSelectionDialog.prototype.fillAvailableModels = function() {
    this.modelsCheckBoxes.empty()
    this.modelsCheckBoxes.append('<input class="w3-check" type="checkbox" id="ALL"><label style="padding-left:5px"><b>ALL</b></label><p/>')
    globalCache.DBModelsArr.forEach(oneModel=>{
        var modelName=oneModel["displayName"]
        var modelID=oneModel["id"]
        this.modelsCheckBoxes.append(`<input class="w3-check" type="checkbox" id="${modelID}"><label style="padding-left:5px">${modelName}</label><p/>`)
    })
    this.modelsCheckBoxes.on("change",(evt)=>{
        if($(evt.target).attr("id")=="ALL"){
            //select all the other input
            var val=$(evt.target).prop("checked")
            this.modelsCheckBoxes.children('input').each(function () {
                $(this).prop("checked",val)
            });
        }
        this.listTwins()
    })
}

startSelectionDialog.prototype.getSelectedTwins=function(){
    var reArr=[]
    var chosenModels={}
    this.modelsCheckBoxes.children('input').each(function () {
        if(!$(this).prop("checked")) return;
        if($(this).attr("id")=="ALL") return;
        chosenModels[$(this).attr("id")]=1
    });
    globalCache.DBTwinsArr.forEach(aTwin=>{
        if(chosenModels[aTwin["modelID"]])  reArr.push(aTwin)
    })
    return reArr;
}

startSelectionDialog.prototype.listTwins=function(){
    this.selectedTwinsDOM.empty()
    var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey;font-weight:bold">TWIN ID</td><td style="border-bottom:solid 1px lightgrey;font-weight:bold">MODEL ID</td></tr>')
    this.selectedTwinsDOM.append(tr)

    var selectedTwins=this.getSelectedTwins()
    selectedTwins.forEach(aTwin=>{
        var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+aTwin["displayName"]+'</td><td style="border-bottom:solid 1px lightgrey">'+aTwin['modelID']+'</td></tr>')
        this.selectedTwinsDOM.append(tr)
    })
    if(selectedTwins.length==0){
        var tr=$('<tr><td style="color:gray">zero record</td><td></td></tr>')
        this.selectedTwinsDOM.append(tr)    
    }
}


startSelectionDialog.prototype.useStartSelection=function(action){
    this.previousSelectedProject=globalCache.currentProjectID
    var selectedTwins=this.getSelectedTwins()
    var twinIDs=[]
    selectedTwins.forEach(aTwin=>{twinIDs.push(aTwin["id"])})

    var modelIDs=[]
    globalCache.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})

    this.broadcastMessage({ "message": "startSelection_"+action, "twinIDs": twinIDs,"modelIDs":modelIDs })
    this.broadcastMessage({ "message": "visualDefinitionRefresh"})
    this.broadcastMessage({ "message": "layoutsUpdated"})
    this.closeDialog()

    if(globalCache.DBModelsArr.length==0){
        //directly popup to model management dialog allow user import or create model
        modelManagerDialog.popup()
        modelManagerDialog.DOM.hide()
        modelManagerDialog.DOM.fadeIn()
        //pop up welcome screen
        var popWin=$('<div class="w3-blue w3-card-4 w3-padding-large" style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:105;width:400px;cursor:default"></div>')
        popWin.html(`Welcome, ${msalHelper.userName}! Firstly, let's import or create a few twin models to start. <br/><br/>Click to continue...`)
        $("body").append(popWin)
        popWin.on("click",()=>{popWin.remove()})
        setTimeout(()=>{
            popWin.fadeOut("slow",()=>{popWin.remove()});
        },3000)
    }
}

module.exports = new startSelectionDialog();
},{"../msalHelper":12,"../sharedSourceFiles/editProjectDialog":13,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/modelAnalyzer":15,"../sharedSourceFiles/modelManagerDialog":17,"../sharedSourceFiles/simpleSelectMenu":21}],9:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
}

topologyDOM.prototype.init=function(){
    cytoscape.warnings(false)  
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 0.1,
        maxZoom: 10,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,

        // rendering options:
        headless: false,
        styleEnabled: true,
        hideEdgesOnViewport: false,
        textureOnViewport: false,
        motionBlur: false,
        motionBlurOpacity: 0.2,
        wheelSensitivity: 0.3,
        pixelRatio: 'auto',

        elements: [], // list of graph elements to start with

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    "width":this.defaultNodeSize,"height":this.defaultNodeSize,
                    'label': 'data(id)',
                    'opacity':0.9,
                    'font-size':"12px",
                    'font-family':'Geneva, Arial, Helvetica, sans-serif'
                    //,'background-image': function(ele){ return "images/cat.png"; }
                    //,'background-fit':'contain' //cover
                    //'background-color': function( ele ){ return ele.data('bg') }
                    ,'background-width':'70%'
                    ,'background-height':'70%'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width':2,
                    'line-color': '#888',
                    'target-arrow-color': '#555',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale':0.6
                }
            },
            {selector: 'edge:selected',
            style: {
                'width': 3,
                'line-color': 'red',
                'target-arrow-color': 'red',
                'source-arrow-color': 'red',
                'line-fill':"linear-gradient",
                'line-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'line-gradient-stop-positions':['0%','70%','100%']
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-fill':'radial-gradient',
                'background-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'background-gradient-stop-positions':['0%','50%','60%']
            }},
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }}
            
            ,{selector: 'edge.hover',
            style: {
                'width':5
            }}
            
        ]
    });

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom:true,
        enableRemoveAnchorMidOfNearLine:false,
        enableCreateAnchorOnDrag:false
    });

    
    this.core.boxSelectionEnabled(true)


    this.core.on('tapselect', ()=>{this.selectFunction()});
    this.core.on('tapunselect', ()=>{this.selectFunction()});

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',()=>{this.selectFunction()})
    })

    this.core.on('cxttap',(e)=>{
        this.cancelTargetNodeMode()
    })

    this.core.on('mouseover',e=>{

        this.mouseOverFunction(e)
    })
    this.core.on('mouseout',e=>{
        this.mouseOutFunction(e)
    })
    
    this.core.on('zoom',(e)=>{
        var fs=this.getFontSizeInCurrentZoom();
        var dimension=this.getNodeSizeInCurrentZoom();
        this.core.style()
            .selector('node')
            .style({ 'font-size': fs, width: dimension, height: dimension })
            .update()
        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension = Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID] * dimension)
            this.core.style()
                .selector('node[modelID = "' + modelID + '"]')
                .style({ width: newDimension, height: newDimension })
                .update()
        }
        this.core.style()
            .selector('node:selected')
            .style({ 'border-width': Math.ceil(dimension / 15) })
            .update()
    })

    var instance = this.core.edgeEditing('get');
    var tapdragHandler=(e) => {
        instance.keepAnchorsAbsolutePositionDuringMoving()
        if(e.target.isNode && e.target.isNode()) this.draggingNode=e.target
        this.smartPositionNode(e.position)
    }
    var setOneTimeGrab = () => {
        this.core.once("grab", (e) => {
            var draggingNodes = this.core.collection()
            if (e.target.isNode()) draggingNodes.merge(e.target)
            var arr = this.core.$(":selected")
            arr.forEach((ele) => {
                if (ele.isNode()) draggingNodes.merge(ele)
            })
            instance.storeAnchorsAbsolutePosition(draggingNodes)
            this.core.on("tapdrag",tapdragHandler )
            setOneTimeFree()
        })
    }
    var setOneTimeFree = () => {
        this.core.once("free", (e) => {
            var instance = this.core.edgeEditing('get');
            instance.resetAnchorsAbsolutePosition()
            this.draggingNode=null
            setOneTimeGrab()
            this.core.removeListener("tapdrag",tapdragHandler)
        })
    }
    setOneTimeGrab()
    this.core.trigger("zoom")
}

topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //comparing nodes set: its connectfrom nodes and their connectto nodes, its connectto nodes and their connectfrom nodes
    var incomers=this.draggingNode.incomers()
    var outerFromIncom= incomers.outgoers()
    var outer=this.draggingNode.outgoers()
    var incomFromOuter=outer.incomers()
    var monitorSet=incomers.union(outerFromIncom).union(outer).union(incomFromOuter).filter('node').unmerge(this.draggingNode)

    var returnExpectedPos=(diffArr,posArr)=>{
        var minDistance=Math.min(...diffArr)
        if(minDistance*zoomLevel < 10)  return posArr[diffArr.indexOf(minDistance)]
        else return null;
    }

    var xDiff=[]
    var xPos=[]
    var yDiff=[]
    var yPos=[]
    monitorSet.forEach((ele)=>{
        xDiff.push(Math.abs(ele.position().x-mousePosition.x))
        xPos.push(ele.position().x)
        yDiff.push(Math.abs(ele.position().y-mousePosition.y))
        yPos.push(ele.position().y)
    })
    var prefX=returnExpectedPos(xDiff,xPos)
    var prefY=returnExpectedPos(yDiff,yPos)
    if(prefX!=null) {
        this.draggingNode.position('x', prefX);
    }
    if(prefY!=null) {
        this.draggingNode.position('y', prefY);
    }
    //console.log("----")
    //monitorSet.forEach((ele)=>{console.log(ele.id())})
    //console.log(monitorSet.size())
}

topologyDOM.prototype.mouseOverFunction= function (e) {
    if(!e.target.data) return
    
    var info=e.target.data().originalInfo
    if(info==null) return;
    if(this.lastHoverTarget) this.lastHoverTarget.removeClass("hover")
    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "showInfoSelectedNodes", "info": [info] })
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    this.selectFunction()
    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
    this.broadcastMessage({ "message": "showInfoSelectedNodes", info: re })

    //for debugging purpose
    //arr.forEach((ele)=>{
    //  console.log("")
    //})
}

topologyDOM.prototype.getFontSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){
        var maxFS=12
        var minFS=5
        var ratio= (maxFS/minFS-1)/9*(curZoom-1)+1
        var fs=Math.ceil(maxFS/ratio)
    }else{
        var maxFS=120
        var minFS=12
        var ratio= (maxFS/minFS-1)/9*(1/curZoom-1)+1
        var fs=Math.ceil(minFS*ratio)
    }
    return fs;
}

topologyDOM.prototype.getNodeSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){//scale up but not too much
        var ratio= (curZoom-1)*(2-1)/9+1
        return Math.ceil(this.defaultNodeSize/ratio)
    }else{
        var ratio= (1/curZoom-1)*(4-1)/9+1
        return Math.ceil(this.defaultNodeSize*ratio)
    }
}


topologyDOM.prototype.updateModelAvarta=function(modelID,dataUrl){
    try{
        this.core.style() 
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-image': dataUrl})
        .update()   
    }catch(e){
        
    }
    
}
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    if(shape=="hexagon"){
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': 'polygon','shape-polygon-points':[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]})
        .update()   
    }else{
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': shape})
        .update()   
    }
    
}
topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
}

topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': shape})
        .update()   
}
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)})
        .update()   
    this.core.style()
        .selector('edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+1,'line-color': 'red'})
        .update()   
    this.core.style()
        .selector('edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+3})
        .update()   
}

topologyDOM.prototype.deleteRelations=function(relations){
    relations.forEach(oneRelation=>{
        var srcID=oneRelation["srcID"]
        var relationID=oneRelation["relID"]
        var theNodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+theNodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationID){
                anEdge.remove()
                break
            }
        }
    })   
}


topologyDOM.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.core.$('[id = "'+twinDisplayName+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    var curDimension= twin.width()
    twin.animate({
        style: { 'height': curDimension*2,'width': curDimension*2 },
        duration: 200
    });

    setTimeout(()=>{
        twin.animate({
            style: { 'height': curDimension,'width': curDimension },
            duration: 200
            ,complete:()=>{
                twin.removeStyle() //must remove the style after animation, otherwise they will have their own style
            }
        });
    },200)
}

topologyDOM.prototype.drawTwins=function(twinsData,animation){
    var arr=[]
    for(var i=0;i<twinsData.length;i++){
        var originalInfo=twinsData[i];
        var newNode={data:{},group:"nodes"}
        newNode.data["originalInfo"]= originalInfo;
        newNode.data["id"]=originalInfo['displayName']
        var modelID=originalInfo['$metadata']['$model']
        newNode.data["modelID"]=modelID
        arr.push(newNode)
    }

    var eles = this.core.add(arr)
    if(eles.size()==0) return eles
    this.noPosition_grid(eles)
    if(animation){
        eles.forEach((ele)=>{ this.animateANode(ele) })
    }

    //if there is currently a layout there, apply it
    this.applyNewLayout()

    return eles
}

topologyDOM.prototype.drawRelations=function(relationsData){
    var relationInfoArr=[]
    for(var i=0;i<relationsData.length;i++){
        var originalInfo=relationsData[i];
        
        var theID=originalInfo['$relationshipName']+"_"+originalInfo['$relationshipId']
        var aRelation={data:{},group:"edges"}
        aRelation.data["originalInfo"]=originalInfo
        aRelation.data["id"]=theID
        aRelation.data["source"]=globalCache.twinIDMapToDisplayName[originalInfo['$sourceId']]
        aRelation.data["target"]=globalCache.twinIDMapToDisplayName[originalInfo['$targetId']]


        if(this.core.$("#"+aRelation.data["source"]).length==0 || this.core.$("#"+aRelation.data["target"]).length==0) continue
        var sourceNode=this.core.$("#"+aRelation.data["source"])
        var sourceModel=sourceNode[0].data("originalInfo")['$metadata']['$model']
        
        //add additional source node information to the original relationship information
        originalInfo['sourceModel']=sourceModel
        aRelation.data["sourceModel"]=sourceModel
        aRelation.data["relationshipName"]=originalInfo['$relationshipName']

        var existEdge=this.core.$('edge[id = "'+theID+'"]')
        if(existEdge.size()>0) {
            existEdge.data("originalInfo",originalInfo)
            continue;  //no need to draw it
        }

        relationInfoArr.push(aRelation)
    }
    if(relationInfoArr.length==0) return null;

    var edges=this.core.add(relationInfoArr)
    return edges
}

topologyDOM.prototype.reviewStoredRelationshipsToDraw=function(){
    //check the storedOutboundRelationships again and maybe some of them can be drawn now since targetNode is available
    var storedRelationArr=[]
    for(var twinID in globalCache.storedOutboundRelationships){
        storedRelationArr=storedRelationArr.concat(globalCache.storedOutboundRelationships[twinID])
    }
    this.drawRelations(storedRelationArr)
}

topologyDOM.prototype.drawTwinsAndRelations=function(data){
    var twinsAndRelations=data.childTwinsAndRelations

    //draw those new twins first
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        var eles=this.drawTwins(twinInfoArr,"animation")
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    twinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    this.drawTwins(tmpArr)

    //then check all stored relationships and draw if it can be drawn
    this.reviewStoredRelationshipsToDraw()
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color)
        if(visualJson[modelID].shape) this.updateModelTwinShape(modelID,visualJson[modelID].shape)
        if(visualJson[modelID].avarta) this.updateModelAvarta(modelID,visualJson[modelID].avarta)
        if(visualJson[modelID].dimensionRatio) this.updateModelTwinDimension(modelID,visualJson[modelID].dimensionRatio)
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels){
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
                if(visualJson[modelID]["rels"][relationshipName].edgeWidth){
                    this.updateRelationshipWidth(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].edgeWidth)
                }
            }
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace"){
        this.core.nodes().remove()
    }else if(msgPayload.message=="replaceAllTwins") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
        this.core.center(eles)
    }else if(msgPayload.message=="visualDefinitionRefresh") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.core.center(eles)
        this.reviewStoredRelationshipsToDraw()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            if(globalCache.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.core.nodes().unselect()
        this.core.edges().unselect()
        this.drawTwins([msgPayload.twinInfo],"animation")
        var nodeInfo= msgPayload.twinInfo;
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            var position=topoNode.renderedPosition()
            this.core.panBy({x:-position.x+200,y:-position.y+50})
            topoNode.select()
            this.selectFunction()
        }
    }else if(msgPayload.message=="addNewTwins") {
        this.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['displayName'])
            aTwin.select()
            if(mouseClickDetail!=2) this.animateANode(aTwin) //ignore double click second click
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            this.core.center(topoNode)
        }
    }else if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.srcModelID){
            if(msgPayload.color) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
            else if(msgPayload.shape) this.updateRelationshipShape(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.shape)
            else if(msgPayload.edgeWidth) this.updateRelationshipWidth(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.edgeWidth)
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
        } 
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="relationsDeleted") this.deleteRelations(msgPayload.relations)
    else if(msgPayload.message=="connectTo"){ this.startTargetNodeMode("connectTo")   }
    else if(msgPayload.message=="connectFrom"){ this.startTargetNodeMode("connectFrom")   }
    else if(msgPayload.message=="addSelectOutbound"){ this.selectOutboundNodes()   }
    else if(msgPayload.message=="addSelectInbound"){ this.selectInboundNodes()   }
    else if(msgPayload.message=="hideSelectedNodes"){ this.hideSelectedNodes()   }
    else if(msgPayload.message=="COSESelectedNodes"){ this.COSESelectedNodes()   }
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName)   }
    else if(msgPayload.message=="layoutChange"){ this.applyNewLayout()   }
}

topologyDOM.prototype.applyNewLayout = function () {
    var layoutName=globalCache.currentLayoutName
    
    var layoutDetail= globalCache.layoutJSON[layoutName]
    
    //remove all bending edge 
    this.core.edges().forEach(oneEdge=>{
        oneEdge.removeClass('edgebendediting-hasbendpoints')
        oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
    })
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        storedPositions[ind]={
            x:layoutDetail[ind][0]
            ,y:layoutDetail[ind][1]
        }
    }
    var newLayout=this.core.layout({
        name: 'preset',
        positions:storedPositions,
        fit:false,
        animate: true,
        animationDuration: 300,
    })
    newLayout.run()

    //restore edges bending or control points
    var edgePointsDict=layoutDetail["edges"]
    if(edgePointsDict==null)return;
    for(var srcID in edgePointsDict){
        for(var relationshipID in edgePointsDict[srcID]){
            var obj=edgePointsDict[srcID][relationshipID]
            this.applyEdgeBendcontrolPoints(srcID,relationshipID,obj["cyedgebendeditingWeights"]
            ,obj["cyedgebendeditingDistances"],obj["cyedgecontroleditingWeights"],obj["cyedgecontroleditingDistances"])
        }
    }
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var nodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+nodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationshipID){
                if(cyedgebendeditingWeights){
                    anEdge.data("cyedgebendeditingWeights",cyedgebendeditingWeights)
                    anEdge.data("cyedgebendeditingDistances",cyedgebendeditingDistances)
                    anEdge.addClass('edgebendediting-hasbendpoints');
                }
                if(cyedgecontroleditingWeights){
                    anEdge.data("cyedgecontroleditingWeights",cyedgecontroleditingWeights)
                    anEdge.data("cyedgecontroleditingDistances",cyedgecontroleditingDistances)
                    anEdge.addClass('edgecontrolediting-hascontrolpoints');
                }
                
                break
            }
        }
}



topologyDOM.prototype.saveLayout = async function (layoutName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    
    if(this.core.nodes().size()==0) return;

    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points

    if(layoutDict.edges==null) layoutDict.edges={}
    var edgeEditInstance= this.core.edgeEditing('get');
    this.core.edges().forEach(oneEdge=>{
        var srcID=oneEdge.data("originalInfo")["$sourceId"]
        var relationshipID=oneEdge.data("originalInfo")["$relationshipId"]
        var cyedgebendeditingWeights=oneEdge.data('cyedgebendeditingWeights')
        var cyedgebendeditingDistances=oneEdge.data('cyedgebendeditingDistances')
        var cyedgecontroleditingWeights=oneEdge.data('cyedgecontroleditingWeights')
        var cyedgecontroleditingDistances=oneEdge.data('cyedgecontroleditingDistances')
        if(!cyedgebendeditingWeights && !cyedgecontroleditingWeights) return;

        if(layoutDict.edges[srcID]==null)layoutDict.edges[srcID]={}
        layoutDict.edges[srcID][relationshipID]={}
        if(cyedgebendeditingWeights && cyedgebendeditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingWeights"]=this.numberPrecision(cyedgebendeditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingDistances"]=this.numberPrecision(cyedgebendeditingDistances)
        }
        if(cyedgecontroleditingWeights && cyedgecontroleditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingWeights"]=this.numberPrecision(cyedgecontroleditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingDistances"]=this.numberPrecision(cyedgecontroleditingDistances)
        }
    })

    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][layoutName]=JSON.stringify(layoutDict)
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj,"withProjectID")
        this.broadcastMessage({ "message": "layoutsUpdated","layoutName":layoutName})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(number.toFixed(3))
}

topologyDOM.prototype.COSESelectedNodes = function () {
    var selected=this.core.$(':selected')
    this.noPosition_cose(selected)
}

topologyDOM.prototype.hideSelectedNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    selectedNodes.remove()
}

topologyDOM.prototype.selectInboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode) {
    var theConnectMode=this.targetNodeMode
    var srcNodeArr=this.core.nodes(":selected")

    var preparationInfo=[]

    srcNodeArr.forEach(theNode=>{
        var connectionTypes
        if(theConnectMode=="connectTo") {
            connectionTypes=this.checkAvailableConnectionType(theNode.data("modelID"),targetNode.data("modelID"))
            preparationInfo.push({from:theNode,to:targetNode,connect:connectionTypes})
        }else if(theConnectMode=="connectFrom") {
            connectionTypes=this.checkAvailableConnectionType(targetNode.data("modelID"),theNode.data("modelID"))
            preparationInfo.push({to:theNode,from:targetNode,connect:connectionTypes})
        }
    })
    //TODO: check if it is needed to popup dialog, if all connection is doable and only one type to use, no need to show dialog
    this.showConnectionDialog(preparationInfo)
}

topologyDOM.prototype.showConnectionDialog = function (preparationInfo) {
    var confirmDialogDiv = new simpleConfirmDialog()
    var resultActions=[]
    confirmDialogDiv.show(
        { width: "450px" },
        {
            title: "Add connections"
            , content: ""
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.createConnections(resultActions)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    confirmDialogDiv.dialogDiv.empty()
    preparationInfo.forEach((oneRow,index)=>{
        resultActions.push(this.createOneConnectionAdjustRow(oneRow,confirmDialogDiv))
    })
}

topologyDOM.prototype.createOneConnectionAdjustRow = function (oneRow,confirmDialogDiv) {
    var returnObj={}
    var fromNode=oneRow.from
    var toNode=oneRow.to
    var connectionTypes=oneRow.connect
    var label=$('<label style="display:block;margin-bottom:2px"></label>')
    if(connectionTypes.length==0){
        label.css("color","red")
        label.html("No usable connection type from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>")
    }else if(connectionTypes.length>1){ 
        label.html("From <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        var switchTypeSelector=new simpleSelectMenu(" ")
        label.prepend(switchTypeSelector.DOM)
        connectionTypes.forEach(oneType=>{
            switchTypeSelector.addOption(oneType)
        })
        returnObj["from"]=fromNodefromNode.data().originalInfo["$dtId"]
        returnObj["to"]=toNodefromNode.data().originalInfo["$dtId"]
        returnObj["connect"]=connectionTypes[0]
        switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
            returnObj["connect"]=optionText
            switchTypeSelector.changeName(optionText)
        }
        switchTypeSelector.triggerOptionIndex(0)
    }else if(connectionTypes.length==1){
        returnObj["from"]=fromNode.data().originalInfo["$dtId"]
        returnObj["to"]=toNode.data().originalInfo["$dtId"]
        returnObj["connect"]=connectionTypes[0]
        label.css("color","green")
        label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
    }
    confirmDialogDiv.dialogDiv.append(label)
    return returnObj;
}

topologyDOM.prototype.createConnections = async function (resultActions) {
    // for each resultActions, calculate the appendix index, to avoid same ID is used for existed connections
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=uuidv4();
        oneFinalAction["obj"]={
            "$targetId": oneAction["to"],
            "$relationshipName": oneAction["connect"]
        }
        finalActions.push(oneFinalAction)
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(finalActions)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(data)
    this.drawRelations(data)
}



topologyDOM.prototype.checkAvailableConnectionType = function (fromNodeModel,toNodeModel) {
    var re=[]
    var validRelationships=modelAnalyzer.DTDLModels[fromNodeModel].validRelationships
    var toNodeBaseClasses=modelAnalyzer.DTDLModels[toNodeModel].allBaseClasses
    if(validRelationships){
        for(var relationName in validRelationships){
            var theRelationType=validRelationships[relationName]
            if(theRelationType.target==null
                 || theRelationType.target==toNodeModel
                 ||toNodeBaseClasses[theRelationType.target]!=null) re.push(relationName)
        }
    }
    return re
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    $(document).keydown((event) => {
        if (event.keyCode == 27) this.cancelTargetNodeMode()
    });

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode)
        //delay a short while so node selection will not be changed to the clicked target node
        setTimeout(()=>{this.cancelTargetNodeMode()},50)

    });
}

topologyDOM.prototype.cancelTargetNodeMode=function(){
    this.targetNodeMode=null;
    this.core.container().style.cursor = 'default';
    $(document).off('keydown');
    this.core.nodes().off("click")
    this.core.autounselectify( false );
}


topologyDOM.prototype.noPosition_grid=function(eles){
    var newLayout = eles.layout({
        name: 'grid',
        animate: false,
        fit:false
    }) 
    newLayout.run()
}

topologyDOM.prototype.noPosition_cose=function(eles){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        animate: true,
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    this.core.center(eles)
}

topologyDOM.prototype.noPosition_concentric=function(eles,box){
    if(eles==null) eles=this.core.elements()
    var newLayout =eles.layout({
        name: 'concentric',
        animate: false,
        fit:false,
        minNodeSpacing:60,
        gravity:1,
        boundingBox:box
    }) 
    newLayout.run()
}

topologyDOM.prototype.layoutWithNodePosition=function(nodePosition){
    var newLayout = this.core.layout({
        name: 'preset',
        positions: nodePosition,
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
    })
    newLayout.run()
}



module.exports = topologyDOM;
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/modelAnalyzer":15,"../sharedSourceFiles/simpleConfirmDialog":20,"../sharedSourceFiles/simpleSelectMenu":21}],10:[function(require,module,exports){
const simpleTree=require("../sharedSourceFiles/simpleTree")
const modelAnalyzer=require("../sharedSourceFiles/modelAnalyzer")
const msalHelper = require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM,{"leafNameProperty":"displayName"})

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var dbModelInfo=globalCache.getSingleDBModelByID(modelClass)
        var colorCode="darkGray"
        var shape="ellipse"
        var avarta=null
        var dimension=20;
        if(globalCache.visualDefinition["default"][modelClass]){
            var visualJson =globalCache.visualDefinition["default"][modelClass]
            var colorCode= visualJson.color || "darkGray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
            if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
        }

        var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative;padding-top:2px'></div>")
        if(dbModelInfo && dbModelInfo.isIoTDeviceModel){
            var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-7px;border-radius: 3px;font-size:7px'>IoT</div>")
            iconDOM.append(iotDiv)
        }

        var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
        if(avarta){
            var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
            iconDOM.append(avartaimg)
        }
        return iconDOM
    }

    this.tree.options.groupNodeTailButtonFunc = (gn) => {
        var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="font-size:1.2em;padding:4px 8px;position:absolute;top:50%;height:27px; right:10px;transform:translateY(-50%)">+</button>')
        addButton.on("click", (e) => {
            gn.expand()
            newTwinDialog.popup({
                "$metadata": {
                    "$model": gn.info["@id"]
                }
            })
            return false
        })
        return addButton;
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "showInfoSelectedNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.searchBox=$('<input type="text"  placeholder="search..."/>').addClass("w3-input");
    this.searchBox.css({"outline":"none","height":"100%","width":"100%"}) 
    searchDOM.append(this.searchBox)
    var hideOrShowEmptyGroup=$('<button style="height:20px;border:none;padding-left:2px" class="w3-block w3-tiny w3-hover-red w3-amber">Hide Empty Models</button>')
    searchDOM.append(hideOrShowEmptyGroup)
    DOM.css("top","50px")
    hideOrShowEmptyGroup.attr("status","show")
    hideOrShowEmptyGroup.on("click",()=>{
        if(hideOrShowEmptyGroup.attr("status")=="show"){
            hideOrShowEmptyGroup.attr("status","hide")
            hideOrShowEmptyGroup.text("Show Empty Models")
            this.tree.options.hideEmptyGroup=true
        }else{
            hideOrShowEmptyGroup.attr("status","show")
            hideOrShowEmptyGroup.text("Hide Empty Models")
            delete this.tree.options.hideEmptyGroup
        }
        this.tree.groupNodes.forEach(oneGroupNode=>{oneGroupNode.checkOptionHideEmptyGroup()})
    })
    this.searchBox.keyup((e)=>{
        if(e.keyCode == 13)
        {
            var aNode = this.tree.searchText($(e.target).val())
            if(aNode!=null){
                aNode.parentGroupNode.expand()
                this.tree.selectLeafNode(aNode)
                this.tree.scrollToLeafNode(aNode)
            }
        }
    });
}

twinsTree.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}


twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"replace")
    else if(msgPayload.message=="startSelection_append") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"append")
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels()
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="visualDefinitionChange"){
        if(!msgPayload.srcModelID){ // change model class visualization
            this.tree.groupNodes.forEach(gn=>{gn.refreshName()})
        } 
    }
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.tree.deleteLeafNode(twinDisplayName)
    })
}

twinsTree.prototype.refreshModels=function(){
    var modelsData={}
    for(var modelID in modelAnalyzer.DTDLModels){
        var oneModel=modelAnalyzer.DTDLModels[modelID]
        modelsData[oneModel["displayName"]] = oneModel
    }
    //delete all group nodes of deleted models
    var arr=[].concat(this.tree.groupNodes)
    arr.forEach((gnode)=>{
        if(modelsData[gnode.name]==null){
            //delete this group node
            gnode.deleteSelf()
        }
    })

    //then add all group nodes that to be added
    var currentModelNameArr=[]
    this.tree.groupNodes.forEach((gnode)=>{currentModelNameArr.push(gnode.name)})

    var actualModelNameArr=[]
    for(var ind in modelsData) actualModelNameArr.push(ind)
    actualModelNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });

    for(var i=0;i<actualModelNameArr.length;i++){
        if(i<currentModelNameArr.length && currentModelNameArr[i]==actualModelNameArr[i]) continue
        //otherwise add this group to the tree
        var newGroup=this.tree.insertGroupNode(modelsData[actualModelNameArr[i]],i)
        newGroup.shrink()
        currentModelNameArr.splice(i, 0, actualModelNameArr[i]);
    }
}


twinsTree.prototype.loadStartSelection=async function(twinIDs,modelIDs,replaceOrAppend){
    if(replaceOrAppend=="replace") this.tree.clearAllLeafNodes()

    
    this.refreshModels()
    
    //add new twins under the model group node
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        var twinIDArr = []
        //check if any current leaf node does not have stored outbound relationship data yet
        this.tree.groupNodes.forEach((gNode) => {
            gNode.childLeafNodes.forEach(leafNode => {
                var nodeId = leafNode.leafInfo["$dtId"]
                if (globalCache.storedOutboundRelationships[nodeId] == null) twinIDArr.push(nodeId)
            })
        })

        globalCache.storeADTTwins(twinsdata)
        for (var i = 0; i < twinsdata.length; i++) {
            var groupName = globalCache.modelIDMapToName[twinsdata[i]["$metadata"]["$model"]]
            this.tree.addLeafnodeToGroup(groupName, twinsdata[i], "skipRepeat")
            twinIDArr.push(twinsdata[i]["$dtId"])
        }
        if(replaceOrAppend=="replace") this.broadcastMessage({ "message": "replaceAllTwins", info: twinsdata })
        else this.broadcastMessage({ "message": "appendAllTwins", info: twinsdata })
        

        this.fetchAllRelationships(twinIDArr)
    } catch (e) {
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}



twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
    
    //draw those known twins from the relationships
    var twinsInfo={}
    data.childTwinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    tmpArr.forEach(oneTwin=>{this.drawOneTwin(oneTwin)})
}

twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=globalCache.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

module.exports = twinsTree;
},{"../msalHelper":12,"../sharedSourceFiles/globalCache":14,"../sharedSourceFiles/modelAnalyzer":15,"../sharedSourceFiles/newTwinDialog":19,"../sharedSourceFiles/simpleTree":22}],11:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScope_taskmaster":"https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation",
    "b2cScope_functions":"https://"+b2cTenantName+".onmicrosoft.com/azureiotrocksfunctions/basic",
    "logoutRedirectUri": url.origin+"/spaindex.html",
    "msalConfig":{
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: "https://"+b2cTenantName+".b2clogin.com/"+b2cTenantName+".onmicrosoft.com/"+signupsigninname,
            knownAuthorities: [b2cTenantName+".b2clogin.com"],
            redirectUri: window.location.href
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {}
            }
        }
    },
    "isLocalTest":isLocalTest,
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/"),
    "functionsAPIURI":"https://azureiotrocksfunctions.azurewebsites.net/api/"
}

module.exports = globalAppSettings;
},{}],12:[function(require,module,exports){
(function (Buffer){(function (){
const globalAppSettings=require("./globalAppSettings")
const globalCache=require("./sharedSourceFiles/globalCache")


function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes:[]  }) //globalAppSettings.b2cScopes
        if (response != null){
            this.setAccount(response.account)
            return response.account
        } 
        else  return this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

msalHelper.prototype.setAccount=function(theAccount){
    if(theAccount==null)return;
    this.accountId = theAccount.homeAccountId;
    this.accountName = theAccount.username;
    this.userName=theAccount.name;
}

msalHelper.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(globalAppSettings.b2cSignUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(globalAppSettings.msalConfig.auth.knownAuthorities[0].toUpperCase())
            && anAccount.idTokenClaims.aud === globalAppSettings.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }
    this.setAccount(foundAccount)
    return foundAccount;
}


msalHelper.prototype.callAzureFunctionsService=async function(APIString,RESTMethod,payload){
    var headersObj={}
    var token=await this.getToken(globalAppSettings.b2cScope_functions)
    headersObj["Authorization"]=`Bearer ${token}`
    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.functionsAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.parseJWT=function(token){
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    base64= Buffer.from(base64, 'base64').toString();
    var jsonPayload = decodeURIComponent(base64.split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

msalHelper.prototype.reloadUserAccountData=async function(){
    try{
        var res=await this.callAPI("digitaltwin/fetchUserData")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return

    }
    globalCache.storeUserData(res)
}

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload,withProjectID){
    var headersObj={}
    if(withProjectID){
        payload=payload||{}
        payload["projectID"]=globalCache.currentProjectID
    } 
    if(!globalAppSettings.isLocalTest){
        try{
            var token=await this.getToken(globalAppSettings.b2cScope_taskmaster)
        }catch(e){
            window.open(globalAppSettings.logoutRedirectUri,"_self")
        }
        
        headersObj["Authorization"]=`Bearer ${token}`

        //in case joined projects JWT is going to expire, renew another one
        if(globalCache.joinedProjectsToken) {
            var expTS=this.parseJWT(globalCache.joinedProjectsToken).exp
            var currTime=parseInt(new Date().getTime()/1000)
            if(expTS-currTime<60){ //fetch a new projects JWT token 
                await this.reloadUserAccountData()
            }
        }

        //if the API need to use project ID, must add a header "projects" jwt token so server side will verify
        if(payload && payload.projectID && globalCache.joinedProjectsToken){
            headersObj["projects"]=globalCache.joinedProjectsToken
        }

    }

    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.getToken=async function(b2cScope){
    try{
        if(this.storedToken==null) this.storedToken={}
        if(this.storedToken[b2cScope]!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedToken[b2cScope].expire) return this.storedToken[b2cScope].accessToken
        }
        var tokenRequest={
            scopes: [b2cScope],
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }
        this.storedToken[b2cScope]={"accessToken":response.accessToken,"expire":response.idTokenClaims.exp}
    }catch(error){
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var response=await this.myMSALObj.acquireTokenPopup(tokenRequest)
        } else {
            throw error;
        }
    }

    return response.accessToken;
}

module.exports = new msalHelper();
}).call(this)}).call(this,require("buffer").Buffer)

},{"./globalAppSettings":11,"./sharedSourceFiles/globalCache":14,"buffer":2}],13:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")

function editProjectDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

editProjectDialog.prototype.popup = function (projectInfo) {
    this.DOM.show()
    this.DOM.empty()
    this.projectInfo=projectInfo

    this.DOM.css({"width":"420px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Project Setting</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var row1=$('<div class="w3-bar" style="padding:2px"></div>')
    this.DOM.append(row1)
    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;">Name </div>')
    row1.append(lable)
    var nameInput=$('<input type="text" style="outline:none; width:70%; display:inline;margin-left:2px;margin-right:2px"  placeholder="Project Name..."/>').addClass("w3-input w3-border");   
    row1.append(nameInput)
    nameInput.val(projectInfo.name)
    nameInput.on("change",async ()=>{
        var nameStr=nameInput.val()
        if(nameStr=="") {
            alert("Name can not be empty!")
            return;
        }
        var requestBody={"projectID":projectInfo.id,"accounts":[],"newProjectName":nameStr}
        requestBody.accounts=requestBody.accounts.concat(projectInfo.shareWith)
        try {
            await msalHelper.callAPI("accountManagement/changeOwnProjectName", "POST", requestBody)
            nameInput.blur()
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
            return
        }
    })



    var row2=$('<div class="w3-bar" style="padding:2px"></div>')
    this.DOM.append(row2)
    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;">Share With </div>')
    row2.append(lable)
    var shareAccountInput=$('<input type="text" style="outline:none; width:60%; display:inline;margin-left:2px;margin-right:2px"  placeholder="Invitee Email..."/>').addClass("w3-input w3-border");   
    row2.append(shareAccountInput)
    var inviteBtn=$('<a class="w3-button w3-border w3-red w3-hover-amber" href="#">Invite</a>') 
    row2.append(inviteBtn) 

    var shareAccountsList=$("<div class='w3-border w3-padding' style='margin:1px 1px; height:200px;overflow-x:hidden;overflow-y:auto'><div>")
    this.DOM.append(shareAccountsList)
    this.shareAccountsList=shareAccountsList;
    this.drawSharedAccounts()

    shareAccountInput.on("keydown",(event) =>{
        if (event.keyCode == 13) this.shareWithAccount(shareAccountInput)
    });
    inviteBtn.on("click",()=>{ this.shareWithAccount(shareAccountInput)})
}

editProjectDialog.prototype.shareWithAccount=async function(accountInput){
    var shareToAccount=accountInput.val()
    if(shareToAccount=="") return;
    var theIndex= this.projectInfo.shareWith.indexOf(shareToAccount)
    if(theIndex!=-1) return;
    var requestBody={"projectID":this.projectInfo.id,"shareToAccount":shareToAccount}
    try {
        await msalHelper.callAPI("accountManagement/shareProjectTo", "POST", requestBody)
        this.addAccountToShareWith(shareToAccount)
        this.drawSharedAccounts()
        accountInput.val("")
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
        return
    }
}

editProjectDialog.prototype.addAccountToShareWith=function(shareToAccountID){
    var theIndex= this.projectInfo.shareWith.indexOf(shareToAccountID)
    if(theIndex==-1) this.projectInfo.shareWith.push(shareToAccountID)
}

editProjectDialog.prototype.drawSharedAccounts=function(){
    this.shareAccountsList.empty()
    var sharedAccount=this.projectInfo.shareWith
    sharedAccount.forEach(oneEmail => {
        var arow = $('<div class="w3-bar" style="padding:2px"></div>')
        this.shareAccountsList.append(arow)
        var lable = $('<div class="w3-bar-item w3-opacity" style="padding-right:5px;">'+oneEmail+' </div>')
        arow.append(lable)
        var removeBtn=$('<a class="w3-button w3-border w3-red w3-hover-amber" style="margin-left:10pxyy" href="#">Remove</a>')
        arow.append(removeBtn)
        removeBtn.on("click",async ()=>{
            var requestBody={"projectID":this.projectInfo.id,"notShareToAccount":oneEmail}
            try {
                await msalHelper.callAPI("accountManagement/notShareProjectTo", "POST", requestBody)
                var theIndex = this.projectInfo.shareWith.indexOf(oneEmail)
                if (theIndex != -1) this.projectInfo.shareWith.splice(theIndex, 1)
                this.drawSharedAccounts()
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
                return
            }
        })
    })
}



editProjectDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }

    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        confirmDialogDiv.close()
                        this.broadcastMessage({ "message": "layoutsUpdated"})
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName })
                        }catch(e){
                            console.log(e)
                            if(e.responseText) alert(e.responseText)
                        }
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )

}

module.exports = new editProjectDialog();
},{"../msalHelper":12,"./globalCache":14,"./simpleConfirmDialog":20,"./simpleSelectMenu":21}],14:[function(require,module,exports){
function globalCache(){
    this.accountInfo=null;
    this.joinedProjectsToken=null;
    //TODO: going to be changable
    this.changeCurrentProject("1faede18-c6a0-484b-843a-7105b168568f")
}


globalCache.prototype.changeCurrentProject = function (newProjectID) {
    if(newProjectID==this.currentProjectID) return;
    this.storedOutboundRelationships = {}
    this.storedTwins = {}
    //stored data, seperately from ADT service and from cosmosDB service
    this.DBModelsArr = []
    this.modelIDMapToName={}
    this.modelNameMapToID={}

    this.DBTwinsArr = []
    this.twinIDMapToDisplayName={}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.visualDefinition={"default":{}}
    this.currentProjectID=newProjectID
}


globalCache.prototype.storeADTTwins=function(twinsData){
    twinsData.forEach((oneNode)=>{this.storeSingleADTTwin(oneNode)});
}

globalCache.prototype.storeSingleADTTwin=function(oneNode){
    this.storedTwins[oneNode["$dtId"]] = oneNode
    oneNode["displayName"]= this.twinIDMapToDisplayName[oneNode["$dtId"]]
}


globalCache.prototype.storeSingleDBTwin=function(DBTwin){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var oneDBTwin=this.DBTwinsArr[i]
        if(oneDBTwin["id"]==DBTwin["id"]){
            this.DBTwinsArr.splice(i,1)
            break;
        }
    }
    this.DBTwinsArr.push(DBTwin)

    this.twinIDMapToDisplayName[DBTwin["id"]]=DBTwin["displayName"]
}

globalCache.prototype.storeDBTwinsArr=function(DBTwinsArr){
    this.DBTwinsArr.length=0
    this.DBTwinsArr=this.DBTwinsArr.concat(DBTwinsArr)
    for(var ind in this.twinIDMapToDisplayName) delete this.twinIDMapToDisplayName[ind]
    this.DBTwinsArr.forEach(oneDBTwin=>{
        this.twinIDMapToDisplayName[oneDBTwin["id"]]=oneDBTwin["displayName"]
    })
}

globalCache.prototype.mergeDBTwinsArr=function(DBTwinsArr){
    var idList={}
    var arr=[].concat(DBTwinsArr)
    arr.forEach(aDBTwin=>{
        idList[aDBTwin.id]=1
    })
    this.DBTwinsArr.forEach(aDBTwin=>{
        if(idList[aDBTwin.id]) return;
        arr.push(aDBTwin)
    })

    this.storeDBTwinsArr(arr)
}

globalCache.prototype.storeUserData=function(res){
    res.forEach(oneResponse=>{
        if(oneResponse.type=="joinedProjectsToken") this.joinedProjectsToken=oneResponse.jwt;
        else if(oneResponse.type=="user") this.accountInfo=oneResponse
    })
}

globalCache.prototype.storeProjectModelsData=function(DBModels,adtModels){
    this.storeDBModelsArr(DBModels)

    for(var ind in this.modelIDMapToName) delete this.modelIDMapToName[ind]
    for(var ind in this.modelNameMapToID) delete this.modelNameMapToID[ind]

    var tmpNameToObj = {}
    for (var i = 0; i < adtModels.length; i++) {
        if (adtModels[i]["displayName"] == null) adtModels[i]["displayName"] = adtModels[i]["@id"]
        if ($.isPlainObject(adtModels[i]["displayName"])) {
            if (adtModels[i]["displayName"]["en"]) adtModels[i]["displayName"] = adtModels[i]["displayName"]["en"]
            else adtModels[i]["displayName"] = JSON.stringify(adtModels[i]["displayName"])
        }
        if (tmpNameToObj[adtModels[i]["displayName"]] != null) {
            //repeated model display name
            adtModels[i]["displayName"] = adtModels[i]["@id"]
        }
        tmpNameToObj[adtModels[i]["displayName"]] = 1

        this.modelIDMapToName[adtModels[i]["@id"]] = adtModels[i]["displayName"]
        this.modelNameMapToID[adtModels[i]["displayName"]] = adtModels[i]["@id"]
    }
}

globalCache.prototype.storeProjectTwinsAndVisualData=function(resArr){
    var dbtwins=[]
    resArr.forEach(element => {
        if(element.type=="visualSchema") {
            //TODO: now there is only one "default" schema to use
            this.visualDefinition[element.name]=element.detail
        }else if(element.type=="Topology") this.layoutJSON[element.name]=element.detail
        else if(element.type=="DTTwin") dbtwins.push(element)
    });
    this.storeDBTwinsArr(dbtwins)
}

globalCache.prototype.getDBTwinsByModelID=function(modelID){
    var resultArr=[]
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var ele = this.DBTwinsArr[i]
        if(ele.modelID==modelID){
            resultArr.push(ele)
        }
    }
    return resultArr;
}

globalCache.prototype.getSingleDBTwinByID=function(twinID){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var ele = this.DBTwinsArr[i]
        if(ele.id==twinID){
            return ele
        }
    }
    return null;
}

globalCache.prototype.getSingleDBModelByID=function(modelID){
    for(var i=0;i<this.DBModelsArr.length;i++){
        var ele = this.DBModelsArr[i]
        if(ele.id==modelID){
            return ele
        }
    }
    return null;
}

globalCache.prototype.storeSingleDBModel=function(singleDBModelInfo){
    var modelID = singleDBModelInfo.id
    for(var i=0;i<this.DBModelsArr.length;i++){
        var ele = this.DBModelsArr[i]
        if(ele.id==modelID){
            for(var ind in ele) delete ele[ind]
            for(var ind in singleDBModelInfo) ele[ind]=singleDBModelInfo[ind]
            return;
        }
    }
    //it is a new single model if code reaches here
    this.DBModelsArr.push(singleDBModelInfo)
    this.sortDBModelsArr()
}

globalCache.prototype.storeDBModelsArr=function(DBModelsArr){
    this.DBModelsArr.length=0
    this.DBModelsArr=this.DBModelsArr.concat(DBModelsArr)
    this.sortDBModelsArr()
    
}
globalCache.prototype.sortDBModelsArr=function(){
    this.DBModelsArr.sort(function (a, b) { 
        var aName=a.displayName.toLowerCase()
        var bName=b.displayName.toLowerCase()
        return aName.localeCompare(bName) 
    });
}


globalCache.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_remove=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var srcID=oneRelationship["srcID"]
        if(this.storedOutboundRelationships[srcID]){
            var arr=this.storedOutboundRelationships[srcID]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==oneRelationship["relID"]){
                    arr.splice(i,1)
                    break;
                }
            }
        }
    })
}

module.exports = new globalCache();
},{}],15:[function(require,module,exports){
const msalHelper=require("../msalHelper")
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    //console.log("clear all model info")
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.resetAllModels=function(arr){
    for(var modelID in this.DTDLModels){
        var jsonStr=this.DTDLModels[modelID]["original"]
        this.DTDLModels[modelID]=JSON.parse(jsonStr)
        this.DTDLModels[modelID]["original"]=jsonStr
    }
}


modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
        ele["original"]=JSON.stringify(ele)
        this.DTDLModels[modelID]=ele
    })
}


modelAnalyzer.prototype.recordAllBaseClasses= function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;

    parentObj[baseClassID]=1

    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.recordAllBaseClasses(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditablePropertiesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.editableProperties) {
        for (var ind in baseClass.editableProperties) parentObj[ind] = baseClass.editableProperties[ind]
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandEditablePropertiesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandValidRelationshipTypesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.validRelationships) {
        for (var ind in baseClass.validRelationships) {
            if(parentObj[ind]==null) parentObj[ind] = this.relationshipTypes[ind][baseClassID]
        }
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandValidRelationshipTypesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditableProperties=function(parentObj,dataInfo,embeddedSchema){
    dataInfo.forEach((oneContent)=>{
        if(oneContent["@type"]=="Relationship") return;
        if(oneContent["@type"]=="Property"
        ||(Array.isArray(oneContent["@type"]) && oneContent["@type"].includes("Property"))
        || oneContent["@type"]==null) {
            if(typeof(oneContent["schema"]) != 'object' && embeddedSchema[oneContent["schema"]]!=null) oneContent["schema"]=embeddedSchema[oneContent["schema"]]

            if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Object"){
                var newParent={}
                parentObj[oneContent["name"]]=newParent
                this.expandEditableProperties(newParent,oneContent["schema"]["fields"],embeddedSchema)
            }else if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Enum"){
                parentObj[oneContent["name"]]=oneContent["schema"]["enumValues"]
            }else{
                parentObj[oneContent["name"]]=oneContent["schema"]
            }           
        }
    })
}


modelAnalyzer.prototype.analyze=function(){
    //console.log("analyze model info")
    //analyze all relationship types
    for (var id in this.relationshipTypes) delete this.relationshipTypes[id]
    for (var modelID in this.DTDLModels) {
        var ele = this.DTDLModels[modelID]
        var embeddedSchema = {}
        if (ele.schemas) {
            var tempArr;
            if (Array.isArray(ele.schemas)) tempArr = ele.schemas
            else tempArr = [ele.schemas]
            tempArr.forEach((ele) => {
                embeddedSchema[ele["@id"]] = ele
            })
        }

        var contentArr = ele.contents
        if (!contentArr) continue;
        contentArr.forEach((oneContent) => {
            if (oneContent["@type"] == "Relationship") {
                if(!this.relationshipTypes[oneContent["name"]]) this.relationshipTypes[oneContent["name"]]= {}
                this.relationshipTypes[oneContent["name"]][modelID] = oneContent
                oneContent.editableRelationshipProperties = {}
                if (Array.isArray(oneContent.properties)) {
                    this.expandEditableProperties(oneContent.editableRelationshipProperties, oneContent.properties, embeddedSchema)
                }
            }
        })
    }

    //analyze each model's property that can be edited
    for(var modelID in this.DTDLModels){ //expand possible embedded schema to editableProperties, also extract possible relationship types for this model
        var ele=this.DTDLModels[modelID]
        var embeddedSchema={}
        if(ele.schemas){
            var tempArr;
            if(Array.isArray(ele.schemas)) tempArr=ele.schemas
            else tempArr=[ele.schemas]
            tempArr.forEach((ele)=>{
                embeddedSchema[ele["@id"]]=ele
            })
        }
        ele.editableProperties={}
        ele.validRelationships={}
        ele.includedComponents=[]
        ele.allBaseClasses={}
        if(Array.isArray(ele.contents)){
            this.expandEditableProperties(ele.editableProperties,ele.contents,embeddedSchema)

            ele.contents.forEach((oneContent)=>{
                if(oneContent["@type"]=="Relationship") {
                    ele.validRelationships[oneContent["name"]]=this.relationshipTypes[oneContent["name"]][modelID]
                }
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand component properties
        var ele=this.DTDLModels[modelID]
        if(Array.isArray(ele.contents)){
            ele.contents.forEach(oneContent=>{
                if(oneContent["@type"]=="Component"){
                    var componentName=oneContent["name"]
                    var componentClass=oneContent["schema"]
                    ele.editableProperties[componentName]={}
                    this.expandEditablePropertiesFromBaseClass(ele.editableProperties[componentName],componentClass)
                    ele.includedComponents.push(componentName)
                } 
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand base class properties to editableProperties and valid relationship types to validRelationships
        var ele=this.DTDLModels[modelID]
        var baseClassIDs=ele.extends;
        if(baseClassIDs==null) continue;
        if(Array.isArray(baseClassIDs)) var tmpArr=baseClassIDs
        else tmpArr=[baseClassIDs]
        tmpArr.forEach((eachBase)=>{
            this.recordAllBaseClasses(ele.allBaseClasses,eachBase)
            this.expandEditablePropertiesFromBaseClass(ele.editableProperties,eachBase)
            this.expandValidRelationshipTypesFromBaseClass(ele.validRelationships,eachBase)
        })
    }

    //console.log(this.DTDLModels)
    //console.log(this.relationshipTypes)
}

modelAnalyzer.prototype.listModelsForDeleteModel=function(modelID){
    var childModelIDs=[]
    for(var aID in this.DTDLModels){
        var aModel=this.DTDLModels[aID]
        if(aModel.allBaseClasses && aModel.allBaseClasses[modelID]) childModelIDs.push(aModel["@id"])
    }
    return childModelIDs
}

modelAnalyzer.prototype.deleteModel=async function(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc){
    var relatedModelIDs=this.listModelsForDeleteModel(modelID)
    var modelLevel=[]
    relatedModelIDs.forEach(oneID=>{
        var checkModel=this.DTDLModels[oneID]
        modelLevel.push({"modelID":oneID,"level":Object.keys(checkModel.allBaseClasses).length})
    })
    modelLevel.push({"modelID":modelID,"level":0})
    modelLevel.sort(function (a, b) {return b["level"]-a["level"] });
    
    for(var i=0;i<modelLevel.length;i++){
        var aModelID=modelLevel[i].modelID
        try{
            await msalHelper.callAPI("digitaltwin/deleteModel", "POST", { "model": aModelID },"withProjectID")
            delete this.DTDLModels[aModelID]
            if(funcAfterEachSuccessDelete) funcAfterEachSuccessDelete(aModelID)
        }catch(e){
            var deletedModels=[]
            var alertStr="Delete model is incomplete. Deleted Model:"
            for(var j=0;j<i;j++){
                alertStr+= modelLevel[j].modelID+" "
                deletedModels.push(modelLevel[j].modelID)
            } 
            alertStr+=". Fail to delete "+aModelID+". Error is "+e
            if(funcAfterFail) funcAfterFail(deletedModels)
            alert(e)
        }
    }
    if(completeFunc) completeFunc()
}

module.exports = new modelAnalyzer();
},{"../msalHelper":12}],16:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const simpleConfirmDialog=require("./simpleConfirmDialog")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelEditorDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Model Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var buttonRow=$('<div  style="height:40px" class="w3-bar"></div>')
    this.contentDOM.append(buttonRow)
    var importButton =$('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green w3-right" style="height:100%">Import</button>')
    this.importButton=importButton
    buttonRow.append(importButton)

    importButton.on("click", async () => {
        var currentModelID=this.dtdlobj["@id"]
        if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importModelArr([this.dtdlobj])
        else this.replaceModel()       
    })

    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Model Template</div>')
    buttonRow.append(lable)
    var modelTemplateSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"},"optionListHeight":300})
    buttonRow.append(modelTemplateSelector.DOM)
    modelTemplateSelector.callBack_clickOption=(optionText,optionValue)=>{
        modelTemplateSelector.changeName(optionText)
        this.chooseTemplate(optionValue)
    }
    modelTemplateSelector.addOption("New Model...","New")
    for(var modelName in modelAnalyzer.DTDLModels){
        modelTemplateSelector.addOption(modelName)
    }

    var panelHeight="450px"
    var row2=$('<div class="w3-cell-row" style="margin:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-card" style="padding:5px;width:330px;padding-right:5px;height:'+panelHeight+';overflow:auto"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var dtdlScriptPanel=$('<div class="w3-card-2 w3-white" style="overflow:auto;margin-top:2px;width:310px;height:'+panelHeight+'"></div>')
    rightSpan.append(dtdlScriptPanel)
    this.dtdlScriptPanel=dtdlScriptPanel

    modelTemplateSelector.triggerOptionIndex(0)
}

modelEditorDialog.prototype.replaceModel=function(){
    //delete the old same name model, then create it again
    var currentModelID=this.dtdlobj["@id"]

    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(currentModelID)

    var dialogStr = (relatedModelIDs.length == 0) ? ("Twins will be impact under model \"" + currentModelID + "\"") :
        (currentModelID + " is base model of " + relatedModelIDs.join(", ") + ". Twins under these models will be impact.")
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Warning"
            , content: dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.confirmReplaceModel(currentModelID)
                    }
                },
                {
                    colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )    
}

modelEditorDialog.prototype.importModelArr=async function(modelToBeImported,forReplacing,afterFailure){
    try {
        var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", { "models": JSON.stringify(modelToBeImported) },"withProjectID")
        if(forReplacing) alert("Model " + this.dtdlobj["displayName"] + " is modified successfully!")
        else alert("Model " + this.dtdlobj["displayName"] + " is created!")

        this.broadcastMessage({ "message": "ADTModelEdited" })
        modelAnalyzer.addModels(modelToBeImported) //add so immediatley the list can show the new models
        this.popup() //refresh content
    }catch(e){
        if(afterFailure) afterFailure()
        console.log(e)
        if(e.responseText) alert(e.responseText)
    } 
}

modelEditorDialog.prototype.confirmReplaceModel=function(modelID){
    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(modelID)
    var backupModels=[]
    relatedModelIDs.forEach(oneID=>{
        backupModels.push(JSON.parse(modelAnalyzer.DTDLModels[oneID]["original"]))
    })
    backupModels.push(this.dtdlobj)
    var backupModelsStr=encodeURIComponent(JSON.stringify(backupModels))

    var funcAfterFail=(deletedModelIDs)=>{
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + backupModelsStr);
        pom.attr('download', "exportModelsAfterFailedOperation.json");
        pom[0].click()
    }
    var funcAfterEachSuccessDelete = (eachDeletedModelID,eachModelName) => {}
    
    var completeFunc=()=>{ 
        //import all the models again
        this.importModelArr(backupModels,"forReplacing",funcAfterFail)
    }
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc)
}



modelEditorDialog.prototype.chooseTemplate=function(tempalteName){
    if(tempalteName!="New"){
        this.dtdlobj=JSON.parse(modelAnalyzer.DTDLModels[tempalteName]["original"])
    }else{
        this.dtdlobj = {
            "@id": "dtmi:aNameSpace:aModelID;1",
            "@context": ["dtmi:dtdl:context;2"],
            "@type": "Interface",
            "displayName": "New Model",
            "contents": [
                {
                    "@type": "Property",
                    "name": "attribute1",
                    "schema": "double"
                },{
                    "@type": "Relationship",
                    "name": "link"
                }
            ]
        }
    }
    this.leftSpan.empty()

    this.refreshDTDL()
    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Model ID & Name<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">model ID contains namespace, a model string and a version number</p></div></div>'))
    new idRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})
    new displayNameRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["contents"])this.dtdlobj["contents"]=[]
    new parametersRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new relationsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new componentsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["extends"])this.dtdlobj["extends"]=[]
    new baseClassesRow(this.dtdlobj["extends"],this.leftSpan,()=>{this.refreshDTDL()})
}

modelEditorDialog.prototype.refreshDTDL=function(){
    //it will refresh the generated DTDL sample, it will also change the import button to show "Create" or "Modify"
    var currentModelID=this.dtdlobj["@id"]
    if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importButton.text("Create")
    else this.importButton.text("Modify")

    this.dtdlScriptPanel.empty()
    this.dtdlScriptPanel.append($('<div style="height:20px;width:100px" class="w3-bar w3-gray">Generated DTDL</div>'))
    this.dtdlScriptPanel.append($('<pre style="color:gray">'+JSON.stringify(this.dtdlobj,null,2)+'</pre>'))
}

module.exports = new modelEditorDialog();


function baseClassesRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Base Classes<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Base class model\'s parameters and relationship type are inherited</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = "unknown"
        dtdlObj.push(newObj)
        new singleBaseclassRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        new singleBaseclassRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleBaseclassRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var baseClassNameInput=$('<input type="text" style="outline:none;display:inline;width:220px;padding:4px"  placeholder="base model id"/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(baseClassNameInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    baseClassNameInput.val(dtdlObj)
    baseClassNameInput.on("change",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj[i]=baseClassNameInput.val()
                break;
            }
        }
        refreshDTDLF()
    })
}

function componentsRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Components<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Component model\'s parameters are embedded under a name</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Component",
            "name": "SomeComponent",
            "schema":"dtmi:someComponentModel;1"
        }
        dtdlObj.push(newObj)
        new singleComponentRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Component") return
        new singleComponentRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleComponentRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var componentNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="component name"/>').addClass("w3-bar-item w3-input w3-border");
    var schemaInput=$('<input type="text" style="outline:none;display:inline;width:160px;padding:4px"  placeholder="component model id..."/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(componentNameInput,schemaInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    componentNameInput.val(dtdlObj["name"])
    schemaInput.val(dtdlObj["schema"]||"")

    componentNameInput.on("change",()=>{
        dtdlObj["name"]=componentNameInput.val()
        refreshDTDLF()
    })
    schemaInput.on("change",()=>{
        dtdlObj["schema"]=schemaInput.val()
        refreshDTDLF()
    })
}

function relationsRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Relationship Types<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Relationship can have its own parameters</p></div></div>')


    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Relationship",
            "name": "relation1",
        }
        dtdlObj.push(newObj)
        new singleRelationTypeRow(newObj,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Relationship") return
        new singleRelationTypeRow(element,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
    });
}

function singleRelationTypeRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var relationNameInput=$('<input type="text" style="outline:none;display:inline;width:90px;padding:4px"  placeholder="relation name"/>').addClass("w3-bar-item w3-input w3-border");
    var targetModelID=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="(optional)target model"/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-cog fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(relationNameInput,targetModelID,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    relationNameInput.val(dtdlObj["name"])
    targetModelID.val(dtdlObj["target"]||"")

    addButton.on("click",()=>{
        if(! dtdlObj["properties"]) dtdlObj["properties"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["properties"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        refreshDTDLF()
    })

    relationNameInput.on("change",()=>{
        dtdlObj["name"]=relationNameInput.val()
        refreshDTDLF()
    })
    targetModelID.on("change",()=>{
        if(targetModelID.val()=="") delete dtdlObj["target"]
        else dtdlObj["target"]=targetModelID.val()
        refreshDTDLF()
    })
    if(dtdlObj["properties"] && dtdlObj["properties"].length>0){
        var properties=dtdlObj["properties"]
        properties.forEach(oneProperty=>{
            new singleParameterRow(oneProperty,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        })
    }
}

function parametersRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Parameters</div></div>')
    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = {
            "@type": "Property",
            "name": "newP",
            "schema": "double"
        }
        dtdlObj.push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Property") return
        new singleParameterRow(element,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
    });
}

function singleParameterRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,topLevel,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var parameterNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="parameter name"/>').addClass("w3-bar-item w3-input w3-border");
    var enumValueInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="str1,str2,..."/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-plus fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    var ptypeSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1em",colorClass:"w3-light-gray w3-bar-item",buttonCSS:{"padding":"4px 5px"},"optionListHeight":300,"isClickable":1,"optionListMarginTop":-150,"optionListMarginLeft":60,
    "adjustPositionAnchor":dialogOffset})
    ptypeSelector.addOptionArr(["string","float","integer","Enum","Object","double","boolean","date","dateTime","duration","long","time"])
    DOM.append(parameterNameInput,ptypeSelector.DOM,enumValueInput,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })
    
    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    parameterNameInput.val(dtdlObj["name"])
    ptypeSelector.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        ptypeSelector.changeName(optionText)
        contentDOM.empty()//clear all content dom content
        if(realMouseClick){
            for(var ind in dtdlObj) delete dtdlObj[ind]    //clear all object content
            if(topLevel) dtdlObj["@type"]="Property"
            dtdlObj["name"]=parameterNameInput.val()
        } 
        if(optionText=="Enum"){
            enumValueInput.val("")
            enumValueInput.show();
            addButton.hide()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Enum","valueSchema": "string"}
        }else if(optionText=="Object"){
            enumValueInput.hide();
            addButton.show()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Object"}
        }else{
            if(realMouseClick) dtdlObj["schema"]=optionText
            enumValueInput.hide();
            addButton.hide()
        }
        refreshDTDLF()
    }
    addButton.on("click",()=>{
        if(! dtdlObj["schema"]["fields"]) dtdlObj["schema"]["fields"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["schema"]["fields"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        refreshDTDLF()
    })

    parameterNameInput.on("change",()=>{
        dtdlObj["name"]=parameterNameInput.val()
        refreshDTDLF()
    })
    enumValueInput.on("change",()=>{
        var valueArr=enumValueInput.val().split(",")
        dtdlObj["schema"]["enumValues"]=[]
        valueArr.forEach(aVal=>{
            dtdlObj["schema"]["enumValues"].push({
                "name": aVal.replace(" ",""), //remove all the space in name
                "enumValue": aVal
              })
        })
        refreshDTDLF()
    })
    if(typeof(dtdlObj["schema"]) != 'object') var schema=dtdlObj["schema"]
    else schema=dtdlObj["schema"]["@type"]
    ptypeSelector.triggerOptionValue(schema)
    if(schema=="Enum"){
        var enumArr=dtdlObj["schema"]["enumValues"]
        if(enumArr!=null){
            var inputStr=""
            enumArr.forEach(oneEnumValue=>{inputStr+=oneEnumValue.enumValue+","})
            inputStr=inputStr.slice(0, -1)//remove the last ","
            enumValueInput.val(inputStr)
        }
    }else if(schema=="Object"){
        var fields=dtdlObj["schema"]["fields"]
        fields.forEach(oneField=>{
            new singleParameterRow(oneField,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        })
    }
}


function idRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">dtmi:</div>')
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:88px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:132px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    var versionInput=$('<input type="text" style="outline:none;display:inline;width:60px;padding:4px"  placeholder="version"/>').addClass("w3-input w3-border");
    DOM.append(label1,domainInput,$('<div class="w3-opacity" style="display:inline">:</div>'),modelIDInput,$('<div class="w3-opacity" style="display:inline">;</div>'),versionInput)
    parentDOM.append(DOM)

    var valueChange=()=>{
        var str=`dtmi:${domainInput.val()}:${modelIDInput.val()};${versionInput.val()}`
        dtdlObj["@id"]=str
        refreshDTDLF()
    }
    domainInput.on("change",valueChange)
    modelIDInput.on("change",valueChange)
    versionInput.on("change",valueChange)

    var str=dtdlObj["@id"]
    if(str!="" && str!=null){
        var arr1=str.split(";")
        if(arr1.length!=2) return;
        versionInput.val(arr1[1])
        var arr2=arr1[0].split(":")
        domainInput.val(arr2[1])
        arr2.shift(); arr2.shift()
        modelIDInput.val(arr2.join(":"))
    }
}

function displayNameRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">Display Name:</div>')
    var nameInput=$('<input type="text" style="outline:none;display:inline;width:150px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    DOM.append(label1,nameInput)
    parentDOM.append(DOM)
    var valueChange=()=>{
        dtdlObj["displayName"]=nameInput.val()
        refreshDTDLF()
    }
    nameInput.on("change",valueChange)
    var str=dtdlObj["displayName"]
    if(str!="" && str!=null) nameInput.val(str)
}
},{"../msalHelper":12,"./modelAnalyzer":15,"./simpleConfirmDialog":20,"./simpleSelectMenu":21}],17:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("./simpleTree")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")

function modelManagerDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
    }
    this.showRelationVisualizationSettings=true;
}


modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:650px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create/Modify Model</button>')
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
    this.contentDOM.children(':first').append(importModelsBtn,actualImportModelsBtn, modelEditorBtn,exportModelBtn)
    importModelsBtn.on("click", ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readModelFilesContentAndImport(files)
        actualImportModelsBtn.val("")
    })
    modelEditorBtn.on("click",()=>{
        modelEditorDialog.popup()
    })
    exportModelBtn.on("click", () => {
        var modelArr=[]
        for(var modelID in modelAnalyzer.DTDLModels) modelArr.push(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(modelArr)));
        pom.attr('download', "exportModels.json");
        pom[0].click()
    })

    var row2=$('<div class="w3-cell-row" style="margin-top:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
    row2.append(leftSpan)
    leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Models</div></div>'))
    
    var modelList = $('<ul class="w3-ul w3-hoverable">')
    modelList.css({"overflow-x":"hidden","overflow-y":"auto","height":"420px", "border":"solid 1px lightgray"})
    leftSpan.append(modelList)
    this.modelList = modelList;
    
    var rightSpan=$('<div class="w3-container w3-cell" style="padding:0px"></div>')
    row2.append(rightSpan) 
    var panelCardOut=$('<div class="w3-card-2 w3-white" style="margin-top:2px"></div>')

    this.modelButtonBar=$('<div class="w3-bar" style="height:35px"></div>')
    panelCardOut.append(this.modelButtonBar)

    rightSpan.append(panelCardOut)
    var panelCard=$('<div style="width:410px;height:412px;overflow:auto;margin-top:2px"></div>')
    panelCardOut.append(panelCard)
    this.panelCard=panelCard;

    this.modelButtonBar.empty()
    panelCard.html("<a style='display:block;font-style:italic;color:gray;padding-left:5px'>Choose a model to view infomration</a>")

    this.listModels()
}

modelManagerDialog.prototype.resizeImgFile = async function(theFile,max_size) {
    return new Promise((resolve, reject) => {
        try {
            var reader = new FileReader();
            var tmpImg = new Image();
            reader.onload = () => {
                tmpImg.onload =  ()=> {
                    var canvas = document.createElement('canvas')
                    var width = tmpImg.width
                    var height = tmpImg.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(tmpImg, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl)
                }
                tmpImg.src = reader.result;
            }
            reader.readAsDataURL(theFile);
        } catch (e) {
            reject(e)
        }
    })
}

modelManagerDialog.prototype.fillRightSpan=async function(modelID){
    this.panelCard.empty()
    this.modelButtonBar.empty()

    var delBtn = $('<button style="margin-bottom:2px" class="w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    this.modelButtonBar.append(delBtn)


    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn = $('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(importPicBtn, actualImportPicBtn, clearAvartaBtn)
    importPicBtn.on("click", () => {
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt) => {
        var files = evt.target.files; // FileList object
        var theFile = files[0]

        if (theFile.type == "image/svg+xml") {
            var str = await this.readOneFile(theFile)
            var dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(str);
        } else if (theFile.type.match('image.*')) {
            var dataUrl = await this.resizeImgFile(theFile, 70)
        } else {
            var confirmDialogDiv = new simpleConfirmDialog()
            confirmDialogDiv.show({ width: "200px" },
                {
                    title: "Note"
                    , content: "Please import image file (png,jpg,svg and so on)"
                    , buttons: [{ colorClass: "w3-gray", text: "Ok", "clickFunc": () => { confirmDialogDiv.close() } }]
                }
            )
        }
        if (this.avartaImg) this.avartaImg.attr("src", dataUrl)

        var visualJson = globalCache.visualDefinition["default"]
        if (!visualJson[modelID]) visualJson[modelID] = {}
        visualJson[modelID].avarta = dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "avarta": dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", () => {
        var visualJson = globalCache.visualDefinition["default"]
        if (visualJson[modelID]) delete visualJson[modelID].avarta
        if (this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "noAvarta": true })
        this.refreshModelTreeLabel()
    });

    
    delBtn.on("click",()=>{
        var relatedModelIDs =modelAnalyzer.listModelsForDeleteModel(modelID)
        var dialogStr=(relatedModelIDs.length==0)? ("This will DELETE model \"" + modelID + "\"."): 
            (modelID + " is base model of "+relatedModelIDs.join(", ")+".")
        var confirmDialogDiv = new simpleConfirmDialog()

        //check how many twins are under this model ID
        var numberOfTwins=0
        var checkTwinsModelArr=[modelID].concat(relatedModelIDs)
        globalCache.DBTwinsArr.forEach(oneDBTwin=>{
            var theIndex=checkTwinsModelArr.indexOf(oneDBTwin["modelID"])
            if(theIndex!=-1) numberOfTwins++
        })

        dialogStr+=" (There will be "+((numberOfTwins>1)?(numberOfTwins+" twins"):(numberOfTwins+" twin") ) + " being impacted)"
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: dialogStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                            confirmDialogDiv.close();
                            this.confirmDeleteModel(modelID) 
                        }
                    },
                    {
                        colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                            confirmDialogDiv.close()
                        }
                    }
                ]
            }
        )
        
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var baseClassesDOM=this.addAPartInRightSpan("Base Classes")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]),null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)

    this.fillBaseClasses(modelAnalyzer.DTDLModels[modelID].allBaseClasses,baseClassesDOM) 
}

modelManagerDialog.prototype.confirmDeleteModel=function(modelID){
    var funcAfterEachSuccessDelete = (eachDeletedModelID) => {
        this.tree.deleteLeafNode(globalCache.modelIDMapToName[eachDeletedModelID])
        //TODO: clear the visualization setting of this deleted model
        /*
        if (globalCache.visualDefinition["default"][modelID]) {
            delete globalCache.visualDefinition["default"][modelID]
            this.saveVisualDefinition()
        }*/
    }
    var completeFunc=()=>{ 
        this.broadcastMessage({ "message": "ADTModelsChange"})
        this.panelCard.empty()
    }

    //even not completely successful deleting, it will still invoke completeFunc
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,completeFunc,completeFunc)
}

modelManagerDialog.prototype.refreshModelTreeLabel=function(){
    if(this.tree.selectedNodes.length>0) this.tree.selectedNodes[0].redrawLabel()
}

modelManagerDialog.prototype.fillBaseClasses=function(baseClasses,parentDom){
    for(var ind in baseClasses){
        var keyDiv= $("<label style='display:block;padding:.1em'>"+ind+"</label>")
        parentDom.append(keyDiv)
    }
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    var aTable=$("<table style='width:100%'></table>")
    aTable.html('<tr><td></td><td></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    rightPart.css({"width":"50px","height":"50px","border":"solid 1px lightGray"})
    
    var avartaImg=$("<img style='height:45px'></img>")
    rightPart.append(avartaImg)
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;
    this.addOneVisualizationRow(modelID,leftPart)

    if(this.showRelationVisualizationSettings){
        for(var ind in modelJson.validRelationships){
            this.addOneVisualizationRow(modelID,leftPart,ind)
        }
    }
}
modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label style='margin-right:10px'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definedColor=null
    var definedShape=null
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition["default"]
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
            if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
        }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none;width:75px"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }else{
        colorSelector.css("color","darkGray")
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color",selectColorCode)
        var visualJson=globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })
    var shapeSelector = $('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(shapeSelector)
    if(relatinshipName==null){
        shapeSelector.append($("<option value='ellipse'>◯</option>"))
        shapeSelector.append($("<option value='round-rectangle' style='font-size:120%'>▢</option>"))
        shapeSelector.append($("<option value='hexagon' style='font-size:130%'>⬡</option>"))
    }else{
        shapeSelector.append($("<option value='solid'>→</option>"))
        shapeSelector.append($("<option value='dotted'>⇢</option>"))
    }
    if(definedShape!=null) {
        shapeSelector.val(definedShape)
    }
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"shape":selectShape })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
        }
        this.saveVisualDefinition()
    })

    var sizeAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    if(relatinshipName==null){
        for(var f=0.2;f<2;f+=0.2){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">dimension*"+val+"</option>"))
        }
        if(definedDimensionRatio!=null) sizeAdjustSelector.val(definedDimensionRatio)
        else sizeAdjustSelector.val("1.0")
    }else{
        sizeAdjustSelector.css("width","80px")
        for(var f=0.5;f<=4;f+=0.5){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">width *"+val+"</option>"))
        }
        if(definedEdgeWidth!=null) sizeAdjustSelector.val(definedEdgeWidth)
        else sizeAdjustSelector.val("2.0")
    }
    containerDiv.append(sizeAdjustSelector)

    
    sizeAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].edgeWidth=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"edgeWidth":chooseVal })
        }
        this.saveVisualDefinition()
    })
    
}

modelManagerDialog.prototype.saveVisualDefinition=async function(){
    try{
        await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(globalCache.visualDefinition["default"])},"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

modelManagerDialog.prototype.fillRelationshipInfo=function(validRelationships,parentDom){
    for(var ind in validRelationships){
        var keyDiv= $("<label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")
        var label=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px'></label>")
        label.text("Relationship")
        parentDom.append(label)
        if(validRelationships[ind].target){
            var label1=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px;margin-left:2px'></label>")
            label1.text(validRelationships[ind].target)
            parentDom.append(label1)
        }
        var contentDOM=$("<label></label>")
        contentDOM.css("display","block")
        contentDOM.css("padding-left","1em")
        parentDom.append(contentDOM)
        this.fillEditableProperties(validRelationships[ind].editableRelationshipProperties, contentDOM)
    }
}

modelManagerDialog.prototype.fillEditableProperties=function(jsonInfo,parentDom){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")

        if(Array.isArray(jsonInfo[ind])){
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text("enum")
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)

            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' ></label>")
            label1.css({"fontSize":"9px","padding":'2px',"margin-left":"2px"})
            label1.text(valueArr.join())
            keyDiv.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            var contentDOM=$("<label></label>")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
            keyDiv.append(contentDOM)
        }else {
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)
        }
    }
}


modelManagerDialog.prototype.addAPartInRightSpan=function(partName){
    var headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align" style="font-weight:bold"></button>')
    headerDOM.text(partName)
    var listDOM=$('<div class="w3-container w3-hide w3-border w3-show" style="background-color:white"></div>')
    this.panelCard.append(headerDOM,listDOM)

    headerDOM.on("click",(evt)=> {
        if(listDOM.hasClass("w3-show")) listDOM.removeClass("w3-show")
        else listDOM.addClass("w3-show")
 
        return false;
    });
    
    return listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(Array.isArray(obj)) fileContentArr=fileContentArr.concat(obj)
            else fileContentArr.push(obj)
        }catch(err){
            alert(err)
        }
    }
    if(fileContentArr.length==0) return;
    try {
        var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", {"models":JSON.stringify(fileContentArr)},"withProjectID")
        this.listModels("shouldBroadCast")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }  
}

modelManagerDialog.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}


modelManagerDialog.prototype.listModels=async function(shouldBroadcast){
    this.modelList.empty()
    this.panelCard.empty()
    try{
        var res=await msalHelper.callAPI("digitaltwin/fetchProjectModelsData","POST",null,"withProjectID")
        globalCache.storeProjectModelsData(res.DBModels,res.adtModels)
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(res.adtModels)
        modelAnalyzer.analyze();
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return
    }

    if(jQuery.isEmptyObject(modelAnalyzer.DTDLModels)){
        var zeroModelItem=$('<li style="font-size:0.9em">zero model record. Please import...</li>')
        this.modelList.append(zeroModelItem)
        zeroModelItem.css("cursor","default")
    }else{
        this.tree = new simpleTree(this.modelList, {
            "leafNameProperty": "displayName"
            , "noMultipleSelectAllowed": true, "hideEmptyGroup": true
        })

        this.tree.options.leafNodeIconFunc = (ln) => {
            var modelClass = ln.leafInfo["@id"]
            var dbModelInfo=globalCache.getSingleDBModelByID(modelClass)
            
            var colorCode = "darkGray"
            var shape = "ellipse"
            var avarta = null
            var dimension=20;
            if (globalCache.visualDefinition["default"][modelClass]) {
                var visualJson = globalCache.visualDefinition["default"][modelClass]
                var colorCode = visualJson.color || "darkGray"
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
                if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
            }

            var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
            if(dbModelInfo.isIoTDeviceModel){
                var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-9px;border-radius: 3px;font-size:7px'>IoT</div>")
                iconDOM.append(iotDiv)
            }


            var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
            iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
            if(avarta){
                var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
                iconDOM.append(avartaimg)
            }
            return iconDOM
        }

        this.tree.callback_afterSelectNodes = (nodesArr, mouseClickDetail) => {
            var theNode = nodesArr[0]
            this.fillRightSpan(theNode.leafInfo["@id"])
        }

        var groupNameList = {}
        for (var modelID in modelAnalyzer.DTDLModels) groupNameList[this.modelNameToGroupName(modelID)] = 1
        var modelgroupSortArr = Object.keys(groupNameList)
        modelgroupSortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        modelgroupSortArr.forEach(oneGroupName => {
            var gn=this.tree.addGroupNode({ displayName: oneGroupName })
            gn.expand()
        })

        for (var modelID in modelAnalyzer.DTDLModels) {
            var gn = this.modelNameToGroupName(modelID)
            this.tree.addLeafnodeToGroup(gn, JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        }

        this.tree.sortAllLeaves()
    }
    
    if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange"})
}

modelManagerDialog.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();
},{"../msalHelper":12,"./globalCache":14,"./modelAnalyzer":15,"./modelEditorDialog":16,"./simpleConfirmDialog":20,"./simpleTree":22}],18:[function(require,module,exports){
const globalAppSettings=require("../globalAppSettings")
const msalHelper=require("../msalHelper")

function moduleSwitchDialog(){
    this.modulesSidebar=$('<div class="w3-sidebar w3-bar-block w3-white w3-animate-left w3-card-4" style="display:none;height:195px;width:240px;overflow:hidden"><div style="height:40px" class="w3-bar w3-red"><button class="w3-bar-item w3-button w3-left w3-hover-amber" style="font-size:2em;padding-top:4px;width:55px">☰</button><div class="w3-bar-item" style="font-size:1.5em;width:70px;float:left;cursor:default">Open</div></div><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconiothub.ico" style="width:25px;margin-right:10px"></img>Device Management</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="favicondigitaltwin.ico" style="width:25px;margin-right:10px"></img>Digital Twin</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconeventlog.ico" style="width:25px;margin-right:10px"></img>Event Log</a><a href="#" class="w3-bar-item w3-button w3-medium">Log out</a></div>')
    
    this.modulesSwitchButton=$('<a class="w3-bar-item w3-button" href="#">☰</a>')
    
    this.modulesSwitchButton.on("click",()=>{ this.modulesSidebar.css("display","block") })
    this.modulesSidebar.children(':first').on("click",()=>{this.modulesSidebar.css("display","none")})
    
    var allModeuls=this.modulesSidebar.children("a")
    $(allModeuls[0]).on("click",()=>{
        window.open("devicemanagement.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[1]).on("click",()=>{
        window.open("digitaltwinmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[2]).on("click",()=>{
        window.open("eventlogmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[3]).on("click",()=>{
        const logoutRequest = {
            postLogoutRedirectUri: globalAppSettings.logoutRedirectUri,
            mainWindowRedirectUri: globalAppSettings.logoutRedirectUri
        };
        var myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
        myMSALObj.logoutPopup(logoutRequest);
    })
}

module.exports = new moduleSwitchDialog();
},{"../globalAppSettings":11,"../msalHelper":12}],19:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function newTwinDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

newTwinDialog.prototype.popup = async function(twinInfo) {
    this.originalTwinInfo=JSON.parse(JSON.stringify(twinInfo))
    this.twinInfo=twinInfo
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:520px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var addButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%">Add</button>')
    this.contentDOM.children(':first').append(addButton)
    addButton.on("click", async () => { this.addNewTwin() })
    
    var addAndCloseButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%;margin-left:5px">Add & Close</button>')    
    this.contentDOM.children(':first').append(addAndCloseButton)
    addAndCloseButton.on("click", async () => {this.addNewTwin("CloseDialog")})
        
    var IDLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Twin ID</div>")
    var IDInput=$('<input type="text" style="margin:8px 0;padding:2px;width:150px;outline:none;display:inline" placeholder="ID"/>').addClass("w3-input w3-border");
    this.IDInput=IDInput 
    var modelID=twinInfo["$metadata"]["$model"]
    var modelLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Model</div>")
    var modelInput=$('<div type="text" style="margin:8px 0;padding:2px;display:inline"/>').text(modelID);  
    this.contentDOM.append($("<div/>").append(IDLableDiv,IDInput))
    this.contentDOM.append($("<div style='padding:8px 0px'/>").append(modelLableDiv,modelInput))
    IDInput.change((e)=>{
        this.twinInfo["$dtId"]=$(e.target).val()
    })

    var dialogDOM=$('<div />')
    this.contentDOM.append(dialogDOM)    
    var titleTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    titleTable.append($('<tr><td style="font-weight:bold">Properties Tree</td></tr>'))
    dialogDOM.append($("<div class='w3-container'/>").append(titleTable))

    var settingsDiv=$("<div class='w3-container w3-border' style='width:100%;max-height:310px;overflow:auto'></div>")
    this.settingsDiv=settingsDiv
    dialogDOM.append(settingsDiv)
    this.drawModelSettings()
}

newTwinDialog.prototype.addNewTwin = async function(closeDialog) {
    var modelID=this.twinInfo["$metadata"]["$model"]
    var DBModelInfo=globalCache.getSingleDBModelByID(modelID)

    if(!this.twinInfo["$dtId"]||this.twinInfo["$dtId"]==""){
        alert("Please fill in name for the new digital twin")
        return;
    }
    var componentsNameArr=modelAnalyzer.DTDLModels[modelID].includedComponents
    componentsNameArr.forEach(oneComponentName=>{ //adt service requesting all component appear by mandatory
        if(this.twinInfo[oneComponentName]==null)this.twinInfo[oneComponentName]={}
        this.twinInfo[oneComponentName]["$metadata"]= {}
    })

    //ask taskmaster to add the twin
    try{
        var postBody= {"newTwinJson":JSON.stringify(this.twinInfo)}
        var data = await msalHelper.callAPI("digitaltwin/upsertDigitalTwin", "POST", postBody,"withProjectID" )
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    globalCache.storeSingleDBTwin(data.DBTwin)    
    globalCache.storeSingleADTTwin(data.ADTTwin)


    //ask taskmaster to provision the twin to iot hub if the model is a iot device model
    if(DBModelInfo.isIoTDeviceModel){
        try{
            var postBody= {"DBTwin":data.DBTwin,"desiredInDeviceTwin":{}}
            DBModelInfo.desiredProperties.forEach(ele=>{
                var propertyName=ele.path[ele.path.length-1]
                var propertySampleV= ""
                postBody.desiredInDeviceTwin[propertyName]=propertySampleV
            })
            var provisionedDocument = await msalHelper.callAPI("devicemanagement/provisionIoTDeviceTwin", "POST", postBody,"withProjectID" )
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
        data.DBTwin=provisionedDocument
        globalCache.storeSingleDBTwin(provisionedDocument)   
    }

    //it should select the new node in the tree, and move topology view to show the new node (note pan to a place that is not blocked by the dialog itself)
    this.broadcastMessage({ "message": "addNewTwin", "twinInfo": data.ADTTwin, "DBTwinInfo":data.DBTwin})

    if(closeDialog)this.DOM.hide()
    else{
        //clear the input editbox
        this.popup(this.originalTwinInfo)
    }
}

newTwinDialog.prototype.drawModelSettings = async function() {
    var modelID=this.twinInfo["$metadata"]["$model"]
    var modelDetail= modelAnalyzer.DTDLModels[modelID]
    var copyModelEditableProperty=JSON.parse(JSON.stringify(modelDetail.editableProperties))
    
    if($.isEmptyObject(copyModelEditableProperty)){
        this.settingsDiv.text("There is no editable property")
        this.settingsDiv.addClass("w3-text-gray")
        return;
    }   

    var settingsTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    this.settingsDiv.append(settingsTable)

    var initialPathArr=[]
    var lastRootNodeRecord=[]
    this.drawEditable(settingsTable,copyModelEditableProperty,initialPathArr,lastRootNodeRecord)
}


newTwinDialog.prototype.drawEditable = async function(parentTable,jsonInfo,pathArr,lastRootNodeRecord) {
    if(jsonInfo==null) return;
    var arr=[]
    for(var ind in jsonInfo) arr.push(ind)

    for(var theIndex=0;theIndex<arr.length;theIndex++){
        if(theIndex==arr.length-1) lastRootNodeRecord[pathArr.length] =true;
        
        var ind = arr[theIndex]
        var tr=$("<tr/>")
        var rightTD=$("<td style='height:30px'/>")
        tr.append(rightTD)
        parentTable.append(tr)
        
        for(var i=0;i<pathArr.length;i++){
            if(!lastRootNodeRecord[i]) rightTD.append(this.treeLineDiv(2))
            else rightTD.append(this.treeLineDiv(4))
        }

        if(theIndex==arr.length-1) rightTD.append(this.treeLineDiv(3))
        else rightTD.append(this.treeLineDiv(1))

        var pNameDiv=$("<div style='float:left;line-height:28px;margin-left:3px'>"+ind+"</div>")
        rightTD.append(pNameDiv)
        var newPath=pathArr.concat([ind])

        if (Array.isArray(jsonInfo[ind])) { //it is a enumerator
            this.drawDropDownBox(rightTD,newPath,jsonInfo[ind])
        } else if (typeof (jsonInfo[ind])==="object") {
            this.drawEditable(parentTable,jsonInfo[ind],newPath,lastRootNodeRecord)
        }else {
            var aInput=$('<input type="text" style="margin-left:5px;padding:2px;width:200px;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            rightTD.append(aInput)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.updateOriginObjectValue($(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"))
            })
        } 
    }
}

newTwinDialog.prototype.drawDropDownBox=function(rightTD,newPath,valueArr){
    var aSelectMenu = new simpleSelectMenu(""
        , { width: "200" 
            ,buttonCSS: { "padding": "4px 16px"}
            , "optionListMarginTop": 25//,"optionListMarginLeft":210
            , "adjustPositionAnchor": this.DOM.offset()
        })


    rightTD.append(aSelectMenu.rowDOM)  //use rowDOM instead of DOM to allow select option window float above dialog
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption) => {
        var str = oneOption["displayName"] || oneOption["enumValue"]
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption = (optionText, optionValue, realMouseClick) => {
        aSelectMenu.changeName(optionText)
        if (realMouseClick) this.updateOriginObjectValue(aSelectMenu.DOM.data("path"), optionValue, "string")
    }
}

newTwinDialog.prototype.updateOriginObjectValue=function(pathArr,newVal,dataType){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)
    if(pathArr.length==0) return;
    var theJson=this.twinInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
}

newTwinDialog.prototype.treeLineDiv = function(typeNumber) {
    var reDiv=$('<div style="margin-left:10px;width:15px;height: 100%;float: left"></div>')
    if(typeNumber==1){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==2){
        reDiv.append($('<div class="w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==3){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;">'))
    }else if(typeNumber==4){
        
    }
    return reDiv
}

module.exports = new newTwinDialog();
},{"../msalHelper":12,"./globalCache":14,"./modelAnalyzer":15,"./simpleSelectMenu":21}],20:[function(require,module,exports){
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    //this.DOM.css("overflow","hidden")
}

simpleConfirmDialog.prototype.show=function(cssOptions,otherOptions){
    this.DOM.css(cssOptions)
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">' + otherOptions.title + '</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.close() })

    var dialogDiv=$('<div class="w3-container" style="margin-top:10px;margin-bottom:10px"></div>')
    dialogDiv.text(otherOptions.content)
    this.DOM.append(dialogDiv)
    this.dialogDiv=dialogDiv

    this.bottomBar=$('<div class="w3-bar"></div>')
    this.DOM.append(this.bottomBar)

    otherOptions.buttons.forEach(btn=>{
        var aButton=$('<button class="w3-button w3-right '+(btn.colorClass||"")+'" style="margin-right:2px;margin-left:2px">'+btn.text+'</button>')
        aButton.on("click",()=> { btn.clickFunc()  }  )
        this.bottomBar.append(aButton)    
    })
    $("body").append(this.DOM)
}

simpleConfirmDialog.prototype.close=function(){
    this.DOM.remove()
}

module.exports = simpleConfirmDialog;
},{}],21:[function(require,module,exports){
function simpleSelectMenu(buttonName,options){
    options=options||{} //{isClickable:1,withBorder:1,fontSize:"",colorClass:"",buttonCSS:""}
    if(options.isClickable){
        this.isClickable=true
        this.DOM=$('<div class="w3-dropdown-click"></div>')
    }else{
        this.DOM=$('<div class="w3-dropdown-hover "></div>')
        this.DOM.on("mouseover",(e)=>{
            this.adjustDropDownPosition()
        })
    }


    //it seems that the select menu only can show outside of a parent scrollable dom when it is inside a w3-bar item... not very sure about why 
    var rowDOM=$('<div class="w3-bar" style="display:inline-block;margin-left:5px"></div>')
    rowDOM.css("width",(options.width||100)+"px")
    this.rowDOM=rowDOM
    this.rowDOM.append(this.DOM)
    
    this.button=$('<button class="w3-button" style="outline: none;"><a>'+buttonName+'</a><a style="font-weight:bold;padding-left:2px"></a><i class="fa fa-caret-down" style="padding-left:3px"></i></button>')
    if(options.withBorder) this.button.addClass("w3-border")
    if(options.fontSize) this.DOM.css("font-size",options.fontSize)
    if(options.colorClass) this.button.addClass(options.colorClass)
    if(options.width) this.button.css("width",options.width)
    if(options.buttonCSS) this.button.css(options.buttonCSS)
    if(options.adjustPositionAnchor) this.adjustPositionAnchor=options.adjustPositionAnchor

    this.optionContentDOM=$('<div class="w3-dropdown-content w3-bar-block w3-card-4"></div>')
    if(options.optionListHeight) this.optionContentDOM.css({height:options.optionListHeight+"px","overflow-y":"auto","overflow-x":"visible"})
    if(options.optionListMarginTop) this.optionContentDOM.css({"margin-top":options.optionListMarginTop+"px"})
    if(options.optionListMarginLeft) this.optionContentDOM.css({"margin-left":options.optionListMarginLeft+"px"})
    
    this.DOM.append(this.button,this.optionContentDOM)
    this.curSelectVal=null;

    if(options.isClickable){
        this.button.on("click",(e)=>{
            this.adjustDropDownPosition()
            if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
            else{
                this.callBack_beforeClickExpand()
                this.optionContentDOM.addClass("w3-show")
            } 
            return false;
        })    
    }
}

simpleSelectMenu.prototype.shrink=function(){
    if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
}

simpleSelectMenu.prototype.adjustDropDownPosition=function(){
    if(!this.adjustPositionAnchor) return;
    var offset=this.DOM.offset()
    var newTop=offset.top-this.adjustPositionAnchor.top
    var newLeft=offset.left-this.adjustPositionAnchor.left
    this.optionContentDOM.css({"top":newTop+"px","left":newLeft+"px"})
}

simpleSelectMenu.prototype.findOption=function(optionValue){
    var options=this.optionContentDOM.children()
    for(var i=0;i<options.length;i++){
        var anOption=$(options[i])
        if(optionValue==anOption.data("optionValue")){
            return {"text":anOption.text(),"value":anOption.data("optionValue"),"colorClass":anOption.data("optionColorClass")}
        }
    }
}

simpleSelectMenu.prototype.addOptionArr=function(arr){
    arr.forEach(element => {
        this.addOption(element)
    });
}

simpleSelectMenu.prototype.addOption=function(optionText,optionValue,colorClass){
    var optionItem=$('<a href="#" class="w3-bar-item w3-button">'+optionText+'</a>')
    if(colorClass) optionItem.addClass(colorClass)
    this.optionContentDOM.append(optionItem)
    optionItem.data("optionValue",optionValue||optionText)
    optionItem.data("optionColorClass",colorClass)
    optionItem.on('click',(e)=>{
        this.curSelectVal=optionItem.data("optionValue")
        if(this.isClickable){
            this.optionContentDOM.removeClass("w3-show")
        }else{
            this.DOM.removeClass('w3-dropdown-hover')
            this.DOM.addClass('w3-dropdown-click')
            setTimeout(() => { //this is to hide the drop down menu after click
                this.DOM.addClass('w3-dropdown-hover')
                this.DOM.removeClass('w3-dropdown-click')
            }, 100);
        }
        this.callBack_clickOption(optionText,optionItem.data("optionValue"),"realMouseClick",optionItem.data("optionColorClass"))
        return false
    })
}

simpleSelectMenu.prototype.changeName=function(nameStr1,nameStr2){
    this.button.children(":first").text(nameStr1)
    this.button.children().eq(1).text(nameStr2)
}

simpleSelectMenu.prototype.triggerOptionIndex=function(optionIndex){
    var theOption=this.optionContentDOM.children().eq(optionIndex)
    if(theOption.length==0) {
        this.curSelectVal=null;
        this.callBack_clickOption(null,null)
        return;
    }
    this.curSelectVal=theOption.data("optionValue")
    this.callBack_clickOption(theOption.text(),theOption.data("optionValue"),null,theOption.data("optionColorClass"))
}

simpleSelectMenu.prototype.triggerOptionValue=function(optionValue){
    var re=this.findOption(optionValue)
    if(re==null){
        this.curSelectVal=null
        this.callBack_clickOption(null,null)
    }else{
        this.curSelectVal=re.value
        this.callBack_clickOption(re.text,re.value,null,re.colorClass)
    }
}


simpleSelectMenu.prototype.clearOptions=function(optionText,optionValue){
    this.optionContentDOM.empty()
    this.curSelectVal=null;
}

simpleSelectMenu.prototype.callBack_clickOption=function(optiontext,optionValue,realMouseClick){
}

simpleSelectMenu.prototype.callBack_beforeClickExpand=function(optiontext,optionValue,realMouseClick){
}


module.exports = simpleSelectMenu;
},{}],22:[function(require,module,exports){
'use strict';

function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}

    this.lastClickedNode=null;
}

simpleTree.prototype.scrollToLeafNode=function(aNode){
    var scrollTop=this.DOM.scrollTop()
    var treeHeight=this.DOM.height()
    var nodePosition=aNode.DOM.position().top //which does not consider parent DOM's scroll height
    //console.log(scrollTop,treeHeight,nodePosition)
    if(treeHeight-50<nodePosition){
        this.DOM.scrollTop(scrollTop + nodePosition-(treeHeight-50)) 
    }else if(nodePosition<50){
        this.DOM.scrollTop(scrollTop + (nodePosition-50)) 
    }
}

simpleTree.prototype.clearAllLeafNodes=function(){
    this.lastClickedNode=null
    this.groupNodes.forEach((gNode)=>{
        gNode.listDOM.empty()
        gNode.childLeafNodes.length=0
        gNode.refreshName()
    })
}

simpleTree.prototype.firstLeafNode=function(){
    if(this.groupNodes.length==0) return null;
    var firstLeafNode=null;
    this.groupNodes.forEach(aGroupNode=>{
        if(firstLeafNode!=null) return;
        if(aGroupNode.childLeafNodes.length>0) firstLeafNode=aGroupNode.childLeafNodes[0]
    })

    return firstLeafNode
}

simpleTree.prototype.nextGroupNode=function(aGroupNode){
    if(aGroupNode==null) return;
    var index=this.groupNodes.indexOf(aGroupNode)
    if(this.groupNodes.length-1>index){
        return this.groupNodes[index+1]
    }else{ //rotate backward to first group node
        return this.groupNodes[0] 
    }
}

simpleTree.prototype.nextLeafNode=function(aLeafNode){
    if(aLeafNode==null) return;
    var aGroupNode=aLeafNode.parentGroupNode
    var index=aGroupNode.childLeafNodes.indexOf(aLeafNode)
    if(aGroupNode.childLeafNodes.length-1>index){
        //next node is in same group
        return aGroupNode.childLeafNodes[index+1]
    }else{
        //find next group first node
        while(true){
            var nextGroupNode = this.nextGroupNode(aGroupNode)
            if(nextGroupNode.childLeafNodes.length==0){
                aGroupNode=nextGroupNode
            }else{
                return nextGroupNode.childLeafNodes[0]
            }
        }
    }
}

simpleTree.prototype.searchText=function(str){
    if(str=="") return null;
    //search from current select item the next leaf item contains the text
    var regex = new RegExp(str, 'i');
    var startNode
    if(this.selectedNodes.length==0) {
        startNode=this.firstLeafNode()
        if(startNode==null) return;
        var theStr=startNode.name;
        if(theStr.match(regex)!=null){
            //find target node 
            return startNode
        }
    }else startNode=this.selectedNodes[0]

    if(startNode==null) return null;
    
    var fromNode=startNode;
    while(true){
        var nextNode=this.nextLeafNode(fromNode)
        if(nextNode==startNode) return null;
        var nextNodeStr=nextNode.name;
        if(nextNodeStr.match(regex)!=null){
            //find target node
            return nextNode
        }else{
            fromNode=nextNode;
        }
    }    
}

simpleTree.prototype.getAllLeafNodeArr=function(){
    var allLeaf=[]
    this.groupNodes.forEach(gn=>{
        allLeaf=allLeaf.concat(gn.childLeafNodes)
    })
    return allLeaf;
}


simpleTree.prototype.addLeafnodeToGroup=function(groupName,obj,skipRepeat){
    var aGroupNode=this.findGroupNode(groupName)
    if(aGroupNode == null) return;
    aGroupNode.addNode(obj,skipRepeat)
}

simpleTree.prototype.removeAllNodes=function(){
    this.lastClickedNode=null
    this.groupNodes.length=0;
    this.selectedNodes.length=0;
    this.DOM.empty()
}

simpleTree.prototype.findGroupNode=function(groupName){
    var foundGroupNode=null
    this.groupNodes.forEach(aGroupNode=>{
        if(aGroupNode.name==groupName){
            foundGroupNode=aGroupNode
            return;
        }
    })
    return foundGroupNode;
}

simpleTree.prototype.delGroupNode=function(gnode){
    this.lastClickedNode=null
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    this.lastClickedNode=null
    var findLeafNode=null
    this.groupNodes.forEach((gNode)=>{
        if(findLeafNode!=null) return;
        gNode.childLeafNodes.forEach((aLeaf)=>{
            if(aLeaf.name==nodeName){
                findLeafNode=aLeaf
                return;
            }
        })
    })
    if(findLeafNode==null) return;
    findLeafNode.deleteSelf()
}


simpleTree.prototype.insertGroupNode=function(obj,index){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return;
    this.groupNodes.splice(index, 0, aNewGroupNode);

    if(index==0){
        this.DOM.append(aNewGroupNode.headerDOM)
        this.DOM.append(aNewGroupNode.listDOM)
    }else{
        var prevGroupNode=this.groupNodes[index-1]
        aNewGroupNode.headerDOM.insertAfter(prevGroupNode.listDOM)
        aNewGroupNode.listDOM.insertAfter(aNewGroupNode.headerDOM)
    }

    return aNewGroupNode;
}

simpleTree.prototype.addGroupNode=function(obj){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return existGroupNode;
    this.groupNodes.push(aNewGroupNode);
    this.DOM.append(aNewGroupNode.headerDOM)
    this.DOM.append(aNewGroupNode.listDOM)
    return aNewGroupNode;
}

simpleTree.prototype.selectLeafNode=function(leafNode,mouseClickDetail){
    this.selectLeafNodeArr([leafNode],mouseClickDetail)
}
simpleTree.prototype.appendLeafNodeToSelection=function(leafNode){
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.addNodeArrayToSelection=function(arr){
    var newArr = this.selectedNodes
    var filterArr=arr.filter((item) => newArr.indexOf(item) < 0)
    newArr = newArr.concat(filterArr)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.selectGroupNode=function(groupNode){
    if(this.callback_afterSelectGroupNode) this.callback_afterSelectGroupNode(groupNode.info)
}

simpleTree.prototype.selectLeafNodeArr=function(leafNodeArr,mouseClickDetail){
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].dim()
    }
    this.selectedNodes.length=0;
    this.selectedNodes=this.selectedNodes.concat(leafNodeArr)
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].highlight()
    }

    if(this.callback_afterSelectNodes) this.callback_afterSelectNodes(this.selectedNodes,mouseClickDetail)
}

simpleTree.prototype.dblClickNode=function(theNode){
    if(this.callback_afterDblclickNode) this.callback_afterDblclickNode(theNode)
}

simpleTree.prototype.sortAllLeaves=function(){
    this.groupNodes.forEach(oneGroupNode=>{oneGroupNode.sortNodesByName()})
}

//----------------------------------tree group node---------------
function simpleTreeGroupNode(parentTree,obj){
    this.parentTree=parentTree
    this.info=obj
    this.childLeafNodes=[] //it's child leaf nodes array
    this.name=obj.displayName;
    this.createDOM()
}

simpleTreeGroupNode.prototype.refreshName=function(){
    this.headerDOM.empty()
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="w3-lime"
    else var lblColor="w3-gray" 
    this.headerDOM.css("font-weight","bold")

    
    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        if(iconLabel){
            this.headerDOM.append(iconLabel)
            var rowHeight=iconLabel.height()
            nameDiv.css("line-height",rowHeight+"px")    
        }
    }
    
    var numberlabel=$("<label class='"+lblColor+"' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel)


    if(this.parentTree.options.groupNodeTailButtonFunc){
        var tailButton=this.parentTree.options.groupNodeTailButtonFunc(this)
        this.headerDOM.append(tailButton)
    }

    this.checkOptionHideEmptyGroup()

}
simpleTreeGroupNode.prototype.checkOptionHideEmptyGroup=function(){
    if (this.parentTree.options.hideEmptyGroup && this.childLeafNodes.length == 0) {
        this.shrink()
        this.headerDOM.hide()
        if (this.listDOM) this.listDOM.hide()
    } else {
        this.headerDOM.show()
        if (this.listDOM) this.listDOM.show()
    }

}
simpleTreeGroupNode.prototype.deleteSelf = function () {
    this.headerDOM.remove()
    this.listDOM.remove()
    var parentArr = this.parentTree.groupNodes
    const index = parentArr.indexOf(this);
    if (index > -1) parentArr.splice(index, 1);
}

simpleTreeGroupNode.prototype.createDOM=function(){
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom" style="position:relative"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border" style="padding:8px"></div>')

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.listDOM.removeClass("w3-show")
        else this.listDOM.addClass("w3-show")

        this.parentTree.selectGroupNode(this)    
        return false;
    });
}

simpleTreeGroupNode.prototype.isOpen=function(){
    return  this.listDOM.hasClass("w3-show")
}


simpleTreeGroupNode.prototype.expand=function(){
    if(this.listDOM) this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    if(this.listDOM) this.listDOM.removeClass("w3-show")
}

simpleTreeGroupNode.prototype.sortNodesByName=function(){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"
    this.childLeafNodes.sort(function (a, b) { 
        var aName=a.name.toLowerCase()
        var bName=b.name.toLowerCase()
        return aName.localeCompare(bName) 
    });
    //this.listDOM.empty() //NOTE: Can not delete those leaf node otherwise the event handle is lost
    this.childLeafNodes.forEach(oneLeaf=>{this.listDOM.append(oneLeaf.DOM)})
}

simpleTreeGroupNode.prototype.addNode=function(obj,skipRepeat){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"

    if(skipRepeat){
        var foundRepeat=false;
        this.childLeafNodes.forEach(aNode=>{
            if(aNode.name==obj[leafNameProperty]) {
                foundRepeat=true
                return;
            }
        })
        if(foundRepeat) return;
    }

    var aNewNode = new simpleTreeLeafNode(this,obj)
    this.childLeafNodes.push(aNewNode)
    this.refreshName()
    this.listDOM.append(aNewNode.DOM)
}

//----------------------------------tree leaf node------------------
function simpleTreeLeafNode(parentGroupNode,obj){
    this.parentGroupNode=parentGroupNode
    this.leafInfo=obj;

    var treeOptions=this.parentGroupNode.parentTree.options
    if(treeOptions.leafNameProperty) this.name=this.leafInfo[treeOptions.leafNameProperty]
    else this.name=this.leafInfo["$dtId"]

    this.createLeafNodeDOM()
}

simpleTreeLeafNode.prototype.deleteSelf = function () {
    this.DOM.remove()
    var gNode = this.parentGroupNode
    const index = gNode.childLeafNodes.indexOf(this);
    if (index > -1) gNode.childLeafNodes.splice(index, 1);
    gNode.refreshName()
}

simpleTreeLeafNode.prototype.clickSelf=function(mouseClickDetail){
    this.parentGroupNode.parentTree.lastClickedNode=this;
    this.parentGroupNode.parentTree.selectLeafNode(this,mouseClickDetail)
}

simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%"></button>')
    this.redrawLabel()


    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
            this.parentGroupNode.parentTree.lastClickedNode=this;
        }else if(e.shiftKey){
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            if(this.parentGroupNode.parentTree.lastClickedNode==null){
                this.clickSelf()
            }else{
                var allLeafNodeArr=this.parentGroupNode.parentTree.getAllLeafNodeArr()
                var index1 = allLeafNodeArr.indexOf(this.parentGroupNode.parentTree.lastClickedNode)
                var index2 = allLeafNodeArr.indexOf(this)
                if(index1==-1 || index2==-1){
                    this.clickSelf()
                }else{
                    //select all leaf between
                    var lowerI= Math.min(index1,index2)
                    var higherI= Math.max(index1,index2)
                    
                    var middleArr=allLeafNodeArr.slice(lowerI,higherI)                  
                    middleArr.push(allLeafNodeArr[higherI])
                    this.parentGroupNode.parentTree.addNodeArrayToSelection(middleArr)
                }
            }
        }else{
            this.clickSelf(clickDetail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}

simpleTreeLeafNode.prototype.redrawLabel=function(){
    this.DOM.empty()

    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)

    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    
    this.DOM.append(nameDiv)
}
simpleTreeLeafNode.prototype.highlight=function(){
    this.DOM.addClass("w3-orange")
    this.DOM.addClass("w3-hover-amber")
    this.DOM.removeClass("w3-white")
}
simpleTreeLeafNode.prototype.dim=function(){
    this.DOM.removeClass("w3-orange")
    this.DOM.removeClass("w3-hover-amber")
    this.DOM.addClass("w3-white")
}


module.exports = simpleTree;
},{}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vQXBwRGF0YS9Sb2FtaW5nL25wbS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9pbmZvUGFuZWwuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zdGFydFNlbGVjdGlvbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvdG9wb2xvZ3lET00uanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3R3aW5zVHJlZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZ2xvYmFsQXBwU2V0dGluZ3MuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL2VkaXRQcm9qZWN0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplci5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kZWxFZGl0b3JEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9uZXdUd2luRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51LmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVUcmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDanZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqc0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsOEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDem5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0geyBfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5idWZmZXJcbiAgfVxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdvZmZzZXQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBsZW5ndGggKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICE9IG51bGwgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbkJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbkJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgfVxuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgfVxuXG4gIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWUgJiZcbiAgICBiICE9PSBCdWZmZXIucHJvdG90eXBlIC8vIHNvIEJ1ZmZlci5pc0J1ZmZlcihCdWZmZXIucHJvdG90eXBlKSB3aWxsIGJlIGZhbHNlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoaXNJbnN0YW5jZShhLCBVaW50OEFycmF5KSkgYSA9IEJ1ZmZlci5mcm9tKGEsIGEub2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gIGlmIChpc0luc3RhbmNlKGIsIFVpbnQ4QXJyYXkpKSBiID0gQnVmZmVyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwiYnVmMVwiLCBcImJ1ZjJcIiBhcmd1bWVudHMgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheSdcbiAgICApXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoaXNJbnN0YW5jZShidWYsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICBidWYgPSBCdWZmZXIuZnJvbShidWYpXG4gICAgfVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IGlzSW5zdGFuY2Uoc3RyaW5nLCBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2Ygc3RyaW5nXG4gICAgKVxuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIG11c3RNYXRjaCA9IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gPT09IHRydWUpXG4gIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkge1xuICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIH1cbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBGaW5hbGx5LCBzZWFyY2ggZWl0aGVyIGluZGV4T2YgKGlmIGRpciBpcyB0cnVlKSBvciBsYXN0SW5kZXhPZlxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMHhGRiAvLyBTZWFyY2ggZm9yIGEgYnl0ZSB2YWx1ZSBbMC0yNTVdXG4gICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXIgb3IgVWludDhBcnJheSBvYmplY3RzIGZyb20gb3RoZXIgY29udGV4dHMgKGkuZS4gaWZyYW1lcykgZG8gbm90IHBhc3Ncbi8vIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2sgYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgb2YgdGhhdCB0eXBlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTY2XG5mdW5jdGlvbiBpc0luc3RhbmNlIChvYmosIHR5cGUpIHtcbiAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHR5cGUgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT0gbnVsbCAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZSlcbn1cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgLy8gRm9yIElFMTEgc3VwcG9ydFxuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIi8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcbmNvbnN0IHR3aW5zVHJlZT1yZXF1aXJlKFwiLi90d2luc1RyZWVcIilcclxuY29uc3Qgc3RhcnRTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9zdGFydFNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIik7XHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzLmpzXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IG5ld1R3aW5EaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL25ld1R3aW5EaWFsb2dcIik7XHJcblxyXG5mdW5jdGlvbiBkaWdpdGFsdHdpbm1vZHVsZVVJKCkge1xyXG4gICAgdGhpcy5pbml0VUlMYXlvdXQoKVxyXG5cclxuICAgIHRoaXMudHdpbnNUcmVlPSBuZXcgdHdpbnNUcmVlKCQoXCIjdHJlZUhvbGRlclwiKSwkKFwiI3RyZWVTZWFyY2hcIikpXHJcbiAgICBcclxuICAgIG1haW5Ub29sYmFyLnJlbmRlcigpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2U9bmV3IHRvcG9sb2d5RE9NKCQoJyNjYW52YXMnKSlcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuXHJcbiAgICAvL3RyeSBpZiBpdCBhbHJlYWR5IEIyQyBzaWduZWQgaW4sIGlmIG5vdCBnb2luZyBiYWNrIHRvIHRoZSBzdGFydCBwYWdlXHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG5cclxuXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpO1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbCAmJiAhZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3QpIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuXHJcbiAgICB0aGlzLmluaXREYXRhKClcclxufVxyXG5cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXREYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsc3RhcnRTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIG1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSxpbmZvUGFuZWwsbmV3VHdpbkRpYWxvZ11cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGRpZ2l0YWx0d2lubW9kdWxlVUkoKTsiLCJjb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIGVkaXRMYXlvdXREaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnJlZmlsbE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICBcclxuICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIE5ldyBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighalF1ZXJ5LmlzRW1wdHlPYmplY3QoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikpe1xyXG4gICAgICAgIHZhciBsYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1wYWRkaW5nLTE2XCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4tIE9SIC08L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChsYmwpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsd2lkdGg6XCIxMjBweFwifSlcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPXN3aXRjaExheW91dFNlbGVjdG9yXHJcbiAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBpZihvcHRpb25UZXh0PT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCIgXCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB2YXIgc2F2ZUFzQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6NXB4XCI+U2F2ZSBBczwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHhcIj5EZWxldGUgTGF5b3V0PC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzQnRuLHN3aXRjaExheW91dFNlbGVjdG9yLkRPTSxkZWxldGVCdG4pXHJcbiAgICAgICAgc2F2ZUFzQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG5cclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5zYXZlSW50b0xheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNhdmVMYXlvdXRcIiwgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWV9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIkNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVMYXlvdXRcIiwgXCJQT1NUXCIsIHsgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpe1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9YXJyO1xyXG4gICAgICAgIGlmKGFyci5sZW5ndGg9PTEpe1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9pbnN0ZWFkIG9mIGRyYXcgdGhlICRkdElkLCBkcmF3IGRpc3BsYXkgbmFtZSBpbnN0ZWFkXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJuYW1lXCI6c2luZ2xlRWxlbWVudEluZm9bXCJkaXNwbGF5TmFtZVwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2luc3RlYWQgb2YgZHJhd2luZyB0aGUgb3JpZ2luYWwgaW5mb21yYXRpb24sIGRyYXcgbW9yZSBtZWFuaW5nZnVsIG9uZVxyXG4gICAgICAgICAgICAgICAgLy90aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJNb2RlbFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PSBcIiRtb2RlbFwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wT2JqPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wT2JqW2luZF09c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sdG1wT2JqLFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRnJvbVwiOmdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1dLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiVG9cIjpnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdXSxcclxuICAgICAgICAgICAgICAgICAgICBcIlJlbGF0aW9uc2hpcCBUeXBlXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmo9e31cclxuICAgICAgICAgICAgICAgICAgICB0bXBPYmpbaW5kXT1zaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXVtpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx0bXBPYmosXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYoYXJyLmxlbmd0aD4xKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QnV0dG9ucz1mdW5jdGlvbihzZWxlY3RUeXBlKXtcclxuICAgIHZhciBpbXBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy1jaXJjbGUtby1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0VHdpbnNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgaWYoc2VsZWN0VHlwZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmEgZmEtYXJyb3ctY2lyY2xlLW8tdXBcIj48L2k+PC9idXR0b24+JykgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5Jz5DaG9vc2UgdHdpbnMgb3IgcmVsYXRpb25zaGlwcyB0byB2aWV3IGluZm9tcmF0aW9uPC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3Mgc2hpZnQga2V5IHRvIHNlbGVjdCBtdWx0aXBsZSBpbiB0b3BvbG9neSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweDtwYWRkaW5nLWJvdHRvbToyMHB4Jz5QcmVzcyBjdHJsIG9yIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdHJlZSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweDtwYWRkaW5nLWJvdHRvbTo1cHgnPkltcG9ydCB0d2lucyBkYXRhIGJ5IGNsaWNraW5nIGJ1dHRvbiBiZWxvdzwvYT5cIilcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaW1wQnRuLGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbXBCdG4ub24oXCJjbGlja1wiLCgpPT57YWN0dWFsSW1wb3J0VHdpbnNCdG4udHJpZ2dlcignY2xpY2snKTt9KVxyXG4gICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgaWYoc2VsZWN0VHlwZT09bnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlUmVsYXRpb25zaGlwXCIpe1xyXG4gICAgICAgIHZhciBkZWxCdG4gPSAgJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4pXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlU2VsZWN0ZWQoKX0pXHJcbiAgICB9ZWxzZSBpZihzZWxlY3RUeXBlPT1cInNpbmdsZU5vZGVcIiB8fCBzZWxlY3RUeXBlPT1cIm11bHRpcGxlXCIpe1xyXG4gICAgICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RUb0J0biA9JCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiICBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IHRvPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdEZyb21CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCBmcm9tPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd0luYm91bmRCdG4gPSAkKCc8YnV0dG9uICBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4sIGNvbm5lY3RUb0J0bixjb25uZWN0RnJvbUJ0biAsIHNob3dJbmJvdW5kQnRuLCBzaG93T3V0Qm91bmRCdG4pXHJcbiAgICBcclxuICAgICAgICBzaG93T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93T3V0Qm91bmQoKX0pXHJcbiAgICAgICAgc2hvd0luYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93SW5Cb3VuZCgpfSkgIFxyXG4gICAgICAgIGNvbm5lY3RUb0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0VG9cIn0pIH0pXHJcbiAgICAgICAgY29ubmVjdEZyb21CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdEZyb21cIn0pIH0pXHJcblxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJGR0SWQnXSkgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgaWYobnVtT2ZOb2RlPjApe1xyXG4gICAgICAgIHZhciBzZWxlY3RJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzZWxlY3RPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvc2VMYXlvdXRCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q09TRSBWaWV3PC9idXR0b24+JylcclxuICAgICAgICB2YXIgaGlkZUJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5IaWRlPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2VsZWN0SW5ib3VuZEJ0biwgc2VsZWN0T3V0Qm91bmRCdG4sY29zZUxheW91dEJ0bixoaWRlQnRuKVxyXG5cclxuICAgICAgICBzZWxlY3RJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0SW5ib3VuZFwifSl9KVxyXG4gICAgICAgIHNlbGVjdE91dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0T3V0Ym91bmRcIn0pfSlcclxuICAgICAgICBjb3NlTGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiQ09TRVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgICAgICBoaWRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiaGlkZVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5leHBvcnRTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luVG9CZVN0b3JlZD1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICB2YXIgYW5FeHBUd2luPXt9XHJcbiAgICAgICAgYW5FeHBUd2luW1wiJG1ldGFkYXRhXCJdPXtcIiRtb2RlbFwiOmVsZW1lbnRbXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl19XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZWxlbWVudCl7XHJcbiAgICAgICAgICAgIGlmKGluZD09XCIkbWV0YWRhdGFcIiB8fCBpbmQ9PVwiJGV0YWdcIikgY29udGludWUgXHJcbiAgICAgICAgICAgIGVsc2UgYW5FeHBUd2luW2luZF09ZWxlbWVudFtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHR3aW5Ub0JlU3RvcmVkLnB1c2goYW5FeHBUd2luKVxyXG4gICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgfSk7XHJcbiAgICB2YXIgcmVsYXRpb25zVG9CZVN0b3JlZD1bXVxyXG4gICAgdHdpbklEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICBpZighcmVsYXRpb25zKSByZXR1cm47XHJcbiAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgIGlmKHR3aW5JRHNbdGFyZ2V0SURdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqPXt9XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZWxhdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoaW5kID09XCIkZXRhZ1wifHxpbmQgPT1cIiRyZWxhdGlvbnNoaXBJZFwifHxpbmQgPT1cIiRzb3VyY2VJZFwifHxpbmQgPT1cInNvdXJjZU1vZGVsXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2luZF09b25lUmVsYXRpb25baW5kXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG9uZUFjdGlvbj17XCIkc3JjSWRcIjpvbmVJRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOm9uZVJlbGF0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib2JqXCI6b2JqfVxyXG4gICAgICAgICAgICAgICAgcmVsYXRpb25zVG9CZVN0b3JlZC5wdXNoKG9uZUFjdGlvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIGZpbmFsSlNPTj17XCJ0d2luc1wiOnR3aW5Ub0JlU3RvcmVkLFwicmVsYXRpb25zXCI6cmVsYXRpb25zVG9CZVN0b3JlZH1cclxuICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShmaW5hbEpTT04pKSk7XHJcbiAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydFR3aW5zRGF0YS5qc29uXCIpO1xyXG4gICAgcG9tWzBdLmNsaWNrKClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIHZhciBpbXBvcnRUd2lucz1bXVxyXG4gICAgdmFyIGltcG9ydFJlbGF0aW9ucz1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihvYmoudHdpbnMpIGltcG9ydFR3aW5zPWltcG9ydFR3aW5zLmNvbmNhdChvYmoudHdpbnMpXHJcbiAgICAgICAgICAgIGlmKG9iai5yZWxhdGlvbnMpIGltcG9ydFJlbGF0aW9ucz1pbXBvcnRSZWxhdGlvbnMuY29uY2F0KG9iai5yZWxhdGlvbnMpXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdmFyIG9sZFR3aW5JRDJOZXdJRD17fVxyXG4gICAgaW1wb3J0VHdpbnMuZm9yRWFjaChvbmVUd2luPT57XHJcbiAgICAgICAgdmFyIG9sZElEPSBvbmVUd2luW1wiJGR0SWRcIl1cclxuICAgICAgICB2YXIgbmV3SUQ9dXVpZHY0KCk7XHJcbiAgICAgICAgb2xkVHdpbklEMk5ld0lEW29sZElEXT1uZXdJRFxyXG4gICAgICAgIG9uZVR3aW5bXCIkZHRJZFwiXT1uZXdJRFxyXG4gICAgfSlcclxuXHJcbiAgICBmb3IodmFyIGk9aW1wb3J0UmVsYXRpb25zLmxlbmd0aC0xO2k+PTA7aS0tKXtcclxuICAgICAgICB2YXIgb25lUmVsPWltcG9ydFJlbGF0aW9uc1tpXVxyXG4gICAgICAgIGlmKG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dPT1udWxsIHx8IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dPT1udWxsKXtcclxuICAgICAgICAgICAgaW1wb3J0UmVsYXRpb25zLnNwbGljZShpLDEpXHJcbiAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICBvbmVSZWxbXCIkc3JjSWRcIl09b2xkVHdpbklEMk5ld0lEW29uZVJlbFtcIiRzcmNJZFwiXV1cclxuICAgICAgICAgICAgb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdPW9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dXHJcbiAgICAgICAgICAgIG9uZVJlbFtcIiRyZWxhdGlvbnNoaXBJZFwiXT11dWlkdjQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9iYXRjaEltcG9ydFR3aW5zXCIsIFwiUE9TVFwiLCB7XCJ0d2luc1wiOkpTT04uc3RyaW5naWZ5KGltcG9ydFR3aW5zKX0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlLkRCVHdpbnM9SlNPTi5wYXJzZShyZS5EQlR3aW5zKVxyXG4gICAgcmUuQURUVHdpbnM9SlNPTi5wYXJzZShyZS5BRFRUd2lucylcclxuICAgIHJlLkRCVHdpbnMuZm9yRWFjaChEQlR3aW49PnsgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4oREJUd2luKSB9KVxyXG4gICAgdmFyIGFkdFR3aW5zPVtdXHJcbiAgICByZS5BRFRUd2lucy5mb3JFYWNoKEFEVFR3aW49PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oQURUVHdpbilcclxuICAgICAgICBhZHRUd2lucy5wdXNoKEFEVFR3aW4pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5zXCIsIFwidHdpbnNJbmZvXCI6IGFkdFR3aW5zIH0pXHJcblxyXG4gICAgLy9jb250aW51ZSB0byBpbXBvcnQgcmVsYXRpb25zXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0ltcG9ydGVkID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY3JlYXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCAge2FjdGlvbnM6SlNPTi5zdHJpbmdpZnkoaW1wb3J0UmVsYXRpb25zKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChyZWxhdGlvbnNJbXBvcnRlZClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIixpbmZvOnJlbGF0aW9uc0ltcG9ydGVkfSlcclxuXHJcbiAgICB2YXIgbnVtT2ZUd2lucz1hZHRUd2lucy5sZW5ndGhcclxuICAgIHZhciBudW1PZlJlbGF0aW9ucz1yZWxhdGlvbnNJbXBvcnRlZC5sZW5ndGhcclxuICAgIHZhciBzdHI9XCJBZGQgXCIrbnVtT2ZUd2lucysgXCIgbm9kZVwiKygobnVtT2ZUd2luczw9MSk/XCJcIjpcInNcIikrYCAoZnJvbSAke2ltcG9ydFR3aW5zLmxlbmd0aH0pYFxyXG4gICAgc3RyKz1cIiBhbmQgXCIrbnVtT2ZSZWxhdGlvbnMrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZlJlbGF0aW9uczw9MSk/XCJcIjpcInNcIikrYCAoZnJvbSAke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDAwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSW1wb3J0IFJlc3VsdFwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpzdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWZyZXNoSW5mb21hdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHR3aW5JRHM9W11cclxuICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzLmZvckVhY2gob25lSXRlbT0+eyAgaWYob25lSXRlbVsnJGR0SWQnXSkgdHdpbklEcy5wdXNoKG9uZUl0ZW1bJyRkdElkJ10pICB9KVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgdHdpbnNkYXRhLmZvckVhY2gob25lUmU9PntcclxuICAgICAgICAgICAgdmFyIHR3aW5JRD0gb25lUmVbJyRkdElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZSkgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVSZVtpbmRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSh0d2luSURzLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JRHMuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vcmVkcmF3IGluZm9wYW5lbCBpZiBuZWVkZWRcclxuICAgIGlmKHRoaXMuc2VsZWN0ZWRPYmplY3RzLmxlbmd0aD09MSkgdGhpcy5yeE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHJlbGF0aW9uc0Fycj1bXVxyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmVsYXRpb25zQXJyLnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBmb3IodmFyIGk9cmVsYXRpb25zQXJyLmxlbmd0aC0xO2k+PTA7aS0tKXsgLy9jbGVhciB0aG9zZSByZWxhdGlvbnNoaXBzIHRoYXQgYXJlIGdvaW5nIHRvIGJlIGRlbGV0ZWQgYWZ0ZXIgdHdpbnMgZGVsZXRpbmdcclxuICAgICAgICB2YXIgc3JjSWQ9ICByZWxhdGlvbnNBcnJbaV1bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdmFyIHRhcmdldElkID0gcmVsYXRpb25zQXJyW2ldWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHR3aW5JRHNbc3JjSWRdIT1udWxsIHx8IHR3aW5JRHNbdGFyZ2V0SWRdIT1udWxsKXtcclxuICAgICAgICAgICAgcmVsYXRpb25zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgZGlhbG9nU3RyPVwiXCJcclxuICAgIHZhciB0d2luTnVtYmVyPXR3aW5JREFyci5sZW5ndGg7XHJcbiAgICB2YXIgcmVsYXRpb25zTnVtYmVyID0gcmVsYXRpb25zQXJyLmxlbmd0aDtcclxuICAgIGlmKHR3aW5OdW1iZXI+MCkgZGlhbG9nU3RyID0gIHR3aW5OdW1iZXIrXCIgdHdpblwiKygodHdpbk51bWJlcj4xKT9cInNcIjpcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgIGlmKHR3aW5OdW1iZXI+MCAmJiByZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyKz1cIiBhbmQgYWRkaXRpb25hbCBcIlxyXG4gICAgaWYocmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0ciArPSAgcmVsYXRpb25zTnVtYmVyK1wiIHJlbGF0aW9uXCIrKChyZWxhdGlvbnNOdW1iZXI+MSk/XCJzXCI6XCJcIiApXHJcbiAgICBkaWFsb2dTdHIrPVwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgYXdhaXQgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHdpbklEQXJyLmxlbmd0aCA+IDApIGF3YWl0IHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB2YXIgaW9URGV2aWNlcz1bXVxyXG4gICAgdHdpbklEQXJyLmZvckVhY2gob25lVHdpbklEPT57XHJcbiAgICAgICAgdmFyIGRiVHdpbkluZm89Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlJRChvbmVUd2luSUQpXHJcbiAgICAgICAgaWYoZGJUd2luSW5mby5Jb1REZXZpY2VJRCE9bnVsbCAmJiBkYlR3aW5JbmZvLklvVERldmljZUlEIT1cIlwiKXtcclxuICAgICAgICAgICAgaW9URGV2aWNlcy5wdXNoKGRiVHdpbkluZm8uSW9URGV2aWNlSUQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIGlmKGlvVERldmljZXMubGVuZ3RoPjApe1xyXG4gICAgICAgIG1zYWxIZWxwZXIuY2FsbEFQSShcImRldmljZW1hbmFnZW1lbnQvdW5yZWdpc3RlcklvVERldmljZXNcIiwgXCJQT1NUXCIsIHthcnI6aW9URGV2aWNlc30pXHJcbiAgICB9XHJcbiAgICBcclxuXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVR3aW5zXCIsIFwiUE9TVFwiLCB7YXJyOnNtYWxsQXJyfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2goKG9uZUlEKT0+e1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInR3aW5zRGVsZXRlZFwiLHR3aW5JREFycjpyZXN1bHR9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zQXJyKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIHJlbGF0aW9uc0Fyci5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgYXJyLnB1c2goe3NyY0lEOm9uZVJlbGF0aW9uWyckc291cmNlSWQnXSxyZWxJRDpvbmVSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwge1wicmVsYXRpb25zXCI6YXJyfSlcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZShkYXRhKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlbGF0aW9uc0RlbGV0ZWRcIixcInJlbGF0aW9uc1wiOmRhdGF9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dPdXRCb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnIgPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcblxyXG4gICAgICAgIHZhciBrbm93blRhcmdldFR3aW5zID0ge31cclxuICAgICAgICBzbWFsbEFyci5mb3JFYWNoKG9uZUlEID0+IHtcclxuICAgICAgICAgICAga25vd25UYXJnZXRUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgdmFyIG91dEJvdW5kUmVsYXRpb24gPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIGlmIChvdXRCb3VuZFJlbGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRCb3VuZFJlbGF0aW9uLmZvckVhY2gob25lUmVsYXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAhPSBudWxsKSBrbm93blRhcmdldFR3aW5zW3RhcmdldElEXSA9IDFcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vcXVlcnlPdXRCb3VuZFwiLCBcIlBPU1RcIiwgIHsgYXJyOiBzbWFsbEFyciwgXCJrbm93blRhcmdldHNcIjoga25vd25UYXJnZXRUd2lucyB9KVxyXG4gICAgICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVUd2luKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93SW5Cb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIga25vd25Tb3VyY2VUd2lucyA9IHt9XHJcbiAgICAgICAgdmFyIElERGljdCA9IHt9XHJcbiAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIElERGljdFtvbmVJRF0gPSAxXHJcbiAgICAgICAgICAgIGtub3duU291cmNlVHdpbnNbb25lSURdID0gMSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmb3IgKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnMgPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXVxyXG4gICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgICAgIHZhciBzcmNJRCA9IG9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgaWYgKElERGljdFt0YXJnZXRJRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0gIT0gbnVsbCkga25vd25Tb3VyY2VUd2luc1tzcmNJRF0gPSAxXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vcXVlcnlJbkJvdW5kXCIsIFwiUE9TVFwiLCAgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duU291cmNlc1wiOiBrbm93blNvdXJjZVR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdNdWx0aXBsZU9iaj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG51bU9mRWRnZSA9IDA7XHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnI9PW51bGwpIHJldHVybjtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgbnVtT2ZFZGdlKytcclxuICAgICAgICBlbHNlIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIHZhciB0ZXh0RGl2PSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDoxMHB4Jz48L2xhYmVsPlwiKVxyXG4gICAgdGV4dERpdi50ZXh0KG51bU9mTm9kZSsgXCIgbm9kZVwiKygobnVtT2ZOb2RlPD0xKT9cIlwiOlwic1wiKStcIiwgXCIrbnVtT2ZFZGdlK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZFZGdlPD0xKT9cIlwiOlwic1wiKSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0ZXh0RGl2KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdTdGF0aWNJbmZvPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxwYWRkaW5nVG9wLGZvbnRTaXplKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1ib3JkZXInIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiNmNmY2ZjY7ZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIGtleURpdi5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJkYXJrR3JheVwifSlcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixwYWRkaW5nVG9wKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhjb250ZW50RE9NLGpzb25JbmZvW2luZF0sXCIuNWVtXCIsZm9udFNpemUpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImJsYWNrXCJ9KVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RWRpdGFibGU9ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IGZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuM2VtXCIpIFxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdwYWRkaW5nLXRvcDouMmVtJz48L2xhYmVsPlwiKVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RHJvcGRvd25PcHRpb249ZnVuY3Rpb24oY29udGVudERPTSxuZXdQYXRoLHZhbHVlQXJyLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIilcclxuICAgIH1cclxuICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICBhU2VsZWN0TWVudS50cmlnZ2VyT3B0aW9uVmFsdWUodmFsKVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5lZGl0RFRQcm9wZXJ0eT1hc3luYyBmdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbCxkYXRhVHlwZSl7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcblxyXG4gICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NoYW5nZUF0dHJpYnV0ZVwiLCBcIlBPU1RcIiwgcGF5TG9hZClcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24obm9kZUluZm8scGF0aEFycixuZXdWYWwpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPW5vZGVJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxuICAgIHJldHVyblxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsImNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1vZHVsZVN3aXRjaERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVG9vbGJhcigpIHtcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYWRkQ2xhc3MoXCJ3My1iYXIgdzMtcmVkXCIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmNzcyh7XCJ6LWluZGV4XCI6MTAwLFwib3ZlcmZsb3dcIjpcInZpc2libGVcIn0pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Qcm9qZWN0PC9hPicpXHJcbiAgICB0aGlzLm1vZGVsSU9CdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPk1vZGVsczwvYT4nKVxyXG4gICAgdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgdGhpcy5zaG93R0lTVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuXHJcbiAgICB0aGlzLnRlc3RTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5UZXN0IFNpZ25hbFI8L2E+JylcclxuICAgIHRoaXMudGVzdFNlbmRTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5zZW5kIFNpZ25hbFIgbWVzc2FnZTwvYT4nKVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1NpZGViYXIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1N3aXRjaEJ1dHRvbiwgdGhpcy5zd2l0Y2hQcm9qZWN0QnRuLHRoaXMubW9kZWxJT0J0bix0aGlzLnNob3dGb3JnZVZpZXdCdG4sdGhpcy5zaG93R0lTVmlld0J0blxyXG4gICAgICAgICx0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLkRPTSx0aGlzLmVkaXRMYXlvdXRCdG4pXHJcbiAgICAgICAgLy8sdGhpcy50ZXN0U2lnbmFsUkJ0bix0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0blxyXG5cclxuICAgIHRoaXMuc3dpdGNoUHJvamVjdEJ0bi5vbihcImNsaWNrXCIsKCk9Pnsgc3RhcnRTZWxlY3Rpb25EaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5tb2RlbElPQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuXHJcblxyXG4gICAgdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG4gICAgICAgIHZhciByZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZShcIm1lc3NhZ2VzXCIsXCJQT1NUXCIse1xyXG4gICAgICAgICAgICByZWNpcGllbnQ6IFwiNWViODFmNWYtZmQ5ZS00ODFkLTk5NmItNGQwYjk1MzZmNDc3XCIsXHJcbiAgICAgICAgICAgIHRleHQ6IFwiaG93IGRvIHlvdSBkb1wiXHJcbiAgICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHRoaXMudGVzdFNpZ25hbFJCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG4gICAgICAgIHZhciBzaWduYWxSSW5mbyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZShcIm5lZ290aWF0ZT9uYW1lPWZmXCIsXCJHRVRcIilcclxuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gbmV3IHNpZ25hbFIuSHViQ29ubmVjdGlvbkJ1aWxkZXIoKVxyXG4gICAgICAgIC53aXRoVXJsKHNpZ25hbFJJbmZvLnVybCwge2FjY2Vzc1Rva2VuRmFjdG9yeTogKCkgPT4gc2lnbmFsUkluZm8uYWNjZXNzVG9rZW59KVxyXG4gICAgICAgIC8vLmNvbmZpZ3VyZUxvZ2dpbmcoc2lnbmFsUi5Mb2dMZXZlbC5JbmZvcm1hdGlvbilcclxuICAgICAgICAuY29uZmlndXJlTG9nZ2luZyhzaWduYWxSLkxvZ0xldmVsLldhcm5pbmcpXHJcbiAgICAgICAgLmJ1aWxkKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coc2lnbmFsUkluZm8uYWNjZXNzVG9rZW4pXHJcblxyXG4gICAgICAgIGNvbm5lY3Rpb24ub24oJ25ld01lc3NhZ2UnLCAobWVzc2FnZSk9PntcclxuICAgICAgICAgICAgY29uc29sZS5sb2cobWVzc2FnZSlcclxuICAgICAgICB9KTtcclxuICAgICAgICBjb25uZWN0aW9uLm9uY2xvc2UoKCkgPT4gY29uc29sZS5sb2coJ2Rpc2Nvbm5lY3RlZCcpKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnY29ubmVjdGluZy4uLicpO1xyXG4gICAgICAgIGNvbm5lY3Rpb24uc3RhcnQoKVxyXG4gICAgICAgICAgLnRoZW4oKCkgPT4gY29uc29sZS5sb2coJ2Nvbm5lY3RlZCEnKSlcclxuICAgICAgICAgIC5jYXRjaChjb25zb2xlLmVycm9yKTtcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9b3B0aW9uVmFsdWVcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRDaGFuZ2VcIn0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PVwiW05BXVwiKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLG9wdGlvblRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS51cGRhdGVMYXlvdXRTZWxlY3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXJTZWxlY3Q9dGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWxcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKCdbTm8gTGF5b3V0IFNwZWNpZmllZF0nLCdbTkFdJylcclxuXHJcbiAgICBmb3IgKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikge1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxuXHJcbiAgICBpZihjdXJTZWxlY3QhPW51bGwgJiYgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5maW5kT3B0aW9uKGN1clNlbGVjdCk9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibGF5b3V0c1VwZGF0ZWRcIikge1xyXG4gICAgICAgIHRoaXMudXBkYXRlTGF5b3V0U2VsZWN0b3IoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVG9vbGJhcigpOyIsImNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBlZGl0UHJvamVjdERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZWRpdFByb2plY3REaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXJcIilcclxuXHJcbmZ1bmN0aW9uIHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjgwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5TZWxlY3QgVHdpbnM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcblxyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIgPSAkKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5idXR0b25Ib2xkZXIpXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwiYXBwZW5kXCIpXHJcbiAgICAgICAgdGhpcy5jbG9zZURpYWxvZygpIFxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgcm93MT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzEpXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O1wiPlByb2plY3QgPC9kaXY+JylcclxuICAgIHJvdzEuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIHN3aXRjaFByb2plY3RTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9fSlcclxuICAgIHRoaXMuc3dpdGNoUHJvamVjdFNlbGVjdG9yPXN3aXRjaFByb2plY3RTZWxlY3RvclxyXG4gICAgcm93MS5hcHBlbmQoc3dpdGNoUHJvamVjdFNlbGVjdG9yLkRPTSlcclxuICAgIHZhciBqb2luZWRQcm9qZWN0cz1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5qb2luZWRQcm9qZWN0c1xyXG4gICAgam9pbmVkUHJvamVjdHMuZm9yRWFjaChhUHJvamVjdD0+e1xyXG4gICAgICAgIHZhciBzdHIgPSBhUHJvamVjdC5uYW1lXHJcbiAgICAgICAgaWYoYVByb2plY3Qub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmFjY291bnRJRCkgc3RyKz1cIiAoZnJvbSBcIithUHJvamVjdC5vd25lcitcIilcIlxyXG4gICAgICAgIHN3aXRjaFByb2plY3RTZWxlY3Rvci5hZGRPcHRpb24oc3RyLGFQcm9qZWN0LmlkKVxyXG4gICAgfSlcclxuICAgIHN3aXRjaFByb2plY3RTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuY2hvb3NlUHJvamVjdChvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmVkaXRQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXQgZmEtbGdcIj48L2k+PC9hPicpXHJcbiAgICB0aGlzLmRlbGV0ZVByb2plY3RCdG49JCgnPGEgY2xhc3M9XCJ3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9hPicpXHJcbiAgICB0aGlzLm5ld1Byb2plY3RCdG49JCgnPGEgY2xhc3M9XCJ3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtcGx1cyBmYS1sZ1wiPjwvaT48L2E+JylcclxuICAgIHJvdzEuYXBwZW5kKHRoaXMuZWRpdFByb2plY3RCdG4sdGhpcy5kZWxldGVQcm9qZWN0QnRuLHRoaXMubmV3UHJvamVjdEJ0bilcclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9NDAwXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDoyNjBweDtwYWRkaW5nLXJpZ2h0OjVweDtvdmVyZmxvdzpoaWRkZW5cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIiBzdHlsZT1cInBhZGRpbmctdG9wOjEwcHg7XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2FyZFwiIHN0eWxlPVwiY29sb3I6Z3JheTtoZWlnaHQ6JysocGFuZWxIZWlnaHQtMTApKydweDtvdmVyZmxvdzphdXRvO3dpZHRoOjM5MHB4O1wiPjwvZGl2PicpKVxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnNET009JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIHNlbGVjdGVkVHdpbnNET00uY3NzKHtcImJvcmRlci1jb2xsYXBzZVwiOlwiY29sbGFwc2VcIn0pXHJcbiAgICByaWdodFNwYW4uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChzZWxlY3RlZFR3aW5zRE9NKVxyXG4gICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NPXNlbGVjdGVkVHdpbnNET00gXHJcblxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkNob29zZSB0d2lucy4uLjxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MTQwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5jaG9vc2UgdHdpbnMgb2Ygb25lIG9yIG1vcmUgbW9kZWxzPC9wPjwvZGl2PjwvZGl2PicpKVxyXG5cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcz0kKCc8Zm9ybSBjbGFzcz1cInczLWNvbnRhaW5lciB3My1ib3JkZXJcIiBzdHlsZT1cImhlaWdodDonKyhwYW5lbEhlaWdodC00MCkrJ3B4O292ZXJmbG93OmF1dG9cIj48L2Zvcm0+JylcclxuICAgIGxlZnRTcGFuLmFwcGVuZCh0aGlzLm1vZGVsc0NoZWNrQm94ZXMpXHJcbiAgICBcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3QhPW51bGwpe1xyXG4gICAgICAgIHN3aXRjaFByb2plY3RTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdClcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHN3aXRjaFByb2plY3RTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmdldFByb2plY3RJbmZvID0gZnVuY3Rpb24gKHByb2plY3RJRCkge1xyXG4gICAgdmFyIGpvaW5lZFByb2plY3RzPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmpvaW5lZFByb2plY3RzXHJcbiAgICBmb3IodmFyIGk9MDtpPGpvaW5lZFByb2plY3RzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhUHJvamVjdD1qb2luZWRQcm9qZWN0c1tpXVxyXG4gICAgICAgIGlmKGFQcm9qZWN0LmlkPT1wcm9qZWN0SUQpIHJldHVybiBhUHJvamVjdFxyXG4gICAgfVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2hvb3NlUHJvamVjdCA9IGFzeW5jIGZ1bmN0aW9uIChzZWxlY3RlZFByb2plY3RJRCkge1xyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIuZW1wdHkoKVxyXG5cclxuICAgIHZhciBwcm9qZWN0SW5mbz10aGlzLmdldFByb2plY3RJbmZvKHNlbGVjdGVkUHJvamVjdElEKVxyXG4gICAgaWYocHJvamVjdEluZm8ub3duZXI9PWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmFjY291bnRJRCl7XHJcbiAgICAgICAgdGhpcy5lZGl0UHJvamVjdEJ0bi5zaG93KClcclxuICAgICAgICB0aGlzLmRlbGV0ZVByb2plY3RCdG4uc2hvdygpXHJcbiAgICAgICAgdGhpcy5lZGl0UHJvamVjdEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHsgZWRpdFByb2plY3REaWFsb2cucG9wdXAocHJvamVjdEluZm8pIH0pXHJcbiAgICAgICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvZGVsZXRlUHJvamVjdFRvXCIsIFwiUE9TVFwiLCB7XCJwcm9qZWN0SURcIjpzZWxlY3RlZFByb2plY3RJRH0pXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5lZGl0UHJvamVjdEJ0bi5oaWRlKClcclxuICAgICAgICB0aGlzLmRlbGV0ZVByb2plY3RCdG4uaGlkZSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLm5ld1Byb2plY3RCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgdmFyIHRzU3RyPShuZXcgRGF0ZSgpLnRvTG9jYWxlU3RyaW5nKCkpIFxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdQcm9qZWN0SW5mbyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L25ld1Byb2plY3RUb1wiLCBcIlBPU1RcIiwgeyBcInByb2plY3ROYW1lXCI6IFwiTmV3IFByb2plY3QgXCIgKyB0c1N0ciB9KVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5hY2NvdW50SW5mby5qb2luZWRQcm9qZWN0cy51bnNoaWZ0KG5ld1Byb2plY3RJbmZvKVxyXG4gICAgICAgICAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgICAgICAgICB2YXIgam9pbmVkUHJvamVjdHMgPSBnbG9iYWxDYWNoZS5hY2NvdW50SW5mby5qb2luZWRQcm9qZWN0c1xyXG4gICAgICAgICAgICBqb2luZWRQcm9qZWN0cy5mb3JFYWNoKGFQcm9qZWN0ID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBzdHIgPSBhUHJvamVjdC5uYW1lXHJcbiAgICAgICAgICAgICAgICBpZihhUHJvamVjdC5vd25lciE9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uYWNjb3VudElEKSBzdHIrPVwiIChmcm9tIFwiK2FQcm9qZWN0Lm93bmVyK1wiKVwiXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvci5hZGRPcHRpb24oc3RyLCBhUHJvamVjdC5pZClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLy9OT1RFOiBtdXN0IHF1ZXJ5IHRoZSBuZXcgam9pbmVkIHByb2plY3RzIEpXVCB0b2tlbiBhZ2FpblxyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLnJlbG9hZFVzZXJBY2NvdW50RGF0YSgpXHJcbiAgICAgICAgICAgIHRoaXMuc3dpdGNoUHJvamVjdFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIFxyXG5cclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3Q9PW51bGwpe1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWhvdmVyLWRlZXAtb3JhbmdlIHczLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlN0YXJ0PC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfWVsc2UgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdCA9PSBzZWxlY3RlZFByb2plY3RJRCl7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGFwcGVuZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BcHBlbmQgRGF0YTwvYnV0dG9uPicpXHJcbiAgICBcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgICAgIGFwcGVuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKSB9KVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uLCBhcHBlbmRCdXR0b24pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCA9IHNlbGVjdGVkUHJvamVjdElEXHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdE1vZGVsc0RhdGFcIiwgXCJQT1NUXCIsIG51bGwsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGEocmVzLkRCTW9kZWxzLCByZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgICAgIHZhciByZXMgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFByb2plY3RUd2luc0FuZFZpc3VhbERhdGFcIiwgXCJQT1NUXCIsIG51bGwsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdFR3aW5zQW5kVmlzdWFsRGF0YShyZXMpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5maWxsQXZhaWxhYmxlTW9kZWxzKClcclxuICAgIHRoaXMubGlzdFR3aW5zKClcclxufVxyXG5cclxuXHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZmlsbEF2YWlsYWJsZU1vZGVscyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJBTExcIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+PGI+QUxMPC9iPjwvbGFiZWw+PHAvPicpXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57XHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZT1vbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b25lTW9kZWxbXCJpZFwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoYDxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCIke21vZGVsSUR9XCI+PGxhYmVsIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweFwiPiR7bW9kZWxOYW1lfTwvbGFiZWw+PHAvPmApXHJcbiAgICB9KVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLm9uKFwiY2hhbmdlXCIsKGV2dCk9PntcclxuICAgICAgICBpZigkKGV2dC50YXJnZXQpLmF0dHIoXCJpZFwiKT09XCJBTExcIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB0aGUgb3RoZXIgaW5wdXRcclxuICAgICAgICAgICAgdmFyIHZhbD0kKGV2dC50YXJnZXQpLnByb3AoXCJjaGVja2VkXCIpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykucHJvcChcImNoZWNrZWRcIix2YWwpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxpc3RUd2lucygpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRUd2lucz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlQXJyPVtdXHJcbiAgICB2YXIgY2hvc2VuTW9kZWxzPXt9XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuY2hpbGRyZW4oJ2lucHV0JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYoISQodGhpcykucHJvcChcImNoZWNrZWRcIikpIHJldHVybjtcclxuICAgICAgICBpZigkKHRoaXMpLmF0dHIoXCJpZFwiKT09XCJBTExcIikgcmV0dXJuO1xyXG4gICAgICAgIGNob3Nlbk1vZGVsc1skKHRoaXMpLmF0dHIoXCJpZFwiKV09MVxyXG4gICAgfSk7XHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlQXJyO1xyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uZW1wdHkoKVxyXG4gICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPlRXSU4gSUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUwgSUQ8L3RkPjwvdHI+JylcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpbltcImRpc3BsYXlOYW1lXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bJ21vZGVsSUQnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RlZFR3aW5zLmxlbmd0aD09MCl7XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKSAgICBcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VTdGFydFNlbGVjdGlvbj1mdW5jdGlvbihhY3Rpb24pe1xyXG4gICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdD1nbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEXHJcbiAgICB2YXIgc2VsZWN0ZWRUd2lucz10aGlzLmdldFNlbGVjdGVkVHdpbnMoKVxyXG4gICAgdmFyIHR3aW5JRHM9W11cclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e3R3aW5JRHMucHVzaChhVHdpbltcImlkXCJdKX0pXHJcblxyXG4gICAgdmFyIG1vZGVsSURzPVtdXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57bW9kZWxJRHMucHVzaChvbmVNb2RlbFtcImlkXCJdKX0pXHJcblxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25fXCIrYWN0aW9uLCBcInR3aW5JRHNcIjogdHdpbklEcyxcIm1vZGVsSURzXCI6bW9kZWxJRHMgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25SZWZyZXNoXCJ9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxuXHJcbiAgICBpZihnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5sZW5ndGg9PTApe1xyXG4gICAgICAgIC8vZGlyZWN0bHkgcG9wdXAgdG8gbW9kZWwgbWFuYWdlbWVudCBkaWFsb2cgYWxsb3cgdXNlciBpbXBvcnQgb3IgY3JlYXRlIG1vZGVsXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKClcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cuRE9NLmhpZGUoKVxyXG4gICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5ET00uZmFkZUluKClcclxuICAgICAgICAvL3BvcCB1cCB3ZWxjb21lIHNjcmVlblxyXG4gICAgICAgIHZhciBwb3BXaW49JCgnPGRpdiBjbGFzcz1cInczLWJsdWUgdzMtY2FyZC00IHczLXBhZGRpbmctbGFyZ2VcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwNTt3aWR0aDo0MDBweDtjdXJzb3I6ZGVmYXVsdFwiPjwvZGl2PicpXHJcbiAgICAgICAgcG9wV2luLmh0bWwoYFdlbGNvbWUsICR7bXNhbEhlbHBlci51c2VyTmFtZX0hIEZpcnN0bHksIGxldCdzIGltcG9ydCBvciBjcmVhdGUgYSBmZXcgdHdpbiBtb2RlbHMgdG8gc3RhcnQuIDxici8+PGJyLz5DbGljayB0byBjb250aW51ZS4uLmApXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHBvcFdpbilcclxuICAgICAgICBwb3BXaW4ub24oXCJjbGlja1wiLCgpPT57cG9wV2luLnJlbW92ZSgpfSlcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgICAgIHBvcFdpbi5mYWRlT3V0KFwic2xvd1wiLCgpPT57cG9wV2luLnJlbW92ZSgpfSk7XHJcbiAgICAgICAgfSwzMDAwKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBzdGFydFNlbGVjdGlvbkRpYWxvZygpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiB0b3BvbG9neURPTShET00pe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmRlZmF1bHROb2RlU2l6ZT0zMFxyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvPXt9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5pbml0PWZ1bmN0aW9uKCl7XHJcbiAgICBjeXRvc2NhcGUud2FybmluZ3MoZmFsc2UpICBcclxuICAgIHRoaXMuY29yZSA9IGN5dG9zY2FwZSh7XHJcbiAgICAgICAgY29udGFpbmVyOiAgdGhpcy5ET01bMF0sIC8vIGNvbnRhaW5lciB0byByZW5kZXIgaW5cclxuXHJcbiAgICAgICAgLy8gaW5pdGlhbCB2aWV3cG9ydCBzdGF0ZTpcclxuICAgICAgICB6b29tOiAxLFxyXG4gICAgICAgIHBhbjogeyB4OiAwLCB5OiAwIH0sXHJcblxyXG4gICAgICAgIC8vIGludGVyYWN0aW9uIG9wdGlvbnM6XHJcbiAgICAgICAgbWluWm9vbTogMC4xLFxyXG4gICAgICAgIG1heFpvb206IDEwLFxyXG4gICAgICAgIHpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJab29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBwYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyUGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgYm94U2VsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3Rpb25UeXBlOiAnc2luZ2xlJyxcclxuICAgICAgICB0b3VjaFRhcFRocmVzaG9sZDogOCxcclxuICAgICAgICBkZXNrdG9wVGFwVGhyZXNob2xkOiA0LFxyXG4gICAgICAgIGF1dG9sb2NrOiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5ncmFiaWZ5OiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5zZWxlY3RpZnk6IGZhbHNlLFxyXG5cclxuICAgICAgICAvLyByZW5kZXJpbmcgb3B0aW9uczpcclxuICAgICAgICBoZWFkbGVzczogZmFsc2UsXHJcbiAgICAgICAgc3R5bGVFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGhpZGVFZGdlc09uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIHRleHR1cmVPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyOiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyT3BhY2l0eTogMC4yLFxyXG4gICAgICAgIHdoZWVsU2Vuc2l0aXZpdHk6IDAuMyxcclxuICAgICAgICBwaXhlbFJhdGlvOiAnYXV0bycsXHJcblxyXG4gICAgICAgIGVsZW1lbnRzOiBbXSwgLy8gbGlzdCBvZiBncmFwaCBlbGVtZW50cyB0byBzdGFydCB3aXRoXHJcblxyXG4gICAgICAgIHN0eWxlOiBbIC8vIHRoZSBzdHlsZXNoZWV0IGZvciB0aGUgZ3JhcGhcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFwiaGVpZ2h0XCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJzogJ2RhdGEoaWQpJyxcclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6MC45LFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnOlwiMTJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LWZhbWlseSc6J0dlbmV2YSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1pbWFnZSc6IGZ1bmN0aW9uKGVsZSl7IHJldHVybiBcImltYWdlcy9jYXQucG5nXCI7IH1cclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1maXQnOidjb250YWluJyAvL2NvdmVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8nYmFja2dyb3VuZC1jb2xvcic6IGZ1bmN0aW9uKCBlbGUgKXsgcmV0dXJuIGVsZS5kYXRhKCdiZycpIH1cclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtd2lkdGgnOic3MCUnXHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLWhlaWdodCc6JzcwJSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJyM4ODgnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzU1NScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1zaGFwZSc6ICd0cmlhbmdsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2N1cnZlLXN0eWxlJzogJ2JlemllcicsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2Fycm93LXNjYWxlJzowLjZcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnZWRnZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICdsaW5lLWZpbGwnOlwibGluZWFyLWdyYWRpZW50XCIsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1ncmFkaWVudC1zdG9wLWNvbG9ycyc6WydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICAgICAnbGluZS1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6WycwJScsJzcwJScsJzEwMCUnXVxyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnbm9kZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLWNvbG9yJzpcInJlZFwiLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci13aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWZpbGwnOidyYWRpYWwtZ3JhZGllbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOlsnY3lhbicsICdtYWdlbnRhJywgJ3llbGxvdyddLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOlsnMCUnLCc1MCUnLCc2MCUnXVxyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnbm9kZS5ob3ZlcicsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ibGFja2VuJzowLjVcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICx7c2VsZWN0b3I6ICdlZGdlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6NVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2N5dG9zY2FwZSBlZGdlIGVkaXRpbmcgcGx1Zy1pblxyXG4gICAgdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKHtcclxuICAgICAgICB1bmRvYWJsZTogdHJ1ZSxcclxuICAgICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5OiAxNixcclxuICAgICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IHRydWUsXHJcbiAgICAgICAgc3RpY2t5QW5jaG9yVG9sZXJlbmNlOiAyMCxcclxuICAgICAgICBhbmNob3JTaGFwZVNpemVGYWN0b3I6IDUsXHJcbiAgICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTp0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6ZmFsc2UsXHJcbiAgICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOmZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3ZlcicsZT0+e1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlT3ZlckZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW91dCcsZT0+e1xyXG4gICAgICAgIHRoaXMubW91c2VPdXRGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKCd6b29tJywoZSk9PntcclxuICAgICAgICB2YXIgZnM9dGhpcy5nZXRGb250U2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB2YXIgZGltZW5zaW9uPXRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKCk7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlJylcclxuICAgICAgICAgICAgLnN0eWxlKHsgJ2ZvbnQtc2l6ZSc6IGZzLCB3aWR0aDogZGltZW5zaW9uLCBoZWlnaHQ6IGRpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAudXBkYXRlKClcclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbykge1xyXG4gICAgICAgICAgICB2YXIgbmV3RGltZW5zaW9uID0gTWF0aC5jZWlsKHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpb1ttb2RlbElEXSAqIGRpbWVuc2lvbilcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInICsgbW9kZWxJRCArICdcIl0nKVxyXG4gICAgICAgICAgICAgICAgLnN0eWxlKHsgd2lkdGg6IG5ld0RpbWVuc2lvbiwgaGVpZ2h0OiBuZXdEaW1lbnNpb24gfSlcclxuICAgICAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGU6c2VsZWN0ZWQnKVxyXG4gICAgICAgICAgICAuc3R5bGUoeyAnYm9yZGVyLXdpZHRoJzogTWF0aC5jZWlsKGRpbWVuc2lvbiAvIDE1KSB9KVxyXG4gICAgICAgICAgICAudXBkYXRlKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGluc3RhbmNlID0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgIHZhciB0YXBkcmFnSGFuZGxlcj0oZSkgPT4ge1xyXG4gICAgICAgIGluc3RhbmNlLmtlZXBBbmNob3JzQWJzb2x1dGVQb3NpdGlvbkR1cmluZ01vdmluZygpXHJcbiAgICAgICAgaWYoZS50YXJnZXQuaXNOb2RlICYmIGUudGFyZ2V0LmlzTm9kZSgpKSB0aGlzLmRyYWdnaW5nTm9kZT1lLnRhcmdldFxyXG4gICAgICAgIHRoaXMuc21hcnRQb3NpdGlvbk5vZGUoZS5wb3NpdGlvbilcclxuICAgIH1cclxuICAgIHZhciBzZXRPbmVUaW1lR3JhYiA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvcmUub25jZShcImdyYWJcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGRyYWdnaW5nTm9kZXMgPSB0aGlzLmNvcmUuY29sbGVjdGlvbigpXHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlLnRhcmdldClcclxuICAgICAgICAgICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGUuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZWxlKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpbnN0YW5jZS5zdG9yZUFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKGRyYWdnaW5nTm9kZXMpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5vbihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlciApXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVGcmVlKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVGcmVlID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZnJlZVwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgICAgICAgICBpbnN0YW5jZS5yZXNldEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGU9bnVsbFxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lR3JhYigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5yZW1vdmVMaXN0ZW5lcihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlcilcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgc2V0T25lVGltZUdyYWIoKVxyXG4gICAgdGhpcy5jb3JlLnRyaWdnZXIoXCJ6b29tXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zbWFydFBvc2l0aW9uTm9kZSA9IGZ1bmN0aW9uIChtb3VzZVBvc2l0aW9uKSB7XHJcbiAgICB2YXIgem9vbUxldmVsPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKCF0aGlzLmRyYWdnaW5nTm9kZSkgcmV0dXJuXHJcbiAgICAvL2NvbXBhcmluZyBub2RlcyBzZXQ6IGl0cyBjb25uZWN0ZnJvbSBub2RlcyBhbmQgdGhlaXIgY29ubmVjdHRvIG5vZGVzLCBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlckZyb21JbmNvbT0gaW5jb21lcnMub3V0Z29lcnMoKVxyXG4gICAgdmFyIG91dGVyPXRoaXMuZHJhZ2dpbmdOb2RlLm91dGdvZXJzKClcclxuICAgIHZhciBpbmNvbUZyb21PdXRlcj1vdXRlci5pbmNvbWVycygpXHJcbiAgICB2YXIgbW9uaXRvclNldD1pbmNvbWVycy51bmlvbihvdXRlckZyb21JbmNvbSkudW5pb24ob3V0ZXIpLnVuaW9uKGluY29tRnJvbU91dGVyKS5maWx0ZXIoJ25vZGUnKS51bm1lcmdlKHRoaXMuZHJhZ2dpbmdOb2RlKVxyXG5cclxuICAgIHZhciByZXR1cm5FeHBlY3RlZFBvcz0oZGlmZkFycixwb3NBcnIpPT57XHJcbiAgICAgICAgdmFyIG1pbkRpc3RhbmNlPU1hdGgubWluKC4uLmRpZmZBcnIpXHJcbiAgICAgICAgaWYobWluRGlzdGFuY2Uqem9vbUxldmVsIDwgMTApICByZXR1cm4gcG9zQXJyW2RpZmZBcnIuaW5kZXhPZihtaW5EaXN0YW5jZSldXHJcbiAgICAgICAgZWxzZSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeERpZmY9W11cclxuICAgIHZhciB4UG9zPVtdXHJcbiAgICB2YXIgeURpZmY9W11cclxuICAgIHZhciB5UG9zPVtdXHJcbiAgICBtb25pdG9yU2V0LmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB4RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLngtbW91c2VQb3NpdGlvbi54KSlcclxuICAgICAgICB4UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueClcclxuICAgICAgICB5RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLnktbW91c2VQb3NpdGlvbi55KSlcclxuICAgICAgICB5UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueSlcclxuICAgIH0pXHJcbiAgICB2YXIgcHJlZlg9cmV0dXJuRXhwZWN0ZWRQb3MoeERpZmYseFBvcylcclxuICAgIHZhciBwcmVmWT1yZXR1cm5FeHBlY3RlZFBvcyh5RGlmZix5UG9zKVxyXG4gICAgaWYocHJlZlghPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneCcsIHByZWZYKTtcclxuICAgIH1cclxuICAgIGlmKHByZWZZIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3knLCBwcmVmWSk7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiLS0tLVwiKVxyXG4gICAgLy9tb25pdG9yU2V0LmZvckVhY2goKGVsZSk9Pntjb25zb2xlLmxvZyhlbGUuaWQoKSl9KVxyXG4gICAgLy9jb25zb2xlLmxvZyhtb25pdG9yU2V0LnNpemUoKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3ZlckZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWUudGFyZ2V0LmRhdGEpIHJldHVyblxyXG4gICAgXHJcbiAgICB2YXIgaW5mbz1lLnRhcmdldC5kYXRhKCkub3JpZ2luYWxJbmZvXHJcbiAgICBpZihpbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCkgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9ZS50YXJnZXRcclxuICAgIGUudGFyZ2V0LmFkZENsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBcImluZm9cIjogW2luZm9dIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCl7XHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PW51bGw7XHJcbiAgICB9IFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICB2YXIgcmUgPSBbXVxyXG4gICAgYXJyLmZvckVhY2goKGVsZSkgPT4geyByZS5wdXNoKGVsZS5kYXRhKCkub3JpZ2luYWxJbmZvKSB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHJlIH0pXHJcblxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxBdmFydGE9ZnVuY3Rpb24obW9kZWxJRCxkYXRhVXJsKXtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKSBcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5Db2xvcj1mdW5jdGlvbihtb2RlbElELGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5TaGFwZT1mdW5jdGlvbihtb2RlbElELHNoYXBlKXtcclxuICAgIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3NoYXBlJzogJ3BvbHlnb24nLCdzaGFwZS1wb2x5Z29uLXBvaW50cyc6WzAsLTEsMC44NjYsLTAuNSwwLjg2NiwwLjUsMCwxLC0wLjg2NiwwLjUsLTAuODY2LC0wLjVdfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydzaGFwZSc6IHNoYXBlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb249ZnVuY3Rpb24obW9kZWxJRCxkaW1lbnNpb25SYXRpbyl7XHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF09cGFyc2VGbG9hdChkaW1lbnNpb25SYXRpbylcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwQ29sb3I9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2xpbmUtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwU2hhcGU9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHNoYXBlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1zdHlsZSc6IHNoYXBlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwV2lkdGg9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGVkZ2VXaWR0aCl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCl9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2U6c2VsZWN0ZWRbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzEsJ2xpbmUtY29sb3InOiAncmVkJ30pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZS5ob3Zlcltzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrM30pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zKXtcclxuICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uW1wic3JjSURcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25JRD1vbmVSZWxhdGlvbltcInJlbElEXCJdXHJcbiAgICAgICAgdmFyIHRoZU5vZGVOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc3JjSURdXHJcbiAgICAgICAgdmFyIHRoZU5vZGU9dGhpcy5jb3JlLmZpbHRlcignW2lkID0gXCInK3RoZU5vZGVOYW1lKydcIl0nKTtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uSUQpe1xyXG4gICAgICAgICAgICAgICAgYW5FZGdlLnJlbW92ZSgpXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSkgICBcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdmFyIHR3aW5EaXNwbGF5TmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3R3aW5JRF1cclxuICAgICAgICB0aGlzLmNvcmUuJCgnW2lkID0gXCInK3R3aW5EaXNwbGF5TmFtZSsnXCJdJykucmVtb3ZlKClcclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0d2luLndpZHRoKClcclxuICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbioyLCd3aWR0aCc6IGN1ckRpbWVuc2lvbioyIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24sJ3dpZHRoJzogY3VyRGltZW5zaW9uIH0sXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgICAgICAgICAgLGNvbXBsZXRlOigpPT57XHJcbiAgICAgICAgICAgICAgICB0d2luLnJlbW92ZVN0eWxlKCkgLy9tdXN0IHJlbW92ZSB0aGUgc3R5bGUgYWZ0ZXIgYW5pbWF0aW9uLCBvdGhlcndpc2UgdGhleSB3aWxsIGhhdmUgdGhlaXIgb3duIHN0eWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sMjAwKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSxhbmltYXRpb24pe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0d2luc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz10d2luc0RhdGFbaV07XHJcbiAgICAgICAgdmFyIG5ld05vZGU9e2RhdGE6e30sZ3JvdXA6XCJub2Rlc1wifVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT0gb3JpZ2luYWxJbmZvO1xyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcImlkXCJdPW9yaWdpbmFsSW5mb1snZGlzcGxheU5hbWUnXVxyXG4gICAgICAgIHZhciBtb2RlbElEPW9yaWdpbmFsSW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wibW9kZWxJRFwiXT1tb2RlbElEXHJcbiAgICAgICAgYXJyLnB1c2gobmV3Tm9kZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY3VycmVudGx5IGEgbGF5b3V0IHRoZXJlLCBhcHBseSBpdFxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dCgpXHJcblxyXG4gICAgcmV0dXJuIGVsZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICB2YXIgcmVsYXRpb25JbmZvQXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHJlbGF0aW9uc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz1yZWxhdGlvbnNEYXRhW2ldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVJRD1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ10rXCJfXCIrb3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgIHZhciBhUmVsYXRpb249e2RhdGE6e30sZ3JvdXA6XCJlZGdlc1wifVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPW9yaWdpbmFsSW5mb1xyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wiaWRcIl09dGhlSURcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29yaWdpbmFsSW5mb1snJHNvdXJjZUlkJ11dXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl09Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvcmlnaW5hbEluZm9bJyR0YXJnZXRJZCddXVxyXG5cclxuXHJcbiAgICAgICAgaWYodGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pLmxlbmd0aD09MCB8fCB0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXSkubGVuZ3RoPT0wKSBjb250aW51ZVxyXG4gICAgICAgIHZhciBzb3VyY2VOb2RlPXRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKVxyXG4gICAgICAgIHZhciBzb3VyY2VNb2RlbD1zb3VyY2VOb2RlWzBdLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYWRkIGFkZGl0aW9uYWwgc291cmNlIG5vZGUgaW5mb3JtYXRpb24gdG8gdGhlIG9yaWdpbmFsIHJlbGF0aW9uc2hpcCBpbmZvcm1hdGlvblxyXG4gICAgICAgIG9yaWdpbmFsSW5mb1snc291cmNlTW9kZWwnXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlTW9kZWxcIl09c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInJlbGF0aW9uc2hpcE5hbWVcIl09b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddXHJcblxyXG4gICAgICAgIHZhciBleGlzdEVkZ2U9dGhpcy5jb3JlLiQoJ2VkZ2VbaWQgPSBcIicrdGhlSUQrJ1wiXScpXHJcbiAgICAgICAgaWYoZXhpc3RFZGdlLnNpemUoKT4wKSB7XHJcbiAgICAgICAgICAgIGV4aXN0RWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIsb3JpZ2luYWxJbmZvKVxyXG4gICAgICAgICAgICBjb250aW51ZTsgIC8vbm8gbmVlZCB0byBkcmF3IGl0XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWxhdGlvbkluZm9BcnIucHVzaChhUmVsYXRpb24pXHJcbiAgICB9XHJcbiAgICBpZihyZWxhdGlvbkluZm9BcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB2YXIgZWRnZXM9dGhpcy5jb3JlLmFkZChyZWxhdGlvbkluZm9BcnIpXHJcbiAgICByZXR1cm4gZWRnZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXc9ZnVuY3Rpb24oKXtcclxuICAgIC8vY2hlY2sgdGhlIHN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyBhZ2FpbiBhbmQgbWF5YmUgc29tZSBvZiB0aGVtIGNhbiBiZSBkcmF3biBub3cgc2luY2UgdGFyZ2V0Tm9kZSBpcyBhdmFpbGFibGVcclxuICAgIHZhciBzdG9yZWRSZWxhdGlvbkFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBzdG9yZWRSZWxhdGlvbkFycj1zdG9yZWRSZWxhdGlvbkFyci5jb25jYXQoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF0pXHJcbiAgICB9XHJcbiAgICB0aGlzLmRyYXdSZWxhdGlvbnMoc3RvcmVkUmVsYXRpb25BcnIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9ZnVuY3Rpb24oZGF0YSl7XHJcbiAgICB2YXIgdHdpbnNBbmRSZWxhdGlvbnM9ZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIG5ldyB0d2lucyBmaXJzdFxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgdHdpbkluZm9BcnI9W11cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucykgdHdpbkluZm9BcnIucHVzaChvbmVTZXQuY2hpbGRUd2luc1tpbmRdKVxyXG4gICAgICAgIHZhciBlbGVzPXRoaXMuZHJhd1R3aW5zKHR3aW5JbmZvQXJyLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRoaXMuZHJhd1R3aW5zKHRtcEFycilcclxuXHJcbiAgICAvL3RoZW4gY2hlY2sgYWxsIHN0b3JlZCByZWxhdGlvbnNoaXBzIGFuZCBkcmF3IGlmIGl0IGNhbiBiZSBkcmF3blxyXG4gICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5VmlzdWFsRGVmaW5pdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHZpc3VhbEpzb249PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB2aXN1YWxKc29uKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcilcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcE5hbWUgaW4gdmlzdWFsSnNvblttb2RlbElEXS5yZWxzKXtcclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmVkZ2VXaWR0aCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aChtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZXBsYWNlQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIikge1xyXG4gICAgICAgIHRoaXMuYXBwbHlWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICAgICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQudHdpbkluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW25vZGVJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb249dG9wb05vZGUucmVuZGVyZWRQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5wYW5CeSh7eDotcG9zaXRpb24ueCsyMDAseTotcG9zaXRpb24ueSs1MH0pXHJcbiAgICAgICAgICAgIHRvcG9Ob2RlLnNlbGVjdCgpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC50d2luc0luZm8sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpeyAvL2Zyb20gc2VsZWN0aW5nIHR3aW5zIGluIHRoZSB0d2ludHJlZVxyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49IHRoaXMuY29yZS5ub2RlcyhcIiNcIitlbGVtZW50WydkaXNwbGF5TmFtZSddKVxyXG4gICAgICAgICAgICBhVHdpbi5zZWxlY3QoKVxyXG4gICAgICAgICAgICBpZihtb3VzZUNsaWNrRGV0YWlsIT0yKSB0aGlzLmFuaW1hdGVBTm9kZShhVHdpbikgLy9pZ25vcmUgZG91YmxlIGNsaWNrIHNlY29uZCBjbGlja1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIlBhblRvTm9kZVwiKXtcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgbm9kZU5hbWU9IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbbm9kZUluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlTmFtZSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5jZW50ZXIodG9wb05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC5zcmNNb2RlbElEKXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5lZGdlV2lkdGgpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmVkZ2VXaWR0aClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbykgIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZWxhdGlvbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlUmVsYXRpb25zKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdFRvXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0RnJvbVwiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdEZyb21cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RPdXRib3VuZFwiKXsgdGhpcy5zZWxlY3RPdXRib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RJbmJvdW5kXCIpeyB0aGlzLnNlbGVjdEluYm91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuaGlkZVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkNPU0VTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLkNPU0VTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzYXZlTGF5b3V0XCIpeyB0aGlzLnNhdmVMYXlvdXQobXNnUGF5bG9hZC5sYXlvdXROYW1lKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dENoYW5nZVwiKXsgdGhpcy5hcHBseU5ld0xheW91dCgpICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbGF5b3V0TmFtZT1nbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgXHJcbiAgICB2YXIgbGF5b3V0RGV0YWlsPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpXHJcbiAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgaWYobGF5b3V0RGV0YWlsPT1udWxsKSByZXR1cm47XHJcbiAgICBcclxuICAgIHZhciBzdG9yZWRQb3NpdGlvbnM9e31cclxuICAgIGZvcih2YXIgaW5kIGluIGxheW91dERldGFpbCl7XHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAzMDAsXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcblxyXG4gICAgLy9yZXN0b3JlIGVkZ2VzIGJlbmRpbmcgb3IgY29udHJvbCBwb2ludHNcclxuICAgIHZhciBlZGdlUG9pbnRzRGljdD1sYXlvdXREZXRhaWxbXCJlZGdlc1wiXVxyXG4gICAgaWYoZWRnZVBvaW50c0RpY3Q9PW51bGwpcmV0dXJuO1xyXG4gICAgZm9yKHZhciBzcmNJRCBpbiBlZGdlUG9pbnRzRGljdCl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBJRCBpbiBlZGdlUG9pbnRzRGljdFtzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgb2JqPWVkZ2VQb2ludHNEaWN0W3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1cclxuICAgICAgICAgICAgdGhpcy5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyhzcmNJRCxyZWxhdGlvbnNoaXBJRCxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl1cclxuICAgICAgICAgICAgLG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyA9IGZ1bmN0aW9uIChzcmNJRCxyZWxhdGlvbnNoaXBJRFxyXG4gICAgLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyxjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcyxjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzcmNJRF1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrbm9kZU5hbWUrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25zaGlwSUQpe1xyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zYXZlTGF5b3V0ID0gYXN5bmMgZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV09e31cclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYodGhpcy5jb3JlLm5vZGVzKCkuc2l6ZSgpPT0wKSByZXR1cm47XHJcblxyXG4gICAgLy9zdG9yZSBub2RlcyBwb3NpdGlvblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGxheW91dERpY3Rbb25lTm9kZS5pZCgpXT1bdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3gnXSksdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3knXSldXHJcbiAgICB9KVxyXG5cclxuICAgIC8vc3RvcmUgYW55IGVkZ2UgYmVuZGluZyBwb2ludHMgb3IgY29udHJvbGluZyBwb2ludHNcclxuXHJcbiAgICBpZihsYXlvdXREaWN0LmVkZ2VzPT1udWxsKSBsYXlvdXREaWN0LmVkZ2VzPXt9XHJcbiAgICB2YXIgZWRnZUVkaXRJbnN0YW5jZT0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICBpZighY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmICFjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYobGF5b3V0RGljdC5lZGdlc1tzcmNJRF09PW51bGwpbGF5b3V0RGljdC5lZGdlc1tzcmNJRF09e31cclxuICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF09e31cclxuICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNhdmVMYXlvdXRPYmo9e1wibGF5b3V0c1wiOnt9fVxyXG4gICAgc2F2ZUxheW91dE9ialtcImxheW91dHNcIl1bbGF5b3V0TmFtZV09SlNPTi5zdHJpbmdpZnkobGF5b3V0RGljdClcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlTGF5b3V0XCIsIFwiUE9TVFwiLCBzYXZlTGF5b3V0T2JqLFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIsXCJsYXlvdXROYW1lXCI6bGF5b3V0TmFtZX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5udW1iZXJQcmVjaXNpb24gPSBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICBpZihBcnJheS5pc0FycmF5KG51bWJlcikpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8bnVtYmVyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBudW1iZXJbaV0gPSB0aGlzLm51bWJlclByZWNpc2lvbihudW1iZXJbaV0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1iZXJcclxuICAgIH1lbHNlXHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdChudW1iZXIudG9GaXhlZCgzKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLkNPU0VTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2Uoc2VsZWN0ZWQpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5oaWRlU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHNlbGVjdGVkTm9kZXMucmVtb3ZlKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXRoaXMuY29yZS5ub2RlcygpLmVkZ2VzVG8oc2VsZWN0ZWROb2Rlcykuc291cmNlcygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RPdXRib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9c2VsZWN0ZWROb2Rlcy5lZGdlc1RvKHRoaXMuY29yZS5ub2RlcygpKS50YXJnZXRzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFkZENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHRhcmdldE5vZGUpIHtcclxuICAgIHZhciB0aGVDb25uZWN0TW9kZT10aGlzLnRhcmdldE5vZGVNb2RlXHJcbiAgICB2YXIgc3JjTm9kZUFycj10aGlzLmNvcmUubm9kZXMoXCI6c2VsZWN0ZWRcIilcclxuXHJcbiAgICB2YXIgcHJlcGFyYXRpb25JbmZvPVtdXHJcblxyXG4gICAgc3JjTm9kZUFyci5mb3JFYWNoKHRoZU5vZGU9PntcclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzXHJcbiAgICAgICAgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdFRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHtmcm9tOnRoZU5vZGUsdG86dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfWVsc2UgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdEZyb21cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIiksdGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe3RvOnRoZU5vZGUsZnJvbTp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLy9UT0RPOiBjaGVjayBpZiBpdCBpcyBuZWVkZWQgdG8gcG9wdXAgZGlhbG9nLCBpZiBhbGwgY29ubmVjdGlvbiBpcyBkb2FibGUgYW5kIG9ubHkgb25lIHR5cGUgdG8gdXNlLCBubyBuZWVkIHRvIHNob3cgZGlhbG9nXHJcbiAgICB0aGlzLnNob3dDb25uZWN0aW9uRGlhbG9nKHByZXBhcmF0aW9uSW5mbylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dDb25uZWN0aW9uRGlhbG9nID0gZnVuY3Rpb24gKHByZXBhcmF0aW9uSW5mbykge1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgcmVzdWx0QWN0aW9ucz1bXVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGNvbm5lY3Rpb25zXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlwiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5lbXB0eSgpXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh0aGlzLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpKVxyXG4gICAgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cgPSBmdW5jdGlvbiAob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpIHtcclxuICAgIHZhciByZXR1cm5PYmo9e31cclxuICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgdmFyIHRvTm9kZT1vbmVSb3cudG9cclxuICAgIHZhciBjb25uZWN0aW9uVHlwZXM9b25lUm93LmNvbm5lY3RcclxuICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcInJlZFwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPjEpeyBcclxuICAgICAgICBsYWJlbC5odG1sKFwiRnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICBsYWJlbC5wcmVwZW5kKHN3aXRjaFR5cGVTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgY29ubmVjdGlvblR5cGVzLmZvckVhY2gob25lVHlwZT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlZnJvbU5vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlZnJvbU5vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgfVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgcmV0dXJuIHJldHVybk9iajtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gYXN5bmMgZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIC8vIGZvciBlYWNoIHJlc3VsdEFjdGlvbnMsIGNhbGN1bGF0ZSB0aGUgYXBwZW5kaXggaW5kZXgsIHRvIGF2b2lkIHNhbWUgSUQgaXMgdXNlZCBmb3IgZXhpc3RlZCBjb25uZWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggdHJ1ZSApO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1tb2RlO1xyXG4gICAgJChkb2N1bWVudCkua2V5ZG93bigoZXZlbnQpID0+IHtcclxuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAyNykgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vbignY2xpY2snLCAoZSk9PntcclxuICAgICAgICB2YXIgY2xpY2tlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICB0aGlzLmFkZENvbm5lY3Rpb25zKGNsaWNrZWROb2RlKVxyXG4gICAgICAgIC8vZGVsYXkgYSBzaG9ydCB3aGlsZSBzbyBub2RlIHNlbGVjdGlvbiB3aWxsIG5vdCBiZSBjaGFuZ2VkIHRvIHRoZSBjbGlja2VkIHRhcmdldCBub2RlXHJcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e3RoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKX0sNTApXHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jYW5jZWxUYXJnZXROb2RlTW9kZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1udWxsO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcclxuICAgICQoZG9jdW1lbnQpLm9mZigna2V5ZG93bicpO1xyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub2ZmKFwiY2xpY2tcIilcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIGZhbHNlICk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9ncmlkPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IGVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb3NlPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG5cclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29zZScsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2VcclxuICAgICAgICAsZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG4gICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb25jZW50cmljPWZ1bmN0aW9uKGVsZXMsYm94KXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29uY2VudHJpYycsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIG1pbk5vZGVTcGFjaW5nOjYwLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBib3VuZGluZ0JveDpib3hcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5sYXlvdXRXaXRoTm9kZVBvc2l0aW9uPWZ1bmN0aW9uKG5vZGVQb3NpdGlvbil7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gdGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOiBub2RlUG9zaXRpb24sXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gdHJhbnNpdGlvbiB0aGUgbm9kZSBwb3NpdGlvbnNcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogNTAwLCAvLyBkdXJhdGlvbiBvZiBhbmltYXRpb24gaW4gbXMgaWYgZW5hYmxlZFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBuZXdUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9uZXdUd2luRGlhbG9nXCIpO1xyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImRhcmtHcmF5XCJcclxuICAgICAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgICAgICB2YXIgYXZhcnRhPW51bGxcclxuICAgICAgICB2YXIgZGltZW5zaW9uPTIwO1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZT0gIHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YT0gdmlzdWFsSnNvbi5hdmFydGEgXHJcbiAgICAgICAgICAgIGlmKHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pIGRpbWVuc2lvbio9cGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGljb25ET009JChcIjxkaXYgc3R5bGU9J3dpZHRoOlwiK2RpbWVuc2lvbitcInB4O2hlaWdodDpcIitkaW1lbnNpb24rXCJweDtmbG9hdDpsZWZ0O3Bvc2l0aW9uOnJlbGF0aXZlO3BhZGRpbmctdG9wOjJweCc+PC9kaXY+XCIpXHJcbiAgICAgICAgaWYoZGJNb2RlbEluZm8gJiYgZGJNb2RlbEluZm8uaXNJb1REZXZpY2VNb2RlbCl7XHJcbiAgICAgICAgICAgIHZhciBpb3REaXY9JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlcicgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0Oi01cHg7cGFkZGluZzowcHggMnB4O3RvcDotN3B4O2JvcmRlci1yYWRpdXM6IDNweDtmb250LXNpemU6N3B4Jz5Jb1Q8L2Rpdj5cIilcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoaW90RGl2KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGltZ1NyYz1lbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSxjb2xvckNvZGUpKVxyXG4gICAgICAgIGljb25ET00uYXBwZW5kKCQoXCI8aW1nIHNyYz0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIraW1nU3JjK1wiJz48L2ltZz5cIikpXHJcbiAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YWltZz0kKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIrYXZhcnRhK1wiJz48L2ltZz5cIilcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoYXZhcnRhaW1nKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaWNvbkRPTVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZVRhaWxCdXR0b25GdW5jID0gKGduKSA9PiB7XHJcbiAgICAgICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4O3Bvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7aGVpZ2h0OjI3cHg7IHJpZ2h0OjEwcHg7dHJhbnNmb3JtOnRyYW5zbGF0ZVkoLTUwJSlcIj4rPC9idXR0b24+JylcclxuICAgICAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICBnbi5leHBhbmQoKVxyXG4gICAgICAgICAgICBuZXdUd2luRGlhbG9nLnBvcHVwKHtcclxuICAgICAgICAgICAgICAgIFwiJG1ldGFkYXRhXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRtb2RlbFwiOiBnbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuIGFkZEJ1dHRvbjtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICB2YXIgaW5mb0Fycj1bXVxyXG4gICAgICAgIG5vZGVzQXJyLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PntcclxuICAgICAgICAgICAgaW5mb0Fyci5wdXNoKGl0ZW0ubGVhZkluZm8pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86aW5mb0FyciwgXCJtb3VzZUNsaWNrRGV0YWlsXCI6bW91c2VDbGlja0RldGFpbH0pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlPSh0aGVOb2RlKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIlBhblRvTm9kZVwiLCBpbmZvOnRoZU5vZGUubGVhZkluZm99KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiICBwbGFjZWhvbGRlcj1cInNlYXJjaC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0XCIpO1xyXG4gICAgdGhpcy5zZWFyY2hCb3guY3NzKHtcIm91dGxpbmVcIjpcIm5vbmVcIixcImhlaWdodFwiOlwiMTAwJVwiLFwid2lkdGhcIjpcIjEwMCVcIn0pIFxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZCh0aGlzLnNlYXJjaEJveClcclxuICAgIHZhciBoaWRlT3JTaG93RW1wdHlHcm91cD0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjIwcHg7Ym9yZGVyOm5vbmU7cGFkZGluZy1sZWZ0OjJweFwiIGNsYXNzPVwidzMtYmxvY2sgdzMtdGlueSB3My1ob3Zlci1yZWQgdzMtYW1iZXJcIj5IaWRlIEVtcHR5IE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKGhpZGVPclNob3dFbXB0eUdyb3VwKVxyXG4gICAgRE9NLmNzcyhcInRvcFwiLFwiNTBweFwiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiKT09XCJzaG93XCIpe1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJoaWRlXCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJTaG93IEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cD10cnVlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIkhpZGUgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKCl9KVxyXG4gICAgfSlcclxuICAgIHRoaXMuc2VhcmNoQm94LmtleXVwKChlKT0+e1xyXG4gICAgICAgIGlmKGUua2V5Q29kZSA9PSAxMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhTm9kZSA9IHRoaXMudHJlZS5zZWFyY2hUZXh0KCQoZS50YXJnZXQpLnZhbCgpKVxyXG4gICAgICAgICAgICBpZihhTm9kZSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBhTm9kZS5wYXJlbnRHcm91cE5vZGUuZXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZWxlY3RMZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zY3JvbGxUb0xlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJyZXBsYWNlXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9hcHBlbmRcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJhcHBlbmRcIilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbHNDaGFuZ2VcIikgdGhpcy5yZWZyZXNoTW9kZWxzKClcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIG1zZ1BheWxvYWQudHdpbnNJbmZvLmZvckVhY2gob25lVHdpbkluZm89Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW5JbmZvKX0pXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYoIW1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7IC8vIGNoYW5nZSBtb2RlbCBjbGFzcyB2aXN1YWxpemF0aW9uXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goZ249Pntnbi5yZWZyZXNoTmFtZSgpfSlcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZSh0d2luRGlzcGxheU5hbWUpXHJcbiAgICB9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlZnJlc2hNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBtb2RlbHNEYXRhPXt9XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIgb25lTW9kZWw9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgbW9kZWxzRGF0YVtvbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZU1vZGVsXHJcbiAgICB9XHJcbiAgICAvL2RlbGV0ZSBhbGwgZ3JvdXAgbm9kZXMgb2YgZGVsZXRlZCBtb2RlbHNcclxuICAgIHZhciBhcnI9W10uY29uY2F0KHRoaXMudHJlZS5ncm91cE5vZGVzKVxyXG4gICAgYXJyLmZvckVhY2goKGdub2RlKT0+e1xyXG4gICAgICAgIGlmKG1vZGVsc0RhdGFbZ25vZGUubmFtZV09PW51bGwpe1xyXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGlzIGdyb3VwIG5vZGVcclxuICAgICAgICAgICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3RoZW4gYWRkIGFsbCBncm91cCBub2RlcyB0aGF0IHRvIGJlIGFkZGVkXHJcbiAgICB2YXIgY3VycmVudE1vZGVsTmFtZUFycj1bXVxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57Y3VycmVudE1vZGVsTmFtZUFyci5wdXNoKGdub2RlLm5hbWUpfSlcclxuXHJcbiAgICB2YXIgYWN0dWFsTW9kZWxOYW1lQXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbHNEYXRhKSBhY3R1YWxNb2RlbE5hbWVBcnIucHVzaChpbmQpXHJcbiAgICBhY3R1YWxNb2RlbE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuXHJcbiAgICBmb3IodmFyIGk9MDtpPGFjdHVhbE1vZGVsTmFtZUFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICBpZihpPGN1cnJlbnRNb2RlbE5hbWVBcnIubGVuZ3RoICYmIGN1cnJlbnRNb2RlbE5hbWVBcnJbaV09PWFjdHVhbE1vZGVsTmFtZUFycltpXSkgY29udGludWVcclxuICAgICAgICAvL290aGVyd2lzZSBhZGQgdGhpcyBncm91cCB0byB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBuZXdHcm91cD10aGlzLnRyZWUuaW5zZXJ0R3JvdXBOb2RlKG1vZGVsc0RhdGFbYWN0dWFsTW9kZWxOYW1lQXJyW2ldXSxpKVxyXG4gICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgY3VycmVudE1vZGVsTmFtZUFyci5zcGxpY2UoaSwgMCwgYWN0dWFsTW9kZWxOYW1lQXJyW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUubG9hZFN0YXJ0U2VsZWN0aW9uPWFzeW5jIGZ1bmN0aW9uKHR3aW5JRHMsbW9kZWxJRHMscmVwbGFjZU9yQXBwZW5kKXtcclxuICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMudHJlZS5jbGVhckFsbExlYWZOb2RlcygpXHJcblxyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2hNb2RlbHMoKVxyXG4gICAgXHJcbiAgICAvL2FkZCBuZXcgdHdpbnMgdW5kZXIgdGhlIG1vZGVsIGdyb3VwIG5vZGVcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIC8vY2hlY2sgaWYgYW55IGN1cnJlbnQgbGVhZiBub2RlIGRvZXMgbm90IGhhdmUgc3RvcmVkIG91dGJvdW5kIHJlbGF0aW9uc2hpcCBkYXRhIHlldFxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gobGVhZk5vZGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVJZCA9IGxlYWZOb2RlLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXSA9PSBudWxsKSB0d2luSURBcnIucHVzaChub2RlSWQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVBRFRUd2lucyh0d2luc2RhdGEpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0d2luc2RhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGdyb3VwTmFtZSA9IGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbdHdpbnNkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSwgdHdpbnNkYXRhW2ldLCBcInNraXBSZXBlYXRcIilcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2godHdpbnNkYXRhW2ldW1wiJGR0SWRcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlcGxhY2VBbGxUd2luc1wiLCBpbmZvOiB0d2luc2RhdGEgfSlcclxuICAgICAgICBlbHNlIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB0aGlzLmZldGNoQWxsUmVsYXRpb25zaGlwcyh0d2luSURBcnIpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uZVR3aW4ob25lVHdpbilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdG1wQXJyLmZvckVhY2gob25lVHdpbj0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbil9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdPbmVUd2luPSBmdW5jdGlvbih0d2luSW5mbyl7XHJcbiAgICB2YXIgZ3JvdXBOYW1lPWdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbdHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSx0d2luSW5mbyxcInNraXBSZXBlYXRcIilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaEFsbFJlbGF0aW9uc2hpcHM9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdHdpbnNUcmVlOyIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3BlX3Rhc2ttYXN0ZXJcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIixcclxuICAgIFwiYjJjU2NvcGVfZnVuY3Rpb25zXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMvYmFzaWNcIixcclxuICAgIFwibG9nb3V0UmVkaXJlY3RVcmlcIjogdXJsLm9yaWdpbitcIi9zcGFpbmRleC5odG1sXCIsXHJcbiAgICBcIm1zYWxDb25maWdcIjp7XHJcbiAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICBjbGllbnRJZDogXCJmNDY5M2JlNS02MDFiLTRkMGUtOTIwOC1jMzVkOWFkNjIzODdcIixcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb20vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vXCIrc2lnbnVwc2lnbmlubmFtZSxcclxuICAgICAgICAgICAga25vd25BdXRob3JpdGllczogW2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tXCJdLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJpc0xvY2FsVGVzdFwiOmlzTG9jYWxUZXN0LFxyXG4gICAgXCJ0YXNrTWFzdGVyQVBJVVJJXCI6KChpc0xvY2FsVGVzdCk/XCJodHRwOi8vbG9jYWxob3N0OjUwMDIvXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3N0YXNrbWFzdGVybW9kdWxlLmF6dXJld2Vic2l0ZXMubmV0L1wiKSxcclxuICAgIFwiZnVuY3Rpb25zQVBJVVJJXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMuYXp1cmV3ZWJzaXRlcy5uZXQvYXBpL1wiXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsQXBwU2V0dGluZ3M7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuXHJcblxyXG5mdW5jdGlvbiBtc2FsSGVscGVyKCl7XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zaWduSW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzcG9uc2U9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmxvZ2luUG9wdXAoeyBzY29wZXM6W10gIH0pIC8vZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVzXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlICE9IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLnNldEFjY291bnQocmVzcG9uc2UuYWNjb3VudClcclxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmFjY291bnRcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2UgIHJldHVybiB0aGlzLmZldGNoQWNjb3VudCgpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoZS5lcnJvckNvZGUhPVwidXNlcl9jYW5jZWxsZWRcIikgY29uc29sZS5sb2coZSlcclxuICAgIH1cclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2V0QWNjb3VudD1mdW5jdGlvbih0aGVBY2NvdW50KXtcclxuICAgIGlmKHRoZUFjY291bnQ9PW51bGwpcmV0dXJuO1xyXG4gICAgdGhpcy5hY2NvdW50SWQgPSB0aGVBY2NvdW50LmhvbWVBY2NvdW50SWQ7XHJcbiAgICB0aGlzLmFjY291bnROYW1lID0gdGhlQWNjb3VudC51c2VybmFtZTtcclxuICAgIHRoaXMudXNlck5hbWU9dGhlQWNjb3VudC5uYW1lO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5mZXRjaEFjY291bnQ9ZnVuY3Rpb24obm9BbmltYXRpb24pe1xyXG4gICAgY29uc3QgY3VycmVudEFjY291bnRzID0gdGhpcy5teU1TQUxPYmouZ2V0QWxsQWNjb3VudHMoKTtcclxuICAgIGlmIChjdXJyZW50QWNjb3VudHMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG4gICAgdmFyIGZvdW5kQWNjb3VudD1udWxsO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjdXJyZW50QWNjb3VudHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuQWNjb3VudD0gY3VycmVudEFjY291bnRzW2ldXHJcbiAgICAgICAgaWYoYW5BY2NvdW50LmhvbWVBY2NvdW50SWQudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5iMmNTaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5rbm93bkF1dGhvcml0aWVzWzBdLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmNsaWVudElkXHJcbiAgICAgICAgKXtcclxuICAgICAgICAgICAgZm91bmRBY2NvdW50PSBhbkFjY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRBY2NvdW50KGZvdW5kQWNjb3VudClcclxuICAgIHJldHVybiBmb3VuZEFjY291bnQ7XHJcbn1cclxuXHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIHZhciB0b2tlbj1hd2FpdCB0aGlzLmdldFRva2VuKGdsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3BlX2Z1bmN0aW9ucylcclxuICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHZhciBhamF4Q29udGVudD17XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MuZnVuY3Rpb25zQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnBhcnNlSldUPWZ1bmN0aW9uKHRva2VuKXtcclxuICAgIHZhciBiYXNlNjRVcmwgPSB0b2tlbi5zcGxpdCgnLicpWzFdO1xyXG4gICAgdmFyIGJhc2U2NCA9IGJhc2U2NFVybC5yZXBsYWNlKC8tL2csICcrJykucmVwbGFjZSgvXy9nLCAnLycpO1xyXG4gICAgYmFzZTY0PSBCdWZmZXIuZnJvbShiYXNlNjQsICdiYXNlNjQnKS50b1N0cmluZygpO1xyXG4gICAgdmFyIGpzb25QYXlsb2FkID0gZGVjb2RlVVJJQ29tcG9uZW50KGJhc2U2NC5zcGxpdCgnJykubWFwKGZ1bmN0aW9uKGMpIHtcclxuICAgICAgICByZXR1cm4gJyUnICsgKCcwMCcgKyBjLmNoYXJDb2RlQXQoMCkudG9TdHJpbmcoMTYpKS5zbGljZSgtMik7XHJcbiAgICB9KS5qb2luKCcnKSk7XHJcblxyXG4gICAgcmV0dXJuIEpTT04ucGFyc2UoanNvblBheWxvYWQpO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5yZWxvYWRVc2VyQWNjb3VudERhdGE9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzPWF3YWl0IHRoaXMuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoVXNlckRhdGFcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICByZXR1cm5cclxuXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVVzZXJEYXRhKHJlcylcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEFQST1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkLHdpdGhQcm9qZWN0SUQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKHdpdGhQcm9qZWN0SUQpe1xyXG4gICAgICAgIHBheWxvYWQ9cGF5bG9hZHx8e31cclxuICAgICAgICBwYXlsb2FkW1wicHJvamVjdElEXCJdPWdsb2JhbENhY2hlLmN1cnJlbnRQcm9qZWN0SURcclxuICAgIH0gXHJcbiAgICBpZighZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3Qpe1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfdGFza21hc3RlcilcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuXHJcbiAgICAgICAgLy9pbiBjYXNlIGpvaW5lZCBwcm9qZWN0cyBKV1QgaXMgZ29pbmcgdG8gZXhwaXJlLCByZW5ldyBhbm90aGVyIG9uZVxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW4pIHtcclxuICAgICAgICAgICAgdmFyIGV4cFRTPXRoaXMucGFyc2VKV1QoZ2xvYmFsQ2FjaGUuam9pbmVkUHJvamVjdHNUb2tlbikuZXhwXHJcbiAgICAgICAgICAgIHZhciBjdXJyVGltZT1wYXJzZUludChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxyXG4gICAgICAgICAgICBpZihleHBUUy1jdXJyVGltZTw2MCl7IC8vZmV0Y2ggYSBuZXcgcHJvamVjdHMgSldUIHRva2VuIFxyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL2lmIHRoZSBBUEkgbmVlZCB0byB1c2UgcHJvamVjdCBJRCwgbXVzdCBhZGQgYSBoZWFkZXIgXCJwcm9qZWN0c1wiIGp3dCB0b2tlbiBzbyBzZXJ2ZXIgc2lkZSB3aWxsIHZlcmlmeVxyXG4gICAgICAgIGlmKHBheWxvYWQgJiYgcGF5bG9hZC5wcm9qZWN0SUQgJiYgZ2xvYmFsQ2FjaGUuam9pbmVkUHJvamVjdHNUb2tlbil7XHJcbiAgICAgICAgICAgIGhlYWRlcnNPYmpbXCJwcm9qZWN0c1wiXT1nbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHZhciBhamF4Q29udGVudD17XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5nZXRUb2tlbj1hc3luYyBmdW5jdGlvbihiMmNTY29wZSl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbj09bnVsbCkgdGhpcy5zdG9yZWRUb2tlbj17fVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGN1cnJUaW1lKzYwIDwgdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uZXhwaXJlKSByZXR1cm4gdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uYWNjZXNzVG9rZW5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRva2VuUmVxdWVzdD17XHJcbiAgICAgICAgICAgIHNjb3BlczogW2IyY1Njb3BlXSxcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoOiBmYWxzZSwgLy8gU2V0IHRoaXMgdG8gXCJ0cnVlXCIgdG8gc2tpcCBhIGNhY2hlZCB0b2tlbiBhbmQgZ28gdG8gdGhlIHNlcnZlciB0byBnZXQgYSBuZXcgdG9rZW5cclxuICAgICAgICAgICAgYWNjb3VudDogdGhpcy5teU1TQUxPYmouZ2V0QWNjb3VudEJ5SG9tZUlkKHRoaXMuYWNjb3VudElkKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblNpbGVudCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5hY2Nlc3NUb2tlbiB8fCByZXNwb25zZS5hY2Nlc3NUb2tlbiA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXT17XCJhY2Nlc3NUb2tlblwiOnJlc3BvbnNlLmFjY2Vzc1Rva2VuLFwiZXhwaXJlXCI6cmVzcG9uc2UuaWRUb2tlbkNsYWltcy5leHB9XHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbXNhbEhlbHBlcigpOyIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdFByb2plY3REaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRQcm9qZWN0RGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uIChwcm9qZWN0SW5mbykge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLnByb2plY3RJbmZvPXByb2plY3RJbmZvXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCI0MjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPlByb2plY3QgU2V0dGluZzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciByb3cxPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChyb3cxKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5OYW1lIDwvZGl2PicpXHJcbiAgICByb3cxLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjcwJTsgZGlzcGxheTppbmxpbmU7bWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDoycHhcIiAgcGxhY2Vob2xkZXI9XCJQcm9qZWN0IE5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICByb3cxLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICBuYW1lSW5wdXQudmFsKHByb2plY3RJbmZvLm5hbWUpXHJcbiAgICBuYW1lSW5wdXQub24oXCJjaGFuZ2VcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciBuYW1lU3RyPW5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIGlmKG5hbWVTdHI9PVwiXCIpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCJOYW1lIGNhbiBub3QgYmUgZW1wdHkhXCIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlcXVlc3RCb2R5PXtcInByb2plY3RJRFwiOnByb2plY3RJbmZvLmlkLFwiYWNjb3VudHNcIjpbXSxcIm5ld1Byb2plY3ROYW1lXCI6bmFtZVN0cn1cclxuICAgICAgICByZXF1ZXN0Qm9keS5hY2NvdW50cz1yZXF1ZXN0Qm9keS5hY2NvdW50cy5jb25jYXQocHJvamVjdEluZm8uc2hhcmVXaXRoKVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L2NoYW5nZU93blByb2plY3ROYW1lXCIsIFwiUE9TVFwiLCByZXF1ZXN0Qm9keSlcclxuICAgICAgICAgICAgbmFtZUlucHV0LmJsdXIoKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcblxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5TaGFyZSBXaXRoIDwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBzaGFyZUFjY291bnRJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6NjAlOyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkludml0ZWUgRW1haWwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICByb3cyLmFwcGVuZChzaGFyZUFjY291bnRJbnB1dClcclxuICAgIHZhciBpbnZpdGVCdG49JCgnPGEgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIGhyZWY9XCIjXCI+SW52aXRlPC9hPicpIFxyXG4gICAgcm93Mi5hcHBlbmQoaW52aXRlQnRuKSBcclxuXHJcbiAgICB2YXIgc2hhcmVBY2NvdW50c0xpc3Q9JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlciB3My1wYWRkaW5nJyBzdHlsZT0nbWFyZ2luOjFweCAxcHg7IGhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG8nPjxkaXY+XCIpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoc2hhcmVBY2NvdW50c0xpc3QpXHJcbiAgICB0aGlzLnNoYXJlQWNjb3VudHNMaXN0PXNoYXJlQWNjb3VudHNMaXN0O1xyXG4gICAgdGhpcy5kcmF3U2hhcmVkQWNjb3VudHMoKVxyXG5cclxuICAgIHNoYXJlQWNjb3VudElucHV0Lm9uKFwia2V5ZG93blwiLChldmVudCkgPT57XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMTMpIHRoaXMuc2hhcmVXaXRoQWNjb3VudChzaGFyZUFjY291bnRJbnB1dClcclxuICAgIH0pO1xyXG4gICAgaW52aXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLnNoYXJlV2l0aEFjY291bnQoc2hhcmVBY2NvdW50SW5wdXQpfSlcclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLnNoYXJlV2l0aEFjY291bnQ9YXN5bmMgZnVuY3Rpb24oYWNjb3VudElucHV0KXtcclxuICAgIHZhciBzaGFyZVRvQWNjb3VudD1hY2NvdW50SW5wdXQudmFsKClcclxuICAgIGlmKHNoYXJlVG9BY2NvdW50PT1cIlwiKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSW5kZXg9IHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLmluZGV4T2Yoc2hhcmVUb0FjY291bnQpXHJcbiAgICBpZih0aGVJbmRleCE9LTEpIHJldHVybjtcclxuICAgIHZhciByZXF1ZXN0Qm9keT17XCJwcm9qZWN0SURcIjp0aGlzLnByb2plY3RJbmZvLmlkLFwic2hhcmVUb0FjY291bnRcIjpzaGFyZVRvQWNjb3VudH1cclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvc2hhcmVQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHJlcXVlc3RCb2R5KVxyXG4gICAgICAgIHRoaXMuYWRkQWNjb3VudFRvU2hhcmVXaXRoKHNoYXJlVG9BY2NvdW50KVxyXG4gICAgICAgIHRoaXMuZHJhd1NoYXJlZEFjY291bnRzKClcclxuICAgICAgICBhY2NvdW50SW5wdXQudmFsKFwiXCIpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUuYWRkQWNjb3VudFRvU2hhcmVXaXRoPWZ1bmN0aW9uKHNoYXJlVG9BY2NvdW50SUQpe1xyXG4gICAgdmFyIHRoZUluZGV4PSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5pbmRleE9mKHNoYXJlVG9BY2NvdW50SUQpXHJcbiAgICBpZih0aGVJbmRleD09LTEpIHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLnB1c2goc2hhcmVUb0FjY291bnRJRClcclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLmRyYXdTaGFyZWRBY2NvdW50cz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5zaGFyZUFjY291bnRzTGlzdC5lbXB0eSgpXHJcbiAgICB2YXIgc2hhcmVkQWNjb3VudD10aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aFxyXG4gICAgc2hhcmVkQWNjb3VudC5mb3JFYWNoKG9uZUVtYWlsID0+IHtcclxuICAgICAgICB2YXIgYXJvdyA9ICQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLnNoYXJlQWNjb3VudHNMaXN0LmFwcGVuZChhcm93KVxyXG4gICAgICAgIHZhciBsYWJsZSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj4nK29uZUVtYWlsKycgPC9kaXY+JylcclxuICAgICAgICBhcm93LmFwcGVuZChsYWJsZSlcclxuICAgICAgICB2YXIgcmVtb3ZlQnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlciB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHh5eVwiIGhyZWY9XCIjXCI+UmVtb3ZlPC9hPicpXHJcbiAgICAgICAgYXJvdy5hcHBlbmQocmVtb3ZlQnRuKVxyXG4gICAgICAgIHJlbW92ZUJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3RCb2R5PXtcInByb2plY3RJRFwiOnRoaXMucHJvamVjdEluZm8uaWQsXCJub3RTaGFyZVRvQWNjb3VudFwiOm9uZUVtYWlsfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvbm90U2hhcmVQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHJlcXVlc3RCb2R5KVxyXG4gICAgICAgICAgICAgICAgdmFyIHRoZUluZGV4ID0gdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguaW5kZXhPZihvbmVFbWFpbClcclxuICAgICAgICAgICAgICAgIGlmICh0aGVJbmRleCAhPSAtMSkgdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguc3BsaWNlKHRoZUluZGV4LCAxKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U2hhcmVkQWNjb3VudHMoKVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLmRlbGV0ZUxheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiQ29uZmlybSBkZWxldGluZyBsYXlvdXQgXFxcIlwiICsgbGF5b3V0TmFtZSArIFwiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dE5hbWUgPT0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZUxheW91dFwiLCBcIlBPU1RcIiwgeyBcImxheW91dE5hbWVcIjogbGF5b3V0TmFtZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGVkaXRQcm9qZWN0RGlhbG9nKCk7IiwiZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuYWNjb3VudEluZm89bnVsbDtcclxuICAgIHRoaXMuam9pbmVkUHJvamVjdHNUb2tlbj1udWxsO1xyXG4gICAgLy9UT0RPOiBnb2luZyB0byBiZSBjaGFuZ2FibGVcclxuICAgIHRoaXMuY2hhbmdlQ3VycmVudFByb2plY3QoXCIxZmFlZGUxOC1jNmEwLTQ4NGItODQzYS03MTA1YjE2ODU2OGZcIilcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5jaGFuZ2VDdXJyZW50UHJvamVjdCA9IGZ1bmN0aW9uIChuZXdQcm9qZWN0SUQpIHtcclxuICAgIGlmKG5ld1Byb2plY3RJRD09dGhpcy5jdXJyZW50UHJvamVjdElEKSByZXR1cm47XHJcbiAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyA9IHt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zID0ge31cclxuICAgIC8vc3RvcmVkIGRhdGEsIHNlcGVyYXRlbHkgZnJvbSBBRFQgc2VydmljZSBhbmQgZnJvbSBjb3Ntb3NEQiBzZXJ2aWNlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyID0gW11cclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG4gICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEPXt9XHJcblxyXG4gICAgdGhpcy5EQlR3aW5zQXJyID0gW11cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZT17fVxyXG5cclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbFxyXG4gICAgdGhpcy5sYXlvdXRKU09OPXt9XHJcblxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uPXtcImRlZmF1bHRcIjp7fX1cclxuICAgIHRoaXMuY3VycmVudFByb2plY3RJRD1uZXdQcm9qZWN0SURcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZUFEVFR3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSl7XHJcbiAgICB0d2luc0RhdGEuZm9yRWFjaCgob25lTm9kZSk9Pnt0aGlzLnN0b3JlU2luZ2xlQURUVHdpbihvbmVOb2RlKX0pO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVBRFRUd2luPWZ1bmN0aW9uKG9uZU5vZGUpe1xyXG4gICAgdGhpcy5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZVxyXG4gICAgb25lTm9kZVtcImRpc3BsYXlOYW1lXCJdPSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lTm9kZVtcIiRkdElkXCJdXVxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlREJUd2luPWZ1bmN0aW9uKERCVHdpbil7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb25lREJUd2luPXRoaXMuREJUd2luc0FycltpXVxyXG4gICAgICAgIGlmKG9uZURCVHdpbltcImlkXCJdPT1EQlR3aW5bXCJpZFwiXSl7XHJcbiAgICAgICAgICAgIHRoaXMuREJUd2luc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLkRCVHdpbnNBcnIucHVzaChEQlR3aW4pXHJcblxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW0RCVHdpbltcImlkXCJdXT1EQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVEQlR3aW5zQXJyPWZ1bmN0aW9uKERCVHdpbnNBcnIpe1xyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmxlbmd0aD0wXHJcbiAgICB0aGlzLkRCVHdpbnNBcnI9dGhpcy5EQlR3aW5zQXJyLmNvbmNhdChEQlR3aW5zQXJyKVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lKSBkZWxldGUgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW2luZF1cclxuICAgIHRoaXMuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvbmVEQlR3aW5bXCJpZFwiXV09b25lREJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5tZXJnZURCVHdpbnNBcnI9ZnVuY3Rpb24oREJUd2luc0Fycil7XHJcbiAgICB2YXIgaWRMaXN0PXt9XHJcbiAgICB2YXIgYXJyPVtdLmNvbmNhdChEQlR3aW5zQXJyKVxyXG4gICAgYXJyLmZvckVhY2goYURCVHdpbj0+e1xyXG4gICAgICAgIGlkTGlzdFthREJUd2luLmlkXT0xXHJcbiAgICB9KVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmZvckVhY2goYURCVHdpbj0+e1xyXG4gICAgICAgIGlmKGlkTGlzdFthREJUd2luLmlkXSkgcmV0dXJuO1xyXG4gICAgICAgIGFyci5wdXNoKGFEQlR3aW4pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuc3RvcmVEQlR3aW5zQXJyKGFycilcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVXNlckRhdGE9ZnVuY3Rpb24ocmVzKXtcclxuICAgIHJlcy5mb3JFYWNoKG9uZVJlc3BvbnNlPT57XHJcbiAgICAgICAgaWYob25lUmVzcG9uc2UudHlwZT09XCJqb2luZWRQcm9qZWN0c1Rva2VuXCIpIHRoaXMuam9pbmVkUHJvamVjdHNUb2tlbj1vbmVSZXNwb25zZS5qd3Q7XHJcbiAgICAgICAgZWxzZSBpZihvbmVSZXNwb25zZS50eXBlPT1cInVzZXJcIikgdGhpcy5hY2NvdW50SW5mbz1vbmVSZXNwb25zZVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGE9ZnVuY3Rpb24oREJNb2RlbHMsYWR0TW9kZWxzKXtcclxuICAgIHRoaXMuc3RvcmVEQk1vZGVsc0FycihEQk1vZGVscylcclxuXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVsSURNYXBUb05hbWUpIGRlbGV0ZSB0aGlzLm1vZGVsSURNYXBUb05hbWVbaW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbE5hbWVNYXBUb0lEKSBkZWxldGUgdGhpcy5tb2RlbE5hbWVNYXBUb0lEW2luZF1cclxuXHJcbiAgICB2YXIgdG1wTmFtZVRvT2JqID0ge31cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWR0TW9kZWxzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgaWYgKGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID09IG51bGwpIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSkpIHtcclxuICAgICAgICAgICAgaWYgKGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXVxyXG4gICAgICAgICAgICBlbHNlIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gSlNPTi5zdHJpbmdpZnkoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0bXBOYW1lVG9PYmpbYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1dICE9IG51bGwpIHtcclxuICAgICAgICAgICAgLy9yZXBlYXRlZCBtb2RlbCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBhZHRNb2RlbHNbaV1bXCJAaWRcIl1cclxuICAgICAgICB9XHJcbiAgICAgICAgdG1wTmFtZVRvT2JqW2FkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXSA9IDFcclxuXHJcbiAgICAgICAgdGhpcy5tb2RlbElETWFwVG9OYW1lW2FkdE1vZGVsc1tpXVtcIkBpZFwiXV0gPSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxOYW1lTWFwVG9JRFthZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSBhZHRNb2RlbHNbaV1bXCJAaWRcIl1cclxuICAgIH1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlUHJvamVjdFR3aW5zQW5kVmlzdWFsRGF0YT1mdW5jdGlvbihyZXNBcnIpe1xyXG4gICAgdmFyIGRidHdpbnM9W11cclxuICAgIHJlc0Fyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnQudHlwZT09XCJ2aXN1YWxTY2hlbWFcIikge1xyXG4gICAgICAgICAgICAvL1RPRE86IG5vdyB0aGVyZSBpcyBvbmx5IG9uZSBcImRlZmF1bHRcIiBzY2hlbWEgdG8gdXNlXHJcbiAgICAgICAgICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHRoaXMubGF5b3V0SlNPTltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiRFRUd2luXCIpIGRidHdpbnMucHVzaChlbGVtZW50KVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnN0b3JlREJUd2luc0FycihkYnR3aW5zKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0REJUd2luc0J5TW9kZWxJRD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciByZXN1bHRBcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihlbGUubW9kZWxJRD09bW9kZWxJRCl7XHJcbiAgICAgICAgICAgIHJlc3VsdEFyci5wdXNoKGVsZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzdWx0QXJyO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0U2luZ2xlREJUd2luQnlJRD1mdW5jdGlvbih0d2luSUQpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJUd2luc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5pZD09dHdpbklEKXtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQ9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJNb2RlbHNBcnJbaV1cclxuICAgICAgICBpZihlbGUuaWQ9PW1vZGVsSUQpe1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCTW9kZWw9ZnVuY3Rpb24oc2luZ2xlREJNb2RlbEluZm8pe1xyXG4gICAgdmFyIG1vZGVsSUQgPSBzaW5nbGVEQk1vZGVsSW5mby5pZFxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCTW9kZWxzQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLmlkPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZWxlKSBkZWxldGUgZWxlW2luZF1cclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlREJNb2RlbEluZm8pIGVsZVtpbmRdPXNpbmdsZURCTW9kZWxJbmZvW2luZF1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vaXQgaXMgYSBuZXcgc2luZ2xlIG1vZGVsIGlmIGNvZGUgcmVhY2hlcyBoZXJlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLnB1c2goc2luZ2xlREJNb2RlbEluZm8pXHJcbiAgICB0aGlzLnNvcnREQk1vZGVsc0FycigpXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCTW9kZWxzQXJyPWZ1bmN0aW9uKERCTW9kZWxzQXJyKXtcclxuICAgIHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJNb2RlbHNBcnI9dGhpcy5EQk1vZGVsc0Fyci5jb25jYXQoREJNb2RlbHNBcnIpXHJcbiAgICB0aGlzLnNvcnREQk1vZGVsc0FycigpXHJcbiAgICBcclxufVxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc29ydERCTW9kZWxzQXJyPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICByZXR1cm4gYU5hbWUubG9jYWxlQ29tcGFyZShiTmFtZSkgXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbi8vVGhpcyBpcyBhIHNpbmdsZXRvbiBjbGFzc1xyXG5cclxuZnVuY3Rpb24gbW9kZWxBbmFseXplcigpe1xyXG4gICAgdGhpcy5EVERMTW9kZWxzPXt9XHJcbiAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzPXt9XHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmNsZWFyQWxsTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiY2xlYXIgYWxsIG1vZGVsIGluZm9cIilcclxuICAgIGZvcih2YXIgaWQgaW4gdGhpcy5EVERMTW9kZWxzKSBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2lkXVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZXNldEFsbE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGpzb25TdHI9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl1cclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09SlNPTi5wYXJzZShqc29uU3RyKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdPWpzb25TdHJcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFkZE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB2YXIgbW9kZWxJRD0gZWxlW1wiQGlkXCJdXHJcbiAgICAgICAgZWxlW1wib3JpZ2luYWxcIl09SlNPTi5zdHJpbmdpZnkoZWxlKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1lbGVcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZWNvcmRBbGxCYXNlQ2xhc3Nlcz0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICBwYXJlbnRPYmpbYmFzZUNsYXNzSURdPTFcclxuXHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykgcGFyZW50T2JqW2luZF0gPSBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzW2luZF1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudE9ialtpbmRdPT1udWxsKSBwYXJlbnRPYmpbaW5kXSA9IHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaW5kXVtiYXNlQ2xhc3NJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihwYXJlbnRPYmosZGF0YUluZm8sZW1iZWRkZWRTY2hlbWEpe1xyXG4gICAgZGF0YUluZm8uZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHJldHVybjtcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUHJvcGVydHlcIlxyXG4gICAgICAgIHx8KEFycmF5LmlzQXJyYXkob25lQ29udGVudFtcIkB0eXBlXCJdKSAmJiBvbmVDb250ZW50W1wiQHR5cGVcIl0uaW5jbHVkZXMoXCJQcm9wZXJ0eVwiKSlcclxuICAgICAgICB8fCBvbmVDb250ZW50W1wiQHR5cGVcIl09PW51bGwpIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnICYmIGVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dIT1udWxsKSBvbmVDb250ZW50W1wic2NoZW1hXCJdPWVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dXHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGFyZW50PXt9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW5ld1BhcmVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMobmV3UGFyZW50LG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hbmFseXplPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiYW5hbHl6ZSBtb2RlbCBpbmZvXCIpXHJcbiAgICAvL2FuYWx5emUgYWxsIHJlbGF0aW9uc2hpcCB0eXBlc1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5yZWxhdGlvbnNoaXBUeXBlcykgZGVsZXRlIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaWRdXHJcbiAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscykge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWEgPSB7fVxyXG4gICAgICAgIGlmIChlbGUuc2NoZW1hcykge1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyID0gZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyID0gW2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXSA9IGVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRBcnIgPSBlbGUuY29udGVudHNcclxuICAgICAgICBpZiAoIWNvbnRlbnRBcnIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnRlbnRBcnIuZm9yRWFjaCgob25lQ29udGVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAob25lQ29udGVudFtcIkB0eXBlXCJdID09IFwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXSkgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV09IHt9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXSA9IG9uZUNvbnRlbnRcclxuICAgICAgICAgICAgICAgIG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzID0ge31cclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgb25lQ29udGVudC5wcm9wZXJ0aWVzLCBlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbmFseXplIGVhY2ggbW9kZWwncyBwcm9wZXJ0eSB0aGF0IGNhbiBiZSBlZGl0ZWRcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpeyAvL2V4cGFuZCBwb3NzaWJsZSBlbWJlZGRlZCBzY2hlbWEgdG8gZWRpdGFibGVQcm9wZXJ0aWVzLCBhbHNvIGV4dHJhY3QgcG9zc2libGUgcmVsYXRpb25zaGlwIHR5cGVzIGZvciB0aGlzIG1vZGVsXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWE9e31cclxuICAgICAgICBpZihlbGUuc2NoZW1hcyl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFycj1lbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnI9W2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV09ZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXM9e31cclxuICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cz1bXVxyXG4gICAgICAgIGVsZS5hbGxCYXNlQ2xhc3Nlcz17fVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWxlLmNvbnRlbnRzLGVtYmVkZGVkU2NoZW1hKVxyXG5cclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT10aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2gob25lQ29udGVudD0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIkNvbXBvbmVudFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50TmFtZT1vbmVDb250ZW50W1wibmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRDbGFzcz1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdLGNvbXBvbmVudENsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHMucHVzaChjb21wb25lbnROYW1lKVxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgYmFzZSBjbGFzcyBwcm9wZXJ0aWVzIHRvIGVkaXRhYmxlUHJvcGVydGllcyBhbmQgdmFsaWQgcmVsYXRpb25zaGlwIHR5cGVzIHRvIHZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGJhc2VDbGFzc0lEcz1lbGUuZXh0ZW5kcztcclxuICAgICAgICBpZihiYXNlQ2xhc3NJRHM9PW51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1iYXNlQ2xhc3NJRHNcclxuICAgICAgICBlbHNlIHRtcEFycj1bYmFzZUNsYXNzSURzXVxyXG4gICAgICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhlbGUuYWxsQmFzZUNsYXNzZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKGVsZS52YWxpZFJlbGF0aW9uc2hpcHMsZWFjaEJhc2UpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuRFRETE1vZGVscylcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5yZWxhdGlvbnNoaXBUeXBlcylcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGNoaWxkTW9kZWxJRHM9W11cclxuICAgIGZvcih2YXIgYUlEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGFNb2RlbD10aGlzLkRURExNb2RlbHNbYUlEXVxyXG4gICAgICAgIGlmKGFNb2RlbC5hbGxCYXNlQ2xhc3NlcyAmJiBhTW9kZWwuYWxsQmFzZUNsYXNzZXNbbW9kZWxJRF0pIGNoaWxkTW9kZWxJRHMucHVzaChhTW9kZWxbXCJAaWRcIl0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hpbGRNb2RlbElEc1xyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5kZWxldGVNb2RlbD1hc3luYyBmdW5jdGlvbihtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGZ1bmNBZnRlckZhaWwsY29tcGxldGVGdW5jKXtcclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9dGhpcy5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgIHZhciBtb2RlbExldmVsPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciBjaGVja01vZGVsPXRoaXMuRFRETE1vZGVsc1tvbmVJRF1cclxuICAgICAgICBtb2RlbExldmVsLnB1c2goe1wibW9kZWxJRFwiOm9uZUlELFwibGV2ZWxcIjpPYmplY3Qua2V5cyhjaGVja01vZGVsLmFsbEJhc2VDbGFzc2VzKS5sZW5ndGh9KVxyXG4gICAgfSlcclxuICAgIG1vZGVsTGV2ZWwucHVzaCh7XCJtb2RlbElEXCI6bW9kZWxJRCxcImxldmVsXCI6MH0pXHJcbiAgICBtb2RlbExldmVsLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYltcImxldmVsXCJdLWFbXCJsZXZlbFwiXSB9KTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBpPTA7aTxtb2RlbExldmVsLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhTW9kZWxJRD1tb2RlbExldmVsW2ldLm1vZGVsSURcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZU1vZGVsXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxcIjogYU1vZGVsSUQgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1thTW9kZWxJRF1cclxuICAgICAgICAgICAgaWYoZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUpIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlKGFNb2RlbElEKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgdmFyIGRlbGV0ZWRNb2RlbHM9W11cclxuICAgICAgICAgICAgdmFyIGFsZXJ0U3RyPVwiRGVsZXRlIG1vZGVsIGlzIGluY29tcGxldGUuIERlbGV0ZWQgTW9kZWw6XCJcclxuICAgICAgICAgICAgZm9yKHZhciBqPTA7ajxpO2orKyl7XHJcbiAgICAgICAgICAgICAgICBhbGVydFN0cis9IG1vZGVsTGV2ZWxbal0ubW9kZWxJRCtcIiBcIlxyXG4gICAgICAgICAgICAgICAgZGVsZXRlZE1vZGVscy5wdXNoKG1vZGVsTGV2ZWxbal0ubW9kZWxJRClcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgYWxlcnRTdHIrPVwiLiBGYWlsIHRvIGRlbGV0ZSBcIithTW9kZWxJRCtcIi4gRXJyb3IgaXMgXCIrZVxyXG4gICAgICAgICAgICBpZihmdW5jQWZ0ZXJGYWlsKSBmdW5jQWZ0ZXJGYWlsKGRlbGV0ZWRNb2RlbHMpXHJcbiAgICAgICAgICAgIGFsZXJ0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoY29tcGxldGVGdW5jKSBjb21wbGV0ZUZ1bmMoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEFuYWx5emVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nPXJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5pbXBvcnRCdXR0b249aW1wb3J0QnV0dG9uXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0TW9kZWxBcnIoW3RoaXMuZHRkbG9ial0pXHJcbiAgICAgICAgZWxzZSB0aGlzLnJlcGxhY2VNb2RlbCgpICAgICAgIFxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5Nb2RlbCBUZW1wbGF0ZTwvZGl2PicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG1vZGVsVGVtcGxhdGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDB9KVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChtb2RlbFRlbXBsYXRlU2VsZWN0b3IuRE9NKVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VUZW1wbGF0ZShvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24oXCJOZXcgTW9kZWwuLi5cIixcIk5ld1wiKVxyXG4gICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKG1vZGVsTmFtZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9XCI0NTBweFwiXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbjoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDozMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBkdGRsU2NyaXB0UGFuZWw9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwib3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweDt3aWR0aDozMTBweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnXCI+PC9kaXY+JylcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoZHRkbFNjcmlwdFBhbmVsKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWw9ZHRkbFNjcmlwdFBhbmVsXHJcblxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVwbGFjZU1vZGVsPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2RlbGV0ZSB0aGUgb2xkIHNhbWUgbmFtZSBtb2RlbCwgdGhlbiBjcmVhdGUgaXQgYWdhaW5cclxuICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuXHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKGN1cnJlbnRNb2RlbElEKVxyXG5cclxuICAgIHZhciBkaWFsb2dTdHIgPSAocmVsYXRlZE1vZGVsSURzLmxlbmd0aCA9PSAwKSA/IChcIlR3aW5zIHdpbGwgYmUgaW1wYWN0IHVuZGVyIG1vZGVsIFxcXCJcIiArIGN1cnJlbnRNb2RlbElEICsgXCJcXFwiXCIpIDpcclxuICAgICAgICAoY3VycmVudE1vZGVsSUQgKyBcIiBpcyBiYXNlIG1vZGVsIG9mIFwiICsgcmVsYXRlZE1vZGVsSURzLmpvaW4oXCIsIFwiKSArIFwiLiBUd2lucyB1bmRlciB0aGVzZSBtb2RlbHMgd2lsbCBiZSBpbXBhY3QuXCIpXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IGRpYWxvZ1N0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtUmVwbGFjZU1vZGVsKGN1cnJlbnRNb2RlbElEKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKSAgICBcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmltcG9ydE1vZGVsQXJyPWFzeW5jIGZ1bmN0aW9uKG1vZGVsVG9CZUltcG9ydGVkLGZvclJlcGxhY2luZyxhZnRlckZhaWx1cmUpe1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgaWYoZm9yUmVwbGFjaW5nKSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBtb2RpZmllZCBzdWNjZXNzZnVsbHkhXCIpXHJcbiAgICAgICAgZWxzZSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBjcmVhdGVkIVwiKVxyXG5cclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMobW9kZWxUb0JlSW1wb3J0ZWQpIC8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgdGhpcy5wb3B1cCgpIC8vcmVmcmVzaCBjb250ZW50XHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoYWZ0ZXJGYWlsdXJlKSBhZnRlckZhaWx1cmUoKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfSBcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNvbmZpcm1SZXBsYWNlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIGJhY2t1cE1vZGVscy5wdXNoKEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW29uZUlEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgIH0pXHJcbiAgICBiYWNrdXBNb2RlbHMucHVzaCh0aGlzLmR0ZGxvYmopXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzU3RyPWVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShiYWNrdXBNb2RlbHMpKVxyXG5cclxuICAgIHZhciBmdW5jQWZ0ZXJGYWlsPShkZWxldGVkTW9kZWxJRHMpPT57XHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGJhY2t1cE1vZGVsc1N0cik7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHNBZnRlckZhaWxlZE9wZXJhdGlvbi5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElELGVhY2hNb2RlbE5hbWUpID0+IHt9XHJcbiAgICBcclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgLy9pbXBvcnQgYWxsIHRoZSBtb2RlbHMgYWdhaW5cclxuICAgICAgICB0aGlzLmltcG9ydE1vZGVsQXJyKGJhY2t1cE1vZGVscyxcImZvclJlcGxhY2luZ1wiLGZ1bmNBZnRlckZhaWwpXHJcbiAgICB9XHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsZnVuY0FmdGVyRmFpbCxjb21wbGV0ZUZ1bmMpXHJcbn1cclxuXHJcblxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNob29zZVRlbXBsYXRlPWZ1bmN0aW9uKHRlbXBhbHRlTmFtZSl7XHJcbiAgICBpZih0ZW1wYWx0ZU5hbWUhPVwiTmV3XCIpe1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaj1KU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0ZW1wYWx0ZU5hbWVdW1wib3JpZ2luYWxcIl0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmogPSB7XHJcbiAgICAgICAgICAgIFwiQGlkXCI6IFwiZHRtaTphTmFtZVNwYWNlOmFNb2RlbElEOzFcIixcclxuICAgICAgICAgICAgXCJAY29udGV4dFwiOiBbXCJkdG1pOmR0ZGw6Y29udGV4dDsyXCJdLFxyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiSW50ZXJmYWNlXCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheU5hbWVcIjogXCJOZXcgTW9kZWxcIixcclxuICAgICAgICAgICAgXCJjb250ZW50c1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYXR0cmlidXRlMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJsaW5rXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubGVmdFNwYW4uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMucmVmcmVzaERUREwoKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Nb2RlbCBJRCAmIE5hbWU8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+bW9kZWwgSUQgY29udGFpbnMgbmFtZXNwYWNlLCBhIG1vZGVsIHN0cmluZyBhbmQgYSB2ZXJzaW9uIG51bWJlcjwvcD48L2Rpdj48L2Rpdj4nKSlcclxuICAgIG5ldyBpZFJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbiAgICBuZXcgZGlzcGxheU5hbWVSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSl0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXT1bXVxyXG4gICAgbmV3IHBhcmFtZXRlcnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgcmVsYXRpb25zUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IGNvbXBvbmVudHNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0pdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXT1bXVxyXG4gICAgbmV3IGJhc2VDbGFzc2VzUm93KHRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoRFRETD1mdW5jdGlvbigpe1xyXG4gICAgLy9pdCB3aWxsIHJlZnJlc2ggdGhlIGdlbmVyYXRlZCBEVERMIHNhbXBsZSwgaXQgd2lsbCBhbHNvIGNoYW5nZSB0aGUgaW1wb3J0IGJ1dHRvbiB0byBzaG93IFwiQ3JlYXRlXCIgb3IgXCJNb2RpZnlcIlxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW2N1cnJlbnRNb2RlbElEXT09bnVsbCkgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIkNyZWF0ZVwiKVxyXG4gICAgZWxzZSB0aGlzLmltcG9ydEJ1dHRvbi50ZXh0KFwiTW9kaWZ5XCIpXHJcblxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuZW1wdHkoKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MjBweDt3aWR0aDoxMDBweFwiIGNsYXNzPVwidzMtYmFyIHczLWdyYXlcIj5HZW5lcmF0ZWQgRFRETDwvZGl2PicpKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxwcmUgc3R5bGU9XCJjb2xvcjpncmF5XCI+JytKU09OLnN0cmluZ2lmeSh0aGlzLmR0ZGxvYmosbnVsbCwyKSsnPC9wcmU+JykpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsRWRpdG9yRGlhbG9nKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gYmFzZUNsYXNzZXNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+QmFzZSBDbGFzc2VzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkJhc2UgY2xhc3MgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYW5kIHJlbGF0aW9uc2hpcCB0eXBlIGFyZSBpbmhlcml0ZWQ8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSBcInVua25vd25cIlxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVCYXNlY2xhc3NSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgYmFzZUNsYXNzTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjIyMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiYmFzZSBtb2RlbCBpZFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGJhc2VDbGFzc05hbWVJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC52YWwoZHRkbE9iailcclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmpbaV09YmFzZUNsYXNzTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY29tcG9uZW50c1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Db21wb25lbnRzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkNvbXBvbmVudCBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhcmUgZW1iZWRkZWQgdW5kZXIgYSBuYW1lPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwicmVsYXRpb24xXCIsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcmVsYXRpb25OYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6OTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInJlbGF0aW9uIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdGFyZ2V0TW9kZWxJRD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIihvcHRpb25hbCl0YXJnZXQgbW9kZWxcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1jb2cgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKHJlbGF0aW9uTmFtZUlucHV0LHRhcmdldE1vZGVsSUQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICB0YXJnZXRNb2RlbElELnZhbChkdGRsT2JqW1widGFyZ2V0XCJdfHxcIlwiKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdKSBkdGRsT2JqW1wicHJvcGVydGllc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cmVsYXRpb25OYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHRhcmdldE1vZGVsSUQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGlmKHRhcmdldE1vZGVsSUQudmFsKCk9PVwiXCIpIGRlbGV0ZSBkdGRsT2JqW1widGFyZ2V0XCJdXHJcbiAgICAgICAgZWxzZSBkdGRsT2JqW1widGFyZ2V0XCJdPXRhcmdldE1vZGVsSUQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdICYmIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgcHJvcGVydGllcz1kdGRsT2JqW1wicHJvcGVydGllc1wiXVxyXG4gICAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChvbmVQcm9wZXJ0eT0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZVByb3BlcnR5LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcmFtZXRlcnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlBhcmFtZXRlcnM8L2Rpdj48L2Rpdj4nKVxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUHJvcGVydHlcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVQYXJhbWV0ZXJSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosdG9wTGV2ZWwsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHBhcmFtZXRlck5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInBhcmFtZXRlciBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGVudW1WYWx1ZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwic3RyMSxzdHIyLC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcHR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXkgdzMtYmFyLWl0ZW1cIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDVweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDAsXCJpc0NsaWNrYWJsZVwiOjEsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXHJcbiAgICBcImFkanVzdFBvc2l0aW9uQW5jaG9yXCI6ZGlhbG9nT2Zmc2V0fSlcclxuICAgIHB0eXBlU2VsZWN0b3IuYWRkT3B0aW9uQXJyKFtcInN0cmluZ1wiLFwiZmxvYXRcIixcImludGVnZXJcIixcIkVudW1cIixcIk9iamVjdFwiLFwiZG91YmxlXCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZHVyYXRpb25cIixcImxvbmdcIixcInRpbWVcIl0pXHJcbiAgICBET00uYXBwZW5kKHBhcmFtZXRlck5hbWVJbnB1dCxwdHlwZVNlbGVjdG9yLkRPTSxlbnVtVmFsdWVJbnB1dCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgcHR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBwdHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBjb250ZW50RE9NLmVtcHR5KCkvL2NsZWFyIGFsbCBjb250ZW50IGRvbSBjb250ZW50XHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spe1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBkdGRsT2JqKSBkZWxldGUgZHRkbE9ialtpbmRdICAgIC8vY2xlYXIgYWxsIG9iamVjdCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmKHRvcExldmVsKSBkdGRsT2JqW1wiQHR5cGVcIl09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgaWYob3B0aW9uVGV4dD09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuc2hvdygpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiRW51bVwiLFwidmFsdWVTY2hlbWFcIjogXCJzdHJpbmdcIn1cclxuICAgICAgICB9ZWxzZSBpZihvcHRpb25UZXh0PT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uc2hvdygpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiT2JqZWN0XCJ9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdKSBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgZW51bVZhbHVlSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHZhciB2YWx1ZUFycj1lbnVtVmFsdWVJbnB1dC52YWwoKS5zcGxpdChcIixcIilcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXT1bXVxyXG4gICAgICAgIHZhbHVlQXJyLmZvckVhY2goYVZhbD0+e1xyXG4gICAgICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBhVmFsLnJlcGxhY2UoXCIgXCIsXCJcIiksIC8vcmVtb3ZlIGFsbCB0aGUgc3BhY2UgaW4gbmFtZVxyXG4gICAgICAgICAgICAgICAgXCJlbnVtVmFsdWVcIjogYVZhbFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKHR5cGVvZihkdGRsT2JqW1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JykgdmFyIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdXHJcbiAgICBlbHNlIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdW1wiQHR5cGVcIl1cclxuICAgIHB0eXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHNjaGVtYSlcclxuICAgIGlmKHNjaGVtYT09XCJFbnVtXCIpe1xyXG4gICAgICAgIHZhciBlbnVtQXJyPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgaWYoZW51bUFyciE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dFN0cj1cIlwiXHJcbiAgICAgICAgICAgIGVudW1BcnIuZm9yRWFjaChvbmVFbnVtVmFsdWU9PntpbnB1dFN0cis9b25lRW51bVZhbHVlLmVudW1WYWx1ZStcIixcIn0pXHJcbiAgICAgICAgICAgIGlucHV0U3RyPWlucHV0U3RyLnNsaWNlKDAsIC0xKS8vcmVtb3ZlIHRoZSBsYXN0IFwiLFwiXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChpbnB1dFN0cilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihzY2hlbWE9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgIHZhciBmaWVsZHM9ZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXVxyXG4gICAgICAgIGZpZWxkcy5mb3JFYWNoKG9uZUZpZWxkPT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lRmllbGQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaWRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5kdG1pOjwvZGl2PicpXHJcbiAgICB2YXIgZG9tYWluSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6ODhweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk5hbWVzcGFjZVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBtb2RlbElESW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTMycHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHZlcnNpb25JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwidmVyc2lvblwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLGRvbWFpbklucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjo8L2Rpdj4nKSxtb2RlbElESW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OzwvZGl2PicpLHZlcnNpb25JbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIHZhciBzdHI9YGR0bWk6JHtkb21haW5JbnB1dC52YWwoKX06JHttb2RlbElESW5wdXQudmFsKCl9OyR7dmVyc2lvbklucHV0LnZhbCgpfWBcclxuICAgICAgICBkdGRsT2JqW1wiQGlkXCJdPXN0clxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBkb21haW5JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgbW9kZWxJRElucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2ZXJzaW9uSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJAaWRcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpe1xyXG4gICAgICAgIHZhciBhcnIxPXN0ci5zcGxpdChcIjtcIilcclxuICAgICAgICBpZihhcnIxLmxlbmd0aCE9MikgcmV0dXJuO1xyXG4gICAgICAgIHZlcnNpb25JbnB1dC52YWwoYXJyMVsxXSlcclxuICAgICAgICB2YXIgYXJyMj1hcnIxWzBdLnNwbGl0KFwiOlwiKVxyXG4gICAgICAgIGRvbWFpbklucHV0LnZhbChhcnIyWzFdKVxyXG4gICAgICAgIGFycjIuc2hpZnQoKTsgYXJyMi5zaGlmdCgpXHJcbiAgICAgICAgbW9kZWxJRElucHV0LnZhbChhcnIyLmpvaW4oXCI6XCIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5TmFtZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPkRpc3BsYXkgTmFtZTo8L2Rpdj4nKVxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxuYW1lSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXT1uYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgbmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCkgbmFtZUlucHV0LnZhbChzdHIpXHJcbn0iLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlVHJlZT0gcmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxNYW5hZ2VyRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3M9dHJ1ZTtcclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUvTW9kaWZ5IE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBleHBvcnRNb2RlbEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5FeHBvcnQgQWxsIE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChpbXBvcnRNb2RlbHNCdG4sYWN0dWFsSW1wb3J0TW9kZWxzQnRuLCBtb2RlbEVkaXRvckJ0bixleHBvcnRNb2RlbEJ0bilcclxuICAgIGltcG9ydE1vZGVsc0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgbW9kZWxFZGl0b3JCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbW9kZWxFZGl0b3JEaWFsb2cucG9wdXAoKVxyXG4gICAgfSlcclxuICAgIGV4cG9ydE1vZGVsQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciBtb2RlbEFycj1bXVxyXG4gICAgICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIG1vZGVsQXJyLnB1c2goSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShtb2RlbEFycikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydE1vZGVscy5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPk1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgXHJcbiAgICB2YXIgbW9kZWxMaXN0ID0gJCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgIG1vZGVsTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjQyMHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKG1vZGVsTGlzdClcclxuICAgIHRoaXMubW9kZWxMaXN0ID0gbW9kZWxMaXN0O1xyXG4gICAgXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZzowcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBwYW5lbENhcmRPdXQ9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiaGVpZ2h0OjM1cHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZCh0aGlzLm1vZGVsQnV0dG9uQmFyKVxyXG5cclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkT3V0KVxyXG4gICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IHN0eWxlPVwid2lkdGg6NDEwcHg7aGVpZ2h0OjQxMnB4O292ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZD1wYW5lbENhcmQ7XHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcbiAgICBwYW5lbENhcmQuaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy1sZWZ0OjVweCc+Q2hvb3NlIGEgbW9kZWwgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT5cIilcclxuXHJcbiAgICB0aGlzLmxpc3RNb2RlbHMoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlc2l6ZUltZ0ZpbGUgPSBhc3luYyBmdW5jdGlvbih0aGVGaWxlLG1heF9zaXplKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgdG1wSW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcub25sb2FkID0gICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHRtcEltZy53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0bXBJbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IGhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICo9IG1heF9zaXplIC8gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCAqPSBtYXhfc2l6ZSAvIGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHRtcEltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVcmwpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCh0aGVGaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJpZ2h0U3Bhbj1hc3luYyBmdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG5cclxuICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwibWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bilcclxuXHJcblxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSAkKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5DbGVhciBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoaW1wb3J0UGljQnRuLCBhY3R1YWxJbXBvcnRQaWNCdG4sIGNsZWFyQXZhcnRhQnRuKVxyXG4gICAgaW1wb3J0UGljQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KSA9PiB7XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdmFyIHRoZUZpbGUgPSBmaWxlc1swXVxyXG5cclxuICAgICAgICBpZiAodGhlRmlsZS50eXBlID09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHIgPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKHRoZUZpbGUpXHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoZUZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gYXdhaXQgdGhpcy5yZXNpemVJbWdGaWxlKHRoZUZpbGUsIDcwKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coeyB3aWR0aDogXCIyMDBweFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiTm90ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBpbXBvcnQgaW1hZ2UgZmlsZSAocG5nLGpwZyxzdmcgYW5kIHNvIG9uKVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBidXR0b25zOiBbeyBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJPa1wiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7IGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKSB9IH1dXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5hdHRyKFwic3JjXCIsIGRhdGFVcmwpXHJcblxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZiAoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF0gPSB7fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhID0gZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwiYXZhcnRhXCI6IGRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0pIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcucmVtb3ZlQXR0cignc3JjJyk7XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJub0F2YXJ0YVwiOiB0cnVlIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIHJlbGF0ZWRNb2RlbElEcyA9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgICAgICB2YXIgZGlhbG9nU3RyPShyZWxhdGVkTW9kZWxJRHMubGVuZ3RoPT0wKT8gKFwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiLlwiKTogXHJcbiAgICAgICAgICAgIChtb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIityZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpK1wiLlwiKVxyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgICAgICAvL2NoZWNrIGhvdyBtYW55IHR3aW5zIGFyZSB1bmRlciB0aGlzIG1vZGVsIElEXHJcbiAgICAgICAgdmFyIG51bWJlck9mVHdpbnM9MFxyXG4gICAgICAgIHZhciBjaGVja1R3aW5zTW9kZWxBcnI9W21vZGVsSURdLmNvbmNhdChyZWxhdGVkTW9kZWxJRHMpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGhlSW5kZXg9Y2hlY2tUd2luc01vZGVsQXJyLmluZGV4T2Yob25lREJUd2luW1wibW9kZWxJRFwiXSlcclxuICAgICAgICAgICAgaWYodGhlSW5kZXghPS0xKSBudW1iZXJPZlR3aW5zKytcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBkaWFsb2dTdHIrPVwiIChUaGVyZSB3aWxsIGJlIFwiKygobnVtYmVyT2ZUd2lucz4xKT8obnVtYmVyT2ZUd2lucytcIiB0d2luc1wiKToobnVtYmVyT2ZUd2lucytcIiB0d2luXCIpICkgKyBcIiBiZWluZyBpbXBhY3RlZClcIlxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtRGVsZXRlTW9kZWwobW9kZWxJRCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5jb25maXJtRGVsZXRlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElEKSA9PiB7XHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbZWFjaERlbGV0ZWRNb2RlbElEXSlcclxuICAgICAgICAvL1RPRE86IGNsZWFyIHRoZSB2aXN1YWxpemF0aW9uIHNldHRpbmcgb2YgdGhpcyBkZWxldGVkIG1vZGVsXHJcbiAgICAgICAgLypcclxuICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1bbW9kZWxJRF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsSURdXHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIH0qL1xyXG4gICAgfVxyXG4gICAgdmFyIGNvbXBsZXRlRnVuYz0oKT0+eyBcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbiAgICAgICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgfVxyXG5cclxuICAgIC8vZXZlbiBub3QgY29tcGxldGVseSBzdWNjZXNzZnVsIGRlbGV0aW5nLCBpdCB3aWxsIHN0aWxsIGludm9rZSBjb21wbGV0ZUZ1bmNcclxuICAgIG1vZGVsQW5hbHl6ZXIuZGVsZXRlTW9kZWwobW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxjb21wbGV0ZUZ1bmMsY29tcGxldGVGdW5jKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hNb2RlbFRyZWVMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy50cmVlLnNlbGVjdGVkTm9kZXMubGVuZ3RoPjApIHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzWzBdLnJlZHJhd0xhYmVsKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsQmFzZUNsYXNzZXM9ZnVuY3Rpb24oYmFzZUNsYXNzZXMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGJhc2VDbGFzc2VzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO3BhZGRpbmc6LjFlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsVmlzdWFsaXphdGlvbj1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSl7XHJcbiAgICB2YXIgbW9kZWxKc29uPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXTtcclxuICAgIHZhciBhVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIGFUYWJsZS5odG1sKCc8dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj4nKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChhVGFibGUpIFxyXG5cclxuICAgIHZhciBsZWZ0UGFydD1hVGFibGUuZmluZChcInRkOmZpcnN0XCIpXHJcbiAgICB2YXIgcmlnaHRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6bnRoLWNoaWxkKDIpXCIpXHJcbiAgICByaWdodFBhcnQuY3NzKHtcIndpZHRoXCI6XCI1MHB4XCIsXCJoZWlnaHRcIjpcIjUwcHhcIixcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0R3JheVwifSlcclxuICAgIFxyXG4gICAgdmFyIGF2YXJ0YUltZz0kKFwiPGltZyBzdHlsZT0naGVpZ2h0OjQ1cHgnPjwvaW1nPlwiKVxyXG4gICAgcmlnaHRQYXJ0LmFwcGVuZChhdmFydGFJbWcpXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSBhdmFydGFJbWcuYXR0cignc3JjJyx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgIHRoaXMuYXZhcnRhSW1nPWF2YXJ0YUltZztcclxuICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0KVxyXG5cclxuICAgIGlmKHRoaXMuc2hvd1JlbGF0aW9uVmlzdWFsaXphdGlvblNldHRpbmdzKXtcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBtb2RlbEpzb24udmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQsaW5kKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3c9ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20scmVsYXRpbnNoaXBOYW1lKXtcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCkgdmFyIG5hbWVTdHI9XCLil69cIiAvL3Zpc3VhbCBmb3Igbm9kZVxyXG4gICAgZWxzZSBuYW1lU3RyPVwi4p+cIFwiK3JlbGF0aW5zaGlwTmFtZVxyXG4gICAgdmFyIGNvbnRhaW5lckRpdj0kKFwiPGRpdiBzdHlsZT0ncGFkZGluZy1ib3R0b206OHB4Jz48L2Rpdj5cIilcclxuICAgIHBhcmVudERvbS5hcHBlbmQoY29udGFpbmVyRGl2KVxyXG4gICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0nbWFyZ2luLXJpZ2h0OjEwcHgnPlwiK25hbWVTdHIrXCI8L2xhYmVsPlwiKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIHZhciBkZWZpbmVkQ29sb3I9bnVsbFxyXG4gICAgdmFyIGRlZmluZWRTaGFwZT1udWxsXHJcbiAgICB2YXIgZGVmaW5lZERpbWVuc2lvblJhdGlvPW51bGxcclxuICAgIHZhciBkZWZpbmVkRWRnZVdpZHRoPW51bGxcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSBkZWZpbmVkRGltZW5zaW9uUmF0aW89dmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpb1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcikgZGVmaW5lZENvbG9yID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvclxyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZSkgZGVmaW5lZFNoYXBlID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZVxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aCkgZGVmaW5lZEVkZ2VXaWR0aD12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6NzVweFwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiZGFya0dyYXlcIixcIkJsYWNrXCIsXCJMaWdodEdyYXlcIixcIlJlZFwiLFwiR3JlZW5cIixcIkJsdWVcIixcIkJpc3F1ZVwiLFwiQnJvd25cIixcIkNvcmFsXCIsXCJDcmltc29uXCIsXCJEb2RnZXJCbHVlXCIsXCJHb2xkXCJdXHJcbiAgICBjb2xvckFyci5mb3JFYWNoKChvbmVDb2xvckNvZGUpPT57XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdcIitvbmVDb2xvckNvZGUrXCInPlwiK29uZUNvbG9yQ29kZStcIuKWpzwvb3B0aW9uPlwiKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuYXBwZW5kKGFuT3B0aW9uKVxyXG4gICAgICAgIGFuT3B0aW9uLmNzcyhcImNvbG9yXCIsb25lQ29sb3JDb2RlKVxyXG4gICAgfSlcclxuICAgIGlmKGRlZmluZWRDb2xvciE9bnVsbCkge1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IudmFsKGRlZmluZWRDb2xvcilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsZGVmaW5lZENvbG9yKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLFwiZGFya0dyYXlcIilcclxuICAgIH1cclxuICAgIGNvbG9yU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdENvbG9yQ29kZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLHNlbGVjdENvbG9yQ29kZSlcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICB2YXIgc2hhcGVTZWxlY3RvciA9ICQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNoYXBlU2VsZWN0b3IpXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdlbGxpcHNlJz7il688L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J3JvdW5kLXJlY3RhbmdsZScgc3R5bGU9J2ZvbnQtc2l6ZToxMjAlJz7ilqI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2hleGFnb24nIHN0eWxlPSdmb250LXNpemU6MTMwJSc+4qyhPC9vcHRpb24+XCIpKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J3NvbGlkJz7ihpI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2RvdHRlZCc+4oeiPC9vcHRpb24+XCIpKVxyXG4gICAgfVxyXG4gICAgaWYoZGVmaW5lZFNoYXBlIT1udWxsKSB7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci52YWwoZGVmaW5lZFNoYXBlKVxyXG4gICAgfVxyXG4gICAgc2hhcGVTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgc2VsZWN0U2hhcGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNpemVBZGp1c3RTZWxlY3RvciA9ICQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTt3aWR0aDoxMTBweFwiPjwvc2VsZWN0PicpXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgZj0wLjI7ZjwyO2YrPTAuMil7XHJcbiAgICAgICAgICAgIHZhciB2YWw9Zi50b0ZpeGVkKDEpK1wiXCJcclxuICAgICAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT1cIit2YWwrXCI+ZGltZW5zaW9uKlwiK3ZhbCtcIjwvb3B0aW9uPlwiKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGVmaW5lZERpbWVuc2lvblJhdGlvIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWREaW1lbnNpb25SYXRpbylcclxuICAgICAgICBlbHNlIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoXCIxLjBcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jc3MoXCJ3aWR0aFwiLFwiODBweFwiKVxyXG4gICAgICAgIGZvcih2YXIgZj0wLjU7Zjw9NDtmKz0wLjUpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPndpZHRoICpcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWRFZGdlV2lkdGghPW51bGwpIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoZGVmaW5lZEVkZ2VXaWR0aClcclxuICAgICAgICBlbHNlIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoXCIyLjBcIilcclxuICAgIH1cclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2l6ZUFkanVzdFNlbGVjdG9yKVxyXG5cclxuICAgIFxyXG4gICAgc2l6ZUFkanVzdFNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBjaG9vc2VWYWw9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJkaW1lbnNpb25SYXRpb1wiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiZWRnZVdpZHRoXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuICAgIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnNhdmVWaXN1YWxEZWZpbml0aW9uPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2F2ZVZpc3VhbERlZmluaXRpb25cIiwgXCJQT1NUXCIsIHtcInZpc3VhbERlZmluaXRpb25Kc29uXCI6SlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0pfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmVsYXRpb25zaGlwSW5mbz1mdW5jdGlvbih2YWxpZFJlbGF0aW9uc2hpcHMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG4gICAgICAgIHZhciBsYWJlbD0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICBsYWJlbC50ZXh0KFwiUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbClcclxuICAgICAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS50YXJnZXQpe1xyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWwgY2xhc3M9J3czLWxpbWUnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KVxyXG4gICAgICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgY2xhc3M9J3czLWRhcmstZ3JheScgPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcImVudW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgICAgICAgICAgdmFyIHZhbHVlQXJyPVtdXHJcbiAgICAgICAgICAgIGpzb25JbmZvW2luZF0uZm9yRWFjaChlbGU9Pnt2YWx1ZUFyci5wdXNoKGVsZS5lbnVtVmFsdWUpfSlcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBsYWJlbDEuY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4JyxcIm1hcmdpbi1sZWZ0XCI6XCIycHhcIn0pXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbHVlQXJyLmpvaW4oKSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoanNvbkluZm9baW5kXSxjb250ZW50RE9NKVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9ICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9YXN5bmMgZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzPWF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdE1vZGVsc0RhdGFcIixcIlBPU1RcIixudWxsLFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGEocmVzLkRCTW9kZWxzLHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgaWYoalF1ZXJ5LmlzRW1wdHlPYmplY3QobW9kZWxBbmFseXplci5EVERMTW9kZWxzKSl7XHJcbiAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgdGhpcy5tb2RlbExpc3QuYXBwZW5kKHplcm9Nb2RlbEl0ZW0pXHJcbiAgICAgICAgemVyb01vZGVsSXRlbS5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBzaW1wbGVUcmVlKHRoaXMubW9kZWxMaXN0LCB7XHJcbiAgICAgICAgICAgIFwibGVhZk5hbWVQcm9wZXJ0eVwiOiBcImRpc3BsYXlOYW1lXCJcclxuICAgICAgICAgICAgLCBcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6IHRydWUsIFwiaGlkZUVtcHR5R3JvdXBcIjogdHJ1ZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMgPSAobG4pID0+IHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsQ2xhc3MgPSBsbi5sZWFmSW5mb1tcIkBpZFwiXVxyXG4gICAgICAgICAgICB2YXIgZGJNb2RlbEluZm89Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQobW9kZWxDbGFzcylcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGUgPSBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YSA9IG51bGxcclxuICAgICAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgICAgIHZhciBzaGFwZSA9IHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZSc+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgIGlmKGRiTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGlvdERpdj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6LTVweDtwYWRkaW5nOjBweCAycHg7dG9wOi05cHg7Ym9yZGVyLXJhZGl1czogM3B4O2ZvbnQtc2l6ZTo3cHgnPklvVDwvZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoaW90RGl2KVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIGltZ1NyYz1lbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSxjb2xvckNvZGUpKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgICAgICBpZihhdmFydGEpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGF2YXJ0YWltZz0kKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIrYXZhcnRhK1wiJz48L2ltZz5cIilcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaWNvbkRPTVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMgPSAobm9kZXNBcnIsIG1vdXNlQ2xpY2tEZXRhaWwpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRoZU5vZGUgPSBub2Rlc0FyclswXVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcIkBpZFwiXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBncm91cE5hbWVMaXN0ID0ge31cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXSA9IDFcclxuICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnIgPSBPYmplY3Qua2V5cyhncm91cE5hbWVMaXN0KVxyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWUgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykge1xyXG4gICAgICAgICAgICB2YXIgZ24gPSB0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sIEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLm1vZGVsTmFtZVRvR3JvdXBOYW1lPWZ1bmN0aW9uKG1vZGVsTmFtZSl7XHJcbiAgICB2YXIgbmFtZVBhcnRzPW1vZGVsTmFtZS5zcGxpdChcIjpcIilcclxuICAgIGlmKG5hbWVQYXJ0cy5sZW5ndGg+PTIpICByZXR1cm4gbmFtZVBhcnRzWzFdXHJcbiAgICBlbHNlIHJldHVybiBcIk90aGVyc1wiXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVE1vZGVsRWRpdGVkXCIpIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkY2FzdFwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxNYW5hZ2VyRGlhbG9nKCk7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxOTVweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj5Mb2cgb3V0PC9hPjwvZGl2PicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+4piwPC9hPicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PnsgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKSB9KVxyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbignOmZpcnN0Jykub24oXCJjbGlja1wiLCgpPT57dGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpfSlcclxuICAgIFxyXG4gICAgdmFyIGFsbE1vZGV1bHM9dGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbihcImFcIilcclxuICAgICQoYWxsTW9kZXVsc1swXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkZXZpY2VtYW5hZ2VtZW50Lmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbiAgICAkKGFsbE1vZGV1bHNbMV0pLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1syXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJldmVudGxvZ21vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzNdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBtYWluV2luZG93UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbiAgICAgICAgbXlNU0FMT2JqLmxvZ291dFBvcHVwKGxvZ291dFJlcXVlc3QpO1xyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kdWxlU3dpdGNoRGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbmV3VHdpbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JbmZvKSB7XHJcbiAgICB0aGlzLm9yaWdpbmFsVHdpbkluZm89SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0d2luSW5mbykpXHJcbiAgICB0aGlzLnR3aW5JbmZvPXR3aW5JbmZvXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MjBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BZGQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4geyB0aGlzLmFkZE5ld1R3aW4oKSB9KVxyXG4gICAgXHJcbiAgICB2YXIgYWRkQW5kQ2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlO21hcmdpbi1sZWZ0OjVweFwiPkFkZCAmIENsb3NlPC9idXR0b24+JykgICAgXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChhZGRBbmRDbG9zZUJ1dHRvbilcclxuICAgIGFkZEFuZENsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge3RoaXMuYWRkTmV3VHdpbihcIkNsb3NlRGlhbG9nXCIpfSlcclxuICAgICAgICBcclxuICAgIHZhciBJRExhYmxlRGl2PSAkKFwiPGRpdiBjbGFzcz0ndzMtcGFkZGluZycgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlR3aW4gSUQ8L2Rpdj5cIilcclxuICAgIHZhciBJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O3dpZHRoOjE1MHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwiSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB0aGlzLklESW5wdXQ9SURJbnB1dCBcclxuICAgIHZhciBtb2RlbElEPXR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgbW9kZWxMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Nb2RlbDwvZGl2PlwiKVxyXG4gICAgdmFyIG1vZGVsSW5wdXQ9JCgnPGRpdiB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O2Rpc3BsYXk6aW5saW5lXCIvPicpLnRleHQobW9kZWxJRCk7ICBcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJChcIjxkaXYvPlwiKS5hcHBlbmQoSURMYWJsZURpdixJRElucHV0KSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJChcIjxkaXYgc3R5bGU9J3BhZGRpbmc6OHB4IDBweCcvPlwiKS5hcHBlbmQobW9kZWxMYWJsZURpdixtb2RlbElucHV0KSlcclxuICAgIElESW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgIHRoaXMudHdpbkluZm9bXCIkZHRJZFwiXT0kKGUudGFyZ2V0KS52YWwoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRE9NPSQoJzxkaXYgLz4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChkaWFsb2dET00pICAgIFxyXG4gICAgdmFyIHRpdGxlVGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICB0aXRsZVRhYmxlLmFwcGVuZCgkKCc8dHI+PHRkIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPlByb3BlcnRpZXMgVHJlZTwvdGQ+PC90cj4nKSlcclxuICAgIGRpYWxvZ0RPTS5hcHBlbmQoJChcIjxkaXYgY2xhc3M9J3czLWNvbnRhaW5lcicvPlwiKS5hcHBlbmQodGl0bGVUYWJsZSkpXHJcblxyXG4gICAgdmFyIHNldHRpbmdzRGl2PSQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXIgdzMtYm9yZGVyJyBzdHlsZT0nd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjMxMHB4O292ZXJmbG93OmF1dG8nPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5zZXR0aW5nc0Rpdj1zZXR0aW5nc0RpdlxyXG4gICAgZGlhbG9nRE9NLmFwcGVuZChzZXR0aW5nc0RpdilcclxuICAgIHRoaXMuZHJhd01vZGVsU2V0dGluZ3MoKVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5hZGROZXdUd2luID0gYXN5bmMgZnVuY3Rpb24oY2xvc2VEaWFsb2cpIHtcclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBEQk1vZGVsSW5mbz1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQk1vZGVsQnlJRChtb2RlbElEKVxyXG5cclxuICAgIGlmKCF0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl18fHRoaXMudHdpbkluZm9bXCIkZHRJZFwiXT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBjb21wb25lbnRzTmFtZUFycj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uaW5jbHVkZWRDb21wb25lbnRzXHJcbiAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgIGlmKHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdGhpcy50d2luSW5mb1tvbmVDb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgIHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV1bXCIkbWV0YWRhdGFcIl09IHt9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vYXNrIHRhc2ttYXN0ZXIgdG8gYWRkIHRoZSB0d2luXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHBvc3RCb2R5PSB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHRoaXMudHdpbkluZm8pfVxyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vdXBzZXJ0RGlnaXRhbFR3aW5cIiwgXCJQT1NUXCIsIHBvc3RCb2R5LFwid2l0aFByb2plY3RJRFwiIClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihkYXRhLkRCVHdpbikgICAgXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oZGF0YS5BRFRUd2luKVxyXG5cclxuXHJcbiAgICAvL2FzayB0YXNrbWFzdGVyIHRvIHByb3Zpc2lvbiB0aGUgdHdpbiB0byBpb3QgaHViIGlmIHRoZSBtb2RlbCBpcyBhIGlvdCBkZXZpY2UgbW9kZWxcclxuICAgIGlmKERCTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHBvc3RCb2R5PSB7XCJEQlR3aW5cIjpkYXRhLkRCVHdpbixcImRlc2lyZWRJbkRldmljZVR3aW5cIjp7fX1cclxuICAgICAgICAgICAgREJNb2RlbEluZm8uZGVzaXJlZFByb3BlcnRpZXMuZm9yRWFjaChlbGU9PntcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWU9ZWxlLnBhdGhbZWxlLnBhdGgubGVuZ3RoLTFdXHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlTYW1wbGVWPSBcIlwiXHJcbiAgICAgICAgICAgICAgICBwb3N0Qm9keS5kZXNpcmVkSW5EZXZpY2VUd2luW3Byb3BlcnR5TmFtZV09cHJvcGVydHlTYW1wbGVWXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHZhciBwcm92aXNpb25lZERvY3VtZW50ID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGV2aWNlbWFuYWdlbWVudC9wcm92aXNpb25Jb1REZXZpY2VUd2luXCIsIFwiUE9TVFwiLCBwb3N0Qm9keSxcIndpdGhQcm9qZWN0SURcIiApXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEuREJUd2luPXByb3Zpc2lvbmVkRG9jdW1lbnRcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihwcm92aXNpb25lZERvY3VtZW50KSAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8vaXQgc2hvdWxkIHNlbGVjdCB0aGUgbmV3IG5vZGUgaW4gdGhlIHRyZWUsIGFuZCBtb3ZlIHRvcG9sb2d5IHZpZXcgdG8gc2hvdyB0aGUgbmV3IG5vZGUgKG5vdGUgcGFuIHRvIGEgcGxhY2UgdGhhdCBpcyBub3QgYmxvY2tlZCBieSB0aGUgZGlhbG9nIGl0c2VsZilcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5cIiwgXCJ0d2luSW5mb1wiOiBkYXRhLkFEVFR3aW4sIFwiREJUd2luSW5mb1wiOmRhdGEuREJUd2lufSlcclxuXHJcbiAgICBpZihjbG9zZURpYWxvZyl0aGlzLkRPTS5oaWRlKClcclxuICAgIGVsc2V7XHJcbiAgICAgICAgLy9jbGVhciB0aGUgaW5wdXQgZWRpdGJveFxyXG4gICAgICAgIHRoaXMucG9wdXAodGhpcy5vcmlnaW5hbFR3aW5JbmZvKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3TW9kZWxTZXR0aW5ncyA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG1vZGVsSUQ9dGhpcy50d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXVxyXG4gICAgdmFyIG1vZGVsRGV0YWlsPSBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgIHZhciBjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5PUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobW9kZWxEZXRhaWwuZWRpdGFibGVQcm9wZXJ0aWVzKSlcclxuICAgIFxyXG4gICAgaWYoJC5pc0VtcHR5T2JqZWN0KGNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHkpKXtcclxuICAgICAgICB0aGlzLnNldHRpbmdzRGl2LnRleHQoXCJUaGVyZSBpcyBubyBlZGl0YWJsZSBwcm9wZXJ0eVwiKVxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3NEaXYuYWRkQ2xhc3MoXCJ3My10ZXh0LWdyYXlcIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9ICAgXHJcblxyXG4gICAgdmFyIHNldHRpbmdzVGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICB0aGlzLnNldHRpbmdzRGl2LmFwcGVuZChzZXR0aW5nc1RhYmxlKVxyXG5cclxuICAgIHZhciBpbml0aWFsUGF0aEFycj1bXVxyXG4gICAgdmFyIGxhc3RSb290Tm9kZVJlY29yZD1bXVxyXG4gICAgdGhpcy5kcmF3RWRpdGFibGUoc2V0dGluZ3NUYWJsZSxjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5LGluaXRpYWxQYXRoQXJyLGxhc3RSb290Tm9kZVJlY29yZClcclxufVxyXG5cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLmRyYXdFZGl0YWJsZSA9IGFzeW5jIGZ1bmN0aW9uKHBhcmVudFRhYmxlLGpzb25JbmZvLHBhdGhBcnIsbGFzdFJvb3ROb2RlUmVjb3JkKSB7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pIGFyci5wdXNoKGluZClcclxuXHJcbiAgICBmb3IodmFyIHRoZUluZGV4PTA7dGhlSW5kZXg8YXJyLmxlbmd0aDt0aGVJbmRleCsrKXtcclxuICAgICAgICBpZih0aGVJbmRleD09YXJyLmxlbmd0aC0xKSBsYXN0Um9vdE5vZGVSZWNvcmRbcGF0aEFyci5sZW5ndGhdID10cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbmQgPSBhcnJbdGhlSW5kZXhdXHJcbiAgICAgICAgdmFyIHRyPSQoXCI8dHIvPlwiKVxyXG4gICAgICAgIHZhciByaWdodFREPSQoXCI8dGQgc3R5bGU9J2hlaWdodDozMHB4Jy8+XCIpXHJcbiAgICAgICAgdHIuYXBwZW5kKHJpZ2h0VEQpXHJcbiAgICAgICAgcGFyZW50VGFibGUuYXBwZW5kKHRyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgaWYoIWxhc3RSb290Tm9kZVJlY29yZFtpXSkgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdigyKSlcclxuICAgICAgICAgICAgZWxzZSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDQpKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhlSW5kZXg9PWFyci5sZW5ndGgtMSkgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdigzKSlcclxuICAgICAgICBlbHNlIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMSkpXHJcblxyXG4gICAgICAgIHZhciBwTmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZmxvYXQ6bGVmdDtsaW5lLWhlaWdodDoyOHB4O21hcmdpbi1sZWZ0OjNweCc+XCIraW5kK1wiPC9kaXY+XCIpXHJcbiAgICAgICAgcmlnaHRURC5hcHBlbmQocE5hbWVEaXYpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKSB7IC8vaXQgaXMgYSBlbnVtZXJhdG9yXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3BEb3duQm94KHJpZ2h0VEQsbmV3UGF0aCxqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUocGFyZW50VGFibGUsanNvbkluZm9baW5kXSxuZXdQYXRoLGxhc3RSb290Tm9kZVJlY29yZClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHg7cGFkZGluZzoycHg7d2lkdGg6MjAwcHg7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICByaWdodFRELmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcImRhdGFUeXBlXCIsIGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGFJbnB1dC5jaGFuZ2UoKGUpPT57XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKCQoZS50YXJnZXQpLmRhdGEoXCJwYXRoXCIpLCQoZS50YXJnZXQpLnZhbCgpLCQoZS50YXJnZXQpLmRhdGEoXCJkYXRhVHlwZVwiKSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3RHJvcERvd25Cb3g9ZnVuY3Rpb24ocmlnaHRURCxuZXdQYXRoLHZhbHVlQXJyKXtcclxuICAgIHZhciBhU2VsZWN0TWVudSA9IG5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCJcclxuICAgICAgICAsIHsgd2lkdGg6IFwiMjAwXCIgXHJcbiAgICAgICAgICAgICxidXR0b25DU1M6IHsgXCJwYWRkaW5nXCI6IFwiNHB4IDE2cHhcIn1cclxuICAgICAgICAgICAgLCBcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjogMjUvLyxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6MjEwXHJcbiAgICAgICAgICAgICwgXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOiB0aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgICAgIH0pXHJcblxyXG5cclxuICAgIHJpZ2h0VEQuYXBwZW5kKGFTZWxlY3RNZW51LnJvd0RPTSkgIC8vdXNlIHJvd0RPTSBpbnN0ZWFkIG9mIERPTSB0byBhbGxvdyBzZWxlY3Qgb3B0aW9uIHdpbmRvdyBmbG9hdCBhYm92ZSBkaWFsb2dcclxuICAgIGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgdmFsdWVBcnIuZm9yRWFjaCgob25lT3B0aW9uKSA9PiB7XHJcbiAgICAgICAgdmFyIHN0ciA9IG9uZU9wdGlvbltcImRpc3BsYXlOYW1lXCJdIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXVxyXG4gICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICB9KVxyXG4gICAgYVNlbGVjdE1lbnUuY2FsbEJhY2tfY2xpY2tPcHRpb24gPSAob3B0aW9uVGV4dCwgb3B0aW9uVmFsdWUsIHJlYWxNb3VzZUNsaWNrKSA9PiB7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGlmIChyZWFsTW91c2VDbGljaykgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksIG9wdGlvblZhbHVlLCBcInN0cmluZ1wiKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZT1mdW5jdGlvbihwYXRoQXJyLG5ld1ZhbCxkYXRhVHlwZSl7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUpzb249dGhpcy50d2luSW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG5cclxuICAgICAgICBpZihpPT1wYXRoQXJyLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgdGhlSnNvbltrZXldPW5ld1ZhbFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGVKc29uW2tleV09PW51bGwpIHRoZUpzb25ba2V5XT17fVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLnRyZWVMaW5lRGl2ID0gZnVuY3Rpb24odHlwZU51bWJlcikge1xyXG4gICAgdmFyIHJlRGl2PSQoJzxkaXYgc3R5bGU9XCJtYXJnaW4tbGVmdDoxMHB4O3dpZHRoOjE1cHg7aGVpZ2h0OiAxMDAlO2Zsb2F0OiBsZWZ0XCI+PC9kaXY+JylcclxuICAgIGlmKHR5cGVOdW1iZXI9PTEpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWJvdHRvbSB3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09Mil7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09Myl7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItYm90dG9tIHczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT00KXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIHJldHVybiByZURpdlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBuZXdUd2luRGlhbG9nKCk7IiwiZnVuY3Rpb24gc2ltcGxlQ29uZmlybURpYWxvZygpe1xyXG4gICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAyXCIgY2xhc3M9XCJ3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgLy90aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLnNob3c9ZnVuY3Rpb24oY3NzT3B0aW9ucyxvdGhlck9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET00uY3NzKGNzc09wdGlvbnMpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj4nICsgb3RoZXJPcHRpb25zLnRpdGxlICsgJzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKSB9KVxyXG5cclxuICAgIHZhciBkaWFsb2dEaXY9JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwibWFyZ2luLXRvcDoxMHB4O21hcmdpbi1ib3R0b206MTBweFwiPjwvZGl2PicpXHJcbiAgICBkaWFsb2dEaXYudGV4dChvdGhlck9wdGlvbnMuY29udGVudClcclxuICAgIHRoaXMuRE9NLmFwcGVuZChkaWFsb2dEaXYpXHJcbiAgICB0aGlzLmRpYWxvZ0Rpdj1kaWFsb2dEaXZcclxuXHJcbiAgICB0aGlzLmJvdHRvbUJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJvdHRvbUJhcilcclxuXHJcbiAgICBvdGhlck9wdGlvbnMuYnV0dG9ucy5mb3JFYWNoKGJ0bj0+e1xyXG4gICAgICAgIHZhciBhQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtcmlnaHQgJysoYnRuLmNvbG9yQ2xhc3N8fFwiXCIpKydcIiBzdHlsZT1cIm1hcmdpbi1yaWdodDoycHg7bWFyZ2luLWxlZnQ6MnB4XCI+JytidG4udGV4dCsnPC9idXR0b24+JylcclxuICAgICAgICBhQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgYnRuLmNsaWNrRnVuYygpICB9ICApXHJcbiAgICAgICAgdGhpcy5ib3R0b21CYXIuYXBwZW5kKGFCdXR0b24pICAgIFxyXG4gICAgfSlcclxuICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuY2xvc2U9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLnJlbW92ZSgpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlQ29uZmlybURpYWxvZzsiLCJmdW5jdGlvbiBzaW1wbGVTZWxlY3RNZW51KGJ1dHRvbk5hbWUsb3B0aW9ucyl7XHJcbiAgICBvcHRpb25zPW9wdGlvbnN8fHt9IC8ve2lzQ2xpY2thYmxlOjEsd2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiXCIsY29sb3JDbGFzczpcIlwiLGJ1dHRvbkNTUzpcIlwifVxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5pc0NsaWNrYWJsZT10cnVlXHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNsaWNrXCI+PC9kaXY+JylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1ob3ZlciBcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLm9uKFwibW91c2VvdmVyXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy9pdCBzZWVtcyB0aGF0IHRoZSBzZWxlY3QgbWVudSBvbmx5IGNhbiBzaG93IG91dHNpZGUgb2YgYSBwYXJlbnQgc2Nyb2xsYWJsZSBkb20gd2hlbiBpdCBpcyBpbnNpZGUgYSB3My1iYXIgaXRlbS4uLiBub3QgdmVyeSBzdXJlIGFib3V0IHdoeSBcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLWxlZnQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5jc3MoXCJ3aWR0aFwiLChvcHRpb25zLndpZHRofHwxMDApK1wicHhcIilcclxuICAgIHRoaXMucm93RE9NPXJvd0RPTVxyXG4gICAgdGhpcy5yb3dET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgXHJcbiAgICB0aGlzLmJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uXCIgc3R5bGU9XCJvdXRsaW5lOiBub25lO1wiPjxhPicrYnV0dG9uTmFtZSsnPC9hPjxhIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZDtwYWRkaW5nLWxlZnQ6MnB4XCI+PC9hPjxpIGNsYXNzPVwiZmEgZmEtY2FyZXQtZG93blwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjNweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgaWYob3B0aW9ucy53aXRoQm9yZGVyKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhcInczLWJvcmRlclwiKVxyXG4gICAgaWYob3B0aW9ucy5mb250U2l6ZSkgdGhpcy5ET00uY3NzKFwiZm9udC1zaXplXCIsb3B0aW9ucy5mb250U2l6ZSlcclxuICAgIGlmKG9wdGlvbnMuY29sb3JDbGFzcykgdGhpcy5idXR0b24uYWRkQ2xhc3Mob3B0aW9ucy5jb2xvckNsYXNzKVxyXG4gICAgaWYob3B0aW9ucy53aWR0aCkgdGhpcy5idXR0b24uY3NzKFwid2lkdGhcIixvcHRpb25zLndpZHRoKVxyXG4gICAgaWYob3B0aW9ucy5idXR0b25DU1MpIHRoaXMuYnV0dG9uLmNzcyhvcHRpb25zLmJ1dHRvbkNTUylcclxuICAgIGlmKG9wdGlvbnMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3I9b3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvclxyXG5cclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY29udGVudCB3My1iYXItYmxvY2sgdzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7aGVpZ2h0Om9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCtcInB4XCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJvdmVyZmxvdy14XCI6XCJ2aXNpYmxlXCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wKSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi10b3BcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ArXCJweFwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQpIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLWxlZnRcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0K1wicHhcIn0pXHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJ1dHRvbix0aGlzLm9wdGlvbkNvbnRlbnRET00pXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG5cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuYnV0dG9uLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25Db250ZW50RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbEJhY2tfYmVmb3JlQ2xpY2tFeHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSkgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5vcHRpb25Db250ZW50RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcImNvbG9yQ2xhc3NcIjphbk9wdGlvbi5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxjb2xvckNsYXNzKXtcclxuICAgIHZhciBvcHRpb25JdGVtPSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj4nK29wdGlvblRleHQrJzwvYT4nKVxyXG4gICAgaWYoY29sb3JDbGFzcykgb3B0aW9uSXRlbS5hZGRDbGFzcyhjb2xvckNsYXNzKVxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFwcGVuZChvcHRpb25JdGVtKVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIixvcHRpb25WYWx1ZXx8b3B0aW9uVGV4dClcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIixjb2xvckNsYXNzKVxyXG4gICAgb3B0aW9uSXRlbS5vbignY2xpY2snLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICAgICAgaWYodGhpcy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IC8vdGhpcyBpcyB0byBoaWRlIHRoZSBkcm9wIGRvd24gbWVudSBhZnRlciBjbGlja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ob3B0aW9uVGV4dCxvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcInJlYWxNb3VzZUNsaWNrXCIsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxudWxsLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvblZhbHVlPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciByZT10aGlzLmZpbmRPcHRpb24ob3B0aW9uVmFsdWUpXHJcbiAgICBpZihyZT09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbFxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9cmUudmFsdWVcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHJlLnRleHQscmUudmFsdWUsbnVsbCxyZS5jb2xvckNsYXNzKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2xlYXJPcHRpb25zPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUpe1xyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmVtcHR5KClcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNhbGxCYWNrX2NsaWNrT3B0aW9uPWZ1bmN0aW9uKG9wdGlvbnRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spe1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19iZWZvcmVDbGlja0V4cGFuZD1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcblxyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2Nyb2xsVG9MZWFmTm9kZT1mdW5jdGlvbihhTm9kZSl7XHJcbiAgICB2YXIgc2Nyb2xsVG9wPXRoaXMuRE9NLnNjcm9sbFRvcCgpXHJcbiAgICB2YXIgdHJlZUhlaWdodD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIG5vZGVQb3NpdGlvbj1hTm9kZS5ET00ucG9zaXRpb24oKS50b3AgLy93aGljaCBkb2VzIG5vdCBjb25zaWRlciBwYXJlbnQgRE9NJ3Mgc2Nyb2xsIGhlaWdodFxyXG4gICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsdHJlZUhlaWdodCxub2RlUG9zaXRpb24pXHJcbiAgICBpZih0cmVlSGVpZ2h0LTUwPG5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIG5vZGVQb3NpdGlvbi0odHJlZUhlaWdodC01MCkpIFxyXG4gICAgfWVsc2UgaWYobm9kZVBvc2l0aW9uPDUwKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgKG5vZGVQb3NpdGlvbi01MCkpIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5jbGVhckFsbExlYWZOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmxpc3RET00uZW1wdHkoKVxyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD0wXHJcbiAgICAgICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmlyc3RMZWFmTm9kZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgZmlyc3RMZWFmTm9kZT1udWxsO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGZpcnN0TGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBmaXJzdExlYWZOb2RlPWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGZpcnN0TGVhZk5vZGVcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dEdyb3VwTm9kZT1mdW5jdGlvbihhR3JvdXBOb2RlKXtcclxuICAgIGlmKGFHcm91cE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBpbmRleD10aGlzLmdyb3VwTm9kZXMuaW5kZXhPZihhR3JvdXBOb2RlKVxyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXsgLy9yb3RhdGUgYmFja3dhcmQgdG8gZmlyc3QgZ3JvdXAgbm9kZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbMF0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRMZWFmTm9kZT1mdW5jdGlvbihhTGVhZk5vZGUpe1xyXG4gICAgaWYoYUxlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYUdyb3VwTm9kZT1hTGVhZk5vZGUucGFyZW50R3JvdXBOb2RlXHJcbiAgICB2YXIgaW5kZXg9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKGFMZWFmTm9kZSlcclxuICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIC8vbmV4dCBub2RlIGlzIGluIHNhbWUgZ3JvdXBcclxuICAgICAgICByZXR1cm4gYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9maW5kIG5leHQgZ3JvdXAgZmlyc3Qgbm9kZVxyXG4gICAgICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgbmV4dEdyb3VwTm9kZSA9IHRoaXMubmV4dEdyb3VwTm9kZShhR3JvdXBOb2RlKVxyXG4gICAgICAgICAgICBpZihuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgICAgICBhR3JvdXBOb2RlPW5leHRHcm91cE5vZGVcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWFyY2hUZXh0PWZ1bmN0aW9uKHN0cil7XHJcbiAgICBpZihzdHI9PVwiXCIpIHJldHVybiBudWxsO1xyXG4gICAgLy9zZWFyY2ggZnJvbSBjdXJyZW50IHNlbGVjdCBpdGVtIHRoZSBuZXh0IGxlYWYgaXRlbSBjb250YWlucyB0aGUgdGV4dFxyXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChzdHIsICdpJyk7XHJcbiAgICB2YXIgc3RhcnROb2RlXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgc3RhcnROb2RlPXRoaXMuZmlyc3RMZWFmTm9kZSgpXHJcbiAgICAgICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHRoZVN0cj1zdGFydE5vZGUubmFtZTtcclxuICAgICAgICBpZih0aGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlIFxyXG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2Ugc3RhcnROb2RlPXRoaXMuc2VsZWN0ZWROb2Rlc1swXVxyXG5cclxuICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIHZhciBmcm9tTm9kZT1zdGFydE5vZGU7XHJcbiAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICB2YXIgbmV4dE5vZGU9dGhpcy5uZXh0TGVhZk5vZGUoZnJvbU5vZGUpXHJcbiAgICAgICAgaWYobmV4dE5vZGU9PXN0YXJ0Tm9kZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIG5leHROb2RlU3RyPW5leHROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYobmV4dE5vZGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmcm9tTm9kZT1uZXh0Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5nZXRBbGxMZWFmTm9kZUFycj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGFsbExlYWY9W11cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57XHJcbiAgICAgICAgYWxsTGVhZj1hbGxMZWFmLmNvbmNhdChnbi5jaGlsZExlYWZOb2RlcylcclxuICAgIH0pXHJcbiAgICByZXR1cm4gYWxsTGVhZjtcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIHZhciBuZXdBcnI9W10uY29uY2F0KHRoaXMuc2VsZWN0ZWROb2RlcylcclxuICAgIG5ld0Fyci5wdXNoKGxlYWZOb2RlKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGFycil7XHJcbiAgICB2YXIgbmV3QXJyID0gdGhpcy5zZWxlY3RlZE5vZGVzXHJcbiAgICB2YXIgZmlsdGVyQXJyPWFyci5maWx0ZXIoKGl0ZW0pID0+IG5ld0Fyci5pbmRleE9mKGl0ZW0pIDwgMClcclxuICAgIG5ld0FyciA9IG5ld0Fyci5jb25jYXQoZmlsdGVyQXJyKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZShncm91cE5vZGUuaW5mbylcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGVBcnI9ZnVuY3Rpb24obGVhZk5vZGVBcnIsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uZGltKClcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz10aGlzLnNlbGVjdGVkTm9kZXMuY29uY2F0KGxlYWZOb2RlQXJyKVxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmhpZ2hsaWdodCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXModGhpcy5zZWxlY3RlZE5vZGVzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRibENsaWNrTm9kZT1mdW5jdGlvbih0aGVOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUodGhlTm9kZSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc29ydEFsbExlYXZlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLnNvcnROb2Rlc0J5TmFtZSgpfSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBncm91cCBub2RlLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVHcm91cE5vZGUocGFyZW50VHJlZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRUcmVlPXBhcmVudFRyZWVcclxuICAgIHRoaXMuaW5mbz1vYmpcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXM9W10gLy9pdCdzIGNoaWxkIGxlYWYgbm9kZXMgYXJyYXlcclxuICAgIHRoaXMubmFtZT1vYmouZGlzcGxheU5hbWU7XHJcbiAgICB0aGlzLmNyZWF0ZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnJlZnJlc2hOYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTS5lbXB0eSgpXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ3My1saW1lXCJcclxuICAgIGVsc2UgdmFyIGxibENvbG9yPVwidzMtZ3JheVwiIFxyXG4gICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuXHJcbiAgICBcclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgaWYoaWNvbkxhYmVsKXtcclxuICAgICAgICAgICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J1wiK2xibENvbG9yK1wiJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG5cclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyl7XHJcbiAgICAgICAgdmFyIHRhaWxCdXR0b249dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQodGFpbEJ1dHRvbilcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyXCIgc3R5bGU9XCJwYWRkaW5nOjhweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRUcmVlLnNlbGVjdEdyb3VwTm9kZSh0aGlzKSAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuaXNPcGVuPWZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gIHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmV4cGFuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNsaWNrU2VsZj1mdW5jdGlvbihtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVkcmF3TGFiZWwoKVxyXG5cclxuXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgICAgIH1lbHNlIGlmKGUuc2hpZnRLZXkpe1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsTGVhZk5vZGVBcnI9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5nZXRBbGxMZWFmTm9kZUFycigpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgxID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZSlcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDIgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMpXHJcbiAgICAgICAgICAgICAgICBpZihpbmRleDE9PS0xIHx8IGluZGV4Mj09LTEpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZWN0IGFsbCBsZWFmIGJldHdlZW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXJJPSBNYXRoLm1pbihpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWdoZXJJPSBNYXRoLm1heChpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaWRkbGVBcnI9YWxsTGVhZk5vZGVBcnIuc2xpY2UobG93ZXJJLGhpZ2hlckkpICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbWlkZGxlQXJyLnB1c2goYWxsTGVhZk5vZGVBcnJbaGlnaGVySV0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbihtaWRkbGVBcnIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoY2xpY2tEZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLnJlZHJhd0xhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcblxyXG4gICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgIHZhciByb3dIZWlnaHQ9aWNvbkxhYmVsLmhlaWdodCgpXHJcbiAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lRGl2KVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyJdfQ==
