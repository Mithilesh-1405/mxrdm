import { test, expect, vi } from 'vitest'
import { getDecisionView } from '../api/client'

test('client requests decision view with contract query names', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ delivery_date: '2026-01-15' }) })
  await getDecisionView('2026-01-15', '09:00')
  expect(fetchMock).toHaveBeenCalledWith('/api/v1/forecast/decision-view?delivery_date=2026-01-15&cutoff=09%3A00', {})
  fetchMock.mockRestore()
})

