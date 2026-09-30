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
    return response.json();
  };

  const fetchUsers = async () => {
    const response = await fetch(`${API_BASE}/users`);
    return response.json();
  };

  const fetchPayments = async () => {
    const response = await fetch(`${API_BASE}/payments`);
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

    for (const [name, endpoint] of services) {
      try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();

        results[name] =
          data.status === "healthy" ? "Healthy" : "Unhealthy";
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
                data.status === "healthy" ? "Healthy" : "Unhealthy";
            } catch {
              results[name] = "Down";
            }
          })
        );

        if (cancelled) {
          return;
        }

        setHealth((previous) => ({
          ...previous,
          ...results,
        }));
      } catch (error) {
        console.error("Initial data loading error:", error);
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

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
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <div>
            <h1>
              {page === "dashboard" && "Dashboard"}
              {page === "orders" && "Orders"}
              {page === "users" && "Users"}
              {page === "payments" && "Payments"}
            </h1>

            <p>E-Commerce Platform</p>
          </div>

          <button
            className="refresh-button"
            onClick={checkHealth}
            disabled={loading}
          >
            {loading ? "Checking..." : "Refresh Health"}
          </button>
        </header>

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
      </main>
    </div>
  );
}

function NavButton({ label, active, onClick }) {
  return (
    <button
      className={`nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function Dashboard({ orders, users, payments, health }) {
  return (
    <div className="dashboard">
      <div className="stats">
        <StatCard title="Orders" value={orders.length} />
        <StatCard title="Users" value={users.length} />
        <StatCard title="Payments" value={payments.length} />
      </div>

      <section className="health-section">
        <h2>Service Health</h2>

        <div className="health-grid">
          <HealthCard name="Order Service" status={health.order} />
          <HealthCard name="User Service" status={health.user} />
          <HealthCard name="Payment Service" status={health.payment} />
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h3>{title}</h3>
      <strong>{value}</strong>
    </div>
  );
}

function HealthCard({ name, status }) {
  return (
    <div className="health-card">
      <h3>{name}</h3>
      <span>{status}</span>
    </div>
  );
}

function OrdersPage({ orders, setOrders }) {
  const [userId, setUserId] = useState("");
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [amount, setAmount] = useState("");

  const createOrder = async (event) => {
    event.preventDefault();

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

      const data = await response.json();

      setOrders([...orders, data]);

      setUserId("");
      setProduct("");
      setQuantity(1);
      setAmount("");
    } catch (error) {
      console.error("Create order error:", error);
    }
  };

  return (
    <section>
      <h2>Create Order</h2>

      <form onSubmit={createOrder}>
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="User ID"
          required
        />

        <input
          value={product}
          onChange={(event) => setProduct(event.target.value)}
          placeholder="Product"
          required
        />

        <input
          type="number"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          min="1"
          required
        />

        <input
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Amount"
          step="0.01"
          required
        />

        <button type="submit">Create Order</button>
      </form>

      <h2>Orders</h2>

      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </section>
  );
}

function UsersPage({ users, setUsers }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const createUser = async (event) => {
    event.preventDefault();

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

      const data = await response.json();

      setUsers([...users, data]);

      setName("");
      setEmail("");
    } catch (error) {
      console.error("Create user error:", error);
    }
  };

  return (
    <section>
      <h2>Create User</h2>

      <form onSubmit={createUser}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Name"
          required
        />

        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          type="email"
          required
        />

        <button type="submit">Create User</button>
      </form>

      <h2>Users</h2>

      <pre>{JSON.stringify(users, null, 2)}</pre>
    </section>
  );
}

function PaymentsPage({ payments }) {
  return (
    <section>
      <h2>Payments</h2>

      <pre>{JSON.stringify(payments, null, 2)}</pre>
    </section>
  );
}

export default App;
