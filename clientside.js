var socket = io();

$(document).ready(function () {
	$(window).keyup(function (e) {
		if (e.keyCode === 0 || e.keyCode === 32) {
			e.preventDefault();
			socket.emit("next turn");
		} else if (e.keyCode === 27) {
			socket.emit("pause game");
		}
	});

	$('#add-player').click(function () {
		var name = $('#player-name').val();
		socket.emit("add player", name);
		$('#player-name').val('');
	});

	$('#start-game').click(function () {
		socket.emit("start game");
	});

	$('#end-game').click(function () {
		socket.emit("end game");
	});

	$('#all-admin').click(function () {
		socket.emit("all admin");
	});
});

socket.on('update state', function (state) {
	var html = "";
	for (var key in state.players) {
		var myTurn = state.turn && state.players[key].id == state.turn.id;

		var date = new Date(null);
		date.setSeconds(state.players[key].time);
		var timestamp = date.toISOString().substr(11, 8);

		var timeLast = state.players[key].lastTime;
		if (timeLast > 60) {
			var minutes = Math.floor(timeLast / 60);
			var seconds = timeLast % 60;
			timeLast = minutes + "m " + seconds;
		}
		timeLast += "s ";

		html += '<div class="' + (myTurn ? "my-turn " : "") + 'player" id=' + state.players[key].id + '><div class="name">' + state.players[key].name + '</div><div class="timer">' + timestamp + '</div><div class="last-round">+ ' + timeLast + '</div></div>';
	}

	var isRealAdmin = socket.id == state.admin;
	$('.admin-controls').toggle(state.allAdmin || isRealAdmin);

	$('#all-admin').text('All admin: ' + state.allAdmin);
	$('#all-admin').prop('disabled', !isRealAdmin);
	$('#start-game').toggle(!state.gameStarted);
	$('#end-game').toggle(state.gameStarted);
	$('.pause-overlay').toggle(state.gamePaused);

	$('.amount').text(state.spectators);

	var date = new Date(null);
	date.setSeconds(state.totalTime);
	var totalTimestamp = date.toISOString().substr(11, 8);

	$('.total-game-time').text(totalTimestamp);
	$('.player-board').html(html);

});

socket.on('update timer', function (player) {
	$('#' + player.id).text(player.timer);
});

socket.on('admin', function (isAdmin) {
	$('.admin-controls').toggle(isAdmin);
});
