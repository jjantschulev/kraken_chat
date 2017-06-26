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


// kraken_bot

    socket.on('kraken_bot', function (input) {
      var spawn = require('child_process').spawn,
          py    = spawn('python', ['compute_response.py']),
          data = input,
          dataString = '';

      py.stdout.on('data', function(data){
        dataString = data.toString();
      });
      py.stdout.on('end', function(){
        //Do code here
        console.log("@kraken ----> "+dataString);
        var time = "".concat("<span style=\"color:rgb(0, 123, 255)\"> @", formatAMPM(), "</span>: ");
        var user = "<span style=\"color:rgb(0,255,255)\">  @kraken  </span>"
        var message = "".concat(dataString, "<br><br>");
        var result = "".concat(user, time, message);
        chat = result + chat;
        socket.broadcast.emit('chat', result);
        io.to(socket.id).emit('chat', result);
        saveChat(chat)
      });
      py.stdin.write(JSON.stringify(data));
      py.stdin.end();
    });


// End kraken_bot

    socket.on('epilepsy', function (newEp) {
      socket.broadcast.emit('epilepsy', newEp);
    });

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
        console.log('Password match');
        information = {
          mode: data.mode,
          confirm: true
        }
        console.log(information.mode + " \n" + information.confirm);
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
