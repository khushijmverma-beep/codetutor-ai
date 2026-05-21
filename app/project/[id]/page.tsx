'use client';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../lib/firebase';
import { useRouter, useParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import Groq from 'groq-sdk';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

export default function ProjectPage() {
  const [user, setUser] = useState(null);
  const [project, setProject] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(null);
  const [lastClicked, setLastClicked] = useState(null);
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProject(data);
          detectTopics(data);
        }
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [id]);

  const detectTopics = async (projectData) => {
    setTopicsLoading(true);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Analyze this ${projectData.language} code and list the CS topics it covers (e.g. arrays, classes, loops, recursion, OOP, etc). Return ONLY a JSON array of strings, nothing else. Code: ${projectData.code}`
          }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      const text = completion.choices[0]?.message?.content || '[]';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setTopics(parsed);
    } catch (error) {
      console.error('Topics error:', error);
      setTopics([]);
    }
    setTopicsLoading(false);
  };

  const fetchProgress = async () => {
    try {
      const q = query(
        collection(db, 'practiceAttempts'),
        where('uid', '==', user.uid),
        where('projectId', '==', id)
      );
      const snapshot = await getDocs(q);
      const attempts = snapshot.docs.map(doc => doc.data());

      const topicCounts = {};
      attempts.forEach(attempt => {
        if (!topicCounts[attempt.topic]) {
          topicCounts[attempt.topic] = { attempts: 0, correct: false };
        }
        topicCounts[attempt.topic].attempts += 1;
        if (attempt.correct) topicCounts[attempt.topic].correct = true;
      });

      const chartData = Object.entries(topicCounts).map(([topic, data]) => ({
        topic,
        attempts: data.attempts,
        correct: data.correct
      }));

      setProgressData(chartData);
      setShowProgress(true);
    } catch (error) {
      console.error('Progress error:', error);
    }
  };

  const explainLine = async (line, index) => {
    if (explanations[index]) {
      setLastClicked(index);
      return;
    }
    setLoading(index);
    setLastClicked(index);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `You are a coding tutor. Explain this single line of ${project.language} code in simple terms for a beginner: "${line}". Keep it under 3 sentences.`
          }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      const text = completion.choices[0]?.message?.content || 'No explanation available.';
      setExplanations(prev => ({ ...prev, [index]: text }));
    } catch (error) {
      console.error('Groq error:', error);
      setExplanations(prev => ({ ...prev, [index]: 'Error getting explanation. Try again.' }));
    }
    setLoading(null);
  };

  if (!project) return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <p>Loading project...</p>
    </main>
  );

  const lines = project.code.split('\n');
  const lineHeight = 28;
  const visibleLines = 15;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-400 hover:text-white transition"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">{project.language}</span>
      </div>

      {/* 3 Column Layout */}
      <div className="grid grid-cols-3 gap-6">

        {/* Left: Code Panel */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm font-mono">
            {project.language} — click any line
          </div>
          <div
            className="overflow-y-auto font-mono text-sm p-4"
            style={{ height: `${visibleLines * lineHeight}px` }}
          >
            {lines.map((line, index) => (
              <div
                key={index}
                onClick={() => explainLine(line, index)}
                className={`flex gap-4 px-2 py-1 rounded cursor-pointer hover:bg-gray-800 ${lastClicked === index ? 'bg-gray-800/50 border-l-2 border-green-400' : ''}`}
                style={{ height: `${lineHeight}px` }}
              >
                <span className="text-gray-600 select-none w-6 text-right shrink-0">{index + 1}</span>
                <span className="text-green-400 whitespace-pre">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: AI Explanations */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm">
            AI Explanations
          </div>
          <div
            className="p-4 flex flex-col gap-3 overflow-y-auto"
            style={{ height: `${visibleLines * lineHeight}px` }}
          >
            {Object.keys(explanations).length === 0 && loading === null && (
              <p className="text-gray-500 text-sm">Click a line of code to see its explanation here.</p>
            )}
            {loading !== null && (
              <div className="text-gray-400 text-sm animate-pulse">Explaining line {loading + 1}...</div>
            )}
            {Object.entries(explanations).map(([index, explanation]) => (
              <div key={index} className={`rounded-lg p-3 bg-gray-800 ${parseInt(index) === lastClicked ? 'border border-green-400' : ''}`}>
                <div className="text-gray-500 text-xs mb-1">Line {parseInt(index) + 1}</div>
                <p className="text-white text-sm">{explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Topics Panel */}
        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm flex justify-between items-center">
            <span>Topics Covered</span>
            <button
              onClick={fetchProgress}
              className="text-xs text-white bg-gray-700 px-2 py-1 rounded hover:bg-gray-600 transition"
            >
              Progress
            </button>
          </div>
          <div
            className="p-4 flex flex-col gap-3 overflow-y-auto"
            style={{ height: `${visibleLines * lineHeight}px` }}
          >
            {topicsLoading && (
              <p className="text-gray-400 text-sm animate-pulse">Detecting topics...</p>
            )}
            {!topicsLoading && topics.length === 0 && (
              <p className="text-gray-500 text-sm">No topics detected yet.</p>
            )}
            {topics.map((topic, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-3 flex justify-between items-center">
                <span className="text-white text-sm font-medium">{topic}</span>
                <button
                  onClick={() => router.push(`/practice?topic=${encodeURIComponent(topic)}&projectId=${id}&language=${encodeURIComponent(project.language)}`)}
                  className="bg-white text-black text-xs px-3 py-1 rounded-lg hover:bg-gray-200 transition"
                >
                  Practice →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Modal */}
      {showProgress && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Practice Progress</h2>
              <button
                onClick={() => setShowProgress(false)}
                className="text-gray-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            {progressData.length === 0 ? (
              <p className="text-gray-400 text-sm">No practice attempts yet. Click Practice → on any topic to get started!</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <XAxis dataKey="topic" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#ffffff' }}
                    itemStyle={{ color: '#4ade80' }}
                  />
                  <Bar dataKey="attempts" radius={[4, 4, 0, 0]}>
                    {progressData.map((entry, index) => (
                      <Cell key={index} fill={entry.correct ? '#4ade80' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </main>
  );
}