//Default
$(()=>{ $('.content--video').hover(
	()=>{ $('.content--toolbar').removeClass('hide') },
	()=>{ $('.content--toolbar').addClass('hide') }
) })

$(document).keydown(()=>{$('.js-m').focus()})
$("body").tooltip({
	selector: '[data-toggle="tooltip"]'
})

//LA Time
setInterval(()=>{
	let utcTime = new Date
	let laOffset = -7*60*60000
	let userOffset = utcTime.getTimezoneOffset()*60000
	let laTime = new Date(utcTime.getTime()+laOffset+userOffset)
	let hours = laTime.getHours()
	let minutes = laTime.getMinutes()
	let mid = 'AM'
	console.log(hours)
	if (minutes < 10)
	{
		minutes = ('0'+minutes.toString())
	}
	if(hours === 0){
		hours = 12
	}
	else if(hours > 12)
	{
		hours = hours%12
		mid = 'PM'
	}
	$('.js-la-time').text(hours+':'+minutes+' '+mid)
}, 1000)

//Factory
const clickTrigger = (trigger, target) => {
	$(()=>{ $(trigger).click(
		()=>{
			$('.l--view').addClass('hide')
			$(target).parent().removeClass('hide')
		}
	)})
}

const clickListen = (trigger,callback) => {
	$(()=>{ $(trigger).click(
		()=>{
			callback()
		}
	)})
}

function toggleView(payload){
	let element = payload.element
	let option = payload.option

	if(option === undefined){
		if($(element).hasClass('hide')){
			$(element).removeClass('hide')
		}
		else{
			$(element).addClass('hide')
		}
	}
	if(option === 'hide'){
		$(element).addClass('hide')
	}
	if(option === 'view'){
		$(element).removeClass('hide')
	}

}

function toggleFullScreen(){
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||
	(!document.mozFullScreen && !document.webkitIsFullScreen)) {
		if (document.documentElement.requestFullScreen) {
			document.documentElement.requestFullScreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullScreen) {
			document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
		}

		$('.content').addClass('col-xs-12')
		$('.content').removeClass('col-xs-9')
		$('.chat').addClass('hide')

	} else {
		if (document.cancelFullScreen) {
			document.cancelFullScreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen();
		}

		$('.content').removeClass('col-xs-12')
		$('.content').addClass('col-xs-9')
		$('.chat').removeClass('hide')
	}

}

//Execute Factory
clickTrigger('.js-btn-register','.js-register');
clickTrigger('.js-btn-login','.js-login');
clickListen('.js-fullscreen',toggleFullScreen)
clickListen('.js-sound',toggleSound)
clickListen('.js-emoji-btn',()=>{
	toggleView({element:'.js-emoji-panel'})
})
clickListen('.js-play-btn',()=>{
	$('.content--play-btn').addClass('hide')
	syncVideo(store)
})

function chatBottom(){
	let cb = document.getElementsByClassName("js-messages")[0];
	if(cb.scrollHeight - cb.scrollTop - cb.clientHeight <= 30){
		cb.scrollTop = cb.scrollHeight;
	}
}
