const { Unauthorized, BadRequest } = require('http-errors')
const { gql } = require('graphql-request')

const INSERT_OWNED_DATA = gql`
  mutation insert_owned_data($ownerUserId: uuid!, $name: String!, $description: String!, $type: String!, $cid: String!, $originalCID: String!, $startedAt: timestamptz!, $iv: String!, $mac: String!) {
    insert_owned_data_one(object: {
      owner_user_id: $ownerUserId, 
      name: $name, 
      description: $description,
      type: $type,
      cid: $cid,
      original_cid: $originalCID, 
      started_at: $startedAt
      iv: $iv,
      mac: $mac
    }) {      
        id
        owner_user_id
        name
        description
        type
        cid
        original_cid
        started_at
        ended_at
        iv
        mac
        is_deleted
    }
  }
`

const NEW_OWNED_DATA_VERSION = gql`
  mutation new_owned_data_version($ownerUserId: uuid!, $originalCID: String!, $timestamp: timestamptz!, $name: String!, $description: String!, $type: String!, $cid: String!, $iv: String!, $mac: String!) {
  update_owned_data(
  _set: {
    ended_at: $timestamp
  },
  where:{
    _and:[
      {
        owner_user_id:{_eq: $ownerUserId}    
      },
      {
        original_cid:{_eq: $originalCID}    
      },
      {
        ended_at:{_is_null: true }    
      }
    ]
    
  }) {      
    affected_rows
  }
  insert_owned_data_one(object: {
      owner_user_id: $ownerUserId, 
      name: $name, 
      description: $description,
      type: $type,
      cid: $cid,
      original_cid: $originalCID, 
      started_at: $timestamp,
      iv: $iv,
      mac: $mac
    }) {      
      id
      owner_user_id
      name
      description
      type
      cid
      original_cid
      started_at
      ended_at
      iv
      mac
      is_deleted
    }
}
`

const UPDATE_OWNED_DATA_METADATA = gql`
  mutation update_owned_data_metadata($id: Int!, $name: String!, $description: String!) {
    update_owned_data(
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

const DELETE_OWNED_DATA_BY_ID = gql`
  mutation delete_owned_data($id: Int!, $endedAt: timestamptz!) {
    update_owned_data(
    _set: {
      ended_at: $endedAt,
      is_deleted: true
    },
    where:{
        id:{_eq: $id}    
    }) {      
      affected_rows
    }
  }
`

const FIND_OWNED_DATA_BY_ID = gql`
  query find_by_id($id: Int!) {
    owned_data_by_pk(id: $id) {      
      id
      owner_user_id
      name
      description
      type
      cid
      original_cid
      started_at
      ended_at
      iv
      mac
      is_deleted
    }
  }
`

// const SET_OWNED_DATA_END = gql`
//   mutation set_owned_data_end($ownerUserId: uuid!, $originalCID: String!, $endedAt: timestamptz!) {
//     update_owned_data(
//     _set: {
//       ended_at: $endedAt
//     },
//     where:{
//       _and:[
//         {
//           owner_user_id:{_eq: $ownerUserId}
//         },
//         {
//           original_cid:{_eq: $originalCID}
//         },
//         {
//           ended_at:{_is_null: true }
//         }
//       ]

//     }) {
//         affected_rows
//         returning{
//           id
//           owner_user_id
//           name
//           description
//           type
//           cid
//           original_cid
//           started_at
//           ended_at
//         }
//     }
//   }
// `

class OwnedData {
  constructor ({ gql }) {
    this.gql = gql
  }

  async upsert ({
    id,
    ownerUserId,
    name,
    description,
    type,
    cid,
    iv,
    mac
  }) {
    if (id) {
      const {
        cid: currentCID
      } = await this.getById({ id, ownerUserId })
      if (currentCID !== cid) {
        return this._insertNewVersion({
          ownerUserId,
          name,
          description,
          type,
          cid,
          originalCID: currentCID,
          iv,
          mac
        })
      } else {
        await this._updateMetadata({
          id,
          name,
          description
        })
        return await this.getById({ id })
      }
    } else {
      return this._insert({
        ownerUserId,
        name,
        description,
        type,
        cid,
        iv,
        mac
      })
    }
  }

  async deleteById ({ id, ownerUserId }) {
    await this.getById({ id, ownerUserId })
    const { update_owned_data: affectedRows } = await this.gql.request(DELETE_OWNED_DATA_BY_ID, {
      id,
      endedAt: new Date()
    })
    console.log('response: ', affectedRows)
    return affectedRows
  }

  async findById (id) {
    const { owned_data_by_pk: ownedData } = await this.gql.request(FIND_OWNED_DATA_BY_ID, {
      id
    })
    return ownedData
  }

  async getById ({
    id,
    ownerUserId = null,
    current = true
  }) {
    const ownedData = await this.findById(id)
    if (!ownedData) {
      throw new BadRequest(`Owned data with id: ${id} not found`)
    }
    if (current) {
      if (ownedData.is_deleted) {
        throw new BadRequest(`Owned data with id: ${id} is already deleted`)
      }

      if (ownedData.ended_at) {
        throw new BadRequest(`Owned data with id: ${id} is not the current version`)
      }
    }
    if (ownerUserId && ownedData.owner_user_id !== ownerUserId) {
      throw new Unauthorized(`User: ${ownerUserId} does not own data with id: ${id}`)
    }
    return ownedData
  }

  async _insert ({
    ownerUserId,
    name,
    description,
    type,
    cid,
    iv,
    mac
  }) {
    const { insert_owned_data_one: ownedData } = await this.gql.request(INSERT_OWNED_DATA, {
      ownerUserId,
      name,
      description,
      type,
      cid,
      iv,
      mac,
      originalCID: cid,
      startedAt: new Date()
    })
    return ownedData
  }

  async updateMetadata ({
    id,
    ownerUserId,
    name,
    description
  }) {
    await this.getById({ id, ownerUserId })
    return this._updateMetadata({
      id,
      name,
      description
    })
  }

  async _updateMetadata ({
    id,
    name,
    description
  }) {
    const { update_owned_data: affectedRows } = await this.gql.request(UPDATE_OWNED_DATA_METADATA, {
      id,
      name,
      description
    })
    return affectedRows
  }

  async _insertNewVersion ({
    ownerUserId,
    name,
    description,
    type,
    cid,
    originalCID,
    iv,
    mac

  }) {
    const { insert_owned_data_one: ownedData } = await this.gql.request(NEW_OWNED_DATA_VERSION, {
      ownerUserId,
      name,
      description,
      type,
      cid,
      originalCID,
      iv,
      mac,
      timestamp: new Date()
    })
    return ownedData
  }
}

module.exports = OwnedData
