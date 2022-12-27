'use strict';

const CHARTSDIR = window.localStorage.getItem("chartsPath") === null ? "../chart/" : window.localStorage.getItem("chartsPath");

// 如发现该页面访问链接的c选项为空，则跳转至默认章节
if (new URLSearchParams(new URL(location.href).search).get('c') === null) {
    let chapters = new XMLHttpRequest();
    chapters.open("GET", CHARTSDIR + "/chapters.json", false);
    chapters.send();
    chapters = JSON.parse(chapters.responseText);
    location.href = "./index.html?c=single"/*  + chapters.default */; 
}

String.prototype.times = function(n) {return (new Array(n+1)).join(this);} // 设置对于字符串的times(n)方法：重复该字符串n次

let songSelecterInfo = {
    levels: ["ez", "hd", "in", "at"],          // 所有难度（但似乎没啥用？）
    levelSelected: "in",                       // 当前选择的难度
    songsInChapter: loadSongsInChapter(),      // 该章节中含有的全部曲目
    oldBlurs: [],                              // 需使用旧版模糊的曲目，目前还未使用
    dontHaveINSongs: {},                       // 本章节中的无IN难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
    haveEZSongs: {},                           // 本章节中的有EZ难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
    haveHDSongs: {},                           // 本章节中的有HD难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
    haveATSongs: {},                           // 本章节中的有AT难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
    songsMetaData: {},                         // 本章节中所有曲目的MataData
}

// 获得该章节中含有的全部曲目
function loadSongsInChapter(chapter = new URLSearchParams(new URL(location.href).search).get('c')) {
    let songList = new XMLHttpRequest();
    songList.open("GET", CHARTSDIR + "/" + chapter + ".json", false);
    songList.send();
    return JSON.parse(songList.responseText);
}

// 加载前往各个章节的按钮
function loadChapters() {
    if (window.localStorage.getItem("multi-chapterMode") === "true") {
        // 多章节模式（meta.json模式）
        var chapterElement = document.getElementById("main-drawer" /* main-drawer为左侧抽屉栏 */ );
        let chapters = new XMLHttpRequest();
        chapters.open("GET", CHARTSDIR + "/chapters.json", false);
        chapters.send();
        chapters = JSON.parse(chapters.responseText);
        console.log(chapters.responseText)
        for (let i in chapters) {
            if (i === "default") continue; // 跳过设置默认章节的选项
            let thisChapterElement = document.createElement("a");
            thisChapterElement.classList.add("mdui-list-item")  // 设置元素为列表中的项目
            thisChapterElement.classList.add("mdui-ripple");    // 开启涟漪动画效果
            thisChapterElement.href = `./index.html?c=${i}`;  // 点击即跳转
            //thisChapterElement.onclick = `changeChapter(${i});`; // 点击即切换
            thisChapterElement.innerText = chapters[i];         // 显示标签为章节显示名称
            //thisChapterElement.addEventListener("click", changeChapter(i));
            chapterElement.appendChild(thisChapterElement);
        }
        document.getElementById("chapterName").innerText = chapters[new URLSearchParams(new URL(location.href).search).get('c')]; // 顺带将网页顶栏（顶部工具栏）中的副标题设为当前章节显示名称
    } else {
        // 全部曲目模式（info.csv模式）
        // TODO
    }
}

