var socket = io();
		
$(document).ready(function(){
	$(window).keyup(function(e){
		if (e.keyCode === 0 || e.keyCode === 32) {
			e.preventDefault();
			socket.emit("next turn");
	    } else if (e.keyCode === 27) {	    	
	    	socket.emit("pause game");
	    }
	});

	$('#add-player').click(function(){
		var name = $('#player-name').val();
		socket.emit("add player", name);
		$('#player-name').val('');
	});

	$('#start-game').click(function(){
		socket.emit("start game");
		$(this).hide();
	});
});

socket.on('update state', function(state){
	var html = "";
	for (var key in state.players) {
		var turnColor = "";
		if(state.turn && state.players[key].id == state.turn.id){
			turnColor = "background-color: rgb(103, 255, 103)";
		}

		var date = new Date(null);
		date.setSeconds(state.players[key].time);
		var timestamp = date.toISOString().substr(11, 8);

		var timeLast = state.players[key].lastTime;
		if (timeLast > 60){
			var minutes = Math.floor(timeLast / 60);
			var seconds = timeLast % 60;
			timeLast = minutes + "m " + seconds;
		}
		timeLast += "s ";

		html += '<div style="' + turnColor + '" class="player" id=' + state.players[key].id + '><div class="name">' + state.players[key].name + '</div><div class="timer">' + timestamp + '</div><div class="last-round">+ ' + timeLast + '</div></div>';
	}

	$('.amount').text(state.spectators);

	var date = new Date(null);
	date.setSeconds(state.totalTime);
	var totalTimestamp = date.toISOString().substr(11, 8);

	$('.total-game-time').text(totalTimestamp);
	$('.player-board').html(html);
	
});

socket.on('update timer', function(player){
	$('#'+player.id).text(player.timer);
});

socket.on('admin', function(){
	$('.admin-controls').toggle();
});


socket.on('pause game', function(){
	$('.pause-overlay').toggle();
});