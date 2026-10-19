
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
       <img className="splash-icon" src="/logo.png" alt="" />
         
        
        <h2>
         Phishing Guard AI
        </h2>
        

        {/* Action Buttons Container */}
        <div className="welcome-actions">
          <button 
            className="welcome-btn" 
            onClick={handleStart}
            disabled={loading}
          >
            {user ? "الانتقال للوحة التحكم" : "تسجيل الدخول"}
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
