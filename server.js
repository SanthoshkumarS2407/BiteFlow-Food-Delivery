require('dotenv').config();
const http = require('http');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const { setupInnovativeFeatures } = require('./server_features');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, 'database.db');
const JWT_SECRET = process.env.JWT_SECRET || 'biteflow_super_secret_key_change_this_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const DEFAULT_DELIVERY_FEE = Number(process.env.DEFAULT_DELIVERY_FEE) || 30;
const FREE_DELIVERY_MINIMUM = Number(process.env.FREE_DELIVERY_MINIMUM) || 499;
const PLATFORM_FEE = Number(process.env.PLATFORM_FEE) || 5;
const MINIMUM_ORDER_AMOUNT = Number(process.env.MINIMUM_ORDER_AMOUNT) || 100;
const MAXIMUM_ORDER_AMOUNT = Number(process.env.MAXIMUM_ORDER_AMOUNT) || 10000;

// Dynamic CORS configuration supporting Vite 5173, 3000 and custom CLIENT_URL
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:5000',
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(s => s.trim()) : [])
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}));
app.use(express.json());

// Initialize Socket.IO for real-time live order tracking & dispatching
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

io.on('connection', (socket) => {
    socket.on('join_order', (orderId) => {
        if (orderId) socket.join(`order_${orderId}`);
    });
    socket.on('join_user', (userId) => {
        if (userId) socket.join(`user_${userId}`);
    });
    socket.on('join_restaurant', (restaurantId) => {
        if (restaurantId) socket.join(`restaurant_${restaurantId}`);
    });
    socket.on('join_role', (role) => {
        if (role) socket.join(`role_${role.toUpperCase()}`);
    });
});

function emitOrderStatusUpdate(orderId, updateData) {
    if (orderId) {
        io.to(`order_${orderId}`).emit('order_status_update', updateData);
    }
    if (updateData.user_id) {
        io.to(`user_${updateData.user_id}`).emit('user_order_update', updateData);
    }
    if (updateData.restaurant_id) {
        io.to(`restaurant_${updateData.restaurant_id}`).emit('restaurant_order_update', updateData);
    }
    io.to('role_ADMIN').emit('admin_order_update', updateData);
    io.to('role_DELIVERY_PARTNER').emit('delivery_order_update', updateData);
    io.emit('order_event', updateData);
}

// Initialize Database with WAL mode & high performance
const resolvedDbPath = path.isAbsolute(DATABASE_PATH) ? DATABASE_PATH : path.join(__dirname, DATABASE_PATH);
const db = new sqlite3.Database(resolvedDbPath, (err) => {
    if (err) {
        console.error('❌ Database Connection Error:', err.message);
    } else {
        console.log(`✅ Connected to SQLite database at: ${resolvedDbPath}`);
    }
});

// Helper for safe non-destructive column additions - executes in sequence with db.serialize()
function addColumnIfNotExists(table, column, colDef) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${colDef}`, (err) => {
        // If column already exists, SQLite returns an error which we safely ignore
    });
}

// ─── DATABASE SCHEMA & PERFORMANCE TUNING ─────────────────────────────────────
db.serialize(() => {
    // SQLite Performance Optimizations
    db.run(`PRAGMA journal_mode = WAL`);
    db.run(`PRAGMA synchronous = NORMAL`);
    db.run(`PRAGMA cache_size = -64000`); // 64MB cache
    db.run(`PRAGMA temp_store = MEMORY`);
    db.run(`PRAGMA foreign_keys = ON`);

    // 1. users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        role TEXT DEFAULT 'CUSTOMER',
        status TEXT DEFAULT 'active',
        avatar TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    addColumnIfNotExists('users', 'status', "TEXT DEFAULT 'active'");

    // 2. restaurants table
    db.run(`CREATE TABLE IF NOT EXISTS restaurants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        cover_image TEXT,
        logo TEXT,
        cuisine TEXT,
        rating REAL DEFAULT 4.0,
        rating_count INTEGER DEFAULT 0,
        delivery_time TEXT DEFAULT '30-40 min',
        min_order REAL DEFAULT 0,
        price_for_two REAL DEFAULT 300,
        distance TEXT DEFAULT '2.5 km',
        is_veg INTEGER DEFAULT 0,
        is_open INTEGER DEFAULT 1,
        status TEXT DEFAULT 'APPROVED',
        offer TEXT,
        offer_code TEXT,
        address TEXT,
        area TEXT,
        city TEXT DEFAULT 'Chennai',
        state TEXT DEFAULT 'Tamil Nadu',
        pincode TEXT,
        latitude REAL,
        longitude REAL,
        phone TEXT,
        email TEXT,
        opening_hours TEXT DEFAULT '9:00 AM - 11:00 PM',
        opening_time TEXT DEFAULT '09:00',
        closing_time TEXT DEFAULT '23:00',
        avg_delivery_time TEXT DEFAULT '30 min',
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
    )`);
    addColumnIfNotExists('restaurants', 'owner_id', 'INTEGER');
    addColumnIfNotExists('restaurants', 'cover_image', 'TEXT');
    addColumnIfNotExists('restaurants', 'status', "TEXT DEFAULT 'APPROVED'");
    addColumnIfNotExists('restaurants', 'area', 'TEXT');
    addColumnIfNotExists('restaurants', 'state', "TEXT DEFAULT 'Tamil Nadu'");
    addColumnIfNotExists('restaurants', 'pincode', 'TEXT');
    addColumnIfNotExists('restaurants', 'latitude', 'REAL');
    addColumnIfNotExists('restaurants', 'longitude', 'REAL');
    addColumnIfNotExists('restaurants', 'opening_time', "TEXT DEFAULT '09:00'");
    addColumnIfNotExists('restaurants', 'closing_time', "TEXT DEFAULT '23:00'");
    addColumnIfNotExists('restaurants', 'avg_delivery_time', "TEXT DEFAULT '30 min'");
    addColumnIfNotExists('restaurants', 'email', 'TEXT');

    // 3. food_categories table
    db.run(`CREATE TABLE IF NOT EXISTS food_categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    )`);

    // 4. foods table
    db.run(`CREATE TABLE IF NOT EXISTS foods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER,
        category_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image TEXT,
        category TEXT,
        is_veg INTEGER DEFAULT 1,
        is_available INTEGER DEFAULT 1,
        rating REAL,
        rating_count INTEGER DEFAULT 0,
        prep_time TEXT DEFAULT '20 min',
        spicy_level TEXT DEFAULT 'Medium',
        calories INTEGER,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL DEFAULT 0,
        sugar REAL DEFAULT 0,
        sodium REAL DEFAULT 0,
        allergens TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES food_categories(id) ON DELETE SET NULL
    )`);
    addColumnIfNotExists('foods', 'category_id', 'INTEGER');
    addColumnIfNotExists('foods', 'prep_time', "TEXT DEFAULT '20 min'");
    addColumnIfNotExists('foods', 'spicy_level', "TEXT DEFAULT 'Medium'");
    addColumnIfNotExists('foods', 'fiber', 'REAL DEFAULT 0');
    addColumnIfNotExists('foods', 'sugar', 'REAL DEFAULT 0');
    addColumnIfNotExists('foods', 'sodium', 'REAL DEFAULT 0');

    // 5. food_customizations table
    db.run(`CREATE TABLE IF NOT EXISTS food_customizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        food_id INTEGER NOT NULL,
        group_name TEXT NOT NULL,
        option_name TEXT NOT NULL,
        price_delta REAL DEFAULT 0,
        is_required INTEGER DEFAULT 0,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    )`);

    // 6. addresses table
    db.run(`CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        label TEXT DEFAULT 'Home',
        name TEXT,
        phone TEXT,
        flat TEXT,
        street TEXT,
        area TEXT,
        city TEXT DEFAULT 'Chennai',
        state TEXT DEFAULT 'Tamil Nadu',
        pincode TEXT,
        latitude REAL,
        longitude REAL,
        instructions TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);
    addColumnIfNotExists('addresses', 'latitude', 'REAL');
    addColumnIfNotExists('addresses', 'longitude', 'REAL');

    // 7. cart table
    db.run(`CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        customizations TEXT,
        special_instructions TEXT,
        unit_price REAL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    )`);

    // 8. coupons table
    db.run(`CREATE TABLE IF NOT EXISTS coupons (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        discount_type TEXT DEFAULT 'percent',
        discount_value REAL NOT NULL,
        min_order REAL DEFAULT 0,
        max_discount REAL,
        valid_until TEXT,
        usage_limit INTEGER,
        usage_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
    )`);

    // 9. orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code TEXT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER,
        restaurant_name TEXT,
        customer_name TEXT,
        phone TEXT,
        total REAL NOT NULL,
        subtotal REAL,
        delivery_fee REAL DEFAULT 30,
        platform_fee REAL DEFAULT 5,
        tax REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        coupon_code TEXT,
        payment_method TEXT DEFAULT 'COD',
        payment_status TEXT DEFAULT 'PAID',
        cancel_reason TEXT,
        address TEXT,
        address_id INTEGER,
        status TEXT DEFAULT 'PLACED',
        delivery_partner TEXT,
        delivery_partner_id INTEGER,
        delivery_partner_user_id INTEGER,
        delivery_partner_phone TEXT,
        estimated_time TEXT DEFAULT '30-40 min',
        delivery_group_id INTEGER,
        is_rescue_order INTEGER DEFAULT 0,
        delivery_fee_saved REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )`);
    addColumnIfNotExists('orders', 'order_code', 'TEXT');
    addColumnIfNotExists('orders', 'payment_status', "TEXT DEFAULT 'PAID'");
    addColumnIfNotExists('orders', 'cancel_reason', 'TEXT');
    addColumnIfNotExists('orders', 'delivery_partner_id', 'INTEGER');
    addColumnIfNotExists('orders', 'delivery_partner_user_id', 'INTEGER');
    addColumnIfNotExists('orders', 'updated_at', 'DATETIME');

    // 10. order_items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        food_id INTEGER,
        food_name TEXT,
        quantity INTEGER NOT NULL,
        price REAL NOT NULL,
        customizations TEXT,
        is_rescue INTEGER DEFAULT 0,
        rescue_item_id INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`);

    // 11. order_status_history table
    db.run(`CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        changed_by INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    )`);

    // 12. payments table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_mode TEXT DEFAULT 'demo',
        payment_status TEXT DEFAULT 'SUCCESS',
        transaction_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // 13. combos and combo_items table
    db.run(`CREATE TABLE IF NOT EXISTS combos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        restaurant_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image TEXT,
        original_price REAL NOT NULL,
        combo_price REAL NOT NULL,
        discount_percent REAL DEFAULT 15,
        calories INTEGER,
        protein REAL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS combo_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        combo_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 1,
        FOREIGN KEY (combo_id) REFERENCES combos(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    )`);

    // 14. favorites table
    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        restaurant_id INTEGER,
        food_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
        FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
    )`);

    // 15. reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        order_id INTEGER,
        restaurant_id INTEGER NOT NULL,
        restaurant_rating INTEGER,
        food_rating INTEGER,
        delivery_rating INTEGER,
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    )`);

    // 16. notifications table
    db.run(`CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT,
        type TEXT DEFAULT 'info',
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // 17. delivery_partners table
    db.run(`CREATE TABLE IF NOT EXISTS delivery_partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        phone TEXT,
        vehicle TEXT DEFAULT 'Motorcycle',
        vehicle_number TEXT,
        rating REAL DEFAULT 4.8,
        is_available INTEGER DEFAULT 1,
        status TEXT DEFAULT 'APPROVED',
        total_deliveries INTEGER DEFAULT 0,
        today_earnings REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`);
    addColumnIfNotExists('delivery_partners', 'user_id', 'INTEGER');
    addColumnIfNotExists('delivery_partners', 'status', "TEXT DEFAULT 'APPROVED'");
    addColumnIfNotExists('delivery_partners', 'today_earnings', 'REAL DEFAULT 0');
    addColumnIfNotExists('delivery_partners', 'created_at', 'DATETIME');

    // 18. user_preferences table
    db.run(`CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        dietary_preference TEXT DEFAULT 'all',
        favorite_cuisines TEXT,
        health_focus TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Performance Indexes
    db.run(`CREATE INDEX IF NOT EXISTS idx_restaurants_active_status ON restaurants(is_active, status)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_foods_restaurant_avail ON foods(restaurant_id, is_available)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(delivery_partner_user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id)`);

    // Seed Data
    seedDatabase();
});

