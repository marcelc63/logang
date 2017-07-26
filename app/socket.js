//Dependencies
var parser = require('../app/parser.js');
var query = require('../app/query.js');
var schedule = require('node-schedule');

//Video
let videoStore = ''
let emojiStore = []
let streamState = 'streaming'
let premiereStore = {
  premiereDuration: '',
  premiereStart: ''
}
let video = require('../app/video.js');
video.initiate((x)=>{
  videoStore = x.data
  //videoStore.videoStore.splice(-1,1)
  console.log(videoStore.videoStore.length)
  console.log('initiated')
})

//Define
var countConnect = 0;
query.emoji('',(x)=>{
  emojiStore = x.data.emoji
},'update')

module.exports = function (http){
  var io = require('socket.io')(http);

  //Schedule
  function premiereEnd(premiereDuration){
    let endTime = premiereDuration*1000
    console.log(endTime)
    setTimeout(()=>{
      streamState = 'streaming'
      console.log('premiere ends')
    }, endTime);
  }
  //* 17-20 * * *
  //*/5 18-23 * * *
  function schedulePremiere(){
    console.log('premiere scheduled')
    var j = schedule.scheduleJob('*/5 18-23 * * *', ()=>{
      video.initiate((x)=>{
        console.log('cron')
        let video = x.data.videoStore
        let videoNow = videoStore.videoStore
        if(video[video.length-1].videoId !== videoNow[videoNow.length-1].videoId){
          console.log('premiere')
          videoStore = x.data
          streamState = 'premiere'
          premiereStore.premiereDuration = video[video.length-1].videoSeconds
          premiereStore.premiereStart = Math.round(new Date().getTime()/1000)
          premiereEnd(premiereStore.premiereDuration)
          let premierePacket = {
            videoStore: videoStore,
            premiereStart: premiereStore.premiereStart,
            option: 'premiere'
          }
          io.sockets.emit('premiere',premierePacket);
          j.cancel()
        }
      },'premiere')
    })
  }
  schedulePremiere()

  var k = schedule.scheduleJob('* 23 * * *', ()=>{
    schedulePremiere()
  })

  //Connection
  io.on('connection', function(socket){

    socket.store = {
      username: '',
      token: '',
      identifier: '',
      isLoggedIn: false,
      emoji: ['logang','ugudbro','logan']
    }

    //Define
    let store = socket.store
    countConnect = countConnect+1;

    //Functions
    const socketAuthenticate = (x,payload=undefined) => {
      if(x.meta.code === 200){
        store.username = x.data.username
        store.token = x.data.token
        store.identifier = x.data.identifier
        store.emoji = new Set([...store.emoji, ...x.data.emoji])
        store.emoji = [...store.emoji]
        store.isLoggedIn = true

        io.to(socket.id).emit('authenticate', {
          isLoggedIn:store.isLoggedIn,
          token:store.token,
          emoji:store.emoji,
          emojiStore: emojiStore,
          username: store.username
        })

        if(payload !== undefined && payload.purpose === 'msg'){
          io.to(socket.id).emit('chat', payload);
        }
      }
      if(x.meta.code === 400){
        store.isLoggedIn = false
        io.to(socket.id).emit('logout');
      }
    }


    //Connection
    socket.on('connected', function(packet){
      io.emit('countConnect', countConnect);
      if(streamState === 'streaming'){
        let initiatePacket = {
          videoStore: videoStore
        }
        io.to(socket.id).emit('initiate',initiatePacket);
      }
      else{
        let premierePacket = {
          videoStore: videoStore,
          premiereStart: premiereStore.premiereStart,
          option: 'initiatePremiere'
        }
        io.to(socket.id).emit('premiere',premierePacket);
      }

    });

    socket.on('disconnect', function(packet){
      countConnect = countConnect-1
      io.emit('countConnect', countConnect);
    });


    //Chat
    socket.on('chat', function(packet){
      if(store.isLoggedIn === true){
        let payload = {
          msg: packet.msg,
          usr: store.username
        }
        payload.msg = parser.sanitize(payload.msg)
        payload.msg = parser.emoji(payload.msg,store.emoji)
        io.emit('chat', payload)
      }
      else{
        let payload = {
          msg: '<span>Login or Register to Join Chat</span>',
          purpose: 'msg'
        }
        io.to(socket.id).emit('chat', payload);
      }
    });


    //Account State
    socket.on('login', function(packet){
      query.login({
        username: packet.username,
        password: packet.password
      },(x)=>{
        let payload = {
          msg: '<span>Welcome back!</span>',
          ntf: 'l--notification',
          purpose: 'msg'
        }
        socketAuthenticate(x,payload)
      })
    })

    socket.on('register', function(packet){
      query.register({
        username: packet.username,
        password: packet.password
      },(x)=>{
        if(x.meta.code === 200){
          query.login({
            username: packet.username,
            password: packet.password
          },(x)=>{
            let payload = {
              msg: '<div><p>Welcome to the place where all Logangsters gather and watch together!</p> <p>As a new member, you\'ve unlocked the following emoji: :logang :ugudbro.</p> <p>You can unlock more emoji by being active!</p> <p>Have fun :)</p></div>',
              ntf: 'l--register',
              purpose: 'msg'
            }
            payload.msg = parser.emoji(payload.msg,store.emoji)
            socketAuthenticate(x,payload)
          })
        }
      })
    })

    socket.on('logout', function(packet){
      store.isLoggedIn = false
      let payload = {
        msg: '<span>You\'ve logged out</span>',
        ntf: 'l--notification',
        purpose: 'msg'
      }
      io.to(socket.id).emit('chat', payload);
      io.to(socket.id).emit('logout');
    });

    socket.on('authenticate', function(packet){
      query.authenticate({
        token: packet
      },(x)=>{
        socketAuthenticate(x)
      })
    })

    socket.on('startVideo', function(packet){
      io.emit('startVideo', packet);
    });

  });
}
