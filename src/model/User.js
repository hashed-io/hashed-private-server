const { gql } = require('graphql-request')
const { v4: uuid } = require('uuid')

// mutation update_user($id: uuid!, $publicKey: String!, $securityData: String!) {
//   update_user(
//     _set: {
//      public_key: $publicKey, security_data: $securityData
//     },
//     where:{
//       id:{
//         _eq:$id
//       },
//       _and:{
//         public_key:{
//           _is_null: true
//         }
//       }
//     }
//   ) {
//       affected_rows
//     }
//   }

const FIND_USER = gql`
  query($address: String!) {
    user(
      where:{
        address: {_eq:$address}
      }
    ) {
      id
      address
      public_key,
      security_data
    }
  }
`

const INSERT_USER_IF_NOT_EXISTS = gql`
  mutation($id: uuid!, $address: String!) {
    insert_user_one(object: {
      id: $id,
      address: $address
    }, on_conflict:{constraint:user_address_key, update_columns:[]}
    ) {
      id
      address
    }
  }
`

/**
 * Provides the logic find and insert user related data
 */
class User {
  constructor ({ gql }) {
    this.gql = gql
  }

  /**
   * @desc Finds a user by address
   *
   * @param {string} address the user's address
   * @return {Object} with the following structure
   * {
   *    "id": "user id",
   *    "address": "user address"
   *    "public_key": "public key",
   *    "security_data": "private key"
   * }
   */
  async findByAddress (address) {
    const { user: users } = await this.gql.request(FIND_USER, {
      address
    })
    return users.length ? users[0] : null
  }

  /**
   * @desc Inserts a user in case it not already exists
   *
   * @param {string} address the user's address
   */
  async insertIfNotExists (address) {
    await this.gql.request(INSERT_USER_IF_NOT_EXISTS, {
      id: uuid(),
      address
    })
  }

  /**
   * @desc Checks if the address already exists in the user table
   *
   * @param {string} address the user's address
   * @return {boolean} indicates if its a new user
   */
  async isNewUser (address) {
    return !await this.findByAddress(address)
  }
}

module.exports = User
