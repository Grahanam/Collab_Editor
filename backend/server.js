require('dotenv').config()
const express=require('express')
const http = require('http');
const { Server } = require('socket.io');
const { WebsocketProvider } = require('y-websocket');
const { WebSocket }=require('ws');
const ywsUtils = require('y-websocket/bin/utils');
const setupWSConnection = ywsUtils.setupWSConnection;
const docs = ywsUtils.docs;
const Y = require('yjs');
const cors=require('cors')
const path=require('path')
const url=process.env.Url

const app=express()

const server = http.createServer(app);
const wss = new WebSocket.Server({server})


app.use(express.static(path.join(__dirname,'dist')))
app.use(cors())

const io = new Server(server,{
    cors:{
        origin:url,
        methods:['GET','POST']
    }
});

//frontend Static pages
app.get('*',(req,res)=>{
  res.sendFile(path.join(__dirname,'dist','index.html'))
})

const roomUsers = {};

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      console.log("Connected with socket id:" + socket.id + "  roomId:" + roomId + " user:" + username);
  
      // Initialize the room in the roomUsers object if it doesn't exist
      if (typeof roomUsers[roomId] === 'undefined') {
        console.log(`Initializing roomUsers for roomId: ${roomId}`);
        roomUsers[roomId] = [];
      }
  
      // Check if the user is already in the room to prevent duplicate entries
      const existingUser = roomUsers[roomId].find(user => user.username === username);
      if (!existingUser) {
        console.log(`Adding new user ${username} to room ${roomId}`);
        roomUsers[roomId].push({ id: socket.id, username ,status:true});
  
        // Notify other users in the room that a new user has joined
       socket.to(roomId).emit('user-joined', username);
        // socket.broadcast.to(roomId).emit('user-joined', username);
        console.log(`Notified other users in room ${roomId} of new user ${username}`);
      } else {
        for(user of roomUsers[roomId]){
          if(user['username']==username){
            user['id']=socket.id
            user.status=true
          }
        }
        socket.to(roomId).emit('useronline', {username,roomId});
        console.log(`User ${username} already in room ${roomId}, not re-adding or notifying.`);
      }
      console.log(JSON.stringify(roomUsers));
      let arr=roomUsers[roomId].map(user=>({username:user.username,status:user.status}))
      console.log(arr)
      //Broadcast the list of connected users to everyone in the room except him
      io.in(roomId).emit('connected-users', roomUsers[roomId].map(user => ({ username: user.username, status: user.status })));
  // send array of UserNames

    });

    socket.on('leave-room', ({ roomId, username }) => {
      socket.leave(roomId);
      console.log(`User  ${username}  left from Room: ${roomId}`);
      // Remove the user from the room list
      roomUsers[roomId] = roomUsers[roomId].filter(user => user.username !== username);
  
      // Notify other users in the room
      socket.to(roomId).emit('user-left', username);
  
      // Update the list of connected users in Current ROOM // Broadcasting not on all available rooms
      io.in(roomId).emit('connected-users', roomUsers[roomId].map(user => ({username:user.username,status:user.status})));
    });

  
    socket.on('disconnect', () => {
      let username,roomId
      console.log(socket.id)
      console.log(roomUsers)
      for(user in roomUsers){
        for(x of roomUsers[user]){
          console.log(x)
          if(x['id']==socket.id){
            username=x['username']
            roomId=user
          }
        }
      }
      console.log(username,roomId)
      socket.to(roomId).emit('useroffline', {username,roomId});
      for(user of roomUsers[roomId]){
        if(user.username==username){
          user.status=false
        }
      }
      io.in(roomId).emit('connected-users',roomUsers[roomId].map(user => ({username:user.username,status:user.status})));
      console.log('User disconnected');
    });
  });

  server.listen(3000, () => {
    console.log('Server running on 3000');
  });

  