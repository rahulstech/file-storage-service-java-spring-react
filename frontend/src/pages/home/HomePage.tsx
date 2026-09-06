import { useState } from "react"
import { ActionPanel, type Action } from "../../components/ActionPanel";
import { FaFolder, FaTrashCan } from "react-icons/fa6";
import FileBrowser from "./filebrowser/FileBrowser";
import TrashBrowser from "./trashbrowser/TrashBrowser";
import { useAuthContext } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function AppContent() {
  const [activeTab, setActiveTab] = useState<'myFiles' | 'trash'>('myFiles')
  const { isAuthenticated, user, logout } = useAuthContext()

  const sideActions: Action[] = [
    {
      id: 'myFiles',
      label: 'My Files',
      icon: <FaFolder className="w-4 h-4" />,
    },
    {
      id: 'trash',
      label: 'Trash',
      icon: <FaTrashCan className="w-4 h-4" />,
    },
  ]

  const handleSideAction = (actionId: string) => {
    if (actionId === 'myFiles') {
      setActiveTab('myFiles')
    } else if (actionId === 'trash') {
      setActiveTab('trash')
    }
  }

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />
  }

  return (
    <div className="flex flex-col h-screen bg-drive-bg text-drive-text font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-20 bg-drive-surface border-b border-drive-border px-6 py-4 shadow-xs shrink-0">
        <div className="w-full mx-auto flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-drive-text leading-tight">
            File Storage Service
          </h1>

          <div className="flex items-center gap-4">
            {/* User information */}
            <div className="text-right leading-tight">
              <div className="font-bold text-md text-drive-text">
                Hi, {user?.name}
              </div>
              <div className="text-xs text-drive-text-subtle mt-1">
                {user?.email}
              </div>
            </div>

            {/* Log out */}
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-drive-text border border-drive-border rounded-md hover:bg-drive-bg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full p-4 md:p-6 flex flex-col md:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Left 15%: Action Panel stretching 100% height */}
        <div className="w-full md:w-[15%] h-full flex flex-col shrink-0 min-w-45">
          <ActionPanel actions={sideActions} onAction={handleSideAction} className="h-full w-full md:w-full" />
        </div>

        {/* Right 85%: Active View Content Area */}
        <div className="w-full md:w-[85%] h-full flex flex-col flex-1 min-w-0 overflow-hidden">
          {activeTab === 'myFiles' ? <FileBrowser /> : <TrashBrowser />}
        </div>
      </div>
    </div>
  )
}
