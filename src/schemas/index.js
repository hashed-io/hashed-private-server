
const response204 = {
  204: {
    type: 'null',
    description: 'Empty response on success'
  }
}

const responseAffectedRows = {
  200: {
    type: 'object',
    required: ['affected_rows'],
    properties: {
      affected_rows: { type: 'integer' }
    },
    additionalProperties: false
  }
}

const addressSchema = { type: 'string', minLength: 30, maxLength: 55 }
const publicKeySchema = { type: 'string', minLength: 53, maxLength: 53, nullable: true }
const uuidTypeSchema = { type: 'string', minLength: 36, maxLength: 36 }
const nameSchema = { type: 'string', minLength: 3, maxLength: 25 }
const descriptionSchema = { type: 'string', minLength: 5, maxLength: 150 }
const cidSchema = { type: 'string', minLength: 30, maxLength: 70 }
const timestampSchema = { type: 'string' }
const nullableTimestampSchema = { ...timestampSchema, nullable: true }
const typeSchema = { type: 'string', minLength: 2, maxLength: 10 }

const _ownedDataSchema = (props = {}, required = []) => ({
  type: 'object',
  required: ['owner_user_id', 'name', 'description', 'type', 'cid', 'original_cid', 'started_at', 'ended_at', 'is_deleted'],
  properties: {
    owner_user_id: uuidTypeSchema,
    name: nameSchema,
    description: descriptionSchema,
    type: typeSchema,
    cid: cidSchema,
    original_cid: cidSchema,
    started_at: timestampSchema,
    ended_at: timestampSchema,
    is_deleted: { type: 'boolean' },
    ...props
  },
  additionalProperties: false
})

const ownedDataSchema = _ownedDataSchema({ id: { type: 'integer' } }, ['id'])

module.exports = {
  addressSchema,
  publicKeySchema,
  uuidTypeSchema,
  response204,
  nameSchema,
  descriptionSchema,
  cidSchema,
  timestampSchema,
  nullableTimestampSchema,
  typeSchema,
  ownedDataSchema,
  responseAffectedRows
}
