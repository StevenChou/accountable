import { useRef, useState, type CSSProperties } from 'react'
import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, pointerWithin, rectIntersection,
  useDraggable, useDroppable, useSensor, useSensors,
  type CollisionDetection, type DragEndEvent,
} from '@dnd-kit/core'
import { Link } from 'react-router'
import { ApiError, errorMessage, useResource, write } from '../api'
import { CalendarDay, Loading, Notice, Overdue, PageHeading } from '../components/Common'
import { RecordForm } from '../components/RecordForm'
import { isClosed, localDate, money, stages, type Deal, type Lane, type Pipeline, type Stage } from '../domain'

type Position = { stage: Stage; before_id: number | null }

export function moveTarget(card: Deal, position: Position, lane: Lane): Position | null {
  if (card.stage !== position.stage) return position
  const index = lane.cards.findIndex(item => item.id === card.id)
  if (position.before_id === card.id || (lane.cards[index + 1]?.id ?? null) === position.before_id) return null
  return position
}

const collisionDetection: CollisionDetection = args => args.pointerCoordinates ? pointerWithin(args) : rectIntersection(args)

function DropSlot({ stage, before, empty = false }: { stage: Stage; before?: Deal; empty?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${stage}:${before?.id ?? 'end'}`,
    data: { stage, before_id: before?.id ?? null } satisfies Position,
  })
  return <div ref={setNodeRef} data-testid={`drop-${stage}-${before?.id ?? 'end'}`}
    className={`drop-slot ${isOver ? 'drop-active' : ''} ${empty ? 'drop-empty' : ''}`}>
    {empty && <span>拖曳商機到這裡</span>}
  </div>
}

function CardContent({ card }: { card: Deal }) {
  const close = card.close_date
  const closeLabel = isClosed(card.stage) ? '實際結案日' : '預計結案日'
  const displayDate = close?.startsWith(localDate().slice(0, 4))
    ? close.slice(5).replace('-', '/')
    : close
  return <>
    <Link className="record-link" to={`/deals/${card.id}`}>{card.name}</Link>
    <p className="card-company">{card.company_name ?? '未指定公司'}</p>
    <p className="card-amount num">{money(card.amount_cents)}</p>
    <div className="card-meta">
      <span className="num" title="成交機率">{card.probability}%</span>
      {close && <time className="num" dateTime={close} title={`${closeLabel} ${close}`}>{displayDate}</time>}
      {!close && <span>未填結案日</span>}
      <Overdue overdue={card.overdue} />
    </div>
  </>
}

function Card({ card, disabled }: { card: Deal; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id, data: { card }, disabled })
  return <article ref={setNodeRef} className={`deal-card ${card.overdue ? 'late-deal' : ''} ${isDragging ? 'dragging' : ''}`}>
    <CardContent card={card} />
    <button type="button" className="drag-handle" {...attributes} {...listeners}
      aria-label={`拖曳 ${card.name}`} disabled={disabled}>⠿</button>
  </article>
}

function Column({ lane, disabled, onAdd }: { lane: Lane; disabled: boolean; onAdd: () => void }) {
  const stage = stages[lane.stage]
  return <section className="lane" data-stage={lane.stage} aria-label={stage.label} style={{ '--stage-color': stage.color } as CSSProperties}>
    <header className="lane-header">
      <div className="lane-title">
        <i aria-hidden="true" /><h2>{stage.label}</h2><span className="lane-count num">{lane.count}</span>
        <button type="button" className="lane-add" onClick={onAdd} aria-label={`在${stage.label}新增商機`}>＋</button>
      </div>
      <dl className="lane-totals">
        <div><dt>進行中合計</dt><dd className="num" data-testid={`${lane.stage}-amount`}>{money(lane.totals.amount_cents)}</dd></div>
        <div><dt>預期營收</dt><dd className="num" data-testid={`${lane.stage}-expected`}>{money(lane.totals.expected_cents)}</dd></div>
      </dl>
    </header>
    <div className="lane-cards">
      {lane.cards.map(card => <div key={card.id}><DropSlot stage={lane.stage} before={card} /><Card card={card} disabled={disabled} /></div>)}
      <DropSlot stage={lane.stage} empty={!lane.cards.length} />
    </div>
  </section>
}

export function PipelinePage() {
  const query = useResource<Pipeline>('/pipeline')
  const [selected, setSelected] = useState<Stage>()
  const [active, setActive] = useState<Deal>()
  const [message, setMessage] = useState('')
  const [moving, setMoving] = useState(false)
  const inProgress = useRef(false)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  async function drop(event: DragEndEvent) {
    setActive(undefined)
    const card = event.active.data.current?.card as Deal | undefined
    const position = event.over?.data.current as Position | undefined
    if (!card || !position || !query.data || inProgress.current) return
    const lane = query.data.lanes.find(item => item.stage === position.stage)
    const target = lane && moveTarget(card, position, lane)
    if (!target) return

    inProgress.current = true
    setMoving(true)
    setMessage('')
    try {
      const pipeline = await write<Pipeline>(`/deals/${card.id}/move`, 'POST', target, AbortSignal.timeout(7000))
      query.replace(pipeline)
    } catch (problem) {
      if (problem instanceof ApiError && problem.status < 500) {
        setMessage(errorMessage(problem))
      } else {
        setMessage('移動結果待確認，正在重新讀取看板。')
        const latest = await query.reload()
        if (latest) setMessage('移動回應中斷。看板已重新讀取，請核對卡片位置。')
        else setMessage('移動結果待確認，請重試讀取看板。')
      }
    } finally {
      setMoving(false)
      inProgress.current = false
    }
  }

  const data = query.data
  return <>
    <PageHeading title="商機看板"><CalendarDay date={localDate()} /></PageHeading>
    <Loading {...query} />
    {message && <Notice>{message}</Notice>}
    {moving && <p className="loading" role="status">更新看板中…</p>}
    {data && <>
      <dl className="metrics board-metrics">
        <div className="metric"><dt>進行中商機</dt><dd className="num">{data.totals.count} 筆</dd></div>
        <div className="metric"><dt>合計金額</dt><dd className="num" data-testid="board-amount">{money(data.totals.amount_cents)}</dd></div>
        <div className="metric"><dt>預期營收</dt><dd className="num" data-testid="board-expected">{money(data.totals.expected_cents)}</dd></div>
      </dl>
      <DndContext sensors={sensors} collisionDetection={collisionDetection}
        accessibility={{
          screenReaderInstructions: { draggable: '按空白鍵拾起商機，用方向鍵移動，按空白鍵放下或按 Escape 取消。' },
          announcements: {
            onDragStart: () => '已拾起商機。',
            onDragOver: ({ over }) => over ? '已移至可放置的位置。' : '請移至可放置的位置。',
            onDragEnd: ({ over }) => over ? '已放下商機。' : '商機回到原位。',
            onDragCancel: () => '已取消移動。',
          },
        }}
        onDragStart={event => setActive(event.active.data.current?.card as Deal)}
        onDragCancel={() => setActive(undefined)}
        onDragEnd={event => void drop(event)}
      >
        <div className="board-scroll" role="region" tabIndex={0} aria-label="六個商機階段，可水平捲動">
          <div className="board-columns">
            {data.lanes.map(lane => <Column key={lane.stage} lane={lane} disabled={moving} onAdd={() => setSelected(lane.stage)} />)}
          </div>
        </div>
        <DragOverlay dropAnimation={null}>{active && <article className="deal-card drag-overlay"><CardContent card={active} /></article>}</DragOverlay>
      </DndContext>
    </>}
    {selected && <RecordForm resource="deals" initialStage={selected} onClose={() => setSelected(undefined)}
      onSaved={() => { setSelected(undefined); void query.reload() }} />}
  </>
}
