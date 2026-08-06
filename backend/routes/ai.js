const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const auth = require('../middleware/auth');
const Page = require('../models/Page');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/generate', auth, async (req, res) => {
  try {
    const { prompt, pageId, blockId } = req.body;
    if (!prompt) return res.status(400).json({ msg: 'Prompt is required' });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: 'You are a concise content writer for a website builder. Write clear, well-formatted content based on the user prompt. Keep it under 150 words unless asked for more.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const generatedText = completion.choices[0]?.message?.content || 'Could not generate content.';

    // If a blockId is provided, save it directly to that block
    if (pageId && blockId) {
      const page = await Page.findById(pageId);
      if (page && page.owner.toString() === req.userId) {
        const block = page.blocks.id(blockId);
        if (block) {
          block.content = generatedText;
          block.lastEditedBy = req.userId;
          await page.save();
        }
      }
      return res.json({ content: generatedText, page });
    }

    res.json({ content: generatedText });
  } catch (err) {
    res.status(500).json({ msg: 'AI generation failed', error: err.message });
  }
});

module.exports = router;