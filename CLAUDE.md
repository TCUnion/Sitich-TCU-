# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 基本設定

- **語言**：所有回應、文件、註解皆使用**繁體中文**
- **專案路徑**：`/Volumes/OWC 2T/ClaudeCode/Sitich-TCU小幫手`
- **隸屬工作區**：`/Volumes/OWC 2T/ClaudeCode`（MyObsidian vault 管理）
- **GitHub**：`https://github.com/TCUnion/Sitich-TCU-`
- **上游參考**：`https://github.com/samkhlin/stitch-STRAVATCU`（Google AI Studio 原始設計稿）

## 專案概述

**TCU CHALLENGE** — 自行車挑戰社群平台

Google Stitch 生成的前端介面，整合 Gemini AI。功能包含：
- 挑戰賽瀏覽與報名
- 個人成績追蹤（計時、爬坡、繞圈賽等）
- 車友社群與排行榜
- AI 助理（Gemini API）

## 技術棧

| 項目 | 技術 |
|------|------|
| 框架 | React 19 + TypeScript |
| 建構工具 | Vite 6 |
| 樣式 | Tailwind CSS v4 |
| 動畫 | Motion (Framer Motion) |
| AI | Google Gemini API (`@google/genai`) |
| 圖示 | lucide-react |
| 後端 | Express（輕量 proxy） |

## 環境設定

`.env.local`（已加入 .gitignore）：
```
GEMINI_API_KEY="your_key_here"
APP_URL="http://localhost:3000"
```

啟動開發伺服器：
```bash
npm install
npm run dev   # → http://localhost:3000
```

## 檔案結構

```
src/
  App.tsx              # 主元件（所有畫面邏輯 + LoginScreen）
  types.ts             # TypeScript 型別定義
  main.tsx             # 進入點
  index.css            # 全域樣式
  services/api.ts      # API 呼叫（service.criterium.tw）
  hooks/useAuth.ts     # Strava auth 狀態管理（postMessage + localStorage）
index.html
vite.config.ts
metadata.json          # 專案名稱與 Gemini 權限設定
```

## 會話規則

每次新對話開始時，依序讀取：
1. `/Volumes/OWC 2T/ClaudeCode/MyObsidian/brain/SESSION_HANDOFF.md` — 全域儀表板
2. `/Volumes/OWC 2T/ClaudeCode/MyObsidian/brain/handoffs/Sitich-TCU小幫手.md` — 本專案交接簿（若存在）

收工時更新對應的 `brain/handoffs/Sitich-TCU小幫手.md`。

## 關鍵規則

### ❌ NEVER
- 用 `find` / `grep` / `cat` / `ls` shell 指令 → 改用 Read、Glob、Grep 工具
- 在根目錄建立非必要檔案
- 建立重複/版本化的檔案（`_v2`、`enhanced_`、`new_`）→ 擴充現有檔案

### ✅ ALWAYS
- **編輯前先讀檔**
- **建檔前先搜尋**（Grep）
- 每完成一個任務後 commit
- Commit 後執行 push：`git push origin main`

## 與 TCU 生態系關係

此專案為 TCU 生態系的一部分。相關專案：
- **TCU小幫手**：`/Volumes/OWC 2T/ClaudeCode/TCU小幫手`（主平台，React + FastAPI）
- **TCULineDB**：`/Volumes/OWC 2T/ClaudeCode/TCULineDB`（會員資料庫）

## 檔案保護

**禁止刪除任何檔案**，除非明確說「請刪掉 [檔案名稱]」。
