import legacyAuth from "@moreillon/express_identification_middleware"
import oidcAuth from "@moreillon/express-oidc"
import { NextFunction, Request, Response } from "express"

export const { OIDC_JWKS_URI, IDENTIFICATION_URL } = process.env

export const getAuthMiddlewares = () => {
  if (OIDC_JWKS_URI) {
    console.log(`[Auth] Using OIDC auth with URL ${OIDC_JWKS_URI}`)
    return {
      strictAuth: oidcAuth({ jwksUri: OIDC_JWKS_URI }),
      laxAuth: oidcAuth({ jwksUri: OIDC_JWKS_URI, lax: true }),
    }
  } else if (IDENTIFICATION_URL) {
    console.log(`[Auth] Using legacy auth with URL ${IDENTIFICATION_URL}`)
    return {
      strictAuth: legacyAuth({ url: IDENTIFICATION_URL }),
      laxAuth: legacyAuth({ url: IDENTIFICATION_URL, lax: true }),
    }
  } else {
    console.log(`[Auth] Authentication is NOT configures`)
    const dummyMiddleware = (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      next()
    }
    return {
      strictAuth: dummyMiddleware,
      laxAuth: dummyMiddleware,
    }
  }
}
