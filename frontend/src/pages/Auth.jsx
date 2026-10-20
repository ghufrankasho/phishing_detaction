import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../api/context/AuthContext";
import { getErrorMessage } from "../api/getErrorMessage";
 
export default function Auth({ initialMode = "signin" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [submitting, setSubmitting] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    password_confirmation: "",
  });
  const [signInForm, setSignInForm] = useState({ email: "", password: "" });
  const [signUpError, setSignUpError] = useState("");
  const [signInError, setSignInError] = useState("");

  const handleSignUpChange = (e) =>
    setSignUpForm({ ...signUpForm, [e.target.name]: e.target.value, [e.target.role]: "user" });

  const handleSignInChange = (e) =>
    setSignInForm({ ...signInForm, [e.target.name]: e.target.value });

  const submitSignUp = async (e) => {
    e.preventDefault();
    setSignUpError("");
    setSubmitting(true);
    try {
      await register(signUpForm);
      navigate("/dashboard");
    } catch (err) {
      setSignUpError(getErrorMessage(err, "فشل إنشاء الحساب"));
    } finally {
      setSubmitting(false);
    }
  };

  const submitSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");
    setSubmitting(true);
    try {

      await login(signInForm.email, signInForm.password);

      navigate("/dashboard");
    } catch (err) {
      setSignInError(getErrorMessage(err, "فشل تسجيل الدخول"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="log">
      <div className={`container-log ${isSignUp ? "right-panel-active" : ""}`}>
        {/* Sign up */}
        <div className="form-container sign-up-container">
          <form onSubmit={submitSignUp}>
            <h1>أنشئ حساباً</h1>
            {signUpError && <p className="auth-error">{signUpError}</p>}
            <input dir="rtl" type="text" name="name" placeholder="الاسم"
              value={signUpForm.name} onChange={handleSignUpChange} required />
            <input dir="rtl" type="email" name="email" placeholder="البريد الالكتروني"
              value={signUpForm.email} onChange={handleSignUpChange} required />
            <input dir="rtl" type="password" name="password" placeholder="كلمة المرور"
              value={signUpForm.password} onChange={handleSignUpChange} required />
            <input dir="rtl" type="password" name="password_confirmation"
              placeholder="تأكيد كلمة المرور"
              value={signUpForm.password_confirmation}
              onChange={handleSignUpChange} required />
            <button type="submit" disabled={submitting}>
              {submitting ? "..." : "إنشاء حساب"}
            </button>
          </form>
        </div>

        {/* Sign in */}
        <div className="form-container sign-in-container">
          <form onSubmit={submitSignIn}>
            <h1>تسجيل الدخول</h1>
            {signInError && <p className="auth-error">{signInError}</p>}
            <input dir="rtl" type="email" name="email" placeholder="البريد الالكتروني"
              value={signInForm.email} onChange={handleSignInChange} required />
            <input dir="rtl" type="password" name="password" placeholder="كلمة المرور"
              value={signInForm.password} onChange={handleSignInChange} required />
            <button type="submit" disabled={submitting}>
              {submitting ? "..." : "دخول"}
            </button>
          </form>
        </div>

        {/* Sliding overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>مرحباً بك مجدداً</h1>
              <p>لديك حساب بالفعل؟ سجّل الدخول باستخدام معلوماتك الشخصيّة</p>
              <button type="button" className="ghost" onClick={() => setIsSignUp(false)}>
                دخول
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>مرحباً بك</h1>

              <button type="button" className="ghost" onClick={() => setIsSignUp(true)}>
                إنشاء حساب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}