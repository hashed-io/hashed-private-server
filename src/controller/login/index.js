'use strict'

const {
  generateChallengeSchema,
  loginSchema,
  refreshSchema
} = require('./schemas')

/**
 * Provides the endpoints for user authentication
 */
module.exports = async function (fastify, opts) {
  fastify.register(async function (fastify) {
    /**
     * Generates the challenge that should be signed by the user that wants to authenticate
     */
    fastify.post('/challenge', { schema: generateChallengeSchema }, generateChallengeHandler)
    /**
     * Verifies the signed challenge, and on success produces a JWT token
     */
    fastify.post('/login', { schema: loginSchema }, loginHandler)
    fastify.post('/refresh', { schema: refreshSchema }, refreshHandler)
  })
}

module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'login'
    ]
  }
}

async function generateChallengeHandler (req, reply) {
  return this.login.generateChallenge(req.body)
}

async function loginHandler (req, reply) {
  const {
    refreshToken,
    payload
  } = await this.login.login(req.body)
  reply.setCookie('refreshToken', refreshToken, {
    httpOnly: true,
    sameSite: 'None',
    secure: true,
    maxAge: this.login.refreshTokenTTLSeconds()
  })
  return payload
}

async function refreshHandler (req, reply) {
  console.log('refreshToken: ', JSON.stringify(req.cookies, null, 4))
  const {
    refreshToken
  } = req.cookies
  return this.login.refresh(refreshToken)
}
