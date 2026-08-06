import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function Block({ block, onChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="block-wrapper">
      <div className="drag-handle" {...attributes} {...listeners}>⠿</div>

      {block.type === 'heading' && (
        <input
          className="block-heading"
          value={block.content || ''}
          placeholder="Heading..."
          onChange={(e) => onChange(block._id, e.target.value)}
        />
      )}

      {block.type === 'text' && (
        <textarea
          className="block-text"
          value={block.content || ''}
          placeholder="Write something..."
          onChange={(e) => onChange(block._id, e.target.value)}
        />
      )}

      {block.type === 'image' && (
  <div style={{ flex: 1 }}>
    <input
      className="block-image"
      value={block.content || ''}
      placeholder="Paste image URL..."
      onChange={(e) => onChange(block._id, e.target.value)}
    />

    {block.content && (
      <img
        src={block.content}
        alt="Preview"
        style={{
          width: '100%',
          marginTop: '10px',
          borderRadius: '8px'
        }}
      />
    )}
  </div>
)}

      {block.type === 'ai-generated' && (
        <div className="block-ai">
          <span className="ai-tag">AI</span>
          <p>{block.content}</p>
        </div>
      )}

      <button className="delete-btn" onClick={() => onDelete(block._id)}>✕</button>
    </div>
  );
}