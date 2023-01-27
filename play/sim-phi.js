"use strict";

//在Local Storage中添加"debugMode"并赋值为“true”激活开发模式！！！！！！！！！！！！！！！！！！！！！！！！！
const _i = ['Phigros模拟器', [1, 4, 13], 1611795955, 1637586185];
const APPVERSION = "0.0.14";
document.oncontextmenu = e => e.preventDefault(); //qwq

String.prototype.times = function(n) {
	return (new Array(n+1)).join(this);
};

const message = {
	out: $("msg-out"),
	view: $("view-msg"),
	lastMessage: "",
	isError: false,
	get num() {
		return this.view.querySelectorAll(".msgbox").length;
	},
	sendMessage(msg) {
		console.log('Phigros Emulator: '+msg);
		return;
	},
	sendWarning(msg) {
		console.warn('Phigros Emulator: '+msg);
		return;
	},
	sendError(msg) {
		console.error('Phigros Emulator: '+msg);
		return;
	}
}

var Renderer = { //存放谱面
	chart: null,
	bgImage: null,
	bgImageBlur: null,
	bgMusic: null,
	lines: [],
	notes: [],
	taps: [],
	drags: [],
	flicks: [],
	holds: [],
	reverseholds: [],
	tapholds: []
};
var qwq=[];
var chartLine,chartLineData;

//要不要请奥托先生
let isAutoplay = new URLSearchParams(new URL(location.href).search).get("ap");
const autoplay = {"checked": isAutoplay};

//var debugMode = window.localStorage.getItem("debugMode") === "true" && window.localStorage.getItem("playerName");
$("feedback").checked = true;

const upload = $("upload");	//上载input
const uploads = $("uploads");	//整个上载条子
const mask = $("mask");	//下面那行字
const select = $("select");	//整个各种选择的框架
const selectbg = $("select-bg");	//背景选择
const btnPlay = $("btn-play");	//开始按钮
const btnPause = $("btn-pause");	//暂停按钮
const selectbgm = $("select-bgm");	//BGM选择
const selectchart = $("select-chart");	//谱面选择
const selectscaleratio = $("select-scale-ratio"); //数值越大note越小
const selectaspectratio = $("select-aspect-ratio");	//选择宽高比
const selectglobalalpha = $("select-global-alpha");//背景变暗
const selectflip = $("select-flip");
selectflip.value = new URLSearchParams(new URL(location.href).search).get("mirror") ? "bl" : "br";
const inputName = $("input-name");	//歌名
const inputLevel = $("input-level");	//难度
const inputDesigner = $("input-designer");	//普师
const inputOffset = $("input-offset");	//偏移率
const inputOffsetValue = +window.localStorage.getItem("input-offset");
var judgeOffset = 0;
if (window.localStorage.getItem("debugMode") == "true") judgeOffset = +window.localStorage.getItem("judge-offset");
const lineColor = $("lineColor");	//FC/AP指示器
const hyperMode = $("hyperMode");	//研判
const showTransition = $("showTransition");	//是否开启过度动画
const showInfo = $("showInfo");
const bgsBlur = {};
const bgms = {};
const charts = {};
const chartInfoData = []; //info.csv
const AspectRatio = 16 / 9; //宽高比上限 //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
const Deg = Math.PI / 180; //角度转弧度
let wlen, hlen, wlen2, hlen2, noteScale, lineScale; //背景图相关
const canvas = $("canvas");
const ctx = canvas.getContext("2d"); //游戏界面(alpha:false会出现兼容问题)
const canvasos = document.createElement("canvas"); //用于绘制游戏主界面
const ctxos = canvasos.getContext("2d");
var willshowtextel = "";      //在界面下方显示的前一note点击信息
var timeBeforeBegin = null;
var resumingBeginTime;
var pauseButtonsShowed = false;
var tmps = new Map();
const parser = new UAParser();
const showPlatform = parser.getBrowser().name + " on " + parser.getOS().name;
var nowShowing = "play"; // 当前展示页面 songSelect/play
var songSelectValue = {
	grades: ["ez", "hd", "in", "at"],       // 所有可选难度,不做修改
	selectedGrade: new URLSearchParams(new URL(location.href).search).get('l'),                    // 当前选中难度
	selectedSong: new URLSearchParams(new URL(location.href).search).get('play'),
	thisChapter: {                          // 当前选中章节相关信息
		chapter: "example",                 // |- 章节代码
		chapterName: "songSelect Example",  // |- 章节名称
		chapterNumber: "Chapter Ex.",       // |- 章节编号
		songsInChapter: [                   // |- 章节内曲目信息
			/*
			Example:
			{
				songCodeName: "codename",
				songShowName: "Show Name",
				illustration: (曲绘),
				illustrationBlur: (模糊曲绘),
				meta: {
					(元文件json解析后内容)
				},
				bestScore: ["1000000", "100.00%", (Rank 0-7)],
			}
			*/
			{
				songCodeName: "example",
				songShowName: "Example",
				bestScore: ["1000000", "100.00%", 0],
			}
		]
	}
};

//全屏相关
const full = {
	toggle(elem) {
		if (!this.enabled) return false;
		if (this.element) {
			if (document.exitFullscreen) return document.exitFullscreen();
			if (document.cancelFullScreen) return document.cancelFullScreen();
			if (document.webkitCancelFullScreen) return document.webkitCancelFullScreen();
			if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
			if (document.msExitFullscreen) return document.msExitFullscreen();
		} else {
			if (!(elem instanceof HTMLElement)) elem = document.body;
			if (elem.requestFullscreen) return elem.requestFullscreen();
			if (elem.webkitRequestFullscreen) return elem.webkitRequestFullscreen();
			if (elem.mozRequestFullScreen) return elem.mozRequestFullScreen();
			if (elem.msRequestFullscreen) return elem.msRequestFullscreen();
		}
	},
	check(elem) {
		if (!(elem instanceof HTMLElement)) elem = document.body;
		return this.element == elem;
	},
	get element() {
		return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
	},
	get enabled() {
		return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled);
	}
};

function adjustInfo() {
	for (const i of chartInfoData) {
		if (selectchart.value == i.Chart) {
			if (bgms[i.Music]) selectbgm.value = i.Music;
			if (bgs[i.Image]) selectbg.value = i.Image;
			if (!!Number(i.AspectRatio)) selectaspectratio.value = i.AspectRatio;
			if (!!Number(i.ScaleRatio)) selectscaleratio.value = i.ScaleRatio;
			if (!!Number(i.GlobalAlpha)) selectglobalalpha.value = i.GlobalAlpha;
			inputName.value = i.Name;
			inputLevel.value = i.Level;
			inputIllustrator.value = i.Illustrator;
			inputDesigner.value = i.Designer;
		}
	}
}
window.addEventListener("resize", resizeCanvas);
document.addEventListener("fullscreenchange", resizeCanvas);

//适应画面尺寸
function resizeCanvas() {
	const width = document.documentElement.clientWidth;
	const height = document.documentElement.clientHeight;
	// const defaultWidth = Math.min(854, width * 1);
	var defaultHeight = height;
	// const defaultHeight = defaultWidth / ( 16 / 9);
	var defaultWidth = width;//defaultHeight * ( 16 / 9);
	/*
	if (width<defaultWidth) {
		defaultWidth=width;
		defaultHeight=height;//defaultWidth/(16/9);
	}
	*/
	console.log(width,height,defaultWidth,defaultHeight)
	const realWidth = Math.floor(full.check(canvas) ? width : defaultWidth);
	const realHeight = Math.floor(full.check(canvas) ? height : defaultHeight);
	canvas.style.cssText += `;width:${realWidth}px;height:${realHeight}px`;
	canvas.width = realWidth * devicePixelRatio;
	canvas.height = realHeight * devicePixelRatio;
	// canvasos.width = Math.min(realWidth, realHeight * (16 / 9)) * devicePixelRatio;
	// canvasos.height = Math.min(realHeight, realWidth * (9 / 16))/*realHeight*/ * devicePixelRatio;
	canvasos.width = Math.min(realWidth, realHeight * AspectRatio) * devicePixelRatio;
	canvasos.height = realHeight * devicePixelRatio;
	wlen = canvasos.width / 2;
	hlen = canvasos.height / 2;
	wlen2 = canvasos.width / 18;
	hlen2 = canvasos.height * Number(new URLSearchParams(new URL(location.href).search).get('ls') === null ? "0.6" : new URLSearchParams(new URL(location.href).search).get('ls')); //控制note流速
	noteScale = canvasos.width / (selectscaleratio.value || 8e3); //note、特效缩放
	lineScale = canvasos.width > canvasos.height * 0.75 ? canvasos.height / 18.75 : canvasos.width / 14.0625; //判定线、文字缩放
	pauseButtonsShowed = false;
}

function pausedMenu() {mdui.dialog({
	title: 'Paused',
	content: '',
	buttons: [
	  {
		text: 'Back',
		onClick: () => mdui.dialog({
			title: 'Back',
			content: 'Are you sure to back to the song select page?',
			buttons: [
			  {
				text: 'No',
				onClick: () => pausedMenu()
			  },
			  {
				text: 'Yes',
				onClick: () => history.go(-1)
			  },
			]
		})
	  },
	  {
		text: 'Retry',
		onClick: () => mdui.dialog({
			title: 'Retry',
			content: 'Are you sure to retry?',
			buttons: [
			  {
				text: 'No',
				onClick: () => pausedMenu()
			  },
			  {
				text: 'Yes',
				onClick: () => replay()
			  },
			]
		})
	  },
	  {
		text: 'Resume',
		onClick: () => btnPause.click()
	  }
	]
  });}
const mouse = {}; //存放鼠标事件(用于检测，下同)
const touch = {}; //存放触摸事件
const keyboard = {}; //存放键盘事件
const taps = []; //额外处理tap(试图修复吃音bug)
const specialClick = { //上下左右四角双击处理
	time: [0, 0, 0, 0],
	func: [() => {
		if(!isPaused) btnPause.click();
	}, () => {
	}, () => {
		// if (isAutoplay) return;
		if (!isPaused) btnPause.click();
		else pauseButtonsShowed = false;
		/* if (confirm("确认返回？\n点击取消打开开发者工具")) {
			if (confirm("回到章节（正常）还是返回（异常）\n确定：回到章节\n")) {
				location.href=`../songSelect/index.html?c=${new URLSearchParams(new URL(location.href).search).get('c')}`;//回到章节
			} else {
				window.history.go(-1);
			}
		} else {
			window.webContents.openDevTools()
		} */
		switch (selectflip.value) {
			case "br":
				selectflip.value = "tl";
				break;
			case "tl":
				selectflip.value = "br";
				break;
			case "br":
				selectflip.value = "tr";
				break;
			case "tr":
				selectflip.value = "bl";
				break;
	}
	}, () => {
		//full.toggle(canvas);
		full.toggle();
	}],
	click(id) {
		const now = Date.now();
		if (now - this.time[id] < 300) this.func[id]();
		this.time[id] = now;
	}
}
// class Click {
// 	constructor(offsetX, offsetY) {
// 		this.offsetX = Number(offsetX);
// 		this.offsetY = Number(offsetY);
// 		this.oldOffsetX = this.offsetX;
// 		this.oldOffsetY = this.offsetY;
// 		this.movejlX = 0;
// 		this.movejlY = 0;
// 		this.movingTimew = 0;
// 		this.isMoving = false;
// 		this.canFlick = false;
// 		this.time = 0;
// 		this.moveSpeed = 12;
// 		this.isFirstMove = true;
// 	}
// 	static activate(offsetX, offsetY) {
// 		taps.push(new Click(offsetX, offsetY));
// 		if (offsetX < lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(0);
// 		if (offsetX > canvasos.width - lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(1);
// 		if (offsetX < lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(2);
// 		if (offsetX > canvasos.width - lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(3);
// 		if (qwqEnd.second > 0) qwq[3] = qwq[3] > 0 ? -qwqEnd.second : qwqEnd.second;
// 		return new Click(offsetX, offsetY);
// 	}
	
// 	move(offsetX, offsetY) {
// 		//this.isMoving = false;
// 		this.isMoving = true;
// 		if (this.isFirstMove) this.canFlick = true;
// 		else this.movingTimew += 1;
// 		if (!isNaN(Number(this.movejlX)) && this.movejlX < this.moveSpeed) {
// 			this.movejlX += Math.abs(this.oldOffsetX - this.offsetX);
// 		} else {
// 			this.movejlX = 0;
// 			this.canFlick = true;
// 		}
// 		if (!isNaN(Number(this.movejlY)) && this.movejlY < this.moveSpeed) {
// 			this.movejlY += Math.abs(this.oldOffsetY - this.offsetY);
// 		} else {
// 			this.movejlY = 0;
// 			this.canFlick = true;
// 		}
// 		// 要用速度
// 		console.log(this.movejlX, this.movejlY, this.canFlick)
// 		this.oldOffsetX = this.offsetX;
// 		this.oldOffsetY = this.offsetY;
// 		this.offsetX = Number(offsetX);
// 		this.offsetY = Number(offsetY);
// 		console.log(this.oldOffsetX, this.oldOffsetY, this.offsetX, this.offsetY);
// 		//this.canFlick = true;
// 		this.time = 0;
// 		//klkl..
// 		this.isFirstMove = false;
// 		if (this.movingTimew >= 3 /* || this.movejlX > this.moveSpeed * 2 || this.movejlY > this.moveSpeed * 2*/) {
// 			this.movingTimew = 0;
// 			this.movejlX = 0;
// 			this.movejlY = 0;
// 			this.canFlick = false;
// 		}
// 		clickEvents0.push(ClickEvent0.getClickHold(this.offsetX, this.offsetY));
// 	}
	
