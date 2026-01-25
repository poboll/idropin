import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-teal-purple dark:bg-slate-900 relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-40 w-80 h-80 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-40 left-20 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000" />
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 text-white drop-shadow-md">
            Idrop.in - 云集
          </h1>
          <p className="text-2xl text-white/90 mb-8 drop-shadow-sm">
            智能文件收集与管理平台
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            集AI智能分类、全文搜索、实时数据分析于一体的现代化文件管理解决方案
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
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

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-white text-blue-600 hover:bg-blue-50 font-bold rounded-full shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1"
          >
            开始使用
          </Link>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 hover:bg-white/20 transition-all duration-300">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-white/80">{description}</p>
    </div>
  );
}
