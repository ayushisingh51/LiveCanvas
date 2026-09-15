import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import socket from '../api/socket';
import Block from '../components/Block';
import { motion, AnimatePresence } from 'framer-motion';
import AIModal from '../components/AIModal';
import PreviewStrip from "../components/PreviewStrip";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';

export default function Editor() {
  const { id } = useParams();
  const [page, setPage] = useState(null);
  const [, setSaving] = useState(false);
  const [editorNames, setEditorNames] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));
  const [showPreview, setShowPreview] = useState(false);

  // Load page + connect socket
  useEffect(() => {
    api.get(`/pages/${id}`).then((res) => setPage(res.data));

    const userName = localStorage.getItem('userName') || 'Someone';

socket.connect();

socket.emit('join-page', {
  pageId: id,
  userName,
});

socket.on('user-joined', ({ userName: joinedName }) => {
  setEditorNames((prev) => [...new Set([...prev, joinedName])]);
});

    socket.on('block-updated', ({ blockId, content }) => {
      setPage((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b._id === blockId ? { ...b, content } : b)),
      }));
    });

    socket.on('block-added', (updatedPage) => setPage(updatedPage));
    socket.on('block-deleted', (updatedPage) => setPage(updatedPage));
    socket.on('block-reordered', (updatedPage) => setPage(updatedPage));

    return () => {
      socket.off('user-joined');
      socket.off('block-updated');
      socket.off('block-added');
      socket.off('block-deleted');
      socket.off('block-reordered');
      socket.disconnect();
    };
  }, [id]);

  const addBlock = async (type) => {
    const res = await api.post(`/pages/${id}/blocks`, { type, content: '' });
    setPage(res.data);
    socket.emit('block-add', { pageId: id, page: res.data });
  };

  const updateBlock = useCallback(
    async (blockId, content) => {
      setPage((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b._id === blockId ? { ...b, content } : b)),
      }));

      // Broadcast immediately for live typing feel
      socket.emit('block-update', { pageId: id, blockId, content });

      setSaving(true);
      await api.put(`/pages/${id}/blocks/${blockId}`, { content });
      setSaving(false);
    },
    [id]
  );

  const deleteBlock = async (blockId) => {
    const res = await api.delete(`/pages/${id}/blocks/${blockId}`);
    setPage(res.data);
    socket.emit('block-delete', { pageId: id, page: res.data });
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = page.blocks.findIndex((b) => b._id === active.id);
    const newIndex = page.blocks.findIndex((b) => b._id === over.id);
    const reordered = arrayMove(page.blocks, oldIndex, newIndex);

    setPage((prev) => ({ ...prev, blocks: reordered }));
    const res = await api.put(`/pages/${id}/blocks/reorder`, {
      orderedBlockIds: reordered.map((b) => b._id),
    });
    socket.emit('block-reorder', { pageId: id, page: res.data });
  };

  const generateAI = async (prompt) => {
  const createRes = await api.post(`/pages/${id}/blocks`, {
    type: 'ai-generated',
    content: 'Generating...',
  });

  setPage(createRes.data);
  socket.emit('block-add', { pageId: id, page: createRes.data });

  const newBlock =
    createRes.data.blocks[createRes.data.blocks.length - 1];

  const aiRes = await api.post('/ai/generate', {
    prompt,
    pageId: id,
    blockId: newBlock._id,
  });

  setPage(aiRes.data.page);

  socket.emit('block-update', {
    pageId: id,
    blockId: newBlock._id,
    content: aiRes.data.content,
  });
};

  if (!page) return <div className="loading">Loading editor...</div>;

  return (
  <motion.div
    className="editor"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
  >
    <div className="editor-header">
      <h1>{page.title}</h1>

      <div>
        {editorNames.length > 0 && (
          <span className="live-indicator">
            🟢 {editorNames.join(", ")} editing
          </span>
        )}
      </div>
    </div>

    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={page.blocks.map((b) => b._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="block-list">
  <AnimatePresence mode="popLayout">
    {page.blocks.map((block) => (
      <motion.div
        key={block._id}
        layout
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
      >
        <Block
          block={block}
          onChange={updateBlock}
          onDelete={deleteBlock}
        />
      </motion.div>
    ))}
  </AnimatePresence>
</div>
      </SortableContext>
    </DndContext>

    <div className="add-block-toolbar">
      <button onClick={() => addBlock("heading")}>+ Heading</button>

      <button onClick={() => addBlock("text")}>+ Text</button>

      <button onClick={() => addBlock("image")}>+ Image</button>

      <button onClick={() => setShowAIModal(true)}>
        + AI Block
      </button>

      <button
        className="preview-toggle"
        onClick={() => setShowPreview((s) => !s)}
      >
        {showPreview ? "Hide Preview" : "⌗ Live Preview"}
      </button>
    </div>

    {showPreview && <PreviewStrip blocks={page.blocks} />}

    <AnimatePresence>
      {showAIModal && (
        <AIModal
          onGenerate={generateAI}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </AnimatePresence>

  </motion.div>
);
}