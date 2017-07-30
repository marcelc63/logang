const bcrypt   = require('bcrypt-nodejs');
const mysql = require('mysql');
const connection = mysql.createPool({
  connectionLimit : 100,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'logang'
});

const callbackCheck = (callback, data) => {
  if(data === 400){
    data = {
      meta: {
        code: 400,
      }
    }
  }
  if(callback !== undefined){
    callback(data)
  }
}

const mysqlQuery = (sql,callback) => {
  connection.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(sql, function (err, result, fields) {
      if (err) throw err;
      callback(result, fields)
      connection.release()
    });
  });
}

const emojiConstruct = (payload,option=undefined) => {
  let emoji = []
  for(i in payload){
    if(option === 'user'){
      emoji.push(payload[i].val)
    }
    if(option === 'store'){
      emoji.push({
        'val': payload[i].val,
        'reason': payload[i].reason
      })
    }
  }
  return emoji
}

const emoji = (payload,callback,option=undefined) => {
  if(option === undefined){
    mysqlQuery({
      sql: 'INSERT INTO `emoji` (emoji,identifier)VALUE(?,?)',
      timeout: 40000, // 40s
      values: [payload.emoji,payload.identifier]
    }, (x)=>{
      if(x.affectedRows === 1){
        let data = {
          meta: {
            code: 200,
          }
        }
        callbackCheck(callback,data)
      }
    })
  }

  if(option === 'authenticate'){
    mysqlQuery({
      sql: 'SELECT emoji_list.val as val, emoji.identifier as identifier FROM `emoji` LEFT JOIN emoji_list ON emoji.emoji = emoji_list.key WHERE `identifier` = ?',
      timeout: 40000, // 40s
      values: [payload.identifier]
    }, (x)=>{
      let data = {
        meta: {
          code: 200,
        },
        data: {
          userid: payload.userid,
          username: payload.username,
          token: payload.token,
          identifier: payload.identifier,
          emoji: emojiConstruct(x,'user')
        }
      }
      callbackCheck(callback,data)
    })
  }

  if(option === 'update'){
    mysqlQuery({
      sql: 'SELECT * FROM `emoji_list` ORDER BY `key` ASC',
      timeout: 40000, // 40s
    }, (x)=>{
      let data = {
        meta: {
          code: 200,
        },
        data: {
          emoji: emojiConstruct(x,'store')
        }
      }
      callbackCheck(callback,data)
    })
  }
}

const stats = (payload,callback,option=undefined) => {
  if(option === 'register'){
    mysqlQuery({
      sql: 'INSERT INTO `stats` (identifier,message)VALUE(?,?)',
      timeout: 40000, // 40s
      values: [payload.identifier,0]
    }, (x)=>{
      if(x.affectedRows === 1){
        console.log(payload.username+' registered')
        let data = {
          meta: {
            code: 200,
          }
        }
        callbackCheck(callback,data)
      }
    })
  }

  if(option === undefined){
    mysqlQuery({
      sql: 'UPDATE `stats` SET `chat` = `chat` + 1 WHERE `identifier` = ?',
      timeout: 40000, // 40s
      values: [payload.identifier]
    }, (x)=>{
      if(x.affectedRows === 1){
        let data = {
          meta: {
            code: 200,
          }
        }
        callbackCheck(callback,data)
      }
    })
  }

  if(option === 'check'){
    mysqlQuery({
      sql: 'SELECT * FROM `stats` WHERE `identifier` = ?',
      timeout: 40000, // 40s
      values: [payload.identifier]
    }, (x)=>{
      if(x.length === 1){
        let data = {
          meta: {
            code: 200,
          },
          data: {
            chat: x[0].chat
          }
        }
        callbackCheck(callback,data)
      }
    })
  }
}

const register = (payload,callback) => {
  payload.password = bcrypt.hashSync(payload.password, bcrypt.genSaltSync(8), null)
  payload.identifier = bcrypt.hashSync(payload.username+new Date().getTime(), bcrypt.genSaltSync(8), null)

  mysqlQuery({
    sql: 'SELECT * FROM `user` WHERE `username` = ?',
    timeout: 40000, // 40s
    values: [payload.username]
  }, (x)=>{
    if(x.length === 0){
      let timestring = Math.round(new Date().getTime()/1000)
      let datestring = new Date().toISOString()
      mysqlQuery({
        sql: 'INSERT INTO `user` (username,password,identifier,datestring,timestring)VALUE(?,?,?,?,?)',
        timeout: 40000, // 40s
        values: [payload.username,payload.password,payload.identifier,datestring,timestring]
      }, (x)=>{
        if(x.affectedRows === 1){
          stats(payload,callback,'register')
        }
      })
    }
    else{
      console.log('user exists')
      let data = {
        meta: {
          code: 400,
        }
      }
      callbackCheck(callback,data)
    }
  })
}

const authenticate = (payload,callback) => {
  mysqlQuery({
    sql: 'SELECT * FROM `user` WHERE `token` = ?',
    timeout: 40000, // 40s
    values: [payload.token]
  }, (x,f)=>{

    if(x.length === 1){
      payload.userid = x[0].id
      payload.username = x[0].username
      payload.identifier = x[0].identifier
      console.log(x[0].username+' authenticated')
      emoji(payload,callback,'authenticate')
    }
    if(x.length === 0){
      callbackCheck(callback,400)
    }

  })
}

const login = (payload,callback) => {
  payload.token = payload.username+new Date().getTime()
  payload.token = bcrypt.hashSync(payload.token, bcrypt.genSaltSync(8), null)

  mysqlQuery({
    sql: 'SELECT * FROM `user` WHERE `username` = ?',
    timeout: 40000, // 40s
    values: [payload.username]
  }, (x)=>{

    if(x.length !== 0){
      validate = bcrypt.compareSync(payload.password, x[0].password);
    }
    else{
      validate = false;
    }

    if(validate === true){
      payload.userid = x[0].id
      payload.identifier = x[0].identifier
      let datestring = new Date().toISOString()
      mysqlQuery({
        sql: 'UPDATE `user` SET `username` = ?, `token` = ?, `lastactive` = ? WHERE `id`=?',
        timeout: 40000, // 40s
        values: [payload.username,payload.token,datestring,payload.userid]
      }, (x)=>{
        if(x.affectedRows === 1){
          console.log(payload.username+' logged in')
          emoji(payload,callback,'authenticate')
        }
      })
    }
    else{
      callbackCheck(callback, 400)
    }
  })
}

module.exports = {
  login: login,
  authenticate: authenticate,
  register: register,
  emoji: emoji,
  stats: stats
}
