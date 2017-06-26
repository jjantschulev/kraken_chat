var express = require('express');
var app = express();
var server = app.listen(10001);
app.use(express.static('public'));

console.log("Kraken Chat server is running on port: 10001");

var socket = require('socket.io');
var io = socket(server);

var fs = require('fs')

var names = [];
var number_of_users = 0;

var password = 'kraken'

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
    console.log("New user connected: " + number_of_users + " online users.");


    socket.on('name',
      function(name){
        number_of_users++;
        names.push(name);
        console.log(names);
        console.log('');

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
          if(data.n.toLowerCase()==kickedUsers[i]){
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

    socket.on('epilepsy', function (newEp) {
      socket.broadcast.emit('epilepsy', newEp);
    });

    socket.on('clear', function(p){
      if(p == password){
        chat='';
        socket.broadcast.emit('name', chat);
        io.to(socket.id).emit('name', chat);
      }else{
        io.to(socket.id).emit('authenticationFailed');
      }
    });

    socket.on('requirePassword', function (data) {
      if(data.p == password){
        console.log('Password match');
        information = {
          mode: data.mode,
          confirm: true
        }
        console.log(information.mode + " \n" + information.confirm);
        io.to(socket.id).emit('passwordConfirmation', information);
      }else{
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

        console.log("Users Connected: " + number_of_users);
        console.log(names);
        console.log('');
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
    console.log("The file was saved!");
  });
}




// KRAKEN _ BOT


function kraken_response(output) {
  console.log(output);
}

function calculate_response(input) {
  var spawn = require('child_process').spawn,
      py    = spawn('python', ['compute_response.py']),
      data = input,
      dataString = '';

  py.stdout.on('data', function(data){
    dataString = data.toString();
  });
  py.stdout.on('end', function(){
    kraken_response(dataString);
  });
  py.stdin.write(JSON.stringify(data));
  py.stdin.end();

}
