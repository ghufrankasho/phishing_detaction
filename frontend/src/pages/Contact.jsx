import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // محاكاة إرسال الرسالة للخادم (يمكنك ربطها بـ API الخاص بك لاحقاً)
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1000);
  };

  return (
    <div dir="rtl" style={{ maxWidth: "900px", margin: "40px auto", padding: "30px", background: "#fff", borderRadius: "10px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
      <h1 style={{ color: "#1F2937", marginBottom: "10px", textAlign: "center" }}>تواصل معنا</h1>
      <p style={{ color: "#6B7280", textAlign: "center", marginBottom: "30px" }}>
        نحن هنا لمساعدتك والإجابة على أي استفسار يتعلق بنظام كشف التصيد الاحتيالي والأمن السيبراني.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "40px" }}>
        
        {/* معلومات الاتصال */}
        <div>
          <h3 style={{ color: "#17a2b8", marginBottom: "20px" }}>معلومات الاتصال</h3>
          
          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ color: "#1F2937", marginBottom: "5px" }}>البريد الإلكتروني:</h5>
            <p style={{ color: "#4B5563" }}>support@phishing-detector.local</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ color: "#1F2937", marginBottom: "5px" }}>الهاتف والدعم الفني:</h5>
            <p style={{ color: "#4B5563" }}>+963 11 000 0000</p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h5 style={{ color: "#1F2937", marginBottom: "5px" }}>العنوان:</h5>
            <p style={{ color: "#4B5563" }}>دمشق، سوريا - جامعة دمشق</p>
          </div>
        </div>

        {/* نموذج الإرسال */}
        <div>
          {submitted ? (
            <div style={{ padding: "20px", background: "#F0FDFA", border: "1px solid #10B981", borderRadius: "8px", textAlign: "center" }}>
              <h4 style={{ color: "#10B981", marginBottom: "10px" }}>تم إرسال رسالتك بنجاح!</h4>
              <p style={{ color: "#4B5563" }}>شكراً لتواصلك معنا، سنقوم بالرد عليك في أقرب وقت ممكن.</p>
              <button
                onClick={() => setSubmitted(false)}
                style={{ marginTop: "15px", padding: "8px 20px", background: "#17a2b8", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
              >
                إرسال رسالة أخرى
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#374151", fontWeight: "500" }}>الاسم الكامل</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                  placeholder="أدخل اسمك..."
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#374151", fontWeight: "500" }}>البريد الإلكتروني</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#374151", fontWeight: "500" }}>الموضوع</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none" }}
                  placeholder="عنوان الرسالة..."
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "5px", color: "#374151", fontWeight: "500" }}>الرسالة</label>
                <textarea
                  name="message"
                  rows="4"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  style={{ width: "100%", padding: "10px", border: "1px solid #D1D5DB", borderRadius: "6px", outline: "none", resize: "vertical" }}
                  placeholder="اكتب رسالتك هنا..."
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px",
                  background: loading ? "#9CA3AF" : "#17a2b8",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
              >
                {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}