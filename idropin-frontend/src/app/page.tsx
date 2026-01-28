import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-teal-purple dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      {/* 背景装饰 - 移动端隐藏部分 */}
      <div className="hidden sm:block absolute top-0 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="hidden sm:block absolute top-0 -right-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="hidden sm:block absolute -bottom-40 left-20 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      
      <div className="relative container mx-auto px-4 py-8 sm:py-16">
        {/* 标题区域 - 移动端优化 */}
        <div className="text-center mb-8 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 text-white drop-shadow-md">
            Idrop.in - 云集
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4 sm:mb-8 drop-shadow-sm">
            智能文件收集与管理平台
          </p>
          <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto px-4">
            集AI智能分类、全文搜索、实时数据分析于一体的现代化文件管理解决方案
          </p>
        </div>

        {/* 功能卡片 - 移动端单列显示 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-16 px-2 sm:px-0">
          <FeatureCard
            title="AI智能分类"
            description="自动识别文件类型，智能分类管理"
            icon="🤖"
          />
          <FeatureCard
            title="全文搜索"
            description="基于PostgreSQL的高效全文检索"
            icon="🔍"
          />
          <FeatureCard
            title="实时分析"
            description="数据可视化，实时监控系统状态"
            icon="📊"
          />
        </div>

        {/* 操作按钮 - 移动端优化 */}
        <div className="text-center space-y-4">
          <Link
            href="/dashboard"
            className="inline-block w-full sm:w-auto px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 text-center"
          >
            开始使用
          </Link>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/login"
              className="px-6 py-2 text-white/90 hover:text-white border border-white/30 rounded-full hover:bg-white/10 transition-all text-sm"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 text-white/90 hover:text-white border border-white/30 rounded-full hover:bg-white/10 transition-all text-sm"
            >
              注册
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 sm:p-8 hover:bg-white/20 transition-all duration-300">
      <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{icon}</div>
      <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm sm:text-base text-white/80">{description}</p>
    </div>
  );
}
