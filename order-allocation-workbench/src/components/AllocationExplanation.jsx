import { ArrowRight, BadgeCheck, Info, Sparkles } from 'lucide-react'

export default function AllocationExplanation({ product, orders, allocations, baselineAllocations, overrides }) {
  const demand = orders.reduce((total, order) => total + order.requested, 0)
  const allocated = Object.values(allocations).reduce((total, item) => total + item.allocated, 0)
  const shortfall = orders.reduce((total, order) => total + (allocations[order.id]?.unfulfilled ?? 0), 0)
  const partialOrders = orders.filter((order) => {
    const quantity = allocations[order.id]?.allocated ?? 0
    return quantity > 0 && quantity < order.requested
  })
  const unallocatedCount = orders.filter((order) => (allocations[order.id]?.allocated ?? 0) === 0).length
  const coveredCount = orders.filter((order) => (allocations[order.id]?.allocated ?? 0) === order.requested).length
  const manualOrders = orders.filter((order) => Object.hasOwn(overrides, order.id))
  const rebalancedOrders = orders.filter((order) => (
    !Object.hasOwn(overrides, order.id)
    && allocations[order.id]?.allocated !== baselineAllocations[order.id]?.allocated
  ))

  return (
    <aside className="explanation-panel" aria-labelledby="explanation-title">
      <div className="explanation-heading">
        <span className="explanation-icon"><Sparkles size={17} /></span>
        <div>
          <span className="section-eyebrow">THE WHY</span>
          <h2 id="explanation-title">Allocation logic</h2>
        </div>
        <span className="explanation-info" title="Recommendations are based on the stated rules and sample order data."><Info size={15} /></span>
      </div>

      <div className="explanation-callout">
        <div className="callout-indicator"><BadgeCheck size={16} /></div>
        <div>
          <strong>{shortfall > 0 ? `${shortfall.toLocaleString('en-US')} units unfulfilled` : 'Demand is covered'}</strong>
          <p>
            {shortfall > 0
              ? `${allocated.toLocaleString('en-US')} of ${demand.toLocaleString('en-US')} requested units are allocated. ${coveredCount} fully covered, ${partialOrders.length} partial, ${unallocatedCount} with none.`
              : `${demand.toLocaleString('en-US')} requested units fit within ${product.stock.toLocaleString('en-US')} available. All ${coveredCount} orders are covered.`}
          </p>
        </div>
      </div>

      <div className="logic-list">
        <div className="logic-item">
          <span className="logic-number">01</span>
          <div><strong>Honor priority first</strong><p>Critical orders are considered before high, then standard.</p></div>
        </div>
        <div className="logic-item">
          <span className="logic-number">02</span>
          <div><strong>Break ties consistently</strong><p>Strategic customers, earlier due dates, then order number.</p></div>
        </div>
        <div className="logic-item">
          <span className="logic-number">03</span>
          <div><strong>Allow partial fulfillment</strong><p>Remaining stock can partially fill the next order; no order exceeds its request.</p></div>
        </div>
      </div>

      <div className="outcome-block">
        <div className="outcome-heading">CURRENT OUTCOME</div>
        <div className="outcome-row"><span><span className="outcome-dot outcome-green" />Fully allocated</span><strong>{coveredCount} orders</strong></div>
        <div className="outcome-row"><span><span className="outcome-dot outcome-amber" />Partially allocated</span><strong>{partialOrders.length} {partialOrders.length === 1 ? 'order' : 'orders'}</strong></div>
        <div className="outcome-row"><span><span className="outcome-dot outcome-gray" />No stock allocated</span><strong>{unallocatedCount} orders</strong></div>
      </div>

      {manualOrders.length > 0 && (
        <div className="allocation-impact">
          <strong>Manual allocation impact</strong>
          <ul>
            {manualOrders.map((order) => {
              const quantity = allocations[order.id].allocated
              const difference = quantity - baselineAllocations[order.id].allocated
              const comparison = difference === 0
                ? 'same as recommendation'
                : `${difference > 0 ? '+' : ''}${difference} vs. recommendation`
              return <li key={order.id}><span>{order.id}</span><span>{quantity} units · {comparison}</span></li>
            })}
          </ul>
          <p>
            {rebalancedOrders.length > 0
              ? `Remaining stock rebalanced across ${rebalancedOrders.length} ${rebalancedOrders.length === 1 ? 'other order' : 'other orders'}.`
              : 'No other orders changed from the recommendation.'}
          </p>
        </div>
      )}

      {partialOrders.length > 0 && (
        <div className="partial-note">
          <span className="partial-note-icon"><Info size={14} /></span>
          <p>
            {partialOrders.map((order) => (
              <span className="partial-order" key={order.id}>
                <strong>{order.id}</strong> receives {allocations[order.id].allocated} of {order.requested} units.
              </span>
            ))}
            Later-ranked orders may receive none.
          </p>
        </div>
      )}

      <button className="policy-link" type="button" onClick={() => document.getElementById('policy-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        View policy assumptions <ArrowRight size={14} />
      </button>
    </aside>
  )
}
