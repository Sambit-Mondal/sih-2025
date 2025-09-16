# PureCure Signaling Server

A WebRTC signaling server for the PureCure video conferencing platform.

## Features

- **Real-time WebRTC signaling** using Socket.IO
- **User management** with role-based routing (patient/doctor)
- **Call management** (initiate, accept, reject, end)
- **ICE candidate exchange** for peer connection
- **Health monitoring** endpoints
- **Graceful shutdown** handling

## Installation

```bash
npm install
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## API Endpoints

- `GET /` - Server status and statistics
- `GET /health` - Health check endpoint

## Socket Events

### Client to Server
- `join` - User joins with role (patient/doctor)
- `start-call` - Patient initiates a call to a doctor
- `accept-call` - Doctor accepts an incoming call
- `reject-call` - Doctor rejects an incoming call
- `offer` - WebRTC offer
- `answer` - WebRTC answer
- `ice-candidate` - ICE candidate for connection
- `end-call` - End the current call

### Server to Client
- `joined` - Confirmation of successful join
- `incoming-call` - Notification of incoming call (to doctor)
- `call-accepted` - Call was accepted by doctor
- `call-rejected` - Call was rejected by doctor
- `offer` - WebRTC offer forwarded
- `answer` - WebRTC answer forwarded
- `ice-candidate` - ICE candidate forwarded
- `call-ended` - Call was terminated
- `user-status` - User online/offline status
- `error` - Error messages

## Production Deployment

For production deployment, consider:

1. **Environment Variables**:
   - `PORT` - Server port (default: 3001)
   - `NODE_ENV` - Environment (production/development)

2. **CORS Configuration**: Update allowed origins in server.js

3. **HTTPS**: Use SSL certificates for secure connections

4. **Process Management**: Use PM2 or similar for process management

5. **Load Balancing**: Use clustering for high availability

6. **Monitoring**: Add logging and monitoring solutions

## Security Considerations

- CORS is configured for development (localhost:3000)
- In production, update CORS origins to match your domain
- Consider rate limiting for call initiation
- Implement proper authentication if needed
- Use HTTPS in production for secure WebRTC connections