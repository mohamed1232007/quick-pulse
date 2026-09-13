export default function MessageComposer({ activeChat, text, sending, onChange, onSubmit }) {
    if (!activeChat) return null;

    return (
        <form className="admin-input-area" onSubmit={onSubmit}>
            <input value={text} onChange={onChange} placeholder="Write a message..." />
            <button type="submit" disabled={!text.trim() || sending}>
                {sending ? "Sending..." : "Send"}
            </button>
        </form>
    );
}
