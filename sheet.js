/* Đọc trực tiếp sheet TỒN KHO (Google Sheets, chế độ "ai có link đều xem được") và dựng bản chụp
   cùng dạng với data/*.json. Dùng chung cho trang (index.html) và script lưu lịch sử
   (scripts/snapshot.mjs, chạy bằng GitHub Actions). */
(function (root) {
  const SHEET_ID = '1y4aPypQBrybTe3icd6ZwCzdCkRBGI-4EfCI2O3o7-fM';
  const TABS = [
    { head: 'HEAD 1', ten: 'VTQ1', gid: '413440815' },
    { head: 'HEAD 2', ten: 'VTQ2.Mới', gid: '1523546254' },
  ];
  const csvUrl = (gid) => `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;

  const khongDau = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
  const soNguyen = (v) => { const s = String(v == null ? '' : v).trim(); return /^-?\d+$/.test(s) ? Number(s) : null; };

  // CSV theo RFC 4180 (ô có ngoặc kép, xuống dòng trong ô)
  function parseCsv(text) {
    const rows = []; let row = [], cell = '', q = false;
    const s = String(text || '').replace(/^﻿/, '');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        if (c === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.map((r) => r.map((x) => x.trim()));
  }

  // tên màu đầy đủ từ cách ghi tắt trên sheet; ở nhóm SH/ADV/ICON "X.MỜ" là Xám mờ (Andy xác nhận), nơi khác là Xanh mờ
  const tenMau = (xe, mau) => {
    const m = String(mau || '').trim();
    const sh = /^(SH|ADV|ICON)/i.test(String(xe || ''));
    const up = m.toUpperCase();
    const map = sh ? { 'X.MỜ': 'Xám mờ', 'X.BƠ': 'Xanh bơ', 'X.BIỂN': 'Xanh biển' } : { 'X.MỜ': 'Xanh mờ', 'X.BIỂN': 'Xanh biển', 'X.TÍM': 'Xanh tím', 'X.TRẮNG': 'Xanh trắng', 'X.BƠ': 'Xanh bơ' };
    if (map[up]) return map[up];
    if (m === up && m.length > 1) { const low = m.toLowerCase(); return low.charAt(0).toUpperCase() + low.slice(1); }
    return m;
  };
  const CHUA_MAU = '(chưa ghi màu)';

  // Một tab (VTQ1 / VTQ2.Mới) → các dòng xe, màu, tổng, ghi chú mượn BD
  function parseTab(rows) {
    const nhanNgay = (rows.find((r) => /^NGÀY \d+ THÁNG \d+ NĂM \d+/i.test(r[0] || '')) || [''])[0];
    const xe = [], mau = [];
    let header = [], tong = null, i = 0;
    for (; i < rows.length; i++) {
      const r = rows[i], a = r[0] || '';
      if (/^SL TỒN/i.test(a)) { tong = soNguyen(r[1]); i++; break; }
      if (!a && r[2] && soNguyen(r[2]) == null) { header = r; continue; }          // dòng tên màu
      if (!a || /^LOẠI XE/i.test(a)) continue;
      const sl = soNguyen(r[1]);
      if (sl == null) continue;
      xe.push({ xe: a, sl });
      let cong = 0;
      for (let j = 2; j < r.length; j++) {
        const v = soNguyen(r[j]);
        if (!v) continue;
        const ten = header[j] ? tenMau(a, header[j]) : CHUA_MAU;
        const cu = mau.find((m) => m.xe === a && m.mau === ten);
        if (cu) cu.sl += v; else mau.push({ xe: a, mau: ten, sl: v, cot: header[j] || '' });
        cong += v;
      }
      if (sl > cong) mau.push({ xe: a, mau: CHUA_MAU, sl: sl - cong, cot: '' });
    }
    if (tong == null) tong = xe.reduce((s, r) => s + r.sl, 0);

    // khối "Xe mượn BD": các ô chữ ở các dòng ngay dưới, tới dòng trống đầu tiên
    const muon = [];
    for (let k = i; k < rows.length; k++) {
      if (!/^xe m(ượ|uo)n bd/i.test(rows[k][0] || '')) continue;
      for (let n = k; n < rows.length; n++) {
        const r = rows[n].slice(0, 13);
        if (n > k && (r[0] || !r.some(Boolean))) break;
        for (let j = 1; j < r.length; j++) if (r[j]) muon.push(r[j]);
      }
      break;
    }
    return { nhanNgay, tong, xe, mau, muon };
  }

  // "2 sh160 đặc biệt xám đen" → { sl: 2, xe: 'SH 160 ABS ĐẶC BIỆT', mau: 'Xám đen' }, đối chiếu tên dòng xe/màu trên sheet
  const TAT = { tc: 'tieu chuan', db: 'dac biet', tt: 'the thao', cc: 'cao cap', cd: 'co dien', gh: 'gioi han', 'g/h': 'gioi han', mo: 'sh mode', fu: 'future', win: 'winner r', x: 'xanh' };
  const tachTu = (t) => khongDau(t).replace(/x\./g, 'x ').replace(/([a-z])(\d)/g, '$1 $2').replace(/[^a-z0-9/: ]+/g, ' ').split(/\s+/).filter(Boolean)
    .flatMap((w) => (TAT[w] ? TAT[w].split(' ') : [w]));
  function docMuon(moTa, dongXe, mauCot) {
    const m = String(moTa).trim().match(/^(\d+)\s*(.*)$/);
    const sl = m ? Number(m[1]) || 1 : 1;
    const tu = tachTu(m ? m[2] : moTa);
    const co = new Set(tu);
    let best = null;
    for (const ten of dongXe) {
      const tx = [...new Set(tachTu(ten))];
      if (!co.has(tx[0])) continue;
      const trung = tx.filter((w) => co.has(w)).length;
      const diem = trung + trung / tx.length / 2;
      if (!best || diem > best.diem) best = { ten, tx, diem };
    }
    if (!best) return { sl, xe: String(moTa).toUpperCase(), mau: '', mo_ta: moTa };
    const conLai = new Set(tu.filter((w) => !best.tx.includes(w)));
    // màu: tên màu khớp đủ mọi chữ, dài nhất; không có thì màu cùng chữ đầu ở cột được dùng nhiều trên sheet (vd "đỏ" → Đỏ đậm)
    let mau = '', diemMau = -1;
    for (const { ten, dung } of mauCot(best.ten)) {
      const tm = tachTu(ten);
      if (!tm.length || !conLai.has(tm[0])) continue;
      const d = (tm.every((w) => conLai.has(w)) ? tm.length * 1e6 : 0) + dung;
      if (d > diemMau) { diemMau = d; mau = ten; }
    }
    return { sl, xe: best.ten, mau, mo_ta: moTa };
  }

  // Ngày giờ Việt Nam
  const gioVN = (d) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
    return { ngay: `${p.year}-${p.month}-${p.day}`, gio: `${p.hour}:${p.minute}` };
  };

  // csv: { 'HEAD 1': text, 'HEAD 2': text }; truoc: data/*.json hiện có (để so với ngày trước)
  function snapshot(csv, truoc, now) {
    const { ngay, gio } = gioVN(now || new Date());
    const out = { ngay, gio, tong_ngay: [], giao_dich: [], ton_theo_xe: [], ton_theo_mau: [], muon_bd: [] };
    const tabs = {};
    for (const t of TABS) tabs[t.head] = parseTab(parseCsv(csv[t.head]));
    const dongXe = [...new Set(TABS.flatMap((t) => tabs[t.head].xe.map((r) => r.xe)))];
    const mauCot = (xe) => {
      const dung = new Map();
      for (const t of TABS) for (const r of tabs[t.head].mau) if (r.cot) {
        const sh = /^(SH|ADV|ICON)/i.test(r.xe) === /^(SH|ADV|ICON)/i.test(xe);
        if (sh) dung.set(tenMau(xe, r.cot), (dung.get(tenMau(xe, r.cot)) || 0) + r.sl + (r.xe === xe ? 1000 : 0));
      }
      return [...dung].map(([ten, d]) => ({ ten, dung: d }));
    };

    for (const t of TABS) {
      const tab = tabs[t.head], head = t.head;
      const muon = head === 'HEAD 2' ? tab.muon.map((s) => docMuon(s, dongXe, mauCot)) : [];
      const soMuon = muon.reduce((s, r) => s + r.sl, 0);
      for (const r of tab.xe) out.ton_theo_xe.push({ ngay, head, xe: r.xe, sl: r.sl });
      for (const r of tab.mau) out.ton_theo_mau.push({ ngay, head, xe: r.xe, mau: r.mau, sl: r.sl });
      for (const r of muon) {
        out.muon_bd.push({ ngay, head, xe: r.xe, mau: r.mau, sl: r.sl, mo_ta: r.mo_ta });
        out.giao_dich.push({ ngay, head, loai: 'Mượn BD', xe: r.xe, mau: r.mau, sl: r.sl, ghi_chu: r.mo_ta });
      }

      // bán/nhập: so từng (dòng xe, màu) với bản chụp gần nhất trước hôm nay
      const ngayTruoc = [...new Set((truoc.tong_ngay || []).filter((r) => r.head === head && r.ngay < ngay).map((r) => r.ngay))].sort().pop();
      let ban = null, nhap = null;
      if (ngayTruoc) {
        const coMau = (truoc.ton_theo_mau || []).some((r) => r.ngay === ngayTruoc && r.head === head);
        const key = (r) => (coMau ? r.xe + '|' + r.mau : r.xe + '|');
        const cu = new Map(), moi = new Map();
        for (const r of coMau ? truoc.ton_theo_mau : truoc.ton_theo_xe || []) if (r.ngay === ngayTruoc && r.head === head) cu.set(key(r), (cu.get(key(r)) || 0) + Number(r.sl || 0));
        for (const r of coMau ? tab.mau : tab.xe) moi.set(key(r), (moi.get(key(r)) || 0) + r.sl);
        ban = 0; nhap = 0;
        for (const k of new Set([...cu.keys(), ...moi.keys()])) {
          const d = (moi.get(k) || 0) - (cu.get(k) || 0);
          if (!d) continue;
          const [xe, mau] = k.split('|');
          out.giao_dich.push({ ngay, head, loai: d < 0 ? 'Bán/xuất' : 'Nhập về', xe, mau, sl: Math.abs(d), ghi_chu: '' });
          if (d < 0) ban -= d; else nhap += d;
        }
      }
      const nhanDung = (() => { const m = tab.nhanNgay.match(/NGÀY (\d+) THÁNG (\d+) NĂM (\d+)/i); return m && `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` === ngay; })();
      const ghi = [`Đọc trực tiếp từ Google Sheet lúc ${gio} ${ngay.slice(8, 10)}/${ngay.slice(5, 7)}`];
      if (ngayTruoc) ghi.push(`so với bản chụp ${ngayTruoc.slice(8, 10)}/${ngayTruoc.slice(5, 7)}`);
      if (tab.nhanNgay && !nhanDung) ghi.push(`nhãn sheet vẫn ghi "${tab.nhanNgay}"`);
      out.tong_ngay.push({
        ngay, head, nhan_ngay: tab.nhanNgay, ton: tab.tong, muon_bd: soMuon, ton_thuc_te: tab.tong + soMuon,
        ban, nhap, ghi_chu: ghi.join('; ') + '.',
      });
    }
    return out;
  }

  async function fetchCsv(fetchFn) {
    const f = fetchFn || fetch;
    const csv = {};
    await Promise.all(TABS.map(async (t) => {
      const r = await f(csvUrl(t.gid) + '&t=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) throw new Error(`Không đọc được tab ${t.ten}: ${r.status}`);
      const text = await r.text();
      if (/^\s*</.test(text)) throw new Error(`Tab ${t.ten} không ở chế độ xem công khai`);
      csv[t.head] = text;
    }));
    return csv;
  }

  // thay các dòng của ngày bản chụp trong dữ liệu cũ bằng bản chụp mới
  function merge(data, snap) {
    const out = {};
    for (const k of ['tong_ngay', 'giao_dich', 'ton_theo_xe', 'ton_theo_mau', 'muon_bd']) out[k] = (data[k] || []).filter((r) => r.ngay !== snap.ngay).concat(snap[k]);
    return out;
  }

  const api = { SHEET_ID, TABS, csvUrl, parseCsv, parseTab, docMuon, snapshot, fetchCsv, merge, gioVN };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.VTQSheet = api;
})(typeof window !== 'undefined' ? window : globalThis);
