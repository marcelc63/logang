function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const sanitize = (x) => {
  return x.replace(/(<([^>]+)>)/ig, '');
}

const emoji = (x, lock) => {
  lock.forEach((val) => {
    val = escapeRegExp(val)
    let reg = new RegExp(':'+val+'\\b','g')
    let str = '<img src=\'emoji/'+val+'.png\' class=\'emoji--chat\'>'
    if(reg.test(x)){
      x = x.replace(reg, str)
    }
  })
  return x
}

module.exports = {
  emoji: emoji,
  sanitize: sanitize
}
