var socket;
name = Cookies.get('name');
if(name == "undefined"){
  name = prompt("What is you name");
  Cookies.set('name', name, { expires: 365});
}

function windowResized() {
  resizeCanvas();
}

var chat;
var message;
var epilepsy = false;
var previous_message = '';

function setup () {
  socket = io("10.173.232.222:10001");
  // socket = io("jantschulev.ddns.net:10001");

  socket.emit('name', name)

  chat = document.getElementById('chat')
  message = document.getElementById('message');
  connectionInfo = document.getElementById('userCount');

  canvas = createCanvas(displayWidth, displayHeight);
  canvas.style('z-index:-1');
  canvas.position(0, 0);
  // background(255)

  socket.on('epilepsy', function (newEp) {
    epilepsy = newEp;
  });

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

  // noCanvas();
}

function draw() {
  if(epilepsy){
    // var col = color(random(255), random(255), random(255));
    // background(col);
    var grid = 40;
    for(x = 0; x <= width; x += grid){
      for(y = 0; y <= height; y += grid){
        noStroke();
        fill(random(255), random(255), random(255));
        rect(x, y, grid, grid);
      }
    }
  }else{
    background(0);
  }
}

function keyPressed (){
  if(keyCode == ENTER){
    sendMessage(message.value);
  }else if(keyCode == UP_ARROW){
    message.value = previous_message;
  }else if (keyCode == DOWN_ARROW) {
    message.value = "";
  }
}

