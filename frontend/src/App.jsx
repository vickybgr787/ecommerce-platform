import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "/api";

function App() {
  const [page, setPage] = useState("dashboard");

  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [health, setHealth] = useState({
    order: "Checking...",
    user: "Checking...",
    payment: "Checking...",
  });

  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    const response = await fetch(`${API_BASE}/orders`);
    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }
    return response.json();
  };

  const fetchUsers = async () => {
    const response = await fetch(`${API_BASE}/users`);
    if (!response.ok) {
      throw new Error("Failed to fetch users");
    }
    return response.json();
  };

  const fetchPayments = async () => {
    const response = await fetch(`${API_BASE}/payments`);
    if (!response.ok) {
      throw new Error("Failed to fetch payments");
    }
    return response.json();
  };

  const checkHealth = async () => {
    setLoading(true);

    const services = [
      ["order", "/health/order"],
      ["user", "/health/user"],
      ["payment", "/health/payment"],
    ];

    const results = {};

    await Promise.all(
      services.map(async ([name, endpoint]) => {
        try {
          const response = await fetch(`${API_BASE}${endpoint}`);
          const data = await response.json();

          results[name] =
            response.ok && data.status === "healthy"
              ? "Healthy"
              : "Unhealthy";
        } catch {
          results[name] = "Down";
        }
      })
    );

    setHealth((previous) => ({
      ...previous,
      ...results,
    }));

    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      try {
        const [ordersData, usersData, paymentsData] = await Promise.all([
          fetchOrders(),
          fetchUsers(),
          fetchPayments(),
        ]);

        if (cancelled) {
          return;
        }

        setOrders(ordersData);
        setUsers(usersData);
        setPayments(paymentsData);
      } catch (error) {
        console.error("Initial data loading error:", error);
      }

      if (!cancelled) {
        await checkHealth();
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const pageTitles = {
    dashboard: "Dashboard",
    orders: "Orders",
    users: "Users",
    payments: "Payments",
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">E</div>

          <div>
            <h2>E-Commerce</h2>
            <span>Platform</span>
          </div>
        </div>

        <nav>
          <NavButton
            label="Dashboard"
            icon="▦"
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
          />

          <NavButton
            label="Orders"
            icon="▤"
            active={page === "orders"}
            onClick={() => setPage("orders")}
          />

          <NavButton
            label="Users"
            icon="♙"
            active={page === "users"}
            onClick={() => setPage("users")}
          />

          <NavButton
            label="Payments"
            icon="€"
            active={page === "payments"}
            onClick={() => setPage("payments")}
          />
        </nav>

        <div className="sidebar-footer">
          <span className="online-dot" />
          <div>
            <strong>Environment</strong>
            <small>Development</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">E-COMMERCE PLATFORM</span>
            <h1>{pageTitles[page]}</h1>
            <p>Manage and monitor your platform services</p>
          </div>

          <button
            className="refresh-btn"
            onClick={checkHealth}
            disabled={loading}
          >
            <span>↻</span>
            {loading ? "Checking..." : "Refresh health"}
          </button>
        </header>

        <div className="content">
          {page === "dashboard" && (
            <Dashboard
              orders={orders}
              users={users}
              payments={payments}
              health={health}
            />
          )}

          {page === "orders" && (
            <OrdersPage orders={orders} setOrders={setOrders} />
          )}

          {page === "users" && (
            <UsersPage users={users} setUsers={setUsers} />
          )}

          {page === "payments" && <PaymentsPage payments={payments} />}
        </div>
      </main>
    </div>
  );
}

function NavButton({ label, icon, active, onClick }) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Dashboard({ orders, users, payments, health }) {
  const healthyServices = Object.values(health).filter(
    (status) => status === "Healthy"
  ).length;

  return (
    <div className="dashboard">
      <section className="page-intro">
        <div>
          <h2>Overview</h2>
          <p>Real-time overview of your e-commerce platform.</p>
        </div>

        <span className="environment-badge">
          <span className="status-dot healthy-dot" />
          Development
        </span>
      </section>

      <div className="stats">
        <StatCard
          title="Orders"
          value={orders.length}
          description="Total orders"
          icon="▤"
        />

        <StatCard
          title="Users"
          value={users.length}
          description="Registered users"
          icon="♙"
        />

        <StatCard
          title="Payments"
          value={payments.length}
          description="Processed payments"
          icon="€"
        />

        <StatCard
          title="Services"
          value={`${healthyServices}/3`}
          description="Services healthy"
          icon="✓"
        />
      </div>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Service Health</h2>
            <p>Current status of application services.</p>
          </div>

          <span className="health-summary">
            {healthyServices === 3 ? "All systems operational" : "Attention required"}
          </span>
        </div>

        <div className="health-grid">
          <HealthCard
            name="Order Service"
            description="Orders and order events"
            status={health.order}
          />

          <HealthCard
            name="User Service"
            description="Customer management"
            status={health.user}
          />

          <HealthCard
            name="Payment Service"
            description="Payment processing"
            status={health.payment}
          />
        </div>
      </section>

      <section className="section architecture">
        <div className="section-header">
          <div>
            <h2>Platform Architecture</h2>
            <p>Application request and deployment flow.</p>
          </div>
        </div>

        <div className="architecture-flow">
          <ArchitectureNode label="React Frontend" />
          <span>→</span>
          <ArchitectureNode label="NGINX Ingress" />
          <span>→</span>
          <ArchitectureNode label="Microservices" />
          <span>→</span>
          <ArchitectureNode label="PostgreSQL / Kafka" />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-icon">{icon}</span>
        <span className="stat-label">{title}</span>
      </div>

      <strong>{value}</strong>
      <small>{description}</small>
    </div>
  );
}

function HealthCard({ name, description, status }) {
  const statusClass =
    status === "Healthy"
      ? "healthy"
      : status === "Checking..."
        ? "checking"
        : "unhealthy";

  return (
    <div className="health-card">
      <div className="health-card-info">
        <div className={`service-icon ${statusClass}`}>●</div>

        <div>
          <h3>{name}</h3>
          <p>{description}</p>
        </div>
      </div>

      <span className={`status-pill ${statusClass}`}>
        <span className="status-dot" />
        {status}
      </span>
    </div>
  );
}

function ArchitectureNode({ label }) {
  return <div className="architecture-node">{label}</div>;
}

function OrdersPage({ orders, setOrders }) {
  const [userId, setUserId] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createOrder = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(userId),
          product,
          quantity: Number(quantity),
          amount: Number(amount),
          status: "CREATED",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const data = await response.json();

      setOrders((previous) => [...previous, data]);

      setUserId("");
      setProduct("");
      setQuantity(1);
      setAmount("");
      setSuccess(`Order #${data.id} created successfully.`);
    } catch (createError) {
      console.error("Create order error:", createError);
      setError("Unable to create the order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section">
      <PageIntro
        title="Order Management"
        description="Create and review customer orders."
      />

      <div className="form-card">
        <div className="section-header">
          <div>
            <h2>Create Order</h2>
            <p>Enter the order details below.</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={createOrder}>
          <FormField label="User ID">
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="e.g. 1"
              type="number"
              min="1"
              required
            />
          </FormField>

          <FormField label="Product">
            <input
              value={product}
              onChange={(event) => setProduct(event.target.value)}
              placeholder="Product name"
              required
            />
          </FormField>

          <FormField label="Quantity">
            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              min="1"
              required
            />
          </FormField>

          <FormField label="Amount (EUR)">
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </FormField>

          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create order"}
            </button>
          </div>
        </form>

        <FormMessage error={error} success={success} />
      </div>

      <DataSection title="Orders" count={orders.length}>
        {orders.length === 0 ? (
          <EmptyState message="No orders found." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>User</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>#{order.id}</strong>
                    </td>
                    <td>#{order.user_id}</td>
                    <td>{order.product}</td>
                    <td>{order.quantity}</td>
                    <td>€{Number(order.amount).toFixed(2)}</td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataSection>
    </section>
  );
}

function UsersPage({ users, setUsers }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const createUser = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create user");
      }

      const data = await response.json();

      setUsers((previous) => [...previous, data]);

      setName("");
      setEmail("");
      setSuccess(`${data.name} was created successfully.`);
    } catch (createError) {
      console.error("Create user error:", createError);
      setError("Unable to create the user. The email may already exist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-section">
      <PageIntro
        title="User Management"
        description="Create and review platform users."
      />

      <div className="form-card">
        <div className="section-header">
          <div>
            <h2>Create User</h2>
            <p>Add a new customer to the platform.</p>
          </div>
        </div>

        <form className="form-grid two-column" onSubmit={createUser}>
          <FormField label="Full name">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="John Doe"
              required
            />
          </FormField>

          <FormField label="Email address">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="john@example.com"
              type="email"
              required
            />
          </FormField>

          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>

        <FormMessage error={error} success={success} />
      </div>

      <DataSection title="Users" count={users.length}>
        {users.length === 0 ? (
          <EmptyState message="No users found. Create your first user above." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>#{user.id}</strong>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataSection>
    </section>
  );
}

function PaymentsPage({ payments }) {
  return (
    <section className="page-section">
      <PageIntro
        title="Payment Management"
        description="Monitor payment transactions generated by the platform."
      />

      <DataSection title="Payment Transactions" count={payments.length}>
        {payments.length === 0 ? (
          <EmptyState message="No payment transactions found." />
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Payment</th>
                  <th>Order</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      <strong>#{payment.id}</strong>
                    </td>
                    <td>#{payment.order_id}</td>
                    <td>#{payment.user_id}</td>
                    <td>€{Number(payment.amount).toFixed(2)}</td>
                    <td>{payment.currency}</td>
                    <td>
                      <StatusBadge status={payment.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataSection>
    </section>
  );
}

function PageIntro({ title, description }) {
  return (
    <div className="page-intro">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function DataSection({ title, count, children }) {
  return (
    <section className="section data-section">
      <div className="section-header">
        <div>
          <h2>{title}</h2>
          <p>
            {count} {count === 1 ? "record" : "records"}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function FormField({ label, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function FormMessage({ error, success }) {
  if (error) {
    return <div className="message error-message">{error}</div>;
  }

  if (success) {
    return <div className="message success-message">{success}</div>;
  }

  return null;
}

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">○</div>
      <strong>{message}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "").toUpperCase();

  let className = "pending";

  if (
    normalizedStatus === "SUCCESS" ||
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "COMPLETED"
  ) {
    className = "success";
  } else if (
    normalizedStatus === "FAILED" ||
    normalizedStatus === "ERROR"
  ) {
    className = "failed";
  }

  return <span className={`badge ${className}`}>{normalizedStatus}</span>;
}

export default App;
