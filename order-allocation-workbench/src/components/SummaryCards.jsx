import { AlertTriangle, ArrowDown, ArrowUpRight, Boxes, CheckCircle2, PackageOpen } from 'lucide-react'

function formatNumber(number) {
  return new Intl.NumberFormat('en-US').format(number)
}

export default function SummaryCards({ stock, demand, allocated, unfulfilled, orderCount }) {
  const coverage = demand === 0 ? 100 : Math.round((allocated / demand) * 100)
  const items = [
    {
      label: 'Available stock',
      value: formatNumber(stock),
      unit: 'units on hand',
      icon: Boxes,
      iconClass: 'icon-sage',
      detail: stock >= demand ? 'Enough for every order' : `${formatNumber(demand - stock)} units short`,
      detailIcon: stock >= demand ? ArrowUpRight : ArrowDown,
      detailClass: stock >= demand ? 'detail-positive' : 'detail-warning',
    },
    {
      label: 'Total demand',
      value: formatNumber(demand),
      unit: `across ${orderCount} orders`,
      icon: PackageOpen,
      iconClass: 'icon-lavender',
      detail: `${coverage}% covered`,
      detailIcon: ArrowUpRight,
      detailClass: 'detail-neutral',
    },
    {
      label: 'Recommended allocation',
      value: formatNumber(allocated),
      unit: 'units reserved',
      icon: CheckCircle2,
      iconClass: 'icon-blue',
      detail: stock > 0 ? `${Math.round((allocated / stock) * 100)}% of stock committed` : 'No stock available',
      detailIcon: ArrowUpRight,
      detailClass: 'detail-neutral',
    },
    {
      label: 'Unfulfilled',
      value: formatNumber(unfulfilled),
      unit: 'units still needed',
      icon: AlertTriangle,
      iconClass: unfulfilled > 0 ? 'icon-peach' : 'icon-sage',
      detail: unfulfilled > 0 ? 'Requires a decision' : 'All demand covered',
      detailIcon: unfulfilled > 0 ? ArrowDown : ArrowUpRight,
      detailClass: unfulfilled > 0 ? 'detail-warning' : 'detail-positive',
    },
  ]

  return (
    <section className="summary-grid" aria-label="Allocation summary">
      {items.map(({ label, value, unit, icon: Icon, iconClass, detail, detailIcon: DetailIcon, detailClass }) => (
        <article className="summary-card" key={label}>
          <div className={`summary-icon ${iconClass}`}><Icon size={18} strokeWidth={1.9} /></div>
          <div className="summary-label">{label}</div>
          <div className="summary-value-row">
            <span className="summary-value">{value}</span>
            <span className="summary-unit">{unit}</span>
          </div>
          <div className={`summary-detail ${detailClass}`}>
            <DetailIcon size={13} strokeWidth={2.2} />{detail}
          </div>
        </article>
      ))}
    </section>
  )
}
