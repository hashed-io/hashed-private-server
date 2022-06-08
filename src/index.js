// const fs = require('fs')
// const path = require('path')
const fastify = require('fastify')
const fp = require('fastify-plugin')
const {
  Login,
  OwnedData,
  User,
  SharedData
} = require('./model')
const {
  GQL,
  JWT
} = require('./service')
// const { DBConnection } = require('./db')
// const { MsGraph, Storage, Vault } = require('./service')

const {
  gql: gqlConfig,
  login: loginConfig,
  jwt: jwtConfig,
  swagger
} = require('config')

function unhandledRejectionHandler (error) {
  console.error(error)
  process.exit(1)
}

async function decorateFastifyInstance (fastify) {
  const gql = new GQL(gqlConfig)
  const jwt = new JWT(jwtConfig)
  jwt.init()
  const user = new User({
    gql
  })
  const ownedData = new OwnedData({
    gql
  })
  const sharedData = new SharedData({
    gql,
    ownedData
  })
  const login = new Login({
    gql,
    jwt,
    opts: loginConfig,
    user
  })
  fastify.decorate('login', login)
  fastify.decorate('user', user)
  fastify.decorate('ownedData', ownedData)
  fastify.decorate('sharedData', sharedData)
  fastify.decorate('jwt', jwt)

  fastify.decorateRequest('hydrateWithUserId', function (obj = 'body', propName = 'userId') {
    const toHydrate = this[obj]
    return {
      ...toHydrate,
      [propName]: this.user.userId
    }
  })
}

async function main () {
  const {
    NODE_ENV,
    PORT // has to come from env vars because its set by app services
  } = process.env
  // Create the instance
  const server = fastify({ logger: { prettyPrint: NODE_ENV !== 'production' }, pluginTimeout: 20000 })
  // Add application assets and manifest.json serving
  server.log.info(`cwd: ${process.cwd()}`)
  server.register(require('@fastify/swagger'), swagger)
    .register(require('@fastify/cors'), {
      origin: true,
      credentials: true,
      allowedHeaders: 'Authorization, Origin, X-Requested-With, Content-Type, Accept'
    })
    .register(fp(decorateFastifyInstance))
    .register(require('./plugin/verify-jwt'))
    // .register(require('./plugin/authorize'))
    // APIs modules
    .register(require('./controller/login'), { prefix: '/api/login' })
    .register(require('./controller/jwk'), { prefix: '/api/jwk' })
    .register(require('./controller/owned-data'), { prefix: '/api/owned-data' })
    .register(require('./controller/shared-data'), { prefix: '/api/shared-data' })
    .setErrorHandler(function (error, request, reply) {
      server.log.info(error)
      reply.send(error)
    })
  await server.ready()
  server.swagger()
  // Run the server!
  await server.listen(PORT || 3000, '0.0.0.0')
  return server
}

process.on('unhandledRejection', unhandledRejectionHandler)
main().catch(unhandledRejectionHandler)
