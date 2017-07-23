const request = require('request');

function initiate(callback){
	console.log('accessing youtube api...');

	let store = {
		meta: {
			key: 'AIzaSyDCuH5O3aRZlQPOjhNQ5szGYRRMqq1if_E',
			playlistId: 'PLH3cBjRCyTTwontN4gOIr56ynE8GMhZ2g',
			pageToken: ''
		},
		data: {
			videoStore: [],
			videoId: [],
			videoDuration: [],
			videoTotalDuration: '',
		},
    callback: callback
	}

	fetchVideo(store)

};

function fetchVideo(store){
let storeMeta = store.meta

	request({
		uri: 'https://www.googleapis.com/youtube/v3/playlistItems',
		method: 'GET',
		qs: {
			'key': storeMeta.key,
			'maxResults': '50',
			'part': 'contentDetails',
			'playlistId': storeMeta.playlistId,
			'pageToken': storeMeta.pageToken
		}
	},(error, response, body)=>{
    data = JSON.parse(body)
		videoStore(store, data)
	});
}

function videoStore(store, data){
	let storeMeta = store.meta
	let storeData = store.data

	let videos = data.items
	for(i in videos){
		storeData.videoStore.push({
			'videoId': data.items[i].contentDetails.videoId,
			'videoPublishedAt': data.items[i].contentDetails.videoPublishedAt
		})
	}
	if(data.nextPageToken !== undefined){
		storeMeta.pageToken = data.nextPageToken
		fetchVideo(store)
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

	request({
		uri: 'https://www.googleapis.com/youtube/v3/videos',
		method: 'GET',
		qs: {
			'key': storeMeta.key,
			'part': 'snippet,contentDetails,statistics',
			'id': storeData.videoId[0]
		}
	},(error, response, body)=>{
    data = JSON.parse(body)
		videoCount[0] = videoCount[0]+1
		videoContentStore(store, data, videoCount)
	});
}

function YTDurationToSeconds(duration) {
  var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  return hours * 3600 + minutes * 60 + seconds;
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

	//console.log(store.data.videoTotalDuration)

  store.callback(store)

}

module.exports = {
  initiate: initiate
}
