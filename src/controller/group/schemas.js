const { publicKeySchema, uuidTypeSchema, groupNameSchema, securityDataSchema } = require('../../schemas')

const tags = ['group']

const createGroupSchema = {
  tags,
  body: {
    type: 'object',
    required: ['name', 'publicKey', 'securityData'],
    properties: {
      name: groupNameSchema,
      publicKey: publicKeySchema,
      securityData: securityDataSchema
    }
  },
  response: {
    200: {
      type: 'object',
      required: ['id'],
      properties: {
        id: uuidTypeSchema
      }
    }
  }
}

module.exports = {
  createGroupSchema
}
