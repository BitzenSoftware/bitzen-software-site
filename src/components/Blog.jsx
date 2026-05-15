import { useState, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useLanguage } from '../context/LanguageContext'
import { supabase } from '../lib/supabase'

function formatDate(dateStr, lang) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch { return dateStr }
}

function PostCommentModal({ post, onClose }) {
  const { lang } = useLanguage()
  const [comments, setComments] = useState([])
  const [form, setForm] = useState({ name: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', String(post.id))
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setComments(data || []); setLoading(false) })
  }, [post.id])

  async function handleSubmit(e) {
    e.preventDefault()
    await supabase.from('post_comments').insert({
      post_id: String(post.id),
      name: form.name,
      message: form.message,
    })
    setSent(true)
  }

  const title = (lang === 'en' && post.titleEn) ? post.titleEn : post.title

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <p className="text-gray-500 text-xs mb-0.5">
              {lang === 'en' ? 'Comments' : 'Comentários'}
            </p>
            <p className="text-white font-semibold text-sm leading-snug line-clamp-2">{title}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 flex-shrink-0 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length > 0 ? (
            comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white text-sm font-medium">{c.name}</span>
                    <span className="text-gray-600 text-xs">
                      {new Date(c.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR')}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">{c.message}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-sm text-center py-8">
              {lang === 'en' ? 'Be the first to comment!' : 'Seja o primeiro a comentar!'}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="px-5 py-4 border-t border-border flex-shrink-0">
          {sent ? (
            <div className="text-center py-2">
              <p className="text-green-400 text-sm font-medium">
                {lang === 'en' ? 'Thank you! Comment awaiting approval.' : 'Obrigado! Comentário aguarda aprovação.'}
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', message: '' }) }}
                className="text-accent-blue text-xs mt-2 hover:underline"
              >
                {lang === 'en' ? 'Add another' : 'Enviar outro'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <input
                required
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder={lang === 'en' ? 'Your name' : 'Seu nome'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors"
              />
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder={lang === 'en' ? 'Leave your comment...' : 'Deixe o seu comentário...'}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent-purple/60 transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-accent-purple to-accent-blue hover:opacity-90 transition-opacity"
              >
                {lang === 'en' ? 'Comment' : 'Comentar'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Blog() {
  const { blogPosts } = useSettings()
  const { lang, t } = useLanguage()

  const [likedPosts, setLikedPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bitzen_liked') || '[]') } catch { return [] }
  })
  const [postLikes, setPostLikes] = useState({})
  const [commentCounts, setCommentCounts] = useState({})
  const [activePost, setActivePost] = useState(null)

  useEffect(() => {
    if (blogPosts.length === 0) return

    const likes = {}
    blogPosts.forEach(p => { likes[String(p.id)] = p.likesCount || 0 })
    setPostLikes(likes)

    supabase
      .from('post_comments')
      .select('post_id')
      .eq('approved', true)
      .then(({ data }) => {
        const counts = {}
        data?.forEach(row => { counts[row.post_id] = (counts[row.post_id] || 0) + 1 })
        setCommentCounts(counts)
      })
  }, [blogPosts])

  async function toggleLike(post) {
    const id = String(post.id)
    const isLiked = likedPosts.includes(id)
    const delta = isLiked ? -1 : 1
    const newLiked = isLiked ? likedPosts.filter(x => x !== id) : [...likedPosts, id]
    const newCount = Math.max(0, (postLikes[id] || 0) + delta)

    setLikedPosts(newLiked)
    localStorage.setItem('bitzen_liked', JSON.stringify(newLiked))
    setPostLikes(p => ({ ...p, [id]: newCount }))
    await supabase.from('blog_posts').update({ likes_count: newCount }).eq('id', id)
  }

  return (
    <section id="blog" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {t('blog_pre')}{' '}
            <span className="bg-gradient-to-r from-accent-purple to-accent-blue bg-clip-text text-transparent">
              {t('blog_accent')}
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">{t('blog_subtitle')}</p>
        </div>

        {blogPosts.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm">{t('blog_empty')}</p>
            <p className="text-xs mt-1">{t('blog_empty_hint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => {
              const id = String(post.id)
              const isLiked = likedPosts.includes(id)
              return (
                <article
                  key={post.id}
                  className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4 hover:border-accent-purple/50 transition-all duration-300 hover:shadow-lg hover:shadow-accent-purple/10 group"
                >
                  <div className="text-xs text-gray-500 font-medium">{formatDate(post.date, lang)}</div>
                  <h3 className="text-white font-semibold text-lg leading-snug group-hover:text-accent-blue transition-colors duration-200">
                    {(lang === 'en' && post.titleEn) ? post.titleEn : post.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1">
                    {(lang === 'en' && post.excerptEn) ? post.excerptEn : post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-accent-blue text-sm font-medium">{t('blog_read_more')}</span>
                    <div className="flex items-center gap-4">
                      {/* Like */}
                      <button
                        onClick={() => toggleLike(post)}
                        title={isLiked ? (lang === 'en' ? 'Unlike' : 'Remover like') : (lang === 'en' ? 'Like' : 'Curtir')}
                        className={`flex items-center gap-1.5 transition-all duration-200 ${isLiked ? 'text-accent-purple' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill={isLiked ? 'currentColor' : 'none'}
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="text-xs font-medium">{postLikes[id] ?? 0}</span>
                      </button>

                      {/* Comment */}
                      <button
                        onClick={() => setActivePost(post)}
                        title={lang === 'en' ? 'Comments' : 'Comentários'}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span className="text-xs font-medium">{commentCounts[id] ?? 0}</span>
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>

      {activePost && (
        <PostCommentModal post={activePost} onClose={() => setActivePost(null)} />
      )}
    </section>
  )
}
