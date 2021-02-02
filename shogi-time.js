

class 将棋タイム extends HTMLElement{

    async connectedCallback(){
        benry(this)

        if(!this.kif.includes('\n')){
            this.kif = await 棋譜.ダウンロード(this.kif)
        }

        Object.assign(this, 棋譜.解析(this.kif))

        this.全局面 = 棋譜.全局面作成(this.全指し手, this.初期局面)
        this.手数   = this.手数確認(this.start, this.総手数)

        if(this.後手名.includes(this.myname)){
            this.reverse = true
        }
        if(this.comment){
            this.$コメント = document.getElementById(this.comment)
        }
        if(this.graph){
            this.$グラフ = document.getElementById(this.graph)
        }

        this.描画(true)
    }


    disconnectedCallback(){
        if(this.$グラフ){
            this.$グラフ.remove()
        }
    }


    static get observedAttributes(){
        return ['kif', 'start', 'reverse', 'myname', 'controller', 'comment', 'graph']
    }


    attributeChangedCallback(name, oldValue, newValue){
        this[name] = newValue
    }



    $将棋盤_click(event){
        const {left, width} = this.$将棋盤.getBoundingClientRect();
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
        this.描画(true)
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



    描画(全描画){
        const 手数   = this.手数
        const 局面   = this.全局面[this.変化][手数]
        const 指し手 = this.全指し手[this.変化][手数]
        const 反転   = this.reverse
        const 先手   = 反転 ? '後手' : '先手'
        const 後手   = 反転 ? '先手' : '後手'
 
        //全描画
        if(全描画){
            if(this.先手名){
                this[`$${先手}名`].textContent = `▲${this.先手名}`
            }
            if(this.後手名){
                this[`$${後手}名`].textContent = `△${this.後手名}`
            }
            if(this.controller === 'none'){
                this.$コントローラー.style.display = 'none'
            }
            if(this.$グラフ){
                this.$グラフ.描画(this.評価値, 反転)
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
        this.$駒音.currentTime = 0
        this.$駒音.play()
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
            return 総手数 + Number(手数) + 1
        }
        if(手数 > 総手数){
            return 総手数
        }
        return Number(手数)
    }



    get html(){
        return `
        <style>
        #将棋タイム{
            user-select: none;
            touch-action: manipulation;
            width: 514px;
            margin: 50px auto;
            position: relative;
            font-family: "Noto Sans CJK JP", meiryo, sans-serif;

            --最初に移動ボタン: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+DQo8cGF0aCBkPSJNMjksMkgxN2MtMy4zLDAtNiwyLjctNiw2djExMmMwLDMuMywyLjcsNiw2LDZoMTJjMy4zLDAsNi0yLjcsNi02VjhDMzUsNC43LDMyLjMsMiwyOSwyeiIvPg0KPHBhdGggZD0iTTExNywxMjBWOGMwLTUuMy02LjYtOC0xMC40LTQuMmwtNTYuMSw1NmMtMi4zLDIuMy0yLjQsNi4xLDAsOC40bDU2LjIsNTZDMTEwLjQsMTI4LDExNywxMjUuMywxMTcsMTIweiIvPg0KPC9zdmc+");
            --前に移動ボタン: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+DQo8cGF0aCBkPSJNODcuOCwzLjhsLTU2LDU2Yy0yLjMsMi4zLTIuMyw2LjEsMCw4LjRsNTYsNTZDOTEuNiwxMjgsOTgsMTI1LjMsOTgsMTIwVjhDOTgsMi43LDkxLjYsMCw4Ny44LDMuOHoiLz4NCjwvc3ZnPg0K");
            --次に移動ボタン: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+DQo8cGF0aCBkPSJNNDAuMiwzLjhDMzYuNCwwLDMwLDIuNywzMCw4djExMmMwLDUuMyw2LjQsOCwxMC4yLDQuMmw1Ni01NmMyLjMtMi4zLDIuMy02LjEsMC04LjRMNDAuMiwzLjh6Ii8+DQo8L3N2Zz4=");
            --最後に移動ボタン: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgMTI4IDEyOCI+DQo8cGF0aCBkPSJNMTExLDJIOTljLTMuMywwLTYsMi43LTYsNnYxMTJjMCwzLjMsMi43LDYsNiw2aDEyYzMuMywwLDYtMi43LDYtNlY4QzExNyw0LjcsMTE0LjMsMiwxMTEsMnoiLz4NCjxwYXRoIGQ9Ik03Ny42LDY4LjJjMi4zLTIuMywyLjMtNi4xLDAtOC40bC01Ni4yLTU2QzE3LjYsMCwxMSwyLjcsMTEsOHYxMTJjMCw1LjMsNi42LDgsMTAuNCw0LjJMNzcuNiw2OC4yeiIvPg0KPC9zdmc+");
            --ダイアログボタン: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xMTUyIDg5NnEwLTEwNi03NS0xODF0LTE4MS03NS0xODEgNzUtNzUgMTgxIDc1IDE4MSAxODEgNzUgMTgxLTc1IDc1LTE4MXptNTEyLTEwOXYyMjJxMCAxMi04IDIzdC0yMCAxM2wtMTg1IDI4cS0xOSA1NC0zOSA5MSAzNSA1MCAxMDcgMTM4IDEwIDEyIDEwIDI1dC05IDIzcS0yNyAzNy05OSAxMDh0LTk0IDcxcS0xMiAwLTI2LTlsLTEzOC0xMDhxLTQ0IDIzLTkxIDM4LTE2IDEzNi0yOSAxODYtNyAyOC0zNiAyOGgtMjIycS0xNCAwLTI0LjUtOC41dC0xMS41LTIxLjVsLTI4LTE4NHEtNDktMTYtOTAtMzdsLTE0MSAxMDdxLTEwIDktMjUgOS0xNCAwLTI1LTExLTEyNi0xMTQtMTY1LTE2OC03LTEwLTctMjMgMC0xMiA4LTIzIDE1LTIxIDUxLTY2LjV0NTQtNzAuNXEtMjctNTAtNDEtOTlsLTE4My0yN3EtMTMtMi0yMS0xMi41dC04LTIzLjV2LTIyMnEwLTEyIDgtMjN0MTktMTNsMTg2LTI4cTE0LTQ2IDM5LTkyLTQwLTU3LTEwNy0xMzgtMTAtMTItMTAtMjQgMC0xMCA5LTIzIDI2LTM2IDk4LjUtMTA3LjV0OTQuNS03MS41cTEzIDAgMjYgMTBsMTM4IDEwN3E0NC0yMyA5MS0zOCAxNi0xMzYgMjktMTg2IDctMjggMzYtMjhoMjIycTE0IDAgMjQuNSA4LjV0MTEuNSAyMS41bDI4IDE4NHE0OSAxNiA5MCAzN2wxNDItMTA3cTktOSAyNC05IDEzIDAgMjUgMTAgMTI5IDExOSAxNjUgMTcwIDcgOCA3IDIyIDAgMTItOCAyMy0xNSAyMS01MSA2Ni41dC01NCA3MC41cTI2IDUwIDQxIDk4bDE4MyAyOHExMyAyIDIxIDEyLjV0OCAyMy41eiIvPjwvc3ZnPg==");
            --ダイアログ_閉じるボタン: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNDkwIDEzMjJxMCA0MC0yOCA2OGwtMTM2IDEzNnEtMjggMjgtNjggMjh0LTY4LTI4bC0yOTQtMjk0LTI5NCAyOTRxLTI4IDI4LTY4IDI4dC02OC0yOGwtMTM2LTEzNnEtMjgtMjgtMjgtNjh0MjgtNjhsMjk0LTI5NC0yOTQtMjk0cS0yOC0yOC0yOC02OHQyOC02OGwxMzYtMTM2cTI4LTI4IDY4LTI4dDY4IDI4bDI5NCAyOTQgMjk0LTI5NHEyOC0yOCA2OC0yOHQ2OCAyOGwxMzYgMTM2cTI4IDI4IDI4IDY4dC0yOCA2OGwtMjk0IDI5NCAyOTQgMjk0cTI4IDI4IDI4IDY4eiIvPjwvc3ZnPg0K");
            --反転ボタン: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTc5MiIgaGVpZ2h0PSIxNzkyIiB2aWV3Qm94PSIwIDAgMTc5MiAxNzkyIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0xNjM5IDEwNTZxMCA1LTEgNy02NCAyNjgtMjY4IDQzNC41dC00NzggMTY2LjVxLTE0NiAwLTI4Mi41LTU1dC0yNDMuNS0xNTdsLTEyOSAxMjlxLTE5IDE5LTQ1IDE5dC00NS0xOS0xOS00NXYtNDQ4cTAtMjYgMTktNDV0NDUtMTloNDQ4cTI2IDAgNDUgMTl0MTkgNDUtMTkgNDVsLTEzNyAxMzdxNzEgNjYgMTYxIDEwMnQxODcgMzZxMTM0IDAgMjUwLTY1dDE4Ni0xNzlxMTEtMTcgNTMtMTE3IDgtMjMgMzAtMjNoMTkycTEzIDAgMjIuNSA5LjV0OS41IDIyLjV6bTI1LTgwMHY0NDhxMCAyNi0xOSA0NXQtNDUgMTloLTQ0OHEtMjYgMC00NS0xOXQtMTktNDUgMTktNDVsMTM4LTEzOHEtMTQ4LTEzNy0zNDktMTM3LTEzNCAwLTI1MCA2NXQtMTg2IDE3OXEtMTEgMTctNTMgMTE3LTggMjMtMzAgMjNoLTE5OXEtMTMgMC0yMi41LTkuNXQtOS41LTIyLjV2LTdxNjUtMjY4IDI3MC00MzQuNXQ0ODAtMTY2LjVxMTQ2IDAgMjg0IDU1LjV0MjQ1IDE1Ni41bDEzMC0xMjlxMTktMTkgNDUtMTl0NDUgMTkgMTkgNDV6Ii8+PC9zdmc+");

            --マス: url("data:image/png;base64,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");
            --マス_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZoAAAHGBAMAAAC/ZFDcAAAAGFBMVEVHcEwAAAAAAAAAAAAAAAAAAABgYGAxMTFwyNPwAAAABXRSTlMAOXi44neyL5YAAAQcSURBVHja7d1NU+NGEABQSV6Tq4TFXZbNnbXYOyzLHUJm8wvYveZC5e+HXFgousKHoQp3Xh+nxho9Tc/Yh/aoqjJH3YWtbdTaxVeIenbP7Vl3XfvsobqnNE2JWr/80UZdT6O+50FbKc/9fFPK0ePWWThUU06e4hxED+xyFgyxaKeg7yzQ1BfRSH07Rs2fhuCmwqHWYeuTmqqNhqi6r9EQwQXqr5ug52oVXbRaRcJlOFTVv0pTn4X5F0x/fRppTvvgxteb6Bary+q5SX2wOX+VZh3uArcP53GinZ1/jm7nKPp0NFZzEo6/jp7x9Kq5qX+PNpp+eRzczPhl+bgxnJt+OT1z2VTrLhiqWiw3r9HEG00TzkJ4gXWUU/W34KLVPEqDeKjmfKjyx4+dj/ua67Lrcf8b7TqasL3wO28HutLQ0NDQ0NDQ0NDQ0Oy2pmkzaT5l0uyvN0MizeHqKFGm9XUmzSqTpj6tPx+l0fRDfTbk2QWqavRbgIaGhoaGhoaGhoaGhoaGJpcmrPn6HjV+0K4PNOrTrBsaGhoaGhoaGhoaGhoamh3WzO/+WZ5B080yaTbNkEhzWp/k0dxaTvNoZsPdyQQJNOtff39PoOl+nYXi25OGhoaGhoaGhoaGhoaG5kUa9Wnq06wbGhoaGhoaGhoaGhoaGpoP0rVOpVkk0+y3aTTd8fkmj2Z13ObKtDqVZp5I04/HiTTNuPRbgIaGhoaGhoaGhoaG5kH8+Hu7W9z7+dfH0ezdlIutND9LeUvNluVhpXzfqujsupSPU5/257bVZTcfqT7tt7Jlpt28baZtuQuEN/OCq87Dp2GHpqGhoaGhoaGhoaGhSaBpU2kuEmlW09U0pNF0t5Eo08ZmSKTJdhrcJo+mb6uDNo1mv7p727ffAjQ0NDQ0NDQ0NDQ0NDQ0L9I4P835adYNDQ0NDQ0NDQ0NDQ3NU13rVJUps+OzKVGmNUOiTGvWmyGR5nC8SJRpfZVJs8qkWX2broY0mn8rIVu/BWhoaGhoaGhoaGhoaGhoaFJp1KepT7NuaGhoaGhoaGhoaGhoaGhoaP6760EppU2jWcwXs0SaxaJPpBn7szya/mIxJZqbqkq0bnLtac62o6GhoaGhoaGhoaF5k4t5v+f98H5P7/d81kR7v+eDmIdPww5NQ0NDQ0NDQ0NDQ0NDQ/N+J/WVcmVuaN6/a13Kpbmhef+uh6WUwdzQ0NDQ0NDQ0NDQ0NDQ0LxC4/w056dZNzQ0NDQ0NDQ0NDQ0NDS7q2mmaZNIM45LmUZD88KTk8ZxbNNoVtM0DTKNhoaGhoaGhoaGhoaGhoYmlUZ9mvo064aGhoaGhoaGhoaGhoaGhubtu3a30abRODmJhoaGhoaGhoaGhoaGhoaGhobmdZpU9WnzVPVpQgghhPi/xj/AjbFfunj3xAAAAABJRU5ErkJggg==");
            --盤: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZoAAAHGBAMAAAC/ZFDcAAAAElBMVEX72Gz62Xf43Iv/1Ef/1jb72GMQBYLhAAAEhklEQVR42u3aS27iQBQFUNtkBXZ2QC+gqiXmmbAAyP730vWx+TbJlCedSZTKvUF6MgaXfYa0300pLcv3mNIxL1PK+49d+dP+nPMxfZ5C5UNe6mr/qn1OkfJfpwmVD/1IlVX5eUz7KZf2d22f1nakfHhoj709t//7z6u9d/54bMZ0baf2voyUv5hm6u3Dq1d70/xmmnyo78u7dvqcQuVtmlx+7K7tz9LOffY/U6i8TjOXVR23tQ9be2xHcgqV3xybh/Z0acfJh0N/313a65FM+7m15xQpH25W6fks+zOFyq/TzL19SOvsvT2Hyp+mKb9//PRqb53/OM3X7ZGMkN9Pk9uR/NjOsqf2u+ft+6acWWV1yL29PLbj5DfTbLMvff/w1A6Ql2mWOZctz67sdr7KN2y6befaDpT3adIv7Sj54zTz2s4vXu298yEtd+3poX0OlW/TLLuxn2WX9nTXjpHXaeo1aLvz0dv7z7Wd13ac/DLNsrZz/3Z6aofIt2l2y/xjO0ZeP9PGemXwPdf9w7JeB431iuhQvp1OofKbaeq+u074qh0gb983bdX2dnfttLbj5ENeV7ut3fZ2p3rnqrVD5fWuel+N7Ui2+7x10Es7Ul4+066rr7Teg/8e6x3ffiQj5ddj0/ZyW3t6bkfI25XNZVWfj/ytz0fGbad6DpVv77RyndPa86XdZm/PruLkfe95bV9nP62zR8rrvc66Z7jO3j4BS+mU8ld/PhInH25W+bieZduTuIf2++evpzm39ilUPvACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArwAL8AL8AK8AC/AC/ACvAAvwAvwArzAm+X/AGdtZdHlcQDwAAAAAElFTkSuQmCC");
            --青: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAYAAACITIOYAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNS8wOC8wMmdfgQQAAAAgdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIE1Yu5EqJAAAALhJREFUeJzt18sNgzAQRdExooq0QRv0QU1JT2mDNiabWGLhADG+MiO9s2IB4mowv+TutrztYTf3nGwdv9tz15JzXkPvgn8olqJYimIpiqUolhIqdjzeZZdXHJNqTxZqsqFiry6Dku3SqL7kJaEmq1gKHVvzaPtJk6WQsU2XgBkbm5+xzaK1DCjE67bpK3Yr1GQVSwkVe/UGw26mklCTVSxFsRTFUhRLUSwlVGz+kFm7VpyU3Jv/MWM+nuUQMZ4EspUAAAAASUVORK5CYII=");
            --緑: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAYAAACITIOYAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNS8wOC8wMmdfgQQAAAAgdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIE1Yu5EqJAAAALJJREFUeJzt18sNgzAQRdEZRBWpKRVSIG0MGyyxcAixfeWM9M6KBYirwfw8IszNX/bnwmJfz+331JJntmV2wS8US1EsRbEUxVIUS0kVu37f5VY0HOOtJ0s12VSxvcug5ro0mi95TarJKpZCx7Y82j7SZClk7NAlYMbGlmfssGgtAwrxuh36ir1KNVnFUlLF9t5g2M1Uk2qyiqUolqJYimIpiqWkii0fMvvUioc8YvgfM+YA2c4QMX8XJhEAAAAASUVORK5CYII=");
            --赤: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAYAAACITIOYAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNS8wOC8wMmdfgQQAAAAgdEVYdFNvZnR3YXJlAE1hY3JvbWVkaWEgRmlyZXdvcmtzIE1Yu5EqJAAAALFJREFUeJzt18sNgzAQRdEZRBWpKRVSIG0MGyyxcAixfeWM9M6KBYirwfw8IszcX/bvIvb13HxPDXlmW2YX/EKxFMVSFEtRLEWxlFSx6/ddbkXDMd56slSTTRXbuwxqrkuj+ZLXpJqsYil0bMuj7SNNlkLGDl0CZmxsecYOi9YyoBCv26Gv2KtUk1UsJVVs7w2G3Uw1qSarWIpiKYqlKJaiWEqq2PIhs0+teMgjhv8xYw7YzhAxIgEy+QAAAABJRU5ErkJggg==");

            --歩: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwEBAIDAgEAAAAAAAAAAAAAAAAFBQMCAgEAAAAAAADx4IvQwXkAAAAAAAAAAADbzH/o2IfCtHGTiVXLvXa2qmpJRCrbzH/v34u3qmp+dEnt3ImonGF4cEXq2ohdVjZmXzt1bUT/7ZT45pD965IAAAApJhhDPiZ/dkoRDwng0IKglVxjXDrAsm+QhlOxpWZbNJ/VAAAAInRSTlMAFpFWbgNDCyIGMf7+hHo7i8Dky3JGpajjXSrTNb/5tHxL6i55BwAAAkpJREFUSMfdletymzAQRqNgGWRhO6RufUuTFlk3JMH7v11X4mKBwdP+7Tf2TGZyZr06u4KXl/8gGBOC8d+Al8P1erigNCXPcZweChZSHDKUPqmOz0fK2C2Esc/jGaGF4h9vpwCWIQE/HX/P0piGioAZoWhL3xjdZOgR/s76kqXlipoq4OzXPkvJDOs5J1XZcKs5DzD7kWxQOmXfWraUvHRcVY6Grtm31TqbsrhnDYePghga2F2SoUnDuAhsLiXnQkgpBReefd9BExOWFO3RqjovncjDn/5w71tgJ4cjnx6tDHwryhW4ENY38blN9g9saMFpKQSFs5nc6baJ7WqfTdiPtl1oNq8Fdw0XjbRB2qOITq8xfhYWzImmlTbDHlg/Nd82SKDtWrCfuyk76A3FdY+2gjfpSBo+DqwDw7ZDZwX3ej0p62r4iTnB5NSzMIbcmjtbPbLx0cCcHWAveMxeIjbX3FZ39hWGkc7o9am1rVwN20MXBA96ay1gxXx03gmesne9QivjFDdlJDiLBUejqP3lsVzG7EgwKQY25w6K3+u2gmP22l/i3AkrpdahZVig2y2fCA56bfd/UGD9hVPSr/CDYBRasNo2Ve1VNSo8H+COdILJnF7aulKcS1fOCj73LAW3dTe89nw39jVi7w8H6NAMk9a0k7aOBPeskqq5r4UQdEYwLuI1GwcEj1g/isWw8bYTyp6E7kYs2iSr7etCtquYxShbJ6vFJOssYlOUbfbrhezhPRAtJUkRyhbjX0fx84GQdDGE4H999f4BVmyGUvdymz8AAAAASUVORK5CYII=");
            --歩_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwAAAAAAAAJCAUAAAADAwEAAAAAAAAAAAADAwLv34sAAADh0YIAAAAAAADQwXkAAAACAgGKgFDl1YTPwXiZjlizp2hGQilhWjgoJRfWx3zGuHPczIC5rGubkFlxaUHXx3z/7ZT35pD86pIAAAApJhh/dko+OiQRDwmglV3Asm9fWDewpGaQhlRQSi5uZj9ZxO58AAAAIXRSTlMAUiItCH02DAQW/mz9i0T+XpjKzIpM3rTCqrDp8WbYp5yJspWtAAACYElEQVRIx9WVbZOaMBCABXkNQQTv7Hm1dyVsCOHN///vugmRt4O2M/3UndFBfWbdPLtJDof/M4LAcfydcJwgmKGE/SZIGPoTHFxYsRvs4tkzOLgU+W6wi3Wyw4l9YfprwnkyMm3Zl5rNIuu4YHViUkFlYMmhkuqhYJl79mbsj4HNJRi4A+AkH9i3Jftq2LwWAOqfkwoGFNlv7qIGW7OUqjdZtqqcjrZN9VBsumAPvmKxQlGqaIQQHHQ0hvWnXvhKWmt+ryrRP3htFlkkaXSy16wJCRzrhqc89j1ess7PiRWAVVLozMfiI44825mxL6yY8pa1LCv+1JDFqGzGjoLRlQouRNVt6p0JJr3ou5o+qrGElV5kj1MNOW3GTiv2tmIHwSYagGmCvuhFls6mUjbIJvXA3ld6UcRigmknQBh2rRfZ94klD3iSyF4V6yzYSTB5Tu623mnaNcppvmKDBfsUjAPU502jViiN3h22Eci2NfAu4drcht5DMAjGUutEllDjLu2relMvCiaKJQ3H8S6BqC0i8VXQ1F0pGydYryrhdU7bdkfvKJirERMcixUi2darBWtjUm04kDkMh0ORrSZ9IZjUFNeWg9jTOwmmuDcbaPNSd3lL76wZVJISmt1J1xEyPFdNm0tuqmXrg8RIe32n6hQeJwHJ+8dtQxmyoWd9XsmAK5Bc39I0jqzVlA1dtj0rcj+vqhbGNOi6iNp+8OV6cUL7eLLOkZvdk+yWxrEbna3T0f6aFhM7PtKexjEU6CHpO8HmxYW0wQ24R07JEUdQpwz+cC2q7OFfgOYSVfFP9/AvDyyCv5GtN9YAAAAASUVORK5CYII=");
            --香: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAqFBMVEVHcEwIBwQAAAADAwIAAAAAAAAAAAAAAAAAAAAAAADx4IsAAAAAAADRwnkAAAAAAAAAAAC0qGjOv3ft3YrZyX3g0IJJRCvp2YgAAACBeEutoGXHuXSQhlSzp2jk1IR6cUevo2WSiFV1bURXUTJmXzv/7ZT45pD86pL+7JMAAABAOyXAsm8PDgmkmF8gHhOAd0owLRxPSi6QhlNgWTh/dkpwaEDfz4Hg0IILcXRbAAAAJXRSTlMADpArQgMXBnEg/oI3+1xUZkd12I6orMVMwdnmy1+5LDLJS5N8Z+EDiQAAAllJREFUSMfNlVez2jAQRq+vsQ0CA6Gk35Iiw6q42/z/f5aV5AKWnMljvjdmzsi7e1bo6ek/TRBEURD8C/h2OB4Pb6GH/N9B7/CaJJckSV4PPuLzpwcvZ4LkFYM4Ob+ECneR76ejBqmOxo+nn046IPpEDbKCKBpx4q8c8AdEzZGkASjM4Zfk9wZhmzUoqQWwhneVJL92m9BiDx0bc57HlPbsl/1i5U3LPXUspik4r2PD/lh+9r1JwcFZs3HBWA6CCYBWs1/XOz+csNEn0xpp5C0TbUyJae7bemsVHB0N2+aCZkAzUZRqbpfYxSYXhUqRNlgFpTcGoqT0kqz3bjZmouDIZ5y3tAJokH3GQUTWeEmZSVqJFAAYQw6/gc19XFpD61VkgBpaThsozdAc7GFgcWYAogDeyVADdqsoQXJMjN837HdLRqcC24OqZspH2bG2jF4FpVWVYYqqWwiHjF6F1kHoEJeMTkVXBmuHHw4ZPUtUZwJwg2TPWjL68V4lQIrLzlh6ozMD7tm2vRHKgHA+bLvFDirU5ijHIuXULeNORXzDc7HwFKRbxqCCQ8XUpRAy7RdiKmNQQaCQWQ6c30DMyBhVpHld51DXErIZGaOKgqW5mRmZkaFZLYsjonqjhM7I0ONt8rKsa9NblyK2B2xU4A1jVSa56g1TVgIct6hT0cnSNehIacm4/4N6YK+2jEHFlHXIGG+FYdN7diIjOiaXu9Ty/lfyKCPCJ2U+5JEN/d1y/TyT9RLrHVnPX2z3y5nstwt/fDMCL/Q3i9ls8FkclzLywnA1G/UkIvQHTC6gd762GtIAAAAASUVORK5CYII=");
            --香_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAjVBMVEVHcEwAAAAAAAAAAAACAgEAAAAAAAAAAAAAAAAAAAAAAAAAAADg0ILQwXnn14bTxHrFt3IqJxhKRStrYz6KgVCNg1K/sW6il16ckFqsn2RxaUFxaUGFfE7/7ZT86pL35pAAAABAOyXAsm+Ad0rw34sPDgggHhOQhlRPSi5gWThwaEGhll0wLRywpGZcVTVz73LqAAAAHXRSTlMAOi6SgE4iBQwWbVz+/ciW5qy3xM0+bk/Y06dLu/BFU/wAAAJcSURBVEjHtZXZlpswDEAhYU3sTDIzbSfTAjJeMEv+//cqs5pgcvpSvXFyoyPpWrbn/d+I4zjZDfzRQkXxIkSaJgscX4rcDtqQ5aO4+JEFx5c8s0Mx6yO/nhFe2Lc1Cyv2fgoPNlvke2xefAZn32J/GpZW5Ikte/Zjzf4yrAJZV6UJ6MoHrxlAbdj34GzX8KPPq2EKyVjNeVXVDbK3wK7XS5Z6xViDMAVkBNkjsonnYIVijIHsFNNTb8dTGNnsPGAOD86h47xT03h3WQnE9MZbDWJmfZudZVSgWjn0Bn3Bef5l2Nhmx4JbUKLvjVCoXComGf34FeYE6BhreOZQMckY6VJgXkEyMrBrFZOMfqDDzBRAO47sSYU94JYxDRJFt2Ic71qFFyf2QSMM6HLMnsZrD3iwR5aT/oqtNcdo9NDaRoW9GZWZF+P1WMZGhb0ZSlJzhNs9FZaMEjQ6xtywo8KSUUGTlcT8h7tVTDKUbLMGjGNQss4evBJbFaOMxmwYnslWNZnQklGHillcJYFhAR1um5IPt4p5wKLSkmdYq+zIjgpLhsgokZy0jXBuhS2DmKWQxoemrq1YyaC8LHWzc0E9b4bh60dL91SsNqNs8LBzsafC3owMr6qhMedW9IMQeLcPk9DjNYl3unCMDNnfb8S8BPMhR5J83YLtyLCI9BB+38WAG1Dc34/H4OQoAVcu8sNT8H0tEC+K68cNSUQx7Yb1kjQ6+OH5FPyh9HMAz6F/iLZpzXM40AYPerAnkzh2P55JOuIjuEcuyaMDRhS9BKcmMTtmxJbif3rIY0fKv1IggNza1njWAAAAAElFTkSuQmCC");
            --桂: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAilBMVEVHcEwAAAAAAADRwXkAAAAAAAAAAAAAAAAAAAAAAADBtHAAAAAAAADt3YoAAAAAAAAAAAC0p2jVxnzVxnuJgFCRh1Tp2Yjh0YN+dEmtoGVKRStJRCteVzb/7ZT965P35o/66JEAAAA/OiSAd0oXFg0wLRzw34uwpGZPSS1gWTfg0IJwaECglV2QhlSs6WO0AAAAHXRSTlMAkTH8Qw4XBSFw+1Vj2X2HPEd2lMYkxadI2a2riF55s8gAAAI5SURBVEjHzZXZluIgFEWrxQyiVU49d9EJlzkJ//97zZBEJNGqxz4PLh+2rMvZgC8v/2mqkM+A3y6vr9efZVF8gHuwadu/bfMBPoExz/AZJCEJvqRlcwNveCM3dZGzZ4d6QAJzn0j3MuLN+2kBn5txTUaVh6mIazfv+02ZsZd2ZBUPK1Ie2fbrYVsX9+x1ZgXrMMZUaCsDu9tnbPXDs4NmQCkMDIACg86zv97yIarvYV3WWxMHpWycAS/Z17EGjQEjNlgOoJFn0fGQs7EGKRAWhgzAuFFMhSKOh9Mqq3uiYwHARiGeratlvYp3WgAhxgDnlKPA/tllpUWWc+62T0jHQnMysL9zNqhQlJreAAozGIxRlJGzQQUyHempdj8ZwzvPutKKhYp4HhBRFvtv3WDUioxRxUqWMiYVfjFCsHKS1cTmMqpmXpb7QYXue5IU/IAF15nokyFyGeeE5VhRLvgws5mMlBXuQHIVyiVrMi5twrqZxWDlXEQm45qwYXMA5sbeyUhUhL1BurdMRqoCBFa612AsWpVxU+HvPBWGMe0unsArMm71Ikzw1JYCOixljKy7Ye4NsVRIw/27M1C6lDHW27lDyKi11BJDtdetlzImFYYyyS3p3bkx4CdHSxmTCqkV6cLY1j9p8Y3IZFwXp3eAnlNYkZGqSKuTKzJWb4UAuXYzvIonuZNRyeZp5FvClpv97vjlYY67ZIai3u4Pu4c57Lfzf0ZVlPXmtH2Y06Yu5/8XB5f1k5QB/Qf7tIqnxqwMmwAAAABJRU5ErkJggg==");
            --桂_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAh1BMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwIGBQPf0IEAAAA5NSHm1oXMvnadkVqCeUvJvHS/sW6il15rZD6NhFLXx3yGfU7by3//7ZT35pD86pIDAwI/OiRnYDzw34tPSS4vLBvAsm+wpGbQwXmAd0odGxGhlV1/dkqRhlQUpMqgAAAAHHRSTlMAQmGUM1MeBQsUcX2I/SixyujWPY1uT8PPnLuZmaStNQAAAmNJREFUSMe1lVmXojAQRt0QFLG1u2cPVHbW///7pkJICJB2nqYelOO55lS+mwq73X+tNM1eVpp6lJcvi58vmYPTR1m9qPJxuns4fVRkKk4lWVVVPZP9/eLYP47lEqBZw+X7NTl59rOcYArAaLdat/yZH2b228Q2ADUhShX4XBAtuGV/3AL2u2Vr0wBlhGhGBuANMMu+5UEPH5YV0JoPAw4DNAVAsWF3F8sCYKucAcMtDhLqWtCRPebJ/eJcZJbtgOppQ50iqnZ7O17398yzU8AKI6Oi7xl+9z6yJ7LnDYvbGxgVTGglqc9sxf6qwkQZcpTOKm6HgJ1lGBCFALR0VoHxnv1B8zKM5qGTGJ2c2VDFLGPsWOkWKA3YRbxehg1OtqBV+xXrZLiWZbC3lQovYwSZsJsjURVhwERT2miFvRTReBfs5qRv2FFGIfpxMTVoUjvH1VKFk1GAL22OZsHqjYpZRq0UGwOoKWMM/7JRMcvgqmikNp3QhrVtG4nXy8ApQmkMZ4dKUeCyETaQ0VgJrSBMxFR4GbrXrO1x6plUteQxFT5gnDDaDl1TK6rsxG/iDWU0YG8VwVgf0+Yno6A9xQPZd3gkaNN0ERV+MvggJCg1JhediuVktGMPHHR0KpaTIc2VRvR0XUbiDSaDM1GPMfOv2F3Gzd2+vqWrkh+vyTJeFPfx+ShD3IBl8f62iQGbuJyS/Pdzwh14PN7Mnb5is+x8Sg7Xm8UdmF8Pyem8ahfhy/m+31vcg4dkj2gWeR0ifdoniOe5A+/m1ZbGX54jjqsfEgvGyQWO9RoMcFP/Ah1uavPzXyn7iP54K4uvAAAAAElFTkSuQmCC");
            --銀: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwAAAAAAAAAAAAEBAIAAAAAAAAAAAAGBgMAAADezoEAAAC0qGkAAADt3InMvnfOv3fn14dJRCutoGWRh1SBeEuFe0zy4Y1YUjNmXzz/7ZT965MAAAD35o/66JE/OyXw34uAd0oQDwmglV3Asm9uZkBfWDcvLBvQwXggHhOxpGbg0IK/sm9PSS2Rh1R4cEYRlJ5aAAAAGnRSTlMAMYBQE3CQBiFBm1xLZth26sGs2cvBO/GSeXsFMrYAAAKOSURBVEjHzZXZYptADEVjB8dLHLtp06SdCKTZYVjy/39XDVvApk4fe5/m4SA090pwd/efatvqX8DXw+l0eE2Sr/Dt8fCWZu9Zlr4djknk/wIm5+c0zbL3Vhnzz+fdYvnd+cRgpESreErT9HR+va7egUJQocWgWD6l1S6Zs0dGOwAgF7koK4sh4ln6+xI+pj2qwSkMyivn+CGG01/3qzl77stSUYu8KFAKasC0hX8+7XfJlD30rPNUucYgFlB0dbOXDRee+tqzjbKFskZgHYRW7f2yH+t5E9vnltUqFwFCLtA5BNex39aPc/YUWe1I5BZAMduYvMZltrfBFOBjPb4bO6LK1ogHvtwCywrgMaCkWkkSS+xgr7UewDeEtfsoXNWx3zeLLGkdQLY9kC2gpgV2iEKI8gMUNCi18uTBtmFs7qdh9PZar0CxBYQASIJ8y76sp2EMUQipLHVTYcdhuwijj2JRlwZ3UfSD1lUMFrFaZD/t5UmTwijuF7F76sLgkdW8FeiqquTloKpcYsdJFxwwSomaJIcSnb4yeMJKgQ3HUUNdSgC6ZvsoyqpSNSpDPJp5ieBDd7lZGL29OU+ZDLw6HIPk42DaNIwxiq4NXrNQy1I4txDGEEVVBS2xXcn4FgmWPbkweIiCV6JAC7yZiAq8h8Lzjlywgw3mQ4kSTI4ysLcG6muDR5YKKE3sQcYPFYG/Zkd7LUdhoIyHEOuCuApjYEsAzUQcyRjZIjtsRcOeVhpEDu0YG2i/PPMwBnvzhqhQXbHcSQedfdMwZlEYwH7xahh6mIQx3wpN4wn01WbEKG5qylL6heiTTVb3m/XDDa03Y7/Jbv/4tLmhp8d9/8/YMrza31T8vWzvBvgLRfQPng6N1+L0ebUAAAAASUVORK5CYII=");
            --銀_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAhFBMVEVHcEwAAAACAgEAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAADg0ILm1oU8NyJrYz7Ft3Kjl16CeUvYyH3SxHm/sW6il16NhFKpnWL/7ZT35o/86pIAAADAsm8oJhfw34tAOyV/dkkQDwlfWDfQwXhuZj+hll2ypWdPSS2QhlOflFwCvsHpAAAAGnRSTlMAMJQkGYBbCgUQb0s8/squwObUPZuMbk/PlDA9ih4AAALCSURBVEjHtZXblqIwEEVFUAGNrfZcA5V7QsD//7+pcI3CTD9Nlg9Z3duyODtFdrv/ufL89MXK8xEV1RdLZMVpgPNrVf9zVdckzQY4v9Z0WE94jjsq5h2l9f14SYuB/TaxANCSYSuBLeyjPCfZwH6vBpgBGGXs8DXNhej6fV39Ohwn9sfIWgjFhNNgKTRMcegG9rawP0eW9qwCaHDLaANABvZjYT9fWA+OUoI7EzYzOzzbrphYDiK0jW0yYAS4GNn94ZwWu1e2DXWJV9Iy/Hmt2MSWM3vqA9bAefhoiYuBkxqGJup7YE8xy4x0oIbEsAepGs/YxF5mdpZhDCWq9YFdtFUPZLORnWVgYByUoAJZj1tuJxWXbDxoswzPQRJLrRZMy1Yz1ucbqVhkCABFWmgV+E6iE0rfVUQyUBlwpRuulEQVdK0iCpgwjL8hwhtJG/5cq4hYh9ECaIbPKOYTGauYAg6xSul8v2s6Mp/0SEXEbqz6RUUsI/QxDJJQvB2nIlIxy3DYpMB+pWCd0TgZbqViluHwFHLdKNmBxqSnR4tVzDJEC9wJitli0s3zKdYqIhnMcGVaKTqOUpzbULEELJRuhZJecvBLvLGKmSU6jGXowQCeMrahYglYthYjkDSMhKXCPFcqIhkGpEHWeuzB6uZ9Kl5k4L9xlihzGK7uVlMRT4YNbeJksrYR3NANFctkMOhCvhyHpx1P2puKZTIsYLdae6lNSGRDRSTDS4dDZsNrcHMq+oBFeLdHR7EJLYR3uniLF9nP39cqxuserOxtf3iNDEPLknN5u/d43RdE8H7b7xHFd/oLmxfp5XwsD7eHCHxVkUcPHsrjeborlsJFliCN+MeDkMfHCCKZ4IW1ug6LLEUcq5cHXCVWRDANV1u+cXkWPR7Kh4I9uEWO/ClURz5J0lDxlH91NxcZrr8XfMPDWv35D6/ei1EfxtzyAAAAAElFTkSuQmCC");
            --金: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwAAAAAAAAAAAAAAAAEBAIAAAAAAAAHBgQAAADQwXkAAAAAAAAAAAC2qmrg0ILt3InPwHjn14fTxXqtoGXHuXSAd0qQhlRKRStJRCuCeUuJf0+lmmCSiFVmXzyGfU5YUjP/7ZT45pD965IAAAA/OiTw34srKBmAd0pXUTLAsm+mmmAQDwng0IJvZ0CQhlQgheySAAAAIXRSTlMADTFUcBaRBSJC/GN9h0ik2HTBh9nmw8utqzdDZ8l5upJzS2y2AAACfklEQVRIx82V63raMAxAGyBLMKUEumt3dZDvdvL+bzc5ju0YMraf01daLqdC0ZGcp6f/NJop/gV8O3Xd6WtdVX/Bm5cT7/tr3/f89K2u/4g39fmCXAzkL+d2NX177vpA0ilmvHt9u8++4LiQicdiNm1Vsi99TEipA9DxOdI/bmFk48eUAVPpxbX/td3U1ZI9Z3YAQxnjif152LcF+5pYgyiWLHhkv++2BducIktgpGRkUggS3ujfP2MRi4Kby3xpxCoDQsmRC2vCxX24ZbvAIoq/pfCds6C4Z8nxULKhBAkDHbVkYME6J8BKjgUfD/s7VguBX0uYUjBqzSmXTJnAts1ae5GhCgQbQh+uyH7ZFU3LrBEDU4CdE6nBn0s2q+DW8hGowMoj+7FkswpqBqrVMBidZHzCplUrKrSQilnwYd3MljKSCupzTimdHuOklTKiimVoF9lSRpPLddhjLgeBRcTEpYzIEuy9BPwrjdYpcSkjtZcJHAZCnKMEUyse2EJGZhWVjKlBC2AG4RUZQQXRWilsmQRp7MAFCL0iI6ggOF1M4fr4ydXCyjUZSYW/GskojthgpTR0ZTNmFZo7baRg/p80dRLwO8ytjKDiagBnUeGPlAqLxYlnjN3KSCr88mAuy4xfzDiWhYzEKjxwfCqUgaUDrMiI7Z0GfDpzHFhO41FVyJhZ3Fxsk3/gMYUTmdmFjHkrRrCj0p7FFkw1yPvNmLfCIGDm8eLjqDObZeSt8CfffJA5hVNp7jZjsRU+Y3xC7HxYLmU0Xb5LrEafZTR463kc/Dmx9Wa7O757EMddqqFu99vD7kEctvt2Zqu63ewfxgZvdEEywnX7MPwt9Ok3ReimIvZZSMQAAAAASUVORK5CYII=");
            --金_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwBAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADQwXkAAACYjVjn14ZtZT/IunRIQyovKxvJvHSNg1LYyH2/sW6il160p2jfz4FRTC//7ZT965P35o/66JEAAADw34s/OiRXUTKAd0rAsm8wLRwQDwng0IJvZ0CglFyQhlQgHhOvo2bcv9M0AAAAHnRSTlMAb1yVFSIxDAYDfFE8hv5G0cjA57KtjT6bbk/d7TyTvjkvAAAC0ElEQVRIx7WV2ZabMAxAhwQCZCGZdDJdkjrGu1n//+8qGcwWurxUc+YcP1wUWVe2397+Z6RJEv8xkiTtUU7/EjwM46TL+k7zJ/758Ou8W+f0fReFscucvOdP4oILm5E+uF+QZ/5lc45Clzj55tmKMSaLDjXlyF6Cw65j00/PKsZ0XbuMNWMVKWTbsftNzybf6cgSAJjCpZa1ZTWy9HrybPrDsxrYwjLhPsN/yx37gXnd3tKvU5ZbhhVL+KBhrauX3vYHz8aeJa4Ghb0QAr6U3d7odn+Iup69jawBlmSVbEpgiVGeDc5R3HmLuwYLIaBWw4xUSopGwhJ6ge19ZVshoAUF0VivMKrSBddLdpRBWqVsyUGawN8vehWn4BglPTvIIMo2kKq1HH7DWIbKkd0cQ896GRqK5XVTKqaEVFJqnc1VTGRI1rSCNUxZATVgixcqRhlPLpkpM1IUJIN+Gc+OKmYyCq11izJgJlqZvaiYyoDxgtSKk6op/EhOVQwN7hKTeczbO2NrNMF1VUq9zo4yYCIxGmiZ0eRVxUwG122JOctqPEETFdOTQUjJDGE1t5b7rU1VTE8GjmVFmBRl05IVFdOTAUWUMIsSiyErKryMSgpoLNe6ZlIK8NAaGKSFil4GV5aZAjoBE690DZWrVxVDg2Ee3JYahKS7g5btncioLAylkg2rOnSFHWVkjVGizmAwslUVcxnGcLzZqnUVcxlwfAAtybqKuQzYlWFiGLOFCicjH2G4qobhzRcqUAaneIv702zcMOC1Tvk2mKmApv38fFCH97x7AyjNrrfTvGWwuXB3CK53wPtnA14Jer9ut9vTcKcPbBwdD5tgf71DMRC0uH8guA82h2MUJ/MXLox2xzPiH5fH43IDzoHnI7xBSbp4DuMw6vFgj1wPwmu1QDs6DvvsEF3GMF4hh7c2xPQQEYLJb8Aex2JcQML0n57ytYS/AEf7nvqfQiIdAAAAAElFTkSuQmCC");
            --角: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAmVBMVEVHcEwCAgEEBAIAAAAAAAAAAAAHBwQBAQEAAAAAAAAAAAAAAAAAAAAAAADq2ojQwXi+sW6qnmLDtXHw4IuTiFXZyX3DtXHh0YOSiFVJRCvay37Ju3RbVDR7ckdOSS3/7ZT965L45pAAAADAsm/g0IJAOyV/dkoPDgiWi1f0447w34swLRxfWTe/sm9OSC2uomUgHhNvZ0A/OyXt0/0eAAAAH3RSTlMAkRcyB3APIkIDU2J8hsn+8Unk7cyIYLEurZp4pLtyD9BowQAAAolJREFUSMellW2TmjAUhRUQRHdhXFu1uttACEm8vPv/f1wTJMlVu9qZng8Mjs+Ewzk3ZDb7T8VxEMTxv4CHU5KcDl6o+OdguEvyPMvyc3KKnuLxbp9rUkvd7Heewv9Gx5v9dgTJqBHf7jde+IAfjldQkUz08koTjR83d4vH5wnU6qloGmYXP/vRDXzIDUgIp0JySjvjJf+tYcducotKWgEBQYfpd5Z/rnwPsTvLSsEJgaosiGW/1ssodHZ/GlZW2mhbkKZJDftjsYpCazg+2nWhabq2ElRpMOybMuHYxLApcNEP+r2A0mnhjxs2SEwM9TAm0ahrSeEaxMf7Gr1cYC0UtNBs27aspMVk4lu21Vb7sk4xu4wCVIVlOUvVZfRg2PkCsRvMEtLR8jKAY38tUMA7xNY6r6ockN9PxLoq1JIFsPEFkQcVsC0DsVwDBWX3rG/ZxLG9NlKBvFyEZXEZrgpS6Clg6sJaWprpwWUEWzuRSJ0ZtWyLWTe9TIK5TRsgrgzDeo4lvVCTzqAbo2sey0C7otabByrdsyhb9liGZVX+tf4fJC8YcTsDsVO8mSw5Y6IxTNNxzpkt474KBVABjKSyHn0oJ7dlxHvHQq9ircaJaAsl3t2WgapQxapvDtSDiqutTGaoDFVFZmOQ1k1h73PmWGMBWipSxNaE3O8iw7JKSDsEeiPbgcjnZhdN8XaiVJNL3UDQ/jHgidXp37L0kT25yAyrpxIQ+6U/U7P4pgo+eQRZ8wqxYxma3eMPKjdP6CnKYSxjFuAqMpA2M2hLO8qInY6e75WnOmDNwjl/oTO8Taznrxbv86d6X0wewmi5Wi+ear1aXjMLvchfvpCvTtzrIex50Qvp0/YPNLauEPwatNUAAAAASUVORK5CYII=");
            --角_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAmVBMVEVHcEwDAgEAAAAAAAAAAADw34sAAAAAAAAAAAAAAAADAwIAAAAAAAAAAAAAAAAAAADRwXno14bUxXpIQyqQhlTIunSill5iWzkiIBTk1YW1qGl9dEl5cEa3q2rEtXGzpmj/7ZT45pD86pIAAADAsm8/OyXg0IEoJhcPDghmXjuAd0q/sm+PhVOflFxRSy6uomV4cEZOSC1HQilDFH6KAAAAIHRSTlMAg0CUA/8yCwYVHnRPJ2VZ/MmSt9LnT7Sp7+HAPcV1X6BFvgUAAAK5SURBVEjHtZVZd9owEEaNsbyAwaYJJYSktdFq4YXk//+4jiRrcUNPnjoPHAI3c4bveqQo+o+V5Hn2TeV5olHUfltoU2R5lETJob1+U+0h3RVZlEf54drYQnRE7o/+Nr+5Nscq3hWK/dG6rzuMuSUk7u3H7fu2TGfWNQZUdr1pTbG0fdvnVWXYXyGruHp+Txx7sezPkHXjGJbdNPukWcghYPmSZVRMS7bwLMU+Bop7wZmZYb0tIQeozLOdmxGmFngO0LCZZs+OHQJ2wB/2t53X23hmvQzER3gZPiCJHlP76fUI7Eaz+UHLmOQN6vOTY0gZpuVu9PZ1vZ/ZzIgTWBfvhrphSATTgApgc93XiGNSyskBRDAmaW+17dPCsEHAKn2pJbMRUzbHoOPVrJfBPqieBEadMO6cYs3qhz3ZWJYAJ7oJMdQgwV0MRoVhvQxEahdfzxZsZvYtQz7ggTV/1xU5FQsZFI8A1+ofavvQt16FYu1mECwo7RFX0XHp2b1j/RYRLZYpD8StRaAiCrbIsASeXETw5DfIqgD2d8CyjnIdnZV8bU9ORSgDWHSnVLWUnvUqoN6WMwBWs4B9cSpCGcDWZgY8elarsH1Dlo3jJ77rH/hAWyADzTmouO7dl61YyjCHydRxIRv0QEUo465GFXTsCUGPVIQympqQ5jYqed0QqAjY4EhrblRtpRTDIxXR4pi6YwFPOsdD81BFlLx5FpZHDsI9OErFqgzZDME9YJeTEIHtAsH5jxYqILS393Pr8YELZsD2/PyyCiMDtkjL0zsKcA2i16f1eqXO/9yzebGJy/329NoaXIGtAoHcl/EmZBOA07is9qvL0dxox9OLBqsyTgFNFldnVmx2qWq+utT1RYG6ZbpT12CyvGhzRUPzuNpvt8BByxhaPiCXzcuqKv/RcnmLKxxKgwvyD+QLsCVjG8ScAAAAAElFTkSuQmCC");
            --飛: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEwHBwQEBALw34sAAAAAAAAAAAABAQEAAAADAwEAAAAAAADh0YIAAACvo2bq2ogAAAAAAACzp2jby3+QhlRUTjDFt3IAAADLvHXh0YOSiFXKu3WckVrNv3ciIBT/7ZT965MAAAD35o/66JF/dkoZFw7Asm9AOyXQwXgwLRxfWDeglFxPSS6QhlRwaEFvZ0APvSV+AAAAH3RSTlMADxf8B0OQIgNwMYD+WP3JZDtKi8ur5k5ysS67YaOcr/DzPgAAAqxJREFUSMellYtu4jAQRUscmgRMeHS3BbS7xonfefD/f7djG2wnILrSjlRVwGG4c++M8vb2n1WWeV6W/wKej9vt8ZwtgH8NLo7bpr1c2mZ7LF7i5eHUWNJW2zSnXxng5XMQOZC4cjgCfPGAnz8AjCQU0/WlbRv8+zBrXjZJS4JqJgii2ja/NGhVTOAzoA7Dsu811ZIqyZDT0jbVHuDIHpp7T8X1gEknMZeydnDzc7PKEvZ4Z5Vy/wwjuOfmxu6WxSKyHzcJZOAdGTUIIMT+ORE/qq9iEQSXdxZpSrGgHeOdkFRiz65BRGS3nlWackYEFeAYDDj4vp8TNncsuvIRK9uXGamINS6yYbjcjwaD4ZprTg2THA2GYz/cerd/YEdKqaa102BCgJfmfbcv8hiFH81IMVDkWKa1Ep1n/1TLyMYoMO/9bAZpztTN4CoaXAYWPFOOrTkimGn0yEZ7IQoigCNc16BHi3kYgR0HOzlWbi+oLenD+FoFdtvGvQXMWQX+Mid4GkY+ZQXtk1ezMHLUph8SyqE5Ci9blISRB8vAUSUY5bBC9BpYG8adzQKLejsPLBBjPUuCq0JwMQqYCEyz06eCU4MjO4BKyJiza8+6p2y4CiJhybjVMMACm2CEC2Mahd00O7/TwChVgQ1hlKfA1vQKY1kf9GidI/PLSKLA1IwSWCHg3LonYZQoxsbtzzsNnMfgcAgjTywbKeulXRrO1fQyHlk89qwGDV2nyLMrSqPw+0B94EI8GHxjzXVgTEpNk+LzKzr60ZCBzyRjcMcUWnbMwNfqNIwyieK25PN9uIdh2VM71/vA1tbgt3x+FZY1c/YzYael1eyNVq13nkXNt4XufbPVplq/v6x1dWMXxXKzq17WbrP0ni2yYrVfvqz9Cp64/iGcZcU3ZZ+2fwEWxasK7/2XgQAAAABJRU5ErkJggg==");
            --飛_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAmVBMVEVHcEwAAAADAgEAAAAAAAADAwIAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAADg0IG3qmqMglFEPycKCQbFuHLn14bPwXilmV/s3IllXjvYyX2vo2bEtXFtZT9xaUGLgVH/7ZT965P35o8AAAD66JF/dkrAsm9AOyXQwXkwLRypnWLw34sgHhMREAlwZ0BfWDeQhlRQSi49OSMmOdrKAAAAIHRSTlMAJYVhMBtUCgUSepE7bkf+5M61nufDklHztOPWdS9LPr3p3CAAAALFSURBVEjHtZXZkqJAEEVdQBYXWtvpUXsWIC1qZ/n/n5ukKKAAO/ppkgdD40Ry695Ma7X6jxWGwbcVhgaV+bcl/SgIV/j8eGbTJ5OUZV11P+QPb+0Hlk2nVcHka/Z87E7r6DVL5+zncecZ9uNLNmGWPcdbz2/ZX5YVALwioigKDYUghCqASnbsZnsw7M+8Y5kGpzilhNRl1bL5ZWM19GyaYkvzCTO9+SVuWawod/WyWqAGQZoyGdn3lyzTqlVAGwLlyO7j1jOs4OYYoVTvA1WDZcn+eFoHhnUMFkBRtAJCywqSnr2+ZBWUHLgGQkgJomff9seD37FjGAyAWA2S9YKtvYZ1g6uAk5oooBoUpxPWDKVjMApGs5AtMC9ZD/Zutl60YLNhHlgtp1F0rO/0JQ0eCzWgx42cRNEthhtG2Y4C+lCwlIlFFCaMMTiJc6gn8/C8DfZODTbVQOFO+vUFy1CqcId8ZK29QxjUzK1qMdbGm9TlPIohjIJDXQiOIyM1ahCay3kUo8GS10kitUgL1MugQ9GGO0YxZ1Ew9qqIYRudLKNA9rdlMyE4J4aVqIdWiyicMDL87PoK4HjQch4FGtGzitdSUVLhkGmBGtjABgPbh1Ggv4xWBIoEWFLqUs6icNia4lZ0ZyMaOBuicFg77QnFdROaiLYvTOwd2HEzBGUpoYyXqVB1uowC2V/2cJWq8O2VXT62jMIJQ1CqEypwFLhi4wY59q7Cv7kVIVEAtAdsGpp0EiaxtWFIhNsgOMjWuH578BLI5SQKNOLPxy1/Ii44GeYWwWeenHGJHXuR9b3d/fNmmw8tb5+X9/0G//99hw2j9WG3je9vucENmL9d3pGMt7vD2pGLjaO1h/Qxvl9RC777ejfgEUlvHQWzq7OlT4hvzo/HuQdPhgzD2T2LtG/xeDOA/oK0fNDjWBYMwq+v8Q7HWoL/AClyty8SunUtAAAAAElFTkSuQmCC");
            --玉: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAk1BMVEVHcEwCAgHw34sEBAIAAAAAAAAHBwQCAQEAAAAAAAAAAAAAAADg0IIAAAAAAAAAAACqnmLq2ogAAADWx3zFt3K/sm7h0YOQhlRJRCvv34vay358c0hbVDR7ckemmmBOSS3/7ZT86pL45pAAAACAd0o/OyUpJhhaVDTAsm/QwXkRDwng0IGhll2wpGaflFxwaEGQhlM0qWVhAAAAIHRSTlMAkf4XAwcPIkRwMFbzfIY6RcljguZkscut45orpLvWcpFwaGkAAAKdSURBVEjHpZWJcpswEIYTAcZHYxvHduukabDug8Pv/3RdXSDsDOlMdyYZJvNF/KtPK56e/rPyvCjy/F/A99eqen3PFsDPg4tThfEVY1ydylk8P52Bul7r+mrx8ykD/Cs635+RB31ZHJ332eIB379dUnDEL2/7u8VzFEAEP0Z2lHEiAo7W5QTe47Ak0gSKMyiu/OL4cwfwF2ytBFVcpEHw7806S9gTTqMS0qbsx2FZLsa4r3csTdmfK2CHwPkbjhE6ZSQE5kQbSaX9E/7zAiFGtoos4iQ2Z4wmnWWPE7aohggIFiOk8S/RzIY4bg9Jc8UkLrAyJKIu8Pawm2En9ixbDuy7Z6WslWwp1dyl1qzz7DNsRHGnwjfGetrAf/QMnm+O/bVKNjiqQEIkFlBDkReXsHcq7gpkvCzXUQawD4S60fgKYDcjWyUsFajumUuuApvKGFQo3tYSGkLiJqFiiON2PGkFinEFAbbtHAWbZzyLEhmjip4DK5mgVGjCiEb1vbhsYGlvGqIY6TXpURfOppUxiAsqKBwu2xIkQUbBb9aEdRMZURvjopWSgATbJht6S9ipisYdnFZIJVAiY2QTCTQeMsO1YKydysjPnr1B9xzGp6PwAMm1G6WpjKhCaS2oFAzuCEYlgjc0DzKKS4gr7SKM1XYXXBoarqofwwYPKoSNyoQ9yNxYliWTMWWNu8I4LKacBUp4ZJ/jFMULSrh8QHXQlVuXPGxwZOG2EwgB2zTS531kowow2vA+zvuE/Qhsqu0q4glHt1YMs+9lJCo8EnuvDaDx2V9pboLSwWzQ8Ci4GSYjsEUF9/98YWU32E0Q/rbQy8Gvm603q+3zbG1XIcOiXG4Oq9k6bMKeLbJyvVvO1m4HX1z/Ec6y8puyX9u/dfuv/n6+yksAAAAASUVORK5CYII=");
            --玉_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAllBMVEVHcEwAAAAAAAAAAAAAAAADAgEHBwQAAAAAAAAAAAAAAAAAAADi0oMAAAADAwIAAABGQSidklvUxHvPwXjo14aQhlQAAAACAQHHuHMPDgm0qGl3bkUhHxPUxXvi0oPEtXFdVzb/7ZT965P35o8AAAD66JFCPSbw34uAd0oYFg7Asm+ckVpfWDcvLBvQwXivo2ZwaEB/dkph649qAAAAIXRSTlMAUjdhFSAsCwUBlEP8boh2tk79ksvSgXzpotzBRuWwdZ5VST1CAAAC1klEQVRIx7WV226jMBBAgXBNSZqqLU0TdbvGxsY21///uR1fwIbNqk87SFGsnk5m5tg4CP5fFHme/Rh5XgTwMPxjsCTO8gCet6Y2jw23WP6A36I0ziyLTJS8Q0swuX6tm6/wKY0V+2tlKSG0XL8zx95OoWFfV5aQbpQGGeDfHPteHSLNfnvsjGqzEGTi0hZSN/ezZV+wY1vNSYlawlgrep27xpfqMVv2hCsW1pJ0lv1Q9cJ845Xlim0JGeCTw7ojpWGPC5thNwedl0N7VP26SavY5zDNNFsuzbWm3qFkhuXCtFYeT09JpvZDtsqQwDIxU8IZ7cTccT5o9upYI4OTHrqCsXZt28oell07S6PivLJGxkgpJFq0mWr0tEEFjNewnjjWDaIbNetvB8XGuWbdgJGgPZQInokQY8cpcyq2LJMUpgRTgE8CQSltnQrNFollwYJkE+EToQMZy6m1NeBPxRaaXWQwTmBcMIaRCiJQPyFfhWVZY/c6YKbsEVhrDVkVmvVkIAEhoSMJ7Kja3Krw2UG1xOkEw2vdyK5nx3oDHls5oG34KjYsWs4FeqgC3iV2wGyWzDFjp01sVDgZUs1/mkch54mqynu2UwGJU83WSFKuEc5heGKAqexUBP7JWM6dX6+nIij2rNiwDbCrio0MWzcSM1vH66nYsCVsLl20aewB++q9/tRRIqIcxPBAxU6G3pv/UKHY701z44bF92rDvmwH0fFhpsPCXiqnQrNLEbyH5nq93YzhZqNN73as3vr6FcZpK4U6+gypawAzT4VmX15L3Fh83XB10+Dy/XI+eCqAjaPw921Nbklc3i6fx/MpjGLHBnmcROHh+fcNY3sdNRhrsHo+hFHiylU24iR9Cg+n6n6FWuC3r/fP4/H8cTrADZT4aWH75IqOFH6+f305MFJkXhT7izZe8I+qWsFYX6/7axlyQ3KNQygQUu5z7vE0jaI0/Qv8A6M/u/99QSc/AAAAAElFTkSuQmCC");
            --と: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAilBMVEVHcEwAAAAAAAAAAAAAAAAAAAAJCAUAAAAAAAAAAAAAAAAAAAAGBQMAAAAAAAAAAADw34vr24izp2iTiVXm1oXLvXbZyn7fz4HHuXRPSS7Rwnl+dEnl1YW3qmo7NyK0p2h4cEXVxnx1bURmXzv/7ZT965P555H25Y8HBwROSC0pJhh1bEO9r22OhFLuIL/dAAAAJHRSTlMAcJFUA0MUCx8GMHwnZIU4+8pBy/Jyh57nrvsquF2a3L+yS3z01M69AAABmklEQVRIx93V2XaCMBCAYZGQEGQJFIrFpZsmYfH9X6+RIzAkhNrbzi3fyYHfETabfzAIUYrQM/BQpGlxwITQdY5wcRT8euXiWISYrJyOTiXjSt6Hc/Z58rHl8KzMe3jpp+d5+bWokQBy0EIEPjZxJiAcuPhOFNaPzbhBFeZnN/CJfu7rsn2JPMMim925IdZuGB2X7fvODXRL0yV74ftYWe3hKOOPy7e6ApbFUWJYMRzLZANuQijrUyPvcL2WDNizY4QAeRsJH+7NtMVoc1lD++F4IbHlvcluPTAqga3bWrb2wDBvK2V9y8fAOz0wzUdbNd1lXLkrz43AMG81+5XNwIfR1s18I8RZ37QpLyy2HHjKKxs2t3pgkLeVTdt1uT0wyKvW4T4NtLPACG5vd9ftaPeatWx6byst8JTXxHpgvGa3c5txu9UDn36xIPDyywEGJuhpC6KhdM3OA6u8j1e0OVx7nVAmVobN/hkUB64Tby0TO3Mbem7kWCZyvXCyiOAw8ayTqE/StDyUYH9l1AcGLjulxDqUor9+en8AyxSLr9VEJ5IAAAAASUVORK5CYII=");
            --と_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAilBMVEVHcEwDAwIAAAAFBAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAICAXv3opGQSnAs2/PwXjj04Pp2Ieaj1mzp2jSw3qNhFFza0PSw3rbzH+OhVOAd0q5rGubkFlxaUH/7ZT35pD86pL+7JMAAAAVEww5NSGJgFBbVTVvZ0A5zY+ZAAAAJHRSTlMAglEfETEYBgsDdWhEWyePOpz8tfeK9slO3vbPx6bLvjZm2KdLn0qIAAAB1klEQVRIx9WVW3OkIBBGR0DwfhvXRJPM7CajKOP8/7+3rUkERDSv6RfLqlOfcrqLPp1+Z/mMedZizFfQot2pghKPydSntrNWe3ET6vmS7fjNUl13iaOELMHsT2tleXsNkEt/yL44scr+22PPGus/H7FEng23nfVsbR6gRLIncsjKXnhWabxr0iBKvG32MfTDWEq2TMMIKyx7k6zopxoX9j0NM8wUVgrmt6osIfsu9YYZVVldML8Vw/DNvmp6twSLXmuFMpT+37U0MS7KHKS0YkNwMxSWVoC0ShNcDs23hmqlVxNc3UU/PKx6gZWC74N4jIuyrp70aqwUzKdnqehNdb3GtI99pehds7rgQVgm3RRc9GKZyPNa78nXBYsdvSCiUNlGfJ2tKwy9tmmf9AYrvcBettnaaIXtivjUi9kPWUOvIXhH7zzt5g/zLb2zYIC5gsNL127pBRHPbxXcwnwZIbh5q/ezY2oAlrrooy5mfAaL+pznznSfGiwjOEOh81HDv8C369c8T50gRBkmzNwuBLsRikPn2jRfYIwiF1B/YxV5FCdZhMIgcJwAIqMswdTbQD9pQhMX8BgSM1gpxELO9ITjxIVK8AT6B1vRI4RSsheppx8lHtV/NO6N/0hHjigAAAAASUVORK5CYII=");
            --杏: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAhFBMVEVHcEwKCgYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEBAIAAAAAAAAAAADw34uwpGbOv3ft3YqJgFDDtnHSw3pLRizZyX3g0ILp2YitoGWOg1KCeUvq2ojezoH/7ZT965P35o/66JEAAAAoJhelmmAPDgg/OiSEe0xVTzHg0IJxaUJbA3KaAAAAH3RSTlMADZA0cAMVBiBCVSpjfYb9SHXYxvP2qY6oxdkucrS+hu3SJQAAAbJJREFUSMfNld1ymzAQRkMA8WdbhkLsxklBrJAQvP/7VXFSENYuk9z1uz6j0XxnV3p6+k8Tx0kSx98Bb2VVlTcWWH4fDMp30duIP2Vhcfr0+Hzlou/u6QW/vqUfOEbeLtUdbO+xdC+qyxmlYyG6hfyku06IMGU+fBYu+A8Xb2EaJAjbeunESx4yjy17jO1/HbI0eLzuhWCjvAgeLhxfcfb1mBfsgU1+42x99C+cVBjb9s3p4LNLDSPIwSnCsinJWlg77LMtIiHrNeCe+xJ5pa1sDcNU8z12VTFLCaD4WnBWBJSKUUtQwyrDK9hVwaWuR6MHSoajYpJSmlGDomQsKiYD0qhhUOrrXF/GUq8CyRuLj5yUsbCNmdoWxj0ZZ0exmjesV/DKgjEA8x67qJisYDs9m2nfynBUSG15aFpShqOigYED1PRmuFsxKL2MAybD3QrujAO2Ge6k29EBCYbcDIedAbTWaiZloI8OUfBPWPSBwmXgDxQuA3+gcBn4A4XL+FBB5kFGwsVO+HHDsjCPTs9ETtHmDqzI8kNE5JBnxcrGASvCjExov8V1KJOApTth96/oL1nXhVljijVkAAAAAElFTkSuQmCC");
            --杏_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAgVBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwIEAwIAAAAAAADXyH3l1YTEtnE8NyKglFxnYDyJgFCHfU7UxHq/sW7SxHmil164rGtxaUH/7ZT965P555H25Y8AAADs24koJReDekylmV8/OiQQDwlpYTxPSS7cqUOAAAAAHnRSTlMAFDwaMCNWBQkNZnN/mEmK+snysdfDykCfboxP3KcozbU2AAAB10lEQVRIx7WV7ZqCIBBGNT/QsiK3bb/atAEBvf8L3ME2BQH3177/6jkP0ZxhJor+N4QUKyHEQNl9JSyJyxkmp7ZtAmnbU5rFBTHY5hZI057yTRbP7Psae97lqcF+rrGXKk+Tmf1YY19t9muNfamsO7zdw+zdZqPSYHslpQToJ3a/O2Rl5GUH4ABcdkHWKjBlgrMn2tQLtjBZpkAqMf21+rjdZIXBmjJqACaATiqQTQzWkkEBQcknFZo1Gs2WwaG7PQ9eqljK6LBiA/hVLGQ0HfQKuoAKu8B4Ll56oP7ymizrBg6UcVBB9llgoZRginPo2W95HXaSgR7wYI7eHp8dFYYMIYeulhPqqrBlCDW3jqvCkoHtAJz3t4AKWwarsR3qkIrlyxBGp7usLUNCsNMdVvBZsY/1jh73VTgvw3jwrorFy5jjUREaUz4VoTHlUxEaUz4VowwXblqfCl3gcbab9cKZ7itvFMVv79SgR5KeX3TJHLZI0vz7yp6Lo23Z+XW/P+JMX5YML1xmm3xbfV/xLvjbVw1Wuy3uipI4K66IsxTpXXWh9ILgg9Q7yLcOS00fNI5B8KDJkhD/8izjZMQxGkxC5AMvRhyjwYL8tZoRx/wN/t5Fx/n6B/b8g+gtGY1vAAAAAElFTkSuQmCC");
            --圭: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAgVBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHBwQAAAAAAAAhHhMAAADt3Yq0p2jVxnzayn6JgFBLRizEtnLp2YjZyn2toGXUxXt6cUeJf09mXzv/7ZT965P35o/66JEAAADw34vWxnx3b0UgHhKkmV8QDwlFQChfWDcvLBuQhlRWXRa8AAAAHHRSTlMAMwoRcJAYBUIggVUnY9lHdqTGqfHFiNntSkN8BMpE5gAAAdJJREFUSMfNlOtyqjAURsuloIC29nh6egFMdu6+/wOeHayygwntz+4ZHWZcI8m38uXh4ZdOPc1PwO55vz98VEX+HY7geMIZ94f3Nby+gMNl1vDtFeyn8fQXfk+P4wze8GHk2bbIF+gTov3dIPyJcL1kIyjC4582qxZ//HyKs6eX3Wa7YF+TbNl2RZjXIcX+a9osXHD9N8Ueka1Cdn9jFZMww6e3Zrdk5xhAM81JEHdsTiITjAFhH5dB0HglE0LwOeAyzeJ6OTipCNvlcRVc+hVwwyy/BrwJA76pGAQ7g1+uZQ4ubBPKmFUoZvEj8MkwrWIybioEon53fjGOMRWR8aUCjEfx2/QXWCO7lDGp4MK/FUAIgDNM23QRGV6F0NpvXVphpZ5WHJcxxzuAlgp6c+5TMogK/3DkGgKWyqCt4JaxKa75tAcyaCuMgd5qQ9hARtAKPL0gnU01I2iFckfnHE81g7QCf1TaCX5MNYO0old4fHFz7JxoBmnFAJI5Y4zlCRm0FUPk6ikTbB9lZxmJCyoq4/UblshIXVAxGakLKibDq1iZQEbNx9XhlK2ytmwek9OUZA1Ft2l3ZXJ2LWZ2ZfOqyzYrk3VVfj0QdV5U27UpPPofHACEtYft/zkAAAAASUVORK5CYII=");
            --圭_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAgVBMVEVHcEwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBwQAAAAAAAAAAAAGBgQAAAA5NSGYjVjfz4Hm1oXMvnbJvHSNg1LYyH2il16/sW5rZD6GfU4nJRf/7ZT35pD86pIAAADw34s3MyB3bkUfHRIQDwmckVrPwHhgWTi1qGhQSi7snTY6AAAAHXRSTlMAci1/IhhYCgUQNkBNlYtlsdT8yuiNPptPbsO7gLzntjMAAAH0SURBVEjHtZVbd6sgEEajERU1pjFpe24qDODt///AohWVi/TpzKNrL9bMt2G8XP5rpWnirTTdUNp4iyKcKDh9Nq2nmmcWIQWnz7Y+r7Z9xXmEFfvpY+vmERQhUux744Hb5nGNs4397Wf/HNlffvbtGu89fPzMqtku+MDSASYAwvudvcnZ8MXBdmQp3mlstLHJHnBbj5SBYIfIXrcgjxIHK5sAgB66vd9XqbFHGQPIXnu+a3uU9xxtrCYDxFRXExxUlPctXkPGOI82ULcKQ0Yl6HiqQpfRdlBXHRe9W4UeMCOCD2zgsxYhmKFCscDnLmk39oxVtO4EYdRUoQIWBJaRgEAlsyPQL/FqKhQr9S4wmcMdCFu1lQb7LWMUZFo67iS6mjNU7DJ6IMMcW9+tp1oqDjLoQCbZRk84davQZIwcKspVB5YKXQZljBFen6nQZcgOCDt5FRZLBRGV+1VYt13eXjK6X4XNHq+ZqcJ4GdoyM1WcrylbhWdNWSrO15St4nxNOVTIgOm8283B2oZaKmQQ2fuzOeIz2FSPNxmDHplkUVb8+/tacQXebmUgRzPYFEdZcQ/Kb1yB1+BeZJHRrjwYR2FexAu+gXGRhxFOHL9DjFb8KmsBszBCOE2dP09JL7isFUxcpIZnWegHdxwj9DOo8Lmsz1/JaYnPQ/7CvwAAAABJRU5ErkJggg==");
            --全: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAhFBMVEVHcEwAAADw34vs24kAAAAEBAIAAAAAAAAGBgMAAAAAAADRwnkAAAAAAADUxXsAAAAAAAC0p2jg0IKJgFC7rm2toGXHuXSFe0xKRStJRCvi04NmXzxYUjP/7ZT965P35o8AAAD66JEYFw7Asm8/OiR8dEgwLRyjmF+Rh1RgWTjg0IJQSi7i0ow9AAAAHXRSTlMAMv7ScBOQBiFCfflQXH9mhkekxmbZ5jutq7l5khwg8a4AAAHMSURBVEjHzdXblpsgFAbguNXBjDk6adNOq2w5qZn3f78CMQoG4lz2v/4WC/cPuNn8pyE234HXKk2ra56vcXKpgLZN01KoLrnxEZhfPilttTRpW0o/L0Vw+eKQUmpdbWM9penh+rz6HdZeLIekyH171rQOROM/S3ymQaox/btLfHtoY7b9OG6L/Ls223mWVHH7493fBEkdO0hw7c/3fdQ2EpWzcFueFtYZAzBk3iBOx6SIWIFMsM6xb3oQJDjeARXUnE26ob+ziLVUR+KoG/rLt9N4Bxws5cAZCggNeLQwYN9JKRjqzysVstJaM+BlFR0TZQ3yiwnOtQJlhrcs4z7ekt8ekxinp9hzGXMV0HHeMVRCmC+Dm7F+Gc54NdTRdoiU4VZx4yCQe8V5ZThVlHpOCiXnjvXKcGwnhN0Ffs3WK8M56U0nesSe92XktC9uBfr79cqYbkVvj8BNryt1egjcjGm8cN/qIypwM+YqSqbkvT3gUsjAzSCRx2F8h7wyYjZUxnnNOmWsWqeM6KMTKGPdTmXEH6jnZ8p7oIJ2LsPYl3HKIEBXAvO6ebLLTm8vcsqm/ebFdn/MXuS4347/DKJxsn0Z83shmwdeiaH/AJPkjgj4bBg6AAAAAElFTkSuQmCC");
            --全_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAhFBMVEVHcEwAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAwIAAAAAAAAAAADm1oU8NyJrYz6XjFfh0YLQwXjIunSCeUvJvHSxpWfYyH2/sW6il16Fe03/7ZT35o/86pIAAADw34sZFw7Asm8/OiSZj1kwLRyAd0pkXTqwpGZPSS6eKeN/AAAAHnRSTlMAfiRwEBkxBQoBVGCXPEmKyq7A0vz95z2N2ZtuT5/Pn+UrAAACFUlEQVRIx7WV2ZabMAxAw74ESEKgM2l7Yryxzf//31g2i20ozEv1Ajm5R9i6tnS5/MdIoig+iShKFErQSZDAjxWc3FFzGOgeukEs2ejevA+j+ZXmrh9J9vcx2zQvLw0DxX6iQ7hBT+c6s3/O2HJl/x6zb/RwljV8nOUFVu0t8c/YzEldP/kh6xUzGy8FHnjPCLxUrO9oPZcXWOXisrId1oOSib15uRursxMvMkjbi2gxruDXOCoVz9s1DyZWkyGfDGNTBbDRxOoy6paJvC1v1/KuKiwZX2qpfIEbTYUtg7Eed7D2HRXbAjPMCav2VFjswLmsHB13VKwyKvhsCyxtGRvJjopFBu2mvzFXz4rVlopFRocBrhnj9Gsg75pTqIWhYpFRU9zVbyoWy4W8Fg9ko2KVQTimjDD5OuBhcytMGSPFvUS7CbVUmDJaSpmGWipsGS3ldK6ErWIrjs5Hd6PCuBnTkR+0pmOo0G+GOvK9zhoq9JuxbVCmiqM2Zas4bFOWiqM2Zas4alO2Cigwgd6+3ViDiFleKPDH5x2ZOICoLjOxNb28gg3C1CtfEm8kJ8BXmWWZAz1dZy+R7+bF1XPKFwEeoQrA283xrsU8K9bEfhDmRSrwx7Oqng8BOgJMizwUAysx2CQStKtwz3FEQgW6crQl1vAEWuLAAyfBHXLBIbsbinAh4z/ABYfFiPBhBic/GOUQG+4b9+iYTNQko0gAAAAASUVORK5CYII=");
            --馬: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAmVBMVEVHcEwAAAAEBALw34sAAAAAAAAHBwQBAQEAAAAAAAAAAAAAAADQwXkAAAAAAADg0ILn14asoGQAAAAAAACTiFVOSS3ZyX3dzYDLvHXHuXO2qWl8c0jv34vs3InAsm97cke0p2giIBROSS3/7ZT965MAAAD35o/66JEQDwmAd0paUzTAsm8/OyUwLRyglV1waEGQhlQgHhOwpGbjeHBfAAAAI3RSTlMAkRf+B3APIkIDMlL/fIb/wlBeZ8yqiKJy5zwr49PFu9yccq4rSGwAAAKMSURBVEjHpZVbc9owEIWJZWwMLoakDZTLpK1YWVdf+P8/ritsSzImpDM9D/DyzWr3HK01m/2nsiyOs+xfwOP+fN4fowT552Cy37ASxTb79CmebTeMlZebSsY22wjxR3R22JEbSG9CumRkt42SCX7YnfBsR3a0xU8WH9GZL6m0VPQKkvQ4I8t0BB8Q7apdoRKcUgGmr16yPxYOemXD4RpoA/g/sPTCfqyWkWdn+45tFJW1gcqyFVG54RWyH2+LNPF137sWJEBDsF1Kc6g51Ao4NvF9vkoT13C269vNVSGB41gNAEjVgrTsN2zCs5vSmdVyrJtzwF/Z3Ib7OWJjz0reCJXzVttTio5dvwbDxYMNOA2AKUyl24o4Ix6wjebA65bnWlKhcSzHohGOPd7YqzaiMDwXOByRUDv2d8huXRQSNPpGiT2hcGHMA4Mdiyg1vLDmNTcrJuwQBVUAClOQeXczRH8j0GAXhmMFlpWgSGsr1tB4dunYwV7VXvHy5BiF0QYM6dkwjCAKLNdanzW0kgy3MgwjJiV9opKELLs8ZW0YAxvds0pgu9KH/OLD8FEIK8nB1IKHm+EN9ixGC8AFoVVrZPWIffc2XCotMLbqSoLl78IYR9ErV0IKesf2YYRbgSXBSo/YXy6MURS2bM2FGvXgw4hP4x66yrLwbOHZO3vrKxpSce5K2834hB2qCzoNYxuwQuuaTNnB4OBjZi87dAwxUEzZ2d6PVnCQNW5F3rRuN+1wH/YzNcvGUVQceolJGJbdhZYV+J0ErptiGsYsvo/igewWvXbsuX96PleZr3uWsC9FhrrRcjVfvzzVet73m6SL1dv8qd5Wi86zJEqXiy+0xBe3e4SjKP1C9rX9Cy1Ku9QzQkmTAAAAAElFTkSuQmCC");
            --馬_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAnFBMVEVHcEwAAAAAAADw34sAAAADAwEAAAAAAAAAAAAAAAADAwIAAADQwXkAAAAAAAAAAADh0YICAgEAAAAAAADOwHdKRSuQhlRxaULp2IfHuHOill4oJRff0IKvo2a5rGvi0oO6rGt+dUlxaUH/7ZT965P35o8AAAD66JEPDgiAd0rAsm8/OiQwLRyglVxvZ0BgWTgfHRKQhlRQSi6wpGZq+sdmAAAAI3RSTlMAVDf/FSAsCwUBg2H/eG6P/JlBSZC30rnI6U+q4dbhsGY2S2V2f6cAAAKqSURBVEjHtZXpcpswEIABcVu2iZ2EpnHSpkRCB7ff/9264rAkTJNfXc/AjOeb1bLfSnKc/xdJHEffRhwnCkXk20CBH8XAxj/KT/On4/YPuXihH81s8WV8lhf3FPqK/WWzWS8ZpVWTGezbwZ3YR4vldA5Wa/Y53Xn3bEO7HhcFbgbKshubL+xPotmMVuiWXSwseUrde5bTaWXUSMkLze6neh1/g7X7QB5mNokMFjFWQxHXZs2ew2hkL8bHZe3YhNpqb3Y8nAPFOpEtAwnOGoFN9uV4OM3sSoZcZf4s3zVryyj4wM20SsVx503sShy6QsqMy7W22Fk1uG6rri4Qh4mgA9IqttiKMt7Ao+UqDG3hxCaBZlFLK8nFlorEWcsotrWBiplF5VfsrGJkTRmo7ahUDeuaLRUmiyoot2K4wFQWuKvvWd3gnqp0okOCtuCPr1WYLKdX9cJtQ7GYh91UAezvpRGCsn7021WQtr1TYcnIGkYZglrogloqoGkfusENbRFMPMesynglr4p9vamwZTAK+2yQmHVqBdnbKmwW1Z2sq6yC80FirW1RYTRYnQiyY1jwnrVbKjQr2rEVkE+wrvgHOzZ4oJ0YYG57tZ3pkE2bw1axyGBUNJSBBbXCgKBv7Z2KRUbNKixQTdX2gHOyLUQ/flpus9bOgAfUAcOzoQLYD3KbykpNDOP1NBlQwqRCsxEi6vCfd9EVypVqbtQ9QNDRUKFk/HnMSLng8+IAliR7fk13p8Bkfc/N33TyJeXb08NDeoCzV7NO7Aeeu9vn74TMF1FJyDuAx3S/c71Al6ts+EF4cneHNH+BWmDtl3wEDzu4gQIzrZMksaK9Cb/g/HUBPUXGSbK+aH2FnwHfpyN4VqA/X6/2tQy5IfmIQygQUq5zrvEw9LwwvAP/Am7Uv4w9K1EjAAAAAElFTkSuQmCC");
            --龍: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAmVBMVEVHcEzw34sAAAADAwIAAAAAAAACAgEAAAAAAAAHBgQAAADQwXgAAAAAAAAAAAC5rWvp2YfFt3LZyX3dzYDu3YqSiFWQhlNJRCvj04TRwnmSiFTEtnFbVDR7ckemmmCSiFROSS3g0IL/7ZT86pL45pAAAAAPDgg/OyUfHRLg0IJfWDeJf0/Asm8wLRxwaEFQSi6flFyvo2ZGQSnmkj2mAAAAInRSTlMA/oArQnGRBiATNv5QWmZKxuaIotsuy624eFlspLvWynLzhKAKkgAAAn1JREFUSMellYtu2jAUhmsuDcEUWEk7KOu6OfHdzmXv/3A7JnbsEFom7UgoEfrk/DnfsfPw8L+VufoX8OVUFKeXPL+L5+d9dan9ee7wzx+9OwJVloSUJdwc31af4NnugHqwrxJ4dAB8kuXlUKRgwKuqOLxdL44CKBk3mHM98BWaw9rpstWwpKa0k5aqCP9aj+DdwGIGLDEp+2OzTtlzYDWjShJg28i+bxerPLLPMQPBGrsgtMGe/Vhu5pHNDlXP1ZAAKGAhsuj/q37OgB1CZHvPIs2tcVE4ErT27LfZ0zplQ4RWdAogpaATLepDXLEhLjyZMmUIF8y0PkRZzbbr1ZSFDlisFRECmsGoZx9TNqrAAt6OK9Y6Ke3ALiLrVdSc0YYp1Fplu/ZP7fNW35dTtuWNVJYYgSSjNRIMeXHLREZU0bJOCpCgmMSUmhsynqsQF0xY28G1VpSFBr/OIjuokMySWjFMlNWdIZijIGMQN6iw1BiGOPT3Mr+oX3okI0OlH11OmpowYOuLQxDjWAQyBta/WsMkobwBXcpdILubz7GMPLQB4jWUdXDD3bhpOZWxS6aX4N6AlHGLpjJG7LR6Np/sCmQQ/LTiXcq+RhmDikvbnA4OHYmVyMiOCSsb7mac6pSNMuKuCDlMR2UaOMrIipS9tIuGzdYfVb8HGdmoDdZKgpjfE+R6Z4xZAR1QNeNXrG/wuL1YaC1EgyYNvsESKZhoCTboFntKWS2oL5aw70HG82gc4GziTQ0HRDeRkcXD7PPqjzTH7st7bC/DsQWc/19XhQOLqruFApvPN8vZ45c1W/q8+XzxtF1+WdunRc8CvF7cqXWYySxf3S34Hv4FNa22gONvLsMAAAAASUVORK5CYII=");
            --龍_: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAwCAMAAAC/knOqAAAAkFBMVEVHcEzw34sAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFBQMBAAAEBAIAAAADAwEAAADfz4HQwXlEPyfDtXHPwXiQhlSlmV/l1IRiWznq2oh9dEmvo2bi0oPEtXFtZT9xaUGLgVH/7ZT86pL45pAAAAAQDwkgHhKnm2GKgVBAOyW/sm9fWDcwLRxwaEBPSS48OCPCVs3lAAAAIXRSTlMA/kUYVRApCgU1mX4gZIly/v215pLSUcq038DWsHUvSz6Za0RiAAACtklEQVRIx7XV23aiMBQGYKMgoKJJaadq5xRyToB5/7ebHQKYaLu8anrRtexX3Nl/NlmtvnGVZfF0leVIEXu60CYvyhX8XFj7ZLFLtd0U3r639Mli79l6m3v7kz21H6es2nj7yqIHKyFNPxjJJVk+a9nbvg72V2wFn5bUkb0eJ/sjtsgSqqQUKiqhZS/77BMLepBS66iEYGFvsPLUGtE7qFvGdveF5UIgirsusad1sMUlsf24NYNutMVgD8Vo0zAwt9ai+JO2OS42CaPVHPanzIBvJTTHeravSXCGm85XcSuYvfn2jjYNjirjNNSAljraYMdDed/g+zVF8YnFoU5E7mwe7GG2WA9Tu5TgA/xDHEUYjCkM7PyRGQyH2PwvisVwFwU0ArXTEZP+yPSGWkH7AToynrUWeVtMNoTRCz5+qQZrkLB2alvbLLF5GxqMDKFW6c5RIlxPOxG2GUUxNng+C4K7nkMLOgm1kyiKyIZGWPg7FrA1IrGaj3scRdRgJCTVXGAkLe0cHowa7XmJIg4D9UapznUKOTFwYfq7KMD+nmyrfJe0cIZzMU9REkU0GVxAJFJQ7WxnH6dibNpsJVdWiH/UOgimw5EtFjtPBlKOd87BHDkl5z7EUdzC8MMmkfHJ2s5oNE9QHdslDAnfDPvzx42L/jGKeDKIV5oSTSj9LIpV+kpT3I7nU+jJnveJjSfDgVVQAXmcoNH+TWyHFec6fZktdpUjuAdmrI0h1oQDCe9/lEQBjfjzemERn19OjOG3l6RlYDdVdv5AMfcQfbzsdkf//o9smR+qrD6dGxa4h6zxcH+qs+oQlQsPBrzO6np/bcKN1pwBHvd1na2BFunVmW8OW89Pxysh1930yHW1PWzysny4aBe+h7XA4l4GXgDfVsBhrSu4K3O4iL++xseHg9+GR8Z/+w++frKiweRv7AAAAABJRU5ErkJggg==");
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
            background-image: var(--盤);
            align-self: flex-end;
            padding: 2px 0;
            display: flex;
            flex-direction: column;
        }
        #後手駒台{
            width: 49px;
            height: 340px;
            background-image: var(--盤);
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
            background-image: var(--マス), var(--盤);
            position: relative;
            margin: 0 3px;
            -webkit-tap-highlight-color: transparent;
        }
        :host([data-reverse]) #将棋盤{
            background-image: var(--マス_), var(--盤);
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
            background-image: var(--青);
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }
        .緑{
            width: 43px;
            height: 48px;
            background-image: var(--緑);
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }
        .赤{
            width: 43px;
            height: 48px;
            background-image: var(--赤);
            background-repeat: no-repeat;
            position: absolute;
            z-index: 1;
        }

        [data-koma='歩']{
            background-image: var(--歩);
        }
        [data-koma='歩_']{
            background-image: var(--歩_);
        }

        [data-koma='と']{
            background-image: var(--と);
        }
        [data-koma='と_']{
            background-image: var(--と_);
        }

        [data-koma='香']{
            background-image: var(--香);
        }
        [data-koma='香_']{
            background-image: var(--香_);
        }

        [data-koma='杏']{
            background-image: var(--杏);
        }
        [data-koma='杏_']{
            background-image: var(--杏_);
        }

        [data-koma='桂']{
            background-image: var(--桂);
        }
        [data-koma='桂_']{
            background-image: var(--桂_);
        }

        [data-koma='圭']{
            background-image: var(--圭);
        }
        [data-koma='圭_']{
            background-image: var(--圭_);
        }

        [data-koma='銀']{
            background-image: var(--銀);
        }
        [data-koma='銀_']{
            background-image: var(--銀_);
        }

        [data-koma='全']{
            background-image: var(--全);
        }
        [data-koma='全_']{
            background-image: var(--全_);
        }

        [data-koma='金']{
            background-image: var(--金);
        }
        [data-koma='金_']{
            background-image: var(--金_);
        }

        [data-koma='角']{
            background-image: var(--角);
        }
        [data-koma='角_']{
            background-image: var(--角_);
        }

        [data-koma='馬']{
            background-image: var(--馬);
        }
        [data-koma='馬_']{
            background-image: var(--馬_);
        }

        [data-koma='飛']{
            background-image: var(--飛);
        }
        [data-koma='飛_']{
            background-image: var(--飛_);
        }

        [data-koma='龍']{
            background-image: var(--龍);
        }
        [data-koma='龍_']{
            background-image: var(--龍_);
        }

        [data-koma='玉']{
            background-image: var(--玉);
        }
        [data-koma='玉_']{
            background-image: var(--玉_);
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
            background-image: var(--最初に移動ボタン);
        }
        #前に移動ボタン{
            background-image: var(--前に移動ボタン);
        }
        #次に移動ボタン{
            background-image: var(--次に移動ボタン);
        }
        #最後に移動ボタン{
            background-image: var(--最後に移動ボタン);
        }
        #指し手選択{
            margin: 0 8px;
        }
        #ダイアログボタン{
            background-image: var(--ダイアログボタン);
        }
        #反転ボタン{
            background-image: var(--反転ボタン);
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
            background-image: var(--ダイアログ_閉じるボタン);
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
        }
        
        #駒音{
            display: none;
        }
        </style>
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
              <div id="ダイアログ_フッタ"><a href="https://spelunker2.wordpress.com/2018/09/20/shogitime/" target="_blank">将棋タイム Ver1.3</a></div>
            </div>
          </div>
          <audio id="駒音" src="data:audio/mpeg;base64,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9vd81dNa7u6tzoe6YVUd/KjGuqEHEtB7js/+2tpQHV2tPC9xfH94sPF6bezUrHBe0bYNPMMKyNJJYYUIDxYaky8iBdDW5HG2AgBCVV//+5JEUAACYirEsAJDIEtFaJIBq4IH2H8LgYRUQSGVYWwTCkCryqXqvWP/X+hRKXyE4v69DZrBhR1QNDg5/Wd/QIgZBV09Wdq4liV2dEp2R063N+IgaBoO/4lBiSChABWKamqzSIQfcucArIt+hqPytlKUpjGNKVjcMBCkMbVv0AhSga+JQ1rcePciVBZ578qCoKuEt2oq6r4lOwaDRGp+o9yNTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVTw8DeUXTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//uSZEMP8BIAgANAAAgCwBAAcAABAAABpAAAACAAADSAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ=="></audio>
        </div>
        `
    }
}




class 将棋タイムグラフ extends HTMLElement{

    connectedCallback(){
        this.$本体 = document.querySelector(`shogi-time[graph="${this.id}"]`)
        benry(this)
    }


    static get observedAttributes(){
        return ['width', 'height']
    }


    attributeChangedCallback(name, oldValue, newValue){
        this[name] = newValue
    }



    $グラフ_click(event){
        if(event.target.tagName === 'circle'){
            this.$本体.go(event.target.dataset.i)
        }
    }


    描画(評価値, 反転){
        const width  = this.width  || 800
        const height = this.height || 200

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

        if(評価値.length > 1){
            const 座標 = this.座標計算(評価値, width, height, 反転)

            this.$折れ線.setAttribute('points', this.折れ線計算(座標))
            this.$塗り潰し.setAttribute('d', this.塗り潰し計算(座標, height))
            this.$g.innerHTML = 座標.map((v, i) => `<circle cx="${v.x}" cy="${v.y}" data-i="${i}"></circle>`).join()
        }
    }


    更新(手数=0, 評価値='', 読み筋=''){
        const x = this.$g.children[手数].getAttribute('cx')

        this.$現在線.setAttribute('x1', x)
        this.$現在線.setAttribute('x2', x)
        this.$手数.textContent     = `${手数}手目`
        this.$評価値.textContent   = 評価値
        this.$読み筋.textContent   = 読み筋.replace(/ .*/, '').replace(/　/, '')
        this.$ヒント.style.display = 手数 ? 'block' : 'none'
    }


    座標計算(評価値, width, height, 反転){
        const 座標 = []
        const Ymax = 3000
        const step = width / (評価値.length-1)

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
        <style>
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
        }
        </style>
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
        </div>
        `
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
        const 評価値   = r.解析済み ? this.評価値(r.全指し手) : []
        const 読み筋   = r.解析済み ? this.読み筋(r.全指し手) : ['-']
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
        if(url.match(/kif$/i)){
            const buffer = await response.arrayBuffer()
            return new TextDecoder('shift-jis').decode(buffer)
        }
        else{
            return await response.text()
        }
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
        const 全数字   = {'１':'1', '２':'2', '３':'3', '４':'4', '５':'5', '６':'6', '７':'7', '８':'8', '９':'9'}
        const 漢数字   = {'一':'1', '二':'2', '三':'3', '四':'4', '五':'5', '六':'6', '七':'7', '八':'8', '九':'9'}
        const [, x, y] = 最終手.match(/([１２３４５６７８９])(.)/)

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

                v = 変換[v] || v
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
            const [, 駒, 数] = v.match(/(.)(.*)/)
            初期持駒[駒] = 漢数字[数] || 1

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
                '成り': 解析[3].endsWith('成'),
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
            if(v.startsWith('**解析 0')){
                評価値.push(v.match(/評価値 ([\+\-\d詰]+)/)[1] || '')
            }
        }
        return 評価値
    }


    static 読み筋(kif){
        const 全読み筋 = ['-']

        for(const v of kif){
            if(v.startsWith('**解析 0')){
                全読み筋.push(v.match(/読み筋 (.*)/)[1] || '')
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
                駒 = 成変換[駒] || 駒
            }

            if(局面.駒[指し手.後Y][指し手.後X]){ //駒を取る場合
                let 取得駒 = 局面.駒[指し手.後Y][指し手.後X].replace('_', '')
                取得駒 = 逆変換[取得駒] || 取得駒
                局面[`${手番}の持駒`][取得駒]++
            }
        }

        局面.駒[指し手.後Y][指し手.後X] = (手番 === '先手') ? 駒 : `${駒}_`

        return 局面
    }


    constructor(text){  // https://qiita.com/economist/items/cf52cbbcc19ad6864023
        return 棋譜.解析(text)
    }
}





function benry(self){ // https://qiita.com/economist/items/6c923c255f6b4b7bbf84
    self.$ = self.attachShadow({mode:'open'})
    self.$.innerHTML = self.html || ''

    for(const el of self.$.querySelectorAll('[id]')){
        self[`$${el.id}`] = el
    }

    for(const name of Object.getOwnPropertyNames(self.constructor.prototype)){
        if(typeof self[name] !== 'function'){
            continue
        }
        self[name] = self[name].bind(self)
        const [$id, event] = name.split(/_([^_]*?)$/)
        if($id.startsWith('$') && self[$id] && event){
            self[$id].addEventListener(event, self[name])
        }
    }
}


customElements.define('shogi-time-graph', 将棋タイムグラフ)
customElements.define('shogi-time', 将棋タイム)