// ─── SEED DATA ────────────────────────────────────────────────────────────────
function seedDatabase() {
    db.get("SELECT COUNT(*) as count FROM restaurants", (err, row) => {
        if (row && row.count === 0) {
            console.log('🌱 Seeding restaurants and menu data...');
            seedRestaurants();
        }
    });

    seedAllRoleAccounts();

    db.get("SELECT COUNT(*) as count FROM coupons", (err, row) => {
        if (row && row.count === 0) {
            seedCoupons();
        }
    });
}

async function seedAllRoleAccounts() {
    const pwAdmin = await bcrypt.hash('admin123', 10);
    const pwOwner = await bcrypt.hash('owner123', 10);
    const pwDelivery = await bcrypt.hash('delivery123', 10);
    const pwCustomer = await bcrypt.hash('user123', 10);

    // 1. Super Admin Accounts
    db.get("SELECT id FROM users WHERE email = 'admin@biteflow.com'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'ADMIN', 'active')`,
                ['BiteFlow Super Admin', 'admin@biteflow.com', pwAdmin, '9876500000']);
            console.log('🛡️ [AUTH] Super Admin ready: admin@biteflow.com / admin123');
        } else {
            db.run(`UPDATE users SET role = 'ADMIN' WHERE email = 'admin@biteflow.com'`);
        }
    });

    db.get("SELECT id FROM users WHERE email = 'admin@savorit.com'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'ADMIN', 'active')`,
                ['Platform Admin', 'admin@savorit.com', pwAdmin, '9876500099']);
        } else {
            db.run(`UPDATE users SET role = 'ADMIN' WHERE email = 'admin@savorit.com'`);
        }
    });

    // 2. Restaurant Owner Account
    db.get("SELECT id FROM users WHERE email = 'owner@biteflow.com'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'RESTAURANT_OWNER', 'active')`,
                ['Vikram Sundaram (Spice Garden)', 'owner@biteflow.com', pwOwner, '9876500002'], function() {
                    const ownerId = this.lastID;
                    console.log('🍽️ [AUTH] Restaurant Owner ready: owner@biteflow.com / owner123');
                    // Attach first 3 restaurants to this owner
                    db.run(`UPDATE restaurants SET owner_id = ? WHERE owner_id IS NULL AND id IN (1, 2, 4)`, [ownerId]);
                });
        } else {
            db.run(`UPDATE users SET role = 'RESTAURANT_OWNER' WHERE email = 'owner@biteflow.com'`);
            db.run(`UPDATE restaurants SET owner_id = ? WHERE owner_id IS NULL AND id IN (1, 2, 4)`, [row.id]);
        }
    });

    // 3. Delivery Partner Account
    db.get("SELECT id FROM users WHERE email = 'delivery@biteflow.com'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'DELIVERY_PARTNER', 'active')`,
                ['Raj Kumar (Delivery Pro)', 'delivery@biteflow.com', pwDelivery, '9876543210'], function() {
                    const partnerUserId = this.lastID;
                    console.log('🛵 [AUTH] Delivery Partner ready: delivery@biteflow.com / delivery123');
                    db.run(`INSERT INTO delivery_partners (user_id, name, phone, vehicle, vehicle_number, rating, is_available, status, total_deliveries, today_earnings) 
                        VALUES (?, ?, ?, 'Yamaha FZ', 'TN 09 AB 1234', 4.8, 1, 'APPROVED', 152, 160)`,
                        [partnerUserId, 'Raj Kumar (Delivery Pro)', '9876543210']);
                });
        } else {
            db.run(`UPDATE users SET role = 'DELIVERY_PARTNER' WHERE email = 'delivery@biteflow.com'`);
            db.get(`SELECT id FROM delivery_partners WHERE user_id = ?`, [row.id], (e, pRow) => {
                if (!pRow) {
                    db.run(`INSERT INTO delivery_partners (user_id, name, phone, vehicle, vehicle_number, rating, is_available, status, total_deliveries, today_earnings) 
                        VALUES (?, ?, ?, 'Yamaha FZ', 'TN 09 AB 1234', 4.8, 1, 'APPROVED', 152, 160)`,
                        [row.id, 'Raj Kumar (Delivery Pro)', '9876543210']);
                }
            });
        }
    });

    // 4. Customer Account
    db.get("SELECT id FROM users WHERE email = 'user@biteflow.com'", (err, row) => {
        if (!row) {
            db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'CUSTOMER', 'active')`,
                ['Aditya Sharma', 'user@biteflow.com', pwCustomer, '9876500001'], function() {
                    const custId = this.lastID;
                    console.log('👤 [AUTH] Customer ready: user@biteflow.com / user123');
                    // Seed default addresses
                    db.run(`INSERT INTO addresses (user_id, label, name, phone, flat, street, area, city, state, pincode, is_default)
                        VALUES (?, 'Home', 'Aditya Sharma', '9876500001', 'Flat 402, Green Valley Apts', '12th Main Road', 'RS Puram', 'Coimbatore', 'Tamil Nadu', '641002', 1)`, [custId]);
                    db.run(`INSERT INTO addresses (user_id, label, name, phone, flat, street, area, city, state, pincode, is_default)
                        VALUES (?, 'Work', 'Aditya Sharma', '9876500001', 'Bay 4, Tech Park Block B', 'Avinashi Road', 'Peelamedu', 'Coimbatore', 'Tamil Nadu', '641004', 0)`, [custId]);
                });
        } else {
            db.run(`UPDATE users SET role = 'CUSTOMER' WHERE email = 'user@biteflow.com'`);
        }
    });

    // Normalize any legacy users
    db.run(`UPDATE users SET role = 'ADMIN' WHERE role = 'admin'`);
    db.run(`UPDATE users SET role = 'CUSTOMER' WHERE role = 'user'`);
    db.run(`UPDATE restaurants SET status = 'APPROVED' WHERE status IS NULL`);
}

function seedCoupons() {
    const coupons = [
        ['WELCOME50', '50% off up to ₹100 on your first order', 'percent', 50, 0, 100, '2027-12-31', null],
        ['FLAT100', '₹100 off on orders above ₹499', 'flat', 100, 499, null, '2027-12-31', null],
        ['FREEDEL', 'Free delivery on orders above ₹299', 'delivery', 30, 299, null, '2027-12-31', null],
        ['SAVE20', '20% off up to ₹80 on all orders', 'percent', 20, 149, 80, '2027-12-31', null],
        ['BIRYANILOVE', '₹60 off on Biryani orders above ₹350', 'flat', 60, 350, null, '2027-12-31', null],
    ];
    const stmt = db.prepare("INSERT INTO coupons (code, description, discount_type, discount_value, min_order, max_discount, valid_until, usage_limit) VALUES (?,?,?,?,?,?,?,?)");
    coupons.forEach(c => stmt.run(c));
    stmt.finalize();
    console.log('🎟️ Coupons seeded.');
}

function seedRestaurants() {
    const restaurants = [
        {
            name: 'Spice Garden', description: 'Authentic South Indian flavors from the heart of Tamil Nadu. Freshly prepared dosas, idlis, and biryanis since 1998.',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
            logo: '', cuisine: 'South Indian, Biryani, Chinese', rating: 4.6, rating_count: 2341,
            delivery_time: '25-35 min', min_order: 150, price_for_two: 320, distance: '1.2 km',
            is_veg: 0, offer: '20% OFF up to ₹80', offer_code: 'SAVE20', address: '42, Anna Salai, T. Nagar',
            city: 'Chennai', phone: '044-28123456', opening_hours: '7:00 AM - 11:00 PM', category: 'South Indian'
        },
        {
            name: 'Burger Station', description: 'Gourmet burgers crafted with fresh ingredients. Our signature smash burgers have a cult following.',
            image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
            logo: '', cuisine: 'Burgers, Fast Food, Shakes', rating: 4.3, rating_count: 1567,
            delivery_time: '20-30 min', min_order: 199, price_for_two: 450, distance: '2.4 km',
            is_veg: 0, offer: 'Buy 2 Get 1 Free', offer_code: 'FREEDEL', address: '15, Nungambakkam High Rd',
            city: 'Chennai', phone: '044-28234567', opening_hours: '11:00 AM - 12:00 AM', category: 'Burgers'
        },
        {
            name: 'Pizza Palazzo', description: 'Stone-fired Italian-style pizzas with house-made sauces and imported cheese blends.',
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
            logo: '', cuisine: 'Pizza, Italian, Pasta', rating: 4.5, rating_count: 3102,
            delivery_time: '30-40 min', min_order: 299, price_for_two: 600, distance: '3.1 km',
            is_veg: 0, offer: 'Flat ₹100 off', offer_code: 'FLAT100', address: '8, Khader Nawaz Khan Rd, Nungambakkam',
            city: 'Chennai', phone: '044-28345678', opening_hours: '11:00 AM - 11:00 PM', category: 'Pizza'
        },
        {
            name: 'Biryani Bros', description: 'The ultimate biryani destination. Slow-cooked dum biryanis with secret spice blends passed down through generations.',
            image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&q=80',
            logo: '', cuisine: 'Biryani, North Indian, Kebabs', rating: 4.7, rating_count: 4521,
            delivery_time: '35-45 min', min_order: 250, price_for_two: 500, distance: '2.8 km',
            is_veg: 0, offer: '₹60 off on Biryani', offer_code: 'BIRYANILOVE', address: '78, Greams Rd, Thousand Lights',
            city: 'Chennai', phone: '044-28456789', opening_hours: '11:30 AM - 11:30 PM', category: 'Biryani'
        },
        {
            name: 'Green Bites', description: 'Pure vegetarian restaurant celebrating the diversity and richness of plant-based cuisine.',
            image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800&q=80',
            logo: '', cuisine: 'Veg, North Indian, Rajasthani', rating: 4.4, rating_count: 987,
            delivery_time: '20-30 min', min_order: 200, price_for_two: 380, distance: '1.8 km',
            is_veg: 1, offer: 'Flat ₹100 off', offer_code: 'FLAT100', address: '23, Poes Garden',
            city: 'Chennai', phone: '044-28567890', opening_hours: '8:00 AM - 10:00 PM', category: 'Vegetarian'
        }
    ];

    const stmt = db.prepare(`INSERT INTO restaurants 
        (name, description, image, logo, cuisine, rating, rating_count, delivery_time, min_order, price_for_two, distance, is_veg, status, offer, offer_code, address, city, phone, opening_hours, category)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'APPROVED',?,?,?,?,?,?,?)`);

    restaurants.forEach(r => {
        stmt.run([r.name, r.description, r.image, r.logo, r.cuisine, r.rating, r.rating_count,
            r.delivery_time, r.min_order, r.price_for_two, r.distance, r.is_veg ? 1 : 0,
            r.offer || null, r.offer_code || null, r.address, r.city, r.phone, r.opening_hours, r.category],
            function (err) {
                if (!err && this.lastID) {
                    seedMenuForRestaurant(this.lastID, r.name, r.category);
                }
            });
    });
    stmt.finalize();
}

function seedMenuForRestaurant(restaurantId, name, category) {
    const defaultDishes = [
        { name: 'Masala Dosa', desc: 'Crispy rice crepe filled with spiced potato masala, served with sambar and chutneys', price: 89, cat: 'Dosa', veg: 1, cal: 340, prot: 6, img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80' },
        { name: 'Chicken Biryani', desc: 'Fragrant basmati rice slow-cooked with tender chicken and aromatic spices', price: 220, cat: 'Biryani', veg: 0, cal: 620, prot: 32, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
        { name: 'Chicken 65', desc: 'Crispy deep-fried chicken marinated in red chili, garlic and yogurt', price: 180, cat: 'Starters', veg: 0, cal: 380, prot: 28, img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&q=80' },
        { name: 'Paneer Butter Masala', desc: 'Cottage cheese cubes in a rich tomato and cream gravy', price: 195, cat: 'Main Course', veg: 1, cal: 380, prot: 18, img: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
        { name: 'Filter Coffee', desc: 'Strong South Indian coffee brewed with chicory, served with warm milk', price: 45, cat: 'Beverages', veg: 1, cal: 90, prot: 3, img: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80' }
    ];

    const stmt = db.prepare(`INSERT INTO foods (restaurant_id, name, description, price, image, category, is_veg, is_available, calories, protein) VALUES (?,?,?,?,?,?,?,1,?,?)`);
    defaultDishes.forEach(d => stmt.run([restaurantId, d.name, d.desc, d.price, d.img, d.cat, d.veg, d.cal, d.prot]));
    stmt.finalize();
}

// ─── AUTH & ROLE MIDDLEWARE ───────────────────────────────────────────────────
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'Session expired or invalid token' });
        // Normalize role
        let role = (decoded.role || 'CUSTOMER').toUpperCase();
        if (role === 'USER') role = 'CUSTOMER';
        req.user = { ...decoded, role };
        next();
    });
};

const requireRole = (...roles) => {
    const normalized = roles.map(r => r.toUpperCase());
    return (req, res, next) => {
        if (!req.user || !normalized.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access forbidden: Requires role ${roles.join(' or ')}`
            });
        }
        next();
    };
};

