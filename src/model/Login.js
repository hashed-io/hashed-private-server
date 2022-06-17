const { Unauthorized } = require('http-errors')
const { v4: uuid } = require('uuid')
const { gql } = require('graphql-request')
const { Role } = require('../const')
const { CryptoUtil, TimeUtil } = require('../util')

const DELETE_CHALLENGE = gql`
  mutation($address: String!) {
    delete_login_challenge_by_pk(address:$address) {
      address
    }
  }
`
const UPSERT_CHALLENGE = gql`
  mutation($address: String!, $challenge: String!, $expiresAt: timestamptz!) {
    insert_login_challenge_one(object: {
      address: $address, challenge: $challenge, expires_at: $expiresAt
    }, on_conflict: {constraint: login_challenge_pkey, update_columns: [challenge, expires_at]}
    ) {      
        address
        challenge
        expires_at
    }
  }
`

const FIND_CHALLENGE = gql`
  query($address: String!) {
    login_challenge_by_pk(
      address:$address
    ) {
      address
      challenge
      expiresAt: expires_at
    }
  }
`

class Login {
  constructor ({ gql, jwt, opts, user }) {
    this.gql = gql
    this.opts = opts
    this.user = user
    this.jwt = jwt
  }

  async generateChallenge ({ address }) {
    const message = 'challenge: ' + uuid()
    // const message = 'challenge: 43fbec1e-6f04-4486-931a-a0b1f90bb4d3'
    await this._upsertChallenge(address, message)
    return {
      message
    }
  }

  async login ({ address, signature }) {
    const challenge = await this._findChallenge(address)
    if (!challenge) {
      throw new Unauthorized(`No challenge found for address: ${address}`)
    }
    const {
      challenge: msg,
      expiresAt
    } = challenge
    if (new Date(expiresAt) < new Date()) {
      throw new Unauthorized(`Challenge for address: ${address} has expired`)
    }
    if (!CryptoUtil.verifySignature(address, msg, signature)) {
      throw new Unauthorized(`Invalid signature for address: ${address}`)
    }
    await this._deleteChallenge(address)
    await this.user.insertIfNotExists(address)
    const user = await this.user.findByAddress(address)
    return {
      refresh_token: 'refreshToken',
      token: await this._getJWTToken(user),
      user
    }
  }

  async _deleteChallenge (address) {
    await this.gql.request(DELETE_CHALLENGE, {
      address
    })
  }

  async _findChallenge (address) {
    const { login_challenge_by_pk: challenge } = await this.gql.request(FIND_CHALLENGE, {
      address
    })
    return challenge
  }

  async _upsertChallenge (address, challenge) {
    await this.gql.request(UPSERT_CHALLENGE, {
      address,
      challenge,
      expiresAt: TimeUtil.futureDate(this.opts.challenge.timeToLiveMinutes)
    })
  }

  async _getJWTToken ({ id, address }) {
    const tokenContent = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': [Role.USER],
        'x-hasura-default-role': Role.USER,
        'x-hasura-user-address': address,
        'x-hasura-user-id': id
      },
      iat: Math.floor(Date.now() / 1000),
      sub: id
    }
    return this.jwt.getJWTToken(tokenContent)
  }
}

module.exports = Login
