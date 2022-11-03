const { Unauthorized } = require('http-errors')
const jwt = require('jsonwebtoken')
const fs = require('fs')
const path = require('path')
const { createPublicKey } = require('crypto')

class JWT {
  constructor (opts) {
    this.opts = opts
    this._privateKeys = null
    this._publicKeys = null
    this._publicKeysMap = null
  }

  init () {
    const {
      keysPath
    } = this.opts
    const filesNames = fs.readdirSync(keysPath)
    this._privateKeys = []
    this._publicKeys = []
    this._publicKeyCertsMap = {}
    for (const fileName of filesNames) {
      if (path.extname(fileName) === '.key') {
        const privateKeyPath = path.join(keysPath, fileName)
        const publicKeyPath = `${privateKeyPath}.pub`
        if (fs.existsSync(publicKeyPath)) {
          const kid = path.basename(fileName, '.key')
          this._privateKeys.push({
            kid,
            key: fs.readFileSync(privateKeyPath)
          })
          const cert = fs.readFileSync(publicKeyPath)
          const pubKey = createPublicKey(cert)
          this._publicKeys.push({
            kid,
            use: 'sig',
            // kty: 'RSA',
            alg: 'RS256',
            ...pubKey.export({ format: 'jwk' })

          })
          this._publicKeyCertsMap[kid] = cert
        }
      }
    }
    if (!this._privateKeys.length) {
      throw new Error('No JWT keys found')
    }
  }

  getRandomPrivateKey () {
    return this._privateKeys[Date.now() % this._privateKeys.length]
  }

  getPublicKeys () {
    this.assertHasBeenInit()
    return this._publicKeys
  }

  getPublicKeyCert (kid) {
    this.assertHasBeenInit()
    const cert = this._publicKeyCertsMap[kid]
    if (!cert) {
      throw new Error(`Public key for key id: ${kid} not found`)
    }
    return cert
  }

  async getJWTToken (tokenContent, tokenExpirationTimeMins) {
    this.assertHasBeenInit()
    const {
      passphrase
    } = this.opts
    const {
      kid,
      key
    } = this.getRandomPrivateKey()
    console.log('tokenContent: ', tokenContent, 'time', tokenExpirationTimeMins)
    return jwt.sign(
      tokenContent,
      { key, passphrase },
      { algorithm: 'RS256', expiresIn: tokenExpirationTimeMins * 60, keyid: kid }
    )
  }

  verifyToken (token) {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded) {
      throw new Unauthorized('Unable to decode JWT token')
    }
    const { header: { kid } } = jwt.decode(token, { complete: true })
    if (!kid) {
      throw new Unauthorized('kid not found in JWT header')
    }
    return jwt.verify(token, this.getPublicKeyCert(kid))
  }

  assertHasBeenInit () {
    if (this._privateKeys == null) {
      throw new Error('JWT object has not been initialized')
    }
  }
}
module.exports = JWT
