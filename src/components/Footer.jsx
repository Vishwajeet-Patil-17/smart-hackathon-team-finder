import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="font-semibold text-slate-200">Walchand College of Engineering, Sangli</span>
          <span className="mx-2 text-slate-700 hidden sm:inline">•</span>
          <span className="block sm:inline text-slate-400">Department of Computer Science & Engineering</span>
        </div>
        <div className="text-[11px] text-slate-500">
          Mini-Project II • Skill-Based Hackathon Matching & Collaboration Platform
        </div>
      </div>
    </footer>
  );
};
