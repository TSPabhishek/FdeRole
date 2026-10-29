import { AlertCircle, ArrowDown, Check, ChevronDown, Minus, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'

const priorityOptions = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'standard', label: 'Standard' },
]

function formatDueDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function getOrderStatus(allocation, requested) {
  if (allocation <= 0) return { label: 'Unallocated', className: 'status-unallocated' }
  if (allocation < requested) return { label: 'Partial', className: 'status-partial' }
  return { label: 'Allocated', className: 'status-allocated' }
}

export default function OrdersTable({
  orders,
  allocations,
  onPriorityChange,
  onAllocationChange,
  onReset,
  stock,
  overrides,
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('priority')
  const [sortDirection, setSortDirection] = useState('desc')

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return orders
      .filter((order) => {
        const allocation = allocations[order.id]?.allocated ?? 0
        const matchesFilter = filter === 'all'
          || (filter === 'at-risk' && allocation < order.requested)
          || (filter === 'allocated' && allocation === order.requested)
        const matchesQuery = !normalizedQuery
          || order.id.toLowerCase().includes(normalizedQuery)
          || order.customer.toLowerCase().includes(normalizedQuery)
        return matchesFilter && matchesQuery
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1
        if (sortBy === 'dueDate') return direction * a.dueDate.localeCompare(b.dueDate)
        if (sortBy === 'requested') return direction * (a.requested - b.requested)
        const priority = { standard: 1, high: 2, critical: 3 }
        const customer = { standard: 1, growth: 2, strategic: 3 }
        const priorityDifference = priority[b.priority] - priority[a.priority]
        if (priorityDifference !== 0) return direction * priorityDifference
        const customerDifference = customer[b.customerTier] - customer[a.customerTier]
        if (customerDifference !== 0) return customerDifference
        return a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)
      })
  }, [allocations, filter, orders, query, sortBy, sortDirection])

  const allocatedTotal = Object.values(allocations).reduce((total, item) => total + item.allocated, 0)
  const pinnedOtherThan = (orderId) => Object.entries(overrides)
    .filter(([id]) => id !== orderId && orders.some((order) => order.id === id))
    .reduce((total, [, quantity]) => total + quantity, 0)

  function changeSort(field) {
    if (sortBy === field) {
      setSortDirection((current) => current === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection(field === 'dueDate' ? 'asc' : 'desc')
    }
  }

  return (
    <section className="orders-panel" id="allocations">
      <div className="orders-heading">
        <div>
          <div className="orders-title-line">
            <h2>Competing orders</h2>
            <span className="order-count">{orders.length} orders</span>
          </div>
          <p>Review recommendations and adjust allocations where needed.</p>
        </div>
        <button className="button button-quiet reset-button" type="button" onClick={onReset}>
          <ArrowDown size={15} className="reset-icon" /> Reset to recommended
        </button>
      </div>

      <div className="table-toolbar">
        <div className="filter-tabs" role="group" aria-label="Filter orders">
          {[
            { id: 'all', label: 'All orders' },
            { id: 'at-risk', label: 'At risk' },
            { id: 'allocated', label: 'Fully allocated' },
          ].map((item) => (
            <button
              className={`filter-tab ${filter === item.id ? 'filter-tab-active' : ''}`}
              type="button"
              onClick={() => setFilter(item.id)}
              key={item.id}
              aria-pressed={filter === item.id}
            >
              {item.label}
              {item.id === 'at-risk' && (
                <span className="tab-count">{orders.filter((order) => (allocations[order.id]?.allocated ?? 0) < order.requested).length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="table-tools">
          <label className="search-field">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Search orders or customers</span>
            <input
              type="search"
              placeholder="Search orders..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <button
            className="button button-outline filter-button"
            type="button"
            onClick={() => {
              const nextSort = sortBy === 'dueDate' ? 'priority' : 'dueDate'
              setSortBy(nextSort)
              setSortDirection(nextSort === 'dueDate' ? 'asc' : 'desc')
            }}
          >
            <SlidersHorizontal size={15} /> Sort
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="orders-table">
          <thead>
            <tr>
              <th scope="col">Order / customer</th>
              <th scope="col"><button className="sort-heading" type="button" onClick={() => changeSort('dueDate')}>Due date <ArrowDown className={sortBy === 'dueDate' ? 'sort-active' : ''} size={13} /></button></th>
              <th scope="col">Priority</th>
              <th scope="col"><button className="sort-heading" type="button" onClick={() => changeSort('requested')}>Requested <ArrowDown className={sortBy === 'requested' ? 'sort-active' : ''} size={13} /></button></th>
              <th scope="col">Recommended allocation</th>
              <th scope="col">Unfulfilled</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleOrders.map((order) => {
              const allocation = allocations[order.id]?.allocated ?? 0
              const unfulfilled = order.requested - allocation
              const status = getOrderStatus(allocation, order.requested)
              const availableForThisOrder = Math.max(0, stock - pinnedOtherThan(order.id))
              const maxAllocation = Math.min(order.requested, availableForThisOrder)
              const percentage = order.requested === 0 ? 0 : (allocation / order.requested) * 100
              const manual = allocations[order.id]?.isManual
              const priorityLabel = priorityOptions.find((option) => option.value === order.priority)?.label

              return (
                <tr key={order.id}>
                  <td>
                    <div className="order-cell">
                      <span className={`avatar customer-avatar avatar-${order.customerTier}`}>{order.initials}</span>
                      <span className="order-customer-copy">
                        <span className="order-id">{order.id}</span>
                        <span className="customer-name">{order.customer}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`due-date ${order.dueDate <= '2026-10-31' ? 'due-soon' : ''}`}>
                      {order.dueDate <= '2026-10-31' && <AlertCircle size={13} />}
                      {formatDueDate(order.dueDate)}
                    </span>
                  </td>
                  <td>
                    <label className={`priority-control priority-${order.priority}`}>
                      <span className={`priority-dot priority-dot-${order.priority}`} />
                      <span className="sr-only">Priority for {order.id}</span>
                      <select value={order.priority} onChange={(event) => onPriorityChange(order.id, event.target.value)}>
                        {priorityOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
                      </select>
                      <span className="priority-label">{priorityLabel}</span>
                      <ChevronDown size={14} aria-hidden="true" />
                    </label>
                  </td>
                  <td><span className="quantity-cell">{order.requested}<span className="quantity-unit">units</span></span></td>
                  <td>
                    <div className="allocation-cell">
                      <div className="allocation-value-row">
                        <span className="allocation-value">{allocation}<span> / {order.requested}</span></span>
                        {manual && <span className="manual-badge"><Check size={10} /> Edited</span>}
                      </div>
                      <div className="allocation-bar"><span style={{ width: `${percentage}%` }} /></div>
                      <div className="allocation-stepper" aria-label={`Adjust allocation for ${order.id}`}>
                        <button
                          type="button"
                          aria-label={`Allocate one fewer unit to ${order.id}`}
                          disabled={allocation <= 0}
                          onClick={() => onAllocationChange(order.id, Math.max(0, allocation - 1), maxAllocation)}
                        ><Minus size={12} /></button>
                        <span>{allocation} allocated</span>
                        <button
                          type="button"
                          aria-label={`Allocate one more unit to ${order.id}`}
                          disabled={allocation >= maxAllocation}
                          onClick={() => onAllocationChange(order.id, allocation + 1, maxAllocation)}
                        ><Plus size={12} /></button>
                      </div>
                    </div>
                  </td>
                  <td><span className={`unfulfilled-value ${unfulfilled > 0 ? 'has-shortage' : ''}`}>{unfulfilled}<span className="quantity-unit">units</span></span></td>
                  <td><span className={`status-pill ${status.className}`}><span />{status.label}</span></td>
                </tr>
              )
            })}
            {visibleOrders.length === 0 && (
              <tr><td className="empty-row" colSpan="7">No orders match this search. Try another name or order number.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span>Showing <strong>{visibleOrders.length}</strong> of <strong>{orders.length}</strong> orders</span>
        <span className="footer-stock"><span className="footer-stock-dot" />{allocatedTotal.toLocaleString('en-US')} of {stock.toLocaleString('en-US')} units allocated</span>
      </div>
    </section>
  )
}