const requireAdmin = requireRole('ADMIN');
const requireOwner = requireRole('RESTAURANT_OWNER', 'ADMIN');
const requireDelivery = requireRole('DELIVERY_PARTNER', 'ADMIN');
const requireCustomer = requireRole('CUSTOMER', 'ADMIN');

// Ownership Validation Helpers
function verifyRestaurantOwnership(req, res, restaurantId, callback) {
    if (req.user.role === 'ADMIN') {
        return db.get("SELECT * FROM restaurants WHERE id = ?", [restaurantId], (err, r) => {
            if (err || !r) return res.status(404).json({ error: 'Restaurant not found' });
            callback(null, r);
        });
    }
    db.get("SELECT * FROM restaurants WHERE id = ?", [restaurantId], (err, r) => {
        if (err || !r) return res.status(404).json({ error: 'Restaurant not found' });
        if (r.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You do not own this restaurant' });
        }
        callback(null, r);
    });
}

function verifyFoodOwnership(req, res, foodId, callback) {
    if (req.user.role === 'ADMIN') {
        return db.get("SELECT f.*, r.owner_id FROM foods f JOIN restaurants r ON f.restaurant_id = r.id WHERE f.id = ?", [foodId], (err, f) => {
            if (err || !f) return res.status(404).json({ error: 'Food item not found' });
            callback(null, f);
        });
    }
    db.get("SELECT f.*, r.owner_id FROM foods f JOIN restaurants r ON f.restaurant_id = r.id WHERE f.id = ?", [foodId], (err, f) => {
        if (err || !f) return res.status(404).json({ error: 'Food item not found' });
        if (f.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You do not own the restaurant for this food item' });
        }
        callback(null, f);
    });
}

// ─── INNOVATIVE FEATURES INITIALIZATION ──────────────────────────────────────
setupInnovativeFeatures(app, db, authenticateToken, requireAdmin);

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, phone, role } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Role validation: public can register as CUSTOMER, RESTAURANT_OWNER, DELIVERY_PARTNER
    let targetRole = (role || 'CUSTOMER').toUpperCase();
    if (targetRole === 'USER') targetRole = 'CUSTOMER';
    if (!['CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER'].includes(targetRole)) {
        targetRole = 'CUSTOMER';
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, ?, 'active')`,
            [name, email, hashedPassword, phone || null, targetRole], function (err) {
                if (err) return res.status(400).json({ error: 'Email already registered' });
                const userId = this.lastID;
                const userSafe = { id: userId, name, email, phone: phone || null, role: targetRole, status: 'active' };

                // If registering as DELIVERY_PARTNER, also create record in delivery_partners
                if (targetRole === 'DELIVERY_PARTNER') {
                    db.run(`INSERT INTO delivery_partners (user_id, name, phone, vehicle, status) VALUES (?, ?, ?, 'Motorcycle', 'APPROVED')`,
                        [userId, name, phone || null]);
                }

                const token = jwt.sign(userSafe, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
                res.status(201).json({ user: userSafe, token });
            });
    } catch (e) {
        res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    db.get(`SELECT * FROM users WHERE email = ?`, [email.toLowerCase().trim()], async (err, user) => {
        if (err || !user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Account suspended. Please contact platform administration.' });
        }

        let role = (user.role || 'CUSTOMER').toUpperCase();
        if (role === 'USER') role = 'CUSTOMER';

        const { password: _, ...userSafe } = { ...user, role };
        const token = jwt.sign(userSafe, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ user: userSafe, token });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
    db.get(`SELECT id, name, email, phone, role, status, avatar, created_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (!user) return res.sendStatus(404);
        let role = (user.role || 'CUSTOMER').toUpperCase();
        if (role === 'USER') role = 'CUSTOMER';
        res.json({ ...user, role });
    });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
    const { name, phone } = req.body;
    db.run(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`,
        [name, phone, req.user.id], (err) => {
            if (err) return res.status(500).json({ error: 'Update failed' });
            res.json({ success: true });
        });
});

// ─── PUBLIC / CUSTOMER RESTAURANT & FOOD ROUTES ──────────────────────────────
app.get('/api/restaurants', (req, res) => {
    const { search, cuisine, veg, min_rating, sort } = req.query;
    // Show only active & approved restaurants to customers
    let sql = `SELECT * FROM restaurants WHERE is_active = 1 AND (status = 'APPROVED' OR status IS NULL)`;
    const params = [];

    if (search) {
        sql += ` AND (name LIKE ? OR cuisine LIKE ? OR category LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (cuisine) {
        sql += ` AND cuisine LIKE ?`;
        params.push(`%${cuisine}%`);
    }
    if (veg === '1') {
        sql += ` AND is_veg = 1`;
    }
    if (min_rating) {
        sql += ` AND rating >= ?`;
        params.push(parseFloat(min_rating));
    }

    const sortMap = {
        rating: 'rating DESC',
        delivery: 'delivery_time ASC',
        price: 'price_for_two ASC',
        popular: 'rating_count DESC',
    };
    sql += ` ORDER BY ${sortMap[sort] || 'rating DESC'}`;

    db.all(sql, params, (err, rows) => res.json(rows || []));
});

app.get('/api/restaurants/:id', (req, res) => {
    db.get(`SELECT * FROM restaurants WHERE id = ? AND is_active = 1`, [req.params.id], (err, restaurant) => {
        if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
        db.all(`SELECT * FROM foods WHERE restaurant_id = ? AND is_available = 1 ORDER BY category`, [req.params.id], (err, foods) => {
            db.all(`SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.restaurant_id = ? ORDER BY r.created_at DESC LIMIT 10`, [req.params.id], (err, reviews) => {
                db.all(`SELECT * FROM food_categories WHERE restaurant_id = ? AND is_active = 1`, [req.params.id], (err, categories) => {
                    res.json({
                        ...restaurant,
                        foods: foods || [],
                        reviews: reviews || [],
                        categories: categories || []
                    });
                });
            });
        });
    });
});

