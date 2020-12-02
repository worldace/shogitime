

class 将棋タイム extends HTMLElement{

    static get observedAttributes(){
        return ['kif', 'src', 'start', 'reverse', 'myname', 'controller', 'comment', 'graph', 'graphwidth', 'graphheight']
    }



    attributeChangedCallback(name, oldValue, newValue){
        this[name] = newValue
    }



    async connectedCallback(){
        this.baseurl = import.meta.url.replace(/[^\/]*$/, '')

        benry(this)

        if(this.src){
            this.kif = await 棋譜.ダウンロード(this.src)
        }

        Object.assign(this, 棋譜.解析(this.kif))

        this.全局面 = 棋譜.全局面作成(this.全指し手, this.初期局面)
        this.手数   = this.手数確認(this.start, this.総手数)
        this.駒音   = new Audio(`${this.baseurl}駒音.mp3`)

        if(this.後手名.includes(this.myname)){
            this.reverse = true
        }
        if(this.comment){
            this.$コメント = document.getElementById(this.comment)
        }
        if(this.graph){
            this.$グラフ = document.createElement('shogi-time-graph')
            this.$グラフ.$本体 = this
            document.getElementById(this.graph).append(this.$グラフ)
        }

        this.描画(true)
    }



    disconnectedCallback(){
        if(this.$グラフ){
            this.$グラフ.remove()
        }
    }



    描画(初回){
        const 手数   = this.手数
        const 局面   = this.全局面[this.変化][手数]
        const 指し手 = this.全指し手[this.変化][手数]
        const 反転   = this.reverse
        const 先手   = (反転) ? '後手' : '先手'
        const 後手   = (反転) ? '先手' : '後手'
 
        //初回描画
        if(初回){
            if(this.controller === 'none'){
                this.$コントローラー.style.display = 'none'
            }
            this.描画_指し手選択()
        }

        //初期化
        this.$将棋盤.innerHTML = ''

        //マスハイライト
        if(this.最終手){
            this.$将棋盤.append(this.描画_ハイライト(this.最終手[0], this.最終手[1], 反転))
        }
        else if(手数 !== 0){
            this.$将棋盤.append(this.描画_ハイライト(指し手.後X, 指し手.後Y, 反転))
        }

        //将棋盤の駒
        for(let y in 局面.駒){
            for(let x in 局面.駒[y]){
                if(局面.駒[y][x]){
                    this.$将棋盤.append(this.描画_駒(局面.駒[y][x], x, y, 反転))
                }
            }
        }

        //持駒
        for(let 駒 in 局面.先手の持駒){
            this[`$${先手}駒台_${駒}`].dataset.num = 局面.先手の持駒[駒]
        }
        for(let 駒 in 局面.後手の持駒){
            this[`$${後手}駒台_${駒}`].dataset.num = 局面.後手の持駒[駒]
        }

        //指し手
        this.$指し手選択.selectedIndex = 手数
        
        //名前
        if(this.先手名){
            this[`$${先手}名`].textContent = '▲' + this.先手名
        }
        if(this.後手名){
            this[`$${後手}名`].textContent = '△' + this.後手名
        }

        //コメント
        if(this.$コメント){
            this.$コメント.textContent = 指し手.コメント
        }

        //グラフ
        if(this.$グラフ){
            this.$グラフ.更新(手数, this.評価値[手数], this.読み筋[手数])
        }

        //変化選択
        this.$変化選択.innerHTML = ''
        if(!this.変化 && this.全指し手.変化手数.includes(手数)){
            this.描画_変化選択()
        }
        else if(this.変化 && this.変化手数 === 手数){
            this.描画_変化中選択()
        }
    }



    描画_指し手選択(){
        const 全指し手 = this.全指し手[this.変化]

        this.$指し手選択.innerHTML = ''
        this.$指し手選択.add(new Option('開始局面'))

        for(const v of 全指し手.slice(1)){
            this.$指し手選択.add(new Option(`${v.手数} ${v.手番}${v.手}`))
        }

        if(全指し手.勝敗 && !this.変化){
            this.$指し手選択.add(new Option(全指し手.勝敗.表記))
        }
    }



    描画_駒(駒, x, y, 反転){
        if(反転){
            x = 10 - x
            y = 10 - y
            駒 = 駒.includes('_') ? 駒.replace('_', '') : `${駒}_`
        }

        const div = document.createElement('div')
        div.className = '駒'
        div.dataset.koma = 駒
        div.dataset.x = x
        div.dataset.y = y

        return div
    }



