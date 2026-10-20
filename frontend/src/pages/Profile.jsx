import { useEffect, useState } from "react";
import api from "../api/axios";
import { getErrorMessage } from "../api/getErrorMessage";
import { useAuth } from "../api/context/AuthContext";

const EMPTY_PW = { current_password: "", new_password: "", new_password_confirmation: "" };
const EMPTY_EMP = {
  department: "", position: "", employee_number: "",
  hire_date: "", phone: "", extension: "", notes: "",
};
const DEPARTMENTS = [
  "الإدارة العامة", "تقنية المعلومات", "الموارد البشرية", "المالية",
  "التسويق", "المبيعات", "خدمة العملاء", "الشؤون القانونية",
];

// server -> form: nulls become empty strings
const toForm = (data) =>
  Object.fromEntries(Object.keys(EMPTY_EMP).map((k) => [k, data[k] ?? ""]));
// form -> server: empty strings become null
const toPayload = (form) =>
  Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v.trim() === "" ? null : v.trim()]));

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

  // ----- employee details form -----
  const [emp, setEmp] = useState(EMPTY_EMP);
  const [empLoaded, setEmpLoaded] = useState(false);
  const [empMsg, setEmpMsg] = useState({ type: "", text: "" });
  const [savingEmp, setSavingEmp] = useState(false);

  useEffect(() => {
    api
      .get("/profile/employee")
      .then((res) => setEmp(toForm(res.data)))
      .catch((err) =>
        setEmpMsg({ type: "error", text: getErrorMessage(err, "تعذّر تحميل بيانات الموظف") })
      )
      .finally(() => setEmpLoaded(true));
  }, []);

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

  const handleEmpChange = (e) => setEmp({ ...emp, [e.target.name]: e.target.value });

  const saveEmployee = async (e) => {
    e.preventDefault();
    setEmpMsg({ type: "", text: "" });
    setSavingEmp(true);
    try {
      const res = await api.put("/profile/employee", toPayload(emp));
      setEmp(toForm(res.data));
      setEmpMsg({ type: "success", text: "تم حفظ بيانات الموظف." });
    } catch (err) {
      setEmpMsg({ type: "error", text: getErrorMessage(err, "تعذّر حفظ بيانات الموظف") });
    } finally {
      setSavingEmp(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h2 className="page-title">الملف الشخصي</h2>
      
      </div>

      <div className="profile-grid">
        
        {/* ---------------- employee details ---------------- */}
        <form className="panel profile-wide" onSubmit={saveEmployee}>
          <h3>بيانات الموظف</h3>
          

          <div className="field-grid">
            <div className="field">
              <label htmlFor="department"><i className="bx bxs-buildings"></i>القسم</label>
              <input id="department" name="department" type="text" list="departments"
                     value={emp.department} onChange={handleEmpChange}
                     maxLength={100} disabled={!empLoaded} />
              <datalist id="departments">
                {DEPARTMENTS.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>

            <div className="field">
              <label htmlFor="position"><i className="bx bxs-briefcase-alt-2"></i>المنصب</label>
              <input id="position" name="position" type="text"
                     value={emp.position} onChange={handleEmpChange}
                     maxLength={100} disabled={!empLoaded} />
            </div>

            <div className="field">
              <label htmlFor="employee_number"><i className="bx bxs-id-card"></i>رقم الموظف</label>
              <input id="employee_number" name="employee_number" type="text" className="ltr"
                     value={emp.employee_number} onChange={handleEmpChange}
                     maxLength={50} placeholder="EMP001" disabled={!empLoaded} />
            </div>

            <div className="field">
              <label htmlFor="hire_date"><i className="bx bxs-calendar"></i>تاريخ التعيين</label>
              <input id="hire_date" name="hire_date" type="date"
                     value={emp.hire_date} onChange={handleEmpChange}
                     max={new Date().toISOString().slice(0, 10)} disabled={!empLoaded} />
            </div>

            <div className="field">
              <label htmlFor="phone"><i className="bx bxs-phone"></i>رقم الهاتف</label>
              <input id="phone" name="phone" type="tel" className="ltr"
                     value={emp.phone} onChange={handleEmpChange}
                     maxLength={30} placeholder="+963 ..." disabled={!empLoaded} />
            </div>

            <div className="field">
              <label htmlFor="extension"><i className="bx bxs-phone-call"></i>التحويلة</label>
              <input id="extension" name="extension" type="text" className="ltr"
                     inputMode="numeric" value={emp.extension} onChange={handleEmpChange}
                     maxLength={10} disabled={!empLoaded} />
            </div>

            <div className="field field-wide">
              <label htmlFor="notes"><i className="bx bxs-note"></i>ملاحظات</label>
              <textarea id="notes" name="notes" value={emp.notes}
                        onChange={handleEmpChange} maxLength={1000} disabled={!empLoaded} />
            </div>
          </div>

          <button className="primary" type="submit" disabled={savingEmp || !empLoaded}>
            {savingEmp ? "جارٍ الحفظ..." : "حفظ بيانات الموظف"}
          </button>

          {empMsg.text && <p className={empMsg.type}>{empMsg.text}</p>}
        </form>
         {/* ---------------- password ---------------- */}
        <form className="panel" onSubmit={changePassword}>
          <h3>تغيير كلمة المرور</h3>

          <div className="field">
            <label htmlFor="current_password">كلمة المرور الحالية</label>
            <input id="current_password" name="current_password" type="password"
                   autoComplete="current-password" required
                   value={pw.current_password} onChange={handlePwChange} />
          </div>

          <div className="field">
            <label htmlFor="new_password">كلمة المرور الجديدة</label>
            <input id="new_password" name="new_password" type="password"
                   autoComplete="new-password" minLength={8} required
                   value={pw.new_password} onChange={handlePwChange} />
            <p className="helper">8 أحرف على الأقل.</p>
          </div>

          <div className="field">
            <label htmlFor="new_password_confirmation">تأكيد كلمة المرور الجديدة</label>
            <input id="new_password_confirmation" name="new_password_confirmation"
                   type="password" autoComplete="new-password" required
                   value={pw.new_password_confirmation} onChange={handlePwChange} />
          </div>

          <button className="primary" type="submit" disabled={savingPw}>
            {savingPw ? "جارٍ التغيير..." : "تغيير كلمة المرور"}
          </button>

          {pwMsg.text && <p className={pwMsg.type}>{pwMsg.text}</p>}
        </form>
        {/* ---------------- account ---------------- */}
        <form className="panel" onSubmit={saveName}>
          <h3>معلومات الحساب</h3>

          <div className="field">
            <label htmlFor="name"><i className="bx bxs-user"></i>الاسم</label>
            <input id="name" type="text" value={name} maxLength={100} required
                   onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="email"><i className="bx bxs-envelope"></i>البريد الإلكتروني</label>
            <input id="email" type="email" value={user.email || ""} disabled />
          </div>

          <button className="primary" type="submit"
                  disabled={savingName || name.trim() === user.name}>
            {savingName ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>

          {nameMsg.text && <p className={nameMsg.type}>{nameMsg.text}</p>}
        </form>

       

      </div>
    </div>
  );
}
