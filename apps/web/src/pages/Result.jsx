import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, TrendingUp, BookOpen } from 'lucide-react';
import { useState } from 'react';
import Layout from '../components/Layout';
import { createFlashcardFromSession } from '@learning-coach/shared/api';

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, questionData } = location.state || {};
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!result) {
    navigate('/');
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return '掌握得很好！';
    if (score >= 60) return '还不错，继续加油！';
    return '需要再理解一下';
  };

  const handleSaveFlashcard = async () => {
    // 需要从 localStorage 获取 session_id，这里简化处理
    // 实际应该从 location.state 或保存的学习会话中获取
    const sessionId = localStorage.getItem('last_session_id');
    if (!sessionId) {
      alert('无法保存闪卡：会话信息丢失');
      return;
    }

    setSaving(true);
    try {
      await createFlashcardFromSession(sessionId);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save flashcard:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Score Display */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-moss-green-100 text-center">
          <div className={`text-6xl font-bold mb-2 ${getScoreColor(result.score)}`}>
            {result.score}
          </div>
          <div className="text-moss-green-600 text-lg">{getScoreLabel(result.score)}</div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-2">问题</h3>
          <p className="text-moss-green-900">{questionData?.question}</p>
        </div>

        {/* Your Answer */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-2">你的回答</h3>
          <p className="text-moss-green-900 whitespace-pre-wrap">{result.transcription || '见上'}</p>
        </div>

        {/* Feedback */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-sm font-medium text-moss-green-500 mb-3 flex items-center gap-2">
            <TrendingUp size={18} /> 教练反馈
          </h3>
          <p className="text-moss-green-900 whitespace-pre-wrap leading-relaxed">{result.feedback}</p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/')}
            className="bg-moss-green-100 hover:bg-moss-green-200 text-moss-green-700 font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft size={20} /> 返回首页
          </button>
          <button
            onClick={handleSaveFlashcard}
            disabled={saving || saved}
            className={`font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
              saved
                ? 'bg-green-100 text-green-700'
                : 'bg-moss-green-100 hover:bg-moss-green-200 text-moss-green-700'
            }`}
          >
            <BookOpen size={20} /> {saved ? '已保存' : saving ? '保存中...' : '保存为闪卡'}
          </button>
          <button
            onClick={() => navigate(0)}
            className="bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={20} /> 再练一次
          </button>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center text-green-700 text-sm">
            ✓ 闪卡已保存！前往「闪卡复习」页面进行复习
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Result;
