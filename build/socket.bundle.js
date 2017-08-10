'use strict';

$(function () {
	var packet = {};
	var store = {
		isLoggedIn: false,
		emoji: [],
		streamState: 'streaming',
		user: {
			username: ''
		}

		//Account state
	};var accountState = function accountState() {
		if (store.isLoggedIn === true) {
			$('.v-hide').addClass('hide');
			$('.v-loggedIn').removeClass('hide');
		}
		if (store.isLoggedIn === false) {
			$('.v-hide').addClass('hide');
			$('.v-loggedOut').removeClass('hide');
		}
	};

	//Emoji
	var emojiInitiate = function emojiInitiate() {
		$(function () {
			$('.js-emoji.emoji--click').click(function (e) {
				var em = $(e.target).data("emoji");
				var m = $('.js-m').val();
				m = m + ' :' + em + ' ';
				$('.js-m').val(m);
				$('.js-m').focus();
			});
		});
	};

	var emoji = function emoji(_emoji, emojiStore) {
		$('.js-emoji-store').empty();
		emojiStore.forEach(function (x) {
			var val = x.val;
			var reason = x.reason;
			var src = 'emoji/' + val + '.png';
			var img = $('<img>').attr({ 'src': src, 'data-toggle': 'tooltip', 'data-emoji': val }).addClass('js-emoji emoji--thumb');
			if (_emoji.filter(function (x) {
				return x === val;
			}).length === 1) {
				img.addClass('emoji--click').attr('title', reason);
			}
			$('.js-emoji-store').append(img);
		});
		emojiInitiate();
	};

	//Functions

	var getQueryVariable = function getQueryVariable(variable) {
		var query = window.location.search.substring(1);
		var vars = query.split("&");
		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split("=");
			if (pair[0] === variable) {
				return pair[1];
			}
		}
		return false;
	};

	var setCookie = function setCookie(name, value) {
		var days = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 7;
		var path = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : '/';

		var expires = new Date(Date.now() + days * 864e5).toGMTString();
		document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path;
	};

	var getCookie = function getCookie(name) {
		return document.cookie.split('; ').reduce(function (r, v) {
			var parts = v.split('=');
			return parts[0] === name ? decodeURIComponent(parts[1]) : r;
		}, '');
	};

	var deleteCookie = function deleteCookie(name, path) {
		setCookie(name, '', -1, path);
	};

	//Listeners

	var socket = io().connect();
	socket.on('connect', function () {
		var token = getCookie('token');
		if (token !== 'undefined') {
			socket.emit('authenticate', token);
		}
		console.log('connected');
		socket.emit('connected');
	});

	socket.on('initiate', function (packet) {
		console.log('initiated');
		syncVideo(packet.videoStore, 'initiate');
	});

	socket.on('premiere', function (packet) {
		premiereVideo(packet.premiereStart);
		syncVideo(packet.videoStore, packet.option);
		setRepetition(function (i) {
			var li = $('<li>');
			var ntf = 'l--notification';
			var sec = 4 - i;
			var msg = '';
			if (sec !== 0) {
				msg = '<span>Premiere in ' + sec + '</span>';
			} else {
				msg = '<span>Premiere Now!</span>';
			}
			li.addClass(ntf).html(msg);
			$('.js-messages').append(li);
		}, 1000, 4);
		$('.js-premiere-offline').addClass('hide');
		$('.js-premiere-online').removeClass('hide');
	});

	socket.on('authenticate', function (packet) {
		setCookie('token', packet.token);
		store.isLoggedIn = packet.isLoggedIn;
		store.emoji = packet.emoji;
		store.user.username = packet.username;
		emoji(store.emoji, packet.emojiStore);
		accountState();
		$('.js-m').focus();
	});

	socket.on('emoji', function (packet) {
		store.emoji = packet.emoji;
		emoji(store.emoji, packet.emojiStore);
	});

	socket.on('refreshState', function (packet) {
		setCookie('token', packet.token);
		store.isLoggedIn = packet.isLoggedIn;
		store.emoji = packet.emoji;
		emoji(store.emoji);
		accountState();
		$('.js-m').focus();
	});

	socket.on('logout', function (packet) {
		deleteCookie('token');
		store.isLoggedIn = false;
		accountState();
	});

	socket.on('chat', function (packet) {
		var li = $('<li>');

		if (packet.usr !== undefined) {
			var usr = $('<span>').addClass('l--usr').html(packet.usr);
			var spr = $('<span>').text(': ');
			if (packet.decor !== undefined) {
				usr = $('<span>').addClass(packet.decor);
			}
			var msg = $('<span>').addClass('l--msg').html(packet.msg);
			li.append(usr).append(spr).append(msg);

			if (packet.usr === store.user.username) {
				li.addClass('l--mention');
			}
		}

		if (packet.ntf !== undefined) {
			li.addClass(packet.ntf).html(packet.msg);
		}

		$('.js-messages').append(li);
		$('.js-m').focus();
		chatBottom();
	});

	socket.on('countConnect', function (packet) {
		$('.js-count').text(packet);
	});

	socket.on('startVideo', function (packet) {
		loadVideo(packet, 0);
	});

	//Triggers

	$('.js-chat').submit(function () {
		packet.msg = $('.js-m').val();
		if (store.isLoggedIn === true) {
			socket.emit('chat', packet);
		}
		toggleView({ element: '.js-emoji-panel', option: 'hide' });
		$('.js-m').val('');
		return false;
	});

	$('.js-login').submit(function () {
		packet.username = $('.js-login .js-username').val();
		packet.password = $('.js-login .js-password').val();
		socket.emit('login', packet);
		return false;
	});

	$('.js-register').submit(function () {
		packet.username = $('.js-register .js-username').val();
		packet.password = $('.js-register .js-password').val();
		socket.emit('register', packet);
		return false;
	});

	$('.js-logout').click(function () {
		socket.emit('logout');
	});

	//Default

	accountState();
});
