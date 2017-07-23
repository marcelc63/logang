const request = require('request');

const options = {
  method: 'GET',
  uri: 'https://www.googleapis.com/youtube/v3/playlistItems',
  qs: {
    'key': 'AIzaSyDCuH5O3aRZlQPOjhNQ5szGYRRMqq1if_E',
    'maxResults': '50',
    'part': 'contentDetails',
    'playlistId': 'PLH3cBjRCyTTwontN4gOIr56ynE8GMhZ2g'
  }
}

module.exports = function(){

  request(options,function (error, response, body) {
    if (error) {
      return console.error('upload failed:', error);
    }
    console.log('Upload successful!  Server responded with:', JSON.parse(body).kind);
  })
}
