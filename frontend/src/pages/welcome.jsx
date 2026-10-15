// src/pages/Welcome.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const handleStart = () => {
    if (loading) return;
    navigate(user ? "/dashboard" : "/login");
  };

  return (
    <div className="hero welcome-page-wrapper">
      <div className="splash-center">
        {/* Shield and Checkmark App Logo */}
        <svg className="splash-icon welcome-icon" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="1.8"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        
        <h2>
          احمِ نفسك من الروابط والرسائل الاحتيالية
        </h2>
        <p className="lead">
          منصة ذكية متطورة لفحص وتحليل المحتوى المشبوه فوراً والتحقق من سلامته لحماية بياناتك الشخصية والمالية.
        </p>

        {/* Action Buttons Container */}
        <div className="welcome-actions">
          <button 
            className="welcome-btn" 
            onClick={handleStart}
            disabled={loading}
          >
            {user ? "الانتقال للوحة التحكم" : "ابدأ الفحص الآن"}
          </button>
          
          <button 
            className="welcome-btn welcome-btn-outline" 
            onClick={() => setShowModal(true)}
          >
            كيفية الاستخدام؟
          </button>
        </div>
      </div>

      {/* --- INSTRUCTIONS MODAL POPUP --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>دليل الاستخدام السريع</h2>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <ol>
                <li>قم بتسجيل الدخول أو إنشاء حساب جديد مخصص لك لحفظ بياناتك.</li>
                <li>اختر نوع الفحص المناسب من واجهة العمل الأساسية (رابط موقع أو رسالة نصية).</li>
                <li>الصق المحتوى أو النص المشبوه في الصندوق المخصص ثم اضغط على زر الفحص.</li>
                <li>سيقوم النظام تلقائياً بتحليل النصوص وإعطائك النتيجة فوراً لتوضيح حالة الأمان.</li>
              </ol>
            </div>
            <div className="modal-footer">
              <button className="welcome-btn" onClick={() => setShowModal(false)}>مفهوم</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
