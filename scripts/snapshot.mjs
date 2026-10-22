// Đọc sheet TỒN KHO và ghi bản chụp hôm nay (giờ VN) vào data/*.json, thay bản chụp cũ cùng ngày.
// Chạy mỗi giờ bằng GitHub Actions (.github/workflows/snapshot.yml) để giữ lịch sử từng ngày; chạy tay: node scripts/snapshot.mjs
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const VTQSheet = createRequire(import.meta.url)('../sheet.js');
const FILES = ['tong_ngay', 'giao_dich', 'ton_theo_xe', 'ton_theo_mau', 'muon_bd'];
const path = (n) => new URL(`../data/${n}.json`, import.meta.url);

const data = {};
for (const n of FILES) data[n] = JSON.parse(await readFile(path(n), 'utf8'));
const snap = VTQSheet.snapshot(await VTQSheet.fetchCsv(), data);
if (!snap.tong_ngay.length || snap.ton_theo_xe.length < 20) throw new Error('Sheet đọc được quá ít dòng xe – không ghi đè dữ liệu');
const out = VTQSheet.merge(data, snap);
for (const n of FILES) await writeFile(path(n), JSON.stringify(out[n]));
for (const r of snap.tong_ngay) console.log(`${snap.ngay} ${snap.gio} ${r.head}: tồn ${r.ton} + mượn ${r.muon_bd}, bán ${r.ban}, nhập ${r.nhap}`);
