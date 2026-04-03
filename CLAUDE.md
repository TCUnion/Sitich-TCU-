# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 基本設定

- **語言**：所有回應、文件、註解皆使用**繁體中文**
- **專案路徑**：`/Volumes/OWC 2T/ClaudeCode/Sitich-TCU小幫手`
- **隸屬工作區**：`/Volumes/OWC 2T/ClaudeCode`（MyObsidian vault 管理）

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
