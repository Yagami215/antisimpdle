const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vaultData = require('./_vaultData.json');

const SECRET = process.env.CASE_VAULT_SECRET || 'antisimpdle_case_vault_v1_salt_2026';

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { id, token } = req.query;

    if (!id || !token) {
      return res.status(400).json({ error: 'Missing id or token parameter' });
    }

    const item = vaultData.items[id];
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Only serverGated items (Verity & Rainbow) are processed by this server API
    // Divine, HELL and Milestones are decrypted strictly locally via client WebAssembly
    if (!item.serverGated) {
      return res.status(400).json({ error: 'This item is not server-gated. Decryption is handled strictly locally in the browser.' });
    }

    // 1. Verify cryptographic proof-of-unlock token strictly with active secret
    const expectedToken = crypto.createHmac('sha256', SECRET)
      .update(`${item.id}:${item.numId}`)
      .digest('hex');

    if (token !== expectedToken) {
      return res.status(403).json({ error: 'Access Denied: You have not unboxed this item.' });
    }

    // 2. Read encrypted vault file from server
    const baseName = path.basename(item.vaultFile);
    const candidatePaths = [
      path.join(__dirname, 'vault', baseName),
      path.join(__dirname, '_vault', baseName),
      path.join(process.cwd(), 'api', 'vault', baseName),
      path.join(process.cwd(), item.vaultFile),
      path.resolve(__dirname, '..', item.vaultFile)
    ];

    const vaultFilePath = candidatePaths.find(p => fs.existsSync(p));
    if (!vaultFilePath) {
      console.error('[API /api/media] Vault file not found in candidate paths:', candidatePaths);
      return res.status(500).json({ error: 'Vault file missing on server' });
    }

    const payload = fs.readFileSync(vaultFilePath);
    const iv = payload.subarray(0, 12);
    const ciphertext = payload.subarray(12, payload.length - 16);
    const tag = payload.subarray(payload.length - 16);

    // 3. Derive 32-byte AES key and decrypt in memory
    const saltCandidates = [SECRET];
    if (process.env.CASE_VAULT_SECRET && process.env.CASE_VAULT_SECRET !== 'antisimpdle_case_vault_v1_salt_2026') {
      saltCandidates.push('antisimpdle_case_vault_v1_salt_2026');
    }

    let decrypted = null;
    let lastErr = null;

    for (const salt of saltCandidates) {
      try {
        const key = crypto.createHash('sha256')
          .update(`${salt}_key_${item.numId}_${item.rawName}`)
          .digest();

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(tag);
        decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        if (decrypted) break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (!decrypted) {
      throw lastErr || new Error('Decryption authentication failed');
    }

    // 4. Stream decrypted media directly to browser
    res.setHeader('Content-Type', item.mimeType || 'image/png');
    res.setHeader('Content-Length', decrypted.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    return res.end(decrypted);
  } catch (err) {
    console.error('[API /api/media] Error:', err);
    return res.status(500).json({ error: 'Failed to decrypt secure vault media', details: err.message });
  }
};
