import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trash2, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { getDueFlashcards, reviewFlashcard, deleteFlashcard, getFlashcardStats } from '@learning-coach/shared/api';

const Review = () => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [stats, setStats] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadDueFlashcards();
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await getFlashcardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadDueFlashcards = async () => {
    setLoading(true);
    try {
      const data = await getDueFlashcards();
      setFlashcards(data.flashcards || []);
      if (data.flashcards && data.flashcards.length > 0) {
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    if (!flipped) {
      setFlipped(true);
    }
  };

  const handleReview = async (quality) => {
    setReviewing(true);
    const timeSpent = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    try {
      await reviewFlashcard(flashcards[currentIndex].id, quality, timeSpent);

      // 移到下一张
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
        setStartTime(Date.now());
      } else {
        // 完成！
        setCurrentIndex(currentIndex + 1);
        await loadStats();
      }
    } catch (error) {
      console.error('Review failed:', error);
      alert('复习失败，请重试');
    } finally {
      setReviewing(false);
    }
  };

  const handleSkip = async () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除这张闪卡吗？')) return;

    try {
      await deleteFlashcard(flashcards[currentIndex].id);

      // 移除当前卡片
      const remaining = flashcards.filter((_, i) => i !== currentIndex);
      setFlashcards(remaining);

      if (currentIndex >= remaining.length) {
        setCurrentIndex(Math.max(0, remaining.length - 1));
      }

      setFlipped(false);
      await loadStats();
    } catch (error) {
      console.error('Delete failed:', error);
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

  if (flashcards.length === 0) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-moss-green-800">闪卡复习</h1>
            <button
              onClick={() => navigate('/')}
              className="text-moss-green-600 hover:text-moss-green-700"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          {stats && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-moss-green-100">
              <h3 className="text-lg font-semibold text-moss-green-800 mb-4">复习统计</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-moss-green-600">{stats.total_cards}</div>
                  <div className="text-sm text-moss-green-500">总闪卡数</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-moss-green-600">{stats.mastered_cards}</div>
                  <div className="text-sm text-moss-green-500">已掌握</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-moss-green-600">{stats.mastery_rate}%</div>
                  <div className="text-sm text-moss-green-500">掌握率</div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl p-12 shadow-sm border border-moss-green-100 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-moss-green-800 mb-2">太棒了！</h2>
            <p className="text-moss-green-600 mb-6">今天没有需要复习的闪卡</p>
            <button
              onClick={() => navigate('/')}
              className="bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-3 px-6 rounded-xl"
            >
              开始新的学习
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // 已完成所有复习
  if (currentIndex >= flashcards.length) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-moss-green-800">闪卡复习</h1>
            <button
              onClick={() => navigate('/')}
              className="text-moss-green-600 hover:text-moss-green-700"
            >
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className="bg-white rounded-xl p-12 shadow-sm border border-moss-green-100 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-xl font-semibold text-moss-green-800 mb-2">复习完成！</h2>
            <p className="text-moss-green-600 mb-6">你已经复习了 {flashcards.length} 张闪卡</p>
            <button
              onClick={() => navigate('/')}
              className="bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-3 px-6 rounded-xl"
            >
              继续学习
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-moss-green-800">闪卡复习</h1>
            <p className="text-moss-green-600 mt-1">
              {currentIndex + 1} / {flashcards.length} · 还需 {flashcards.length - currentIndex - 1} 张
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="text-moss-green-600 hover:text-moss-green-700"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* 进度条 */}
        <div className="bg-moss-green-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-moss-green-600 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 闪卡 */}
        <div
          className={`bg-white rounded-xl p-8 shadow-sm border border-moss-green-100 min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-500 ${
            flipped ? 'perspective-1000' : ''
          }`}
          onClick={handleFlip}
          style={{
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div
            className="w-full"
            style={{
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d'
            }}
          >
            {!flipped ? (
              <div>
                <div className="text-xs font-medium text-moss-green-400 mb-2">问题</div>
                <p className="text-lg text-moss-green-900">{currentCard.front}</p>
                <p className="text-sm text-moss-green-400 mt-4">点击查看答案</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-medium text-moss-green-400 mb-2">答案</div>
                <p className="text-lg text-moss-green-900 whitespace-pre-wrap">{currentCard.back}</p>
              </div>
            )}
          </div>
        </div>

        {/* 复习按钮 */}
        {flipped && !reviewing && (
          <div className="grid grid-cols-6 gap-3">
            <button
              onClick={() => handleReview(0)}
              className="bg-red-100 hover:bg-red-200 text-red-700 font-medium py-3 rounded-xl transition-colors"
            >
              忘记了
            </button>
            <button
              onClick={() => handleReview(2)}
              className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-3 rounded-xl transition-colors"
            >
              困难
            </button>
            <button
              onClick={() => handleReview(3)}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-medium py-3 rounded-xl transition-colors"
            >
              一般
            </button>
            <button
              onClick={() => handleReview(4)}
              className="bg-lime-100 hover:bg-lime-200 text-lime-700 font-medium py-3 rounded-xl transition-colors"
            >
              良好
            </button>
            <button
              onClick={() => handleReview(5)}
              className="bg-green-100 hover:bg-green-200 text-green-700 font-medium py-3 rounded-xl transition-colors"
            >
              完美
            </button>
            <button
              onClick={handleSkip}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
            >
              跳过
            </button>
          </div>
        )}

        {/* 底部操作 */}
        <div className="flex justify-between">
          <button
            onClick={handleDelete}
            className="text-moss-green-400 hover:text-moss-green-600 text-sm flex items-center gap-1"
          >
            <Trash2 size={16} /> 删除这张卡片
          </button>
          {!flipped && (
            <button
              onClick={handleFlip}
              className="bg-moss-green-100 hover:bg-moss-green-200 text-moss-green-700 font-medium py-2 px-4 rounded-lg text-sm"
            >
              查看答案
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Review;
