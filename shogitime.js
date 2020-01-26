
function 将棋タイム(args){
    if(将棋タイム.引数確認(args) === false){
        return;
    }

    将棋タイム.セットアップ();

    var $ = 将棋タイム.SilverState(将棋タイム, 将棋タイム.HTML, 将棋タイム.CSS, 将棋タイム.KIF解析(args.kif));

    if(args.myname && $.後手名.indexOf(args.myname) === 0){
        args.reverse = true;
    }
    if($.最終手){
        args.blue = [$.最終手];
    }

    $.手数   = 将棋タイム.手数正規化(args.start, $.総手数);
    $.全局面 = 将棋タイム.全局面構築($.全指し手, $.初期局面);
    $.data   = {'reverse': args.reverse};
    $.args   = args;

    将棋タイム.初回描画($);

    return $.$将棋タイム;
}



将棋タイム.スタートアップ = function (event){
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
            nocp: el[i].hasAttribute("nocp"),
            myname: el[i].getAttribute("myname"),
            graph: el[i].getAttribute("graph"),
        });
    }
};



将棋タイム.セットアップ = function (){
    var currentScript   = document.querySelector("script[src*='shogitime.js']");
    将棋タイム.URL      = currentScript.src.replace(/\/[^\/]*$/, '') + '/'; //PHPの dirname() 相当
    将棋タイム.CSS      = 将棋タイム.CSS.replace(/url\([\'\"]?/g, "$&" + 将棋タイム.URL); //CSSの「URL()」の内容を、相対パスからURLに変換する
    将棋タイム.駒音.src = 将棋タイム.URL + "駒音.mp3";

    将棋タイム.セットアップ = function (){};
};



将棋タイム.引数確認 = function (args){
    args.kif = args.kif || '';
    args.kif = args.kif.trim();

    if(args.kif.match(/^https?:/) || args.kif.match(/\.kifu?$/i)){
        将棋タイム.引数確認.ファイル取得(args);
        return false;
   }

    if(typeof args.el === 'string'){
        args.el = document.querySelector(args.el);
    }
    if(typeof args.comment === 'string'){
        args.comment = document.querySelector(args.comment);
    }
    if(typeof args.graph === 'string'){
        args.graph = document.querySelector(args.graph);
    }

    args.start   = Number(args.start || 0);
    args.reverse = Boolean(args.reverse);
    args.nocp    = Boolean(args.nocp);
    args.myname  = String(args.myname);


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



将棋タイム.引数確認.ファイル取得 = function (args){
    var 文字コード = (args.kif.match(/\.kifu$/)) ? 'UTF-8' : 'Shift_JIS';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', args.kif);

    xhr.timeout    = 60 * 1000;
    xhr.onloadend  = loadend;
    xhr.overrideMimeType('text/plain; charset=' + 文字コード);
    xhr.send();

    function loadend(event){
        args.kif = xhr.responseText;
        将棋タイム(args);
    }
};



将棋タイム.手数正規化 = function(手数, 総手数){
    if(!手数 || !総手数){
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



将棋タイム.全局面構築 = function(指し手一覧, 初期局面){
    var 全局面 = [];

    for(var i = 0; i < 指し手一覧.length; i++){
        全局面[i] = [初期局面];
        for(var j = 1; j < 指し手一覧[i].length; j++){
            全局面[i].push( 将棋タイム.全局面構築.各局面(指し手一覧[i][j], 全局面[i][j-1]) );
        }
    }

    return 全局面;
};



将棋タイム.全局面構築.各局面 = function(指し手, 前局面){
    // 指し手 = {'手数','手番','手','駒','前X','前Y','後X','後Y','成り'};

    var 局面 = 将棋タイム.オブジェクトコピー(前局面);
    var 手番 = (指し手.手番 === '▲') ? '先手' : '後手';
    var 駒   = 指し手.駒;

    var 成変換 = {'歩':'と', '香':'杏', '桂':'圭', '銀':'全', '角':'馬', '飛':'龍'};
    var 逆変換 = {'と':'歩', '杏':'香', '圭':'桂', '全':'銀', '馬':'角', '龍':'飛'};

    if(指し手.手 === 'パス'){
        return 局面;
    }

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



将棋タイム.初回描画 = function ($){
    将棋タイム.描画.指し手選択($);

    $.$ダイアログ_棋譜テキスト.value = $.args.kif + "\n";

    if($.args.nocp === true){
        $.$コントロールパネル.style.display = 'none';
    }
    if($.args.graph && $.評価値.length > 1){
        $.グラフ = 将棋タイム.グラフ($);
    }

    将棋タイム.描画($);

    if($.args.el){
        $.args.el.parentNode.replaceChild($.$将棋タイム, $.args.el);
    }

    将棋タイム.イベント発行('将棋タイム開始', $.$将棋タイム);
};



将棋タイム.描画 = function($){
    var 手数   = $.手数;
    var 局面   = $.全局面[$.変化][手数];
    var 指し手 = $.全指し手[$.変化][手数];
    var 反転   = $.data.reverse;
    var 先手   = (反転) ? '後手' : '先手';
    var 後手   = (反転) ? '先手' : '後手';

    //初期化
    $.$将棋盤.innerHTML = '';

    //マスハイライト
    if(手数 !== 0){
        $.$将棋盤.appendChild( 将棋タイム.描画.最終手ハイライト(指し手.後X, 指し手.後Y, 反転) );
    }
    else{
        if(Array.isArray($.args.green)){
            $.$将棋盤.appendChild( 将棋タイム.描画.マスハイライト($.args.green, '緑', 反転) );
        }
        if(Array.isArray($.args.red)){
            $.$将棋盤.appendChild( 将棋タイム.描画.マスハイライト($.args.red, '赤', 反転) );
        }
        if(Array.isArray($.args.blue)){
            $.$将棋盤.appendChild( 将棋タイム.描画.マスハイライト($.args.blue, '青', 反転) );
        }
    }


    //駒配置
    for(var y in 局面.駒){
        for(var x in 局面.駒[y]){
            if(局面.駒[y][x]){
                $.$将棋盤.appendChild( 将棋タイム.描画.駒(局面.駒[y][x], x, y, 反転) );
            }
        }
    }

    //先手持駒配置
    for(var 駒 in 局面.先手の持駒){
        $['$'+先手+'駒台_'+駒].setAttribute("data-num", 局面.先手の持駒[駒]);
    }
    //後手持駒配置
    for(var 駒 in 局面.後手の持駒){
        $['$'+後手+'駒台_'+駒].setAttribute("data-num", 局面.後手の持駒[駒]);
    }

    //指し手
    $.$指し手選択.selectedIndex = 手数;
    
    //名前
    if($.先手名){
        $['$'+先手+'名'].textContent = "▲" + $.先手名;
    }
    if($.後手名){
        $['$'+後手+'名'].textContent = "△" + $.後手名;
    }

    //コメント
    if($.args.comment){
        $.args.comment.textContent = 指し手.コメント;
    }

    //グラフ
    if($.グラフ){
        将棋タイム.グラフ.更新($.グラフ, 手数, $.評価値[手数], $.読み筋[手数]);
    }

    //変化選択
    $.$変化選択.innerHTML = '';
    if(!$.変化 && $.全指し手.変化手数.indexOf(手数) > -1){
        将棋タイム.描画.変化選択($);
    }
    else if($.変化 && $.変化手数 === 手数){
        将棋タイム.描画.変化中の変化選択($);
    }

    //data属性
    将棋タイム.描画.data属性($.$将棋タイム, $.data);
};



将棋タイム.描画.駒 = function(駒, x, y, 反転){
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



将棋タイム.描画.最終手ハイライト = function (x, y, 反転){
    if(!x || x > 9){
        x = y = 0;
    }
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



将棋タイム.描画.マスハイライト = function(マス, 色名, 反転){
    var fragment = document.createDocumentFragment();

    for(var i = 0; i < マス.length; i++){
        var div = document.createElement('div');
        div.className = '将棋タイム-' + 色名;
        div.dataset.x = マス[i].substring(0, 1);
        div.dataset.y = マス[i].substring(1, 2);
        if(反転){
            div.dataset.x = 10 - div.dataset.x;
            div.dataset.y = 10 - div.dataset.y;
        }
        fragment.appendChild(div);
    }
    return fragment;
};



将棋タイム.描画.data属性 = function(el, attr){
    for(var key in attr){
        var name = "data-" + key;
        if(typeof attr[key] === "boolean"){
            (attr[key]) ? el.setAttribute(name, "") : el.removeAttribute(name);
        }
        else{
            el.setAttribute(name, attr[key]);
        }
    }
};



将棋タイム.描画.指し手選択 = function ($){
    var 全指し手 = $.全指し手[$.変化];

    $.$指し手選択.innerHTML = '';
    $.$指し手選択.add(new Option('開始局面'));

    for(var i = 1; i < 全指し手.length; i++){
        $.$指し手選択.add(new Option(全指し手[i].手数 + ' ' + 全指し手[i].手番 + 全指し手[i].手));
    }

    if(全指し手.勝敗 && !$.変化){
        $.$指し手選択.add(new Option(全指し手.勝敗.表記));
    }
};



将棋タイム.描画.変化選択 = function ($){
    for(var i = 0; i < $.全指し手.変化手数.length; i++){
        if($.全指し手.変化手数[i] !== $.手数){
            continue;
        }
        var div = document.createElement('div');
        div.textContent = $.全指し手[i+1][$.手数].手番 + $.全指し手[i+1][$.手数].手;
        div.変化        = i + 1;
        $.$変化選択.appendChild(div);
    }
};



将棋タイム.描画.変化中の変化選択 = function ($){
    for(var i = 0; i < $.全指し手.変化手数.length; i++){
        if($.全指し手.変化手数[i] !== $.変化手数){
            continue;
        }
        var div = document.createElement('div');
        if($.変化 === i + 1){
            div.textContent = '本線に戻る';
            div.変化        = 0;
        }
        else{
            div.textContent = $.全指し手[i+1][$.手数].手番 + $.全指し手[i+1][$.手数].手;
            div.変化        = i + 1;
        }
        $.$変化選択.appendChild(div);
    }
};



将棋タイム.グラフ = function ($){
    var Ymax   = 3000;
    var parent = $.args.graph;
    var width  = parent.getBoundingClientRect().width  || 800;
    var height = parent.getBoundingClientRect().height || 200;
    var 座標   = 将棋タイム.グラフ.座標計算($.評価値, width, height, Ymax, $.data.reverse);

    var svg = 将棋タイム.グラフ.svg('svg', {'class':'将棋タイム-グラフ', 'viewBox':'0,0,' + width + ',' + height});
    svg.追加('line', {'class':'将棋タイム-グラフ-X軸', 'x1':0, 'y1':height, 'x2':width, 'y2':height});
    svg.追加('line', {'class':'将棋タイム-グラフ-Y軸', 'x1':0, 'y1':0, 'x2':0, 'y2':height});
    svg.追加('path', {'class':'将棋タイム-グラフ-塗り潰し', 'd':将棋タイム.グラフ.塗り潰し(座標, height)});
    svg.追加('polyline', {'class':'将棋タイム-グラフ-折れ線', 'points':将棋タイム.グラフ.折れ線(座標)});
    svg.追加('line', {'class':'将棋タイム-グラフ-中心線', 'x1':0, 'y1':height/2, 'x2':width, 'y2':height/2});
    svg.追加('line', {'class':'将棋タイム-グラフ-現在線', 'x1':0, 'y1':0, 'x2':0, 'y2':height, 'stroke-opacity':0});

    for(var i = 0; i < 座標.length; i++){
        svg.追加('circle', {'class':'将棋タイム-グラフ-点', 'data-x':i, 'cx':座標[i].x, 'cy':座標[i].y, 'r':3});
    }

    parent.innerHTML = '';
    parent.appendChild(svg);
    parent.insertAdjacentHTML('beforeend', '<div class="将棋タイム-グラフ-ヒント"><div class="将棋タイム-グラフ-ヒント手数"></div><div class="将棋タイム-グラフ-ヒント評価値"></div><div class="将棋タイム-グラフ-ヒント読み筋"></div></div>');
    parent.style.position = 'relative';

    svg.onclick      = 将棋タイム.グラフ.onclick;
    svg.将棋タイム   = $.$将棋タイム;
    svg.座標         = 座標;
    svg.現在線       = parent.querySelector(".将棋タイム-グラフ-現在線");
    svg.ヒント       = parent.querySelector(".将棋タイム-グラフ-ヒント");
    svg.ヒント手数   = parent.querySelector(".将棋タイム-グラフ-ヒント手数");
    svg.ヒント評価値 = parent.querySelector(".将棋タイム-グラフ-ヒント評価値");
    svg.ヒント読み筋 = parent.querySelector(".将棋タイム-グラフ-ヒント読み筋");

    return svg;
};



将棋タイム.グラフ.更新 = function (svg, 手数, 評価値, 読み筋){
    if(!手数){
        svg.現在線.setAttribute("stroke-opacity", 0);
        svg.ヒント.style.display = 'none';
    }
    else{
        svg.現在線.setAttribute("x1", svg.座標[手数].x);
        svg.現在線.setAttribute("x2", svg.座標[手数].x);
        svg.現在線.setAttribute("stroke-opacity", 1);

        svg.ヒント手数.textContent   = 手数 + '手目';
        svg.ヒント評価値.textContent = 評価値;
        svg.ヒント読み筋.textContent = (読み筋 || '').replace(/ .*/, '').replace(/　/, '');
        svg.ヒント.style.display     = 'block';
    }
};



将棋タイム.グラフ.座標計算 = function (評価値, width, height, Ymax, 反転){
    var 座標  = [];
    var X刻み = width / (評価値.length-1);
    var Y半分 = height / 2;

    for(var i = 0; i < 評価値.length; i++){
        var y = 評価値[i];
        if(y > Ymax || y === '+詰'){
            y = Ymax;
        }
        else if(y < -Ymax || y === '-詰'){
            y = -Ymax;
        }
        if(反転){
            y = -y;
        }
        座標.push({'x':i*X刻み, 'y':Y半分-(y/Ymax*Y半分)});
    }
    
    return 座標
};




将棋タイム.グラフ.塗り潰し = function (座標, height){
    var result = "";
    var Y半分  = height / 2;

    for(var i = 0; i < 座標.length; i++){
        result += 'L' + 座標[i].x + ',' + 座標[i].y;
    }
    for(var i = 座標.length - 1; i >= 0; i--){
        result += 'L' + 座標[i].x + ',' + Y半分;
    }
    result  = result.replace('L', 'M');
    result += 'Z';
    return result;
};



将棋タイム.グラフ.折れ線 = function (座標){
    var result = "";

    for(var i = 0; i < 座標.length; i++){
        result += 座標[i].x + ',' + 座標[i].y + ' ';
    }
    return result.trim();
};



将棋タイム.グラフ.svg = function (tagName, attr){
    var el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
    if(attr){
        for(var k in attr){
            el.setAttribute(k, attr[k]);
        }
    }
    if(tagName === 'svg'){
        el.追加 = 将棋タイム.グラフ.svg.bind(el);
    }
    else{
        this.appendChild(el);
    }
    return el;
};



将棋タイム.グラフ.onclick = function (event){
    if(event.target.tagName !== 'circle'){
        return;
    }
    var svg = event.target.ownerSVGElement;
    svg.将棋タイム.$.手数 = Number(event.target.getAttribute("data-x"));
    将棋タイム.描画(svg.将棋タイム.$);
};



将棋タイム.KIF解析 = function(kif){
    var 解析結果 = {};
    var 一次解析 = {局面図:[], 解析:[]};

    kif = kif.split(/\r?\n/);

    for(var i = 0; i < kif.length; i++){
        kif[i] = kif[i].trim();
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
        else if(kif[i].indexOf('**Engines') === 0){
            一次解析.解析済み = true;
        }
        else if(kif[i] === "後手番" || kif[i] === "上手番"){
            一次解析.開始手番 = "後手";
        }
        else if(kif[i] === "先手番" || kif[i] === "下手番"){
            一次解析.開始手番 = "先手";
        }
        else if(kif[i].match(/手数＝\d/)){
            一次解析.最終手 = kif[i];
        }
        else if(kif[i].match(/^[1\*]/)){
            一次解析.指し手 = kif.slice(i);
            break;
        }
    }

    解析結果.先手名   = 一次解析.先手 || 一次解析.下手 || '';
    解析結果.後手名   = 一次解析.後手 || 一次解析.上手 || '';
    解析結果.開始手番 = 将棋タイム.KIF解析.開始手番(一次解析.開始手番, 一次解析.手合割);
    解析結果.最終手   = 将棋タイム.KIF解析.最終手(一次解析.最終手);
    解析結果.手合割   = 将棋タイム.KIF解析.手合割(一次解析.手合割);
    解析結果.評価値   = (一次解析.解析済み)  ?  将棋タイム.KIF解析.評価値(一次解析.指し手)  :  [];
    解析結果.読み筋   = (一次解析.解析済み)  ?  将棋タイム.KIF解析.読み筋(一次解析.指し手)  :  ['-'];
    解析結果.初期局面 = {
        '駒'        : 将棋タイム.KIF解析.局面図(一次解析.局面図, 解析結果.手合割),
        '先手の持駒': 将棋タイム.KIF解析.持駒(一次解析.先手の持駒 || 一次解析.下手の持駒),
        '後手の持駒': 将棋タイム.KIF解析.持駒(一次解析.後手の持駒 || 一次解析.上手の持駒),
    };
    解析結果.全指し手 = 将棋タイム.KIF解析.指し手(一次解析.指し手, 解析結果.開始手番);
    解析結果.総手数   = 解析結果.全指し手[0].length - 1;
    解析結果.変化     = 0;

    return 解析結果;
};



将棋タイム.KIF解析.開始手番 = function (kif開始手番, kif手合割){
    if(kif開始手番){
        return kif開始手番;
    }
    if(kif手合割 && kif手合割 !== "平手"){
        return "後手";
    }
    return "先手";
};



将棋タイム.KIF解析.最終手 = function(最終手){
    if(!最終手){
        return;
    }
    var 解析   = 最終手.match(/([１２３４５６７８９])(.)/);
    var 全数字 = {'１':'1', '２':'2', '３':'3', '４':'4', '５':'5', '６':'6', '７':'7', '８':'8', '９':'9'};
    var 漢数字 = {'一':'1', '二':'2', '三':'3', '四':'4', '五':'5', '六':'6', '七':'7', '八':'8', '九':'9'};

    return 全数字[解析[1]] + 漢数字[解析[2]];
};



将棋タイム.KIF解析.手合割 = function(kif手合割){
    var 手合割 = ["香落ち", "右香落ち", "角落ち", "飛車落ち", "飛香落ち", "二枚落ち", "三枚落ち", "四枚落ち", "五枚落ち", "左五枚落ち", "六枚落ち", "八枚落ち", "十枚落ち", "その他"];
    return (手合割.indexOf(kif手合割) >= 0)  ?  kif手合割  :  null; // "平手"はnullになる
};



将棋タイム.KIF解析.局面図 = function(kif局面図, 手合割){
    if(kif局面図.length !== 9){
        return (手合割)  ?  将棋タイム.KIF解析.局面図.手合割(手合割)  :  将棋タイム.KIF解析.局面図.平手();
    }

    var 局面 = 将棋タイム.KIF解析.局面図.駒無し();
    var 先手 = true;
    var x    = 10;
    var 変換 = {'王':'玉', '竜':'龍'};

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
            駒 = (駒 in 変換) ? 変換[駒] : 駒;

            局面[y+1][x] = (先手) ?  駒 : 駒 + '_';
        }
    }

    return 局面;
};



将棋タイム.KIF解析.局面図.平手 = function(){
    return {
        '1': {'9': '香_', '8': '桂_', '7': '銀_', '6': '金_', '5': '玉_', '4': '金_', '3': '銀_', '2': '桂_', '1': '香_'},
        '2': {'9': null, '8': '飛_', '7': null, '6': null, '5': null, '4': null, '3': null, '2': '角_', '1': null},
        '3': {'9': '歩_', '8': '歩_', '7': '歩_', '6': '歩_', '5': '歩_', '4': '歩_', '3': '歩_', '2': '歩_', '1': '歩_'},
        '4': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '5': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '6': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '7': {'9': '歩', '8': '歩', '7': '歩', '6': '歩', '5': '歩', '4': '歩', '3': '歩', '2': '歩', '1': '歩'},
        '8': {'9': null, '8': '角', '7': null, '6': null, '5': null, '4': null, '3': null, '2': '飛', '1': null},
        '9': {'9': '香', '8': '桂', '7': '銀', '6': '金', '5': '玉', '4': '金', '3': '銀', '2': '桂', '1': '香'},
    };
};



将棋タイム.KIF解析.局面図.駒無し = function() {
    return {
        '1': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '2': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '3': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '4': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '5': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '6': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '7': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '8': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
        '9': {'9': null, '8': null, '7': null, '6': null, '5': null, '4': null, '3': null, '2': null, '1': null},
    };
};



将棋タイム.KIF解析.局面図.手合割 = function(手合割) {
    var 局面 = 将棋タイム.KIF解析.局面図.平手();

    if(手合割 === "香落ち"){
        局面[1][1] = null;
    }
    else if(手合割 === "右香落ち"){
        局面[1][9] = null;
    }
    else if(手合割 === "角落ち"){
        局面[2][2] = null;
    }
    else if(手合割 === "飛車落ち"){
        局面[2][8] = null;
    }
    else if(手合割 === "飛香落ち"){
        局面[1][1] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "二枚落ち"){
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "三枚落ち"){
        局面[1][1] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "四枚落ち"){
        局面[1][1] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "五枚落ち"){
        局面[1][1] = null;
        局面[1][2] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "左五枚落ち"){
        局面[1][1] = null;
        局面[1][8] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "六枚落ち"){
        局面[1][1] = null;
        局面[1][2] = null;
        局面[1][8] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "八枚落ち"){
        局面[1][1] = null;
        局面[1][2] = null;
        局面[1][3] = null;
        局面[1][7] = null;
        局面[1][8] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }
    else if(手合割 === "十枚落ち"){
        局面[1][1] = null;
        局面[1][2] = null;
        局面[1][3] = null;
        局面[1][4] = null;
        局面[1][6] = null;
        局面[1][7] = null;
        局面[1][8] = null;
        局面[1][9] = null;
        局面[2][2] = null;
        局面[2][8] = null;
    }

    return 局面;
};



将棋タイム.KIF解析.持駒 = function(kif持駒){
    var 持駒 = {'歩': 0, '香': 0, '桂': 0, '銀': 0, '金': 0, '飛': 0, '角': 0};

    if(kif持駒 === undefined || kif持駒.match('なし')){
        return 持駒;
    }

    var 漢数字 = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12, '十三':13, '十四':14, '十五':15, '十六':16, '十七':17, '十八':18};
    var str    = kif持駒.split(/\s/);

    for(var i = 0; i < str.length; i++){
        var 駒 = str[i][0];
        var 数 = str[i][1];

        if(駒 in 持駒){
            持駒[駒] = (数) ? 漢数字[数] : 1;
        }
    }

    return 持駒;
};



将棋タイム.KIF解析.指し手 = function (kif, 開始手番){
    var 全指し手 = [[{手数:0, コメント:''}]];
    var 手数     = 0;
    var 変化     = 0;

    全指し手.変化手数 = [];
    if(!kif){
        return 全指し手;
    }

    for(var i = 0; i < kif.length; i++){
        kif[i] = kif[i].trim();

        if(kif[i].indexOf('*') === 0 && 全指し手[変化][手数]){ //指し手コメント
            全指し手[変化][手数].コメント += kif[i].replace(/^\*/, '') + '\n';
        }
        else if(kif[i].match(/^\d/)){
            手数++;
            将棋タイム.KIF解析.指し手.現在の手(全指し手[変化], kif[i], 手数, 開始手番);
        }
        else if(kif[i].indexOf('変化：') === 0){
            手数 = Number(kif[i].match(/変化：(\d+)/)[1]);
            全指し手.push(全指し手[0].slice(0, 手数));
            全指し手.変化手数.push(手数);
            手数--;
            変化++;
        }
    }
    
    return 全指し手;
};



将棋タイム.KIF解析.指し手.現在の手 = function(全指し手, kif, 手数, 開始手番){
    var 全数字   = {'１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9};
    var 漢数字   = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9};
    var 終局表記 = ['中断', '投了', '持将棋', '千日手', '詰み', '切れ負け', '反則勝ち', '反則負け', '入玉勝ち'];

    var 手番     = (開始手番 === '先手' && 手数 % 2 === 1) ? '▲' : '△';
    var 現在の手 = kif.split(/ +/)[1] || '';
    var 解析     = 現在の手.match(/([１-９同])([一二三四五六七八九　])([^\(]+)(\((\d)(\d)\))?/);

    if(解析){
        全指し手.push({
            '手数': 手数,
            '手番': 手番,
            '手'  : 解析[0],
            '駒'  : 解析[3].replace(/[打成]$/, '').replace('成銀', '全').replace('成桂', '圭').replace('成香', '杏').replace('王', '玉').replace('竜', '龍'),
            '前X' : Number(解析[5] || 0),
            '前Y' : Number(解析[6] || 0),
            '後X' : (解析[1] === '同') ? 全指し手[手数-1].後X : 全数字[解析[1]],
            '後Y' : (解析[1] === '同') ? 全指し手[手数-1].後Y : 漢数字[解析[2]],
            '成り': /成$/.test(解析[3]),
            'コメント': '',
        });
    }
    else if(現在の手 === 'パス'){
        全指し手.push({'手数':手数, '手番':手番, '手':'パス', '駒':'', '前X':0, '前Y':0, '後X':0, '後Y':0, '成り':false, 'コメント':''});
    }
    else if(終局表記.indexOf(現在の手) >= 0){
        全指し手.勝敗 = 将棋タイム.KIF解析.指し手.勝敗(現在の手, 手番);
    }
};



将棋タイム.KIF解析.指し手.勝敗 = function (理由, 手番){
    var 結果 = {'勝者':'', '敗者':'', '理由':理由, '表記':''};

    if(理由 === '投了' || 理由 === '詰み' || 理由 === '切れ負け' || 理由 === '反則負け'){
        結果.勝者 = (手番 === '▲') ? '△' : '▲';
        結果.敗者 = (手番 === '▲') ? '▲' : '△';
        結果.表記 = 結果.敗者 + 理由 + 'で' + 結果.勝者 + 'の勝ち';
    }
    else if(理由 === '反則勝ち' || 理由 === '入玉勝ち'){
        結果.勝者 = (手番 === '▲') ? '▲' : '△';
        結果.敗者 = (手番 === '▲') ? '△' : '▲';
        結果.表記 = 結果.勝者 + 理由;
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



将棋タイム.KIF解析.評価値 = function (kif指し手){
    var 評価値 = [];

    for(var i = 0; i < kif指し手.length; i++){
        if(kif指し手[i].indexOf('**解析 0 ') !== 0){
            continue;
        }
        評価値.push(kif指し手[i].match(/評価値 (\S+)/)[1].replace(/↓|↑/, ''));
    }

    return 評価値;
};



将棋タイム.KIF解析.読み筋 = function (kif指し手){
    var 全読み筋 = ['-'];

    for(var i = 0; i < kif指し手.length; i++){
        if(kif指し手[i].indexOf('**解析 0 ') !== 0){
            continue;
        }

        全読み筋.push(String(kif指し手[i].match(/ 読み筋 (.*)/)[1]));
    }

    return 全読み筋;
};



将棋タイム.駒音 = new Audio();



将棋タイム.駒音.再生 = function (){
    将棋タイム.駒音.currentTime = 0;
    将棋タイム.駒音.play();
};



将棋タイム.$局面_onclick = function (event){
    var rect = this.$局面.getBoundingClientRect();
    (event.clientX-rect.left < rect.width/2) ? this.$前に移動ボタン.onclick() : this.$次に移動ボタン.onclick();
};



将棋タイム.$最初に移動ボタン_onclick = function (event){
    this.手数 = 0;
    if(this.変化){
        this.変化 = 0;
        将棋タイム.描画.指し手選択(this);
    }
    将棋タイム.描画(this);
};



将棋タイム.$前に移動ボタン_onclick = function (event){
    if(this.$指し手選択.selectedIndex > this.総手数){
        this.$指し手選択.selectedIndex = this.$指し手選択.length - 2;
    }
    else if(this.手数 > 0){
        this.手数--;
        将棋タイム.描画(this);
    }
};



将棋タイム.$次に移動ボタン_onclick = function(event){
    var 総手数 = this.全指し手[this.変化].length - 1;

    if(this.手数 < 総手数){
        this.手数++;
        将棋タイム.描画(this);
        将棋タイム.駒音.再生();
    }
    else{
        this.$指し手選択.selectedIndex = this.$指し手選択.length - 1;
    }
};



将棋タイム.$最後に移動ボタン_onclick = function(event){
    this.手数 = this.全指し手[this.変化].length - 1;
    将棋タイム.描画(this);
    this.$指し手選択.selectedIndex = this.$指し手選択.length - 1;
};



将棋タイム.$指し手選択_onchange = function (event){
    if(this.$指し手選択.selectedIndex > this.総手数){
        this.$最後に移動ボタン.onclick();
    }
    else{
        this.手数 = this.$指し手選択.selectedIndex;
        将棋タイム.描画(this);
    }
};



将棋タイム.$ダイアログボタン_onclick = function(event){
    this.$将棋タイム.hasAttribute('data-dialog') ? this.$将棋タイム.removeAttribute('data-dialog') : this.$将棋タイム.setAttribute('data-dialog', '');
};



将棋タイム.$反転ボタン_onclick = function(event){
    this.data.reverse = !this.data.reverse;
    if(this.グラフ){
        this.グラフ = 将棋タイム.グラフ(this);
    }
    将棋タイム.描画(this);

};



将棋タイム.$ダイアログ_閉じるボタン_onclick = function(event){
    this.$将棋タイム.removeAttribute('data-dialog');
};



将棋タイム.$ダイアログ_棋譜コピーボタン_onclick = function(event){
    var el = this.$ダイアログ_棋譜テキスト;

    //参考 https://mamewaza.com/support/blog/javascript-copy.html
    el.style.display = 'inline-block';
    el.select();

    var range  = document.createRange();
    range.selectNodeContents(el);
    var select = window.getSelection();
    select.removeAllRanges();
    select.addRange(range);
    el.setSelectionRange(0, 999999);

    document.execCommand("copy");
    el.style.display = 'none';
};



将棋タイム.$変化選択_onclick = function(event){
    event.stopPropagation();
    if(!('変化' in event.target)){
        return;
    }
    this.変化 = event.target.変化;
    this.変化手数 = this.手数;
    this.手数--;

    将棋タイム.描画.指し手選択(this);

    this.$次に移動ボタン.onclick();
};



将棋タイム.SilverState = function(app, html, css, $){
    $ = $ || {};

    //HTMLからDOM作成
    var div        = document.createElement('div');
    div.innerHTML  = html;
    var root       = div.firstElementChild;
    var appName    = root.classList[0];
    $['$'+appName] = root;

    //CSS登録
    if(css){
        var cssClass = appName + "-css";
        $.$css = document.querySelector("." + cssClass);
        if(!$.$css){
            $.$css           = document.createElement('style');
            $.$css.innerHTML = css;
            $.$css.className = cssClass;
            document.head.insertBefore($.$css, document.head.firstElementChild);
        }
    }

    //DOM選択
    var elements = $['$'+appName].querySelectorAll("*");
    for(var i = 0; i < elements.length; i++){
        var className = elements[i].classList[0] || '';
        var names     = className.split('-');
        var firstName = names.shift();
        var idName    = '$' + names.join('_');

        if(firstName !== appName){
            continue;
        }
        if($.hasOwnProperty(idName)){
            throw '識別名が重複しています: ' + className;
        }

        $[idName] = elements[i];
    }

    //プロパティ登録
    for(var name in app){
        if(name.indexOf('$') !== 0){
            continue;
        }
        
        var pos = name.lastIndexOf('_');
        if(pos === -1){
            $[name] = (typeof app[name] === 'function') ? app[name].bind($) : app[name];
        }
        else{
            var $id  = name.substring(0, pos);
            var prop = name.substring(pos+1);

            if(!($id in $)){
                $[$id] = {};
            }
            $[$id][prop] = (typeof app[name] === 'function')  ?  app[name].bind($)  :  app[name];
        }
    }

    $['$'+appName].$ = $;
    return $;
};



将棋タイム.オブジェクトコピー = function(from){
    var to = Array.isArray(from) ? [] : {};
    for(var key in from){
        to[key] = (from[key] instanceof Object)  ?  将棋タイム.オブジェクトコピー(from[key])  :  from[key];
    }
    return to;
};



将棋タイム.イベント発行 = function (name, el, detail){
    detail = detail || {};
    try {
        var event = new CustomEvent(name, {bubbles:true, detail: detail});
    }
    catch(e){
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(name, true, false, detail);
    }
    el.dispatchEvent(event);
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
    <div class="将棋タイム-次に移動ボタン"><div class="将棋タイム-変化選択"></div></div>
    <div class="将棋タイム-最後に移動ボタン"></div>
    <select class="将棋タイム-指し手選択"></select>
    <div class="将棋タイム-ダイアログボタン"></div>
    <div class="将棋タイム-反転ボタン"></div>
  </div>
  <div class="将棋タイム-ダイアログ">
    <div class="将棋タイム-ダイアログ-ヘッダ">
      <div class="将棋タイム-ダイアログ-タイトル">将棋タイム</div>
      <div class="将棋タイム-ダイアログ-閉じるボタン"></div>
    </div>
    <div class="将棋タイム-ダイアログ-コンテンツ">
      <div class="将棋タイム-ダイアログ-棋譜コピーボタン">棋譜をコピーする</div>
      <textarea class="将棋タイム-ダイアログ-棋譜テキスト" readonly></textarea>
      <div class="将棋タイム-ダイアログ-フッタ"><a href="https://spelunker2.wordpress.com/2018/09/20/shogitime/" target="_blank">将棋タイム Ver0.3</a></div>
    </div>
  </div>
</div>
*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();




将棋タイム.CSS = (function() {/*
.将棋タイム{
    -ms-user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    width: 514px;
    margin: 50px auto;
    position: relative;
    font-family: "Noto Sans CJK JP", meiryo, sans-serif;
}
.将棋タイム *{
    box-sizing: border-box;
}
.将棋タイム-先手名{
    width: 100%;
    text-align: right;
    font-size: 14px;
}
.将棋タイム-後手名{
    width: 100%;
    font-size: 14px;
}
.将棋タイム-先手名:empty,
.将棋タイム-後手名:empty{
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
    -webkit-tap-highlight-color: transparent;
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


.将棋タイム [data-x='0']{
    display: none;
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
.将棋タイム [data-y='0']{
    display: none;
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
    align-items: flex-start;
    margin: 0 3px;
    cursor: pointer;
    background-color: #fff;
    background-position: center center;
    background-size: 14px 14px;
    background-repeat: no-repeat;
}
.将棋タイム-最初に移動ボタン{
    background-image: url('最初に移動ボタン.svg');
}
.将棋タイム-前に移動ボタン{
    background-image: url('前に移動ボタン.svg');
}
.将棋タイム-次に移動ボタン{
    background-image: url('次に移動ボタン.svg');
}
.将棋タイム-最後に移動ボタン{
    background-image: url('最後に移動ボタン.svg');
}
.将棋タイム-指し手選択{
    margin: 0 8px;
}
.将棋タイム-ダイアログボタン{
    background-image: url('ダイアログボタン.svg');
}
.将棋タイム-反転ボタン{
    background-image: url('反転ボタン.svg');
}

.将棋タイム-ダイアログ{
    display: none;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(255, 255, 255, 1);
    z-index: 10;
    border: solid 1px #15B358;
    border-radius: 6px;
}
.将棋タイム-ダイアログ-ヘッダ{
    border: solid 1px #15B358;
    border-radius: 6px 6px 0 0;
    background-color: #2ecc71;
    padding: 5px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.将棋タイム-ダイアログ-タイトル{
    color: #fff;
    font-size: 16px;
}
.将棋タイム-ダイアログ-閉じるボタン{
    width: 20px;
    height: 20px;
    background-repeat: no-repeat;
    background-image: url('ダイアログ-閉じるボタン.svg');
    background-size: 20px;
    cursor: pointer;
}

.将棋タイム-ダイアログ-コンテンツ{
    text-align: center;
}
.将棋タイム-ダイアログ-棋譜コピーボタン{ 
    border-radius: 5px;
    padding: 15px 25px;
    font-size: 18px;
    text-decoration: none;
    margin: 20px;
    color: #fff;
    display: inline-block;
    background-color: #55acee;
    box-shadow: 0px 5px 0px 0px #3C93D5;
    cursor: pointer;
}
.将棋タイム-ダイアログ-棋譜コピーボタン:active {
    transform: translate(0px, 5px);
    box-shadow: 0px 1px 0px 0px;
}
.将棋タイム-ダイアログ-棋譜テキスト{
    position: fixed;
    right: 100vw;
    font-size: 16px;
    display: none;
    width: 1px;
    height: 1px;
}
.将棋タイム-ダイアログ-フッタ{
    text-align: right;
    font-size: 12px;
    padding: 2px 4px;
}

.将棋タイム[data-dialog] .将棋タイム-ダイアログ{
    display: block;
}

.将棋タイム-変化選択:empty{
    display: none;
}
.将棋タイム-変化選択{
    position: relative;
    color: #fff;
    font-size: 16px;
    background: rgba(0, 0, 0, 0.8);
    list-style-type: none;
    z-index: 5;
    width: 150px;
    margin-left: calc((100vw - 100%) / -2);
    margin-right: calc((100vw - 100%) / -2);
    margin-top: calc(100% + 15px);
    margin-bottom: 0;
    padding: 0;
}
.将棋タイム-変化選択 > div{
    margin: 6px 6px 6px 16px;
    padding: 0;
}
.将棋タイム-変化選択 >div:hover{
    color: yellow;
    cursor: pointer;
}
.将棋タイム-変化選択::after {
    content: "";
    position: absolute;
    top: -20px;
    left: 50%;
    margin-left: -10px;
    border: 10px solid transparent;
    border-bottom: 10px solid rgba(0, 0, 0, 0.8);
}
.将棋タイム-グラフ{
    -webkit-tap-highlight-color: transparent;
    -ms-user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    z-index: 2;
}
.将棋タイム-グラフ-X軸{
    stroke: #999;
    stroke-width: 2px;
}
.将棋タイム-グラフ-Y軸{
    stroke: #999;
    stroke-width: 2px;
}
.将棋タイム-グラフ-中心線{
    stroke: #ccc;
    stroke-width: 1px;
}
.将棋タイム-グラフ-現在線{
    stroke: #ccc;
    stroke-width: 1px;
}
.将棋タイム-グラフ-折れ線{
    stroke-width: 1px;
    fill: none;
    stroke: #3986bc;
}
.将棋タイム-グラフ-塗り潰し{
    fill: #d2e4f0;
}
.将棋タイム-グラフ-点{
    fill: #1f77b4;
    stroke: #1f77b4;
    stroke-opacity: 0;
    stroke-width: 6px;
}
.将棋タイム-グラフ-点:hover{
    cursor: pointer;
    stroke-opacity: 1;
}
.将棋タイム-グラフ-ヒント{
    background-color: #fff;
    opacity: 0.9;
    font-size: 14px;
    font-family: "Noto Sans CJK JP", meiryo, sans-serif;
    display: none;
    position: absolute;
    top: -1px;
    left 0;
    width: 130px;
    border: solid 1px #aaa;
    z-index: 1;
    text-align: center;
}
.将棋タイム-グラフ-ヒント手数{
    border-bottom: solid 1px #aaa;
    background-color: #eee;
    padding: 2px 0;
    font-weight: bold;
}
*/}).toString().match(/\/\*([^]*)\*\//)[1].trim();



document.readyState === 'loading'  ?  document.addEventListener('DOMContentLoaded', 将棋タイム.スタートアップ)  :  将棋タイム.スタートアップ();

