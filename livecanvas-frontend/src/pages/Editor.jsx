import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import socket from '../api/socket';
import Block from '../components/Block';
import { motion, AnimatePresence } from 'framer-motion';
import AIModal from '../components/AIModal';
import PreviewStrip from "../components/PreviewStrip";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

export default function Editor() {
  const { roomId, pageId } = useParams();

  const [page, setPage] = useState(null);
  const [, setSaving] = useState(false);
  const [editorNames, setEditorNames] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor)
  );

  useEffect(() => {
    let mounted = true;
    let memberMap = {};

    const updateNames = (userIds) => {
      const names = userIds
        .map((userId) => memberMap[userId])
        .filter(Boolean);

      setEditorNames(names);
    };

    const handleUserOnline = (userId) => {
      const name = memberMap[userId];

      if (!name) return;

      setEditorNames((prev) =>
        [...new Set([...prev, name])]
      );
    };

    const handleUserOffline = (userId) => {
      const name = memberMap[userId];

      if (!name) return;

      setEditorNames((prev) =>
        prev.filter(
          (existingName) => existingName !== name
        )
      );
    };

    const loadPage = async () => {
      try {
        const res = await api.get(`/pages/${pageId}`);

        if (mounted) {
          setPage(res.data);
        }
      } catch (err) {
        console.error('Failed to load page:', err);
      }
    };

    const loadRoomMembers = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}`);

        res.data.room.members.forEach((member) => {
          if (member.user) {
            memberMap[member.user._id] = member.user.name;
          }
        });
      } catch (err) {
        console.error('Failed to load room members:', err);
      }
    };

    socket.on('presence-list', updateNames);
    socket.on('user-online', handleUserOnline);
    socket.on('user-offline', handleUserOffline);

    socket.on('block-updated', ({ blockId, content }) => {
      setPage((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b._id === blockId
              ? { ...b, content }
              : b
          ),
        };
      });
    });

    socket.on('block-added', (updatedPage) => {
      setPage(updatedPage);
    });

    socket.on('block-deleted', (updatedPage) => {
      setPage(updatedPage);
    });

    socket.on('block-reordered', (updatedPage) => {
      setPage(updatedPage);
    });

    socket.on('room-error', ({ message }) => {
      console.error('Room error:', message);
    });

    const initialize = async () => {
      await Promise.all([
        loadPage(),
        loadRoomMembers(),
      ]);

      if (!mounted) return;

      socket.auth = {
        token: localStorage.getItem('token'),
      };

      socket.connect();

      socket.emit('join-room', {
        roomId,
      });

      socket.emit('join-page', {
        pageId,
      });
    };

    initialize();

    return () => {
      mounted = false;

      socket.off('presence-list', updateNames);
      socket.off('user-online', handleUserOnline);
      socket.off('user-offline', handleUserOffline);

      socket.off('block-updated');
      socket.off('block-added');
      socket.off('block-deleted');
      socket.off('block-reordered');
      socket.off('room-error');

      socket.disconnect();
    };
  }, [roomId, pageId]);

  const addBlock = async (type) => {
    try {
      const res = await api.post(
        `/pages/${pageId}/blocks`,
        {
          type,
          content: '',
        }
      );

      setPage(res.data);

      socket.emit('block-add', {
        pageId,
        page: res.data,
      });
    } catch (err) {
      console.error('Failed to add block:', err);
    }
  };

  const updateBlock = useCallback(
    async (blockId, content) => {
      setPage((prev) => {
        if (!prev) return prev;

        return {
          ...prev,
          blocks: prev.blocks.map((b) =>
            b._id === blockId
              ? { ...b, content }
              : b
          ),
        };
      });

      socket.emit('block-update', {
        pageId,
        blockId,
        content,
      });

      try {
        setSaving(true);

        await api.put(
          `/pages/${pageId}/blocks/${blockId}`,
          { content }
        );
      } catch (err) {
        console.error('Failed to save block:', err);
      } finally {
        setSaving(false);
      }
    },
    [pageId]
  );

  const deleteBlock = async (blockId) => {
    try {
      const res = await api.delete(
        `/pages/${pageId}/blocks/${blockId}`
      );

      setPage(res.data);

      socket.emit('block-delete', {
        pageId,
        page: res.data,
      });
    } catch (err) {
      console.error('Failed to delete block:', err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = page.blocks.findIndex(
      (b) => b._id === active.id
    );

    const newIndex = page.blocks.findIndex(
      (b) => b._id === over.id
    );

    const reordered = arrayMove(
      page.blocks,
      oldIndex,
      newIndex
    );

    setPage((prev) => ({
      ...prev,
      blocks: reordered,
    }));

    try {
      const res = await api.put(
        `/pages/${pageId}/blocks/reorder`,
        {
          orderedBlockIds: reordered.map(
            (b) => b._id
          ),
        }
      );

      socket.emit('block-reorder', {
        pageId,
        page: res.data,
      });
    } catch (err) {
      console.error('Failed to reorder blocks:', err);
    }
  };

  const generateAI = async (prompt) => {
    try {
      const createRes = await api.post(
        `/pages/${pageId}/blocks`,
        {
          type: 'ai-generated',
          content: 'Generating...',
        }
      );

      setPage(createRes.data);

      socket.emit('block-add', {
        pageId,
        page: createRes.data,
      });

      const newBlock =
        createRes.data.blocks[
          createRes.data.blocks.length - 1
        ];

      const aiRes = await api.post(
        '/ai/generate',
        {
          prompt,
          pageId,
          blockId: newBlock._id,
        }
      );

      setPage(aiRes.data.page);

      socket.emit('block-update', {
        pageId,
        blockId: newBlock._id,
        content: aiRes.data.content,
      });
    } catch (err) {
      console.error('AI generation failed:', err);
    }
  };

  if (!page) {
    return (
      <div className="loading">
        Loading editor...
      </div>
    );
  }

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
              🟢 {editorNames.join(', ')} editing
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
                  initial={{
                    opacity: 0,
                    y: -8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.96,
                  }}
                  transition={{
                    duration: 0.2,
                  }}
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
        <button onClick={() => addBlock('heading')}>
          + Heading
        </button>

        <button onClick={() => addBlock('text')}>
          + Text
        </button>

        <button onClick={() => addBlock('image')}>
          + Image
        </button>

        <button onClick={() => setShowAIModal(true)}>
          + AI Block
        </button>

        <button
          className="preview-toggle"
          onClick={() =>
            setShowPreview((s) => !s)
          }
        >
          {showPreview
            ? 'Hide Preview'
            : '⌗ Live Preview'}
        </button>
      </div>

      {showPreview && (
        <PreviewStrip blocks={page.blocks} />
      )}

      <AnimatePresence>
        {showAIModal && (
          <AIModal
            onGenerate={generateAI}
            onClose={() =>
              setShowAIModal(false)
            }
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}