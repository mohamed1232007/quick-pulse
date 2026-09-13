import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function LoginPage() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const updateField = (event) =>
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const { data } = await API.post("/auth/login", form);
            if (data.user) sessionStorage.setItem("quickpulse_user", JSON.stringify(data.user));
            if (data.csrfToken) sessionStorage.setItem("quickpulse_csrf", data.csrfToken);
            navigate("/");
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to sign in. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="auth-page">
            <section className="auth-card" aria-labelledby="login-title">
                <div className="brand-mark" aria-hidden="true">Q</div>
                <p className="auth-kicker">WELCOME BACK</p>
                <h1 id="login-title">Sign in to QuickPulse</h1>
                <p className="auth-subtitle">Get back to your conversations.</p>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label htmlFor="customer-email">Email address</label>
                        <input id="customer-email" name="email" type="email" value={form.email}
                            onChange={updateField} placeholder="you@example.com" autoComplete="email" required />
                    </div>
                    <div className="field">
                        <div className="field-heading">
                            <label htmlFor="customer-password">Password</label>
                            <button className="text-button" type="button">Forgot password?</button>
                        </div>
                        <div className="password-field">
                            <input id="customer-password" name="password" type={showPassword ? "text" : "password"}
                                value={form.password} onChange={updateField} placeholder="Enter your password"
                                autoComplete="current-password" minLength="6" required />
                            <button className="password-toggle" type="button"
                                onClick={() => setShowPassword((value) => !value)}
                                aria-label={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>
                    
                    {error && <p className="auth-error" role="alert">{error}</p>}
                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
                <p className="auth-footer">Don&apos;t have an account? <Link className="text-button" to="/register">Create one</Link></p>
            </section>
        </main>
    );
}
