# Tài liệu yêu cầu chức năng — Hệ thống Order tại bàn (QR + NV order hộ)

Tổng hợp từ file `Yeu_cau_chuc_nang_App_Order_Nha_Hang.xlsx` — STT đánh lại liên tục **1–105**; dùng để tra cứu nhanh.

**File đi kèm:**

- [`Checklist_phat_trien_App_Order_Nha_Hang.md`](./Checklist_phat_trien_App_Order_Nha_Hang.md) — *khi nào làm* (giai đoạn / bước)
- [`Nghiep_vu_chi_tiet_App_Order_Nha_Hang.md`](./Nghiep_vu_chi_tiet_App_Order_Nha_Hang.md) — *vì sao / hoạt động thế nào* (nghiệp vụ tổng thể + từng STT)

File này là nguồn sự thật cho *làm gì* (danh mục chức năng ngắn).

---

## 1. Tổng quan

| Mục                       | Nội dung                                                                                                                      |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Mục đích**              | Tổng hợp chức năng web/app order tại bàn (**NV order hộ** + **khách QR**); làm cơ sở dự toán, SRS và kế hoạch theo giai đoạn. |
| **Số module**             | 14 module chức năng chính                                                                                                     |
| **Số chức năng chi tiết** | 105 chức năng (STT 1–105)                                                                                                     |
| **Vai trò**               | Giám đốc chuỗi, Chủ nhà hàng, Quản lý, Trưởng bộ phận, NV chính thức, NV thử việc, Khách hàng                                 |
| **Nền tảng**              | Web Quản trị (Admin), App/Web Nhân viên phục vụ, Web Order QR (khách), Màn hình bếp/bar (KDS), Màn hình thu ngân (POS)        |

### Phạm vi hệ thống

**Hệ thống khép kín / nội bộ.** Toàn bộ dữ liệu (order, kho, nhân sự, doanh thu, khách hàng…) chỉ lưu và xử lý nội bộ.

**Chỉ 2 kết nối ra bên ngoài:**

1. Cổng thanh toán điện tử
2. Nhà cung cấp hóa đơn điện tử (theo quy định thuế)

Không tích hợp phần mềm kế toán, nền tảng giao hàng ngoài, hay dịch vụ bên thứ ba khác.

### Chú giải độ ưu tiên

| Mức                | Ý nghĩa                                                         |
| ------------------ | --------------------------------------------------------------- |
| **Bắt buộc (MVP)** | Cần có trong Giai đoạn 1 để vận hành nhà hàng cơ bản            |
| **Quan trọng**     | Nên có sớm (thường GĐ2); ảnh hưởng lớn đến vận hành / lợi nhuận |
| **Nên có**         | Tối ưu trải nghiệm; thường GĐ2–GĐ3                              |
| **Giai đoạn sau**  | Mở rộng/nâng cao; GĐ3–GĐ4 khi hệ thống đã ổn định               |

> **Đồng bộ với checklist:** Cột độ ưu tiên ở trên đã căn theo **Roadmap / Checklist** (file `Checklist_phat_trien_App_Order_Nha_Hang.md`). Khi triển khai, lấy giai đoạn–bước từ checklist; lấy mô tả chi tiết từ file này.

### Viết tắt vai trò

| Viết tắt | Vai trò            |
| -------- | ------------------ |
| GĐ       | Giám đốc chuỗi     |
| CNH      | Chủ nhà hàng       |
| QL       | Quản lý            |
| TBP      | Trưởng bộ phận     |
| NVCT     | NV chính thức (FT) |
| NVTV     | NV thử việc (PT)   |
| KH       | Khách hàng         |

---

## 2. Danh sách chức năng theo module

### Module 1. Tài khoản & Phân quyền

| STT | Nhóm              | Chức năng                               | Mô tả                                                                                 | Nền tảng                    | Vai trò       | Độ ưu tiên     |
| --- | ----------------- | --------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------- | ------------- | -------------- |
| 1   | Đăng nhập/bảo mật | Đăng nhập theo tài khoản/vai trò        | Đăng nhập SĐT/email + mật khẩu hoặc mã PIN nhanh (NV bấm nhanh tại quầy)              | Web Quản trị / App / Web NV | Tất cả NV     | Bắt buộc (MVP) |
| 2   | Đăng nhập/bảo mật | Phân quyền theo 6 cấp bậc               | GĐ chuỗi > CNH > QL > TBP > NVCT > NVTV; mỗi cấp giới hạn phạm vi dữ liệu & chức năng | Web Quản trị                | GĐ/CNH/QL/TBP | Bắt buộc (MVP) |
| 3   | Đăng nhập/bảo mật | Ma trận phân quyền chi tiết theo module | CNH/QL tự cấu hình quyền (xem/thêm/sửa/xóa/duyệt) theo vai trò × module               | Web Quản trị                | GĐ/CNH        | Quan trọng     |
| 4   | Quản lý tài khoản | CRUD tài khoản nhân viên                | Tạo, sửa, khóa/mở, xóa; gán vai trò, gán chi nhánh                                    | Web Quản trị                | CNH/QL        | Bắt buộc (MVP) |
| 5   | Quản lý tài khoản | Hồ sơ nhân viên                         | Thông tin cá nhân, HĐLĐ, ngày vào làm, Fulltime/Parttime, mức lương                   | Web Quản trị                | CNH/QL        | Quan trọng     |
| 6   | Bảo mật & nhật ký | Nhật ký hoạt động (Audit log)           | Ghi thao tác quan trọng: sửa giá, hủy món, hủy HĐ, đổi ca… + người + thời gian        | Web Quản trị                | GĐ/CNH/QL     | Quan trọng     |
| 7   | Bảo mật & nhật ký | Đăng xuất tự động / giới hạn thiết bị   | Auto logout khi idle; giới hạn số thiết bị đăng nhập đồng thời (POS)                  | App/Web NV                  | Tất cả NV     | Nên có         |

