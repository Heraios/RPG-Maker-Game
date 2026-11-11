// Used by art/sky_hole_view.py: renders map 6 (from MAP6_GARDEN, a copy with only the ladder and skylight)
// node art/render_map6_garden.js 6 OUT.png day|dusk|night broken|mended
const http=require('http'),fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const root=require('path').resolve('Smoking Isle'), MAP=+process.argv[2], OUT=process.argv[3];
const W=36*48,H=60*48;
const main=`PluginManager.setup($plugins);
window.onload=function(){SceneManager._screenWidth=${W};SceneManager._screenHeight=${H};SceneManager._boxWidth=${W};SceneManager._boxHeight=${H};
Scene_Boot.prototype.start=function(){Scene_Base.prototype.start.call(this);DataManager.setupNewGame();$gamePlayer.reserveTransfer(${MAP},0,0,2,0);$gamePlayer._siNoTone=1;$gamePlayer.setTransparent(true);SceneManager.goto(Scene_Map);window.__go=Date.now();};
SceneManager.run(Scene_Boot);};`;
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u=='/')u='/index.html';
 if(u=='/js/main.js'){r.end(main);return;}
 const f=u=='/data/Map006.json'?process.env.MAP6_GARDEN:path.join(root,u);fs.readFile(f,(e,d)=>{if(e){r.statusCode=404;r.end();return;}
 const ext=path.extname(f);r.setHeader('Content-Type',{'.js':'application/javascript','.html':'text/html','.json':'application/json','.png':'image/png'}[ext]||'application/octet-stream');r.end(d);});});
srv.listen(0,async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:W,height:H}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('http://127.0.0.1:'+srv.address().port+'/index.html');
 await p.waitForFunction(()=>window.__go&&SceneManager._scene instanceof Scene_Map&&SceneManager._scene.isReady&&SceneManager._scene._spriteset,null,{timeout:30000});
 await p.waitForTimeout(2500);
 const mode=process.argv[4]||'day',mend=process.argv[5]=='mended';await p.evaluate(([m,mend])=>{if(mend)$gameSelfSwitches.setValue([6,8,'A'],true);$gameVariables.setValue(5,mend?50:30);if(m!='day'){$gameVariables.setValue(2,m=='night'?3:2);$gameSwitches.setValue(7,m=='night');}$gameMap.refresh();},[mode,mend]);await p.waitForTimeout(300);
 await p.evaluate(()=>{$gameScreen.clearTone&&$gameScreen.clearTone();$gameScreen._tone=[0,0,0,0];$gameScreen._brightness=255;});
 await p.waitForTimeout(500);
 const c=await p.$('canvas');await c.screenshot({path:OUT});await b.close();srv.close();});
