const priorityRank = {
  critical: 3,
  high: 2,
  standard: 1,
}

const customerRank = {
  strategic: 3,
  growth: 2,
  standard: 1,
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`)
  }
}

export function rankOrders(orders) {
  return [...orders].sort((a, b) => {
    const priorityDifference = (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0)
    if (priorityDifference !== 0) return priorityDifference

    const customerDifference = (customerRank[b.customerTier] ?? 0) - (customerRank[a.customerTier] ?? 0)
    if (customerDifference !== 0) return customerDifference

    const dueDateDifference = a.dueDate.localeCompare(b.dueDate)
    if (dueDateDifference !== 0) return dueDateDifference

    return a.id.localeCompare(b.id)
  })
}

export function calculateAllocations(stock, orders, overrides = {}) {
  assertNonNegativeInteger(stock, 'Stock')

  const ids = new Set()
  for (const order of orders) {
    if (!order.id || ids.has(order.id)) {
      throw new Error('Every order must have a unique ID.')
    }
    ids.add(order.id)
    if (!Number.isSafeInteger(order.requested) || order.requested < 0) {
      throw new RangeError(`Requested quantity for ${order.id} must be a non-negative integer.`)
    }
  }

  const pinned = new Map()
  let pinnedTotal = 0

  for (const [orderId, quantity] of Object.entries(overrides)) {
    const order = orders.find((item) => item.id === orderId)
    if (!order) throw new Error(`Manual allocation references unknown order ${orderId}.`)
    assertNonNegativeInteger(quantity, `Manual allocation for ${orderId}`)
    if (quantity > order.requested) {
      throw new RangeError(`Manual allocation for ${orderId} cannot exceed the requested quantity.`)
    }
    pinned.set(orderId, quantity)
    pinnedTotal += quantity
  }

  if (pinnedTotal > stock) {
    throw new RangeError('Manual allocations cannot exceed available stock.')
  }

  const allocations = new Map()
  for (const [orderId, quantity] of pinned) {
    allocations.set(orderId, quantity)
  }

  let remainingStock = stock - pinnedTotal
  for (const order of rankOrders(orders)) {
    if (pinned.has(order.id)) continue
    const quantity = Math.min(order.requested, remainingStock)
    allocations.set(order.id, quantity)
    remainingStock -= quantity
  }

  return Object.fromEntries(
    orders.map((order) => {
      const allocated = allocations.get(order.id) ?? 0
      return [
        order.id,
        {
          allocated,
          unfulfilled: order.requested - allocated,
          isManual: pinned.has(order.id),
        },
      ]
    }),
  )
}