// 	animate() {
// 		if (!this.time++) {
// 			if (this.canFlick) {clickEvents0.push(ClickEvent0.getClickMove(this.offsetX, this.offsetY));this.movingTimew = 0;this.movejlX = 0;this.movejlY = 0;this.canFlick = false;}
// 			else if (this.isMoving) clickEvents0.push(ClickEvent0.getClickHold(this.offsetX, this.offsetY));
// 			else clickEvents0.push(ClickEvent0.getClickTap(this.offsetX, this.offsetY));
// 		} else {
// 			clickEvents0.push(ClickEvent0.getClickHold(this.offsetX, this.offsetY));
// 		}
// 	}
// }
class Click {
	constructor(offsetX, offsetY) {
		this.offsetX = Number(offsetX);
		this.offsetY = Number(offsetY);
		this.isMoving = false;
		this.time = 0;
		this.lastDeltaX = 0;
		this.lastDeltaY = 0;
		this.nowDeltaX = 0;
		this.nowDeltaY = 0;
		this.deltaTime = 0; //按下时间差
		this.currentTime = performance.now(); //按下时间
		this.flicking = false; //是否触发Flick判定
		this.flicked = false; //是否触发过Flick判定
		// 结算时下部按钮
		if (nowShowing === "play" && fucktemp2 && qwqEnd.second >= 3.5) {
			const qwq0 = (canvasos.width - canvasos.height / 3.7320508075688776) / (16 - 9 / 3.7320508075688776);
			// console.log(this.offsetX, this.offsetY);
			if (
				// 重开
				this.offsetY >= canvasos.height - (qwq0 / 120) * 80
				&& this.offsetY <= canvasos.height
				&& this.offsetX <= 500 * (qwq0 / 120)
				&& this.offsetX >= 250 * (qwq0 / 120)
			) {
				btnPause.classList.remove("disabled");
				replay()
			}
			else if (
				// 返回
				this.offsetY >= canvasos.height - (qwq0 / 120) * 80
				&& this.offsetY <= canvasos.height
				&& this.offsetX >= 1500 * (qwq0 / 120)
				&& this.offsetX <= 1700 * (qwq0 / 120)
			) console.log("exit");
		} else if (nowShowing === "play" && isPaused && !timeBeforeBegin) {
			if (
				// 返回
				this.offsetY >= canvasos.height / 2 - lineScale * 0.65
				&& this.offsetY <= canvasos.height / 2 + lineScale * 0.6
				&& this.offsetX <= canvasos.width / 2 - lineScale * 1.9
				&& this.offsetX >= canvasos.width / 2 - lineScale * 3.15
			) console.log("exit");
			else if (
				// 重开
				this.offsetY >= canvasos.height / 2 - lineScale * 0.65
				&& this.offsetY <= canvasos.height / 2 + lineScale * 0.6
				&& this.offsetX <= canvasos.width / 2 + lineScale * 0.6
				&& this.offsetX >= canvasos.width / 2 - lineScale * 0.65
			) {
				btnPause.classList.remove("disabled");
				replay()
			} else if (
				// 继续
				this.offsetY >= canvasos.height / 2 - lineScale * 0.65
				&& this.offsetY <= canvasos.height / 2 + lineScale * 0.6
				&& this.offsetX <= canvasos.width / 2 + lineScale * 3.5
				&& this.offsetX >= canvasos.width / 2 + lineScale * 2.25
			) btnPause.click();
		} else if (nowShowing === "songSelect") {
			const qwq0 = (canvasos.width - canvasos.height / 3.7320508075688776) / (16 - 9 / 3.7320508075688776);
			if (
				// 设置
				this.offsetY >= canvasos.height - (qwq0 / 120) * 80
				&& this.offsetY <= canvasos.height
				&& this.offsetX <= 500 * (qwq0 / 120)
				&& this.offsetX >= 250 * (qwq0 / 120)
			) console.log("settings");
			else if (
				// 返回
				this.offsetY >= canvasos.height - (qwq0 / 120) * 80
				&& this.offsetY <= canvasos.height
				&& this.offsetX >= 1500 * (qwq0 / 120)
				&& this.offsetX <= 1700 * (qwq0 / 120)
			) startPlayBtn.click();
		}
	}
	static activate(offsetX, offsetY) {
		taps.push(new Click(offsetX, offsetY));
		if (offsetX < lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(0);
		if (offsetX > canvasos.width - lineScale * 1.5 && offsetY < lineScale * 1.5) specialClick.click(1);
		if (offsetX < lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(2);
		if (offsetX > canvasos.width - lineScale * 1.5 && offsetY > canvasos.height - lineScale * 1.5) specialClick.click(3);
		if (qwqEnd.second > 0) qwq[3] = qwq[3] > 0 ? -qwqEnd.second : qwqEnd.second;
		return new Click(offsetX, offsetY);
	}
	move(offsetX, offsetY) {
		this.lastDeltaX = this.nowDeltaX;
		this.lastDeltaY = this.nowDeltaY;
		this.nowDeltaX = offsetX - this.offsetX;
		this.nowDeltaY = offsetY - this.offsetY;
		this.offsetX = Number(offsetX);
		this.offsetY = Number(offsetY);
		this.isMoving = true;
		this.time = 0;
		const time = performance.now();
		this.deltaTime = time - this.currentTime;
		this.currentTime = time;
		const flickSpeed = (this.nowDeltaX * this.lastDeltaX + this.nowDeltaY * this.lastDeltaY) / Math.sqrt(this.lastDeltaX ** 2 + this.lastDeltaY ** 2) / this.deltaTime;
		if (this.flicking && flickSpeed < 0.50) {
			this.flicking = false;
			this.flicked = false;
		} else if (!this.flicking && flickSpeed > 1.00) this.flicking = true;
	}
	animate() {
		if (!this.time++) {
			if (this.flicking) clickEvents0.push(ClickEvent0.getClickMove(this.offsetX, this.offsetY));
			else clickEvents0.push(ClickEvent0.getClickTap(this.offsetX, this.offsetY));
		} else clickEvents0.push(ClickEvent0.getClickHold(this.offsetX, this.offsetY));
	}
}
class Judgement {
	constructor(offsetX, offsetY, type) {
		if (autoplay.checked) {
			this.offsetX = Number(offsetX);
			this.offsetY = Number(offsetY);
		} else switch (selectflip.value) {
			case "br":
				this.offsetX = Number(offsetX);
				this.offsetY = Number(offsetY);
				break;
			case "bl":
				this.offsetX = canvasos.width - Number(offsetX);
				this.offsetY = Number(offsetY);
				break;
			case "tr":
				this.offsetX = Number(offsetX);
				this.offsetY = canvas.height - Number(offsetY);
				break;
			case "tl":
				this.offsetX = canvasos.width - Number(offsetX);
				this.offsetY = canvas.height - Number(offsetY);
				break;
			default:
				throw new Error("Flip Error");
		}
		this.type = Number(type) || 0; //1-Tap,2-Hold,3-Move
		this.catched = false;
	}
	isInArea(x, y, cosr, sinr, hw) {
		return isNaN(this.offsetX + this.offsetY) ? true : Math.abs((this.offsetX - x) * cosr + (this.offsetY - y) * sinr) <= hw;
	}
}
class Judgements extends Array {
	addJudgement(notes, realTime) {
		this.length = 0;
		if (autoplay.checked) {
			for (const i of notes) {
				if (i.scored) continue;
				if (i.type == 1) {
					if (i.realTime - realTime < 0.0) this.push(new Judgement(i.offsetX, i.offsetY, 1)); //0.0
				} else if (i.type == 2) {
					if (i.realTime - realTime < 0.2) this.push(new Judgement(i.offsetX, i.offsetY, 2)); //0.2
				} else if (i.type == 3) {
					if (i.status3) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					else if (i.realTime - realTime < 0.0) this.push(new Judgement(i.offsetX, i.offsetY, 1)); //0.0
				} else if (i.type == 4) {
					if (i.realTime - realTime < 0.2) this.push(new Judgement(i.offsetX, i.offsetY, 3)); //0.2
				}
			}
		} else if (!isPaused) {
			for (const j in mouse) {
				const i = mouse[j];
				if (i instanceof Click) {
					if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					else if (i.flicking) this.push(new Judgement(i.offsetX, i.offsetY, 3));
					else if (i.isMoving) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					//else this.push(new Judgement(i.offsetX, i.offsetY, 1));
				}
			}
			for (const j in touch) {
				const i = touch[j];
				if (i instanceof Click) {
					if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					else if (i.flicking) this.push(new Judgement(i.offsetX, i.offsetY, 3));
					else if (i.isMoving) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					//else this.push(new Judgement(i.offsetX, i.offsetY, 1));
				}
			}
			for (const j in keyboard) {
				const i = keyboard[j];
				if (i instanceof Click) {
					if (i.time) this.push(new Judgement(i.offsetX, i.offsetY, 2));
					else /*if (i.isMoving)*/ this.push(new Judgement(i.offsetX, i.offsetY, 3));
					//else this.push(new Judgement(i.offsetX, i.offsetY, 1));
				}
			}
			for (const i of taps) {
				if (i instanceof Click) this.push(new Judgement(i.offsetX, i.offsetY, 1));
			}
		}
	};
	judgeNote(notes, realTime, width) {
		for (const i of notes) {
			if (i.scored) continue;
			if ((i.realTime - realTime < -(hyperMode.checked ? 0.12 : 0.16) && i.frameCount > (hyperMode.checked ? 3 : 4)) && !i.status2) {
				//console.log("Miss", i.name);
				i.status = 2;
				stat.addCombo(2, i.type);
				i.scored = true;
			} else if (i.type == 1) {
				for (let j = 0; j < this.length; j++) {
					if (this[j].type == 1 && this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && i.realTime - realTime < 0.2 && (i.realTime - realTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
						if (i.realTime - realTime > 0.16 - judgeOffset) {
							if (!this[j].catched) {
								i.status = 6;//console.log("Bad", i.name);
								i.badtime = Date.now();
							}
						} else if (i.realTime - realTime > 0.08 + judgeOffset) {
							i.status = 7;//console.log("Good(Early)", i.name);
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
						} else if (i.realTime - realTime > 0.04 + judgeOffset) {
							i.status = 5;//console.log("Perfect(Early)", i.name);
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
						} else if (i.realTime - realTime > -0.04 + judgeOffset || i.frameCount < 1) {
							i.status = 4;//console.log("Perfect(Max)", i.name);
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
						} else if (i.realTime - realTime > -0.08 + judgeOffset || i.frameCount < 2) {
							i.status = 1;//console.log("Perfect(Late)", i.name);
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							clickEvents1.push( ClickEvent1.getClickPerfect(i.projectX, i.projectY));
						} else {
							i.status = 3;//console.log("Good(Late)", i.name);
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
						}
						if (i.status) {
							stat.addCombo(i.status, 1);
							i.scored = true;
							this.splice(j, 1);
							break;
						}
					}
				}
			} else if (i.type == 2) {
				if (i.status == 4 && i.realTime - realTime < 0) {
					if ($("hitSong").checked) playSound(res["HitSong1"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
					clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
					stat.addCombo(4, 2);
					i.scored = true;
				} else if (!i.status) {
					for (let j = 0; j < this.length; j++) {
						if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && i.realTime - realTime < (hyperMode.checked ? 0.12 : 0.16) && (i.realTime - realTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
							//console.log("Perfect", i.name);
							this[j].catched = true;
							i.status = 4;
							break;
						}
					}
				}
			} else if (i.type == 3) {
				if (i.status3) {
					if ((Date.now() - i.status3) * i.holdTime >= 1.6e4 * i.realHoldTime) { //间隔时间与bpm成反比，待实测
						if (i.status2 % 4 == 0) clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
						else if (i.status2 % 4 == 1) clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
						else if (i.status2 % 4 == 3) clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
						i.status3 = Date.now();
					}
					if (i.realTime + i.realHoldTime - 0.2 < realTime + judgeOffset) {
						if (!i.status) stat.addCombo(i.status = i.status2, 3);
						if (i.realTime + i.realHoldTime < realTime) i.scored = true;
						continue;
					}
				}
				i.status4 = true;
				for (let j = 0; j < this.length; j++) {
					// Hold
					if (!i.status3) {
						if (this[j].type == 1 && this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && i.realTime - realTime < (hyperMode.checked ? 0.12 : 0.16) && (i.realTime - realTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
							if ($("hitSong").checked) playSound(res["HitSong0"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
							if (i.realTime - realTime > 0.08 + judgeOffset) {
								i.status2 = 7;//console.log("Good(Early)", i.name);
								clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
								// setTimeout(() => clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY)), 40);
								i.status3 = Date.now();
							} else if (i.realTime - realTime > 0.04 + judgeOffset) {
								i.status2 = 5;//console.log("Perfect(Early)", i.name);
								clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
								// setTimeout(() => clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY)), 40);
								i.status3 = Date.now();
							} else if (i.realTime - realTime > -0.04 - judgeOffset || i.frameCount < 1) {
								i.status2 = 4;//console.log("Perfect(Max)", i.name);
								clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
								// setTimeout(() => clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY)), 40);
								i.status3 = Date.now();
							} else if (i.realTime - realTime > -0.08 - judgeOffset || i.frameCount < 2) {
								i.status2 = 1;//console.log("Perfect(Late)", i.name);
								clickEvents1.push(hyperMode.checked ? ClickEvent1.getClickGreat(i.projectX, i.projectY) : ClickEvent1.getClickPerfect(i.projectX, i.projectY));
								// setTimeout(() => clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY)), 40);
								i.status3 = Date.now();
							} else {
								i.status2 = 3;//console.log("Good(Late)", i.name);
								clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY));
								// setTimeout(() => clickEvents1.push(ClickEvent1.getClickGood(i.projectX, i.projectY)), 40);
								i.status3 = Date.now();
							}
							this.splice(j, 1);
							i.status4 = false;
							break;
						}
					} else if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width)) i.status4 = false;
				}
				if (!isPaused && i.status3 && i.status4) {
					i.status = 2;//console.log("Miss", i.name);
					stat.addCombo(2, 3);
					i.scored = true;
				}
			} else if (i.type == 4) {
				if (i.status == 4 && i.realTime - realTime < 0) {
					// console.log("flick+1")
					if ($("hitSong").checked) playSound(res["HitSong2"], false, true, 0, localStorage.getItem("input-hitSongVolume"));
					clickEvents1.push(ClickEvent1.getClickPerfect(i.projectX, i.projectY));
					stat.addCombo(4, 4);
					i.scored = true;
				} else if (!i.status) {
					for (let j = 0; j < this.length; j++) {
						if (this[j].isInArea(i.offsetX, i.offsetY, i.cosr, i.sinr, width) && i.realTime - realTime < (hyperMode.checked ? 0.12 : 0.16) && (i.realTime - realTime > -(hyperMode.checked ? 0.12 : 0.16) || i.frameCount < (hyperMode.checked ? 3 : 4))) {
							//console.log("Perfect", i.name);
							this[j].catched = true;
							if (this[j].type == 3) {
								i.status = 4;
								break;
							}
						}
					}
				}
			}
		}
	}
}
const judgements = new Judgements();
class ClickEvents extends Array {
	defilter(func) {
		//var i = this.length;
		let i = this.length;
		while (i--) {
			if (func(this[i])) this.splice(i, 1);
		}
		return this;
	}
}
const clickEvents0 = new ClickEvents(); //存放点击特效
const clickEvents1 = new ClickEvents(); //存放点击特效
class ClickEvent0 {
	constructor(offsetX, offsetY, n1, n2) {
		this.offsetX = Number(offsetX) || 0;
		this.offsetY = Number(offsetY) || 0;
		switch (selectflip.value) {
			case "br":
				this.offsetX = Number(offsetX);
				this.offsetY = Number(offsetY);
				break;
			case "bl":
				this.offsetX = canvasos.width - Number(offsetX);
				this.offsetY = Number(offsetY);
				break;
			case "tr":
				this.offsetX = Number(offsetX);
				this.offsetY = canvas.height - Number(offsetY);
				break;
			case "tl":
				this.offsetX = canvasos.width - Number(offsetX);
				this.offsetY = canvas.height - Number(offsetY);
				break;
			default:
				throw new Error("Flip Error");
		}
		this.color = String(n1);
		this.text = String(n2);
		this.time = 0;
	}
	static getClickTap(offsetX, offsetY) {
		console.log("Tap", offsetX, offsetY);
		return new ClickEvent0(offsetX, offsetY, "cyan", "");
	}
	static getClickHold(offsetX, offsetY) {
		console.log("Hold", offsetX, offsetY);
		return new ClickEvent0(offsetX, offsetY, "lime", "");
	}
	static getClickMove(offsetX, offsetY) {
		console.log("Move", offsetX, offsetY);
		return new ClickEvent0(offsetX, offsetY, "violet", "");
	}
}
class ClickEvent1 {
	constructor(offsetX, offsetY, n1, n2, n3) {
		this.offsetX = Number(offsetX) || 0;
		this.offsetY = Number(offsetY) || 0;
		this.time = Date.now();
		this.duration = 500;
		this.images = res["Clicks"][n1]; //以后做缺少检测
		this.color = String(n3);
		this.rand = Array(Number(n2) || 0).fill().map(() => [Math.random() * 80 + 185, Math.random() * 2 * Math.PI]);
	}
	static getClickPerfect(offsetX, offsetY) {
		return new ClickEvent1(offsetX, offsetY, "rgba(255,236,160,0.8823529)", 4, "#ffeca0");
	}
	static getClickGreat(offsetX, offsetY) {
		return new ClickEvent1(offsetX, offsetY, "rgba(168,255,177,0.9016907)", 4, "#a8ffb1");
	}
	static getClickGood(offsetX, offsetY) {
		return new ClickEvent1(offsetX, offsetY, "rgba(180,225,255,0.9215686)", 3, "#b4e1ff");
	}
}
//适配PC鼠标
const isMouseDown = {};
canvas.addEventListener("mousedown", function (evt) {
	evt.preventDefault();
	const idx = evt.button;
	const dx = (evt.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
	const dy = (evt.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
	mouse[idx] = Click.activate(dx, dy);
	isMouseDown[idx] = true;
});
canvas.addEventListener("mousemove", function (evt) {
	evt.preventDefault();
	for (const idx in isMouseDown) {
		if (isMouseDown[idx]) {
			const dx = (evt.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
			const dy = (evt.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
			//console.log(dx, dy);
			mouse[idx].move(dx, dy);
		}
	}
});
canvas.addEventListener("mouseup", function (evt) {
	evt.preventDefault();
	const idx = evt.button;
	delete mouse[idx];
	delete isMouseDown[idx];
});
canvas.addEventListener("mouseout", function (evt) {
	evt.preventDefault();
	for (const idx in isMouseDown) {
		if (isMouseDown[idx]) {
			delete mouse[idx];
			delete isMouseDown[idx];
		}
	}
});
//适配键盘(喵喵喵?)
window.addEventListener("keydown", function (evt) {
	if (document.activeElement.classList.value == "input") return;
	if (btnPlay.value != "停止") return;
	evt.preventDefault();
	if (evt.key == "Shift" && (!isPaused || !timeBeforeBegin)) btnPause.click();
	else if (keyboard[evt.code] instanceof Click);
	else keyboard[evt.code] = Click.activate(NaN, NaN);
}, false);
window.addEventListener("keyup", function (evt) {
	if (document.activeElement.classList.value == "input") return;
	if (btnPlay.value != "停止") return;
	evt.preventDefault();
	if (evt.key == "Shift");
	else if (keyboard[evt.code] instanceof Click) delete keyboard[evt.code];
}, false);
window.addEventListener("blur", () => {
	for (const i in keyboard) delete keyboard[i]; //失去焦点清除键盘事件
});
//适配移动设备
const passive = { passive: false }; //不加这玩意会出现warning
canvas.addEventListener("touchstart", function (evt) {
	evt.preventDefault();
	for (const i of evt.changedTouches) {
		const idx = i.identifier; //移动端存在多押bug(可能已经解决了？)
		const dx = (i.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
		const dy = (i.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
		touch[idx] = Click.activate(dx, dy);
	}
}, passive);
canvas.addEventListener("touchmove", function (evt) {
	evt.preventDefault();
	for (const i of evt.changedTouches) {
		const idx = i.identifier;
		const dx = (i.pageX - getOffsetLeft(this)) / this.offsetWidth * this.width - (this.width - canvasos.width) / 2;
		const dy = (i.pageY - getOffsetTop(this)) / this.offsetHeight * this.height;
		touch[idx].move(dx, dy);
	}
}, passive);
canvas.addEventListener("touchend", function (evt) {
	evt.preventDefault();
	for (const i of evt.changedTouches) {
		const idx = i.identifier;
		delete touch[idx];
	}
});
canvas.addEventListener("touchcancel", function (evt) {
	evt.preventDefault();
	for (const i of evt.changedTouches) {
		const idx = i.identifier;
		delete touch[idx];
	}
});
//优化触摸定位，以后整合进class
function getOffsetLeft(element) {
	if (!(element instanceof HTMLElement)) return NaN;
	if (full.check(element)) return document.documentElement.scrollLeft;
	let elem = element;
	let a = 0;
	while (elem instanceof HTMLElement) {
		a += elem.offsetLeft;
		elem = elem.offsetParent;
	}
	return a;
}

function getOffsetTop(element) {
	if (!(element instanceof HTMLElement)) return NaN;
	if (full.check(element)) return document.documentElement.scrollTop;
	let elem = element;
	let a = 0;
	while (elem instanceof HTMLElement) {
		a += elem.offsetTop;
		elem = elem.offsetParent;
	}
	return a;
}
//声音组件
const AudioContext = window.AudioContext || window.webkitAudioContext;
const actx = (new Audio()).canPlayType("audio/ogg") == "" ? new oggmented.OggmentedAudioContext() : new AudioContext(); //兼容Safari
const stopPlaying = [];
const gain = actx.createGain();
const playSound = (res, loop, isOut, offset, volume=1) => {
	const gain2 = actx.createGain();
	const bufferSource = actx.createBufferSource();
	bufferSource.buffer = res;
	// bufferSource.value = 0; // 音量
	bufferSource.loop = loop; //循环播放
	gain2.gain.value = volume; // 音量
	bufferSource.connect(gain2);
	if (isOut) gain2.connect(actx.destination);
	bufferSource.start(0, offset);
	return () => bufferSource.stop();
}
const res = {}; //存放资源
// resizeCanvas();
// uploads.classList.add("disabled");
// select.classList.add("disabled");
//初始化
window.onload = function () {
	//加载资源
	(async function () {
		const loadItems={
			JudgeLine: "assets/play/image/JudgeLine.png",
			ProgressBar: `./assets/play/image/ProgressBar.png`,
			SongsNameBar: `./assets/play/image/SongsNameBar.png`,
			Pause: `./assets/play/image/Pause.png`,
			clickRaw: `./assets/play/image/clickRaw.png`,
			Tap: `./assets/play/image/Tap.png`,
			Tap2: `./assets/play/image/Tap2.png`,
			TapHL: `./assets/play/image/TapHL.png`,
			Drag: `./assets/play/image/Drag.png`,
			DragHL: `./assets/play/image/DragHL.png`,
			HoldHead: `./assets/play/image/HoldHead.png`,
			HoldHeadHL: `./assets/play/image/HoldHeadHL.png`,
			Hold: `./assets/play/image/Hold.png`,
			HoldHL: `./assets/play/image/HoldHL.png`,
			HoldEnd: `./assets/play/image/HoldEnd.png`,
			Flick: `./assets/play/image/Flick.png`,
			FlickHL: `./assets/play/image/FlickHL.png`,
			// LevelOver1: "assets/LevelOver1.png",
			// LevelOver3: "assets/LevelOver3.png",
			// LevelOver4: "assets/LevelOver4.png",
			// LevelOver5: "assets/LevelOver5.png",
			Rank: "assets/Rank.png",
			NoImage: "assets/0.png",
			mute: "assets/mute.ogg",
			HitSong0: `./assets/play/sound/HitSong0.ogg`,
			HitSong1: `./assets/play/sound/HitSong1.ogg`,
			HitSong2: `./assets/play/sound/HitSong2.ogg`,
			Resume : "assets/Resume.png",
			Retry : "assets/Retry.png",
			Back : "assets/Back.png",
			snb: "assets/snb.png",
			testAvatar: "../assets/images/avatar/ESM1.png",
			backInResault: "assets/backInResault.png",
		};
		let loadedNum = 0;
		await Promise.all((obj => {
			const arr = [];
			for (const i in obj) arr.push([i, obj[i]]);
			return arr;
		})(loadItems).map(([name, src], _i, arr) => {
			const xhr = new XMLHttpRequest();
			xhr.open("get", src, true);
			xhr.responseType = 'arraybuffer';
			xhr.send();
			return new Promise(resolve => {
				xhr.onload = async () => {
					if (/\.(mp3|wav|ogg)$/i.test(src)) res[name] = await actx.decodeAudioData(xhr.response);
					else if (/\.(png|jpeg|jpg)$/i.test(src)) res[name] = await createImageBitmap(new Blob([xhr.response]));
					message.sendMessage(`加载资源：${Math.floor(++loadedNum / arr.length * 100)}%`);
					window.ResourcesLoad=Math.floor(++loadedNum / arr.length * 100);
					resolve();
				};
			});
		}));
		res["JudgeLineAu"] = await createImageBitmap(imgShader(res["JudgeLine"], "#a2ffee"));
		res["JudgeLineMP"] = isAutoplay ? res["JudgeLineAu"] : await createImageBitmap(imgShader(res["JudgeLine"], "#feffa9"));
		res["JudgeLineAP"] = isAutoplay ? res["JudgeLineAu"] : await createImageBitmap(imgShader(res["JudgeLine"], "#a3ffac"));
		res["JudgeLineFC"] = isAutoplay ? res["JudgeLineAu"] : await createImageBitmap(imgShader(res["JudgeLine"], "#a2eeff"));
		res["TapBad"] = await createImageBitmap(imgShader(res["Tap2"], "#6c4343"));
		//res["btnRD"] = await createImageBitmap(res["Tap2"]);
		res["Clicks"] = {};
		//res["Clicks"].default = await qwqImage(res["clickRaw"], "white");
		res["Ranks"] = await qwqImage(res["Rank"], "white");
		res["Clicks"]["rgba(255,236,160,0.8823529)"] = await qwqImage(res["clickRaw"], "rgba(255,236,160,0.8823529)"); //#fce491
		res["Clicks"]["rgba(168,255,177,0.9016907)"] = await qwqImage(res["clickRaw"], "rgba(168,255,177,0.9016907)"); //#97f79d
		res["Clicks"]["rgba(180,225,255,0.9215686)"] = await qwqImage(res["clickRaw"], "rgba(180,225,255,0.9215686)"); //#9ed5f3
		message.sendMessage("等待上传文件...");
		console.log("1");
		//$('tapToStartFrame').click();
		//$('btn-play').click();
		
		//$('btn-play').click();
	})();
}
async function qwqImage(img, color) {
	const clickqwq = imgShader(img, color);
	const arr = [];
	const min = Math.min(img.width, img.height);
	const max = Math.max(img.width, img.height);
	for (let i = 0; i < parseInt(max / min); i++) arr[i] = await createImageBitmap(clickqwq, 0, i * min, min, min);
	return arr;
}
//必要组件
let stopDrawing;
const stat = {
	noteRank: [0, 0, 0, 0, 0, 0, 0, 0],
	combos: [0, 0, 0, 0, 0],
	maxcombo: 0,
	combo: 0,
	discombo: 0, // 断连
	lastcombo: 0,
	get good() {
		return this.noteRank[7] + this.noteRank[3];
	},
	get bad() {
		return this.noteRank[6] + this.noteRank[2];
	},
	get great() {
		return this.noteRank[5] + this.noteRank[1];
	},
	get perfect() {
		return this.noteRank[4] + this.great;
	},
	get all() {
		return this.perfect + this.good + this.bad;
	},
	get scoreNum() {
		const a = 1e6 * (this.perfect * 0.9 + this.good * 0.585 + this.maxcombo * 0.1) / this.numOfNotes;
		const b = 1e6 * (this.noteRank[4] + this.great * 0.65 + this.good * 0.35) / this.numOfNotes;
		return hyperMode.checked ? (isFinite(b) ? b : 0) : (isFinite(a) ? a : 0);
	},
	get scoreStr() {
		const a = this.scoreNum.toFixed(0);
		return ("0").repeat(a.length < 7 ? 7 - a.length : 0) + a;
	},
	get accNum() {
		const a = (this.perfect + this.good * 0.65) / this.all;
		const b = (this.noteRank[4] + this.great * 0.65 + this.good * 0.35) / this.all;
		return hyperMode.checked ? (isFinite(b) ? b : 0) : (isFinite(a) ? a : 0);
	},
	get accStr() {
		return (100 * this.accNum).toFixed(2) + "%";
	},
	get lineStatus() {
		if (this.bad) return 0;
		if (this.good) return 3;
		if (this.great && hyperMode.checked) return 2;
		return 1;
	},
	get rankStatus() {
		const a = Math.round(this.scoreNum);
		if (a >= 1e6) return 0;
		if (this.lineStatus === 3) return 1;
		if (a >= 9.6e5) return 2;
		if (a >= 9.2e5) return 3;
		if (a >= 8.8e5) return 4;
		if (a >= 8.2e5) return 5;
		if (a >= 7e5) return 6;
		return 7;
	},
	get localData() {
		const l1 = Math.round(this.accNum * 1e4 + 566).toString(22).slice(-3);
		const l2 = Math.round(this.scoreNum + 40672).toString(32).slice(-4);
		const l3 = (Number(inputLevel.value.match(/\d+$/))).toString(36).slice(-1);
		return l1 + l2 + l3;
	},
	getData(isAuto) {
		const s1 = this.data[this.id].slice(0, 3);
		const s2 = this.data[this.id].slice(3, 7);
		const l1 = Math.round(this.accNum * 1e4 + 566).toString(22).slice(-3);
		const l2 = Math.round(this.scoreNum + 40672).toString(32).slice(-4);
		const l3 = (Number(inputLevel.value.match(/\d+$/))).toString(36).slice(-1);
		const a = (parseInt(s2, 32) - 40672).toFixed(0);
		const scoreBest = ("0").repeat(a.length < 7 ? 7 - a.length : 0) + a;
		if (!isAuto) this.data[this.id] = (s1 > l1 ? s1 : l1) + (s2 > l2 ? s2 : l2) + l3;
		const arr = [];
		for (const i in this.data) arr.push(i + this.data[i]);
		localStorage.setItem("phi", arr.sort(() => Math.random() - 0.5).join(""));
		if (isAuto) return [false, scoreBest, "", true];
		return [s2 < l2, scoreBest, (s2 > l2 ? "- " : "+ ") + Math.abs(scoreBest - this.scoreStr), false];
	},
	reset(numOfNotes, id) {
		this.numOfNotes = Number(numOfNotes) || 0;
		this.combo = 0;
		this.maxcombo = 0;
		this.discombo = 0;
		this.lastcombo = 0;
		this.noteRank = [0, 0, 0, 0, 0, 0, 0, 0];//4:PM,5:PE,1:PL,7:GE,3:GL,6:BE,2:BL
		this.combos = [0, 0, 0, 0, 0]; //不同种类note实时连击次数
		this.data = {};
		if (localStorage.getItem("phi") == null) localStorage.setItem("phi", ""); //初始化存储
		const str = localStorage.getItem("phi");
		for (let i = 0; i < parseInt(str.length / 40); i++) {
			const data = str.slice(i * 40, i * 40 + 40);
			this.data[data.slice(0, 32)] = data.slice(-8);
		}
		if (id) {
			if (!this.data[id]) this.data[id] = this.localData;
			this.id = id;
		}
	},
	addCombo(status, type) {
		this.noteRank[status]++;
		this.combo = status % 4 == 2 ? 0 : this.combo + 1;
		if (this.combo > this.maxcombo) this.maxcombo = this.combo;
		this.combos[0]++;
		this.combos[type]++;
		if (stat.combo < stat.lastcombo) stat.discombo += 1;
		stat.lastcombo = stat.combo;
	}
}
//const stat = new Stat();
const comboColor = ["#fff", "#0ac3ff", "#f0ed69", "#a0e9fd", "#fe4365"];

const time2Str = time => `${parseInt(time / 60)}:${`00${parseInt(time % 60)}`.slice(-2)}`;
const frameTimer = { //计算fps
	tick: 0,
	//time: Date.now(),
	time: performance.now(),
	fps: "",
	addTick(fr = 10) {
		if (++this.tick >= fr) {
			this.tick = 0;
			//this.fps = (1e3 * fr / (-this.time + (this.time = Date.now()))).toFixed(0);
			this.fps = (1e3 * fr / (-this.time + (this.time = performance.now()))).toFixed(0);
		}
		return this.fps;
	}
}
class Timer {
	constructor() {
		this.reset();
	}
	play() {
		if (!this.isPaused) throw new Error("Time has been playing");
		this.t1 = Date.now();
		this.isPaused = false;
	}
	pause() {
		if (this.isPaused) throw new Error("Time has been paused");
		this.t0 = this.time;
		this.isPaused = true;
	}
	reset() {
		this.t0 = 0;
		this.t1 = 0;
		this.isPaused = true;
	}
	addTime(num) {
		this.t0 += num;
	}
	get time() {
		if (this.isPaused) return this.t0;
		return this.t0 + Date.now() - this.t1;
	}
	get second() {
		return this.time / 1e3;
	}
}
let curTime = 0;
let curTimestamp = 0;
let timeBgm = 0;
let timeChart = 0;
let duration = 0;
let isInEnd = false; //开头过渡动画
let isOutStart = false; //结尾过渡动画
let isOutEnd = false; //临时变量
let isPaused = true; //暂停

//note预处理
function prerenderChart(chart) {
	const chartOld = JSON.parse(JSON.stringify(chart));
	const chartNew = chartOld;
	//优化events
	for (const LineId in chartNew.judgeLineList) {
		const i = chartNew.judgeLineList[LineId];
		i.lineId = LineId;
		i.offsetX = 0;
		i.offsetY = 0;
		i.alpha = 0;
		i.rotation = 0;
		i.positionY = 0; //临时过渡用
		i.images = [res["JudgeLine"], res["JudgeLineMP"], res["JudgeLineAP"], res["JudgeLineFC"], res["JudgeLineAu"]];
		i.imageH = 0.008;
		i.imageW = 1.042;
		i.imageB = 0;
		i.speedEvents = addRealTime(arrangeSpeedEvent(i.speedEvents), i.bpm);
		i.judgeLineDisappearEvents = addRealTime(arrangeLineEvent(i.judgeLineDisappearEvents), i.bpm);
		i.judgeLineMoveEvents = addRealTime(arrangeLineEvent(i.judgeLineMoveEvents), i.bpm);
		i.judgeLineRotateEvents = addRealTime(arrangeLineEvent(i.judgeLineRotateEvents), i.bpm);
		Renderer.lines.push(i);
		for (const NoteId in i.notesAbove) addNote(i.notesAbove[NoteId], 1.875 / i.bpm, LineId, NoteId, true);
		for (const NoteId in i.notesBelow) addNote(i.notesBelow[NoteId], 1.875 / i.bpm, LineId, NoteId, false);
	}
	const sortNote = (a, b) => a.realTime - b.realTime || a.lineId - b.lineId || a.noteId - b.noteId;
	Renderer.notes.sort(sortNote);
	Renderer.taps.sort(sortNote);
	Renderer.drags.sort(sortNote);
	Renderer.holds.sort(sortNote);
	Renderer.flicks.sort(sortNote);
	Renderer.reverseholds.sort(sortNote).reverse();
	Renderer.tapholds.sort(sortNote);
	//向Renderer添加Note
	function addNote(note, base32, lineId, noteId, isAbove) {
		note.offsetX = 0;
		note.offsetY = 0;
		note.alpha = 0;
		note.rotation = 0;
		note.realTime = note.time * base32;
		note.realHoldTime = note.holdTime * base32;
		note.lineId = lineId;
		note.noteId = noteId;
		note.isAbove = isAbove;
		note.name = `${lineId}${isAbove ? "+" : "-"}${noteId}${" tdhf".split("")[note.type]}`;
		Renderer.notes.push(note);
		if (note.type == 1) Renderer.taps.push(note);
		else if (note.type == 2) Renderer.drags.push(note);
		else if (note.type == 3) Renderer.holds.push(note);
		else if (note.type == 4) Renderer.flicks.push(note);
		if (note.type == 3) Renderer.reverseholds.push(note);
		if (note.type == 1 || note.type == 3) Renderer.tapholds.push(note);
	}
	//合并不同方向note
	for (const i of chartNew.judgeLineList) {
		i.notes = [];
		for (const j of i.notesAbove) {
			j.isAbove = true;
			i.notes.push(j);
		}
		for (const j of i.notesBelow) {
			j.isAbove = false;
			i.notes.push(j);
		}
	}
	//双押提示
	const timeOfMulti = {};
	for (const i of Renderer.notes) timeOfMulti[i.realTime.toFixed(6)] = timeOfMulti[i.realTime.toFixed(6)] ? 2 : 1;
	for (const i of Renderer.notes) i.isMulti = (timeOfMulti[i.realTime.toFixed(6)] == 2);
	return chartNew;
	//规范判定线事件
	function arrangeLineEvent(events) {
		const oldEvents = JSON.parse(JSON.stringify(events)); //深拷贝
		const newEvents = [{ //以1-1e6开头
			startTime: 1 - 1e6,
			endTime: 0,
			start: oldEvents[0] ? oldEvents[0].start : 0,
			end: oldEvents[0] ? oldEvents[0].end : 0,
			start2: oldEvents[0] ? oldEvents[0].start2 : 0,
			end2: oldEvents[0] ? oldEvents[0].end2 : 0
		}];
		oldEvents.push({ //以1e9结尾
			startTime: 0,
			endTime: 1e9,
			start: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].start : 0,
			end: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end : 0,
			start2: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].start2 : 0,
			end2: oldEvents[oldEvents.length - 1] ? oldEvents[oldEvents.length - 1].end2 : 0
		});
		for (const i2 of oldEvents) { //保证时间连续性
			const i1 = newEvents[newEvents.length - 1];
			if (i1.endTime > i2.endTime);
			else if (i1.endTime == i2.startTime) newEvents.push(i2);
			else if (i1.endTime < i2.startTime) newEvents.push({
				startTime: i1.endTime,
				endTime: i2.startTime,
				start: i1.end,
				end: i1.end,
				start2: i1.end2,
				end2: i1.end2
			}, i2);
			else if (i1.endTime > i2.startTime) newEvents.push({
				startTime: i1.endTime,
				endTime: i2.endTime,
				start: (i2.start * (i2.endTime - i1.endTime) + i2.end * (i1.endTime - i2.startTime)) / (i2.endTime - i2.startTime),
				end: i1.end,
				start2: (i2.start2 * (i2.endTime - i1.endTime) + i2.end2 * (i1.endTime - i2.startTime)) / (i2.endTime - i2.startTime),
				end2: i1.end2
			});
		}
		//合并相同变化率事件
		const newEvents2 = [newEvents.shift()];
		for (const i2 of newEvents) {
			const i1 = newEvents2[newEvents2.length - 1];
			const d1 = i1.endTime - i1.startTime;
			const d2 = i2.endTime - i2.startTime;
			if (i2.startTime == i2.endTime);
			else if (i1.end == i2.start && i1.end2 == i2.start2 && (i1.end - i1.start) * d2 == (i2.end - i2.start) * d1 && (i1.end2 - i1.start2) * d2 == (i2.end2 - i2.start2) * d1) {
				i1.endTime = i2.endTime;
				i1.end = i2.end;
				i1.end2 = i2.end2;
			} else newEvents2.push(i2);
		}
		return JSON.parse(JSON.stringify(newEvents2));
	}
	//规范speedEvents
	function arrangeSpeedEvent(events) {
		const newEvents = [];
		for (const i2 of events) {
			const i1 = newEvents[newEvents.length - 1];
			if (!i1 || i1.value != i2.value) newEvents.push(i2);
			else i1.endTime = i2.endTime;
		}
		return JSON.parse(JSON.stringify(newEvents));
	}
	//添加realTime
	function addRealTime(events, bpm) {
		for (const i of events) {
			i.startRealTime = i.startTime / bpm * 1.875;
			i.endRealTime = i.endTime / bpm * 1.875;
			i.startDeg = -Deg * i.start;
			i.endDeg = -Deg * i.end;
		}
		return events;
	}
}
const qwqIn = new Timer();
const qwqOut = new Timer();
const qwqEnd = new Timer();

//暂停监听器
btnPause.addEventListener("click", function () {
	if (this.classList.contains("disabled") || btnPlay.value == "播放") return;
	if (this.value == "暂停") {
		var pauseAudio=document.createElement('audio');
		pauseAudio.src="../assets/audio/Tap6.wav";
		pauseAudio.play();
		qwqIn.pause();
		//document.querySelector('div#pauseOverlay.pauseOverlay').classList.add('visable')
		if (showTransition.checked && isOutStart) qwqOut.pause();
		isPaused = true;
		this.value = "继续";
		curTime = timeBgm;
		while (stopPlaying.length) stopPlaying.shift()();
		pausedMenu();
		// new Notification("Elecphi", {body: "已暂停"});
	} else {
		resumingBeginTime = Date.now();
		timeBeforeBegin = "3";
		//document.querySelector('div#pauseOverlay.pauseOverlay').innerHTML="3";
		//document.querySelector('div#pauseOverlay.pauseOverlay').classList.add('readyToResume');
		setTimeout(() => {
			//document.querySelector('div#pauseOverlay.pauseOverlay').innerHTML="2";
			timeBeforeBegin = "2";
		}, 1000);
		setTimeout(() => {
			//document.querySelector('div#pauseOverlay.pauseOverlay').innerHTML="1";
			timeBeforeBegin = "1";
		}, 2000);
		setTimeout(()=>{
			//document.querySelector('div#pauseOverlay.pauseOverlay').classList.remove('visable');
			qwqIn.play();
			if (showTransition.checked && isOutStart) qwqOut.play();
			isPaused = false;
			if (isInEnd && !isOutStart) playBgm(Renderer.bgMusic, timeBgm);
			this.value = "暂停";
			timeBeforeBegin = null;
			//document.querySelector('div#pauseOverlay.pauseOverlay').innerHTML=
			//`
			//<audio src="../assets/audio/Tap2.wav" id="tap2"></audio>
			//<div id="backBtn" id="backBtn"></div>
			//<div id="restartBtn" onclick="replay()"></div>
			//<div id="resumeBtn" onclick="btnPause.click()"></div>
			//`;
			//document.querySelector('div#pauseOverlay.pauseOverlay').classList.remove('readyToResume');
		},3000);
	}
});
//偏移率调整
inputOffset.addEventListener("input", function () {
	if (this.value < -400) this.value = -400;
	if (this.value > 600) this.value = 600;
});
//播放bgm
function playBgm(data, offset) {
	isPaused = false;
	if (!offset) offset = 0;
	curTimestamp = Date.now();
	stopPlaying.push(playSound(data, false, true, offset, localStorage.getItem("input-songVolume")));
}
let fucktemp = false;
let fucktemp2 = false;
//作图
function loop() {
	if (isPaused && !timeBeforeBegin && pauseButtonsShowed) {
		stopDrawing = requestAnimationFrame(loop); //回调更新动画
		return;
	}
	const now = Date.now();
	//console.log(now)
	//计算时间
	/* if (nowShowing === "songSelect") drawSongSelect();
	else */ if (qwqOut.second < 0.67 /* 去掉0.67即可直接进入结算 */ ) {
		calcqwq(now);
		qwqdraw1(now);
	} else if (!fucktemp) qwqdraw2();
	if (fucktemp2) qwqdraw3(fucktemp2);
	ctx.globalAlpha = 1;
	/*if ($("imageBlur").checked)*/ ctx.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvas, 1.1)); //对背景图片进行模糊处理，注释部分为选择
	//else ctx.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvas, 1.1));
	ctx.fillStyle = "#000";
	ctx.globalAlpha = 0.4;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.globalAlpha = 1;
	ctx.drawImage(canvasos, (canvas.width - canvasos.width) / 2, canvas.height - canvasos.height);
	ctx.fillStyle = "#ccc";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctxos.font = `${lineScale}px Mina`;
	// ctx.fillText(`Perfect -2ms`, (canvas.width + canvasos.width) / 4, canvasos.height - lineScale * 0.66);
	// Copyright
	let y;
	if (!showInfo.checked) {ctx.font = `${lineScale * 0.3}px Mina`;y = canvas.height - lineScale * 0.15;}
	else {ctx.font = `${lineScale * 0.4}px Mina`;y = canvas.height - lineScale * 0.2;}
	ctx.globalAlpha = 0.8;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	if (autoplay.checked !== "6") ctx.fillText(`Elecphi v${APPVERSION} by 飞机上的长电视 with lchzh3473/sim-phi - ${showPlatform}`, (canvas.width + canvasos.width) / 4, y);
	/* ctx.textAlign = "left";
	if (showInfo.checked) {
		ctx.fillText(`Player:${isAutoplay ? "AUTO" : window.localStorage.getItem("playerName")}     Chart: ${$("input-designer").value}     Illustration: ${$("input-illustrator").value}`, (canvas.width + canvasos.width) / 2 - canvasos.width + lineScale * 0.1, y);
	} else {
		ctx.fillText(`Player:${isAutoplay ? "AUTO" : window.localStorage.getItem("playerName")}`, (canvas.width + canvasos.width) / 2 - canvasos.width + lineScale * 0.1, y);
	} */
	stopDrawing = requestAnimationFrame(loop); //回调更新动画
	//return loop()
}

function calcqwq(now) {
	if (!isInEnd && qwqIn.second >= 3) {
		isInEnd = true;
		playBgm(Renderer.bgMusic);
	}
	if (!isPaused && isInEnd && !isOutStart) timeBgm = (now - curTimestamp) / 1e3 + curTime;
	if (timeBgm >= duration) isOutStart = true;
	if (showTransition.checked && isOutStart && !isOutEnd) {
		isOutEnd = true;
		qwqOut.play();
	}
	timeChart = Math.max(timeBgm - Renderer.chart.offset - (Number(inputOffsetValue) / 1e3 || 0), 0);
	//遍历判定线events和Note
	for (const line of Renderer.lines) {
		for (const i of line.judgeLineDisappearEvents) {
			if (timeChart < i.startRealTime) break;
			if (timeChart > i.endRealTime) continue;
			const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
			const t1 = 1 - t2;
			line.alpha = i.start * t1 + i.end * t2;
		}
		for (const i of line.judgeLineMoveEvents) {
			if (timeChart < i.startRealTime) break;
			if (timeChart > i.endRealTime) continue;
			const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
			const t1 = 1 - t2;
			line.offsetX = canvasos.width * (i.start * t1 + i.end * t2);
			line.offsetY = canvasos.height * (1 - i.start2 * t1 - i.end2 * t2);
		}
		for (const i of line.judgeLineRotateEvents) {
			if (timeChart < i.startRealTime) break;
			if (timeChart > i.endRealTime) continue;
			const t2 = (timeChart - i.startRealTime) / (i.endRealTime - i.startRealTime);
			const t1 = 1 - t2;
			line.rotation = i.startDeg * t1 + i.endDeg * t2;
			line.cosr = Math.cos(line.rotation);
			line.sinr = Math.sin(line.rotation);
		}
		for (const i of line.speedEvents) {
			if (timeChart < i.startRealTime) break;
			if (timeChart > i.endRealTime) continue;
			line.positionY = (timeChart - i.startRealTime) * i.value + i.floorPosition;
		}
		for (const i of line.notesAbove) {
			i.cosr = line.cosr;
			i.sinr = line.sinr;
			setAlpha(i, wlen2 * i.positionX, hlen2 * getY(i));
		}
		for (const i of line.notesBelow) {
			i.cosr = -line.cosr;
			i.sinr = -line.sinr;
			setAlpha(i, -wlen2 * i.positionX, hlen2 * getY(i));
		}

		function getY(i) {
			if (!i.badtime) return realgetY(i);
			if (Date.now() - i.badtime > 500) delete i.badtime;
			if (!i.badY) i.badY = realgetY(i);
			return i.badY;
		}

		function realgetY(i) {
			if (i.type != 3) return (i.floorPosition - line.positionY) * i.speed;
			if (i.realTime < timeChart) return (i.realTime - timeChart) * i.speed;
			return i.floorPosition - line.positionY;
		}

		function setAlpha(i, dx, dy) {
			i.projectX = line.offsetX + dx * i.cosr;
			i.offsetX = i.projectX + dy * i.sinr;
			i.projectY = line.offsetY + dx * i.sinr;
			i.offsetY = i.projectY - dy * i.cosr;
			//i.visible = Math.abs(i.offsetX - wlen) + Math.abs(i.offsetY - hlen) < wlen * 1.23625 + hlen + hlen2 * i.realHoldTime * i.speed;
			i.visible = Math.hypot(i.offsetX - wlen, i.offsetY - hlen) < wlen * 1.23625 + hlen + hlen2 * i.realHoldTime * i.speed; //* config.speed;
			if (i.badtime) i.alpha = 1 - range((Date.now() - i.badtime) / 500);
			else if (i.realTime > timeChart) {
				if (dy > -1e-3 * hlen2) i.alpha = (i.type == 3 && i.speed == 0) ? 0 : 1;
				else i.alpha = 0;
				//i.frameCount = 0;
			} else {
				if (i.type == 3) i.alpha = i.speed == 0 ? 0 : (i.status % 4 == 2 ? 0.45 : 1);
				else i.alpha = Math.max(1 - (timeChart - i.realTime) / (hyperMode.checked ? 0.12 : 0.16), 0); //过线后0.16s消失
				i.frameCount = isNaN(i.frameCount) ? 0 : i.frameCount + 1;
			}
		}
	}
	if (isInEnd) {
		judgements.addJudgement(Renderer.notes, timeChart);
		judgements.judgeNote(Renderer.drags, timeChart, canvasos.width * 0.117775);
		judgements.judgeNote(Renderer.flicks, timeChart, canvasos.width * 0.117775);
		judgements.judgeNote(Renderer.tapholds, timeChart, canvasos.width * 0.117775); //播放打击音效和判定
	}
	taps.length = 0; //qwq
	frameTimer.addTick(); //计算fps
	clickEvents0.defilter(i => i.time++ > 0); //清除打击特效
	clickEvents1.defilter(i => now >= i.time + i.duration); //清除打击特效
	for (const i in mouse) mouse[i] instanceof Click && mouse[i].animate();
	for (const i in touch) touch[i] instanceof Click && touch[i].animate();
}

function qwqdraw1(now) {
	ctxos.clearRect(0, 0, canvasos.width, canvasos.height); //重置画面
	ctxos.globalCompositeOperation = "destination-over"; //由后往前绘制
	for (const i of clickEvents1) { //绘制打击特效1
		const tick = (now - i.time) / i.duration;
		ctxos.globalAlpha = 1;
		// ctxos.setTransform(noteScale * 6, 0, 0, noteScale * 6, i.offsetX, i.offsetY); //缩放
		ctxos.setTransform(...imgFlip(noteScale * 6, 0, 0, noteScale * 6, i.offsetX, i.offsetY)); //缩放
		if (selectflip.value[0] == "t") ctxos.transform(-1, 0, 0, -1, 0, 0); //qwq
		ctxos.drawImage(i.images[parseInt(tick * 30)] || i.images[i.images.length - 1], -128, -128); //停留约0.5秒
		ctxos.fillStyle = i.color;
		ctxos.globalAlpha = 1 - tick; //不透明度
		//	溅射效果
		const r3 = 30 * (((0.2078 * tick - 1.6524) * tick + 1.6399) * tick + 0.4988); //方块大小
		for (const j of i.rand) {
			const ds = j[0] * (9 * tick / (8 * tick + 1)); //打击点距离
			ctxos.fillRect(ds * Math.cos(j[1]) - r3 / 2, ds * Math.sin(j[1]) - r3 / 2, r3, r3);
		}
	}
	// 触摸反馈
	if (false) {
		for (const i of clickEvents0) { //绘制打击特效0
			ctxos.globalAlpha = 0.85;
			ctxos.setTransform(...imgFlip(1, 0, 0, 1, i.offsetX, i.offsetY)); //缩放
			ctxos.fillStyle = i.color;
			ctxos.beginPath();
			ctxos.arc(0, 0, lineScale * 0.5, 0, 2 * Math.PI);
			ctxos.fill();
			i.time++;
		}
	}
	if (qwqIn.second >= 3 && qwqOut.second == 0) {
		//绘制note
		for (const i of Renderer.flicks) drawNote(i, timeChart, 4);
		for (const i of Renderer.taps) drawNote(i, timeChart, 1);
		for (const i of Renderer.drags) drawNote(i, timeChart, 2);
		for (const i of Renderer.reverseholds) drawNote(i, timeChart, 3);
	}
	//绘制背景
	if (qwqIn.second >= 2.5) drawLine(stat.lineStatus ? 2 : 1); //绘制判定线(背景前1)
	ctxos.resetTransform();
	ctxos.fillStyle = "#000"; //背景变暗
	ctxos.globalAlpha = selectglobalalpha.value == "" ? 0.6 : selectglobalalpha.value; //背景不透明度
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
	if (qwqIn.second >= 2.5 && !stat.lineStatus) drawLine(0); //绘制判定线(背景后0)
	ctxos.globalAlpha = 1;
	ctxos.resetTransform();
	ctxos.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvasos, 1));
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
	ctxos.globalCompositeOperation = "source-over";
	//绘制进度条
	ctxos.setTransform(canvasos.width / 1920, 0, 0, canvasos.width / 1920, 0, lineScale * (qwqIn.second < 0.67 ? (tween[2](qwqIn.second * 1.5) - 1) : -tween[2](qwqOut.second * 1.5)) * 1.75);
	ctxos.drawImage(res["ProgressBar"], timeBgm / duration * 1920 - 1920, 0);
	//绘制文字
	ctxos.resetTransform();
	ctxos.fillStyle = "#fff";
	//开头过渡动画
	if (qwqIn.second < 3) {
		if (qwqIn.second < 0.67) ctxos.globalAlpha = tween[2](qwqIn.second * 1.5);
		else if (qwqIn.second >= 2.5) ctxos.globalAlpha = tween[2](6 - qwqIn.second * 2);
		ctxos.textAlign = "center";
		//歌名
		ctxos.textBaseline = "alphabetic";
		ctxos.font = `${lineScale * 1}px Mina`;
		ctxos.fillText(inputName.value || inputName.placeholder, wlen, hlen * 0.75);
		//曲绘和谱师
		ctxos.textBaseline = "top";
		ctxos.font = `${lineScale * 0.4}px Mina`;
		ctxos.fillText(`Illustration designed by ${$("input-illustrator").value}`, wlen, hlen * 1.25 + lineScale * 0.15);
		ctxos.fillText(`Level designed by ${$("input-designer").value}`, wlen, hlen * 1.25 + lineScale * 1.0);
		//判定线(装饰用)
		ctxos.globalAlpha = 1;
		ctxos.setTransform(1, 0, 0, 1, wlen, hlen);
		const imgW = lineScale * 48 * (qwqIn.second < 0.67 ? tween[3](qwqIn.second * 1.5) : 1);
		const imgH = lineScale * 0.15;
		if (qwqIn.second >= 2.5) ctxos.globalAlpha = tween[2](6 - qwqIn.second * 2);
		ctxos.drawImage(lineColor.checked ? res["JudgeLineMP"] : res["JudgeLine"], -imgW / 2, -imgH / 2, imgW, imgH);
	}
	//绘制分数和combo以及暂停按和acc
	ctxos.globalAlpha = 1;
	ctxos.setTransform(1, 0, 0, 1, 0, lineScale * (qwqIn.second < 0.67 ? (tween[2](qwqIn.second * 1.5) - 1) : -tween[2](qwqOut.second * 1.5)) * 1.75);
	ctxos.textBaseline = "alphabetic";
	ctxos.font = `${lineScale * 0.95}px Mina`;
	ctxos.textAlign = "right";
	if(stat.noteRank[2] + stat.noteRank[6] > 6) ctxos.fillStyle = "#fcc";
	//if(stat.scoreNum > Number(window.localStorage.getItem(new URLSearchParams(new URL(location.href).search).get('play')))) ctxos.fillStyle = "#6cf";
	ctxos.fillText(`${stat.scoreStr}`, canvasos.width - lineScale * 0.65, lineScale * 1.375);
	ctxos.font = `${lineScale * 0.6}px Mina`;
	ctxos.fillStyle = "#fff";
	//ctxos.textAlign = "center";
	if(stat.noteRank[5] + stat.noteRank[7] > stat.noteRank[1] + stat.noteRank[3])ctxos.fillStyle = "#0f0";
	if(stat.noteRank[5] + stat.noteRank[7] < stat.noteRank[1] + stat.noteRank[3])ctxos.fillStyle = "#6cf";
	ctxos.fillText(`${isAutoplay ? "AUTOPLAY" : stat.accStr}`, canvasos.width - lineScale * 0.65, lineScale * 2);
	ctxos.fillStyle = "#fff";
	ctxos.drawImage(res["Pause"], lineScale * 0.6, lineScale * 0.7, lineScale * 0.63, lineScale * 0.7);
	if (isPaused) {
		ctxos.textAlign = "center";	
		ctxos.font = `${lineScale * 1.32}px Mina`;
		ctxos.fillText(stat.combo > 2 ? stat.combo : "!", wlen, lineScale * 1.375);
		ctxos.globalAlpha = qwqIn.second < 0.67 ? tween[2](qwqIn.second * 1.5) : (1 - tween[2](qwqOut.second * 1.5));
		ctxos.font = `${lineScale * 0.5}px Mina`;
		ctxos.fillText("PAUSED", wlen, lineScale * 2.05);
	} else if (stat.combo > 2 && !isAutoplay) {
		ctxos.textAlign = "center";
		ctxos.font = `${lineScale * 1.32}px Mina`;
		ctxos.fillText(stat.combo, wlen, lineScale * 1.375);
		// if (stat.combo < stat.lastcombo) stat.discombo += 1;
		// stat.lastcombo = stat.combo;
		ctxos.globalAlpha = qwqIn.second < 0.67 ? tween[2](qwqIn.second * 1.5) : (1 - tween[2](qwqOut.second * 1.5));
		ctxos.font = `${lineScale * 0.5}px Mina`;
		ctxos.fillText(autoplay.checked === "y" ? "AUTOPLAY" : "COMBO", wlen, lineScale * 2.05);
	}
	//绘制歌名和等级
	ctxos.globalAlpha = 1;
	// ctxos.setTransform(1, 0, 0, 1, 0, lineScale * (qwqIn.second < 0.67 ? (1 - tween[2](qwqIn.second * 1.5)) : tween[2](qwqOut.second * 1.5)) * 1.75);
	ctxos.textBaseline = "alphabetic";
	ctxos.textAlign = "left";
	ctxos.font = `${lineScale * 0.45}px Mina`;
	ctxos.fillText(inputLevel.value || inputLevel.placeholder, lineScale * 2.3, lineScale * 1.75);
	ctxos.drawImage(res["SongsNameBar"], lineScale * 2, lineScale * 0.7, lineScale * 0.119, lineScale * 0.62);
	// ctxos.textAlign = "left";
	// const dxsnm = ctxos.measureText(inputName.value || inputName.placeholder).width;
	// if (dxsnm > wlen - lineScale) ctxos.font = `${(lineScale) * 0.63/dxsnm*(wlen - lineScale )}px Mina`;
	ctxos.font = `${lineScale * 0.65}px Mina`;
	ctxos.fillText(inputName.value || inputName.placeholder, lineScale * 2.3, lineScale * 1.24);
	ctxos.resetTransform();
	//绘制时间和帧率以及note打击数
	if (qwqIn.second < 0.67) ctxos.globalAlpha = tween[2](qwqIn.second * 1.5);
	else ctxos.globalAlpha = 1 - tween[2](qwqOut.second * 1.5);
	ctxos.textBaseline = "middle";
	ctxos.font = `${lineScale * 0.4}px Mina`;
	if (showInfo.checked) {
		ctxos.textAlign = "left";
		ctxos.fillText(`${((timeBgm  /duration) * 100).toFixed(1)}% ${time2Str(timeBgm)}/${time2Str(duration)} ${time2Str(duration - timeBgm)} LEFT`, lineScale * 0.05, lineScale * 0.4);
		ctxos.textAlign = "right";
		ctxos.fillText(frameTimer.fps, canvasos.width - lineScale * 0.05, lineScale * 0.5);
	}
	ctxos.textBaseline = 'alphabetic';
	if (/* showPoint.checked */true) stat.combos.forEach((val, idx) => {
		ctxos.fillStyle = comboColor[idx];
		ctxos.fillText(val, lineScale * idx * 1.1 + lineScale * 0.25, canvasos.height - lineScale * 0.1);
	});
	//判定线函数，undefined/0:默认,1:非,2:恒成立
	function drawLine(bool) {
		ctxos.globalAlpha = 1;
		const tw = 1 - tween[2](qwqOut.second * 1.5);
		for (const i of Renderer.lines) {
			if (bool ^ i.imageB && qwqOut.second < 0.67) {
				if (i.alpha === 0) continue;
				ctxos.globalAlpha = i.alpha;
				// ctxos.setTransform(i.cosr * tw, i.sinr, -i.sinr * tw, i.cosr, wlen + (i.offsetX - wlen) * tw, i.offsetY); //hiahiah
				ctxos.setTransform(...imgFlip(i.cosr * tw, i.sinr, -i.sinr * tw, i.cosr, wlen + (i.offsetX - wlen) * tw, i.offsetY)); //hiahiah
				const imgH = i.imageH > 0 ? lineScale * 18.75 * i.imageH : canvasos.height * -i.imageH; // hlen*0.008
				const imgW = imgH * i.images[0].width / i.images[0].height * i.imageW; //* 38.4*25 * i.imageH* i.imageW; //wlen*3
				ctxos.drawImage(i.images[lineColor.checked ? stat.lineStatus : 0], -imgW / 2, -imgH / 2, imgW, imgH);
			}
		}
	}
	// 绘制恢复剩余时间
	if (timeBeforeBegin && isPaused) {
		pauseButtonsShowed = false;
		ctxos.fillStyle = "#000"; //背景变暗
		ctxos.globalAlpha = 0.6 - (now - resumingBeginTime) * 0.0002; //背景不透明度
		ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
		ctxos.globalAlpha = 1;
		ctxos.fillStyle = "#fff";
		ctxos.textAlign = "center";
		ctxos.textBaseline = "middle";
		ctxos.font = `${lineScale * 2}px Mina`;
		ctxos.fillText(timeBeforeBegin, canvasos.width / 2, canvasos.height / 2);
	} /* else if (isPaused) {
		// todo
		ctxos.fillStyle = "#000"; //背景变暗
		ctxos.globalAlpha = 0.7; //背景不透明度
		ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
		ctxos.globalAlpha = 1;
		ctxos.fillStyle = "#fff";
		// 
		ctxos.drawImage(res["Back"],
			canvasos.width / 2 - lineScale * 3.15,
			canvasos.height / 2 - lineScale * 0.65,
			lineScale * 1,
			lineScale * 1.25
		);
		ctxos.drawImage(res["Retry"],
			canvasos.width / 2 - lineScale * 0.65,
			canvasos.height / 2 - lineScale * 0.65,
			lineScale * 1.25,
			lineScale * 1.3
		);
		ctxos.drawImage(res["Resume"],
			canvasos.width / 2 + lineScale * 2.25,
			canvasos.height / 2 - lineScale * 0.65,
			lineScale * 1.25,
			lineScale * 1.3
		);
		pauseButtonsShowed = true;
	} */
}

//	结束处理 
function qwqdraw2() {
	//	直接跳转到LevelOver
	//location.href=`../LevelOver/index.html?play=${new URLSearchParams(new URL(location.href).search).get('play')}&l=${new URLSearchParams(new URL(location.href).search).get('l')}&score=${stat.scoreStr}&mc=${stat.maxcombo}&p=${stat.noteRank[5]+stat.noteRank[4]+stat.noteRank[1]}&g=${stat.noteRank[7]+stat.noteRank[3]}&b=${stat.noteRank[6]}&e=${stat.noteRank[7]}&m=${stat.noteRank[2]}&c=${new URLSearchParams(new URL(location.href).search).get('c')}&ap=${isAutoplay}`;
	//return;
	function scoreChange (score = stat.scoreNum.toFixed(0), accuracy = stat.accNum.toFixed(5) * 100, play = new URLSearchParams(new URL(location.href).search).get('play'), level = new URLSearchParams(new URL(location.href).search).get('l')) {
		if (isAutoplay) {
			window.localStorage.setItem("tmp", "[1000000,100]");
			return;
		};
		if (inputLevel.value === "SP Lv.?") level = "sp";
		var olds = window.localStorage.getItem(`${play}-${level}`);
		window.localStorage.setItem("tmp", olds);
		if (olds === null) {window.localStorage.setItem(`${play}-${level}`, `[${score}, ${accuracy}, ${stat.lineStatus == 3 ? "1" : "0"}]`);window.localStorage.setItem("tmp", "[0,0]");return;}
		olds = JSON.parse(olds);
		if (olds[0] >= score && olds[1] >= accuracy) return;
		let news = [0, 0, 0];
		if (olds[0] < score && olds[1] < accuracy) {news[0] = score;news[1] = accuracy;}
		else if (olds[0] < score && olds[1] >= accuracy) {news[0] = score;news[1] = olds[1];}
		else if (olds[0] >= score && olds[1] < accuracy) {news[0] = olds[0];news[1] = accuracy;};
		window.localStorage.setItem(`${play}-${level}`, `[${olds[0]}, ${olds[1]}, ${stat.lineStatus == 3 ? "1" : "0"}]`);
		// rks
		if (!localStorage.getItem("rankingScores")) localStorage.setItem("rankingScores", "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]");
		if (!localStorage.getItem("20rankingScores")) localStorage.setItem("20rankingScores", "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]");
		let rkss = JSON.parse(localStorage.getItem("rankingScores"));
		let rkss20 = JSON.parse(localStorage.getItem("20rankingScores"));
		rkss[20] = stat.accNum;
		rkss20[20] = stat.accNum;
		for (let i of rkss) {
			if (rkss[i] < rkss[i+1]) {
				let tmp = rkss[i];
				rkss[i] = rkss[i+1];
				rkss[i+1] = tmp;
			}
		}
		rkss.pop(20);
		for (let i of rkss20) {
			if (rkss20[i] < rkss20[i+1]) {
				let tmp = rkss20[i];
				rkss20[i] = rkss20[i+1];
				rkss20[i+1] = tmp;
			}
		}
		rkss20.pop(20);
		// TODO:搞清楚rks咋算
		// localStorage.setItem("rankingScores", rkss);
		// localStorage.setItem("20rankingScores", rkss20);
	};

	fucktemp = true;
	isPaused = true;
	while (stopPlaying.length) stopPlaying.shift()();
	cancelAnimationFrame(stopDrawing);
	btnPause.classList.add("disabled");
	ctxos.globalCompositeOperation = "source-over";
	ctxos.resetTransform();
	ctxos.globalAlpha = 1;
	scoreChange();
	if ($("imageBlur").checked) {
		ctxos.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvasos, 1));
		ctx.drawImage(Renderer.bgImageBlur, ...adjustSize(Renderer.bgImageBlur, canvas, 1));
	} else {
		ctxos.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvasos, 1));
		ctx.drawImage(Renderer.bgImage, ...adjustSize(Renderer.bgImage, canvas, 1));
	}
	ctxos.fillStyle = "#000"; //背景变暗
	ctxos.globalAlpha = selectglobalalpha.value == "" ? 0.6 : selectglobalalpha.value; //背景不透明度
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
	const difficulty = ["ez", "hd", "in", "at"].indexOf(inputLevel.value.slice(0, 2).toLocaleLowerCase());
	const xhr = new XMLHttpRequest();
	xhr.open("get", `assets/play/sound/LevelOver${difficulty < 0 ? 2 : difficulty}_v2.ogg`, true);
	if (inputLevel.value === "SP Lv.?") xhr.open("get", `assets/play/sound/LevelOver2_v2.ogg`, true);
	xhr.responseType = 'arraybuffer';
	xhr.send();
	xhr.onload = async () => {
		const bgm = await actx.decodeAudioData(xhr.response);
		const timeout = setTimeout(() => {
			if (!fucktemp) return;
			stopPlaying.push(playSound(bgm, true, true, 0, localStorage.getItem("input-songVolume")));
			qwqEnd.reset();
			qwqEnd.play();
			//fucktemp2 = stat.getData(autoplay.checked);
			fucktemp2 = true;
		}, 1000);
		stopPlaying.push(() => clearTimeout(timeout));
	}
}

