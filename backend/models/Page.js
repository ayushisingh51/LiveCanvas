const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  type: { type: String, enum: ['text', 'heading', 'image', 'ai-generated'], required: true },
  content: String,
  order: Number,
  lastEditedBy: String,
});


const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

roomId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Room'
},

blocks: [blockSchema],
}, { timestamps: true });

module.exports = mongoose.model('Page', pageSchema);