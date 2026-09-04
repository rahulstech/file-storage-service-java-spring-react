import FileBrowser from './pages/filebrowser/FileBrowser'
import { ToastProvider } from './components/Toast'

function App() {
  return (
    <ToastProvider>
      <FileBrowser />
    </ToastProvider>
  )
}

export default App
