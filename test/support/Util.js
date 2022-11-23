const { Keyring } = require('@polkadot/keyring')
const { mnemonicGenerate } = require('@polkadot/util-crypto')
const { User } = require('../../src/model')

class Util {
  constructor ({
    gql
  }) {
    this.keyring = new Keyring()
    this.user = new User({
      gql
    })
  }

  newAddress () {
    return this.keyring.addFromUri(mnemonicGenerate(), {}, 'ed25519').address
  }

  async newUser () {
    const address = this.newAddress()
    await this.user.insertIfNotExists(address)
    return this.user.findByAddress(address)
  }
}

module.exports = Util
