import { describe, expect, it } from 'vitest'
import { matchesSearch, money, parseMoney, type Deal, type Lane } from './domain'
import { moveTarget } from './pages/Pipeline'

describe('輸入與顯示', () => {
  it('使用整數分儲存並以新臺幣顯示', () => {
    expect(parseMoney(' 1234.56 ')).toBe(123456)
    expect(parseMoney('0.2')).toBe(20)
    expect(parseMoney('.5')).toBe(50)
    expect(parseMoney('-1')).toBeNull()
    expect(parseMoney('1.001')).toBeNull()
    expect(money(123456)).toBe('NT$1,234.56')
    expect(money(Number.MAX_SAFE_INTEGER)).toBe('NT$90,071,992,547,409.91')
  })

  it('搜尋忽略前後空白和英文字母大小寫', () => {
    expect(matchesSearch('  EXamPle ', [null, 'a@example.com'])).toBe(true)
    expect(matchesSearch('不存在', ['青禾製造', null])).toBe(false)
  })
})

describe('看板落點', () => {
  const card = (id: number, stage: Deal['stage'] = 'proposal'): Deal => ({
    id, stage, name: '商機', company_id: null, company_name: null, contact_id: null, contact_name: null,
    probability: 50, amount_cents: 0, overdue: false, expected_close: null, actual_close: null, close_date: null,
  })

  it('忽略拖回原位，保留欄首、欄中、欄末及空欄的插入點', () => {
    const active = card(2)
    const lane: Lane = { stage: 'proposal', cards: [card(1), active, card(3), card(4)], count: 4,
      totals: { amount_cents: 0, expected_cents: 0, count: 4 } }
    expect(moveTarget(active, { stage: 'proposal', before_id: 2 }, lane)).toBeNull()
    expect(moveTarget(active, { stage: 'proposal', before_id: 3 }, lane)).toBeNull()
    for (const before_id of [1, 4, null]) {
      const position = { stage: 'proposal', before_id } as const
      expect(moveTarget(active, position, lane)).toEqual(position)
    }
    const empty = { stage: 'won', before_id: null } as const
    expect(moveTarget(active, empty, { ...lane, stage: 'won', cards: [] })).toEqual(empty)
  })
})
