import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getLlmProviders } from '../api';

const ModelSelector = ({ selectedProvider, onProviderChange }) => {
  const [providers, setProviders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await getLlmProviders();
      setProviders(data.providers || []);
      // 保存用户选择
      const saved = localStorage.getItem('selectedProvider');
      if (saved && data.providers?.find(p => p.id === saved)) {
        onProviderChange(saved);
      } else if (data.providers?.length > 0) {
        onProviderChange(data.providers[0].id);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleSelect = (providerId) => {
    onProviderChange(providerId);
    localStorage.setItem('selectedProvider', providerId);
    setIsOpen(false);
  };

  const selected = providers.find(p => p.id === selectedProvider);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/50 border border-moss-green-200 rounded-xl hover:bg-white transition-colors"
      >
        <Settings size={18} className="text-moss-green-600" />
        <span className="text-sm text-moss-green-700">
          {selected ? selected.name : '选择模型'}
        </span>
        <svg className={`w-4 h-4 text-moss-green-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-moss-green-100 z-10 overflow-hidden">
          <div className="p-2">
            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleSelect(provider.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedProvider === provider.id
                    ? 'bg-moss-green-100 text-moss-green-800'
                    : 'hover:bg-moss-green-50 text-moss-green-700'
                }`}
              >
                <div className="font-medium text-sm">{provider.name}</div>
              </button>
            ))}
            {providers.length === 0 && (
              <div className="px-3 py-4 text-center text-moss-green-400 text-sm">
                暂无可用模型
                <br />
                <span className="text-xs">请在后端配置 API Key</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
