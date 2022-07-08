/* eslint-disable camelcase */
const { GQL } = require('../../src/service')
const { User } = require('../../src/model')
const Util = require('../support/Util')
const {
  gql: gqlConfig
} = require('config')

let user = null
let util = null
beforeAll(async () => {
  const gql = new GQL(gqlConfig)
  user = new User({
    gql
  })
  util = new Util({
    gql
  })
})

describe('User tests', () => {
  test('insertIfNotExists', async () => {
    const address1 = util.newAddress()
    expect(await user.findByAddress(address1)).toBeNull()
    await user.insertIfNotExists(address1)
    assertUser(address1, await user.findByAddress(address1))
    // should not fail for duplicate key
    await user.insertIfNotExists(address1)
    assertUser(address1, await user.findByAddress(address1))
  })
  test('isNewUser', async () => {
    const address1 = util.newAddress()
    expect(await user.isNewUser(address1)).toBe(true)
    await user.insertIfNotExists(address1)
    expect(await user.isNewUser(address1)).toBe(false)
  })
})

function assertUser (expectedAddress, user) {
  const {
    id,
    address,
    public_key,
    security_data

  } = user
  expect(address).toBe(expectedAddress)
  expect(id).not.toBeNull()
  expect(public_key).toBeNull()
  expect(security_data).toBeNull()
}