// 添加曲目元素（卡片）
function addSongDiv(chapter = new URLSearchParams(new URL(location.href).search).get('c')) {
    /* 原用于标记特殊难度曲目的文件，现已弃用
    var specialRanks = new XMLHttpRequest();
    specialRanks.open("GET", "charts/specialRank.json", false);
    specialRanks.send();
    var sprs = JSON.parse(specialRanks.responseText);
    */
    var songElement = document.createElement('div');
    songElement.classList.add("mdui-panel");            // 设置元素为Panel（的容器）
    songElement.classList.add("mdui-panel-gapless");    // 去除Panel之间间隙
    //songElement.classList.add("mdui-panel-popout");   // 为Panel添加弹出显示效果，此方法会导致页面超长
    songElement.id = "songElement";
    document.body.appendChild(songElement);
    for(let i of songSelecterInfo.songsInChapter) {
        // 获取该曲目元信息
        let songMetaData = getSongMetaData(i);
        let thisElement = document.createElement('div');
        thisElement.classList.add("mdui-panel-item");       // 设置元素为Panel中项目
        thisElement.classList.add("mdui-panel-item-close"); // 且该项目默认关闭
        thisElement.id = i;
        thisElement.innerHTML=`
        <div class="mdui-panel-item-header">
            <div class="mdui-panel-item-title">${songMetaData.name}</div>
            <div class="mdui-panel-item-summary" id="${i}-rank">φ</div>
            <div class="mdui-panel-item-summary">${songMetaData.artist}</div>
            <i class="mdui-panel-item-arrow mdui-icon material-icons">keyboard_arrow_down</i>
        </div>
        <div class="mdui-panel-item-body">
            <div class="mdui-card card">
            <div class="mdui-card-media img">
                <img src="${CHARTSDIR}/${i}/${songMetaData.illustration}"/>
                <div class="mdui-card-media-covered mdui-card-media-covered-top">
                <!--
                <div class="mdui-card-primary">
                    <<div class="mdui-card-primary-title">${songMetaData.name}</div>
                    <div class="mdui-card-primary-subtitle">${songMetaData.artist}</div>
                </div>
                -->
                </div>
                <div class="mdui-card-media-covered ">
                <div class="mdui-card-primary">
                    <div class="mdui-card-primary-title" id="${i}-score">0000000</div>
                    <div class="mdui-card-primary-subtitle" id="${i}-acc">00.00%</div>
                </div>
                </div>
            </div>
            <div class="mdui-card-actions mdui-card-actions-stacked">
                <button class="mdui-btn mdui-ripple ezBtn" id="${i}-ez"                >EZ ${songMetaData.ezRanking}</button>
                <button class="mdui-btn mdui-ripple hdBtn" id="${i}-hd"                >HD ${songMetaData.hdRanking}</button>
                <button class="mdui-btn mdui-ripple inBtn mdui-color-blue" id="${i}-in">IN ${songMetaData.inRanking}</button>
                <button class="mdui-btn mdui-ripple atBtn" id="${i}-at"                >AT ${songMetaData.atRanking}</button>
                <button class="mdui-btn mdui-btn-icon mdui-float-right" id="${i}PlayBtn">
                <i class="mdui-icon material-icons">play_arrow</i>
                </button>
                ${false ? '<button class="mdui-btn mdui-ripple mdui-float-right" id="'+ i +'LegacyPlayBtn">Legacy</button>' : ''}
            </div>
            </div>
        </div>
        `
        songElement.appendChild(thisElement);
        // 判断此曲目是否含有特殊难度，如不含则不显示对应难度按钮，如含则检查是否有对应的难度别名，如有则填入
        for (let thisLevel of songSelecterInfo.levels) {
            if (songMetaData[thisLevel + "Ranking"] < 0) {
                // 不显示对应按钮
                document.getElementById(i + "-" + thisLevel).style.display = "none";
                // 将没有IN难度的歌曲添加到songSelecterInfo的dontHaveINSongs中
                if (thisLevel === "in") songSelecterInfo.dontHaveINSongs[i] = true;
            } else {
                if (thisLevel !== "in") songSelecterInfo[`have${thisLevel.toUpperCase()}Songs`][i] = true; // 将有其他难度(不含in)的歌曲添加到songSelecterInfo的对应项中
                let levelText, levelRanking;
                // 检查是否有对应的难度别名，如有则填入
                if (songMetaData[thisLevel + "Alias"] !== undefined)
                    levelText = songMetaData[thisLevel + "Alias"];
                else
                    levelText = thisLevel;
                // 如该难度的评级为0，则显示为"?"
                if (songMetaData[thisLevel + "Ranking"] === 0)
                    levelRanking = "?";
                else
                    levelRanking = songMetaData[thisLevel + "Ranking"];
                // 更改元素内容
                document.getElementById(i + "-" + thisLevel).innerText = levelText + " " + levelRanking;
            }
        }
        // console.log(songSelecterInfo)
        // 加载此曲目的成绩、acc及评级
        let thisSongScores = getSongScore(i, songSelecterInfo.levelSelected);
        document.getElementById(`${i}-score`).innerText = thisSongScores[0];
        document.getElementById(`${i}-acc`).innerText = thisSongScores[1];
        if (getSongMetaData(i)[songSelecterInfo.levelSelected + "Ranking"] >= 0)
            // 顺带显示难度
            document.getElementById(`${i}-rank`).innerText = `${thisSongScores[2][0]} (Lv.${getSongMetaData(i)[songSelecterInfo.levelSelected + "Ranking"] !== 0 ? getSongMetaData(i)[songSelecterInfo.levelSelected + "Ranking"] : "?"})`
        else
            // 该曲目若没有此难度，则显示为空
            document.getElementById(`${i}-rank`).innerText = ``;
        document.getElementById(`${i}-rank`).classList = `mdui-panel-item-summary ${thisSongScores[2][1]}`;
        // 添加此曲目游玩按钮的事件监听器
        document.getElementById(`${i}PlayBtn`).addEventListener("click", () => {
            location.href = `../play/index.html?play=${i /* 曲目codename */ }&c=${chapter /* 当前章节（返回用） */ }&l=${songSelecterInfo.levelSelected /* 难度 */ }&ap=${document.getElementById("isAP").checked ? "y" : '' /* 是否Autoplay */ }&oldBlur=${songMetaData.oldBlur === true ? 'y' : '' /* 是否使用旧版模糊 */ }&ls=${document.getElementById("liuSu").value === "" || document.getElementById("liuSu").value <= 0 ? "0.6" : document.getElementById("liuSu").value /* 游玩时的note流速 */ }`
        })
        // 使点击难度按钮时能够切换难度
        for(let j of songSelecterInfo.levels)
            document.getElementById(i + "-" + j).addEventListener("click", () => levelChange(j))
        // 在打开面板时存储选择的曲目信息，并且切换难度（如已选择此曲目不含的等级）
        document.getElementById(i).addEventListener(
            "open.mdui.panel", // Panel开始打开时的事件
            () => {
                // 存储选择的曲目信息
                window.localStorage.setItem(chapter+"-selected", i);
                // 获取该曲目含有的等级
                let levelsAvailable = [];
                for (let thisLevel of songSelecterInfo.levels)
                    if (thisLevel === "in") {if (songSelecterInfo.dontHaveINSongs[i] === undefined) levelsAvailable[levelsAvailable.length] = thisLevel;}
                    else if (songSelecterInfo[`have${thisLevel.toUpperCase()}Songs`][i])           levelsAvailable[levelsAvailable.length] = thisLevel;
                // 判断是否需要切换等级
                if (levelsAvailable.indexOf(songSelecterInfo.levelSelected) !== -1) return;
                // 否则切换等级
                levelChange(levelsAvailable[levelsAvailable.length - 1]) // 直接切换到最难的等级
            }
        )
    }

    // 必须new一下这个新Panel才能使得同时只有一个Panel项目被打开
    var inst = new mdui.Panel(document.getElementsByClassName("mdui-panel"));
    // 如果设置默认选择Autoplay则勾选Autoplay复选框
    if(window.localStorage.getItem("autoAP") === "true") document.getElementById("isAP").checked = true;
    // 如果有存储的过去选择的难度信息，则切换
    if(window.localStorage.getItem("levelSelected") !== "in" && songSelecterInfo.levels.indexOf(window.localStorage.getItem("levelSelected")) !== -1) levelChange(window.localStorage.getItem("levelSelected"));
    // 如果有存储的过去选择的曲目信息，则切换
    if(songSelecterInfo.songsInChapter.indexOf(window.localStorage.getItem(chapter+"-selected")) !== -1)
        inst.open(document.getElementById(window.localStorage.getItem(chapter+"-selected")));

    // 切换难度
    function levelChange(level) {
        if (level === songSelecterInfo.levelSelected) return;     // 如果尝试将等级更改为现有等级则return（否则会导致按钮颜色不对）
        for(let i of songSelecterInfo.songsInChapter){
            document.getElementById(i + "-" + level).classList.add("mdui-color-blue");                              // 使所有新难度的对应按钮呈现蓝色，表示已选中
            document.getElementById(i + "-" + songSelecterInfo.levelSelected).classList.remove("mdui-color-blue");  // 使所有旧难度的对应按钮不呈现蓝色，表示未选中
            // 加载所有歌曲新选择难度的成绩
            let thisSongScores = getSongScore(i, level);
            document.getElementById(`${i}-score`).innerText = thisSongScores[0];
            document.getElementById(`${i}-acc`).innerText = thisSongScores[1];
            if (getSongMetaData(i)[level + "Ranking"] >= 0)
                // 顺带显示难度
                document.getElementById(`${i}-rank`).innerText = `${thisSongScores[2][0]} (Lv.${getSongMetaData(i)[level + "Ranking"] !== 0 ? getSongMetaData(i)[level + "Ranking"] : "?"})`
            else
                // 该曲目若没有此难度，则显示为空
                document.getElementById(`${i}-rank`).innerText = ``;
            document.getElementById(`${i}-rank`).classList = `mdui-panel-item-summary ${thisSongScores[2][1]}`;
        }
        songSelecterInfo.levelSelected = level;                // 标记已选择新难度(程序内)
        window.localStorage.setItem("levelSelected", level);   // 标记已选择新难度(长期存)
    }

    // 获取歌曲特定难度的以往最佳成绩
    function getSongScore(codeName, level) {
        let scores = window.localStorage.getItem(codeName + "-" + level);
        if (scores === null) return ["0000000", "00.00%", ["N", ""]]; // 如果没有以往成绩，则返回“新”的数据
        scores = JSON.parse(scores);
        // 成绩
        let score = formatScore(scores[0]);
        // 准度
        let acc = scores[1] >= 10 ? scores[1].toFixed(2) : "N" + scores[1].toFixed(2);
        // 评级
        let rank;
        /**/ if (scores[0] >=  1000000) rank = ["φ",   `mdui-text-color-yellow`  ]; //yyy
        else if (scores[2] ===       1) rank = ["V",    `mdui-text-color-blue`   ]; //yyy
        else // (   lty    === ltv yes) rank = ["^",    ` ↑  FULL↓ COMBO↑  ↑ `   ]; //yyy
        /**/ if (scores[0] >=   960000) rank = ["V", `${[/* V Without FC??? */]}`]; //yyy
        else if (scores[0] >=   920000) rank = ["S", `${[/* SSSSSSSSSSSSSSS */]}`]; //yyy
        else if (scores[0] >=   880000) rank = ["A", `${[/* Only A? WT*!!!! */]}`]; //yyy
        else if (scores[0] >=   820000) rank = ["B", `${[/* Good GOOD GOOOD */]}`]; //yyy
        else if (scores[0] >=   700000) rank = ["C", `${[/* Yup! Much Miss? */]}`]; //yyy
        else if (scores[0] >=        0) rank = ["F", `${[/* FFFFFFFFFFFFFFF */]}`]; //yyy
        else    /* score   ===  0    */ rank = ["0", `${[/* Emm... Amazing! */]}`]; //yyy
        /* ---分割线--- */
        return [score, `${acc}%`, rank];
        
        // 格式化成绩为phi的格式（百万计） //toGrade
        function formatScore(score, mp = 6) {
            if (score >= Math.pow(10, mp)) return "0".times(6 - mp) + score.toString();
            return formatScore(score, mp - 1);
        }
    }

    // 获取曲目元信息
    function getSongMetaData(id) {
        if (songSelecterInfo.songsMetaData[id] !== undefined) return songSelecterInfo.songsMetaData[id];
        let songMetaData = new XMLHttpRequest();
        songMetaData.open("GET", CHARTSDIR + "/" + id + "/meta.json", false);
        songMetaData.send();
        songSelecterInfo.songsMetaData[id] = JSON.parse(songMetaData.responseText) // 缓存曲目元信息，加快改变难度的速度
        return songSelecterInfo.songsMetaData[id];
    }
}

