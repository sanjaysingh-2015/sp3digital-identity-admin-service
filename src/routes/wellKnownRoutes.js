const express = require('express');
const router = express.Router();
const tokenService = require('../security/tokenService');

/**
 * @openapi
 * /.well-known/jwks.json:
 *   get:
 *     summary: Public JSON Web Key Set
 *     description: Returns the public RSA signing key used to verify JWTs issued by the Identity Admin Service.
 *     tags:
 *       - Well-Known
 *     responses:
 *       200:
 *         description: RFC 7517 JSON Web Key Set
 *       500:
 *         description: Unable to generate JWKS
 */
router.get('/jwks.json', (req, res) => {
  try {
    const jwks = tokenService.getJwks();

    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Type', 'application/json');

    return res.status(200).json(jwks);
  } catch (error) {
    console.error('JWKS generation failed:', error);

    return res.status(500).json({
      error: {
        code: 'JWKS_ERROR',
        message: 'Unable to generate JWKS'
      }
    });
  }
});

module.exports = router;