export default function ChatHeader({
    activeChat,
    chatTitle,
    onBack,
    onOpenProfile,
    onOpenSidebar,
    presence,
}) {
    return (
        <header className="chat-panel-header">
            <div className="chat-header-title">
                {activeChat && (
                    <button className="chat-back-button" type="button" onClick={onBack}
                        aria-label="Close current chat">←</button>
                )}
                <button className="mobile-sidebar-toggle" type="button" onClick={onOpenSidebar}
                    aria-label="Show chats sidebar">☰</button>
                <div>
                    <span className="eyebrow">QUICKPULSE CHAT</span>
                    {activeChat ? (
                        <button className="chat-profile-link" type="button" onClick={onOpenProfile}>
                            {chatTitle}
                        </button>
                    ) : <h1>Select a chat</h1>}
                </div>
            </div>
            <span className={`status-pill ${presence.online ? "online" : ""}`}>
                {activeChat ? (presence.typing ? "typing..." : presence.online ? "Online" : "Offline") : "No chat selected"}
            </span>
        </header>
    );
}
