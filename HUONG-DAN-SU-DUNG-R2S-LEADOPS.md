# Hướng dẫn sử dụng R2S LeadOps

Tài liệu này hướng dẫn cách dùng hệ thống R2S LeadOps — công cụ quản lý lead tuyển sinh cho trung tâm đào tạo. Nội dung viết theo đúng giao diện hiện tại của phần mềm, không mô tả tính năng chưa xây dựng.

## Mục lục

1. [Đăng nhập](#1-đăng-nhập)
2. [Bố cục giao diện chung](#2-bố-cục-giao-diện-chung)
3. [Phân quyền theo vai trò](#3-phân-quyền-theo-vai-trò)
4. [Dashboard](#4-dashboard)
5. [Quản lý Lead](#5-quản-lý-lead)
6. [Chi tiết Lead](#6-chi-tiết-lead)
7. [Cách tính điểm Lead](#7-cách-tính-điểm-lead)
8. [Lịch hẹn của tôi](#8-lịch-hẹn-của-tôi)
9. [Lịch sử chăm sóc](#9-lịch-sử-chăm-sóc)
10. [Báo cáo](#10-báo-cáo)
11. [Chương trình giảm giá](#11-chương-trình-giảm-giá)
12. [Quản lý khóa học](#12-quản-lý-khóa-học)
13. [Nguồn tích hợp](#13-nguồn-tích-hợp)
14. [Cài đặt](#14-cài-đặt)
15. [Hồ sơ cá nhân](#15-hồ-sơ-cá-nhân)
16. [Trang công khai](#16-trang-công-khai)
17. [Xử lý một số tình huống thường gặp](#17-xử-lý-một-số-tình-huống-thường-gặp)

---

## 1. Đăng nhập

Mở trình duyệt, truy cập địa chỉ hệ thống, bấm **Đăng nhập** ở trang chủ. Nhập email và mật khẩu, sau đó bấm **Đăng nhập**.

Nếu chưa nhớ mật khẩu, bấm **Quên mật khẩu?**, nhập email đã đăng ký. Hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu tới email đó (nếu email tồn tại trong hệ thống).

Tài khoản demo (chỉ dùng khi hệ thống còn chạy dữ liệu mẫu, mật khẩu chung là `123456`):

| Vai trò | Email |
|---|---|
| Administrator | admin@r2s.edu.vn |
| Leader Marketing | marketing@r2s.edu.vn |
| Marketing Staff | staff.marketing@r2s.edu.vn |
| Sales/Admissions | tva@r2s.edu.vn |

## 2. Bố cục giao diện chung

Sau khi đăng nhập, màn hình chia làm 3 phần:

- **Sidebar bên trái**: menu điều hướng chính. Danh sách mục hiển thị tùy theo vai trò đăng nhập — xem chi tiết ở [mục 3](#3-phân-quyền-theo-vai-trò).
- **Thanh trên cùng (Topbar)**: chuông thông báo, ảnh đại diện, menu đăng xuất.
- **Vùng nội dung chính**: nơi hiển thị từng trang.

Chuông thông báo báo các sự kiện mới: lead nóng vừa xuất hiện, lead vừa được phân công cho bạn, follow-up sắp đến hạn. Bấm vào một thông báo để đi thẳng đến lead liên quan.

## 3. Phân quyền theo vai trò

Hệ thống có 4 vai trò. Mỗi vai trò nhìn thấy menu và dữ liệu khác nhau.

| Quyền | Administrator | Leader Marketing | Marketing Staff | Sales/Admissions |
|---|---|---|---|---|
| Xem toàn bộ lead | Có | Có | Không | Không (chỉ lead được giao) |
| Xem Dashboard | Có | Có | Có | Không |
| Xem Báo cáo | Có | Có | Có | Không |
| Xem Lịch sử chăm sóc | Có | Có | Không | Có (chỉ lead mình phụ trách) |
| Phân công lead | Có | Có | Không | Không |
| Quản lý nguồn lead | Có | Có | Có | Không |
| Cấu hình chấm điểm | Có | Một phần | Không | Không |
| Quản lý tài khoản, xem nhật ký hệ thống | Có | Không | Không | Không |
| Xuất dữ liệu CSV | Có | Có | Không | Không |
| Quản lý chương trình giảm giá | Có | Có | Không | Không |
| Cấu hình webhook (Nguồn tích hợp) | Có | Không | Không | Không |

Sales/Admissions đăng nhập vào sẽ được đưa thẳng vào trang **Leads** (không có quyền vào Dashboard), và trong trang Leads chỉ nhìn thấy các lead được phân công cho mình.

## 4. Dashboard

Trang Dashboard chỉ hiển thị với Administrator, Leader Marketing và Marketing Staff.

Góc trên bên phải có ô chọn khoảng thời gian (1 ngày, 7 ngày, 15 ngày, 30 ngày, hoặc tất cả). Bốn thẻ số liệu chính — **Lead mới**, **Lead nóng**, **Đã đặt cọc**, **Đã đăng ký** — thay đổi theo khoảng thời gian đã chọn, kèm phần trăm tăng/giảm so với kỳ trước đó. Riêng thẻ **Tổng lead** và mục **Lead cần xử lý ngay** luôn tính trên toàn bộ dữ liệu, không phụ thuộc bộ lọc thời gian.

Bấm vào bất kỳ thẻ số liệu nào sẽ mở ra danh sách lead tương ứng, ví dụ bấm vào "Lead nóng" sẽ liệt kê đúng các lead đang ở mức điểm nóng.

Bên dưới là biểu đồ lead theo ngày, biểu đồ phân loại nóng/ấm/lạnh, và danh sách lead cần xử lý ngay (lead nóng chưa được liên hệ, hoặc đã quá hạn follow-up).

## 5. Quản lý Lead

Đường dẫn: **Leads** trên sidebar.

### Tìm và lọc

Ô tìm kiếm phía trên lọc theo tên, số điện thoại hoặc email. Hai hàng nút lọc nhanh theo **Trạng thái** (Lead mới, Đã liên hệ, Đang tư vấn, Đang cân nhắc, Đã đặt cọc, Đã đăng ký) và theo **Phân loại** (Lead nóng, Lead ấm, Lead lạnh).

Bấm **Bộ lọc nâng cao** để mở thêm các lựa chọn: khoảng ngày tạo, khoảng điểm số, chỉ hiện lead quá hạn follow-up, khóa học, nguồn, người phụ trách. Bấm **Xóa lọc** để về lại danh sách đầy đủ.

### Sắp xếp và phân trang

Bấm vào tiêu đề một cột (Họ tên, Điểm, Ngày tạo...) để sắp xếp. Bấm lần một để sắp giảm dần, lần hai để tăng dần, lần ba để bỏ sắp xếp. Danh sách hiển thị 6 lead mỗi trang, dùng nút mũi tên ở cuối bảng để chuyển trang.

### Thêm lead mới

Bấm **Thêm lead**, điền họ tên, số điện thoại, và ít nhất một trong hai: email hoặc nguồn lead. Các trường còn lại (khóa học quan tâm, người phụ trách, trường học, thành phố, mục tiêu học tập...) không bắt buộc. Bấm **Lưu** để tạo lead.

### Nhập lead từ file CSV

Bấm **Nhập CSV**, chọn file theo đúng mẫu cột của hệ thống (họ tên, số điện thoại là bắt buộc). Hệ thống kiểm tra định dạng số điện thoại và email trước khi nhập, dòng nào lỗi sẽ được báo rõ số dòng và lý do, dòng hợp lệ vẫn được nhập bình thường.

### Xuất CSV

Bấm **Xuất CSV** để tải về đúng danh sách lead đang hiển thị trên màn hình (đã áp bộ lọc, tìm kiếm hiện tại). Quyền này chỉ dành cho Administrator và Leader Marketing.

### Liên hệ nhanh

Mỗi dòng lead có 3 icon: gọi điện, gửi email, nhắn Zalo. Icon bị mờ nếu lead chưa có số điện thoại hoặc email tương ứng.

### Lưu trữ lead

Bấm icon lưu trữ ở cuối dòng để chuyển lead sang danh sách lưu trữ (dùng cho lead không còn theo dõi tiếp, ví dụ đã từ chối hẳn hoặc thông tin sai). Có nút riêng để xem lại danh sách đã lưu trữ và khôi phục khi cần.

## 6. Chi tiết Lead

Bấm vào một dòng lead trong danh sách để mở trang chi tiết.

### Đổi trạng thái

Trạng thái đi theo thứ tự: Lead mới → Đã liên hệ → Đang tư vấn → Đang cân nhắc → Đã đặt cọc → Đã đăng ký. Chọn trạng thái mới trong ô dropdown ở đầu trang, hệ thống tự ghi lại thời điểm đổi vào lịch sử chăm sóc.

### Phân công / chuyển người phụ trách

Bấm icon phân công cạnh tên nhân viên phụ trách, chọn một Sales trong danh sách. Chỉ Administrator và Leader Marketing có quyền này.

### Ghi nhận hoạt động chăm sóc

Bấm **Thêm hoạt động**, chọn loại hoạt động (Gọi điện, Messenger, Zalo, Email, Tư vấn trực tiếp, Họp online, Gửi tài liệu, Hẹn gọi lại, Ghi chú nội bộ), nhập nội dung và chọn kết quả (Không nghe máy, Đã kết nối, Cần tư vấn thêm, Hẹn gọi lại, Đang cân nhắc, Đồng ý đặt cọc, Không phù hợp). Hoạt động này xuất hiện ngay trong khung **Lịch sử chăm sóc** bên phải màn hình và cả ở trang Lịch sử chăm sóc chung.

### Đặt lịch hẹn tư vấn và đặt lịch follow-up

Hai chức năng riêng biệt:

- **Đặt lịch hẹn tư vấn**: tạo một buổi hẹn cụ thể (ngày giờ, ghi chú), xuất hiện trong trang Lịch hẹn của tôi.
- **Đặt lịch follow-up**: chỉ đặt một mốc thời gian cần liên hệ lại, không phải một buổi hẹn chính thức. Lead quá hạn follow-up sẽ được liệt kê trong mục "Lead cần xử lý ngay" ở Dashboard.

### Chỉnh bảng điểm

Bấm **Chỉnh sửa bảng điểm** để tick/bỏ tick từng tiêu chí chấm điểm. Điểm và phân loại (nóng/ấm/lạnh) cập nhật ngay sau khi lưu. Toàn bộ thay đổi điểm được lưu vào mục "Lịch sử thay đổi điểm".

### Học phí và áp mã giảm giá

Nếu lead đã chọn khóa học, hệ thống tự lấy học phí từ trang Quản lý khóa học. Nếu có mã voucher còn hiệu lực và phù hợp điều kiện (đúng khóa học, đúng trạng thái lead yêu cầu), khung nhập mã sẽ hiện số tiền được giảm ngay khi gõ đúng mã, trước khi bấm áp dụng.

### Sửa thông tin cá nhân

Bấm icon bút chì cạnh tên lead để sửa họ tên, số điện thoại, email.

## 7. Cách tính điểm Lead

Điểm lead từ 0 đến 100, cộng dồn từ 4 nhóm, trừ đi các tín hiệu tiêu cực nếu có.

**Nhóm A — Mức độ phù hợp với khóa học (tối đa 25 điểm)**: mỗi tiêu chí 5 điểm — xác định rõ khóa học quan tâm, thuộc đúng nhóm đối tượng, đã có kiến thức nền, có mục tiêu nghề nghiệp rõ ràng, lịch học phù hợp.

**Nhóm B — Ý định và thời gian đăng ký (tối đa 30 điểm, chỉ chọn một mức)**: muốn đăng ký trong 7 ngày (30đ), trong 30 ngày (20đ), trong 1–3 tháng (10đ), chưa xác định (0đ), chưa có nhu cầu trong 6 tháng (-10đ).

**Nhóm C — Mức độ tương tác (tối đa 25 điểm)**: điền đầy đủ liên hệ (5đ), tải 1 tài liệu (3đ), tải từ 2 tài liệu (5đ), phản hồi Messenger/Zalo (5đ), mở hoặc phản hồi email (3đ), xem lại landing page hoặc gửi form lần hai (5đ), tham gia workshop (7đ), chủ động nhắn tin hỏi thông tin (8đ).

**Nhóm D — Tín hiệu mua hàng (tối đa 20 điểm)**: hỏi học phí (5đ), hỏi lịch khai giảng (5đ), hỏi chính sách đóng học phí (5đ), yêu cầu tư vấn 1-1 (8đ), đặt lịch tư vấn (10đ), gửi CV hoặc yêu cầu đánh giá lộ trình (7đ), xác nhận muốn giữ chỗ (15đ).

**Nhóm E — Điểm trừ**: số điện thoại/email không hợp lệ (-20đ), không phản hồi sau 3 lần liên hệ (-10đ), thông báo không có nhu cầu (-30đ), chỉ tìm tài liệu (-15đ), lịch học không phù hợp (-10đ), lead giả hoặc spam (-100đ).

Phân loại theo tổng điểm:

| Phân loại | Khoảng điểm | Hành động đề xuất |
|---|---|---|
| Lead nóng | 70–100 | Liên hệ ưu tiên ngay |
| Lead ấm | 40–69 | Tư vấn và tiếp tục nurturing |
| Lead lạnh | 1–39 | Nuôi dưỡng bằng tài liệu, nội dung |

Chỉ Administrator được đổi trọng số các tiêu chí này; Leader Marketing chỉ được sửa một phần.

## 8. Lịch hẹn của tôi

Đường dẫn: **Lịch hẹn của tôi**. Liệt kê các buổi hẹn tư vấn đã đặt cho lead do bạn phụ trách, sắp xếp theo thời gian gần nhất. Bấm vào một lịch hẹn để sang thẳng trang chi tiết lead đó.

## 9. Lịch sử chăm sóc

Đường dẫn: **Lịch sử chăm sóc**. Trang này tổng hợp mọi hoạt động chăm sóc từ tất cả lead, lọc được theo nhân viên, loại hoạt động (Gọi điện, Email/Tài liệu, Chuyển trạng thái, Tạo lead, Đặt cọc, Đăng ký khóa học, Khác), và khoảng thời gian (hôm nay, 7 ngày qua, 30 ngày qua, tất cả).

Sales/Admissions chỉ thấy lịch sử của các lead mình phụ trách.

## 10. Báo cáo

Đường dẫn: **Báo cáo**. Bao gồm:

- **Xu hướng chuyển đổi**: biểu đồ đường theo tháng, so sánh số lead mới với số đã đăng ký.
- **Hiệu quả nguồn lead**: biểu đồ cột theo từng nguồn (Facebook Ads, Google Ads, TikTok Ads, Landing Page...). Bấm vào một cột để xem danh sách lead của nguồn đó.
- **Phân loại lead**: tỷ lệ nóng/ấm/lạnh trong khoảng thời gian đã chọn. Bấm vào một dòng để xem danh sách lead thuộc phân loại đó.
- **Phễu chuyển đổi**: số lead ở từng bước, từ Lead mới đến Đã đăng ký. Bấm vào một bước để xem danh sách lead đang ở bước đó.
- **Hiệu quả voucher**: bảng liệt kê số lượt dùng và tổng tiền đã giảm của từng mã, chỉ hiện các mã đã được dùng ít nhất một lần.

Ô chọn khoảng thời gian ở góc trên áp dụng cho tất cả mục trừ "Xu hướng chuyển đổi" (mục này luôn tính theo tháng). Nút **Xuất báo cáo** tải về CSV số liệu lead theo ngày.

## 11. Chương trình giảm giá

Đường dẫn: **Chương trình giảm giá**. Chỉ Administrator và Leader Marketing truy cập được.

Bấm **Tạo voucher**, nhập mã (ví dụ SUMMER500K), chọn loại giảm giá — phần trăm học phí hoặc số tiền cố định — và giá trị giảm. Có thể giới hạn voucher chỉ áp dụng cho một khóa học cụ thể, giới hạn số lần sử dụng, và đặt ngày bắt đầu/kết thúc.

Mỗi voucher hiển thị trạng thái tự động theo ngày hết hạn (Đang chạy / Sắp hết hạn / Đã hết hạn). Bấm vào số lượt dùng của một voucher để xem danh sách lead đã áp mã đó, kèm số tiền đã giảm và người đã áp.

## 12. Quản lý khóa học

Đường dẫn: **Quản lý khóa học**. Đây là nơi lưu duy nhất thông tin học phí — LeadDetail lấy học phí từ đây để tính tổng tiền cuối cùng của lead. Bấm **Thêm khóa học** hoặc bấm icon sửa trên một dòng để cập nhật tên khóa học và học phí.

## 13. Nguồn tích hợp

Đường dẫn: **Nguồn tích hợp**. Chỉ Administrator truy cập được.

Trang này tạo lead tự động từ Google Form thông qua Google Apps Script. Các bước:

1. Bấm **Sao chép mã token** để lấy secret token của hệ thống.
2. Trong Google Form, mở **Tiện ích mở rộng → Apps Script**, dán đoạn mã mẫu hiển thị sẵn trên trang (đã điền sẵn token và URL webhook).
3. Trong đoạn mã, sửa lại tên các câu hỏi trong ngoặc kép (`"Họ và tên"`, `"Số điện thoại"`, `"Email"`, `"Khóa học quan tâm"`, `"Thành phố"`) cho khớp đúng với câu hỏi thật trong form.
4. Lưu và cấp quyền chạy script khi được Google Form yêu cầu.

Mỗi lần có người nộp form, một lead mới xuất hiện trong hệ thống với nguồn "Google Form". Bên dưới trang có bảng log các lần webhook được gọi, gồm cả những lần lỗi để kiểm tra nếu cấu hình sai. Bấm **Tạo lại token** nếu nghi ngờ token bị lộ — sau khi tạo lại, phải dán token mới vào lại đoạn mã Apps Script.

## 14. Cài đặt

Đường dẫn: **Cài đặt**. Chỉ Administrator truy cập được, chia làm 5 tab:

- **Quản lý tài khoản**: tạo tài khoản nhân viên mới, khóa/mở khóa tài khoản, đặt lại mật khẩu, xem chi tiết một tài khoản (gồm số lead đang phụ trách nếu là Sales).
- **Phân quyền**: bảng hiển thị quyền của từng vai trò, chỉ để tham khảo, không chỉnh sửa trực tiếp trên bảng này.
- **Nhật ký hoạt động**: log các thao tác quan trọng trong hệ thống (tạo tài khoản, khóa tài khoản, đổi cấu hình...).
- **Thông báo**: cấu hình loại thông báo nào được bật.
- **Kết nối**: rút gọn của trang Nguồn tích hợp.

## 15. Hồ sơ cá nhân

Đường dẫn: bấm ảnh đại diện ở Topbar → **Hồ sơ**. Xem và sửa thông tin cá nhân (tên, số điện thoại), đổi mật khẩu.

## 16. Trang công khai

Hai trang không cần đăng nhập:

- **Trang chủ** (`/`): giới thiệu sản phẩm, có nút Đăng nhập.
- **Đăng ký tư vấn** (`/consultation`): form công khai cho người có nhu cầu học để lại thông tin, dùng khi chia sẻ link trực tiếp thay vì qua Google Form.

## 17. Xử lý một số tình huống thường gặp

**Không thấy menu Dashboard/Báo cáo/Cài đặt**: tài khoản đang đăng nhập là Sales/Admissions hoặc Marketing Staff, hai vai trò này không có quyền vào các trang đó — xem lại bảng ở [mục 3](#3-phân-quyền-theo-vai-trò).

**Nhập CSV báo lỗi một số dòng**: mở file, kiểm tra lại cột số điện thoại và email đúng định dạng ở đúng những dòng được báo số thứ tự. Các dòng còn lại vẫn được nhập, không cần sửa hết file rồi nhập lại từ đầu.

**Voucher không áp được cho lead**: kiểm tra 3 điều kiện — mã còn hạn dùng, đúng khóa học đã giới hạn (nếu voucher chỉ áp cho 1 khóa), và lead chưa từng áp voucher khác trước đó.

**Webhook Google Form không tạo lead**: mở lại bảng log ở trang Nguồn tích hợp, xem dòng lỗi gần nhất ghi lý do gì. Lỗi thường gặp là tên câu hỏi trong đoạn mã Apps Script không khớp tên câu hỏi thật trong form, hoặc token đã bị tạo lại nhưng chưa cập nhật vào script.