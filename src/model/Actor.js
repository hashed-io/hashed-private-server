const { gql } = require('graphql-request')

const FIND_FULL_ACTORS = gql`
  query find_full_actors($actorIds: [uuid!]!, $userId: uuid!) {
    actor(where:{
      _and:{
        id:{_in:$actorIds}
        _or:[
          {
            id: {
              _eq:$userId
            }
          },
          {
            users:{
              user_id:{
                _eq:$userId
              }
            }
          }
        ]
      }
    }){
      id
      name
      address
      publicKey: public_key,
      privateKey: security_data
    }
  }
`

/**
 * Provides the logic to manage groups
 */
class Actor {
  constructor ({ gql }) {
    this.gql = gql
  }

  /**
   * @desc Finds the full actor data for those the user has access to
   *
   * @param {Array<uuid>} actorIds ids of the actors to retrieve data for
   *  @param {uuid} userId id of the logged in user
   *
   * @return {Object} with the following structure
   *[
   *   {
   *     "id": "551030f9-6054-4ffa-b02d-a275398ec50d",
   *     "name": "group2",
   *     "address": null,
   *     "publicKey": "pubKey2",
   *     "privateKey": "privKey2"
   *   },
   *   {
   *     "id": "c3bd2937-2cc0-4ba5-96c5-f4b7789c69cc",
   *     "name": "group7",
   *     "address": null,
   *     "publicKey": "PUB_K1_6xibRtjDceGuKMCf89idJtX3sCmBZKKt4biwFbsGEz2ju7",
   *     "privateKey": "PVT_K1_eLS9Q18vqubRdqSwpFc2xqNJNrPRPxVXYty1881sE9s7GZoxF"
   *   }
   * ]
   */
  async findFullActors ({ actorIds, userId }) {
    const { actor: actors } = await this.gql.request(FIND_FULL_ACTORS, {
      actorIds,
      userId
    })
    return actors
  }
}

module.exports = Actor