app.get('/api/foods', (req, res) => {
    const { search, restaurant_id, category, veg, health } = req.query;
    let sql = `SELECT f.*, r.name as restaurant_name, r.delivery_time as restaurant_delivery_time, r.rating as restaurant_rating 
               FROM foods f 
               JOIN restaurants r ON f.restaurant_id = r.id 
               WHERE f.is_available = 1 AND r.is_active = 1 AND (r.status = 'APPROVED' OR r.status IS NULL)`;
    const params = [];

    if (search) {
        sql += ` AND (f.name LIKE ? OR f.description LIKE ? OR f.category LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (restaurant_id) {
        sql += ` AND f.restaurant_id = ?`;
        params.push(parseInt(restaurant_id));
    }
    if (category) {
        sql += ` AND f.category LIKE ?`;
        params.push(`%${category}%`);
    }
    if (veg === '1') {
        sql += ` AND f.is_veg = 1`;
    }
    if (health) {
        if (health === 'high_protein') sql += ` AND f.protein >= 20`;
        else if (health === 'low_calorie') sql += ` AND f.calories <= 350`;
        else if (health === 'high_fiber') sql += ` AND f.fiber >= 5`;
        else if (health === 'low_sugar') sql += ` AND (f.sugar IS NULL OR f.sugar <= 5)`;
        else if (health === 'vegan') sql += ` AND f.is_veg = 1 AND (f.tags LIKE '%vegan%' OR f.description NOT LIKE '%paneer%' AND f.description NOT LIKE '%butter%' AND f.description NOT LIKE '%ghee%')`;
    }

    db.all(sql, params, (err, rows) => res.json(rows || []));
});

// Combos
app.get('/api/combos', (req, res) => {
    const { restaurant_id } = req.query;
    let sql = `SELECT c.*, r.name as restaurant_name FROM combos c JOIN restaurants r ON c.restaurant_id = r.id WHERE c.is_active = 1 AND r.is_active = 1`;
    const params = [];
    if (restaurant_id) {
        sql += ` AND c.restaurant_id = ?`;
        params.push(restaurant_id);
    }
    db.all(sql, params, (err, rows) => res.json(rows || []));
});

// Search API (Dishes & Restaurants)
app.get('/api/search', (req, res) => {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ restaurants: [], foods: [] });
    const term = `%${q}%`;
    db.all(`SELECT * FROM restaurants WHERE is_active = 1 AND (status = 'APPROVED' OR status IS NULL) AND (name LIKE ? OR cuisine LIKE ? OR area LIKE ? OR city LIKE ?) LIMIT 60`,
        [term, term, term, term], (err, restaurants) => {
            db.all(`SELECT f.*, r.name as restaurant_name, r.delivery_time as restaurant_delivery_time 
                    FROM foods f 
                    JOIN restaurants r ON f.restaurant_id = r.id 
                    WHERE f.is_available = 1 AND r.is_active = 1 AND (f.name LIKE ? OR f.description LIKE ? OR f.category LIKE ?) LIMIT 80`,
                [term, term, term], (err2, foods) => {
                    res.json({
                        restaurants: restaurants || [],
                        foods: foods || []
                    });
                });
        });
});

// ─── CART ROUTES ──────────────────────────────────────────────────────────────
app.get('/api/cart', authenticateToken, (req, res) => {
    db.all(`SELECT c.id, c.quantity, c.customizations, c.special_instructions, c.unit_price,
            f.id as food_id, f.name, f.description, f.price, f.image, f.category, f.is_veg, f.calories,
            r.id as restaurant_id, r.name as restaurant_name
            FROM cart c 
            JOIN foods f ON c.food_id = f.id 
            JOIN restaurants r ON f.restaurant_id = r.id
            WHERE c.user_id = ?`, [req.user.id], (err, rows) => {
        res.json(rows || []);
    });
});

app.post('/api/cart', authenticateToken, (req, res) => {
    const { food_id, quantity, customizations, special_instructions, unit_price } = req.body;
    if (!food_id) return res.status(400).json({ error: 'food_id required' });

    db.get("SELECT * FROM cart WHERE user_id = ? AND food_id = ?", [req.user.id, food_id], (err, row) => {
        if (row) {
            const newQty = row.quantity + (quantity || 1);
            if (newQty <= 0) {
                db.run("DELETE FROM cart WHERE id = ?", [row.id], () => res.sendStatus(200));
            } else {
                db.run("UPDATE cart SET quantity = ?, unit_price = ? WHERE id = ?",
                    [newQty, unit_price || row.unit_price, row.id], () => res.sendStatus(200));
            }
        } else if ((quantity || 1) > 0) {
            db.run("INSERT INTO cart (user_id, food_id, quantity, customizations, special_instructions, unit_price) VALUES (?, ?, ?, ?, ?, ?)",
                [req.user.id, food_id, quantity || 1, customizations ? JSON.stringify(customizations) : null,
                special_instructions || null, unit_price || null],
                () => res.sendStatus(201));
        } else {
            res.sendStatus(400);
        }
    });
});

app.put('/api/cart/:cartId', authenticateToken, (req, res) => {
    const { quantity } = req.body;
    if (quantity <= 0) {
        db.run("DELETE FROM cart WHERE id = ? AND user_id = ?", [req.params.cartId, req.user.id], () => res.sendStatus(200));
    } else {
        db.run("UPDATE cart SET quantity = ? WHERE id = ? AND user_id = ?", [quantity, req.params.cartId, req.user.id], () => res.sendStatus(200));
    }
});

app.delete('/api/cart/:foodId', authenticateToken, (req, res) => {
    db.run("DELETE FROM cart WHERE user_id = ? AND food_id = ?", [req.user.id, req.params.foodId], (err) => {
        res.sendStatus(err ? 500 : 200);
    });
});

app.delete('/api/cart', authenticateToken, (req, res) => {
    db.run("DELETE FROM cart WHERE user_id = ?", [req.user.id], (err) => {
        res.sendStatus(err ? 500 : 200);
    });
});

// ─── CONFIG & DELIVERY CHARGES ────────────────────────────────────────────────
app.get('/api/config', (req, res) => {
    res.json({
        appName: 'BiteFlow',
        tagline: 'Order Food Online | Superfast Delivery like Swiggy & Zomato',
        nodeEnv: NODE_ENV,
        defaultDeliveryFee: DEFAULT_DELIVERY_FEE,
        freeDeliveryMinimum: FREE_DELIVERY_MINIMUM,
        platformFee: PLATFORM_FEE,
        minimumOrderAmount: MINIMUM_ORDER_AMOUNT,
        maximumOrderAmount: MAXIMUM_ORDER_AMOUNT,
        paymentMode: process.env.PAYMENT_MODE || 'demo',
        upiEnabled: process.env.UPI_ENABLED !== 'false',
        gpayEnabled: process.env.GPAY_ENABLED !== 'false',
        phonepeEnabled: process.env.PHONEPE_ENABLED !== 'false',
        paytmEnabled: process.env.PAYTM_ENABLED !== 'false',
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
        rescueDiscount: Number(process.env.RESCUE_SURPLUS_DISCOUNT_PERCENT) || 50,
        groupDeliveryDiscount: Number(process.env.GROUP_DELIVERY_DISCOUNT) || 30
    });
});

app.get('/api/delivery-fee', (req, res) => {
    const distanceStr = req.query.distance || '2.5';
    const distance = parseFloat(distanceStr) || 2.5;
    const subtotal = parseFloat(req.query.subtotal) || 0;
    let fee = DEFAULT_DELIVERY_FEE;
    if (subtotal >= FREE_DELIVERY_MINIMUM) {
        fee = 0;
    } else {
        if (distance <= 2) fee = Math.max(15, DEFAULT_DELIVERY_FEE - 10);
        else if (distance <= 5) fee = DEFAULT_DELIVERY_FEE;
        else if (distance <= 8) fee = DEFAULT_DELIVERY_FEE + 15;
        else fee = DEFAULT_DELIVERY_FEE + 30;
    }
    res.json({
        distance,
        delivery_fee: fee,
        platform_fee: PLATFORM_FEE,
        tax_rate: 0.05,
        free_delivery_min: FREE_DELIVERY_MINIMUM,
        default_delivery_fee: DEFAULT_DELIVERY_FEE
    });
});

// ─── COUPON ROUTES ────────────────────────────────────────────────────────────
app.get('/api/coupons', (req, res) => {
    db.all(`SELECT * FROM coupons WHERE is_active = 1`, [], (err, rows) => res.json(rows || []));
});

app.post('/api/coupons/validate', (req, res) => {
    const { code, order_total } = req.body;
    if (!code) return res.status(400).json({ error: 'Coupon code required' });

    db.get(`SELECT * FROM coupons WHERE code = ? AND is_active = 1`, [code.toUpperCase()], (err, coupon) => {
        if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ error: 'Coupon usage limit reached' });
        }
        if (order_total < coupon.min_order) {
            return res.status(400).json({ error: `Minimum order of ₹${coupon.min_order} required` });
        }

        let discount = 0;
        if (coupon.discount_type === 'percent') {
            discount = (order_total * coupon.discount_value) / 100;
            if (coupon.max_discount) discount = Math.min(discount, coupon.max_discount);
        } else if (coupon.discount_type === 'flat') {
            discount = coupon.discount_value;
        } else if (coupon.discount_type === 'delivery') {
            discount = DEFAULT_DELIVERY_FEE;
        }

        res.json({ valid: true, coupon, discount: Math.round(discount) });
    });
});

// ─── ORDER PLACEMENT & CUSTOMER ORDER FLOW ────────────────────────────────────
app.post('/api/orders', authenticateToken, (req, res) => {
    const { total, subtotal, delivery_fee, platform_fee, tax, discount, coupon_code,
        payment_method, address, address_id, items, customer_name, phone,
        restaurant_id, restaurant_name,
        delivery_group_id, is_group_delivery, is_rescue_order, delivery_fee_saved } = req.body;

    if (!total || !items || !items.length) {
        return res.status(400).json({ error: 'Order total and items required' });
    }

    const calculatedSubtotal = Number(subtotal || total);
    const isFreeBySubtotal = calculatedSubtotal >= FREE_DELIVERY_MINIMUM;
    const finalDeliveryFee = (delivery_group_id || is_group_delivery || isFreeBySubtotal)
        ? 0
        : (delivery_fee !== undefined ? Number(delivery_fee) : DEFAULT_DELIVERY_FEE);
    const savedDeliveryFee = (delivery_group_id || is_group_delivery)
        ? (delivery_fee_saved || DEFAULT_DELIVERY_FEE)
        : (isFreeBySubtotal ? DEFAULT_DELIVERY_FEE : 0);

    const initialStatus = 'PLACED';

    db.run(`INSERT INTO orders (user_id, restaurant_id, restaurant_name, customer_name, phone, total, subtotal, delivery_fee, platform_fee, tax, discount, coupon_code, payment_method, payment_status, address, address_id, status, estimated_time, delivery_group_id, is_rescue_order, delivery_fee_saved) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PAID', ?, ?, ?, '30-40 min', ?, ?, ?)`,
        [req.user.id, restaurant_id || null, restaurant_name || 'BiteFlow Restaurant', customer_name || req.user.name,
        phone || req.user.phone || null, total, calculatedSubtotal, finalDeliveryFee, platform_fee || PLATFORM_FEE,
        tax || 0, discount || 0, coupon_code || null, payment_method || 'UPI',
        address || 'Delivery Address', address_id || null, initialStatus,
        delivery_group_id || null, is_rescue_order ? 1 : 0, savedDeliveryFee],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const order_id = this.lastID;
            const orderCode = 'BF' + (100000 + order_id);

            db.run(`UPDATE orders SET order_code = ? WHERE id = ?`, [orderCode, order_id]);

            // Record initial status history
            db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'PLACED', 'Order placed by customer', ?)`,
                [order_id, req.user.id]);

            // Record demo payment
            const txnId = 'TXN_BF_' + Date.now();
            db.run(`INSERT INTO payments (order_id, user_id, amount, payment_method, payment_mode, payment_status, transaction_id)
                VALUES (?, ?, ?, ?, 'demo', 'SUCCESS', ?)`,
                [order_id, req.user.id, total, payment_method || 'UPI', txnId]);

            // Insert order items
            const stmt = db.prepare("INSERT INTO order_items (order_id, food_id, food_name, quantity, price, customizations, is_rescue, rescue_item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            items.forEach(item => {
                stmt.run([
                    order_id,
                    item.food_id || item.id,
                    item.food_name || item.name,
                    item.quantity,
                    item.price || item.unit_price,
                    item.customizations ? JSON.stringify(item.customizations) : null,
                    item.is_rescue ? 1 : 0,
                    item.rescue_item_id || null
                ]);
            });

            stmt.finalize(() => {
                // Clear cart
                db.run("DELETE FROM cart WHERE user_id = ?", [req.user.id]);

                // Notification
                db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
                    [req.user.id, 'Order Placed!', `Your order #${orderCode} has been placed. Waiting for restaurant confirmation.`, 'order']);

                // Broadcast live event via Socket.IO
                const payload = {
                    order_id,
                    order_code: orderCode,
                    user_id: req.user.id,
                    restaurant_id,
                    status: 'PLACED',
                    customer_name: customer_name || req.user.name,
                    total
                };
                emitOrderStatusUpdate(order_id, payload);

                res.status(201).json({
                    id: order_id,
                    order_code: orderCode,
                    status: 'PLACED',
                    transaction_id: txnId,
                    total
                });
            });
        });
});

