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

  styles.push({ id, name, desc, refs: refCount });
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
  .pill{font-size:12.5px;color:var(--ink-2);border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;display:inline-flex;align-items:center;gap:7px}
  .pill i{width:7px;height:7px;border-radius:50%;background:var(--grad)}
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
  .count{position:absolute;top:12px;right:12px;z-index:3;font-size:12px;font-weight:700;color:#fff;background:rgba(20,23,28,.72);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(6px);padding:5px 10px;border-radius:999px}
  .veil{position:absolute;inset:0;z-index:3;display:flex;align-items:flex-end;padding:14px;background:linear-gradient(180deg,transparent 45%,rgba(10,14,22,.78) 100%);opacity:0;transition:opacity .35s}
  .card:hover .veil{opacity:1}
  .veil .cta{color:#fff;font-size:13.5px;font-weight:700;display:inline-flex;align-items:center;gap:8px;transform:translateY(10px);transition:transform .35s}
  .card:hover .veil .cta{transform:translateY(0)} .veil .cta .dot{width:8px;height:8px;border-radius:50%;background:var(--grad)}
  .meta{padding:14px 16px 16px} .meta h3{margin:0;font-size:17px;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
  .meta h3 .en{font-size:11px;color:var(--ink-3);font-weight:600;letter-spacing:.4px;background:var(--bg-2);border:1px solid var(--line);padding:2px 7px;border-radius:6px}
  .meta p{margin:6px 0 0;font-size:13px;color:var(--ink-2)}
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
  .zoom{position:fixed;inset:0;z-index:200;display:none;align-items:center;justify-content:center;background:rgba(10,14,22,.92);backdrop-filter:blur(8px);cursor:zoom-out;padding:24px}
  .zoom.open{display:flex;animation:zoomfade .25s ease} @keyframes zoomfade{from{opacity:0}to{opacity:1}}
  .zoom img{max-width:94vw;max-height:92vh;border-radius:14px;box-shadow:0 30px 90px rgba(0,0,0,.6);display:block}
  footer{border-top:1px solid var(--line);padding:26px 0 40px;color:var(--ink-3);font-size:13px}
  footer .wrap{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;align-items:center}
  footer img{height:32px;mix-blend-mode:multiply}
  @media (max-width:560px){.grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}.meta h3{font-size:15px}.hero{padding:40px 0 18px}.lb-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}}
</style>
</head>
<body>
  <header>
    <div class="wrap nav">
      <img class="logo" src="assets/logo.png" alt="言直在线" />
      <div class="brand"><b>言直在线</b><span>封面风格参考库 · YZZX-COVER</span></div>
      <div class="spacer"></div>
      <span class="pill"><i></i>选风格前先来这里对照参考</span>
    </div>
  </header>

  <main class="wrap">
    <section class="hero">
      <span class="eyebrow"><i></i>言直在线 · 已确认封面风格</span>
      <h1>先看<span class="g">效果</span>，再定风格</h1>
      <p>这里收录了 YZZX-cover 技能已经通过测试并确认的各种封面风格。点开任意一张封面，即可平铺查看该风格的学习参考图，方便你在生成前快速挑选最合适的方向。</p>
      <div class="stats">
        <div class="stat"><b>${finalStyles.length}</b><span>已确认风格</span></div>
        <div class="stat"><b>${totalRefs}</b><span>学习参考图</span></div>
        <div class="stat"><b>3:4</b><span>标准封面比例</span></div>
      </div>
    </section>

    <div class="section-head">
      <h2>全部风格</h2>
      <small>默认展示「已确认示意图」，点开平铺查看参考图</small>
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

  <div class="zoom" id="zoom"><img id="zoomImg" src="" alt="" /></div>

<script>
  const STYLES = ${stylesJSON};
  const grid = document.getElementById('grid');
  STYLES.forEach((s, i) => {
    const card = document.createElement('article');
    card.className = 'card'; card.style.setProperty('--i', i);
    card.innerHTML =
      '<div class="thumb">' +
        '<img loading="lazy" src="assets/covers/' + s.id + '.jpg" alt="' + s.name + ' 已确认示意图" />' +
        '<span class="count">' + s.refs + ' 参考</span>' +
        '<div class="veil"><span class="cta"><span class="dot"></span>查看 ' + s.refs + ' 张参考图</span></div>' +
      '</div>' +
      '<div class="meta">' +
        '<h3>' + s.name + ' <span class="en">' + s.id + '</span></h3>' +
        '<p>' + s.desc + '</p>' +
        '<div class="foot"><span>已确认示意图</span><span class="view">点开看参考 →</span></div>' +
      '</div>';
    card.addEventListener('click', () => openLightbox(s));
    grid.appendChild(card);
  });

  const lb = document.getElementById('lb'), lbName = document.getElementById('lbName'),
        lbEn = document.getElementById('lbEn'), lbTag = document.getElementById('lbTag'),
        lbGrid = document.getElementById('lbGrid'), lbNote = document.getElementById('lbNote');
  function openLightbox(s){
    lbName.textContent = s.name; lbEn.textContent = s.id; lbTag.textContent = s.refs + ' 张参考图';
    lbNote.textContent = '以上为「' + s.name + '」的学习参考图（首页展示的已确认示意图不在此重复）。点击任意一张可放大查看。';
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
  function closeLightbox(){ lb.classList.remove('show'); lb.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; setTimeout(() => lb.classList.remove('open'), 280); }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbBackdrop').addEventListener('click', closeLightbox);

  const zoom = document.getElementById('zoom'), zoomImg = document.getElementById('zoomImg');
  function openZoom(src, alt){ zoomImg.src = src; zoomImg.alt = alt; zoom.classList.add('open'); }
  function closeZoom(){ zoom.classList.remove('open'); }
  zoom.addEventListener('click', closeZoom);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape'){ if (zoom.classList.contains('open')) closeZoom(); else if (lb.classList.contains('open')) closeLightbox(); }
  });
</script>
</body>
</html>`;

fs.writeFileSync(path.join(SITE_ROOT, 'index.html'), html, 'utf8');
console.log('已生成 index.html（' + finalStyles.length + ' 风格 / ' + totalRefs + ' 参考图）');
