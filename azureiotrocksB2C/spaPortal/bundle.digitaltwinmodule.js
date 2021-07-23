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
const mapDOM=require("./mapDOM.js")
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
const floatInfoWindow=require("./floatInfoWindow")

function digitaltwinmoduleUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()

    this.mapDOM = new mapDOM($('#canvas'))

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
         mainToolbar,this.topologyInstance,this.mapDOM,infoPanel,newTwinDialog,floatInfoWindow]

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
},{"../globalAppSettings.js":13,"../msalHelper":14,"../sharedSourceFiles/modelEditorDialog":18,"../sharedSourceFiles/modelManagerDialog":19,"../sharedSourceFiles/newTwinDialog":21,"./editLayoutDialog":5,"./floatInfoWindow":6,"./infoPanel":7,"./mainToolbar":8,"./mapDOM.js":9,"./startSelectionDialog":10,"./topologyDOM.js":11,"./twinsTree":12}],5:[function(require,module,exports){
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/simpleConfirmDialog":23,"../sharedSourceFiles/simpleSelectMenu":24}],6:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const globalCache = require("../sharedSourceFiles/globalCache")

function floatInfoWindow() {
    if(!this.DOM){
        this.DOM=$('<div class="w3-card" style="padding:10px; position:absolute;z-index:101;min-height:120px"></div>')
        this.hideSelf()
        this.DOM.css("background-color","rgba(255, 255, 255, 0.9)")
        $('body').append(this.DOM)
    }
}

floatInfoWindow.prototype.hideSelf=function(msgPayload){
    this.DOM.hide()
    this.DOM.css("width","0px") 
}
floatInfoWindow.prototype.showSelf=function(msgPayload){
    this.DOM.css("width","295px")
    this.DOM.show()
}

floatInfoWindow.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="topologyMouseOut"){
        this.hideSelf()
    }else if(msgPayload.message=="showInfoHoveredEle"){
        if(!globalCache.showFloatInfoPanel) return;
        this.DOM.empty()
        
        var arr=msgPayload.info;
        if(arr==null || arr.length==0)  return;
        this.DOM.css("left","-2000px") //it is always outside of browser so it wont block mouse and cause mouse out
        this.showSelf()
        
        var documentBodyWidth=$('body').width()

        var singleElementInfo=arr[0];
        if(singleElementInfo["$dtId"]){// select a node
            this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
            var modelName=singleElementInfo['$metadata']['$model']
            
            if(modelAnalyzer.DTDLModels[modelName]){
                this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
            }
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
        }else if(singleElementInfo["$sourceId"]){
            this.drawStaticInfo(this.DOM,{
                "$sourceId":singleElementInfo["$sourceId"],
                "$targetId":singleElementInfo["$targetId"],
                "$relationshipName":singleElementInfo["$relationshipName"]
            },"1em","13px")
            this.drawStaticInfo(this.DOM,{
                "$relationshipId":singleElementInfo["$relationshipId"]
            },"1em","10px")
            var relationshipName=singleElementInfo["$relationshipName"]
            var sourceModel=singleElementInfo["sourceModel"]
            
            this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
        }

        var screenXY= msgPayload.screenXY
        var windowLeft=screenXY.x+50

        if(windowLeft+this.DOM.outerWidth()+10>documentBodyWidth) {
            windowLeft=documentBodyWidth-this.DOM.outerWidth()-10
        }
        var windowTop = screenXY.y-this.DOM.outerHeight()-50
        if(windowTop<5) windowTop=5
        this.DOM.css({"left":windowLeft+"px", "top":windowTop+"px"})
    }
}

floatInfoWindow.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

floatInfoWindow.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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

floatInfoWindow.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(typeof(jsonInfo[ind])==="object" && !Array.isArray(jsonInfo[ind])) {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
            var val=this.searchValue(originElementInfo,newPath)
            if(val==null){
                contentDOM.css({"color":"gray","font-size":"9px"})
                contentDOM.text("[empty]")
            }else contentDOM.text(val)
        }
        keyDiv.append(contentDOM)
    }
}

floatInfoWindow.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}



module.exports = new floatInfoWindow();
},{"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelAnalyzer":17}],7:[function(require,module,exports){
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
        if(!this.isMinimized) this.minimizeWindow()
        else this.expandWindow()
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

infoPanel.prototype.minimizeWindow=function(){
    this.continerDOM.animate({
        right: "-250px",
        height:"50px"
    })
    this.isMinimized=true;
}
infoPanel.prototype.expandWindow=function(){
    this.continerDOM.animate({
        right: "0px",
        height: "70%"
    })
    this.isMinimized=false;
}

infoPanel.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelectionDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="mapFlyingStart"){
        this.minimizeWindow()
    }else if(msgPayload.message=="mapFlyingEnd"){
        this.expandWindow()
    }else if(msgPayload.message=="mapSelectFeature") {
        if(msgPayload.DBTwin!=null){
            var twinID=msgPayload.DBTwin.id
            var adtTwin=globalCache.storedTwins[twinID]
            this.showInfoOfNodes([adtTwin])
        }
    }else if(msgPayload.message=="showInfoSelectedNodes" || msgPayload.message=="showInfoHoveredEle"){
        if (globalCache.showFloatInfoPanel && msgPayload.message=="showInfoHoveredEle") return; //the floating info window will show mouse over element information, do not change info panel content in this case
        this.showInfoOfNodes(msgPayload.info)
    }
}


infoPanel.prototype.showInfoOfNodes=function(arr){
    this.DOM.empty()
    if (arr == null || arr.length == 0) {
        this.drawButtons(null)
        this.selectedObjects = [];
        return;
    }
    this.selectedObjects = arr;
    if (arr.length == 1) {
        var singleElementInfo = arr[0];

        if (singleElementInfo["$dtId"]) {// select a node
            this.drawButtons("singleNode")

            //instead of draw the $dtId, draw display name instead
            //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
            this.drawStaticInfo(this.DOM, { "name": singleElementInfo["displayName"] }, "1em", "13px")


            var modelName = singleElementInfo['$metadata']['$model']

            if (modelAnalyzer.DTDLModels[modelName]) {
                this.drawEditable(this.DOM, modelAnalyzer.DTDLModels[modelName].editableProperties, singleElementInfo, [])
            }
            //instead of drawing the original infomration, draw more meaningful one
            //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
            this.drawStaticInfo(this.DOM, { "Model": singleElementInfo["$metadata"]["$model"] }, "1em", "10px")
            for (var ind in singleElementInfo["$metadata"]) {
                if (ind == "$model") continue;
                var tmpObj = {}
                tmpObj[ind] = singleElementInfo["$metadata"][ind]
                this.drawStaticInfo(this.DOM, tmpObj, "1em", "10px")
            }
        } else if (singleElementInfo["$sourceId"]) {
            this.drawButtons("singleRelationship")
            this.drawStaticInfo(this.DOM, {
                "$sourceId": singleElementInfo["$sourceId"],
                "$targetId": singleElementInfo["$targetId"],
                "$relationshipName": singleElementInfo["$relationshipName"]
            }, "1em", "13px")
            this.drawStaticInfo(this.DOM, {
                "$relationshipId": singleElementInfo["$relationshipId"]
            }, "1em", "10px")
            var relationshipName = singleElementInfo["$relationshipName"]
            var sourceModel = singleElementInfo["sourceModel"]

            this.drawEditable(this.DOM, this.getRelationShipEditableProperties(relationshipName, sourceModel), singleElementInfo, [])
            for (var ind in singleElementInfo["$metadata"]) {
                var tmpObj = {}
                tmpObj[ind] = singleElementInfo["$metadata"][ind]
                this.drawStaticInfo(this.DOM, tmpObj, "1em", "10px")
            }
            //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
        }
    } else if (arr.length > 1) {
        this.drawButtons("multiple")
        this.drawMultipleObj()
    }
}

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')    
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    }else{
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a>")
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
        var delBtn =  $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
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
    if (numOfNode > 1) {
        //some additional buttons when select multiple items
        this.drawAdvanceAlignmentButtons()
    }
}

infoPanel.prototype.drawAdvanceAlignmentButtons=async function(){
    var label=$("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>") 
    this.DOM.append(label) 
    var alignButtonsTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
    this.DOM.append(alignButtonsTable)
    var alignTopButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
    var alignLeftButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
    var alignRightButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
    var alignBottomButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
    alignButtonsTable.find("td").eq(1).append(alignTopButton)
    alignButtonsTable.find("td").eq(3).append(alignLeftButton)
    alignButtonsTable.find("td").eq(5).append(alignRightButton)
    alignButtonsTable.find("td").eq(7).append(alignBottomButton)


    var arrangeTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
    this.DOM.append(arrangeTable)

    var distributeHButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-h fa-lg"></i></button>') 
    var distributeVButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-v fa-lg"></i></button>') 
    var leftRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-undo-alt fa-lg"></i></button>') 
    var rightRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-redo-alt fa-lg"></i></button>') 
    var mirrorHButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-h"></i></button>') 
    var mirrorVButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-v"></i></button>')
    var expandButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-expand-arrows-alt"></i></button>') 
    var compressButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-compress-arrows-alt"></i></button>')
    
    arrangeTable.find("td").eq(0).append(distributeHButton)
    arrangeTable.find("td").eq(1).append(distributeVButton)
    arrangeTable.find("td").eq(2).append(leftRotateButton)
    arrangeTable.find("td").eq(3).append(rightRotateButton)
    arrangeTable.find("td").eq(4).append(mirrorHButton)
    arrangeTable.find("td").eq(5).append(mirrorVButton)
    arrangeTable.find("td").eq(6).append(expandButton)
    arrangeTable.find("td").eq(7).append(compressButton)


    alignTopButton.on("click", (e) => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "top" })
        $(document.activeElement).blur()
    })
    alignLeftButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    alignRightButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    alignBottomButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "bottom" })
        $(document.activeElement).blur()
    })

    distributeHButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    distributeVButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    leftRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    rightRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    mirrorHButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    mirrorVButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    expandButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "expand" })
        $(document.activeElement).blur()
    })
    compressButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "compress" })
        $(document.activeElement).blur()
    })
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
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            keyDiv.children(":first").addClass("w3-lime")
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelAnalyzer":17,"../sharedSourceFiles/simpleConfirmDialog":23,"../sharedSourceFiles/simpleSelectMenu":24}],8:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const globalCache = require("../sharedSourceFiles/globalCache")
const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")
const projectSettingDialog=require("../sharedSourceFiles/projectSettingDialog")

function mainToolbar() {
}

mainToolbar.prototype.render = function () {
    $("#mainToolBar").addClass("w3-bar w3-red")
    $("#mainToolBar").css({"z-index":100,"overflow":"visible"})

    this.switchProjectBtn=$('<a class="w3-bar-item w3-button" href="#">Project</a>')
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')
    //this.showForgeViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">ForgeView</a>')
    //this.showGISViewBtn=$('<a class="w3-bar-item w3-button" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit"></i></a>')
    this.floatInfoBtn=$('<a class="w3-bar-item w3-button w3-amber" style="height:100%;font-size:80%" href="#"><span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span></a>')


    this.testSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">Test SignalR</a>')
    this.testSendSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">send SignalR message</a>')

    this.settingBtn=$('<button class="w3-bar-item w3-button w3-right"><i class="fa fa-cog fa-lg"></i></button>')

    this.viewTypeSelector=new simpleSelectMenu("")
    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(moduleSwitchDialog.modulesSidebar)
    $("#mainToolBar").append(moduleSwitchDialog.modulesSwitchButton, this.switchProjectBtn,this.modelIOBtn,this.viewTypeSelector.  DOM,this.switchLayoutSelector.DOM,this.editLayoutBtn,this.floatInfoBtn
        //,this.testSignalRBtn,this.testSendSignalRBtn
        ,this.settingBtn
    )

    this.switchProjectBtn.on("click",()=>{ startSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.settingBtn.on("click",()=>{ projectSettingDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })
    this.floatInfoBtn.on("click",()=>{
        if(globalCache.showFloatInfoPanel) globalCache.showFloatInfoPanel=false
        else globalCache.showFloatInfoPanel=true
        if(!globalCache.showFloatInfoPanel){
            this.floatInfoBtn.removeClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-ban fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>')
        }else{
            this.floatInfoBtn.addClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span>')
        }
    })

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

    this.viewTypeSelector.addOption('Topology')
    this.viewTypeSelector.addOption('GIS')
    this.viewTypeSelector.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        this.viewTypeSelector.changeName(optionText)
        if(realMouseClick){
            if(globalCache.currentViewType == optionText) return;
            this.broadcastMessage({ "message": "viewTypeChange","viewType":optionText})
        }
        globalCache.currentViewType=optionText
    }
    this.viewTypeSelector.triggerOptionValue("Topology")

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
    }else if(msgPayload.message=="popupLayoutEditing"){
        editLayoutDialog.popup()
    }
}

module.exports = new mainToolbar();
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelManagerDialog":19,"../sharedSourceFiles/moduleSwitchDialog":20,"../sharedSourceFiles/projectSettingDialog":22,"../sharedSourceFiles/simpleSelectMenu":24,"./editLayoutDialog":5,"./startSelectionDialog":10}],9:[function(require,module,exports){
const globalCache = require("../sharedSourceFiles/globalCache")

function mapDOM(containerDOM){
    this.DOM=$("<div style='height:100%;width:100%'></div>")
    containerDOM.append(this.DOM)
    this.DOM.hide()

    this.subscriptionKey="jmQb_cjjgpEXq1wB6eRjsQHojUfI2XxgUpbAhiFqBtc"
    this.dataSetId= "e6fcbf83-ac33-ccab-f277-388a49254e8d"
    this.tileSetId="8a9b02e9-db04-2784-dc38-9b31c52160f2"

    this.map = new atlas.Map(this.DOM[0], {
        center:  [103.8394266, 1.31448053],
        zoom: 15,
        style: 'road_shaded_relief',
        view: 'Auto',
        authOptions: {
            authType: 'subscriptionKey',
            subscriptionKey: this.subscriptionKey
        }
    });

    this.map.events.add('ready', ()=> {this.initMap()})
}

mapDOM.prototype.initMap=function(){
    this.mapDataSource = new atlas.source.DataSource("twinPolygon");

    //Add a map style selection control.
    this.map.controls.add(new atlas.control.StyleControl({ mapStyles: "all" }), { position: "top-right" });
    //Create an indoor maps manager.
    this.indoorManager = new atlas.indoor.IndoorManager(this.map, {tilesetId: this.tileSetId});
    this.indoorManager.setOptions({levelControl: new atlas.control.LevelControl({ position: 'top-right' }) });
    this.indoorManager.setDynamicStyling(false)

    this.map.events.add("click",  (e)=> {
        var features = this.map.layers.getRenderedShapes(e.position, 'unit');
        if(features.length==0) return;
        var resultDBTwin=globalCache.getSingleDBTwinByIndoorFeatureID(features[0].properties.featureId)
        if(resultDBTwin!=null){
            this.highlightTwins([resultDBTwin])
            this.broadcastMessage({ "message": "mapSelectFeature","DBTwin":resultDBTwin})
        } 
    });
}

mapDOM.prototype.completeURL=function(apiPart){
    return 'https://us.atlas.microsoft.com/'+apiPart+'api-version=2.0&subscription-key='+this.subscriptionKey
}

mapDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="viewTypeChange"){
        if(msgPayload.viewType=="GIS") this.showSelf()
        else this.hideSelf()
    }else if(msgPayload.message=="showInfoSelectedNodes"){
        if(globalCache.currentViewType!="GIS") return;
        var selectedTwinsArr=msgPayload.info //the last item is the latest selected item
        
        var selectedDBTwins=[]
        selectedTwinsArr.forEach(aTwin=>{
            var twinID=aTwin['$dtId']
            if(!twinID) return;
            var theDBTwin=globalCache.getSingleDBTwinByID(twinID)
            selectedDBTwins.push(theDBTwin)
        })
        this.highlightTwins(selectedDBTwins)
    }
}

mapDOM.prototype.highlightTwins = function (dbTwins) {
    if(dbTwins.length==0) return;
    var latestDBTwin= dbTwins[dbTwins.length-1]
    
    //hide all twins highlight in GIS
    this.mapDataSource.clear()
    if(!latestDBTwin.GIS) return;
    
    //if there is a facility change, there is an animation to pan map, otherwise, donot pan map
    var info=this.indoorManager.getCurrentFacility()
    var curFacility=info[0]
    var curLevelNumber= info[1]
    var destFacility=latestDBTwin.GIS.indoor.facilityID
    if(curFacility!=destFacility){
        var coordinates= latestDBTwin.GIS.indoor.coordinates
        var destLL=coordinates[0][0]
        this.flyTo(destLL)
    }
    //choose the facility and level number
    if(destFacility!=curFacility || curLevelNumber!=latestDBTwin.GIS.indoor.levelOrdinal){
        this.indoorManager.setFacility(destFacility,latestDBTwin.GIS.indoor.levelOrdinal )
    }
    
    //highlight all selected twins in GIS
    dbTwins.forEach(oneDBTwin=>{
        this.drawOneTwinIndoorPolygon(oneDBTwin.GIS.indoor.coordinates)
    })
}

mapDOM.prototype.drawOneTwinIndoorPolygon = function (coordinates) {
    if(!this.map.sources.getById("twinPolygon")){
        this.map.sources.add(this.mapDataSource);
        this.map.layers.add(new atlas.layer.PolygonLayer(this.mapDataSource, null, {
            fillColor: "red",
            fillOpacity: 0.7
        }))
    } 
    this.mapDataSource.add(new atlas.Shape(new atlas.data.Feature(
        new atlas.data.Polygon(coordinates)
    )));
}

mapDOM.prototype.flyTo = function (destLL) {
    var curLoc=this.map.getCamera().center

    if(destLL[0]<curLoc[0]) var targetBounds=[destLL[0],destLL[1],curLoc[0],curLoc[1]]
    else targetBounds=[curLoc[0],curLoc[1], destLL[0],destLL[1]]

    this.map.setCamera({"bounds":targetBounds,
        "padding":{top: 80, bottom: 80, left: 80, right: 80},
    })
    this.broadcastMessage({ "message": "mapFlyingStart"})

    var marker = new atlas.HtmlMarker({color: 'DodgerBlue',text: '',position:curLoc});
    this.map.markers.add(marker);
    var path = [
        curLoc,destLL
    ];
    setTimeout(()=>{
        atlas.animations.moveAlongPath(path, marker, { duration: 1000, captureMetadata: true, autoPlay: true });
        setTimeout(()=>{
            this.broadcastMessage({ "message": "mapFlyingEnd"})
            this.map.setCamera({
                "center": destLL,
                "zoom": 19,
                "duration": 2000,
                "type": "fly"
            })
            setTimeout(()=>{this.map.markers.clear()},3500)
        },1000)
        
    },1000) 
}

mapDOM.prototype.getDistanceFromLatLonInKm = function (lonlat1, lonlat2) {
    var lon1=lonlat1[0]
    var lat1=lonlat1[1]
    var lon2=lonlat2[0]
    var lat2=lonlat2[1]

    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}

mapDOM.prototype.deg2rad = function (deg) {
    return deg * (Math.PI / 180)
}

mapDOM.prototype.showSelf = function (direction) {
    this.DOM.show()
    this.DOM.animate({height: "100%"},()=>{this.map.resize()});
}

mapDOM.prototype.hideSelf = function (direction) {
    this.DOM.animate({height: "0%"},()=>{this.DOM.hide()});
}

module.exports = mapDOM;
},{"../sharedSourceFiles/globalCache":16}],10:[function(require,module,exports){
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
        this.buttonHolder.append(appendButton,replaceButton)
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
    if(this.previousSelectedProject!=globalCache.currentProjectID){
        globalCache.initStoredInformtion()
        this.previousSelectedProject=globalCache.currentProjectID
    }

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
},{"../msalHelper":14,"../sharedSourceFiles/editProjectDialog":15,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelAnalyzer":17,"../sharedSourceFiles/modelManagerDialog":19,"../sharedSourceFiles/simpleSelectMenu":24}],11:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(containerDOM){
    this.DOM=$("<div style='height:100%;width:100%'></div>")
    containerDOM.append(this.DOM)
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

    var ur = this.core.undoRedo({isDebug: false});
    this.ur=ur
    this.core.trigger("zoom")
    this.setKeyDownFunc()
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
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })
}

topologyDOM.prototype.convertPosition=function(x,y){
    var vpExtent=this.core.extent()
    var screenW=this.DOM.width()
    var screenH=this.DOM.height()
    var screenX = (x-vpExtent.x1)/(vpExtent.w)*screenW + this.DOM.offset().left
    var screenY=(y-vpExtent.y1)/(vpExtent.h)*screenH+ this.DOM.offset().top
    return {x:screenX,y:screenY}
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    if(globalCache.showFloatInfoPanel){ //since floating window is used for mouse hover element info, so info panel never chagne before, that is why there is no need to restore back the info panel information at mouseout
        if(globalCache.showingCreateTwinModelID){
            this.broadcastMessage({ "message": "showInfoGroupNode", "info": {"@id":globalCache.showingCreateTwinModelID} })
        }else{
            this.selectFunction()
        }
    }
    
    this.broadcastMessage({ "message": "topologyMouseOut"})

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
    var layoutName=globalCache.currentLayoutName
    if(layoutName!=null){
        var layoutDetail= globalCache.layoutJSON[layoutName]
        if(layoutDetail) this.applyNewLayoutWithUndo(layoutDetail,this.getCurrentLayoutDetail())
    }
    
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
    else if (msgPayload.message == "layoutChange") {
        var layoutName = globalCache.currentLayoutName
        if(layoutName=="[NA]"){
            //select all visible nodes and do a COSE layout, clean all bend edge line as well
            this.core.edges().forEach(oneEdge=>{
                oneEdge.removeClass('edgebendediting-hasbendpoints')
                oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
                oneEdge.data("cyedgebendeditingWeights",[])
                oneEdge.data("cyedgebendeditingDistances",[])
                oneEdge.data("cyedgecontroleditingWeights",[])
                oneEdge.data("cyedgecontroleditingDistances",[])
            })
            this.noPosition_cose()
        }else if (layoutName != null) {
            var layoutDetail = globalCache.layoutJSON[layoutName]
            if (layoutDetail) this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
    }else if(msgPayload.message=="alignSelectedNode") this.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.dimensionSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="viewTypeChange"){
        if(msgPayload.viewType=="Topology") this.showSelf()
        else this.hideSelf()
    }
}

topologyDOM.prototype.showSelf = function (direction) {
    this.DOM.show()
    this.DOM.animate({height: "100%"});
}

topologyDOM.prototype.hideSelf = function (direction) {
    this.DOM.animate({height: "0%"},()=>{this.DOM.hide()});
}

topologyDOM.prototype.dimensionSelectedNode = function (direction) {
    var ratio=1.2
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="expand") newLayout[nodeID]=[centerX+xoffcenter*ratio,centerY+yoffcenter*ratio]
        else if(direction=="compress") newLayout[nodeID]=[centerX+xoffcenter/ratio,centerY+yoffcenter/ratio]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.mirrorSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="horizontal") newLayout[nodeID]=[centerX-xoffcenter,curPos['y']]
        else if(direction=="vertical") newLayout[nodeID]=[curPos['x'],centerY-yoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.rotateSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="left") newLayout[nodeID]=[centerX+yoffcenter,centerY-xoffcenter]
        else if(direction=="right") newLayout[nodeID]=[centerX-yoffcenter,centerY+xoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.distributeSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<3) return;
    var numArr=[]
    var oldLayout={}
    var layoutForSort=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="vertical") numArr.push(position['y'])
        else if(direction=="horizontal") numArr.push(position['x'])
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        layoutForSort.push({id:nodeID,x:curPos['x'],y:curPos['y']})
    })

    if(direction=="vertical") layoutForSort.sort(function (a, b) {return a["y"]-b["y"] })
    else if(direction=="horizontal") layoutForSort.sort(function (a, b) {return a["x"]-b["x"] })
    
    var minV=Math.min(...numArr)
    var maxV=Math.max(...numArr)
    if(minV==maxV) return;
    var gap=(maxV-minV)/(selectedNodes.size()-1)
    var newLayout={}
    if(direction=="vertical") var curV=layoutForSort[0]["y"]
    else if(direction=="horizontal") curV=layoutForSort[0]["x"]
    for(var i=0;i<layoutForSort.length;i++){
        var oneNodeInfo=layoutForSort[i]
        if(i==0|| i==layoutForSort.length-1){
            newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],oneNodeInfo['y']]
            continue
        }
        curV+=gap;
        if(direction=="vertical") newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],curV]
        else if(direction=="horizontal") newLayout[oneNodeInfo.id]=[curV,oneNodeInfo['y']]
    }
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.alignSelectedNodes = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var numArr=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="top"|| direction=="bottom") numArr.push(position['y'])
        else if(direction=="left"|| direction=="right") numArr.push(position['x'])
    })
    var targetX=targetY=null
    if(direction=="top") var targetY= Math.min(...numArr)
    else if(direction=="bottom") var targetY= Math.max(...numArr)
    if(direction=="left") var targetX= Math.min(...numArr)
    else if(direction=="right") var targetX= Math.max(...numArr)
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        newLayout[nodeID]=[curPos['x'],curPos['y']]
        if(targetX!=null) newLayout[nodeID][0]=targetX
        if(targetY!=null) newLayout[nodeID][1]=targetY
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.redrawBasedOnLayoutDetail = function (layoutDetail,onlyAdjustNodePosition) {
    //remove all bending edge 
    if(!onlyAdjustNodePosition){
        this.core.edges().forEach(oneEdge=>{
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights",[])
            oneEdge.data("cyedgebendeditingDistances",[])
            oneEdge.data("cyedgecontroleditingWeights",[])
            oneEdge.data("cyedgecontroleditingDistances",[])
        })
    }
    
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        if(ind == "edges") continue
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

topologyDOM.prototype.applyNewLayoutWithUndo = function (newLayoutDetail,oldLayoutDetail,onlyAdjustNodePosition) {
    //store current layout for undo operation
    this.ur.action( "changeLayout"
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.newLayoutDetail,arg.onlyAdjustNodePosition)        
            return arg
        }
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.oldLayoutDetail,arg.onlyAdjustNodePosition)
            return arg
        }
    )
    this.ur.do("changeLayout"
        , { firstTime: true, "newLayoutDetail": newLayoutDetail, "oldLayoutDetail": oldLayoutDetail,"onlyAdjustNodePosition":onlyAdjustNodePosition}
    )
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var nodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+nodeName+'"]');
        if(theNode.length==0) return;
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

topologyDOM.prototype.getCurrentLayoutDetail = function () {
    var layoutDict={"edges":{}}
    if(this.core.nodes().size()==0) return layoutDict;
    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points
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
    return layoutDict;
}

