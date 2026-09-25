import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8081";

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

  useEffect(() => {
    checkHealth();
    fetchOrders();
    fetchUsers();
    fetchPayments();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Orders error:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Users error:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${API_BASE}/payments`);
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Payments error:", error);
    }
  };

  const checkHealth = async () => {
    setLoading(true);

    const services = [
      ["order", "/health/order"],
      ["user", "/health/user"],
      ["payment", "/health/payment"],
    ];

    const results = {};

    for (const [name, endpoint] of services) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();

        results[name] = data.status === "healthy" ? "Healthy" : "Unhealthy";
      } catch {
        results[name] = "Down";
      }
    }

    setHealth((previous) => ({
      ...previous,
      ...results,
    }));

    setLoading(false);
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
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
          />

          <NavButton
            label="Orders"
            active={page === "orders"}
            onClick={() => setPage("orders")}
          />

          <NavButton
            label="Users"
            active={page === "users"}
            onClick={() => setPage("users")}
          />

          <NavButton
            label="Payments"
            active={page === "payments"}
            onClick={() => setPage("payments")}
          />

          <NavButton
            label="Services"
            active={page === "services"}
            onClick={() => setPage("services")}
          />
        </nav>

        <div className="gateway">
          <span className="online-dot"></span>
          API Gateway
          <small>localhost:8081</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Order Management System</h1>
            <p>Microservices platform dashboard</p>
          </div>

          <button className="refresh-btn" onClick={checkHealth}>
            {loading ? "Checking..." : "Refresh Health"}
          </button>
        </header>

        {page === "dashboard" && (
          <Dashboard
            orders={orders}
            users={users}
            payments={payments}
            health={health}
            setPage={setPage}
          />
        )}

        {page === "orders" && <Orders orders={orders} />}

        {page === "users" && <Users users={users} />}

        {page === "payments" && <Payments payments={payments} />}

        {page === "services" && <Services health={health} />}
      </main>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick}>
      {label}
    </button>
  );
}

function Dashboard({ orders, users, payments, health, setPage }) {
  return (
    <>
      <section className="welcome">
        <h2>Dashboard</h2>
        <p>Overview of your e-commerce microservices platform.</p>
      </section>

      <section className="stats">
        <StatCard
          title="Orders"
          value={orders.length}
          onClick={() => setPage("orders")}
        />

        <StatCard
          title="Users"
          value={users.length}
          onClick={() => setPage("users")}
        />

        <StatCard
          title="Payments"
          value={payments.length}
          onClick={() => setPage("payments")}
        />
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <h2>Service Health</h2>
            <p>Current status of backend services</p>
          </div>
        </div>

        <div className="health-grid">
          <HealthCard name="Order Service" status={health.order} />
          <HealthCard name="User Service" status={health.user} />
          <HealthCard name="Payment Service" status={health.payment} />
        </div>
      </section>

      <section className="architecture">
        <h2>Request Flow</h2>

        <div className="flow">
          <div>React</div>
          <span>→</span>
          <div>Nginx Gateway</div>
          <span>→</span>
          <div>Microservices</div>
        </div>
      </section>
    </>
  );
}

function StatCard({ title, value, onClick }) {
  return (
    <button className="stat-card" onClick={onClick}>
      <span>{title}</span>
      <strong>{value}</strong>
      <small>View {title}</small>
    </button>
  );
}

function HealthCard({ name, status }) {
  const healthy = status === "Healthy";

  return (
    <div className="health-card">
      <div>
        <h3>{name}</h3>
        <p>Backend microservice</p>
      </div>

      <span className={`status ${healthy ? "healthy" : "unhealthy"}`}>
        <span className="status-dot"></span>
        {status}
      </span>
    </div>
  );
}

function Orders({ orders }) {
  return (
    <section className="page-section">
      <h2>Orders</h2>
      <p className="page-description">Orders returned by the Order Service.</p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.product}</td>
                <td>{order.quantity}</td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Users({ users }) {
  return (
    <section className="page-section">
      <h2>Users</h2>
      <p className="page-description">Users returned by the User Service.</p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
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
    </section>
  );
}

function Payments({ payments }) {
  return (
    <section className="page-section">
      <h2>Payments</h2>
      <p className="page-description">
        Payment information returned by the Payment Service.
      </p>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Payment ID</th>
              <th>Order ID</th>
              <th>User ID</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>#{payment.id}</td>
                <td>#{payment.order_id}</td>
                <td>#{payment.user_id}</td>
                <td>
                  {payment.amount} {payment.currency}
                </td>
                <td>
                  <StatusBadge status={payment.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Services({ health }) {
  return (
    <section className="page-section">
      <h2>Services</h2>
      <p className="page-description">
        Backend microservices available through the Nginx API gateway.
      </p>

      <div className="service-list">
        <ServiceRow
          name="Order Service"
          route="/orders"
          port="8000"
          status={health.order}
        />

        <ServiceRow
          name="User Service"
          route="/users"
          port="8001"
          status={health.user}
        />

        <ServiceRow
          name="Payment Service"
          route="/payments"
          port="8002"
          status={health.payment}
        />
      </div>
    </section>
  );
}

function ServiceRow({ name, route, port, status }) {
  return (
    <div className="service-row">
      <div>
        <h3>{name}</h3>
        <p>
          Route: {route} | Internal port: {port}
        </p>
      </div>

      <StatusBadge status={status} />
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`badge ${
        status === "SUCCESS" ||
        status === "CONFIRMED" ||
        status === "ACTIVE" ||
        status === "Healthy"
          ? "success"
          : status === "PENDING" || status === "PROCESSING"
            ? "pending"
            : "failed"
      }`}
    >
      {status}
    </span>
  );
}

export default App;