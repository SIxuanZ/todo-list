# 在新项目里开始用 Git：照着一页纸做

## 先回答最关键的问题：推送会不会自动建仓库？

**不会。** 实测（本机真实输出）：

```
$ git push https://github.com/SIxuanZ/this-repo-does-not-exist-xyz.git main
remote: Repository not found.
fatal: repository 'https://github.com/SIxuanZ/this-repo-does-not-exist-xyz.git/' not found
```

`git push` 只是往**一个已经存在的地址**塞东西。GitHub 没法替你决定仓库叫什么、公开还是私有、算谁的，所以必须先建。

| 平台 | 要手动建仓库吗 |
|---|---|
| GitHub | 要 |
| GitLab | 要 |
| Gitea / 自建 | 视插件而定，默认也要 |

---

## 一条龙：新项目 7 步

### 第 0 步 前置检查（只做一次）

```bash
git --version                 # 没装就 winget install Git.Git
git config --global user.name  "你的名字"
git config --global user.email "你的邮箱"
```

> 这台测试机上全局配置落在 `C:\Users\<你>\.gitconfig`，沙箱写不进去，所以我当时用的是 `git config --local`（只对当前仓库生效）。你自己的电脑用 `--global` 就行，一次配好，所有项目通用。
>
> 公司要求用真名邮箱时，反过来：全局配个人身份，进公司项目后用 `--local` 覆盖成工作邮箱。

### 第 1 步 初始化仓库

```bash
cd D:\work\my-project
git init
git branch -M main            # 老版本 git 默认叫 master，统一成 main
```

### 第 2 步 先写 `.gitignore`（这一步最重要，别跳过）

```gitignore
# 依赖
node_modules/
vendor/
.venv/
__pycache__/

# 构建产物
dist/
build/
out/

# 密钥与本地配置 —— 绝不能进仓库
.env
.env.*
*.pem
*.key
*.p12
secrets/

# 日志与系统杂项
*.log
.DS_Store
Thumbs.db
desktop.ini

# 编辑器
.vscode/
.idea/
```

**为什么放在第一步**：`.env` 里通常有数据库密码、API token。一旦提交并推送，它**永久留在 git 历史里**——删掉文件不等于删掉历史，别人 `git log -p` 还能翻出来。事后补救要么改密码，要么重写历史（麻烦且危险）。所以第一件事就是把门关好。

### 第 3 步 第一次提交

```bash
git status                    # 看清楚将要提交什么
git add -A
git status                    # 再确认一遍：没有 node_modules、没有 .env
git commit -m "初版：项目骨架"
```

`git add -A` 后**务必再看一次 `git status`**。这是唯一能拦住"误提交密钥"的机会。

### 第 4 步 在 GitHub 上建空仓库（三选一）

**a. 网页建（最稳，推荐新手）**

1. 打开 https://github.com/new
2. Repository name 填项目名，比如 `my-project`
3. 选 **Private**（除非你确实要开源）
4. **下面三个勾全都不要勾**：Add a README file / Add .gitignore / Choose a license
5. 点 Create repository

为什么强调别勾：勾了就有"远端已有提交"，你本地首次推送会被拒：

```
! [rejected] main -> main (fetch first)
```

那时候还得 `git pull --rebase` 再推，对新手是多余的坑。**空仓库 = 零摩擦。**

**b. 用 `gh` 命令行**

```bash
gh repo create my-project --private --source=. --remote=origin --push
```

一条命令建库 + 配远端 + 推送（需先 `winget install GitHub.cli` 并 `gh auth login`）。

**c. 让我用 API 建**

把项目路径和想要的仓库名告诉我，我有你授权的 token 时可以一条命令建好（`todo-list` 就是这么建的：`POST /user/repos` 返回 201）。

### 第 5 步 接上远端

```bash
git remote add origin https://github.com/你的用户名/my-project.git
git remote -v                 # 确认 URL 没写错
```

### 第 6 步 首次推送

```bash
git push -u origin main
```

`-u` 的作用：把本地 main 和远端 origin/main 绑定。**以后直接 `git push` 就行**，不用再写后面那串。

### 第 7 步 日常循环（90% 的时间只有这四条）

```bash
git status                        # 我在哪、改了什么
git add -A                        # 全部暂存
git commit -m "说清楚改了什么"      # 存档
git push                          # 上传
```

或者干脆在 `dsh-ide-git` 面板里点：**看变更 → 勾选暂存 → 写信息 → 提交 → 推送**。

---

## 出问题怎么办：报错对照表

| 报错 | 意思 | 解法 |
|---|---|---|
| `Repository not found` | 仓库不存在 / 名字拼错 / token 没权限 | 先建仓库；核对 URL 和账号 |
| `! [rejected] main -> main (fetch first)` | 远端有你没有的提交（通常是建库时勾了 README） | `git pull --rebase origin main` 然后 `git push` |
| `Authentication failed` | token 过期 / 权限不够 | 重新授权；细粒度 token 要勾 Contents: Read and write |
| `src refspec main does not match any` | 本地还没有任何提交 | 先 `git add` + `git commit` |
| `File ... is 123 MB; exceeds GitHub's limit` | 单文件超 100 MB | 用 Git LFS，或别提交它 |
| `fatal: not a git repository` | 当前目录不是仓库 | `cd` 到项目目录，或先 `git init` |
| `error: failed to push some refs` | 见第二行具体原因 | 通常是上面的 rejected |

---

## 到新公司 / 新电脑，额外注意三件事

1. **身份先配置好**：`git config --global user.name / user.email`。没配的话第一次提交会用机器名，历史会很难看。
2. **网络**：公司内网常常访问不了 github.com。要么走公司代理（`git config --global http.proxy http://proxy:port`），要么公司有内网 GitLab——**命令完全一样，只把 URL 换掉**，这套 7 步全部适用。
3. **合规**：公司代码别推个人公开仓库。能用公司自己的仓库就用公司的；私有的个人仓库也要先看公司规定。这条比技术重要。

---

## 一页速查

```bash
# 新项目
git init && git branch -M main
# 写 .gitignore（先！）
git add -A && git status          # 确认没混进密钥
git commit -m "初版"

# 建库（网页/gh/API 三选一），然后
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main

# 之后每次
git status && git add -A && git commit -m "..." && git push
```
