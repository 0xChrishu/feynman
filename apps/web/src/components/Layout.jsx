import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getFlashcardStats } from '@learning-coach/shared/api';

const Layout = ({ children }) => {
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    loadDueCount();
    const interval = setInterval(loadDueCount, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  const loadDueCount = async () => {
    try {
      const stats = await getFlashcardStats();
      setDueCount(stats.due_today || 0);
    } catch (error) {
      // 忽略错误（可能是未登录）
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-moss-green-50 to-moss-green-100">
      <nav className="bg-white shadow-sm border-b border-moss-green-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-moss-green-700">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="font-semibold text-lg">Learning Coach</span>
          </Link>
          <div className="flex gap-4 text-sm items-center">
            <Link to="/review" className="text-moss-green-600 hover:text-moss-green-700 relative flex items-center gap-1">
              闪卡复习
              {dueCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {dueCount}
                </span>
              )}
            </Link>
            <Link to="/history" className="text-moss-green-600 hover:text-moss-green-700">学习历史</Link>
            <Link to="/dashboard" className="text-moss-green-600 hover:text-moss-green-700">统计</Link>
          </div>
        </div>
      </nav>
      <main className="max-w-2xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
