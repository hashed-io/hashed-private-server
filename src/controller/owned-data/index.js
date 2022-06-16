'use strict'

const {
  deleteOwnedDataSchema,
  upsertOwnedDataSchema,
  updateOwnedDataMetadataSchema
} = require('./schemas')

module.exports = async function (fastify, opts) {
  // Route registration
  // fastify.<method>(<path>, <schema>, <handler>)
  // schema is used to validate the input and serialize the output

  // Logged APIs
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    fastify.post('/delete', { schema: deleteOwnedDataSchema }, deleteHandler)
    fastify.post('/upsert', { schema: upsertOwnedDataSchema }, upsertHandler)
    fastify.post('/update-metadata', { schema: updateOwnedDataMetadataSchema }, updateMetadataHandler)
  })
}

// Fastify checks the existance of those decorations before registring `user.js`
module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'ownedData'
    ]
  }
}

// In all handlers `this` is the fastify instance
// The fastify instance used for the handler registration

async function deleteHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'ownerUserId')
  return this.ownedData.deleteById(payload)
}

async function upsertHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'ownerUserId')
  return this.ownedData.upsert(payload)
}

async function updateMetadataHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'ownerUserId')
  return this.ownedData.updateMetadata(payload)
}
