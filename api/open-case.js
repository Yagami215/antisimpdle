const crypto = require('crypto');
const vaultData = require('./_vaultData.json');

const SECRET = process.env.CASE_VAULT_SECRET || 'antisimpdle_case_vault_v1_salt_2026';

// Rate Limiting:
// - Normal mode: 1 request every 10 seconds (~animation duration of crate opening)
// - Fast mode: sliding window anti-spam (up to 5 requests per second)
const normalRequests = new Map();
const NORMAL_COOLDOWN_MS = 9800; // ~10 seconds matching 9.75s animation

const fastRequests = new Map();
const FAST_WINDOW_MS = 1000;
const FAST_MAX_PER_WINDOW = 5;

function checkRateLimit(ip, mode = 'normal') {
  const now = Date.now();

  if (mode === 'normal') {
    const lastTime = normalRequests.get(ip) || 0;
    const elapsed = now - lastTime;
    if (elapsed < NORMAL_COOLDOWN_MS) {
      const waitSec = Math.max(1, Math.ceil((NORMAL_COOLDOWN_MS - elapsed) / 1000));
      return {
        allowed: false,
        waitSec: waitSec,
        error: `Opening cases too fast! Please wait ${waitSec}s for the animation to finish.`
      };
    }
    normalRequests.set(ip, now);
    return { allowed: true };
  } else {
    let timestamps = fastRequests.get(ip) || [];
    timestamps = timestamps.filter(t => now - t < FAST_WINDOW_MS);
    if (timestamps.length >= FAST_MAX_PER_WINDOW) {
      fastRequests.set(ip, timestamps);
      return {
        allowed: false,
        waitSec: 1,
        error: 'Opening cases too fast! Please wait a moment.'
      };
    }
    timestamps.push(now);
    fastRequests.set(ip, timestamps);
    return { allowed: true };
  }
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clientIp = req.headers['x-forwarded-for']
    ? req.headers['x-forwarded-for'].split(',')[0].trim()
    : (req.socket ? req.socket.remoteAddress : '127.0.0.1');

  let mode = 'normal';
  if (req.query && req.query.mode) {
    mode = String(req.query.mode).toLowerCase();
  } else if (req.body && req.body.mode) {
    mode = String(req.body.mode).toLowerCase();
  }
  if (mode !== 'normal' && mode !== 'fast') {
    mode = 'normal';
  }

  const rateCheck = checkRateLimit(clientIp, mode);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', String(rateCheck.waitSec));
    return res.status(429).json({
      error: rateCheck.error,
      retryAfter: rateCheck.waitSec
    });
  }

  try {
    const r = Math.random() * 100;
    let chosenRarity = 'common';

    if (mode === 'fast') {
      // Fast mode probabilities (Cruelty and Glitch cannot drop):
      // HELL 0.001%, Divine 0.1%, Rainbow 0.2%, Secret 0.5%, Mythic 1.0%,
      // Legendary 2.0%, Epic 5.0%, Verity 10.0%, Rare 15.0%, Uncommon 26.0%, Common 40.199%
      if (r < 0.001) {
        chosenRarity = 'hell';        // 0.001%
      } else if (r < 0.101) {
        chosenRarity = 'divine';      // 0.1%
      } else if (r < 0.301) {
        chosenRarity = 'rainbow';     // 0.2%
      } else if (r < 0.801) {
        chosenRarity = 'secret';      // 0.5%
      } else if (r < 1.801) {
        chosenRarity = 'mythic';      // 1.0%
      } else if (r < 3.801) {
        chosenRarity = 'legendary';   // 2.0%
      } else if (r < 8.801) {
        chosenRarity = 'epic';        // 5.0%
      } else if (r < 18.801) {
        chosenRarity = 'verity';      // 10.0%
      } else if (r < 33.801) {
        chosenRarity = 'rare';        // 15.0%
      } else if (r < 59.801) {
        chosenRarity = 'uncommon';    // 26.0%
      } else {
        chosenRarity = 'common';      // 40.199%
      }
    } else {
      // Normal mode probabilities:
      // HELL 0.001%, Glitch 0.05%, Divine 0.1%, Rainbow 0.2%, Secret 0.5%, Mythic 1.0%,
      // Legendary 2.0%, Epic 5.0%, Verity 10.0%, Rare 11.0%, Uncommon 20.0%, Cruelty 20.0%, Common 30.149%
      if (r < 0.001) {
        chosenRarity = 'hell';        // 0.001%
      } else if (r < 0.051) {
        chosenRarity = 'glitch';      // 0.05%
      } else if (r < 0.151) {
        chosenRarity = 'divine';      // 0.1%
      } else if (r < 0.351) {
        chosenRarity = 'rainbow';     // 0.2%
      } else if (r < 0.851) {
        chosenRarity = 'secret';      // 0.5%
      } else if (r < 1.851) {
        chosenRarity = 'mythic';      // 1.0%
      } else if (r < 3.851) {
        chosenRarity = 'legendary';   // 2.0%
      } else if (r < 8.851) {
        chosenRarity = 'epic';        // 5.0%
      } else if (r < 18.851) {
        chosenRarity = 'verity';      // 10.0%
      } else if (r < 29.851) {
        chosenRarity = 'rare';        // 11.0%
      } else if (r < 49.851) {
        chosenRarity = 'uncommon';    // 20.0%
      } else if (r < 69.851) {
        chosenRarity = 'cruelty';     // 20.0%
      } else {
        chosenRarity = 'common';      // 30.149%
      }
    }

    // Select random item from matching pool (milestones/albums never drop; fast mode excludes normal-only items)
    const matchingItems = Object.values(vaultData.items).filter(
      it => {
        if (it.rarity !== chosenRarity || it.rarity === 'album' || it.rarity === 'milestone') return false;
        if (mode === 'fast' && it.exclusiveMode === 'normal') return false;
        return true;
      }
    );
    const winner = matchingItems.length > 0 
      ? matchingItems[Math.floor(Math.random() * matchingItems.length)]
      : Object.values(vaultData.items).find(it => it.rarity !== 'album' && it.rarity !== 'milestone' && (mode !== 'fast' || it.exclusiveMode !== 'normal')) || Object.values(vaultData.items)[0];

    const isServerGated = !!winner.serverGated;
    const isWasm = winner.rarity === 'divine' || winner.rarity === 'hell';
    const isEncrypted = !!winner.isEncrypted;

    let token = null;
    let mediaUrl = null;

    if (isServerGated) {
      // Cruelty & Glitch: Encrypted on server, token required
      token = crypto.createHmac('sha256', SECRET)
        .update(`${winner.id}:${winner.numId}`)
        .digest('hex');
      mediaUrl = `/api/media?id=${encodeURIComponent(winner.id)}&token=${encodeURIComponent(token)}`;
    } else {
      // All other rarities (Divine & HELL via client WASM, Common to Secret via static paths)
      token = null;
      mediaUrl = null;
    }

    return res.status(200).json({
      success: true,
      mode: mode,
      item: {
        id: winner.id,
        name: winner.name,
        rarity: winner.rarity,
        rarityName: winner.rarityName,
        rarityColor: winner.rarityColor,
        rarityGlow: winner.rarityGlow,
        orbImage: winner.orbImage,
        isVideo: winner.isVideo,
        mimeType: winner.mimeType || null,
        isEncrypted: isEncrypted,
        serverGated: isServerGated,
        exclusiveMode: winner.exclusiveMode || null,
        vaultFile: winner.vaultFile || null,
        itemCode: winner.itemCode || null,
        path: winner.path || null
      },
      token: token,
      mediaUrl: mediaUrl
    });
  } catch (err) {
    console.error('[API /api/open-case] Error:', err);
    return res.status(500).json({ error: 'Server unbox failure' });
  }
};
