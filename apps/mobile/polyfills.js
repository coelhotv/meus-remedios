// polyfills.js — deve ser importado ANTES de qualquer outro módulo

// SharedArrayBuffer não existe em Hermes/JSC no ambiente React Native
global.SharedArrayBuffer = global.SharedArrayBuffer || global.ArrayBuffer

// URL patch para Hermes RN/Expo Go: new URL() existe mas getters como
// .protocol, .hostname, etc. lançam "not implemented" (Hermes parcial).
// Supabase usa esses getters E setters (Realtime faz url.protocol = 'wss:').
// Estratégia: patch cirúrgico nos getters/setters em falta usando href.
;(function patchHermesURL() {
  if (typeof URL === 'undefined') return

  const proto = URL.prototype

  function needsPatch(prop) {
    try {
      // eslint-disable-next-line no-new
      new URL('https://example.com')[prop]
      return false
    } catch (e) {
      return typeof e.message === 'string' && e.message.includes('not implemented')
    }
  }

  // Parser mínimo baseado em href (href funciona no Hermes)
  function parseHref(href) {
    const m = href.match(
      /^([a-z][a-z0-9+\-.]*:)\/\/([^/:?#@]*)(?::(\d+))?(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i
    )
    if (!m) {
      return { protocol: '', hostname: '', port: '', pathname: '/', search: '', hash: '', origin: 'null' }
    }
    const protocol = (m[1] || '').toLowerCase()
    const hostname = m[2] || ''
    const port = m[3] || ''
    return {
      protocol,
      hostname,
      port,
      pathname: m[4] || '/',
      search: m[5] || '',
      hash: m[6] || '',
      origin: `${protocol}//${hostname}${port ? ':' + port : ''}`,
    }
  }

  function define(prop, getter, setter) {
    if (!needsPatch(prop)) return
    const descriptor = { get: getter, configurable: true }
    if (setter) descriptor.set = setter
    Object.defineProperty(proto, prop, descriptor)
  }

  // protocol — getter + setter (Realtime faz url.protocol = 'wss:')
  define(
    'protocol',
    function () { return parseHref(this.href).protocol },
    function (val) {
      const p = String(val).endsWith(':') ? String(val) : String(val) + ':'
      this.href = this.href.replace(/^[a-z][a-z0-9+\-.]*:/i, p)
    }
  )

  // hostname — getter + setter
  define(
    'hostname',
    function () { return parseHref(this.href).hostname },
    function (val) {
      const { protocol, port, pathname, search, hash } = parseHref(this.href)
      this.href = `${protocol}//${val}${port ? ':' + port : ''}${pathname}${search}${hash}`
    }
  )

  // port — getter + setter
  define(
    'port',
    function () { return parseHref(this.href).port },
    function (val) {
      const { protocol, hostname, pathname, search, hash } = parseHref(this.href)
      const portStr = val ? `:${val}` : ''
      this.href = `${protocol}//${hostname}${portStr}${pathname}${search}${hash}`
    }
  )

  // host — getter + setter
  define(
    'host',
    function () {
      const { hostname, port } = parseHref(this.href)
      return port ? `${hostname}:${port}` : hostname
    },
    function (val) {
      const { protocol, pathname, search, hash } = parseHref(this.href)
      this.href = `${protocol}//${val}${pathname}${search}${hash}`
    }
  )

  // pathname — getter + setter
  define(
    'pathname',
    function () { return parseHref(this.href).pathname },
    function (val) {
      const { protocol, hostname, port, search, hash } = parseHref(this.href)
      const host = port ? `${hostname}:${port}` : hostname
      this.href = `${protocol}//${host}${val}${search}${hash}`
    }
  )

  // search — getter + setter
  define(
    'search',
    function () { return parseHref(this.href).search },
    function (val) {
      const { protocol, hostname, port, pathname, hash } = parseHref(this.href)
      const host = port ? `${hostname}:${port}` : hostname
      const q = val && !val.startsWith('?') ? '?' + val : val
      this.href = `${protocol}//${host}${pathname}${q}${hash}`
    }
  )

  // hash — getter + setter
  define(
    'hash',
    function () { return parseHref(this.href).hash },
    function (val) {
      const { protocol, hostname, port, pathname, search } = parseHref(this.href)
      const host = port ? `${hostname}:${port}` : hostname
      const h = val && !val.startsWith('#') ? '#' + val : val
      this.href = `${protocol}//${host}${pathname}${search}${h}`
    }
  )

  // origin, username, password — só getter (read-only por spec)
  define('origin',   function () { return parseHref(this.href).origin })
  define('username', function () { return '' })
  define('password', function () { return '' })

  // searchParams — getter (URLSearchParams é separado, geralmente funciona)
  define('searchParams', function () {
    const qs = parseHref(this.href).search.slice(1)
    if (typeof URLSearchParams !== 'undefined') return new URLSearchParams(qs)
    const map = new Map()
    qs.split('&').forEach(pair => {
      const idx = pair.indexOf('=')
      if (idx < 0) return
      map.set(decodeURIComponent(pair.slice(0, idx)), decodeURIComponent(pair.slice(idx + 1)))
    })
    return { get: k => map.get(k) ?? null, has: k => map.has(k) }
  })
})()

// URLSearchParams patch para Hermes — substituição incondicional + debug logs
// O detection probe anterior falhou: Hermes não lança em teste sintético mas
// lança em uso real pelo Supabase. Solução: substituir sempre por implementação
// pura ES5 (sem class, sem Symbol.iterator — máxima compatibilidade Hermes).
;(function patchURLSearchParams() {
  console.log('[polyfill] URLSearchParams nativo:', typeof URLSearchParams,
    typeof URLSearchParams !== 'undefined' ? typeof URLSearchParams.prototype.set : 'N/A')

  function HermesURLSearchParams(init) {
    this._pairs = []
    if (!init) return
    if (typeof init === 'string') {
      var qs = init.charAt(0) === '?' ? init.slice(1) : init
      var parts = qs.split('&')
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i]
        if (!part) continue
        var eq = part.indexOf('=')
        if (eq < 0) {
          this._pairs.push([decodeURIComponent(part), ''])
        } else {
          this._pairs.push([
            decodeURIComponent(part.slice(0, eq)),
            decodeURIComponent(part.slice(eq + 1)),
          ])
        }
      }
    } else if (Array.isArray(init)) {
      for (var j = 0; j < init.length; j++) {
        this._pairs.push([String(init[j][0]), String(init[j][1])])
      }
    } else if (init && typeof init === 'object') {
      var keys = Object.keys(init)
      for (var k = 0; k < keys.length; k++) {
        this._pairs.push([String(keys[k]), String(init[keys[k]])])
      }
    }
  }

  HermesURLSearchParams.prototype.append = function (name, value) {
    this._pairs.push([String(name), String(value)])
  }

  HermesURLSearchParams.prototype.set = function (name, value) {
    var k = String(name)
    var v = String(value)
    var found = false
    var result = []
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === k) {
        if (!found) { result.push([k, v]); found = true }
      } else {
        result.push(this._pairs[i])
      }
    }
    if (!found) result.push([k, v])
    this._pairs = result
  }

  HermesURLSearchParams.prototype.get = function (name) {
    var k = String(name)
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === k) return this._pairs[i][1]
    }
    return null
  }

  HermesURLSearchParams.prototype.getAll = function (name) {
    var k = String(name)
    var out = []
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === k) out.push(this._pairs[i][1])
    }
    return out
  }

  HermesURLSearchParams.prototype.has = function (name) {
    var k = String(name)
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] === k) return true
    }
    return false
  }

  HermesURLSearchParams.prototype.delete = function (name) {
    var k = String(name)
    var result = []
    for (var i = 0; i < this._pairs.length; i++) {
      if (this._pairs[i][0] !== k) result.push(this._pairs[i])
    }
    this._pairs = result
  }

  HermesURLSearchParams.prototype.toString = function () {
    var out = []
    for (var i = 0; i < this._pairs.length; i++) {
      out.push(encodeURIComponent(this._pairs[i][0]) + '=' + encodeURIComponent(this._pairs[i][1]))
    }
    return out.join('&')
  }

  HermesURLSearchParams.prototype.forEach = function (cb) {
    for (var i = 0; i < this._pairs.length; i++) {
      cb(this._pairs[i][1], this._pairs[i][0], this)
    }
  }

  global.URLSearchParams = HermesURLSearchParams
  console.log('[polyfill] URLSearchParams substituído — set:', typeof HermesURLSearchParams.prototype.set)
})()