app.get('/api/orders', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        const fetchItems = orders.map(order => new Promise((resolve) => {
            db.all(`SELECT oi.*, f.image FROM order_items oi LEFT JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = ?`,
                [order.id], (err, items) => resolve({
                    ...order,
                    order_code: order.order_code || ('BF' + (100000 + order.id)),
                    items: items || []
                }));
        }));
        Promise.all(fetchItems).then(results => res.json(results));
    });
});

app.get('/api/orders/:id', authenticateToken, (req, res) => {
    // Customers can view their order, or Restaurant Owner / Delivery Partner / Admin
    db.get(`SELECT * FROM orders WHERE id = ?`, [req.params.id], (err, order) => {
        if (!order) return res.status(404).json({ error: 'Order not found' });
        // Role access check
        if (req.user.role === 'CUSTOMER' && order.user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        db.all(`SELECT oi.*, f.image FROM order_items oi LEFT JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = ?`,
            [order.id], (err, items) => {
                db.all(`SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC`, [order.id], (err, history) => {
                    res.json({
                        ...order,
                        order_code: order.order_code || ('BF' + (100000 + order.id)),
                        items: items || [],
                        status_history: history || []
                    });
                });
            });
    });
});

app.post('/api/orders/:id/reorder', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM order_items WHERE order_id = ?`, [req.params.id], (err, items) => {
        if (err || !items || !items.length) return res.status(404).json({ error: 'Order items not found' });
        const stmt = db.prepare("INSERT INTO cart (user_id, food_id, quantity, unit_price) VALUES (?, ?, ?, ?)");
        items.forEach(it => {
            if (it.food_id) stmt.run([req.user.id, it.food_id, it.quantity, it.price]);
        });
        stmt.finalize(() => {
            res.json({ success: true, count: items.length });
        });
    });
});

// ─── RESTAURANT OWNER DASHBOARD API ───────────────────────────────────────────
app.get('/api/owner/restaurant', authenticateToken, requireOwner, (req, res) => {
    const selectedId = req.query.restaurant_id ? parseInt(req.query.restaurant_id) : null;
    let query, params;
    if (req.user.role === 'ADMIN') {
        query = `SELECT * FROM restaurants ORDER BY id ASC`;
        params = [];
    } else {
        query = `SELECT * FROM restaurants WHERE owner_id = ? OR owner_id IS NULL ORDER BY id ASC`;
        params = [req.user.id];
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const allRests = rows || [];
        if (allRests.length === 0) return res.json(null);
        let active = allRests[0];
        if (selectedId) {
            const found = allRests.find(r => r.id === selectedId);
            if (found) active = found;
        }
        res.json({
            ...active,
            restaurants: allRests
        });
    });
});

app.get('/api/owner/delivery-partners', authenticateToken, requireOwner, (req, res) => {
    db.all(`SELECT dp.*, u.email FROM delivery_partners dp LEFT JOIN users u ON dp.user_id = u.id WHERE dp.status = 'APPROVED' ORDER BY dp.is_available DESC, dp.rating DESC LIMIT 50`, [], (err, rows) => {
        res.json(rows || []);
    });
});

app.put('/api/owner/orders/:id/assign-delivery', authenticateToken, requireOwner, (req, res) => {
    const { partner_id } = req.body;
    db.get("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?", [req.params.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        db.get("SELECT * FROM delivery_partners WHERE id = ?", [partner_id], (pErr, partner) => {
            if (!partner) return res.status(404).json({ error: 'Delivery partner not found' });

            db.run(`UPDATE orders SET 
                delivery_partner = ?,
                delivery_partner_id = ?,
                delivery_partner_user_id = ?,
                delivery_partner_phone = ?,
                status = 'DELIVERY_ASSIGNED',
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [partner.name, partner.id, partner.user_id, partner.phone, req.params.id],
                function(upErr) {
                    if (upErr) return res.status(500).json({ error: upErr.message });
                    db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'DELIVERY_ASSIGNED', ?, ?)`,
                        [req.params.id, `Assigned to delivery partner ${partner.name} by restaurant`, req.user.id]);
                    emitOrderStatusUpdate(order.id, {
                        order_id: order.id,
                        order_code: order.order_code,
                        user_id: order.user_id,
                        restaurant_id: order.restaurant_id,
                        status: 'DELIVERY_ASSIGNED',
                        delivery_partner: partner.name,
                        delivery_partner_phone: partner.phone
                    });
                    res.json({ success: true, status: 'DELIVERY_ASSIGNED', partner });
                });
        });
    });
});

app.post('/api/owner/restaurant', authenticateToken, requireOwner, (req, res) => {
    const { name, description, cuisine, image, cover_image, phone, email, address, area, city, state, pincode,
        latitude, longitude, opening_time, closing_time, avg_delivery_time, price_for_two } = req.body;

    if (!name || !cuisine || !address) {
        return res.status(400).json({ error: 'Restaurant name, cuisine, and address are required' });
    }

    db.run(`INSERT INTO restaurants (owner_id, name, description, cuisine, image, cover_image, phone, email, address, area, city, state, pincode, latitude, longitude, opening_time, closing_time, avg_delivery_time, price_for_two, status, is_active, is_open)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', 1, 1)`,
        [req.user.id, name, description || '', cuisine,
        image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        cover_image || image || '', phone || req.user.phone || '', email || req.user.email || '',
        address, area || '', city || 'Chennai', state || 'Tamil Nadu', pincode || '600001',
        latitude || 13.0827, longitude || 80.2707,
        opening_time || '09:00', closing_time || '23:00',
        avg_delivery_time || '30 min', price_for_two || 350],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, status: 'PENDING_APPROVAL', message: 'Restaurant created! Pending admin approval.' });
        });
});

