'use client';
import { useEffect, useState, Suspense } from 'react';
import { auth, db } from '../../lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

function PracticeContent() {
  const [user, setUser] = useState<any>(null);
  const [task, setTask] = useState('');
  const [taskLoading, setTaskLoading] = useState(true);
  const [userCode, setUserCode] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const topic = decodeURIComponent(searchParams.get('topic') || '');
  const language = decodeURIComponent(searchParams.get('language') || '');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        generateTask();
      } else {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, []);

  const generateTask = async () => {
    setTaskLoading(true);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `You are a coding tutor. Generate a beginner-friendly coding task STRICTLY in ${language} (not any other language) that focuses specifically on the topic of "${topic}". 
            The task MUST use ${language} syntax and features only.
            Switch it up sometimes at random being a multiple choice question instead of a written problem. (give multiple choice or written not both)
            The task should be clear, concise, and solvable in under 20 lines of code.
            Format your response exactly like this:
            TASK: [describe what the student needs to code]
            (space)
            EXAMPLE INPUT: [example input if applicable, or "None"]
            (space)
            EXPECTED OUTPUT: [what the output should look like]`
          }
        ],
        model: 'llama-3.3-70b-versatile',
      });
      setTask(completion.choices[0]?.message?.content || 'Could not generate task.');
    } catch (error) {
      setTask('Error generating task. Try again.');
    }
    setTaskLoading(false);
  };

  const handleSubmit = async () => {
    if (!userCode.trim()) return;
    setFeedbackLoading(true);
    setAttempts(prev => prev + 1);
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `You are a coding tutor reviewing a student's code submission.
            Topic being practiced: ${topic}
            Language: ${language}
            Task given: ${task}
            Student's code: ${userCode}
            Ensure to keep this short and sweet with some in bullets and No bolding any words or any word effects keep it clean.
            Review the code and provide:
            1. Whether it correctly solves the task (correct/incorrect)
            2. What they did well
            3. What mistakes were made (if any)
            4. A hint for improvement if needed
            Keep feedback encouraging and concise.`
          }
        ],
        model: 'llama-3.3-70b-versatile',
      });

      const feedbackText = completion.choices[0]?.message?.content || '';
      const isCorrect = feedbackText.toLowerCase().includes('correct') && !feedbackText.toLowerCase().includes('incorrect');

      await addDoc(collection(db, 'practiceAttempts'), {
        uid: user.uid,
        topic,
        language,
        projectId: searchParams.get('projectId'),
        correct: isCorrect,
        timestamp: new Date(),
      });

      setFeedback(feedbackText);
    } catch (error) {
      setFeedback('Error getting feedback. Try again.');
    }
    setFeedbackLoading(false);
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">Practice: {topic}</h1>
        <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">{language}</span>
        {attempts > 0 && (
          <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm">Attempt {attempts}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm flex justify-between items-center">
              <span>Your Task</span>
              <button onClick={generateTask} className="text-xs text-gray-400 hover:text-white transition">
                🔄 New Task
              </button>
            </div>
            <div className="p-4">
              {taskLoading ? (
                <p className="text-gray-400 animate-pulse">Generating task...</p>
              ) : (
                <p className="text-white text-sm whitespace-pre-wrap">{task}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl overflow-hidden">
            <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm">Your Code</div>
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder={`Write your ${language} code here...`}
              className="w-full bg-transparent text-green-400 font-mono text-sm p-4 outline-none resize-none h-64"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={feedbackLoading}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            {feedbackLoading ? 'Reviewing...' : 'Submit Code'}
          </button>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm">AI Feedback</div>
          <div className="p-4">
            {feedbackLoading && <p className="text-gray-400 animate-pulse">Reviewing your code...</p>}
            {!feedback && !feedbackLoading && (
              <p className="text-gray-500 text-sm">Submit your code to get AI feedback here.</p>
            )}
            {feedback && <div className="text-white text-sm whitespace-pre-wrap">{feedback}</div>}
          </div>

          {feedback && (
            <div className="p-4 pt-0 flex gap-3">
              <button
                onClick={() => { setFeedback(''); setUserCode(''); }}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={() => { setFeedback(''); setUserCode(''); generateTask(); }}
                className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
              >
                Next Task →
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <PracticeContent />
    </Suspense>
  );
}