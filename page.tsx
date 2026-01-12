export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">
          LeadsReserve Platform
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Production-ready B2B lead generation system
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Platform Status</h2>
          <p className="text-green-600 font-semibold">✅ Deployment Successful</p>
          <p className="text-sm text-gray-600 mt-2">
            Next steps: Configure environment variables and test API endpoints
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">📡 API Endpoint</h3>
            <p className="text-sm text-gray-600">
              POST /api/public/leads/create
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Lead capture endpoint ready
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🔧 Configuration</h3>
            <p className="text-sm text-gray-600">
              Add environment variables in Vercel
            </p>
            <p className="text-xs text-gray-500 mt-1">
              DATABASE_URL, API keys, etc.
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">📊 Database</h3>
            <p className="text-sm text-gray-600">
              PostgreSQL via Supabase
            </p>
            <p className="text-xs text-gray-500 mt-1">
              10 tables configured via Prisma
            </p>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🚀 Next Steps</h3>
            <p className="text-sm text-gray-600">
              1. Add env vars<br/>
              2. Test API<br/>
              3. Launch ads
            </p>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>Built with Next.js 14, TypeScript, Prisma, PostgreSQL</p>
        </div>
      </div>
    </main>
  );
}