function qwqdraw3(statData) {
	// 结算
	ctxos.resetTransform();
	ctxos.globalCompositeOperation = 'source-over';
	ctxos.clearRect(0, 0, canvasos.width, canvasos.height);
	ctxos.globalAlpha = 1;
	if ($('imageBlur').checked)
		ctxos.drawImage(
			Renderer.bgImageBlur,
			...adjustSize(Renderer.bgImageBlur, canvasos, 1)
		);
	else
		ctxos.drawImage(
			Renderer.bgImage,
			...adjustSize(Renderer.bgImage, canvasos, 1)
		);
	ctxos.fillStyle = '#000'; //背景变暗
	ctxos.globalAlpha =
		selectglobalalpha.value == '' ? 0.6 : selectglobalalpha.value; //背景不透明度
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
	ctxos.globalCompositeOperation = 'destination-out';
	ctxos.globalAlpha = 1;
	const k = 3.7320508075688776; //tan75°
	//ctxos.setTransform(
	//	canvasos.width - canvasos.height / k,
	//	0,
	//	-canvasos.height / k,
	//	canvasos.height,
	//	canvasos.height / k,
	//	0
	//);
	//ctxos.fillRect(
	//	0,
	//	0,
	//	1,
	//	tween[8](range((qwqEnd.second - 0.13) * 0.94))
	//);
	//ctxos.resetTransform();
	ctxos.globalCompositeOperation = 'destination-over';
	const qwq0 = (canvasos.width - canvasos.height / k) / (16 - 9 / k);
	ctxos.setTransform(
		qwq0 / 120,
		0,
		0,
		qwq0 / 120,
		wlen - qwq0 * 8,
		hlen - qwq0 * 4.5
	); //?
	// ctxos.drawImage(res['LevelOver4'], 183, 42, 1184, 228);
	// ctxos.globalAlpha = range((qwqEnd.second - 0.27) / 0.83);
	// ctxos.drawImage(res['LevelOver1'], 102, 378);
	ctxos.globalCompositeOperation = 'source-over';
	ctxos.globalAlpha = 1;
	// ctxos.drawImage(
	// 	res['LevelOver5'],
	// 	700 * tween[8](range(qwqEnd.second * 1.25)) - 369,
	// 	91,
	// 	20,
	// 	80
	// );
	//歌名和等级
	// ctxos.globalAlpha = 0.4;
	ctxos.globalAlpha = range((qwqEnd.second - 0.1) * 2.5) * 0.25;
	ctxos.drawImage(
		res["snb"],
		250,
		110,
		1000,
		70
	);
	ctxos.globalAlpha = range((qwqEnd.second - 2) * 2.5) * 0.25;
	ctxos.drawImage(
		res["snb"],
		1300,
		110,
		400,
		70
	);
	//ctxos.globalAlpha = 1;
	ctxos.globalAlpha = range((qwqEnd.second - 0.15) * 2.5);
	ctxos.fillStyle = '#fff';
	ctxos.textBaseline = 'middle';
	ctxos.textAlign = 'left';
	/* if (inputName.value.length <= 30) ctxos.font = '45px Mina';
	else  */
	ctxos.font = '30px Mina';
	ctxos.fillText(
		inputName.value || inputName.placeholder,
		270,
		145
	);
	ctxos.font = '25px Mina';
	ctxos.textAlign = 'right';
	ctxos.fillText(
		inputLevel.value || inputLevel.placeholder,
		1240,
		160
	);
	if (selectflip.value === "tr" || selectflip.value === "bl") ctxos.fillText(
		"MIRROR",
		1240,
		130
	)
	ctxos.textAlign = 'left';

	/*
	ctxos.drawImage(
		getScaledImage(),
		250,
		200,
		1000,
		600
	);
	*/
	// x, y, 宽度, 长度
		// 绘制曲绘
	ctxos.globalAlpha = range((qwqEnd.second - 0.2) * 2.5);
	ctxos.drawImage(
		getImgScaled(Renderer.bgImage, 1000, 600),
		250,
		190
	);

	//各种数据
	//ctxos.globalAlpha = 0.4;) * 0.25
	ctxos.globalAlpha = range((qwqEnd.second - 0.3) * 2.5) * 0.25;
	ctxos.drawImage(
		res["snb"],
		250,
		850,
		1000,
		80
	);
	ctxos.drawImage(
		res["snb"],
		1300,
		190,
		400,
		741
	);

	// 底部导航栏
	ctxos.globalAlpha = range((qwqEnd.second - 3) * 2.5) * 0.25;
	ctxos.drawImage(
		res["snb"],
		250,
		// 1075 * ((9 / 16) * (canvasos.width / canvasos.height) + 1) / 16 * 9 - 80,     // max 1100
		// 1075 * (0) * 2 - 80,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 80,
		// canvasos.height * 51 / 60500,
		1450,
		80
	);
	ctxos.globalAlpha = range((qwqEnd.second - 3.5) * 2.5);
	ctxos.drawImage(
		res["Retry"],
		275,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 65,
		50,
		50
	);
	ctxos.fillStyle = "#fff";
	ctxos.textAlign = 'left';
	ctxos.font = '40px Mina';
	ctxos.fillText("RETRY", 350, 1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 40);
	ctxos.textAlign = 'right';
	ctxos.fillText("BACK", 1620, 1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 40);
	ctxos.drawImage(
		res["backInResault"],
		1635,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 65,
		50,
		50
	);


	// 用户信息
	ctxos.textAlign = "left";
	ctxos.globalAlpha = range((qwqEnd.second - 2) * 2.5);
	ctxos.drawImage(
		getImgScaled(
			res["testAvatar"],
			100,
			70
		),
		1300,
		110
	);
	ctxos.font = '35px Mina';
	// ctxos.textAlign = "left";
	ctxos.fillText(
		localStorage.getItem("playerName") || "GUEST",
		1420, 130
	)
	// ctxos.textAlign = "right";
	ctxos.font = '20px Mina';
	ctxos.fillText(
		localStorage.getItem("rankingScore") || "0.00",    // rks
		1420, 162.5
	)
	ctxos.textAlign = "right";
	ctxos.fillText(
		localStorage.getItem("20rankingScore") || "0.00",    // rks(近20次)
		1680, 162.5
	)
	ctxos.textAlign = "left";


	//Rank图标
	ctxos.globalAlpha = range((qwqEnd.second - 1.87) * 3.75);
	const qwq2 = 293 + range((qwqEnd.second - 1.87) * 3.75) * 100;
	const qwq3 = (410 - range((qwqEnd.second - 1.87) * 2.14) * 164) * 0.75;
	/* ctxos.drawImage(
		res['LevelOver3'],
		661 - qwq2 / 2,
		545 - qwq2 / 2,
		qwq2,
		qwq2
	); */
	ctxos.drawImage(
		res['Ranks'][stat.rankStatus], //stat.rankStatus
		275 - (qwq3 - 111) / 2,
		800 - (qwq3 - 111) / 2,
		qwq3,
		qwq3
	);
	// console.log(qwq3)

	ctxos.globalAlpha = 1;
	let lastBest = window.localStorage.getItem("tmp");
	if (lastBest === null) {
		lastBest = [0,0];
	} else {
		lastBest = JSON.parse(lastBest);
	};
	ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillStyle = lastBest[0] < stat.scoreNum && !isAutoplay ? '#18ffbf' : '#fff';
	ctxos.font = '20px Mina';
	ctxos.textAlign = 'left';
	ctxos.fillText(lastBest[0] < stat.scoreNum && isAutoplay !== "y" ? 'NEW BEST' : 'BEST', 750, 875);
	ctxos.fillStyle = '#fff';
	ctxos.font = '30px Mina';
	function formatScore(score, mp = 6) {
		if (score === 0) return "0000000";
		if (score >= Math.pow(10, mp)) return "0".times(6 - mp) + score.toString();
		return formatScore(score, mp - 1);
	}
	if (isAutoplay !== "y") {
		ctxos.fillText(formatScore(lastBest[0]), 750, 900);
	} else {
		ctxos.fillText("1000000", 750, 900);
	};
	ctxos.globalAlpha = range((qwqEnd.second - 1.87) * 2.5);
	ctxos.font = '20px Mina';
	ctxos.fillText(lastBest[0] < stat.scoreNum && isAutoplay !== "y" ? '+' : '-', 910, 875);
	ctxos.font = '30px Mina';
	// ctxos.textAlign = 'right';
	//ctxos.fillText(`RETRY`, canvasos.width - lineScale * 0.05, lineScale * 0.4);
	if (isAutoplay !== "y") {
		ctxos.fillText(lastBest[0] < stat.scoreNum.toFixed(0) ? `${formatScore(stat.scoreNum.toFixed(0) - lastBest[0])}` : `${formatScore(lastBest[0] - stat.scoreNum.toFixed(0))}`, 
		910, 900);
	} else {
		ctxos.fillText("0000000", 910, 900);
	}
	ctxos.globalAlpha = range((qwqEnd.second - 0.95) * 1.5);
	ctxos.textAlign = 'left';
	if (isAutoplay === "y") {
		ctxos.fillStyle = '#fe4365';
		// ctxos.fillText('AUTO PLAY', 1355, 582);
		drawAPFC("auto", "play");
	} else if (stat.lineStatus == 1) {
		ctxos.fillStyle = '#ffc500';
		// ctxos.fillText('ALL PERFECT2', 1355, 582);
		drawAPFC("all", "perfect");
	} else if (stat.lineStatus == 2) {
		ctxos.fillStyle = '#91ff8f';
		// ctxos.fillText('ALL PERFECT', 1355, 582);
		drawAPFC("all", "perfect");
	} else if (stat.lineStatus == 3) {
		ctxos.fillStyle = '#00bef1';
		// ctxos.fillText('FULL  COMBO', 1355, 582);
		drawAPFC("full", "combo");
	}
	function drawAPFC(l1, l2) {
		ctxos.font = '20px Mina';
		ctxos.fillText(l1.toUpperCase(), 1100, 875);
		ctxos.font = '30px Mina';
		ctxos.fillText(l2.toUpperCase(), 1100, 900);
	}

	// 成绩
	ctxos.fillStyle = '#fff';
	ctxos.textAlign = 'center';
	ctxos.font = '65px Mina';
	ctxos.globalAlpha = range((qwqEnd.second - 1.12) * 2.0);
	ctxos.fillText(stat.scoreStr, 575, 888);
	ctxos.textAlign = 'left';
	// ctxos.globalAlpha = 1;
	ctxos.globalAlpha = range((qwqEnd.second - 0.3) * 2.5);
	ctxos.font = '20px Mina';
	ctxos.fillText("PERFECT", 1320, 210);
	ctxos.fillText("GOOD"   , 1320, 385);
	// 借用写个 MAX COMBO
	ctxos.fillText('MAX COMBO', 1320, 600);
	// 借用写个 COMBO BREAKING
	ctxos.fillText('MISSED COMBO', 1320, 855);
	// 借用写个 acc
	ctxos.fillText('ACCURACY', 1320, 700);
	ctxos.textAlign = 'right';
	ctxos.fillText("BAD"    , 1680, 210);
	ctxos.fillText("MISS"   , 1680, 385);
	ctxos.font = '40px Mina';
	ctxos.textAlign = 'left';
	ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText(stat.perfect, 1335, 245);
	ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText(stat.good, 1335, 420);
	// 借用写个 MAX COMBO * 2
	ctxos.globalAlpha = range((qwqEnd.second - 0.95) * 1.5);
	ctxos.fillText(stat.maxcombo, 1335, 635);
	// 借用写个 CB * 2
	ctxos.globalAlpha = range((qwqEnd.second - 0.95) * 2.75);
	ctxos.fillText(stat.discombo, 1335, 890);
	// 借用写个 acc * 2
	ctxos.fillText(stat.accStr, 1335, 735);
	ctxos.textAlign = 'right';
	ctxos.globalAlpha = range((qwqEnd.second - 1.27) * 2.5);
	ctxos.fillText(stat.noteRank[6], 1665, 245);
	ctxos.globalAlpha = range((qwqEnd.second - 1.47) * 2.5);
	ctxos.fillText(stat.noteRank[2], 1665, 420);
	ctxos.font = '15px Mina';
	ctxos.textAlign = 'left';
	// ctxos.globalAlpha = 1;
	ctxos.globalAlpha = range((qwqEnd.second - 0.3) * 2.5);
	// ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText('Early', 1327, 275);
	ctxos.fillText('Late',  1327, 320);
	// ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText('Early', 1327, 450);
	ctxos.fillText('Late',  1327, 495);

	// P
	ctxos.font = '25px Mina';
	ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText(stat.noteRank[5], 1330, 295);
	ctxos.fillText(stat.noteRank[1], 1330, 340);
	ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText(stat.noteRank[7], 1330, 470);
	ctxos.fillText(stat.noteRank[3], 1330, 515);

	/* ctxos.font = '22px Mina';
	const qwq4 = range(
		(qwq[3] > 0 ? qwqEnd.second - qwq[3] : 0.2 - qwqEnd.second - qwq[3]) *
			5.0
	);
	ctxos.globalAlpha = 0.8 * range((qwqEnd.second - 0.87) * 2.5) * qwq4;
	ctxos.fillStyle = '#696';
	ctxos.fill(
		new Path2D(
			'M841,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z'
		)
	);
	ctxos.globalAlpha = 0.8 * range((qwqEnd.second - 1.07) * 2.5) * qwq4;
	ctxos.fillStyle = '#669';
	ctxos.fill(
		new Path2D(
			'M993,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z'
		)
	);
	ctxos.fillStyle = '#fff';
	ctxos.globalAlpha = range((qwqEnd.second - 0.97) * 2.5) * qwq4;
	ctxos.fillText('Early: ' + stat.noteRank[5], 891, 755);
	ctxos.fillText('Late: ' + stat.noteRank[1], 891, 788);
	ctxos.globalAlpha = range((qwqEnd.second - 1.17) * 2.5) * qwq4;
	ctxos.fillText('Early: ' + stat.noteRank[7], 1043, 755);
	ctxos.fillText('Late: ' + stat.noteRank[3], 1043, 788); */
	ctxos.resetTransform();

	/* ctxos.globalAlpha = 0.4;
	ctxos.drawImage(
		res["snb"],
		0,
		canvasos.height - lineScale * 2,     // max 1100
		// canvasos.height * 51 / 60500,
		canvasos.width,
		lineScale * 0.5
	);
	ctxos.globalAlpha = 1; */

	ctxos.globalCompositeOperation = 'destination-over';
	ctxos.globalAlpha = 1;
	ctxos.fillStyle = '#000';
	ctxos.drawImage(
		Renderer.bgImage,
		...adjustSize(Renderer.bgImage, canvasos, 1)
	);
	//ctxos.drawImage(res["BtnRD"], ...adjustSize(Renderer.bgImage, canvasos, 0.1));
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);

	function getImgScaled(img, width, height) {
		if (tmps.get(img)) return tmps.get(img);
		let imgScaled = document.createElement("canvas");
		let imgScaledos = imgScaled.getContext("2d");
		imgScaled.width = width;
		imgScaled.height = height;
		imgScaledos.drawImage(
			img,
			...adjustSize(img, imgScaled, 1)
		);
		tmps.set(img, imgScaled);
		return imgScaled;
	}
}

