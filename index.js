var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var players = {};
var state = {};
var admin = "null";
var totalTime = 0;
var ticker;
var gamePaused = false;
var gameStarted = false;
var allAdmin = false;

io.on('connection', function (socket) {
	setAdmin(socket);
	updateState();

	socket.on('disconnect', function () {
		if (admin === socket.id) {
			admin = "null";
		}
		updateState();
	});

	socket.on('add player', function (name) {
		createNewPlayer(name, socket);
	});

	socket.on('next turn', function () {
		if (isAuthorized(socket) && !state.gamePaused && gameStarted) {
			nextTurn();
		}
	});

	socket.on('start game', function () {
		if (isAuthorized(socket))
			startGame();
	});

	socket.on('end game', function () {
		if (isAuthorized(socket))
			endGame();
	});

	socket.on('pause game', function () {
		if (isAuthorized(socket)) {
			togglePauseGame();
		}
	});

	socket.on('all admin', function () {
		if (admin === socket.id) {
			allAdmin = !allAdmin;
			updateState();
		}
	});
});

function isAuthorized(socket) {
	return allAdmin || admin == socket.id;
}

function getPlayerFromId(id) {
	for (var key in players) {
		if (players[key].id === id) {
			return players[key];
		}
	}
}

function getPlayersLength() {
	return Object.keys(players).length;
}

function createNewPlayer(name, socket) {
	if (isAuthorized(socket)) {
		var player = {
			'id': getPlayersLength(),
			'name': name,
			'myturn': false,
			'time': 0,
			'lastTime': 0
		};
		players[player.id] = player;

		updateState();
	}
}


function updateState() {
	state = {
		'players': players,
		'spectators': getSpectators(),
		'turn': getTurn(),
		'totalTime': totalTime,
		'gamePaused': gamePaused,
		'allAdmin': allAdmin,
		'admin': admin,
		'gameStarted': gameStarted,
	};

	io.emit('update state', state);
}

function getSpectators() {
	return Object.keys(io.sockets.sockets).length;
}


function getTurn() {
	for (var key in players) {
		if (players[key].myturn == true) {
			return players[key];
		}
	}
	return players[0];
}

function nextTurn() {

	var currPlayer = getTurn();
	currPlayer.myturn = false;
	currPlayer.time += currPlayer.lastTime;

	if ((currPlayer.id + 1) >= getPlayersLength()) {
		players[0].myturn = true;
		players[0].lastTime = 0;
	} else {
		players[currPlayer.id + 1].myturn = true;
		players[currPlayer.id + 1].lastTime = 0;
	}
	updateState();
}

function setAdmin(socket) {
	if (admin == "null" || isAuthorized(socket)) {
		if (admin == "null")
			admin = socket.id;

		socket.emit('admin', admin == socket.id);
	}
}

function startGame() {
	if (!gameStarted) {
		gameStarted = true;
		players[0].myturn = true;
		updateState();
		ticker = setInterval(tick, 1000);
	}
}

function endGame() {
	if (gameStarted) {
		gameStarted = false;
		players = {};
		totalTime = 0;
		i = 0;
		clearInterval(ticker);
		updateState();
	}
}

function tick() {
	if (state.gamePaused == false) {
		players[state.turn.id].lastTime += 1;
		totalTime += 1;
		updateState();
	}
}


function togglePauseGame() {
	if (gameStarted) {
		gamePaused = !gamePaused;
		updateState();
	}
}






var port = process.argv[2] || 8080;
http.listen(port, function () {
	console.log('listening on *:' + port);
});

app.get('/', function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/clientside.js', function (req, res) {
	res.sendFile(__dirname + '/clientside.js');
});

app.get('/style', function (req, res) {
	res.sendFile(__dirname + '/style.css');
});