export interface LearningLesson {
  id: string;
  moduleId: string;
  title: string;
  minutes: number;
  level: "Beginner";
  objective: string;
  theory: string[];
  exercises: string[];
  quiz: { question: string; choices: [string, string, string, string]; answer: number; explanation: string };
}

export const learningModules = [
  { id: "foundations", title: "01 · Guitar Fundamentals", description: "Làm quen với đàn, dây và cách giữ nhịp.", icon: "musical-notes" },
  { id: "chords", title: "02 · Basic Chords", description: "Bấm và chuyển những hợp âm cơ bản.", icon: "musical-notes" },
  { id: "rhythm", title: "03 · Rhythm & Strumming", description: "Luyện tiết tấu bằng nhịp đếm và metronome.", icon: "timer" },
  { id: "first-song", title: "04 · First Complete Performance", description: "Ghép hợp âm và nhịp vào một phần đệm hoàn chỉnh.", icon: "trophy" },
] as const;

export const learningLessons: LearningLesson[] = [
  {
    id: "guitar-posture", moduleId: "foundations", title: "Tư thế cầm guitar", minutes: 8, level: "Beginner",
    objective: "Ngồi thoải mái, giữ đàn ổn định và thả lỏng cổ tay.",
    theory: ["Ngồi vững, giữ lưng tự nhiên; đặt thùng đàn trên đùi và để cần đàn hơi hướng lên.", "Tay bấm dùng các đầu ngón để nhấn dây ngay sau phím; tránh gồng vai hoặc cổ tay.", "Tay gảy di chuyển nhẹ qua dây. Nếu đau hoặc tê, dừng và điều chỉnh tư thế."],
    exercises: ["Kiểm tra vai và cổ tay thả lỏng trong 30 giây.", "Gảy từng dây chậm, giữ thùng đàn ổn định.", "Bấm thử một nốt và nghe tiếng dây rõ, không bị rè."],
    quiz: { question: "Điều nào phù hợp khi bắt đầu tập guitar?", choices: ["Gồng chặt cổ tay", "Nhấn dây bằng lòng bàn tay", "Giữ vai và cổ tay thoải mái", "Cúi sát mặt vào cần đàn"], answer: 2, explanation: "Tư thế thoải mái giúp kiểm soát ngón tay và tránh căng cơ." },
  },
  {
    id: "guitar-strings", moduleId: "foundations", title: "Tên sáu dây đàn", minutes: 8, level: "Beginner",
    objective: "Nhớ thứ tự dây từ dày nhất đến mỏng nhất.",
    theory: ["Với guitar lên dây chuẩn, dây 6 đến dây 1 lần lượt là E – A – D – G – B – E.", "Dây 6 thường dày nhất và có âm thấp; dây 1 mỏng nhất và có âm cao.", "Một dây buông là dây được gảy mà không đặt ngón tay bấm lên phím."],
    exercises: ["Chỉ lần lượt dây 6 → 1 và đọc to tên nốt.", "Gảy mỗi dây buông và lắng nghe âm cao dần.", "Không nhìn tài liệu, đọc lại thứ tự E–A–D–G–B–E."],
    quiz: { question: "Dây 2 trong cách lên dây chuẩn là nốt nào?", choices: ["G", "B", "A", "D"], answer: 1, explanation: "Từ dây 6 đến 1 là E–A–D–G–B–E, nên dây 2 là B." },
  },
  {
    id: "tuning-basics", moduleId: "foundations", title: "Lên dây cơ bản", minutes: 10, level: "Beginner",
    objective: "Hiểu thao tác lên dây bằng tuner trước khi tập.",
    theory: ["Tuner giúp xác định nốt và độ lệch cao độ của dây đang gảy.", "Gảy từng dây riêng lẻ và chỉnh khóa từ từ đến khi tuner cho biết đúng nốt.", "Với cách lên dây chuẩn, kiểm tra lần lượt E, A, D, G, B, E từ dây 6 đến dây 1."],
    exercises: ["Mở tuner (hoặc thiết bị lên dây sẵn có).", "Đối chiếu dây 6 với nốt E rồi làm lần lượt đến dây 1.", "Gảy lại sáu dây để xác nhận không bị lệch nhiều."],
    quiz: { question: "Cách nào hợp lý khi chỉnh khóa đàn?", choices: ["Vặn thật nhanh và mạnh", "Chỉnh từ từ, kiểm tra tuner thường xuyên", "Chỉ kiểm tra dây 6", "Không cần gảy dây"], answer: 1, explanation: "Chỉnh từ từ và nghe/nhìn tuner thường xuyên để hạn chế lên dây quá mức." },
  },
  {
    id: "chord-em-am", moduleId: "chords", title: "Hai hợp âm đầu: Em và Am", minutes: 12, level: "Beginner",
    objective: "Bấm được Em, Am và nghe rõ từng dây cần gảy.",
    theory: ["Em thường bấm dây 5 ngăn 2 và dây 4 ngăn 2; có thể gảy cả sáu dây.", "Am thường bấm dây 2 ngăn 1, dây 4 ngăn 2, dây 3 ngăn 2; tránh gảy dây 6.", "Đặt ngón gần phía sau thanh phím để tiếng dây sạch hơn."],
    exercises: ["Bấm Em và gảy chậm từng dây để kiểm tra.", "Chuyển sang Am và kiểm tra từng dây cần gảy.", "Chuyển Em ↔ Am tám lần, ưu tiên đúng ngón hơn tốc độ."],
    quiz: { question: "Khi chơi hợp âm Am cơ bản, bạn thường tránh gảy dây nào?", choices: ["Dây 1", "Dây 3", "Dây 5", "Dây 6"], answer: 3, explanation: "Dạng Am mở thông dụng sử dụng các dây từ dây 5 đến dây 1." },
  },
  {
    id: "chord-c-g", moduleId: "chords", title: "Hợp âm C và G", minutes: 14, level: "Beginner",
    objective: "Làm quen với C, G và chuyển tay có kiểm soát.",
    theory: ["C trưởng dạng mở: dây 2 ngăn 1, dây 4 ngăn 2, dây 5 ngăn 3; thường không gảy dây 6.", "G trưởng có nhiều cách bấm; một dạng phổ biến dùng dây 6 ngăn 3, dây 5 ngăn 2 và dây 1 ngăn 3.", "Tập chuyển hợp âm bằng cách đặt tay chậm, sau đó mới tăng tốc."],
    exercises: ["Bấm C và kiểm tra âm từng dây.", "Bấm G theo sơ đồ hướng dẫn và kiểm tra tiếng đàn.", "Đổi C ↔ G tám lần với nhịp đếm đều."],
    quiz: { question: "Khi học một thế bấm mới, bạn nên làm gì trước?", choices: ["Tăng tốc ngay", "Bấm chậm và kiểm tra từng dây", "Gảy mạnh để át tiếng rè", "Bỏ qua dây phát âm không rõ"], answer: 1, explanation: "Kiểm tra từng dây giúp phát hiện sai ngón và dây bị chặn." },
  },
  {
    id: "chord-d-e-a", moduleId: "chords", title: "Thêm D, E và A", minutes: 14, level: "Beginner",
    objective: "Nhận biết ba hợp âm mở thường gặp và thực hành đổi hợp âm.",
    theory: ["D trưởng dạng mở thông dụng chỉ gảy từ dây 4 đến dây 1.", "E trưởng mở thường gảy cả sáu dây; A trưởng mở thường gảy từ dây 5.", "Tên hợp âm không quyết định duy nhất cách bấm; có thể có nhiều thế bấm."],
    exercises: ["Tập từng hợp âm D, E, A và nghe dây nào phát âm rõ.", "Chuyển A → D → E → A theo nhịp chậm.", "Lặp chuỗi trên ba vòng, không cần tăng tốc vội."],
    quiz: { question: "Với hợp âm D trưởng dạng mở thông dụng, nên bắt đầu gảy từ dây nào?", choices: ["Dây 6", "Dây 5", "Dây 4", "Dây 1"], answer: 2, explanation: "D trưởng mở thông dụng sử dụng dây 4, 3, 2, 1." },
  },
  {
    id: "count-four", moduleId: "rhythm", title: "Đếm nhịp 4/4", minutes: 10, level: "Beginner",
    objective: "Giữ nhịp đều trong ô nhịp 4/4.",
    theory: ["Nhịp 4/4 có bốn phách đen trong một ô nhịp: 1 – 2 – 3 – 4.", "BPM là số phách mỗi phút; 60 BPM tương ứng khoảng một phách mỗi giây.", "Đếm đều thành tiếng giúp liên kết tay gảy với phách."],
    exercises: ["Đếm 1–2–3–4 trong bốn ô nhịp.", "Gõ tay mỗi phách ở 60 BPM.", "Gảy một lần xuống trên mỗi phách, giữ tốc độ ổn định."],
    quiz: { question: "Trong nhịp 4/4, một ô nhịp có bao nhiêu phách đen?", choices: ["2", "3", "4", "6"], answer: 2, explanation: "Số 4 phía trên chỉ bốn phách trong mỗi ô nhịp." },
  },
  {
    id: "eighth-notes", moduleId: "rhythm", title: "Nốt đen và nốt móc đơn", minutes: 12, level: "Beginner",
    objective: "Phân biệt một phách và nửa phách trong bài tập đơn giản.",
    theory: ["Trong nhịp 4/4, nốt đen thường dài một phách.", "Hai nốt móc đơn có tổng thời lượng bằng một phách đen.", "Có thể đếm nốt móc đơn bằng '1 và 2 và 3 và 4 và'."],
    exercises: ["Gõ bốn nốt đen theo metronome.", "Gõ tám nốt móc đơn trong cùng thời gian.", "Chuyển giữa hai nhịp gõ mà không thay đổi BPM."],
    quiz: { question: "Ở cùng một BPM, hai nốt móc đơn bằng thời lượng của mấy nốt đen?", choices: ["Nửa nốt đen", "Một nốt đen", "Hai nốt đen", "Bốn nốt đen"], answer: 1, explanation: "Hai nốt móc đơn có tổng thời lượng bằng một nốt đen." },
  },
  {
    id: "strumming-pattern", moduleId: "rhythm", title: "Mẫu quạt chả cơ bản", minutes: 14, level: "Beginner",
    objective: "Tập mẫu xuống – xuống lên – lên xuống lên theo nhịp đều.",
    theory: ["Ký hiệu D (down) nghĩa là gảy xuống, U (up) nghĩa là gảy lên.", "Một mẫu phổ biến ở nhịp 4/4 là D – D U – U D U, với các khoảng nghỉ cần giữ đúng.", "Chuyển động tay gảy nên liên tục và nhẹ; bắt đầu chậm trước khi tăng BPM."],
    exercises: ["Tập không đàn bằng cách đếm '1 và 2 và 3 và 4 và'.", "Tập mẫu D – D U – U D U với hợp âm Em ở tốc độ chậm.", "Lặp bốn ô nhịp; chú ý các khoảng không gảy."],
    quiz: { question: "Ký hiệu U trong bài tập strumming nghĩa là gì?", choices: ["Gảy lên", "Gảy xuống", "Ngừng hoàn toàn", "Đổi hợp âm"], answer: 0, explanation: "U là upstroke: chuyển động gảy từ các dây cao lên phía các dây trầm." },
  },
  {
    id: "song-progression", moduleId: "first-song", title: "Vòng hợp âm G – Em – C – D", minutes: 14, level: "Beginner",
    objective: "Ghép bốn hợp âm thành một vòng đệm cơ bản.",
    theory: ["Một vòng hợp âm là chuỗi hợp âm được lặp đi lặp lại.", "Vòng G – Em – C – D thường được dùng để luyện chuyển hợp âm.", "Có thể chơi mỗi hợp âm trong một ô nhịp 4/4 khi mới bắt đầu."],
    exercises: ["Chơi G bốn phách, sau đó Em bốn phách.", "Tiếp tục C bốn phách và D bốn phách.", "Ghép G → Em → C → D hai vòng liên tục."],
    quiz: { question: "Trong bài tập G – Em – C – D, hợp âm nào xuất hiện sau Em?", choices: ["D", "Am", "C", "E"], answer: 2, explanation: "Thứ tự vòng luyện tập là G → Em → C → D." },
  },
  {
    id: "smooth-transitions", moduleId: "first-song", title: "Chuyển hợp âm cùng metronome", minutes: 12, level: "Beginner",
    objective: "Chuyển hợp âm đúng thời điểm thay vì chỉ chơi nhanh.",
    theory: ["Metronome phát phách đều để bạn kiểm soát thời điểm chuyển hợp âm.", "Bạn có thể đặt 60 BPM và giữ mỗi hợp âm bốn phách.", "Nếu không theo kịp, giảm BPM và luyện lại phần chuyển tay khó."],
    exercises: ["Chơi vòng G – Em – C – D ở 60 BPM.", "Thử bốn vòng không ngừng.", "Ghi nhận chuyển hợp âm nào còn chậm để luyện riêng."],
    quiz: { question: "Nếu liên tục trễ nhịp khi chuyển hợp âm, giải pháp phù hợp nhất là gì?", choices: ["Tăng BPM", "Bỏ qua một hợp âm", "Giảm BPM và luyện phần chuyển khó", "Gảy mạnh hơn"], answer: 2, explanation: "Giảm tốc độ giúp luyện chuyển tay đúng nhịp trước khi tăng tốc." },
  },
  {
    id: "first-performance", moduleId: "first-song", title: "Bài biểu diễn đầu tiên", minutes: 16, level: "Beginner",
    objective: "Chơi một đoạn đệm ngắn 16 ô nhịp và tự đánh giá.",
    theory: ["Chơi G – Em – C – D bốn vòng sẽ tạo thành 16 ô nhịp nếu mỗi hợp âm giữ một ô.", "Hãy ưu tiên giữ nhịp đều và âm thanh rõ hơn là tốc độ.", "Có thể dùng tính năng Record của GuitarCompanion để nghe lại; bài này chưa có chấm điểm AI tự động."],
    exercises: ["Lên dây và kiểm tra tư thế trước khi bắt đầu.", "Chơi đủ bốn vòng G – Em – C – D không dừng.", "Ghi âm lại, nghe và ghi chú một điểm bạn muốn cải thiện."],
    quiz: { question: "Nếu mỗi hợp âm chiếm một ô nhịp, chơi G – Em – C – D bốn vòng sẽ có bao nhiêu ô nhịp?", choices: ["4", "8", "12", "16"], answer: 3, explanation: "4 hợp âm × 4 vòng = 16 ô nhịp." },
  },
];

export function getLearningLesson(id: string) {
  return learningLessons.find((lesson) => lesson.id === id);
}
