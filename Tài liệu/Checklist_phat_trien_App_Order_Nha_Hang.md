# Checklist phát triển — Hệ thống Order tại bàn (QR + NV order hộ)

Checklist chia theo **4 giai đoạn roadmap**, mỗi giai đoạn gồm nhiều **bước**; mỗi bước **1–5 chức năng** tùy độ phức tạp.

- Đánh dấu `[x]` khi hoàn thành.
- Số trong ngoặc `(STT)` trùng file [`Yeu_cau_chuc_nang_App_Order_Nha_Hang.md`](./Yeu_cau_chuc_nang_App_Order_Nha_Hang.md) (danh mục chức năng).
- Nghiệp vụ chi tiết (luồng, rule): [`Nghiep_vu_chi_tiet_App_Order_Nha_Hang.md`](./Nghiep_vu_chi_tiet_App_Order_Nha_Hang.md).
- **File này** là nguồn sự thật cho _giai đoạn / thứ tự làm_. Độ ưu tiên trong file yêu cầu đã căn theo roadmap này.
- Thứ tự bước trong mỗi giai đoạn: nền tảng → luồng chính → phụ trợ.

---

## Tiến độ tổng

| Giai đoạn                       | Mục tiêu ngắn                           | Số bước | Hoàn thành  |
| ------------------------------- | --------------------------------------- | ------- | ----------- |
| [ ] Giai đoạn 1 – MVP           | NV order hộ + QR; DT hàng ngày          | 17 bước | \_\_\_ / 17 |
| [ ] Giai đoạn 2 – Chuẩn hóa     | Kho, KM đầy đủ, PnL, bàn nâng cao       | 12 bước | \_\_\_ / 12 |
| [ ] Giai đoạn 3 – Mở rộng chuỗi | Đa CN, CRM, HĐĐT, KPI NV                | 8 bước  | \_\_\_ / 8  |
| [ ] Giai đoạn 4 – Nâng cao      | Chat, upsale, đa ngôn ngữ, KPI nâng cao | 5 bước  | \_\_\_ / 5  |

---

# Giai đoạn 1 – MVP (Ra mắt vận hành cơ bản)

> **Mục tiêu:** Vận hành được 1 nhà hàng thực tế; thay order giấy/gọi miệng bằng **NV order hộ** và/hoặc **khách tự QR**; có số liệu doanh thu hàng ngày.

---

### Bước 1.1 — Đăng nhập & tài khoản cơ bản

_Nền tảng bảo mật tối thiểu để mọi app/web chạy được._

- [x] (1) Đăng nhập theo tài khoản/vai trò (SĐT/email + mật khẩu hoặc PIN)
- [x] (2) Phân quyền theo 6 cấp bậc (cố định theo vai trò)
- [x] (4) CRUD tài khoản nhân viên (tạo/sửa/khóa, gán vai trò, gán chi nhánh)

### Bước 1.2 — Chi nhánh & cấu hình tài chính

_Một chi nhánh đầu tiên + thuế/phí để lập hóa đơn đúng._

- [x] (8) CRUD chi nhánh nhà hàng
- [x] (99) Cấu hình thuế, phí dịch vụ, đơn vị tiền tệ
- [x] (105) Phân quyền truy cập dữ liệu nội bộ nghiêm ngặt (khép kín hệ thống)

### Bước 1.3 — Khu vực, bàn & mã QR

_Master data mặt bằng — điều kiện bắt buộc để order theo bàn._

- [x] (13) CRUD khu vực/tầng
- [x] (14) CRUD bàn theo khu vực/tầng
- [x] (15) Gen mã QR cho từng bàn (xuất PDF/PNG)

### Bước 1.4 — Sơ đồ bàn & chuyển bàn

_Vận hành phục vụ tại chỗ._

- [x] (16) Sơ đồ bàn trực quan (Floor map) + trạng thái bàn
- [x] (17) Chuyển bàn (chuyển order + trạng thái)

### Bước 1.5 — Thực đơn cơ bản

_Menu bán được trên App NV, QR và POS._

- [x] (34) CRUD danh mục món ăn
- [x] (35) CRUD món ăn/sản phẩm (tên, ảnh, giá, trạng thái bán)
- [x] (36) Biến thể món (size, topping, mức độ + cộng giá)

### Bước 1.6 — Nhân viên order hộ tại bàn

_Luồng phục vụ truyền thống: NV đến bàn, ghi món theo ý khách (không cần khách tự quét QR). Nên làm trước hoặc song song Order QR. Chi tiết: STT 21._