    描画_ハイライト(x, y, 反転){
        if(!x || x > 9){
            x = y = 0
        }
        if(反転){
            x = 10 - x
            y = 10 - y
        }

        const div = document.createElement('div')
        div.id = '最終手'
        div.dataset.x = x
        div.dataset.y = y
        return div
    }



    描画_変化選択(){
        for(const [i, v] of this.全指し手.変化手数.entries()){
            if(v !== this.手数){
                continue
            }

            const div = document.createElement('div')
            div.textContent = this.全指し手[i+1][this.手数].手番 + this.全指し手[i+1][this.手数].手
            div.変化        = i + 1
            this.$変化選択.append(div)
        }
    }



    描画_変化中選択(){
        for(const [i, v] of this.全指し手.変化手数.entries()){
            if(v !== this.変化手数){
                continue
            }

            const div = document.createElement('div')
            if(this.変化 === i + 1){
                div.textContent = '本線に戻る'
                div.変化        = 0
            }
            else{
                div.textContent = this.全指し手[i+1][this.手数].手番 + this.全指し手[i+1][this.手数].手
                div.変化        = i + 1
            }
            this.$変化選択.append(div)
        }
    }



    駒音再生(){
        this.駒音.currentTime = 0
        this.駒音.play()
    }



    go(手数){
        this.手数 = this.手数確認(手数, this.総手数)
        this.描画()
    }



    手数確認(手数, 総手数){
        if(!手数 || !総手数){
            return 0
        }
        if(手数 < 0){
            手数 = 総手数 + 手数 + 1
        }
        if(手数 > 総手数){
            return Number(総手数)
        }
        return Number(手数)
    }



    $局面_click(event){
        const {left, width} = this.$局面.getBoundingClientRect();
        (event.clientX < left+width/2) ? this.$前に移動ボタン.click() : this.$次に移動ボタン.click()
    }



    $最初に移動ボタン_click(event){
        if(this.変化){
            this.変化 = 0
            this.描画_指し手選択()
        }
        this.go(0)
    }



    $前に移動ボタン_click(event){
        if(this.$指し手選択.selectedIndex > this.総手数){
            this.$指し手選択.selectedIndex = this.$指し手選択.length - 2
        }
        else if(this.手数 > 0){
            this.go(this.手数-1)
        }
    }



    $次に移動ボタン_click(event){
        const 総手数 = this.全指し手[this.変化].length - 1

        if(this.手数 < 総手数){
            this.go(this.手数+1)
            this.駒音再生()
        }
        else{
            this.$指し手選択.selectedIndex = this.$指し手選択.length - 1
        }
    }



    $最後に移動ボタン_click(event){
        this.go(this.全指し手[this.変化].length - 1)
        this.$指し手選択.selectedIndex = this.$指し手選択.length - 1
    }



    $指し手選択_change(event){
        if(this.$指し手選択.selectedIndex > this.総手数){
            this.$最後に移動ボタン.click()
        }
        else{
            this.go(this.$指し手選択.selectedIndex)
        }
    }



    $反転ボタン_click(event){
        this.reverse = !this.reverse
        if(this.$グラフ){
            this.$グラフ.描画()
        }
        this.描画()
    }



    $ダイアログボタン_click(event){
        this.toggleAttribute('data-dialog')
    }



    $ダイアログ_閉じるボタン_click(event){
        this.removeAttribute('data-dialog')
    }



    $ダイアログ_棋譜コピーボタン_click(event){
        navigator.clipboard.writeText(this.kif)
    }



    $変化選択_click(event){
        event.stopPropagation()
        if(!('変化' in event.target)){
            return
        }
        this.変化 = event.target.変化
        this.変化手数 = this.手数
        this.手数--

        this.描画_指し手選択()
        this.$次に移動ボタン.click()
    }



