$(function () {
	let packet = {};
	let store = {
		isLoggedIn: false,
		emoji: []
	}

	//Account state
	const accountState = () => {
		if(store.isLoggedIn === true){
			$('.v-hide').addClass('hide')
			$('.v-loggedIn').removeClass('hide')
		}
		if(store.isLoggedIn === false){
			$('.v-hide').addClass('hide')
			$('.v-loggedOut').removeClass('hide')
		}
	}

	//Emoji
	const emojiInitiate = () => {
		$(()=>{ $('.js-emoji.emoji--click').click(
				(e)=>{
					let em = $(e.target).data("emoji");
					let m = $('.js-m').val()
					m = m+' :'+em+' '
					$('.js-m').val(m)
					$('.js-m').focus();
				}
		)})
	}

	const emoji = (emoji) => {
	  if(emoji.some(x=>x==='logang')){
	    $("[data-emoji='logang']").addClass('emoji--click').prop('title', 'From Registering');
	  }
	  if(emoji.some(x=>x==='ugudbro')){
	    $("[data-emoji='ugudbro']").addClass('emoji--click').prop('title', 'From Registering');
	  }
	  if(emoji.some(x=>x==='thasssmuhboiii')){
	    $("[data-emoji='thasssmuhboiii']").addClass('emoji--click').prop('title', 'Send 10 Chats!');
	  }
		emojiInitiate();		
	}

	//Functions

	const getQueryVariable = (variable) => {
		let query = window.location.search.substring(1);
		let vars = query.split("&");
		for (let i=0;i<vars.length;i++) {
			let pair = vars[i].split("=");
			if(pair[0] === variable){return pair[1];}
		}
		return(false);
	}

	const setCookie = (name, value, days = 7, path = '/') => {
		const expires = new Date(Date.now() + days * 864e5).toGMTString()
		document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path
	}

	const getCookie = (name) => {
		return document.cookie.split('; ').reduce((r, v) => {
			const parts = v.split('=')
			return parts[0] === name ? decodeURIComponent(parts[1]) : r
		}, '')
	}

	const deleteCookie = (name, path) => {
		setCookie(name, '', -1, path)
	}

	//Listeners

	let socket = io().connect();
	socket.on('connect', function() {
		let token = getCookie('token');
		if(token !== 'undefined'){
			socket.emit('authenticate', token);
		}
		socket.emit('connected');
	});

	socket.on('initiate', function(packet){
		syncVideo(packet,'initiate')
	})

	socket.on('premiere', function(packet){
		syncVideo(packet,'premiere')
	})

	socket.on('authenticate', function(packet){
		setCookie('token', packet.token)
		store.isLoggedIn = packet.isLoggedIn
		store.emoji = packet.emoji
		emoji(store.emoji)
		accountState()
		$('.js-m').focus();
	});

	socket.on('refreshState', function(packet){
		setCookie('token', packet.token)
		store.isLoggedIn = packet.isLoggedIn
		store.emoji = packet.emoji
		emoji(store.emoji)
		accountState()
		$('.js-m').focus();
	});

	socket.on('logout', function(packet){
		deleteCookie('token')
		store.isLoggedIn = false
		accountState()
	});

	socket.on('chat', function(packet){
		let li = $('<li>')

		if(packet.usr !== undefined){
			let usr = $('<span>').addClass('l--usr').html(packet.usr)
			let spr = $('<span>').text(': ')
			if(packet.decor !== undefined){
				usr = $('<span>').addClass(packet.decor)
			}
			let msg = $('<span>').addClass('l--msg').html(packet.msg)
			li.append(usr).append(spr).append(msg)
		}

		if(packet.ntf !== undefined){
			li.addClass(packet.ntf).html(packet.msg)
		}

		$('.js-messages').append(li);
		$('.js-m').focus();
		chatBottom()
	});

	socket.on('countConnect', function(packet){
		$('.js-count').text(packet);
	});

	socket.on('startVideo', function(packet){
		loadVideo(packet,0)
	});


	//Triggers

	$('.js-chat').submit(function(){
		packet.msg = $('.js-m').val();
		if(store.isLoggedIn === true){
			socket.emit('chat', packet);
		}
		toggleView({element:'.js-emoji-panel',option:'hide'})
		$('.js-m').val('');
		return false;
	});

	$('.js-login').submit(function(){
		packet.username = $('.js-login .js-username').val();
		packet.password = $('.js-login .js-password').val();
		socket.emit('login', packet);
		return false;
	});

	$('.js-register').submit(function(){
		packet.username = $('.js-register .js-username').val();
		packet.password = $('.js-register .js-password').val();
		socket.emit('register', packet);
		return false;
	});

	$('.js-logout').click(function(){
		socket.emit('logout');
	})

	//Default

	accountState()

	});
