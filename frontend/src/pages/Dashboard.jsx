import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatistics, getSessions } from '../api';
import Layout from '../components/Layout';
import { BookOpen, TrendingUp, Award, Target } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, suffix = '' }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
    <div className="flex items-center justify-between mb-2">
      <span className="text-moss-green-600 text-sm">{title}</span>
      <Icon size={20} className="text-moss-green-400" />
    </div>
    <div className="text-3xl font-bold text-moss-green-800">
      {value}{suffix}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const [statsData, sessionsData] = await Promise.all([
        getStatistics(),
        getSessions(1, 5)
      ]);

      setStats(statsData);
      setRecentSessions(sessionsData.sessions || []);
    } catch (error) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-moss-green-600">加载中...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-moss-green-800">学习概览</h2>
          <button
            onClick={() => navigate('/')}
            className="text-moss-green-600 hover:text-moss-green-700"
          >
            开始新学习 →
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            title="学习次数"
            value={stats?.total_sessions || 0}
          />
          <StatCard
            icon={Target}
            title="平均分"
            value={stats?.avg_score?.toFixed(1) || 0}
            suffix=" 分"
          />
          <StatCard
            icon={Award}
            title="最高分"
            value={stats?.best_score || 0}
            suffix=" 分"
          />
          <StatCard
            icon={TrendingUp}
            title="掌握度"
            value={stats?.avg_score >= 80 ? '优秀' : stats?.avg_score >= 60 ? '良好' : '继续加油'}
          />
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-sm border border-moss-green-100">
          <div className="p-4 border-b border-moss-green-100">
            <h3 className="font-semibold text-moss-green-800">最近学习</h3>
          </div>
          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-moss-green-400">
              还没有学习记录，开始第一次学习吧！
            </div>
          ) : (
            <div className="divide-y divide-moss-green-50">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/history/${session.id}`)}
                  className="p-4 hover:bg-moss-green-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-moss-green-800 line-clamp-1">{session.question}</p>
                    <span className={`font-semibold ${
                      session.score >= 80 ? 'text-green-600' :
                      session.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {session.score} 分
                    </span>
                  </div>
                  <p className="text-sm text-moss-green-400 mt-1">
                    {new Date(session.created_at).toLocaleString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/history')}
            className="flex-1 bg-moss-green-100 hover:bg-moss-green-200 text-moss-green-700 font-medium py-3 rounded-xl transition-colors"
          >
            查看全部历史
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/');
            }}
            className="flex-1 bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
