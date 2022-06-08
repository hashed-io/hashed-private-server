const {
  uuidTypeSchema,
  nameSchema,
  cidSchema,
  descriptionSchema,
  responseAffectedRows,
  ownedDataSchema
} = require('../../schemas')
const tags = ['owned-data']

const upsertOwnedDataSchema = {
  tags,
  body: {
    type: 'object',
    required: ['name', 'description', 'type', 'cid'],
    properties: {
      id: { type: 'integer' },
      ownerUserId: uuidTypeSchema,
      name: nameSchema,
      description: descriptionSchema,
      type: { type: 'string', minLength: 2, maxLength: 10 },
      cid: cidSchema
    }
  },
  response: {
    200: ownedDataSchema
  }
}

const deleteOwnedDataSchema = {
  tags,
  body: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' }
    }
  },
  response: responseAffectedRows
}

module.exports = {
  deleteOwnedDataSchema,
  upsertOwnedDataSchema
}
