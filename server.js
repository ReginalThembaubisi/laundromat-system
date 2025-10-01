const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads', 'photos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'laundry-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve uploaded photos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize WhatsApp client
const whatsappClient = new Client({
  authStrategy: new LocalAuth({
    clientId: "laundromat-whatsapp"
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// WhatsApp event handlers
whatsappClient.on('qr', (qr) => {
  console.log('\n📱 WhatsApp QR Code:');
  console.log('=====================================');
  qrcode.generate(qr, { 
    small: false,
    scale: 2
  });
  console.log('=====================================');
  console.log('📱 Scan the QR code above with your WhatsApp mobile app to connect');
  console.log('📱 Go to: WhatsApp > Settings > Linked Devices > Link a Device');
  console.log('📱 Make sure your terminal window is large enough to display the QR code clearly');
  console.log('=====================================\n');
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('✅ You can now receive real WhatsApp messages!');
});

whatsappClient.on('authenticated', () => {
  console.log('✅ WhatsApp authenticated successfully');
});

whatsappClient.on('auth_failure', (msg) => {
  console.error('❌ WhatsApp authentication failed:', msg);
});

whatsappClient.on('disconnected', (reason) => {
  console.log('❌ WhatsApp client disconnected:', reason);
  console.log('🔄 Attempting to reconnect...');
});

// Initialize WhatsApp client
whatsappClient.initialize().catch(err => {
  console.error('❌ Failed to initialize WhatsApp client:', err);
});

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'laundromat_db'
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database');
});

// Create table if it doesn't exist
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS laundry_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    commune VARCHAR(50) NOT NULL,
    room VARCHAR(20) NOT NULL,
    clothes_count INT DEFAULT 0,
    photos TEXT,
    status ENUM('Pending', 'In Progress', 'Completed', 'Collected') DEFAULT 'Pending',
    reference_number VARCHAR(20) UNIQUE,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_completed TIMESTAMP NULL,
    collection_name VARCHAR(100),
    collection_contact VARCHAR(20),
    collection_id_number VARCHAR(20),
    collection_signature TEXT,
    collection_date TIMESTAMP NULL,
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    collection_reminder_sent BOOLEAN DEFAULT FALSE
  )
`;

db.query(createTableQuery, (err) => {
  if (err) {
    console.error('Error creating table:', err);
  } else {
    console.log('Table created or already exists');
  }
});

// Routes

// GET all laundry requests
app.get('/api/laundry', (req, res) => {
  const query = 'SELECT * FROM laundry_requests ORDER BY date_submitted DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching requests:', err);
      return res.status(500).json({ error: 'Failed to fetch requests' });
    }
    res.json(results);
  });
});

// GET verify reference number for collection
app.get('/api/laundry/verify/:reference', (req, res) => {
  const { reference } = req.params;
  
  const query = 'SELECT * FROM laundry_requests WHERE reference_number = ? AND status = "Completed"';
  
  db.query(query, [reference], (err, results) => {
    if (err) {
      console.error('Error verifying reference:', err);
      return res.status(500).json({ error: 'Failed to verify reference' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Invalid reference number or laundry not ready for collection' });
    }
    
    res.json(results[0]);
  });
});

// POST complete collection
app.post('/api/laundry/collect', (req, res) => {
  const { laundry_id, name, contact, id_number, signature } = req.body;
  
  // Validate required fields
  if (!laundry_id || !name || !contact || !id_number || !signature) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Update laundry request with collection details
  const query = `
    UPDATE laundry_requests 
    SET 
      collection_name = ?, 
      collection_contact = ?, 
      collection_id_number = ?, 
      collection_signature = ?, 
      collection_date = NOW(),
      status = 'Collected'
    WHERE id = ? AND status = 'Completed'
  `;
  
  db.query(query, [name, contact, id_number, signature, laundry_id], (err, result) => {
    if (err) {
      console.error('Error completing collection:', err);
      return res.status(500).json({ error: 'Failed to complete collection' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Laundry not found or not ready for collection' });
    }
    
    res.json({
      message: 'Collection completed successfully',
      collection_date: new Date().toISOString()
    });
  });
});

// POST new laundry request with file upload
app.post('/api/laundry', upload.array('photos', 10), (req, res) => {
  const { name, surname, contact, commune, clothes_count } = req.body;
  
  // Validate required fields
  if (!name || !surname || !contact || !commune || !clothes_count) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  // Generate reference number
  const referenceNumber = 'LAU' + Date.now().toString().slice(-6);
  
  // Process uploaded photos
  let photosData = [];
  if (req.files && req.files.length > 0) {
    photosData = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: `/uploads/photos/${file.filename}`,
      size: file.size
    }));
  }
  
  // Convert photos array to JSON string for storage
  const photosJson = photosData.length > 0 ? JSON.stringify(photosData) : null;
  
  const query = 'INSERT INTO laundry_requests (name, surname, contact, commune, clothes_count, photos, reference_number) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(query, [name, surname, contact, commune, clothes_count, photosJson, referenceNumber], (err, result) => {
    if (err) {
      console.error('Error creating request:', err);
      return res.status(500).json({ error: 'Failed to create request' });
    }
    
    res.status(201).json({
      id: result.insertId,
      name,
      surname,
      contact,
      commune,
      clothes_count,
      photos: photosData,
      reference_number: referenceNumber,
      status: 'Pending',
      message: 'Laundry drop-off registered successfully'
    });
  });
});

// PUT update laundry request status
app.put('/api/laundry/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  let query, params;
  
  if (status === 'Completed') {
    query = 'UPDATE laundry_requests SET status = ?, date_completed = NOW() WHERE id = ?';
    params = [status, id];
  } else {
    query = 'UPDATE laundry_requests SET status = ?, date_completed = NULL WHERE id = ?';
    params = [status, id];
  }
  
  db.query(query, params, async (err, result) => {
    if (err) {
      console.error('Error updating request:', err);
      return res.status(500).json({ error: 'Failed to update request' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }
    
    // If status is set to Completed, automatically send collection notification
    if (status === 'Completed') {
      try {
        // Get request details for notification
        const getRequestQuery = 'SELECT * FROM laundry_requests WHERE id = ?';
        db.query(getRequestQuery, [id], async (err, results) => {
          if (err) {
            console.error('Error fetching request for notification:', err);
          } else if (results.length > 0) {
            const request = results[0];
            
            // Send automatic collection notification
            const collectionMessage = `🎉 Hello ${request.name}! Your laundry is ready for collection!\n\n📋 Reference: ${request.reference_number}\n👕 Items: ${request.clothes_count} pieces\n📍 Please collect from the laundromat\n\n📝 Complete collection form: http://localhost:5000/collection\n\nThank you for using our service!`;
            
            const whatsappResult = await sendWhatsAppMessage(request.contact, collectionMessage);
            
            if (whatsappResult.success) {
              // Update WhatsApp sent status
              const updateWhatsAppQuery = 'UPDATE laundry_requests SET whatsapp_sent = TRUE WHERE id = ?';
              db.query(updateWhatsAppQuery, [id]);
              console.log(`✅ Collection notification sent to ${request.name} (${request.contact})`);
            }
          }
        });
      } catch (error) {
        console.error('Error sending collection notification:', error);
      }
    }
    
    res.json({ 
      message: 'Request updated successfully',
      notification_sent: status === 'Completed' ? 'Collection notification sent' : null
    });
  });
});

