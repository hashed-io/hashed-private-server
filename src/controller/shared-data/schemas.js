const {
  uuidTypeSchema,
  nameSchema,
  cidSchema,
  descriptionSchema,
  timestampSchema,
  responseAffectedRows
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
      required: ['id', 'from_user_id', 'to_user_id', 'original_owned_data_id', 'name', 'description', 'cid', 'shared_at'],
      properties: {
        id: { type: 'integer' },
        from_user_id: uuidTypeSchema,
        to_user_id: uuidTypeSchema,
        original_owned_data_id: { type: 'integer' },
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
