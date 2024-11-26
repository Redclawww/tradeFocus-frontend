/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("user1");
  const [uploadStatus, setUploadStatus] = useState("");
  const chatContainerRef = useRef(null);
  const [typingMessageId, setTypingMessageId] = useState(null);

  const useTypewriter = (text, speed = 100, messageId) => {
    const [displayedText, setDisplayedText] = useState("");

    useEffect(() => {
      if (messageId !== typingMessageId) return;

      let i = 0;
      const typingEffect = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingEffect);
          setTypingMessageId(null);
        }
      }, speed);

      return () => clearInterval(typingEffect);
    }, [text, speed, messageId, typingMessageId]);

    return displayedText;
  };

  function ChatbotResponse({ content, messageId }) {
    const displayedText = useTypewriter(content, 25, messageId);
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]} // Enable GitHub Flavored Markdown (GFM)
        className="text-sm prose prose-indigo" // Tailwind's prose class for styling
      >
        {messageId === typingMessageId ? displayedText : content}
      </ReactMarkdown>
    );
  }
  useEffect(() => {
    getHistory();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const getHistory = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3000/history/${userId}`
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;

    const newMessage = { role: "user", content: input, id: Date.now() };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput("");

    try {
      const response = await axios.post("http://localhost:3000/chat", {
        message: input,
        userId: userId,
      });

      const assistantMessage = {
        role: "assistant",
        content: response.data.response,
        id: Date.now(),
      };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
      setTypingMessageId(assistantMessage.id);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      setUploadStatus("Uploading...");
      const response = await axios.post(
        "http://localhost:3000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setUploadStatus(response.data.message);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadStatus("Error uploading file.");
    }
  };

  return (
    <div className="relative flex justify-center items-center h-screen overflow-hidden">
      <video
        src="/bg2.mp4"
        autoPlay
        muted
        loop
        className="absolute w-full h-full object-cover"
      ></video>
      <div className="relative z-10 w-full max-w-2xl bg-white bg-opacity-90 shadow-xl rounded-lg">
        <div className="flex flex-col h-[80vh]">
          <div className="bg-indigo-600 p-4 rounded-t-lg">
            <h1 className="text-2xl font-bold text-white text-center">
              Chat with TradeFocus
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto p-4" ref={chatContainerRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${
                  message.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <div
                  className={`inline-block p-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-indigo-500"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  {message.role === "user" ? (
                    <p className="text-sm">{message.content}</p>
                  ) : (
                    <ChatbotResponse
                      content={message.content}
                      messageId={message.id}
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.role === "user" ? "You" : "AI"}
                </p>
              </div>
            ))}
          </div>
          <div className="border-t p-4">
            <div className="flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 border rounded-l-lg p-2 text-black focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendMessage}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Send
              </button>
            </div>
            <div className="mt-2 flex items-center">
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-gray-200 text-black px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Upload File
              </label>
              {uploadStatus && (
                <p className="ml-2 text-sm text-black">{uploadStatus}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
