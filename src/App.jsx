import { useState, useEffect, useMemo } from "react";

const STEMS    = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const GEN    = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
const GENBY  = {'木':'水','火':'木','土':'火','金':'土','水':'金'};
const OVER   = {'木':'土','火':'金','土':'水','金':'木','水':'火'};
const OVERBY = {'木':'金','火':'水','土':'木','金':'火','水':'土'};
const BRANCH_EL = {
  '子':'水','丑':'土','寅':'木','卯':'木',
  '辰':'土','巳':'火','午':'火','未':'土',
  '申':'金','酉':'金','戌':'土','亥':'水',
};

const EL = {
  '木':{colors:['绿色','青色','翠绿色'],hexes:['#388e3c','#0097a7','#1b5e20'],bg:'#e8f5e9',main:'#2e7d32',
    allColors:[{name:'绿色',hex:'#43a047'},{name:'草绿',hex:'#7cb342'},{name:'青色',hex:'#0097a7'},
      {name:'翠绿',hex:'#2e7d32'},{name:'嫩绿',hex:'#aed581'},{name:'薄荷绿',hex:'#80cbc4'},
      {name:'橄榄绿',hex:'#827717'},{name:'墨绿',hex:'#1b5e20'},{name:'军绿',hex:'#558b2f'},{name:'苔藓绿',hex:'#6d8b3a'}]},
  '火':{colors:['红色','紫色','粉色'],hexes:['#d32f2f','#7b1fa2','#c2185b'],bg:'#fce4ec',main:'#c62828',
    allColors:[{name:'大红',hex:'#d32f2f'},{name:'玫红',hex:'#e91e63'},{name:'粉色',hex:'#f48fb1'},
      {name:'紫色',hex:'#7b1fa2'},{name:'橙色',hex:'#f57c00'},{name:'橘色',hex:'#fb8c00'},
      {name:'酒红',hex:'#880e4f'},{name:'珊瑚色',hex:'#ff7043'},{name:'桃红',hex:'#f06292'},{name:'藕粉',hex:'#ce93d8'}]},
  '土':{colors:['黄色','咖啡色','土黄色'],hexes:['#f9a825','#6d4c41','#a07040'],bg:'#fff8e1',main:'#c66900',
    allColors:[{name:'黄色',hex:'#f9a825'},{name:'土黄',hex:'#a07040'},{name:'咖啡色',hex:'#6d4c41'},
      {name:'驼色',hex:'#c8a96e'},{name:'卡其',hex:'#a1887f'},{name:'米色',hex:'#d7ccc8'},
      {name:'奶茶色',hex:'#bcaaa4'},{name:'焦糖色',hex:'#795548'},{name:'沙漠色',hex:'#d4a76a'},{name:'棕色',hex:'#5d4037'}]},
  '金':{colors:['白色','银白色','金色'],hexes:['#e0e0e0','#90a4ae','#fdd835'],bg:'#f5f5f5',main:'#546e7a',
    allColors:[{name:'白色',hex:'#f5f5f5'},{name:'乳白',hex:'#fafafa'},{name:'米白',hex:'#efebe9'},
      {name:'象牙白',hex:'#fffde7'},{name:'珍珠白',hex:'#f3e5f5'},{name:'银色',hex:'#90a4ae'},
      {name:'浅灰',hex:'#bdbdbd'},{name:'金色',hex:'#fdd835'},{name:'香槟金',hex:'#f0d080'},{name:'铂金',hex:'#cfd8dc'}]},
  '水':{colors:['黑色','深蓝色','藏青色'],hexes:['#37474f','#0d47a1','#1a237e'],bg:'#e3f2fd',main:'#0d47a1',
    allColors:[{name:'黑色',hex:'#212121'},{name:'深蓝',hex:'#0d47a1'},{name:'藏青',hex:'#1a237e'},
      {name:'宝蓝',hex:'#1565c0'},{name:'深灰',hex:'#37474f'},{name:'炭灰',hex:'#455a64'},
      {name:'靛蓝',hex:'#283593'},{name:'蓝紫',hex:'#4527a0'},{name:'墨色',hex:'#263238'},{name:'深紫',hex:'#4a148c'}]},
};

const DAYEL_LABEL = {
  '木':'木日 · 寅卯木','火':'火日 · 巳午火','土':'土日 · 辰戌丑未','金':'金日 · 申酉金','水':'水日 · 子亥水',
};

