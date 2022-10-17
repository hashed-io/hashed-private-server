'use strict'

const {
  createGroupSchema
} = require('./schemas')

/**
 * Provides the endpoints for user authentication
 */
module.exports = async function (fastify, opts) {
  fastify.register(async function (fastify) {
    fastify.addHook('preHandler', fastify.authenticate)
    /**
     * Enables the creation of a group
     */
    fastify.post('/create', { schema: createGroupSchema }, createGroupHandler)
  })
}

module.exports[Symbol.for('plugin-meta')] = {
  decorators: {
    fastify: [
      'group'
    ]
  }
}

async function createGroupHandler (req, reply) {
  const payload = req.hydrateWithUserId('body', 'userId')
  return this.group.createGroup(payload)
}
