const { addressSchema, publicKeySchema, uuidTypeSchema } = require('../../schemas')

const tags = ['login']

const generateChallengeSchema = {
  tags,
  body: {
    type: 'object',
    required: ['address'],
    properties: {
      address: addressSchema
    }
  },
  response: {
    200: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' }
      }
    }
  }
}

const loginSchema = {
  tags,
  body: {
    type: 'object',
    required: ['address', 'signature'],
    properties: {
      address: addressSchema,
      signature: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      required: ['refresh_token', 'token', 'user'],
      properties: {
        refresh_token: { type: 'string' },
        token: { type: 'string' },
        user: {
          type: 'object',
          required: ['id', 'address', 'public_key', 'security_data'],
          properties: {
            id: uuidTypeSchema,
            address: addressSchema,
            public_key: publicKeySchema,
            security_data: { type: 'string', nullable: true }
          }
        }
      }
    }
  }
}

module.exports = {
  generateChallengeSchema,
  loginSchema
}
