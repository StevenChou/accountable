import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { applyTheme, readTheme } from './theme'

const theme = readTheme()
applyTheme(theme)
createRoot(document.getElementById('root')!).render(<App initialTheme={theme} />)