- [x] (21) Nhân viên order hộ khách tại bàn — chọn bàn, nhập món, gửi thẳng KDS; gọi thêm trong phiên; song song với QR trên cùng bàn

### Bước 1.7 — Order QR: xem menu & đặt món

_Luồng khách tự phục vụ — bổ sung song song với NV order hộ._

- [ ] (22) Quét QR xem menu tại bàn
- [ ] (23) Chọn món, số lượng, ghi chú, biến thể vào giỏ
- [ ] (25) Gọi thêm món trong lúc ăn qua QR (cùng phiên; gộp với order do NV nhập hộ nếu cùng bàn)

### Bước 1.8 — Xác nhận order khách & tương tác tại bàn

_Chống spam chỉ với order từ khách QR + gọi NV/thanh toán._

- [ ] (24) Gửi order tới bếp/NV xác nhận trước khi chế biến (chỉ order từ khách QR)
- [ ] (27) Gọi nhân viên (realtime + số bàn)
- [ ] (28) Gọi thanh toán

### Bước 1.9 — Thông báo realtime nhân viên

_Hạ tầng push cho order mới / gọi NV / gọi TT._

- [ ] (95) Thông báo realtime cho nhân viên (order mới, gọi NV, gọi TT, món sẵn sàng)

### Bước 1.10 — KDS cơ bản

_Bếp nhận order từ cả NV nhập hộ và khách QR; cập nhật trạng thái món._

- [ ] (51) Màn hình bếp/bar nhận order realtime (KDS)
- [ ] (53) Cập nhật trạng thái món (Chờ → Đang làm → Hoàn thành → Đã phục vụ)

### Bước 1.11 — Hóa đơn & thanh toán tại quầy

_Đóng ca bán hàng trong ngày._

- [ ] (57) Tạo hóa đơn từ order của bàn
- [ ] (58) Tách hóa đơn / Gộp hóa đơn (cơ bản)
- [ ] (59) Đa phương thức thanh toán (tiền mặt, thẻ, ví, CK, QR)
- [ ] (61) Tính thuế và phí dịch vụ tự động

### Bước 1.12 — Khuyến mãi tối thiểu cho thanh toán

_Đủ để áp giảm giá khi thu tiền (chi tiết KM đầy đủ ở GĐ2)._

- [ ] (64) CRUD chương trình khuyến mãi
- [ ] (65) Giảm giá theo món / nhóm sản phẩm
- [ ] (66) Giảm giá theo hóa đơn
- [ ] (71) Khuyến mãi tự động (không cần mã)
- [ ] (60) Áp dụng khuyến mãi/mã giảm giá vào hóa đơn

### Bước 1.13 — Cổng thanh toán điện tử

_Kết nối ngoài #1 — tiền._

- [ ] (102) Tích hợp cổng thanh toán điện tử (VNPay, Momo, ZaloPay, thẻ…)

### Bước 1.14 — Ca làm & phân công cơ bản

_Biết ai đang làm, phụ trách khu nào._

- [ ] (74) Tạo & quản lý mẫu ca làm việc
- [ ] (75) Xếp lịch làm việc cho nhân viên
- [ ] (79) Phân công nhân viên theo chi nhánh
- [ ] (80) Phân công theo khu vực/tầng trong ca

### Bước 1.15 — Chấm công

_Check-in/out cho bảng công ngày._

- [ ] (77) Chấm công vào/ra ca (Check-in/out)

### Bước 1.16 — Báo cáo doanh thu cơ bản

_Số liệu DT hàng ngày cho chủ quán._

- [ ] (83) Báo cáo doanh thu theo thời gian (ngày/tuần/tháng…)

### Bước 1.17 — Kiểm thử vận hành MVP (1 ngày bán thật)

_Không phải STT chức năng — bước đóng giai đoạn._

- [ ] Chạy thử flow **NV order hộ**: mở bàn → NV nhập món → KDS → phục vụ → thanh toán → báo cáo DT
- [ ] Chạy thử flow **Khách QR** (và/hoặc xen kẽ NV + QR trên cùng bàn)
- [ ] In/dán QR bàn thực tế; kiểm tra đúng bàn/đúng chi nhánh
- [ ] Checklist bug blocker trước khi ra mắt

---

# Giai đoạn 2 – Chuẩn hóa vận hành

> **Mục tiêu:** Kiểm soát chi phí nguyên liệu; tối ưu lợi nhuận từng món; chuẩn hóa khuyến mãi & quy trình bàn nâng cao.

---

### Bước 2.1 — Ma trận phân quyền & hồ sơ / audit

_Siết quyền vận hành sau khi MVP đã chạy._

