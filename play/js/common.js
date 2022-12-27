const $ = id => document.getElementById(id);

function reloadValues(){
	Renderer = { //存放谱面
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
	qwq = [];

}

function csv2array(data, isObject) {
	const strarr = data.replace(/\ufeff|\r/g, '').split('\n');
	const col = [];
	for (const i of strarr) {
		let rowstr = '';
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
					rowstr = '';
				} else if (beforeQuot) {
					row.push(rowstr);
					rowstr = '';
					isQuot = false;
					beforeQuot = false;
				} else rowstr += j;
			} else if (!beforeQuot) rowstr += j;
			else throw 'Error 1';
		}
		if (!isQuot) {
			row.push(rowstr);
			rowstr = '';
		} else if (beforeQuot) {
			row.push(rowstr);
			rowstr = '';
			isQuot = false;
			beforeQuot = false;
		} else throw 'Error 2';
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