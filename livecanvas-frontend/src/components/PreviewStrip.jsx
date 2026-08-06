export default function PreviewStrip({ blocks }) {
  const renderBlock = (block) => {
    if (block.type === 'heading') return <h1 key={block._id}>{block.content}</h1>;
    if (block.type === 'text' || block.type === 'ai-generated')
      return <p key={block._id}>{block.content}</p>;
    if (block.type === 'image') return <img key={block._id} src={block.content} alt="" />;
    return null;
  };

  const sorted = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="preview-strip">
      <div className="preview-frame preview-mobile">
        <div className="preview-screen">
          <div className="preview-inner">{sorted.map(renderBlock)}</div>
        </div>
        <div className="preview-frame-label">Mobile</div>
      </div>
      <div className="preview-frame preview-tablet">
        <div className="preview-screen">
          <div className="preview-inner">{sorted.map(renderBlock)}</div>
        </div>
        <div className="preview-frame-label">Tablet</div>
      </div>
      <div className="preview-frame preview-desktop">
        <div className="preview-screen">
          <div className="preview-inner">{sorted.map(renderBlock)}</div>
        </div>
        <div className="preview-frame-label">Desktop</div>
      </div>
    </div>
  );
}