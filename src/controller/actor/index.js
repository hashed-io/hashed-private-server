'use strict'

const {
  findFullActorsSchema
} = require('./schemas')

/**
 * Provides the endpoints for actor related operations
 */
module.exports = async function (fastify, opts) {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    /**
     * Enables the retrieving of actor details the user has access to
     */
    fastify.post('/find-full', { schema: findFullActorsSchema }, findFullActorsHandler)
  })
}

module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'actor'
    ]
  }
}

async function findFullActorsHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'userId')
  return this.actor.findFullActors(payload)
}
