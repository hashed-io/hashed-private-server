/* eslint-disable camelcase */
const { JWT } = require('../../src/service')
const {
  jwt: jwtConfig
} = require('config')

const jwt = new JWT(jwtConfig)
jwt.init()

describe('Verify Token', () => {
  test('should fail for invalid token', async () => {
    expect.assertions(2)
    assertInvalidToken(null)
    assertInvalidToken('ads')
  })

  test('expired token', async () => {
    expect.assertions(1)
    try {
      jwt.verifyToken('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QtazEifQ.eyJodHRwczovL2hhc3VyYS5pby9qd3QvY2xhaW1zIjp7IngtaGFzdXJhLWFsbG93ZWQtcm9sZXMiOlsidXNlciJdLCJ4LWhhc3VyYS1kZWZhdWx0LXJvbGUiOiJ1c2VyIiwieC1oYXN1cmEtdXNlci1hZGRyZXNzIjoiNURuazZ2UWhBVkRZOXlzWnI4anJxV0pFTkRXWUhhRjN6b3JGQTRkcjlNdGJlaTc3IiwieC1oYXN1cmEtdXNlci1pZCI6ImU4ZjgyNmFjLWRlZGItNGM2NS05ZDlkLTg0Mzc5YzliODEzNCJ9LCJpYXQiOjE2NjczMTg2OTcsInN1YiI6ImU4ZjgyNmFjLWRlZGItNGM2NS05ZDlkLTg0Mzc5YzliODEzNCIsImV4cCI6MTY2NzMyMjI5N30.HsU_KewdvuA-G3ANqy5myO2muhigjC7u_cF6KFCt84O96_8Fd76o_uBuUIPyLOrZVluP4l2vwc-RW8vrL6xDNe8QA4YHNAAoyigLpXQ-bxReBzh9LkJjpOYAAdLIMNn9gq-baAtDY7CkZrnY9NiZ8vqRajHJxT19wobY-ncb2UeqF3XlBB88PHVChK6L2AYa60OkzyVuG4IE2HLSVNaQc39_4tMPbIRbmkJf0JXSLIkadwvXpGRm9kpNqy4rMCJhiYBTjDruJ2tvRILqDEDFV5eezXefRjAkYrrEpYUmaICgboQZm6yIseZ8cKdx_ENhvbms9OuwXcR_QBA1vQE_a1Uyw7fP6IqDCxSemM1I8ih2SpegnH4bBes_SXP2b3pMRlVIEO37GcNLVlwGh3oor4IhBpreRcqgxMdQXh8JomfME6WpZBsEc5kPIDhdd9T5AOCHPAPYBw29GtiP2Xuyr8un2o4cc4_TWxiyFV1Eply8AliJoyB7mAkypXqbSy0Jj78rLIN_36TPN2ibWCM9gYPROqbVxGxur1a0vrzYb57Tp8jnXGd_Rqr_tTtrDH7X8Lgsbe89uZ0oDfQI1t8mCsB6KNrXE1-hm-E2F8VVjRXSvlMIHtXgMDWtfCIqogjQQ0z3k7ocVCWKesHOLxKFwq-Mci5jcV8QVIxh_FQiFBo')
    } catch (error) {
      console.log(error)
      expect(error.message).toContain('jwt expired')
    }
  })
})

function assertInvalidToken (invalidToken) {
  try {
    jwt.verifyToken(invalidToken)
  } catch (error) {
    expect(error.message).toContain('Unable to decode JWT token')
  }
}