// ─── 农历核心数据（1900-2100）───
// 每行4字节十六进制：
//   高20位：12个月大小月（1=大30天,0=小29天）
//   中4位：闰月月份（0=无闰月）
//   低8位：当年正月初一对应公历的月(高4位)和日(低4位)
const lunarInfo = [
  0x04AE53,0x0A5748,0x5526BD,0x0D2650,0x0D9544,0x46AAB9,0x056A4D,0x09AD42,0x24AEB6,0x04AE4A,//1900-1909
  0x6AA550,0x0B5544,0x0AD538,0x095D4D,0x4AEC43,0x0A9548,0x7B6553,0x056A47,0x0ADA3B,0x09B64F,//1910-1919
  0x09AE45,0x6AA83A,0x0AD54F,0x0B5543,0x0B6537,0x3A574D,0x0EA542,0x0B6A56,0x7AAD4B,0x02B540,//1920-1929
  0x05AA54,0x0AD549,0x756ABE,0x056A51,0x096D46,0x54AEBB,0x04AD4F,0x0A4D43,0x4D26B7,0x0D254C,//1930-1939
  0x0D5242,0x5DAA56,0x056D4B,0x066B3F,0x696E54,0x0B6D49,0x0DA53D,0x05AA51,0x76A546,0x056A3A,//1940-1949
  0x096D4F,0x4AADA3,0x04AD48,0x0D4D3C,0x4D925F,0x0D5253,0x655B48,0x056D3C,0x066DA5,0x06AE51,//1950-1959
  0x0A2D46,0x712D3A,0x0EA54F,0x0B5544,0x4B6538,0x0AD54D,0x055A43,0x4576B7,0x096D4C,0x04AE41,//1960-1969
  0x0A4EB5,0x0A4E4A,0x6D26BF,0x0D5544,0x0DA538,0x55D54D,0x056A43,0x0A6D37,0x4AADB5,0x025D4A,//1970-1979
  0x092D42,0x2D92B7,0x0A954B,0x7B6540,0x056A55,0x0ABB4A,0x04BA3E,0x0A5B52,0x052B47,0x6A1538,//1980-1989
  0x096D4C,0x0B6D41,0x5DA536,0x056A4A,0x0A6D3E,0x3A9752,0x049747,0x064B3B,0x5EA54F,0x0B5544,//1990-1999
  0x0B6538,0x3A954D,0x056A43,0x0A6B37,0x54ADBC,0x04AD51,0x0A4D46,0x6D25BA,0x0D254F,0x0D5244,//2000-2009
  0x5DAA38,0x056D4D,0x066B42,0x696EB6,0x0B6D4B,0x0DA540,0x05AA54,0x76A549,0x056A3D,0x196D52,//2010-2019
  0x0ADA47,0x04AD3B,0x4D4DB8,0x0D254D,0x0D5242,0x5DA556,0x056A4B,0x096D3F,0x64AEBB,0x04AE50,//2020-2029
  0x0A2D45,0x6D92B9,0x0A954E,0x0B5543,0x4B6537,0x0AD54C,0x055A41,0x4576B6,0x096D4A,0x04AE3F,//2030-2039
  0x0A5753,0x452748,0x0D263C,0x5D9550,0x055B45,0x066B39,0x696EB4,0x0ADA48,0x04B63D,0x74A551,//2040-2049
  0x0B5546,0x0B6B3A,0x5BADA5,0x056A4A,0x0A6D3E,0x3A9752,0x049747,0x064B3B,0x5EA54F,0x0B5544,//2050-2059
  0x0B6538,0x55AA4D,0x056A42,0x0A6D37,0x64B4CB,0x04AD50,0x0A4E45,0x6D26B9,0x0D254E,0x0D5243,//2060-2069
  0x5DAA57,0x056D4C,0x066B40,0x6A6EB5,0x0B6D49,0x0DA53E,0x05AA52,0x76A547,0x056A3B,0x196D4F,//2070-2079
  0x0ADA44,0x04AD38,0x4D4DBC,0x0D2551,0x0D5246,0x5DAA3A,0x056D4F,0x066B43,0x6A6EB8,0x0B6D4C,//2080-2089
  0x0DA541,0x05AA55,0x76A54A,0x056A3E,0x296D52,0x0ADA47,0x04AD3B,0x4D4DB8,0x0D254C,0x0D5241,//2090-2099
];

