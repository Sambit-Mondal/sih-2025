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
- **WebRTC**: Direct peer-to-peer video communication with cross-network support
- **Socket.IO**: Real-time signaling server
- **STUN/TURN Servers**: Enhanced NAT traversal with multiple reliable servers
- **Cross-Network Connectivity**: Works across different networks and firewalls
- **ICE Connection Recovery**: Automatic connection recovery and restart mechanisms
- **Connection Diagnostics**: Built-in network connectivity testing
- **Error Handling**: Comprehensive error management and logging
- **Production Ready**: Optimized for deployment with robust configuration

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

## 🔧 Troubleshooting

### Cross-Network Connectivity Issues

If video calls work on the same network but fail across different networks:

#### Quick Test
1. Open `test-webrtc.html` in your browser
2. Click "Test Network Connectivity" to check STUN/TURN servers
3. Look for ICE candidates in the logs - you should see both `host` and `relay` candidates

#### Common Issues and Solutions

**Issue: ICE connection fails (checking → failed)**
```bash
# Solution: Verify TURN servers are accessible
# Check the browser console for detailed error messages
# Ensure firewall allows WebRTC traffic on required ports
```

**Issue: Only host candidates found**
- **Cause**: TURN servers not accessible or incorrectly configured
- **Solution**: Update `.env` with custom TURN servers if default ones fail
- **Test**: Use the connectivity test to verify TURN server access

**Issue: Connection works locally but fails remotely**
- **Cause**: NAT/Firewall blocking TURN server traffic
- **Solution**: 
  1. Use TURN servers with TCP fallback (port 443)
  2. Configure firewall to allow WebRTC traffic
  3. Test with different TURN server providers

#### Environment Configuration

Create a `.env.local` file for custom STUN/TURN servers:

```env
# Custom STUN/TURN Configuration (optional)
NEXT_PUBLIC_STUN_SERVER_1=stun:your-stun-server.com:3478
NEXT_PUBLIC_TURN_SERVER_1=turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME_1=your-username
NEXT_PUBLIC_TURN_PASSWORD_1=your-password

NEXT_PUBLIC_TURN_SERVER_2=turns:your-turn-server.com:5349
NEXT_PUBLIC_TURN_USERNAME_2=your-username  
NEXT_PUBLIC_TURN_PASSWORD_2=your-password
```

#### Network Requirements

**Ports needed for WebRTC:**
- **UDP 1024-65535**: For ICE/STUN/TURN traffic
- **TCP 443**: For TURN over TLS
- **TCP 80**: For TURN over HTTP

**Firewall Configuration:**
```bash
# Allow WebRTC traffic (example for Ubuntu/Debian)
sudo ufw allow 1024:65535/udp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

#### Advanced Debugging

**Enable detailed WebRTC logs:**
1. Open Chrome DevTools
2. Go to chrome://webrtc-internals
3. Monitor connection attempts and ICE gathering

**Log Analysis:**
- `host` candidates: Local network addresses
- `srflx` candidates: Server reflexive (via STUN)
- `relay` candidates: Relayed through TURN server

**Connection Success Indicators:**
```
✅ ICE gathering: complete
✅ ICE connection: connected
✅ Connection state: connected
✅ Multiple candidate types found
```

#### Performance Optimization

**For better cross-network performance:**
- Use multiple TURN servers for redundancy
- Prefer TURN servers geographically close to users
- Enable TCP fallback for restrictive networks
- Monitor connection quality and implement fallback logic

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
