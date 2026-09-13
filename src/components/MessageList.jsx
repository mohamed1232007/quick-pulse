import { useEffect, useRef } from "react";
import { isOwnMessage } from "../utils/chat";

export default function MessageList({ activeChat, messages, currentUserId, presence }) {
    const messagesBoxRef = useRef(null);

    useEffect(() => {
        const messagesBox = messagesBoxRef.current;
        if (messagesBox) messagesBox.scrollTop = messagesBox.scrollHeight;
    }, [messages.length, presence.typing, activeChat]);

    return (
        <div className="messages-box" ref={messagesBoxRef}>
            {!activeChat ? (
                <div className="empty-state">
                    <h2>Select a chat to start messaging</h2>
                    <p>Choose a conversation from the left.</p>
                </div>
            ) : messages.length ? messages.map((message, index) => (
                <div
                    key={message._id || `${message.createdAt}-${index}`}
                    className={`message ${isOwnMessage(message, currentUserId) ? "customer" : "agent"} ${message.pending ? "pending" : ""}`}
                >
                    {message.text}
                </div>
            )) : (
                <div className="empty-state">
                    <h2>No messages yet</h2>
                    <p>Start the conversation.</p>
                </div>
            )}
            {activeChat && presence.typing && (
                <div className="typing-indicator">typing<span>.</span><span>.</span><span>.</span></div>
            )}
        </div>
    );
}