app.put('/api/owner/restaurant/:id', authenticateToken, requireOwner, (req, res) => {
    verifyRestaurantOwnership(req, res, req.params.id, (err, r) => {
        const { name, description, cuisine, image, cover_image, phone, email, address, area, city, pincode,
            opening_time, closing_time, avg_delivery_time, price_for_two, is_open } = req.body;

        db.run(`UPDATE restaurants SET 
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            cuisine = COALESCE(?, cuisine),
            image = COALESCE(?, image),
            cover_image = COALESCE(?, cover_image),
            phone = COALESCE(?, phone),
            email = COALESCE(?, email),
            address = COALESCE(?, address),
            area = COALESCE(?, area),
            city = COALESCE(?, city),
            pincode = COALESCE(?, pincode),
            opening_time = COALESCE(?, opening_time),
            closing_time = COALESCE(?, closing_time),
            avg_delivery_time = COALESCE(?, avg_delivery_time),
            price_for_two = COALESCE(?, price_for_two),
            is_open = COALESCE(?, is_open)
            WHERE id = ?`,
            [name, description, cuisine, image, cover_image, phone, email, address, area, city, pincode,
            opening_time, closing_time, avg_delivery_time, price_for_two, is_open, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

app.put('/api/owner/restaurant/:id/toggle-open', authenticateToken, requireOwner, (req, res) => {
    verifyRestaurantOwnership(req, res, req.params.id, (err, r) => {
        const newIsOpen = r.is_open ? 0 : 1;
        db.run(`UPDATE restaurants SET is_open = ? WHERE id = ?`, [newIsOpen, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ is_open: newIsOpen });
        });
    });
});

// Categories for restaurant
app.get('/api/owner/categories/:restaurantId', authenticateToken, requireOwner, (req, res) => {
    verifyRestaurantOwnership(req, res, req.params.restaurantId, () => {
        db.all(`SELECT * FROM food_categories WHERE restaurant_id = ? ORDER BY id ASC`, [req.params.restaurantId], (err, rows) => {
            res.json(rows || []);
        });
    });
});

app.post('/api/owner/categories', authenticateToken, requireOwner, (req, res) => {
    const { restaurant_id, name, description } = req.body;
    if (!restaurant_id || !name) return res.status(400).json({ error: 'Restaurant ID and Category Name required' });
    verifyRestaurantOwnership(req, res, restaurant_id, () => {
        db.run(`INSERT INTO food_categories (restaurant_id, name, description, is_active) VALUES (?, ?, ?, 1)`,
            [restaurant_id, name, description || null], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID, restaurant_id, name, description });
            });
    });
});

app.put('/api/owner/categories/:id', authenticateToken, requireOwner, (req, res) => {
    const { name, description, is_active } = req.body;
    db.get("SELECT c.*, r.owner_id FROM food_categories c JOIN restaurants r ON c.restaurant_id = r.id WHERE c.id = ?", [req.params.id], (err, cat) => {
        if (err || !cat) return res.status(404).json({ error: 'Category not found' });
        if (req.user.role !== 'ADMIN' && cat.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
        db.run(`UPDATE food_categories SET name = COALESCE(?, name), description = COALESCE(?, description), is_active = COALESCE(?, is_active) WHERE id = ?`,
            [name, description, is_active, req.params.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

app.delete('/api/owner/categories/:id', authenticateToken, requireOwner, (req, res) => {
    db.get("SELECT c.*, r.owner_id FROM food_categories c JOIN restaurants r ON c.restaurant_id = r.id WHERE c.id = ?", [req.params.id], (err, cat) => {
        if (err || !cat) return res.status(404).json({ error: 'Category not found' });
        if (req.user.role !== 'ADMIN' && cat.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
        db.run(`DELETE FROM food_categories WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

// Food Management for restaurant owner
app.get('/api/owner/foods/:restaurantId', authenticateToken, requireOwner, (req, res) => {
    verifyRestaurantOwnership(req, res, req.params.restaurantId, () => {
        db.all(`SELECT * FROM foods WHERE restaurant_id = ? ORDER BY id DESC`, [req.params.restaurantId], (err, rows) => {
            res.json(rows || []);
        });
    });
});

app.post('/api/owner/foods', authenticateToken, requireOwner, (req, res) => {
    const { restaurant_id, name, description, price, image, category, category_id, is_veg, prep_time, spicy_level,
        calories, protein, carbs, fat, fiber, sugar, sodium, tags } = req.body;

    if (!restaurant_id || !name || price === undefined) {
        return res.status(400).json({ error: 'Restaurant ID, food name, and price are required' });
    }

    verifyRestaurantOwnership(req, res, restaurant_id, () => {
        db.run(`INSERT INTO foods (restaurant_id, category_id, name, description, price, image, category, is_veg, is_available,
            prep_time, spicy_level, calories, protein, carbs, fat, fiber, sugar, sodium, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [restaurant_id, category_id || null, name, description || '', price,
            image || 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80',
            category || 'Main Course', is_veg ? 1 : 0,
            prep_time || '20 min', spicy_level || 'Medium',
            calories || 300, protein || 10, carbs || 35, fat || 12, fiber || 3, sugar || 2, sodium || 400, tags || ''],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({ id: this.lastID, name, price });
            });
    });
});

app.put('/api/owner/foods/:id', authenticateToken, requireOwner, (req, res) => {
    verifyFoodOwnership(req, res, req.params.id, () => {
        const { name, description, price, image, category, category_id, is_veg, is_available,
            prep_time, spicy_level, calories, protein, carbs, fat, fiber, sugar, sodium, tags } = req.body;

        db.run(`UPDATE foods SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            price = COALESCE(?, price),
            image = COALESCE(?, image),
            category = COALESCE(?, category),
            category_id = COALESCE(?, category_id),
            is_veg = COALESCE(?, is_veg),
            is_available = COALESCE(?, is_available),
            prep_time = COALESCE(?, prep_time),
            spicy_level = COALESCE(?, spicy_level),
            calories = COALESCE(?, calories),
            protein = COALESCE(?, protein),
            carbs = COALESCE(?, carbs),
            fat = COALESCE(?, fat),
            fiber = COALESCE(?, fiber),
            sugar = COALESCE(?, sugar),
            sodium = COALESCE(?, sodium),
            tags = COALESCE(?, tags)
            WHERE id = ?`,
            [name, description, price, image, category, category_id, is_veg, is_available,
            prep_time, spicy_level, calories, protein, carbs, fat, fiber, sugar, sodium, tags, req.params.id],
            (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
    });
});

app.delete('/api/owner/foods/:id', authenticateToken, requireOwner, (req, res) => {
    verifyFoodOwnership(req, res, req.params.id, () => {
        db.run(`DELETE FROM foods WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });
});

app.put('/api/owner/foods/:id/toggle', authenticateToken, requireOwner, (req, res) => {
    verifyFoodOwnership(req, res, req.params.id, (err, food) => {
        const newAvail = food.is_available ? 0 : 1;
        db.run(`UPDATE foods SET is_available = ? WHERE id = ?`, [newAvail, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ is_available: newAvail });
        });
    });
});

// Restaurant Owner Orders
app.get('/api/owner/orders/:restaurantId', authenticateToken, requireOwner, (req, res) => {
    verifyRestaurantOwnership(req, res, req.params.restaurantId, () => {
        db.all(`SELECT * FROM orders WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 50`, [req.params.restaurantId], (err, orders) => {
            if (err) return res.status(500).json({ error: err.message });
            const fetchItems = (orders || []).map(order => new Promise((resolve) => {
                db.all(`SELECT oi.*, f.image FROM order_items oi LEFT JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = ?`,
                    [order.id], (err, items) => resolve({
                        ...order,
                        order_code: order.order_code || ('BF' + (100000 + order.id)),
                        items: items || []
                    }));
            }));
            Promise.all(fetchItems).then(results => res.json(results));
        });
    });
});

// Order Lifecycle Actions by Restaurant Owner
// 1. Accept Order (PLACED -> CONFIRMED)
app.put('/api/owner/orders/:id/accept', authenticateToken, requireOwner, (req, res) => {
    db.get("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?", [req.params.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        db.run(`UPDATE orders SET status = 'CONFIRMED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'CONFIRMED', 'Order accepted by restaurant', ?)`,
                [req.params.id, req.user.id]);
            db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Order Confirmed!', 'The restaurant has confirmed your order.', 'order')`,
                [order.user_id]);

            emitOrderStatusUpdate(order.id, {
                order_id: order.id,
                order_code: order.order_code,
                user_id: order.user_id,
                restaurant_id: order.restaurant_id,
                status: 'CONFIRMED'
            });
            res.json({ success: true, status: 'CONFIRMED' });
        });
    });
});

// 2. Reject Order (PLACED -> CANCELLED_BY_RESTAURANT)
app.put('/api/owner/orders/:id/reject', authenticateToken, requireOwner, (req, res) => {
    const { reason } = req.body;
    db.get("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?", [req.params.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        const cancelReason = reason || 'Items out of stock';
        db.run(`UPDATE orders SET status = 'CANCELLED_BY_RESTAURANT', cancel_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [cancelReason, req.params.id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'CANCELLED_BY_RESTAURANT', ?, ?)`,
                    [req.params.id, cancelReason, req.user.id]);
                db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Order Cancelled', ?, 'order')`,
                    [order.user_id, `Restaurant cancelled order: ${cancelReason}`]);

                emitOrderStatusUpdate(order.id, {
                    order_id: order.id,
                    order_code: order.order_code,
                    user_id: order.user_id,
                    restaurant_id: order.restaurant_id,
                    status: 'CANCELLED_BY_RESTAURANT',
                    reason: cancelReason
                });
                res.json({ success: true, status: 'CANCELLED_BY_RESTAURANT' });
            });
    });
});

// 3. Start Preparing (CONFIRMED -> PREPARING)
app.put('/api/owner/orders/:id/prepare', authenticateToken, requireOwner, (req, res) => {
    db.get("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?", [req.params.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        db.run(`UPDATE orders SET status = 'PREPARING', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'PREPARING', 'Food is being prepared', ?)`,
                [req.params.id, req.user.id]);

            emitOrderStatusUpdate(order.id, {
                order_id: order.id,
                order_code: order.order_code,
                user_id: order.user_id,
                restaurant_id: order.restaurant_id,
                status: 'PREPARING'
            });
            res.json({ success: true, status: 'PREPARING' });
        });
    });
});

// 4. Mark Ready for Pickup (PREPARING -> READY_FOR_PICKUP)
app.put('/api/owner/orders/:id/ready', authenticateToken, requireOwner, (req, res) => {
    db.get("SELECT o.*, r.owner_id FROM orders o JOIN restaurants r ON o.restaurant_id = r.id WHERE o.id = ?", [req.params.id], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.owner_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

        db.run(`UPDATE orders SET status = 'READY_FOR_PICKUP', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'READY_FOR_PICKUP', 'Food is packed and ready for delivery partner pickup', ?)`,
                [req.params.id, req.user.id]);

            emitOrderStatusUpdate(order.id, {
                order_id: order.id,
                order_code: order.order_code,
                user_id: order.user_id,
                restaurant_id: order.restaurant_id,
                status: 'READY_FOR_PICKUP'
            });
            res.json({ success: true, status: 'READY_FOR_PICKUP' });
        });
    });
});

// ─── DELIVERY PARTNER DASHBOARD API ───────────────────────────────────────────
app.get('/api/delivery/profile', authenticateToken, requireDelivery, (req, res) => {
    db.get(`SELECT dp.*, u.email FROM delivery_partners dp LEFT JOIN users u ON dp.user_id = u.id WHERE dp.user_id = ?`, [req.user.id], (err, partner) => {
        if (!partner) {
            // Auto create partner profile for user
            db.run(`INSERT INTO delivery_partners (user_id, name, phone, vehicle, status) VALUES (?, ?, ?, 'Motorcycle', 'APPROVED')`,
                [req.user.id, req.user.name, req.user.phone || '9876543210'], function () {
                    res.json({
                        id: this.lastID,
                        user_id: req.user.id,
                        name: req.user.name,
                        phone: req.user.phone,
                        vehicle: 'Motorcycle',
                        rating: 4.8,
                        is_available: 1,
                        today_earnings: 0,
                        total_deliveries: 0,
                        status: 'APPROVED'
                    });
                });
        } else {
            res.json(partner);
        }
    });
});

app.put('/api/delivery/availability', authenticateToken, requireDelivery, (req, res) => {
    const { is_available } = req.body;
    db.run(`UPDATE delivery_partners SET is_available = ? WHERE user_id = ?`, [is_available ? 1 : 0, req.user.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ is_available: !!is_available });
    });
});

// Available orders waiting for delivery partner acceptance (status = 'READY_FOR_PICKUP')
app.get('/api/delivery/available-orders', authenticateToken, requireDelivery, (req, res) => {
    const sql = `SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone, r.city as restaurant_city
                 FROM orders o 
                 JOIN restaurants r ON o.restaurant_id = r.id 
                 WHERE o.status = 'READY_FOR_PICKUP' AND (o.delivery_partner_user_id IS NULL OR o.delivery_partner_user_id = 0)
                 ORDER BY o.created_at ASC`;
    db.all(sql, [], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        const fetchItems = (orders || []).map(order => new Promise((resolve) => {
            db.all(`SELECT food_name, quantity, price FROM order_items WHERE order_id = ?`, [order.id], (err, items) => {
                resolve({
                    ...order,
                    order_code: order.order_code || ('BF' + (100000 + order.id)),
                    items: items || [],
                    partner_earning: 45 // Partner payout per delivery
                });
            });
        }));
        Promise.all(fetchItems).then(results => res.json(results));
    });
});

// Accept delivery assignment
app.post('/api/delivery/accept/:orderId', authenticateToken, requireDelivery, (req, res) => {
    db.get("SELECT * FROM orders WHERE id = ?", [req.params.orderId], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (order.status !== 'READY_FOR_PICKUP') {
            return res.status(400).json({ error: `Order cannot be accepted: current status is ${order.status}` });
        }

        db.get("SELECT id, vehicle, vehicle_number FROM delivery_partners WHERE user_id = ?", [req.user.id], (err, partner) => {
            const partnerId = partner?.id || null;
            db.run(`UPDATE orders SET 
                status = 'DELIVERY_ASSIGNED',
                delivery_partner = ?,
                delivery_partner_phone = ?,
                delivery_partner_id = ?,
                delivery_partner_user_id = ?,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = ?`,
                [req.user.name, req.user.phone || '9876543210', partnerId, req.user.id, req.params.orderId],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, 'DELIVERY_ASSIGNED', ?, ?)`,
                        [req.params.orderId, `Accepted by delivery partner ${req.user.name}`, req.user.id]);
                    db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Delivery Partner Assigned!', ?, 'order')`,
                        [order.user_id, `${req.user.name} has been assigned to deliver your order.`]);

                    emitOrderStatusUpdate(order.id, {
                        order_id: order.id,
                        order_code: order.order_code,
                        user_id: order.user_id,
                        restaurant_id: order.restaurant_id,
                        status: 'DELIVERY_ASSIGNED',
                        delivery_partner: req.user.name,
                        delivery_partner_phone: req.user.phone || '9876543210'
                    });
                    res.json({ success: true, status: 'DELIVERY_ASSIGNED' });
                });
        });
    });
});

