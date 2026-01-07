// server.js

// --- 1. Imports ---
const express = require('express');
const mysql = require('mysql2'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const axios = require('axios');
const base64 = require('base-64');
const multer = require('multer');
const path = require('path');
const { log } = require('console');

// Load environment variables immediately
dotenv.config();

const app = express();
const UPLOAD_DIR = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true }); // <--- 2. Create directory recursively
        console.log(`Upload directory created at: ${UPLOAD_DIR}`);
    }
} catch (error) {
    console.error('Failed to create upload directory:', error);
    process.exit(1); // Exit if critical setup fails
}

// --- 2. Middleware Setup ---
app.use(cors()); 
app.use(express.json()); // Allows the server to read JSON request bodies
app.use(express.urlencoded({ extended: true })); // Handle form data
app.use('/uploads', express.static('uploads')); // Serve uploaded files publicly

// --- 2.1 Multer Configuration (File Uploads) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure this folder exists in your project root
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});
const upload = multer({ storage: storage });
// --- 3. MySQL Database Connection Pool ---
// Using a connection pool for better performance and resource management
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
}).promise(); // Use .promise() for async/await support

// Verify database connection on startup
pool.query('SELECT 1')
    .then(() => console.log('MySQL Promise Pool connected successfully.'))
    .catch(err => {
        console.error('Failed to connect to MySQL:', err.message);
        process.exit(1); 
    });


// --- 4. Authentication Middleware ---
// This function checks if a request has a valid JWT, protecting specific routes.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Format: "Bearer TOKEN_STRING"
    const token = authHeader && authHeader.split(' ')[1]; 
    
    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden (e.g., token expired or invalid)
        req.user = user; 
        next();
    });
};


// --- 5. User Registration Route ---
app.post('/auth/register', async (req, res) => {
    const { name, email, password } = req.body; 

    // Simple validation
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'All fields (name, email, password) are required.' });
    }

    try {
        // Check if user already exists
        const [existingUser] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'User with that email already exists' });
        }
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert the new user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration', error: error.message });
    }
});


// --- 6. User Login Route ---
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body; 

    try {
        // Find the user by email
        const [results] = await pool.query('SELECT id, name, password_hash FROM users WHERE email = ?', [email]);
        
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = results[0];
        
        // Compare the plain password with the stored hash
        const isMatch = await bcrypt.compare(password, user.password_hash); 
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create a JWT token
        const token = jwt.sign(
            { id: user.id }, 
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        
        // Success: Send token and user info
        res.json({ token, userId: user.id, userName: user.name, message: 'Sign-in successful!' }); 

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login', error: error.message });
    }
});


