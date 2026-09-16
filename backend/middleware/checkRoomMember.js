const Room = require('../models/Room');
const Page = require('../models/Page');

async function checkRoomMember(req, res, next) {
  try {
    const page = await Page.findById(req.params.id);

    if (!page) {
      return res.status(404).json({ msg: 'Page not found' });
    }

    if (!page.roomId) {
      return res.status(403).json({ msg: 'Page is not assigned to a room' });
    }

    const room = await Room.findById(page.roomId);

    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }

    const isMember = room.members.some(
      (member) => member.user.toString() === req.userId
    );

    if (!isMember) {
      return res.status(403).json({
        msg: 'You are not a member of this room'
      });
    }

    req.room = room;
    next();
  } catch (err) {
    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
}

module.exports = checkRoomMember;