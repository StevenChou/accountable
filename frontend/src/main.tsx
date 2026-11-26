import { createRoot } from 'react-dom/client'
import App from './App'
import { readInitialTheme } from './theme'

createRoot(document.getElementById('root')!).render(<App initialTheme={readInitialTheme()} />)
