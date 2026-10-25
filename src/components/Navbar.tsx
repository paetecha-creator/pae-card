import React from 'react';
import { LayoutDashboard, Receipt, CreditCard as CardIcon, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'transactions' | 'cards' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  upcomingDueCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  upcomingDueCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'ภาพรวม',
      icon: LayoutDashboard,
      badge: upcomingDueCount > 0 ? upcomingDueCount : undefined,
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'transactions' as TabType,
      label: 'รายการ',
      icon: Receipt,
    },
    {
      id: 'cards' as TabType,
      label: 'บัตร',
      icon: CardIcon,
    },
    {
      id: 'settings' as TabType,
      label: 'ตั้งค่า',
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-2'}`} />
                {tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 transition-opacity ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-8 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
