'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function Home() {
  const router = useRouter();
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animFrame;
    let pos = 0;
    const speed = 0.5;

    const animate = () => {
      pos += speed;
      if (pos >= el.scrollHeight / 2) pos = 0;
      el.scrollTop = pos;
      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const cards = [
    {
      type: 'explainer',
      title: 'Line by Line Explanations',
      code: [
        { line: 'class BankAccount {', highlighted: false },
        { line: '  int pin;', highlighted: false },
        { line: '  double balance;', highlighted: true },
        { line: '  static int accountCount;', highlighted: false },
      ],
      explanation: 'This declares a double variable called balance to store the account\'s current money amount as a decimal number.',
    },
    {
      type: 'topics',
      title: 'Topic Detection',
      topics: ['Classes', 'OOP', 'Static Variables', 'Encapsulation', 'Operator Overloading'],
    },
    {
      type: 'community',
      title: 'Community Feed',
      posts: [
        { user: 'alex_codes', lang: 'C++', caption: 'Why is my loop running one extra time? Off by one error 😭' },
        { user: 'priya_dev', lang: 'Python', caption: 'Finally got recursion to click for me!! Any tips?' },
      ],
    },
    {
      type: 'progress',
      title: 'Progress Tracking',
      bars: [
        { topic: 'Classes', correct: true, attempts: 4 },
        { topic: 'Loops', correct: false, attempts: 2 },
        { topic: 'Recursion', correct: true, attempts: 3 },
        { topic: 'Arrays', correct: true, attempts: 5 },
      ],
    },
    {
      type: 'practice',
      title: 'Practice Tasks',
      task: 'Create a C++ class named Rectangle with width and height attributes and a method to calculate area.',
      feedback: '✅ Correct! Your class structure is solid. Great use of a constructor to initialize both attributes.',
    },
    {
      type: 'notifications',
      title: 'Notifications',
      notifs: [
        { msg: 'priya_dev liked your post!' },
        { msg: 'alex_codes replied: "Try using i < arr.length instead"' },
        { msg: 'jasonlearns liked your post!' },
      ],
    },
  ];

  const renderCard = (card, idx) => (
    <div key={idx} className="bg-gray-900 rounded-2xl p-5 mb-4 border border-gray-800 w-full">
      <p className="text-gray-500 text-xs mb-3 uppercase tracking-widest">{card.title}</p>

      {card.type === 'explainer' && (
        <div className="flex gap-3">
          <div className="flex-1 bg-black rounded-lg p-3 font-mono text-xs">
            {card.code.map((l, i) => (
              <div key={i} className={`px-2 py-0.5 rounded ${l.highlighted ? 'bg-gray-800 border-l-2 border-green-400' : ''}`}>
                <span className="text-gray-600 mr-2">{i + 1}</span>
                <span className="text-green-400">{l.line}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Line 3</p>
            <p className="text-white text-xs leading-relaxed">{card.explanation}</p>
          </div>
        </div>
      )}

      {card.type === 'topics' && (
        <div className="flex flex-col gap-2">
          {card.topics.map((t, i) => (
            <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 flex justify-between items-center">
              <span className="text-white text-xs font-medium">{t}</span>
              <span className="text-gray-500 text-xs">Practice →</span>
            </div>
          ))}
        </div>
      )}

      {card.type === 'community' && (
        <div className="flex flex-col gap-3">
          {card.posts.map((p, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold">
                  {p.user[0].toUpperCase()}
                </div>
                <span className="text-white text-xs font-semibold">{p.user}</span>
                <span className="text-gray-500 text-xs">{p.lang}</span>
              </div>
              <p className="text-gray-300 text-xs">{p.caption}</p>
            </div>
          ))}
        </div>
      )}

      {card.type === 'progress' && (
        <div className="flex flex-col gap-2">
          {card.bars.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-gray-400 text-xs w-28 shrink-0">{b.topic}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${b.correct ? 'bg-green-400' : 'bg-red-400'}`}
                  style={{ width: `${(b.attempts / 5) * 100}%` }}
                />
              </div>
              <span className="text-gray-500 text-xs">{b.attempts} attempts</span>
            </div>
          ))}
        </div>
      )}

      {card.type === 'practice' && (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Task</p>
            <p className="text-white text-xs leading-relaxed">{card.task}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-3 border border-green-400/30">
            <p className="text-green-400 text-xs leading-relaxed">{card.feedback}</p>
          </div>
        </div>
      )}

      {card.type === 'notifications' && (
        <div className="flex flex-col gap-2">
          {card.notifs.map((n, i) => (
            <div key={i} className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <p className="text-white text-xs">{n.msg}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-sm border-b border-gray-800 px-8 py-4 flex justify-between items-center z-50">
        <h1 className="text-xl font-bold">CodeTutor AI</h1>
        <div className="flex gap-8 text-gray-400">
          <a href="#home" className="hover:text-white transition">Home</a>
          <a href="#about" className="hover:text-white transition">About</a>
          <a href="#services" className="hover:text-white transition">Services</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="text-gray-400 hover:text-white transition font-semibold"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-black px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="min-h-screen flex items-center px-8 pt-20 gap-16 max-w-7xl mx-auto">
        {/* Left: Text */}
        <div className="flex-1 flex flex-col items-start">
          <h2 className="text-6xl font-bold mb-6 leading-tight">Your Personal<br />Coding Tutor</h2>
          <p className="text-gray-400 text-xl max-w-lg mb-8">Paste your code, click any line, and instantly understand what it does. Learn faster with AI-powered explanations, practice tasks, and a community of students just like you.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-black px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-200 transition"
          >
            Start Learning Free
          </button>
        </div>

        {/* Right: Carousel */}
        <div className="w-96 h-[560px] overflow-hidden relative shrink-0">
          <div
            ref={scrollRef}
            className="overflow-y-hidden h-full"
            style={{ scrollbarWidth: 'none' }}
          >
            {[...cards, ...cards].map((card, idx) => renderCard(card, idx))}
          </div>
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="min-h-screen flex flex-col items-center justify-center text-center px-8 border-t border-gray-800">
        <h2 className="text-4xl font-bold mb-6">About CodeTutor AI</h2>
        <p className="text-gray-400 text-lg max-w-2xl mb-6">CodeTutor AI was built for students who want to truly understand code — not just copy it. Whether you are a complete beginner or leveling up your skills, we break down every line in plain English, detect what topics you are learning, give you practice tasks with AI feedback, and let you connect with other students in a live community feed.</p>
        <div className="grid grid-cols-3 gap-8 mt-8">
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-2">AI Powered</h3>
            <p className="text-gray-400">Explanations and practice tasks generated by Llama AI — fast, accurate, and beginner friendly.</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-2">Any Language</h3>
            <p className="text-gray-400">Python, Java, C++, JavaScript, TypeScript and more — paste any code and we handle the rest.</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-2">Track Progress</h3>
            <p className="text-gray-400">See your skills improve over time with charts that track your practice attempts across every topic.</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="min-h-screen flex flex-col items-center justify-center text-center px-8 border-t border-gray-800">
        <h2 className="text-4xl font-bold mb-6">What We Offer</h2>
        <div className="grid grid-cols-3 gap-8 max-w-5xl">
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">Line by Line Explanations</h3>
            <p className="text-gray-400">Click any line of code and get an instant AI explanation of exactly what it does — no more guessing.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">Topic Detection</h3>
            <p className="text-gray-400">AI automatically detects what CS topics your code covers — arrays, loops, recursion, OOP, pointers and more.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">Practice Tasks</h3>
            <p className="text-gray-400">Get AI generated coding challenges based on your code's topics and receive detailed feedback on every submission.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
            <p className="text-gray-400">Visual charts show your improvement across topics over time — green for correct, red for needs work.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">Community Feed</h3>
            <p className="text-gray-400">Post your code, ask questions, reply to other students, and like posts — a social space built for CS learners.</p>
          </div>
          <div className="bg-gray-900 p-8 rounded-xl text-left">
            <h3 className="text-xl font-bold mb-3">🔔 Notifications</h3>
            <p className="text-gray-400">Get notified instantly when someone likes or replies to your community post so you never miss a response.</p>
          </div>
        </div>
      </section>
    </main>
  );
}