/* eslint-disable camelcase */
const { BadRequest, Unauthorized } = require('http-errors')
const { GQL } = require('../../src/service')
const { OwnedData, SharedData } = require('../../src/model')
const Util = require('../support/Util')
const {
  gql: gqlConfig
} = require('config')

let sharedData = null
let ownedData = null
let util = null
beforeAll(async () => {
  const gql = new GQL(gqlConfig)
  ownedData = new OwnedData({
    gql
  })
  sharedData = new SharedData({
    gql,
    ownedData
  })
  util = new Util({ gql })
})

describe('Share', () => {
  test('successful share', async () => {
    const { id: fromUserId } = await util.newUser()
    const { id: toUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(fromUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const expectedSharedData = util.getSharedDataPayload({
      fromUserId,
      toUserId,
      ownedData: actualOwnedData,
      count: 1
    })
    const actualSharedData = await sharedData.share(expectedSharedData)
    assertSharedData(expectedSharedData, actualSharedData)
  })
  test('should throw BadRequest for trying to share the same data to the same user again', async () => {
    expect.assertions(2)
    const { id: fromUserId } = await util.newUser()
    const { id: toUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(fromUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const expectedSharedData = util.getSharedDataPayload({
      fromUserId,
      toUserId,
      ownedData: actualOwnedData,
      count: 1
    })
    await sharedData.share(expectedSharedData)
    try {
      await sharedData.share(expectedSharedData)
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toContain('has already been shared with user')
    }
  })
})

describe('Update metadata', () => {
  test('updateMetadata', async () => {
    const { id: fromUserId } = await util.newUser()
    const { id: toUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(fromUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const expectedSharedData = util.getSharedDataPayload({
      fromUserId,
      toUserId,
      ownedData: actualOwnedData,
      count: 1
    })
    const actualSharedData = await sharedData.share(expectedSharedData)
    assertSharedData(expectedSharedData, actualSharedData)
    const id = actualSharedData.id
    const name = 'updated name'
    const description = 'updated description'
    expectedSharedData.id = id
    expectedSharedData.name = name
    expectedSharedData.description = description
    const { affected_rows } = await sharedData.updateMetadata({
      id,
      toUserId,
      name,
      description
    })
    expect(affected_rows).toBe(1)
    assertSharedData(expectedSharedData, await sharedData.findById(id))
  })
})

describe('GetById', () => {
  test('successful getById', async () => {
    const { id: fromUserId } = await util.newUser()
    const { id: toUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(fromUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const expectedSharedData = util.getSharedDataPayload({
      fromUserId,
      toUserId,
      ownedData: actualOwnedData,
      count: 1
    })
    let actualSharedData = await sharedData.share(expectedSharedData)
    actualSharedData = await sharedData.getById({
      id: actualSharedData.id,
      fromUserId
    })
    assertSharedData(expectedSharedData, actualSharedData)

    actualSharedData = await sharedData.getById({
      id: actualSharedData.id,
      toUserId
    })
    assertSharedData(expectedSharedData, actualSharedData)
  })
  test('should throw BadRequest for non existant record', async () => {
    expect.assertions(2)
    try {
      await sharedData.getById({
        id: 9999999,
        toUserId: 'adasdaasd'
      })
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toContain('Shared data with id: 9999999 not found')
    }
  })
  test('Should throw Unauthorized error for users not related to the shared data', async () => {
    expect.assertions(4)
    const { id: fromUserId } = await util.newUser()
    const { id: toUserId } = await util.newUser()
    const { id: nonRelatedUserId } = await util.newUser()
    const expectedOwnedData = util.getOwnedDataPayload(fromUserId, 1)
    const actualOwnedData = await ownedData.upsert(expectedOwnedData)
    const expectedSharedData = util.getSharedDataPayload({
      fromUserId,
      toUserId,
      ownedData: actualOwnedData,
      count: 1
    })
    const actualSharedData = await sharedData.share(expectedSharedData)
    try {
      await sharedData.getById({
        id: actualSharedData.id,
        fromUserId: nonRelatedUserId
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Unauthorized)
      expect(error.message).toContain('is not the sharer of data with')
    }
    try {
      await sharedData.getById({
        id: actualSharedData.id,
        toUserId: nonRelatedUserId
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Unauthorized)
      expect(error.message).toContain('has not been shared data with')
    }
  })
})

function assertSharedData (expected, actual) {
  expect(actual.id).not.toBeNull()
  expect(actual.name).toBe(expected.name)
  expect(actual.description).toBe(expected.description)
  expect(actual.type).toBe(expected.type)
  expect(actual.cid).toBe(expected.cid)
  expect(actual.original_cid).toBe(expected.original_cid)
  expect(actual.iv).toBe(expected.iv)
  expect(actual.mac).toBe(expected.mac)
  expect(actual.shared_at).not.toBeNull()
  expect(actual.from_user_id).toBe(expected.fromUserId)
  expect(actual.to_user_id).toBe(expected.toUserId)
  expect(actual.original_owned_data_id).toBe(expected.originalOwnedDataId)
}
