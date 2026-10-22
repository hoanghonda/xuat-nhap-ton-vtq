# Xuất nhập tồn VTQ

Bảng theo dõi tồn kho xe máy Honda HEAD Việt Thái Quân — HEAD 1 (VTQ1 Bình Dương) và HEAD 2 (VTQ2 Quận 2): xe bán/xuất, nhập về, tồn theo ngày, theo dòng xe và màu; kèm lịch xe về VTQ2 theo kế hoạch giao hàng của HVN.

Trang chạy trên GitHub Pages và **đọc trực tiếp Google Sheet TỒN KHO** (tab VTQ1, VTQ2.Mới) mỗi phút: số hôm nay luôn theo sheet, không phải chờ tác vụ hằng ngày.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Trang bảng (toàn bộ CSS/JS nằm trong file) |
| `sheet.js` | Đọc CSV của sheet TỒN KHO, dựng bản chụp hôm nay (tồn theo xe/màu, xe mượn BD, bán/nhập so với ngày trước) |
| `scripts/snapshot.mjs` | Ghi bản chụp hôm nay vào `data/*.json` (GitHub Actions chạy mỗi giờ) |
| `d3.v7.min.js` | Thư viện vẽ biểu đồ d3 v7.9.0 |
| `data/tong_ngay.json` | Một dòng mỗi (ngày, HEAD): tồn sheet, mượn BD, tồn thực tế, bán, nhập, nhãn ngày sheet, ghi chú |
| `data/giao_dich.json` | Từng giao dịch bán/xuất, nhập về, mượn BD theo dòng xe – màu |
| `data/ton_theo_xe.json` | Tồn theo (ngày, HEAD, dòng xe) |
| `data/ton_theo_mau.json` | Tồn theo (ngày, HEAD, dòng xe, màu) |
| `data/muon_bd.json` | Xe VTQ2 mượn của VTQ1 đang ở showroom VTQ2 |
| `data/giao_hang.json` | Kế hoạch giao hàng HVN tháng 10 cho VTQ2 (tab "Lịch xe về") |

## Cập nhật dữ liệu

- **Hôm nay:** trang tải CSV của sheet TỒN KHO ngay trên trình duyệt, tự làm mới mỗi phút (và khi quay lại tab). Bán/nhập hôm nay = chênh lệch từng dòng xe – màu so với bản chụp gần nhất của ngày trước. Dòng chữ dưới tiêu đề cho biết giờ đọc sheet gần nhất; nếu không đọc được sheet, trang hiện bản chụp đã lưu.
- **Các ngày trước:** workflow `.github/workflows/snapshot.yml` chạy mỗi giờ (phút 17), đọc sheet và ghi đè bản chụp của ngày hôm nay (giờ VN) trong `data/*.json`. Bản chụp cuối cùng của mỗi ngày trở thành lịch sử để so cho ngày hôm sau. Có thể bấm chạy tay ở tab Actions → "Lưu bản chụp tồn kho" → Run workflow.
- Sheet phải để chế độ chia sẻ **"Bất kỳ ai có đường liên kết đều có thể xem"**; nếu đổi về riêng tư, trang và workflow sẽ không đọc được.
- Nếu đổi tên/thêm tab hoặc sheet khác, sửa `SHEET_ID` và `TABS` (gid) trong `sheet.js`.
