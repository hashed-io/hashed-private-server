'use strict'

const {
  generateChallengeSchema,
  loginSchema
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
  return this.login.login(req.body)
}
