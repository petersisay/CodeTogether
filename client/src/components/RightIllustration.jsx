import React from 'react';

export default function RightIllustration() {
  return (
    <div className="relative w-full max-w-[280px] lg:max-w-[320px] mx-auto flex flex-col items-center justify-center p-2">
      {/* Container with glowing ambient background */}
      <div className="relative rounded-2xl overflow-hidden border border-blue-900/30 bg-[#0A1022]/40 p-1 shadow-[0_0_30px_rgba(30,58,138,0.2)]">
        <img
          src="/assets/team-illustration.png"
          alt="Developers collaborating on laptops in CodeTogether"
          className="w-full h-auto object-cover rounded-xl"
        />
      </div>
    </div>
  );
}
