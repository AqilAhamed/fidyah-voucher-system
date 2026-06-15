const crypto = require('crypto');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY;

if (!SECRET_KEY) {
  throw new Error('SECRET_KEY is not set in .env file!');
}

/**
 * Generates a cryptographically signed payload string to embed in a QR code.
 * Format: base64(JSON payload) + "." + base64(HMAC-SHA256 signature)
 * A standard QR scanner will just see gibberish — only your merchant app
 * can send it to the backend for verification.
 */
function generateSignedPayload(voucherId, userId, amount) {
  const payload = JSON.stringify({
    v_id: voucherId,
    u_id: userId,
    amt: amount,
    iss: Date.now() // issued timestamp — for audit trail
  });

  const base64Payload = Buffer.from(payload).toString('base64url');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(base64Payload)
    .digest('base64url');

  return `${base64Payload}.${signature}`;
}

/**
 * Verifies a scanned QR payload.
 * Returns the decoded data object if valid, or null if tampered/invalid.
 */
function verifyPayload(scannedString) {
  try {
    if (!scannedString || !scannedString.includes('.')) return null;

    const [base64Payload, signature] = scannedString.split('.');

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64Payload)
      .digest('base64url');

    // Timing-safe comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expBuffer)) return null;

    const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf8');
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}

module.exports = { generateSignedPayload, verifyPayload };
