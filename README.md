# 言直在线 · 封面风格参考库

> YZZX-cover 技能已确认封面风格的可视化参考网站。
> 用途：在生成封面前，先来这里查看各风格的「已确认示意图」，并点开查看对应的学习参考图，方便快速挑选方向。

## 在线预览

直接打开 `index.html`，或用任意静态服务器启动，例如：

```bash
cd YZZX-cover-ref-site
python3 -m http.server 8017
# 浏览器打开 http://localhost:8017
```

## 站点结构

```
YZZX-cover-ref-site/
├── index.html              # 单页站点（网格 + 灯箱，含悬停动效）
├── assets/
│   ├── logo.png            # 言直在线 logo（绿→青→蓝→紫渐变；multiply 消隐白底）
│   ├── covers/<id>.jpg     # 每个风格的「已确认示意图」（默认展示，共 12 张）
│   └── source/<id>/N.jpg   # 每个风格的学习参考图（点开封面后在灯箱显示，共 55 张）
└── README.md
```

## 数据来源

风格定义与图片均来自本机技能：`YZZX-cover` 的 `references/styles/`：

- `approved-examples/<风格中文名>.png` → 站点默认展示的「已确认示意图」
- `source-references/<style-id>/*` → 点开封面后在灯箱中展示的「学习参考图」

## 收录风格（12 个）

潮色动势 · 撕纸漫游 · 随性手绘 · 黑黄贴纸 · 蓝衫知识 · 硬核财经 ·
奶油巨字 · 金棕解读 · 高能科技 · 复古小财 · 荧光讲解 · 暗域科技

## 维护

- 新增/更新风格时，重新从技能 `references/styles/` 同步图片到 `assets/`，并在 `index.html` 的 `STYLES` 数组里登记 `id / name / desc / refs`。
- logo 为白底图转的 `assets/logo.png`，靠 CSS `mix-blend-mode:multiply` 在浅色页面上消隐白底；若以后换深色背景，需改用真透明 PNG。站点主色已按 logo 改为绿→青→蓝→紫渐变。
