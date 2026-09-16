const express = require('express');
const router = express.Router();
const { nanoid } = require('nanoid');

const Room = require('../models/Room');
const Page = require('../models/Page');
const auth = require('../middleware/auth');

// ==========================================
// CREATE A ROOM
// ==========================================

router.post('/', auth, async (req, res) => {
  try {
    const room = await Room.create({
      name: req.body.name || 'Untitled Room',

      owner: req.userId,

      members: [
        {
          user: req.userId,
          role: 'owner',
        },
      ],

      joinCode: nanoid(6),
    });

    res.status(201).json(room);

  } catch (err) {
    console.error('Create room error:', err);

    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
});

// ==========================================
// JOIN A ROOM USING JOIN CODE
// ==========================================

router.post('/join', auth, async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        msg: 'Join code is required',
      });
    }

    const room = await Room.findOne({ joinCode });

    if (!room) {
      return res.status(404).json({
        msg: 'Invalid join code',
      });
    }

    const alreadyMember = room.members.some(
      (member) =>
        member.user.toString() === req.userId
    );

    if (!alreadyMember) {
      room.members.push({
        user: req.userId,
        role: 'editor',
      });

      await room.save();
    }

    res.json(room);

  } catch (err) {
    console.error('Join room error:', err);

    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
});

// ==========================================
// GET ROOMS BELONGING TO CURRENT USER
// ==========================================

router.get('/mine', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.userId,
    }).populate(
      'members.user',
      'name email'
    );

    res.json(rooms);

  } catch (err) {
    console.error('Get rooms error:', err);

    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
});

// ==========================================
// GET ONE ROOM WITH MEMBERS AND PAGES
// ==========================================

router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate(
        'members.user',
        'name email'
      );

    if (!room) {
      return res.status(404).json({
        msg: 'Room not found',
      });
    }

    const isMember = room.members.some(
      (member) =>
        member.user._id.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        msg: 'Not a member of this room',
      });
    }

    const pages = await Page.find({
      roomId: room._id,
    }).sort({
      createdAt: -1,
    });

    res.json({
      room,
      pages,
    });

  } catch (err) {
    console.error('Get room error:', err);

    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
});

module.exports = router;