const sanitize = (x) => {
  return x.replace(/(<([^>]+)>)/ig, '');
}

const emoji = (x, lock) => {
  if(lock.some(x=>x==='logang')){
    x = x.replace(/\:logang/g, '<img src=\'emoji/logang.png\' class=\'emoji--chat\'>');
  }
  if(lock.some(x=>x==='logan')){
    x = x.replace(/\:logan/g, '<img src=\'emoji/logan.png\' class=\'emoji--chat\'>');
  }
  if(lock.some(x=>x==='ugudbro')){
    x = x.replace(/\:ugudbro\?\?\?/g, '<img src=\'emoji/ugudbro3.png\' class=\'emoji--chat\'>');
    x = x.replace(/\:ugudbro\?\?/g, '<img src=\'emoji/ugudbro2.png\' class=\'emoji--chat\'>');
    x = x.replace(/\:ugudbro\?/g, '<img src=\'emoji/ugudbro.png\' class=\'emoji--chat\'>');
    x = x.replace(/\:ugudbro/g, '<img src=\'emoji/ugudbro.png\' class=\'emoji--chat\'>');
  }
  if(lock.some(x=>x==='thasssmuhboiii')){
    x = x.replace(/\:thasssmuhboiii/g, '<img src=\'emoji/thasssmuhboiii.png\' class=\'emoji--chat\'>');
  }

  return x
}

module.exports = {
  emoji: emoji,
  sanitize: sanitize
}
