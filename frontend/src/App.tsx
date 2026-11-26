import { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router'
import { RecordList } from './pages/RecordList'
import { RecordDetail } from './pages/RecordDetail'
import { resourceNames, type Resource } from './domain'
import { saveTheme, type Theme } from './theme'

const DashboardPage = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.DashboardPage })))
const PipelinePage = lazy(() => import('./pages/Pipeline').then((module) => ({ default: module.PipelinePage })))

const navigation = [
  { path: '/', label: '儀表板', icon: '▦' },
  { path: '/companies', label: '公司', icon: '◇' },
  { path: '/contacts', label: '聯絡人', icon: '◎' },
  { path: '/deals', label: '商機', icon: '▤' },
  { path: '/pipeline', label: '商機看板', icon: '▥' },
]

export default function App({ initialTheme = 'light' }: { initialTheme?: Theme }) {
  const [theme, setTheme] = useState(initialTheme)
  const dark = theme === 'dark'

  function toggleTheme() {
    const nextTheme = dark ? 'light' : 'dark'
    saveTheme(nextTheme)
    setTheme(nextTheme)
  }

  return (
    <BrowserRouter>
      <header className="masthead">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Accountable
        </Link>
        <nav aria-label="主要導覽">
          {navigation.map(({ path, label, icon }) => (
            <NavLink key={path} to={path} end={path === '/'}>
              <span className="nav-icon" aria-hidden="true">
                {icon}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="secondary theme-toggle" aria-pressed={dark} onClick={toggleTheme}>
          深色模式 <span aria-hidden="true">{dark ? '開啟' : '關閉'}</span>
        </button>
      </header>
      <main>
        <Suspense
          fallback={
            <p className="loading" role="status">
              載入中…
            </p>
          }
        >
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pipeline" element={<PipelinePage />} />
            {(Object.keys(resourceNames) as Resource[]).map((resource) => (
              <Route key={resource} path={resource}>
                <Route index element={<RecordList key={resource} resource={resource} />} />
                <Route path=":id" element={<RecordDetail key={resource} resource={resource} />} />
              </Route>
            ))}
            <Route
              path="*"
              element={
                <p className="panel empty">
                  找不到頁面。<Link to="/">返回儀表板</Link>
                </p>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  )
}
