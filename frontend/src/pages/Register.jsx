import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../api/getErrorMessage";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input name="name" placeholder="Name"
             value={form.name} onChange={handleChange} required />
      <input name="email" type="email" placeholder="Email"
             value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password (min 8)"
             value={form.password} onChange={handleChange} required />
      <input name="password_confirmation" type="password" placeholder="Confirm password"
             value={form.password_confirmation} onChange={handleChange} required />
      <button type="submit" disabled={submitting}>
        {submitting ? "Creating account..." : "Register"}
      </button>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}