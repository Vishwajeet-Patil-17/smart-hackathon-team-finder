import React from 'react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 text-gray-500 text-xs py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div>
          <span className="font-semibold text-gray-800">Walchand College of Engineering, Sangli</span>
        </div>
        <div className="text-[11px] text-gray-400">
          Mini-Project II • Skill-Based Hackathon Matching & Collaboration Platform
        </div>
      </div>
    </footer>
  );
};
