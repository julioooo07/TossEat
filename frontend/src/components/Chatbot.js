// components/Chatbot.js
import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../context/ChatbotContext';
import './Chatbot.css';

const Chatbot = () => {
  const {
    chatbotOpen,
    chatHistory,
    chatbotQuestions,
    chatbotStep,
    sendMessage,
    closeChatbot
  } = useChatbot();
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
    if (chatbotOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatHistory, chatbotOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleOptionClick = (option) => {
    sendMessage(option);
    setInputValue('');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleQuickReplies = () => {
    const currentQuestion = chatbotQuestions[chatbotStep];
    return currentQuestion?.options || [];
  };

  if (!chatbotOpen) return null;

  return (
    <div className="chatbot-overlay">
      <div className="chatbot-container">
        <div className="chatbot-header">
          <div className="chatbot-title">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <h3>Food Preference Assistant</h3>
              <p>Let's find your perfect meal</p>
            </div>
          </div>
          <button className="chatbot-close" onClick={closeChatbot}>
            ×
          </button>
        </div>

        <div className="chatbot-messages">
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`message ${msg.sender}`}
            >
              <div className="message-content">
                {msg.message}
                <div className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {/* Quick Replies */}
          {handleQuickReplies().length > 0 && (
            <div className="quick-replies">
              <p className="quick-replies-label">Quick select:</p>
              <div className="quick-replies-buttons">
                {handleQuickReplies().map((option, index) => (
                  <button
                    key={index}
                    className="quick-reply-btn"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <form className="chatbot-input" onSubmit={handleSendMessage}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your answer or select from options above..."
            disabled={handleQuickReplies().length > 0}
          />
          <button type="submit" disabled={!inputValue.trim()}>
            Send
          </button>
        </form>

        <div className="chatbot-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${((chatbotStep + 1) / chatbotQuestions.length) * 100}%` 
              }}
            />
          </div>
          <div className="progress-text">
            Step {chatbotStep + 1} of {chatbotQuestions.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;