const LM_CN = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LD_CN = ['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const WD = ['日','一','二','三','四','五','六'];

// 获取农历某年闰月月份(1-12, 0=无)
function leapMonth(y){ return lunarInfo[y-1900] & 0xf; }
// 获取农历某年闰月天数
function leapDays(y){
  if(leapMonth(y)) return (lunarInfo[y-1900] & 0x10000) ? 30 : 29;
  return 0;
}
// 获取农历某年某月天数(month: 1-12)
function monthDays(y, m){
  return (lunarInfo[y-1900] & (0x10000 >> m)) ? 30 : 29;
}
// 获取农历某年总天数
function yearDays(y){
  let sum = 29 * 12;
  for(let i=0x8000; i>0x8; i>>=1) sum += (lunarInfo[y-1900] & i) ? 1 : 0;
  return sum + leapDays(y);
}
// 获取某年正月初一的公历日期
function lunarNewYear(y){
  const d = lunarInfo[y-1900] & 0xff;
  const m = (lunarInfo[y-1900] & 0xf00) >> 8;
  return new Date(y, m-1, d);
}

// 公历转农历
function toLunar(year, month, day){
  if(year < 1900 || year > 2099) return null;
  const tgt = new Date(year, month-1, day);
  let offset = Math.round((tgt - lunarNewYear(year)) / 86400000);
  if(offset < 0){
    year--;
    offset = Math.round((tgt - lunarNewYear(year)) / 86400000);
  }
  let lm = 1, isLeap = false, leap = leapMonth(year);
  for(let i=1; i<=12; i++){
    const days = monthDays(year, i);
    if(offset < days){ lm = i; break; }
    offset -= days;
    if(leap === i){
      const ld = leapDays(year);
      if(offset < ld){ lm = i; isLeap = true; break; }
      offset -= ld;
    }
  }
  return { ly: year, lm, ld: offset+1, isLeap };
}

// 日柱计算（JDN法）
function jdn(y,m,d){
  const a=Math.floor((14-m)/12),yr=y+4800-a,mo=m+12*a-3;
  return d+Math.floor((153*mo+2)/5)+365*yr+Math.floor(yr/4)-Math.floor(yr/100)+Math.floor(yr/400)-32045;
}
function getSB(y,m,d){
  const j=jdn(y,m,d);
  return{ stem:STEMS[((j+9)%10+10)%10], branch:BRANCHES[((j+1)%12+12)%12] };
}
function getYrName(ly){
  return STEMS[((ly-4)%10+10)%10]+BRANCHES[((ly-4)%12+12)%12];
}

// 展开更多颜色组件
function MoreColors({el,mainColor}){
  const[open,setOpen]=useState(false);
  const ed=EL[el];
  if(!ed) return null;
  const lightHexes=['#f5f5f5','#fafafa','#efebe9','#fffde7','#f3e5f5'];
  return(
    <div style={{marginTop:'8px'}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:'4px',background:'none',border:`1px solid ${mainColor}33`,borderRadius:'20px',padding:'4px 12px',fontSize:'11px',color:mainColor,cursor:'pointer',fontFamily:'sans-serif'}}>
        <span style={{fontSize:'13px'}}>{open?'▲':'▼'}</span>
        {open?'收起':`查看全部 ${ed.allColors.length} 种颜色`}
      </button>
      {open&&(
        <div style={{marginTop:'10px',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'8px'}}>
          {ed.allColors.map((c,i)=>(
            <div key={i} style={{textAlign:'center'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'50%',background:c.hex,margin:'0 auto 4px',border:lightHexes.includes(c.hex)?'2px solid #ccc':'2px solid rgba(255,255,255,0.4)',boxShadow:`0 2px 6px ${c.hex}55`}}/>
              <div style={{fontSize:'9px',color:'#888',fontFamily:'sans-serif',lineHeight:'1.3'}}>{c.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CATS=[
  {key:'lucky',  title:'顺利贵人色',icon:'★',rel:e=>GEN[e],
   badge:(de,e)=>`${de}行 生 ${e}行`,desc:(de,e)=>`穿${EL[e]?.colors.join('、')}上衣比较好`,
   detail:'日支五行生此行，为顺利贵人色\n大环境顺着你，办事易成，开心轻松',bar:'#b8860b'},
  {key:'stable', title:'合宜安稳色',icon:'◎',rel:e=>e,
   badge:(de,e)=>`与当日同为${e}行`,desc:(de,e)=>`穿${EL[e]?.colors.join('、')}也可以`,
   detail:'与日支五行相同，为安稳比肩色\n适合商务合作、沟通谈判等场合',bar:'#2e7d32'},
  {key:'effort', title:'奋斗加油色',icon:'◆',rel:e=>OVERBY[e],
   badge:(de,e)=>`${e}行 克 ${de}行`,desc:(de,e)=>`穿${EL[e]?.colors.join('、')}为奋斗进财色`,
   detail:'此行克日支五行，需付出更多努力\n做事会较累，但成功能得到较大收获',bar:'#1565c0'},
  {key:'drain',  title:'辛苦消耗色',icon:'△',rel:e=>GENBY[e],
   badge:(de,e)=>`${e}行 生 ${de}行`,desc:(de,e)=>`穿${EL[e]?.colors.join('、')}为消耗泄气色`,
   detail:'此行生日支五行，消耗自身元气\n万事较累，不建议重要场合穿',bar:'#bf360c'},
  {key:'bad',    title:'压力山大色',icon:'✕',rel:e=>OVER[e],
   badge:(de,e)=>`${de}行 克 ${e}行`,desc:(de,e)=>`不宜穿${EL[e]?.colors.join('、')}衣服`,
   detail:'日支五行克此行，大环境压制\n万事阻力大、成效差，重要日子避免穿',bar:'#546e7a'},
];

function Pentagon({dayEl}){
  const els=['木','火','土','金','水'];
  const cx=110,cy=105,r=66;
  const pts=els.map((_,i)=>{const a=(i*72-90)*Math.PI/180;return[cx+r*Math.cos(a),cy+r*Math.sin(a)];});
  return(
    <svg viewBox="0 0 220 210" style={{width:'100%',maxWidth:'210px'}}>
      <defs><marker id="ar2" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
        <path d="M0,0 L5,2.5 L0,5 Z" fill="#ccc"/>
      </marker></defs>
      {els.map((e,i)=>{
        const j=els.indexOf(GEN[e]);
        const[x1,y1]=pts[i],[x2,y2]=pts[j];
        const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);
        return<line key={e} x1={x1} y1={y1} x2={x1+dx*(len-23)/len} y2={y1+dy*(len-23)/len} stroke="#d0d0d0" strokeWidth="1.3" markerEnd="url(#ar2)"/>;
      })}
      {els.map((e,i)=>{
        const[px,py]=pts[i],isDay=e===dayEl;
        return(
          <g key={e}>
            <circle cx={px} cy={py} r={isDay?27:21} fill={isDay?EL[e].main:EL[e].bg} stroke={EL[e].main} strokeWidth={isDay?2.5:1.5}/>
            <text x={px} y={py-3} textAnchor="middle" fontSize={isDay?18:15} fontWeight={isDay?700:500} fill={isDay?'#fff':EL[e].main} fontFamily="serif">{e}</text>
            <text x={px} y={py+11} textAnchor="middle" fontSize="8.5" fill={isDay?'rgba(255,255,255,0.8)':'#aaa'} fontFamily="sans-serif">{EL[e].colors[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function App(){
  const now=new Date();
  const[year, setYear] =useState(now.getFullYear());
  const[month,setMonth]=useState(now.getMonth()+1);
  const[day,  setDay]  =useState(now.getDate());

  const maxDay=new Date(year,month,0).getDate();
  useEffect(()=>{if(day>maxDay)setDay(maxDay);},[maxDay]);

  const{sb,dayEl,lunar,wday}=useMemo(()=>{
    const dd=Math.min(day,maxDay);
    const lunar=toLunar(year,month,dd);
    const sb=getSB(year,month,dd);
    return{ sb, dayEl:BRANCH_EL[sb.branch]??'木', lunar, wday:WD[new Date(year,month-1,dd).getDay()] };
  },[year,month,day,maxDay]);

  const eld=EL[dayEl];
  const sel={padding:'8px 4px',border:'1.5px solid #e8d5b0',borderRadius:'8px',fontSize:'15px',fontFamily:'sans-serif',color:'#3d2000',background:'#fffbf5',outline:'none',cursor:'pointer'};

  return(
    <div style={{fontFamily:"'Noto Serif SC',serif",background:'#f5ede0',minHeight:'100vh',paddingBottom:'48px'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;700;900&display=swap');*{box-sizing:border-box}`}</style>

      <div style={{background:'linear-gradient(170deg,#8b1515 0%,#5a0a0a 100%)',padding:'28px 20px 24px',textAlign:'center',color:'#fff',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:'-25px',right:'-25px',width:'110px',height:'110px',borderRadius:'50%',border:'1px solid rgba(245,200,66,0.2)'}}/>
        <div style={{position:'absolute',bottom:'-18px',left:'-18px',width:'90px',height:'90px',borderRadius:'50%',border:'1px solid rgba(245,200,66,0.15)'}}/>
        <div style={{fontSize:'10px',letterSpacing:'6px',color:'#f5c842',marginBottom:'8px',fontWeight:500}}>五 行 穿 衣 · 色 彩 建 议</div>
        <div style={{fontSize:'28px',fontWeight:900,letterSpacing:'8px',textShadow:'0 2px 8px rgba(0,0,0,0.35)'}}>穿 衣 配 色</div>
        <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginTop:'6px',letterSpacing:'2px'}}>依日柱地支五行相生相克 · 论穿衣配色之道</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',marginTop:'14px'}}>
          <div style={{height:'1px',width:'44px',background:'linear-gradient(90deg,transparent,#f5c842aa)'}}/>
          <div style={{width:'5px',height:'5px',background:'#f5c842',transform:'rotate(45deg)'}}/>
          <div style={{height:'1px',width:'44px',background:'linear-gradient(90deg,#f5c842aa,transparent)'}}/>
        </div>
      </div>

      <div style={{maxWidth:'460px',margin:'0 auto',padding:'0 14px'}}>
        <div style={{background:'#fff',borderRadius:'18px',padding:'20px',margin:'16px 0',boxShadow:'0 4px 20px rgba(139,21,21,0.08)',border:'1px solid rgba(139,21,21,0.1)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
            <div style={{width:'3px',height:'15px',background:'#8b1515',borderRadius:'2px'}}/>
            <span style={{fontSize:'12px',color:'#8b1515',letterSpacing:'2px'}}>选择日期</span>
          </div>
          <div style={{display:'flex',gap:'8px'}}>
            <select value={year} onChange={e=>setYear(+e.target.value)} style={{...sel,flex:2}}>
              {Array.from({length:80},(_,i)=>2020+i).map(yr=><option key={yr} value={yr}>{yr}年</option>)}
            </select>
            <select value={month} onChange={e=>setMonth(+e.target.value)} style={{...sel,flex:1.5}}>
              {Array.from({length:12},(_,i)=>i+1).map(mo=><option key={mo} value={mo}>{mo}月</option>)}
            </select>
            <select value={Math.min(day,maxDay)} onChange={e=>setDay(+e.target.value)} style={{...sel,flex:1.5}}>
              {Array.from({length:maxDay},(_,i)=>i+1).map(dd=><option key={dd} value={dd}>{dd}日</option>)}
            </select>
          </div>

          {lunar?(
            <div style={{marginTop:'22px',textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'#bbb',fontFamily:'sans-serif',marginBottom:'6px'}}>
                {year}年{month}月{Math.min(day,maxDay)}日 · 星期{wday} · 日柱 {sb.stem}{sb.branch}
              </div>
              <div style={{fontSize:'22px',fontWeight:900,color:'#6b0e0e',letterSpacing:'3px',marginBottom:'4px'}}>
                {getYrName(lunar.ly)}年
              </div>
              <div style={{fontSize:'18px',fontWeight:600,color:'#3d2000',letterSpacing:'2px',marginBottom:'14px'}}>
                农历 {lunar.isLeap?'闰':''}{LM_CN[lunar.lm-1]}月{LD_CN[lunar.ld-1]}
              </div>
              <div style={{display:'inline-flex',alignItems:'center',gap:'10px',padding:'10px 28px',borderRadius:'50px',background:eld.bg,border:`2px solid ${eld.main}44`}}>
                <span style={{fontSize:'12px',color:'#666'}}>日支五行</span>
                <span style={{fontSize:'26px',fontWeight:900,color:eld.main}}>{dayEl}</span>
                <span style={{fontSize:'11px',color:'#999'}}>{DAYEL_LABEL[dayEl]}</span>
              </div>
            </div>
          ):(
            <div style={{textAlign:'center',padding:'24px',color:'#bbb',fontSize:'13px',fontFamily:'sans-serif'}}>
              暂不支持该日期（支持范围：2020-2099年）
            </div>
          )}
        </div>

        {lunar&&CATS.map(cat=>{
          const el=cat.rel(dayEl),ed=EL[el];
          if(!ed) return null;
          return(
            <div key={cat.key} style={{background:'#fff',borderRadius:'14px',marginBottom:'10px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',overflow:'hidden'}}>
              <div style={{background:cat.bar,padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <span style={{fontSize:'13px',color:'rgba(255,255,255,0.85)'}}>{cat.icon}</span>
                  <span style={{fontSize:'15px',fontWeight:700,color:'#fff',letterSpacing:'1px'}}>{cat.title}</span>
                </div>
                <span style={{fontSize:'10px',padding:'3px 8px',borderRadius:'20px',background:'rgba(255,255,255,0.18)',color:'rgba(255,255,255,0.9)',border:'1px solid rgba(255,255,255,0.28)',fontFamily:'sans-serif',whiteSpace:'nowrap'}}>
                  {cat.badge(dayEl,el)}
                </span>
              </div>
              <div style={{padding:'14px 16px'}}>
                <div style={{display:'flex',gap:'12px',marginBottom:'12px',alignItems:'flex-start'}}>
                  {ed.hexes.map((hex,i)=>(
                    <div key={i} style={{textAlign:'center',minWidth:'52px'}}>
                      <div style={{width:'50px',height:'50px',borderRadius:'50%',background:hex,margin:'0 auto 5px',border:hex==='#e0e0e0'?'2px solid #bbb':'2px solid rgba(255,255,255,0.5)',boxShadow:`0 4px 12px ${hex}55`}}/>
                      <div style={{fontSize:'10px',color:'#888',lineHeight:'1.3',fontFamily:'sans-serif'}}>{ed.colors[i]}</div>
                    </div>
                  ))}
                  <div style={{marginLeft:'auto',width:'50px',height:'50px',borderRadius:'50%',background:ed.bg,border:`2px solid ${ed.main}44`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontSize:'18px',fontWeight:900,color:ed.main}}>{el}</span>
                  </div>
                </div>
                <div style={{fontSize:'13px',color:'#3d2000',fontWeight:600,marginBottom:'6px',lineHeight:'1.7'}}>{cat.desc(dayEl,el)}</div>
                <div style={{fontSize:'12px',color:'#888',lineHeight:'1.9',whiteSpace:'pre-line',fontFamily:'sans-serif',borderTop:'1px solid #f3ece0',paddingTop:'8px'}}>{cat.detail}</div>
                <MoreColors el={el} mainColor={ed.main}/>
              </div>
            </div>
          );
        })}

        {lunar&&(
          <div style={{background:'#fff',borderRadius:'14px',padding:'16px',marginBottom:'10px',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
              <div style={{width:'3px',height:'14px',background:'#8b1515',borderRadius:'2px'}}/>
              <span style={{fontSize:'12px',color:'#8b1515',letterSpacing:'2px'}}>五行图示</span>
              <span style={{fontSize:'11px',color:'#ccc',marginLeft:'auto',fontFamily:'sans-serif'}}>
                {sb.stem}{sb.branch}日 · {DAYEL_LABEL[dayEl]}
              </span>
            </div>
            <div style={{display:'flex',justifyContent:'center'}}><Pentagon dayEl={dayEl}/></div>
            <div style={{fontSize:'10px',color:'#ccc',textAlign:'center',lineHeight:'1.9',fontFamily:'sans-serif',marginTop:'4px'}}>
              相生（→）：木→火→土→金→水→木<br/>相克：木克土 · 火克金 · 土克水 · 金克木 · 水克火
            </div>
          </div>
        )}

        {lunar&&(
          <div style={{textAlign:'center',padding:'24px 0 0',lineHeight:'2.4'}}>
            <div style={{fontSize:'11px',color:'#c0a060',letterSpacing:'4px'}}>以上穿衣搭配仅供参考</div>
            <div style={{fontSize:'11px',color:'#c0a060',letterSpacing:'4px'}}>祝您开心快乐　一切顺遂</div>
            <div style={{fontSize:'10px',color:'#d8c8a8',marginTop:'8px',fontFamily:'sans-serif'}}>基于日柱地支五行推算 · 支持 2020—2099 年</div>
          </div>
        )}
      </div>
    </div>
  );
}