function range(num) {
	if (num < 0) return 0;
	if (num > 1) return 1;
	return num;
}
//绘制Note
function drawNote(note, realTime, type) {
	const HL = note.isMulti && $("highLight").checked;
	if (!note.visible) return;
	if (note.type != 3 && note.scored && !note.badtime) return;
	if (note.type == 3 && note.realTime + note.realHoldTime < realTime) return; //qwq
	ctxos.globalAlpha = note.alpha;
	//ctxos.setTransform(noteScale * note.cosr, noteScale * note.sinr, -noteScale * note.sinr, noteScale * note.cosr, note.offsetX, note.offsetY);
	ctxos.setTransform(...imgFlip(noteScale * note.cosr, noteScale * note.sinr, -noteScale * note.sinr, noteScale * note.cosr, note.offsetX, note.offsetY));
	if (type == 3) {
		const baseLength = hlen2 / noteScale * note.speed;
		const holdLength = baseLength * note.realHoldTime;
		if (note.realTime > realTime) {
			if (HL) {
				ctxos.drawImage(res["HoldHeadHL"], -res["HoldHeadHL"].width * 1.026 * 0.5, 0, res["HoldHeadHL"].width * 1.026, res["HoldHeadHL"].height * 1.026);
				ctxos.drawImage(res["HoldHL"], -res["HoldHL"].width * 1.026 * 0.5, -holdLength, res["HoldHL"].width * 1.026, holdLength);
			} else {
				ctxos.drawImage(res["HoldHead"], -res["HoldHead"].width * 0.5, 0);
				ctxos.drawImage(res["Hold"], -res["Hold"].width * 0.5, -holdLength, res["Hold"].width, holdLength);
			}
			ctxos.drawImage(res["HoldEnd"], -res["HoldEnd"].width * 0.5, -holdLength - res["HoldEnd"].height);
		} else {
			if (HL) ctxos.drawImage(res["HoldHL"], -res["HoldHL"].width * 1.026 * 0.5, -holdLength, res["HoldHL"].width * 1.026, holdLength - baseLength * (realTime - note.realTime));
			else ctxos.drawImage(res["Hold"], -res["Hold"].width * 0.5, -holdLength, res["Hold"].width, holdLength - baseLength * (realTime - note.realTime));
			ctxos.drawImage(res["HoldEnd"], -res["HoldEnd"].width * 0.5, -holdLength - res["HoldEnd"].height);
		}
	} else if (note.badtime) {
		if (type == 1) ctxos.drawImage(res["TapBad"], -res["TapBad"].width * 0.5, -res["TapBad"].height * 0.5);
	} else if (HL) {
		if (type == 1) ctxos.drawImage(res["TapHL"], -res["TapHL"].width * 0.5, -res["TapHL"].height * 0.5);
		else if (type == 2) ctxos.drawImage(res["DragHL"], -res["DragHL"].width * 0.5, -res["DragHL"].height * 0.5);
		else if (type == 4) ctxos.drawImage(res["FlickHL"], -res["FlickHL"].width * 0.5, -res["FlickHL"].height * 0.5);
	} else {
		if (type == 1) ctxos.drawImage(res["Tap"], -res["Tap"].width * 0.5, -res["Tap"].height * 0.5);
		else if (type == 2) ctxos.drawImage(res["Drag"], -res["Drag"].width * 0.5, -res["Drag"].height * 0.5);
		else if (type == 4) ctxos.drawImage(res["Flick"], -res["Flick"].width * 0.5, -res["Flick"].height * 0.5);
	}
}
//test
function chart123(chart) {
	//debugger;
	const newChart = JSON.parse(JSON.stringify(chart)); //深拷贝
	switch (newChart.formatVersion) { //加花括号以避免beautify缩进bug
		case 1: {
			newChart.formatVersion = 3;
			for (const i of newChart.judgeLineList) {
				let y = 0;
				for (const j of i.speedEvents) {
					if (j.startTime < 0) j.startTime = 0;
					j.floorPosition = y;
					y += (j.endTime - j.startTime) * j.value / i.bpm * 1.875;
				}
				for (const j of i.judgeLineDisappearEvents) {
					j.start2 = 0;
					j.end2 = 0;
				}
				for (const j of i.judgeLineMoveEvents) {
					j.start2 = j.start % 1e3 / 520;
					j.end2 = j.end % 1e3 / 520;
					j.start = parseInt(j.start / 1e3) / 880;
					j.end = parseInt(j.end / 1e3) / 880;
				}
				for (const j of i.judgeLineRotateEvents) {
					j.start2 = 0;
					j.end2 = 0;
				}
			}
		}
		case 3: {
			for (const i of newChart.judgeLineList) {
				let y = 0;
				for (const j of i.speedEvents) {
					if (j.startTime < 0) j.startTime = 0;
					j.floorPosition = y;
					y = Math.fround(y + (j.endTime - j.startTime) * j.value / i.bpm * 1.875); //float32
				}
			}
		}
		case 3473:
			break;
		default:
			throw `Unsupported formatVersion: ${newChart.formatVersion}`;
	}
	return newChart;
}
function chartp23(pec, filename) {
	console.log(pec);console.log(filename);
	class Chart {
		constructor() {
			this.formatVersion = 3;
			this.offset = 0;
			this.numOfNotes = 0;
			this.judgeLineList = [];
		}
		pushLine(judgeLine) {
			this.judgeLineList.push(judgeLine);
			this.numOfNotes += judgeLine.numOfNotes;
			return judgeLine;
		}
	}
	class JudgeLine {
		constructor(bpm) {
			this.numOfNotes = 0;
			this.numOfNotesAbove = 0;
			this.numOfNotesBelow = 0;
			this.bpm = 120;
			this.bpm = bpm;
			('speedEvents,notesAbove,notesBelow,judgeLineDisappearEvents,judgeLineMoveEvents,judgeLineRotateEvents,judgeLineDisappearEventsPec,judgeLineMoveEventsPec,judgeLineRotateEventsPec').split(',').map(i => this[i] = []);
		}
		pushNote(note, pos, isFake) {
			switch (pos) {
				case undefined:
				case 1:
					this.notesAbove.push(note);
					break;
				case 2:
					this.notesBelow.push(note);
					break;
				default:
					this.notesBelow.push(note);
					console.warn('Warning: Illeagal Note Side: ' + pos);
			}
			if (!isFake) {
				this.numOfNotes++;
				this.numOfNotesAbove++;
			}
		}
		pushEvent(type, startTime, endTime, n1, n2, n3, n4) {
			const evt = {
				startTime: startTime,
				endTime: endTime,
			}
			if (typeof startTime == 'number' && typeof endTime == 'number' && startTime > endTime) {
				console.warn('Warning: startTime ' + startTime + ' is larger than endTime ' + endTime);
				//return;
			}
			switch (type) {
				case 0:
					evt.value = n1;
					this.speedEvents.push(evt);
					break;
				case 1:
					evt.start = n1;
					evt.end = n2;
					evt.start2 = 0;
					evt.end2 = 0;
					this.judgeLineDisappearEvents.push(evt);
					break;
				case 2:
					evt.start = n1;
					evt.end = n2;
					evt.start2 = n3;
					evt.end2 = n4;
					this.judgeLineMoveEvents.push(evt);
					break;
				case 3:
					evt.start = n1;
					evt.end = n2;
					evt.start2 = 0;
					evt.end2 = 0;
					this.judgeLineRotateEvents.push(evt);
					break;
				case -1:
					evt.value = n1;
					evt.motionType = 1;
					this.judgeLineDisappearEventsPec.push(evt);
					break;
				case -2:
					evt.value = n1;
					evt.value2 = n2;
					evt.motionType = n3;
					this.judgeLineMoveEventsPec.push(evt);
					break;
				case -3:
					evt.value = n1;
					evt.motionType = n2;
					this.judgeLineRotateEventsPec.push(evt);
					break;
				default:
					throw `Unexpected Event Type: ${type}`;
			}
		}
	}
	class Note {
		constructor(type, time, x, holdTime, speed) {
			this.type = type;
			this.time = time;
			this.positionX = x;
			this.holdTime = type == 3 ? holdTime : 0;
			this.speed = isNaN(speed) ? 1 : speed; //默认值不为0不能改成Number(speed)||1
		}
	}
	//test start
	const rawChart = pec.match(/[^\n\r ]+/g).map(i => isNaN(i) ? String(i) : Number(i));
	const qwqChart = new Chart();
	const raw = {};
	('bp,n1,n2,n3,n4,cv,cp,cd,ca,cm,cr,cf').split(',').map(i => raw[i] = []);
	const rawarr = [];
	let fuckarr = [1, 1]; //n指令的#和&
	let rawstr = '';
	if (!isNaN(rawChart[0])) qwqChart.offset = (rawChart.shift() / 1e3 - 0.175); //v18x固定延迟
	for (let i = 0; i < rawChart.length; i++) {
		let p = rawChart[i];
		if (!isNaN(p)) rawarr.push(p);
		else if (p == '#' && rawstr[0] == 'n') fuckarr[0] = rawChart[++i];
		else if (p == '&' && rawstr[0] == 'n') fuckarr[1] = rawChart[++i];
		else if (raw[p]) pushCommand(p);
		else throw `Unknown Command: ${p}`;
	}
	pushCommand(''); //补充最后一个元素(bug)
	//处理bpm变速
	if (!raw.bp[0]) raw.bp.push([0, 120]);
	const baseBpm = raw.bp[0][1];
	if (raw.bp[0][0]) raw.bp.unshift([0, baseBpm]);
	const bpmEvents = []; //存放bpm变速事件
	let fuckBpm = 0;
	raw.bp.sort((a, b) => a[0] - b[0]).forEach((i, idx, arr) => {
		if (arr[idx + 1] && arr[idx + 1][0] <= 0) return; //过滤负数
		const start = i[0] < 0 ? 0 : i[0];
		const end = arr[idx + 1] ? arr[idx + 1][0] : 1e9;
		const bpm = i[1];
		bpmEvents.push({
			startTime: start,
			endTime: end,
			bpm: bpm,
			value: fuckBpm
		});
		fuckBpm += (end - start) / bpm;
	});

	function pushCommand(next) {
		if (raw[rawstr]) {
			if (rawstr[0] == 'n') {
				rawarr.push(...fuckarr);
				fuckarr = [1, 1];
			}
			raw[rawstr].push(JSON.parse(JSON.stringify(rawarr)));
		}
		rawarr.length = 0;
		rawstr = next;
	}
	//将pec时间转换为pgr时间
	function calcTime(timePec) {
		let timePhi = 0;
		for (const i of bpmEvents) {
			if (timePec < i.startTime) break;
			if (timePec > i.endTime) continue;
			timePhi = Math.round(((timePec - i.startTime) / i.bpm + i.value) * baseBpm * 32);
		}
		return timePhi;
	}
	//处理note和判定线事件
	let linesPec = [];
	for (const i of raw.n1) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushNote(new Note(1, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] / 115.2, 0, i[5]), i[3], i[4]);
		if (i[3] != 1 && i[3] != 2) message.sendWarning(`检测到非法方向:${i[3]}(将被视为2)\n位于:"n1 ${i.slice(0, 5).join(' ')}"\n来自${filename}`);
		if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n1 ${i.slice(0, 5).join(' ')}"\n来自${filename}`);
		if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n1 ${i.slice(0, 5).join(' ')} # ${i[5]} & ${i[6]}"\n来自${filename}`);
	} //102.4
	for (const i of raw.n2) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushNote(new Note(3, calcTime(i[1]) + (i[5] ? 1e9 : 0), i[3] / 115.2, calcTime(i[2]) - calcTime(i[1]), i[6]), i[4], i[5]);
		if (i[4] != 1 && i[4] != 2) message.sendWarning(`检测到非法方向:${i[4]}(将被视为2)\n位于:"n2 ${i.slice(0, 5).join(' ')} # ${i[6]} & ${i[7]}"\n来自${filename}`);
		if (i[5]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n2 ${i.slice(0, 6).join(' ')}"\n来自${filename}`);
		if (i[7] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n2 ${i.slice(0, 5).join(' ')} # ${i[6]} & ${i[7]}"\n来自${filename}`);
	}
	for (const i of raw.n3) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushNote(new Note(4, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] / 115.2, 0, i[5]), i[3], i[4]);
		if (i[3] != 1 && i[3] != 2) message.sendWarning(`检测到非法方向:${i[3]}(将被视为2)\n位于:"n3 ${i.slice(0, 5).join(' ')} # ${i[5]} & ${i[6]}"\n来自${filename}`);
		if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n3 ${i.slice(0, 5).join(' ')}"\n来自${filename}`);
		if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n3 ${i.slice(0, 5).join(' ')} # ${i[5]} & ${i[6]}"\n来自${filename}`);
	}
	for (const i of raw.n4) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushNote(new Note(2, calcTime(i[1]) + (i[4] ? 1e9 : 0), i[2] / 115.2, 0, i[5]), i[3], i[4]);
		if (i[3] != 1 && i[3] != 2) message.sendWarning(`检测到非法方向:${i[3]}(将被视为2)\n位于:"n4 ${i.slice(0, 5).join(' ')} # ${i[5]} & ${i[6]}"\n来自${filename}`);
		if (i[4]) message.sendWarning(`检测到FakeNote(可能无法正常显示)\n位于:"n4 ${i.slice(0, 5).join(' ')}"\n来自${filename}`);
		if (i[6] != 1) message.sendWarning(`检测到异常Note(可能无法正常显示)\n位于:"n4 ${i.slice(0, 5).join(' ')} # ${i[5]} & ${i[6]}"\n来自${filename}`);
	}
	//变速
	for (const i of raw.cv) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushEvent(0, calcTime(i[1]), null, i[2] / 7.0); //6.0??
	}
	//不透明度
	for (const i of raw.ca) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushEvent(-1, calcTime(i[1]), calcTime(i[1]), i[2] > 0 ? i[2] / 255 : 0); //暂不支持alpha值扩展
		if (i[2] < 0) message.sendWarning(`检测到负数Alpha:${i[2]}(将被视为0)\n位于:"ca ${i.join(' ')}"\n来自${filename}`);
	}
	for (const i of raw.cf) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		if (i[1] > i[2]) {
			message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cf ${i.join(' ')}"\n来自${filename}`);
			continue;
		}
		linesPec[i[0]].pushEvent(-1, calcTime(i[1]), calcTime(i[2]), i[3] > 0 ? i[3] / 255 : 0);
		if (i[3] < 0) message.sendWarning(`检测到负数Alpha:${i[3]}(将被视为0)\n位于:"cf ${i.join(' ')}"\n来自${filename}`);
	}
	//移动
	for (const i of raw.cp) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushEvent(-2, calcTime(i[1]), calcTime(i[1]), i[2] / 2048, i[3] / 1400, 1);
	}
	for (const i of raw.cm) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		if (i[1] > i[2]) {
			message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cm ${i.join(' ')}"\n来自${filename}`);
			continue;
		}
		linesPec[i[0]].pushEvent(-2, calcTime(i[1]), calcTime(i[2]), i[3] / 2048, i[4] / 1400, i[5]);
		if (i[5] && !tween[i[5]] && i[5] != 1) message.sendWarning(`未知的缓动类型:${i[5]}(将被视为1)\n位于:"cm ${i.join(' ')}"\n来自${filename}`);
	}
	//旋转
	for (const i of raw.cd) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		linesPec[i[0]].pushEvent(-3, calcTime(i[1]), calcTime(i[1]), -i[2], 1); //??
	}
	for (const i of raw.cr) {
		if (!linesPec[i[0]]) linesPec[i[0]] = new JudgeLine(baseBpm);
		if (i[1] > i[2]) {
			message.sendWarning(`检测到开始时间大于结束时间(将禁用此事件)\n位于:"cr ${i.join(' ')}"\n来自${filename}`);
			continue;
		}
		linesPec[i[0]].pushEvent(-3, calcTime(i[1]), calcTime(i[2]), -i[3], i[4]);
		if (i[4] && !tween[i[4]] && i[4] != 1) message.sendWarning(`未知的缓动类型:${i[4]}(将被视为1)\n位于:"cr ${i.join(' ')}"\n来自${filename}`);
	}
	for (const i of linesPec) {
		if (i) {
			i.notesAbove.sort((a, b) => a.time - b.time); //以后移到123函数
			i.notesBelow.sort((a, b) => a.time - b.time); //以后移到123函数
			let s = i.speedEvents;
			let ldp = i.judgeLineDisappearEventsPec;
			let lmp = i.judgeLineMoveEventsPec;
			let lrp = i.judgeLineRotateEventsPec;
			const srt = (a, b) => (a.startTime - b.startTime) + (a.endTime - b.endTime); //不单独判断以避免误差
			s.sort(srt); //以后移到123函数
			ldp.sort(srt); //以后移到123函数
			lmp.sort(srt); //以后移到123函数
			lrp.sort(srt); //以后移到123函数
			//cv和floorPosition一并处理
			let y = 0;
			for (let j = 0; j < s.length; j++) {
				s[j].endTime = j < s.length - 1 ? s[j + 1].startTime : 1e9;
				if (s[j].startTime < 0) s[j].startTime = 0;
				s[j].floorPosition = y;
				y += (s[j].endTime - s[j].startTime) * s[j].value / i.bpm * 1.875;
			}
			for (const j of i.notesAbove) {
				let qwqwq = 0;
				let qwqwq2 = 0;
				let qwqwq3 = 0;
				for (const k of i.speedEvents) {
					if (j.time % 1e9 > k.endTime) continue;
					if (j.time % 1e9 < k.startTime) break;
					qwqwq = k.floorPosition;
					qwqwq2 = k.value;
					qwqwq3 = j.time % 1e9 - k.startTime;
				}
				j.floorPosition = qwqwq + qwqwq2 * qwqwq3 / i.bpm * 1.875;
				if (j.type == 3) j.speed *= qwqwq2;
			}
			for (const j of i.notesBelow) {
				let qwqwq = 0;
				let qwqwq2 = 0;
				let qwqwq3 = 0;
				for (const k of i.speedEvents) {
					if (j.time % 1e9 > k.endTime) continue;
					if (j.time % 1e9 < k.startTime) break;
					qwqwq = k.floorPosition;
					qwqwq2 = k.value;
					qwqwq3 = j.time % 1e9 - k.startTime;
				}
				j.floorPosition = qwqwq + qwqwq2 * qwqwq3 / i.bpm * 1.875;
				if (j.type == 3) j.speed *= qwqwq2;
			}
			//整合motionType
			let ldpTime = 0;
			let ldpValue = 0;
			for (const j of ldp) {
				i.pushEvent(1, ldpTime, j.startTime, ldpValue, ldpValue);
				if (tween[j.motionType]) {
					for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
						let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
						let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
						let pt1 = j.value - ldpValue;
						i.pushEvent(1, k, k + 1, ldpValue + tween[j.motionType](ptt1) * pt1, ldpValue + tween[j.motionType](ptt2) * pt1);
					}
				} else if (j.motionType) i.pushEvent(1, j.startTime, j.endTime, ldpValue, j.value);
				ldpTime = j.endTime;
				ldpValue = j.value;
			}
			i.pushEvent(1, ldpTime, 1e9, ldpValue, ldpValue);
			//
			let lmpTime = 0;
			let lmpValue = 0;
			let lmpValue2 = 0;
			for (const j of lmp) {
				i.pushEvent(2, lmpTime, j.startTime, lmpValue, lmpValue, lmpValue2, lmpValue2);
				if (tween[j.motionType]) {
					for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
						let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
						let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
						let pt1 = j.value - lmpValue;
						let pt2 = j.value2 - lmpValue2;
						i.pushEvent(2, k, k + 1, lmpValue + tween[j.motionType](ptt1) * pt1, lmpValue + tween[j.motionType](ptt2) * pt1, lmpValue2 + tween[j.motionType](ptt1) * pt2, lmpValue2 + tween[j.motionType](ptt2) * pt2);
					}
				} else if (j.motionType) i.pushEvent(2, j.startTime, j.endTime, lmpValue, j.value, lmpValue2, j.value2);
				lmpTime = j.endTime;
				lmpValue = j.value;
				lmpValue2 = j.value2;
			}
			i.pushEvent(2, lmpTime, 1e9, lmpValue, lmpValue, lmpValue2, lmpValue2);
			let lrpTime = 0;
			let lrpValue = 0;
			for (const j of lrp) {
				i.pushEvent(3, lrpTime, j.startTime, lrpValue, lrpValue);
				if (tween[j.motionType]) {
					for (let k = parseInt(j.startTime); k < parseInt(j.endTime); k++) {
						let ptt1 = (k - j.startTime) / (j.endTime - j.startTime);
						let ptt2 = (k + 1 - j.startTime) / (j.endTime - j.startTime);
						let pt1 = j.value - lrpValue;
						i.pushEvent(3, k, k + 1, lrpValue + tween[j.motionType](ptt1) * pt1, lrpValue + tween[j.motionType](ptt2) * pt1);
					}
				} else if (j.motionType) i.pushEvent(3, j.startTime, j.endTime, lrpValue, j.value);
				lrpTime = j.endTime;
				lrpValue = j.value;
			}
			i.pushEvent(3, lrpTime, 1e9, lrpValue, lrpValue);
			qwqChart.pushLine(i);
		}
	}
	return JSON.parse(JSON.stringify(qwqChart));
}

