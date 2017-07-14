const PORT = 3001

var express = require('express');
var app = express();
var server = app.listen(PORT);
app.use(express.static('public'));

console.log("Kraken Chat server is running on port: "+PORT);

var socket = require('socket.io');
var io = socket(server);

var fs = require('fs')

var names = [];
var number_of_users = 0;

var password = '@kraken333'

var connectedUsers = '';
var connectedNames = '';

var chat = '';
fs.readFile('kraken_chat_log.txt', function (err, data) {
  if (err) {
    console.log("error while reading file" + err);
  } else {
    chat = ab2str(data);
  }
});

var kickedUsers = [];



io.sockets.on('connection',
  function(socket){


    socket.on('name',
      function(name){
        number_of_users++;
        names.push(name);

        connectedUsers = ''.concat('Connected users: ', number_of_users, '<br>', '<br>');
        connectedNames = ''.concat(name, '<br>', connectedNames);
        connectionInfo = ''.concat(connectedUsers, connectedNames);

        io.to(socket.id).emit('userCountChange', connectionInfo);
        socket.broadcast.emit('userCountChange', connectionInfo);
        io.to(socket.id).emit('name', chat);
      }
    );

    socket.on('chat',
      function (data) {
        for (i = 0; i < kickedUsers.length; i++){
          if(data.n==kickedUsers[i]){
            io.to(socket.id).emit('chat', "You have been kicked from the chat. Your message was not sent<br>");
            return
          }
        }
        chat = data.m + chat;
        socket.broadcast.emit('chat', data.m);
        io.to(socket.id).emit('chat', data.m);
        saveChat(chat)
      }
    );

    socket.on('clear', function(p){
      if(p == password){
        chat='';
        socket.broadcast.emit('name', chat);
        io.to(socket.id).emit('name', chat);
      }else{
        socket.broadcast.emit('authenticationFailed');
        io.to(socket.id).emit('authenticationFailed');
      }
    });

    socket.on('requirePassword', function (data) {
      if(data.p == password){
        information = {
          mode: data.mode,
          confirm: true
        }
        io.to(socket.id).emit('passwordConfirmation', information);
      }else{
        socket.broadcast.emit('authenticationFailed');
        io.to(socket.id).emit('authenticationFailed');
      }
    });

    socket.on('kick', function (data) {
      if(data.p == password){
        if(data.kick){
          for (i = 0; i < names.length; i++){
            if(data.n == names[i]){
              kickedUsers.push(names[i]);
            }
          }
        }else{
          for (i = 0; i < kickedUsers.length; i++){
            if(data.n == kickedUsers[i]){
              kickedUsers.splice(i, 1);
            }
          }
        }
      }else{
        socket.broadcast.emit('authenticationFailed');
        io.to(socket.id).emit('authenticationFailed');
      }
    });

    socket.on('disconnect',
      function(){

        names = [];
        number_of_users = 0;
        connectedUsers = '';
        connectedNames = '';

        socket.broadcast.emit('sendName');
      }
    );

  }

);



function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function saveChat(chat){
  fs.writeFile("kraken_chat_log.txt", chat, function(err) {
    if(err) {
        return console.log(err);
    }
  });
}


function formatAMPM() {
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0'+minutes : minutes;
  var strTime = hours + ':' + minutes + ampm;
  return strTime;
}
