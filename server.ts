import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cselitegroup_pos',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// API Routes
// Products
app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { id, name, sku, description, category, price, cost, stock, minStock, image, imageUrl } = req.body;
    await pool.query(
      "INSERT INTO products (id, name, sku, description, category, price, cost, stock, minStock, image, imageUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, sku, description, category, price, cost, stock, minStock, image, imageUrl]
    );
    res.status(201).json({ message: "Product created" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { name, sku, description, category, price, cost, stock, minStock, image, imageUrl } = req.body;
    await pool.query(
      "UPDATE products SET name=?, sku=?, description=?, category=?, price=?, cost=?, stock=?, minStock=?, image=?, imageUrl=? WHERE id=?",
      [name, sku, description, category, price, cost, stock, minStock, image, imageUrl, req.params.id]
    );
    res.json({ message: "Product updated" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Customers
app.get("/api/customers", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM customers");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { id, name, email, phone, company, address, rnc, receiptType } = req.body;
    await pool.query(
      "INSERT INTO customers (id, name, email, phone, company, address, rnc, receiptType) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, phone, company, address, rnc, receiptType]
    );
    res.status(201).json({ message: "Customer created" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { name, email, phone, company, address, rnc, receiptType } = req.body;
    await pool.query(
      "UPDATE customers SET name=?, email=?, phone=?, company=?, address=?, rnc=?, receiptType=? WHERE id=?",
      [name, email, phone, company, address, rnc, receiptType, req.params.id]
    );
    res.json({ message: "Customer updated" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM customers WHERE id=?", [req.params.id]);
    res.json({ message: "Customer deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Orders
app.get("/api/orders", async (req, res) => {
  try {
    const [orders] = await pool.query("SELECT * FROM orders");
    const [items] = await pool.query("SELECT * FROM order_items");
    
    const ordersWithItems = (orders as any[]).map(order => ({
      ...order,
      items: (items as any[]).filter(item => item.orderId === order.id)
    }));
    
    res.json(ordersWithItems);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/orders", async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id, type, date, customerId, total, status, items } = req.body;
    
    await connection.query(
      "INSERT INTO orders (id, type, date, customerId, total, status) VALUES (?, ?, ?, ?, ?, ?)",
      [id, type, date, customerId, total, status]
    );
    
    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (orderId, productId, quantity, unitPrice, total) VALUES (?, ?, ?, ?, ?)",
        [id, item.productId, item.quantity, item.unitPrice, item.total]
      );
    }
    
    await connection.commit();
    res.status(201).json({ message: "Order created" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: (error as Error).message });
  } finally {
    connection.release();
  }
});

app.delete("/api/orders/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE id=?", [req.params.id]);
    res.json({ message: "Order deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Settings
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM settings LIMIT 1");
    res.json((rows as any[])[0] || {});
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const { name, rnc, address, phone, email, website, logoUrl, currency, ncfPrefixFiscal, ncfSequenceFiscal, ncfPrefixFinal, ncfSequenceFinal } = req.body;
    const [rows] = await pool.query("SELECT id FROM settings LIMIT 1");
    
    if ((rows as any[]).length > 0) {
      await pool.query(
        "UPDATE settings SET name=?, rnc=?, address=?, phone=?, email=?, website=?, logoUrl=?, currency=?, ncfPrefixFiscal=?, ncfSequenceFiscal=?, ncfPrefixFinal=?, ncfSequenceFinal=? WHERE id=?",
        [name, rnc, address, phone, email, website, logoUrl, currency, ncfPrefixFiscal, ncfSequenceFiscal, ncfPrefixFinal, ncfSequenceFinal, (rows as any[])[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO settings (name, rnc, address, phone, email, website, logoUrl, currency, ncfPrefixFiscal, ncfSequenceFiscal, ncfPrefixFinal, ncfSequenceFinal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [name, rnc, address, phone, email, website, logoUrl, currency, ncfPrefixFiscal, ncfSequenceFiscal, ncfPrefixFinal, ncfSequenceFinal]
      );
    }
    res.json({ message: "Settings updated" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Returns
app.get("/api/returns", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM returns");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/returns", async (req, res) => {
  try {
    const { id, orderId, productId, quantity, amount, reason, date } = req.body;
    await pool.query(
      "INSERT INTO returns (id, orderId, productId, quantity, amount, reason, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, orderId, productId, quantity, amount, reason, date]
    );
    res.status(201).json({ message: "Return created" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/returns/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM returns WHERE id=?", [req.params.id]);
    res.json({ message: "Return deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Users
app.get("/api/users", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, role, status FROM users");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { id, name, email, role, status, password } = req.body;
    await pool.query(
      "INSERT INTO users (id, name, email, role, status, password) VALUES (?, ?, ?, ?, ?, ?)",
      [id, name, email, role, status || 'Activo', password || 'password123']
    );
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body;
    if (password) {
      await pool.query(
        "UPDATE users SET name=?, email=?, role=?, status=?, password=? WHERE id=?",
        [name, email, role, status, password, req.params.id]
      );
    } else {
      await pool.query(
        "UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?",
        [name, email, role, status, req.params.id]
      );
    }
    res.json({ message: "User updated" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
