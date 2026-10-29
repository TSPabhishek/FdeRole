import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateAllocations, rankOrders } from './allocationEngine.js'

const orders = [
  { id: 'ORD-3', priority: 'standard', customerTier: 'standard', dueDate: '2026-11-01', requested: 4 },
  { id: 'ORD-2', priority: 'high', customerTier: 'growth', dueDate: '2026-11-02', requested: 5 },
  { id: 'ORD-1', priority: 'high', customerTier: 'strategic', dueDate: '2026-11-05', requested: 6 },
]

test('ranks priority, customer tier, due date, then order ID deterministically', () => {
  assert.deepEqual(rankOrders(orders).map((order) => order.id), ['ORD-1', 'ORD-2', 'ORD-3'])
  assert.deepEqual(rankOrders([...orders]).map((order) => order.id), ['ORD-1', 'ORD-2', 'ORD-3'])
})

test('allocates in rank order and permits a partial final order', () => {
  const result = calculateAllocations(13, orders)
  assert.deepEqual(result, {
    'ORD-3': { allocated: 2, unfulfilled: 2, isManual: false },
    'ORD-2': { allocated: 5, unfulfilled: 0, isManual: false },
    'ORD-1': { allocated: 6, unfulfilled: 0, isManual: false },
  })
  assert.equal(Object.values(result).reduce((sum, item) => sum + item.allocated, 0), 13)
})

test('allocates all demand when stock is sufficient', () => {
  const result = calculateAllocations(20, orders)
  assert.equal(Object.values(result).reduce((sum, item) => sum + item.allocated, 0), 15)
  assert.equal(Object.values(result).reduce((sum, item) => sum + item.unfulfilled, 0), 0)
})

test('manual allocations reserve stock and the remaining stock follows ranking', () => {
  const baseline = calculateAllocations(10, orders)
  const result = calculateAllocations(10, orders, { 'ORD-3': 4 })
  assert.equal(result['ORD-3'].allocated, 4)
  assert.equal(result['ORD-3'].isManual, true)
  assert.equal(result['ORD-1'].allocated, 6)
  assert.equal(result['ORD-2'].allocated, 0)
  assert.equal(result['ORD-3'].allocated - baseline['ORD-3'].allocated, 4)
  assert.equal(result['ORD-2'].allocated - baseline['ORD-2'].allocated, -4)
  assert.equal(Object.values(result).reduce((sum, item) => sum + item.allocated, 0), 10)
})

test('rejects invalid quantities and overcommitted manual allocations', () => {
  assert.throws(() => calculateAllocations(-1, orders), RangeError)
  assert.throws(() => calculateAllocations(10, orders, { 'ORD-1': 7 }), RangeError)
  assert.throws(() => calculateAllocations(8, orders, { 'ORD-1': 5, 'ORD-2': 4 }), RangeError)
  assert.throws(() => calculateAllocations(10, orders, { 'ORD-404': 1 }), /unknown order/)
})