const tween = [null, null,
	pos => Math.sin(pos * Math.PI / 2), //2
	pos => 1 - Math.cos(pos * Math.PI / 2), //3
	pos => 1 - (pos - 1) ** 2, //4
	pos => pos ** 2, //5
	pos => (1 - Math.cos(pos * Math.PI)) / 2, //6
	pos => ((pos *= 2) < 1 ? pos ** 2 : -((pos - 2) ** 2 - 2)) / 2, //7
	pos => 1 + (pos - 1) ** 3, //8
	pos => pos ** 3, //9
	pos => 1 - (pos - 1) ** 4, //10
	pos => pos ** 4, //11
	pos => ((pos *= 2) < 1 ? pos ** 3 : ((pos - 2) ** 3 + 2)) / 2, //12
	pos => ((pos *= 2) < 1 ? pos ** 4 : -((pos - 2) ** 4 - 2)) / 2, //13
	pos => 1 + (pos - 1) ** 5, //14
	pos => pos ** 5, //15
	pos => 1 - 2 ** (-10 * pos), //16
	pos => 2 ** (10 * (pos - 1)), //17
	pos => Math.sqrt(1 - (pos - 1) ** 2), //18
	pos => 1 - Math.sqrt(1 - pos ** 2), //19
	pos => (2.70158 * pos - 1) * (pos - 1) ** 2 + 1, //20
	pos => (2.70158 * pos - 1.70158) * pos ** 2, //21
	pos => ((pos *= 2) < 1 ? (1 - Math.sqrt(1 - pos ** 2)) : (Math.sqrt(1 - (pos - 2) ** 2) + 1)) / 2, //22
	pos => pos < 0.5 ? (14.379638 * pos - 5.189819) * pos ** 2 : (14.379638 * pos - 9.189819) * (pos - 1) ** 2 + 1, //23
	pos => 1 - 2 ** (-10 * pos) * Math.cos(pos * Math.PI / .15), //24
	pos => 2 ** (10 * (pos - 1)) * Math.cos((pos - 1) * Math.PI / .15), //25
	pos => ((pos *= 11) < 4 ? pos ** 2 : pos < 8 ? (pos - 6) ** 2 + 12 : pos < 10 ? (pos - 9) ** 2 + 15 : (pos - 10.5) ** 2 + 15.75) / 16, //26
	pos => 1 - tween[26](1 - pos), //27
	pos => (pos *= 2) < 1 ? tween[26](pos) / 2 : tween[27](pos - 1) / 2 + .5, //28
	pos => pos < 0.5 ? 2 ** (20 * pos - 11) * Math.sin((160 * pos + 1) * Math.PI / 18) : 1 - 2 ** (9 - 20 * pos) * Math.sin((160 * pos + 1) * Math.PI / 18) //29
];
//导出json
function chartify(json) {
	let newChart = {};
	newChart.formatVersion = 3;
	newChart.offset = json.offset;
	newChart.numOfNotes = json.numOfNotes;
	newChart.judgeLineList = [];
	for (const i of json.judgeLineList) {
		let newLine = {};
		newLine.numOfNotes = i.numOfNotes;
		newLine.numOfNotesAbove = i.numOfNotesAbove;
		newLine.numOfNotesBelow = i.numOfNotesBelow;
		newLine.bpm = i.bpm;
		("speedEvents,notesAbove,notesBelow,judgeLineDisappearEvents,judgeLineMoveEvents,judgeLineRotateEvents").split(",").map(i => newLine[i] = []);
		for (const j of i.speedEvents) {
			if (j.startTime == j.endTime) continue;
			let newEvent = {};
			newEvent.startTime = j.startTime;
			newEvent.endTime = j.endTime;
			newEvent.value = Number(j.value.toFixed(6));
			newEvent.floorPosition = Number(j.floorPosition.toFixed(6));
			newLine.speedEvents.push(newEvent);
		}
		for (const j of i.notesAbove) {
			let newNote = {};
			newNote.type = j.type;
			newNote.time = j.time;
			newNote.positionX = Number(j.positionX.toFixed(6));
			newNote.holdTime = j.holdTime;
			newNote.speed = Number(j.speed.toFixed(6));
			newNote.floorPosition = Number(j.floorPosition.toFixed(6));
			newLine.notesAbove.push(newNote);
		}
		for (const j of i.notesBelow) {
			let newNote = {};
			newNote.type = j.type;
			newNote.time = j.time;
			newNote.positionX = Number(j.positionX.toFixed(6));
			newNote.holdTime = j.holdTime;
			newNote.speed = Number(j.speed.toFixed(6));
			newNote.floorPosition = Number(j.floorPosition.toFixed(6));
			newLine.notesBelow.push(newNote);
		}
		for (const j of i.judgeLineDisappearEvents) {
			if (j.startTime == j.endTime) continue;
			let newEvent = {};
			newEvent.startTime = j.startTime;
			newEvent.endTime = j.endTime;
			newEvent.start = Number(j.start.toFixed(6));
			newEvent.end = Number(j.end.toFixed(6));
			newEvent.start2 = Number(j.start2.toFixed(6));
			newEvent.end2 = Number(j.end2.toFixed(6));
			newLine.judgeLineDisappearEvents.push(newEvent);
		}
		for (const j of i.judgeLineMoveEvents) {
			if (j.startTime == j.endTime) continue;
			let newEvent = {};
			newEvent.startTime = j.startTime;
			newEvent.endTime = j.endTime;
			newEvent.start = Number(j.start.toFixed(6));
			newEvent.end = Number(j.end.toFixed(6));
			newEvent.start2 = Number(j.start2.toFixed(6));
			newEvent.end2 = Number(j.end2.toFixed(6));
			newLine.judgeLineMoveEvents.push(newEvent);
		}
		for (const j of i.judgeLineRotateEvents) {
			if (j.startTime == j.endTime) continue;
			let newEvent = {};
			newEvent.startTime = j.startTime;
			newEvent.endTime = j.endTime;
			newEvent.start = Number(j.start.toFixed(6));
			newEvent.end = Number(j.end.toFixed(6));
			newEvent.start2 = Number(j.start2.toFixed(6));
			newEvent.end2 = Number(j.end2.toFixed(6));
			newLine.judgeLineRotateEvents.push(newEvent);
		}
		newChart.judgeLineList.push(newLine);
	}
	return newChart;
}
//调节画面尺寸和全屏相关
function adjustSize(source, dest, scale) {
	const [sw, sh, dw, dh] = [source.width, source.height, dest.width, dest.height];
	if (dw * sh > dh * sw) return [dw * (1 - scale) / 2, (dh - dw * sh / sw * scale) / 2, dw * scale, dw * sh / sw * scale];
	return [(dw - dh * sw / sh * scale) / 2, dh * (1 - scale) / 2, dh * sw / sh * scale, dh * scale];
}
//给图片上色
function imgShader(img, color) {
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	const imgData = ctx.getImageData(0, 0, img.width, img.height);
	const data = hex2rgba(color);
	for (let i = 0; i < imgData.data.length / 4; i++) {
		imgData.data[i * 4] *= data[0] / 255;
		imgData.data[i * 4 + 1] *= data[1] / 255;
		imgData.data[i * 4 + 2] *= data[2] / 255;
		imgData.data[i * 4 + 3] *= data[3] / 255;
	}
	return imgData;
}

