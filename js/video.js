$(function () {

function initiate(){
	console.log('initiating...');

	let store = {
		meta: {
			key: 'AIzaSyDCuH5O3aRZlQPOjhNQ5szGYRRMqq1if_E',
			playlistId: 'PLH3cBjRCyTTwontN4gOIr56ynE8GMhZ2g'
		},
		data: {
			videoStore: [],
			videoId: [],
			videoDuration: [],
			videoTotalDuration: '',
		}
	}

	fetchVideo(store)

};

function fetchVideo(store, pageToken){
let storeMeta = store.meta

	$.ajax({
		url: 'https://www.googleapis.com/youtube/v3/playlistItems',
		type: 'GET',
		data: {
			'key': storeMeta.key,
			'maxResults': '50',
			'part': 'contentDetails',
			'playlistId': storeMeta.playlistId,
			'pageToken': pageToken
		},
		dataType: 'json'
	}).done(function(data){
		videoStore(store, data)
	});
}

function videoStore(store, data){
	let storeData = store.data

	let videos = data.items
	let pageToken = data.nextPageToken
	for(i in videos){
		storeData.videoStore.push({
			'videoId': data.items[i].contentDetails.videoId,
			'videoPublishedAt': data.items[i].contentDetails.videoPublishedAt
		})
	}
	if(pageToken !== undefined){
		fetchVideo(store, pageToken)
	}
	else{
		videoCollectId(store)
	}
}

function videoCollectId(store){
	let storeData = store.data

	let videoChunks
	videoChunks = Math.ceil(storeData.videoStore.length/50)
	let videoCount = [0,videoChunks]

	let i = 1
	while(i <= videoChunks){
		let temporarystore
		let start = (i-1)*50
		let end = i*50
		temporarystore = storeData.videoStore.slice(start,end)
		temporarystore = temporarystore.map(x => x.videoId).join(',')
		storeData.videoId=[temporarystore]
		i++
		videoContent(store,videoCount)
	}

}

function videoContent(store,videoCount){
	let storeData = store.data
	let storeMeta = store.meta

	$.ajax({
		url: 'https://www.googleapis.com/youtube/v3/videos',
		type: 'GET',
		data: {
			'key': storeMeta.key,
			'part': 'snippet,contentDetails,statistics',
			'id': storeData.videoId[0]
		},
		dataType: 'json'
	}).done(function(data){
		videoCount[0] = videoCount[0]+1
		videoContentStore(store, data, videoCount)
	});
}

function videoContentStore(store, data, videoCount){
	let storeData = store.data

	let videos = data.items
	for(i in videos){
		storeData.videoDuration.push({
			'videoId': data.items[i].id,
			'videoDuration': data.items[i].contentDetails.duration,
			'videoSeconds': YTDurationToSeconds(data.items[i].contentDetails.duration),
			'videoTitle': data.items[i].snippet.title
		})
	}

	if(videoCount[0] === videoCount[1]){
		videoCombine(store)
	}
}

function videoCombine(store){
	let storeData = store.data

	storeData.videoStore = storeData.videoStore.map(a => {
		let videoId = a.videoId
		let index = storeData.videoDuration.findIndex(x => x.videoId === videoId)
		if(index != '-1'){
			return{
				'videoId': a.videoId,
				'videoPublishedAt': a.videoPublishedAt,
				'videoDuration': storeData.videoDuration[index].videoDuration,
				'videoSeconds': storeData.videoDuration[index].videoSeconds,
				'videoTitle':  storeData.videoDuration[index].videoTitle
			}
		}
		return a
	})

	storeData.videoStore = storeData.videoStore.filter(x => x.videoDuration != undefined)
	storeData.videoStore = storeData.videoStore.reverse()
	storeData.videoTotalDuration = storeData.videoStore.reduce((x,i) => x+parseInt(i.videoSeconds),0)

	syncVideo(store.data)

}

function findVideo(store){
	let storeData = store.data

	var currentDuration = currentTime(storeData.videoTotalDuration)

	currentVideoIndex = storeData.videoStore.findIndex(x => {
		if(currentDuration < x.videoSeconds){
			return true
		}
		else{
			currentDuration -= x.videoSeconds
		}
	}); // 130

	console.log(currentVideoIndex)
	console.log(storeData.videoStore[currentVideoIndex])
	console.log(currentDuration)

	let temporaryStore = {
		videoId: storeData.videoStore[currentVideoIndex].videoId,
		videoStore: storeData.videoStore,
		currentDuration: currentDuration,
		currentVideoIndex: currentVideoIndex,
		videoTotalDuration: storeData.videoTotalDuration
	}

	startYouTube(temporaryStore)
}

window.onload = function() {
  initiate();
};

});
