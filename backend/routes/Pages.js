const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const auth = require('../middleware/auth');

// CREATE a page
router.post('/', auth, async (req, res) => {
  try {
    const { title, slug } = req.body;
    if (!title || !slug) return res.status(400).json({ msg: 'Title and slug are required' });

    const existing = await Page.findOne({ slug });
    if (existing) return res.status(409).json({ msg: 'Slug already taken' });

    const page = await Page.create({ title, slug, owner: req.userId, blocks: [] });
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// LIST current user's pages
router.get('/', auth, async (req, res) => {
  try {
    const pages = await Page.find({ owner: req.userId }).sort({ createdAt: -1 });
    res.json(pages);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET one page by slug — PUBLIC (no auth) — this is your future live-render endpoint
router.get('/public/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug });
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET one page by id — for the editor (auth required, must be owner)
router.get('/:id', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// UPDATE page title/slug
router.put('/:id', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    const { title, slug } = req.body;
    if (title) page.title = title;
    if (slug) page.slug = slug;
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// DELETE page
router.delete('/:id', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    await page.deleteOne();
    res.json({ msg: 'Page deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ADD a block
router.post('/:id/blocks', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    const { type, content } = req.body;
    const validTypes = ['text', 'heading', 'image', 'ai-generated'];
    if (!validTypes.includes(type)) return res.status(400).json({ msg: 'Invalid block type' });

    const order = page.blocks.length;
    page.blocks.push({ type, content, order, lastEditedBy: req.userId });
    await page.save();
    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// EDIT a block
router.put('/:id/blocks/:blockId', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    const block = page.blocks.id(req.params.blockId);
    if (!block) return res.status(404).json({ msg: 'Block not found' });

    if (req.body.content !== undefined) block.content = req.body.content;
    block.lastEditedBy = req.userId;
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// DELETE a block
router.delete('/:id/blocks/:blockId', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    page.blocks.id(req.params.blockId).deleteOne();
    // re-sequence order after delete
    page.blocks.forEach((b, i) => (b.order = i));
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// REORDER blocks — expects { orderedBlockIds: [id1, id2, id3, ...] }
router.put('/:id/blocks/reorder', auth, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ msg: 'Page not found' });
    if (page.owner.toString() !== req.userId) return res.status(403).json({ msg: 'Not authorized' });

    const { orderedBlockIds } = req.body;
    orderedBlockIds.forEach((blockId, index) => {
      const block = page.blocks.id(blockId);
      if (block) block.order = index;
    });
    page.blocks.sort((a, b) => a.order - b.order);
    await page.save();
    res.json(page);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;