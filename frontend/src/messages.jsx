import { useEffect, useRef, useState } from "react";
import "./Messages.css";

export default function Messages() {
    const [contacts, setContacts] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const messagesEndRef = useRef(null);

    const userId = localStorage.getItem("mongoUserId");
    console.log("mongoUserId:", userId);
    function goBack() {
        window.location.href = "/mainmenu";
    }

    async function loadContacts() {
        try {
            setLoadingContacts(true);

            if (!userId) {
                console.warn("No mongoUserId in localStorage.");
                setContacts([]);
                return;
            }

            const res = await fetch("/api/messages/contacts", {
                headers: { "x-user-id": userId },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to load contacts");

            setContacts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setContacts([]);
        } finally {
            setLoadingContacts(false);
        }
    }

    async function loadMessages(conversationId) {
        if (!conversationId) return;

        try {
            setLoadingMessages(true);

            const res = await fetch(`/api/messages/${conversationId}`, {
                headers: { "x-user-id": userId },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to load messages");

            setMessages(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setMessages([]);
        } finally {
            setLoadingMessages(false);
        }
    }

    async function sendMessage() {
        if (!messageText.trim() || !currentConversation) return;

        try {
            const res = await fetch("/api/messages/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-user-id": userId,
                },
                body: JSON.stringify({
                    conversationId: currentConversation.conversationId,
                    text: messageText,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Send failed");

            setMessageText("");
            await loadMessages(currentConversation.conversationId);
            await loadContacts();
        } catch (err) {
            console.error(err);
            alert("Failed to send message.");
        }
    }

    useEffect(() => {
        loadContacts();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <>
            <div className="page-header">
                <button className="back-btn" onClick={goBack}>
                    ← Back
                </button>
                <div className="page-title">Messages</div>
            </div>

            <div className="message-wrapper">
                <div className="contacts">
                    <h2>Contacts</h2>

                    {loadingContacts && <div style={{ color: "#666" }}>Loading…</div>}

                    {!loadingContacts && contacts.length === 0 && (
                        <div style={{ color: "#666" }}>
                            No contacts yet. You’ll see contacts after you book a session.
                        </div>
                    )}

                    {contacts.map((c) => (
                        <div
                            key={c.conversationId}
                            className={`contact ${currentConversation?.conversationId === c.conversationId ? "active" : ""
                                }`}
                            onClick={() => {
                                setCurrentConversation(c);
                                loadMessages(c.conversationId);
                            }}
                        >
                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                            {c.lastMessageText ? (
                                <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                                    {c.lastMessageText}
                                </div>
                            ) : null}
                        </div>
                    ))}
                </div>

                <div className="chat">
                    <div className="chat-header">
                        {currentConversation ? currentConversation.name : "Select a contact"}
                    </div>

                    <div className="messages">
                        {!currentConversation ? (
                            <div className="empty-chat">No conversation selected</div>
                        ) : loadingMessages ? (
                            <div style={{ color: "#666" }}>Loading messages…</div>
                        ) : (
                            <>
                                {messages.map((m) => (
                                    <div
                                        key={m._id || `${m.senderId}-${m.createdAt}`}
                                        className={`message ${m.sender === "me" ? "sent" : "received"}`}
                                    >
                                        {m.text}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder={currentConversation ? "Type a message..." : "Select a contact to chat"}
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            disabled={!currentConversation}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        />
                        <button onClick={sendMessage} disabled={!currentConversation}>
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
