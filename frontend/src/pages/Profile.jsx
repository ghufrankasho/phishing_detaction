import { useState } from "react";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import { useAuth } from "../context/AuthContext";

const EMPTY_PW = { current_password: "", new_password: "", new_password_confirmation: "" };

export default function Profile() {
  const { user, setUser } = useAuth();

  // ----- name form -----
  const [name, setName] = useState(user.name);
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });
  const [savingName, setSavingName] = useState(false);

  // ----- password form -----
  const [pw, setPw] = useState(EMPTY_PW);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    setNameMsg({ type: "", text: "" });
    setSavingName(true);
    try {
      const res = await api.patch("/profile", { name });
      setUser((prev) => ({ ...prev, ...res.data })); // updates the header too
      setName(res.data.name);
      setNameMsg({ type: "success", text: "تم حفظ الاسم." });
    } catch (err) {
      setNameMsg({ type: "error", text: getErrorMessage(err, "تعذّر حفظ الاسم") });
    } finally {
      setSavingName(false);
    }
  };

  const handlePwChange = (e) => setPw({ ...pw, [e.target.name]: e.target.value });

  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pw.new_password !== pw.new_password_confirmation) {
      setPwMsg({ type: "error", text: "كلمتا المرور الجديدتان غير متطابقتين" });
      return;
    }
    setSavingPw(true);
    try {
      await api.post("/profile/password", pw);
      setPw(EMPTY_PW);
      setPwMsg({ type: "success", text: "تم تغيير كلمة المرور." });
    } catch (err) {
      setPwMsg({ type: "error", text: getErrorMessage(err, "تعذّر تغيير كلمة المرور") });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h2 className="page-title">الملف الشخصي</h2>
       
      </div>

      <div className="profile-grid">
        <form className="panel" onSubmit={saveName}>
          <h3>معلومات الحساب</h3>

          <div className="field">
            <label htmlFor="name">الاسم</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input id="email" type="email" value={user.email || ""} disabled />
          </div>

          <button className="primary" type="submit"
                  disabled={savingName || name.trim() === user.name}>
            {savingName ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>

          {nameMsg.text && <p className={nameMsg.type}>{nameMsg.text}</p>}
        </form>

        <form className="panel" onSubmit={changePassword}>
          <h3>تغيير كلمة المرور</h3>

          <div className="field">
            <label htmlFor="current_password">كلمة المرور الحالية</label>
            <input id="current_password" name="current_password" type="password"
                   autoComplete="current-password"
                   value={pw.current_password} onChange={handlePwChange} required />
          </div>

          <div className="field">
            <label htmlFor="new_password">كلمة المرور الجديدة</label>
            <input id="new_password" name="new_password" type="password"
                   autoComplete="new-password" minLength={8}
                   value={pw.new_password} onChange={handlePwChange} required />
            <p className="helper">8 أحرف على الأقل.</p>
          </div>

          <div className="field">
            <label htmlFor="new_password_confirmation">تأكيد كلمة المرور الجديدة</label>
            <input id="new_password_confirmation" name="new_password_confirmation"
                   type="password" autoComplete="new-password"
                   value={pw.new_password_confirmation} onChange={handlePwChange} required />
          </div>

          <button className="primary" type="submit" disabled={savingPw}>
            {savingPw ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
          </button>

          {pwMsg.text && <p className={pwMsg.type}>{pwMsg.text}</p>}
        </form>
      </div>
    </div>
  );
}
