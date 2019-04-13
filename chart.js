
document.addEventListener('将棋タイム開始', function(event){
    var 設定 = {限界値: 5000}; //グラフのY幅。必要なら変更してください

    var $    = event.target.$;
    var kif  = $.args.kif.split(/\r?\n/);
    var 反転 = $.args.myname && ($.後手名.indexOf($.args.myname) === 0);

    $.評価値 = [];
    $.読み筋 = ['-'];

    for(var i = 0; i < kif.length; i++){
        if(kif[i].match(/^\*\*解析/)){
            var 解析   = kif[i].match(/評価値 (-?\d+) 読み筋 (.*)/);
            var 評価値 = Number(解析[1]);
            if(反転){
                評価値 = -評価値;
            }
            if(評価値 > 29000){
                評価値 = 設定.限界値 + 1;
            }
            else if(評価値 < -29000){
                評価値 = -設定.限界値 - 1;
            }
            else if(評価値 > 設定.限界値){
                評価値 = 設定.限界値;
            }
            else if(評価値 < -設定.限界値){
                評価値 = -設定.限界値;
            }
            $.評価値.push(評価値);
            $.読み筋.push(String(解析[2]));
        }
    }

    $.チャート = c3.generate({
        data: {
            columns: [
                ['評価値'].concat($.評価値),
            ],
            type :'area',
            onclick: function(event){
                $.$指し手.selectedIndex = event.x;
                $.$指し手.onchange();
            },
        },
        axis: {
            y: {
                max: 設定.限界値,
                min: -設定.限界値,
                padding: {
                    top: 0,
                    bottom: 0,
                },
            },
            x:{
                padding:{
                    left: 0,
                    right: 0,
                },
            },
        },
        grid: {
            y: {
                lines: [{value: 0}],
            }
        },
        legend: {
            show: false,
        },
        tooltip:{
            contents: function(data){
                var html = '<table class="c3-tooltip"><tr><th>';
                html += data[0].x;
                html += '手</th></tr><tr><td>';
                html += data[0].value + '<br>' + $.読み筋[data[0].x].replace(/ .*/, '');
                html += '</td></tr></table>';
                return html;
            },
        },
        transition: {
            duration: 0,
        },
    });
});



document.addEventListener('将棋タイム描画', function(event){
    event.target.$.チャート.xgrids([{value: event.target.$.手数}]);
});