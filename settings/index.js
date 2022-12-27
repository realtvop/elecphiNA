for (let thisCheckbox of ["hitSong", "highLight", "lineColor", "autoAP", "showInfo"] /* 所有checkbox的id */ ) {
    let thisElement = document.getElementById(thisCheckbox);
    if (window.localStorage.getItem(thisCheckbox) !== null) thisElement.checked = window.localStorage.getItem(thisCheckbox) === "true" ? true : false;
    else window.localStorage.setItem(thisCheckbox, thisElement.checked);
    thisElement.addEventListener("change", () => {
        //console.log(thisElement.checked)
        console.log(thisCheckbox)
        window.localStorage.setItem(thisCheckbox, thisElement.checked);
    })
}

for (let thisSlide of ["input-offset", "select-global-alpha", "select-scale-ratio", "input-songVolume", "input-hitSongVolume"]) {
    let thisElement = document.getElementById(thisSlide);
    if (["select-scale-ratio", "select-global-alpha"].indexOf(thisSlide) === -1) {
        if (window.localStorage.getItem(thisSlide) != null) thisElement.value = window.localStorage.getItem(thisSlide);
        else window.localStorage.setItem(thisSlide, thisElement.value);
        thisElement.addEventListener("change", () => {
            window.localStorage.setItem(thisSlide, thisElement.value);
        })
    } else {
        if (window.localStorage.getItem(thisSlide) != null) thisElement.value = -window.localStorage.getItem(thisSlide);
        else window.localStorage.setItem(thisSlide, -thisElement.value);
        thisElement.addEventListener("change", () => {
            window.localStorage.setItem(thisSlide, -thisElement.value);
        })
    }
}