const express = require('express');
const router = express.Router();
const tokenService = require('../security/tokenService');

/**
 * @openapi
 * /.well-known/jwks.json:
 *   get:
 *     summary: Public JSON Web Key Set for verifying tokens issued by this service's /auth endpoints.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: RFC 7517 JWK Set containing the current signing key's public half.
 */
router.get('/jwks.json', (req, res, next) => {
  try {
    return res.status(200).json(tokenService.getJwks());
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
