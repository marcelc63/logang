'use strict';

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var store = {
	videoStore: [],
	videoTotalDuration: '',
	currentVideoIndex: '',
	playbackStatus: ''
};
var premiereStore = {
	premiereStart: '',
	premiereState: 'offline'
};
var player = void 0;
var option = void 0;

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		playerVars: {
			'autoplay': 1,
			'controls': 0,
			'rel': 0,
			'modestbranding': 1,
			'showinfo': 1,
			'disablekb': 1,
			'enablejsapi': 1,
			'fs': 0,
			'playsinline': 1,
			'autohide': 2,
			'widgetid': 1,
			'cc_load_policy': 0
		},
		events: {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	});
}

function onPlayerReady(event) {
	if (premiereStore.premiereState === 'online') {
		option = 'premiere';
	} else {
		option = undefined;
	}

	if (store.playbackStatus === 'dataReady') {
		syncVideo(store, option);
	} else {
		store.playbackStatus = 'playerReady';
	}
}

function loadVideo(packet) {

	var videoId = packet.videoId;
	var startSeconds = packet.startSeconds;
	var videoTitle = packet.videoTitle;
	var currentVideoIndex = packet.currentVideoIndex;
	var totalVideo = packet.totalVideo;
	var date = new Date(packet.videoPublishedAt);
	var videoPublishedAt = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

	player.loadVideoById({
		'videoId': videoId,
		'startSeconds': startSeconds,
		//'endSeconds': startSeconds+5,
		'suggestedQuality': 'large'
	});

	$('.js-video-title').text(videoTitle);
	$('.js-video-current').text(currentVideoIndex);
	$('.js-video-total').text(totalVideo);
	$('.js-video-published-at').text(videoPublishedAt);
}

function premiereVideo(data) {
	premiereStore.premiereStart = data;
	premiereStore.premiereState = 'online';
}

function syncVideo(data) {
	var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

	var storeData = data;
	var currentDuration = currentTime(storeData.videoTotalDuration);
	var currentVideoIndex = storeData.videoStore.findIndex(function (x) {
		if (currentDuration < x.videoSeconds) {
			return true;
		} else {
			currentDuration -= x.videoSeconds;
		}
	});

	var temporaryStore = {
		video: storeData.videoStore[currentVideoIndex],
		videoStore: storeData.videoStore,
		currentDuration: currentDuration,
		currentVideoIndex: currentVideoIndex,
		videoTotalDuration: storeData.videoTotalDuration
	};

	if (premiereStore.premiereState === 'online') {
		option = 'premiere';
	}

	if (option === 'premiere' || option === 'initiatePremiere') {
		temporaryStore.video = storeData.videoStore[storeData.videoStore.length - 1];
		temporaryStore.currentDuration = Date.now() / 1000 - premiereStore.premiereStart;
		temporaryStore.currentDuration = storeData.videoStore.length;
	}

	startYouTube(temporaryStore, option);
}

function startYouTube(packet) {
	var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;


	var video = packet.video;
	var payload = {
		videoId: video.videoId,
		videoPublishedAt: video.videoPublishedAt,
		startSeconds: packet.currentDuration,
		videoTitle: video.videoTitle,
		currentVideoIndex: packet.currentVideoIndex + 1,
		totalVideo: packet.videoStore.length
	};

	if (option === undefined) {
		loadVideo(payload);
	}
	if (option === 'premiere') {
		loadVideo(payload);
	}
	if (option === 'initiate' || option === 'initiatePremiere') {
		if (store.playbackStatus === 'playerReady') {
			loadVideo(payload);
		} else {
			store.playbackStatus = 'dataReady';
		}
	}

	if (option !== 'premiere') {
		store.currentVideoIndex = packet.currentVideoIndex + 1;
	}
	store.videoStore = packet.videoStore;
	store.videoTotalDuration = packet.videoTotalDuration;
}

function onPlayerStateChange(event) {
	if (event.data === 0) {
		if (premiereStore.premiereState === 'online') {
			premiereStore.premiereState = 'offline';
			$('.js-premiere-offline').removeClass('hide');
			$('.js-premiere-online').addClass('hide');
		}
		syncVideo(store);
	}
	if (event.data === 1) {
		$('.content--play-btn').addClass('hide');
	}
	if (event.data === 2) {
		$('.content--play-btn').removeClass('hide');
	}
}

function stopVideo() {
	player.stopVideo();
}

function toggleSound() {
	if (player.isMuted()) {
		player.unMute();
	} else {
		player.mute();
	}
}
