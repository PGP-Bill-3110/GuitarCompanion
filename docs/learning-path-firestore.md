# GuitarCompanion — Learning Path (MVP)

## Tính năng đã thêm
- Practice → Beginner Learning Path (12 bài / 4 module)
- Learning Path: tổng tiến độ, gợi ý bài tiếp theo, trạng thái từng bài
- Lesson Detail: mục tiêu, kiến thức, 3 nhiệm vụ tự đánh dấu, quiz 1 câu
- Lưu Firestore theo tài khoản ở `users/{uid}/learningProgress/{lessonId}`
- Trạng thái: `in_progress`, `completed`. Trang không lưu tiến độ nếu khách chưa đăng nhập.
- Chưa có AI chấm bài học; quiz do ứng dụng kiểm tra, nhiệm vụ thực hành do người học xác nhận.
- Rhythm Trainer liên kết từ Lesson Detail qua tham số `lesson`. Người đã đăng nhập có thể **chủ động lưu điểm TAP** sau một lượt 4 ô nhịp. Các trường `rhythmLastScore`, `rhythmBestScore`, `rhythmAttempts`, `rhythmLastBpm`, `rhythmLastPatternId`, `rhythmLastAtMs` được ghi vào cùng tài liệu Learning Progress.
- Lưu điểm TAP chỉ đưa bài chưa bắt đầu sang `in_progress`; không tự đánh dấu `completed` và không hạ cấp bài đã hoàn thành. Điểm TAP là ước lượng thời gian bấm, không phải chứng nhận trình độ guitar.

## Quan trọng: cần cấp quyền Firestore (thực hiện trên Firebase Console)

Dự án hiện không có `firestore.rules` hay `firebase.json` trong mã nguồn local. Vì vậy ứng dụng chưa thể tự deploy rules. Mở **Firebase Console → Firestore Database → Rules** và thêm đoạn sau **nằm bên trong `match /users/{userId} { ... }`** (ngang hàng với các khối `practiceSessions`, `recordProjects`, `notifications`), trước khi Publish:

```firestore
match /learningProgress/{lessonId} {
  allow read: if request.auth != null
    && request.auth.uid == userId;

  allow create: if request.auth != null
    && request.auth.uid == userId
    && request.resource.data.lessonId == lessonId
    && request.resource.data.status in ["in_progress", "completed"];

  allow update: if request.auth != null
    && request.auth.uid == userId
    && resource.data.lessonId == lessonId
    && request.resource.data.lessonId == lessonId
    && request.resource.data.status in ["in_progress", "completed"];

  allow delete: if request.auth != null
    && request.auth.uid == userId;
}
```

Không thay thế toàn bộ Rules đang có và không dùng `allow read, write: if true`. Nếu các khối `match /users/{userId}` đang được khai báo nhiều lần, hãy kiểm tra đúng vị trí trước khi Publish. Nếu `users` ở schema của bạn có cấu trúc khác, cần điều chỉnh theo.

## Chạy kiểm tra
```powershell
cd C:\GuitarCompanion
npx tsc --noEmit
npx expo start --web --port 8081
```

## Kiểm thử giao diện
1. Đăng nhập Firebase.
2. Practice → Beginner Learning Path → một bài học.
3. Bấm **Bắt đầu bài học** → kiểm tra trạng thái `Đang học`.
4. Đánh dấu đủ 3 nhiệm vụ → trả lời đúng câu quiz → **Hoàn thành bài học**.
5. Quay lại Learning Path: số bài hoàn thành tăng; F5: vẫn giữ trạng thái.
6. Đăng nhập tài khoản khác: tiến độ phải tách biệt.
7. Từ bài `count-four`, mở Rhythm Trainer, TAP trong 4 ô nhịp và bấm **Lưu kết quả vào bài học**. Quay lại bài học để kiểm tra điểm tốt nhất và số lượt; F5 phải giữ kết quả.
8. Lưu nhiều lần để kiểm tra điểm tốt nhất không giảm. Bài đã hoàn thành không được trở về trạng thái đang học sau khi lưu TAP.
9. Nếu thấy “Missing or insufficient permissions”: chưa áp dụng đúng Firestore Rules hoặc Rules hiện có không cho phép các trường `rhythm*`.

## Những việc dành cho giai đoạn sau
- Sơ đồ hợp âm tương tác, tuner/metronome thực, player sheet, bài học có audio/video được cấp quyền.
- Chấm bài tập nốt đơn bằng AI; không gán nhãn 'AI chấm chính xác hợp âm' khi chưa thử nghiệm.
- Duyệt nội dung và cải tiến đánh giá học tập: quiz 1 câu chỉ là kiểm tra nhanh, không chứng nhận kỹ năng thực hành.
