const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/app/page.tsx',
  'src/app/login/page.tsx',
  'src/app/register/page.tsx',
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/files/page.tsx',
  'src/app/task/[key]/page.tsx',
  'src/app/callme/page.tsx',
  'src/app/disabled/page.tsx',
  'src/app/globals.css',
  'tailwind.config.ts',
  'next.config.js',
  'components/ui/button.tsx',
  'components/ui/card.tsx',
];

let hasError = false;

console.log('🔍 Starting smoke test...');

// 1. Check file existence
console.log('\n📁 Checking required files...');
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing file: ${file}`);
    hasError = true;
  } else {
    console.log(`✅ Found: ${file}`);
  }
});

// 2. Check key configurations
console.log('\n⚙️ Checking configurations...');
try {
  const nextConfig = fs.readFileSync('next.config.js', 'utf8');
  if (!nextConfig.includes('swcMinify: true')) {
    console.warn('⚠️ swcMinify not enabled in next.config.js');
  }
  if (!nextConfig.includes('images')) {
    console.error('❌ images config missing in next.config.js');
    hasError = true;
  }
  console.log('✅ next.config.js looks good');
} catch (e) {
  console.error('❌ Failed to read next.config.js');
  hasError = true;
}

try {
  const globalsCss = fs.readFileSync('src/app/globals.css', 'utf8');
  if (!globalsCss.includes('@tailwind base')) {
    console.error('❌ Tailwind directives missing in globals.css');
    hasError = true;
  }
  if (!globalsCss.includes('.glass')) {
    console.warn('⚠️ .glass utility missing in globals.css (UI might look wrong)');
  }
  console.log('✅ globals.css looks good');
} catch (e) {
  console.error('❌ Failed to read globals.css');
  hasError = true;
}

if (hasError) {
  console.error('\n❌ Smoke test FAILED');
  process.exit(1);
} else {
  console.log('\n✅ Smoke test PASSED');
}
