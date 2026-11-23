import { useState } from 'react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { errorMessage, useResource, write } from '../api'
import { Loading, Notice, PageHeading } from '../components/Common'
import { activityKinds, followUpGroups, localDate, localDateTime, money, stages, type Activity, type Dashboard } from '../domain'

const calendarHeading = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'full' })

function ActivityLink({ activity }: { activity: Activity }) {
  return <Link className="record-link" to={`/${activity.owner_type}/${activity.owner_id}#timeline`}>{activity.owner_name}</Link>
}

function MonthCharts({ months }: { months: Dashboard['months'] }) {
  const data = months.map(month => ({ ...month, label: `${Number(month.month.slice(5))}月` }))
  const axes = <><CartesianGrid vertical={false} stroke="#e5edee" />
    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#516b74', fontSize: 11 }} /></>
  return <div className="charts">
    <section className="panel chart-panel">
      <div className="panel-heading"><h2>每月成交金額</h2></div>
      <div className="chart" role="img" aria-label={`每月成交金額折線圖。 ${data.map(point => `${point.label} ${money(point.amount_cents)}`).join('、')}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 500, height: 170 }}>
          <LineChart data={data} margin={{ top: 6, right: 22, bottom: 5, left: 8 }}>
            {axes}
            <YAxis width={78} axisLine={false} tickLine={false} tick={{ fill: '#516b74', fontSize: 10 }} tickFormatter={value => money(Math.round(value))} />
            <Tooltip formatter={value => [money(Number(value)), '成交金額']} />
            <Line dataKey="amount_cents" stroke="#007c61" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
    <section className="panel chart-panel">
      <div className="panel-heading"><h2>每月成交筆數</h2></div>
      <div className="chart" role="img" aria-label={`每月成交筆數長條圖。 ${data.map(point => `${point.label} ${point.count} 筆`).join('、')}`}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} initialDimension={{ width: 440, height: 170 }}>
          <BarChart data={data} margin={{ top: 6, right: 18, bottom: 5, left: 8 }}>
            {axes}
            <YAxis width={24} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#516b74', fontSize: 11 }} />
            <Tooltip formatter={value => [`${value} 筆`, '成交筆數']} />
            <Bar dataKey="count" fill="#118ab2" radius={[4, 4, 0, 0]} maxBarSize={31} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  </div>
}

function StageAmounts({ rows }: { rows: Dashboard['stage_amounts'] }) {
  const largest = Math.max(1, ...rows.map(row => row.amount_cents))
  return <section className="panel">
    <div className="panel-heading"><h2>各階段商機金額</h2><Link className="text-button" to="/pipeline">查看商機看板 ›</Link></div>
    <ul className="stage-amounts">{rows.map(row => <li key={row.stage}>
      <span className="stage-title"><i style={{ background: stages[row.stage].color }} aria-hidden="true" />{stages[row.stage].label}</span>
      <span className="num">{money(row.amount_cents)}</span>
      <span className="bar-track" aria-hidden="true"><span style={{ width: `${row.amount_cents / largest * 100}%`, background: stages[row.stage].color }} /></span>
    </li>)}</ul>
  </section>
}

export function DashboardPage() {
  const query = useResource<Dashboard>('/dashboard')
  const [completing, setCompleting] = useState<number>()
  const [error, setError] = useState<unknown>()
  const data = query.data
  const date = data?.today ?? localDate()

  async function complete(activity: Activity) {
    if (completing !== undefined) return
    setCompleting(activity.id)
    setError(undefined)
    try {
      await write(`/activities/${activity.id}`, 'PATCH', { completed: true })
      await query.reload()
    } catch (problem) {
      setError(problem)
    } finally {
      setCompleting(undefined)
    }
  }

  return <>
    <PageHeading title="儀表板"><time dateTime={date}>{calendarHeading.format(new Date(`${date}T12:00`))}</time></PageHeading>
    <Loading {...query} />
    {error !== undefined && <Notice>{errorMessage(error)}</Notice>}
    {data && <div className="dashboard">
      <div className="work-list">
        <section className="panel follow-ups">
          <div className="panel-heading"><h2>待跟進事項</h2><span className="panel-note">{data.follow_ups.length} 筆</span></div>
          {data.follow_ups.length ? <ul className="task-list">{data.follow_ups.map(task => <li className="task" key={task.id}>
            <button type="button" className="complete-task" aria-label="標記完成" title="標記完成" disabled={completing !== undefined}
              onClick={() => void complete(task)}>{completing === task.id ? '…' : <span aria-hidden="true">✓</span>}</button>
            <div className="task-copy"><p>{task.content}</p><ActivityLink activity={task} /></div>
            <div className="task-when"><time className="num">{task.follow_up?.slice(5).replace('-', '/')}</time>
              <span className={`badge ${task.group}`}>{followUpGroups[task.group]}</span></div>
          </li>)}</ul> : <p className="empty">目前沒有待跟進事項。</p>}
        </section>
        <section className="panel recent">
          <div className="panel-heading"><h2>近期活動</h2><span className="panel-note">最新 {data.recent.length} 筆</span></div>
          {data.recent.length ? <ul className="activity-list">{data.recent.map(activity => <li className="activity" key={activity.id}>
            <time className="num" dateTime={activity.occurred_at}>{localDateTime(new Date(activity.occurred_at)).slice(5).replace('-', '/').replace('T', ' ')}</time>
            <i className={`activity-dot kind-${activity.kind}`} aria-hidden="true" />
            <div><span className="activity-type">{activityKinds[activity.kind]}</span><p>{activity.content}</p></div>
            <ActivityLink activity={activity} />
          </li>)}</ul> : <p className="empty">目前沒有近期活動。</p>}
        </section>
      </div>
      <dl className="metrics summary-metrics">
        <div className="panel metric"><dt>本月成交金額</dt><dd className="num">{money(data.won.amount_cents)}</dd><small>{data.won.count} 筆成交</small></div>
        <div className="panel metric"><dt>進行中商機</dt><dd className="num">{money(data.open.amount_cents)}</dd><small>{data.open.count} 筆商機</small></div>
        <div className="panel metric"><dt>預期營收</dt><dd className="num">{money(data.open.expected_cents)}</dd><small>依成交機率加權</small></div>
      </dl>
      <MonthCharts months={data.months} />
      <StageAmounts rows={data.stage_amounts} />
    </div>}
  </>
}
