import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";

const AICodeAssistant = ({ editorContent }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const chatContainerRef = useRef(null);
  
  // Initialize Gemini API with API key from environment variable
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to handle copying code
  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    // Set this specific button's state to copied
    setCopiedStates({ ...copiedStates, [index]: true });
    // Reset the button state after 2 seconds
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [index]: false });
    }, 2000);
  };

  // Function to format message content and add copy buttons to code blocks
  const formatMessageContent = (content) => {
    // Split content by code blocks (assuming code blocks are wrapped in ````)
    const parts = content.split(/(```[^`]+```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        // Extract code without the backticks and language identifier
        const code = part.slice(3, -3).replace(/^[a-z]+\n/i, '');
        const isCopied = copiedStates[index];
        
        return (
          <div key={index} className="relative group">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => handleCopyCode(code, index)}
                className={`${
                  isCopied ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                } text-white text-xs px-2 py-1 rounded shadow-lg flex items-center gap-1 transition-colors duration-200`}
              >
                {isCopied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="bg-gray-800 p-3 rounded-lg overflow-x-auto">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <p key={index} className="mb-2">{part}</p>;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      // Create the prompt with context
      const prompt = `You are an AI coding assistant. Current code context:\n${editorContent}\n\nUser question: ${inputMessage}\n\nPlease provide a helpful, clear, and concise response. If the user asks for code, provide well-commented code with explanations. Always wrap code blocks with triple backticks (\`\`\`).`;

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Add AI response to chat
      const aiResponse = {
        role: 'assistant',
        content: text
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please make sure you have set up the VITE_GEMINI_API_KEY in your .env file and try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-800 p-3 rounded-t-lg">
        <h2 className="text-lg font-semibold text-white">AI Code Assistant</h2>
      </div>
      
      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[95%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white font-mono'
              }`}
            >
              {message.role === 'assistant' 
                ? formatMessageContent(message.content)
                : message.content
              }
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white p-3 rounded-lg">
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me anything about your code..."
            className="flex-1 p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg font-medium ${
              isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AICodeAssistant;