- [ ] (3) Ma trận phân quyền chi tiết theo module (xem/thêm/sửa/xóa/duyệt)
- [ ] (5) Hồ sơ nhân viên (HĐLĐ, FT/PT, lương…)
- [ ] (6) Nhật ký hoạt động (Audit log)

### Bước 2.2 — Ghép/tách bàn & trải nghiệm order khách

_Bàn nâng cao + theo dõi phía khách._

- [ ] (18) Ghép bàn / Tách bàn
- [ ] (26) Theo dõi trạng thái món ăn (phía khách)
- [ ] (29) Xem lại lịch sử order trong phiên + tạm tính

### Bước 2.3 — Đặt bàn trước

_Reservation vận hành._

- [ ] (19) Đặt bàn trước (Reservation) — khung giờ, số khách, giữ bàn, nhắc NV

### Bước 2.4 — Menu vận hành nâng cao

_Combo, ẩn/hiện theo giờ, hết món._

- [ ] (37) Combo / Set menu
- [ ] (39) Ẩn/hiện món theo khung giờ, theo chi nhánh
- [ ] (40) Tự động ẩn món khi hết nguyên liệu (86'd)

### Bước 2.5 — Kho: danh mục & nhập xuất lõi

_Nền tảng kho — phụ thuộc BOM ở bước sau._

- [ ] (42) CRUD nguyên vật liệu, bán thành phẩm, thành phẩm
- [ ] (43) Nhập kho (NCC, SL, đơn giá, HSD)
- [ ] (45) Xuất kho thủ công / điều chỉnh (hủy, hao hụt, chuyển nội bộ)

### Bước 2.6 — Định lượng (BOM) & trừ kho theo order

_Công thức món — bước phức tạp, tách riêng. Trừ kho khi NV gửi bếp hoặc khi order QR được xác nhận._

- [ ] (38) Định lượng nguyên liệu theo món (Công thức/BOM)
- [ ] (44) Xuất kho tự động theo order (trừ theo BOM)

### Bước 2.7 — Kiểm kê, cảnh báo & giá vốn

_Kiểm soát thất thoát + COGS._

- [ ] (46) Kiểm kê kho định kỳ
- [ ] (47) Cảnh báo tồn kho tối thiểu / sắp hết hạn
- [ ] (49) Giá vốn hàng bán (COGS) theo món

### Bước 2.8 — Khuyến mãi đầy đủ

_Bổ sung điều kiện & hình thức còn thiếu so với MVP._

- [ ] (67) Giảm giá theo thời gian (happy hour, ngày lễ…)
- [ ] (68) Giảm giá theo chi nhánh
- [ ] (70) Mã giảm giá (Voucher/Coupon)
- [ ] (72) Combo giá ưu đãi (liên kết combo menu)

### Bước 2.9 — KDS nâng cao & hủy/đổi món

_Phân trạm, ưu tiên chờ, duyệt hủy._

- [ ] (52) Phân luồng order theo trạm chế biến (bếp nóng/lạnh/bar)
- [ ] (54) Ưu tiên order theo thời gian chờ
- [ ] (56) Hủy món / đổi món có xác nhận (TBP/QL duyệt)

### Bước 2.10 — Đối soát ca & máy in

_Đóng ca thu ngân + in nhiệt._

- [ ] (63) Đối soát ca thu ngân (Cash reconciliation)
- [ ] (101) Tích hợp máy in bếp / quầy thu ngân

### Bước 2.11 — Báo cáo PnL & phân tích

_Lãi lỗ, LN gộp món, xuất file._

- [ ] (87) Báo cáo lãi lỗ (P&L)
- [ ] (88) Báo cáo giá vốn & lợi nhuận gộp theo món
- [ ] (84) Doanh thu theo chi nhánh / khu vực / bàn
- [ ] (85) Doanh thu theo món / danh mục
- [ ] (91) Xuất báo cáo Excel/PDF

### Bước 2.12 — Nhân sự: duyệt ca & đối chiếu công

_Chuẩn hóa chấm công sau MVP._

- [ ] (76) Đăng ký ca / Đổi ca / Xin nghỉ phép (có duyệt)
- [ ] (78) Đối chiếu công thực tế vs. lịch phân ca
- [ ] (81) Tính lương theo giờ công/ca
- [ ] (96) Phân luồng thông báo theo khu vực phụ trách

---

# Giai đoạn 3 – Mở rộng chuỗi

> **Mục tiêu:** Sẵn sàng nhân rộng nhiều chi nhánh; giữ chân khách thân thiết; hoàn thiện HĐĐT — vẫn khép kín nội bộ.

---

### Bước 3.1 — Đa chi nhánh: cấu hình & menu/giá

_Mỗi CN có cấu hình/giá riêng._

- [ ] (9) Cấu hình riêng theo chi nhánh (thuế, phí, giờ bán, mẫu HĐ…)
- [ ] (10) Menu/giá riêng theo chi nhánh

### Bước 3.2 — Dashboard & so sánh chuỗi

_Nhìn toàn chuỗi cho Giám đốc._

- [ ] (11) Dashboard tổng hợp toàn chuỗi
- [ ] (12) So sánh hiệu quả giữa các chi nhánh
- [ ] (90) Dashboard trực quan (chỉ số nhanh vận hành)

### Bước 3.3 — Chuyển kho liên chi nhánh & NCC

_Logistics chuỗi + nhà cung cấp._

- [ ] (50) Chuyển kho giữa các chi nhánh
- [ ] (48) Quản lý nhà cung cấp (+ công nợ)
- [ ] (89) Báo cáo xuất – nhập – tồn kho

### Bước 3.4 — Hóa đơn điện tử

_Kết nối ngoài #2 — thuế._

- [ ] (62) Xuất hóa đơn điện tử theo quy định thuế VN
- [ ] (103) Tích hợp nhà cung cấp hóa đơn điện tử (MISA, Viettel, VNPT…)

### Bước 3.5 — CRM thành viên cơ bản

_Đăng ký & lịch sử khách._

- [ ] (92) Đăng ký/quản lý khách hàng thân thiết (SĐT, lịch sử, tổng chi tiêu)

### Bước 3.6 — Tích điểm & hạng thành viên

_Loyalty nội bộ — bước phức tạp._

- [ ] (93) Tích điểm – đổi ưu đãi theo hạng thành viên
- [ ] (69) Giảm giá theo đối tượng khách hàng (hạng, khách mới, sinh nhật…)
- [ ] (94) Ưu đãi sinh nhật / cá nhân hóa

### Bước 3.7 — Trải nghiệm khách & vận hành phụ

_Thanh toán tự phục vụ, feedback, bảo mật phiên._

- [ ] (30) Khách tự thanh toán qua QR/ví điện tử
- [ ] (31) Đánh giá/feedback sau bữa ăn
- [ ] (7) Đăng xuất tự động / giới hạn thiết bị
- [ ] (97) Cảnh báo vận hành cho quản lý
- [ ] (100) Cấu hình mẫu hóa đơn / phiếu in

### Bước 3.8 — KPI nhân viên & báo cáo bổ sung

_Đánh giá hiệu suất + DT theo giờ/NV._

- [ ] (82) Đánh giá hiệu suất nhân viên (bàn phục vụ, DT, rating KH)
- [ ] (86) Doanh thu theo khung giờ / nhân viên
- [ ] (41) Món bán chạy / gợi ý của bếp (nhãn menu)
- [ ] (55) In phiếu order (bill bếp) dự phòng
- [ ] (73) Báo cáo hiệu quả khuyến mãi
- [ ] (104) Sao lưu dữ liệu tự động (Backup nội bộ)

---

# Giai đoạn 4 – Nâng cao (tùy nhu cầu)

> **Mục tiêu:** Tối ưu trải nghiệm khi hệ thống đã ổn định; **không** bổ sung tích hợp bên ngoài mới.

---

### Bước 4.1 — Chat nội bộ

- [ ] (98) Chat/trao đổi nội bộ giữa các bộ phận (phục vụ ↔ bếp ↔ thu ngân)

### Bước 4.2 — Gợi ý món / Upsale

- [ ] (33) Gợi ý món / bán kèm (Upsale) trên Web Order QR

### Bước 4.3 — Đa ngôn ngữ menu

- [ ] (32) Đa ngôn ngữ trên menu điện tử (tối thiểu VI–EN)

### Bước 4.4 — Đặt cọc đặt bàn

- [ ] (20) Đặt cọc khi đặt bàn (thu online, hoàn/trừ khi đến)

### Bước 4.5 — KPI nhân viên nâng cao

_Mở rộng trên nền STT 82 đã có ở GĐ3 — tinh chỉnh chỉ số, xếp hạng, thưởng (không tạo STT mới)._

- [ ] Hoàn thiện dashboard KPI NV (xếp hạng, thưởng theo kỳ)
- [ ] Báo cáo so sánh hiệu suất theo bộ phận / chi nhánh

---

## Phụ lục — Ánh xạ nhanh STT → giai đoạn

Mỗi STT **1–105** xuất hiện đúng một lần trong các bước checkbox ở trên. Bảng rút gọn:

| STT                     | Chức năng (rút gọn)                        | Giai đoạn | Bước |
| ----------------------- | ------------------------------------------ | --------- | ---- |
| 1–2, 4                  | Đăng nhập, phân quyền cấp bậc, CRUD TK     | 1         | 1.1  |
| 8, 99, 105              | Chi nhánh, cấu hình thuế, khép kín dữ liệu | 1         | 1.2  |
| 13–15                   | Khu vực, bàn, QR                           | 1         | 1.3  |
| 16–17                   | Floor map, chuyển bàn                      | 1         | 1.4  |
| 34–36                   | Danh mục, món, biến thể                    | 1         | 1.5  |
| 21                      | NV order hộ tại bàn                        | 1         | 1.6  |
| 22–23, 25               | QR menu, đặt món, gọi thêm                 | 1         | 1.7  |
| 24, 27–28               | Xác nhận order khách QR, gọi NV/TT         | 1         | 1.8  |
| 95                      | Thông báo realtime                         | 1         | 1.9  |
| 51, 53                  | KDS nhận + trạng thái                      | 1         | 1.10 |
| 57–59, 61               | HĐ, tách/gộp, PTTT, thuế                   | 1         | 1.11 |
| 60, 64–66, 71           | KM tối thiểu + áp HĐ                       | 1         | 1.12 |
| 102                     | Cổng thanh toán                            | 1         | 1.13 |
| 74–75, 79–80            | Ca, lịch, phân công                        | 1         | 1.14 |
| 77                      | Chấm công                                  | 1         | 1.15 |
| 83                      | Báo cáo DT theo thời gian                  | 1         | 1.16 |
| 3, 5–6                  | Ma trận quyền, hồ sơ, audit                | 2         | 2.1  |
| 18, 26, 29              | Ghép/tách, trạng thái KH, lịch sử phiên    | 2         | 2.2  |
| 19                      | Đặt bàn trước                              | 2         | 2.3  |
| 37, 39–40               | Combo, ẩn giờ, 86'd                        | 2         | 2.4  |
| 42–43, 45               | Kho CRUD, nhập, xuất tay                   | 2         | 2.5  |
| 38, 44                  | BOM, trừ kho auto                          | 2         | 2.6  |
| 46–47, 49               | Kiểm kê, cảnh báo, COGS                    | 2         | 2.7  |
| 67–68, 70, 72           | KM thời gian/CN/voucher/combo              | 2         | 2.8  |
| 52, 54, 56              | KDS trạm, ưu tiên, hủy/đổi                 | 2         | 2.9  |
| 63, 101                 | Đối soát ca, máy in                        | 2         | 2.10 |
| 84–85, 87–88, 91        | PnL & báo cáo                              | 2         | 2.11 |
| 76, 78, 81, 96          | Duyệt ca, đối chiếu công, lương, TB khu    | 2         | 2.12 |
| 9–10                    | Cấu hình/menu theo CN                      | 3         | 3.1  |
| 11–12, 90               | Dashboard chuỗi                            | 3         | 3.2  |
| 48, 50, 89              | NCC, chuyển kho CN, XNT                    | 3         | 3.3  |
| 62, 103                 | HĐĐT                                       | 3         | 3.4  |
| 92                      | CRM đăng ký                                | 3         | 3.5  |
| 69, 93–94               | Loyalty                                    | 3         | 3.6  |
| 7, 30–31, 97, 100       | TT tự phục vụ, feedback, bảo mật…          | 3         | 3.7  |
| 41, 55, 73, 82, 86, 104 | KPI, báo cáo phụ, backup                   | 3         | 3.8  |
| 98                      | Chat nội bộ                                | 4         | 4.1  |
| 33                      | Upsale                                     | 4         | 4.2  |
| 32                      | Đa ngôn ngữ                                | 4         | 4.3  |
| 20                      | Đặt cọc bàn                                | 4         | 4.4  |
| (mở rộng STT 82)        | KPI nâng cao (không STT mới)               | 4         | 4.5  |

---

_Đồng bộ với [`Yeu_cau_chuc_nang_App_Order_Nha_Hang.md`](./Yeu_cau_chuc_nang_App_Order_Nha_Hang.md) (mô tả + phân quyền + độ ưu tiên). Có thể điều chỉnh thứ tự bước trong giai đoạn nếu stack kỹ thuật yêu cầu, nhưng không đổi STT sang giai đoạn khác nếu chưa cập nhật cả hai file._
