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
const projectSettingDialog = require("../sharedSourceFiles/projectSettingDialog")
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
         mainToolbar,this.topologyInstance,this.mapDOM,infoPanel,newTwinDialog,floatInfoWindow,projectSettingDialog]

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
},{"../globalAppSettings.js":13,"../msalHelper":14,"../sharedSourceFiles/modelEditorDialog":19,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/newTwinDialog":22,"../sharedSourceFiles/projectSettingDialog":23,"./editLayoutDialog":5,"./floatInfoWindow":6,"./infoPanel":7,"./mainToolbar":8,"./mapDOM.js":9,"./startSelectionDialog":10,"./topologyDOM.js":11,"./twinsTree":12}],5:[function(require,module,exports){
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
        var oneLayoutObj=globalCache.layoutJSON[ind]
        if(oneLayoutObj.owner==globalCache.accountInfo.id)  this.switchLayoutSelector.addOption(ind)
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
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName },"withProjectID")
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/simpleConfirmDialog":24,"../sharedSourceFiles/simpleSelectMenu":25}],6:[function(require,module,exports){
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
},{"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18}],7:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")

class infoPanel extends baseInfoPanel {
    constructor() {
        super()
        this.continerDOM = $('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
        this.continerDOM.hide()
        this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

        this.closeButton1 = $('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
        this.closeButton2 = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
        this.continerDOM.children(':first').append(this.closeButton1, this.closeButton2)

        this.isMinimized = false;
        var buttonAnim = () => {
            if (!this.isMinimized) this.minimizeWindow()
            else this.expandWindow()
        }
        this.closeButton1.on("click", buttonAnim)
        this.closeButton2.on("click", buttonAnim)

        this.DOM = $('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        this.continerDOM.hover(() => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
        }, () => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        });
        this.continerDOM.append(this.DOM)
        $('body').append(this.continerDOM)

        this.drawButtons(null)
        this.selectedObjects = null;
    }

    minimizeWindow() {
        this.continerDOM.animate({
            right: "-250px",
            height: "50px"
        })
        this.isMinimized = true;
    }

    expandWindow() {
        this.continerDOM.animate({
            right: "0px",
            height: "70%"
        })
        this.isMinimized = false;
    }

    rxMessage(msgPayload) {
        if (msgPayload.message == "startSelectionDialog_closed") {
            if (!this.continerDOM.is(":visible")) {
                this.continerDOM.show()
                this.continerDOM.addClass("w3-animate-right")
            }
        } else if (msgPayload.message == "mapFlyingStart") {
            this.minimizeWindow()
        } else if (msgPayload.message == "mapFlyingEnd") {
            this.expandWindow()
        } else if (msgPayload.message == "mapSelectFeature") {
            if (msgPayload.DBTwin != null) {
                var twinID = msgPayload.DBTwin.id
                var adtTwin = globalCache.storedTwins[twinID]
                this.showInfoOfNodes([adtTwin])
            }
        } else if (msgPayload.message == "showInfoSelectedNodes" || msgPayload.message == "showInfoHoveredEle") {
            if (globalCache.showFloatInfoPanel && msgPayload.message == "showInfoHoveredEle") return; //the floating info window will show mouse over element information, do not change info panel content in this case
            this.showInfoOfNodes(msgPayload.info)
        }
    }

    showInfoOfNodes(arr) {
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

    getRelationShipEditableProperties(relationshipName, sourceModel) {
        if (!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
        return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
    }

    drawButtons(selectType) {
        var impBtn = $('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
        var actualImportTwinsBtn = $('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
        if (selectType != null) {
            var refreshBtn = $('<button class="w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
            var expBtn = $('<button class="w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')
            this.DOM.append(refreshBtn, expBtn, impBtn, actualImportTwinsBtn)
            refreshBtn.on("click", () => { this.refreshInfomation() })
            expBtn.on("click", () => {
                //find out the twins in selection and their connections (filter both src and target within the selected twins)
                //and export them
                this.exportSelected()
            })
        } else {
            this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a>")
            this.DOM.append(impBtn, actualImportTwinsBtn)
        }

        impBtn.on("click", () => { actualImportTwinsBtn.trigger('click'); })
        actualImportTwinsBtn.change(async (evt) => {
            var files = evt.target.files; // FileList object
            await this.readTwinsFilesContentAndImport(files)
            actualImportTwinsBtn.val("")
        })
        if (selectType == null) return;

        if (selectType == "singleRelationship") {
            var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
            this.DOM.append(delBtn)
            delBtn.on("click", () => { this.deleteSelected() })
        } else if (selectType == "singleNode" || selectType == "multiple") {
            var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
            var connectToBtn = $('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
            var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
            var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
            var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')

            this.DOM.append(delBtn, connectToBtn, connectFromBtn, showInboundBtn, showOutBoundBtn)

            showOutBoundBtn.on("click", () => { this.showOutBound() })
            showInboundBtn.on("click", () => { this.showInBound() })
            connectToBtn.on("click", () => { this.broadcastMessage({ "message": "connectTo" }) })
            connectFromBtn.on("click", () => { this.broadcastMessage({ "message": "connectFrom" }) })

            delBtn.on("click", () => { this.deleteSelected() })
        }

        var numOfNode = 0;
        var arr = this.selectedObjects;
        arr.forEach(element => {
            if (element['$dtId']) numOfNode++
        });
        if (numOfNode > 0) {
            var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
            var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
            var coseLayoutBtn = $('<button class="w3-button w3-border">COSE View</button>')
            var hideBtn = $('<button class="w3-button w3-border">Hide</button>')
            this.DOM.append(selectInboundBtn, selectOutBoundBtn, coseLayoutBtn, hideBtn)

            selectInboundBtn.on("click", () => { this.broadcastMessage({ "message": "addSelectInbound" }) })
            selectOutBoundBtn.on("click", () => { this.broadcastMessage({ "message": "addSelectOutbound" }) })
            coseLayoutBtn.on("click", () => { this.broadcastMessage({ "message": "COSESelectedNodes" }) })
            hideBtn.on("click", () => { this.broadcastMessage({ "message": "hideSelectedNodes" }) })
        }
        if (numOfNode > 1) {
            //some additional buttons when select multiple items
            this.drawAdvanceAlignmentButtons()
        }
    }

    async drawAdvanceAlignmentButtons() {
        var label = $("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>")
        this.DOM.append(label)
        var alignButtonsTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
        this.DOM.append(alignButtonsTable)
        var alignTopButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
        var alignLeftButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
        var alignRightButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
        var alignBottomButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
        alignButtonsTable.find("td").eq(1).append(alignTopButton)
        alignButtonsTable.find("td").eq(3).append(alignLeftButton)
        alignButtonsTable.find("td").eq(5).append(alignRightButton)
        alignButtonsTable.find("td").eq(7).append(alignBottomButton)


        var arrangeTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
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


    async exportSelected() {
        var arr = this.selectedObjects;
        if (arr.length == 0) return;
        var twinIDArr = []
        var twinToBeStored = []
        var twinIDs = {}
        arr.forEach(element => {
            if (element['$sourceId']) return
            twinIDArr.push(element['$dtId'])
            var anExpTwin = {}
            anExpTwin["$metadata"] = { "$model": element["$metadata"]["$model"] }
            for (var ind in element) {
                if (ind == "$metadata" || ind == "$etag") continue
                else anExpTwin[ind] = element[ind]
            }
            twinToBeStored.push(anExpTwin)
            twinIDs[element['$dtId']] = 1
        });
        var relationsToBeStored = []
        twinIDArr.forEach(oneID => {
            var relations = globalCache.storedOutboundRelationships[oneID]
            if (!relations) return;
            relations.forEach(oneRelation => {
                var targetID = oneRelation["$targetId"]
                if (twinIDs[targetID]) {
                    var obj = {}
                    for (var ind in oneRelation) {
                        if (ind == "$etag" || ind == "$relationshipId" || ind == "$sourceId" || ind == "sourceModel") continue
                        obj[ind] = oneRelation[ind]
                    }
                    var oneAction = {
                        "$srcId": oneID,
                        "$relationshipId": oneRelation["$relationshipId"],
                        "obj": obj
                    }
                    relationsToBeStored.push(oneAction)
                }
            })
        })
        var finalJSON = { "twins": twinToBeStored, "relations": relationsToBeStored }
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
        pom.attr('download', "exportTwinsData.json");
        pom[0].click()
    }

    async readOneFile(aFile) {
        return new Promise((resolve, reject) => {
            try {
                var reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result)
                };
                reader.readAsText(aFile);
            } catch (e) {
                reject(e)
            }
        })
    }

    async readTwinsFilesContentAndImport(files) {
        var importTwins = []
        var importRelations = []
        for (var i = 0, f; f = files[i]; i++) {
            // Only process json files.
            if (f.type != "application/json") continue;
            try {
                var str = await this.readOneFile(f)
                var obj = JSON.parse(str)
                if (obj.twins) importTwins = importTwins.concat(obj.twins)
                if (obj.relations) importRelations = importRelations.concat(obj.relations)
            } catch (err) {
                alert(err)
            }
        }

        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        var oldTwinID2NewID = {}
        importTwins.forEach(oneTwin => {
            var oldID = oneTwin["$dtId"]
            var newID = uuidv4();
            oldTwinID2NewID[oldID] = newID
            oneTwin["$dtId"] = newID
        })

        for (var i = importRelations.length - 1; i >= 0; i--) {
            var oneRel = importRelations[i]
            if (oldTwinID2NewID[oneRel["$srcId"]] == null || oldTwinID2NewID[oneRel["obj"]["$targetId"]] == null) {
                importRelations.splice(i, 1)
            } else {
                oneRel["$srcId"] = oldTwinID2NewID[oneRel["$srcId"]]
                oneRel["obj"]["$targetId"] = oldTwinID2NewID[oneRel["obj"]["$targetId"]]
                oneRel["$relationshipId"] = uuidv4();
            }
        }


        try {
            var re = await msalHelper.callAPI("digitaltwin/batchImportTwins", "POST", { "twins": JSON.stringify(importTwins) }, "withProjectID")
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
            return;
        }

        re.DBTwins = JSON.parse(re.DBTwins)
        re.ADTTwins = JSON.parse(re.ADTTwins)
        re.DBTwins.forEach(DBTwin => { globalCache.storeSingleDBTwin(DBTwin) })
        var adtTwins = []
        re.ADTTwins.forEach(ADTTwin => {
            globalCache.storeSingleADTTwin(ADTTwin)
            adtTwins.push(ADTTwin)
        })

        this.broadcastMessage({ "message": "addNewTwins", "twinsInfo": adtTwins })

        //continue to import relations
        try {
            var relationsImported = await msalHelper.callAPI("digitaltwin/createRelations", "POST", { actions: JSON.stringify(importRelations) })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
        globalCache.storeTwinRelationships_append(relationsImported)
        this.broadcastMessage({ "message": "drawAllRelations", info: relationsImported })

        var numOfTwins = adtTwins.length
        var numOfRelations = relationsImported.length
        var str = "Add " + numOfTwins + " node" + ((numOfTwins <= 1) ? "" : "s") + ` (from ${importTwins.length})`
        str += " and " + numOfRelations + " relationship" + ((numOfRelations <= 1) ? "" : "s") + ` (from ${importRelations.length})`
        var confirmDialogDiv = new simpleConfirmDialog()
        confirmDialogDiv.show(
            { width: "400px" },
            {
                title: "Import Result"
                , content: str
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

    async refreshInfomation() {
        var twinIDs = []
        this.selectedObjects.forEach(oneItem => { if (oneItem['$dtId']) twinIDs.push(oneItem['$dtId']) })
        try {
            var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
            twinsdata.forEach(oneRe => {
                var twinID = oneRe['$dtId']
                if (globalCache.storedTwins[twinID] != null) {
                    for (var ind in oneRe) globalCache.storeSingleADTTwin(oneRe[ind])
                }
            })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }

        while (twinIDs.length > 0) {
            var smallArr = twinIDs.splice(0, 100);
            try {
                var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
                if (data == "") continue;
                globalCache.storeTwinRelationships(data) //store them in global available array
                this.broadcastMessage({ "message": "drawAllRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
        //redraw infopanel if needed
        if (this.selectedObjects.length == 1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })

    }


    async deleteSelected() {
        var arr = this.selectedObjects;
        if (arr.length == 0) return;
        var relationsArr = []
        var twinIDArr = []
        var twinIDs = {}
        arr.forEach(element => {
            if (element['$sourceId']) relationsArr.push(element);
            else {
                twinIDArr.push(element['$dtId'])
                twinIDs[element['$dtId']] = 1
            }
        });
        for (var i = relationsArr.length - 1; i >= 0; i--) { //clear those relationships that are going to be deleted after twins deleting
            var srcId = relationsArr[i]['$sourceId']
            var targetId = relationsArr[i]['$targetId']
            if (twinIDs[srcId] != null || twinIDs[targetId] != null) {
                relationsArr.splice(i, 1)
            }
        }
        var confirmDialogDiv = new simpleConfirmDialog()
        var dialogStr = ""
        var twinNumber = twinIDArr.length;
        var relationsNumber = relationsArr.length;
        if (twinNumber > 0) dialogStr = twinNumber + " twin" + ((twinNumber > 1) ? "s" : "") + " (with connected relations)"
        if (twinNumber > 0 && relationsNumber > 0) dialogStr += " and additional "
        if (relationsNumber > 0) dialogStr += relationsNumber + " relation" + ((relationsNumber > 1) ? "s" : "")
        dialogStr += " will be deleted. Please confirm"
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Confirm"
                , content: dialogStr
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

    async deleteTwins(twinIDArr) {
        var ioTDevices = []
        twinIDArr.forEach(oneTwinID => {
            var dbTwinInfo = globalCache.getSingleDBTwinByID(oneTwinID)
            if (dbTwinInfo.IoTDeviceID != null && dbTwinInfo.IoTDeviceID != "") {
                ioTDevices.push(dbTwinInfo.IoTDeviceID)
            }
        })
        if (ioTDevices.length > 0) {
            msalHelper.callAPI("devicemanagement/unregisterIoTDevices", "POST", { arr: ioTDevices })
        }


        while (twinIDArr.length > 0) {
            var smallArr = twinIDArr.splice(0, 100);

            try {
                var result = await msalHelper.callAPI("digitaltwin/deleteTwins", "POST", { arr: smallArr }, "withProjectID")
                result.forEach((oneID) => {
                    delete globalCache.storedTwins[oneID]
                    delete globalCache.storedOutboundRelationships[oneID]
                });
                this.broadcastMessage({ "message": "twinsDeleted", twinIDArr: result })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
    }

    async deleteRelations(relationsArr) {
        var arr = []
        relationsArr.forEach(oneRelation => {
            arr.push({ srcID: oneRelation['$sourceId'], relID: oneRelation['$relationshipId'] })
        })
        try {
            var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", { "relations": arr })
            globalCache.storeTwinRelationships_remove(data)
            this.broadcastMessage({ "message": "relationsDeleted", "relations": data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }

    async showOutBound() {
        var arr = this.selectedObjects;
        var twinIDArr = []
        arr.forEach(element => {
            if (element['$sourceId']) return;
            twinIDArr.push(element['$dtId'])
        });

        while (twinIDArr.length > 0) {
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

            try {
                var data = await msalHelper.callAPI("digitaltwin/queryOutBound", "POST", { arr: smallArr, "knownTargets": knownTargetTwins })
                //new twin's relationship should be stored as well
                globalCache.storeTwinRelationships(data.newTwinRelations)
                data.childTwinsAndRelations.forEach(oneSet => {
                    for (var ind in oneSet.childTwins) {
                        var oneTwin = oneSet.childTwins[ind]
                        globalCache.storeSingleADTTwin(oneTwin)
                    }
                })
                this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
    }

    async showInBound() {
        var arr = this.selectedObjects;
        var twinIDArr = []
        arr.forEach(element => {
            if (element['$sourceId']) return;
            twinIDArr.push(element['$dtId'])
        });

        while (twinIDArr.length > 0) {
            var smallArr = twinIDArr.splice(0, 100);
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

            try {
                var data = await msalHelper.callAPI("digitaltwin/queryInBound", "POST", { arr: smallArr, "knownSources": knownSourceTwins })
                //new twin's relationship should be stored as well
                globalCache.storeTwinRelationships(data.newTwinRelations)
                data.childTwinsAndRelations.forEach(oneSet => {
                    for (var ind in oneSet.childTwins) {
                        var oneTwin = oneSet.childTwins[ind]
                        globalCache.storeSingleADTTwin(oneTwin)
                    }
                })
                this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
    }

    drawMultipleObj() {
        var numOfEdge = 0;
        var numOfNode = 0;
        var arr = this.selectedObjects;
        if (arr == null) return;
        arr.forEach(element => {
            if (element['$sourceId']) numOfEdge++
            else numOfNode++
        });
        var textDiv = $("<label style='display:block;margin-top:10px'></label>")
        textDiv.text(numOfNode + " node" + ((numOfNode <= 1) ? "" : "s") + ", " + numOfEdge + " relationship" + ((numOfEdge <= 1) ? "" : "s"))
        this.DOM.append(textDiv)
    }

    async editDTProperty(originElementInfo, path, newVal, dataType) {
        if (["double", "boolean", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)

        //{ "op": "add", "path": "/x", "value": 30 }
        if (path.length == 1) {
            var str = ""
            path.forEach(segment => { str += "/" + segment })
            var jsonPatch = [{ "op": "add", "path": str, "value": newVal }]
        } else {
            //it is a property inside a object type of root property,update the whole root property
            var rootProperty = path[0]
            var patchValue = originElementInfo[rootProperty]
            if (patchValue == null) patchValue = {}
            else patchValue = JSON.parse(JSON.stringify(patchValue)) //make a copy
            this.updateOriginObjectValue(patchValue, path.slice(1), newVal)

            var jsonPatch = [{ "op": "add", "path": "/" + rootProperty, "value": patchValue }]
        }

        if (originElementInfo["$dtId"]) { //edit a node property
            var twinID = originElementInfo["$dtId"]
            var payLoad = { "jsonPatch": JSON.stringify(jsonPatch), "twinID": twinID }
        } else if (originElementInfo["$relationshipId"]) { //edit a relationship property
            var twinID = originElementInfo["$sourceId"]
            var relationshipID = originElementInfo["$relationshipId"]
            var payLoad = { "jsonPatch": JSON.stringify(jsonPatch), "twinID": twinID, "relationshipID": relationshipID }
        }


        try {
            await msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
            this.updateOriginObjectValue(originElementInfo, path, newVal)
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }

    }

    updateOriginObjectValue(nodeInfo, pathArr, newVal) {
        if (pathArr.length == 0) return;
        var theJson = nodeInfo
        for (var i = 0; i < pathArr.length; i++) {
            var key = pathArr[i]

            if (i == pathArr.length - 1) {
                theJson[key] = newVal
                break
            }
            if (theJson[key] == null) theJson[key] = {}
            theJson = theJson[key]
        }
        return
    }
}

module.exports = new infoPanel();
},{"../msalHelper":14,"../sharedSourceFiles/baseInfoPanel":15,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/simpleConfirmDialog":24}],8:[function(require,module,exports){
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

mainToolbar.prototype.updateLayoutSelector = function (chooseLayoutName) {
    var curSelect=chooseLayoutName||this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in globalCache.layoutJSON) {
        var oneLayoutObj=globalCache.layoutJSON[ind]
        if(oneLayoutObj.owner==globalCache.accountInfo.id) this.switchLayoutSelector.addOption(ind)
    }

    if(curSelect!=null){
        if(this.switchLayoutSelector.findOption(curSelect)==null) this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",curSelect)
    }
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector(msgPayload.selectLayout)
    }else if(msgPayload.message=="popupLayoutEditing"){
        editLayoutDialog.popup()
    }
}

module.exports = new mainToolbar();
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/moduleSwitchDialog":21,"../sharedSourceFiles/projectSettingDialog":23,"../sharedSourceFiles/simpleSelectMenu":25,"./editLayoutDialog":5,"./startSelectionDialog":10}],9:[function(require,module,exports){
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
},{"../sharedSourceFiles/globalCache":17}],10:[function(require,module,exports){
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

startSelectionDialog.prototype.chooseProject = async function (selectedProjectID) {
    this.buttonHolder.empty()

    var projectInfo=globalCache.findProjectInfo(selectedProjectID)
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

    var projectOwner=projectInfo.owner
    try {
        var res = await msalHelper.callAPI("digitaltwin/fetchProjectModelsData", "POST", null, "withProjectID")
        globalCache.storeProjectModelsData(res.DBModels, res.adtModels)
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(res.adtModels)
        modelAnalyzer.analyze();
        var res = await msalHelper.callAPI("digitaltwin/fetchProjectTwinsAndVisualData", "POST", {"projectOwner":projectOwner}, "withProjectID")
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
        this.broadcastMessage({ "message": "projectIsChanged"})
    }

    var selectedTwins=this.getSelectedTwins()
    var twinIDs=[]
    selectedTwins.forEach(aTwin=>{twinIDs.push(aTwin["id"])})

    var modelIDs=[]
    globalCache.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})

    this.broadcastMessage({ "message": "startSelection_"+action, "twinIDs": twinIDs,"modelIDs":modelIDs })
    this.broadcastMessage({ "message": "visualDefinitionRefresh"})
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    if(projectInfo.defaultLayout && projectInfo.defaultLayout!="") globalCache.currentLayoutName=projectInfo.defaultLayout
    
    this.broadcastMessage({ "message": "layoutsUpdated","selectLayout":projectInfo.defaultLayout})
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
},{"../msalHelper":14,"../sharedSourceFiles/editProjectDialog":16,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/simpleSelectMenu":25}],11:[function(require,module,exports){
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
    
    return eles
}

topologyDOM.prototype.applyCurrentLayoutWithNoAnimtaion = function () {
    var layoutName = globalCache.currentLayoutName
    if (layoutName != null) {
        var layoutDetail = globalCache.layoutJSON[layoutName].detail
        if (layoutDetail) {
            this.redrawBasedOnLayoutDetail(layoutDetail, null, "noAnimation")
        }
    }
    this.core.center(this.core.nodes())
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
    var visualJson=globalCache.visualDefinition["default"].detail
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
        this.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="visualDefinitionRefresh") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.reviewStoredRelationshipsToDraw()
        this.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            var layoutDetail=null
            if(globalCache.currentLayoutName!=null) layoutDetail = globalCache.layoutJSON[globalCache.currentLayoutName].detail
            if(layoutDetail==null)  this.noPosition_cose()
            else this.applyCurrentLayoutWithNoAnimtaion()
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
    else if (msgPayload.message == "layoutChange") this.chooseLayout(globalCache.currentLayoutName)
    else if(msgPayload.message=="alignSelectedNode") this.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.dimensionSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="viewTypeChange"){
        if(msgPayload.viewType=="Topology") this.showSelf()
        else this.hideSelf()
    }
}

topologyDOM.prototype.chooseLayout = function (layoutName) {
    if (layoutName == "[NA]") {
        //select all visible nodes and do a COSE layout, clean all bend edge line as well
        this.core.edges().forEach(oneEdge => {
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights", [])
            oneEdge.data("cyedgebendeditingDistances", [])
            oneEdge.data("cyedgecontroleditingWeights", [])
            oneEdge.data("cyedgecontroleditingDistances", [])
        })
        this.noPosition_cose()
    } else if (layoutName != null) {
        var layoutDetail = globalCache.layoutJSON[layoutName].detail
        if (layoutDetail) {
            this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
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

topologyDOM.prototype.redrawBasedOnLayoutDetail = function (layoutDetail,onlyAdjustNodePosition,noAnimation) {
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
        animate: ((noAnimation)?false:true),
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
    var layoutDict=globalCache.layoutJSON[layoutName].detail
    if(!layoutDict){
        layoutDict={}
        globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,layoutName,false)
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/simpleConfirmDialog":24,"../sharedSourceFiles/simpleSelectMenu":25}],12:[function(require,module,exports){
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
        if(globalCache.visualDefinition["default"].detail[modelClass]){
            var visualJson =globalCache.visualDefinition["default"].detail[modelClass]
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/newTwinDialog":22,"../sharedSourceFiles/simpleTree":26}],13:[function(require,module,exports){
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

},{"./globalAppSettings":13,"./sharedSourceFiles/globalCache":17,"buffer":2}],15:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")

class baseInfoPanel {
    drawEditable(parent,jsonInfo,originElementInfo,pathArr){
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


    searchValue(originElementInfo,pathArr){
        if(pathArr.length==0) return null;
        var theJson=originElementInfo
        for(var i=0;i<pathArr.length;i++){
            var key=pathArr[i]
            theJson=theJson[key]
            if(theJson==null) return null;
        }
        return theJson //it should be the final value
    }

    drawDropdownOption(contentDOM,newPath,valueArr,originElementInfo){
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

    drawStaticInfo(parent,jsonInfo,paddingTop,fontSize,fontColor){
        fontColor=fontColor||"black"
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
            contentDOM.css({"fontSize":fontSize,"color":fontColor})
            keyDiv.append(contentDOM)
        }
    }
}

module.exports = baseInfoPanel;
},{"./simpleSelectMenu":25}],16:[function(require,module,exports){
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

module.exports = new editProjectDialog();
},{"../msalHelper":14,"./globalCache":17,"./simpleConfirmDialog":24}],17:[function(require,module,exports){
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
    this.visualDefinition={"default":{"detail":{}}}

    this.initStoredInformtion()
}


globalCache.prototype.initStoredInformtion = function () {
    this.storedOutboundRelationships = {} 
    //stored data, seperately from ADT service and from cosmosDB service
    this.currentLayoutName=null   
}

globalCache.prototype.findProjectInfo=function(projectID){
    var joinedProjects=this.accountInfo.joinedProjects
    for(var i=0;i<joinedProjects.length;i++){
        var oneProject=joinedProjects[i]
        if(oneProject.id==projectID) return oneProject
    }
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
    this.visualDefinition["default"]={"detail":{}}

    resArr.forEach(element => {
        if(element.type=="visualSchema") {
            //TODO: now there is only one "default" schema to use,consider allow creating more user define visual schema
            //TODO: only choose the schema belongs to self
            this.recordSingleVisualSchema(element.detail,element.accountID,element.name,element.isShared)
        }else if(element.type=="Topology") {
            this.recordSingleLayout(element.detail,element.accountID,element.name,element.isShared)
        }else if(element.type=="DTTwin") dbtwins.push(element)
    });
    this.storeDBTwinsArr(dbtwins)
}

globalCache.prototype.recordSingleVisualSchema=function(detail,accountID,oname,isShared){
    if (accountID == this.accountInfo.id) var vsName = oname
    else vsName = oname + `(from ${accountID})`
    var dict = { "detail": detail, "isShared": isShared, "owner": accountID, "oname": oname}
    this.visualDefinition[vsName]=dict
}

globalCache.prototype.recordSingleLayout=function(detail,accountID,oname,isShared){
    if (accountID == this.accountInfo.id) var layoutName = oname
    else layoutName = oname + `(from ${accountID})`
    var dict = { "detail": detail, "isShared": isShared, "owner": accountID, "name": layoutName, "oname":oname }
    this.layoutJSON[layoutName] = dict
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
},{}],18:[function(require,module,exports){
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
},{"../msalHelper":14}],19:[function(require,module,exports){
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
},{"../msalHelper":14,"./modelAnalyzer":18,"./simpleConfirmDialog":24,"./simpleSelectMenu":25}],20:[function(require,module,exports){
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

        var visualJson = globalCache.visualDefinition["default"].detail
        if (!visualJson[modelID]) visualJson[modelID] = {}
        visualJson[modelID].avarta = dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "avarta": dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", () => {
        var visualJson = globalCache.visualDefinition["default"].detail
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
        if (globalCache.visualDefinition["default"].detail[modelID]) {
            delete globalCache.visualDefinition["default"].detail[modelID]
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
    var visualJson=globalCache.visualDefinition["default"].detail
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
    var visualJson=globalCache.visualDefinition["default"].detail
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
        var visualJson=globalCache.visualDefinition["default"].detail

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
        var visualJson = globalCache.visualDefinition["default"].detail

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
        var visualJson = globalCache.visualDefinition["default"].detail

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
        await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(globalCache.visualDefinition["default"].detail)},"withProjectID")
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
            if (globalCache.visualDefinition["default"].detail[modelClass]) {
                var visualJson = globalCache.visualDefinition["default"].detail[modelClass]
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
},{"../msalHelper":14,"./globalCache":17,"./modelAnalyzer":18,"./modelEditorDialog":19,"./simpleConfirmDialog":24,"./simpleTree":26}],21:[function(require,module,exports){
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
},{"../globalAppSettings":13,"../msalHelper":14}],22:[function(require,module,exports){
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
},{"../msalHelper":14,"./globalCache":17,"./modelAnalyzer":18,"./simpleSelectMenu":25}],23:[function(require,module,exports){
const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function projectSettingDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

projectSettingDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        this.contentInitialized=false
        this.DOM.empty()
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
    this.visualSchemaContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.DOM.append(this.layoutContentDiv,this.visualSchemaContentDiv)
    this.fillLayoutDivContent()
    this.fillVisualSchemaContent()

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
    var showOtherUserLayoutText = $('<label style="padding:2px 8px;">Show shared layouts from other users</label>')
    this.layoutContentDiv.append(showOtherUserLayoutCheck, showOtherUserLayoutText)
    if(this.showSharedLayouts) showOtherUserLayoutCheck.prop( "checked", true );
    showOtherUserLayoutCheck.on("change",()=>{
        this.showSharedLayouts=showOtherUserLayoutCheck.prop('checked')
        this.refillLayouts()
    })


    var layoutsDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.layoutContentDiv.append(layoutsDiv)
    this.layoutsDiv=layoutsDiv

    this.refillLayouts()
}


projectSettingDialog.prototype.fillVisualSchemaContent= function () {
    var shareSelfVisualSchemaCheck = $('<input class="w3-check" style="width:20px;margin-left:10px;margin-right:10px" type="checkbox">')
    var shareSelfVisualSchemaText = $('<label style="padding:2px 8px;">Share my own visual legend</label>')
    this.visualSchemaContentDiv.append(shareSelfVisualSchemaCheck, shareSelfVisualSchemaText)

    if(globalCache.visualDefinition["default"].isShared) shareSelfVisualSchemaCheck.prop( "checked", true );
    
    shareSelfVisualSchemaCheck.on("change", async () => {
        globalCache.visualDefinition["default"].isShared=shareSelfVisualSchemaCheck.prop('checked')

        var visualSchemaName = "default" //fixed in current version, there is only "default" schema for each user
        try {
            await msalHelper.callAPI("digitaltwin/setVisualSchemaSharedFlag", "POST", { "visualSchema": "default", "isShared": shareSelfVisualSchemaCheck.prop('checked') }, "withProjectID")
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    })

    var visualSchemaDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.visualSchemaContentDiv.append(visualSchemaDiv)
    this.visualSchemaDiv=visualSchemaDiv

    this.refillVisualSchemas()
}

projectSettingDialog.prototype.refillVisualSchemas=function(){
    this.visualSchemaDiv.empty()
    var selfSchema
    for (var ind in globalCache.visualDefinition) {
        var oneSchema=globalCache.visualDefinition[ind]
        if(oneSchema.owner!=null && oneSchema.owner!=globalCache.accountInfo.id) this.addOneVisualSchema(oneSchema,this.visualSchemaDiv)
        else selfSchema=oneSchema
    }
    this.addOneVisualSchema(selfSchema,this.visualSchemaDiv)
}

projectSettingDialog.prototype.addOneVisualSchema=function(oneSchemaObj,parentDiv){
    var owner= oneSchemaObj.owner || globalCache.accountInfo.id
    
    var oneSchemaRow=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneSchemaRow)
    var lblStr=(owner==globalCache.accountInfo.id)?"Self":"Shared by "+owner
    //var nameLbl=$('<a style="text-align:left;color:grey;margin:5px 0px;display:block">'+lblStr+'</a>')
    var titleRow=$('<a href="#" class="w3-bar w3-text-grey"  ></a>')
    oneSchemaRow.append(titleRow)
    var nameLbl=$('<a class="w3-bar-item w3-button" >'+lblStr+'</a>')
    var copyBtn=$('<button class="w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
    titleRow.append(nameLbl)
    if(owner!=globalCache.accountInfo.id) titleRow.append(copyBtn)

    var detail=oneSchemaObj.detail

    copyBtn.on("click", async ()=>{
        //replace self visual schema
        globalCache.visualDefinition["default"].detail=JSON.parse(JSON.stringify(detail))
        this.refillVisualSchemas()
        try{
            await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(detail)},"withProjectID")
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    })

    for(var modelID in detail){
        var visualJson=detail[modelID]
        var avarta = null
        var dimension = 20;
        var colorCode = visualJson.color || "darkGray"
        var shape = visualJson.shape || "ellipse"
        var avarta = visualJson.avarta
        if (visualJson.dimensionRatio) dimension *= parseFloat(visualJson.dimensionRatio)
        var iconDOM = $("<div style='width:" + dimension + "px;height:" + dimension + "px;float:left;position:relative'></div>")
        var imgSrc = encodeURIComponent(this.shapeSvg(shape, colorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8," + imgSrc + "'></img>"))
        if (avarta) {
            var avartaimg = $("<img style='position:absolute;left:0px;width:60%;margin:20%' src='" + avarta + "'></img>")
            iconDOM.append(avartaimg)
        }
        oneSchemaRow.append(iconDOM)
    }

}

projectSettingDialog.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}

projectSettingDialog.prototype.refillLayouts=function(){
    this.layoutsDiv.empty()
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    var defaultLayoutName=projectInfo.defaultLayout

    if(this.showSharedLayouts){
        for (var ind in globalCache.layoutJSON) {
            var oneLayoutObj=globalCache.layoutJSON[ind]
            if(oneLayoutObj.owner!=globalCache.accountInfo.id) {
                this.addOneLayoutBar(oneLayoutObj,this.layoutsDiv,defaultLayoutName)
            }
        }
    }
    for (var ind in globalCache.layoutJSON) {
        var oneLayoutObj=globalCache.layoutJSON[ind]
        if(oneLayoutObj.owner!=globalCache.accountInfo.id) continue
        this.addOneLayoutBar(oneLayoutObj,this.layoutsDiv,defaultLayoutName)
    }
    
}

projectSettingDialog.prototype.addOneLayoutBar=function(oneLayoutObj,parentDiv,defaultLayoutName){
    var layoutName = oneLayoutObj.name
    var sharedFlag = oneLayoutObj.isShared

    var selfLayout=(oneLayoutObj.owner==globalCache.accountInfo.id)

    var oneLayout=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneLayout)

    var nameLbl=$('<a class="w3-bar-item w3-button" href="#">'+layoutName+'</a>')
    var defaultLbl=$("<a class='w3-lime w3-bar-item' style='font-size:9px;padding:1px 2px;margin-top:9px;border-radius: 2px;'>default</a>")
    if(layoutName!=defaultLayoutName) defaultLbl.hide()
    
    oneLayout.data("layoutObj",oneLayoutObj)

    oneLayout.data("defaultLbl",defaultLbl)
    oneLayout.append(nameLbl,defaultLbl)

    if(selfLayout){
        var str=(sharedFlag)?"Shared":"Share"
        var shareBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber">'+str+'</button>')
        oneLayout.data("shareBtn",shareBtn)
        
        var deleteBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber"><i class="fa fa-trash fa-lg"></i></button>')
        oneLayout.append(shareBtn,deleteBtn)
        if(!sharedFlag) shareBtn.hide()
        deleteBtn.hide()
    
        oneLayout.hover(()=>{
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.show()
            deleteBtn.show()
        },()=>{
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.hide()
            deleteBtn.hide()
        })
        oneLayout.on("click",()=>{
            if(layoutName!=defaultLayoutName) this.setAsDefaultLayout(oneLayout)
            else this.setAsDefaultLayout()
        })
        deleteBtn.on("click",()=>{
            this.deleteLayout(oneLayout)
            return false
        })
        shareBtn.on("click",()=>{
            this.clickShareLayoutBtn(oneLayout)
            return false
        })    
    }else{
        oneLayout.addClass("w3-gray","w3-hover-gray")
        var copyBtn=$('<button class="w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
        oneLayout.append(copyBtn)
        copyBtn.on("click",()=>{
            this.copyLayout(oneLayout.data("layoutObj"))
            return false
        }) 
    }    
}

projectSettingDialog.prototype.copyLayout=async function(dict){
    var layoutDict=dict.detail
    if(layoutDict["edges"]==null) layoutDict["edges"]={}    
    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][dict.oname]=JSON.stringify(layoutDict)  

    globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,dict.oname,false)
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj,"withProjectID")
        this.broadcastMessage({ "message": "layoutsUpdated"})
        this.refillLayouts()
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

projectSettingDialog.prototype.clickShareLayoutBtn=async function(oneLayoutDOM){
    var isShared=oneLayoutDOM.data("layoutObj").isShared
    var theBtn=oneLayoutDOM.data("shareBtn")
    isShared=!isShared
    oneLayoutDOM.data("layoutObj").isShared=isShared
    if(!isShared) theBtn.text("Share")
    else theBtn.text("Shared")
    
    var layoutName=oneLayoutDOM.data("layoutObj").name 
    try {
        await msalHelper.callAPI("digitaltwin/setLayoutSharedFlag", "POST", {"layout":layoutName,"isShared":isShared },"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    } 
}


projectSettingDialog.prototype.deleteLayout=async function(oneLayoutDOM){
    var layoutName=oneLayoutDOM.data("layoutObj").name 
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
                        oneLayoutDOM.remove()
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName },"withProjectID")
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

projectSettingDialog.prototype.setAsDefaultLayout=async function(oneLayoutDOM){
    this.layoutsDiv.children('a').each((index,aLayout)=>{
        var defaultLbl= $(aLayout).data("defaultLbl")
        defaultLbl.hide()
    })

    if(oneLayoutDOM==null){ //remove default layout
        var layoutName=""
    }else{
        var defaultLbl=oneLayoutDOM.data("defaultLbl")
        defaultLbl.show()
        layoutName=oneLayoutDOM.data("layoutObj").name 
    }
       
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    projectInfo.defaultLayout=layoutName
    //update database
    try {
        await msalHelper.callAPI("accountManagement/setProjectDefaultLayout", "POST", {"defaultLayout":layoutName },"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    } 
}

module.exports = new projectSettingDialog();
},{"../msalHelper":14,"./globalCache":17,"./simpleConfirmDialog":24}],24:[function(require,module,exports){
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
},{}],25:[function(require,module,exports){
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
},{}],26:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vQXBwRGF0YS9Sb2FtaW5nL25wbS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9mbG9hdEluZm9XaW5kb3cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2luZm9QYW5lbC5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbWFpblRvb2xiYXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21hcERPTS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvc3RhcnRTZWxlY3Rpb25EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3RvcG9sb2d5RE9NLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS90d2luc1RyZWUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tc2FsSGVscGVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9iYXNlSW5mb1BhbmVsLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9lZGl0UHJvamVjdERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvcHJvamVjdFNldHRpbmdEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVRyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNqdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0dUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0ckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6bkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1VkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0J1xuXG5leHBvcnRzLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5leHBvcnRzLnRvQnl0ZUFycmF5ID0gdG9CeXRlQXJyYXlcbmV4cG9ydHMuZnJvbUJ5dGVBcnJheSA9IGZyb21CeXRlQXJyYXlcblxudmFyIGxvb2t1cCA9IFtdXG52YXIgcmV2TG9va3VwID0gW11cbnZhciBBcnIgPSB0eXBlb2YgVWludDhBcnJheSAhPT0gJ3VuZGVmaW5lZCcgPyBVaW50OEFycmF5IDogQXJyYXlcblxudmFyIGNvZGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLydcbmZvciAodmFyIGkgPSAwLCBsZW4gPSBjb2RlLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gIGxvb2t1cFtpXSA9IGNvZGVbaV1cbiAgcmV2TG9va3VwW2NvZGUuY2hhckNvZGVBdChpKV0gPSBpXG59XG5cbi8vIFN1cHBvcnQgZGVjb2RpbmcgVVJMLXNhZmUgYmFzZTY0IHN0cmluZ3MsIGFzIE5vZGUuanMgZG9lcy5cbi8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQmFzZTY0I1VSTF9hcHBsaWNhdGlvbnNcbnJldkxvb2t1cFsnLScuY2hhckNvZGVBdCgwKV0gPSA2MlxucmV2TG9va3VwWydfJy5jaGFyQ29kZUF0KDApXSA9IDYzXG5cbmZ1bmN0aW9uIGdldExlbnMgKGI2NCkge1xuICB2YXIgbGVuID0gYjY0Lmxlbmd0aFxuXG4gIGlmIChsZW4gJSA0ID4gMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzdHJpbmcuIExlbmd0aCBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNCcpXG4gIH1cblxuICAvLyBUcmltIG9mZiBleHRyYSBieXRlcyBhZnRlciBwbGFjZWhvbGRlciBieXRlcyBhcmUgZm91bmRcbiAgLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vYmVhdGdhbW1pdC9iYXNlNjQtanMvaXNzdWVzLzQyXG4gIHZhciB2YWxpZExlbiA9IGI2NC5pbmRleE9mKCc9JylcbiAgaWYgKHZhbGlkTGVuID09PSAtMSkgdmFsaWRMZW4gPSBsZW5cblxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gdmFsaWRMZW4gPT09IGxlblxuICAgID8gMFxuICAgIDogNCAtICh2YWxpZExlbiAlIDQpXG5cbiAgcmV0dXJuIFt2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuXVxufVxuXG4vLyBiYXNlNjQgaXMgNC8zICsgdXAgdG8gdHdvIGNoYXJhY3RlcnMgb2YgdGhlIG9yaWdpbmFsIGRhdGFcbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKGI2NCkge1xuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiBfYnl0ZUxlbmd0aCAoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSB7XG4gIHJldHVybiAoKHZhbGlkTGVuICsgcGxhY2VIb2xkZXJzTGVuKSAqIDMgLyA0KSAtIHBsYWNlSG9sZGVyc0xlblxufVxuXG5mdW5jdGlvbiB0b0J5dGVBcnJheSAoYjY0KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuXG4gIHZhciBhcnIgPSBuZXcgQXJyKF9ieXRlTGVuZ3RoKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikpXG5cbiAgdmFyIGN1ckJ5dGUgPSAwXG5cbiAgLy8gaWYgdGhlcmUgYXJlIHBsYWNlaG9sZGVycywgb25seSBnZXQgdXAgdG8gdGhlIGxhc3QgY29tcGxldGUgNCBjaGFyc1xuICB2YXIgbGVuID0gcGxhY2VIb2xkZXJzTGVuID4gMFxuICAgID8gdmFsaWRMZW4gLSA0XG4gICAgOiB2YWxpZExlblxuXG4gIHZhciBpXG4gIGZvciAoaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxOCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDEyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPDwgNikgfFxuICAgICAgcmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAzKV1cbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gMTYpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDIpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldID4+IDQpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAxKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDEwKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgNCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildID4+IDIpXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIGFyclxufVxuXG5mdW5jdGlvbiB0cmlwbGV0VG9CYXNlNjQgKG51bSkge1xuICByZXR1cm4gbG9va3VwW251bSA+PiAxOCAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDEyICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gNiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtICYgMHgzRl1cbn1cblxuZnVuY3Rpb24gZW5jb2RlQ2h1bmsgKHVpbnQ4LCBzdGFydCwgZW5kKSB7XG4gIHZhciB0bXBcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgaSArPSAzKSB7XG4gICAgdG1wID1cbiAgICAgICgodWludDhbaV0gPDwgMTYpICYgMHhGRjAwMDApICtcbiAgICAgICgodWludDhbaSArIDFdIDw8IDgpICYgMHhGRjAwKSArXG4gICAgICAodWludDhbaSArIDJdICYgMHhGRilcbiAgICBvdXRwdXQucHVzaCh0cmlwbGV0VG9CYXNlNjQodG1wKSlcbiAgfVxuICByZXR1cm4gb3V0cHV0LmpvaW4oJycpXG59XG5cbmZ1bmN0aW9uIGZyb21CeXRlQXJyYXkgKHVpbnQ4KSB7XG4gIHZhciB0bXBcbiAgdmFyIGxlbiA9IHVpbnQ4Lmxlbmd0aFxuICB2YXIgZXh0cmFCeXRlcyA9IGxlbiAlIDMgLy8gaWYgd2UgaGF2ZSAxIGJ5dGUgbGVmdCwgcGFkIDIgYnl0ZXNcbiAgdmFyIHBhcnRzID0gW11cbiAgdmFyIG1heENodW5rTGVuZ3RoID0gMTYzODMgLy8gbXVzdCBiZSBtdWx0aXBsZSBvZiAzXG5cbiAgLy8gZ28gdGhyb3VnaCB0aGUgYXJyYXkgZXZlcnkgdGhyZWUgYnl0ZXMsIHdlJ2xsIGRlYWwgd2l0aCB0cmFpbGluZyBzdHVmZiBsYXRlclxuICBmb3IgKHZhciBpID0gMCwgbGVuMiA9IGxlbiAtIGV4dHJhQnl0ZXM7IGkgPCBsZW4yOyBpICs9IG1heENodW5rTGVuZ3RoKSB7XG4gICAgcGFydHMucHVzaChlbmNvZGVDaHVuayh1aW50OCwgaSwgKGkgKyBtYXhDaHVua0xlbmd0aCkgPiBsZW4yID8gbGVuMiA6IChpICsgbWF4Q2h1bmtMZW5ndGgpKSlcbiAgfVxuXG4gIC8vIHBhZCB0aGUgZW5kIHdpdGggemVyb3MsIGJ1dCBtYWtlIHN1cmUgdG8gbm90IGZvcmdldCB0aGUgZXh0cmEgYnl0ZXNcbiAgaWYgKGV4dHJhQnl0ZXMgPT09IDEpIHtcbiAgICB0bXAgPSB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDJdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDQpICYgMHgzRl0gK1xuICAgICAgJz09J1xuICAgIClcbiAgfSBlbHNlIGlmIChleHRyYUJ5dGVzID09PSAyKSB7XG4gICAgdG1wID0gKHVpbnQ4W2xlbiAtIDJdIDw8IDgpICsgdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAxMF0gK1xuICAgICAgbG9va3VwWyh0bXAgPj4gNCkgJiAweDNGXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCAyKSAmIDB4M0ZdICtcbiAgICAgICc9J1xuICAgIClcbiAgfVxuXG4gIHJldHVybiBwYXJ0cy5qb2luKCcnKVxufVxuIiwiLyohXG4gKiBUaGUgYnVmZmVyIG1vZHVsZSBmcm9tIG5vZGUuanMsIGZvciB0aGUgYnJvd3Nlci5cbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1wcm90byAqL1xuXG4ndXNlIHN0cmljdCdcblxudmFyIGJhc2U2NCA9IHJlcXVpcmUoJ2Jhc2U2NC1qcycpXG52YXIgaWVlZTc1NCA9IHJlcXVpcmUoJ2llZWU3NTQnKVxuXG5leHBvcnRzLkJ1ZmZlciA9IEJ1ZmZlclxuZXhwb3J0cy5TbG93QnVmZmVyID0gU2xvd0J1ZmZlclxuZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFUyA9IDUwXG5cbnZhciBLX01BWF9MRU5HVEggPSAweDdmZmZmZmZmXG5leHBvcnRzLmtNYXhMZW5ndGggPSBLX01BWF9MRU5HVEhcblxuLyoqXG4gKiBJZiBgQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlRgOlxuICogICA9PT0gdHJ1ZSAgICBVc2UgVWludDhBcnJheSBpbXBsZW1lbnRhdGlvbiAoZmFzdGVzdClcbiAqICAgPT09IGZhbHNlICAgUHJpbnQgd2FybmluZyBhbmQgcmVjb21tZW5kIHVzaW5nIGBidWZmZXJgIHY0Lnggd2hpY2ggaGFzIGFuIE9iamVjdFxuICogICAgICAgICAgICAgICBpbXBsZW1lbnRhdGlvbiAobW9zdCBjb21wYXRpYmxlLCBldmVuIElFNilcbiAqXG4gKiBCcm93c2VycyB0aGF0IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGFyZSBJRSAxMCssIEZpcmVmb3ggNCssIENocm9tZSA3KywgU2FmYXJpIDUuMSssXG4gKiBPcGVyYSAxMS42KywgaU9TIDQuMisuXG4gKlxuICogV2UgcmVwb3J0IHRoYXQgdGhlIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0eXBlZCBhcnJheXMgaWYgdGhlIGFyZSBub3Qgc3ViY2xhc3NhYmxlXG4gKiB1c2luZyBfX3Byb3RvX18uIEZpcmVmb3ggNC0yOSBsYWNrcyBzdXBwb3J0IGZvciBhZGRpbmcgbmV3IHByb3BlcnRpZXMgdG8gYFVpbnQ4QXJyYXlgXG4gKiAoU2VlOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD02OTU0MzgpLiBJRSAxMCBsYWNrcyBzdXBwb3J0XG4gKiBmb3IgX19wcm90b19fIGFuZCBoYXMgYSBidWdneSB0eXBlZCBhcnJheSBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgPSB0eXBlZEFycmF5U3VwcG9ydCgpXG5cbmlmICghQnVmZmVyLlRZUEVEX0FSUkFZX1NVUFBPUlQgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmXG4gICAgdHlwZW9mIGNvbnNvbGUuZXJyb3IgPT09ICdmdW5jdGlvbicpIHtcbiAgY29uc29sZS5lcnJvcihcbiAgICAnVGhpcyBicm93c2VyIGxhY2tzIHR5cGVkIGFycmF5IChVaW50OEFycmF5KSBzdXBwb3J0IHdoaWNoIGlzIHJlcXVpcmVkIGJ5ICcgK1xuICAgICdgYnVmZmVyYCB2NS54LiBVc2UgYGJ1ZmZlcmAgdjQueCBpZiB5b3UgcmVxdWlyZSBvbGQgYnJvd3NlciBzdXBwb3J0LidcbiAgKVxufVxuXG5mdW5jdGlvbiB0eXBlZEFycmF5U3VwcG9ydCAoKSB7XG4gIC8vIENhbiB0eXBlZCBhcnJheSBpbnN0YW5jZXMgY2FuIGJlIGF1Z21lbnRlZD9cbiAgdHJ5IHtcbiAgICB2YXIgYXJyID0gbmV3IFVpbnQ4QXJyYXkoMSlcbiAgICBhcnIuX19wcm90b19fID0geyBfX3Byb3RvX186IFVpbnQ4QXJyYXkucHJvdG90eXBlLCBmb286IGZ1bmN0aW9uICgpIHsgcmV0dXJuIDQyIH0gfVxuICAgIHJldHVybiBhcnIuZm9vKCkgPT09IDQyXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ3BhcmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5idWZmZXJcbiAgfVxufSlcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdvZmZzZXQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnl0ZU9mZnNldFxuICB9XG59KVxuXG5mdW5jdGlvbiBjcmVhdGVCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAobGVuZ3RoID4gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBsZW5ndGggKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICB2YXIgYnVmID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbi8qKlxuICogVGhlIEJ1ZmZlciBjb25zdHJ1Y3RvciByZXR1cm5zIGluc3RhbmNlcyBvZiBgVWludDhBcnJheWAgdGhhdCBoYXZlIHRoZWlyXG4gKiBwcm90b3R5cGUgY2hhbmdlZCB0byBgQnVmZmVyLnByb3RvdHlwZWAuIEZ1cnRoZXJtb3JlLCBgQnVmZmVyYCBpcyBhIHN1YmNsYXNzIG9mXG4gKiBgVWludDhBcnJheWAsIHNvIHRoZSByZXR1cm5lZCBpbnN0YW5jZXMgd2lsbCBoYXZlIGFsbCB0aGUgbm9kZSBgQnVmZmVyYCBtZXRob2RzXG4gKiBhbmQgdGhlIGBVaW50OEFycmF5YCBtZXRob2RzLiBTcXVhcmUgYnJhY2tldCBub3RhdGlvbiB3b3JrcyBhcyBleHBlY3RlZCAtLSBpdFxuICogcmV0dXJucyBhIHNpbmdsZSBvY3RldC5cbiAqXG4gKiBUaGUgYFVpbnQ4QXJyYXlgIHByb3RvdHlwZSByZW1haW5zIHVubW9kaWZpZWQuXG4gKi9cblxuZnVuY3Rpb24gQnVmZmVyIChhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICAvLyBDb21tb24gY2FzZS5cbiAgaWYgKHR5cGVvZiBhcmcgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZ09yT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBzdHJpbmcuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgICAgKVxuICAgIH1cbiAgICByZXR1cm4gYWxsb2NVbnNhZmUoYXJnKVxuICB9XG4gIHJldHVybiBmcm9tKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBGaXggc3ViYXJyYXkoKSBpbiBFUzIwMTYuIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC85N1xuaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC5zcGVjaWVzICE9IG51bGwgJiZcbiAgICBCdWZmZXJbU3ltYm9sLnNwZWNpZXNdID09PSBCdWZmZXIpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlciwgU3ltYm9sLnNwZWNpZXMsIHtcbiAgICB2YWx1ZTogbnVsbCxcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgd3JpdGFibGU6IGZhbHNlXG4gIH0pXG59XG5cbkJ1ZmZlci5wb29sU2l6ZSA9IDgxOTIgLy8gbm90IHVzZWQgYnkgdGhpcyBpbXBsZW1lbnRhdGlvblxuXG5mdW5jdGlvbiBmcm9tICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGZyb21TdHJpbmcodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQpXG4gIH1cblxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHZhbHVlKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKHZhbHVlKVxuICB9XG5cbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICB0aHJvdyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gICAgKVxuICB9XG5cbiAgaWYgKGlzSW5zdGFuY2UodmFsdWUsIEFycmF5QnVmZmVyKSB8fFxuICAgICAgKHZhbHVlICYmIGlzSW5zdGFuY2UodmFsdWUuYnVmZmVyLCBBcnJheUJ1ZmZlcikpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUJ1ZmZlcih2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInZhbHVlXCIgYXJndW1lbnQgbXVzdCBub3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgbnVtYmVyJ1xuICAgIClcbiAgfVxuXG4gIHZhciB2YWx1ZU9mID0gdmFsdWUudmFsdWVPZiAmJiB2YWx1ZS52YWx1ZU9mKClcbiAgaWYgKHZhbHVlT2YgIT0gbnVsbCAmJiB2YWx1ZU9mICE9PSB2YWx1ZSkge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbSh2YWx1ZU9mLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICB2YXIgYiA9IGZyb21PYmplY3QodmFsdWUpXG4gIGlmIChiKSByZXR1cm4gYlxuXG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9QcmltaXRpdmUgIT0gbnVsbCAmJlxuICAgICAgdHlwZW9mIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0gPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oXG4gICAgICB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdKCdzdHJpbmcnKSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoXG4gICAgKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAnVGhlIGZpcnN0IGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIEFycmF5QnVmZmVyLCBBcnJheSwgJyArXG4gICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICApXG59XG5cbi8qKlxuICogRnVuY3Rpb25hbGx5IGVxdWl2YWxlbnQgdG8gQnVmZmVyKGFyZywgZW5jb2RpbmcpIGJ1dCB0aHJvd3MgYSBUeXBlRXJyb3JcbiAqIGlmIHZhbHVlIGlzIGEgbnVtYmVyLlxuICogQnVmZmVyLmZyb20oc3RyWywgZW5jb2RpbmddKVxuICogQnVmZmVyLmZyb20oYXJyYXkpXG4gKiBCdWZmZXIuZnJvbShidWZmZXIpXG4gKiBCdWZmZXIuZnJvbShhcnJheUJ1ZmZlclssIGJ5dGVPZmZzZXRbLCBsZW5ndGhdXSlcbiAqKi9cbkJ1ZmZlci5mcm9tID0gZnVuY3Rpb24gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGZyb20odmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gTm90ZTogQ2hhbmdlIHByb3RvdHlwZSAqYWZ0ZXIqIEJ1ZmZlci5mcm9tIGlzIGRlZmluZWQgdG8gd29ya2Fyb3VuZCBDaHJvbWUgYnVnOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvcHVsbC8xNDhcbkJ1ZmZlci5wcm90b3R5cGUuX19wcm90b19fID0gVWludDhBcnJheS5wcm90b3R5cGVcbkJ1ZmZlci5fX3Byb3RvX18gPSBVaW50OEFycmF5XG5cbmZ1bmN0aW9uIGFzc2VydFNpemUgKHNpemUpIHtcbiAgaWYgKHR5cGVvZiBzaXplICE9PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXInKVxuICB9IGVsc2UgaWYgKHNpemUgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyBzaXplICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbn1cblxuZnVuY3Rpb24gYWxsb2MgKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgaWYgKHNpemUgPD0gMCkge1xuICAgIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbiAgfVxuICBpZiAoZmlsbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gT25seSBwYXkgYXR0ZW50aW9uIHRvIGVuY29kaW5nIGlmIGl0J3MgYSBzdHJpbmcuIFRoaXNcbiAgICAvLyBwcmV2ZW50cyBhY2NpZGVudGFsbHkgc2VuZGluZyBpbiBhIG51bWJlciB0aGF0IHdvdWxkXG4gICAgLy8gYmUgaW50ZXJwcmV0dGVkIGFzIGEgc3RhcnQgb2Zmc2V0LlxuICAgIHJldHVybiB0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnXG4gICAgICA/IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwsIGVuY29kaW5nKVxuICAgICAgOiBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsKVxuICB9XG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSlcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiBhbGxvYyhzaXplWywgZmlsbFssIGVuY29kaW5nXV0pXG4gKiovXG5CdWZmZXIuYWxsb2MgPSBmdW5jdGlvbiAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGFsbG9jKHNpemUsIGZpbGwsIGVuY29kaW5nKVxufVxuXG5mdW5jdGlvbiBhbGxvY1Vuc2FmZSAoc2l6ZSkge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIHJldHVybiBjcmVhdGVCdWZmZXIoc2l6ZSA8IDAgPyAwIDogY2hlY2tlZChzaXplKSB8IDApXG59XG5cbi8qKlxuICogRXF1aXZhbGVudCB0byBCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqICovXG5CdWZmZXIuYWxsb2NVbnNhZmUgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cbi8qKlxuICogRXF1aXZhbGVudCB0byBTbG93QnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZVNsb3cgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICByZXR1cm4gYWxsb2NVbnNhZmUoc2l6ZSlcbn1cblxuZnVuY3Rpb24gZnJvbVN0cmluZyAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAodHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJyB8fCBlbmNvZGluZyA9PT0gJycpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICB9XG5cbiAgaWYgKCFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gIH1cblxuICB2YXIgbGVuZ3RoID0gYnl0ZUxlbmd0aChzdHJpbmcsIGVuY29kaW5nKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG5cbiAgdmFyIGFjdHVhbCA9IGJ1Zi53cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuXG4gIGlmIChhY3R1YWwgIT09IGxlbmd0aCkge1xuICAgIC8vIFdyaXRpbmcgYSBoZXggc3RyaW5nLCBmb3IgZXhhbXBsZSwgdGhhdCBjb250YWlucyBpbnZhbGlkIGNoYXJhY3RlcnMgd2lsbFxuICAgIC8vIGNhdXNlIGV2ZXJ5dGhpbmcgYWZ0ZXIgdGhlIGZpcnN0IGludmFsaWQgY2hhcmFjdGVyIHRvIGJlIGlnbm9yZWQuIChlLmcuXG4gICAgLy8gJ2FieHhjZCcgd2lsbCBiZSB0cmVhdGVkIGFzICdhYicpXG4gICAgYnVmID0gYnVmLnNsaWNlKDAsIGFjdHVhbClcbiAgfVxuXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5TGlrZSAoYXJyYXkpIHtcbiAgdmFyIGxlbmd0aCA9IGFycmF5Lmxlbmd0aCA8IDAgPyAwIDogY2hlY2tlZChhcnJheS5sZW5ndGgpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkgKz0gMSkge1xuICAgIGJ1ZltpXSA9IGFycmF5W2ldICYgMjU1XG4gIH1cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlCdWZmZXIgKGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwIHx8IGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0KSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wib2Zmc2V0XCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmIChhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCArIChsZW5ndGggfHwgMCkpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJsZW5ndGhcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgdmFyIGJ1ZlxuICBpZiAoYnl0ZU9mZnNldCA9PT0gdW5kZWZpbmVkICYmIGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXkpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldClcbiAgfSBlbHNlIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tT2JqZWN0IChvYmopIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihvYmopKSB7XG4gICAgdmFyIGxlbiA9IGNoZWNrZWQob2JqLmxlbmd0aCkgfCAwXG4gICAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW4pXG5cbiAgICBpZiAoYnVmLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGJ1ZlxuICAgIH1cblxuICAgIG9iai5jb3B5KGJ1ZiwgMCwgMCwgbGVuKVxuICAgIHJldHVybiBidWZcbiAgfVxuXG4gIGlmIChvYmoubGVuZ3RoICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIG9iai5sZW5ndGggIT09ICdudW1iZXInIHx8IG51bWJlcklzTmFOKG9iai5sZW5ndGgpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlQnVmZmVyKDApXG4gICAgfVxuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iailcbiAgfVxuXG4gIGlmIChvYmoudHlwZSA9PT0gJ0J1ZmZlcicgJiYgQXJyYXkuaXNBcnJheShvYmouZGF0YSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmouZGF0YSlcbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja2VkIChsZW5ndGgpIHtcbiAgLy8gTm90ZTogY2Fubm90IHVzZSBgbGVuZ3RoIDwgS19NQVhfTEVOR1RIYCBoZXJlIGJlY2F1c2UgdGhhdCBmYWlscyB3aGVuXG4gIC8vIGxlbmd0aCBpcyBOYU4gKHdoaWNoIGlzIG90aGVyd2lzZSBjb2VyY2VkIHRvIHplcm8uKVxuICBpZiAobGVuZ3RoID49IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIGFsbG9jYXRlIEJ1ZmZlciBsYXJnZXIgdGhhbiBtYXhpbXVtICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICdzaXplOiAweCcgKyBLX01BWF9MRU5HVEgudG9TdHJpbmcoMTYpICsgJyBieXRlcycpXG4gIH1cbiAgcmV0dXJuIGxlbmd0aCB8IDBcbn1cblxuZnVuY3Rpb24gU2xvd0J1ZmZlciAobGVuZ3RoKSB7XG4gIGlmICgrbGVuZ3RoICE9IGxlbmd0aCkgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuICAgIGxlbmd0aCA9IDBcbiAgfVxuICByZXR1cm4gQnVmZmVyLmFsbG9jKCtsZW5ndGgpXG59XG5cbkJ1ZmZlci5pc0J1ZmZlciA9IGZ1bmN0aW9uIGlzQnVmZmVyIChiKSB7XG4gIHJldHVybiBiICE9IG51bGwgJiYgYi5faXNCdWZmZXIgPT09IHRydWUgJiZcbiAgICBiICE9PSBCdWZmZXIucHJvdG90eXBlIC8vIHNvIEJ1ZmZlci5pc0J1ZmZlcihCdWZmZXIucHJvdG90eXBlKSB3aWxsIGJlIGZhbHNlXG59XG5cbkJ1ZmZlci5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAoYSwgYikge1xuICBpZiAoaXNJbnN0YW5jZShhLCBVaW50OEFycmF5KSkgYSA9IEJ1ZmZlci5mcm9tKGEsIGEub2Zmc2V0LCBhLmJ5dGVMZW5ndGgpXG4gIGlmIChpc0luc3RhbmNlKGIsIFVpbnQ4QXJyYXkpKSBiID0gQnVmZmVyLmZyb20oYiwgYi5vZmZzZXQsIGIuYnl0ZUxlbmd0aClcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYSkgfHwgIUJ1ZmZlci5pc0J1ZmZlcihiKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwiYnVmMVwiLCBcImJ1ZjJcIiBhcmd1bWVudHMgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheSdcbiAgICApXG4gIH1cblxuICBpZiAoYSA9PT0gYikgcmV0dXJuIDBcblxuICB2YXIgeCA9IGEubGVuZ3RoXG4gIHZhciB5ID0gYi5sZW5ndGhcblxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gTWF0aC5taW4oeCwgeSk7IGkgPCBsZW47ICsraSkge1xuICAgIGlmIChhW2ldICE9PSBiW2ldKSB7XG4gICAgICB4ID0gYVtpXVxuICAgICAgeSA9IGJbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG5CdWZmZXIuaXNFbmNvZGluZyA9IGZ1bmN0aW9uIGlzRW5jb2RpbmcgKGVuY29kaW5nKSB7XG4gIHN3aXRjaCAoU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnaGV4JzpcbiAgICBjYXNlICd1dGY4JzpcbiAgICBjYXNlICd1dGYtOCc6XG4gICAgY2FzZSAnYXNjaWknOlxuICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgY2FzZSAnYmluYXJ5JzpcbiAgICBjYXNlICdiYXNlNjQnOlxuICAgIGNhc2UgJ3VjczInOlxuICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICBjYXNlICd1dGYxNmxlJzpcbiAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5CdWZmZXIuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0IChsaXN0LCBsZW5ndGgpIHtcbiAgaWYgKCFBcnJheS5pc0FycmF5KGxpc3QpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgfVxuXG4gIGlmIChsaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBCdWZmZXIuYWxsb2MoMClcbiAgfVxuXG4gIHZhciBpXG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGxlbmd0aCA9IDBcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgICAgbGVuZ3RoICs9IGxpc3RbaV0ubGVuZ3RoXG4gICAgfVxuICB9XG5cbiAgdmFyIGJ1ZmZlciA9IEJ1ZmZlci5hbGxvY1Vuc2FmZShsZW5ndGgpXG4gIHZhciBwb3MgPSAwXG4gIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJ1ZiA9IGxpc3RbaV1cbiAgICBpZiAoaXNJbnN0YW5jZShidWYsIFVpbnQ4QXJyYXkpKSB7XG4gICAgICBidWYgPSBCdWZmZXIuZnJvbShidWYpXG4gICAgfVxuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gICAgfVxuICAgIGJ1Zi5jb3B5KGJ1ZmZlciwgcG9zKVxuICAgIHBvcyArPSBidWYubGVuZ3RoXG4gIH1cbiAgcmV0dXJuIGJ1ZmZlclxufVxuXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIoc3RyaW5nKSkge1xuICAgIHJldHVybiBzdHJpbmcubGVuZ3RoXG4gIH1cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyhzdHJpbmcpIHx8IGlzSW5zdGFuY2Uoc3RyaW5nLCBBcnJheUJ1ZmZlcikpIHtcbiAgICByZXR1cm4gc3RyaW5nLmJ5dGVMZW5ndGhcbiAgfVxuICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInN0cmluZ1wiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgc3RyaW5nLCBCdWZmZXIsIG9yIEFycmF5QnVmZmVyLiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyB0eXBlb2Ygc3RyaW5nXG4gICAgKVxuICB9XG5cbiAgdmFyIGxlbiA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIG11c3RNYXRjaCA9IChhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gPT09IHRydWUpXG4gIGlmICghbXVzdE1hdGNoICYmIGxlbiA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBVc2UgYSBmb3IgbG9vcCB0byBhdm9pZCByZWN1cnNpb25cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGVuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gbGVuICogMlxuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGxlbiA+Pj4gMVxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkge1xuICAgICAgICAgIHJldHVybiBtdXN0TWF0Y2ggPyAtMSA6IHV0ZjhUb0J5dGVzKHN0cmluZykubGVuZ3RoIC8vIGFzc3VtZSB1dGY4XG4gICAgICAgIH1cbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cbkJ1ZmZlci5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuXG5mdW5jdGlvbiBzbG93VG9TdHJpbmcgKGVuY29kaW5nLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG5cbiAgLy8gTm8gbmVlZCB0byB2ZXJpZnkgdGhhdCBcInRoaXMubGVuZ3RoIDw9IE1BWF9VSU5UMzJcIiBzaW5jZSBpdCdzIGEgcmVhZC1vbmx5XG4gIC8vIHByb3BlcnR5IG9mIGEgdHlwZWQgYXJyYXkuXG5cbiAgLy8gVGhpcyBiZWhhdmVzIG5laXRoZXIgbGlrZSBTdHJpbmcgbm9yIFVpbnQ4QXJyYXkgaW4gdGhhdCB3ZSBzZXQgc3RhcnQvZW5kXG4gIC8vIHRvIHRoZWlyIHVwcGVyL2xvd2VyIGJvdW5kcyBpZiB0aGUgdmFsdWUgcGFzc2VkIGlzIG91dCBvZiByYW5nZS5cbiAgLy8gdW5kZWZpbmVkIGlzIGhhbmRsZWQgc3BlY2lhbGx5IGFzIHBlciBFQ01BLTI2MiA2dGggRWRpdGlvbixcbiAgLy8gU2VjdGlvbiAxMy4zLjMuNyBSdW50aW1lIFNlbWFudGljczogS2V5ZWRCaW5kaW5nSW5pdGlhbGl6YXRpb24uXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkIHx8IHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIC8vIFJldHVybiBlYXJseSBpZiBzdGFydCA+IHRoaXMubGVuZ3RoLiBEb25lIGhlcmUgdG8gcHJldmVudCBwb3RlbnRpYWwgdWludDMyXG4gIC8vIGNvZXJjaW9uIGZhaWwgYmVsb3cuXG4gIGlmIChzdGFydCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoZW5kID09PSB1bmRlZmluZWQgfHwgZW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKGVuZCA8PSAwKSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICAvLyBGb3JjZSBjb2Vyc2lvbiB0byB1aW50MzIuIFRoaXMgd2lsbCBhbHNvIGNvZXJjZSBmYWxzZXkvTmFOIHZhbHVlcyB0byAwLlxuICBlbmQgPj4+PSAwXG4gIHN0YXJ0ID4+Pj0gMFxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgd2hpbGUgKHRydWUpIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdXRmMTZsZVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9IChlbmNvZGluZyArICcnKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG4vLyBUaGlzIHByb3BlcnR5IGlzIHVzZWQgYnkgYEJ1ZmZlci5pc0J1ZmZlcmAgKGFuZCB0aGUgYGlzLWJ1ZmZlcmAgbnBtIHBhY2thZ2UpXG4vLyB0byBkZXRlY3QgYSBCdWZmZXIgaW5zdGFuY2UuIEl0J3Mgbm90IHBvc3NpYmxlIHRvIHVzZSBgaW5zdGFuY2VvZiBCdWZmZXJgXG4vLyByZWxpYWJseSBpbiBhIGJyb3dzZXJpZnkgY29udGV4dCBiZWNhdXNlIHRoZXJlIGNvdWxkIGJlIG11bHRpcGxlIGRpZmZlcmVudFxuLy8gY29waWVzIG9mIHRoZSAnYnVmZmVyJyBwYWNrYWdlIGluIHVzZS4gVGhpcyBtZXRob2Qgd29ya3MgZXZlbiBmb3IgQnVmZmVyXG4vLyBpbnN0YW5jZXMgdGhhdCB3ZXJlIGNyZWF0ZWQgZnJvbSBhbm90aGVyIGNvcHkgb2YgdGhlIGBidWZmZXJgIHBhY2thZ2UuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNTRcbkJ1ZmZlci5wcm90b3R5cGUuX2lzQnVmZmVyID0gdHJ1ZVxuXG5mdW5jdGlvbiBzd2FwIChiLCBuLCBtKSB7XG4gIHZhciBpID0gYltuXVxuICBiW25dID0gYlttXVxuICBiW21dID0gaVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAxNiA9IGZ1bmN0aW9uIHN3YXAxNiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgMiAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMTYtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gMikge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDEpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMzIgPSBmdW5jdGlvbiBzd2FwMzIgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDQgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDMyLWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAzKVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyAyKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDY0ID0gZnVuY3Rpb24gc3dhcDY0ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA4ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA2NC1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA4KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgNylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgNilcbiAgICBzd2FwKHRoaXMsIGkgKyAyLCBpICsgNSlcbiAgICBzd2FwKHRoaXMsIGkgKyAzLCBpICsgNClcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gdG9TdHJpbmcgKCkge1xuICB2YXIgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbmd0aCA9PT0gMCkgcmV0dXJuICcnXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIDAsIGxlbmd0aClcbiAgcmV0dXJuIHNsb3dUb1N0cmluZy5hcHBseSh0aGlzLCBhcmd1bWVudHMpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9Mb2NhbGVTdHJpbmcgPSBCdWZmZXIucHJvdG90eXBlLnRvU3RyaW5nXG5cbkJ1ZmZlci5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24gZXF1YWxzIChiKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGIpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyJylcbiAgaWYgKHRoaXMgPT09IGIpIHJldHVybiB0cnVlXG4gIHJldHVybiBCdWZmZXIuY29tcGFyZSh0aGlzLCBiKSA9PT0gMFxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluc3BlY3QgPSBmdW5jdGlvbiBpbnNwZWN0ICgpIHtcbiAgdmFyIHN0ciA9ICcnXG4gIHZhciBtYXggPSBleHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTXG4gIHN0ciA9IHRoaXMudG9TdHJpbmcoJ2hleCcsIDAsIG1heCkucmVwbGFjZSgvKC57Mn0pL2csICckMSAnKS50cmltKClcbiAgaWYgKHRoaXMubGVuZ3RoID4gbWF4KSBzdHIgKz0gJyAuLi4gJ1xuICByZXR1cm4gJzxCdWZmZXIgJyArIHN0ciArICc+J1xufVxuXG5CdWZmZXIucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlICh0YXJnZXQsIHN0YXJ0LCBlbmQsIHRoaXNTdGFydCwgdGhpc0VuZCkge1xuICBpZiAoaXNJbnN0YW5jZSh0YXJnZXQsIFVpbnQ4QXJyYXkpKSB7XG4gICAgdGFyZ2V0ID0gQnVmZmVyLmZyb20odGFyZ2V0LCB0YXJnZXQub2Zmc2V0LCB0YXJnZXQuYnl0ZUxlbmd0aClcbiAgfVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ0YXJnZXRcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5LiAnICtcbiAgICAgICdSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHRhcmdldClcbiAgICApXG4gIH1cblxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXJ0ID0gMFxuICB9XG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuZCA9IHRhcmdldCA/IHRhcmdldC5sZW5ndGggOiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc1N0YXJ0ID0gMFxuICB9XG4gIGlmICh0aGlzRW5kID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzRW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChzdGFydCA8IDAgfHwgZW5kID4gdGFyZ2V0Lmxlbmd0aCB8fCB0aGlzU3RhcnQgPCAwIHx8IHRoaXNFbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdvdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kICYmIHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAwXG4gIH1cbiAgaWYgKHRoaXNTdGFydCA+PSB0aGlzRW5kKSB7XG4gICAgcmV0dXJuIC0xXG4gIH1cbiAgaWYgKHN0YXJ0ID49IGVuZCkge1xuICAgIHJldHVybiAxXG4gIH1cblxuICBzdGFydCA+Pj49IDBcbiAgZW5kID4+Pj0gMFxuICB0aGlzU3RhcnQgPj4+PSAwXG4gIHRoaXNFbmQgPj4+PSAwXG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCkgcmV0dXJuIDBcblxuICB2YXIgeCA9IHRoaXNFbmQgLSB0aGlzU3RhcnRcbiAgdmFyIHkgPSBlbmQgLSBzdGFydFxuICB2YXIgbGVuID0gTWF0aC5taW4oeCwgeSlcblxuICB2YXIgdGhpc0NvcHkgPSB0aGlzLnNsaWNlKHRoaXNTdGFydCwgdGhpc0VuZClcbiAgdmFyIHRhcmdldENvcHkgPSB0YXJnZXQuc2xpY2Uoc3RhcnQsIGVuZClcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKHRoaXNDb3B5W2ldICE9PSB0YXJnZXRDb3B5W2ldKSB7XG4gICAgICB4ID0gdGhpc0NvcHlbaV1cbiAgICAgIHkgPSB0YXJnZXRDb3B5W2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuLy8gRmluZHMgZWl0aGVyIHRoZSBmaXJzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPj0gYGJ5dGVPZmZzZXRgLFxuLy8gT1IgdGhlIGxhc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0IDw9IGBieXRlT2Zmc2V0YC5cbi8vXG4vLyBBcmd1bWVudHM6XG4vLyAtIGJ1ZmZlciAtIGEgQnVmZmVyIHRvIHNlYXJjaFxuLy8gLSB2YWwgLSBhIHN0cmluZywgQnVmZmVyLCBvciBudW1iZXJcbi8vIC0gYnl0ZU9mZnNldCAtIGFuIGluZGV4IGludG8gYGJ1ZmZlcmA7IHdpbGwgYmUgY2xhbXBlZCB0byBhbiBpbnQzMlxuLy8gLSBlbmNvZGluZyAtIGFuIG9wdGlvbmFsIGVuY29kaW5nLCByZWxldmFudCBpcyB2YWwgaXMgYSBzdHJpbmdcbi8vIC0gZGlyIC0gdHJ1ZSBmb3IgaW5kZXhPZiwgZmFsc2UgZm9yIGxhc3RJbmRleE9mXG5mdW5jdGlvbiBiaWRpcmVjdGlvbmFsSW5kZXhPZiAoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgLy8gRW1wdHkgYnVmZmVyIG1lYW5zIG5vIG1hdGNoXG4gIGlmIChidWZmZXIubGVuZ3RoID09PSAwKSByZXR1cm4gLTFcblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldFxuICBpZiAodHlwZW9mIGJ5dGVPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBieXRlT2Zmc2V0XG4gICAgYnl0ZU9mZnNldCA9IDBcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0ID4gMHg3ZmZmZmZmZikge1xuICAgIGJ5dGVPZmZzZXQgPSAweDdmZmZmZmZmXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IC0weDgwMDAwMDAwKSB7XG4gICAgYnl0ZU9mZnNldCA9IC0weDgwMDAwMDAwXG4gIH1cbiAgYnl0ZU9mZnNldCA9ICtieXRlT2Zmc2V0IC8vIENvZXJjZSB0byBOdW1iZXIuXG4gIGlmIChudW1iZXJJc05hTihieXRlT2Zmc2V0KSkge1xuICAgIC8vIGJ5dGVPZmZzZXQ6IGl0IGl0J3MgdW5kZWZpbmVkLCBudWxsLCBOYU4sIFwiZm9vXCIsIGV0Yywgc2VhcmNoIHdob2xlIGJ1ZmZlclxuICAgIGJ5dGVPZmZzZXQgPSBkaXIgPyAwIDogKGJ1ZmZlci5sZW5ndGggLSAxKVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXQ6IG5lZ2F0aXZlIG9mZnNldHMgc3RhcnQgZnJvbSB0aGUgZW5kIG9mIHRoZSBidWZmZXJcbiAgaWYgKGJ5dGVPZmZzZXQgPCAwKSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCArIGJ5dGVPZmZzZXRcbiAgaWYgKGJ5dGVPZmZzZXQgPj0gYnVmZmVyLmxlbmd0aCkge1xuICAgIGlmIChkaXIpIHJldHVybiAtMVxuICAgIGVsc2UgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggLSAxXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA8IDApIHtcbiAgICBpZiAoZGlyKSBieXRlT2Zmc2V0ID0gMFxuICAgIGVsc2UgcmV0dXJuIC0xXG4gIH1cblxuICAvLyBOb3JtYWxpemUgdmFsXG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gIH1cblxuICAvLyBGaW5hbGx5LCBzZWFyY2ggZWl0aGVyIGluZGV4T2YgKGlmIGRpciBpcyB0cnVlKSBvciBsYXN0SW5kZXhPZlxuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHZhbCkpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2U6IGxvb2tpbmcgZm9yIGVtcHR5IHN0cmluZy9idWZmZXIgYWx3YXlzIGZhaWxzXG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiAtMVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMHhGRiAvLyBTZWFyY2ggZm9yIGEgYnl0ZSB2YWx1ZSBbMC0yNTVdXG4gICAgaWYgKHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBpZiAoZGlyKSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5pbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUubGFzdEluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIFsgdmFsIF0sIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCd2YWwgbXVzdCBiZSBzdHJpbmcsIG51bWJlciBvciBCdWZmZXInKVxufVxuXG5mdW5jdGlvbiBhcnJheUluZGV4T2YgKGFyciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIHZhciBpbmRleFNpemUgPSAxXG4gIHZhciBhcnJMZW5ndGggPSBhcnIubGVuZ3RoXG4gIHZhciB2YWxMZW5ndGggPSB2YWwubGVuZ3RoXG5cbiAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9IFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgIGlmIChlbmNvZGluZyA9PT0gJ3VjczInIHx8IGVuY29kaW5nID09PSAndWNzLTInIHx8XG4gICAgICAgIGVuY29kaW5nID09PSAndXRmMTZsZScgfHwgZW5jb2RpbmcgPT09ICd1dGYtMTZsZScpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoIDwgMiB8fCB2YWwubGVuZ3RoIDwgMikge1xuICAgICAgICByZXR1cm4gLTFcbiAgICAgIH1cbiAgICAgIGluZGV4U2l6ZSA9IDJcbiAgICAgIGFyckxlbmd0aCAvPSAyXG4gICAgICB2YWxMZW5ndGggLz0gMlxuICAgICAgYnl0ZU9mZnNldCAvPSAyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZCAoYnVmLCBpKSB7XG4gICAgaWYgKGluZGV4U2l6ZSA9PT0gMSkge1xuICAgICAgcmV0dXJuIGJ1ZltpXVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gYnVmLnJlYWRVSW50MTZCRShpICogaW5kZXhTaXplKVxuICAgIH1cbiAgfVxuXG4gIHZhciBpXG4gIGlmIChkaXIpIHtcbiAgICB2YXIgZm91bmRJbmRleCA9IC0xXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA8IGFyckxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVhZChhcnIsIGkpID09PSByZWFkKHZhbCwgZm91bmRJbmRleCA9PT0gLTEgPyAwIDogaSAtIGZvdW5kSW5kZXgpKSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ID09PSAtMSkgZm91bmRJbmRleCA9IGlcbiAgICAgICAgaWYgKGkgLSBmb3VuZEluZGV4ICsgMSA9PT0gdmFsTGVuZ3RoKSByZXR1cm4gZm91bmRJbmRleCAqIGluZGV4U2l6ZVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggIT09IC0xKSBpIC09IGkgLSBmb3VuZEluZGV4XG4gICAgICAgIGZvdW5kSW5kZXggPSAtMVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoYnl0ZU9mZnNldCArIHZhbExlbmd0aCA+IGFyckxlbmd0aCkgYnl0ZU9mZnNldCA9IGFyckxlbmd0aCAtIHZhbExlbmd0aFxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgZm91bmQgPSB0cnVlXG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbExlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmIChyZWFkKGFyciwgaSArIGopICE9PSByZWFkKHZhbCwgaikpIHtcbiAgICAgICAgICBmb3VuZCA9IGZhbHNlXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGZvdW5kKSByZXR1cm4gaVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluY2x1ZGVzID0gZnVuY3Rpb24gaW5jbHVkZXMgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIHRoaXMuaW5kZXhPZih2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSAhPT0gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmRleE9mID0gZnVuY3Rpb24gaW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgdHJ1ZSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5sYXN0SW5kZXhPZiA9IGZ1bmN0aW9uIGxhc3RJbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBmYWxzZSlcbn1cblxuZnVuY3Rpb24gaGV4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICBvZmZzZXQgPSBOdW1iZXIob2Zmc2V0KSB8fCAwXG4gIHZhciByZW1haW5pbmcgPSBidWYubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmICghbGVuZ3RoKSB7XG4gICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gIH0gZWxzZSB7XG4gICAgbGVuZ3RoID0gTnVtYmVyKGxlbmd0aClcbiAgICBpZiAobGVuZ3RoID4gcmVtYWluaW5nKSB7XG4gICAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgICB9XG4gIH1cblxuICB2YXIgc3RyTGVuID0gc3RyaW5nLmxlbmd0aFxuXG4gIGlmIChsZW5ndGggPiBzdHJMZW4gLyAyKSB7XG4gICAgbGVuZ3RoID0gc3RyTGVuIC8gMlxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgcGFyc2VkID0gcGFyc2VJbnQoc3RyaW5nLnN1YnN0cihpICogMiwgMiksIDE2KVxuICAgIGlmIChudW1iZXJJc05hTihwYXJzZWQpKSByZXR1cm4gaVxuICAgIGJ1ZltvZmZzZXQgKyBpXSA9IHBhcnNlZFxuICB9XG4gIHJldHVybiBpXG59XG5cbmZ1bmN0aW9uIHV0ZjhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjhUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGFzY2lpV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihhc2NpaVRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gbGF0aW4xV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYXNjaWlXcml0ZShidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGJhc2U2NFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYmFzZTY0VG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiB1Y3MyV3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGYxNmxlVG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gd3JpdGUgKHN0cmluZywgb2Zmc2V0LCBsZW5ndGgsIGVuY29kaW5nKSB7XG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcpXG4gIGlmIChvZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIGVuY29kaW5nKVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiBvZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW5jb2RpbmcgPSBvZmZzZXRcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgb2Zmc2V0WywgbGVuZ3RoXVssIGVuY29kaW5nXSlcbiAgfSBlbHNlIGlmIChpc0Zpbml0ZShvZmZzZXQpKSB7XG4gICAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gICAgaWYgKGlzRmluaXRlKGxlbmd0aCkpIHtcbiAgICAgIGxlbmd0aCA9IGxlbmd0aCA+Pj4gMFxuICAgICAgaWYgKGVuY29kaW5nID09PSB1bmRlZmluZWQpIGVuY29kaW5nID0gJ3V0ZjgnXG4gICAgfSBlbHNlIHtcbiAgICAgIGVuY29kaW5nID0gbGVuZ3RoXG4gICAgICBsZW5ndGggPSB1bmRlZmluZWRcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgJ0J1ZmZlci53cml0ZShzdHJpbmcsIGVuY29kaW5nLCBvZmZzZXRbLCBsZW5ndGhdKSBpcyBubyBsb25nZXIgc3VwcG9ydGVkJ1xuICAgIClcbiAgfVxuXG4gIHZhciByZW1haW5pbmcgPSB0aGlzLmxlbmd0aCAtIG9mZnNldFxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgfHwgbGVuZ3RoID4gcmVtYWluaW5nKSBsZW5ndGggPSByZW1haW5pbmdcblxuICBpZiAoKHN0cmluZy5sZW5ndGggPiAwICYmIChsZW5ndGggPCAwIHx8IG9mZnNldCA8IDApKSB8fCBvZmZzZXQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdBdHRlbXB0IHRvIHdyaXRlIG91dHNpZGUgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gaGV4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgICByZXR1cm4gYXNjaWlXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxhdGluMVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIC8vIFdhcm5pbmc6IG1heExlbmd0aCBub3QgdGFrZW4gaW50byBhY2NvdW50IGluIGJhc2U2NFdyaXRlXG4gICAgICAgIHJldHVybiBiYXNlNjRXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1Y3MyJzpcbiAgICAgIGNhc2UgJ3Vjcy0yJzpcbiAgICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgICByZXR1cm4gdWNzMldyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChsb3dlcmVkQ2FzZSkgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIHRvSlNPTiAoKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogJ0J1ZmZlcicsXG4gICAgZGF0YTogQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcy5fYXJyIHx8IHRoaXMsIDApXG4gIH1cbn1cblxuZnVuY3Rpb24gYmFzZTY0U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBpZiAoc3RhcnQgPT09IDAgJiYgZW5kID09PSBidWYubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1ZilcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmLnNsaWNlKHN0YXJ0LCBlbmQpKVxuICB9XG59XG5cbmZ1bmN0aW9uIHV0ZjhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcbiAgdmFyIHJlcyA9IFtdXG5cbiAgdmFyIGkgPSBzdGFydFxuICB3aGlsZSAoaSA8IGVuZCkge1xuICAgIHZhciBmaXJzdEJ5dGUgPSBidWZbaV1cbiAgICB2YXIgY29kZVBvaW50ID0gbnVsbFxuICAgIHZhciBieXRlc1BlclNlcXVlbmNlID0gKGZpcnN0Qnl0ZSA+IDB4RUYpID8gNFxuICAgICAgOiAoZmlyc3RCeXRlID4gMHhERikgPyAzXG4gICAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4QkYpID8gMlxuICAgICAgICAgIDogMVxuXG4gICAgaWYgKGkgKyBieXRlc1BlclNlcXVlbmNlIDw9IGVuZCkge1xuICAgICAgdmFyIHNlY29uZEJ5dGUsIHRoaXJkQnl0ZSwgZm91cnRoQnl0ZSwgdGVtcENvZGVQb2ludFxuXG4gICAgICBzd2l0Y2ggKGJ5dGVzUGVyU2VxdWVuY2UpIHtcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgIGlmIChmaXJzdEJ5dGUgPCAweDgwKSB7XG4gICAgICAgICAgICBjb2RlUG9pbnQgPSBmaXJzdEJ5dGVcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHgxRikgPDwgMHg2IHwgKHNlY29uZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4QyB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKHRoaXJkQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0ZGICYmICh0ZW1wQ29kZVBvaW50IDwgMHhEODAwIHx8IHRlbXBDb2RlUG9pbnQgPiAweERGRkYpKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgY2FzZSA0OlxuICAgICAgICAgIHNlY29uZEJ5dGUgPSBidWZbaSArIDFdXG4gICAgICAgICAgdGhpcmRCeXRlID0gYnVmW2kgKyAyXVxuICAgICAgICAgIGZvdXJ0aEJ5dGUgPSBidWZbaSArIDNdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwICYmIChmb3VydGhCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweDEyIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweEMgfCAodGhpcmRCeXRlICYgMHgzRikgPDwgMHg2IHwgKGZvdXJ0aEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweEZGRkYgJiYgdGVtcENvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICAgICAgICAgIGNvZGVQb2ludCA9IHRlbXBDb2RlUG9pbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNvZGVQb2ludCA9PT0gbnVsbCkge1xuICAgICAgLy8gd2UgZGlkIG5vdCBnZW5lcmF0ZSBhIHZhbGlkIGNvZGVQb2ludCBzbyBpbnNlcnQgYVxuICAgICAgLy8gcmVwbGFjZW1lbnQgY2hhciAoVStGRkZEKSBhbmQgYWR2YW5jZSBvbmx5IDEgYnl0ZVxuICAgICAgY29kZVBvaW50ID0gMHhGRkZEXG4gICAgICBieXRlc1BlclNlcXVlbmNlID0gMVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50ID4gMHhGRkZGKSB7XG4gICAgICAvLyBlbmNvZGUgdG8gdXRmMTYgKHN1cnJvZ2F0ZSBwYWlyIGRhbmNlKVxuICAgICAgY29kZVBvaW50IC09IDB4MTAwMDBcbiAgICAgIHJlcy5wdXNoKGNvZGVQb2ludCA+Pj4gMTAgJiAweDNGRiB8IDB4RDgwMClcbiAgICAgIGNvZGVQb2ludCA9IDB4REMwMCB8IGNvZGVQb2ludCAmIDB4M0ZGXG4gICAgfVxuXG4gICAgcmVzLnB1c2goY29kZVBvaW50KVxuICAgIGkgKz0gYnl0ZXNQZXJTZXF1ZW5jZVxuICB9XG5cbiAgcmV0dXJuIGRlY29kZUNvZGVQb2ludHNBcnJheShyZXMpXG59XG5cbi8vIEJhc2VkIG9uIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzIyNzQ3MjcyLzY4MDc0MiwgdGhlIGJyb3dzZXIgd2l0aFxuLy8gdGhlIGxvd2VzdCBsaW1pdCBpcyBDaHJvbWUsIHdpdGggMHgxMDAwMCBhcmdzLlxuLy8gV2UgZ28gMSBtYWduaXR1ZGUgbGVzcywgZm9yIHNhZmV0eVxudmFyIE1BWF9BUkdVTUVOVFNfTEVOR1RIID0gMHgxMDAwXG5cbmZ1bmN0aW9uIGRlY29kZUNvZGVQb2ludHNBcnJheSAoY29kZVBvaW50cykge1xuICB2YXIgbGVuID0gY29kZVBvaW50cy5sZW5ndGhcbiAgaWYgKGxlbiA8PSBNQVhfQVJHVU1FTlRTX0xFTkdUSCkge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFN0cmluZywgY29kZVBvaW50cykgLy8gYXZvaWQgZXh0cmEgc2xpY2UoKVxuICB9XG5cbiAgLy8gRGVjb2RlIGluIGNodW5rcyB0byBhdm9pZCBcImNhbGwgc3RhY2sgc2l6ZSBleGNlZWRlZFwiLlxuICB2YXIgcmVzID0gJydcbiAgdmFyIGkgPSAwXG4gIHdoaWxlIChpIDwgbGVuKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoXG4gICAgICBTdHJpbmcsXG4gICAgICBjb2RlUG9pbnRzLnNsaWNlKGksIGkgKz0gTUFYX0FSR1VNRU5UU19MRU5HVEgpXG4gICAgKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0gJiAweDdGKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gbGF0aW4xU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldKVxuICB9XG4gIHJldHVybiByZXRcbn1cblxuZnVuY3Rpb24gaGV4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gYnVmLmxlbmd0aFxuXG4gIGlmICghc3RhcnQgfHwgc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgfHwgZW5kIDwgMCB8fCBlbmQgPiBsZW4pIGVuZCA9IGxlblxuXG4gIHZhciBvdXQgPSAnJ1xuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIG91dCArPSB0b0hleChidWZbaV0pXG4gIH1cbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiB1dGYxNmxlU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgYnl0ZXMgPSBidWYuc2xpY2Uoc3RhcnQsIGVuZClcbiAgdmFyIHJlcyA9ICcnXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlc1tpXSArIChieXRlc1tpICsgMV0gKiAyNTYpKVxuICB9XG4gIHJldHVybiByZXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zbGljZSA9IGZ1bmN0aW9uIHNsaWNlIChzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBzdGFydCA9IH5+c3RhcnRcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyBsZW4gOiB+fmVuZFxuXG4gIGlmIChzdGFydCA8IDApIHtcbiAgICBzdGFydCArPSBsZW5cbiAgICBpZiAoc3RhcnQgPCAwKSBzdGFydCA9IDBcbiAgfSBlbHNlIGlmIChzdGFydCA+IGxlbikge1xuICAgIHN0YXJ0ID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgMCkge1xuICAgIGVuZCArPSBsZW5cbiAgICBpZiAoZW5kIDwgMCkgZW5kID0gMFxuICB9IGVsc2UgaWYgKGVuZCA+IGxlbikge1xuICAgIGVuZCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIHZhciBuZXdCdWYgPSB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIG5ld0J1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBuZXdCdWZcbn1cblxuLypcbiAqIE5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgYnVmZmVyIGlzbid0IHRyeWluZyB0byB3cml0ZSBvdXQgb2YgYm91bmRzLlxuICovXG5mdW5jdGlvbiBjaGVja09mZnNldCAob2Zmc2V0LCBleHQsIGxlbmd0aCkge1xuICBpZiAoKG9mZnNldCAlIDEpICE9PSAwIHx8IG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdvZmZzZXQgaXMgbm90IHVpbnQnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gbGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVHJ5aW5nIHRvIGFjY2VzcyBiZXlvbmQgYnVmZmVyIGxlbmd0aCcpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRMRSA9IGZ1bmN0aW9uIHJlYWRVSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50QkUgPSBmdW5jdGlvbiByZWFkVUludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcbiAgfVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF1cbiAgdmFyIG11bCA9IDFcbiAgd2hpbGUgKGJ5dGVMZW5ndGggPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXSAqIG11bFxuICB9XG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50OCA9IGZ1bmN0aW9uIHJlYWRVSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkJFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCA4KSB8IHRoaXNbb2Zmc2V0ICsgMV1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyTEUgPSBmdW5jdGlvbiByZWFkVUludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICgodGhpc1tvZmZzZXRdKSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikpICtcbiAgICAgICh0aGlzW29mZnNldCArIDNdICogMHgxMDAwMDAwKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSAqIDB4MTAwMDAwMCkgK1xuICAgICgodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICB0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRMRSA9IGZ1bmN0aW9uIHJlYWRJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50QkUgPSBmdW5jdGlvbiByZWFkSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoXG4gIHZhciBtdWwgPSAxXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIC0taV1cbiAgd2hpbGUgKGkgPiAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgLS1pXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDggPSBmdW5jdGlvbiByZWFkSW50OCAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAxLCB0aGlzLmxlbmd0aClcbiAgaWYgKCEodGhpc1tvZmZzZXRdICYgMHg4MCkpIHJldHVybiAodGhpc1tvZmZzZXRdKVxuICByZXR1cm4gKCgweGZmIC0gdGhpc1tvZmZzZXRdICsgMSkgKiAtMSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZMRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkJFID0gZnVuY3Rpb24gcmVhZEludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldCArIDFdIHwgKHRoaXNbb2Zmc2V0XSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyTEUgPSBmdW5jdGlvbiByZWFkSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDNdIDw8IDI0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkJFID0gZnVuY3Rpb24gcmVhZEludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgMjQpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCAxNikgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDgpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRMRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdExFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0QkUgPSBmdW5jdGlvbiByZWFkRmxvYXRCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlTEUgPSBmdW5jdGlvbiByZWFkRG91YmxlTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCA1MiwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRG91YmxlQkUgPSBmdW5jdGlvbiByZWFkRG91YmxlQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgOCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgNTIsIDgpXG59XG5cbmZ1bmN0aW9uIGNoZWNrSW50IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJidWZmZXJcIiBhcmd1bWVudCBtdXN0IGJlIGEgQnVmZmVyIGluc3RhbmNlJylcbiAgaWYgKHZhbHVlID4gbWF4IHx8IHZhbHVlIDwgbWluKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJ2YWx1ZVwiIGFyZ3VtZW50IGlzIG91dCBvZiBib3VuZHMnKVxuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludEJFID0gZnVuY3Rpb24gd3JpdGVVSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVVSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4ZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweGZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlVUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweGZmZmZmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gMFxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgLSAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50QkUgPSBmdW5jdGlvbiB3cml0ZUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpICsgMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDggPSBmdW5jdGlvbiB3cml0ZUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweDdmLCAtMHg4MClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAxXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZUludDMyTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJCRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmZmZmZmZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5mdW5jdGlvbiBjaGVja0lFRUU3NTQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAob2Zmc2V0ICsgZXh0ID4gYnVmLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG9hdCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgNCwgMy40MDI4MjM0NjYzODUyODg2ZSszOCwgLTMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgMjMsIDQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdExFID0gZnVuY3Rpb24gd3JpdGVGbG9hdExFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0QkUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuZnVuY3Rpb24gd3JpdGVEb3VibGUgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDgsIDEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4LCAtMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgpXG4gIH1cbiAgaWVlZTc1NC53cml0ZShidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgNTIsIDgpXG4gIHJldHVybiBvZmZzZXQgKyA4XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVMRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlTEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCB0cnVlLCBub0Fzc2VydClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUJFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIGZhbHNlLCBub0Fzc2VydClcbn1cblxuLy8gY29weSh0YXJnZXRCdWZmZXIsIHRhcmdldFN0YXJ0PTAsIHNvdXJjZVN0YXJ0PTAsIHNvdXJjZUVuZD1idWZmZXIubGVuZ3RoKVxuQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24gY29weSAodGFyZ2V0LCB0YXJnZXRTdGFydCwgc3RhcnQsIGVuZCkge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0YXJnZXQpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdhcmd1bWVudCBzaG91bGQgYmUgYSBCdWZmZXInKVxuICBpZiAoIXN0YXJ0KSBzdGFydCA9IDBcbiAgaWYgKCFlbmQgJiYgZW5kICE9PSAwKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0U3RhcnQgPj0gdGFyZ2V0Lmxlbmd0aCkgdGFyZ2V0U3RhcnQgPSB0YXJnZXQubGVuZ3RoXG4gIGlmICghdGFyZ2V0U3RhcnQpIHRhcmdldFN0YXJ0ID0gMFxuICBpZiAoZW5kID4gMCAmJiBlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICAvLyBDb3B5IDAgYnl0ZXM7IHdlJ3JlIGRvbmVcbiAgaWYgKGVuZCA9PT0gc3RhcnQpIHJldHVybiAwXG4gIGlmICh0YXJnZXQubGVuZ3RoID09PSAwIHx8IHRoaXMubGVuZ3RoID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIEZhdGFsIGVycm9yIGNvbmRpdGlvbnNcbiAgaWYgKHRhcmdldFN0YXJ0IDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCd0YXJnZXRTdGFydCBvdXQgb2YgYm91bmRzJylcbiAgfVxuICBpZiAoc3RhcnQgPCAwIHx8IHN0YXJ0ID49IHRoaXMubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKGVuZCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdzb3VyY2VFbmQgb3V0IG9mIGJvdW5kcycpXG5cbiAgLy8gQXJlIHdlIG9vYj9cbiAgaWYgKGVuZCA+IHRoaXMubGVuZ3RoKSBlbmQgPSB0aGlzLmxlbmd0aFxuICBpZiAodGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0IDwgZW5kIC0gc3RhcnQpIHtcbiAgICBlbmQgPSB0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgKyBzdGFydFxuICB9XG5cbiAgdmFyIGxlbiA9IGVuZCAtIHN0YXJ0XG5cbiAgaWYgKHRoaXMgPT09IHRhcmdldCAmJiB0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuY29weVdpdGhpbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIC8vIFVzZSBidWlsdC1pbiB3aGVuIGF2YWlsYWJsZSwgbWlzc2luZyBmcm9tIElFMTFcbiAgICB0aGlzLmNvcHlXaXRoaW4odGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpXG4gIH0gZWxzZSBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHN0YXJ0IDwgdGFyZ2V0U3RhcnQgJiYgdGFyZ2V0U3RhcnQgPCBlbmQpIHtcbiAgICAvLyBkZXNjZW5kaW5nIGNvcHkgZnJvbSBlbmRcbiAgICBmb3IgKHZhciBpID0gbGVuIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIHRhcmdldFtpICsgdGFyZ2V0U3RhcnRdID0gdGhpc1tpICsgc3RhcnRdXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIFVpbnQ4QXJyYXkucHJvdG90eXBlLnNldC5jYWxsKFxuICAgICAgdGFyZ2V0LFxuICAgICAgdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKSxcbiAgICAgIHRhcmdldFN0YXJ0XG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIGxlblxufVxuXG4vLyBVc2FnZTpcbi8vICAgIGJ1ZmZlci5maWxsKG51bWJlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoYnVmZmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChzdHJpbmdbLCBvZmZzZXRbLCBlbmRdXVssIGVuY29kaW5nXSlcbkJ1ZmZlci5wcm90b3R5cGUuZmlsbCA9IGZ1bmN0aW9uIGZpbGwgKHZhbCwgc3RhcnQsIGVuZCwgZW5jb2RpbmcpIHtcbiAgLy8gSGFuZGxlIHN0cmluZyBjYXNlczpcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgaWYgKHR5cGVvZiBzdGFydCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gc3RhcnRcbiAgICAgIHN0YXJ0ID0gMFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBlbmQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IGVuZFxuICAgICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgICB9XG4gICAgaWYgKGVuY29kaW5nICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGVuY29kaW5nICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZW5jb2RpbmcgbXVzdCBiZSBhIHN0cmluZycpXG4gICAgfVxuICAgIGlmICh0eXBlb2YgZW5jb2RpbmcgPT09ICdzdHJpbmcnICYmICFCdWZmZXIuaXNFbmNvZGluZyhlbmNvZGluZykpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICB9XG4gICAgaWYgKHZhbC5sZW5ndGggPT09IDEpIHtcbiAgICAgIHZhciBjb2RlID0gdmFsLmNoYXJDb2RlQXQoMClcbiAgICAgIGlmICgoZW5jb2RpbmcgPT09ICd1dGY4JyAmJiBjb2RlIDwgMTI4KSB8fFxuICAgICAgICAgIGVuY29kaW5nID09PSAnbGF0aW4xJykge1xuICAgICAgICAvLyBGYXN0IHBhdGg6IElmIGB2YWxgIGZpdHMgaW50byBhIHNpbmdsZSBieXRlLCB1c2UgdGhhdCBudW1lcmljIHZhbHVlLlxuICAgICAgICB2YWwgPSBjb2RlXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgdmFsID0gdmFsICYgMjU1XG4gIH1cblxuICAvLyBJbnZhbGlkIHJhbmdlcyBhcmUgbm90IHNldCB0byBhIGRlZmF1bHQsIHNvIGNhbiByYW5nZSBjaGVjayBlYXJseS5cbiAgaWYgKHN0YXJ0IDwgMCB8fCB0aGlzLmxlbmd0aCA8IHN0YXJ0IHx8IHRoaXMubGVuZ3RoIDwgZW5kKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ091dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIHN0YXJ0ID0gc3RhcnQgPj4+IDBcbiAgZW5kID0gZW5kID09PSB1bmRlZmluZWQgPyB0aGlzLmxlbmd0aCA6IGVuZCA+Pj4gMFxuXG4gIGlmICghdmFsKSB2YWwgPSAwXG5cbiAgdmFyIGlcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInKSB7XG4gICAgZm9yIChpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgICAgdGhpc1tpXSA9IHZhbFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgYnl0ZXMgPSBCdWZmZXIuaXNCdWZmZXIodmFsKVxuICAgICAgPyB2YWxcbiAgICAgIDogQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoXG4gICAgaWYgKGxlbiA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIHZhbHVlIFwiJyArIHZhbCArXG4gICAgICAgICdcIiBpcyBpbnZhbGlkIGZvciBhcmd1bWVudCBcInZhbHVlXCInKVxuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgZW5kIC0gc3RhcnQ7ICsraSkge1xuICAgICAgdGhpc1tpICsgc3RhcnRdID0gYnl0ZXNbaSAlIGxlbl1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpc1xufVxuXG4vLyBIRUxQRVIgRlVOQ1RJT05TXG4vLyA9PT09PT09PT09PT09PT09XG5cbnZhciBJTlZBTElEX0JBU0U2NF9SRSA9IC9bXisvMC05QS1aYS16LV9dL2dcblxuZnVuY3Rpb24gYmFzZTY0Y2xlYW4gKHN0cikge1xuICAvLyBOb2RlIHRha2VzIGVxdWFsIHNpZ25zIGFzIGVuZCBvZiB0aGUgQmFzZTY0IGVuY29kaW5nXG4gIHN0ciA9IHN0ci5zcGxpdCgnPScpWzBdXG4gIC8vIE5vZGUgc3RyaXBzIG91dCBpbnZhbGlkIGNoYXJhY3RlcnMgbGlrZSBcXG4gYW5kIFxcdCBmcm9tIHRoZSBzdHJpbmcsIGJhc2U2NC1qcyBkb2VzIG5vdFxuICBzdHIgPSBzdHIudHJpbSgpLnJlcGxhY2UoSU5WQUxJRF9CQVNFNjRfUkUsICcnKVxuICAvLyBOb2RlIGNvbnZlcnRzIHN0cmluZ3Mgd2l0aCBsZW5ndGggPCAyIHRvICcnXG4gIGlmIChzdHIubGVuZ3RoIDwgMikgcmV0dXJuICcnXG4gIC8vIE5vZGUgYWxsb3dzIGZvciBub24tcGFkZGVkIGJhc2U2NCBzdHJpbmdzIChtaXNzaW5nIHRyYWlsaW5nID09PSksIGJhc2U2NC1qcyBkb2VzIG5vdFxuICB3aGlsZSAoc3RyLmxlbmd0aCAlIDQgIT09IDApIHtcbiAgICBzdHIgPSBzdHIgKyAnPSdcbiAgfVxuICByZXR1cm4gc3RyXG59XG5cbmZ1bmN0aW9uIHRvSGV4IChuKSB7XG4gIGlmIChuIDwgMTYpIHJldHVybiAnMCcgKyBuLnRvU3RyaW5nKDE2KVxuICByZXR1cm4gbi50b1N0cmluZygxNilcbn1cblxuZnVuY3Rpb24gdXRmOFRvQnl0ZXMgKHN0cmluZywgdW5pdHMpIHtcbiAgdW5pdHMgPSB1bml0cyB8fCBJbmZpbml0eVxuICB2YXIgY29kZVBvaW50XG4gIHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBsZWFkU3Vycm9nYXRlID0gbnVsbFxuICB2YXIgYnl0ZXMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBjb2RlUG9pbnQgPSBzdHJpbmcuY2hhckNvZGVBdChpKVxuXG4gICAgLy8gaXMgc3Vycm9nYXRlIGNvbXBvbmVudFxuICAgIGlmIChjb2RlUG9pbnQgPiAweEQ3RkYgJiYgY29kZVBvaW50IDwgMHhFMDAwKSB7XG4gICAgICAvLyBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCFsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAgIC8vIG5vIGxlYWQgeWV0XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPiAweERCRkYpIHtcbiAgICAgICAgICAvLyB1bmV4cGVjdGVkIHRyYWlsXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIGlmIChpICsgMSA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgLy8gdW5wYWlyZWQgbGVhZFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YWxpZCBsZWFkXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyAyIGxlYWRzIGluIGEgcm93XG4gICAgICBpZiAoY29kZVBvaW50IDwgMHhEQzAwKSB7XG4gICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIHZhbGlkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICBjb2RlUG9pbnQgPSAobGVhZFN1cnJvZ2F0ZSAtIDB4RDgwMCA8PCAxMCB8IGNvZGVQb2ludCAtIDB4REMwMCkgKyAweDEwMDAwXG4gICAgfSBlbHNlIGlmIChsZWFkU3Vycm9nYXRlKSB7XG4gICAgICAvLyB2YWxpZCBibXAgY2hhciwgYnV0IGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICB9XG5cbiAgICBsZWFkU3Vycm9nYXRlID0gbnVsbFxuXG4gICAgLy8gZW5jb2RlIHV0ZjhcbiAgICBpZiAoY29kZVBvaW50IDwgMHg4MCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAxKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKGNvZGVQb2ludClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4ODAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgfCAweEMwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAzKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDIHwgMHhFMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gNCkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4MTIgfCAweEYwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHhDICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNvZGUgcG9pbnQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBieXRlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVRvQnl0ZXMgKHN0cikge1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICAvLyBOb2RlJ3MgY29kZSBzZWVtcyB0byBiZSBkb2luZyB0aGlzIGFuZCBub3QgJiAweDdGLi5cbiAgICBieXRlQXJyYXkucHVzaChzdHIuY2hhckNvZGVBdChpKSAmIDB4RkYpXG4gIH1cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiB1dGYxNmxlVG9CeXRlcyAoc3RyLCB1bml0cykge1xuICB2YXIgYywgaGksIGxvXG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuXG4gICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpXG4gICAgaGkgPSBjID4+IDhcbiAgICBsbyA9IGMgJSAyNTZcbiAgICBieXRlQXJyYXkucHVzaChsbylcbiAgICBieXRlQXJyYXkucHVzaChoaSlcbiAgfVxuXG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gYmFzZTY0VG9CeXRlcyAoc3RyKSB7XG4gIHJldHVybiBiYXNlNjQudG9CeXRlQXJyYXkoYmFzZTY0Y2xlYW4oc3RyKSlcbn1cblxuZnVuY3Rpb24gYmxpdEJ1ZmZlciAoc3JjLCBkc3QsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKGkgKyBvZmZzZXQgPj0gZHN0Lmxlbmd0aCkgfHwgKGkgPj0gc3JjLmxlbmd0aCkpIGJyZWFrXG4gICAgZHN0W2kgKyBvZmZzZXRdID0gc3JjW2ldXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuLy8gQXJyYXlCdWZmZXIgb3IgVWludDhBcnJheSBvYmplY3RzIGZyb20gb3RoZXIgY29udGV4dHMgKGkuZS4gaWZyYW1lcykgZG8gbm90IHBhc3Ncbi8vIHRoZSBgaW5zdGFuY2VvZmAgY2hlY2sgYnV0IHRoZXkgc2hvdWxkIGJlIHRyZWF0ZWQgYXMgb2YgdGhhdCB0eXBlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTY2XG5mdW5jdGlvbiBpc0luc3RhbmNlIChvYmosIHR5cGUpIHtcbiAgcmV0dXJuIG9iaiBpbnN0YW5jZW9mIHR5cGUgfHxcbiAgICAob2JqICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yICE9IG51bGwgJiYgb2JqLmNvbnN0cnVjdG9yLm5hbWUgIT0gbnVsbCAmJlxuICAgICAgb2JqLmNvbnN0cnVjdG9yLm5hbWUgPT09IHR5cGUubmFtZSlcbn1cbmZ1bmN0aW9uIG51bWJlcklzTmFOIChvYmopIHtcbiAgLy8gRm9yIElFMTEgc3VwcG9ydFxuICByZXR1cm4gb2JqICE9PSBvYmogLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zZWxmLWNvbXBhcmVcbn1cbiIsIi8qISBpZWVlNzU0LiBCU0QtMy1DbGF1c2UgTGljZW5zZS4gRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnL29wZW5zb3VyY2U+ICovXG5leHBvcnRzLnJlYWQgPSBmdW5jdGlvbiAoYnVmZmVyLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbVxuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgbkJpdHMgPSAtN1xuICB2YXIgaSA9IGlzTEUgPyAobkJ5dGVzIC0gMSkgOiAwXG4gIHZhciBkID0gaXNMRSA/IC0xIDogMVxuICB2YXIgcyA9IGJ1ZmZlcltvZmZzZXQgKyBpXVxuXG4gIGkgKz0gZFxuXG4gIGUgPSBzICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIHMgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IGVMZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgZSA9IChlICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIG0gPSBlICYgKCgxIDw8ICgtbkJpdHMpKSAtIDEpXG4gIGUgPj49ICgtbkJpdHMpXG4gIG5CaXRzICs9IG1MZW5cbiAgZm9yICg7IG5CaXRzID4gMDsgbSA9IChtICogMjU2KSArIGJ1ZmZlcltvZmZzZXQgKyBpXSwgaSArPSBkLCBuQml0cyAtPSA4KSB7fVxuXG4gIGlmIChlID09PSAwKSB7XG4gICAgZSA9IDEgLSBlQmlhc1xuICB9IGVsc2UgaWYgKGUgPT09IGVNYXgpIHtcbiAgICByZXR1cm4gbSA/IE5hTiA6ICgocyA/IC0xIDogMSkgKiBJbmZpbml0eSlcbiAgfSBlbHNlIHtcbiAgICBtID0gbSArIE1hdGgucG93KDIsIG1MZW4pXG4gICAgZSA9IGUgLSBlQmlhc1xuICB9XG4gIHJldHVybiAocyA/IC0xIDogMSkgKiBtICogTWF0aC5wb3coMiwgZSAtIG1MZW4pXG59XG5cbmV4cG9ydHMud3JpdGUgPSBmdW5jdGlvbiAoYnVmZmVyLCB2YWx1ZSwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG0sIGNcbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIHJ0ID0gKG1MZW4gPT09IDIzID8gTWF0aC5wb3coMiwgLTI0KSAtIE1hdGgucG93KDIsIC03NykgOiAwKVxuICB2YXIgaSA9IGlzTEUgPyAwIDogKG5CeXRlcyAtIDEpXG4gIHZhciBkID0gaXNMRSA/IDEgOiAtMVxuICB2YXIgcyA9IHZhbHVlIDwgMCB8fCAodmFsdWUgPT09IDAgJiYgMSAvIHZhbHVlIDwgMCkgPyAxIDogMFxuXG4gIHZhbHVlID0gTWF0aC5hYnModmFsdWUpXG5cbiAgaWYgKGlzTmFOKHZhbHVlKSB8fCB2YWx1ZSA9PT0gSW5maW5pdHkpIHtcbiAgICBtID0gaXNOYU4odmFsdWUpID8gMSA6IDBcbiAgICBlID0gZU1heFxuICB9IGVsc2Uge1xuICAgIGUgPSBNYXRoLmZsb29yKE1hdGgubG9nKHZhbHVlKSAvIE1hdGguTE4yKVxuICAgIGlmICh2YWx1ZSAqIChjID0gTWF0aC5wb3coMiwgLWUpKSA8IDEpIHtcbiAgICAgIGUtLVxuICAgICAgYyAqPSAyXG4gICAgfVxuICAgIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgdmFsdWUgKz0gcnQgLyBjXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlICs9IHJ0ICogTWF0aC5wb3coMiwgMSAtIGVCaWFzKVxuICAgIH1cbiAgICBpZiAodmFsdWUgKiBjID49IDIpIHtcbiAgICAgIGUrK1xuICAgICAgYyAvPSAyXG4gICAgfVxuXG4gICAgaWYgKGUgKyBlQmlhcyA+PSBlTWF4KSB7XG4gICAgICBtID0gMFxuICAgICAgZSA9IGVNYXhcbiAgICB9IGVsc2UgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICBtID0gKCh2YWx1ZSAqIGMpIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IGUgKyBlQmlhc1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gdmFsdWUgKiBNYXRoLnBvdygyLCBlQmlhcyAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSAwXG4gICAgfVxuICB9XG5cbiAgZm9yICg7IG1MZW4gPj0gODsgYnVmZmVyW29mZnNldCArIGldID0gbSAmIDB4ZmYsIGkgKz0gZCwgbSAvPSAyNTYsIG1MZW4gLT0gOCkge31cblxuICBlID0gKGUgPDwgbUxlbikgfCBtXG4gIGVMZW4gKz0gbUxlblxuICBmb3IgKDsgZUxlbiA+IDA7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IGUgJiAweGZmLCBpICs9IGQsIGUgLz0gMjU2LCBlTGVuIC09IDgpIHt9XG5cbiAgYnVmZmVyW29mZnNldCArIGkgLSBkXSB8PSBzICogMTI4XG59XG4iLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcbmNvbnN0IG1hcERPTT1yZXF1aXJlKFwiLi9tYXBET00uanNcIilcclxuY29uc3QgdHdpbnNUcmVlPXJlcXVpcmUoXCIuL3R3aW5zVHJlZVwiKVxyXG5jb25zdCBzdGFydFNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL3N0YXJ0U2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgcHJvamVjdFNldHRpbmdEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvcHJvamVjdFNldHRpbmdEaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxFZGl0b3JEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZyA9IHJlcXVpcmUoXCIuL2VkaXRMYXlvdXREaWFsb2dcIilcclxuY29uc3QgbWFpblRvb2xiYXIgPSByZXF1aXJlKFwiLi9tYWluVG9vbGJhclwiKVxyXG5jb25zdCBpbmZvUGFuZWw9IHJlcXVpcmUoXCIuL2luZm9QYW5lbFwiKTtcclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vZ2xvYmFsQXBwU2V0dGluZ3MuanNcIik7XHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgbmV3VHdpbkRpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZ1wiKTtcclxuY29uc3QgZmxvYXRJbmZvV2luZG93PXJlcXVpcmUoXCIuL2Zsb2F0SW5mb1dpbmRvd1wiKVxyXG5cclxuZnVuY3Rpb24gZGlnaXRhbHR3aW5tb2R1bGVVSSgpIHtcclxuICAgIHRoaXMuaW5pdFVJTGF5b3V0KClcclxuXHJcbiAgICB0aGlzLnR3aW5zVHJlZT0gbmV3IHR3aW5zVHJlZSgkKFwiI3RyZWVIb2xkZXJcIiksJChcIiN0cmVlU2VhcmNoXCIpKVxyXG4gICAgXHJcbiAgICBtYWluVG9vbGJhci5yZW5kZXIoKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlPW5ldyB0b3BvbG9neURPTSgkKCcjY2FudmFzJykpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2UuaW5pdCgpXHJcblxyXG4gICAgdGhpcy5tYXBET00gPSBuZXcgbWFwRE9NKCQoJyNjYW52YXMnKSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuXHJcbiAgICAvL3RyeSBpZiBpdCBhbHJlYWR5IEIyQyBzaWduZWQgaW4sIGlmIG5vdCBnb2luZyBiYWNrIHRvIHRoZSBzdGFydCBwYWdlXHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG5cclxuXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpO1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbCAmJiAhZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3QpIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuXHJcbiAgICB0aGlzLmluaXREYXRhKClcclxufVxyXG5cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXREYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsc3RhcnRTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIG1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSx0aGlzLm1hcERPTSxpbmZvUGFuZWwsbmV3VHdpbkRpYWxvZyxmbG9hdEluZm9XaW5kb3cscHJvamVjdFNldHRpbmdEaWFsb2ddXHJcblxyXG4gICAgaWYoc291cmNlPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICB0aGlzLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2UodGhlQ29tcG9uZW50KVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIGlmKHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UgJiYgdGhlQ29tcG9uZW50IT1zb3VyY2UpIHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UobXNnUGF5bG9hZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24odWlDb21wb25lbnQpe1xyXG4gICAgdWlDb21wb25lbnQuYnJvYWRjYXN0TWVzc2FnZT0obXNnT2JqKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh1aUNvbXBvbmVudCxtc2dPYmopfVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5pbml0VUlMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbXlMYXlvdXQgPSAkKCdib2R5JykubGF5b3V0KHtcclxuICAgICAgICAvL1x0cmVmZXJlbmNlIG9ubHkgLSB0aGVzZSBvcHRpb25zIGFyZSBOT1QgcmVxdWlyZWQgYmVjYXVzZSAndHJ1ZScgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgICBjbG9zYWJsZTogdHJ1ZVx0Ly8gcGFuZSBjYW4gb3BlbiAmIGNsb3NlXHJcbiAgICAgICAgLCByZXNpemFibGU6IHRydWVcdC8vIHdoZW4gb3BlbiwgcGFuZSBjYW4gYmUgcmVzaXplZCBcclxuICAgICAgICAsIHNsaWRhYmxlOiB0cnVlXHQvLyB3aGVuIGNsb3NlZCwgcGFuZSBjYW4gJ3NsaWRlJyBvcGVuIG92ZXIgb3RoZXIgcGFuZXMgLSBjbG9zZXMgb24gbW91c2Utb3V0XHJcbiAgICAgICAgLCBsaXZlUGFuZVJlc2l6aW5nOiB0cnVlXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHJlc2l6aW5nL3RvZ2dsaW5nIHNldHRpbmdzXHJcbiAgICAgICAgLCBub3J0aF9fc2xpZGFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdzbGlkYWJsZT10cnVlJ1xyXG4gICAgICAgIC8vLCBub3J0aF9fdG9nZ2xlckxlbmd0aF9jbG9zZWQ6ICcxMDAlJ1x0Ly8gdG9nZ2xlLWJ1dHRvbiBpcyBmdWxsLXdpZHRoIG9mIHJlc2l6ZXItYmFyXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19jbG9zZWQ6IDZcdFx0Ly8gYmlnIHJlc2l6ZXItYmFyIHdoZW4gb3BlbiAoemVybyBoZWlnaHQpXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19vcGVuOjBcclxuICAgICAgICAsIG5vcnRoX19yZXNpemFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdyZXNpemFibGU9dHJ1ZSdcclxuICAgICAgICAsIG5vcnRoX19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHBhbmUtc2l6ZSBzZXR0aW5nc1xyXG4gICAgICAgICwgd2VzdF9fbWluU2l6ZTogMTAwXHJcbiAgICAgICAgLCBlYXN0X19zaXplOiAzMDBcclxuICAgICAgICAsIGVhc3RfX21pblNpemU6IDIwMFxyXG4gICAgICAgICwgZWFzdF9fbWF4U2l6ZTogLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICx3ZXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsZWFzdF9faW5pdENsb3NlZDpcdHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICpcdERJU0FCTEUgVEVYVC1TRUxFQ1RJT04gV0hFTiBEUkFHR0lORyAob3IgZXZlbiBfdHJ5aW5nXyB0byBkcmFnISlcclxuICAgICAqXHR0aGlzIGZ1bmN0aW9uYWxpdHkgd2lsbCBiZSBpbmNsdWRlZCBpbiBSQzMwLjgwXHJcbiAgICAgKi9cclxuICAgICQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnXHJcbiAgICAgICAgICAgICwgeCA9ICd0ZXh0U2VsZWN0aW9uSW5pdGlhbGl6ZWQnXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICBpZiAoJC5mbi5kaXNhYmxlU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YSh4KSkgLy8gZG9jdW1lbnQgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICAkZC5vbignbW91c2V1cCcsICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24pLmRhdGEoeCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgICAgICRkLmRpc2FibGVTZWxlY3Rpb24oKS5kYXRhKHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCc7XHJcbiAgICAgICAgaWYgKCQuZm4uZW5hYmxlU2VsZWN0aW9uICYmICRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICRkLmVuYWJsZVNlbGVjdGlvbigpLmRhdGEocywgZmFsc2UpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkKFwiLnVpLWxheW91dC1yZXNpemVyLW5vcnRoXCIpLmhpZGUoKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5jc3MoXCJib3JkZXItcmlnaHRcIixcInNvbGlkIDFweCBsaWdodEdyYXlcIilcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuYWRkQ2xhc3MoXCJ3My1jYXJkXCIpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBkaWdpdGFsdHdpbm1vZHVsZVVJKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0TGF5b3V0RGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDFcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKXtcclxuICAgICAgICB2YXIgb25lTGF5b3V0T2JqPWdsb2JhbENhY2hlLmxheW91dEpTT05baW5kXVxyXG4gICAgICAgIGlmKG9uZUxheW91dE9iai5vd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCIzMjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPkxheW91dDwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjE4MHB4OyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkZpbGwgaW4gYSBuZXcgbGF5b3V0IG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgdmFyIHNhdmVBc05ld0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCI+U2F2ZSBOZXcgTGF5b3V0PC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNOZXdCdG4pXHJcbiAgICBzYXZlQXNOZXdCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChuYW1lSW5wdXQudmFsKCkpfSlcclxuXHJcblxyXG4gICAgaWYoIWpRdWVyeS5pc0VtcHR5T2JqZWN0KGdsb2JhbENhY2hlLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuc2F2ZUludG9MYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzYXZlTGF5b3V0XCIsIFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lfSlcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG59XHJcblxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJDb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTGF5b3V0XCIsIFwiUE9TVFwiLCB7IFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZWRpdExheW91dERpYWxvZygpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKTtcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGZsb2F0SW5mb1dpbmRvdygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6MTBweDsgcG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDE7bWluLWhlaWdodDoxMjBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5oaWRlU2VsZigpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpXCIpXHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5oaWRlU2VsZj1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjBweFwiKSBcclxufVxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNob3dTZWxmPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjI5NXB4XCIpXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7ICAgXHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidG9wb2xvZ3lNb3VzZU91dFwiKXtcclxuICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIil7XHJcbiAgICAgICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCkgIHJldHVybjtcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJsZWZ0XCIsXCItMjAwMHB4XCIpIC8vaXQgaXMgYWx3YXlzIG91dHNpZGUgb2YgYnJvd3NlciBzbyBpdCB3b250IGJsb2NrIG1vdXNlIGFuZCBjYXVzZSBtb3VzZSBvdXRcclxuICAgICAgICB0aGlzLnNob3dTZWxmKClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZG9jdW1lbnRCb2R5V2lkdGg9JCgnYm9keScpLndpZHRoKClcclxuXHJcbiAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKXsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcyxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdLFxyXG4gICAgICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXSxcclxuICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICB2YXIgc291cmNlTW9kZWw9c2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzY3JlZW5YWT0gbXNnUGF5bG9hZC5zY3JlZW5YWVxyXG4gICAgICAgIHZhciB3aW5kb3dMZWZ0PXNjcmVlblhZLngrNTBcclxuXHJcbiAgICAgICAgaWYod2luZG93TGVmdCt0aGlzLkRPTS5vdXRlcldpZHRoKCkrMTA+ZG9jdW1lbnRCb2R5V2lkdGgpIHtcclxuICAgICAgICAgICAgd2luZG93TGVmdD1kb2N1bWVudEJvZHlXaWR0aC10aGlzLkRPTS5vdXRlcldpZHRoKCktMTBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHdpbmRvd1RvcCA9IHNjcmVlblhZLnktdGhpcy5ET00ub3V0ZXJIZWlnaHQoKS01MFxyXG4gICAgICAgIGlmKHdpbmRvd1RvcDw1KSB3aW5kb3dUb3A9NVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyh7XCJsZWZ0XCI6d2luZG93TGVmdCtcInB4XCIsIFwidG9wXCI6d2luZG93VG9wK1wicHhcIn0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtZGFyay1ncmF5JyBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgbWFyZ2luLXJpZ2h0OjVweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSkge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImNvbG9yXCI6XCJncmF5XCIsXCJmb250LXNpemVcIjpcIjlweFwifSlcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcIltlbXB0eV1cIilcclxuICAgICAgICAgICAgfWVsc2UgY29udGVudERPTS50ZXh0KHZhbClcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZmxvYXRJbmZvV2luZG93KCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGJhc2VJbmZvUGFuZWwgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvYmFzZUluZm9QYW5lbFwiKVxyXG5cclxuY2xhc3MgaW5mb1BhbmVsIGV4dGVuZHMgYmFzZUluZm9QYW5lbCB7XHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICBzdXBlcigpXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5oaWRlKClcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjUwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48L2Rpdj4nKSlcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbjEgPSAkKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPjxpIGNsYXNzPVwiZmEgZmEtaW5mby1jaXJjbGUgZmEtMnhcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbjIgPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtXCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSwgdGhpcy5jbG9zZUJ1dHRvbjIpXHJcblxyXG4gICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgYnV0dG9uQW5pbSA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzTWluaW1pemVkKSB0aGlzLm1pbmltaXplV2luZG93KClcclxuICAgICAgICAgICAgZWxzZSB0aGlzLmV4cGFuZFdpbmRvdygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24xLm9uKFwiY2xpY2tcIiwgYnV0dG9uQW5pbSlcclxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uMi5vbihcImNsaWNrXCIsIGJ1dHRvbkFuaW0pXHJcblxyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zdGlvbjphYnNvbHV0ZTt0b3A6NTBweDtoZWlnaHQ6Y2FsYygxMDAlIC0gNTBweCk7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5ob3ZlcigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KVwiKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodGhpcy5jb250aW5lckRPTSlcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzID0gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBtaW5pbWl6ZVdpbmRvdygpIHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICByaWdodDogXCItMjUwcHhcIixcclxuICAgICAgICAgICAgaGVpZ2h0OiBcIjUwcHhcIlxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5pc01pbmltaXplZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwYW5kV2luZG93KCkge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHJpZ2h0OiBcIjBweFwiLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByeE1lc3NhZ2UobXNnUGF5bG9hZCkge1xyXG4gICAgICAgIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJzdGFydFNlbGVjdGlvbkRpYWxvZ19jbG9zZWRcIikge1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuY29udGluZXJET00uaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYWRkQ2xhc3MoXCJ3My1hbmltYXRlLXJpZ2h0XCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcIm1hcEZseWluZ1N0YXJ0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5taW5pbWl6ZVdpbmRvdygpXHJcbiAgICAgICAgfSBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJtYXBGbHlpbmdFbmRcIikge1xyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFdpbmRvdygpXHJcbiAgICAgICAgfSBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJtYXBTZWxlY3RGZWF0dXJlXCIpIHtcclxuICAgICAgICAgICAgaWYgKG1zZ1BheWxvYWQuREJUd2luICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHZhciB0d2luSUQgPSBtc2dQYXlsb2FkLkRCVHdpbi5pZFxyXG4gICAgICAgICAgICAgICAgdmFyIGFkdFR3aW4gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0d2luSURdXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dJbmZvT2ZOb2RlcyhbYWR0VHdpbl0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiIHx8IG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcInNob3dJbmZvSG92ZXJlZEVsZVwiKSB7XHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwgJiYgbXNnUGF5bG9hZC5tZXNzYWdlID09IFwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpIHJldHVybjsgLy90aGUgZmxvYXRpbmcgaW5mbyB3aW5kb3cgd2lsbCBzaG93IG1vdXNlIG92ZXIgZWxlbWVudCBpbmZvcm1hdGlvbiwgZG8gbm90IGNoYW5nZSBpbmZvIHBhbmVsIGNvbnRlbnQgaW4gdGhpcyBjYXNlXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd0luZm9PZk5vZGVzKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0luZm9PZk5vZGVzKGFycikge1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICBpZiAoYXJyID09IG51bGwgfHwgYXJyLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMgPSBbXTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cyA9IGFycjtcclxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgIHZhciBzaW5nbGVFbGVtZW50SW5mbyA9IGFyclswXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKSB7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuXHJcbiAgICAgICAgICAgICAgICAvL2luc3RlYWQgb2YgZHJhdyB0aGUgJGR0SWQsIGRyYXcgZGlzcGxheSBuYW1lIGluc3RlYWRcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLCB7IFwibmFtZVwiOiBzaW5nbGVFbGVtZW50SW5mb1tcImRpc3BsYXlOYW1lXCJdIH0sIFwiMWVtXCIsIFwiMTNweFwiKVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxOYW1lID0gc2luZ2xlRWxlbWVudEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLCBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsIHNpbmdsZUVsZW1lbnRJbmZvLCBbXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaW5zdGVhZCBvZiBkcmF3aW5nIHRoZSBvcmlnaW5hbCBpbmZvbXJhdGlvbiwgZHJhdyBtb3JlIG1lYW5pbmdmdWwgb25lXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdLFwiJG1ldGFkYXRhXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl19LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLCB7IFwiTW9kZWxcIjogc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl0gfSwgXCIxZW1cIiwgXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kID09IFwiJG1vZGVsXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmogPSB7fVxyXG4gICAgICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdID0gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sIHRtcE9iaiwgXCIxZW1cIiwgXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sIHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOiBzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBOYW1lXCI6IHNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIH0sIFwiMWVtXCIsIFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSwge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6IHNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgICAgICB9LCBcIjFlbVwiLCBcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lID0gc2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZU1vZGVsID0gc2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLCB0aGlzLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLCBzb3VyY2VNb2RlbCksIHNpbmdsZUVsZW1lbnRJbmZvLCBbXSlcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIGluZCBpbiBzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmogPSB7fVxyXG4gICAgICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdID0gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sIHRtcE9iaiwgXCIxZW1cIiwgXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXJyLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsIHNvdXJjZU1vZGVsKSB7XHJcbiAgICAgICAgaWYgKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdIHx8ICFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXSkgcmV0dXJuXHJcbiAgICAgICAgcmV0dXJuIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllc1xyXG4gICAgfVxyXG5cclxuICAgIGRyYXdCdXR0b25zKHNlbGVjdFR5cGUpIHtcclxuICAgICAgICB2YXIgaW1wQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2xvdWQtdXBsb2FkLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhY3R1YWxJbXBvcnRUd2luc0J0biA9ICQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgICAgIGlmIChzZWxlY3RUeXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIHJlZnJlc2hCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsYWNrXCI+PGkgY2xhc3M9XCJmYXMgZmEtc3luYy1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICAgICAgdmFyIGV4cEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtZ3JlZW5cIj48aSBjbGFzcz1cImZhcyBmYS1jbG91ZC1kb3dubG9hZC1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sIGV4cEJ0biwgaW1wQnRuLCBhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICAgICAgcmVmcmVzaEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5yZWZyZXNoSW5mb21hdGlvbigpIH0pXHJcbiAgICAgICAgICAgIGV4cEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vZmluZCBvdXQgdGhlIHR3aW5zIGluIHNlbGVjdGlvbiBhbmQgdGhlaXIgY29ubmVjdGlvbnMgKGZpbHRlciBib3RoIHNyYyBhbmQgdGFyZ2V0IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdHdpbnMpXHJcbiAgICAgICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBvcnRTZWxlY3RlZCgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5ET00uaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXknPkNob29zZSB0d2lucyBvciByZWxhdGlvbnNoaXBzIHRvIHZpZXcgaW5mb21yYXRpb248L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4Jz5QcmVzcyBzaGlmdCBrZXkgdG8gZHJhdyBib3ggYW5kIHNlbGVjdCBtdWx0aXBsZSB0d2lucyBpbiB0b3BvbG9neSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3MgY3RybCt6IGFuZCBjdHJsK3kgdG8gdW5kby9yZWRvIGluIHRvcG9sb2d5IHZpZXc7IGN0cmwrcyB0byBzYXZlIGxheW91dDwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3Mgc2hpZnQgb3IgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIHR3aW5zIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjEycHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFwcGVuZChpbXBCdG4sIGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW1wQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyBhY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpOyB9KVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLmNoYW5nZShhc3luYyAoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICAgICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4udmFsKFwiXCIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZiAoc2VsZWN0VHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3RUeXBlID09IFwic2luZ2xlUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDoxMDRweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuKVxyXG4gICAgICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuZGVsZXRlU2VsZWN0ZWQoKSB9KVxyXG4gICAgICAgIH0gZWxzZSBpZiAoc2VsZWN0VHlwZSA9PSBcInNpbmdsZU5vZGVcIiB8fCBzZWxlY3RUeXBlID09IFwibXVsdGlwbGVcIikge1xyXG4gICAgICAgICAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjEwNHB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgICAgIHZhciBjb25uZWN0VG9CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgdG88L2J1dHRvbj4nKVxyXG4gICAgICAgICAgICB2YXIgY29ubmVjdEZyb21CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCBmcm9tPC9idXR0b24+JylcclxuICAgICAgICAgICAgdmFyIHNob3dJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiAgc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICAgICAgdmFyIHNob3dPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBPdXRib3VuZDwvYnV0dG9uPicpXHJcblxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuLCBjb25uZWN0VG9CdG4sIGNvbm5lY3RGcm9tQnRuLCBzaG93SW5ib3VuZEJ0biwgc2hvd091dEJvdW5kQnRuKVxyXG5cclxuICAgICAgICAgICAgc2hvd091dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnNob3dPdXRCb3VuZCgpIH0pXHJcbiAgICAgICAgICAgIHNob3dJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnNob3dJbkJvdW5kKCkgfSlcclxuICAgICAgICAgICAgY29ubmVjdFRvQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0VG9cIiB9KSB9KVxyXG4gICAgICAgICAgICBjb25uZWN0RnJvbUJ0bi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdEZyb21cIiB9KSB9KVxyXG5cclxuICAgICAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmRlbGV0ZVNlbGVjdGVkKCkgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgICAgIHZhciBhcnIgPSB0aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnRbJyRkdElkJ10pIG51bU9mTm9kZSsrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG51bU9mTm9kZSA+IDApIHtcclxuICAgICAgICAgICAgdmFyIHNlbGVjdEluYm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgICAgIHZhciBzZWxlY3RPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgICAgIHZhciBjb3NlTGF5b3V0QnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5DT1NFIFZpZXc8L2J1dHRvbj4nKVxyXG4gICAgICAgICAgICB2YXIgaGlkZUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+SGlkZTwvYnV0dG9uPicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFwcGVuZChzZWxlY3RJbmJvdW5kQnRuLCBzZWxlY3RPdXRCb3VuZEJ0biwgY29zZUxheW91dEJ0biwgaGlkZUJ0bilcclxuXHJcbiAgICAgICAgICAgIHNlbGVjdEluYm91bmRCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZFNlbGVjdEluYm91bmRcIiB9KSB9KVxyXG4gICAgICAgICAgICBzZWxlY3RPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0T3V0Ym91bmRcIiB9KSB9KVxyXG4gICAgICAgICAgICBjb3NlTGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJDT1NFU2VsZWN0ZWROb2Rlc1wiIH0pIH0pXHJcbiAgICAgICAgICAgIGhpZGVCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImhpZGVTZWxlY3RlZE5vZGVzXCIgfSkgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG51bU9mTm9kZSA+IDEpIHtcclxuICAgICAgICAgICAgLy9zb21lIGFkZGl0aW9uYWwgYnV0dG9ucyB3aGVuIHNlbGVjdCBtdWx0aXBsZSBpdGVtc1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucygpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucygpIHtcclxuICAgICAgICB2YXIgbGFiZWwgPSAkKFwiPGxhYmVsIGNsYXNzPSd3My1ncmF5JyBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjVweDt3aWR0aDoyMCU7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPkFycmFuZ2U8L2xhYmVsPlwiKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChsYWJlbClcclxuICAgICAgICB2YXIgYWxpZ25CdXR0b25zVGFibGUgPSAkKFwiPHRhYmxlIHN0eWxlPSdtYXJnaW46MCBhdXRvJz48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcjtmb250LXdlaWdodDpib2xkO2NvbG9yOmRhcmtHcmF5Jz5BTElHTjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48L3RhYmxlPlwiKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhbGlnbkJ1dHRvbnNUYWJsZSlcclxuICAgICAgICB2YXIgYWxpZ25Ub3BCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tdXBcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWxpZ25MZWZ0QnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWxlZnRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWxpZ25SaWdodEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1yaWdodFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhbGlnbkJvdHRvbUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDEpLmFwcGVuZChhbGlnblRvcEJ1dHRvbilcclxuICAgICAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoMykuYXBwZW5kKGFsaWduTGVmdEJ1dHRvbilcclxuICAgICAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoNSkuYXBwZW5kKGFsaWduUmlnaHRCdXR0b24pXHJcbiAgICAgICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChhbGlnbkJvdHRvbUJ1dHRvbilcclxuXHJcblxyXG4gICAgICAgIHZhciBhcnJhbmdlVGFibGUgPSAkKFwiPHRhYmxlIHN0eWxlPSdtYXJnaW46MCBhdXRvJz48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48L3RhYmxlPlwiKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhcnJhbmdlVGFibGUpXHJcblxyXG4gICAgICAgIHZhciBkaXN0cmlidXRlSEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkaXN0cmlidXRlVkJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtdiBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBsZWZ0Um90YXRlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS11bmRvLWFsdCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciByaWdodFJvdGF0ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtcmVkby1hbHQgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgbWlycm9ySEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtYXJyb3dzLWFsdC1oXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIG1pcnJvclZCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWFycm93cy1hbHQtdlwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBhbmRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV4cGFuZC1hcnJvd3MtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbXByZXNzQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1jb21wcmVzcy1hcnJvd3MtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcblxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMCkuYXBwZW5kKGRpc3RyaWJ1dGVIQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGRpc3RyaWJ1dGVWQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMikuYXBwZW5kKGxlZnRSb3RhdGVCdXR0b24pXHJcbiAgICAgICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgzKS5hcHBlbmQocmlnaHRSb3RhdGVCdXR0b24pXHJcbiAgICAgICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg0KS5hcHBlbmQobWlycm9ySEJ1dHRvbilcclxuICAgICAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDUpLmFwcGVuZChtaXJyb3JWQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNikuYXBwZW5kKGV4cGFuZEJ1dHRvbilcclxuICAgICAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChjb21wcmVzc0J1dHRvbilcclxuXHJcblxyXG4gICAgICAgIGFsaWduVG9wQnV0dG9uLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInRvcFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbGlnbkxlZnRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJsZWZ0XCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGFsaWduUmlnaHRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbGlnbkJvdHRvbUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImJvdHRvbVwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGlzdHJpYnV0ZUhCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZGlzdHJpYnV0ZVZCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInZlcnRpY2FsXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGxlZnRSb3RhdGVCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJvdGF0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwibGVmdFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByaWdodFJvdGF0ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicm90YXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBtaXJyb3JIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtaXJyb3JTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgbWlycm9yVkJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWlycm9yU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ2ZXJ0aWNhbFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBleHBhbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiZXhwYW5kXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbXByZXNzQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImNvbXByZXNzXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhc3luYyBleHBvcnRTZWxlY3RlZCgpIHtcclxuICAgICAgICB2YXIgYXJyID0gdGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIHZhciB0d2luVG9CZVN0b3JlZCA9IFtdXHJcbiAgICAgICAgdmFyIHR3aW5JRHMgPSB7fVxyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVyblxyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICB2YXIgYW5FeHBUd2luID0ge31cclxuICAgICAgICAgICAgYW5FeHBUd2luW1wiJG1ldGFkYXRhXCJdID0geyBcIiRtb2RlbFwiOiBlbGVtZW50W1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdIH1cclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbmQgPT0gXCIkbWV0YWRhdGFcIiB8fCBpbmQgPT0gXCIkZXRhZ1wiKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXSA9IGVsZW1lbnRbaW5kXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHR3aW5Ub0JlU3RvcmVkLnB1c2goYW5FeHBUd2luKVxyXG4gICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dID0gMVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkID0gW11cclxuICAgICAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnMgPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIGlmICghcmVsYXRpb25zKSByZXR1cm47XHJcbiAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgICAgICBpZiAodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0ge31cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmQgaW4gb25lUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZCA9PSBcIiRldGFnXCIgfHwgaW5kID09IFwiJHJlbGF0aW9uc2hpcElkXCIgfHwgaW5kID09IFwiJHNvdXJjZUlkXCIgfHwgaW5kID09IFwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqW2luZF0gPSBvbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVBY3Rpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiJHNyY0lkXCI6IG9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOiBvbmVSZWxhdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjogb2JqXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1RvQmVTdG9yZWQucHVzaChvbmVBY3Rpb24pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICB2YXIgZmluYWxKU09OID0geyBcInR3aW5zXCI6IHR3aW5Ub0JlU3RvcmVkLCBcInJlbGF0aW9uc1wiOiByZWxhdGlvbnNUb0JlU3RvcmVkIH1cclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydFR3aW5zRGF0YS5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZE9uZUZpbGUoYUZpbGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpIHtcclxuICAgICAgICB2YXIgaW1wb3J0VHdpbnMgPSBbXVxyXG4gICAgICAgIHZhciBpbXBvcnRSZWxhdGlvbnMgPSBbXVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICAgICAgaWYgKGYudHlwZSAhPSBcImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICAgICAgaWYgKG9iai50d2lucykgaW1wb3J0VHdpbnMgPSBpbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICAgICAgaWYgKG9iai5yZWxhdGlvbnMpIGltcG9ydFJlbGF0aW9ucyA9IGltcG9ydFJlbGF0aW9ucy5jb25jYXQob2JqLnJlbGF0aW9ucylcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvbGRUd2luSUQyTmV3SUQgPSB7fVxyXG4gICAgICAgIGltcG9ydFR3aW5zLmZvckVhY2gob25lVHdpbiA9PiB7XHJcbiAgICAgICAgICAgIHZhciBvbGRJRCA9IG9uZVR3aW5bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICB2YXIgbmV3SUQgPSB1dWlkdjQoKTtcclxuICAgICAgICAgICAgb2xkVHdpbklEMk5ld0lEW29sZElEXSA9IG5ld0lEXHJcbiAgICAgICAgICAgIG9uZVR3aW5bXCIkZHRJZFwiXSA9IG5ld0lEXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGltcG9ydFJlbGF0aW9ucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgb25lUmVsID0gaW1wb3J0UmVsYXRpb25zW2ldXHJcbiAgICAgICAgICAgIGlmIChvbGRUd2luSUQyTmV3SURbb25lUmVsW1wiJHNyY0lkXCJdXSA9PSBudWxsIHx8IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGltcG9ydFJlbGF0aW9ucy5zcGxpY2UoaSwgMSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9uZVJlbFtcIiRzcmNJZFwiXSA9IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dXHJcbiAgICAgICAgICAgICAgICBvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl0gPSBvbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXVxyXG4gICAgICAgICAgICAgICAgb25lUmVsW1wiJHJlbGF0aW9uc2hpcElkXCJdID0gdXVpZHY0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9iYXRjaEltcG9ydFR3aW5zXCIsIFwiUE9TVFwiLCB7IFwidHdpbnNcIjogSlNPTi5zdHJpbmdpZnkoaW1wb3J0VHdpbnMpIH0sIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmUuREJUd2lucyA9IEpTT04ucGFyc2UocmUuREJUd2lucylcclxuICAgICAgICByZS5BRFRUd2lucyA9IEpTT04ucGFyc2UocmUuQURUVHdpbnMpXHJcbiAgICAgICAgcmUuREJUd2lucy5mb3JFYWNoKERCVHdpbiA9PiB7IGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKERCVHdpbikgfSlcclxuICAgICAgICB2YXIgYWR0VHdpbnMgPSBbXVxyXG4gICAgICAgIHJlLkFEVFR3aW5zLmZvckVhY2goQURUVHdpbiA9PiB7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihBRFRUd2luKVxyXG4gICAgICAgICAgICBhZHRUd2lucy5wdXNoKEFEVFR3aW4pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIiwgXCJ0d2luc0luZm9cIjogYWR0VHdpbnMgfSlcclxuXHJcbiAgICAgICAgLy9jb250aW51ZSB0byBpbXBvcnQgcmVsYXRpb25zXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc0ltcG9ydGVkID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY3JlYXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCB7IGFjdGlvbnM6IEpTT04uc3RyaW5naWZ5KGltcG9ydFJlbGF0aW9ucykgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKHJlbGF0aW9uc0ltcG9ydGVkKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogcmVsYXRpb25zSW1wb3J0ZWQgfSlcclxuXHJcbiAgICAgICAgdmFyIG51bU9mVHdpbnMgPSBhZHRUd2lucy5sZW5ndGhcclxuICAgICAgICB2YXIgbnVtT2ZSZWxhdGlvbnMgPSByZWxhdGlvbnNJbXBvcnRlZC5sZW5ndGhcclxuICAgICAgICB2YXIgc3RyID0gXCJBZGQgXCIgKyBudW1PZlR3aW5zICsgXCIgbm9kZVwiICsgKChudW1PZlR3aW5zIDw9IDEpID8gXCJcIiA6IFwic1wiKSArIGAgKGZyb20gJHtpbXBvcnRUd2lucy5sZW5ndGh9KWBcclxuICAgICAgICBzdHIgKz0gXCIgYW5kIFwiICsgbnVtT2ZSZWxhdGlvbnMgKyBcIiByZWxhdGlvbnNoaXBcIiArICgobnVtT2ZSZWxhdGlvbnMgPD0gMSkgPyBcIlwiIDogXCJzXCIpICsgYCAoZnJvbSAke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiNDAwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJJbXBvcnQgUmVzdWx0XCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogc3RyXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWZyZXNoSW5mb21hdGlvbigpIHtcclxuICAgICAgICB2YXIgdHdpbklEcyA9IFtdXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMuZm9yRWFjaChvbmVJdGVtID0+IHsgaWYgKG9uZUl0ZW1bJyRkdElkJ10pIHR3aW5JRHMucHVzaChvbmVJdGVtWyckZHRJZCddKSB9KVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgICAgIHR3aW5zZGF0YS5mb3JFYWNoKG9uZVJlID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0d2luSUQgPSBvbmVSZVsnJGR0SWQnXVxyXG4gICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGluZCBpbiBvbmVSZSkgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVJlW2luZF0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgd2hpbGUgKHR3aW5JRHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgc21hbGxBcnIgPSB0d2luSURzLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy9yZWRyYXcgaW5mb3BhbmVsIGlmIG5lZWRlZFxyXG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGggPT0gMSkgdGhpcy5yeE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGFzeW5jIGRlbGV0ZVNlbGVjdGVkKCkge1xyXG4gICAgICAgIHZhciBhcnIgPSB0aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgICAgICBpZiAoYXJyLmxlbmd0aCA9PSAwKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0FyciA9IFtdXHJcbiAgICAgICAgdmFyIHR3aW5JREFyciA9IFtdXHJcbiAgICAgICAgdmFyIHR3aW5JRHMgPSB7fVxyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dID0gMVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IHJlbGF0aW9uc0Fyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgeyAvL2NsZWFyIHRob3NlIHJlbGF0aW9uc2hpcHMgdGhhdCBhcmUgZ29pbmcgdG8gYmUgZGVsZXRlZCBhZnRlciB0d2lucyBkZWxldGluZ1xyXG4gICAgICAgICAgICB2YXIgc3JjSWQgPSByZWxhdGlvbnNBcnJbaV1bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJZCA9IHJlbGF0aW9uc0FycltpXVsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYgKHR3aW5JRHNbc3JjSWRdICE9IG51bGwgfHwgdHdpbklEc1t0YXJnZXRJZF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmVsYXRpb25zQXJyLnNwbGljZShpLCAxKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgIHZhciBkaWFsb2dTdHIgPSBcIlwiXHJcbiAgICAgICAgdmFyIHR3aW5OdW1iZXIgPSB0d2luSURBcnIubGVuZ3RoO1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNOdW1iZXIgPSByZWxhdGlvbnNBcnIubGVuZ3RoO1xyXG4gICAgICAgIGlmICh0d2luTnVtYmVyID4gMCkgZGlhbG9nU3RyID0gdHdpbk51bWJlciArIFwiIHR3aW5cIiArICgodHdpbk51bWJlciA+IDEpID8gXCJzXCIgOiBcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgICAgICBpZiAodHdpbk51bWJlciA+IDAgJiYgcmVsYXRpb25zTnVtYmVyID4gMCkgZGlhbG9nU3RyICs9IFwiIGFuZCBhZGRpdGlvbmFsIFwiXHJcbiAgICAgICAgaWYgKHJlbGF0aW9uc051bWJlciA+IDApIGRpYWxvZ1N0ciArPSByZWxhdGlvbnNOdW1iZXIgKyBcIiByZWxhdGlvblwiICsgKChyZWxhdGlvbnNOdW1iZXIgPiAxKSA/IFwic1wiIDogXCJcIilcclxuICAgICAgICBkaWFsb2dTdHIgKz0gXCIgd2lsbCBiZSBkZWxldGVkLiBQbGVhc2UgY29uZmlybVwiXHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IGRpYWxvZ1N0clxyXG4gICAgICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgYXdhaXQgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR3aW5JREFyci5sZW5ndGggPiAwKSBhd2FpdCB0aGlzLmRlbGV0ZVR3aW5zKHR3aW5JREFycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZGVsZXRlVHdpbnModHdpbklEQXJyKSB7XHJcbiAgICAgICAgdmFyIGlvVERldmljZXMgPSBbXVxyXG4gICAgICAgIHR3aW5JREFyci5mb3JFYWNoKG9uZVR3aW5JRCA9PiB7XHJcbiAgICAgICAgICAgIHZhciBkYlR3aW5JbmZvID0gZ2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlJRChvbmVUd2luSUQpXHJcbiAgICAgICAgICAgIGlmIChkYlR3aW5JbmZvLklvVERldmljZUlEICE9IG51bGwgJiYgZGJUd2luSW5mby5Jb1REZXZpY2VJRCAhPSBcIlwiKSB7XHJcbiAgICAgICAgICAgICAgICBpb1REZXZpY2VzLnB1c2goZGJUd2luSW5mby5Jb1REZXZpY2VJRClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYgKGlvVERldmljZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBtc2FsSGVscGVyLmNhbGxBUEkoXCJkZXZpY2VtYW5hZ2VtZW50L3VucmVnaXN0ZXJJb1REZXZpY2VzXCIsIFwiUE9TVFwiLCB7IGFycjogaW9URGV2aWNlcyB9KVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHdoaWxlICh0d2luSURBcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgc21hbGxBcnIgPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVR3aW5zXCIsIFwiUE9TVFwiLCB7IGFycjogc21hbGxBcnIgfSwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQuZm9yRWFjaCgob25lSUQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lSURdXHJcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidHdpbnNEZWxldGVkXCIsIHR3aW5JREFycjogcmVzdWx0IH0pXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGRlbGV0ZVJlbGF0aW9ucyhyZWxhdGlvbnNBcnIpIHtcclxuICAgICAgICB2YXIgYXJyID0gW11cclxuICAgICAgICByZWxhdGlvbnNBcnIuZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKHsgc3JjSUQ6IG9uZVJlbGF0aW9uWyckc291cmNlSWQnXSwgcmVsSUQ6IG9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXSB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsIHsgXCJyZWxhdGlvbnNcIjogYXJyIH0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlKGRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlbGF0aW9uc0RlbGV0ZWRcIiwgXCJyZWxhdGlvbnNcIjogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2hvd091dEJvdW5kKCkge1xyXG4gICAgICAgIHZhciBhcnIgPSB0aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgICAgICB2YXIgdHdpbklEQXJyID0gW11cclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHdoaWxlICh0d2luSURBcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB2YXIgc21hbGxBcnIgPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcblxyXG4gICAgICAgICAgICB2YXIga25vd25UYXJnZXRUd2lucyA9IHt9XHJcbiAgICAgICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICAgICAga25vd25UYXJnZXRUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgICAgIHZhciBvdXRCb3VuZFJlbGF0aW9uID0gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgaWYgKG91dEJvdW5kUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBvdXRCb3VuZFJlbGF0aW9uLmZvckVhY2gob25lUmVsYXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICE9IG51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdID0gMVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9xdWVyeU91dEJvdW5kXCIsIFwiUE9TVFwiLCB7IGFycjogc21hbGxBcnIsIFwia25vd25UYXJnZXRzXCI6IGtub3duVGFyZ2V0VHdpbnMgfSlcclxuICAgICAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICAgICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbmVUd2luID0gb25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lVHdpbilcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgc2hvd0luQm91bmQoKSB7XHJcbiAgICAgICAgdmFyIGFyciA9IHRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHR3aW5JREFyci5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICAgICAgdmFyIGtub3duU291cmNlVHdpbnMgPSB7fVxyXG4gICAgICAgICAgICB2YXIgSUREaWN0ID0ge31cclxuICAgICAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgICAgICBJRERpY3Rbb25lSURdID0gMVxyXG4gICAgICAgICAgICAgICAga25vd25Tb3VyY2VUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgZm9yICh2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9ucyA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdXHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNyY0lEID0gb25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKElERGljdFt0YXJnZXRJRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdICE9IG51bGwpIGtub3duU291cmNlVHdpbnNbc3JjSURdID0gMVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5SW5Cb3VuZFwiLCBcIlBPU1RcIiwgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duU291cmNlc1wiOiBrbm93blNvdXJjZVR3aW5zIH0pXHJcbiAgICAgICAgICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb25lVHdpbiA9IG9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdNdWx0aXBsZU9iaigpIHtcclxuICAgICAgICB2YXIgbnVtT2ZFZGdlID0gMDtcclxuICAgICAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgICAgICB2YXIgYXJyID0gdGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICAgICAgaWYgKGFyciA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgbnVtT2ZFZGdlKytcclxuICAgICAgICAgICAgZWxzZSBudW1PZk5vZGUrK1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciB0ZXh0RGl2ID0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjEwcHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdGV4dERpdi50ZXh0KG51bU9mTm9kZSArIFwiIG5vZGVcIiArICgobnVtT2ZOb2RlIDw9IDEpID8gXCJcIiA6IFwic1wiKSArIFwiLCBcIiArIG51bU9mRWRnZSArIFwiIHJlbGF0aW9uc2hpcFwiICsgKChudW1PZkVkZ2UgPD0gMSkgPyBcIlwiIDogXCJzXCIpKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZCh0ZXh0RGl2KVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLCBwYXRoLCBuZXdWYWwsIGRhdGFUeXBlKSB7XHJcbiAgICAgICAgaWYgKFtcImRvdWJsZVwiLCBcImJvb2xlYW5cIiwgXCJmbG9hdFwiLCBcImludGVnZXJcIiwgXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsID0gTnVtYmVyKG5ld1ZhbClcclxuXHJcbiAgICAgICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgdmFyIHN0ciA9IFwiXCJcclxuICAgICAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQgPT4geyBzdHIgKz0gXCIvXCIgKyBzZWdtZW50IH0pXHJcbiAgICAgICAgICAgIHZhciBqc29uUGF0Y2ggPSBbeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBzdHIsIFwidmFsdWVcIjogbmV3VmFsIH1dXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9pdCBpcyBhIHByb3BlcnR5IGluc2lkZSBhIG9iamVjdCB0eXBlIG9mIHJvb3QgcHJvcGVydHksdXBkYXRlIHRoZSB3aG9sZSByb290IHByb3BlcnR5XHJcbiAgICAgICAgICAgIHZhciByb290UHJvcGVydHkgPSBwYXRoWzBdXHJcbiAgICAgICAgICAgIHZhciBwYXRjaFZhbHVlID0gb3JpZ2luRWxlbWVudEluZm9bcm9vdFByb3BlcnR5XVxyXG4gICAgICAgICAgICBpZiAocGF0Y2hWYWx1ZSA9PSBudWxsKSBwYXRjaFZhbHVlID0ge31cclxuICAgICAgICAgICAgZWxzZSBwYXRjaFZhbHVlID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYXRjaFZhbHVlKSkgLy9tYWtlIGEgY29weVxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKHBhdGNoVmFsdWUsIHBhdGguc2xpY2UoMSksIG5ld1ZhbClcclxuXHJcbiAgICAgICAgICAgIHZhciBqc29uUGF0Y2ggPSBbeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi9cIiArIHJvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlIH1dXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSkgeyAvL2VkaXQgYSBub2RlIHByb3BlcnR5XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgICAgIHZhciBwYXlMb2FkID0geyBcImpzb25QYXRjaFwiOiBKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLCBcInR3aW5JRFwiOiB0d2luSUQgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAob3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl0pIHsgLy9lZGl0IGEgcmVsYXRpb25zaGlwIHByb3BlcnR5XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICB2YXIgcGF5TG9hZCA9IHsgXCJqc29uUGF0Y2hcIjogSlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSwgXCJ0d2luSURcIjogdHdpbklELCBcInJlbGF0aW9uc2hpcElEXCI6IHJlbGF0aW9uc2hpcElEIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9jaGFuZ2VBdHRyaWJ1dGVcIiwgXCJQT1NUXCIsIHBheUxvYWQpXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8sIHBhdGgsIG5ld1ZhbClcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShub2RlSW5mbywgcGF0aEFyciwgbmV3VmFsKSB7XHJcbiAgICAgICAgaWYgKHBhdGhBcnIubGVuZ3RoID09IDApIHJldHVybjtcclxuICAgICAgICB2YXIgdGhlSnNvbiA9IG5vZGVJbmZvXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoQXJyLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBrZXkgPSBwYXRoQXJyW2ldXHJcblxyXG4gICAgICAgICAgICBpZiAoaSA9PSBwYXRoQXJyLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoZUpzb25ba2V5XSA9IG5ld1ZhbFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhlSnNvbltrZXldID09IG51bGwpIHRoZUpzb25ba2V5XSA9IHt9XHJcbiAgICAgICAgICAgIHRoZUpzb24gPSB0aGVKc29uW2tleV1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsImNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1vZHVsZVN3aXRjaERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nXCIpXHJcbmNvbnN0IHByb2plY3RTZXR0aW5nRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9wcm9qZWN0U2V0dGluZ0RpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoUHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+UHJvamVjdDwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIC8vdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgLy90aGlzLnNob3dHSVNWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTtmb250LXNpemU6ODAlXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCB3My10ZXh0LWFtYmVyXCI+PC9pPjwvc3Bhbj48L2E+JylcclxuXHJcblxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+VGVzdCBTaWduYWxSPC9hPicpXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIGhyZWY9XCIjXCI+c2VuZCBTaWduYWxSIG1lc3NhZ2U8L2E+JylcclxuXHJcbiAgICB0aGlzLnNldHRpbmdCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiPjxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcblxyXG4gICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIpXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1NpZGViYXIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1N3aXRjaEJ1dHRvbiwgdGhpcy5zd2l0Y2hQcm9qZWN0QnRuLHRoaXMubW9kZWxJT0J0bix0aGlzLnZpZXdUeXBlU2VsZWN0b3IuICBET00sdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sdGhpcy5lZGl0TGF5b3V0QnRuLHRoaXMuZmxvYXRJbmZvQnRuXHJcbiAgICAgICAgLy8sdGhpcy50ZXN0U2lnbmFsUkJ0bix0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0blxyXG4gICAgICAgICx0aGlzLnNldHRpbmdCdG5cclxuICAgIClcclxuXHJcbiAgICB0aGlzLnN3aXRjaFByb2plY3RCdG4ub24oXCJjbGlja1wiLCgpPT57IHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMubW9kZWxJT0J0bi5vbihcImNsaWNrXCIsKCk9PnsgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuc2V0dGluZ0J0bi5vbihcImNsaWNrXCIsKCk9PnsgcHJvamVjdFNldHRpbmdEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsPWZhbHNlXHJcbiAgICAgICAgZWxzZSBnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWw9dHJ1ZVxyXG4gICAgICAgIGlmKCFnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpe1xyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmh0bWwoJzxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1iYW4gZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IGZhLWludmVyc2VcIj48L2k+PC9zcGFuPicpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmFkZENsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4uaHRtbCgnPHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZSBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggdzMtdGV4dC1hbWJlclwiPjwvaT48L3NwYW4+JylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMudGVzdFNlbmRTaWduYWxSQnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIGNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2UoXCJtZXNzYWdlc1wiLFwiUE9TVFwiLHtcclxuICAgICAgICAgICAgcmVjaXBpZW50OiBcIjVlYjgxZjVmLWZkOWUtNDgxZC05OTZiLTRkMGI5NTM2ZjQ3N1wiLFxyXG4gICAgICAgICAgICB0ZXh0OiBcImhvdyBkbyB5b3UgZG9cIlxyXG4gICAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB0aGlzLnRlc3RTaWduYWxSQnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIGNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuICAgICAgICB2YXIgc2lnbmFsUkluZm8gPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2UoXCJuZWdvdGlhdGU/bmFtZT1mZlwiLFwiR0VUXCIpXHJcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBzaWduYWxSLkh1YkNvbm5lY3Rpb25CdWlsZGVyKClcclxuICAgICAgICAud2l0aFVybChzaWduYWxSSW5mby51cmwsIHthY2Nlc3NUb2tlbkZhY3Rvcnk6ICgpID0+IHNpZ25hbFJJbmZvLmFjY2Vzc1Rva2VufSlcclxuICAgICAgICAvLy5jb25maWd1cmVMb2dnaW5nKHNpZ25hbFIuTG9nTGV2ZWwuSW5mb3JtYXRpb24pXHJcbiAgICAgICAgLmNvbmZpZ3VyZUxvZ2dpbmcoc2lnbmFsUi5Mb2dMZXZlbC5XYXJuaW5nKVxyXG4gICAgICAgIC5idWlsZCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHNpZ25hbFJJbmZvLmFjY2Vzc1Rva2VuKVxyXG5cclxuICAgICAgICBjb25uZWN0aW9uLm9uKCduZXdNZXNzYWdlJywgKG1lc3NhZ2UpPT57XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKG1lc3NhZ2UpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5vbmNsb3NlKCgpID0+IGNvbnNvbGUubG9nKCdkaXNjb25uZWN0ZWQnKSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2Nvbm5lY3RpbmcuLi4nKTtcclxuICAgICAgICBjb25uZWN0aW9uLnN0YXJ0KClcclxuICAgICAgICAgIC50aGVuKCgpID0+IGNvbnNvbGUubG9nKCdjb25uZWN0ZWQhJykpXHJcbiAgICAgICAgICAuY2F0Y2goY29uc29sZS5lcnJvcik7XHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci5hZGRPcHRpb24oJ1RvcG9sb2d5JylcclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci5hZGRPcHRpb24oJ0dJUycpXHJcbiAgICB0aGlzLnZpZXdUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljayl7XHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRWaWV3VHlwZSA9PSBvcHRpb25UZXh0KSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpZXdUeXBlQ2hhbmdlXCIsXCJ2aWV3VHlwZVwiOm9wdGlvblRleHR9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50Vmlld1R5cGU9b3B0aW9uVGV4dFxyXG4gICAgfVxyXG4gICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShcIlRvcG9sb2d5XCIpXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKGNob29zZUxheW91dE5hbWUpIHtcclxuICAgIHZhciBjdXJTZWxlY3Q9Y2hvb3NlTGF5b3V0TmFtZXx8dGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWxcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKCdbTm8gTGF5b3V0IFNwZWNpZmllZF0nLCdbTkFdJylcclxuXHJcbiAgICBmb3IgKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikge1xyXG4gICAgICAgIHZhciBvbmVMYXlvdXRPYmo9Z2xvYmFsQ2FjaGUubGF5b3V0SlNPTltpbmRdXHJcbiAgICAgICAgaWYob25lTGF5b3V0T2JqLm93bmVyPT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCl7XHJcbiAgICAgICAgaWYodGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5maW5kT3B0aW9uKGN1clNlbGVjdCk9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsY3VyU2VsZWN0KVxyXG4gICAgfVxyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dHNVcGRhdGVkXCIpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dFNlbGVjdG9yKG1zZ1BheWxvYWQuc2VsZWN0TGF5b3V0KVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInBvcHVwTGF5b3V0RWRpdGluZ1wiKXtcclxuICAgICAgICBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbWFpblRvb2xiYXIoKTsiLCJjb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbWFwRE9NKGNvbnRhaW5lckRPTSl7XHJcbiAgICB0aGlzLkRPTT0kKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCU7d2lkdGg6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICBjb250YWluZXJET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcblxyXG4gICAgdGhpcy5zdWJzY3JpcHRpb25LZXk9XCJqbVFiX2NqamdwRVhxMXdCNmVSanNRSG9qVWZJMlh4Z1VwYkFoaUZxQnRjXCJcclxuICAgIHRoaXMuZGF0YVNldElkPSBcImU2ZmNiZjgzLWFjMzMtY2NhYi1mMjc3LTM4OGE0OTI1NGU4ZFwiXHJcbiAgICB0aGlzLnRpbGVTZXRJZD1cIjhhOWIwMmU5LWRiMDQtMjc4NC1kYzM4LTliMzFjNTIxNjBmMlwiXHJcblxyXG4gICAgdGhpcy5tYXAgPSBuZXcgYXRsYXMuTWFwKHRoaXMuRE9NWzBdLCB7XHJcbiAgICAgICAgY2VudGVyOiAgWzEwMy44Mzk0MjY2LCAxLjMxNDQ4MDUzXSxcclxuICAgICAgICB6b29tOiAxNSxcclxuICAgICAgICBzdHlsZTogJ3JvYWRfc2hhZGVkX3JlbGllZicsXHJcbiAgICAgICAgdmlldzogJ0F1dG8nLFxyXG4gICAgICAgIGF1dGhPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIGF1dGhUeXBlOiAnc3Vic2NyaXB0aW9uS2V5JyxcclxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uS2V5OiB0aGlzLnN1YnNjcmlwdGlvbktleVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMubWFwLmV2ZW50cy5hZGQoJ3JlYWR5JywgKCk9PiB7dGhpcy5pbml0TWFwKCl9KVxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmluaXRNYXA9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubWFwRGF0YVNvdXJjZSA9IG5ldyBhdGxhcy5zb3VyY2UuRGF0YVNvdXJjZShcInR3aW5Qb2x5Z29uXCIpO1xyXG5cclxuICAgIC8vQWRkIGEgbWFwIHN0eWxlIHNlbGVjdGlvbiBjb250cm9sLlxyXG4gICAgdGhpcy5tYXAuY29udHJvbHMuYWRkKG5ldyBhdGxhcy5jb250cm9sLlN0eWxlQ29udHJvbCh7IG1hcFN0eWxlczogXCJhbGxcIiB9KSwgeyBwb3NpdGlvbjogXCJ0b3AtcmlnaHRcIiB9KTtcclxuICAgIC8vQ3JlYXRlIGFuIGluZG9vciBtYXBzIG1hbmFnZXIuXHJcbiAgICB0aGlzLmluZG9vck1hbmFnZXIgPSBuZXcgYXRsYXMuaW5kb29yLkluZG9vck1hbmFnZXIodGhpcy5tYXAsIHt0aWxlc2V0SWQ6IHRoaXMudGlsZVNldElkfSk7XHJcbiAgICB0aGlzLmluZG9vck1hbmFnZXIuc2V0T3B0aW9ucyh7bGV2ZWxDb250cm9sOiBuZXcgYXRsYXMuY29udHJvbC5MZXZlbENvbnRyb2woeyBwb3NpdGlvbjogJ3RvcC1yaWdodCcgfSkgfSk7XHJcbiAgICB0aGlzLmluZG9vck1hbmFnZXIuc2V0RHluYW1pY1N0eWxpbmcoZmFsc2UpXHJcblxyXG4gICAgdGhpcy5tYXAuZXZlbnRzLmFkZChcImNsaWNrXCIsICAoZSk9PiB7XHJcbiAgICAgICAgdmFyIGZlYXR1cmVzID0gdGhpcy5tYXAubGF5ZXJzLmdldFJlbmRlcmVkU2hhcGVzKGUucG9zaXRpb24sICd1bml0Jyk7XHJcbiAgICAgICAgaWYoZmVhdHVyZXMubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHJlc3VsdERCVHdpbj1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQlR3aW5CeUluZG9vckZlYXR1cmVJRChmZWF0dXJlc1swXS5wcm9wZXJ0aWVzLmZlYXR1cmVJZClcclxuICAgICAgICBpZihyZXN1bHREQlR3aW4hPW51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodFR3aW5zKFtyZXN1bHREQlR3aW5dKVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtYXBTZWxlY3RGZWF0dXJlXCIsXCJEQlR3aW5cIjpyZXN1bHREQlR3aW59KVxyXG4gICAgICAgIH0gXHJcbiAgICB9KTtcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5jb21wbGV0ZVVSTD1mdW5jdGlvbihhcGlQYXJ0KXtcclxuICAgIHJldHVybiAnaHR0cHM6Ly91cy5hdGxhcy5taWNyb3NvZnQuY29tLycrYXBpUGFydCsnYXBpLXZlcnNpb249Mi4wJnN1YnNjcmlwdGlvbi1rZXk9Jyt0aGlzLnN1YnNjcmlwdGlvbktleVxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aWV3VHlwZUNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnZpZXdUeXBlPT1cIkdJU1wiKSB0aGlzLnNob3dTZWxmKClcclxuICAgICAgICBlbHNlIHRoaXMuaGlkZVNlbGYoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXtcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50Vmlld1R5cGUhPVwiR0lTXCIpIHJldHVybjtcclxuICAgICAgICB2YXIgc2VsZWN0ZWRUd2luc0Fycj1tc2dQYXlsb2FkLmluZm8gLy90aGUgbGFzdCBpdGVtIGlzIHRoZSBsYXRlc3Qgc2VsZWN0ZWQgaXRlbVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBzZWxlY3RlZERCVHdpbnM9W11cclxuICAgICAgICBzZWxlY3RlZFR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICAgICAgdmFyIHR3aW5JRD1hVHdpblsnJGR0SWQnXVxyXG4gICAgICAgICAgICBpZighdHdpbklEKSByZXR1cm47XHJcbiAgICAgICAgICAgIHZhciB0aGVEQlR3aW49Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlJRCh0d2luSUQpXHJcbiAgICAgICAgICAgIHNlbGVjdGVkREJUd2lucy5wdXNoKHRoZURCVHdpbilcclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0VHdpbnMoc2VsZWN0ZWREQlR3aW5zKVxyXG4gICAgfVxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmhpZ2hsaWdodFR3aW5zID0gZnVuY3Rpb24gKGRiVHdpbnMpIHtcclxuICAgIGlmKGRiVHdpbnMubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgbGF0ZXN0REJUd2luPSBkYlR3aW5zW2RiVHdpbnMubGVuZ3RoLTFdXHJcbiAgICBcclxuICAgIC8vaGlkZSBhbGwgdHdpbnMgaGlnaGxpZ2h0IGluIEdJU1xyXG4gICAgdGhpcy5tYXBEYXRhU291cmNlLmNsZWFyKClcclxuICAgIGlmKCFsYXRlc3REQlR3aW4uR0lTKSByZXR1cm47XHJcbiAgICBcclxuICAgIC8vaWYgdGhlcmUgaXMgYSBmYWNpbGl0eSBjaGFuZ2UsIHRoZXJlIGlzIGFuIGFuaW1hdGlvbiB0byBwYW4gbWFwLCBvdGhlcndpc2UsIGRvbm90IHBhbiBtYXBcclxuICAgIHZhciBpbmZvPXRoaXMuaW5kb29yTWFuYWdlci5nZXRDdXJyZW50RmFjaWxpdHkoKVxyXG4gICAgdmFyIGN1ckZhY2lsaXR5PWluZm9bMF1cclxuICAgIHZhciBjdXJMZXZlbE51bWJlcj0gaW5mb1sxXVxyXG4gICAgdmFyIGRlc3RGYWNpbGl0eT1sYXRlc3REQlR3aW4uR0lTLmluZG9vci5mYWNpbGl0eUlEXHJcbiAgICBpZihjdXJGYWNpbGl0eSE9ZGVzdEZhY2lsaXR5KXtcclxuICAgICAgICB2YXIgY29vcmRpbmF0ZXM9IGxhdGVzdERCVHdpbi5HSVMuaW5kb29yLmNvb3JkaW5hdGVzXHJcbiAgICAgICAgdmFyIGRlc3RMTD1jb29yZGluYXRlc1swXVswXVxyXG4gICAgICAgIHRoaXMuZmx5VG8oZGVzdExMKVxyXG4gICAgfVxyXG4gICAgLy9jaG9vc2UgdGhlIGZhY2lsaXR5IGFuZCBsZXZlbCBudW1iZXJcclxuICAgIGlmKGRlc3RGYWNpbGl0eSE9Y3VyRmFjaWxpdHkgfHwgY3VyTGV2ZWxOdW1iZXIhPWxhdGVzdERCVHdpbi5HSVMuaW5kb29yLmxldmVsT3JkaW5hbCl7XHJcbiAgICAgICAgdGhpcy5pbmRvb3JNYW5hZ2VyLnNldEZhY2lsaXR5KGRlc3RGYWNpbGl0eSxsYXRlc3REQlR3aW4uR0lTLmluZG9vci5sZXZlbE9yZGluYWwgKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvL2hpZ2hsaWdodCBhbGwgc2VsZWN0ZWQgdHdpbnMgaW4gR0lTXHJcbiAgICBkYlR3aW5zLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgdGhpcy5kcmF3T25lVHdpbkluZG9vclBvbHlnb24ob25lREJUd2luLkdJUy5pbmRvb3IuY29vcmRpbmF0ZXMpXHJcbiAgICB9KVxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmRyYXdPbmVUd2luSW5kb29yUG9seWdvbiA9IGZ1bmN0aW9uIChjb29yZGluYXRlcykge1xyXG4gICAgaWYoIXRoaXMubWFwLnNvdXJjZXMuZ2V0QnlJZChcInR3aW5Qb2x5Z29uXCIpKXtcclxuICAgICAgICB0aGlzLm1hcC5zb3VyY2VzLmFkZCh0aGlzLm1hcERhdGFTb3VyY2UpO1xyXG4gICAgICAgIHRoaXMubWFwLmxheWVycy5hZGQobmV3IGF0bGFzLmxheWVyLlBvbHlnb25MYXllcih0aGlzLm1hcERhdGFTb3VyY2UsIG51bGwsIHtcclxuICAgICAgICAgICAgZmlsbENvbG9yOiBcInJlZFwiLFxyXG4gICAgICAgICAgICBmaWxsT3BhY2l0eTogMC43XHJcbiAgICAgICAgfSkpXHJcbiAgICB9IFxyXG4gICAgdGhpcy5tYXBEYXRhU291cmNlLmFkZChuZXcgYXRsYXMuU2hhcGUobmV3IGF0bGFzLmRhdGEuRmVhdHVyZShcclxuICAgICAgICBuZXcgYXRsYXMuZGF0YS5Qb2x5Z29uKGNvb3JkaW5hdGVzKVxyXG4gICAgKSkpO1xyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmZseVRvID0gZnVuY3Rpb24gKGRlc3RMTCkge1xyXG4gICAgdmFyIGN1ckxvYz10aGlzLm1hcC5nZXRDYW1lcmEoKS5jZW50ZXJcclxuXHJcbiAgICBpZihkZXN0TExbMF08Y3VyTG9jWzBdKSB2YXIgdGFyZ2V0Qm91bmRzPVtkZXN0TExbMF0sZGVzdExMWzFdLGN1ckxvY1swXSxjdXJMb2NbMV1dXHJcbiAgICBlbHNlIHRhcmdldEJvdW5kcz1bY3VyTG9jWzBdLGN1ckxvY1sxXSwgZGVzdExMWzBdLGRlc3RMTFsxXV1cclxuXHJcbiAgICB0aGlzLm1hcC5zZXRDYW1lcmEoe1wiYm91bmRzXCI6dGFyZ2V0Qm91bmRzLFxyXG4gICAgICAgIFwicGFkZGluZ1wiOnt0b3A6IDgwLCBib3R0b206IDgwLCBsZWZ0OiA4MCwgcmlnaHQ6IDgwfSxcclxuICAgIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtYXBGbHlpbmdTdGFydFwifSlcclxuXHJcbiAgICB2YXIgbWFya2VyID0gbmV3IGF0bGFzLkh0bWxNYXJrZXIoe2NvbG9yOiAnRG9kZ2VyQmx1ZScsdGV4dDogJycscG9zaXRpb246Y3VyTG9jfSk7XHJcbiAgICB0aGlzLm1hcC5tYXJrZXJzLmFkZChtYXJrZXIpO1xyXG4gICAgdmFyIHBhdGggPSBbXHJcbiAgICAgICAgY3VyTG9jLGRlc3RMTFxyXG4gICAgXTtcclxuICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICBhdGxhcy5hbmltYXRpb25zLm1vdmVBbG9uZ1BhdGgocGF0aCwgbWFya2VyLCB7IGR1cmF0aW9uOiAxMDAwLCBjYXB0dXJlTWV0YWRhdGE6IHRydWUsIGF1dG9QbGF5OiB0cnVlIH0pO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWFwRmx5aW5nRW5kXCJ9KVxyXG4gICAgICAgICAgICB0aGlzLm1hcC5zZXRDYW1lcmEoe1xyXG4gICAgICAgICAgICAgICAgXCJjZW50ZXJcIjogZGVzdExMLFxyXG4gICAgICAgICAgICAgICAgXCJ6b29tXCI6IDE5LFxyXG4gICAgICAgICAgICAgICAgXCJkdXJhdGlvblwiOiAyMDAwLFxyXG4gICAgICAgICAgICAgICAgXCJ0eXBlXCI6IFwiZmx5XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKT0+e3RoaXMubWFwLm1hcmtlcnMuY2xlYXIoKX0sMzUwMClcclxuICAgICAgICB9LDEwMDApXHJcbiAgICAgICAgXHJcbiAgICB9LDEwMDApIFxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmdldERpc3RhbmNlRnJvbUxhdExvbkluS20gPSBmdW5jdGlvbiAobG9ubGF0MSwgbG9ubGF0Mikge1xyXG4gICAgdmFyIGxvbjE9bG9ubGF0MVswXVxyXG4gICAgdmFyIGxhdDE9bG9ubGF0MVsxXVxyXG4gICAgdmFyIGxvbjI9bG9ubGF0MlswXVxyXG4gICAgdmFyIGxhdDI9bG9ubGF0MlsxXVxyXG5cclxuICAgIHZhciBSID0gNjM3MTsgLy8gUmFkaXVzIG9mIHRoZSBlYXJ0aCBpbiBrbVxyXG4gICAgdmFyIGRMYXQgPSB0aGlzLmRlZzJyYWQobGF0MiAtIGxhdDEpOyAgLy8gZGVnMnJhZCBiZWxvd1xyXG4gICAgdmFyIGRMb24gPSB0aGlzLmRlZzJyYWQobG9uMiAtIGxvbjEpO1xyXG4gICAgdmFyIGEgPVxyXG4gICAgICAgIE1hdGguc2luKGRMYXQgLyAyKSAqIE1hdGguc2luKGRMYXQgLyAyKSArXHJcbiAgICAgICAgTWF0aC5jb3ModGhpcy5kZWcycmFkKGxhdDEpKSAqIE1hdGguY29zKHRoaXMuZGVnMnJhZChsYXQyKSkgKlxyXG4gICAgICAgIE1hdGguc2luKGRMb24gLyAyKSAqIE1hdGguc2luKGRMb24gLyAyKVxyXG4gICAgICAgIDtcclxuICAgIHZhciBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTtcclxuICAgIHZhciBkID0gUiAqIGM7IC8vIERpc3RhbmNlIGluIGttXHJcbiAgICByZXR1cm4gZDtcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5kZWcycmFkID0gZnVuY3Rpb24gKGRlZykge1xyXG4gICAgcmV0dXJuIGRlZyAqIChNYXRoLlBJIC8gMTgwKVxyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLnNob3dTZWxmID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5hbmltYXRlKHtoZWlnaHQ6IFwiMTAwJVwifSwoKT0+e3RoaXMubWFwLnJlc2l6ZSgpfSk7XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuaGlkZVNlbGYgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB0aGlzLkRPTS5hbmltYXRlKHtoZWlnaHQ6IFwiMCVcIn0sKCk9Pnt0aGlzLkRPTS5oaWRlKCl9KTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBtYXBET007IiwiY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGVkaXRQcm9qZWN0RGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9lZGl0UHJvamVjdERpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKVxyXG5cclxuZnVuY3Rpb24gc3RhcnRTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2ODBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPlNlbGVjdCBUd2luczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlciA9ICQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmJ1dHRvbkhvbGRlcilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJhcHBlbmRcIilcclxuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKCkgXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByb3cxPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MSlcclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7XCI+UHJvamVjdCA8L2Rpdj4nKVxyXG4gICAgcm93MS5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgc3dpdGNoUHJvamVjdFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn19KVxyXG4gICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3I9c3dpdGNoUHJvamVjdFNlbGVjdG9yXHJcbiAgICByb3cxLmFwcGVuZChzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuRE9NKVxyXG4gICAgdmFyIGpvaW5lZFByb2plY3RzPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmpvaW5lZFByb2plY3RzXHJcbiAgICBqb2luZWRQcm9qZWN0cy5mb3JFYWNoKGFQcm9qZWN0PT57XHJcbiAgICAgICAgdmFyIHN0ciA9IGFQcm9qZWN0Lm5hbWVcclxuICAgICAgICBpZihhUHJvamVjdC5vd25lciE9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uYWNjb3VudElEKSBzdHIrPVwiIChmcm9tIFwiK2FQcm9qZWN0Lm93bmVyK1wiKVwiXHJcbiAgICAgICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLmFkZE9wdGlvbihzdHIsYVByb2plY3QuaWQpXHJcbiAgICB9KVxyXG4gICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIHN3aXRjaFByb2plY3RTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VQcm9qZWN0KG9wdGlvblZhbHVlKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZWRpdFByb2plY3RCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdCBmYS1sZ1wiPjwvaT48L2E+JylcclxuICAgIHRoaXMuZGVsZXRlUHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2E+JylcclxuICAgIHRoaXMubmV3UHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYT4nKVxyXG4gICAgcm93MS5hcHBlbmQodGhpcy5lZGl0UHJvamVjdEJ0bix0aGlzLmRlbGV0ZVByb2plY3RCdG4sdGhpcy5uZXdQcm9qZWN0QnRuKVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD00MDBcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjI2MHB4O3BhZGRpbmctcmlnaHQ6NXB4O292ZXJmbG93OmhpZGRlblwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZy10b3A6MTBweDtcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jYXJkXCIgc3R5bGU9XCJjb2xvcjpncmF5O2hlaWdodDonKyhwYW5lbEhlaWdodC0xMCkrJ3B4O292ZXJmbG93OmF1dG87d2lkdGg6MzkwcHg7XCI+PC9kaXY+JykpXHJcbiAgICB2YXIgc2VsZWN0ZWRUd2luc0RPTT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgc2VsZWN0ZWRUd2luc0RPTS5jc3Moe1wiYm9yZGVyLWNvbGxhcHNlXCI6XCJjb2xsYXBzZVwifSlcclxuICAgIHJpZ2h0U3Bhbi5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHNlbGVjdGVkVHdpbnNET00pXHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET009c2VsZWN0ZWRUd2luc0RPTSBcclxuXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cInBhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q2hvb3NlIHR3aW5zLi4uPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoxNDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPmNob29zZSB0d2lucyBvZiBvbmUgb3IgbW9yZSBtb2RlbHM8L3A+PC9kaXY+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzPSQoJzxmb3JtIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWJvcmRlclwiIHN0eWxlPVwiaGVpZ2h0OicrKHBhbmVsSGVpZ2h0LTQwKSsncHg7b3ZlcmZsb3c6YXV0b1wiPjwvZm9ybT4nKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKHRoaXMubW9kZWxzQ2hlY2tCb3hlcylcclxuICAgIFxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdCE9bnVsbCl7XHJcbiAgICAgICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZSh0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0KVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgfVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2hvb3NlUHJvamVjdCA9IGFzeW5jIGZ1bmN0aW9uIChzZWxlY3RlZFByb2plY3RJRCkge1xyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIuZW1wdHkoKVxyXG5cclxuICAgIHZhciBwcm9qZWN0SW5mbz1nbG9iYWxDYWNoZS5maW5kUHJvamVjdEluZm8oc2VsZWN0ZWRQcm9qZWN0SUQpXHJcbiAgICBpZihwcm9qZWN0SW5mby5vd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uYWNjb3VudElEKXtcclxuICAgICAgICB0aGlzLmVkaXRQcm9qZWN0QnRuLnNob3coKVxyXG4gICAgICAgIHRoaXMuZGVsZXRlUHJvamVjdEJ0bi5zaG93KClcclxuICAgICAgICB0aGlzLmVkaXRQcm9qZWN0QnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyBlZGl0UHJvamVjdERpYWxvZy5wb3B1cChwcm9qZWN0SW5mbykgfSlcclxuICAgICAgICB0aGlzLmRlbGV0ZVByb2plY3RCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9kZWxldGVQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHtcInByb2plY3RJRFwiOnNlbGVjdGVkUHJvamVjdElEfSlcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmVkaXRQcm9qZWN0QnRuLmhpZGUoKVxyXG4gICAgICAgIHRoaXMuZGVsZXRlUHJvamVjdEJ0bi5oaWRlKClcclxuICAgIH1cclxuICAgIHRoaXMubmV3UHJvamVjdEJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICB2YXIgdHNTdHI9KG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoKSkgXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIG5ld1Byb2plY3RJbmZvID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvbmV3UHJvamVjdFRvXCIsIFwiUE9TVFwiLCB7IFwicHJvamVjdE5hbWVcIjogXCJOZXcgUHJvamVjdCBcIiArIHRzU3RyIH0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLmFjY291bnRJbmZvLmpvaW5lZFByb2plY3RzLnVuc2hpZnQobmV3UHJvamVjdEluZm8pXHJcbiAgICAgICAgICAgIHRoaXMuc3dpdGNoUHJvamVjdFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICAgICAgICAgIHZhciBqb2luZWRQcm9qZWN0cyA9IGdsb2JhbENhY2hlLmFjY291bnRJbmZvLmpvaW5lZFByb2plY3RzXHJcbiAgICAgICAgICAgIGpvaW5lZFByb2plY3RzLmZvckVhY2goYVByb2plY3QgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHN0ciA9IGFQcm9qZWN0Lm5hbWVcclxuICAgICAgICAgICAgICAgIGlmKGFQcm9qZWN0Lm93bmVyIT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5hY2NvdW50SUQpIHN0cis9XCIgKGZyb20gXCIrYVByb2plY3Qub3duZXIrXCIpXCJcclxuICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoUHJvamVjdFNlbGVjdG9yLmFkZE9wdGlvbihzdHIsIGFQcm9qZWN0LmlkKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAvL05PVEU6IG11c3QgcXVlcnkgdGhlIG5ldyBqb2luZWQgcHJvamVjdHMgSldUIHRva2VuIGFnYWluXHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIucmVsb2FkVXNlckFjY291bnREYXRhKClcclxuICAgICAgICAgICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICByZXR1cm5cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgXHJcblxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdD09bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtaG92ZXItZGVlcC1vcmFuZ2UgdzMtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+U3RhcnQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJyZXBsYWNlXCIpIH0pXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24pXHJcbiAgICB9ZWxzZSBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0ID09IHNlbGVjdGVkUHJvamVjdElEKXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICB2YXIgYXBwZW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkFwcGVuZCBEYXRhPC9idXR0b24+JylcclxuICAgIFxyXG4gICAgICAgIHJlcGxhY2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJyZXBsYWNlXCIpIH0pXHJcbiAgICAgICAgYXBwZW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwiYXBwZW5kXCIpIH0pXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKGFwcGVuZEJ1dHRvbixyZXBsYWNlQnV0dG9uKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbilcclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLmN1cnJlbnRQcm9qZWN0SUQgPSBzZWxlY3RlZFByb2plY3RJRFxyXG5cclxuICAgIHZhciBwcm9qZWN0T3duZXI9cHJvamVjdEluZm8ub3duZXJcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdE1vZGVsc0RhdGFcIiwgXCJQT1NUXCIsIG51bGwsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGEocmVzLkRCTW9kZWxzLCByZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgICAgIHZhciByZXMgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFByb2plY3RUd2luc0FuZFZpc3VhbERhdGFcIiwgXCJQT1NUXCIsIHtcInByb2plY3RPd25lclwiOnByb2plY3RPd25lcn0sIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdFR3aW5zQW5kVmlzdWFsRGF0YShyZXMpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5maWxsQXZhaWxhYmxlTW9kZWxzKClcclxuICAgIHRoaXMubGlzdFR3aW5zKClcclxufVxyXG5cclxuXHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZmlsbEF2YWlsYWJsZU1vZGVscyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmVtcHR5KClcclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJBTExcIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+PGI+QUxMPC9iPjwvbGFiZWw+PHAvPicpXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57XHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZT1vbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b25lTW9kZWxbXCJpZFwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoYDxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCIke21vZGVsSUR9XCI+PGxhYmVsIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweFwiPiR7bW9kZWxOYW1lfTwvbGFiZWw+PHAvPmApXHJcbiAgICB9KVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLm9uKFwiY2hhbmdlXCIsKGV2dCk9PntcclxuICAgICAgICBpZigkKGV2dC50YXJnZXQpLmF0dHIoXCJpZFwiKT09XCJBTExcIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB0aGUgb3RoZXIgaW5wdXRcclxuICAgICAgICAgICAgdmFyIHZhbD0kKGV2dC50YXJnZXQpLnByb3AoXCJjaGVja2VkXCIpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykucHJvcChcImNoZWNrZWRcIix2YWwpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxpc3RUd2lucygpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRUd2lucz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlQXJyPVtdXHJcbiAgICB2YXIgY2hvc2VuTW9kZWxzPXt9XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuY2hpbGRyZW4oJ2lucHV0JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYoISQodGhpcykucHJvcChcImNoZWNrZWRcIikpIHJldHVybjtcclxuICAgICAgICBpZigkKHRoaXMpLmF0dHIoXCJpZFwiKT09XCJBTExcIikgcmV0dXJuO1xyXG4gICAgICAgIGNob3Nlbk1vZGVsc1skKHRoaXMpLmF0dHIoXCJpZFwiKV09MVxyXG4gICAgfSk7XHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlQXJyO1xyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uZW1wdHkoKVxyXG4gICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPlRXSU4gSUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUwgSUQ8L3RkPjwvdHI+JylcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpbltcImRpc3BsYXlOYW1lXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bJ21vZGVsSUQnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RlZFR3aW5zLmxlbmd0aD09MCl7XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKSAgICBcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VTdGFydFNlbGVjdGlvbj1mdW5jdGlvbihhY3Rpb24pe1xyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdCE9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCl7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuaW5pdFN0b3JlZEluZm9ybXRpb24oKVxyXG4gICAgICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3Q9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInByb2plY3RJc0NoYW5nZWRcIn0pXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICBzZWxlY3RlZFR3aW5zLmZvckVhY2goYVR3aW49Pnt0d2luSURzLnB1c2goYVR3aW5bXCJpZFwiXSl9KVxyXG5cclxuICAgIHZhciBtb2RlbElEcz1bXVxyXG4gICAgZ2xvYmFsQ2FjaGUuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e21vZGVsSURzLnB1c2gob25lTW9kZWxbXCJpZFwiXSl9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInN0YXJ0U2VsZWN0aW9uX1wiK2FjdGlvbiwgXCJ0d2luSURzXCI6IHR3aW5JRHMsXCJtb2RlbElEc1wiOm1vZGVsSURzIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uUmVmcmVzaFwifSlcclxuICAgIHZhciBwcm9qZWN0SW5mbz1nbG9iYWxDYWNoZS5maW5kUHJvamVjdEluZm8oZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRClcclxuICAgIGlmKHByb2plY3RJbmZvLmRlZmF1bHRMYXlvdXQgJiYgcHJvamVjdEluZm8uZGVmYXVsdExheW91dCE9XCJcIikgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9cHJvamVjdEluZm8uZGVmYXVsdExheW91dFxyXG4gICAgXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiLFwic2VsZWN0TGF5b3V0XCI6cHJvamVjdEluZm8uZGVmYXVsdExheW91dH0pXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxuXHJcbiAgICBpZihnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5sZW5ndGg9PTApe1xyXG4gICAgICAgIC8vZGlyZWN0bHkgcG9wdXAgdG8gbW9kZWwgbWFuYWdlbWVudCBkaWFsb2cgYWxsb3cgdXNlciBpbXBvcnQgb3IgY3JlYXRlIG1vZGVsXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKClcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cuRE9NLmhpZGUoKVxyXG4gICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5ET00uZmFkZUluKClcclxuICAgICAgICAvL3BvcCB1cCB3ZWxjb21lIHNjcmVlblxyXG4gICAgICAgIHZhciBwb3BXaW49JCgnPGRpdiBjbGFzcz1cInczLWJsdWUgdzMtY2FyZC00IHczLXBhZGRpbmctbGFyZ2VcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwNTt3aWR0aDo0MDBweDtjdXJzb3I6ZGVmYXVsdFwiPjwvZGl2PicpXHJcbiAgICAgICAgcG9wV2luLmh0bWwoYFdlbGNvbWUsICR7bXNhbEhlbHBlci51c2VyTmFtZX0hIEZpcnN0bHksIGxldCdzIGltcG9ydCBvciBjcmVhdGUgYSBmZXcgdHdpbiBtb2RlbHMgdG8gc3RhcnQuIDxici8+PGJyLz5DbGljayB0byBjb250aW51ZS4uLmApXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHBvcFdpbilcclxuICAgICAgICBwb3BXaW4ub24oXCJjbGlja1wiLCgpPT57cG9wV2luLnJlbW92ZSgpfSlcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgICAgIHBvcFdpbi5mYWRlT3V0KFwic2xvd1wiLCgpPT57cG9wV2luLnJlbW92ZSgpfSk7XHJcbiAgICAgICAgfSwzMDAwKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBzdGFydFNlbGVjdGlvbkRpYWxvZygpOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiB0b3BvbG9neURPTShjb250YWluZXJET00pe1xyXG4gICAgdGhpcy5ET009JChcIjxkaXYgc3R5bGU9J2hlaWdodDoxMDAlO3dpZHRoOjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgY29udGFpbmVyRE9NLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW89e31cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXtcclxuICAgIGN5dG9zY2FwZS53YXJuaW5ncyhmYWxzZSkgIFxyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICAvLyBpbml0aWFsIHZpZXdwb3J0IHN0YXRlOlxyXG4gICAgICAgIHpvb206IDEsXHJcbiAgICAgICAgcGFuOiB7IHg6IDAsIHk6IDAgfSxcclxuXHJcbiAgICAgICAgLy8gaW50ZXJhY3Rpb24gb3B0aW9uczpcclxuICAgICAgICBtaW5ab29tOiAwLjEsXHJcbiAgICAgICAgbWF4Wm9vbTogMTAsXHJcbiAgICAgICAgem9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJQYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBib3hTZWxlY3Rpb25FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGlvblR5cGU6ICdzaW5nbGUnLFxyXG4gICAgICAgIHRvdWNoVGFwVGhyZXNob2xkOiA4LFxyXG4gICAgICAgIGRlc2t0b3BUYXBUaHJlc2hvbGQ6IDQsXHJcbiAgICAgICAgYXV0b2xvY2s6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bmdyYWJpZnk6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bnNlbGVjdGlmeTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHJlbmRlcmluZyBvcHRpb25zOlxyXG4gICAgICAgIGhlYWRsZXNzOiBmYWxzZSxcclxuICAgICAgICBzdHlsZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaGlkZUVkZ2VzT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgdGV4dHVyZU9uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXI6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXJPcGFjaXR5OiAwLjIsXHJcbiAgICAgICAgd2hlZWxTZW5zaXRpdml0eTogMC4zLFxyXG4gICAgICAgIHBpeGVsUmF0aW86ICdhdXRvJyxcclxuXHJcbiAgICAgICAgZWxlbWVudHM6IFtdLCAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuXHJcbiAgICAgICAgc3R5bGU6IFsgLy8gdGhlIHN0eWxlc2hlZXQgZm9yIHRoZSBncmFwaFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXCJoZWlnaHRcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAnbGFiZWwnOiAnZGF0YShpZCknLFxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzowLjksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6XCIxMnB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5JzonR2VuZXZhLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWltYWdlJzogZnVuY3Rpb24oZWxlKXsgcmV0dXJuIFwiaW1hZ2VzL2NhdC5wbmdcIjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWZpdCc6J2NvbnRhaW4nIC8vY292ZXJcclxuICAgICAgICAgICAgICAgICAgICAvLydiYWNrZ3JvdW5kLWNvbG9yJzogZnVuY3Rpb24oIGVsZSApeyByZXR1cm4gZWxlLmRhdGEoJ2JnJykgfVxyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC13aWR0aCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtaGVpZ2h0JzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjNTU1JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJyxcclxuICAgICAgICAgICAgICAgICAgICAnYXJyb3ctc2NhbGUnOjAuNlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZmlsbCc6XCJsaW5lYXItZ3JhZGllbnRcIixcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNzAlJywnMTAwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdib3JkZXItY29sb3InOlwicmVkXCIsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXdpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6J3JhZGlhbC1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLWNvbG9ycyc6WydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6WycwJScsJzUwJScsJzYwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLHtzZWxlY3RvcjogJ2VkZ2UuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzo1XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOnRydWUsXHJcbiAgICAgICAgZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZTpmYWxzZSxcclxuICAgICAgICBlbmFibGVDcmVhdGVBbmNob3JPbkRyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLmJveFNlbGVjdGlvbkVuYWJsZWQodHJ1ZSlcclxuXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXBzZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXB1bnNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdib3hlbmQnLChlKT0+ey8vcHV0IGluc2lkZSBib3hlbmQgZXZlbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSB0aW1lLCBhbmQgcmVwbGVhdGx5IGFmdGVyIGVhY2ggYm94IHNlbGVjdFxyXG4gICAgICAgIHRoaXMuY29yZS5vbmUoJ2JveHNlbGVjdCcsKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2N4dHRhcCcsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdmVyJyxlPT57XHJcblxyXG4gICAgICAgIHRoaXMubW91c2VPdmVyRnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3V0JyxlPT57XHJcbiAgICAgICAgdGhpcy5tb3VzZU91dEZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUub24oJ3pvb20nLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGUnKVxyXG4gICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdEaW1lbnNpb24gPSBNYXRoLmNlaWwodGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdICogZGltZW5zaW9uKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyB3aWR0aDogbmV3RGltZW5zaW9uLCBoZWlnaHQ6IG5ld0RpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdib3JkZXItd2lkdGgnOiBNYXRoLmNlaWwoZGltZW5zaW9uIC8gMTUpIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcblxyXG4gICAgdmFyIHVyID0gdGhpcy5jb3JlLnVuZG9SZWRvKHtpc0RlYnVnOiBmYWxzZX0pO1xyXG4gICAgdGhpcy51cj11clxyXG4gICAgdGhpcy5jb3JlLnRyaWdnZXIoXCJ6b29tXCIpXHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNtYXJ0UG9zaXRpb25Ob2RlID0gZnVuY3Rpb24gKG1vdXNlUG9zaXRpb24pIHtcclxuICAgIHZhciB6b29tTGV2ZWw9dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoIXRoaXMuZHJhZ2dpbmdOb2RlKSByZXR1cm5cclxuICAgIC8vY29tcGFyaW5nIG5vZGVzIHNldDogaXRzIGNvbm5lY3Rmcm9tIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0dG8gbm9kZXMsIGl0cyBjb25uZWN0dG8gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3Rmcm9tIG5vZGVzXHJcbiAgICB2YXIgaW5jb21lcnM9dGhpcy5kcmFnZ2luZ05vZGUuaW5jb21lcnMoKVxyXG4gICAgdmFyIG91dGVyRnJvbUluY29tPSBpbmNvbWVycy5vdXRnb2VycygpXHJcbiAgICB2YXIgb3V0ZXI9dGhpcy5kcmFnZ2luZ05vZGUub3V0Z29lcnMoKVxyXG4gICAgdmFyIGluY29tRnJvbU91dGVyPW91dGVyLmluY29tZXJzKClcclxuICAgIHZhciBtb25pdG9yU2V0PWluY29tZXJzLnVuaW9uKG91dGVyRnJvbUluY29tKS51bmlvbihvdXRlcikudW5pb24oaW5jb21Gcm9tT3V0ZXIpLmZpbHRlcignbm9kZScpLnVubWVyZ2UodGhpcy5kcmFnZ2luZ05vZGUpXHJcblxyXG4gICAgdmFyIHJldHVybkV4cGVjdGVkUG9zPShkaWZmQXJyLHBvc0Fycik9PntcclxuICAgICAgICB2YXIgbWluRGlzdGFuY2U9TWF0aC5taW4oLi4uZGlmZkFycilcclxuICAgICAgICBpZihtaW5EaXN0YW5jZSp6b29tTGV2ZWwgPCAxMCkgIHJldHVybiBwb3NBcnJbZGlmZkFyci5pbmRleE9mKG1pbkRpc3RhbmNlKV1cclxuICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4RGlmZj1bXVxyXG4gICAgdmFyIHhQb3M9W11cclxuICAgIHZhciB5RGlmZj1bXVxyXG4gICAgdmFyIHlQb3M9W11cclxuICAgIG1vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHhEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueC1tb3VzZVBvc2l0aW9uLngpKVxyXG4gICAgICAgIHhQb3MucHVzaChlbGUucG9zaXRpb24oKS54KVxyXG4gICAgICAgIHlEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueS1tb3VzZVBvc2l0aW9uLnkpKVxyXG4gICAgICAgIHlQb3MucHVzaChlbGUucG9zaXRpb24oKS55KVxyXG4gICAgfSlcclxuICAgIHZhciBwcmVmWD1yZXR1cm5FeHBlY3RlZFBvcyh4RGlmZix4UG9zKVxyXG4gICAgdmFyIHByZWZZPXJldHVybkV4cGVjdGVkUG9zKHlEaWZmLHlQb3MpXHJcbiAgICBpZihwcmVmWCE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd4JywgcHJlZlgpO1xyXG4gICAgfVxyXG4gICAgaWYocHJlZlkhPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneScsIHByZWZZKTtcclxuICAgIH1cclxuICAgIC8vY29uc29sZS5sb2coXCItLS0tXCIpXHJcbiAgICAvL21vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e2NvbnNvbGUubG9nKGVsZS5pZCgpKX0pXHJcbiAgICAvL2NvbnNvbGUubG9nKG1vbml0b3JTZXQuc2l6ZSgpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubW91c2VPdmVyRnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZighZS50YXJnZXQuZGF0YSkgcmV0dXJuXHJcbiAgICBcclxuICAgIHZhciBpbmZvPWUudGFyZ2V0LmRhdGEoKS5vcmlnaW5hbEluZm9cclxuICAgIGlmKGluZm89PW51bGwpIHJldHVybjtcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KSB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1lLnRhcmdldFxyXG4gICAgZS50YXJnZXQuYWRkQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9Ib3ZlcmVkRWxlXCIsIFwiaW5mb1wiOiBbaW5mb10sXCJzY3JlZW5YWVwiOnRoaXMuY29udmVydFBvc2l0aW9uKGUucG9zaXRpb24ueCxlLnBvc2l0aW9uLnkpIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jb252ZXJ0UG9zaXRpb249ZnVuY3Rpb24oeCx5KXtcclxuICAgIHZhciB2cEV4dGVudD10aGlzLmNvcmUuZXh0ZW50KClcclxuICAgIHZhciBzY3JlZW5XPXRoaXMuRE9NLndpZHRoKClcclxuICAgIHZhciBzY3JlZW5IPXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgc2NyZWVuWCA9ICh4LXZwRXh0ZW50LngxKS8odnBFeHRlbnQudykqc2NyZWVuVyArIHRoaXMuRE9NLm9mZnNldCgpLmxlZnRcclxuICAgIHZhciBzY3JlZW5ZPSh5LXZwRXh0ZW50LnkxKS8odnBFeHRlbnQuaCkqc2NyZWVuSCsgdGhpcy5ET00ub2Zmc2V0KCkudG9wXHJcbiAgICByZXR1cm4ge3g6c2NyZWVuWCx5OnNjcmVlbll9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKXsgLy9zaW5jZSBmbG9hdGluZyB3aW5kb3cgaXMgdXNlZCBmb3IgbW91c2UgaG92ZXIgZWxlbWVudCBpbmZvLCBzbyBpbmZvIHBhbmVsIG5ldmVyIGNoYWduZSBiZWZvcmUsIHRoYXQgaXMgd2h5IHRoZXJlIGlzIG5vIG5lZWQgdG8gcmVzdG9yZSBiYWNrIHRoZSBpbmZvIHBhbmVsIGluZm9ybWF0aW9uIGF0IG1vdXNlb3V0XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEKXtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9Hcm91cE5vZGVcIiwgXCJpbmZvXCI6IHtcIkBpZFwiOmdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRH0gfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0b3BvbG9neU1vdXNlT3V0XCJ9KVxyXG5cclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KXtcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9bnVsbDtcclxuICAgIH0gXHJcblxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0RnVuY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgIHZhciByZSA9IFtdXHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7IHJlLnB1c2goZWxlLmRhdGEoKS5vcmlnaW5hbEluZm8pIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogcmUgfSlcclxuICAgIC8vZm9yIGRlYnVnZ2luZyBwdXJwb3NlXHJcbiAgICAvL2Fyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJcIilcclxuICAgIC8vfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXtcclxuICAgICAgICB2YXIgbWF4RlM9MTJcclxuICAgICAgICB2YXIgbWluRlM9NVxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKGN1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWF4RlMvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbWF4RlM9MTIwXHJcbiAgICAgICAgdmFyIG1pbkZTPTEyXHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooMS9jdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1pbkZTKnJhdGlvKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpey8vc2NhbGUgdXAgYnV0IG5vdCB0b28gbXVjaFxyXG4gICAgICAgIHZhciByYXRpbz0gKGN1clpvb20tMSkqKDItMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZS9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByYXRpbz0gKDEvY3VyWm9vbS0xKSooNC0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplKnJhdGlvKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsQXZhcnRhPWZ1bmN0aW9uKG1vZGVsSUQsZGF0YVVybCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKCkgXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydzaGFwZSc6ICdwb2x5Z29uJywnc2hhcGUtcG9seWdvbi1wb2ludHMnOlswLC0xLDAuODY2LC0wLjUsMC44NjYsMC41LDAsMSwtMC44NjYsMC41LC0wLjg2NiwtMC41XX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnc2hhcGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uPWZ1bmN0aW9uKG1vZGVsSUQsZGltZW5zaW9uUmF0aW8pe1xyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdPXBhcnNlRmxvYXQoZGltZW5zaW9uUmF0aW8pXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLWNvbG9yJzogY29sb3JDb2RlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxzaGFwZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2xpbmUtc3R5bGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxlZGdlV2lkdGgpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlOnNlbGVjdGVkW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSsxLCdsaW5lLWNvbG9yJzogJ3JlZCd9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2UuaG92ZXJbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzN9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJyt0aGVOb2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHZhciB0d2luRGlzcGxheU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVt0d2luSURdXHJcbiAgICAgICAgdGhpcy5jb3JlLiQoJ1tpZCA9IFwiJyt0d2luRGlzcGxheU5hbWUrJ1wiXScpLnJlbW92ZSgpXHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYW5pbWF0ZUFOb2RlPWZ1bmN0aW9uKHR3aW4pe1xyXG4gICAgdmFyIGN1ckRpbWVuc2lvbj0gdHdpbi53aWR0aCgpXHJcbiAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24qMiwnd2lkdGgnOiBjdXJEaW1lbnNpb24qMiB9LFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uLCd3aWR0aCc6IGN1ckRpbWVuc2lvbiB9LFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICAgICAgICAgICxjb21wbGV0ZTooKT0+e1xyXG4gICAgICAgICAgICAgICAgdHdpbi5yZW1vdmVTdHlsZSgpIC8vbXVzdCByZW1vdmUgdGhlIHN0eWxlIGFmdGVyIGFuaW1hdGlvbiwgb3RoZXJ3aXNlIHRoZXkgd2lsbCBoYXZlIHRoZWlyIG93biBzdHlsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LDIwMClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2lucz1mdW5jdGlvbih0d2luc0RhdGEsYW5pbWF0aW9uKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8dHdpbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89dHdpbnNEYXRhW2ldO1xyXG4gICAgICAgIHZhciBuZXdOb2RlPXtkYXRhOnt9LGdyb3VwOlwibm9kZXNcIn1cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09IG9yaWdpbmFsSW5mbztcclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJpZFwiXT1vcmlnaW5hbEluZm9bJ2Rpc3BsYXlOYW1lJ11cclxuICAgICAgICB2YXIgbW9kZWxJRD1vcmlnaW5hbEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm1vZGVsSURcIl09bW9kZWxJRFxyXG4gICAgICAgIGFyci5wdXNoKG5ld05vZGUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGVsZXMgPSB0aGlzLmNvcmUuYWRkKGFycilcclxuICAgIGlmKGVsZXMuc2l6ZSgpPT0wKSByZXR1cm4gZWxlc1xyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2dyaWQoZWxlcylcclxuICAgIGlmKGFuaW1hdGlvbil7XHJcbiAgICAgICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIGVsZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5Q3VycmVudExheW91dFdpdGhOb0FuaW10YWlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBsYXlvdXROYW1lID0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgIGlmIChsYXlvdXROYW1lICE9IG51bGwpIHtcclxuICAgICAgICB2YXIgbGF5b3V0RGV0YWlsID0gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXS5kZXRhaWxcclxuICAgICAgICBpZiAobGF5b3V0RGV0YWlsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3QmFzZWRPbkxheW91dERldGFpbChsYXlvdXREZXRhaWwsIG51bGwsIFwibm9BbmltYXRpb25cIilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKHRoaXMuY29yZS5ub2RlcygpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1JlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHZhciByZWxhdGlvbkluZm9BcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8cmVsYXRpb25zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXJlbGF0aW9uc0RhdGFbaV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRoZUlEPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXStcIl9cIitvcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgdmFyIGFSZWxhdGlvbj17ZGF0YTp7fSxncm91cDpcImVkZ2VzXCJ9XHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09b3JpZ2luYWxJbmZvXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJpZFwiXT10aGVJRFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckc291cmNlSWQnXV1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29yaWdpbmFsSW5mb1snJHRhcmdldElkJ11dXHJcblxyXG5cclxuICAgICAgICBpZih0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSkubGVuZ3RoPT0wIHx8IHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdKS5sZW5ndGg9PTApIGNvbnRpbnVlXHJcbiAgICAgICAgdmFyIHNvdXJjZU5vZGU9dGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdmFyIGVsZXM9dGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxcclxuICAgIGlmKHZpc3VhbEpzb249PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB2aXN1YWxKc29uKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcilcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcE5hbWUgaW4gdmlzdWFsSnNvblttb2RlbElEXS5yZWxzKXtcclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmVkZ2VXaWR0aCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aChtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZXBsYWNlQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICB0aGlzLmFwcGx5Q3VycmVudExheW91dFdpdGhOb0FuaW10YWlvbigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIikge1xyXG4gICAgICAgIHRoaXMuYXBwbHlWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG4gICAgICAgIHRoaXMuYXBwbHlDdXJyZW50TGF5b3V0V2l0aE5vQW5pbXRhaW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgbGF5b3V0RGV0YWlsPW51bGxcclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVdLmRldGFpbFxyXG4gICAgICAgICAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpICB0aGlzLm5vUG9zaXRpb25fY29zZSgpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5hcHBseUN1cnJlbnRMYXlvdXRXaXRoTm9BbmltdGFpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKFttc2dQYXlsb2FkLnR3aW5JbmZvXSxcImFuaW1hdGlvblwiKVxyXG4gICAgICAgIHZhciBub2RlSW5mbz0gbXNnUGF5bG9hZC50d2luSW5mbztcclxuICAgICAgICB2YXIgbm9kZU5hbWU9IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbbm9kZUluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlTmFtZSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbj10b3BvTm9kZS5yZW5kZXJlZFBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnBhbkJ5KHt4Oi1wb3NpdGlvbi54KzIwMCx5Oi1wb3NpdGlvbi55KzUwfSlcclxuICAgICAgICAgICAgdG9wb05vZGUuc2VsZWN0KClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLnR3aW5zSW5mbyxcImFuaW1hdGlvblwiKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIil7IC8vZnJvbSBzZWxlY3RpbmcgdHdpbnMgaW4gdGhlIHR3aW50cmVlXHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgbW91c2VDbGlja0RldGFpbD1tc2dQYXlsb2FkLm1vdXNlQ2xpY2tEZXRhaWw7XHJcbiAgICAgICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgICAgIHZhciBhVHdpbj0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK2VsZW1lbnRbJ2Rpc3BsYXlOYW1lJ10pXHJcbiAgICAgICAgICAgIGFUd2luLnNlbGVjdCgpXHJcbiAgICAgICAgICAgIGlmKG1vdXNlQ2xpY2tEZXRhaWwhPTIpIHRoaXMuYW5pbWF0ZUFOb2RlKGFUd2luKSAvL2lnbm9yZSBkb3VibGUgY2xpY2sgc2Vjb25kIGNsaWNrXHJcbiAgICAgICAgfSk7XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiUGFuVG9Ob2RlXCIpe1xyXG4gICAgICAgIHZhciBub2RlSW5mbz0gbXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBub2RlTmFtZT0gZ2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtub2RlSW5mb1tcIiRkdElkXCJdXVxyXG4gICAgICAgIHZhciB0b3BvTm9kZT0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiK25vZGVOYW1lKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdGhpcy5jb3JlLmNlbnRlcih0b3BvTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnNyY01vZGVsSUQpe1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmVkZ2VXaWR0aCkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aChtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuZWRnZVdpZHRoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmF2YXJ0YSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLm5vQXZhcnRhKSAgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbnVsbClcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKSAgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfSBcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlbGF0aW9uc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVSZWxhdGlvbnMobXNnUGF5bG9hZC5yZWxhdGlvbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0VG9cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RUb1wiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RGcm9tXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0RnJvbVwiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdE91dGJvdW5kXCIpeyB0aGlzLnNlbGVjdE91dGJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdEluYm91bmRcIil7IHRoaXMuc2VsZWN0SW5ib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJoaWRlU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5oaWRlU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQ09TRVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuQ09TRVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNhdmVMYXlvdXRcIil7IHRoaXMuc2F2ZUxheW91dChtc2dQYXlsb2FkLmxheW91dE5hbWUpICAgfVxyXG4gICAgZWxzZSBpZiAobXNnUGF5bG9hZC5tZXNzYWdlID09IFwibGF5b3V0Q2hhbmdlXCIpIHRoaXMuY2hvb3NlTGF5b3V0KGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWxpZ25TZWxlY3RlZE5vZGVcIikgdGhpcy5hbGlnblNlbGVjdGVkTm9kZXMobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkaXN0cmlidXRlU2VsZWN0ZWROb2RlXCIpIHRoaXMuZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZShtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJvdGF0ZVNlbGVjdGVkTm9kZVwiKSB0aGlzLnJvdGF0ZVNlbGVjdGVkTm9kZShtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIm1pcnJvclNlbGVjdGVkTm9kZVwiKSB0aGlzLm1pcnJvclNlbGVjdGVkTm9kZShtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiKSB0aGlzLmRpbWVuc2lvblNlbGVjdGVkTm9kZShtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpZXdUeXBlQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQudmlld1R5cGU9PVwiVG9wb2xvZ3lcIikgdGhpcy5zaG93U2VsZigpXHJcbiAgICAgICAgZWxzZSB0aGlzLmhpZGVTZWxmKClcclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNob29zZUxheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZiAobGF5b3V0TmFtZSA9PSBcIltOQV1cIikge1xyXG4gICAgICAgIC8vc2VsZWN0IGFsbCB2aXNpYmxlIG5vZGVzIGFuZCBkbyBhIENPU0UgbGF5b3V0LCBjbGVhbiBhbGwgYmVuZCBlZGdlIGxpbmUgYXMgd2VsbFxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZSA9PiB7XHJcbiAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIiwgW10pXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsIFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIiwgW10pXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsIFtdKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgfSBlbHNlIGlmIChsYXlvdXROYW1lICE9IG51bGwpIHtcclxuICAgICAgICB2YXIgbGF5b3V0RGV0YWlsID0gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXS5kZXRhaWxcclxuICAgICAgICBpZiAobGF5b3V0RGV0YWlsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhsYXlvdXREZXRhaWwsIHRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93U2VsZiA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uYW5pbWF0ZSh7aGVpZ2h0OiBcIjEwMCVcIn0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaGlkZVNlbGYgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB0aGlzLkRPTS5hbmltYXRlKHtoZWlnaHQ6IFwiMCVcIn0sKCk9Pnt0aGlzLkRPTS5oaWRlKCl9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRpbWVuc2lvblNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciByYXRpbz0xLjJcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImV4cGFuZFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt4b2ZmY2VudGVyKnJhdGlvLGNlbnRlclkreW9mZmNlbnRlcipyYXRpb11cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJjb21wcmVzc1wiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt4b2ZmY2VudGVyL3JhdGlvLGNlbnRlclkreW9mZmNlbnRlci9yYXRpb11cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1pcnJvclNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgteG9mZmNlbnRlcixjdXJQb3NbJ3knXV1cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY2VudGVyWS15b2ZmY2VudGVyXVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucm90YXRlU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MikgcmV0dXJuO1xyXG4gICAgdmFyIGJvdW5kYXJ5PSBzZWxlY3RlZE5vZGVzLmJvdW5kaW5nQm94KHtpbmNsdWRlTGFiZWxzIDpmYWxzZSxpbmNsdWRlT3ZlcmxheXMgOmZhbHNlIH0pXHJcbiAgICB2YXIgY2VudGVyWD1ib3VuZGFyeVtcIngxXCJdK2JvdW5kYXJ5W1wid1wiXS8yXHJcbiAgICB2YXIgY2VudGVyWT1ib3VuZGFyeVtcInkxXCJdK2JvdW5kYXJ5W1wiaFwiXS8yXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICB2YXIgeG9mZmNlbnRlcj1jdXJQb3NbXCJ4XCJdLWNlbnRlclhcclxuICAgICAgICB2YXIgeW9mZmNlbnRlcj1jdXJQb3NbXCJ5XCJdLWNlbnRlcllcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwibGVmdFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWCt5b2ZmY2VudGVyLGNlbnRlclkteG9mZmNlbnRlcl1cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJyaWdodFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWC15b2ZmY2VudGVyLGNlbnRlclkreG9mZmNlbnRlcl1cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRpc3RyaWJ1dGVTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwzKSByZXR1cm47XHJcbiAgICB2YXIgbnVtQXJyPVtdXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbGF5b3V0Rm9yU29ydD1bXVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd5J10pXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneCddKVxyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgbGF5b3V0Rm9yU29ydC5wdXNoKHtpZDpub2RlSUQseDpjdXJQb3NbJ3gnXSx5OmN1clBvc1sneSddfSlcclxuICAgIH0pXHJcblxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIGxheW91dEZvclNvcnQuc29ydChmdW5jdGlvbiAoYSwgYikge3JldHVybiBhW1wieVwiXS1iW1wieVwiXSB9KVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBsYXlvdXRGb3JTb3J0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYVtcInhcIl0tYltcInhcIl0gfSlcclxuICAgIFxyXG4gICAgdmFyIG1pblY9TWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgdmFyIG1heFY9TWF0aC5tYXgoLi4ubnVtQXJyKVxyXG4gICAgaWYobWluVj09bWF4VikgcmV0dXJuO1xyXG4gICAgdmFyIGdhcD0obWF4Vi1taW5WKS8oc2VsZWN0ZWROb2Rlcy5zaXplKCktMSlcclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSB2YXIgY3VyVj1sYXlvdXRGb3JTb3J0WzBdW1wieVwiXVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBjdXJWPWxheW91dEZvclNvcnRbMF1bXCJ4XCJdXHJcbiAgICBmb3IodmFyIGk9MDtpPGxheW91dEZvclNvcnQubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZU5vZGVJbmZvPWxheW91dEZvclNvcnRbaV1cclxuICAgICAgICBpZihpPT0wfHwgaT09bGF5b3V0Rm9yU29ydC5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIG5ld0xheW91dFtvbmVOb2RlSW5mby5pZF09W29uZU5vZGVJbmZvWyd4J10sb25lTm9kZUluZm9bJ3knXV1cclxuICAgICAgICAgICAgY29udGludWVcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VyVis9Z2FwO1xyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtvbmVOb2RlSW5mb1sneCddLGN1clZdXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtjdXJWLG9uZU5vZGVJbmZvWyd5J11dXHJcbiAgICB9XHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFsaWduU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBudW1BcnI9W11cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ0b3BcInx8IGRpcmVjdGlvbj09XCJib3R0b21cIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3knXSlcclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJsZWZ0XCJ8fCBkaXJlY3Rpb249PVwicmlnaHRcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3gnXSlcclxuICAgIH0pXHJcbiAgICB2YXIgdGFyZ2V0WD10YXJnZXRZPW51bGxcclxuICAgIGlmKGRpcmVjdGlvbj09XCJ0b3BcIikgdmFyIHRhcmdldFk9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImJvdHRvbVwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5tYXgoLi4ubnVtQXJyKVxyXG4gICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgdmFyIHRhcmdldFg9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cInJpZ2h0XCIpIHZhciB0YXJnZXRYPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBuZXdMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgaWYodGFyZ2V0WCE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMF09dGFyZ2V0WFxyXG4gICAgICAgIGlmKHRhcmdldFkhPW51bGwpIG5ld0xheW91dFtub2RlSURdWzFdPXRhcmdldFlcclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwgPSBmdW5jdGlvbiAobGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24sbm9BbmltYXRpb24pIHtcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICBpZighb25seUFkanVzdE5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsW10pXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsW10pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBpZihpbmQgPT0gXCJlZGdlc1wiKSBjb250aW51ZVxyXG4gICAgICAgIHN0b3JlZFBvc2l0aW9uc1tpbmRdPXtcclxuICAgICAgICAgICAgeDpsYXlvdXREZXRhaWxbaW5kXVswXVxyXG4gICAgICAgICAgICAseTpsYXlvdXREZXRhaWxbaW5kXVsxXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBuZXdMYXlvdXQ9dGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOnN0b3JlZFBvc2l0aW9ucyxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgYW5pbWF0ZTogKChub0FuaW1hdGlvbik/ZmFsc2U6dHJ1ZSksXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDMwMCxcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuXHJcbiAgICAvL3Jlc3RvcmUgZWRnZXMgYmVuZGluZyBvciBjb250cm9sIHBvaW50c1xyXG4gICAgdmFyIGVkZ2VQb2ludHNEaWN0PWxheW91dERldGFpbFtcImVkZ2VzXCJdXHJcbiAgICBpZihlZGdlUG9pbnRzRGljdD09bnVsbClyZXR1cm47XHJcbiAgICBmb3IodmFyIHNyY0lEIGluIGVkZ2VQb2ludHNEaWN0KXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcElEIGluIGVkZ2VQb2ludHNEaWN0W3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBvYmo9ZWRnZVBvaW50c0RpY3Rbc3JjSURdW3JlbGF0aW9uc2hpcElEXVxyXG4gICAgICAgICAgICB0aGlzLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzKHNyY0lELHJlbGF0aW9uc2hpcElELG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXVxyXG4gICAgICAgICAgICAsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8gPSBmdW5jdGlvbiAobmV3TGF5b3V0RGV0YWlsLG9sZExheW91dERldGFpbCxvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKSB7XHJcbiAgICAvL3N0b3JlIGN1cnJlbnQgbGF5b3V0IGZvciB1bmRvIG9wZXJhdGlvblxyXG4gICAgdGhpcy51ci5hY3Rpb24oIFwiY2hhbmdlTGF5b3V0XCJcclxuICAgICAgICAsIChhcmcpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3QmFzZWRPbkxheW91dERldGFpbChhcmcubmV3TGF5b3V0RGV0YWlsLGFyZy5vbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKSAgICAgICAgXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdcclxuICAgICAgICB9XHJcbiAgICAgICAgLCAoYXJnKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwoYXJnLm9sZExheW91dERldGFpbCxhcmcub25seUFkanVzdE5vZGVQb3NpdGlvbilcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ1xyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIHRoaXMudXIuZG8oXCJjaGFuZ2VMYXlvdXRcIlxyXG4gICAgICAgICwgeyBmaXJzdFRpbWU6IHRydWUsIFwibmV3TGF5b3V0RGV0YWlsXCI6IG5ld0xheW91dERldGFpbCwgXCJvbGRMYXlvdXREZXRhaWxcIjogb2xkTGF5b3V0RGV0YWlsLFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiOm9ubHlBZGp1c3ROb2RlUG9zaXRpb259XHJcbiAgICApXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyA9IGZ1bmN0aW9uIChzcmNJRCxyZWxhdGlvbnNoaXBJRFxyXG4gICAgLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyxjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcyxjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzcmNJRF1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrbm9kZU5hbWUrJ1wiXScpO1xyXG4gICAgICAgIGlmKHRoZU5vZGUubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbnNoaXBJRCl7XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXRDdXJyZW50TGF5b3V0RGV0YWlsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dERpY3Q9e1wiZWRnZXNcIjp7fX1cclxuICAgIGlmKHRoaXMuY29yZS5ub2RlcygpLnNpemUoKT09MCkgcmV0dXJuIGxheW91dERpY3Q7XHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBsYXlvdXREaWN0O1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2F2ZUxheW91dCA9IGFzeW5jIGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdLmRldGFpbFxyXG4gICAgaWYoIWxheW91dERpY3Qpe1xyXG4gICAgICAgIGxheW91dERpY3Q9e31cclxuICAgICAgICBnbG9iYWxDYWNoZS5yZWNvcmRTaW5nbGVMYXlvdXQobGF5b3V0RGljdCxnbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZCxsYXlvdXROYW1lLGZhbHNlKVxyXG4gICAgfVxyXG4gICAgaWYobGF5b3V0RGljdFtcImVkZ2VzXCJdPT1udWxsKSBsYXlvdXREaWN0W1wiZWRnZXNcIl09e31cclxuICAgIFxyXG4gICAgdmFyIHNob3dpbmdMYXlvdXQ9dGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKClcclxuICAgIHZhciBzaG93aW5nRWRnZXNMYXlvdXQ9IHNob3dpbmdMYXlvdXRbXCJlZGdlc1wiXVxyXG4gICAgZGVsZXRlIHNob3dpbmdMYXlvdXRbXCJlZGdlc1wiXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gc2hvd2luZ0xheW91dCkgbGF5b3V0RGljdFtpbmRdPXNob3dpbmdMYXlvdXRbaW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gc2hvd2luZ0VkZ2VzTGF5b3V0KSBsYXlvdXREaWN0W1wiZWRnZXNcIl1baW5kXT1zaG93aW5nRWRnZXNMYXlvdXRbaW5kXVxyXG5cclxuICAgIHZhciBzYXZlTGF5b3V0T2JqPXtcImxheW91dHNcIjp7fX1cclxuICAgIHNhdmVMYXlvdXRPYmpbXCJsYXlvdXRzXCJdW2xheW91dE5hbWVdPUpTT04uc3RyaW5naWZ5KGxheW91dERpY3QpICBcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlTGF5b3V0XCIsIFwiUE9TVFwiLCBzYXZlTGF5b3V0T2JqLFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIsXCJsYXlvdXROYW1lXCI6bGF5b3V0TmFtZX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5udW1iZXJQcmVjaXNpb24gPSBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICBpZihBcnJheS5pc0FycmF5KG51bWJlcikpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8bnVtYmVyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBudW1iZXJbaV0gPSB0aGlzLm51bWJlclByZWNpc2lvbihudW1iZXJbaV0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1iZXJcclxuICAgIH1lbHNlXHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdChudW1iZXIudG9GaXhlZCgzKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLkNPU0VTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2Uoc2VsZWN0ZWQpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5oaWRlU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHNlbGVjdGVkTm9kZXMucmVtb3ZlKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXRoaXMuY29yZS5ub2RlcygpLmVkZ2VzVG8oc2VsZWN0ZWROb2Rlcykuc291cmNlcygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RPdXRib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9c2VsZWN0ZWROb2Rlcy5lZGdlc1RvKHRoaXMuY29yZS5ub2RlcygpKS50YXJnZXRzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFkZENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHRhcmdldE5vZGUpIHtcclxuICAgIHZhciB0aGVDb25uZWN0TW9kZT10aGlzLnRhcmdldE5vZGVNb2RlXHJcbiAgICB2YXIgc3JjTm9kZUFycj10aGlzLmNvcmUubm9kZXMoXCI6c2VsZWN0ZWRcIilcclxuXHJcbiAgICB2YXIgcHJlcGFyYXRpb25JbmZvPVtdXHJcblxyXG4gICAgc3JjTm9kZUFyci5mb3JFYWNoKHRoZU5vZGU9PntcclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzXHJcbiAgICAgICAgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdFRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHtmcm9tOnRoZU5vZGUsdG86dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfWVsc2UgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdEZyb21cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIiksdGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe3RvOnRoZU5vZGUsZnJvbTp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLy9UT0RPOiBjaGVjayBpZiBpdCBpcyBuZWVkZWQgdG8gcG9wdXAgZGlhbG9nLCBpZiBhbGwgY29ubmVjdGlvbiBpcyBkb2FibGUgYW5kIG9ubHkgb25lIHR5cGUgdG8gdXNlLCBubyBuZWVkIHRvIHNob3cgZGlhbG9nXHJcbiAgICB0aGlzLnNob3dDb25uZWN0aW9uRGlhbG9nKHByZXBhcmF0aW9uSW5mbylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dDb25uZWN0aW9uRGlhbG9nID0gZnVuY3Rpb24gKHByZXBhcmF0aW9uSW5mbykge1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgcmVzdWx0QWN0aW9ucz1bXVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGNvbm5lY3Rpb25zXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlwiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5lbXB0eSgpXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh0aGlzLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpKVxyXG4gICAgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cgPSBmdW5jdGlvbiAob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpIHtcclxuICAgIHZhciByZXR1cm5PYmo9e31cclxuICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgdmFyIHRvTm9kZT1vbmVSb3cudG9cclxuICAgIHZhciBjb25uZWN0aW9uVHlwZXM9b25lUm93LmNvbm5lY3RcclxuICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcInJlZFwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPjEpeyBcclxuICAgICAgICBsYWJlbC5odG1sKFwiRnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICBsYWJlbC5wcmVwZW5kKHN3aXRjaFR5cGVTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgY29ubmVjdGlvblR5cGVzLmZvckVhY2gob25lVHlwZT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlZnJvbU5vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlZnJvbU5vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgfVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgcmV0dXJuIHJldHVybk9iajtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gYXN5bmMgZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIC8vIGZvciBlYWNoIHJlc3VsdEFjdGlvbnMsIGNhbGN1bGF0ZSB0aGUgYXBwZW5kaXggaW5kZXgsIHRvIGF2b2lkIHNhbWUgSUQgaXMgdXNlZCBmb3IgZXhpc3RlZCBjb25uZWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNldEtleURvd25GdW5jPWZ1bmN0aW9uKGluY2x1ZGVDYW5jZWxDb25uZWN0T3BlcmF0aW9uKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiLCAgKGUpPT57XHJcbiAgICAgICAgaWYgKGUuY3RybEtleSAmJiBlLnRhcmdldC5ub2RlTmFtZSA9PT0gJ0JPRFknKXtcclxuICAgICAgICAgICAgaWYgKGUud2hpY2ggPT09IDkwKSAgIHRoaXMudXIudW5kbygpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChlLndoaWNoID09PSA4OSkgICAgdGhpcy51ci5yZWRvKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoZS53aGljaD09PTgzKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJwb3B1cExheW91dEVkaXRpbmdcIn0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZS5rZXlDb2RlID09IDI3KSB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCkgICAgXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggdHJ1ZSApO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1tb2RlO1xyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYyhcImluY2x1ZGVDYW5jZWxDb25uZWN0T3BlcmF0aW9uXCIpXHJcblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub24oJ2NsaWNrJywgKGUpPT57XHJcbiAgICAgICAgdmFyIGNsaWNrZWROb2RlID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdGhpcy5hZGRDb25uZWN0aW9ucyhjbGlja2VkTm9kZSlcclxuICAgICAgICAvL2RlbGF5IGEgc2hvcnQgd2hpbGUgc28gbm9kZSBzZWxlY3Rpb24gd2lsbCBub3QgYmUgY2hhbmdlZCB0byB0aGUgY2xpY2tlZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9Pnt0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCl9LDUwKVxyXG5cclxuICAgIH0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2FuY2VsVGFyZ2V0Tm9kZU1vZGU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bnVsbDtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2tleWRvd24nKTtcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoKVxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub2ZmKFwiY2xpY2tcIilcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIGZhbHNlICk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9ncmlkPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IGVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb3NlPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG5cclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29zZScsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2VcclxuICAgICAgICAsZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG4gICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb25jZW50cmljPWZ1bmN0aW9uKGVsZXMsYm94KXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29uY2VudHJpYycsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIG1pbk5vZGVTcGFjaW5nOjYwLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBib3VuZGluZ0JveDpib3hcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5sYXlvdXRXaXRoTm9kZVBvc2l0aW9uPWZ1bmN0aW9uKG5vZGVQb3NpdGlvbil7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gdGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOiBub2RlUG9zaXRpb24sXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gdHJhbnNpdGlvbiB0aGUgbm9kZSBwb3NpdGlvbnNcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogNTAwLCAvLyBkdXJhdGlvbiBvZiBhbmltYXRpb24gaW4gbXMgaWYgZW5hYmxlZFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBuZXdUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9uZXdUd2luRGlhbG9nXCIpO1xyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImRhcmtHcmF5XCJcclxuICAgICAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgICAgICB2YXIgYXZhcnRhPW51bGxcclxuICAgICAgICB2YXIgZGltZW5zaW9uPTIwO1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFttb2RlbENsYXNzXSl7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgdmFyIGNvbG9yQ29kZT0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmU7cGFkZGluZy10b3A6MnB4Jz48L2Rpdj5cIilcclxuICAgICAgICBpZihkYk1vZGVsSW5mbyAmJiBkYk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICAgICAgdmFyIGlvdERpdj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6LTVweDtwYWRkaW5nOjBweCAycHg7dG9wOi03cHg7Ym9yZGVyLXJhZGl1czogM3B4O2ZvbnQtc2l6ZTo3cHgnPklvVDwvZGl2PlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChpb3REaXYpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaW1nU3JjPWVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnNoYXBlU3ZnKHNoYXBlLGNvbG9yQ29kZSkpXHJcbiAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICBpZihhdmFydGEpe1xyXG4gICAgICAgICAgICB2YXIgYXZhcnRhaW1nPSQoXCI8aW1nIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjBweDt3aWR0aDo2MCU7bWFyZ2luOjIwJScgc3JjPSdcIithdmFydGErXCInPjwvaW1nPlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpY29uRE9NXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmMgPSAoZ24pID0+IHtcclxuICAgICAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtoZWlnaHQ6MjdweDsgcmlnaHQ6MTBweDt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtNTAlKVwiPis8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgICAgIG5ld1R3aW5EaWFsb2cucG9wdXAoe1xyXG4gICAgICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJG1vZGVsXCI6IGduLmluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gYWRkQnV0dG9uO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzppbmZvQXJyLCBcIm1vdXNlQ2xpY2tEZXRhaWxcIjptb3VzZUNsaWNrRGV0YWlsfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGU9KHRoZU5vZGUpPT57XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiUGFuVG9Ob2RlXCIsIGluZm86dGhlTm9kZS5sZWFmSW5mb30pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3g9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgIHBsYWNlaG9sZGVyPVwic2VhcmNoLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXRcIik7XHJcbiAgICB0aGlzLnNlYXJjaEJveC5jc3Moe1wib3V0bGluZVwiOlwibm9uZVwiLFwiaGVpZ2h0XCI6XCIxMDAlXCIsXCJ3aWR0aFwiOlwiMTAwJVwifSkgXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKHRoaXMuc2VhcmNoQm94KVxyXG4gICAgdmFyIGhpZGVPclNob3dFbXB0eUdyb3VwPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MjBweDtib3JkZXI6bm9uZTtwYWRkaW5nLWxlZnQ6MnB4XCIgY2xhc3M9XCJ3My1ibG9jayB3My10aW55IHczLWhvdmVyLXJlZCB3My1hbWJlclwiPkhpZGUgRW1wdHkgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHNlYXJjaERPTS5hcHBlbmQoaGlkZU9yU2hvd0VtcHR5R3JvdXApXHJcbiAgICBET00uY3NzKFwidG9wXCIsXCI1MHB4XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZihoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIpPT1cInNob3dcIil7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcImhpZGVcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIlNob3cgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwPXRydWVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiSGlkZSBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKX0pXHJcbiAgICB9KVxyXG4gICAgdGhpcy5zZWFyY2hCb3gua2V5dXAoKGUpPT57XHJcbiAgICAgICAgaWYoZS5rZXlDb2RlID09IDEzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFOb2RlID0gdGhpcy50cmVlLnNlYXJjaFRleHQoJChlLnRhcmdldCkudmFsKCkpXHJcbiAgICAgICAgICAgIGlmKGFOb2RlIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGFOb2RlLnBhcmVudEdyb3VwTm9kZS5leHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNlbGVjdExlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNjcm9sbFRvTGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fcmVwbGFjZVwiKSB0aGlzLmxvYWRTdGFydFNlbGVjdGlvbihtc2dQYXlsb2FkLnR3aW5JRHMsbXNnUGF5bG9hZC5tb2RlbElEcyxcInJlcGxhY2VcIilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX2FwcGVuZFwiKSB0aGlzLmxvYWRTdGFydFNlbGVjdGlvbihtc2dQYXlsb2FkLnR3aW5JRHMsbXNnUGF5bG9hZC5tb2RlbElEcyxcImFwcGVuZFwiKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVE1vZGVsc0NoYW5nZVwiKSB0aGlzLnJlZnJlc2hNb2RlbHMoKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB0aGlzLmRyYXdPbmVUd2luKG1zZ1BheWxvYWQudHdpbkluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgbXNnUGF5bG9hZC50d2luc0luZm8uZm9yRWFjaChvbmVUd2luSW5mbz0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbkluZm8pfSlcclxuICAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZighbXNnUGF5bG9hZC5zcmNNb2RlbElEKXsgLy8gY2hhbmdlIG1vZGVsIGNsYXNzIHZpc3VhbGl6YXRpb25cclxuICAgICAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e2duLnJlZnJlc2hOYW1lKCl9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHZhciB0d2luRGlzcGxheU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVt0d2luSURdXHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKHR3aW5EaXNwbGF5TmFtZSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVmcmVzaE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG1vZGVsc0RhdGE9e31cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBvbmVNb2RlbD1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBtb2RlbHNEYXRhW29uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1dID0gb25lTW9kZWxcclxuICAgIH1cclxuICAgIC8vZGVsZXRlIGFsbCBncm91cCBub2RlcyBvZiBkZWxldGVkIG1vZGVsc1xyXG4gICAgdmFyIGFycj1bXS5jb25jYXQodGhpcy50cmVlLmdyb3VwTm9kZXMpXHJcbiAgICBhcnIuZm9yRWFjaCgoZ25vZGUpPT57XHJcbiAgICAgICAgaWYobW9kZWxzRGF0YVtnbm9kZS5uYW1lXT09bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIHRoaXMgZ3JvdXAgbm9kZVxyXG4gICAgICAgICAgICBnbm9kZS5kZWxldGVTZWxmKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vdGhlbiBhZGQgYWxsIGdyb3VwIG5vZGVzIHRoYXQgdG8gYmUgYWRkZWRcclxuICAgIHZhciBjdXJyZW50TW9kZWxOYW1lQXJyPVtdXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntjdXJyZW50TW9kZWxOYW1lQXJyLnB1c2goZ25vZGUubmFtZSl9KVxyXG5cclxuICAgIHZhciBhY3R1YWxNb2RlbE5hbWVBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsc0RhdGEpIGFjdHVhbE1vZGVsTmFtZUFyci5wdXNoKGluZClcclxuICAgIGFjdHVhbE1vZGVsTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG5cclxuICAgIGZvcih2YXIgaT0wO2k8YWN0dWFsTW9kZWxOYW1lQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGk8Y3VycmVudE1vZGVsTmFtZUFyci5sZW5ndGggJiYgY3VycmVudE1vZGVsTmFtZUFycltpXT09YWN0dWFsTW9kZWxOYW1lQXJyW2ldKSBjb250aW51ZVxyXG4gICAgICAgIC8vb3RoZXJ3aXNlIGFkZCB0aGlzIGdyb3VwIHRvIHRoZSB0cmVlXHJcbiAgICAgICAgdmFyIG5ld0dyb3VwPXRoaXMudHJlZS5pbnNlcnRHcm91cE5vZGUobW9kZWxzRGF0YVthY3R1YWxNb2RlbE5hbWVBcnJbaV1dLGkpXHJcbiAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICBjdXJyZW50TW9kZWxOYW1lQXJyLnNwbGljZShpLCAwLCBhY3R1YWxNb2RlbE5hbWVBcnJbaV0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5sb2FkU3RhcnRTZWxlY3Rpb249YXN5bmMgZnVuY3Rpb24odHdpbklEcyxtb2RlbElEcyxyZXBsYWNlT3JBcHBlbmQpe1xyXG4gICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy50cmVlLmNsZWFyQWxsTGVhZk5vZGVzKClcclxuXHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBcclxuICAgIC8vYWRkIG5ldyB0d2lucyB1bmRlciB0aGUgbW9kZWwgZ3JvdXAgbm9kZVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgdmFyIHR3aW5JREFyciA9IFtdXHJcbiAgICAgICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpID0+IHtcclxuICAgICAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChsZWFmTm9kZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUlkID0gbGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tub2RlSWRdID09IG51bGwpIHR3aW5JREFyci5wdXNoKG5vZGVJZClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZUFEVFR3aW5zKHR3aW5zZGF0YSlcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR3aW5zZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luc2RhdGFbaV1bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLCB0d2luc2RhdGFbaV0sIFwic2tpcFJlcGVhdFwiKVxyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaCh0d2luc2RhdGFbaV1bXCIkZHRJZFwiXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIGVsc2UgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYXBwZW5kQWxsVHdpbnNcIiwgaW5mbzogdHdpbnNkYXRhIH0pXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgdGhpcy5kcmF3T25lVHdpbihvbmVUd2luKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0bXBBcnIuZm9yRWFjaChvbmVUd2luPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luKX0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9Z2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLHR3aW5JbmZvLFwic2tpcFJlcGVhdFwiKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0d2luc1RyZWU7IiwiY29uc3Qgc2lnbnVwc2lnbmlubmFtZT1cIkIyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCJcclxuY29uc3QgYjJjVGVuYW50TmFtZT1cImF6dXJlaW90YjJjXCJcclxuXHJcbmNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxudmFyIHN0ckFycj13aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilcclxudmFyIGlzTG9jYWxUZXN0PShzdHJBcnIuaW5kZXhPZihcInRlc3Q9MVwiKSE9LTEpXHJcblxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz17XHJcbiAgICBcImIyY1NpZ25VcFNpZ25Jbk5hbWVcIjogc2lnbnVwc2lnbmlubmFtZSxcclxuICAgIFwiYjJjU2NvcGVfdGFza21hc3RlclwiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS90YXNrbWFzdGVybW9kdWxlL29wZXJhdGlvblwiLFxyXG4gICAgXCJiMmNTY29wZV9mdW5jdGlvbnNcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy9iYXNpY1wiLFxyXG4gICAgXCJsb2dvdXRSZWRpcmVjdFVyaVwiOiB1cmwub3JpZ2luK1wiL3NwYWluZGV4Lmh0bWxcIixcclxuICAgIFwibXNhbENvbmZpZ1wiOntcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IFwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbS9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9cIitzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb21cIl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImlzTG9jYWxUZXN0XCI6aXNMb2NhbFRlc3QsXHJcbiAgICBcInRhc2tNYXN0ZXJBUElVUklcIjooKGlzTG9jYWxUZXN0KT9cImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMi9cIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc3Rhc2ttYXN0ZXJtb2R1bGUuYXp1cmV3ZWJzaXRlcy5uZXQvXCIpLFxyXG4gICAgXCJmdW5jdGlvbnNBUElVUklcIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy5henVyZXdlYnNpdGVzLm5ldC9hcGkvXCJcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIG1zYWxIZWxwZXIoKXtcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNpZ25Jbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXNwb25zZT0gYXdhaXQgdGhpcy5teU1TQUxPYmoubG9naW5Qb3B1cCh7IHNjb3BlczpbXSAgfSkgLy9nbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXNcclxuICAgICAgICBpZiAocmVzcG9uc2UgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QWNjb3VudChyZXNwb25zZS5hY2NvdW50KVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYWNjb3VudFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSAgcmV0dXJuIHRoaXMuZmV0Y2hBY2NvdW50KClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBpZihlLmVycm9yQ29kZSE9XCJ1c2VyX2NhbmNlbGxlZFwiKSBjb25zb2xlLmxvZyhlKVxyXG4gICAgfVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zZXRBY2NvdW50PWZ1bmN0aW9uKHRoZUFjY291bnQpe1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbClyZXR1cm47XHJcbiAgICB0aGlzLmFjY291bnRJZCA9IHRoZUFjY291bnQuaG9tZUFjY291bnRJZDtcclxuICAgIHRoaXMuYWNjb3VudE5hbWUgPSB0aGVBY2NvdW50LnVzZXJuYW1lO1xyXG4gICAgdGhpcy51c2VyTmFtZT10aGVBY2NvdW50Lm5hbWU7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmZldGNoQWNjb3VudD1mdW5jdGlvbihub0FuaW1hdGlvbil7XHJcbiAgICBjb25zdCBjdXJyZW50QWNjb3VudHMgPSB0aGlzLm15TVNBTE9iai5nZXRBbGxBY2NvdW50cygpO1xyXG4gICAgaWYgKGN1cnJlbnRBY2NvdW50cy5sZW5ndGggPCAxKSByZXR1cm47XHJcbiAgICB2YXIgZm91bmRBY2NvdW50PW51bGw7XHJcbiAgICBmb3IodmFyIGk9MDtpPGN1cnJlbnRBY2NvdW50cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5BY2NvdW50PSBjdXJyZW50QWNjb3VudHNbaV1cclxuICAgICAgICBpZihhbkFjY291bnQuaG9tZUFjY291bnRJZC50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLmIyY1NpZ25VcFNpZ25Jbk5hbWUudG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuaXNzLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmtub3duQXV0aG9yaXRpZXNbMF0udG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuYXVkID09PSBnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGguY2xpZW50SWRcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBmb3VuZEFjY291bnQ9IGFuQWNjb3VudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnNldEFjY291bnQoZm91bmRBY2NvdW50KVxyXG4gICAgcmV0dXJuIGZvdW5kQWNjb3VudDtcclxufVxyXG5cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2U9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfZnVuY3Rpb25zKVxyXG4gICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy5mdW5jdGlvbnNBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUucGFyc2VKV1Q9ZnVuY3Rpb24odG9rZW4pe1xyXG4gICAgdmFyIGJhc2U2NFVybCA9IHRva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICB2YXIgYmFzZTY0ID0gYmFzZTY0VXJsLnJlcGxhY2UoLy0vZywgJysnKS5yZXBsYWNlKC9fL2csICcvJyk7XHJcbiAgICBiYXNlNjQ9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCk7XHJcbiAgICB2YXIganNvblBheWxvYWQgPSBkZWNvZGVVUklDb21wb25lbnQoYmFzZTY0LnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oYykge1xyXG4gICAgICAgIHJldHVybiAnJScgKyAoJzAwJyArIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC0yKTtcclxuICAgIH0pLmpvaW4oJycpKTtcclxuXHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uUGF5bG9hZCk7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnJlbG9hZFVzZXJBY2NvdW50RGF0YT1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXM9YXdhaXQgdGhpcy5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvZmV0Y2hVc2VyRGF0YVwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVXNlckRhdGEocmVzKVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQsd2l0aFByb2plY3RJRCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYod2l0aFByb2plY3RJRCl7XHJcbiAgICAgICAgcGF5bG9hZD1wYXlsb2FkfHx7fVxyXG4gICAgICAgIHBheWxvYWRbXCJwcm9qZWN0SURcIl09Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRFxyXG4gICAgfSBcclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG5cclxuICAgICAgICAvL2luIGNhc2Ugam9pbmVkIHByb2plY3RzIEpXVCBpcyBnb2luZyB0byBleHBpcmUsIHJlbmV3IGFub3RoZXIgb25lXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuam9pbmVkUHJvamVjdHNUb2tlbikge1xyXG4gICAgICAgICAgICB2YXIgZXhwVFM9dGhpcy5wYXJzZUpXVChnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKS5leHBcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGV4cFRTLWN1cnJUaW1lPDYwKXsgLy9mZXRjaCBhIG5ldyBwcm9qZWN0cyBKV1QgdG9rZW4gXHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZFVzZXJBY2NvdW50RGF0YSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaWYgdGhlIEFQSSBuZWVkIHRvIHVzZSBwcm9qZWN0IElELCBtdXN0IGFkZCBhIGhlYWRlciBcInByb2plY3RzXCIgand0IHRva2VuIHNvIHNlcnZlciBzaWRlIHdpbGwgdmVyaWZ5XHJcbiAgICAgICAgaWYocGF5bG9hZCAmJiBwYXlsb2FkLnByb2plY3RJRCAmJiBnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKXtcclxuICAgICAgICAgICAgaGVhZGVyc09ialtcInByb2plY3RzXCJdPWdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy50YXNrTWFzdGVyQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKGIyY1Njb3BlKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuPT1udWxsKSB0aGlzLnN0b3JlZFRva2VuPXt9XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5leHBpcmUpIHJldHVybiB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBbYjJjU2NvcGVdLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdPXtcImFjY2Vzc1Rva2VuXCI6cmVzcG9uc2UuYWNjZXNzVG9rZW4sXCJleHBpcmVcIjpyZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cH1cclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5cclxuY2xhc3MgYmFzZUluZm9QYW5lbCB7XHJcbiAgICBkcmF3RWRpdGFibGUocGFyZW50LGpzb25JbmZvLG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IG1hcmdpbi1yaWdodDo1cHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuM2VtXCIpIFxyXG4gICAgXHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5hZGRDbGFzcyhcInczLWxpbWVcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3Bkb3duT3B0aW9uKGNvbnRlbnRET00sbmV3UGF0aCxqc29uSW5mb1tpbmRdLG9yaWdpbkVsZW1lbnRJbmZvKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwicGFkZGluZzoycHg7d2lkdGg6NTAlO291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uYXBwZW5kKGFJbnB1dClcclxuICAgICAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICAgICAgaWYodmFsIT1udWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLCQoZS50YXJnZXQpLmRhdGEoXCJwYXRoXCIpLCQoZS50YXJnZXQpLnZhbCgpLCQoZS50YXJnZXQpLmRhdGEoXCJkYXRhVHlwZVwiKSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICAgICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciB0aGVKc29uPW9yaWdpbkVsZW1lbnRJbmZvXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgICAgICAgICAgaWYodGhlSnNvbj09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGVKc29uIC8vaXQgc2hvdWxkIGJlIHRoZSBmaW5hbCB2YWx1ZVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsdmFsdWVBcnIsb3JpZ2luRWxlbWVudEluZm8pe1xyXG4gICAgICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgICAgIGNvbnRlbnRET00uYXBwZW5kKGFTZWxlY3RNZW51LkRPTSlcclxuICAgICAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzdHIgPW9uZU9wdGlvbltcImRpc3BsYXlOYW1lXCJdICB8fCBvbmVPcHRpb25bXCJlbnVtVmFsdWVcIl0gXHJcbiAgICAgICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhU2VsZWN0TWVudS5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIilcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHZhbD10aGlzLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgICAgICB9ICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdTdGF0aWNJbmZvKHBhcmVudCxqc29uSW5mbyxwYWRkaW5nVG9wLGZvbnRTaXplLGZvbnRDb2xvcil7XHJcbiAgICAgICAgZm9udENvbG9yPWZvbnRDb2xvcnx8XCJibGFja1wiXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1kYXJrLWdyYXknIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiNmNmY2ZjY7ZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuICAgIFxyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpmb250Q29sb3J9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGJhc2VJbmZvUGFuZWw7IiwiY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdFByb2plY3REaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRQcm9qZWN0RGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uIChwcm9qZWN0SW5mbykge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLnByb2plY3RJbmZvPXByb2plY3RJbmZvXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCI0MjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPlByb2plY3QgU2V0dGluZzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciByb3cxPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChyb3cxKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5OYW1lIDwvZGl2PicpXHJcbiAgICByb3cxLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjcwJTsgZGlzcGxheTppbmxpbmU7bWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDoycHhcIiAgcGxhY2Vob2xkZXI9XCJQcm9qZWN0IE5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICByb3cxLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICBuYW1lSW5wdXQudmFsKHByb2plY3RJbmZvLm5hbWUpXHJcbiAgICBuYW1lSW5wdXQub24oXCJjaGFuZ2VcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciBuYW1lU3RyPW5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIGlmKG5hbWVTdHI9PVwiXCIpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCJOYW1lIGNhbiBub3QgYmUgZW1wdHkhXCIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHJlcXVlc3RCb2R5PXtcInByb2plY3RJRFwiOnByb2plY3RJbmZvLmlkLFwiYWNjb3VudHNcIjpbXSxcIm5ld1Byb2plY3ROYW1lXCI6bmFtZVN0cn1cclxuICAgICAgICByZXF1ZXN0Qm9keS5hY2NvdW50cz1yZXF1ZXN0Qm9keS5hY2NvdW50cy5jb25jYXQocHJvamVjdEluZm8uc2hhcmVXaXRoKVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L2NoYW5nZU93blByb2plY3ROYW1lXCIsIFwiUE9TVFwiLCByZXF1ZXN0Qm9keSlcclxuICAgICAgICAgICAgbmFtZUlucHV0LmJsdXIoKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgcmV0dXJuXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcblxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5TaGFyZSBXaXRoIDwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBzaGFyZUFjY291bnRJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6NjAlOyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkludml0ZWUgRW1haWwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICByb3cyLmFwcGVuZChzaGFyZUFjY291bnRJbnB1dClcclxuICAgIHZhciBpbnZpdGVCdG49JCgnPGEgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIGhyZWY9XCIjXCI+SW52aXRlPC9hPicpIFxyXG4gICAgcm93Mi5hcHBlbmQoaW52aXRlQnRuKSBcclxuXHJcbiAgICB2YXIgc2hhcmVBY2NvdW50c0xpc3Q9JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlciB3My1wYWRkaW5nJyBzdHlsZT0nbWFyZ2luOjFweCAxcHg7IGhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG8nPjxkaXY+XCIpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoc2hhcmVBY2NvdW50c0xpc3QpXHJcbiAgICB0aGlzLnNoYXJlQWNjb3VudHNMaXN0PXNoYXJlQWNjb3VudHNMaXN0O1xyXG4gICAgdGhpcy5kcmF3U2hhcmVkQWNjb3VudHMoKVxyXG5cclxuICAgIHNoYXJlQWNjb3VudElucHV0Lm9uKFwia2V5ZG93blwiLChldmVudCkgPT57XHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPT0gMTMpIHRoaXMuc2hhcmVXaXRoQWNjb3VudChzaGFyZUFjY291bnRJbnB1dClcclxuICAgIH0pO1xyXG4gICAgaW52aXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLnNoYXJlV2l0aEFjY291bnQoc2hhcmVBY2NvdW50SW5wdXQpfSlcclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLnNoYXJlV2l0aEFjY291bnQ9YXN5bmMgZnVuY3Rpb24oYWNjb3VudElucHV0KXtcclxuICAgIHZhciBzaGFyZVRvQWNjb3VudD1hY2NvdW50SW5wdXQudmFsKClcclxuICAgIGlmKHNoYXJlVG9BY2NvdW50PT1cIlwiKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSW5kZXg9IHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLmluZGV4T2Yoc2hhcmVUb0FjY291bnQpXHJcbiAgICBpZih0aGVJbmRleCE9LTEpIHJldHVybjtcclxuICAgIHZhciByZXF1ZXN0Qm9keT17XCJwcm9qZWN0SURcIjp0aGlzLnByb2plY3RJbmZvLmlkLFwic2hhcmVUb0FjY291bnRcIjpzaGFyZVRvQWNjb3VudH1cclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvc2hhcmVQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHJlcXVlc3RCb2R5KVxyXG4gICAgICAgIHRoaXMuYWRkQWNjb3VudFRvU2hhcmVXaXRoKHNoYXJlVG9BY2NvdW50KVxyXG4gICAgICAgIHRoaXMuZHJhd1NoYXJlZEFjY291bnRzKClcclxuICAgICAgICBhY2NvdW50SW5wdXQudmFsKFwiXCIpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUuYWRkQWNjb3VudFRvU2hhcmVXaXRoPWZ1bmN0aW9uKHNoYXJlVG9BY2NvdW50SUQpe1xyXG4gICAgdmFyIHRoZUluZGV4PSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5pbmRleE9mKHNoYXJlVG9BY2NvdW50SUQpXHJcbiAgICBpZih0aGVJbmRleD09LTEpIHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLnB1c2goc2hhcmVUb0FjY291bnRJRClcclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLmRyYXdTaGFyZWRBY2NvdW50cz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5zaGFyZUFjY291bnRzTGlzdC5lbXB0eSgpXHJcbiAgICB2YXIgc2hhcmVkQWNjb3VudD10aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aFxyXG4gICAgc2hhcmVkQWNjb3VudC5mb3JFYWNoKG9uZUVtYWlsID0+IHtcclxuICAgICAgICB2YXIgYXJvdyA9ICQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLnNoYXJlQWNjb3VudHNMaXN0LmFwcGVuZChhcm93KVxyXG4gICAgICAgIHZhciBsYWJsZSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj4nK29uZUVtYWlsKycgPC9kaXY+JylcclxuICAgICAgICBhcm93LmFwcGVuZChsYWJsZSlcclxuICAgICAgICB2YXIgcmVtb3ZlQnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlciB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHh5eVwiIGhyZWY9XCIjXCI+UmVtb3ZlPC9hPicpXHJcbiAgICAgICAgYXJvdy5hcHBlbmQocmVtb3ZlQnRuKVxyXG4gICAgICAgIHJlbW92ZUJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICAgICAgdmFyIHJlcXVlc3RCb2R5PXtcInByb2plY3RJRFwiOnRoaXMucHJvamVjdEluZm8uaWQsXCJub3RTaGFyZVRvQWNjb3VudFwiOm9uZUVtYWlsfVxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvbm90U2hhcmVQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHJlcXVlc3RCb2R5KVxyXG4gICAgICAgICAgICAgICAgdmFyIHRoZUluZGV4ID0gdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguaW5kZXhPZihvbmVFbWFpbClcclxuICAgICAgICAgICAgICAgIGlmICh0aGVJbmRleCAhPSAtMSkgdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguc3BsaWNlKHRoZUluZGV4LCAxKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U2hhcmVkQWNjb3VudHMoKVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGVkaXRQcm9qZWN0RGlhbG9nKCk7IiwiZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuYWNjb3VudEluZm89bnVsbDtcclxuICAgIHRoaXMuam9pbmVkUHJvamVjdHNUb2tlbj1udWxsO1xyXG4gICAgdGhpcy5zaG93RmxvYXRJbmZvUGFuZWw9dHJ1ZVxyXG4gICAgdGhpcy5EQk1vZGVsc0FyciA9IFtdXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIgPSBbXVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcbiAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSUQ9e31cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZT17fVxyXG4gICAgdGhpcy5zdG9yZWRUd2lucyA9IHt9XHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbj17XCJkZWZhdWx0XCI6e1wiZGV0YWlsXCI6e319fVxyXG5cclxuICAgIHRoaXMuaW5pdFN0b3JlZEluZm9ybXRpb24oKVxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmluaXRTdG9yZWRJbmZvcm10aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgPSB7fSBcclxuICAgIC8vc3RvcmVkIGRhdGEsIHNlcGVyYXRlbHkgZnJvbSBBRFQgc2VydmljZSBhbmQgZnJvbSBjb3Ntb3NEQiBzZXJ2aWNlXHJcbiAgICB0aGlzLmN1cnJlbnRMYXlvdXROYW1lPW51bGwgICBcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmZpbmRQcm9qZWN0SW5mbz1mdW5jdGlvbihwcm9qZWN0SUQpe1xyXG4gICAgdmFyIGpvaW5lZFByb2plY3RzPXRoaXMuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHNcclxuICAgIGZvcih2YXIgaT0wO2k8am9pbmVkUHJvamVjdHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZVByb2plY3Q9am9pbmVkUHJvamVjdHNbaV1cclxuICAgICAgICBpZihvbmVQcm9qZWN0LmlkPT1wcm9qZWN0SUQpIHJldHVybiBvbmVQcm9qZWN0XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVBRFRUd2lucz1mdW5jdGlvbih0d2luc0RhdGEpe1xyXG4gICAgdHdpbnNEYXRhLmZvckVhY2goKG9uZU5vZGUpPT57dGhpcy5zdG9yZVNpbmdsZUFEVFR3aW4ob25lTm9kZSl9KTtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlQURUVHdpbj1mdW5jdGlvbihvbmVOb2RlKXtcclxuICAgIHRoaXMuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGVcclxuICAgIG9uZU5vZGVbXCJkaXNwbGF5TmFtZVwiXT0gdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZU5vZGVbXCIkZHRJZFwiXV1cclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCVHdpbj1mdW5jdGlvbihEQlR3aW4pe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZURCVHdpbj10aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihvbmVEQlR3aW5bXCJpZFwiXT09REJUd2luW1wiaWRcIl0pe1xyXG4gICAgICAgICAgICB0aGlzLkRCVHdpbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLnB1c2goREJUd2luKVxyXG5cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtEQlR3aW5bXCJpZFwiXV09REJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJUd2luc0Fycj1mdW5jdGlvbihEQlR3aW5zQXJyKXtcclxuICAgIHRoaXMuREJUd2luc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQlR3aW5zQXJyPXRoaXMuREJUd2luc0Fyci5jb25jYXQoREJUd2luc0FycilcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZSkgZGVsZXRlIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtpbmRdXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lREJUd2luW1wiaWRcIl1dPW9uZURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubWVyZ2VEQlR3aW5zQXJyPWZ1bmN0aW9uKERCVHdpbnNBcnIpe1xyXG4gICAgdmFyIGlkTGlzdD17fVxyXG4gICAgdmFyIGFycj1bXS5jb25jYXQoREJUd2luc0FycilcclxuICAgIGFyci5mb3JFYWNoKGFEQlR3aW49PntcclxuICAgICAgICBpZExpc3RbYURCVHdpbi5pZF09MVxyXG4gICAgfSlcclxuICAgIHRoaXMuREJUd2luc0Fyci5mb3JFYWNoKGFEQlR3aW49PntcclxuICAgICAgICBpZihpZExpc3RbYURCVHdpbi5pZF0pIHJldHVybjtcclxuICAgICAgICBhcnIucHVzaChhREJUd2luKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLnN0b3JlREJUd2luc0FycihhcnIpXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVVzZXJEYXRhPWZ1bmN0aW9uKHJlcyl7XHJcbiAgICByZXMuZm9yRWFjaChvbmVSZXNwb25zZT0+e1xyXG4gICAgICAgIGlmKG9uZVJlc3BvbnNlLnR5cGU9PVwiam9pbmVkUHJvamVjdHNUb2tlblwiKSB0aGlzLmpvaW5lZFByb2plY3RzVG9rZW49b25lUmVzcG9uc2Uuand0O1xyXG4gICAgICAgIGVsc2UgaWYob25lUmVzcG9uc2UudHlwZT09XCJ1c2VyXCIpIHRoaXMuYWNjb3VudEluZm89b25lUmVzcG9uc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RNb2RlbHNEYXRhPWZ1bmN0aW9uKERCTW9kZWxzLGFkdE1vZGVscyl7XHJcbiAgICB0aGlzLnN0b3JlREJNb2RlbHNBcnIoREJNb2RlbHMpXHJcblxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxOYW1lTWFwVG9JRCkgZGVsZXRlIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtpbmRdXHJcblxyXG4gICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkdE1vZGVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9PSBudWxsKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcIkBpZFwiXVxyXG4gICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0pKSB7XHJcbiAgICAgICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgZWxzZSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IEpTT04uc3RyaW5naWZ5KGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodG1wTmFtZVRvT2JqW2FkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRtcE5hbWVUb09ialthZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSAxXHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVthZHRNb2RlbHNbaV1bXCJAaWRcIl1dID0gYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSURbYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICB9XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RUd2luc0FuZFZpc3VhbERhdGE9ZnVuY3Rpb24ocmVzQXJyKXtcclxuICAgIHZhciBkYnR3aW5zPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnZpc3VhbERlZmluaXRpb24pIGRlbGV0ZSB0aGlzLnZpc3VhbERlZmluaXRpb25baW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5sYXlvdXRKU09OKSBkZWxldGUgdGhpcy5sYXlvdXRKU09OW2luZF1cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl09e1wiZGV0YWlsXCI6e319XHJcblxyXG4gICAgcmVzQXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudC50eXBlPT1cInZpc3VhbFNjaGVtYVwiKSB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogbm93IHRoZXJlIGlzIG9ubHkgb25lIFwiZGVmYXVsdFwiIHNjaGVtYSB0byB1c2UsY29uc2lkZXIgYWxsb3cgY3JlYXRpbmcgbW9yZSB1c2VyIGRlZmluZSB2aXN1YWwgc2NoZW1hXHJcbiAgICAgICAgICAgIC8vVE9ETzogb25seSBjaG9vc2UgdGhlIHNjaGVtYSBiZWxvbmdzIHRvIHNlbGZcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRTaW5nbGVWaXN1YWxTY2hlbWEoZWxlbWVudC5kZXRhaWwsZWxlbWVudC5hY2NvdW50SUQsZWxlbWVudC5uYW1lLGVsZW1lbnQuaXNTaGFyZWQpXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRTaW5nbGVMYXlvdXQoZWxlbWVudC5kZXRhaWwsZWxlbWVudC5hY2NvdW50SUQsZWxlbWVudC5uYW1lLGVsZW1lbnQuaXNTaGFyZWQpXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUVHdpblwiKSBkYnR3aW5zLnB1c2goZWxlbWVudClcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zdG9yZURCVHdpbnNBcnIoZGJ0d2lucylcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnJlY29yZFNpbmdsZVZpc3VhbFNjaGVtYT1mdW5jdGlvbihkZXRhaWwsYWNjb3VudElELG9uYW1lLGlzU2hhcmVkKXtcclxuICAgIGlmIChhY2NvdW50SUQgPT0gdGhpcy5hY2NvdW50SW5mby5pZCkgdmFyIHZzTmFtZSA9IG9uYW1lXHJcbiAgICBlbHNlIHZzTmFtZSA9IG9uYW1lICsgYChmcm9tICR7YWNjb3VudElEfSlgXHJcbiAgICB2YXIgZGljdCA9IHsgXCJkZXRhaWxcIjogZGV0YWlsLCBcImlzU2hhcmVkXCI6IGlzU2hhcmVkLCBcIm93bmVyXCI6IGFjY291bnRJRCwgXCJvbmFtZVwiOiBvbmFtZX1cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvblt2c05hbWVdPWRpY3RcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnJlY29yZFNpbmdsZUxheW91dD1mdW5jdGlvbihkZXRhaWwsYWNjb3VudElELG9uYW1lLGlzU2hhcmVkKXtcclxuICAgIGlmIChhY2NvdW50SUQgPT0gdGhpcy5hY2NvdW50SW5mby5pZCkgdmFyIGxheW91dE5hbWUgPSBvbmFtZVxyXG4gICAgZWxzZSBsYXlvdXROYW1lID0gb25hbWUgKyBgKGZyb20gJHthY2NvdW50SUR9KWBcclxuICAgIHZhciBkaWN0ID0geyBcImRldGFpbFwiOiBkZXRhaWwsIFwiaXNTaGFyZWRcIjogaXNTaGFyZWQsIFwib3duZXJcIjogYWNjb3VudElELCBcIm5hbWVcIjogbGF5b3V0TmFtZSwgXCJvbmFtZVwiOm9uYW1lIH1cclxuICAgIHRoaXMubGF5b3V0SlNPTltsYXlvdXROYW1lXSA9IGRpY3RcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldERCVHdpbnNCeU1vZGVsSUQ9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcmVzdWx0QXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLm1vZGVsSUQ9PW1vZGVsSUQpe1xyXG4gICAgICAgICAgICByZXN1bHRBcnIucHVzaChlbGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlc3VsdEFycjtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCVHdpbkJ5SUQ9ZnVuY3Rpb24odHdpbklEKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihlbGUuaWQ9PXR3aW5JRCl7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCVHdpbkJ5SW5kb29yRmVhdHVyZUlEPWZ1bmN0aW9uKGZlYXR1cmVJRCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLkdJUyAmJiBlbGUuR0lTLmluZG9vcil7XHJcbiAgICAgICAgICAgIGlmKGVsZS5HSVMuaW5kb29yLkluZG9vckZlYXR1cmVJRD09ZmVhdHVyZUlEKSByZXR1cm4gZWxlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5nZXRTaW5nbGVEQk1vZGVsQnlJRD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQk1vZGVsc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5pZD09bW9kZWxJRCl7XHJcbiAgICAgICAgICAgIHJldHVybiBlbGVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlREJNb2RlbD1mdW5jdGlvbihzaW5nbGVEQk1vZGVsSW5mbyl7XHJcbiAgICB2YXIgbW9kZWxJRCA9IHNpbmdsZURCTW9kZWxJbmZvLmlkXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuREJNb2RlbHNBcnJbaV1cclxuICAgICAgICBpZihlbGUuaWQ9PW1vZGVsSUQpe1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBlbGUpIGRlbGV0ZSBlbGVbaW5kXVxyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBzaW5nbGVEQk1vZGVsSW5mbykgZWxlW2luZF09c2luZ2xlREJNb2RlbEluZm9baW5kXVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLy9pdCBpcyBhIG5ldyBzaW5nbGUgbW9kZWwgaWYgY29kZSByZWFjaGVzIGhlcmVcclxuICAgIHRoaXMuREJNb2RlbHNBcnIucHVzaChzaW5nbGVEQk1vZGVsSW5mbylcclxuICAgIHRoaXMuc29ydERCTW9kZWxzQXJyKClcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJNb2RlbHNBcnI9ZnVuY3Rpb24oREJNb2RlbHNBcnIpe1xyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQk1vZGVsc0Fycj10aGlzLkRCTW9kZWxzQXJyLmNvbmNhdChEQk1vZGVsc0FycilcclxuICAgIHRoaXMuc29ydERCTW9kZWxzQXJyKClcclxuICAgIFxyXG59XHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zb3J0REJNb2RlbHNBcnI9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuREJNb2RlbHNBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyBcclxuICAgICAgICB2YXIgYU5hbWU9YS5kaXNwbGF5TmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgdHdpbklEPW9uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdPVtdXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgaWYoIXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dKVxyXG4gICAgICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXT1bXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBnbG9iYWxDYWNoZSgpOyIsImNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJhbmFseXplIG1vZGVsIGluZm9cIilcclxuICAgIC8vYW5hbHl6ZSBhbGwgcmVsYXRpb25zaGlwIHR5cGVzXHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKSBkZWxldGUgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpZF1cclxuICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYSA9IHt9XHJcbiAgICAgICAgaWYgKGVsZS5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnIgPSBlbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnIgPSBbZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dID0gZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGVudEFyciA9IGVsZS5jb250ZW50c1xyXG4gICAgICAgIGlmICghY29udGVudEFycikgY29udGludWU7XHJcbiAgICAgICAgY29udGVudEFyci5mb3JFYWNoKChvbmVDb250ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChvbmVDb250ZW50W1wiQHR5cGVcIl0gPT0gXCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dKSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT0ge31cclxuICAgICAgICAgICAgICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdID0gb25lQ29udGVudFxyXG4gICAgICAgICAgICAgICAgb25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMgPSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob25lQ29udGVudC5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBvbmVDb250ZW50LnByb3BlcnRpZXMsIGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2FuYWx5emUgZWFjaCBtb2RlbCdzIHByb3BlcnR5IHRoYXQgY2FuIGJlIGVkaXRlZFxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7IC8vZXhwYW5kIHBvc3NpYmxlIGVtYmVkZGVkIHNjaGVtYSB0byBlZGl0YWJsZVByb3BlcnRpZXMsIGFsc28gZXh0cmFjdCBwb3NzaWJsZSByZWxhdGlvbnNoaXAgdHlwZXMgZm9yIHRoaXMgbW9kZWxcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYT17fVxyXG4gICAgICAgIGlmKGVsZS5zY2hlbWFzKXtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyPWVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFycj1bZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXT1lbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllcz17fVxyXG4gICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHM9e31cclxuICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzPVtdXHJcbiAgICAgICAgZWxlLmFsbEJhc2VDbGFzc2VzPXt9XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlbGUuY29udGVudHMsZW1iZWRkZWRTY2hlbWEpXHJcblxyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHNbb25lQ29udGVudFtcIm5hbWVcIl1dPXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaChvbmVDb250ZW50PT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiQ29tcG9uZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnROYW1lPW9uZUNvbnRlbnRbXCJuYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudENsYXNzPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV0sY29tcG9uZW50Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudE5hbWUpXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBiYXNlIGNsYXNzIHByb3BlcnRpZXMgdG8gZWRpdGFibGVQcm9wZXJ0aWVzIGFuZCB2YWxpZCByZWxhdGlvbnNoaXAgdHlwZXMgdG8gdmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgYmFzZUNsYXNzSURzPWVsZS5leHRlbmRzO1xyXG4gICAgICAgIGlmKGJhc2VDbGFzc0lEcz09bnVsbCkgY29udGludWU7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWJhc2VDbGFzc0lEc1xyXG4gICAgICAgIGVsc2UgdG1wQXJyPVtiYXNlQ2xhc3NJRHNdXHJcbiAgICAgICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKGVsZS5hbGxCYXNlQ2xhc3NlcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MoZWxlLnZhbGlkUmVsYXRpb25zaGlwcyxlYWNoQmFzZSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5EVERMTW9kZWxzKVxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgY2hpbGRNb2RlbElEcz1bXVxyXG4gICAgZm9yKHZhciBhSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIgYU1vZGVsPXRoaXMuRFRETE1vZGVsc1thSURdXHJcbiAgICAgICAgaWYoYU1vZGVsLmFsbEJhc2VDbGFzc2VzICYmIGFNb2RlbC5hbGxCYXNlQ2xhc3Nlc1ttb2RlbElEXSkgY2hpbGRNb2RlbElEcy5wdXNoKGFNb2RlbFtcIkBpZFwiXSlcclxuICAgIH1cclxuICAgIHJldHVybiBjaGlsZE1vZGVsSURzXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmRlbGV0ZU1vZGVsPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsZnVuY0FmdGVyRmFpbCxjb21wbGV0ZUZ1bmMpe1xyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz10aGlzLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIG1vZGVsTGV2ZWw9W11cclxuICAgIHJlbGF0ZWRNb2RlbElEcy5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgdmFyIGNoZWNrTW9kZWw9dGhpcy5EVERMTW9kZWxzW29uZUlEXVxyXG4gICAgICAgIG1vZGVsTGV2ZWwucHVzaCh7XCJtb2RlbElEXCI6b25lSUQsXCJsZXZlbFwiOk9iamVjdC5rZXlzKGNoZWNrTW9kZWwuYWxsQmFzZUNsYXNzZXMpLmxlbmd0aH0pXHJcbiAgICB9KVxyXG4gICAgbW9kZWxMZXZlbC5wdXNoKHtcIm1vZGVsSURcIjptb2RlbElELFwibGV2ZWxcIjowfSlcclxuICAgIG1vZGVsTGV2ZWwuc29ydChmdW5jdGlvbiAoYSwgYikge3JldHVybiBiW1wibGV2ZWxcIl0tYVtcImxldmVsXCJdIH0pO1xyXG4gICAgXHJcbiAgICBmb3IodmFyIGk9MDtpPG1vZGVsTGV2ZWwubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFNb2RlbElEPW1vZGVsTGV2ZWxbaV0ubW9kZWxJRFxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTW9kZWxcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbFwiOiBhTW9kZWxJRCB9LFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2FNb2RlbElEXVxyXG4gICAgICAgICAgICBpZihmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSkgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUoYU1vZGVsSUQpXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICB2YXIgZGVsZXRlZE1vZGVscz1bXVxyXG4gICAgICAgICAgICB2YXIgYWxlcnRTdHI9XCJEZWxldGUgbW9kZWwgaXMgaW5jb21wbGV0ZS4gRGVsZXRlZCBNb2RlbDpcIlxyXG4gICAgICAgICAgICBmb3IodmFyIGo9MDtqPGk7aisrKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0U3RyKz0gbW9kZWxMZXZlbFtqXS5tb2RlbElEK1wiIFwiXHJcbiAgICAgICAgICAgICAgICBkZWxldGVkTW9kZWxzLnB1c2gobW9kZWxMZXZlbFtqXS5tb2RlbElEKVxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICBhbGVydFN0cis9XCIuIEZhaWwgdG8gZGVsZXRlIFwiK2FNb2RlbElEK1wiLiBFcnJvciBpcyBcIitlXHJcbiAgICAgICAgICAgIGlmKGZ1bmNBZnRlckZhaWwpIGZ1bmNBZnRlckZhaWwoZGVsZXRlZE1vZGVscylcclxuICAgICAgICAgICAgYWxlcnQoZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihjb21wbGV0ZUZ1bmMpIGNvbXBsZXRlRnVuYygpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsQW5hbHl6ZXIoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2c9cmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxFZGl0b3JEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMFwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjY1cHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWwgRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBidXR0b25Sb3c9JCgnPGRpdiAgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoYnV0dG9uUm93KVxyXG4gICAgdmFyIGltcG9ydEJ1dHRvbiA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmltcG9ydEJ1dHRvbj1pbXBvcnRCdXR0b25cclxuICAgIGJ1dHRvblJvdy5hcHBlbmQoaW1wb3J0QnV0dG9uKVxyXG5cclxuICAgIGltcG9ydEJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtcclxuICAgICAgICB2YXIgY3VycmVudE1vZGVsSUQ9dGhpcy5kdGRsb2JqW1wiQGlkXCJdXHJcbiAgICAgICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW2N1cnJlbnRNb2RlbElEXT09bnVsbCkgdGhpcy5pbXBvcnRNb2RlbEFycihbdGhpcy5kdGRsb2JqXSlcclxuICAgICAgICBlbHNlIHRoaXMucmVwbGFjZU1vZGVsKCkgICAgICAgXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPk1vZGVsIFRlbXBsYXRlPC9kaXY+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMH0pXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5ET00pXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVRlbXBsYXRlKG9wdGlvblZhbHVlKVxyXG4gICAgfVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihcIk5ldyBNb2RlbC4uLlwiLFwiTmV3XCIpXHJcbiAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24obW9kZWxOYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD1cIjQ1MHB4XCJcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjMzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O2hlaWdodDonK3BhbmVsSGVpZ2h0Kyc7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIGR0ZGxTY3JpcHRQYW5lbD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4O3dpZHRoOjMxMHB4O2hlaWdodDonK3BhbmVsSGVpZ2h0KydcIj48L2Rpdj4nKVxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChkdGRsU2NyaXB0UGFuZWwpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbD1kdGRsU2NyaXB0UGFuZWxcclxuXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZXBsYWNlTW9kZWw9ZnVuY3Rpb24oKXtcclxuICAgIC8vZGVsZXRlIHRoZSBvbGQgc2FtZSBuYW1lIG1vZGVsLCB0aGVuIGNyZWF0ZSBpdCBhZ2FpblxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG5cclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcblxyXG4gICAgdmFyIGRpYWxvZ1N0ciA9IChyZWxhdGVkTW9kZWxJRHMubGVuZ3RoID09IDApID8gKFwiVHdpbnMgd2lsbCBiZSBpbXBhY3QgdW5kZXIgbW9kZWwgXFxcIlwiICsgY3VycmVudE1vZGVsSUQgKyBcIlxcXCJcIikgOlxyXG4gICAgICAgIChjdXJyZW50TW9kZWxJRCArIFwiIGlzIGJhc2UgbW9kZWwgb2YgXCIgKyByZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpICsgXCIuIFR3aW5zIHVuZGVyIHRoZXNlIG1vZGVscyB3aWxsIGJlIGltcGFjdC5cIilcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpcm1SZXBsYWNlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApICAgIFxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuaW1wb3J0TW9kZWxBcnI9YXN5bmMgZnVuY3Rpb24obW9kZWxUb0JlSW1wb3J0ZWQsZm9yUmVwbGFjaW5nLGFmdGVyRmFpbHVyZSl7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ltcG9ydE1vZGVsc1wiLCBcIlBPU1RcIiwgeyBcIm1vZGVsc1wiOiBKU09OLnN0cmluZ2lmeShtb2RlbFRvQmVJbXBvcnRlZCkgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICBpZihmb3JSZXBsYWNpbmcpIGFsZXJ0KFwiTW9kZWwgXCIgKyB0aGlzLmR0ZGxvYmpbXCJkaXNwbGF5TmFtZVwiXSArIFwiIGlzIG1vZGlmaWVkIHN1Y2Nlc3NmdWxseSFcIilcclxuICAgICAgICBlbHNlIGFsZXJ0KFwiTW9kZWwgXCIgKyB0aGlzLmR0ZGxvYmpbXCJkaXNwbGF5TmFtZVwiXSArIFwiIGlzIGNyZWF0ZWQhXCIpXHJcblxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsRWRpdGVkXCIgfSlcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhtb2RlbFRvQmVJbXBvcnRlZCkgLy9hZGQgc28gaW1tZWRpYXRsZXkgdGhlIGxpc3QgY2FuIHNob3cgdGhlIG5ldyBtb2RlbHNcclxuICAgICAgICB0aGlzLnBvcHVwKCkgLy9yZWZyZXNoIGNvbnRlbnRcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBpZihhZnRlckZhaWx1cmUpIGFmdGVyRmFpbHVyZSgpXHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9IFxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuY29uZmlybVJlcGxhY2VNb2RlbD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgIHZhciBiYWNrdXBNb2RlbHM9W11cclxuICAgIHJlbGF0ZWRNb2RlbElEcy5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgYmFja3VwTW9kZWxzLnB1c2goSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbb25lSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgfSlcclxuICAgIGJhY2t1cE1vZGVscy5wdXNoKHRoaXMuZHRkbG9iailcclxuICAgIHZhciBiYWNrdXBNb2RlbHNTdHI9ZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGJhY2t1cE1vZGVscykpXHJcblxyXG4gICAgdmFyIGZ1bmNBZnRlckZhaWw9KGRlbGV0ZWRNb2RlbElEcyk9PntcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgYmFja3VwTW9kZWxzU3RyKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydE1vZGVsc0FmdGVyRmFpbGVkT3BlcmF0aW9uLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH1cclxuICAgIHZhciBmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSA9IChlYWNoRGVsZXRlZE1vZGVsSUQsZWFjaE1vZGVsTmFtZSkgPT4ge31cclxuICAgIFxyXG4gICAgdmFyIGNvbXBsZXRlRnVuYz0oKT0+eyBcclxuICAgICAgICAvL2ltcG9ydCBhbGwgdGhlIG1vZGVscyBhZ2FpblxyXG4gICAgICAgIHRoaXMuaW1wb3J0TW9kZWxBcnIoYmFja3VwTW9kZWxzLFwiZm9yUmVwbGFjaW5nXCIsZnVuY0FmdGVyRmFpbClcclxuICAgIH1cclxuICAgIG1vZGVsQW5hbHl6ZXIuZGVsZXRlTW9kZWwobW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxmdW5jQWZ0ZXJGYWlsLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxuXHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuY2hvb3NlVGVtcGxhdGU9ZnVuY3Rpb24odGVtcGFsdGVOYW1lKXtcclxuICAgIGlmKHRlbXBhbHRlTmFtZSE9XCJOZXdcIil7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqPUpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RlbXBhbHRlTmFtZV1bXCJvcmlnaW5hbFwiXSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaiA9IHtcclxuICAgICAgICAgICAgXCJAaWRcIjogXCJkdG1pOmFOYW1lU3BhY2U6YU1vZGVsSUQ7MVwiLFxyXG4gICAgICAgICAgICBcIkBjb250ZXh0XCI6IFtcImR0bWk6ZHRkbDpjb250ZXh0OzJcIl0sXHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJJbnRlcmZhY2VcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5TmFtZVwiOiBcIk5ldyBNb2RlbFwiLFxyXG4gICAgICAgICAgICBcImNvbnRlbnRzXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJhdHRyaWJ1dGUxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgICAgICAgICAgfSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImxpbmtcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5yZWZyZXNoRFRETCgpXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPk1vZGVsIElEICYgTmFtZTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5tb2RlbCBJRCBjb250YWlucyBuYW1lc3BhY2UsIGEgbW9kZWwgc3RyaW5nIGFuZCBhIHZlcnNpb24gbnVtYmVyPC9wPjwvZGl2PjwvZGl2PicpKVxyXG4gICAgbmV3IGlkUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuICAgIG5ldyBkaXNwbGF5TmFtZVJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdKXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdPVtdXHJcbiAgICBuZXcgcGFyYW1ldGVyc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyByZWxhdGlvbnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgY29tcG9uZW50c1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSl0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdPVtdXHJcbiAgICBuZXcgYmFzZUNsYXNzZXNSb3codGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hEVERMPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2l0IHdpbGwgcmVmcmVzaCB0aGUgZ2VuZXJhdGVkIERUREwgc2FtcGxlLCBpdCB3aWxsIGFsc28gY2hhbmdlIHRoZSBpbXBvcnQgYnV0dG9uIHRvIHNob3cgXCJDcmVhdGVcIiBvciBcIk1vZGlmeVwiXHJcbiAgICB2YXIgY3VycmVudE1vZGVsSUQ9dGhpcy5kdGRsb2JqW1wiQGlkXCJdXHJcbiAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbY3VycmVudE1vZGVsSURdPT1udWxsKSB0aGlzLmltcG9ydEJ1dHRvbi50ZXh0KFwiQ3JlYXRlXCIpXHJcbiAgICBlbHNlIHRoaXMuaW1wb3J0QnV0dG9uLnRleHQoXCJNb2RpZnlcIilcclxuXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IFwidW5rbm93blwiXHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUJhc2VjbGFzc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBiYXNlQ2xhc3NOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MjIwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJiYXNlIG1vZGVsIGlkXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoYmFzZUNsYXNzTmFtZUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0LnZhbChkdGRsT2JqKVxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9ialtpXT1iYXNlQ2xhc3NOYW1lSW5wdXQudmFsKClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wb25lbnRzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkNvbXBvbmVudHM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Q29tcG9uZW50IG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFyZSBlbWJlZGRlZCB1bmRlciBhIG5hbWU8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIlNvbWVDb21wb25lbnRcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjpcImR0bWk6c29tZUNvbXBvbmVudE1vZGVsOzFcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVDb21wb25lbnRSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIkNvbXBvbmVudFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVDb21wb25lbnRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgY29tcG9uZW50TmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgc2NoZW1hSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJjb21wb25lbnQgbW9kZWwgaWQuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb21wb25lbnROYW1lSW5wdXQsc2NoZW1hSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgY29tcG9uZW50TmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHNjaGVtYUlucHV0LnZhbChkdGRsT2JqW1wic2NoZW1hXCJdfHxcIlwiKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09Y29tcG9uZW50TmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBzY2hlbWFJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXT1zY2hlbWFJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWxhdGlvbnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UmVsYXRpb25zaGlwIFR5cGVzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPlJlbGF0aW9uc2hpcCBjYW4gaGF2ZSBpdHMgb3duIHBhcmFtZXRlcnM8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJQcm9wZXJ0eVwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVBhcmFtZXRlclJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaix0b3BMZXZlbCxkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcGFyYW1ldGVyTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicGFyYW1ldGVyIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgZW51bVZhbHVlSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJzdHIxLHN0cjIsLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtcGx1cyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBwdHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheSB3My1iYXItaXRlbVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggNXB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMCxcImlzQ2xpY2thYmxlXCI6MSxcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjotMTUwLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjo2MCxcclxuICAgIFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjpkaWFsb2dPZmZzZXR9KVxyXG4gICAgcHR5cGVTZWxlY3Rvci5hZGRPcHRpb25BcnIoW1wic3RyaW5nXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwiRW51bVwiLFwiT2JqZWN0XCIsXCJkb3VibGVcIixcImJvb2xlYW5cIixcImRhdGVcIixcImRhdGVUaW1lXCIsXCJkdXJhdGlvblwiLFwibG9uZ1wiLFwidGltZVwiXSlcclxuICAgIERPTS5hcHBlbmQocGFyYW1ldGVyTmFtZUlucHV0LHB0eXBlU2VsZWN0b3IuRE9NLGVudW1WYWx1ZUlucHV0LGFkZEJ1dHRvbixyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIHB0eXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGNvbnRlbnRET00uZW1wdHkoKS8vY2xlYXIgYWxsIGNvbnRlbnQgZG9tIGNvbnRlbnRcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljayl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIGR0ZGxPYmopIGRlbGV0ZSBkdGRsT2JqW2luZF0gICAgLy9jbGVhciBhbGwgb2JqZWN0IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYodG9wTGV2ZWwpIGR0ZGxPYmpbXCJAdHlwZVwiXT1cIlByb3BlcnR5XCJcclxuICAgICAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBpZihvcHRpb25UZXh0PT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5zaG93KCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJFbnVtXCIsXCJ2YWx1ZVNjaGVtYVwiOiBcInN0cmluZ1wifVxyXG4gICAgICAgIH1lbHNlIGlmKG9wdGlvblRleHQ9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5zaG93KClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJPYmplY3RcIn1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0pIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl09W11cclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBlbnVtVmFsdWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgdmFyIHZhbHVlQXJyPWVudW1WYWx1ZUlucHV0LnZhbCgpLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdPVtdXHJcbiAgICAgICAgdmFsdWVBcnIuZm9yRWFjaChhVmFsPT57XHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IGFWYWwucmVwbGFjZShcIiBcIixcIlwiKSwgLy9yZW1vdmUgYWxsIHRoZSBzcGFjZSBpbiBuYW1lXHJcbiAgICAgICAgICAgICAgICBcImVudW1WYWx1ZVwiOiBhVmFsXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYodHlwZW9mKGR0ZGxPYmpbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnKSB2YXIgc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1cclxuICAgIGVsc2Ugc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXVxyXG4gICAgcHR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoc2NoZW1hKVxyXG4gICAgaWYoc2NoZW1hPT1cIkVudW1cIil7XHJcbiAgICAgICAgdmFyIGVudW1BcnI9ZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICBpZihlbnVtQXJyIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGlucHV0U3RyPVwiXCJcclxuICAgICAgICAgICAgZW51bUFyci5mb3JFYWNoKG9uZUVudW1WYWx1ZT0+e2lucHV0U3RyKz1vbmVFbnVtVmFsdWUuZW51bVZhbHVlK1wiLFwifSlcclxuICAgICAgICAgICAgaW5wdXRTdHI9aW5wdXRTdHIuc2xpY2UoMCwgLTEpLy9yZW1vdmUgdGhlIGxhc3QgXCIsXCJcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKGlucHV0U3RyKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKHNjaGVtYT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgdmFyIGZpZWxkcz1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdXHJcbiAgICAgICAgZmllbGRzLmZvckVhY2gob25lRmllbGQ9PntcclxuICAgICAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhvbmVGaWVsZCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpZFJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPmR0bWk6PC9kaXY+JylcclxuICAgIHZhciBkb21haW5JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo4OHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTmFtZXNwYWNlXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIG1vZGVsSURJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMzJweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdmVyc2lvbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJ2ZXJzaW9uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsZG9tYWluSW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OjwvZGl2PicpLG1vZGVsSURJbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj47PC9kaXY+JyksdmVyc2lvbklucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgdmFyIHN0cj1gZHRtaToke2RvbWFpbklucHV0LnZhbCgpfToke21vZGVsSURJbnB1dC52YWwoKX07JHt2ZXJzaW9uSW5wdXQudmFsKCl9YFxyXG4gICAgICAgIGR0ZGxPYmpbXCJAaWRcIl09c3RyXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGRvbWFpbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICBtb2RlbElESW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZlcnNpb25JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG5cclxuICAgIHZhciBzdHI9ZHRkbE9ialtcIkBpZFwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCl7XHJcbiAgICAgICAgdmFyIGFycjE9c3RyLnNwbGl0KFwiO1wiKVxyXG4gICAgICAgIGlmKGFycjEubGVuZ3RoIT0yKSByZXR1cm47XHJcbiAgICAgICAgdmVyc2lvbklucHV0LnZhbChhcnIxWzFdKVxyXG4gICAgICAgIHZhciBhcnIyPWFycjFbMF0uc3BsaXQoXCI6XCIpXHJcbiAgICAgICAgZG9tYWluSW5wdXQudmFsKGFycjJbMV0pXHJcbiAgICAgICAgYXJyMi5zaGlmdCgpOyBhcnIyLnNoaWZ0KClcclxuICAgICAgICBtb2RlbElESW5wdXQudmFsKGFycjIuam9pbihcIjpcIikpXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BsYXlOYW1lUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+RGlzcGxheSBOYW1lOjwvZGl2PicpXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE1MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLG5hbWVJbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdPW5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBuYW1lSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZhciBzdHI9ZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKSBuYW1lSW5wdXQudmFsKHN0cilcclxufSIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVUcmVlPSByZXF1aXJlKFwiLi9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxFZGl0b3JEaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbE1hbmFnZXJEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNob3dSZWxhdGlvblZpc3VhbGl6YXRpb25TZXR0aW5ncz10cnVlO1xyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBpbXBvcnRNb2RlbHNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRNb2RlbHNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIG1vZGVsRWRpdG9yQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkNyZWF0ZS9Nb2RpZnkgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cG9ydE1vZGVsQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkV4cG9ydCBBbGwgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nOjBweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MTBweDtoZWlnaHQ6NDEycHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoZGVsQnRuKVxyXG5cclxuXHJcbiAgICB2YXIgaW1wb3J0UGljQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLWFtYmVyIHczLWJvcmRlci1yaWdodFwiPlVwbG9hZCBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFBpY0J0biA9ICQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJpbWdcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBjbGVhckF2YXJ0YUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkNsZWFyIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChpbXBvcnRQaWNCdG4sIGFjdHVhbEltcG9ydFBpY0J0biwgY2xlYXJBdmFydGFCdG4pXHJcbiAgICBpbXBvcnRQaWNCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhY3R1YWxJbXBvcnRQaWNCdG4uY2hhbmdlKGFzeW5jIChldnQpID0+IHtcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICB2YXIgdGhlRmlsZSA9IGZpbGVzWzBdXHJcblxyXG4gICAgICAgIGlmICh0aGVGaWxlLnR5cGUgPT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUodGhlRmlsZSlcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSAnZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhlRmlsZS50eXBlLm1hdGNoKCdpbWFnZS4qJykpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBhd2FpdCB0aGlzLnJlc2l6ZUltZ0ZpbGUodGhlRmlsZSwgNzApXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyh7IHdpZHRoOiBcIjIwMHB4XCIgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJOb3RlXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGltcG9ydCBpbWFnZSBmaWxlIChwbmcsanBnLHN2ZyBhbmQgc28gb24pXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFt7IGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHsgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpIH0gfV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLmF0dHIoXCJzcmNcIiwgZGF0YVVybClcclxuXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxcclxuICAgICAgICBpZiAoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF0gPSB7fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhID0gZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwiYXZhcnRhXCI6IGRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFxyXG4gICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGFcclxuICAgICAgICBpZiAodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwibm9BdmFydGFcIjogdHJ1ZSB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciByZWxhdGVkTW9kZWxJRHMgPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICAgICAgdmFyIGRpYWxvZ1N0cj0ocmVsYXRlZE1vZGVsSURzLmxlbmd0aD09MCk/IChcIlRoaXMgd2lsbCBERUxFVEUgbW9kZWwgXFxcIlwiICsgbW9kZWxJRCArIFwiXFxcIi5cIik6IFxyXG4gICAgICAgICAgICAobW9kZWxJRCArIFwiIGlzIGJhc2UgbW9kZWwgb2YgXCIrcmVsYXRlZE1vZGVsSURzLmpvaW4oXCIsIFwiKStcIi5cIilcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICAgICAgLy9jaGVjayBob3cgbWFueSB0d2lucyBhcmUgdW5kZXIgdGhpcyBtb2RlbCBJRFxyXG4gICAgICAgIHZhciBudW1iZXJPZlR3aW5zPTBcclxuICAgICAgICB2YXIgY2hlY2tUd2luc01vZGVsQXJyPVttb2RlbElEXS5jb25jYXQocmVsYXRlZE1vZGVsSURzKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLkRCVHdpbnNBcnIuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICAgICAgdmFyIHRoZUluZGV4PWNoZWNrVHdpbnNNb2RlbEFyci5pbmRleE9mKG9uZURCVHdpbltcIm1vZGVsSURcIl0pXHJcbiAgICAgICAgICAgIGlmKHRoZUluZGV4IT0tMSkgbnVtYmVyT2ZUd2lucysrXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGlhbG9nU3RyKz1cIiAoVGhlcmUgd2lsbCBiZSBcIisoKG51bWJlck9mVHdpbnM+MSk/KG51bWJlck9mVHdpbnMrXCIgdHdpbnNcIik6KG51bWJlck9mVHdpbnMrXCIgdHdpblwiKSApICsgXCIgYmVpbmcgaW1wYWN0ZWQpXCJcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlybURlbGV0ZU1vZGVsKG1vZGVsSUQpIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICBcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBWaXN1YWxpemF0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIlZpc3VhbGl6YXRpb25cIilcclxuICAgIHZhciBlZGl0YWJsZVByb3BlcnRpZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiRWRpdGFibGUgUHJvcGVydGllcyBBbmQgUmVsYXRpb25zaGlwc1wiKVxyXG4gICAgdmFyIGJhc2VDbGFzc2VzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkJhc2UgQ2xhc3Nlc1wiKVxyXG4gICAgdmFyIG9yaWdpbmFsRGVmaW5pdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJPcmlnaW5hbCBEZWZpbml0aW9uXCIpXHJcblxyXG4gICAgdmFyIHN0cj1KU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSxudWxsLDIpXHJcbiAgICBvcmlnaW5hbERlZmluaXRpb25ET00uYXBwZW5kKCQoJzxwcmUgaWQ9XCJqc29uXCI+JytzdHIrJzwvcHJlPicpKVxyXG5cclxuICAgIHZhciBlZGl0dGFibGVQcm9wZXJ0aWVzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyhlZGl0dGFibGVQcm9wZXJ0aWVzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdGhpcy5maWxsUmVsYXRpb25zaGlwSW5mbyh2YWxpZFJlbGF0aW9uc2hpcHMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbFZpc3VhbGl6YXRpb24obW9kZWxJRCxWaXN1YWxpemF0aW9uRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbEJhc2VDbGFzc2VzKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5hbGxCYXNlQ2xhc3NlcyxiYXNlQ2xhc3Nlc0RPTSkgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuY29uZmlybURlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCkgPT4ge1xyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZShnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW2VhY2hEZWxldGVkTW9kZWxJRF0pXHJcbiAgICAgICAgLy9UT0RPOiBjbGVhciB0aGUgdmlzdWFsaXphdGlvbiBzZXR0aW5nIG9mIHRoaXMgZGVsZXRlZCBtb2RlbCwgYnV0IGlmIGl0IGlzIHJlcGxhY2UsIHNob3VsZCBub3QsIHNvIEkgY29tbWVudCBvdXQgZmlyc3RcclxuICAgICAgICAvKlxyXG4gICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxJRF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFttb2RlbElEXVxyXG4gICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB9Ki9cclxuICAgIH1cclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCJ9KVxyXG4gICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIH1cclxuXHJcbiAgICAvL2V2ZW4gbm90IGNvbXBsZXRlbHkgc3VjY2Vzc2Z1bCBkZWxldGluZywgaXQgd2lsbCBzdGlsbCBpbnZva2UgY29tcGxldGVGdW5jXHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsY29tcGxldGVGdW5jLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YUltZy5hdHRyKCdzcmMnLHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgdGhpcy5hdmFydGFJbWc9YXZhcnRhSW1nO1xyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQpXHJcblxyXG4gICAgaWYodGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3Mpe1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG1vZGVsSnNvbi52YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydCxpbmQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluZWRDb2xvcj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZFNoYXBlPW51bGxcclxuICAgIHZhciBkZWZpbmVkRGltZW5zaW9uUmF0aW89bnVsbFxyXG4gICAgdmFyIGRlZmluZWRFZGdlV2lkdGg9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSBkZWZpbmVkRGltZW5zaW9uUmF0aW89dmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpb1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcikgZGVmaW5lZENvbG9yID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvclxyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZSkgZGVmaW5lZFNoYXBlID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZVxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aCkgZGVmaW5lZEVkZ2VXaWR0aD12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6NzVweFwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiZGFya0dyYXlcIixcIkJsYWNrXCIsXCJMaWdodEdyYXlcIixcIlJlZFwiLFwiR3JlZW5cIixcIkJsdWVcIixcIkJpc3F1ZVwiLFwiQnJvd25cIixcIkNvcmFsXCIsXCJDcmltc29uXCIsXCJEb2RnZXJCbHVlXCIsXCJHb2xkXCJdXHJcbiAgICBjb2xvckFyci5mb3JFYWNoKChvbmVDb2xvckNvZGUpPT57XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdcIitvbmVDb2xvckNvZGUrXCInPlwiK29uZUNvbG9yQ29kZStcIuKWpzwvb3B0aW9uPlwiKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuYXBwZW5kKGFuT3B0aW9uKVxyXG4gICAgICAgIGFuT3B0aW9uLmNzcyhcImNvbG9yXCIsb25lQ29sb3JDb2RlKVxyXG4gICAgfSlcclxuICAgIGlmKGRlZmluZWRDb2xvciE9bnVsbCkge1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IudmFsKGRlZmluZWRDb2xvcilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsZGVmaW5lZENvbG9yKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLFwiZGFya0dyYXlcIilcclxuICAgIH1cclxuICAgIGNvbG9yU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdENvbG9yQ29kZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLHNlbGVjdENvbG9yQ29kZSlcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxcclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc2l6ZUFkanVzdFNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjExMHB4XCI+PC9zZWxlY3Q+JylcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBmPTAuMjtmPDI7Zis9MC4yKXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj5kaW1lbnNpb24qXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRGltZW5zaW9uUmF0aW8hPW51bGwpIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoZGVmaW5lZERpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjEuMFwiKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmNzcyhcIndpZHRoXCIsXCI4MHB4XCIpXHJcbiAgICAgICAgZm9yKHZhciBmPTAuNTtmPD00O2YrPTAuNSl7XHJcbiAgICAgICAgICAgIHZhciB2YWw9Zi50b0ZpeGVkKDEpK1wiXCJcclxuICAgICAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT1cIit2YWwrXCI+d2lkdGggKlwiK3ZhbCtcIjwvb3B0aW9uPlwiKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGVmaW5lZEVkZ2VXaWR0aCE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRWRnZVdpZHRoKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjIuMFwiKVxyXG4gICAgfVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaXplQWRqdXN0U2VsZWN0b3IpXHJcblxyXG4gICAgXHJcbiAgICBzaXplQWRqdXN0U2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIGNob29zZVZhbD1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxcclxuXHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJkaW1lbnNpb25SYXRpb1wiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiZWRnZVdpZHRoXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuICAgIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnNhdmVWaXN1YWxEZWZpbml0aW9uPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2F2ZVZpc3VhbERlZmluaXRpb25cIiwgXCJQT1NUXCIsIHtcInZpc3VhbERlZmluaXRpb25Kc29uXCI6SlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsKX0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgbGFiZWwudGV4dChcIlJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwpXHJcbiAgICAgICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KXtcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweDttYXJnaW4tbGVmdDoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldClcclxuICAgICAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXModmFsaWRSZWxhdGlvbnNoaXBzW2luZF0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24oanNvbkluZm8scGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KG9iaikpIGZpbGVDb250ZW50QXJyPWZpbGVDb250ZW50QXJyLmNvbmNhdChvYmopXHJcbiAgICAgICAgICAgIGVsc2UgZmlsZUNvbnRlbnRBcnIucHVzaChvYmopXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihmaWxlQ29udGVudEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7XCJtb2RlbHNcIjpKU09OLnN0cmluZ2lmeShmaWxlQ29udGVudEFycil9LFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfSAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWFzeW5jIGZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlcz1hd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9mZXRjaFByb2plY3RNb2RlbHNEYXRhXCIsXCJQT1NUXCIsbnVsbCxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVByb2plY3RNb2RlbHNEYXRhKHJlcy5EQk1vZGVscyxyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhyZXMuYWR0TW9kZWxzKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIGlmKGpRdWVyeS5pc0VtcHR5T2JqZWN0KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykpe1xyXG4gICAgICAgIHZhciB6ZXJvTW9kZWxJdGVtPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZTowLjllbVwiPnplcm8gbW9kZWwgcmVjb3JkLiBQbGVhc2UgaW1wb3J0Li4uPC9saT4nKVxyXG4gICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgIHplcm9Nb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgc2ltcGxlVHJlZSh0aGlzLm1vZGVsTGlzdCwge1xyXG4gICAgICAgICAgICBcImxlYWZOYW1lUHJvcGVydHlcIjogXCJkaXNwbGF5TmFtZVwiXHJcbiAgICAgICAgICAgICwgXCJub011bHRpcGxlU2VsZWN0QWxsb3dlZFwiOiB0cnVlLCBcImhpZGVFbXB0eUdyb3VwXCI6IHRydWVcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jID0gKGxuKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbENsYXNzID0gbG4ubGVhZkluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxDbGFzc10pIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgICAgIHZhciBzaGFwZSA9IHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZSc+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgIGlmKGRiTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGlvdERpdj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6LTVweDtwYWRkaW5nOjBweCAycHg7dG9wOi05cHg7Ym9yZGVyLXJhZGl1czogM3B4O2ZvbnQtc2l6ZTo3cHgnPklvVDwvZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoaW90RGl2KVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIGltZ1NyYz1lbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSxjb2xvckNvZGUpKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgICAgICBpZihhdmFydGEpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGF2YXJ0YWltZz0kKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIrYXZhcnRhK1wiJz48L2ltZz5cIilcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gaWNvbkRPTVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMgPSAobm9kZXNBcnIsIG1vdXNlQ2xpY2tEZXRhaWwpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRoZU5vZGUgPSBub2Rlc0FyclswXVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcIkBpZFwiXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBncm91cE5hbWVMaXN0ID0ge31cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXSA9IDFcclxuICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnIgPSBPYmplY3Qua2V5cyhncm91cE5hbWVMaXN0KVxyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWUgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykge1xyXG4gICAgICAgICAgICB2YXIgZ24gPSB0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sIEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLm1vZGVsTmFtZVRvR3JvdXBOYW1lPWZ1bmN0aW9uKG1vZGVsTmFtZSl7XHJcbiAgICB2YXIgbmFtZVBhcnRzPW1vZGVsTmFtZS5zcGxpdChcIjpcIilcclxuICAgIGlmKG5hbWVQYXJ0cy5sZW5ndGg+PTIpICByZXR1cm4gbmFtZVBhcnRzWzFdXHJcbiAgICBlbHNlIHJldHVybiBcIk90aGVyc1wiXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVE1vZGVsRWRpdGVkXCIpIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkY2FzdFwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxNYW5hZ2VyRGlhbG9nKCk7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxOTVweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj5Mb2cgb3V0PC9hPjwvZGl2PicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+4piwPC9hPicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PnsgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKSB9KVxyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbignOmZpcnN0Jykub24oXCJjbGlja1wiLCgpPT57dGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpfSlcclxuICAgIFxyXG4gICAgdmFyIGFsbE1vZGV1bHM9dGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbihcImFcIilcclxuICAgICQoYWxsTW9kZXVsc1swXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkZXZpY2VtYW5hZ2VtZW50Lmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbiAgICAkKGFsbE1vZGV1bHNbMV0pLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1syXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJldmVudGxvZ21vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzNdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBtYWluV2luZG93UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbiAgICAgICAgbXlNU0FMT2JqLmxvZ291dFBvcHVwKGxvZ291dFJlcXVlc3QpO1xyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kdWxlU3dpdGNoRGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbmV3VHdpbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JbmZvKSB7XHJcbiAgICB0aGlzLm9yaWdpbmFsVHdpbkluZm89SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0d2luSW5mbykpXHJcbiAgICB0aGlzLnR3aW5JbmZvPXR3aW5JbmZvXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo1MjBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BZGQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4geyB0aGlzLmFkZE5ld1R3aW4oKSB9KVxyXG4gICAgXHJcbiAgICB2YXIgYWRkQW5kQ2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlO21hcmdpbi1sZWZ0OjVweFwiPkFkZCAmIENsb3NlPC9idXR0b24+JykgICAgXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChhZGRBbmRDbG9zZUJ1dHRvbilcclxuICAgIGFkZEFuZENsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge3RoaXMuYWRkTmV3VHdpbihcIkNsb3NlRGlhbG9nXCIpfSlcclxuICAgICAgICBcclxuICAgIHZhciBJRExhYmxlRGl2PSAkKFwiPGRpdiBjbGFzcz0ndzMtcGFkZGluZycgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlR3aW4gSUQ8L2Rpdj5cIilcclxuICAgIHZhciBJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O3dpZHRoOjE1MHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwiSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB0aGlzLklESW5wdXQ9SURJbnB1dCBcclxuICAgIHZhciBtb2RlbElEPXR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgbW9kZWxMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Nb2RlbDwvZGl2PlwiKVxyXG4gICAgdmFyIG1vZGVsSW5wdXQ9JCgnPGRpdiB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O2Rpc3BsYXk6aW5saW5lXCIvPicpLnRleHQobW9kZWxJRCk7ICBcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJChcIjxkaXYvPlwiKS5hcHBlbmQoSURMYWJsZURpdixJRElucHV0KSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJChcIjxkaXYgc3R5bGU9J3BhZGRpbmc6OHB4IDBweCcvPlwiKS5hcHBlbmQobW9kZWxMYWJsZURpdixtb2RlbElucHV0KSlcclxuICAgIElESW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgIHRoaXMudHdpbkluZm9bXCIkZHRJZFwiXT0kKGUudGFyZ2V0KS52YWwoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRE9NPSQoJzxkaXYgLz4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChkaWFsb2dET00pICAgIFxyXG4gICAgdmFyIHRpdGxlVGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICB0aXRsZVRhYmxlLmFwcGVuZCgkKCc8dHI+PHRkIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPlByb3BlcnRpZXMgVHJlZTwvdGQ+PC90cj4nKSlcclxuICAgIGRpYWxvZ0RPTS5hcHBlbmQoJChcIjxkaXYgY2xhc3M9J3czLWNvbnRhaW5lcicvPlwiKS5hcHBlbmQodGl0bGVUYWJsZSkpXHJcblxyXG4gICAgdmFyIHNldHRpbmdzRGl2PSQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXIgdzMtYm9yZGVyJyBzdHlsZT0nd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjMxMHB4O292ZXJmbG93OmF1dG8nPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5zZXR0aW5nc0Rpdj1zZXR0aW5nc0RpdlxyXG4gICAgZGlhbG9nRE9NLmFwcGVuZChzZXR0aW5nc0RpdilcclxuICAgIHRoaXMuZHJhd01vZGVsU2V0dGluZ3MoKVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5hZGROZXdUd2luID0gYXN5bmMgZnVuY3Rpb24oY2xvc2VEaWFsb2cpIHtcclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBEQk1vZGVsSW5mbz1nbG9iYWxDYWNoZS5nZXRTaW5nbGVEQk1vZGVsQnlJRChtb2RlbElEKVxyXG5cclxuICAgIGlmKCF0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl18fHRoaXMudHdpbkluZm9bXCIkZHRJZFwiXT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBjb21wb25lbnRzTmFtZUFycj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uaW5jbHVkZWRDb21wb25lbnRzXHJcbiAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgIGlmKHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdGhpcy50d2luSW5mb1tvbmVDb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgIHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV1bXCIkbWV0YWRhdGFcIl09IHt9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vYXNrIHRhc2ttYXN0ZXIgdG8gYWRkIHRoZSB0d2luXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHBvc3RCb2R5PSB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHRoaXMudHdpbkluZm8pfVxyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vdXBzZXJ0RGlnaXRhbFR3aW5cIiwgXCJQT1NUXCIsIHBvc3RCb2R5LFwid2l0aFByb2plY3RJRFwiIClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihkYXRhLkRCVHdpbikgICAgXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oZGF0YS5BRFRUd2luKVxyXG5cclxuXHJcbiAgICAvL2FzayB0YXNrbWFzdGVyIHRvIHByb3Zpc2lvbiB0aGUgdHdpbiB0byBpb3QgaHViIGlmIHRoZSBtb2RlbCBpcyBhIGlvdCBkZXZpY2UgbW9kZWxcclxuICAgIGlmKERCTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHBvc3RCb2R5PSB7XCJEQlR3aW5cIjpkYXRhLkRCVHdpbixcImRlc2lyZWRJbkRldmljZVR3aW5cIjp7fX1cclxuICAgICAgICAgICAgREJNb2RlbEluZm8uZGVzaXJlZFByb3BlcnRpZXMuZm9yRWFjaChlbGU9PntcclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWU9ZWxlLnBhdGhbZWxlLnBhdGgubGVuZ3RoLTFdXHJcbiAgICAgICAgICAgICAgICB2YXIgcHJvcGVydHlTYW1wbGVWPSBcIlwiXHJcbiAgICAgICAgICAgICAgICBwb3N0Qm9keS5kZXNpcmVkSW5EZXZpY2VUd2luW3Byb3BlcnR5TmFtZV09cHJvcGVydHlTYW1wbGVWXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHZhciBwcm92aXNpb25lZERvY3VtZW50ID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGV2aWNlbWFuYWdlbWVudC9wcm92aXNpb25Jb1REZXZpY2VUd2luXCIsIFwiUE9TVFwiLCBwb3N0Qm9keSxcIndpdGhQcm9qZWN0SURcIiApXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGEuREJUd2luPXByb3Zpc2lvbmVkRG9jdW1lbnRcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihwcm92aXNpb25lZERvY3VtZW50KSAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8vaXQgc2hvdWxkIHNlbGVjdCB0aGUgbmV3IG5vZGUgaW4gdGhlIHRyZWUsIGFuZCBtb3ZlIHRvcG9sb2d5IHZpZXcgdG8gc2hvdyB0aGUgbmV3IG5vZGUgKG5vdGUgcGFuIHRvIGEgcGxhY2UgdGhhdCBpcyBub3QgYmxvY2tlZCBieSB0aGUgZGlhbG9nIGl0c2VsZilcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5cIiwgXCJ0d2luSW5mb1wiOiBkYXRhLkFEVFR3aW4sIFwiREJUd2luSW5mb1wiOmRhdGEuREJUd2lufSlcclxuXHJcbiAgICBpZihjbG9zZURpYWxvZyl0aGlzLkRPTS5oaWRlKClcclxuICAgIGVsc2V7XHJcbiAgICAgICAgLy9jbGVhciB0aGUgaW5wdXQgZWRpdGJveFxyXG4gICAgICAgIHRoaXMucG9wdXAodGhpcy5vcmlnaW5hbFR3aW5JbmZvKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3TW9kZWxTZXR0aW5ncyA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG1vZGVsSUQ9dGhpcy50d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXVxyXG4gICAgdmFyIG1vZGVsRGV0YWlsPSBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgIHZhciBjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5PUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkobW9kZWxEZXRhaWwuZWRpdGFibGVQcm9wZXJ0aWVzKSlcclxuICAgIFxyXG4gICAgaWYoJC5pc0VtcHR5T2JqZWN0KGNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHkpKXtcclxuICAgICAgICB0aGlzLnNldHRpbmdzRGl2LnRleHQoXCJUaGVyZSBpcyBubyBlZGl0YWJsZSBwcm9wZXJ0eVwiKVxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3NEaXYuYWRkQ2xhc3MoXCJ3My10ZXh0LWdyYXlcIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9ICAgXHJcblxyXG4gICAgdmFyIHNldHRpbmdzVGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICB0aGlzLnNldHRpbmdzRGl2LmFwcGVuZChzZXR0aW5nc1RhYmxlKVxyXG5cclxuICAgIHZhciBpbml0aWFsUGF0aEFycj1bXVxyXG4gICAgdmFyIGxhc3RSb290Tm9kZVJlY29yZD1bXVxyXG4gICAgdGhpcy5kcmF3RWRpdGFibGUoc2V0dGluZ3NUYWJsZSxjb3B5TW9kZWxFZGl0YWJsZVByb3BlcnR5LGluaXRpYWxQYXRoQXJyLGxhc3RSb290Tm9kZVJlY29yZClcclxufVxyXG5cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLmRyYXdFZGl0YWJsZSA9IGFzeW5jIGZ1bmN0aW9uKHBhcmVudFRhYmxlLGpzb25JbmZvLHBhdGhBcnIsbGFzdFJvb3ROb2RlUmVjb3JkKSB7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pIGFyci5wdXNoKGluZClcclxuXHJcbiAgICBmb3IodmFyIHRoZUluZGV4PTA7dGhlSW5kZXg8YXJyLmxlbmd0aDt0aGVJbmRleCsrKXtcclxuICAgICAgICBpZih0aGVJbmRleD09YXJyLmxlbmd0aC0xKSBsYXN0Um9vdE5vZGVSZWNvcmRbcGF0aEFyci5sZW5ndGhdID10cnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBpbmQgPSBhcnJbdGhlSW5kZXhdXHJcbiAgICAgICAgdmFyIHRyPSQoXCI8dHIvPlwiKVxyXG4gICAgICAgIHZhciByaWdodFREPSQoXCI8dGQgc3R5bGU9J2hlaWdodDozMHB4Jy8+XCIpXHJcbiAgICAgICAgdHIuYXBwZW5kKHJpZ2h0VEQpXHJcbiAgICAgICAgcGFyZW50VGFibGUuYXBwZW5kKHRyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgaWYoIWxhc3RSb290Tm9kZVJlY29yZFtpXSkgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdigyKSlcclxuICAgICAgICAgICAgZWxzZSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDQpKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhlSW5kZXg9PWFyci5sZW5ndGgtMSkgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdigzKSlcclxuICAgICAgICBlbHNlIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMSkpXHJcblxyXG4gICAgICAgIHZhciBwTmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZmxvYXQ6bGVmdDtsaW5lLWhlaWdodDoyOHB4O21hcmdpbi1sZWZ0OjNweCc+XCIraW5kK1wiPC9kaXY+XCIpXHJcbiAgICAgICAgcmlnaHRURC5hcHBlbmQocE5hbWVEaXYpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcblxyXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKSB7IC8vaXQgaXMgYSBlbnVtZXJhdG9yXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3BEb3duQm94KHJpZ2h0VEQsbmV3UGF0aCxqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIChqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUocGFyZW50VGFibGUsanNvbkluZm9baW5kXSxuZXdQYXRoLGxhc3RSb290Tm9kZVJlY29yZClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHg7cGFkZGluZzoycHg7d2lkdGg6MjAwcHg7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICByaWdodFRELmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcImRhdGFUeXBlXCIsIGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGFJbnB1dC5jaGFuZ2UoKGUpPT57XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKCQoZS50YXJnZXQpLmRhdGEoXCJwYXRoXCIpLCQoZS50YXJnZXQpLnZhbCgpLCQoZS50YXJnZXQpLmRhdGEoXCJkYXRhVHlwZVwiKSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3RHJvcERvd25Cb3g9ZnVuY3Rpb24ocmlnaHRURCxuZXdQYXRoLHZhbHVlQXJyKXtcclxuICAgIHZhciBhU2VsZWN0TWVudSA9IG5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCJcclxuICAgICAgICAsIHsgd2lkdGg6IFwiMjAwXCIgXHJcbiAgICAgICAgICAgICxidXR0b25DU1M6IHsgXCJwYWRkaW5nXCI6IFwiNHB4IDE2cHhcIn1cclxuICAgICAgICAgICAgLCBcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjogMjUvLyxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6MjEwXHJcbiAgICAgICAgICAgICwgXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOiB0aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgICAgIH0pXHJcblxyXG5cclxuICAgIHJpZ2h0VEQuYXBwZW5kKGFTZWxlY3RNZW51LnJvd0RPTSkgIC8vdXNlIHJvd0RPTSBpbnN0ZWFkIG9mIERPTSB0byBhbGxvdyBzZWxlY3Qgb3B0aW9uIHdpbmRvdyBmbG9hdCBhYm92ZSBkaWFsb2dcclxuICAgIGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgdmFsdWVBcnIuZm9yRWFjaCgob25lT3B0aW9uKSA9PiB7XHJcbiAgICAgICAgdmFyIHN0ciA9IG9uZU9wdGlvbltcImRpc3BsYXlOYW1lXCJdIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXVxyXG4gICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICB9KVxyXG4gICAgYVNlbGVjdE1lbnUuY2FsbEJhY2tfY2xpY2tPcHRpb24gPSAob3B0aW9uVGV4dCwgb3B0aW9uVmFsdWUsIHJlYWxNb3VzZUNsaWNrKSA9PiB7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGlmIChyZWFsTW91c2VDbGljaykgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksIG9wdGlvblZhbHVlLCBcInN0cmluZ1wiKVxyXG4gICAgfVxyXG59XHJcblxyXG5uZXdUd2luRGlhbG9nLnByb3RvdHlwZS51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZT1mdW5jdGlvbihwYXRoQXJyLG5ld1ZhbCxkYXRhVHlwZSl7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUpzb249dGhpcy50d2luSW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG5cclxuICAgICAgICBpZihpPT1wYXRoQXJyLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgdGhlSnNvbltrZXldPW5ld1ZhbFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGVKc29uW2tleV09PW51bGwpIHRoZUpzb25ba2V5XT17fVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLnRyZWVMaW5lRGl2ID0gZnVuY3Rpb24odHlwZU51bWJlcikge1xyXG4gICAgdmFyIHJlRGl2PSQoJzxkaXYgc3R5bGU9XCJtYXJnaW4tbGVmdDoxMHB4O3dpZHRoOjE1cHg7aGVpZ2h0OiAxMDAlO2Zsb2F0OiBsZWZ0XCI+PC9kaXY+JylcclxuICAgIGlmKHR5cGVOdW1iZXI9PTEpe1xyXG4gICAgICAgIHJlRGl2LmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyLWJvdHRvbSB3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09Mil7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PjxkaXYgY2xhc3M9XCJ3My1ib3JkZXItbGVmdFwiIHN0eWxlPVwid2lkdGg6MTAwJTtoZWlnaHQ6NTAlO1wiPjwvZGl2PicpKVxyXG4gICAgfWVsc2UgaWYodHlwZU51bWJlcj09Myl7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItYm90dG9tIHczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT00KXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIHJldHVybiByZURpdlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBuZXdUd2luRGlhbG9nKCk7IiwiY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gcHJvamVjdFNldHRpbmdEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicHJvamVjdElzQ2hhbmdlZFwiKXtcclxuICAgICAgICB0aGlzLmNvbnRlbnRJbml0aWFsaXplZD1mYWxzZVxyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKHByb2plY3RJbmZvKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIGlmKHRoaXMuY29udGVudEluaXRpYWxpemVkKXJldHVybjtcclxuICAgIHRoaXMuY29udGVudEluaXRpYWxpemVkPXRydWU7IFxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCI0MjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPlNldHRpbmc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgdGFiQ29udHJvbD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLWxpZ2h0LWdyYXlcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxheW91dEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIFwiIHN0eWxlPVwibWFyZ2luOjBweCA1cHhcIj5MYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdmFyIHZpc3VhbFNjaGVtYUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+VmlzdWFsIFNjaGVtYTwvYnV0dG9uPicpXHJcbiAgICB0YWJDb250cm9sLmFwcGVuZChsYXlvdXRCdG4sdmlzdWFsU2NoZW1hQnRuKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRhYkNvbnRyb2wpXHJcblxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1hbmltYXRlLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmc6MTBweDtkaXNwbGF5Om5vbmVcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1hbmltYXRlLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmc6MTBweDtkaXNwbGF5Om5vbmVcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMubGF5b3V0Q29udGVudERpdix0aGlzLnZpc3VhbFNjaGVtYUNvbnRlbnREaXYpXHJcbiAgICB0aGlzLmZpbGxMYXlvdXREaXZDb250ZW50KClcclxuICAgIHRoaXMuZmlsbFZpc3VhbFNjaGVtYUNvbnRlbnQoKVxyXG5cclxuICAgIGxheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBsYXlvdXRCdG4uYWRkQ2xhc3MoXCJ3My1kYXJrLWdyZXlcIilcclxuICAgICAgICB2aXN1YWxTY2hlbWFCdG4ucmVtb3ZlQ2xhc3MoXCJ3My1kYXJrLWdyZXlcIilcclxuICAgICAgICB0aGlzLnZpc3VhbFNjaGVtYUNvbnRlbnREaXYuaGlkZSgpXHJcbiAgICAgICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LnNob3coKVxyXG4gICAgfSlcclxuXHJcbiAgICB2aXN1YWxTY2hlbWFCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbGF5b3V0QnRuLnJlbW92ZUNsYXNzKFwidzMtZGFyay1ncmV5XCIpXHJcbiAgICAgICAgdmlzdWFsU2NoZW1hQnRuLmFkZENsYXNzKFwidzMtZGFyay1ncmV5XCIpXHJcbiAgICAgICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LnNob3coKVxyXG4gICAgICAgIHRoaXMubGF5b3V0Q29udGVudERpdi5oaWRlKClcclxuICAgIH0pXHJcblxyXG4gICAgbGF5b3V0QnRuLnRyaWdnZXIoXCJjbGlja1wiKVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuZmlsbExheW91dERpdkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2hvd090aGVyVXNlckxheW91dENoZWNrID0gJCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiBzdHlsZT1cIndpZHRoOjIwcHg7bWFyZ2luLWxlZnQ6MTBweDttYXJnaW4tcmlnaHQ6MTBweFwiIHR5cGU9XCJjaGVja2JveFwiPicpXHJcbiAgICB2YXIgc2hvd090aGVyVXNlckxheW91dFRleHQgPSAkKCc8bGFiZWwgc3R5bGU9XCJwYWRkaW5nOjJweCA4cHg7XCI+U2hvdyBzaGFyZWQgbGF5b3V0cyBmcm9tIG90aGVyIHVzZXJzPC9sYWJlbD4nKVxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LmFwcGVuZChzaG93T3RoZXJVc2VyTGF5b3V0Q2hlY2ssIHNob3dPdGhlclVzZXJMYXlvdXRUZXh0KVxyXG4gICAgaWYodGhpcy5zaG93U2hhcmVkTGF5b3V0cykgc2hvd090aGVyVXNlckxheW91dENoZWNrLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XHJcbiAgICBzaG93T3RoZXJVc2VyTGF5b3V0Q2hlY2sub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHRoaXMuc2hvd1NoYXJlZExheW91dHM9c2hvd090aGVyVXNlckxheW91dENoZWNrLnByb3AoJ2NoZWNrZWQnKVxyXG4gICAgICAgIHRoaXMucmVmaWxsTGF5b3V0cygpXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgbGF5b3V0c0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWF4LWhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LmFwcGVuZChsYXlvdXRzRGl2KVxyXG4gICAgdGhpcy5sYXlvdXRzRGl2PWxheW91dHNEaXZcclxuXHJcbiAgICB0aGlzLnJlZmlsbExheW91dHMoKVxyXG59XHJcblxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxTY2hlbWFDb250ZW50PSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sgPSAkKCc8aW5wdXQgY2xhc3M9XCJ3My1jaGVja1wiIHN0eWxlPVwid2lkdGg6MjBweDttYXJnaW4tbGVmdDoxMHB4O21hcmdpbi1yaWdodDoxMHB4XCIgdHlwZT1cImNoZWNrYm94XCI+JylcclxuICAgIHZhciBzaGFyZVNlbGZWaXN1YWxTY2hlbWFUZXh0ID0gJCgnPGxhYmVsIHN0eWxlPVwicGFkZGluZzoycHggOHB4O1wiPlNoYXJlIG15IG93biB2aXN1YWwgbGVnZW5kPC9sYWJlbD4nKVxyXG4gICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LmFwcGVuZChzaGFyZVNlbGZWaXN1YWxTY2hlbWFDaGVjaywgc2hhcmVTZWxmVmlzdWFsU2NoZW1hVGV4dClcclxuXHJcbiAgICBpZihnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5pc1NoYXJlZCkgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sucHJvcCggXCJjaGVja2VkXCIsIHRydWUgKTtcclxuICAgIFxyXG4gICAgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sub24oXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmlzU2hhcmVkPXNoYXJlU2VsZlZpc3VhbFNjaGVtYUNoZWNrLnByb3AoJ2NoZWNrZWQnKVxyXG5cclxuICAgICAgICB2YXIgdmlzdWFsU2NoZW1hTmFtZSA9IFwiZGVmYXVsdFwiIC8vZml4ZWQgaW4gY3VycmVudCB2ZXJzaW9uLCB0aGVyZSBpcyBvbmx5IFwiZGVmYXVsdFwiIHNjaGVtYSBmb3IgZWFjaCB1c2VyXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2V0VmlzdWFsU2NoZW1hU2hhcmVkRmxhZ1wiLCBcIlBPU1RcIiwgeyBcInZpc3VhbFNjaGVtYVwiOiBcImRlZmF1bHRcIiwgXCJpc1NoYXJlZFwiOiBzaGFyZVNlbGZWaXN1YWxTY2hlbWFDaGVjay5wcm9wKCdjaGVja2VkJykgfSwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHZpc3VhbFNjaGVtYURpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWF4LWhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LmFwcGVuZCh2aXN1YWxTY2hlbWFEaXYpXHJcbiAgICB0aGlzLnZpc3VhbFNjaGVtYURpdj12aXN1YWxTY2hlbWFEaXZcclxuXHJcbiAgICB0aGlzLnJlZmlsbFZpc3VhbFNjaGVtYXMoKVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUucmVmaWxsVmlzdWFsU2NoZW1hcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy52aXN1YWxTY2hlbWFEaXYuZW1wdHkoKVxyXG4gICAgdmFyIHNlbGZTY2hlbWFcclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uKSB7XHJcbiAgICAgICAgdmFyIG9uZVNjaGVtYT1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2luZF1cclxuICAgICAgICBpZihvbmVTY2hlbWEub3duZXIhPW51bGwgJiYgb25lU2NoZW1hLm93bmVyIT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZCkgdGhpcy5hZGRPbmVWaXN1YWxTY2hlbWEob25lU2NoZW1hLHRoaXMudmlzdWFsU2NoZW1hRGl2KVxyXG4gICAgICAgIGVsc2Ugc2VsZlNjaGVtYT1vbmVTY2hlbWFcclxuICAgIH1cclxuICAgIHRoaXMuYWRkT25lVmlzdWFsU2NoZW1hKHNlbGZTY2hlbWEsdGhpcy52aXN1YWxTY2hlbWFEaXYpXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVWaXN1YWxTY2hlbWE9ZnVuY3Rpb24ob25lU2NoZW1hT2JqLHBhcmVudERpdil7XHJcbiAgICB2YXIgb3duZXI9IG9uZVNjaGVtYU9iai5vd25lciB8fCBnbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZFxyXG4gICAgXHJcbiAgICB2YXIgb25lU2NoZW1hUm93PSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXIgdzMtYnV0dG9uIHczLWJvcmRlci1ib3R0b21cIj48L2E+JylcclxuICAgIHBhcmVudERpdi5hcHBlbmQob25lU2NoZW1hUm93KVxyXG4gICAgdmFyIGxibFN0cj0ob3duZXI9PWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkKT9cIlNlbGZcIjpcIlNoYXJlZCBieSBcIitvd25lclxyXG4gICAgLy92YXIgbmFtZUxibD0kKCc8YSBzdHlsZT1cInRleHQtYWxpZ246bGVmdDtjb2xvcjpncmV5O21hcmdpbjo1cHggMHB4O2Rpc3BsYXk6YmxvY2tcIj4nK2xibFN0cisnPC9hPicpXHJcbiAgICB2YXIgdGl0bGVSb3c9JCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhciB3My10ZXh0LWdyZXlcIiAgPjwvYT4nKVxyXG4gICAgb25lU2NoZW1hUm93LmFwcGVuZCh0aXRsZVJvdylcclxuICAgIHZhciBuYW1lTGJsPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgPicrbGJsU3RyKyc8L2E+JylcclxuICAgIHZhciBjb3B5QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHQgdzMtbGltZSB3My1ob3Zlci1hbWJlclwiPkNvcHk8L2J1dHRvbj4nKVxyXG4gICAgdGl0bGVSb3cuYXBwZW5kKG5hbWVMYmwpXHJcbiAgICBpZihvd25lciE9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpIHRpdGxlUm93LmFwcGVuZChjb3B5QnRuKVxyXG5cclxuICAgIHZhciBkZXRhaWw9b25lU2NoZW1hT2JqLmRldGFpbFxyXG5cclxuICAgIGNvcHlCdG4ub24oXCJjbGlja1wiLCBhc3luYyAoKT0+e1xyXG4gICAgICAgIC8vcmVwbGFjZSBzZWxmIHZpc3VhbCBzY2hlbWFcclxuICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWw9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZXRhaWwpKVxyXG4gICAgICAgIHRoaXMucmVmaWxsVmlzdWFsU2NoZW1hcygpXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLCBcIlBPU1RcIiwge1widmlzdWFsRGVmaW5pdGlvbkpzb25cIjpKU09OLnN0cmluZ2lmeShkZXRhaWwpfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiBkZXRhaWwpe1xyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPWRldGFpbFttb2RlbElEXVxyXG4gICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbiA9IDIwO1xyXG4gICAgICAgIHZhciBjb2xvckNvZGUgPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZSA9IHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICB2YXIgYXZhcnRhID0gdmlzdWFsSnNvbi5hdmFydGFcclxuICAgICAgICBpZiAodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uICo9IHBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB2YXIgaWNvbkRPTSA9ICQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIiArIGRpbWVuc2lvbiArIFwicHg7aGVpZ2h0OlwiICsgZGltZW5zaW9uICsgXCJweDtmbG9hdDpsZWZ0O3Bvc2l0aW9uOnJlbGF0aXZlJz48L2Rpdj5cIilcclxuICAgICAgICB2YXIgaW1nU3JjID0gZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsIGNvbG9yQ29kZSkpXHJcbiAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIGltZ1NyYyArIFwiJz48L2ltZz5cIikpXHJcbiAgICAgICAgaWYgKGF2YXJ0YSkge1xyXG4gICAgICAgICAgICB2YXIgYXZhcnRhaW1nID0gJChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiICsgYXZhcnRhICsgXCInPjwvaW1nPlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uZVNjaGVtYVJvdy5hcHBlbmQoaWNvbkRPTSlcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUucmVmaWxsTGF5b3V0cz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXlvdXRzRGl2LmVtcHR5KClcclxuICAgIHZhciBwcm9qZWN0SW5mbz1nbG9iYWxDYWNoZS5maW5kUHJvamVjdEluZm8oZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRClcclxuICAgIHZhciBkZWZhdWx0TGF5b3V0TmFtZT1wcm9qZWN0SW5mby5kZWZhdWx0TGF5b3V0XHJcblxyXG4gICAgaWYodGhpcy5zaG93U2hhcmVkTGF5b3V0cyl7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pIHtcclxuICAgICAgICAgICAgdmFyIG9uZUxheW91dE9iaj1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2luZF1cclxuICAgICAgICAgICAgaWYob25lTGF5b3V0T2JqLm93bmVyIT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRPbmVMYXlvdXRCYXIob25lTGF5b3V0T2JqLHRoaXMubGF5b3V0c0RpdixkZWZhdWx0TGF5b3V0TmFtZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdmFyIG9uZUxheW91dE9iaj1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2luZF1cclxuICAgICAgICBpZihvbmVMYXlvdXRPYmoub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkKSBjb250aW51ZVxyXG4gICAgICAgIHRoaXMuYWRkT25lTGF5b3V0QmFyKG9uZUxheW91dE9iaix0aGlzLmxheW91dHNEaXYsZGVmYXVsdExheW91dE5hbWUpXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmFkZE9uZUxheW91dEJhcj1mdW5jdGlvbihvbmVMYXlvdXRPYmoscGFyZW50RGl2LGRlZmF1bHRMYXlvdXROYW1lKXtcclxuICAgIHZhciBsYXlvdXROYW1lID0gb25lTGF5b3V0T2JqLm5hbWVcclxuICAgIHZhciBzaGFyZWRGbGFnID0gb25lTGF5b3V0T2JqLmlzU2hhcmVkXHJcblxyXG4gICAgdmFyIHNlbGZMYXlvdXQ9KG9uZUxheW91dE9iai5vd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpXHJcblxyXG4gICAgdmFyIG9uZUxheW91dD0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyIHczLWJ1dHRvbiB3My1ib3JkZXItYm90dG9tXCI+PC9hPicpXHJcbiAgICBwYXJlbnREaXYuYXBwZW5kKG9uZUxheW91dClcclxuXHJcbiAgICB2YXIgbmFtZUxibD0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+JytsYXlvdXROYW1lKyc8L2E+JylcclxuICAgIHZhciBkZWZhdWx0TGJsPSQoXCI8YSBjbGFzcz0ndzMtbGltZSB3My1iYXItaXRlbScgc3R5bGU9J2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoxcHggMnB4O21hcmdpbi10b3A6OXB4O2JvcmRlci1yYWRpdXM6IDJweDsnPmRlZmF1bHQ8L2E+XCIpXHJcbiAgICBpZihsYXlvdXROYW1lIT1kZWZhdWx0TGF5b3V0TmFtZSkgZGVmYXVsdExibC5oaWRlKClcclxuICAgIFxyXG4gICAgb25lTGF5b3V0LmRhdGEoXCJsYXlvdXRPYmpcIixvbmVMYXlvdXRPYmopXHJcblxyXG4gICAgb25lTGF5b3V0LmRhdGEoXCJkZWZhdWx0TGJsXCIsZGVmYXVsdExibClcclxuICAgIG9uZUxheW91dC5hcHBlbmQobmFtZUxibCxkZWZhdWx0TGJsKVxyXG5cclxuICAgIGlmKHNlbGZMYXlvdXQpe1xyXG4gICAgICAgIHZhciBzdHI9KHNoYXJlZEZsYWcpP1wiU2hhcmVkXCI6XCJTaGFyZVwiXHJcbiAgICAgICAgdmFyIHNoYXJlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHQgdzMtaG92ZXItYW1iZXJcIj4nK3N0cisnPC9idXR0b24+JylcclxuICAgICAgICBvbmVMYXlvdXQuZGF0YShcInNoYXJlQnRuXCIsc2hhcmVCdG4pXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0IHczLWhvdmVyLWFtYmVyXCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIG9uZUxheW91dC5hcHBlbmQoc2hhcmVCdG4sZGVsZXRlQnRuKVxyXG4gICAgICAgIGlmKCFzaGFyZWRGbGFnKSBzaGFyZUJ0bi5oaWRlKClcclxuICAgICAgICBkZWxldGVCdG4uaGlkZSgpXHJcbiAgICBcclxuICAgICAgICBvbmVMYXlvdXQuaG92ZXIoKCk9PntcclxuICAgICAgICAgICAgdmFyIGlzU2hhcmVkPW9uZUxheW91dC5kYXRhKFwibGF5b3V0T2JqXCIpLmlzU2hhcmVkXHJcbiAgICAgICAgICAgIGlmKCFpc1NoYXJlZCkgc2hhcmVCdG4uc2hvdygpXHJcbiAgICAgICAgICAgIGRlbGV0ZUJ0bi5zaG93KClcclxuICAgICAgICB9LCgpPT57XHJcbiAgICAgICAgICAgIHZhciBpc1NoYXJlZD1vbmVMYXlvdXQuZGF0YShcImxheW91dE9ialwiKS5pc1NoYXJlZFxyXG4gICAgICAgICAgICBpZighaXNTaGFyZWQpIHNoYXJlQnRuLmhpZGUoKVxyXG4gICAgICAgICAgICBkZWxldGVCdG4uaGlkZSgpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbmVMYXlvdXQub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIGlmKGxheW91dE5hbWUhPWRlZmF1bHRMYXlvdXROYW1lKSB0aGlzLnNldEFzRGVmYXVsdExheW91dChvbmVMYXlvdXQpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zZXRBc0RlZmF1bHRMYXlvdXQoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZUxheW91dChvbmVMYXlvdXQpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgc2hhcmVCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tTaGFyZUxheW91dEJ0bihvbmVMYXlvdXQpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgb25lTGF5b3V0LmFkZENsYXNzKFwidzMtZ3JheVwiLFwidzMtaG92ZXItZ3JheVwiKVxyXG4gICAgICAgIHZhciBjb3B5QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHQgdzMtbGltZSB3My1ob3Zlci1hbWJlclwiPkNvcHk8L2J1dHRvbj4nKVxyXG4gICAgICAgIG9uZUxheW91dC5hcHBlbmQoY29weUJ0bilcclxuICAgICAgICBjb3B5QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmNvcHlMYXlvdXQob25lTGF5b3V0LmRhdGEoXCJsYXlvdXRPYmpcIikpXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgIH0pIFxyXG4gICAgfSAgICBcclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmNvcHlMYXlvdXQ9YXN5bmMgZnVuY3Rpb24oZGljdCl7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1kaWN0LmRldGFpbFxyXG4gICAgaWYobGF5b3V0RGljdFtcImVkZ2VzXCJdPT1udWxsKSBsYXlvdXREaWN0W1wiZWRnZXNcIl09e30gICAgXHJcbiAgICB2YXIgc2F2ZUxheW91dE9iaj17XCJsYXlvdXRzXCI6e319XHJcbiAgICBzYXZlTGF5b3V0T2JqW1wibGF5b3V0c1wiXVtkaWN0Lm9uYW1lXT1KU09OLnN0cmluZ2lmeShsYXlvdXREaWN0KSAgXHJcblxyXG4gICAgZ2xvYmFsQ2FjaGUucmVjb3JkU2luZ2xlTGF5b3V0KGxheW91dERpY3QsZ2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQsZGljdC5vbmFtZSxmYWxzZSlcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlTGF5b3V0XCIsIFwiUE9TVFwiLCBzYXZlTGF5b3V0T2JqLFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgIHRoaXMucmVmaWxsTGF5b3V0cygpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5jbGlja1NoYXJlTGF5b3V0QnRuPWFzeW5jIGZ1bmN0aW9uKG9uZUxheW91dERPTSl7XHJcbiAgICB2YXIgaXNTaGFyZWQ9b25lTGF5b3V0RE9NLmRhdGEoXCJsYXlvdXRPYmpcIikuaXNTaGFyZWRcclxuICAgIHZhciB0aGVCdG49b25lTGF5b3V0RE9NLmRhdGEoXCJzaGFyZUJ0blwiKVxyXG4gICAgaXNTaGFyZWQ9IWlzU2hhcmVkXHJcbiAgICBvbmVMYXlvdXRET00uZGF0YShcImxheW91dE9ialwiKS5pc1NoYXJlZD1pc1NoYXJlZFxyXG4gICAgaWYoIWlzU2hhcmVkKSB0aGVCdG4udGV4dChcIlNoYXJlXCIpXHJcbiAgICBlbHNlIHRoZUJ0bi50ZXh0KFwiU2hhcmVkXCIpXHJcbiAgICBcclxuICAgIHZhciBsYXlvdXROYW1lPW9uZUxheW91dERPTS5kYXRhKFwibGF5b3V0T2JqXCIpLm5hbWUgXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NldExheW91dFNoYXJlZEZsYWdcIiwgXCJQT1NUXCIsIHtcImxheW91dFwiOmxheW91dE5hbWUsXCJpc1NoYXJlZFwiOmlzU2hhcmVkIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9IFxyXG59XHJcblxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmRlbGV0ZUxheW91dD1hc3luYyBmdW5jdGlvbihvbmVMYXlvdXRET00pe1xyXG4gICAgdmFyIGxheW91dE5hbWU9b25lTGF5b3V0RE9NLmRhdGEoXCJsYXlvdXRPYmpcIikubmFtZSBcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIkNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbmVMYXlvdXRET00ucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTGF5b3V0XCIsIFwiUE9TVFwiLCB7IFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuc2V0QXNEZWZhdWx0TGF5b3V0PWFzeW5jIGZ1bmN0aW9uKG9uZUxheW91dERPTSl7XHJcbiAgICB0aGlzLmxheW91dHNEaXYuY2hpbGRyZW4oJ2EnKS5lYWNoKChpbmRleCxhTGF5b3V0KT0+e1xyXG4gICAgICAgIHZhciBkZWZhdWx0TGJsPSAkKGFMYXlvdXQpLmRhdGEoXCJkZWZhdWx0TGJsXCIpXHJcbiAgICAgICAgZGVmYXVsdExibC5oaWRlKClcclxuICAgIH0pXHJcblxyXG4gICAgaWYob25lTGF5b3V0RE9NPT1udWxsKXsgLy9yZW1vdmUgZGVmYXVsdCBsYXlvdXRcclxuICAgICAgICB2YXIgbGF5b3V0TmFtZT1cIlwiXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgZGVmYXVsdExibD1vbmVMYXlvdXRET00uZGF0YShcImRlZmF1bHRMYmxcIilcclxuICAgICAgICBkZWZhdWx0TGJsLnNob3coKVxyXG4gICAgICAgIGxheW91dE5hbWU9b25lTGF5b3V0RE9NLmRhdGEoXCJsYXlvdXRPYmpcIikubmFtZSBcclxuICAgIH1cclxuICAgICAgIFxyXG4gICAgdmFyIHByb2plY3RJbmZvPWdsb2JhbENhY2hlLmZpbmRQcm9qZWN0SW5mbyhnbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEKVxyXG4gICAgcHJvamVjdEluZm8uZGVmYXVsdExheW91dD1sYXlvdXROYW1lXHJcbiAgICAvL3VwZGF0ZSBkYXRhYmFzZVxyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9zZXRQcm9qZWN0RGVmYXVsdExheW91dFwiLCBcIlBPU1RcIiwge1wiZGVmYXVsdExheW91dFwiOmxheW91dE5hbWUgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH0gXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IHByb2plY3RTZXR0aW5nRGlhbG9nKCk7IiwiZnVuY3Rpb24gc2ltcGxlQ29uZmlybURpYWxvZygpe1xyXG4gICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAyXCIgY2xhc3M9XCJ3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgLy90aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLnNob3c9ZnVuY3Rpb24oY3NzT3B0aW9ucyxvdGhlck9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET00uY3NzKGNzc09wdGlvbnMpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj4nICsgb3RoZXJPcHRpb25zLnRpdGxlICsgJzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKSB9KVxyXG5cclxuICAgIHZhciBkaWFsb2dEaXY9JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwibWFyZ2luLXRvcDoxMHB4O21hcmdpbi1ib3R0b206MTBweFwiPjwvZGl2PicpXHJcbiAgICBkaWFsb2dEaXYudGV4dChvdGhlck9wdGlvbnMuY29udGVudClcclxuICAgIHRoaXMuRE9NLmFwcGVuZChkaWFsb2dEaXYpXHJcbiAgICB0aGlzLmRpYWxvZ0Rpdj1kaWFsb2dEaXZcclxuXHJcbiAgICB0aGlzLmJvdHRvbUJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJvdHRvbUJhcilcclxuXHJcbiAgICBvdGhlck9wdGlvbnMuYnV0dG9ucy5mb3JFYWNoKGJ0bj0+e1xyXG4gICAgICAgIHZhciBhQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtcmlnaHQgJysoYnRuLmNvbG9yQ2xhc3N8fFwiXCIpKydcIiBzdHlsZT1cIm1hcmdpbi1yaWdodDoycHg7bWFyZ2luLWxlZnQ6MnB4XCI+JytidG4udGV4dCsnPC9idXR0b24+JylcclxuICAgICAgICBhQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgYnRuLmNsaWNrRnVuYygpICB9ICApXHJcbiAgICAgICAgdGhpcy5ib3R0b21CYXIuYXBwZW5kKGFCdXR0b24pICAgIFxyXG4gICAgfSlcclxuICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuY2xvc2U9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLnJlbW92ZSgpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlQ29uZmlybURpYWxvZzsiLCJmdW5jdGlvbiBzaW1wbGVTZWxlY3RNZW51KGJ1dHRvbk5hbWUsb3B0aW9ucyl7XHJcbiAgICBvcHRpb25zPW9wdGlvbnN8fHt9IC8ve2lzQ2xpY2thYmxlOjEsd2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiXCIsY29sb3JDbGFzczpcIlwiLGJ1dHRvbkNTUzpcIlwifVxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5pc0NsaWNrYWJsZT10cnVlXHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNsaWNrXCI+PC9kaXY+JylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1ob3ZlciBcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLm9uKFwibW91c2VvdmVyXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy9pdCBzZWVtcyB0aGF0IHRoZSBzZWxlY3QgbWVudSBvbmx5IGNhbiBzaG93IG91dHNpZGUgb2YgYSBwYXJlbnQgc2Nyb2xsYWJsZSBkb20gd2hlbiBpdCBpcyBpbnNpZGUgYSB3My1iYXIgaXRlbS4uLiBub3QgdmVyeSBzdXJlIGFib3V0IHdoeSBcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmUtYmxvY2s7bWFyZ2luLWxlZnQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5jc3MoXCJ3aWR0aFwiLChvcHRpb25zLndpZHRofHwxMDApK1wicHhcIilcclxuICAgIHRoaXMucm93RE9NPXJvd0RPTVxyXG4gICAgdGhpcy5yb3dET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgXHJcbiAgICB0aGlzLmJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uXCIgc3R5bGU9XCJvdXRsaW5lOiBub25lO1wiPjxhPicrYnV0dG9uTmFtZSsnPC9hPjxhIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZDtwYWRkaW5nLWxlZnQ6MnB4XCI+PC9hPjxpIGNsYXNzPVwiZmEgZmEtY2FyZXQtZG93blwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjNweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgaWYob3B0aW9ucy53aXRoQm9yZGVyKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhcInczLWJvcmRlclwiKVxyXG4gICAgaWYob3B0aW9ucy5mb250U2l6ZSkgdGhpcy5ET00uY3NzKFwiZm9udC1zaXplXCIsb3B0aW9ucy5mb250U2l6ZSlcclxuICAgIGlmKG9wdGlvbnMuY29sb3JDbGFzcykgdGhpcy5idXR0b24uYWRkQ2xhc3Mob3B0aW9ucy5jb2xvckNsYXNzKVxyXG4gICAgaWYob3B0aW9ucy53aWR0aCkgdGhpcy5idXR0b24uY3NzKFwid2lkdGhcIixvcHRpb25zLndpZHRoKVxyXG4gICAgaWYob3B0aW9ucy5idXR0b25DU1MpIHRoaXMuYnV0dG9uLmNzcyhvcHRpb25zLmJ1dHRvbkNTUylcclxuICAgIGlmKG9wdGlvbnMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3I9b3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvclxyXG5cclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY29udGVudCB3My1iYXItYmxvY2sgdzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7aGVpZ2h0Om9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCtcInB4XCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJvdmVyZmxvdy14XCI6XCJ2aXNpYmxlXCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wKSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi10b3BcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ArXCJweFwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQpIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLWxlZnRcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0K1wicHhcIn0pXHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJ1dHRvbix0aGlzLm9wdGlvbkNvbnRlbnRET00pXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG5cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuYnV0dG9uLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25Db250ZW50RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbEJhY2tfYmVmb3JlQ2xpY2tFeHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSkgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5vcHRpb25Db250ZW50RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcImNvbG9yQ2xhc3NcIjphbk9wdGlvbi5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxjb2xvckNsYXNzKXtcclxuICAgIHZhciBvcHRpb25JdGVtPSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj4nK29wdGlvblRleHQrJzwvYT4nKVxyXG4gICAgaWYoY29sb3JDbGFzcykgb3B0aW9uSXRlbS5hZGRDbGFzcyhjb2xvckNsYXNzKVxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFwcGVuZChvcHRpb25JdGVtKVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIixvcHRpb25WYWx1ZXx8b3B0aW9uVGV4dClcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIixjb2xvckNsYXNzKVxyXG4gICAgb3B0aW9uSXRlbS5vbignY2xpY2snLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICAgICAgaWYodGhpcy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IC8vdGhpcyBpcyB0byBoaWRlIHRoZSBkcm9wIGRvd24gbWVudSBhZnRlciBjbGlja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ob3B0aW9uVGV4dCxvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcInJlYWxNb3VzZUNsaWNrXCIsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxudWxsLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvblZhbHVlPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciByZT10aGlzLmZpbmRPcHRpb24ob3B0aW9uVmFsdWUpXHJcbiAgICBpZihyZT09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbFxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9cmUudmFsdWVcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHJlLnRleHQscmUudmFsdWUsbnVsbCxyZS5jb2xvckNsYXNzKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2xlYXJPcHRpb25zPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUpe1xyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmVtcHR5KClcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNhbGxCYWNrX2NsaWNrT3B0aW9uPWZ1bmN0aW9uKG9wdGlvbnRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spe1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19iZWZvcmVDbGlja0V4cGFuZD1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcblxyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2Nyb2xsVG9MZWFmTm9kZT1mdW5jdGlvbihhTm9kZSl7XHJcbiAgICB2YXIgc2Nyb2xsVG9wPXRoaXMuRE9NLnNjcm9sbFRvcCgpXHJcbiAgICB2YXIgdHJlZUhlaWdodD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIG5vZGVQb3NpdGlvbj1hTm9kZS5ET00ucG9zaXRpb24oKS50b3AgLy93aGljaCBkb2VzIG5vdCBjb25zaWRlciBwYXJlbnQgRE9NJ3Mgc2Nyb2xsIGhlaWdodFxyXG4gICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsdHJlZUhlaWdodCxub2RlUG9zaXRpb24pXHJcbiAgICBpZih0cmVlSGVpZ2h0LTUwPG5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIG5vZGVQb3NpdGlvbi0odHJlZUhlaWdodC01MCkpIFxyXG4gICAgfWVsc2UgaWYobm9kZVBvc2l0aW9uPDUwKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgKG5vZGVQb3NpdGlvbi01MCkpIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5jbGVhckFsbExlYWZOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmxpc3RET00uZW1wdHkoKVxyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD0wXHJcbiAgICAgICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmlyc3RMZWFmTm9kZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgZmlyc3RMZWFmTm9kZT1udWxsO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGZpcnN0TGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBmaXJzdExlYWZOb2RlPWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGZpcnN0TGVhZk5vZGVcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dEdyb3VwTm9kZT1mdW5jdGlvbihhR3JvdXBOb2RlKXtcclxuICAgIGlmKGFHcm91cE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBpbmRleD10aGlzLmdyb3VwTm9kZXMuaW5kZXhPZihhR3JvdXBOb2RlKVxyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXsgLy9yb3RhdGUgYmFja3dhcmQgdG8gZmlyc3QgZ3JvdXAgbm9kZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbMF0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRMZWFmTm9kZT1mdW5jdGlvbihhTGVhZk5vZGUpe1xyXG4gICAgaWYoYUxlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYUdyb3VwTm9kZT1hTGVhZk5vZGUucGFyZW50R3JvdXBOb2RlXHJcbiAgICB2YXIgaW5kZXg9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKGFMZWFmTm9kZSlcclxuICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIC8vbmV4dCBub2RlIGlzIGluIHNhbWUgZ3JvdXBcclxuICAgICAgICByZXR1cm4gYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9maW5kIG5leHQgZ3JvdXAgZmlyc3Qgbm9kZVxyXG4gICAgICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgbmV4dEdyb3VwTm9kZSA9IHRoaXMubmV4dEdyb3VwTm9kZShhR3JvdXBOb2RlKVxyXG4gICAgICAgICAgICBpZihuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgICAgICBhR3JvdXBOb2RlPW5leHRHcm91cE5vZGVcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWFyY2hUZXh0PWZ1bmN0aW9uKHN0cil7XHJcbiAgICBpZihzdHI9PVwiXCIpIHJldHVybiBudWxsO1xyXG4gICAgLy9zZWFyY2ggZnJvbSBjdXJyZW50IHNlbGVjdCBpdGVtIHRoZSBuZXh0IGxlYWYgaXRlbSBjb250YWlucyB0aGUgdGV4dFxyXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChzdHIsICdpJyk7XHJcbiAgICB2YXIgc3RhcnROb2RlXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgc3RhcnROb2RlPXRoaXMuZmlyc3RMZWFmTm9kZSgpXHJcbiAgICAgICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHRoZVN0cj1zdGFydE5vZGUubmFtZTtcclxuICAgICAgICBpZih0aGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlIFxyXG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2Ugc3RhcnROb2RlPXRoaXMuc2VsZWN0ZWROb2Rlc1swXVxyXG5cclxuICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIHZhciBmcm9tTm9kZT1zdGFydE5vZGU7XHJcbiAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICB2YXIgbmV4dE5vZGU9dGhpcy5uZXh0TGVhZk5vZGUoZnJvbU5vZGUpXHJcbiAgICAgICAgaWYobmV4dE5vZGU9PXN0YXJ0Tm9kZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIG5leHROb2RlU3RyPW5leHROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYobmV4dE5vZGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmcm9tTm9kZT1uZXh0Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5nZXRBbGxMZWFmTm9kZUFycj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGFsbExlYWY9W11cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57XHJcbiAgICAgICAgYWxsTGVhZj1hbGxMZWFmLmNvbmNhdChnbi5jaGlsZExlYWZOb2RlcylcclxuICAgIH0pXHJcbiAgICByZXR1cm4gYWxsTGVhZjtcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIHZhciBuZXdBcnI9W10uY29uY2F0KHRoaXMuc2VsZWN0ZWROb2RlcylcclxuICAgIG5ld0Fyci5wdXNoKGxlYWZOb2RlKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGFycil7XHJcbiAgICB2YXIgbmV3QXJyID0gdGhpcy5zZWxlY3RlZE5vZGVzXHJcbiAgICB2YXIgZmlsdGVyQXJyPWFyci5maWx0ZXIoKGl0ZW0pID0+IG5ld0Fyci5pbmRleE9mKGl0ZW0pIDwgMClcclxuICAgIG5ld0FyciA9IG5ld0Fyci5jb25jYXQoZmlsdGVyQXJyKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZShncm91cE5vZGUuaW5mbylcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGVBcnI9ZnVuY3Rpb24obGVhZk5vZGVBcnIsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uZGltKClcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz10aGlzLnNlbGVjdGVkTm9kZXMuY29uY2F0KGxlYWZOb2RlQXJyKVxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmhpZ2hsaWdodCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXModGhpcy5zZWxlY3RlZE5vZGVzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRibENsaWNrTm9kZT1mdW5jdGlvbih0aGVOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUodGhlTm9kZSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc29ydEFsbExlYXZlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLnNvcnROb2Rlc0J5TmFtZSgpfSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBncm91cCBub2RlLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVHcm91cE5vZGUocGFyZW50VHJlZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRUcmVlPXBhcmVudFRyZWVcclxuICAgIHRoaXMuaW5mbz1vYmpcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXM9W10gLy9pdCdzIGNoaWxkIGxlYWYgbm9kZXMgYXJyYXlcclxuICAgIHRoaXMubmFtZT1vYmouZGlzcGxheU5hbWU7XHJcbiAgICB0aGlzLmNyZWF0ZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnJlZnJlc2hOYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTS5lbXB0eSgpXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ3My1saW1lXCJcclxuICAgIGVsc2UgdmFyIGxibENvbG9yPVwidzMtZ3JheVwiIFxyXG4gICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuXHJcbiAgICBcclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgaWYoaWNvbkxhYmVsKXtcclxuICAgICAgICAgICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J1wiK2xibENvbG9yK1wiJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG5cclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyl7XHJcbiAgICAgICAgdmFyIHRhaWxCdXR0b249dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQodGFpbEJ1dHRvbilcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyXCIgc3R5bGU9XCJwYWRkaW5nOjhweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRUcmVlLnNlbGVjdEdyb3VwTm9kZSh0aGlzKSAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuaXNPcGVuPWZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gIHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmV4cGFuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNsaWNrU2VsZj1mdW5jdGlvbihtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVkcmF3TGFiZWwoKVxyXG5cclxuXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgICAgIH1lbHNlIGlmKGUuc2hpZnRLZXkpe1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsTGVhZk5vZGVBcnI9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5nZXRBbGxMZWFmTm9kZUFycigpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgxID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZSlcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDIgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMpXHJcbiAgICAgICAgICAgICAgICBpZihpbmRleDE9PS0xIHx8IGluZGV4Mj09LTEpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZWN0IGFsbCBsZWFmIGJldHdlZW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXJJPSBNYXRoLm1pbihpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWdoZXJJPSBNYXRoLm1heChpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaWRkbGVBcnI9YWxsTGVhZk5vZGVBcnIuc2xpY2UobG93ZXJJLGhpZ2hlckkpICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbWlkZGxlQXJyLnB1c2goYWxsTGVhZk5vZGVBcnJbaGlnaGVySV0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbihtaWRkbGVBcnIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoY2xpY2tEZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLnJlZHJhd0xhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcblxyXG4gICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgIHZhciByb3dIZWlnaHQ9aWNvbkxhYmVsLmhlaWdodCgpXHJcbiAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lRGl2KVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyJdfQ==