### Module 2. Quản lý chi nhánh / chuỗi

| STT | Nhóm           | Chức năng                           | Mô tả                                                              | Nền tảng     | Vai trò  | Độ ưu tiên     |
| --- | -------------- | ----------------------------------- | ------------------------------------------------------------------ | ------------ | -------- | -------------- |
| 8   | Chi nhánh      | CRUD chi nhánh nhà hàng             | Tên, địa chỉ, SĐT, giờ hoạt động, ảnh đại diện                     | Web Quản trị | GĐ/CNH   | Bắt buộc (MVP) |
| 9   | Chi nhánh      | Cấu hình riêng theo chi nhánh       | Thuế suất, phí dịch vụ, đơn vị tiền, mẫu HĐ, giờ bán riêng         | Web Quản trị | GĐ/CNH   | Quan trọng     |
| 10  | Chi nhánh      | Menu/giá riêng theo chi nhánh       | Một món có giá khác nhau hoặc chỉ bán ở một số chi nhánh           | Web Quản trị | GĐ/CNH   | Quan trọng     |
| 11  | Tổng hợp chuỗi | Dashboard tổng hợp toàn chuỗi       | Doanh thu, bàn đang phục vụ, tình trạng vận hành mọi chi nhánh     | Web Quản trị | GĐ chuỗi | Quan trọng     |
| 12  | Tổng hợp chuỗi | So sánh hiệu quả giữa các chi nhánh | Doanh thu, chi phí, lợi nhuận, năng suất NV giữa chi nhánh/khu vực | Web Quản trị | GĐ chuỗi | Nên có         |

### Module 3. Khu vực – Tầng – Bàn

| STT | Nhóm         | Chức năng                       | Mô tả                                                         | Nền tảng                  | Vai trò     | Độ ưu tiên     |
| --- | ------------ | ------------------------------- | ------------------------------------------------------------- | ------------------------- | ----------- | -------------- |
| 13  | Khu vực/Tầng | CRUD khu vực/tầng               | VD: Tầng 1, Sân vườn, Phòng VIP…                              | Web Quản trị              | CNH/QL      | Bắt buộc (MVP) |
| 14  | Bàn          | CRUD bàn theo khu vực/tầng      | Tên/số bàn, sức chứa, thuộc khu vực                           | Web Quản trị              | CNH/QL      | Bắt buộc (MVP) |
| 15  | Bàn          | Gen mã QR cho từng bàn          | Sinh QR gắn ID bàn, xuất PDF/PNG; QR dẫn vào menu đúng bàn    | Web Quản trị              | CNH/QL      | Bắt buộc (MVP) |
| 16  | Bàn          | Sơ đồ bàn trực quan (Floor map) | Màu trạng thái: Trống – Đang phục vụ – Đã đặt trước – Cần dọn | App/Web NV / Web Quản trị | QL/TBP/NVCT | Bắt buộc (MVP) |
| 17  | Bàn          | Chuyển bàn                      | Chuyển toàn bộ order + trạng thái sang bàn khác               | App/Web NV                | NVCT/NVTV   | Bắt buộc (MVP) |
| 18  | Bàn          | Ghép bàn / Tách bàn             | Ghép nhiều bàn → 1 HĐ; tách 1 bàn → nhiều HĐ                  | App/Web NV                | NVCT/TBP    | Quan trọng     |
| 19  | Bàn          | Đặt bàn trước (Reservation)     | Đặt theo khung giờ, số khách; giữ bàn + nhắc NV               | Web Order QR / App/Web NV | QL/TBP + KH | Quan trọng     |
| 20  | Bàn          | Đặt cọc khi đặt bàn             | Thu cọc online; hoàn/trừ khi khách đến                        | Web Order QR              | KH          | Giai đoạn sau  |

### Module 4. Order tại bàn (QR khách + NV order hộ)

Hai luồng đặt món **song song**, cùng phiên bàn / cùng hóa đơn:

1. **Nhân viên order hộ** tại bàn bằng App/Web NV (**STT 21**) — khách không cần tự quét mã
2. **Khách tự order** qua quét QR (**STT 22–33**)