    get html(){
        return `
        <div id="将棋タイム">
          <div id="後手名"></div>
          <div id="局面">
            <div id="後手駒台">
              <div id="後手駒台_歩" data-num="0" data-koma="歩_"></div>
              <div id="後手駒台_香" data-num="0" data-koma="香_"></div>
              <div id="後手駒台_桂" data-num="0" data-koma="桂_"></div>
              <div id="後手駒台_銀" data-num="0" data-koma="銀_"></div>
              <div id="後手駒台_金" data-num="0" data-koma="金_"></div>
              <div id="後手駒台_角" data-num="0" data-koma="角_"></div>
              <div id="後手駒台_飛" data-num="0" data-koma="飛_"></div>
            </div>
            <div id="将棋盤"></div>
            <div id="先手駒台">
              <div id="先手駒台_飛" data-num="0" data-koma="飛"></div>
              <div id="先手駒台_角" data-num="0" data-koma="角"></div>
              <div id="先手駒台_金" data-num="0" data-koma="金"></div>
              <div id="先手駒台_銀" data-num="0" data-koma="銀"></div>
              <div id="先手駒台_桂" data-num="0" data-koma="桂"></div>
              <div id="先手駒台_香" data-num="0" data-koma="香"></div>
              <div id="先手駒台_歩" data-num="0" data-koma="歩"></div>
            </div>
          </div>
          <div id="先手名"></div>
          <div id="コントローラー">
            <div id="最初に移動ボタン"></div>
            <div id="前に移動ボタン"></div>
            <div id="次に移動ボタン"><div id="変化選択"></div></div>
            <div id="最後に移動ボタン"></div>
            <select id="指し手選択"></select>
            <div id="ダイアログボタン"></div>
            <div id="反転ボタン"></div>
          </div>
          <div id="ダイアログ">
            <div id="ダイアログ_ヘッダ">
              <div id="ダイアログ_タイトル">将棋タイム</div>
              <div id="ダイアログ_閉じるボタン"></div>
            </div>
            <div id="ダイアログ_コンテンツ">
              <div id="ダイアログ_棋譜コピーボタン">棋譜をコピーする</div>
              <textarea id="ダイアログ_棋譜テキスト" readonly></textarea>
              <div id="ダイアログ_フッタ"><a href="https://spelunker2.wordpress.com/2018/09/20/shogitime/" target="_blank">将棋タイム Ver1.2</a></div>
            </div>
          </div>
        </div>`
    }