// WhatsApp Integration Functions
const sendWhatsAppMessage = async (phoneNumber, message) => {
  try {
    // Format phone number for WhatsApp (add country code if not present)
    let formattedNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digits
    
    // Add South African country code if not present
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '27' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('27')) {
      formattedNumber = '27' + formattedNumber;
    }
    
    const fullNumber = formattedNumber + '@c.us';
    
    // Check if WhatsApp client is ready
    if (!whatsappClient.info || !whatsappClient.info.connected) {
      console.log('⏳ WhatsApp client not ready yet, queuing message...');
      return {
        success: false,
        error: 'WhatsApp client not ready. Please scan QR code first to connect your WhatsApp account.'
      };
    }
    
    // Send the message
    const result = await whatsappClient.sendMessage(fullNumber, message);
    
    console.log(`✅ WhatsApp message sent to ${phoneNumber}:`);
    console.log(message);
    console.log('---');
    
    return {
      success: true,
      messageId: result.id._serialized,
      message: 'WhatsApp message sent successfully'
    };
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Check WhatsApp status endpoint
app.get('/api/whatsapp/status', (req, res) => {
  const isReady = whatsappClient.info && whatsappClient.info.connected;
  res.json({
    ready: isReady,
    status: isReady ? 'Connected' : 'Not connected - Please scan QR code',
    message: isReady ? 'WhatsApp is ready to send messages' : 'Scan the QR code in the terminal to connect WhatsApp'
  });
});

// Test WhatsApp endpoint
app.post('/api/test-whatsapp', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Phone number and message are required' });
  }
  
  try {
    const result = await sendWhatsAppMessage(phoneNumber, message);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send WhatsApp notification
app.post('/api/whatsapp/:id', async (req, res) => {
  const { id } = req.params;
  const { messageType } = req.body;
  
  try {
    // Get request details
    const query = 'SELECT * FROM laundry_requests WHERE id = ?';
    db.query(query, [id], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch request' });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      
      const request = results[0];
      let message = '';
      
      switch (messageType) {
        case 'collection':
          message = `🎉 Hello ${request.name}! Your laundry is ready for collection!\n\n📋 Reference: ${request.reference_number}\n👕 Items: ${request.clothes_count} pieces\n📍 Please collect from the laundromat\n\n📝 Complete collection form: http://localhost:5000/collection\n\nThank you for using our service!`;
          break;
        case 'status_update':
          message = `📱 Hi ${request.name}! Status Update\n\n📋 Reference: ${request.reference_number}\n📊 Status: ${request.status}\n👕 Items: ${request.clothes_count} pieces\n\nWe'll notify you when it's ready for collection!`;
          break;
        default:
          message = `🎉 Hello ${request.name}! Your laundry is ready for collection!\n\n📋 Reference: ${request.reference_number}\n👕 Items: ${request.clothes_count} pieces\n📍 Please collect from the laundromat\n\n📝 Complete collection form: http://localhost:5000/collection\n\nThank you for using our service!`;
      }
      
      const result = await sendWhatsAppMessage(request.contact, message);
      
      if (result.success) {
        // Update WhatsApp sent status
        const updateQuery = 'UPDATE laundry_requests SET whatsapp_sent = TRUE WHERE id = ?';
        db.query(updateQuery, [id]);
        
        res.json({ success: true, message: 'WhatsApp notification sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send WhatsApp message' });
      }
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});


// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Catch all handler for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
