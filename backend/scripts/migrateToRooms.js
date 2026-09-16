const mongoose = require('mongoose');
const Page = require('../models/Page');
const Room = require('../models/Room');
const { nanoid } = require('nanoid');
require('dotenv').config();

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find existing pages that don't have a room yet
    const pages = await Page.find({ roomId: { $exists: false } });

    const roomsByOwner = {};

    for (const page of pages) {
      const ownerId = page.owner.toString();

      // Create one room per existing page owner
      if (!roomsByOwner[ownerId]) {
        const room = await Room.create({
          name: 'My First Room',
          owner: page.owner,
          members: [
            {
              user: page.owner,
              role: 'owner'
            }
          ],
          joinCode: nanoid(6)
        });

        roomsByOwner[ownerId] = room._id;

        console.log(`Created room for owner ${ownerId}`);
      }

      // Assign the page to that owner's room
      page.roomId = roomsByOwner[ownerId];
      await page.save();
    }

    console.log(
      `Migrated ${pages.length} pages into ${Object.keys(roomsByOwner).length} rooms.`
    );

    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();