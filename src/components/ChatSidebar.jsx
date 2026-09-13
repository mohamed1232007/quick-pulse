export default function ChatSidebar({
    chats,
    users,
    username,
    searching,
    activeChat,
    currentUser,
    sidebarOpen,
    accountMenuOpen,
    onSearch,
    onUsernameChange,
    onStartChat,
    onSelectChat,
    onToggleAccount,
    onProfile,
    onLogout,
    onClose,
}) {
    return (
        <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
            <div className="admin-title">
                <h2 className="section-title">Chats</h2>
                <div className="sidebar-actions">
                    <button className="sidebar-close-button" type="button" onClick={onClose}
                        aria-label="Hide chats sidebar">×</button>
                </div>
            </div>
            <p className="chat-section-label">Find someone to chat with</p>
            <form className="user-search" onSubmit={onSearch}>
                <input value={username} onChange={onUsernameChange}
                    placeholder="Search by username..." aria-label="Search by username" />
                <button type="submit" disabled={searching}>{searching ? "Searching..." : "Search"}</button>
            </form>
            {users.map((user) => (
                <button className="chat-card-admin" key={user._id} type="button" onClick={() => onStartChat(user._id)}>
                    <span>{user.name}<small>@{user.username}</small></span>
                </button>
            ))}
            {!chats.length && (
                <>
                    <p className="no-conversations">You don&apos;t have any conversations yet.</p>
                    <p className="no-conversations-hint">Search for a username above to start chatting.</p>
                </>
            )}
            {chats.length > 0 && <p className="chat-section-label">Your conversations</p>}
            {chats.map((chat) => (
                <button key={chat._id} className={`chat-card-admin ${activeChat?._id === chat._id ? "active" : ""}`}
                    type="button" onClick={() => onSelectChat(chat)}>
                    <span>{chat.title}</span>
                </button>
            ))}
            <div className="sidebar-account">
                <button className="account-button" type="button" onClick={onToggleAccount}>
                    <span className="account-avatar">{currentUser?.name?.charAt(0).toUpperCase() || "U"}</span>
                    <span className="account-name"><strong>{currentUser?.name || "Account"}</strong>
                        <small>@{currentUser?.username || "user"}</small></span>
                    <span className="account-arrow">{accountMenuOpen ? "⌃" : "⌄"}</span>
                </button>
                {accountMenuOpen && (
                    <div className="account-menu">
                        <button type="button" onClick={onProfile}>Profile &amp; settings</button>
                        <button type="button" onClick={onLogout}>Logout</button>
                    </div>
                )}
            </div>
        </aside>
    );
}
