/* eslint-disable camelcase */
const { Unauthorized } = require('http-errors')
const { GQL } = require('../../src/service')
const { OwnedData } = require('../../src/model')
const Util = require('../support/Util')
const {
  gql: gqlConfig
} = require('config')

let ownedData = null
let util = null
beforeAll(async () => {
  const gql = new GQL(gqlConfig)
  ownedData = new OwnedData({
    gql
  })
  util = new Util({ gql })
})

describe('Upsert', () => {
  test('New record', async () => {
    const { id: ownerUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    assertOwnedData(expectedOwnedData, actualOwnedData)
    assertOwnedData(expectedOwnedData, await ownedData.findById(actualOwnedData.id))
  })

  test('Update record same cid', async () => {
    const { id: ownerUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    let actualOwnedData = await ownedData.upsert(expectedOwnedData)
    assertOwnedData(expectedOwnedData, actualOwnedData)
    expectedOwnedData.id = actualOwnedData.id
    expectedOwnedData.name = 'name updated'
    expectedOwnedData.description = 'description updated'
    actualOwnedData = await ownedData.upsert(expectedOwnedData)
    assertOwnedData(expectedOwnedData, actualOwnedData)
    assertOwnedData(expectedOwnedData, await ownedData.findById(actualOwnedData.id))
  })

  test('Update record different cid, should create a new version of the record', async () => {
    const { id: ownerUserId } = await util.newUser()
    let expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    let actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const oldVersionId = actualOwnedData.id
    assertOwnedData(expectedOwnedData, actualOwnedData)
    expectedOwnedData.id = actualOwnedData.id
    expectedOwnedData.cid = 'cid updated'
    expectedOwnedData.description = 'description updated'
    actualOwnedData = await ownedData.upsert(expectedOwnedData)
    expectedOwnedData.id = null
    // assert new version of record
    assertOwnedData(expectedOwnedData, actualOwnedData)
    assertOwnedData(expectedOwnedData, await ownedData.findById(actualOwnedData.id))
    // assert old version of record
    expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    expectedOwnedData.id = oldVersionId
    expectedOwnedData.ended_at = 'not null'
    assertOwnedData(expectedOwnedData, await ownedData.findById(oldVersionId))
  })
})

describe('Soft delete', () => {
  test('successful deleteById', async () => {
    const { id: ownerUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    assertOwnedData(expectedOwnedData, actualOwnedData)
    const id = actualOwnedData.id
    const { affected_rows } = await ownedData.deleteById({ id, ownerUserId })
    expect(affected_rows).toBe(1)
    expectedOwnedData.id = id
    expectedOwnedData.ended_at = 'not null'
    expectedOwnedData.is_deleted = true
    assertOwnedData(expectedOwnedData, await ownedData.findById(id))
  })

  test('Should throw unauthorized for non owner trying to deleteById', async () => {
    expect.assertions(2)
    const { id: ownerUserId } = await util.newUser()
    const { id: nonOwnerUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const id = actualOwnedData.id
    try {
      await ownedData.deleteById({ id, ownerUserId: nonOwnerUserId })
    } catch (err) {
      expect(err).toBeInstanceOf(Unauthorized)
      expect(err.message).toContain('does not own data with id')
    }
  })

  describe('Update metadata', () => {
    test('updateMetadata', async () => {
      const { id: ownerUserId } = await util.newUser()
      const expectedOwnedData = util.getOwnedDataPayload(ownerUserId, 1)
      const actualOwnedData = await ownedData.upsert(expectedOwnedData)
      assertOwnedData(expectedOwnedData, actualOwnedData)
      const id = actualOwnedData.id
      const name = 'name updated'
      const description = 'description updated'
      expectedOwnedData.id = id
      expectedOwnedData.name = name
      expectedOwnedData.description = description
      const { affected_rows } = await ownedData.updateMetadata({
        id,
        name,
        description,
        ownerUserId
      })
      expect(affected_rows).toBe(1)
      assertOwnedData(expectedOwnedData, await ownedData.findById(id))
    })
  })
})

function assertOwnedData (expected, actual) {
  if (expected.id) {
    expect(actual.id).toBe(expected.id)
  } else {
    expect(actual.id).not.toBeNull()
  }
  expect(actual.owner_user_id).toBe(expected.ownerUserId)
  expect(actual.name).toBe(expected.name)
  expect(actual.description).toBe(expected.description)
  expect(actual.type).toBe(expected.type)
  expect(actual.cid).toBe(expected.cid)
  expect(actual.original_cid).toBe(expected.original_cid)
  expect(actual.iv).toBe(expected.iv)
  expect(actual.mac).toBe(expected.mac)
  expect(actual.started_at).not.toBeNull()
  if (expected.ended_at) {
    expect(actual.ended_at).not.toBeNull()
  } else {
    expect(actual.ended_at).toBeNull()
  }
  expect(actual.is_deleted).toBe(expected.is_deleted)
}