//画面翻转
function imgFlip(a, b, c, d, e, f) {
	switch (selectflip.value) {
		case "br":
			return [a, b, c, d, e, f];
		case "bl":
			return [a, -b, -c, d, canvasos.width - e, f];
		case "tr":
			return [-a, b, c, -d, e, canvasos.height - f];
		case "tl":
			return [-a, -b, -c, -d, canvasos.width - e, canvasos.height - f];
		default:
			throw new Error("Flip Error");
	}
}

function imgBlur(img) {
	const canvas = document.createElement("canvas");
	canvas.width = img.width;
	canvas.height = img.height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0);
	return !new URLSearchParams(new URL(location.href).search).get("oldBlur") ? StackBlur.imageDataRGB(ctx.getImageData(0, 0, img.width, img.height), 0, 0, img.width, img.height, Math.ceil(Math.min(img.width, img.height) * (2/3-0.5))) : StackBlur.imageDataRGB( ctx.getImageData(0, 0, img.width, img.height), 0, 0, img.width, img.height, Math.ceil(Math.min(img.width, img.height) * 0.0125));; //对背景图片进行模糊处理 0.1666666···
}
//十六进制color转rgba数组
function hex2rgba(color) {
	const ctx = document.createElement("canvas").getContext("2d");
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, 1, 1);
	return ctx.getImageData(0, 0, 1, 1).data;
}
//rgba数组(0-1)转十六进制
function rgba2hex(...rgba) {
	return "#" + rgba.map(i => ("00" + Math.round(Number(i) * 255 || 0).toString(16)).slice(-2)).join("");
}
//读取csv
function csv2array(data, isObject) {
	const strarr = data.replace(/\r/g, "").split("\n");
	const col = [];
	for (const i of strarr) {
		let rowstr = "";
		let isQuot = false;
		let beforeQuot = false;
		const row = [];
		for (const j of i) {
			if (j == '"') {
				if (!isQuot) isQuot = true;
				else if (beforeQuot) {
					rowstr += j;
					beforeQuot = false;
				} else beforeQuot = true;
			} else if (j == ',') {
				if (!isQuot) {
					row.push(rowstr);
					rowstr = "";
				} else if (beforeQuot) {
					row.push(rowstr);
					rowstr = "";
					isQuot = false;
					beforeQuot = false;
				} else rowstr += j;
			} else if (!beforeQuot) rowstr += j;
			else throw "Error 1";
		}
		if (!isQuot) {
			row.push(rowstr);
			rowstr = "";
		} else if (beforeQuot) {
			row.push(rowstr);
			rowstr = "";
			isQuot = false;
			beforeQuot = false;
		} else throw "Error 2";
		col.push(row);
	}
	if (!isObject) return col;
	const qwq = [];
	for (let i = 1; i < col.length; i++) {
		const obj = {};
		for (let j = 0; j < col[0].length; j++) obj[col[0][j]] = col[i][j];
		qwq.push(obj);
	}
	return qwq;
}

