const fs = require('fs');
const path = require('path');
const { getSessionFromRequest, readJsonBody } = require('../lib/auth');

const MENU_PATHNAME = 'menu-data.json';

function loadBundledDefault() {
  const filePath = path.join(__dirname, '..', 'data', 'menu-data.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function validateMenu(data) {
  if (!Array.isArray(data)) return 'Menu data must be an array of categories';
  for (const category of data) {
    if (!category || typeof category !== 'object') return 'Each category must be an object';
    if (typeof category.categoryId !== 'string' || !category.categoryId.trim()) {
      return 'Each category needs a non-empty categoryId';
    }
    if (typeof category.title !== 'string' || !category.title.trim()) {
      return 'Each category needs a non-empty title';
    }
    if (!Array.isArray(category.items)) return `Category "${category.categoryId}" is missing an items array`;
    for (const item of category.items) {
      if (!item || typeof item !== 'object') return 'Each item must be an object';
      if (typeof item.name !== 'string' || !item.name.trim()) return 'Every item needs a non-empty name';

      const hasVariants = Array.isArray(item.variants) && item.variants.length > 0;
      if (hasVariants) {
        for (const variant of item.variants) {
          if (!variant || typeof variant !== 'object') return `Item "${item.name}" has an invalid size option`;
          if (typeof variant.label !== 'string' || !variant.label.trim()) {
            return `Item "${item.name}" has a size option missing a label`;
          }
          if (typeof variant.price !== 'number' || Number.isNaN(variant.price) || variant.price < 0) {
            return `Item "${item.name}" - "${variant.label}" needs a valid non-negative price`;
          }
        }
      } else if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price < 0) {
        return `Item "${item.name || '(unnamed)'}" needs a valid non-negative price`;
      } else if (item.oldPrice != null) {
        if (typeof item.oldPrice !== 'number' || Number.isNaN(item.oldPrice) || item.oldPrice < 0) {
          return `Item "${item.name}" has an invalid old price for its discount`;
        }
        if (item.oldPrice <= item.price) {
          return `Item "${item.name}"'s old price must be higher than its current price`;
        }
      }
    }
  }
  return null;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    // Try the live, admin-edited copy in Vercel Blob first. Fall back to the
    // JSON file bundled in the deployment so the site keeps working even
    // before Blob storage has been set up or before any edits have been saved.
    try {
      const { head } = require('@vercel/blob');
      const blob = await head(MENU_PATHNAME);
      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('blob fetch failed');
      const data = await response.json();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(data);
    } catch {
      try {
        const data = loadBundledDefault();
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json(data);
      } catch (err) {
        res.status(500).json({ error: 'Could not load menu data: ' + err.message });
      }
    }
    return;
  }

  if (req.method === 'PUT') {
    const session = getSessionFromRequest(req);
    if (!session) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      res.status(400).json({ error: 'Invalid request body' });
      return;
    }

    const validationError = validateMenu(body);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    try {
      const { put } = require('@vercel/blob');
      await put(MENU_PATHNAME, JSON.stringify(body, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
      res.status(200).json({ ok: true });
    } catch (err) {
      res.status(500).json({
        error:
          'Failed to save menu. Make sure Vercel Blob storage is connected to this project (' +
          err.message +
          ')',
      });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
