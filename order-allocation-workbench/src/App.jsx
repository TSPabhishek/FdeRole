import { useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, ChevronDown, CircleHelp, Download, Package, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react'
import Header from './components/Header.jsx'
import SummaryCards from './components/SummaryCards.jsx'
import ProductSelector from './components/ProductSelector.jsx'
import OrdersTable from './components/OrdersTable.jsx'
import AllocationExplanation from './components/AllocationExplanation.jsx'
import { products, sampleOrders } from './data/sampleData.js'
import { calculateAllocations, rankOrders } from './utils/allocationEngine.js'
import './App.css'

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState(products[0].id)
  const [orders, setOrders] = useState(sampleOrders)
  const [overrides, setOverrides] = useState({})
  const [notice, setNotice] = useState('')

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0]
  const productOrders = useMemo(
    () => orders.filter((order) => order.productId === selectedProductId),
    [orders, selectedProductId],
  )
  const productOverrides = useMemo(
    () => Object.fromEntries(Object.entries(overrides).filter(([id]) => productOrders.some((order) => order.id === id))),
    [overrides, productOrders],
  )
  const allocations = useMemo(
    () => calculateAllocations(selectedProduct.stock, productOrders, productOverrides),
    [productOrders, productOverrides, selectedProduct.stock],
  )
  const baselineAllocations = useMemo(
    () => calculateAllocations(selectedProduct.stock, productOrders),
    [productOrders, selectedProduct.stock],
  )
  const rankedOrders = useMemo(() => rankOrders(productOrders), [productOrders])

  const demand = productOrders.reduce((total, order) => total + order.requested, 0)
  const allocated = Object.values(allocations).reduce((total, allocation) => total + allocation.allocated, 0)
  const unfulfilled = productOrders.reduce((total, order) => total + allocations[order.id].unfulfilled, 0)

  function handleProductSelect(productId) {
    setSelectedProductId(productId)
    setNotice('')
  }

  function handlePriorityChange(orderId, priority) {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, priority } : order))
    setNotice(`Priority updated. Recommendations recalculated for ${selectedProduct.name}.`)
  }

  function handleAllocationChange(orderId, requestedQuantity, maxAllocation) {
    const order = productOrders.find((item) => item.id === orderId)
    const nextQuantity = Math.min(Math.max(0, requestedQuantity), maxAllocation, order.requested)
    setOverrides((current) => ({ ...current, [orderId]: nextQuantity }))
    setNotice(nextQuantity < requestedQuantity
      ? `Allocation capped at ${nextQuantity} units to protect available stock and this order's request.`
      : `Manual allocation saved for ${orderId}. Remaining recommendations were recalculated.`)
  }

  function handleReset() {
    setOrders(sampleOrders)
    setOverrides({})
    setNotice('Recommendations restored using the default priority policy.')
  }

  function exportAllocations() {
    const rows = [
      ['Order', 'Customer', 'Product', 'Priority', 'Due date', 'Requested', 'Allocated', 'Unfulfilled'],
      ...rankedOrders.map((order) => [
        order.id,
        order.customer,
        selectedProduct.name,
        order.priority,
        order.dueDate,
        order.requested,
        allocations[order.id].allocated,
        allocations[order.id].unfulfilled,
      ]),
    ]
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${selectedProduct.sku.toLowerCase()}-allocations.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Allocation report downloaded.')
  }

  return (
    <div className="app-shell" id="overview">
      <Header />
      <main className="page-content">
        <div className="breadcrumbs"><span>Operations</span><span className="breadcrumb-divider">/</span><strong>Order allocation</strong></div>

        <section className="page-heading">
          <div>
            <div className="heading-kicker"><span className="live-dot" /> SUPPLY PLANNING <span className="heading-kicker-divider">/</span> WORKBENCH</div>
            <h1>Order allocation</h1>
            <p className="page-subtitle">Make confident calls when demand is higher than supply.</p>
          </div>
          <div className="heading-actions">
            <span className="last-updated"><CalendarDays size={15} /> Today, Oct 29 <ChevronDown size={13} /></span>
            <button className="button button-outline help-button" type="button" onClick={() => document.getElementById('policy-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
              <CircleHelp size={15} /> How it works
            </button>
            <button className="button button-primary" type="button" onClick={exportAllocations}>
              <Download size={15} /> Export report
            </button>
          </div>
        </section>

        <ProductSelector products={products} selectedProduct={selectedProduct} onSelect={handleProductSelect} />
        <SummaryCards stock={selectedProduct.stock} demand={demand} allocated={allocated} unfulfilled={unfulfilled} orderCount={productOrders.length} />

        <div className="workbench-grid">
          <div className="workbench-main">
            <OrdersTable
              orders={rankedOrders}
              allocations={allocations}
              overrides={overrides}
              stock={selectedProduct.stock}
              onPriorityChange={handlePriorityChange}
              onAllocationChange={handleAllocationChange}
              onReset={handleReset}
            />
            <section className="assumptions-panel" id="policy-details">
              <div className="assumptions-icon"><ShieldCheck size={17} /></div>
              <div className="assumptions-copy">
                <strong>Policy assumptions &amp; limitations</strong>
                <p>Recommendations use priority, customer tier, due date, then order ID. Manual edits reserve stock first. This simple greedy policy does not optimize order value, split stock proportionally, account for replenishment, or replace a human review.</p>
              </div>
              <span className="sample-data-badge"><Package size={13} /> Sample data</span>
            </section>
          </div>
          <AllocationExplanation
            product={selectedProduct}
            orders={rankedOrders}
            allocations={allocations}
            baselineAllocations={baselineAllocations}
            overrides={productOverrides}
          />
        </div>

        <div className="page-footnote">
          <span><Sparkles size={13} /> A recommendation, not a commitment</span>
          <span>Review customer agreements before confirming orders.</span>
        </div>
        <div className="toast-region" aria-live="polite" aria-atomic="true">
          {notice && <span className="toast-message"><RefreshCw size={14} />{notice}<button type="button" aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></span>}
        </div>
      </main>
      <button className="floating-help" type="button" aria-label="Allocation help" onClick={() => document.getElementById('policy-details')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
        <CircleHelp size={19} /><span>Need a hand?</span><ArrowRight size={14} />
      </button>
    </div>
  )
}
