const { Unauthorized, BadRequest } = require('http-errors')
const { gql } = require('graphql-request')

const INSERT_SHARED_DATA = gql`
  mutation insert_shared_data($fromUserId: uuid!, $toUserId: uuid!, $originalOwnedDataId: Int!, $cid: String!, $name: String!, $description: String!, $sharedAt: timestamptz!, $iv: String!, $mac: String!) {
    insert_shared_data_one(object: {
      from_user_id: $fromUserId, 
      to_user_id: $toUserId, 
      original_owned_data_id: $originalOwnedDataId,
      cid: $cid,
      name: $name, 
      description: $description,    
      shared_at: $sharedAt,
      iv: $iv,
      mac: $mac
    }) {      
        id
        from_user_id
        to_user_id
        original_owned_data_id
        name
        description
        cid
        shared_at
        iv
        mac
    }
  }
`

const UPDATE_SHARED_DATA_METADATA = gql`
  mutation update_shared_data_metadata($id: Int!, $name: String!, $description: String!) {
    update_shared_data(
    _set: {
      name: $name, 
      description: $description
    },
    where:{
      id:{_eq: $id}
    }) {      
      affected_rows
    }
  }
`
const FIND_SHARED_DATA_BY_ID = gql`
  query find_by_id($id: Int!) {
    shared_data_by_pk(id: $id) {      
      id
      from_user_id
      to_user_id
      original_owned_data_id
      name
      description
      cid
      shared_at
      iv
      mac
    }
  }
`
/**
 * Provides the functionality to manage shared data
 */
class SharedData {
  constructor ({ gql, ownedData }) {
    this.gql = gql
    this.ownedData = ownedData
  }

  /**
   * @desc Inserts a shared data record
   *
   * @param {string} fromUserId id of the user that is sharing the data
   * @param {string} toUserId id of the user that the data is being shared with
   * @param {string} originalOwnedDataId the id of the original owned data record
   * @param {string} description a description related to the payload
   * @param {string} cid of the ciphered payload
   * @param {string} iv initialization vector
   * @param {string} mac message authentication code
   * @return {Object} with the following structure
   * {
   *     id: 2,
   *     from_user_id: 'e585c25c-c0a3-4439-8798-80c497fc43c3',
   *     to_user_id: '23be168a-0e20-4438-8adb-af40c85442e5',
   *     original_owned_data_id: 528,
   *     name: 'name1',
   *     description: 'description1',
   *     cid: 'cid1',
   *     shared_at: '2022-07-08T02:37:06.268+00:00',
   *     iv: 'iv1',
   *     mac: 'mac1'
   *  }
   *
   * @throws BadRequest if the data has already been shared with the user
   */
  async share ({
    fromUserId,
    toUserId,
    originalOwnedDataId,
    cid,
    iv,
    mac
  }) {
    if (fromUserId === toUserId) {
      throw new BadRequest('Can not share data with self')
    }
    const {
      name,
      description
    } = await this.ownedData.getById({
      id: originalOwnedDataId,
      ownerUserId: fromUserId
    })

    try {
      return await this._insert({
        fromUserId,
        toUserId,
        originalOwnedDataId,
        cid,
        name,
        description,
        iv,
        mac
      })
    } catch (err) {
      if (err.message.includes('shared_data_original_owned_data_id_to_user_id_key')) {
        throw new BadRequest(`Data with id: ${originalOwnedDataId} has already been shared with user: ${toUserId}`)
      }
      throw err
    }
  }

  async _insert ({
    fromUserId,
    toUserId,
    originalOwnedDataId,
    name,
    description,
    cid,
    iv,
    mac
  }) {
    const { insert_shared_data_one: sharedData } = await this.gql.request(INSERT_SHARED_DATA, {
      fromUserId,
      toUserId,
      originalOwnedDataId,
      name,
      description,
      cid,
      iv,
      mac,
      sharedAt: new Date()
    })
    return sharedData
  }

