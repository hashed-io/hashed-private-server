'use strict'

const {
  shareDataSchema,
  updateSharedDataMetadataSchema
} = require('./schemas')

module.exports = async function (fastify, opts) {
  // Route registration
  // fastify.<method>(<path>, <schema>, <handler>)
  // schema is used to validate the input and serialize the output

  // Logged APIs
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    fastify.post('/share', { schema: shareDataSchema }, shareHandler)
    fastify.post('/update-metadata', { schema: updateSharedDataMetadataSchema }, updateMetadataHandler)
  })
}

// Fastify checks the existance of those decorations before registring `user.js`
module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'sharedData'
    ]
  }
}

// In all handlers `this` is the fastify instance
// The fastify instance used for the handler registration

async function shareHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'fromUserId')
  return this.sharedData.share(payload)
}

async function updateMetadataHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'toUserId')
  return this.sharedData.updateMetadata(payload)
}