// Get currently active delivery for this partner
app.get('/api/delivery/active-order', authenticateToken, requireDelivery, (req, res) => {
    const activeStatuses = ['DELIVERY_ASSIGNED', 'GOING_TO_RESTAURANT', 'ARRIVED_AT_RESTAURANT', 'FOOD_PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER'];
    const placeholders = activeStatuses.map(() => '?').join(',');

    db.get(`SELECT o.*, r.name as restaurant_name, r.address as restaurant_address, r.phone as restaurant_phone
            FROM orders o 
            JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.delivery_partner_user_id = ? AND o.status IN (${placeholders})
            ORDER BY o.updated_at DESC LIMIT 1`,
        [req.user.id, ...activeStatuses], (err, order) => {
            if (!order) return res.json(null);
            db.all(`SELECT oi.*, f.image FROM order_items oi LEFT JOIN foods f ON oi.food_id = f.id WHERE oi.order_id = ?`,
                [order.id], (err, items) => {
                    res.json({
                        ...order,
                        order_code: order.order_code || ('BF' + (100000 + order.id)),
                        items: items || [],
                        partner_earning: 45
                    });
                });
        });
});

// Update Delivery Stage
// Allowed progression:
// DELIVERY_ASSIGNED -> GOING_TO_RESTAURANT -> ARRIVED_AT_RESTAURANT -> FOOD_PICKED_UP -> OUT_FOR_DELIVERY -> ARRIVED_AT_CUSTOMER -> DELIVERED
app.put('/api/delivery/orders/:orderId/status', authenticateToken, requireDelivery, (req, res) => {
    const { status } = req.body;
    const allowed = ['GOING_TO_RESTAURANT', 'ARRIVED_AT_RESTAURANT', 'FOOD_PICKED_UP', 'OUT_FOR_DELIVERY', 'ARRIVED_AT_CUSTOMER', 'DELIVERED'];
    if (!allowed.includes(status)) {
        return res.status(400).json({ error: `Invalid delivery status. Must be one of: ${allowed.join(', ')}` });
    }

    db.get("SELECT * FROM orders WHERE id = ?", [req.params.orderId], (err, order) => {
        if (err || !order) return res.status(404).json({ error: 'Order not found' });
        if (req.user.role !== 'ADMIN' && order.delivery_partner_user_id !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You are not assigned to this delivery' });
        }

        db.run(`UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, req.params.orderId], (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Record status history
            const statusNotes = {
                'GOING_TO_RESTAURANT': 'Delivery partner is heading to restaurant',
                'ARRIVED_AT_RESTAURANT': 'Delivery partner arrived at restaurant',
                'FOOD_PICKED_UP': 'Delivery partner picked up food package',
                'OUT_FOR_DELIVERY': 'Order is out for delivery to customer address',
                'ARRIVED_AT_CUSTOMER': 'Delivery partner arrived at delivery location',
                'DELIVERED': 'Order successfully delivered to customer'
            };
            db.run(`INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, ?, ?, ?)`,
                [req.params.orderId, status, statusNotes[status] || status, req.user.id]);

            // If DELIVERED: add earnings to delivery partner
            if (status === 'DELIVERED') {
                db.run(`UPDATE delivery_partners SET 
                    today_earnings = today_earnings + 45,
                    total_deliveries = total_deliveries + 1
                    WHERE user_id = ?`, [req.user.id]);
                db.run(`UPDATE orders SET payment_status = 'PAID' WHERE id = ?`, [req.params.orderId]);
            }

            // Customer notification
            const notifMsg = {
                'OUT_FOR_DELIVERY': 'Your food is out for delivery with ' + (order.delivery_partner || 'our delivery partner') + '!',
                'ARRIVED_AT_CUSTOMER': 'Your delivery partner has arrived at your door!',
                'DELIVERED': 'Order delivered! Enjoy your meal. Don’t forget to rate your experience!'
            };
            if (notifMsg[status]) {
                db.run(`INSERT INTO notifications (user_id, title, message, type) VALUES (?, 'Delivery Update', ?, 'order')`,
                    [order.user_id, notifMsg[status]]);
            }

            emitOrderStatusUpdate(order.id, {
                order_id: order.id,
                order_code: order.order_code,
                user_id: order.user_id,
                restaurant_id: order.restaurant_id,
                status,
                delivery_partner: order.delivery_partner,
                delivery_partner_phone: order.delivery_partner_phone
            });
            res.json({ success: true, status });
        });
    });
});

app.get('/api/delivery/completed-orders', authenticateToken, requireDelivery, (req, res) => {
    db.all(`SELECT o.*, r.name as restaurant_name 
            FROM orders o 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            WHERE o.delivery_partner_user_id = ? AND o.status = 'DELIVERED'
            ORDER BY o.updated_at DESC LIMIT 30`,
        [req.user.id], (err, rows) => {
            const mapped = (rows || []).map(r => ({
                ...r,
                earning: 45
            }));
            res.json(mapped);
        });
});

// ─── SUPER ADMIN API ──────────────────────────────────────────────────────────
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    Promise.all([
        new Promise(r => db.get(`SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as revenue FROM orders`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as today FROM orders WHERE DATE(created_at) = ?`, [today], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as active FROM orders WHERE status NOT IN ('DELIVERED', 'Delivered', 'CANCELLED', 'Cancelled', 'CANCELLED_BY_RESTAURANT')`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as total_users FROM users`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as customers FROM users WHERE role IN ('CUSTOMER', 'user')`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as owners FROM users WHERE role = 'RESTAURANT_OWNER'`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as partners FROM users WHERE role = 'DELIVERY_PARTNER'`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as restaurants FROM restaurants`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as pending_restaurants FROM restaurants WHERE status = 'PENDING_APPROVAL'`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as foods FROM foods`, [], (e, row) => r(row))),
        new Promise(r => db.get(`SELECT COUNT(*) as delivered FROM orders WHERE status IN ('DELIVERED', 'Delivered')`, [], (e, row) => r(row))),
    ]).then(([totals, todayOrders, active, allUsers, customers, owners, partners, restaurants, pendingRest, foods, delivered]) => {
        res.json({
            total_orders: totals?.total || 0,
            total_revenue: totals?.revenue || 0,
            today_orders: todayOrders?.today || 0,
            active_orders: active?.active || 0,
            total_users: allUsers?.total_users || 0,
            total_customers: customers?.customers || 0,
            total_restaurant_owners: owners?.owners || 0,
            total_delivery_partners: partners?.partners || 0,
            total_restaurants: restaurants?.restaurants || 0,
            pending_restaurants: pendingRest?.pending_restaurants || 0,
            total_foods: foods?.foods || 0,
            delivered_orders: delivered?.delivered || 0
        });
    });
});

app.get('/api/admin/restaurants', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT r.*, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
            FROM restaurants r 
            LEFT JOIN users u ON r.owner_id = u.id 
            ORDER BY r.created_at DESC`, [], (err, rows) => res.json(rows || []));
});

app.put('/api/admin/restaurants/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    const allowed = ['APPROVED', 'REJECTED', 'PENDING_APPROVAL', 'SUSPENDED'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    db.run(`UPDATE restaurants SET status = ? WHERE id = ?`, [status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, status });
    });
});

app.post('/api/admin/restaurants', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, cuisine, image, cover_image, phone, email, address, area, city, state, pincode,
        latitude, longitude, opening_time, closing_time, avg_delivery_time, price_for_two, owner_id } = req.body;

    if (!name || !cuisine) {
        return res.status(400).json({ error: 'Restaurant name and cuisine are required' });
    }

    db.run(`INSERT INTO restaurants (
        name, description, cuisine, image, cover_image, phone, email, address, area, city, state, pincode,
        latitude, longitude, opening_time, closing_time, avg_delivery_time, price_for_two, status, is_active, is_open, owner_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 1, 1, ?)`,
        [name, description || `Authentic ${cuisine} kitchen serving delicious food.`, cuisine,
        image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
        cover_image || image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
        phone || '044-28123456', email || '', address || 'Main Road', area || 'Central', city || 'Chennai',
        state || 'Tamil Nadu', pincode || '600001', latitude || 13.0827, longitude || 80.2707,
        opening_time || '08:00', closing_time || '23:00', avg_delivery_time || '30 min', price_for_two || 350,
        owner_id || null],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ success: true, id: this.lastID, name, status: 'APPROVED' });
        });
});

app.post('/api/admin/delivery-partners', authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, phone, vehicle, vehicle_number, city } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
    
    let targetUserId = null;
    if (email) {
        const existing = await new Promise(r => db.get("SELECT id FROM users WHERE email = ?", [email.toLowerCase().trim()], (e, row) => r(row)));
        if (existing) {
            targetUserId = existing.id;
            db.run("UPDATE users SET role = 'DELIVERY_PARTNER' WHERE id = ?", [targetUserId]);
        } else {
            const pw = await bcrypt.hash('delivery123', 10);
            targetUserId = await new Promise(r => {
                db.run("INSERT INTO users (name, email, password, phone, role, status) VALUES (?, ?, ?, ?, 'DELIVERY_PARTNER', 'active')",
                    [name, email.toLowerCase().trim(), pw, phone], function() { r(this.lastID); });
            });
        }
    }

    db.run(`INSERT INTO delivery_partners (user_id, name, phone, vehicle, vehicle_number, rating, is_available, status, total_deliveries, today_earnings)
        VALUES (?, ?, ?, ?, ?, 4.8, 1, 'APPROVED', 0, 0)`,
        [targetUserId, name, phone, vehicle || 'Motorcycle', vehicle_number || 'TN 01 AB 9999'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id: this.lastID, name, phone, vehicle, status: 'APPROVED' });
        });
});

app.delete('/api/admin/restaurants/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run(`DELETE FROM restaurants WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    const { role } = req.query;
    let sql = `SELECT id, name, email, phone, role, status, created_at FROM users`;
    const params = [];
    if (role) {
        sql += ` WHERE role = ?`;
        params.push(role.toUpperCase());
    }
    sql += ` ORDER BY created_at DESC`;
    db.all(sql, params, (err, rows) => res.json(rows || []));
});

app.put('/api/admin/users/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE users SET status = ? WHERE id = ?`, [status || 'active', req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, status });
    });
});

app.get('/api/admin/delivery-partners', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT dp.*, u.email as user_email FROM delivery_partners dp LEFT JOIN users u ON dp.user_id = u.id ORDER BY dp.id DESC`, [], (err, rows) => {
        res.json(rows || []);
    });
});

app.put('/api/admin/delivery-partners/:id/status', authenticateToken, requireAdmin, (req, res) => {
    const { status, is_available } = req.body;
    db.run(`UPDATE delivery_partners SET status = COALESCE(?, status), is_available = COALESCE(?, is_available) WHERE id = ?`,
        [status, is_available, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.get('/api/admin/orders', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT o.*, u.name as user_account_name, u.email as user_email, r.name as restaurant_name 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            LEFT JOIN restaurants r ON o.restaurant_id = r.id 
            ORDER BY o.created_at DESC LIMIT 100`, [], (err, orders) => {
        if (err) return res.status(500).json({ error: err.message });
        const fetchItems = (orders || []).map(order => new Promise((resolve) => {
            db.all(`SELECT * FROM order_items WHERE order_id = ?`, [order.id], (err, items) => {
                resolve({
                    ...order,
                    order_code: order.order_code || ('BF' + (100000 + order.id)),
                    items: items || []
                });
            });
        }));
        Promise.all(fetchItems).then(results => res.json(results));
    });
});

