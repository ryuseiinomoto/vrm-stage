# STAGE / avatar viewer

アニメ調の 3D アバターを眺めるページです。ブラウザだけで動き、ビルドすると 1 つの HTML ファイルになります。

![動いている様子](docs/demo.gif)

- 実物を開く: https://ryuseiinomoto.github.io/vrm-stage/
- 壁紙版（操作パネルなし）: https://ryuseiinomoto.github.io/vrm-stage/wall.html

## できること

- ドラッグで回転、ホイールで拡大
- テーマ、カメラ、ポーズ、表情、顔つき、鼻の高さの切り替え
- 髪、目、服、くつの色替えと、トップスの柄
- パーカー、厚底ハイカット、眼帯、ねこ耳、ヘッドセットなどの小物
- 背景（荒廃都市、地下ドームなど）、ライト、空中の粒、立つ場所（鉄骨、ステージ台）
- くつから出る虹色の煙、浮遊ポーズ
- 正方形の画像保存
- 別の `.vrm` ファイルを画面にドロップして差し替え

## Mac の動く壁紙にする

壁紙版のページは、操作パネルや文字を消して、カメラがゆっくり動くだけの画面です。描画は毎秒 30 コマに抑えています。

1. Web ページを壁紙にできるアプリ（例: [Plash](https://sindresorhus.com/plash)）を入れる
2. 壁紙版の URL を登録する

## 構成

| 場所 | 内容 |
|---|---|
| `stage-live/main.js` | ページ本体。舞台、操作パネル、ポーズ、色替え |
| `stage-live/outfit.js` | パーカーとくつ。図形から組み立てて骨に追従させる |
| `stage-live/ruins.js` | 荒廃都市の近景（高架道路、鉄塔、クレーン、看板、火と煙） |
| `stage-live/nearcity.js` | 鉄骨と、その両端の作り込んだビル 2 棟 |
| `model/girl.glb` | 同梱のアバター（下記クレジット参照） |
| `stage-wall/` | 壁紙版の入口 |
| `tools/snap.mjs` | 正方形の画像を書き出す |
| `tools/record.mjs` と `tools/gif.swift` | コマ送りで録画して GIF にまとめる |
| `docs/` | 公開しているページ（通常版、壁紙版）と GIF |
| `releases/v1.0/` | バージョン 1.0 の完成ページとソース |

## ビルド

```
npm install
node ~/.claude/skills/teardown/sims/build.mjs ./stage-live ./stage-wall
```

出力は `teardown-out/dist/` の `stage-live.html` と `stage-wall.html` です。ビルドには [elvarofficial/teardown](https://github.com/elvarofficial/teardown)（MIT）のビルドスクリプトを使っています。

## クレジット

- アバター: `VRM1_Constraint_Twist_Sample` (c) 2022 pixiv Inc.、[VRM Public License 1.0](https://vrm.dev/licenses/1.0/)。配布元は [vrm-c/vrm-specification](https://github.com/vrm-c/vrm-specification/tree/master/samples/VRM1_Constraint_Twist_Sample)。髪や目の色、鼻の形などはこのページの中で加工して表示しています。
- [@pixiv/three-vrm](https://github.com/pixiv/three-vrm)（MIT）、[three.js](https://threejs.org/)（MIT）
- 衣装、小物、背景は、特定のブランドや作品の意匠を写したものではなく、このプロジェクトで作ったものです。
