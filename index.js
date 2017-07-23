//Dependencies
let express = require('express')
let app = require('express')();
let http = require('http').Server(app);
let path = require('path');

//Route
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '/')));

app.get('/', function(req, res){
  res.render('home');
});

//Socket
require('./app/socket.js')(http); // load our routes and pass in our app and fully configured

//Initiate
http.listen(3000, function(){
  console.log('listening on *:3000');
});
