
import { JWT } from '@fl/tokens'
import { config } from '@fl/config'

export const authenticate = async (req, res, next) => {
    req.user = undefined

    const jwt = new JWT({
        algorithm: 'RS256',
        issuer: config.siteIssuer,
        audience: config.siteAudience,
        jwks: config.siteJWKS,
        expires: config.accessExpires
    })

    let accessToken
    console.log('req.headers', req.headers)
    if (req?.headers?.authorization) {
        const [tokenType, tokenValue] = req.headers.authorization.split(' ')
        console.log('tokenType', tokenType)
        console.log('tokenValue', tokenValue)

        if (tokenType === 'Bearer') {
            accessToken = tokenValue
        }

    }

    console.log('accessToken', accessToken)

    if (accessToken) {
        let claims
        try {
            claims = await jwt.verify(accessToken)
        } catch (err) {
            console.error(err)
            res.status(401).send("Unauthenticated")
            return
        } 

        console.log('claims', claims)
        
        const { sub: playerId, email } = claims.payload
        console.log('playerId, email', playerId, email)
    
        if (playerId) {
            req.user = { playerId, email }
        }
    }

    

    console.log('req.user before next()', req.user)
    next()
}