// --- 7. Example Protected Route (for testing token) ---
app.get('/profile', authenticateToken, async (req, res) => {
    // This route only runs if the token is valid
    try {
        const [rows] = await pool.query('SELECT name, email, created_at FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: 'You accessed a protected route!', user: rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});



// --- NEW FEATURES START HERE ---

// --- 5. CART ROUTES ---

// Get Cart Items
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [req.user.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart' });
    }
});

// Add Item to Cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    const { productName, quantity, unitPrice } = req.body;
    const totalPrice = quantity * unitPrice;

    try {
        await pool.query(
            'INSERT INTO cart (user_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, productName, quantity, unitPrice, totalPrice]
        );
        res.json({ message: 'Item added to cart' });
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// --- 6. QUOTE REQUEST ROUTE ---
app.post('/api/quote', async (req, res) => {
    const { name, email, phone, productInterest, quantity, details } = req.body;
    try {
        await pool.query(
            'INSERT INTO quotes (name, email, phone, product_interest, quantity, details) VALUES (?, ?, ?, ?, ?, ?)',
            [name, email, phone, productInterest, quantity, details]
        );
        res.json({ message: 'Quote request submitted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting quote.' });
    }
});

// --- 7. ORDER & CUSTOMIZE ROUTE ---
// Uses 'upload.single' to handle the logo file
app.post('/api/orders/create', authenticateToken, upload.single('logo'), async (req, res) => {
    const { productName, quantity, unitPrice, address, phone } = req.body;
    const logoPath = req.file ? req.file.path : null;
    const totalAmount = parseFloat(quantity) * parseFloat(unitPrice);

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Create Order
        const [orderResult] = await connection.query(
            'INSERT INTO orders (user_id, total_amount, status, shipping_address, phone_number, logo_file_path) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, totalAmount, 'Pending', address, phone, logoPath]
        );
        const orderId = orderResult.insertId;

        // 2. Create Order Item
        await connection.query(
            'INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, productName, quantity, unitPrice, totalAmount]
        );

        await connection.commit();

        res.json({ 
            message: 'Order created successfully', 
            orderId: orderId, 
            amount: totalAmount 
        });

    } catch (error) {
        await connection.rollback();
        console.error('Order creation failed:', error);
        res.status(500).json({ message: 'Order creation failed' });
    } finally {
        connection.release();
    }
});


// Helper function to get M-Pesa Access Token
async function getAccessToken() {
    try {
        const auth = base64.encode(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`);
        const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'; 
        const response = await axios.get(url, { headers: { 'Authorization': `Basic ${auth}` } });
        return response.data.access_token;
    } catch (error) {
        // ADDED: Better logging for token failure
        console.error('CRITICAL: M-Pesa Token Generation Failed.');
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        throw new Error('Failed to get M-Pesa Access Token.');
    }
}

// Initiate Payment (Updated to link with OrderID)
app.post('/api/mpesa/stkpush', authenticateToken, async (req, res) => {
    let { phoneNumber, orderId } = req.body;
    // Removes leading zero, replaces with 254
    if (phoneNumber.startsWith('0')) {
        phoneNumber = '254' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('254')) {
        // If they enter 7XXXXXXXX, it won't work, but we'll try to enforce 254
        // A better frontend check is recommended, but this handles common errors
        if (phoneNumber.length === 9) { 
            phoneNumber = '254' + phoneNumber;
        }
    }
    // Fetch order to get amount
    const [orders] = await pool.query('SELECT total_amount FROM orders WHERE id = ? AND user_id = ?', [orderId, req.user.id]);
    
    if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });
    const amount = Math.ceil(orders[0].total_amount); // Ensure integer for M-Pesa

    try {
        const token = await getAccessToken();
        const shortCode = process.env.MPESA_SHORTCODE;
        const passkey = process.env.MPESA_PASSKEY;
            // Ensure Passkey is not the placeholder!
            if (passkey === 'YourSTKPushPassKey') {
                console.error('CRITICAL: MPESA_PASSKEY is still set to placeholder!');
                return res.status(500).json({ message: 'Server configuration error: M-Pesa Passkey missing.' });
            }
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = base64.encode(`${shortCode}${passkey}${timestamp}`);
        
        const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const stkResponse = await axios.post(stkUrl, {
            BusinessShortCode: shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber, 
            PartyB: shortCode, 
            PhoneNumber: phoneNumber,
            CallBackURL: process.env.MPESA_CALLBACK_URL, 
            AccountReference: `Order ${orderId}`, 
            TransactionDesc: `Payment for Order ${orderId}`
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log(`STK Push initiated successfully for Order ${orderId}. Response Code: ${stkResponse.data.ResponseCode}`);
        res.json({ message: 'M-Pesa STK Push sent.', data: stkResponse.data });

    } catch (error) {
        // ADDED: Log the actual error response from M-Pesa for better debugging
        if (error.response) {
            console.error('M-Pesa API Response Error:', JSON.stringify(error.response.data));
        } else {
            console.error('M-Pesa error:', error.message);
        }
        res.status(500).json({ message: 'Failed to initiate M-Pesa payment.' });
    }
});

// M-Pesa Callback
app.post('/api/mpesa/callback', async (req, res) => {
    const callbackData = req.body.Body.stkCallback;
    console.log('M-Pesa Callback:', JSON.stringify(callbackData));

    if (callbackData.ResultCode === 0) {
        // Payment Successful
        // Extract Order ID from AccountReference in your logic or metadata
        // For simplicity, we assume you parse the AccountReference manually or store the CheckoutRequestID
        // In a real app, map CheckoutRequestID to OrderID in database
        console.log("Payment Successful");
        // Update Order status in DB to 'Paid' here
    }

    res.status(200).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});