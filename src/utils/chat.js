export function getSenderId(message) {
    return typeof message.sender === "object"
        ? message.sender?._id
        : message.sender;
}

export function isOwnMessage(message, currentUserId) {
    return String(getSenderId(message)) === String(currentUserId);
}

export function getMessageStatus(message, currentUserId) {
    if (message.status) return message.status;
    if (message.readBy?.some((id) => String(id) === String(currentUserId))) return "read";
    if (message.deliveredTo?.some((id) => String(id) === String(currentUserId))) return "delivered";
    return "sent";
}
