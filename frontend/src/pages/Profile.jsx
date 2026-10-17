import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
    const { user } = useAuth();

    // State for switching tabs
    const [activeTab, setActiveTab] = useState("account-general");

    // State for profile image preview
    const [profilePic, setProfilePic] = useState("https://bootdey.com/img/Content/avatar/avatar1.png");

    // State for user name input
    const [name, setName] = useState(user?.name || "rama alzain");

    // State for password reset form
    const [passwords, setPasswords] = useState({
        old_password: "",
        new_password: "",
        confirmed_password: ""
    });

    const handlePasswordChange = (e) => {
        setPasswords({ ...passwords, [e.target.id]: e.target.value });
    };

    const handleNameChange = (e) => {
        setName(e.target.value);
    };

    const updateName = (e) => {
        e.preventDefault();
        // Add your API call to update the user's name here
        console.log("Name update submitted:", name);
    };

    const resetPassword = (e) => {
        e.preventDefault();
        // Add your API call to reset password here
        console.log("Password reset submitted", passwords);
    };

    return (
        <div className="prof" dir="rtl">
            <div className="container light-style flex-grow-1 container-p-y">
                <h4 className="font-weight-bold py-3 mb-4 text-right">
                    إعدادات الحساب
                </h4>
                <div className="card overflow-hidden">
                    <div className="row no-gutters row-bordered row-border-light">

                        {/* Main Content Area */}
                        <div className="col-md-9">
                            <div className="tab-content">
                                
                                {/* General Settings Tab (Profile / Name Change) */}
                                <div className={`tab-pane fade ${activeTab === "account-general" ? "active show" : ""}`} id="account-general">
                                    <div className="card-body media align-items-center text-right">
                                        <img src={profilePic} alt="Profile" className="d-block ui-w-80" id="profile-pic" />

                                        <div className="media-body ml-4 w-100">
                                            <div className="form-group">
                                                <label className="form-label">اسم المستخدم</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    id="input-name" 
                                                    value={name}
                                                    onChange={handleNameChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left m-3">
                                        <button type="button" onClick={updateName} className="btn btn-info">حفظ</button>
                                    </div>
                                </div>

                                {/* Reset Password Tab */}
                                <div className={`tab-pane fade text-right ${activeTab === "reset-password" ? "active show" : ""}`} id="reset-password">
                                    <div className="card-body pb-2">
                                        <div className="form-group" id="reset_password">
                                            <label className="form-label">كلمة المرور الحالية</label>
                                            <input 
                                                type="password" 
                                                className="form-control" 
                                                id="old_password" 
                                                value={passwords.old_password}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">كلمة المرور الجديدة</label>
                                            <input 
                                                type="password" 
                                                className="form-control" 
                                                id="new_password" 
                                                value={passwords.new_password}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أعد كتابة كلمة المرور</label>
                                            <input 
                                                type="password" 
                                                className="form-control" 
                                                id="confirmed_password" 
                                                value={passwords.confirmed_password}
                                                onChange={handlePasswordChange}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <button type="button" className="btn btn-info" onClick={resetPassword}>
                                                حفظ
                                            </button>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Sidebar Navigation */}
                        <div className="col-md-3 pt-0">
                            <div className="list-group list-group-flush account-settings-links">
                                <button 
                                    type="button"
                                    style={{ textAlign: "right" }} 
                                    className={`list-group-item list-group-item-action ${activeTab === "account-general" ? "active" : ""}`}
                                    onClick={() => setActiveTab("account-general")}
                                >
                                    الصفحة الشخصية
                                </button>
                                <button 
                                    type="button"
                                    style={{ textAlign: "right" }} 
                                    className={`list-group-item list-group-item-action ${activeTab === "reset-password" ? "active" : ""}`}
                                    onClick={() => setActiveTab("reset-password")}
                                >
                                    تغيير كلمة السر
                                </button>
                                <a style={{ textAlign: "right" }} className="list-group-item list-group-item-action" href="/account/loginInside.html">
                                    تسجيل خروج
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}