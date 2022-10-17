const { BadRequest } = require('http-errors')
const { gql } = require('graphql-request')
const { v4: uuid } = require('uuid')
const { GroupRole } = require('../const')

const CREATE_GROUP = gql`
  mutation create_group($id: uuid!, $name:String!, $publicKey:String!, $securityData:String!, $roleId:Int!, $userId:uuid!) {
  insert_actor_one(object: {
    id: $id,
    name: $name,
    public_key: $publicKey,
    security_data: $securityData,
    users:{
      data:{
        role_id: $roleId,
        user_id: $userId
      }
    }
  }){
    id
  }
}

`

/**
 * Provides the logic to manage groups
 */
class Group {
  constructor ({ gql }) {
    this.gql = gql
  }

  /**
   * @desc Creates a group
   *
   * @param {string} address the user's address
   * @return {Object} with the following structure
   * {
   *    id: "3e4d4c1e-c0b1-433f-be0a-56cb662ce284"
   * }
   */
  async createGroup ({
    name,
    publicKey,
    securityData,
    userId
  }) {
    const id = uuid()
    try {
      await this.gql.request(CREATE_GROUP, {
        id,
        name,
        publicKey,
        securityData,
        userId,
        roleId: GroupRole.Admin
      })
    } catch (error) {
      if (error.message.includes('duplicate key value violates unique constraint "actor_name_key"')) {
        throw new BadRequest(`A group with the name: ${name} already exists`)
      }
      throw error
    }
    return {
      id
    }
  }
}

module.exports = Group
