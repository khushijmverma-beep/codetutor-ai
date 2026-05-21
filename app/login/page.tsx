'use client';
import { auth, provider } from '../../lib/firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
      setError('Google sign in failed. Try again.');
    }
  };

  const handleEmailAuth = async () => {
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/dashboard');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center">
      <h1 className="text-white text-4xl font-bold mb-2">CodeTutor AI</h1>
      <p className="text-gray-400 text-lg mb-8">Your personal coding tutor</p>
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-gray-800 text-white px-4 py-3 rounded-lg outline-none"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          onClick={handleEmailAuth}
          className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
        <div className="text-center text-gray-500">or</div>
        <button
          onClick={handleGoogle}
          className="border border-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
        >
          Sign in with Google
        </button>
        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-center text-gray-400 text-sm cursor-pointer hover:text-white"
        >
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </p>
      </div>
    </main>
  );
}