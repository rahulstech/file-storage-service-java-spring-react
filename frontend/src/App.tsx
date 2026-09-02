import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="max-w-md w-full p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
          File Storage Service
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Tailwind CSS &amp; TanStack Query are successfully configured!
        </p>
        <div className="pt-4">
          <button
            type="button"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl shadow-md transition-colors cursor-pointer"
            onClick={() => setCount((c) => c + 1)}
          >
            Count is {count}
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
