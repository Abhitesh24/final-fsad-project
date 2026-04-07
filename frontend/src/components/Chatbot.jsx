import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! I'm EcoSupport, your platform assistant. How can I help you today?", isBot: true }
    ]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        const newMsgId = Date.now();
        setMessages(prev => [...prev, { id: newMsgId, text: userMsg, isBot: false }]);
        setInputValue('');

        // Simulate thinking delay
        setTimeout(() => {
            const botResponse = generateResponse(userMsg);
            setMessages(prev => [...prev, { id: newMsgId + 1, text: botResponse, isBot: true }]);
        }, 600);
    };

    // Keyword matching for EcoShare assistance
    const generateResponse = (msg) => {
        const text = msg.toLowerCase();
        
        if (text.includes('claim') || text.includes('rescue')) {
            return "To claim food, go to your Donor/Recipient dashboard, view 'Available' listings, and click 'Claim'. You can then track it from the same dashboard.";
        }
        if (text.includes('urgent') || text.includes('perishable')) {
            return "Listings marked 'Urgent' require immediate pickup due to high perishability. Please prioritize these to prevent food spoilage!";
        }
        if (text.includes('hi') || text.includes('hello')) {
            return "Hi there! Feel free to ask me how to claim food, post donations, or navigate the dashboard.";
        }
        if (text.includes('post') || text.includes('donate')) {
            return "If you are logged in as a Donor or Admin, you can click 'New Donation' on your dashboard to post a new food listing.";
        }
        if (text.includes('status') || text.includes('track')) {
            return "You can track the status of your claims using the 'Track Status' button on your dashboard. Statuses include Available, Claimed, PickedUp, and Failed/Spoiled.";
        }
        if (text.includes('who are you') || text.includes('what is this')) {
            return "I am the EcoShare AI Assistant. My job is to help users navigate the platform, understand food rescue data, and connect Donors to Recipients.";
        }
        
        return "I'm not quite sure about that. Try asking about claiming food, posting donations, or understanding your dashboard data!";
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="animate-fade-in"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-600)',
                        color: 'white',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0, 160, 114, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 999,
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <MessageCircle size={24} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div 
                    className="card animate-fade-in"
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        width: '350px',
                        height: '500px',
                        maxWidth: 'calc(100vw - 2rem)',
                        maxHeight: 'calc(100vh - 4rem)',
                        padding: 0,
                        backgroundColor: 'white',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: 1000,
                        overflow: 'hidden',
                        border: '1px solid var(--border-light)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '1rem',
                        backgroundColor: 'var(--primary-600)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                            <Bot size={20} />
                            EcoSupport Assistant
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        padding: '1rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        backgroundColor: 'var(--bg-light)'
                    }}>
                        {messages.map((msg) => (
                            <div key={msg.id} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                alignSelf: msg.isBot ? 'flex-start' : 'flex-end',
                                maxWidth: '85%'
                            }}>
                                {msg.isBot && (
                                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', borderRadius: '50%' }}>
                                        <Bot size={14} />
                                    </div>
                                )}
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: '1rem',
                                    backgroundColor: msg.isBot ? 'white' : 'var(--primary-600)',
                                    color: msg.isBot ? 'inherit' : 'white',
                                    border: msg.isBot ? '1px solid var(--border-light)' : 'none',
                                    borderBottomLeftRadius: msg.isBot ? '0' : '1rem',
                                    borderBottomRightRadius: msg.isBot ? '1rem' : '0',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    {msg.text}
                                </div>
                                {!msg.isBot && (
                                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--surface-gray)', color: 'var(--text-muted)', borderRadius: '50%' }}>
                                        <User size={14} />
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form 
                        onSubmit={handleSend}
                        style={{
                            padding: '1rem',
                            borderTop: '1px solid var(--border-light)',
                            backgroundColor: 'white',
                            display: 'flex',
                            gap: '0.5rem'
                        }}
                    >
                        <input
                            className="input"
                            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '2rem' }}
                            placeholder="Type your message..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <button 
                            type="submit"
                            style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '50%',
                                backgroundColor: inputValue.trim() ? 'var(--primary-600)' : 'var(--border-light)',
                                color: 'white',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: inputValue.trim() ? 'pointer' : 'default',
                                transition: 'background-color 0.2s'
                            }}
                            disabled={!inputValue.trim()}
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
