
function 将棋タイム(args){
    if(将棋タイム.引数確認(args) === false){
        return;
    }

    var $b = 将棋タイム.bloc(将棋タイム.HTML);

    $b.state        = 将棋タイム.KIF解析(args.kif);
    $b.state.手数   = 将棋タイム.手数正規化(args.start, $b.state.総手数);
    $b.state.全局面 = 将棋タイム.全局面構築($b.state.全指し手, $b.state.初期局面);
    $b.state.args   = args;

    将棋タイム.描画.初回($b);
}



将棋タイム.スタートアップ = function(){
    //shogitimeのURLを求める
    var currentScript = document.querySelector("script[src*='shogitime.js']");
    将棋タイム.URL = currentScript.src.replace(/\/[^\/]*$/, '') + '/'; //PHPの dirname() 相当

    //CSSの「URL()」の内容を、相対パスからURLに変換する
    将棋タイム.CSS = 将棋タイム.CSS.replace(/url\([\'\"]?/g, "$&" + 将棋タイム.URL);

    var style = document.createElement('style');
    style.innerHTML = 将棋タイム.CSS;
    document.head.insertBefore(style, document.head.firstElementChild);

    document.readyState === 'loading'  ?  document.addEventListener('DOMContentLoaded', 将棋タイム.スタートアップ.実行)  :  将棋タイム.スタートアップ.実行();
};



将棋タイム.スタートアップ.実行 = function (event){
    var el = document.querySelectorAll("[type='kif']");
    for(var i = 0; i < el.length; i++){
        将棋タイム({
            el: el[i],
            kif: el[i].textContent,
            start: el[i].getAttribute("start"),
            reverse: el[i].hasAttribute("reverse"),
            comment: el[i].getAttribute("comment"),
            green: el[i].getAttribute("green"),
            red: el[i].getAttribute("red"),
            blue: el[i].getAttribute("blue"),
        });
    }
};



将棋タイム.引数確認 = function (args){
    args.kif = args.kif || '';
    args.kif = args.kif.trim();

    if(args.kif.match(/^https?:/)){
        var xhr = new XMLHttpRequest();
        xhr.open('GET', args.kif);
        xhr.timeout = 60 * 1000;
        if(!args.kif.match(/\.kifu$/)){
            xhr.overrideMimeType('text/plain; charset=Shift_JIS');
        }
        xhr.onload = function(e) {
            args.kif = xhr.responseText;
            将棋タイム(args);
        };
        xhr.send();
        return false;
   }

    if(!(args.el instanceof Element)){
        throw '将棋タイムの起動オプション「el」にはDOM要素を指定してください ＞ 将棋タイム({el:DOM要素})';
    }

    args.start = Number(args.start || 0);

    if(args.comment){
        args.comment = document.querySelector(args.comment);
    }

    if(args.green){
        args.green = String(args.green).split(',');
    }
    if(args.red){
        args.red = String(args.red).split(',');
    }
    if(args.blue){
        args.blue = String(args.blue).split(',');
    }
};



将棋タイム.描画 = function($b){
    var 手数 = $b.state.手数;
    var 局面 = $b.state.全局面[手数];

    //初期化
    $b.将棋盤.innerHTML = '';

    //反転
    var 反転 = $b.root.hasAttribute('data-reverse');
    var 先手 = (反転) ? '後手' : '先手';
    var 後手 = (反転) ? '先手' : '後手';

    //マスハイライト
    if(手数 !== 0){
        $b.将棋盤.appendChild( 将棋タイム.描画.最終手ハイライトDOM作成($b.state.全指し手[手数].後X, $b.state.全指し手[手数].後Y, 反転) );
    }
    else{
        if(Array.isArray($b.state.args.green)){
            $b.将棋盤.appendChild( 将棋タイム.描画.マスハイライトDOM作成($b.state.args.green, '緑') );
        }
        if(Array.isArray($b.state.args.red)){
            $b.将棋盤.appendChild( 将棋タイム.描画.マスハイライトDOM作成($b.state.args.red, '赤') );
        }
        if(Array.isArray($b.state.args.blue)){
            $b.将棋盤.appendChild( 将棋タイム.描画.マスハイライトDOM作成($b.state.args.blue, '青') );
        }
    }


    //駒配置
    for(var y in 局面.駒){
        for(var x in 局面.駒[y]){
            if(局面.駒[y][x]){
                $b.将棋盤.appendChild( 将棋タイム.描画.駒DOM作成(局面.駒[y][x], x, y, 反転) );
            }
        }
    }

    //先手持駒配置
    for(var 駒 in 局面.先手の持駒){
        $b[先手+'駒台_'+駒].setAttribute("data-num", 局面.先手の持駒[駒]);
    }
    //後手持駒配置
    for(var 駒 in 局面.後手の持駒){
        $b[後手+'駒台_'+駒].setAttribute("data-num", 局面.後手の持駒[駒]);
    }

    //指し手
    $b.指し手.selectedIndex = 手数;
    
    //名前
    if($b.state.先手名 && $b.state.後手名){
        $b[先手+'名'].textContent = '▲' + $b.state.先手名;
        $b[後手+'名'].textContent = '△' + $b.state.後手名;
    }
    
    //コメント
    if($b.state.args.comment){
        $b.state.args.comment.textContent = $b.state.全指し手[手数].コメント;
    }
};



将棋タイム.描画.初回 = function ($b){
    $b.指し手.appendChild( 将棋タイム.描画.初回.指し手DOM作成($b.state.全指し手, $b.state.勝敗) );

    if($b.state.総手数 === 0){
        $b.コントロールパネル.style.display = 'none';
    }

    if($b.state.args.reverse){
        $b.root.setAttribute('data-reverse', '');
    }

    将棋タイム.描画($b);
    将棋タイム.全イベント登録($b);
    $b.state.args.el.parentNode.replaceChild($b.root, $b.state.args.el);
};



将棋タイム.描画.初回.指し手DOM作成 = function (全指し手, 勝敗){
    var fragment = document.createDocumentFragment();

    for(var i = 1; i < 全指し手.length; i++){
        var option = document.createElement('option');
        option.textContent = 全指し手[i].手数 + ' ' + 全指し手[i].表記;
        fragment.appendChild(option);
    }

    if(勝敗){
        var option = document.createElement('option');
        option.textContent = 勝敗.表記;
        fragment.appendChild(option);
    }

    return fragment;
};



将棋タイム.描画.駒DOM作成 = function(駒, x, y, 反転){
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

    return div;
};



将棋タイム.描画.最終手ハイライトDOM作成 = function (x, y, 反転){
    if(反転){
        x = 10 - x;
        y = 10 - y;
    }

    var div = document.createElement('div');
    div.className = '将棋タイム-最終手';
    div.dataset.x = x;
    div.dataset.y = y;
    
    return div;
};



将棋タイム.描画.マスハイライトDOM作成 = function(マス, 色名){
    var fragment = document.createDocumentFragment();

    for(var i = 0; i < マス.length; i++){
        var div = document.createElement('div');
        div.className = '将棋タイム-' + 色名;
        div.dataset.x = マス[i].substring(0, 1);
        div.dataset.y = マス[i].substring(1, 2);
        fragment.appendChild(div);
    }
    return fragment;
};



将棋タイム.全局面構築 = function(指し手一覧, 初期局面){
    var 全局面 = [初期局面];

    for(var i = 1; i < 指し手一覧.length; i++){
        全局面.push( 将棋タイム.全局面構築.各局面(指し手一覧[i], 全局面[i-1]) );
    }

    return 全局面;
};



将棋タイム.全局面構築.各局面 = function(指し手, 前局面){
    // 指し手 = {'手数','駒','前X','前Y','後X','後Y','成り','表記'};

    var 局面 = 将棋タイム.オブジェクトコピー(前局面);
    var 手番 = (指し手.手数 % 2) ? '先手' : '後手';
    var 駒   = 指し手.駒;

    var 成変換 = {'歩':'と', '香':'杏', '桂':'圭', '銀':'全', '角':'馬', '飛':'龍'};
    var 逆変換 = {'と':'歩', '杏':'香', '圭':'桂', '全':'銀', '馬':'角', '龍':'飛', '竜':'飛'};

    if(指し手.前X !== 0){ //駒を移動する場合
        局面.駒[指し手.前Y][指し手.前X] = null;

        //駒が成る場合
        if(指し手.成り){
            駒 = (駒 in 成変換) ? 成変換[駒] : 駒;
        }

        //駒を取る場合
        if(局面.駒[指し手.後Y][指し手.後X]){
            var 取った駒 = 局面.駒[指し手.後Y][指し手.後X].replace('_', '');
            取った駒 = (取った駒 in 逆変換) ? 逆変換[取った駒] : 取った駒;
            局面[手番+'の持駒'][取った駒]++;
        }
    }
    else{ //駒を打つ場合
        局面[手番+'の持駒'][駒]--;
    }

    if(手番 === '後手'){
        駒 += '_';
    }

    局面.駒[指し手.後Y][指し手.後X] = 駒;

    return 局面;
};



将棋タイム.手数正規化 = function(手数, 総手数){
    if(総手数 === 0){
        return 0;
    }
    if(手数 < 0){
        手数 = 総手数 + 手数 + 1;
    }
    if(手数 > 総手数){
        return 総手数;
    }
    return 手数;
};




将棋タイム.KIF解析 = function(kif){
    var 一次解析 = {局面図:[]};
    var 解析結果 = {};

    kif = kif.split(/\r?\n/);

    for(var i = 0; i < kif.length; i++){
        if(kif[i].indexOf('#') === 0){
            continue;
        }
        else if(kif[i].indexOf('|') === 0){
            一次解析.局面図.push(kif[i]);
        }
        else if(kif[i].indexOf('：') > -1){
            var info = kif[i].split('：'); //手抜き
            一次解析[info[0]] = info[1];
        }
        else if(kif[i].match(/^\s*1\s/) || kif[i].match(/^\*/)){
            一次解析.全指し手 = kif.slice(i);
            break;
        }
    }

    解析結果.初期局面 = {
        '駒'        : 将棋タイム.KIF解析.局面図(一次解析.局面図),
        '先手の持駒': 将棋タイム.KIF解析.持駒(一次解析.先手の持駒),
        '後手の持駒': 将棋タイム.KIF解析.持駒(一次解析.後手の持駒),
    };

    解析結果.先手名   = 一次解析.先手 || '';
    解析結果.後手名   = 一次解析.後手 || '';

    解析結果.全指し手 = 将棋タイム.KIF解析.指し手(一次解析.全指し手);
    if('勝者' in 解析結果.全指し手[解析結果.全指し手.length-1]){
        解析結果.勝敗 = 解析結果.全指し手.pop();
    }
    解析結果.総手数   = 解析結果.全指し手.length - 1;

    return 解析結果;
};



将棋タイム.KIF解析.局面図 = function(kif局面図){
    if(kif局面図.length !== 9){
        return 将棋タイム.オブジェクトコピー(将棋タイム.初期局面);
    }

    var 局面 = 将棋タイム.オブジェクトコピー(将棋タイム.駒無し局面);
    var 先手 = true;
    var x    = 10;

    for(var y = 0; y < 9; y++){
        x = 10;
        var str = kif局面図[y];
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

    return 局面;
};



将棋タイム.KIF解析.持駒 = function(kif持駒){
    var 持駒 = {'歩': 0, '香': 0, '桂': 0, '銀': 0, '金': 0, '飛': 0, '角': 0};

    if(kif持駒 === undefined || kif持駒.match('なし')){
        return 持駒;
    }
    kif持駒 = kif持駒.trim();

    var 漢数字 = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12, '十三':13, '十四':14, '十五':15, '十六':16, '十七':17, '十八':18};
    var str    = kif持駒.split(/\s/);

    for(var i = 0; i < str.length; i++){
        var 駒 = str[i].substr(0, 1);
        var 数 = str[i].substr(1);

        if(駒 in 持駒){
            持駒[駒] = (数) ? 漢数字[数] : 1;
        }
    }

    return 持駒;
};



将棋タイム.KIF解析.指し手 = function(kif指し手){
    var 全指し手 = [{手数:0, コメント:''}];

    if(!kif指し手){
        return 全指し手;
    }

    var 全数字   = {'１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9};
    var 漢数字   = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9};
    var 終局表記 = ['中断', '投了', '持将棋', '千日手', '詰み', '切れ負け', '反則勝ち', '反則負け'];
    var 手数     = 0;
    var 手番     = '▲';

    for(var i = 0; i < kif指し手.length; i++){
        if(kif指し手[i].match(/^[\&\#]/)){ //コメント行
            continue;
        }
        if(kif指し手[i].indexOf('*') === 0){ //指し手コメント
            全指し手[手数].コメント += kif指し手[i].replace(/^\*/, '') + '\n';
            continue;
        }
        var 項目 = kif指し手[i].trim().split(/ +/);
        手数     = 項目[0] || '';
        var 現在の手 = 項目[1] || '';
        if(!手数.match(/^[1-9]/)){
            break;
        }
        手数 = Number(手数);
        手番 = (手数 % 2 === 1) ? '▲' : '△';

        var 解析 = 現在の手.match(/([１-９同])([一二三四五六七八九　])([^\(]+)(\((\d)(\d)\))?/);
        //解析例
        // ["４六銀(45)", "４", "六", "銀", "(45)", "4", "5"]
        // ["同　角成(86)", "同", "　", "角成", "(86)", "8", "6"]
        // ["７七銀打", "７", "七", "銀打", undefined, undefined, undefined]

        if(!解析){
            if(終局表記.indexOf(現在の手) >= 0){
                全指し手.push(将棋タイム.KIF解析.指し手.勝敗(現在の手, 手番));
            }
            break;
        }

        var 指し手 = {
            '手数': 手数,
            '駒'  : 解析[3].replace(/[打成]$/, '').replace('成銀', '全').replace('成桂', '圭').replace('成香', '杏').replace('王', '玉').replace('竜', '龍'),
            '前X' : Number(解析[5] || 0),
            '前Y' : Number(解析[6] || 0),
            '後X' : (解析[1] === '同') ? 全指し手[手数-1].後X : 全数字[解析[1]],
            '後Y' : (解析[1] === '同') ? 全指し手[手数-1].後Y : 漢数字[解析[2]],
            '成り': /成$/.test(解析[3]),
            '表記': 手番 + 解析[0],
            'コメント': '',
        };
        全指し手.push(指し手);
    }
    
    return 全指し手;
};



将棋タイム.KIF解析.指し手.勝敗 = function (理由, 手番){
    var 結果 = {'勝者':'', '敗者':'', '理由':理由, '表記':''};

    if(理由 === '投了' || 理由 === '詰み' || 理由 === '切れ負け' || 理由 === '反則負け'){
        結果.勝者 = (手番 === '▲') ? '△' : '▲';
        結果.敗者 = (手番 === '▲') ? '▲' : '△';
        結果.表記 = 結果.敗者 + 理由 + 'で' + 結果.勝者 + 'の勝ち';
    }
    else if(理由 === '反則勝ち'){
        結果.勝者 = (手番 === '▲') ? '▲' : '△';
        結果.敗者 = (手番 === '▲') ? '△' : '▲';
        結果.表記 = 結果.敗者 + 理由 + 'で' + 結果.勝者 + 'の勝ち';
    }
    else if(理由 === '持将棋' || 理由 === '千日手'){
        結果.勝者 = 結果.敗者 = '引き分け';
        結果.表記 = 理由 + 'で引き分け';
    }
    else if(理由 === '中断'){
        結果.表記 = 理由;
    }

    return 結果;
};



将棋タイム.$最初に移動ボタン_click = function (event){
    this.$b.state.手数 = 0;
    将棋タイム.描画(this.$b);
};



将棋タイム.$前に移動ボタン_click = function (event){
    if(this.$b.指し手.selectedIndex > this.$b.state.総手数){
        this.$b.指し手.selectedIndex = this.$b.指し手.length - 2;
    }
    else if(this.$b.state.手数 > 0){
        this.$b.state.手数--;
        将棋タイム.描画(this.$b);
    }
};



将棋タイム.$次に移動ボタン_click = function(event){
    if(this.$b.state.手数 < this.$b.state.総手数){
        this.$b.state.手数++;
        将棋タイム.描画(this.$b);
    }
    else{
        this.$b.指し手.selectedIndex = this.$b.指し手.length - 1;
    }
};



将棋タイム.$次に移動ボタン_wheel = function(event){
    event.preventDefault();
    (event.deltaY > 0)  ?  this.$b.次に移動ボタン.click()  :  this.$b.前に移動ボタン.click();
};



将棋タイム.$最後に移動ボタン_click = function(event){
    this.$b.state.手数 = this.$b.state.総手数;
    将棋タイム.描画(this.$b);
    this.$b.指し手.selectedIndex = this.$b.指し手.length - 1;
};



将棋タイム.$指し手_change = function (event){
    if(this.$b.指し手.selectedIndex > this.$b.state.総手数){
        this.$b.最後に移動ボタン.click();
    }
    else{
        this.$b.state.手数 = this.$b.指し手.selectedIndex;
        将棋タイム.描画(this.$b);
    }
};



将棋タイム.$反転ボタン_click = function(event){
    (this.$b.root.hasAttribute('data-reverse'))  ?  this.$b.root.removeAttribute('data-reverse')  :  this.$b.root.setAttribute('data-reverse', '');
    将棋タイム.描画(this.$b);
};



将棋タイム.bloc = function(root){
    var $b = {};
    
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

    $b.root    = root;
    $b.state   = {};
    $b.root.$b = $b;

    var blocName = root.classList[0] || '';
    if(blocName === ''){
        throw 'ブロック名が存在しません';
    }
    if(blocName.indexOf('-') !== -1){
        throw 'ブロック名にハイフンは使用できません: ' + blocName;
    }

    var elements = root.querySelectorAll("*");

    for(var i = 0; i < elements.length; i++){
        var className = elements[i].classList[0] || '';
        var name      = className.split('-');
        var firstName = name.shift();
        var lastName  = name.join('_');

        if(firstName !== blocName){
            continue;
        }
        if($b.hasOwnProperty(lastName)){
            throw '識別名が重複しています: ' + className;
        }

        $b[lastName] = elements[i];
    }

    return $b;
};



将棋タイム.全イベント登録 = function ($b){
    for(var name in this){
        if(name.indexOf('$') !== 0 || typeof this[name] !== 'function'){
            continue;
        }
        var names     = name.substring(1).split('_');
        var eventName = names.pop();
        var className = names.join('_');

        $b[className].addEventListener(eventName, {'handleEvent': this[name], '$b': $b});
    }
};



将棋タイム.オブジェクトコピー = function(from){
    var to = {};
    for(var key in from){
        to[key] = (from[key] instanceof Object)  ?  将棋タイム.オブジェクトコピー(from[key])  :  from[key];
    }
    return to;
};



将棋タイム.初期局面 = {
    '1': {'1': '香_', '2': '桂_', '3': '銀_', '4': '金_', '5': '玉_', '6': '金_', '7': '銀_', '8': '桂_', '9': '香_'},
    '2': {'1': null, '2': '角_', '3': null, '4': null, '5': null, '6': null, '7': null, '8': '飛_', '9': null},
    '3': {'1': '歩_', '2': '歩_', '3': '歩_', '4': '歩_', '5': '歩_', '6': '歩_', '7': '歩_', '8': '歩_', '9': '歩_'},
    '4': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
    '5': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
    '6': {'1': null, '2': null, '3': null, '4': null, '5': null, '6': null, '7': null, '8': null, '9': null},
    '7': {'1': '歩', '2': '歩', '3': '歩', '4': '歩', '5': '歩', '6': '歩', '7': '歩', '8': '歩', '9': '歩'},
    '8': {'1': null, '2': '飛', '3': null, '4': null, '5': null, '6': null, '7': null, '8': '角', '9': null},
    '9': {'1': '香', '2': '桂', '3': '銀', '4': '金', '5': '玉', '6': '金', '7': '銀', '8': '桂', '9': '香'},
};



将棋タイム.駒無し局面 = {
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
    margin: 50px auto;
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

.将棋タイム[data-reverse] .将棋タイム-将棋盤{
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



将棋タイム.スタートアップ();
