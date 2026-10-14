import { useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const navItems = [
  'dashboard',
  'inventory',
  'pos',
  'customers',
  'prescriptions',
  'sales',
  'reports',
  'users'
];

const defaultForm = {
  name: '',
  category: 'Pain Relief',
  brand: '',
  sku: '',
  stock: 0,
  reorderLevel: 10,
  cost: 0,
  price: 0,
  unit: 'pcs'
};

const defaultCustomerForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  loyaltyId: ''
};

const defaultPrescriptionForm = {
  patientName: '',
  doctorName: '',
  medication: '',
  dosage: '',
  quantity: 1,
  expiryDate: '',
  status: 'ACTIVE',
  notes: ''
};

const money = (value) => Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('pharmacy-token') || '');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pharmacy-user') || 'null'));
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [sales, setSales] = useState([]);
  const [reports, setReports] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: 'admin@friendspharmacy.com', password: 'Password123!' });
  const [inventoryForm, setInventoryForm] = useState(defaultForm);
  const [customerForm, setCustomerForm] = useState(defaultCustomerForm);
  const [prescriptionForm, setPrescriptionForm] = useState(defaultPrescriptionForm);
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentType, setPaymentType] = useState('CASH');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }), [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [dashRes, inventoryRes, customersRes, prescriptionsRes, salesRes, reportsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`, { headers: authHeaders }),
        fetch(`${API_URL}/products`, { headers: authHeaders }),
        fetch(`${API_URL}/customers`, { headers: authHeaders }),
        fetch(`${API_URL}/prescriptions`, { headers: authHeaders }),
        fetch(`${API_URL}/sales`, { headers: authHeaders }),
        fetch(`${API_URL}/reports`, { headers: authHeaders }),
        fetch(`${API_URL}/users`, { headers: authHeaders })
      ]);

      const [dashboardData, inventoryData, customersData, prescriptionsData, salesData, reportsData, usersData] = await Promise.all([
        dashRes.json(),
        inventoryRes.json(),
        customersRes.json(),
        prescriptionsRes.json(),
        salesRes.json(),
        reportsRes.json(),
        usersRes.json()
      ]);

      setDashboard(dashboardData);
      setInventory(inventoryData);
      setCustomers(customersData);
      setPrescriptions(prescriptionsData);
      setSales(salesData);
      setReports(reportsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Load error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const logout = () => {
    localStorage.removeItem('pharmacy-token');
    localStorage.removeItem('pharmacy-user');
    setToken('');
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Login failed');
        return;
      }
      localStorage.setItem('pharmacy-token', data.token);
      localStorage.setItem('pharmacy-user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      alert('Unable to connect to the server.');
    }
  };

  const addProduct = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(inventoryForm)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Could not add product');
        return;
      }
      setInventory((prev) => [data, ...prev]);
      setInventoryForm(defaultForm);
    } catch (error) {
      alert('Error adding product');
    }
  };

  const addCustomer = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(customerForm)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Could not add customer');
        return;
      }
      setCustomers((prev) => [data, ...prev]);
      setCustomerForm(defaultCustomerForm);
    } catch (error) {
      alert('Error adding customer');
    }
  };

  const addPrescription = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${API_URL}/prescriptions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ ...prescriptionForm, expiryDate: prescriptionForm.expiryDate || new Date().toISOString() })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Could not add prescription');
        return;
      }
      setPrescriptions((prev) => [data, ...prev]);
      setPrescriptionForm(defaultPrescriptionForm);
    } catch (error) {
      alert('Error adding prescription');
    }
  };

  const addToCart = (product) => {
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      setCart((prev) => prev.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return;
    }
    setCart((prev) => [...prev, { productId: product.id, name: product.name, price: Number(product.price), quantity: 1 }]);
  };

  const updateCartItem = (productId, delta) => {
    setCart((prev) => prev.map((item) => item.productId === productId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAfterDiscount = Math.max(0, cartTotal - Number(discount || 0));

  const completeSale = async () => {
    if (!cart.length) {
      alert('The cart is empty.');
      return;
    }

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        paymentType,
        discount: Number(discount || 0),
        cashReceived: totalAfterDiscount,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        }))
      };

      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Could not complete sale');
        return;
      }
      setCart([]);
      setDiscount(0);
      setSelectedCustomerId('');
      alert('Sale completed successfully!');
      loadData();
    } catch (error) {
      alert('Sale failed');
    }
  };

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <h1>Friends Pharmacy POS</h1>
          <p>Sign in to continue</p>
          <form onSubmit={handleLogin}>
            <label>
              Email
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))} required />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))} required />
            </label>
            <button type="submit">Login</button>
          </form>
          <div className="demo-box">
            <strong>Demo login</strong>
            <span>Email: admin@friendspharmacy.com</span>
            <span>Password: Password123!</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <h2>Friends Pharmacy</h2>
          <span>{user?.role || 'ADMIN'}</span>
        </div>
        <nav>
          {navItems.map((item) => (
            <button key={item} className={activeTab === item ? 'nav-button active' : 'nav-button'} onClick={() => setActiveTab(item)}>
              {item.toUpperCase()}
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main className="content">
        {activeTab === 'dashboard' && (
          <section>
            <h1>Dashboard</h1>
            {dashboard && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <p>Products</p>
                    <strong>{dashboard.stats.products}</strong>
                  </div>
                  <div className="stat-card">
                    <p>Customers</p>
                    <strong>{dashboard.stats.customers}</strong>
                  </div>
                  <div className="stat-card">
                    <p>Sales</p>
                    <strong>{dashboard.stats.sales}</strong>
                  </div>
                  <div className="stat-card">
                    <p>Revenue</p>
                    <strong>${money(dashboard.stats.revenue)}</strong>
                  </div>
                </div>

                <div className="panel-grid">
                  <div className="panel">
                    <h3>Low stock alerts</h3>
                    <ul className="simple-list">
                      {dashboard.lowStockProducts.length ? dashboard.lowStockProducts.map((item) => (
                        <li key={item.id}><span>{item.name}</span><strong>{item.stock} left</strong></li>
                      )) : <li>No low-stock products.</li>}
                    </ul>
                  </div>

                  <div className="panel">
                    <h3>Recent sales</h3>
                    <ul className="simple-list">
                      {dashboard.recentSales.map((sale) => (
                        <li key={sale.id}><span>#{sale.saleNumber}</span><strong>${money(sale.total)}</strong></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'inventory' && (
          <section>
            <h1>Inventory</h1>
            <form className="form-card" onSubmit={addProduct}>
              <h3>Add new product</h3>
              <div className="fields-grid">
                <input placeholder="Name" value={inventoryForm.name} onChange={(e) => setInventoryForm((prev) => ({ ...prev, name: e.target.value }))} required />
                <input placeholder="Category" value={inventoryForm.category} onChange={(e) => setInventoryForm((prev) => ({ ...prev, category: e.target.value }))} required />
                <input placeholder="Brand" value={inventoryForm.brand} onChange={(e) => setInventoryForm((prev) => ({ ...prev, brand: e.target.value }))} />
                <input placeholder="SKU" value={inventoryForm.sku} onChange={(e) => setInventoryForm((prev) => ({ ...prev, sku: e.target.value }))} />
                <input type="number" placeholder="Stock" value={inventoryForm.stock} onChange={(e) => setInventoryForm((prev) => ({ ...prev, stock: Number(e.target.value) }))} />
                <input type="number" placeholder="Reorder Level" value={inventoryForm.reorderLevel} onChange={(e) => setInventoryForm((prev) => ({ ...prev, reorderLevel: Number(e.target.value) }))} />
                <input type="number" step="0.01" placeholder="Cost" value={inventoryForm.cost} onChange={(e) => setInventoryForm((prev) => ({ ...prev, cost: Number(e.target.value) }))} />
                <input type="number" step="0.01" placeholder="Price" value={inventoryForm.price} onChange={(e) => setInventoryForm((prev) => ({ ...prev, price: Number(e.target.value) }))} required />
                <input placeholder="Unit" value={inventoryForm.unit} onChange={(e) => setInventoryForm((prev) => ({ ...prev, unit: e.target.value }))} />
              </div>
              <button type="submit">Save Product</button>
            </form>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Reorder</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                      <td>{product.stock}</td>
                      <td>${money(product.price)}</td>
                      <td>{product.reorderLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'pos' && (
          <section>
            <h1>Point of Sale</h1>
            <div className="pos-layout">
              <div className="panel">
                <h3>Products</h3>
                <div className="product-list">
                  {inventory.map((product) => (
                    <button key={product.id} className="product-item" onClick={() => addToCart(product)}>
                      <span>{product.name}</span>
                      <strong>${money(product.price)}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h3>Cart</h3>
                {cart.length === 0 ? <p>No items yet.</p> : (
                  <>
                    {cart.map((item) => (
                      <div key={item.productId} className="cart-row">
                        <span>{item.name}</span>
                        <div>
                          <button onClick={() => updateCartItem(item.productId, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateCartItem(item.productId, 1)}>+</button>
                        </div>
                        <strong>${money(item.price * item.quantity)}</strong>
                      </div>
                    ))}
                    <div className="checkout-box">
                      <label>
                        Customer
                        <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
                          <option value="">Walk-in</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>{customer.name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Payment
                        <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                          <option value="CASH">Cash</option>
                          <option value="CARD">Card</option>
                          <option value="MOBILE_MONEY">Mobile Money</option>
                          <option value="INSURANCE">Insurance</option>
                        </select>
                      </label>
                      <label>
                        Discount
                        <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value || 0))} />
                      </label>
                      <div className="totals">
                        <span>Subtotal</span>
                        <strong>${money(cartTotal)}</strong>
                      </div>
                      <div className="totals">
                        <span>Discount</span>
                        <strong>${money(discount)}</strong>
                      </div>
                      <div className="totals grand-total">
                        <span>Total</span>
                        <strong>${money(totalAfterDiscount)}</strong>
                      </div>
                      <button onClick={completeSale}>Complete Sale</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'customers' && (
          <section>
            <h1>Customers</h1>
            <form className="form-card" onSubmit={addCustomer}>
              <h3>Add customer</h3>
              <div className="fields-grid">
                <input placeholder="Customer name" value={customerForm.name} onChange={(e) => setCustomerForm((prev) => ({ ...prev, name: e.target.value }))} required />
                <input placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm((prev) => ({ ...prev, phone: e.target.value }))} />
                <input placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm((prev) => ({ ...prev, email: e.target.value }))} />
                <input placeholder="Address" value={customerForm.address} onChange={(e) => setCustomerForm((prev) => ({ ...prev, address: e.target.value }))} />
                <input placeholder="Loyalty ID" value={customerForm.loyaltyId} onChange={(e) => setCustomerForm((prev) => ({ ...prev, loyaltyId: e.target.value }))} />
              </div>
              <button type="submit">Save Customer</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Loyalty</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{customer.phone || '-'}</td>
                      <td>{customer.email || '-'}</td>
                      <td>{customer.loyaltyId || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'prescriptions' && (
          <section>
            <h1>Prescriptions</h1>
            <form className="form-card" onSubmit={addPrescription}>
              <h3>New prescription</h3>
              <div className="fields-grid">
                <input placeholder="Patient name" value={prescriptionForm.patientName} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, patientName: e.target.value }))} required />
                <input placeholder="Doctor name" value={prescriptionForm.doctorName} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, doctorName: e.target.value }))} required />
                <input placeholder="Medication" value={prescriptionForm.medication} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, medication: e.target.value }))} required />
                <input placeholder="Dosage" value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, dosage: e.target.value }))} />
                <input type="number" placeholder="Quantity" value={prescriptionForm.quantity} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))} />
                <input type="date" value={prescriptionForm.expiryDate} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, expiryDate: e.target.value }))} />
                <select value={prescriptionForm.status} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, status: e.target.value }))}>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="USED">Used</option>
                  <option value="EXPIRED">Expired</option>
                </select>
                <input placeholder="Notes" value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, notes: e.target.value }))} />
              </div>
              <button type="submit">Save Prescription</button>
            </form>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Medication</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <td>{prescription.patientName}</td>
                      <td>{prescription.medication}</td>
                      <td>{prescription.doctorName}</td>
                      <td>{prescription.status}</td>
                      <td>{new Date(prescription.expiryDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'sales' && (
          <section>
            <h1>Sales History</h1>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sale</th>
                    <th>Cashier</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.saleNumber}</td>
                      <td>{sale.cashier?.name || '-'}</td>
                      <td>{sale.customer?.name || 'Walk-in'}</td>
                      <td>${money(sale.total)}</td>
                      <td>{sale.paymentType}</td>
                      <td>{new Date(sale.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'reports' && (
          <section>
            <h1>Reports</h1>
            {reports && (
              <div className="report-grid">
                <div className="stat-card">
                  <p>Total Revenue</p>
                  <strong>${money(reports.revenue)}</strong>
                </div>
                <div className="stat-card">
                  <p>Total Units Sold</p>
                  <strong>{reports.unitsSold}</strong>
                </div>
                <div className="stat-card">
                  <p>Total Sales</p>
                  <strong>{reports.totalSales}</strong>
                </div>
                <div className="panel">
                  <h3>Top products</h3>
                  <ul className="simple-list">
                    {reports.topProducts.map((item, index) => (
                      <li key={`${item.product}-${index}`}><span>{item.product}</span><strong>{item.quantity}</strong></li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'users' && (
          <section>
            <h1>Users & Roles</h1>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
