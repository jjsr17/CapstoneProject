import { useEffect, useState, useRef } from "react";
import "./Messages.css";

export default function Messages() {
    const [contacts, setContacts] = useState([]);
    const [currentConversation, setCurrentConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageText, setMessageText] = useState("");

    const messagesEndRef = useRef(null);

    function goBack() {
        window.location.href = "mainmenu";
    }

    async function loadContacts() {
        try {
            const res = await fetch("/api/messages/contacts");
            const data = await res.json();
            setContacts(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function loadMessages(conversationId) {
        if (!conversationId) return;

        try {
            const res = await fetch(`/api/messages/${conversationId}`);
            const data = await res.json();
            setMessages(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function sendMessage() {
        if (!messageText.trim() || !currentConversation) return;

        try {
            await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversationId: currentConversation.conversationId,
                    text: messageText
                })
            });

            setMessageText("");
            loadMessages(currentConversation.conversationId);
        } catch (err) {
            console.error(err);
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
            {/* Header */}
            <div className="page-header">
                <button className="back-btn" onClick={goBack}>← Back</button>
                <div className="page-title">Messages</div>
            </div>

            {/* Main */}
            <div className="message-wrapper">

                {/* Contact List */}
                <div className="contacts">
                    <h2>Contacts</h2>
                    {contacts.map(c => (
                        <div
                            key={c.conversationId}
                            className={`contact ${currentConversation?.conversationId === c.conversationId ? "active" : ""
                                }`}
                            onClick={() => {
                                setCurrentConversation(c);
                                loadMessages(c.conversationId);
                            }}
                        >
                            {c.name}
                        </div>
                    ))}
                </div>

                {/* Chat */}
                <div className="chat">
                    <div className="chat-header">
                        {currentConversation ? currentConversation.name : "Select a contact"}
                    </div>

                    <div className="messages">
                        {!currentConversation && (
                            <div className="empty-chat">No conversation selected</div>
                        )}

                        {messages.map((m, i) => (
                            <div
                                key={i}
                                className={`message ${m.sender === "me" ? "sent" : "received"}`}
                            >
                                {m.text}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input">
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={e => setMessageText(e.target.value)}
                            disabled={!currentConversation}
                            onKeyDown={e => e.key === "Enter" && sendMessage()}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!currentConversation}
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
        </>
    );
}