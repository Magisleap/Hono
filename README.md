## Hono + Cloudflare Workers

Cloudflare Workersで動作するHonoを利用した軽量Web APIフレームワークのテンプレートレポジトリです.

### 技術スタック

- DevContainer
- [Node.js](https://github.com/nodejs/node)
- [Bun](https://github.com/oven-sh/bun)
- [Hono](https://hono.dev/)
- [Cloudflare Workers](https://github.com/cloudflare/workers-sdk)
- [commitlint](https://github.com/conventional-changelog/commitlint)
- [husky](https://github.com/typicode/husky)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [PR Agent](https://github.com/Codium-ai/pr-agent)
- [zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- GitHub Actions

#### 備考

- DevContainerを利用したホストマシンから分断したクリーンな開発環境
- 高速かつ軽量なNode.jsランタイムであるBunの採用
- husky+commitlintdでコミットメッセージのルールの厳格化
- lint-stagedでプッシュ前にコードフォーマットの実行
- マージ済みブランチの自動削除に対応
- GPG Keyを利用して署名付きコミットに対応
- GPG Keyによる署名の有効化
- プッシュと同時にブランチを作成する`puah.autoSetupRemote`を有効化
- [act](https://github.com/nektos/act)を利用してローカルでGitHub Actionsのテスト実行に対応
- GitHub ActionsでCI/CDを実行
- PR AgentでChatGPTを利用した自動コードレビュー
- zodを利用したより型安全な設計
- モジュールインポート時に`@`を利用して相対パスに対応
- リリースバージョンのバリデーション実行

## 構築

```zsh
git clone https://github.com/Magisleap/Hono
cd Hono
```

VSCodeから`cmd/ctrl + Shift + p`でコマンドパレットを開き, DevContainerで立ち上げます.

> DevContainerの実行にはExtensionのインストールとDocker Desktopのインストールが必要になります

### 開発

```zsh
bun dev
```

で開発用サーバーが立ち上がります.

ローカルサーバーの場合にはKV, R2のデータもローカルしか参照できません. `l`を入力するとローカルモードとリモートモードが切り替わります. リモートモードの場合, 本番環境にアクセスすることを避けるために`_preview`のようなサフィックスをつけたステージング用のネームスペースを用意してください.

DevContainer環境で開発する場合, `bun wrangler login`が正常にリダイレクトされないため`CLOUDFLARE_API_TOKEN`を`.env`に書き込んでください.

トークンの発行方法については[公式ドキュメント](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)を読んでください

```zsh
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
```

> `CLOUDFLARE_ACCOUNT_ID`はおそらく不要です

### デプロイ

```zsh
bun run deploy
```

### GitHub

PR Agentを利用する場合, レポジトリシークレットに`OPENAI_KEY`を追加してください.

[テンプレートファイル](https://pr-agent-docs.codium.ai/usage-guide/configuration_options/)については`.pr_agent.toml`に書き込まれているので適時変更してください. デフォルトでは日本語でコメントされるようになっています.

### FAQ

- wranglerのバージョンを`3.18.0`以降に上げるとサーバーが立ち上がらなくなることがあります
- Node.jsのバージョンを`20.17.0`以降に上げるとcommitlintが正しく動作しなくなります
- Node.jsをインストールしないとcommitlintを含む一部の機能が動作しません
- プッシュ時にリモートブランチ作成のオプションはgitのバージョンが`2.37.0`以降である必要があります
