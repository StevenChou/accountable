import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { DndContextProps, DragEndEvent } from '@dnd-kit/core'
import { useEffect } from 'react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { localDate, stages, type Pipeline, type Stage } from '../src/domain'
import { PipelinePage } from '../src/pages/Pipeline'
import { deal } from './fixtures'

const dnd = vi.hoisted(() => ({ handlers: undefined as DndContextProps | undefined }))

// Feed drop events into the page while leaving the real providers and cards mounted.
// Browser tests exercise actual pointer dragging.
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const original = await importOriginal<typeof import('@dnd-kit/core')>()
  return {
    ...original,
    DndContext(props: DndContextProps) {
      useEffect(() => {
        dnd.handlers = props
        return () => {
          dnd.handlers = undefined
        }
      }, [props])
      return <original.DndContext {...props} />
    },
  }
})

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

function pipeline(target: Stage = 'proposal'): Pipeline {
  const close = localDate()
  const won = { ...deal, id: 5, name: '已成交案例', stage: 'won' as const, close_date: close, company_name: null }
  const moved = { ...deal, stage: target, probability: target === 'proposal' ? 40 : stages[target].probability }
  const totals = { count: 1, amount_cents: 120000, expected_cents: target === 'proposal' ? 48000 : 90000 }
  return {
    totals,
    lanes: (Object.keys(stages) as Stage[]).map((stage) => {
      const cards = stage === 'won' ? [won] : stage === target ? [moved] : []
      return {
        stage,
        cards,
        count: cards.length,
        totals: stage === target ? totals : { count: 0, amount_cents: 0, expected_cents: 0 },
      }
    }),
  }
}

const dropEvent: DragEndEvent = {
  active: { id: deal.id, data: { current: { card: deal } }, rect: { current: { initial: null, translated: null } } },
  activatorEvent: new Event('pointerdown'),
  over: {
    id: 'negotiation:end',
    data: { current: { stage: 'negotiation', before_id: null } },
    rect: { width: 1, height: 1, top: 0, left: 0, right: 1, bottom: 1 },
    disabled: false,
  },
  delta: { x: 0, y: 0 },
  collisions: null,
}

function renderPipeline() {
  render(
    <MemoryRouter>
      <PipelinePage />
    </MemoryRouter>,
  )
}

it('從成交欄新增商機時預填階段、機率和本機結案日', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(pipeline()))
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(Response.json({ ...deal, stage: 'won' }, { status: 201 }))
    .mockResolvedValueOnce(Response.json(pipeline()))
  renderPipeline()

  fireEvent.click(await screen.findByRole('button', { name: '在成交新增商機' }))
  const dialog = within(screen.getByRole('dialog', { name: '新增商機' }))
  expect(dialog.getByLabelText(/實際結案日/)).toHaveProperty('value', localDate())
  expect(dialog.getByLabelText(/成交機率/)).toHaveProperty('value', '100')
  await dialog.findByRole('combobox', { name: '主要聯絡人' })
  fireEvent.change(dialog.getByLabelText(/名稱/), { target: { value: '新成交案例' } })
  fireEvent.change(dialog.getByLabelText(/金額/), { target: { value: '10' } })
  fireEvent.click(dialog.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(screen.queryByRole('dialog', { name: '新增商機' })).toBeNull())
  expect(fetchMock).toHaveBeenNthCalledWith(4, '/api/deals', expect.objectContaining({ method: 'POST' }))
})

it('跨欄移動後，卡片和預期營收採用儲存結果', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(pipeline()))
    .mockResolvedValueOnce(Response.json(pipeline('negotiation')))
  renderPipeline()

  await screen.findByRole('button', { name: `拖曳 ${deal.name}` })
  act(() => dnd.handlers?.onDragStart?.(dropEvent))
  act(() => dnd.handlers?.onDragEnd?.(dropEvent))
  const target = within(screen.getByRole('region', { name: '議價' }))
  await target.findByRole('link', { name: deal.name })
  expect(target.getByText('75%')).toBeTruthy()
  expect(screen.getByTestId('board-expected').textContent).toBe('NT$900')
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/deals/3/move',
    expect.objectContaining({
      method: 'POST',
      body: '{"stage":"negotiation","before_id":null}',
    }),
  )
})

it('移動遭後端拒絕時保留原位置並顯示原因', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(pipeline()))
    .mockResolvedValueOnce(Response.json({ message: '目標位置已變更。' }, { status: 422 }))
  renderPipeline()

  await screen.findByRole('link', { name: deal.name })
  act(() => dnd.handlers?.onDragEnd?.(dropEvent))
  await screen.findByText('目標位置已變更。')
  const source = within(screen.getByRole('region', { name: '提案' }))
  expect(source.getByRole('link', { name: deal.name })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(2)
})

it('移動結果不明時重新讀取看板，且不重送寫入', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(pipeline()))
    .mockRejectedValueOnce(new TypeError('connection lost'))
    .mockResolvedValueOnce(Response.json(pipeline('negotiation')))
  renderPipeline()

  await screen.findByRole('link', { name: deal.name })
  act(() => dnd.handlers?.onDragEnd?.(dropEvent))
  await screen.findByText(/看板已重新讀取/)
  expect(within(screen.getByRole('region', { name: '議價' })).getByRole('link', { name: deal.name })).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(3)
})

it('放開卡片時若沒有有效落點，不會呼叫移動 API', async () => {
  fetchMock.mockResolvedValueOnce(Response.json(pipeline()))
  renderPipeline()

  await screen.findByRole('link', { name: deal.name })
  act(() => dnd.handlers?.onDragStart?.(dropEvent))
  act(() => dnd.handlers?.onDragEnd?.({ ...dropEvent, over: null }))
  expect(screen.getAllByRole('link', { name: deal.name })).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledTimes(1)
})
