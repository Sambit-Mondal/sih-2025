import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Configure CORS for both Express and Socket.IO
app.use(cors({
  origin: ["https://purecure-zeta.vercel.app", "https://sih-2025-server.vercel.app", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: ["https://purecure-zeta.vercel.app", "https://sih-2025-server.vercel.app", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"],
    methods: ["GET", "POST"],
    credentials: true
  },
  // Enhanced connection stability settings
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowUpgrades: true,
  transports: ['polling', 'websocket'],
  // Allow longer connection time
  connectTimeout: 45000
});

// Store connected users and their roles
const connectedUsers = new Map();
const userRoles = new Map();

// Store active calls
const activeCalls = new Map();

app.get('/', (req, res) => {
  res.json({ 
    message: 'PureCure WebRTC Signaling Server is running',
    status: 'active',
    connectedUsers: connectedUsers.size,
    activeCalls: activeCalls.size
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    connectedUsers: connectedUsers.size,
    activeCalls: activeCalls.size,
    timestamp: new Date().toISOString()
  });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Handle user joining (login)
  socket.on('join', (data) => {
    const { userId, userName, role } = data;
    
    // Check if user was previously connected (reconnection scenario)
    const existingUser = userRoles.get(userId);
    
    if (existingUser) {
      console.log(`🔄 User ${userId} (${role}) reconnected with new socket ${socket.id}`);
      
      // Update socket ID for existing user
      existingUser.socketId = socket.id;
      existingUser.userName = userName; // Update the user name
      connectedUsers.set(socket.id, { userId, userName, role, socketId: socket.id });
      
      // Check if they have any active calls
      const activeCall = Array.from(activeCalls.values()).find(call => 
        call.caller === userId || call.callee === userId
      );
      
      if (activeCall) {
        console.log(`🔗 Restoring active call for user ${userId}`);
        // Update the socket ID in the active call
        if (activeCall.caller === userId) {
          activeCall.callerSocket = socket.id;
        } else {
          activeCall.calleeSocket = socket.id;
        }
        
        // Rejoin the call room
        const callId = Array.from(activeCalls.keys()).find(id => activeCalls.get(id) === activeCall);
        if (callId) {
          socket.join(callId);
          console.log(`🎯 User ${userId} rejoined call room ${callId}`);
        }
      }
    } else {
      console.log(`✅ New user ${userId} (${role}) joined with socket ${socket.id}`);
      
      // Store user information
      connectedUsers.set(socket.id, { userId, userName, role, socketId: socket.id });
      userRoles.set(userId, { role, userName, socketId: socket.id });
    }
    
    // Join role-specific room
    socket.join(role);
    
    // Notify others in the same role about user status
    socket.to(role).emit('user-status', {
      userId,
      status: 'online',
      role
    });
    
    // Send confirmation to the user
    socket.emit('joined', { 
      userId, 
      role,
      message: 'Successfully connected to signaling server' 
    });
  });

  // Handle call initiation (patient starts call)
  socket.on('start-call', (data) => {
    const { to, from, callId } = data;
    const caller = connectedUsers.get(socket.id);
    
    if (!caller) {
      console.log(`❌ Caller not found for socket ${socket.id}`);
      socket.emit('error', { message: 'User not found' });
      return;
    }

    // Find the target user (doctor)
    const targetUser = userRoles.get(to);
    if (!targetUser) {
      console.log(`❌ Doctor ${to} not available. Available users:`, Array.from(userRoles.keys()));
      socket.emit('error', { message: 'Doctor not available' });
      return;
    }

    // Check if target socket is still connected
    const targetSocket = io.sockets.sockets.get(targetUser.socketId);
    if (!targetSocket) {
      console.log(`❌ Doctor socket ${targetUser.socketId} is disconnected`);
      socket.emit('error', { message: 'Doctor not available' });
      return;
    }

    // Store call information
    activeCalls.set(callId, {
      caller: from,
      callee: to,
      callerSocket: socket.id,
      calleeSocket: targetUser.socketId,
      status: 'ringing',
      startTime: Date.now()
    });

    console.log(`📞 Call initiated: ${from} -> ${to} (${callId})`);
    console.log(`   Caller socket: ${socket.id}`);
    console.log(`   Doctor socket: ${targetUser.socketId}`);

    // Send incoming call notification to the doctor
    io.to(targetUser.socketId).emit('incoming-call', {
      from,
      fromName: caller.userName || caller.userId, // Use userName if available, fallback to userId
      callId
    });

    console.log(`✅ Sent incoming-call to socket ${targetUser.socketId}`);

    // Confirm call initiated to patient
    socket.emit('call-initiated', { callId, to });
  });

  // Handle call acceptance (doctor accepts)
  socket.on('accept-call', (data) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { callId, to } = data;
    const call = activeCalls.get(callId);
    
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    // Update call status
    call.status = 'accepted';
    call.acceptTime = Date.now();

    console.log(`Call accepted: ${callId}`);

    // Notify the patient that call was accepted
    io.to(call.callerSocket).emit('call-accepted', { callId });
    
    // Join both users to a call room for WebRTC signaling
    socket.join(callId);
    io.sockets.sockets.get(call.callerSocket)?.join(callId);
  });

  // Handle call rejection (doctor rejects)
  socket.on('reject-call', (data) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { callId, to } = data;
    const call = activeCalls.get(callId);
    
    if (!call) {
      socket.emit('error', { message: 'Call not found' });
      return;
    }

    console.log(`Call rejected: ${callId}`);

    // Notify the patient that call was rejected
    io.to(call.callerSocket).emit('call-rejected', { callId });
    
    // Remove call from active calls
    activeCalls.delete(callId);
  });

  // Handle WebRTC offer
  socket.on('offer', (offer) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Find active call for this user
      const activeCall = Array.from(activeCalls.values()).find(call => 
        call.callerSocket === socket.id || call.calleeSocket === socket.id
      );
      
      if (activeCall) {
        const targetSocket = activeCall.callerSocket === socket.id 
          ? activeCall.calleeSocket 
          : activeCall.callerSocket;
        
        console.log(`Forwarding offer from ${socket.id} to ${targetSocket}`);
        io.to(targetSocket).emit('offer', offer);
      }
    }
  });

  // Handle WebRTC answer
  socket.on('answer', (answer) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Find active call for this user
      const activeCall = Array.from(activeCalls.values()).find(call => 
        call.callerSocket === socket.id || call.calleeSocket === socket.id
      );
      
      if (activeCall) {
        const targetSocket = activeCall.callerSocket === socket.id 
          ? activeCall.calleeSocket 
          : activeCall.callerSocket;
        
        console.log(`Forwarding answer from ${socket.id} to ${targetSocket}`);
        io.to(targetSocket).emit('answer', answer);
      }
    }
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (candidate) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Find active call for this user
      const activeCall = Array.from(activeCalls.values()).find(call => 
        call.callerSocket === socket.id || call.calleeSocket === socket.id
      );
      
      if (activeCall) {
        const targetSocket = activeCall.callerSocket === socket.id 
          ? activeCall.calleeSocket 
          : activeCall.callerSocket;
        
        console.log(`Forwarding ICE candidate from ${socket.id} to ${targetSocket}`);
        io.to(targetSocket).emit('ice-candidate', candidate);
      }
    }
  });

  // Handle call termination
  socket.on('end-call', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      // Find and end active call for this user
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const activeCall = Array.from(activeCalls.entries()).find(([callId, call]) => 
        call.callerSocket === socket.id || call.calleeSocket === socket.id
      );
      
      if (activeCall) {
        const [callId, call] = activeCall;
        const targetSocket = call.callerSocket === socket.id 
          ? call.calleeSocket 
          : call.callerSocket;
        
        console.log(`Call ended: ${callId}`);
        
        // Notify the other user
        io.to(targetSocket).emit('call-ended');
        
        // Remove users from call room
        socket.leave(callId);
        io.sockets.sockets.get(targetSocket)?.leave(callId);
        
        // Remove call from active calls
        activeCalls.delete(callId);
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    const user = connectedUsers.get(socket.id);
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    if (user) {
      const { userId, role } = user;
      
      console.log(`User ${userId} (${role}) disconnected: ${reason}`);
      
      // Don't immediately remove user - give them time to reconnect
      setTimeout(() => {
        // Check if they reconnected with a different socket
        const currentUser = userRoles.get(userId);
        if (!currentUser || currentUser.socketId === socket.id) {
          // They didn't reconnect, clean up
          console.log(`🧹 Cleaning up user ${userId} after disconnect timeout`);
          connectedUsers.delete(socket.id);
          userRoles.delete(userId);
          
          // Notify others in the same role about user status
          socket.to(role).emit('user-status', {
            userId,
            status: 'offline',
            role
          });
        } else {
          console.log(`✅ User ${userId} already reconnected with socket ${currentUser.socketId}`);
        }
      }, 5000); // Give 5 seconds to reconnect
      
      // Handle active calls - don't end them immediately
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const activeCall = Array.from(activeCalls.entries()).find(([callId, call]) => 
        call.callerSocket === socket.id || call.calleeSocket === socket.id
      );
      
      if (activeCall) {
        const [callId, call] = activeCall;
        console.log(`📞 User in active call ${callId} disconnected, keeping call alive for reconnection`);
        
        // Give them time to reconnect before ending the call
        setTimeout(() => {
          if (activeCalls.has(callId)) {
            const targetSocket = call.callerSocket === socket.id 
              ? call.calleeSocket 
              : call.callerSocket;
            
            console.log(`❌ Ending call ${callId} due to disconnection timeout`);
            
            // Notify the other user
            io.to(targetSocket).emit('call-ended');
            
            // Remove call from active calls
            activeCalls.delete(callId);
          } else {
            console.log(`✅ Call ${callId} was already handled`);
          }
        }, 15000); // Give 15 seconds for call reconnection
      }
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 PureCure Signaling Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 CORS enabled for: http://localhost:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});