  /**
   * @desc Updates the metadata related to an shared data record
   *
   * @param {int} id id of an existant record
   * @param {string} toUserId id of the user with which the data was shared with
   * @param {string} name a name related to the payload
   * @param {string} description a description related to the payload
   * @return {Object} with the following structure
   * {"affected_rows": 1}
   */
  async updateMetadata ({
    id,
    toUserId,
    name,
    description
  }) {
    await this.getById({
      id,
      toUserId
    })
    const { update_shared_data: affectedRows } = await this.gql.request(UPDATE_SHARED_DATA_METADATA, {
      id,
      name,
      description
    })
    return affectedRows
  }

  /**
   * @desc Gets a shared data record by id
   *
   * @param {int} id id of an existant record
   * @param {string} fromUserId id of the user that is sharing the data
   * @param {string} toUserId id of the user that the data is being shared with
   *
   * @return {Object} with the following structure
   * {
   *     id: 66,
   *     from_user_id: '8351136a-1bee-452c-a5f5-c9a61e3ed31c',
   *     to_user_id: 'c76a3c66-9a18-4aaf-8ebf-78baa0b3d26b',
   *     original_owned_data_id: 749,
   *     name: 'name1',
   *     description: 'description1',
   *     cid: 'cid1',
   *     shared_at: '2022-07-08T02:55:06.488+00:00',
   *     iv: 'iv1',
   *     mac: 'mac1'
   *   }
   * @throws BadRequest if the shared data record does not exist
   * @throws Unauthorized if the fromUserId is set and he is not the
   * user who shared the data or if the toUserId is set and he is not the
   * user with whom the data was shared
   */
  async getById ({
    id,
    fromUserId = null,
    toUserId = null
  }) {
    const sharedData = await this.findById(id)
    if (!sharedData) {
      throw new BadRequest(`Shared data with id: ${id} not found`)
    }
    if (fromUserId && sharedData.from_user_id !== fromUserId) {
      throw new Unauthorized(`User: ${fromUserId} is not the sharer of data with id: ${id}`)
    }
    if (toUserId && sharedData.to_user_id !== toUserId) {
      throw new Unauthorized(`User: ${toUserId} has not been shared data with id: ${id}`)
    }
    return sharedData
  }

  /**
   * @desc Finds an shared data record by id
   *
   * @param {int} id id of an existant record
   *
   * @return {Object} with the following structure
   * {
   *   "id": 69,
   *   "name": "name1",
   *   "description": "desc1",
   *   "from_user": {
   *     "id": "d76d2baf-a9a9-4980-929c-1d3d467810c7",
   *     "address": "5FWtfhKTuGKm9yWqzApwTfiUL4UPWukJzEcCTGYDiYHsdKaG",
   *     "public_key": "PUB_K1_7afYoQhA8aSMLGtGiKiBqrwfVAGNoxbcPcredSvZ3rkny9QoyG"
   *   },
   *   "to_user": {
   *     "id": "a917e2b7-596e-4bc0-be79-9828b0b3ea78",
   *     "address": "5FSuxe2q7qCYKie8yqmM56U4ovD1YtBb3DoPzGKjwZ98vxua",
   *     "public_key": "PUB_K1_6m2Gq41FwDoeY1z5SNssjx8wYgLc4UbAKtvNDrdDhVCx8CU2B8"
   *   },
   *   "original_owned_data": {
   *     "id": 184,
   *     "type": "json"
   *   },
   *   "cid": "QmPn3obcymCxEfKhSUVhvkLsqPytH16ghcCsthqz9A5YA9",
   *   "iv": "899398d07303510df18c58a804acf5b0",
   *   "mac": "cc82141ac5686c15ce79fa4d3a57eeee1d127db6c1e2302d312c2bc6c90a0c81",
   *   "shared_at": "2022-06-15T00:11:56.611+00:00"
   * }
   */
  async findById (id) {
    const { shared_data_by_pk: sharedData } = await this.gql.request(FIND_SHARED_DATA_BY_ID, {
      id
    })
    return sharedData
  }
}

module.exports = SharedData