function sendMessage(value) {
  var m = value;

  // if(checkSwear(m)){
  //   m = '<span class=\"swear\">I was just very immature, and swore in a group chat. I will never ever swear online, use inapropriate words or try to bully anyone.</span>';
  //   message.value = ""
  //   alert('Please do swear or bully!!!');
  // }

  if(m.substring(0, 1)== "!"){
    if(m == '!clear'){
      var password = prompt('Enter Password');
      m="Chat was cleared"
      socket.emit('clear', password);
      password = ''

      // pw_prompt({
      //     lm:"Please enter Password:",
      //     callback: function(p) {
      //         password = p;
      //         m="Chat was cleared";
      //         socket.emit('clear', password);
      //         password = '';
      //     }
      // });

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

      // pw_prompt({
      //     lm:"Please enter Password:",
      //     callback: function(password) {
      //         data = {
      //           p: password,
      //           mode: 'changeName' + newName
      //         }
      //         console.log("changeName request sent");
      //         socket.emit('requirePassword', data);
      //     }
      // });
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

      // pw_prompt({
      //     lm:"Please enter Password:",
      //     callback: function(password) {
      //         data = {
      //           p: password,
      //           n: user,
      //           kick: true
      //         }
      //         console.log(user + " was kicked off the chat");
      //         socket.emit('kick', data);
      //     }
      // });
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

      // var user = m.substring(9);
      // pw_prompt({
      //     lm:"Please enter Password:",
      //     callback: function(password) {
      //         data = {
      //           p: password,
      //           n: user,
      //           kick: false
      //         }
      //         console.log(user + " was restored");
      //         socket.emit('kick', data);
      //     }
      // });
    }

    if(m == "!help"){
      m = "<br><br> Help: <br> <table><li>!clear</li><li>!change name [new name]</li><li>!help</li><li>!kick [user]</li><li>!restore [user]</li><li>!epilepsy</li></table>"
      // m = "Help: <br> !clear ------------------- clears the chat, requires admin password <br> !change name [new name] -- changes name.<br> !help -------------------- bring up this help manual <br> !kick [user] ------------- kicks user off the chat, Requires Admin Password <br> !restore [user] ---------- restore kicked user. Requires Admin Password <br> !epilepsy ---------------- toggle epilepsy mode";
    }

    if(m == "!epilepsy"){
      if(epilepsy){
        epilepsy=false;
      }else{
        epilepsy=true;
      }
      socket.emit('epilepsy', epilepsy);
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

function checkSwear (m) {
  var swearWords = [];
  swearWords = ["5h1t", "5hit", "a55", "anal", "anus", "ar5e", "arrse", "arse", " ass", "ass-fucker", "asses", "assfucker", "assfukka", "asshole", "assholes", "asswhole", "a_s_s", "b!tch", "b00bs", "b17ch", "b1tch", "ballbag", "balls", "ballsack", "bastard", "beastial", "beastiality", "bellend", "bestial", "bestiality", "bi+ch", "biatch", "bitch", "bitcher", "bitchers", "bitches", "bitchin", "bitching", "bloody", "blow job", "blowjob", "blowjobs", "boiolas", "bollock", "bollok", "boner", "boob", "boobs", "booobs", "boooobs", "booooobs", "booooooobs", "breasts", "buceta", "bugger", "bum", "bunny fucker", "butt", "butthole", "buttmuch", "buttplug", "c0ck", "c0cksucker", "carpet muncher", "cawk", "chink", "cipa", "cl1t", "clit", "clitoris", "clits", "cnut", "cock", "cock-sucker", "cockface", "cockhead", "cockmunch", "cockmuncher", "cocks", "cocksuck", "cocksucked", "cocksucker", "cocksucking", "cocksucks", "cocksuka", "cocksukka", "cok", "cokmuncher", "coksucka", "coon", "cox", "crap", "cum", "cummer", "cumming", "cums", "cumshot", "cunilingus", "cunillingus", "cunnilingus", "cunt", "cuntlick", "cuntlicker", "cuntlicking", "cunts", "cyalis", "cyberfuc", "cyberfuck", "cyberfucked", "cyberfucker", "cyberfuckers", "cyberfucking", "d1ck", "damn", "dick", "dickhead", "dildo", "dildos", "dink", "dinks", "dirsa", "dlck", "dog-fucker", "doggin", "dogging", "donkeyribber", "doosh", "duche", "dyke", "ejaculate", "ejaculated", "ejaculates", "ejaculating", "ejaculatings", "ejaculation", "ejakulate", "f u c k", "f u c k e r", "f4nny", "fag", "fagging", "faggitt", "faggot", "faggs", "fagot", "fagots", "fags", "fanny", "fannyflaps", "fannyfucker", "fanyy", "fatass", "fcuk", "fcuker", "fcuking", "feck", "fecker", "felching", "fellate", "fellatio", "fingerfuck", "fingerfucked", "fingerfucker", "fingerfuckers", "fingerfucking", "fingerfucks", "fistfuck", "fistfucked", "fistfucker", "fistfuckers", "fistfucking", "fistfuckings", "fistfucks", "flange", "fook", "fooker", "fuck", "fucka", "fucked", "fucker", "fuckers", "fuckhead", "fuckheads", "fuckin", "fucking", "fuckings", "fuckingshitmotherfucker", "fuckme", "fucks", "fuckwhit", "fuckwit", "fudge packer", "fudgepacker", "fuk", "fuker", "fukker", "fukkin", "fuks", "fukwhit", "fukwit", "fux", "fux0r", "f_u_c_k", "gangbang", "gangbanged", "gangbangs", "gaylord", "gaysex", "goatse", "God", "god-dam", "god-damned", "goddamn", "goddamned", "hardcoresex", "heshe", "hoar", "hoare", "hoer", "homo", "hore", "horniest", "horny", "hotsex", "jack-off", "jackoff", "jap", "jerk-off", "jism", "jiz", "jizm", "jizz", "kawk", "knob", "knobead", "knobed", "knobend", "knobhead", "knobjocky", "knobjokey", "kock", "kondum", "kondums", "kum", "kummer", "kumming", "kums", "kunilingus", "l3i+ch", "l3itch", "labia", "lust", "lusting", "m0f0", "m0fo", "m45terbate", "ma5terb8", "ma5terbate", "masochist", "master-bate", "masterb8", "masterbat*", "masterbat3", "masterbate", "masterbation", "masterbations", "masturbate", "mo-fo", "mof0", "mofo", "mothafuck", "mothafucka", "mothafuckas", "mothafuckaz", "mothafucked", "mothafucker", "mothafuckers", "mothafuckin", "mothafucking", "mothafuckings", "mothafucks", "mother fucker", "motherfuck", "motherfucked", "motherfucker", "motherfuckers", "motherfuckin", "motherfucking", "motherfuckings", "motherfuckka", "motherfucks", "muff", "mutha", "muthafecker", "muthafuckker", "muther", "mutherfucker", "n1gga", "n1gger", "nazi", "nigg3r", "nigg4h", "nigga", "niggah", "niggas", "niggaz", "nigger", "niggers", "nob", "nob jokey", "nobhead", "nobjocky", "nobjokey", "numbnuts", "nutsack", "orgasim", "orgasims", "orgasm", "orgasms", "p0rn", "pawn", "pecker", "penis", "penisfucker", "phonesex", "phuck", "phuk", "phuked", "phuking", "phukked", "phukking", "phuks", "phuq", "pigfucker", "pimpis", "piss", "pissed", "pisser", "pissers", "pisses", "pissflaps", "pissin", "pissing", "pissoff", "poop", "porn", "porno", "pornography", "pornos", "prick", "pricks", "pron", "pube", "pusse", "pussi", "pussies", "pussy", "pussys", "rectum", "retard", "rimjaw", "rimming", "s hit", "s.o.b.", "sadist", "schlong", "screwing", "scroat", "scrote", "scrotum", "semen", "sex", "sh!+", "sh!t", "sh1t", "shag", "shagger", "shaggin", "shagging", "shemale", "shi+", "shit", "shitdick", "shite", "shited", "shitey", "shitfuck", "shitfull", "shithead", "shiting", "shitings", "shits", "shitted", "shitter", "shitters", "shitting", "shittings", "shitty", "skank", "slut", "sluts", "smegma", "smut", "snatch", "son-of-a-bitch", "spac", "spunk", "s_h_i_t", "t1tt1e5", "t1tties", "teets", "teez", "testical", "testicle", "tit", "titfuck", "tits", "titt", "tittie5", "tittiefucker", "titties", "tittyfuck", "tittywank", "titwank", "tosser", "turd", "tw4t", "twat", "twathead", "twatty", "twunt", "twunter", "v14gra", "v1gra", "vagina", "viagra", "vulva", "w00se", "wang", "wank", "wanker", "wanky", "whoar", "whore", "willies", "willy", "xrated", "xxx", 'fuck', 'shit', 'penis', 'dick', 'idiot', 'penner', "example_swear_word"];

  var suspect = m.toLowerCase();
  for (i = 0; i < swearWords.length; i ++){
    // var newSwearWord = swearWords[i]+' ';
    if(suspect.indexOf(swearWords[i]) !== -1){
      // alert(swearWords[i]);
      return true;
    }
  }
  return false;
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


function spam(key, message) {
  if(key==2482){
    for (var i = 0; i < 100 ; i++) {
      sendMessage(message)
    }
  }
}

var promptCount = 0;
window.pw_prompt = function(options) {
    var lm = options.lm || "Password:",
        bm = options.bm || "Submit";
    if(!options.callback) {
        alert("No callback function provided! Please provide one.")
    };

    var prompt = document.createElement("div");
    prompt.className = "pw_prompt";

    var submit = function() {
        options.callback(input.value);
        document.body.removeChild(prompt);
    };

    var label = document.createElement("label");
    label.textContent = lm;
    label.for = "pw_prompt_input" + (++promptCount);
    prompt.appendChild(label);

    var input = document.createElement("input");
    input.id = "pw_prompt_input" + (promptCount);
    input.type = "password";
    input.addEventListener("keyup", function(e) {
        if (e.keyCode == 13) submit();
    }, false);
    prompt.appendChild(input);
    document.body.appendChild(prompt);
};
