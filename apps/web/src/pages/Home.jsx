import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateQuestion } from '../api';
import { ArrowRight, Link as LinkIcon, FileText, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import ModelSelector from '../components/ModelSelector';

const Home = () => {
  const [inputType, setInputType] = useState('text');
  const [content, setContent] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const data = await generateQuestion(content, inputType, selectedProvider);
      navigate('/answer', { state: { questionData: data, provider: selectedProvider } });
    } catch (error) {
      console.error('Error:', error);
      alert('生成问题失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold text-moss-green-800">开始你的费曼学习之旅</h2>
            <p className="text-moss-green-600">
              输入你想学习的内容，我会像苏格拉底一样向你提问。
            </p>
          </div>
          <ModelSelector selectedProvider={selectedProvider} onProviderChange={setSelectedProvider} />
        </div>

        <div className="flex p-1 bg-moss-green-50 rounded-lg mb-6">
          <button
            onClick={() => setInputType('text')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
              inputType === 'text'
                ? 'bg-white text-moss-green-700 shadow-sm font-medium'
                : 'text-moss-green-400 hover:text-moss-green-600'
            }`}
          >
            <FileText size={18} /> 文本输入
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
              inputType === 'url'
                ? 'bg-white text-moss-green-700 shadow-sm font-medium'
                : 'text-moss-green-400 hover:text-moss-green-600'
            }`}
          >
            <LinkIcon size={18} /> 文章链接
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {inputType === 'text' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="粘贴你想学习的文本内容..."
              className="w-full h-48 p-4 bg-white/50 border border-moss-green-200 rounded-xl focus:ring-2 focus:ring-moss-green-400 focus:border-transparent outline-none resize-none placeholder:text-moss-green-300"
            />
          ) : (
            <input
              type="url"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="https://mp.weixin.qq.com/s/..."
              className="w-full p-4 bg-white/50 border border-moss-green-200 rounded-xl focus:ring-2 focus:ring-moss-green-400 focus:border-transparent outline-none placeholder:text-moss-green-300"
            />
          )}

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full bg-moss-green-600 hover:bg-moss-green-700 text-white font-medium py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" /> 正在思考...
              </>
            ) : (
              <>
                开始挑战 <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Home;
