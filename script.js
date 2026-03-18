let d = null;
const degs = document.getElementById('degs');
for (let i = 1; i <= 8; i++) {
  const b = document.createElement('button');
  b.textContent = i;
  b.onclick = () => {
    d = i;
    degs.querySelectorAll('button').forEach((x, j) => x.classList.toggle('on', j + 1 === i));
    buildInputs(i); updateEq();
    document.getElementById('coefs').style.display = 'block';
    document.getElementById('out').style.display = 'none';
  };
  degs.appendChild(b);
}
 
function buildInputs(n) {
  document.getElementById('fields').innerHTML = '';
  for (let i = n; i >= 0; i--) {
    const w = document.createElement('div'); w.className = 'field';
    const pow = i === 0 ? 'const' : i === 1 ? '<span>x</span>' : `<span>x${sup(i)}</span>`;
    w.innerHTML = `<label>a${sub(i)} &thinsp; ${pow}</label><input id="c${i}" type="number" placeholder="${i === n ? 1 : 0}" value="${i === n ? 1 : ''}" oninput="updateEq()">`;
    document.getElementById('fields').appendChild(w);
  }
}
 
function sup(n) { return String(n).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[c]).join(''); }
function sub(n) { return String(n).split('').map(c => '₀₁₂₃₄₅₆₇₈₉'[c]).join(''); }
function fmt(n) { return Math.abs(n) < 1e-9 ? '0' : parseFloat(n.toFixed(6)).toString(); }
function gv(i) { const el = document.getElementById('c'+i); return el && el.value ? parseFloat(el.value) : (i === d ? 1 : 0); }
 
function updateEq() {
  if (!d) return;
  let h = '', any = false;
  for (let i = d; i >= 0; i--) {
    const v = gv(i); if (v === 0 && i !== 0 && i !== d) continue;
    const s = v < 0 ? '−' : any ? '+' : '', a = Math.abs(v);
    const vp = i === 0 ? '' : i === 1 ? '<i>x</i>' : `<i>x</i>${sup(i)}`;
    h += (any || v < 0 ? `<span class="op">${s}</span>` : '') + (a !== 1 || i === 0 ? `<span class="c">${a}</span>` : '') + vp;
    any = true;
  }
  document.getElementById('eq').innerHTML = h + '<span class="op">=</span><span class="c">0</span>';
}
 
class C {
  constructor(r, i = 0) { this.r = r; this.i = i; }
  abs() { return Math.sqrt(this.r**2 + this.i**2); }
  add(c) { return new C(this.r+c.r, this.i+c.i); }
  sub(c) { return new C(this.r-c.r, this.i-c.i); }
  mul(c) { return new C(this.r*c.r - this.i*c.i, this.r*c.i + this.i*c.r); }
  div(c) { const d=c.r**2+c.i**2; return new C((this.r*c.r+this.i*c.i)/d, (this.i*c.r-this.r*c.i)/d); }
  str() {
    if (Math.abs(this.i) < 1e-7) return fmt(this.r);
    if (Math.abs(this.r) < 1e-7) return fmt(this.i)+'i';
    return `${fmt(this.r)} ${this.i>0?'+':'−'} ${fmt(Math.abs(this.i))}i`;
  }
}
 
function findRoots(co) { //durand-kerner algorithm
  const n = co.length - 1; if (!n) return [];
  if (n === 1) return [new C(-co[1]/co[0])];
  const a = co.map(x => x/co[0]);
  if (n === 2) {
    const disc = a[1]**2 - 4*a[2];
    if (disc >= 0) return [new C((-a[1]+Math.sqrt(disc))/2), new C((-a[1]-Math.sqrt(disc))/2)];
    return [new C(-a[1]/2, Math.sqrt(-disc)/2), new C(-a[1]/2, -Math.sqrt(-disc)/2)];
  }
  let rs = Array.from({length:n}, (_,i) => new C(.5*Math.cos(2*Math.PI*i/n), .5*Math.sin(2*Math.PI*i/n)+.01*i));

  const ev = x => { let r=new C(a[0]); for(let i=1;i<=n;i++) r=r.mul(x).add(new C(a[i])); return r; }; //horner's method
  for (let k=0; k<2000; k++) {
    const nr = rs.map((ri,i) => { let den=new C(1); rs.forEach((_,j)=>{ if(i!==j) den=den.mul(ri.sub(rs[j])); }); return ri.sub(ev(ri).div(den)); });
    const delta = nr.reduce((m,r,i)=>Math.max(m,r.sub(rs[i]).abs()),0);
    rs = nr; if (delta<1e-12) break;
  }
  return rs;
}
 
function solve() {
  const errEl = document.getElementById('err'); errEl.style.display = 'none';
  const co = Array.from({length:d+1}, (_,i) => gv(d-i));
  if (!co[0]) { errEl.textContent = 'Leading coefficient cannot be zero.'; errEl.style.display='block'; return; }
  const rs = findRoots(co);
  const rep = rs.map((r,i) => rs.some((s,j)=>i!==j&&r.sub(s).abs()<1e-4));
  let real=0, cplx=0, reps=0;
  document.getElementById('tbl').innerHTML = rs.map((r,i) => {
    const isC = Math.abs(r.i)>1e-7; if(!isC) real++; else cplx++; if(rep[i]) reps++;
    const tc = rep[i]?'rep':isC?'cplx':'real', tt = rep[i]?'repeated':isC?'complex':'real';
    return `<tr style="animation-delay:${i*55}ms"><td>x${sub(i+1)}</td><td class="${tc}">${r.str()}</td><td class="${tc}">${tt}</td></tr>`;
  }).join('');
  document.getElementById('stats').innerHTML = [['real',real,'#1a1208'],['complex',cplx,'#1a4a7a'],['repeated',reps,'#c0392b']]
    .map(([l,n,c])=>`<div class="stat"><b style="color:${c}">${n}</b><span>${l}</span></div>`).join('');
  document.getElementById('out').style.display = 'block';
}