import React, { useState } from 'react';

export default function About() {
  const [openFaq, setOpenFaq] = useState(null);

  const stats = [
    { label: 'Active Memory Logs', value: '100%' },
    { label: 'Cloud Security', value: 'Firestore' },
    { label: 'Data Encryption', value: 'AES-256' },
    { label: 'Platform Availability', value: '24/7' }
  ];

  const features = [
    {
      icon: '✨',
      title: 'Stories & Feed',
      desc: 'Connect through dynamic story carousels and community updates powered by live cloud state.'
    },
    {
      icon: '🔒',
      title: 'Apple-Style Journaling',
      desc: 'Keep private thoughts, to-do lists, and attachment logs strictly secure to your personal account.'
    },
    {
      icon: '📅',
      title: 'Interactive Photo Archive',
      desc: 'Visual calendar mapping that archives your photos and written moments by date.'
    },
    {
      icon: '🌿',
      title: 'Daily Mindfulness',
      desc: 'Start every day with built-in affirmations designed to support emotional well-being.'
    }
  ];

  const faqs = [
    {
      q: 'Who can see my Private Journal entries?',
      a: 'Only you! Private journal entries are strictly linked to your authenticated user account and hidden from community feeds.'
    },
    {
      q: 'How does the Archive calendar work?',
      a: 'Any text or photo you post is automatically indexed by date. Days containing memories highlight with image previews.'
    },
    {
      q: 'Can I upload photos with my posts?',
      a: 'Yes, both the Shared Feed and Private Journal support image attachments.'
    }
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-8 font-sans">
      {/* Hero Banner Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 rounded-3xl p-8 text-white shadow-xl border border-stone-800">
        <div className="relative z-10 space-y-3">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
            About CatchUp
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Where Personal Memories Meet Community Connection
          </h1>
          <p className="text-stone-300 text-sm leading-relaxed max-w-xl">
            CatchUp is a unified platform built for personal reflection and social sharing. 
            Maintain a secure private journal, revisit memories on a photo archive calendar, 
            or share updates with your community.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-4 rounded-2xl border border-stone-200 text-center shadow-sm"
          >
            <div className="text-lg font-bold text-amber-600">{item.value}</div>
            <div className="text-xs text-stone-500 font-medium">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Feature Grid */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500 font-bold px-1">
          Core Features
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-2 hover:border-amber-300 transition"
            >
              <div className="text-2xl">{feat.icon}</div>
              <h3 className="font-bold text-stone-900 text-base">{feat.title}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="space-y-3">
        <h2 className="text-xs uppercase tracking-widest text-stone-500 font-bold px-1">
          Frequently Asked Questions
        </h2>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-100 overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex justify-between items-center text-left text-sm font-semibold text-stone-800 cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-stone-400 font-bold ml-2">
                  {openFaq === index ? '−' : '+'}
                </span>
              </button>
              {openFaq === index && (
                <p className="mt-2 text-xs text-stone-600 leading-relaxed pt-1 border-t border-stone-100">
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Creator Footer Card */}
      <div className="bg-stone-100 rounded-2xl p-5 border border-stone-200 flex items-center justify-between text-xs text-stone-600">
        <div>
          <p className="font-bold text-stone-800">CatchUp Social & Journal App</p>
          <p>Built with React, Tailwind CSS & Firebase Firestore</p>
        </div>
        <span className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg shadow-sm">
          v2.0
        </span>
      </div>
    </div>
  );
}