const express = require('express');
const router = express.Router();
const Page = require('../models/Page');
const auth = require('../middleware/auth');
const checkRoomMember = require('../middleware/checkRoomMember');

// CREATE a page
router.post('/', auth, async (req, res) => {
  try {
    const { title, slug, roomId } = req.body;

    if (!title || !slug || !roomId) {
      return res.status(400).json({
        msg: 'Title, slug and roomId are required'
      });
    }

    const Room = require('../models/Room');

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({
        msg: 'Room not found'
      });
    }

    const isMember = room.members.some(
      (member) => member.user.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        msg: 'You are not a member of this room'
      });
    }

    const existing = await Page.findOne({ slug });

    if (existing) {
      return res.status(409).json({
        msg: 'Slug already taken'
      });
    }

    const page = await Page.create({
      title,
      slug,
      owner: req.userId,
      roomId,
      blocks: []
    });

    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// LIST current user's pages
router.get('/', auth, async (req, res) => {
  try {
    const pages = await Page.find({
      owner: req.userId
    }).sort({ createdAt: -1 });

    res.json(pages);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// GET one page by slug — PUBLIC
router.get('/public/:slug', async (req, res) => {
  try {
    const page = await Page.findOne({
      slug: req.params.slug
    });

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// GET one page by id — room members only
router.get('/:id', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// UPDATE page title/slug — room members only
router.put('/:id', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    const { title, slug } = req.body;

    if (title) page.title = title;
    if (slug) page.slug = slug;

    await page.save();

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// DELETE page — room members only
router.delete('/:id', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    await page.deleteOne();

    res.json({
      msg: 'Page deleted'
    });
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// ADD a block — room members only
router.post('/:id/blocks', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    const { type, content } = req.body;

    const validTypes = [
      'text',
      'heading',
      'image',
      'ai-generated'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        msg: 'Invalid block type'
      });
    }

    const order = page.blocks.length;

    page.blocks.push({
      type,
      content,
      order,
      lastEditedBy: req.userId
    });

    await page.save();

    res.status(201).json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// EDIT a block — room members only
router.put('/:id/blocks/:blockId', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    const block = page.blocks.id(req.params.blockId);

    if (!block) {
      return res.status(404).json({
        msg: 'Block not found'
      });
    }

    if (req.body.content !== undefined) {
      block.content = req.body.content;
    }

    block.lastEditedBy = req.userId;

    await page.save();

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// DELETE a block — room members only
router.delete('/:id/blocks/:blockId', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    const block = page.blocks.id(req.params.blockId);

    if (!block) {
      return res.status(404).json({
        msg: 'Block not found'
      });
    }

    block.deleteOne();

    // Re-sequence order after delete
    page.blocks.forEach((b, i) => {
      b.order = i;
    });

    await page.save();

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// REORDER blocks — room members only
router.put('/:id/blocks/reorder', auth, checkRoomMember, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({
        msg: 'Page not found'
      });
    }

    const { orderedBlockIds } = req.body;

    if (!Array.isArray(orderedBlockIds)) {
      return res.status(400).json({
        msg: 'orderedBlockIds must be an array'
      });
    }

    orderedBlockIds.forEach((blockId, index) => {
      const block = page.blocks.id(blockId);

      if (block) {
        block.order = index;
      }
    });

    page.blocks.sort((a, b) => a.order - b.order);

    await page.save();

    res.json(page);
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

module.exports = router;