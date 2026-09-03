const { useEffect, useMemo, useState } = React;

const blankMedicine = { fullName: '', notes: '', expiryDate: '', quantity: '', price: '', brand: '' };
const formatMoney = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const daysToExpiry = (value) => Math.ceil((new Date(value).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);

function App() {
  const [medicines, setMedicines] = useState([]);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [medicineForm, setMedicineForm] = useState(blankMedicine);
  const [saleForm, setSaleForm] = useState({ medicineId: '', quantity: 1 });
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [medicineResponse, salesResponse] = await Promise.all([fetch('/api/medicines'), fetch('/api/sales')]);
      setMedicines(await medicineResponse.json());
      setSales(await salesResponse.json());
    } catch { setNotice({ type: 'error', text: 'Could not reach the pharmacy API. Please refresh the page.' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (notice) { const timer = setTimeout(() => setNotice(null), 4500); return () => clearTimeout(timer); } }, [notice]);

  const displayed = useMemo(() => medicines.filter(m => m.fullName.toLowerCase().includes(search.toLowerCase())), [medicines, search]);
  const lowStock = medicines.filter(m => m.quantity < 10).length;
  const expiring = medicines.filter(m => daysToExpiry(m.expiryDate) < 30).length;

  async function addMedicine(event) {
    event.preventDefault();
    const payload = { ...medicineForm, quantity: Number(medicineForm.quantity), price: Number(medicineForm.price) };
    const response = await fetch('/api/medicines', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) { setNotice({ type: 'error', text: 'Please complete all medicine details with valid values.' }); return; }
    setMedicineForm(blankMedicine); setNotice({ type: 'success', text: 'Medicine added to inventory.' }); load();
  }
  async function recordSale(event) {
    event.preventDefault();
    const response = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...saleForm, quantity: Number(saleForm.quantity) }) });
    if (!response.ok) { const body = await response.json(); setNotice({ type: 'error', text: body.message || 'Sale could not be recorded.' }); return; }
    setSaleForm({ medicineId: '', quantity: 1 }); setNotice({ type: 'success', text: 'Sale recorded and stock updated.' }); load();
  }

  return <main>
    <header className="topbar"><div className="brand"><span className="brand-mark">+</span><div><p>ABC Pharmacy</p><small>Inventory & sales desk</small></div></div><span className="status"><i></i> System online</span></header>
    <section className="compact-heading"><h1>Medicine sales &amp; Inventory</h1><div className="legend"><p><span className="swatch red"></span>Expires within 30 days</p><p><span className="swatch yellow"></span>Less than 10 units in stock</p></div></section>
    <section className="metrics"><Metric label="Medicines listed" value={medicines.length} /><Metric label="Expiry attention" value={expiring} alert="red" /><Metric label="Low stock items" value={lowStock} alert="yellow" /><Metric label="Sales recorded" value={sales.length} /></section>
    {notice && <div className={`notice ${notice.type}`}>{notice.text}<button onClick={() => setNotice(null)}>×</button></div>}
    <section className="workspace">
      <div className="left-column">
        <div className="panel inventory"><div className="panel-head"><div><p className="eyebrow">CATALOGUE</p><h2>Medicine inventory</h2></div><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicine name" /></label></div>
        <div className="table-wrap"><table><thead><tr><th>Medicine</th><th>Brand</th><th>Expiry date</th><th>Quantity</th><th>Price</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="empty">Loading inventory…</td></tr> : displayed.length ? displayed.map(m => <MedicineRow key={m.id} medicine={m} />) : <tr><td colSpan="5" className="empty">No medicines match your search.</td></tr>}</tbody></table></div>
        </div>
        <section className="sales panel"><div className="panel-head"><div><p className="eyebrow">ACTIVITY</p><h2>Recent sales</h2></div></div>{sales.length ? <div className="sales-list">{sales.slice(0, 5).map(s => <div className="sale" key={s.id}><div><strong>{s.medicineName}</strong><span>{formatDate(s.soldAt)} · {s.quantity} unit{s.quantity !== 1 && 's'}</span></div><b>{formatMoney(s.unitPrice * s.quantity)}</b></div>)}</div> : <p className="empty sales-empty">No sales have been recorded yet.</p>}</section>
      </div>
      <aside className="side-column">
        <FormCard title="Record a sale" caption="Stock updates immediately"><form onSubmit={recordSale} className="form-grid"><Field label="Medicine" full><select required value={saleForm.medicineId} onChange={e => setSaleForm({...saleForm, medicineId:e.target.value})}><option value="">Select medicine</option>{medicines.filter(m => m.quantity > 0).map(m => <option key={m.id} value={m.id}>{m.fullName} — {m.quantity} left</option>)}</select></Field><Field label="Quantity" full><input required min="1" type="number" value={saleForm.quantity} onChange={e => setSaleForm({...saleForm, quantity:e.target.value})} /></Field><button className="secondary" type="submit">Record sale</button></form></FormCard>
        <FormCard title="Add a medicine" caption="Add stock to the catalogue"><form onSubmit={addMedicine} className="form-grid"><Field label="Medicine name"><input required value={medicineForm.fullName} onChange={e => setMedicineForm({...medicineForm, fullName:e.target.value})} /></Field><Field label="Brand"><input required value={medicineForm.brand} onChange={e => setMedicineForm({...medicineForm, brand:e.target.value})} /></Field><Field label="Expiry date"><input required type="date" value={medicineForm.expiryDate} onChange={e => setMedicineForm({...medicineForm, expiryDate:e.target.value})} /></Field><Field label="Quantity"><input required min="0" type="number" value={medicineForm.quantity} onChange={e => setMedicineForm({...medicineForm, quantity:e.target.value})} /></Field><Field label="Price (₹)" full><input required min="0.01" step="0.01" type="number" value={medicineForm.price} onChange={e => setMedicineForm({...medicineForm, price:e.target.value})} /></Field><Field label="Notes" full><textarea value={medicineForm.notes} onChange={e => setMedicineForm({...medicineForm, notes:e.target.value})} /></Field><button className="primary" type="submit">Add to inventory <span>→</span></button></form></FormCard>
      </aside>
    </section>
  </main>;
}
function Metric({label, value, alert}) { return <div className={`metric ${alert || ''}`}><span>{label}</span><strong>{value}</strong></div>; }
function Field({label, full, children}) { return <label className={full ? 'full' : ''}><span>{label}</span>{children}</label>; }
function FormCard({title, caption, children}) { return <section className="form-card"><div><h3>{title}</h3><p>{caption}</p></div>{children}</section>; }
function MedicineRow({medicine}) { const expiry = daysToExpiry(medicine.expiryDate) < 30; const stock = medicine.quantity < 10; return <tr className={expiry ? 'expiring' : stock ? 'low-stock' : ''}><td><strong>{medicine.fullName}</strong>{medicine.notes && <small title={medicine.notes}>Notes available</small>}</td><td>{medicine.brand}</td><td>{formatDate(medicine.expiryDate)}</td><td><span className="quantity">{medicine.quantity}</span></td><td>{formatMoney(medicine.price)}</td></tr>; }
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
