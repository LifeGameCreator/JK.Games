(()=>{
  "use strict";
  const root=document.documentElement;
  let raf=0;
  const applyViewport=()=>{
    raf=0;
    const vv=window.visualViewport;
    const width=Math.max(1,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||1));
    const height=Math.max(1,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||1));
    root.style.setProperty("--jkg-viewport-width",`${width}px`);
    root.style.setProperty("--jkg-viewport-height",`${height}px`);
    root.style.setProperty("--jkg-visual-offset-top",`${Math.max(0,Math.round(vv?.offsetTop||0))}px`);
    root.style.setProperty("--jkg-visual-offset-left",`${Math.max(0,Math.round(vv?.offsetLeft||0))}px`);
    root.dataset.jkgOrientation=width>=height?"landscape":"portrait";
    root.classList.toggle("jkg-coarse",matchMedia("(pointer:coarse)").matches);
    root.classList.toggle("jkg-ios",/iP(?:hone|ad|od)/.test(navigator.userAgent)||(/Mac/.test(navigator.platform)&&navigator.maxTouchPoints>1));
    window.dispatchEvent(new CustomEvent("jkg:viewportchange",{detail:{width,height}}));
  };
  const schedule=()=>{if(!raf)raf=requestAnimationFrame(applyViewport)};
  addEventListener("resize",schedule,{passive:true});
  addEventListener("orientationchange",()=>setTimeout(schedule,60),{passive:true});
  window.visualViewport?.addEventListener("resize",schedule,{passive:true});
  window.visualViewport?.addEventListener("scroll",schedule,{passive:true});
  document.addEventListener("pointerdown",event=>{
    if(event.pointerType!=="mouse")root.dataset.jkgInput="touch";
    else root.dataset.jkgInput="mouse";
  },{capture:true,passive:true});
  document.addEventListener("touchmove",event=>{
    if(event.target.closest?.("canvas,.dkl-mobile-stick,.runner-kl-stage,.arena-kl-game,.fkl-stage,.mkl-game-screen"))event.preventDefault();
  },{capture:true,passive:false});
  applyViewport();
})();
