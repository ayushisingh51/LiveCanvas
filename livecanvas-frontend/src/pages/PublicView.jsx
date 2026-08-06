import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

export default function PublicView() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);

  useEffect(() => {
    api.get(`/pages/public/${slug}`).then((res) => setPage(res.data));
  }, [slug]);

  if (!page) return <div className="loading">Loading page...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '60px 20px' }}>
      {page.blocks
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          if (block.type === 'heading') return <h1 key={block._id} style={{ marginBottom: 16 }}>{block.content}</h1>;
          if (block.type === 'text') return <p key={block._id} style={{ marginBottom: 16, lineHeight: 1.6 }}>{block.content}</p>;
          if (block.type === 'image') return <img key={block._id} src={block.content} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 16 }} />;
          if (block.type === 'ai-generated') return <p key={block._id} style={{ marginBottom: 16, fontStyle: 'italic' }}>{block.content}</p>;
          return null;
        })}
    </div>
  );
}