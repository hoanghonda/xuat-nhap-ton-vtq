# Xuất nhập tồn VTQ

Bảng theo dõi tồn kho xe máy Honda HEAD Việt Thái Quân — HEAD 1 (VTQ1 Bình Dương) và HEAD 2 (VTQ2 Quận 2): xe bán/xuất, nhập về, tồn theo ngày, theo dòng xe và màu; kèm lịch xe về VTQ2 theo kế hoạch giao hàng của HVN.

Đây là bản tĩnh (HTML + JSON) của bảng "Xuất nhập tồn VTQ" trên Claude, dựng để chạy trên GitHub Pages.

## Cấu trúc

| File | Nội dung |
|---|---|
| `index.html` | Trang bảng (toàn bộ CSS/JS nằm trong file) |
| `d3.v7.min.js` | Thư viện vẽ biểu đồ d3 v7.9.0 |
| `data/tong_ngay.json` | Một dòng mỗi (ngày, HEAD): tồn sheet, mượn BD, tồn thực tế, bán, nhập, nhãn ngày sheet, ghi chú |
| `data/giao_dich.json` | Từng giao dịch bán/xuất, nhập về, mượn BD theo dòng xe – màu |
| `data/ton_theo_xe.json` | Tồn theo (ngày, HEAD, dòng xe) |
| `data/ton_theo_mau.json` | Tồn theo (ngày, HEAD, dòng xe, màu) |
| `data/muon_bd.json` | Xe VTQ2 mượn của VTQ1 đang ở showroom VTQ2 |
| `data/giao_hang.json` | Kế hoạch giao hàng HVN tháng 10 cho VTQ2 (tab "Lịch xe về") |

## Cập nhật dữ liệu

Tác vụ theo dõi tồn kho hằng ngày (Claude, ~8:52 sáng giờ VN) đọc sheet TỒN KHO, so với bản chụp hôm trước, rồi ghi 5 file `data/*.json` mới lên repo này. Trang tự đọc file mới khi tải lại.

Chỉ cần thay file trong `data/` — không cần sửa `index.html`.
