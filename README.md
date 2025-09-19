# Nivaaz+ - 1:1 Video Conferencing Platform

A production-ready video conferencing platform built with Next.js 15, TypeScript, WebRTC, and Socket.IO for secure healthcare consultations between patients and doctors.

## 🚀 Features

### Core Features
- **Secure Authentication**: Separate login systems for patients and doctors
- **Real-time Video Calls**: Production-optimized WebRTC implementation
- **Role-based Dashboards**: Tailored interfaces for patients and doctors
- **Call Management**: Start, accept, reject, and end calls
- **Media Controls**: Toggle audio/video, mute functionality
- **Connection Status**: Real-time connection monitoring
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **WebRTC**: Direct peer-to-peer video communication
- **Socket.IO**: Real-time signaling server
- **STUN Servers**: NAT traversal support
- **Error Handling**: Comprehensive error management
- **Production Ready**: Optimized for deployment

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
├─────────────────────┬───────────────────┬───────────────────┤
│   Patient Portal    │   Doctor Portal   │   Video Call UI   │
├─────────────────────┴───────────────────┴───────────────────┤
│                  WebRTC Hook & Context                     │
├─────────────────────────────────────────────────────────────┤
│                    Socket.IO Client                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                Socket.IO Signaling Server                  │
├─────────────────────────────────────────────────────────────┤
│          WebRTC Signaling & Room Management               │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
sih-2025/
├── app/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication context
│   ├── hooks/
│   │   └── useWebRTC.ts            # WebRTC functionality
│   ├── login/
│   │   ├── patient/page.tsx        # Patient login
│   │   └── doctor/page.tsx         # Doctor login
│   ├── patient/
│   │   └── dashboard/page.tsx      # Patient dashboard
│   ├── doctor/
│   │   └── dashboard/page.tsx      # Doctor dashboard
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page
│   └── globals.css                 # Global styles
├── signaling-server/
│   ├── server.js                   # Socket.IO signaling server
│   ├── package.json               # Server dependencies
│   └── README.md                  # Server documentation
├── public/                        # Static assets
├── package.json                   # Frontend dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── .env.local                    # Environment variables
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn

### 1. Install Frontend Dependencies
```bash
npm install
```

### 2. Install Signaling Server Dependencies
```bash
cd signaling-server
npm install
```

### 3. Start the Signaling Server
```bash
# In signaling-server directory
npm start
```

### 4. Start the Frontend
```bash
# In root directory
npm run dev
```

### 5. Access the Application
- **Homepage**: http://localhost:3000
- **Signaling Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 👥 Usage

### For Patients
1. Visit http://localhost:3000
2. Click "Login as Patient"
3. Use demo credentials:
   - Email: `patient1@example.com`
   - Password: `password123`
4. View available doctors
5. Click "Start Video Call" to initiate a call

### For Doctors
1. Visit http://localhost:3000
2. Click "Login as Doctor"  
3. Use demo credentials:
   - Email: `doctor1@example.com`
   - Password: `password123`
4. Wait for incoming calls from patients
5. Accept or reject calls as needed

## 🎨 Key Components

### Authentication System
- Role-based login for patients and doctors
- Persistent sessions with localStorage
- Automatic route protection and redirection

### Patient Dashboard
- View available doctors with real-time status
- Initiate video calls with one click
- Monitor connection status
- Full-screen video interface with controls

### Doctor Dashboard  
- Receive incoming call notifications
- Accept/reject patient calls
- View patient statistics and appointments
- Professional interface optimized for healthcare providers

### Video Call Features
- HD video quality with WebRTC optimization
- Picture-in-picture local video
- Audio/video toggle controls
- Connection state monitoring
- Graceful call termination

## 🚀 Production Deployment

### Frontend
Deploy the Next.js app to Vercel, Netlify, or any hosting platform:
```bash
npm run build
npm start
```

### Signaling Server
Deploy to Railway, Heroku, or VPS:
```bash
cd signaling-server
npm start
```

### Environment Configuration
Update `.env.local` for production:
```bash
NEXT_PUBLIC_SOCKET_URL=wss://your-signaling-server.com
```

### SSL Requirements
- HTTPS is required for WebRTC in production
- Use Let's Encrypt for free SSL certificates
- Configure proper CORS origins for your domain

## 🔧 Technical Details

### WebRTC Implementation
- **Cross-Network Connectivity**: Enhanced STUN/TURN server configuration for connections across different networks
- **Multiple STUN Servers**: Google, Ekiga, Twilio, and other reliable STUN servers for NAT discovery
- **TURN Server Support**: Free TURN servers included for NAT relay when direct connection fails
- **Custom Server Configuration**: Environment variables for custom STUN/TURN servers
- **ICE Restart**: Automatic ICE restart on connection failure for better reliability
- **Connection Diagnostics**: Built-in connectivity testing function for troubleshooting
- **Enhanced ICE Handling**: Robust ICE candidate queueing and processing
- **Data Channel**: Additional connectivity testing via WebRTC data channels
- **Bundle Policy**: Optimized media bundling for better performance
- **Connection Monitoring**: Real-time monitoring of ICE and connection states

### Security Features  
- Mock authentication (replace with real auth)
- Encrypted peer-to-peer communication
- Secure WebSocket signaling
- No video data stored on servers

### Performance Optimizations
- Efficient codec selection
- Connection quality monitoring
- Automatic reconnection logic
- Responsive design with Tailwind CSS

## 🧪 Testing

### Demo Credentials
**Patients:**
- patient1@example.com / password123
- patient2@example.com / password123  
- patient3@example.com / password123

**Doctors:**
- doctor1@example.com / password123
- doctor2@example.com / password123
- doctor3@example.com / password123

### Browser Support
- Chrome (recommended)
- Firefox
- Safari (with limitations)
- Edge
- Mobile browsers

## 📱 Mobile Support

The platform is fully responsive and supports:
- Mobile web browsers
- Touch-friendly controls
- Adaptive video layouts
- Optimized for healthcare consultations on-the-go

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your healthcare applications.

---

Built with ❤️ for secure healthcare communications
