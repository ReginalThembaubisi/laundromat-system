const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
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

// Store QR code for web display
let currentQRCode = null;

// WhatsApp event handlers
whatsappClient.on('qr', (qr) => {
  currentQRCode = qr;
  console.log('\n📱 WhatsApp QR Code:');
  console.log('=====================================');
  qrcode.generate(qr, { 
    small: false,
    scale: 2
  });
  console.log('=====================================');
  console.log('📱 Scan the QR code above with your WhatsApp mobile app to connect');
  console.log('📱 Go to: WhatsApp > Settings > Linked Devices > Link a Device');
  console.log('📱 Or visit: http://localhost:5000/whatsapp-qr');
  console.log('=====================================\n');
});

whatsappClient.on('ready', () => {
  console.log('✅ WhatsApp client is ready!');
  console.log('✅ You can now send WhatsApp messages!');
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
  console.log('✅ Connected to MySQL database');
});

// Create tables if they don't exist
const createUserProfilesTable = `
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    commune VARCHAR(50) NOT NULL,
    room VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const createSavedPhotosTable = `
  CREATE TABLE IF NOT EXISTS saved_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    photo_name VARCHAR(100) NOT NULL,
    photo_path VARCHAR(200) NOT NULL,
    photo_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

const createLaundryRequestsTable = `
  CREATE TABLE IF NOT EXISTS laundry_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20),
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

// Create tables sequentially
db.query(createUserProfilesTable, (err) => {
  if (err) {
    console.error('Error creating user_profiles table:', err);
  } else {
    console.log('✅ user_profiles table ready');
  }
});

db.query(createSavedPhotosTable, (err) => {
  if (err) {
    console.error('Error creating saved_photos table:', err);
  } else {
    console.log('✅ saved_photos table ready');
  }
});

db.query(createLaundryRequestsTable, (err) => {
  if (err) {
    console.error('Error creating laundry_requests table:', err);
  } else {
    console.log('✅ laundry_requests table ready');
  }
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

// Routes

// User Profile Management

// POST create or update user profile
app.post('/api/profile', (req, res) => {
  const { student_id, name, surname, contact, commune, room } = req.body;
  
  if (!student_id || !name || !surname || !contact || !commune || !room) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const query = `
    INSERT INTO user_profiles (student_id, name, surname, contact, commune, room) 
    VALUES (?, ?, ?, ?, ?, ?) 
    ON DUPLICATE KEY UPDATE 
    name = VALUES(name), 
    surname = VALUES(surname), 
    contact = VALUES(contact), 
    commune = VALUES(commune), 
    room = VALUES(room),
    updated_at = CURRENT_TIMESTAMP
  `;
  
  db.query(query, [student_id, name, surname, contact, commune, room], (err, result) => {
    if (err) {
      console.error('Error saving profile:', err);
      return res.status(500).json({ error: 'Failed to save profile' });
    }
    
    res.json({
      message: 'Profile saved successfully',
      student_id,
      isNew: result.affectedRows === 1
    });
  });
});

// GET user profile by student ID
app.get('/api/profile/:student_id', (req, res) => {
  const { student_id } = req.params;
  
  const query = 'SELECT * FROM user_profiles WHERE student_id = ?';
  
  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(results[0]);
  });
});

// POST save photos for reuse
app.post('/api/profile/:student_id/photos', upload.array('photos', 10), (req, res) => {
  const { student_id } = req.params;
  
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No photos uploaded' });
  }
  
  const photosData = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    path: `/uploads/photos/${file.filename}`,
    size: file.size
  }));
  
  const insertPromises = photosData.map(photo => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO saved_photos (student_id, photo_name, photo_path, photo_data) VALUES (?, ?, ?, ?)';
      const photoData = JSON.stringify(photo);
      db.query(query, [student_id, photo.originalName, photo.path, photoData], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  });
  
  Promise.all(insertPromises)
    .then(() => {
      res.json({
        message: 'Photos saved successfully',
        photos: photosData
      });
    })
    .catch(err => {
      console.error('Error saving photos:', err);
      res.status(500).json({ error: 'Failed to save photos' });
    });
});

// GET saved photos for a student
app.get('/api/profile/:student_id/photos', (req, res) => {
  const { student_id } = req.params;
  
  const query = 'SELECT * FROM saved_photos WHERE student_id = ? ORDER BY created_at DESC';
  
  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Error fetching photos:', err);
      return res.status(500).json({ error: 'Failed to fetch photos' });
    }
    
    const photos = results.map(row => ({
      id: row.id,
      name: row.photo_name,
      path: row.photo_path,
      data: JSON.parse(row.photo_data),
      created_at: row.created_at
    }));
    
    res.json(photos);
  });
});

// POST quick laundry submission using saved profile
app.post('/api/laundry/quick', upload.array('photos', 10), (req, res) => {
  const { student_id, clothes_count, use_saved_photos, selected_photo_ids } = req.body;
  
  if (!student_id || !clothes_count) {
    return res.status(400).json({ error: 'Student ID and clothes count are required' });
  }
  
  // First get the user profile
  const profileQuery = 'SELECT * FROM user_profiles WHERE student_id = ?';
  
  db.query(profileQuery, [student_id], (err, profileResults) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }
    
    if (profileResults.length === 0) {
      return res.status(404).json({ error: 'Profile not found. Please create a profile first.' });
    }
    
    const profile = profileResults[0];
    
    // Generate reference number
    const referenceNumber = 'LAU' + Date.now().toString().slice(-6);
    
    let photosData = [];
    
    if (use_saved_photos === 'true' && selected_photo_ids) {
      // Use saved photos
      const photoIds = JSON.parse(selected_photo_ids);
      const savedPhotosQuery = 'SELECT * FROM saved_photos WHERE student_id = ? AND id IN (?)';
      
      db.query(savedPhotosQuery, [student_id, photoIds], (err, savedResults) => {
        if (err) {
          console.error('Error fetching saved photos:', err);
          return res.status(500).json({ error: 'Failed to fetch saved photos' });
        }
        
        photosData = savedResults.map(row => JSON.parse(row.photo_data));
        createLaundryRequest();
      });
    } else if (req.files && req.files.length > 0) {
      // Use newly uploaded photos
      photosData = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        path: `/uploads/photos/${file.filename}`,
        size: file.size
      }));
      createLaundryRequest();
    } else {
      createLaundryRequest();
    }
    
    function createLaundryRequest() {
      const photosJson = photosData.length > 0 ? JSON.stringify(photosData) : null;
      
      const query = `
        INSERT INTO laundry_requests 
        (student_id, name, surname, contact, commune, room, clothes_count, photos, reference_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.query(query, [
        student_id, 
        profile.name, 
        profile.surname, 
        profile.contact, 
        profile.commune, 
        profile.room, 
        clothes_count, 
        photosJson, 
        referenceNumber
      ], (err, result) => {
        if (err) {
          console.error('Error creating quick request:', err);
          return res.status(500).json({ error: 'Failed to create request' });
        }
        
        res.status(201).json({
          id: result.insertId,
          student_id,
          name: profile.name,
          surname: profile.surname,
          contact: profile.contact,
          commune: profile.commune,
          room: profile.room,
          clothes_count,
          photos: photosData,
          reference_number: referenceNumber,
          status: 'Pending',
          message: 'Quick laundry submission successful!'
        });
      });
    }
  });
});

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
    
    // If status is set to Completed, send WhatsApp notification
    if (status === 'Completed') {
      try {
        // Get request details for notification
        const getRequestQuery = 'SELECT * FROM laundry_requests WHERE id = ?';
        db.query(getRequestQuery, [id], async (err, results) => {
          if (err) {
            console.error('Error fetching request for notification:', err);
          } else if (results.length > 0) {
            const request = results[0];
            
            // Send WhatsApp notification
            const message = `🎉 Hello ${request.name}! Your laundry is ready for collection!\n\n📋 Reference: ${request.reference_number}\n👕 Items: ${request.clothes_count} pieces\n📍 Please collect from the laundromat\n\n📝 Complete collection form: http://localhost:5000/collection\n\nThank you for using our service!`;
            
            const whatsappResult = await sendWhatsAppMessage(request.contact, message);
            
            if (whatsappResult.success) {
              // Update WhatsApp sent status
              const updateWhatsAppQuery = 'UPDATE laundry_requests SET whatsapp_sent = TRUE WHERE id = ?';
              db.query(updateWhatsAppQuery, [id]);
              console.log(`✅ WhatsApp notification sent to ${request.name} (${request.contact})`);
            } else {
              console.log(`❌ Failed to send WhatsApp to ${request.name}: ${whatsappResult.error}`);
            }
          }
        });
      } catch (error) {
        console.error('Error sending WhatsApp notification:', error);
      }
    }
    
    res.json({ 
      message: 'Request updated successfully',
      notification_sent: status === 'Completed' ? 'WhatsApp notification sent' : null
    });
  });
});

