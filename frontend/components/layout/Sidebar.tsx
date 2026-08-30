"use client";
import Image from "next/image";
import {
  Home,
  Users,
  ClipboardList,
  FileText,
  BookOpen,
  Settings,
  ChevronLeft,
  Sparkles,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "#" },
  { icon: Users, label: "My Classroom", href: "#" },
  { icon: ClipboardList, label: "Assignments", href: "#" },
  { icon: FileText, label: "Exams", href: "#", active: true },
  { icon: BookOpen, label: "My Library", href: "#" },
];

interface SidebarProps {
  onTabClick?: (label: string) => void;
}

export function Sidebar({ onTabClick }: SidebarProps) {
  const handleClick = (e: React.MouseEvent, label: string, isActive?: boolean) => {
    e.preventDefault();
    if (onTabClick) {
      onTabClick(label);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[200px] min-h-screen bg-white border-r border-gray-100 flex-shrink-0">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">VedaAI</span>
          <ChevronLeft className="ml-auto text-gray-400 w-4 h-4 cursor-pointer" onClick={(e) => handleClick(e, "Sidebar Navigation")} />
        </div>
        <button
          onClick={(e) => handleClick(e, "AI Teacher's Toolkit")}
          className="w-full flex items-center gap-2 bg-gray-900 text-white rounded-full px-3 py-2 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-orange-400" />
          AI Teacher's Toolkit
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleClick(e, item.label, item.active)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                item.active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 space-y-1">
        <a
          href="#"
          onClick={(e) => handleClick(e, "Settings")}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
        >
          <Settings className="w-4 h-4" />
          Settings
        </a>
        {/* School card */}
        <div
          onClick={(e) => handleClick(e, "Veda Public School Profile")}
          className="mt-2 border border-dashed border-gray-200 rounded-xl px-3 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-600 text-xs font-bold">V</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">Veda Public School</p>
            <p className="text-[10px] text-gray-400 truncate">Bokaro Steel City</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
