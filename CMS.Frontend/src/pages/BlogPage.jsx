import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiFileText } from 'react-icons/fi';
import { getPosts, getImageUrl } from '../api';
import '../styles/Blog.css';

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    getPosts({ page, pageSize: 6 })
      .then(res => {
        setPosts(res.data || []);
        setTotalPages(res.totalPages || 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="blog-page" id="blog-page">
      <div className="container">
        <h1>Tin tức & Blog</h1>
        <p>Cập nhật xu hướng công nghệ mới nhất</p>

        {loading ? (
          <div className="blog-grid">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="blog-card">
                <div className="skeleton" style={{ aspectRatio: '16/9' }} />
                <div style={{ padding: 20 }}>
                  <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '100%', marginBottom: 4 }} />
                  <div className="skeleton" style={{ height: 14, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray-500)' }}>
            <FiFileText style={{ fontSize: '3rem', marginBottom: 16 }} />
            <h3>Chưa có bài viết nào</h3>
          </div>
        ) : (
          <>
            <div className="blog-grid">
              {posts.map(post => {
                const imgUrl = getImageUrl(post.imageUrl);
                return (
                  <Link key={post.id} to={`/blog/${post.id}`} className="blog-card fade-in">
                    <div className="blog-card-image">
                      {imgUrl ? (
                        <img src={imgUrl} alt={post.title} loading="lazy" />
                      ) : (
                        <div className="blog-card-image-placeholder"><FiFileText /></div>
                      )}
                    </div>
                    <div className="blog-card-body">
                      <div className="blog-card-meta">
                        <span><FiCalendar /> {formatDate(post.createdDate)}</span>
                        {post.categoryName && <span>• {post.categoryName}</span>}
                      </div>
                      <h3 className="blog-card-title">{post.title}</h3>
                      <p className="blog-card-excerpt">{post.summary}</p>
                      <span className="blog-card-link">
                        Đọc thêm <FiArrowRight />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 48 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    className={p === page ? 'active' : ''}
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
