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

  getSharedDataPayload ({ fromUserId, toUserId, ownedData, count }) {
    return {
      fromUserId,
      toUserId,
      originalOwnedDataId: ownedData.id,
      name: ownedData.name,
      description: ownedData.description,
      cid: `cid${count}`,
      iv: `iv${count}`,
      mac: `mac${count}`
    }
  }

  getOwnedDataPayload (ownerUserId, count) {
    return {
      ownerUserId,
      name: `name${count}`,
      description: `description${count}`,
      type: `type${count}`,
      cid: `cid${count}`,
      original_cid: `cid${count}`,
      iv: `iv${count}`,
      mac: `mac${count}`,
      is_deleted: false
    }
  }
}

module.exports = Util
