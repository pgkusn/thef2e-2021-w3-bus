# CLAUDE.md

此文件為 Claude Code (claude.ai/code) 在此儲存庫中工作時提供指導。

## 專案概述

w3-bus 是一個 Vue 3 + TypeScript 全台即時公車動態查詢系統，與交通部 TDX API 整合，提供路線查詢、站點查訊及到站時間預估功能。整合 Leaflet 地圖套件供使用者查看位置和公車路線。

### 核心技術棧
- **框架**: Vue 3 + TypeScript
- **建置工具**: Vite
- **樣式**: UnoCSS (Tailwind 相容)
- **狀態管理**: Pinia
- **地圖**: Leaflet
- **測試**: Vitest v4.0.16 + @vue/test-utils
- **HTTP 客戶端**: Axios (帶攔截器)

---

## 常用命令

### 開發與構建

```bash
# 啟動開發服務器
npm run dev

# 生產模式預覽
npm run prod

# 類型檢查
npm run type-check

# 構建（含類型檢查）
npm run build

# 構建僅
npm run build-only

# 預覽構建結果
npm run preview
```

### 測試

```bash
# 執行所有單元測試
npm run test:unit

# 執行特定測試文件
npm run test:unit src/utils/formatTime.test.ts

# 監視模式執行測試
npm run test:unit -- --watch

# 顯示測試 UI 儀表板
npm run vitest:ui

# 生成覆蓋率報告
npm run test:unit -- --coverage
```

---

## 高層架構

### 目錄結構

```
src/
├── components/          # Vue 組件
│   └── TheMap.vue      # Leaflet 地圖組件
├── views/              # 頁面組件
│   └── HomeView.vue    # 主頁（路由入口）
├── stores/             # Pinia 狀態存儲
│   └── main.ts         # 主要狀態（API 呼叫、令牌管理）
├── router/             # Vue Router 配置
│   └── index.ts        # 路由定義（雜湊歷史模式）
├── utils/              # 工具函數
│   ├── formatTime.ts   # 時間格式化（預估到站時間）
│   └── formatTime.test.ts
├── types.ts            # TypeScript 介面定義
├── App.vue             # 根組件
└── main.ts             # 應用入口
```

### 資料流架構

1. **Vue Component** → 呼叫 Pinia Store 方法
2. **Pinia Store (main.ts)** → Axios 實例發送 HTTP 請求
3. **Axios Interceptor** → 自動附加授權令牌、處理 429 速率限制
4. **API 回應** → 映射到 `src/types.ts` 中的介面類型
5. **State** → Vue 組件反應式更新

### API 集成

- **基礎 URL**: 環境變數 `VITE_API_URL`（TDX 基礎 API）
- **令牌 API**: 環境變數 `VITE_TOKEN_API_URL`（獲取訪問令牌）
- **城市列表**: Firebase 靜態資源 (hardcoded URL)
- **速率限制**: 429 狀態碼時顯示防抖警告

Pinia Store (`src/stores/main.ts`) 提供以下主要方法：
- `getToken()` - 獲取 API 存取令牌
- `getCityList()` - 取得縣市清單
- `getRouteList(city)` - 取得指定縣市的公車路線
- `getEstimatedTimeOfArrival(params)` - 取得預估到站時間
- `getStopOfRoute(params)` - 取得路線站序
- `getShapeOfRoute(params)` - 取得線型（地圖繪製）

---

## TypeScript 配置

### 路徑別名

```typescript
// @ 指向 src 目錄
import { useMainStore } from '@/stores/main'
import * as Types from '@/types'
```

### 自動匯入

Vite 配置中啟用 unplugin-auto-import，以下內容自動可用：
- Vue 核心（ref, computed, watch 等）
- Vue Router（useRouter, useRoute 等）
- Pinia（defineStore）

無需手動 import 這些標準 API。

### 已知 TypeScript 診斷

**dayjs esModuleInterop 警告** (`formatTime.test.ts:3`)
- dayjs 預期在啟用 esModuleInterop 時使用預設匯入
- 此為低級別警告，不影響功能
- 若要消除，可在 `tsconfig.app.json` 中添加 `"esModuleInterop": true`

---

## 測試指南

### 測試檔案位置

- 單元測試與源檔案同目錄：`src/**/*.test.ts`
- Vitest 自動探索模式：`**/*.{test,spec}.?(c|m)[jt]s?(x)`

### 編寫測試

範例：`src/utils/formatTime.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { formatTime } from './formatTime'

describe('formatTime', () => {
  it('應該正確格式化時間', () => {
    const result = formatTime(300)
    expect(result).toContain('約 5 分')
  })
})
```

### 測試環境設定

- **環境**: jsdom（DOM 模擬）
- **配置檔**: `vitest.config.ts`（合併 vite.config.ts）
- **TypeScript**: 由 `tsconfig.vitest.json` 管理

---

## 環境變數

### 開發環境 (`.env.development`)

應設定以下變數供本地開發：

```
VITE_API_URL=      # TDX API 基礎 URL
VITE_TOKEN_API_URL= # 令牌 API URL
```

### 生產環境 (`.env.production`)

生產構建使用 `base: '/thef2e-2021-w3-bus/'` 作為 GitHub Pages 子路徑。

---

## 關鍵實現細節

### 路由

- 使用雜湊歷史模式（`#`）以支援靜態部署
- 路由路徑: `/:city?/:routeName?` - 城市和路線名稱可選
- 路由 props 驅動：組件透過 props 接收路由參數

### 狀態管理 (Pinia)

- 單一根 store（`main`）管理所有 API 狀態
- 使用 `useLocalStorage` 從 @vueuse/core 持久化令牌
- 防抖錯誤警告防止頻繁的 429 錯誤通知

### UI 框架

- UnoCSS：原子化 CSS，Tailwind 語法相容
- @unocss/reset：TailwindCSS 相容重置
- Sweetalert2：用於錯誤和提示對話框

---

## 常見開發任務

### 添加新的實用函數

1. 在 `src/utils/` 中創建檔案
2. 編寫函數並匯出
3. 在 `src/utils/functionName.test.ts` 中編寫測試（與源檔案同目錄）
4. 運行 `npm run test:unit` 驗證

### 添加新的 Store 方法

1. 在 `src/stores/main.ts` 中添加方法到 Pinia store
2. 更新 `src/types.ts` 中的 TypeScript 介面定義
3. 在組件中透過 `const store = useMainStore()` 呼叫

### 添加新路由

1. 在 `src/views/` 中創建新的 Vue 組件
2. 在 `src/router/index.ts` 中添加路由定義
3. 使用 `useRouter` 和 `useRoute` composables 進行導航

---

## 部署

### GitHub Pages

構建輸出位於 `dist/` 目錄，自動透過 GitHub Actions 部署至 `/thef2e-2021-w3-bus/` 路徑。

確保環境變數在 CI/CD 工作流中正確配置。

---

## 相關資源

- [設計稿](https://reurl.cc/Z9YeaW)
- [交通部 TDX API](https://tdx.transportdata.tw/)
- [Vue 3 文檔](https://vuejs.org/)
- [Vite 文檔](https://vitejs.dev/)
- [Pinia 文檔](https://pinia.vuejs.org/)