    get css(){
        return `
        #将棋タイム{
            user-select: none;
            touch-action: manipulation;
            width: 514px;
            margin: 50px auto;
            position: relative;
            font-family: "Noto Sans CJK JP", meiryo, sans-serif;
        }
        #将棋タイム *{
            box-sizing: border-box;
        }
        #先手名{
            width: 100%;
            text-align: right;
            font-size: 14px;
        }
        #後手名{
            width: 100%;
            font-size: 14px;
        }
        #先手名:empty,
        #後手名:empty{
            display: none;
        }

        #局面{
            display: flex;
        }

        #先手駒台{
            width: 49px;
            height: 340px;
            background-image: url('盤.png');
            align-self: flex-end;
            padding: 2px 0;
            display: flex;
            flex-direction: column;
        }
        #後手駒台{
            width: 49px;
            height: 340px;
            background-image: url('盤.png');
            padding: 2px 0;
            display: flex;
            flex-direction: column;
        }

        #先手駒台 > div,
        #後手駒台 > div{
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
        #先手駒台 > div::after,
        #後手駒台 > div::after{
            content: attr(data-num);
        }

        #先手駒台 > div[data-num='0'],
        #後手駒台 > div[data-num='0']{
            display: none;
        }

        #将棋盤{
            width: 410px;
            height: 454px;
            background-image: url('マス.png'), url('盤.png');
            position: relative;
            margin: 0 3px;
            -webkit-tap-highlight-color: transparent;
        }
        :host([data-reverse]) #将棋盤{
            background-image: url('マス_.png'), url('盤.png');
        }

        .駒{
            width: 43px;
            height: 48px;
            background-repeat: no-repeat;
            position: absolute;
            z-index: 2;
        }
        .青, #最終手{
            width: 43px;
            height: 48px;
            background-image: url('青.png');
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }
        .緑{
            width: 43px;
            height: 48px;
            background-image: url('緑.png');
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }
        .赤{
            width: 43px;
            height: 48px;
            background-image: url('赤.png');
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }

        [data-koma='歩']{
            background-image: url('歩.png');
        }
        [data-koma='歩_']{
            background-image: url('歩_.png');
        }

        [data-koma='と']{
            background-image: url('と.png');
        }
        [data-koma='と_']{
            background-image: url('と_.png');
        }

        [data-koma='香']{
            background-image: url('香.png');
        }
        [data-koma='香_']{
            background-image: url('香_.png');
        }

        [data-koma='杏']{
            background-image: url('杏.png');
        }
        [data-koma='杏_']{
            background-image: url('杏_.png');
        }

        [data-koma='桂']{
            background-image: url('桂.png');
        }
        [data-koma='桂_']{
            background-image: url('桂_.png');
        }

        [data-koma='圭']{
            background-image: url('圭.png');
        }
        [data-koma='圭_']{
            background-image: url('圭_.png');
        }

        [data-koma='銀']{
            background-image: url('銀.png');
        }
        [data-koma='銀_']{
            background-image: url('銀_.png');
        }

        [data-koma='全']{
            background-image: url('全.png');
        }
        [data-koma='全_']{
            background-image: url('全_.png');
        }

        [data-koma='金']{
            background-image: url('金.png');
        }
        [data-koma='金_']{
            background-image: url('金_.png');
        }

        [data-koma='角']{
            background-image: url('角.png');
        }
        [data-koma='角_']{
            background-image: url('角_.png');
        }

        [data-koma='馬']{
            background-image: url('馬.png');
        }
        [data-koma='馬_']{
            background-image: url('馬_.png');
        }

        [data-koma='飛']{
            background-image: url('飛.png');
        }
        [data-koma='飛_']{
            background-image: url('飛_.png');
        }

        [data-koma='龍']{
            background-image: url('龍.png');
        }
        [data-koma='龍_']{
            background-image: url('龍_.png');
        }

        [data-koma='玉']{
            background-image: url('玉.png');
        }
        [data-koma='玉_']{
            background-image: url('玉_.png');
        }

        [data-x='0']{
            display: none;
        }
        [data-x='1']{
            left: 355px;
        }
        [data-x='2']{
            left: 312px;
        }
        [data-x='3']{
            left: 269px;
        }
        [data-x='4']{
            left: 226px;
        }
        [data-x='5']{
            left: 183px;
        }
        [data-x='6']{
            left: 140px;
        }
        [data-x='7']{
            left: 97px;
        }
        [data-x='8']{
            left: 54px;
        }
        [data-x='9']{
            left: 11px;
        }
        [data-y='0']{
            display: none;
        }
        [data-y='1']{
            top: 11px;
        }
        [data-y='2']{
            top: 59px;
        }
        [data-y='3']{
            top: 107px;
        }
        [data-y='4']{
            top: 155px;
        }
        [data-y='5']{
            top: 203px;
        }
        [data-y='6']{
            top: 251px;
        }
        [data-y='7']{
            top: 299px;
        }
        [data-y='8']{
            top: 347px;
        }
        [data-y='9']{
            top: 395px;
        }

        #コントローラー{
            width: 100%;
            display: flex;
            justify-content:center;
            margin-top: 3px;
        }
        #コントローラー > div{
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
        #最初に移動ボタン{
            background-image: url('最初に移動ボタン.svg');
        }
        #前に移動ボタン{
            background-image: url('前に移動ボタン.svg');
        }
        #次に移動ボタン{
            background-image: url('次に移動ボタン.svg');
        }
        #最後に移動ボタン{
            background-image: url('最後に移動ボタン.svg');
        }
        #指し手選択{
            margin: 0 8px;
        }
        #ダイアログボタン{
            background-image: url('ダイアログボタン.svg');
        }
        #反転ボタン{
            background-image: url('反転ボタン.svg');
        }

        #ダイアログ{
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
        :host([data-dialog]) #ダイアログ{
            display: block;
        }
        #ダイアログ_ヘッダ{
            border: solid 1px #15B358;
            border-radius: 6px 6px 0 0;
            background-color: #2ecc71;
            padding: 5px 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #ダイアログ_タイトル{
            color: #fff;
            font-size: 16px;
        }
        #ダイアログ_閉じるボタン{
            width: 20px;
            height: 20px;
            background-repeat: no-repeat;
            background-image: url('ダイアログ_閉じるボタン.svg');
            background-size: 20px;
            cursor: pointer;
        }

        #ダイアログ_コンテンツ{
            text-align: center;
        }
        #ダイアログ_棋譜コピーボタン{ 
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
        #ダイアログ_棋譜コピーボタン:active {
            transform: translate(0px, 5px);
            box-shadow: 0px 1px 0px 0px;
        }
        #ダイアログ_棋譜テキスト{
            position: fixed;
            right: 100vw;
            font-size: 16px;
            display: none;
            width: 1px;
            height: 1px;
        }
        #ダイアログ_フッタ{
            text-align: right;
            font-size: 12px;
            padding: 2px 4px;
        }

        #変化選択:empty{
            display: none;
        }
        #変化選択{
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
        #変化選択 > div{
            margin: 6px 6px 6px 16px;
            padding: 0;
        }
        #変化選択 >div:hover{
            color: yellow;
            cursor: pointer;
        }
        #変化選択::after {
            content: "";
            position: absolute;
            top: -20px;
            left: 50%;
            margin-left: -10px;
            border: 10px solid transparent;
            border-bottom: 10px solid rgba(0, 0, 0, 0.8);
        }`.replace(/url\(\'/g, `$&${this.baseurl}`)
    }
}






class グラフ extends HTMLElement{

    connectedCallback(){
        benry(this)
        this.描画()
    }



    描画(){
        const Ymax   = 3000
        const width  = this.$本体.graphwidth  || 800
        const height = this.$本体.graphheight || 200

        this.座標 = this.座標計算(this.$本体.評価値, width, height, Ymax, this.$本体.reverse)

        this.$グラフ.style.width  = `${width}px`
        this.$グラフ.style.height = `${height}px`
        this.$svg.setAttribute('viewBox', `0,0,${width},${height}`)
        this.$X軸.setAttribute('x2', width)
        this.$X軸.setAttribute('y1', height)
        this.$X軸.setAttribute('y2', height)
        this.$Y軸.setAttribute('y2', height)
        this.$中心線.setAttribute('x2', width)
        this.$中心線.setAttribute('y1', height/2)
        this.$中心線.setAttribute('y2', height/2)
        this.$現在線.setAttribute('y2', height)
        this.$折れ線.setAttribute('points', this.折れ線計算(this.座標))
        this.$塗り潰し.setAttribute('d', this.塗り潰し計算(this.座標, height))

        this.$g.innerHTML = this.座標.map((v, i) => `<circle cx="${v.x}" cy="${v.y}" data-i="${i}"></circle>`).join()
    }



    更新(手数 = 0, 評価値 = '', 読み筋 = ''){
        this.$現在線.setAttribute('x1', this.座標[手数].x)
        this.$現在線.setAttribute('x2', this.座標[手数].x)
        this.$手数.textContent     = `${手数}手目`
        this.$評価値.textContent   = 評価値
        this.$読み筋.textContent   = 読み筋.replace(/ .*/, '').replace(/　/, '')
        this.$ヒント.style.display = 手数 ? 'block' : 'none'
    }



    $グラフ_click(event){
        if(event.target.tagName === 'circle'){
            this.$本体.go(event.target.dataset.i)
        }
    }



    座標計算(評価値, width, height, Ymax, 反転){
        const 座標  = []
        const step  = width / (評価値.length-1)

        for(let [i, y] of 評価値.entries()){
            if(y > Ymax || y === '+詰'){
                y = Ymax
            }
            else if(y < -Ymax || y === '-詰'){
                y = -Ymax
            }
            if(反転){
                y = -y
            }

            座標.push({'x':i*step, 'y':height/2*(1-y/Ymax)})
        }

        return 座標
    }



    折れ線計算(座標){
        return 座標.map(v => `${v.x},${v.y}`).join(' ')
    }



    塗り潰し計算(座標, height){
        let result = ''

        for(const v of 座標){
            result += `L${v.x},${v.y}`
        }
        for(const v of 座標.concat().reverse()){
            result += `L${v.x},${height/2}`
        }
        return result.replace('L', 'M') + 'Z'
    }



    get html(){
        return `
        <div id="グラフ">
          <svg id="svg" viewBox="0,0,0,0">
            <line id="X軸"    x1="0" x2="0" y1="0" y2="0"></line>
            <line id="Y軸"    x1="0" x2="0" y1="0" y2="0"></line>
            <path id="塗り潰し" d=""></path>
            <polyline id="折れ線" points=""></polyline>
            <line id="中心線" x1="0" x2="0" y1="0" y2="0"></line>
            <line id="現在線" x1="0" x2="0" y1="0" y2="0"></line>
            <g id="g"></g>
          </svg>
          <div id="ヒント">
            <div id="手数"></div>
            <div id="評価値"></div>
            <div id="読み筋"></div>
          </div>
        </div>`
    }



    get css(){
        return `
        #グラフ{
            position: relative;
            margin: 0 auto;
        }
        #svg{
            -webkit-tap-highlight-color: transparent;
            user-select: none;
            touch-action: manipulation;
            z-index: 2;
        }
        #X軸{
            stroke: #999;
            stroke-width: 2px;
        }
        #Y軸{
            stroke: #999;
            stroke-width: 2px;
        }
        #中心線{
            stroke: #ccc;
            stroke-width: 1px;
        }
        #現在線{
            stroke: #ccc;
            stroke-width: 1px;
        }
        #折れ線{
            stroke-width: 1px;
            fill: none;
            stroke: #3986bc;
        }
        #塗り潰し{
            fill: #d2e4f0;
        }
        circle{
            fill: #1f77b4;
            r: 3px;
            stroke: #1f77b4;
            stroke-opacity: 0;
            stroke-width: 6px;
        }
        circle:hover{
            cursor: pointer;
            stroke-opacity: 1;
        }
        #ヒント{
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
        #手数{
            border-bottom: solid 1px #aaa;
            background-color: #eee;
            padding: 2px 0;
            font-weight: bold;
        }`
    }
}






class 棋譜{

    static 解析(text = ''){
        const r = this.一次解析(text)

        const 先手名   = r.先手 || r.下手 || ''
        const 後手名   = r.後手 || r.上手 || ''
        const 開始手番 = this.開始手番(r.開始手番, r.手合割)
        const 最終手   = this.最終手(r.最終手)
        const 手合割   = r.手合割
        const 評価値   = (r.解析済み) ? this.評価値(r.全指し手) : []
        const 読み筋   = (r.解析済み) ? this.読み筋(r.全指し手) : ['-']
        const 初期局面 = {
            '駒'        : this.局面図(r.局面図, 手合割),
            '先手の持駒': this.持駒(r.先手の持駒 || r.下手の持駒),
            '後手の持駒': this.持駒(r.後手の持駒 || r.上手の持駒),
        }
        const 全指し手 = this.全指し手(r.全指し手, 開始手番)
        const 総手数   = 全指し手[0].length - 1
        const 変化     = 0

        return {先手名, 後手名, 開始手番, 最終手, 手合割, 評価値, 読み筋, 初期局面, 全指し手, 総手数, 変化}
    }



    static 一次解析(text){
        const result = {局面図:[]}
        const kif    = text.trim().split(/\r?\n/)

        for(let [i, v] of kif.entries()){
            v = v.trim()

            if(v.startsWith('#')){
                continue
            }
            else if(v.startsWith('**Engines')){
                result.解析済み = true
            }
            else if(v.startsWith('|')){
                result.局面図.push(v)
            }
            else if(v.startsWith('手数＝')){
                result.最終手 = v
            }
            else if(v.includes('：')){
                const [name, value] = v.split('：')
                result[name] = value
            }
            else if(v === '先手番' || v === '下手番'){
                result.開始手番 = '先手'
            }
            else if(v === '後手番' || v === '上手番'){
                result.開始手番 = '後手'
            }
            else if(v.match(/^[1\*]/)){
                result.全指し手 = kif.slice(i)
                break
            }
        }
        return result
    }



    static async ダウンロード(url){
        const response = await fetch(url)
        if(url.match(/kifu$/i)){
            return await response.text()
        }
        const buffer = await response.arrayBuffer()
        return new TextDecoder('shift-jis').decode(buffer)
    }



    static 開始手番(開始手番, 手合割){
        if(開始手番){
            return 開始手番
        }
        return (手合割 && 手合割 !== '平手') ? '後手' : '先手'
    }



    static 最終手(最終手){
        if(!最終手){
            return
        }
        const [, x, y] = 最終手.match(/([１２３４５６７８９])(.)/)
        const 全数字   = {'１':'1', '２':'2', '３':'3', '４':'4', '５':'5', '６':'6', '７':'7', '８':'8', '９':'9'}
        const 漢数字   = {'一':'1', '二':'2', '三':'3', '四':'4', '五':'5', '六':'6', '七':'7', '八':'8', '九':'9'}

        return 全数字[x] + 漢数字[y]
    }



    static 局面図(局面図, 手合割){
        if(局面図.length !== 9){
            return 手合割 ? this.局面図_手合割(手合割) : this.局面図_平手()
        }

        const 局面 = this.局面図_駒無し()
        const 変換 = {'王':'玉', '竜':'龍'}

        for(let y = 0; y < 9; y++){
            let 先手 = true
            let x    = 10
 
            for(let v of 局面図[y].slice(1)){
                if(v === ' '){
                    先手 = true
                    x -= 1
                    continue
                }
                else if(v === 'v'){
                    先手 = false
                    x -= 1
                    continue
                }
                else if(v === '・'){
                    continue
                }
                else if(v === '|'){
                    break
                }

                v = (v in 変換) ? 変換[v] : v
                局面[y+1][x] = 先手 ? v : `${v}_`
            }
        }
        return 局面
    }



    static 局面図_平手(){
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
        }
    }



    static 局面図_駒無し() {
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
        }
    }



