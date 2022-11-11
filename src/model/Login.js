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

/**
 * Provides the logic to support Login authentication
 */
class Login {
  constructor ({ gql, jwt, opts, user }) {
    this.gql = gql
    this.opts = opts
    this.user = user
    this.jwt = jwt
  }

  /**
   * @desc Generates a new challenge for the user trying to authenticate to sign
   *
   * @param {string} address the user's address
   * @return {Object} with the following structure
   * {
   *  "message": "challenge: 43fbec1e-6f04-4486-931a-a0b1f90bb4d3"
   * }
   */
  async generateChallenge ({ address }) {
    const message = 'challenge: ' + uuid()
    // const message = 'challenge: 43fbec1e-6f04-4486-931a-a0b1f90bb4d3'
    await this._upsertChallenge(address, message)
    return {
      message
    }
  }

  /**
   * @desc Verifies the signed challenge and on success produces a JWT token
   *
   * @param {string} address the users address
   * @param {string} signature the signed challenge
   * @return {Object} with the following structure
   * {
   * "refreshToken": "jwt refresh token",
   *  "payload" :{
   *   "token": "jwt token",
   *   "user": {
   *     "id": "user id",
   *     "address": "user address"
   *     "public_key": "public key",
   *     "security_data": "private key"
   *   }
   *  }
   * }
   * @throws Unauthorized when there is no current challenge for the address or
   *         if the signature is invalid
   */
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
      refreshToken: await this._getJWTRefreshToken(user),
      payload: {
        token: await this._getJWTToken(user),
        user
      }
    }
  }

  /**
   * @desc Verifies the refresh token, and if valid generates a new JWT token
   *
   * @param {string} refreshToken
   *
   * @return {Object} with the following structure
   * {
   *  "token": "jwt token",
   *  }
   * @throws Unauthorized if refresh token is no longer valid
   *
   */
  async refresh (refreshToken) {
    console.log('refreshToken: ', refreshToken)
    const { address } = this.jwt.verifyToken(refreshToken)
    const user = await this.user.findByAddress(address)
    return {
      token: await this._getJWTToken(user)
    }
  }

  refreshTokenTTLSeconds () {
    return this.opts.refreshTokenExpirationTimeMins * 60
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
    const {
      tokenExpirationTimeMins
    } = this.opts
    const tokenContent = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': [Role.USER],
        'x-hasura-default-role': Role.USER,
        'x-hasura-user-address': address,
        'x-hasura-user-id': id
      },
      ...this._getJWTBaseTokenContent(id)
    }
    return this.jwt.getJWTToken(tokenContent, tokenExpirationTimeMins)
  }

  async _getJWTRefreshToken ({ id, address }) {
    const {
      refreshTokenExpirationTimeMins
    } = this.opts
    const tokenContent = {
      ...this._getJWTBaseTokenContent(id),
      address
    }
    return this.jwt.getJWTToken(tokenContent, refreshTokenExpirationTimeMins)
  }

  _getJWTBaseTokenContent (id) {
    return {
      iat: Math.floor(Date.now() / 1000),
      sub: id
    }
  }
}

module.exports = Login
