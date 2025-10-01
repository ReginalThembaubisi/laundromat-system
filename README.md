# 🧺 Laundromat Management System

A modern, mobile-friendly laundromat management system for students and administrators.

## ✨ Features

### For Students
- **📱 Drop-Off Form** - Submit laundry with photos
- **⚡ Quick Submit** - Fast submission with saved profiles
- **👤 Profile Management** - Save personal details
- **📦 Collection** - Easy laundry collection with reference number
- **📸 Camera Integration** - Take photos directly from mobile

### For Administrators
- **📋 Request Management** - View and manage all laundry requests
- **✅ Status Updates** - Update request status (Pending → In Progress → Completed → Collected)
- **💬 WhatsApp Notifications** - Send WhatsApp links to notify customers
- **📊 Collection Records** - Track all completed collections
- **🔄 Real-time Updates** - Auto-refresh dashboard

## 🚀 Live Demo

**Live URL**: [https://your-project.vercel.app](https://your-project.vercel.app)

### Test Credentials
- **Student**: Any student ID (e.g., `202057420`)
- **Admin**: Access via `/admin` route

## 📱 Mobile-Friendly

- Responsive design for all screen sizes
- Hamburger menu for mobile navigation
- Large touch targets for easy interaction
- Optimized for phone cameras

## 🛠️ Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- PostgreSQL (Supabase)
- Multer (file uploads)

### Deployment
- **Frontend & API**: Vercel
- **Database**: Supabase
- **Storage**: Supabase Storage

## 📦 Installation (Local Development)

### Prerequisites
- Node.js (v14+)
- MySQL or PostgreSQL
- npm or yarn

### Setup
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/laundromat-system.git
cd laundromat-system

# Install server dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create environment variables
cp env.production.example .env
# Edit .env with your database credentials

# Run database schema
# For MySQL: mysql -u root -p < database.sql
# For PostgreSQL: psql -U postgres -d laundromat < supabase-schema.sql

# Start development server
npm run dev

# In another terminal, start React app
cd frontend
npm start
```

Visit `http://localhost:3000` for frontend and `http://localhost:5000` for API.

## 🌐 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed deployment instructions to Vercel and Supabase.

## 📖 Usage

### Student Flow
1. **Create Profile** - Go to Profile page and save your details
2. **Submit Laundry** - Use Quick Submit with your student ID
3. **Get Reference** - Receive a unique reference number
4. **Collect** - Use reference number to collect your laundry

### Admin Flow
1. **View Requests** - See all laundry submissions
2. **Update Status** - Change status as laundry is processed
3. **Send Notifications** - Click WhatsApp button when laundry is ready
4. **Track Collections** - View collection records tab

## 🎨 Features in Detail

### Quick Submit
- Saves time with pre-filled profile data
- Reuse previously uploaded photos
- Mobile camera integration
- One-click submission

### Admin Dashboard
- Tab navigation (Requests / Collections)
- Color-coded status indicators
- WhatsApp integration
- Responsive tables

### Collection System
- Reference number verification
- Auto-fill customer details
- Digital signature
- Collection timestamp

## 🔒 Security
- Input validation
- SQL injection prevention
- Environment variables for sensitive data
- Secure file uploads

## 📊 Database Schema

### Tables
- `user_profiles` - Student profile information
- `saved_photos` - Reusable laundry photos
- `laundry_requests` - Laundry submissions and status
- Indexes for performance optimization

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License - feel free to use this project for your laundromat!

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- React.js community
- Tailwind CSS
- Vercel for hosting
- Supabase for database

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Email: your-email@example.com

---

Made with ❤️ for laundromat management
