import { Link } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import API from "../services/api";

export default function HomePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        API.get("/auth/me")
            .then(({ data }) => {
                setIsLoggedIn(true);
                if (data.user) {
                    sessionStorage.setItem("quickpulse_user", JSON.stringify(data.user));
                }
            })
            .catch(() => setIsLoggedIn(false));
    }, []);

    return (
        <main className="parent">
            <section className="card landing-card">
                <div className="brand-mark" aria-hidden="true">Q</div>
                <h1>QuickPulse</h1>
                <p className="landing-tagline">Stay connected. Chat instantly.</p>
                <div className="link">
                    {isLoggedIn ? (
                        <Link className="link1" to="/chat">Open chat</Link>
                    ) : (
                        <>
                            <Link className="link1" to="/login">Login</Link>
                            <Link className="link1" to="/register">Register</Link>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
