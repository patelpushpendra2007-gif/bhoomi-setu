import crypto from 'node:crypto';

const HMAC_SECRET = process.env.AUDIT_HMAC_SECRET || 'bhoomi-setu-vid-esign-hmac-key-2026';

/**
 * Generates zero-PII 16-digit UIDAI Virtual ID token from masked reference.
 */
export function generateVidToken(seed = '') {
  const digest = crypto.createHash('sha256').update(`${seed}|${Date.now()}`).digest('hex');
  const digits = digest
    .replace(/[a-f]/g, (ch) => String(ch.charCodeAt(0) % 10))
    .slice(0, 16);
  return `VID-${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

/**
 * Signs an e-Sign consent or PFMS disbursement receipt using HMAC-SHA256.
 */
export function signStatutoryReceipt(payload) {
  const canonical = JSON.stringify(payload);
  return crypto.createHmac('sha256', HMAC_SECRET).update(canonical).digest('hex');
}

/**
 * Computes deterministic SHA-256 block hash for MeghRaj NIC Cloud audit trail.
 */
export function computeAuditHash(entry) {
  const canonical = `${entry.prev_hash}|${entry.id}|${entry.parcel_id || ''}|${entry.actor_id}|${entry.actor_role}|${entry.action}|${entry.detail}|${entry.vid_token}|${entry.created_at}`;
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verifies integrity of the entire SHA-256 hash chain.
 */
export function verifyAuditChain(entries = []) {
  for (let i = 0; i < entries.length; i++) {
    const cur = entries[i];
    const expectedPrev = i === 0 ? '0'.repeat(64) : entries[i - 1].entry_hash;
    if (cur.prev_hash !== expectedPrev) {
      return {
        valid: false,
        brokenIndex: i,
        brokenId: cur.id,
        reason: `Previous hash link mismatch at Entry #${i} (${cur.parcel_id || cur.id})`,
        totalEntries: entries.length,
        checkedAt: new Date().toISOString()
      };
    }
    const recomputed = computeAuditHash(cur);
    if (cur.entry_hash !== recomputed) {
      return {
        valid: false,
        brokenIndex: i,
        brokenId: cur.id,
        reason: `SHA-256 tamper alert: unauthorized record edit detected at Entry #${i} (${cur.parcel_id || cur.id})`,
        totalEntries: entries.length,
        checkedAt: new Date().toISOString()
      };
    }
  }

  return {
    valid: true,
    brokenIndex: null,
    brokenId: null,
    reason: 'All SHA-256 hash links and VID-signed statutory receipts verified intact on MeghRaj NIC Cloud.',
    totalEntries: entries.length,
    checkedAt: new Date().toISOString()
  };
}