| STT | Nhóm                  | Chức năng                         | Mô tả                                                                                                        | Nền tảng                  | Vai trò       | Độ ưu tiên     |
| --- | --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | ------------- | -------------- |
| 21  | NV order hộ           | Nhân viên order hộ khách tại bàn  | Chọn bàn → nhập món theo ý khách → gửi thẳng KDS; gọi thêm trong phiên; dùng song song với QR trên cùng bàn. | App/Web NV                | NVCT/NVTV/TBP | Bắt buộc (MVP) |
| 22  | Truy cập menu         | Quét QR xem menu tại bàn          | Mở menu đúng chi nhánh/bàn, không cần tải app                                                                | Web Order QR              | KH            | Bắt buộc (MVP) |
| 23  | Đặt món               | Chọn món, số lượng, ghi chú       | Giỏ hàng, ghi chú (không hành, ít cay…), biến thể (size, topping…)                                           | Web Order QR              | KH            | Bắt buộc (MVP) |
| 24  | Đặt món               | Gửi order tới bếp/NV xác nhận     | Chỉ order khách QR (chống spam); order NV hộ (21) gửi thẳng bếp                                              | Web Order QR / App/Web NV | KH → NVCT     | Bắt buộc (MVP) |
| 25  | Đặt món               | Gọi thêm món trong lúc ăn (QR)    | Khách order thêm bất cứ lúc nào trong phiên; món gộp cùng phiên với order do NV nhập hộ nếu cùng bàn         | Web Order QR              | KH            | Bắt buộc (MVP) |
| 26  | Đặt món               | Theo dõi trạng thái món ăn        | Đã gửi bếp → Đang chế biến → Đã lên món → Đã phục vụ (mọi nguồn order trên bàn)                              | Web Order QR              | KH            | Quan trọng     |
| 27  | Tương tác tại bàn     | Gọi nhân viên                     | Thông báo realtime tới NV khu vực + số bàn                                                                   | Web Order QR              | KH            | Bắt buộc (MVP) |
| 28  | Tương tác tại bàn     | Gọi thanh toán                    | Thông báo thu ngân/NV phụ trách bàn                                                                          | Web Order QR              | KH            | Bắt buộc (MVP) |
| 29  | Tương tác tại bàn     | Xem lại lịch sử order trong phiên | Toàn bộ món đã gọi (từ QR và/hoặc NV order hộ) + tạm tính                                                    | Web Order QR              | KH            | Quan trọng     |
| 30  | Thanh toán & phản hồi | Khách tự thanh toán qua QR/ví     | Thanh toán online trên web order, không chờ POS                                                              | Web Order QR              | KH            | Nên có         |
| 31  | Thanh toán & phản hồi | Đánh giá/feedback sau bữa ăn      | Đánh giá món & phục vụ sau thanh toán                                                                        | Web Order QR              | KH            | Nên có         |
| 32  | Trải nghiệm           | Đa ngôn ngữ trên menu điện tử     | Tối thiểu VI–EN (và ngôn ngữ khác nếu cần)                                                                   | Web Order QR              | KH            | Nên có         |
| 33  | Trải nghiệm           | Gợi ý món / bán kèm (Upsale)      | Gợi ý món kèm, bán chạy, combo                                                                               | Web Order QR              | KH            | Giai đoạn sau  |

### Module 5. Thực đơn & Sản phẩm

