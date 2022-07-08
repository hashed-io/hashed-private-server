'use strict'

const {
  shareDataSchema,
  updateSharedDataMetadataSchema
} = require('./schemas')

/**
 * Provides the endpoints for managing shared data records
 */
module.exports = async function (fastify, opts) {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    /**
     * Inserts shared data record
     */
    fastify.post('/share', { schema: shareDataSchema }, shareHandler)
    /**
     * Updates the metadata of a shared data record
     */
    fastify.post('/update-metadata', { schema: updateSharedDataMetadataSchema }, updateMetadataHandler)
  })
}

module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'sharedData'
    ]
  }
}

async function shareHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'fromUserId')
  return this.sharedData.share(payload)
}

async function updateMetadataHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'toUserId')
  return this.sharedData.updateMetadata(payload)
}
