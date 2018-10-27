function 将棋タイム(args){

var $s = 将棋タイム.bloc(将棋タイム.HTML);


$s.スタートアップ = function (){
    args.kif = args.kif || '';
    args.kif = args.kif.trim();

    if(!(args.el instanceof Element)){
        throw '将棋タイムの起動オプション「el」にはDOM要素を指定してください ＞ 将棋タイム({el:DOM要素})';
    }

    args.start   = Number(args.start || 0);
    args.reverse = args.reverse || false;

    if(args.comment){
        args.comment = document.querySelector(args.comment);
    }

    if(args.green){
        args.green = args.green.split(',');
    }
    if(args.red){
        args.red = args.red.split(',');
    }
    if(args.blue){
        args.blue = args.blue.split(',');
    }

    if(args.kif.match(/^https?:/)){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', args.kif);
        xhr.timeout = 20 * 1000;
        if(!args.kif.match(/\.kifu$/)){
            xhr.overrideMimeType('text/plain; charset=Shift_JIS');
        }
        xhr.onload = function(e) {
            args.kif = xhr.responseText;
            $s.メイン();
        };
        xhr.send();
   }
    else{
        $s.メイン();
    }
};


$s.メイン = function (){
    $s.kif.解析(args.kif);
    $s.局面.全構築();
    $s.指し手.HTML作成();

    if($s.局面.一覧.length === 1){
        $s.コントロールパネル.style.display = 'none';
    }
    if(args.reverse !== false){
        $s.将棋盤.setAttribute('data-reverse', '1');
    }

    $s.描画(args.start);
    args.el.parentNode.replaceChild($s.root, args.el);
};


$s.局面.一覧 = [{
    '先手持ち駒': {'歩': 0, '香': 0, '桂': 0, '銀': 0, '金': 0, '飛': 0, '角': 0},
    '後手持ち駒': {'歩': 0, '香': 0, '桂': 0, '銀': 0, '金': 0, '飛': 0, '角': 0},
    '駒':{
        '1': {'1': '香_', '2': '桂_', '3': '銀_', '4': '金_', '5': '玉_', '6': '金_', '7': '銀_', '8': '桂_', '9': '香_'},
        '2': {'1': null, '2': '角_', '3': null, '4': null, '5': null, '6': null, '7': null, '8': '飛_', '9': null},
        '3': {'1': '歩_', '2': '歩_', '3': '歩_', '4': '歩_', '5': '歩_', '6': '歩_', '7': '歩_', '8': '歩_', '9': '歩_'},
        '4': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
        '5': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
        '6': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
        '7': {'1': '歩', '2': '歩', '3': '歩', '4': '歩', '5': '歩', '6': '歩', '7': '歩', '8': '歩', '9': '歩'},
        '8': {'1': null, '2': '飛', '3': null, '4': null, '5': null, '6': null, '7': null, '8': '角', '9': null},
        '9': {'1': '香', '2': '桂', '3': '銀', '4': '金', '5': '玉', '6': '金', '7': '銀', '8': '桂', '9': '香'},
    },
}];


$s.局面.駒無し = function (){
    return {
            '1': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '2': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '3': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '4': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '5': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '6': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '7': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '8': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
            '9': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
    };
};


$s.局面.コピー = function(from){
    var to = {};
    for(var key in from){
        to[key] = (from[key] instanceof Object)  ?  $s.局面.コピー(from[key])  :  from[key];
    }
    return to;
};


$s.局面.全構築 = function(){
    for(var i = 1; i < $s.指し手.一覧.length; i++){
        $s.局面.一覧.push( $s.局面.構築($s.指し手.一覧[i], $s.局面.一覧[i-1]) );
    }
};


$s.局面.構築 = function(指し手, 前局面){
    // 指し手 = {'手数','駒','前X','前Y','後X','後Y','成り','表記'};

    var 局面 = $s.局面.コピー(前局面);
    var 手番 = (指し手['手数'] % 2) ? '先手' : '後手';
    var 駒   = 指し手['駒'];
    
    if(指し手['前X'] === 0){ //打の場合
        局面[手番+'持ち駒'][駒]--;
    }
    else{ //移動の場合
        局面['駒'][指し手['前Y']][指し手['前X']] = null;

        if(局面['駒'][指し手['後Y']][指し手['後X']]){ //駒を取る場合
            var 取った駒 = 局面['駒'][指し手['後Y']][指し手['後X']].replace('_', '');
            if(取った駒 === '全') 取った駒 = '銀';
            else if(取った駒 === '圭') 取った駒 = '桂';
            else if(取った駒 === '杏') 取った駒 = '香';
            else if(取った駒 === 'と') 取った駒 = '歩';
            else if(取った駒 === '龍') 取った駒 = '飛';
            else if(取った駒 === '馬') 取った駒 = '角';
            局面[手番+'持ち駒'][取った駒]++;
        }
    }

    if(指し手['成り']){
        if(駒 === '歩') 駒 = 'と';
        else if(駒 === '銀') 駒 = '全';
        else if(駒 === '桂') 駒 = '圭';
        else if(駒 === '香') 駒 = '杏';
        else if(駒 === '飛') 駒 = '龍';
        else if(駒 === '角') 駒 = '馬';
    }
    if(手番 === '後手'){
        駒 += '_';
    }

    局面['駒'][指し手['後Y']][指し手['後X']] = 駒;

    return 局面;
};


$s.描画 = function(手数){
    手数 = $s.描画.手数正規化(手数);
    var 局面 = $s.局面.一覧[手数];

    //反転
    var 反転 = $s.将棋盤.hasAttribute('data-reverse');
    var 先手 = (反転) ? '後手' : '先手';
    var 後手 = (反転) ? '先手' : '後手';

    //初期化
    $s.将棋盤.innerHTML = '';

    //最終手x,yを求める
    if(手数 !== 0){
        var 最終手X = $s.指し手.一覧[手数]['後X'];
        var 最終手Y = $s.指し手.一覧[手数]['後Y'];
        if(反転){
            最終手X = 10 - 最終手X;
            最終手Y = 10 - 最終手Y;
        }
        var div = document.createElement('div');
        div.className = '将棋タイム-最終手';
        div.dataset.x = 最終手X;
        div.dataset.y = 最終手Y;
        $s.将棋盤.appendChild(div);
    }
    else{
        if(Array.isArray(args.green)){
            for(var i = 0; i < args.green.length; i++){
                var div = document.createElement('div');
                div.className = '将棋タイム-緑';
                div.dataset.x = args.green[i].substring(0, 1);
                div.dataset.y = args.green[i].substring(1, 2);
                $s.将棋盤.appendChild(div);
            }
        }
        if(Array.isArray(args.red)){
            for(var i = 0; i < args.red.length; i++){
                var div = document.createElement('div');
                div.className = '将棋タイム-赤';
                div.dataset.x = args.red[i].substring(0, 1);
                div.dataset.y = args.red[i].substring(1, 2);
                $s.将棋盤.appendChild(div);
            }
        }
        if(Array.isArray(args.blue)){
            for(var i = 0; i < args.blue.length; i++){
                var div = document.createElement('div');
                div.className = '将棋タイム-青';
                div.dataset.x = args.blue[i].substring(0, 1);
                div.dataset.y = args.blue[i].substring(1, 2);
                $s.将棋盤.appendChild(div);
            }
        }
    }


    //駒配置
    for(var y in 局面['駒']){
        for(var x in 局面['駒'][y]){
            if(局面['駒'][y][x]){
                $s.描画.駒配置(局面['駒'][y][x], x, y, 反転);
            }
        }
    }

    //先手持ち駒配置
    for(var 駒 in 局面['先手持ち駒']){
        $s[先手+'駒台_'+駒].setAttribute("data-num", 局面['先手持ち駒'][駒]);
    }
    //後手持ち駒配置
    for(var 駒 in 局面['後手持ち駒']){
        $s[後手+'駒台_'+駒].setAttribute("data-num", 局面['後手持ち駒'][駒]);
    }

    //指し手
    $s.指し手.selectedIndex = 手数;
    
    //名前
    if($s.先手名.名前 && $s.後手名.名前){
        $s[先手+'名'].textContent = '▲' + $s.先手名.名前;
        $s[後手+'名'].textContent = '△' + $s.後手名.名前;
    }
    
    //コメント
    if(args.comment){
        args.comment.textContent = $s.指し手.一覧[手数]['コメント'];
    }
};


$s.描画.手数正規化 = function(手数){
    if(手数 < 0){
        手数 = $s.局面.一覧.length + 手数;
        if(手数 < 0){
            手数 = 0;
        }
    }
    if(手数 >= $s.局面.一覧.length){
        手数 = $s.局面.一覧.length - 1;
    }
    return 手数;
};


$s.描画.駒配置 = function(駒, x, y, 反転){
    if(反転){
        x = 10 - x;
        y = 10 - y;
        駒 = (駒.match('_'))  ?  駒.replace('_', '')  :  駒 + '_';
    }

    var div = document.createElement('div');
    div.className = '将棋タイム-駒';
    div.dataset.koma = 駒;
    div.dataset.x = x;
    div.dataset.y = y;
    $s.将棋盤.appendChild(div);
};




$s.最初に移動ボタン.addEventListener('click', function(event){
    $s.描画(0);
});


$s.前に移動ボタン.addEventListener('click', function(event){
    var 現在の手数 = $s.指し手.selectedIndex || 0;
    if(現在の手数 < 1){
        return;
    }
    $s.描画(現在の手数 - 1);
});


$s.次に移動ボタン.addEventListener('click', function(event){
    var 現在の手数 = $s.指し手.selectedIndex || 0;
    if(現在の手数 >= $s.局面.一覧.length - 1){
        return;
    }
    $s.描画(現在の手数 + 1);
});


$s.次に移動ボタン.addEventListener('wheel', function(event){
    event.preventDefault();
    var 現在の手数 = $s.指し手.selectedIndex || 0;
    if(event.deltaY < 0){
        if(現在の手数 < 1){
            return;
        }
        $s.描画(現在の手数 - 1);
    }
    else{
        if(現在の手数 >= $s.局面.一覧.length - 1){
            return;
        }
        $s.描画(現在の手数 + 1);
    }
});


$s.最後に移動ボタン.addEventListener('click', function(event){
    $s.描画(-1);
});


$s.指し手.一覧 = [{手数:0, コメント:''}];


$s.指し手.HTML作成 = function (){
    for(var i = 1; i < $s.指し手.一覧.length; i++){
        var option = document.createElement('option');
        option.textContent = $s.指し手.一覧[i]['手数'] + ' ' + $s.指し手.一覧[i]['表記'];
        $s.指し手.appendChild(option);
    }
};


$s.指し手.addEventListener('change', function(event){
    $s.描画($s.指し手.selectedIndex || 0);
});


$s.反転ボタン.addEventListener('click', function(event){
    if($s.将棋盤.hasAttribute('data-reverse')){
        $s.将棋盤.removeAttribute('data-reverse');
    }
    else{
        $s.将棋盤.setAttribute('data-reverse', '1');
    }
    $s.描画($s.指し手.selectedIndex || 0);
});



$s.kif = {};


$s.kif.解析 = function(kif){
    kif = kif.split(/\r?\n/);
    var 局面図   = [];
    var 対局情報 = {};
    for(var i = 0; i < kif.length; i++){
        if(kif[i].indexOf('#') === 0){
            continue;
        }
        else if(kif[i].indexOf('|') === 0){
            局面図.push(kif[i]);
        }
        else if(kif[i].indexOf('：') > -1){
            var info = kif[i].split('：'); //手抜き
            対局情報[info[0]] = info[1];
        }
        else if(kif[i].match(/^\s*1\s/) || kif[i].match(/^\*/)){
            $s.kif.指し手の解析(kif.slice(i));
            break;
        }
    }
    if(対局情報['先手の持駒'] && 対局情報['後手の持駒']){
        $s.kif.局面図の解析(局面図);
        $s.kif.持ち駒の解析(対局情報['先手の持駒'], '先手')
        $s.kif.持ち駒の解析(対局情報['後手の持駒'], '後手')
    }
    if(対局情報['先手'] && 対局情報['後手']){
        $s.先手名.名前 = 対局情報['先手'];
        $s.後手名.名前 = 対局情報['後手'];
    }
};


$s.kif.指し手の解析 = function(kif){
    var 全数字 = {'１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9};
    var 漢数字 = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9};
    var 手数   = 0;

    for(var i = 0; i < kif.length; i++){
        if(kif[i].match(/^[\&\#]/)){ //コメント行
            continue;
        }
        if(kif[i].indexOf('*') === 0){ //指し手コメント
            $s.指し手.一覧[手数]['コメント'] += kif[i].replace(/^\*/, '') + '\n';
            continue;
        }
        var 項目 = kif[i].trim().split(/ +/);
        手数     = 項目[0] || '';
        var 現在の手 = 項目[1] || '';
        if(!手数.match(/^[1-9]/)){
            break;
        }
        手数 = Number(手数);

        var 解析 = 現在の手.match(/([１-９同])([一二三四五六七八九　])([^\(]+)(\((\d)(\d)\))?/);
        //解析例
        // ["４六銀(45)", "４", "六", "銀", "(45)", "4", "5"]
        // ["同　角成(86)", "同", "　", "角成", "(86)", "8", "6"]
        // ["７七銀打", "７", "七", "銀打", undefined, undefined, undefined]

        if(!解析){
            break;
        }

        var 指し手 = {
            '手数': 手数,
            '駒'  : 解析[3].replace(/[打成]$/, '').replace('成銀', '全').replace('成桂', '圭').replace('成香', '杏').replace('王', '玉').replace('竜', '龍'),
            '前X' : Number(解析[5] || 0),
            '前Y' : Number(解析[6] || 0),
            '後X' : (解析[1] === '同') ? $s.指し手.一覧[手数-1]['後X'] : 全数字[解析[1]],
            '後Y' : (解析[1] === '同') ? $s.指し手.一覧[手数-1]['後Y'] : 漢数字[解析[2]],
            '成り': /成$/.test(解析[3]),
            '表記': ((手数 % 2 === 1) ? '▲' : '△') + 解析[0],
            'コメント': '',
        };
        $s.指し手.一覧.push(指し手);
    }
};



$s.kif.持ち駒の解析 = function(str, 先手){
    str = str.trim();
    if(str === 'なし'){
        return;
    }
    var 漢数字 = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12, '十三':13, '十四':14, '十五':15, '十六':16, '十七':17, '十八':18};
    var 持ち駒 = (先手 === '先手') ? $s.局面.一覧[0]['先手持ち駒'] : $s.局面.一覧[0]['後手持ち駒'];
    var kif持ち駒 = str.split(/\s/);

    for(var i = 0; i < kif持ち駒.length; i++){
        var 駒 = kif持ち駒[i].substr(0, 1);
        var 数 = kif持ち駒[i].substr(1);

        持ち駒[駒] = (数) ? 漢数字[数] : 1;
    }
};


$s.kif.局面図の解析 = function(局面図配列){
    if(局面図配列.length !== 9){
        return;
    }

    var 局面 = $s.局面.駒無し();
    var 先手 = true;
    var x    = 10;

    for(var y = 0; y < 9; y++){
        x = 10;
        var str = 局面図配列[y];
        for(var i = 1; i < str.length; i++){
            if(str[i] === ' '){
                先手 = true;
                x -= 1;
                continue;
            }
            else if(str[i] === 'v'){
                先手 = false;
                x -= 1;
                continue;
            }
            else if(str[i] === '|'){
                break;
            }
            else if(str[i] === '・'){
                continue;
            }
            
            var 駒 = str[i];
            if(駒 === '王') 駒 = '玉';

            局面[y+1][x] = (先手) ?  駒 : 駒 + '_';
        }
    }

    $s.局面.一覧[0]['駒'] = 局面;
};




$s.スタートアップ();

}



将棋タイム.bloc = function(root, self){
    var splitter = '-';

    if(typeof root === 'string'){
        if(root.match(/^</)){
            var tmpdiv = document.createElement('div');
            tmpdiv.innerHTML = root;
            root = tmpdiv.firstElementChild;
        }
        else{
            root = document.querySelector(root);
        }
    }

    if(self === undefined){
        self = {};
    }

    self.root = root;

    var blocName = root.classList[0] || '';
    if(blocName === ''){
        throw 'ブロック名が存在しません';
    }
    if(blocName.indexOf(splitter) !== -1){
        throw 'ブロック名に ' + splitter + ' は使用できません: ' + blocName;
    }

    var elements = root.querySelectorAll("*");

    for(var i = 0; i < elements.length; i++){
        var className = elements[i].classList[0] || '';
        var name      = className.split(splitter);
        var firstName = name.shift();
        var lastName  = name.join('_');

        if(firstName !== blocName){
            continue;
        }
        if(self.hasOwnProperty(lastName)){
            throw '識別名が重複しています: ' + className;
        }

        self[lastName] = elements[i];
    }
    
    return self;
};

将棋タイム.HTML = (function() {/*
<div class="将棋タイム">
  <div class="将棋タイム-後手名"></div>
  <div class="将棋タイム-局面">
    <div class="将棋タイム-後手駒台">
      <div class="将棋タイム-後手駒台-歩" data-num="0" data-koma="歩_"></div>
      <div class="将棋タイム-後手駒台-香" data-num="0" data-koma="香_"></div>
      <div class="将棋タイム-後手駒台-桂" data-num="0" data-koma="桂_"></div>
      <div class="将棋タイム-後手駒台-銀" data-num="0" data-koma="銀_"></div>
      <div class="将棋タイム-後手駒台-金" data-num="0" data-koma="金_"></div>
      <div class="将棋タイム-後手駒台-角" data-num="0" data-koma="角_"></div>
      <div class="将棋タイム-後手駒台-飛" data-num="0" data-koma="飛_"></div>
    </div>
    <div class="将棋タイム-将棋盤"></div>
    <div class="将棋タイム-先手駒台">
      <div class="将棋タイム-先手駒台-飛" data-num="0" data-koma="飛"></div>
      <div class="将棋タイム-先手駒台-角" data-num="0" data-koma="角"></div>
      <div class="将棋タイム-先手駒台-金" data-num="0" data-koma="金"></div>
      <div class="将棋タイム-先手駒台-銀" data-num="0" data-koma="銀"></div>
      <div class="将棋タイム-先手駒台-桂" data-num="0" data-koma="桂"></div>
      <div class="将棋タイム-先手駒台-香" data-num="0" data-koma="香"></div>
      <div class="将棋タイム-先手駒台-歩" data-num="0" data-koma="歩"></div>
    </div>
  </div>
  <div class="将棋タイム-先手名"></div>
  <div class="将棋タイム-コントロールパネル">
    <div class="将棋タイム-最初に移動ボタン"></div>
    <div class="将棋タイム-前に移動ボタン"></div>
    <div class="将棋タイム-次に移動ボタン"></div>
    <div class="将棋タイム-最後に移動ボタン"></div>
    <select class="将棋タイム-指し手"><option selected>開始局面</option></select>
    <div class="将棋タイム-反転ボタン"></div>
  </div>
</div>
*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();



将棋タイム.CSS = (function() {/*
.将棋タイム{
    -ms-user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    width: 514px;
}
.将棋タイム *{
    box-sizing: border-box;
}
.将棋タイム-先手名{
    width: 100%;
    text-align: right;
    font-size: 14px;
    font-family: meiryo, sans-serif;
}
.将棋タイム-後手名{
    width: 100%;
    font-size: 14px;
    font-family: meiryo, sans-serif;
}
.将棋タイム-先手名:empty,
.将棋タイム-先手名:empty{
    display: none;
}


.将棋タイム-局面{
    display: flex;
}

.将棋タイム-先手駒台{
    width: 49px;
    height: 340px;
    background-image: url('盤.png');
    align-self: flex-end;
    padding: 2px 0;
    display: flex;
    flex-direction: column;
}
.将棋タイム-後手駒台{
    width: 49px;
    height: 340px;
    background-image: url('盤.png');
    padding: 2px 0;
    display: flex;
    flex-direction: column;
}

.将棋タイム-先手駒台 > div,
.将棋タイム-後手駒台 > div{
    width: 43px;
    height: 48px;
    background-repeat: no-repeat;
    color: #fff;
    text-shadow: -1px -1px #333, 1px -1px #333, -1px 1px #333, 1px 1px #333;
    font-family: Arial, sans-serif;
    font-size: 18px;
    text-align: right;
    padding-top: 30px;
}
.将棋タイム-先手駒台 > div::after,
.将棋タイム-後手駒台 > div::after{
    content: attr(data-num);
}

.将棋タイム-先手駒台 > div[data-num='0'],
.将棋タイム-後手駒台 > div[data-num='0']{
    display: none;
}
.将棋タイム-先手駒台 > div[data-num='1'],
.将棋タイム-後手駒台 > div[data-num='1']{
    color: transparent;
    text-shadow: none;
}


.将棋タイム-将棋盤{
    width: 410px;
    height: 454px;
    background-image: url('マス.png'), url('盤.png');
    position: relative;
    margin: 0 3px;
}

.将棋タイム-将棋盤[data-reverse]{
    background-image: url('マス_.png'), url('盤.png');
}

.将棋タイム-駒{
    width: 43px;
    height: 48px;
    background-repeat: no-repeat;
    position: absolute;
    z-index: 2;
}
.将棋タイム-最終手,.将棋タイム-青{
    width: 43px;
    height: 48px;
    background-image: url('青.png');
    background-repeat: no-repeat;
    position: absolute;
    z-index: 1;
}
.将棋タイム-緑{
    width: 43px;
    height: 48px;
    background-image: url('緑.png');
    background-repeat: no-repeat;
    position: absolute;
    z-index: 1;
}
.将棋タイム-赤{
    width: 43px;
    height: 48px;
    background-image: url('赤.png');
    background-repeat: no-repeat;
    position: absolute;
    z-index: 1;
}

.将棋タイム [data-koma='歩']{
    background-image: url('歩.png');
}
.将棋タイム [data-koma='歩_']{
    background-image: url('歩_.png');
}

.将棋タイム [data-koma='と']{
    background-image: url('と.png');
}
.将棋タイム [data-koma='と_']{
    background-image: url('と_.png');
}


.将棋タイム [data-koma='香']{
    background-image: url('香.png');
}
.将棋タイム [data-koma='香_']{
    background-image: url('香_.png');
}

.将棋タイム [data-koma='杏']{
    background-image: url('杏.png');
}
.将棋タイム [data-koma='杏_']{
    background-image: url('杏_.png');
}

.将棋タイム [data-koma='桂']{
    background-image: url('桂.png');
}
.将棋タイム [data-koma='桂_']{
    background-image: url('桂_.png');
}

.将棋タイム [data-koma='圭']{
    background-image: url('圭.png');
}
.将棋タイム [data-koma='圭_']{
    background-image: url('圭_.png');
}

.将棋タイム [data-koma='銀']{
    background-image: url('銀.png');
}
.将棋タイム [data-koma='銀_']{
    background-image: url('銀_.png');
}

.将棋タイム [data-koma='全']{
    background-image: url('全.png');
}
.将棋タイム [data-koma='全_']{
    background-image: url('全_.png');
}

.将棋タイム [data-koma='金']{
    background-image: url('金.png');
}
.将棋タイム [data-koma='金_']{
    background-image: url('金_.png');
}

.将棋タイム [data-koma='角']{
    background-image: url('角.png');
}
.将棋タイム [data-koma='角_']{
    background-image: url('角_.png');
}

.将棋タイム [data-koma='馬']{
    background-image: url('馬.png');
}
.将棋タイム [data-koma='馬_']{
    background-image: url('馬_.png');
}

.将棋タイム [data-koma='飛']{
    background-image: url('飛.png');
}
.将棋タイム [data-koma='飛_']{
    background-image: url('飛_.png');
}

.将棋タイム [data-koma='龍']{
    background-image: url('龍.png');
}
.将棋タイム [data-koma='龍_']{
    background-image: url('龍_.png');
}


.将棋タイム [data-koma='玉']{
    background-image: url('玉.png');
}
.将棋タイム [data-koma='玉_']{
    background-image: url('玉_.png');
}


.将棋タイム [data-x='1']{
    left: 355px;
}
.将棋タイム [data-x='2']{
    left: 312px;
}
.将棋タイム [data-x='3']{
    left: 269px;
}
.将棋タイム [data-x='4']{
    left: 226px;
}
.将棋タイム [data-x='5']{
    left: 183px;
}
.将棋タイム [data-x='6']{
    left: 140px;
}
.将棋タイム [data-x='7']{
    left: 97px;
}
.将棋タイム [data-x='8']{
    left: 54px;
}
.将棋タイム [data-x='9']{
    left: 11px;
}
.将棋タイム [data-y='1']{
    top: 11px;
}
.将棋タイム [data-y='2']{
    top: 59px;
}
.将棋タイム [data-y='3']{
    top: 107px;
}
.将棋タイム [data-y='4']{
    top: 155px;
}
.将棋タイム [data-y='5']{
    top: 203px;
}
.将棋タイム [data-y='6']{
    top: 251px;
}
.将棋タイム [data-y='7']{
    top: 299px;
}
.将棋タイム [data-y='8']{
    top: 347px;
}
.将棋タイム [data-y='9']{
    top: 395px;
}


.将棋タイム-コントロールパネル{
    width: 100%;
    display: flex;
    justify-content:center;
    margin-top: 3px;
}
.将棋タイム-コントロールパネル > div{
    border: solid 1px #ccc;
    border-radius: 3px;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content:center;
    align-items: center;
    margin: 0 3px;
    cursor: pointer;
    background-color: #fff;
    background-position: center center;
    background-size: 14px 14px;
    background-repeat: no-repeat;
}
.将棋タイム-最初に移動ボタン{
    background-image: url('step-forward_.png');
}
.将棋タイム-前に移動ボタン{
    background-image: url('play_.png');
}
.将棋タイム-次に移動ボタン{
    background-image: url('play.png');
}
.将棋タイム-最後に移動ボタン{
    background-image: url('step-forward.png');
}
.将棋タイム-指し手{
    margin: 0 8px;
}
.将棋タイム-反転ボタン{
    background-image: url('refresh.png');
}

*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();


document.addEventListener('DOMContentLoaded', function(event){
    //shogitimeディレクトリのURLを求める
    var currentScript = document.querySelector("script[src*='shogitime.js']");
    将棋タイム.URL  = currentScript.src.replace(/\/[^\/]*$/, '') + '/'; //PHPの dirname() 相当

    //CSSの「URL()」の内容を、相対パスからURLに変換する
    将棋タイム.CSS  = 将棋タイム.CSS.replace(/url\([\'\"]?/g, "$&" + 将棋タイム.URL);

    var style = document.createElement('style');
    style.innerHTML = 将棋タイム.CSS;
    document.head.insertBefore(style, document.head.firstElementChild);

    var pre = document.querySelectorAll("script[type='kif']");
    for(var i = 0; i < pre.length; i++){
        将棋タイム({
            el: pre[i],
            kif: pre[i].textContent,
            start: pre[i].getAttribute("start"),
            reverse: pre[i].hasAttribute("reverse"),
            comment: pre[i].getAttribute("comment"),
            green: pre[i].getAttribute("green"),
            red: pre[i].getAttribute("red"),
            blue: pre[i].getAttribute("blue"),
        });
    }
});