// WhatsApp QR code web page
app.get('/whatsapp-qr', async (req, res) => {
  const isReady = whatsappClient.info && whatsappClient.info.connected;
  
  if (isReady) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Connected</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
          .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 10px; margin: 20px; }
          .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
        </style>
      </head>
      <body>
        <h1>✅ WhatsApp Connected!</h1>
        <div class="success">
          <h2>WhatsApp is ready to send messages!</h2>
          <p>You can now send laundry completion notifications to students.</p>
        </div>
        <a href="/admin" class="btn">Go to Admin Dashboard</a>
        <a href="/" class="btn">Go to Laundromat</a>
      </body>
      </html>
    `);
  } else if (currentQRCode) {
    try {
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(currentQRCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
            .qr-container { background: white; padding: 30px; border-radius: 10px; margin: 20px auto; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .instructions { background: #e3f2fd; color: #1565c0; padding: 20px; border-radius: 10px; margin: 20px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
            .refresh { background: #28a745; }
            .qr-image { border: 2px solid #ddd; border-radius: 10px; }
          </style>
        </head>
        <body>
          <h1>📱 Connect WhatsApp</h1>
          <div class="qr-container">
            <h2>Scan this QR code with your phone:</h2>
            <img src="${qrDataURL}" alt="WhatsApp QR Code" class="qr-image" />
            <p><strong>Reference: ${currentQRCode.substring(0, 20)}...</strong></p>
          </div>
          <div class="instructions">
            <h3>How to connect:</h3>
            <ol style="text-align: left; max-width: 400px; margin: 0 auto;">
              <li>Open WhatsApp on your phone</li>
              <li>Go to Settings → Linked Devices</li>
              <li>Tap "Link a Device"</li>
              <li>Scan the QR code above</li>
              <li>Wait for the connection confirmation</li>
            </ol>
          </div>
          <a href="/whatsapp-qr" class="btn refresh">🔄 Refresh Page</a>
          <a href="/admin" class="btn">Go to Admin Dashboard</a>
          
          <script>
            // Auto-refresh every 5 seconds
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          </script>
        </body>
        </html>
      `);
    } catch (error) {
      console.error('Error generating QR code:', error);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp QR Code Error</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
            .error { background: #f8d7da; color: #721c24; padding: 20px; border-radius: 10px; margin: 20px; }
            .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
          </style>
        </head>
        <body>
          <h1>❌ QR Code Error</h1>
          <div class="error">
            <h2>Failed to generate QR code</h2>
            <p>Please try refreshing the page or check the terminal for the QR code.</p>
          </div>
          <a href="/whatsapp-qr" class="btn">🔄 Refresh Page</a>
          <a href="/admin" class="btn">Go to Admin Dashboard</a>
        </body>
        </html>
      `);
    }
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Connecting</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f0f0; }
          .loading { background: #fff3cd; color: #856404; padding: 20px; border-radius: 10px; margin: 20px; }
          .btn { background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px; }
        </style>
      </head>
      <body>
        <h1>📱 WhatsApp Connecting...</h1>
        <div class="loading">
          <h2>Please wait while WhatsApp initializes...</h2>
          <p>This may take a few moments. The page will refresh automatically.</p>
        </div>
        <a href="/whatsapp-qr" class="btn">🔄 Refresh Page</a>
        <a href="/admin" class="btn">Go to Admin Dashboard</a>
        
        <script>
          // Auto-refresh every 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
});

// WhatsApp status endpoint
app.get('/api/whatsapp/status', (req, res) => {
  const isReady = whatsappClient.info && whatsappClient.info.connected;
  res.json({
    ready: isReady,
    status: isReady ? 'Connected' : 'Not connected - Please scan QR code',
    message: isReady ? 'WhatsApp is ready to send messages' : 'Visit http://localhost:5000/whatsapp-qr to scan QR code'
  });
});

// Manual WhatsApp send endpoint
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
        res.status(500).json({ error: 'Failed to send WhatsApp message: ' + result.error });
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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Admin Dashboard: http://localhost:5000`);
  console.log(`📝 Collection Form: http://localhost:5000/collection`);
  console.log(`📱 WhatsApp QR: http://localhost:5000/whatsapp-qr`);
});
