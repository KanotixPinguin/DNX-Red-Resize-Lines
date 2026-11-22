/* DNX_RED_RESIZE_LINES_STANDALONE_START */
(function(){
  "use strict";
  if(window.__dnxRedResizeLines) return;
  window.__dnxRedResizeLines = true;

  var TOP_KEY = "dnx_styler_top_h";
  var FFT_KEY = "dnx_styler_fft_h";
  var COL_KEY = "dnx_styler_linie_farbe";
  var THK_KEY = "dnx_styler_linie_dicke";
  var BTN_POS_KEY = "dnx.redlines.btn.pos.v1";

  function stylerActive(){ return !!(document.getElementById("dnx-blk-linien") || window.__dnxStylerAktiv || document.documentElement.classList.contains("dnx-styled")); }
  function getNum(k, def){ try{ var v = parseInt(localStorage.getItem(k)||"",10); return isFinite(v)?v:def; }catch(e){ return def; } }
  function getCol(){ try{ var c = localStorage.getItem(COL_KEY)||"#ff2020"; return /^#[0-9a-fA-F]{6}$/.test(c)?c:"#ff2020"; }catch(e){ return "#ff2020"; } }
  function setVal(k, v){ try{ if(v===null) localStorage.removeItem(k); else localStorage.setItem(k, String(v)); }catch(e){} }

  function installCss(){
    if(document.getElementById("dnx-redlines-css")) return;
    var st = document.createElement("style"); st.id = "dnx-redlines-css";
    st.textContent = `
      .dnx-rl-line{position:fixed;left:0;right:0;z-index:1000200;cursor:ns-resize;touch-action:none;transition:filter .15s}
      .dnx-rl-line::before{content:"";position:absolute;left:0;right:0;top:-5px;bottom:-5px}
      .dnx-rl-line:hover{filter:brightness(1.25)}
      #dnx-redlines-pill{position:fixed;right:18px;top:120px;z-index:1000620;height:28px;padding:0 11px;border-radius:999px;border:1px solid #fff;background:#8d1822;color:#fff;font:700 12px/26px 'Segoe UI',sans-serif;cursor:grab;user-select:none;touch-action:none;box-shadow:0 3px 12px rgba(0,0,0,.45)}
      #dnx-redlines-pop{position:fixed;right:18px;top:154px;z-index:1000625;width:270px;background:rgba(12,20,28,.96);color:#eaf6ff;border:1px solid #ff4040;border-radius:10px;padding:10px 12px;font:12px/1.4 'Segoe UI',sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.65);display:none}
      #dnx-redlines-pop label{display:flex;justify-content:space-between;align-items:center;margin:6px 0;gap:8px}
      #dnx-redlines-pop input[type=range]{width:125px}
      #dnx-redlines-pop .rl-actions{display:flex;gap:6px;margin-top:8px}
      #dnx-redlines-pop button{flex:1;height:26px;border-radius:6px;border:1px solid #ffffff44;background:#223442;color:#fff;font-weight:700;cursor:pointer}
    `;
    document.head.appendChild(st);
  }
  function applyHeights(){
    if(stylerActive()) return;
    var topH = getNum(TOP_KEY, 0), fftH = getNum(FFT_KEY, 0);
    var topBox = document.querySelector(".webrx-top-container");
    if(topBox){
      if(topH > 0){ topBox.style.setProperty("height", topH + "px", "important"); topBox.style.setProperty("max-height", topH + "px", "important"); }
      else { topBox.style.removeProperty("height"); topBox.style.removeProperty("max-height"); }
    }
    var specBox = document.getElementById("openwebrx-spectrum-container") || document.querySelector(".openwebrx-spectrum-container");
    if(specBox){
      if(fftH > 0){ specBox.style.setProperty("height", fftH + "px", "important"); specBox.style.setProperty("max-height", fftH + "px", "important"); }
      else { specBox.style.removeProperty("height"); specBox.style.removeProperty("max-height"); }
    }
    try{ window.dispatchEvent(new Event("resize")); }catch(e){}
  }
  function placeLine(id, targetEl, atBottom, onDrag, onReset){
    var el = document.getElementById(id);
    if(stylerActive() || !targetEl){ if(el && el.parentNode && el.getAttribute("data-rl-standalone")==="1") el.parentNode.removeChild(el); return; }
    if(!el){
      el = document.createElement("div"); el.id = id; el.className = "dnx-rl-line"; el.setAttribute("data-rl-standalone", "1");
      el.title = "Ziehen = Höhe anpassen · Doppelklick = Standardhöhe";
      document.body.appendChild(el);
      var drag = false, y0 = 0, h0 = 0, lastTap = 0, moved = false;
      el.addEventListener("pointerdown", function(e){
        if(e.button !== undefined && e.button !== 0) return; e.preventDefault();
        var now = Date.now();
        if(now - lastTap < 380 && !moved){ lastTap = 0; onReset(); placeAll(); return; }
        lastTap = now; moved = false; drag = true; y0 = e.clientY;
        h0 = targetEl.getBoundingClientRect().height || 100;
        try{ el.setPointerCapture(e.pointerId); }catch(err){} document.body.style.cursor = "ns-resize";
      });
      el.addEventListener("pointermove", function(e){ if(!drag) return; moved = true; onDrag(Math.round(h0 + (e.clientY - y0))); placeAll(); });
      function up(e){ if(!drag) return; drag = false; if(moved) lastTap = 0; try{ if(el.releasePointerCapture) el.releasePointerCapture(e.pointerId); }catch(err){} document.body.style.cursor = ""; }
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    }
    var r = targetEl.getBoundingClientRect(); if(r.width < 20){ el.style.display = "none"; return; }
    var thk = Math.max(1, Math.min(8, getNum(THK_KEY, 3)));
    el.style.display = "block"; el.style.height = thk + "px"; el.style.background = getCol();
    el.style.left = Math.round(r.left) + "px"; el.style.width = Math.round(r.width) + "px";
    el.style.top = Math.round((atBottom ? r.bottom : r.top) - thk / 2) + "px";
  }
  function placeAll(){
    if(stylerActive()) return;
    var freq = document.getElementById("openwebrx-frequency-container");
    var spec = document.getElementById("openwebrx-spectrum-container") || document.querySelector(".openwebrx-spectrum-container");
    placeLine("dnx-top-line", freq, false, function(h){ setVal(TOP_KEY, Math.max(96, Math.min(600, h))); applyHeights(); syncPop(); }, function(){ setVal(TOP_KEY, null); applyHeights(); syncPop(); });
    placeLine("dnx-fft-line", spec, true, function(h){ setVal(FFT_KEY, Math.max(40, Math.min(400, h))); applyHeights(); syncPop(); }, function(){ setVal(FFT_KEY, null); applyHeights(); syncPop(); });
  }
  function syncPop(){
    var pop = document.getElementById("dnx-redlines-pop"); if(!pop) return;
    var cIn = pop.querySelector("[data-k=col]"), tIn = pop.querySelector("[data-k=thk]"), topIn = pop.querySelector("[data-k=top]"), fftIn = pop.querySelector("[data-k=fft]");
    if(cIn) cIn.value = getCol();
    if(tIn){ tIn.value = String(getNum(THK_KEY, 3)); pop.querySelector("[data-v=thk]").textContent = tIn.value + " px"; }
    if(topIn){ topIn.value = String(getNum(TOP_KEY, 0)); pop.querySelector("[data-v=top]").textContent = (topIn.value==="0"?"Auto":topIn.value+" px"); }
    if(fftIn){ fftIn.value = String(getNum(FFT_KEY, 0)); pop.querySelector("[data-v=fft]").textContent = (fftIn.value==="0"?"Auto":fftIn.value+" px"); }
  }
  function buildUI(){
    if(stylerActive()) return; installCss();
    if(!document.getElementById("dnx-redlines-pill")){
      var pill = document.createElement("button"); pill.id = "dnx-redlines-pill"; pill.type = "button"; pill.textContent = "🔴 Rote Linien";
      pill.title = "Klick = Linien-Einstellungen · Ziehen = Button verschieben · Doppelklick = Standardposition";
      document.body.appendChild(pill);
      try{ var p = JSON.parse(localStorage.getItem(BTN_POS_KEY)||"null"); if(p&&isFinite(p.left)&&isFinite(p.top)){ pill.style.right="auto"; pill.style.left=p.left+"px"; pill.style.top=p.top+"px"; } }catch(e){}
      var dg=false,mv=false,sx=0,sy=0,ol=0,ot=0;
      pill.addEventListener("pointerdown",function(e){ if(e.button!==undefined&&e.button!==0) return; dg=true;mv=false;var r=pill.getBoundingClientRect();sx=e.clientX;sy=e.clientY;ol=r.left;ot=r.top;pill.style.cursor="grabbing";try{pill.setPointerCapture(e.pointerId);}catch(err){} });
      pill.addEventListener("pointermove",function(e){ if(!dg) return; var dx=e.clientX-sx,dy=e.clientY-sy; if(!mv&&Math.abs(dx)+Math.abs(dy)<=5) return; mv=true; pill.style.right="auto"; pill.style.left=Math.max(4,Math.min(window.innerWidth-pill.offsetWidth-4,Math.round(ol+dx)))+"px"; pill.style.top=Math.max(4,Math.min(window.innerHeight-pill.offsetHeight-4,Math.round(ot+dy)))+"px"; });
      function endP(e){ if(!dg) return;dg=false;pill.style.cursor="grab";try{if(pill.releasePointerCapture)pill.releasePointerCapture(e.pointerId);}catch(err){} if(mv){ var r=pill.getBoundingClientRect(); setVal(BTN_POS_KEY,JSON.stringify({left:Math.round(r.left),top:Math.round(r.top)})); pill.dataset.dnxSuppress="1";setTimeout(function(){delete pill.dataset.dnxSuppress;},220); } }
      pill.addEventListener("pointerup",endP); pill.addEventListener("pointercancel",endP);
      pill.addEventListener("dblclick",function(e){ e.preventDefault();e.stopPropagation();setVal(BTN_POS_KEY,null);pill.style.left="";pill.style.right="18px";pill.style.top="120px"; });
      pill.addEventListener("click",function(){ if(pill.dataset.dnxSuppress) return; var pop=document.getElementById("dnx-redlines-pop"); if(!pop) return; var show=pop.style.display!=="block"; pop.style.display=show?"block":"none"; if(show){ var r=pill.getBoundingClientRect(); pop.style.left=Math.max(8,Math.min(window.innerWidth-280,Math.round(r.right-270)))+"px"; pop.style.top=Math.min(window.innerHeight-250,Math.round(r.bottom+6))+"px"; syncPop(); } });
    }
    if(!document.getElementById("dnx-redlines-pop")){
      var pop = document.createElement("div"); pop.id = "dnx-redlines-pop";
      pop.innerHTML = '<b>🔴 Rote Ziehlinien</b><label>Farbe <input type="color" data-k="col" value="#ff2020"></label><label>Dicke <input type="range" min="1" max="8" step="1" data-k="thk"><span data-v="thk">3 px</span></label><label>Oben (px) <input type="range" min="0" max="600" step="2" data-k="top"><span data-v="top">Auto</span></label><label>Unten (px) <input type="range" min="0" max="400" step="2" data-k="fft"><span data-v="fft">Auto</span></label><div class="rl-actions"><button type="button" id="dnx-rl-reset">Zurücksetzen</button><button type="button" id="dnx-rl-close">Schließen</button></div>';
      document.body.appendChild(pop);
      pop.querySelector("[data-k=col]").oninput = function(){ setVal(COL_KEY, this.value); placeAll(); };
      pop.querySelector("[data-k=thk]").oninput = function(){ setVal(THK_KEY, this.value); syncPop(); placeAll(); };
      pop.querySelector("[data-k=top]").oninput = function(){ var v=parseInt(this.value,10); setVal(TOP_KEY, v>0?v:null); applyHeights(); syncPop(); placeAll(); };
      pop.querySelector("[data-k=fft]").oninput = function(){ var v=parseInt(this.value,10); setVal(FFT_KEY, v>0?v:null); applyHeights(); syncPop(); placeAll(); };
      pop.querySelector("#dnx-rl-reset").onclick = function(){ [TOP_KEY, FFT_KEY, COL_KEY, THK_KEY].forEach(function(k){ setVal(k, null); }); applyHeights(); syncPop(); placeAll(); };
      pop.querySelector("#dnx-rl-close").onclick = function(){ pop.style.display = "none"; };
      syncPop();
    }
  }
  function tick(){
    if(stylerActive()){
      var pill=document.getElementById("dnx-redlines-pill"), pop=document.getElementById("dnx-redlines-pop");
      if(pill) pill.style.display="none"; if(pop) pop.style.display="none"; return;
    }
    buildUI(); applyHeights(); placeAll();
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", tick, {once:true}); else tick();
  setInterval(tick, 900); window.addEventListener("resize", placeAll);
})();
/* DNX_RED_RESIZE_LINES_STANDALONE_END */
