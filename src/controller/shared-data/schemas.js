const {
  uuidTypeSchema,
  nameSchema,
  cidSchema,
  descriptionSchema,
  timestampSchema,
  responseAffectedRows,
  addressSchema,
  ownedDataSchema
} = require('../../schemas')
const tags = ['shared-data']

const shareDataSchema = {
  tags,
  body: {
    type: 'object',
    required: ['toUserId', 'originalOwnedDataId', 'cid'],
    properties: {
      toUserId: uuidTypeSchema,
      originalOwnedDataId: { type: 'integer' },
      cid: cidSchema
    }
  },
  response: {
    200: {
      type: 'object',
      required: ['id', 'from_user_id', 'to_user', 'original_owned_data', 'name', 'description', 'cid', 'shared_at'],
      properties: {
        id: { type: 'integer' },
        from_user_id: uuidTypeSchema,
        to_user: {
          type: 'object',
          required: ['id', 'address'],
          properties: {
            id: uuidTypeSchema,
            address: addressSchema
          }
        },
        original_owned_data: ownedDataSchema,
        name: nameSchema,
        description: descriptionSchema,
        cid: cidSchema,
        shared_at: timestampSchema
      }
    }
  }
}

const updateSharedDataMetadataSchema = {
  tags,
  body: {
    type: 'object',
    required: ['id', 'description', 'name'],
    properties: {
      id: { type: 'integer' },
      name: nameSchema,
      description: descriptionSchema
    }
  },
  response: responseAffectedRows
}

module.exports = {
  shareDataSchema,
  updateSharedDataMetadataSchema
}
