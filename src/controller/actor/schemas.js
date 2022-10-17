const { nullableAddressSchema, publicKeySchema, uuidTypeSchema, nullableGroupNameSchema, securityDataSchema } = require('../../schemas')

const tags = ['actor']

const findFullActorsSchema = {
  tags,
  body: {
    type: 'object',
    required: ['actorIds'],
    properties: {
      actorIds: {
        type: 'array',
        items: uuidTypeSchema
      }
    }
  },
  response: {
    200: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'address', 'publicKey', 'privateKey'],
        properties: {
          id: uuidTypeSchema,
          name: nullableGroupNameSchema,
          address: nullableAddressSchema,
          publicKey: publicKeySchema,
          privateKey: securityDataSchema
        }
      }
    }
  }
}

module.exports = {
  findFullActorsSchema
}
