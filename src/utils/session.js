export function getStoredUser() {
    const storedUser = sessionStorage.getItem("quickpulse_user");
    if (!storedUser || storedUser === "undefined") return null;

    try {
        return JSON.parse(storedUser);
    } catch {
        sessionStorage.removeItem("quickpulse_user");
        return null;
    }
}
