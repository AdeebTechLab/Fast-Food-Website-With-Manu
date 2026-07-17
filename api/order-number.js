// Hands out a sequential order number - 00001, 00002, 00003, ... - shared
// across every customer's device, stored in the same Vercel Blob store the
// admin-edited menu already lives in. No auth required: any visitor placing
// an order via WhatsApp checkout can call this once per order.

const COUNTER_PATHNAME = 'order-counter.json';

async function readCounter() {
  try {
    const { head } = require('@vercel/blob');
    const blob = await head(COUNTER_PATHNAME);
    const response = await fetch(blob.url, { cache: 'no-store' });
    if (!response.ok) throw new Error('blob fetch failed');
    const data = await response.json();
    const next = Number(data && data.next);
    return Number.isFinite(next) && next > 0 ? next : 1;
  } catch {
    return 1;
  }
}

async function writeCounter(next) {
  const { put } = require('@vercel/blob');
  await put(COUNTER_PATHNAME, JSON.stringify({ next }), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Best-effort sequential counter. Vercel Blob has no atomic
    // read-modify-write, so two orders placed in the same instant could in
    // rare cases receive the same number - acceptable for a small
    // restaurant's order volume, and far simpler than standing up a real
    // database just for a counter.
    const current = await readCounter();
    await writeCounter(current + 1);

    const orderNumber = String(current).padStart(5, '0');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ orderNumber });
  } catch (err) {
    res.status(500).json({
      error:
        'Could not generate an order number. Make sure Vercel Blob storage is connected to this project (' +
        err.message +
        ')',
    });
  }
};