topologyDOM.prototype.saveLayout = async function (layoutName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    if(layoutDict["edges"]==null) layoutDict["edges"]={}
    
    var showingLayout=this.getCurrentLayoutDetail()
    var showingEdgesLayout= showingLayout["edges"]
    delete showingLayout["edges"]
    for(var ind in showingLayout) layoutDict[ind]=showingLayout[ind]
    for(var ind in showingEdgesLayout) layoutDict["edges"][ind]=showingEdgesLayout[ind]

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


topologyDOM.prototype.setKeyDownFunc=function(includeCancelConnectOperation){
    $(document).on("keydown",  (e)=>{
        if (e.ctrlKey && e.target.nodeName === 'BODY'){
            if (e.which === 90)   this.ur.undo();
            else if (e.which === 89)    this.ur.redo();
            else if(e.which===83){
                this.broadcastMessage({"message":"popupLayoutEditing"})
                return false
            }
        }
        if (e.keyCode == 27) this.cancelTargetNodeMode()    
    });
}

topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    this.setKeyDownFunc("includeCancelConnectOperation")

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
    this.setKeyDownFunc()
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelAnalyzer":17,"../sharedSourceFiles/simpleConfirmDialog":23,"../sharedSourceFiles/simpleSelectMenu":24}],12:[function(require,module,exports){
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":16,"../sharedSourceFiles/modelAnalyzer":17,"../sharedSourceFiles/newTwinDialog":21,"../sharedSourceFiles/simpleTree":25}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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
        var res=await this.callAPI("accountManagement/fetchUserData")
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

},{"./globalAppSettings":13,"./sharedSourceFiles/globalCache":16,"buffer":2}],15:[function(require,module,exports){
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
},{"../msalHelper":14,"./globalCache":16,"./simpleConfirmDialog":23}],16:[function(require,module,exports){
function globalCache(){
    this.accountInfo=null;
    this.joinedProjectsToken=null;
    this.showFloatInfoPanel=true
    this.DBModelsArr = []
    this.DBTwinsArr = []
    this.modelIDMapToName={}
    this.modelNameMapToID={}
    this.twinIDMapToDisplayName={}
    this.storedTwins = {}
    this.layoutJSON={}
    this.visualDefinition={"default":{}}

    this.initStoredInformtion()
}


globalCache.prototype.initStoredInformtion = function () {
    this.storedOutboundRelationships = {} 
    //stored data, seperately from ADT service and from cosmosDB service
    this.currentLayoutName=null   
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
    for(var ind in this.visualDefinition) delete this.visualDefinition[ind]
    for(var ind in this.layoutJSON) delete this.layoutJSON[ind]
    this.visualDefinition["default"]={}

    resArr.forEach(element => {
        if(element.type=="visualSchema") {
            //TODO: now there is only one "default" schema to use,consider allow creating more user define visual schema
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

globalCache.prototype.getSingleDBTwinByIndoorFeatureID=function(featureID){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var ele = this.DBTwinsArr[i]
        if(ele.GIS && ele.GIS.indoor){
            if(ele.GIS.indoor.IndoorFeatureID==featureID) return ele
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
},{}],17:[function(require,module,exports){
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
},{"../msalHelper":14}],18:[function(require,module,exports){
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
},{"../msalHelper":14,"./modelAnalyzer":17,"./simpleConfirmDialog":23,"./simpleSelectMenu":24}],19:[function(require,module,exports){
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
        //TODO: clear the visualization setting of this deleted model, but if it is replace, should not, so I comment out first
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
},{"../msalHelper":14,"./globalCache":16,"./modelAnalyzer":17,"./modelEditorDialog":18,"./simpleConfirmDialog":23,"./simpleTree":25}],20:[function(require,module,exports){
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
},{"../globalAppSettings":13,"../msalHelper":14}],21:[function(require,module,exports){
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
},{"../msalHelper":14,"./globalCache":16,"./modelAnalyzer":17,"./simpleSelectMenu":24}],22:[function(require,module,exports){
const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")

function projectSettingDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

projectSettingDialog.prototype.popup = function (projectInfo) {
    this.DOM.show()
    if(this.contentInitialized)return;
    this.contentInitialized=true; 
    this.DOM.css({"width":"420px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Setting</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var tabControl=$('<div class="w3-bar w3-light-gray"></div>')
    var layoutBtn=$('<button class="w3-bar-item w3-button " style="margin:0px 5px">Layout</button>')
    var visualSchemaBtn=$('<button class="w3-bar-item w3-button">Visual Schema</button>')
    tabControl.append(layoutBtn,visualSchemaBtn)
    this.DOM.append(tabControl)

    this.layoutContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.visualSchemaContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none">Visual Schema</div>')
    this.DOM.append(this.layoutContentDiv,this.visualSchemaContentDiv)
    this.fillLayoutDivContent()

    layoutBtn.on("click",()=>{
        layoutBtn.addClass("w3-dark-grey")
        visualSchemaBtn.removeClass("w3-dark-grey")
        this.visualSchemaContentDiv.hide()
        this.layoutContentDiv.show()
    })

    visualSchemaBtn.on("click",()=>{
        layoutBtn.removeClass("w3-dark-grey")
        visualSchemaBtn.addClass("w3-dark-grey")
        this.visualSchemaContentDiv.show()
        this.layoutContentDiv.hide()
    })

    layoutBtn.trigger("click")
}

projectSettingDialog.prototype.fillLayoutDivContent = function () {
    var showOtherUserLayoutCheck = $('<input class="w3-check" style="width:20px;margin-left:10px;margin-right:10px" type="checkbox">')
    var showOtherUserLayoutText = $('<label style="padding:2px 8px;">Show shared layouts from Other Users</label>')
    this.layoutContentDiv.append(showOtherUserLayoutCheck, showOtherUserLayoutText)

    var layoutsDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.layoutContentDiv.append(layoutsDiv)
    this.layoutsDiv=layoutsDiv
    for (var ind in globalCache.layoutJSON) {
        this.addOneLayoutBar(ind,layoutsDiv)
    }
}

projectSettingDialog.prototype.addOneLayoutBar=function(layoutName,parentDiv){
    var oneLayout=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneLayout)

    var nameLbl=$('<a class="w3-bar-item w3-button" href="#">'+layoutName+'</a>')
    var defaultLbl=$("<a class='w3-lime w3-bar-item' style='font-size:9px;padding:1px 2px;margin-top:9px;border-radius: 2px;'>default</a>")
    defaultLbl.hide()
    oneLayout.data("defaultLbl",defaultLbl)
    oneLayout.append(nameLbl,defaultLbl)

    var shareBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber">Share</button>')
    var deleteBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber"><i class="fa fa-trash fa-lg"></i></button>')
    oneLayout.append(deleteBtn,shareBtn)
    shareBtn.hide()
    deleteBtn.hide()

    oneLayout.hover(()=>{
        shareBtn.show()
        deleteBtn.show()
    },()=>{
        shareBtn.hide()
        deleteBtn.hide()
    })

    oneLayout.on("click",()=>{
        this.setAsDefaultLayout(oneLayout)
    })

    deleteBtn.on("click",()=>{
        console.log("delete "+layoutName)
        return false
    })
    shareBtn.on("click",()=>{
        console.log("share "+layoutName)
        return false
    })
}

projectSettingDialog.prototype.setAsDefaultLayout=function(oneLayoutDOM){
    this.layoutsDiv.children('a').each((index,aLayout)=>{
        var defaultLbl= $(aLayout).data("defaultLbl")
        defaultLbl.hide()
    })
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.show()
    //console.log(globalCache.accountInfo)
    //console.log(globalCache.currentProjectID)

}

module.exports = new projectSettingDialog();
},{"../msalHelper":14,"./globalCache":16}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vQXBwRGF0YS9Sb2FtaW5nL25wbS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9mbG9hdEluZm9XaW5kb3cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2luZm9QYW5lbC5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbWFpblRvb2xiYXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21hcERPTS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvc3RhcnRTZWxlY3Rpb25EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3RvcG9sb2d5RE9NLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS90d2luc1RyZWUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tc2FsSGVscGVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9lZGl0UHJvamVjdERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvcHJvamVjdFNldHRpbmdEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiLyohIGllZWU3NTQuIEJTRC0zLUNsYXVzZSBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi9cbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsIid1c2Ugc3RyaWN0JztcclxuY29uc3QgdG9wb2xvZ3lET009cmVxdWlyZShcIi4vdG9wb2xvZ3lET00uanNcIilcclxuY29uc3QgbWFwRE9NPXJlcXVpcmUoXCIuL21hcERPTS5qc1wiKVxyXG5jb25zdCB0d2luc1RyZWU9cmVxdWlyZShcIi4vdHdpbnNUcmVlXCIpXHJcbmNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nID0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBtYWluVG9vbGJhciA9IHJlcXVpcmUoXCIuL21haW5Ub29sYmFyXCIpXHJcbmNvbnN0IGluZm9QYW5lbD0gcmVxdWlyZShcIi4vaW5mb1BhbmVsXCIpO1xyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncyA9IHJlcXVpcmUoXCIuLi9nbG9iYWxBcHBTZXR0aW5ncy5qc1wiKTtcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBuZXdUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9uZXdUd2luRGlhbG9nXCIpO1xyXG5jb25zdCBmbG9hdEluZm9XaW5kb3c9cmVxdWlyZShcIi4vZmxvYXRJbmZvV2luZG93XCIpXHJcblxyXG5mdW5jdGlvbiBkaWdpdGFsdHdpbm1vZHVsZVVJKCkge1xyXG4gICAgdGhpcy5pbml0VUlMYXlvdXQoKVxyXG5cclxuICAgIHRoaXMudHdpbnNUcmVlPSBuZXcgdHdpbnNUcmVlKCQoXCIjdHJlZUhvbGRlclwiKSwkKFwiI3RyZWVTZWFyY2hcIikpXHJcbiAgICBcclxuICAgIG1haW5Ub29sYmFyLnJlbmRlcigpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2U9bmV3IHRvcG9sb2d5RE9NKCQoJyNjYW52YXMnKSlcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuXHJcbiAgICB0aGlzLm1hcERPTSA9IG5ldyBtYXBET00oJCgnI2NhbnZhcycpKVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSgpIC8vaW5pdGlhbGl6ZSBhbGwgdWkgY29tcG9uZW50cyB0byBoYXZlIHRoZSBicm9hZGNhc3QgY2FwYWJpbGl0eVxyXG5cclxuICAgIC8vdHJ5IGlmIGl0IGFscmVhZHkgQjJDIHNpZ25lZCBpbiwgaWYgbm90IGdvaW5nIGJhY2sgdG8gdGhlIHN0YXJ0IHBhZ2VcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcblxyXG5cclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsICYmICFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCkgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG5cclxuICAgIHRoaXMuaW5pdERhdGEoKVxyXG59XHJcblxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuaW5pdERhdGE9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLnJlbG9hZFVzZXJBY2NvdW50RGF0YSgpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRTZWxlY3Rpb25EaWFsb2cucG9wdXAoKVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5icm9hZGNhc3RNZXNzYWdlPWZ1bmN0aW9uKHNvdXJjZSxtc2dQYXlsb2FkKXtcclxuICAgIHZhciBjb21wb25lbnRzQXJyPVt0aGlzLnR3aW5zVHJlZSxzdGFydFNlbGVjdGlvbkRpYWxvZyxtb2RlbE1hbmFnZXJEaWFsb2csbW9kZWxFZGl0b3JEaWFsb2csZWRpdExheW91dERpYWxvZyxcclxuICAgICAgICAgbWFpblRvb2xiYXIsdGhpcy50b3BvbG9neUluc3RhbmNlLHRoaXMubWFwRE9NLGluZm9QYW5lbCxuZXdUd2luRGlhbG9nLGZsb2F0SW5mb1dpbmRvd11cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGRpZ2l0YWx0d2lubW9kdWxlVUkoKTsiLCJjb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIGVkaXRMYXlvdXREaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnJlZmlsbE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICBcclxuICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIE5ldyBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighalF1ZXJ5LmlzRW1wdHlPYmplY3QoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikpe1xyXG4gICAgICAgIHZhciBsYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1wYWRkaW5nLTE2XCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4tIE9SIC08L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChsYmwpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsd2lkdGg6XCIxMjBweFwifSlcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPXN3aXRjaExheW91dFNlbGVjdG9yXHJcbiAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBpZihvcHRpb25UZXh0PT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCIgXCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB2YXIgc2F2ZUFzQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6NXB4XCI+U2F2ZSBBczwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHhcIj5EZWxldGUgTGF5b3V0PC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzQnRuLHN3aXRjaExheW91dFNlbGVjdG9yLkRPTSxkZWxldGVCdG4pXHJcbiAgICAgICAgc2F2ZUFzQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG5cclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5zYXZlSW50b0xheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNhdmVMYXlvdXRcIiwgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWV9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIkNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVMYXlvdXRcIiwgXCJQT1NUXCIsIHsgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gZmxvYXRJbmZvV2luZG93KCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicGFkZGluZzoxMHB4OyBwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMTttaW4taGVpZ2h0OjEyMHB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOSlcIilcclxuICAgICAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmhpZGVTZWxmPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB0aGlzLkRPTS5jc3MoXCJ3aWR0aFwiLFwiMHB4XCIpIFxyXG59XHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuc2hvd1NlbGY9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICB0aGlzLkRPTS5jc3MoXCJ3aWR0aFwiLFwiMjk1cHhcIilcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXsgICBcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0b3BvbG9neU1vdXNlT3V0XCIpe1xyXG4gICAgICAgIHRoaXMuaGlkZVNlbGYoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvSG92ZXJlZEVsZVwiKXtcclxuICAgICAgICBpZighZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIGlmKGFycj09bnVsbCB8fCBhcnIubGVuZ3RoPT0wKSAgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcImxlZnRcIixcIi0yMDAwcHhcIikgLy9pdCBpcyBhbHdheXMgb3V0c2lkZSBvZiBicm93c2VyIHNvIGl0IHdvbnQgYmxvY2sgbW91c2UgYW5kIGNhdXNlIG1vdXNlIG91dFxyXG4gICAgICAgIHRoaXMuc2hvd1NlbGYoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkb2N1bWVudEJvZHlXaWR0aD0kKCdib2R5Jykud2lkdGgoKVxyXG5cclxuICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgIHZhciBtb2RlbE5hbWU9c2luZ2xlRWxlbWVudEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0pe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0uZWRpdGFibGVQcm9wZXJ0aWVzLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdLFwiJG1ldGFkYXRhXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl19LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgfWVsc2UgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgIFwiJHNvdXJjZUlkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0sXHJcbiAgICAgICAgICAgICAgICBcIiR0YXJnZXRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdLFxyXG4gICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICB2YXIgcmVsYXRpb25zaGlwTmFtZT1zaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSx0aGlzLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKSxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIHNjcmVlblhZPSBtc2dQYXlsb2FkLnNjcmVlblhZXHJcbiAgICAgICAgdmFyIHdpbmRvd0xlZnQ9c2NyZWVuWFkueCs1MFxyXG5cclxuICAgICAgICBpZih3aW5kb3dMZWZ0K3RoaXMuRE9NLm91dGVyV2lkdGgoKSsxMD5kb2N1bWVudEJvZHlXaWR0aCkge1xyXG4gICAgICAgICAgICB3aW5kb3dMZWZ0PWRvY3VtZW50Qm9keVdpZHRoLXRoaXMuRE9NLm91dGVyV2lkdGgoKS0xMFxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgd2luZG93VG9wID0gc2NyZWVuWFkueS10aGlzLkRPTS5vdXRlckhlaWdodCgpLTUwXHJcbiAgICAgICAgaWYod2luZG93VG9wPDUpIHdpbmRvd1RvcD01XHJcbiAgICAgICAgdGhpcy5ET00uY3NzKHtcImxlZnRcIjp3aW5kb3dMZWZ0K1wicHhcIiwgXCJ0b3BcIjp3aW5kb3dUb3ArXCJweFwifSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCl7XHJcbiAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXSB8fCAhbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pIHJldHVyblxyXG4gICAgcmV0dXJuIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllc1xyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmRyYXdTdGF0aWNJbmZvPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxwYWRkaW5nVG9wLGZvbnRTaXplKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1kYXJrLWdyYXknIHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW07Zm9udC1zaXplOjEwcHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtOyBtYXJnaW4tcmlnaHQ6NXB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiICYmICFBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKSB7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUoY29udGVudERPTSxqc29uSW5mb1tpbmRdLG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWw9PW51bGwpe1xyXG4gICAgICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiY29sb3JcIjpcImdyYXlcIixcImZvbnQtc2l6ZVwiOlwiOXB4XCJ9KVxyXG4gICAgICAgICAgICAgICAgY29udGVudERPTS50ZXh0KFwiW2VtcHR5XVwiKVxyXG4gICAgICAgICAgICB9ZWxzZSBjb250ZW50RE9NLnRleHQodmFsKVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuc2VhcmNoVmFsdWU9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgdGhlSnNvbj1vcmlnaW5FbGVtZW50SW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICAgICAgaWYodGhlSnNvbj09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhlSnNvbiAvL2l0IHNob3VsZCBiZSB0aGUgZmluYWwgdmFsdWVcclxufVxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBmbG9hdEluZm9XaW5kb3coKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIGluZm9QYW5lbCgpIHtcclxuICAgIHRoaXMuY29udGluZXJET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6OTA7cmlnaHQ6MHB4O3RvcDo1MCU7aGVpZ2h0OjcwJTt3aWR0aDozMDBweDt0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGluZXJET00uaGlkZSgpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjUwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48L2Rpdj4nKSlcclxuXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMT0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPjxpIGNsYXNzPVwiZmEgZmEtaW5mby1jaXJjbGUgZmEtMnhcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtXCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuY2xvc2VCdXR0b24xLHRoaXMuY2xvc2VCdXR0b24yKSBcclxuXHJcbiAgICB0aGlzLmlzTWluaW1pemVkPWZhbHNlO1xyXG4gICAgdmFyIGJ1dHRvbkFuaW09KCk9PntcclxuICAgICAgICBpZighdGhpcy5pc01pbmltaXplZCkgdGhpcy5taW5pbWl6ZVdpbmRvdygpXHJcbiAgICAgICAgZWxzZSB0aGlzLmV4cGFuZFdpbmRvdygpXHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5taW5pbWl6ZVdpbmRvdz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICByaWdodDogXCItMjUwcHhcIixcclxuICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgIH0pXHJcbiAgICB0aGlzLmlzTWluaW1pemVkPXRydWU7XHJcbn1cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5leHBhbmRXaW5kb3c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgaGVpZ2h0OiBcIjcwJVwiXHJcbiAgICB9KVxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibWFwRmx5aW5nU3RhcnRcIil7XHJcbiAgICAgICAgdGhpcy5taW5pbWl6ZVdpbmRvdygpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibWFwRmx5aW5nRW5kXCIpe1xyXG4gICAgICAgIHRoaXMuZXhwYW5kV2luZG93KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJtYXBTZWxlY3RGZWF0dXJlXCIpIHtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLkRCVHdpbiE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9bXNnUGF5bG9hZC5EQlR3aW4uaWRcclxuICAgICAgICAgICAgdmFyIGFkdFR3aW49Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXVxyXG4gICAgICAgICAgICB0aGlzLnNob3dJbmZvT2ZOb2RlcyhbYWR0VHdpbl0pXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiIHx8IG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIil7XHJcbiAgICAgICAgaWYgKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCAmJiBtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpIHJldHVybjsgLy90aGUgZmxvYXRpbmcgaW5mbyB3aW5kb3cgd2lsbCBzaG93IG1vdXNlIG92ZXIgZWxlbWVudCBpbmZvcm1hdGlvbiwgZG8gbm90IGNoYW5nZSBpbmZvIHBhbmVsIGNvbnRlbnQgaW4gdGhpcyBjYXNlXHJcbiAgICAgICAgdGhpcy5zaG93SW5mb09mTm9kZXMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93SW5mb09mTm9kZXM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIGlmIChhcnIgPT0gbnVsbCB8fCBhcnIubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMgPSBbXTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cyA9IGFycjtcclxuICAgIGlmIChhcnIubGVuZ3RoID09IDEpIHtcclxuICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm8gPSBhcnJbMF07XHJcblxyXG4gICAgICAgIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKSB7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlTm9kZVwiKVxyXG5cclxuICAgICAgICAgICAgLy9pbnN0ZWFkIG9mIGRyYXcgdGhlICRkdElkLCBkcmF3IGRpc3BsYXkgbmFtZSBpbnN0ZWFkXHJcbiAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sIHsgXCJuYW1lXCI6IHNpbmdsZUVsZW1lbnRJbmZvW1wiZGlzcGxheU5hbWVcIl0gfSwgXCIxZW1cIiwgXCIxM3B4XCIpXHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIG1vZGVsTmFtZSA9IHNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuXHJcbiAgICAgICAgICAgIGlmIChtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcywgc2luZ2xlRWxlbWVudEluZm8sIFtdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vaW5zdGVhZCBvZiBkcmF3aW5nIHRoZSBvcmlnaW5hbCBpbmZvbXJhdGlvbiwgZHJhdyBtb3JlIG1lYW5pbmdmdWwgb25lXHJcbiAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl0sXCIkbWV0YWRhdGFcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSwgeyBcIk1vZGVsXCI6IHNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdIH0sIFwiMWVtXCIsIFwiMTBweFwiKVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbmQgPT0gXCIkbW9kZWxcIikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdG1wT2JqID0ge31cclxuICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdID0gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSwgdG1wT2JqLCBcIjFlbVwiLCBcIjEwcHhcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZVJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLCB7XHJcbiAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOiBzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSxcclxuICAgICAgICAgICAgICAgIFwiJHRhcmdldElkXCI6IHNpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdLFxyXG4gICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIH0sIFwiMWVtXCIsIFwiMTNweFwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLCB7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOiBzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICB9LCBcIjFlbVwiLCBcIjEwcHhcIilcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWUgPSBzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbCA9IHNpbmdsZUVsZW1lbnRJbmZvW1wic291cmNlTW9kZWxcIl1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLCB0aGlzLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLCBzb3VyY2VNb2RlbCksIHNpbmdsZUVsZW1lbnRJbmZvLCBbXSlcclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIHNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdG1wT2JqID0ge31cclxuICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdID0gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSwgdG1wT2JqLCBcIjFlbVwiLCBcIjEwcHhcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKGFyci5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgdGhpcy5kcmF3TXVsdGlwbGVPYmooKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKXtcclxuICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdIHx8ICFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXSkgcmV0dXJuXHJcbiAgICByZXR1cm4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0J1dHRvbnM9ZnVuY3Rpb24oc2VsZWN0VHlwZSl7XHJcbiAgICB2YXIgaW1wQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYmx1ZVwiPjxpIGNsYXNzPVwiZmFzIGZhLWNsb3VkLXVwbG9hZC1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRUd2luc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICBpZihzZWxlY3RUeXBlIT1udWxsKXtcclxuICAgICAgICB2YXIgcmVmcmVzaEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsYWNrXCI+PGkgY2xhc3M9XCJmYXMgZmEtc3luYy1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXhwQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtZ3JlZW5cIj48aSBjbGFzcz1cImZhcyBmYS1jbG91ZC1kb3dubG9hZC1hbHRcIj48L2k+PC9idXR0b24+JykgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5Jz5DaG9vc2UgdHdpbnMgb3IgcmVsYXRpb25zaGlwcyB0byB2aWV3IGluZm9tcmF0aW9uPC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3Mgc2hpZnQga2V5IHRvIGRyYXcgYm94IGFuZCBzZWxlY3QgbXVsdGlwbGUgdHdpbnMgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIGN0cmwreiBhbmQgY3RybCt5IHRvIHVuZG8vcmVkbyBpbiB0b3BvbG9neSB2aWV3OyBjdHJsK3MgdG8gc2F2ZSBsYXlvdXQ8L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4O3BhZGRpbmctYm90dG9tOjIwcHgnPlByZXNzIHNoaWZ0IG9yIGN0cmwga2V5IHRvIHNlbGVjdCBtdWx0aXBsZSB0d2lucyBpbiB0cmVlIHZpZXc8L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoxMnB4O3BhZGRpbmctYm90dG9tOjVweCc+SW1wb3J0IHR3aW5zIGRhdGEgYnkgY2xpY2tpbmcgYnV0dG9uIGJlbG93PC9hPlwiKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpbXBCdG4sYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGltcEJ0bi5vbihcImNsaWNrXCIsKCk9PnthY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpO30pXHJcbiAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RUeXBlPT1udWxsKSByZXR1cm47XHJcblxyXG4gICAgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVSZWxhdGlvbnNoaXBcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6MTA0cHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuKVxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfWVsc2UgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVOb2RlXCIgfHwgc2VsZWN0VHlwZT09XCJtdWx0aXBsZVwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjEwNHB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RUb0J0biA9JCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiICBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IHRvPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdEZyb21CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCBmcm9tPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd0luYm91bmRCdG4gPSAkKCc8YnV0dG9uICBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4sIGNvbm5lY3RUb0J0bixjb25uZWN0RnJvbUJ0biAsIHNob3dJbmJvdW5kQnRuLCBzaG93T3V0Qm91bmRCdG4pXHJcbiAgICBcclxuICAgICAgICBzaG93T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93T3V0Qm91bmQoKX0pXHJcbiAgICAgICAgc2hvd0luYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93SW5Cb3VuZCgpfSkgIFxyXG4gICAgICAgIGNvbm5lY3RUb0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0VG9cIn0pIH0pXHJcbiAgICAgICAgY29ubmVjdEZyb21CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdEZyb21cIn0pIH0pXHJcblxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJGR0SWQnXSkgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgaWYobnVtT2ZOb2RlPjApe1xyXG4gICAgICAgIHZhciBzZWxlY3RJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzZWxlY3RPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvc2VMYXlvdXRCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q09TRSBWaWV3PC9idXR0b24+JylcclxuICAgICAgICB2YXIgaGlkZUJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5IaWRlPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2VsZWN0SW5ib3VuZEJ0biwgc2VsZWN0T3V0Qm91bmRCdG4sY29zZUxheW91dEJ0bixoaWRlQnRuKVxyXG5cclxuICAgICAgICBzZWxlY3RJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0SW5ib3VuZFwifSl9KVxyXG4gICAgICAgIHNlbGVjdE91dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0T3V0Ym91bmRcIn0pfSlcclxuICAgICAgICBjb3NlTGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiQ09TRVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgICAgICBoaWRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiaGlkZVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgIH1cclxuICAgIGlmIChudW1PZk5vZGUgPiAxKSB7XHJcbiAgICAgICAgLy9zb21lIGFkZGl0aW9uYWwgYnV0dG9ucyB3aGVuIHNlbGVjdCBtdWx0aXBsZSBpdGVtc1xyXG4gICAgICAgIHRoaXMuZHJhd0FkdmFuY2VBbGlnbm1lbnRCdXR0b25zKClcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QWR2YW5jZUFsaWdubWVudEJ1dHRvbnM9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBsYWJlbD0kKFwiPGxhYmVsIGNsYXNzPSd3My1ncmF5JyBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjVweDt3aWR0aDoyMCU7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPkFycmFuZ2U8L2xhYmVsPlwiKSBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChsYWJlbCkgXHJcbiAgICB2YXIgYWxpZ25CdXR0b25zVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nbWFyZ2luOjAgYXV0byc+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZCBzdHlsZT0ndGV4dC1hbGlnbjpjZW50ZXI7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpkYXJrR3JheSc+QUxJR048L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PC90YWJsZT5cIilcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhbGlnbkJ1dHRvbnNUYWJsZSlcclxuICAgIHZhciBhbGlnblRvcEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi11cFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFsaWduTGVmdEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1sZWZ0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWxpZ25SaWdodEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1yaWdodFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFsaWduQm90dG9tQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWRvd25cIj48L2k+PC9idXR0b24+JylcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgxKS5hcHBlbmQoYWxpZ25Ub3BCdXR0b24pXHJcbiAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoMykuYXBwZW5kKGFsaWduTGVmdEJ1dHRvbilcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg1KS5hcHBlbmQoYWxpZ25SaWdodEJ1dHRvbilcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg3KS5hcHBlbmQoYWxpZ25Cb3R0b21CdXR0b24pXHJcblxyXG5cclxuICAgIHZhciBhcnJhbmdlVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nbWFyZ2luOjAgYXV0byc+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PHRyPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+PC90YWJsZT5cIilcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhcnJhbmdlVGFibGUpXHJcblxyXG4gICAgdmFyIGRpc3RyaWJ1dGVIQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1lbGxpcHNpcy1oIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIGRpc3RyaWJ1dGVWQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1lbGxpcHNpcy12IGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIGxlZnRSb3RhdGVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLXVuZG8tYWx0IGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIHJpZ2h0Um90YXRlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1yZWRvLWFsdCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBtaXJyb3JIQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1hcnJvd3MtYWx0LWhcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgbWlycm9yVkJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtYXJyb3dzLWFsdC12XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwYW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1leHBhbmQtYXJyb3dzLWFsdFwiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBjb21wcmVzc0J1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtY29tcHJlc3MtYXJyb3dzLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDApLmFwcGVuZChkaXN0cmlidXRlSEJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGRpc3RyaWJ1dGVWQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgyKS5hcHBlbmQobGVmdFJvdGF0ZUJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMykuYXBwZW5kKHJpZ2h0Um90YXRlQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg0KS5hcHBlbmQobWlycm9ySEJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNSkuYXBwZW5kKG1pcnJvclZCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDYpLmFwcGVuZChleHBhbmRCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChjb21wcmVzc0J1dHRvbilcclxuXHJcblxyXG4gICAgYWxpZ25Ub3BCdXR0b24ub24oXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ0b3BcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgYWxpZ25MZWZ0QnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJsZWZ0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGFsaWduUmlnaHRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInJpZ2h0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGFsaWduQm90dG9tQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJib3R0b21cIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG5cclxuICAgIGRpc3RyaWJ1dGVIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgZGlzdHJpYnV0ZVZCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwidmVydGljYWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgbGVmdFJvdGF0ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyb3RhdGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImxlZnRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgcmlnaHRSb3RhdGVCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicm90YXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBtaXJyb3JIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1pcnJvclNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiaG9yaXpvbnRhbFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBtaXJyb3JWQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1pcnJvclNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwidmVydGljYWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgZXhwYW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiZXhwYW5kXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGNvbXByZXNzQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiY29tcHJlc3NcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmV4cG9ydFNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5Ub0JlU3RvcmVkPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm5cclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgIHZhciBhbkV4cFR3aW49e31cclxuICAgICAgICBhbkV4cFR3aW5bXCIkbWV0YWRhdGFcIl09e1wiJG1vZGVsXCI6ZWxlbWVudFtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXX1cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBlbGVtZW50KXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRtZXRhZGF0YVwiIHx8IGluZD09XCIkZXRhZ1wiKSBjb250aW51ZSBcclxuICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXT1lbGVtZW50W2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgdHdpblRvQmVTdG9yZWQucHVzaChhbkV4cFR3aW4pXHJcbiAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICB9KTtcclxuICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkPVtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIGlmKCFyZWxhdGlvbnMpIHJldHVybjtcclxuICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgaWYodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmo9e31cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlbGF0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihpbmQgPT1cIiRldGFnXCJ8fGluZCA9PVwiJHJlbGF0aW9uc2hpcElkXCJ8fGluZCA9PVwiJHNvdXJjZUlkXCJ8fGluZCA9PVwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICBvYmpbaW5kXT1vbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lQWN0aW9uPXtcIiRzcmNJZFwiOm9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6b25lUmVsYXRpb25bXCIkcmVsYXRpb25zaGlwSWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjpvYmp9XHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnNUb0JlU3RvcmVkLnB1c2gob25lQWN0aW9uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgZmluYWxKU09OPXtcInR3aW5zXCI6dHdpblRvQmVTdG9yZWQsXCJyZWxhdGlvbnNcIjpyZWxhdGlvbnNUb0JlU3RvcmVkfVxyXG4gICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0VHdpbnNEYXRhLmpzb25cIik7XHJcbiAgICBwb21bMF0uY2xpY2soKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRPbmVGaWxlPSBhc3luYyBmdW5jdGlvbihhRmlsZSl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKT0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYUZpbGUpO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgdmFyIGltcG9ydFR3aW5zPVtdXHJcbiAgICB2YXIgaW1wb3J0UmVsYXRpb25zPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKG9iai50d2lucykgaW1wb3J0VHdpbnM9aW1wb3J0VHdpbnMuY29uY2F0KG9iai50d2lucylcclxuICAgICAgICAgICAgaWYob2JqLnJlbGF0aW9ucykgaW1wb3J0UmVsYXRpb25zPWltcG9ydFJlbGF0aW9ucy5jb25jYXQob2JqLnJlbGF0aW9ucylcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICAgICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB2YXIgb2xkVHdpbklEMk5ld0lEPXt9XHJcbiAgICBpbXBvcnRUd2lucy5mb3JFYWNoKG9uZVR3aW49PntcclxuICAgICAgICB2YXIgb2xkSUQ9IG9uZVR3aW5bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBuZXdJRD11dWlkdjQoKTtcclxuICAgICAgICBvbGRUd2luSUQyTmV3SURbb2xkSURdPW5ld0lEXHJcbiAgICAgICAgb25lVHdpbltcIiRkdElkXCJdPW5ld0lEXHJcbiAgICB9KVxyXG5cclxuICAgIGZvcih2YXIgaT1pbXBvcnRSZWxhdGlvbnMubGVuZ3RoLTE7aT49MDtpLS0pe1xyXG4gICAgICAgIHZhciBvbmVSZWw9aW1wb3J0UmVsYXRpb25zW2ldXHJcbiAgICAgICAgaWYob2xkVHdpbklEMk5ld0lEW29uZVJlbFtcIiRzcmNJZFwiXV09PW51bGwgfHwgb2xkVHdpbklEMk5ld0lEW29uZVJlbFtcIm9ialwiXVtcIiR0YXJnZXRJZFwiXV09PW51bGwpe1xyXG4gICAgICAgICAgICBpbXBvcnRSZWxhdGlvbnMuc3BsaWNlKGksMSlcclxuICAgICAgICB9IGVsc2V7XHJcbiAgICAgICAgICAgIG9uZVJlbFtcIiRzcmNJZFwiXT1vbGRUd2luSUQyTmV3SURbb25lUmVsW1wiJHNyY0lkXCJdXVxyXG4gICAgICAgICAgICBvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl09b2xkVHdpbklEMk5ld0lEW29uZVJlbFtcIm9ialwiXVtcIiR0YXJnZXRJZFwiXV1cclxuICAgICAgICAgICAgb25lUmVsW1wiJHJlbGF0aW9uc2hpcElkXCJdPXV1aWR2NCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2JhdGNoSW1wb3J0VHdpbnNcIiwgXCJQT1NUXCIsIHtcInR3aW5zXCI6SlNPTi5zdHJpbmdpZnkoaW1wb3J0VHdpbnMpfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgcmUuREJUd2lucz1KU09OLnBhcnNlKHJlLkRCVHdpbnMpXHJcbiAgICByZS5BRFRUd2lucz1KU09OLnBhcnNlKHJlLkFEVFR3aW5zKVxyXG4gICAgcmUuREJUd2lucy5mb3JFYWNoKERCVHdpbj0+eyBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihEQlR3aW4pIH0pXHJcbiAgICB2YXIgYWR0VHdpbnM9W11cclxuICAgIHJlLkFEVFR3aW5zLmZvckVhY2goQURUVHdpbj0+e1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihBRFRUd2luKVxyXG4gICAgICAgIGFkdFR3aW5zLnB1c2goQURUVHdpbilcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIiwgXCJ0d2luc0luZm9cIjogYWR0VHdpbnMgfSlcclxuXHJcbiAgICAvL2NvbnRpbnVlIHRvIGltcG9ydCByZWxhdGlvbnNcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW1wb3J0ZWQgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9jcmVhdGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsICB7YWN0aW9uczpKU09OLnN0cmluZ2lmeShpbXBvcnRSZWxhdGlvbnMpfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKHJlbGF0aW9uc0ltcG9ydGVkKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLGluZm86cmVsYXRpb25zSW1wb3J0ZWR9KVxyXG5cclxuICAgIHZhciBudW1PZlR3aW5zPWFkdFR3aW5zLmxlbmd0aFxyXG4gICAgdmFyIG51bU9mUmVsYXRpb25zPXJlbGF0aW9uc0ltcG9ydGVkLmxlbmd0aFxyXG4gICAgdmFyIHN0cj1cIkFkZCBcIitudW1PZlR3aW5zKyBcIiBub2RlXCIrKChudW1PZlR3aW5zPD0xKT9cIlwiOlwic1wiKStgIChmcm9tICR7aW1wb3J0VHdpbnMubGVuZ3RofSlgXHJcbiAgICBzdHIrPVwiIGFuZCBcIitudW1PZlJlbGF0aW9ucytcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mUmVsYXRpb25zPD0xKT9cIlwiOlwic1wiKStgIChmcm9tICR7aW1wb3J0UmVsYXRpb25zLmxlbmd0aH0pYFxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCI0MDBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJJbXBvcnQgUmVzdWx0XCJcclxuICAgICAgICAgICAgLCBjb250ZW50OnN0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJPa1wiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlZnJlc2hJbmZvbWF0aW9uPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdHdpbklEcz1bXVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHMuZm9yRWFjaChvbmVJdGVtPT57ICBpZihvbmVJdGVtWyckZHRJZCddKSB0d2luSURzLnB1c2gob25lSXRlbVsnJGR0SWQnXSkgIH0pXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHR3aW5zZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2xpc3RUd2luc0ZvcklEc1wiLCBcIlBPU1RcIiwgdHdpbklEcylcclxuICAgICAgICB0d2luc2RhdGEuZm9yRWFjaChvbmVSZT0+e1xyXG4gICAgICAgICAgICB2YXIgdHdpbklEPSBvbmVSZVsnJGR0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0d2luSURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlKSAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVJlW2luZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlKHR3aW5JRHMubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEcy5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZ2V0UmVsYXRpb25zaGlwc0Zyb21Ud2luSURzXCIsIFwiUE9TVFwiLCBzbWFsbEFycilcclxuICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgY29udGludWU7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9yZWRyYXcgaW5mb3BhbmVsIGlmIG5lZWRlZFxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE9iamVjdHMubGVuZ3RoPT0xKSB0aGlzLnJ4TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiB0aGlzLnNlbGVjdGVkT2JqZWN0cyB9KVxyXG5cclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlU2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgcmVsYXRpb25zQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZWxhdGlvbnNBcnIucHVzaChlbGVtZW50KTtcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGZvcih2YXIgaT1yZWxhdGlvbnNBcnIubGVuZ3RoLTE7aT49MDtpLS0peyAvL2NsZWFyIHRob3NlIHJlbGF0aW9uc2hpcHMgdGhhdCBhcmUgZ29pbmcgdG8gYmUgZGVsZXRlZCBhZnRlciB0d2lucyBkZWxldGluZ1xyXG4gICAgICAgIHZhciBzcmNJZD0gIHJlbGF0aW9uc0FycltpXVsnJHNvdXJjZUlkJ11cclxuICAgICAgICB2YXIgdGFyZ2V0SWQgPSByZWxhdGlvbnNBcnJbaV1bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgaWYodHdpbklEc1tzcmNJZF0hPW51bGwgfHwgdHdpbklEc1t0YXJnZXRJZF0hPW51bGwpe1xyXG4gICAgICAgICAgICByZWxhdGlvbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciBkaWFsb2dTdHI9XCJcIlxyXG4gICAgdmFyIHR3aW5OdW1iZXI9dHdpbklEQXJyLmxlbmd0aDtcclxuICAgIHZhciByZWxhdGlvbnNOdW1iZXIgPSByZWxhdGlvbnNBcnIubGVuZ3RoO1xyXG4gICAgaWYodHdpbk51bWJlcj4wKSBkaWFsb2dTdHIgPSAgdHdpbk51bWJlcitcIiB0d2luXCIrKCh0d2luTnVtYmVyPjEpP1wic1wiOlwiXCIpICsgXCIgKHdpdGggY29ubmVjdGVkIHJlbGF0aW9ucylcIlxyXG4gICAgaWYodHdpbk51bWJlcj4wICYmIHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIrPVwiIGFuZCBhZGRpdGlvbmFsIFwiXHJcbiAgICBpZihyZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyICs9ICByZWxhdGlvbnNOdW1iZXIrXCIgcmVsYXRpb25cIisoKHJlbGF0aW9uc051bWJlcj4xKT9cInNcIjpcIlwiIClcclxuICAgIGRpYWxvZ1N0cis9XCIgd2lsbCBiZSBkZWxldGVkLiBQbGVhc2UgY29uZmlybVwiXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OmRpYWxvZ1N0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0aW9uc0Fyci5sZW5ndGggPiAwKSBhd2FpdCB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhyZWxhdGlvbnNBcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0d2luSURBcnIubGVuZ3RoID4gMCkgYXdhaXQgdGhpcy5kZWxldGVUd2lucyh0d2luSURBcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlVHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHZhciBpb1REZXZpY2VzPVtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVUd2luSUQ9PntcclxuICAgICAgICB2YXIgZGJUd2luSW5mbz1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQlR3aW5CeUlEKG9uZVR3aW5JRClcclxuICAgICAgICBpZihkYlR3aW5JbmZvLklvVERldmljZUlEIT1udWxsICYmIGRiVHdpbkluZm8uSW9URGV2aWNlSUQhPVwiXCIpe1xyXG4gICAgICAgICAgICBpb1REZXZpY2VzLnB1c2goZGJUd2luSW5mby5Jb1REZXZpY2VJRClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgaWYoaW9URGV2aWNlcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGV2aWNlbWFuYWdlbWVudC91bnJlZ2lzdGVySW9URGV2aWNlc1wiLCBcIlBPU1RcIiwge2Fycjppb1REZXZpY2VzfSlcclxuICAgIH1cclxuICAgIFxyXG5cclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlVHdpbnNcIiwgXCJQT1NUXCIsIHthcnI6c21hbGxBcnJ9LFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgICAgICByZXN1bHQuZm9yRWFjaCgob25lSUQpPT57XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lSURdXHJcbiAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidHdpbnNEZWxldGVkXCIsdHdpbklEQXJyOnJlc3VsdH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1hc3luYyBmdW5jdGlvbihyZWxhdGlvbnNBcnIpe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgcmVsYXRpb25zQXJyLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICBhcnIucHVzaCh7c3JjSUQ6b25lUmVsYXRpb25bJyRzb3VyY2VJZCddLHJlbElEOm9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXX0pXHJcbiAgICB9KVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCB7XCJyZWxhdGlvbnNcIjphcnJ9KVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlKGRhdGEpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVsYXRpb25zRGVsZXRlZFwiLFwicmVsYXRpb25zXCI6ZGF0YX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd091dEJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuXHJcbiAgICAgICAgdmFyIGtub3duVGFyZ2V0VHdpbnMgPSB7fVxyXG4gICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICBrbm93blRhcmdldFR3aW5zW29uZUlEXSA9IDEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICB2YXIgb3V0Qm91bmRSZWxhdGlvbiA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgaWYgKG91dEJvdW5kUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIG91dEJvdW5kUmVsYXRpb24uZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICE9IG51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdID0gMVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9xdWVyeU91dEJvdW5kXCIsIFwiUE9TVFwiLCAgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duVGFyZ2V0c1wiOiBrbm93blRhcmdldFR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dJbkJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBrbm93blNvdXJjZVR3aW5zID0ge31cclxuICAgICAgICB2YXIgSUREaWN0ID0ge31cclxuICAgICAgICBzbWFsbEFyci5mb3JFYWNoKG9uZUlEID0+IHtcclxuICAgICAgICAgICAgSUREaWN0W29uZUlEXSA9IDFcclxuICAgICAgICAgICAga25vd25Tb3VyY2VUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICB9KVxyXG4gICAgICAgIGZvciAodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9ucyA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdXHJcbiAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNyY0lEID0gb25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICBpZiAoSUREaWN0W3RhcmdldElEXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSAhPSBudWxsKSBrbm93blNvdXJjZVR3aW5zW3NyY0lEXSA9IDFcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9xdWVyeUluQm91bmRcIiwgXCJQT1NUXCIsICB7IGFycjogc21hbGxBcnIsIFwia25vd25Tb3VyY2VzXCI6IGtub3duU291cmNlVHdpbnMgfSlcclxuICAgICAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lVHdpbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd011bHRpcGxlT2JqPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbnVtT2ZFZGdlID0gMDtcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFycj09bnVsbCkgcmV0dXJuO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSBudW1PZkVkZ2UrK1xyXG4gICAgICAgIGVsc2UgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgdmFyIHRleHREaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjEwcHgnPjwvbGFiZWw+XCIpXHJcbiAgICB0ZXh0RGl2LnRleHQobnVtT2ZOb2RlKyBcIiBub2RlXCIrKChudW1PZk5vZGU8PTEpP1wiXCI6XCJzXCIpK1wiLCBcIitudW1PZkVkZ2UrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZkVkZ2U8PTEpP1wiXCI6XCJzXCIpKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRleHREaXYpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd1N0YXRpY0luZm89ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUpe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgY2xhc3M9J3czLWRhcmstZ3JheScgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6I2Y2ZjZmNjtkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW07Zm9udC1zaXplOjEwcHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtOyBtYXJnaW4tcmlnaHQ6NXB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUoY29udGVudERPTSxqc29uSW5mb1tpbmRdLG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RHJvcGRvd25PcHRpb249ZnVuY3Rpb24oY29udGVudERPTSxuZXdQYXRoLHZhbHVlQXJyLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIilcclxuICAgIH1cclxuICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICBhU2VsZWN0TWVudS50cmlnZ2VyT3B0aW9uVmFsdWUodmFsKVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5lZGl0RFRQcm9wZXJ0eT1hc3luYyBmdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbCxkYXRhVHlwZSl7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcblxyXG4gICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NoYW5nZUF0dHJpYnV0ZVwiLCBcIlBPU1RcIiwgcGF5TG9hZClcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24obm9kZUluZm8scGF0aEFycixuZXdWYWwpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPW5vZGVJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxuICAgIHJldHVyblxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsImNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1vZHVsZVN3aXRjaERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nXCIpXHJcbmNvbnN0IHByb2plY3RTZXR0aW5nRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9wcm9qZWN0U2V0dGluZ0RpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoUHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+UHJvamVjdDwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIC8vdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgLy90aGlzLnNob3dHSVNWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTtmb250LXNpemU6ODAlXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCB3My10ZXh0LWFtYmVyXCI+PC9pPjwvc3Bhbj48L2E+JylcclxuXHJcblxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+VGVzdCBTaWduYWxSPC9hPicpXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+c2VuZCBTaWduYWxSIG1lc3NhZ2U8L2E+JylcclxuXHJcbiAgICB0aGlzLnNldHRpbmdCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiPjxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcblxyXG4gICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIpXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1NpZGViYXIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1N3aXRjaEJ1dHRvbiwgdGhpcy5zd2l0Y2hQcm9qZWN0QnRuLHRoaXMubW9kZWxJT0J0bix0aGlzLnZpZXdUeXBlU2VsZWN0b3IuICBET00sdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sdGhpcy5lZGl0TGF5b3V0QnRuLHRoaXMuZmxvYXRJbmZvQnRuXHJcbiAgICAgICAgLy8sdGhpcy50ZXN0U2lnbmFsUkJ0bix0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0blxyXG4gICAgICAgICx0aGlzLnNldHRpbmdCdG5cclxuICAgIClcclxuXHJcbiAgICB0aGlzLnN3aXRjaFByb2plY3RCdG4ub24oXCJjbGlja1wiLCgpPT57IHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMubW9kZWxJT0J0bi5vbihcImNsaWNrXCIsKCk9PnsgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuc2V0dGluZ0J0bi5vbihcImNsaWNrXCIsKCk9PnsgcHJvamVjdFNldHRpbmdEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsPWZhbHNlXHJcbiAgICAgICAgZWxzZSBnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWw9dHJ1ZVxyXG4gICAgICAgIGlmKCFnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpe1xyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmh0bWwoJzxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1iYW4gZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IGZhLWludmVyc2VcIj48L2k+PC9zcGFuPicpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmFkZENsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4uaHRtbCgnPHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZSBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggdzMtdGV4dC1hbWJlclwiPjwvaT48L3NwYW4+JylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMudGVzdFNlbmRTaWduYWxSQnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIGNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2UoXCJtZXNzYWdlc1wiLFwiUE9TVFwiLHtcclxuICAgICAgICAgICAgcmVjaXBpZW50OiBcIjVlYjgxZjVmLWZkOWUtNDgxZC05OTZiLTRkMGI5NTM2ZjQ3N1wiLFxyXG4gICAgICAgICAgICB0ZXh0OiBcImhvdyBkbyB5b3UgZG9cIlxyXG4gICAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB0aGlzLnRlc3RTaWduYWxSQnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIGNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuICAgICAgICB2YXIgc2lnbmFsUkluZm8gPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2UoXCJuZWdvdGlhdGU/bmFtZT1mZlwiLFwiR0VUXCIpXHJcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBzaWduYWxSLkh1YkNvbm5lY3Rpb25CdWlsZGVyKClcclxuICAgICAgICAud2l0aFVybChzaWduYWxSSW5mby51cmwsIHthY2Nlc3NUb2tlbkZhY3Rvcnk6ICgpID0+IHNpZ25hbFJJbmZvLmFjY2Vzc1Rva2VufSlcclxuICAgICAgICAvLy5jb25maWd1cmVMb2dnaW5nKHNpZ25hbFIuTG9nTGV2ZWwuSW5mb3JtYXRpb24pXHJcbiAgICAgICAgLmNvbmZpZ3VyZUxvZ2dpbmcoc2lnbmFsUi5Mb2dMZXZlbC5XYXJuaW5nKVxyXG4gICAgICAgIC5idWlsZCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNpZ25hbFJJbmZvLmFjY2Vzc1Rva2VuKVxyXG5cclxuICAgICAgICBjb25uZWN0aW9uLm9uKCduZXdNZXNzYWdlJywgKG1lc3NhZ2UpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5vbmNsb3NlKCgpID0+IGNvbnNvbGUubG9nKCdkaXNjb25uZWN0ZWQnKSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3RpbmcuLi4nKTtcclxuICAgICAgICBjb25uZWN0aW9uLnN0YXJ0KClcclxuICAgICAgICAgIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdjb25uZWN0ZWQhJykpXHJcbiAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci5hZGRPcHRpb24oJ1RvcG9sb2d5JylcclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci5hZGRPcHRpb24oJ0dJUycpXHJcbiAgICB0aGlzLnZpZXdUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljayl7XHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRWaWV3VHlwZSA9PSBvcHRpb25UZXh0KSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpZXdUeXBlQ2hhbmdlXCIsXCJ2aWV3VHlwZVwiOm9wdGlvblRleHR9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50Vmlld1R5cGU9b3B0aW9uVGV4dFxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShcIlRvcG9sb2d5XCIpXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1clNlbGVjdD10aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbFxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oJ1tObyBMYXlvdXQgU3BlY2lmaWVkXScsJ1tOQV0nKVxyXG5cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicG9wdXBMYXlvdXRFZGl0aW5nXCIpe1xyXG4gICAgICAgIGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVG9vbGJhcigpOyIsImNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtYXBET00oY29udGFpbmVyRE9NKXtcclxuICAgIHRoaXMuRE9NPSQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlJz48L2Rpdj5cIilcclxuICAgIGNvbnRhaW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuXHJcbiAgICB0aGlzLnN1YnNjcmlwdGlvbktleT1cImptUWJfY2pqZ3BFWHExd0I2ZVJqc1FIb2pVZkkyWHhnVXBiQWhpRnFCdGNcIlxyXG4gICAgdGhpcy5kYXRhU2V0SWQ9IFwiZTZmY2JmODMtYWMzMy1jY2FiLWYyNzctMzg4YTQ5MjU0ZThkXCJcclxuICAgIHRoaXMudGlsZVNldElkPVwiOGE5YjAyZTktZGIwNC0yNzg0LWRjMzgtOWIzMWM1MjE2MGYyXCJcclxuXHJcbiAgICB0aGlzLm1hcCA9IG5ldyBhdGxhcy5NYXAodGhpcy5ET01bMF0sIHtcclxuICAgICAgICBjZW50ZXI6ICBbMTAzLjgzOTQyNjYsIDEuMzE0NDgwNTNdLFxyXG4gICAgICAgIHpvb206IDE1LFxyXG4gICAgICAgIHN0eWxlOiAncm9hZF9zaGFkZWRfcmVsaWVmJyxcclxuICAgICAgICB2aWV3OiAnQXV0bycsXHJcbiAgICAgICAgYXV0aE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgYXV0aFR5cGU6ICdzdWJzY3JpcHRpb25LZXknLFxyXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25LZXk6IHRoaXMuc3Vic2NyaXB0aW9uS2V5XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5tYXAuZXZlbnRzLmFkZCgncmVhZHknLCAoKT0+IHt0aGlzLmluaXRNYXAoKX0pXHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuaW5pdE1hcD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5tYXBEYXRhU291cmNlID0gbmV3IGF0bGFzLnNvdXJjZS5EYXRhU291cmNlKFwidHdpblBvbHlnb25cIik7XHJcblxyXG4gICAgLy9BZGQgYSBtYXAgc3R5bGUgc2VsZWN0aW9uIGNvbnRyb2wuXHJcbiAgICB0aGlzLm1hcC5jb250cm9scy5hZGQobmV3IGF0bGFzLmNvbnRyb2wuU3R5bGVDb250cm9sKHsgbWFwU3R5bGVzOiBcImFsbFwiIH0pLCB7IHBvc2l0aW9uOiBcInRvcC1yaWdodFwiIH0pO1xyXG4gICAgLy9DcmVhdGUgYW4gaW5kb29yIG1hcHMgbWFuYWdlci5cclxuICAgIHRoaXMuaW5kb29yTWFuYWdlciA9IG5ldyBhdGxhcy5pbmRvb3IuSW5kb29yTWFuYWdlcih0aGlzLm1hcCwge3RpbGVzZXRJZDogdGhpcy50aWxlU2V0SWR9KTtcclxuICAgIHRoaXMuaW5kb29yTWFuYWdlci5zZXRPcHRpb25zKHtsZXZlbENvbnRyb2w6IG5ldyBhdGxhcy5jb250cm9sLkxldmVsQ29udHJvbCh7IHBvc2l0aW9uOiAndG9wLXJpZ2h0JyB9KSB9KTtcclxuICAgIHRoaXMuaW5kb29yTWFuYWdlci5zZXREeW5hbWljU3R5bGluZyhmYWxzZSlcclxuXHJcbiAgICB0aGlzLm1hcC5ldmVudHMuYWRkKFwiY2xpY2tcIiwgIChlKT0+IHtcclxuICAgICAgICB2YXIgZmVhdHVyZXMgPSB0aGlzLm1hcC5sYXllcnMuZ2V0UmVuZGVyZWRTaGFwZXMoZS5wb3NpdGlvbiwgJ3VuaXQnKTtcclxuICAgICAgICBpZihmZWF0dXJlcy5sZW5ndGg9PTApIHJldHVybjtcclxuICAgICAgICB2YXIgcmVzdWx0REJUd2luPWdsb2JhbENhY2hlLmdldFNpbmdsZURCVHdpbkJ5SW5kb29yRmVhdHVyZUlEKGZlYXR1cmVzWzBdLnByb3BlcnRpZXMuZmVhdHVyZUlkKVxyXG4gICAgICAgIGlmKHJlc3VsdERCVHdpbiE9bnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0VHdpbnMoW3Jlc3VsdERCVHdpbl0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1hcFNlbGVjdEZlYXR1cmVcIixcIkRCVHdpblwiOnJlc3VsdERCVHdpbn0pXHJcbiAgICAgICAgfSBcclxuICAgIH0pO1xyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmNvbXBsZXRlVVJMPWZ1bmN0aW9uKGFwaVBhcnQpe1xyXG4gICAgcmV0dXJuICdodHRwczovL3VzLmF0bGFzLm1pY3Jvc29mdC5jb20vJythcGlQYXJ0KydhcGktdmVyc2lvbj0yLjAmc3Vic2NyaXB0aW9uLWtleT0nK3RoaXMuc3Vic2NyaXB0aW9uS2V5XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpZXdUeXBlQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQudmlld1R5cGU9PVwiR0lTXCIpIHRoaXMuc2hvd1NlbGYoKVxyXG4gICAgICAgIGVsc2UgdGhpcy5oaWRlU2VsZigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpe1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRWaWV3VHlwZSE9XCJHSVNcIikgcmV0dXJuO1xyXG4gICAgICAgIHZhciBzZWxlY3RlZFR3aW5zQXJyPW1zZ1BheWxvYWQuaW5mbyAvL3RoZSBsYXN0IGl0ZW0gaXMgdGhlIGxhdGVzdCBzZWxlY3RlZCBpdGVtXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHNlbGVjdGVkREJUd2lucz1bXVxyXG4gICAgICAgIHNlbGVjdGVkVHdpbnNBcnIuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgICAgICB2YXIgdHdpbklEPWFUd2luWyckZHRJZCddXHJcbiAgICAgICAgICAgIGlmKCF0d2luSUQpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIHRoZURCVHdpbj1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQlR3aW5CeUlEKHR3aW5JRClcclxuICAgICAgICAgICAgc2VsZWN0ZWREQlR3aW5zLnB1c2godGhlREJUd2luKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHRUd2lucyhzZWxlY3RlZERCVHdpbnMpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuaGlnaGxpZ2h0VHdpbnMgPSBmdW5jdGlvbiAoZGJUd2lucykge1xyXG4gICAgaWYoZGJUd2lucy5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciBsYXRlc3REQlR3aW49IGRiVHdpbnNbZGJUd2lucy5sZW5ndGgtMV1cclxuICAgIFxyXG4gICAgLy9oaWRlIGFsbCB0d2lucyBoaWdobGlnaHQgaW4gR0lTXHJcbiAgICB0aGlzLm1hcERhdGFTb3VyY2UuY2xlYXIoKVxyXG4gICAgaWYoIWxhdGVzdERCVHdpbi5HSVMpIHJldHVybjtcclxuICAgIFxyXG4gICAgLy9pZiB0aGVyZSBpcyBhIGZhY2lsaXR5IGNoYW5nZSwgdGhlcmUgaXMgYW4gYW5pbWF0aW9uIHRvIHBhbiBtYXAsIG90aGVyd2lzZSwgZG9ub3QgcGFuIG1hcFxyXG4gICAgdmFyIGluZm89dGhpcy5pbmRvb3JNYW5hZ2VyLmdldEN1cnJlbnRGYWNpbGl0eSgpXHJcbiAgICB2YXIgY3VyRmFjaWxpdHk9aW5mb1swXVxyXG4gICAgdmFyIGN1ckxldmVsTnVtYmVyPSBpbmZvWzFdXHJcbiAgICB2YXIgZGVzdEZhY2lsaXR5PWxhdGVzdERCVHdpbi5HSVMuaW5kb29yLmZhY2lsaXR5SURcclxuICAgIGlmKGN1ckZhY2lsaXR5IT1kZXN0RmFjaWxpdHkpe1xyXG4gICAgICAgIHZhciBjb29yZGluYXRlcz0gbGF0ZXN0REJUd2luLkdJUy5pbmRvb3IuY29vcmRpbmF0ZXNcclxuICAgICAgICB2YXIgZGVzdExMPWNvb3JkaW5hdGVzWzBdWzBdXHJcbiAgICAgICAgdGhpcy5mbHlUbyhkZXN0TEwpXHJcbiAgICB9XHJcbiAgICAvL2Nob29zZSB0aGUgZmFjaWxpdHkgYW5kIGxldmVsIG51bWJlclxyXG4gICAgaWYoZGVzdEZhY2lsaXR5IT1jdXJGYWNpbGl0eSB8fCBjdXJMZXZlbE51bWJlciE9bGF0ZXN0REJUd2luLkdJUy5pbmRvb3IubGV2ZWxPcmRpbmFsKXtcclxuICAgICAgICB0aGlzLmluZG9vck1hbmFnZXIuc2V0RmFjaWxpdHkoZGVzdEZhY2lsaXR5LGxhdGVzdERCVHdpbi5HSVMuaW5kb29yLmxldmVsT3JkaW5hbCApXHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vaGlnaGxpZ2h0IGFsbCBzZWxlY3RlZCB0d2lucyBpbiBHSVNcclxuICAgIGRiVHdpbnMuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICB0aGlzLmRyYXdPbmVUd2luSW5kb29yUG9seWdvbihvbmVEQlR3aW4uR0lTLmluZG9vci5jb29yZGluYXRlcylcclxuICAgIH0pXHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuZHJhd09uZVR3aW5JbmRvb3JQb2x5Z29uID0gZnVuY3Rpb24gKGNvb3JkaW5hdGVzKSB7XHJcbiAgICBpZighdGhpcy5tYXAuc291cmNlcy5nZXRCeUlkKFwidHdpblBvbHlnb25cIikpe1xyXG4gICAgICAgIHRoaXMubWFwLnNvdXJjZXMuYWRkKHRoaXMubWFwRGF0YVNvdXJjZSk7XHJcbiAgICAgICAgdGhpcy5tYXAubGF5ZXJzLmFkZChuZXcgYXRsYXMubGF5ZXIuUG9seWdvbkxheWVyKHRoaXMubWFwRGF0YVNvdXJjZSwgbnVsbCwge1xyXG4gICAgICAgICAgICBmaWxsQ29sb3I6IFwicmVkXCIsXHJcbiAgICAgICAgICAgIGZpbGxPcGFjaXR5OiAwLjdcclxuICAgICAgICB9KSlcclxuICAgIH0gXHJcbiAgICB0aGlzLm1hcERhdGFTb3VyY2UuYWRkKG5ldyBhdGxhcy5TaGFwZShuZXcgYXRsYXMuZGF0YS5GZWF0dXJlKFxyXG4gICAgICAgIG5ldyBhdGxhcy5kYXRhLlBvbHlnb24oY29vcmRpbmF0ZXMpXHJcbiAgICApKSk7XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuZmx5VG8gPSBmdW5jdGlvbiAoZGVzdExMKSB7XHJcbiAgICB2YXIgY3VyTG9jPXRoaXMubWFwLmdldENhbWVyYSgpLmNlbnRlclxyXG5cclxuICAgIGlmKGRlc3RMTFswXTxjdXJMb2NbMF0pIHZhciB0YXJnZXRCb3VuZHM9W2Rlc3RMTFswXSxkZXN0TExbMV0sY3VyTG9jWzBdLGN1ckxvY1sxXV1cclxuICAgIGVsc2UgdGFyZ2V0Qm91bmRzPVtjdXJMb2NbMF0sY3VyTG9jWzFdLCBkZXN0TExbMF0sZGVzdExMWzFdXVxyXG5cclxuICAgIHRoaXMubWFwLnNldENhbWVyYSh7XCJib3VuZHNcIjp0YXJnZXRCb3VuZHMsXHJcbiAgICAgICAgXCJwYWRkaW5nXCI6e3RvcDogODAsIGJvdHRvbTogODAsIGxlZnQ6IDgwLCByaWdodDogODB9LFxyXG4gICAgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1hcEZseWluZ1N0YXJ0XCJ9KVxyXG5cclxuICAgIHZhciBtYXJrZXIgPSBuZXcgYXRsYXMuSHRtbE1hcmtlcih7Y29sb3I6ICdEb2RnZXJCbHVlJyx0ZXh0OiAnJyxwb3NpdGlvbjpjdXJMb2N9KTtcclxuICAgIHRoaXMubWFwLm1hcmtlcnMuYWRkKG1hcmtlcik7XHJcbiAgICB2YXIgcGF0aCA9IFtcclxuICAgICAgICBjdXJMb2MsZGVzdExMXHJcbiAgICBdO1xyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIGF0bGFzLmFuaW1hdGlvbnMubW92ZUFsb25nUGF0aChwYXRoLCBtYXJrZXIsIHsgZHVyYXRpb246IDEwMDAsIGNhcHR1cmVNZXRhZGF0YTogdHJ1ZSwgYXV0b1BsYXk6IHRydWUgfSk7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtYXBGbHlpbmdFbmRcIn0pXHJcbiAgICAgICAgICAgIHRoaXMubWFwLnNldENhbWVyYSh7XHJcbiAgICAgICAgICAgICAgICBcImNlbnRlclwiOiBkZXN0TEwsXHJcbiAgICAgICAgICAgICAgICBcInpvb21cIjogMTksXHJcbiAgICAgICAgICAgICAgICBcImR1cmF0aW9uXCI6IDIwMDAsXHJcbiAgICAgICAgICAgICAgICBcInR5cGVcIjogXCJmbHlcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5tYXAubWFya2Vycy5jbGVhcigpfSwzNTAwKVxyXG4gICAgICAgIH0sMTAwMClcclxuICAgICAgICBcclxuICAgIH0sMTAwMCkgXHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuZ2V0RGlzdGFuY2VGcm9tTGF0TG9uSW5LbSA9IGZ1bmN0aW9uIChsb25sYXQxLCBsb25sYXQyKSB7XHJcbiAgICB2YXIgbG9uMT1sb25sYXQxWzBdXHJcbiAgICB2YXIgbGF0MT1sb25sYXQxWzFdXHJcbiAgICB2YXIgbG9uMj1sb25sYXQyWzBdXHJcbiAgICB2YXIgbGF0Mj1sb25sYXQyWzFdXHJcblxyXG4gICAgdmFyIFIgPSA2MzcxOyAvLyBSYWRpdXMgb2YgdGhlIGVhcnRoIGluIGttXHJcbiAgICB2YXIgZExhdCA9IHRoaXMuZGVnMnJhZChsYXQyIC0gbGF0MSk7ICAvLyBkZWcycmFkIGJlbG93XHJcbiAgICB2YXIgZExvbiA9IHRoaXMuZGVnMnJhZChsb24yIC0gbG9uMSk7XHJcbiAgICB2YXIgYSA9XHJcbiAgICAgICAgTWF0aC5zaW4oZExhdCAvIDIpICogTWF0aC5zaW4oZExhdCAvIDIpICtcclxuICAgICAgICBNYXRoLmNvcyh0aGlzLmRlZzJyYWQobGF0MSkpICogTWF0aC5jb3ModGhpcy5kZWcycmFkKGxhdDIpKSAqXHJcbiAgICAgICAgTWF0aC5zaW4oZExvbiAvIDIpICogTWF0aC5zaW4oZExvbiAvIDIpXHJcbiAgICAgICAgO1xyXG4gICAgdmFyIGMgPSAyICogTWF0aC5hdGFuMihNYXRoLnNxcnQoYSksIE1hdGguc3FydCgxIC0gYSkpO1xyXG4gICAgdmFyIGQgPSBSICogYzsgLy8gRGlzdGFuY2UgaW4ga21cclxuICAgIHJldHVybiBkO1xyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmRlZzJyYWQgPSBmdW5jdGlvbiAoZGVnKSB7XHJcbiAgICByZXR1cm4gZGVnICogKE1hdGguUEkgLyAxODApXHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuc2hvd1NlbGYgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmFuaW1hdGUoe2hlaWdodDogXCIxMDAlXCJ9LCgpPT57dGhpcy5tYXAucmVzaXplKCl9KTtcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5oaWRlU2VsZiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHRoaXMuRE9NLmFuaW1hdGUoe2hlaWdodDogXCIwJVwifSwoKT0+e3RoaXMuRE9NLmhpZGUoKX0pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG1hcERPTTsiLCJjb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZWRpdFByb2plY3REaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2VkaXRQcm9qZWN0RGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpXHJcblxyXG5mdW5jdGlvbiBzdGFydFNlbGVjdGlvbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY4MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+U2VsZWN0IFR3aW5zPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG5cclxuICAgIHRoaXMuYnV0dG9uSG9sZGVyID0gJChcIjxkaXYgc3R5bGU9J2hlaWdodDoxMDAlJz48L2Rpdj5cIilcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuYnV0dG9uSG9sZGVyKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKVxyXG4gICAgICAgIHRoaXMuY2xvc2VEaWFsb2coKSBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzE9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cxKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5Qcm9qZWN0IDwvZGl2PicpXHJcbiAgICByb3cxLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBzd2l0Y2hQcm9qZWN0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifX0pXHJcbiAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvcj1zd2l0Y2hQcm9qZWN0U2VsZWN0b3JcclxuICAgIHJvdzEuYXBwZW5kKHN3aXRjaFByb2plY3RTZWxlY3Rvci5ET00pXHJcbiAgICB2YXIgam9pbmVkUHJvamVjdHM9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHNcclxuICAgIGpvaW5lZFByb2plY3RzLmZvckVhY2goYVByb2plY3Q9PntcclxuICAgICAgICB2YXIgc3RyID0gYVByb2plY3QubmFtZVxyXG4gICAgICAgIGlmKGFQcm9qZWN0Lm93bmVyIT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5hY2NvdW50SUQpIHN0cis9XCIgKGZyb20gXCIrYVByb2plY3Qub3duZXIrXCIpXCJcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuYWRkT3B0aW9uKHN0cixhUHJvamVjdC5pZClcclxuICAgIH0pXHJcbiAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVByb2plY3Qob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lZGl0UHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0IGZhLWxnXCI+PC9pPjwvYT4nKVxyXG4gICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYT4nKVxyXG4gICAgdGhpcy5uZXdQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9hPicpXHJcbiAgICByb3cxLmFwcGVuZCh0aGlzLmVkaXRQcm9qZWN0QnRuLHRoaXMuZGVsZXRlUHJvamVjdEJ0bix0aGlzLm5ld1Byb2plY3RCdG4pXHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PTQwMFxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MjYwcHg7cGFkZGluZy1yaWdodDo1cHg7b3ZlcmZsb3c6aGlkZGVuXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nLXRvcDoxMHB4O1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNhcmRcIiBzdHlsZT1cImNvbG9yOmdyYXk7aGVpZ2h0OicrKHBhbmVsSGVpZ2h0LTEwKSsncHg7b3ZlcmZsb3c6YXV0bzt3aWR0aDozOTBweDtcIj48L2Rpdj4nKSlcclxuICAgIHZhciBzZWxlY3RlZFR3aW5zRE9NPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBzZWxlY3RlZFR3aW5zRE9NLmNzcyh7XCJib3JkZXItY29sbGFwc2VcIjpcImNvbGxhcHNlXCJ9KVxyXG4gICAgcmlnaHRTcGFuLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoc2VsZWN0ZWRUd2luc0RPTSlcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTT1zZWxlY3RlZFR3aW5zRE9NIFxyXG5cclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5DaG9vc2UgdHdpbnMuLi48cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjE0MHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Y2hvb3NlIHR3aW5zIG9mIG9uZSBvciBtb3JlIG1vZGVsczwvcD48L2Rpdj48L2Rpdj4nKSlcclxuXHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXM9JCgnPGZvcm0gY2xhc3M9XCJ3My1jb250YWluZXIgdzMtYm9yZGVyXCIgc3R5bGU9XCJoZWlnaHQ6JysocGFuZWxIZWlnaHQtNDApKydweDtvdmVyZmxvdzphdXRvXCI+PC9mb3JtPicpXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQodGhpcy5tb2RlbHNDaGVja0JveGVzKVxyXG4gICAgXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0IT1udWxsKXtcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3QpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5nZXRQcm9qZWN0SW5mbyA9IGZ1bmN0aW9uIChwcm9qZWN0SUQpIHtcclxuICAgIHZhciBqb2luZWRQcm9qZWN0cz1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5qb2luZWRQcm9qZWN0c1xyXG4gICAgZm9yKHZhciBpPTA7aTxqb2luZWRQcm9qZWN0cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYVByb2plY3Q9am9pbmVkUHJvamVjdHNbaV1cclxuICAgICAgICBpZihhUHJvamVjdC5pZD09cHJvamVjdElEKSByZXR1cm4gYVByb2plY3RcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNob29zZVByb2plY3QgPSBhc3luYyBmdW5jdGlvbiAoc2VsZWN0ZWRQcm9qZWN0SUQpIHtcclxuICAgIHRoaXMuYnV0dG9uSG9sZGVyLmVtcHR5KClcclxuXHJcbiAgICB2YXIgcHJvamVjdEluZm89dGhpcy5nZXRQcm9qZWN0SW5mbyhzZWxlY3RlZFByb2plY3RJRClcclxuICAgIGlmKHByb2plY3RJbmZvLm93bmVyPT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5hY2NvdW50SUQpe1xyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4uc2hvdygpXHJcbiAgICAgICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuLnNob3coKVxyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7IGVkaXRQcm9qZWN0RGlhbG9nLnBvcHVwKHByb2plY3RJbmZvKSB9KVxyXG4gICAgICAgIHRoaXMuZGVsZXRlUHJvamVjdEJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L2RlbGV0ZVByb2plY3RUb1wiLCBcIlBPU1RcIiwge1wicHJvamVjdElEXCI6c2VsZWN0ZWRQcm9qZWN0SUR9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4uaGlkZSgpXHJcbiAgICAgICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuLmhpZGUoKVxyXG4gICAgfVxyXG4gICAgdGhpcy5uZXdQcm9qZWN0QnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciB0c1N0cj0obmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpKSBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgbmV3UHJvamVjdEluZm8gPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9uZXdQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHsgXCJwcm9qZWN0TmFtZVwiOiBcIk5ldyBQcm9qZWN0IFwiICsgdHNTdHIgfSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHMudW5zaGlmdChuZXdQcm9qZWN0SW5mbylcclxuICAgICAgICAgICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgICAgICAgICAgdmFyIGpvaW5lZFByb2plY3RzID0gZ2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHNcclxuICAgICAgICAgICAgam9pbmVkUHJvamVjdHMuZm9yRWFjaChhUHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gYVByb2plY3QubmFtZVxyXG4gICAgICAgICAgICAgICAgaWYoYVByb2plY3Qub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmFjY291bnRJRCkgc3RyKz1cIiAoZnJvbSBcIithUHJvamVjdC5vd25lcitcIilcIlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3IuYWRkT3B0aW9uKHN0ciwgYVByb2plY3QuaWQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC8vTk9URTogbXVzdCBxdWVyeSB0aGUgbmV3IGpvaW5lZCBwcm9qZWN0cyBKV1QgdG9rZW4gYWdhaW5cclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgICAgICAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0PT1udWxsKXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1ob3Zlci1kZWVwLW9yYW5nZSB3My1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5TdGFydDwvYnV0dG9uPicpXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbilcclxuICAgIH1lbHNlIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3QgPT0gc2VsZWN0ZWRQcm9qZWN0SUQpe1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhcHBlbmRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QXBwZW5kIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgICAgICBhcHBlbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJhcHBlbmRcIikgfSlcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQoYXBwZW5kQnV0dG9uLHJlcGxhY2VCdXR0b24pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCA9IHNlbGVjdGVkUHJvamVjdElEXHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdE1vZGVsc0RhdGFcIiwgXCJQT1NUXCIsIG51bGwsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGEocmVzLkRCTW9kZWxzLCByZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgICAgIHZhciByZXMgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFByb2plY3RUd2luc0FuZFZpc3VhbERhdGFcIiwgXCJQT1NUXCIsIG51bGwsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdFR3aW5zQW5kVmlzdWFsRGF0YShyZXMpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5maWxsQXZhaWxhYmxlTW9kZWxzKClcclxuICAgIHRoaXMubGlzdFR3aW5zKClcclxufVxyXG5cclxuXHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZmlsbEF2YWlsYWJsZU1vZGVscyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJBTExcIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+PGI+QUxMPC9iPjwvbGFiZWw+PHAvPicpXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57XHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZT1vbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b25lTW9kZWxbXCJpZFwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoYDxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCIke21vZGVsSUR9XCI+PGxhYmVsIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweFwiPiR7bW9kZWxOYW1lfTwvbGFiZWw+PHAvPmApXHJcbiAgICB9KVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLm9uKFwiY2hhbmdlXCIsKGV2dCk9PntcclxuICAgICAgICBpZigkKGV2dC50YXJnZXQpLmF0dHIoXCJpZFwiKT09XCJBTExcIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB0aGUgb3RoZXIgaW5wdXRcclxuICAgICAgICAgICAgdmFyIHZhbD0kKGV2dC50YXJnZXQpLnByb3AoXCJjaGVja2VkXCIpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykucHJvcChcImNoZWNrZWRcIix2YWwpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxpc3RUd2lucygpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRUd2lucz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlQXJyPVtdXHJcbiAgICB2YXIgY2hvc2VuTW9kZWxzPXt9XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuY2hpbGRyZW4oJ2lucHV0JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYoISQodGhpcykucHJvcChcImNoZWNrZWRcIikpIHJldHVybjtcclxuICAgICAgICBpZigkKHRoaXMpLmF0dHIoXCJpZFwiKT09XCJBTExcIikgcmV0dXJuO1xyXG4gICAgICAgIGNob3Nlbk1vZGVsc1skKHRoaXMpLmF0dHIoXCJpZFwiKV09MVxyXG4gICAgfSk7XHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlQXJyO1xyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uZW1wdHkoKVxyXG4gICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPlRXSU4gSUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUwgSUQ8L3RkPjwvdHI+JylcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpbltcImRpc3BsYXlOYW1lXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bJ21vZGVsSUQnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RlZFR3aW5zLmxlbmd0aD09MCl7XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKSAgICBcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VTdGFydFNlbGVjdGlvbj1mdW5jdGlvbihhY3Rpb24pe1xyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdCE9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCl7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuaW5pdFN0b3JlZEluZm9ybXRpb24oKVxyXG4gICAgICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3Q9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRFxyXG4gICAgfVxyXG5cclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICB2YXIgdHdpbklEcz1bXVxyXG4gICAgc2VsZWN0ZWRUd2lucy5mb3JFYWNoKGFUd2luPT57dHdpbklEcy5wdXNoKGFUd2luW1wiaWRcIl0pfSlcclxuXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9Pnttb2RlbElEcy5wdXNoKG9uZU1vZGVsW1wiaWRcIl0pfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzdGFydFNlbGVjdGlvbl9cIithY3Rpb24sIFwidHdpbklEc1wiOiB0d2luSURzLFwibW9kZWxJRHNcIjptb2RlbElEcyB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIn0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgIHRoaXMuY2xvc2VEaWFsb2coKVxyXG5cclxuICAgIGlmKGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgLy9kaXJlY3RseSBwb3B1cCB0byBtb2RlbCBtYW5hZ2VtZW50IGRpYWxvZyBhbGxvdyB1c2VyIGltcG9ydCBvciBjcmVhdGUgbW9kZWxcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKVxyXG4gICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5ET00uaGlkZSgpXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLkRPTS5mYWRlSW4oKVxyXG4gICAgICAgIC8vcG9wIHVwIHdlbGNvbWUgc2NyZWVuXHJcbiAgICAgICAgdmFyIHBvcFdpbj0kKCc8ZGl2IGNsYXNzPVwidzMtYmx1ZSB3My1jYXJkLTQgdzMtcGFkZGluZy1sYXJnZVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTA1O3dpZHRoOjQwMHB4O2N1cnNvcjpkZWZhdWx0XCI+PC9kaXY+JylcclxuICAgICAgICBwb3BXaW4uaHRtbChgV2VsY29tZSwgJHttc2FsSGVscGVyLnVzZXJOYW1lfSEgRmlyc3RseSwgbGV0J3MgaW1wb3J0IG9yIGNyZWF0ZSBhIGZldyB0d2luIG1vZGVscyB0byBzdGFydC4gPGJyLz48YnIvPkNsaWNrIHRvIGNvbnRpbnVlLi4uYClcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQocG9wV2luKVxyXG4gICAgICAgIHBvcFdpbi5vbihcImNsaWNrXCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgcG9wV2luLmZhZGVPdXQoXCJzbG93XCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KTtcclxuICAgICAgICB9LDMwMDApXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51ID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKGNvbnRhaW5lckRPTSl7XHJcbiAgICB0aGlzLkRPTT0kKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCU7d2lkdGg6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICBjb250YWluZXJET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgdGhpcy5kZWZhdWx0Tm9kZVNpemU9MzBcclxuICAgIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbz17fVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe1xyXG4gICAgY3l0b3NjYXBlLndhcm5pbmdzKGZhbHNlKSAgXHJcbiAgICB0aGlzLmNvcmUgPSBjeXRvc2NhcGUoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogIHRoaXMuRE9NWzBdLCAvLyBjb250YWluZXIgdG8gcmVuZGVyIGluXHJcblxyXG4gICAgICAgIC8vIGluaXRpYWwgdmlld3BvcnQgc3RhdGU6XHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgICBwYW46IHsgeDogMCwgeTogMCB9LFxyXG5cclxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBvcHRpb25zOlxyXG4gICAgICAgIG1pblpvb206IDAuMSxcclxuICAgICAgICBtYXhab29tOiAxMCxcclxuICAgICAgICB6b29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyWm9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgcGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGJveFNlbGVjdGlvbkVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0aW9uVHlwZTogJ3NpbmdsZScsXHJcbiAgICAgICAgdG91Y2hUYXBUaHJlc2hvbGQ6IDgsXHJcbiAgICAgICAgZGVza3RvcFRhcFRocmVzaG9sZDogNCxcclxuICAgICAgICBhdXRvbG9jazogZmFsc2UsXHJcbiAgICAgICAgYXV0b3VuZ3JhYmlmeTogZmFsc2UsXHJcbiAgICAgICAgYXV0b3Vuc2VsZWN0aWZ5OiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyaW5nIG9wdGlvbnM6XHJcbiAgICAgICAgaGVhZGxlc3M6IGZhbHNlLFxyXG4gICAgICAgIHN0eWxlRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBoaWRlRWRnZXNPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICB0ZXh0dXJlT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1cjogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1ck9wYWNpdHk6IDAuMixcclxuICAgICAgICB3aGVlbFNlbnNpdGl2aXR5OiAwLjMsXHJcbiAgICAgICAgcGl4ZWxSYXRpbzogJ2F1dG8nLFxyXG5cclxuICAgICAgICBlbGVtZW50czogW10sIC8vIGxpc3Qgb2YgZ3JhcGggZWxlbWVudHMgdG8gc3RhcnQgd2l0aFxyXG5cclxuICAgICAgICBzdHlsZTogWyAvLyB0aGUgc3R5bGVzaGVldCBmb3IgdGhlIGdyYXBoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcImhlaWdodFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6ICdkYXRhKGlkKScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOjAuOSxcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzpcIjEycHhcIixcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1mYW1pbHknOidHZW5ldmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtaW1hZ2UnOiBmdW5jdGlvbihlbGUpeyByZXR1cm4gXCJpbWFnZXMvY2F0LnBuZ1wiOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtZml0JzonY29udGFpbicgLy9jb3ZlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vJ2JhY2tncm91bmQtY29sb3InOiBmdW5jdGlvbiggZWxlICl7IHJldHVybiBlbGUuZGF0YSgnYmcnKSB9XHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLXdpZHRoJzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC1oZWlnaHQnOic3MCUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICcjODg4JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyM1NTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctc2hhcGUnOiAndHJpYW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdiZXppZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdhcnJvdy1zY2FsZSc6MC42XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2VkZ2U6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMyxcclxuICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1maWxsJzpcImxpbmVhci1ncmFkaWVudFwiLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOlsnY3lhbicsICdtYWdlbnRhJywgJ3llbGxvdyddLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOlsnMCUnLCc3MCUnLCcxMDAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGU6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6XCJyZWRcIixcclxuICAgICAgICAgICAgICAgICdib3JkZXItd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1maWxsJzoncmFkaWFsLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNTAlJywnNjAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGUuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmxhY2tlbic6MC41XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAse3NlbGVjdG9yOiAnZWRnZS5ob3ZlcicsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOjVcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy9jeXRvc2NhcGUgZWRnZSBlZGl0aW5nIHBsdWctaW5cclxuICAgIHRoaXMuY29yZS5lZGdlRWRpdGluZyh7XHJcbiAgICAgICAgdW5kb2FibGU6IHRydWUsXHJcbiAgICAgICAgYmVuZFJlbW92YWxTZW5zaXRpdml0eTogMTYsXHJcbiAgICAgICAgZW5hYmxlTXVsdGlwbGVBbmNob3JSZW1vdmFsT3B0aW9uOiB0cnVlLFxyXG4gICAgICAgIHN0aWNreUFuY2hvclRvbGVyZW5jZTogMjAsXHJcbiAgICAgICAgYW5jaG9yU2hhcGVTaXplRmFjdG9yOiA1LFxyXG4gICAgICAgIGVuYWJsZUFuY2hvclNpemVOb3RJbXBhY3RCeVpvb206dHJ1ZSxcclxuICAgICAgICBlbmFibGVSZW1vdmVBbmNob3JNaWRPZk5lYXJMaW5lOmZhbHNlLFxyXG4gICAgICAgIGVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZzpmYWxzZVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUuYm94U2VsZWN0aW9uRW5hYmxlZCh0cnVlKVxyXG5cclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ3RhcHNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcbiAgICB0aGlzLmNvcmUub24oJ3RhcHVuc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2JveGVuZCcsKGUpPT57Ly9wdXQgaW5zaWRlIGJveGVuZCBldmVudCB0byB0cmlnZ2VyIG9ubHkgb25lIHRpbWUsIGFuZCByZXBsZWF0bHkgYWZ0ZXIgZWFjaCBib3ggc2VsZWN0XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uZSgnYm94c2VsZWN0JywoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignY3h0dGFwJywoZSk9PntcclxuICAgICAgICB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKClcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW92ZXInLGU9PntcclxuXHJcbiAgICAgICAgdGhpcy5tb3VzZU92ZXJGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdXQnLGU9PntcclxuICAgICAgICB0aGlzLm1vdXNlT3V0RnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5vbignem9vbScsKGUpPT57XHJcbiAgICAgICAgdmFyIGZzPXRoaXMuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tKCk7XHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbj10aGlzLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZScpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdmb250LXNpemUnOiBmcywgd2lkdGg6IGRpbWVuc2lvbiwgaGVpZ2h0OiBkaW1lbnNpb24gfSlcclxuICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW8pIHtcclxuICAgICAgICAgICAgdmFyIG5ld0RpbWVuc2lvbiA9IE1hdGguY2VpbCh0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF0gKiBkaW1lbnNpb24pXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyArIG1vZGVsSUQgKyAnXCJdJylcclxuICAgICAgICAgICAgICAgIC5zdHlsZSh7IHdpZHRoOiBuZXdEaW1lbnNpb24sIGhlaWdodDogbmV3RGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgICAgICAudXBkYXRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlOnNlbGVjdGVkJylcclxuICAgICAgICAgICAgLnN0eWxlKHsgJ2JvcmRlci13aWR0aCc6IE1hdGguY2VpbChkaW1lbnNpb24gLyAxNSkgfSlcclxuICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICB2YXIgdGFwZHJhZ0hhbmRsZXI9KGUpID0+IHtcclxuICAgICAgICBpbnN0YW5jZS5rZWVwQW5jaG9yc0Fic29sdXRlUG9zaXRpb25EdXJpbmdNb3ZpbmcoKVxyXG4gICAgICAgIGlmKGUudGFyZ2V0LmlzTm9kZSAmJiBlLnRhcmdldC5pc05vZGUoKSkgdGhpcy5kcmFnZ2luZ05vZGU9ZS50YXJnZXRcclxuICAgICAgICB0aGlzLnNtYXJ0UG9zaXRpb25Ob2RlKGUucG9zaXRpb24pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUdyYWIgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJncmFiXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBkcmFnZ2luZ05vZGVzID0gdGhpcy5jb3JlLmNvbGxlY3Rpb24oKVxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZS50YXJnZXQpXHJcbiAgICAgICAgICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlLmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGVsZSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaW5zdGFuY2Uuc3RvcmVBbmNob3JzQWJzb2x1dGVQb3NpdGlvbihkcmFnZ2luZ05vZGVzKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUub24oXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIgKVxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lRnJlZSgpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHZhciBzZXRPbmVUaW1lRnJlZSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvcmUub25jZShcImZyZWVcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgICAgICAgICAgaW5zdGFuY2UucmVzZXRBbmNob3JzQWJzb2x1dGVQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlPW51bGxcclxuICAgICAgICAgICAgc2V0T25lVGltZUdyYWIoKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUucmVtb3ZlTGlzdGVuZXIoXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHNldE9uZVRpbWVHcmFiKClcclxuXHJcbiAgICB2YXIgdXIgPSB0aGlzLmNvcmUudW5kb1JlZG8oe2lzRGVidWc6IGZhbHNlfSk7XHJcbiAgICB0aGlzLnVyPXVyXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc21hcnRQb3NpdGlvbk5vZGUgPSBmdW5jdGlvbiAobW91c2VQb3NpdGlvbikge1xyXG4gICAgdmFyIHpvb21MZXZlbD10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZighdGhpcy5kcmFnZ2luZ05vZGUpIHJldHVyblxyXG4gICAgLy9jb21wYXJpbmcgbm9kZXMgc2V0OiBpdHMgY29ubmVjdGZyb20gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3R0byBub2RlcywgaXRzIGNvbm5lY3R0byBub2RlcyBhbmQgdGhlaXIgY29ubmVjdGZyb20gbm9kZXNcclxuICAgIHZhciBpbmNvbWVycz10aGlzLmRyYWdnaW5nTm9kZS5pbmNvbWVycygpXHJcbiAgICB2YXIgb3V0ZXJGcm9tSW5jb209IGluY29tZXJzLm91dGdvZXJzKClcclxuICAgIHZhciBvdXRlcj10aGlzLmRyYWdnaW5nTm9kZS5vdXRnb2VycygpXHJcbiAgICB2YXIgaW5jb21Gcm9tT3V0ZXI9b3V0ZXIuaW5jb21lcnMoKVxyXG4gICAgdmFyIG1vbml0b3JTZXQ9aW5jb21lcnMudW5pb24ob3V0ZXJGcm9tSW5jb20pLnVuaW9uKG91dGVyKS51bmlvbihpbmNvbUZyb21PdXRlcikuZmlsdGVyKCdub2RlJykudW5tZXJnZSh0aGlzLmRyYWdnaW5nTm9kZSlcclxuXHJcbiAgICB2YXIgcmV0dXJuRXhwZWN0ZWRQb3M9KGRpZmZBcnIscG9zQXJyKT0+e1xyXG4gICAgICAgIHZhciBtaW5EaXN0YW5jZT1NYXRoLm1pbiguLi5kaWZmQXJyKVxyXG4gICAgICAgIGlmKG1pbkRpc3RhbmNlKnpvb21MZXZlbCA8IDEwKSAgcmV0dXJuIHBvc0FycltkaWZmQXJyLmluZGV4T2YobWluRGlzdGFuY2UpXVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHhEaWZmPVtdXHJcbiAgICB2YXIgeFBvcz1bXVxyXG4gICAgdmFyIHlEaWZmPVtdXHJcbiAgICB2YXIgeVBvcz1bXVxyXG4gICAgbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgeERpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS54LW1vdXNlUG9zaXRpb24ueCkpXHJcbiAgICAgICAgeFBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLngpXHJcbiAgICAgICAgeURpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS55LW1vdXNlUG9zaXRpb24ueSkpXHJcbiAgICAgICAgeVBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLnkpXHJcbiAgICB9KVxyXG4gICAgdmFyIHByZWZYPXJldHVybkV4cGVjdGVkUG9zKHhEaWZmLHhQb3MpXHJcbiAgICB2YXIgcHJlZlk9cmV0dXJuRXhwZWN0ZWRQb3MoeURpZmYseVBvcylcclxuICAgIGlmKHByZWZYIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3gnLCBwcmVmWCk7XHJcbiAgICB9XHJcbiAgICBpZihwcmVmWSE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd5JywgcHJlZlkpO1xyXG4gICAgfVxyXG4gICAgLy9jb25zb2xlLmxvZyhcIi0tLS1cIilcclxuICAgIC8vbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57Y29uc29sZS5sb2coZWxlLmlkKCkpfSlcclxuICAgIC8vY29uc29sZS5sb2cobW9uaXRvclNldC5zaXplKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU92ZXJGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmKCFlLnRhcmdldC5kYXRhKSByZXR1cm5cclxuICAgIFxyXG4gICAgdmFyIGluZm89ZS50YXJnZXQuZGF0YSgpLm9yaWdpbmFsSW5mb1xyXG4gICAgaWYoaW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PWUudGFyZ2V0XHJcbiAgICBlLnRhcmdldC5hZGRDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb0hvdmVyZWRFbGVcIiwgXCJpbmZvXCI6IFtpbmZvXSxcInNjcmVlblhZXCI6dGhpcy5jb252ZXJ0UG9zaXRpb24oZS5wb3NpdGlvbi54LGUucG9zaXRpb24ueSkgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNvbnZlcnRQb3NpdGlvbj1mdW5jdGlvbih4LHkpe1xyXG4gICAgdmFyIHZwRXh0ZW50PXRoaXMuY29yZS5leHRlbnQoKVxyXG4gICAgdmFyIHNjcmVlblc9dGhpcy5ET00ud2lkdGgoKVxyXG4gICAgdmFyIHNjcmVlbkg9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBzY3JlZW5YID0gKHgtdnBFeHRlbnQueDEpLyh2cEV4dGVudC53KSpzY3JlZW5XICsgdGhpcy5ET00ub2Zmc2V0KCkubGVmdFxyXG4gICAgdmFyIHNjcmVlblk9KHktdnBFeHRlbnQueTEpLyh2cEV4dGVudC5oKSpzY3JlZW5IKyB0aGlzLkRPTS5vZmZzZXQoKS50b3BcclxuICAgIHJldHVybiB7eDpzY3JlZW5YLHk6c2NyZWVuWX1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3V0RnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZihnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpeyAvL3NpbmNlIGZsb2F0aW5nIHdpbmRvdyBpcyB1c2VkIGZvciBtb3VzZSBob3ZlciBlbGVtZW50IGluZm8sIHNvIGluZm8gcGFuZWwgbmV2ZXIgY2hhZ25lIGJlZm9yZSwgdGhhdCBpcyB3aHkgdGhlcmUgaXMgbm8gbmVlZCB0byByZXN0b3JlIGJhY2sgdGhlIGluZm8gcGFuZWwgaW5mb3JtYXRpb24gYXQgbW91c2VvdXRcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUQpe1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb0dyb3VwTm9kZVwiLCBcImluZm9cIjoge1wiQGlkXCI6Z2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEfSB9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInRvcG9sb2d5TW91c2VPdXRcIn0pXHJcblxyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpe1xyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1udWxsO1xyXG4gICAgfSBcclxuXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiByZSB9KVxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxBdmFydGE9ZnVuY3Rpb24obW9kZWxJRCxkYXRhVXJsKXtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKSBcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5Db2xvcj1mdW5jdGlvbihtb2RlbElELGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5TaGFwZT1mdW5jdGlvbihtb2RlbElELHNoYXBlKXtcclxuICAgIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3NoYXBlJzogJ3BvbHlnb24nLCdzaGFwZS1wb2x5Z29uLXBvaW50cyc6WzAsLTEsMC44NjYsLTAuNSwwLjg2NiwwLjUsMCwxLC0wLjg2NiwwLjUsLTAuODY2LC0wLjVdfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydzaGFwZSc6IHNoYXBlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb249ZnVuY3Rpb24obW9kZWxJRCxkaW1lbnNpb25SYXRpbyl7XHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF09cGFyc2VGbG9hdChkaW1lbnNpb25SYXRpbylcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwQ29sb3I9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2xpbmUtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwU2hhcGU9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHNoYXBlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1zdHlsZSc6IHNoYXBlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwV2lkdGg9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGVkZ2VXaWR0aCl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCl9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2U6c2VsZWN0ZWRbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzEsJ2xpbmUtY29sb3InOiAncmVkJ30pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZS5ob3Zlcltzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrM30pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zKXtcclxuICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uW1wic3JjSURcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25JRD1vbmVSZWxhdGlvbltcInJlbElEXCJdXHJcbiAgICAgICAgdmFyIHRoZU5vZGVOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc3JjSURdXHJcbiAgICAgICAgdmFyIHRoZU5vZGU9dGhpcy5jb3JlLmZpbHRlcignW2lkID0gXCInK3RoZU5vZGVOYW1lKydcIl0nKTtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uSUQpe1xyXG4gICAgICAgICAgICAgICAgYW5FZGdlLnJlbW92ZSgpXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSkgICBcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdmFyIHR3aW5EaXNwbGF5TmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3R3aW5JRF1cclxuICAgICAgICB0aGlzLmNvcmUuJCgnW2lkID0gXCInK3R3aW5EaXNwbGF5TmFtZSsnXCJdJykucmVtb3ZlKClcclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0d2luLndpZHRoKClcclxuICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbioyLCd3aWR0aCc6IGN1ckRpbWVuc2lvbioyIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24sJ3dpZHRoJzogY3VyRGltZW5zaW9uIH0sXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgICAgICAgICAgLGNvbXBsZXRlOigpPT57XHJcbiAgICAgICAgICAgICAgICB0d2luLnJlbW92ZVN0eWxlKCkgLy9tdXN0IHJlbW92ZSB0aGUgc3R5bGUgYWZ0ZXIgYW5pbWF0aW9uLCBvdGhlcndpc2UgdGhleSB3aWxsIGhhdmUgdGhlaXIgb3duIHN0eWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sMjAwKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSxhbmltYXRpb24pe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0d2luc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz10d2luc0RhdGFbaV07XHJcbiAgICAgICAgdmFyIG5ld05vZGU9e2RhdGE6e30sZ3JvdXA6XCJub2Rlc1wifVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT0gb3JpZ2luYWxJbmZvO1xyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcImlkXCJdPW9yaWdpbmFsSW5mb1snZGlzcGxheU5hbWUnXVxyXG4gICAgICAgIHZhciBtb2RlbElEPW9yaWdpbmFsSW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wibW9kZWxJRFwiXT1tb2RlbElEXHJcbiAgICAgICAgYXJyLnB1c2gobmV3Tm9kZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY3VycmVudGx5IGEgbGF5b3V0IHRoZXJlLCBhcHBseSBpdFxyXG4gICAgdmFyIGxheW91dE5hbWU9Z2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgIGlmKGxheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgIHZhciBsYXlvdXREZXRhaWw9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICBpZihsYXlvdXREZXRhaWwpIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhsYXlvdXREZXRhaWwsdGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKCkpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiBlbGVzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3UmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgdmFyIHJlbGF0aW9uSW5mb0Fycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTxyZWxhdGlvbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89cmVsYXRpb25zRGF0YVtpXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGhlSUQ9b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddK1wiX1wiK29yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICB2YXIgYVJlbGF0aW9uPXtkYXRhOnt9LGdyb3VwOlwiZWRnZXNcIn1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT1vcmlnaW5hbEluZm9cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcImlkXCJdPXRoZUlEXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl09Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvcmlnaW5hbEluZm9bJyRzb3VyY2VJZCddXVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckdGFyZ2V0SWQnXV1cclxuXHJcblxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKS5sZW5ndGg9PTAgfHwgdGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl0pLmxlbmd0aD09MCkgY29udGludWVcclxuICAgICAgICB2YXIgc291cmNlTm9kZT10aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSlcclxuICAgICAgICB2YXIgc291cmNlTW9kZWw9c291cmNlTm9kZVswXS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBcclxuICAgICAgICAvL2FkZCBhZGRpdGlvbmFsIHNvdXJjZSBub2RlIGluZm9ybWF0aW9uIHRvIHRoZSBvcmlnaW5hbCByZWxhdGlvbnNoaXAgaW5mb3JtYXRpb25cclxuICAgICAgICBvcmlnaW5hbEluZm9bJ3NvdXJjZU1vZGVsJ109c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZU1vZGVsXCJdPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJyZWxhdGlvbnNoaXBOYW1lXCJdPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXVxyXG5cclxuICAgICAgICB2YXIgZXhpc3RFZGdlPXRoaXMuY29yZS4kKCdlZGdlW2lkID0gXCInK3RoZUlEKydcIl0nKVxyXG4gICAgICAgIGlmKGV4aXN0RWRnZS5zaXplKCk+MCkge1xyXG4gICAgICAgICAgICBleGlzdEVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiLG9yaWdpbmFsSW5mbylcclxuICAgICAgICAgICAgY29udGludWU7ICAvL25vIG5lZWQgdG8gZHJhdyBpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVsYXRpb25JbmZvQXJyLnB1c2goYVJlbGF0aW9uKVxyXG4gICAgfVxyXG4gICAgaWYocmVsYXRpb25JbmZvQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIGVkZ2VzPXRoaXMuY29yZS5hZGQocmVsYXRpb25JbmZvQXJyKVxyXG4gICAgcmV0dXJuIGVkZ2VzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3PWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NoZWNrIHRoZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgYWdhaW4gYW5kIG1heWJlIHNvbWUgb2YgdGhlbSBjYW4gYmUgZHJhd24gbm93IHNpbmNlIHRhcmdldE5vZGUgaXMgYXZhaWxhYmxlXHJcbiAgICB2YXIgc3RvcmVkUmVsYXRpb25BcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgc3RvcmVkUmVsYXRpb25BcnI9c3RvcmVkUmVsYXRpb25BcnIuY29uY2F0KGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKHN0b3JlZFJlbGF0aW9uQXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPWZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5zQW5kUmVsYXRpb25zPWRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9uc1xyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBuZXcgdHdpbnMgZmlyc3RcclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHR3aW5JbmZvQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpIHR3aW5JbmZvQXJyLnB1c2gob25lU2V0LmNoaWxkVHdpbnNbaW5kXSlcclxuICAgICAgICB2YXIgZWxlcz10aGlzLmRyYXdUd2lucyh0d2luSW5mb0FycixcImFuaW1hdGlvblwiKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0aGlzLmRyYXdUd2lucyh0bXBBcnIpXHJcblxyXG4gICAgLy90aGVuIGNoZWNrIGFsbCBzdG9yZWQgcmVsYXRpb25zaGlwcyBhbmQgZHJhdyBpZiBpdCBjYW4gYmUgZHJhd25cclxuICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZih2aXN1YWxKc29uPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdmlzdWFsSnNvbil7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5yZWxzKXtcclxuICAgICAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBOYW1lIGluIHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3IpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmVkZ2VXaWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVwbGFjZUFsbFR3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25SZWZyZXNoXCIpIHtcclxuICAgICAgICB0aGlzLmFwcGx5VmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYXBwZW5kQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8sXCJhbmltYXRlXCIpXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd0FsbFJlbGF0aW9uc1wiKXtcclxuICAgICAgICB2YXIgZWRnZXM9IHRoaXMuZHJhd1JlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgaWYoZWRnZXMhPW51bGwpIHtcclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9PW51bGwpICB0aGlzLm5vUG9zaXRpb25fY29zZSgpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMoW21zZ1BheWxvYWQudHdpbkluZm9dLFwiYW5pbWF0aW9uXCIpXHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLnR3aW5JbmZvO1xyXG4gICAgICAgIHZhciBub2RlTmFtZT0gZ2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtub2RlSW5mb1tcIiRkdElkXCJdXVxyXG4gICAgICAgIHZhciB0b3BvTm9kZT0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK25vZGVOYW1lKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdmFyIHBvc2l0aW9uPXRvcG9Ob2RlLnJlbmRlcmVkUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUucGFuQnkoe3g6LXBvc2l0aW9uLngrMjAwLHk6LXBvc2l0aW9uLnkrNTB9KVxyXG4gICAgICAgICAgICB0b3BvTm9kZS5zZWxlY3QoKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQudHdpbnNJbmZvLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXsgLy9mcm9tIHNlbGVjdGluZyB0d2lucyBpbiB0aGUgdHdpbnRyZWVcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBtb3VzZUNsaWNrRGV0YWlsPW1zZ1BheWxvYWQubW91c2VDbGlja0RldGFpbDtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFUd2luPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrZWxlbWVudFsnZGlzcGxheU5hbWUnXSlcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW25vZGVJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB0aGlzLmNvcmUuY2VudGVyKHRvcG9Ob2RlKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZWRnZVdpZHRoKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5lZGdlV2lkdGgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuYXZhcnRhKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQubm9BdmFydGEpICB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxudWxsKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZGltZW5zaW9uUmF0aW8pICB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9IFxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVsYXRpb25zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhtc2dQYXlsb2FkLnJlbGF0aW9ucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RUb1wiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdFRvXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdEZyb21cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RGcm9tXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0T3V0Ym91bmRcIil7IHRoaXMuc2VsZWN0T3V0Ym91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0SW5ib3VuZFwiKXsgdGhpcy5zZWxlY3RJbmJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLmhpZGVTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJDT1NFU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5DT1NFU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2F2ZUxheW91dFwiKXsgdGhpcy5zYXZlTGF5b3V0KG1zZ1BheWxvYWQubGF5b3V0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJsYXlvdXRDaGFuZ2VcIikge1xyXG4gICAgICAgIHZhciBsYXlvdXROYW1lID0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgICAgICBpZihsYXlvdXROYW1lPT1cIltOQV1cIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB2aXNpYmxlIG5vZGVzIGFuZCBkbyBhIENPU0UgbGF5b3V0LCBjbGVhbiBhbGwgYmVuZCBlZGdlIGxpbmUgYXMgd2VsbFxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgICAgIH1lbHNlIGlmIChsYXlvdXROYW1lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgaWYgKGxheW91dERldGFpbCkgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKGxheW91dERldGFpbCwgdGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKCkpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFsaWduU2VsZWN0ZWROb2RlXCIpIHRoaXMuYWxpZ25TZWxlY3RlZE5vZGVzKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiKSB0aGlzLmRpc3RyaWJ1dGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyb3RhdGVTZWxlY3RlZE5vZGVcIikgdGhpcy5yb3RhdGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJtaXJyb3JTZWxlY3RlZE5vZGVcIikgdGhpcy5taXJyb3JTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIikgdGhpcy5kaW1lbnNpb25TZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aWV3VHlwZUNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnZpZXdUeXBlPT1cIlRvcG9sb2d5XCIpIHRoaXMuc2hvd1NlbGYoKVxyXG4gICAgICAgIGVsc2UgdGhpcy5oaWRlU2VsZigpXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93U2VsZiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uYW5pbWF0ZSh7aGVpZ2h0OiBcIjEwMCVcIn0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaGlkZVNlbGYgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB0aGlzLkRPTS5hbmltYXRlKHtoZWlnaHQ6IFwiMCVcIn0sKCk9Pnt0aGlzLkRPTS5oaWRlKCl9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRpbWVuc2lvblNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciByYXRpbz0xLjJcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImV4cGFuZFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt4b2ZmY2VudGVyKnJhdGlvLGNlbnRlclkreW9mZmNlbnRlcipyYXRpb11cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJjb21wcmVzc1wiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt4b2ZmY2VudGVyL3JhdGlvLGNlbnRlclkreW9mZmNlbnRlci9yYXRpb11cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1pcnJvclNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgteG9mZmNlbnRlcixjdXJQb3NbJ3knXV1cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY2VudGVyWS15b2ZmY2VudGVyXVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucm90YXRlU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MikgcmV0dXJuO1xyXG4gICAgdmFyIGJvdW5kYXJ5PSBzZWxlY3RlZE5vZGVzLmJvdW5kaW5nQm94KHtpbmNsdWRlTGFiZWxzIDpmYWxzZSxpbmNsdWRlT3ZlcmxheXMgOmZhbHNlIH0pXHJcbiAgICB2YXIgY2VudGVyWD1ib3VuZGFyeVtcIngxXCJdK2JvdW5kYXJ5W1wid1wiXS8yXHJcbiAgICB2YXIgY2VudGVyWT1ib3VuZGFyeVtcInkxXCJdK2JvdW5kYXJ5W1wiaFwiXS8yXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICB2YXIgeG9mZmNlbnRlcj1jdXJQb3NbXCJ4XCJdLWNlbnRlclhcclxuICAgICAgICB2YXIgeW9mZmNlbnRlcj1jdXJQb3NbXCJ5XCJdLWNlbnRlcllcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwibGVmdFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt5b2ZmY2VudGVyLGNlbnRlclkteG9mZmNlbnRlcl1cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJyaWdodFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWC15b2ZmY2VudGVyLGNlbnRlclkreG9mZmNlbnRlcl1cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRpc3RyaWJ1dGVTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwzKSByZXR1cm47XHJcbiAgICB2YXIgbnVtQXJyPVtdXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbGF5b3V0Rm9yU29ydD1bXVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd5J10pXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneCddKVxyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgbGF5b3V0Rm9yU29ydC5wdXNoKHtpZDpub2RlSUQseDpjdXJQb3NbJ3gnXSx5OmN1clBvc1sneSddfSlcclxuICAgIH0pXHJcblxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIGxheW91dEZvclNvcnQuc29ydChmdW5jdGlvbiAoYSwgYikge3JldHVybiBhW1wieVwiXS1iW1wieVwiXSB9KVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBsYXlvdXRGb3JTb3J0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYVtcInhcIl0tYltcInhcIl0gfSlcclxuICAgIFxyXG4gICAgdmFyIG1pblY9TWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgdmFyIG1heFY9TWF0aC5tYXgoLi4ubnVtQXJyKVxyXG4gICAgaWYobWluVj09bWF4VikgcmV0dXJuO1xyXG4gICAgdmFyIGdhcD0obWF4Vi1taW5WKS8oc2VsZWN0ZWROb2Rlcy5zaXplKCktMSlcclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSB2YXIgY3VyVj1sYXlvdXRGb3JTb3J0WzBdW1wieVwiXVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBjdXJWPWxheW91dEZvclNvcnRbMF1bXCJ4XCJdXHJcbiAgICBmb3IodmFyIGk9MDtpPGxheW91dEZvclNvcnQubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZU5vZGVJbmZvPWxheW91dEZvclNvcnRbaV1cclxuICAgICAgICBpZihpPT0wfHwgaT09bGF5b3V0Rm9yU29ydC5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIG5ld0xheW91dFtvbmVOb2RlSW5mby5pZF09W29uZU5vZGVJbmZvWyd4J10sb25lTm9kZUluZm9bJ3knXV1cclxuICAgICAgICAgICAgY29udGludWVcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VyVis9Z2FwO1xyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtvbmVOb2RlSW5mb1sneCddLGN1clZdXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtjdXJWLG9uZU5vZGVJbmZvWyd5J11dXHJcbiAgICB9XHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFsaWduU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBudW1BcnI9W11cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ0b3BcInx8IGRpcmVjdGlvbj09XCJib3R0b21cIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3knXSlcclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJsZWZ0XCJ8fCBkaXJlY3Rpb249PVwicmlnaHRcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3gnXSlcclxuICAgIH0pXHJcbiAgICB2YXIgdGFyZ2V0WD10YXJnZXRZPW51bGxcclxuICAgIGlmKGRpcmVjdGlvbj09XCJ0b3BcIikgdmFyIHRhcmdldFk9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImJvdHRvbVwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5tYXgoLi4ubnVtQXJyKVxyXG4gICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgdmFyIHRhcmdldFg9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cInJpZ2h0XCIpIHZhciB0YXJnZXRYPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBuZXdMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgaWYodGFyZ2V0WCE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMF09dGFyZ2V0WFxyXG4gICAgICAgIGlmKHRhcmdldFkhPW51bGwpIG5ld0xheW91dFtub2RlSURdWzFdPXRhcmdldFlcclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwgPSBmdW5jdGlvbiAobGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24pIHtcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICBpZighb25seUFkanVzdE5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsW10pXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsW10pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBpZihpbmQgPT0gXCJlZGdlc1wiKSBjb250aW51ZVxyXG4gICAgICAgIHN0b3JlZFBvc2l0aW9uc1tpbmRdPXtcclxuICAgICAgICAgICAgeDpsYXlvdXREZXRhaWxbaW5kXVswXVxyXG4gICAgICAgICAgICAseTpsYXlvdXREZXRhaWxbaW5kXVsxXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBuZXdMYXlvdXQ9dGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOnN0b3JlZFBvc2l0aW9ucyxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogMzAwLFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG5cclxuICAgIC8vcmVzdG9yZSBlZGdlcyBiZW5kaW5nIG9yIGNvbnRyb2wgcG9pbnRzXHJcbiAgICB2YXIgZWRnZVBvaW50c0RpY3Q9bGF5b3V0RGV0YWlsW1wiZWRnZXNcIl1cclxuICAgIGlmKGVkZ2VQb2ludHNEaWN0PT1udWxsKXJldHVybjtcclxuICAgIGZvcih2YXIgc3JjSUQgaW4gZWRnZVBvaW50c0RpY3Qpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwSUQgaW4gZWRnZVBvaW50c0RpY3Rbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIG9iaj1lZGdlUG9pbnRzRGljdFtzcmNJRF1bcmVsYXRpb25zaGlwSURdXHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMoc3JjSUQscmVsYXRpb25zaGlwSUQsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdXHJcbiAgICAgICAgICAgICxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyA9IGZ1bmN0aW9uIChuZXdMYXlvdXREZXRhaWwsb2xkTGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24pIHtcclxuICAgIC8vc3RvcmUgY3VycmVudCBsYXlvdXQgZm9yIHVuZG8gb3BlcmF0aW9uXHJcbiAgICB0aGlzLnVyLmFjdGlvbiggXCJjaGFuZ2VMYXlvdXRcIlxyXG4gICAgICAgICwgKGFyZyk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGFyZy5uZXdMYXlvdXREZXRhaWwsYXJnLm9ubHlBZGp1c3ROb2RlUG9zaXRpb24pICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ1xyXG4gICAgICAgIH1cclxuICAgICAgICAsIChhcmcpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3QmFzZWRPbkxheW91dERldGFpbChhcmcub2xkTGF5b3V0RGV0YWlsLGFyZy5vbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgdGhpcy51ci5kbyhcImNoYW5nZUxheW91dFwiXHJcbiAgICAgICAgLCB7IGZpcnN0VGltZTogdHJ1ZSwgXCJuZXdMYXlvdXREZXRhaWxcIjogbmV3TGF5b3V0RGV0YWlsLCBcIm9sZExheW91dERldGFpbFwiOiBvbGRMYXlvdXREZXRhaWwsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCI6b25seUFkanVzdE5vZGVQb3NpdGlvbn1cclxuICAgIClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciBub2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytub2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgaWYodGhlTm9kZS5sZW5ndGg9PTApIHJldHVybjtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uc2hpcElEKXtcclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEN1cnJlbnRMYXlvdXREZXRhaWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD17XCJlZGdlc1wiOnt9fVxyXG4gICAgaWYodGhpcy5jb3JlLm5vZGVzKCkuc2l6ZSgpPT0wKSByZXR1cm4gbGF5b3V0RGljdDtcclxuICAgIC8vc3RvcmUgbm9kZXMgcG9zaXRpb25cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBsYXlvdXREaWN0W29uZU5vZGUuaWQoKV09W3RoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd4J10pLHRoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd5J10pXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3N0b3JlIGFueSBlZGdlIGJlbmRpbmcgcG9pbnRzIG9yIGNvbnRyb2xpbmcgcG9pbnRzXHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgaWYoIWN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiAhY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmKGxheW91dERpY3QuZWRnZXNbc3JjSURdPT1udWxsKWxheW91dERpY3QuZWRnZXNbc3JjSURdPXt9XHJcbiAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdPXt9XHJcbiAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGxheW91dERpY3Q7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zYXZlTGF5b3V0ID0gYXN5bmMgZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV09e31cclxuICAgIH1cclxuICAgIGlmKGxheW91dERpY3RbXCJlZGdlc1wiXT09bnVsbCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdPXt9XHJcbiAgICBcclxuICAgIHZhciBzaG93aW5nTGF5b3V0PXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICB2YXIgc2hvd2luZ0VkZ2VzTGF5b3V0PSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGRlbGV0ZSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdMYXlvdXQpIGxheW91dERpY3RbaW5kXT1zaG93aW5nTGF5b3V0W2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdFZGdlc0xheW91dCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdW2luZF09c2hvd2luZ0VkZ2VzTGF5b3V0W2luZF1cclxuXHJcbiAgICB2YXIgc2F2ZUxheW91dE9iaj17XCJsYXlvdXRzXCI6e319XHJcbiAgICBzYXZlTGF5b3V0T2JqW1wibGF5b3V0c1wiXVtsYXlvdXROYW1lXT1KU09OLnN0cmluZ2lmeShsYXlvdXREaWN0KSAgXHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2F2ZUxheW91dFwiLCBcIlBPU1RcIiwgc2F2ZUxheW91dE9iaixcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiLFwibGF5b3V0TmFtZVwiOmxheW91dE5hbWV9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubnVtYmVyUHJlY2lzaW9uID0gZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShudW1iZXIpKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPG51bWJlci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbnVtYmVyW2ldID0gdGhpcy5udW1iZXJQcmVjaXNpb24obnVtYmVyW2ldKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9ZWxzZVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQobnVtYmVyLnRvRml4ZWQoMykpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5DT1NFU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZD10aGlzLmNvcmUuJCgnOnNlbGVjdGVkJylcclxuICAgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKHNlbGVjdGVkKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaGlkZVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBzZWxlY3RlZE5vZGVzLnJlbW92ZSgpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RJbmJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz10aGlzLmNvcmUubm9kZXMoKS5lZGdlc1RvKHNlbGVjdGVkTm9kZXMpLnNvdXJjZXMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0T3V0Ym91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXNlbGVjdGVkTm9kZXMuZWRnZXNUbyh0aGlzLmNvcmUubm9kZXMoKSkudGFyZ2V0cygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hZGRDb25uZWN0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXROb2RlKSB7XHJcbiAgICB2YXIgdGhlQ29ubmVjdE1vZGU9dGhpcy50YXJnZXROb2RlTW9kZVxyXG4gICAgdmFyIHNyY05vZGVBcnI9dGhpcy5jb3JlLm5vZGVzKFwiOnNlbGVjdGVkXCIpXHJcblxyXG4gICAgdmFyIHByZXBhcmF0aW9uSW5mbz1bXVxyXG5cclxuICAgIHNyY05vZGVBcnIuZm9yRWFjaCh0aGVOb2RlPT57XHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlc1xyXG4gICAgICAgIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RUb1wiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7ZnJvbTp0aGVOb2RlLHRvOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1lbHNlIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RGcm9tXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHt0bzp0aGVOb2RlLGZyb206dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vVE9ETzogY2hlY2sgaWYgaXQgaXMgbmVlZGVkIHRvIHBvcHVwIGRpYWxvZywgaWYgYWxsIGNvbm5lY3Rpb24gaXMgZG9hYmxlIGFuZCBvbmx5IG9uZSB0eXBlIHRvIHVzZSwgbm8gbmVlZCB0byBzaG93IGRpYWxvZ1xyXG4gICAgdGhpcy5zaG93Q29ubmVjdGlvbkRpYWxvZyhwcmVwYXJhdGlvbkluZm8pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93Q29ubmVjdGlvbkRpYWxvZyA9IGZ1bmN0aW9uIChwcmVwYXJhdGlvbkluZm8pIHtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIHJlc3VsdEFjdGlvbnM9W11cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQ1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBjb25uZWN0aW9uc1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJcIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9ucyhyZXN1bHRBY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuZW1wdHkoKVxyXG4gICAgcHJlcGFyYXRpb25JbmZvLmZvckVhY2goKG9uZVJvdyxpbmRleCk9PntcclxuICAgICAgICByZXN1bHRBY3Rpb25zLnB1c2godGhpcy5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93KG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93ID0gZnVuY3Rpb24gKG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSB7XHJcbiAgICB2YXIgcmV0dXJuT2JqPXt9XHJcbiAgICB2YXIgZnJvbU5vZGU9b25lUm93LmZyb21cclxuICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICB2YXIgY29ubmVjdGlvblR5cGVzPW9uZVJvdy5jb25uZWN0XHJcbiAgICB2YXIgbGFiZWw9JCgnPGxhYmVsIHN0eWxlPVwiZGlzcGxheTpibG9jazttYXJnaW4tYm90dG9tOjJweFwiPjwvbGFiZWw+JylcclxuICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJyZWRcIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiTm8gdXNhYmxlIGNvbm5lY3Rpb24gdHlwZSBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hUeXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIpXHJcbiAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIGNvbm5lY3Rpb25UeXBlcy5mb3JFYWNoKG9uZVR5cGU9PntcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmFkZE9wdGlvbihvbmVUeXBlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZWZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZWZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09Y29ubmVjdGlvblR5cGVzWzBdXHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MSl7XHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwiZ3JlZW5cIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiQWRkIDxiPlwiK2Nvbm5lY3Rpb25UeXBlc1swXStcIjwvYj4gY29ubmVjdGlvbiBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgIH1cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmFwcGVuZChsYWJlbClcclxuICAgIHJldHVybiByZXR1cm5PYmo7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9ucyA9IGFzeW5jIGZ1bmN0aW9uIChyZXN1bHRBY3Rpb25zKSB7XHJcbiAgICAvLyBmb3IgZWFjaCByZXN1bHRBY3Rpb25zLCBjYWxjdWxhdGUgdGhlIGFwcGVuZGl4IGluZGV4LCB0byBhdm9pZCBzYW1lIElEIGlzIHVzZWQgZm9yIGV4aXN0ZWQgY29ubmVjdGlvbnNcclxuICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZmluYWxBY3Rpb25zPVtdXHJcbiAgICByZXN1bHRBY3Rpb25zLmZvckVhY2gob25lQWN0aW9uPT57XHJcbiAgICAgICAgdmFyIG9uZUZpbmFsQWN0aW9uPXt9XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkc3JjSWRcIl09b25lQWN0aW9uW1wiZnJvbVwiXVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdPXV1aWR2NCgpO1xyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wib2JqXCJdPXtcclxuICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjogb25lQWN0aW9uW1widG9cIl0sXHJcbiAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjogb25lQWN0aW9uW1wiY29ubmVjdFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbEFjdGlvbnMucHVzaChvbmVGaW5hbEFjdGlvbilcclxuICAgIH0pXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9jcmVhdGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsICB7YWN0aW9uczpKU09OLnN0cmluZ2lmeShmaW5hbEFjdGlvbnMpfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKGRhdGEpXHJcbiAgICB0aGlzLmRyYXdSZWxhdGlvbnMoZGF0YSlcclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSA9IGZ1bmN0aW9uIChmcm9tTm9kZU1vZGVsLHRvTm9kZU1vZGVsKSB7XHJcbiAgICB2YXIgcmU9W11cclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW2Zyb21Ob2RlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHRvTm9kZUJhc2VDbGFzc2VzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0b05vZGVNb2RlbF0uYWxsQmFzZUNsYXNzZXNcclxuICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbk5hbWUgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdmFyIHRoZVJlbGF0aW9uVHlwZT12YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25OYW1lXVxyXG4gICAgICAgICAgICBpZih0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT1udWxsXHJcbiAgICAgICAgICAgICAgICAgfHwgdGhlUmVsYXRpb25UeXBlLnRhcmdldD09dG9Ob2RlTW9kZWxcclxuICAgICAgICAgICAgICAgICB8fHRvTm9kZUJhc2VDbGFzc2VzW3RoZVJlbGF0aW9uVHlwZS50YXJnZXRdIT1udWxsKSByZS5wdXNoKHJlbGF0aW9uTmFtZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZXRLZXlEb3duRnVuYz1mdW5jdGlvbihpbmNsdWRlQ2FuY2VsQ29ubmVjdE9wZXJhdGlvbil7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiwgIChlKT0+e1xyXG4gICAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS50YXJnZXQubm9kZU5hbWUgPT09ICdCT0RZJyl7XHJcbiAgICAgICAgICAgIGlmIChlLndoaWNoID09PSA5MCkgICB0aGlzLnVyLnVuZG8oKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZS53aGljaCA9PT0gODkpICAgIHRoaXMudXIucmVkbygpO1xyXG4gICAgICAgICAgICBlbHNlIGlmKGUud2hpY2g9PT04Myl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOlwicG9wdXBMYXlvdXRFZGl0aW5nXCJ9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpICAgIFxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zdGFydFRhcmdldE5vZGVNb2RlID0gZnVuY3Rpb24gKG1vZGUpIHtcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIHRydWUgKTtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnY3Jvc3NoYWlyJztcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bW9kZTtcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoXCJpbmNsdWRlQ2FuY2VsQ29ubmVjdE9wZXJhdGlvblwiKVxyXG5cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9uKCdjbGljaycsIChlKT0+e1xyXG4gICAgICAgIHZhciBjbGlja2VkTm9kZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHRoaXMuYWRkQ29ubmVjdGlvbnMoY2xpY2tlZE5vZGUpXHJcbiAgICAgICAgLy9kZWxheSBhIHNob3J0IHdoaWxlIHNvIG5vZGUgc2VsZWN0aW9uIHdpbGwgbm90IGJlIGNoYW5nZWQgdG8gdGhlIGNsaWNrZWQgdGFyZ2V0IG5vZGVcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpfSw1MClcclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNhbmNlbFRhcmdldE5vZGVNb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW51bGw7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xyXG4gICAgJChkb2N1bWVudCkub2ZmKCdrZXlkb3duJyk7XHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKClcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9mZihcImNsaWNrXCIpXHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCBmYWxzZSApO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fZ3JpZD1mdW5jdGlvbihlbGVzKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSBlbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29zZT1mdW5jdGlvbihlbGVzKXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2Nvc2UnLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlXHJcbiAgICAgICAgLGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29uY2VudHJpYz1mdW5jdGlvbihlbGVzLGJveCl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2NvbmNlbnRyaWMnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBtaW5Ob2RlU3BhY2luZzo2MCxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYm91bmRpbmdCb3g6Ym94XHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubGF5b3V0V2l0aE5vZGVQb3NpdGlvbj1mdW5jdGlvbihub2RlUG9zaXRpb24pe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IHRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczogbm9kZVBvc2l0aW9uLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLCAvLyB3aGV0aGVyIHRvIHRyYW5zaXRpb24gdGhlIG5vZGUgcG9zaXRpb25zXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDUwMCwgLy8gZHVyYXRpb24gb2YgYW5pbWF0aW9uIGluIG1zIGlmIGVuYWJsZWRcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHRvcG9sb2d5RE9NOyIsImNvbnN0IHNpbXBsZVRyZWU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbmV3VHdpbkRpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZ1wiKTtcclxuXHJcbmZ1bmN0aW9uIHR3aW5zVHJlZShET00sIHNlYXJjaERPTSkge1xyXG4gICAgdGhpcy50cmVlPW5ldyBzaW1wbGVUcmVlKERPTSx7XCJsZWFmTmFtZVByb3BlcnR5XCI6XCJkaXNwbGF5TmFtZVwifSlcclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYz0oZ24pPT57XHJcbiAgICAgICAgdmFyIG1vZGVsQ2xhc3M9Z24uaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgIHZhciBkYk1vZGVsSW5mbz1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQk1vZGVsQnlJRChtb2RlbENsYXNzKVxyXG4gICAgICAgIHZhciBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgdmFyIHNoYXBlPVwiZWxsaXBzZVwiXHJcbiAgICAgICAgdmFyIGF2YXJ0YT1udWxsXHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXSl7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICB2YXIgc2hhcGU9ICB2aXN1YWxKc29uLnNoYXBlIHx8IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGE9IHZpc3VhbEpzb24uYXZhcnRhIFxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24qPXBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZTtwYWRkaW5nLXRvcDoycHgnPjwvZGl2PlwiKVxyXG4gICAgICAgIGlmKGRiTW9kZWxJbmZvICYmIGRiTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgICAgICB2YXIgaW90RGl2PSQoXCI8ZGl2IGNsYXNzPSd3My1ib3JkZXInIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtyaWdodDotNXB4O3BhZGRpbmc6MHB4IDJweDt0b3A6LTdweDtib3JkZXItcmFkaXVzOiAzcHg7Zm9udC1zaXplOjdweCc+SW9UPC9kaXY+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGlvdERpdilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgIGlmKGF2YXJ0YSl7XHJcbiAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyA9IChnbikgPT4ge1xyXG4gICAgICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweDtwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2hlaWdodDoyN3B4OyByaWdodDoxMHB4O3RyYW5zZm9ybTp0cmFuc2xhdGVZKC01MCUpXCI+KzwvYnV0dG9uPicpXHJcbiAgICAgICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICAgICAgbmV3VHdpbkRpYWxvZy5wb3B1cCh7XHJcbiAgICAgICAgICAgICAgICBcIiRtZXRhZGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkbW9kZWxcIjogZ24uaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybiBhZGRCdXR0b247XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXM9KG5vZGVzQXJyLG1vdXNlQ2xpY2tEZXRhaWwpPT57XHJcbiAgICAgICAgdmFyIGluZm9BcnI9W11cclxuICAgICAgICBub2Rlc0Fyci5mb3JFYWNoKChpdGVtLCBpbmRleCkgPT57XHJcbiAgICAgICAgICAgIGluZm9BcnIucHVzaChpdGVtLmxlYWZJbmZvKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiAgcGxhY2Vob2xkZXI9XCJzZWFyY2guLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dFwiKTtcclxuICAgIHRoaXMuc2VhcmNoQm94LmNzcyh7XCJvdXRsaW5lXCI6XCJub25lXCIsXCJoZWlnaHRcIjpcIjEwMCVcIixcIndpZHRoXCI6XCIxMDAlXCJ9KSBcclxuICAgIHNlYXJjaERPTS5hcHBlbmQodGhpcy5zZWFyY2hCb3gpXHJcbiAgICB2YXIgaGlkZU9yU2hvd0VtcHR5R3JvdXA9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoyMHB4O2JvcmRlcjpub25lO3BhZGRpbmctbGVmdDoycHhcIiBjbGFzcz1cInczLWJsb2NrIHczLXRpbnkgdzMtaG92ZXItcmVkIHczLWFtYmVyXCI+SGlkZSBFbXB0eSBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZChoaWRlT3JTaG93RW1wdHlHcm91cClcclxuICAgIERPTS5jc3MoXCJ0b3BcIixcIjUwcHhcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIik9PVwic2hvd1wiKXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwiaGlkZVwiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiU2hvdyBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXA9dHJ1ZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJIaWRlIEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpfSlcclxuICAgIH0pXHJcbiAgICB0aGlzLnNlYXJjaEJveC5rZXl1cCgoZSk9PntcclxuICAgICAgICBpZihlLmtleUNvZGUgPT0gMTMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgYU5vZGUgPSB0aGlzLnRyZWUuc2VhcmNoVGV4dCgkKGUudGFyZ2V0KS52YWwoKSlcclxuICAgICAgICAgICAgaWYoYU5vZGUhPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgYU5vZGUucGFyZW50R3JvdXBOb2RlLmV4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2VsZWN0TGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2Nyb2xsVG9MZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnNoYXBlU3ZnPWZ1bmN0aW9uKHNoYXBlLGNvbG9yKXtcclxuICAgIGlmKHNoYXBlPT1cImVsbGlwc2VcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48Y2lyY2xlIGN4PVwiNTBcIiBjeT1cIjUwXCIgcj1cIjUwXCIgIGZpbGw9XCInK2NvbG9yKydcIi8+PC9zdmc+J1xyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwiaGV4YWdvblwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxwb2x5Z29uIHBvaW50cz1cIjUwIDAsIDkzLjMgMjUsIDkzLjMgNzUsIDUwIDEwMCwgNi43IDc1LCA2LjcgMjVcIiAgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwicm91bmQtcmVjdGFuZ2xlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHJlY3QgeD1cIjEwXCIgeT1cIjEwXCIgcng9XCIxMFwiIHJ5PVwiMTBcIiB3aWR0aD1cIjgwXCIgaGVpZ2h0PVwiODBcIiBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwicmVwbGFjZVwiKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fYXBwZW5kXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwiYXBwZW5kXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHRoaXMuZHJhd09uZVR3aW4obXNnUGF5bG9hZC50d2luSW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5zXCIpIHtcclxuICAgICAgICBtc2dQYXlsb2FkLnR3aW5zSW5mby5mb3JFYWNoKG9uZVR3aW5JbmZvPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luSW5mbyl9KVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKCFtc2dQYXlsb2FkLnNyY01vZGVsSUQpeyAvLyBjaGFuZ2UgbW9kZWwgY2xhc3MgdmlzdWFsaXphdGlvblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57Z24ucmVmcmVzaE5hbWUoKX0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdmFyIHR3aW5EaXNwbGF5TmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3R3aW5JRF1cclxuICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUodHdpbkRpc3BsYXlOYW1lKVxyXG4gICAgfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbW9kZWxzRGF0YT17fVxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIG9uZU1vZGVsPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIG1vZGVsc0RhdGFbb25lTW9kZWxbXCJkaXNwbGF5TmFtZVwiXV0gPSBvbmVNb2RlbFxyXG4gICAgfVxyXG4gICAgLy9kZWxldGUgYWxsIGdyb3VwIG5vZGVzIG9mIGRlbGV0ZWQgbW9kZWxzXHJcbiAgICB2YXIgYXJyPVtdLmNvbmNhdCh0aGlzLnRyZWUuZ3JvdXBOb2RlcylcclxuICAgIGFyci5mb3JFYWNoKChnbm9kZSk9PntcclxuICAgICAgICBpZihtb2RlbHNEYXRhW2dub2RlLm5hbWVdPT1udWxsKXtcclxuICAgICAgICAgICAgLy9kZWxldGUgdGhpcyBncm91cCBub2RlXHJcbiAgICAgICAgICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy90aGVuIGFkZCBhbGwgZ3JvdXAgbm9kZXMgdGhhdCB0byBiZSBhZGRlZFxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbE5hbWVBcnI9W11cclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e2N1cnJlbnRNb2RlbE5hbWVBcnIucHVzaChnbm9kZS5uYW1lKX0pXHJcblxyXG4gICAgdmFyIGFjdHVhbE1vZGVsTmFtZUFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxzRGF0YSkgYWN0dWFsTW9kZWxOYW1lQXJyLnB1c2goaW5kKVxyXG4gICAgYWN0dWFsTW9kZWxOYW1lQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcblxyXG4gICAgZm9yKHZhciBpPTA7aTxhY3R1YWxNb2RlbE5hbWVBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgaWYoaTxjdXJyZW50TW9kZWxOYW1lQXJyLmxlbmd0aCAmJiBjdXJyZW50TW9kZWxOYW1lQXJyW2ldPT1hY3R1YWxNb2RlbE5hbWVBcnJbaV0pIGNvbnRpbnVlXHJcbiAgICAgICAgLy9vdGhlcndpc2UgYWRkIHRoaXMgZ3JvdXAgdG8gdGhlIHRyZWVcclxuICAgICAgICB2YXIgbmV3R3JvdXA9dGhpcy50cmVlLmluc2VydEdyb3VwTm9kZShtb2RlbHNEYXRhW2FjdHVhbE1vZGVsTmFtZUFycltpXV0saSlcclxuICAgICAgICBuZXdHcm91cC5zaHJpbmsoKVxyXG4gICAgICAgIGN1cnJlbnRNb2RlbE5hbWVBcnIuc3BsaWNlKGksIDAsIGFjdHVhbE1vZGVsTmFtZUFycltpXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmxvYWRTdGFydFNlbGVjdGlvbj1hc3luYyBmdW5jdGlvbih0d2luSURzLG1vZGVsSURzLHJlcGxhY2VPckFwcGVuZCl7XHJcbiAgICBpZihyZXBsYWNlT3JBcHBlbmQ9PVwicmVwbGFjZVwiKSB0aGlzLnRyZWUuY2xlYXJBbGxMZWFmTm9kZXMoKVxyXG5cclxuICAgIFxyXG4gICAgdGhpcy5yZWZyZXNoTW9kZWxzKClcclxuICAgIFxyXG4gICAgLy9hZGQgbmV3IHR3aW5zIHVuZGVyIHRoZSBtb2RlbCBncm91cCBub2RlXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHR3aW5zZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2xpc3RUd2luc0ZvcklEc1wiLCBcIlBPU1RcIiwgdHdpbklEcylcclxuICAgICAgICB2YXIgdHdpbklEQXJyID0gW11cclxuICAgICAgICAvL2NoZWNrIGlmIGFueSBjdXJyZW50IGxlYWYgbm9kZSBkb2VzIG5vdCBoYXZlIHN0b3JlZCBvdXRib3VuZCByZWxhdGlvbnNoaXAgZGF0YSB5ZXRcclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSkgPT4ge1xyXG4gICAgICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGxlYWZOb2RlID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBub2RlSWQgPSBsZWFmTm9kZS5sZWFmSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW25vZGVJZF0gPT0gbnVsbCkgdHdpbklEQXJyLnB1c2gobm9kZUlkKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlQURUVHdpbnModHdpbnNkYXRhKVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHdpbnNkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBncm91cE5hbWUgPSBnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW3R3aW5zZGF0YVtpXVtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgICAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsIHR3aW5zZGF0YVtpXSwgXCJza2lwUmVwZWF0XCIpXHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKHR3aW5zZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihyZXBsYWNlT3JBcHBlbmQ9PVwicmVwbGFjZVwiKSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZXBsYWNlQWxsVHdpbnNcIiwgaW5mbzogdHdpbnNkYXRhIH0pXHJcbiAgICAgICAgZWxzZSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhcHBlbmRBbGxUd2luc1wiLCBpbmZvOiB0d2luc2RhdGEgfSlcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRtcEFyci5mb3JFYWNoKG9uZVR3aW49Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3T25lVHdpbj0gZnVuY3Rpb24odHdpbkluZm8pe1xyXG4gICAgdmFyIGdyb3VwTmFtZT1nbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZ2V0UmVsYXRpb25zaGlwc0Zyb21Ud2luSURzXCIsIFwiUE9TVFwiLCBzbWFsbEFycilcclxuICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgY29udGludWU7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHR3aW5zVHJlZTsiLCJjb25zdCBzaWdudXBzaWduaW5uYW1lPVwiQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIlxyXG5jb25zdCBiMmNUZW5hbnROYW1lPVwiYXp1cmVpb3RiMmNcIlxyXG5cclxuY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcblxyXG52YXIgc3RyQXJyPXdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVxyXG52YXIgaXNMb2NhbFRlc3Q9KHN0ckFyci5pbmRleE9mKFwidGVzdD0xXCIpIT0tMSlcclxuXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXtcclxuICAgIFwiYjJjU2lnblVwU2lnbkluTmFtZVwiOiBzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgXCJiMmNTY29wZV90YXNrbWFzdGVyXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL3Rhc2ttYXN0ZXJtb2R1bGUvb3BlcmF0aW9uXCIsXHJcbiAgICBcImIyY1Njb3BlX2Z1bmN0aW9uc1wiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9henVyZWlvdHJvY2tzZnVuY3Rpb25zL2Jhc2ljXCIsXHJcbiAgICBcImxvZ291dFJlZGlyZWN0VXJpXCI6IHVybC5vcmlnaW4rXCIvc3BhaW5kZXguaHRtbFwiLFxyXG4gICAgXCJtc2FsQ29uZmlnXCI6e1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL1wiK3NpZ251cHNpZ25pbm5hbWUsXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFtiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbVwiXSxcclxuICAgICAgICAgICAgcmVkaXJlY3RVcmk6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsIFxyXG4gICAgICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3lzdGVtOiB7XHJcbiAgICAgICAgICAgIGxvZ2dlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlckNhbGxiYWNrOiAobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKSA9PiB7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaXNMb2NhbFRlc3RcIjppc0xvY2FsVGVzdCxcclxuICAgIFwidGFza01hc3RlckFQSVVSSVwiOigoaXNMb2NhbFRlc3QpP1wiaHR0cDovL2xvY2FsaG9zdDo1MDAyL1wiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzdGFza21hc3Rlcm1vZHVsZS5henVyZXdlYnNpdGVzLm5ldC9cIiksXHJcbiAgICBcImZ1bmN0aW9uc0FQSVVSSVwiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzZnVuY3Rpb25zLmF6dXJld2Vic2l0ZXMubmV0L2FwaS9cIlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbEFwcFNldHRpbmdzOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5wYXJzZUpXVD1mdW5jdGlvbih0b2tlbil7XHJcbiAgICB2YXIgYmFzZTY0VXJsID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcclxuICAgIHZhciBiYXNlNjQgPSBiYXNlNjRVcmwucmVwbGFjZSgvLS9nLCAnKycpLnJlcGxhY2UoL18vZywgJy8nKTtcclxuICAgIGJhc2U2ND0gQnVmZmVyLmZyb20oYmFzZTY0LCAnYmFzZTY0JykudG9TdHJpbmcoKTtcclxuICAgIHZhciBqc29uUGF5bG9hZCA9IGRlY29kZVVSSUNvbXBvbmVudChiYXNlNjQuc3BsaXQoJycpLm1hcChmdW5jdGlvbihjKSB7XHJcbiAgICAgICAgcmV0dXJuICclJyArICgnMDAnICsgYy5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKDE2KSkuc2xpY2UoLTIpO1xyXG4gICAgfSkuam9pbignJykpO1xyXG5cclxuICAgIHJldHVybiBKU09OLnBhcnNlKGpzb25QYXlsb2FkKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUucmVsb2FkVXNlckFjY291bnREYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlcz1hd2FpdCB0aGlzLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9mZXRjaFVzZXJEYXRhXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcblxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVVc2VyRGF0YShyZXMpXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBUEk9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCx3aXRoUHJvamVjdElEKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICBpZih3aXRoUHJvamVjdElEKXtcclxuICAgICAgICBwYXlsb2FkPXBheWxvYWR8fHt9XHJcbiAgICAgICAgcGF5bG9hZFtcInByb2plY3RJRFwiXT1nbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEXHJcbiAgICB9IFxyXG4gICAgaWYoIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KXtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciB0b2tlbj1hd2FpdCB0aGlzLmdldFRva2VuKGdsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3BlX3Rhc2ttYXN0ZXIpXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaSxcIl9zZWxmXCIpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcblxyXG4gICAgICAgIC8vaW4gY2FzZSBqb2luZWQgcHJvamVjdHMgSldUIGlzIGdvaW5nIHRvIGV4cGlyZSwgcmVuZXcgYW5vdGhlciBvbmVcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKSB7XHJcbiAgICAgICAgICAgIHZhciBleHBUUz10aGlzLnBhcnNlSldUKGdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW4pLmV4cFxyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoZXhwVFMtY3VyclRpbWU8NjApeyAvL2ZldGNoIGEgbmV3IHByb2plY3RzIEpXVCB0b2tlbiBcclxuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMucmVsb2FkVXNlckFjY291bnREYXRhKClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9pZiB0aGUgQVBJIG5lZWQgdG8gdXNlIHByb2plY3QgSUQsIG11c3QgYWRkIGEgaGVhZGVyIFwicHJvamVjdHNcIiBqd3QgdG9rZW4gc28gc2VydmVyIHNpZGUgd2lsbCB2ZXJpZnlcclxuICAgICAgICBpZihwYXlsb2FkICYmIHBheWxvYWQucHJvamVjdElEICYmIGdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW4pe1xyXG4gICAgICAgICAgICBoZWFkZXJzT2JqW1wicHJvamVjdHNcIl09Z2xvYmFsQ2FjaGUuam9pbmVkUHJvamVjdHNUb2tlblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLnRhc2tNYXN0ZXJBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZ2V0VG9rZW49YXN5bmMgZnVuY3Rpb24oYjJjU2NvcGUpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW49PW51bGwpIHRoaXMuc3RvcmVkVG9rZW49e31cclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBjdXJyVGltZT1wYXJzZUludChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxyXG4gICAgICAgICAgICBpZihjdXJyVGltZSs2MCA8IHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmV4cGlyZSkgcmV0dXJuIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmFjY2Vzc1Rva2VuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0b2tlblJlcXVlc3Q9e1xyXG4gICAgICAgICAgICBzY29wZXM6IFtiMmNTY29wZV0sXHJcbiAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2UsIC8vIFNldCB0aGlzIHRvIFwidHJ1ZVwiIHRvIHNraXAgYSBjYWNoZWQgdG9rZW4gYW5kIGdvIHRvIHRoZSBzZXJ2ZXIgdG8gZ2V0IGEgbmV3IHRva2VuXHJcbiAgICAgICAgICAgIGFjY291bnQ6IHRoaXMubXlNU0FMT2JqLmdldEFjY291bnRCeUhvbWVJZCh0aGlzLmFjY291bnRJZClcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIGlmICghcmVzcG9uc2UuYWNjZXNzVG9rZW4gfHwgcmVzcG9uc2UuYWNjZXNzVG9rZW4gPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV09e1wiYWNjZXNzVG9rZW5cIjpyZXNwb25zZS5hY2Nlc3NUb2tlbixcImV4cGlyZVwiOnJlc3BvbnNlLmlkVG9rZW5DbGFpbXMuZXhwfVxyXG4gICAgfWNhdGNoKGVycm9yKXtcclxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3IpIHtcclxuICAgICAgICAgICAgLy8gZmFsbGJhY2sgdG8gaW50ZXJhY3Rpb24gd2hlbiBzaWxlbnQgY2FsbCBmYWlsc1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2U9YXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuUG9wdXAodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzcG9uc2UuYWNjZXNzVG9rZW47XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1zYWxIZWxwZXIoKTsiLCJjb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0UHJvamVjdERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKHByb2plY3RJbmZvKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMucHJvamVjdEluZm89cHJvamVjdEluZm9cclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjQyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+UHJvamVjdCBTZXR0aW5nPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIHJvdzE9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHJvdzEpXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O1wiPk5hbWUgPC9kaXY+JylcclxuICAgIHJvdzEuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6NzAlOyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIlByb2plY3QgTmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHJvdzEuYXBwZW5kKG5hbWVJbnB1dClcclxuICAgIG5hbWVJbnB1dC52YWwocHJvamVjdEluZm8ubmFtZSlcclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLGFzeW5jICgpPT57XHJcbiAgICAgICAgdmFyIG5hbWVTdHI9bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgaWYobmFtZVN0cj09XCJcIikge1xyXG4gICAgICAgICAgICBhbGVydChcIk5hbWUgY2FuIG5vdCBiZSBlbXB0eSFcIilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgcmVxdWVzdEJvZHk9e1wicHJvamVjdElEXCI6cHJvamVjdEluZm8uaWQsXCJhY2NvdW50c1wiOltdLFwibmV3UHJvamVjdE5hbWVcIjpuYW1lU3RyfVxyXG4gICAgICAgIHJlcXVlc3RCb2R5LmFjY291bnRzPXJlcXVlc3RCb2R5LmFjY291bnRzLmNvbmNhdChwcm9qZWN0SW5mby5zaGFyZVdpdGgpXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvY2hhbmdlT3duUHJvamVjdE5hbWVcIiwgXCJQT1NUXCIsIHJlcXVlc3RCb2R5KVxyXG4gICAgICAgICAgICBuYW1lSW5wdXQuYmx1cigpXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O1wiPlNoYXJlIFdpdGggPC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIHNoYXJlQWNjb3VudElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lOyB3aWR0aDo2MCU7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiSW52aXRlZSBFbWFpbC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHJvdzIuYXBwZW5kKHNoYXJlQWNjb3VudElucHV0KVxyXG4gICAgdmFyIGludml0ZUJ0bj0kKCc8YSBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXIgdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgaHJlZj1cIiNcIj5JbnZpdGU8L2E+JykgXHJcbiAgICByb3cyLmFwcGVuZChpbnZpdGVCdG4pIFxyXG5cclxuICAgIHZhciBzaGFyZUFjY291bnRzTGlzdD0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyIHczLXBhZGRpbmcnIHN0eWxlPSdtYXJnaW46MXB4IDFweDsgaGVpZ2h0OjIwMHB4O292ZXJmbG93LXg6aGlkZGVuO292ZXJmbG93LXk6YXV0byc+PGRpdj5cIilcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzaGFyZUFjY291bnRzTGlzdClcclxuICAgIHRoaXMuc2hhcmVBY2NvdW50c0xpc3Q9c2hhcmVBY2NvdW50c0xpc3Q7XHJcbiAgICB0aGlzLmRyYXdTaGFyZWRBY2NvdW50cygpXHJcblxyXG4gICAgc2hhcmVBY2NvdW50SW5wdXQub24oXCJrZXlkb3duXCIsKGV2ZW50KSA9PntcclxuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAxMykgdGhpcy5zaGFyZVdpdGhBY2NvdW50KHNoYXJlQWNjb3VudElucHV0KVxyXG4gICAgfSk7XHJcbiAgICBpbnZpdGVCdG4ub24oXCJjbGlja1wiLCgpPT57IHRoaXMuc2hhcmVXaXRoQWNjb3VudChzaGFyZUFjY291bnRJbnB1dCl9KVxyXG59XHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUuc2hhcmVXaXRoQWNjb3VudD1hc3luYyBmdW5jdGlvbihhY2NvdW50SW5wdXQpe1xyXG4gICAgdmFyIHNoYXJlVG9BY2NvdW50PWFjY291bnRJbnB1dC52YWwoKVxyXG4gICAgaWYoc2hhcmVUb0FjY291bnQ9PVwiXCIpIHJldHVybjtcclxuICAgIHZhciB0aGVJbmRleD0gdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguaW5kZXhPZihzaGFyZVRvQWNjb3VudClcclxuICAgIGlmKHRoZUluZGV4IT0tMSkgcmV0dXJuO1xyXG4gICAgdmFyIHJlcXVlc3RCb2R5PXtcInByb2plY3RJRFwiOnRoaXMucHJvamVjdEluZm8uaWQsXCJzaGFyZVRvQWNjb3VudFwiOnNoYXJlVG9BY2NvdW50fVxyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9zaGFyZVByb2plY3RUb1wiLCBcIlBPU1RcIiwgcmVxdWVzdEJvZHkpXHJcbiAgICAgICAgdGhpcy5hZGRBY2NvdW50VG9TaGFyZVdpdGgoc2hhcmVUb0FjY291bnQpXHJcbiAgICAgICAgdGhpcy5kcmF3U2hhcmVkQWNjb3VudHMoKVxyXG4gICAgICAgIGFjY291bnRJbnB1dC52YWwoXCJcIilcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRQcm9qZWN0RGlhbG9nLnByb3RvdHlwZS5hZGRBY2NvdW50VG9TaGFyZVdpdGg9ZnVuY3Rpb24oc2hhcmVUb0FjY291bnRJRCl7XHJcbiAgICB2YXIgdGhlSW5kZXg9IHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLmluZGV4T2Yoc2hhcmVUb0FjY291bnRJRClcclxuICAgIGlmKHRoZUluZGV4PT0tMSkgdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGgucHVzaChzaGFyZVRvQWNjb3VudElEKVxyXG59XHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUuZHJhd1NoYXJlZEFjY291bnRzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNoYXJlQWNjb3VudHNMaXN0LmVtcHR5KClcclxuICAgIHZhciBzaGFyZWRBY2NvdW50PXRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoXHJcbiAgICBzaGFyZWRBY2NvdW50LmZvckVhY2gob25lRW1haWwgPT4ge1xyXG4gICAgICAgIHZhciBhcm93ID0gJCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuc2hhcmVBY2NvdW50c0xpc3QuYXBwZW5kKGFyb3cpXHJcbiAgICAgICAgdmFyIGxhYmxlID0gJCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O1wiPicrb25lRW1haWwrJyA8L2Rpdj4nKVxyXG4gICAgICAgIGFyb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgICAgIHZhciByZW1vdmVCdG49JCgnPGEgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6MTBweHl5XCIgaHJlZj1cIiNcIj5SZW1vdmU8L2E+JylcclxuICAgICAgICBhcm93LmFwcGVuZChyZW1vdmVCdG4pXHJcbiAgICAgICAgcmVtb3ZlQnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgICAgICB2YXIgcmVxdWVzdEJvZHk9e1wicHJvamVjdElEXCI6dGhpcy5wcm9qZWN0SW5mby5pZCxcIm5vdFNoYXJlVG9BY2NvdW50XCI6b25lRW1haWx9XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9ub3RTaGFyZVByb2plY3RUb1wiLCBcIlBPU1RcIiwgcmVxdWVzdEJvZHkpXHJcbiAgICAgICAgICAgICAgICB2YXIgdGhlSW5kZXggPSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5pbmRleE9mKG9uZUVtYWlsKVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoZUluZGV4ICE9IC0xKSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5zcGxpY2UodGhlSW5kZXgsIDEpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTaGFyZWRBY2NvdW50cygpXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJDb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTGF5b3V0XCIsIFwiUE9TVFwiLCB7IFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZWRpdFByb2plY3REaWFsb2coKTsiLCJmdW5jdGlvbiBnbG9iYWxDYWNoZSgpe1xyXG4gICAgdGhpcy5hY2NvdW50SW5mbz1udWxsO1xyXG4gICAgdGhpcy5qb2luZWRQcm9qZWN0c1Rva2VuPW51bGw7XHJcbiAgICB0aGlzLnNob3dGbG9hdEluZm9QYW5lbD10cnVlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyID0gW11cclxuICAgIHRoaXMuREJUd2luc0FyciA9IFtdXHJcbiAgICB0aGlzLm1vZGVsSURNYXBUb05hbWU9e31cclxuICAgIHRoaXMubW9kZWxOYW1lTWFwVG9JRD17fVxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lPXt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zID0ge31cclxuICAgIHRoaXMubGF5b3V0SlNPTj17fVxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uPXtcImRlZmF1bHRcIjp7fX1cclxuXHJcbiAgICB0aGlzLmluaXRTdG9yZWRJbmZvcm10aW9uKClcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5pbml0U3RvcmVkSW5mb3JtdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge30gXHJcbiAgICAvL3N0b3JlZCBkYXRhLCBzZXBlcmF0ZWx5IGZyb20gQURUIHNlcnZpY2UgYW5kIGZyb20gY29zbW9zREIgc2VydmljZVxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsICAgXHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVBRFRUd2lucz1mdW5jdGlvbih0d2luc0RhdGEpe1xyXG4gICAgdHdpbnNEYXRhLmZvckVhY2goKG9uZU5vZGUpPT57dGhpcy5zdG9yZVNpbmdsZUFEVFR3aW4ob25lTm9kZSl9KTtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlQURUVHdpbj1mdW5jdGlvbihvbmVOb2RlKXtcclxuICAgIHRoaXMuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGVcclxuICAgIG9uZU5vZGVbXCJkaXNwbGF5TmFtZVwiXT0gdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZU5vZGVbXCIkZHRJZFwiXV1cclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCVHdpbj1mdW5jdGlvbihEQlR3aW4pe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZURCVHdpbj10aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihvbmVEQlR3aW5bXCJpZFwiXT09REJUd2luW1wiaWRcIl0pe1xyXG4gICAgICAgICAgICB0aGlzLkRCVHdpbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLnB1c2goREJUd2luKVxyXG5cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtEQlR3aW5bXCJpZFwiXV09REJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJUd2luc0Fycj1mdW5jdGlvbihEQlR3aW5zQXJyKXtcclxuICAgIHRoaXMuREJUd2luc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQlR3aW5zQXJyPXRoaXMuREJUd2luc0Fyci5jb25jYXQoREJUd2luc0FycilcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZSkgZGVsZXRlIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtpbmRdXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lREJUd2luW1wiaWRcIl1dPW9uZURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubWVyZ2VEQlR3aW5zQXJyPWZ1bmN0aW9uKERCVHdpbnNBcnIpe1xyXG4gICAgdmFyIGlkTGlzdD17fVxyXG4gICAgdmFyIGFycj1bXS5jb25jYXQoREJUd2luc0FycilcclxuICAgIGFyci5mb3JFYWNoKGFEQlR3aW49PntcclxuICAgICAgICBpZExpc3RbYURCVHdpbi5pZF09MVxyXG4gICAgfSlcclxuICAgIHRoaXMuREJUd2luc0Fyci5mb3JFYWNoKGFEQlR3aW49PntcclxuICAgICAgICBpZihpZExpc3RbYURCVHdpbi5pZF0pIHJldHVybjtcclxuICAgICAgICBhcnIucHVzaChhREJUd2luKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLnN0b3JlREJUd2luc0FycihhcnIpXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVVzZXJEYXRhPWZ1bmN0aW9uKHJlcyl7XHJcbiAgICByZXMuZm9yRWFjaChvbmVSZXNwb25zZT0+e1xyXG4gICAgICAgIGlmKG9uZVJlc3BvbnNlLnR5cGU9PVwiam9pbmVkUHJvamVjdHNUb2tlblwiKSB0aGlzLmpvaW5lZFByb2plY3RzVG9rZW49b25lUmVzcG9uc2Uuand0O1xyXG4gICAgICAgIGVsc2UgaWYob25lUmVzcG9uc2UudHlwZT09XCJ1c2VyXCIpIHRoaXMuYWNjb3VudEluZm89b25lUmVzcG9uc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RNb2RlbHNEYXRhPWZ1bmN0aW9uKERCTW9kZWxzLGFkdE1vZGVscyl7XHJcbiAgICB0aGlzLnN0b3JlREJNb2RlbHNBcnIoREJNb2RlbHMpXHJcblxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxOYW1lTWFwVG9JRCkgZGVsZXRlIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtpbmRdXHJcblxyXG4gICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkdE1vZGVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9PSBudWxsKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcIkBpZFwiXVxyXG4gICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0pKSB7XHJcbiAgICAgICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgZWxzZSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IEpTT04uc3RyaW5naWZ5KGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodG1wTmFtZVRvT2JqW2FkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRtcE5hbWVUb09ialthZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSAxXHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVthZHRNb2RlbHNbaV1bXCJAaWRcIl1dID0gYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSURbYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICB9XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RUd2luc0FuZFZpc3VhbERhdGE9ZnVuY3Rpb24ocmVzQXJyKXtcclxuICAgIHZhciBkYnR3aW5zPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnZpc3VhbERlZmluaXRpb24pIGRlbGV0ZSB0aGlzLnZpc3VhbERlZmluaXRpb25baW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5sYXlvdXRKU09OKSBkZWxldGUgdGhpcy5sYXlvdXRKU09OW2luZF1cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl09e31cclxuXHJcbiAgICByZXNBcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50LnR5cGU9PVwidmlzdWFsU2NoZW1hXCIpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBub3cgdGhlcmUgaXMgb25seSBvbmUgXCJkZWZhdWx0XCIgc2NoZW1hIHRvIHVzZSxjb25zaWRlciBhbGxvdyBjcmVhdGluZyBtb3JlIHVzZXIgZGVmaW5lIHZpc3VhbCBzY2hlbWFcclxuICAgICAgICAgICAgdGhpcy52aXN1YWxEZWZpbml0aW9uW2VsZW1lbnQubmFtZV09ZWxlbWVudC5kZXRhaWxcclxuICAgICAgICB9ZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiVG9wb2xvZ3lcIikgdGhpcy5sYXlvdXRKU09OW2VsZW1lbnQubmFtZV09ZWxlbWVudC5kZXRhaWxcclxuICAgICAgICBlbHNlIGlmKGVsZW1lbnQudHlwZT09XCJEVFR3aW5cIikgZGJ0d2lucy5wdXNoKGVsZW1lbnQpXHJcbiAgICB9KTtcclxuICAgIHRoaXMuc3RvcmVEQlR3aW5zQXJyKGRidHdpbnMpXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5nZXREQlR3aW5zQnlNb2RlbElEPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIHJlc3VsdEFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJUd2luc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5tb2RlbElEPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgcmVzdWx0QXJyLnB1c2goZWxlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRBcnI7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5nZXRTaW5nbGVEQlR3aW5CeUlEPWZ1bmN0aW9uKHR3aW5JRCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLmlkPT10d2luSUQpe1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5nZXRTaW5nbGVEQlR3aW5CeUluZG9vckZlYXR1cmVJRD1mdW5jdGlvbihmZWF0dXJlSUQpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJUd2luc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5HSVMgJiYgZWxlLkdJUy5pbmRvb3Ipe1xyXG4gICAgICAgICAgICBpZihlbGUuR0lTLmluZG9vci5JbmRvb3JGZWF0dXJlSUQ9PWZlYXR1cmVJRCkgcmV0dXJuIGVsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQ9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJNb2RlbHNBcnJbaV1cclxuICAgICAgICBpZihlbGUuaWQ9PW1vZGVsSUQpe1xyXG4gICAgICAgICAgICByZXR1cm4gZWxlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCTW9kZWw9ZnVuY3Rpb24oc2luZ2xlREJNb2RlbEluZm8pe1xyXG4gICAgdmFyIG1vZGVsSUQgPSBzaW5nbGVEQk1vZGVsSW5mby5pZFxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCTW9kZWxzQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLmlkPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZWxlKSBkZWxldGUgZWxlW2luZF1cclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlREJNb2RlbEluZm8pIGVsZVtpbmRdPXNpbmdsZURCTW9kZWxJbmZvW2luZF1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vaXQgaXMgYSBuZXcgc2luZ2xlIG1vZGVsIGlmIGNvZGUgcmVhY2hlcyBoZXJlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLnB1c2goc2luZ2xlREJNb2RlbEluZm8pXHJcbiAgICB0aGlzLnNvcnREQk1vZGVsc0FycigpXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCTW9kZWxzQXJyPWZ1bmN0aW9uKERCTW9kZWxzQXJyKXtcclxuICAgIHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJNb2RlbHNBcnI9dGhpcy5EQk1vZGVsc0Fyci5jb25jYXQoREJNb2RlbHNBcnIpXHJcbiAgICB0aGlzLnNvcnREQk1vZGVsc0FycigpXHJcbiAgICBcclxufVxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc29ydERCTW9kZWxzQXJyPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICByZXR1cm4gYU5hbWUubG9jYWxlQ29tcGFyZShiTmFtZSkgXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbi8vVGhpcyBpcyBhIHNpbmdsZXRvbiBjbGFzc1xyXG5cclxuZnVuY3Rpb24gbW9kZWxBbmFseXplcigpe1xyXG4gICAgdGhpcy5EVERMTW9kZWxzPXt9XHJcbiAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzPXt9XHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmNsZWFyQWxsTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiY2xlYXIgYWxsIG1vZGVsIGluZm9cIilcclxuICAgIGZvcih2YXIgaWQgaW4gdGhpcy5EVERMTW9kZWxzKSBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2lkXVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZXNldEFsbE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGpzb25TdHI9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl1cclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09SlNPTi5wYXJzZShqc29uU3RyKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdPWpzb25TdHJcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFkZE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB2YXIgbW9kZWxJRD0gZWxlW1wiQGlkXCJdXHJcbiAgICAgICAgZWxlW1wib3JpZ2luYWxcIl09SlNPTi5zdHJpbmdpZnkoZWxlKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1lbGVcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZWNvcmRBbGxCYXNlQ2xhc3Nlcz0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICBwYXJlbnRPYmpbYmFzZUNsYXNzSURdPTFcclxuXHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykgcGFyZW50T2JqW2luZF0gPSBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzW2luZF1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudE9ialtpbmRdPT1udWxsKSBwYXJlbnRPYmpbaW5kXSA9IHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaW5kXVtiYXNlQ2xhc3NJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihwYXJlbnRPYmosZGF0YUluZm8sZW1iZWRkZWRTY2hlbWEpe1xyXG4gICAgZGF0YUluZm8uZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHJldHVybjtcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUHJvcGVydHlcIlxyXG4gICAgICAgIHx8KEFycmF5LmlzQXJyYXkob25lQ29udGVudFtcIkB0eXBlXCJdKSAmJiBvbmVDb250ZW50W1wiQHR5cGVcIl0uaW5jbHVkZXMoXCJQcm9wZXJ0eVwiKSlcclxuICAgICAgICB8fCBvbmVDb250ZW50W1wiQHR5cGVcIl09PW51bGwpIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnICYmIGVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dIT1udWxsKSBvbmVDb250ZW50W1wic2NoZW1hXCJdPWVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dXHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGFyZW50PXt9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW5ld1BhcmVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMobmV3UGFyZW50LG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hbmFseXplPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiYW5hbHl6ZSBtb2RlbCBpbmZvXCIpXHJcbiAgICAvL2FuYWx5emUgYWxsIHJlbGF0aW9uc2hpcCB0eXBlc1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5yZWxhdGlvbnNoaXBUeXBlcykgZGVsZXRlIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaWRdXHJcbiAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscykge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWEgPSB7fVxyXG4gICAgICAgIGlmIChlbGUuc2NoZW1hcykge1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyID0gZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyID0gW2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXSA9IGVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRBcnIgPSBlbGUuY29udGVudHNcclxuICAgICAgICBpZiAoIWNvbnRlbnRBcnIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnRlbnRBcnIuZm9yRWFjaCgob25lQ29udGVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAob25lQ29udGVudFtcIkB0eXBlXCJdID09IFwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXSkgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV09IHt9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXSA9IG9uZUNvbnRlbnRcclxuICAgICAgICAgICAgICAgIG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzID0ge31cclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgb25lQ29udGVudC5wcm9wZXJ0aWVzLCBlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbmFseXplIGVhY2ggbW9kZWwncyBwcm9wZXJ0eSB0aGF0IGNhbiBiZSBlZGl0ZWRcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpeyAvL2V4cGFuZCBwb3NzaWJsZSBlbWJlZGRlZCBzY2hlbWEgdG8gZWRpdGFibGVQcm9wZXJ0aWVzLCBhbHNvIGV4dHJhY3QgcG9zc2libGUgcmVsYXRpb25zaGlwIHR5cGVzIGZvciB0aGlzIG1vZGVsXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWE9e31cclxuICAgICAgICBpZihlbGUuc2NoZW1hcyl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFycj1lbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnI9W2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV09ZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXM9e31cclxuICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cz1bXVxyXG4gICAgICAgIGVsZS5hbGxCYXNlQ2xhc3Nlcz17fVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWxlLmNvbnRlbnRzLGVtYmVkZGVkU2NoZW1hKVxyXG5cclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT10aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2gob25lQ29udGVudD0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIkNvbXBvbmVudFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50TmFtZT1vbmVDb250ZW50W1wibmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRDbGFzcz1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdLGNvbXBvbmVudENsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHMucHVzaChjb21wb25lbnROYW1lKVxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgYmFzZSBjbGFzcyBwcm9wZXJ0aWVzIHRvIGVkaXRhYmxlUHJvcGVydGllcyBhbmQgdmFsaWQgcmVsYXRpb25zaGlwIHR5cGVzIHRvIHZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGJhc2VDbGFzc0lEcz1lbGUuZXh0ZW5kcztcclxuICAgICAgICBpZihiYXNlQ2xhc3NJRHM9PW51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1iYXNlQ2xhc3NJRHNcclxuICAgICAgICBlbHNlIHRtcEFycj1bYmFzZUNsYXNzSURzXVxyXG4gICAgICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhlbGUuYWxsQmFzZUNsYXNzZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKGVsZS52YWxpZFJlbGF0aW9uc2hpcHMsZWFjaEJhc2UpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuRFRETE1vZGVscylcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5yZWxhdGlvbnNoaXBUeXBlcylcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGNoaWxkTW9kZWxJRHM9W11cclxuICAgIGZvcih2YXIgYUlEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGFNb2RlbD10aGlzLkRURExNb2RlbHNbYUlEXVxyXG4gICAgICAgIGlmKGFNb2RlbC5hbGxCYXNlQ2xhc3NlcyAmJiBhTW9kZWwuYWxsQmFzZUNsYXNzZXNbbW9kZWxJRF0pIGNoaWxkTW9kZWxJRHMucHVzaChhTW9kZWxbXCJAaWRcIl0pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2hpbGRNb2RlbElEc1xyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5kZWxldGVNb2RlbD1hc3luYyBmdW5jdGlvbihtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGZ1bmNBZnRlckZhaWwsY29tcGxldGVGdW5jKXtcclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9dGhpcy5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgIHZhciBtb2RlbExldmVsPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciBjaGVja01vZGVsPXRoaXMuRFRETE1vZGVsc1tvbmVJRF1cclxuICAgICAgICBtb2RlbExldmVsLnB1c2goe1wibW9kZWxJRFwiOm9uZUlELFwibGV2ZWxcIjpPYmplY3Qua2V5cyhjaGVja01vZGVsLmFsbEJhc2VDbGFzc2VzKS5sZW5ndGh9KVxyXG4gICAgfSlcclxuICAgIG1vZGVsTGV2ZWwucHVzaCh7XCJtb2RlbElEXCI6bW9kZWxJRCxcImxldmVsXCI6MH0pXHJcbiAgICBtb2RlbExldmVsLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYltcImxldmVsXCJdLWFbXCJsZXZlbFwiXSB9KTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBpPTA7aTxtb2RlbExldmVsLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhTW9kZWxJRD1tb2RlbExldmVsW2ldLm1vZGVsSURcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZU1vZGVsXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxcIjogYU1vZGVsSUQgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1thTW9kZWxJRF1cclxuICAgICAgICAgICAgaWYoZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUpIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlKGFNb2RlbElEKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgdmFyIGRlbGV0ZWRNb2RlbHM9W11cclxuICAgICAgICAgICAgdmFyIGFsZXJ0U3RyPVwiRGVsZXRlIG1vZGVsIGlzIGluY29tcGxldGUuIERlbGV0ZWQgTW9kZWw6XCJcclxuICAgICAgICAgICAgZm9yKHZhciBqPTA7ajxpO2orKyl7XHJcbiAgICAgICAgICAgICAgICBhbGVydFN0cis9IG1vZGVsTGV2ZWxbal0ubW9kZWxJRCtcIiBcIlxyXG4gICAgICAgICAgICAgICAgZGVsZXRlZE1vZGVscy5wdXNoKG1vZGVsTGV2ZWxbal0ubW9kZWxJRClcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgYWxlcnRTdHIrPVwiLiBGYWlsIHRvIGRlbGV0ZSBcIithTW9kZWxJRCtcIi4gRXJyb3IgaXMgXCIrZVxyXG4gICAgICAgICAgICBpZihmdW5jQWZ0ZXJGYWlsKSBmdW5jQWZ0ZXJGYWlsKGRlbGV0ZWRNb2RlbHMpXHJcbiAgICAgICAgICAgIGFsZXJ0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoY29tcGxldGVGdW5jKSBjb21wbGV0ZUZ1bmMoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEFuYWx5emVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nPXJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5pbXBvcnRCdXR0b249aW1wb3J0QnV0dG9uXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0TW9kZWxBcnIoW3RoaXMuZHRkbG9ial0pXHJcbiAgICAgICAgZWxzZSB0aGlzLnJlcGxhY2VNb2RlbCgpICAgICAgIFxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5Nb2RlbCBUZW1wbGF0ZTwvZGl2PicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG1vZGVsVGVtcGxhdGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDB9KVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChtb2RlbFRlbXBsYXRlU2VsZWN0b3IuRE9NKVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VUZW1wbGF0ZShvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24oXCJOZXcgTW9kZWwuLi5cIixcIk5ld1wiKVxyXG4gICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKG1vZGVsTmFtZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9XCI0NTBweFwiXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbjoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDozMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBkdGRsU2NyaXB0UGFuZWw9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwib3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweDt3aWR0aDozMTBweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnXCI+PC9kaXY+JylcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoZHRkbFNjcmlwdFBhbmVsKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWw9ZHRkbFNjcmlwdFBhbmVsXHJcblxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVwbGFjZU1vZGVsPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2RlbGV0ZSB0aGUgb2xkIHNhbWUgbmFtZSBtb2RlbCwgdGhlbiBjcmVhdGUgaXQgYWdhaW5cclxuICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuXHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKGN1cnJlbnRNb2RlbElEKVxyXG5cclxuICAgIHZhciBkaWFsb2dTdHIgPSAocmVsYXRlZE1vZGVsSURzLmxlbmd0aCA9PSAwKSA/IChcIlR3aW5zIHdpbGwgYmUgaW1wYWN0IHVuZGVyIG1vZGVsIFxcXCJcIiArIGN1cnJlbnRNb2RlbElEICsgXCJcXFwiXCIpIDpcclxuICAgICAgICAoY3VycmVudE1vZGVsSUQgKyBcIiBpcyBiYXNlIG1vZGVsIG9mIFwiICsgcmVsYXRlZE1vZGVsSURzLmpvaW4oXCIsIFwiKSArIFwiLiBUd2lucyB1bmRlciB0aGVzZSBtb2RlbHMgd2lsbCBiZSBpbXBhY3QuXCIpXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IGRpYWxvZ1N0clxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtUmVwbGFjZU1vZGVsKGN1cnJlbnRNb2RlbElEKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKSAgICBcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmltcG9ydE1vZGVsQXJyPWFzeW5jIGZ1bmN0aW9uKG1vZGVsVG9CZUltcG9ydGVkLGZvclJlcGxhY2luZyxhZnRlckZhaWx1cmUpe1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgaWYoZm9yUmVwbGFjaW5nKSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBtb2RpZmllZCBzdWNjZXNzZnVsbHkhXCIpXHJcbiAgICAgICAgZWxzZSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBjcmVhdGVkIVwiKVxyXG5cclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMobW9kZWxUb0JlSW1wb3J0ZWQpIC8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgdGhpcy5wb3B1cCgpIC8vcmVmcmVzaCBjb250ZW50XHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgaWYoYWZ0ZXJGYWlsdXJlKSBhZnRlckZhaWx1cmUoKVxyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfSBcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNvbmZpcm1SZXBsYWNlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIGJhY2t1cE1vZGVscy5wdXNoKEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW29uZUlEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgIH0pXHJcbiAgICBiYWNrdXBNb2RlbHMucHVzaCh0aGlzLmR0ZGxvYmopXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzU3RyPWVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShiYWNrdXBNb2RlbHMpKVxyXG5cclxuICAgIHZhciBmdW5jQWZ0ZXJGYWlsPShkZWxldGVkTW9kZWxJRHMpPT57XHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGJhY2t1cE1vZGVsc1N0cik7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHNBZnRlckZhaWxlZE9wZXJhdGlvbi5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElELGVhY2hNb2RlbE5hbWUpID0+IHt9XHJcbiAgICBcclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgLy9pbXBvcnQgYWxsIHRoZSBtb2RlbHMgYWdhaW5cclxuICAgICAgICB0aGlzLmltcG9ydE1vZGVsQXJyKGJhY2t1cE1vZGVscyxcImZvclJlcGxhY2luZ1wiLGZ1bmNBZnRlckZhaWwpXHJcbiAgICB9XHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsZnVuY0FmdGVyRmFpbCxjb21wbGV0ZUZ1bmMpXHJcbn1cclxuXHJcblxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNob29zZVRlbXBsYXRlPWZ1bmN0aW9uKHRlbXBhbHRlTmFtZSl7XHJcbiAgICBpZih0ZW1wYWx0ZU5hbWUhPVwiTmV3XCIpe1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaj1KU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0ZW1wYWx0ZU5hbWVdW1wib3JpZ2luYWxcIl0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmogPSB7XHJcbiAgICAgICAgICAgIFwiQGlkXCI6IFwiZHRtaTphTmFtZVNwYWNlOmFNb2RlbElEOzFcIixcclxuICAgICAgICAgICAgXCJAY29udGV4dFwiOiBbXCJkdG1pOmR0ZGw6Y29udGV4dDsyXCJdLFxyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiSW50ZXJmYWNlXCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheU5hbWVcIjogXCJOZXcgTW9kZWxcIixcclxuICAgICAgICAgICAgXCJjb250ZW50c1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYXR0cmlidXRlMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJsaW5rXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubGVmdFNwYW4uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMucmVmcmVzaERUREwoKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Nb2RlbCBJRCAmIE5hbWU8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+bW9kZWwgSUQgY29udGFpbnMgbmFtZXNwYWNlLCBhIG1vZGVsIHN0cmluZyBhbmQgYSB2ZXJzaW9uIG51bWJlcjwvcD48L2Rpdj48L2Rpdj4nKSlcclxuICAgIG5ldyBpZFJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbiAgICBuZXcgZGlzcGxheU5hbWVSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSl0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXT1bXVxyXG4gICAgbmV3IHBhcmFtZXRlcnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgcmVsYXRpb25zUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IGNvbXBvbmVudHNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0pdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXT1bXVxyXG4gICAgbmV3IGJhc2VDbGFzc2VzUm93KHRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoRFRETD1mdW5jdGlvbigpe1xyXG4gICAgLy9pdCB3aWxsIHJlZnJlc2ggdGhlIGdlbmVyYXRlZCBEVERMIHNhbXBsZSwgaXQgd2lsbCBhbHNvIGNoYW5nZSB0aGUgaW1wb3J0IGJ1dHRvbiB0byBzaG93IFwiQ3JlYXRlXCIgb3IgXCJNb2RpZnlcIlxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW2N1cnJlbnRNb2RlbElEXT09bnVsbCkgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIkNyZWF0ZVwiKVxyXG4gICAgZWxzZSB0aGlzLmltcG9ydEJ1dHRvbi50ZXh0KFwiTW9kaWZ5XCIpXHJcblxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuZW1wdHkoKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MjBweDt3aWR0aDoxMDBweFwiIGNsYXNzPVwidzMtYmFyIHczLWdyYXlcIj5HZW5lcmF0ZWQgRFRETDwvZGl2PicpKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxwcmUgc3R5bGU9XCJjb2xvcjpncmF5XCI+JytKU09OLnN0cmluZ2lmeSh0aGlzLmR0ZGxvYmosbnVsbCwyKSsnPC9wcmU+JykpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsRWRpdG9yRGlhbG9nKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gYmFzZUNsYXNzZXNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+QmFzZSBDbGFzc2VzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkJhc2UgY2xhc3MgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYW5kIHJlbGF0aW9uc2hpcCB0eXBlIGFyZSBpbmhlcml0ZWQ8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSBcInVua25vd25cIlxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVCYXNlY2xhc3NSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgYmFzZUNsYXNzTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjIyMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiYmFzZSBtb2RlbCBpZFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGJhc2VDbGFzc05hbWVJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC52YWwoZHRkbE9iailcclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmpbaV09YmFzZUNsYXNzTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY29tcG9uZW50c1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Db21wb25lbnRzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkNvbXBvbmVudCBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhcmUgZW1iZWRkZWQgdW5kZXIgYSBuYW1lPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwicmVsYXRpb24xXCIsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcmVsYXRpb25OYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6OTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInJlbGF0aW9uIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdGFyZ2V0TW9kZWxJRD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIihvcHRpb25hbCl0YXJnZXQgbW9kZWxcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1jb2cgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKHJlbGF0aW9uTmFtZUlucHV0LHRhcmdldE1vZGVsSUQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICB0YXJnZXRNb2RlbElELnZhbChkdGRsT2JqW1widGFyZ2V0XCJdfHxcIlwiKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdKSBkdGRsT2JqW1wicHJvcGVydGllc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cmVsYXRpb25OYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHRhcmdldE1vZGVsSUQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGlmKHRhcmdldE1vZGVsSUQudmFsKCk9PVwiXCIpIGRlbGV0ZSBkdGRsT2JqW1widGFyZ2V0XCJdXHJcbiAgICAgICAgZWxzZSBkdGRsT2JqW1widGFyZ2V0XCJdPXRhcmdldE1vZGVsSUQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdICYmIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgcHJvcGVydGllcz1kdGRsT2JqW1wicHJvcGVydGllc1wiXVxyXG4gICAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChvbmVQcm9wZXJ0eT0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZVByb3BlcnR5LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcmFtZXRlcnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlBhcmFtZXRlcnM8L2Rpdj48L2Rpdj4nKVxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUHJvcGVydHlcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVQYXJhbWV0ZXJSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosdG9wTGV2ZWwsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHBhcmFtZXRlck5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInBhcmFtZXRlciBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGVudW1WYWx1ZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwic3RyMSxzdHIyLC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcHR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXkgdzMtYmFyLWl0ZW1cIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDVweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDAsXCJpc0NsaWNrYWJsZVwiOjEsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXHJcbiAgICBcImFkanVzdFBvc2l0aW9uQW5jaG9yXCI6ZGlhbG9nT2Zmc2V0fSlcclxuICAgIHB0eXBlU2VsZWN0b3IuYWRkT3B0aW9uQXJyKFtcInN0cmluZ1wiLFwiZmxvYXRcIixcImludGVnZXJcIixcIkVudW1cIixcIk9iamVjdFwiLFwiZG91YmxlXCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZHVyYXRpb25cIixcImxvbmdcIixcInRpbWVcIl0pXHJcbiAgICBET00uYXBwZW5kKHBhcmFtZXRlck5hbWVJbnB1dCxwdHlwZVNlbGVjdG9yLkRPTSxlbnVtVmFsdWVJbnB1dCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgcHR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBwdHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBjb250ZW50RE9NLmVtcHR5KCkvL2NsZWFyIGFsbCBjb250ZW50IGRvbSBjb250ZW50XHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spe1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBkdGRsT2JqKSBkZWxldGUgZHRkbE9ialtpbmRdICAgIC8vY2xlYXIgYWxsIG9iamVjdCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmKHRvcExldmVsKSBkdGRsT2JqW1wiQHR5cGVcIl09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgaWYob3B0aW9uVGV4dD09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuc2hvdygpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiRW51bVwiLFwidmFsdWVTY2hlbWFcIjogXCJzdHJpbmdcIn1cclxuICAgICAgICB9ZWxzZSBpZihvcHRpb25UZXh0PT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uc2hvdygpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiT2JqZWN0XCJ9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdKSBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgZW51bVZhbHVlSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHZhciB2YWx1ZUFycj1lbnVtVmFsdWVJbnB1dC52YWwoKS5zcGxpdChcIixcIilcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXT1bXVxyXG4gICAgICAgIHZhbHVlQXJyLmZvckVhY2goYVZhbD0+e1xyXG4gICAgICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBhVmFsLnJlcGxhY2UoXCIgXCIsXCJcIiksIC8vcmVtb3ZlIGFsbCB0aGUgc3BhY2UgaW4gbmFtZVxyXG4gICAgICAgICAgICAgICAgXCJlbnVtVmFsdWVcIjogYVZhbFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKHR5cGVvZihkdGRsT2JqW1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JykgdmFyIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdXHJcbiAgICBlbHNlIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdW1wiQHR5cGVcIl1cclxuICAgIHB0eXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHNjaGVtYSlcclxuICAgIGlmKHNjaGVtYT09XCJFbnVtXCIpe1xyXG4gICAgICAgIHZhciBlbnVtQXJyPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgaWYoZW51bUFyciE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dFN0cj1cIlwiXHJcbiAgICAgICAgICAgIGVudW1BcnIuZm9yRWFjaChvbmVFbnVtVmFsdWU9PntpbnB1dFN0cis9b25lRW51bVZhbHVlLmVudW1WYWx1ZStcIixcIn0pXHJcbiAgICAgICAgICAgIGlucHV0U3RyPWlucHV0U3RyLnNsaWNlKDAsIC0xKS8vcmVtb3ZlIHRoZSBsYXN0IFwiLFwiXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChpbnB1dFN0cilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihzY2hlbWE9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgIHZhciBmaWVsZHM9ZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXVxyXG4gICAgICAgIGZpZWxkcy5mb3JFYWNoKG9uZUZpZWxkPT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lRmllbGQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaWRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5kdG1pOjwvZGl2PicpXHJcbiAgICB2YXIgZG9tYWluSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6ODhweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk5hbWVzcGFjZVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBtb2RlbElESW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTMycHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHZlcnNpb25JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwidmVyc2lvblwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLGRvbWFpbklucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjo8L2Rpdj4nKSxtb2RlbElESW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OzwvZGl2PicpLHZlcnNpb25JbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIHZhciBzdHI9YGR0bWk6JHtkb21haW5JbnB1dC52YWwoKX06JHttb2RlbElESW5wdXQudmFsKCl9OyR7dmVyc2lvbklucHV0LnZhbCgpfWBcclxuICAgICAgICBkdGRsT2JqW1wiQGlkXCJdPXN0clxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBkb21haW5JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgbW9kZWxJRElucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2ZXJzaW9uSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJAaWRcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpe1xyXG4gICAgICAgIHZhciBhcnIxPXN0ci5zcGxpdChcIjtcIilcclxuICAgICAgICBpZihhcnIxLmxlbmd0aCE9MikgcmV0dXJuO1xyXG4gICAgICAgIHZlcnNpb25JbnB1dC52YWwoYXJyMVsxXSlcclxuICAgICAgICB2YXIgYXJyMj1hcnIxWzBdLnNwbGl0KFwiOlwiKVxyXG4gICAgICAgIGRvbWFpbklucHV0LnZhbChhcnIyWzFdKVxyXG4gICAgICAgIGFycjIuc2hpZnQoKTsgYXJyMi5zaGlmdCgpXHJcbiAgICAgICAgbW9kZWxJRElucHV0LnZhbChhcnIyLmpvaW4oXCI6XCIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5TmFtZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPkRpc3BsYXkgTmFtZTo8L2Rpdj4nKVxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxuYW1lSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXT1uYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgbmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCkgbmFtZUlucHV0LnZhbChzdHIpXHJcbn0iLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlVHJlZT0gcmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxNYW5hZ2VyRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3M9dHJ1ZTtcclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUvTW9kaWZ5IE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBleHBvcnRNb2RlbEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5FeHBvcnQgQWxsIE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChpbXBvcnRNb2RlbHNCdG4sYWN0dWFsSW1wb3J0TW9kZWxzQnRuLCBtb2RlbEVkaXRvckJ0bixleHBvcnRNb2RlbEJ0bilcclxuICAgIGltcG9ydE1vZGVsc0J0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgbW9kZWxFZGl0b3JCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbW9kZWxFZGl0b3JEaWFsb2cucG9wdXAoKVxyXG4gICAgfSlcclxuICAgIGV4cG9ydE1vZGVsQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciBtb2RlbEFycj1bXVxyXG4gICAgICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIG1vZGVsQXJyLnB1c2goSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShtb2RlbEFycikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydE1vZGVscy5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPk1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgXHJcbiAgICB2YXIgbW9kZWxMaXN0ID0gJCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgIG1vZGVsTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjQyMHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKG1vZGVsTGlzdClcclxuICAgIHRoaXMubW9kZWxMaXN0ID0gbW9kZWxMaXN0O1xyXG4gICAgXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZzowcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBwYW5lbENhcmRPdXQ9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiaGVpZ2h0OjM1cHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZCh0aGlzLm1vZGVsQnV0dG9uQmFyKVxyXG5cclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkT3V0KVxyXG4gICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IHN0eWxlPVwid2lkdGg6NDEwcHg7aGVpZ2h0OjQxMnB4O292ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZD1wYW5lbENhcmQ7XHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcbiAgICBwYW5lbENhcmQuaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy1sZWZ0OjVweCc+Q2hvb3NlIGEgbW9kZWwgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT5cIilcclxuXHJcbiAgICB0aGlzLmxpc3RNb2RlbHMoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlc2l6ZUltZ0ZpbGUgPSBhc3luYyBmdW5jdGlvbih0aGVGaWxlLG1heF9zaXplKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgdG1wSW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcub25sb2FkID0gICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHRtcEltZy53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0bXBJbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IGhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICo9IG1heF9zaXplIC8gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCAqPSBtYXhfc2l6ZSAvIGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHRtcEltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVcmwpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCh0aGVGaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJpZ2h0U3Bhbj1hc3luYyBmdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG5cclxuICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwibWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bilcclxuXHJcblxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSAkKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5DbGVhciBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoaW1wb3J0UGljQnRuLCBhY3R1YWxJbXBvcnRQaWNCdG4sIGNsZWFyQXZhcnRhQnRuKVxyXG4gICAgaW1wb3J0UGljQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KSA9PiB7XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdmFyIHRoZUZpbGUgPSBmaWxlc1swXVxyXG5cclxuICAgICAgICBpZiAodGhlRmlsZS50eXBlID09IFwiaW1hZ2Uvc3ZnK3htbFwiKSB7XHJcbiAgICAgICAgICAgIHZhciBzdHIgPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKHRoZUZpbGUpXHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gJ2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoZUZpbGUudHlwZS5tYXRjaCgnaW1hZ2UuKicpKSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsID0gYXdhaXQgdGhpcy5yZXNpemVJbWdGaWxlKHRoZUZpbGUsIDcwKVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coeyB3aWR0aDogXCIyMDBweFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiTm90ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBpbXBvcnQgaW1hZ2UgZmlsZSAocG5nLGpwZyxzdmcgYW5kIHNvIG9uKVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBidXR0b25zOiBbeyBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJPa1wiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7IGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKSB9IH1dXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5hdHRyKFwic3JjXCIsIGRhdGFVcmwpXHJcblxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZiAoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF0gPSB7fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhID0gZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwiYXZhcnRhXCI6IGRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0pIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcucmVtb3ZlQXR0cignc3JjJyk7XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJub0F2YXJ0YVwiOiB0cnVlIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIHJlbGF0ZWRNb2RlbElEcyA9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgICAgICB2YXIgZGlhbG9nU3RyPShyZWxhdGVkTW9kZWxJRHMubGVuZ3RoPT0wKT8gKFwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiLlwiKTogXHJcbiAgICAgICAgICAgIChtb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIityZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpK1wiLlwiKVxyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgICAgICAvL2NoZWNrIGhvdyBtYW55IHR3aW5zIGFyZSB1bmRlciB0aGlzIG1vZGVsIElEXHJcbiAgICAgICAgdmFyIG51bWJlck9mVHdpbnM9MFxyXG4gICAgICAgIHZhciBjaGVja1R3aW5zTW9kZWxBcnI9W21vZGVsSURdLmNvbmNhdChyZWxhdGVkTW9kZWxJRHMpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGhlSW5kZXg9Y2hlY2tUd2luc01vZGVsQXJyLmluZGV4T2Yob25lREJUd2luW1wibW9kZWxJRFwiXSlcclxuICAgICAgICAgICAgaWYodGhlSW5kZXghPS0xKSBudW1iZXJPZlR3aW5zKytcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBkaWFsb2dTdHIrPVwiIChUaGVyZSB3aWxsIGJlIFwiKygobnVtYmVyT2ZUd2lucz4xKT8obnVtYmVyT2ZUd2lucytcIiB0d2luc1wiKToobnVtYmVyT2ZUd2lucytcIiB0d2luXCIpICkgKyBcIiBiZWluZyBpbXBhY3RlZClcIlxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtRGVsZXRlTW9kZWwobW9kZWxJRCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5jb25maXJtRGVsZXRlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElEKSA9PiB7XHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbZWFjaERlbGV0ZWRNb2RlbElEXSlcclxuICAgICAgICAvL1RPRE86IGNsZWFyIHRoZSB2aXN1YWxpemF0aW9uIHNldHRpbmcgb2YgdGhpcyBkZWxldGVkIG1vZGVsLCBidXQgaWYgaXQgaXMgcmVwbGFjZSwgc2hvdWxkIG5vdCwgc28gSSBjb21tZW50IG91dCBmaXJzdFxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsSURdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbElEXVxyXG4gICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB9Ki9cclxuICAgIH1cclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCJ9KVxyXG4gICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIH1cclxuXHJcbiAgICAvL2V2ZW4gbm90IGNvbXBsZXRlbHkgc3VjY2Vzc2Z1bCBkZWxldGluZywgaXQgd2lsbCBzdGlsbCBpbnZva2UgY29tcGxldGVGdW5jXHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsY29tcGxldGVGdW5jLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgYXZhcnRhSW1nLmF0dHIoJ3NyYycsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICB0aGlzLmF2YXJ0YUltZz1hdmFydGFJbWc7XHJcbiAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydClcclxuXHJcbiAgICBpZih0aGlzLnNob3dSZWxhdGlvblZpc3VhbGl6YXRpb25TZXR0aW5ncyl7XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gbW9kZWxKc29uLnZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0LGluZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVWaXN1YWxpemF0aW9uUm93PWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tLHJlbGF0aW5zaGlwTmFtZSl7XHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpIHZhciBuYW1lU3RyPVwi4pevXCIgLy92aXN1YWwgZm9yIG5vZGVcclxuICAgIGVsc2UgbmFtZVN0cj1cIuKfnCBcIityZWxhdGluc2hpcE5hbWVcclxuICAgIHZhciBjb250YWluZXJEaXY9JChcIjxkaXYgc3R5bGU9J3BhZGRpbmctYm90dG9tOjhweCc+PC9kaXY+XCIpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRhaW5lckRpdilcclxuICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbi1yaWdodDoxMHB4Jz5cIituYW1lU3RyK1wiPC9sYWJlbD5cIilcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICB2YXIgZGVmaW5lZENvbG9yPW51bGxcclxuICAgIHZhciBkZWZpbmVkU2hhcGU9bnVsbFxyXG4gICAgdmFyIGRlZmluZWREaW1lbnNpb25SYXRpbz1udWxsXHJcbiAgICB2YXIgZGVmaW5lZEVkZ2VXaWR0aD1udWxsXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSBkZWZpbmVkU2hhcGU9dmlzdWFsSnNvblttb2RlbElEXS5zaGFwZVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgZGVmaW5lZERpbWVuc2lvblJhdGlvPXZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW9cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHtcclxuICAgICAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3IpIGRlZmluZWRDb2xvciA9IHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3JcclxuICAgICAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGUpIGRlZmluZWRTaGFwZSA9IHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGVcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGgpIGRlZmluZWRFZGdlV2lkdGg9dmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGhcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbG9yU2VsZWN0b3I9JCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjc1cHhcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb2xvclNlbGVjdG9yKVxyXG4gICAgdmFyIGNvbG9yQXJyPVtcImRhcmtHcmF5XCIsXCJCbGFja1wiLFwiTGlnaHRHcmF5XCIsXCJSZWRcIixcIkdyZWVuXCIsXCJCbHVlXCIsXCJCaXNxdWVcIixcIkJyb3duXCIsXCJDb3JhbFwiLFwiQ3JpbXNvblwiLFwiRG9kZ2VyQmx1ZVwiLFwiR29sZFwiXVxyXG4gICAgY29sb3JBcnIuZm9yRWFjaCgob25lQ29sb3JDb2RlKT0+e1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKFwiPG9wdGlvbiB2YWx1ZT0nXCIrb25lQ29sb3JDb2RlK1wiJz5cIitvbmVDb2xvckNvZGUrXCLilqc8L29wdGlvbj5cIilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmFwcGVuZChhbk9wdGlvbilcclxuICAgICAgICBhbk9wdGlvbi5jc3MoXCJjb2xvclwiLG9uZUNvbG9yQ29kZSlcclxuICAgIH0pXHJcbiAgICBpZihkZWZpbmVkQ29sb3IhPW51bGwpIHtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLnZhbChkZWZpbmVkQ29sb3IpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLGRlZmluZWRDb2xvcilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixcImRhcmtHcmF5XCIpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzaXplQWRqdXN0U2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6MTEwcHhcIj48L3NlbGVjdD4nKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGY9MC4yO2Y8MjtmKz0wLjIpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbz1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiZGltZW5zaW9uUmF0aW9cIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aD1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImVkZ2VXaWR0aFwiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIsIFwiUE9TVFwiLCB7XCJ2aXN1YWxEZWZpbml0aW9uSnNvblwiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdKX0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgbGFiZWwudGV4dChcIlJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwpXHJcbiAgICAgICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KXtcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweDttYXJnaW4tbGVmdDoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldClcclxuICAgICAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXModmFsaWRSZWxhdGlvbnNoaXBzW2luZF0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24oanNvbkluZm8scGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KG9iaikpIGZpbGVDb250ZW50QXJyPWZpbGVDb250ZW50QXJyLmNvbmNhdChvYmopXHJcbiAgICAgICAgICAgIGVsc2UgZmlsZUNvbnRlbnRBcnIucHVzaChvYmopXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihmaWxlQ29udGVudEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7XCJtb2RlbHNcIjpKU09OLnN0cmluZ2lmeShmaWxlQ29udGVudEFycil9LFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfSAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWFzeW5jIGZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlcz1hd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFByb2plY3RNb2RlbHNEYXRhXCIsXCJQT1NUXCIsbnVsbCxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVByb2plY3RNb2RlbHNEYXRhKHJlcy5EQk1vZGVscyxyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmKGpRdWVyeS5pc0VtcHR5T2JqZWN0KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykpe1xyXG4gICAgICAgIHZhciB6ZXJvTW9kZWxJdGVtPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZTowLjllbVwiPnplcm8gbW9kZWwgcmVjb3JkLiBQbGVhc2UgaW1wb3J0Li4uPC9saT4nKVxyXG4gICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgIHplcm9Nb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgc2ltcGxlVHJlZSh0aGlzLm1vZGVsTGlzdCwge1xyXG4gICAgICAgICAgICBcImxlYWZOYW1lUHJvcGVydHlcIjogXCJkaXNwbGF5TmFtZVwiXHJcbiAgICAgICAgICAgICwgXCJub011bHRpcGxlU2VsZWN0QWxsb3dlZFwiOiB0cnVlLCBcImhpZGVFbXB0eUdyb3VwXCI6IHRydWVcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jID0gKGxuKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbENsYXNzID0gbG4ubGVhZkluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICAgICAgdmFyIGNvbG9yQ29kZSA9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgc2hhcGUgPSB2aXN1YWxKc29uLnNoYXBlIHx8IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gdmlzdWFsSnNvbi5hdmFydGFcclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pIGRpbWVuc2lvbio9cGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgICAgICBpZihkYk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICAgICAgICAgIHZhciBpb3REaXY9JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlcicgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO3JpZ2h0Oi01cHg7cGFkZGluZzowcHggMnB4O3RvcDotOXB4O2JvcmRlci1yYWRpdXM6IDNweDtmb250LXNpemU6N3B4Jz5Jb1Q8L2Rpdj5cIilcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGlvdERpdilcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzID0gKG5vZGVzQXJyLCBtb3VzZUNsaWNrRGV0YWlsKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0aGVOb2RlID0gbm9kZXNBcnJbMF1cclxuICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJAaWRcIl0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdCA9IHt9XHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIGdyb3VwTmFtZUxpc3RbdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKV0gPSAxXHJcbiAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyID0gT2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICBtb2RlbGdyb3VwU29ydEFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lID0+IHtcclxuICAgICAgICAgICAgdmFyIGduPXRoaXMudHJlZS5hZGRHcm91cE5vZGUoeyBkaXNwbGF5TmFtZTogb25lR3JvdXBOYW1lIH0pXHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIHtcclxuICAgICAgICAgICAgdmFyIGduID0gdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGduLCBKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5zb3J0QWxsTGVhdmVzKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoc2hvdWxkQnJvYWRjYXN0KSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBtb2R1bGVTd2l0Y2hEaWFsb2coKXtcclxuICAgIHRoaXMubW9kdWxlc1NpZGViYXI9JCgnPGRpdiBjbGFzcz1cInczLXNpZGViYXIgdzMtYmFyLWJsb2NrIHczLXdoaXRlIHczLWFuaW1hdGUtbGVmdCB3My1jYXJkLTRcIiBzdHlsZT1cImRpc3BsYXk6bm9uZTtoZWlnaHQ6MTk1cHg7d2lkdGg6MjQwcHg7b3ZlcmZsb3c6aGlkZGVuXCI+PGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1sZWZ0IHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweDt3aWR0aDo1NXB4XCI+4piwPC9idXR0b24+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW07d2lkdGg6NzBweDtmbG9hdDpsZWZ0O2N1cnNvcjpkZWZhdWx0XCI+T3BlbjwvZGl2PjwvZGl2PjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtbWVkaXVtXCI+PGltZyBzcmM9XCJmYXZpY29uaW90aHViLmljb1wiIHN0eWxlPVwid2lkdGg6MjVweDttYXJnaW4tcmlnaHQ6MTBweFwiPjwvaW1nPkRldmljZSBNYW5hZ2VtZW50PC9hPjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtbWVkaXVtXCI+PGltZyBzcmM9XCJmYXZpY29uZGlnaXRhbHR3aW4uaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGlnaXRhbCBUd2luPC9hPjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtbWVkaXVtXCI+PGltZyBzcmM9XCJmYXZpY29uZXZlbnRsb2cuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RXZlbnQgTG9nPC9hPjxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtbWVkaXVtXCI+TG9nIG91dDwvYT48L2Rpdj4nKVxyXG4gICAgXHJcbiAgICB0aGlzLm1vZHVsZXNTd2l0Y2hCdXR0b249JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPuKYsDwvYT4nKVxyXG4gICAgXHJcbiAgICB0aGlzLm1vZHVsZXNTd2l0Y2hCdXR0b24ub24oXCJjbGlja1wiLCgpPT57IHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIikgfSlcclxuICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY2hpbGRyZW4oJzpmaXJzdCcpLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKX0pXHJcbiAgICBcclxuICAgIHZhciBhbGxNb2RldWxzPXRoaXMubW9kdWxlc1NpZGViYXIuY2hpbGRyZW4oXCJhXCIpXHJcbiAgICAkKGFsbE1vZGV1bHNbMF0pLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGV2aWNlbWFuYWdlbWVudC5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzFdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRpZ2l0YWx0d2lubW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbiAgICAkKGFsbE1vZGV1bHNbMl0pLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZXZlbnRsb2dtb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1szXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgY29uc3QgbG9nb3V0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgcG9zdExvZ291dFJlZGlyZWN0VXJpOiBnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaSxcclxuICAgICAgICAgICAgbWFpbldpbmRvd1JlZGlyZWN0VXJpOiBnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgdmFyIG15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG4gICAgICAgIG15TVNBTE9iai5sb2dvdXRQb3B1cChsb2dvdXRSZXF1ZXN0KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZHVsZVN3aXRjaERpYWxvZygpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG5ld1R3aW5EaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbih0d2luSW5mbykge1xyXG4gICAgdGhpcy5vcmlnaW5hbFR3aW5JbmZvPUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkodHdpbkluZm8pKVxyXG4gICAgdGhpcy50d2luSW5mbz10d2luSW5mb1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NTIwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QWRkPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHsgdGhpcy5hZGROZXdUd2luKCkgfSlcclxuICAgIFxyXG4gICAgdmFyIGFkZEFuZENsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTttYXJnaW4tbGVmdDo1cHhcIj5BZGQgJiBDbG9zZTwvYnV0dG9uPicpICAgIFxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoYWRkQW5kQ2xvc2VCdXR0b24pXHJcbiAgICBhZGRBbmRDbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHt0aGlzLmFkZE5ld1R3aW4oXCJDbG9zZURpYWxvZ1wiKX0pXHJcbiAgICAgICAgXHJcbiAgICB2YXIgSURMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Ud2luIElEPC9kaXY+XCIpXHJcbiAgICB2YXIgSURJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm1hcmdpbjo4cHggMDtwYWRkaW5nOjJweDt3aWR0aDoxNTBweDtvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmVcIiBwbGFjZWhvbGRlcj1cIklEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdGhpcy5JRElucHV0PUlESW5wdXQgXHJcbiAgICB2YXIgbW9kZWxJRD10d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXVxyXG4gICAgdmFyIG1vZGVsTGFibGVEaXY9ICQoXCI8ZGl2IGNsYXNzPSd3My1wYWRkaW5nJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpibGFjayc+TW9kZWw8L2Rpdj5cIilcclxuICAgIHZhciBtb2RlbElucHV0PSQoJzxkaXYgdHlwZT1cInRleHRcIiBzdHlsZT1cIm1hcmdpbjo4cHggMDtwYWRkaW5nOjJweDtkaXNwbGF5OmlubGluZVwiLz4nKS50ZXh0KG1vZGVsSUQpOyAgXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoXCI8ZGl2Lz5cIikuYXBwZW5kKElETGFibGVEaXYsSURJbnB1dCkpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nOjhweCAwcHgnLz5cIikuYXBwZW5kKG1vZGVsTGFibGVEaXYsbW9kZWxJbnB1dCkpXHJcbiAgICBJRElucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICB0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl09JChlLnRhcmdldCkudmFsKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGRpYWxvZ0RPTT0kKCc8ZGl2IC8+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoZGlhbG9nRE9NKSAgICBcclxuICAgIHZhciB0aXRsZVRhYmxlPSQoJzx0YWJsZSBzdHlsZT1cIndpZHRoOjEwMCVcIiBjZWxsc3BhY2luZz1cIjBweFwiIGNlbGxwYWRkaW5nPVwiMHB4XCI+PC90YWJsZT4nKVxyXG4gICAgdGl0bGVUYWJsZS5hcHBlbmQoJCgnPHRyPjx0ZCBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGRcIj5Qcm9wZXJ0aWVzIFRyZWU8L3RkPjwvdHI+JykpXHJcbiAgICBkaWFsb2dET00uYXBwZW5kKCQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXInLz5cIikuYXBwZW5kKHRpdGxlVGFibGUpKVxyXG5cclxuICAgIHZhciBzZXR0aW5nc0Rpdj0kKFwiPGRpdiBjbGFzcz0ndzMtY29udGFpbmVyIHczLWJvcmRlcicgc3R5bGU9J3dpZHRoOjEwMCU7bWF4LWhlaWdodDozMTBweDtvdmVyZmxvdzphdXRvJz48L2Rpdj5cIilcclxuICAgIHRoaXMuc2V0dGluZ3NEaXY9c2V0dGluZ3NEaXZcclxuICAgIGRpYWxvZ0RPTS5hcHBlbmQoc2V0dGluZ3NEaXYpXHJcbiAgICB0aGlzLmRyYXdNb2RlbFNldHRpbmdzKClcclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuYWRkTmV3VHdpbiA9IGFzeW5jIGZ1bmN0aW9uKGNsb3NlRGlhbG9nKSB7XHJcbiAgICB2YXIgbW9kZWxJRD10aGlzLnR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgREJNb2RlbEluZm89Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQobW9kZWxJRClcclxuXHJcbiAgICBpZighdGhpcy50d2luSW5mb1tcIiRkdElkXCJdfHx0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl09PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gbmFtZSBmb3IgdGhlIG5ldyBkaWdpdGFsIHR3aW5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgY29tcG9uZW50c05hbWVBcnI9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmluY2x1ZGVkQ29tcG9uZW50c1xyXG4gICAgY29tcG9uZW50c05hbWVBcnIuZm9yRWFjaChvbmVDb21wb25lbnROYW1lPT57IC8vYWR0IHNlcnZpY2UgcmVxdWVzdGluZyBhbGwgY29tcG9uZW50IGFwcGVhciBieSBtYW5kYXRvcnlcclxuICAgICAgICBpZih0aGlzLnR3aW5JbmZvW29uZUNvbXBvbmVudE5hbWVdPT1udWxsKXRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV09e31cclxuICAgICAgICB0aGlzLnR3aW5JbmZvW29uZUNvbXBvbmVudE5hbWVdW1wiJG1ldGFkYXRhXCJdPSB7fVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2FzayB0YXNrbWFzdGVyIHRvIGFkZCB0aGUgdHdpblxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciBwb3N0Qm9keT0ge1wibmV3VHdpbkpzb25cIjpKU09OLnN0cmluZ2lmeSh0aGlzLnR3aW5JbmZvKX1cclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3Vwc2VydERpZ2l0YWxUd2luXCIsIFwiUE9TVFwiLCBwb3N0Qm9keSxcIndpdGhQcm9qZWN0SURcIiApXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4oZGF0YS5EQlR3aW4pICAgIFxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKGRhdGEuQURUVHdpbilcclxuXHJcblxyXG4gICAgLy9hc2sgdGFza21hc3RlciB0byBwcm92aXNpb24gdGhlIHR3aW4gdG8gaW90IGh1YiBpZiB0aGUgbW9kZWwgaXMgYSBpb3QgZGV2aWNlIG1vZGVsXHJcbiAgICBpZihEQk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBwb3N0Qm9keT0ge1wiREJUd2luXCI6ZGF0YS5EQlR3aW4sXCJkZXNpcmVkSW5EZXZpY2VUd2luXCI6e319XHJcbiAgICAgICAgICAgIERCTW9kZWxJbmZvLmRlc2lyZWRQcm9wZXJ0aWVzLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlOYW1lPWVsZS5wYXRoW2VsZS5wYXRoLmxlbmd0aC0xXVxyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5U2FtcGxlVj0gXCJcIlxyXG4gICAgICAgICAgICAgICAgcG9zdEJvZHkuZGVzaXJlZEluRGV2aWNlVHdpbltwcm9wZXJ0eU5hbWVdPXByb3BlcnR5U2FtcGxlVlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB2YXIgcHJvdmlzaW9uZWREb2N1bWVudCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRldmljZW1hbmFnZW1lbnQvcHJvdmlzaW9uSW9URGV2aWNlVHdpblwiLCBcIlBPU1RcIiwgcG9zdEJvZHksXCJ3aXRoUHJvamVjdElEXCIgKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhLkRCVHdpbj1wcm92aXNpb25lZERvY3VtZW50XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4ocHJvdmlzaW9uZWREb2N1bWVudCkgICBcclxuICAgIH1cclxuXHJcbiAgICAvL2l0IHNob3VsZCBzZWxlY3QgdGhlIG5ldyBub2RlIGluIHRoZSB0cmVlLCBhbmQgbW92ZSB0b3BvbG9neSB2aWV3IHRvIHNob3cgdGhlIG5ldyBub2RlIChub3RlIHBhbiB0byBhIHBsYWNlIHRoYXQgaXMgbm90IGJsb2NrZWQgYnkgdGhlIGRpYWxvZyBpdHNlbGYpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsIFwidHdpbkluZm9cIjogZGF0YS5BRFRUd2luLCBcIkRCVHdpbkluZm9cIjpkYXRhLkRCVHdpbn0pXHJcblxyXG4gICAgaWYoY2xvc2VEaWFsb2cpdGhpcy5ET00uaGlkZSgpXHJcbiAgICBlbHNle1xyXG4gICAgICAgIC8vY2xlYXIgdGhlIGlucHV0IGVkaXRib3hcclxuICAgICAgICB0aGlzLnBvcHVwKHRoaXMub3JpZ2luYWxUd2luSW5mbylcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd01vZGVsU2V0dGluZ3MgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBtb2RlbERldGFpbD0gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICB2YXIgY29weU1vZGVsRWRpdGFibGVQcm9wZXJ0eT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1vZGVsRGV0YWlsLmVkaXRhYmxlUHJvcGVydGllcykpXHJcbiAgICBcclxuICAgIGlmKCQuaXNFbXB0eU9iamVjdChjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5KSl7XHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc0Rpdi50ZXh0KFwiVGhlcmUgaXMgbm8gZWRpdGFibGUgcHJvcGVydHlcIilcclxuICAgICAgICB0aGlzLnNldHRpbmdzRGl2LmFkZENsYXNzKFwidzMtdGV4dC1ncmF5XCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfSAgIFxyXG5cclxuICAgIHZhciBzZXR0aW5nc1RhYmxlPSQoJzx0YWJsZSBzdHlsZT1cIndpZHRoOjEwMCVcIiBjZWxsc3BhY2luZz1cIjBweFwiIGNlbGxwYWRkaW5nPVwiMHB4XCI+PC90YWJsZT4nKVxyXG4gICAgdGhpcy5zZXR0aW5nc0Rpdi5hcHBlbmQoc2V0dGluZ3NUYWJsZSlcclxuXHJcbiAgICB2YXIgaW5pdGlhbFBhdGhBcnI9W11cclxuICAgIHZhciBsYXN0Um9vdE5vZGVSZWNvcmQ9W11cclxuICAgIHRoaXMuZHJhd0VkaXRhYmxlKHNldHRpbmdzVGFibGUsY29weU1vZGVsRWRpdGFibGVQcm9wZXJ0eSxpbml0aWFsUGF0aEFycixsYXN0Um9vdE5vZGVSZWNvcmQpXHJcbn1cclxuXHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3RWRpdGFibGUgPSBhc3luYyBmdW5jdGlvbihwYXJlbnRUYWJsZSxqc29uSW5mbyxwYXRoQXJyLGxhc3RSb290Tm9kZVJlY29yZCkge1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKSBhcnIucHVzaChpbmQpXHJcblxyXG4gICAgZm9yKHZhciB0aGVJbmRleD0wO3RoZUluZGV4PGFyci5sZW5ndGg7dGhlSW5kZXgrKyl7XHJcbiAgICAgICAgaWYodGhlSW5kZXg9PWFyci5sZW5ndGgtMSkgbGFzdFJvb3ROb2RlUmVjb3JkW3BhdGhBcnIubGVuZ3RoXSA9dHJ1ZTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgaW5kID0gYXJyW3RoZUluZGV4XVxyXG4gICAgICAgIHZhciB0cj0kKFwiPHRyLz5cIilcclxuICAgICAgICB2YXIgcmlnaHRURD0kKFwiPHRkIHN0eWxlPSdoZWlnaHQ6MzBweCcvPlwiKVxyXG4gICAgICAgIHRyLmFwcGVuZChyaWdodFREKVxyXG4gICAgICAgIHBhcmVudFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICBcclxuICAgICAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKCFsYXN0Um9vdE5vZGVSZWNvcmRbaV0pIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMikpXHJcbiAgICAgICAgICAgIGVsc2UgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdig0KSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoZUluZGV4PT1hcnIubGVuZ3RoLTEpIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMykpXHJcbiAgICAgICAgZWxzZSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDEpKVxyXG5cclxuICAgICAgICB2YXIgcE5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Zsb2F0OmxlZnQ7bGluZS1oZWlnaHQ6MjhweDttYXJnaW4tbGVmdDozcHgnPlwiK2luZCtcIjwvZGl2PlwiKVxyXG4gICAgICAgIHJpZ2h0VEQuYXBwZW5kKHBOYW1lRGl2KVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG5cclxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSkgeyAvL2l0IGlzIGEgZW51bWVyYXRvclxyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wRG93bkJveChyaWdodFRELG5ld1BhdGgsanNvbkluZm9baW5kXSlcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHBhcmVudFRhYmxlLGpzb25JbmZvW2luZF0sbmV3UGF0aCxsYXN0Um9vdE5vZGVSZWNvcmQpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4O3BhZGRpbmc6MnB4O3dpZHRoOjIwMHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgcmlnaHRURC5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZSgkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd0Ryb3BEb3duQm94PWZ1bmN0aW9uKHJpZ2h0VEQsbmV3UGF0aCx2YWx1ZUFycil7XHJcbiAgICB2YXIgYVNlbGVjdE1lbnUgPSBuZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiXHJcbiAgICAgICAgLCB7IHdpZHRoOiBcIjIwMFwiIFxyXG4gICAgICAgICAgICAsYnV0dG9uQ1NTOiB7IFwicGFkZGluZ1wiOiBcIjRweCAxNnB4XCJ9XHJcbiAgICAgICAgICAgICwgXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6IDI1Ly8sXCJvcHRpb25MaXN0TWFyZ2luTGVmdFwiOjIxMFxyXG4gICAgICAgICAgICAsIFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjogdGhpcy5ET00ub2Zmc2V0KClcclxuICAgICAgICB9KVxyXG5cclxuXHJcbiAgICByaWdodFRELmFwcGVuZChhU2VsZWN0TWVudS5yb3dET00pICAvL3VzZSByb3dET00gaW5zdGVhZCBvZiBET00gdG8gYWxsb3cgc2VsZWN0IG9wdGlvbiB3aW5kb3cgZmxvYXQgYWJvdmUgZGlhbG9nXHJcbiAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbikgPT4ge1xyXG4gICAgICAgIHZhciBzdHIgPSBvbmVPcHRpb25bXCJkaXNwbGF5TmFtZVwiXSB8fCBvbmVPcHRpb25bXCJlbnVtVmFsdWVcIl1cclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uID0gKG9wdGlvblRleHQsIG9wdGlvblZhbHVlLCByZWFsTW91c2VDbGljaykgPT4ge1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZiAocmVhbE1vdXNlQ2xpY2spIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUoYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIpLCBvcHRpb25WYWx1ZSwgXCJzdHJpbmdcIilcclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24ocGF0aEFycixuZXdWYWwsZGF0YVR5cGUpe1xyXG4gICAgaWYoW1wiZG91YmxlXCIsXCJib29sZWFuXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiXS5pbmNsdWRlcyhkYXRhVHlwZSkpIG5ld1ZhbD1OdW1iZXIobmV3VmFsKVxyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPXRoaXMudHdpbkluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgaWYoaT09cGF0aEFyci5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIHRoZUpzb25ba2V5XT1uZXdWYWxcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhlSnNvbltrZXldPT1udWxsKSB0aGVKc29uW2tleV09e31cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS50cmVlTGluZURpdiA9IGZ1bmN0aW9uKHR5cGVOdW1iZXIpIHtcclxuICAgIHZhciByZURpdj0kKCc8ZGl2IHN0eWxlPVwibWFyZ2luLWxlZnQ6MTBweDt3aWR0aDoxNXB4O2hlaWdodDogMTAwJTtmbG9hdDogbGVmdFwiPjwvZGl2PicpXHJcbiAgICBpZih0eXBlTnVtYmVyPT0xKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1ib3R0b20gdzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj48ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTIpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj48ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj48L2Rpdj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTMpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWJvdHRvbSB3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09NCl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVEaXZcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbmV3VHdpbkRpYWxvZygpOyIsImNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIHByb2plY3RTZXR0aW5nRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDFcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAocHJvamVjdEluZm8pIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgaWYodGhpcy5jb250ZW50SW5pdGlhbGl6ZWQpcmV0dXJuO1xyXG4gICAgdGhpcy5jb250ZW50SW5pdGlhbGl6ZWQ9dHJ1ZTsgXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjQyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+U2V0dGluZzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciB0YWJDb250cm9sPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtbGlnaHQtZ3JheVwiPjwvZGl2PicpXHJcbiAgICB2YXIgbGF5b3V0QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gXCIgc3R5bGU9XCJtYXJnaW46MHB4IDVweFwiPkxheW91dDwvYnV0dG9uPicpXHJcbiAgICB2YXIgdmlzdWFsU2NoZW1hQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj5WaXN1YWwgU2NoZW1hPC9idXR0b24+JylcclxuICAgIHRhYkNvbnRyb2wuYXBwZW5kKGxheW91dEJ0bix2aXN1YWxTY2hlbWFCdG4pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGFiQ29udHJvbClcclxuXHJcbiAgICB0aGlzLmxheW91dENvbnRlbnREaXY9JCgnPGRpdiBjbGFzcz1cInczLWFuaW1hdGUtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZzoxMHB4O2Rpc3BsYXk6bm9uZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnZpc3VhbFNjaGVtYUNvbnRlbnREaXY9JCgnPGRpdiBjbGFzcz1cInczLWFuaW1hdGUtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZzoxMHB4O2Rpc3BsYXk6bm9uZVwiPlZpc3VhbCBTY2hlbWE8L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMubGF5b3V0Q29udGVudERpdix0aGlzLnZpc3VhbFNjaGVtYUNvbnRlbnREaXYpXHJcbiAgICB0aGlzLmZpbGxMYXlvdXREaXZDb250ZW50KClcclxuXHJcbiAgICBsYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbGF5b3V0QnRuLmFkZENsYXNzKFwidzMtZGFyay1ncmV5XCIpXHJcbiAgICAgICAgdmlzdWFsU2NoZW1hQnRuLnJlbW92ZUNsYXNzKFwidzMtZGFyay1ncmV5XCIpXHJcbiAgICAgICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LmhpZGUoKVxyXG4gICAgICAgIHRoaXMubGF5b3V0Q29udGVudERpdi5zaG93KClcclxuICAgIH0pXHJcblxyXG4gICAgdmlzdWFsU2NoZW1hQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGxheW91dEJ0bi5yZW1vdmVDbGFzcyhcInczLWRhcmstZ3JleVwiKVxyXG4gICAgICAgIHZpc3VhbFNjaGVtYUJ0bi5hZGRDbGFzcyhcInczLWRhcmstZ3JleVwiKVxyXG4gICAgICAgIHRoaXMudmlzdWFsU2NoZW1hQ29udGVudERpdi5zaG93KClcclxuICAgICAgICB0aGlzLmxheW91dENvbnRlbnREaXYuaGlkZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIGxheW91dEJ0bi50cmlnZ2VyKFwiY2xpY2tcIilcclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmZpbGxMYXlvdXREaXZDb250ZW50ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNob3dPdGhlclVzZXJMYXlvdXRDaGVjayA9ICQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgc3R5bGU9XCJ3aWR0aDoyMHB4O21hcmdpbi1sZWZ0OjEwcHg7bWFyZ2luLXJpZ2h0OjEwcHhcIiB0eXBlPVwiY2hlY2tib3hcIj4nKVxyXG4gICAgdmFyIHNob3dPdGhlclVzZXJMYXlvdXRUZXh0ID0gJCgnPGxhYmVsIHN0eWxlPVwicGFkZGluZzoycHggOHB4O1wiPlNob3cgc2hhcmVkIGxheW91dHMgZnJvbSBPdGhlciBVc2VyczwvbGFiZWw+JylcclxuICAgIHRoaXMubGF5b3V0Q29udGVudERpdi5hcHBlbmQoc2hvd090aGVyVXNlckxheW91dENoZWNrLCBzaG93T3RoZXJVc2VyTGF5b3V0VGV4dClcclxuXHJcbiAgICB2YXIgbGF5b3V0c0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWF4LWhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LmFwcGVuZChsYXlvdXRzRGl2KVxyXG4gICAgdGhpcy5sYXlvdXRzRGl2PWxheW91dHNEaXZcclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5hZGRPbmVMYXlvdXRCYXIoaW5kLGxheW91dHNEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVMYXlvdXRCYXI9ZnVuY3Rpb24obGF5b3V0TmFtZSxwYXJlbnREaXYpe1xyXG4gICAgdmFyIG9uZUxheW91dD0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyIHczLWJ1dHRvbiB3My1ib3JkZXItYm90dG9tXCI+PC9hPicpXHJcbiAgICBwYXJlbnREaXYuYXBwZW5kKG9uZUxheW91dClcclxuXHJcbiAgICB2YXIgbmFtZUxibD0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+JytsYXlvdXROYW1lKyc8L2E+JylcclxuICAgIHZhciBkZWZhdWx0TGJsPSQoXCI8YSBjbGFzcz0ndzMtbGltZSB3My1iYXItaXRlbScgc3R5bGU9J2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoxcHggMnB4O21hcmdpbi10b3A6OXB4O2JvcmRlci1yYWRpdXM6IDJweDsnPmRlZmF1bHQ8L2E+XCIpXHJcbiAgICBkZWZhdWx0TGJsLmhpZGUoKVxyXG4gICAgb25lTGF5b3V0LmRhdGEoXCJkZWZhdWx0TGJsXCIsZGVmYXVsdExibClcclxuICAgIG9uZUxheW91dC5hcHBlbmQobmFtZUxibCxkZWZhdWx0TGJsKVxyXG5cclxuICAgIHZhciBzaGFyZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0IHczLWhvdmVyLWFtYmVyXCI+U2hhcmU8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0IHczLWhvdmVyLWFtYmVyXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgb25lTGF5b3V0LmFwcGVuZChkZWxldGVCdG4sc2hhcmVCdG4pXHJcbiAgICBzaGFyZUJ0bi5oaWRlKClcclxuICAgIGRlbGV0ZUJ0bi5oaWRlKClcclxuXHJcbiAgICBvbmVMYXlvdXQuaG92ZXIoKCk9PntcclxuICAgICAgICBzaGFyZUJ0bi5zaG93KClcclxuICAgICAgICBkZWxldGVCdG4uc2hvdygpXHJcbiAgICB9LCgpPT57XHJcbiAgICAgICAgc2hhcmVCdG4uaGlkZSgpXHJcbiAgICAgICAgZGVsZXRlQnRuLmhpZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICBvbmVMYXlvdXQub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdGhpcy5zZXRBc0RlZmF1bHRMYXlvdXQob25lTGF5b3V0KVxyXG4gICAgfSlcclxuXHJcbiAgICBkZWxldGVCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgY29uc29sZS5sb2coXCJkZWxldGUgXCIrbGF5b3V0TmFtZSlcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0pXHJcbiAgICBzaGFyZUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBjb25zb2xlLmxvZyhcInNoYXJlIFwiK2xheW91dE5hbWUpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9KVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuc2V0QXNEZWZhdWx0TGF5b3V0PWZ1bmN0aW9uKG9uZUxheW91dERPTSl7XHJcbiAgICB0aGlzLmxheW91dHNEaXYuY2hpbGRyZW4oJ2EnKS5lYWNoKChpbmRleCxhTGF5b3V0KT0+e1xyXG4gICAgICAgIHZhciBkZWZhdWx0TGJsPSAkKGFMYXlvdXQpLmRhdGEoXCJkZWZhdWx0TGJsXCIpXHJcbiAgICAgICAgZGVmYXVsdExibC5oaWRlKClcclxuICAgIH0pXHJcbiAgICB2YXIgZGVmYXVsdExibD1vbmVMYXlvdXRET00uZGF0YShcImRlZmF1bHRMYmxcIilcclxuICAgIGRlZmF1bHRMYmwuc2hvdygpXHJcbiAgICAvL2NvbnNvbGUubG9nKGdsb2JhbENhY2hlLmFjY291bnRJbmZvKVxyXG4gICAgLy9jb25zb2xlLmxvZyhnbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEKVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgcHJvamVjdFNldHRpbmdEaWFsb2coKTsiLCJmdW5jdGlvbiBzaW1wbGVDb25maXJtRGlhbG9nKCl7XHJcbiAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDJcIiBjbGFzcz1cInczLWNhcmQtNFwiPjwvZGl2PicpXHJcbiAgICAvL3RoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuc2hvdz1mdW5jdGlvbihjc3NPcHRpb25zLG90aGVyT3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTS5jc3MoY3NzT3B0aW9ucylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPicgKyBvdGhlck9wdGlvbnMudGl0bGUgKyAnPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jbG9zZSgpIH0pXHJcblxyXG4gICAgdmFyIGRpYWxvZ0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWFyZ2luLWJvdHRvbToxMHB4XCI+PC9kaXY+JylcclxuICAgIGRpYWxvZ0Rpdi50ZXh0KG90aGVyT3B0aW9ucy5jb250ZW50KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGRpYWxvZ0RpdilcclxuICAgIHRoaXMuZGlhbG9nRGl2PWRpYWxvZ0RpdlxyXG5cclxuICAgIHRoaXMuYm90dG9tQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYm90dG9tQmFyKVxyXG5cclxuICAgIG90aGVyT3B0aW9ucy5idXR0b25zLmZvckVhY2goYnRuPT57XHJcbiAgICAgICAgdmFyIGFCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yaWdodCAnKyhidG4uY29sb3JDbGFzc3x8XCJcIikrJ1wiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OjJweDttYXJnaW4tbGVmdDoycHhcIj4nK2J0bi50ZXh0Kyc8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyBidG4uY2xpY2tGdW5jKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJvdHRvbUJhci5hcHBlbmQoYUJ1dHRvbikgICAgXHJcbiAgICB9KVxyXG4gICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5jbG9zZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVDb25maXJtRGlhbG9nOyIsImZ1bmN0aW9uIHNpbXBsZVNlbGVjdE1lbnUoYnV0dG9uTmFtZSxvcHRpb25zKXtcclxuICAgIG9wdGlvbnM9b3B0aW9uc3x8e30gLy97aXNDbGlja2FibGU6MSx3aXRoQm9yZGVyOjEsZm9udFNpemU6XCJcIixjb2xvckNsYXNzOlwiXCIsYnV0dG9uQ1NTOlwiXCJ9XHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmlzQ2xpY2thYmxlPXRydWVcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY2xpY2tcIj48L2Rpdj4nKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWhvdmVyIFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00ub24oXCJtb3VzZW92ZXJcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvL2l0IHNlZW1zIHRoYXQgdGhlIHNlbGVjdCBtZW51IG9ubHkgY2FuIHNob3cgb3V0c2lkZSBvZiBhIHBhcmVudCBzY3JvbGxhYmxlIGRvbSB3aGVuIGl0IGlzIGluc2lkZSBhIHczLWJhciBpdGVtLi4uIG5vdCB2ZXJ5IHN1cmUgYWJvdXQgd2h5IFxyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tbGVmdDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmNzcyhcIndpZHRoXCIsKG9wdGlvbnMud2lkdGh8fDEwMCkrXCJweFwiKVxyXG4gICAgdGhpcy5yb3dET009cm93RE9NXHJcbiAgICB0aGlzLnJvd0RPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsQmFja19iZWZvcmVDbGlja0V4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGp1c3REcm9wRG93blBvc2l0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICBpZighdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgcmV0dXJuO1xyXG4gICAgdmFyIG9mZnNldD10aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgdmFyIG5ld1RvcD1vZmZzZXQudG9wLXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IudG9wXHJcbiAgICB2YXIgbmV3TGVmdD1vZmZzZXQubGVmdC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLmxlZnRcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1widG9wXCI6bmV3VG9wK1wicHhcIixcImxlZnRcIjpuZXdMZWZ0K1wicHhcIn0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmZpbmRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIG9wdGlvbnM9dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKClcclxuICAgIGZvcih2YXIgaT0wO2k8b3B0aW9ucy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5PcHRpb249JChvcHRpb25zW2ldKVxyXG4gICAgICAgIGlmKG9wdGlvblZhbHVlPT1hbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIikpe1xyXG4gICAgICAgICAgICByZXR1cm4ge1widGV4dFwiOmFuT3B0aW9uLnRleHQoKSxcInZhbHVlXCI6YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwiY29sb3JDbGFzc1wiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25Db2xvckNsYXNzXCIpfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uQXJyPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICB0aGlzLmFkZE9wdGlvbihlbGVtZW50KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbj1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlLGNvbG9yQ2xhc3Mpe1xyXG4gICAgdmFyIG9wdGlvbkl0ZW09JCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPicrb3B0aW9uVGV4dCsnPC9hPicpXHJcbiAgICBpZihjb2xvckNsYXNzKSBvcHRpb25JdGVtLmFkZENsYXNzKGNvbG9yQ2xhc3MpXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uYXBwZW5kKG9wdGlvbkl0ZW0pXHJcbiAgICBvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiLG9wdGlvblZhbHVlfHxvcHRpb25UZXh0KVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiLGNvbG9yQ2xhc3MpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIixvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25Db2xvckNsYXNzXCIpKVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2hhbmdlTmFtZT1mdW5jdGlvbihuYW1lU3RyMSxuYW1lU3RyMil7XHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbihcIjpmaXJzdFwiKS50ZXh0KG5hbWVTdHIxKVxyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oKS5lcSgxKS50ZXh0KG5hbWVTdHIyKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uSW5kZXg9ZnVuY3Rpb24ob3B0aW9uSW5kZXgpe1xyXG4gICAgdmFyIHRoZU9wdGlvbj10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKS5lcShvcHRpb25JbmRleClcclxuICAgIGlmKHRoZU9wdGlvbi5sZW5ndGg9PTApIHtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPXRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24odGhlT3B0aW9uLnRleHQoKSx0aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpLG51bGwsdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25Db2xvckNsYXNzXCIpKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSxudWxsLHJlLmNvbG9yQ2xhc3MpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jbGVhck9wdGlvbnM9ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2FsbEJhY2tfY2xpY2tPcHRpb249ZnVuY3Rpb24ob3B0aW9udGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayl7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNhbGxCYWNrX2JlZm9yZUNsaWNrRXhwYW5kPWZ1bmN0aW9uKG9wdGlvbnRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spe1xyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVTZWxlY3RNZW51OyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWUoRE9NLG9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmdyb3VwTm9kZXM9W10gLy9lYWNoIGdyb3VwIGhlYWRlciBpcyBvbmUgbm9kZVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPVtdO1xyXG4gICAgdGhpcy5vcHRpb25zPW9wdGlvbnMgfHwge31cclxuXHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zY3JvbGxUb0xlYWZOb2RlPWZ1bmN0aW9uKGFOb2RlKXtcclxuICAgIHZhciBzY3JvbGxUb3A9dGhpcy5ET00uc2Nyb2xsVG9wKClcclxuICAgIHZhciB0cmVlSGVpZ2h0PXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgbm9kZVBvc2l0aW9uPWFOb2RlLkRPTS5wb3NpdGlvbigpLnRvcCAvL3doaWNoIGRvZXMgbm90IGNvbnNpZGVyIHBhcmVudCBET00ncyBzY3JvbGwgaGVpZ2h0XHJcbiAgICAvL2NvbnNvbGUubG9nKHNjcm9sbFRvcCx0cmVlSGVpZ2h0LG5vZGVQb3NpdGlvbilcclxuICAgIGlmKHRyZWVIZWlnaHQtNTA8bm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgbm9kZVBvc2l0aW9uLSh0cmVlSGVpZ2h0LTUwKSkgXHJcbiAgICB9ZWxzZSBpZihub2RlUG9zaXRpb248NTApe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyAobm9kZVBvc2l0aW9uLTUwKSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmNsZWFyQWxsTGVhZk5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgZ05vZGUubGlzdERPTS5lbXB0eSgpXHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPTBcclxuICAgICAgICBnTm9kZS5yZWZyZXNoTmFtZSgpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maXJzdExlYWZOb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBmaXJzdExlYWZOb2RlPW51bGw7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoZmlyc3RMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGZpcnN0TGVhZk5vZGU9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gZmlyc3RMZWFmTm9kZVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0R3JvdXBOb2RlPWZ1bmN0aW9uKGFHcm91cE5vZGUpe1xyXG4gICAgaWYoYUdyb3VwTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGluZGV4PXRoaXMuZ3JvdXBOb2Rlcy5pbmRleE9mKGFHcm91cE5vZGUpXHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNleyAvL3JvdGF0ZSBiYWNrd2FyZCB0byBmaXJzdCBncm91cCBub2RlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1swXSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dExlYWZOb2RlPWZ1bmN0aW9uKGFMZWFmTm9kZSl7XHJcbiAgICBpZihhTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBhR3JvdXBOb2RlPWFMZWFmTm9kZS5wYXJlbnRHcm91cE5vZGVcclxuICAgIHZhciBpbmRleD1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YoYUxlYWZOb2RlKVxyXG4gICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgLy9uZXh0IG5vZGUgaXMgaW4gc2FtZSBncm91cFxyXG4gICAgICAgIHJldHVybiBhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2ZpbmQgbmV4dCBncm91cCBmaXJzdCBub2RlXHJcbiAgICAgICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgICAgIHZhciBuZXh0R3JvdXBOb2RlID0gdGhpcy5uZXh0R3JvdXBOb2RlKGFHcm91cE5vZGUpXHJcbiAgICAgICAgICAgIGlmKG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgICAgIGFHcm91cE5vZGU9bmV4dEdyb3VwTm9kZVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlYXJjaFRleHQ9ZnVuY3Rpb24oc3RyKXtcclxuICAgIGlmKHN0cj09XCJcIikgcmV0dXJuIG51bGw7XHJcbiAgICAvL3NlYXJjaCBmcm9tIGN1cnJlbnQgc2VsZWN0IGl0ZW0gdGhlIG5leHQgbGVhZiBpdGVtIGNvbnRhaW5zIHRoZSB0ZXh0XHJcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHN0ciwgJ2knKTtcclxuICAgIHZhciBzdGFydE5vZGVcclxuICAgIGlmKHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9PTApIHtcclxuICAgICAgICBzdGFydE5vZGU9dGhpcy5maXJzdExlYWZOb2RlKClcclxuICAgICAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgICAgICB2YXIgdGhlU3RyPXN0YXJ0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKHRoZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGUgXHJcbiAgICAgICAgICAgIHJldHVybiBzdGFydE5vZGVcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBzdGFydE5vZGU9dGhpcy5zZWxlY3RlZE5vZGVzWzBdXHJcblxyXG4gICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIFxyXG4gICAgdmFyIGZyb21Ob2RlPXN0YXJ0Tm9kZTtcclxuICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZT10aGlzLm5leHRMZWFmTm9kZShmcm9tTm9kZSlcclxuICAgICAgICBpZihuZXh0Tm9kZT09c3RhcnROb2RlKSByZXR1cm4gbnVsbDtcclxuICAgICAgICB2YXIgbmV4dE5vZGVTdHI9bmV4dE5vZGUubmFtZTtcclxuICAgICAgICBpZihuZXh0Tm9kZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgcmV0dXJuIG5leHROb2RlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZyb21Ob2RlPW5leHROb2RlO1xyXG4gICAgICAgIH1cclxuICAgIH0gICAgXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmdldEFsbExlYWZOb2RlQXJyPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYWxsTGVhZj1bXVxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goZ249PntcclxuICAgICAgICBhbGxMZWFmPWFsbExlYWYuY29uY2F0KGduLmNoaWxkTGVhZk5vZGVzKVxyXG4gICAgfSlcclxuICAgIHJldHVybiBhbGxMZWFmO1xyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkTGVhZm5vZGVUb0dyb3VwPWZ1bmN0aW9uKGdyb3VwTmFtZSxvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgYUdyb3VwTm9kZT10aGlzLmZpbmRHcm91cE5vZGUoZ3JvdXBOYW1lKVxyXG4gICAgaWYoYUdyb3VwTm9kZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICBhR3JvdXBOb2RlLmFkZE5vZGUob2JqLHNraXBSZXBlYXQpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnJlbW92ZUFsbE5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpbmRHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOYW1lKXtcclxuICAgIHZhciBmb3VuZEdyb3VwTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5uYW1lPT1ncm91cE5hbWUpe1xyXG4gICAgICAgICAgICBmb3VuZEdyb3VwTm9kZT1hR3JvdXBOb2RlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGZvdW5kR3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxHcm91cE5vZGU9ZnVuY3Rpb24oZ25vZGUpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbGV0ZUxlYWZOb2RlPWZ1bmN0aW9uKG5vZGVOYW1lKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHZhciBmaW5kTGVhZk5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGlmKGZpbmRMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goKGFMZWFmKT0+e1xyXG4gICAgICAgICAgICBpZihhTGVhZi5uYW1lPT1ub2RlTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBmaW5kTGVhZk5vZGU9YUxlYWZcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgaWYoZmluZExlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICBmaW5kTGVhZk5vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5pbnNlcnRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqLGluZGV4KXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnNwbGljZShpbmRleCwgMCwgYU5ld0dyb3VwTm9kZSk7XHJcblxyXG4gICAgaWYoaW5kZXg9PTApe1xyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHByZXZHcm91cE5vZGU9dGhpcy5ncm91cE5vZGVzW2luZGV4LTFdXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5oZWFkZXJET00uaW5zZXJ0QWZ0ZXIocHJldkdyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUubGlzdERPTS5pbnNlcnRBZnRlcihhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkR3JvdXBOb2RlPWZ1bmN0aW9uKG9iail7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybiBleGlzdEdyb3VwTm9kZTtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5wdXNoKGFOZXdHcm91cE5vZGUpO1xyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZT1mdW5jdGlvbihsZWFmTm9kZSxtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIoW2xlYWZOb2RlXSxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb249ZnVuY3Rpb24obGVhZk5vZGUpe1xyXG4gICAgdmFyIG5ld0Fycj1bXS5jb25jYXQodGhpcy5zZWxlY3RlZE5vZGVzKVxyXG4gICAgbmV3QXJyLnB1c2gobGVhZk5vZGUpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkTm9kZUFycmF5VG9TZWxlY3Rpb249ZnVuY3Rpb24oYXJyKXtcclxuICAgIHZhciBuZXdBcnIgPSB0aGlzLnNlbGVjdGVkTm9kZXNcclxuICAgIHZhciBmaWx0ZXJBcnI9YXJyLmZpbHRlcigoaXRlbSkgPT4gbmV3QXJyLmluZGV4T2YoaXRlbSkgPCAwKVxyXG4gICAgbmV3QXJyID0gbmV3QXJyLmNvbmNhdChmaWx0ZXJBcnIpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0R3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKGdyb3VwTm9kZS5pbmZvKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZUFycj1mdW5jdGlvbihsZWFmTm9kZUFycixtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5kaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPXRoaXMuc2VsZWN0ZWROb2Rlcy5jb25jYXQobGVhZk5vZGVBcnIpXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uaGlnaGxpZ2h0KClcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcyh0aGlzLnNlbGVjdGVkTm9kZXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGJsQ2xpY2tOb2RlPWZ1bmN0aW9uKHRoZU5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSh0aGVOb2RlKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zb3J0QWxsTGVhdmVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuc29ydE5vZGVzQnlOYW1lKCl9KVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGdyb3VwIG5vZGUtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUdyb3VwTm9kZShwYXJlbnRUcmVlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudFRyZWU9cGFyZW50VHJlZVxyXG4gICAgdGhpcy5pbmZvPW9ialxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcz1bXSAvL2l0J3MgY2hpbGQgbGVhZiBub2RlcyBhcnJheVxyXG4gICAgdGhpcy5uYW1lPW9iai5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O3BhZGRpbmctcmlnaHQ6M3B4O3ZlcnRpY2FsLWFsaWduOm1pZGRsZSc+PC9kaXY+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG4gICAgXHJcbiAgICBpZih0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBsYmxDb2xvcj1cInczLWxpbWVcIlxyXG4gICAgZWxzZSB2YXIgbGJsQ29sb3I9XCJ3My1ncmF5XCIgXHJcbiAgICB0aGlzLmhlYWRlckRPTS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG5cclxuICAgIFxyXG4gICAgaWYodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICBpZihpY29uTGFiZWwpe1xyXG4gICAgICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgICAgICB2YXIgcm93SGVpZ2h0PWljb25MYWJlbC5oZWlnaHQoKVxyXG4gICAgICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIikgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtYmVybGFiZWw9JChcIjxsYWJlbCBjbGFzcz0nXCIrbGJsQ29sb3IrXCInIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4IDRweDtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+XCIrdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGgrXCI8L2xhYmVsPlwiKVxyXG4gICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKG5hbWVEaXYsbnVtYmVybGFiZWwpXHJcblxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZVRhaWxCdXR0b25GdW5jKXtcclxuICAgICAgICB2YXIgdGFpbEJ1dHRvbj10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZCh0YWlsQnV0dG9uKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpXHJcblxyXG59XHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXA9ZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cCAmJiB0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhpcy5zaHJpbmsoKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmhpZGUoKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5oaWRlKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uc2hvdygpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnNob3coKVxyXG4gICAgfVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5oZWFkZXJET00ucmVtb3ZlKClcclxuICAgIHRoaXMubGlzdERPTS5yZW1vdmUoKVxyXG4gICAgdmFyIHBhcmVudEFyciA9IHRoaXMucGFyZW50VHJlZS5ncm91cE5vZGVzXHJcbiAgICBjb25zdCBpbmRleCA9IHBhcmVudEFyci5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHBhcmVudEFyci5zcGxpY2UoaW5kZXgsIDEpO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jcmVhdGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduIHczLWJvcmRlci1ib3R0b21cIiBzdHlsZT1cInBvc2l0aW9uOnJlbGF0aXZlXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXJcIiBzdHlsZT1cInBhZGRpbmc6OHB4XCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLmhlYWRlckRPTS5vbihcImNsaWNrXCIsKGV2dCk9PiB7XHJcbiAgICAgICAgaWYodGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG5cclxuICAgICAgICB0aGlzLnBhcmVudFRyZWUuc2VsZWN0R3JvdXBOb2RlKHRoaXMpICAgIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5pc09wZW49ZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiAgdGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZXhwYW5kPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc29ydE5vZGVzQnlOYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuc29ydChmdW5jdGlvbiAoYSwgYikgeyBcclxuICAgICAgICB2YXIgYU5hbWU9YS5uYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICB2YXIgYk5hbWU9Yi5uYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICByZXR1cm4gYU5hbWUubG9jYWxlQ29tcGFyZShiTmFtZSkgXHJcbiAgICB9KTtcclxuICAgIC8vdGhpcy5saXN0RE9NLmVtcHR5KCkgLy9OT1RFOiBDYW4gbm90IGRlbGV0ZSB0aG9zZSBsZWFmIG5vZGUgb3RoZXJ3aXNlIHRoZSBldmVudCBoYW5kbGUgaXMgbG9zdFxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKG9uZUxlYWY9Pnt0aGlzLmxpc3RET00uYXBwZW5kKG9uZUxlYWYuRE9NKX0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmFkZE5vZGU9ZnVuY3Rpb24ob2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcblxyXG4gICAgaWYoc2tpcFJlcGVhdCl7XHJcbiAgICAgICAgdmFyIGZvdW5kUmVwZWF0PWZhbHNlO1xyXG4gICAgICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChhTm9kZT0+e1xyXG4gICAgICAgICAgICBpZihhTm9kZS5uYW1lPT1vYmpbbGVhZk5hbWVQcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kUmVwZWF0PXRydWVcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYoZm91bmRSZXBlYXQpIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYU5ld05vZGUgPSBuZXcgc2ltcGxlVHJlZUxlYWZOb2RlKHRoaXMsb2JqKVxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5wdXNoKGFOZXdOb2RlKVxyXG4gICAgdGhpcy5yZWZyZXNoTmFtZSgpXHJcbiAgICB0aGlzLmxpc3RET00uYXBwZW5kKGFOZXdOb2RlLkRPTSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBsZWFmIG5vZGUtLS0tLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUxlYWZOb2RlKHBhcmVudEdyb3VwTm9kZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGU9cGFyZW50R3JvdXBOb2RlXHJcbiAgICB0aGlzLmxlYWZJbmZvPW9iajtcclxuXHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB0aGlzLm5hbWU9dGhpcy5sZWFmSW5mb1t0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XVxyXG4gICAgZWxzZSB0aGlzLm5hbWU9dGhpcy5sZWFmSW5mb1tcIiRkdElkXCJdXHJcblxyXG4gICAgdGhpcy5jcmVhdGVMZWFmTm9kZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnJlbW92ZSgpXHJcbiAgICB2YXIgZ05vZGUgPSB0aGlzLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgY29uc3QgaW5kZXggPSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIGdOb2RlLmNoaWxkTGVhZk5vZGVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICBnTm9kZS5yZWZyZXNoTmFtZSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuY2xpY2tTZWxmPWZ1bmN0aW9uKG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9dGhpcztcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuc2VsZWN0TGVhZk5vZGUodGhpcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNyZWF0ZUxlYWZOb2RlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXdoaXRlXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246bGVmdDt3aWR0aDo5OCVcIj48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5yZWRyYXdMYWJlbCgpXHJcblxyXG5cclxuICAgIHZhciBjbGlja0Y9KGUpPT57XHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHQoKTtcclxuICAgICAgICB2YXIgY2xpY2tEZXRhaWw9ZS5kZXRhaWxcclxuICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uKHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICAgICAgfWVsc2UgaWYoZS5zaGlmdEtleSl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9PW51bGwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxMZWFmTm9kZUFycj10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmdldEFsbExlYWZOb2RlQXJyKClcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDEgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlKVxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4MiA9IGFsbExlYWZOb2RlQXJyLmluZGV4T2YodGhpcylcclxuICAgICAgICAgICAgICAgIGlmKGluZGV4MT09LTEgfHwgaW5kZXgyPT0tMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxlY3QgYWxsIGxlYWYgYmV0d2VlblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb3dlckk9IE1hdGgubWluKGluZGV4MSxpbmRleDIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhpZ2hlckk9IE1hdGgubWF4KGluZGV4MSxpbmRleDIpXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pZGRsZUFycj1hbGxMZWFmTm9kZUFyci5zbGljZShsb3dlckksaGlnaGVySSkgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBtaWRkbGVBcnIucHVzaChhbGxMZWFmTm9kZUFycltoaWdoZXJJXSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uKG1pZGRsZUFycilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrU2VsZihjbGlja0RldGFpbClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLkRPTS5vbihcImNsaWNrXCIsKGUpPT57Y2xpY2tGKGUpfSlcclxuXHJcbiAgICB0aGlzLkRPTS5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5kYmxDbGlja05vZGUodGhpcylcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUucmVkcmF3TGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuXHJcbiAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubGVhZk5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubGVhZk5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIilcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKG5hbWVEaXYpXHJcbn1cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5oaWdobGlnaHQ9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtb3JhbmdlXCIpXHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLWhvdmVyLWFtYmVyXCIpXHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLXdoaXRlXCIpXHJcbn1cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kaW09ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtb3JhbmdlXCIpXHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLWhvdmVyLWFtYmVyXCIpXHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLXdoaXRlXCIpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZVRyZWU7Il19
