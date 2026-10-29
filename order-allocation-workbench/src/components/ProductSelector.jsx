import { ChevronDown, PackageSearch } from 'lucide-react'

export default function ProductSelector({ products, selectedProduct, onSelect }) {
  return (
    <section className="product-panel" id="inventory" aria-label="Select a product">
      <div className="product-panel-heading">
        <span className="section-eyebrow">PRODUCT IN FOCUS</span>
        <span className="stock-status"><span className="status-dot" />Inventory synced</span>
      </div>
      <div className="product-select-row">
        <span className={`product-glyph glyph-${selectedProduct.accent}`}><PackageSearch size={22} /></span>
        <div className="product-select-copy">
          <label className="sr-only" htmlFor="product-select">Product</label>
          <select
            id="product-select"
            className="product-select"
            value={selectedProduct.id}
            onChange={(event) => onSelect(event.target.value)}
          >
            {products.map((product) => (
              <option value={product.id} key={product.id}>{product.name}</option>
            ))}
          </select>
          <span className="product-variant">{selectedProduct.variant} <span className="meta-divider">·</span> {selectedProduct.sku}</span>
        </div>
        <ChevronDown className="select-chevron" size={17} aria-hidden="true" />
        <div className="product-stock">
          <span className="product-stock-number">{selectedProduct.stock}</span>
          <span className="product-stock-label">units available</span>
        </div>
      </div>
    </section>
  )
}
