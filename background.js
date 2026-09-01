const TIMER_KEY='ticketTimerState';
chrome.runtime.onInstalled.addListener(()=>{chrome.sidePanel?.setPanelBehavior?.({openPanelOnActionClick:true}).catch(()=>{});});
function norm(s){if(!s||!Array.isArray(s.timers))return{timers:[],activeTimerId:'',updatedAt:0};if(!s.activeTimerId&&s.timers.length)s.activeTimerId=s.timers[0].id;return s;}
function getS(){return new Promise(r=>chrome.storage.local.get([TIMER_KEY],x=>r(norm(x[TIMER_KEY]))));}
function setS(s){return new Promise(r=>chrome.storage.local.set({[TIMER_KEY]:s},r));}
function pause(t,n){if(!t||!t.running)return;t.elapsedMs+=n-t.startedAt;t.running=false;t.startedAt=0;t.updatedAt=n;}
function make(ticket){let n=Date.now();return{id:'timer-'+n+'-'+Math.random().toString(36).slice(2,8),running:false,startedAt:0,elapsedMs:0,updatedAt:n,ticketId:ticket.ticketId||'',ticketTitle:ticket.ticketTitle||ticket.ticketId||''};}
async function activate(ticket){if(!ticket?.ticketId)return;let n=Date.now(),s=await getS();s.timers.forEach(t=>pause(t,n));let t=s.timers.find(x=>x.ticketId===ticket.ticketId);if(!t){t=make(ticket);s.timers.unshift(t);}t.ticketTitle=ticket.ticketTitle||t.ticketTitle||ticket.ticketId;t.running=true;t.startedAt=n;t.updatedAt=n;s.activeTimerId=t.id;s.updatedAt=n;await setS(s);}
async function pauseTicket(ticket){if(!ticket?.ticketId)return;let n=Date.now(),s=await getS(),t=s.timers.find(x=>x.ticketId===ticket.ticketId);if(t){pause(t,n);s.updatedAt=n;await setS(s);}}
async function pauseActive(){let n=Date.now(),s=await getS(),t=s.timers.find(x=>x.id===s.activeTimerId);if(t){pause(t,n);s.updatedAt=n;await setS(s);}}
chrome.runtime.onMessage.addListener((m,s,r)=>{if(!m)return false;if(m.type==='TOPDESK_ACTIVE_TICKET_CHANGED'){activate(m.ticket).then(()=>r({ok:true}));return true;}if(m.type==='TOPDESK_TICKET_CLOSED'){pauseTicket(m.ticket).then(()=>r({ok:true}));return true;}if(m.type==='TOPDESK_NO_ACTIVE_TICKET'){pauseActive().then(()=>r({ok:true}));return true;}return false;});
function chk(id){if(id)chrome.tabs.sendMessage(id,{type:'CHECK_TOPDESK_ACTIVE_TICKET'}).catch(()=>{});}
chrome.webNavigation.onHistoryStateUpdated.addListener(d=>{if(d.frameId===0)chk(d.tabId);},{url:[{hostSuffix:'.topdesk.net'}]});
chrome.tabs.onActivated.addListener(a=>chk(a.tabId));
chrome.tabs.onUpdated.addListener((id,c)=>{if(c.status==='complete'||c.title||c.url)chk(id);});