| STT | Nhóm           | Chức năng                             | Mô tả                                                     | Nền tảng     | Vai trò        | Độ ưu tiên     |
| --- | -------------- | ------------------------------------- | --------------------------------------------------------- | ------------ | -------------- | -------------- |
| 34  | Danh mục & món | CRUD danh mục món ăn                  | Khai vị, Món chính, Đồ uống, Tráng miệng…                 | Web Quản trị | CNH/QL         | Bắt buộc (MVP) |
| 35  | Danh mục & món | CRUD món ăn/sản phẩm                  | Tên, mô tả, ảnh, giá, ĐVT, danh mục, đang bán/ngừng       | Web Quản trị | CNH/QL         | Bắt buộc (MVP) |
| 36  | Danh mục & món | Biến thể món (size, topping, mức độ)  | Size S/M/L, topping, độ ngọt/cay; có thể cộng giá         | Web Quản trị | CNH/QL         | Bắt buộc (MVP) |
| 37  | Danh mục & món | Combo / Set menu                      | Gộp món thành combo giá ưu đãi / set theo phần            | Web Quản trị | CNH/QL         | Quan trọng     |
| 38  | Định lượng     | Định lượng NVL theo món (BOM)         | Công thức trừ kho tự động + tính giá vốn                  | Web Quản trị | CNH/QL/TBP bếp | Quan trọng     |
| 39  | Vận hành menu  | Ẩn/hiện món theo khung giờ, chi nhánh | Menu sáng, happy hour, chỉ bán một số CN                  | Web Quản trị | CNH/QL         | Quan trọng     |
| 40  | Vận hành menu  | Tự động ẩn món khi hết NVL (86'd)     | Tồn NVL = 0 → ẩn/đánh dấu “Hết món” trên QR, App NV & POS | Web Quản trị | Hệ thống       | Quan trọng     |
| 41  | Vận hành menu  | Món bán chạy / gợi ý của bếp          | Nhãn: Bán chạy, Món mới, Đề xuất đầu bếp                  | Web Quản trị | CNH/QL         | Nên có         |

### Module 6. Kho – Nguyên vật liệu – Định lượng

| STT | Nhóm               | Chức năng                            | Mô tả                                                                | Nền tảng     | Vai trò        | Độ ưu tiên |
| --- | ------------------ | ------------------------------------ | -------------------------------------------------------------------- | ------------ | -------------- | ---------- |
| 42  | Danh mục kho       | CRUD NVL, bán thành phẩm, thành phẩm | 3 cấp: NVL thô → bán TP → thành phẩm; ĐVT riêng                      | Web Quản trị | CNH/QL/TBP bếp | Quan trọng |
| 43  | Nhập – xuất kho    | Nhập kho                             | Từ NCC: SL, đơn giá, HSD, người nhập                                 | Web Quản trị | TBP kho/QL     | Quan trọng |
| 44  | Nhập – xuất kho    | Xuất kho tự động theo order          | Khi order gửi bếp (NV hộ) hoặc được xác nhận (QR) → trừ kho theo BOM | Hệ thống     | Hệ thống       | Quan trọng |
| 45  | Nhập – xuất kho    | Xuất kho thủ công / điều chỉnh       | Hủy hư hỏng, hết hạn, hao hụt, chuyển kho; ghi lý do                 | Web Quản trị | TBP kho/QL     | Quan trọng |
| 46  | Kiểm kê & cảnh báo | Kiểm kê kho định kỳ                  | Đối chiếu thực tế vs hệ thống; tính thất thoát                       | Web Quản trị | TBP/QL         | Quan trọng |
| 47  | Kiểm kê & cảnh báo | Cảnh báo tồn tối thiểu / sắp hết hạn | Ngưỡng min + cảnh báo HSD                                            | Web Quản trị | TBP/QL         | Quan trọng |
| 48  | Nhà cung cấp       | Quản lý nhà cung cấp                 | CRUD NCC, lịch sử nhập, công nợ phải trả                             | Web Quản trị | QL/Kế toán     | Nên có     |
| 49  | Chi phí            | Giá vốn hàng bán (COGS) theo món     | Từ BOM + giá nhập NVL → lợi nhuận gộp                                | Web Quản trị | GĐ/CNH/QL      | Quan trọng |
| 50  | Chi phí            | Chuyển kho giữa các chi nhánh        | Phiếu điều chuyển NVL/hàng trong chuỗi                               | Web Quản trị | QL             | Nên có     |

### Module 7. Bếp / Bar – KDS

| STT | Nhóm           | Chức năng                                  | Mô tả                                                           | Nền tảng               | Vai trò      | Độ ưu tiên     |
| --- | -------------- | ------------------------------------------ | --------------------------------------------------------------- | ---------------------- | ------------ | -------------- |
| 51  | Nhận order     | Màn hình bếp/bar nhận order realtime (KDS) | Order từ QR hoặc NV nhập hộ hiển thị theo bàn                   | Màn hình Bếp/Bar (KDS) | NV bếp/bar   | Bắt buộc (MVP) |
| 52  | Nhận order     | Phân luồng order theo trạm chế biến        | Chia món tới bếp nóng / lạnh / bar theo danh mục                | KDS                    | NV bếp/bar   | Quan trọng     |
| 53  | Xử lý order    | Cập nhật trạng thái món                    | Chờ xử lý → Đang làm → Hoàn thành → Đã phục vụ; đồng bộ KH & NV | KDS                    | NV bếp/bar   | Bắt buộc (MVP) |
| 54  | Xử lý order    | Ưu tiên order theo thời gian chờ           | Sắp xếp/tô màu order chờ quá lâu                                | KDS                    | NV bếp/bar   | Quan trọng     |
| 55  | Xử lý order    | In phiếu order (bill bếp) dự phòng         | In nhiệt / bản cứng khi cần                                     | KDS                    | NV bếp/bar   | Nên có         |
| 56  | Thay đổi order | Hủy món / đổi món có xác nhận              | Ghi lý do; cần TBP/QL duyệt nếu đã bắt đầu chế biến             | App/Web NV / KDS       | TBP/QL duyệt | Quan trọng     |

### Module 8. Thanh toán & Hóa đơn

| STT | Nhóm            | Chức năng                       | Mô tả                                                                                | Nền tảng         | Vai trò       | Độ ưu tiên     |
| --- | --------------- | ------------------------------- | ------------------------------------------------------------------------------------ | ---------------- | ------------- | -------------- |
| 57  | Hóa đơn         | Tạo hóa đơn từ order của bàn    | Tổng hợp món trong phiên → 1 HĐ                                                      | POS / App/Web NV | NVCT/Thu ngân | Bắt buộc (MVP) |
| 58  | Hóa đơn         | Tách / Gộp hóa đơn              | Tách theo khách/món; gộp nhiều bàn                                                   | POS              | Thu ngân/TBP  | Bắt buộc (MVP) |
| 59  | Thanh toán      | Đa phương thức thanh toán       | Tiền mặt, thẻ, ví (Momo, ZaloPay…), CK, QR động, thanh toán một phần nhiều hình thức | POS              | Thu ngân      | Bắt buộc (MVP) |
| 60  | Thanh toán      | Áp dụng KM / mã giảm giá        | Tự động hoặc thủ công; kiểm tra điều kiện                                            | POS              | Thu ngân/TBP  | Bắt buộc (MVP) |
| 61  | Thanh toán      | Tính thuế và phí dịch vụ        | VAT, service charge % theo cấu hình CN                                               | POS              | Hệ thống      | Bắt buộc (MVP) |
| 62  | Hóa đơn điện tử | Xuất HĐĐT theo quy định thuế VN | Kết nối NCC HĐĐT                                                                     | POS              | Kế toán/QL    | Quan trọng     |
| 63  | Đối soát        | Đối soát ca thu ngân            | Đối chiếu tiền thực tế vs hệ thống khi giao/đóng ca                                  | POS              | Thu ngân/QL   | Quan trọng     |

### Module 9. Khuyến mãi & Mã giảm giá

| STT | Nhóm              | Chức năng                         | Mô tả                                                | Nền tảng                    | Vai trò   | Độ ưu tiên     |
| --- | ----------------- | --------------------------------- | ---------------------------------------------------- | --------------------------- | --------- | -------------- |
| 64  | Chương trình KM   | CRUD chương trình khuyến mãi      | Tạo/sửa/xóa/tạm dừng; tên, mô tả, thời gian hiệu lực | Web Quản trị                | GĐ/CNH/QL | Bắt buộc (MVP) |
| 65  | Điều kiện áp dụng | Giảm giá theo món / nhóm SP       | % hoặc số tiền cố định cho món/danh mục              | Web Quản trị                | GĐ/CNH/QL | Bắt buộc (MVP) |
| 66  | Điều kiện áp dụng | Giảm giá theo hóa đơn             | VD: HĐ từ 500k giảm 10%                              | Web Quản trị                | GĐ/CNH/QL | Bắt buộc (MVP) |
| 67  | Điều kiện áp dụng | Giảm giá theo thời gian           | Happy hour, ngày trong tuần, ngày lễ                 | Web Quản trị                | GĐ/CNH/QL | Quan trọng     |
| 68  | Điều kiện áp dụng | Giảm giá theo chi nhánh           | Chỉ áp dụng một/một số CN                            | Web Quản trị                | GĐ/CNH    | Quan trọng     |
| 69  | Điều kiện áp dụng | Giảm giá theo đối tượng KH        | Hạng TV, khách mới, sinh nhật, số lần ghé            | Web Quản trị                | GĐ/CNH/QL | Nên có         |
| 70  | Hình thức         | Mã giảm giá (Voucher/Coupon)      | Mã ngẫu nhiên/cố định; giới hạn lượt/KH và tổng lượt | Web Quản trị / Web Order QR | GĐ/CNH/QL | Quan trọng     |
| 71  | Hình thức         | Khuyến mãi tự động (không cần mã) | Tự áp khi đơn thỏa điều kiện                         | Hệ thống                    | Hệ thống  | Bắt buộc (MVP) |
| 72  | Hình thức         | Combo giá ưu đãi                  | Liên kết module Thực đơn – Combo                     | Web Quản trị                | GĐ/CNH/QL | Nên có         |
| 73  | Theo dõi          | Báo cáo hiệu quả khuyến mãi       | Lượt dùng, doanh thu, chi phí KM theo CT             | Web Quản trị                | GĐ/CNH/QL | Nên có         |

### Module 10. Nhân sự – Ca làm – Chấm công

| STT | Nhóm             | Chức năng                            | Mô tả                                             | Nền tảng                  | Vai trò            | Độ ưu tiên     |
| --- | ---------------- | ------------------------------------ | ------------------------------------------------- | ------------------------- | ------------------ | -------------- |
| 74  | Ca làm việc      | Tạo & quản lý mẫu ca                 | Ca sáng/chiều/tối; giờ bắt đầu/kết thúc           | Web Quản trị              | QL/TBP             | Bắt buộc (MVP) |
| 75  | Ca làm việc      | Xếp lịch làm việc cho NV             | Phân ca theo tuần/tháng; lịch theo bộ phận/CN     | Web Quản trị / App/Web NV | QL/TBP             | Bắt buộc (MVP) |
| 76  | Ca làm việc      | Đăng ký ca / Đổi ca / Xin nghỉ       | PT tự đăng ký; đổi ca/nghỉ cần TBP/QL duyệt       | App/Web NV                | NVCT/NVTV → TBP/QL | Quan trọng     |
| 77  | Chấm công        | Check-in/out                         | App (GPS/khuôn mặt) hoặc quét mã tại quầy         | App/Web NV                | Tất cả NV          | Bắt buộc (MVP) |
| 78  | Chấm công        | Đối chiếu công thực tế vs lịch       | Tính đi trễ / về sớm / tăng ca                    | Web Quản trị              | QL/TBP             | Quan trọng     |
| 79  | Phân công        | Phân công NV theo chi nhánh          | Cố định hoặc luân chuyển giữa CN                  | Web Quản trị              | GĐ/CNH/QL          | Bắt buộc (MVP) |
| 80  | Phân công        | Phân công theo khu vực/tầng trong ca | Phụ trách khu/tầng/nhóm bàn → nhận đúng thông báo | App/Web NV                | QL/TBP             | Bắt buộc (MVP) |
| 81  | Tiền lương & KPI | Tính lương theo giờ công/ca          | Từ bảng công + lương/giờ hoặc lương/ca            | Web Quản trị              | QL/Kế toán         | Quan trọng     |
| 82  | Tiền lương & KPI | Đánh giá hiệu suất NV                | Số bàn, doanh thu, đánh giá KH → khen thưởng      | Web Quản trị              | QL/TBP             | Giai đoạn sau  |

### Module 11. Doanh thu – Báo cáo – PnL

| STT | Nhóm          | Chức năng                         | Mô tả                                              | Nền tảng     | Vai trò    | Độ ưu tiên     |
| --- | ------------- | --------------------------------- | -------------------------------------------------- | ------------ | ---------- | -------------- |
| 83  | Doanh thu     | Báo cáo DT theo thời gian         | Ngày/tuần/tháng/quý/năm; xu hướng; so sánh cùng kỳ | Web Quản trị | GĐ/CNH/QL  | Bắt buộc (MVP) |
| 84  | Doanh thu     | DT theo chi nhánh / khu vực / bàn | Phân tích theo CN, tầng, từng bàn                  | Web Quản trị | GĐ/CNH/QL  | Quan trọng     |
| 85  | Doanh thu     | DT theo món / danh mục            | Bán chạy/chậm; đóng góp theo danh mục              | Web Quản trị | GĐ/CNH/QL  | Quan trọng     |
| 86  | Doanh thu     | DT theo khung giờ / nhân viên     | Cao điểm; doanh số theo NV/thu ngân                | Web Quản trị | QL/TBP     | Nên có         |
| 87  | PnL & chi phí | Báo cáo lãi lỗ (P&L)              | DT − COGS − chi phí vận hành → lợi nhuận theo kỳ   | Web Quản trị | GĐ/CNH     | Quan trọng     |
| 88  | PnL & chi phí | Giá vốn & LN gộp theo món         | Giá bán − giá vốn từng món                         | Web Quản trị | GĐ/CNH/QL  | Quan trọng     |
| 89  | Kho           | Báo cáo xuất – nhập – tồn         | Biến động tồn; cảnh báo hao hụt bất thường         | Web Quản trị | QL/TBP kho | Quan trọng     |
| 90  | Tổng hợp      | Dashboard trực quan               | DT hôm nay, bàn đang phục vụ, đơn chờ…             | Web Quản trị | GĐ/CNH/QL  | Quan trọng     |
| 91  | Xuất dữ liệu  | Xuất báo cáo Excel/PDF            | Lưu trữ, gửi email, trình ký                       | Web Quản trị | GĐ/CNH/QL  | Quan trọng     |

### Module 12. Khách hàng thân thiết (CRM)

| STT | Nhóm             | Chức năng                        | Mô tả                                         | Nền tảng                    | Vai trò       | Độ ưu tiên    |
| --- | ---------------- | -------------------------------- | --------------------------------------------- | --------------------------- | ------------- | ------------- |
| 92  | Thành viên       | Đăng ký/quản lý KH thân thiết    | Đăng ký qua SĐT; lịch sử ghé, tổng chi tiêu   | Web Order QR / Web Quản trị | KH tự ĐK / QL | Nên có        |
| 93  | Tích điểm & hạng | Tích điểm – đổi ưu đãi theo hạng | Điểm theo HĐ → ưu đãi; hạng Bạc/Vàng/KC…      | Web Order QR / Web Quản trị | Hệ thống + QL | Giai đoạn sau |
| 94  | Chăm sóc KH      | Ưu đãi sinh nhật / cá nhân hóa   | Tự gửi ưu đãi sinh nhật hoặc theo hành vi mua | Hệ thống/Thông báo          | Hệ thống      | Giai đoạn sau |

### Module 13. Thông báo & Tương tác realtime

| STT | Nhóm             | Chức năng                  | Mô tả                                    | Nền tảng                  | Vai trò       | Độ ưu tiên     |
| --- | ---------------- | -------------------------- | ---------------------------------------- | ------------------------- | ------------- | -------------- |
| 95  | Thông báo nội bộ | Thông báo realtime cho NV  | Order mới, gọi NV, gọi TT, món sẵn sàng  | App/Web NV                | NVCT/NVTV/TBP | Bắt buộc (MVP) |
| 96  | Thông báo nội bộ | Phân luồng TB theo khu vực | Chỉ gửi NV phụ trách khu/bàn liên quan   | App/Web NV                | Hệ thống      | Quan trọng     |
| 97  | Thông báo nội bộ | Cảnh báo vận hành cho QL   | Hết NVL, bàn chờ lâu, hủy món bất thường | App/Web NV / Web Quản trị | QL/TBP        | Nên có         |
| 98  | Tương tác nội bộ | Chat nội bộ giữa bộ phận   | Phục vụ ↔ bếp ↔ thu ngân                 | App/Web NV                | Tất cả NV     | Giai đoạn sau  |

### Module 14. Cấu hình hệ thống & Tích hợp

| STT | Nhóm               | Chức năng                               | Mô tả                                                                                 | Nền tảng           | Vai trò     | Độ ưu tiên     |
| --- | ------------------ | --------------------------------------- | ------------------------------------------------------------------------------------- | ------------------ | ----------- | -------------- |
| 99  | Cấu hình chung     | Cấu hình thuế, phí DV, tiền tệ          | Chung hoặc riêng theo CN                                                              | Web Quản trị       | GĐ/CNH      | Bắt buộc (MVP) |
| 100 | Cấu hình chung     | Cấu hình mẫu HĐ / phiếu in              | Logo, thông tin, bố cục HĐ quầy & phiếu bếp                                           | Web Quản trị       | CNH/QL      | Nên có         |
| 101 | Tích hợp phần cứng | Máy in bếp / quầy thu ngân              | In phiếu order / hóa đơn nhiệt                                                        | POS / KDS          | Kỹ thuật/QL | Quan trọng     |
| 102 | Tích hợp bên ngoài | Cổng thanh toán điện tử                 | VNPay, Momo, ZaloPay, thẻ… — **kết nối ngoài duy nhất liên quan tiền**                | POS / Web Order QR | Kỹ thuật/QL | Bắt buộc (MVP) |
| 103 | Tích hợp bên ngoài | NCC hóa đơn điện tử                     | MISA meInvoice, Viettel S-Invoice, VNPT… — **kết nối ngoài còn lại ngoài thanh toán** | POS                | Kế toán/QL  | Quan trọng     |
| 104 | Vận hành & an toàn | Sao lưu dữ liệu tự động                 | Backup định kỳ nội bộ/máy chủ riêng; không đẩy ra dịch vụ ngoài                       | Hệ thống           | Kỹ thuật    | Quan trọng     |
| 105 | Vận hành & an toàn | Phân quyền truy cập dữ liệu nghiêm ngặt | Dữ liệu chỉ nội bộ; không chia sẻ/đồng bộ ra bên thứ ba ngoài 2 mục trên              | Web Quản trị       | GĐ/CNH      | Bắt buộc (MVP) |

---

## 3. Ma trận phân quyền

Mức quyền: **Toàn quyền** | **Thao tác** | **Chỉ xem** | **Không có**

| Nhóm chức năng                                  | GĐ chuỗi   | Chủ NH     | Quản lý  | TBP      | NVCT (FT)  | NVTV (PT)  |
| ----------------------------------------------- | ---------- | ---------- | -------- | -------- | ---------- | ---------- |
| 1. Tài khoản & Phân quyền                       | Toàn quyền | Toàn quyền | Thao tác | Chỉ xem  | Không có   | Không có   |
| 2. Quản lý chi nhánh / chuỗi                    | Toàn quyền | Thao tác   | Chỉ xem  | Không có | Không có   | Không có   |
| 3. Khu vực – Tầng – Bàn (CRUD, QR)              | Toàn quyền | Toàn quyền | Thao tác | Thao tác | Chỉ xem    | Chỉ xem    |
| 4. Xử lý order tại bàn (QR khách + NV order hộ) | Chỉ xem    | Chỉ xem    | Thao tác | Thao tác | Toàn quyền | Toàn quyền |
| 5. Thực đơn & Sản phẩm (CRUD, giá)              | Toàn quyền | Toàn quyền | Thao tác | Chỉ xem  | Chỉ xem    | Chỉ xem    |
| 6. Kho – Nguyên vật liệu                        | Toàn quyền | Toàn quyền | Thao tác | Thao tác | Chỉ xem    | Không có   |
| 7. Bếp / Bar – KDS                              | Chỉ xem    | Chỉ xem    | Thao tác | Thao tác | Toàn quyền | Toàn quyền |
| 8. Thanh toán & Hóa đơn                         | Chỉ xem    | Chỉ xem    | Thao tác | Thao tác | Thao tác   | Chỉ xem    |
| 9. Khuyến mãi & Mã giảm giá (tạo mới)           | Toàn quyền | Toàn quyền | Thao tác | Không có | Không có   | Không có   |
| 10. Ca làm & Chấm công (bản thân)               | Thao tác   | Thao tác   | Thao tác | Thao tác | Thao tác   | Thao tác   |
| 10b. Duyệt ca / Chấm công (toàn bộ NV)          | Toàn quyền | Toàn quyền | Thao tác | Thao tác | Không có   | Không có   |
| 11. Doanh thu – Báo cáo – PnL (toàn chuỗi)      | Toàn quyền | Chỉ xem    | Không có | Không có | Không có   | Không có   |
| 11b. Doanh thu – Báo cáo (1 chi nhánh)          | Chỉ xem    | Toàn quyền | Thao tác | Chỉ xem  | Không có   | Không có   |
| 12. Khách hàng thân thiết (CRM)                 | Toàn quyền | Toàn quyền | Thao tác | Chỉ xem  | Chỉ xem    | Không có   |
| 13. Thông báo & Tương tác realtime              | Chỉ xem    | Chỉ xem    | Thao tác | Thao tác | Thao tác   | Thao tác   |
| 14. Cấu hình hệ thống & Tích hợp                | Toàn quyền | Thao tác   | Chỉ xem  | Không có | Không có   | Không có   |

### Chú giải mức quyền

| Mức            | Ý nghĩa                                                               |
| -------------- | --------------------------------------------------------------------- |
| **Toàn quyền** | Xem, thêm, sửa, xóa, duyệt/cấu hình                                   |
| **Thao tác**   | Thêm/sửa trong phạm vi công việc; không xóa / không cấu hình hệ thống |
| **Chỉ xem**    | Xem báo cáo/dữ liệu; không chỉnh sửa                                  |
| **Không có**   | Không truy cập chức năng                                              |

> **Lưu ý:** Bảng trên là đề xuất ban đầu theo mô hình phổ biến — cần điều chỉnh theo quy trình quản trị thực tế (đặc biệt ranh giới quyền giữa Quản lý và Trưởng bộ phận).

---

## 4. Đề xuất giai đoạn (Roadmap)

Đồng bộ với [`Checklist_phat_trien_App_Order_Nha_Hang.md`](./Checklist_phat_trien_App_Order_Nha_Hang.md).

| Giai đoạn                       | Nội dung chính                                                                                                                                                                                                                                                            | Mục tiêu                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Giai đoạn 1 – MVP**           | Tài khoản & phân quyền cơ bản · Chi nhánh/cấu hình thuế · Bàn/QR/floor map/chuyển bàn · Menu & giá · **NV order hộ** · Order QR khách · KDS cơ bản · Thanh toán quầy + KM tối thiểu · Cổng TTĐT · Ca/chấm công/phân công · Báo cáo DT theo thời gian · Thông báo realtime | Vận hành 1 nhà hàng; thay order giấy/gọi miệng bằng NV order hộ và/hoặc khách QR; có DT hàng ngày |
| **Giai đoạn 2 – Chuẩn hóa**     | Ma trận quyền/audit · Ghép/tách bàn · Đặt bàn trước · Combo/86'd · Kho NVL + BOM + COGS · KM đầy đủ · KDS nâng cao/hủy món · Đối soát ca/máy in · PnL & báo cáo phân tích · Duyệt ca/lương                                                                                | Kiểm soát chi phí NVL; tối ưu LN từng món; chuẩn hóa KM & bàn nâng cao                            |
| **Giai đoạn 3 – Mở rộng chuỗi** | Cấu hình/menu đa CN · Dashboard so sánh chuỗi · Chuyển kho/NCC · HĐĐT · CRM + tích điểm · TT tự phục vụ/feedback · KPI NV · Backup                                                                                                                                        | Nhân rộng nhiều CN; giữ chân KH; vẫn khép kín nội bộ                                              |
| **Giai đoạn 4 – Nâng cao**      | Chat nội bộ · Upsale · Đa ngôn ngữ · Đặt cọc bàn · KPI NV nâng cao                                                                                                                                                                                                        | Tối ưu khi hệ thống ổn định; không thêm tích hợp ngoài mới                                        |

---

## 5. Thống kê & đồng bộ checklist

| Độ ưu tiên     | Số STT | Giai đoạn chính trên checklist |
| -------------- | ------ | ------------------------------ |
| Bắt buộc (MVP) | 40     | GĐ1 (khớp 1–1 với các STT GĐ1) |
| Quan trọng     | 43     | Chủ yếu GĐ2; một phần GĐ3      |
| Nên có         | 16     | Chủ yếu GĐ3                    |
| Giai đoạn sau  | 6      | GĐ3–GĐ4                        |

Phân bổ STT theo checklist: **GĐ1 = 40** · **GĐ2 = 36** · **GĐ3 = 25** · **GĐ4 = 4** (bước 4.5 mở rộng STT 82, không tạo STT mới).

- Tổng **105 STT** — mỗi STT xuất hiện **đúng một lần** trên checklist (checkbox).
- Chi tiết bước / nghiệm thu: xem checklist.
- Phân quyền vai trò: xem mục 3 (nhóm 4 đã đổi tên “QR khách + NV order hộ”).

---

_Nguồn gốc Excel: `Yeu_cau_chuc_nang_App_Order_Nha_Hang.xlsx`. STT đánh số liên tục 1–105 (NV order hộ = **STT 21**). Độ ưu tiên vài mục (kho, BOM, ghép/tách bàn, KM theo thời gian, P&L) đã chỉnh khớp roadmap/checklist._
