function currentTime(totalDuration){
	let startTime = 1499703318
	let currentTime = Math.round(new Date().getTime()/1000)
	//let totalDuration = totalDuration
	let difference = currentTime - startTime
	let ratio = difference/totalDuration
	let ratioFloor = Math.floor(ratio)
	let currentRatio = ratio - ratioFloor
	let currentVideo = totalDuration * currentRatio
	return currentVideo
}

function YTDurationToSeconds(duration) {
  var match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)

  var hours = (parseInt(match[1]) || 0);
  var minutes = (parseInt(match[2]) || 0);
  var seconds = (parseInt(match[3]) || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function exportJSON(data){
	//Get the file contents
	var txtFile = "test.txt";
	var file = new File([""],txtFile);
	var str = JSON.stringify(data);

	//Save the file contents as a DataURI
	var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(str);

	//Write it as the href for the link
	var link = document.getElementById('link').href = dataUri;
}
