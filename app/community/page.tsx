'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, addDoc, getDocs, orderBy, query,
  doc, getDoc, updateDoc, increment
} from 'firebase/firestore';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function CommunityPage() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [showReplies, setShowReplies] = useState({});
  const [replies, setReplies] = useState({});
  const [showPostModal, setShowPostModal] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newLanguage, setNewLanguage] = useState('JavaScript');
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        await fetchProfile(u.uid);
        await loadCommunity();
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (uid) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      setUsername(docSnap.data().username || '');
      setProfilePic(docSnap.data().profilePic || '');
    }
  };

  const generateAIPosts = async () => {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{
          role: 'user',
          content: `Generate 4 realistic student coding help posts. Make them completely different each time — vary the topics (loops, pointers, classes, recursion, sorting, linked lists, OOP, arrays, memory, etc) and languages. Use a random seed: ${Math.random()}.
Return ONLY a JSON array, no extra text:
[
  {
    "username": "realistic lowercase username",
    "caption": "their question or comment (sound like a real frustrated or excited student)",
    "code": "5-10 line code snippet with an interesting bug or feature",
    "language": "one of: JavaScript, Python, Java, C++",
    "likes": 0
  }
]`
        }],
        model: 'llama-3.3-70b-versatile',
      });
      const text = completion.choices[0]?.message?.content || '[]';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed.map((post, i) => ({
        ...post,
        profilePic: '',
        isAI: true,
        createdAt: new Date(),
        id: `ai-${Date.now()}-${i}`,
      }));
    } catch (error) {
      console.error('AI posts error:', error);
      return [];
    }
  };

  const fetchRealPosts = async () => {
    try {
      const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  };

  const loadCommunity = async () => {
    setLoading(true);
    setLikedPosts(new Set());
    const [aiPosts, realPosts] = await Promise.all([generateAIPosts(), fetchRealPosts()]);
    const shuffledAI = aiPosts.sort(() => Math.random() - 0.5);
    setPosts([...realPosts, ...shuffledAI]);
    setLoading(false);
  };

  const handleLike = async (postId, isAI, postUid) => {
    if (likedPosts.has(postId)) return;
    setLikedPosts(prev => new Set([...prev, postId]));
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p)
    );
    if (!isAI) {
      try {
        await updateDoc(doc(db, 'communityPosts', postId), { likes: increment(1) });
        if (postUid && postUid !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            toUid: postUid,
            message: `${username || user.email} liked your post!`,
            createdAt: new Date(),
          });
        }
      } catch (e) {
        console.error('Like error:', e);
      }
    }
  };

  const handlePost = async () => {
    if (!newCaption.trim() && !newCode.trim()) return;
    setPosting(true);
    const newPost = {
      username: username || user.email,
      profilePic,
      caption: newCaption,
      code: newCode,
      language: newLanguage,
      likes: 0,
      createdAt: new Date(),
      isAI: false,
      uid: user.uid,
    };
    const docRef = await addDoc(collection(db, 'communityPosts'), newPost);
    setPosts(prev => [{ ...newPost, id: docRef.id }, ...prev]);
    setNewCaption('');
    setNewCode('');
    setShowPostModal(false);
    setPosting(false);
  };

  const fetchReplies = async (postId) => {
    if (postId.startsWith('ai-')) return;
    const q = query(collection(db, 'communityPosts', postId, 'replies'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    setReplies(prev => ({ ...prev, [postId]: snapshot.docs.map(d => ({ id: d.id, ...d.data() })) }));
  };

  const toggleReplies = async (postId) => {
    if (!showReplies[postId]) await fetchReplies(postId);
    setShowReplies(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleReply = async (postId) => {
    if (!replyText[postId]?.trim() || postId.startsWith('ai-')) return;
    await addDoc(collection(db, 'communityPosts', postId, 'replies'), {
      username: username || user.email,
      profilePic,
      text: replyText[postId],
      createdAt: new Date(),
    });
    const post = posts.find(p => p.id === postId);
    if (post?.uid && post.uid !== user.uid) {
      await addDoc(collection(db, 'notifications'), {
        toUid: post.uid,
        message: `${username || user.email} replied to your post: "${replyText[postId].slice(0, 50)}"`,
        createdAt: new Date(),
      });
    }
    setReplyText(prev => ({ ...prev, [postId]: '' }));
    fetchReplies(postId);
    setShowReplies(prev => ({ ...prev, [postId]: true }));
  };

  const Avatar = ({ name, pic, size = 10 }) => (
    <div className={`w-${size} h-${size} rounded-full bg-gray-700 overflow-hidden flex items-center justify-center shrink-0`}>
      {pic
        ? <img src={pic} alt="Profile" className="w-full h-full object-cover" />
        : <span className="text-white text-sm font-bold">{name?.[0]?.toUpperCase()}</span>
      }
    </div>
  );

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-white transition">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Community</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadCommunity}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
          >
            + New Post
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {loading && <p className="text-gray-400 animate-pulse">Loading community...</p>}
        {posts.map((post) => (
          <div key={post.id} className="bg-gray-900 rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar name={post.username} pic={post.profilePic} />
              <div>
                <p className="font-semibold text-white">{post.username}</p>
                <p className="text-gray-500 text-xs">{post.language}{post.isAI && ' · community'}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm">{post.caption}</p>

            {post.code && (
              <div className="bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-x-auto whitespace-pre">
                {post.code}
              </div>
            )}

            <div className="flex gap-4 items-center">
              <button
                onClick={() => toggleReplies(post.id)}
                className="text-gray-400 text-sm hover:text-white transition"
              >
                💬 {showReplies[post.id] ? 'Hide replies' : 'Reply'}
              </button>
              <button
                onClick={() => handleLike(post.id, post.isAI, post.uid)}
                className={`text-sm transition flex items-center gap-1 ${likedPosts.has(post.id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
              >
                ❤️ {post.likes || 0}
              </button>
            </div>

            {showReplies[post.id] && (
              <div className="flex flex-col gap-3 border-t border-gray-800 pt-4">
                {post.isAI ? (
                  <p className="text-gray-500 text-sm italic">Replies not available for community posts.</p>
                ) : (
                  <>
                    {replies[post.id]?.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <Avatar name={reply.username} pic={reply.profilePic} size={8} />
                        <div className="bg-gray-800 rounded-lg px-3 py-2 flex-1">
                          <p className="text-white text-xs font-semibold mb-1">{reply.username}</p>
                          <p className="text-gray-300 text-sm">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 mt-2">
                      <Avatar name={username || user.email} pic={profilePic} size={8} />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a reply..."
                          value={replyText[post.id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [post.id]: e.target.value }))}
                          className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none text-sm"
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(post.id)}
                        />
                        <button
                          onClick={() => handleReply(post.id)}
                          className="bg-white text-black px-3 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                        >
                          Post
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showPostModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">New Post</h2>
            <input
              type="text"
              placeholder="What's your question or comment?"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
            />
            <select
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C++</option>
              <option>TypeScript</option>
            </select>
            <textarea
              placeholder="Paste your code here (optional)..."
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none h-40 resize-none font-mono"
            />
            <div className="flex gap-4">
              <button
                onClick={handlePost}
                disabled={posting}
                className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex-1"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
              <button
                onClick={() => setShowPostModal(false)}
                className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}