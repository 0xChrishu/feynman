import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getSessions, getSession } from '../api';
import Layout from '../components/Layout';
import { ArrowLeft } from 'lucide-react';

const History = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const limit = 10;

  useEffect(() => {
    loadSessions();
  }, [page]);

  const loadSessions = async () => {
    try {
      const data = await getSessions(page, limit);
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading sessions:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const totalPages = Math.ceil(total / limit);

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
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-moss-green-600 hover:text-moss-green-700"
          >
            <ArrowLeft size={20} /> 返回
          </button>
          <h2 className="text-2xl font-semibold text-moss-green-800">学习历史</h2>
          <div></div>
        </div>

        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-moss-green-100">
            <p className="text-moss-green-400">还没有学习记录</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-moss-green-600 text-white rounded-lg hover:bg-moss-green-700"
            >
              开始学习
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => navigate(`/history/${session.id}`)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-moss-green-100 hover:border-moss-green-300 cursor-pointer transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-moss-green-800 line-clamp-2 mb-1">
                        {session.question}
                      </p>
                      <p className="text-sm text-moss-green-400">
                        {new Date(session.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full font-semibold text-sm whitespace-nowrap ${getScoreColor(session.score)}`}>
                      {session.score} 分
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white border border-moss-green-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-moss-green-50"
                >
                  上一页
                </button>
                <span className="px-4 py-2 text-moss-green-600">
                  第 {page} / {totalPages} 页
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white border border-moss-green-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-moss-green-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export const SessionDetail = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const data = await getSession(id);
      setSession(data);
    } catch (error) {
      console.error('Error loading session:', error);
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <button
          onClick={() => navigate('/history')}
          className="flex items-center gap-2 text-moss-green-600 hover:text-moss-green-700"
        >
          <ArrowLeft size={20} /> 返回历史
        </button>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100 text-center">
          <div className={`text-5xl font-bold mb-2 ${getScoreColor(session.score)}`}>
            {session.score}
          </div>
          <div className="text-moss-green-600">
            {session.score >= 80 ? '掌握得很好！' : session.score >= 60 ? '还不错，继续加油！' : '需要再理解一下'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-2">问题</h3>
          <p className="text-moss-green-900">{session.question}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-2">你的回答</h3>
          <p className="text-moss-green-900 whitespace-pre-wrap">{session.user_answer}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-3">教练反馈</h3>
          <p className="text-moss-green-900 whitespace-pre-wrap leading-relaxed">{session.feedback}</p>
        </div>

        <p className="text-sm text-moss-green-400 text-center">
          {new Date(session.created_at).toLocaleString('zh-CN')}
        </p>
      </div>
    </Layout>
  );
};

export default History;