app.get('/api/admin/foods', authenticateToken, requireAdmin, (req, res) => {
    db.all(`SELECT f.*, r.name as restaurant_name FROM foods f LEFT JOIN restaurants r ON f.restaurant_id = r.id ORDER BY f.id DESC`, [], (err, rows) => {
        res.json(rows || []);
    });
});

app.put('/api/admin/foods/:id', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, price, is_available } = req.body;
    db.run(`UPDATE foods SET name = COALESCE(?, name), description = COALESCE(?, description), price = COALESCE(?, price), is_available = COALESCE(?, is_available) WHERE id = ?`,
        [name, description, price, is_available, req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

app.post('/api/admin/foods', authenticateToken, requireAdmin, (req, res) => {
    const { name, description, price, category, is_veg, image, calories, protein, restaurant_ids, restaurant_id } = req.body;
    if (!name || price === undefined) {
        return res.status(400).json({ error: 'Name and price are required' });
    }

    let targetRests = [];
    if (Array.isArray(restaurant_ids) && restaurant_ids.length > 0) {
        targetRests = restaurant_ids.slice(0, 10);
    } else if (restaurant_id) {
        targetRests = [restaurant_id];
    } else {
        return res.status(400).json({ error: 'At least one restaurant must be selected (max 10)' });
    }

    const stmt = db.prepare(`INSERT INTO foods (name, description, price, category, is_veg, image, calories, protein, is_available, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
    let insertedCount = 0;
    targetRests.forEach((rId) => {
        stmt.run([name, description || '', Number(price) || 0, category || 'Snacks & Fast Food', is_veg ? 1 : 0, image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80', Number(calories) || 300, Number(protein) || 8, rId], (err) => {
            if (!err) insertedCount++;
        });
    });

    stmt.finalize(() => {
        res.json({ success: true, message: `Food created across ${targetRests.length} restaurant(s) (Max 10).` });
    });
});

app.post('/api/admin/foods/:id/assign-restaurants', authenticateToken, requireAdmin, (req, res) => {
    const { restaurant_ids } = req.body;
    const foodId = req.params.id;

    if (!Array.isArray(restaurant_ids) || restaurant_ids.length === 0) {
        return res.status(400).json({ error: 'Please select at least 1 restaurant (max 10)' });
    }

    const selectedRestIds = restaurant_ids.slice(0, 10);

    db.get(`SELECT * FROM foods WHERE id = ?`, [foodId], (err, food) => {
        if (!food) return res.status(404).json({ error: 'Food item not found' });

        const stmt = db.prepare(`INSERT INTO foods (name, description, price, category, is_veg, image, calories, protein, carbs, fat, allergens, tags, is_available, restaurant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`);
        selectedRestIds.forEach((rId) => {
            stmt.run([food.name, food.description, food.price, food.category, food.is_veg, food.image, food.calories, food.protein, food.carbs, food.fat, food.allergens, food.tags, rId]);
        });

        stmt.finalize(() => {
            res.json({ success: true, message: `Food assigned to ${selectedRestIds.length} restaurant(s) (Max 10).` });
        });
    });
});

app.delete('/api/admin/foods/:id', authenticateToken, requireAdmin, (req, res) => {
    db.run(`DELETE FROM foods WHERE id = ?`, [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// ─── ADDRESS ROUTES ───────────────────────────────────────────────────────────
app.get('/api/addresses', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC`, [req.user.id], (err, rows) => res.json(rows || []));
});

app.post('/api/addresses', authenticateToken, (req, res) => {
    const { label, name, phone, flat, street, area, city, state, pincode, instructions, is_default } = req.body;
    if (is_default) {
        db.run(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [req.user.id]);
    }
    db.run(`INSERT INTO addresses (user_id, label, name, phone, flat, street, area, city, state, pincode, instructions, is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [req.user.id, label || 'Home', name || req.user.name, phone || req.user.phone, flat, street, area, city || 'Chennai', state || 'Tamil Nadu', pincode || '600001', instructions, is_default ? 1 : 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        });
});

app.put('/api/addresses/:id', authenticateToken, (req, res) => {
    const { label, name, phone, flat, street, area, city, state, pincode, instructions, is_default } = req.body;
    if (is_default) {
        db.run(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [req.user.id]);
    }
    db.run(`UPDATE addresses SET label=?, name=?, phone=?, flat=?, street=?, area=?, city=?, state=?, pincode=?, instructions=?, is_default=? WHERE id=? AND user_id=?`,
        [label, name, phone, flat, street, area, city, state, pincode, instructions, is_default ? 1 : 0, req.params.id, req.user.id],
        (err) => res.sendStatus(err ? 500 : 200));
});

app.delete('/api/addresses/:id', authenticateToken, (req, res) => {
    db.run(`DELETE FROM addresses WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], (err) => {
        res.sendStatus(err ? 500 : 200);
    });
});

app.put('/api/addresses/:id/default', authenticateToken, (req, res) => {
    db.run(`UPDATE addresses SET is_default = 0 WHERE user_id = ?`, [req.user.id], () => {
        db.run(`UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id], () => {
            res.json({ success: true });
        });
    });
});

// ─── FAVORITES ROUTES ─────────────────────────────────────────────────────────
app.get('/api/favorites', authenticateToken, (req, res) => {
    db.all(`SELECT fav.*, r.name as restaurant_name, r.image as restaurant_image, r.rating as restaurant_rating,
            r.cuisine, r.delivery_time, f.name as food_name, f.price as food_price, f.image as food_image
            FROM favorites fav
            LEFT JOIN restaurants r ON fav.restaurant_id = r.id
            LEFT JOIN foods f ON fav.food_id = f.id
            WHERE fav.user_id = ?`, [req.user.id], (err, rows) => res.json(rows || []));
});

app.post('/api/favorites/restaurant/:id', authenticateToken, (req, res) => {
    db.get(`SELECT id FROM favorites WHERE user_id = ? AND restaurant_id = ?`, [req.user.id, req.params.id], (err, row) => {
        if (row) {
            db.run(`DELETE FROM favorites WHERE id = ?`, [row.id], () => res.json({ favorited: false }));
        } else {
            db.run(`INSERT INTO favorites (user_id, restaurant_id) VALUES (?, ?)`, [req.user.id, req.params.id], () => res.json({ favorited: true }));
        }
    });
});

app.post('/api/favorites/food/:id', authenticateToken, (req, res) => {
    db.get(`SELECT id FROM favorites WHERE user_id = ? AND food_id = ?`, [req.user.id, req.params.id], (err, row) => {
        if (row) {
            db.run(`DELETE FROM favorites WHERE id = ?`, [row.id], () => res.json({ favorited: false }));
        } else {
            db.run(`INSERT INTO favorites (user_id, food_id) VALUES (?, ?)`, [req.user.id, req.params.id], () => res.json({ favorited: true }));
        }
    });
});

app.get('/api/favorites/check/:restaurantId', authenticateToken, (req, res) => {
    db.get(`SELECT id FROM favorites WHERE user_id = ? AND restaurant_id = ?`, [req.user.id, req.params.restaurantId], (err, row) => {
        res.json({ favorited: !!row });
    });
});

// ─── REVIEWS ROUTES ───────────────────────────────────────────────────────────
app.post('/api/reviews', authenticateToken, (req, res) => {
    const { order_id, restaurant_id, restaurant_rating, food_rating, delivery_rating, comment } = req.body;
    db.run(`INSERT INTO reviews (user_id, order_id, restaurant_id, restaurant_rating, food_rating, delivery_rating, comment) VALUES (?,?,?,?,?,?,?)`,
        [req.user.id, order_id || null, restaurant_id, restaurant_rating || 5, food_rating || 5, delivery_rating || 5, comment || ''],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            db.get(`SELECT AVG(restaurant_rating) as avg, COUNT(*) as cnt FROM reviews WHERE restaurant_id = ?`, [restaurant_id], (err, row) => {
                if (row && row.avg) {
                    db.run(`UPDATE restaurants SET rating = ROUND(?, 1), rating_count = ? WHERE id = ?`, [row.avg, row.cnt, restaurant_id]);
                }
            });
            res.json({ id: this.lastID });
        });
});

app.get('/api/reviews/restaurant/:id', (req, res) => {
    db.all(`SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.restaurant_id = ? ORDER BY r.created_at DESC`,
        [req.params.id], (err, rows) => res.json(rows || []));
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30`, [req.user.id], (err, rows) => res.json(rows || []));
});

app.put('/api/notifications/read', authenticateToken, (req, res) => {
    db.run(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`, [req.user.id], () => res.sendStatus(200));
});

// ─── USER PREFERENCES ─────────────────────────────────────────────────────────
app.get('/api/preferences', authenticateToken, (req, res) => {
    db.get(`SELECT * FROM user_preferences WHERE user_id = ?`, [req.user.id], (err, row) => {
        res.json(row || { dietary_preference: 'all', favorite_cuisines: '', health_focus: '' });
    });
});

app.put('/api/preferences', authenticateToken, (req, res) => {
    const { dietary_preference, favorite_cuisines, health_focus } = req.body;
    db.run(`INSERT INTO user_preferences (user_id, dietary_preference, favorite_cuisines, health_focus)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET dietary_preference = excluded.dietary_preference, favorite_cuisines = excluded.favorite_cuisines, health_focus = excluded.health_focus`,
        [req.user.id, dietary_preference || 'all', favorite_cuisines || '', health_focus || ''], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
});

// ─── SEARCH ───────────────────────────────────────────────────────────────────
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ restaurants: [], foods: [] });

    Promise.all([
        new Promise(r => db.all(`SELECT * FROM restaurants WHERE is_active = 1 AND (status = 'APPROVED' OR status IS NULL) AND (name LIKE ? OR cuisine LIKE ?) LIMIT 6`,
            [`%${q}%`, `%${q}%`], (e, rows) => r(rows || []))),
        new Promise(r => db.all(`SELECT f.*, r.name as restaurant_name FROM foods f JOIN restaurants r ON f.restaurant_id = r.id WHERE f.is_available = 1 AND r.is_active = 1 AND (f.name LIKE ? OR f.description LIKE ? OR f.category LIKE ?) LIMIT 10`,
            [`%${q}%`, `%${q}%`, `%${q}%`], (e, rows) => r(rows || []))),
    ]).then(([restaurants, foods]) => res.json({ restaurants, foods }));
});

// ─── STATIC ASSETS & SPA SERVING ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// ─── START SERVER ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 BiteFlow Multi-Role Food Delivery Server on port ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
    console.log(`⚡ WebSocket / Socket.IO Enabled`);
    console.log(`📂 SQLite Database: ${resolvedDbPath} (WAL Mode Enabled)`);
    console.log(`👥 Roles: CUSTOMER | RESTAURANT_OWNER | DELIVERY_PARTNER | ADMIN`);
    console.log(`🛡️ Admin: admin@biteflow.com / admin123`);
    console.log(`🍽️ Owner: owner@biteflow.com / owner123`);
    console.log(`🛵 Delivery: delivery@biteflow.com / delivery123`);
    console.log(`👤 Customer: user@biteflow.com / user123`);
    console.log(`=======================================================`);
});
