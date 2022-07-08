'use strict'

const {
  deleteOwnedDataSchema,
  upsertOwnedDataSchema,
  updateOwnedDataMetadataSchema
} = require('./schemas')

/**
 * Provides the endpoints for managing a users own private data records
 */
module.exports = async function (fastify, opts) {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    /**
     * Soft deletes an owned record
     */
    fastify.post('/delete', { schema: deleteOwnedDataSchema }, deleteHandler)
    /**
     * Inserts or updates an owned record
     */
    fastify.post('/upsert', { schema: upsertOwnedDataSchema }, upsertHandler)
    /**
     * Updates the metadata of an owned record
     */
    fastify.post('/update-metadata', { schema: updateOwnedDataMetadataSchema }, updateMetadataHandler)
  })
}

module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'ownedData'
    ]
  }
}

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
