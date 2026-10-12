// Native, independently editable engineering diagrams, icons and technical route.
module.exports=function(p,T,C){
 const {text:t,panel:r,line:l,circle:c}=T;
 function sh(s,type,x,y,w,h,fill,line=C.blue,k){s.addShape(p.ShapeType[type],{x,y,w,h,fill:{color:fill},line:{color:line,width:1},objectName:`${s._sid}/${k||'route-'+s._routeSeq++}`});}
 function init(s){if(s._routeSeq===undefined)s._routeSeq=0;}
 function icon(s,kind,x,y,z=.4,color=C.blue){init(s);let u=z,bg=color==='FFFFFF'?C.blue:'FFFFFF';
  const ln=(a,b,d,e)=>l(s,x+a*u,y+b*u,x+d*u,y+e*u,color,1.7);
  if(kind==='gear'){sh(s,'gear6',x,y,u,u,color,color);c(s,x+.36*u,y+.36*u,.28*u,bg);}
  else if(kind==='cube'){[[.1,.25,.55,.02],[.55,.02,.95,.25],[.95,.25,.5,.5],[.5,.5,.1,.25],[.1,.25,.1,.78],[.1,.78,.5,1],[.5,1,.95,.77],[.95,.77,.95,.25],[.5,.5,.5,1]].forEach(v=>ln(...v));}
  else if(kind==='chart'){[.35,.6,.9].forEach((h,i)=>sh(s,'rect',x+i*u*.32,y+(1-h)*u,u*.18,h*u,color,color));}
  else if(kind==='cap'){sh(s,'diamond',x,y,u,u*.42,color,color);sh(s,'rect',x+.25*u,y+.37*u,u*.5,u*.28,color,color);ln(.95,.22,.95,.7);}
  else if(kind==='screen'){sh(s,'rect',x,y,u,u*.7,bg,color);ln(.5,.72,.5,.9);ln(.15,.95,.85,.95);icon(s,'gear',x+.33*u,y+.12*u,u*.34,color);}
  else if(kind==='search'){c(s,x+.05*u,y+.05*u,u*.6,'FFFFFF');ln(.53,.56,.97,.98);}
  else {sh(s,'rect',x,y,u*.72,u,bg,color);[.25,.45,.65].forEach(v=>ln(.12,v,.58,v));ln(.48,.96,.95,.5);}
 }
 function frame(s,x,y,w,h,color=C.blue,axes=false){init(s);let a=[[0,.3],[.64,0],[1,.18],[.36,.48],[0,.82],[.64,.53],[1,.71],[.36,1]];let edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  edges.forEach(([i,j])=>l(s,x+a[i][0]*w,y+a[i][1]*h,x+a[j][0]*w,y+a[j][1]*h,color,1.4));a.forEach(([u,v])=>c(s,x+u*w-.035,y+v*h-.035,.07,color));
  if(axes){l(s,x+w+.18,y+h*.8,x+w+.18,y+.08,color,1.3,true);l(s,x+w+.18,y+h*.8,x+w+.62,y+h*.92,color,1.3,true);t(s,'z',x+w+.12,y-.13,.2,.2,11,color);t(s,'x',x+w+.64,y+h*.8,.2,.2,11,color);}
 }
 function support(s,x,y){sh(s,'triangle',x-.08,y,.16,.14,'FFFFFF');l(s,x-.12,y+.17,x+.12,y+.17,C.blue,1);}
 function force(s,x,y,w,type){init(s);
  if(type==='axial'||type==='torsion'){
   r(s,x+.32,y+.18,w-.64,.24,'BDC9C8',null,false);sh(s,'ellipse',x+w-.46,y+.18,.14,.24,'CCD7D5',C.navy);sh(s,'ellipse',x+.25,y+.18,.14,.24,'E2E9E7',C.navy);
   if(type==='axial'){l(s,x+.23,y+.3,x+.02,y+.3,C.blue,1.6,true);l(s,x+w-.28,y+.3,x+w-.02,y+.3,C.blue,1.6,true);t(s,'P',x-.02,y-.02,.2,.2,12,C.navy);t(s,'P',x+w-.13,y-.02,.2,.2,12,C.navy);}
   else {[[x+.16,1],[x+w-.19,-1]].forEach(([xx,d])=>{l(s,xx,y+.05,xx+d*.13,y+.1,C.blue,1.5,true);l(s,xx,y+.05,xx-d*.07,y+.22,C.blue,1.5);l(s,xx-d*.07,y+.22,xx,y+.55,C.blue,1.5);});t(s,'T',x-.02,y+.22,.2,.2,12,C.navy);t(s,'T',x+w-.1,y+.22,.2,.2,12,C.navy);}
  }else if(type==='bend'){
   l(s,x+.12,y+.28,x+w-.12,y+.28,'9BAEAA',4);support(s,x+.12,y+.3);support(s,x+w-.12,y+.3);
   l(s,x+w/2,y-.04,x+w/2,y+.22,C.blue,1.6,true);t(s,'F',x+w/2+.06,y-.15,.2,.2,12,C.navy);
   let pts=[[.1,.35],[.3,.47],[.5,.52],[.7,.47],[.9,.35]];for(let i=0;i<4;i++)l(s,x+pts[i][0]*w,y+pts[i][1],x+pts[i+1][0]*w,y+pts[i+1][1],C.blue,1.1,false,null,true);
  }else frame(s,x+.38,y-.02,w*.47,.61,C.blue,true);
 }
 function inputFrame(s,x,y,w,h){l(s,x,y+h,x,y+.08,C.navy,2);l(s,x,y+.08,x+w,y+.08,C.navy,2);l(s,x+w,y+.08,x+w,y+h,C.navy,2);support(s,x,y+h);support(s,x+w,y+h);[.25,.5,.75].forEach(v=>l(s,x+w*v,y-.22,x+w*v,y+.02,C.blue,1.3,true));}
 function route(q){let s=p.addSlide();s._sid=q.slide_id;init(s);s.background={color:'FFFFFF'};
  t(s,'“拉压弯扭大师” 材料力学教学软件技术路线',.35,.15,12.6,.5,28,C.navy,true,'title');
  r(s,.9,.84,11.55,1.32,'DDEFE8','scenario-band');
  ['拉伸 / 压缩','弯曲','扭转','组合变形'].forEach((name,i)=>{let x=1.04+i*2.84;r(s,x,.94,2.65,1.12,'F4FAF7');t(s,name,x+.12,1.01,2.4,.27,18,C.navy,true);force(s,x+.18,1.42,2.29,['axial','bend','torsion','combined'][i]);});
  const cols=[
   ['建模输入','paper',['二维梁 / 刚架','空间桁架 / 刚架','节点 / 材料 / 截面','约束与荷载输入']],
   ['统一模型','cube',['杆系单元统一表达','坐标变换 / 自由度','二维与空间模型组织','数据关联公式与显示']],
   ['本地求解','gear',['TypeScript + mathjs','sparse LU求解','Worker CPU异步计算','本地离线运行','Euler–Bernoulli梁']],
   ['结果与推导','chart',['位移、变形与内力','空间刚架：构件端力','公式库与分步推导','危险位置核查','SVG / Three.js显示']],
   ['教学应用','cap',['课堂演示与例题','自主练习与校核','开卷辅助与概念','先预测，再改参数']]
  ];
  cols.forEach(([title,kind,items],i)=>{let x=.25+i*2.61;r(s,x,2.36,2.39,2.99,'FFFFFF',null,false);sh(s,'rect',x,2.36,2.39,.57,C.blue,C.blue);icon(s,kind,x+.16,2.49,.31,'FFFFFF');t(s,title,x+.59,2.49,1.68,.3,21,'FFFFFF',true);
   items.forEach((v,j)=>t(s,'• '+v,x+.13,3.04+j*.32,2.15,.28,(i===2&&j===4)?12:14.5,C.navy,false));
   if(i===0)inputFrame(s,x+.45,4.66,1.35,.45);
   if(i===1)frame(s,x+.48,4.56,1.13,.58,C.blue,true);
   if(i===2)icon(s,'screen',x+.91,4.77,.5,C.blue);
   if(i===3){force(s,x+.12,4.8,1.08,'bend');frame(s,x+1.35,4.76,.6,.45,C.teal);}
   if(i===4){icon(s,'screen',x+1.15,4.6,.72,C.blue);[0,1,2].forEach(j=>{c(s,x+.4+j*.42,4.83,.16,C.blue);r(s,x+.35+j*.42,5.02,.26,.19,C.blue,null,false)});}
   if(i<4)l(s,x+2.4,2.72,x+2.6,2.72,C.blue,2.8,true);
  });
  // Verification feedback uses native connectors; orange always means future work.
  r(s,2.79,5.72,5.55,.63,'F7FBF9','verification');icon(s,'paper',3,5.86,.34,C.blue);t(s,'解析解 / 案例验证',3.48,5.87,2.17,.28,17,C.blue,true);t(s,'理论解析解对比\n典型案例对照与误差检查',5.88,5.81,2.26,.46,13,C.navy);
  l(s,6.67,5.38,6.67,5.7,C.blue,2);l(s,2.77,6.03,1.42,6.03,C.blue,2);l(s,1.42,6.03,1.42,5.4,C.blue,2,true);l(s,4.03,5.71,4.03,5.4,C.blue,2,true);
  r(s,9.05,5.64,4.03,.91,'E5F0EB','limits');t(s,'当前边界',9.2,5.78,1.02,.28,16,C.blue,true);t(s,'Tet4实验；暂无成熟实体云图\nWASM未接入；WebGPU仅检测\n空间当前仅节点荷载、端内力',10.3,5.72,2.63,.68,12,C.navy);
  s.addShape(p.ShapeType.roundRect,{x:.18,y:6.72,w:12.98,h:.59,fill:{color:'FFF9EF'},line:{color:C.orange,width:1.2,dashType:'dash'},objectName:`${s._sid}/future-layer`});
  t(s,'规划层',.38,6.88,1.05,.27,18,C.orange,true);
  ['空间荷载补齐','实体分析完善','WASM / WebGPU验证'].forEach((v,i)=>{let x=1.65+i*3.84;s.addShape(p.ShapeType.roundRect,{x,y:6.82,w:3.38,h:.4,fill:{color:'FFFFFF'},line:{color:C.orange,width:1.2,dashType:'dash'},objectName:`${s._sid}/future-${i}`});icon(s,['cube','chart','gear'][i],x+.15,6.88,.24,C.orange);t(s,v,x+.54,6.91,2.7,.22,17,C.orange,true);if(i<2)l(s,x+3.44,7.02,x+3.78,7.02,C.orange,1.8,true,null,true);});
  t(s,'依据：软件README、求解器能力审计及实机记录；工程图形为概念示意，非应力云图或新增试验；规划项尚未完成。',.45,7.36,12.4,.1,7,C.gray,false,'sources');
  s.addNotes(q.speaker_notes+'\n原生技术路线依照用户绿色参考重新构建。箭头表示学习与数据流程；橙色虚线仅未来规划。三维端内力不冒充实体云图。');return s;
 }
 return {route,icon,frame,force};
};
