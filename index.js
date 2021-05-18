require('dotenv').config();
const Users = require('./users')();
const Rooms = require('./rooms')();

const express = require('express');

const app = express();
const http = require('http');

const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
    transports: ['websocket', 'polling'],
    credentials: true
  },
  allowEIO3: true
});

const PORT = process.env.PORT;

app.get('/', function(req, res) {
})

const message = (name, text, id) => (
  {
    name, 
    text, 
    id
  }
);

io.on('connection', socket => {
  console.log('connected');

  socket.emit('updateRooms', Rooms.getRooms());

  socket.on('userJoined', (data, cb) => {
    if (!data.username) {
      return cb('Введите Ваше имя!');
    }
    else if (!data.room) {
      return cb('Введите название новой комнаты или выберите из существующих!');
    }

    socket.join(data.room);

    Users.addUser({
      id: socket.id,
      username: data.username,
      room: data.room
    })

    const index = Rooms.findRoom(data.room);
    if (index === -1) {
      Rooms.addRoom(data.room);
    }

    cb({userID: socket.id});
    
    io.to(data.room).emit('updateUsers', Users.getByRoom(data.room));
    socket.emit('newMessage', message('admin', `Добро пожаловать, ${data.username}!`));
    socket.broadcast
      .to(data.room)
      .emit('newMessage', message('admin', `Пользователь ${data.username} присоединился...`));
  })

  socket.on('createMessage', (data, cb) => {
    if (!data.text) {
      return cb('Введите сообщение!');
    }

    const user = Users.getUser(data.id);
    if (user) {
      io.to(user.room).emit('newMessage', message(user.username, data.text, data.id));
    }
    cb();
  })

  socket.on('userLeft', (id, cb) => {
    const user = Users.removeUser(id);
    if (user) {
      io.to(user.room).emit('updateUsers', Users.getByRoom(user.room));
      io.to(user.room).emit('newMessage', message('admin', `Пользователь ${user.username} покинул чат...`));
    }
    cb();
  })

  //если пользователь закрыл вкладку
  socket.on('disconnect', () => {
    const user = Users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('updateUsers', Users.getByRoom(user.room));
      io.to(user.room).emit('newMessage', message('admin', `Пользователь ${user.username} покинул чат...`));
    }
  });
});

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));
