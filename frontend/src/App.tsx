import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router'
import { RecordList } from './pages/RecordList'
import { RecordDetail } from './pages/RecordDetail'
import { resourceNames, type Resource } from './domain'
import { useAuth } from './auth'
import { SignIn } from './pages/SignIn'
import { GlobalSearch } from './components/GlobalSearch'
import { UserMenu } from './components/UserMenu'
import { useTheme, type Theme } from './theme'

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
  const auth = useAuth()
  const state = auth.state
  const [theme, changeTheme] = useTheme(initialTheme)

  if (state.status === 'loading')
    return (
      <main>
        <p className="loading" role="status">
          驗證登入中…
        </p>
      </main>
    )
  if (state.status === 'error')
    return (
      <main>
        <div className="panel empty">
          <p role="alert">{state.message}</p>
          <button className="secondary" onClick={auth.retry}>
            重試
          </button>
        </div>
      </main>
    )
  if (state.status === 'signed-out') return <SignIn demo={state.demo} signIn={auth.signIn} />

  return (
    <BrowserRouter key={state.member.email}>
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
        <div className="header-tools">
          <GlobalSearch />
          <UserMenu
            email={state.member.email}
            theme={theme}
            changeTheme={changeTheme}
            signOut={() => void auth.signOut()}
          />
        </div>
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
