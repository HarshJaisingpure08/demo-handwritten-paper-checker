"use client";
import { Bell, User, Menu } from "lucide-react";

interface MobileHeaderProps {
  onTabClick?: (label: string) => void;
}

export function MobileHeader({ onTabClick }: MobileHeaderProps) {
  const handleClick = (label: string) => {
    if (onTabClick) {
      onTabClick(label);
    }
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleClick("Exams (Active Module)")}>
        <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">V</span>
        </div>
        <span className="font-bold text-gray-900">VedaAI</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => handleClick("Notifications")} className="p-1 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5 text-gray-500" />
        </button>
        <button onClick={() => handleClick("User Profile")} className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
          <User className="w-4 h-4 text-gray-500" />
        </button>
        <button onClick={() => handleClick("Navigation Menu")} className="p-1 hover:bg-gray-100 rounded-lg">
          <Menu className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </header>
  );
}
