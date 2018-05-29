const http = require('http');
const app = require('./app');

const server = http.createServer(app);
const io = require('socket.io')(server);

io.on('connection', function(socket) {
  socket.on('newMessaegFromChat', function(msg) {
    io.emit('newMessaegFromChat', msg);
  });
});

server.listen(process.env.PORT, process.env.BIND_IP);