    static 局面図_手合割(手合割) {
        const 局面 = this.局面図_平手()

        if(手合割 === '香落ち'){
            局面[1][1] = null
        }
        else if(手合割 === '右香落ち'){
            局面[1][9] = null
        }
        else if(手合割 === '角落ち'){
            局面[2][2] = null
        }
        else if(手合割 === '飛車落ち'){
            局面[2][8] = null
        }
        else if(手合割 === '飛香落ち'){
            局面[1][1] = null
            局面[2][8] = null
        }
        else if(手合割 === '二枚落ち'){
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '三枚落ち'){
            局面[1][1] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '四枚落ち'){
            局面[1][1] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '五枚落ち'){
            局面[1][1] = null
            局面[1][2] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '左五枚落ち'){
            局面[1][1] = null
            局面[1][8] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '六枚落ち'){
            局面[1][1] = null
            局面[1][2] = null
            局面[1][8] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '八枚落ち'){
            局面[1][1] = null
            局面[1][2] = null
            局面[1][3] = null
            局面[1][7] = null
            局面[1][8] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        else if(手合割 === '十枚落ち'){
            局面[1][1] = null
            局面[1][2] = null
            局面[1][3] = null
            局面[1][4] = null
            局面[1][6] = null
            局面[1][7] = null
            局面[1][8] = null
            局面[1][9] = null
            局面[2][2] = null
            局面[2][8] = null
        }
        return 局面
    }



    static 持駒(持駒){
        const 初期持駒 = {'歩': 0, '香': 0, '桂': 0, '銀': 0, '金': 0, '飛': 0, '角': 0}
        const 漢数字   = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10, '十一':11, '十二':12, '十三':13, '十四':14, '十五':15, '十六':16, '十七':17, '十八':18}

        if(!持駒 || 持駒.includes('なし')){
            return 初期持駒
        }

        for(const v of 持駒.split(/\s/)){
            const 駒 = v[0]
            const 数 = v.slice(1)

            if(駒 in 初期持駒){
                初期持駒[駒] = 数 ? 漢数字[数] : 1
            }
        }
        return 初期持駒
    }



