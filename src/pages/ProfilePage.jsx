import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { getStoredUser } from "../utils/session";

export default function ProfilePage() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const currentUser = getStoredUser();
    const isOwnProfile = String(userId) === String(currentUser?.id || currentUser?._id);
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({ name: "", bio: "", portfolio: "" });
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState("");
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        API.get(isOwnProfile ? "/users/me" : `/users/${userId}`)
            .then(({ data }) => {
                setProfile(data);
                setForm({ name: data.name || "", bio: data.bio || "", portfolio: data.portfolio || "" });
            })
            .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load profile."));
    }, [isOwnProfile, userId]);

    async function saveProfile(event) {
        event.preventDefault();
        setError("");
        setSaved(false);
        try {
            const { data } = await API.put("/users/me", form);
            setProfile(data);
            sessionStorage.setItem("quickpulse_user", JSON.stringify({
                ...currentUser,
                name: data.name,
            }));
            setEditing(false);
            setSaved(true);
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to save profile.");
        }
    }

    if (!profile) return <main className="profile-page"><p className="profile-loading">{error || "Loading profile..."}</p></main>;

    return (
        <main className="profile-page">
            <section className="profile-card">
                <Link className="profile-back" to="/chat">← Back to chat</Link>
                <div className="profile-avatar">{profile.name.charAt(0).toUpperCase()}</div>
                {!editing ? (
                    <>
                        <p className="auth-kicker">PROFILE</p>
                        <h1>{profile.name}</h1>
                        <p className="profile-username">@{profile.username}</p>
                        <p className="profile-bio">{profile.bio || "No bio added yet."}</p>
                        {profile.portfolio && <a className="profile-portfolio" href={profile.portfolio} target="_blank" rel="noreferrer">View portfolio</a>}
                        {isOwnProfile && <button className="auth-submit profile-edit-button" type="button" onClick={() => setEditing(true)}>Edit profile</button>}
                    </>
                ) : (
                    <form className="profile-form" onSubmit={saveProfile}>
                        <p className="auth-kicker">SETTINGS</p>
                        <h1>Edit profile</h1>
                        <label className="field">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
                        <label className="field">Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} maxLength="300" /></label>
                        <label className="field">Portfolio URL<input type="url" value={form.portfolio} onChange={(event) => setForm({ ...form, portfolio: event.target.value })} placeholder="https://..." /></label>
                        {error && <p className="auth-error">{error}</p>}
                        <button className="auth-submit" type="submit">Save changes</button>
                        <button className="text-button profile-cancel" type="button" onClick={() => setEditing(false)}>Cancel</button>
                    </form>
                )}
                {saved && <p className="profile-saved">Profile updated.</p>}
                <button className="profile-chat-button" type="button" onClick={() => navigate("/chat")}>Open chat</button>
            </section>
        </main>
    );
}
