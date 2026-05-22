'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, addDoc, getDocs, query, where, doc, getDoc, orderBy, writeBatch } from 'firebase/firestore';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState('');
  const [comment, setComment] = useState('');
  const dropdownRef = useRef<any>(null);
  const notifRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        fetchProjects(user.uid);
        fetchProfile(user.uid);
        fetchNotifications(user.uid);
      } else {
        router.push('/');
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchProfile = async (uid: string) => {
    const docSnap = await getDoc(doc(db, 'users', uid));
    if (docSnap.exists()) {
      setUsername(docSnap.data().username || '');
      setProfilePic(docSnap.data().profilePic || '');
    }
  };

  const fetchNotifications = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('toUid', '==', uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const notifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    } catch (e) {
      console.error('Notif error:', e);
    }
  };

  const markNotifsRead = async () => {
    if (unreadCount === 0) return;
    setUnreadCount(0);
    try {
      const batch = writeBatch(db);
      notifications.forEach((n: any) => {
        if (!n.read) {
          batch.update(doc(db, 'notifications', n.id), { read: true });
        }
      });
      await batch.commit();
    } catch (e) {
      console.error('Mark read error:', e);
    }
  };

  const fetchProjects = async (uid: string) => {
    const q = query(collection(db, 'projects'), where('uid', '==', uid));
    const snapshot = await getDocs(q);
    setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleCreateProject = async () => {
    if (!projectName || !code) return;
    const docRef = await addDoc(collection(db, 'projects'), {
      uid: user.uid,
      name: projectName,
      language,
      code,
      comment,
      createdAt: new Date(),
    });
    setProjects([...projects, { id: docRef.id, name: projectName, language, code, comment }]);
    setShowModal(false);
    setProjectName('');
    setCode('');
    setComment('');
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold">CodeTutor AI</h1>
          <button
            onClick={() => router.push('/community')}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
          >
            Community
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifs(!showNotifs); markNotifsRead(); }}
              className="relative bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 font-semibold text-sm">Notifications</div>
                {notifications.length === 0 ? (
                  <p className="px-4 py-3 text-gray-500 text-sm">No notifications yet</p>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-gray-800 transition border-b border-gray-800">
                      <p className="text-white text-sm">{n.message}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {n.createdAt?.seconds
                          ? new Date(n.createdAt.seconds * 1000).toLocaleDateString()
                          : 'Just now'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={dropdownRef}>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
            >
              <span className="text-gray-400">{username || user.email}</span>
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {(username || user.email)[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => { router.push('/profile'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 transition text-sm"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => { router.push('/learn'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 transition text-sm"
                >
                  Learn More
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 hover:bg-gray-800 transition text-sm text-red-400"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your Projects</h2>
      </div>
      <div className="grid grid-cols-3 gap-6">
        <button
          onClick={() => setShowModal(true)}
          className="border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center hover:border-white hover:text-white text-gray-500 transition min-h-48"
        >
          <span className="text-5xl mb-3">+</span>
          <span className="text-lg font-semibold">New Project</span>
        </button>

        {projects.map((project: any) => (
          <div
            key={project.id}
            onClick={() => router.push(`/project/${project.id}`)}
            className="bg-gray-900 rounded-xl p-6 cursor-pointer hover:bg-gray-800 transition min-h-48 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-lg font-bold mb-1">{project.name}</h3>
              <span className="text-gray-400 text-sm">{project.language}</span>
            </div>
            <p className="text-gray-500 text-sm">
              {project.createdAt?.seconds
                ? new Date(project.createdAt.seconds * 1000).toLocaleDateString()
                : 'Just now'}
            </p>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl flex flex-col gap-4">
            <h2 className="text-2xl font-bold">New Project</h2>
            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
            />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
            >
              <option>JavaScript</option>
              <option>Python</option>
              <option>Java</option>
              <option>C++</option>
              <option>TypeScript</option>
            </select>
            <textarea
              placeholder="Paste your code here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none h-48 resize-none font-mono"
            />
            <textarea
              placeholder="Any specific parts you need help with? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none h-20 resize-none"
            />
            <div className="flex gap-4">
              <button
                onClick={handleCreateProject}
                className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition flex-1"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowModal(false)}
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