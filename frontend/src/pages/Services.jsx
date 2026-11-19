import React from 'react';
import { Link } from 'react-router-dom';

export default function Services() {
  const servicesList = [
    {
      id: 1,
      title: "فحص الروابط والنطاقات (URLs)",
      description: "تحليل الروابط المشبوهة واكتشاف النطاقات المزيفة قبل زيارتها وحماية بياناتك الشخصية.",
      icon: "🔗"
    },
    {
      id: 2,
      title: "تحليل الرسائل والبريد الإلكتروني (LSTM)",
      description: "استخدام نموذج الذكاء الاصطناعي العصبي LSTM لفحص النصوص ورسائل البريد واكتشاف محاولات التصيد الاحتيالي بدقة عالية.",
      icon: "📧"
    },
    {
      id: 3,
      title: "فحص رموز الاستجابة السريعة (QR Code)",
      description: "مسح وتحليل أكواد الـ QR والباركود المستلمة للتأكد من أمان الروابط والمحتويات المخفية بداخلها.",
      icon: "📱"
    },
    {
      id: 4,
      title: "اختبارات الوعي الأمني والتدريب",
      description: "قسم خاص لاختبار مهاراتك في الأمن السيبراني عبر 15 سؤالاً تفاعلياً لرفع مستوى الوعي ضد التهديدات.",
      icon: "🛡️"
    }
  ];

  return (
    <div dir="rtl" style={{ maxWidth: "1000px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h1 style={{ color: "#1F2937", marginBottom: "10px", textAlign: "center" }}>خدمات ومميزات النظام</h1>
      <p style={{ color: "#6B7280", textAlign: "center", marginBottom: "40px" }}>
        تعرف على الأدوات المتقدمة التي يوفرها نظامنا لحمايتك الكاملة من التهديدات الرقمية والهجمات السيبرانية.
      </p>

      {/* شبكة الخدمات */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "25px", marginBottom: "40px" }}>
        {servicesList.map((service) => (
          <div
            key={service.id}
            style={{
              padding: "25px",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              background: "#F9FAFB",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <div style={{ fontSize: "36px" }}>{service.icon}</div>
            <h3 style={{ color: "#17a2b8", fontSize: "18px", margin: "0" }}>{service.title}</h3>
            <p style={{ color: "#4B5563", fontSize: "14px", lineHeight: "1.6", margin: "0" }}>
              {service.description}
            </p>
          </div>
        ))}
      </div>

      {/* أزرار الانتقال السريع */}
      <div style={{ textAlign: "center", display: "flex", justifyContent: "center", gap: "15px", flexWrap: "wrap" }}>
        <Link
          to="/training"
          style={{
            padding: "12px 25px",
            background: "#17a2b8",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold"
          }}
        >
          ابدأ التدريب والاختبار
        </Link>
        <Link
          to="/contact"
          style={{
            padding: "12px 25px",
            background: "#fff",
            color: "#17a2b8",
            border: "2px solid #17a2b8",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: "bold"
          }}
        >
          تواصل معنا للدعم
        </Link>
      </div>
    </div>
  );
}