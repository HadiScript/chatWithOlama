import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden bg-gray-900/90 border border-gray-700/50 max-w-full">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
        <span className="text-xs font-medium text-gray-300 uppercase tracking-wide truncate">
          {language || "code"}
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 text-xs bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-md transition-all duration-200 flex-shrink-0"
        >
          {copied ? (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content - responsive */}
      <pre className="overflow-x-auto p-3 sm:p-4 text-xs sm:text-sm leading-relaxed max-w-full">
        <code className="text-gray-100 font-mono whitespace-pre">{code}</code>
      </pre>
    </div>
  );
};

const MessageRenderer = ({ text }) => {
  // Parse markdown code blocks
  const parseMessage = (message) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // Find code blocks
    while ((match = codeBlockRegex.exec(message)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const beforeText = message.slice(lastIndex, match.index);
        parts.push({ type: "text", content: beforeText });
      }

      // Add code block
      parts.push({
        type: "codeblock",
        language: match[1] || "text",
        content: match[2].trim(),
      });

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < message.length) {
      const remainingText = message.slice(lastIndex);
      parts.push({ type: "text", content: remainingText });
    }

    return parts.length > 0 ? parts : [{ type: "text", content: message }];
  };

  const renderTextWithInlineCode = (text) => {
    const inlineCodeRegex = /`([^`]+)`/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = inlineCodeRegex.exec(text)) !== null) {
      // Add text before inline code
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add inline code
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 bg-gray-800/60 text-gray-200 rounded text-sm font-mono"
        >
          {match[1]}
        </code>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : [text];
  };

  const parsedContent = parseMessage(text);

  return (
    <div>
      {parsedContent.map((part, index) => {
        if (part.type === "codeblock") {
          return (
            <CodeBlock
              key={index}
              code={part.content}
              language={part.language}
            />
          );
        } else {
          // Handle text with inline code
          const textWithInlineCode = renderTextWithInlineCode(part.content);
          return (
            <span key={index} className="whitespace-pre-wrap">
              {textWithInlineCode}
            </span>
          );
        }
      })}
    </div>
  );
};

const TypingAnimation = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, 20 + Math.random() * 30);

      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, onComplete]);

  // Pre-render the full text invisibly to maintain consistent height
  return (
    <div ref={containerRef} className="relative">
      {/* Invisible full text to maintain layout */}
      <div className="invisible whitespace-pre-wrap" aria-hidden="true">
        <MessageRenderer text={text} />
      </div>

      {/* Visible typing text */}
      <div className="absolute inset-0">
        <span className="whitespace-pre-wrap">
          <MessageRenderer text={displayedText} />
          {currentIndex < text.length && (
            <span className="inline-block w-0.5 h-4 ml-1 bg-gradient-to-t from-cyan-400 to-blue-500 animate-pulse neon-glow" />
          )}
        </span>
      </div>
    </div>
  );
};

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! Welcome to ChatWithOlama - your AI assistant powered by Hadi Raza. How can I help you today?",
      isBot: true,
      timestamp: new Date(),
      isTyping: false,
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  useEffect(() => {
    // Only scroll when messages are added/completed, not during typing
    const shouldScroll =
      messages.length > 0 && !messages[messages.length - 1]?.isTyping;
    if (shouldScroll) {
      scrollToBottom();
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isBot: false,
      timestamp: new Date(),
      isTyping: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputMessage;
    setInputMessage("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // http://10.3.15.20:3000/
      const response = await fetch("http://localhost:3000/chat", {
        // const response = await fetch("http://10.3.15.20:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.reply || "Sorry, I couldn't process your request.",
        isBot: true,
        timestamp: new Date(),
        isTyping: true,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting. Please try again later.",
        isBot: true,
        timestamp: new Date(),
        isTyping: true,
      };
      setIsTyping(false);
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTypingComplete = (messageId) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, isTyping: false } : msg
      )
    );
  };

  const cleanTextForExport = (text) => {
    // Remove markdown code blocks and inline code formatting
    return text
      .replace(/```[\w]*\n?([\s\S]*?)```/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;
    const lineHeight = 10;
    const margin = 20;
    const maxWidth = doc.internal.pageSize.width - 2 * margin;

    doc.setFontSize(16);
    doc.text("ChatWithOlama Export", margin, yPosition);
    yPosition += 20;

    doc.setFontSize(10);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    messages.forEach((message) => {
      const sender = message.isBot ? "ChatWithOlama" : "User";
      const timestamp = message.timestamp.toLocaleString();
      const cleanText = cleanTextForExport(message.text);

      // Check if we need a new page
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, "bold");
      doc.text(`${sender} (${timestamp}):`, margin, yPosition);
      yPosition += lineHeight;

      doc.setFont(undefined, "normal");
      doc.setFontSize(10);
      const textLines = doc.splitTextToSize(cleanText, maxWidth);
      textLines.forEach((line) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 5;
    });

    doc.save("chatwitholama-export.pdf");
    setShowExportMenu(false);
  };

  const exportToJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.isBot ? "ChatWithOlama" : "User",
        message: msg.text,
        timestamp: msg.timestamp.toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chatwitholama-export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    const worksheetData = [
      ["Sender", "Message", "Timestamp", "Message Length"],
    ];

    messages.forEach((msg) => {
      const cleanText = cleanTextForExport(msg.text);
      worksheetData.push([
        msg.isBot ? "ChatWithOlama" : "User",
        cleanText,
        msg.timestamp.toLocaleString(),
        cleanText.length,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Chat History");

    // Add summary sheet
    const summaryData = [
      ["Export Summary", ""],
      ["Export Date", new Date().toLocaleString()],
      ["Total Messages", messages.length],
      ["User Messages", messages.filter((m) => !m.isBot).length],
      ["ChatWithOlama Messages", messages.filter((m) => m.isBot).length],
      ["First Message", messages[0]?.timestamp.toLocaleString() || "N/A"],
      [
        "Last Message",
        messages[messages.length - 1]?.timestamp.toLocaleString() || "N/A",
      ],
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(wb, "chatwitholama-export.xlsx");
    setShowExportMenu(false);
  };

  const exportToCSV = () => {
    const csvData = [["Sender", "Message", "Timestamp"]];

    messages.forEach((msg) => {
      const cleanText = cleanTextForExport(msg.text).replace(/"/g, '""'); // Escape quotes
      csvData.push([
        msg.isBot ? "ChatWithOlama" : "User",
        `"${cleanText}"`,
        msg.timestamp.toLocaleString(),
      ]);
    });

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chatwitholama-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportToTXT = () => {
    let content = `ChatWithOlama Export\nExported on: ${new Date().toLocaleString()}\n\n`;

    messages.forEach((msg) => {
      const sender = msg.isBot ? "ChatWithOlama" : "User";
      const timestamp = msg.timestamp.toLocaleString();
      const cleanText = cleanTextForExport(msg.text);

      content += `[${timestamp}] ${sender}:\n${cleanText}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chatwitholama-export.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  return (
    <div
      className="h-screen fixed inset-0 overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Black to Sky Blue Gradient Background */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            background: `
              linear-gradient(135deg,
                #000000 0%,
                #0f1419 20%,
                #1a2332 40%,
                #2d3748 60%,
                #4a90e2 80%,
                #87ceeb 100%
              )
            `,
          }}
        />

        {/* ULTRA DENSE GALAXY STARS */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Create massive amount of stars */}
          {Array.from({ length: 800 }, (_, i) => {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = Math.random() * 2 + 0.5;
            const brightness = Math.random() * 0.8 + 0.2;

            return (
              <div
                key={`star-${i}`}
                className="absolute rounded-full animate-pulse"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: `rgba(255,255,255,${brightness})`,
                  boxShadow: `0 0 ${size}px rgba(255,255,255,${
                    brightness * 0.3
                  })`,
                  opacity: brightness,
                  animationDuration: `${3 + Math.random() * 3}s`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/80 to-purple-500/80 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-light text-white/90">ChatWithOlama</h1>
            </div>

            {/* Export Menu */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-200 hover:scale-105"
                disabled={messages.length === 0}
              >
                <svg
                  className="w-5 h-5 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>

              {/* Export Dropdown */}
              {showExportMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-50">
                  <div className="p-2">
                    <div className="text-xs text-white/60 px-3 py-2 border-b border-white/10 mb-2">
                      Export Chat ({messages.length} messages)
                    </div>

                    <button
                      onClick={exportToPDF}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Export as PDF</span>
                    </button>

                    <button
                      onClick={exportToExcel}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                      <span>Export as Excel</span>
                    </button>

                    <button
                      onClick={exportToCSV}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Export as CSV</span>
                    </button>

                    <button
                      onClick={exportToJSON}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      <span>Export as JSON</span>
                    </button>

                    <button
                      onClick={exportToTXT}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>Export as TXT</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-6 custom-scrollbar"
        >
          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isBot ? "justify-start" : "justify-end"
                } message-slide-in`}
              >
                <div
                  className={`flex max-w-[75%] ${
                    message.isBot ? "flex-row" : "flex-row-reverse"
                  } items-end space-x-3`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 ${
                      message.isBot ? "mr-3" : "ml-3 order-last"
                    }`}
                  >
                    {message.isBot ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/70 to-purple-500/70 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400/70 to-teal-500/70 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative ${
                      message.isBot ? "mr-auto" : "ml-auto"
                    }`}
                  >
                    <div
                      className={`px-5 py-4 rounded-3xl backdrop-blur-md border transition-all duration-200 ${
                        message.isBot
                          ? "bg-white/[0.05] border-white/[0.15] text-white"
                          : "bg-gradient-to-br from-blue-500/80 to-purple-600/80 border-blue-400/30 text-white"
                      }`}
                    >
                      <div className="text-[15px] leading-relaxed">
                        {message.isTyping ? (
                          <TypingAnimation
                            text={message.text}
                            onComplete={() => handleTypingComplete(message.id)}
                          />
                        ) : (
                          <MessageRenderer text={message.text} />
                        )}
                      </div>

                      <div
                        className={`text-xs mt-2 ${
                          message.isBot ? "text-white/60" : "text-white/70"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start message-slide-in">
                <div className="flex items-end space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400/70 to-purple-500/70 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="bg-white/[0.05] backdrop-blur-md border border-white/[0.15] rounded-3xl px-5 py-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-300 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="flex-shrink-0 p-4 sm:p-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end space-x-3 sm:space-x-4">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => {
                    setInputMessage(e.target.value);
                    // Auto-resize textarea
                    const textarea = textareaRef.current;
                    textarea.style.height = "auto";
                    textarea.style.height =
                      Math.min(textarea.scrollHeight, 100) + "px";
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  className="w-full bg-transparent border-0 border-b-2 border-white/30 px-0 py-3 sm:py-4 text-white placeholder-white/50 focus:outline-none focus:border-blue-400/70 resize-none transition-all duration-200 overflow-y-auto custom-scrollbar"
                  rows="1"
                  style={{
                    minHeight: "44px",
                    maxHeight: "100px",
                    fontSize: "16px", // Prevents zoom on iOS
                  }}
                  disabled={isLoading}
                />
                {inputMessage.length > 0 && (
                  <div className="absolute right-0 bottom-1 text-xs text-white/40">
                    {inputMessage.length}
                  </div>
                )}
              </div>

              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-400/80 hover:to-purple-500/80 disabled:from-gray-600/50 disabled:to-gray-700/50 disabled:opacity-50 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-center mt-4 space-y-2">
              <span className="text-xs text-white/40">
                Press Enter to send • Shift+Enter for new line
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-xs text-white/30">By</span>
                <a
                  href="https://hadi-raza.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400/80 hover:text-blue-300 transition-colors duration-200 font-medium"
                >
                  @hadi raza
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
