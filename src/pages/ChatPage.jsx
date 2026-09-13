import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import socket from "../services/socket";
import ChatHeader from "../components/ChatHeader";
import ChatSidebar from "../components/ChatSidebar";
import MessageComposer from "../components/MessageComposer";
import MessageList from "../components/MessageList";
import { getMessageStatus, getSenderId, isOwnMessage } from "../utils/chat";
import { getStoredUser } from "../utils/session";

export default function ChatPage() {
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState([]);
    const [username, setUsername] = useState("");
    const [searching, setSearching] = useState(false);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);
    const [presence, setPresence] = useState({ online: false, typing: false });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const temporaryMessageNumber = useRef(0);
    const previousUnreadCounts = useRef(new Map());
    const currentUser = getStoredUser();
    const currentUserId = currentUser?.id || currentUser?._id;

    function getChatTitle(chat) {
        const otherParticipant = chat?.participants?.find(
            (user) => user._id !== currentUser?.id,
        );
        return otherParticipant?.name || "Conversation";
    }

    function getOtherParticipant(chat) {
        return chat?.participants?.find(
            (user) => String(user._id) !== String(currentUser?.id || currentUser?._id),
        );
    }

    useEffect(() => {
        async function sendHeartbeat() {
            API.post("/presence/heartbeat").catch(() => {});
        }
        sendHeartbeat();
        const heartbeatInterval = window.setInterval(sendHeartbeat, 5000);
        return () => window.clearInterval(heartbeatInterval);
    }, []);

    useEffect(() => {
        async function loadChats() {
            try {
                const chatResponse = await API.get("/chats");
                const nextChats = chatResponse.data;
                if (document.visibilityState !== "visible"
                    && "Notification" in window
                    && Notification.permission === "granted") {
                    nextChats.forEach((chat) => {
                        const previousCount = previousUnreadCounts.current.get(chat._id) || 0;
                        if (chat.unreadCount > previousCount) {
                            new Notification(`${chat.title} sent you a message`, {
                                body: `${chat.unreadCount} unread message${chat.unreadCount === 1 ? "" : "s"}`,
                            });
                        }
                    });
                }
                previousUnreadCounts.current = new Map(
                    nextChats.map((chat) => [chat._id, chat.unreadCount || 0]),
                );
                setChats(nextChats);
            } catch (requestError) {
                if (requestError.response?.status === 401) navigate("/login");
                else setError("Unable to load your chats.");
            }
        }

        loadChats();
        const chatsInterval = window.setInterval(loadChats, 2000);
        return () => window.clearInterval(chatsInterval);
    }, [navigate]);

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handlePresence = ({ userId, online }) => {
            const otherUser = activeChat?.participants?.some((user) => String(user._id) === String(userId));
            if (otherUser) setPresence((current) => ({ ...current, online }));
        };
        const handleTyping = ({ userId, isTyping }) => {
            const otherUser = activeChat?.participants?.some((user) => String(user._id) === String(userId));
            if (otherUser) setPresence((current) => ({ ...current, typing: isTyping }));
        };
        const handleStatus = ({ conversationId, messageId, messageIds, status }) => {
            if (conversationId !== activeChat?._id) return;
            const ids = messageIds || [messageId];
            setMessages((current) => current.map((message) =>
                ids.includes(String(message._id)) ? { ...message, status } : message,
            ));
        };
        const handleMessagesCleared = ({ conversationId }) => {
            if (conversationId === activeChat?._id) setMessages([]);
        };
        const handleNewMessage = ({ conversationId, message }) => {
            if (conversationId !== activeChat?._id) return;
            setMessages((current) => {
                if (current.some((item) => item._id === message._id)) return current;
                const pendingIndex = current.findIndex((item) =>
                    item.pending && isOwnMessage(item, currentUserId) && item.text === message.text);
                if (pendingIndex >= 0) {
                    return current.map((item, index) => index === pendingIndex
                        ? { ...message, status: getMessageStatus(message, currentUserId) }
                        : item);
                }
                return [...current, { ...message, status: getMessageStatus(message, currentUserId) }];
            });
            if (String(message.sender) !== String(currentUserId) && socket.connected) {
                socket.emit("message:delivered", { conversationId, messageId: message._id });
            }
            if (String(message.sender) !== String(currentUserId)
                && document.visibilityState !== "visible"
                && "Notification" in window
                && Notification.permission === "granted") {
                new Notification("New message", { body: message.text });
            }
        };

        socket.on("presence:update", handlePresence);
        socket.on("typing:update", handleTyping);
        socket.on("message:status", handleStatus);
        socket.on("messages:cleared", handleMessagesCleared);
        socket.on("message:new", handleNewMessage);
        if (!socket.connected) socket.connect();
        if (activeChat) {
            socket.emit("conversation:join", activeChat._id);
        }
        return () => {
            if (activeChat) socket.emit("conversation:leave", activeChat._id);
            socket.off("presence:update", handlePresence);
            socket.off("typing:update", handleTyping);
            socket.off("message:status", handleStatus);
            socket.off("messages:cleared", handleMessagesCleared);
            socket.off("message:new", handleNewMessage);
        };
    }, [activeChat, currentUserId]);

    useEffect(() => {
        if (!activeChat) return undefined;
        async function loadPresence() {
            try {
                const { data } = await API.get(`/presence/${activeChat._id}`);
                setPresence(data);
            } catch {
                setPresence({ online: false, typing: false });
            }
        }
        loadPresence();
        const presenceInterval = window.setInterval(loadPresence, 2000);
        return () => window.clearInterval(presenceInterval);
    }, [activeChat]);

    useEffect(() => {
        if (!activeChat || !socket.connected) return;
        socket.emit("typing:update", { conversationId: activeChat._id, isTyping: Boolean(text.trim()) });
        const stopTypingTimer = text.trim() ? window.setTimeout(() => {
            socket.emit("typing:update", { conversationId: activeChat._id, isTyping: false });
        }, 1800) : undefined;
        return () => {
            if (stopTypingTimer) window.clearTimeout(stopTypingTimer);
        };
    }, [text, activeChat]);

    useEffect(() => {
        if (!activeChat || socket.connected) return undefined;
        API.post("/presence/typing", {
            conversationId: activeChat._id,
            isTyping: Boolean(text.trim()),
        }).catch(() => {});
        const stopTypingTimer = text.trim() ? window.setTimeout(() => {
            API.post("/presence/typing", {
                conversationId: activeChat._id,
                isTyping: false,
            }).catch(() => {});
        }, 1800) : undefined;
        return () => {
            if (stopTypingTimer) window.clearTimeout(stopTypingTimer);
        };
    }, [text, activeChat]);

    async function searchUsers(event) {
        event.preventDefault();
        const query = username.trim();
        if (!query) {
            setUsers([]);
            return;
        }
        setSearching(true);
        setError("");
        try {
            const { data } = await API.get("/users", { params: { username: query } });
            setUsers(data);
            if (!data.length) setError("No user found with this username.");
        } catch {
            setError("Unable to search for this user.");
        } finally {
            setSearching(false);
        }
    }

    useEffect(() => {
        if (!activeChat) return;
        async function loadMessages() {
            try {
                const { data } = await API.get(`/chats/${activeChat._id}/messages`);
                setMessages(data.map((message) => ({
                    ...message,
                    status: getMessageStatus(message, currentUserId),
                })));
                API.post(`/chats/${activeChat._id}/read`).catch(() => {});
            } catch {
                setError("Unable to load messages.");
            }
        }
        loadMessages();
        const messagesInterval = window.setInterval(loadMessages, 2000);
        return () => window.clearInterval(messagesInterval);
    }, [activeChat, currentUserId]);

    useEffect(() => {
        if (!activeChat || !socket.connected) return;
        const unreadIds = messages
            .filter((message) => {
                return String(getSenderId(message)) !== String(currentUserId)
                    && message.status !== "read";
            })
            .map((message) => String(message._id));
        if (unreadIds.length) {
            socket.emit("messages:read", {
                conversationId: activeChat._id,
                messageIds: unreadIds,
            });
        }
    }, [messages, activeChat, currentUserId]);

    async function startChat(participantId) {
        if ("Notification" in window && Notification.permission === "default") {
            await Notification.requestPermission();
        }
        try {
            const { data } = await API.post("/chats", { participantId });
            setChats((current) => [data, ...current.filter((chat) => chat._id !== data._id)]);
            setUsername("");
            setUsers([]);
            setError("");
            setMessages([]);
            setPresence({ online: false, typing: false });
            setSidebarOpen(false);
            setActiveChat(data);
        } catch {
            setError("Unable to start this chat.");
        }
    }

    async function sendMessage(event) {
        event.preventDefault();
        const messageText = text.trim();
        if (!activeChat || !messageText || sending) return;

        if (messageText.toLowerCase() === "/clearchat") {
            setText("");
            setError("");
            try {
                await API.delete(`/chats/${activeChat._id}/messages`);
                setMessages([]);
            } catch {
                setError("Unable to clear conversation.");
            }
            return;
        }

        temporaryMessageNumber.current += 1;
        const temporaryId = `pending-${temporaryMessageNumber.current}`;
        const optimisticMessage = {
            _id: temporaryId,
            text: messageText,
            sender: currentUser?.id,
            pending: true,
        };
        setMessages((current) => [...current, optimisticMessage]);
        setText("");
        setError("");
        setSending(true);

        try {
            const { data } = await API.post(`/chats/${activeChat._id}/messages`, {
                text: messageText,
            });
            setMessages((current) =>
                current.map((message) =>
                    message._id === temporaryId ? { ...data, status: "sent" } : message,
                ),
            );
        } catch {
            setMessages((current) =>
                current.filter((message) => message._id !== temporaryId),
            );
            setError("Unable to send message.");
        } finally {
            setSending(false);
        }
    }

    function logout() {
        API.post("/auth/logout").finally(() => {
            sessionStorage.removeItem("quickpulse_user");
            sessionStorage.removeItem("quickpulse_csrf");
            navigate("/login");
        });
    }

    return (
        <main className="admin-body has-active-chat">
            <ChatSidebar
                chats={chats.map((chat) => ({ ...chat, title: getChatTitle(chat) }))}
                users={users}
                username={username}
                searching={searching}
                activeChat={activeChat}
                currentUser={currentUser}
                sidebarOpen={sidebarOpen}
                accountMenuOpen={accountMenuOpen}
                onSearch={searchUsers}
                onUsernameChange={(event) => setUsername(event.target.value)}
                onStartChat={startChat}
                onSelectChat={(chat) => {
                    setMessages([]);
                    setPresence({ online: false, typing: false });
                    setSidebarOpen(false);
                    setActiveChat(chat);
                }}
                onToggleAccount={() => setAccountMenuOpen((open) => !open)}
                onProfile={() => navigate(`/profile/${currentUser?.id || currentUser?._id}`)}
                onLogout={logout}
                onClose={() => setSidebarOpen(false)}
            />
            <section className="main-chat">
                <ChatHeader
                    activeChat={activeChat}
                    chatTitle={activeChat ? getChatTitle(activeChat) : ""}
                    presence={presence}
                    onBack={() => {
                        setActiveChat(null);
                        setMessages([]);
                        setPresence({ online: false, typing: false });
                    }}
                    onOpenProfile={() => navigate(`/profile/${getOtherParticipant(activeChat)?._id}`)}
                    onOpenSidebar={() => setSidebarOpen(true)}
                />
                {error && <p className="auth-error" role="alert">{error}</p>}
                <MessageList activeChat={activeChat} messages={messages}
                    currentUserId={currentUserId} presence={presence} />
                <MessageComposer activeChat={activeChat} text={text} sending={sending}
                    onChange={(event) => setText(event.target.value)} onSubmit={sendMessage} />
            </section>
        </main>
    );
}