    static 全指し手(kif, 開始手番){
        const result    = [[{手数:0, コメント:''}]]
        result.変化手数 = []
        let 変化 = 0
        let 手数 = 0

        if(!kif){
            return result
        }

        for(let v of kif){
            v = v.trim()

            if(v.startsWith('*') && result[変化][手数]){ //指し手コメント
                result[変化][手数].コメント += v.replace(/^\*/, '') + '\n'
            }
            else if(v.match(/^\d/)){
                手数++
                this.全指し手_現在の手(result[変化], v, 手数, 開始手番)
            }
            else if(v.includes('変化：')){
                手数 = Number(v.match(/変化：(\d+)/)[1])
                result.push(result[0].slice(0, 手数))
                result.変化手数.push(手数)
                手数--
                変化++
            }
        }
        return result
    }



    static 全指し手_現在の手(全指し手, kif, 手数, 開始手番){
        const 全数字   = {'１':1, '２':2, '３':3, '４':4, '５':5, '６':6, '７':7, '８':8, '９':9}
        const 漢数字   = {'一':1, '二':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9}
        const 終局表記 = ['中断', '投了', '持将棋', '千日手', '詰み', '切れ負け', '反則勝ち', '反則負け', '入玉勝ち']

        const 手番     = (開始手番 === '先手' && 手数 % 2 === 1) ? '▲' : '△'
        const 現在の手 = kif.split(/ +/)[1] || ''
        const 解析     = 現在の手.match(/([１-９同])([一二三四五六七八九　])([^\(]+)(\((\d)(\d)\))?/)

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
            })
        }
        else if(現在の手 === 'パス'){
            全指し手.push({'手数':手数, '手番':手番, '手':'パス', '駒':'', '前X':0, '前Y':0, '後X':0, '後Y':0, '成り':false, 'コメント':''})
        }
        else if(終局表記.includes(現在の手)){
            全指し手.勝敗 = this.全指し手_勝敗(現在の手, 手番)
        }
    }



    static 全指し手_勝敗(理由, 手番){
        const result = {'勝者':'', '敗者':'', '理由':理由, '表記':''}

        if(理由 === '投了' || 理由 === '詰み' || 理由 === '切れ負け' || 理由 === '反則負け'){
            result.勝者 = (手番 === '▲') ? '△' : '▲'
            result.敗者 = (手番 === '▲') ? '▲' : '△'
            result.表記 = `${result.敗者}${理由}で${result.勝者}の勝ち`
        }
        else if(理由 === '反則勝ち' || 理由 === '入玉勝ち'){
            result.勝者 = (手番 === '▲') ? '▲' : '△'
            result.敗者 = (手番 === '▲') ? '△' : '▲'
            result.表記 = result.勝者 + 理由
        }
        else if(理由 === '持将棋' || 理由 === '千日手'){
            result.勝者 = result.敗者 = '引き分け'
            result.表記 = 理由 + 'で引き分け'
        }
        else if(理由 === '中断'){
            result.表記 = 理由
        }
        return result
    }



    static 評価値(kif){
        const 評価値 = []

        for(const v of kif){
            if(v.includes('**解析 0 ')){
                評価値.push(v.match(/評価値 (\S+)/)[1].replace(/↓|↑/, ''))
            }
        }
        return 評価値
    }



    static 読み筋(kif){
        const 全読み筋 = ['-']

        for(const v of kif){
            if(v.includes('**解析 0 ')){
                全読み筋.push(v.match(/ 読み筋 (.*)/)[1] || '')
            }
        }
        return 全読み筋
    }



    static 全局面作成(全指し手, 初期局面){
        const result = []

        for(const i of 全指し手.keys()){
            result[i] = [初期局面]
            for(let j = 1; j < 全指し手[i].length; j++){
                result[i].push(this.各局面作成(全指し手[i][j], result[i][j-1]))
            }
        }

        return result
    }



    static 各局面作成(指し手, 前局面){ // 指し手 = {'手数','手番','手','駒','前X','前Y','後X','後Y','成り'}
        const 局面 = JSON.parse(JSON.stringify(前局面))
        const 手番 = (指し手.手番 === '▲') ? '先手' : '後手'
        let   駒   = 指し手.駒

        const 成変換 = {'歩':'と', '香':'杏', '桂':'圭', '銀':'全', '角':'馬', '飛':'龍'}
        const 逆変換 = {'と':'歩', '杏':'香', '圭':'桂', '全':'銀', '馬':'角', '龍':'飛'}

        if(指し手.手 === 'パス'){
            return 局面
        }

        if(指し手.前X === 0){ //駒を打つ場合
            局面[`${手番}の持駒`][駒]--
        }
        else{ //駒を移動する場合
            局面.駒[指し手.前Y][指し手.前X] = null

            if(指し手.成り){ //駒が成る場合
                駒 = (駒 in 成変換) ? 成変換[駒] : 駒
            }

            if(局面.駒[指し手.後Y][指し手.後X]){ //駒を取る場合
                let 取った駒 = 局面.駒[指し手.後Y][指し手.後X].replace('_', '')
                取った駒 = (取った駒 in 逆変換) ? 逆変換[取った駒] : 取った駒
                局面[`${手番}の持駒`][取った駒]++
            }
        }

        if(手番 === '後手'){
            駒 += '_'
        }

        局面.駒[指し手.後Y][指し手.後X] = 駒

        return 局面
    }



    constructor(text){  // https://qiita.com/economist/items/cf52cbbcc19ad6864023
        return 棋譜.解析(text)
    }
}





function benry(self){ // https://qiita.com/economist/items/6c923c255f6b4b7bbf84
    self.$ = self.attachShadow({mode:'open'})
    self.$.innerHTML  = `<style id="css">${self.css || ''}</style>`
    self.$.innerHTML += self.html || ''

    for(const el of self.$.querySelectorAll('[id]')){
        self[`$${el.id}`] = el
    }

    for(const name of Object.getOwnPropertyNames(self.constructor.prototype)){
        if(!name.startsWith('$')){
            continue
        }

        const [$id, event] = name.split(/_([^_]*?)$/)

        if(self[$id] && event){
            self[name] = self.constructor.prototype[name].bind(self)
            self[$id].addEventListener(event, self[name])
        }
    }
}


customElements.define('shogi-time-graph', グラフ)
customElements.define('shogi-time', 将棋タイム)