//	获取曲绘
console.log('Fetching illustration:', meta['illustration']);
document.body.setAttribute(
	'style',
	'--background: url(' +
		encodeURI(
			'../charts/' +
				meta['codename'] +
				'/' +
				meta['illustration']
		) +
		')'
);
fetch(
	'../charts/' +
		meta['codename'] +
		'/' +
		meta['illustration']
)
	.then((response) => response.blob())
	.then((blob) => {
		createImageBitmap(blob).then((img) => {
			Renderer.bgImage = img;
			createImageBitmap(imgBlur(img)).then((imgBlur) => {
				Renderer.bgImageBlur = imgBlur;
			});
		});
	})
	.catch((error) => {
		alert('无法获取曲绘，原因是：\n' + error);
	});


function drawSongSelect(chapter = null/* null为单章节模式,字符串为章节代码 */) {
	// 选歌
	ctxos.resetTransform();
	ctxos.globalCompositeOperation = 'source-over';
	ctxos.clearRect(0, 0, canvasos.width, canvasos.height);
	ctxos.globalAlpha = 1;
	ctxos.drawImage(
		Renderer.bgImageBlur,
		...adjustSize(Renderer.bgImageBlur, canvasos, 1)
	);
	ctxos.fillStyle = '#000'; //背景变暗
	ctxos.globalAlpha = 0.6; //背景不透明度
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);
	ctxos.globalCompositeOperation = 'destination-out';
	ctxos.globalAlpha = 1;
	const k = 3.7320508075688776; //tan75°
	ctxos.globalCompositeOperation = 'destination-over';
	const qwq0 = (canvasos.width - canvasos.height / k) / (16 - 9 / k);
	ctxos.setTransform(
		qwq0 / 120,
		0,
		0,
		qwq0 / 120,
		wlen - qwq0 * 8,
		hlen - qwq0 * 4.5
	); //?
	ctxos.globalCompositeOperation = 'source-over';
	ctxos.globalAlpha = 1;
	//歌名和等级
	ctxos.globalAlpha = 0.4;
	ctxos.drawImage(
		res["snb"],
		250,
		110,
		1000,
		70
	);
	ctxos.drawImage(
		res["snb"],
		1300,
		110,
		400,
		70
	);
	ctxos.globalAlpha = 1;
	ctxos.fillStyle = '#fff';
	ctxos.textBaseline = 'middle';
	ctxos.textAlign = 'left';
	/* if (inputName.value.length <= 30) ctxos.font = '45px Mina';
	else  */
	ctxos.font = '30px Mina';
	ctxos.fillText(
		`${songSelectValue.thisChapter.chapterNumber} ${songSelectValue.thisChapter.chapterName}`,      // 章节名称TODO
		270,
		145
	);
	ctxos.font = '25px Mina';
	ctxos.textAlign = 'right';
	ctxos.fillText(
		songSelectValue.thisChapter.chapter,                           // 章节代码TODO
		1240,
		160
	);
	ctxos.textAlign = 'left';

	// x, y, 宽度, 长度
		// 绘制曲绘
	ctxos.globalAlpha = range((qwqEnd.second - 0.2) * 2.5);
	ctxos.drawImage(
		getImgScaled(Renderer.bgImage, 1000, 600),
		250,
		190
	);

	//各种数据
	ctxos.globalAlpha = 0.4;
	ctxos.drawImage(
		res["snb"],
		250,
		850,
		1000,
		80
	);
	ctxos.drawImage(
		res["snb"],
		1300,
		190,
		400,
		741
	);

	// 底部导航栏
	ctxos.globalAlpha = 0.4;
	ctxos.drawImage(
		res["snb"],
		250,
		// 1075 * ((9 / 16) * (canvasos.width / canvasos.height) + 1) / 16 * 9 - 80,     // max 1100
		// 1075 * (0) * 2 - 80,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 80,
		// canvasos.height * 51 / 60500,
		1450,
		80
	);
	ctxos.globalAlpha = 1;
	ctxos.drawImage(
		res["Retry"],
		275,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 65,
		50,
		50
	);
	ctxos.fillStyle = "#fff";
	ctxos.textAlign = 'left';
	ctxos.font = '40px Mina';
	ctxos.fillText("SETTINGS", 350, 1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 40);
	ctxos.textAlign = 'right';
	ctxos.fillText("PLAY", 1620, 1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 40);
	ctxos.drawImage(
		res["backInResault"],
		1635,
		1075 + (canvasos.height / (qwq0 / 120) - 1075) / 2 - 65,
		50,
		50
	);


	// 用户信息
	ctxos.textAlign = "left";
	ctxos.globalAlpha = 1;
	ctxos.drawImage(
		getImgScaled(
			res["testAvatar"],
			100,
			70
		),
		1300,
		110
	);
	ctxos.font = '35px Mina';
	// ctxos.textAlign = "left";
	ctxos.fillText(
		localStorage.getItem("playerName"),
		1420, 130
	)
	// ctxos.textAlign = "right";
	ctxos.font = '20px Mina';
	ctxos.fillText(
		"13.14",    // rks TODO
		1420, 162.5
	)
	// ctxos.textAlign = "left";


	//Rank图标
	ctxos.globalAlpha = 1;
	const qwq2 = 293 + range((3 - 1.87) * 3.75) * 100;
	const qwq3 = (410 - range((3 - 1.87) * 2.14) * 164) * 0.75;
	/* ctxos.drawImage(
		res['LevelOver3'],
		661 - qwq2 / 2,
		545 - qwq2 / 2,
		qwq2,
		qwq2
	); */
	ctxos.drawImage(
		res['Ranks'][0], //stat.rankStatus
		275 - (qwq3 - 111) / 2,
		800 - (qwq3 - 111) / 2,
		qwq3,
		qwq3
	);
	// console.log(qwq3)

	ctxos.globalAlpha = 1;
	let lastBest = window.localStorage.getItem(``);
	if (lastBest === null) {
		lastBest = [0,0];
	} else {
		lastBest = JSON.parse(lastBest);
	};
	ctxos.globalAlpha = 1;
	ctxos.fillStyle = lastBest[0] < stat.scoreNum && !isAutoplay ? '#18ffbf' : '#fff';
	ctxos.font = '20px Mina';
	ctxos.textAlign = 'left';
	ctxos.fillText(lastBest[0] < stat.scoreNum && isAutoplay !== "y" ? 'NEW BEST' : 'BEST', 750, 875);
	ctxos.fillStyle = '#fff';
	ctxos.font = '30px Mina';
	function formatScore(score, mp = 6) {
		if (score === 0) return "0000000";
		if (score >= Math.pow(10, mp)) return "0".times(6 - mp) + score.toString();
		return formatScore(score, mp - 1);
	}
	if (isAutoplay !== "y") {
		ctxos.fillText(formatScore(lastBest[0]), 750, 900);
	} else {
		ctxos.fillText("1000000", 750, 900);
	};
	ctxos.globalAlpha = 1;
	ctxos.font = '20px Mina';
	ctxos.fillText(lastBest[0] < stat.scoreNum && isAutoplay !== "y" ? '+' : '-', 910, 875);
	ctxos.font = '30px Mina';
	// ctxos.textAlign = 'right';
	//ctxos.fillText(`RETRY`, canvasos.width - lineScale * 0.05, lineScale * 0.4);
	if (isAutoplay !== "y") {
		ctxos.fillText(lastBest[0] < stat.scoreNum.toFixed(0) ? `${formatScore(stat.scoreNum.toFixed(0) - lastBest[0])}` : `${formatScore(lastBest[0] - stat.scoreNum.toFixed(0))}`, 
		910, 900);
	} else {
		ctxos.fillText("0000000", 910, 900);
	}

	// 成绩
	ctxos.fillStyle = '#fff';
	ctxos.textAlign = 'center';
	ctxos.font = '65px Mina';
	ctxos.globalAlpha = 1;
	ctxos.fillText("0114514", 575, 888);
	ctxos.textAlign = 'left';
	// ctxos.globalAlpha = 1;
	/*ctxos.globalAlpha = range((qwqEnd.second - 0.3) * 2.5);
	ctxos.font = '20px Mina';
	ctxos.fillText("PERFECT", 1320, 210);
	ctxos.fillText("GOOD"   , 1320, 385);
	// 借用写个 MAX COMBO
	ctxos.fillText('MAX COMBO', 1320, 600);
	// 借用写个 acc
	ctxos.fillText('ACCURACY', 1320, 700);
	ctxos.textAlign = 'right';
	ctxos.fillText("BAD"    , 1680, 210);
	ctxos.fillText("MISS"   , 1680, 385);
	ctxos.font = '40px Mina';
	ctxos.textAlign = 'left';
	ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText(stat.perfect, 1335, 245);
	ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText(stat.good, 1335, 420);
	// 借用写个 MAX COMBO * 2
	ctxos.globalAlpha = range((qwqEnd.second - 0.95) * 1.5);
	ctxos.fillText(stat.maxcombo, 1335, 635);
	// 借用写个 acc * 2
	ctxos.fillText(stat.accStr, 1335, 735);
	ctxos.textAlign = 'right';
	ctxos.globalAlpha = range((qwqEnd.second - 1.27) * 2.5);
	ctxos.fillText(stat.noteRank[6], 1665, 245);
	ctxos.globalAlpha = range((qwqEnd.second - 1.47) * 2.5);
	ctxos.fillText(stat.noteRank[2], 1665, 420);
	ctxos.font = '15px Mina';
	ctxos.textAlign = 'left';
	// ctxos.globalAlpha = 1;
	ctxos.globalAlpha = range((qwqEnd.second - 0.3) * 2.5);
	// ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText('Early', 1327, 275);
	ctxos.fillText('Late',  1327, 320);
	// ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText('Early', 1327, 450);
	ctxos.fillText('Late',  1327, 495);

	// P
	ctxos.font = '25px Mina';
	ctxos.globalAlpha = range((qwqEnd.second - 0.87) * 2.5);
	ctxos.fillText(stat.noteRank[5], 1330, 295);
	ctxos.fillText(stat.noteRank[1], 1330, 340);
	ctxos.globalAlpha = range((qwqEnd.second - 1.07) * 2.5);
	ctxos.fillText(stat.noteRank[7], 1330, 470);
	ctxos.fillText(stat.noteRank[3], 1330, 515); */

	/* ctxos.font = '22px Mina';
	const qwq4 = range(
		(qwq[3] > 0 ? qwqEnd.second - qwq[3] : 0.2 - qwqEnd.second - qwq[3]) *
			5.0
	);
	ctxos.globalAlpha = 0.8 * range((qwqEnd.second - 0.87) * 2.5) * qwq4;
	ctxos.fillStyle = '#696';
	ctxos.fill(
		new Path2D(
			'M841,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z'
		)
	);
	ctxos.globalAlpha = 0.8 * range((qwqEnd.second - 1.07) * 2.5) * qwq4;
	ctxos.fillStyle = '#669';
	ctxos.fill(
		new Path2D(
			'M993,718s-10,0-10,10v80s0,10,10,10h100s10,0,10-10v-80s0-10-10-10h-40l-10-20-10,20h-40z'
		)
	);
	ctxos.fillStyle = '#fff';
	ctxos.globalAlpha = range((qwqEnd.second - 0.97) * 2.5) * qwq4;
	ctxos.fillText('Early: ' + stat.noteRank[5], 891, 755);
	ctxos.fillText('Late: ' + stat.noteRank[1], 891, 788);
	ctxos.globalAlpha = range((qwqEnd.second - 1.17) * 2.5) * qwq4;
	ctxos.fillText('Early: ' + stat.noteRank[7], 1043, 755);
	ctxos.fillText('Late: ' + stat.noteRank[3], 1043, 788); */
	ctxos.resetTransform();

	/* ctxos.globalAlpha = 0.4;
	ctxos.drawImage(
		res["snb"],
		0,
		canvasos.height - lineScale * 2,     // max 1100
		// canvasos.height * 51 / 60500,
		canvasos.width,
		lineScale * 0.5
	);
	ctxos.globalAlpha = 1; */

	ctxos.globalCompositeOperation = 'destination-over';
	ctxos.globalAlpha = 1;
	ctxos.fillStyle = '#000';
	ctxos.drawImage(
		Renderer.bgImage,
		...adjustSize(Renderer.bgImage, canvasos, 1)
	);
	//ctxos.drawImage(res["BtnRD"], ...adjustSize(Renderer.bgImage, canvasos, 0.1));
	ctxos.fillRect(0, 0, canvasos.width, canvasos.height);

	function getImgScaled(img, width, height) {
		if (tmps.get(img)) return tmps.get(img);
		let imgScaled = document.createElement("canvas");
		let imgScaledos = imgScaled.getContext("2d");
		imgScaled.width = width;
		imgScaled.height = height;
		imgScaledos.drawImage(
			img,
			...adjustSize(img, imgScaled, 1)
		);
		tmps.set(img, imgScaled);
		return imgScaled;
	}
}