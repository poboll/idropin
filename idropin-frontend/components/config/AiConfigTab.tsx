'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Cpu, Save } from 'lucide-react';
import { getAiConfigs, updateAiConfigs, testAiConnection } from '@/lib/api/config';

const AI_PRESETS = [
  { key: 'siliconflow', name: '硅基流动', desc: 'SiliconFlow · 国内高性价比', base_url: 'https://api.siliconflow.cn/v1', chat_model: 'deepseek-ai/DeepSeek-V3', embedding_model: 'BAAI/bge-large-zh-v1.5', embedding_dimensions: '1024' },
  { key: 'dashscope', name: '阿里云百炼', desc: 'DashScope · 通义千问全系列', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', chat_model: 'qwen-plus', embedding_model: 'text-embedding-v3', embedding_dimensions: '1024' },
  { key: 'volcengine', name: '火山引擎', desc: '字节豆包 · 高并发低延迟', base_url: 'https://ark.cn-beijing.volces.com/api/v3', chat_model: 'doubao-1.5-pro-32k', embedding_model: 'doubao-embedding', embedding_dimensions: '1024' },
  { key: 'openai', name: 'OpenAI', desc: 'GPT 系列 · 需海外网络', base_url: 'https://api.openai.com/v1', chat_model: 'gpt-4o-mini', embedding_model: 'text-embedding-3-small', embedding_dimensions: '1024' },
  { key: 'ollama', name: 'Ollama', desc: '本地部署 · 无需 API Key', base_url: 'http://localhost:11434/v1', chat_model: 'qwen2.5:7b', embedding_model: 'nomic-embed-text', embedding_dimensions: '768' },
  { key: 'custom', name: '自定义', desc: '兼容 OpenAI 接口的任意服务', base_url: '', chat_model: '', embedding_model: '', embedding_dimensions: '1024' },
] as const;

export default function AiConfigTab() {
  const [aiConfig, setAiConfig] = useState<Record<string, string>>({
    'ai.provider': 'openai',
    'ai.api_key': '',
    'ai.base_url': 'https://api.openai.com/v1',
    'ai.chat_model': 'gpt-4o-mini',
    'ai.embedding_model': 'text-embedding-3-small',
    'ai.embedding_dimensions': '1024',
    'ai.plagiarism_threshold': '0.92',
    'ai.enabled': 'false',
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      setAiLoading(true);
      try {
        const configs = await getAiConfigs();
        const map: Record<string, string> = {};
        configs.forEach(c => { map[c.configKey] = c.configValue; });
        setAiConfig(prev => ({ ...prev, ...map }));
      } catch (error) {
        console.error('Failed to fetch AI config:', error);
      } finally {
        setAiLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setAiSaving(true);
    try {
      await updateAiConfigs(aiConfig);
      alert('AI 配置已保存');
    } catch (error: any) {
      console.error('Failed to save AI config:', error);
      alert(`保存失败: ${error.message || '未知错误'}`);
    } finally {
      setAiSaving(false);
    }
  };

  const handleTest = async () => {
    setAiTesting(true);
    setAiTestResult(null);
    try {
      const msg = await testAiConnection(aiConfig);
      setAiTestResult({ ok: true, msg });
    } catch (error: any) {
      const msg = error?.response?.data?.message || error.message || '连接失败';
      setAiTestResult({ ok: false, msg });
    } finally {
      setAiTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4" />
          AI 与大模型配置
        </h2>
        <p className="text-sm text-gray-500 mt-1">配置 AI 智能批阅与查重功能的模型参数</p>
      </div>

      {aiLoading ? (
        <div className="p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">启用 AI 功能</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">开启后，文件提交将自动触发 AI 批阅与查重</p>
            </div>
            <button
              onClick={() => setAiConfig(prev => ({ ...prev, 'ai.enabled': prev['ai.enabled'] === 'true' ? 'false' : 'true' }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 ${
                aiConfig['ai.enabled'] === 'true' ? 'bg-gray-900 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full ${aiConfig['ai.enabled'] === 'true' ? 'bg-white dark:bg-gray-900' : 'bg-white'} transition-transform ${
                  aiConfig['ai.enabled'] === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              模型提供商
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {AI_PRESETS.map(preset => {
                const active = aiConfig['ai.provider'] === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      setAiConfig(prev => ({
                        ...prev,
                        'ai.provider': preset.key,
                        ...(preset.key !== 'custom' ? {
                          'ai.base_url': preset.base_url,
                          'ai.chat_model': preset.chat_model,
                          'ai.embedding_model': preset.embedding_model,
                          'ai.embedding_dimensions': preset.embedding_dimensions,
                        } : {}),
                      }));
                      setAiTestResult(null);
                    }}
                    className={`relative text-left p-3 rounded-lg border-2 transition-all ${
                      active
                        ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700/60'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${active ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {preset.name}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                      {preset.desc}
                    </span>
                    {active && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-900 dark:bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Base URL
            </label>
            <input
              type="text"
              value={aiConfig['ai.base_url'] || ''}
              onChange={e => setAiConfig(prev => ({ ...prev, 'ai.base_url': e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={aiConfig['ai.api_key'] || ''}
              onChange={e => setAiConfig(prev => ({ ...prev, 'ai.api_key': e.target.value }))}
              placeholder="sk-..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              密钥将安全存储，不会明文展示
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                对话模型
              </label>
              <input
                type="text"
                value={aiConfig['ai.chat_model'] || ''}
                onChange={e => setAiConfig(prev => ({ ...prev, 'ai.chat_model': e.target.value }))}
                placeholder="gpt-4o-mini"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">用于 AI 批阅评分</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Embedding 模型
              </label>
              <input
                type="text"
                value={aiConfig['ai.embedding_model'] || ''}
                onChange={e => setAiConfig(prev => ({ ...prev, 'ai.embedding_model': e.target.value }))}
                placeholder="text-embedding-3-small"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">用于向量化查重</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Embedding 维度
            </label>
            <input
              type="number"
              value={aiConfig['ai.embedding_dimensions'] || '1024'}
              onChange={e => setAiConfig(prev => ({ ...prev, 'ai.embedding_dimensions': e.target.value }))}
              min="256"
              max="3072"
              step="256"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              向量维度（需与数据库 vector 列定义一致），修改后需重建索引
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              查重相似度阈值
              <span className="ml-2 text-gray-900 dark:text-white font-semibold">
                {(Number(aiConfig['ai.plagiarism_threshold'] || 0.92) * 100).toFixed(0)}%
              </span>
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={aiConfig['ai.plagiarism_threshold'] || '0.92'}
              onChange={e => setAiConfig(prev => ({ ...prev, 'ai.plagiarism_threshold': e.target.value }))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>50% (宽松)</span>
              <span>100% (严格)</span>
            </div>
          </div>

          {aiTestResult && (
            <div className={`p-3 rounded-lg text-sm ${
              aiTestResult.ok
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}>
              {aiTestResult.ok ? '✓ ' : '✗ '}{aiTestResult.msg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleTest}
              disabled={aiTesting || !aiConfig['ai.api_key'] || !aiConfig['ai.base_url']}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {aiTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
              {aiTesting ? '测试中...' : '测试连接'}
            </button>
            <button
              onClick={handleSave}
              disabled={aiSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {aiSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {aiSaving ? '保存中...' : '保存配置'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
