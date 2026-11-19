import React, { useState } from "react";

// قائمة الـ 15 سؤالاً حول كشف التصيد والأمن السيبراني
const questions = [
  {
    id: 1,
    question: "تلقيت رسالة بريد إلكتروني من البنك يطلب منك تحديث كلمة المرور عبر رابط مباشر. ماذا تفعل؟",
    options: [
      "أضغط على الرابط وأقوم بالتحديث فوراً",
      "أتحقق من عنوان البريد الإلكتروني الحقيقي للمرسل ولا أضغط على الرابط",
      "أقوم بمشاركة الرابط مع أصدقائي للتأكد"
    ],
    answer: 1
  },
  {
    id: 2,
    question: "ما هو المعيار الأمني الأهم للرابط الإلكتروني الآمن؟",
    options: ["يبدأ بـ http://", "يحتوي على أرقام كثيرة", "يبدأ بـ https:// ورمز القفل"],
    answer: 2
  },
  {
    id: 3,
    question: "ما هو مفهوم التصيد الاحتيالي (Phishing)؟",
    options: [
      "نوع من الألعاب الإلكترونية",
      "محاولة خداع لسرقة المعلومات الحساسة مثل كلمات المرور والبطاقات",
      "برنامج لتسريع جهاز الكمبيوتر"
    ],
    answer: 1
  },
  {
    id: 4,
    question: "إذا وصلك QR Code مجهول المصدر في مكان عام، هل تقوم بمسحه عشوائياً؟",
    options: ["نعم، دائماً", "لا، فقد يوجهني إلى موقع خبيث", "فقط إذا كان ملوناً"],
    answer: 1
  },
  {
    id: 5,
    question: "أي من كلمات المرور التالية تعتبر الأقوى والأكثر أماناً؟",
    options: ["12345678", "password", "P@ssw0rd!#2026_Secure"],
    answer: 2
  },
  {
    id: 6,
    question: "ما هي ميزة التحقق بخطوتين (2FA)؟",
    options: [
      "تزيد الحماية عبر طلب وسيلة تحقق ثانية بجانب كلمة المرور",
      "تمنع الإنترنت من قطع الاتصال",
      "تسرع تسجيل الدخول"
    ],
    answer: 0
  },
  {
    id: 7,
    question: "إذا لاحظت سلوكاً غريباً في حسابك البنكي، ما أول خطوة تقم بها؟",
    options: ["تغيير كلمة المرور والاتصال بالبنك فوراً", "حذف التطبيق وإعادة تثبيته", "الانتظار لنهاية اليوم"],
    answer: 0
  },
  {
    id: 8,
    question: "ما هو البريد العشوائي (Spam) الضار؟",
    options: ["رسائل تسويقية عادية فقط", "رسائل قد تحتوي على مرفقات خبيثة أو روابط تصيد", "رسائل من إدارة الشركة"],
    answer: 1
  },
  {
    id: 9,
    question: "لماذا يُنصح بعدم استخدام نفس كلمة المرور لكل حساباتك؟",
    options: [
      "لأن تذكرها صعب",
      "لأنه في حال اختراق موقع واحد، ستكون كل حساباتك الأخرى معرضة للخطر",
      "لا يوجد ضرر في ذلك"
    ],
    answer: 1
  },
  {
    id: 10,
    question: "ماذا تفعل إذا فتحت مرفقاً في بريد إلكتروني مشبوه وبدأ الجهاز يتصرف بغرابة؟",
    options: ["افصل الإنترنت فوراً وأبلغ قسم تقنية المعلومات", "أغلق المتصفح واستمر في العمل", "أعد تشغيل الجهاز فقط"],
    answer: 0
  },
  {
    id: 11,
    question: "ما هي الهندسة الاجتماعية (Social Engineering) في الأمن السيبراني؟",
    options: [
      "تصميم شبكات التواصل الاجتماعي",
      "خداع الأشخاص نفسياً لدفعهم لتسليم معلومات سرية",
      "إصلاح الأعطال البرمجية"
    ],
    answer: 1
  },
  {
    id: 12,
    question: "هل برامج مكافحة الفيروسات وحدها كافية لحمايتك من التصيد الاحتيالي؟",
    options: ["نعم، تحمي بنسبة 100%", "لا، الوعي البشري والحذر هما خط الدفاع الأول", "فقط على الهواتف الذكية"],
    answer: 1
  },
  {
    id: 13,
    question: "كيف تتأكد من هوية جهة اتصال تزعم أنها تدعمك فنياً عبر الهاتف وتطلب كلمة المرور؟",
    options: ["تعطيهم الكود فوراً لأنهم من الدعم الفني", "ترفض إعطاء أي كلمات مرور وتتصل بالرقم الرسمي للشركة", "تغلق الهاتف ولا تهتم"],
    answer: 1
  },
  {
    id: 14,
    question: "ماذا تعني شهادة الأمان (SSL Certificate) لموقع إلكتروني؟",
    options: [
      "أن الموقع مشفر وآمن لتبادل البيانات",
      "أن الموقع مجاني",
      "أن الموقع مملوك للحكومة"
    ],
    answer: 0
  },
  {
    id: 15,
    question: "ما هي أفضل ممارسة لتخزين كلمات المرور الخاصة بك؟",
    options: [
      "كتابتها على ورقة بجانب الشاشة",
      "حفظها في ذاكرة المتصفح فقط بدون حماية",
      "استخدام برنامج موثوق لإدارة كلمات المرور (Password Manager)"
    ],
    answer: 2
  }
];

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);

  const handleOptionSelect = (optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: optionIndex
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateScore();
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.answer) {
        correctCount++;
      }
    });
    setScore(correctCount);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setScore(null);
  };

  return (
    <div dir="rtl" style={{ maxWidth: "700px", margin: "40px auto", padding: "25px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h2 style={{ color: "#17a2b8", textAlign: "center", marginBottom: "20px" }}>اختبار الوعي الأمني وكشف التصيد</h2>

      {score !== null ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <h3>نتيجتك النهائية: {score} من {questions.length}</h3>
          <p style={{ margin: "15px 0", fontSize: "18px", color: score >= 12 ? "#10B981" : "#EF4444" }}>
            {score >= 12 ? "ممتاز! لديك وعي أمني عالٍ جداً ضد التهديدات." : "تحتاج إلى مراجعة مبادئ الحماية والأمان السيبراني لتجنب محاولات التصيد."}
          </p>
          <button
            onClick={restartQuiz}
            style={{ padding: "10px 25px", background: "#17a2b8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            إعادة الاختبار
          </button>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "15px", fontSize: "14px", color: "#6B7280" }}>
            السؤال {currentQuestion + 1} من {questions.length}
          </div>
          <h4 style={{ marginBottom: "20px", color: "#1F2937" }}>{questions[currentQuestion].question}</h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "25px" }}>
            {questions[currentQuestion].options.map((option, index) => (
              <label
                key={index}
                style={{
                  padding: "12px 15px",
                  border: selectedAnswers[currentQuestion] === index ? "2px solid #17a2b8" : "1px solid #E5E7EB",
                  borderRadius: "6px",
                  background: selectedAnswers[currentQuestion] === index ? "#F0FDFA" : "#F9FAFB",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  checked={selectedAnswers[currentQuestion] === index}
                  onChange={() => handleOptionSelect(index)}
                />
                {option}
              </label>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion] === undefined}
            style={{
              padding: "10px 30px",
              background: selectedAnswers[currentQuestion] !== undefined ? "#17a2b8" : "#9CA3AF",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: selectedAnswers[currentQuestion] !== undefined ? "pointer" : "not-allowed",
              fontWeight: "bold",
              float: "left"
            }}
          >
            {currentQuestion === questions.length - 1 ? "إظهار النتيجة" : "السؤال التالي"}
          </button>
        </div>
      )}
    </div>
  );
}