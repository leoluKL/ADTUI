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
const serviceWorkerHelper=require("../sharedSourceFiles/serviceWorkerHelper")
const globalCache = require("../sharedSourceFiles/globalCache")

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
         mainToolbar,this.topologyInstance,this.mapDOM,infoPanel,newTwinDialog,floatInfoWindow,projectSettingDialog,serviceWorkerHelper,globalCache]

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
    $('body').layout({
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
        , east__maxSize: 0.5 // 50% of layout width
        , center__minWidth: 100
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
},{"../globalAppSettings.js":13,"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelEditorDialog":19,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/newTwinDialog":22,"../sharedSourceFiles/projectSettingDialog":23,"../sharedSourceFiles/serviceWorkerHelper":25,"./editLayoutDialog":5,"./floatInfoWindow":6,"./infoPanel":7,"./mainToolbar":8,"./mapDOM.js":9,"./startSelectionDialog":10,"./topologyDOM.js":11,"./twinsTree":12}],5:[function(require,module,exports){
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
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


    if(!$.isEmptyObject(globalCache.layoutJSON)){
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
        var deleteBtn=$('<button class="w3-ripple w3-button w3-red w3-hover-pink" style="margin-left:5px">Delete Layout</button>')
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/simpleConfirmDialog":27,"../sharedSourceFiles/simpleSelectMenu":29}],6:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const globalCache = require("../sharedSourceFiles/globalCache")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")


class floatInfoWindow extends baseInfoPanel{
    constructor() {
        super()
        if(!this.DOM){
            this.DOM=$('<div class="w3-card" style="position:absolute;z-index:101;"></div>')
            this.hideSelf()
            this.DOM.css("background-color","rgba(255, 255, 255, 0.9)")
            $('body').append(this.DOM)
        }
        this.readOnly=true
    }

    hideSelf(){
        this.DOM.hide()
        this.DOM.css("width","0px")
        if(this.aTimerSinceShowing) clearTimeout(this.aTimerSinceShowing)
        this.aTimerSinceShowing=null;
        this.currentShowingTwinID=null;
    }


    rxMessage(msgPayload) {
        if (msgPayload.message == "topologyMouseOut") {
            this.hideSelf()
        } else if (msgPayload.message == "showInfoHoveredEle") {
            if (!globalCache.showFloatInfoPanel) return;
            this.DOM.empty()

            var arr = msgPayload.info;
            if (arr == null || arr.length == 0) return;
            this.DOM.css("left", "-2000px") //it is always outside of browser so it wont block mouse and cause mouse out
            
            var singleElementInfo = arr[0];
            singleElementInfo=this.fetchRealElementInfo(singleElementInfo)
            if (singleElementInfo["$dtId"]) this.currentShowingTwinID=singleElementInfo["$dtId"];
            
            this.DOM.css("width","295px")
            this.DOM.show()
            var contentDOM=$('<div class="w3-container"/>')
            this.DOM.append(contentDOM)
            
            var documentBodyWidth = $('body').width()
            if (singleElementInfo["$dtId"]) {// select a node
                var singleDBTwinInfo=globalCache.DBTwins[singleElementInfo["$dtId"]]
                this.drawSingleNodeProperties(singleDBTwinInfo,singleElementInfo,contentDOM,"notEmbedMetadata")
            } else if (singleElementInfo["$sourceId"]) {
                this.drawSingleRelationProperties(singleElementInfo,contentDOM)
            }

            var screenXY = msgPayload.screenXY
            var windowLeft = screenXY.x + 50

            if (windowLeft + this.DOM.outerWidth() + 10 > documentBodyWidth) {
                windowLeft = documentBodyWidth - this.DOM.outerWidth() - 10
            }
            var windowTop = screenXY.y - this.DOM.outerHeight() - 50
            if (windowTop < 5) windowTop = 5
            this.DOM.css({ "left": windowLeft + "px", "top": windowTop + "px" })

            if(this.currentShowingTwinID==null) return;
            var dbtwin= globalCache.DBTwins[this.currentShowingTwinID]
            if(!dbtwin || !dbtwin.originalScript || dbtwin.originalScript=="") return;
            //var div=$('<div>'+dbtwin.originalScript+'</div>')
            //this.DOM.append(div)
            var holderDiv=$('<div style="padding:1px"/>')
            var scriptTextArea=$('<textarea class="w3-border" spellcheck="false" style="outline:none;font-size:11px;width:100%;font-family:Verdana">'+dbtwin["originalScript"]+'</textarea>')
            this.DOM.append(holderDiv.append(scriptTextArea))
            scriptTextArea.css("height","1px") //to expand scriptTextArea to the height that shows all code
            var theHeight=scriptTextArea[0].scrollHeight+2
            scriptTextArea.css("height",theHeight+"px")
            scriptTextArea.highlightWithinTextarea(
                { highlight: [
                    { "highlight": "_self", "className": "Gray"},
                    { "highlight": "_twinVal", "className": "keyword"},
                ]}
            );
            holderDiv.css("height",theHeight+"px")
            holderDiv.hide()

            var div=$('<div class="w3-amber" style="font-size:6px;text-align:center"><i class="fas fa-ellipsis-h"></i></div>')
            this.DOM.append(div)
            div.fadeTo(400,0.3,"swing",()=>{
                div.fadeTo(400,1,"swing",()=>{
                    div.fadeTo(400,0.3,"swing",()=>{
                        div.fadeTo(400,1,"swing",()=>{
                            holderDiv.slideDown("fast")
                        })
                    })
                })    
            })


        }
    }

}

module.exports = new floatInfoWindow();
},{"../sharedSourceFiles/baseInfoPanel":15,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18}],7:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")
const simpleExpandableSection= require("../sharedSourceFiles/simpleExpandableSection")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const scriptTestDialog = require("../sharedSourceFiles/scriptTestDialog")
const simpleChart= require("../sharedSourceFiles/simpleChart")

class infoPanel extends baseInfoPanel {
    constructor() {
        super()
        this.openLiveCalculationSection=true
        this.openPropertiesSection=true
        this.continerDOM = $('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:350px;transform: translateY(-50%);"></div>')
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

        this.DOM = $('<div class="w3-container" style="padding:0px;postion:absolute;top:50px;height:calc(100% - 50px);overflow:hidden"></div>')
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        this.continerDOM.hover(() => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
        }, () => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        });
        this.continerDOM.append(this.DOM)
        $('body').append(this.continerDOM)

        this.emptyContentAndDrawTabControl()
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
        this.emptyContentAndDrawTabControl()
        if (arr == null || arr.length == 0) {
            this.drawButtons(null)
            this.selectedObjects = [];
            return;
        }
        this.selectedObjects = arr;
        if (arr.length == 1) {
            var singleElementInfo = arr[0];

            singleElementInfo=this.fetchRealElementInfo(singleElementInfo)
            if (singleElementInfo["$dtId"]) {// select a node
                this.drawButtons("singleNode")
            }else if (singleElementInfo["$sourceId"]) {
                this.drawButtons("singleRelationship")
            }

            var propertiesSection= new simpleExpandableSection("Properties Section",this.infoContentDiv,{"marginTop":"2px"})
            propertiesSection.callBack_change=(status)=>{this.openPropertiesSection=status}
            if(this.openPropertiesSection) propertiesSection.expand()

            if (singleElementInfo["$dtId"]) {// select a node
                var singleDBTwinInfo=globalCache.DBTwins[singleElementInfo["$dtId"]]
                this.drawSingleNodeProperties(singleDBTwinInfo,singleElementInfo,propertiesSection.listDOM)
            } else if (singleElementInfo["$sourceId"]) {
                this.drawSingleRelationProperties(singleElementInfo,propertiesSection.listDOM)
            }

            if (singleElementInfo["$dtId"]) this.drawFormulaSection(singleElementInfo["$dtId"],singleElementInfo["$metadata"]["$model"])
        } else if (arr.length > 1) {
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }

    emptyContentAndDrawTabControl(){
        if(this.infoContentDiv) this.infoContentDiv.empty()
        else{
            this.DOM.empty()
            var tabControl=$('<div class="w3-bar w3-light-gray "></div>')
            var infoBtn=$('<button class="w3-bar-item w3-button" style="font-weight:bold;">Information</button>')
            var liveBtn=$('<button class="w3-bar-item w3-button" style="font-weight:bold;">Live</button>')
            tabControl.append(infoBtn,liveBtn)
            this.DOM.append(tabControl)

            this.infoContentDiv=$('<div class="w3-animate-opacity" style="padding-top:5px;display:none;height:calc(100% - 36px);overflow:auto"></div>')
            this.liveContentDiv=$('<div id="myChart" class="w3-animate-opacity" style="padding-top:5px;display:none;height:calc(100% - 36px);overflow:auto"></div>')
            this.DOM.append(this.infoContentDiv,this.liveContentDiv)
            
            var aChart=new simpleChart(this.liveContentDiv,60,{width:"100%",height:"100px"})

            setInterval(()=>{
                var val= parseInt(Math.random()*100)
                var nowTime=parseInt((new Date().getTime())/1000)
                aChart.addDataValue(nowTime,val)
            },1000)

            infoBtn.on("click",()=>{
                infoBtn.addClass("w3-white w3-text-orange")
                liveBtn.removeClass("w3-white w3-text-orange")
                this.liveContentDiv.hide()
                this.infoContentDiv.show()
            })
        
            liveBtn.on("click",()=>{
                infoBtn.removeClass("w3-white w3-text-orange")
                liveBtn.addClass("w3-white w3-text-orange")
                this.liveContentDiv.show()
                this.infoContentDiv.hide()
            })
        
            infoBtn.trigger("click")
        }
    }

    drawButtons(selectType) {
        if(selectType==null){
            var div=$("<div style='padding:8px'><a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a></div>")
            this.infoContentDiv.append(div)
        }

        var buttonHolderDOM=this.infoContentDiv

        var impBtn = $('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
        var actualImportTwinsBtn = $('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
        if (selectType != null) {
            var refreshBtn = $('<button class="w3-ripple w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
            var expBtn = $('<button class="w3-ripple w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')
            buttonHolderDOM.append(refreshBtn, expBtn, impBtn, actualImportTwinsBtn)
            refreshBtn.on("click", () => { this.refreshInfomation() })
            expBtn.on("click", () => {
                //find out the twins in selection and their connections (filter both src and target within the selected twins)
                //and export them
                this.exportSelected()
            })
        } else {
            buttonHolderDOM.append(impBtn, actualImportTwinsBtn)
        }

        impBtn.on("click", () => { actualImportTwinsBtn.trigger('click'); })
        actualImportTwinsBtn.change(async (evt) => {
            var files = evt.target.files; // FileList object
            await this.readTwinsFilesContentAndImport(files)
            actualImportTwinsBtn.val("")
        })
        if (selectType == null) return;

        var numOfNode = 0;
        var arr = this.selectedObjects;
        arr.forEach(element => {
            if (element['$dtId']) numOfNode++
        });
        if (numOfNode > 1) {
            //some additional buttons when select multiple items
            this.drawAdvanceAlignmentButtons()
        }
    }

    async drawAdvanceAlignmentButtons() {
        var label = $("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:1em;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>")
        this.infoContentDiv.append(label)
        var alignButtonsTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
        this.infoContentDiv.append(alignButtonsTable)
        var alignTopButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
        var alignLeftButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
        var alignRightButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
        var alignBottomButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
        alignButtonsTable.find("td").eq(1).append(alignTopButton)
        alignButtonsTable.find("td").eq(3).append(alignLeftButton)
        alignButtonsTable.find("td").eq(5).append(alignRightButton)
        alignButtonsTable.find("td").eq(7).append(alignBottomButton)


        var arrangeTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
        this.infoContentDiv.append(arrangeTable)

        var distributeHButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-ellipsis-h fa-lg"></i></button>')
        var distributeVButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-ellipsis-v fa-lg"></i></button>')
        var leftRotateButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-undo-alt fa-lg"></i></button>')
        var rightRotateButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-redo-alt fa-lg"></i></button>')
        var mirrorHButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-h"></i></button>')
        var mirrorVButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-v"></i></button>')
        var expandButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-expand-arrows-alt"></i></button>')
        var compressButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-compress-arrows-alt"></i></button>')

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
        for (var i = 0; i< files.length; i++) {
            var f=files[i]
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
                    globalCache.storeSingleADTTwin(oneRe)
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

    drawFormulaSection(formulaTwinID,formulaTwinModelID){
        var formulaSection= new simpleExpandableSection("Live Calculation Section",this.infoContentDiv)
        formulaSection.callBack_change=(status)=>{this.openLiveCalculationSection=status}
        if(this.openLiveCalculationSection) formulaSection.expand()

        //list all incoming twins
        var incomingNeighbourLbl=this.generateSmallKeyDiv("Incoming Twins And Self","2px")
        var lbl1=$('<lbl style="font-size:10px;color:gray">(Click to add twin name to script)</lbl>')
        incomingNeighbourLbl.append(lbl1)
        formulaSection.listDOM.append(incomingNeighbourLbl)
        
        var incomingTwins=globalCache.getStoredAllInboundRelationsSources(formulaTwinID)
        
        var scriptLbl=this.generateSmallKeyDiv("Calculation Script","2px")
        scriptLbl.css("margin-top","10px")

        var lbl2=$('<lbl style="font-size:10px;color:gray">(Build in variables:_self _twinVal)</lbl>')
        scriptLbl.append(lbl2)

        var placeHolderStr='Sample&#160;Script&#58;&#10;&#10;if(_twinVal["intwin1"]["p1"]["childProp"]){&#10;&#9;_self["outProp"]=_twinVal["intwin1"]["p2"]&#10;}else{&#10;&#9;_self["outProp"]=_twinVal["intwin1"]["p2"]&#32;+&#32;&#10;&#9;&#9;_twinVal["intwin2"]["p3"]["p4"]&#10;}'
        var scriptTextArea=$('<textarea class="w3-border" spellcheck="false" style="outline:none;font-size:11px;height:240px;width:100%;font-family:Verdana" placeholder='+placeHolderStr+'></textarea>')
        scriptTextArea.on("keydown", (e) => {
            if (e.keyCode == 9){
                this.insertToTextArea('\t',scriptTextArea)
                return false;
            }
        })
        var DBFormulaTwin=globalCache.DBTwins[formulaTwinID]
        if(DBFormulaTwin && DBFormulaTwin["originalScript"]) scriptTextArea.val(DBFormulaTwin["originalScript"])
        
        var highlightColors=[
            ["Purple","#d0bfff"],["Cyan","#00bcd4"],["Amber","#ffc107"],["Lime","#cddc39"],["Pink","#e91e63"]
        ]
        //["Gray","#9e9e9e"]
        var hasIncomingTwins=false
        var twinNamesForHighlight=[]
        //build in key word
        twinNamesForHighlight.push({ "highlight": "_self", "className": "Gray"})
        twinNamesForHighlight.push({ "highlight": "_twinVal", "className": "keyword"})
        var colorIndex=0;
        for(var twinID in incomingTwins){
            hasIncomingTwins=true
            var twinName=globalCache.twinIDMapToDisplayName[twinID]
            twinNamesForHighlight.push({ "highlight": twinName, "className": highlightColors[colorIndex][0]})

            this.createQuickBtnForTwin(twinName,highlightColors[colorIndex][1],formulaSection.listDOM,scriptTextArea)
            colorIndex++
            if(colorIndex>=highlightColors.length)colorIndex=0
        }

        this.createQuickBtnForTwin("Self","#9e9e9e",formulaSection.listDOM,scriptTextArea,formulaTwinModelID)

        if(!hasIncomingTwins)formulaSection.listDOM.append($('<label>No incoming twins</label>'))
        formulaSection.listDOM.append(scriptLbl)
        formulaSection.listDOM.append(scriptTextArea)
        scriptTextArea.highlightWithinTextarea({highlight: twinNamesForHighlight});

        var testScriptBtn = $('<button class="w3-ripple w3-button w3-light-gray w3-hover-amber">Test</button>')
        var confirmScriptBtn = $('<button class="w3-ripple w3-button w3-green  w3-hover-amber">Confirm</button>')
        formulaSection.listDOM.append(testScriptBtn, confirmScriptBtn)


        scriptTextArea.on("keyup",()=>{
            scriptTestDialog.scriptContent=scriptTextArea.val()
        })

        testScriptBtn.on("click",()=>{
            var valueTemplate={}
            this.getPropertyValueTemplate(modelAnalyzer.DTDLModels[formulaTwinModelID].editableProperties,[],valueTemplate)
            var inputArr = globalCache.findAllInputsInScript(scriptTextArea.val(),DBFormulaTwin["displayName"])
            scriptTestDialog.popup(inputArr,DBFormulaTwin["displayName"],formulaTwinModelID,valueTemplate)
            scriptTestDialog.scriptContent=scriptTextArea.val()
        })
        confirmScriptBtn.on("click",()=>{
            this.confirmScript(scriptTextArea.val(),formulaTwinID,formulaTwinModelID,DBFormulaTwin["displayName"])
        })
    }

    async confirmScript(scriptContent,formulaTwinID,formulaTwinModelID,formulaTwinName){
        //detect if there is prohibitted words, if so, reject the submit request
        if(scriptContent=="") return; 
        
        scriptContent=scriptContent.replaceAll(`_twinVal["${formulaTwinName}"][`,"_self[")
        scriptContent=scriptContent.replaceAll(`_twinVal['${formulaTwinName}'][`,"_self[")
        //translate script, replace twins name to twins ID
        var translateResult=this.convertToActualScript(scriptContent,formulaTwinID)

        var valueTemplate={}
        this.getPropertyValueTemplate(modelAnalyzer.DTDLModels[formulaTwinModelID].editableProperties
            ,[],valueTemplate)

        var inputValueArr=[]
        var inputAnalysisResult= globalCache.findAllInputsInScript(scriptContent,formulaTwinName)
        inputAnalysisResult.forEach(ele=>{
            inputValueArr.push({
                "twinID":globalCache.twinDisplayNameMapToID[ele.twinName_origin],
                "path":ele.path,
                "value":ele.value
            })
        })
            
        var theBody={
            "twinID": formulaTwinID,
            "originalScript":scriptContent,
            "actualScript":translateResult,
            "baseValueTemplate":valueTemplate,
            "projectID":globalCache.currentProjectID,
            "currentInputValue":inputValueArr
        }

        //console.log({"payload":JSON.stringify(theBody) })
        //by using withProjectID it will ensure it is the authorized person send the command
        try{ 
            await msalHelper.callAPI("digitaltwin/updateFormula", "POST", {"payload":JSON.stringify(theBody) }, "withProjectID")
            globalCache.DBTwins[formulaTwinID]["originalScript"]=scriptContent
        }catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }


    getPropertyValueTemplate(jsonInfo,pathArr,valueTemplateRoot){
        for(var ind in jsonInfo){
            var newPath=pathArr.concat([ind])
            if(!Array.isArray(jsonInfo[ind]) && typeof(jsonInfo[ind])==="object") {
                valueTemplateRoot[ind]={}
                this.getPropertyValueTemplate(jsonInfo[ind],newPath,valueTemplateRoot[ind])
            }
        }
    }

    convertToActualScript(scriptContent,formulaTwinID){
        //change all the twin name to twin ID
        var patt = /(?<=_twinVal\[\").*?(?=\"\])/g;
        var result = scriptContent.replace(patt,(aTwinName)=>{
            var aTwinID=globalCache.twinDisplayNameMapToID[aTwinName]
            return aTwinID
        } );
        return result;
    }


    getTwinPropertyOptionsArr(jsonInfo,pathArr,optionsArr){
        for(var ind in jsonInfo){
            var newPath=pathArr.concat([ind])
            if(!Array.isArray(jsonInfo[ind]) && typeof(jsonInfo[ind])==="object") {
                this.getTwinPropertyOptionsArr(jsonInfo[ind],newPath,optionsArr)
            }else {
                optionsArr.push('["'+newPath.join('"]["')+'"]')
            }
        }
    }
    
    createQuickBtnForTwin(twinName,colorCode,parentDOM,textAreaDom,selfModelID) {
        var aSelectMenu=new simpleSelectMenu(twinName,{"optionListHeight":200,"buttonCSS":{"background-color":colorCode,"padding":"2px 5px","margin-right":"1px"}})

        if(twinName!="Self"){
            var aDBTwin=globalCache.getSingleDBTwinByName(twinName)
            var modelID=aDBTwin["modelID"]
        }else{
            modelID=selfModelID
        }
        
        var properties=modelAnalyzer.DTDLModels[modelID].editableProperties
        var optionsArr=[]
        var pathArr=[]
        this.getTwinPropertyOptionsArr(properties,pathArr,optionsArr)
        optionsArr.forEach((oneOption)=>{
            aSelectMenu.addOption(oneOption)
        })
        parentDOM.append(aSelectMenu.DOM) 
        aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
            if(twinName=="Self") var str='_self'+optionText
            else str='_twinVal["'+twinName+'"]'+optionText
            this.insertToTextArea(str,textAreaDom)
            textAreaDom.highlightWithinTextarea('update');
            textAreaDom.focus()
        }
    }

    insertToTextArea(str,textAreaDom){
        textAreaDom.focus();
        var startPos = textAreaDom[0].selectionStart;
        var endPos = textAreaDom[0].selectionEnd;
        //var newContent=textAreaDom.val()
        //newContent=newContent.substring(0, startPos)+ str + newContent.substring(endPos, newContent.length);
        //textAreaDom.val(newContent)
        document.execCommand('insertText', false, str); //this way will allow undo still works
        textAreaDom[0].selectionStart=startPos+str.length;
        textAreaDom[0].selectionEnd=startPos+str.length;
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
        var textDiv = $("<label style='display:block;margin-top:10px;margin-left:16px'></label>")
        textDiv.text(numOfNode + " node" + ((numOfNode <= 1) ? "" : "s") + ", " + numOfEdge + " relationship" + ((numOfEdge <= 1) ? "" : "s"))
        this.infoContentDiv.append(textDiv)
    }
}

module.exports = new infoPanel();
},{"../msalHelper":14,"../sharedSourceFiles/baseInfoPanel":15,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/scriptTestDialog":24,"../sharedSourceFiles/simpleChart":26,"../sharedSourceFiles/simpleConfirmDialog":27,"../sharedSourceFiles/simpleExpandableSection":28,"../sharedSourceFiles/simpleSelectMenu":29}],8:[function(require,module,exports){
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
        await msalHelper.callAzureFunctionsService("messages","POST",{
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/moduleSwitchDialog":21,"../sharedSourceFiles/projectSettingDialog":23,"../sharedSourceFiles/simpleSelectMenu":29,"./editLayoutDialog":5,"./startSelectionDialog":10}],9:[function(require,module,exports){
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
            var theDBTwin=globalCache.DBTwins[twinID]
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

mapDOM.prototype.showSelf = function () {
    this.DOM.show()
    this.DOM.animate({height: "100%"},()=>{this.map.resize()});
}

mapDOM.prototype.hideSelf = function () {
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
        globalCache.makeDOMDraggable(this.DOM)
    }
}

startSelectionDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()

    this.contentDOM = $('<div style="width:680px"></div>')
    this.DOM.append(this.contentDOM)
    var titleDiv=$('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Select Twins</div></div>')
    this.contentDOM.append(titleDiv)
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    titleDiv.append(closeButton)

    this.buttonHolder = $("<div style='height:100%'></div>")
    titleDiv.append(this.buttonHolder)
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
    for(var twinID in globalCache.DBTwins){
        var aTwin=globalCache.DBTwins[twinID]
        if(chosenModels[aTwin["modelID"]])  reArr.push(aTwin)
    }
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
    var bool_broadCastProjectChanged=false
    if(this.previousSelectedProject!=globalCache.currentProjectID){
        globalCache.initStoredInformtion()
        this.previousSelectedProject=globalCache.currentProjectID
        bool_broadCastProjectChanged=true
    }

    var selectedTwins=this.getSelectedTwins()
    var twinIDs=[]
    selectedTwins.forEach(aTwin=>{twinIDs.push(aTwin["id"])})

    var modelIDs=[]
    globalCache.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})

    this.broadcastMessage({ "message": "startSelection_"+action, "twinIDs": twinIDs,"modelIDs":modelIDs })
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    if(projectInfo.defaultLayout && projectInfo.defaultLayout!="") globalCache.currentLayoutName=projectInfo.defaultLayout
    
    if(bool_broadCastProjectChanged){
        this.broadcastMessage({ "message": "projectIsChanged","projectID":globalCache.currentProjectID})
    }

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
},{"../msalHelper":14,"../sharedSourceFiles/editProjectDialog":16,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/modelManagerDialog":20,"../sharedSourceFiles/simpleSelectMenu":29}],11:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")
const serviceWorkerHelper=require("../sharedSourceFiles/serviceWorkerHelper")

function topologyDOM(containerDOM){
    this.DOM=$("<div style='height:100%;width:100%'></div>")
    containerDOM.append(this.DOM)
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
    this.lastCalcInputStyleNodes=[]
    this.lastCalcOutputStyleNodes=[]
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
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }},
            {selector: 'edge.hover',
            style: {
                'width':5
            }},
        ]
    });

    this.highestStyleArr= [
        {selector:'node.calcInput' , style: {
            'border-color': "red",
            'border-width': 1,
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': ['red', 'red', 'white', "white", "red"],
            'background-gradient-stop-positions': ['0%', '50%', '51%', "90%", "91%"]
        }},
        {selector:'node.calcOutput' , style: {
            'border-color': "blue",
            'border-width': 1,
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': ['blue', 'blue', 'white', "white", "blue"],
            'background-gradient-stop-positions': ['0%', '50%', '51%', "90%", "91%"]
        }},
        {selector:'edge.calcInput' , style:{
            'width': '5',
            'line-color': 'red',
            'target-label': 'data(ppath)',
            'font-size': '11px',
            'target-text-offset': 'data(ppathOffset)',
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-background-padding': '2px',
            'color': 'gray',
            'text-border-color': 'gray'
        } },
        {selector:'edge.calcOutput' , style: {
            'width': '5',
            'line-color': 'blue',
            'source-label': 'data(ppath)',
            'font-size': '11px',
            'source-text-offset': 'data(ppathOffset)',
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-background-padding': '2px',
            'color': 'gray',
            'text-border-color': 'gray'
        }},
        {selector:'edge:selected' , style:{
            'width': 3,
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red',
            'line-fill': "linear-gradient",
            'line-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'line-gradient-stop-positions': ['0%', '70%', '100%']
        } },
        {selector:'node:selected' , style: {
            'border-color': "red",
            'border-width': 2,
            'background-fill': 'radial-gradient',
            'background-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'background-gradient-stop-positions': ['0%', '50%', '60%']
        }}
    ]
    this.highestStyleSelectors={}
    this.highestStyleArr.forEach((oneStyle)=>{this.highestStyleSelectors[oneStyle.selector]=1})

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom: true,
        enableRemoveAnchorMidOfNearLine: false,
        enableCreateAnchorOnDrag: false
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

        var arr=[
            {selector:'node',style:{ 'font-size': fs, width: dimension, height: dimension }},
            {selector:'node:selected',style:{ 'border-width': Math.ceil(dimension / 15) }},
        ]
        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension = Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID] * dimension)
            arr.push({selector:'node[modelID = "' + modelID + '"]',style:{ width: newDimension, height: newDimension }})
        }
        this.updateStyleSheet(arr)
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

    this.contenxtMenuInstance = this.core.contextMenus('get')
    this.addMenuItemsForEditing()
    this.addMenuItemsForOthers()
    this.addMenuItemsForLiveData()
    
    this.core.on('cxttap', (e)=>{
        this.decideVisibleContextMenu(e.target)
    })
}

topologyDOM.prototype.selectIfClickEleIsNotSelected=function(clickEle){
    if(!clickEle.selected()){
        this.core.$(':selected').unselect()
        clickEle.select()
    }
}

topologyDOM.prototype.node_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode && clickEle.isNode()){
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}
topologyDOM.prototype.nodeoredge_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode){ //at least having isnode function means it is node or edge
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}


topologyDOM.prototype.decideVisibleContextMenu=function(clickEle){
    //restore all menu items
    this.contenxtMenuInstance.showMenuItem('ConnectTo');
    this.contenxtMenuInstance.showMenuItem('ConnectFrom');
    this.contenxtMenuInstance.showMenuItem('QueryOutbound');
    this.contenxtMenuInstance.showMenuItem('QueryInbound');
    this.contenxtMenuInstance.showMenuItem('SelectOutbound');
    this.contenxtMenuInstance.showMenuItem('SelectInbound');
    this.contenxtMenuInstance.showMenuItem('enableLiveDataStream');
    this.contenxtMenuInstance.showMenuItem('COSE');
    this.contenxtMenuInstance.showMenuItem('addSimulatingDataSource');
    this.contenxtMenuInstance.showMenuItem('liveData');
    this.contenxtMenuInstance.showMenuItem('Hide');
    this.contenxtMenuInstance.showMenuItem('Others');

    var selectedNodes=this.core.$('node:selected')
    var selected=this.core.$(':selected')
    var isClickingNode=(clickEle.isNode && clickEle.isNode())
    var hasNode=isClickingNode || (selectedNodes.length>0)

    if(!hasNode){
        this.contenxtMenuInstance.hideMenuItem('ConnectTo');
        this.contenxtMenuInstance.hideMenuItem('ConnectFrom'); 
        this.contenxtMenuInstance.hideMenuItem('QueryOutbound');
        this.contenxtMenuInstance.hideMenuItem('QueryInbound');
        this.contenxtMenuInstance.hideMenuItem('SelectOutbound');
        this.contenxtMenuInstance.hideMenuItem('SelectInbound');
        this.contenxtMenuInstance.hideMenuItem('enableLiveDataStream');
        this.contenxtMenuInstance.hideMenuItem('Hide');
        this.contenxtMenuInstance.hideMenuItem('Others');

    }

    if(selected.length<=1) this.contenxtMenuInstance.hideMenuItem('COSE');
    if(!isClickingNode) this.contenxtMenuInstance.hideMenuItem('addSimulatingDataSource');
    if(!isClickingNode && selectedNodes.length==0) this.contenxtMenuInstance.hideMenuItem('liveData');

}

topologyDOM.prototype.addMenuItemsForLiveData = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'liveData',
            content: 'Live Data',
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'addSimulatingDataSource',
            content: 'Add Simulator Source',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var target = e.target || e.cyTarget;
                this.addSimulatorSource(target.id())
            }
        },
        {
            id: 'enableLiveDataStream',
            content: 'Monitor Live Data',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var target = e.target || e.cyTarget;
                this.enableLiveDataStream(target.id())
            }
        }
    ])
}

topologyDOM.prototype.addMenuItemsForEditing = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'editing',
            content: 'Edit',
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'ConnectTo',
            content: 'Connect To',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.startTargetNodeMode("connectTo",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'ConnectFrom',
            content: 'Connect From',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.startTargetNodeMode("connectFrom",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'DeleteAll',
            content: 'Delete',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.deleteElementsArray(this.nodeoredge_changeSelectionWhenClickElement(e.target) )
            }
        }
    ])
}

topologyDOM.prototype.addMenuItemsForOthers = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'Others',
            content: 'Others', 
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{} //empty func, it is only a menu title item
        },
        {
            id: 'QueryOutbound',
            content: 'Load Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.showOutBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'QueryInbound',
            content: 'Load Inbound', 
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.showInBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },{
            id: 'SelectOutbound',
            content: '+Select Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.selectOutboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'SelectInbound',
            content: '+Select Inbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.selectInboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'COSE',
            content: 'COSE Layout',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.noPosition_cose(this.core.$(':selected'),this.getCurrentLayoutDetail())
            }
        },
        {
            id: 'Hide',
            content: 'Hide',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var collection=this.node_changeSelectionWhenClickElement(e.target)
                collection.remove()
                var twinIDArr=[]
                collection.forEach(oneNode=>{twinIDArr.push(oneNode.data("originalInfo")['$dtId'])})
                this.broadcastMessage({ "message": "hideSelectedNodes","twinIDArr":twinIDArr })
            }
        }
    ])
}


topologyDOM.prototype.addSimulatorSource = function (twinName) {
    //TODO:
    console.log("TODO: add simulator source")
}

topologyDOM.prototype.enableLiveDataStream = function (twinName) {
    var twinID=globalCache.twinDisplayNameMapToID[twinName]
    var dbtwin=globalCache.DBTwins[twinID]
    var modelID=dbtwin.modelID
    var propertyPaths=modelAnalyzer.fetchPropertyPathsOfModel(modelID)
    var checkBoxes=[]
    
    var dialog=new simpleConfirmDialog()
    dialog.show({"max-width":"450px","min-width":"300px"},{
        "title":"Choose Live Monitor Properties",
        "customDrawing":(parentDOM)=>{
            propertyPaths.forEach((path) => {
                var isIoTCheck = $('<input class="w3-check" style="width:20px;margin-left:16px;margin-right:5px" type="checkbox">')
                var isIoTText = $('<label style="margin-right:12px">'+path.join(".")+'</label>')
                parentDOM.append($('<div style="float:left"/>').append(isIoTCheck, isIoTText))
                checkBoxes.push(isIoTCheck)
                isIoTCheck.data("path",path)
            })
        },
        "buttons":[
            {
                "text": "Live",
                "colorClass":"w3-lime",
                "clickFunc": () => {
                    for(var i=0;i<checkBoxes.length;i++){
                        var aChkBox=checkBoxes[i]
                        if(!aChkBox.prop('checked')) continue
                        var aPath=aChkBox.data("path")
                        this.broadcastMessage({"message": "addLiveMonitor","twinID":twinID,"propertyPath":aPath})
                    }
                    dialog.close()
                }
            },
            {"text":"Cancel","colorClass":"w3-light-gray","clickFunc":()=>{dialog.close()}}
        ]
    })
}

topologyDOM.prototype.showOutBound=async function(collection) {
    var twinIDArr = []
    collection.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if (originalInfo['$sourceId']) return;
        twinIDArr.push(originalInfo['$dtId'])
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
            this.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.showInBound=async function(collection) {
    var twinIDArr = []
    collection.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if (originalInfo['$sourceId']) return;
        twinIDArr.push(originalInfo['$dtId'])
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
            this.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}


topologyDOM.prototype.deleteElementsArray=async function(arr) {
    if (arr.length == 0) return;
    var relationsArr = []
    var twinIDArr = []
    var twinIDs = {}
    arr.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if(!originalInfo) return;
        if (originalInfo['$sourceId']) relationsArr.push(originalInfo);
        else {
            twinIDArr.push(originalInfo['$dtId'])
            twinIDs[originalInfo['$dtId']] = 1
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

topologyDOM.prototype.deleteTwins=async function(twinIDArr) {
    var ioTDevices = []
    twinIDArr.forEach(oneTwinID => {
        var dbTwinInfo = globalCache.DBTwins[oneTwinID]
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
            var theMessage={ "message": "twinsDeleted", twinIDArr: result }
            result.forEach(twinID=>{
                var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
                this.core.$('[id = "'+twinDisplayName+'"]').remove()
            })
            this.broadcastMessage(theMessage)
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.deleteRelations=async function(relationsArr) {
    var arr = []
    relationsArr.forEach(oneRelation => {
        arr.push({ srcID: oneRelation['$sourceId'], relID: oneRelation['$relationshipId'] })
    })
    try {
        var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", { "relations": arr })
        globalCache.storeTwinRelationships_remove(data)
        this.rxMessage({ "message": "relationsDeleted", "relations": data })
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
    }
}



topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //consider lock mouse move position for these nodes:
    // - its connectfrom nodes and their connectto nodes
    // - its connectto nodes and their connectfrom nodes
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

    this.lastCalcInputStyleNodes.forEach(ele=>{ele.removeClass("calcInput")})
    this.lastCalcInputStyleNodes.length=0
    this.lastCalcOutputStyleNodes.forEach(ele=>{ele.removeClass("calcOutput")})
    this.lastCalcOutputStyleNodes.length=0
    

    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })

    //if there is calculation script in hovered node, highlight input nodes and the properties
    if(info["$dtId"]){
        var twinID=info["$dtId"]
        var dbtwin=globalCache.DBTwins[twinID]
        var inputArr = dbtwin["inputs"]
        if(inputArr) inputArr.forEach(oneInput=>{this.visualizeSingleInputInTwinCalculation(oneInput,e.target)})

        this.analyseSingleOutput(e.target,info["$dtId"])
    }
    

}

topologyDOM.prototype.analyseSingleOutput = function (twinTopoNode,twinID) {
    //check if its output is another node's input
    var furtherInputsArr=[]
    for (var aTwinID in globalCache.DBTwins) {
        var checkDBTwin = globalCache.DBTwins[aTwinID]
        var inputArr=checkDBTwin["inputs"]
        if(!inputArr) continue;
        for(var i=0;i<inputArr.length;i++){
            var aFurtherInput=inputArr[i]
            if(aFurtherInput.twinID==twinID){
                furtherInputsArr.push({"path":aFurtherInput.path,"targetTwinName":checkDBTwin.displayName})
                break;
            }
        }
    }
    if(furtherInputsArr) furtherInputsArr.forEach(oneFurtherInput=>{
        this.visualizeSingleInputInTwinCalculation(oneFurtherInput,twinTopoNode)
    })
}

topologyDOM.prototype.visualizeSingleInputInTwinCalculation = function (oneInput,twinTopoNode) {
    var twinName = globalCache.twinIDMapToDisplayName[oneInput.twinID]
    var edges=null;
    if(oneInput.targetTwinName){
        var targetTwinNode = this.core.nodes("#" + oneInput.targetTwinName)
        if (targetTwinNode) {
            targetTwinNode.addClass("calcOutput")
            this.lastCalcOutputStyleNodes.push(targetTwinNode)
            //find the first relationship link from this node to hovered node
            var edges = twinTopoNode.edgesTo(targetTwinNode)
        }
    } else {
        var inputTwinNode = this.core.nodes("#" + twinName)
        if (inputTwinNode) {
            inputTwinNode.addClass("calcInput")
            this.lastCalcInputStyleNodes.push(inputTwinNode)
            //find the first relationship link from this node to hovered node
            var edges = inputTwinNode.edgesTo(twinTopoNode)
        }
    }
    if(edges && edges.length > 0){
        if(oneInput.targetTwinName) {
            edges[0].addClass("calcOutput")
            this.lastCalcOutputStyleNodes.push(edges[0])
        }else{
            edges[0].addClass("calcInput")
            this.lastCalcInputStyleNodes.push(edges[0])
        } 
        var currentPPath = edges[0].data('ppath') || ""
        if (currentPPath != "") currentPPath += ";"
        currentPPath += oneInput.path.join("/")
        edges[0].data('ppath', currentPPath)
        
        var randOffset= parseInt(Math.random()*40)+20
        edges[0].data('ppathOffset', randOffset+"%")
    }
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
    if(!globalCache.showFloatInfoPanel){ //since floating window is used for mouse hover element info, so info panel never chagne before, that is why there is no need to restore back the info panel information at mouseout
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
    this.lastCalcInputStyleNodes.forEach(ele=>{
        ele.removeClass("calcInput")
        ele.data('ppath',null)
    })
    this.lastCalcInputStyleNodes.length=0
    this.lastCalcOutputStyleNodes.forEach(ele=>{
        ele.removeClass("calcOutput")
        ele.data('ppath',null)
    })
    this.lastCalcOutputStyleNodes.length=0

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
        this.updateStyleSheet([
            {selector:'node[modelID = "'+modelID+'"]',style:{'background-image': dataUrl}}
        ])
    }catch(e){
        
    }   
}


topologyDOM.prototype.updateStyleSheet=function(styleArr){
    //reserve the two styles of edgeediting plugin first, right now there is no better way to reserve them
    var allStyle=this.core.style()
    var edgeBendStyle=null
    var edgeControlStyle=null
    for(var ind in allStyle){
        if(typeof(allStyle[ind])!="object") continue
        if(!allStyle[ind].selector) continue
        var str=allStyle[ind].selector.inputText
        if(str==".edgebendediting-hasbendpoints"){
            edgeBendStyle=allStyle[ind]
        }
        if(str==".edgecontrolediting-hascontrolpoints"){
            edgeControlStyle=allStyle[ind]
        }
    }

    //do style merging
    var mergeSelector={}
    styleArr.forEach(ele=>{
        mergeSelector[ele.selector]=ele.style
    })

    var styleJson = this.core.style().json();
    var arr=[]
    for(var ind in styleJson){
        if(mergeSelector[styleJson[ind].selector]) {
            var olds= styleJson[ind].style
            var news=mergeSelector[styleJson[ind].selector] 
            for(var ind in olds){
                if(news[ind]!=null) continue
                news[ind]=olds[ind]
            }
            continue
        }else if(styleJson[ind].selector==".edgebendediting-hasbendpoints" ||styleJson[ind].selector==".edgecontrolediting-hascontrolpoints" ) continue
        else if(this.highestStyleSelectors[styleJson[ind].selector]) continue
        
        arr.push(styleJson[ind])
    }
    arr=arr.concat(styleArr)
    arr=arr.concat(this.highestStyleArr)
    this.core.style().fromJson(arr).update()
    if(edgeBendStyle){
        allStyle=this.core.style()
        var curLen=allStyle.length;
        allStyle.length=curLen+2
        allStyle[curLen]=edgeBendStyle
        allStyle[curLen+1]=edgeControlStyle
    }
}

topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode,secondColorCode){
    var styleJson = this.core.style().json();
    var arr=[]
    for(var ind in styleJson){
        arr.push(styleJson[ind].selector)
    }

    var styleSelector='node[modelID = "' + modelID + '"]'
    var styleObj=null
    if (secondColorCode == null) {
        if(colorCode=="none"){
            styleObj={ 'background-fill': 'solid','background-color': 'darkGray','background-opacity':0 }
        }else{
            styleObj={ 'background-fill': 'solid','background-color': colorCode ,'background-opacity':1}
        }
    } else {
        colorCode=colorCode||"darkGray"
        if(colorCode=="none") colorCode="darkGray"
        styleObj={
                'background-fill': 'linear-gradient',
                'background-gradient-stop-colors': [colorCode, colorCode, secondColorCode],
                'background-gradient-stop-positions': ['0%', '50%', '51%']
            }
    }
    if(styleObj) this.updateStyleSheet([{selector:styleSelector,style:styleObj}]) 
}

topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    var newStyle
    if(shape=="hexagon"){
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': 'polygon','shape-polygon-points':[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]}}
    }else{
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': shape}}
    }
    this.updateStyleSheet([newStyle])
}

topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
}

topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.updateStyleSheet([
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-color': colorCode}}
    ])
}

topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    var newStyle
    if(shape=="solid"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': shape}}
    }else if(shape=="dotted"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': 'dashed','line-dash-pattern':[8,8]}}
    }
    this.updateStyleSheet([newStyle])    
}
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    var arr=[
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)}},
        {selector:'edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)+1,'line-color': 'red'}},
        {selector:'edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)+3}}
    ]
    this.updateStyleSheet(arr)
}

topologyDOM.prototype.reflectRelationsDeleted=function(relations){
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
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color,visualJson[modelID].secondColor)
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
    }else if(msgPayload.message=="projectIsChanged") {
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
    }else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
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
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color,msgPayload.secondColor)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
        } 
    }else if(msgPayload.message=="relationsDeleted") this.reflectRelationsDeleted(msgPayload.relations)
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
        var currentLayout=this.getCurrentLayoutDetail()
        this.core.edges().forEach(oneEdge => {
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights", [])
            oneEdge.data("cyedgebendeditingDistances", [])
            oneEdge.data("cyedgecontroleditingWeights", [])
            oneEdge.data("cyedgecontroleditingDistances", [])
        })
        this.noPosition_cose(null,currentLayout)
    } else if (layoutName != null) {
        var layoutDetail = globalCache.layoutJSON[layoutName].detail
        if (layoutDetail) {
            this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
    }
}


topologyDOM.prototype.showSelf = function () {
    this.DOM.show()
    this.DOM.animate({height: "100%"});
}

topologyDOM.prototype.hideSelf = function () {
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
    var targetX=null
    var targetY=null
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
    if(!globalCache.layoutJSON[layoutName]){
        var layoutDict={}
        globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,layoutName,false)
    }else layoutDict=globalCache.layoutJSON[layoutName].detail
    
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



topologyDOM.prototype.selectInboundNodes = function (selectedNodes) {
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function (selectedNodes) {
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode,srcNodeArr) {
    var theConnectMode=this.targetNodeMode
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
        returnObj["from"]=fromNode.data().originalInfo["$dtId"]
        returnObj["to"]=toNode.data().originalInfo["$dtId"]
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
        if(includeCancelConnectOperation){
            if (e.keyCode == 27) this.cancelTargetNodeMode()    
        }
    });
}

topologyDOM.prototype.startTargetNodeMode = function (mode,selectedNodes) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    this.setKeyDownFunc("includeCancelConnectOperation")

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode,selectedNodes)
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

topologyDOM.prototype.noPosition_cose=function(eles,undoLayoutDetail){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    if(undoLayoutDetail){
        var newLayoutDetail=this.getCurrentLayoutDetail()
        this.applyNewLayoutWithUndo(newLayoutDetail, undoLayoutDetail)
    }
    
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


module.exports = topologyDOM;
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/serviceWorkerHelper":25,"../sharedSourceFiles/simpleConfirmDialog":27,"../sharedSourceFiles/simpleSelectMenu":29}],12:[function(require,module,exports){
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
            var secondColorCode = visualJson.secondColor
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
            if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
        }

        var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative;padding-top:2px'></div>")
        if(dbModelInfo && dbModelInfo.isIoTDeviceModel){
            var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-7px;border-radius: 3px;font-size:7px'>IoT</div>")
            iconDOM.append(iotDiv)
        }

        var imgSrc=encodeURIComponent(globalCache.shapeSvg(shape,colorCode,secondColorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
        if(avarta){
            var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
            iconDOM.append(avartaimg)
        }
        return iconDOM
    }

    this.tree.options.groupNodeTailButtonFunc = (gn) => {
        var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-red w3-hover-amber" style="font-size:1.2em;padding:4px 8px;position:absolute;top:50%;height:27px; right:10px;transform:translateY(-50%)">+</button>')
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
    var hideOrShowEmptyGroup=$('<button style="height:20px;border:none;padding-left:2px" class="w3-ripple w3-block w3-tiny w3-hover-red w3-amber">Hide Empty Models</button>')
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

twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"replace")
    else if(msgPayload.message=="startSelection_append") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"append")
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels()
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    else if(msgPayload.message=="twinsDeleted") this.hideTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="hideSelectedNodes") this.hideTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="visualDefinitionChange"){
        if(!msgPayload.srcModelID){ // change model class visualization
            this.tree.groupNodes.forEach(gn=>{gn.refreshName()})
        } 
    }
}

twinsTree.prototype.hideTwins=function(twinIDArr){
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
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"../sharedSourceFiles/newTwinDialog":22,"../sharedSourceFiles/simpleTree":30}],13:[function(require,module,exports){
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

msalHelper.prototype.fetchAccount=function(){
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
    
        console.log("try to silently get token")
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        console.log("get token successfully")
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError();
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
const globalCache = require("../sharedSourceFiles/globalCache")
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const msalHelper = require("../msalHelper")

class baseInfoPanel {
    drawEditable(parent,jsonInfo,originElementInfo,pathArr,funcGetKeyLblColorClass){
        if(jsonInfo==null) return;
        for(var ind in jsonInfo){
            var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
            parent.append(keyDiv)
            
            keyDiv.css("padding-top",".3em") 
    
            var contentDOM=$("<label style='padding-top:.2em'></label>")
            var newPath=pathArr.concat([ind])
            var keyLabelColorClass="w3-dark-gray"
            if(funcGetKeyLblColorClass) keyLabelColorClass=funcGetKeyLblColorClass(newPath)
            if(Array.isArray(jsonInfo[ind])){
                keyDiv.children(":first").addClass(keyLabelColorClass)
                if (this.readOnly) {
                    var val = globalCache.searchValue(originElementInfo, newPath)
                    if (val == null) {
                        contentDOM.css({ "color": "gray", "font-size": "9px" })
                        contentDOM.text("[empty]")
                    } else contentDOM.text(val)
                }else{
                    this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
                }
            }else if(typeof(jsonInfo[ind])==="object") {
                keyDiv.children(":first").css("font-weight","bold")
                contentDOM.css("display","block")
                contentDOM.css("padding-left","1em")
                this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,funcGetKeyLblColorClass)
            }else {
                keyDiv.children(":first").addClass(keyLabelColorClass)
                var val = globalCache.searchValue(originElementInfo, newPath)
                if (this.readOnly) {
                    if (val == null) {
                        contentDOM.css({ "color": "gray", "font-size": "9px" })
                        contentDOM.text("[empty]")
                    } else contentDOM.text(val)
                } else {
                    var aInput = $('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: ' + jsonInfo[ind] + '"/>').addClass("w3-input w3-border");
                    contentDOM.append(aInput)
                    if (val != null) aInput.val(val)
                    aInput.data("path", newPath)
                    aInput.data("dataType", jsonInfo[ind])
                    aInput.change((e) => {
                        this.editDTProperty(originElementInfo, $(e.target).data("path"), $(e.target).val(), $(e.target).data("dataType"))
                    })
                }
            }
            keyDiv.append(contentDOM)
        }
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
        var val=globalCache.searchValue(originElementInfo,newPath)
        if(val!=null){
            aSelectMenu.triggerOptionValue(val)
        }    
    }

    generateSmallKeyDiv(str,paddingTop){
        var keyDiv = $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+str+"</div></label>")
        keyDiv.css("padding-top",paddingTop)
        return keyDiv
    }

    drawConnectionStatus(status,parentDom) {
        parentDom=parentDom||this.DOM
        var keyDiv=this.generateSmallKeyDiv("Connection",".5em")
        parentDom.append(keyDiv)
        var contentDOM = $('<span class="fa-stack" style="font-size:.5em;padding-left:5px"></span>')
        if(status) {
            contentDOM.addClass("w3-text-lime")
            contentDOM.html('<i class="fas fa-signal fa-stack-2x"></i>')
        }else{
            contentDOM.addClass("w3-text-red")
            contentDOM.html('<i class="fas fa-signal fa-stack-2x"></i><i class="fas fa-slash fa-stack-2x"></i>')
        }
        keyDiv.append(contentDOM)
    }

    drawStaticInfo(parent,jsonInfo,paddingTop,fontSize,fontColor){
        fontColor=fontColor||"black"
        for(var ind in jsonInfo){
            var keyDiv=this.generateSmallKeyDiv(ind,paddingTop)
            parent.append(keyDiv)
    
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

    fetchRealElementInfo(singleElementInfo){ //the input is possibly from topology view which might not be precise about property value
        var returnElementInfo={}
        if (singleElementInfo["$dtId"]) {
            returnElementInfo=globalCache.storedTwins[singleElementInfo["$dtId"]] //note that dynamical property value is not stored in topology node, so always get refresh data from globalcache
        }else if (singleElementInfo["$sourceId"]) {
            var arr=globalCache.storedOutboundRelationships[singleElementInfo["$sourceId"]]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==singleElementInfo["$relationshipId"]){
                    returnElementInfo=arr[i]
                    break;
                }
            }
        }
        return returnElementInfo
    }

    drawSingleRelationProperties(singleRelationInfo,parentDom) {
        parentDom=parentDom||this.DOM
        this.drawStaticInfo(parentDom, {
            "sourceI":globalCache.twinIDMapToDisplayName[singleRelationInfo["$sourceId"]],
            "target": globalCache.twinIDMapToDisplayName[singleRelationInfo["$targetId"]],
            "$relationshipName": singleRelationInfo["$relationshipName"]
        }, "1em", "13px")
        this.drawStaticInfo(parentDom, {
            "$relationshipId": singleRelationInfo["$relationshipId"]
        }, "1em", "10px")
        var relationshipName = singleRelationInfo["$relationshipName"]
        var sourceModel = singleRelationInfo["sourceModel"]

        this.drawEditable(parentDom, this.getRelationShipEditableProperties(relationshipName, sourceModel), singleRelationInfo, [])
        for (var ind in singleRelationInfo["$metadata"]) {
            var tmpObj = {}
            tmpObj[ind] = singleRelationInfo["$metadata"][ind]
            this.drawStaticInfo(parentDom, tmpObj, "1em", "10px")
        }
        //this.drawStaticInfo(parentDom,{"$etag":singleRelationInfo["$etag"]},"1em","10px","DarkGray")
    }

    getRelationShipEditableProperties(relationshipName, sourceModel) {
        if (!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
        return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
    }

    drawSingleNodeProperties(singleDBTwinInfo,singleADTTwinInfo,parentDom,notEmbedMetadata) {
        //instead of draw the $dtId, draw display name instead
        //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
        parentDom=parentDom||this.DOM
        const constDesiredColor="w3-amber"
        const constReportColor="w3-blue"
        const constTelemetryColor="w3-lime"
        const constCommonColor="w3-dark-gray"

        var modelID = singleDBTwinInfo.modelID
        this.drawStaticInfo(parentDom, { "name": singleDBTwinInfo["displayName"] }, ".5em", "13px")
        var theDBModel = globalCache.getSingleDBModelByID(modelID)
        if (theDBModel.isIoTDeviceModel) {
            this.drawConnectionStatus(singleDBTwinInfo["connectState"],parentDom)
            this.drawStaticInfo(parentDom, { "Connection State Time": singleDBTwinInfo["connectStateUpdateTime"] }, ".5em", "10px")
            parentDom.append($('<table style="font-size:smaller;margin:3px 0px"><tr><td class="'+constTelemetryColor+'">&nbsp;&nbsp;</td><td>telemetry</td><td class="'+constReportColor+'">&nbsp;&nbsp;</td><td>report</td><td class="'+constDesiredColor+'">&nbsp;&nbsp;</td><td>desired</td><td class="'+constCommonColor+'">&nbsp;&nbsp;</td><td>common</td></tr></table>'))
        }

        if (modelAnalyzer.DTDLModels[modelID]) {
            if (theDBModel.isIoTDeviceModel) {
                var funcGetKeyLblColorClass = (propertyPath) => {
                    var colorCodeMapping = {}
                    theDBModel.desiredProperties.forEach(desiredP => {
                        colorCodeMapping[JSON.stringify(desiredP.path)] = constDesiredColor
                    })
                    theDBModel.reportProperties.forEach(reportP => {
                        colorCodeMapping[JSON.stringify(reportP.path)] = constReportColor
                    })
                    theDBModel.telemetryProperties.forEach(telemetryP => {
                        colorCodeMapping[JSON.stringify(telemetryP.path)] = constTelemetryColor
                    })
                    var pathStr = JSON.stringify(propertyPath)
                    if (colorCodeMapping[pathStr]) return colorCodeMapping[pathStr]
                    else return constCommonColor
                }
            }
            this.drawEditable(parentDom, modelAnalyzer.DTDLModels[modelID].editableProperties, singleADTTwinInfo, [], funcGetKeyLblColorClass)
        }

        var metadataContent = $("<label style='display:block'></label>")
        var expandMetaBtn=$("<div class='w3-border w3-button w3-light-gray' style='padding:.1em .5em;margin-right:1em;font-size:10px'>...</div>")
        parentDom.append(metadataContent)
        var metaDataDiv=$('<div/>')
        metadataContent.append(expandMetaBtn,metaDataDiv)
        metaDataDiv.hide()
        expandMetaBtn.on("click",()=>{expandMetaBtn.hide();metaDataDiv.show()})
        if(notEmbedMetadata) expandMetaBtn.trigger("click")


        this.drawStaticInfo(metaDataDiv, { "Model": modelID }, "1em", "10px")
        for (var ind in singleADTTwinInfo["$metadata"]) {
            if (ind == "$model") continue;
            var tmpObj = {}
            tmpObj[ind] = singleADTTwinInfo["$metadata"][ind]
            this.drawStaticInfo(metaDataDiv, tmpObj, ".5em", "10px")
        }
    }

    async editDTProperty(originElementInfo, path, newVal, dataType) {
        if (["double", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)
        if(dataType=="boolean"){
            if(newVal=="true") newVal=true
            else newVal=false
        }

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
    }

}

module.exports = baseInfoPanel;
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17,"../sharedSourceFiles/modelAnalyzer":18,"./simpleSelectMenu":29}],16:[function(require,module,exports){
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function editProjectDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
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
},{"../msalHelper":14,"./globalCache":17}],17:[function(require,module,exports){
function globalCache(){
    this.accountInfo=null;
    this.joinedProjectsToken=null;
    this.showFloatInfoPanel=true
    this.DBModelsArr = []
    this.DBTwins = {}
    this.modelIDMapToName={}
    this.modelNameMapToID={}
    this.twinIDMapToDisplayName={}
    this.twinDisplayNameMapToID={}
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
    //this.broadcastMessage({ "message": "ADTTwinInfoUpdate","twinID":oneNode["$dtId"]})
}


globalCache.prototype.storeSingleDBTwin=function(DBTwin){
    this.DBTwins[DBTwin["id"]]=DBTwin
    this.twinIDMapToDisplayName[DBTwin["id"]]=DBTwin["displayName"]
    this.twinDisplayNameMapToID[DBTwin["displayName"]]=DBTwin["id"]
}

globalCache.prototype.storeDBTwinsArr=function(DBTwinsArr){
    for(var ind in this.DBTwins) delete this.DBTwins[ind]
    for(var ind in this.twinIDMapToDisplayName) delete this.twinIDMapToDisplayName[ind]
    for(var ind in this.twinDisplayNameMapToID) delete this.twinDisplayNameMapToID[ind]

    this.mergeDBTwinsArr(DBTwinsArr)
}

globalCache.prototype.mergeDBTwinsArr=function(DBTwinsArr){
    DBTwinsArr.forEach(oneDBTwin=>{
        this.DBTwins[oneDBTwin["id"]]=oneDBTwin
        this.twinIDMapToDisplayName[oneDBTwin["id"]]=oneDBTwin["displayName"]
        this.twinDisplayNameMapToID[oneDBTwin["displayName"]]=oneDBTwin["id"]
    })
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

    resArr.forEach(element => {
        if(element.originalScript!=null) { 
            var twinID=element.twinID
            var oneDBTwin=this.DBTwins[twinID]
            if(oneDBTwin){
                oneDBTwin["originalScript"]=element["originalScript"]
                oneDBTwin["lastExecutionTime"]=element["lastExecutionTime"]
                oneDBTwin["author"]=element["author"]
                oneDBTwin["invalidFlag"]=element["invalidFlag"]
                oneDBTwin["inputs"]=element["inputs"]
                oneDBTwin["outputs"]=element["outputs"]

            }
        }
    });
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
    for(var ind in this.DBTwins){
        var ele=this.DBTwins[ind]
        if(ele.modelID==modelID){
            resultArr.push(ele)
        }
    }
    return resultArr;
}

globalCache.prototype.getSingleDBTwinByName=function(twinName){
    var twinID=this.twinDisplayNameMapToID[twinName]
    return this.DBTwins[twinID]
}

globalCache.prototype.getSingleDBTwinByIndoorFeatureID=function(featureID){
    for(var ind in this.DBTwins){
        var ele=this.DBTwins[ind]
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


globalCache.prototype.getStoredAllInboundRelationsSources=function(twinID){
    var srcTwins={}
    for(var srcTwin in this.storedOutboundRelationships){
        var arr=this.storedOutboundRelationships[srcTwin]
        arr.forEach(oneRelation=>{
            if(oneRelation["$targetId"]==twinID) srcTwins[oneRelation["$sourceId"]]=1
        })
    }
    return srcTwins;
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

globalCache.prototype.findAllInputsInScript=function(calcScript,formulaTwinName){
    //find all properties in the script
    calcScript+="\n" //make sure the below patterns using "[^. ] not fail because of it is the end of string "
    var patt = /_self(?<=_self)\[\".*?(?=\"\][^\[])\"\]/g; 
    var allSelfProperties=calcScript.match(patt)||[];
    var countAllSelfTimes={}
    allSelfProperties.forEach(oneSelf=>{
        if(countAllSelfTimes[oneSelf]) countAllSelfTimes[oneSelf]+=1
        else countAllSelfTimes[oneSelf]=1
    })

    var patt = /_twinVal(?<=_twinVal)\[\".*?(?=\"\][^\[])\"\]/g; 
    var allOtherTwinProperties=calcScript.match(patt)||[];
    var listAllOthers={}
    allOtherTwinProperties.forEach(oneOther=>{listAllOthers[oneOther]=1 })

    //analyze all variables that can not be as input as they are changed during calcuation
    //they disqualify as input as they will trigger infinite calculation, all these belongs to _self
    var outputpatt = /_self(?<=_self)\[\"[^;{]*?[^\=](?=\=[^\=])/g;
    var outputProperties=calcScript.match(outputpatt)||[];
    var countOutputTimes={}
    outputProperties.forEach(oneOutput=>{
        if(countOutputTimes[oneOutput]) countOutputTimes[oneOutput]+=1
        else countOutputTimes[oneOutput]=1
    })
    

    var inputPropertiesArr=[]
    for(var ind in listAllOthers) inputPropertiesArr.push(ind)
    for(var ind in countAllSelfTimes){
        if(countAllSelfTimes[ind]!=countOutputTimes[ind]) inputPropertiesArr.push(ind)
    }

    var returnArr=[]
    inputPropertiesArr.forEach(oneProperty=>{
        var oneInputObj={} //twinID, path, value
        var fetchpropertypatt = /(?<=\[\").*?(?=\"\])/g;
        if(oneProperty.startsWith("_self")){
            oneInputObj.path=oneProperty.match(fetchpropertypatt);
            oneInputObj.twinName=formulaTwinName+"(self)"
            oneInputObj.twinName_origin=formulaTwinName
            var twinID=this.twinDisplayNameMapToID[formulaTwinName]
            oneInputObj.value=this.searchValue(this.storedTwins[twinID],oneInputObj.path)
        }else if(oneProperty.startsWith("_twinVal")){
            var arr=oneProperty.match(fetchpropertypatt);
            var firstEle=arr[0]
            arr.shift()
            oneInputObj.path=arr
            var twinID=this.twinDisplayNameMapToID[firstEle]
            oneInputObj.value=this.searchValue(this.storedTwins[twinID],oneInputObj.path)
            oneInputObj.twinName=oneInputObj.twinName_origin=firstEle
        }
        returnArr.push(oneInputObj)
    })
    return returnArr
}

globalCache.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}

globalCache.prototype.shapeSvg=function(shape,color,secondColor){
    var svgStart='<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" >'
    if(secondColor){
        if(color=="none") color="darkGray" 
        var gradientDefinition='<defs>'+
            '<linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">'+
            '<stop offset="0%" style="stop-color:'+color+';stop-opacity:1" />'+
            '<stop offset="50%" style="stop-color:'+color+';stop-opacity:1" />'+
            '<stop offset="51%" style="stop-color:'+secondColor+';stop-opacity:1" />'+
            '</linearGradient></defs>'
        svgStart+=gradientDefinition
    }
    var colorStr=(secondColor)?"url(#grad1)":color
    if(shape=="ellipse"){
        return svgStart+'<circle cx="50" cy="50" r="50"  fill="'+colorStr+'"/></svg>'
    }else if(shape=="hexagon"){
        return svgStart+'<polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+colorStr+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return svgStart+'<rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+colorStr+'" /></svg>'
    }
}

globalCache.prototype.makeDOMDraggable=function(dom,ignoreChildDomType){
    ignoreChildDomType=ignoreChildDomType||["LABEL","TD","B","A","INPUT","PRE"]
    dom.on('mousedown',(e)=>{
        if(ignoreChildDomType.indexOf(e.target.tagName)!=-1) return;
        var domOffset=dom.offset()
        dom.mouseStartDragOffset=[domOffset.left-e.clientX, domOffset.top-e.clientY]
        $('body').on('mouseup',()=>{
            dom.mouseStartDragOffset=null
            $('body').off('mousemove')
            $('body').off('mouseup')
        })
        $('body').on('mousemove',(e)=>{
            e.preventDefault()
            if(dom.mouseStartDragOffset){
                var newLeft= e.clientX+dom.mouseStartDragOffset[0]
                var newTop=e.clientY+dom.mouseStartDragOffset[1]
                dom.css({"left":newLeft+"px","top":newTop+"px","transform":"none"})
            }
        })
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

modelAnalyzer.prototype.resetAllModels=function(){
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


modelAnalyzer.prototype.fetchPropertyPathsOfModel=function(modelID){
    var properties=this.DTDLModels[modelID].editableProperties
    var propertyPaths=[]
    this.analyzePropertyPath(properties,[],propertyPaths)
    return propertyPaths
}

modelAnalyzer.prototype.analyzePropertyPath=function (jsonInfo,pathArr,propertyPaths){
    for(var ind in jsonInfo){
        var newPath=pathArr.concat([ind])
        if(!Array.isArray(jsonInfo[ind]) && typeof(jsonInfo[ind])==="object") {
            this.analyzePropertyPath(jsonInfo[ind],newPath,propertyPaths)
        }else {
            propertyPaths.push(newPath)
        }
    }
}

module.exports = new modelAnalyzer();
},{"../msalHelper":14}],19:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const simpleConfirmDialog=require("./simpleConfirmDialog")
const globalCache=require("./globalCache")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
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
        await msalHelper.callAPI("digitaltwin/importModels", "POST", { "models": JSON.stringify(modelToBeImported) },"withProjectID")
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

    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
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

    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
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


    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
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
    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-cog fa-lg"></i></button>')
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
    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
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
    var addButton = $('<button class="w3-ripple w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-plus fa-lg"></i></button>')
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
},{"../msalHelper":14,"./globalCache":17,"./modelAnalyzer":18,"./simpleConfirmDialog":27,"./simpleSelectMenu":29}],20:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("./simpleTree")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")
const simpleExpandableSection= require("../sharedSourceFiles/simpleExpandableSection")

function modelManagerDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
    this.showRelationVisualizationSettings=true;
}

modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:700px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create/Modify Model</button>')
    var exportModelBtn = $('<button class="w3-ripple w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
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
    var panelCard=$('<div style="width:460px;height:412px;overflow:auto;margin-top:2px"></div>')
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

    var delBtn = $('<button style="margin-bottom:2px" class="w3-ripple w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    this.modelButtonBar.append(delBtn)


    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn = $('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-ripple w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
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
        for(var oneTwinID in globalCache.DBTwins){
            var oneDBTwin = globalCache.DBTwins[oneTwinID]
            var theIndex=checkTwinsModelArr.indexOf(oneDBTwin["modelID"])
            if(theIndex!=-1) numberOfTwins++
        }

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
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization",{"marginTop":0}) 
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
    var definedColor2=null
    var definedShape=null
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition["default"].detail
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].secondColor) definedColor2=visualJson[modelID].secondColor
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
            if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
        }
    }

    var createAColorSelector=(predefinedColor,nameOfColorField)=>{
        var colorSelector=$('<select class="w3-border" style="outline:none;width:75px"></select>')
        containerDiv.append(colorSelector)

        var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
        colorArr.forEach((oneColorCode)=>{
            var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
            colorSelector.append(anOption)
            anOption.css("color",oneColorCode)
        })

        if(relatinshipName==null){
            var anOption=$("<option value='none'>none</option>")
            anOption.css("color","darkGray")
            colorSelector.append(anOption)
        }

        if(nameOfColorField=="secondColor"){
            if(predefinedColor==null) predefinedColor="none"
        }else{
            if(predefinedColor==null) predefinedColor="darkGray"
        }

        colorSelector.val(predefinedColor)
        if(predefinedColor!="none") {
            colorSelector.css("color",predefinedColor)
        }else{
            colorSelector.css("color","darkGray")
        }
        
        colorSelector.change((eve)=>{
            var selectColorCode=eve.target.value
            if(selectColorCode=="none") colorSelector.css("color","darkGray")
            else colorSelector.css("color",selectColorCode)
            var visualJson=globalCache.visualDefinition["default"].detail
    
            if(!visualJson[modelID]) visualJson[modelID]={}
            if(!relatinshipName) {
                if(selectColorCode=="none" && nameOfColorField=="secondColor") delete visualJson[modelID]["secondColor"]
                else visualJson[modelID][nameOfColorField]=selectColorCode
                this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID
                    ,"color":visualJson[modelID]["color"],"secondColor":visualJson[modelID]["secondColor"] })
                this.refreshModelTreeLabel()
            }else{
                if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
                if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
                visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
                this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
            }
            this.saveVisualDefinition()
        })
    }

    createAColorSelector(definedColor,"color")
    if(relatinshipName==null) createAColorSelector(definedColor2,"secondColor")


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
        for(var f=0.2;f<=3;f+=0.4){
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
        var keyDiv= $("<label style='display:block'><label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label></label>")
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


modelManagerDialog.prototype.addAPartInRightSpan=function(partName,options){
    options=options||{}
    var section= new simpleExpandableSection(partName,this.panelCard,options)
    section.expand()
    return section.listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0;i< files.length; i++) {
        var f=files[i]
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
        await msalHelper.callAPI("digitaltwin/importModels", "POST", {"models":JSON.stringify(fileContentArr)},"withProjectID")
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

    if($.isEmptyObject(modelAnalyzer.DTDLModels)){
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
                var secondColor = visualJson.secondColor
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
                if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
            }

            var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
            if(dbModelInfo.isIoTDeviceModel){
                var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-9px;border-radius: 3px;font-size:7px'>IoT</div>")
                iconDOM.append(iotDiv)
            }


            var imgSrc=encodeURIComponent(globalCache.shapeSvg(shape,colorCode,secondColor))
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

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();
},{"../msalHelper":14,"../sharedSourceFiles/simpleExpandableSection":28,"./globalCache":17,"./modelAnalyzer":18,"./modelEditorDialog":19,"./simpleConfirmDialog":27,"./simpleTree":30}],21:[function(require,module,exports){
const globalAppSettings=require("../globalAppSettings")

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
},{"../globalAppSettings":13}],22:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function newTwinDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
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

    var addButton = $('<button class="w3-ripple w3-button w3-card w3-green w3-hover-light-green" style="height:100%">Add</button>')
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
    var modelInput=$('<label type="text" style="margin:8px 0;padding:2px;display:inline"/>').text(modelID);  
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
},{"../msalHelper":14,"./globalCache":17,"./modelAnalyzer":18,"./simpleSelectMenu":29}],23:[function(require,module,exports){
const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function projectSettingDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
}

projectSettingDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        this.contentInitialized=false
        this.DOM.empty()
        this.DOM.hide()
    }
}

projectSettingDialog.prototype.popup = function () {
    this.DOM.show()
    if(this.contentInitialized)return;
    this.contentInitialized=true; 
    this.DOM.css({"width":"420px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Setting</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var tabControl=$('<div class="w3-bar w3-light-gray"></div>')
    var layoutBtn=$('<button class="w3-bar-item w3-button ">Layout</button>')
    var visualSchemaBtn=$('<button class="w3-bar-item w3-button">Visual Schema</button>')
    tabControl.append(layoutBtn,visualSchemaBtn)
    this.DOM.append(tabControl)

    this.layoutContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.visualSchemaContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.DOM.append(this.layoutContentDiv,this.visualSchemaContentDiv)
    this.fillLayoutDivContent()
    this.fillVisualSchemaContent()

    layoutBtn.on("click",()=>{
        layoutBtn.addClass("w3-white")
        visualSchemaBtn.removeClass("w3-white")
        this.visualSchemaContentDiv.hide()
        this.layoutContentDiv.show()
    })

    visualSchemaBtn.on("click",()=>{
        layoutBtn.removeClass("w3-white")
        visualSchemaBtn.addClass("w3-white")
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
            await msalHelper.callAPI("digitaltwin/setVisualSchemaSharedFlag", "POST", { "visualSchema": visualSchemaName, "isShared": shareSelfVisualSchemaCheck.prop('checked') }, "withProjectID")
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
    var copyBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
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
        var secondColor=visualJson.secondColor
        var shape = visualJson.shape || "ellipse"
        var avarta = visualJson.avarta
        if (visualJson.dimensionRatio) dimension *= parseFloat(visualJson.dimensionRatio)
        var iconDOM = $("<div style='width:" + dimension + "px;height:" + dimension + "px;float:left;position:relative'></div>")
        var imgSrc = encodeURIComponent(globalCache.shapeSvg(shape, colorCode,secondColor))
        iconDOM.append($("<img src='data:image/svg+xml;utf8," + imgSrc + "'></img>"))
        if (avarta) {
            var avartaimg = $("<img style='position:absolute;left:0px;width:60%;margin:20%' src='" + avarta + "'></img>")
            iconDOM.append(avartaimg)
        }
        oneSchemaRow.append(iconDOM)
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
    var defaultLbl=$("<a class='w3-bar-item' style='font-size:9px;padding:1px 2px;margin-top:9px;border-radius: 2px;'></a>")
    
    oneLayout.data("layoutObj",oneLayoutObj)

    oneLayout.data("defaultLbl",defaultLbl)
    oneLayout.append(nameLbl,defaultLbl)

    if(layoutName!=defaultLayoutName) this.showAsNotDefaultLayoutLbl(oneLayout)
    else this.showAsDefaultLayoutLbl(oneLayout)

    if(selfLayout){
        var str=(sharedFlag)?"Shared":"Share"
        var shareBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-hover-amber">'+str+'</button>')
        oneLayout.data("shareBtn",shareBtn)
        
        var deleteBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber"><i class="fa fa-trash fa-lg"></i></button>')
        oneLayout.append(shareBtn,deleteBtn)
        if(!sharedFlag) shareBtn.hide()
        deleteBtn.hide()
    
        oneLayout.hover(()=>{
            oneLayout.data("defaultLbl").show()
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.show()
            deleteBtn.show()
        },()=>{
            if(!oneLayout.data("defaultLbl").hasClass("w3-lime")) oneLayout.data("defaultLbl").hide()
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.hide()
            deleteBtn.hide()
        })
        oneLayout.on("click",()=>{
            var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
            console.log(projectInfo.defaultLayout)
            if(layoutName!=projectInfo.defaultLayout) this.setAsDefaultLayout(oneLayout)
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
        var copyBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
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

projectSettingDialog.prototype.showAsDefaultLayoutLbl=async function(oneLayoutDOM){
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.show()
    defaultLbl.text("Default")
    defaultLbl.addClass("w3-lime")
}

projectSettingDialog.prototype.showAsNotDefaultLayoutLbl=async function(oneLayoutDOM){
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.hide()
    defaultLbl.text("Set As Default")
    defaultLbl.removeClass("w3-lime")
}

projectSettingDialog.prototype.setAsDefaultLayout=async function(oneLayoutDOM){
    this.layoutsDiv.children('a').each((index,aLayout)=>{
        this.showAsNotDefaultLayoutLbl($(aLayout))
    })

    if(oneLayoutDOM==null){ //remove default layout
        var layoutName=""
    }else{
        this.showAsDefaultLayoutLbl($(oneLayoutDOM))
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
},{"../msalHelper":14,"./globalCache":17,"./simpleConfirmDialog":27}],24:[function(require,module,exports){
const globalCache = require("./globalCache")
const modelAnalyzer = require("./modelAnalyzer");

function scriptTestDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
}

scriptTestDialog.prototype.popup = async function(inputsArr,twinName,formulaTwinModel,valueTemplate) {
    this.scriptContent=""
    this.selfTwinName=twinName
    this.valueTemplate=valueTemplate
    this.DOM.show()
    this.DOM.empty()
    
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Twin Data Processing Testflight</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    this.contentDOM = $('<div class="w3-container" style="width:420px;font-size:1.2em"></div>')
    this.DOM.append(this.contentDOM)

    var twinNameLbl=this.generateNameLabel("Twin Name","10px")
    twinNameLbl.append($('<label class="w3-text-gray">'+twinName+'</label>'))
    this.contentDOM.append(twinNameLbl)

    var twinNameLbl=this.generateNameLabel("Model","10px")
    twinNameLbl.append($('<label class="w3-text-gray">'+formulaTwinModel+'</label>'))
    this.contentDOM.append(twinNameLbl)

    this.contentDOM.append(this.generateNameLabel("Inputs","10px"))
    
    var aTable=$('<table class="w3-text-gray" style="border-collapse: collapse;font-size:.8em;width:100%"></table>')
    this.contentDOM.append(aTable)
    aTable.append($('<tr><td class="w3-light-gray w3-border"></td><td class="w3-light-gray w3-border" style="font-weight:bold;text-align:center">Twin</td><td class="w3-light-gray w3-border" style="font-weight:bold;text-align:center">Property Path</td><td class="w3-light-gray w3-border" style="font-weight:bold;text-align:center">Value</td></tr>'))

    var valueEditorArr=[]
    inputsArr.forEach(oneProperty=>{
        var tr=$('<tr></tr>')
        var td0=$('<td class="w3-border" style="padding:0px 10px"><i class="fas fa-unlock"></i></td>')
        var td1=$('<td class="w3-light-gray w3-border" style="padding:0px 10px">'+oneProperty.twinName+'</td>')
        var td2=$('<td class="w3-light-gray w3-border" style="padding:0px 10px">'+oneProperty.path+'</td>')
        var td3=$('<td class="w3-border" style="padding:0px 10px"></td>')
        var valueType=this.findPropertyType(oneProperty.twinName_origin,oneProperty.path)
        var valueEdit=$('<input type="text" style="outline:none;border:none;padding:5px 0px;width:100%"  placeholder="type: ' +valueType + '"/>');
        td0.children(':first').on("click",(e)=>{
            var lockDom=$(e.target)
            if(lockDom.hasClass("fa-unlock")){lockDom.removeClass("fa-unlock");lockDom.addClass("fa-lock");lockDom.addClass("w3-text-amber")}
            else {lockDom.removeClass("fa-lock");lockDom.addClass("fa-unlock");lockDom.removeClass("w3-text-amber")}
        })
        valueEditorArr.push({"type":valueType,"editor":valueEdit,"lockIcon":td0.children(':first')
            ,"twinName":oneProperty.twinName_origin
            ,"inputPath":oneProperty.path
        })
        aTable.append(tr.append(td0,td1,td2,td3))
        td3.append(valueEdit)
    })

    var randomInputBtn = $('<button class="w3-ripple w3-card w3-margin-right w3-light-gray w3-button w3-hover-pink w3-margin-top w3-margin-bottom">Generate Random Input & Execute</button>')

    randomInputBtn.on("click",()=>{
        valueEditorArr.forEach(ele=>{
            if(ele.lockIcon.hasClass("fa-lock")) return;
            var dataType=ele.type
            var theEditor=ele.editor
            theEditor.val(this.generateRandomValue(dataType))
        })

        //do execute automatically
        this.testFlight(valueEditorArr)
    })


    var executeScriptBtn = $('<button class="w3-ripple w3-card w3-button w3-amber w3-hover-pink w3-margin-top w3-margin-bottom">Execute</button>')
    executeScriptBtn.on("click",()=>{this.testFlight(valueEditorArr)})
    this.contentDOM.append(randomInputBtn,executeScriptBtn)

    var lbl1=$('<label class="w3-text-amber" style="font-style: italic;font-size:11px;display:block">You can still change the calculation script in the infomration panel and test the modified script immediately</label>')
    this.contentDOM.append(lbl1)

    var resultDiv=$('<div style="width:100%;height:140px;padding:5px"/>').addClass("w3-light-gray w3-text-gray w3-border w3-margin-bottom");
    resultDiv.text("Calculation result...")
    this.contentDOM.append(resultDiv)
    this.resultDiv=resultDiv
}

scriptTestDialog.prototype.testFlight=function(valueEditorArr){
    var _self=JSON.parse(JSON.stringify(this.valueTemplate))
    var _twinVal={}
    
    valueEditorArr.forEach(ele=>{
        var obj=null
        if(ele.twinName!=this.selfTwinName){
            _twinVal[ele.twinName]={}
            obj=_twinVal[ele.twinName]
        }else{
            obj=_self
        }
        var rootObj=obj
        for(var i=0;i<ele.inputPath.length-1;i++){
            var pname=ele.inputPath[i]
            if(rootObj[pname]==null) rootObj[pname]={}
            rootObj=rootObj[pname]
        }
        var originVal=ele.editor.val()
        if(ele.type=="boolean") var theVal= (originVal === 'true')
        else if(ele.type=="double"||ele.type=="float"||ele.type=="integer"||ele.type=="long") theVal=parseFloat(originVal)
        else theVal=originVal
        rootObj[ele.inputPath[ele.inputPath.length-1]]=theVal
    })

    this.resultDiv.empty()
    try{
        var evalStr=this.scriptContent+"\n_self"
        var result=eval(evalStr) // jshint ignore:line
        this.resultDiv.append($('<pre style="margin:0px;font-size:11px" id="json">'+JSON.stringify(result,null,2)+'</pre>')) 
    }catch(e){
        this.resultDiv.append($('<pre style="margin:0px;font-size:11px" id="json">'+e+'</pre>'))
    }
}

scriptTestDialog.prototype.generateRandomValue=function(dataType){
    var randData=Math.random()
    if(dataType=="boolean"){
        return (randData>0.5)
    }else if(dataType=="dateTime"){
        return new Date().toISOString()
    }else if(dataType=="date"){
        return (new Date().toISOString()).split("T")[0]
    }else if(dataType=="time"){
        return ("T"+((new Date().toISOString()).split("T")[1]))
    }else if(dataType=="double" || dataType=="float"){
        return parseFloat((randData*100).toFixed(1))
    }else if(dataType=="integer" || dataType=="long"){
        return parseInt(randData*100)
    }else{
        return null
    }
}

scriptTestDialog.prototype.findPropertyType=function(twinName,propertyPath){
    var dbtwin=globalCache.getSingleDBTwinByName(twinName)
    var modelID=dbtwin["modelID"]
    var editableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    var theType=editableProperties
    for(var i=0;i<propertyPath.length;i++){
        var ele=propertyPath[i]
        if(theType[ele]) theType=theType[ele]
        else return null
    }
    return theType
}


scriptTestDialog.prototype.generateNameLabel=function(str,paddingTop){
    var keyDiv = $("<div><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+str+"</div></div>")
    keyDiv.css("padding-top",paddingTop)
    return keyDiv
}

module.exports = new scriptTestDialog();
},{"./globalCache":17,"./modelAnalyzer":18}],25:[function(require,module,exports){
const msalHelper=require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache");

function serviceWorkerHelper(){
    this.projectID=null
    this.listAllLiveMonitor={}
    setInterval(()=>{
        if(this.projectID==null) return;
        this.subscribeImportantEvent(this.projectID)

        for(var ind in this.listAllLiveMonitor){
            var aLiveProperty=this.listAllLiveMonitor[ind]
            this.subscribeLiveProperty(aLiveProperty.twinID,aLiveProperty.propertyPath)
        }

    },8*60*1000) //every 8 minute renew the service worker subscription
}

serviceWorkerHelper.prototype.subscribeImportantEvent = async function (projectID) {    
    var subscription=await this.createSubscription()
    if(subscription==null) return;
    try {
        var payload={
            type:'events',
            serviceWorkerSubscription:JSON.stringify(subscription)
        }
        msalHelper.callAPI("digitaltwin/serviceWorkerSubscription", "POST", payload, "withProjectID")
    } catch (e) {
        console.log(e)
    }
}

serviceWorkerHelper.prototype.subscribeLiveProperty = async function (twinID,propertyPath) {    
    var subscription=await this.createSubscription()
    if(subscription==null) return;
    try {
        var payload={
            type:'propertyValue',
            serviceWorkerSubscription:JSON.stringify(subscription),
            twinID:twinID,
            propertyPath:propertyPath
        }
        msalHelper.callAPI("digitaltwin/serviceWorkerSubscription", "POST", payload, "withProjectID")
    } catch (e) {
        console.log(e)
    }
}

serviceWorkerHelper.prototype.createSubscription = async function () {
    if (!('serviceWorker' in navigator)) return null;
    //this public key should be the one used in backend server side for pushing message (in azureiotrocksfunction)
    const publicVapidKey = 'BCxvFqk0czIkCTblAMy80fMWTj2WaAkeXCyp98-S2MiVrTL59u046eLRrTBImo9ZCWAQ3Yqj_7PwEOuyhDmC-WY';
    var subscription = null
    try {
        const registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
        navigator.serviceWorker.onmessage = (e)=> {
            this.processLiveMessage(e.data)
            this.broadcastMessage({ "message": "liveData","body":e.data })
        };
    } catch (e) {
        console.log(e)
    }
    return subscription;
}

serviceWorkerHelper.prototype.processLiveMessage=function(msgBody){
    console.log(msgBody)
    if(msgBody.connectionState && msgBody.projectID==globalCache.currentProjectID){
        var twinID=msgBody.twinID
        var twinDBInfo=globalCache.DBTwins[twinID]
        if(msgBody.connectionState=="deviceConnected") twinDBInfo.connectState=true
        else twinDBInfo.connectState=false
        //console.log(msgBody)
    }
}

serviceWorkerHelper.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        for(var ind in this.listAllLiveMonitor) delete this.listAllLiveMonitor[ind]
        this.projectID=msgPayload.projectID
        this.subscribeImportantEvent(msgPayload.projectID)
    }else if(msgPayload.message=="addLiveMonitor"){
        var str=msgPayload.twinID+"."+msgPayload.propertyPath.join(".")
        this.listAllLiveMonitor[str]=msgPayload
        this.subscribeLiveProperty(msgPayload.twinID,msgPayload.propertyPath)
    }else if(msgPayload.message=="removeLiveMonitor"){
        var str=msgPayload.twinID+"."+msgPayload.propertyPath.join(".")
        delete this.listAllLiveMonitor[str]
    }
}

module.exports = new serviceWorkerHelper();
},{"../msalHelper":14,"../sharedSourceFiles/globalCache":17}],26:[function(require,module,exports){
function simpleChart(parentDom,xLength,cssOptions,customDrawing){
    if(customDrawing){
        customDrawing(parentDom)
    }
    this.canvas = $('<canvas></canvas>')
    this.canvas.css(cssOptions)
    parentDom.append(this.canvas)
    
    this.chart=new Chart(this.canvas, {
        type: "line",
        data: {
            labels: [],
            datasets: [{stepped:true, data: []}]
        },
        options: {
            animation: false,
            datasets: {
                line: {
                    spanGaps:true,
                    borderColor: "rgba(0,0,255,0.7)",
                    borderWidth:1,
                    pointRadius:0
                }
            },
            plugins:{
                legend: { display: false },
                tooltip:{enabled:false}
            },
            scales: {
                x:{grid:{display:false},ticks:{display:false}}
                ,y:{grid:{tickLength:0},ticks:{font:{size:9}}}
                ,x2: {position:'top',grid:{display:false},ticks:{display:false}}
                ,y2: {position:'right',grid:{display:false},ticks:{display:false}}     
            }
            
        }
    });
    this.setXLength(xLength)

    /*
    var newV=1
    setInterval(()=>{
        var dataArr=theChart.data.datasets[0].data
        var len=dataArr.length
        var passedTime= parseInt(Math.random()*10)
        for(var i=0;i<passedTime;i++) dataArr.shift()
        dataArr[len-1]=newV
        newV=1-newV
        theChart.update()
    },500)
    */
}

simpleChart.prototype.addDataValue=function(dataIndex,value){
    var dataArr=this.chart.data.datasets[0].data

    var totalPoints=dataArr.length

    if(this.lastDataIndex==null) this.lastDataIndex=dataIndex-1
    if(dataIndex<this.lastDataIndex){
        if(this.lastDataIndex-dataIndex>=totalPoints) return; //ignore receiving too old points
        var diff=this.lastDataIndex - dataIndex
        dataArr[totalPoints-1-diff]=value
    }else{
        var numOfPassedPoints=dataIndex-this.lastDataIndex
        dataArr=dataArr.slice(numOfPassedPoints)
        dataArr[totalPoints-1]=value
    }
    this.chart.data.datasets[0].data=dataArr
    this.chart.update()

    this.lastDataIndex=dataIndex
}

simpleChart.prototype.setXLength=function(xlen){
    var labels=this.chart.data.labels
    labels.length=0
    for(var i=0;i<xlen;i++) labels.push(i)
    //shorten or expand the length of data array
    var dataArr=this.chart.data.datasets[0].data
    if(dataArr.length>xlen) dataArr=dataArr.slice(dataArr.length-xlen)
    else if(dataArr.length<xlen){
        var numberToAdd=xlen-dataArr.length
        var tmpArr=[]
        tmpArr[numberToAdd-1]=null
        dataArr=tmpArr.concat(dataArr)
    }
    this.chart.data.datasets[0].data=dataArr
    this.chart.update()
}

simpleChart.prototype.destroy=function(){
    this.canvas.remove()
}

module.exports = simpleChart;
},{}],27:[function(require,module,exports){
const globalCache=require('./globalCache')
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    globalCache.makeDOMDraggable(this.DOM)
    //this.DOM.css("overflow","hidden")
}

simpleConfirmDialog.prototype.show=function(cssOptions,otherOptions){
    this.DOM.css(cssOptions)
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">' + otherOptions.title + '</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.close() })

    var dialogDiv=$('<div class="w3-container" style="margin-top:10px;margin-bottom:10px"></div>')
    if(otherOptions.customDrawing){
        otherOptions.customDrawing(dialogDiv)
    }else{
        dialogDiv.text(otherOptions.content)
    }
    this.DOM.append(dialogDiv)
    this.dialogDiv=dialogDiv

    this.bottomBar=$('<div class="w3-bar"></div>')
    this.DOM.append(this.bottomBar)

    otherOptions.buttons.forEach(btn=>{
        var aButton=$('<button class="w3-ripple w3-button w3-right '+(btn.colorClass||"")+'" style="margin-right:2px;margin-left:2px">'+btn.text+'</button>')
        aButton.on("click",()=> { btn.clickFunc()  }  )
        this.bottomBar.append(aButton)    
    })
    $("body").append(this.DOM)
}

simpleConfirmDialog.prototype.close=function(){
    this.DOM.remove()
}

module.exports = simpleConfirmDialog;
},{"./globalCache":17}],28:[function(require,module,exports){
function simpleExpandableSection(titleStr,parentDOM,options) {
    this.expandStatus=false
    options=options||{}
    var marginTop=10
    if(options.marginTop!=null) marginTop=options.marginTop
    this.headerDOM = $(`<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom w3-hover-amber w3-text-gray" style="margin-top:${marginTop}px;font-weight:bold"><a>${titleStr}</a><i class="w3-margin-left fas fa-caret-up"></i></button>`)
    this.listDOM = $('<div class="w3-container w3-hide" style="padding-top:2px"></div>')

    this.headerTextDOM=this.headerDOM.children(":first")

    this.triangle=this.headerDOM.children('i').eq(0)
    parentDOM.append(this.headerDOM, this.listDOM)
    this.headerDOM.on("click", (evt) => {
        if(this.expandStatus) this.shrink()
        else this.expand()
        this.callBack_change(this.expandStatus)
        return false;
    });
    this.callBack_change=(status)=>{}
}

simpleExpandableSection.prototype.expand=function(){
    this.listDOM.addClass("w3-show")
    this.triangle.addClass("fa-caret-down")
    this.triangle.removeClass("fa-caret-up")
    this.expandStatus = true
}

simpleExpandableSection.prototype.shrink=function(){
    this.listDOM.removeClass("w3-show")
    this.triangle.removeClass("fa-caret-down")
    this.triangle.addClass("fa-caret-up")
    this.expandStatus = false
}

module.exports = simpleExpandableSection;
},{}],29:[function(require,module,exports){
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
    if(options.optionListHeight) this.optionContentDOM.css({"max-height":options.optionListHeight+"px","overflow-y":"auto","overflow-x":"visible"})
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
    var optionItem=$('<a href="#" class="w3-bar-item w3-button" style="white-space:nowrap">'+optionText+'</a>')
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
},{}],30:[function(require,module,exports){
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

    var nameDiv=$("<label style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></label>")
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8uLi8uLi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYmFzZTY0LWpzL2luZGV4LmpzIiwiLi4vLi4vLi4vLi4vLi4vLi4vQXBwRGF0YS9Sb2FtaW5nL25wbS9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9pZWVlNzU0L2luZGV4LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9mbG9hdEluZm9XaW5kb3cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2luZm9QYW5lbC5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbWFpblRvb2xiYXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21hcERPTS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvc3RhcnRTZWxlY3Rpb25EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3RvcG9sb2d5RE9NLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS90d2luc1RyZWUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tc2FsSGVscGVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9iYXNlSW5mb1BhbmVsLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9lZGl0UHJvamVjdERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbmV3VHdpbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvcHJvamVjdFNldHRpbmdEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NjcmlwdFRlc3REaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NlcnZpY2VXb3JrZXJIZWxwZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNoYXJ0LmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVFeHBhbmRhYmxlU2VjdGlvbi5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN3dEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9XQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcm9CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsT0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0V0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCdcblxuZXhwb3J0cy5ieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aFxuZXhwb3J0cy50b0J5dGVBcnJheSA9IHRvQnl0ZUFycmF5XG5leHBvcnRzLmZyb21CeXRlQXJyYXkgPSBmcm9tQnl0ZUFycmF5XG5cbnZhciBsb29rdXAgPSBbXVxudmFyIHJldkxvb2t1cCA9IFtdXG52YXIgQXJyID0gdHlwZW9mIFVpbnQ4QXJyYXkgIT09ICd1bmRlZmluZWQnID8gVWludDhBcnJheSA6IEFycmF5XG5cbnZhciBjb2RlID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nXG5mb3IgKHZhciBpID0gMCwgbGVuID0gY29kZS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICBsb29rdXBbaV0gPSBjb2RlW2ldXG4gIHJldkxvb2t1cFtjb2RlLmNoYXJDb2RlQXQoaSldID0gaVxufVxuXG4vLyBTdXBwb3J0IGRlY29kaW5nIFVSTC1zYWZlIGJhc2U2NCBzdHJpbmdzLCBhcyBOb2RlLmpzIGRvZXMuXG4vLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NCNVUkxfYXBwbGljYXRpb25zXG5yZXZMb29rdXBbJy0nLmNoYXJDb2RlQXQoMCldID0gNjJcbnJldkxvb2t1cFsnXycuY2hhckNvZGVBdCgwKV0gPSA2M1xuXG5mdW5jdGlvbiBnZXRMZW5zIChiNjQpIHtcbiAgdmFyIGxlbiA9IGI2NC5sZW5ndGhcblxuICBpZiAobGVuICUgNCA+IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc3RyaW5nLiBMZW5ndGggbXVzdCBiZSBhIG11bHRpcGxlIG9mIDQnKVxuICB9XG5cbiAgLy8gVHJpbSBvZmYgZXh0cmEgYnl0ZXMgYWZ0ZXIgcGxhY2Vob2xkZXIgYnl0ZXMgYXJlIGZvdW5kXG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2JlYXRnYW1taXQvYmFzZTY0LWpzL2lzc3Vlcy80MlxuICB2YXIgdmFsaWRMZW4gPSBiNjQuaW5kZXhPZignPScpXG4gIGlmICh2YWxpZExlbiA9PT0gLTEpIHZhbGlkTGVuID0gbGVuXG5cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IHZhbGlkTGVuID09PSBsZW5cbiAgICA/IDBcbiAgICA6IDQgLSAodmFsaWRMZW4gJSA0KVxuXG4gIHJldHVybiBbdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbl1cbn1cblxuLy8gYmFzZTY0IGlzIDQvMyArIHVwIHRvIHR3byBjaGFyYWN0ZXJzIG9mIHRoZSBvcmlnaW5hbCBkYXRhXG5mdW5jdGlvbiBieXRlTGVuZ3RoIChiNjQpIHtcbiAgdmFyIGxlbnMgPSBnZXRMZW5zKGI2NClcbiAgdmFyIHZhbGlkTGVuID0gbGVuc1swXVxuICB2YXIgcGxhY2VIb2xkZXJzTGVuID0gbGVuc1sxXVxuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gX2J5dGVMZW5ndGggKGI2NCwgdmFsaWRMZW4sIHBsYWNlSG9sZGVyc0xlbikge1xuICByZXR1cm4gKCh2YWxpZExlbiArIHBsYWNlSG9sZGVyc0xlbikgKiAzIC8gNCkgLSBwbGFjZUhvbGRlcnNMZW5cbn1cblxuZnVuY3Rpb24gdG9CeXRlQXJyYXkgKGI2NCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cblxuICB2YXIgYXJyID0gbmV3IEFycihfYnl0ZUxlbmd0aChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pKVxuXG4gIHZhciBjdXJCeXRlID0gMFxuXG4gIC8vIGlmIHRoZXJlIGFyZSBwbGFjZWhvbGRlcnMsIG9ubHkgZ2V0IHVwIHRvIHRoZSBsYXN0IGNvbXBsZXRlIDQgY2hhcnNcbiAgdmFyIGxlbiA9IHBsYWNlSG9sZGVyc0xlbiA+IDBcbiAgICA/IHZhbGlkTGVuIC0gNFxuICAgIDogdmFsaWRMZW5cblxuICB2YXIgaVxuICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTgpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCAxMikgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMildIDw8IDYpIHxcbiAgICAgIHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMyldXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDE2KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICBpZiAocGxhY2VIb2xkZXJzTGVuID09PSAyKSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA+PiA0KVxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMSkge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAxMCkgfFxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpICsgMSldIDw8IDQpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA+PiAyKVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiA4KSAmIDB4RkZcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBhcnJcbn1cblxuZnVuY3Rpb24gdHJpcGxldFRvQmFzZTY0IChudW0pIHtcbiAgcmV0dXJuIGxvb2t1cFtudW0gPj4gMTggJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiAxMiAmIDB4M0ZdICtcbiAgICBsb29rdXBbbnVtID4+IDYgJiAweDNGXSArXG4gICAgbG9va3VwW251bSAmIDB4M0ZdXG59XG5cbmZ1bmN0aW9uIGVuY29kZUNodW5rICh1aW50OCwgc3RhcnQsIGVuZCkge1xuICB2YXIgdG1wXG4gIHZhciBvdXRwdXQgPSBbXVxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkgKz0gMykge1xuICAgIHRtcCA9XG4gICAgICAoKHVpbnQ4W2ldIDw8IDE2KSAmIDB4RkYwMDAwKSArXG4gICAgICAoKHVpbnQ4W2kgKyAxXSA8PCA4KSAmIDB4RkYwMCkgK1xuICAgICAgKHVpbnQ4W2kgKyAyXSAmIDB4RkYpXG4gICAgb3V0cHV0LnB1c2godHJpcGxldFRvQmFzZTY0KHRtcCkpXG4gIH1cbiAgcmV0dXJuIG91dHB1dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBmcm9tQnl0ZUFycmF5ICh1aW50OCkge1xuICB2YXIgdG1wXG4gIHZhciBsZW4gPSB1aW50OC5sZW5ndGhcbiAgdmFyIGV4dHJhQnl0ZXMgPSBsZW4gJSAzIC8vIGlmIHdlIGhhdmUgMSBieXRlIGxlZnQsIHBhZCAyIGJ5dGVzXG4gIHZhciBwYXJ0cyA9IFtdXG4gIHZhciBtYXhDaHVua0xlbmd0aCA9IDE2MzgzIC8vIG11c3QgYmUgbXVsdGlwbGUgb2YgM1xuXG4gIC8vIGdvIHRocm91Z2ggdGhlIGFycmF5IGV2ZXJ5IHRocmVlIGJ5dGVzLCB3ZSdsbCBkZWFsIHdpdGggdHJhaWxpbmcgc3R1ZmYgbGF0ZXJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbjIgPSBsZW4gLSBleHRyYUJ5dGVzOyBpIDwgbGVuMjsgaSArPSBtYXhDaHVua0xlbmd0aCkge1xuICAgIHBhcnRzLnB1c2goZW5jb2RlQ2h1bmsodWludDgsIGksIChpICsgbWF4Q2h1bmtMZW5ndGgpID4gbGVuMiA/IGxlbjIgOiAoaSArIG1heENodW5rTGVuZ3RoKSkpXG4gIH1cblxuICAvLyBwYWQgdGhlIGVuZCB3aXRoIHplcm9zLCBidXQgbWFrZSBzdXJlIHRvIG5vdCBmb3JnZXQgdGhlIGV4dHJhIGJ5dGVzXG4gIGlmIChleHRyYUJ5dGVzID09PSAxKSB7XG4gICAgdG1wID0gdWludDhbbGVuIC0gMV1cbiAgICBwYXJ0cy5wdXNoKFxuICAgICAgbG9va3VwW3RtcCA+PiAyXSArXG4gICAgICBsb29rdXBbKHRtcCA8PCA0KSAmIDB4M0ZdICtcbiAgICAgICc9PSdcbiAgICApXG4gIH0gZWxzZSBpZiAoZXh0cmFCeXRlcyA9PT0gMikge1xuICAgIHRtcCA9ICh1aW50OFtsZW4gLSAyXSA8PCA4KSArIHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMTBdICtcbiAgICAgIGxvb2t1cFsodG1wID4+IDQpICYgMHgzRl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgMikgJiAweDNGXSArXG4gICAgICAnPSdcbiAgICApXG4gIH1cblxuICByZXR1cm4gcGFydHMuam9pbignJylcbn1cbiIsIi8qIVxuICogVGhlIGJ1ZmZlciBtb2R1bGUgZnJvbSBub2RlLmpzLCBmb3IgdGhlIGJyb3dzZXIuXG4gKlxuICogQGF1dGhvciAgIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZz5cbiAqIEBsaWNlbnNlICBNSVRcbiAqL1xuLyogZXNsaW50LWRpc2FibGUgbm8tcHJvdG8gKi9cblxuJ3VzZSBzdHJpY3QnXG5cbnZhciBiYXNlNjQgPSByZXF1aXJlKCdiYXNlNjQtanMnKVxudmFyIGllZWU3NTQgPSByZXF1aXJlKCdpZWVlNzU0JylcblxuZXhwb3J0cy5CdWZmZXIgPSBCdWZmZXJcbmV4cG9ydHMuU2xvd0J1ZmZlciA9IFNsb3dCdWZmZXJcbmV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVMgPSA1MFxuXG52YXIgS19NQVhfTEVOR1RIID0gMHg3ZmZmZmZmZlxuZXhwb3J0cy5rTWF4TGVuZ3RoID0gS19NQVhfTEVOR1RIXG5cbi8qKlxuICogSWYgYEJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUYDpcbiAqICAgPT09IHRydWUgICAgVXNlIFVpbnQ4QXJyYXkgaW1wbGVtZW50YXRpb24gKGZhc3Rlc3QpXG4gKiAgID09PSBmYWxzZSAgIFByaW50IHdhcm5pbmcgYW5kIHJlY29tbWVuZCB1c2luZyBgYnVmZmVyYCB2NC54IHdoaWNoIGhhcyBhbiBPYmplY3RcbiAqICAgICAgICAgICAgICAgaW1wbGVtZW50YXRpb24gKG1vc3QgY29tcGF0aWJsZSwgZXZlbiBJRTYpXG4gKlxuICogQnJvd3NlcnMgdGhhdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBhcmUgSUUgMTArLCBGaXJlZm94IDQrLCBDaHJvbWUgNyssIFNhZmFyaSA1LjErLFxuICogT3BlcmEgMTEuNissIGlPUyA0LjIrLlxuICpcbiAqIFdlIHJlcG9ydCB0aGF0IHRoZSBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdHlwZWQgYXJyYXlzIGlmIHRoZSBhcmUgbm90IHN1YmNsYXNzYWJsZVxuICogdXNpbmcgX19wcm90b19fLiBGaXJlZm94IDQtMjkgbGFja3Mgc3VwcG9ydCBmb3IgYWRkaW5nIG5ldyBwcm9wZXJ0aWVzIHRvIGBVaW50OEFycmF5YFxuICogKFNlZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9Njk1NDM4KS4gSUUgMTAgbGFja3Mgc3VwcG9ydFxuICogZm9yIF9fcHJvdG9fXyBhbmQgaGFzIGEgYnVnZ3kgdHlwZWQgYXJyYXkgaW1wbGVtZW50YXRpb24uXG4gKi9cbkJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUID0gdHlwZWRBcnJheVN1cHBvcnQoKVxuXG5pZiAoIUJ1ZmZlci5UWVBFRF9BUlJBWV9TVVBQT1JUICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJlxuICAgIHR5cGVvZiBjb25zb2xlLmVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gIGNvbnNvbGUuZXJyb3IoXG4gICAgJ1RoaXMgYnJvd3NlciBsYWNrcyB0eXBlZCBhcnJheSAoVWludDhBcnJheSkgc3VwcG9ydCB3aGljaCBpcyByZXF1aXJlZCBieSAnICtcbiAgICAnYGJ1ZmZlcmAgdjUueC4gVXNlIGBidWZmZXJgIHY0LnggaWYgeW91IHJlcXVpcmUgb2xkIGJyb3dzZXIgc3VwcG9ydC4nXG4gIClcbn1cblxuZnVuY3Rpb24gdHlwZWRBcnJheVN1cHBvcnQgKCkge1xuICAvLyBDYW4gdHlwZWQgYXJyYXkgaW5zdGFuY2VzIGNhbiBiZSBhdWdtZW50ZWQ/XG4gIHRyeSB7XG4gICAgdmFyIGFyciA9IG5ldyBVaW50OEFycmF5KDEpXG4gICAgYXJyLl9fcHJvdG9fXyA9IHsgX19wcm90b19fOiBVaW50OEFycmF5LnByb3RvdHlwZSwgZm9vOiBmdW5jdGlvbiAoKSB7IHJldHVybiA0MiB9IH1cbiAgICByZXR1cm4gYXJyLmZvbygpID09PSA0MlxuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KEJ1ZmZlci5wcm90b3R5cGUsICdwYXJlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIGlmICghQnVmZmVyLmlzQnVmZmVyKHRoaXMpKSByZXR1cm4gdW5kZWZpbmVkXG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyXG4gIH1cbn0pXG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAnb2Zmc2V0Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ5dGVPZmZzZXRcbiAgfVxufSlcblxuZnVuY3Rpb24gY3JlYXRlQnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKGxlbmd0aCA+IEtfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgbGVuZ3RoICsgJ1wiIGlzIGludmFsaWQgZm9yIG9wdGlvbiBcInNpemVcIicpXG4gIH1cbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgdmFyIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGxlbmd0aClcbiAgYnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIGJ1ZlxufVxuXG4vKipcbiAqIFRoZSBCdWZmZXIgY29uc3RydWN0b3IgcmV0dXJucyBpbnN0YW5jZXMgb2YgYFVpbnQ4QXJyYXlgIHRoYXQgaGF2ZSB0aGVpclxuICogcHJvdG90eXBlIGNoYW5nZWQgdG8gYEJ1ZmZlci5wcm90b3R5cGVgLiBGdXJ0aGVybW9yZSwgYEJ1ZmZlcmAgaXMgYSBzdWJjbGFzcyBvZlxuICogYFVpbnQ4QXJyYXlgLCBzbyB0aGUgcmV0dXJuZWQgaW5zdGFuY2VzIHdpbGwgaGF2ZSBhbGwgdGhlIG5vZGUgYEJ1ZmZlcmAgbWV0aG9kc1xuICogYW5kIHRoZSBgVWludDhBcnJheWAgbWV0aG9kcy4gU3F1YXJlIGJyYWNrZXQgbm90YXRpb24gd29ya3MgYXMgZXhwZWN0ZWQgLS0gaXRcbiAqIHJldHVybnMgYSBzaW5nbGUgb2N0ZXQuXG4gKlxuICogVGhlIGBVaW50OEFycmF5YCBwcm90b3R5cGUgcmVtYWlucyB1bm1vZGlmaWVkLlxuICovXG5cbmZ1bmN0aW9uIEJ1ZmZlciAoYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgLy8gQ29tbW9uIGNhc2UuXG4gIGlmICh0eXBlb2YgYXJnID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0eXBlb2YgZW5jb2RpbmdPck9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgc3RyaW5nLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICAgIClcbiAgICB9XG4gICAgcmV0dXJuIGFsbG9jVW5zYWZlKGFyZylcbiAgfVxuICByZXR1cm4gZnJvbShhcmcsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbn1cblxuLy8gRml4IHN1YmFycmF5KCkgaW4gRVMyMDE2LiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvOTdcbmlmICh0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wuc3BlY2llcyAhPSBudWxsICYmXG4gICAgQnVmZmVyW1N5bWJvbC5zcGVjaWVzXSA9PT0gQnVmZmVyKSB7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIsIFN5bWJvbC5zcGVjaWVzLCB7XG4gICAgdmFsdWU6IG51bGwsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgIHdyaXRhYmxlOiBmYWxzZVxuICB9KVxufVxuXG5CdWZmZXIucG9vbFNpemUgPSA4MTkyIC8vIG5vdCB1c2VkIGJ5IHRoaXMgaW1wbGVtZW50YXRpb25cblxuZnVuY3Rpb24gZnJvbSAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBmcm9tU3RyaW5nKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0KVxuICB9XG5cbiAgaWYgKEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZSh2YWx1ZSlcbiAgfVxuXG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgdGhyb3cgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICAgJ29yIEFycmF5LWxpa2UgT2JqZWN0LiBSZWNlaXZlZCB0eXBlICcgKyAodHlwZW9mIHZhbHVlKVxuICAgIClcbiAgfVxuXG4gIGlmIChpc0luc3RhbmNlKHZhbHVlLCBBcnJheUJ1ZmZlcikgfHxcbiAgICAgICh2YWx1ZSAmJiBpc0luc3RhbmNlKHZhbHVlLmJ1ZmZlciwgQXJyYXlCdWZmZXIpKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlCdWZmZXIodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJ2YWx1ZVwiIGFyZ3VtZW50IG11c3Qgbm90IGJlIG9mIHR5cGUgbnVtYmVyLiBSZWNlaXZlZCB0eXBlIG51bWJlcidcbiAgICApXG4gIH1cblxuICB2YXIgdmFsdWVPZiA9IHZhbHVlLnZhbHVlT2YgJiYgdmFsdWUudmFsdWVPZigpXG4gIGlmICh2YWx1ZU9mICE9IG51bGwgJiYgdmFsdWVPZiAhPT0gdmFsdWUpIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odmFsdWVPZiwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxuICB9XG5cbiAgdmFyIGIgPSBmcm9tT2JqZWN0KHZhbHVlKVxuICBpZiAoYikgcmV0dXJuIGJcblxuICBpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvUHJpbWl0aXZlICE9IG51bGwgJiZcbiAgICAgIHR5cGVvZiB2YWx1ZVtTeW1ib2wudG9QcmltaXRpdmVdID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKFxuICAgICAgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSgnc3RyaW5nJyksIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aFxuICAgIClcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgJ1RoZSBmaXJzdCBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBBcnJheUJ1ZmZlciwgQXJyYXksICcgK1xuICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgKVxufVxuXG4vKipcbiAqIEZ1bmN0aW9uYWxseSBlcXVpdmFsZW50IHRvIEJ1ZmZlcihhcmcsIGVuY29kaW5nKSBidXQgdGhyb3dzIGEgVHlwZUVycm9yXG4gKiBpZiB2YWx1ZSBpcyBhIG51bWJlci5cbiAqIEJ1ZmZlci5mcm9tKHN0clssIGVuY29kaW5nXSlcbiAqIEJ1ZmZlci5mcm9tKGFycmF5KVxuICogQnVmZmVyLmZyb20oYnVmZmVyKVxuICogQnVmZmVyLmZyb20oYXJyYXlCdWZmZXJbLCBieXRlT2Zmc2V0WywgbGVuZ3RoXV0pXG4gKiovXG5CdWZmZXIuZnJvbSA9IGZ1bmN0aW9uICh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBmcm9tKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIE5vdGU6IENoYW5nZSBwcm90b3R5cGUgKmFmdGVyKiBCdWZmZXIuZnJvbSBpcyBkZWZpbmVkIHRvIHdvcmthcm91bmQgQ2hyb21lIGJ1Zzpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL3B1bGwvMTQ4XG5CdWZmZXIucHJvdG90eXBlLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXkucHJvdG90eXBlXG5CdWZmZXIuX19wcm90b19fID0gVWludDhBcnJheVxuXG5mdW5jdGlvbiBhc3NlcnRTaXplIChzaXplKSB7XG4gIGlmICh0eXBlb2Ygc2l6ZSAhPT0gJ251bWJlcicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcInNpemVcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgbnVtYmVyJylcbiAgfSBlbHNlIGlmIChzaXplIDwgMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdUaGUgdmFsdWUgXCInICsgc2l6ZSArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG59XG5cbmZ1bmN0aW9uIGFsbG9jIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICBhc3NlcnRTaXplKHNpemUpXG4gIGlmIChzaXplIDw9IDApIHtcbiAgICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG4gIH1cbiAgaWYgKGZpbGwgIT09IHVuZGVmaW5lZCkge1xuICAgIC8vIE9ubHkgcGF5IGF0dGVudGlvbiB0byBlbmNvZGluZyBpZiBpdCdzIGEgc3RyaW5nLiBUaGlzXG4gICAgLy8gcHJldmVudHMgYWNjaWRlbnRhbGx5IHNlbmRpbmcgaW4gYSBudW1iZXIgdGhhdCB3b3VsZFxuICAgIC8vIGJlIGludGVycHJldHRlZCBhcyBhIHN0YXJ0IG9mZnNldC5cbiAgICByZXR1cm4gdHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJ1xuICAgICAgPyBjcmVhdGVCdWZmZXIoc2l6ZSkuZmlsbChmaWxsLCBlbmNvZGluZylcbiAgICAgIDogY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbClcbiAgfVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUpXG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBmaWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogYWxsb2Moc2l6ZVssIGZpbGxbLCBlbmNvZGluZ11dKVxuICoqL1xuQnVmZmVyLmFsbG9jID0gZnVuY3Rpb24gKHNpemUsIGZpbGwsIGVuY29kaW5nKSB7XG4gIHJldHVybiBhbGxvYyhzaXplLCBmaWxsLCBlbmNvZGluZylcbn1cblxuZnVuY3Rpb24gYWxsb2NVbnNhZmUgKHNpemUpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICByZXR1cm4gY3JlYXRlQnVmZmVyKHNpemUgPCAwID8gMCA6IGNoZWNrZWQoc2l6ZSkgfCAwKVxufVxuXG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gQnVmZmVyKG51bSksIGJ5IGRlZmF1bHQgY3JlYXRlcyBhIG5vbi16ZXJvLWZpbGxlZCBCdWZmZXIgaW5zdGFuY2UuXG4gKiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG4vKipcbiAqIEVxdWl2YWxlbnQgdG8gU2xvd0J1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICovXG5CdWZmZXIuYWxsb2NVbnNhZmVTbG93ID0gZnVuY3Rpb24gKHNpemUpIHtcbiAgcmV0dXJuIGFsbG9jVW5zYWZlKHNpemUpXG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcgKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycgfHwgZW5jb2RpbmcgPT09ICcnKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgfVxuXG4gIGlmICghQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICB9XG5cbiAgdmFyIGxlbmd0aCA9IGJ5dGVMZW5ndGgoc3RyaW5nLCBlbmNvZGluZykgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuXG4gIHZhciBhY3R1YWwgPSBidWYud3JpdGUoc3RyaW5nLCBlbmNvZGluZylcblxuICBpZiAoYWN0dWFsICE9PSBsZW5ndGgpIHtcbiAgICAvLyBXcml0aW5nIGEgaGV4IHN0cmluZywgZm9yIGV4YW1wbGUsIHRoYXQgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzIHdpbGxcbiAgICAvLyBjYXVzZSBldmVyeXRoaW5nIGFmdGVyIHRoZSBmaXJzdCBpbnZhbGlkIGNoYXJhY3RlciB0byBiZSBpZ25vcmVkLiAoZS5nLlxuICAgIC8vICdhYnh4Y2QnIHdpbGwgYmUgdHJlYXRlZCBhcyAnYWInKVxuICAgIGJ1ZiA9IGJ1Zi5zbGljZSgwLCBhY3R1YWwpXG4gIH1cblxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUxpa2UgKGFycmF5KSB7XG4gIHZhciBsZW5ndGggPSBhcnJheS5sZW5ndGggPCAwID8gMCA6IGNoZWNrZWQoYXJyYXkubGVuZ3RoKSB8IDBcbiAgdmFyIGJ1ZiA9IGNyZWF0ZUJ1ZmZlcihsZW5ndGgpXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpICs9IDEpIHtcbiAgICBidWZbaV0gPSBhcnJheVtpXSAmIDI1NVxuICB9XG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbUFycmF5QnVmZmVyIChhcnJheSwgYnl0ZU9mZnNldCwgbGVuZ3RoKSB7XG4gIGlmIChieXRlT2Zmc2V0IDwgMCB8fCBhcnJheS5ieXRlTGVuZ3RoIDwgYnl0ZU9mZnNldCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcIm9mZnNldFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICBpZiAoYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQgKyAobGVuZ3RoIHx8IDApKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1wibGVuZ3RoXCIgaXMgb3V0c2lkZSBvZiBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIHZhciBidWZcbiAgaWYgKGJ5dGVPZmZzZXQgPT09IHVuZGVmaW5lZCAmJiBsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5KVxuICB9IGVsc2UgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQpXG4gIH0gZWxzZSB7XG4gICAgYnVmID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuZnVuY3Rpb24gZnJvbU9iamVjdCAob2JqKSB7XG4gIGlmIChCdWZmZXIuaXNCdWZmZXIob2JqKSkge1xuICAgIHZhciBsZW4gPSBjaGVja2VkKG9iai5sZW5ndGgpIHwgMFxuICAgIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuKVxuXG4gICAgaWYgKGJ1Zi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBidWZcbiAgICB9XG5cbiAgICBvYmouY29weShidWYsIDAsIDAsIGxlbilcbiAgICByZXR1cm4gYnVmXG4gIH1cblxuICBpZiAob2JqLmxlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBvYmoubGVuZ3RoICE9PSAnbnVtYmVyJyB8fCBudW1iZXJJc05hTihvYmoubGVuZ3RoKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcigwKVxuICAgIH1cbiAgICByZXR1cm4gZnJvbUFycmF5TGlrZShvYmopXG4gIH1cblxuICBpZiAob2JqLnR5cGUgPT09ICdCdWZmZXInICYmIEFycmF5LmlzQXJyYXkob2JqLmRhdGEpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqLmRhdGEpXG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tlZCAobGVuZ3RoKSB7XG4gIC8vIE5vdGU6IGNhbm5vdCB1c2UgYGxlbmd0aCA8IEtfTUFYX0xFTkdUSGAgaGVyZSBiZWNhdXNlIHRoYXQgZmFpbHMgd2hlblxuICAvLyBsZW5ndGggaXMgTmFOICh3aGljaCBpcyBvdGhlcndpc2UgY29lcmNlZCB0byB6ZXJvLilcbiAgaWYgKGxlbmd0aCA+PSBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byBhbGxvY2F0ZSBCdWZmZXIgbGFyZ2VyIHRoYW4gbWF4aW11bSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAnc2l6ZTogMHgnICsgS19NQVhfTEVOR1RILnRvU3RyaW5nKDE2KSArICcgYnl0ZXMnKVxuICB9XG4gIHJldHVybiBsZW5ndGggfCAwXG59XG5cbmZ1bmN0aW9uIFNsb3dCdWZmZXIgKGxlbmd0aCkge1xuICBpZiAoK2xlbmd0aCAhPSBsZW5ndGgpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBlcWVxZXFcbiAgICBsZW5ndGggPSAwXG4gIH1cbiAgcmV0dXJuIEJ1ZmZlci5hbGxvYygrbGVuZ3RoKVxufVxuXG5CdWZmZXIuaXNCdWZmZXIgPSBmdW5jdGlvbiBpc0J1ZmZlciAoYikge1xuICByZXR1cm4gYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyID09PSB0cnVlICYmXG4gICAgYiAhPT0gQnVmZmVyLnByb3RvdHlwZSAvLyBzbyBCdWZmZXIuaXNCdWZmZXIoQnVmZmVyLnByb3RvdHlwZSkgd2lsbCBiZSBmYWxzZVxufVxuXG5CdWZmZXIuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKGEsIGIpIHtcbiAgaWYgKGlzSW5zdGFuY2UoYSwgVWludDhBcnJheSkpIGEgPSBCdWZmZXIuZnJvbShhLCBhLm9mZnNldCwgYS5ieXRlTGVuZ3RoKVxuICBpZiAoaXNJbnN0YW5jZShiLCBVaW50OEFycmF5KSkgYiA9IEJ1ZmZlci5mcm9tKGIsIGIub2Zmc2V0LCBiLmJ5dGVMZW5ndGgpXG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGEpIHx8ICFCdWZmZXIuaXNCdWZmZXIoYikpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcImJ1ZjFcIiwgXCJidWYyXCIgYXJndW1lbnRzIG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXknXG4gICAgKVxuICB9XG5cbiAgaWYgKGEgPT09IGIpIHJldHVybiAwXG5cbiAgdmFyIHggPSBhLmxlbmd0aFxuICB2YXIgeSA9IGIubGVuZ3RoXG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV1cbiAgICAgIHkgPSBiW2ldXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkgcmV0dXJuIC0xXG4gIGlmICh5IDwgeCkgcmV0dXJuIDFcbiAgcmV0dXJuIDBcbn1cblxuQnVmZmVyLmlzRW5jb2RpbmcgPSBmdW5jdGlvbiBpc0VuY29kaW5nIChlbmNvZGluZykge1xuICBzd2l0Y2ggKFN0cmluZyhlbmNvZGluZykudG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJ2hleCc6XG4gICAgY2FzZSAndXRmOCc6XG4gICAgY2FzZSAndXRmLTgnOlxuICAgIGNhc2UgJ2FzY2lpJzpcbiAgICBjYXNlICdsYXRpbjEnOlxuICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgY2FzZSAnYmFzZTY0JzpcbiAgICBjYXNlICd1Y3MyJzpcbiAgICBjYXNlICd1Y3MtMic6XG4gICAgY2FzZSAndXRmMTZsZSc6XG4gICAgY2FzZSAndXRmLTE2bGUnOlxuICAgICAgcmV0dXJuIHRydWVcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuQnVmZmVyLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdCAobGlzdCwgbGVuZ3RoKSB7XG4gIGlmICghQXJyYXkuaXNBcnJheShsaXN0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wibGlzdFwiIGFyZ3VtZW50IG11c3QgYmUgYW4gQXJyYXkgb2YgQnVmZmVycycpXG4gIH1cblxuICBpZiAobGlzdC5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQnVmZmVyLmFsbG9jKDApXG4gIH1cblxuICB2YXIgaVxuICBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW5ndGggPSAwXG4gICAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICAgIGxlbmd0aCArPSBsaXN0W2ldLmxlbmd0aFxuICAgIH1cbiAgfVxuXG4gIHZhciBidWZmZXIgPSBCdWZmZXIuYWxsb2NVbnNhZmUobGVuZ3RoKVxuICB2YXIgcG9zID0gMFxuICBmb3IgKGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7ICsraSkge1xuICAgIHZhciBidWYgPSBsaXN0W2ldXG4gICAgaWYgKGlzSW5zdGFuY2UoYnVmLCBVaW50OEFycmF5KSkge1xuICAgICAgYnVmID0gQnVmZmVyLmZyb20oYnVmKVxuICAgIH1cbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICAgIH1cbiAgICBidWYuY29weShidWZmZXIsIHBvcylcbiAgICBwb3MgKz0gYnVmLmxlbmd0aFxuICB9XG4gIHJldHVybiBidWZmZXJcbn1cblxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoc3RyaW5nLCBlbmNvZGluZykge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKHN0cmluZykpIHtcbiAgICByZXR1cm4gc3RyaW5nLmxlbmd0aFxuICB9XG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcoc3RyaW5nKSB8fCBpc0luc3RhbmNlKHN0cmluZywgQXJyYXlCdWZmZXIpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoXG4gIH1cbiAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJzdHJpbmdcIiBhcmd1bWVudCBtdXN0IGJlIG9uZSBvZiB0eXBlIHN0cmluZywgQnVmZmVyLCBvciBBcnJheUJ1ZmZlci4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHN0cmluZ1xuICAgIClcbiAgfVxuXG4gIHZhciBsZW4gPSBzdHJpbmcubGVuZ3RoXG4gIHZhciBtdXN0TWF0Y2ggPSAoYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdID09PSB0cnVlKVxuICBpZiAoIW11c3RNYXRjaCAmJiBsZW4gPT09IDApIHJldHVybiAwXG5cbiAgLy8gVXNlIGEgZm9yIGxvb3AgdG8gYXZvaWQgcmVjdXJzaW9uXG4gIHZhciBsb3dlcmVkQ2FzZSA9IGZhbHNlXG4gIGZvciAoOzspIHtcbiAgICBzd2l0Y2ggKGVuY29kaW5nKSB7XG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICBjYXNlICdsYXRpbjEnOlxuICAgICAgY2FzZSAnYmluYXJ5JzpcbiAgICAgICAgcmV0dXJuIGxlblxuICAgICAgY2FzZSAndXRmOCc6XG4gICAgICBjYXNlICd1dGYtOCc6XG4gICAgICAgIHJldHVybiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIGxlbiAqIDJcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBsZW4gPj4+IDFcbiAgICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgICAgIHJldHVybiBiYXNlNjRUb0J5dGVzKHN0cmluZykubGVuZ3RoXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHtcbiAgICAgICAgICByZXR1cm4gbXVzdE1hdGNoID8gLTEgOiB1dGY4VG9CeXRlcyhzdHJpbmcpLmxlbmd0aCAvLyBhc3N1bWUgdXRmOFxuICAgICAgICB9XG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5CdWZmZXIuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcblxuZnVuY3Rpb24gc2xvd1RvU3RyaW5nIChlbmNvZGluZywgc3RhcnQsIGVuZCkge1xuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuXG4gIC8vIE5vIG5lZWQgdG8gdmVyaWZ5IHRoYXQgXCJ0aGlzLmxlbmd0aCA8PSBNQVhfVUlOVDMyXCIgc2luY2UgaXQncyBhIHJlYWQtb25seVxuICAvLyBwcm9wZXJ0eSBvZiBhIHR5cGVkIGFycmF5LlxuXG4gIC8vIFRoaXMgYmVoYXZlcyBuZWl0aGVyIGxpa2UgU3RyaW5nIG5vciBVaW50OEFycmF5IGluIHRoYXQgd2Ugc2V0IHN0YXJ0L2VuZFxuICAvLyB0byB0aGVpciB1cHBlci9sb3dlciBib3VuZHMgaWYgdGhlIHZhbHVlIHBhc3NlZCBpcyBvdXQgb2YgcmFuZ2UuXG4gIC8vIHVuZGVmaW5lZCBpcyBoYW5kbGVkIHNwZWNpYWxseSBhcyBwZXIgRUNNQS0yNjIgNnRoIEVkaXRpb24sXG4gIC8vIFNlY3Rpb24gMTMuMy4zLjcgUnVudGltZSBTZW1hbnRpY3M6IEtleWVkQmluZGluZ0luaXRpYWxpemF0aW9uLlxuICBpZiAoc3RhcnQgPT09IHVuZGVmaW5lZCB8fCBzdGFydCA8IDApIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICAvLyBSZXR1cm4gZWFybHkgaWYgc3RhcnQgPiB0aGlzLmxlbmd0aC4gRG9uZSBoZXJlIHRvIHByZXZlbnQgcG90ZW50aWFsIHVpbnQzMlxuICAvLyBjb2VyY2lvbiBmYWlsIGJlbG93LlxuICBpZiAoc3RhcnQgPiB0aGlzLmxlbmd0aCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkIHx8IGVuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgZW5kID0gdGhpcy5sZW5ndGhcbiAgfVxuXG4gIGlmIChlbmQgPD0gMCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgLy8gRm9yY2UgY29lcnNpb24gdG8gdWludDMyLiBUaGlzIHdpbGwgYWxzbyBjb2VyY2UgZmFsc2V5L05hTiB2YWx1ZXMgdG8gMC5cbiAgZW5kID4+Pj0gMFxuICBzdGFydCA+Pj49IDBcblxuICBpZiAoZW5kIDw9IHN0YXJ0KSB7XG4gICAgcmV0dXJuICcnXG4gIH1cblxuICBpZiAoIWVuY29kaW5nKSBlbmNvZGluZyA9ICd1dGY4J1xuXG4gIHdoaWxlICh0cnVlKSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0U2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHV0ZjE2bGVTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoZW5jb2RpbmcgKyAnJykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhpcyBwcm9wZXJ0eSBpcyB1c2VkIGJ5IGBCdWZmZXIuaXNCdWZmZXJgIChhbmQgdGhlIGBpcy1idWZmZXJgIG5wbSBwYWNrYWdlKVxuLy8gdG8gZGV0ZWN0IGEgQnVmZmVyIGluc3RhbmNlLiBJdCdzIG5vdCBwb3NzaWJsZSB0byB1c2UgYGluc3RhbmNlb2YgQnVmZmVyYFxuLy8gcmVsaWFibHkgaW4gYSBicm93c2VyaWZ5IGNvbnRleHQgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBtdWx0aXBsZSBkaWZmZXJlbnRcbi8vIGNvcGllcyBvZiB0aGUgJ2J1ZmZlcicgcGFja2FnZSBpbiB1c2UuIFRoaXMgbWV0aG9kIHdvcmtzIGV2ZW4gZm9yIEJ1ZmZlclxuLy8gaW5zdGFuY2VzIHRoYXQgd2VyZSBjcmVhdGVkIGZyb20gYW5vdGhlciBjb3B5IG9mIHRoZSBgYnVmZmVyYCBwYWNrYWdlLlxuLy8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9pc3N1ZXMvMTU0XG5CdWZmZXIucHJvdG90eXBlLl9pc0J1ZmZlciA9IHRydWVcblxuZnVuY3Rpb24gc3dhcCAoYiwgbiwgbSkge1xuICB2YXIgaSA9IGJbbl1cbiAgYltuXSA9IGJbbV1cbiAgYlttXSA9IGlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwMTYgPSBmdW5jdGlvbiBzd2FwMTYgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDIgIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDE2LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDIpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyAxKVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDMyID0gZnVuY3Rpb24gc3dhcDMyICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSA0ICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAzMi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMylcbiAgICBzd2FwKHRoaXMsIGkgKyAxLCBpICsgMilcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXA2NCA9IGZ1bmN0aW9uIHN3YXA2NCAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgOCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNjQtYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gOCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDcpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDYpXG4gICAgc3dhcCh0aGlzLCBpICsgMiwgaSArIDUpXG4gICAgc3dhcCh0aGlzLCBpICsgMywgaSArIDQpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nICgpIHtcbiAgdmFyIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW5ndGggPT09IDApIHJldHVybiAnJ1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCAwLCBsZW5ndGgpXG4gIHJldHVybiBzbG93VG9TdHJpbmcuYXBwbHkodGhpcywgYXJndW1lbnRzKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnRvTG9jYWxlU3RyaW5nID0gQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZ1xuXG5CdWZmZXIucHJvdG90eXBlLmVxdWFscyA9IGZ1bmN0aW9uIGVxdWFscyAoYikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihiKSkgdGhyb3cgbmV3IFR5cGVFcnJvcignQXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlcicpXG4gIGlmICh0aGlzID09PSBiKSByZXR1cm4gdHJ1ZVxuICByZXR1cm4gQnVmZmVyLmNvbXBhcmUodGhpcywgYikgPT09IDBcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbnNwZWN0ID0gZnVuY3Rpb24gaW5zcGVjdCAoKSB7XG4gIHZhciBzdHIgPSAnJ1xuICB2YXIgbWF4ID0gZXhwb3J0cy5JTlNQRUNUX01BWF9CWVRFU1xuICBzdHIgPSB0aGlzLnRvU3RyaW5nKCdoZXgnLCAwLCBtYXgpLnJlcGxhY2UoLyguezJ9KS9nLCAnJDEgJykudHJpbSgpXG4gIGlmICh0aGlzLmxlbmd0aCA+IG1heCkgc3RyICs9ICcgLi4uICdcbiAgcmV0dXJuICc8QnVmZmVyICcgKyBzdHIgKyAnPidcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gY29tcGFyZSAodGFyZ2V0LCBzdGFydCwgZW5kLCB0aGlzU3RhcnQsIHRoaXNFbmQpIHtcbiAgaWYgKGlzSW5zdGFuY2UodGFyZ2V0LCBVaW50OEFycmF5KSkge1xuICAgIHRhcmdldCA9IEJ1ZmZlci5mcm9tKHRhcmdldCwgdGFyZ2V0Lm9mZnNldCwgdGFyZ2V0LmJ5dGVMZW5ndGgpXG4gIH1cbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidGFyZ2V0XCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBCdWZmZXIgb3IgVWludDhBcnJheS4gJyArXG4gICAgICAnUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB0YXJnZXQpXG4gICAgKVxuICB9XG5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICBzdGFydCA9IDBcbiAgfVxuICBpZiAoZW5kID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmQgPSB0YXJnZXQgPyB0YXJnZXQubGVuZ3RoIDogMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNTdGFydCA9IDBcbiAgfVxuICBpZiAodGhpc0VuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhpc0VuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoc3RhcnQgPCAwIHx8IGVuZCA+IHRhcmdldC5sZW5ndGggfHwgdGhpc1N0YXJ0IDwgMCB8fCB0aGlzRW5kID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCAmJiBzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMFxuICB9XG4gIGlmICh0aGlzU3RhcnQgPj0gdGhpc0VuZCkge1xuICAgIHJldHVybiAtMVxuICB9XG4gIGlmIChzdGFydCA+PSBlbmQpIHtcbiAgICByZXR1cm4gMVxuICB9XG5cbiAgc3RhcnQgPj4+PSAwXG4gIGVuZCA+Pj49IDBcbiAgdGhpc1N0YXJ0ID4+Pj0gMFxuICB0aGlzRW5kID4+Pj0gMFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQpIHJldHVybiAwXG5cbiAgdmFyIHggPSB0aGlzRW5kIC0gdGhpc1N0YXJ0XG4gIHZhciB5ID0gZW5kIC0gc3RhcnRcbiAgdmFyIGxlbiA9IE1hdGgubWluKHgsIHkpXG5cbiAgdmFyIHRoaXNDb3B5ID0gdGhpcy5zbGljZSh0aGlzU3RhcnQsIHRoaXNFbmQpXG4gIHZhciB0YXJnZXRDb3B5ID0gdGFyZ2V0LnNsaWNlKHN0YXJ0LCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuICAgIGlmICh0aGlzQ29weVtpXSAhPT0gdGFyZ2V0Q29weVtpXSkge1xuICAgICAgeCA9IHRoaXNDb3B5W2ldXG4gICAgICB5ID0gdGFyZ2V0Q29weVtpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbi8vIEZpbmRzIGVpdGhlciB0aGUgZmlyc3QgaW5kZXggb2YgYHZhbGAgaW4gYGJ1ZmZlcmAgYXQgb2Zmc2V0ID49IGBieXRlT2Zmc2V0YCxcbi8vIE9SIHRoZSBsYXN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA8PSBgYnl0ZU9mZnNldGAuXG4vL1xuLy8gQXJndW1lbnRzOlxuLy8gLSBidWZmZXIgLSBhIEJ1ZmZlciB0byBzZWFyY2hcbi8vIC0gdmFsIC0gYSBzdHJpbmcsIEJ1ZmZlciwgb3IgbnVtYmVyXG4vLyAtIGJ5dGVPZmZzZXQgLSBhbiBpbmRleCBpbnRvIGBidWZmZXJgOyB3aWxsIGJlIGNsYW1wZWQgdG8gYW4gaW50MzJcbi8vIC0gZW5jb2RpbmcgLSBhbiBvcHRpb25hbCBlbmNvZGluZywgcmVsZXZhbnQgaXMgdmFsIGlzIGEgc3RyaW5nXG4vLyAtIGRpciAtIHRydWUgZm9yIGluZGV4T2YsIGZhbHNlIGZvciBsYXN0SW5kZXhPZlxuZnVuY3Rpb24gYmlkaXJlY3Rpb25hbEluZGV4T2YgKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKSB7XG4gIC8vIEVtcHR5IGJ1ZmZlciBtZWFucyBubyBtYXRjaFxuICBpZiAoYnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0xXG5cbiAgLy8gTm9ybWFsaXplIGJ5dGVPZmZzZXRcbiAgaWYgKHR5cGVvZiBieXRlT2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gYnl0ZU9mZnNldFxuICAgIGJ5dGVPZmZzZXQgPSAwXG4gIH0gZWxzZSBpZiAoYnl0ZU9mZnNldCA+IDB4N2ZmZmZmZmYpIHtcbiAgICBieXRlT2Zmc2V0ID0gMHg3ZmZmZmZmZlxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAtMHg4MDAwMDAwMCkge1xuICAgIGJ5dGVPZmZzZXQgPSAtMHg4MDAwMDAwMFxuICB9XG4gIGJ5dGVPZmZzZXQgPSArYnl0ZU9mZnNldCAvLyBDb2VyY2UgdG8gTnVtYmVyLlxuICBpZiAobnVtYmVySXNOYU4oYnl0ZU9mZnNldCkpIHtcbiAgICAvLyBieXRlT2Zmc2V0OiBpdCBpdCdzIHVuZGVmaW5lZCwgbnVsbCwgTmFOLCBcImZvb1wiLCBldGMsIHNlYXJjaCB3aG9sZSBidWZmZXJcbiAgICBieXRlT2Zmc2V0ID0gZGlyID8gMCA6IChidWZmZXIubGVuZ3RoIC0gMSlcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0OiBuZWdhdGl2ZSBvZmZzZXRzIHN0YXJ0IGZyb20gdGhlIGVuZCBvZiB0aGUgYnVmZmVyXG4gIGlmIChieXRlT2Zmc2V0IDwgMCkgYnl0ZU9mZnNldCA9IGJ1ZmZlci5sZW5ndGggKyBieXRlT2Zmc2V0XG4gIGlmIChieXRlT2Zmc2V0ID49IGJ1ZmZlci5sZW5ndGgpIHtcbiAgICBpZiAoZGlyKSByZXR1cm4gLTFcbiAgICBlbHNlIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoIC0gMVxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPCAwKSB7XG4gICAgaWYgKGRpcikgYnl0ZU9mZnNldCA9IDBcbiAgICBlbHNlIHJldHVybiAtMVxuICB9XG5cbiAgLy8gTm9ybWFsaXplIHZhbFxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICB9XG5cbiAgLy8gRmluYWxseSwgc2VhcmNoIGVpdGhlciBpbmRleE9mIChpZiBkaXIgaXMgdHJ1ZSkgb3IgbGFzdEluZGV4T2ZcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWwpKSB7XG4gICAgLy8gU3BlY2lhbCBjYXNlOiBsb29raW5nIGZvciBlbXB0eSBzdHJpbmcvYnVmZmVyIGFsd2F5cyBmYWlsc1xuICAgIGlmICh2YWwubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gLTFcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5SW5kZXhPZihidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDB4RkYgLy8gU2VhcmNoIGZvciBhIGJ5dGUgdmFsdWUgWzAtMjU1XVxuICAgIGlmICh0eXBlb2YgVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKGRpcikge1xuICAgICAgICByZXR1cm4gVWludDhBcnJheS5wcm90b3R5cGUuaW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmxhc3RJbmRleE9mLmNhbGwoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQpXG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCBbIHZhbCBdLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZGlyKVxuICB9XG5cbiAgdGhyb3cgbmV3IFR5cGVFcnJvcigndmFsIG11c3QgYmUgc3RyaW5nLCBudW1iZXIgb3IgQnVmZmVyJylcbn1cblxuZnVuY3Rpb24gYXJyYXlJbmRleE9mIChhcnIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICB2YXIgaW5kZXhTaXplID0gMVxuICB2YXIgYXJyTGVuZ3RoID0gYXJyLmxlbmd0aFxuICB2YXIgdmFsTGVuZ3RoID0gdmFsLmxlbmd0aFxuXG4gIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSBTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICBpZiAoZW5jb2RpbmcgPT09ICd1Y3MyJyB8fCBlbmNvZGluZyA9PT0gJ3Vjcy0yJyB8fFxuICAgICAgICBlbmNvZGluZyA9PT0gJ3V0ZjE2bGUnIHx8IGVuY29kaW5nID09PSAndXRmLTE2bGUnKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA8IDIgfHwgdmFsLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgcmV0dXJuIC0xXG4gICAgICB9XG4gICAgICBpbmRleFNpemUgPSAyXG4gICAgICBhcnJMZW5ndGggLz0gMlxuICAgICAgdmFsTGVuZ3RoIC89IDJcbiAgICAgIGJ5dGVPZmZzZXQgLz0gMlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWQgKGJ1ZiwgaSkge1xuICAgIGlmIChpbmRleFNpemUgPT09IDEpIHtcbiAgICAgIHJldHVybiBidWZbaV1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGJ1Zi5yZWFkVUludDE2QkUoaSAqIGluZGV4U2l6ZSlcbiAgICB9XG4gIH1cblxuICB2YXIgaVxuICBpZiAoZGlyKSB7XG4gICAgdmFyIGZvdW5kSW5kZXggPSAtMVxuICAgIGZvciAoaSA9IGJ5dGVPZmZzZXQ7IGkgPCBhcnJMZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJlYWQoYXJyLCBpKSA9PT0gcmVhZCh2YWwsIGZvdW5kSW5kZXggPT09IC0xID8gMCA6IGkgLSBmb3VuZEluZGV4KSkge1xuICAgICAgICBpZiAoZm91bmRJbmRleCA9PT0gLTEpIGZvdW5kSW5kZXggPSBpXG4gICAgICAgIGlmIChpIC0gZm91bmRJbmRleCArIDEgPT09IHZhbExlbmd0aCkgcmV0dXJuIGZvdW5kSW5kZXggKiBpbmRleFNpemVcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChmb3VuZEluZGV4ICE9PSAtMSkgaSAtPSBpIC0gZm91bmRJbmRleFxuICAgICAgICBmb3VuZEluZGV4ID0gLTFcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGJ5dGVPZmZzZXQgKyB2YWxMZW5ndGggPiBhcnJMZW5ndGgpIGJ5dGVPZmZzZXQgPSBhcnJMZW5ndGggLSB2YWxMZW5ndGhcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpID49IDA7IGktLSkge1xuICAgICAgdmFyIGZvdW5kID0gdHJ1ZVxuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWxMZW5ndGg7IGorKykge1xuICAgICAgICBpZiAocmVhZChhcnIsIGkgKyBqKSAhPT0gcmVhZCh2YWwsIGopKSB7XG4gICAgICAgICAgZm91bmQgPSBmYWxzZVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmb3VuZCkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gLTFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uIGluY2x1ZGVzICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiB0aGlzLmluZGV4T2YodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykgIT09IC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uIGluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIHRydWUpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbiBsYXN0SW5kZXhPZiAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gYmlkaXJlY3Rpb25hbEluZGV4T2YodGhpcywgdmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZywgZmFsc2UpXG59XG5cbmZ1bmN0aW9uIGhleFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgb2Zmc2V0ID0gTnVtYmVyKG9mZnNldCkgfHwgMFxuICB2YXIgcmVtYWluaW5nID0gYnVmLmxlbmd0aCAtIG9mZnNldFxuICBpZiAoIWxlbmd0aCkge1xuICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICB9IGVsc2Uge1xuICAgIGxlbmd0aCA9IE51bWJlcihsZW5ndGgpXG4gICAgaWYgKGxlbmd0aCA+IHJlbWFpbmluZykge1xuICAgICAgbGVuZ3RoID0gcmVtYWluaW5nXG4gICAgfVxuICB9XG5cbiAgdmFyIHN0ckxlbiA9IHN0cmluZy5sZW5ndGhcblxuICBpZiAobGVuZ3RoID4gc3RyTGVuIC8gMikge1xuICAgIGxlbmd0aCA9IHN0ckxlbiAvIDJcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHBhcnNlZCA9IHBhcnNlSW50KHN0cmluZy5zdWJzdHIoaSAqIDIsIDIpLCAxNilcbiAgICBpZiAobnVtYmVySXNOYU4ocGFyc2VkKSkgcmV0dXJuIGlcbiAgICBidWZbb2Zmc2V0ICsgaV0gPSBwYXJzZWRcbiAgfVxuICByZXR1cm4gaVxufVxuXG5mdW5jdGlvbiB1dGY4V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcih1dGY4VG9CeXRlcyhzdHJpbmcsIGJ1Zi5sZW5ndGggLSBvZmZzZXQpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBhc2NpaVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIoYXNjaWlUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIGxhdGluMVdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGFzY2lpV3JpdGUoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBiYXNlNjRXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGJhc2U2NFRvQnl0ZXMoc3RyaW5nKSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gdWNzMldyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmMTZsZVRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uIHdyaXRlIChzdHJpbmcsIG9mZnNldCwgbGVuZ3RoLCBlbmNvZGluZykge1xuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nKVxuICBpZiAob2Zmc2V0ID09PSB1bmRlZmluZWQpIHtcbiAgICBlbmNvZGluZyA9ICd1dGY4J1xuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBlbmNvZGluZylcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCAmJiB0eXBlb2Ygb2Zmc2V0ID09PSAnc3RyaW5nJykge1xuICAgIGVuY29kaW5nID0gb2Zmc2V0XG4gICAgbGVuZ3RoID0gdGhpcy5sZW5ndGhcbiAgICBvZmZzZXQgPSAwXG4gIC8vIEJ1ZmZlciN3cml0ZShzdHJpbmcsIG9mZnNldFssIGxlbmd0aF1bLCBlbmNvZGluZ10pXG4gIH0gZWxzZSBpZiAoaXNGaW5pdGUob2Zmc2V0KSkge1xuICAgIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICAgIGlmIChpc0Zpbml0ZShsZW5ndGgpKSB7XG4gICAgICBsZW5ndGggPSBsZW5ndGggPj4+IDBcbiAgICAgIGlmIChlbmNvZGluZyA9PT0gdW5kZWZpbmVkKSBlbmNvZGluZyA9ICd1dGY4J1xuICAgIH0gZWxzZSB7XG4gICAgICBlbmNvZGluZyA9IGxlbmd0aFxuICAgICAgbGVuZ3RoID0gdW5kZWZpbmVkXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICdCdWZmZXIud3JpdGUoc3RyaW5nLCBlbmNvZGluZywgb2Zmc2V0WywgbGVuZ3RoXSkgaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCdcbiAgICApXG4gIH1cblxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkIHx8IGxlbmd0aCA+IHJlbWFpbmluZykgbGVuZ3RoID0gcmVtYWluaW5nXG5cbiAgaWYgKChzdHJpbmcubGVuZ3RoID4gMCAmJiAobGVuZ3RoIDwgMCB8fCBvZmZzZXQgPCAwKSkgfHwgb2Zmc2V0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQXR0ZW1wdCB0byB3cml0ZSBvdXRzaWRlIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnaGV4JzpcbiAgICAgICAgcmV0dXJuIGhleFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2FzY2lpJzpcbiAgICAgICAgcmV0dXJuIGFzY2lpV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsYXRpbjFXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICAvLyBXYXJuaW5nOiBtYXhMZW5ndGggbm90IHRha2VuIGludG8gYWNjb3VudCBpbiBiYXNlNjRXcml0ZVxuICAgICAgICByZXR1cm4gYmFzZTY0V3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAndWNzMic6XG4gICAgICBjYXNlICd1Y3MtMic6XG4gICAgICBjYXNlICd1dGYxNmxlJzpcbiAgICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgICAgcmV0dXJuIHVjczJXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobG93ZXJlZENhc2UpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgICAgICAgZW5jb2RpbmcgPSAoJycgKyBlbmNvZGluZykudG9Mb3dlckNhc2UoKVxuICAgICAgICBsb3dlcmVkQ2FzZSA9IHRydWVcbiAgICB9XG4gIH1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiB0b0pTT04gKCkge1xuICByZXR1cm4ge1xuICAgIHR5cGU6ICdCdWZmZXInLFxuICAgIGRhdGE6IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHRoaXMuX2FyciB8fCB0aGlzLCAwKVxuICB9XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKHN0YXJ0ID09PSAwICYmIGVuZCA9PT0gYnVmLmxlbmd0aCkge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYpXG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGJhc2U2NC5mcm9tQnl0ZUFycmF5KGJ1Zi5zbGljZShzdGFydCwgZW5kKSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1dGY4U2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG4gIHZhciByZXMgPSBbXVxuXG4gIHZhciBpID0gc3RhcnRcbiAgd2hpbGUgKGkgPCBlbmQpIHtcbiAgICB2YXIgZmlyc3RCeXRlID0gYnVmW2ldXG4gICAgdmFyIGNvZGVQb2ludCA9IG51bGxcbiAgICB2YXIgYnl0ZXNQZXJTZXF1ZW5jZSA9IChmaXJzdEJ5dGUgPiAweEVGKSA/IDRcbiAgICAgIDogKGZpcnN0Qnl0ZSA+IDB4REYpID8gM1xuICAgICAgICA6IChmaXJzdEJ5dGUgPiAweEJGKSA/IDJcbiAgICAgICAgICA6IDFcblxuICAgIGlmIChpICsgYnl0ZXNQZXJTZXF1ZW5jZSA8PSBlbmQpIHtcbiAgICAgIHZhciBzZWNvbmRCeXRlLCB0aGlyZEJ5dGUsIGZvdXJ0aEJ5dGUsIHRlbXBDb2RlUG9pbnRcblxuICAgICAgc3dpdGNoIChieXRlc1BlclNlcXVlbmNlKSB7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBpZiAoZmlyc3RCeXRlIDwgMHg4MCkge1xuICAgICAgICAgICAgY29kZVBvaW50ID0gZmlyc3RCeXRlXG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4MUYpIDw8IDB4NiB8IChzZWNvbmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3Rikge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgMzpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODApIHtcbiAgICAgICAgICAgIHRlbXBDb2RlUG9pbnQgPSAoZmlyc3RCeXRlICYgMHhGKSA8PCAweEMgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4NiB8ICh0aGlyZEJ5dGUgJiAweDNGKVxuICAgICAgICAgICAgaWYgKHRlbXBDb2RlUG9pbnQgPiAweDdGRiAmJiAodGVtcENvZGVQb2ludCA8IDB4RDgwMCB8fCB0ZW1wQ29kZVBvaW50ID4gMHhERkZGKSkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrXG4gICAgICAgIGNhc2UgNDpcbiAgICAgICAgICBzZWNvbmRCeXRlID0gYnVmW2kgKyAxXVxuICAgICAgICAgIHRoaXJkQnl0ZSA9IGJ1ZltpICsgMl1cbiAgICAgICAgICBmb3VydGhCeXRlID0gYnVmW2kgKyAzXVxuICAgICAgICAgIGlmICgoc2Vjb25kQnl0ZSAmIDB4QzApID09PSAweDgwICYmICh0aGlyZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAoZm91cnRoQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHgxMiB8IChzZWNvbmRCeXRlICYgMHgzRikgPDwgMHhDIHwgKHRoaXJkQnl0ZSAmIDB4M0YpIDw8IDB4NiB8IChmb3VydGhCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHhGRkZGICYmIHRlbXBDb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgICAgICAgICBjb2RlUG9pbnQgPSB0ZW1wQ29kZVBvaW50XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjb2RlUG9pbnQgPT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGRpZCBub3QgZ2VuZXJhdGUgYSB2YWxpZCBjb2RlUG9pbnQgc28gaW5zZXJ0IGFcbiAgICAgIC8vIHJlcGxhY2VtZW50IGNoYXIgKFUrRkZGRCkgYW5kIGFkdmFuY2Ugb25seSAxIGJ5dGVcbiAgICAgIGNvZGVQb2ludCA9IDB4RkZGRFxuICAgICAgYnl0ZXNQZXJTZXF1ZW5jZSA9IDFcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA+IDB4RkZGRikge1xuICAgICAgLy8gZW5jb2RlIHRvIHV0ZjE2IChzdXJyb2dhdGUgcGFpciBkYW5jZSlcbiAgICAgIGNvZGVQb2ludCAtPSAweDEwMDAwXG4gICAgICByZXMucHVzaChjb2RlUG9pbnQgPj4+IDEwICYgMHgzRkYgfCAweEQ4MDApXG4gICAgICBjb2RlUG9pbnQgPSAweERDMDAgfCBjb2RlUG9pbnQgJiAweDNGRlxuICAgIH1cblxuICAgIHJlcy5wdXNoKGNvZGVQb2ludClcbiAgICBpICs9IGJ5dGVzUGVyU2VxdWVuY2VcbiAgfVxuXG4gIHJldHVybiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkocmVzKVxufVxuXG4vLyBCYXNlZCBvbiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yMjc0NzI3Mi82ODA3NDIsIHRoZSBicm93c2VyIHdpdGhcbi8vIHRoZSBsb3dlc3QgbGltaXQgaXMgQ2hyb21lLCB3aXRoIDB4MTAwMDAgYXJncy5cbi8vIFdlIGdvIDEgbWFnbml0dWRlIGxlc3MsIGZvciBzYWZldHlcbnZhciBNQVhfQVJHVU1FTlRTX0xFTkdUSCA9IDB4MTAwMFxuXG5mdW5jdGlvbiBkZWNvZGVDb2RlUG9pbnRzQXJyYXkgKGNvZGVQb2ludHMpIHtcbiAgdmFyIGxlbiA9IGNvZGVQb2ludHMubGVuZ3RoXG4gIGlmIChsZW4gPD0gTUFYX0FSR1VNRU5UU19MRU5HVEgpIHtcbiAgICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShTdHJpbmcsIGNvZGVQb2ludHMpIC8vIGF2b2lkIGV4dHJhIHNsaWNlKClcbiAgfVxuXG4gIC8vIERlY29kZSBpbiBjaHVua3MgdG8gYXZvaWQgXCJjYWxsIHN0YWNrIHNpemUgZXhjZWVkZWRcIi5cbiAgdmFyIHJlcyA9ICcnXG4gIHZhciBpID0gMFxuICB3aGlsZSAoaSA8IGxlbikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KFxuICAgICAgU3RyaW5nLFxuICAgICAgY29kZVBvaW50cy5zbGljZShpLCBpICs9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKVxuICAgIClcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpU2xpY2UgKGJ1Ziwgc3RhcnQsIGVuZCkge1xuICB2YXIgcmV0ID0gJydcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnVmW2ldICYgMHg3RilcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGxhdGluMVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gcmV0XG59XG5cbmZ1bmN0aW9uIGhleFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IGJ1Zi5sZW5ndGhcblxuICBpZiAoIXN0YXJ0IHx8IHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIGlmICghZW5kIHx8IGVuZCA8IDAgfHwgZW5kID4gbGVuKSBlbmQgPSBsZW5cblxuICB2YXIgb3V0ID0gJydcbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICBvdXQgKz0gdG9IZXgoYnVmW2ldKVxuICB9XG4gIHJldHVybiBvdXRcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGJ5dGVzID0gYnVmLnNsaWNlKHN0YXJ0LCBlbmQpXG4gIHZhciByZXMgPSAnJ1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ5dGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgcmVzICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0gKyAoYnl0ZXNbaSArIDFdICogMjU2KSlcbiAgfVxuICByZXR1cm4gcmVzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiBzbGljZSAoc3RhcnQsIGVuZCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgc3RhcnQgPSB+fnN0YXJ0XG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gbGVuIDogfn5lbmRcblxuICBpZiAoc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgKz0gbGVuXG4gICAgaWYgKHN0YXJ0IDwgMCkgc3RhcnQgPSAwXG4gIH0gZWxzZSBpZiAoc3RhcnQgPiBsZW4pIHtcbiAgICBzdGFydCA9IGxlblxuICB9XG5cbiAgaWYgKGVuZCA8IDApIHtcbiAgICBlbmQgKz0gbGVuXG4gICAgaWYgKGVuZCA8IDApIGVuZCA9IDBcbiAgfSBlbHNlIGlmIChlbmQgPiBsZW4pIHtcbiAgICBlbmQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCBzdGFydCkgZW5kID0gc3RhcnRcblxuICB2YXIgbmV3QnVmID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKVxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBuZXdCdWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gbmV3QnVmXG59XG5cbi8qXG4gKiBOZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IGJ1ZmZlciBpc24ndCB0cnlpbmcgdG8gd3JpdGUgb3V0IG9mIGJvdW5kcy5cbiAqL1xuZnVuY3Rpb24gY2hlY2tPZmZzZXQgKG9mZnNldCwgZXh0LCBsZW5ndGgpIHtcbiAgaWYgKChvZmZzZXQgJSAxKSAhPT0gMCB8fCBvZmZzZXQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignb2Zmc2V0IGlzIG5vdCB1aW50JylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1RyeWluZyB0byBhY2Nlc3MgYmV5b25kIGJ1ZmZlciBsZW5ndGgnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50TEUgPSBmdW5jdGlvbiByZWFkVUludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludEJFID0gZnVuY3Rpb24gcmVhZFVJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG4gIH1cblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdXG4gIHZhciBtdWwgPSAxXG4gIHdoaWxlIChieXRlTGVuZ3RoID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0tYnl0ZUxlbmd0aF0gKiBtdWxcbiAgfVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDggPSBmdW5jdGlvbiByZWFkVUludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF1cbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2TEUgPSBmdW5jdGlvbiByZWFkVUludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRVSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuICh0aGlzW29mZnNldF0gPDwgOCkgfCB0aGlzW29mZnNldCArIDFdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkxFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAoKHRoaXNbb2Zmc2V0XSkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpKSArXG4gICAgICAodGhpc1tvZmZzZXQgKyAzXSAqIDB4MTAwMDAwMClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDMyQkUgPSBmdW5jdGlvbiByZWFkVUludDMyQkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0gKiAweDEwMDAwMDApICtcbiAgICAoKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgdGhpc1tvZmZzZXQgKyAzXSlcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50TEUgPSBmdW5jdGlvbiByZWFkSW50TEUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgYnl0ZUxlbmd0aCwgdGhpcy5sZW5ndGgpXG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XVxuICB2YXIgbXVsID0gMVxuICB2YXIgaSA9IDBcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyBpXSAqIG11bFxuICB9XG4gIG11bCAqPSAweDgwXG5cbiAgaWYgKHZhbCA+PSBtdWwpIHZhbCAtPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aClcblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludEJFID0gZnVuY3Rpb24gcmVhZEludEJFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aFxuICB2YXIgbXVsID0gMVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAtLWldXG4gIHdoaWxlIChpID4gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIC0taV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQ4ID0gZnVuY3Rpb24gcmVhZEludDggKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMSwgdGhpcy5sZW5ndGgpXG4gIGlmICghKHRoaXNbb2Zmc2V0XSAmIDB4ODApKSByZXR1cm4gKHRoaXNbb2Zmc2V0XSlcbiAgcmV0dXJuICgoMHhmZiAtIHRoaXNbb2Zmc2V0XSArIDEpICogLTEpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2TEUgPSBmdW5jdGlvbiByZWFkSW50MTZMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0XSB8ICh0aGlzW29mZnNldCArIDFdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MTZCRSA9IGZ1bmN0aW9uIHJlYWRJbnQxNkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXQgKyAxXSB8ICh0aGlzW29mZnNldF0gPDwgOClcbiAgcmV0dXJuICh2YWwgJiAweDgwMDApID8gdmFsIHwgMHhGRkZGMDAwMCA6IHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQzMkxFID0gZnVuY3Rpb24gcmVhZEludDMyTEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG5cbiAgcmV0dXJuICh0aGlzW29mZnNldF0pIHxcbiAgICAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAzXSA8PCAyNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJCRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDI0KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgMTYpIHxcbiAgICAodGhpc1tvZmZzZXQgKyAyXSA8PCA4KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEZsb2F0TEUgPSBmdW5jdGlvbiByZWFkRmxvYXRMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdEJFID0gZnVuY3Rpb24gcmVhZEZsb2F0QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCBmYWxzZSwgMjMsIDQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUxFID0gZnVuY3Rpb24gcmVhZERvdWJsZUxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgdHJ1ZSwgNTIsIDgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZERvdWJsZUJFID0gZnVuY3Rpb24gcmVhZERvdWJsZUJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDgsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDUyLCA4KVxufVxuXG5mdW5jdGlvbiBjaGVja0ludCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKGJ1ZikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiYnVmZmVyXCIgYXJndW1lbnQgbXVzdCBiZSBhIEJ1ZmZlciBpbnN0YW5jZScpXG4gIGlmICh2YWx1ZSA+IG1heCB8fCB2YWx1ZSA8IG1pbikgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ1widmFsdWVcIiBhcmd1bWVudCBpcyBvdXQgb2YgYm91bmRzJylcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludExFID0gZnVuY3Rpb24gd3JpdGVVSW50TEUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIG1heEJ5dGVzID0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpIC0gMVxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG1heEJ5dGVzLCAwKVxuICB9XG5cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAodmFsdWUgLyBtdWwpICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlVUludEJFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50OCA9IGZ1bmN0aW9uIHdyaXRlVUludDggKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAxLCAweGZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHhmZmZmLCAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyTEUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZVVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHhmZmZmZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiAyNClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gMTYpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50TEUgPSBmdW5jdGlvbiB3cml0ZUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBsaW1pdCA9IE1hdGgucG93KDIsICg4ICogYnl0ZUxlbmd0aCkgLSAxKVxuXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbGltaXQgLSAxLCAtbGltaXQpXG4gIH1cblxuICB2YXIgaSA9IDBcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXRdID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgaWYgKHZhbHVlIDwgMCAmJiBzdWIgPT09IDAgJiYgdGhpc1tvZmZzZXQgKyBpIC0gMV0gIT09IDApIHtcbiAgICAgIHN1YiA9IDFcbiAgICB9XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICgodmFsdWUgLyBtdWwpID4+IDApIC0gc3ViICYgMHhGRlxuICB9XG5cbiAgcmV0dXJuIG9mZnNldCArIGJ5dGVMZW5ndGhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludEJFID0gZnVuY3Rpb24gd3JpdGVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSBieXRlTGVuZ3RoIC0gMVxuICB2YXIgbXVsID0gMVxuICB2YXIgc3ViID0gMFxuICB0aGlzW29mZnNldCArIGldID0gdmFsdWUgJiAweEZGXG4gIHdoaWxlICgtLWkgPj0gMCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSArIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQ4ID0gZnVuY3Rpb24gd3JpdGVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHg3ZiwgLTB4ODApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MTZMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4N2ZmZiwgLTB4ODAwMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2QkUgPSBmdW5jdGlvbiB3cml0ZUludDE2QkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMl0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlID4+PiAyNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDMyQkUgPSBmdW5jdGlvbiB3cml0ZUludDMyQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCA0LCAweDdmZmZmZmZmLCAtMHg4MDAwMDAwMClcbiAgaWYgKHZhbHVlIDwgMCkgdmFsdWUgPSAweGZmZmZmZmZmICsgdmFsdWUgKyAxXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuZnVuY3Rpb24gY2hlY2tJRUVFNzU0IChidWYsIHZhbHVlLCBvZmZzZXQsIGV4dCwgbWF4LCBtaW4pIHtcbiAgaWYgKG9mZnNldCArIGV4dCA+IGJ1Zi5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAob2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvYXQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIGNoZWNrSUVFRTc1NChidWYsIHZhbHVlLCBvZmZzZXQsIDQsIDMuNDAyODIzNDY2Mzg1Mjg4NmUrMzgsIC0zLjQwMjgyMzQ2NjM4NTI4ODZlKzM4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDIzLCA0KVxuICByZXR1cm4gb2Zmc2V0ICsgNFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRMRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVGbG9hdEJFID0gZnVuY3Rpb24gd3JpdGVGbG9hdEJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVGbG9hdCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbmZ1bmN0aW9uIHdyaXRlRG91YmxlIChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA4LCAxLjc5NzY5MzEzNDg2MjMxNTdFKzMwOCwgLTEuNzk3NjkzMTM0ODYyMzE1N0UrMzA4KVxuICB9XG4gIGllZWU3NTQud3JpdGUoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIDUyLCA4KVxuICByZXR1cm4gb2Zmc2V0ICsgOFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlTEUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUxFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgdHJ1ZSwgbm9Bc3NlcnQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVEb3VibGVCRSA9IGZ1bmN0aW9uIHdyaXRlRG91YmxlQkUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZURvdWJsZSh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBmYWxzZSwgbm9Bc3NlcnQpXG59XG5cbi8vIGNvcHkodGFyZ2V0QnVmZmVyLCB0YXJnZXRTdGFydD0wLCBzb3VyY2VTdGFydD0wLCBzb3VyY2VFbmQ9YnVmZmVyLmxlbmd0aClcbkJ1ZmZlci5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uIGNvcHkgKHRhcmdldCwgdGFyZ2V0U3RhcnQsIHN0YXJ0LCBlbmQpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGFyZ2V0KSkgdGhyb3cgbmV3IFR5cGVFcnJvcignYXJndW1lbnQgc2hvdWxkIGJlIGEgQnVmZmVyJylcbiAgaWYgKCFzdGFydCkgc3RhcnQgPSAwXG4gIGlmICghZW5kICYmIGVuZCAhPT0gMCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldFN0YXJ0ID49IHRhcmdldC5sZW5ndGgpIHRhcmdldFN0YXJ0ID0gdGFyZ2V0Lmxlbmd0aFxuICBpZiAoIXRhcmdldFN0YXJ0KSB0YXJnZXRTdGFydCA9IDBcbiAgaWYgKGVuZCA+IDAgJiYgZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgLy8gQ29weSAwIGJ5dGVzOyB3ZSdyZSBkb25lXG4gIGlmIChlbmQgPT09IHN0YXJ0KSByZXR1cm4gMFxuICBpZiAodGFyZ2V0Lmxlbmd0aCA9PT0gMCB8fCB0aGlzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDBcblxuICAvLyBGYXRhbCBlcnJvciBjb25kaXRpb25zXG4gIGlmICh0YXJnZXRTdGFydCA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcigndGFyZ2V0U3RhcnQgb3V0IG9mIGJvdW5kcycpXG4gIH1cbiAgaWYgKHN0YXJ0IDwgMCB8fCBzdGFydCA+PSB0aGlzLmxlbmd0aCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0luZGV4IG91dCBvZiByYW5nZScpXG4gIGlmIChlbmQgPCAwKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc291cmNlRW5kIG91dCBvZiBib3VuZHMnKVxuXG4gIC8vIEFyZSB3ZSBvb2I/XG4gIGlmIChlbmQgPiB0aGlzLmxlbmd0aCkgZW5kID0gdGhpcy5sZW5ndGhcbiAgaWYgKHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCA8IGVuZCAtIHN0YXJ0KSB7XG4gICAgZW5kID0gdGFyZ2V0Lmxlbmd0aCAtIHRhcmdldFN0YXJ0ICsgc3RhcnRcbiAgfVxuXG4gIHZhciBsZW4gPSBlbmQgLSBzdGFydFxuXG4gIGlmICh0aGlzID09PSB0YXJnZXQgJiYgdHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmNvcHlXaXRoaW4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAvLyBVc2UgYnVpbHQtaW4gd2hlbiBhdmFpbGFibGUsIG1pc3NpbmcgZnJvbSBJRTExXG4gICAgdGhpcy5jb3B5V2l0aGluKHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKVxuICB9IGVsc2UgaWYgKHRoaXMgPT09IHRhcmdldCAmJiBzdGFydCA8IHRhcmdldFN0YXJ0ICYmIHRhcmdldFN0YXJ0IDwgZW5kKSB7XG4gICAgLy8gZGVzY2VuZGluZyBjb3B5IGZyb20gZW5kXG4gICAgZm9yICh2YXIgaSA9IGxlbiAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB0YXJnZXRbaSArIHRhcmdldFN0YXJ0XSA9IHRoaXNbaSArIHN0YXJ0XVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBVaW50OEFycmF5LnByb3RvdHlwZS5zZXQuY2FsbChcbiAgICAgIHRhcmdldCxcbiAgICAgIHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZCksXG4gICAgICB0YXJnZXRTdGFydFxuICAgIClcbiAgfVxuXG4gIHJldHVybiBsZW5cbn1cblxuLy8gVXNhZ2U6XG4vLyAgICBidWZmZXIuZmlsbChudW1iZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKGJ1ZmZlclssIG9mZnNldFssIGVuZF1dKVxuLy8gICAgYnVmZmVyLmZpbGwoc3RyaW5nWywgb2Zmc2V0WywgZW5kXV1bLCBlbmNvZGluZ10pXG5CdWZmZXIucHJvdG90eXBlLmZpbGwgPSBmdW5jdGlvbiBmaWxsICh2YWwsIHN0YXJ0LCBlbmQsIGVuY29kaW5nKSB7XG4gIC8vIEhhbmRsZSBzdHJpbmcgY2FzZXM6XG4gIGlmICh0eXBlb2YgdmFsID09PSAnc3RyaW5nJykge1xuICAgIGlmICh0eXBlb2Ygc3RhcnQgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlbmNvZGluZyA9IHN0YXJ0XG4gICAgICBzdGFydCA9IDBcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZW5kID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBlbmRcbiAgICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gICAgfVxuICAgIGlmIChlbmNvZGluZyAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiBlbmNvZGluZyAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2VuY29kaW5nIG11c3QgYmUgYSBzdHJpbmcnKVxuICAgIH1cbiAgICBpZiAodHlwZW9mIGVuY29kaW5nID09PSAnc3RyaW5nJyAmJiAhQnVmZmVyLmlzRW5jb2RpbmcoZW5jb2RpbmcpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgfVxuICAgIGlmICh2YWwubGVuZ3RoID09PSAxKSB7XG4gICAgICB2YXIgY29kZSA9IHZhbC5jaGFyQ29kZUF0KDApXG4gICAgICBpZiAoKGVuY29kaW5nID09PSAndXRmOCcgJiYgY29kZSA8IDEyOCkgfHxcbiAgICAgICAgICBlbmNvZGluZyA9PT0gJ2xhdGluMScpIHtcbiAgICAgICAgLy8gRmFzdCBwYXRoOiBJZiBgdmFsYCBmaXRzIGludG8gYSBzaW5nbGUgYnl0ZSwgdXNlIHRoYXQgbnVtZXJpYyB2YWx1ZS5cbiAgICAgICAgdmFsID0gY29kZVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIHZhbCA9IHZhbCAmIDI1NVxuICB9XG5cbiAgLy8gSW52YWxpZCByYW5nZXMgYXJlIG5vdCBzZXQgdG8gYSBkZWZhdWx0LCBzbyBjYW4gcmFuZ2UgY2hlY2sgZWFybHkuXG4gIGlmIChzdGFydCA8IDAgfHwgdGhpcy5sZW5ndGggPCBzdGFydCB8fCB0aGlzLmxlbmd0aCA8IGVuZCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdPdXQgb2YgcmFuZ2UgaW5kZXgnKVxuICB9XG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICBzdGFydCA9IHN0YXJ0ID4+PiAwXG4gIGVuZCA9IGVuZCA9PT0gdW5kZWZpbmVkID8gdGhpcy5sZW5ndGggOiBlbmQgPj4+IDBcblxuICBpZiAoIXZhbCkgdmFsID0gMFxuXG4gIHZhciBpXG4gIGlmICh0eXBlb2YgdmFsID09PSAnbnVtYmVyJykge1xuICAgIGZvciAoaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICAgIHRoaXNbaV0gPSB2YWxcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyIGJ5dGVzID0gQnVmZmVyLmlzQnVmZmVyKHZhbClcbiAgICAgID8gdmFsXG4gICAgICA6IEJ1ZmZlci5mcm9tKHZhbCwgZW5jb2RpbmcpXG4gICAgdmFyIGxlbiA9IGJ5dGVzLmxlbmd0aFxuICAgIGlmIChsZW4gPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSB2YWx1ZSBcIicgKyB2YWwgK1xuICAgICAgICAnXCIgaXMgaW52YWxpZCBmb3IgYXJndW1lbnQgXCJ2YWx1ZVwiJylcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGVuZCAtIHN0YXJ0OyArK2kpIHtcbiAgICAgIHRoaXNbaSArIHN0YXJ0XSA9IGJ5dGVzW2kgJSBsZW5dXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXNcbn1cblxuLy8gSEVMUEVSIEZVTkNUSU9OU1xuLy8gPT09PT09PT09PT09PT09PVxuXG52YXIgSU5WQUxJRF9CQVNFNjRfUkUgPSAvW14rLzAtOUEtWmEtei1fXS9nXG5cbmZ1bmN0aW9uIGJhc2U2NGNsZWFuIChzdHIpIHtcbiAgLy8gTm9kZSB0YWtlcyBlcXVhbCBzaWducyBhcyBlbmQgb2YgdGhlIEJhc2U2NCBlbmNvZGluZ1xuICBzdHIgPSBzdHIuc3BsaXQoJz0nKVswXVxuICAvLyBOb2RlIHN0cmlwcyBvdXQgaW52YWxpZCBjaGFyYWN0ZXJzIGxpa2UgXFxuIGFuZCBcXHQgZnJvbSB0aGUgc3RyaW5nLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgc3RyID0gc3RyLnRyaW0oKS5yZXBsYWNlKElOVkFMSURfQkFTRTY0X1JFLCAnJylcbiAgLy8gTm9kZSBjb252ZXJ0cyBzdHJpbmdzIHdpdGggbGVuZ3RoIDwgMiB0byAnJ1xuICBpZiAoc3RyLmxlbmd0aCA8IDIpIHJldHVybiAnJ1xuICAvLyBOb2RlIGFsbG93cyBmb3Igbm9uLXBhZGRlZCBiYXNlNjQgc3RyaW5ncyAobWlzc2luZyB0cmFpbGluZyA9PT0pLCBiYXNlNjQtanMgZG9lcyBub3RcbiAgd2hpbGUgKHN0ci5sZW5ndGggJSA0ICE9PSAwKSB7XG4gICAgc3RyID0gc3RyICsgJz0nXG4gIH1cbiAgcmV0dXJuIHN0clxufVxuXG5mdW5jdGlvbiB0b0hleCAobikge1xuICBpZiAobiA8IDE2KSByZXR1cm4gJzAnICsgbi50b1N0cmluZygxNilcbiAgcmV0dXJuIG4udG9TdHJpbmcoMTYpXG59XG5cbmZ1bmN0aW9uIHV0ZjhUb0J5dGVzIChzdHJpbmcsIHVuaXRzKSB7XG4gIHVuaXRzID0gdW5pdHMgfHwgSW5maW5pdHlcbiAgdmFyIGNvZGVQb2ludFxuICB2YXIgbGVuZ3RoID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcbiAgdmFyIGJ5dGVzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgY29kZVBvaW50ID0gc3RyaW5nLmNoYXJDb2RlQXQoaSlcblxuICAgIC8vIGlzIHN1cnJvZ2F0ZSBjb21wb25lbnRcbiAgICBpZiAoY29kZVBvaW50ID4gMHhEN0ZGICYmIGNvZGVQb2ludCA8IDB4RTAwMCkge1xuICAgICAgLy8gbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICghbGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgICAvLyBubyBsZWFkIHlldFxuICAgICAgICBpZiAoY29kZVBvaW50ID4gMHhEQkZGKSB7XG4gICAgICAgICAgLy8gdW5leHBlY3RlZCB0cmFpbFxuICAgICAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSBpZiAoaSArIDEgPT09IGxlbmd0aCkge1xuICAgICAgICAgIC8vIHVucGFpcmVkIGxlYWRcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFsaWQgbGVhZFxuICAgICAgICBsZWFkU3Vycm9nYXRlID0gY29kZVBvaW50XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gMiBsZWFkcyBpbiBhIHJvd1xuICAgICAgaWYgKGNvZGVQb2ludCA8IDB4REMwMCkge1xuICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICAvLyB2YWxpZCBzdXJyb2dhdGUgcGFpclxuICAgICAgY29kZVBvaW50ID0gKGxlYWRTdXJyb2dhdGUgLSAweEQ4MDAgPDwgMTAgfCBjb2RlUG9pbnQgLSAweERDMDApICsgMHgxMDAwMFxuICAgIH0gZWxzZSBpZiAobGVhZFN1cnJvZ2F0ZSkge1xuICAgICAgLy8gdmFsaWQgYm1wIGNoYXIsIGJ1dCBsYXN0IGNoYXIgd2FzIGEgbGVhZFxuICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgfVxuXG4gICAgbGVhZFN1cnJvZ2F0ZSA9IG51bGxcblxuICAgIC8vIGVuY29kZSB1dGY4XG4gICAgaWYgKGNvZGVQb2ludCA8IDB4ODApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMSkgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChjb2RlUG9pbnQpXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDgwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2IHwgMHhDMCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTAwMDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyB8IDB4RTAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDYgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ICYgMHgzRiB8IDB4ODBcbiAgICAgIClcbiAgICB9IGVsc2UgaWYgKGNvZGVQb2ludCA8IDB4MTEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDQpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweDEyIHwgMHhGMCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4QyAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBjb2RlIHBvaW50JylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnl0ZXNcbn1cblxuZnVuY3Rpb24gYXNjaWlUb0J5dGVzIChzdHIpIHtcbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgLy8gTm9kZSdzIGNvZGUgc2VlbXMgdG8gYmUgZG9pbmcgdGhpcyBhbmQgbm90ICYgMHg3Ri4uXG4gICAgYnl0ZUFycmF5LnB1c2goc3RyLmNoYXJDb2RlQXQoaSkgJiAweEZGKVxuICB9XG4gIHJldHVybiBieXRlQXJyYXlcbn1cblxuZnVuY3Rpb24gdXRmMTZsZVRvQnl0ZXMgKHN0ciwgdW5pdHMpIHtcbiAgdmFyIGMsIGhpLCBsb1xuICB2YXIgYnl0ZUFycmF5ID0gW11cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKHVuaXRzIC09IDIpIDwgMCkgYnJlYWtcblxuICAgIGMgPSBzdHIuY2hhckNvZGVBdChpKVxuICAgIGhpID0gYyA+PiA4XG4gICAgbG8gPSBjICUgMjU2XG4gICAgYnl0ZUFycmF5LnB1c2gobG8pXG4gICAgYnl0ZUFycmF5LnB1c2goaGkpXG4gIH1cblxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIGJhc2U2NFRvQnl0ZXMgKHN0cikge1xuICByZXR1cm4gYmFzZTY0LnRvQnl0ZUFycmF5KGJhc2U2NGNsZWFuKHN0cikpXG59XG5cbmZ1bmN0aW9uIGJsaXRCdWZmZXIgKHNyYywgZHN0LCBvZmZzZXQsIGxlbmd0aCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChpICsgb2Zmc2V0ID49IGRzdC5sZW5ndGgpIHx8IChpID49IHNyYy5sZW5ndGgpKSBicmVha1xuICAgIGRzdFtpICsgb2Zmc2V0XSA9IHNyY1tpXVxuICB9XG4gIHJldHVybiBpXG59XG5cbi8vIEFycmF5QnVmZmVyIG9yIFVpbnQ4QXJyYXkgb2JqZWN0cyBmcm9tIG90aGVyIGNvbnRleHRzIChpLmUuIGlmcmFtZXMpIGRvIG5vdCBwYXNzXG4vLyB0aGUgYGluc3RhbmNlb2ZgIGNoZWNrIGJ1dCB0aGV5IHNob3VsZCBiZSB0cmVhdGVkIGFzIG9mIHRoYXQgdHlwZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE2NlxuZnVuY3Rpb24gaXNJbnN0YW5jZSAob2JqLCB0eXBlKSB7XG4gIHJldHVybiBvYmogaW5zdGFuY2VvZiB0eXBlIHx8XG4gICAgKG9iaiAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3RvciAhPSBudWxsICYmIG9iai5jb25zdHJ1Y3Rvci5uYW1lICE9IG51bGwgJiZcbiAgICAgIG9iai5jb25zdHJ1Y3Rvci5uYW1lID09PSB0eXBlLm5hbWUpXG59XG5mdW5jdGlvbiBudW1iZXJJc05hTiAob2JqKSB7XG4gIC8vIEZvciBJRTExIHN1cHBvcnRcbiAgcmV0dXJuIG9iaiAhPT0gb2JqIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG59XG4iLCIvKiEgaWVlZTc1NC4gQlNELTMtQ2xhdXNlIExpY2Vuc2UuIEZlcm9zcyBBYm91a2hhZGlqZWggPGh0dHBzOi8vZmVyb3NzLm9yZy9vcGVuc291cmNlPiAqL1xuZXhwb3J0cy5yZWFkID0gZnVuY3Rpb24gKGJ1ZmZlciwgb2Zmc2V0LCBpc0xFLCBtTGVuLCBuQnl0ZXMpIHtcbiAgdmFyIGUsIG1cbiAgdmFyIGVMZW4gPSAobkJ5dGVzICogOCkgLSBtTGVuIC0gMVxuICB2YXIgZU1heCA9ICgxIDw8IGVMZW4pIC0gMVxuICB2YXIgZUJpYXMgPSBlTWF4ID4+IDFcbiAgdmFyIG5CaXRzID0gLTdcbiAgdmFyIGkgPSBpc0xFID8gKG5CeXRlcyAtIDEpIDogMFxuICB2YXIgZCA9IGlzTEUgPyAtMSA6IDFcbiAgdmFyIHMgPSBidWZmZXJbb2Zmc2V0ICsgaV1cblxuICBpICs9IGRcblxuICBlID0gcyAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBzID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBlTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IGUgPSAoZSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBtID0gZSAmICgoMSA8PCAoLW5CaXRzKSkgLSAxKVxuICBlID4+PSAoLW5CaXRzKVxuICBuQml0cyArPSBtTGVuXG4gIGZvciAoOyBuQml0cyA+IDA7IG0gPSAobSAqIDI1NikgKyBidWZmZXJbb2Zmc2V0ICsgaV0sIGkgKz0gZCwgbkJpdHMgLT0gOCkge31cblxuICBpZiAoZSA9PT0gMCkge1xuICAgIGUgPSAxIC0gZUJpYXNcbiAgfSBlbHNlIGlmIChlID09PSBlTWF4KSB7XG4gICAgcmV0dXJuIG0gPyBOYU4gOiAoKHMgPyAtMSA6IDEpICogSW5maW5pdHkpXG4gIH0gZWxzZSB7XG4gICAgbSA9IG0gKyBNYXRoLnBvdygyLCBtTGVuKVxuICAgIGUgPSBlIC0gZUJpYXNcbiAgfVxuICByZXR1cm4gKHMgPyAtMSA6IDEpICogbSAqIE1hdGgucG93KDIsIGUgLSBtTGVuKVxufVxuXG5leHBvcnRzLndyaXRlID0gZnVuY3Rpb24gKGJ1ZmZlciwgdmFsdWUsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtLCBjXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBydCA9IChtTGVuID09PSAyMyA/IE1hdGgucG93KDIsIC0yNCkgLSBNYXRoLnBvdygyLCAtNzcpIDogMClcbiAgdmFyIGkgPSBpc0xFID8gMCA6IChuQnl0ZXMgLSAxKVxuICB2YXIgZCA9IGlzTEUgPyAxIDogLTFcbiAgdmFyIHMgPSB2YWx1ZSA8IDAgfHwgKHZhbHVlID09PSAwICYmIDEgLyB2YWx1ZSA8IDApID8gMSA6IDBcblxuICB2YWx1ZSA9IE1hdGguYWJzKHZhbHVlKVxuXG4gIGlmIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPT09IEluZmluaXR5KSB7XG4gICAgbSA9IGlzTmFOKHZhbHVlKSA/IDEgOiAwXG4gICAgZSA9IGVNYXhcbiAgfSBlbHNlIHtcbiAgICBlID0gTWF0aC5mbG9vcihNYXRoLmxvZyh2YWx1ZSkgLyBNYXRoLkxOMilcbiAgICBpZiAodmFsdWUgKiAoYyA9IE1hdGgucG93KDIsIC1lKSkgPCAxKSB7XG4gICAgICBlLS1cbiAgICAgIGMgKj0gMlxuICAgIH1cbiAgICBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIHZhbHVlICs9IHJ0IC8gY1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSArPSBydCAqIE1hdGgucG93KDIsIDEgLSBlQmlhcylcbiAgICB9XG4gICAgaWYgKHZhbHVlICogYyA+PSAyKSB7XG4gICAgICBlKytcbiAgICAgIGMgLz0gMlxuICAgIH1cblxuICAgIGlmIChlICsgZUJpYXMgPj0gZU1heCkge1xuICAgICAgbSA9IDBcbiAgICAgIGUgPSBlTWF4XG4gICAgfSBlbHNlIGlmIChlICsgZUJpYXMgPj0gMSkge1xuICAgICAgbSA9ICgodmFsdWUgKiBjKSAtIDEpICogTWF0aC5wb3coMiwgbUxlbilcbiAgICAgIGUgPSBlICsgZUJpYXNcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IHZhbHVlICogTWF0aC5wb3coMiwgZUJpYXMgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gMFxuICAgIH1cbiAgfVxuXG4gIGZvciAoOyBtTGVuID49IDg7IGJ1ZmZlcltvZmZzZXQgKyBpXSA9IG0gJiAweGZmLCBpICs9IGQsIG0gLz0gMjU2LCBtTGVuIC09IDgpIHt9XG5cbiAgZSA9IChlIDw8IG1MZW4pIHwgbVxuICBlTGVuICs9IG1MZW5cbiAgZm9yICg7IGVMZW4gPiAwOyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBlICYgMHhmZiwgaSArPSBkLCBlIC89IDI1NiwgZUxlbiAtPSA4KSB7fVxuXG4gIGJ1ZmZlcltvZmZzZXQgKyBpIC0gZF0gfD0gcyAqIDEyOFxufVxuIiwiJ3VzZSBzdHJpY3QnO1xyXG5jb25zdCB0b3BvbG9neURPTT1yZXF1aXJlKFwiLi90b3BvbG9neURPTS5qc1wiKVxyXG5jb25zdCBtYXBET009cmVxdWlyZShcIi4vbWFwRE9NLmpzXCIpXHJcbmNvbnN0IHR3aW5zVHJlZT1yZXF1aXJlKFwiLi90d2luc1RyZWVcIilcclxuY29uc3Qgc3RhcnRTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9zdGFydFNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IHByb2plY3RTZXR0aW5nRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3Byb2plY3RTZXR0aW5nRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIik7XHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzLmpzXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IG5ld1R3aW5EaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL25ld1R3aW5EaWFsb2dcIik7XHJcbmNvbnN0IGZsb2F0SW5mb1dpbmRvdz1yZXF1aXJlKFwiLi9mbG9hdEluZm9XaW5kb3dcIilcclxuY29uc3Qgc2VydmljZVdvcmtlckhlbHBlcj1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2VydmljZVdvcmtlckhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gZGlnaXRhbHR3aW5tb2R1bGVVSSgpIHtcclxuICAgIHRoaXMuaW5pdFVJTGF5b3V0KClcclxuXHJcbiAgICB0aGlzLnR3aW5zVHJlZT0gbmV3IHR3aW5zVHJlZSgkKFwiI3RyZWVIb2xkZXJcIiksJChcIiN0cmVlU2VhcmNoXCIpKVxyXG4gICAgXHJcbiAgICBtYWluVG9vbGJhci5yZW5kZXIoKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlPW5ldyB0b3BvbG9neURPTSgkKCcjY2FudmFzJykpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2UuaW5pdCgpXHJcblxyXG4gICAgdGhpcy5tYXBET00gPSBuZXcgbWFwRE9NKCQoJyNjYW52YXMnKSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuXHJcbiAgICAvL3RyeSBpZiBpdCBhbHJlYWR5IEIyQyBzaWduZWQgaW4sIGlmIG5vdCBnb2luZyBiYWNrIHRvIHRoZSBzdGFydCBwYWdlXHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG5cclxuXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpO1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbCAmJiAhZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3QpIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuXHJcbiAgICB0aGlzLmluaXREYXRhKClcclxufVxyXG5cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXREYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsc3RhcnRTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIG1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSx0aGlzLm1hcERPTSxpbmZvUGFuZWwsbmV3VHdpbkRpYWxvZyxmbG9hdEluZm9XaW5kb3cscHJvamVjdFNldHRpbmdEaWFsb2csc2VydmljZVdvcmtlckhlbHBlcixnbG9iYWxDYWNoZV1cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAwLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2luaXRDbG9zZWQ6XHR0cnVlXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgLypcclxuICAgICAqXHRESVNBQkxFIFRFWFQtU0VMRUNUSU9OIFdIRU4gRFJBR0dJTkcgKG9yIGV2ZW4gX3RyeWluZ18gdG8gZHJhZyEpXHJcbiAgICAgKlx0dGhpcyBmdW5jdGlvbmFsaXR5IHdpbGwgYmUgaW5jbHVkZWQgaW4gUkMzMC44MFxyXG4gICAgICovXHJcbiAgICAkLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJ1xyXG4gICAgICAgICAgICAsIHggPSAndGV4dFNlbGVjdGlvbkluaXRpYWxpemVkJ1xyXG4gICAgICAgICAgICA7XHJcbiAgICAgICAgaWYgKCQuZm4uZGlzYWJsZVNlbGVjdGlvbikge1xyXG4gICAgICAgICAgICBpZiAoISRkLmRhdGEoeCkpIC8vIGRvY3VtZW50IGhhc24ndCBiZWVuIGluaXRpYWxpemVkIHlldFxyXG4gICAgICAgICAgICAgICAgJGQub24oJ21vdXNldXAnLCAkLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uKS5kYXRhKHgsIHRydWUpO1xyXG4gICAgICAgICAgICBpZiAoISRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICAgICAkZC5kaXNhYmxlU2VsZWN0aW9uKCkuZGF0YShzLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnO1xyXG4gICAgICAgIGlmICgkLmZuLmVuYWJsZVNlbGVjdGlvbiAmJiAkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAkZC5lbmFibGVTZWxlY3Rpb24oKS5kYXRhKHMsIGZhbHNlKTtcclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5lbmFibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJChcIi51aS1sYXlvdXQtcmVzaXplci1ub3J0aFwiKS5oaWRlKClcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuY3NzKFwiYm9yZGVyLXJpZ2h0XCIsXCJzb2xpZCAxcHggbGlnaHRHcmF5XCIpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmFkZENsYXNzKFwidzMtY2FyZFwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZGlnaXRhbHR3aW5tb2R1bGVVSSgpOyIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdExheW91dERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKXtcclxuICAgICAgICB2YXIgb25lTGF5b3V0T2JqPWdsb2JhbENhY2hlLmxheW91dEpTT05baW5kXVxyXG4gICAgICAgIGlmKG9uZUxheW91dE9iai5vd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCIzMjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPkxheW91dDwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjE4MHB4OyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkZpbGwgaW4gYSBuZXcgbGF5b3V0IG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgdmFyIHNhdmVBc05ld0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCI+U2F2ZSBOZXcgTGF5b3V0PC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNOZXdCdG4pXHJcbiAgICBzYXZlQXNOZXdCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChuYW1lSW5wdXQudmFsKCkpfSlcclxuXHJcblxyXG4gICAgaWYoISQuaXNFbXB0eU9iamVjdChnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSl7XHJcbiAgICAgICAgdmFyIGxibD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLXBhZGRpbmctMTZcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPi0gT1IgLTwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGxibCkgXHJcbiAgICAgICAgdmFyIHN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2ZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIix3aWR0aDpcIjEyMHB4XCJ9KVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9c3dpdGNoTGF5b3V0U2VsZWN0b3JcclxuICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIGlmKG9wdGlvblRleHQ9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIiBcIilcclxuICAgICAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHZhciBzYXZlQXNCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDo1cHhcIj5TYXZlIEFzPC9idXR0b24+JylcclxuICAgICAgICB2YXIgZGVsZXRlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHhcIj5EZWxldGUgTGF5b3V0PC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzQnRuLHN3aXRjaExheW91dFNlbGVjdG9yLkRPTSxkZWxldGVCdG4pXHJcbiAgICAgICAgc2F2ZUFzQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG5cclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5zYXZlSW50b0xheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNhdmVMYXlvdXRcIiwgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWV9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIkNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVMYXlvdXRcIiwgXCJQT1NUXCIsIHsgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBiYXNlSW5mb1BhbmVsID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2Jhc2VJbmZvUGFuZWxcIilcclxuXHJcblxyXG5jbGFzcyBmbG9hdEluZm9XaW5kb3cgZXh0ZW5kcyBiYXNlSW5mb1BhbmVse1xyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcbiAgICAgICAgc3VwZXIoKVxyXG4gICAgICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjEwMTtcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgICAgICAgICAgdGhpcy5ET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpXCIpXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVhZE9ubHk9dHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIGhpZGVTZWxmKCl7XHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjBweFwiKVxyXG4gICAgICAgIGlmKHRoaXMuYVRpbWVyU2luY2VTaG93aW5nKSBjbGVhclRpbWVvdXQodGhpcy5hVGltZXJTaW5jZVNob3dpbmcpXHJcbiAgICAgICAgdGhpcy5hVGltZXJTaW5jZVNob3dpbmc9bnVsbDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTaG93aW5nVHdpbklEPW51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJ4TWVzc2FnZShtc2dQYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcInRvcG9sb2d5TW91c2VPdXRcIikge1xyXG4gICAgICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgICAgICB9IGVsc2UgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcInNob3dJbmZvSG92ZXJlZEVsZVwiKSB7XHJcbiAgICAgICAgICAgIGlmICghZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICAgICAgICAgIHZhciBhcnIgPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgICAgIGlmIChhcnIgPT0gbnVsbCB8fCBhcnIubGVuZ3RoID09IDApIHJldHVybjtcclxuICAgICAgICAgICAgdGhpcy5ET00uY3NzKFwibGVmdFwiLCBcIi0yMDAwcHhcIikgLy9pdCBpcyBhbHdheXMgb3V0c2lkZSBvZiBicm93c2VyIHNvIGl0IHdvbnQgYmxvY2sgbW91c2UgYW5kIGNhdXNlIG1vdXNlIG91dFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvID0gYXJyWzBdO1xyXG4gICAgICAgICAgICBzaW5nbGVFbGVtZW50SW5mbz10aGlzLmZldGNoUmVhbEVsZW1lbnRJbmZvKHNpbmdsZUVsZW1lbnRJbmZvKVxyXG4gICAgICAgICAgICBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSkgdGhpcy5jdXJyZW50U2hvd2luZ1R3aW5JRD1zaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjI5NXB4XCIpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIvPicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIGRvY3VtZW50Qm9keVdpZHRoID0gJCgnYm9keScpLndpZHRoKClcclxuICAgICAgICAgICAgaWYgKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pIHsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgICAgICB2YXIgc2luZ2xlREJUd2luSW5mbz1nbG9iYWxDYWNoZS5EQlR3aW5zW3NpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTaW5nbGVOb2RlUHJvcGVydGllcyhzaW5nbGVEQlR3aW5JbmZvLHNpbmdsZUVsZW1lbnRJbmZvLGNvbnRlbnRET00sXCJub3RFbWJlZE1ldGFkYXRhXCIpXHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1NpbmdsZVJlbGF0aW9uUHJvcGVydGllcyhzaW5nbGVFbGVtZW50SW5mbyxjb250ZW50RE9NKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgc2NyZWVuWFkgPSBtc2dQYXlsb2FkLnNjcmVlblhZXHJcbiAgICAgICAgICAgIHZhciB3aW5kb3dMZWZ0ID0gc2NyZWVuWFkueCArIDUwXHJcblxyXG4gICAgICAgICAgICBpZiAod2luZG93TGVmdCArIHRoaXMuRE9NLm91dGVyV2lkdGgoKSArIDEwID4gZG9jdW1lbnRCb2R5V2lkdGgpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvd0xlZnQgPSBkb2N1bWVudEJvZHlXaWR0aCAtIHRoaXMuRE9NLm91dGVyV2lkdGgoKSAtIDEwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIHdpbmRvd1RvcCA9IHNjcmVlblhZLnkgLSB0aGlzLkRPTS5vdXRlckhlaWdodCgpIC0gNTBcclxuICAgICAgICAgICAgaWYgKHdpbmRvd1RvcCA8IDUpIHdpbmRvd1RvcCA9IDVcclxuICAgICAgICAgICAgdGhpcy5ET00uY3NzKHsgXCJsZWZ0XCI6IHdpbmRvd0xlZnQgKyBcInB4XCIsIFwidG9wXCI6IHdpbmRvd1RvcCArIFwicHhcIiB9KVxyXG5cclxuICAgICAgICAgICAgaWYodGhpcy5jdXJyZW50U2hvd2luZ1R3aW5JRD09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB2YXIgZGJ0d2luPSBnbG9iYWxDYWNoZS5EQlR3aW5zW3RoaXMuY3VycmVudFNob3dpbmdUd2luSURdXHJcbiAgICAgICAgICAgIGlmKCFkYnR3aW4gfHwgIWRidHdpbi5vcmlnaW5hbFNjcmlwdCB8fCBkYnR3aW4ub3JpZ2luYWxTY3JpcHQ9PVwiXCIpIHJldHVybjtcclxuICAgICAgICAgICAgLy92YXIgZGl2PSQoJzxkaXY+JytkYnR3aW4ub3JpZ2luYWxTY3JpcHQrJzwvZGl2PicpXHJcbiAgICAgICAgICAgIC8vdGhpcy5ET00uYXBwZW5kKGRpdilcclxuICAgICAgICAgICAgdmFyIGhvbGRlckRpdj0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZzoxcHhcIi8+JylcclxuICAgICAgICAgICAgdmFyIHNjcmlwdFRleHRBcmVhPSQoJzx0ZXh0YXJlYSBjbGFzcz1cInczLWJvcmRlclwiIHNwZWxsY2hlY2s9XCJmYWxzZVwiIHN0eWxlPVwib3V0bGluZTpub25lO2ZvbnQtc2l6ZToxMXB4O3dpZHRoOjEwMCU7Zm9udC1mYW1pbHk6VmVyZGFuYVwiPicrZGJ0d2luW1wib3JpZ2luYWxTY3JpcHRcIl0rJzwvdGV4dGFyZWE+JylcclxuICAgICAgICAgICAgdGhpcy5ET00uYXBwZW5kKGhvbGRlckRpdi5hcHBlbmQoc2NyaXB0VGV4dEFyZWEpKVxyXG4gICAgICAgICAgICBzY3JpcHRUZXh0QXJlYS5jc3MoXCJoZWlnaHRcIixcIjFweFwiKSAvL3RvIGV4cGFuZCBzY3JpcHRUZXh0QXJlYSB0byB0aGUgaGVpZ2h0IHRoYXQgc2hvd3MgYWxsIGNvZGVcclxuICAgICAgICAgICAgdmFyIHRoZUhlaWdodD1zY3JpcHRUZXh0QXJlYVswXS5zY3JvbGxIZWlnaHQrMlxyXG4gICAgICAgICAgICBzY3JpcHRUZXh0QXJlYS5jc3MoXCJoZWlnaHRcIix0aGVIZWlnaHQrXCJweFwiKVxyXG4gICAgICAgICAgICBzY3JpcHRUZXh0QXJlYS5oaWdobGlnaHRXaXRoaW5UZXh0YXJlYShcclxuICAgICAgICAgICAgICAgIHsgaGlnaGxpZ2h0OiBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyBcImhpZ2hsaWdodFwiOiBcIl9zZWxmXCIsIFwiY2xhc3NOYW1lXCI6IFwiR3JheVwifSxcclxuICAgICAgICAgICAgICAgICAgICB7IFwiaGlnaGxpZ2h0XCI6IFwiX3R3aW5WYWxcIiwgXCJjbGFzc05hbWVcIjogXCJrZXl3b3JkXCJ9LFxyXG4gICAgICAgICAgICAgICAgXX1cclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgaG9sZGVyRGl2LmNzcyhcImhlaWdodFwiLHRoZUhlaWdodCtcInB4XCIpXHJcbiAgICAgICAgICAgIGhvbGRlckRpdi5oaWRlKClcclxuXHJcbiAgICAgICAgICAgIHZhciBkaXY9JCgnPGRpdiBjbGFzcz1cInczLWFtYmVyXCIgc3R5bGU9XCJmb250LXNpemU6NnB4O3RleHQtYWxpZ246Y2VudGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtaFwiPjwvaT48L2Rpdj4nKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGl2KVxyXG4gICAgICAgICAgICBkaXYuZmFkZVRvKDQwMCwwLjMsXCJzd2luZ1wiLCgpPT57XHJcbiAgICAgICAgICAgICAgICBkaXYuZmFkZVRvKDQwMCwxLFwic3dpbmdcIiwoKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgIGRpdi5mYWRlVG8oNDAwLDAuMyxcInN3aW5nXCIsKCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGl2LmZhZGVUbyg0MDAsMSxcInN3aW5nXCIsKCk9PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhvbGRlckRpdi5zbGlkZURvd24oXCJmYXN0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0pICAgIFxyXG4gICAgICAgICAgICB9KVxyXG5cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZmxvYXRJbmZvV2luZG93KCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGJhc2VJbmZvUGFuZWwgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvYmFzZUluZm9QYW5lbFwiKVxyXG5jb25zdCBzaW1wbGVFeHBhbmRhYmxlU2VjdGlvbj0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUV4cGFuZGFibGVTZWN0aW9uXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNjcmlwdFRlc3REaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2NyaXB0VGVzdERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVDaGFydD0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNoYXJ0XCIpXHJcblxyXG5jbGFzcyBpbmZvUGFuZWwgZXh0ZW5kcyBiYXNlSW5mb1BhbmVsIHtcclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHN1cGVyKClcclxuICAgICAgICB0aGlzLm9wZW5MaXZlQ2FsY3VsYXRpb25TZWN0aW9uPXRydWVcclxuICAgICAgICB0aGlzLm9wZW5Qcm9wZXJ0aWVzU2VjdGlvbj10cnVlXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzUwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5oaWRlKClcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjUwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48L2Rpdj4nKSlcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbjEgPSAkKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPjxpIGNsYXNzPVwiZmEgZmEtaW5mby1jaXJjbGUgZmEtMnhcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5jbG9zZUJ1dHRvbjIgPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtXCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSwgdGhpcy5jbG9zZUJ1dHRvbjIpXHJcblxyXG4gICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQgPSBmYWxzZTtcclxuICAgICAgICB2YXIgYnV0dG9uQW5pbSA9ICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzTWluaW1pemVkKSB0aGlzLm1pbmltaXplV2luZG93KClcclxuICAgICAgICAgICAgZWxzZSB0aGlzLmV4cGFuZFdpbmRvdygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2xvc2VCdXR0b24xLm9uKFwiY2xpY2tcIiwgYnV0dG9uQW5pbSlcclxuICAgICAgICB0aGlzLmNsb3NlQnV0dG9uMi5vbihcImNsaWNrXCIsIGJ1dHRvbkFuaW0pXHJcblxyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwicGFkZGluZzowcHg7cG9zdGlvbjphYnNvbHV0ZTt0b3A6NTBweDtoZWlnaHQ6Y2FsYygxMDAlIC0gNTBweCk7b3ZlcmZsb3c6aGlkZGVuXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmhvdmVyKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAxKVwiKVxyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLmNvbnRpbmVyRE9NKVxyXG5cclxuICAgICAgICB0aGlzLmVtcHR5Q29udGVudEFuZERyYXdUYWJDb250cm9sKClcclxuICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIG1pbmltaXplV2luZG93KCkge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHJpZ2h0OiBcIi0yNTBweFwiLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IFwiNTBweFwiXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmlzTWluaW1pemVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBleHBhbmRXaW5kb3coKSB7XHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgIGhlaWdodDogXCI3MCVcIlxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5pc01pbmltaXplZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHJ4TWVzc2FnZShtc2dQYXlsb2FkKSB7XHJcbiAgICAgICAgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcInN0YXJ0U2VsZWN0aW9uRGlhbG9nX2Nsb3NlZFwiKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jb250aW5lckRPTS5pcyhcIjp2aXNpYmxlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLnNob3coKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobXNnUGF5bG9hZC5tZXNzYWdlID09IFwibWFwRmx5aW5nU3RhcnRcIikge1xyXG4gICAgICAgICAgICB0aGlzLm1pbmltaXplV2luZG93KClcclxuICAgICAgICB9IGVsc2UgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcIm1hcEZseWluZ0VuZFwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kV2luZG93KClcclxuICAgICAgICB9IGVsc2UgaWYgKG1zZ1BheWxvYWQubWVzc2FnZSA9PSBcIm1hcFNlbGVjdEZlYXR1cmVcIikge1xyXG4gICAgICAgICAgICBpZiAobXNnUGF5bG9hZC5EQlR3aW4gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHR3aW5JRCA9IG1zZ1BheWxvYWQuREJUd2luLmlkXHJcbiAgICAgICAgICAgICAgICB2YXIgYWR0VHdpbiA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF1cclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0luZm9PZk5vZGVzKFthZHRUd2luXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSBpZiAobXNnUGF5bG9hZC5tZXNzYWdlID09IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIgfHwgbXNnUGF5bG9hZC5tZXNzYWdlID09IFwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpIHtcclxuICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCAmJiBtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJzaG93SW5mb0hvdmVyZWRFbGVcIikgcmV0dXJuOyAvL3RoZSBmbG9hdGluZyBpbmZvIHdpbmRvdyB3aWxsIHNob3cgbW91c2Ugb3ZlciBlbGVtZW50IGluZm9ybWF0aW9uLCBkbyBub3QgY2hhbmdlIGluZm8gcGFuZWwgY29udGVudCBpbiB0aGlzIGNhc2VcclxuICAgICAgICAgICAgdGhpcy5zaG93SW5mb09mTm9kZXMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzaG93SW5mb09mTm9kZXMoYXJyKSB7XHJcbiAgICAgICAgdGhpcy5lbXB0eUNvbnRlbnRBbmREcmF3VGFiQ29udHJvbCgpXHJcbiAgICAgICAgaWYgKGFyciA9PSBudWxsIHx8IGFyci5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzID0gW107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMgPSBhcnI7XHJcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm8gPSBhcnJbMF07XHJcblxyXG4gICAgICAgICAgICBzaW5nbGVFbGVtZW50SW5mbz10aGlzLmZldGNoUmVhbEVsZW1lbnRJbmZvKHNpbmdsZUVsZW1lbnRJbmZvKVxyXG4gICAgICAgICAgICBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSkgey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVOb2RlXCIpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZVJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgcHJvcGVydGllc1NlY3Rpb249IG5ldyBzaW1wbGVFeHBhbmRhYmxlU2VjdGlvbihcIlByb3BlcnRpZXMgU2VjdGlvblwiLHRoaXMuaW5mb0NvbnRlbnREaXYse1wibWFyZ2luVG9wXCI6XCIycHhcIn0pXHJcbiAgICAgICAgICAgIHByb3BlcnRpZXNTZWN0aW9uLmNhbGxCYWNrX2NoYW5nZT0oc3RhdHVzKT0+e3RoaXMub3BlblByb3BlcnRpZXNTZWN0aW9uPXN0YXR1c31cclxuICAgICAgICAgICAgaWYodGhpcy5vcGVuUHJvcGVydGllc1NlY3Rpb24pIHByb3BlcnRpZXNTZWN0aW9uLmV4cGFuZCgpXHJcblxyXG4gICAgICAgICAgICBpZiAoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSkgey8vIHNlbGVjdCBhIG5vZGVcclxuICAgICAgICAgICAgICAgIHZhciBzaW5nbGVEQlR3aW5JbmZvPWdsb2JhbENhY2hlLkRCVHdpbnNbc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1NpbmdsZU5vZGVQcm9wZXJ0aWVzKHNpbmdsZURCVHdpbkluZm8sc2luZ2xlRWxlbWVudEluZm8scHJvcGVydGllc1NlY3Rpb24ubGlzdERPTSlcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U2luZ2xlUmVsYXRpb25Qcm9wZXJ0aWVzKHNpbmdsZUVsZW1lbnRJbmZvLHByb3BlcnRpZXNTZWN0aW9uLmxpc3RET00pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKSB0aGlzLmRyYXdGb3JtdWxhU2VjdGlvbihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdLHNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdKVxyXG4gICAgICAgIH0gZWxzZSBpZiAoYXJyLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZW1wdHlDb250ZW50QW5kRHJhd1RhYkNvbnRyb2woKXtcclxuICAgICAgICBpZih0aGlzLmluZm9Db250ZW50RGl2KSB0aGlzLmluZm9Db250ZW50RGl2LmVtcHR5KClcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgICAgIHZhciB0YWJDb250cm9sPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtbGlnaHQtZ3JheSBcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICB2YXIgaW5mb0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO1wiPkluZm9ybWF0aW9uPC9idXR0b24+JylcclxuICAgICAgICAgICAgdmFyIGxpdmVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZDtcIj5MaXZlPC9idXR0b24+JylcclxuICAgICAgICAgICAgdGFiQ29udHJvbC5hcHBlbmQoaW5mb0J0bixsaXZlQnRuKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hcHBlbmQodGFiQ29udHJvbClcclxuXHJcbiAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRlbnREaXY9JCgnPGRpdiBjbGFzcz1cInczLWFuaW1hdGUtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy10b3A6NXB4O2Rpc3BsYXk6bm9uZTtoZWlnaHQ6Y2FsYygxMDAlIC0gMzZweCk7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgIHRoaXMubGl2ZUNvbnRlbnREaXY9JCgnPGRpdiBpZD1cIm15Q2hhcnRcIiBjbGFzcz1cInczLWFuaW1hdGUtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy10b3A6NXB4O2Rpc3BsYXk6bm9uZTtoZWlnaHQ6Y2FsYygxMDAlIC0gMzZweCk7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmluZm9Db250ZW50RGl2LHRoaXMubGl2ZUNvbnRlbnREaXYpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgYUNoYXJ0PW5ldyBzaW1wbGVDaGFydCh0aGlzLmxpdmVDb250ZW50RGl2LDYwLHt3aWR0aDpcIjEwMCVcIixoZWlnaHQ6XCIxMDBweFwifSlcclxuXHJcbiAgICAgICAgICAgIHNldEludGVydmFsKCgpPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgdmFsPSBwYXJzZUludChNYXRoLnJhbmRvbSgpKjEwMClcclxuICAgICAgICAgICAgICAgIHZhciBub3dUaW1lPXBhcnNlSW50KChuZXcgRGF0ZSgpLmdldFRpbWUoKSkvMTAwMClcclxuICAgICAgICAgICAgICAgIGFDaGFydC5hZGREYXRhVmFsdWUobm93VGltZSx2YWwpXHJcbiAgICAgICAgICAgIH0sMTAwMClcclxuXHJcbiAgICAgICAgICAgIGluZm9CdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgICAgICBpbmZvQnRuLmFkZENsYXNzKFwidzMtd2hpdGUgdzMtdGV4dC1vcmFuZ2VcIilcclxuICAgICAgICAgICAgICAgIGxpdmVCdG4ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZSB3My10ZXh0LW9yYW5nZVwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5saXZlQ29udGVudERpdi5oaWRlKClcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRlbnREaXYuc2hvdygpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGxpdmVCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgICAgICBpbmZvQnRuLnJlbW92ZUNsYXNzKFwidzMtd2hpdGUgdzMtdGV4dC1vcmFuZ2VcIilcclxuICAgICAgICAgICAgICAgIGxpdmVCdG4uYWRkQ2xhc3MoXCJ3My13aGl0ZSB3My10ZXh0LW9yYW5nZVwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5saXZlQ29udGVudERpdi5zaG93KClcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRlbnREaXYuaGlkZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgIGluZm9CdG4udHJpZ2dlcihcImNsaWNrXCIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdCdXR0b25zKHNlbGVjdFR5cGUpIHtcclxuICAgICAgICBpZihzZWxlY3RUeXBlPT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGRpdj0kKFwiPGRpdiBzdHlsZT0ncGFkZGluZzo4cHgnPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXknPkNob29zZSB0d2lucyBvciByZWxhdGlvbnNoaXBzIHRvIHZpZXcgaW5mb21yYXRpb248L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4Jz5QcmVzcyBzaGlmdCBrZXkgdG8gZHJhdyBib3ggYW5kIHNlbGVjdCBtdWx0aXBsZSB0d2lucyBpbiB0b3BvbG9neSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3MgY3RybCt6IGFuZCBjdHJsK3kgdG8gdW5kby9yZWRvIGluIHRvcG9sb2d5IHZpZXc7IGN0cmwrcyB0byBzYXZlIGxheW91dDwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3Mgc2hpZnQgb3IgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIHR3aW5zIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjEycHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgIHRoaXMuaW5mb0NvbnRlbnREaXYuYXBwZW5kKGRpdilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBidXR0b25Ib2xkZXJET009dGhpcy5pbmZvQ29udGVudERpdlxyXG5cclxuICAgICAgICB2YXIgaW1wQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2xvdWQtdXBsb2FkLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhY3R1YWxJbXBvcnRUd2luc0J0biA9ICQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgICAgIGlmIChzZWxlY3RUeXBlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIHJlZnJlc2hCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmFzIGZhLXN5bmMtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgICAgIHZhciBleHBCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmFzIGZhLWNsb3VkLWRvd25sb2FkLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgICAgICBidXR0b25Ib2xkZXJET00uYXBwZW5kKHJlZnJlc2hCdG4sIGV4cEJ0biwgaW1wQnRuLCBhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICAgICAgcmVmcmVzaEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5yZWZyZXNoSW5mb21hdGlvbigpIH0pXHJcbiAgICAgICAgICAgIGV4cEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vZmluZCBvdXQgdGhlIHR3aW5zIGluIHNlbGVjdGlvbiBhbmQgdGhlaXIgY29ubmVjdGlvbnMgKGZpbHRlciBib3RoIHNyYyBhbmQgdGFyZ2V0IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdHdpbnMpXHJcbiAgICAgICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBvcnRTZWxlY3RlZCgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYnV0dG9uSG9sZGVyRE9NLmFwcGVuZChpbXBCdG4sIGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaW1wQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4geyBhY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpOyB9KVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLmNoYW5nZShhc3luYyAoZXZ0KSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICAgICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4udmFsKFwiXCIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZiAoc2VsZWN0VHlwZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgICAgIHZhciBhcnIgPSB0aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnRbJyRkdElkJ10pIG51bU9mTm9kZSsrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKG51bU9mTm9kZSA+IDEpIHtcclxuICAgICAgICAgICAgLy9zb21lIGFkZGl0aW9uYWwgYnV0dG9ucyB3aGVuIHNlbGVjdCBtdWx0aXBsZSBpdGVtc1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucygpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucygpIHtcclxuICAgICAgICB2YXIgbGFiZWwgPSAkKFwiPGxhYmVsIGNsYXNzPSd3My1ncmF5JyBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjVweDt3aWR0aDoyMCU7dGV4dC1hbGlnbjpjZW50ZXI7Zm9udC1zaXplOjFlbTtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPkFycmFuZ2U8L2xhYmVsPlwiKVxyXG4gICAgICAgIHRoaXMuaW5mb0NvbnRlbnREaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgICAgIHZhciBhbGlnbkJ1dHRvbnNUYWJsZSA9ICQoXCI8dGFibGUgc3R5bGU9J21hcmdpbjowIGF1dG8nPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6ZGFya0dyYXknPkFMSUdOPC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjwvdGFibGU+XCIpXHJcbiAgICAgICAgdGhpcy5pbmZvQ29udGVudERpdi5hcHBlbmQoYWxpZ25CdXR0b25zVGFibGUpXHJcbiAgICAgICAgdmFyIGFsaWduVG9wQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi11cFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhbGlnbkxlZnRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWxlZnRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWxpZ25SaWdodEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tcmlnaHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgYWxpZ25Cb3R0b21CdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWRvd25cIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGFsaWduVG9wQnV0dG9uKVxyXG4gICAgICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgzKS5hcHBlbmQoYWxpZ25MZWZ0QnV0dG9uKVxyXG4gICAgICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg1KS5hcHBlbmQoYWxpZ25SaWdodEJ1dHRvbilcclxuICAgICAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoNykuYXBwZW5kKGFsaWduQm90dG9tQnV0dG9uKVxyXG5cclxuXHJcbiAgICAgICAgdmFyIGFycmFuZ2VUYWJsZSA9ICQoXCI8dGFibGUgc3R5bGU9J21hcmdpbjowIGF1dG8nPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjwvdGFibGU+XCIpXHJcbiAgICAgICAgdGhpcy5pbmZvQ29udGVudERpdi5hcHBlbmQoYXJyYW5nZVRhYmxlKVxyXG5cclxuICAgICAgICB2YXIgZGlzdHJpYnV0ZUhCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1lbGxpcHNpcy1oIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRpc3RyaWJ1dGVWQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtdiBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBsZWZ0Um90YXRlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtdW5kby1hbHQgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgcmlnaHRSb3RhdGVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1yZWRvLWFsdCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBtaXJyb3JIQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtYXJyb3dzLWFsdC1oXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIG1pcnJvclZCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1hcnJvd3MtYWx0LXZcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZXhwYW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtZXhwYW5kLWFycm93cy1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29tcHJlc3NCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1jb21wcmVzcy1hcnJvd3MtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcblxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMCkuYXBwZW5kKGRpc3RyaWJ1dGVIQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGRpc3RyaWJ1dGVWQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMikuYXBwZW5kKGxlZnRSb3RhdGVCdXR0b24pXHJcbiAgICAgICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgzKS5hcHBlbmQocmlnaHRSb3RhdGVCdXR0b24pXHJcbiAgICAgICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg0KS5hcHBlbmQobWlycm9ySEJ1dHRvbilcclxuICAgICAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDUpLmFwcGVuZChtaXJyb3JWQnV0dG9uKVxyXG4gICAgICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNikuYXBwZW5kKGV4cGFuZEJ1dHRvbilcclxuICAgICAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChjb21wcmVzc0J1dHRvbilcclxuXHJcblxyXG4gICAgICAgIGFsaWduVG9wQnV0dG9uLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInRvcFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbGlnbkxlZnRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJsZWZ0XCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGFsaWduUmlnaHRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBhbGlnbkJvdHRvbUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImJvdHRvbVwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGlzdHJpYnV0ZUhCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZGlzdHJpYnV0ZVZCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInZlcnRpY2FsXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGxlZnRSb3RhdGVCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJvdGF0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwibGVmdFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByaWdodFJvdGF0ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicm90YXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBtaXJyb3JIQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtaXJyb3JTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgbWlycm9yVkJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWlycm9yU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ2ZXJ0aWNhbFwiIH0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBleHBhbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpbWVuc2lvblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiZXhwYW5kXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbXByZXNzQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImNvbXByZXNzXCIgfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhc3luYyBleHBvcnRTZWxlY3RlZCgpIHtcclxuICAgICAgICB2YXIgYXJyID0gdGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICAgICAgaWYgKGFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIHZhciB0d2luVG9CZVN0b3JlZCA9IFtdXHJcbiAgICAgICAgdmFyIHR3aW5JRHMgPSB7fVxyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVyblxyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICB2YXIgYW5FeHBUd2luID0ge31cclxuICAgICAgICAgICAgYW5FeHBUd2luW1wiJG1ldGFkYXRhXCJdID0geyBcIiRtb2RlbFwiOiBlbGVtZW50W1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdIH1cclxuICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIGVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGlmIChpbmQgPT0gXCIkbWV0YWRhdGFcIiB8fCBpbmQgPT0gXCIkZXRhZ1wiKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXSA9IGVsZW1lbnRbaW5kXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHR3aW5Ub0JlU3RvcmVkLnB1c2goYW5FeHBUd2luKVxyXG4gICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dID0gMVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkID0gW11cclxuICAgICAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnMgPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIGlmICghcmVsYXRpb25zKSByZXR1cm47XHJcbiAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgICAgICBpZiAodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb2JqID0ge31cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpbmQgaW4gb25lUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGluZCA9PSBcIiRldGFnXCIgfHwgaW5kID09IFwiJHJlbGF0aW9uc2hpcElkXCIgfHwgaW5kID09IFwiJHNvdXJjZUlkXCIgfHwgaW5kID09IFwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqW2luZF0gPSBvbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVBY3Rpb24gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiJHNyY0lkXCI6IG9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOiBvbmVSZWxhdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjogb2JqXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9uc1RvQmVTdG9yZWQucHVzaChvbmVBY3Rpb24pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICB2YXIgZmluYWxKU09OID0geyBcInR3aW5zXCI6IHR3aW5Ub0JlU3RvcmVkLCBcInJlbGF0aW9uc1wiOiByZWxhdGlvbnNUb0JlU3RvcmVkIH1cclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydFR3aW5zRGF0YS5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVhZE9uZUZpbGUoYUZpbGUpIHtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpIHtcclxuICAgICAgICB2YXIgaW1wb3J0VHdpbnMgPSBbXVxyXG4gICAgICAgIHZhciBpbXBvcnRSZWxhdGlvbnMgPSBbXVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpPCBmaWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZj1maWxlc1tpXVxyXG4gICAgICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICAgICAgaWYgKGYudHlwZSAhPSBcImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICAgICAgdmFyIG9iaiA9IEpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICAgICAgaWYgKG9iai50d2lucykgaW1wb3J0VHdpbnMgPSBpbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICAgICAgaWYgKG9iai5yZWxhdGlvbnMpIGltcG9ydFJlbGF0aW9ucyA9IGltcG9ydFJlbGF0aW9ucy5jb25jYXQob2JqLnJlbGF0aW9ucylcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICAgICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBvbGRUd2luSUQyTmV3SUQgPSB7fVxyXG4gICAgICAgIGltcG9ydFR3aW5zLmZvckVhY2gob25lVHdpbiA9PiB7XHJcbiAgICAgICAgICAgIHZhciBvbGRJRCA9IG9uZVR3aW5bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICB2YXIgbmV3SUQgPSB1dWlkdjQoKTtcclxuICAgICAgICAgICAgb2xkVHdpbklEMk5ld0lEW29sZElEXSA9IG5ld0lEXHJcbiAgICAgICAgICAgIG9uZVR3aW5bXCIkZHRJZFwiXSA9IG5ld0lEXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IGltcG9ydFJlbGF0aW9ucy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgb25lUmVsID0gaW1wb3J0UmVsYXRpb25zW2ldXHJcbiAgICAgICAgICAgIGlmIChvbGRUd2luSUQyTmV3SURbb25lUmVsW1wiJHNyY0lkXCJdXSA9PSBudWxsIHx8IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGltcG9ydFJlbGF0aW9ucy5zcGxpY2UoaSwgMSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG9uZVJlbFtcIiRzcmNJZFwiXSA9IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dXHJcbiAgICAgICAgICAgICAgICBvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl0gPSBvbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXVxyXG4gICAgICAgICAgICAgICAgb25lUmVsW1wiJHJlbGF0aW9uc2hpcElkXCJdID0gdXVpZHY0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9iYXRjaEltcG9ydFR3aW5zXCIsIFwiUE9TVFwiLCB7IFwidHdpbnNcIjogSlNPTi5zdHJpbmdpZnkoaW1wb3J0VHdpbnMpIH0sIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmUuREJUd2lucyA9IEpTT04ucGFyc2UocmUuREJUd2lucylcclxuICAgICAgICByZS5BRFRUd2lucyA9IEpTT04ucGFyc2UocmUuQURUVHdpbnMpXHJcbiAgICAgICAgcmUuREJUd2lucy5mb3JFYWNoKERCVHdpbiA9PiB7IGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKERCVHdpbikgfSlcclxuICAgICAgICB2YXIgYWR0VHdpbnMgPSBbXVxyXG4gICAgICAgIHJlLkFEVFR3aW5zLmZvckVhY2goQURUVHdpbiA9PiB7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihBRFRUd2luKVxyXG4gICAgICAgICAgICBhZHRUd2lucy5wdXNoKEFEVFR3aW4pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIiwgXCJ0d2luc0luZm9cIjogYWR0VHdpbnMgfSlcclxuXHJcbiAgICAgICAgLy9jb250aW51ZSB0byBpbXBvcnQgcmVsYXRpb25zXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc0ltcG9ydGVkID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY3JlYXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCB7IGFjdGlvbnM6IEpTT04uc3RyaW5naWZ5KGltcG9ydFJlbGF0aW9ucykgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKHJlbGF0aW9uc0ltcG9ydGVkKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogcmVsYXRpb25zSW1wb3J0ZWQgfSlcclxuXHJcbiAgICAgICAgdmFyIG51bU9mVHdpbnMgPSBhZHRUd2lucy5sZW5ndGhcclxuICAgICAgICB2YXIgbnVtT2ZSZWxhdGlvbnMgPSByZWxhdGlvbnNJbXBvcnRlZC5sZW5ndGhcclxuICAgICAgICB2YXIgc3RyID0gXCJBZGQgXCIgKyBudW1PZlR3aW5zICsgXCIgbm9kZVwiICsgKChudW1PZlR3aW5zIDw9IDEpID8gXCJcIiA6IFwic1wiKSArIGAgKGZyb20gJHtpbXBvcnRUd2lucy5sZW5ndGh9KWBcclxuICAgICAgICBzdHIgKz0gXCIgYW5kIFwiICsgbnVtT2ZSZWxhdGlvbnMgKyBcIiByZWxhdGlvbnNoaXBcIiArICgobnVtT2ZSZWxhdGlvbnMgPD0gMSkgPyBcIlwiIDogXCJzXCIpICsgYCAoZnJvbSAke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiNDAwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJJbXBvcnQgUmVzdWx0XCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogc3RyXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBhc3luYyByZWZyZXNoSW5mb21hdGlvbigpIHtcclxuICAgICAgICB2YXIgdHdpbklEcyA9IFtdXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMuZm9yRWFjaChvbmVJdGVtID0+IHsgaWYgKG9uZUl0ZW1bJyRkdElkJ10pIHR3aW5JRHMucHVzaChvbmVJdGVtWyckZHRJZCddKSB9KVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgICAgIHR3aW5zZGF0YS5mb3JFYWNoKG9uZVJlID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0d2luSUQgPSBvbmVSZVsnJGR0SWQnXVxyXG4gICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVSZSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3aGlsZSAodHdpbklEcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JRHMuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL3JlZHJhdyBpbmZvcGFuZWwgaWYgbmVlZGVkXHJcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0ZWRPYmplY3RzLmxlbmd0aCA9PSAxKSB0aGlzLnJ4TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiB0aGlzLnNlbGVjdGVkT2JqZWN0cyB9KVxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdGb3JtdWxhU2VjdGlvbihmb3JtdWxhVHdpbklELGZvcm11bGFUd2luTW9kZWxJRCl7XHJcbiAgICAgICAgdmFyIGZvcm11bGFTZWN0aW9uPSBuZXcgc2ltcGxlRXhwYW5kYWJsZVNlY3Rpb24oXCJMaXZlIENhbGN1bGF0aW9uIFNlY3Rpb25cIix0aGlzLmluZm9Db250ZW50RGl2KVxyXG4gICAgICAgIGZvcm11bGFTZWN0aW9uLmNhbGxCYWNrX2NoYW5nZT0oc3RhdHVzKT0+e3RoaXMub3BlbkxpdmVDYWxjdWxhdGlvblNlY3Rpb249c3RhdHVzfVxyXG4gICAgICAgIGlmKHRoaXMub3BlbkxpdmVDYWxjdWxhdGlvblNlY3Rpb24pIGZvcm11bGFTZWN0aW9uLmV4cGFuZCgpXHJcblxyXG4gICAgICAgIC8vbGlzdCBhbGwgaW5jb21pbmcgdHdpbnNcclxuICAgICAgICB2YXIgaW5jb21pbmdOZWlnaGJvdXJMYmw9dGhpcy5nZW5lcmF0ZVNtYWxsS2V5RGl2KFwiSW5jb21pbmcgVHdpbnMgQW5kIFNlbGZcIixcIjJweFwiKVxyXG4gICAgICAgIHZhciBsYmwxPSQoJzxsYmwgc3R5bGU9XCJmb250LXNpemU6MTBweDtjb2xvcjpncmF5XCI+KENsaWNrIHRvIGFkZCB0d2luIG5hbWUgdG8gc2NyaXB0KTwvbGJsPicpXHJcbiAgICAgICAgaW5jb21pbmdOZWlnaGJvdXJMYmwuYXBwZW5kKGxibDEpXHJcbiAgICAgICAgZm9ybXVsYVNlY3Rpb24ubGlzdERPTS5hcHBlbmQoaW5jb21pbmdOZWlnaGJvdXJMYmwpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGluY29taW5nVHdpbnM9Z2xvYmFsQ2FjaGUuZ2V0U3RvcmVkQWxsSW5ib3VuZFJlbGF0aW9uc1NvdXJjZXMoZm9ybXVsYVR3aW5JRClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgc2NyaXB0TGJsPXRoaXMuZ2VuZXJhdGVTbWFsbEtleURpdihcIkNhbGN1bGF0aW9uIFNjcmlwdFwiLFwiMnB4XCIpXHJcbiAgICAgICAgc2NyaXB0TGJsLmNzcyhcIm1hcmdpbi10b3BcIixcIjEwcHhcIilcclxuXHJcbiAgICAgICAgdmFyIGxibDI9JCgnPGxibCBzdHlsZT1cImZvbnQtc2l6ZToxMHB4O2NvbG9yOmdyYXlcIj4oQnVpbGQgaW4gdmFyaWFibGVzOl9zZWxmIF90d2luVmFsKTwvbGJsPicpXHJcbiAgICAgICAgc2NyaXB0TGJsLmFwcGVuZChsYmwyKVxyXG5cclxuICAgICAgICB2YXIgcGxhY2VIb2xkZXJTdHI9J1NhbXBsZSYjMTYwO1NjcmlwdCYjNTg7JiMxMDsmIzEwO2lmKF90d2luVmFsW1wiaW50d2luMVwiXVtcInAxXCJdW1wiY2hpbGRQcm9wXCJdKXsmIzEwOyYjOTtfc2VsZltcIm91dFByb3BcIl09X3R3aW5WYWxbXCJpbnR3aW4xXCJdW1wicDJcIl0mIzEwO31lbHNleyYjMTA7JiM5O19zZWxmW1wib3V0UHJvcFwiXT1fdHdpblZhbFtcImludHdpbjFcIl1bXCJwMlwiXSYjMzI7KyYjMzI7JiMxMDsmIzk7JiM5O190d2luVmFsW1wiaW50d2luMlwiXVtcInAzXCJdW1wicDRcIl0mIzEwO30nXHJcbiAgICAgICAgdmFyIHNjcmlwdFRleHRBcmVhPSQoJzx0ZXh0YXJlYSBjbGFzcz1cInczLWJvcmRlclwiIHNwZWxsY2hlY2s9XCJmYWxzZVwiIHN0eWxlPVwib3V0bGluZTpub25lO2ZvbnQtc2l6ZToxMXB4O2hlaWdodDoyNDBweDt3aWR0aDoxMDAlO2ZvbnQtZmFtaWx5OlZlcmRhbmFcIiBwbGFjZWhvbGRlcj0nK3BsYWNlSG9sZGVyU3RyKyc+PC90ZXh0YXJlYT4nKVxyXG4gICAgICAgIHNjcmlwdFRleHRBcmVhLm9uKFwia2V5ZG93blwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZS5rZXlDb2RlID09IDkpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRUb1RleHRBcmVhKCdcXHQnLHNjcmlwdFRleHRBcmVhKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB2YXIgREJGb3JtdWxhVHdpbj1nbG9iYWxDYWNoZS5EQlR3aW5zW2Zvcm11bGFUd2luSURdXHJcbiAgICAgICAgaWYoREJGb3JtdWxhVHdpbiAmJiBEQkZvcm11bGFUd2luW1wib3JpZ2luYWxTY3JpcHRcIl0pIHNjcmlwdFRleHRBcmVhLnZhbChEQkZvcm11bGFUd2luW1wib3JpZ2luYWxTY3JpcHRcIl0pXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGhpZ2hsaWdodENvbG9ycz1bXHJcbiAgICAgICAgICAgIFtcIlB1cnBsZVwiLFwiI2QwYmZmZlwiXSxbXCJDeWFuXCIsXCIjMDBiY2Q0XCJdLFtcIkFtYmVyXCIsXCIjZmZjMTA3XCJdLFtcIkxpbWVcIixcIiNjZGRjMzlcIl0sW1wiUGlua1wiLFwiI2U5MWU2M1wiXVxyXG4gICAgICAgIF1cclxuICAgICAgICAvL1tcIkdyYXlcIixcIiM5ZTllOWVcIl1cclxuICAgICAgICB2YXIgaGFzSW5jb21pbmdUd2lucz1mYWxzZVxyXG4gICAgICAgIHZhciB0d2luTmFtZXNGb3JIaWdobGlnaHQ9W11cclxuICAgICAgICAvL2J1aWxkIGluIGtleSB3b3JkXHJcbiAgICAgICAgdHdpbk5hbWVzRm9ySGlnaGxpZ2h0LnB1c2goeyBcImhpZ2hsaWdodFwiOiBcIl9zZWxmXCIsIFwiY2xhc3NOYW1lXCI6IFwiR3JheVwifSlcclxuICAgICAgICB0d2luTmFtZXNGb3JIaWdobGlnaHQucHVzaCh7IFwiaGlnaGxpZ2h0XCI6IFwiX3R3aW5WYWxcIiwgXCJjbGFzc05hbWVcIjogXCJrZXl3b3JkXCJ9KVxyXG4gICAgICAgIHZhciBjb2xvckluZGV4PTA7XHJcbiAgICAgICAgZm9yKHZhciB0d2luSUQgaW4gaW5jb21pbmdUd2lucyl7XHJcbiAgICAgICAgICAgIGhhc0luY29taW5nVHdpbnM9dHJ1ZVxyXG4gICAgICAgICAgICB2YXIgdHdpbk5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVt0d2luSURdXHJcbiAgICAgICAgICAgIHR3aW5OYW1lc0ZvckhpZ2hsaWdodC5wdXNoKHsgXCJoaWdobGlnaHRcIjogdHdpbk5hbWUsIFwiY2xhc3NOYW1lXCI6IGhpZ2hsaWdodENvbG9yc1tjb2xvckluZGV4XVswXX0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVF1aWNrQnRuRm9yVHdpbih0d2luTmFtZSxoaWdobGlnaHRDb2xvcnNbY29sb3JJbmRleF1bMV0sZm9ybXVsYVNlY3Rpb24ubGlzdERPTSxzY3JpcHRUZXh0QXJlYSlcclxuICAgICAgICAgICAgY29sb3JJbmRleCsrXHJcbiAgICAgICAgICAgIGlmKGNvbG9ySW5kZXg+PWhpZ2hsaWdodENvbG9ycy5sZW5ndGgpY29sb3JJbmRleD0wXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZVF1aWNrQnRuRm9yVHdpbihcIlNlbGZcIixcIiM5ZTllOWVcIixmb3JtdWxhU2VjdGlvbi5saXN0RE9NLHNjcmlwdFRleHRBcmVhLGZvcm11bGFUd2luTW9kZWxJRClcclxuXHJcbiAgICAgICAgaWYoIWhhc0luY29taW5nVHdpbnMpZm9ybXVsYVNlY3Rpb24ubGlzdERPTS5hcHBlbmQoJCgnPGxhYmVsPk5vIGluY29taW5nIHR3aW5zPC9sYWJlbD4nKSlcclxuICAgICAgICBmb3JtdWxhU2VjdGlvbi5saXN0RE9NLmFwcGVuZChzY3JpcHRMYmwpXHJcbiAgICAgICAgZm9ybXVsYVNlY3Rpb24ubGlzdERPTS5hcHBlbmQoc2NyaXB0VGV4dEFyZWEpXHJcbiAgICAgICAgc2NyaXB0VGV4dEFyZWEuaGlnaGxpZ2h0V2l0aGluVGV4dGFyZWEoe2hpZ2hsaWdodDogdHdpbk5hbWVzRm9ySGlnaGxpZ2h0fSk7XHJcblxyXG4gICAgICAgIHZhciB0ZXN0U2NyaXB0QnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlclwiPlRlc3Q8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25maXJtU2NyaXB0QnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtZ3JlZW4gIHczLWhvdmVyLWFtYmVyXCI+Q29uZmlybTwvYnV0dG9uPicpXHJcbiAgICAgICAgZm9ybXVsYVNlY3Rpb24ubGlzdERPTS5hcHBlbmQodGVzdFNjcmlwdEJ0biwgY29uZmlybVNjcmlwdEJ0bilcclxuXHJcblxyXG4gICAgICAgIHNjcmlwdFRleHRBcmVhLm9uKFwia2V5dXBcIiwoKT0+e1xyXG4gICAgICAgICAgICBzY3JpcHRUZXN0RGlhbG9nLnNjcmlwdENvbnRlbnQ9c2NyaXB0VGV4dEFyZWEudmFsKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0ZXN0U2NyaXB0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB2YXIgdmFsdWVUZW1wbGF0ZT17fVxyXG4gICAgICAgICAgICB0aGlzLmdldFByb3BlcnR5VmFsdWVUZW1wbGF0ZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZm9ybXVsYVR3aW5Nb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXMsW10sdmFsdWVUZW1wbGF0ZSlcclxuICAgICAgICAgICAgdmFyIGlucHV0QXJyID0gZ2xvYmFsQ2FjaGUuZmluZEFsbElucHV0c0luU2NyaXB0KHNjcmlwdFRleHRBcmVhLnZhbCgpLERCRm9ybXVsYVR3aW5bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgc2NyaXB0VGVzdERpYWxvZy5wb3B1cChpbnB1dEFycixEQkZvcm11bGFUd2luW1wiZGlzcGxheU5hbWVcIl0sZm9ybXVsYVR3aW5Nb2RlbElELHZhbHVlVGVtcGxhdGUpXHJcbiAgICAgICAgICAgIHNjcmlwdFRlc3REaWFsb2cuc2NyaXB0Q29udGVudD1zY3JpcHRUZXh0QXJlYS52YWwoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29uZmlybVNjcmlwdEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5jb25maXJtU2NyaXB0KHNjcmlwdFRleHRBcmVhLnZhbCgpLGZvcm11bGFUd2luSUQsZm9ybXVsYVR3aW5Nb2RlbElELERCRm9ybXVsYVR3aW5bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGNvbmZpcm1TY3JpcHQoc2NyaXB0Q29udGVudCxmb3JtdWxhVHdpbklELGZvcm11bGFUd2luTW9kZWxJRCxmb3JtdWxhVHdpbk5hbWUpe1xyXG4gICAgICAgIC8vZGV0ZWN0IGlmIHRoZXJlIGlzIHByb2hpYml0dGVkIHdvcmRzLCBpZiBzbywgcmVqZWN0IHRoZSBzdWJtaXQgcmVxdWVzdFxyXG4gICAgICAgIGlmKHNjcmlwdENvbnRlbnQ9PVwiXCIpIHJldHVybjsgXHJcbiAgICAgICAgXHJcbiAgICAgICAgc2NyaXB0Q29udGVudD1zY3JpcHRDb250ZW50LnJlcGxhY2VBbGwoYF90d2luVmFsW1wiJHtmb3JtdWxhVHdpbk5hbWV9XCJdW2AsXCJfc2VsZltcIilcclxuICAgICAgICBzY3JpcHRDb250ZW50PXNjcmlwdENvbnRlbnQucmVwbGFjZUFsbChgX3R3aW5WYWxbJyR7Zm9ybXVsYVR3aW5OYW1lfSddW2AsXCJfc2VsZltcIilcclxuICAgICAgICAvL3RyYW5zbGF0ZSBzY3JpcHQsIHJlcGxhY2UgdHdpbnMgbmFtZSB0byB0d2lucyBJRFxyXG4gICAgICAgIHZhciB0cmFuc2xhdGVSZXN1bHQ9dGhpcy5jb252ZXJ0VG9BY3R1YWxTY3JpcHQoc2NyaXB0Q29udGVudCxmb3JtdWxhVHdpbklEKVxyXG5cclxuICAgICAgICB2YXIgdmFsdWVUZW1wbGF0ZT17fVxyXG4gICAgICAgIHRoaXMuZ2V0UHJvcGVydHlWYWx1ZVRlbXBsYXRlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tmb3JtdWxhVHdpbk1vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgICAgICAgICAsW10sdmFsdWVUZW1wbGF0ZSlcclxuXHJcbiAgICAgICAgdmFyIGlucHV0VmFsdWVBcnI9W11cclxuICAgICAgICB2YXIgaW5wdXRBbmFseXNpc1Jlc3VsdD0gZ2xvYmFsQ2FjaGUuZmluZEFsbElucHV0c0luU2NyaXB0KHNjcmlwdENvbnRlbnQsZm9ybXVsYVR3aW5OYW1lKVxyXG4gICAgICAgIGlucHV0QW5hbHlzaXNSZXN1bHQuZm9yRWFjaChlbGU9PntcclxuICAgICAgICAgICAgaW5wdXRWYWx1ZUFyci5wdXNoKHtcclxuICAgICAgICAgICAgICAgIFwidHdpbklEXCI6Z2xvYmFsQ2FjaGUudHdpbkRpc3BsYXlOYW1lTWFwVG9JRFtlbGUudHdpbk5hbWVfb3JpZ2luXSxcclxuICAgICAgICAgICAgICAgIFwicGF0aFwiOmVsZS5wYXRoLFxyXG4gICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOmVsZS52YWx1ZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVCb2R5PXtcclxuICAgICAgICAgICAgXCJ0d2luSURcIjogZm9ybXVsYVR3aW5JRCxcclxuICAgICAgICAgICAgXCJvcmlnaW5hbFNjcmlwdFwiOnNjcmlwdENvbnRlbnQsXHJcbiAgICAgICAgICAgIFwiYWN0dWFsU2NyaXB0XCI6dHJhbnNsYXRlUmVzdWx0LFxyXG4gICAgICAgICAgICBcImJhc2VWYWx1ZVRlbXBsYXRlXCI6dmFsdWVUZW1wbGF0ZSxcclxuICAgICAgICAgICAgXCJwcm9qZWN0SURcIjpnbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElELFxyXG4gICAgICAgICAgICBcImN1cnJlbnRJbnB1dFZhbHVlXCI6aW5wdXRWYWx1ZUFyclxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyh7XCJwYXlsb2FkXCI6SlNPTi5zdHJpbmdpZnkodGhlQm9keSkgfSlcclxuICAgICAgICAvL2J5IHVzaW5nIHdpdGhQcm9qZWN0SUQgaXQgd2lsbCBlbnN1cmUgaXQgaXMgdGhlIGF1dGhvcml6ZWQgcGVyc29uIHNlbmQgdGhlIGNvbW1hbmRcclxuICAgICAgICB0cnl7IFxyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi91cGRhdGVGb3JtdWxhXCIsIFwiUE9TVFwiLCB7XCJwYXlsb2FkXCI6SlNPTi5zdHJpbmdpZnkodGhlQm9keSkgfSwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLkRCVHdpbnNbZm9ybXVsYVR3aW5JRF1bXCJvcmlnaW5hbFNjcmlwdFwiXT1zY3JpcHRDb250ZW50XHJcbiAgICAgICAgfWNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRQcm9wZXJ0eVZhbHVlVGVtcGxhdGUoanNvbkluZm8scGF0aEFycix2YWx1ZVRlbXBsYXRlUm9vdCl7XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkgJiYgdHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgdmFsdWVUZW1wbGF0ZVJvb3RbaW5kXT17fVxyXG4gICAgICAgICAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eVZhbHVlVGVtcGxhdGUoanNvbkluZm9baW5kXSxuZXdQYXRoLHZhbHVlVGVtcGxhdGVSb290W2luZF0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29udmVydFRvQWN0dWFsU2NyaXB0KHNjcmlwdENvbnRlbnQsZm9ybXVsYVR3aW5JRCl7XHJcbiAgICAgICAgLy9jaGFuZ2UgYWxsIHRoZSB0d2luIG5hbWUgdG8gdHdpbiBJRFxyXG4gICAgICAgIHZhciBwYXR0ID0gLyg/PD1fdHdpblZhbFxcW1xcXCIpLio/KD89XFxcIlxcXSkvZztcclxuICAgICAgICB2YXIgcmVzdWx0ID0gc2NyaXB0Q29udGVudC5yZXBsYWNlKHBhdHQsKGFUd2luTmFtZSk9PntcclxuICAgICAgICAgICAgdmFyIGFUd2luSUQ9Z2xvYmFsQ2FjaGUudHdpbkRpc3BsYXlOYW1lTWFwVG9JRFthVHdpbk5hbWVdXHJcbiAgICAgICAgICAgIHJldHVybiBhVHdpbklEXHJcbiAgICAgICAgfSApO1xyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGdldFR3aW5Qcm9wZXJ0eU9wdGlvbnNBcnIoanNvbkluZm8scGF0aEFycixvcHRpb25zQXJyKXtcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgICAgICBpZighQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSAmJiB0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdldFR3aW5Qcm9wZXJ0eU9wdGlvbnNBcnIoanNvbkluZm9baW5kXSxuZXdQYXRoLG9wdGlvbnNBcnIpXHJcbiAgICAgICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNBcnIucHVzaCgnW1wiJytuZXdQYXRoLmpvaW4oJ1wiXVtcIicpKydcIl0nKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBjcmVhdGVRdWlja0J0bkZvclR3aW4odHdpbk5hbWUsY29sb3JDb2RlLHBhcmVudERPTSx0ZXh0QXJlYURvbSxzZWxmTW9kZWxJRCkge1xyXG4gICAgICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudSh0d2luTmFtZSx7XCJvcHRpb25MaXN0SGVpZ2h0XCI6MjAwLFwiYnV0dG9uQ1NTXCI6e1wiYmFja2dyb3VuZC1jb2xvclwiOmNvbG9yQ29kZSxcInBhZGRpbmdcIjpcIjJweCA1cHhcIixcIm1hcmdpbi1yaWdodFwiOlwiMXB4XCJ9fSlcclxuXHJcbiAgICAgICAgaWYodHdpbk5hbWUhPVwiU2VsZlwiKXtcclxuICAgICAgICAgICAgdmFyIGFEQlR3aW49Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlOYW1lKHR3aW5OYW1lKVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxJRD1hREJUd2luW1wibW9kZWxJRFwiXVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBtb2RlbElEPXNlbGZNb2RlbElEXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgICAgICB2YXIgb3B0aW9uc0Fycj1bXVxyXG4gICAgICAgIHZhciBwYXRoQXJyPVtdXHJcbiAgICAgICAgdGhpcy5nZXRUd2luUHJvcGVydHlPcHRpb25zQXJyKHByb3BlcnRpZXMscGF0aEFycixvcHRpb25zQXJyKVxyXG4gICAgICAgIG9wdGlvbnNBcnIuZm9yRWFjaCgob25lT3B0aW9uKT0+e1xyXG4gICAgICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24ob25lT3B0aW9uKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcGFyZW50RE9NLmFwcGVuZChhU2VsZWN0TWVudS5ET00pIFxyXG4gICAgICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgICAgICBpZih0d2luTmFtZT09XCJTZWxmXCIpIHZhciBzdHI9J19zZWxmJytvcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVsc2Ugc3RyPSdfdHdpblZhbFtcIicrdHdpbk5hbWUrJ1wiXScrb3B0aW9uVGV4dFxyXG4gICAgICAgICAgICB0aGlzLmluc2VydFRvVGV4dEFyZWEoc3RyLHRleHRBcmVhRG9tKVxyXG4gICAgICAgICAgICB0ZXh0QXJlYURvbS5oaWdobGlnaHRXaXRoaW5UZXh0YXJlYSgndXBkYXRlJyk7XHJcbiAgICAgICAgICAgIHRleHRBcmVhRG9tLmZvY3VzKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5zZXJ0VG9UZXh0QXJlYShzdHIsdGV4dEFyZWFEb20pe1xyXG4gICAgICAgIHRleHRBcmVhRG9tLmZvY3VzKCk7XHJcbiAgICAgICAgdmFyIHN0YXJ0UG9zID0gdGV4dEFyZWFEb21bMF0uc2VsZWN0aW9uU3RhcnQ7XHJcbiAgICAgICAgdmFyIGVuZFBvcyA9IHRleHRBcmVhRG9tWzBdLnNlbGVjdGlvbkVuZDtcclxuICAgICAgICAvL3ZhciBuZXdDb250ZW50PXRleHRBcmVhRG9tLnZhbCgpXHJcbiAgICAgICAgLy9uZXdDb250ZW50PW5ld0NvbnRlbnQuc3Vic3RyaW5nKDAsIHN0YXJ0UG9zKSsgc3RyICsgbmV3Q29udGVudC5zdWJzdHJpbmcoZW5kUG9zLCBuZXdDb250ZW50Lmxlbmd0aCk7XHJcbiAgICAgICAgLy90ZXh0QXJlYURvbS52YWwobmV3Q29udGVudClcclxuICAgICAgICBkb2N1bWVudC5leGVjQ29tbWFuZCgnaW5zZXJ0VGV4dCcsIGZhbHNlLCBzdHIpOyAvL3RoaXMgd2F5IHdpbGwgYWxsb3cgdW5kbyBzdGlsbCB3b3Jrc1xyXG4gICAgICAgIHRleHRBcmVhRG9tWzBdLnNlbGVjdGlvblN0YXJ0PXN0YXJ0UG9zK3N0ci5sZW5ndGg7XHJcbiAgICAgICAgdGV4dEFyZWFEb21bMF0uc2VsZWN0aW9uRW5kPXN0YXJ0UG9zK3N0ci5sZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd011bHRpcGxlT2JqKCkge1xyXG4gICAgICAgIHZhciBudW1PZkVkZ2UgPSAwO1xyXG4gICAgICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgICAgIHZhciBhcnIgPSB0aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgICAgICBpZiAoYXJyID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSBudW1PZkVkZ2UrK1xyXG4gICAgICAgICAgICBlbHNlIG51bU9mTm9kZSsrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdmFyIHRleHREaXYgPSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6MTBweDttYXJnaW4tbGVmdDoxNnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgIHRleHREaXYudGV4dChudW1PZk5vZGUgKyBcIiBub2RlXCIgKyAoKG51bU9mTm9kZSA8PSAxKSA/IFwiXCIgOiBcInNcIikgKyBcIiwgXCIgKyBudW1PZkVkZ2UgKyBcIiByZWxhdGlvbnNoaXBcIiArICgobnVtT2ZFZGdlIDw9IDEpID8gXCJcIiA6IFwic1wiKSlcclxuICAgICAgICB0aGlzLmluZm9Db250ZW50RGl2LmFwcGVuZCh0ZXh0RGl2KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBpbmZvUGFuZWwoKTsiLCJjb25zdCBzdGFydFNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL3N0YXJ0U2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZz0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtb2R1bGVTd2l0Y2hEaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZ1wiKVxyXG5jb25zdCBwcm9qZWN0U2V0dGluZ0RpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvcHJvamVjdFNldHRpbmdEaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIG1haW5Ub29sYmFyKCkge1xyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hZGRDbGFzcyhcInczLWJhciB3My1yZWRcIilcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuY3NzKHtcInotaW5kZXhcIjoxMDAsXCJvdmVyZmxvd1wiOlwidmlzaWJsZVwifSlcclxuXHJcbiAgICB0aGlzLnN3aXRjaFByb2plY3RCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPlByb2plY3Q8L2E+JylcclxuICAgIHRoaXMubW9kZWxJT0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+TW9kZWxzPC9hPicpXHJcbiAgICAvL3RoaXMuc2hvd0ZvcmdlVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5Gb3JnZVZpZXc8L2E+JylcclxuICAgIC8vdGhpcy5zaG93R0lTVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+R0lTVmlldzwvYT4nKVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXRcIj48L2k+PC9hPicpXHJcbiAgICB0aGlzLmZsb2F0SW5mb0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1hbWJlclwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7Zm9udC1zaXplOjgwJVwiIGhyZWY9XCIjXCI+PHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZSBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggdzMtdGV4dC1hbWJlclwiPjwvaT48L3NwYW4+PC9hPicpXHJcblxyXG5cclxuICAgIHRoaXMudGVzdFNpZ25hbFJCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYW1iZXJcIiBocmVmPVwiI1wiPlRlc3QgU2lnbmFsUjwvYT4nKVxyXG4gICAgdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYW1iZXJcIiBocmVmPVwiI1wiPnNlbmQgU2lnbmFsUiBtZXNzYWdlPC9hPicpXHJcblxyXG4gICAgdGhpcy5zZXR0aW5nQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG5cclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIkxheW91dFwiKVxyXG5cclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuZW1wdHkoKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hcHBlbmQobW9kdWxlU3dpdGNoRGlhbG9nLm1vZHVsZXNTaWRlYmFyKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hcHBlbmQobW9kdWxlU3dpdGNoRGlhbG9nLm1vZHVsZXNTd2l0Y2hCdXR0b24sIHRoaXMuc3dpdGNoUHJvamVjdEJ0bix0aGlzLm1vZGVsSU9CdG4sdGhpcy52aWV3VHlwZVNlbGVjdG9yLiAgRE9NLHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLHRoaXMuZWRpdExheW91dEJ0bix0aGlzLmZsb2F0SW5mb0J0blxyXG4gICAgICAgIC8vLHRoaXMudGVzdFNpZ25hbFJCdG4sdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG5cclxuICAgICAgICAsdGhpcy5zZXR0aW5nQnRuXHJcbiAgICApXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hQcm9qZWN0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBzdGFydFNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLnNldHRpbmdCdG4ub24oXCJjbGlja1wiLCgpPT57IHByb2plY3RTZXR0aW5nRGlhbG9nLnBvcHVwKCkgfSlcclxuICAgIHRoaXMuZWRpdExheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9PnsgZWRpdExheW91dERpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmZsb2F0SW5mb0J0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpIGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbD1mYWxzZVxyXG4gICAgICAgIGVsc2UgZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsPXRydWVcclxuICAgICAgICBpZighZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKXtcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4ucmVtb3ZlQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5odG1sKCc8c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtYmFuIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCBmYS1pbnZlcnNlXCI+PC9pPjwvc3Bhbj4nKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5hZGRDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmh0bWwoJzxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUgZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IHczLXRleHQtYW1iZXJcIj48L2k+PC9zcGFuPicpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibWVzc2FnZXNcIixcIlBPU1RcIix7XHJcbiAgICAgICAgICAgIHJlY2lwaWVudDogXCI1ZWI4MWY1Zi1mZDllLTQ4MWQtOTk2Yi00ZDBiOTUzNmY0NzdcIixcclxuICAgICAgICAgICAgdGV4dDogXCJob3cgZG8geW91IGRvXCJcclxuICAgICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgdmFyIHNpZ25hbFJJbmZvID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibmVnb3RpYXRlP25hbWU9ZmZcIixcIkdFVFwiKVxyXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgc2lnbmFsUi5IdWJDb25uZWN0aW9uQnVpbGRlcigpXHJcbiAgICAgICAgLndpdGhVcmwoc2lnbmFsUkluZm8udXJsLCB7YWNjZXNzVG9rZW5GYWN0b3J5OiAoKSA9PiBzaWduYWxSSW5mby5hY2Nlc3NUb2tlbn0pXHJcbiAgICAgICAgLy8uY29uZmlndXJlTG9nZ2luZyhzaWduYWxSLkxvZ0xldmVsLkluZm9ybWF0aW9uKVxyXG4gICAgICAgIC5jb25maWd1cmVMb2dnaW5nKHNpZ25hbFIuTG9nTGV2ZWwuV2FybmluZylcclxuICAgICAgICAuYnVpbGQoKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzaWduYWxSSW5mby5hY2Nlc3NUb2tlbilcclxuXHJcbiAgICAgICAgY29ubmVjdGlvbi5vbignbmV3TWVzc2FnZScsIChtZXNzYWdlKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ub25jbG9zZSgoKSA9PiBjb25zb2xlLmxvZygnZGlzY29ubmVjdGVkJykpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW5nLi4uJyk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5zdGFydCgpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiBjb25zb2xlLmxvZygnY29ubmVjdGVkIScpKVxyXG4gICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLnZpZXdUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKCdUb3BvbG9neScpXHJcbiAgICB0aGlzLnZpZXdUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKCdHSVMnKVxyXG4gICAgdGhpcy52aWV3VHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spe1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50Vmlld1R5cGUgPT0gb3B0aW9uVGV4dCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aWV3VHlwZUNoYW5nZVwiLFwidmlld1R5cGVcIjpvcHRpb25UZXh0fSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuY3VycmVudFZpZXdUeXBlPW9wdGlvblRleHRcclxuICAgIH1cclxuICAgIHRoaXMudmlld1R5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoXCJUb3BvbG9neVwiKVxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWU9b3B0aW9uVmFsdWVcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRDaGFuZ2VcIn0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PVwiW05BXVwiKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLG9wdGlvblRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS51cGRhdGVMYXlvdXRTZWxlY3RvciA9IGZ1bmN0aW9uIChjaG9vc2VMYXlvdXROYW1lKSB7XHJcbiAgICB2YXIgY3VyU2VsZWN0PWNob29zZUxheW91dE5hbWV8fHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbignW05vIExheW91dCBTcGVjaWZpZWRdJywnW05BXScpXHJcblxyXG4gICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pIHtcclxuICAgICAgICB2YXIgb25lTGF5b3V0T2JqPWdsb2JhbENhY2hlLmxheW91dEpTT05baW5kXVxyXG4gICAgICAgIGlmKG9uZUxheW91dE9iai5vd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxuXHJcbiAgICBpZihjdXJTZWxlY3QhPW51bGwpe1xyXG4gICAgICAgIGlmKHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuZmluZE9wdGlvbihjdXJTZWxlY3QpPT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLGN1clNlbGVjdClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3Rvcihtc2dQYXlsb2FkLnNlbGVjdExheW91dClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJwb3B1cExheW91dEVkaXRpbmdcIil7XHJcbiAgICAgICAgZWRpdExheW91dERpYWxvZy5wb3B1cCgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1hcERPTShjb250YWluZXJET00pe1xyXG4gICAgdGhpcy5ET009JChcIjxkaXYgc3R5bGU9J2hlaWdodDoxMDAlO3dpZHRoOjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgY29udGFpbmVyRE9NLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG5cclxuICAgIHRoaXMuc3Vic2NyaXB0aW9uS2V5PVwiam1RYl9jampncEVYcTF3QjZlUmpzUUhvalVmSTJYeGdVcGJBaGlGcUJ0Y1wiXHJcbiAgICB0aGlzLmRhdGFTZXRJZD0gXCJlNmZjYmY4My1hYzMzLWNjYWItZjI3Ny0zODhhNDkyNTRlOGRcIlxyXG4gICAgdGhpcy50aWxlU2V0SWQ9XCI4YTliMDJlOS1kYjA0LTI3ODQtZGMzOC05YjMxYzUyMTYwZjJcIlxyXG5cclxuICAgIHRoaXMubWFwID0gbmV3IGF0bGFzLk1hcCh0aGlzLkRPTVswXSwge1xyXG4gICAgICAgIGNlbnRlcjogIFsxMDMuODM5NDI2NiwgMS4zMTQ0ODA1M10sXHJcbiAgICAgICAgem9vbTogMTUsXHJcbiAgICAgICAgc3R5bGU6ICdyb2FkX3NoYWRlZF9yZWxpZWYnLFxyXG4gICAgICAgIHZpZXc6ICdBdXRvJyxcclxuICAgICAgICBhdXRoT3B0aW9uczoge1xyXG4gICAgICAgICAgICBhdXRoVHlwZTogJ3N1YnNjcmlwdGlvbktleScsXHJcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbktleTogdGhpcy5zdWJzY3JpcHRpb25LZXlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLm1hcC5ldmVudHMuYWRkKCdyZWFkeScsICgpPT4ge3RoaXMuaW5pdE1hcCgpfSlcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5pbml0TWFwPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLm1hcERhdGFTb3VyY2UgPSBuZXcgYXRsYXMuc291cmNlLkRhdGFTb3VyY2UoXCJ0d2luUG9seWdvblwiKTtcclxuXHJcbiAgICAvL0FkZCBhIG1hcCBzdHlsZSBzZWxlY3Rpb24gY29udHJvbC5cclxuICAgIHRoaXMubWFwLmNvbnRyb2xzLmFkZChuZXcgYXRsYXMuY29udHJvbC5TdHlsZUNvbnRyb2woeyBtYXBTdHlsZXM6IFwiYWxsXCIgfSksIHsgcG9zaXRpb246IFwidG9wLXJpZ2h0XCIgfSk7XHJcbiAgICAvL0NyZWF0ZSBhbiBpbmRvb3IgbWFwcyBtYW5hZ2VyLlxyXG4gICAgdGhpcy5pbmRvb3JNYW5hZ2VyID0gbmV3IGF0bGFzLmluZG9vci5JbmRvb3JNYW5hZ2VyKHRoaXMubWFwLCB7dGlsZXNldElkOiB0aGlzLnRpbGVTZXRJZH0pO1xyXG4gICAgdGhpcy5pbmRvb3JNYW5hZ2VyLnNldE9wdGlvbnMoe2xldmVsQ29udHJvbDogbmV3IGF0bGFzLmNvbnRyb2wuTGV2ZWxDb250cm9sKHsgcG9zaXRpb246ICd0b3AtcmlnaHQnIH0pIH0pO1xyXG4gICAgdGhpcy5pbmRvb3JNYW5hZ2VyLnNldER5bmFtaWNTdHlsaW5nKGZhbHNlKVxyXG5cclxuICAgIHRoaXMubWFwLmV2ZW50cy5hZGQoXCJjbGlja1wiLCAgKGUpPT4ge1xyXG4gICAgICAgIHZhciBmZWF0dXJlcyA9IHRoaXMubWFwLmxheWVycy5nZXRSZW5kZXJlZFNoYXBlcyhlLnBvc2l0aW9uLCAndW5pdCcpO1xyXG4gICAgICAgIGlmKGZlYXR1cmVzLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciByZXN1bHREQlR3aW49Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlJbmRvb3JGZWF0dXJlSUQoZmVhdHVyZXNbMF0ucHJvcGVydGllcy5mZWF0dXJlSWQpXHJcbiAgICAgICAgaWYocmVzdWx0REJUd2luIT1udWxsKXtcclxuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRUd2lucyhbcmVzdWx0REJUd2luXSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWFwU2VsZWN0RmVhdHVyZVwiLFwiREJUd2luXCI6cmVzdWx0REJUd2lufSlcclxuICAgICAgICB9IFxyXG4gICAgfSk7XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuY29tcGxldGVVUkw9ZnVuY3Rpb24oYXBpUGFydCl7XHJcbiAgICByZXR1cm4gJ2h0dHBzOi8vdXMuYXRsYXMubWljcm9zb2Z0LmNvbS8nK2FwaVBhcnQrJ2FwaS12ZXJzaW9uPTIuMCZzdWJzY3JpcHRpb24ta2V5PScrdGhpcy5zdWJzY3JpcHRpb25LZXlcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlld1R5cGVDaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC52aWV3VHlwZT09XCJHSVNcIikgdGhpcy5zaG93U2VsZigpXHJcbiAgICAgICAgZWxzZSB0aGlzLmhpZGVTZWxmKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIil7XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudFZpZXdUeXBlIT1cIkdJU1wiKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHNlbGVjdGVkVHdpbnNBcnI9bXNnUGF5bG9hZC5pbmZvIC8vdGhlIGxhc3QgaXRlbSBpcyB0aGUgbGF0ZXN0IHNlbGVjdGVkIGl0ZW1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgc2VsZWN0ZWREQlR3aW5zPVtdXHJcbiAgICAgICAgc2VsZWN0ZWRUd2luc0Fyci5mb3JFYWNoKGFUd2luPT57XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9YVR3aW5bJyRkdElkJ11cclxuICAgICAgICAgICAgaWYoIXR3aW5JRCkgcmV0dXJuO1xyXG4gICAgICAgICAgICB2YXIgdGhlREJUd2luPWdsb2JhbENhY2hlLkRCVHdpbnNbdHdpbklEXVxyXG4gICAgICAgICAgICBzZWxlY3RlZERCVHdpbnMucHVzaCh0aGVEQlR3aW4pXHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodFR3aW5zKHNlbGVjdGVkREJUd2lucylcclxuICAgIH1cclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5oaWdobGlnaHRUd2lucyA9IGZ1bmN0aW9uIChkYlR3aW5zKSB7XHJcbiAgICBpZihkYlR3aW5zLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIGxhdGVzdERCVHdpbj0gZGJUd2luc1tkYlR3aW5zLmxlbmd0aC0xXVxyXG4gICAgXHJcbiAgICAvL2hpZGUgYWxsIHR3aW5zIGhpZ2hsaWdodCBpbiBHSVNcclxuICAgIHRoaXMubWFwRGF0YVNvdXJjZS5jbGVhcigpXHJcbiAgICBpZighbGF0ZXN0REJUd2luLkdJUykgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAvL2lmIHRoZXJlIGlzIGEgZmFjaWxpdHkgY2hhbmdlLCB0aGVyZSBpcyBhbiBhbmltYXRpb24gdG8gcGFuIG1hcCwgb3RoZXJ3aXNlLCBkb25vdCBwYW4gbWFwXHJcbiAgICB2YXIgaW5mbz10aGlzLmluZG9vck1hbmFnZXIuZ2V0Q3VycmVudEZhY2lsaXR5KClcclxuICAgIHZhciBjdXJGYWNpbGl0eT1pbmZvWzBdXHJcbiAgICB2YXIgY3VyTGV2ZWxOdW1iZXI9IGluZm9bMV1cclxuICAgIHZhciBkZXN0RmFjaWxpdHk9bGF0ZXN0REJUd2luLkdJUy5pbmRvb3IuZmFjaWxpdHlJRFxyXG4gICAgaWYoY3VyRmFjaWxpdHkhPWRlc3RGYWNpbGl0eSl7XHJcbiAgICAgICAgdmFyIGNvb3JkaW5hdGVzPSBsYXRlc3REQlR3aW4uR0lTLmluZG9vci5jb29yZGluYXRlc1xyXG4gICAgICAgIHZhciBkZXN0TEw9Y29vcmRpbmF0ZXNbMF1bMF1cclxuICAgICAgICB0aGlzLmZseVRvKGRlc3RMTClcclxuICAgIH1cclxuICAgIC8vY2hvb3NlIHRoZSBmYWNpbGl0eSBhbmQgbGV2ZWwgbnVtYmVyXHJcbiAgICBpZihkZXN0RmFjaWxpdHkhPWN1ckZhY2lsaXR5IHx8IGN1ckxldmVsTnVtYmVyIT1sYXRlc3REQlR3aW4uR0lTLmluZG9vci5sZXZlbE9yZGluYWwpe1xyXG4gICAgICAgIHRoaXMuaW5kb29yTWFuYWdlci5zZXRGYWNpbGl0eShkZXN0RmFjaWxpdHksbGF0ZXN0REJUd2luLkdJUy5pbmRvb3IubGV2ZWxPcmRpbmFsIClcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy9oaWdobGlnaHQgYWxsIHNlbGVjdGVkIHR3aW5zIGluIEdJU1xyXG4gICAgZGJUd2lucy5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgIHRoaXMuZHJhd09uZVR3aW5JbmRvb3JQb2x5Z29uKG9uZURCVHdpbi5HSVMuaW5kb29yLmNvb3JkaW5hdGVzKVxyXG4gICAgfSlcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5kcmF3T25lVHdpbkluZG9vclBvbHlnb24gPSBmdW5jdGlvbiAoY29vcmRpbmF0ZXMpIHtcclxuICAgIGlmKCF0aGlzLm1hcC5zb3VyY2VzLmdldEJ5SWQoXCJ0d2luUG9seWdvblwiKSl7XHJcbiAgICAgICAgdGhpcy5tYXAuc291cmNlcy5hZGQodGhpcy5tYXBEYXRhU291cmNlKTtcclxuICAgICAgICB0aGlzLm1hcC5sYXllcnMuYWRkKG5ldyBhdGxhcy5sYXllci5Qb2x5Z29uTGF5ZXIodGhpcy5tYXBEYXRhU291cmNlLCBudWxsLCB7XHJcbiAgICAgICAgICAgIGZpbGxDb2xvcjogXCJyZWRcIixcclxuICAgICAgICAgICAgZmlsbE9wYWNpdHk6IDAuN1xyXG4gICAgICAgIH0pKVxyXG4gICAgfSBcclxuICAgIHRoaXMubWFwRGF0YVNvdXJjZS5hZGQobmV3IGF0bGFzLlNoYXBlKG5ldyBhdGxhcy5kYXRhLkZlYXR1cmUoXHJcbiAgICAgICAgbmV3IGF0bGFzLmRhdGEuUG9seWdvbihjb29yZGluYXRlcylcclxuICAgICkpKTtcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5mbHlUbyA9IGZ1bmN0aW9uIChkZXN0TEwpIHtcclxuICAgIHZhciBjdXJMb2M9dGhpcy5tYXAuZ2V0Q2FtZXJhKCkuY2VudGVyXHJcblxyXG4gICAgaWYoZGVzdExMWzBdPGN1ckxvY1swXSkgdmFyIHRhcmdldEJvdW5kcz1bZGVzdExMWzBdLGRlc3RMTFsxXSxjdXJMb2NbMF0sY3VyTG9jWzFdXVxyXG4gICAgZWxzZSB0YXJnZXRCb3VuZHM9W2N1ckxvY1swXSxjdXJMb2NbMV0sIGRlc3RMTFswXSxkZXN0TExbMV1dXHJcblxyXG4gICAgdGhpcy5tYXAuc2V0Q2FtZXJhKHtcImJvdW5kc1wiOnRhcmdldEJvdW5kcyxcclxuICAgICAgICBcInBhZGRpbmdcIjp7dG9wOiA4MCwgYm90dG9tOiA4MCwgbGVmdDogODAsIHJpZ2h0OiA4MH0sXHJcbiAgICB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWFwRmx5aW5nU3RhcnRcIn0pXHJcblxyXG4gICAgdmFyIG1hcmtlciA9IG5ldyBhdGxhcy5IdG1sTWFya2VyKHtjb2xvcjogJ0RvZGdlckJsdWUnLHRleHQ6ICcnLHBvc2l0aW9uOmN1ckxvY30pO1xyXG4gICAgdGhpcy5tYXAubWFya2Vycy5hZGQobWFya2VyKTtcclxuICAgIHZhciBwYXRoID0gW1xyXG4gICAgICAgIGN1ckxvYyxkZXN0TExcclxuICAgIF07XHJcbiAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgYXRsYXMuYW5pbWF0aW9ucy5tb3ZlQWxvbmdQYXRoKHBhdGgsIG1hcmtlciwgeyBkdXJhdGlvbjogMTAwMCwgY2FwdHVyZU1ldGFkYXRhOiB0cnVlLCBhdXRvUGxheTogdHJ1ZSB9KTtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIm1hcEZseWluZ0VuZFwifSlcclxuICAgICAgICAgICAgdGhpcy5tYXAuc2V0Q2FtZXJhKHtcclxuICAgICAgICAgICAgICAgIFwiY2VudGVyXCI6IGRlc3RMTCxcclxuICAgICAgICAgICAgICAgIFwiem9vbVwiOiAxOSxcclxuICAgICAgICAgICAgICAgIFwiZHVyYXRpb25cIjogMjAwMCxcclxuICAgICAgICAgICAgICAgIFwidHlwZVwiOiBcImZseVwiXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCk9Pnt0aGlzLm1hcC5tYXJrZXJzLmNsZWFyKCl9LDM1MDApXHJcbiAgICAgICAgfSwxMDAwKVxyXG4gICAgICAgIFxyXG4gICAgfSwxMDAwKSBcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5nZXREaXN0YW5jZUZyb21MYXRMb25JbkttID0gZnVuY3Rpb24gKGxvbmxhdDEsIGxvbmxhdDIpIHtcclxuICAgIHZhciBsb24xPWxvbmxhdDFbMF1cclxuICAgIHZhciBsYXQxPWxvbmxhdDFbMV1cclxuICAgIHZhciBsb24yPWxvbmxhdDJbMF1cclxuICAgIHZhciBsYXQyPWxvbmxhdDJbMV1cclxuXHJcbiAgICB2YXIgUiA9IDYzNzE7IC8vIFJhZGl1cyBvZiB0aGUgZWFydGggaW4ga21cclxuICAgIHZhciBkTGF0ID0gdGhpcy5kZWcycmFkKGxhdDIgLSBsYXQxKTsgIC8vIGRlZzJyYWQgYmVsb3dcclxuICAgIHZhciBkTG9uID0gdGhpcy5kZWcycmFkKGxvbjIgLSBsb24xKTtcclxuICAgIHZhciBhID1cclxuICAgICAgICBNYXRoLnNpbihkTGF0IC8gMikgKiBNYXRoLnNpbihkTGF0IC8gMikgK1xyXG4gICAgICAgIE1hdGguY29zKHRoaXMuZGVnMnJhZChsYXQxKSkgKiBNYXRoLmNvcyh0aGlzLmRlZzJyYWQobGF0MikpICpcclxuICAgICAgICBNYXRoLnNpbihkTG9uIC8gMikgKiBNYXRoLnNpbihkTG9uIC8gMilcclxuICAgICAgICA7XHJcbiAgICB2YXIgYyA9IDIgKiBNYXRoLmF0YW4yKE1hdGguc3FydChhKSwgTWF0aC5zcXJ0KDEgLSBhKSk7XHJcbiAgICB2YXIgZCA9IFIgKiBjOyAvLyBEaXN0YW5jZSBpbiBrbVxyXG4gICAgcmV0dXJuIGQ7XHJcbn1cclxuXHJcbm1hcERPTS5wcm90b3R5cGUuZGVnMnJhZCA9IGZ1bmN0aW9uIChkZWcpIHtcclxuICAgIHJldHVybiBkZWcgKiAoTWF0aC5QSSAvIDE4MClcclxufVxyXG5cclxubWFwRE9NLnByb3RvdHlwZS5zaG93U2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uYW5pbWF0ZSh7aGVpZ2h0OiBcIjEwMCVcIn0sKCk9Pnt0aGlzLm1hcC5yZXNpemUoKX0pO1xyXG59XHJcblxyXG5tYXBET00ucHJvdG90eXBlLmhpZGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uYW5pbWF0ZSh7aGVpZ2h0OiBcIjAlXCJ9LCgpPT57dGhpcy5ET00uaGlkZSgpfSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbWFwRE9NOyIsImNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBlZGl0UHJvamVjdERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZWRpdFByb2plY3REaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXJcIilcclxuXHJcbmZ1bmN0aW9uIHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUubWFrZURPTURyYWdnYWJsZSh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjgwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHZhciB0aXRsZURpdj0kKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPlNlbGVjdCBUd2luczwvZGl2PjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHRpdGxlRGl2KVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aXRsZURpdi5hcHBlbmQoY2xvc2VCdXR0b24pXHJcblxyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIgPSAkKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgdGl0bGVEaXYuYXBwZW5kKHRoaXMuYnV0dG9uSG9sZGVyKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKVxyXG4gICAgICAgIHRoaXMuY2xvc2VEaWFsb2coKSBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzE9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cxKVxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtcIj5Qcm9qZWN0IDwvZGl2PicpXHJcbiAgICByb3cxLmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBzd2l0Y2hQcm9qZWN0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifX0pXHJcbiAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvcj1zd2l0Y2hQcm9qZWN0U2VsZWN0b3JcclxuICAgIHJvdzEuYXBwZW5kKHN3aXRjaFByb2plY3RTZWxlY3Rvci5ET00pXHJcbiAgICB2YXIgam9pbmVkUHJvamVjdHM9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHNcclxuICAgIGpvaW5lZFByb2plY3RzLmZvckVhY2goYVByb2plY3Q9PntcclxuICAgICAgICB2YXIgc3RyID0gYVByb2plY3QubmFtZVxyXG4gICAgICAgIGlmKGFQcm9qZWN0Lm93bmVyIT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5hY2NvdW50SUQpIHN0cis9XCIgKGZyb20gXCIrYVByb2plY3Qub3duZXIrXCIpXCJcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuYWRkT3B0aW9uKHN0cixhUHJvamVjdC5pZClcclxuICAgIH0pXHJcbiAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgc3dpdGNoUHJvamVjdFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVByb2plY3Qob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5lZGl0UHJvamVjdEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0IGZhLWxnXCI+PC9pPjwvYT4nKVxyXG4gICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYT4nKVxyXG4gICAgdGhpcy5uZXdQcm9qZWN0QnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9hPicpXHJcbiAgICByb3cxLmFwcGVuZCh0aGlzLmVkaXRQcm9qZWN0QnRuLHRoaXMuZGVsZXRlUHJvamVjdEJ0bix0aGlzLm5ld1Byb2plY3RCdG4pXHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PTQwMFxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MjYwcHg7cGFkZGluZy1yaWdodDo1cHg7b3ZlcmZsb3c6aGlkZGVuXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nLXRvcDoxMHB4O1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNhcmRcIiBzdHlsZT1cImNvbG9yOmdyYXk7aGVpZ2h0OicrKHBhbmVsSGVpZ2h0LTEwKSsncHg7b3ZlcmZsb3c6YXV0bzt3aWR0aDozOTBweDtcIj48L2Rpdj4nKSlcclxuICAgIHZhciBzZWxlY3RlZFR3aW5zRE9NPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBzZWxlY3RlZFR3aW5zRE9NLmNzcyh7XCJib3JkZXItY29sbGFwc2VcIjpcImNvbGxhcHNlXCJ9KVxyXG4gICAgcmlnaHRTcGFuLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoc2VsZWN0ZWRUd2luc0RPTSlcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTT1zZWxlY3RlZFR3aW5zRE9NIFxyXG5cclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5DaG9vc2UgdHdpbnMuLi48cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjE0MHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Y2hvb3NlIHR3aW5zIG9mIG9uZSBvciBtb3JlIG1vZGVsczwvcD48L2Rpdj48L2Rpdj4nKSlcclxuXHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXM9JCgnPGZvcm0gY2xhc3M9XCJ3My1jb250YWluZXIgdzMtYm9yZGVyXCIgc3R5bGU9XCJoZWlnaHQ6JysocGFuZWxIZWlnaHQtNDApKydweDtvdmVyZmxvdzphdXRvXCI+PC9mb3JtPicpXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQodGhpcy5tb2RlbHNDaGVja0JveGVzKVxyXG4gICAgXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0IT1udWxsKXtcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3QpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzd2l0Y2hQcm9qZWN0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VQcm9qZWN0ID0gYXN5bmMgZnVuY3Rpb24gKHNlbGVjdGVkUHJvamVjdElEKSB7XHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIHByb2plY3RJbmZvPWdsb2JhbENhY2hlLmZpbmRQcm9qZWN0SW5mbyhzZWxlY3RlZFByb2plY3RJRClcclxuICAgIGlmKHByb2plY3RJbmZvLm93bmVyPT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5hY2NvdW50SUQpe1xyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4uc2hvdygpXHJcbiAgICAgICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuLnNob3coKVxyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7IGVkaXRQcm9qZWN0RGlhbG9nLnBvcHVwKHByb2plY3RJbmZvKSB9KVxyXG4gICAgICAgIHRoaXMuZGVsZXRlUHJvamVjdEJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L2RlbGV0ZVByb2plY3RUb1wiLCBcIlBPU1RcIiwge1wicHJvamVjdElEXCI6c2VsZWN0ZWRQcm9qZWN0SUR9KVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZWRpdFByb2plY3RCdG4uaGlkZSgpXHJcbiAgICAgICAgdGhpcy5kZWxldGVQcm9qZWN0QnRuLmhpZGUoKVxyXG4gICAgfVxyXG4gICAgdGhpcy5uZXdQcm9qZWN0QnRuLm9uKFwiY2xpY2tcIixhc3luYyAoKT0+e1xyXG4gICAgICAgIHZhciB0c1N0cj0obmV3IERhdGUoKS50b0xvY2FsZVN0cmluZygpKSBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgbmV3UHJvamVjdEluZm8gPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9uZXdQcm9qZWN0VG9cIiwgXCJQT1NUXCIsIHsgXCJwcm9qZWN0TmFtZVwiOiBcIk5ldyBQcm9qZWN0IFwiICsgdHNTdHIgfSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHMudW5zaGlmdChuZXdQcm9qZWN0SW5mbylcclxuICAgICAgICAgICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgICAgICAgICAgdmFyIGpvaW5lZFByb2plY3RzID0gZ2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uam9pbmVkUHJvamVjdHNcclxuICAgICAgICAgICAgam9pbmVkUHJvamVjdHMuZm9yRWFjaChhUHJvamVjdCA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgc3RyID0gYVByb2plY3QubmFtZVxyXG4gICAgICAgICAgICAgICAgaWYoYVByb2plY3Qub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmFjY291bnRJRCkgc3RyKz1cIiAoZnJvbSBcIithUHJvamVjdC5vd25lcitcIilcIlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hQcm9qZWN0U2VsZWN0b3IuYWRkT3B0aW9uKHN0ciwgYVByb2plY3QuaWQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC8vTk9URTogbXVzdCBxdWVyeSB0aGUgbmV3IGpvaW5lZCBwcm9qZWN0cyBKV1QgdG9rZW4gYWdhaW5cclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5yZWxvYWRVc2VyQWNjb3VudERhdGEoKVxyXG4gICAgICAgICAgICB0aGlzLnN3aXRjaFByb2plY3RTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRQcm9qZWN0PT1udWxsKXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1ob3Zlci1kZWVwLW9yYW5nZSB3My1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5TdGFydDwvYnV0dG9uPicpXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbilcclxuICAgIH1lbHNlIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3QgPT0gc2VsZWN0ZWRQcm9qZWN0SUQpe1xyXG4gICAgICAgIHZhciByZXBsYWNlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhcHBlbmRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QXBwZW5kIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgICAgICBhcHBlbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJhcHBlbmRcIikgfSlcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQoYXBwZW5kQnV0dG9uLHJlcGxhY2VCdXR0b24pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCU7IG1hcmdpbi1yaWdodDo4cHhcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCA9IHNlbGVjdGVkUHJvamVjdElEXHJcblxyXG4gICAgdmFyIHByb2plY3RPd25lcj1wcm9qZWN0SW5mby5vd25lclxyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZmV0Y2hQcm9qZWN0TW9kZWxzRGF0YVwiLCBcIlBPU1RcIiwgbnVsbCwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVQcm9qZWN0TW9kZWxzRGF0YShyZXMuREJNb2RlbHMsIHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICAgICAgdmFyIHJlcyA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdFR3aW5zQW5kVmlzdWFsRGF0YVwiLCBcIlBPU1RcIiwge1wicHJvamVjdE93bmVyXCI6cHJvamVjdE93bmVyfSwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVQcm9qZWN0VHdpbnNBbmRWaXN1YWxEYXRhKHJlcylcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmZpbGxBdmFpbGFibGVNb2RlbHMoKVxyXG4gICAgdGhpcy5saXN0VHdpbnMoKVxyXG59XHJcblxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5jbG9zZURpYWxvZz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzdGFydFNlbGVjdGlvbkRpYWxvZ19jbG9zZWRcIn0pXHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5maWxsQXZhaWxhYmxlTW9kZWxzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIkFMTFwiPjxsYWJlbCBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHhcIj48Yj5BTEw8L2I+PC9sYWJlbD48cC8+JylcclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9PntcclxuICAgICAgICB2YXIgbW9kZWxOYW1lPW9uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB2YXIgbW9kZWxJRD1vbmVNb2RlbFtcImlkXCJdXHJcbiAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZChgPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIiR7bW9kZWxJRH1cIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+JHttb2RlbE5hbWV9PC9sYWJlbD48cC8+YClcclxuICAgIH0pXHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMub24oXCJjaGFuZ2VcIiwoZXZ0KT0+e1xyXG4gICAgICAgIGlmKCQoZXZ0LnRhcmdldCkuYXR0cihcImlkXCIpPT1cIkFMTFwiKXtcclxuICAgICAgICAgICAgLy9zZWxlY3QgYWxsIHRoZSBvdGhlciBpbnB1dFxyXG4gICAgICAgICAgICB2YXIgdmFsPSQoZXZ0LnRhcmdldCkucHJvcChcImNoZWNrZWRcIilcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmNoaWxkcmVuKCdpbnB1dCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiLHZhbClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGlzdFR3aW5zKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5nZXRTZWxlY3RlZFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVBcnI9W11cclxuICAgIHZhciBjaG9zZW5Nb2RlbHM9e31cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZighJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmKCQodGhpcykuYXR0cihcImlkXCIpPT1cIkFMTFwiKSByZXR1cm47XHJcbiAgICAgICAgY2hvc2VuTW9kZWxzWyQodGhpcykuYXR0cihcImlkXCIpXT0xXHJcbiAgICB9KTtcclxuICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLkRCVHdpbnMpe1xyXG4gICAgICAgIHZhciBhVHdpbj1nbG9iYWxDYWNoZS5EQlR3aW5zW3R3aW5JRF1cclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVBcnI7XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0VHdpbnM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5lbXB0eSgpXHJcbiAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+VFdJTiBJRDwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5O2ZvbnQtd2VpZ2h0OmJvbGRcIj5NT0RFTCBJRDwvdGQ+PC90cj4nKVxyXG4gICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuXHJcbiAgICB2YXIgc2VsZWN0ZWRUd2lucz10aGlzLmdldFNlbGVjdGVkVHdpbnMoKVxyXG4gICAgc2VsZWN0ZWRUd2lucy5mb3JFYWNoKGFUd2luPT57XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj4nK2FUd2luW1wiZGlzcGxheU5hbWVcIl0rJzwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpblsnbW9kZWxJRCddKyc8L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKVxyXG4gICAgfSlcclxuICAgIGlmKHNlbGVjdGVkVHdpbnMubGVuZ3RoPT0wKXtcclxuICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImNvbG9yOmdyYXlcIj56ZXJvIHJlY29yZDwvdGQ+PHRkPjwvdGQ+PC90cj4nKVxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnVzZVN0YXJ0U2VsZWN0aW9uPWZ1bmN0aW9uKGFjdGlvbil7XHJcbiAgICB2YXIgYm9vbF9icm9hZENhc3RQcm9qZWN0Q2hhbmdlZD1mYWxzZVxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkUHJvamVjdCE9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRCl7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuaW5pdFN0b3JlZEluZm9ybXRpb24oKVxyXG4gICAgICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZFByb2plY3Q9Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRFxyXG4gICAgICAgIGJvb2xfYnJvYWRDYXN0UHJvamVjdENoYW5nZWQ9dHJ1ZVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICB2YXIgdHdpbklEcz1bXVxyXG4gICAgc2VsZWN0ZWRUd2lucy5mb3JFYWNoKGFUd2luPT57dHdpbklEcy5wdXNoKGFUd2luW1wiaWRcIl0pfSlcclxuXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9Pnttb2RlbElEcy5wdXNoKG9uZU1vZGVsW1wiaWRcIl0pfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzdGFydFNlbGVjdGlvbl9cIithY3Rpb24sIFwidHdpbklEc1wiOiB0d2luSURzLFwibW9kZWxJRHNcIjptb2RlbElEcyB9KVxyXG4gICAgdmFyIHByb2plY3RJbmZvPWdsb2JhbENhY2hlLmZpbmRQcm9qZWN0SW5mbyhnbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEKVxyXG4gICAgaWYocHJvamVjdEluZm8uZGVmYXVsdExheW91dCAmJiBwcm9qZWN0SW5mby5kZWZhdWx0TGF5b3V0IT1cIlwiKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1wcm9qZWN0SW5mby5kZWZhdWx0TGF5b3V0XHJcbiAgICBcclxuICAgIGlmKGJvb2xfYnJvYWRDYXN0UHJvamVjdENoYW5nZWQpe1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInByb2plY3RJc0NoYW5nZWRcIixcInByb2plY3RJRFwiOmdsb2JhbENhY2hlLmN1cnJlbnRQcm9qZWN0SUR9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIsXCJzZWxlY3RMYXlvdXRcIjpwcm9qZWN0SW5mby5kZWZhdWx0TGF5b3V0fSlcclxuICAgIHRoaXMuY2xvc2VEaWFsb2coKVxyXG5cclxuICAgIGlmKGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgLy9kaXJlY3RseSBwb3B1cCB0byBtb2RlbCBtYW5hZ2VtZW50IGRpYWxvZyBhbGxvdyB1c2VyIGltcG9ydCBvciBjcmVhdGUgbW9kZWxcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKVxyXG4gICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5ET00uaGlkZSgpXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLkRPTS5mYWRlSW4oKVxyXG4gICAgICAgIC8vcG9wIHVwIHdlbGNvbWUgc2NyZWVuXHJcbiAgICAgICAgdmFyIHBvcFdpbj0kKCc8ZGl2IGNsYXNzPVwidzMtYmx1ZSB3My1jYXJkLTQgdzMtcGFkZGluZy1sYXJnZVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTA1O3dpZHRoOjQwMHB4O2N1cnNvcjpkZWZhdWx0XCI+PC9kaXY+JylcclxuICAgICAgICBwb3BXaW4uaHRtbChgV2VsY29tZSwgJHttc2FsSGVscGVyLnVzZXJOYW1lfSEgRmlyc3RseSwgbGV0J3MgaW1wb3J0IG9yIGNyZWF0ZSBhIGZldyB0d2luIG1vZGVscyB0byBzdGFydC4gPGJyLz48YnIvPkNsaWNrIHRvIGNvbnRpbnVlLi4uYClcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQocG9wV2luKVxyXG4gICAgICAgIHBvcFdpbi5vbihcImNsaWNrXCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICAgICAgcG9wV2luLmZhZGVPdXQoXCJzbG93XCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KTtcclxuICAgICAgICB9LDMwMDApXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51ID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3Qgc2VydmljZVdvcmtlckhlbHBlcj1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2VydmljZVdvcmtlckhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gdG9wb2xvZ3lET00oY29udGFpbmVyRE9NKXtcclxuICAgIHRoaXMuRE9NPSQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJTt3aWR0aDoxMDAlJz48L2Rpdj5cIilcclxuICAgIGNvbnRhaW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICB0aGlzLmRlZmF1bHROb2RlU2l6ZT0zMFxyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvPXt9XHJcbiAgICB0aGlzLmxhc3RDYWxjSW5wdXRTdHlsZU5vZGVzPVtdXHJcbiAgICB0aGlzLmxhc3RDYWxjT3V0cHV0U3R5bGVOb2Rlcz1bXVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe1xyXG4gICAgY3l0b3NjYXBlLndhcm5pbmdzKGZhbHNlKSAgXHJcbiAgICB0aGlzLmNvcmUgPSBjeXRvc2NhcGUoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogIHRoaXMuRE9NWzBdLCAvLyBjb250YWluZXIgdG8gcmVuZGVyIGluXHJcblxyXG4gICAgICAgIC8vIGluaXRpYWwgdmlld3BvcnQgc3RhdGU6XHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgICBwYW46IHsgeDogMCwgeTogMCB9LFxyXG5cclxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBvcHRpb25zOlxyXG4gICAgICAgIG1pblpvb206IDAuMSxcclxuICAgICAgICBtYXhab29tOiAxMCxcclxuICAgICAgICB6b29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyWm9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgcGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGJveFNlbGVjdGlvbkVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0aW9uVHlwZTogJ3NpbmdsZScsXHJcbiAgICAgICAgdG91Y2hUYXBUaHJlc2hvbGQ6IDgsXHJcbiAgICAgICAgZGVza3RvcFRhcFRocmVzaG9sZDogNCxcclxuICAgICAgICBhdXRvbG9jazogZmFsc2UsXHJcbiAgICAgICAgYXV0b3VuZ3JhYmlmeTogZmFsc2UsXHJcbiAgICAgICAgYXV0b3Vuc2VsZWN0aWZ5OiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyaW5nIG9wdGlvbnM6XHJcbiAgICAgICAgaGVhZGxlc3M6IGZhbHNlLFxyXG4gICAgICAgIHN0eWxlRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBoaWRlRWRnZXNPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICB0ZXh0dXJlT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1cjogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1ck9wYWNpdHk6IDAuMixcclxuICAgICAgICB3aGVlbFNlbnNpdGl2aXR5OiAwLjMsXHJcbiAgICAgICAgcGl4ZWxSYXRpbzogJ2F1dG8nLFxyXG5cclxuICAgICAgICBlbGVtZW50czogW10sIC8vIGxpc3Qgb2YgZ3JhcGggZWxlbWVudHMgdG8gc3RhcnQgd2l0aFxyXG5cclxuICAgICAgICBzdHlsZTogWyAvLyB0aGUgc3R5bGVzaGVldCBmb3IgdGhlIGdyYXBoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcImhlaWdodFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6ICdkYXRhKGlkKScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOjAuOSxcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzpcIjEycHhcIixcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1mYW1pbHknOidHZW5ldmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtaW1hZ2UnOiBmdW5jdGlvbihlbGUpeyByZXR1cm4gXCJpbWFnZXMvY2F0LnBuZ1wiOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtZml0JzonY29udGFpbicgLy9jb3ZlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vJ2JhY2tncm91bmQtY29sb3InOiBmdW5jdGlvbiggZWxlICl7IHJldHVybiBlbGUuZGF0YSgnYmcnKSB9XHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLXdpZHRoJzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC1oZWlnaHQnOic3MCUnXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICcjODg4JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyM1NTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctc2hhcGUnOiAndHJpYW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdiZXppZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdhcnJvdy1zY2FsZSc6MC42XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGUuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmxhY2tlbic6MC41XHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6NVxyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmhpZ2hlc3RTdHlsZUFycj0gW1xyXG4gICAgICAgIHtzZWxlY3Rvcjonbm9kZS5jYWxjSW5wdXQnICwgc3R5bGU6IHtcclxuICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6IFwicmVkXCIsXHJcbiAgICAgICAgICAgICdib3JkZXItd2lkdGgnOiAxLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1maWxsJzogJ2xpbmVhci1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtY29sb3JzJzogWydyZWQnLCAncmVkJywgJ3doaXRlJywgXCJ3aGl0ZVwiLCBcInJlZFwiXSxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOiBbJzAlJywgJzUwJScsICc1MSUnLCBcIjkwJVwiLCBcIjkxJVwiXVxyXG4gICAgICAgIH19LFxyXG4gICAgICAgIHtzZWxlY3Rvcjonbm9kZS5jYWxjT3V0cHV0JyAsIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICdib3JkZXItY29sb3InOiBcImJsdWVcIixcclxuICAgICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDEsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWZpbGwnOiAnbGluZWFyLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOiBbJ2JsdWUnLCAnYmx1ZScsICd3aGl0ZScsIFwid2hpdGVcIiwgXCJibHVlXCJdLFxyXG4gICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6IFsnMCUnLCAnNTAlJywgJzUxJScsIFwiOTAlXCIsIFwiOTElXCJdXHJcbiAgICAgICAgfX0sXHJcbiAgICAgICAge3NlbGVjdG9yOidlZGdlLmNhbGNJbnB1dCcgLCBzdHlsZTp7XHJcbiAgICAgICAgICAgICd3aWR0aCc6ICc1JyxcclxuICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgJ3RhcmdldC1sYWJlbCc6ICdkYXRhKHBwYXRoKScsXHJcbiAgICAgICAgICAgICdmb250LXNpemUnOiAnMTFweCcsXHJcbiAgICAgICAgICAgICd0YXJnZXQtdGV4dC1vZmZzZXQnOiAnZGF0YShwcGF0aE9mZnNldCknLFxyXG4gICAgICAgICAgICAndGV4dC1iYWNrZ3JvdW5kLWNvbG9yJzogJ3doaXRlJyxcclxuICAgICAgICAgICAgJ3RleHQtYmFja2dyb3VuZC1vcGFjaXR5JzogMSxcclxuICAgICAgICAgICAgJ3RleHQtYm9yZGVyLW9wYWNpdHknOiAxLFxyXG4gICAgICAgICAgICAndGV4dC1ib3JkZXItd2lkdGgnOiAxLFxyXG4gICAgICAgICAgICAndGV4dC1iYWNrZ3JvdW5kLXBhZGRpbmcnOiAnMnB4JyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogJ2dyYXknLFxyXG4gICAgICAgICAgICAndGV4dC1ib3JkZXItY29sb3InOiAnZ3JheSdcclxuICAgICAgICB9IH0sXHJcbiAgICAgICAge3NlbGVjdG9yOidlZGdlLmNhbGNPdXRwdXQnICwgc3R5bGU6IHtcclxuICAgICAgICAgICAgJ3dpZHRoJzogJzUnLFxyXG4gICAgICAgICAgICAnbGluZS1jb2xvcic6ICdibHVlJyxcclxuICAgICAgICAgICAgJ3NvdXJjZS1sYWJlbCc6ICdkYXRhKHBwYXRoKScsXHJcbiAgICAgICAgICAgICdmb250LXNpemUnOiAnMTFweCcsXHJcbiAgICAgICAgICAgICdzb3VyY2UtdGV4dC1vZmZzZXQnOiAnZGF0YShwcGF0aE9mZnNldCknLFxyXG4gICAgICAgICAgICAndGV4dC1iYWNrZ3JvdW5kLWNvbG9yJzogJ3doaXRlJyxcclxuICAgICAgICAgICAgJ3RleHQtYmFja2dyb3VuZC1vcGFjaXR5JzogMSxcclxuICAgICAgICAgICAgJ3RleHQtYm9yZGVyLW9wYWNpdHknOiAxLFxyXG4gICAgICAgICAgICAndGV4dC1ib3JkZXItd2lkdGgnOiAxLFxyXG4gICAgICAgICAgICAndGV4dC1iYWNrZ3JvdW5kLXBhZGRpbmcnOiAnMnB4JyxcclxuICAgICAgICAgICAgJ2NvbG9yJzogJ2dyYXknLFxyXG4gICAgICAgICAgICAndGV4dC1ib3JkZXItY29sb3InOiAnZ3JheSdcclxuICAgICAgICB9fSxcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2U6c2VsZWN0ZWQnICwgc3R5bGU6e1xyXG4gICAgICAgICAgICAnd2lkdGgnOiAzLFxyXG4gICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgJ2xpbmUtZmlsbCc6IFwibGluZWFyLWdyYWRpZW50XCIsXHJcbiAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtY29sb3JzJzogWydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzogWycwJScsICc3MCUnLCAnMTAwJSddXHJcbiAgICAgICAgfSB9LFxyXG4gICAgICAgIHtzZWxlY3Rvcjonbm9kZTpzZWxlY3RlZCcgLCBzdHlsZToge1xyXG4gICAgICAgICAgICAnYm9yZGVyLWNvbG9yJzogXCJyZWRcIixcclxuICAgICAgICAgICAgJ2JvcmRlci13aWR0aCc6IDIsXHJcbiAgICAgICAgICAgICdiYWNrZ3JvdW5kLWZpbGwnOiAncmFkaWFsLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOiBbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOiBbJzAlJywgJzUwJScsICc2MCUnXVxyXG4gICAgICAgIH19XHJcbiAgICBdXHJcbiAgICB0aGlzLmhpZ2hlc3RTdHlsZVNlbGVjdG9ycz17fVxyXG4gICAgdGhpcy5oaWdoZXN0U3R5bGVBcnIuZm9yRWFjaCgob25lU3R5bGUpPT57dGhpcy5oaWdoZXN0U3R5bGVTZWxlY3RvcnNbb25lU3R5bGUuc2VsZWN0b3JdPTF9KVxyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOiB0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6IGZhbHNlLFxyXG4gICAgICAgIGVuYWJsZUNyZWF0ZUFuY2hvck9uRHJhZzogZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3ZlcicsZT0+e1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlT3ZlckZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW91dCcsZT0+e1xyXG4gICAgICAgIHRoaXMubW91c2VPdXRGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKCd6b29tJywoZSk9PntcclxuICAgICAgICB2YXIgZnM9dGhpcy5nZXRGb250U2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB2YXIgZGltZW5zaW9uPXRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKCk7XHJcblxyXG4gICAgICAgIHZhciBhcnI9W1xyXG4gICAgICAgICAgICB7c2VsZWN0b3I6J25vZGUnLHN0eWxlOnsgJ2ZvbnQtc2l6ZSc6IGZzLCB3aWR0aDogZGltZW5zaW9uLCBoZWlnaHQ6IGRpbWVuc2lvbiB9fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOidub2RlOnNlbGVjdGVkJyxzdHlsZTp7ICdib3JkZXItd2lkdGgnOiBNYXRoLmNlaWwoZGltZW5zaW9uIC8gMTUpIH19LFxyXG4gICAgICAgIF1cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbykge1xyXG4gICAgICAgICAgICB2YXIgbmV3RGltZW5zaW9uID0gTWF0aC5jZWlsKHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpb1ttb2RlbElEXSAqIGRpbWVuc2lvbilcclxuICAgICAgICAgICAgYXJyLnB1c2goe3NlbGVjdG9yOidub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXScsc3R5bGU6eyB3aWR0aDogbmV3RGltZW5zaW9uLCBoZWlnaHQ6IG5ld0RpbWVuc2lvbiB9fSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KGFycilcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGluc3RhbmNlID0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgIHZhciB0YXBkcmFnSGFuZGxlcj0oZSkgPT4ge1xyXG4gICAgICAgIGluc3RhbmNlLmtlZXBBbmNob3JzQWJzb2x1dGVQb3NpdGlvbkR1cmluZ01vdmluZygpXHJcbiAgICAgICAgaWYoZS50YXJnZXQuaXNOb2RlICYmIGUudGFyZ2V0LmlzTm9kZSgpKSB0aGlzLmRyYWdnaW5nTm9kZT1lLnRhcmdldFxyXG4gICAgICAgIHRoaXMuc21hcnRQb3NpdGlvbk5vZGUoZS5wb3NpdGlvbilcclxuICAgIH1cclxuICAgIHZhciBzZXRPbmVUaW1lR3JhYiA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvcmUub25jZShcImdyYWJcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGRyYWdnaW5nTm9kZXMgPSB0aGlzLmNvcmUuY29sbGVjdGlvbigpXHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlLnRhcmdldClcclxuICAgICAgICAgICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGUuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZWxlKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpbnN0YW5jZS5zdG9yZUFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKGRyYWdnaW5nTm9kZXMpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5vbihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlciApXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVGcmVlKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVGcmVlID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZnJlZVwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgICAgICAgICBpbnN0YW5jZS5yZXNldEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGU9bnVsbFxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lR3JhYigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5yZW1vdmVMaXN0ZW5lcihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlcilcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgc2V0T25lVGltZUdyYWIoKVxyXG5cclxuICAgIHZhciB1ciA9IHRoaXMuY29yZS51bmRvUmVkbyh7aXNEZWJ1ZzogZmFsc2V9KTtcclxuICAgIHRoaXMudXI9dXJcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYygpXHJcblxyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZSA9IHRoaXMuY29yZS5jb250ZXh0TWVudXMoJ2dldCcpXHJcbiAgICB0aGlzLmFkZE1lbnVJdGVtc0ZvckVkaXRpbmcoKVxyXG4gICAgdGhpcy5hZGRNZW51SXRlbXNGb3JPdGhlcnMoKVxyXG4gICAgdGhpcy5hZGRNZW51SXRlbXNGb3JMaXZlRGF0YSgpXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5vbignY3h0dGFwJywgKGUpPT57XHJcbiAgICAgICAgdGhpcy5kZWNpZGVWaXNpYmxlQ29udGV4dE1lbnUoZS50YXJnZXQpXHJcbiAgICB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0SWZDbGlja0VsZUlzTm90U2VsZWN0ZWQ9ZnVuY3Rpb24oY2xpY2tFbGUpe1xyXG4gICAgaWYoIWNsaWNrRWxlLnNlbGVjdGVkKCkpe1xyXG4gICAgICAgIHRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKS51bnNlbGVjdCgpXHJcbiAgICAgICAgY2xpY2tFbGUuc2VsZWN0KClcclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vZGVfY2hhbmdlU2VsZWN0aW9uV2hlbkNsaWNrRWxlbWVudD1mdW5jdGlvbihjbGlja0VsZSl7XHJcbiAgICBpZihjbGlja0VsZS5pc05vZGUgJiYgY2xpY2tFbGUuaXNOb2RlKCkpe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0SWZDbGlja0VsZUlzTm90U2VsZWN0ZWQoY2xpY2tFbGUpXHJcbiAgICB9XHJcbiAgICB2YXIgYXJyPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgcmV0dXJuIGFyclxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub2Rlb3JlZGdlX2NoYW5nZVNlbGVjdGlvbldoZW5DbGlja0VsZW1lbnQ9ZnVuY3Rpb24oY2xpY2tFbGUpe1xyXG4gICAgaWYoY2xpY2tFbGUuaXNOb2RlKXsgLy9hdCBsZWFzdCBoYXZpbmcgaXNub2RlIGZ1bmN0aW9uIG1lYW5zIGl0IGlzIG5vZGUgb3IgZWRnZVxyXG4gICAgICAgIHRoaXMuc2VsZWN0SWZDbGlja0VsZUlzTm90U2VsZWN0ZWQoY2xpY2tFbGUpXHJcbiAgICB9XHJcbiAgICB2YXIgYXJyPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgcmV0dXJuIGFyclxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlY2lkZVZpc2libGVDb250ZXh0TWVudT1mdW5jdGlvbihjbGlja0VsZSl7XHJcbiAgICAvL3Jlc3RvcmUgYWxsIG1lbnUgaXRlbXNcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdDb25uZWN0VG8nKTtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdDb25uZWN0RnJvbScpO1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5zaG93TWVudUl0ZW0oJ1F1ZXJ5T3V0Ym91bmQnKTtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdRdWVyeUluYm91bmQnKTtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdTZWxlY3RPdXRib3VuZCcpO1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5zaG93TWVudUl0ZW0oJ1NlbGVjdEluYm91bmQnKTtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdlbmFibGVMaXZlRGF0YVN0cmVhbScpO1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5zaG93TWVudUl0ZW0oJ0NPU0UnKTtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2Uuc2hvd01lbnVJdGVtKCdhZGRTaW11bGF0aW5nRGF0YVNvdXJjZScpO1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5zaG93TWVudUl0ZW0oJ2xpdmVEYXRhJyk7XHJcbiAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLnNob3dNZW51SXRlbSgnSGlkZScpO1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5zaG93TWVudUl0ZW0oJ090aGVycycpO1xyXG5cclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS4kKCdub2RlOnNlbGVjdGVkJylcclxuICAgIHZhciBzZWxlY3RlZD10aGlzLmNvcmUuJCgnOnNlbGVjdGVkJylcclxuICAgIHZhciBpc0NsaWNraW5nTm9kZT0oY2xpY2tFbGUuaXNOb2RlICYmIGNsaWNrRWxlLmlzTm9kZSgpKVxyXG4gICAgdmFyIGhhc05vZGU9aXNDbGlja2luZ05vZGUgfHwgKHNlbGVjdGVkTm9kZXMubGVuZ3RoPjApXHJcblxyXG4gICAgaWYoIWhhc05vZGUpe1xyXG4gICAgICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2UuaGlkZU1lbnVJdGVtKCdDb25uZWN0VG8nKTtcclxuICAgICAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnQ29ubmVjdEZyb20nKTsgXHJcbiAgICAgICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5oaWRlTWVudUl0ZW0oJ1F1ZXJ5T3V0Ym91bmQnKTtcclxuICAgICAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnUXVlcnlJbmJvdW5kJyk7XHJcbiAgICAgICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5oaWRlTWVudUl0ZW0oJ1NlbGVjdE91dGJvdW5kJyk7XHJcbiAgICAgICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5oaWRlTWVudUl0ZW0oJ1NlbGVjdEluYm91bmQnKTtcclxuICAgICAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnZW5hYmxlTGl2ZURhdGFTdHJlYW0nKTtcclxuICAgICAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnSGlkZScpO1xyXG4gICAgICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2UuaGlkZU1lbnVJdGVtKCdPdGhlcnMnKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaWYoc2VsZWN0ZWQubGVuZ3RoPD0xKSB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnQ09TRScpO1xyXG4gICAgaWYoIWlzQ2xpY2tpbmdOb2RlKSB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmhpZGVNZW51SXRlbSgnYWRkU2ltdWxhdGluZ0RhdGFTb3VyY2UnKTtcclxuICAgIGlmKCFpc0NsaWNraW5nTm9kZSAmJiBzZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5oaWRlTWVudUl0ZW0oJ2xpdmVEYXRhJyk7XHJcblxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkTWVudUl0ZW1zRm9yTGl2ZURhdGEgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmNvbnRlbnh0TWVudUluc3RhbmNlLmFwcGVuZE1lbnVJdGVtcyhbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ2xpdmVEYXRhJyxcclxuICAgICAgICAgICAgY29udGVudDogJ0xpdmUgRGF0YScsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgZGlzYWJsZWQ6dHJ1ZSxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoKT0+e30vL2VtcHR5IGZ1bmMsIGl0IGlzIG9ubHkgYSBtZW51IHRpdGxlIGl0ZW1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdhZGRTaW11bGF0aW5nRGF0YVNvdXJjZScsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdBZGQgU2ltdWxhdG9yIFNvdXJjZScsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuY3lUYXJnZXQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFNpbXVsYXRvclNvdXJjZSh0YXJnZXQuaWQoKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ2VuYWJsZUxpdmVEYXRhU3RyZWFtJyxcclxuICAgICAgICAgICAgY29udGVudDogJ01vbml0b3IgTGl2ZSBEYXRhJyxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlLGVkZ2UnLFxyXG4gICAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0ID0gZS50YXJnZXQgfHwgZS5jeVRhcmdldDtcclxuICAgICAgICAgICAgICAgIHRoaXMuZW5hYmxlTGl2ZURhdGFTdHJlYW0odGFyZ2V0LmlkKCkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkTWVudUl0ZW1zRm9yRWRpdGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuY29udGVueHRNZW51SW5zdGFuY2UuYXBwZW5kTWVudUl0ZW1zKFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAnZWRpdGluZycsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdFZGl0JyxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlLGVkZ2UnLFxyXG4gICAgICAgICAgICBkaXNhYmxlZDp0cnVlLFxyXG4gICAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246ICgpPT57fS8vZW1wdHkgZnVuYywgaXQgaXMgb25seSBhIG1lbnUgdGl0bGUgaXRlbVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ0Nvbm5lY3RUbycsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdDb25uZWN0IFRvJyxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlLGVkZ2UnLFxyXG4gICAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIix0aGlzLm5vZGVfY2hhbmdlU2VsZWN0aW9uV2hlbkNsaWNrRWxlbWVudChlLnRhcmdldCkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdDb25uZWN0RnJvbScsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdDb25uZWN0IEZyb20nLFxyXG4gICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUsZWRnZScsXHJcbiAgICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RGcm9tXCIsdGhpcy5ub2RlX2NoYW5nZVNlbGVjdGlvbldoZW5DbGlja0VsZW1lbnQoZS50YXJnZXQpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAnRGVsZXRlQWxsJyxcclxuICAgICAgICAgICAgY29udGVudDogJ0RlbGV0ZScsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGVFbGVtZW50c0FycmF5KHRoaXMubm9kZW9yZWRnZV9jaGFuZ2VTZWxlY3Rpb25XaGVuQ2xpY2tFbGVtZW50KGUudGFyZ2V0KSApXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICBdKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkTWVudUl0ZW1zRm9yT3RoZXJzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5jb250ZW54dE1lbnVJbnN0YW5jZS5hcHBlbmRNZW51SXRlbXMoW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdPdGhlcnMnLFxyXG4gICAgICAgICAgICBjb250ZW50OiAnT3RoZXJzJywgXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgZGlzYWJsZWQ6dHJ1ZSxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoKT0+e30gLy9lbXB0eSBmdW5jLCBpdCBpcyBvbmx5IGEgbWVudSB0aXRsZSBpdGVtXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAnUXVlcnlPdXRib3VuZCcsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdMb2FkIE91dGJvdW5kJyxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlLGVkZ2UnLFxyXG4gICAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dPdXRCb3VuZCh0aGlzLm5vZGVfY2hhbmdlU2VsZWN0aW9uV2hlbkNsaWNrRWxlbWVudChlLnRhcmdldCkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgaWQ6ICdRdWVyeUluYm91bmQnLFxyXG4gICAgICAgICAgICBjb250ZW50OiAnTG9hZCBJbmJvdW5kJywgXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93SW5Cb3VuZCh0aGlzLm5vZGVfY2hhbmdlU2VsZWN0aW9uV2hlbkNsaWNrRWxlbWVudChlLnRhcmdldCkpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LHtcclxuICAgICAgICAgICAgaWQ6ICdTZWxlY3RPdXRib3VuZCcsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICcrU2VsZWN0IE91dGJvdW5kJyxcclxuICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlLGVkZ2UnLFxyXG4gICAgICAgICAgICBvbkNsaWNrRnVuY3Rpb246IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdE91dGJvdW5kTm9kZXModGhpcy5ub2RlX2NoYW5nZVNlbGVjdGlvbldoZW5DbGlja0VsZW1lbnQoZS50YXJnZXQpKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIGlkOiAnU2VsZWN0SW5ib3VuZCcsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICcrU2VsZWN0IEluYm91bmQnLFxyXG4gICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUsZWRnZScsXHJcbiAgICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0SW5ib3VuZE5vZGVzKHRoaXMubm9kZV9jaGFuZ2VTZWxlY3Rpb25XaGVuQ2xpY2tFbGVtZW50KGUudGFyZ2V0KSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ0NPU0UnLFxyXG4gICAgICAgICAgICBjb250ZW50OiAnQ09TRSBMYXlvdXQnLFxyXG4gICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUsZWRnZScsXHJcbiAgICAgICAgICAgIG9uQ2xpY2tGdW5jdGlvbjogKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKHRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKSx0aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZDogJ0hpZGUnLFxyXG4gICAgICAgICAgICBjb250ZW50OiAnSGlkZScsXHJcbiAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZSxlZGdlJyxcclxuICAgICAgICAgICAgb25DbGlja0Z1bmN0aW9uOiAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIGNvbGxlY3Rpb249dGhpcy5ub2RlX2NoYW5nZVNlbGVjdGlvbldoZW5DbGlja0VsZW1lbnQoZS50YXJnZXQpXHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLnJlbW92ZSgpXHJcbiAgICAgICAgICAgICAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICAgICAgICAgICAgICBjb2xsZWN0aW9uLmZvckVhY2gob25lTm9kZT0+e3R3aW5JREFyci5wdXNoKG9uZU5vZGUuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJGR0SWQnXSl9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiaGlkZVNlbGVjdGVkTm9kZXNcIixcInR3aW5JREFyclwiOnR3aW5JREFyciB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXSlcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hZGRTaW11bGF0b3JTb3VyY2UgPSBmdW5jdGlvbiAodHdpbk5hbWUpIHtcclxuICAgIC8vVE9ETzpcclxuICAgIGNvbnNvbGUubG9nKFwiVE9ETzogYWRkIHNpbXVsYXRvciBzb3VyY2VcIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmVuYWJsZUxpdmVEYXRhU3RyZWFtID0gZnVuY3Rpb24gKHR3aW5OYW1lKSB7XHJcbiAgICB2YXIgdHdpbklEPWdsb2JhbENhY2hlLnR3aW5EaXNwbGF5TmFtZU1hcFRvSURbdHdpbk5hbWVdXHJcbiAgICB2YXIgZGJ0d2luPWdsb2JhbENhY2hlLkRCVHdpbnNbdHdpbklEXVxyXG4gICAgdmFyIG1vZGVsSUQ9ZGJ0d2luLm1vZGVsSURcclxuICAgIHZhciBwcm9wZXJ0eVBhdGhzPW1vZGVsQW5hbHl6ZXIuZmV0Y2hQcm9wZXJ0eVBhdGhzT2ZNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIGNoZWNrQm94ZXM9W11cclxuICAgIFxyXG4gICAgdmFyIGRpYWxvZz1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICBkaWFsb2cuc2hvdyh7XCJtYXgtd2lkdGhcIjpcIjQ1MHB4XCIsXCJtaW4td2lkdGhcIjpcIjMwMHB4XCJ9LHtcclxuICAgICAgICBcInRpdGxlXCI6XCJDaG9vc2UgTGl2ZSBNb25pdG9yIFByb3BlcnRpZXNcIixcclxuICAgICAgICBcImN1c3RvbURyYXdpbmdcIjoocGFyZW50RE9NKT0+e1xyXG4gICAgICAgICAgICBwcm9wZXJ0eVBhdGhzLmZvckVhY2goKHBhdGgpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBpc0lvVENoZWNrID0gJCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiBzdHlsZT1cIndpZHRoOjIwcHg7bWFyZ2luLWxlZnQ6MTZweDttYXJnaW4tcmlnaHQ6NXB4XCIgdHlwZT1cImNoZWNrYm94XCI+JylcclxuICAgICAgICAgICAgICAgIHZhciBpc0lvVFRleHQgPSAkKCc8bGFiZWwgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MTJweFwiPicrcGF0aC5qb2luKFwiLlwiKSsnPC9sYWJlbD4nKVxyXG4gICAgICAgICAgICAgICAgcGFyZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiZmxvYXQ6bGVmdFwiLz4nKS5hcHBlbmQoaXNJb1RDaGVjaywgaXNJb1RUZXh0KSlcclxuICAgICAgICAgICAgICAgIGNoZWNrQm94ZXMucHVzaChpc0lvVENoZWNrKVxyXG4gICAgICAgICAgICAgICAgaXNJb1RDaGVjay5kYXRhKFwicGF0aFwiLHBhdGgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSxcclxuICAgICAgICBcImJ1dHRvbnNcIjpbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwidGV4dFwiOiBcIkxpdmVcIixcclxuICAgICAgICAgICAgICAgIFwiY29sb3JDbGFzc1wiOlwidzMtbGltZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8Y2hlY2tCb3hlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFDaGtCb3g9Y2hlY2tCb3hlc1tpXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighYUNoa0JveC5wcm9wKCdjaGVja2VkJykpIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhUGF0aD1hQ2hrQm94LmRhdGEoXCJwYXRoXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkTGl2ZU1vbml0b3JcIixcInR3aW5JRFwiOnR3aW5JRCxcInByb3BlcnR5UGF0aFwiOmFQYXRofSlcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZGlhbG9nLmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1widGV4dFwiOlwiQ2FuY2VsXCIsXCJjb2xvckNsYXNzXCI6XCJ3My1saWdodC1ncmF5XCIsXCJjbGlja0Z1bmNcIjooKT0+e2RpYWxvZy5jbG9zZSgpfX1cclxuICAgICAgICBdXHJcbiAgICB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd091dEJvdW5kPWFzeW5jIGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcclxuICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgY29sbGVjdGlvbi5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm8gPSBlbGVtZW50LmRhdGEoXCJvcmlnaW5hbEluZm9cIilcclxuICAgICAgICBpZiAob3JpZ2luYWxJbmZvWyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKG9yaWdpbmFsSW5mb1snJGR0SWQnXSlcclxuICAgIH0pO1xyXG5cclxuICAgIHdoaWxlICh0d2luSURBcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuXHJcbiAgICAgICAgdmFyIGtub3duVGFyZ2V0VHdpbnMgPSB7fVxyXG4gICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICBrbm93blRhcmdldFR3aW5zW29uZUlEXSA9IDEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICB2YXIgb3V0Qm91bmRSZWxhdGlvbiA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgaWYgKG91dEJvdW5kUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIG91dEJvdW5kUmVsYXRpb24uZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICE9IG51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdID0gMVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vcXVlcnlPdXRCb3VuZFwiLCBcIlBPU1RcIiwgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duVGFyZ2V0c1wiOiBrbm93blRhcmdldFR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW4gPSBvbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKGRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dJbkJvdW5kPWFzeW5jIGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcclxuICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgY29sbGVjdGlvbi5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm8gPSBlbGVtZW50LmRhdGEoXCJvcmlnaW5hbEluZm9cIilcclxuICAgICAgICBpZiAob3JpZ2luYWxJbmZvWyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKG9yaWdpbmFsSW5mb1snJGR0SWQnXSlcclxuICAgIH0pO1xyXG5cclxuICAgIHdoaWxlICh0d2luSURBcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIga25vd25Tb3VyY2VUd2lucyA9IHt9XHJcbiAgICAgICAgdmFyIElERGljdCA9IHt9XHJcbiAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIElERGljdFtvbmVJRF0gPSAxXHJcbiAgICAgICAgICAgIGtub3duU291cmNlVHdpbnNbb25lSURdID0gMSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmb3IgKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnMgPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXVxyXG4gICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgICAgIHZhciBzcmNJRCA9IG9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgaWYgKElERGljdFt0YXJnZXRJRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0gIT0gbnVsbCkga25vd25Tb3VyY2VUd2luc1tzcmNJRF0gPSAxXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5SW5Cb3VuZFwiLCBcIlBPU1RcIiwgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duU291cmNlc1wiOiBrbm93blNvdXJjZVR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQgPT4ge1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW4gPSBvbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKGRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZiAoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVFbGVtZW50c0FycmF5PWFzeW5jIGZ1bmN0aW9uKGFycikge1xyXG4gICAgaWYgKGFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG4gICAgdmFyIHJlbGF0aW9uc0FyciA9IFtdXHJcbiAgICB2YXIgdHdpbklEQXJyID0gW11cclxuICAgIHZhciB0d2luSURzID0ge31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm8gPSBlbGVtZW50LmRhdGEoXCJvcmlnaW5hbEluZm9cIilcclxuICAgICAgICBpZighb3JpZ2luYWxJbmZvKSByZXR1cm47XHJcbiAgICAgICAgaWYgKG9yaWdpbmFsSW5mb1snJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKG9yaWdpbmFsSW5mbyk7XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKG9yaWdpbmFsSW5mb1snJGR0SWQnXSlcclxuICAgICAgICAgICAgdHdpbklEc1tvcmlnaW5hbEluZm9bJyRkdElkJ11dID0gMVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZm9yICh2YXIgaSA9IHJlbGF0aW9uc0Fyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgeyAvL2NsZWFyIHRob3NlIHJlbGF0aW9uc2hpcHMgdGhhdCBhcmUgZ29pbmcgdG8gYmUgZGVsZXRlZCBhZnRlciB0d2lucyBkZWxldGluZ1xyXG4gICAgICAgIHZhciBzcmNJZCA9IHJlbGF0aW9uc0FycltpXVsnJHNvdXJjZUlkJ11cclxuICAgICAgICB2YXIgdGFyZ2V0SWQgPSByZWxhdGlvbnNBcnJbaV1bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgaWYgKHR3aW5JRHNbc3JjSWRdICE9IG51bGwgfHwgdHdpbklEc1t0YXJnZXRJZF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZWxhdGlvbnNBcnIuc3BsaWNlKGksIDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgZGlhbG9nU3RyID0gXCJcIlxyXG4gICAgdmFyIHR3aW5OdW1iZXIgPSB0d2luSURBcnIubGVuZ3RoO1xyXG4gICAgdmFyIHJlbGF0aW9uc051bWJlciA9IHJlbGF0aW9uc0Fyci5sZW5ndGg7XHJcbiAgICBpZiAodHdpbk51bWJlciA+IDApIGRpYWxvZ1N0ciA9IHR3aW5OdW1iZXIgKyBcIiB0d2luXCIgKyAoKHR3aW5OdW1iZXIgPiAxKSA/IFwic1wiIDogXCJcIikgKyBcIiAod2l0aCBjb25uZWN0ZWQgcmVsYXRpb25zKVwiXHJcbiAgICBpZiAodHdpbk51bWJlciA+IDAgJiYgcmVsYXRpb25zTnVtYmVyID4gMCkgZGlhbG9nU3RyICs9IFwiIGFuZCBhZGRpdGlvbmFsIFwiXHJcbiAgICBpZiAocmVsYXRpb25zTnVtYmVyID4gMCkgZGlhbG9nU3RyICs9IHJlbGF0aW9uc051bWJlciArIFwiIHJlbGF0aW9uXCIgKyAoKHJlbGF0aW9uc051bWJlciA+IDEpID8gXCJzXCIgOiBcIlwiKVxyXG4gICAgZGlhbG9nU3RyICs9IFwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgYXdhaXQgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHdpbklEQXJyLmxlbmd0aCA+IDApIGF3YWl0IHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKSB7XHJcbiAgICB2YXIgaW9URGV2aWNlcyA9IFtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVUd2luSUQgPT4ge1xyXG4gICAgICAgIHZhciBkYlR3aW5JbmZvID0gZ2xvYmFsQ2FjaGUuREJUd2luc1tvbmVUd2luSURdXHJcbiAgICAgICAgaWYgKGRiVHdpbkluZm8uSW9URGV2aWNlSUQgIT0gbnVsbCAmJiBkYlR3aW5JbmZvLklvVERldmljZUlEICE9IFwiXCIpIHtcclxuICAgICAgICAgICAgaW9URGV2aWNlcy5wdXNoKGRiVHdpbkluZm8uSW9URGV2aWNlSUQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIGlmIChpb1REZXZpY2VzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBtc2FsSGVscGVyLmNhbGxBUEkoXCJkZXZpY2VtYW5hZ2VtZW50L3VucmVnaXN0ZXJJb1REZXZpY2VzXCIsIFwiUE9TVFwiLCB7IGFycjogaW9URGV2aWNlcyB9KVxyXG4gICAgfVxyXG5cclxuICAgIHdoaWxlICh0d2luSURBcnIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVR3aW5zXCIsIFwiUE9TVFwiLCB7IGFycjogc21hbGxBcnIgfSwgXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgIHJlc3VsdC5mb3JFYWNoKChvbmVJRCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHZhciB0aGVNZXNzYWdlPXsgXCJtZXNzYWdlXCI6IFwidHdpbnNEZWxldGVkXCIsIHR3aW5JREFycjogcmVzdWx0IH1cclxuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb3JlLiQoJ1tpZCA9IFwiJyt0d2luRGlzcGxheU5hbWUrJ1wiXScpLnJlbW92ZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh0aGVNZXNzYWdlKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zQXJyKSB7XHJcbiAgICB2YXIgYXJyID0gW11cclxuICAgIHJlbGF0aW9uc0Fyci5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICBhcnIucHVzaCh7IHNyY0lEOiBvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10sIHJlbElEOiBvbmVSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ10gfSlcclxuICAgIH0pXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCB7IFwicmVsYXRpb25zXCI6IGFyciB9KVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlKGRhdGEpXHJcbiAgICAgICAgdGhpcy5yeE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZWxhdGlvbnNEZWxldGVkXCIsIFwicmVsYXRpb25zXCI6IGRhdGEgfSlcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNtYXJ0UG9zaXRpb25Ob2RlID0gZnVuY3Rpb24gKG1vdXNlUG9zaXRpb24pIHtcclxuICAgIHZhciB6b29tTGV2ZWw9dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoIXRoaXMuZHJhZ2dpbmdOb2RlKSByZXR1cm5cclxuICAgIC8vY29uc2lkZXIgbG9jayBtb3VzZSBtb3ZlIHBvc2l0aW9uIGZvciB0aGVzZSBub2RlczpcclxuICAgIC8vIC0gaXRzIGNvbm5lY3Rmcm9tIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0dG8gbm9kZXNcclxuICAgIC8vIC0gaXRzIGNvbm5lY3R0byBub2RlcyBhbmQgdGhlaXIgY29ubmVjdGZyb20gbm9kZXNcclxuICAgIHZhciBpbmNvbWVycz10aGlzLmRyYWdnaW5nTm9kZS5pbmNvbWVycygpXHJcbiAgICB2YXIgb3V0ZXJGcm9tSW5jb209IGluY29tZXJzLm91dGdvZXJzKClcclxuICAgIHZhciBvdXRlcj10aGlzLmRyYWdnaW5nTm9kZS5vdXRnb2VycygpXHJcbiAgICB2YXIgaW5jb21Gcm9tT3V0ZXI9b3V0ZXIuaW5jb21lcnMoKVxyXG4gICAgdmFyIG1vbml0b3JTZXQ9aW5jb21lcnMudW5pb24ob3V0ZXJGcm9tSW5jb20pLnVuaW9uKG91dGVyKS51bmlvbihpbmNvbUZyb21PdXRlcikuZmlsdGVyKCdub2RlJykudW5tZXJnZSh0aGlzLmRyYWdnaW5nTm9kZSlcclxuXHJcbiAgICB2YXIgcmV0dXJuRXhwZWN0ZWRQb3M9KGRpZmZBcnIscG9zQXJyKT0+e1xyXG4gICAgICAgIHZhciBtaW5EaXN0YW5jZT1NYXRoLm1pbiguLi5kaWZmQXJyKVxyXG4gICAgICAgIGlmKG1pbkRpc3RhbmNlKnpvb21MZXZlbCA8IDEwKSAgcmV0dXJuIHBvc0FycltkaWZmQXJyLmluZGV4T2YobWluRGlzdGFuY2UpXVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHhEaWZmPVtdXHJcbiAgICB2YXIgeFBvcz1bXVxyXG4gICAgdmFyIHlEaWZmPVtdXHJcbiAgICB2YXIgeVBvcz1bXVxyXG4gICAgbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgeERpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS54LW1vdXNlUG9zaXRpb24ueCkpXHJcbiAgICAgICAgeFBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLngpXHJcbiAgICAgICAgeURpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS55LW1vdXNlUG9zaXRpb24ueSkpXHJcbiAgICAgICAgeVBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLnkpXHJcbiAgICB9KVxyXG4gICAgdmFyIHByZWZYPXJldHVybkV4cGVjdGVkUG9zKHhEaWZmLHhQb3MpXHJcbiAgICB2YXIgcHJlZlk9cmV0dXJuRXhwZWN0ZWRQb3MoeURpZmYseVBvcylcclxuICAgIGlmKHByZWZYIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3gnLCBwcmVmWCk7XHJcbiAgICB9XHJcbiAgICBpZihwcmVmWSE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd5JywgcHJlZlkpO1xyXG4gICAgfVxyXG4gICAgLy9jb25zb2xlLmxvZyhcIi0tLS1cIilcclxuICAgIC8vbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57Y29uc29sZS5sb2coZWxlLmlkKCkpfSlcclxuICAgIC8vY29uc29sZS5sb2cobW9uaXRvclNldC5zaXplKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU92ZXJGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmKCFlLnRhcmdldC5kYXRhKSByZXR1cm5cclxuICAgIFxyXG4gICAgdmFyIGluZm89ZS50YXJnZXQuZGF0YSgpLm9yaWdpbmFsSW5mb1xyXG4gICAgaWYoaW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuXHJcbiAgICB0aGlzLmxhc3RDYWxjSW5wdXRTdHlsZU5vZGVzLmZvckVhY2goZWxlPT57ZWxlLnJlbW92ZUNsYXNzKFwiY2FsY0lucHV0XCIpfSlcclxuICAgIHRoaXMubGFzdENhbGNJbnB1dFN0eWxlTm9kZXMubGVuZ3RoPTBcclxuICAgIHRoaXMubGFzdENhbGNPdXRwdXRTdHlsZU5vZGVzLmZvckVhY2goZWxlPT57ZWxlLnJlbW92ZUNsYXNzKFwiY2FsY091dHB1dFwiKX0pXHJcbiAgICB0aGlzLmxhc3RDYWxjT3V0cHV0U3R5bGVOb2Rlcy5sZW5ndGg9MFxyXG4gICAgXHJcblxyXG4gICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9ZS50YXJnZXRcclxuICAgIGUudGFyZ2V0LmFkZENsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvSG92ZXJlZEVsZVwiLCBcImluZm9cIjogW2luZm9dLFwic2NyZWVuWFlcIjp0aGlzLmNvbnZlcnRQb3NpdGlvbihlLnBvc2l0aW9uLngsZS5wb3NpdGlvbi55KSB9KVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY2FsY3VsYXRpb24gc2NyaXB0IGluIGhvdmVyZWQgbm9kZSwgaGlnaGxpZ2h0IGlucHV0IG5vZGVzIGFuZCB0aGUgcHJvcGVydGllc1xyXG4gICAgaWYoaW5mb1tcIiRkdElkXCJdKXtcclxuICAgICAgICB2YXIgdHdpbklEPWluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBkYnR3aW49Z2xvYmFsQ2FjaGUuREJUd2luc1t0d2luSURdXHJcbiAgICAgICAgdmFyIGlucHV0QXJyID0gZGJ0d2luW1wiaW5wdXRzXCJdXHJcbiAgICAgICAgaWYoaW5wdXRBcnIpIGlucHV0QXJyLmZvckVhY2gob25lSW5wdXQ9Pnt0aGlzLnZpc3VhbGl6ZVNpbmdsZUlucHV0SW5Ud2luQ2FsY3VsYXRpb24ob25lSW5wdXQsZS50YXJnZXQpfSlcclxuXHJcbiAgICAgICAgdGhpcy5hbmFseXNlU2luZ2xlT3V0cHV0KGUudGFyZ2V0LGluZm9bXCIkZHRJZFwiXSlcclxuICAgIH1cclxuICAgIFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuYWx5c2VTaW5nbGVPdXRwdXQgPSBmdW5jdGlvbiAodHdpblRvcG9Ob2RlLHR3aW5JRCkge1xyXG4gICAgLy9jaGVjayBpZiBpdHMgb3V0cHV0IGlzIGFub3RoZXIgbm9kZSdzIGlucHV0XHJcbiAgICB2YXIgZnVydGhlcklucHV0c0Fycj1bXVxyXG4gICAgZm9yICh2YXIgYVR3aW5JRCBpbiBnbG9iYWxDYWNoZS5EQlR3aW5zKSB7XHJcbiAgICAgICAgdmFyIGNoZWNrREJUd2luID0gZ2xvYmFsQ2FjaGUuREJUd2luc1thVHdpbklEXVxyXG4gICAgICAgIHZhciBpbnB1dEFycj1jaGVja0RCVHdpbltcImlucHV0c1wiXVxyXG4gICAgICAgIGlmKCFpbnB1dEFycikgY29udGludWU7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxpbnB1dEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFGdXJ0aGVySW5wdXQ9aW5wdXRBcnJbaV1cclxuICAgICAgICAgICAgaWYoYUZ1cnRoZXJJbnB1dC50d2luSUQ9PXR3aW5JRCl7XHJcbiAgICAgICAgICAgICAgICBmdXJ0aGVySW5wdXRzQXJyLnB1c2goe1wicGF0aFwiOmFGdXJ0aGVySW5wdXQucGF0aCxcInRhcmdldFR3aW5OYW1lXCI6Y2hlY2tEQlR3aW4uZGlzcGxheU5hbWV9KVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihmdXJ0aGVySW5wdXRzQXJyKSBmdXJ0aGVySW5wdXRzQXJyLmZvckVhY2gob25lRnVydGhlcklucHV0PT57XHJcbiAgICAgICAgdGhpcy52aXN1YWxpemVTaW5nbGVJbnB1dEluVHdpbkNhbGN1bGF0aW9uKG9uZUZ1cnRoZXJJbnB1dCx0d2luVG9wb05vZGUpXHJcbiAgICB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudmlzdWFsaXplU2luZ2xlSW5wdXRJblR3aW5DYWxjdWxhdGlvbiA9IGZ1bmN0aW9uIChvbmVJbnB1dCx0d2luVG9wb05vZGUpIHtcclxuICAgIHZhciB0d2luTmFtZSA9IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lSW5wdXQudHdpbklEXVxyXG4gICAgdmFyIGVkZ2VzPW51bGw7XHJcbiAgICBpZihvbmVJbnB1dC50YXJnZXRUd2luTmFtZSl7XHJcbiAgICAgICAgdmFyIHRhcmdldFR3aW5Ob2RlID0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiICsgb25lSW5wdXQudGFyZ2V0VHdpbk5hbWUpXHJcbiAgICAgICAgaWYgKHRhcmdldFR3aW5Ob2RlKSB7XHJcbiAgICAgICAgICAgIHRhcmdldFR3aW5Ob2RlLmFkZENsYXNzKFwiY2FsY091dHB1dFwiKVxyXG4gICAgICAgICAgICB0aGlzLmxhc3RDYWxjT3V0cHV0U3R5bGVOb2Rlcy5wdXNoKHRhcmdldFR3aW5Ob2RlKVxyXG4gICAgICAgICAgICAvL2ZpbmQgdGhlIGZpcnN0IHJlbGF0aW9uc2hpcCBsaW5rIGZyb20gdGhpcyBub2RlIHRvIGhvdmVyZWQgbm9kZVxyXG4gICAgICAgICAgICB2YXIgZWRnZXMgPSB0d2luVG9wb05vZGUuZWRnZXNUbyh0YXJnZXRUd2luTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHZhciBpbnB1dFR3aW5Ob2RlID0gdGhpcy5jb3JlLm5vZGVzKFwiI1wiICsgdHdpbk5hbWUpXHJcbiAgICAgICAgaWYgKGlucHV0VHdpbk5vZGUpIHtcclxuICAgICAgICAgICAgaW5wdXRUd2luTm9kZS5hZGRDbGFzcyhcImNhbGNJbnB1dFwiKVxyXG4gICAgICAgICAgICB0aGlzLmxhc3RDYWxjSW5wdXRTdHlsZU5vZGVzLnB1c2goaW5wdXRUd2luTm9kZSlcclxuICAgICAgICAgICAgLy9maW5kIHRoZSBmaXJzdCByZWxhdGlvbnNoaXAgbGluayBmcm9tIHRoaXMgbm9kZSB0byBob3ZlcmVkIG5vZGVcclxuICAgICAgICAgICAgdmFyIGVkZ2VzID0gaW5wdXRUd2luTm9kZS5lZGdlc1RvKHR3aW5Ub3BvTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihlZGdlcyAmJiBlZGdlcy5sZW5ndGggPiAwKXtcclxuICAgICAgICBpZihvbmVJbnB1dC50YXJnZXRUd2luTmFtZSkge1xyXG4gICAgICAgICAgICBlZGdlc1swXS5hZGRDbGFzcyhcImNhbGNPdXRwdXRcIilcclxuICAgICAgICAgICAgdGhpcy5sYXN0Q2FsY091dHB1dFN0eWxlTm9kZXMucHVzaChlZGdlc1swXSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZWRnZXNbMF0uYWRkQ2xhc3MoXCJjYWxjSW5wdXRcIilcclxuICAgICAgICAgICAgdGhpcy5sYXN0Q2FsY0lucHV0U3R5bGVOb2Rlcy5wdXNoKGVkZ2VzWzBdKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgdmFyIGN1cnJlbnRQUGF0aCA9IGVkZ2VzWzBdLmRhdGEoJ3BwYXRoJykgfHwgXCJcIlxyXG4gICAgICAgIGlmIChjdXJyZW50UFBhdGggIT0gXCJcIikgY3VycmVudFBQYXRoICs9IFwiO1wiXHJcbiAgICAgICAgY3VycmVudFBQYXRoICs9IG9uZUlucHV0LnBhdGguam9pbihcIi9cIilcclxuICAgICAgICBlZGdlc1swXS5kYXRhKCdwcGF0aCcsIGN1cnJlbnRQUGF0aClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcmFuZE9mZnNldD0gcGFyc2VJbnQoTWF0aC5yYW5kb20oKSo0MCkrMjBcclxuICAgICAgICBlZGdlc1swXS5kYXRhKCdwcGF0aE9mZnNldCcsIHJhbmRPZmZzZXQrXCIlXCIpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNvbnZlcnRQb3NpdGlvbj1mdW5jdGlvbih4LHkpe1xyXG4gICAgdmFyIHZwRXh0ZW50PXRoaXMuY29yZS5leHRlbnQoKVxyXG4gICAgdmFyIHNjcmVlblc9dGhpcy5ET00ud2lkdGgoKVxyXG4gICAgdmFyIHNjcmVlbkg9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBzY3JlZW5YID0gKHgtdnBFeHRlbnQueDEpLyh2cEV4dGVudC53KSpzY3JlZW5XICsgdGhpcy5ET00ub2Zmc2V0KCkubGVmdFxyXG4gICAgdmFyIHNjcmVlblk9KHktdnBFeHRlbnQueTEpLyh2cEV4dGVudC5oKSpzY3JlZW5IKyB0aGlzLkRPTS5vZmZzZXQoKS50b3BcclxuICAgIHJldHVybiB7eDpzY3JlZW5YLHk6c2NyZWVuWX1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3V0RnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZighZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKXsgLy9zaW5jZSBmbG9hdGluZyB3aW5kb3cgaXMgdXNlZCBmb3IgbW91c2UgaG92ZXIgZWxlbWVudCBpbmZvLCBzbyBpbmZvIHBhbmVsIG5ldmVyIGNoYWduZSBiZWZvcmUsIHRoYXQgaXMgd2h5IHRoZXJlIGlzIG5vIG5lZWQgdG8gcmVzdG9yZSBiYWNrIHRoZSBpbmZvIHBhbmVsIGluZm9ybWF0aW9uIGF0IG1vdXNlb3V0XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEKXtcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9Hcm91cE5vZGVcIiwgXCJpbmZvXCI6IHtcIkBpZFwiOmdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRH0gfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0b3BvbG9neU1vdXNlT3V0XCJ9KVxyXG5cclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KXtcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9bnVsbDtcclxuICAgIH0gXHJcbiAgICB0aGlzLmxhc3RDYWxjSW5wdXRTdHlsZU5vZGVzLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgZWxlLnJlbW92ZUNsYXNzKFwiY2FsY0lucHV0XCIpXHJcbiAgICAgICAgZWxlLmRhdGEoJ3BwYXRoJyxudWxsKVxyXG4gICAgfSlcclxuICAgIHRoaXMubGFzdENhbGNJbnB1dFN0eWxlTm9kZXMubGVuZ3RoPTBcclxuICAgIHRoaXMubGFzdENhbGNPdXRwdXRTdHlsZU5vZGVzLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgZWxlLnJlbW92ZUNsYXNzKFwiY2FsY091dHB1dFwiKVxyXG4gICAgICAgIGVsZS5kYXRhKCdwcGF0aCcsbnVsbClcclxuICAgIH0pXHJcbiAgICB0aGlzLmxhc3RDYWxjT3V0cHV0U3R5bGVOb2Rlcy5sZW5ndGg9MFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICB2YXIgcmUgPSBbXVxyXG4gICAgYXJyLmZvckVhY2goKGVsZSkgPT4geyByZS5wdXNoKGVsZS5kYXRhKCkub3JpZ2luYWxJbmZvKSB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHJlIH0pXHJcbiAgICAvL2ZvciBkZWJ1Z2dpbmcgcHVycG9zZVxyXG4gICAgLy9hcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgLy8gIGNvbnNvbGUubG9nKFwiXCIpXHJcbiAgICAvL30pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXRGb250U2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7XHJcbiAgICAgICAgdmFyIG1heEZTPTEyXHJcbiAgICAgICAgdmFyIG1pbkZTPTVcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KihjdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1heEZTL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIG1heEZTPTEyMFxyXG4gICAgICAgIHZhciBtaW5GUz0xMlxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKDEvY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtaW5GUypyYXRpbylcclxuICAgIH1cclxuICAgIHJldHVybiBmcztcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXsvL3NjYWxlIHVwIGJ1dCBub3QgdG9vIG11Y2hcclxuICAgICAgICB2YXIgcmF0aW89IChjdXJab29tLTEpKigyLTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmF0aW89ICgxL2N1clpvb20tMSkqKDQtMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZSpyYXRpbylcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbEF2YXJ0YT1mdW5jdGlvbihtb2RlbElELGRhdGFVcmwpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbXHJcbiAgICAgICAgICAgIHtzZWxlY3Rvcjonbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScsc3R5bGU6eydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH19XHJcbiAgICAgICAgXSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH0gICBcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVTdHlsZVNoZWV0PWZ1bmN0aW9uKHN0eWxlQXJyKXtcclxuICAgIC8vcmVzZXJ2ZSB0aGUgdHdvIHN0eWxlcyBvZiBlZGdlZWRpdGluZyBwbHVnaW4gZmlyc3QsIHJpZ2h0IG5vdyB0aGVyZSBpcyBubyBiZXR0ZXIgd2F5IHRvIHJlc2VydmUgdGhlbVxyXG4gICAgdmFyIGFsbFN0eWxlPXRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICB2YXIgZWRnZUJlbmRTdHlsZT1udWxsXHJcbiAgICB2YXIgZWRnZUNvbnRyb2xTdHlsZT1udWxsXHJcbiAgICBmb3IodmFyIGluZCBpbiBhbGxTdHlsZSl7XHJcbiAgICAgICAgaWYodHlwZW9mKGFsbFN0eWxlW2luZF0pIT1cIm9iamVjdFwiKSBjb250aW51ZVxyXG4gICAgICAgIGlmKCFhbGxTdHlsZVtpbmRdLnNlbGVjdG9yKSBjb250aW51ZVxyXG4gICAgICAgIHZhciBzdHI9YWxsU3R5bGVbaW5kXS5zZWxlY3Rvci5pbnB1dFRleHRcclxuICAgICAgICBpZihzdHI9PVwiLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzXCIpe1xyXG4gICAgICAgICAgICBlZGdlQmVuZFN0eWxlPWFsbFN0eWxlW2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoc3RyPT1cIi5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50c1wiKXtcclxuICAgICAgICAgICAgZWRnZUNvbnRyb2xTdHlsZT1hbGxTdHlsZVtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vZG8gc3R5bGUgbWVyZ2luZ1xyXG4gICAgdmFyIG1lcmdlU2VsZWN0b3I9e31cclxuICAgIHN0eWxlQXJyLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgbWVyZ2VTZWxlY3RvcltlbGUuc2VsZWN0b3JdPWVsZS5zdHlsZVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc3R5bGVKc29uID0gdGhpcy5jb3JlLnN0eWxlKCkuanNvbigpO1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gc3R5bGVKc29uKXtcclxuICAgICAgICBpZihtZXJnZVNlbGVjdG9yW3N0eWxlSnNvbltpbmRdLnNlbGVjdG9yXSkge1xyXG4gICAgICAgICAgICB2YXIgb2xkcz0gc3R5bGVKc29uW2luZF0uc3R5bGVcclxuICAgICAgICAgICAgdmFyIG5ld3M9bWVyZ2VTZWxlY3RvcltzdHlsZUpzb25baW5kXS5zZWxlY3Rvcl0gXHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9sZHMpe1xyXG4gICAgICAgICAgICAgICAgaWYobmV3c1tpbmRdIT1udWxsKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgbmV3c1tpbmRdPW9sZHNbaW5kXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRpbnVlXHJcbiAgICAgICAgfWVsc2UgaWYoc3R5bGVKc29uW2luZF0uc2VsZWN0b3I9PVwiLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzXCIgfHxzdHlsZUpzb25baW5kXS5zZWxlY3Rvcj09XCIuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHNcIiApIGNvbnRpbnVlXHJcbiAgICAgICAgZWxzZSBpZih0aGlzLmhpZ2hlc3RTdHlsZVNlbGVjdG9yc1tzdHlsZUpzb25baW5kXS5zZWxlY3Rvcl0pIGNvbnRpbnVlXHJcbiAgICAgICAgXHJcbiAgICAgICAgYXJyLnB1c2goc3R5bGVKc29uW2luZF0pXHJcbiAgICB9XHJcbiAgICBhcnI9YXJyLmNvbmNhdChzdHlsZUFycilcclxuICAgIGFycj1hcnIuY29uY2F0KHRoaXMuaGlnaGVzdFN0eWxlQXJyKVxyXG4gICAgdGhpcy5jb3JlLnN0eWxlKCkuZnJvbUpzb24oYXJyKS51cGRhdGUoKVxyXG4gICAgaWYoZWRnZUJlbmRTdHlsZSl7XHJcbiAgICAgICAgYWxsU3R5bGU9dGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICB2YXIgY3VyTGVuPWFsbFN0eWxlLmxlbmd0aDtcclxuICAgICAgICBhbGxTdHlsZS5sZW5ndGg9Y3VyTGVuKzJcclxuICAgICAgICBhbGxTdHlsZVtjdXJMZW5dPWVkZ2VCZW5kU3R5bGVcclxuICAgICAgICBhbGxTdHlsZVtjdXJMZW4rMV09ZWRnZUNvbnRyb2xTdHlsZVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUsc2Vjb25kQ29sb3JDb2RlKXtcclxuICAgIHZhciBzdHlsZUpzb24gPSB0aGlzLmNvcmUuc3R5bGUoKS5qc29uKCk7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBzdHlsZUpzb24pe1xyXG4gICAgICAgIGFyci5wdXNoKHN0eWxlSnNvbltpbmRdLnNlbGVjdG9yKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBzdHlsZVNlbGVjdG9yPSdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXSdcclxuICAgIHZhciBzdHlsZU9iaj1udWxsXHJcbiAgICBpZiAoc2Vjb25kQ29sb3JDb2RlID09IG51bGwpIHtcclxuICAgICAgICBpZihjb2xvckNvZGU9PVwibm9uZVwiKXtcclxuICAgICAgICAgICAgc3R5bGVPYmo9eyAnYmFja2dyb3VuZC1maWxsJzogJ3NvbGlkJywnYmFja2dyb3VuZC1jb2xvcic6ICdkYXJrR3JheScsJ2JhY2tncm91bmQtb3BhY2l0eSc6MCB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN0eWxlT2JqPXsgJ2JhY2tncm91bmQtZmlsbCc6ICdzb2xpZCcsJ2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGUgLCdiYWNrZ3JvdW5kLW9wYWNpdHknOjF9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb2xvckNvZGU9Y29sb3JDb2RlfHxcImRhcmtHcmF5XCJcclxuICAgICAgICBpZihjb2xvckNvZGU9PVwibm9uZVwiKSBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgc3R5bGVPYmo9e1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6ICdsaW5lYXItZ3JhZGllbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOiBbY29sb3JDb2RlLCBjb2xvckNvZGUsIHNlY29uZENvbG9yQ29kZV0sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6IFsnMCUnLCAnNTAlJywgJzUxJSddXHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKHN0eWxlT2JqKSB0aGlzLnVwZGF0ZVN0eWxlU2hlZXQoW3tzZWxlY3RvcjpzdHlsZVNlbGVjdG9yLHN0eWxlOnN0eWxlT2JqfV0pIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICB2YXIgbmV3U3R5bGVcclxuICAgIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgbmV3U3R5bGU9e3NlbGVjdG9yOidub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJyxzdHlsZTp7J3NoYXBlJzogJ3BvbHlnb24nLCdzaGFwZS1wb2x5Z29uLXBvaW50cyc6WzAsLTEsMC44NjYsLTAuNSwwLjg2NiwwLjUsMCwxLC0wLjg2NiwwLjUsLTAuODY2LC0wLjVdfX1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIG5ld1N0eWxlPXtzZWxlY3Rvcjonbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScsc3R5bGU6eydzaGFwZSc6IHNoYXBlfX1cclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbbmV3U3R5bGVdKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uPWZ1bmN0aW9uKG1vZGVsSUQsZGltZW5zaW9uUmF0aW8pe1xyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdPXBhcnNlRmxvYXQoZGltZW5zaW9uUmF0aW8pXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFtcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJywgc3R5bGU6eydsaW5lLWNvbG9yJzogY29sb3JDb2RlfX1cclxuICAgIF0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZT1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsc2hhcGUpe1xyXG4gICAgdmFyIG5ld1N0eWxlXHJcbiAgICBpZihzaGFwZT09XCJzb2xpZFwiKXtcclxuICAgICAgICBuZXdTdHlsZT17c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJywgc3R5bGU6eydsaW5lLXN0eWxlJzogc2hhcGV9fVxyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwiZG90dGVkXCIpe1xyXG4gICAgICAgIG5ld1N0eWxlPXtzZWxlY3RvcjonZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nLCBzdHlsZTp7J2xpbmUtc3R5bGUnOiAnZGFzaGVkJywnbGluZS1kYXNoLXBhdHRlcm4nOls4LDhdfX1cclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbbmV3U3R5bGVdKSAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwV2lkdGg9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGVkZ2VXaWR0aCl7XHJcbiAgICB2YXIgYXJyPVtcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJyxzdHlsZTp7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCl9fSxcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2U6c2VsZWN0ZWRbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJyxzdHlsZTp7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrMSwnbGluZS1jb2xvcic6ICdyZWQnfX0sXHJcbiAgICAgICAge3NlbGVjdG9yOidlZGdlLmhvdmVyW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScsc3R5bGU6eyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzN9fVxyXG4gICAgXVxyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KGFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJlZmxlY3RSZWxhdGlvbnNEZWxldGVkPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJyt0aGVOb2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0d2luLndpZHRoKClcclxuICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbioyLCd3aWR0aCc6IGN1ckRpbWVuc2lvbioyIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24sJ3dpZHRoJzogY3VyRGltZW5zaW9uIH0sXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgICAgICAgICAgLGNvbXBsZXRlOigpPT57XHJcbiAgICAgICAgICAgICAgICB0d2luLnJlbW92ZVN0eWxlKCkgLy9tdXN0IHJlbW92ZSB0aGUgc3R5bGUgYWZ0ZXIgYW5pbWF0aW9uLCBvdGhlcndpc2UgdGhleSB3aWxsIGhhdmUgdGhlaXIgb3duIHN0eWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sMjAwKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSxhbmltYXRpb24pe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0d2luc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz10d2luc0RhdGFbaV07XHJcbiAgICAgICAgdmFyIG5ld05vZGU9e2RhdGE6e30sZ3JvdXA6XCJub2Rlc1wifVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT0gb3JpZ2luYWxJbmZvO1xyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcImlkXCJdPW9yaWdpbmFsSW5mb1snZGlzcGxheU5hbWUnXVxyXG4gICAgICAgIHZhciBtb2RlbElEPW9yaWdpbmFsSW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wibW9kZWxJRFwiXT1tb2RlbElEXHJcbiAgICAgICAgYXJyLnB1c2gobmV3Tm9kZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gZWxlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlDdXJyZW50TGF5b3V0V2l0aE5vQW5pbXRhaW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dE5hbWUgPSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgaWYgKGxheW91dE5hbWUgIT0gbnVsbCkge1xyXG4gICAgICAgIHZhciBsYXlvdXREZXRhaWwgPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdLmRldGFpbFxyXG4gICAgICAgIGlmIChsYXlvdXREZXRhaWwpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGxheW91dERldGFpbCwgbnVsbCwgXCJub0FuaW1hdGlvblwiKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuY29yZS5jZW50ZXIodGhpcy5jb3JlLm5vZGVzKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3UmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgdmFyIHJlbGF0aW9uSW5mb0Fycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTxyZWxhdGlvbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89cmVsYXRpb25zRGF0YVtpXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGhlSUQ9b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddK1wiX1wiK29yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICB2YXIgYVJlbGF0aW9uPXtkYXRhOnt9LGdyb3VwOlwiZWRnZXNcIn1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT1vcmlnaW5hbEluZm9cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcImlkXCJdPXRoZUlEXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl09Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvcmlnaW5hbEluZm9bJyRzb3VyY2VJZCddXVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckdGFyZ2V0SWQnXV1cclxuXHJcblxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKS5sZW5ndGg9PTAgfHwgdGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl0pLmxlbmd0aD09MCkgY29udGludWVcclxuICAgICAgICB2YXIgc291cmNlTm9kZT10aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSlcclxuICAgICAgICB2YXIgc291cmNlTW9kZWw9c291cmNlTm9kZVswXS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBcclxuICAgICAgICAvL2FkZCBhZGRpdGlvbmFsIHNvdXJjZSBub2RlIGluZm9ybWF0aW9uIHRvIHRoZSBvcmlnaW5hbCByZWxhdGlvbnNoaXAgaW5mb3JtYXRpb25cclxuICAgICAgICBvcmlnaW5hbEluZm9bJ3NvdXJjZU1vZGVsJ109c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZU1vZGVsXCJdPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJyZWxhdGlvbnNoaXBOYW1lXCJdPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXVxyXG5cclxuICAgICAgICB2YXIgZXhpc3RFZGdlPXRoaXMuY29yZS4kKCdlZGdlW2lkID0gXCInK3RoZUlEKydcIl0nKVxyXG4gICAgICAgIGlmKGV4aXN0RWRnZS5zaXplKCk+MCkge1xyXG4gICAgICAgICAgICBleGlzdEVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiLG9yaWdpbmFsSW5mbylcclxuICAgICAgICAgICAgY29udGludWU7ICAvL25vIG5lZWQgdG8gZHJhdyBpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVsYXRpb25JbmZvQXJyLnB1c2goYVJlbGF0aW9uKVxyXG4gICAgfVxyXG4gICAgaWYocmVsYXRpb25JbmZvQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIGVkZ2VzPXRoaXMuY29yZS5hZGQocmVsYXRpb25JbmZvQXJyKVxyXG4gICAgcmV0dXJuIGVkZ2VzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3PWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NoZWNrIHRoZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgYWdhaW4gYW5kIG1heWJlIHNvbWUgb2YgdGhlbSBjYW4gYmUgZHJhd24gbm93IHNpbmNlIHRhcmdldE5vZGUgaXMgYXZhaWxhYmxlXHJcbiAgICB2YXIgc3RvcmVkUmVsYXRpb25BcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgc3RvcmVkUmVsYXRpb25BcnI9c3RvcmVkUmVsYXRpb25BcnIuY29uY2F0KGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKHN0b3JlZFJlbGF0aW9uQXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPWZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5zQW5kUmVsYXRpb25zPWRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9uc1xyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBuZXcgdHdpbnMgZmlyc3RcclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHR3aW5JbmZvQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpIHR3aW5JbmZvQXJyLnB1c2gob25lU2V0LmNoaWxkVHdpbnNbaW5kXSlcclxuICAgICAgICB2YXIgZWxlcz10aGlzLmRyYXdUd2lucyh0d2luSW5mb0FycixcImFuaW1hdGlvblwiKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0aGlzLmRyYXdUd2lucyh0bXBBcnIpXHJcblxyXG4gICAgLy90aGVuIGNoZWNrIGFsbCBzdG9yZWQgcmVsYXRpb25zaGlwcyBhbmQgZHJhdyBpZiBpdCBjYW4gYmUgZHJhd25cclxuICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yLHZpc3VhbEpzb25bbW9kZWxJRF0uc2Vjb25kQ29sb3IpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5yZWxzKXtcclxuICAgICAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBOYW1lIGluIHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3IpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmVkZ2VXaWR0aClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVwbGFjZUFsbFR3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgdGhpcy5hcHBseUN1cnJlbnRMYXlvdXRXaXRoTm9BbmltdGFpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInByb2plY3RJc0NoYW5nZWRcIikge1xyXG4gICAgICAgIHRoaXMuYXBwbHlWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG4gICAgICAgIHRoaXMuYXBwbHlDdXJyZW50TGF5b3V0V2l0aE5vQW5pbXRhaW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICB2YXIgbGF5b3V0RGV0YWlsPW51bGxcclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVdLmRldGFpbFxyXG4gICAgICAgICAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpICB0aGlzLm5vUG9zaXRpb25fY29zZSgpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5hcHBseUN1cnJlbnRMYXlvdXRXaXRoTm9BbmltdGFpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKFttc2dQYXlsb2FkLnR3aW5JbmZvXSxcImFuaW1hdGlvblwiKVxyXG4gICAgICAgIHZhciBub2RlSW5mbz0gbXNnUGF5bG9hZC50d2luSW5mbztcclxuICAgICAgICB2YXIgbm9kZU5hbWU9IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbbm9kZUluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlTmFtZSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbj10b3BvTm9kZS5yZW5kZXJlZFBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnBhbkJ5KHt4Oi1wb3NpdGlvbi54KzIwMCx5Oi1wb3NpdGlvbi55KzUwfSlcclxuICAgICAgICAgICAgdG9wb05vZGUuc2VsZWN0KClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5zXCIpIHtcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLnR3aW5zSW5mbyxcImFuaW1hdGlvblwiKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXsgLy9mcm9tIHNlbGVjdGluZyB0d2lucyBpbiB0aGUgdHdpbnRyZWVcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBtb3VzZUNsaWNrRGV0YWlsPW1zZ1BheWxvYWQubW91c2VDbGlja0RldGFpbDtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFUd2luPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrZWxlbWVudFsnZGlzcGxheU5hbWUnXSlcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW25vZGVJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB0aGlzLmNvcmUuY2VudGVyKHRvcG9Ob2RlKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZWRnZVdpZHRoKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5lZGdlV2lkdGgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmNvbG9yLG1zZ1BheWxvYWQuc2Vjb25kQ29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbykgIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVsYXRpb25zRGVsZXRlZFwiKSB0aGlzLnJlZmxlY3RSZWxhdGlvbnNEZWxldGVkKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2F2ZUxheW91dFwiKXsgdGhpcy5zYXZlTGF5b3V0KG1zZ1BheWxvYWQubGF5b3V0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJsYXlvdXRDaGFuZ2VcIikgdGhpcy5jaG9vc2VMYXlvdXQoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhbGlnblNlbGVjdGVkTm9kZVwiKSB0aGlzLmFsaWduU2VsZWN0ZWROb2Rlcyhtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIikgdGhpcy5kaXN0cmlidXRlU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicm90YXRlU2VsZWN0ZWROb2RlXCIpIHRoaXMucm90YXRlU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibWlycm9yU2VsZWN0ZWROb2RlXCIpIHRoaXMubWlycm9yU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZGltZW5zaW9uU2VsZWN0ZWROb2RlXCIpIHRoaXMuZGltZW5zaW9uU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlld1R5cGVDaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC52aWV3VHlwZT09XCJUb3BvbG9neVwiKSB0aGlzLnNob3dTZWxmKClcclxuICAgICAgICBlbHNlIHRoaXMuaGlkZVNlbGYoKVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2hvb3NlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmIChsYXlvdXROYW1lID09IFwiW05BXVwiKSB7XHJcbiAgICAgICAgLy9zZWxlY3QgYWxsIHZpc2libGUgbm9kZXMgYW5kIGRvIGEgQ09TRSBsYXlvdXQsIGNsZWFuIGFsbCBiZW5kIGVkZ2UgbGluZSBhcyB3ZWxsXHJcbiAgICAgICAgdmFyIGN1cnJlbnRMYXlvdXQ9dGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2UgPT4ge1xyXG4gICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpXHJcbiAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJylcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsIFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLCBbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsIFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLCBbXSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKG51bGwsY3VycmVudExheW91dClcclxuICAgIH0gZWxzZSBpZiAobGF5b3V0TmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgdmFyIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV0uZGV0YWlsXHJcbiAgICAgICAgaWYgKGxheW91dERldGFpbCkge1xyXG4gICAgICAgICAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obGF5b3V0RGV0YWlsLCB0aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd1NlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmFuaW1hdGUoe2hlaWdodDogXCIxMDAlXCJ9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmhpZGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uYW5pbWF0ZSh7aGVpZ2h0OiBcIjAlXCJ9LCgpPT57dGhpcy5ET00uaGlkZSgpfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaW1lbnNpb25TZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgcmF0aW89MS4yXHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJleHBhbmRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlcipyYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIqcmF0aW9dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiY29tcHJlc3NcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlci9yYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIvcmF0aW9dXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5taXJyb3JTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYLXhvZmZjZW50ZXIsY3VyUG9zWyd5J11dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGNlbnRlclkteW9mZmNlbnRlcl1cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJvdGF0ZVNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreW9mZmNlbnRlcixjZW50ZXJZLXhvZmZjZW50ZXJdXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgteW9mZmNlbnRlcixjZW50ZXJZK3hvZmZjZW50ZXJdXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaXN0cmlidXRlU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MykgcmV0dXJuO1xyXG4gICAgdmFyIG51bUFycj1bXVxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIGxheW91dEZvclNvcnQ9W11cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneSddKVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3gnXSlcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIGxheW91dEZvclNvcnQucHVzaCh7aWQ6bm9kZUlELHg6Y3VyUG9zWyd4J10seTpjdXJQb3NbJ3knXX0pXHJcbiAgICB9KVxyXG5cclxuICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBsYXlvdXRGb3JTb3J0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYVtcInlcIl0tYltcInlcIl0gfSlcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbGF5b3V0Rm9yU29ydC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGFbXCJ4XCJdLWJbXCJ4XCJdIH0pXHJcbiAgICBcclxuICAgIHZhciBtaW5WPU1hdGgubWluKC4uLm51bUFycilcclxuICAgIHZhciBtYXhWPU1hdGgubWF4KC4uLm51bUFycilcclxuICAgIGlmKG1pblY9PW1heFYpIHJldHVybjtcclxuICAgIHZhciBnYXA9KG1heFYtbWluVikvKHNlbGVjdGVkTm9kZXMuc2l6ZSgpLTEpXHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgdmFyIGN1clY9bGF5b3V0Rm9yU29ydFswXVtcInlcIl1cclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgY3VyVj1sYXlvdXRGb3JTb3J0WzBdW1wieFwiXVxyXG4gICAgZm9yKHZhciBpPTA7aTxsYXlvdXRGb3JTb3J0Lmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVOb2RlSW5mbz1sYXlvdXRGb3JTb3J0W2ldXHJcbiAgICAgICAgaWYoaT09MHx8IGk9PWxheW91dEZvclNvcnQubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtvbmVOb2RlSW5mb1sneCddLG9uZU5vZGVJbmZvWyd5J11dXHJcbiAgICAgICAgICAgIGNvbnRpbnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1clYrPWdhcDtcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bb25lTm9kZUluZm9bJ3gnXSxjdXJWXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bY3VyVixvbmVOb2RlSW5mb1sneSddXVxyXG4gICAgfVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbGlnblNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgbnVtQXJyPVtdXHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidG9wXCJ8fCBkaXJlY3Rpb249PVwiYm90dG9tXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd5J10pXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwibGVmdFwifHwgZGlyZWN0aW9uPT1cInJpZ2h0XCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd4J10pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRhcmdldFg9bnVsbFxyXG4gICAgdmFyIHRhcmdldFk9bnVsbFxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInRvcFwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiYm90dG9tXCIpIHZhciB0YXJnZXRZPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBpZihkaXJlY3Rpb249PVwibGVmdFwiKSB2YXIgdGFyZ2V0WD0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgdmFyIHRhcmdldFg9IE1hdGgubWF4KC4uLm51bUFycilcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIG5ld0xheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBpZih0YXJnZXRYIT1udWxsKSBuZXdMYXlvdXRbbm9kZUlEXVswXT10YXJnZXRYXHJcbiAgICAgICAgaWYodGFyZ2V0WSE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMV09dGFyZ2V0WVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmVkcmF3QmFzZWRPbkxheW91dERldGFpbCA9IGZ1bmN0aW9uIChsYXlvdXREZXRhaWwsb25seUFkanVzdE5vZGVQb3NpdGlvbixub0FuaW1hdGlvbikge1xyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIGlmKCFvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIGlmKGxheW91dERldGFpbD09bnVsbCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICB2YXIgc3RvcmVkUG9zaXRpb25zPXt9XHJcbiAgICBmb3IodmFyIGluZCBpbiBsYXlvdXREZXRhaWwpe1xyXG4gICAgICAgIGlmKGluZCA9PSBcImVkZ2VzXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiAoKG5vQW5pbWF0aW9uKT9mYWxzZTp0cnVlKSxcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogMzAwLFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG5cclxuICAgIC8vcmVzdG9yZSBlZGdlcyBiZW5kaW5nIG9yIGNvbnRyb2wgcG9pbnRzXHJcbiAgICB2YXIgZWRnZVBvaW50c0RpY3Q9bGF5b3V0RGV0YWlsW1wiZWRnZXNcIl1cclxuICAgIGlmKGVkZ2VQb2ludHNEaWN0PT1udWxsKXJldHVybjtcclxuICAgIGZvcih2YXIgc3JjSUQgaW4gZWRnZVBvaW50c0RpY3Qpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwSUQgaW4gZWRnZVBvaW50c0RpY3Rbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIG9iaj1lZGdlUG9pbnRzRGljdFtzcmNJRF1bcmVsYXRpb25zaGlwSURdXHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMoc3JjSUQscmVsYXRpb25zaGlwSUQsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdXHJcbiAgICAgICAgICAgICxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyA9IGZ1bmN0aW9uIChuZXdMYXlvdXREZXRhaWwsb2xkTGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24pIHtcclxuICAgIC8vc3RvcmUgY3VycmVudCBsYXlvdXQgZm9yIHVuZG8gb3BlcmF0aW9uXHJcbiAgICB0aGlzLnVyLmFjdGlvbiggXCJjaGFuZ2VMYXlvdXRcIlxyXG4gICAgICAgICwgKGFyZyk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGFyZy5uZXdMYXlvdXREZXRhaWwsYXJnLm9ubHlBZGp1c3ROb2RlUG9zaXRpb24pICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ1xyXG4gICAgICAgIH1cclxuICAgICAgICAsIChhcmcpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3QmFzZWRPbkxheW91dERldGFpbChhcmcub2xkTGF5b3V0RGV0YWlsLGFyZy5vbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgdGhpcy51ci5kbyhcImNoYW5nZUxheW91dFwiXHJcbiAgICAgICAgLCB7IGZpcnN0VGltZTogdHJ1ZSwgXCJuZXdMYXlvdXREZXRhaWxcIjogbmV3TGF5b3V0RGV0YWlsLCBcIm9sZExheW91dERldGFpbFwiOiBvbGRMYXlvdXREZXRhaWwsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCI6b25seUFkanVzdE5vZGVQb3NpdGlvbn1cclxuICAgIClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciBub2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytub2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgaWYodGhlTm9kZS5sZW5ndGg9PTApIHJldHVybjtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uc2hpcElEKXtcclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEN1cnJlbnRMYXlvdXREZXRhaWwgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD17XCJlZGdlc1wiOnt9fVxyXG4gICAgaWYodGhpcy5jb3JlLm5vZGVzKCkuc2l6ZSgpPT0wKSByZXR1cm4gbGF5b3V0RGljdDtcclxuICAgIC8vc3RvcmUgbm9kZXMgcG9zaXRpb25cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBsYXlvdXREaWN0W29uZU5vZGUuaWQoKV09W3RoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd4J10pLHRoaXMubnVtYmVyUHJlY2lzaW9uKHBvc2l0aW9uWyd5J10pXVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3N0b3JlIGFueSBlZGdlIGJlbmRpbmcgcG9pbnRzIG9yIGNvbnRyb2xpbmcgcG9pbnRzXHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgaWYoIWN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiAhY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmKGxheW91dERpY3QuZWRnZXNbc3JjSURdPT1udWxsKWxheW91dERpY3QuZWRnZXNbc3JjSURdPXt9XHJcbiAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdPXt9XHJcbiAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzICYmIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cy5sZW5ndGg+MCkge1xyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1bXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGxheW91dERpY3Q7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zYXZlTGF5b3V0ID0gYXN5bmMgZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKCFnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdKXtcclxuICAgICAgICB2YXIgbGF5b3V0RGljdD17fVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnJlY29yZFNpbmdsZUxheW91dChsYXlvdXREaWN0LGdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkLGxheW91dE5hbWUsZmFsc2UpXHJcbiAgICB9ZWxzZSBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV0uZGV0YWlsXHJcbiAgICBcclxuICAgIGlmKGxheW91dERpY3RbXCJlZGdlc1wiXT09bnVsbCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdPXt9XHJcbiAgICBcclxuICAgIHZhciBzaG93aW5nTGF5b3V0PXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICB2YXIgc2hvd2luZ0VkZ2VzTGF5b3V0PSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGRlbGV0ZSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdMYXlvdXQpIGxheW91dERpY3RbaW5kXT1zaG93aW5nTGF5b3V0W2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdFZGdlc0xheW91dCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdW2luZF09c2hvd2luZ0VkZ2VzTGF5b3V0W2luZF1cclxuXHJcbiAgICB2YXIgc2F2ZUxheW91dE9iaj17XCJsYXlvdXRzXCI6e319XHJcbiAgICBzYXZlTGF5b3V0T2JqW1wibGF5b3V0c1wiXVtsYXlvdXROYW1lXT1KU09OLnN0cmluZ2lmeShsYXlvdXREaWN0KSAgXHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2F2ZUxheW91dFwiLCBcIlBPU1RcIiwgc2F2ZUxheW91dE9iaixcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiLFwibGF5b3V0TmFtZVwiOmxheW91dE5hbWV9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubnVtYmVyUHJlY2lzaW9uID0gZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShudW1iZXIpKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPG51bWJlci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbnVtYmVyW2ldID0gdGhpcy5udW1iZXJQcmVjaXNpb24obnVtYmVyW2ldKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9ZWxzZVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQobnVtYmVyLnRvRml4ZWQoMykpXHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uIChzZWxlY3RlZE5vZGVzKSB7XHJcbiAgICB2YXIgZWxlcz10aGlzLmNvcmUubm9kZXMoKS5lZGdlc1RvKHNlbGVjdGVkTm9kZXMpLnNvdXJjZXMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0T3V0Ym91bmROb2RlcyA9IGZ1bmN0aW9uIChzZWxlY3RlZE5vZGVzKSB7XHJcbiAgICB2YXIgZWxlcz1zZWxlY3RlZE5vZGVzLmVkZ2VzVG8odGhpcy5jb3JlLm5vZGVzKCkpLnRhcmdldHMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAodGFyZ2V0Tm9kZSxzcmNOb2RlQXJyKSB7XHJcbiAgICB2YXIgdGhlQ29ubmVjdE1vZGU9dGhpcy50YXJnZXROb2RlTW9kZVxyXG4gICAgdmFyIHByZXBhcmF0aW9uSW5mbz1bXVxyXG5cclxuICAgIHNyY05vZGVBcnIuZm9yRWFjaCh0aGVOb2RlPT57XHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlc1xyXG4gICAgICAgIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RUb1wiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7ZnJvbTp0aGVOb2RlLHRvOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1lbHNlIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RGcm9tXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHt0bzp0aGVOb2RlLGZyb206dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vVE9ETzogY2hlY2sgaWYgaXQgaXMgbmVlZGVkIHRvIHBvcHVwIGRpYWxvZywgaWYgYWxsIGNvbm5lY3Rpb24gaXMgZG9hYmxlIGFuZCBvbmx5IG9uZSB0eXBlIHRvIHVzZSwgbm8gbmVlZCB0byBzaG93IGRpYWxvZ1xyXG4gICAgdGhpcy5zaG93Q29ubmVjdGlvbkRpYWxvZyhwcmVwYXJhdGlvbkluZm8pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93Q29ubmVjdGlvbkRpYWxvZyA9IGZ1bmN0aW9uIChwcmVwYXJhdGlvbkluZm8pIHtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIHJlc3VsdEFjdGlvbnM9W11cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQ1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBjb25uZWN0aW9uc1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJcIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9ucyhyZXN1bHRBY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuZW1wdHkoKVxyXG4gICAgcHJlcGFyYXRpb25JbmZvLmZvckVhY2goKG9uZVJvdyxpbmRleCk9PntcclxuICAgICAgICByZXN1bHRBY3Rpb25zLnB1c2godGhpcy5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93KG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93ID0gZnVuY3Rpb24gKG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSB7XHJcbiAgICB2YXIgcmV0dXJuT2JqPXt9XHJcbiAgICB2YXIgZnJvbU5vZGU9b25lUm93LmZyb21cclxuICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICB2YXIgY29ubmVjdGlvblR5cGVzPW9uZVJvdy5jb25uZWN0XHJcbiAgICB2YXIgbGFiZWw9JCgnPGxhYmVsIHN0eWxlPVwiZGlzcGxheTpibG9jazttYXJnaW4tYm90dG9tOjJweFwiPjwvbGFiZWw+JylcclxuICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJyZWRcIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiTm8gdXNhYmxlIGNvbm5lY3Rpb24gdHlwZSBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hUeXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIpXHJcbiAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIGNvbm5lY3Rpb25UeXBlcy5mb3JFYWNoKG9uZVR5cGU9PntcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmFkZE9wdGlvbihvbmVUeXBlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuZGF0YSgpLm9yaWdpbmFsSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgfVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgcmV0dXJuIHJldHVybk9iajtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gYXN5bmMgZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIC8vIGZvciBlYWNoIHJlc3VsdEFjdGlvbnMsIGNhbGN1bGF0ZSB0aGUgYXBwZW5kaXggaW5kZXgsIHRvIGF2b2lkIHNhbWUgSUQgaXMgdXNlZCBmb3IgZXhpc3RlZCBjb25uZWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNldEtleURvd25GdW5jPWZ1bmN0aW9uKGluY2x1ZGVDYW5jZWxDb25uZWN0T3BlcmF0aW9uKXtcclxuICAgICQoZG9jdW1lbnQpLm9uKFwia2V5ZG93blwiLCAgKGUpPT57XHJcbiAgICAgICAgaWYgKGUuY3RybEtleSAmJiBlLnRhcmdldC5ub2RlTmFtZSA9PT0gJ0JPRFknKXtcclxuICAgICAgICAgICAgaWYgKGUud2hpY2ggPT09IDkwKSAgIHRoaXMudXIudW5kbygpO1xyXG4gICAgICAgICAgICBlbHNlIGlmIChlLndoaWNoID09PSA4OSkgICAgdGhpcy51ci5yZWRvKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYoZS53aGljaD09PTgzKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJwb3B1cExheW91dEVkaXRpbmdcIn0pXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihpbmNsdWRlQ2FuY2VsQ29ubmVjdE9wZXJhdGlvbil7XHJcbiAgICAgICAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcpIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKSAgICBcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSxzZWxlY3RlZE5vZGVzKSB7XHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW1vZGU7XHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKFwiaW5jbHVkZUNhbmNlbENvbm5lY3RPcGVyYXRpb25cIilcclxuXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vbignY2xpY2snLCAoZSk9PntcclxuICAgICAgICB2YXIgY2xpY2tlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICB0aGlzLmFkZENvbm5lY3Rpb25zKGNsaWNrZWROb2RlLHNlbGVjdGVkTm9kZXMpXHJcbiAgICAgICAgLy9kZWxheSBhIHNob3J0IHdoaWxlIHNvIG5vZGUgc2VsZWN0aW9uIHdpbGwgbm90IGJlIGNoYW5nZWQgdG8gdGhlIGNsaWNrZWQgdGFyZ2V0IG5vZGVcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpfSw1MClcclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNhbmNlbFRhcmdldE5vZGVNb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW51bGw7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xyXG4gICAgJChkb2N1bWVudCkub2ZmKCdrZXlkb3duJyk7XHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKClcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9mZihcImNsaWNrXCIpXHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCBmYWxzZSApO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fZ3JpZD1mdW5jdGlvbihlbGVzKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSBlbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29zZT1mdW5jdGlvbihlbGVzLHVuZG9MYXlvdXREZXRhaWwpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG5cclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29zZScsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlXHJcbiAgICAgICAgLGZpdDpmYWxzZVxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuICAgIGlmKHVuZG9MYXlvdXREZXRhaWwpe1xyXG4gICAgICAgIHZhciBuZXdMYXlvdXREZXRhaWw9dGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKClcclxuICAgICAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0RGV0YWlsLCB1bmRvTGF5b3V0RGV0YWlsKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2NvbmNlbnRyaWM9ZnVuY3Rpb24oZWxlcyxib3gpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb25jZW50cmljJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgbWluTm9kZVNwYWNpbmc6NjAsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGJvdW5kaW5nQm94OmJveFxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBuZXdUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9uZXdUd2luRGlhbG9nXCIpO1xyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImRhcmtHcmF5XCJcclxuICAgICAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgICAgICB2YXIgYXZhcnRhPW51bGxcclxuICAgICAgICB2YXIgZGltZW5zaW9uPTIwO1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFttb2RlbENsYXNzXSl7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgdmFyIGNvbG9yQ29kZT0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNlY29uZENvbG9yQ29kZSA9IHZpc3VhbEpzb24uc2Vjb25kQ29sb3JcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmU7cGFkZGluZy10b3A6MnB4Jz48L2Rpdj5cIilcclxuICAgICAgICBpZihkYk1vZGVsSW5mbyAmJiBkYk1vZGVsSW5mby5pc0lvVERldmljZU1vZGVsKXtcclxuICAgICAgICAgICAgdmFyIGlvdERpdj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6LTVweDtwYWRkaW5nOjBweCAycHg7dG9wOi03cHg7Ym9yZGVyLXJhZGl1czogM3B4O2ZvbnQtc2l6ZTo3cHgnPklvVDwvZGl2PlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChpb3REaXYpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaW1nU3JjPWVuY29kZVVSSUNvbXBvbmVudChnbG9iYWxDYWNoZS5zaGFwZVN2ZyhzaGFwZSxjb2xvckNvZGUsc2Vjb25kQ29sb3JDb2RlKSlcclxuICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgIGlmKGF2YXJ0YSl7XHJcbiAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyA9IChnbikgPT4ge1xyXG4gICAgICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtoZWlnaHQ6MjdweDsgcmlnaHQ6MTBweDt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtNTAlKVwiPis8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgICAgIG5ld1R3aW5EaWFsb2cucG9wdXAoe1xyXG4gICAgICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJG1vZGVsXCI6IGduLmluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gYWRkQnV0dG9uO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzppbmZvQXJyLCBcIm1vdXNlQ2xpY2tEZXRhaWxcIjptb3VzZUNsaWNrRGV0YWlsfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGU9KHRoZU5vZGUpPT57XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiUGFuVG9Ob2RlXCIsIGluZm86dGhlTm9kZS5sZWFmSW5mb30pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3g9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgIHBsYWNlaG9sZGVyPVwic2VhcmNoLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXRcIik7XHJcbiAgICB0aGlzLnNlYXJjaEJveC5jc3Moe1wib3V0bGluZVwiOlwibm9uZVwiLFwiaGVpZ2h0XCI6XCIxMDAlXCIsXCJ3aWR0aFwiOlwiMTAwJVwifSkgXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKHRoaXMuc2VhcmNoQm94KVxyXG4gICAgdmFyIGhpZGVPclNob3dFbXB0eUdyb3VwPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MjBweDtib3JkZXI6bm9uZTtwYWRkaW5nLWxlZnQ6MnB4XCIgY2xhc3M9XCJ3My1yaXBwbGUgdzMtYmxvY2sgdzMtdGlueSB3My1ob3Zlci1yZWQgdzMtYW1iZXJcIj5IaWRlIEVtcHR5IE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKGhpZGVPclNob3dFbXB0eUdyb3VwKVxyXG4gICAgRE9NLmNzcyhcInRvcFwiLFwiNTBweFwiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiKT09XCJzaG93XCIpe1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJoaWRlXCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJTaG93IEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cD10cnVlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIkhpZGUgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKCl9KVxyXG4gICAgfSlcclxuICAgIHRoaXMuc2VhcmNoQm94LmtleXVwKChlKT0+e1xyXG4gICAgICAgIGlmKGUua2V5Q29kZSA9PSAxMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhTm9kZSA9IHRoaXMudHJlZS5zZWFyY2hUZXh0KCQoZS50YXJnZXQpLnZhbCgpKVxyXG4gICAgICAgICAgICBpZihhTm9kZSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBhTm9kZS5wYXJlbnRHcm91cE5vZGUuZXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZWxlY3RMZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zY3JvbGxUb0xlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJyZXBsYWNlXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9hcHBlbmRcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJhcHBlbmRcIilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbHNDaGFuZ2VcIikgdGhpcy5yZWZyZXNoTW9kZWxzKClcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikgbXNnUGF5bG9hZC50d2luc0luZm8uZm9yRWFjaChvbmVUd2luSW5mbz0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbkluZm8pfSlcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmhpZGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpIHRoaXMuaGlkZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZighbXNnUGF5bG9hZC5zcmNNb2RlbElEKXsgLy8gY2hhbmdlIG1vZGVsIGNsYXNzIHZpc3VhbGl6YXRpb25cclxuICAgICAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e2duLnJlZnJlc2hOYW1lKCl9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuaGlkZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZSh0d2luRGlzcGxheU5hbWUpXHJcbiAgICB9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlZnJlc2hNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBtb2RlbHNEYXRhPXt9XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIgb25lTW9kZWw9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgbW9kZWxzRGF0YVtvbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZU1vZGVsXHJcbiAgICB9XHJcbiAgICAvL2RlbGV0ZSBhbGwgZ3JvdXAgbm9kZXMgb2YgZGVsZXRlZCBtb2RlbHNcclxuICAgIHZhciBhcnI9W10uY29uY2F0KHRoaXMudHJlZS5ncm91cE5vZGVzKVxyXG4gICAgYXJyLmZvckVhY2goKGdub2RlKT0+e1xyXG4gICAgICAgIGlmKG1vZGVsc0RhdGFbZ25vZGUubmFtZV09PW51bGwpe1xyXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGlzIGdyb3VwIG5vZGVcclxuICAgICAgICAgICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3RoZW4gYWRkIGFsbCBncm91cCBub2RlcyB0aGF0IHRvIGJlIGFkZGVkXHJcbiAgICB2YXIgY3VycmVudE1vZGVsTmFtZUFycj1bXVxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57Y3VycmVudE1vZGVsTmFtZUFyci5wdXNoKGdub2RlLm5hbWUpfSlcclxuXHJcbiAgICB2YXIgYWN0dWFsTW9kZWxOYW1lQXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbHNEYXRhKSBhY3R1YWxNb2RlbE5hbWVBcnIucHVzaChpbmQpXHJcbiAgICBhY3R1YWxNb2RlbE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuXHJcbiAgICBmb3IodmFyIGk9MDtpPGFjdHVhbE1vZGVsTmFtZUFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICBpZihpPGN1cnJlbnRNb2RlbE5hbWVBcnIubGVuZ3RoICYmIGN1cnJlbnRNb2RlbE5hbWVBcnJbaV09PWFjdHVhbE1vZGVsTmFtZUFycltpXSkgY29udGludWVcclxuICAgICAgICAvL290aGVyd2lzZSBhZGQgdGhpcyBncm91cCB0byB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBuZXdHcm91cD10aGlzLnRyZWUuaW5zZXJ0R3JvdXBOb2RlKG1vZGVsc0RhdGFbYWN0dWFsTW9kZWxOYW1lQXJyW2ldXSxpKVxyXG4gICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgY3VycmVudE1vZGVsTmFtZUFyci5zcGxpY2UoaSwgMCwgYWN0dWFsTW9kZWxOYW1lQXJyW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUubG9hZFN0YXJ0U2VsZWN0aW9uPWFzeW5jIGZ1bmN0aW9uKHR3aW5JRHMsbW9kZWxJRHMscmVwbGFjZU9yQXBwZW5kKXtcclxuICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMudHJlZS5jbGVhckFsbExlYWZOb2RlcygpXHJcblxyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2hNb2RlbHMoKVxyXG4gICAgXHJcbiAgICAvL2FkZCBuZXcgdHdpbnMgdW5kZXIgdGhlIG1vZGVsIGdyb3VwIG5vZGVcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIC8vY2hlY2sgaWYgYW55IGN1cnJlbnQgbGVhZiBub2RlIGRvZXMgbm90IGhhdmUgc3RvcmVkIG91dGJvdW5kIHJlbGF0aW9uc2hpcCBkYXRhIHlldFxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gobGVhZk5vZGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVJZCA9IGxlYWZOb2RlLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXSA9PSBudWxsKSB0d2luSURBcnIucHVzaChub2RlSWQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVBRFRUd2lucyh0d2luc2RhdGEpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0d2luc2RhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGdyb3VwTmFtZSA9IGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbdHdpbnNkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSwgdHdpbnNkYXRhW2ldLCBcInNraXBSZXBlYXRcIilcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2godHdpbnNkYXRhW2ldW1wiJGR0SWRcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlcGxhY2VBbGxUd2luc1wiLCBpbmZvOiB0d2luc2RhdGEgfSlcclxuICAgICAgICBlbHNlIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB0aGlzLmZldGNoQWxsUmVsYXRpb25zaGlwcyh0d2luSURBcnIpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPSBmdW5jdGlvbihkYXRhKXtcclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRtcEFyci5mb3JFYWNoKG9uZVR3aW49Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3T25lVHdpbj0gZnVuY3Rpb24odHdpbkluZm8pe1xyXG4gICAgdmFyIGdyb3VwTmFtZT1nbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZ2V0UmVsYXRpb25zaGlwc0Zyb21Ud2luSURzXCIsIFwiUE9TVFwiLCBzbWFsbEFycilcclxuICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgY29udGludWU7XHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLCBpbmZvOiBkYXRhIH0pXHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHR3aW5zVHJlZTsiLCJjb25zdCBzaWdudXBzaWduaW5uYW1lPVwiQjJDXzFfc2luZ3Vwc2lnbmluX3NwYWFwcDFcIlxyXG5jb25zdCBiMmNUZW5hbnROYW1lPVwiYXp1cmVpb3RiMmNcIlxyXG5cclxuY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcblxyXG52YXIgc3RyQXJyPXdpbmRvdy5sb2NhdGlvbi5ocmVmLnNwbGl0KFwiP1wiKVxyXG52YXIgaXNMb2NhbFRlc3Q9KHN0ckFyci5pbmRleE9mKFwidGVzdD0xXCIpIT0tMSlcclxuXHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXtcclxuICAgIFwiYjJjU2lnblVwU2lnbkluTmFtZVwiOiBzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgXCJiMmNTY29wZV90YXNrbWFzdGVyXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL3Rhc2ttYXN0ZXJtb2R1bGUvb3BlcmF0aW9uXCIsXHJcbiAgICBcImIyY1Njb3BlX2Z1bmN0aW9uc1wiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9henVyZWlvdHJvY2tzZnVuY3Rpb25zL2Jhc2ljXCIsXHJcbiAgICBcImxvZ291dFJlZGlyZWN0VXJpXCI6IHVybC5vcmlnaW4rXCIvc3BhaW5kZXguaHRtbFwiLFxyXG4gICAgXCJtc2FsQ29uZmlnXCI6e1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL1wiK3NpZ251cHNpZ25pbm5hbWUsXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFtiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbVwiXSxcclxuICAgICAgICAgICAgcmVkaXJlY3RVcmk6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsIFxyXG4gICAgICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3lzdGVtOiB7XHJcbiAgICAgICAgICAgIGxvZ2dlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlckNhbGxiYWNrOiAobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKSA9PiB7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaXNMb2NhbFRlc3RcIjppc0xvY2FsVGVzdCxcclxuICAgIFwidGFza01hc3RlckFQSVVSSVwiOigoaXNMb2NhbFRlc3QpP1wiaHR0cDovL2xvY2FsaG9zdDo1MDAyL1wiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzdGFza21hc3Rlcm1vZHVsZS5henVyZXdlYnNpdGVzLm5ldC9cIiksXHJcbiAgICBcImZ1bmN0aW9uc0FQSVVSSVwiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzZnVuY3Rpb25zLmF6dXJld2Vic2l0ZXMubmV0L2FwaS9cIlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbEFwcFNldHRpbmdzOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKCl7XHJcbiAgICBjb25zdCBjdXJyZW50QWNjb3VudHMgPSB0aGlzLm15TVNBTE9iai5nZXRBbGxBY2NvdW50cygpO1xyXG4gICAgaWYgKGN1cnJlbnRBY2NvdW50cy5sZW5ndGggPCAxKSByZXR1cm47XHJcbiAgICB2YXIgZm91bmRBY2NvdW50PW51bGw7XHJcbiAgICBmb3IodmFyIGk9MDtpPGN1cnJlbnRBY2NvdW50cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5BY2NvdW50PSBjdXJyZW50QWNjb3VudHNbaV1cclxuICAgICAgICBpZihhbkFjY291bnQuaG9tZUFjY291bnRJZC50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLmIyY1NpZ25VcFNpZ25Jbk5hbWUudG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuaXNzLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmtub3duQXV0aG9yaXRpZXNbMF0udG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuYXVkID09PSBnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGguY2xpZW50SWRcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBmb3VuZEFjY291bnQ9IGFuQWNjb3VudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnNldEFjY291bnQoZm91bmRBY2NvdW50KVxyXG4gICAgcmV0dXJuIGZvdW5kQWNjb3VudDtcclxufVxyXG5cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2U9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfZnVuY3Rpb25zKVxyXG4gICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy5mdW5jdGlvbnNBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUucGFyc2VKV1Q9ZnVuY3Rpb24odG9rZW4pe1xyXG4gICAgdmFyIGJhc2U2NFVybCA9IHRva2VuLnNwbGl0KCcuJylbMV07XHJcbiAgICB2YXIgYmFzZTY0ID0gYmFzZTY0VXJsLnJlcGxhY2UoLy0vZywgJysnKS5yZXBsYWNlKC9fL2csICcvJyk7XHJcbiAgICBiYXNlNjQ9IEJ1ZmZlci5mcm9tKGJhc2U2NCwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCk7XHJcbiAgICB2YXIganNvblBheWxvYWQgPSBkZWNvZGVVUklDb21wb25lbnQoYmFzZTY0LnNwbGl0KCcnKS5tYXAoZnVuY3Rpb24oYykge1xyXG4gICAgICAgIHJldHVybiAnJScgKyAoJzAwJyArIGMuY2hhckNvZGVBdCgwKS50b1N0cmluZygxNikpLnNsaWNlKC0yKTtcclxuICAgIH0pLmpvaW4oJycpKTtcclxuXHJcbiAgICByZXR1cm4gSlNPTi5wYXJzZShqc29uUGF5bG9hZCk7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnJlbG9hZFVzZXJBY2NvdW50RGF0YT1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXM9YXdhaXQgdGhpcy5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvZmV0Y2hVc2VyRGF0YVwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVyblxyXG5cclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlVXNlckRhdGEocmVzKVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQsd2l0aFByb2plY3RJRCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYod2l0aFByb2plY3RJRCl7XHJcbiAgICAgICAgcGF5bG9hZD1wYXlsb2FkfHx7fVxyXG4gICAgICAgIHBheWxvYWRbXCJwcm9qZWN0SURcIl09Z2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRFxyXG4gICAgfSBcclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG5cclxuICAgICAgICAvL2luIGNhc2Ugam9pbmVkIHByb2plY3RzIEpXVCBpcyBnb2luZyB0byBleHBpcmUsIHJlbmV3IGFub3RoZXIgb25lXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuam9pbmVkUHJvamVjdHNUb2tlbikge1xyXG4gICAgICAgICAgICB2YXIgZXhwVFM9dGhpcy5wYXJzZUpXVChnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKS5leHBcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGV4cFRTLWN1cnJUaW1lPDYwKXsgLy9mZXRjaCBhIG5ldyBwcm9qZWN0cyBKV1QgdG9rZW4gXHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbG9hZFVzZXJBY2NvdW50RGF0YSgpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vaWYgdGhlIEFQSSBuZWVkIHRvIHVzZSBwcm9qZWN0IElELCBtdXN0IGFkZCBhIGhlYWRlciBcInByb2plY3RzXCIgand0IHRva2VuIHNvIHNlcnZlciBzaWRlIHdpbGwgdmVyaWZ5XHJcbiAgICAgICAgaWYocGF5bG9hZCAmJiBwYXlsb2FkLnByb2plY3RJRCAmJiBnbG9iYWxDYWNoZS5qb2luZWRQcm9qZWN0c1Rva2VuKXtcclxuICAgICAgICAgICAgaGVhZGVyc09ialtcInByb2plY3RzXCJdPWdsb2JhbENhY2hlLmpvaW5lZFByb2plY3RzVG9rZW5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLnRhc2tNYXN0ZXJBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZ2V0VG9rZW49YXN5bmMgZnVuY3Rpb24oYjJjU2NvcGUpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW49PW51bGwpIHRoaXMuc3RvcmVkVG9rZW49e31cclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBjdXJyVGltZT1wYXJzZUludChuZXcgRGF0ZSgpLmdldFRpbWUoKS8xMDAwKVxyXG4gICAgICAgICAgICBpZihjdXJyVGltZSs2MCA8IHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmV4cGlyZSkgcmV0dXJuIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdLmFjY2Vzc1Rva2VuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0b2tlblJlcXVlc3Q9e1xyXG4gICAgICAgICAgICBzY29wZXM6IFtiMmNTY29wZV0sXHJcbiAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2UsIC8vIFNldCB0aGlzIHRvIFwidHJ1ZVwiIHRvIHNraXAgYSBjYWNoZWQgdG9rZW4gYW5kIGdvIHRvIHRoZSBzZXJ2ZXIgdG8gZ2V0IGEgbmV3IHRva2VuXHJcbiAgICAgICAgICAgIGFjY291bnQ6IHRoaXMubXlNU0FMT2JqLmdldEFjY291bnRCeUhvbWVJZCh0aGlzLmFjY291bnRJZClcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICBjb25zb2xlLmxvZyhcInRyeSB0byBzaWxlbnRseSBnZXQgdG9rZW5cIilcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiZ2V0IHRva2VuIHN1Y2Nlc3NmdWxseVwiKVxyXG4gICAgICAgIGlmICghcmVzcG9uc2UuYWNjZXNzVG9rZW4gfHwgcmVzcG9uc2UuYWNjZXNzVG9rZW4gPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXT17XCJhY2Nlc3NUb2tlblwiOnJlc3BvbnNlLmFjY2Vzc1Rva2VuLFwiZXhwaXJlXCI6cmVzcG9uc2UuaWRUb2tlbkNsYWltcy5leHB9XHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbXNhbEhlbHBlcigpOyIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmNsYXNzIGJhc2VJbmZvUGFuZWwge1xyXG4gICAgZHJhd0VkaXRhYmxlKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyLGZ1bmNHZXRLZXlMYmxDb2xvckNsYXNzKXtcclxuICAgICAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtOyBtYXJnaW4tcmlnaHQ6NXB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuICAgIFxyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdwYWRkaW5nLXRvcDouMmVtJz48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICAgICAgdmFyIGtleUxhYmVsQ29sb3JDbGFzcz1cInczLWRhcmstZ3JheVwiXHJcbiAgICAgICAgICAgIGlmKGZ1bmNHZXRLZXlMYmxDb2xvckNsYXNzKSBrZXlMYWJlbENvbG9yQ2xhc3M9ZnVuY0dldEtleUxibENvbG9yQ2xhc3MobmV3UGF0aClcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3Moa2V5TGFiZWxDb2xvckNsYXNzKVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVhZE9ubHkpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmFsID0gZ2xvYmFsQ2FjaGUuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sIG5ld1BhdGgpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHsgXCJjb2xvclwiOiBcImdyYXlcIiwgXCJmb250LXNpemVcIjogXCI5cHhcIiB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJbZW1wdHldXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGNvbnRlbnRET00udGV4dCh2YWwpXHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aCxmdW5jR2V0S2V5TGJsQ29sb3JDbGFzcylcclxuICAgICAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKGtleUxhYmVsQ29sb3JDbGFzcylcclxuICAgICAgICAgICAgICAgIHZhciB2YWwgPSBnbG9iYWxDYWNoZS5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbywgbmV3UGF0aClcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlYWRPbmx5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHsgXCJjb2xvclwiOiBcImdyYXlcIiwgXCJmb250LXNpemVcIjogXCI5cHhcIiB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJbZW1wdHldXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGNvbnRlbnRET00udGV4dCh2YWwpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhSW5wdXQgPSAkKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cInBhZGRpbmc6MnB4O3dpZHRoOjUwJTtvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmVcIiBwbGFjZWhvbGRlcj1cInR5cGU6ICcgKyBqc29uSW5mb1tpbmRdICsgJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbCAhPSBudWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgICAgICAgICBhSW5wdXQuZGF0YShcImRhdGFUeXBlXCIsIGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLCAkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwgJChlLnRhcmdldCkudmFsKCksICQoZS50YXJnZXQpLmRhdGEoXCJkYXRhVHlwZVwiKSlcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0Ryb3Bkb3duT3B0aW9uKGNvbnRlbnRET00sbmV3UGF0aCx2YWx1ZUFycixvcmlnaW5FbGVtZW50SW5mbyl7XHJcbiAgICAgICAgdmFyIGFTZWxlY3RNZW51PW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2J1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggMTZweFwifX0pXHJcbiAgICAgICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgICAgIGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiLCBuZXdQYXRoKVxyXG4gICAgICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICAgICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKHN0cilcclxuICAgICAgICB9KVxyXG4gICAgICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgICAgICBhU2VsZWN0TWVudS5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiKSxvcHRpb25WYWx1ZSxcInN0cmluZ1wiKVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdmFsPWdsb2JhbENhY2hlLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgICAgICB9ICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGdlbmVyYXRlU21hbGxLZXlEaXYoc3RyLHBhZGRpbmdUb3Ape1xyXG4gICAgICAgIHZhciBrZXlEaXYgPSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1ib3JkZXInIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiNmNmY2ZjY7ZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitzdHIrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcbiAgICAgICAgcmV0dXJuIGtleURpdlxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdDb25uZWN0aW9uU3RhdHVzKHN0YXR1cyxwYXJlbnREb20pIHtcclxuICAgICAgICBwYXJlbnREb209cGFyZW50RG9tfHx0aGlzLkRPTVxyXG4gICAgICAgIHZhciBrZXlEaXY9dGhpcy5nZW5lcmF0ZVNtYWxsS2V5RGl2KFwiQ29ubmVjdGlvblwiLFwiLjVlbVwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIHZhciBjb250ZW50RE9NID0gJCgnPHNwYW4gY2xhc3M9XCJmYS1zdGFja1wiIHN0eWxlPVwiZm9udC1zaXplOi41ZW07cGFkZGluZy1sZWZ0OjVweFwiPjwvc3Bhbj4nKVxyXG4gICAgICAgIGlmKHN0YXR1cykge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFkZENsYXNzKFwidzMtdGV4dC1saW1lXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uaHRtbCgnPGkgY2xhc3M9XCJmYXMgZmEtc2lnbmFsIGZhLXN0YWNrLTJ4XCI+PC9pPicpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uYWRkQ2xhc3MoXCJ3My10ZXh0LXJlZFwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmh0bWwoJzxpIGNsYXNzPVwiZmFzIGZhLXNpZ25hbCBmYS1zdGFjay0yeFwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1zbGFzaCBmYS1zdGFjay0yeFwiPjwvaT4nKVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcblxyXG4gICAgZHJhd1N0YXRpY0luZm8ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUsZm9udENvbG9yKXtcclxuICAgICAgICBmb250Q29sb3I9Zm9udENvbG9yfHxcImJsYWNrXCJcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgICAgIHZhciBrZXlEaXY9dGhpcy5nZW5lcmF0ZVNtYWxsS2V5RGl2KGluZCxwYWRkaW5nVG9wKVxyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgIFxyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpmb250Q29sb3J9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZldGNoUmVhbEVsZW1lbnRJbmZvKHNpbmdsZUVsZW1lbnRJbmZvKXsgLy90aGUgaW5wdXQgaXMgcG9zc2libHkgZnJvbSB0b3BvbG9neSB2aWV3IHdoaWNoIG1pZ2h0IG5vdCBiZSBwcmVjaXNlIGFib3V0IHByb3BlcnR5IHZhbHVlXHJcbiAgICAgICAgdmFyIHJldHVybkVsZW1lbnRJbmZvPXt9XHJcbiAgICAgICAgaWYgKHNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl0pIHtcclxuICAgICAgICAgICAgcmV0dXJuRWxlbWVudEluZm89Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXV0gLy9ub3RlIHRoYXQgZHluYW1pY2FsIHByb3BlcnR5IHZhbHVlIGlzIG5vdCBzdG9yZWQgaW4gdG9wb2xvZ3kgbm9kZSwgc28gYWx3YXlzIGdldCByZWZyZXNoIGRhdGEgZnJvbSBnbG9iYWxjYWNoZVxyXG4gICAgICAgIH1lbHNlIGlmIChzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSkge1xyXG4gICAgICAgICAgICB2YXIgYXJyPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXV1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1zaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuRWxlbWVudEluZm89YXJyW2ldXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJldHVybkVsZW1lbnRJbmZvXHJcbiAgICB9XHJcblxyXG4gICAgZHJhd1NpbmdsZVJlbGF0aW9uUHJvcGVydGllcyhzaW5nbGVSZWxhdGlvbkluZm8scGFyZW50RG9tKSB7XHJcbiAgICAgICAgcGFyZW50RG9tPXBhcmVudERvbXx8dGhpcy5ET01cclxuICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHBhcmVudERvbSwge1xyXG4gICAgICAgICAgICBcInNvdXJjZUlcIjpnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NpbmdsZVJlbGF0aW9uSW5mb1tcIiRzb3VyY2VJZFwiXV0sXHJcbiAgICAgICAgICAgIFwidGFyZ2V0XCI6IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc2luZ2xlUmVsYXRpb25JbmZvW1wiJHRhcmdldElkXCJdXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBzaW5nbGVSZWxhdGlvbkluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgIH0sIFwiMWVtXCIsIFwiMTNweFwiKVxyXG4gICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8ocGFyZW50RG9tLCB7XHJcbiAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6IHNpbmdsZVJlbGF0aW9uSW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIH0sIFwiMWVtXCIsIFwiMTBweFwiKVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lID0gc2luZ2xlUmVsYXRpb25JbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICB2YXIgc291cmNlTW9kZWwgPSBzaW5nbGVSZWxhdGlvbkluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG5cclxuICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShwYXJlbnREb20sIHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsIHNvdXJjZU1vZGVsKSwgc2luZ2xlUmVsYXRpb25JbmZvLCBbXSlcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gc2luZ2xlUmVsYXRpb25JbmZvW1wiJG1ldGFkYXRhXCJdKSB7XHJcbiAgICAgICAgICAgIHZhciB0bXBPYmogPSB7fVxyXG4gICAgICAgICAgICB0bXBPYmpbaW5kXSA9IHNpbmdsZVJlbGF0aW9uSW5mb1tcIiRtZXRhZGF0YVwiXVtpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8ocGFyZW50RG9tLCB0bXBPYmosIFwiMWVtXCIsIFwiMTBweFwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8ocGFyZW50RG9tLHtcIiRldGFnXCI6c2luZ2xlUmVsYXRpb25JbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgfVxyXG5cclxuICAgIGdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLCBzb3VyY2VNb2RlbCkge1xyXG4gICAgICAgIGlmICghbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXSB8fCAhbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pIHJldHVyblxyXG4gICAgICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxuICAgIH1cclxuXHJcbiAgICBkcmF3U2luZ2xlTm9kZVByb3BlcnRpZXMoc2luZ2xlREJUd2luSW5mbyxzaW5nbGVBRFRUd2luSW5mbyxwYXJlbnREb20sbm90RW1iZWRNZXRhZGF0YSkge1xyXG4gICAgICAgIC8vaW5zdGVhZCBvZiBkcmF3IHRoZSAkZHRJZCwgZHJhdyBkaXNwbGF5IG5hbWUgaW5zdGVhZFxyXG4gICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgcGFyZW50RG9tPXBhcmVudERvbXx8dGhpcy5ET01cclxuICAgICAgICBjb25zdCBjb25zdERlc2lyZWRDb2xvcj1cInczLWFtYmVyXCJcclxuICAgICAgICBjb25zdCBjb25zdFJlcG9ydENvbG9yPVwidzMtYmx1ZVwiXHJcbiAgICAgICAgY29uc3QgY29uc3RUZWxlbWV0cnlDb2xvcj1cInczLWxpbWVcIlxyXG4gICAgICAgIGNvbnN0IGNvbnN0Q29tbW9uQ29sb3I9XCJ3My1kYXJrLWdyYXlcIlxyXG5cclxuICAgICAgICB2YXIgbW9kZWxJRCA9IHNpbmdsZURCVHdpbkluZm8ubW9kZWxJRFxyXG4gICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8ocGFyZW50RG9tLCB7IFwibmFtZVwiOiBzaW5nbGVEQlR3aW5JbmZvW1wiZGlzcGxheU5hbWVcIl0gfSwgXCIuNWVtXCIsIFwiMTNweFwiKVxyXG4gICAgICAgIHZhciB0aGVEQk1vZGVsID0gZ2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJNb2RlbEJ5SUQobW9kZWxJRClcclxuICAgICAgICBpZiAodGhlREJNb2RlbC5pc0lvVERldmljZU1vZGVsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Nvbm5lY3Rpb25TdGF0dXMoc2luZ2xlREJUd2luSW5mb1tcImNvbm5lY3RTdGF0ZVwiXSxwYXJlbnREb20pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8ocGFyZW50RG9tLCB7IFwiQ29ubmVjdGlvbiBTdGF0ZSBUaW1lXCI6IHNpbmdsZURCVHdpbkluZm9bXCJjb25uZWN0U3RhdGVVcGRhdGVUaW1lXCJdIH0sIFwiLjVlbVwiLCBcIjEwcHhcIilcclxuICAgICAgICAgICAgcGFyZW50RG9tLmFwcGVuZCgkKCc8dGFibGUgc3R5bGU9XCJmb250LXNpemU6c21hbGxlcjttYXJnaW46M3B4IDBweFwiPjx0cj48dGQgY2xhc3M9XCInK2NvbnN0VGVsZW1ldHJ5Q29sb3IrJ1wiPiZuYnNwOyZuYnNwOzwvdGQ+PHRkPnRlbGVtZXRyeTwvdGQ+PHRkIGNsYXNzPVwiJytjb25zdFJlcG9ydENvbG9yKydcIj4mbmJzcDsmbmJzcDs8L3RkPjx0ZD5yZXBvcnQ8L3RkPjx0ZCBjbGFzcz1cIicrY29uc3REZXNpcmVkQ29sb3IrJ1wiPiZuYnNwOyZuYnNwOzwvdGQ+PHRkPmRlc2lyZWQ8L3RkPjx0ZCBjbGFzcz1cIicrY29uc3RDb21tb25Db2xvcisnXCI+Jm5ic3A7Jm5ic3A7PC90ZD48dGQ+Y29tbW9uPC90ZD48L3RyPjwvdGFibGU+JykpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGVEQk1vZGVsLmlzSW9URGV2aWNlTW9kZWwpIHtcclxuICAgICAgICAgICAgICAgIHZhciBmdW5jR2V0S2V5TGJsQ29sb3JDbGFzcyA9IChwcm9wZXJ0eVBhdGgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlTWFwcGluZyA9IHt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhlREJNb2RlbC5kZXNpcmVkUHJvcGVydGllcy5mb3JFYWNoKGRlc2lyZWRQID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDb2RlTWFwcGluZ1tKU09OLnN0cmluZ2lmeShkZXNpcmVkUC5wYXRoKV0gPSBjb25zdERlc2lyZWRDb2xvclxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhlREJNb2RlbC5yZXBvcnRQcm9wZXJ0aWVzLmZvckVhY2gocmVwb3J0UCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ29kZU1hcHBpbmdbSlNPTi5zdHJpbmdpZnkocmVwb3J0UC5wYXRoKV0gPSBjb25zdFJlcG9ydENvbG9yXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICB0aGVEQk1vZGVsLnRlbGVtZXRyeVByb3BlcnRpZXMuZm9yRWFjaCh0ZWxlbWV0cnlQID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDb2RlTWFwcGluZ1tKU09OLnN0cmluZ2lmeSh0ZWxlbWV0cnlQLnBhdGgpXSA9IGNvbnN0VGVsZW1ldHJ5Q29sb3JcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXRoU3RyID0gSlNPTi5zdHJpbmdpZnkocHJvcGVydHlQYXRoKVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb2xvckNvZGVNYXBwaW5nW3BhdGhTdHJdKSByZXR1cm4gY29sb3JDb2RlTWFwcGluZ1twYXRoU3RyXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgcmV0dXJuIGNvbnN0Q29tbW9uQ29sb3JcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShwYXJlbnREb20sIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXMsIHNpbmdsZUFEVFR3aW5JbmZvLCBbXSwgZnVuY0dldEtleUxibENvbG9yQ2xhc3MpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgbWV0YWRhdGFDb250ZW50ID0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgZXhwYW5kTWV0YUJ0bj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyIHczLWJ1dHRvbiB3My1saWdodC1ncmF5JyBzdHlsZT0ncGFkZGluZzouMWVtIC41ZW07bWFyZ2luLXJpZ2h0OjFlbTtmb250LXNpemU6MTBweCc+Li4uPC9kaXY+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChtZXRhZGF0YUNvbnRlbnQpXHJcbiAgICAgICAgdmFyIG1ldGFEYXRhRGl2PSQoJzxkaXYvPicpXHJcbiAgICAgICAgbWV0YWRhdGFDb250ZW50LmFwcGVuZChleHBhbmRNZXRhQnRuLG1ldGFEYXRhRGl2KVxyXG4gICAgICAgIG1ldGFEYXRhRGl2LmhpZGUoKVxyXG4gICAgICAgIGV4cGFuZE1ldGFCdG4ub24oXCJjbGlja1wiLCgpPT57ZXhwYW5kTWV0YUJ0bi5oaWRlKCk7bWV0YURhdGFEaXYuc2hvdygpfSlcclxuICAgICAgICBpZihub3RFbWJlZE1ldGFkYXRhKSBleHBhbmRNZXRhQnRuLnRyaWdnZXIoXCJjbGlja1wiKVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhtZXRhRGF0YURpdiwgeyBcIk1vZGVsXCI6IG1vZGVsSUQgfSwgXCIxZW1cIiwgXCIxMHB4XCIpXHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIHNpbmdsZUFEVFR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdKSB7XHJcbiAgICAgICAgICAgIGlmIChpbmQgPT0gXCIkbW9kZWxcIikgY29udGludWU7XHJcbiAgICAgICAgICAgIHZhciB0bXBPYmogPSB7fVxyXG4gICAgICAgICAgICB0bXBPYmpbaW5kXSA9IHNpbmdsZUFEVFR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW2luZF1cclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhtZXRhRGF0YURpdiwgdG1wT2JqLCBcIi41ZW1cIiwgXCIxMHB4XCIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIGVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLCBwYXRoLCBuZXdWYWwsIGRhdGFUeXBlKSB7XHJcbiAgICAgICAgaWYgKFtcImRvdWJsZVwiLCBcImZsb2F0XCIsIFwiaW50ZWdlclwiLCBcImxvbmdcIl0uaW5jbHVkZXMoZGF0YVR5cGUpKSBuZXdWYWwgPSBOdW1iZXIobmV3VmFsKVxyXG4gICAgICAgIGlmKGRhdGFUeXBlPT1cImJvb2xlYW5cIil7XHJcbiAgICAgICAgICAgIGlmKG5ld1ZhbD09XCJ0cnVlXCIpIG5ld1ZhbD10cnVlXHJcbiAgICAgICAgICAgIGVsc2UgbmV3VmFsPWZhbHNlXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL3sgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIveFwiLCBcInZhbHVlXCI6IDMwIH1cclxuICAgICAgICBpZiAocGF0aC5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gXCJcIlxyXG4gICAgICAgICAgICBwYXRoLmZvckVhY2goc2VnbWVudCA9PiB7IHN0ciArPSBcIi9cIiArIHNlZ21lbnQgfSlcclxuICAgICAgICAgICAgdmFyIGpzb25QYXRjaCA9IFt7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWwgfV1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvL2l0IGlzIGEgcHJvcGVydHkgaW5zaWRlIGEgb2JqZWN0IHR5cGUgb2Ygcm9vdCBwcm9wZXJ0eSx1cGRhdGUgdGhlIHdob2xlIHJvb3QgcHJvcGVydHlcclxuICAgICAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eSA9IHBhdGhbMF1cclxuICAgICAgICAgICAgdmFyIHBhdGNoVmFsdWUgPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgICAgIGlmIChwYXRjaFZhbHVlID09IG51bGwpIHBhdGNoVmFsdWUgPSB7fVxyXG4gICAgICAgICAgICBlbHNlIHBhdGNoVmFsdWUgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUocGF0Y2hWYWx1ZSwgcGF0aC5zbGljZSgxKSwgbmV3VmFsKVxyXG5cclxuICAgICAgICAgICAgdmFyIGpzb25QYXRjaCA9IFt7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiICsgcm9vdFByb3BlcnR5LCBcInZhbHVlXCI6IHBhdGNoVmFsdWUgfV1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdKSB7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICAgICAgdmFyIHBheUxvYWQgPSB7IFwianNvblBhdGNoXCI6IEpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksIFwidHdpbklEXCI6IHR3aW5JRCB9XHJcbiAgICAgICAgfSBlbHNlIGlmIChvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSkgeyAvL2VkaXQgYSByZWxhdGlvbnNoaXAgcHJvcGVydHlcclxuICAgICAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgIHZhciBwYXlMb2FkID0geyBcImpzb25QYXRjaFwiOiBKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLCBcInR3aW5JRFwiOiB0d2luSUQsIFwicmVsYXRpb25zaGlwSURcIjogcmVsYXRpb25zaGlwSUQgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NoYW5nZUF0dHJpYnV0ZVwiLCBcIlBPU1RcIiwgcGF5TG9hZClcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbywgcGF0aCwgbmV3VmFsKVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG5vZGVJbmZvLCBwYXRoQXJyLCBuZXdWYWwpIHtcclxuICAgICAgICBpZiAocGF0aEFyci5sZW5ndGggPT0gMCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVKc29uID0gbm9kZUluZm9cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGhBcnIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGtleSA9IHBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgICAgIGlmIChpID09IHBhdGhBcnIubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhlSnNvbltrZXldID0gbmV3VmFsXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGVKc29uW2tleV0gPT0gbnVsbCkgdGhlSnNvbltrZXldID0ge31cclxuICAgICAgICAgICAgdGhlSnNvbiA9IHRoZUpzb25ba2V5XVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gYmFzZUluZm9QYW5lbDsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0UHJvamVjdERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0UHJvamVjdERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAocHJvamVjdEluZm8pIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5wcm9qZWN0SW5mbz1wcm9qZWN0SW5mb1xyXG5cclxuICAgIHRoaXMuRE9NLmNzcyh7XCJ3aWR0aFwiOlwiNDIwcHhcIixcInBhZGRpbmctYm90dG9tXCI6XCIzcHhcIn0pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4O21hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj5Qcm9qZWN0IFNldHRpbmc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgcm93MT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQocm93MSlcclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7XCI+TmFtZSA8L2Rpdj4nKVxyXG4gICAgcm93MS5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lOyB3aWR0aDo3MCU7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiUHJvamVjdCBOYW1lLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgIFxyXG4gICAgcm93MS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgbmFtZUlucHV0LnZhbChwcm9qZWN0SW5mby5uYW1lKVxyXG4gICAgbmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsYXN5bmMgKCk9PntcclxuICAgICAgICB2YXIgbmFtZVN0cj1uYW1lSW5wdXQudmFsKClcclxuICAgICAgICBpZihuYW1lU3RyPT1cIlwiKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiTmFtZSBjYW4gbm90IGJlIGVtcHR5IVwiKVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByZXF1ZXN0Qm9keT17XCJwcm9qZWN0SURcIjpwcm9qZWN0SW5mby5pZCxcImFjY291bnRzXCI6W10sXCJuZXdQcm9qZWN0TmFtZVwiOm5hbWVTdHJ9XHJcbiAgICAgICAgcmVxdWVzdEJvZHkuYWNjb3VudHM9cmVxdWVzdEJvZHkuYWNjb3VudHMuY29uY2F0KHByb2plY3RJbmZvLnNoYXJlV2l0aClcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJhY2NvdW50TWFuYWdlbWVudC9jaGFuZ2VPd25Qcm9qZWN0TmFtZVwiLCBcIlBPU1RcIiwgcmVxdWVzdEJvZHkpXHJcbiAgICAgICAgICAgIG5hbWVJbnB1dC5ibHVyKClcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgIHJldHVyblxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG5cclxuXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7XCI+U2hhcmUgV2l0aCA8L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgc2hhcmVBY2NvdW50SW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjYwJTsgZGlzcGxheTppbmxpbmU7bWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDoycHhcIiAgcGxhY2Vob2xkZXI9XCJJbnZpdGVlIEVtYWlsLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgIFxyXG4gICAgcm93Mi5hcHBlbmQoc2hhcmVBY2NvdW50SW5wdXQpXHJcbiAgICB2YXIgaW52aXRlQnRuPSQoJzxhIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlciB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBocmVmPVwiI1wiPkludml0ZTwvYT4nKSBcclxuICAgIHJvdzIuYXBwZW5kKGludml0ZUJ0bikgXHJcblxyXG4gICAgdmFyIHNoYXJlQWNjb3VudHNMaXN0PSQoXCI8ZGl2IGNsYXNzPSd3My1ib3JkZXIgdzMtcGFkZGluZycgc3R5bGU9J21hcmdpbjoxcHggMXB4OyBoZWlnaHQ6MjAwcHg7b3ZlcmZsb3cteDpoaWRkZW47b3ZlcmZsb3cteTphdXRvJz48ZGl2PlwiKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNoYXJlQWNjb3VudHNMaXN0KVxyXG4gICAgdGhpcy5zaGFyZUFjY291bnRzTGlzdD1zaGFyZUFjY291bnRzTGlzdDtcclxuICAgIHRoaXMuZHJhd1NoYXJlZEFjY291bnRzKClcclxuXHJcbiAgICBzaGFyZUFjY291bnRJbnB1dC5vbihcImtleWRvd25cIiwoZXZlbnQpID0+e1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09IDEzKSB0aGlzLnNoYXJlV2l0aEFjY291bnQoc2hhcmVBY2NvdW50SW5wdXQpXHJcbiAgICB9KTtcclxuICAgIGludml0ZUJ0bi5vbihcImNsaWNrXCIsKCk9PnsgdGhpcy5zaGFyZVdpdGhBY2NvdW50KHNoYXJlQWNjb3VudElucHV0KX0pXHJcbn1cclxuXHJcbmVkaXRQcm9qZWN0RGlhbG9nLnByb3RvdHlwZS5zaGFyZVdpdGhBY2NvdW50PWFzeW5jIGZ1bmN0aW9uKGFjY291bnRJbnB1dCl7XHJcbiAgICB2YXIgc2hhcmVUb0FjY291bnQ9YWNjb3VudElucHV0LnZhbCgpXHJcbiAgICBpZihzaGFyZVRvQWNjb3VudD09XCJcIikgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUluZGV4PSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5pbmRleE9mKHNoYXJlVG9BY2NvdW50KVxyXG4gICAgaWYodGhlSW5kZXghPS0xKSByZXR1cm47XHJcbiAgICB2YXIgcmVxdWVzdEJvZHk9e1wicHJvamVjdElEXCI6dGhpcy5wcm9qZWN0SW5mby5pZCxcInNoYXJlVG9BY2NvdW50XCI6c2hhcmVUb0FjY291bnR9XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L3NoYXJlUHJvamVjdFRvXCIsIFwiUE9TVFwiLCByZXF1ZXN0Qm9keSlcclxuICAgICAgICB0aGlzLmFkZEFjY291bnRUb1NoYXJlV2l0aChzaGFyZVRvQWNjb3VudClcclxuICAgICAgICB0aGlzLmRyYXdTaGFyZWRBY2NvdW50cygpXHJcbiAgICAgICAgYWNjb3VudElucHV0LnZhbChcIlwiKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYgKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxufVxyXG5cclxuZWRpdFByb2plY3REaWFsb2cucHJvdG90eXBlLmFkZEFjY291bnRUb1NoYXJlV2l0aD1mdW5jdGlvbihzaGFyZVRvQWNjb3VudElEKXtcclxuICAgIHZhciB0aGVJbmRleD0gdGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGguaW5kZXhPZihzaGFyZVRvQWNjb3VudElEKVxyXG4gICAgaWYodGhlSW5kZXg9PS0xKSB0aGlzLnByb2plY3RJbmZvLnNoYXJlV2l0aC5wdXNoKHNoYXJlVG9BY2NvdW50SUQpXHJcbn1cclxuXHJcbmVkaXRQcm9qZWN0RGlhbG9nLnByb3RvdHlwZS5kcmF3U2hhcmVkQWNjb3VudHM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuc2hhcmVBY2NvdW50c0xpc3QuZW1wdHkoKVxyXG4gICAgdmFyIHNoYXJlZEFjY291bnQ9dGhpcy5wcm9qZWN0SW5mby5zaGFyZVdpdGhcclxuICAgIHNoYXJlZEFjY291bnQuZm9yRWFjaChvbmVFbWFpbCA9PiB7XHJcbiAgICAgICAgdmFyIGFyb3cgPSAkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5zaGFyZUFjY291bnRzTGlzdC5hcHBlbmQoYXJvdylcclxuICAgICAgICB2YXIgbGFibGUgPSAkKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7XCI+JytvbmVFbWFpbCsnIDwvZGl2PicpXHJcbiAgICAgICAgYXJvdy5hcHBlbmQobGFibGUpXHJcbiAgICAgICAgdmFyIHJlbW92ZUJ0bj0kKCc8YSBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXIgdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoxMHB4eXlcIiBocmVmPVwiI1wiPlJlbW92ZTwvYT4nKVxyXG4gICAgICAgIGFyb3cuYXBwZW5kKHJlbW92ZUJ0bilcclxuICAgICAgICByZW1vdmVCdG4ub24oXCJjbGlja1wiLGFzeW5jICgpPT57XHJcbiAgICAgICAgICAgIHZhciByZXF1ZXN0Qm9keT17XCJwcm9qZWN0SURcIjp0aGlzLnByb2plY3RJbmZvLmlkLFwibm90U2hhcmVUb0FjY291bnRcIjpvbmVFbWFpbH1cclxuICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImFjY291bnRNYW5hZ2VtZW50L25vdFNoYXJlUHJvamVjdFRvXCIsIFwiUE9TVFwiLCByZXF1ZXN0Qm9keSlcclxuICAgICAgICAgICAgICAgIHZhciB0aGVJbmRleCA9IHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLmluZGV4T2Yob25lRW1haWwpXHJcbiAgICAgICAgICAgICAgICBpZiAodGhlSW5kZXggIT0gLTEpIHRoaXMucHJvamVjdEluZm8uc2hhcmVXaXRoLnNwbGljZSh0aGVJbmRleCwgMSlcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1NoYXJlZEFjY291bnRzKClcclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICByZXR1cm5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0UHJvamVjdERpYWxvZygpOyIsImZ1bmN0aW9uIGdsb2JhbENhY2hlKCl7XHJcbiAgICB0aGlzLmFjY291bnRJbmZvPW51bGw7XHJcbiAgICB0aGlzLmpvaW5lZFByb2plY3RzVG9rZW49bnVsbDtcclxuICAgIHRoaXMuc2hvd0Zsb2F0SW5mb1BhbmVsPXRydWVcclxuICAgIHRoaXMuREJNb2RlbHNBcnIgPSBbXVxyXG4gICAgdGhpcy5EQlR3aW5zID0ge31cclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG4gICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEPXt9XHJcbiAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWU9e31cclxuICAgIHRoaXMudHdpbkRpc3BsYXlOYW1lTWFwVG9JRD17fVxyXG4gICAgdGhpcy5zdG9yZWRUd2lucyA9IHt9XHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbj17XCJkZWZhdWx0XCI6e1wiZGV0YWlsXCI6e319fVxyXG5cclxuICAgIHRoaXMuaW5pdFN0b3JlZEluZm9ybXRpb24oKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuaW5pdFN0b3JlZEluZm9ybXRpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyA9IHt9IFxyXG4gICAgLy9zdG9yZWQgZGF0YSwgc2VwZXJhdGVseSBmcm9tIEFEVCBzZXJ2aWNlIGFuZCBmcm9tIGNvc21vc0RCIHNlcnZpY2VcclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbCAgIFxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZmluZFByb2plY3RJbmZvPWZ1bmN0aW9uKHByb2plY3RJRCl7XHJcbiAgICB2YXIgam9pbmVkUHJvamVjdHM9dGhpcy5hY2NvdW50SW5mby5qb2luZWRQcm9qZWN0c1xyXG4gICAgZm9yKHZhciBpPTA7aTxqb2luZWRQcm9qZWN0cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb25lUHJvamVjdD1qb2luZWRQcm9qZWN0c1tpXVxyXG4gICAgICAgIGlmKG9uZVByb2plY3QuaWQ9PXByb2plY3RJRCkgcmV0dXJuIG9uZVByb2plY3RcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZUFEVFR3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSl7XHJcbiAgICB0d2luc0RhdGEuZm9yRWFjaCgob25lTm9kZSk9Pnt0aGlzLnN0b3JlU2luZ2xlQURUVHdpbihvbmVOb2RlKX0pO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVBRFRUd2luPWZ1bmN0aW9uKG9uZU5vZGUpe1xyXG4gICAgdGhpcy5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZVxyXG4gICAgb25lTm9kZVtcImRpc3BsYXlOYW1lXCJdPSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lTm9kZVtcIiRkdElkXCJdXVxyXG4gICAgLy90aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRUd2luSW5mb1VwZGF0ZVwiLFwidHdpbklEXCI6b25lTm9kZVtcIiRkdElkXCJdfSlcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCVHdpbj1mdW5jdGlvbihEQlR3aW4pe1xyXG4gICAgdGhpcy5EQlR3aW5zW0RCVHdpbltcImlkXCJdXT1EQlR3aW5cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtEQlR3aW5bXCJpZFwiXV09REJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIHRoaXMudHdpbkRpc3BsYXlOYW1lTWFwVG9JRFtEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXV09REJUd2luW1wiaWRcIl1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJUd2luc0Fycj1mdW5jdGlvbihEQlR3aW5zQXJyKXtcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMuREJUd2lucykgZGVsZXRlIHRoaXMuREJUd2luc1tpbmRdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWUpIGRlbGV0ZSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbaW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy50d2luRGlzcGxheU5hbWVNYXBUb0lEKSBkZWxldGUgdGhpcy50d2luRGlzcGxheU5hbWVNYXBUb0lEW2luZF1cclxuXHJcbiAgICB0aGlzLm1lcmdlREJUd2luc0FycihEQlR3aW5zQXJyKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubWVyZ2VEQlR3aW5zQXJyPWZ1bmN0aW9uKERCVHdpbnNBcnIpe1xyXG4gICAgREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgIHRoaXMuREJUd2luc1tvbmVEQlR3aW5bXCJpZFwiXV09b25lREJUd2luXHJcbiAgICAgICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZURCVHdpbltcImlkXCJdXT1vbmVEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgICAgIHRoaXMudHdpbkRpc3BsYXlOYW1lTWFwVG9JRFtvbmVEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXV09b25lREJUd2luW1wiaWRcIl1cclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVVzZXJEYXRhPWZ1bmN0aW9uKHJlcyl7XHJcbiAgICByZXMuZm9yRWFjaChvbmVSZXNwb25zZT0+e1xyXG4gICAgICAgIGlmKG9uZVJlc3BvbnNlLnR5cGU9PVwiam9pbmVkUHJvamVjdHNUb2tlblwiKSB0aGlzLmpvaW5lZFByb2plY3RzVG9rZW49b25lUmVzcG9uc2Uuand0O1xyXG4gICAgICAgIGVsc2UgaWYob25lUmVzcG9uc2UudHlwZT09XCJ1c2VyXCIpIHRoaXMuYWNjb3VudEluZm89b25lUmVzcG9uc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RNb2RlbHNEYXRhPWZ1bmN0aW9uKERCTW9kZWxzLGFkdE1vZGVscyl7XHJcbiAgICB0aGlzLnN0b3JlREJNb2RlbHNBcnIoREJNb2RlbHMpXHJcblxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxOYW1lTWFwVG9JRCkgZGVsZXRlIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtpbmRdXHJcblxyXG4gICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFkdE1vZGVscy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9PSBudWxsKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcIkBpZFwiXVxyXG4gICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QoYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl0pKSB7XHJcbiAgICAgICAgICAgIGlmIChhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgZWxzZSBhZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IEpTT04uc3RyaW5naWZ5KGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodG1wTmFtZVRvT2JqW2FkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgIGFkdE1vZGVsc1tpXVtcImRpc3BsYXlOYW1lXCJdID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRtcE5hbWVUb09ialthZHRNb2RlbHNbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSAxXHJcblxyXG4gICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVthZHRNb2RlbHNbaV1bXCJAaWRcIl1dID0gYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSURbYWR0TW9kZWxzW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gYWR0TW9kZWxzW2ldW1wiQGlkXCJdXHJcbiAgICB9XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVByb2plY3RUd2luc0FuZFZpc3VhbERhdGE9ZnVuY3Rpb24ocmVzQXJyKXtcclxuICAgIHZhciBkYnR3aW5zPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnZpc3VhbERlZmluaXRpb24pIGRlbGV0ZSB0aGlzLnZpc3VhbERlZmluaXRpb25baW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5sYXlvdXRKU09OKSBkZWxldGUgdGhpcy5sYXlvdXRKU09OW2luZF1cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl09e1wiZGV0YWlsXCI6e319XHJcblxyXG4gICAgcmVzQXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudC50eXBlPT1cInZpc3VhbFNjaGVtYVwiKSB7XHJcbiAgICAgICAgICAgIC8vVE9ETzogbm93IHRoZXJlIGlzIG9ubHkgb25lIFwiZGVmYXVsdFwiIHNjaGVtYSB0byB1c2UsY29uc2lkZXIgYWxsb3cgY3JlYXRpbmcgbW9yZSB1c2VyIGRlZmluZSB2aXN1YWwgc2NoZW1hXHJcbiAgICAgICAgICAgIC8vVE9ETzogb25seSBjaG9vc2UgdGhlIHNjaGVtYSBiZWxvbmdzIHRvIHNlbGZcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRTaW5nbGVWaXN1YWxTY2hlbWEoZWxlbWVudC5kZXRhaWwsZWxlbWVudC5hY2NvdW50SUQsZWxlbWVudC5uYW1lLGVsZW1lbnQuaXNTaGFyZWQpXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRTaW5nbGVMYXlvdXQoZWxlbWVudC5kZXRhaWwsZWxlbWVudC5hY2NvdW50SUQsZWxlbWVudC5uYW1lLGVsZW1lbnQuaXNTaGFyZWQpXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUVHdpblwiKSBkYnR3aW5zLnB1c2goZWxlbWVudClcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zdG9yZURCVHdpbnNBcnIoZGJ0d2lucylcclxuXHJcbiAgICByZXNBcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50Lm9yaWdpbmFsU2NyaXB0IT1udWxsKSB7IFxyXG4gICAgICAgICAgICB2YXIgdHdpbklEPWVsZW1lbnQudHdpbklEXHJcbiAgICAgICAgICAgIHZhciBvbmVEQlR3aW49dGhpcy5EQlR3aW5zW3R3aW5JRF1cclxuICAgICAgICAgICAgaWYob25lREJUd2luKXtcclxuICAgICAgICAgICAgICAgIG9uZURCVHdpbltcIm9yaWdpbmFsU2NyaXB0XCJdPWVsZW1lbnRbXCJvcmlnaW5hbFNjcmlwdFwiXVxyXG4gICAgICAgICAgICAgICAgb25lREJUd2luW1wibGFzdEV4ZWN1dGlvblRpbWVcIl09ZWxlbWVudFtcImxhc3RFeGVjdXRpb25UaW1lXCJdXHJcbiAgICAgICAgICAgICAgICBvbmVEQlR3aW5bXCJhdXRob3JcIl09ZWxlbWVudFtcImF1dGhvclwiXVxyXG4gICAgICAgICAgICAgICAgb25lREJUd2luW1wiaW52YWxpZEZsYWdcIl09ZWxlbWVudFtcImludmFsaWRGbGFnXCJdXHJcbiAgICAgICAgICAgICAgICBvbmVEQlR3aW5bXCJpbnB1dHNcIl09ZWxlbWVudFtcImlucHV0c1wiXVxyXG4gICAgICAgICAgICAgICAgb25lREJUd2luW1wib3V0cHV0c1wiXT1lbGVtZW50W1wib3V0cHV0c1wiXVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUucmVjb3JkU2luZ2xlVmlzdWFsU2NoZW1hPWZ1bmN0aW9uKGRldGFpbCxhY2NvdW50SUQsb25hbWUsaXNTaGFyZWQpe1xyXG4gICAgaWYgKGFjY291bnRJRCA9PSB0aGlzLmFjY291bnRJbmZvLmlkKSB2YXIgdnNOYW1lID0gb25hbWVcclxuICAgIGVsc2UgdnNOYW1lID0gb25hbWUgKyBgKGZyb20gJHthY2NvdW50SUR9KWBcclxuICAgIHZhciBkaWN0ID0geyBcImRldGFpbFwiOiBkZXRhaWwsIFwiaXNTaGFyZWRcIjogaXNTaGFyZWQsIFwib3duZXJcIjogYWNjb3VudElELCBcIm9uYW1lXCI6IG9uYW1lfVxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uW3ZzTmFtZV09ZGljdFxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUucmVjb3JkU2luZ2xlTGF5b3V0PWZ1bmN0aW9uKGRldGFpbCxhY2NvdW50SUQsb25hbWUsaXNTaGFyZWQpe1xyXG4gICAgaWYgKGFjY291bnRJRCA9PSB0aGlzLmFjY291bnRJbmZvLmlkKSB2YXIgbGF5b3V0TmFtZSA9IG9uYW1lXHJcbiAgICBlbHNlIGxheW91dE5hbWUgPSBvbmFtZSArIGAoZnJvbSAke2FjY291bnRJRH0pYFxyXG4gICAgdmFyIGRpY3QgPSB7IFwiZGV0YWlsXCI6IGRldGFpbCwgXCJpc1NoYXJlZFwiOiBpc1NoYXJlZCwgXCJvd25lclwiOiBhY2NvdW50SUQsIFwibmFtZVwiOiBsYXlvdXROYW1lLCBcIm9uYW1lXCI6b25hbWUgfVxyXG4gICAgdGhpcy5sYXlvdXRKU09OW2xheW91dE5hbWVdID0gZGljdFxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0REJUd2luc0J5TW9kZWxJRD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciByZXN1bHRBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMuREJUd2lucyl7XHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRCVHdpbnNbaW5kXVxyXG4gICAgICAgIGlmKGVsZS5tb2RlbElEPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgcmVzdWx0QXJyLnB1c2goZWxlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZXN1bHRBcnI7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5nZXRTaW5nbGVEQlR3aW5CeU5hbWU9ZnVuY3Rpb24odHdpbk5hbWUpe1xyXG4gICAgdmFyIHR3aW5JRD10aGlzLnR3aW5EaXNwbGF5TmFtZU1hcFRvSURbdHdpbk5hbWVdXHJcbiAgICByZXR1cm4gdGhpcy5EQlR3aW5zW3R3aW5JRF1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCVHdpbkJ5SW5kb29yRmVhdHVyZUlEPWZ1bmN0aW9uKGZlYXR1cmVJRCl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLkRCVHdpbnMpe1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EQlR3aW5zW2luZF1cclxuICAgICAgICBpZihlbGUuR0lTICYmIGVsZS5HSVMuaW5kb29yKXtcclxuICAgICAgICAgICAgaWYoZWxlLkdJUy5pbmRvb3IuSW5kb29yRmVhdHVyZUlEPT1mZWF0dXJlSUQpIHJldHVybiBlbGVcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmdldFNpbmdsZURCTW9kZWxCeUlEPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRCTW9kZWxzQXJyW2ldXHJcbiAgICAgICAgaWYoZWxlLmlkPT1tb2RlbElEKXtcclxuICAgICAgICAgICAgcmV0dXJuIGVsZVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBudWxsO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVEQk1vZGVsPWZ1bmN0aW9uKHNpbmdsZURCTW9kZWxJbmZvKXtcclxuICAgIHZhciBtb2RlbElEID0gc2luZ2xlREJNb2RlbEluZm8uaWRcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EQk1vZGVsc0FycltpXVxyXG4gICAgICAgIGlmKGVsZS5pZD09bW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIGVsZSkgZGVsZXRlIGVsZVtpbmRdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIHNpbmdsZURCTW9kZWxJbmZvKSBlbGVbaW5kXT1zaW5nbGVEQk1vZGVsSW5mb1tpbmRdXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL2l0IGlzIGEgbmV3IHNpbmdsZSBtb2RlbCBpZiBjb2RlIHJlYWNoZXMgaGVyZVxyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5wdXNoKHNpbmdsZURCTW9kZWxJbmZvKVxyXG4gICAgdGhpcy5zb3J0REJNb2RlbHNBcnIoKVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVEQk1vZGVsc0Fycj1mdW5jdGlvbihEQk1vZGVsc0Fycil7XHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aD0wXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyPXRoaXMuREJNb2RlbHNBcnIuY29uY2F0KERCTW9kZWxzQXJyKVxyXG4gICAgdGhpcy5zb3J0REJNb2RlbHNBcnIoKVxyXG4gICAgXHJcbn1cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnNvcnREQk1vZGVsc0Fycj1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICB2YXIgYk5hbWU9Yi5kaXNwbGF5TmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuZ2V0U3RvcmVkQWxsSW5ib3VuZFJlbGF0aW9uc1NvdXJjZXM9ZnVuY3Rpb24odHdpbklEKXtcclxuICAgIHZhciBzcmNUd2lucz17fVxyXG4gICAgZm9yKHZhciBzcmNUd2luIGluIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB2YXIgYXJyPXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY1R3aW5dXHJcbiAgICAgICAgYXJyLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgaWYob25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl09PXR3aW5JRCkgc3JjVHdpbnNbb25lUmVsYXRpb25bXCIkc291cmNlSWRcIl1dPTFcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHNyY1R3aW5zO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciB0d2luSUQ9b25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF09W11cclxuICAgIH0pXHJcblxyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQ9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICBpZighdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0pXHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dPVtdXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmU9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25zaGlwW1wic3JjSURcIl1cclxuICAgICAgICBpZih0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgYXJyPXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXVxyXG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgIGlmKGFycltpXVsnJHJlbGF0aW9uc2hpcElkJ109PW9uZVJlbGF0aW9uc2hpcFtcInJlbElEXCJdKXtcclxuICAgICAgICAgICAgICAgICAgICBhcnIuc3BsaWNlKGksMSlcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5maW5kQWxsSW5wdXRzSW5TY3JpcHQ9ZnVuY3Rpb24oY2FsY1NjcmlwdCxmb3JtdWxhVHdpbk5hbWUpe1xyXG4gICAgLy9maW5kIGFsbCBwcm9wZXJ0aWVzIGluIHRoZSBzY3JpcHRcclxuICAgIGNhbGNTY3JpcHQrPVwiXFxuXCIgLy9tYWtlIHN1cmUgdGhlIGJlbG93IHBhdHRlcm5zIHVzaW5nIFwiW14uIF0gbm90IGZhaWwgYmVjYXVzZSBvZiBpdCBpcyB0aGUgZW5kIG9mIHN0cmluZyBcIlxyXG4gICAgdmFyIHBhdHQgPSAvX3NlbGYoPzw9X3NlbGYpXFxbXFxcIi4qPyg/PVxcXCJcXF1bXlxcW10pXFxcIlxcXS9nOyBcclxuICAgIHZhciBhbGxTZWxmUHJvcGVydGllcz1jYWxjU2NyaXB0Lm1hdGNoKHBhdHQpfHxbXTtcclxuICAgIHZhciBjb3VudEFsbFNlbGZUaW1lcz17fVxyXG4gICAgYWxsU2VsZlByb3BlcnRpZXMuZm9yRWFjaChvbmVTZWxmPT57XHJcbiAgICAgICAgaWYoY291bnRBbGxTZWxmVGltZXNbb25lU2VsZl0pIGNvdW50QWxsU2VsZlRpbWVzW29uZVNlbGZdKz0xXHJcbiAgICAgICAgZWxzZSBjb3VudEFsbFNlbGZUaW1lc1tvbmVTZWxmXT0xXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBwYXR0ID0gL190d2luVmFsKD88PV90d2luVmFsKVxcW1xcXCIuKj8oPz1cXFwiXFxdW15cXFtdKVxcXCJcXF0vZzsgXHJcbiAgICB2YXIgYWxsT3RoZXJUd2luUHJvcGVydGllcz1jYWxjU2NyaXB0Lm1hdGNoKHBhdHQpfHxbXTtcclxuICAgIHZhciBsaXN0QWxsT3RoZXJzPXt9XHJcbiAgICBhbGxPdGhlclR3aW5Qcm9wZXJ0aWVzLmZvckVhY2gob25lT3RoZXI9PntsaXN0QWxsT3RoZXJzW29uZU90aGVyXT0xIH0pXHJcblxyXG4gICAgLy9hbmFseXplIGFsbCB2YXJpYWJsZXMgdGhhdCBjYW4gbm90IGJlIGFzIGlucHV0IGFzIHRoZXkgYXJlIGNoYW5nZWQgZHVyaW5nIGNhbGN1YXRpb25cclxuICAgIC8vdGhleSBkaXNxdWFsaWZ5IGFzIGlucHV0IGFzIHRoZXkgd2lsbCB0cmlnZ2VyIGluZmluaXRlIGNhbGN1bGF0aW9uLCBhbGwgdGhlc2UgYmVsb25ncyB0byBfc2VsZlxyXG4gICAgdmFyIG91dHB1dHBhdHQgPSAvX3NlbGYoPzw9X3NlbGYpXFxbXFxcIlteO3tdKj9bXlxcPV0oPz1cXD1bXlxcPV0pL2c7XHJcbiAgICB2YXIgb3V0cHV0UHJvcGVydGllcz1jYWxjU2NyaXB0Lm1hdGNoKG91dHB1dHBhdHQpfHxbXTtcclxuICAgIHZhciBjb3VudE91dHB1dFRpbWVzPXt9XHJcbiAgICBvdXRwdXRQcm9wZXJ0aWVzLmZvckVhY2gob25lT3V0cHV0PT57XHJcbiAgICAgICAgaWYoY291bnRPdXRwdXRUaW1lc1tvbmVPdXRwdXRdKSBjb3VudE91dHB1dFRpbWVzW29uZU91dHB1dF0rPTFcclxuICAgICAgICBlbHNlIGNvdW50T3V0cHV0VGltZXNbb25lT3V0cHV0XT0xXHJcbiAgICB9KVxyXG4gICAgXHJcblxyXG4gICAgdmFyIGlucHV0UHJvcGVydGllc0Fycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGlzdEFsbE90aGVycykgaW5wdXRQcm9wZXJ0aWVzQXJyLnB1c2goaW5kKVxyXG4gICAgZm9yKHZhciBpbmQgaW4gY291bnRBbGxTZWxmVGltZXMpe1xyXG4gICAgICAgIGlmKGNvdW50QWxsU2VsZlRpbWVzW2luZF0hPWNvdW50T3V0cHV0VGltZXNbaW5kXSkgaW5wdXRQcm9wZXJ0aWVzQXJyLnB1c2goaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciByZXR1cm5BcnI9W11cclxuICAgIGlucHV0UHJvcGVydGllc0Fyci5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgdmFyIG9uZUlucHV0T2JqPXt9IC8vdHdpbklELCBwYXRoLCB2YWx1ZVxyXG4gICAgICAgIHZhciBmZXRjaHByb3BlcnR5cGF0dCA9IC8oPzw9XFxbXFxcIikuKj8oPz1cXFwiXFxdKS9nO1xyXG4gICAgICAgIGlmKG9uZVByb3BlcnR5LnN0YXJ0c1dpdGgoXCJfc2VsZlwiKSl7XHJcbiAgICAgICAgICAgIG9uZUlucHV0T2JqLnBhdGg9b25lUHJvcGVydHkubWF0Y2goZmV0Y2hwcm9wZXJ0eXBhdHQpO1xyXG4gICAgICAgICAgICBvbmVJbnB1dE9iai50d2luTmFtZT1mb3JtdWxhVHdpbk5hbWUrXCIoc2VsZilcIlxyXG4gICAgICAgICAgICBvbmVJbnB1dE9iai50d2luTmFtZV9vcmlnaW49Zm9ybXVsYVR3aW5OYW1lXHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9dGhpcy50d2luRGlzcGxheU5hbWVNYXBUb0lEW2Zvcm11bGFUd2luTmFtZV1cclxuICAgICAgICAgICAgb25lSW5wdXRPYmoudmFsdWU9dGhpcy5zZWFyY2hWYWx1ZSh0aGlzLnN0b3JlZFR3aW5zW3R3aW5JRF0sb25lSW5wdXRPYmoucGF0aClcclxuICAgICAgICB9ZWxzZSBpZihvbmVQcm9wZXJ0eS5zdGFydHNXaXRoKFwiX3R3aW5WYWxcIikpe1xyXG4gICAgICAgICAgICB2YXIgYXJyPW9uZVByb3BlcnR5Lm1hdGNoKGZldGNocHJvcGVydHlwYXR0KTtcclxuICAgICAgICAgICAgdmFyIGZpcnN0RWxlPWFyclswXVxyXG4gICAgICAgICAgICBhcnIuc2hpZnQoKVxyXG4gICAgICAgICAgICBvbmVJbnB1dE9iai5wYXRoPWFyclxyXG4gICAgICAgICAgICB2YXIgdHdpbklEPXRoaXMudHdpbkRpc3BsYXlOYW1lTWFwVG9JRFtmaXJzdEVsZV1cclxuICAgICAgICAgICAgb25lSW5wdXRPYmoudmFsdWU9dGhpcy5zZWFyY2hWYWx1ZSh0aGlzLnN0b3JlZFR3aW5zW3R3aW5JRF0sb25lSW5wdXRPYmoucGF0aClcclxuICAgICAgICAgICAgb25lSW5wdXRPYmoudHdpbk5hbWU9b25lSW5wdXRPYmoudHdpbk5hbWVfb3JpZ2luPWZpcnN0RWxlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybkFyci5wdXNoKG9uZUlucHV0T2JqKVxyXG4gICAgfSlcclxuICAgIHJldHVybiByZXR1cm5BcnJcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcixzZWNvbmRDb2xvcil7XHJcbiAgICB2YXIgc3ZnU3RhcnQ9JzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPidcclxuICAgIGlmKHNlY29uZENvbG9yKXtcclxuICAgICAgICBpZihjb2xvcj09XCJub25lXCIpIGNvbG9yPVwiZGFya0dyYXlcIiBcclxuICAgICAgICB2YXIgZ3JhZGllbnREZWZpbml0aW9uPSc8ZGVmcz4nK1xyXG4gICAgICAgICAgICAnPGxpbmVhckdyYWRpZW50IGlkPVwiZ3JhZDFcIiB4MT1cIjAlXCIgeTE9XCIwJVwiIHgyPVwiMCVcIiB5Mj1cIjEwMCVcIj4nK1xyXG4gICAgICAgICAgICAnPHN0b3Agb2Zmc2V0PVwiMCVcIiBzdHlsZT1cInN0b3AtY29sb3I6Jytjb2xvcisnO3N0b3Atb3BhY2l0eToxXCIgLz4nK1xyXG4gICAgICAgICAgICAnPHN0b3Agb2Zmc2V0PVwiNTAlXCIgc3R5bGU9XCJzdG9wLWNvbG9yOicrY29sb3IrJztzdG9wLW9wYWNpdHk6MVwiIC8+JytcclxuICAgICAgICAgICAgJzxzdG9wIG9mZnNldD1cIjUxJVwiIHN0eWxlPVwic3RvcC1jb2xvcjonK3NlY29uZENvbG9yKyc7c3RvcC1vcGFjaXR5OjFcIiAvPicrXHJcbiAgICAgICAgICAgICc8L2xpbmVhckdyYWRpZW50PjwvZGVmcz4nXHJcbiAgICAgICAgc3ZnU3RhcnQrPWdyYWRpZW50RGVmaW5pdGlvblxyXG4gICAgfVxyXG4gICAgdmFyIGNvbG9yU3RyPShzZWNvbmRDb2xvcik/XCJ1cmwoI2dyYWQxKVwiOmNvbG9yXHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiBzdmdTdGFydCsnPGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvclN0cisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuIHN2Z1N0YXJ0Kyc8cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yU3RyKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gc3ZnU3RhcnQrJzxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3JTdHIrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubWFrZURPTURyYWdnYWJsZT1mdW5jdGlvbihkb20saWdub3JlQ2hpbGREb21UeXBlKXtcclxuICAgIGlnbm9yZUNoaWxkRG9tVHlwZT1pZ25vcmVDaGlsZERvbVR5cGV8fFtcIkxBQkVMXCIsXCJURFwiLFwiQlwiLFwiQVwiLFwiSU5QVVRcIixcIlBSRVwiXVxyXG4gICAgZG9tLm9uKCdtb3VzZWRvd24nLChlKT0+e1xyXG4gICAgICAgIGlmKGlnbm9yZUNoaWxkRG9tVHlwZS5pbmRleE9mKGUudGFyZ2V0LnRhZ05hbWUpIT0tMSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkb21PZmZzZXQ9ZG9tLm9mZnNldCgpXHJcbiAgICAgICAgZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0PVtkb21PZmZzZXQubGVmdC1lLmNsaWVudFgsIGRvbU9mZnNldC50b3AtZS5jbGllbnRZXVxyXG4gICAgICAgICQoJ2JvZHknKS5vbignbW91c2V1cCcsKCk9PntcclxuICAgICAgICAgICAgZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0PW51bGxcclxuICAgICAgICAgICAgJCgnYm9keScpLm9mZignbW91c2Vtb3ZlJylcclxuICAgICAgICAgICAgJCgnYm9keScpLm9mZignbW91c2V1cCcpXHJcbiAgICAgICAgfSlcclxuICAgICAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZScsKGUpPT57XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICBpZihkb20ubW91c2VTdGFydERyYWdPZmZzZXQpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0xlZnQ9IGUuY2xpZW50WCtkb20ubW91c2VTdGFydERyYWdPZmZzZXRbMF1cclxuICAgICAgICAgICAgICAgIHZhciBuZXdUb3A9ZS5jbGllbnRZK2RvbS5tb3VzZVN0YXJ0RHJhZ09mZnNldFsxXVxyXG4gICAgICAgICAgICAgICAgZG9tLmNzcyh7XCJsZWZ0XCI6bmV3TGVmdCtcInB4XCIsXCJ0b3BcIjpuZXdUb3ArXCJweFwiLFwidHJhbnNmb3JtXCI6XCJub25lXCJ9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGdsb2JhbENhY2hlKCk7IiwiY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG4vL1RoaXMgaXMgYSBzaW5nbGV0b24gY2xhc3NcclxuXHJcbmZ1bmN0aW9uIG1vZGVsQW5hbHl6ZXIoKXtcclxuICAgIHRoaXMuRFRETE1vZGVscz17fVxyXG4gICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlcz17fVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5jbGVhckFsbE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgLy9jb25zb2xlLmxvZyhcImNsZWFyIGFsbCBtb2RlbCBpbmZvXCIpXHJcbiAgICBmb3IodmFyIGlkIGluIHRoaXMuRFRETE1vZGVscykgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1tpZF1cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVzZXRBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBqc29uU3RyPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPUpTT04ucGFyc2UoanNvblN0cilcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXT1qc29uU3RyXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hZGRNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9IGVsZVtcIkBpZFwiXVxyXG4gICAgICAgIGVsZVtcIm9yaWdpbmFsXCJdPUpTT04uc3RyaW5naWZ5KGVsZSlcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09ZWxlXHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVjb3JkQWxsQmFzZUNsYXNzZXM9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgcGFyZW50T2JqW2Jhc2VDbGFzc0lEXT0xXHJcblxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHBhcmVudE9ialtpbmRdID0gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllc1tpbmRdXHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICBpZihwYXJlbnRPYmpbaW5kXT09bnVsbCkgcGFyZW50T2JqW2luZF0gPSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2luZF1bYmFzZUNsYXNzSURdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocGFyZW50T2JqLGRhdGFJbmZvLGVtYmVkZGVkU2NoZW1hKXtcclxuICAgIGRhdGFJbmZvLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm47XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlByb3BlcnR5XCJcclxuICAgICAgICB8fChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnRbXCJAdHlwZVwiXSkgJiYgb25lQ29udGVudFtcIkB0eXBlXCJdLmluY2x1ZGVzKFwiUHJvcGVydHlcIikpXHJcbiAgICAgICAgfHwgb25lQ29udGVudFtcIkB0eXBlXCJdPT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JyAmJiBlbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXSE9bnVsbCkgb25lQ29udGVudFtcInNjaGVtYVwiXT1lbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld1BhcmVudD17fVxyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1uZXdQYXJlbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG5ld1BhcmVudCxvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICB9ICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYW5hbHl6ZT1mdW5jdGlvbigpe1xyXG4gICAgLy9jb25zb2xlLmxvZyhcImFuYWx5emUgbW9kZWwgaW5mb1wiKVxyXG4gICAgLy9hbmFseXplIGFsbCByZWxhdGlvbnNoaXAgdHlwZXNcclxuICAgIGZvciAodmFyIGlkIGluIHRoaXMucmVsYXRpb25zaGlwVHlwZXMpIGRlbGV0ZSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2lkXVxyXG4gICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpIHtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hID0ge31cclxuICAgICAgICBpZiAoZWxlLnNjaGVtYXMpIHtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFyciA9IGVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFyciA9IFtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV0gPSBlbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50QXJyID0gZWxlLmNvbnRlbnRzXHJcbiAgICAgICAgaWYgKCFjb250ZW50QXJyKSBjb250aW51ZTtcclxuICAgICAgICBjb250ZW50QXJyLmZvckVhY2goKG9uZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKG9uZUNvbnRlbnRbXCJAdHlwZVwiXSA9PSBcIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV0pIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dPSB7fVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF0gPSBvbmVDb250ZW50XHJcbiAgICAgICAgICAgICAgICBvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcyA9IHt9XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbmVDb250ZW50LnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMob25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIG9uZUNvbnRlbnQucHJvcGVydGllcywgZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vYW5hbHl6ZSBlYWNoIG1vZGVsJ3MgcHJvcGVydHkgdGhhdCBjYW4gYmUgZWRpdGVkXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsgLy9leHBhbmQgcG9zc2libGUgZW1iZWRkZWQgc2NoZW1hIHRvIGVkaXRhYmxlUHJvcGVydGllcywgYWxzbyBleHRyYWN0IHBvc3NpYmxlIHJlbGF0aW9uc2hpcCB0eXBlcyBmb3IgdGhpcyBtb2RlbFxyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hPXt9XHJcbiAgICAgICAgaWYoZWxlLnNjaGVtYXMpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnI9ZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyPVtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dPWVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzPXt9XHJcbiAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwcz17fVxyXG4gICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHM9W11cclxuICAgICAgICBlbGUuYWxsQmFzZUNsYXNzZXM9e31cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVsZS5jb250ZW50cyxlbWJlZGRlZFNjaGVtYSlcclxuXHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwc1tvbmVDb250ZW50W1wibmFtZVwiXV09dGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKG9uZUNvbnRlbnQ9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJDb21wb25lbnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudE5hbWU9b25lQ29udGVudFtcIm5hbWVcIl1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50Q2xhc3M9b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXSxjb21wb25lbnRDbGFzcylcclxuICAgICAgICAgICAgICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzLnB1c2goY29tcG9uZW50TmFtZSlcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGJhc2UgY2xhc3MgcHJvcGVydGllcyB0byBlZGl0YWJsZVByb3BlcnRpZXMgYW5kIHZhbGlkIHJlbGF0aW9uc2hpcCB0eXBlcyB0byB2YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBiYXNlQ2xhc3NJRHM9ZWxlLmV4dGVuZHM7XHJcbiAgICAgICAgaWYoYmFzZUNsYXNzSURzPT1udWxsKSBjb250aW51ZTtcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9YmFzZUNsYXNzSURzXHJcbiAgICAgICAgZWxzZSB0bXBBcnI9W2Jhc2VDbGFzc0lEc11cclxuICAgICAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMoZWxlLmFsbEJhc2VDbGFzc2VzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhlbGUudmFsaWRSZWxhdGlvbnNoaXBzLGVhY2hCYXNlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLkRURExNb2RlbHMpXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMucmVsYXRpb25zaGlwVHlwZXMpXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciBjaGlsZE1vZGVsSURzPVtdXHJcbiAgICBmb3IodmFyIGFJRCBpbiB0aGlzLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBhTW9kZWw9dGhpcy5EVERMTW9kZWxzW2FJRF1cclxuICAgICAgICBpZihhTW9kZWwuYWxsQmFzZUNsYXNzZXMgJiYgYU1vZGVsLmFsbEJhc2VDbGFzc2VzW21vZGVsSURdKSBjaGlsZE1vZGVsSURzLnB1c2goYU1vZGVsW1wiQGlkXCJdKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoaWxkTW9kZWxJRHNcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZGVsZXRlTW9kZWw9YXN5bmMgZnVuY3Rpb24obW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxmdW5jQWZ0ZXJGYWlsLGNvbXBsZXRlRnVuYyl7XHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPXRoaXMubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICB2YXIgbW9kZWxMZXZlbD1bXVxyXG4gICAgcmVsYXRlZE1vZGVsSURzLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICB2YXIgY2hlY2tNb2RlbD10aGlzLkRURExNb2RlbHNbb25lSURdXHJcbiAgICAgICAgbW9kZWxMZXZlbC5wdXNoKHtcIm1vZGVsSURcIjpvbmVJRCxcImxldmVsXCI6T2JqZWN0LmtleXMoY2hlY2tNb2RlbC5hbGxCYXNlQ2xhc3NlcykubGVuZ3RofSlcclxuICAgIH0pXHJcbiAgICBtb2RlbExldmVsLnB1c2goe1wibW9kZWxJRFwiOm1vZGVsSUQsXCJsZXZlbFwiOjB9KVxyXG4gICAgbW9kZWxMZXZlbC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGJbXCJsZXZlbFwiXS1hW1wibGV2ZWxcIl0gfSk7XHJcbiAgICBcclxuICAgIGZvcih2YXIgaT0wO2k8bW9kZWxMZXZlbC5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYU1vZGVsSUQ9bW9kZWxMZXZlbFtpXS5tb2RlbElEXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVNb2RlbFwiLCBcIlBPU1RcIiwgeyBcIm1vZGVsXCI6IGFNb2RlbElEIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbYU1vZGVsSURdXHJcbiAgICAgICAgICAgIGlmKGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlKSBmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZShhTW9kZWxJRClcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHZhciBkZWxldGVkTW9kZWxzPVtdXHJcbiAgICAgICAgICAgIHZhciBhbGVydFN0cj1cIkRlbGV0ZSBtb2RlbCBpcyBpbmNvbXBsZXRlLiBEZWxldGVkIE1vZGVsOlwiXHJcbiAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aTtqKyspe1xyXG4gICAgICAgICAgICAgICAgYWxlcnRTdHIrPSBtb2RlbExldmVsW2pdLm1vZGVsSUQrXCIgXCJcclxuICAgICAgICAgICAgICAgIGRlbGV0ZWRNb2RlbHMucHVzaChtb2RlbExldmVsW2pdLm1vZGVsSUQpXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIGFsZXJ0U3RyKz1cIi4gRmFpbCB0byBkZWxldGUgXCIrYU1vZGVsSUQrXCIuIEVycm9yIGlzIFwiK2VcclxuICAgICAgICAgICAgaWYoZnVuY0FmdGVyRmFpbCkgZnVuY0FmdGVyRmFpbChkZWxldGVkTW9kZWxzKVxyXG4gICAgICAgICAgICBhbGVydChlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGNvbXBsZXRlRnVuYykgY29tcGxldGVGdW5jKClcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmZldGNoUHJvcGVydHlQYXRoc09mTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcHJvcGVydGllcz10aGlzLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB2YXIgcHJvcGVydHlQYXRocz1bXVxyXG4gICAgdGhpcy5hbmFseXplUHJvcGVydHlQYXRoKHByb3BlcnRpZXMsW10scHJvcGVydHlQYXRocylcclxuICAgIHJldHVybiBwcm9wZXJ0eVBhdGhzXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emVQcm9wZXJ0eVBhdGg9ZnVuY3Rpb24gKGpzb25JbmZvLHBhdGhBcnIscHJvcGVydHlQYXRocyl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkgJiYgdHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICB0aGlzLmFuYWx5emVQcm9wZXJ0eVBhdGgoanNvbkluZm9baW5kXSxuZXdQYXRoLHByb3BlcnR5UGF0aHMpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBwcm9wZXJ0eVBhdGhzLnB1c2gobmV3UGF0aClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsQW5hbHl6ZXIoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2c9cmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxFZGl0b3JEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMFwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUubWFrZURPTURyYWdnYWJsZSh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NjVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbCBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGJ1dHRvblJvdz0kKCc8ZGl2ICBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChidXR0b25Sb3cpXHJcbiAgICB2YXIgaW1wb3J0QnV0dG9uID0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtcmlnaHRcIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIHRoaXMuaW1wb3J0QnV0dG9uPWltcG9ydEJ1dHRvblxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChpbXBvcnRCdXR0b24pXHJcblxyXG4gICAgaW1wb3J0QnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuICAgICAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbY3VycmVudE1vZGVsSURdPT1udWxsKSB0aGlzLmltcG9ydE1vZGVsQXJyKFt0aGlzLmR0ZGxvYmpdKVxyXG4gICAgICAgIGVsc2UgdGhpcy5yZXBsYWNlTW9kZWwoKSAgICAgICBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+TW9kZWwgVGVtcGxhdGU8L2Rpdj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBtb2RlbFRlbXBsYXRlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjEuMmVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwfSlcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobW9kZWxUZW1wbGF0ZVNlbGVjdG9yLkRPTSlcclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuY2hvb3NlVGVtcGxhdGUob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKFwiTmV3IE1vZGVsLi4uXCIsXCJOZXdcIilcclxuICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihtb2RlbE5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PVwiNDUwcHhcIlxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW46MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MzMwcHg7cGFkZGluZy1yaWdodDo1cHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJztvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgZHRkbFNjcmlwdFBhbmVsPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm92ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHg7d2lkdGg6MzEwcHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJ1wiPjwvZGl2PicpXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKGR0ZGxTY3JpcHRQYW5lbClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsPWR0ZGxTY3JpcHRQYW5lbFxyXG5cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlcGxhY2VNb2RlbD1mdW5jdGlvbigpe1xyXG4gICAgLy9kZWxldGUgdGhlIG9sZCBzYW1lIG5hbWUgbW9kZWwsIHRoZW4gY3JlYXRlIGl0IGFnYWluXHJcbiAgICB2YXIgY3VycmVudE1vZGVsSUQ9dGhpcy5kdGRsb2JqW1wiQGlkXCJdXHJcblxyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChjdXJyZW50TW9kZWxJRClcclxuXHJcbiAgICB2YXIgZGlhbG9nU3RyID0gKHJlbGF0ZWRNb2RlbElEcy5sZW5ndGggPT0gMCkgPyAoXCJUd2lucyB3aWxsIGJlIGltcGFjdCB1bmRlciBtb2RlbCBcXFwiXCIgKyBjdXJyZW50TW9kZWxJRCArIFwiXFxcIlwiKSA6XHJcbiAgICAgICAgKGN1cnJlbnRNb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIiArIHJlbGF0ZWRNb2RlbElEcy5qb2luKFwiLCBcIikgKyBcIi4gVHdpbnMgdW5kZXIgdGhlc2UgbW9kZWxzIHdpbGwgYmUgaW1wYWN0LlwiKVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlybVJlcGxhY2VNb2RlbChjdXJyZW50TW9kZWxJRClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICkgICAgXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5pbXBvcnRNb2RlbEFycj1hc3luYyBmdW5jdGlvbihtb2RlbFRvQmVJbXBvcnRlZCxmb3JSZXBsYWNpbmcsYWZ0ZXJGYWlsdXJlKXtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxzXCI6IEpTT04uc3RyaW5naWZ5KG1vZGVsVG9CZUltcG9ydGVkKSB9LFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGlmKGZvclJlcGxhY2luZykgYWxlcnQoXCJNb2RlbCBcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCIgaXMgbW9kaWZpZWQgc3VjY2Vzc2Z1bGx5IVwiKVxyXG4gICAgICAgIGVsc2UgYWxlcnQoXCJNb2RlbCBcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCIgaXMgY3JlYXRlZCFcIilcclxuXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxFZGl0ZWRcIiB9KVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKSAvL2FkZCBzbyBpbW1lZGlhdGxleSB0aGUgbGlzdCBjYW4gc2hvdyB0aGUgbmV3IG1vZGVsc1xyXG4gICAgICAgIHRoaXMucG9wdXAoKSAvL3JlZnJlc2ggY29udGVudFxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGFmdGVyRmFpbHVyZSkgYWZ0ZXJGYWlsdXJlKClcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH0gXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jb25maXJtUmVwbGFjZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVscz1bXVxyXG4gICAgcmVsYXRlZE1vZGVsSURzLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICBiYWNrdXBNb2RlbHMucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tvbmVJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICB9KVxyXG4gICAgYmFja3VwTW9kZWxzLnB1c2godGhpcy5kdGRsb2JqKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVsc1N0cj1lbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoYmFja3VwTW9kZWxzKSlcclxuXHJcbiAgICB2YXIgZnVuY0FmdGVyRmFpbD0oZGVsZXRlZE1vZGVsSURzKT0+e1xyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBiYWNrdXBNb2RlbHNTdHIpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzQWZ0ZXJGYWlsZWRPcGVyYXRpb24uanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCxlYWNoTW9kZWxOYW1lKSA9PiB7fVxyXG4gICAgXHJcbiAgICB2YXIgY29tcGxldGVGdW5jPSgpPT57IFxyXG4gICAgICAgIC8vaW1wb3J0IGFsbCB0aGUgbW9kZWxzIGFnYWluXHJcbiAgICAgICAgdGhpcy5pbXBvcnRNb2RlbEFycihiYWNrdXBNb2RlbHMsXCJmb3JSZXBsYWNpbmdcIixmdW5jQWZ0ZXJGYWlsKVxyXG4gICAgfVxyXG4gICAgbW9kZWxBbmFseXplci5kZWxldGVNb2RlbChtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGZ1bmNBZnRlckZhaWwsY29tcGxldGVGdW5jKVxyXG59XHJcblxyXG5cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VUZW1wbGF0ZT1mdW5jdGlvbih0ZW1wYWx0ZU5hbWUpe1xyXG4gICAgaWYodGVtcGFsdGVOYW1lIT1cIk5ld1wiKXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmo9SlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdGVtcGFsdGVOYW1lXVtcIm9yaWdpbmFsXCJdKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqID0ge1xyXG4gICAgICAgICAgICBcIkBpZFwiOiBcImR0bWk6YU5hbWVTcGFjZTphTW9kZWxJRDsxXCIsXHJcbiAgICAgICAgICAgIFwiQGNvbnRleHRcIjogW1wiZHRtaTpkdGRsOmNvbnRleHQ7MlwiXSxcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkludGVyZmFjZVwiLFxyXG4gICAgICAgICAgICBcImRpc3BsYXlOYW1lXCI6IFwiTmV3IE1vZGVsXCIsXHJcbiAgICAgICAgICAgIFwiY29udGVudHNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImF0dHJpYnV0ZTFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9LHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwibGlua1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmxlZnRTcGFuLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLnJlZnJlc2hEVERMKClcclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+TW9kZWwgSUQgJiBOYW1lPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPm1vZGVsIElEIGNvbnRhaW5zIG5hbWVzcGFjZSwgYSBtb2RlbCBzdHJpbmcgYW5kIGEgdmVyc2lvbiBudW1iZXI8L3A+PC9kaXY+PC9kaXY+JykpXHJcbiAgICBuZXcgaWRSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG4gICAgbmV3IGRpc3BsYXlOYW1lUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0pdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl09W11cclxuICAgIG5ldyBwYXJhbWV0ZXJzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IHJlbGF0aW9uc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyBjb21wb25lbnRzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdKXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl09W11cclxuICAgIG5ldyBiYXNlQ2xhc3Nlc1Jvdyh0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaERUREw9ZnVuY3Rpb24oKXtcclxuICAgIC8vaXQgd2lsbCByZWZyZXNoIHRoZSBnZW5lcmF0ZWQgRFRETCBzYW1wbGUsIGl0IHdpbGwgYWxzbyBjaGFuZ2UgdGhlIGltcG9ydCBidXR0b24gdG8gc2hvdyBcIkNyZWF0ZVwiIG9yIFwiTW9kaWZ5XCJcclxuICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0QnV0dG9uLnRleHQoXCJDcmVhdGVcIilcclxuICAgIGVsc2UgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIk1vZGlmeVwiKVxyXG5cclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmVtcHR5KClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjIwcHg7d2lkdGg6MTAwcHhcIiBjbGFzcz1cInczLWJhciB3My1ncmF5XCI+R2VuZXJhdGVkIERUREw8L2Rpdj4nKSlcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8cHJlIHN0eWxlPVwiY29sb3I6Z3JheVwiPicrSlNPTi5zdHJpbmdpZnkodGhpcy5kdGRsb2JqLG51bGwsMikrJzwvcHJlPicpKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEVkaXRvckRpYWxvZygpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGJhc2VDbGFzc2VzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkJhc2UgQ2xhc3NlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5CYXNlIGNsYXNzIG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFuZCByZWxhdGlvbnNoaXAgdHlwZSBhcmUgaW5oZXJpdGVkPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IFwidW5rbm93blwiXHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUJhc2VjbGFzc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBiYXNlQ2xhc3NOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MjIwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJiYXNlIG1vZGVsIGlkXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoYmFzZUNsYXNzTmFtZUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0LnZhbChkdGRsT2JqKVxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9ialtpXT1iYXNlQ2xhc3NOYW1lSW5wdXQudmFsKClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wb25lbnRzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkNvbXBvbmVudHM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Q29tcG9uZW50IG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFyZSBlbWJlZGRlZCB1bmRlciBhIG5hbWU8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInJlbGF0aW9uMVwiLFxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUmVsYXRpb25zaGlwXCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVSZWxhdGlvblR5cGVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHJlbGF0aW9uTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjkwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJyZWxhdGlvbiBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHRhcmdldE1vZGVsSUQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTQwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCIob3B0aW9uYWwpdGFyZ2V0IG1vZGVsXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHggOHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUHJvcGVydHlcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVQYXJhbWV0ZXJSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosdG9wTGV2ZWwsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHBhcmFtZXRlck5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInBhcmFtZXRlciBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGVudW1WYWx1ZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwic3RyMSxzdHIyLC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxLFwib3B0aW9uTGlzdE1hcmdpblRvcFwiOi0xNTAsXCJvcHRpb25MaXN0TWFyZ2luTGVmdFwiOjYwLFxyXG4gICAgXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJzdHJpbmdcIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJFbnVtXCIsXCJPYmplY3RcIixcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZGF0ZVwiLFwiZGF0ZVRpbWVcIixcImR1cmF0aW9uXCIsXCJsb25nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbC5yZXBsYWNlKFwiIFwiLFwiXCIpLCAvL3JlbW92ZSBhbGwgdGhlIHNwYWNlIGluIG5hbWVcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjg4cHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEzMnB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVRyZWU9IHJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3Qgc2ltcGxlRXhwYW5kYWJsZVNlY3Rpb249IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVFeHBhbmRhYmxlU2VjdGlvblwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxNYW5hZ2VyRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbiAgICB0aGlzLnNob3dSZWxhdGlvblZpc3VhbGl6YXRpb25TZXR0aW5ncz10cnVlO1xyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo3MDBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbHM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGltcG9ydE1vZGVsc0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydE1vZGVsc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgbW9kZWxFZGl0b3JCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+Q3JlYXRlL01vZGlmeSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwb3J0TW9kZWxCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkV4cG9ydCBBbGwgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nOjBweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0NjBweDtoZWlnaHQ6NDEycHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGRlbEJ0bilcclxuXHJcblxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSAkKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+Q2xlYXIgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGltcG9ydFBpY0J0biwgYWN0dWFsSW1wb3J0UGljQnRuLCBjbGVhckF2YXJ0YUJ0bilcclxuICAgIGltcG9ydFBpY0J0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFjdHVhbEltcG9ydFBpY0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCkgPT4ge1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIHZhciB0aGVGaWxlID0gZmlsZXNbMF1cclxuXHJcbiAgICAgICAgaWYgKHRoZUZpbGUudHlwZSA9PSBcImltYWdlL3N2Zyt4bWxcIikge1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZSh0aGVGaWxlKVxyXG4gICAgICAgICAgICB2YXIgZGF0YVVybCA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGVGaWxlLnR5cGUubWF0Y2goJ2ltYWdlLionKSkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YVVybCA9IGF3YWl0IHRoaXMucmVzaXplSW1nRmlsZSh0aGVGaWxlLCA3MClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KHsgd2lkdGg6IFwiMjAwcHhcIiB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIk5vdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgaW1wb3J0IGltYWdlIGZpbGUgKHBuZyxqcGcsc3ZnIGFuZCBzbyBvbilcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgYnV0dG9uczogW3sgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4geyBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCkgfSB9XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcuYXR0cihcInNyY1wiLCBkYXRhVXJsKVxyXG5cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFxyXG4gICAgICAgIGlmICghdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXSA9IHt9XHJcbiAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgPSBkYXRhVXJsXHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJhdmFydGFcIjogZGF0YVVybCB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG5cclxuICAgIGNsZWFyQXZhcnRhQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0pIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcucmVtb3ZlQXR0cignc3JjJyk7XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJub0F2YXJ0YVwiOiB0cnVlIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgfSk7XHJcblxyXG4gICAgXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIHJlbGF0ZWRNb2RlbElEcyA9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgICAgICB2YXIgZGlhbG9nU3RyPShyZWxhdGVkTW9kZWxJRHMubGVuZ3RoPT0wKT8gKFwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiLlwiKTogXHJcbiAgICAgICAgICAgIChtb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIityZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpK1wiLlwiKVxyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgICAgICAvL2NoZWNrIGhvdyBtYW55IHR3aW5zIGFyZSB1bmRlciB0aGlzIG1vZGVsIElEXHJcbiAgICAgICAgdmFyIG51bWJlck9mVHdpbnM9MFxyXG4gICAgICAgIHZhciBjaGVja1R3aW5zTW9kZWxBcnI9W21vZGVsSURdLmNvbmNhdChyZWxhdGVkTW9kZWxJRHMpXHJcbiAgICAgICAgZm9yKHZhciBvbmVUd2luSUQgaW4gZ2xvYmFsQ2FjaGUuREJUd2lucyl7XHJcbiAgICAgICAgICAgIHZhciBvbmVEQlR3aW4gPSBnbG9iYWxDYWNoZS5EQlR3aW5zW29uZVR3aW5JRF1cclxuICAgICAgICAgICAgdmFyIHRoZUluZGV4PWNoZWNrVHdpbnNNb2RlbEFyci5pbmRleE9mKG9uZURCVHdpbltcIm1vZGVsSURcIl0pXHJcbiAgICAgICAgICAgIGlmKHRoZUluZGV4IT0tMSkgbnVtYmVyT2ZUd2lucysrXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBkaWFsb2dTdHIrPVwiIChUaGVyZSB3aWxsIGJlIFwiKygobnVtYmVyT2ZUd2lucz4xKT8obnVtYmVyT2ZUd2lucytcIiB0d2luc1wiKToobnVtYmVyT2ZUd2lucytcIiB0d2luXCIpICkgKyBcIiBiZWluZyBpbXBhY3RlZClcIlxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtRGVsZXRlTW9kZWwobW9kZWxJRCkgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiLHtcIm1hcmdpblRvcFwiOjB9KSBcclxuICAgIHZhciBlZGl0YWJsZVByb3BlcnRpZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiRWRpdGFibGUgUHJvcGVydGllcyBBbmQgUmVsYXRpb25zaGlwc1wiKVxyXG4gICAgdmFyIGJhc2VDbGFzc2VzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkJhc2UgQ2xhc3Nlc1wiKVxyXG4gICAgdmFyIG9yaWdpbmFsRGVmaW5pdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJPcmlnaW5hbCBEZWZpbml0aW9uXCIpXHJcblxyXG4gICAgdmFyIHN0cj1KU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSxudWxsLDIpXHJcbiAgICBvcmlnaW5hbERlZmluaXRpb25ET00uYXBwZW5kKCQoJzxwcmUgaWQ9XCJqc29uXCI+JytzdHIrJzwvcHJlPicpKVxyXG5cclxuICAgIHZhciBlZGl0dGFibGVQcm9wZXJ0aWVzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyhlZGl0dGFibGVQcm9wZXJ0aWVzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdGhpcy5maWxsUmVsYXRpb25zaGlwSW5mbyh2YWxpZFJlbGF0aW9uc2hpcHMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbFZpc3VhbGl6YXRpb24obW9kZWxJRCxWaXN1YWxpemF0aW9uRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbEJhc2VDbGFzc2VzKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5hbGxCYXNlQ2xhc3NlcyxiYXNlQ2xhc3Nlc0RPTSkgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuY29uZmlybURlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCkgPT4ge1xyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZShnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW2VhY2hEZWxldGVkTW9kZWxJRF0pXHJcbiAgICAgICAgLy9UT0RPOiBjbGVhciB0aGUgdmlzdWFsaXphdGlvbiBzZXR0aW5nIG9mIHRoaXMgZGVsZXRlZCBtb2RlbCwgYnV0IGlmIGl0IGlzIHJlcGxhY2UsIHNob3VsZCBub3QsIHNvIEkgY29tbWVudCBvdXQgZmlyc3RcclxuICAgICAgICAvKlxyXG4gICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxJRF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFttb2RlbElEXVxyXG4gICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB9Ki9cclxuICAgIH1cclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCJ9KVxyXG4gICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIH1cclxuXHJcbiAgICAvL2V2ZW4gbm90IGNvbXBsZXRlbHkgc3VjY2Vzc2Z1bCBkZWxldGluZywgaXQgd2lsbCBzdGlsbCBpbnZva2UgY29tcGxldGVGdW5jXHJcbiAgICBtb2RlbEFuYWx5emVyLmRlbGV0ZU1vZGVsKG1vZGVsSUQsZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUsY29tcGxldGVGdW5jLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YUltZy5hdHRyKCdzcmMnLHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgdGhpcy5hdmFydGFJbWc9YXZhcnRhSW1nO1xyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQpXHJcblxyXG4gICAgaWYodGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3Mpe1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG1vZGVsSnNvbi52YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydCxpbmQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluZWRDb2xvcj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZENvbG9yMj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZFNoYXBlPW51bGxcclxuICAgIHZhciBkZWZpbmVkRGltZW5zaW9uUmF0aW89bnVsbFxyXG4gICAgdmFyIGRlZmluZWRFZGdlV2lkdGg9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2Vjb25kQ29sb3IpIGRlZmluZWRDb2xvcjI9dmlzdWFsSnNvblttb2RlbElEXS5zZWNvbmRDb2xvclxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgZGVmaW5lZFNoYXBlPXZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGVcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pIGRlZmluZWREaW1lbnNpb25SYXRpbz12aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB7XHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yKSBkZWZpbmVkQ29sb3IgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yXHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlKSBkZWZpbmVkU2hhcGUgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlXHJcbiAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoKSBkZWZpbmVkRWRnZVdpZHRoPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjcmVhdGVBQ29sb3JTZWxlY3Rvcj0ocHJlZGVmaW5lZENvbG9yLG5hbWVPZkNvbG9yRmllbGQpPT57XHJcbiAgICAgICAgdmFyIGNvbG9yU2VsZWN0b3I9JCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjc1cHhcIj48L3NlbGVjdD4nKVxyXG4gICAgICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29sb3JTZWxlY3RvcilcclxuXHJcbiAgICAgICAgdmFyIGNvbG9yQXJyPVtcImRhcmtHcmF5XCIsXCJCbGFja1wiLFwiTGlnaHRHcmF5XCIsXCJSZWRcIixcIkdyZWVuXCIsXCJCbHVlXCIsXCJCaXNxdWVcIixcIkJyb3duXCIsXCJDb3JhbFwiLFwiQ3JpbXNvblwiLFwiRG9kZ2VyQmx1ZVwiLFwiR29sZFwiXVxyXG4gICAgICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdcIitvbmVDb2xvckNvZGUrXCInPlwiK29uZUNvbG9yQ29kZStcIuKWpzwvb3B0aW9uPlwiKVxyXG4gICAgICAgICAgICBjb2xvclNlbGVjdG9yLmFwcGVuZChhbk9wdGlvbilcclxuICAgICAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdub25lJz5ub25lPC9vcHRpb24+XCIpXHJcbiAgICAgICAgICAgIGFuT3B0aW9uLmNzcyhcImNvbG9yXCIsXCJkYXJrR3JheVwiKVxyXG4gICAgICAgICAgICBjb2xvclNlbGVjdG9yLmFwcGVuZChhbk9wdGlvbilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKG5hbWVPZkNvbG9yRmllbGQ9PVwic2Vjb25kQ29sb3JcIil7XHJcbiAgICAgICAgICAgIGlmKHByZWRlZmluZWRDb2xvcj09bnVsbCkgcHJlZGVmaW5lZENvbG9yPVwibm9uZVwiXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKHByZWRlZmluZWRDb2xvcj09bnVsbCkgcHJlZGVmaW5lZENvbG9yPVwiZGFya0dyYXlcIlxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwocHJlZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGlmKHByZWRlZmluZWRDb2xvciE9XCJub25lXCIpIHtcclxuICAgICAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLHByZWRlZmluZWRDb2xvcilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLFwiZGFya0dyYXlcIilcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICAgICAgdmFyIHNlbGVjdENvbG9yQ29kZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgICAgIGlmKHNlbGVjdENvbG9yQ29kZT09XCJub25lXCIpIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixcImRhcmtHcmF5XCIpXHJcbiAgICAgICAgICAgIGVsc2UgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLHNlbGVjdENvbG9yQ29kZSlcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsXHJcbiAgICBcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWYoc2VsZWN0Q29sb3JDb2RlPT1cIm5vbmVcIiAmJiBuYW1lT2ZDb2xvckZpZWxkPT1cInNlY29uZENvbG9yXCIpIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdW1wic2Vjb25kQ29sb3JcIl1cclxuICAgICAgICAgICAgICAgIGVsc2UgdmlzdWFsSnNvblttb2RlbElEXVtuYW1lT2ZDb2xvckZpZWxkXT1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRFxyXG4gICAgICAgICAgICAgICAgICAgICxcImNvbG9yXCI6dmlzdWFsSnNvblttb2RlbElEXVtcImNvbG9yXCJdLFwic2Vjb25kQ29sb3JcIjp2aXN1YWxKc29uW21vZGVsSURdW1wic2Vjb25kQ29sb3JcIl0gfSlcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlQUNvbG9yU2VsZWN0b3IoZGVmaW5lZENvbG9yLFwiY29sb3JcIilcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCkgY3JlYXRlQUNvbG9yU2VsZWN0b3IoZGVmaW5lZENvbG9yMixcInNlY29uZENvbG9yXCIpXHJcblxyXG5cclxuICAgIHZhciBzaGFwZVNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lXCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2hhcGVTZWxlY3RvcilcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2VsbGlwc2UnPuKXrzwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0ncm91bmQtcmVjdGFuZ2xlJyBzdHlsZT0nZm9udC1zaXplOjEyMCUnPuKWojwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0naGV4YWdvbicgc3R5bGU9J2ZvbnQtc2l6ZToxMzAlJz7irKE8L29wdGlvbj5cIikpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nc29saWQnPuKGkjwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZG90dGVkJz7ih6I8L29wdGlvbj5cIikpXHJcbiAgICB9XHJcbiAgICBpZihkZWZpbmVkU2hhcGUhPW51bGwpIHtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLnZhbChkZWZpbmVkU2hhcGUpXHJcbiAgICB9XHJcbiAgICBzaGFwZVNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RTaGFwZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxcclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNpemVBZGp1c3RTZWxlY3RvciA9ICQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTt3aWR0aDoxMTBweFwiPjwvc2VsZWN0PicpXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgZj0wLjI7Zjw9MztmKz0wLjQpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmRldGFpbFxyXG5cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW89Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImRpbWVuc2lvblJhdGlvXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGg9Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJlZGdlV2lkdGhcIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2F2ZVZpc3VhbERlZmluaXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLCBcIlBPU1RcIiwge1widmlzdWFsRGVmaW5pdGlvbkpzb25cIjpKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWwpfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmVsYXRpb25zaGlwSW5mbz1mdW5jdGlvbih2YWxpZFJlbGF0aW9uc2hpcHMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG4gICAgICAgIHZhciBsYWJlbD0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICBsYWJlbC50ZXh0KFwiUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbClcclxuICAgICAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS50YXJnZXQpe1xyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWwgY2xhc3M9J3czLWxpbWUnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KVxyXG4gICAgICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2xhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUsb3B0aW9ucyl7XHJcbiAgICBvcHRpb25zPW9wdGlvbnN8fHt9XHJcbiAgICB2YXIgc2VjdGlvbj0gbmV3IHNpbXBsZUV4cGFuZGFibGVTZWN0aW9uKHBhcnROYW1lLHRoaXMucGFuZWxDYXJkLG9wdGlvbnMpXHJcbiAgICBzZWN0aW9uLmV4cGFuZCgpXHJcbiAgICByZXR1cm4gc2VjdGlvbi5saXN0RE9NO1xyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICAvLyBmaWxlcyBpcyBhIEZpbGVMaXN0IG9mIEZpbGUgb2JqZWN0cy4gTGlzdCBzb21lIHByb3BlcnRpZXMuXHJcbiAgICB2YXIgZmlsZUNvbnRlbnRBcnI9W11cclxuICAgIGZvciAodmFyIGkgPSAwO2k8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGY9ZmlsZXNbaV1cclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9ICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9YXN5bmMgZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzPWF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoUHJvamVjdE1vZGVsc0RhdGFcIixcIlBPU1RcIixudWxsLFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlUHJvamVjdE1vZGVsc0RhdGEocmVzLkRCTW9kZWxzLHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKHJlcy5hZHRNb2RlbHMpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgaWYoJC5pc0VtcHR5T2JqZWN0KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykpe1xyXG4gICAgICAgIHZhciB6ZXJvTW9kZWxJdGVtPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZTowLjllbVwiPnplcm8gbW9kZWwgcmVjb3JkLiBQbGVhc2UgaW1wb3J0Li4uPC9saT4nKVxyXG4gICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgIHplcm9Nb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnRyZWUgPSBuZXcgc2ltcGxlVHJlZSh0aGlzLm1vZGVsTGlzdCwge1xyXG4gICAgICAgICAgICBcImxlYWZOYW1lUHJvcGVydHlcIjogXCJkaXNwbGF5TmFtZVwiXHJcbiAgICAgICAgICAgICwgXCJub011bHRpcGxlU2VsZWN0QWxsb3dlZFwiOiB0cnVlLCBcImhpZGVFbXB0eUdyb3VwXCI6IHRydWVcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jID0gKGxuKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBtb2RlbENsYXNzID0gbG4ubGVhZkluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgdmFyIGRiTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsQ2xhc3MpXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZSA9IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWxbbW9kZWxDbGFzc10pIHtcclxuICAgICAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl0uZGV0YWlsW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgICAgIHZhciBzZWNvbmRDb2xvciA9IHZpc3VhbEpzb24uc2Vjb25kQ29sb3JcclxuICAgICAgICAgICAgICAgIHZhciBzaGFwZSA9IHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZSc+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgIGlmKGRiTW9kZWxJbmZvLmlzSW9URGV2aWNlTW9kZWwpe1xyXG4gICAgICAgICAgICAgICAgdmFyIGlvdERpdj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7cmlnaHQ6LTVweDtwYWRkaW5nOjBweCAycHg7dG9wOi05cHg7Ym9yZGVyLXJhZGl1czogM3B4O2ZvbnQtc2l6ZTo3cHgnPklvVDwvZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoaW90RGl2KVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgdmFyIGltZ1NyYz1lbmNvZGVVUklDb21wb25lbnQoZ2xvYmFsQ2FjaGUuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlLHNlY29uZENvbG9yKSlcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzID0gKG5vZGVzQXJyLCBtb3VzZUNsaWNrRGV0YWlsKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0aGVOb2RlID0gbm9kZXNBcnJbMF1cclxuICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJAaWRcIl0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdCA9IHt9XHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIGdyb3VwTmFtZUxpc3RbdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKV0gPSAxXHJcbiAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyID0gT2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICBtb2RlbGdyb3VwU29ydEFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lID0+IHtcclxuICAgICAgICAgICAgdmFyIGduPXRoaXMudHJlZS5hZGRHcm91cE5vZGUoeyBkaXNwbGF5TmFtZTogb25lR3JvdXBOYW1lIH0pXHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIHtcclxuICAgICAgICAgICAgdmFyIGduID0gdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGduLCBKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5zb3J0QWxsTGVhdmVzKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoc2hvdWxkQnJvYWRjYXN0KSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUubW9kZWxOYW1lVG9Hcm91cE5hbWU9ZnVuY3Rpb24obW9kZWxOYW1lKXtcclxuICAgIHZhciBuYW1lUGFydHM9bW9kZWxOYW1lLnNwbGl0KFwiOlwiKVxyXG4gICAgaWYobmFtZVBhcnRzLmxlbmd0aD49MikgIHJldHVybiBuYW1lUGFydHNbMV1cclxuICAgIGVsc2UgcmV0dXJuIFwiT3RoZXJzXCJcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxFZGl0ZWRcIikgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRjYXN0XCIpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbE1hbmFnZXJEaWFsb2coKTsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuXHJcbmZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxOTVweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj5Mb2cgb3V0PC9hPjwvZGl2PicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+4piwPC9hPicpXHJcbiAgICBcclxuICAgIHRoaXMubW9kdWxlc1N3aXRjaEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PnsgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKSB9KVxyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbignOmZpcnN0Jykub24oXCJjbGlja1wiLCgpPT57dGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpfSlcclxuICAgIFxyXG4gICAgdmFyIGFsbE1vZGV1bHM9dGhpcy5tb2R1bGVzU2lkZWJhci5jaGlsZHJlbihcImFcIilcclxuICAgICQoYWxsTW9kZXVsc1swXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkZXZpY2VtYW5hZ2VtZW50Lmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbiAgICAkKGFsbE1vZGV1bHNbMV0pLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKFwiZGlnaXRhbHR3aW5tb2R1bGUuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1syXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJldmVudGxvZ21vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzNdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBjb25zdCBsb2dvdXRSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBwb3N0TG9nb3V0UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFxyXG4gICAgICAgICAgICBtYWluV2luZG93UmVkaXJlY3RVcmk6IGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpXHJcbiAgICAgICAgfTtcclxuICAgICAgICB2YXIgbXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbiAgICAgICAgbXlNU0FMT2JqLmxvZ291dFBvcHVwKGxvZ291dFJlcXVlc3QpO1xyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kdWxlU3dpdGNoRGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbmV3VHdpbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24odHdpbkluZm8pIHtcclxuICAgIHRoaXMub3JpZ2luYWxUd2luSW5mbz1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHR3aW5JbmZvKSlcclxuICAgIHRoaXMudHdpbkluZm89dHdpbkluZm9cclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjUyMHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1idXR0b24gdzMtY2FyZCB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BZGQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4geyB0aGlzLmFkZE5ld1R3aW4oKSB9KVxyXG4gICAgXHJcbiAgICB2YXIgYWRkQW5kQ2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlO21hcmdpbi1sZWZ0OjVweFwiPkFkZCAmIENsb3NlPC9idXR0b24+JykgICAgXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChhZGRBbmRDbG9zZUJ1dHRvbilcclxuICAgIGFkZEFuZENsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge3RoaXMuYWRkTmV3VHdpbihcIkNsb3NlRGlhbG9nXCIpfSlcclxuICAgICAgICBcclxuICAgIHZhciBJRExhYmxlRGl2PSAkKFwiPGRpdiBjbGFzcz0ndzMtcGFkZGluZycgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlR3aW4gSUQ8L2Rpdj5cIilcclxuICAgIHZhciBJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O3dpZHRoOjE1MHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwiSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB0aGlzLklESW5wdXQ9SURJbnB1dCBcclxuICAgIHZhciBtb2RlbElEPXR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgbW9kZWxMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Nb2RlbDwvZGl2PlwiKVxyXG4gICAgdmFyIG1vZGVsSW5wdXQ9JCgnPGxhYmVsIHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJtYXJnaW46OHB4IDA7cGFkZGluZzoycHg7ZGlzcGxheTppbmxpbmVcIi8+JykudGV4dChtb2RlbElEKTsgIFxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKFwiPGRpdi8+XCIpLmFwcGVuZChJRExhYmxlRGl2LElESW5wdXQpKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKFwiPGRpdiBzdHlsZT0ncGFkZGluZzo4cHggMHB4Jy8+XCIpLmFwcGVuZChtb2RlbExhYmxlRGl2LG1vZGVsSW5wdXQpKVxyXG4gICAgSURJbnB1dC5jaGFuZ2UoKGUpPT57XHJcbiAgICAgICAgdGhpcy50d2luSW5mb1tcIiRkdElkXCJdPSQoZS50YXJnZXQpLnZhbCgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBkaWFsb2dET009JCgnPGRpdiAvPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGRpYWxvZ0RPTSkgICAgXHJcbiAgICB2YXIgdGl0bGVUYWJsZT0kKCc8dGFibGUgc3R5bGU9XCJ3aWR0aDoxMDAlXCIgY2VsbHNwYWNpbmc9XCIwcHhcIiBjZWxscGFkZGluZz1cIjBweFwiPjwvdGFibGU+JylcclxuICAgIHRpdGxlVGFibGUuYXBwZW5kKCQoJzx0cj48dGQgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+UHJvcGVydGllcyBUcmVlPC90ZD48L3RyPicpKVxyXG4gICAgZGlhbG9nRE9NLmFwcGVuZCgkKFwiPGRpdiBjbGFzcz0ndzMtY29udGFpbmVyJy8+XCIpLmFwcGVuZCh0aXRsZVRhYmxlKSlcclxuXHJcbiAgICB2YXIgc2V0dGluZ3NEaXY9JChcIjxkaXYgY2xhc3M9J3czLWNvbnRhaW5lciB3My1ib3JkZXInIHN0eWxlPSd3aWR0aDoxMDAlO21heC1oZWlnaHQ6MzEwcHg7b3ZlcmZsb3c6YXV0byc+PC9kaXY+XCIpXHJcbiAgICB0aGlzLnNldHRpbmdzRGl2PXNldHRpbmdzRGl2XHJcbiAgICBkaWFsb2dET00uYXBwZW5kKHNldHRpbmdzRGl2KVxyXG4gICAgdGhpcy5kcmF3TW9kZWxTZXR0aW5ncygpXHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLmFkZE5ld1R3aW4gPSBhc3luYyBmdW5jdGlvbihjbG9zZURpYWxvZykge1xyXG4gICAgdmFyIG1vZGVsSUQ9dGhpcy50d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXVxyXG4gICAgdmFyIERCTW9kZWxJbmZvPWdsb2JhbENhY2hlLmdldFNpbmdsZURCTW9kZWxCeUlEKG1vZGVsSUQpXHJcblxyXG4gICAgaWYoIXRoaXMudHdpbkluZm9bXCIkZHRJZFwiXXx8dGhpcy50d2luSW5mb1tcIiRkdElkXCJdPT1cIlwiKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIG5hbWUgZm9yIHRoZSBuZXcgZGlnaXRhbCB0d2luXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGNvbXBvbmVudHNOYW1lQXJyPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5pbmNsdWRlZENvbXBvbmVudHNcclxuICAgIGNvbXBvbmVudHNOYW1lQXJyLmZvckVhY2gob25lQ29tcG9uZW50TmFtZT0+eyAvL2FkdCBzZXJ2aWNlIHJlcXVlc3RpbmcgYWxsIGNvbXBvbmVudCBhcHBlYXIgYnkgbWFuZGF0b3J5XHJcbiAgICAgICAgaWYodGhpcy50d2luSW5mb1tvbmVDb21wb25lbnROYW1lXT09bnVsbCl0aGlzLnR3aW5JbmZvW29uZUNvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgdGhpcy50d2luSW5mb1tvbmVDb21wb25lbnROYW1lXVtcIiRtZXRhZGF0YVwiXT0ge31cclxuICAgIH0pXHJcblxyXG4gICAgLy9hc2sgdGFza21hc3RlciB0byBhZGQgdGhlIHR3aW5cclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcG9zdEJvZHk9IHtcIm5ld1R3aW5Kc29uXCI6SlNPTi5zdHJpbmdpZnkodGhpcy50d2luSW5mbyl9XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi91cHNlcnREaWdpdGFsVHdpblwiLCBcIlBPU1RcIiwgcG9zdEJvZHksXCJ3aXRoUHJvamVjdElEXCIgKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG5cclxuICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKGRhdGEuREJUd2luKSAgICBcclxuICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihkYXRhLkFEVFR3aW4pXHJcblxyXG5cclxuICAgIC8vYXNrIHRhc2ttYXN0ZXIgdG8gcHJvdmlzaW9uIHRoZSB0d2luIHRvIGlvdCBodWIgaWYgdGhlIG1vZGVsIGlzIGEgaW90IGRldmljZSBtb2RlbFxyXG4gICAgaWYoREJNb2RlbEluZm8uaXNJb1REZXZpY2VNb2RlbCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcG9zdEJvZHk9IHtcIkRCVHdpblwiOmRhdGEuREJUd2luLFwiZGVzaXJlZEluRGV2aWNlVHdpblwiOnt9fVxyXG4gICAgICAgICAgICBEQk1vZGVsSW5mby5kZXNpcmVkUHJvcGVydGllcy5mb3JFYWNoKGVsZT0+e1xyXG4gICAgICAgICAgICAgICAgdmFyIHByb3BlcnR5TmFtZT1lbGUucGF0aFtlbGUucGF0aC5sZW5ndGgtMV1cclxuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eVNhbXBsZVY9IFwiXCJcclxuICAgICAgICAgICAgICAgIHBvc3RCb2R5LmRlc2lyZWRJbkRldmljZVR3aW5bcHJvcGVydHlOYW1lXT1wcm9wZXJ0eVNhbXBsZVZcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdmFyIHByb3Zpc2lvbmVkRG9jdW1lbnQgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkZXZpY2VtYW5hZ2VtZW50L3Byb3Zpc2lvbklvVERldmljZVR3aW5cIiwgXCJQT1NUXCIsIHBvc3RCb2R5LFwid2l0aFByb2plY3RJRFwiIClcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgZGF0YS5EQlR3aW49cHJvdmlzaW9uZWREb2N1bWVudFxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKHByb3Zpc2lvbmVkRG9jdW1lbnQpICAgXHJcbiAgICB9XHJcblxyXG4gICAgLy9pdCBzaG91bGQgc2VsZWN0IHRoZSBuZXcgbm9kZSBpbiB0aGUgdHJlZSwgYW5kIG1vdmUgdG9wb2xvZ3kgdmlldyB0byBzaG93IHRoZSBuZXcgbm9kZSAobm90ZSBwYW4gdG8gYSBwbGFjZSB0aGF0IGlzIG5vdCBibG9ja2VkIGJ5IHRoZSBkaWFsb2cgaXRzZWxmKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpblwiLCBcInR3aW5JbmZvXCI6IGRhdGEuQURUVHdpbiwgXCJEQlR3aW5JbmZvXCI6ZGF0YS5EQlR3aW59KVxyXG5cclxuICAgIGlmKGNsb3NlRGlhbG9nKXRoaXMuRE9NLmhpZGUoKVxyXG4gICAgZWxzZXtcclxuICAgICAgICAvL2NsZWFyIHRoZSBpbnB1dCBlZGl0Ym94XHJcbiAgICAgICAgdGhpcy5wb3B1cCh0aGlzLm9yaWdpbmFsVHdpbkluZm8pXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLmRyYXdNb2RlbFNldHRpbmdzID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgbW9kZWxJRD10aGlzLnR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgbW9kZWxEZXRhaWw9IG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgdmFyIGNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtb2RlbERldGFpbC5lZGl0YWJsZVByb3BlcnRpZXMpKVxyXG4gICAgXHJcbiAgICBpZigkLmlzRW1wdHlPYmplY3QoY29weU1vZGVsRWRpdGFibGVQcm9wZXJ0eSkpe1xyXG4gICAgICAgIHRoaXMuc2V0dGluZ3NEaXYudGV4dChcIlRoZXJlIGlzIG5vIGVkaXRhYmxlIHByb3BlcnR5XCIpXHJcbiAgICAgICAgdGhpcy5zZXR0aW5nc0Rpdi5hZGRDbGFzcyhcInczLXRleHQtZ3JheVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH0gICBcclxuXHJcbiAgICB2YXIgc2V0dGluZ3NUYWJsZT0kKCc8dGFibGUgc3R5bGU9XCJ3aWR0aDoxMDAlXCIgY2VsbHNwYWNpbmc9XCIwcHhcIiBjZWxscGFkZGluZz1cIjBweFwiPjwvdGFibGU+JylcclxuICAgIHRoaXMuc2V0dGluZ3NEaXYuYXBwZW5kKHNldHRpbmdzVGFibGUpXHJcblxyXG4gICAgdmFyIGluaXRpYWxQYXRoQXJyPVtdXHJcbiAgICB2YXIgbGFzdFJvb3ROb2RlUmVjb3JkPVtdXHJcbiAgICB0aGlzLmRyYXdFZGl0YWJsZShzZXR0aW5nc1RhYmxlLGNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHksaW5pdGlhbFBhdGhBcnIsbGFzdFJvb3ROb2RlUmVjb3JkKVxyXG59XHJcblxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd0VkaXRhYmxlID0gYXN5bmMgZnVuY3Rpb24ocGFyZW50VGFibGUsanNvbkluZm8scGF0aEFycixsYXN0Um9vdE5vZGVSZWNvcmQpIHtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbykgYXJyLnB1c2goaW5kKVxyXG5cclxuICAgIGZvcih2YXIgdGhlSW5kZXg9MDt0aGVJbmRleDxhcnIubGVuZ3RoO3RoZUluZGV4Kyspe1xyXG4gICAgICAgIGlmKHRoZUluZGV4PT1hcnIubGVuZ3RoLTEpIGxhc3RSb290Tm9kZVJlY29yZFtwYXRoQXJyLmxlbmd0aF0gPXRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGluZCA9IGFyclt0aGVJbmRleF1cclxuICAgICAgICB2YXIgdHI9JChcIjx0ci8+XCIpXHJcbiAgICAgICAgdmFyIHJpZ2h0VEQ9JChcIjx0ZCBzdHlsZT0naGVpZ2h0OjMwcHgnLz5cIilcclxuICAgICAgICB0ci5hcHBlbmQocmlnaHRURClcclxuICAgICAgICBwYXJlbnRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBpZighbGFzdFJvb3ROb2RlUmVjb3JkW2ldKSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDIpKVxyXG4gICAgICAgICAgICBlbHNlIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoNCkpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGVJbmRleD09YXJyLmxlbmd0aC0xKSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDMpKVxyXG4gICAgICAgIGVsc2UgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdigxKSlcclxuXHJcbiAgICAgICAgdmFyIHBOYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdmbG9hdDpsZWZ0O2xpbmUtaGVpZ2h0OjI4cHg7bWFyZ2luLWxlZnQ6M3B4Jz5cIitpbmQrXCI8L2Rpdj5cIilcclxuICAgICAgICByaWdodFRELmFwcGVuZChwTmFtZURpdilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuXHJcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpIHsgLy9pdCBpcyBhIGVudW1lcmF0b3JcclxuICAgICAgICAgICAgdGhpcy5kcmF3RHJvcERvd25Cb3gocmlnaHRURCxuZXdQYXRoLGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShwYXJlbnRUYWJsZSxqc29uSW5mb1tpbmRdLG5ld1BhdGgsbGFzdFJvb3ROb2RlUmVjb3JkKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGFJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweDtwYWRkaW5nOjJweDt3aWR0aDoyMDBweDtvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmVcIiBwbGFjZWhvbGRlcj1cInR5cGU6ICcranNvbkluZm9baW5kXSsnXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgXHJcbiAgICAgICAgICAgIHJpZ2h0VEQuYXBwZW5kKGFJbnB1dClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwiZGF0YVR5cGVcIiwganNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUoJChlLnRhcmdldCkuZGF0YShcInBhdGhcIiksJChlLnRhcmdldCkudmFsKCksJChlLnRhcmdldCkuZGF0YShcImRhdGFUeXBlXCIpKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLmRyYXdEcm9wRG93bkJveD1mdW5jdGlvbihyaWdodFRELG5ld1BhdGgsdmFsdWVBcnIpe1xyXG4gICAgdmFyIGFTZWxlY3RNZW51ID0gbmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIlxyXG4gICAgICAgICwgeyB3aWR0aDogXCIyMDBcIiBcclxuICAgICAgICAgICAgLGJ1dHRvbkNTUzogeyBcInBhZGRpbmdcIjogXCI0cHggMTZweFwifVxyXG4gICAgICAgICAgICAsIFwib3B0aW9uTGlzdE1hcmdpblRvcFwiOiAyNS8vLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjoyMTBcclxuICAgICAgICAgICAgLCBcImFkanVzdFBvc2l0aW9uQW5jaG9yXCI6IHRoaXMuRE9NLm9mZnNldCgpXHJcbiAgICAgICAgfSlcclxuXHJcblxyXG4gICAgcmlnaHRURC5hcHBlbmQoYVNlbGVjdE1lbnUucm93RE9NKSAgLy91c2Ugcm93RE9NIGluc3RlYWQgb2YgRE9NIHRvIGFsbG93IHNlbGVjdCBvcHRpb24gd2luZG93IGZsb2F0IGFib3ZlIGRpYWxvZ1xyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pID0+IHtcclxuICAgICAgICB2YXIgc3RyID0gb25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gfHwgb25lT3B0aW9uW1wiZW51bVZhbHVlXCJdXHJcbiAgICAgICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKHN0cilcclxuICAgIH0pXHJcbiAgICBhU2VsZWN0TWVudS5jYWxsQmFja19jbGlja09wdGlvbiA9IChvcHRpb25UZXh0LCBvcHRpb25WYWx1ZSwgcmVhbE1vdXNlQ2xpY2spID0+IHtcclxuICAgICAgICBhU2VsZWN0TWVudS5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgaWYgKHJlYWxNb3VzZUNsaWNrKSB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiKSwgb3B0aW9uVmFsdWUsIFwic3RyaW5nXCIpXHJcbiAgICB9XHJcbn1cclxuXHJcbm5ld1R3aW5EaWFsb2cucHJvdG90eXBlLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlPWZ1bmN0aW9uKHBhdGhBcnIsbmV3VmFsLGRhdGFUeXBlKXtcclxuICAgIGlmKFtcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIl0uaW5jbHVkZXMoZGF0YVR5cGUpKSBuZXdWYWw9TnVtYmVyKG5ld1ZhbClcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSnNvbj10aGlzLnR3aW5JbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxufVxyXG5cclxubmV3VHdpbkRpYWxvZy5wcm90b3R5cGUudHJlZUxpbmVEaXYgPSBmdW5jdGlvbih0eXBlTnVtYmVyKSB7XHJcbiAgICB2YXIgcmVEaXY9JCgnPGRpdiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHg7d2lkdGg6MTVweDtoZWlnaHQ6IDEwMCU7ZmxvYXQ6IGxlZnRcIj48L2Rpdj4nKVxyXG4gICAgaWYodHlwZU51bWJlcj09MSl7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItYm90dG9tIHczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+PGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT0yKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+PGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT0zKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1ib3R0b20gdzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTQpe1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlRGl2XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG5ld1R3aW5EaWFsb2coKTsiLCJjb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcblxyXG5mdW5jdGlvbiBwcm9qZWN0U2V0dGluZ0RpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInByb2plY3RJc0NoYW5nZWRcIil7XHJcbiAgICAgICAgdGhpcy5jb250ZW50SW5pdGlhbGl6ZWQ9ZmFsc2VcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgaWYodGhpcy5jb250ZW50SW5pdGlhbGl6ZWQpcmV0dXJuO1xyXG4gICAgdGhpcy5jb250ZW50SW5pdGlhbGl6ZWQ9dHJ1ZTsgXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjQyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+U2V0dGluZzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciB0YWJDb250cm9sPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtbGlnaHQtZ3JheVwiPjwvZGl2PicpXHJcbiAgICB2YXIgbGF5b3V0QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gXCI+TGF5b3V0PC9idXR0b24+JylcclxuICAgIHZhciB2aXN1YWxTY2hlbWFCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPlZpc3VhbCBTY2hlbWE8L2J1dHRvbj4nKVxyXG4gICAgdGFiQ29udHJvbC5hcHBlbmQobGF5b3V0QnRuLHZpc3VhbFNjaGVtYUJ0bilcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0YWJDb250cm9sKVxyXG5cclxuICAgIHRoaXMubGF5b3V0Q29udGVudERpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYW5pbWF0ZS1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nOjEwcHg7ZGlzcGxheTpub25lXCI+PC9kaXY+JylcclxuICAgIHRoaXMudmlzdWFsU2NoZW1hQ29udGVudERpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYW5pbWF0ZS1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nOjEwcHg7ZGlzcGxheTpub25lXCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmxheW91dENvbnRlbnREaXYsdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2KVxyXG4gICAgdGhpcy5maWxsTGF5b3V0RGl2Q29udGVudCgpXHJcbiAgICB0aGlzLmZpbGxWaXN1YWxTY2hlbWFDb250ZW50KClcclxuXHJcbiAgICBsYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgbGF5b3V0QnRuLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxuICAgICAgICB2aXN1YWxTY2hlbWFCdG4ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG4gICAgICAgIHRoaXMudmlzdWFsU2NoZW1hQ29udGVudERpdi5oaWRlKClcclxuICAgICAgICB0aGlzLmxheW91dENvbnRlbnREaXYuc2hvdygpXHJcbiAgICB9KVxyXG5cclxuICAgIHZpc3VhbFNjaGVtYUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBsYXlvdXRCdG4ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG4gICAgICAgIHZpc3VhbFNjaGVtYUJ0bi5hZGRDbGFzcyhcInczLXdoaXRlXCIpXHJcbiAgICAgICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LnNob3coKVxyXG4gICAgICAgIHRoaXMubGF5b3V0Q29udGVudERpdi5oaWRlKClcclxuICAgIH0pXHJcblxyXG4gICAgbGF5b3V0QnRuLnRyaWdnZXIoXCJjbGlja1wiKVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuZmlsbExheW91dERpdkNvbnRlbnQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2hvd090aGVyVXNlckxheW91dENoZWNrID0gJCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiBzdHlsZT1cIndpZHRoOjIwcHg7bWFyZ2luLWxlZnQ6MTBweDttYXJnaW4tcmlnaHQ6MTBweFwiIHR5cGU9XCJjaGVja2JveFwiPicpXHJcbiAgICB2YXIgc2hvd090aGVyVXNlckxheW91dFRleHQgPSAkKCc8bGFiZWwgc3R5bGU9XCJwYWRkaW5nOjJweCA4cHg7XCI+U2hvdyBzaGFyZWQgbGF5b3V0cyBmcm9tIG90aGVyIHVzZXJzPC9sYWJlbD4nKVxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LmFwcGVuZChzaG93T3RoZXJVc2VyTGF5b3V0Q2hlY2ssIHNob3dPdGhlclVzZXJMYXlvdXRUZXh0KVxyXG4gICAgaWYodGhpcy5zaG93U2hhcmVkTGF5b3V0cykgc2hvd090aGVyVXNlckxheW91dENoZWNrLnByb3AoIFwiY2hlY2tlZFwiLCB0cnVlICk7XHJcbiAgICBzaG93T3RoZXJVc2VyTGF5b3V0Q2hlY2sub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHRoaXMuc2hvd1NoYXJlZExheW91dHM9c2hvd090aGVyVXNlckxheW91dENoZWNrLnByb3AoJ2NoZWNrZWQnKVxyXG4gICAgICAgIHRoaXMucmVmaWxsTGF5b3V0cygpXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgbGF5b3V0c0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWF4LWhlaWdodDoyMDBweDtvdmVyZmxvdy14OmhpZGRlbjtvdmVyZmxvdy15OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5sYXlvdXRDb250ZW50RGl2LmFwcGVuZChsYXlvdXRzRGl2KVxyXG4gICAgdGhpcy5sYXlvdXRzRGl2PWxheW91dHNEaXZcclxuXHJcbiAgICB0aGlzLnJlZmlsbExheW91dHMoKVxyXG59XHJcblxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxTY2hlbWFDb250ZW50PSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sgPSAkKCc8aW5wdXQgY2xhc3M9XCJ3My1jaGVja1wiIHN0eWxlPVwid2lkdGg6MjBweDttYXJnaW4tbGVmdDoxMHB4O21hcmdpbi1yaWdodDoxMHB4XCIgdHlwZT1cImNoZWNrYm94XCI+JylcclxuICAgIHZhciBzaGFyZVNlbGZWaXN1YWxTY2hlbWFUZXh0ID0gJCgnPGxhYmVsIHN0eWxlPVwicGFkZGluZzoycHggOHB4O1wiPlNoYXJlIG15IG93biB2aXN1YWwgbGVnZW5kPC9sYWJlbD4nKVxyXG4gICAgdGhpcy52aXN1YWxTY2hlbWFDb250ZW50RGl2LmFwcGVuZChzaGFyZVNlbGZWaXN1YWxTY2hlbWFDaGVjaywgc2hhcmVTZWxmVmlzdWFsU2NoZW1hVGV4dClcclxuXHJcbiAgICBpZihnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5pc1NoYXJlZCkgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sucHJvcCggXCJjaGVja2VkXCIsIHRydWUgKTtcclxuICAgIFxyXG4gICAgc2hhcmVTZWxmVmlzdWFsU2NoZW1hQ2hlY2sub24oXCJjaGFuZ2VcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdLmlzU2hhcmVkPXNoYXJlU2VsZlZpc3VhbFNjaGVtYUNoZWNrLnByb3AoJ2NoZWNrZWQnKVxyXG5cclxuICAgICAgICB2YXIgdmlzdWFsU2NoZW1hTmFtZSA9IFwiZGVmYXVsdFwiIC8vZml4ZWQgaW4gY3VycmVudCB2ZXJzaW9uLCB0aGVyZSBpcyBvbmx5IFwiZGVmYXVsdFwiIHNjaGVtYSBmb3IgZWFjaCB1c2VyXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2V0VmlzdWFsU2NoZW1hU2hhcmVkRmxhZ1wiLCBcIlBPU1RcIiwgeyBcInZpc3VhbFNjaGVtYVwiOiB2aXN1YWxTY2hlbWFOYW1lLCBcImlzU2hhcmVkXCI6IHNoYXJlU2VsZlZpc3VhbFNjaGVtYUNoZWNrLnByb3AoJ2NoZWNrZWQnKSB9LCBcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmIChlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgdmlzdWFsU2NoZW1hRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXgtaGVpZ2h0OjIwMHB4O292ZXJmbG93LXg6aGlkZGVuO292ZXJmbG93LXk6YXV0b1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLnZpc3VhbFNjaGVtYUNvbnRlbnREaXYuYXBwZW5kKHZpc3VhbFNjaGVtYURpdilcclxuICAgIHRoaXMudmlzdWFsU2NoZW1hRGl2PXZpc3VhbFNjaGVtYURpdlxyXG5cclxuICAgIHRoaXMucmVmaWxsVmlzdWFsU2NoZW1hcygpXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5yZWZpbGxWaXN1YWxTY2hlbWFzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnZpc3VhbFNjaGVtYURpdi5lbXB0eSgpXHJcbiAgICB2YXIgc2VsZlNjaGVtYVxyXG4gICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb24pIHtcclxuICAgICAgICB2YXIgb25lU2NoZW1hPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25baW5kXVxyXG4gICAgICAgIGlmKG9uZVNjaGVtYS5vd25lciE9bnVsbCAmJiBvbmVTY2hlbWEub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkKSB0aGlzLmFkZE9uZVZpc3VhbFNjaGVtYShvbmVTY2hlbWEsdGhpcy52aXN1YWxTY2hlbWFEaXYpXHJcbiAgICAgICAgZWxzZSBzZWxmU2NoZW1hPW9uZVNjaGVtYVxyXG4gICAgfVxyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxTY2hlbWEoc2VsZlNjaGVtYSx0aGlzLnZpc3VhbFNjaGVtYURpdilcclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmFkZE9uZVZpc3VhbFNjaGVtYT1mdW5jdGlvbihvbmVTY2hlbWFPYmoscGFyZW50RGl2KXtcclxuICAgIHZhciBvd25lcj0gb25lU2NoZW1hT2JqLm93bmVyIHx8IGdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkXHJcbiAgICBcclxuICAgIHZhciBvbmVTY2hlbWFSb3c9JCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhciB3My1idXR0b24gdzMtYm9yZGVyLWJvdHRvbVwiPjwvYT4nKVxyXG4gICAgcGFyZW50RGl2LmFwcGVuZChvbmVTY2hlbWFSb3cpXHJcbiAgICB2YXIgbGJsU3RyPShvd25lcj09Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpP1wiU2VsZlwiOlwiU2hhcmVkIGJ5IFwiK293bmVyXHJcbiAgICAvL3ZhciBuYW1lTGJsPSQoJzxhIHN0eWxlPVwidGV4dC1hbGlnbjpsZWZ0O2NvbG9yOmdyZXk7bWFyZ2luOjVweCAwcHg7ZGlzcGxheTpibG9ja1wiPicrbGJsU3RyKyc8L2E+JylcclxuICAgIHZhciB0aXRsZVJvdz0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyIHczLXRleHQtZ3JleVwiICA+PC9hPicpXHJcbiAgICBvbmVTY2hlbWFSb3cuYXBwZW5kKHRpdGxlUm93KVxyXG4gICAgdmFyIG5hbWVMYmw9JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiA+JytsYmxTdHIrJzwvYT4nKVxyXG4gICAgdmFyIGNvcHlCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHQgdzMtbGltZSB3My1ob3Zlci1hbWJlclwiPkNvcHk8L2J1dHRvbj4nKVxyXG4gICAgdGl0bGVSb3cuYXBwZW5kKG5hbWVMYmwpXHJcbiAgICBpZihvd25lciE9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpIHRpdGxlUm93LmFwcGVuZChjb3B5QnRuKVxyXG5cclxuICAgIHZhciBkZXRhaWw9b25lU2NoZW1hT2JqLmRldGFpbFxyXG5cclxuICAgIGNvcHlCdG4ub24oXCJjbGlja1wiLCBhc3luYyAoKT0+e1xyXG4gICAgICAgIC8vcmVwbGFjZSBzZWxmIHZpc3VhbCBzY2hlbWFcclxuICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXS5kZXRhaWw9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkZXRhaWwpKVxyXG4gICAgICAgIHRoaXMucmVmaWxsVmlzdWFsU2NoZW1hcygpXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLCBcIlBPU1RcIiwge1widmlzdWFsRGVmaW5pdGlvbkpzb25cIjpKU09OLnN0cmluZ2lmeShkZXRhaWwpfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiBkZXRhaWwpe1xyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPWRldGFpbFttb2RlbElEXVxyXG4gICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbiA9IDIwO1xyXG4gICAgICAgIHZhciBjb2xvckNvZGUgPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgIHZhciBzZWNvbmRDb2xvcj12aXN1YWxKc29uLnNlY29uZENvbG9yXHJcbiAgICAgICAgdmFyIHNoYXBlID0gdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgIGlmICh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24gKj0gcGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIHZhciBpY29uRE9NID0gJChcIjxkaXYgc3R5bGU9J3dpZHRoOlwiICsgZGltZW5zaW9uICsgXCJweDtoZWlnaHQ6XCIgKyBkaW1lbnNpb24gKyBcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgIHZhciBpbWdTcmMgPSBlbmNvZGVVUklDb21wb25lbnQoZ2xvYmFsQ2FjaGUuc2hhcGVTdmcoc2hhcGUsIGNvbG9yQ29kZSxzZWNvbmRDb2xvcikpXHJcbiAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIGltZ1NyYyArIFwiJz48L2ltZz5cIikpXHJcbiAgICAgICAgaWYgKGF2YXJ0YSkge1xyXG4gICAgICAgICAgICB2YXIgYXZhcnRhaW1nID0gJChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiICsgYXZhcnRhICsgXCInPjwvaW1nPlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9uZVNjaGVtYVJvdy5hcHBlbmQoaWNvbkRPTSlcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5yZWZpbGxMYXlvdXRzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxheW91dHNEaXYuZW1wdHkoKVxyXG4gICAgdmFyIHByb2plY3RJbmZvPWdsb2JhbENhY2hlLmZpbmRQcm9qZWN0SW5mbyhnbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEKVxyXG4gICAgdmFyIGRlZmF1bHRMYXlvdXROYW1lPXByb2plY3RJbmZvLmRlZmF1bHRMYXlvdXRcclxuXHJcbiAgICBpZih0aGlzLnNob3dTaGFyZWRMYXlvdXRzKXtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikge1xyXG4gICAgICAgICAgICB2YXIgb25lTGF5b3V0T2JqPWdsb2JhbENhY2hlLmxheW91dEpTT05baW5kXVxyXG4gICAgICAgICAgICBpZihvbmVMYXlvdXRPYmoub3duZXIhPWdsb2JhbENhY2hlLmFjY291bnRJbmZvLmlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE9uZUxheW91dEJhcihvbmVMYXlvdXRPYmosdGhpcy5sYXlvdXRzRGl2LGRlZmF1bHRMYXlvdXROYW1lKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pIHtcclxuICAgICAgICB2YXIgb25lTGF5b3V0T2JqPWdsb2JhbENhY2hlLmxheW91dEpTT05baW5kXVxyXG4gICAgICAgIGlmKG9uZUxheW91dE9iai5vd25lciE9Z2xvYmFsQ2FjaGUuYWNjb3VudEluZm8uaWQpIGNvbnRpbnVlXHJcbiAgICAgICAgdGhpcy5hZGRPbmVMYXlvdXRCYXIob25lTGF5b3V0T2JqLHRoaXMubGF5b3V0c0RpdixkZWZhdWx0TGF5b3V0TmFtZSlcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuYWRkT25lTGF5b3V0QmFyPWZ1bmN0aW9uKG9uZUxheW91dE9iaixwYXJlbnREaXYsZGVmYXVsdExheW91dE5hbWUpe1xyXG4gICAgdmFyIGxheW91dE5hbWUgPSBvbmVMYXlvdXRPYmoubmFtZVxyXG4gICAgdmFyIHNoYXJlZEZsYWcgPSBvbmVMYXlvdXRPYmouaXNTaGFyZWRcclxuXHJcbiAgICB2YXIgc2VsZkxheW91dD0ob25lTGF5b3V0T2JqLm93bmVyPT1nbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZClcclxuXHJcbiAgICB2YXIgb25lTGF5b3V0PSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXIgdzMtYnV0dG9uIHczLWJvcmRlci1ib3R0b21cIj48L2E+JylcclxuICAgIHBhcmVudERpdi5hcHBlbmQob25lTGF5b3V0KVxyXG5cclxuICAgIHZhciBuYW1lTGJsPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj4nK2xheW91dE5hbWUrJzwvYT4nKVxyXG4gICAgdmFyIGRlZmF1bHRMYmw9JChcIjxhIGNsYXNzPSd3My1iYXItaXRlbScgc3R5bGU9J2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoxcHggMnB4O21hcmdpbi10b3A6OXB4O2JvcmRlci1yYWRpdXM6IDJweDsnPjwvYT5cIilcclxuICAgIFxyXG4gICAgb25lTGF5b3V0LmRhdGEoXCJsYXlvdXRPYmpcIixvbmVMYXlvdXRPYmopXHJcblxyXG4gICAgb25lTGF5b3V0LmRhdGEoXCJkZWZhdWx0TGJsXCIsZGVmYXVsdExibClcclxuICAgIG9uZUxheW91dC5hcHBlbmQobmFtZUxibCxkZWZhdWx0TGJsKVxyXG5cclxuICAgIGlmKGxheW91dE5hbWUhPWRlZmF1bHRMYXlvdXROYW1lKSB0aGlzLnNob3dBc05vdERlZmF1bHRMYXlvdXRMYmwob25lTGF5b3V0KVxyXG4gICAgZWxzZSB0aGlzLnNob3dBc0RlZmF1bHRMYXlvdXRMYmwob25lTGF5b3V0KVxyXG5cclxuICAgIGlmKHNlbGZMYXlvdXQpe1xyXG4gICAgICAgIHZhciBzdHI9KHNoYXJlZEZsYWcpP1wiU2hhcmVkXCI6XCJTaGFyZVwiXHJcbiAgICAgICAgdmFyIHNoYXJlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0IHczLWhvdmVyLWFtYmVyXCI+JytzdHIrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgb25lTGF5b3V0LmRhdGEoXCJzaGFyZUJ0blwiLHNoYXJlQnRuKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodCB3My1ob3Zlci1hbWJlclwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgICAgICBvbmVMYXlvdXQuYXBwZW5kKHNoYXJlQnRuLGRlbGV0ZUJ0bilcclxuICAgICAgICBpZighc2hhcmVkRmxhZykgc2hhcmVCdG4uaGlkZSgpXHJcbiAgICAgICAgZGVsZXRlQnRuLmhpZGUoKVxyXG4gICAgXHJcbiAgICAgICAgb25lTGF5b3V0LmhvdmVyKCgpPT57XHJcbiAgICAgICAgICAgIG9uZUxheW91dC5kYXRhKFwiZGVmYXVsdExibFwiKS5zaG93KClcclxuICAgICAgICAgICAgdmFyIGlzU2hhcmVkPW9uZUxheW91dC5kYXRhKFwibGF5b3V0T2JqXCIpLmlzU2hhcmVkXHJcbiAgICAgICAgICAgIGlmKCFpc1NoYXJlZCkgc2hhcmVCdG4uc2hvdygpXHJcbiAgICAgICAgICAgIGRlbGV0ZUJ0bi5zaG93KClcclxuICAgICAgICB9LCgpPT57XHJcbiAgICAgICAgICAgIGlmKCFvbmVMYXlvdXQuZGF0YShcImRlZmF1bHRMYmxcIikuaGFzQ2xhc3MoXCJ3My1saW1lXCIpKSBvbmVMYXlvdXQuZGF0YShcImRlZmF1bHRMYmxcIikuaGlkZSgpXHJcbiAgICAgICAgICAgIHZhciBpc1NoYXJlZD1vbmVMYXlvdXQuZGF0YShcImxheW91dE9ialwiKS5pc1NoYXJlZFxyXG4gICAgICAgICAgICBpZighaXNTaGFyZWQpIHNoYXJlQnRuLmhpZGUoKVxyXG4gICAgICAgICAgICBkZWxldGVCdG4uaGlkZSgpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbmVMYXlvdXQub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHZhciBwcm9qZWN0SW5mbz1nbG9iYWxDYWNoZS5maW5kUHJvamVjdEluZm8oZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRClcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocHJvamVjdEluZm8uZGVmYXVsdExheW91dClcclxuICAgICAgICAgICAgaWYobGF5b3V0TmFtZSE9cHJvamVjdEluZm8uZGVmYXVsdExheW91dCkgdGhpcy5zZXRBc0RlZmF1bHRMYXlvdXQob25lTGF5b3V0KVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc2V0QXNEZWZhdWx0TGF5b3V0KClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5kZWxldGVMYXlvdXQob25lTGF5b3V0KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9KVxyXG4gICAgICAgIHNoYXJlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrU2hhcmVMYXlvdXRCdG4ob25lTGF5b3V0KVxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIG9uZUxheW91dC5hZGRDbGFzcyhcInczLWdyYXlcIixcInczLWhvdmVyLWdyYXlcIilcclxuICAgICAgICB2YXIgY29weUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtcmlwcGxlIHczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodCB3My1saW1lIHczLWhvdmVyLWFtYmVyXCI+Q29weTwvYnV0dG9uPicpXHJcbiAgICAgICAgb25lTGF5b3V0LmFwcGVuZChjb3B5QnRuKVxyXG4gICAgICAgIGNvcHlCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuY29weUxheW91dChvbmVMYXlvdXQuZGF0YShcImxheW91dE9ialwiKSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfSkgXHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuY29weUxheW91dD1hc3luYyBmdW5jdGlvbihkaWN0KXtcclxuICAgIHZhciBsYXlvdXREaWN0PWRpY3QuZGV0YWlsXHJcbiAgICBpZihsYXlvdXREaWN0W1wiZWRnZXNcIl09PW51bGwpIGxheW91dERpY3RbXCJlZGdlc1wiXT17fSAgICBcclxuICAgIHZhciBzYXZlTGF5b3V0T2JqPXtcImxheW91dHNcIjp7fX1cclxuICAgIHNhdmVMYXlvdXRPYmpbXCJsYXlvdXRzXCJdW2RpY3Qub25hbWVdPUpTT04uc3RyaW5naWZ5KGxheW91dERpY3QpICBcclxuXHJcbiAgICBnbG9iYWxDYWNoZS5yZWNvcmRTaW5nbGVMYXlvdXQobGF5b3V0RGljdCxnbG9iYWxDYWNoZS5hY2NvdW50SW5mby5pZCxkaWN0Lm9uYW1lLGZhbHNlKVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVMYXlvdXRcIiwgXCJQT1NUXCIsIHNhdmVMYXlvdXRPYmosXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgdGhpcy5yZWZpbGxMYXlvdXRzKClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxucHJvamVjdFNldHRpbmdEaWFsb2cucHJvdG90eXBlLmNsaWNrU2hhcmVMYXlvdXRCdG49YXN5bmMgZnVuY3Rpb24ob25lTGF5b3V0RE9NKXtcclxuICAgIHZhciBpc1NoYXJlZD1vbmVMYXlvdXRET00uZGF0YShcImxheW91dE9ialwiKS5pc1NoYXJlZFxyXG4gICAgdmFyIHRoZUJ0bj1vbmVMYXlvdXRET00uZGF0YShcInNoYXJlQnRuXCIpXHJcbiAgICBpc1NoYXJlZD0haXNTaGFyZWRcclxuICAgIG9uZUxheW91dERPTS5kYXRhKFwibGF5b3V0T2JqXCIpLmlzU2hhcmVkPWlzU2hhcmVkXHJcbiAgICBpZighaXNTaGFyZWQpIHRoZUJ0bi50ZXh0KFwiU2hhcmVcIilcclxuICAgIGVsc2UgdGhlQnRuLnRleHQoXCJTaGFyZWRcIilcclxuICAgIFxyXG4gICAgdmFyIGxheW91dE5hbWU9b25lTGF5b3V0RE9NLmRhdGEoXCJsYXlvdXRPYmpcIikubmFtZSBcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vc2V0TGF5b3V0U2hhcmVkRmxhZ1wiLCBcIlBPU1RcIiwge1wibGF5b3V0XCI6bGF5b3V0TmFtZSxcImlzU2hhcmVkXCI6aXNTaGFyZWQgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH0gXHJcbn1cclxuXHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0PWFzeW5jIGZ1bmN0aW9uKG9uZUxheW91dERPTSl7XHJcbiAgICB2YXIgbGF5b3V0TmFtZT1vbmVMYXlvdXRET00uZGF0YShcImxheW91dE9ialwiKS5uYW1lIFxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiQ29uZmlybSBkZWxldGluZyBsYXlvdXQgXFxcIlwiICsgbGF5b3V0TmFtZSArIFwiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dE5hbWUgPT0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uZUxheW91dERPTS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVMYXlvdXRcIiwgXCJQT1NUXCIsIHsgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUgfSxcIndpdGhQcm9qZWN0SURcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5zaG93QXNEZWZhdWx0TGF5b3V0TGJsPWFzeW5jIGZ1bmN0aW9uKG9uZUxheW91dERPTSl7XHJcbiAgICB2YXIgZGVmYXVsdExibD1vbmVMYXlvdXRET00uZGF0YShcImRlZmF1bHRMYmxcIilcclxuICAgIGRlZmF1bHRMYmwuc2hvdygpXHJcbiAgICBkZWZhdWx0TGJsLnRleHQoXCJEZWZhdWx0XCIpXHJcbiAgICBkZWZhdWx0TGJsLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG59XHJcblxyXG5wcm9qZWN0U2V0dGluZ0RpYWxvZy5wcm90b3R5cGUuc2hvd0FzTm90RGVmYXVsdExheW91dExibD1hc3luYyBmdW5jdGlvbihvbmVMYXlvdXRET00pe1xyXG4gICAgdmFyIGRlZmF1bHRMYmw9b25lTGF5b3V0RE9NLmRhdGEoXCJkZWZhdWx0TGJsXCIpXHJcbiAgICBkZWZhdWx0TGJsLmhpZGUoKVxyXG4gICAgZGVmYXVsdExibC50ZXh0KFwiU2V0IEFzIERlZmF1bHRcIilcclxuICAgIGRlZmF1bHRMYmwucmVtb3ZlQ2xhc3MoXCJ3My1saW1lXCIpXHJcbn1cclxuXHJcbnByb2plY3RTZXR0aW5nRGlhbG9nLnByb3RvdHlwZS5zZXRBc0RlZmF1bHRMYXlvdXQ9YXN5bmMgZnVuY3Rpb24ob25lTGF5b3V0RE9NKXtcclxuICAgIHRoaXMubGF5b3V0c0Rpdi5jaGlsZHJlbignYScpLmVhY2goKGluZGV4LGFMYXlvdXQpPT57XHJcbiAgICAgICAgdGhpcy5zaG93QXNOb3REZWZhdWx0TGF5b3V0TGJsKCQoYUxheW91dCkpXHJcbiAgICB9KVxyXG5cclxuICAgIGlmKG9uZUxheW91dERPTT09bnVsbCl7IC8vcmVtb3ZlIGRlZmF1bHQgbGF5b3V0XHJcbiAgICAgICAgdmFyIGxheW91dE5hbWU9XCJcIlxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5zaG93QXNEZWZhdWx0TGF5b3V0TGJsKCQob25lTGF5b3V0RE9NKSlcclxuICAgICAgICBsYXlvdXROYW1lPW9uZUxheW91dERPTS5kYXRhKFwibGF5b3V0T2JqXCIpLm5hbWUgXHJcbiAgICB9XHJcbiAgICAgICBcclxuICAgIHZhciBwcm9qZWN0SW5mbz1nbG9iYWxDYWNoZS5maW5kUHJvamVjdEluZm8oZ2xvYmFsQ2FjaGUuY3VycmVudFByb2plY3RJRClcclxuICAgIHByb2plY3RJbmZvLmRlZmF1bHRMYXlvdXQ9bGF5b3V0TmFtZVxyXG4gICAgLy91cGRhdGUgZGF0YWJhc2VcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiYWNjb3VudE1hbmFnZW1lbnQvc2V0UHJvamVjdERlZmF1bHRMYXlvdXRcIiwgXCJQT1NUXCIsIHtcImRlZmF1bHRMYXlvdXRcIjpsYXlvdXROYW1lIH0sXCJ3aXRoUHJvamVjdElEXCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9IFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBwcm9qZWN0U2V0dGluZ0RpYWxvZygpOyIsImNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcblxyXG5mdW5jdGlvbiBzY3JpcHRUZXN0RGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbnNjcmlwdFRlc3REaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oaW5wdXRzQXJyLHR3aW5OYW1lLGZvcm11bGFUd2luTW9kZWwsdmFsdWVUZW1wbGF0ZSkge1xyXG4gICAgdGhpcy5zY3JpcHRDb250ZW50PVwiXCJcclxuICAgIHRoaXMuc2VsZlR3aW5OYW1lPXR3aW5OYW1lXHJcbiAgICB0aGlzLnZhbHVlVGVtcGxhdGU9dmFsdWVUZW1wbGF0ZVxyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPlR3aW4gRGF0YSBQcm9jZXNzaW5nIFRlc3RmbGlnaHQ8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJ3aWR0aDo0MjBweDtmb250LXNpemU6MS4yZW1cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuXHJcbiAgICB2YXIgdHdpbk5hbWVMYmw9dGhpcy5nZW5lcmF0ZU5hbWVMYWJlbChcIlR3aW4gTmFtZVwiLFwiMTBweFwiKVxyXG4gICAgdHdpbk5hbWVMYmwuYXBwZW5kKCQoJzxsYWJlbCBjbGFzcz1cInczLXRleHQtZ3JheVwiPicrdHdpbk5hbWUrJzwvbGFiZWw+JykpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHR3aW5OYW1lTGJsKVxyXG5cclxuICAgIHZhciB0d2luTmFtZUxibD10aGlzLmdlbmVyYXRlTmFtZUxhYmVsKFwiTW9kZWxcIixcIjEwcHhcIilcclxuICAgIHR3aW5OYW1lTGJsLmFwcGVuZCgkKCc8bGFiZWwgY2xhc3M9XCJ3My10ZXh0LWdyYXlcIj4nK2Zvcm11bGFUd2luTW9kZWwrJzwvbGFiZWw+JykpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHR3aW5OYW1lTGJsKVxyXG5cclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQodGhpcy5nZW5lcmF0ZU5hbWVMYWJlbChcIklucHV0c1wiLFwiMTBweFwiKSlcclxuICAgIFxyXG4gICAgdmFyIGFUYWJsZT0kKCc8dGFibGUgY2xhc3M9XCJ3My10ZXh0LWdyYXlcIiBzdHlsZT1cImJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7Zm9udC1zaXplOi44ZW07d2lkdGg6MTAwJVwiPjwvdGFibGU+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoYVRhYmxlKVxyXG4gICAgYVRhYmxlLmFwcGVuZCgkKCc8dHI+PHRkIGNsYXNzPVwidzMtbGlnaHQtZ3JheSB3My1ib3JkZXJcIj48L3RkPjx0ZCBjbGFzcz1cInczLWxpZ2h0LWdyYXkgdzMtYm9yZGVyXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3RleHQtYWxpZ246Y2VudGVyXCI+VHdpbjwvdGQ+PHRkIGNsYXNzPVwidzMtbGlnaHQtZ3JheSB3My1ib3JkZXJcIiBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGQ7dGV4dC1hbGlnbjpjZW50ZXJcIj5Qcm9wZXJ0eSBQYXRoPC90ZD48dGQgY2xhc3M9XCJ3My1saWdodC1ncmF5IHczLWJvcmRlclwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZDt0ZXh0LWFsaWduOmNlbnRlclwiPlZhbHVlPC90ZD48L3RyPicpKVxyXG5cclxuICAgIHZhciB2YWx1ZUVkaXRvckFycj1bXVxyXG4gICAgaW5wdXRzQXJyLmZvckVhY2gob25lUHJvcGVydHk9PntcclxuICAgICAgICB2YXIgdHI9JCgnPHRyPjwvdHI+JylcclxuICAgICAgICB2YXIgdGQwPSQoJzx0ZCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwicGFkZGluZzowcHggMTBweFwiPjxpIGNsYXNzPVwiZmFzIGZhLXVubG9ja1wiPjwvaT48L3RkPicpXHJcbiAgICAgICAgdmFyIHRkMT0kKCc8dGQgY2xhc3M9XCJ3My1saWdodC1ncmF5IHczLWJvcmRlclwiIHN0eWxlPVwicGFkZGluZzowcHggMTBweFwiPicrb25lUHJvcGVydHkudHdpbk5hbWUrJzwvdGQ+JylcclxuICAgICAgICB2YXIgdGQyPSQoJzx0ZCBjbGFzcz1cInczLWxpZ2h0LWdyYXkgdzMtYm9yZGVyXCIgc3R5bGU9XCJwYWRkaW5nOjBweCAxMHB4XCI+JytvbmVQcm9wZXJ0eS5wYXRoKyc8L3RkPicpXHJcbiAgICAgICAgdmFyIHRkMz0kKCc8dGQgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cInBhZGRpbmc6MHB4IDEwcHhcIj48L3RkPicpXHJcbiAgICAgICAgdmFyIHZhbHVlVHlwZT10aGlzLmZpbmRQcm9wZXJ0eVR5cGUob25lUHJvcGVydHkudHdpbk5hbWVfb3JpZ2luLG9uZVByb3BlcnR5LnBhdGgpXHJcbiAgICAgICAgdmFyIHZhbHVlRWRpdD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtib3JkZXI6bm9uZTtwYWRkaW5nOjVweCAwcHg7d2lkdGg6MTAwJVwiICBwbGFjZWhvbGRlcj1cInR5cGU6ICcgK3ZhbHVlVHlwZSArICdcIi8+Jyk7XHJcbiAgICAgICAgdGQwLmNoaWxkcmVuKCc6Zmlyc3QnKS5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHZhciBsb2NrRG9tPSQoZS50YXJnZXQpXHJcbiAgICAgICAgICAgIGlmKGxvY2tEb20uaGFzQ2xhc3MoXCJmYS11bmxvY2tcIikpe2xvY2tEb20ucmVtb3ZlQ2xhc3MoXCJmYS11bmxvY2tcIik7bG9ja0RvbS5hZGRDbGFzcyhcImZhLWxvY2tcIik7bG9ja0RvbS5hZGRDbGFzcyhcInczLXRleHQtYW1iZXJcIil9XHJcbiAgICAgICAgICAgIGVsc2Uge2xvY2tEb20ucmVtb3ZlQ2xhc3MoXCJmYS1sb2NrXCIpO2xvY2tEb20uYWRkQ2xhc3MoXCJmYS11bmxvY2tcIik7bG9ja0RvbS5yZW1vdmVDbGFzcyhcInczLXRleHQtYW1iZXJcIil9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB2YWx1ZUVkaXRvckFyci5wdXNoKHtcInR5cGVcIjp2YWx1ZVR5cGUsXCJlZGl0b3JcIjp2YWx1ZUVkaXQsXCJsb2NrSWNvblwiOnRkMC5jaGlsZHJlbignOmZpcnN0JylcclxuICAgICAgICAgICAgLFwidHdpbk5hbWVcIjpvbmVQcm9wZXJ0eS50d2luTmFtZV9vcmlnaW5cclxuICAgICAgICAgICAgLFwiaW5wdXRQYXRoXCI6b25lUHJvcGVydHkucGF0aFxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgYVRhYmxlLmFwcGVuZCh0ci5hcHBlbmQodGQwLHRkMSx0ZDIsdGQzKSlcclxuICAgICAgICB0ZDMuYXBwZW5kKHZhbHVlRWRpdClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJhbmRvbUlucHV0QnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLXJpcHBsZSB3My1jYXJkIHczLW1hcmdpbi1yaWdodCB3My1saWdodC1ncmF5IHczLWJ1dHRvbiB3My1ob3Zlci1waW5rIHczLW1hcmdpbi10b3AgdzMtbWFyZ2luLWJvdHRvbVwiPkdlbmVyYXRlIFJhbmRvbSBJbnB1dCAmIEV4ZWN1dGU8L2J1dHRvbj4nKVxyXG5cclxuICAgIHJhbmRvbUlucHV0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhbHVlRWRpdG9yQXJyLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgICAgIGlmKGVsZS5sb2NrSWNvbi5oYXNDbGFzcyhcImZhLWxvY2tcIikpIHJldHVybjtcclxuICAgICAgICAgICAgdmFyIGRhdGFUeXBlPWVsZS50eXBlXHJcbiAgICAgICAgICAgIHZhciB0aGVFZGl0b3I9ZWxlLmVkaXRvclxyXG4gICAgICAgICAgICB0aGVFZGl0b3IudmFsKHRoaXMuZ2VuZXJhdGVSYW5kb21WYWx1ZShkYXRhVHlwZSkpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgLy9kbyBleGVjdXRlIGF1dG9tYXRpY2FsbHlcclxuICAgICAgICB0aGlzLnRlc3RGbGlnaHQodmFsdWVFZGl0b3JBcnIpXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgZXhlY3V0ZVNjcmlwdEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtY2FyZCB3My1idXR0b24gdzMtYW1iZXIgdzMtaG92ZXItcGluayB3My1tYXJnaW4tdG9wIHczLW1hcmdpbi1ib3R0b21cIj5FeGVjdXRlPC9idXR0b24+JylcclxuICAgIGV4ZWN1dGVTY3JpcHRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy50ZXN0RmxpZ2h0KHZhbHVlRWRpdG9yQXJyKX0pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJhbmRvbUlucHV0QnRuLGV4ZWN1dGVTY3JpcHRCdG4pXHJcblxyXG4gICAgdmFyIGxibDE9JCgnPGxhYmVsIGNsYXNzPVwidzMtdGV4dC1hbWJlclwiIHN0eWxlPVwiZm9udC1zdHlsZTogaXRhbGljO2ZvbnQtc2l6ZToxMXB4O2Rpc3BsYXk6YmxvY2tcIj5Zb3UgY2FuIHN0aWxsIGNoYW5nZSB0aGUgY2FsY3VsYXRpb24gc2NyaXB0IGluIHRoZSBpbmZvbXJhdGlvbiBwYW5lbCBhbmQgdGVzdCB0aGUgbW9kaWZpZWQgc2NyaXB0IGltbWVkaWF0ZWx5PC9sYWJlbD4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChsYmwxKVxyXG5cclxuICAgIHZhciByZXN1bHREaXY9JCgnPGRpdiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjE0MHB4O3BhZGRpbmc6NXB4XCIvPicpLmFkZENsYXNzKFwidzMtbGlnaHQtZ3JheSB3My10ZXh0LWdyYXkgdzMtYm9yZGVyIHczLW1hcmdpbi1ib3R0b21cIik7XHJcbiAgICByZXN1bHREaXYudGV4dChcIkNhbGN1bGF0aW9uIHJlc3VsdC4uLlwiKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyZXN1bHREaXYpXHJcbiAgICB0aGlzLnJlc3VsdERpdj1yZXN1bHREaXZcclxufVxyXG5cclxuc2NyaXB0VGVzdERpYWxvZy5wcm90b3R5cGUudGVzdEZsaWdodD1mdW5jdGlvbih2YWx1ZUVkaXRvckFycil7XHJcbiAgICB2YXIgX3NlbGY9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh0aGlzLnZhbHVlVGVtcGxhdGUpKVxyXG4gICAgdmFyIF90d2luVmFsPXt9XHJcbiAgICBcclxuICAgIHZhbHVlRWRpdG9yQXJyLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgdmFyIG9iaj1udWxsXHJcbiAgICAgICAgaWYoZWxlLnR3aW5OYW1lIT10aGlzLnNlbGZUd2luTmFtZSl7XHJcbiAgICAgICAgICAgIF90d2luVmFsW2VsZS50d2luTmFtZV09e31cclxuICAgICAgICAgICAgb2JqPV90d2luVmFsW2VsZS50d2luTmFtZV1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgb2JqPV9zZWxmXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciByb290T2JqPW9ialxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWxlLmlucHV0UGF0aC5sZW5ndGgtMTtpKyspe1xyXG4gICAgICAgICAgICB2YXIgcG5hbWU9ZWxlLmlucHV0UGF0aFtpXVxyXG4gICAgICAgICAgICBpZihyb290T2JqW3BuYW1lXT09bnVsbCkgcm9vdE9ialtwbmFtZV09e31cclxuICAgICAgICAgICAgcm9vdE9iaj1yb290T2JqW3BuYW1lXVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgb3JpZ2luVmFsPWVsZS5lZGl0b3IudmFsKClcclxuICAgICAgICBpZihlbGUudHlwZT09XCJib29sZWFuXCIpIHZhciB0aGVWYWw9IChvcmlnaW5WYWwgPT09ICd0cnVlJylcclxuICAgICAgICBlbHNlIGlmKGVsZS50eXBlPT1cImRvdWJsZVwifHxlbGUudHlwZT09XCJmbG9hdFwifHxlbGUudHlwZT09XCJpbnRlZ2VyXCJ8fGVsZS50eXBlPT1cImxvbmdcIikgdGhlVmFsPXBhcnNlRmxvYXQob3JpZ2luVmFsKVxyXG4gICAgICAgIGVsc2UgdGhlVmFsPW9yaWdpblZhbFxyXG4gICAgICAgIHJvb3RPYmpbZWxlLmlucHV0UGF0aFtlbGUuaW5wdXRQYXRoLmxlbmd0aC0xXV09dGhlVmFsXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMucmVzdWx0RGl2LmVtcHR5KClcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZXZhbFN0cj10aGlzLnNjcmlwdENvbnRlbnQrXCJcXG5fc2VsZlwiXHJcbiAgICAgICAgdmFyIHJlc3VsdD1ldmFsKGV2YWxTdHIpIC8vIGpzaGludCBpZ25vcmU6bGluZVxyXG4gICAgICAgIHRoaXMucmVzdWx0RGl2LmFwcGVuZCgkKCc8cHJlIHN0eWxlPVwibWFyZ2luOjBweDtmb250LXNpemU6MTFweFwiIGlkPVwianNvblwiPicrSlNPTi5zdHJpbmdpZnkocmVzdWx0LG51bGwsMikrJzwvcHJlPicpKSBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICB0aGlzLnJlc3VsdERpdi5hcHBlbmQoJCgnPHByZSBzdHlsZT1cIm1hcmdpbjowcHg7Zm9udC1zaXplOjExcHhcIiBpZD1cImpzb25cIj4nK2UrJzwvcHJlPicpKVxyXG4gICAgfVxyXG59XHJcblxyXG5zY3JpcHRUZXN0RGlhbG9nLnByb3RvdHlwZS5nZW5lcmF0ZVJhbmRvbVZhbHVlPWZ1bmN0aW9uKGRhdGFUeXBlKXtcclxuICAgIHZhciByYW5kRGF0YT1NYXRoLnJhbmRvbSgpXHJcbiAgICBpZihkYXRhVHlwZT09XCJib29sZWFuXCIpe1xyXG4gICAgICAgIHJldHVybiAocmFuZERhdGE+MC41KVxyXG4gICAgfWVsc2UgaWYoZGF0YVR5cGU9PVwiZGF0ZVRpbWVcIil7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxyXG4gICAgfWVsc2UgaWYoZGF0YVR5cGU9PVwiZGF0ZVwiKXtcclxuICAgICAgICByZXR1cm4gKG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSkuc3BsaXQoXCJUXCIpWzBdXHJcbiAgICB9ZWxzZSBpZihkYXRhVHlwZT09XCJ0aW1lXCIpe1xyXG4gICAgICAgIHJldHVybiAoXCJUXCIrKChuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpLnNwbGl0KFwiVFwiKVsxXSkpXHJcbiAgICB9ZWxzZSBpZihkYXRhVHlwZT09XCJkb3VibGVcIiB8fCBkYXRhVHlwZT09XCJmbG9hdFwiKXtcclxuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCgocmFuZERhdGEqMTAwKS50b0ZpeGVkKDEpKVxyXG4gICAgfWVsc2UgaWYoZGF0YVR5cGU9PVwiaW50ZWdlclwiIHx8IGRhdGFUeXBlPT1cImxvbmdcIil7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHJhbmREYXRhKjEwMClcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHJldHVybiBudWxsXHJcbiAgICB9XHJcbn1cclxuXHJcbnNjcmlwdFRlc3REaWFsb2cucHJvdG90eXBlLmZpbmRQcm9wZXJ0eVR5cGU9ZnVuY3Rpb24odHdpbk5hbWUscHJvcGVydHlQYXRoKXtcclxuICAgIHZhciBkYnR3aW49Z2xvYmFsQ2FjaGUuZ2V0U2luZ2xlREJUd2luQnlOYW1lKHR3aW5OYW1lKVxyXG4gICAgdmFyIG1vZGVsSUQ9ZGJ0d2luW1wibW9kZWxJRFwiXVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB2YXIgdGhlVHlwZT1lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgIGZvcih2YXIgaT0wO2k8cHJvcGVydHlQYXRoLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBlbGU9cHJvcGVydHlQYXRoW2ldXHJcbiAgICAgICAgaWYodGhlVHlwZVtlbGVdKSB0aGVUeXBlPXRoZVR5cGVbZWxlXVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIG51bGxcclxuICAgIH1cclxuICAgIHJldHVybiB0aGVUeXBlXHJcbn1cclxuXHJcblxyXG5zY3JpcHRUZXN0RGlhbG9nLnByb3RvdHlwZS5nZW5lcmF0ZU5hbWVMYWJlbD1mdW5jdGlvbihzdHIscGFkZGluZ1RvcCl7XHJcbiAgICB2YXIga2V5RGl2ID0gJChcIjxkaXY+PGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjojZjZmNmY2O2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIrc3RyK1wiPC9kaXY+PC9kaXY+XCIpXHJcbiAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixwYWRkaW5nVG9wKVxyXG4gICAgcmV0dXJuIGtleURpdlxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBzY3JpcHRUZXN0RGlhbG9nKCk7IiwiY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKTtcclxuXHJcbmZ1bmN0aW9uIHNlcnZpY2VXb3JrZXJIZWxwZXIoKXtcclxuICAgIHRoaXMucHJvamVjdElEPW51bGxcclxuICAgIHRoaXMubGlzdEFsbExpdmVNb25pdG9yPXt9XHJcbiAgICBzZXRJbnRlcnZhbCgoKT0+e1xyXG4gICAgICAgIGlmKHRoaXMucHJvamVjdElEPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5zdWJzY3JpYmVJbXBvcnRhbnRFdmVudCh0aGlzLnByb2plY3RJRClcclxuXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gdGhpcy5saXN0QWxsTGl2ZU1vbml0b3Ipe1xyXG4gICAgICAgICAgICB2YXIgYUxpdmVQcm9wZXJ0eT10aGlzLmxpc3RBbGxMaXZlTW9uaXRvcltpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuc3Vic2NyaWJlTGl2ZVByb3BlcnR5KGFMaXZlUHJvcGVydHkudHdpbklELGFMaXZlUHJvcGVydHkucHJvcGVydHlQYXRoKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9LDgqNjAqMTAwMCkgLy9ldmVyeSA4IG1pbnV0ZSByZW5ldyB0aGUgc2VydmljZSB3b3JrZXIgc3Vic2NyaXB0aW9uXHJcbn1cclxuXHJcbnNlcnZpY2VXb3JrZXJIZWxwZXIucHJvdG90eXBlLnN1YnNjcmliZUltcG9ydGFudEV2ZW50ID0gYXN5bmMgZnVuY3Rpb24gKHByb2plY3RJRCkgeyAgICBcclxuICAgIHZhciBzdWJzY3JpcHRpb249YXdhaXQgdGhpcy5jcmVhdGVTdWJzY3JpcHRpb24oKVxyXG4gICAgaWYoc3Vic2NyaXB0aW9uPT1udWxsKSByZXR1cm47XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBwYXlsb2FkPXtcclxuICAgICAgICAgICAgdHlwZTonZXZlbnRzJyxcclxuICAgICAgICAgICAgc2VydmljZVdvcmtlclN1YnNjcmlwdGlvbjpKU09OLnN0cmluZ2lmeShzdWJzY3JpcHRpb24pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NlcnZpY2VXb3JrZXJTdWJzY3JpcHRpb25cIiwgXCJQT1NUXCIsIHBheWxvYWQsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbnNlcnZpY2VXb3JrZXJIZWxwZXIucHJvdG90eXBlLnN1YnNjcmliZUxpdmVQcm9wZXJ0eSA9IGFzeW5jIGZ1bmN0aW9uICh0d2luSUQscHJvcGVydHlQYXRoKSB7ICAgIFxyXG4gICAgdmFyIHN1YnNjcmlwdGlvbj1hd2FpdCB0aGlzLmNyZWF0ZVN1YnNjcmlwdGlvbigpXHJcbiAgICBpZihzdWJzY3JpcHRpb249PW51bGwpIHJldHVybjtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIHBheWxvYWQ9e1xyXG4gICAgICAgICAgICB0eXBlOidwcm9wZXJ0eVZhbHVlJyxcclxuICAgICAgICAgICAgc2VydmljZVdvcmtlclN1YnNjcmlwdGlvbjpKU09OLnN0cmluZ2lmeShzdWJzY3JpcHRpb24pLFxyXG4gICAgICAgICAgICB0d2luSUQ6dHdpbklELFxyXG4gICAgICAgICAgICBwcm9wZXJ0eVBhdGg6cHJvcGVydHlQYXRoXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NlcnZpY2VXb3JrZXJTdWJzY3JpcHRpb25cIiwgXCJQT1NUXCIsIHBheWxvYWQsIFwid2l0aFByb2plY3RJRFwiKVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbnNlcnZpY2VXb3JrZXJIZWxwZXIucHJvdG90eXBlLmNyZWF0ZVN1YnNjcmlwdGlvbiA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIGlmICghKCdzZXJ2aWNlV29ya2VyJyBpbiBuYXZpZ2F0b3IpKSByZXR1cm4gbnVsbDtcclxuICAgIC8vdGhpcyBwdWJsaWMga2V5IHNob3VsZCBiZSB0aGUgb25lIHVzZWQgaW4gYmFja2VuZCBzZXJ2ZXIgc2lkZSBmb3IgcHVzaGluZyBtZXNzYWdlIChpbiBhenVyZWlvdHJvY2tzZnVuY3Rpb24pXHJcbiAgICBjb25zdCBwdWJsaWNWYXBpZEtleSA9ICdCQ3h2RnFrMGN6SWtDVGJsQU15ODBmTVdUajJXYUFrZVhDeXA5OC1TMk1pVnJUTDU5dTA0NmVMUnJUQkltbzlaQ1dBUTNZcWpfN1B3RU91eWhEbUMtV1knO1xyXG4gICAgdmFyIHN1YnNjcmlwdGlvbiA9IG51bGxcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVnaXN0cmF0aW9uID0gYXdhaXQgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy93b3JrZXIuanMnLCB7IHNjb3BlOiAnLycgfSk7XHJcbiAgICAgICAgc3Vic2NyaXB0aW9uID0gYXdhaXQgcmVnaXN0cmF0aW9uLnB1c2hNYW5hZ2VyLnN1YnNjcmliZSh7XHJcbiAgICAgICAgICAgIHVzZXJWaXNpYmxlT25seTogdHJ1ZSxcclxuICAgICAgICAgICAgYXBwbGljYXRpb25TZXJ2ZXJLZXk6IHB1YmxpY1ZhcGlkS2V5XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIub25tZXNzYWdlID0gKGUpPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NMaXZlTWVzc2FnZShlLmRhdGEpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxpdmVEYXRhXCIsXCJib2R5XCI6ZS5kYXRhIH0pXHJcbiAgICAgICAgfTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHN1YnNjcmlwdGlvbjtcclxufVxyXG5cclxuc2VydmljZVdvcmtlckhlbHBlci5wcm90b3R5cGUucHJvY2Vzc0xpdmVNZXNzYWdlPWZ1bmN0aW9uKG1zZ0JvZHkpe1xyXG4gICAgY29uc29sZS5sb2cobXNnQm9keSlcclxuICAgIGlmKG1zZ0JvZHkuY29ubmVjdGlvblN0YXRlICYmIG1zZ0JvZHkucHJvamVjdElEPT1nbG9iYWxDYWNoZS5jdXJyZW50UHJvamVjdElEKXtcclxuICAgICAgICB2YXIgdHdpbklEPW1zZ0JvZHkudHdpbklEXHJcbiAgICAgICAgdmFyIHR3aW5EQkluZm89Z2xvYmFsQ2FjaGUuREJUd2luc1t0d2luSURdXHJcbiAgICAgICAgaWYobXNnQm9keS5jb25uZWN0aW9uU3RhdGU9PVwiZGV2aWNlQ29ubmVjdGVkXCIpIHR3aW5EQkluZm8uY29ubmVjdFN0YXRlPXRydWVcclxuICAgICAgICBlbHNlIHR3aW5EQkluZm8uY29ubmVjdFN0YXRlPWZhbHNlXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhtc2dCb2R5KVxyXG4gICAgfVxyXG59XHJcblxyXG5zZXJ2aWNlV29ya2VySGVscGVyLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicHJvamVjdElzQ2hhbmdlZFwiKXtcclxuICAgICAgICBmb3IodmFyIGluZCBpbiB0aGlzLmxpc3RBbGxMaXZlTW9uaXRvcikgZGVsZXRlIHRoaXMubGlzdEFsbExpdmVNb25pdG9yW2luZF1cclxuICAgICAgICB0aGlzLnByb2plY3RJRD1tc2dQYXlsb2FkLnByb2plY3RJRFxyXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlSW1wb3J0YW50RXZlbnQobXNnUGF5bG9hZC5wcm9qZWN0SUQpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTGl2ZU1vbml0b3JcIil7XHJcbiAgICAgICAgdmFyIHN0cj1tc2dQYXlsb2FkLnR3aW5JRCtcIi5cIittc2dQYXlsb2FkLnByb3BlcnR5UGF0aC5qb2luKFwiLlwiKVxyXG4gICAgICAgIHRoaXMubGlzdEFsbExpdmVNb25pdG9yW3N0cl09bXNnUGF5bG9hZFxyXG4gICAgICAgIHRoaXMuc3Vic2NyaWJlTGl2ZVByb3BlcnR5KG1zZ1BheWxvYWQudHdpbklELG1zZ1BheWxvYWQucHJvcGVydHlQYXRoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlbW92ZUxpdmVNb25pdG9yXCIpe1xyXG4gICAgICAgIHZhciBzdHI9bXNnUGF5bG9hZC50d2luSUQrXCIuXCIrbXNnUGF5bG9hZC5wcm9wZXJ0eVBhdGguam9pbihcIi5cIilcclxuICAgICAgICBkZWxldGUgdGhpcy5saXN0QWxsTGl2ZU1vbml0b3Jbc3RyXVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBzZXJ2aWNlV29ya2VySGVscGVyKCk7IiwiZnVuY3Rpb24gc2ltcGxlQ2hhcnQocGFyZW50RG9tLHhMZW5ndGgsY3NzT3B0aW9ucyxjdXN0b21EcmF3aW5nKXtcclxuICAgIGlmKGN1c3RvbURyYXdpbmcpe1xyXG4gICAgICAgIGN1c3RvbURyYXdpbmcocGFyZW50RG9tKVxyXG4gICAgfVxyXG4gICAgdGhpcy5jYW52YXMgPSAkKCc8Y2FudmFzPjwvY2FudmFzPicpXHJcbiAgICB0aGlzLmNhbnZhcy5jc3MoY3NzT3B0aW9ucylcclxuICAgIHBhcmVudERvbS5hcHBlbmQodGhpcy5jYW52YXMpXHJcbiAgICBcclxuICAgIHRoaXMuY2hhcnQ9bmV3IENoYXJ0KHRoaXMuY2FudmFzLCB7XHJcbiAgICAgICAgdHlwZTogXCJsaW5lXCIsXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBsYWJlbHM6IFtdLFxyXG4gICAgICAgICAgICBkYXRhc2V0czogW3tzdGVwcGVkOnRydWUsIGRhdGE6IFtdfV1cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgYW5pbWF0aW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgZGF0YXNldHM6IHtcclxuICAgICAgICAgICAgICAgIGxpbmU6IHtcclxuICAgICAgICAgICAgICAgICAgICBzcGFuR2Fwczp0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiBcInJnYmEoMCwwLDI1NSwwLjcpXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6MSxcclxuICAgICAgICAgICAgICAgICAgICBwb2ludFJhZGl1czowXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBsdWdpbnM6e1xyXG4gICAgICAgICAgICAgICAgbGVnZW5kOiB7IGRpc3BsYXk6IGZhbHNlIH0sXHJcbiAgICAgICAgICAgICAgICB0b29sdGlwOntlbmFibGVkOmZhbHNlfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzY2FsZXM6IHtcclxuICAgICAgICAgICAgICAgIHg6e2dyaWQ6e2Rpc3BsYXk6ZmFsc2V9LHRpY2tzOntkaXNwbGF5OmZhbHNlfX1cclxuICAgICAgICAgICAgICAgICx5OntncmlkOnt0aWNrTGVuZ3RoOjB9LHRpY2tzOntmb250OntzaXplOjl9fX1cclxuICAgICAgICAgICAgICAgICx4Mjoge3Bvc2l0aW9uOid0b3AnLGdyaWQ6e2Rpc3BsYXk6ZmFsc2V9LHRpY2tzOntkaXNwbGF5OmZhbHNlfX1cclxuICAgICAgICAgICAgICAgICx5Mjoge3Bvc2l0aW9uOidyaWdodCcsZ3JpZDp7ZGlzcGxheTpmYWxzZX0sdGlja3M6e2Rpc3BsYXk6ZmFsc2V9fSAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnNldFhMZW5ndGgoeExlbmd0aClcclxuXHJcbiAgICAvKlxyXG4gICAgdmFyIG5ld1Y9MVxyXG4gICAgc2V0SW50ZXJ2YWwoKCk9PntcclxuICAgICAgICB2YXIgZGF0YUFycj10aGVDaGFydC5kYXRhLmRhdGFzZXRzWzBdLmRhdGFcclxuICAgICAgICB2YXIgbGVuPWRhdGFBcnIubGVuZ3RoXHJcbiAgICAgICAgdmFyIHBhc3NlZFRpbWU9IHBhcnNlSW50KE1hdGgucmFuZG9tKCkqMTApXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxwYXNzZWRUaW1lO2krKykgZGF0YUFyci5zaGlmdCgpXHJcbiAgICAgICAgZGF0YUFycltsZW4tMV09bmV3VlxyXG4gICAgICAgIG5ld1Y9MS1uZXdWXHJcbiAgICAgICAgdGhlQ2hhcnQudXBkYXRlKClcclxuICAgIH0sNTAwKVxyXG4gICAgKi9cclxufVxyXG5cclxuc2ltcGxlQ2hhcnQucHJvdG90eXBlLmFkZERhdGFWYWx1ZT1mdW5jdGlvbihkYXRhSW5kZXgsdmFsdWUpe1xyXG4gICAgdmFyIGRhdGFBcnI9dGhpcy5jaGFydC5kYXRhLmRhdGFzZXRzWzBdLmRhdGFcclxuXHJcbiAgICB2YXIgdG90YWxQb2ludHM9ZGF0YUFyci5sZW5ndGhcclxuXHJcbiAgICBpZih0aGlzLmxhc3REYXRhSW5kZXg9PW51bGwpIHRoaXMubGFzdERhdGFJbmRleD1kYXRhSW5kZXgtMVxyXG4gICAgaWYoZGF0YUluZGV4PHRoaXMubGFzdERhdGFJbmRleCl7XHJcbiAgICAgICAgaWYodGhpcy5sYXN0RGF0YUluZGV4LWRhdGFJbmRleD49dG90YWxQb2ludHMpIHJldHVybjsgLy9pZ25vcmUgcmVjZWl2aW5nIHRvbyBvbGQgcG9pbnRzXHJcbiAgICAgICAgdmFyIGRpZmY9dGhpcy5sYXN0RGF0YUluZGV4IC0gZGF0YUluZGV4XHJcbiAgICAgICAgZGF0YUFyclt0b3RhbFBvaW50cy0xLWRpZmZdPXZhbHVlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbnVtT2ZQYXNzZWRQb2ludHM9ZGF0YUluZGV4LXRoaXMubGFzdERhdGFJbmRleFxyXG4gICAgICAgIGRhdGFBcnI9ZGF0YUFyci5zbGljZShudW1PZlBhc3NlZFBvaW50cylcclxuICAgICAgICBkYXRhQXJyW3RvdGFsUG9pbnRzLTFdPXZhbHVlXHJcbiAgICB9XHJcbiAgICB0aGlzLmNoYXJ0LmRhdGEuZGF0YXNldHNbMF0uZGF0YT1kYXRhQXJyXHJcbiAgICB0aGlzLmNoYXJ0LnVwZGF0ZSgpXHJcblxyXG4gICAgdGhpcy5sYXN0RGF0YUluZGV4PWRhdGFJbmRleFxyXG59XHJcblxyXG5zaW1wbGVDaGFydC5wcm90b3R5cGUuc2V0WExlbmd0aD1mdW5jdGlvbih4bGVuKXtcclxuICAgIHZhciBsYWJlbHM9dGhpcy5jaGFydC5kYXRhLmxhYmVsc1xyXG4gICAgbGFiZWxzLmxlbmd0aD0wXHJcbiAgICBmb3IodmFyIGk9MDtpPHhsZW47aSsrKSBsYWJlbHMucHVzaChpKVxyXG4gICAgLy9zaG9ydGVuIG9yIGV4cGFuZCB0aGUgbGVuZ3RoIG9mIGRhdGEgYXJyYXlcclxuICAgIHZhciBkYXRhQXJyPXRoaXMuY2hhcnQuZGF0YS5kYXRhc2V0c1swXS5kYXRhXHJcbiAgICBpZihkYXRhQXJyLmxlbmd0aD54bGVuKSBkYXRhQXJyPWRhdGFBcnIuc2xpY2UoZGF0YUFyci5sZW5ndGgteGxlbilcclxuICAgIGVsc2UgaWYoZGF0YUFyci5sZW5ndGg8eGxlbil7XHJcbiAgICAgICAgdmFyIG51bWJlclRvQWRkPXhsZW4tZGF0YUFyci5sZW5ndGhcclxuICAgICAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICAgICAgdG1wQXJyW251bWJlclRvQWRkLTFdPW51bGxcclxuICAgICAgICBkYXRhQXJyPXRtcEFyci5jb25jYXQoZGF0YUFycilcclxuICAgIH1cclxuICAgIHRoaXMuY2hhcnQuZGF0YS5kYXRhc2V0c1swXS5kYXRhPWRhdGFBcnJcclxuICAgIHRoaXMuY2hhcnQudXBkYXRlKClcclxufVxyXG5cclxuc2ltcGxlQ2hhcnQucHJvdG90eXBlLmRlc3Ryb3k9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuY2FudmFzLnJlbW92ZSgpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlQ2hhcnQ7IiwiY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZSgnLi9nbG9iYWxDYWNoZScpXHJcbmZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICAvL3RoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuc2hvdz1mdW5jdGlvbihjc3NPcHRpb25zLG90aGVyT3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTS5jc3MoY3NzT3B0aW9ucylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPicgKyBvdGhlck9wdGlvbnMudGl0bGUgKyAnPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jbG9zZSgpIH0pXHJcblxyXG4gICAgdmFyIGRpYWxvZ0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWFyZ2luLWJvdHRvbToxMHB4XCI+PC9kaXY+JylcclxuICAgIGlmKG90aGVyT3B0aW9ucy5jdXN0b21EcmF3aW5nKXtcclxuICAgICAgICBvdGhlck9wdGlvbnMuY3VzdG9tRHJhd2luZyhkaWFsb2dEaXYpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBkaWFsb2dEaXYudGV4dChvdGhlck9wdGlvbnMuY29udGVudClcclxuICAgIH1cclxuICAgIHRoaXMuRE9NLmFwcGVuZChkaWFsb2dEaXYpXHJcbiAgICB0aGlzLmRpYWxvZ0Rpdj1kaWFsb2dEaXZcclxuXHJcbiAgICB0aGlzLmJvdHRvbUJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJvdHRvbUJhcilcclxuXHJcbiAgICBvdGhlck9wdGlvbnMuYnV0dG9ucy5mb3JFYWNoKGJ0bj0+e1xyXG4gICAgICAgIHZhciBhQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1yaXBwbGUgdzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlRXhwYW5kYWJsZVNlY3Rpb24odGl0bGVTdHIscGFyZW50RE9NLG9wdGlvbnMpIHtcclxuICAgIHRoaXMuZXhwYW5kU3RhdHVzPWZhbHNlXHJcbiAgICBvcHRpb25zPW9wdGlvbnN8fHt9XHJcbiAgICB2YXIgbWFyZ2luVG9wPTEwXHJcbiAgICBpZihvcHRpb25zLm1hcmdpblRvcCE9bnVsbCkgbWFyZ2luVG9wPW9wdGlvbnMubWFyZ2luVG9wXHJcbiAgICB0aGlzLmhlYWRlckRPTSA9ICQoYDxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduIHczLWJvcmRlci1ib3R0b20gdzMtaG92ZXItYW1iZXIgdzMtdGV4dC1ncmF5XCIgc3R5bGU9XCJtYXJnaW4tdG9wOiR7bWFyZ2luVG9wfXB4O2ZvbnQtd2VpZ2h0OmJvbGRcIj48YT4ke3RpdGxlU3RyfTwvYT48aSBjbGFzcz1cInczLW1hcmdpbi1sZWZ0IGZhcyBmYS1jYXJldC11cFwiPjwvaT48L2J1dHRvbj5gKVxyXG4gICAgdGhpcy5saXN0RE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlXCIgc3R5bGU9XCJwYWRkaW5nLXRvcDoycHhcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyVGV4dERPTT10aGlzLmhlYWRlckRPTS5jaGlsZHJlbihcIjpmaXJzdFwiKVxyXG5cclxuICAgIHRoaXMudHJpYW5nbGU9dGhpcy5oZWFkZXJET00uY2hpbGRyZW4oJ2knKS5lcSgwKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZCh0aGlzLmhlYWRlckRPTSwgdGhpcy5saXN0RE9NKVxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLCAoZXZ0KSA9PiB7XHJcbiAgICAgICAgaWYodGhpcy5leHBhbmRTdGF0dXMpIHRoaXMuc2hyaW5rKClcclxuICAgICAgICBlbHNlIHRoaXMuZXhwYW5kKClcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NoYW5nZSh0aGlzLmV4cGFuZFN0YXR1cylcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuY2FsbEJhY2tfY2hhbmdlPShzdGF0dXMpPT57fVxyXG59XHJcblxyXG5zaW1wbGVFeHBhbmRhYmxlU2VjdGlvbi5wcm90b3R5cGUuZXhwYW5kPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICB0aGlzLnRyaWFuZ2xlLmFkZENsYXNzKFwiZmEtY2FyZXQtZG93blwiKVxyXG4gICAgdGhpcy50cmlhbmdsZS5yZW1vdmVDbGFzcyhcImZhLWNhcmV0LXVwXCIpXHJcbiAgICB0aGlzLmV4cGFuZFN0YXR1cyA9IHRydWVcclxufVxyXG5cclxuc2ltcGxlRXhwYW5kYWJsZVNlY3Rpb24ucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgdGhpcy50cmlhbmdsZS5yZW1vdmVDbGFzcyhcImZhLWNhcmV0LWRvd25cIilcclxuICAgIHRoaXMudHJpYW5nbGUuYWRkQ2xhc3MoXCJmYS1jYXJldC11cFwiKVxyXG4gICAgdGhpcy5leHBhbmRTdGF0dXMgPSBmYWxzZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUV4cGFuZGFibGVTZWN0aW9uOyIsImZ1bmN0aW9uIHNpbXBsZVNlbGVjdE1lbnUoYnV0dG9uTmFtZSxvcHRpb25zKXtcclxuICAgIG9wdGlvbnM9b3B0aW9uc3x8e30gLy97aXNDbGlja2FibGU6MSx3aXRoQm9yZGVyOjEsZm9udFNpemU6XCJcIixjb2xvckNsYXNzOlwiXCIsYnV0dG9uQ1NTOlwiXCJ9XHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmlzQ2xpY2thYmxlPXRydWVcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY2xpY2tcIj48L2Rpdj4nKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWhvdmVyIFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00ub24oXCJtb3VzZW92ZXJcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvL2l0IHNlZW1zIHRoYXQgdGhlIHNlbGVjdCBtZW51IG9ubHkgY2FuIHNob3cgb3V0c2lkZSBvZiBhIHBhcmVudCBzY3JvbGxhYmxlIGRvbSB3aGVuIGl0IGlzIGluc2lkZSBhIHczLWJhciBpdGVtLi4uIG5vdCB2ZXJ5IHN1cmUgYWJvdXQgd2h5IFxyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZS1ibG9jazttYXJnaW4tbGVmdDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmNzcyhcIndpZHRoXCIsKG9wdGlvbnMud2lkdGh8fDEwMCkrXCJweFwiKVxyXG4gICAgdGhpcy5yb3dET009cm93RE9NXHJcbiAgICB0aGlzLnJvd0RPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1heC1oZWlnaHRcIjpvcHRpb25zLm9wdGlvbkxpc3RIZWlnaHQrXCJweFwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwib3ZlcmZsb3cteFwiOlwidmlzaWJsZVwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tdG9wXCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wK1wicHhcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi1sZWZ0XCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCtcInB4XCJ9KVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5idXR0b24sdGhpcy5vcHRpb25Db250ZW50RE9NKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuXHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmJ1dHRvbi5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxCYWNrX2JlZm9yZUNsaWNrRXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkanVzdERyb3BEb3duUG9zaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIGlmKCF0aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yKSByZXR1cm47XHJcbiAgICB2YXIgb2Zmc2V0PXRoaXMuRE9NLm9mZnNldCgpXHJcbiAgICB2YXIgbmV3VG9wPW9mZnNldC50b3AtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci50b3BcclxuICAgIHZhciBuZXdMZWZ0PW9mZnNldC5sZWZ0LXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IubGVmdFxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJ0b3BcIjpuZXdUb3ArXCJweFwiLFwibGVmdFwiOm5ld0xlZnQrXCJweFwifSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuZmluZE9wdGlvbj1mdW5jdGlvbihvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9ucz10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKVxyXG4gICAgZm9yKHZhciBpPTA7aTxvcHRpb25zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKG9wdGlvbnNbaV0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PWFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSl7XHJcbiAgICAgICAgICAgIHJldHVybiB7XCJ0ZXh0XCI6YW5PcHRpb24udGV4dCgpLFwidmFsdWVcIjphbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIiksXCJjb2xvckNsYXNzXCI6YW5PcHRpb24uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIil9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb25BcnI9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHRoaXMuYWRkT3B0aW9uKGVsZW1lbnQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUsY29sb3JDbGFzcyl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgc3R5bGU9XCJ3aGl0ZS1zcGFjZTpub3dyYXBcIj4nK29wdGlvblRleHQrJzwvYT4nKVxyXG4gICAgaWYoY29sb3JDbGFzcykgb3B0aW9uSXRlbS5hZGRDbGFzcyhjb2xvckNsYXNzKVxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFwcGVuZChvcHRpb25JdGVtKVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIixvcHRpb25WYWx1ZXx8b3B0aW9uVGV4dClcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvbkNvbG9yQ2xhc3NcIixjb2xvckNsYXNzKVxyXG4gICAgb3B0aW9uSXRlbS5vbignY2xpY2snLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICAgICAgaWYodGhpcy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IC8vdGhpcyBpcyB0byBoaWRlIHRoZSBkcm9wIGRvd24gbWVudSBhZnRlciBjbGlja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ob3B0aW9uVGV4dCxvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcInJlYWxNb3VzZUNsaWNrXCIsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxuICAgICAgICByZXR1cm4gZmFsc2VcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxudWxsLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiKSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvblZhbHVlPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciByZT10aGlzLmZpbmRPcHRpb24ob3B0aW9uVmFsdWUpXHJcbiAgICBpZihyZT09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbFxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9cmUudmFsdWVcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHJlLnRleHQscmUudmFsdWUsbnVsbCxyZS5jb2xvckNsYXNzKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2xlYXJPcHRpb25zPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUpe1xyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmVtcHR5KClcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNhbGxCYWNrX2NsaWNrT3B0aW9uPWZ1bmN0aW9uKG9wdGlvbnRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spe1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19iZWZvcmVDbGlja0V4cGFuZD1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcblxyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2Nyb2xsVG9MZWFmTm9kZT1mdW5jdGlvbihhTm9kZSl7XHJcbiAgICB2YXIgc2Nyb2xsVG9wPXRoaXMuRE9NLnNjcm9sbFRvcCgpXHJcbiAgICB2YXIgdHJlZUhlaWdodD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIG5vZGVQb3NpdGlvbj1hTm9kZS5ET00ucG9zaXRpb24oKS50b3AgLy93aGljaCBkb2VzIG5vdCBjb25zaWRlciBwYXJlbnQgRE9NJ3Mgc2Nyb2xsIGhlaWdodFxyXG4gICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsdHJlZUhlaWdodCxub2RlUG9zaXRpb24pXHJcbiAgICBpZih0cmVlSGVpZ2h0LTUwPG5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIG5vZGVQb3NpdGlvbi0odHJlZUhlaWdodC01MCkpIFxyXG4gICAgfWVsc2UgaWYobm9kZVBvc2l0aW9uPDUwKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgKG5vZGVQb3NpdGlvbi01MCkpIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5jbGVhckFsbExlYWZOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmxpc3RET00uZW1wdHkoKVxyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD0wXHJcbiAgICAgICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmlyc3RMZWFmTm9kZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgZmlyc3RMZWFmTm9kZT1udWxsO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGZpcnN0TGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBmaXJzdExlYWZOb2RlPWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGZpcnN0TGVhZk5vZGVcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dEdyb3VwTm9kZT1mdW5jdGlvbihhR3JvdXBOb2RlKXtcclxuICAgIGlmKGFHcm91cE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBpbmRleD10aGlzLmdyb3VwTm9kZXMuaW5kZXhPZihhR3JvdXBOb2RlKVxyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXsgLy9yb3RhdGUgYmFja3dhcmQgdG8gZmlyc3QgZ3JvdXAgbm9kZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbMF0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRMZWFmTm9kZT1mdW5jdGlvbihhTGVhZk5vZGUpe1xyXG4gICAgaWYoYUxlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYUdyb3VwTm9kZT1hTGVhZk5vZGUucGFyZW50R3JvdXBOb2RlXHJcbiAgICB2YXIgaW5kZXg9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKGFMZWFmTm9kZSlcclxuICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIC8vbmV4dCBub2RlIGlzIGluIHNhbWUgZ3JvdXBcclxuICAgICAgICByZXR1cm4gYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9maW5kIG5leHQgZ3JvdXAgZmlyc3Qgbm9kZVxyXG4gICAgICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgbmV4dEdyb3VwTm9kZSA9IHRoaXMubmV4dEdyb3VwTm9kZShhR3JvdXBOb2RlKVxyXG4gICAgICAgICAgICBpZihuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgICAgICBhR3JvdXBOb2RlPW5leHRHcm91cE5vZGVcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWFyY2hUZXh0PWZ1bmN0aW9uKHN0cil7XHJcbiAgICBpZihzdHI9PVwiXCIpIHJldHVybiBudWxsO1xyXG4gICAgLy9zZWFyY2ggZnJvbSBjdXJyZW50IHNlbGVjdCBpdGVtIHRoZSBuZXh0IGxlYWYgaXRlbSBjb250YWlucyB0aGUgdGV4dFxyXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChzdHIsICdpJyk7XHJcbiAgICB2YXIgc3RhcnROb2RlXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgc3RhcnROb2RlPXRoaXMuZmlyc3RMZWFmTm9kZSgpXHJcbiAgICAgICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHRoZVN0cj1zdGFydE5vZGUubmFtZTtcclxuICAgICAgICBpZih0aGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlIFxyXG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2Ugc3RhcnROb2RlPXRoaXMuc2VsZWN0ZWROb2Rlc1swXVxyXG5cclxuICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIHZhciBmcm9tTm9kZT1zdGFydE5vZGU7XHJcbiAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICB2YXIgbmV4dE5vZGU9dGhpcy5uZXh0TGVhZk5vZGUoZnJvbU5vZGUpXHJcbiAgICAgICAgaWYobmV4dE5vZGU9PXN0YXJ0Tm9kZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIG5leHROb2RlU3RyPW5leHROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYobmV4dE5vZGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmcm9tTm9kZT1uZXh0Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5nZXRBbGxMZWFmTm9kZUFycj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGFsbExlYWY9W11cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57XHJcbiAgICAgICAgYWxsTGVhZj1hbGxMZWFmLmNvbmNhdChnbi5jaGlsZExlYWZOb2RlcylcclxuICAgIH0pXHJcbiAgICByZXR1cm4gYWxsTGVhZjtcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIHZhciBuZXdBcnI9W10uY29uY2F0KHRoaXMuc2VsZWN0ZWROb2RlcylcclxuICAgIG5ld0Fyci5wdXNoKGxlYWZOb2RlKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGFycil7XHJcbiAgICB2YXIgbmV3QXJyID0gdGhpcy5zZWxlY3RlZE5vZGVzXHJcbiAgICB2YXIgZmlsdGVyQXJyPWFyci5maWx0ZXIoKGl0ZW0pID0+IG5ld0Fyci5pbmRleE9mKGl0ZW0pIDwgMClcclxuICAgIG5ld0FyciA9IG5ld0Fyci5jb25jYXQoZmlsdGVyQXJyKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZShncm91cE5vZGUuaW5mbylcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGVBcnI9ZnVuY3Rpb24obGVhZk5vZGVBcnIsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uZGltKClcclxuICAgIH1cclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz10aGlzLnNlbGVjdGVkTm9kZXMuY29uY2F0KGxlYWZOb2RlQXJyKVxyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmhpZ2hsaWdodCgpXHJcbiAgICB9XHJcblxyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXModGhpcy5zZWxlY3RlZE5vZGVzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRibENsaWNrTm9kZT1mdW5jdGlvbih0aGVOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGUodGhlTm9kZSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc29ydEFsbExlYXZlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLnNvcnROb2Rlc0J5TmFtZSgpfSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBncm91cCBub2RlLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVHcm91cE5vZGUocGFyZW50VHJlZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRUcmVlPXBhcmVudFRyZWVcclxuICAgIHRoaXMuaW5mbz1vYmpcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXM9W10gLy9pdCdzIGNoaWxkIGxlYWYgbm9kZXMgYXJyYXlcclxuICAgIHRoaXMubmFtZT1vYmouZGlzcGxheU5hbWU7XHJcbiAgICB0aGlzLmNyZWF0ZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnJlZnJlc2hOYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTS5lbXB0eSgpXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ3My1saW1lXCJcclxuICAgIGVsc2UgdmFyIGxibENvbG9yPVwidzMtZ3JheVwiIFxyXG4gICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuXHJcbiAgICBcclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgaWYoaWNvbkxhYmVsKXtcclxuICAgICAgICAgICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpICAgIFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J1wiK2xibENvbG9yK1wiJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG5cclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyl7XHJcbiAgICAgICAgdmFyIHRhaWxCdXR0b249dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQodGFpbEJ1dHRvbilcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyXCIgc3R5bGU9XCJwYWRkaW5nOjhweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRUcmVlLnNlbGVjdEdyb3VwTm9kZSh0aGlzKSAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuaXNPcGVuPWZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gIHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmV4cGFuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNsaWNrU2VsZj1mdW5jdGlvbihtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVkcmF3TGFiZWwoKVxyXG5cclxuXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgICAgIH1lbHNlIGlmKGUuc2hpZnRLZXkpe1xyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubm9NdWx0aXBsZVNlbGVjdEFsbG93ZWQpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICB2YXIgYWxsTGVhZk5vZGVBcnI9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5nZXRBbGxMZWFmTm9kZUFycigpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgxID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZSlcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDIgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMpXHJcbiAgICAgICAgICAgICAgICBpZihpbmRleDE9PS0xIHx8IGluZGV4Mj09LTEpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgICAgIC8vc2VsZWN0IGFsbCBsZWFmIGJldHdlZW5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgbG93ZXJJPSBNYXRoLm1pbihpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoaWdoZXJJPSBNYXRoLm1heChpbmRleDEsaW5kZXgyKVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBtaWRkbGVBcnI9YWxsTGVhZk5vZGVBcnIuc2xpY2UobG93ZXJJLGhpZ2hlckkpICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbWlkZGxlQXJyLnB1c2goYWxsTGVhZk5vZGVBcnJbaGlnaGVySV0pXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbihtaWRkbGVBcnIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoY2xpY2tEZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLnJlZHJhd0xhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvbGFiZWw+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICB2YXIgcm93SGVpZ2h0PWljb25MYWJlbC5oZWlnaHQoKVxyXG4gICAgICAgIG5hbWVEaXYuY3NzKFwibGluZS1oZWlnaHRcIixyb3dIZWlnaHQrXCJweFwiKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZURpdilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiXX0=
