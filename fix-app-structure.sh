#!/bin/bash

echo "🔧 Fixing src/app structure..."

# Remove if it's a file
if [ -f "src/app" ]; then
    echo "❌ src/app is a file - removing..."
    rm src/app
fi

# Create as directory
mkdir -p src/app

# Create required files
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LeadsReserve',
  description: 'Lead generation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

cat > src/app/page.tsx << 'EOF'
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">LeadsReserve</h1>
        <p className="mt-4">✅ Ready</p>
      </div>
    </main>
  );
}
EOF

cat > src/app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

echo "✅ Fixed! Structure is now correct."
ls -la src/app/
