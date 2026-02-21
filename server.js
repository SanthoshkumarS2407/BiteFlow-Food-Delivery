
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'savorit_secure_key_2024_sql';

// Middleware
app.use(cors());
app.use(express.json());

// 1. Serve static files from the root directory
// This allows the browser to find index.html, index.tsx, and components/
app.use(express.static(__dirname));

// Initialize Database
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
    if (err) {
        console.error('❌ Database Error:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');
    }
});

// Create Tables & Seed Data
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        price REAL,
        image TEXT,
        category TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        food_id INTEGER,
        quantity INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (food_id) REFERENCES foods(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        customer_name TEXT,
        phone TEXT,
        total REAL,
        payment_method TEXT,
        address TEXT,
        status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        food_id INTEGER,
        quantity INTEGER,
        price REAL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (food_id) REFERENCES foods(id)
    )`);

    // Seed Data
    db.get("SELECT COUNT(*) as count FROM foods", (err, row) => {
        if (row && row.count === 0) {
            console.log('🌱 Seeding initial food menu...');
            const initialFoods = [
                ['Classic Margherita Pizza', 'Fresh mozzarella, basil, olive oil', 12.99, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca', 'Veg'],
                ['Spicy Chicken Burger', 'Crispy chicken, spicy mayo, brioche', 10.49, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd', 'Non-Veg'],
                ['Paneer Butter Masala', 'Rich tomato and cream gravy', 14.50, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7', 'Veg'],
                ['Truffle Fries', 'Truffle oil and parmesan', 7.99, 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877', 'Snacks'],
                ['Mango Lassi', 'Sweet yogurt mango blend', 4.99, 'https://images.unsplash.com/photo-1546173159-315724a31696', 'Drinks']
            ];
            const stmt = db.prepare("INSERT INTO foods (name, description, price, image, category) VALUES (?, ?, ?, ?, ?)");
            initialFoods.forEach(food => stmt.run(food));
            stmt.finalize();
        }
    });

    db.get("SELECT COUNT(*) as count FROM users WHERE email = 'admin@savorit.com'", async (err, row) => {
        if (row && row.count === 0) {
            console.log('👤 Seeding default admin account...');
            const hashedPw = await bcrypt.hash('admin123', 10);
            db.run(`INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`, 
                ['System Admin', 'admin@savorit.com', hashedPw, 'admin']);
        }
    });
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

/** API ROUTES **/
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, hashedPassword], function(err) {
            if (err) return res.status(400).json({ error: "Email already exists" });
            const user = { id: this.lastID, name, email, role: 'user' };
            const token = jwt.sign(user, JWT_SECRET);
            res.json({ user, token });
        });
    } catch (e) { res.status(500).json({ error: "Registration failed" }); }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const { password: _, ...userSafe } = user;
        const token = jwt.sign(userSafe, JWT_SECRET);
        res.json({ user: userSafe, token });
    });
});

app.get('/api/foods', (req, res) => {
    db.all("SELECT * FROM foods", [], (err, rows) => res.json(rows));
});

app.get('/api/cart', authenticateToken, (req, res) => {
    db.all(`SELECT f.*, c.quantity FROM cart c JOIN foods f ON c.food_id = f.id WHERE c.user_id = ?`, [req.user.id], (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/cart', authenticateToken, (req, res) => {
    const { food_id, quantity } = req.body;
    db.get("SELECT * FROM cart WHERE user_id = ? AND food_id = ?", [req.user.id, food_id], (err, row) => {
        if (row) {
            const newQty = row.quantity + quantity;
            if (newQty <= 0) {
                db.run("DELETE FROM cart WHERE id = ?", [row.id], () => res.sendStatus(200));
            } else {
                db.run("UPDATE cart SET quantity = ? WHERE id = ?", [newQty, row.id], () => res.sendStatus(200));
            }
        } else if (quantity > 0) {
            db.run("INSERT INTO cart (user_id, food_id, quantity) VALUES (?, ?, ?)", [req.user.id, food_id, quantity], () => res.sendStatus(201));
        } else {
            res.sendStatus(400);
        }
    });
});

app.delete('/api/cart/:foodId', authenticateToken, (req, res) => {
    db.run("DELETE FROM cart WHERE user_id = ? AND food_id = ?", [req.user.id, req.params.foodId], (err) => {
        res.sendStatus(err ? 500 : 200);
    });
});

app.post('/api/orders', authenticateToken, (req, res) => {
    const { total, payment_method, address, items, customer_name, phone } = req.body;
    db.run(`INSERT INTO orders (user_id, total, payment_method, address, customer_name, phone) VALUES (?, ?, ?, ?, ?, ?)`, 
        [req.user.id, total, payment_method, address, customer_name, phone], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        const order_id = this.lastID;
        const stmt = db.prepare("INSERT INTO order_items (order_id, food_id, quantity, price) VALUES (?, ?, ?, ?)");
        items.forEach(item => stmt.run([order_id, item.id, item.quantity, item.price]));
        stmt.finalize(() => {
            db.run("DELETE FROM cart WHERE user_id = ?", [req.user.id], () => res.json({ id: order_id }));
        });
    });
});

app.get('/api/orders', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        const fetchItems = orders.map(order => new Promise((resolve) => {
            db.all(`SELECT f.name, oi.quantity, oi.price FROM order_items oi JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = ?`, [order.id], (err, items) => {
                resolve({ ...order, items: items || [] });
            });
        }));
        Promise.all(fetchItems).then(results => res.json(results));
    });
});

app.get('/api/admin/orders', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.all(`SELECT o.*, u.name as user_account_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC`, (err, rows) => res.json(rows || []));
});

// 2. Catch-all: Serve index.html for any other request (SPA Support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 SavorIt is live at http://localhost:${PORT}`);
    console.log(`📂 SQLite database is active at ./database.db`);
});
