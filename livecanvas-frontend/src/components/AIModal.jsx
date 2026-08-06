import { useState } from 'react';
import { motion } from 'framer-motion';
export default function AIModal({ onGenerate, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    await onGenerate(prompt);
    setLoading(false);
    onClose();
  };

  return (
  <motion.div
    className="modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="modal-box"
      initial={{ opacity: 0, scale: 0.94, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3>Generate with AI</h3>

      <textarea
        placeholder="e.g. Write a short intro for a portfolio homepage"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        autoFocus
      />

      <div className="modal-actions">
        <button className="cancel-btn" onClick={onClose}>
          Cancel
        </button>

        <button
          className="generate-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
    </motion.div>
  </motion.div>
);}