/*
document.getElementById("userInfoChange").addEventListener("click", () => {
    mdui.prompt('用户名（无需修改任何信息请按取消，否则请按确认）', '更改用户信息',
        function (value) {
            window.localStorage.setItem("playerName", value);
        },
        function (value) {
            return
        },
        {
            confirmOnEnter: true,
            defaultValue: window.localStorage.getItem("playerName"),
        }
    );
    /*DOING
    mdui.prompt('头像（请输入base64编码的图像，无需修改请点击取消或留空确定）', '更改用户信息',
    function (value) {
        mdui.alert('此功能暂时未开发，抱歉:-x');
    });
    
})
*/

// 切换章节 注意：*必须必须必须在加载过曲目信息后使用*
function changeChapter(chapter) {
    songSelecterInfo = {
        levels: ["ez", "hd", "in", "at"],          // 所有难度（但似乎没啥用？）
        levelSelected: "in",                       // 当前选择的难度
        songsInChapter: loadSongsInChapter(chapter),      // 该章节中含有的全部曲目
        oldBlurs: [],                              // 需使用旧版模糊的曲目，目前还未使用
        dontHaveINSongs: {},                       // 本章节中的无IN难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
        haveEZSongs: {},                           // 本章节中的有EZ难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
        haveHDSongs: {},                           // 本章节中的有HD难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
        haveATSongs: {},                           // 本章节中的有AT难度歌曲，将在addSongDiv中添加。标准格式：歌曲名: true
        songsMetaData: {},                         // 本章节中所有曲目的MataData
    }
    //document.body.removeChild(document.getElementById("songElement"));
    addSongDiv();
}


loadChapters()
addSongDiv()

