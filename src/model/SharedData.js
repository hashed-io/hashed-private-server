const { Unauthorized, BadRequest } = require('http-errors')
const { gql } = require('graphql-request')

const INSERT_SHARED_DATA = gql`
  mutation insert_shared_data($fromUserId: uuid!, $toUserId: uuid!, $originalOwnedDataId: Int!, $cid: String!, $name: String!, $description: String!, $sharedAt: timestamptz!) {
    insert_shared_data_one(object: {
      from_user_id: $fromUserId, 
      to_user_id: $toUserId, 
      original_owned_data_id: $originalOwnedDataId,
      cid: $cid,
      name: $name, 
      description: $description,    
      shared_at: $sharedAt
    }) {      
        id
        from_user_id
        to_user{
          id
          address
        }
        original_owned_data{
          id
          type
          name
          description
          cid
          original_cid
          owner_user_id
          started_at
          ended_at
          is_deleted
          
        }
        name
        description
        cid
        shared_at
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
    }
  }
`

class SharedData {
  constructor ({ gql, ownedData }) {
    this.gql = gql
    this.ownedData = ownedData
  }

  async share ({
    fromUserId,
    toUserId,
    originalOwnedDataId,
    cid
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
        description
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
    cid
  }) {
    const { insert_shared_data_one: sharedData } = await this.gql.request(INSERT_SHARED_DATA, {
      fromUserId,
      toUserId,
      originalOwnedDataId,
      name,
      description,
      cid,
      sharedAt: new Date()
    })
    return sharedData
  }

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

  async findById (id) {
    const { shared_data_by_pk: sharedData } = await this.gql.request(FIND_SHARED_DATA_BY_ID, {
      id
    })
    return sharedData
  }
}

module.exports = SharedData
