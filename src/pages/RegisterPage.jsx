import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [usernameError, setUsernameError] = useState("");

    const updateField = (event) => {
        if (event.target.name === "username") setUsernameError("");
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setUsernameError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/register", form);
            if (data.user) sessionStorage.setItem("quickpulse_user", JSON.stringify(data.user));
            if (data.csrfToken) sessionStorage.setItem("quickpulse_csrf", data.csrfToken);
            navigate("/");
        } catch (requestError) {
            const message = requestError.response?.data?.message || "Unable to create your account. Please try again.";
            if (message === "Username is already taken.") setUsernameError("This username is already taken.");
            else setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>
                <div className="brand-mark" aria-hidden="true">Q</div>
                <p className="auth-kicker">GET STARTED</p>
                <h1>Create your account</h1>
                <p className="auth-subtitle">Join QuickPulse and start chatting.</p>
                <div className="auth-form">
                    <div className="field"><label htmlFor="register-name">Full name</label>
                        <input id="register-name" name="name" type="text" value={form.name} onChange={updateField}
                            placeholder="Your name" autoComplete="name" required /></div>
                    <div className="field"><label htmlFor="register-username">Username</label>
                        <input id="register-username" name="username" type="text" value={form.username} onChange={updateField}
                            placeholder="Choose a username" autoComplete="username" pattern="[a-zA-Z0-9_]{3,30}" required /></div>
                    {usernameError && <p className="auth-error field-error" role="alert">{usernameError}</p>}
                    <div className="field"><label htmlFor="register-email">Email address</label>
                        <input id="register-email" name="email" type="email" value={form.email} onChange={updateField}
                            placeholder="you@example.com" autoComplete="email" required /></div>
                    <div className="field"><label htmlFor="register-password">Password</label>
                        <div className="password-field">
                            <input id="register-password" name="password" type={showPassword ? "text" : "password"}
                                value={form.password} onChange={updateField} placeholder="Create a password"
                                autoComplete="new-password" minLength="6" required />
                            <button className="password-toggle" type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </div>
                <p className="auth-footer">Already have an account? <Link className="text-button" to="/login">Login</Link></p>
            </form>
        </main>
    );
}
