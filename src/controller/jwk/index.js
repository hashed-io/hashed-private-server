'use strict'

const {
  listPublicKeysSchema
} = require('./schemas')

module.exports = async function (fastify, opts) {
  // Route registration
  // fastify.<method>(<path>, <schema>, <handler>)
  // schema is used to validate the input and serialize the output

  // Logged APIs
  fastify.register(async function (fastify) {
    fastify.get('/list', { schema: listPublicKeysSchema }, listHandler)
  })
}

// Fastify checks the existance of those decorations before registring `user.js`
module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'jwt'
    ]
  }
}

// In all handlers `this` is the fastify instance
// The fastify instance used for the handler registration

function listHandler (req, reply) {
  return {
    keys: this.jwt.getPublicKeys()
  }
}
