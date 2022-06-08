const tags = ['jwk']

const listPublicKeysSchema = {
  tags,
  response: {
    200: {
      type: 'object',
      required: ['keys'],
      properties: {
        keys: {
          type: 'array',
          items: {
            type: 'object',
            required: ['kid', 'use', 'kty', 'alg', 'n', 'e'],
            properties: {
              kid: { type: 'string' },
              use: { type: 'string' },
              kty: { type: 'string' },
              alg: { type: 'string' },
              n: { type: 'string' },
              e: { type: 'string' }
            }
          }
        }
      }
    }
  }
}

module.exports = {
  listPublicKeysSchema
}
