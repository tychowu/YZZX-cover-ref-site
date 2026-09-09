#!/usr/bin/env node
/**
 * build.mjs — 从 YZZX-cover 技能的 styles/ 目录同步生成封面风格参考库网站。
 * 用法: node build.mjs
 * 依赖: macOS sips（图片转换），无需 npm 依赖。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// --- 路径配置 ---
const STYLE_DIR = '/Users/tychowu/WorkBuddy/YZZX-xhs-cover/.workbuddy/skills/YZZX-cover/references/styles';
const SITE_ROOT = __dirname;
const COVER_SRC = path.join(STYLE_DIR, 'approved-examples');
const REF_SRC   = path.join(STYLE_DIR, 'source-references');
const COVER_DST = path.join(SITE_ROOT, 'assets', 'covers');
const REF_DST   = path.join(SITE_ROOT, 'assets', 'source');

// --- 工具函数 ---
const exts = ['.jpg', '.jpeg', '.png', '.webp', '.JPG', '.PNG'];
function findCover(name) {
  for (const e of exts) {
    const p = path.join(COVER_SRC, name + e);
    if (fs.existsSync(p)) return p;
  }
  return null;
}
function naturalKey(s) {
  return s.replace(/(\d+)/g, m => m.padStart(12, '0'));
}
function convert(src, dst, maxDim, quality) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), '-Z', String(maxDim), src, '--out', dst], { stdio: 'ignore' });
    return true;
  } catch (e) {
    console.error('  ✗ sips 失败:', src, e.message);
    return false;
  }
}
function shortDesc(prompt) {
  if (!prompt) return '';
  const one = String(prompt).replace(/\s+/g, ' ').trim();
  return one.length > 24 ? one.slice(0, 24) + '…' : one;
}

// 每个风格“适合什么方向内容”的三行简介（key = 风格 id，值用 \n 分三行）。
// 放在 build 脚本里，技能仓库重新 pull 也不会覆盖。
const USE_CASES = {
  'dynamic-color-motion': '适合潮流生活、好物种草与年轻向分享\n高饱和撞色与动态构图，吸睛力强\n适合笔记打卡、情绪表达类轻松内容',
  'torn-paper-wander': '适合旅行游记、城市漫步与生活方式\n撕纸拼贴质感，营造随性探索氛围\n适合攻略合集、探店与慢生活分享',
  'casual-hand-drawn': '适合个人成长、学习笔记与日常随笔\n手绘线条松弛自然，亲近感强\n适合知识碎片、复盘与轻量教程',
  'black-yellow-sticker': '适合工具测评、效率技巧与干货分享\n黑黄高对比贴纸风，辨识度极高\n适合“本周玩了什么”类主播推荐',
  'blue-shirt-knowledge': '适合知识博主、职场经验与专业科普\n真人出镜加蓝衫，建立信任人设\n适合方法论、避坑指南与行业解读',
  'hardcore-finance': '适合财经解读、数据洞察与投资科普\n立体金属字与图表，专业硬核感强\n适合行情分析、研报拆解与财富内容',
  'cream-giant-type': '适合观点金句、情绪文案与品牌主张\n奶油底色加超大标题，醒目又温和\n适合治愈系、生活态度类短内容',
  'golden-brown-expert': '适合专家访谈、深度长文与观点输出\n金棕质感沉稳高级，权威感强\n适合行业洞察、人物专访与评论',
  'high-energy-tech': '适合科技资讯、产品发布与极客内容\n高能量光效与未来感，冲击力足\n适合发布会、数码测评与新趋势',
  'retro-little-finance': '适合理财科普、攒钱记录与财商内容\n复古暖调小画风，亲和易读\n适合记账打卡、省钱技巧与入门投教',
  'fluorescent-explainer': '适合教程讲解、步骤拆解与功能演示\n荧光强调重点，信息层级清晰\n适合软件教学、使用技巧与操作指南',
  'skill-blast': '适合技能盘点、工具合集与效率爆发\n爆炸式视觉，突出“收获感”\n适合周报、宝藏清单与能力安利',
  'dopamine-song': '适合音乐分享、歌单推荐与情绪内容\n多巴胺配色明快，愉悦感强\n适合听歌笔记、氛围歌单与治愈向',
  'fresh-doodle': '适合生活碎片、灵感记录与轻量分享\n清爽涂鸦风，干净不拥挤\n适合日常打卡、清单与小确幸',
  'yellow-white-burst-type': '适合爆款标题、强观点与种草短文\n黄白爆字冲击力强，第一眼抓人\n适合热点解读、金句与引流内容',
  'cream-bounce-type': '适合活泼教程、亲子内容与轻松科普\n奶油跳动字，灵动有节奏\n适合知识动画、趣味讲解与互动'
};

// --- 1. 读取所有风格 JSON ---
const jsonFiles = fs.readdirSync(STYLE_DIR).filter(f => f.endsWith('.json')).sort();
const styles = [];
let totalRefs = 0;

for (const jf of jsonFiles) {
  const id = jf.replace(/\.json$/, '');
  const data = JSON.parse(fs.readFileSync(path.join(STYLE_DIR, jf), 'utf8'));
  const name = data.name || id;
  const desc = shortDesc(data.prompt);

  // 封面（已确认示意图）
  const coverSrc = findCover(name);
  const coverDst = path.join(COVER_DST, id + '.jpg');
  let hasCover = false;
  if (coverSrc) hasCover = convert(coverSrc, coverDst, 1400, 82);
  if (!hasCover) console.warn('  ! 缺封面:', name, '(' + id + ')');

  // 参考图（source-references/<id>/）
  const refDir = path.join(REF_SRC, id);
  let refs = [];
  if (fs.existsSync(refDir) && fs.statSync(refDir).isDirectory()) {
    refs = fs.readdirSync(refDir)
      .filter(f => exts.includes(path.extname(f)))
      .sort((a, b) => naturalKey(a).localeCompare(naturalKey(b)));
  }
  let refCount = 0;
  refs.forEach((rf, i) => {
    const n = i + 1;
    if (convert(path.join(refDir, rf), path.join(REF_DST, id, n + '.jpg'), 1200, 80)) refCount++;
  });
  if (refCount === 0) console.warn('  ! 缺参考图:', id);
  totalRefs += refCount;

  styles.push({ id, name, desc, useCase: USE_CASES[id] || '', refs: refCount });
}

// 仅保留有封面的风格
const finalStyles = styles.filter(s => fs.existsSync(path.join(COVER_DST, s.id + '.jpg')));
finalStyles.sort((a, b) => a.id.localeCompare(b.id));

console.log(`已处理 ${finalStyles.length} 个风格，共 ${totalRefs} 张参考图`);

// --- 2. 生成 index.html ---
const stylesJSON = JSON.stringify(finalStyles);
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>言直在线 · 封面风格参考库</title>
<meta name="description" content="YZZX-cover 技能已确认的封面风格示意图与学习参考图，方便选风格时对照。" />
<style>
  :root{
    --bg:#f6f8fb; --bg-2:#eef2f7; --card:#ffffff; --ink:#14171c; --ink-2:#5b6372; --ink-3:#98a0ad; --line:#e6e9f0;
    --green:#15c96b; --teal:#13b6cf; --blue:#2f6bff; --violet:#a01fe0;
    --grad:linear-gradient(120deg,#15c96b 0%,#13b6cf 30%,#2f6bff 64%,#a01fe0 100%);
    --shadow-sm:0 1px 2px rgba(18,25,38,.06),0 4px 14px rgba(18,25,38,.06);
    --shadow-lg:0 10px 30px rgba(18,25,38,.16),0 24px 60px rgba(18,25,38,.14);
    --r:18px;
  }
  *{box-sizing:border-box} html,body{margin:0;padding:0}
  body{font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:var(--ink);
    background:radial-gradient(1000px 520px at 88% -10%,rgba(160,31,224,.12),transparent 60%),radial-gradient(900px 500px at -8% -6%,rgba(21,201,107,.13),transparent 55%),radial-gradient(700px 420px at 50% 0%,rgba(19,182,207,.08),transparent 60%),var(--bg);
    -webkit-font-smoothing:antialiased;line-height:1.5}
  a{color:inherit;text-decoration:none} .wrap{max-width:1180px;margin:0 auto;padding:0 22px}
  .gtext{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
  header{position:sticky;top:0;z-index:40;backdrop-filter:saturate(1.4) blur(12px);background:rgba(246,248,251,.78);border-bottom:1px solid var(--line)}
  .nav{display:flex;align-items:center;gap:13px;height:72px}
  .nav img.logo{height:48px;width:auto;display:block;mix-blend-mode:multiply}
  .nav .brand{line-height:1.12}
  .nav .brand b{font-size:18px;letter-spacing:.5px;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
  .nav .brand span{display:block;font-size:11.5px;color:var(--ink-3);letter-spacing:1px}
  .nav .spacer{flex:1}
  .hero{padding:56px 0 26px;text-align:left}
  .hero .eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--ink-2);background:#fff;border:1px solid var(--line);padding:6px 14px;border-radius:999px;box-shadow:var(--shadow-sm)}
  .hero .eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--grad)}
  .hero h1{font-size:clamp(30px,4.4vw,46px);line-height:1.15;margin:18px 0 10px;font-weight:900;letter-spacing:.5px}
  .hero h1 .g{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
  .hero p{max-width:680px;color:var(--ink-2);font-size:16px;margin:0 0 22px}
  .stats{display:flex;gap:12px;flex-wrap:wrap}
  .stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px 18px;box-shadow:var(--shadow-sm)}
  .stat b{font-size:22px;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent}
  .stat span{display:block;font-size:12px;color:var(--ink-3);margin-top:2px}
  .section-head{display:flex;align-items:end;justify-content:space-between;margin:30px 0 18px}
  .section-head h2{font-size:20px;margin:0;letter-spacing:.5px} .section-head small{color:var(--ink-3)}
  .grid{display:grid;gap:20px;padding-bottom:70px;grid-template-columns:repeat(auto-fill,minmax(235px,1fr))}
  .card{position:relative;border-radius:var(--r);cursor:pointer;background:var(--card);border:1px solid var(--line);box-shadow:var(--shadow-sm);transition:transform .35s cubic-bezier(.2,.7,.3,1),box-shadow .35s,border-color .35s;opacity:0;transform:translateY(18px);animation:rise .6s cubic-bezier(.2,.7,.3,1) forwards;animation-delay:calc(var(--i) * 60ms)}
  @keyframes rise{to{opacity:1;transform:translateY(0)}}
  .card::before{content:"";position:absolute;inset:-2px;border-radius:calc(var(--r) + 2px);padding:2px;background:var(--grad);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .35s;pointer-events:none;z-index:2}
  .card:hover{transform:translateY(-8px);box-shadow:var(--shadow-lg)} .card:hover::before{opacity:1}
  .thumb{position:relative;aspect-ratio:3/4;border-radius:var(--r) var(--r) 0 0;overflow:hidden;background:var(--bg-2)}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .55s cubic-bezier(.2,.7,.3,1)}
  .card:hover .thumb img{transform:scale(1.06)}
  .veil{position:absolute;inset:0;z-index:3;display:flex;align-items:flex-end;justify-content:flex-end;padding:14px;background:linear-gradient(180deg,transparent 45%,rgba(10,14,22,.78) 100%);opacity:0;transition:opacity .35s}
  .card:hover .veil{opacity:1}
  .veil .cta{color:#fff;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;gap:8px;transform:translateY(10px);transition:transform .35s}
  .veil .cta{color:#fff;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;background:linear-gradient(120deg,#15c96b,#13b6cf 55%,#2f6bff);padding:7px 13px;border-radius:999px;box-shadow:0 6px 18px rgba(19,182,207,.42);transform:translateY(10px);transition:transform .35s,box-shadow .35s}
  .card:hover .veil .cta{transform:translateY(0)}
  .meta{padding:14px 16px 16px} .meta h3{margin:0;font-size:17px;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
  .meta h3 .en{font-size:11px;color:var(--ink-3);font-weight:600;letter-spacing:.4px;background:var(--bg-2);border:1px solid var(--line);padding:2px 7px;border-radius:6px}
  .meta p{margin:7px 0 0;font-size:12.5px;line-height:1.5;color:var(--ink-2)}
  .meta p .ln{display:block}
  .meta .foot{margin-top:12px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--ink-3)}
  .meta .foot .view{color:transparent;background:var(--grad);-webkit-background-clip:text;background-clip:text;font-weight:700;opacity:0;transform:translateX(-6px);transition:.3s}
  .card:hover .meta .foot .view{opacity:1;transform:translateX(0)}
  .lb{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:24px}
  .lb.open{display:flex} .lb-backdrop{position:absolute;inset:0;background:rgba(12,16,24,.82);backdrop-filter:blur(8px);opacity:0;transition:opacity .3s}
  .lb.show .lb-backdrop{opacity:1}
  .lb-dialog{position:relative;z-index:2;width:min(1080px,96vw);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 40px 120px rgba(0,0,0,.5);transform:translateY(24px) scale(.97);opacity:0;transition:transform .35s cubic-bezier(.2,.7,.3,1),opacity .3s}
  .lb.show .lb-dialog{transform:translateY(0) scale(1);opacity:1}
  .lb-head{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:16px 20px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .lb-head .tt{display:flex;flex-direction:column} .lb-head .tt b{font-size:19px;letter-spacing:.5px} .lb-head .tt span{font-size:12px;color:var(--ink-3)}
  .lb-head .grow{flex:1} .lb-tag{font-size:11.5px;font-weight:700;color:#fff;background:var(--grad);padding:4px 10px;border-radius:999px}
  .lb-close{width:38px;height:38px;border:none;border-radius:50%;background:var(--bg-2);color:var(--ink);font-size:22px;line-height:1;cursor:pointer;transition:.25s}
  .lb-close:hover{background:var(--grad);color:#fff;transform:rotate(90deg)}
  .lb-body{padding:20px} .lb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
  .tile{position:relative;aspect-ratio:3/4;border-radius:14px;overflow:hidden;background:var(--bg-2);border:1px solid var(--line);cursor:zoom-in;opacity:0;transform:translateY(14px);animation:rise .5s cubic-bezier(.2,.7,.3,1) forwards;animation-delay:calc(var(--i) * 50ms);transition:transform .3s,box-shadow .3s}
  .tile:hover{transform:translateY(-5px);box-shadow:var(--shadow-lg)} .tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s cubic-bezier(.2,.7,.3,1)}
  .tile:hover img{transform:scale(1.05)} .tile .num{position:absolute;top:10px;left:10px;font-size:11px;font-weight:700;color:#fff;background:rgba(20,23,28,.7);padding:3px 8px;border-radius:999px}
  .lb-note{padding:16px 20px 20px;color:var(--ink-3);font-size:12.5px}
  .cover{position:fixed;inset:0;z-index:90;display:none;align-items:center;justify-content:center;flex-direction:column;padding:24px}
  .cover.open{display:flex} .cover-backdrop{position:absolute;inset:0;background:rgba(12,16,24,.86);backdrop-filter:blur(8px);opacity:0;transition:opacity .3s}
  .cover.show .cover-backdrop{opacity:1}
  .cover-dialog{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;max-height:94vh;transform:translateY(24px) scale(.97);opacity:0;transition:transform .35s cubic-bezier(.2,.7,.3,1),opacity .3s}
  .cover.show .cover-dialog{transform:translateY(0) scale(1);opacity:1}
  .cover-head{width:min(560px,92vw);display:flex;align-items:center;gap:12px;padding:0 2px 12px}
  .cover-head .tt{display:flex;flex-direction:column} .cover-head .tt b{font-size:18px;letter-spacing:.5px;color:#fff} .cover-head .tt span{font-size:12px;color:rgba(255,255,255,.7)}
  .cover-head .grow{flex:1} .cover-close{width:38px;height:38px;border:none;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:22px;line-height:1;cursor:pointer;transition:.25s}
  .cover-close:hover{background:var(--grad);transform:rotate(90deg)}
  .cover-img{max-height:62vh;width:auto;max-width:min(560px,92vw);border-radius:16px;box-shadow:0 30px 90px rgba(0,0,0,.6);display:block;cursor:zoom-in;transition:transform .4s cubic-bezier(.2,.7,.3,1)}
  .cover-img:hover{transform:scale(1.02)}
  .cover-enter{margin-top:18px;display:inline-flex;flex-direction:column;align-items:center;gap:7px;border:none;background:transparent;color:#fff;cursor:pointer;font-size:14px;font-weight:700;letter-spacing:2px;font-family:inherit}
  .cover-enter .arrow{width:44px;height:44px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 8px 26px rgba(47,107,255,.45);transition:transform .3s}
  .cover-enter:hover .arrow{transform:translateY(6px)}
  .zoom{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:rgba(10,14,22,.92);backdrop-filter:blur(8px);cursor:zoom-out;padding:24px}
  .zoom.open{display:flex;animation:zoomfade .25s ease} @keyframes zoomfade{from{opacity:0}to{opacity:1}}
  .zoom img{max-width:94vw;max-height:92vh;border-radius:14px;box-shadow:0 30px 90px rgba(0,0,0,.6);display:block}
  footer{border-top:1px solid var(--line);padding:26px 0 40px;color:var(--ink-3);font-size:13px}
  footer .wrap{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center}
  footer img{height:32px;mix-blend-mode:multiply}
  @media (max-width:560px){
    .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
    .meta{padding:10px 12px 12px}
    .meta h3{font-size:15px}
    .meta h3 .en{display:none}
    .meta p{display:none}
    .meta .foot{display:none}
    .hero{padding:40px 0 18px}
    .lb-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
  }
</style>
</head>
<body>
  <header>
    <div class="wrap nav">
      <img class="logo" src="assets/logo.png" alt="言直在线" />
      <div class="brand"><b>言直在线</b><span>封面风格参考库 · YZZX-COVER</span></div>
      <div class="spacer"></div>
    </div>
  </header>

  <main class="wrap">
    <section class="hero">
      <span class="eyebrow"><i></i>言直在线 · 已确认封面风格</span>
      <h1>先看<span class="g">效果</span>，再定风格</h1>
      <p>这里收录了 YZZX-cover 技能已经通过测试并确认的各种封面风格。点开任意封面先看大图，再点底部箭头进入该风格的学习参考图合集，方便你在生成前快速挑选方向。</p>
      <div class="stats">
        <div class="stat"><b>${finalStyles.length}</b><span>已确认风格</span></div>
        <div class="stat"><b>${totalRefs}</b><span>学习参考图</span></div>
        <div class="stat"><b>3:4</b><span>标准封面比例</span></div>
      </div>
    </section>

    <div class="section-head">
      <h2>全部风格</h2>
      <small>点开封面看大图，再进入参考图合集</small>
    </div>

    <section class="grid" id="grid"></section>
  </main>

  <footer>
    <div class="wrap">
      <img src="assets/logo.png" alt="言直在线" />
      <span>言直在线 · YZZX-cover 封面风格参考库 · 仅供内部选风格参考</span>
    </div>
  </footer>

  <div class="lb" id="lb" aria-hidden="true">
    <div class="lb-backdrop" id="lbBackdrop"></div>
    <div class="lb-dialog" role="dialog" aria-modal="true">
      <div class="lb-head">
        <div class="tt"><b id="lbName">风格名称</b><span id="lbEn">style-id</span></div>
        <span class="lb-tag" id="lbTag"></span>
        <div class="grow"></div>
        <button class="lb-close" id="lbClose" aria-label="关闭">×</button>
      </div>
      <div class="lb-body"><div class="lb-grid" id="lbGrid"></div></div>
      <div class="lb-note" id="lbNote"></div>
    </div>
  </div>

  <div class="cover" id="cover" aria-hidden="true">
    <div class="cover-backdrop" id="coverBackdrop"></div>
    <div class="cover-dialog" role="dialog" aria-modal="true">
      <div class="cover-head">
        <div class="tt"><b id="coverName">风格名称</b><span id="coverEn">style-id</span></div>
        <div class="grow"></div>
        <button class="cover-close" id="coverClose" aria-label="关闭">×</button>
      </div>
      <img class="cover-img" id="coverImg" src="" alt="" />
      <button class="cover-enter" id="coverEnter">
        <span>点开看参考</span>
        <span class="arrow">↓</span>
      </button>
    </div>
  </div>

  <div class="zoom" id="zoom"><img id="zoomImg" src="" alt="" /></div>

<script>
  const STYLES = ${stylesJSON};
  const grid = document.getElementById('grid');
  STYLES.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'card'; card.style.setProperty('--i', i);
    const descHtml = (s.useCase || s.desc).split('\\n').map(function(l){ return '<span class="ln">' + l + '</span>'; }).join('');
    card.innerHTML =
      '<div class="thumb">' +
        '<img loading="lazy" src="assets/covers/' + s.id + '.jpg" alt="' + s.name + ' 封面" />' +
        '<div class="veil"><span class="cta">查看封面大图</span></div>' +
      '</div>' +
      '<div class="meta">' +
        '<h3>' + s.name + ' <span class="en">' + s.id + '</span></h3>' +
        '<p>' + descHtml + '</p>' +
      '</div>';
    card.addEventListener('click', () => openCover(s));
    grid.appendChild(card);
  });

  const lb = document.getElementById('lb'), lbName = document.getElementById('lbName'),
        lbEn = document.getElementById('lbEn'), lbTag = document.getElementById('lbTag'),
        lbGrid = document.getElementById('lbGrid'), lbNote = document.getElementById('lbNote');
  function openLightbox(s){
    lbName.textContent = s.name; lbEn.textContent = s.id; lbTag.textContent = s.refs + ' 张参考图';
    lbNote.textContent = '以上为「' + s.name + '」的学习参考图，点击任意一张可放大查看。';
    lbGrid.innerHTML = '';
    for (let n = 1; n <= s.refs; n++){
      const src = 'assets/source/' + s.id + '/' + n + '.jpg';
      const t = document.createElement('div'); t.className = 'tile'; t.style.setProperty('--i', n - 1);
      t.innerHTML = '<img loading="lazy" src="' + src + '" alt="' + s.name + ' 参考图 ' + n + '" />' + '<span class="num">参考 ' + n + '</span>';
      t.addEventListener('click', () => openZoom(src, s.name + ' 参考图 ' + n));
      lbGrid.appendChild(t);
    }
    lb.classList.add('open'); requestAnimationFrame(() => lb.classList.add('show'));
    lb.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';
  }
  function closeLightbox(){ lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); setTimeout(() => lb.classList.remove('open'), 280); if (!cover.classList.contains('open')) document.body.style.overflow = ''; }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbBackdrop').addEventListener('click', closeLightbox);

  const cover = document.getElementById('cover'),
        coverName = document.getElementById('coverName'),
        coverEn = document.getElementById('coverEn'),
        coverImg = document.getElementById('coverImg');
  let coverStyle = null;
  function openCover(s){
    coverStyle = s;
    coverName.textContent = s.name; coverEn.textContent = s.id;
    coverImg.src = 'assets/covers/' + s.id + '.jpg'; coverImg.alt = s.name + ' 封面';
    cover.classList.add('open'); requestAnimationFrame(() => cover.classList.add('show'));
    cover.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden';
  }
  function closeCover(){
    cover.classList.remove('show'); cover.setAttribute('aria-hidden','true');
    setTimeout(() => cover.classList.remove('open'), 280);
    if (!lb.classList.contains('open')) document.body.style.overflow = '';
  }
  document.getElementById('coverClose').addEventListener('click', closeCover);
  document.getElementById('coverBackdrop').addEventListener('click', closeCover);
  document.getElementById('coverEnter').addEventListener('click', () => { if (coverStyle) openLightbox(coverStyle); });
  coverImg.addEventListener('click', () => openZoom(coverImg.src, coverName.textContent + ' 封面'));

  const zoom = document.getElementById('zoom'), zoomImg = document.getElementById('zoomImg');
  function openZoom(src, alt){ zoomImg.src = src; zoomImg.alt = alt; zoom.classList.add('open'); }
  function closeZoom(){ zoom.classList.remove('open'); }
  zoom.addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ if (zoom.classList.contains('open')) closeZoom(); else if (lb.classList.contains('open')) closeLightbox(); else if (cover.classList.contains('open')) closeCover(); }
  });
</script>
</body>
</html>`;

fs.writeFileSync(path.join(SITE_ROOT, 'index.html'), html, 'utf8');
console.log('已生成 index.html（' + finalStyles.length + ' 风格 / ' + totalRefs + ' 参考图）');
