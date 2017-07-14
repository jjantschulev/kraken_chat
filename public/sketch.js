var socket;
name = Cookies.get('name');
if(name == "undefined"){
  name = prompt("What is you name");
  Cookies.set('name', name, { expires: 365});
}


var chat;
var message;
var epilepsy = false;
var previous_message = '';

// socket = io("10.173.232.222:3001");
socket = io("jantschulev.ddns.net:3001");
// socket = io("localhost:3001");

socket.emit('name', name)

chat = document.getElementById('chat')
message = document.getElementById('message');
connectionInfo = document.getElementById('userCount');

socket.on('userCountChange', function(string){
  connectionInfo.innerHTML = string;
});

socket.on('sendName', function(){socket.emit('name', name)});

socket.on('name',
  function (wholeChat){
    chat.innerHTML = wholeChat;
  }
);

socket.on('chat',
  function (newText) {
    chat.innerHTML = ''.concat(newText, chat.innerHTML);
  }
);

socket.on('authenticationFailed', function(){
  message.value = "Password authentication <span style=\"color:red\">FAILED!</span>. What ever you tried to do, Did NOT work";
  sendMessage(message.value);
});

socket.on('passwordConfirmation', function (data) {
  console.log("recieved");
  console.log(data.confirm);
  if(data.confirm){
    console.log("recieved and cinfirmed");
    if(data.mode.indexOf('changeName') == 0){

      var newName = data.mode.substring(10);
      var mes = "".concat('<span class=\"swear\">', name, " changed their name to: ", newName, '</span>');
      name = newName;
      Cookies.set('name', newName, { expires: 365});
      message.value = mes;
      sendMessage(message.value);
      location.reload(true);
      console.log("name change sucessful");
    }
  }
});

window.addEventListener("keyup", function () {
  if (event.which == 13) {
    sendMessage(message.value);
  }
  if (event.which == 38) {
    message.value = previous_message;
  }
});

function sendMessage(value) {
  var m = value;

  if(m.substring(0, 1)== "!"){
    if(m == '!clear'){
      var password = prompt('Enter Password');
      m="Chat was cleared"
      socket.emit('clear', password);
      password = ''
    }

    if(m.indexOf('!change name') == 0){
      var newName = m.substring(13)

      var password = prompt('Enter Password')
      data = {
        p: password,
        mode: 'changeName' + newName
      }
      password = '';

      socket.emit('requirePassword', data);
    }

    if(m.indexOf('!kick') == 0){
      var user = m.substring(6);

      var password = prompt('Enter Password');
      data = {
        p: password,
        n: user,
        kick: true
      }
      m = user+' was kicked off the chat'
      socket.emit('kick', data);
      password = '';
    }
    if(m.indexOf('!restore') == 0){
      var user = m.substring(9);

      var password = prompt('Enter Password');
      data = {
        p: password,
        n: user,
        kick: false
      }
      m = user+' was restored'
      socket.emit('kick', data);
      password = '';
    }

    if(m == "!help"){
      m = "<br><br> Help: <br> <table><li>!clear</li><li>!change name [new name]</li><li>!help</li><li>!kick [user]</li><li>!restore [user]</li></table>"
    }




  }

  if(m.length >0){
    previous_message = message.value;
    var time = formatAMPM();
    var messageToSend = "".concat("$", "<span class=\"name\">", name, "</span>", "<span class=\"time\"> @", time, "</span>", ":  ", m, "<br>", "<br>");
    data = {
      n: name,
      m: messageToSend
    }
    socket.emit('chat', data);
    message.value = ""
  }
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
