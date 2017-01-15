var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = {};
var state = {};
var i = 0;
var admin = "null";
var totalTime = 0;
var ticker;
var gamePaused = false;
var gameStarted = false;

io.on('connection', function(socket){
	setAdmin(socket);

	updateState();

	socket.on('disconnect', function(){
		if (admin === socket.id){
			admin = "null";
		}
		updateState();
	});

	socket.on('add player', function(name){
		createNewPlayer(name, socket.id);
	});

	socket.on('next turn', function(){
		if (/*admin === socket.id &&*/ !state.paused && gameStarted){
			nextTurn();
		}
	});

	socket.on('start game', function(){
		if (admin === socket.id){
			startGame();
		}
	});

	socket.on('pause game', function(){
		if (admin === socket.id){
			togglePauseGame();
			io.emit('pause game');
		}
	});
});


function getPlayerFromId(id){
	for (var key in players) {
		if(players[key].id === id){
			return players[key];
		}
	}
}

function getPlayersLength(){
	return Object.keys(players).length;
}

function createNewPlayer(name, id) {
	if (admin === id){
		var player = {
			'id': i,
			'name': name,
			'myturn': false,
			'time': 0,
			'lastTime': 0
		};
		players[player.id] = player;

		updateState();
		i++;
	}
}


function updateState() {
	state = {
		'players': players,
		'spectators': getSpectators(),
		'turn': getTurn(),
		'totalTime': totalTime,
		'paused': gamePaused
	};

	io.emit('update state', state);
}

function getSpectators(){
	return Object.keys(io.sockets.sockets).length;
}


function getTurn() {
	for (var key in players) {
		if(players[key].myturn == true) {
			return players[key];
		}
	}
	return players[0];
}

function nextTurn() {

	var currPlayer = getTurn();
	currPlayer.myturn = false;
	currPlayer.time += currPlayer.lastTime;

	if ((currPlayer.id + 1) >= getPlayersLength()){
		players[0].myturn = true;
		players[0].lastTime = 0;
	} else {
		players[currPlayer.id+1].myturn = true;
		players[currPlayer.id+1].lastTime = 0;
	}
	updateState();
}

function setAdmin(socket) {
	if(admin == "null") {
		admin = socket.id;
		socket.emit('admin');
	}
}

function startGame() {
	if(!gameStarted) {
		gameStarted = true;
		players[0].myturn = true;
		updateState();
		ticker = setInterval(tick, 1000);
	}
}

function tick(){
	if(state.paused == false){
		players[state.turn.id].lastTime += 1;
		totalTime += 1;
		updateState();
	}
}


function togglePauseGame() {
	gamePaused = !gamePaused;
	updateState();
}







http.listen(8080, function() {
  console.log('listening on *:8080');
});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/clientside.js', function(req, res){
  res.sendFile(__dirname + '/clientside.js');
});

app.get('/style', function(req, res){
  res.sendFile(__dirname + '/style.css');
});