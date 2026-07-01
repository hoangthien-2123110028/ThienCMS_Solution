import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCalendar, FiArrowLeft } from 'react-icons/fi';
import { getPostById, getImageUrl } from '../api';
import '../styles/Blog.css';

export default function BlogDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPostById(id)
      .then(setPost)
      .catch(console.error)
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="blog-detail-page">
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div className="skeleton" style={{ height: 20, width: '30%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 40, width: '80%', marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 14, width: '20%', marginBottom: 32 }} />
            <div className="skeleton" style={{ aspectRatio: '21/9', borderRadius: 16, marginBottom: 32 }} />
            <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '100%', marginBottom: 8 }} />
            <div className="skeleton" style={{ height: 16, width: '70%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="blog-detail-page">
        <div className="container" style={{ textAlign: 'center', padding: '80px 0' }}>
          <h2>Không tìm thấy bài viết</h2>
          <Link to="/blog" className="btn btn-primary" style={{ marginTop: 16 }}>Quay lại</Link>
        </div>
      </div>
    );
  }

  const imageUrl = getImageUrl(post.imageUrl);

  return (
    <div className="blog-detail-page fade-in" id="blog-detail-page">
      <div className="container">
        <Link to="/blog" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          marginBottom: 24, fontSize: 'var(--font-sm)', color: 'var(--gray-500)'
        }}>
          <FiArrowLeft /> Quay lại tin tức
        </Link>

        <div className="blog-detail-header">
          {post.categoryName && (
            <span className="badge badge-orange" style={{ marginBottom: 16 }}>{post.categoryName}</span>
          )}
          <h1>{post.title}</h1>
          <div className="blog-detail-meta">
            <span><FiCalendar /> {formatDate(post.createdDate)}</span>
          </div>
        </div>

        {imageUrl && (
          <div className="blog-detail-image">
            <img src={imageUrl} alt={post.title} />
          </div>
        )}

        <div className="blog-detail-content">
          {post.content?.split('\n').map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
