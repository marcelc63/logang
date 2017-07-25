let tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

let store = {
	videoStore: [],
	videoTotalDuration: '',
	currentVideoIndex: '',
	playbackStatus: ''
}
let player

function onYouTubeIframeAPIReady() {
	player = new YT.Player('player', {
		playerVars: {
			'autoplay': 2,
			'controls': 0,
			'rel' : 0,
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
	if(store.playbackStatus === 'dataReady'){
		syncVideo(store)
	}
	else{
		store.playbackStatus = 'playerReady'
	}
}

function loadVideo(packet){

	let videoId = packet.videoId
	let startSeconds = packet.startSeconds
	let videoTitle = packet.videoTitle
	let currentVideoIndex = packet.currentVideoIndex
	let totalVideo = packet.totalVideo
	let date = new Date(packet.videoPublishedAt)
	let videoPublishedAt = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()

	player.loadVideoById({'videoId': videoId,
	'startSeconds': startSeconds,
	//'endSeconds': startSeconds+5,
	'suggestedQuality': 'large'});

	$('.js-video-title').text(videoTitle)
	$('.js-video-current').text(currentVideoIndex)
	$('.js-video-total').text(totalVideo)
	$('.js-video-published-at').text(videoPublishedAt)
}

function syncVideo(data,option=undefined){
	let storeData = data
	let currentDuration = currentTime(storeData.videoTotalDuration)
	let currentVideoIndex = storeData.videoStore.findIndex(x => {
		if(currentDuration < x.videoSeconds){
			return true
		}
		else{
			currentDuration -= x.videoSeconds
		}
	}); // 130

	//console.log(currentVideoIndex)
	//console.log(storeData.videoStore[currentVideoIndex])
	//console.log(currentDuration)

	let temporaryStore = {
		video: storeData.videoStore[currentVideoIndex],
		videoStore: storeData.videoStore,
		currentDuration: currentDuration,
		currentVideoIndex: currentVideoIndex,
		videoTotalDuration: storeData.videoTotalDuration
	}

	startYouTube(temporaryStore,option)
}

function startYouTube(packet,option=undefined){

	let video = packet.video
	let payload = {
		videoId: video.videoId,
		videoPublishedAt: video.videoPublishedAt,
		startSeconds: packet.currentDuration,
		videoTitle: video.videoTitle,
		currentVideoIndex: packet.currentVideoIndex+1,
		totalVideo: packet.videoStore.length
	}


	if(option === undefined){
		loadVideo(payload)
	}
	if(option === 'premiere'){
		if(packet.videoStore.length > store.videoStore.length){
			loadVideo(payload)
		}
	}
	if(option === 'initiate'){
		if(store.playbackStatus === 'playerReady'){
			loadVideo(payload)
		}
		else{
			store.playbackStatus = 'dataReady'
		}
	}
	
	if(option !== 'premiere'){
		store.currentVideoIndex = packet.currentVideoIndex+1
	}
	store.videoStore = packet.videoStore
	store.videoTotalDuration = packet.videoTotalDuration
}

function onPlayerStateChange(event) {
	if(event.data === 0){
		let payload = {
			videoId: store.videoStore[store.currentVideoIndex].videoId,
			videoPublishedAt: store.videoStore[store.currentVideoIndex].videoPublishedAt,
			startSeconds: 0,
			videoTitle: store.videoStore[store.currentVideoIndex].videoTitle,
			currentVideoIndex: store.currentVideoIndex+1,
			totalVideo: store.videoStore.length
		}
		loadVideo(payload)
		if(store.currentVideoIndex+1 != store.videoStore.length){
			store.currentVideoIndex++
		}
		else{
			store.currentVideoIndex = 0
		}
		//syncVideo(store)
	}
	if(event.data === 1){
		$('.content--play-btn').addClass('hide')
	}
	if(event.data === 2){
		$('.content--play-btn').removeClass('hide')
	}
}

function stopVideo() {
	player.stopVideo();
}

function toggleSound() {
	if (player.isMuted()) {
		player.unMute()
	} else {
		player.mute()
	}
}
