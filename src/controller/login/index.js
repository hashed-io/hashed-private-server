'use strict'

const {
  generateChallengeSchema,
  loginSchema
} = require('./schemas')

module.exports = async function (fastify, opts) {
  // Route registration
  // fastify.<method>(<path>, <schema>, <handler>)
  // schema is used to validate the input and serialize the output

  // Logged APIs
  fastify.register(async function (fastify) {
    fastify.post('/challenge', { schema: generateChallengeSchema }, generateChallengeHandler)
    fastify.post('/login', { schema: loginSchema }, loginHandler)
  })
}

// Fastify checks the existance of those decorations before registring `user.js`
module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'login'
    ]
  }
}

// In all handlers `this` is the fastify instance
// The fastify instance used for the handler registration

async function generateChallengeHandler (req, reply) {
  return this.login.generateChallenge(req.body)
}

async function loginHandler (req, reply) {
  return this.login.login(req.body)
}
