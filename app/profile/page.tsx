'use client';
import { useEffect, useState, useRef } from 'react';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, updatePassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileRef = useRef<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUsername(docSnap.data().username || '');
          setProfilePic(docSnap.data().profilePic || '');
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePic(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        username,
        profilePic,
        email: user.email,
      });
      setMessage('Profile saved successfully!');
      if (newPassword) {
        await updatePassword(user, newPassword);
      }
    } catch (error) {
      if (newPassword) {
        setMessage('Profile saved! Password update failed — try signing in with email first.');
      } else {
        setMessage('Error saving profile. Try again.');
      }
    }
    setSaving(false);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </div>

      <div className="max-w-md flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => fileRef.current.click()}
            className="w-24 h-24 rounded-full bg-gray-800 cursor-pointer overflow-hidden flex items-center justify-center hover:opacity-80 transition"
          >
            {profilePic ? (
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-gray-400 text-sm">Add Photo</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <p className="text-gray-500 text-sm">Click to upload profile picture</p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm">Username</label>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm">Email</label>
          <input
            type="text"
            value={user.email}
            disabled
            className="bg-gray-800 text-gray-500 px-4 py-3 rounded-lg outline-none cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-gray-400 text-sm">New Password (optional)</label>
          <input
            type="password"
            placeholder="Leave blank to keep current"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
          />
        </div>

        {message && <p className="text-green-400 text-sm">{message}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </main>
  );
}