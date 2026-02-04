import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { evaluateAnswer, saveSession } from '@learning-coach/shared/api';

const Answer = () => {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { questionData, provider } = location.state || {};

  if (!questionData) {
    navigate('/');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('answer_text', answer);
      formData.append('original_content', questionData.original_content);
      if (provider) {
        formData.append('provider', provider);
      }

      const result = await evaluateAnswer(formData, provider);

      // Save session if logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const sessionResponse = await saveSession({
            content_type: 'text',
            original_content: questionData.original_content,
            question: questionData.question,
            user_answer: answer,
            feedback: result.feedback,
            score: result.score,
          });
          // 保存 session_id 供闪卡功能使用
          if (sessionResponse.id) {
            localStorage.setItem('last_session_id', sessionResponse.id);
          }
        } catch (saveError) {
          console.log('Session not saved (guest mode):', saveError);
        }
      }

      navigate('/result', { state: { result, questionData } });
    } catch (error) {
      console.error('Error:', error);
      alert('评估失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
          <h3 className="text-lg font-semibold text-moss-green-800 mb-3">教练的问题：</h3>
          <p className="text-moss-green-900 text-lg leading-relaxed">{questionData.question}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-moss-green-700 mb-2">
              你的解释
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="用你自己的话来解释这个概念，就像讲给一个外行听一样..."
              className="w-full h-48 p-4 bg-white border border-moss-green-200 rounded-xl focus:ring-2 focus:ring-moss-green-400 focus:border-transparent outline-none resize-none"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !answer.trim()}
            className="w-full bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> 正在评估...
              </>
            ) : (
              <>
                提交回答 <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Answer;
