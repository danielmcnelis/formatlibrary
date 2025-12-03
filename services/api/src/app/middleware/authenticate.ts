
import { JWT } from '@fl/tokens'
import { config } from '@fl/config'

export const authenticate = async (req, res, next) => {
    req.user = undefined

    const jwt = new JWT({
        algorithm: 'RS256',
        issuer: config.siteIssuer,
        audience: config.siteAudience,
        jwks: JSON.parse(config.siteJWKS),
        expires: config.accessExpires
    })

    let accessToken

    if (req?.headers?.authorization) {
        const [tokenType, tokenValue] = req.headers.authorization.split(' ')
        
        if (tokenType === 'Bearer') {
            accessToken = tokenValue
        }
    }

    if (accessToken) {
        let claims
        try {
            claims = await jwt.verify(accessToken)
        } catch (err) {
            console.error(err)
            res.clearCookie('access').status(401).send("Unauthenticated")
            return
        }
        
        const { sub: playerId, email } = claims.payload
    
        if (playerId) {
            req.user = { playerId, email }
        }
    } else {
        res.status(401).send("Unauthenticated")
        return
    }

    next()
}